#!/usr/bin/env python3
"""Backlog cover và phải thu/doanh thu theo mã từ VNDirect finfo (công khai, BCTC hợp nhất theo quý).

Chỉ số dẫn xuất được phép tự động (người dùng chốt 05/11/2026):
  backlog_cover      = người mua trả tiền trước (ngắn hạn 13130 + dài hạn 13311) ÷ doanh thu thuần TTM (21001, 4 quý gần nhất)
  receivables_ratio  = phải thu khách hàng (ngắn hạn 11310 + dài hạn 12110) ÷ doanh thu thuần TTM
Mã khoản mục theo bảng cân đối kế toán VNDirect (modelType 1, /v4/financial_models) và KQKD (modelType 2, như
scripts/fetch_public_fs.py). Ghi data/raw/public/<sector>-backlog.json; chạy được offline nếu file đã có
(mã lỗi giữ số cũ, ghi vào 'errors'). Không chép số tay.

Usage: python3 scripts/fetch_realestate_backlog.py [--sector realestate|construction] [--codes VHM,NVL] [--since 2023-01-01]
"""
import argparse, datetime as dt, json, ssl, subprocess, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = 'https://api-finfo.vndirect.com.vn/v4/financial_statements?q=code:{c}~reportType:QUARTER~modelType:{m}~fiscalDate:gte:{since}&size=5000'
BS = {13130: 'customer_prepay_st', 13311: 'customer_prepay_lt', 11310: 'receivable_st', 12110: 'receivable_lt',
      11100: 'cash', 11200: 'st_investments', 13110: 'borrow_st', 13340: 'borrow_lt', 13199: 'unearned_st', 13197: 'unearned_lt',
      11400: 'inventory', 12700: 'total_assets', 14000: 'equity'}
IS = {21001: 'revenue'}
SECTORS = {
    'realestate': 'VHM,NVL,KDH,NLG,DXG,PDR,DIG,CEO,AGG,TCH,NTL',   # 11 mã nhà ở
    'construction': 'CTD,HBC,VCG,FCN,DPG,C4G,LCG,HHV,CII,HUT',    # 10 mã nhà thầu, hạ tầng
}
BN = 1e9


def http(url):
    try:  # curl với retry như build_sector_public.py; urllib dự phòng
        return json.loads(subprocess.run(['curl', '-sfL', '-m', '60', '-A', 'Mozilla/5.0', url], check=True, capture_output=True, text=True).stdout)
    except Exception:
        pass
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        ctx = ssl.create_default_context()
    for i in range(3):
        try:
            return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60, context=ctx).read())
        except Exception:
            if i == 2:
                raise
            time.sleep(3)


def qlabel(fiscal_date):
    y, m = int(fiscal_date[:4]), int(fiscal_date[5:7])
    return f'{y}Q{(m - 1) // 3 + 1}'


def fetch(symbol, since):
    """{quarter: {field: tỷ VND}} cho một mã, gộp bảng cân đối và KQKD."""
    out = {}
    for model, items in ((1, BS), (2, IS)):
        for r in http(API.format(c=symbol, m=model, since=since))['data']:
            code = int(r['itemCode'])
            if code not in items:
                continue
            v = r.get('numericValue')
            out.setdefault(qlabel(r['fiscalDate']), {'fiscal_date': r['fiscalDate'][:10]})[items[code]] = None if v is None else v / BN
        time.sleep(0.3)
    return dict(sorted(out.items()))


def derive(rows):
    """Thêm TTM doanh thu, backlog cover, phải thu/doanh thu; quý thiếu một trong 4 quý doanh thu thì để null."""
    qs = list(rows)
    for i, q in enumerate(qs):
        r = rows[q]
        rev = [rows[x].get('revenue') for x in qs[max(0, i - 3):i + 1]]
        ttm = sum(rev) if len(rev) == 4 and all(v is not None for v in rev) else None
        prepay = (r.get('customer_prepay_st') or 0) + (r.get('customer_prepay_lt') or 0) if r.get('customer_prepay_st') is not None else None
        recv = (r.get('receivable_st') or 0) + (r.get('receivable_lt') or 0) if r.get('receivable_st') is not None else None
        r['revenue_ttm'] = ttm
        r['customer_prepay'] = prepay
        r['receivables'] = recv
        r['backlog_cover'] = round(prepay / ttm, 3) if ttm and prepay is not None else None
        r['receivables_ratio'] = round(recv / ttm, 3) if ttm and recv is not None else None
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sector', default='realestate', choices=sorted(SECTORS))
    ap.add_argument('--codes', help='danh sách mã, mặc định theo ngành')
    ap.add_argument('--since', default='2023-01-01')
    a = ap.parse_args()
    out = ROOT / 'data/raw/public' / f'{a.sector}-backlog.json'
    prev = json.loads(out.read_text()) if out.exists() else {}
    codes = (a.codes or SECTORS[a.sector]).split(',')
    rows, errors = {}, {}
    for s in codes:
        try:
            rows[s] = derive(fetch(s, a.since))
            if not rows[s]:
                raise ValueError('không có dòng nào')
        except Exception as e:  # last-good: giữ số cũ của mã này
            errors[s] = str(e)[:200]
            if s in (prev.get('rows') or {}):
                rows[s] = prev['rows'][s]
    payload = {'checked': dt.date.today().isoformat(), 'source': 'VNDirect finfo · financial_statements (BCTC hợp nhất, quý)',
               'url': API.split('?')[0], 'unit': 'tỷ VND', 'sector': a.sector, 'codes': codes,
               'items': {'balance_sheet(modelType 1)': {str(k): v for k, v in BS.items()}, 'income(modelType 2)': {str(k): v for k, v in IS.items()}},
               'formula': {'backlog_cover': '(13130 + 13311) / tổng doanh thu 21001 của 4 quý gần nhất',
                           'receivables_ratio': '(11310 + 12110) / tổng doanh thu 21001 của 4 quý gần nhất'},
               'rows': rows, 'errors': errors}
    text = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    out.write_text(text + '\n')
    js = ROOT / 'data' / f'{a.sector}-backlog.js'  # trang nạp bản JS (window.<SECTOR>_BACKLOG)
    js.write_text(f'window.{a.sector.upper()}_BACKLOG = ' + text.replace('<', '\\u003c') + ';\n')
    print(out.relative_to(ROOT), {s: len(r) for s, r in rows.items()}, 'errors:', errors or 'none')
    return 0


if __name__ == '__main__':
    sys.exit(main())
