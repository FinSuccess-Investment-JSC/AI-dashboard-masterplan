import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from opinet_cracks import parse_table


def page(kind, rows, unit='$/Bbl'):
    form = 'glopopdVO' if kind == 'product' else 'glopcoilVO'
    body = ''.join('<tr>' + ''.join(f'<td>{cell}</td>' for cell in row) + '</tr>' for row in rows)
    return f'<div>{unit}</div><form id="{form}"><table><tbody id="tbody2">{body}</tbody></table></form>'


class OpinetCrackTests(unittest.TestCase):
    def test_product_and_crude_columns_and_missing_quote(self):
        product = page('product', [
            ['26년09월28일', '147.66', '141.35', '172.10', '177.23', '169.23', '110.83', '95.06'],
            ['26년09월29일', '-', '-', '-', '-', '-', '-', '-']])
        crude = page('crude', [['26년09월28일', '109.50', '105.28', '92.60'],
                               ['26년09월29일', '0', '104.00', '93.00']])
        self.assertEqual(parse_table(product, 'product')['2026-09-28'],
                         {'gasoline_92': 141.35, 'gasoil_10ppm': 177.23})
        self.assertEqual(parse_table(crude, 'crude'), {'2026-09-28': {'dubai': 109.5}})

    def test_reject_wrong_units_and_structure(self):
        with self.assertRaises(ValueError):
            parse_table(page('crude', [['26년09월28일', '109.5']], 'won/liter'), 'crude')
        with self.assertRaises(ValueError):
            parse_table(page('product', [['28/09/2026', '1', '2', '3', '4']]), 'product')


if __name__ == '__main__':
    unittest.main()
