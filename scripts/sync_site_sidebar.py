#!/usr/bin/env python3
"""Chép thanh ngành bên trái (scripts/sector_package/site-sidebar.js/.css) và CSS tiêu đề gọn (site-tidy.css) vào mọi trang, nạp data/site-nav.js.

    python scripts/sync_site_sidebar.py

- Trang nạp app/site-navigation.js (gói ngành): chép vào <Ngành>/app/.
- Trang còn nạp ../assets/ hoặc assets/site-navigation.js (Trang tổng, Bảo hiểm, Chứng khoán…): chép vào assets/.
- Chèn ngay sau thẻ site-navigation.js (nạp đồng bộ, để thanh hiện từ lần vẽ đầu, không xô bố cục):
  <script src="…data/site-nav.js"></script><script src="…site-sidebar.js"></script>; CSS chèn sau site-navigation.css.
Chạy lại được: trang đã có thẻ thì chỉ chép lại file. Sau đó chạy scripts/prepare_release.py để đổi ?v=.
"""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TPL = ROOT / 'scripts' / 'sector_package'
FILES = ['site-sidebar.js', 'site-sidebar.css', 'site-tidy.css']  # site-tidy.css: tiêu đề gọn, bỏ câu hỏi phụ
SKIP = {'duong'}  # trang chuyển hướng sang Sugar/
NAV = re.compile(r'<script src="((?:\.\./)?(?:app|assets)/)site-navigation\.js[^"]*"[^>]*></script>')
CSS = re.compile(r'<link rel="stylesheet" href="(?:\.\./)?(?:app|assets)/site-navigation\.css[^"]*">')


def main():
    pages = [ROOT / 'index.html'] + sorted(p for p in ROOT.glob('*/index.html') if p.parent.name not in SKIP)
    done = []
    for page in pages:
        s = page.read_bytes().decode('utf-8')
        m = NAV.search(s)
        if not m:
            continue
        prefix = m.group(1)                      # app/  ../assets/  assets/
        target = (page.parent / prefix).resolve()
        for f in FILES:
            shutil.copyfile(TPL / f, target / f)
        data = '../data/' if page.parent != ROOT else 'data/'
        changed = False
        if 'site-sidebar.js' not in s:
            tag = f'\n<script src="{data}site-nav.js"></script>\n<script src="{prefix}site-sidebar.js"></script>'
            s = s[:m.end()] + tag + s[m.end():]
            link = f'<link rel="stylesheet" href="{prefix}site-sidebar.css">'
            c = CSS.search(s)
            s = s[:c.end()] + '\n' + link + s[c.end():] if c else s.replace('</head>', link + '\n</head>', 1)
            changed = True
        if 'site-tidy.css' not in s:
            t = re.search(r'<link rel="stylesheet" href="[^"]*site-sidebar\.css[^"]*">', s)
            s = s[:t.end()] + f'\n<link rel="stylesheet" href="{prefix}site-tidy.css">' + s[t.end():]
            changed = True
        if changed:
            if '\r' in s:
                raise SystemExit(f'{page}: CRLF, đổi sang LF trước')
            page.write_bytes(s.encode('utf-8'))
        done.append(f'{page.parent.name if page.parent != ROOT else "(gốc)"} → {prefix}')
    print(len(done), 'trang:', ', '.join(done))


if __name__ == '__main__':
    main()
