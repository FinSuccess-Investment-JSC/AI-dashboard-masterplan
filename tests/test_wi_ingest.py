import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import wi_ingest as wi

NOW = dt.datetime(2026, 10, 6, 8, 0, tzinfo=wi.VN)
SPEC = {'revisable_points': 2, 'overlap_days': 7, 'tool_names': {}, 'files': {
    'series.json': {'parts': [{'kind': 'series', 'path': 'series'}]},
    'aligned.json': {'parts': [{'kind': 'aligned', 'path': 'series', 'dates': 'dates', 'pairs': {'id': 'values', 'yoy_id': 'yoy'}}]},
    'flat.json': {'parts': [{'kind': 'aligned_flat', 'path': 'daily', 'dates': 'dates', 'keep': 3}]},
    'banks.json': {'parts': [{'kind': 'snapshot_rows', 'id_col': 2, 'value_col': 3, 'date_field': 'observation_date'}]},
    'table.json': {'parts': [{'kind': 'table', 'key': ['trading_date'], 'date': 'trading_date'}]},
    'records.json': {'parts': [{'kind': 'records', 'path': 'data', 'key': ['symbol', 'trading_date'], 'date': 'trading_date', 'keep_dates': 2}]},
    'ratio_bank_q.json': {'quarterly': True}}}


def macro(*series):
    return {'data': [{'indicator_id': i, 'time_type': 'daily', 'values': [{'date': d, 'value': v} for d, v in pts]} for i, pts in series], 'meta': {}}


class IngestTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.raw = Path(self.dir.name)
        patcher = patch.object(wi, 'RAW', self.raw)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.addCleanup(self.dir.cleanup)

    def write(self, name, obj):
        (self.raw / name).write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':')))

    def read(self, name):
        return json.loads((self.raw / name).read_text())

    def series_file(self):
        self.write('series.json', {'request': {}, 'fetched_at': 'old', 'series': {'ib_on': {'id': 1, 'values': [
            ['2026-09-10', 1.5], ['2026-09-09', 1.63], ['2026-09-08', 2.49], ['2026-09-05', 3.0]]}}})

    def test_series_adds_new_points_and_logs_recent_revision(self):
        self.series_file()
        res = wi.merge('series.json', [macro((1, [('2026-10-05', 2.0), ('2026-09-10', 1.68), ('2026-09-09', 1.63), ('2026-09-08', 2.49)]))], SPEC, NOW)
        self.assertEqual(res['added'], 1)
        raw = self.read('series.json')
        self.assertEqual(raw['series']['ib_on']['values'][:2], [['2026-10-05', 2.0], ['2026-09-10', 1.68]])
        self.assertEqual(raw['revisions'][0]['old'], 1.5)
        self.assertEqual(raw['fetched_at'], '2026-10-06T08:00:00+07:00')

    def test_old_history_mismatch_is_a_transcription_error_and_writes_nothing(self):
        self.series_file()
        before = (self.raw / 'series.json').read_text()
        with self.assertRaisesRegex(wi.IngestError, 'nghi chép sai'):
            wi.merge('series.json', [macro((1, [('2026-10-05', 2.0), ('2026-09-10', 1.5), ('2026-09-09', 1.63), ('2026-09-08', 2.94)]))], SPEC, NOW)
        self.assertEqual(before, (self.raw / 'series.json').read_text())

    def test_missing_old_point_inside_window_and_no_overlap_are_rejected(self):
        self.series_file()
        with self.assertRaisesRegex(wi.IngestError, 'thiếu'):
            wi.merge('series.json', [macro((1, [('2026-10-05', 2.0), ('2026-09-10', 1.5), ('2026-09-08', 2.49)]))], SPEC, NOW)
        with self.assertRaisesRegex(wi.IngestError, 'không chồng'):
            wi.merge('series.json', [macro((1, [('2026-10-05', 2.0)]))], SPEC, NOW)
        with self.assertRaisesRegex(wi.IngestError, 'Thiếu chỉ tiêu'):
            wi.merge('series.json', [macro((2, [('2026-10-05', 2.0)]))], SPEC, NOW)

    def test_row_endpoint_points_merge_like_get_values(self):
        self.series_file()
        rows = {'data': [{'date': '2026-10-05', 'indicator_id': 1, 'value': 2.0}, {'date': '2026-09-10', 'indicator_id': 1, 'value': 1.5}], 'meta': {}}
        self.assertEqual(wi.merge('series.json', [rows], SPEC, NOW)['added'], 1)

    def test_aligned_arrays_extend_dates_and_keep_yoy(self):
        self.write('aligned.json', {'dates': ['2026-07-01', '2026-06-01'], 'series': {'agri': {'id': 5, 'yoy_id': 6, 'values': [10, 9], 'yoy': [1.5, 1.4]}}})
        wi.merge('aligned.json', [macro((5, [('2026-08-01', 11), ('2026-07-01', 10)]), (6, [('2026-08-01', 1.6), ('2026-07-01', 1.5)]))], SPEC, NOW)
        raw = self.read('aligned.json')
        self.assertEqual(raw['dates'], ['2026-08-01', '2026-07-01', '2026-06-01'])
        self.assertEqual(raw['series']['agri']['values'], [11, 10, 9])
        self.assertEqual(raw['series']['agri']['yoy'], [1.6, 1.5, 1.4])

    def test_flat_arrays_keep_latest_n(self):
        self.write('flat.json', {'daily': {'dates': ['2026-09-11', '2026-09-10', '2026-09-09'], 'sobs_7': [5.9, 5.9, 5.8]}})
        wi.merge('flat.json', [macro((7, [('2026-10-05', 6.0), ('2026-09-11', 5.9), ('2026-09-10', 5.9)]))], SPEC, NOW)
        self.assertEqual(self.read('flat.json')['daily'], {'dates': ['2026-10-05', '2026-09-11', '2026-09-10'], 'sobs_7': [6.0, 5.9, 5.9]})

    def test_snapshot_takes_latest_common_date_and_flags_stale(self):
        self.write('banks.json', {'observation_date': '2026-09-11', 'rows': [['VCB', 'Vietcombank', 1, 5.9], ['ACB', 'ACB', 2, 5.5]]})
        wi.merge('banks.json', [macro((1, [('2026-10-05', 6.0)]), (2, [('2026-10-02', 5.6)]))], SPEC, NOW)
        raw = self.read('banks.json')
        self.assertEqual((raw['observation_date'], raw['rows'][0][3], raw['rows'][1][3], raw['stale_symbols']), ('2026-10-05', 6.0, 5.5, ['ACB']))

    def test_table_requires_columns_and_rejects_old_changes(self):
        self.write('table.json', {'columns': ['trading_date', 'pe'], 'rows': [['2026-09-11', 12.6], ['2026-09-10', 12.5], ['2026-09-09', 12.4]]})
        with self.assertRaisesRegex(wi.IngestError, 'thiếu cột'):
            wi.merge('table.json', [{'data': [{'trading_date': '2026-10-05'}]}], SPEC, NOW)
        with self.assertRaisesRegex(wi.IngestError, 'nghi chép sai'):
            wi.merge('table.json', [{'data': [{'trading_date': d, 'pe': v} for d, v in (('2026-10-05', 13.0), ('2026-09-11', 12.6), ('2026-09-10', 12.5), ('2026-09-09', 12.0))]}], SPEC, NOW)
        wi.merge('table.json', [{'data': [{'trading_date': d, 'pe': v} for d, v in (('2026-10-05', 13.0), ('2026-09-11', 12.7), ('2026-09-10', 12.5), ('2026-09-09', 12.4))]}], SPEC, NOW)
        raw = self.read('table.json')
        self.assertEqual(raw['rows'][:2], [['2026-10-05', 13.0], ['2026-09-11', 12.7]])
        self.assertEqual(len(raw['revisions']), 1)

    def test_records_keep_latest_dates(self):
        self.write('records.json', {'data': [{'symbol': 'VCB', 'trading_date': '2026-09-11', 'pe': 15}, {'symbol': 'VCB', 'trading_date': '2026-09-10', 'pe': 14}]})
        wi.merge('records.json', [{'data': [{'symbol': 'VCB', 'trading_date': d, 'pe': v} for d, v in (('2026-10-05', 16), ('2026-10-02', 15.5), ('2026-09-11', 15))]}], SPEC, NOW)
        self.assertEqual([r['trading_date'] for r in self.read('records.json')['data']], ['2026-10-05', '2026-10-02'])

    def test_compact_table_form_and_rounding_are_understood(self):
        self.series_file()
        compact = {'data': {'cot': ['indicator_id', 'time_type', 'values'], 'dong': [[1, 'daily', [
            {'date': '2026-10-05', 'value': 2.0}, {'date': '2026-09-10', 'value': 1.5}, {'date': '2026-09-09', 'value': 1.6300001}]]]}}
        res = wi.merge('series.json', [compact], SPEC, NOW)
        self.assertEqual((res['added'], res['revisions']), (1, []))
        self.assertTrue(wi.same(7.939563053885948, 7.9396))
        self.assertFalse(wi.same(8.3923904, 8.812))

    def test_hook_captures_accept_revisions_in_settled_history(self):
        self.series_file()
        capture = {'tool': 'mcp__WiMCP__wi_data_macro', 'input': {}, 'response': macro((1, [('2026-10-05', 2.0), ('2026-09-10', 1.5), ('2026-09-09', 1.63), ('2026-09-08', 2.6)]))}
        res = wi.merge('series.json', [capture], SPEC, NOW, strict=False)
        self.assertEqual(res['revisions'][0]['date'], '2026-09-08')

    def test_window_replace_keeps_repeated_identical_events_and_coerces_types(self):
        self.write('table.json', {'columns': ['trading_date', 'pe'], 'rows': [['2026-09-11', 2], ['2026-09-11', 2], ['2026-09-01', 1]]})
        spec = {**SPEC, 'files': {'table.json': {'parts': [{'kind': 'table', 'key': ['trading_date'], 'date': 'trading_date', 'window_replace': True}]}}}
        wi.merge('table.json', [{'data': {'cot': ['trading_date', 'pe'], 'dong': [['2026-09-30', '2'], ['2026-09-30', '2'], ['2026-09-30', '2'], ['2026-09-11', '2'], ['2026-09-11', '2']]}}], spec, NOW)
        self.assertEqual(self.read('table.json')['rows'], [['2026-09-30', 2]] * 3 + [['2026-09-11', 2]] * 2 + [['2026-09-01', 1]])

    def test_capture_matching_distinguishes_calls_on_the_same_tool(self):
        call = {'tool': 'wi_data_macro_forecast', 'action': 'get_data', 'indicator_code': 'GDP_REAL_YOY', 'geo_code': 'VNM', 'from_time': '2026-07-18'}
        cap = lambda code: {'tool': 'mcp__WiMCP__wi_data_macro_forecast', 'input': {'action': 'get_data', 'indicator_code': code, 'geo_code': 'VNM', 'from_time': '2026-07-18'}}
        self.assertTrue(wi.matches(call, cap('GDP_REAL_YOY')))
        self.assertFalse(wi.matches(call, cap('CREDIT_GROWTH_YOY')))
        later = cap('GDP_REAL_YOY'); later['input']['from_time'] = '2026-09-01'
        self.assertFalse(wi.matches(call, later))  # a shorter window cannot verify the overlap

    def test_quarterly_files_are_not_auto(self):
        with self.assertRaisesRegex(wi.IngestError, 'giai đoạn 2'):
            wi.merge('ratio_bank_q.json', [{'data': []}], SPEC, NOW)


