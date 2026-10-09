"""Combine the verified 2020–Aug 2026 seed with dated EVN 00h snapshots."""
import calendar
import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / 'data' / 'hydro-reservoirs-seed.json'
RAW = ROOT / 'data' / 'raw' / 'evn-reservoirs'
OUT = ROOT / 'data' / 'hydro-reservoirs.js'
FIELDS = ('level', 'inflow', 'generation', 'spill')

def build(seed_path=SEED, raw_dir=RAW, out=OUT):
    data = json.loads(Path(seed_path).read_text())
    cutoff = data['last_observation']
    indexed = {(r['reservoir'], r['month']): dict(r) for r in data['monthly']}
    seen = set()
    latest = cutoff
    for path in sorted(Path(raw_dir).glob('????-??-??.json')) if Path(raw_dir).exists() else []:
        archive = json.loads(path.read_text())
        day = archive['requested_date']
        if day != path.stem or day <= cutoff:
            continue
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
            if key not in indexed:
                indexed[key] = {'reservoir':name,'region':obs['region'],'month':ym,'days':0,
                                'expected':calendar.monthrange(y,m)[1], 'exact00':0,
                                **{field:None for field in FIELDS},
                                **{field+'_n':0 for field in FIELDS}}
            row = indexed[key]
            row['days'] += 1
            row['exact00'] += obs['offset_hours'] == 0
            for field in FIELDS:
                value = obs.get(field)
                if isinstance(value,(int,float)) and value >= 0:
                    n = row[field+'_n']
                    row[field] = round(((row[field] or 0)*n+value)/(n+1),3)
                    row[field+'_n'] = n+1
            latest = max(latest, day)
    data['last_observation'] = latest
    data['monthly'] = [indexed[key] for key in sorted(indexed)]
    Path(out).write_text('window.HYDRO_RESERVOIRS=' + json.dumps(data,ensure_ascii=False,separators=(',',':')) + ';\n')
    print(f'{len(seen)} archive observations, latest {latest}')

if __name__ == '__main__':
    build()
