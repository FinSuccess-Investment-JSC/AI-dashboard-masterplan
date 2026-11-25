#!/usr/bin/env python3
"""Sản lượng phân urê và phân NPK hằng tháng (nghìn tấn) từ biểu số liệu kinh tế – xã hội của Cục Thống kê,
cho dashboard Phân bón (Phan-bon/). Dùng lại cách đọc workbook của scripts/fetch_nso.py (bản sơ bộ của workbook sau
thay số ước tính); chỉ ghi file riêng, không đụng data/raw/public/nso-monthly.json.

    python scripts/fetch_fertilizer_nso.py [--cache DIR]      # ghi data/raw/public/fertilizer-nso.json
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import fetch_nso as fn  # noqa: E402

fn.SPEC = {'urea_output': ('prod', r'^phân u ?rê', 'cur'), 'npk_output': ('prod', r'^phân hỗn hợp n\.?\s?p\.?\s?k', 'cur')}
fn.QSPEC = {}
fn.OUT = ROOT / 'data/raw/public/fertilizer-nso.json'

if __name__ == '__main__':
    if '--cache' not in sys.argv:
        sys.argv += ['--cache', str(ROOT.parent / 'nso-cache')]
    fn.main()
    raw = fn.OUT.read_bytes().replace(b'\r\n', b'\n')
    fn.OUT.write_bytes(raw)
