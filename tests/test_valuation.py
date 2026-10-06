import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import update_valuation as uv


def at(text):
    return dt.datetime.fromisoformat(text).replace(tzinfo=uv.VN)


def fake(ratios, prices):
    def fetch(url):
        return {'data': ratios} if 'ratios' in url else {'data': prices}
    return fetch


RATIOS = [{'itemCode': '51006', 'value': 10.0, 'reportDate': '2026-10-05'},
          {'itemCode': '51012', 'value': 2.0, 'reportDate': '2026-10-05'},
          {'itemCode': '51003', 'value': 1.0e12, 'reportDate': '2026-10-05'}]


class ValuationTests(unittest.TestCase):
    def test_session_is_final_after_atc(self):
        row = {'date': '2026-10-06', 'time': '14:46:17'}
        self.assertFalse(uv.closed(row, at('2026-10-06T15:00')))
        self.assertTrue(uv.closed(row, at('2026-10-06T15:30')))
        self.assertFalse(uv.closed({'date': '2026-10-06', 'time': '11:30:00'}, at('2026-10-06T15:30')))
        self.assertTrue(uv.closed({'date': '2026-10-05', 'time': '11:30:00'}, at('2026-10-06T08:00')))

    def test_multiples_follow_the_latest_close(self):
        prices = [{'date': '2026-10-05', 'close': 20.0, 'time': '14:46:00'}, {'date': '2026-10-06', 'close': 22.0, 'time': '14:46:00'}]
        v = uv.value_ticker('PLX', at('2026-10-06T15:30'), fake(RATIOS, prices))
        self.assertEqual((v['date'], v['pe'], v['pb'], v['market_cap']), ('2026-10-06', 11.0, 2.2, 1100.0))
        morning = uv.value_ticker('PLX', at('2026-10-06T08:00'), fake(RATIOS, prices))
        self.assertEqual((morning['date'], morning['pe']), ('2026-10-05', 10.0))  # today's row not final yet

    def test_corporate_action_jump_is_not_scaled(self):
        prices = [{'date': '2026-10-05', 'close': 20.0}, {'date': '2026-10-06', 'close': 10.0, 'time': '14:46:00'}]
        v = uv.value_ticker('PLX', at('2026-10-06T15:30'), fake(RATIOS, prices))
        self.assertEqual((v['date'], v['pe'], v['market_cap']), ('2026-10-05', 10.0, 1000.0))

    def test_missing_ratio_is_an_error(self):
        with self.assertRaises(ValueError):
            uv.value_ticker('PLX', at('2026-10-06T15:30'), fake(RATIOS[:2], [{'date': '2026-10-05', 'close': 20.0}]))

    def test_failed_ticker_keeps_last_good_and_history_accumulates(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_json, out_js = Path(tmp) / 'v.json', Path(tmp) / 'v.js'
            good = {'date': '2026-10-05', 'close': 20.0, 'pe': 10.0, 'pb': 2.0, 'market_cap': 1000.0, 'basis_date': '2026-10-05', 'source_url': 'u'}
            with patch.object(uv, 'OUT_JSON', out_json), patch.object(uv, 'OUT_JS', out_js):
                with patch.object(uv, 'value_ticker', return_value=good):
                    uv.main(['PLX', 'QNS'])
                with patch.object(uv, 'value_ticker', side_effect=lambda s, now: (_ for _ in ()).throw(ValueError('timeout')) if s == 'QNS' else {**good, 'date': '2026-10-06', 'pe': 11.0}):
                    self.assertEqual(uv.main(['PLX', 'QNS']), 0)
            bundle = json.loads(out_json.read_text())
            self.assertEqual(bundle['status'], 'partial')
            self.assertTrue(bundle['companies']['QNS']['last_good'])
            self.assertEqual([r[0] for r in bundle['history']['PLX']], ['2026-10-05', '2026-10-06'])
            self.assertTrue(out_js.read_text().startswith(uv.PREFIX))


if __name__ == '__main__':
    unittest.main()
