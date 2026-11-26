#!/usr/bin/env python3
"""Tải BCTC hợp nhất theo quý (cân đối, KQKD, LCTT) của doanh nghiệp BĐS dân cư từ VNDirect finfo (công khai).

  python scripts/fetch_re_financials.py [--since 2019-01-01]

Ghi data/raw/public/fs_re_full_vndirect.json, cùng cấu trúc fs_power_full_vndirect.json (xem fetch_power_financials.py).
Giá trị đúng như nguồn (đồng); không điền số thiếu. Mã lỗi tải giữ dữ liệu lần tải trước và ghi vào 'stale'.
"""
import argparse, datetime as dt, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from re_fin_items import TICKERS, ITEMS  # noqa: E402
import fetch_power_financials as fpf  # noqa: E402  (dùng lại hàm tải, với danh mục khoản mục KCN dùng chung cho BĐS dân cư)
fpf.ITEMS = ITEMS
API, fetch = fpf.API, fpf.fetch

OUT = ROOT / 'data/raw/public/fs_re_full_vndirect.json'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--since', default='2019-01-01')
    a = ap.parse_args()
    old = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    quarter, annual, stale = {}, {}, []
    for t in TICKERS:
        try:
            quarter[t], annual[t] = fetch(t, a.since)
            if not quarter[t]:
                raise ValueError('không có dữ liệu quý')
        except Exception as e:  # giữ bản trước, không ghi đè bằng dữ liệu lỗi
            quarter.pop(t, None), annual.pop(t, None)
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
