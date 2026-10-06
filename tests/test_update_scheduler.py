import contextlib
import io
import json
import re
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

from scripts import update_scheduler as us

ROOT = Path(__file__).resolve().parents[1]


def vn(text):
    return datetime.fromisoformat(text).replace(tzinfo=us.VN)


def item(schedule, tier='C', **extra):
    return {'id': 'x', 'tier': tier, 'title': 'X', 'schedule': schedule, **extra}


class ScheduleTests(unittest.TestCase):
    def test_daily_weekdays_skip_weekend(self):
        sched = {'type': 'daily', 'at': '07:45', 'days': 'mon-fri'}
        self.assertEqual(us.last_slot(sched, vn('2026-10-11T09:00')), vn('2026-10-09T07:45'))  # Sunday -> Friday
        self.assertEqual(us.last_slot(sched, vn('2026-10-12T07:00')), vn('2026-10-09T07:45'))  # before Monday slot

    def test_monthly_and_window(self):
        self.assertEqual(us.last_slot({'type': 'monthly', 'days': [6, 12], 'at': '07:45'}, vn('2026-10-20T08:00')), vn('2026-10-12T07:45'))
        season = {'type': 'window', 'every': 'daily', 'at': '07:45', 'windows': [['10-15', '11-15']]}
        self.assertIsNone(us.last_slot(season, vn('2026-10-06T08:00')))
        self.assertEqual(us.last_slot(season, vn('2026-10-20T08:00')), vn('2026-10-20T07:45'))
        winter = {'type': 'window', 'every': 'daily', 'at': '07:45', 'windows': [['12-20', '01-10']]}
        self.assertIsNotNone(us.last_slot(winter, vn('2027-01-05T08:00')))

    def test_due_once_per_slot(self):
        sched = {'type': 'weekly', 'day': 'mon', 'at': '07:45'}
        now = vn('2026-10-12T08:00')
        self.assertTrue(us.is_due(item(sched), {}, {'items': {}}, now, {})[0])
        self.assertFalse(us.is_due(item(sched), {'lastSuccess': '2026-10-12T08:05:00+07:00'}, {'items': {}}, now, {})[0])
        self.assertTrue(us.is_due(item(sched), {'lastSuccess': '2026-10-05T08:05:00+07:00'}, {'items': {}}, now, {})[0])

    def test_watch_item_due_only_with_signal(self):
        done = {'lastSuccess': '2026-10-01T08:00:00+07:00'}
        self.assertFalse(us.is_due(item({'type': 'watch'}), done, {'items': {}}, vn('2026-10-12T08:00'), {})[0])
        self.assertTrue(us.is_due(item({'type': 'watch'}), {**done, 'signals': [{'what': 'new'}]}, {'items': {}}, vn('2026-10-12T08:00'), {})[0])

    def test_first_run_reviews_every_item_once(self):
        due, reason = us.is_due(item({'type': 'watch'}), {}, {'items': {}}, vn('2026-10-07T07:30'), {})
        self.assertTrue(due)
        self.assertIn('lần đầu', reason)
        self.assertFalse(us.is_due(item({'type': 'policy'}, 'A'), {}, {'items': {}}, vn('2026-10-07T07:30'), {})[0])
        self.assertFalse(us.is_due(item({'type': 'watch'}), {'lastAttempt': '2026-10-07T08:10:00+07:00'}, {'items': {}}, vn('2026-10-07T15:30'), {})[0])

    def test_ai_text_follows_data_change_with_minimum_gap(self):
        sched = {'type': 'data', 'sources': ['brent'], 'minDays': 7}
        sources = {'brent': {'changed_at': '2026-10-10T01:00:00+00:00'}}
        now = vn('2026-10-12T08:00')
        self.assertTrue(us.is_due(item(sched, 'D'), {'lastSuccess': '2026-10-01T08:00:00+07:00'}, {'items': {}}, now, sources)[0])
        self.assertFalse(us.is_due(item(sched, 'D'), {'lastSuccess': '2026-10-09T08:00:00+07:00'}, {'items': {}}, now, sources)[0])  # < 7 days
        self.assertFalse(us.is_due(item(sched, 'D'), {'lastSuccess': '2026-10-11T08:00:00+07:00'}, {'items': {}}, vn('2026-10-20T08:00'), sources)[0])  # no change since

    def test_after_items(self):
        state = {'items': {'wi': {'lastSuccess': '2026-10-12T08:30:00+07:00'}}}
        sched = {'type': 'after', 'items': ['wi']}
        self.assertTrue(us.is_due(item(sched, 'D'), {'lastSuccess': '2026-10-05T08:00:00+07:00'}, state, vn('2026-10-12T09:00'), {})[0])
        self.assertFalse(us.is_due(item(sched, 'D'), {'lastSuccess': '2026-10-12T09:00:00+07:00'}, state, vn('2026-10-12T09:10'), {})[0])
        weekly = {'type': 'after', 'items': ['wi'], 'minDays': 7}
        self.assertFalse(us.is_due(item(weekly, 'D'), {'lastSuccess': '2026-10-08T08:00:00+07:00'}, state, vn('2026-10-12T09:00'), {})[0])

    def test_daily_item_is_queued_every_weekday_by_the_0730_job(self):
        # Slot 07:00 precedes the 07:30 job, so a routine success at 08:10 re-arms the next morning.
        sched = {'type': 'daily', 'at': '07:00', 'days': 'mon-fri'}
        self.assertTrue(us.is_due(item(sched, 'B'), {'lastSuccess': '2026-10-12T08:10:00+07:00'}, {'items': {}}, vn('2026-10-13T07:30'), {})[0])
        self.assertFalse(us.is_due(item(sched, 'B'), {'lastSuccess': '2026-10-13T08:10:00+07:00'}, {'items': {}}, vn('2026-10-13T15:30'), {})[0])


