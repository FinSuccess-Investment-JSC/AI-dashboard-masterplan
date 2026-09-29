import csv
import datetime as dt
import io
import sys
import unittest
import zipfile
from pathlib import Path

from openpyxl import Workbook

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from steo_capacity import parse_workbook
from cftc_positions import parse_archive


class PeriodicFeedTests(unittest.TestCase):
    def test_steo_pairs_only_months_with_outages(self):
        book = Workbook()
        sheet = book.active
        sheet.title = '3dtab'
        sheet.cell(2, 2, 'U.S. Energy Information Administration  |  Short-Term Energy Outlook  - September 2026')
        sheet.cell(44, 1, 'cops_opec')
        sheet.cell(49, 1, 'padi_OPEC')
        for offset in range(25):
            col = offset + 3
            year, month = 2024 + offset // 12, offset % 12 + 1
            if month == 1:
                sheet.cell(3, col, year)
            sheet.cell(4, col, dt.date(year, month, 1).strftime('%b'))
            sheet.cell(44, col, 2.0)
            sheet.cell(49, col, 1.0 if offset < 24 else '-  ')
        stream = io.BytesIO()
        book.save(stream)
        issue, records = parse_workbook(stream.getvalue())
        self.assertEqual(issue, '2026-09')
        self.assertEqual(len(records), 24)
        self.assertEqual(records[-1]['date'], '2025-12-31')

    def test_cftc_contract_and_net_thousands(self):
        stream = io.StringIO()
        writer = csv.DictWriter(stream, fieldnames=['Market_and_Exchange_Names', 'CFTC_Contract_Market_Code',
                                                    'Report_Date_as_YYYY-MM-DD', 'M_Money_Positions_Long_All',
                                                    'M_Money_Positions_Short_All'])
        writer.writeheader()
        for week in range(20):
            writer.writerow({'Market_and_Exchange_Names': 'WTI-PHYSICAL - NEW YORK MERCANTILE EXCHANGE',
                             'CFTC_Contract_Market_Code': '067651',
                             'Report_Date_as_YYYY-MM-DD': (dt.date(2025, 1, 7) + dt.timedelta(weeks=week)).isoformat(),
                             'M_Money_Positions_Long_All': '223190', 'M_Money_Positions_Short_All': '121362'})
        archive = io.BytesIO()
        with zipfile.ZipFile(archive, 'w') as z:
            z.writestr('f_year.txt', stream.getvalue())
        rows = parse_archive(archive.getvalue(), 2025)
        self.assertEqual(rows[0]['net_thousands'], 101.828)
        self.assertEqual(len(rows), 20)


if __name__ == '__main__':
    unittest.main()
