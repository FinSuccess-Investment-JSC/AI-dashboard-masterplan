#!/usr/bin/env python3
"""Tải BCTC hợp nhất theo quý (cân đối, KQKD, LCTT) của doanh nghiệp dược & y tế từ VNDirect finfo (công khai),
cho tab Tài chính ngành của Duoc/. Cùng cách tải với scripts/fetch_power_financials.py (dùng lại hàm fetch).

  python scripts/fetch_pharma_financials.py [--since 2019-01-01]

Ghi data/raw/public/fs_pharma_full_vndirect.json. Giá trị đúng như nguồn (đồng); mã lỗi tải giữ bản trước, ghi 'stale'.
"""
import argparse, datetime as dt, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import fetch_power_financials as _fp  # noqa: E402
from fetch_power_financials import API, fetch  # noqa: E402
from pharma_fin_items import ITEMS, TICKERS  # noqa: E402

_fp.ITEMS = ITEMS  # fetch() đọc ITEMS của module: dùng danh mục dược & y tế (thêm khoản mục cho bảng tỷ số)

OUT = ROOT / 'data/raw/public/fs_pharma_full_vndirect.json'


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
        except Exception as e:  # giữ bản trước
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