class QueueTests(unittest.TestCase):
    def test_enqueue_merges_and_carries_signals(self):
        state = {'items': {'x': {'signals': [{'what': 'BCTC Q3'}]}}, 'watchers': {}, 'queue': []}
        us.enqueue(state, item({'type': 'watch'}), 'watcher', vn('2026-10-12T08:00'))
        us.enqueue(state, item({'type': 'watch'}), 'lịch', vn('2026-10-13T08:00'))
        self.assertEqual(len(state['queue']), 1)
        self.assertEqual(state['queue'][0]['reasons'], ['lịch', 'watcher'])
        self.assertEqual(state['queue'][0]['signals'], [{'what': 'BCTC Q3'}])
        self.assertNotIn('signals', state['items']['x'])

    def test_done_closes_and_fail_flags_stuck(self):
        state = {'items': {}, 'watchers': {}, 'queue': [{'id': 'x'}]}
        for _ in range(us.STUCK_AFTER):
            us.close(state, 'x', False, 'Wi timeout', vn('2026-10-12T08:00'))
        self.assertTrue(state['items']['x']['stuck'])
        self.assertEqual(len(state['queue']), 1)
        us.close(state, 'x', True, 'đã cập nhật', vn('2026-10-13T08:00'))
        self.assertEqual(state['queue'], [])
        self.assertNotIn('stuck', state['items']['x'])
        self.assertEqual(state['items']['x']['lastSuccess'], '2026-10-13T08:00:00+07:00')

    def test_queue_order_puts_untried_items_before_failed_ones(self):
        reg = {'items': [{'id': i, 'tier': t, 'title': i, 'where': {}} for i, t in (('d', 'D'), ('c-failed', 'C'), ('c-new', 'C'), ('b', 'B'))]}
        state = {'items': {'c-failed': {'attempts': 2}}, 'watchers': {},
                 'queue': [{'id': i, 'tier': t, 'title': i, 'since': '2026-10-06T14:00:00+07:00', 'reasons': [], 'signals': []}
                           for i, t in (('d', 'D'), ('c-failed', 'C'), ('c-new', 'C'), ('b', 'B'))]}
        self.assertEqual([q['id'] for q in us.queue_details(reg, state)], ['b', 'c-new', 'c-failed', 'd'])

    def test_broken_feed_reminds_weekly(self):
        reg = {'items': [{'id': 'oil.retail', 'tier': 'A', 'title': 'Giá bán lẻ', 'sources': ['retail_fuel']}]}
        state = {'items': {}, 'watchers': {}, 'queue': []}
        broken = {'retail_fuel': {'status': 'error', 'error': 'row missing'}}
        self.assertEqual(us.a_health(reg, state, vn('2026-10-01T08:00'), broken)[1], [])  # day 0: refresh_release already alerted
        self.assertEqual(len(us.a_health(reg, state, vn('2026-10-02T08:00'), broken)[1]), 1)
        self.assertEqual(us.a_health(reg, state, vn('2026-10-05T08:00'), broken)[1], [])
        self.assertEqual(len(us.a_health(reg, state, vn('2026-10-09T08:00'), broken)[1]), 1)
        us.a_health(reg, state, vn('2026-10-10T08:00'), {'retail_fuel': {'status': 'ok'}})
        self.assertNotIn('brokenSince', state['items']['oil.retail'])


