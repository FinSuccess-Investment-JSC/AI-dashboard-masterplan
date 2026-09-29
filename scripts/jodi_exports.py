"""Monthly reported crude exports for two Middle East JODI participants.

Saudi Arabia and Kuwait are shown separately. Other regional exporters have
missing public JODI export observations, so this is never a regional total.
"""
from __future__ import annotations

import csv
import datetime as dt
import hashlib
import io

import requests

BASE = 'https://www.jodidata.org/_resources/files/downloads/oil-data/annual-csv/primary/'
COUNTRIES = {'SA': 'saudi', 'KW': 'kuwait'}
URL = 'https://www.jodidata.org/oil/database/data-downloads.aspx'


def parse_csv(raw: bytes, year: int):
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    required = {'REF_AREA', 'TIME_PERIOD', 'ENERGY_PRODUCT', 'FLOW_BREAKDOWN',
                'UNIT_MEASURE', 'OBS_VALUE', 'ASSESSMENT_CODE'}
    if not required.issubset(reader.fieldnames or []):
        raise ValueError('JODI primary CSV schema changed')
    rows = {}
    for item in reader:
        country = item['REF_AREA']
        if (country not in COUNTRIES or item['ENERGY_PRODUCT'] != 'CRUDEOIL'
                or item['FLOW_BREAKDOWN'] != 'TOTEXPSB'
                or item['UNIT_MEASURE'] != 'KBD'):
            continue
        month = item['TIME_PERIOD']
        if len(month) != 7 or dt.date.fromisoformat(month + '-01').year != year:
            raise ValueError('JODI export period mismatch')
        value = item['OBS_VALUE']
        if value in ('-', 'x', ''):
            continue  # No observation is not zero exports.
        number = float(value)
        if not 0 <= number <= 15_000:
            raise ValueError('JODI export volume out of range')
        quality = item['ASSESSMENT_CODE']
        if quality not in ('1', '2', '3', '4'):
            raise ValueError('Unknown JODI assessment code')
        cell = rows.setdefault(month, {})
        if country in cell:
            raise ValueError('Duplicate JODI country/month observation')
        cell[country] = (number, quality)
    return {month: {'date': month + '-01',
                    'saudi': round(values['SA'][0] / 1000, 4),
                    'kuwait': round(values['KW'][0] / 1000, 4),
                    'saudi_assessment': values['SA'][1],
                    'kuwait_assessment': values['KW'][1]}
            for month, values in rows.items() if set(values) == set(COUNTRIES)}


def load(old_records=None):
    today = dt.date.today()
    archive = []
    fetched_years = set()
    current = {}
    session = requests.Session()
    session.headers.update({'User-Agent': 'FinSuccessDashboard/2.0 (public data research)'})
    for year in (today.year - 1, today.year):
        filename = f'primaryyear{year}.csv' if year == today.year else f'{year}.csv'
        response = session.get(BASE + filename, timeout=90)
        if response.status_code == 404 and year == today.year:
            continue  # January's new annual CSV may not exist yet.
        response.raise_for_status()
        fetched_years.add(year)
        archive.append(response.content)
        current.update(parse_csv(response.content, year))
    retained = {row['date'][:7]: row for row in (old_records or [])
                if int(row['date'][:4]) not in fetched_years}
    retained.update(current)
    records = [retained[month] for month in sorted(retained)]
    if len(records) < 12 or records[-1]['date'][:7] > today.strftime('%Y-%m'):
        raise ValueError('JODI Saudi/Kuwait crude export history incomplete')
    raw = b'\n<!-- JODI YEAR BREAK -->\n'.join(archive)
    return {'source_url': URL, 'source_name': 'JODI Oil',
            'observation_frequency': 'monthly', 'publication_frequency': 'monthly, around the 20th',
            'unit': 'million barrels/day', 'coverage': ['Saudi Arabia', 'Kuwait'],
            'records': records, 'raw_sha256': hashlib.sha256(raw).hexdigest(),
            'method': 'CRUDEOIL / TOTEXPSB / KBD divided by 1000; only months reported by both countries; not the Middle East total'}, raw
