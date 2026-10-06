import datetime as dt
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from petrolimex_prices import parse_prices, article_links
from polling_policy import due, bank_due, VN


class RetailPolicyTests(unittest.TestCase):
    def test_petrolimex_zone_one_ocr(self):
        ocr = '''Xang sinh hoc E10 RON 95-V Déngllit 28.080 28.640
Xang sinh hoc E10 RON 95-IIl Déngllit 27.080 27.620
Xang sinh hoc E5 RON 92-II Déngllit 26.390 26.910
Diézen 0,05S-II Dongl/lit 30.490 31.090'''
        self.assertEqual(parse_prices(ocr), {'e5': 26390, 'ron95': 27080, 'diesel': 30490})
        with self.assertRaises(ValueError):
            parse_prices(ocr.replace('30.490 31.090', '30.490 34.090'))
        with self.assertRaises(ValueError):
            parse_prices(ocr.replace('Diézen 0,05S-II', 'Dau hỏa'))

    def test_petrolimex_renamed_rows_from_2026_10_01(self):
        # tesseract 5.5 eng output of the 01.10.2026 table: products renamed "... Mức N", E5 read as "ES".
        ocr = '''Mat hang thué GTGT) Vung 1 Vung 2
Xang E10 RON 95 Mitre 5 Déngllit 28.180 28.740
Xang E10 RON 95-IIl Mtrc 3 Déngllit 27.180 27.720
Xang ES RON 92-II Mire 2 Déngllit 26.560 27.090
Diézen 0,001S-V Mtrc 5 Dongllit 31.110 31.730
Diézen 0,05S-Il Mire 2 Dongl/lit 29.710 30.300
Dau hda 2 - K Dongllit 29.770 30.360
Mazut N°2B (3,58) Déng/kg 20.390 20.790'''
        self.assertEqual(parse_prices(ocr), {'e5': 26560, 'ron95': 27180, 'diesel': 29710})
        with self.assertRaisesRegex(ValueError, 'ambiguous: E5'):
            parse_prices(ocr + '\nXang E5 RON 92-II Mire 2 Déngllit 26.560 27.090')
        with self.assertRaisesRegex(ValueError, 'missing or ambiguous: E5'):
            parse_prices(ocr.replace('Xang ES RON 92-II', 'Xang RON 92-II'))
        with self.assertRaisesRegex(ValueError, 'ambiguous: E10'):
            parse_prices(ocr.replace('95 Mitre 5', '95-IIl Mitre 5'))

    def test_notice_date(self):
        html = '<a href="/ndi/thong-cao-bao-chi/ngay-24-9-2026.html">Petrolimex điều chỉnh giá xăng dầu từ 15 giờ 00 phút ngày 24.9.2026</a>'
        self.assertEqual(list(article_links(html)), ['2026-09-24'])

    def test_release_windows_and_repeat_checks(self):
        thu = dt.datetime(2026, 10, 8, 7, 30, tzinfo=VN)
        checked_yesterday = '2026-10-07T00:30:00+00:00'
        self.assertTrue(due('crude_stock', thu, checked_yesterday))
        self.assertFalse(due('crude_stock', thu, thu.astimezone(dt.timezone.utc).isoformat()))
        self.assertTrue(due('crude_stock', thu.replace(hour=15), thu.astimezone(dt.timezone.utc).isoformat()))  # afternoon re-check
        self.assertTrue(due('retail_fuel', thu, checked_yesterday))
        self.assertFalse(due('retail_fuel', thu, thu.astimezone(dt.timezone.utc).isoformat()))
        self.assertTrue(due('retail_fuel', thu + dt.timedelta(hours=8), thu.astimezone(dt.timezone.utc).isoformat()))
        self.assertFalse(due('sugar_producers', thu, checked_yesterday))
        self.assertTrue(due('sugar_producers', thu, None))
        self.assertTrue(bank_due(thu, checked_yesterday))
        self.assertFalse(due('middle_east_crude_exports', thu, checked_yesterday))
        jodi_window = dt.datetime(2026, 10, 20, 7, 30, tzinfo=VN)
        self.assertTrue(due('middle_east_crude_exports', jodi_window, checked_yesterday))


if __name__ == '__main__':
    unittest.main()