class WatcherTests(unittest.TestCase):
    PAGE = '<a href="/m">Trang chủ</a><a href="/r1">Báo cáo tình hình kinh tế - xã hội tháng 9 năm 2026</a>'

    def test_baseline_then_new_publication_signals_item(self):
        reg = {'watchers': [{'id': 'nso', 'url': 'u', 'match': 'kinh tế'}],
               'items': [{'id': 'oil.vn-production', 'watch': ['nso']}]}
        state = {'items': {}, 'watchers': {}, 'queue': []}
        page = self.PAGE
        fetcher = lambda url: (200, page, '')
        us.run_watchers(reg, state, vn('2026-10-06T08:00'), None, fetcher)
        self.assertNotIn('oil.vn-production', state['items'])
        page += '<a href="/r2">Báo cáo tình hình kinh tế - xã hội tháng 10 năm 2026</a><a href="/x">Tin thể thao rất dài không liên quan gì</a>'
        lines, _ = us.run_watchers(reg, state, vn('2026-11-06T08:00'), None, fetcher)
        signals = state['items']['oil.vn-production']['signals']
        self.assertEqual(len(signals), 1)
        self.assertIn('tháng 10', signals[0]['what'])
        self.assertTrue(lines[0].startswith('🆕'))

    def test_rss_json_list_and_hash_kinds(self):
        rss = ('<rss><channel><title>NSO</title><item><title>Một số nét chính tình hình kinh tế &#8211; xã hội quý III</title>'
               '<link>https://nso/1</link></item><item><title><![CDATA[Chỉ số sản xuất công nghiệp tháng Chín]]></title><link>https://nso/2</link></item></channel></rss>')
        got = us.fingerprints('rss', rss, r'kinh tế\W+xã hội')
        self.assertEqual(list(got.values()), ['Một số nét chính tình hình kinh tế – xã hội quý III — https://nso/1'])
        cafef = json.dumps({'Data': [{'id': 'a', 'Name': 'Báo cáo tài chính hợp nhất quý 2 năm 2026', 'Link': 'x?v=1'},
                                     {'id': 'b', 'Name': 'Báo cáo tài chính công ty mẹ quý 2 năm 2026', 'Link': 'y?v=1'}]})
        spec = {'list': 'Data', 'title': 'Name', 'fields': ['id']}
        first = us.fingerprints('json', cafef, None, spec)
        self.assertEqual(len(first), 2)
        self.assertEqual(first, us.fingerprints('json', cafef.replace('v=1', 'v=2'), None, spec))  # link churn is not news
        vcbs = json.dumps({'data': [{'id': 1, 'name': 'Báo cáo Ngành dầu khí 2H.2026', 'category': {'name': 'Báo cáo ngành'}, 'file': {'name': 'a.pdf'}}]})
        self.assertEqual(list(us.fingerprints('json', vcbs, 'dầu khí', {'list': 'data', 'title': 'name', 'fields': ['id']}).values()), ['Báo cáo Ngành dầu khí 2H.2026'])
        self.assertNotEqual(us.fingerprints('hash', 'PK..v1'), us.fingerprints('hash', 'PK..v2'))

    def test_empty_page_keeps_baseline_and_alerts(self):
        reg = {'watchers': [{'id': 'w', 'url': 'u', 'match': 'kinh tế'}], 'items': []}
        state = {'items': {}, 'watchers': {'w': {'seen': ['old']}}, 'queue': []}
        _, alerts = us.run_watchers(reg, state, vn('2026-10-06T08:00'), None, lambda url: (200, '<html>redesign</html>', ''))
        self.assertEqual(state['watchers']['w']['seen'], ['old'])
        self.assertEqual(len(alerts), 1)
        self.assertEqual(us.run_watchers(reg, state, vn('2026-10-06T15:30'), None, lambda url: (200, '<html></html>', ''))[1], [])
        unrelated = '<a href="/x">Báo cáo ngành dệt may nửa cuối năm 2026</a>'
        state['watchers']['w'].pop('alertedOn')
        self.assertEqual(us.run_watchers(reg, state, vn('2026-10-07T08:00'), None, lambda url: (200, unrelated, ''))[1], [])

    def test_fetch_error_alerts_once_per_day(self):
        reg = {'watchers': [{'id': 'w', 'url': 'u'}], 'items': []}
        state = {'items': {}, 'watchers': {}, 'queue': []}
        fetcher = lambda url: (403, '', 'HTTP 403')
        self.assertEqual(len(us.run_watchers(reg, state, vn('2026-10-06T08:00'), None, fetcher)[1]), 1)
        self.assertEqual(us.run_watchers(reg, state, vn('2026-10-06T15:30'), None, fetcher)[1], [])


