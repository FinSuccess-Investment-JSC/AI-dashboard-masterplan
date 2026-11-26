"""Dashboard Chăn nuôi heo: kiểm dữ liệu ghép (data/livestock-public-data.json) và kho giá heo."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class LivestockDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = json.loads((ROOT / 'data/livestock-public-data.json').read_text(encoding='utf-8'))
        cls.obs = json.loads((ROOT / 'data/livestock/observations.json').read_text(encoding='utf-8'))['observations']

    def test_hog_prices_are_dong_per_kg_and_sorted(self):
        series = self.d['hog']['series']
        self.assertTrue({'region:bac', 'region:trung', 'region:nam'} <= set(series))
        for k, s in series.items():
            with self.subTest(k):
                dates = [p[0] for p in s['points']]
                self.assertEqual(dates, sorted(dates))
                for d, v in s['points']:
                    self.assertRegex(d, r'^\d{4}-\d{2}-\d{2}$')
                    self.assertTrue(20000 <= v <= 150000, f'{k} {d} {v}: không phải đ/kg?')

    def test_observation_keys_unique_and_traceable(self):
        keys = set()
        for o in self.obs:
            k = '|'.join(str(o.get(x) or '') for x in ('indicator', 'period', 'area', 'scope', 'source'))
            with self.subTest(k):
                self.assertNotIn(k, keys)
                keys.add(k)
                for f in ('indicator', 'period', 'unit', 'url', 'status', 'checked'):
                    self.assertTrue(o.get(f) not in (None, ''), f'thiếu {f}')
                self.assertTrue(o['url'].startswith('http'))

    def test_stock_and_flow_kept_apart(self):
        for o in self.obs:
            if o['indicator'] == 'herd_pig_yoy':
                self.assertRegex(o['period'], r'^\d{4}-\d{2}$')   # số tồn cuối tháng
                self.assertEqual(o['unit'], '%')
            if o['indicator'] == 'pig_output':
                self.assertRegex(o['period'], r'^\d{4}-(Q\d|H1|\d+M|FY)$')  # dòng chảy theo quý / lũy kế
            if o['indicator'] in ('imp_hs0203_t', 'imp_hs0203_usd') and o.get('area') == 'Tổng':
                self.assertRegex(o['period'], r'^\d{4}-(\d{2}|\d+M|Q\d|FY)$')

    def test_import_unit_price_plausible(self):
        t = {o['period']: o['value'] for o in self.obs if o['indicator'] == 'imp_hs0203_t' and o.get('area') == 'Tổng'}
        u = {o['period']: o['value'] for o in self.obs if o['indicator'] == 'imp_hs0203_usd' and o.get('area') == 'Tổng'}
        for p in set(t) & set(u):
            with self.subTest(p):
                self.assertTrue(800 <= u[p] / t[p] <= 6000, f'{p}: {u[p] / t[p]:.0f} USD/tấn — kiểm tấn/nghìn tấn')

    def test_pinksheet_monthly(self):
        for k in ('maize', 'soymeal'):
            pts = self.d['pinksheet']['series'][k]['points']
            self.assertTrue(all(re.fullmatch(r'\d{4}-\d{2}', m) for m, _ in pts))
            self.assertTrue(all(50 < v < 1500 for _, v in pts))


if __name__ == '__main__':
    unittest.main()
