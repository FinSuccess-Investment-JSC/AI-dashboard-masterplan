#!/usr/bin/env python3
"""Fetch quarterly consolidated income-statement items from VNDirect finfo (public).

Writes data/raw/public/fs_<sector>_quarterly_vndirect.json with discrete-quarter values (VND):
21001 net revenue, 23100 gross profit, 23000 profit after tax attributable to parent (modelType 2).
Optional --check <old.json ...>: cells differing >1% from an older snapshot are written as null and
listed under 'nulled' (unconfirmed). Never copies numbers by hand.
"""
import argparse, datetime as dt, json, ssl, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = ('https://api-finfo.vndirect.com.vn/v4/financial_statements'
       '?q=code:{c}~reportType:QUARTER~modelType:2~fiscalDate:gte:{since}&size=5000')
ITEMS = {'revenue': 21001, 'gross_profit': 23100, 'net_income': 23000}
SECTORS = {'power': 'POW,NT2,PPC,QTP,HND,BTP,REE,VSH,CHP,SBA,TMP,SHP,GEG,HDG,TTA,PC1,TV2,GEX'}


def http(url):
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        ctx = ssl.create_default_context()
    for i in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            return json.loads(urllib.request.urlopen(req, timeout=40, context=ctx).read())
        except Exception:
            if i == 2:
                raise
            time.sleep(3)


def fetch(symbol, since):
    out = {}
    for r in http(API.format(c=symbol, since=since))['data']:
        code = int(r['itemCode'])
        if code not in ITEMS.values():
            continue
        y, m = int(r['fiscalDate'][:4]), int(r['fiscalDate'][5:7])
        out.setdefault(f'{y}Q{(m - 1) // 3 + 1}', {})[code] = r['numericValue']
    return {k: {f: v.get(c) for f, c in ITEMS.items()} for k, v in sorted(out.items())}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sector', default='power')
    ap.add_argument('--since', default='2021-01-01')
    ap.add_argument('--check', nargs='*', default=[])
    a = ap.parse_args()
    old = {}
    for f in a.check:  # legacy snapshot used only to flag disagreement, never as a value
        raw = json.loads(Path(f).read_text())
        for call in raw['calls']:
            for vals in call['dong']:
                r = dict(zip(call['cot'], vals))
                old[(r['symbol'], f"{r['year']}Q{r['quarter']}")] = {'revenue': r['is10'], 'gross_profit': r['is20'], 'net_income': r['is62']}
    out = ROOT / 'data/raw/public' / f'fs_{a.sector}_quarterly_vndirect.json'
    keep = json.loads(out.read_text()).get('nulled', []) if out.exists() and not a.check else []
    held = {(n['symbol'], n['period'], n['field']) for n in keep}  # unconfirmed cells stay null across refreshes
    rows, nulled = {}, list(keep)
    for s in SECTORS[a.sector].split(','):
        rows[s] = fetch(s, a.since)
        for k, v in rows[s].items():
            for f in ITEMS:
                if (s, k, f) in held:
                    v[f] = None
            o = old.get((s, k))
            if not o:
                continue
            for f in ITEMS:
                x, y = v[f], o[f]
                if x is None or y is None:
                    continue
                if abs(x - y) > max(abs(y), abs(x)) * 0.01 and abs(x - y) > 1e9 * 0.5:
                    v[f] = None
                    nulled.append({'symbol': s, 'period': k, 'field': f})
        time.sleep(0.3)
    payload = {'captured': dt.date.today().isoformat(), 'source': 'VNDirect finfo · financial_statements (BCTC hợp nhất, quý riêng)',
               'url': API.split('?')[0], 'unit': 'VND', 'items': ITEMS, 'rows': rows, 'nulled': nulled}
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=0) + '\n')
    print(out.relative_to(ROOT), sum(len(v) for v in rows.values()), 'rows,', len(nulled), 'nulled')


if __name__ == '__main__':
    sys.exit(main())
