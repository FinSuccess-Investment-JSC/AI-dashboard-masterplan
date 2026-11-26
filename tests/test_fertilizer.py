"""Dữ liệu và trang Phân bón (Phan-bon/): khối dữ liệu đủ, thẻ chart khớp registry, quy tắc giá vốn = 0."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class FertilizerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = json.loads((ROOT / 'data/fertilizer-data.json').read_text(encoding='utf-8'))
        cls.html = (ROOT / 'Phan-bon/index.html').read_text(encoding='utf-8')
        cls.js = ''.join(f.read_text(encoding='utf-8') for f in sorted((ROOT / 'Phan-bon/app').glob('fertilizer*.js')))

    def test_series_present(self):
        for k in ('urea', 'dap', 'potash', 'gas_eu', 'brent', 'urea_zce_daily', 'urea_output', 'npk_output'):
            self.assertTrue(self.d['series'][k]['records'], k)

    def test_financial_universe(self):
        fin = self.d['fin']
        self.assertEqual({c['ticker'] for c in fin['companies']}, set(fin['data']))
        n = len(fin['periods'])
        for t, rows in fin['data'].items():
            for k, v in rows.items():
                self.assertEqual(len(v), n, (t, k))
            for c, g, r in zip(rows['cogs'], rows['gross'], rows['revenue']):
                self.assertFalse(c == 0 and (r or 0) > 0, t)

    def test_registry_blocks_built_by_page(self):
        # Mọi block trong registry của Phân bón phải được trang dựng (id nằm trong HTML hoặc trong app/fertilizer.js).
        reg = json.loads((ROOT / 'updates/registry.json').read_text(encoding='utf-8'))
        blocks = [b for i in reg['items'] if i['id'].startswith('fertilizer.') for b in i['where']['blocks']]
        self.assertTrue(blocks)
        for b in blocks:
            self.assertTrue(f"'{b}'" in self.js or f'"{b}"' in self.html, b)

    def test_plants_dataset(self):
        P = self.d['plants']
        ids = {p['id'] for p in P['plants']}
        self.assertGreaterEqual(len(ids), 20)
        for p in P['plants']:
            self.assertTrue(p['sources'], p['id'])
            self.assertTrue(101.8 < p['lon'] < 117.4 and 6.6 < p['lat'] < 23.5, p['id'])
            for x in p['products']:
                # công suất có số thì phải có nguồn hoặc ghi chú cách tính
                if x.get('capacity_kt') is not None:
                    self.assertTrue(x.get('source') or x.get('capacity_note'), (p['id'], x['product']))
        raws = {z['id'] for z in P['raw_regions']}
        for l in P['links']:
            self.assertIn(l['from'], raws); self.assertIn(l['to'], ids); self.assertTrue(l.get('source'))

    def test_finance_module_uses_fertilizer_data(self):
        fin = (ROOT / 'Phan-bon/app/fertilizer-finance.js').read_text(encoding='utf-8')
        self.assertIn('window.FERT_FIN', fin)
        self.assertNotIn('KCN_FIN', fin)
        self.assertIn('window.FERT_FIN', (ROOT / 'data/fertilizer-data.js').read_text(encoding='utf-8')[-200:])

if __name__ == '__main__':
    unittest.main()


class GasSystemTests(unittest.TestCase):
    def test_gas_system_dataset(self):
        # Bản đồ 4.3: mọi đối tượng có tọa độ/tuyến hợp lệ, có nguồn; chế độ doanh nghiệp chỉ trỏ tới id có thật.
        G = json.loads((ROOT / 'data/fertilizer/gas-system.json').read_text(encoding='utf-8'))
        ids = {a['id'] for a in G['assets']} | {p['id'] for p in G['pipelines']}
        self.assertTrue({'fert_dpm', 'fert_dcm'} <= ids)
        for a in G['assets']:
            self.assertTrue(100 < a['lon'] < 121 and 3 < a['lat'] < 26, a['id'])
            self.assertTrue(a['sources'], a['id'])
        for p in G['pipelines']:
            self.assertIn(p['status'], ('operating', 'construction', 'planned'), p['id'])
            self.assertIn(p['gas'], ('domestic', 'lng'), p['id'])
            self.assertGreaterEqual(len(p['path']), 2, p['id'])
            self.assertTrue(p['sources'], p['id'])
        for co in ('DPM', 'DCM'):
            c = G['companies'][co]
            for k in ('existing', 'agreed', 'potential', 'shared'):
                self.assertFalse(set(c[k]) - ids, (co, k))
        base = (ROOT / 'Phan-bon/app/gas-base.js').read_text(encoding='utf-8')
        self.assertIn('Hoàng Sa (Việt Nam)', base)
        self.assertIn('Trường Sa (Việt Nam)', base)

    def test_news_dataset(self):
        # Chủ đề nóng: dữ liệu dựng lại được, mọi sự kiện trỏ tới bài và chủ đề có thật.
        import subprocess, sys
        subprocess.run([sys.executable, str(ROOT / 'scripts/build_fertilizer_news.py')], check=True, capture_output=True)
        js = (ROOT / 'data/fertilizer-news.js').read_text(encoding='utf-8')
        d = json.loads(js[js.index('=') + 1:].strip().rstrip(';'))
        self.assertGreaterEqual(len(d['events']), 10)
        arts = {a['id'] for a in d['articles']}
        for e in d['events']:
            self.assertTrue(set(e['article_ids']) <= arts, e['id'])

