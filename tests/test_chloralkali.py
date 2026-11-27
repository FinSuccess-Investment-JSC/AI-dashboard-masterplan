"""Dữ liệu và trang Xút – Clo (Xut-clo/): mã HS và đơn vị, đơn giá tính lại từ trị giá/lượng, số FPTS giữ nguyên,
dự án không vào công suất vận hành, khối trên trang khớp registry, tin Chủ đề nóng trỏ đúng bài."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ChloralkaliTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = json.loads((ROOT / 'data/chloralkali-data.json').read_text(encoding='utf-8'))

    def test_hs_codes_and_unit_price(self):
        t = self.d['trade']
        self.assertTrue({'281511', '281512', '280470'} <= set(t['codes']))
        self.assertIn('rắn', t['codes']['281511'])
        self.assertIn('dung dịch', t['codes']['281512'])
        for kind in ('vn_annual', 'vn_monthly', 'mirror_annual', 'p4_vn_annual', 'p4_mirror_annual'):
            for key, r in t[kind].items():
                if r.get('t') and r.get('usd') is not None:
                    self.assertAlmostEqual(r['price'], r['usd'] / r['t'], delta=0.2, msg=(kind, key))
                elif r.get('price') is not None:
                    self.fail((kind, key, 'đơn giá khi thiếu lượng'))

    def test_wits_2022_check(self):
        # WITS 2022, Việt Nam báo cáo: ~61,9 nghìn tấn xút rắn (67,95 triệu USD), ~141,3 nghìn tấn dung dịch.
        a = self.d['trade']['vn_annual']
        self.assertAlmostEqual(a['2022|281511']['t'] / 1000, 61.9, delta=0.1)
        self.assertAlmostEqual(a['2022|281511']['usd'] / 1e6, 67.95, delta=0.05)
        self.assertAlmostEqual(a['2022|281512']['t'] / 1000, 141.3, delta=0.1)

    def test_fpts_snapshot_kept_as_published(self):
        f = self.d['fpts']
        rows = {r['plant']: r['value'] for r in f['capacity_snapshot']['rows']}
        self.assertEqual(sum(v for k, v in rows.items() if k != 'DGC Nghi Sơn'), f['capacity_snapshot']['chart_sums']['existing'])
        self.assertEqual([r[1] for r in f['imports_total']['rows']], [116, 116, 121, 116, 118])
        self.assertIn('chưa xác minh', f['imports_total']['note'])

    def test_projects_not_in_operating_capacity(self):
        js = (ROOT / 'Xut-clo/app/chloralkali.js').read_text(encoding='utf-8')
        self.assertIn("klass(x) !== 'project'", js)
        ns = next(p for p in self.d['plants']['plants'] if p['id'] == 'dgc_nghison')
        self.assertIn('dự kiến', ns['classification'])

    def test_registry_blocks_built_by_page(self):
        reg = json.loads((ROOT / 'updates/registry.json').read_text(encoding='utf-8'))
        src = (ROOT / 'Xut-clo/index.html').read_text(encoding='utf-8') + ''.join(p.read_text(encoding='utf-8') for p in (ROOT / 'Xut-clo/app').glob('chloralkali*.js'))
        blocks = [b for it in reg['items'] if it['id'].startswith('chloralkali.') for b in it['where']['blocks']]
        self.assertTrue(blocks)
        for b in blocks:
            self.assertRegex(src, re.escape(f"'{b}'") + '|' + re.escape(f'"{b}"'), b)

    def test_news_dataset(self):
        js = (ROOT / 'data/chloralkali-news.js').read_text(encoding='utf-8')
        n = json.loads(js[js.index('=') + 1:].strip().rstrip(';'))
        arts, topics = {a['id'] for a in n['articles']}, {t['id'] for t in n['topics']}
        self.assertGreaterEqual(len(n['events']), 10)
        for e in n['events']:
            self.assertTrue(set(e['article_ids']) <= arts, e['id'])
            self.assertTrue(set(e['topic_ids']) <= topics, e['id'])
        for t in n['topics']:
            self.assertEqual(len(t['related_data']), 2, t['id'])


    def test_p4_price_and_export(self):
        # Giá P4 Trung Quốc (Sunsirs qua WiData): ngày tăng dần, CNY/tấn dương; P4 xuất khẩu Việt Nam báo cáo: năm lệch khối lượng để trống.
        p4 = self.d['p4']
        self.assertEqual(p4['unit'], 'CNY/tấn')
        for k in ('quarterly', 'monthly', 'weekly'):
            ds = [r['date'] for r in p4[k]]
            self.assertEqual(ds, sorted(ds), k)
            self.assertTrue(all(r['value'] > 0 for r in p4[k]), k)
        for key, r in self.d['trade']['p4_vn_annual'].items():
            if r.get('price') is not None:
                self.assertLess(r['price'], 20000, key)
        self.assertTrue(self.d['trade']['p4_vn_annual']['2019|280470'].get('weight_suspect'))

    def test_every_js_card_registered(self):
        # Thẻ dựng trong JS (card('xc-..') và dataset.blockId = 'xc-..') phải có mục registry — bắt lỗi mất mục khi gộp xung đột.
        reg = json.loads((ROOT / 'updates/registry.json').read_text(encoding='utf-8'))
        covered = {b for it in reg['items'] for b in it['where'].get('blocks', [])}
        js = (ROOT / 'Xut-clo/app/chloralkali.js').read_text(encoding='utf-8')
        ids = set(re.findall(r"card\('(xc-\d+)'", js)) | set(re.findall(r"blockId = '(xc-\d+)'", js))
        self.assertTrue(ids)
        self.assertFalse(ids - covered, sorted(ids - covered))

if __name__ == '__main__':
    unittest.main()
