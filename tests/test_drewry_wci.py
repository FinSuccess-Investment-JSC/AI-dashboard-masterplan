import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from fetch_drewry_wci import parse


class DrewryWciTests(unittest.TestCase):
    def test_assessment_text(self):
        text = ('Our detailed assessment for Thursday, 15 Oct 2026 The Drewry World Container Index (WCI), the benchmark '
                'widely referenced by procurement teams, rose 3% to $4,485 per 40ft container, mainly due to Asia-Europe. '
                'rates from Shanghai to Los Angeles inched up 3% to $7,884 per 40ft container, while rates from Shanghai to '
                'New York fell 1% to $10,075 per 40ft container. rates from Shanghai to Rotterdam increased 6% to $3,522 per '
                '40ft container, and those from Shanghai to Genoa grew 7% to $3,945 per 40ft container.')
        day, row, quotes = parse(text)
        self.assertEqual(day, '2026-10-15')
        self.assertEqual(row, {'composite': 4485, 'rotterdam': 3522, 'genoa': 3945, 'los_angeles': 7884, 'new_york': 10075})
        self.assertIn('$4,485', quotes['composite'])

    def test_missing_composite(self):
        with self.assertRaises(ValueError):
            parse('Our detailed assessment for Thursday, 15 Oct 2026 nothing else')


if __name__ == '__main__':
    unittest.main()
