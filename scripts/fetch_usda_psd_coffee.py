#!/usr/bin/env python3
"""USDA FAS PSD coffee (CSV zip, no key) -> data/raw/public/usda-psd-coffee.json: Vietnam production, exports,
ending stocks by marketing year (Oct–Sep; 1000 bags of 60 kg). Also keeps the release month of each row.
Offline: last-good file kept when the download fails.
"""
import csv
import datetime as dt
import io
import json
import subprocess
import sys
import time
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/usda-psd-coffee.json'
URL = 'https://apps.fas.usda.gov/psdonline/downloads/psd_coffee_csv.zip'
PAGE = 'https://apps.fas.usda.gov/psdonline/app/index.html#/app/downloads'
ATTRS = {'Production': 'production', 'Robusta Production': 'robusta', 'Arabica Production': 'arabica', 'Exports': 'exports',
         'Bean Exports': 'bean_exports', 'Ending Stocks': 'ending_stocks', 'Domestic Consumption': 'consumption'}
COUNTRIES = {'Vietnam': 'vietnam', 'Brazil': 'brazil', 'Indonesia': 'indonesia', 'World': 'world'}


def download():
    last = None
    for i in range(3):
        try:
            return subprocess.run(['curl', '-sfL', '-m', '120', URL], check=True, capture_output=True).stdout
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(5 * (i + 1))
    raise RuntimeError(f'{URL}: {last}')


def main():
    try:
        raw = download()
        z = zipfile.ZipFile(io.BytesIO(raw))
        name = [n for n in z.namelist() if n.lower().endswith('.csv')][0]
        rows = list(csv.DictReader(io.TextIOWrapper(z.open(name), encoding='utf-8-sig')))
    except Exception as e:  # noqa: BLE001
        if OUT.exists():
            print('usda-psd-coffee: kept last-good;', e)
            return 0
        raise
    data = {}
    for r in rows:
        c, a = COUNTRIES.get(r['Country_Name']), ATTRS.get(r['Attribute_Description'])
        if not c or not a:
            continue
        my = int(r['Market_Year'])
        rec = data.setdefault(c, {}).setdefault(str(my), {'market_year': f'{my}/{str(my + 1)[2:]}', 'release': f"{r['Calendar_Year']}-{int(r['Month']):02d}"})
        rec[a] = float(r['Value'])
    out = {'source': 'USDA FAS PSD Online · Coffee', 'url': PAGE, 'file': URL, 'unit': 'nghìn bao 60 kg', 'marketing_year': 'tháng 10 – tháng 9',
           'checked': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {c: [v for _, v in sorted(d.items())] for c, d in data.items()}}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
    vn = out['countries'].get('vietnam', [])
    print('usda-psd-coffee:', len(vn), 'years; latest', vn[-1] if vn else None)
    return 0


if __name__ == '__main__':
    sys.exit(main())