class RegistryTests(unittest.TestCase):
    """The registry must cover every non-static data block shown on the dashboards."""

    @classmethod
    def setUpClass(cls):
        cls.reg = json.loads((ROOT / 'updates/registry.json').read_text(encoding='utf-8'))

    def test_schema(self):
        ids = [i['id'] for i in self.reg['items']]
        self.assertEqual(len(ids), len(set(ids)))
        watchers = {w['id'] for w in self.reg['watchers']}
        kinds = {'daily', 'weekly', 'monthly', 'window', 'watch', 'after', 'data', 'policy', 'none'}
        daily = us.source_status()
        for i in self.reg['items']:
            with self.subTest(i['id']):
                self.assertIn(i['tier'], us.TIERS)
                self.assertIn(i['schedule']['type'], kinds)
                self.assertTrue(i.get('title') and i.get('where'))
                self.assertTrue(set(i.get('watch', [])) <= watchers)
                if i['schedule']['type'] == 'after':
                    self.assertTrue(set(i['schedule']['items']) <= set(ids))
                if i['tier'] == 'A':
                    self.assertTrue(i.get('sources') or i.get('job'))
                    self.assertTrue(set(i.get('sources', [])) <= set(daily), i.get('sources'))
                if i['schedule']['type'] == 'data':
                    self.assertTrue(set(i['schedule']['sources']) <= set(daily), i['schedule']['sources'])
                if i['tier'] in ('B', 'C', 'D') and i.get('status') not in ('todo', 'blocked'):
                    self.assertTrue(i.get('how') and i.get('gates'))
                if i['tier'] == 'B':
                    contract = json.loads((ROOT / 'data/bank-wi-contract.json').read_text())['blocks']
                    self.assertTrue(i['wiBlocks'] and set(i['wiBlocks']) <= set(contract))

    def test_every_dashboard_block_is_scheduled(self):
        covered = {b for i in self.reg['items'] for b in i['where'].get('blocks', [])}
        for page in ('Dau-khi', 'Sugar'):
            text = (ROOT / page / 'index.html').read_text(encoding='utf-8')
            for block, kind in re.findall(r'data-block-id="([^"]+)" data-update-kind="([^"]+)"', text):
                with self.subTest(block):
                    self.assertIn(block, covered, f'{page}: {kind} block has no registry item')
        wi = set(json.loads((ROOT / 'data/bank-wi-contract.json').read_text())['blocks'])
        self.assertEqual(wi, {b for i in self.reg['items'] if i['tier'] == 'B' for b in i['wiBlocks']})

    def test_dry_run_writes_nothing(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(us, 'STATE', Path(directory) / 'state.json'), \
                patch.object(us, 'REPORT', Path(directory) / 'last-run.md'):
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(us.main(['--now', '2026-10-12T08:00']), 0)
            self.assertFalse((Path(directory) / 'state.json').exists())


if __name__ == '__main__':
    unittest.main()
