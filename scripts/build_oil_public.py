#!/usr/bin/env python3
"""Monthly Vietnam oil & gas series for the Dầu khí dashboard (26/11/2026).

Reads the raw public files already maintained by the refresh workflow and writes data/oil-public-data.js:
  * Customs (scripts/fetch_customs.py → data/raw/public/customs-monthly.json): imports of petroleum products,
    crude oil, LPG and exports of crude oil — value (USD mn) and quantity (tonnes).
  * NSO (scripts/fetch_nso.py → data/raw/public/nso-monthly.json): output of crude oil, natural gas, LPG and
    petroleum products. Missing keys are skipped (the page hides a chart without data).

    python3 scripts/build_oil_public.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CUS = ROOT / 'data/raw/public/customs-monthly.json'
NSO = ROOT / 'data/raw/public/nso-monthly.json'
OUT = ROOT / 'data/oil-public-data.js'
CUS_KEYS = ['imp_fuel', 'imp_fuel_q', 'imp_crude', 'imp_crude_q', 'imp_lpg', 'imp_lpg_q', 'exp_crude', 'exp_crude_q', 'exp_fuel']
NSO_KEYS = ['crude_output', 'gas_output', 'lpg_output', 'fuel_output']
SINCE = '2022-01'


def pick(path, keys):
    if not path.exists():
        return {}, {}
    d = json.loads(path.read_text())
    s = d.get('series', {})
    files = d.get('files', {})
    return {k: {m: v for m, v in sorted(s[k].items()) if m >= SINCE} for k in keys if s.get(k)}, files


def main():
    cus, cus_files = pick(CUS, CUS_KEYS)
    nso, nso_files = pick(NSO, NSO_KEYS)
    out = {'customs': {'source': 'Cục Hải quan · số liệu thống kê xuất nhập khẩu hằng tháng',
                       'url': 'https://www.customs.gov.vn/index.jsp?pageId=4&cid=1294', 'series': cus,
                       'latest_file': (sorted(cus_files.items())[-1] if cus_files else None)},
           'nso': {'source': 'Cục Thống kê · biểu số liệu kinh tế – xã hội hằng tháng', 'url': 'https://www.nso.gov.vn/',
                   'series': nso, 'latest_file': (sorted(nso_files.items())[-1] if nso_files else None)}}
    OUT.write_text('window.OIL_PUBLIC = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('oil-public', {k: len(v) for k, v in {**cus, **nso}.items()})


if __name__ == '__main__':
    main()
