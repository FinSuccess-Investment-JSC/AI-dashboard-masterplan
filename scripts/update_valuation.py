#!/usr/bin/env python3
"""Daily market valuation (P/E, P/B, market cap) for the tracked listed companies.

Source: VNDirect finfo (public JSON, no credentials). `ratios/latest` gives P/E (51006),
P/B (51012) and market cap (51003, VND) computed by VNDirect as of its last report date;
`stock_prices` gives the closing price. When a later session has closed, the multiples
and market cap are scaled by close(latest) / close(report date) — same EPS, BVPS and share
count, so only the price moves. Statement-based figures are not touched here (they are
updated on request). A failed ticker keeps its last good values, flagged `last_good`.

    python3 scripts/update_valuation.py            # all tickers in the comparison universe
    python3 scripts/update_valuation.py PLX QNS
    python3 scripts/update_valuation.py --median-only      # chỉ tính lại trung vị 5 năm, giữ nguyên giá/P/E hiện tại

Trung vị 5 năm (`median5`): trung vị P/E và P/B theo ngày của VNDirect (`v4/ratios`, itemCode 51006/51012) trong
5 năm gần nhất; bỏ ngày P/E hoặc P/B ≤ 0 (lỗ, vốn âm). Mã niêm yết chưa đủ 5 năm dùng phần có, ghi `from`.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import ssl
import sys
import tempfile
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from update_company_comparison import UNIVERSE  # noqa: E402

DATA = ROOT / 'data'
OUT_JSON, OUT_JS = DATA / 'company-valuation.json', DATA / 'company-valuation.js'
PREFIX = 'window.COMPANY_VALUATION = '
VN = ZoneInfo('Asia/Ho_Chi_Minh')
RATIOS = 'https://api-finfo.vndirect.com.vn/v4/ratios/latest?filter=itemCode:51003,51006,51012&where=code:{t}&order=reportDate&fields=itemCode,value,reportDate'
PRICES = 'https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date&q=code:{t}~date:gte:{since}&size=30'
PAGE = 'https://dstock.vndirect.com.vn/tong-quan/{t}'
MAX_MOVE = 0.15      # widest daily price limit (UPCoM); a larger jump means a corporate action
HISTORY = 400
RATIO_HISTORY = 'https://api-finfo.vndirect.com.vn/v4/ratios?q=code:{t}~itemCode:51006,51012~reportDate:gte:{since}&sort=reportDate:asc&size=3000&fields=itemCode,value,reportDate'
MEDIAN_YEARS = 5


def _context() -> ssl.SSLContext:
    try:
        import certifi  # installed with requests; python.org builds on macOS ship no CA bundle
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=30, context=_context()) as res:
        return json.load(res)


def closed(row: dict, now: dt.datetime) -> bool:
    """A session row is final once its date has passed, or after 15:15 for a row stamped after the 14:45 ATC."""
    today = now.date().isoformat()
    return row['date'] < today or (row['date'] == today and now.time() >= dt.time(15, 15) and row.get('time', '') >= '14:45:00')


def value_ticker(symbol: str, now: dt.datetime, fetch=fetch_json) -> dict:
    ratios = {r['itemCode']: r for r in fetch(RATIOS.format(t=symbol)).get('data', [])}
    if not {'51003', '51006', '51012'} <= set(ratios):
        raise ValueError('thiếu P/E, P/B hoặc vốn hóa trong ratios/latest')
    basis = ratios['51006']['reportDate']
    since = (dt.date.fromisoformat(basis) - dt.timedelta(days=10)).isoformat()
    rows = [r for r in fetch(PRICES.format(t=symbol, since=since)).get('data', []) if r.get('close') and closed(r, now)]
    if not rows:
        raise ValueError('không có phiên đã đóng cửa')
    rows.sort(key=lambda r: r['date'])
    base = next((r for r in reversed(rows) if r['date'] <= basis), None)
    last = rows[-1]
    factor = 1.0
    if base and last['date'] > basis:
        factor = last['close'] / base['close']
        if abs(factor - 1) > MAX_MOVE:  # rights issue or split between basis and latest: do not scale
            factor, last = 1.0, base
    elif not base:
        raise ValueError(f'không có giá đóng cửa ngày {basis}')
    pe, pb, cap = ratios['51006']['value'], ratios['51012']['value'], ratios['51003']['value']
    return {'date': last['date'], 'close': last['close'], 'pe': round(pe * factor, 2) if pe is not None else None,
            'pb': round(pb * factor, 2) if pb is not None else None, 'market_cap': round(cap * factor / 1e9, 1),
            'basis_date': basis, 'source_url': PAGE.format(t=symbol)}


def _median(xs: list[float]) -> float | None:
    xs = sorted(xs)
    n = len(xs)
    if not n:
        return None
    return xs[n // 2] if n % 2 else (xs[n // 2 - 1] + xs[n // 2]) / 2


def median5(symbol: str, now: dt.datetime, fetch=fetch_json) -> dict:
    """Trung vị P/E, P/B theo ngày trong 5 năm gần nhất (VNDirect), bỏ giá trị ≤ 0."""
    since = now.date().replace(year=now.year - MEDIAN_YEARS).isoformat()
    rows = fetch(RATIO_HISTORY.format(t=symbol, since=since)).get('data', [])
    pe = [r['value'] for r in rows if r.get('itemCode') == '51006' and isinstance(r.get('value'), (int, float)) and r['value'] > 0]
    pb = [r['value'] for r in rows if r.get('itemCode') == '51012' and isinstance(r.get('value'), (int, float)) and r['value'] > 0]
    dates = sorted(r['reportDate'] for r in rows if r.get('reportDate'))
    if not dates:
        raise ValueError('không có lịch sử P/E, P/B')
    m_pe, m_pb = _median(pe), _median(pb)
    return {'pe': round(m_pe, 2) if m_pe is not None else None, 'pb': round(m_pb, 2) if m_pb is not None else None,
            'from': dates[0], 'to': dates[-1], 'n_pe': len(pe), 'n_pb': len(pb)}


def atomic(path: Path, text: str) -> None:
    fd, tmp = tempfile.mkstemp(prefix=f'.{path.name}.', dir=path.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as fh:  # LF cả trên Windows
            fh.write(text)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def main(argv=None) -> int:
    args = list(argv if argv is not None else sys.argv[1:])
    median_only = '--median-only' in args
    args = [a for a in args if a != '--median-only']
    symbols = args or [s for group in UNIVERSE.values() for s, _, _ in group]
    now = dt.datetime.now(VN)
    old = json.loads(OUT_JSON.read_text(encoding='utf-8')) if OUT_JSON.exists() else {'companies': {}, 'history': {}}
    companies, history, errors = dict(old.get('companies', {})), dict(old.get('history', {})), {}
    if median_only:  # giá/P/E không chạy lại: giữ lỗi định giá cũ để trạng thái không đổi
        errors = {k: v for k, v in old.get('errors', {}).items() if not k.endswith(':median5')}
    for symbol in symbols:
        prev = companies.get(symbol, {})
        try:
            med = median5(symbol, now)
        except Exception as exc:  # trung vị lỗi: giữ bản cũ
            med = prev.get('median5')
            errors[symbol + ':median5'] = str(exc)[:200]
        if median_only:
            if symbol in companies and med:
                companies[symbol] = {**companies[symbol], 'median5': med}
            continue
        try:
            fresh = value_ticker(symbol, now)
            if med:
                fresh['median5'] = med
        except Exception as exc:  # one ticker failing keeps its last good values
            errors[symbol] = str(exc)[:200]
            if symbol in companies:
                companies[symbol] = {**companies[symbol], 'last_good': True}
            continue
        companies[symbol] = fresh
        rows = {r[0]: r for r in history.get(symbol, [])}
        rows[fresh['date']] = [fresh['date'], fresh['close'], fresh['pe'], fresh['pb'], fresh['market_cap']]
        history[symbol] = [rows[d] for d in sorted(rows)][-HISTORY:]
    quote_errors = [k for k in errors if not k.endswith(':median5')]
    core = {s: {k: v for k, v in c.items() if k != 'last_good'} for s, c in companies.items()}
    bundle = {'schema': 1, 'checked_at': old.get('checked_at') if median_only and old.get('checked_at') else now.isoformat(timespec='seconds'), 'provider': 'VNDirect finfo',
              'method': 'P/E, P/B, vốn hóa của VNDirect tại ngày tham chiếu, điều chỉnh theo giá đóng cửa phiên mới nhất; EPS, BVPS, số cổ phiếu giữ nguyên đến kỳ BCTC sau. median5: trung vị P/E, P/B theo ngày 5 năm gần nhất (VNDirect), bỏ giá trị ≤ 0.',
              'units': {'market_cap': 'tỷ VND', 'pe': 'lần', 'pb': 'lần', 'close': 'nghìn VND'},
              'status': old.get('status', 'ok') if median_only else 'error' if quote_errors and len(quote_errors) == len(symbols) else 'partial' if errors else 'ok',
              'errors': errors, 'data_hash': hashlib.sha256(json.dumps(core, sort_keys=True).encode()).hexdigest(),
              'latest_observation': max((c['date'] for c in companies.values()), default=None),
              'companies': companies, 'history': history}
    if old.get('data_hash') == bundle['data_hash'] and old.get('status') == bundle['status']:
        bundle['changed_at'] = old.get('changed_at')
    else:
        bundle['changed_at'] = now.isoformat(timespec='seconds')
    atomic(OUT_JSON, json.dumps(bundle, ensure_ascii=False, indent=1))
    atomic(OUT_JS, PREFIX + json.dumps(bundle, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(json.dumps({'status': bundle['status'], 'latest': bundle['latest_observation'], 'errors': errors}, ensure_ascii=False))
    return 1 if bundle['status'] == 'error' else 0


if __name__ == '__main__':
    raise SystemExit(main())
