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
        cls.js = (ROOT / 'Phan-bon/app/fertilizer.js').read_text(encoding='utf-8')

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

    def test_every_chart_has_spec(self):
        charts = set(re.findall(r'data-chart="([^"]+)"', self.html))
        self.assertTrue(charts)
        for c in charts:
            self.assertIn('\n  ' + c + ': (', self.js, c)


if __name__ == '__main__':
    unittest.main()
