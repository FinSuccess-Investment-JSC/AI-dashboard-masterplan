#!/usr/bin/env python3
"""Tải BCTC hợp nhất (năm + quý) của 5 mã ngành Ô tô – Xe máy từ VNDirect finfo (công khai) cho sub-tab
Tổng quan › Mô hình kiếm tiền (O-to-xe-may/).

  python scripts/fetch_auto_financials.py [--since 2019-01-01] && python scripts/build_auto_model.py

Ghi data/raw/public/fs_auto_full_vndirect.json: {captured, source, url, unit, annual: {mã: {năm: {mã khoản mục: giá trị}}},
quarter: {mã: {kỳ: {...}}}, stale}. Giá trị đúng như nguồn (đồng); không điền số thiếu. Mã lỗi tải giữ bản trước, ghi vào 'stale'.
"""
import argparse, datetime as dt, json, ssl, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from auto_fin_items import ITEMS, TICKERS  # noqa: E402

API = ('https://api-finfo.vndirect.com.vn/v4/financial_statements'
       '?q=code:{c}~reportType:{r}~modelType:{m}~fiscalDate:gte:{since}&size=9999')
OUT = ROOT / 'data/raw/public/fs_auto_full_vndirect.json'


def http(url):
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        ctx = ssl.create_default_context()
    for i in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            return json.loads(urllib.request.urlopen(req, timeout=60, context=ctx).read())
        except Exception:
            if i == 2:
                raise
            time.sleep(3)


def period(date, report):
    y, m = int(date[:4]), int(date[5:7])
    return f'{y}Q{(m - 1) // 3 + 1}' if report == 'QUARTER' else str(y)


def fetch(symbol, since):
    codes = {m: {it['code'] for it in ITEMS if it['model'] == m} for m in (1, 2, 3)}
    out = {'ANNUAL': {}, 'QUARTER': {}}
    for rep in out:
        for m in (1, 2, 3):
            for r in http(API.format(c=symbol, r=rep, m=m, since=since))['data']:
                c = int(r['itemCode'])
                if c in codes[m] and r.get('numericValue') is not None:
                    out[rep].setdefault(period(r['fiscalDate'], rep), {})[str(c)] = r['numericValue']
            time.sleep(0.2)
    return dict(sorted(out['ANNUAL'].items())), dict(sorted(out['QUARTER'].items()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--since', default='2019-01-01')
    a = ap.parse_args()
    old = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    annual, quarter, stale = {}, {}, []
    for t in TICKERS:
        try:
            annual[t], quarter[t] = fetch(t, a.since)
            if not annual[t]:
                raise ValueError('không có dữ liệu năm')
        except Exception as e:  # giữ bản trước, không ghi đè bằng dữ liệu lỗi
            if t in old.get('annual', {}):
                annual[t], quarter[t] = old['annual'][t], old.get('quarter', {}).get(t, {})
            stale.append({'ticker': t, 'error': str(e)[:200]})
        print(t, len(annual.get(t, {})), 'năm', len(quarter.get(t, {})), 'quý', file=sys.stderr)
    payload = {'captured': dt.date.today().isoformat(), 'source': 'VNDirect finfo · financial_statements (BCTC hợp nhất; năm, quý)',
               'url': API.split('?')[0], 'unit': 'VND', 'since': a.since, 'annual': annual, 'quarter': quarter, 'stale': stale}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(stale), 'mã lỗi tải')


if __name__ == '__main__':
    main()
