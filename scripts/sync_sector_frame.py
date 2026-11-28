#!/usr/bin/env python3
"""Chép CSS khung chuẩn Điện (scripts/sector_package/sector-frame.css) vào mọi dashboard ngành và nạp nó cuối <head>.

    python scripts/sync_sector_frame.py

DASHBOARD_WORKFLOW.md §42 (28/11/2026). Không áp cho Ngân hàng, Chứng khoán, Bảo hiểm (tổ chức riêng) và các trang chuyển hướng.
Chạy lại được: trang đã có thẻ thì chỉ chép lại file và cập nhật ?v=.
"""
import hashlib
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'scripts' / 'sector_package' / 'sector-frame.css'
SKIP = {'Bank', 'Chung-khoan', 'Bao-hiem', 'duong', 'Dau-tu-cong', 'Thuy-san', 'Masterplan', 'Nong-nghiep'}
LINK = re.compile(r'<link rel="stylesheet" href="app/sector-frame\.css(\?v=[0-9a-f]+)?">\n?')


def main():
    import sys
    SKIP.update(a[7:] for a in sys.argv[1:] if a.startswith('--skip='))  # --skip=O-to-xe-may: trang đang có phiên khác sửa
    ver = hashlib.sha256(SRC.read_bytes()).hexdigest()[:12]
    tag = f'<link rel="stylesheet" href="app/sector-frame.css?v={ver}">\n'
    done = []
    for page in sorted(ROOT.glob('*/index.html')):
        d = page.parent
        if d.name in SKIP or not (d / 'app').is_dir():
            continue
        shutil.copyfile(SRC, d / 'app' / 'sector-frame.css')
        s = page.read_bytes().decode('utf-8')
        s2 = LINK.sub('', s).replace('</head>', tag + '</head>', 1)
        if s2 != s:
            page.write_bytes(s2.encode('utf-8'))
        done.append(d.name)
    print('sector-frame.css ->', ', '.join(done))


if __name__ == '__main__':
    main()
