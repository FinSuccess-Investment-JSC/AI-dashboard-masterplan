import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class CompanyQuarterlyTest(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / 'data/company-quarterly.json').read_text())
        self.comparison = {c['symbol']: c for c in json.loads((ROOT / 'data/company-comparison.json').read_text())['companies']}

    def test_series_align_with_quarters(self):
        n = len(self.data['quarters'])
        for c in self.data['companies']:
            for k in ('revenue', 'gross_profit', 'net_income', 'gross_margin', 'net_margin'):
                self.assertEqual(len(c[k]), n, (c['symbol'], k))

    def test_margins_are_ratios_of_the_amounts(self):
        for c in self.data['companies']:
            for rev, gp, ni, gm, nm in zip(c['revenue'], c['gross_profit'], c['net_income'], c['gross_margin'], c['net_margin']):
                if rev:
                    self.assertAlmostEqual(gm, gp / rev * 100, delta=0.01)
                    self.assertAlmostEqual(nm, ni / rev * 100, delta=0.01)

    def test_revenue_matches_independent_snapshot(self):
        """Latest quarter revenue from Wi must agree with the Stock Analysis snapshot used by the table."""
        last = self.data['quarters'][-1]  # e.g. Q2/2026
        q, y = last[1], last[3:]
        for c in self.data['companies']:
            snap = (self.comparison.get(c['symbol']) or {}).get('quarter')
            if c['revenue'][-1] is None or not snap or snap['label'] != f'Q{q} {y}' or not snap['values'].get('revenue'):
                continue  # e.g. CHP: Wi has no recent quarter, declared in the note
            self.assertAlmostEqual(c['revenue'][-1], snap['values']['revenue'], delta=snap['values']['revenue'] * 0.02, msg=c['symbol'])

    def test_history_starts_in_2021(self):
        self.assertEqual(self.data['quarters'][0], 'Q1/2021')
        self.assertEqual(len(self.data['quarters']), 22)

    def test_missing_companies_are_declared(self):
        have = {c['symbol'] for c in self.data['companies']}
        power = {s for s, c in self.comparison.items() if c['sector'] == 'power'}
        self.assertEqual(power - have, {m['symbol'] for m in self.data['missing']})


if __name__ == '__main__':
    unittest.main()
