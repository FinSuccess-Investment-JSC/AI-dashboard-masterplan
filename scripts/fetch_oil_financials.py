#!/usr/bin/env python3
"""Tải BCTC hợp nhất theo quý (bảng cân đối, kết quả kinh doanh, lưu chuyển tiền tệ) của doanh nghiệp ngành viễn thông
từ VNDirect finfo (công khai) cho sub-tab Tài chính ngành (Dau-khi/).

  python scripts/fetch_oil_financials.py [--since 2018-01-01]

Ghi data/raw/public/fs_oil_full_vndirect.json: {captured, source, unit, quarter: {mã: {kỳ: {mã khoản mục: giá trị}}},
annual: {mã: {năm: {mã khoản mục (chỉ LCTT): giá trị}}}}. Chỉ lấy khoản mục có trong ITEMS (scripts/power_fin_items.py, universe ở oil_fin_items.py).
Giá trị đúng như nguồn (đồng); không điền số thiếu. Mã lỗi tải giữ dữ liệu lần tải trước và ghi vào 'stale'.
"""
import argparse, datetime as dt, json, ssl, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from oil_fin_items import ITEMS, TICKERS  # noqa: E402

API = ('https://api-finfo.vndirect.com.vn/v4/financial_statements'
       '?q=code:{c}~reportType:{r}~modelType:{m}~fiscalDate:gte:{since}&size=9999')
OUT = ROOT / 'data/raw/public/fs_oil_full_vndirect.json'


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
    q, a = {}, {}
    for m in (1, 2, 3):
        for r in http(API.format(c=symbol, r='QUARTER', m=m, since=since))['data']:
            c = int(r['itemCode'])
            if c in codes[m] and r.get('numericValue') is not None:
                q.setdefault(period(r['fiscalDate'], 'QUARTER'), {})[str(c)] = r['numericValue']
        time.sleep(0.2)
    # Năm: chỉ dùng LCTT để kiểm số quý (quý riêng lẻ hay lũy kế).
    for r in http(API.format(c=symbol, r='ANNUAL', m=3, since=since))['data']:
        c = int(r['itemCode'])
        if c in codes[3] and r.get('numericValue') is not None:
            a.setdefault(period(r['fiscalDate'], 'ANNUAL'), {})[str(c)] = r['numericValue']
    return dict(sorted(q.items())), dict(sorted(a.items()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--since', default='2018-01-01')
    a = ap.parse_args()
    old = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    quarter, annual, stale = {}, {}, []
    for t in TICKERS:
        try:
            quarter[t], annual[t] = fetch(t, a.since)
            if not quarter[t]:
                raise ValueError('không có dữ liệu quý')
        except Exception as e:  # giữ bản trước, không ghi đè bằng dữ liệu lỗi
            if t in old.get('quarter', {}):
                quarter[t], annual[t] = old['quarter'][t], old.get('annual', {}).get(t, {})
            stale.append({'ticker': t, 'error': str(e)[:200]})
        print(t, len(quarter.get(t, {})), 'quý', file=sys.stderr)
    payload = {'captured': dt.date.today().isoformat(), 'source': 'VNDirect finfo · financial_statements (BCTC hợp nhất; quý, năm)',
               'url': API.split('?')[0], 'unit': 'VND', 'since': a.since, 'quarter': quarter, 'annual': annual, 'stale': stale}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), sum(len(v) for v in quarter.values()), 'mã-quý;', len(stale), 'mã lỗi tải')


if __name__ == '__main__':
    sys.exit(main())
