#!/usr/bin/env python3
"""Dược: gói dữ liệu bổ sung cho trang (không đụng build_sector_public của ngành khác).
Đọc data/raw/public/dav-tenders.json (scripts/fetch_dav_tenders.py) và fred-pop65.json (scripts/fetch_fred_pop65.py)
→ data/pharma-extra-data.js (window.PHARMA_EXTRA)."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
out = {}
for key, f in (('dav_tenders', 'dav-tenders.json'), ('pop65', 'fred-pop65.json')):
    p = ROOT / 'data/raw/public' / f
    if p.exists():
        d = json.loads(p.read_text())
        d.pop('top_bidders', None) if key != 'dav_tenders' else None
        out[key] = d
text = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
(ROOT / 'data/pharma-extra-data.js').write_text('window.PHARMA_EXTRA = ' + text.replace('<', '\\u003c') + ';\n')
print('pharma-extra', list(out))
