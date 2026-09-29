"""CFTC disaggregated futures-only managed-money WTI positions."""
from __future__ import annotations

import csv
import datetime as dt
import hashlib
import io
import zipfile

import requests

URL = 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_{year}.zip'
CODE = '067651'
MARKET = 'WTI-PHYSICAL - NEW YORK MERCANTILE EXCHANGE'


def parse_archive(raw: bytes, year: int):
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = [name for name in archive.namelist() if name.lower().endswith('.txt')]
        if len(names) != 1:
            raise ValueError('Unexpected CFTC archive structure')
        reader = csv.DictReader(io.TextIOWrapper(archive.open(names[0]), encoding='latin-1'))
        required = {'CFTC_Contract_Market_Code', 'Market_and_Exchange_Names',
                    'Report_Date_as_YYYY-MM-DD', 'M_Money_Positions_Long_All',
                    'M_Money_Positions_Short_All'}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError('CFTC disaggregated fields missing')
        rows = []
        for row in reader:
            if row['CFTC_Contract_Market_Code'].strip() != CODE:
                continue
            if row['Market_and_Exchange_Names'].strip() != MARKET:
                raise ValueError('CFTC WTI contract identity mismatch')
            date = dt.date.fromisoformat(row['Report_Date_as_YYYY-MM-DD'])
            if date.year != year or date > dt.date.today():
                raise ValueError('CFTC report date mismatch')
            long = int(row['M_Money_Positions_Long_All'].strip())
            short = int(row['M_Money_Positions_Short_All'].strip())
            if min(long, short) < 0 or max(long, short) > 10_000_000:
                raise ValueError('CFTC managed-money position invalid')
            rows.append({'date': date.isoformat(), 'long': long, 'short': short,
                         'net_thousands': round((long - short) / 1000, 3)})
        minimum = 1 if year == dt.date.today().year else 20
        if len(rows) < minimum or len({row['date'] for row in rows}) != len(rows):
            raise ValueError('CFTC WTI history incomplete or duplicated')
        return sorted(rows, key=lambda row: row['date'])


def load():
    now = dt.date.today()
    years = (now.year - 1, now.year)
    raws = []
    records = []
    for year in years:
        response = requests.get(URL.format(year=year), timeout=40,
                                headers={'User-Agent': 'FinSuccessDashboard/2.0 (public data research)'})
        response.raise_for_status()
        raws.append(response.content)
        records.extend(parse_archive(response.content, year))
    records.sort(key=lambda row: row['date'])
    raw = b'\n<!-- CFTC YEAR BREAK -->\n'.join(raws)
    return {'source_url': URL.format(year=now.year), 'source_name': 'CFTC',
            'observation_frequency': 'Tuesday positions', 'publication_frequency': 'usually Friday',
            'unit': 'thousand futures contracts', 'records': records,
            'raw_sha256': hashlib.sha256(raw).hexdigest(),
            'method': 'Disaggregated futures-only, contract 067651, managed-money long minus short'}, raw
