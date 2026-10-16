#!/usr/bin/env python3
"""Month-end settlement prices of Shanghai Futures Exchange (SHFE) contracts from its public daily files.

`https://www.shfe.com.cn/data/tradedata/future/dailydata/kxYYYYMMDD.dat` (JSON, one file per trading day). For each
product the main contract is the delivery month with the largest open interest on that day; the value kept is its
settlement price (CNY/tấn) on the last trading day of each month (the latest available day for the current month).

    python3 scripts/fetch_shfe.py            # writes data/raw/public/shfe-monthly.json
"""
import datetime as dt, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/shfe-monthly.json'
URL = 'https://www.shfe.com.cn/data/tradedata/future/dailydata/kx{d}.dat'
PRODUCTS = {'hc': ('hc_f', 'Thép cuộn cán nóng HRC (SHFE, hợp đồng chính)'), 'rb': ('rb_f', 'Thép thanh vằn (SHFE, hợp đồng chính)'),
            'bu': ('bu_f', 'Nhựa đường (SHFE, hợp đồng chính)'), 'fu': ('fu_f', 'Dầu nhiên liệu (SHFE, hợp đồng chính)')}
SINCE = dt.date(2023, 10, 1)


def day(d):
    try:
        out = subprocess.run(['curl', '-sf', '-m', '30', '-A', 'Mozilla/5.0', URL.format(d=d.strftime('%Y%m%d'))],
                             check=True, capture_output=True, text=True).stdout
        rows = json.loads(out).get('o_curinstrument') or []
    except Exception:
        return None
    res = {}
    for key, (pid, _) in PRODUCTS.items():
        cs = [r for r in rows if r['PRODUCTID'].strip() == pid and str(r['DELIVERYMONTH']).strip().isdigit()
              and isinstance(r.get('SETTLEMENTPRICE'), (int, float)) and r.get('OPENINTEREST')]
        if cs:
            main = max(cs, key=lambda r: r['OPENINTEREST'])
            res[key] = {'value': main['SETTLEMENTPRICE'], 'contract': pid[:-2] + str(main['DELIVERYMONTH']).strip()}
    return res or None


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {'series': {}}
    series = {k: dict(v) for k, v in old.get('series', {}).items()}
    today = dt.date.today()
    m = SINCE
    while m <= today:
        nxt = (m.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
        last = min(nxt - dt.timedelta(days=1), today)
        key = m.strftime('%Y-%m')
        final = nxt - dt.timedelta(days=1) < today
        if not (final and all(key in series.get(p, {}) and series[p][key].get('final') for p in PRODUCTS)):
            d = last
            while d >= m:
                r = day(d)
                if r:
                    for p, v in r.items():
                        series.setdefault(p, {})[key] = {'date': d.isoformat(), **v, 'final': final}
                    break
                d -= dt.timedelta(days=1)
        m = nxt
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'Sở Giao dịch Hợp đồng tương lai Thượng Hải (SHFE) · dữ liệu giao dịch ngày',
                               'url': 'https://www.shfe.com.cn/eng/Market/Futures/', 'names': {k: v[1] for k, v in PRODUCTS.items()},
                               'series': {k: dict(sorted(v.items())) for k, v in series.items()}}, ensure_ascii=False, indent=0) + '\n')
    print({k: (len(v), max(v)) for k, v in series.items()})


if __name__ == '__main__':
    sys.exit(main())
