"""Dữ liệu và trang Cao su (Cao-su/): chuỗi P0 đủ, mốc đối soát, quy đổi đơn vị, thẻ chart khớp registry."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RubberTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = json.loads((ROOT / 'data/rubber-data.json').read_text(encoding='utf-8'))
        cls.S = cls.d['series']
        cls.html = (ROOT / 'Cao-su/index.html').read_text(encoding='utf-8')
        cls.js = ''.join(f.read_text(encoding='utf-8') for f in sorted((ROOT / 'Cao-su/app').glob('rubber*.js')))

    def v(self, k, d):
        return next((r['value'] for r in self.S[k]['records'] if r['date'] == d), None)

    def test_p0_series_present(self):
        for k in ('wb_tsr20', 'wb_rss3', 'vn_svr10', 'th_str20', 'my_smr20', 'id_sir20', 'exp_q', 'exp_v', 'exp_px', 'shfe_ru', 'ine_nr'):
            self.assertTrue(self.S[k]['records'], k)

    def test_reconciliation_points(self):
        # Mốc đối soát của đề bài (26/11/2026).
        self.assertAlmostEqual(self.v('wb_tsr20', '2026-10'), 2.55, places=2)
        self.assertAlmostEqual(self.v('wb_rss3', '2026-10'), 2.83, places=2)
        self.assertAlmostEqual(self.v('vn_svr10', '2026-11-26'), 261.0, places=1)
        self.assertAlmostEqual(self.v('my_smr20', '2026-11-25'), 236.80, places=2)
        self.assertAlmostEqual(self.v('exp_q', '2026-10'), 147.0, delta=0.1)
        self.assertAlmostEqual(self.v('exp_px', '2026-10'), 2370, delta=2)
        yq = self.v('exp_q', '2026-10') / self.v('exp_q', '2025-10') - 1
        self.assertAlmostEqual(yq * 100, -21.6, delta=0.15)

    def test_unit_price_is_value_over_quantity(self):
        for r in self.S['exp_px']['records']:
            v, q = self.v('exp_v', r['date']), self.v('exp_q', r['date'])
            self.assertAlmostEqual(r['value'], v * 1e6 / (q * 1000), delta=1.0, msg=r['date'])

    def test_svr_spread_only_full_days(self):
        idx = {k: {r['date'] for r in self.S[k]['records']} for k in ('vn_svr10', 'th_str20', 'id_sir20', 'my_smr20')}
        for r in self.S['svr_spread']['records']:
            self.assertTrue(all(r['date'] in s for s in idx.values()), r['date'])

    def test_dpr_monthly_checkpoint(self):
        m = {r['period']: r for r in self.d['dpr_monthly']['months']}['2026-10']
        self.assertAlmostEqual(m['sold_t'], 1218.71, places=2)
        self.assertAlmostEqual(m['asp_published_mvnd_per_t'], 64.57, places=2)
        for r in self.d['dpr_monthly']['months']:
            self.assertTrue(r['source_url'], r['period'])

    def test_financial_universe(self):
        fin = self.d['fin']
        self.assertEqual({c['ticker'] for c in fin['companies']}, set(fin['data']))
        n = len(fin['periods'])
        for t, rows in fin['data'].items():
            for k, v in rows.items():
                self.assertEqual(len(v), n, (t, k))

    def test_registry_blocks_built_by_page(self):
        reg = json.loads((ROOT / 'updates/registry.json').read_text(encoding='utf-8'))
        blocks = [b for i in reg['items'] if i['id'].startswith('rubber.') for b in i['where']['blocks']]
        self.assertTrue(blocks)
        for b in blocks:
            self.assertTrue(f"'{b}'" in self.js or f'"{b}"' in self.html, b)

    def test_finance_module_uses_rubber_data(self):
        fin = (ROOT / 'Cao-su/app/rubber-finance.js').read_text(encoding='utf-8')
        self.assertIn('window.RUBBER_FIN', fin)
        self.assertNotIn('FERT_FIN', fin)


if __name__ == '__main__':
    unittest.main()


class RubberNewsTests(unittest.TestCase):
    def test_news_dataset(self):
        # Chủ đề nóng: bài https có ngày, sự kiện trỏ tới bài và chủ đề có thật, link dữ liệu dạng [nhãn, link].
        d = json.loads((ROOT / 'data/rubber/news.json').read_text(encoding='utf-8'))
        arts, topics = {a['id'] for a in d['articles']}, {t['id'] for t in d['topics']}
        self.assertGreaterEqual(len(d['events']), 20)
        for a in d['articles']:
            self.assertTrue(a['url'].startswith('https://'), a['id'])
        for e in d['events']:
            self.assertTrue(set(e['article_ids']) <= arts and set(e['topic_ids']) <= topics, e['id'])
        self.assertIn('window.RUBBER_NEWS', (ROOT / 'data/rubber-news.js').read_text(encoding='utf-8')[:200])
        self.assertIn('id="cs-news"', (ROOT / 'Cao-su/index.html').read_text(encoding='utf-8'))
