#!/usr/bin/env python3
"""10-year Vietnam government bond yield from the HNX yield curve (par yield, %), month-end since 2024.

HNX page https://hnx.vn/vi-vn/trai-phieu/duong-cong-loi-suat.html loads its table from
POST /ModuleReportBonds/Bond_YieldCurve/SearchAndNextPageYieldCurveData (pDate=dd/mm/yyyy). For each month the last
day with a published curve is kept (walking back from month end); the current month keeps the latest day.

Also snapshots Vietcombank's published 12-month VND savings rate (its rate API has no history, so the series starts
on the first run, 17/10/2026, and keeps the latest value of each month).

    python3 scripts/fetch_hnx_yield.py      # writes data/raw/public/hnx-yield-10y.json
"""
import datetime as dt, html, json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/hnx-yield-10y.json'
URL = 'https://hnx.vn/ModuleReportBonds/Bond_YieldCurve/SearchAndNextPageYieldCurveData'
PAGE = 'https://hnx.vn/vi-vn/trai-phieu/duong-cong-loi-suat.html'
SINCE = dt.date(2024, 1, 1)
VCB = 'https://www.vietcombank.com.vn/api/interestrates?accountType=Personal'
VCB_PAGE = 'https://www.vietcombank.com.vn/vi-VN/KHCN/Cong-cu-Tien-ich/KHCN---Lai-suat'


def curve(d):
    try:
        out = subprocess.run(['curl', '-sf', '-m', '30', '-A', 'Mozilla/5.0', '-X', 'POST', '-H', 'X-Requested-With: XMLHttpRequest',
                              '--data', 'pDate=' + d.strftime('%d/%m/%Y'), URL], check=True, capture_output=True, text=True).stdout
    except Exception:
        return None
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', out, re.S)
    for r in rows:
        cells = [html.unescape(re.sub(r'<[^>]+>', '', c)).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>', r, re.S)]
        if cells and re.match(r'^10\s*năm$', cells[0]) and len(cells) >= 3 and cells[2]:
            return float(cells[2].replace(',', '.'))
    return None


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {'records': {}}
    rec = dict(old.get('records', {}))
    today = dt.date.today()
    m = SINCE
    while m <= today:
        nxt = (m.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
        key = m.strftime('%Y-%m')
        final = nxt <= today
        if not (final and key in rec and rec[key].get('final')):
            d = min(nxt - dt.timedelta(days=1), today)
            while d >= m:
                v = curve(d) if d.weekday() < 5 else None
                if v is not None:
                    rec[key] = {'date': d.isoformat(), 'value': v, 'final': final}
                    break
                d -= dt.timedelta(days=1)
        m = nxt
    dep = dict(old.get('deposit_12m', {}).get('records', {}))
    try:
        d = json.loads(subprocess.run(['curl', '-sf', '-m', '30', '-A', 'Mozilla/5.0', VCB], check=True, capture_output=True, text=True).stdout)
        r = next(x for x in d['Data'] if x['currencyCode'] == 'VND' and x['tenorType'] == 'Savings' and x['tenor'] == '12-months')
        dep[today.strftime('%Y-%m')] = {'date': d['UpdatedDate'][:10], 'value': round(r['rates'] * 100, 3)}
    except Exception as e:
        print('vcb', e)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'HNX · đường cong lợi suất TPCP (par yield 10 năm)', 'url': PAGE,
                               'records': dict(sorted(rec.items())),
                               'deposit_12m': {'source': 'Vietcombank · lãi suất tiết kiệm cá nhân 12 tháng (VND)', 'url': VCB_PAGE,
                                               'records': dict(sorted(dep.items()))}}, ensure_ascii=False, indent=0) + '\n')
    print(len(rec), list(rec.items())[-2:])


if __name__ == '__main__':
    main()
