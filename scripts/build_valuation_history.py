#!/usr/bin/env python3
"""Chuỗi P/E, P/B dài hạn theo tuần cho các mã của dashboard ngành (27/11/2026).

Nguồn: VNDirect finfo `v4/ratios` (itemCode 51006 = P/E, 51012 = P/B), số theo ngày từ 2018.
Lấy quan sát cuối mỗi tuần để file nhỏ; bỏ P/E, P/B ≤ 0 (lỗ hoặc thiếu số) thành null.
Đầu ra: data/valuation-history.js (window.VALUATION_HISTORY) + .json. Không tính số mới ngoài việc chọn quan sát cuối tuần.

Dùng: python3 scripts/build_valuation_history.py            # mọi mã trong scripts/re_fin_items.py
      python3 scripts/build_valuation_history.py VHM NVL    # chỉ các mã này (gộp vào file cũ)
"""
import datetime as dt
import json
import ssl
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
OUT_JSON, OUT_JS = ROOT / 'data' / 'valuation-history.json', ROOT / 'data' / 'valuation-history.js'
URL = ('https://api-finfo.vndirect.com.vn/v4/ratios?q=code:{t}~itemCode:51006,51012~reportDate:gte:{since}'
       '&sort=reportDate:asc&size=6000&fields=itemCode,value,reportDate')
SINCE = '2018-01-01'


def _context() -> ssl.SSLContext:
    try:
        import certifi  # bản Python của python.org trên macOS không kèm CA
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def fetch(t: str) -> list:
    req = urllib.request.Request(URL.format(t=t, since=SINCE), headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=60, context=_context()) as r:
        return json.load(r).get('data', [])


def weekly(rows: list) -> list:
    day = {}
    for r in rows:
        v = r.get('value')
        day.setdefault(r['reportDate'], {})['pe' if r['itemCode'] == '51006' else 'pb'] = round(v, 2) if isinstance(v, (int, float)) and v > 0 else None
    week = {}
    for d in sorted(day):
        y, w, _ = dt.date.fromisoformat(d).isocalendar()
        week[(y, w)] = [d, day[d].get('pe'), day[d].get('pb')]
    return [week[k] for k in sorted(week)]


def main(argv: list) -> int:
    if argv:
        tickers = argv
    else:
        from re_fin_items import COMPANIES
        tickers = [c['ticker'] for c in COMPANIES]
    old = json.loads(OUT_JSON.read_text(encoding='utf-8')) if OUT_JSON.exists() else {'tickers': {}, 'errors': {}}
    data, errors = dict(old.get('tickers', {})), dict(old.get('errors', {}))
    for t in tickers:
        try:
            data[t] = weekly(fetch(t)); errors.pop(t, None)
            print(t, len(data[t]), 'tuần')
        except Exception as e:  # giữ số cũ nếu lần này lỗi
            errors[t] = str(e)[:200]; print(t, 'lỗi', e)
    out = {'schema': 1, 'captured': dt.date.today().isoformat(), 'source': 'VNDirect finfo v4/ratios (P/E 51006, P/B 51012)',
           'url': 'https://api-finfo.vndirect.com.vn/v4/ratios', 'frequency': 'tuần (quan sát cuối tuần)', 'unit': 'lần',
           'fields': ['date', 'pe', 'pb'], 'tickers': data, 'errors': errors}
    text = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    OUT_JSON.write_text(text, encoding='utf-8')
    OUT_JS.write_text('window.VALUATION_HISTORY = ' + text + ';\n', encoding='utf-8')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
