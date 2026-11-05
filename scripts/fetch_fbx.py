#!/usr/bin/env python3
"""Freightos Baltic Index (FBX) daily snapshot by lane (Cảng & kho bãi, Vận tải biển dashboards — HAH).

The Freightos FBX terminal page embeds the latest index values as JSON in its HTML:
``{"label":"FBX01","value":"$8,340","change":"-0.33%","positive":false}``. The page shows only the
latest reading, so each run stores today's values and the file grows into a daily series
(same idea as fetch_drewry_wci.py). Lanes kept: FBX01 China/East Asia → North America West Coast,
FBX03 China/East Asia → North America East Coast, FBX11 China/East Asia → North Europe,
FBX13 China/East Asia → Mediterranean, plus the global composite FBX if present. USD/FEU.

    python3 scripts/fetch_fbx.py      # writes data/raw/public/fbx.json
"""
import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/fbx.json'
URL = 'https://www.freightos.com/enterprise/terminal/freightos-baltic-index-global-container-pricing-index/'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
LANES = {'FBX': 'FBX tổng hợp toàn cầu', 'FBX01': 'Trung Quốc/Đông Á → Bờ Tây Bắc Mỹ', 'FBX03': 'Trung Quốc/Đông Á → Bờ Đông Bắc Mỹ',
         'FBX11': 'Trung Quốc/Đông Á → Bắc Âu', 'FBX13': 'Trung Quốc/Đông Á → Địa Trung Hải'}
ITEM = re.compile(r'\{"label":"(FBX\d{0,2})","value":"\$([\d,]+)","change":"([+\-]?[\d.]+)%"')


def parse(text):
    """HTML text -> ({lane: USD/FEU}, {lane: % change}, {lane: quote}); only lanes in LANES, each once."""
    values, changes, quotes = {}, {}, {}
    for m in ITEM.finditer(text):
        lane = m.group(1)
        if lane not in LANES or lane in values:
            continue
        v = int(m.group(2).replace(',', ''))
        if not 100 <= v <= 50000:
            raise ValueError(f'{lane} out of range: {v}')
        values[lane], changes[lane], quotes[lane] = v, float(m.group(3)), m.group(0)
    if not {'FBX01', 'FBX11'} <= set(values):
        raise ValueError('FBX01/FBX11 missing in page')
    return values, changes, quotes


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    days, chg, ev = dict(old.get('days') or {}), dict(old.get('changes') or {}), dict(old.get('quotes') or {})
    raw = subprocess.run(['curl', '-sfL', '--compressed', '-m', '60', '-A', UA, URL], check=True, capture_output=True, text=True).stdout
    values, changes, quotes = parse(raw)
    day = dt.date.today().isoformat()
    days[day], chg[day], ev[day] = values, changes, quotes
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'Freightos Baltic Index (FBX)', 'url': URL, 'unit': 'USD/FEU', 'lanes': LANES,
                               'checked': day, 'note': 'Trang chỉ hiện giá trị mới nhất; ngày = ngày script đọc trang (FBX công bố theo ngày làm việc). '
                               'Cước container của hãng tàu/forwarder, không phải doanh thu cảng.',
                               'days': dict(sorted(days.items())), 'changes': dict(sorted(chg.items())), 'quotes': dict(sorted(ev.items()))},
                              ensure_ascii=False, indent=0) + '\n')
    print(day, values)
    return 0


if __name__ == '__main__':
    sys.exit(main())
