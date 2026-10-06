import csv
import datetime as dt
import io
import sys
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import update_daily as ud  # noqa: E402


def psd_zip(rows):
    text = io.StringIO()
    w = csv.DictWriter(text, fieldnames=['Commodity_Code', 'Country_Name', 'Market_Year', 'Attribute_Description', 'Unit_Description', 'Value'])
    w.writeheader()
    for r in rows:
        w.writerow(r)
    raw = io.BytesIO()
    with zipfile.ZipFile(raw, 'w') as z:
        z.writestr('psd_sugar.csv', text.getvalue())
    return raw.getvalue()


class SugarFeedTests(unittest.TestCase):
    def test_contracts_roll_after_the_month_before_delivery(self):
        self.assertEqual(ud.sugar_contracts(dt.date(2026, 10, 6))[:2], ['SBH27.NYB', 'SBK27.NYB'])
        self.assertEqual(ud.sugar_contracts(dt.date(2027, 3, 1))[0], 'SBK27.NYB')
        self.assertEqual(ud.sugar_contracts(dt.date(2026, 9, 30))[0], 'SBV26.NYB')

    def test_contract_currency_is_us_cents(self):
        result = {'meta': {'symbol': 'SBH27.NYB', 'currency': 'USX', 'instrumentType': 'FUTURE', 'exchangeTimezoneName': 'America/New_York'},
                  'timestamp': [1759900000 + 86400 * i for i in range(120)],
                  'indicators': {'quote': [{'close': [20.0 + i / 100 for i in range(120)]}]}}
        rows = ud.parse_daily_futures(result, 'SBH27.NYB', dt.date(2026, 2, 6))
        self.assertGreaterEqual(len(rows), 100)

    def test_vietnam_psd_balance(self):
        attrs = {'Beginning Stocks': 400, 'Production': 1350, 'Imports': 820, 'Exports': 60, 'Human Dom. Consumption': 2101, 'Ending Stocks': 426}
        rows = [{'Commodity_Code': '0612000', 'Country_Name': 'Vietnam', 'Market_Year': str(y), 'Attribute_Description': a,
                 'Unit_Description': '(1000 MT)', 'Value': str(v)} for y in range(2010, 2027) for a, v in attrs.items()]
        rows.append({'Commodity_Code': '0612000', 'Country_Name': 'Thailand', 'Market_Year': '2025', 'Attribute_Description': 'Production', 'Unit_Description': '(1000 MT)', 'Value': '10000'})
        with patch.object(ud, 'fetch', return_value=psd_zip(rows)):
            src, _ = ud.load_sugar_vn_balance()
        self.assertEqual(len(src['records']), 17)
        self.assertEqual({k: src['records'][-1][k] for k in ('market_year', 'production', 'end_stock')}, {'market_year': 2026, 'production': 1350.0, 'end_stock': 426.0})
        bad = [dict(r, Unit_Description='(MT)') if r['Country_Name'] == 'Vietnam' else r for r in rows]
        with patch.object(ud, 'fetch', return_value=psd_zip(bad)), self.assertRaises(ValueError):
            ud.load_sugar_vn_balance()

    def test_sugar_falls_back_to_one_listed_contract(self):
        calls = []
        def fake(symbol, unit):
            calls.append(symbol)
            if symbol == 'SB=F':
                raise ValueError('Empty series')
            return ({'symbol': symbol, 'records': [{'date': '2026-10-05', 'value': 20.73}]}, b'')
        with patch.object(ud, 'load_daily_futures', side_effect=fake), patch.object(ud, 'sugar_contracts', return_value=['SBH27.NYB', 'SBK27.NYB']):
            src, _ = ud.load_sugar_futures()
        self.assertEqual(calls, ['SB=F', 'SBH27.NYB'])
        self.assertIn('nearest listed contract SBH27.NYB', src['instrument'])


if __name__ == '__main__':
    unittest.main()
