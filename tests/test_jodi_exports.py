import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from jodi_exports import parse_csv


HEADER = 'REF_AREA,TIME_PERIOD,ENERGY_PRODUCT,FLOW_BREAKDOWN,UNIT_MEASURE,OBS_VALUE,ASSESSMENT_CODE\n'


class JodiExportsTests(unittest.TestCase):
    def test_only_matching_crude_exports_and_reported_months(self):
        raw = HEADER + '\n'.join([
            'SA,2026-07,CRUDEOIL,TOTEXPSB,KBD,4124.6129,3',
            'KW,2026-07,CRUDEOIL,TOTEXPSB,KBD,1129.0000,3',
            'AE,2026-07,CRUDEOIL,TOTEXPSB,KBD,9999,3',
            'SA,2026-08,CRUDEOIL,TOTEXPSB,KBD,4000,3',
            'KW,2026-08,CRUDEOIL,TOTEXPSB,KBD,-,3',
            'SA,2026-07,CRUDEOIL,TOTIMPSB,KBD,100,3',
        ])
        rows = parse_csv(raw.encode(), 2026)
        self.assertEqual(list(rows), ['2026-07'])
        self.assertEqual(rows['2026-07']['saudi'], 4.1246)
        self.assertEqual(rows['2026-07']['kuwait'], 1.129)
        self.assertEqual(rows['2026-07']['saudi_assessment'], '3')

    def test_duplicate_and_wrong_year_fail(self):
        item = 'SA,2026-07,CRUDEOIL,TOTEXPSB,KBD,4124,3\n'
        with self.assertRaises(ValueError):
            parse_csv((HEADER + item + item).encode(), 2026)
        with self.assertRaises(ValueError):
            parse_csv((HEADER + item).encode(), 2025)


if __name__ == '__main__':
    unittest.main()
