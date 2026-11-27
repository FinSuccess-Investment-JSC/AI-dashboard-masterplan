#!/usr/bin/env python3
"""Định giá theo phiên cho 8 mã hàng không (Hang-khong/ › Tài chính ngành › 02 Doanh nghiệp niêm yết).

  python scripts/build_aviation_valuation.py

Dùng lại scripts/update_valuation.py (VNDirect finfo: P/E, P/B, vốn hóa tại ngày tham chiếu, điều chỉnh theo giá đóng cửa
phiên mới nhất; median5 = trung vị P/E, P/B theo ngày 5 năm, bỏ giá trị ≤ 0). Mã lỗi giữ số lần trước, ghi vào 'errors'.
Ghi data/aviation-valuation.json/.js (window.AVIATION_VAL). Không đụng data/company-valuation.* (rổ chung các ngành).
"""
import datetime as dt
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import update_valuation as uv  # noqa: E402
from aviation_fin_items import TICKERS  # noqa: E402

OUT = ROOT / 'data/aviation-valuation.json'
OUT_JS = ROOT / 'data/aviation-valuation.js'


def main():
    now = dt.datetime.now(uv.VN)
    old = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {'companies': {}}
    companies, errors = {}, {}
    for t in TICKERS:
        prev = old.get('companies', {}).get(t, {})
        try:
            row = uv.value_ticker(t, now)
        except Exception as e:  # giữ số cũ
            row = {**prev, 'last_good': True} if prev else {}
            errors[t] = str(e)[:200]
        try:
            row['median5'] = uv.median5(t, now)
        except Exception as e:
            if prev.get('median5'):
                row['median5'] = prev['median5']
            errors[t + ':median5'] = str(e)[:200]
        if row:
            companies[t] = row
        print(t, row.get('date'), row.get('pe'), row.get('pb'), row.get('market_cap'), file=sys.stderr)
    payload = {'schema': 1, 'checked_at': now.isoformat(timespec='seconds'), 'provider': 'VNDirect finfo',
               'method': 'P/E, P/B, vốn hóa của VNDirect tại ngày tham chiếu, điều chỉnh theo giá đóng cửa phiên mới nhất; median5: trung vị P/E, P/B theo ngày 5 năm gần nhất, bỏ giá trị ≤ 0.',
               'units': {'close': 'nghìn đồng/cổ phiếu', 'market_cap': 'tỷ đồng', 'pe': 'lần', 'pb': 'lần'},
               'companies': companies, 'errors': errors}
    text = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    OUT.write_text(text + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('window.AVIATION_VAL = ' + text + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(companies), 'mã;', len(errors), 'lỗi')
    return 0


if __name__ == '__main__':
    sys.exit(main())
