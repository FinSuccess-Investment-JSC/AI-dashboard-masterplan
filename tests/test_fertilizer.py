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

    def test_registry_blocks_built_by_page(self):
        # Mọi block trong registry của Phân bón phải được trang dựng (id nằm trong HTML hoặc trong app/fertilizer.js).
        reg = json.loads((ROOT / 'updates/registry.json').read_text(encoding='utf-8'))
        blocks = [b for i in reg['items'] if i['id'].startswith('fertilizer.') for b in i['where']['blocks']]
        self.assertTrue(blocks)
        for b in blocks:
            self.assertTrue(f"'{b}'" in self.js or f'"{b}"' in self.html, b)

    def test_finance_module_uses_fertilizer_data(self):
        fin = (ROOT / 'Phan-bon/app/fertilizer-finance.js').read_text(encoding='utf-8')
        self.assertIn('window.FERT_FIN', fin)
        self.assertNotIn('KCN_FIN', fin)
        self.assertIn('window.FERT_FIN', (ROOT / 'data/fertilizer-data.js').read_text(encoding='utf-8')[-200:])

if __name__ == '__main__':
    unittest.main()
