"""Combine the verified 2020–Aug 2026 seed with dated EVN 00h snapshots.

Snapshots after the seed's last observation extend it. Snapshots on or before it are
backfills: they replace a seed month only when they cover more days than the seed did
(e.g. 01/2026, where the workbook had 15 of 31 days), never mixed into it.

`yoy` (map + headline on Dien): inflow of each reservoir's latest month with >= MIN_DAYS observed
days, compared only on the same calendar days a year earlier. Prior-year days come from the
workbook daily seed (data/hydro-reservoirs-seed-daily.json, built by build_hydro_reservoirs.py)
or the EVN archive; the prior year must cover >= PRIOR_COVER of those days, otherwise yoy is null.
"""
import calendar
import json
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / 'data' / 'hydro-reservoirs-seed.json'
RAW = ROOT / 'data' / 'raw' / 'evn-reservoirs'
OUT = ROOT / 'data' / 'hydro-reservoirs.js'
DAILY_SEED = ROOT / 'data' / 'hydro-reservoirs-seed-daily.json'
FIELDS = ('level', 'inflow', 'generation', 'spill')
MIN_DAYS = 7        # tháng đang chạy cần ít nhất 7 ngày có số nước về
PRIOR_COVER = 0.8   # năm trước phải có số ở >= 80% các ngày đó

def valid(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0 else None

def daily_obs(daily_path, archives):
    """{reservoir: {YYYY-MM-DD: {'inflow', 'level'}}}: workbook daily seed, then EVN archive (archive wins)."""
    obs = defaultdict(dict)
    if Path(daily_path).exists():
        seed = json.loads(Path(daily_path).read_text(encoding='utf-8'))
        start = date.fromisoformat(seed['from'])
        for name, series in seed['reservoirs'].items():
            for i, (inflow, level) in enumerate(zip(series['inflow'], series['level'])):
                if inflow is not None or level is not None:
                    obs[name][(start + timedelta(days=i)).isoformat()] = {'inflow': inflow, 'level': level}
    for day, rows in archives:
        for row in rows:
            obs[row['reservoir']][day] = {'inflow': valid(row.get('inflow')), 'level': valid(row.get('level'))}
    return obs

def mean(values):
    return sum(values) / len(values)

def same_days_yoy(obs, regions):
    rows = []
    back = lambda d: f'{int(d[:4]) - 1}{d[4:]}'
    for name, days in sorted(obs.items()):
        with_inflow = sorted(d for d, v in days.items() if v['inflow'] is not None)
        months = sorted({d[:7] for d in with_inflow}, reverse=True)
        month = next((m for m in months if sum(d[:7] == m for d in with_inflow) >= MIN_DAYS), None)
        if month is None:
            continue
        current = [d for d in with_inflow if d[:7] == month]
        pairs = [d for d in current if days.get(back(d), {}).get('inflow') is not None]
        row = {'reservoir': name, 'region': regions.get(name), 'month': month, 'from': current[0], 'to': current[-1],
               'days': len(current), 'prior_days': len(pairs), 'inflow': None, 'prior_inflow': None, 'yoy': None, 'dl': None}
        if pairs and len(pairs) >= PRIOR_COVER * len(current):
            now, before = mean([days[d]['inflow'] for d in pairs]), mean([days[back(d)]['inflow'] for d in pairs])
            row.update(inflow=round(now, 3), prior_inflow=round(before, 3),
                       yoy=round((now / before - 1) * 100, 2) if before > 0 else None)
            levels = [d for d in pairs if days[d]['level'] is not None and days[back(d)]['level'] is not None]
            if levels:
                row['dl'] = round(mean([days[d]['level'] for d in levels]) - mean([days[back(d)]['level'] for d in levels]), 3)
        rows.append(row)
    return {'method': f'same calendar days a year earlier; current month needs >= {MIN_DAYS} days, '
                      f'prior year must cover >= {PRIOR_COVER:.0%} of them',
            'month': max((r['month'] for r in rows), default=None), 'rows': rows}

def build(seed_path=SEED, raw_dir=RAW, out=OUT, daily_path=DAILY_SEED):
    data = json.loads(Path(seed_path).read_text(encoding='utf-8'))
    cutoff = data['last_observation']
    indexed = {(r['reservoir'], r['month']): dict(r) for r in data['monthly']}
    backfill = {}
    seen = set()
    latest = cutoff
    archives = []
    for path in sorted(Path(raw_dir).glob('????-??-??.json')) if Path(raw_dir).exists() else []:
        archive = json.loads(path.read_text(encoding='utf-8'))
        day = archive['requested_date']
        if day != path.stem:
            continue
        archives.append((day, archive['rows']))
        target = backfill if day <= cutoff else indexed
        y, m, _ = map(int, day.split('-'))
        ym = day[:7]
        for obs in archive['rows']:
            name = obs['reservoir']
            if (name, day) in seen:
                raise ValueError(f'Duplicate EVN reservoir-day: {name} {day}')
            seen.add((name, day))
            requested = datetime.fromisoformat(day + 'T00:00:00+07:00')
            observed_at = datetime.fromisoformat(obs['evn_time'])
            if abs((observed_at-requested).total_seconds()/3600) > 2 or abs(obs['offset_hours'] - (observed_at-requested).total_seconds()/3600) > 0.001:
                raise ValueError(f'Invalid EVN timestamp: {name} {day}')
            key = (name, ym)
            if key not in target:
                target[key] = {'reservoir':name,'region':obs['region'],'month':ym,'days':0,
                                'expected':calendar.monthrange(y,m)[1], 'exact00':0,
                                **{field:None for field in FIELDS},
                                **{field+'_n':0 for field in FIELDS}}
            row = target[key]
            row['days'] += 1
            row['exact00'] += obs['offset_hours'] == 0
            for field in FIELDS:
                value = obs.get(field)
                if isinstance(value,(int,float)) and value >= 0:
                    n = row[field+'_n']
                    row[field] = round(((row[field] or 0)*n+value)/(n+1),3)
                    row[field+'_n'] = n+1
            latest = max(latest, day)
    for key, row in backfill.items():
        if row['days'] > indexed.get(key, {}).get('days', 0):
            indexed[key] = row
    data['last_observation'] = latest
    data['monthly'] = [indexed[key] for key in sorted(indexed)]
    data['yoy'] = same_days_yoy(daily_obs(daily_path, archives), {row['reservoir']: row['region'] for row in data['monthly']})
    Path(out).write_text('window.HYDRO_RESERVOIRS=' + json.dumps(data,ensure_ascii=False,separators=(',',':')) + ';\n', encoding='utf-8')
    print(f'{len(seen)} archive observations, latest {latest}')

if __name__ == '__main__':
    build()
