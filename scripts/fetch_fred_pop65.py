#!/usr/bin/env python3
"""Population ages 65+ (% of total), Vietnam — World Bank WDI via FRED (SPPOP65UPTOZSVNM), annual.

    python3 scripts/fetch_fred_pop65.py        # writes data/raw/public/fred-pop65.json

Uses curl like build_sector_public.http(); if FRED cannot be reached the existing file is kept (last-good).
"""
import datetime as dt, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/fred-pop65.json'
SERIES = 'SPPOP65UPTOZSVNM'
URL = f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={SERIES}'
PAGE = f'https://fred.stlouisfed.org/series/{SERIES}'


def parse(csv):
    rows = [l.split(',') for l in csv.strip().splitlines()]
    if rows[0][:2] != ['observation_date', SERIES]:
        raise ValueError('FRED CSV header changed: ' + ','.join(rows[0]))
    recs = [{'date': d, 'value': round(float(v), 3)} for d, v in rows[1:] if v not in ('', '.')]
    if len(recs) < 30 or not all(0 < r['value'] < 40 for r in recs):
        raise ValueError('implausible series')
    return recs


def main():
    try:
        csv = subprocess.run(['curl', '-sfL', '-m', '60', '-A', 'Mozilla/5.0', URL], check=True, capture_output=True, text=True).stdout
        recs = parse(csv)
    except Exception as exc:
        if OUT.exists():
            print(f'FRED unreachable ({exc}); keeping {OUT}', file=sys.stderr)
            return 0
        raise
    OUT.write_text(json.dumps({'source': 'World Bank WDI via FRED', 'url': PAGE, 'csv': URL, 'series': SERIES,
                               'name': 'Dân số từ 65 tuổi trở lên (% tổng dân số), Việt Nam', 'unit': '%', 'time_type': 'annual',
                               'checked': dt.datetime.now().astimezone().isoformat(timespec='seconds'), 'records': recs},
                              ensure_ascii=False, indent=1) + '\n')
    print(f'wrote {OUT}: {len(recs)} rows, latest {recs[-1]}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