class SpecTests(unittest.TestCase):
    def test_every_contract_raw_file_has_an_ingest_rule(self):
        root = Path(__file__).resolve().parents[1]
        contract = json.loads((root / 'data/bank-wi-contract.json').read_text())
        spec = json.loads((root / 'data/bank-wi-ingest.json').read_text())
        names = {n for b in contract['blocks'] for n in wi.block_files(contract, b)}
        self.assertEqual(names - set(spec['files']), set())
        for name, conf in spec['files'].items():
            with self.subTest(name):
                self.assertTrue((root / 'data/raw/wi' / name).exists())
                self.assertTrue(conf.get('parts') or conf.get('manual') or conf.get('quarterly'))

    def test_plan_lists_calls_for_daily_item(self):
        spec = json.loads((Path(__file__).resolve().parents[1] / 'data/bank-wi-ingest.json').read_text())
        out = wi.plan('bank.wi.daily', spec, dt.date(2026, 10, 6))
        auto = [f for f in out if f['auto']]
        self.assertTrue(auto and all(f['calls'] for f in auto))
        for f in auto:
            for call in f['calls']:
                self.assertTrue(call['tool'].startswith('wi_data_'), call)
                self.assertNotIn('fetched_at', call)
                if not spec['files'][f['file']].get('recent_days'):  # overlap is needed to verify old history
                    self.assertLessEqual(call['from_time'], f['last_date'])


if __name__ == '__main__':
    unittest.main()
