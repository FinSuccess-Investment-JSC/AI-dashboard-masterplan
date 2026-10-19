#!/usr/bin/env python3
"""Weekly Drewry World Container Index (WCI) snapshots.

Drewry's WCI page shows only the latest Thursday assessment, so each run reads it and adds that week to the stored
history. From the text "Our detailed assessment for Thursday, <d Mon yyyy>": the composite ("The Drewry World
Container Index (WCI) ... rose/fell x% to $n") and four Shanghai lanes (Rotterdam, Genoa, Los Angeles, New York),
USD per 40ft container. The quote for each value is stored as evidence. Weeks before the first run were opened by
hand (20/08 via Hellenic Shipping News, 08/10 and 15/10 on Drewry) and seeded in SEED.

    python3 scripts/fetch_drewry_wci.py      # writes data/raw/public/drewry-wci-weekly.json
"""
import datetime as dt
import html
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/drewry-wci-weekly.json'
URL = 'https://www.drewry.co.uk/supply-chain-advisors/supply-chain-expertise/world-container-index-assessed-by-drewry'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
LANES = {'rotterdam': 'Shanghai to Rotterdam', 'genoa': 'Shanghai to Genoa', 'los_angeles': 'Shanghai to Los Angeles',
         'new_york': 'Shanghai to New York'}
SEED = {'2026-08-20': {'composite': 4526},
        '2026-10-08': {'composite': 4351, 'new_york': 10220, 'los_angeles': 7624, 'genoa': 3696, 'rotterdam': 3337}}


def parse(text):
    date = re.search(r'assessment for \w+, (\d{1,2} \w{3} \d{4})', text)
    comp = re.search(r'World Container Index \(WCI\)[^$]{0,160}?\b(?:to|at) \$([\d,]+)', text)
    if not date or not comp:
        raise ValueError('assessment date or composite missing')
    day = dt.datetime.strptime(date.group(1), '%d %b %Y').date().isoformat()
    row, quotes = {'composite': int(comp.group(1).replace(',', ''))}, {'composite': comp.group(0)}
    for key, name in LANES.items():
        m = re.search(re.escape(name) + r'[^$]{0,60}?\$([\d,]+) per 40ft', text)
        if m:
            row[key], quotes[key] = int(m.group(1).replace(',', '')), m.group(0)
    if not 500 <= row['composite'] <= 20000:
        raise ValueError(f'composite out of range: {row}')
    return day, row, quotes


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    weeks = old.get('weeks') or {d: dict(v) for d, v in SEED.items()}
    raw = subprocess.run(['curl', '-sfL', '--compressed', '-m', '60', '-A', UA, URL], check=True, capture_output=True, text=True).stdout
    text = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<script.*?</script>|<style.*?</style>|<[^>]+>', ' ', raw, flags=re.S)))
    day, row, quotes = parse(text)
    weeks[day] = {**weeks.get(day, {}), **row}
    evidence = old.get('quotes', {})
    evidence[day] = quotes
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'Drewry World Container Index', 'url': URL, 'unit': 'USD/FEU',
                               'checked': dt.date.today().isoformat(), 'weeks': dict(sorted(weeks.items())),
                               'quotes': dict(sorted(evidence.items()))}, ensure_ascii=False, indent=0) + '\n')
    print(day, row)


if __name__ == '__main__':
    main()
