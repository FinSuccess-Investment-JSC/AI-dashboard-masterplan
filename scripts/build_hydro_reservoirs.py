"""Import EVN reservoir snapshots from the user's audit workbook.

Usage: python3 scripts/build_hydro_reservoirs.py INPUT.xlsx [--daily-only]
The workbook is an archive, not a live EVN connection. No missing observations are filled.

Outputs: data/hydro-reservoirs-seed.json (monthly means, all years) and
data/hydro-reservoirs-seed-daily.json (daily inflow/level from DAILY_FROM): the daily file lets
update_hydro_reservoirs.py compare a month in progress with the same days a year earlier.
"""
import calendar
import hashlib
import json
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

from openpyxl import load_workbook

OUT = Path(__file__).resolve().parents[1] / 'data' / 'hydro-reservoirs-seed.json'
DAILY_OUT = OUT.with_name('hydro-reservoirs-seed-daily.json')
FIELDS = {'level': 9, 'inflow': 12, 'spill': 14, 'generation': 15}
DAILY_FIELDS = ('inflow', 'level')
DAILY_FROM = date(2025, 1, 1)  # năm trước của tháng mới nhất; từ 2026 đã có file ngày trong data/raw/evn-reservoirs

def main(path, daily_only=False):
    source = Path(path)
    wb = load_workbook(source, read_only=True, data_only=True)
    rows = defaultdict(lambda: defaultdict(list))
    region = {}
    exact = defaultdict(int)
    observed = defaultdict(set)
    daily = {}
    latest = None
    for r in wb['Du_lieu_ngay'].iter_rows(min_row=2, values_only=True):
        requested, name = r[0], r[3]
        if not isinstance(requested, date) or not name:
            continue
        if not isinstance(r[7], (int, float)) or abs(r[7]) > 2:
            continue
        name = 'Khe Bố' if str(name).lower() == 'khe bố' else str(name)
        ym = requested.strftime('%Y-%m')
        key = (name, ym)
        region[name] = r[2]
        observed[key].add(requested.date().isoformat() if hasattr(requested, 'date') else requested.isoformat())
        exact[key] += r[8] is True
        latest = max(latest, requested.date() if hasattr(requested, 'date') else requested) if latest else (requested.date() if hasattr(requested, 'date') else requested)
        values = {}
        for field, idx in FIELDS.items():
            value = r[idx]
            if isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0:
                rows[key][field].append(float(value))
                values[field] = float(value)
        day = requested.date() if hasattr(requested, 'date') else requested
        if day >= DAILY_FROM:
            prev = daily.get((name, day))
            if prev is None or abs(r[7]) < prev[0]:
                daily[name, day] = (abs(r[7]), values)
    data = []
    for (name, ym), fields in sorted(rows.items()):
        y, m = map(int, ym.split('-'))
        count = len(observed[name, ym])
        expected = calendar.monthrange(y, m)[1]
        entry = {'reservoir': name, 'region': region[name], 'month': ym,
                 'days': count, 'expected': expected, 'exact00': exact[name, ym]}
        for field in FIELDS:
            values = fields[field]
            entry[field] = round(sum(values) / len(values), 3) if values else None
            entry[field + '_n'] = len(values)
        data.append(entry)
    payload = {'source': 'EVN reservoir workbook supplied by user',
               'source_url': 'https://www.evn.com.vn/vi-VN/thong-tin-ho-thuy-dien/Muc-nuoc-cac-ho-thuy-dien-60-123',
               'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
               'last_observation': latest.isoformat(), 'sampling': 'one requested 00:00 snapshot per day; retain only EVN timestamps within two hours of 00:00',
               'monthly': data}
    span = (latest - DAILY_FROM).days + 1
    series = {}
    for (name, day), (_, values) in daily.items():
        entry = series.setdefault(name, {field: [None] * span for field in DAILY_FIELDS})
        for field in DAILY_FIELDS:
            entry[field][(day - DAILY_FROM).days] = values.get(field)
    DAILY_OUT.write_text(json.dumps({'source_sha256': payload['source_sha256'], 'from': DAILY_FROM.isoformat(),
                                     'to': latest.isoformat(), 'fields': list(DAILY_FIELDS),
                                     'note': 'one timely 00:00 EVN value per day, index = days since from; null = none',
                                     'reservoirs': dict(sorted(series.items()))},
                                    ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    if not daily_only:
        OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    from update_hydro_reservoirs import build
    build()
    print(f'{len(region)} reservoirs, {len(data)} reservoir-months, {len(daily)} reservoir-days, latest {latest}, {OUT}')

if __name__ == '__main__':
    # --daily-only: chỉ ghi file ngày, giữ nguyên seed tháng đã kiểm (tránh đổi chữ số làm tròn cuối).
    main(sys.argv[1], daily_only='--daily-only' in sys.argv[2:])
