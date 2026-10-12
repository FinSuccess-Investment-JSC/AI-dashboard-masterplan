"""Capture EVN reservoir observations around Vietnam midnight.

EVN serves any past instant through ?td=DD/MM/YYYY HH:MM, so a run at any hour can
capture (or backfill) the 00:00 snapshot of earlier days. EVN times out requests from
GitHub-hosted runners, so this runs from a machine in Vietnam. A failed fetch leaves
existing data untouched.
"""
import argparse
import json
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

URL = 'https://hochuathuydien.evn.com.vn/PageHoChuaThuyDienEmbedEVN.aspx'
ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data' / 'raw' / 'evn-reservoirs'
TZ = ZoneInfo('Asia/Ho_Chi_Minh')
FIELDS = {'level': 2, 'inflow': 5, 'spill': 7, 'generation': 8}

def number(text):
    text = text.strip().replace(',', '')
    try:
        value = float(text)
        return value if value >= 0 else None
    except ValueError:
        return None

def parse(html, requested):
    table = BeautifulSoup(html, 'html.parser').select_one('table.tblgridtd')
    if table is None:
        raise ValueError('EVN reservoir table missing')
    region = None
    rows = []
    for tr in table.select('tr'):
        cells = tr.find_all(['td', 'th'], recursive=False)
        if len(cells) == 1:
            region = cells[0].get_text(' ', strip=True)
            continue
        if len(cells) != 11 or cells[0].name != 'td':
            continue
        label = cells[0].find('b')
        if not label or not region:
            continue
        name = label.get_text(' ', strip=True)
        if name.upper() == 'KHE BỐ':
            name = 'Khe Bố'
        match = re.fullmatch(r'(\d{2})/(\d{2})\s+(\d{2}):(\d{2})', cells[1].get_text(' ', strip=True))
        if not match:
            continue
        day, month, hour, minute = map(int, match.groups())
        options = []
        for year in (requested.year - 1, requested.year, requested.year + 1):
            try:
                at = datetime(year, month, day, hour, minute, tzinfo=TZ)
                options.append(at)
            except ValueError:
                pass
        if not options:
            continue
        at = min(options, key=lambda d: abs((d-requested).total_seconds()))
        offset = (at-requested).total_seconds()/3600
        if abs(offset) > 2:
            continue
        values = {key: number(cells[index].get_text(' ',strip=True)) for key,index in FIELDS.items()}
        if all(v is None for v in values.values()):
            continue
        rows.append({'reservoir': name, 'region': region, 'evn_time': at.isoformat(),
                     'offset_hours': offset, **values})
    if len(rows) != len({r['reservoir'] for r in rows}):
        raise ValueError('Duplicate reservoir in EVN response')
    return rows

def fetch(requested):
    td = requested.strftime('%d/%m/%Y %H:%M')
    response = requests.get(URL, params={'td': td, 'vm': '', 'lv': '', 'hc': ''}, timeout=25,
                            headers={'User-Agent':'FinSuccess hydro dashboard/1.0'})
    response.raise_for_status()
    return response.text

def missing_days(start, end):
    """Days in [start, end] without an archive file."""
    day = start
    while day <= end:
        if not (RAW / f'{day.isoformat()}.json').exists():
            yield day
        day += timedelta(days=1)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--html', help='Use saved HTML to inspect parser without publishing')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--date', help='Capture the 00:00 snapshot of this day (YYYY-MM-DD)')
    ap.add_argument('--backfill-from', help='Capture every day from this date to today that has no archive file')
    args = ap.parse_args()
    now = datetime.now(TZ)
    today = now.date()
    if args.backfill_from:
        failed = 0
        for day in missing_days(datetime.fromisoformat(args.backfill_from).date(), today):
            try:
                capture(datetime(day.year, day.month, day.day, tzinfo=TZ), now, dry_run=args.dry_run)
            except (requests.RequestException, ValueError) as exc:
                failed += 1
                print(f'{day}: skipped ({exc})')
            time.sleep(1)
        if failed:
            raise SystemExit(f'{failed} day(s) not captured; rerun to retry')
        return
    day = datetime.fromisoformat(args.date).date() if args.date else today
    requested = datetime(day.year, day.month, day.day, tzinfo=TZ)
    html = Path(args.html).read_text() if args.html else None
    capture(requested, now, html=html, dry_run=args.dry_run or bool(args.html))

def capture(requested, now, html=None, dry_run=False):
    rows = parse(html if html is not None else fetch(requested), requested)
    print(f'{requested.date()}: {len(rows)} valid EVN rows within ±2h of 00:00')
    if dry_run:
        return
    if len(rows) < 15:
        raise ValueError('Too few timely EVN rows; keeping last-good')
    RAW.mkdir(parents=True, exist_ok=True)
    path = RAW / f'{requested.date()}.json'
    existing = json.loads(path.read_text())['rows'] if path.exists() else []
    merged = {r['reservoir']:r for r in existing}
    for row in rows:
        name = row['reservoir']
        if name not in merged or abs(row['offset_hours']) < abs(merged[name]['offset_hours']):
            merged[name] = row
    payload = {'source_url':URL, 'requested_date':requested.date().isoformat(),
               'captured_at':now.isoformat(), 'rows':sorted(merged.values(),key=lambda r:r['reservoir'])}
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
    tmp.replace(path)
    print(f'Saved {path}')

if __name__ == '__main__':
    main()
