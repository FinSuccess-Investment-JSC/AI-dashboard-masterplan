#!/usr/bin/env python3
"""World Bank Pink Sheet (giá hàng hóa theo tháng, USD danh nghĩa) → data/raw/public/pinksheet-feed.json.

Lấy link CMO-Historical-Data-Monthly.xlsx từ trang Pink Sheet (link đổi theo phiên bản tháng), đọc sheet "Monthly Prices".
Chuỗi: Maize ($/mt), Soybean meal ($/mt) – nguyên liệu thức ăn chăn nuôi tham chiếu thế giới (không phải giá nhập về Việt Nam).
Lỗi tải → giữ file cũ, thoát mã 1.
"""
import io
import json
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import openpyxl
import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/pinksheet-feed.json'
PAGE = 'https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/world-bank-commodities-price-data-the-pink-sheet'
UA = {'User-Agent': 'Mozilla/5.0 (compatible; FinSuccess-dashboard/1.0)'}
WANT = {'maize': 'Maize', 'soymeal': 'Soybean meal'}
FIRST = '2015-01'


def main():
    page = requests.get(PAGE, headers=UA, timeout=60).text
    m = re.search(r'https://thedocs\.worldbank\.org/en/doc/[^"\']+/CMO-Historical-Data-Monthly\.xlsx', page)
    if not m: raise SystemExit('Pink Sheet: không thấy link CMO-Historical-Data-Monthly.xlsx')
    url = m.group(0)
    r = requests.get(url, headers=UA, timeout=120); r.raise_for_status()
    ws = openpyxl.load_workbook(io.BytesIO(r.content), read_only=True, data_only=True)['Monthly Prices']
    rows = list(ws.iter_rows(values_only=True))
    updated = next((str(x[0]) for x in rows[:6] if x and x[0] and str(x[0]).startswith('Updated on')), None)
    hdr, units = rows[4], rows[5]
    out = {'schema': 1, 'source': 'World Bank Commodity Price Data (The Pink Sheet), monthly', 'page': PAGE, 'file': url,
           'updated': updated, 'status': 'tham chiếu thị trường', 'series': {}}
    for key, name in WANT.items():
        j = next(i for i, h in enumerate(hdr) if h and str(h).strip() == name)
        pts = []
        for row in rows[6:]:
            p = str(row[0] or '')
            if not re.fullmatch(r'\d{4}M\d{2}', p): continue
            ym = p[:4] + '-' + p[5:]
            v = row[j]
            if ym >= FIRST and isinstance(v, (int, float)): pts.append([ym, round(float(v), 2)])
        if len(pts) < 60: raise SystemExit(f'Pink Sheet {name}: quá ít kỳ ({len(pts)})')
        out['series'][key] = {'name': name, 'unit': str(units[j]).strip('()').replace('$/mt', 'USD/tấn'), 'points': pts}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    print('pinksheet', {k: v['points'][-1] for k, v in out['series'].items()}, updated)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('pinksheet error:', e); sys.exit(1)
