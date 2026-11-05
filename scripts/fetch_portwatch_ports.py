#!/usr/bin/env python3
"""IMF PortWatch daily port calls for the Vietnamese container gateways (Cảng & kho bãi dashboard).

Reads the ArcGIS table ``Daily_Ports_Data`` on the same host as the chokepoint feed used by
scripts/update_daily.py (same curl call and resultOffset pagination). One query per port:
``where=portid='port434' AND date >= DATE '…'`` with the columns date, portcalls_container,
import_container, export_container, portcalls_tanker. Ports: port434 Hải Phòng, port903 Cái Mép,
port1291 Sài Gòn, port269 Đà Nẵng, port213 Dung Quất. First run backfills from 2023-01-01; later
runs re-read only the last 14 days (PortWatch revises recent AIS days) and append.

    python3 scripts/fetch_portwatch_ports.py      # writes data/raw/public/portwatch-ports.json

Works offline once the file exists: a port whose query fails keeps its stored rows and is listed in
``errors``; the script exits 0 unless every port failed.
"""
import datetime as dt
import json
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/portwatch-ports.json'
API = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Ports_Data/FeatureServer/0/query'
PAGE = 'https://portwatch.imf.org/'
SINCE = '2023-01-01'
OVERLAP_DAYS = 14
PORTS = {'port434': 'Hải Phòng', 'port903': 'Cái Mép', 'port1291': 'Sài Gòn', 'port269': 'Đà Nẵng', 'port213': 'Dung Quất'}
FIELDS = ('portcalls_container', 'import_container', 'export_container', 'portcalls_tanker')


def fetch(url):
    result = subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error', '--max-time', '60', '--retry', '2',
                             '--retry-delay', '2', '--user-agent', 'FinSuccessDashboard/2.0 (public data research)', url],
                            capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors='replace')[:250])
    return result.stdout


def parse(features, portid, today=None):
    """ArcGIS features -> sorted rows {date, portcalls_container, import_container, export_container, portcalls_tanker}."""
    today = today or dt.date.today()
    rows = {}
    for f in features:
        a = f['attributes']
        if a.get('portid') != portid:
            raise ValueError('wrong port in response')
        date = a['date']
        if isinstance(date, (int, float)):
            date = dt.datetime.fromtimestamp(date / 1000, dt.timezone.utc).date().isoformat()
        else:
            date = str(date)[:10]
        if dt.date.fromisoformat(date) > today:
            raise ValueError('future observation')
        row = {'date': date}
        for k in FIELDS:
            v = a.get(k)
            if v is None or isinstance(v, bool) or v < 0:
                raise ValueError(f'invalid {k} on {date}')
            row[k] = round(v) if k.startswith('portcalls') else round(float(v), 1)
        rows[date] = row
    return [rows[d] for d in sorted(rows)]


def query(portid, since):
    features, offset = [], 0
    while True:
        q = {'where': f"portid='{portid}' AND date >= DATE '{since}'", 'outFields': 'date,portid,' + ','.join(FIELDS),
             'orderByFields': 'date ASC', 'resultOffset': offset, 'resultRecordCount': 1000, 'f': 'json'}
        page = json.loads(fetch(API + '?' + urllib.parse.urlencode(q)))
        if 'error' in page:
            raise ValueError('PortWatch: ' + str(page['error']))
        batch = page.get('features', [])
        features.extend(batch)
        if not page.get('exceededTransferLimit'):
            break
        if not batch or offset > 20000:
            raise ValueError('invalid pagination')
        offset += len(batch)
    return parse(features, portid)


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    ports, errors = dict(old.get('ports') or {}), {}
    for portid, name in PORTS.items():
        have = (ports.get(portid) or {}).get('records') or []
        since = SINCE if not have else (dt.date.fromisoformat(have[-1]['date']) - dt.timedelta(days=OVERLAP_DAYS)).isoformat()
        fresh = None
        for attempt in range(3):  # ArcGIS answers 400/56 now and then; retry before keeping last-good rows
            try:
                fresh = query(portid, since)
                break
            except Exception as e:
                errors[portid] = str(e)[:200]
                time.sleep(3 * (attempt + 1))
        if fresh is None:
            continue
        errors.pop(portid, None)
        merged = {r['date']: r for r in have}
        merged.update({r['date']: r for r in fresh})
        ports[portid] = {'name': name, 'records': [merged[d] for d in sorted(merged)]}
    if len(errors) == len(PORTS):
        print('portwatch ports: every query failed', errors, file=sys.stderr)
        return 1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'IMF PortWatch · Daily_Ports_Data (AIS, ước tính)', 'url': PAGE, 'api': API,
                               'checked': dt.date.today().isoformat(), 'since': SINCE,
                               'unit': {'portcalls_container': 'lượt tàu container/ngày', 'import_container': 'tấn (ước tính)',
                                        'export_container': 'tấn (ước tính)', 'portcalls_tanker': 'lượt tàu dầu/ngày'},
                               'method': "ArcGIS query where=portid='…' AND date >= DATE '…'; outFields date,portcalls_container,"
                                         'import_container,export_container,portcalls_tanker; backfill 2023-01-01, then last 14 days re-read.',
                               'ports': ports, 'errors': errors}, ensure_ascii=False, separators=(',', ':')) + '\n')
    for portid, p in ports.items():
        r = p['records']
        print(portid, p['name'], len(r), r[-1]['date'] if r else None, 'ERR ' + errors[portid] if portid in errors else '')
    return 0


if __name__ == '__main__':
    sys.exit(main())
