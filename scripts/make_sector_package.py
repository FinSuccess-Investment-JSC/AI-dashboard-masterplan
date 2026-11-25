#!/usr/bin/env python3
"""Tách một trang ngành thành gói riêng <Ngành>/app/ theo mẫu trang Điện (25/11/2026).

    python scripts/make_sector_package.py Thep Dau-khi ...

Cho mỗi thư mục ngành:
1. File trong assets/ mà trang nạp: chỉ ngành này dùng thì git mv sang <Ngành>/app/, dùng chung thì chép bản riêng.
   Trang chỉ còn nạp app/… và ../data/… (dữ liệu vẫn dùng chung, bot vẫn ghi vào data/).
2. Bản site-navigation.js của gói tính gốc web bằng ../../ (vì nằm ở <Ngành>/app/) và lấy logo trong gói.
3. Thêm các quy tắc chuẩn của trang Điện từ scripts/sector_package/:
   sector-boot.js (che nội dung, dựng bố cục một lượt rồi mới hiện — hết lộ "tab nền"),
   labels-vi.js (chữ tiếng Anh do module chung sinh ra → tiếng Việt), chart-unfold.js (chart không nằm trong mục thu gọn),
   chart-source.js (dòng "Nguồn: …" dưới mọi chart), sector-standard.css.
4. Đổi các hẹn giờ "load + N ms" trong bản sao thành SectorBoot.add(N, hàm) để chạy trong lượt dựng.
5. Cập nhật mã ?v= của các file app/.
Trang đã là gói riêng (không còn ../assets/) thì bỏ qua. Không đụng Dien/ (gói gốc, dùng dien-boot.js).
"""
import hashlib
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TPL = ROOT / 'scripts' / 'sector_package'
STANDARD_JS = ['labels-vi.js', 'chart-unfold.js', 'chart-source.js']
REF = re.compile(r'\b(src|href)="\.\./assets/([^"?]+)(\?v=[0-9a-f]+)?"')

# (file, chuỗi cũ, chuỗi mới) — hẹn giờ sau load → SectorBoot.add(mốc, hàm). Mốc giữ đúng thứ tự cũ.
TIMERS = [
    ('value-chain.js', "if(document.readyState==='complete')setTimeout(upgradeAll,50);else addEventListener('load',()=>setTimeout(upgradeAll,50));", "SectorBoot.add(50,upgradeAll); // sector-boot.js"),
    ('table-fold.js', "if (document.readyState === 'complete') start(); else window.addEventListener('load', start);", "SectorBoot.add(-1, start); // sector-boot.js"),
    ('source-gap.js', "if(document.readyState==='complete')mark();else window.addEventListener('load',mark);", "SectorBoot.add(-1,mark); // sector-boot.js"),
    ('company-trend.js', "addEventListener('load',()=>setTimeout(place,0))", "SectorBoot.add(0,place)"),
    ('research-layout.js', "window.addEventListener('load',()=>setTimeout(wbLink,0));", "SectorBoot.add(0,wbLink);"),
    ('sector-smart.js', "if (document.readyState === 'complete') setTimeout(run, 700); else addEventListener('load', () => setTimeout(run, 700));", "SectorBoot.add(700, run); // sector-boot.js"),
    ('sector-visuals.js', "if (document.readyState === 'complete') setTimeout(run, 400); else addEventListener('load', () => setTimeout(run, 400));", "SectorBoot.add(400, run); // sector-boot.js"),
    ('kcn-workspace.js', "if (document.readyState === 'complete') setTimeout(start, 700); else addEventListener('load', () => setTimeout(start, 700));", "SectorBoot.add(700, start); // sector-boot.js"),
    ('site-navigation.js', "  if (document.readyState === 'complete') run(); else addEventListener('load', run);", "  SectorBoot.add(-1, run); // sector-boot.js (gói ngành)"),
    ('site-navigation.js', "  if (document.readyState === 'complete') later(); else addEventListener('load', () => { scan(); setTimeout(scan, 1300); });", "  SectorBoot.add(-1, scan); SectorBoot.add(2000, scan); // sector-boot.js (gói ngành)"),
    ('site-navigation.js', "  if (document.readyState === 'complete') later(); else addEventListener('load', () => { run(); setTimeout(run, 1500); });", "  SectorBoot.add(-1, run); SectorBoot.add(2000, run); // sector-boot.js (gói ngành)"),
    ('site-navigation.js', "  const root = new URL('../', script.src);", "  const root = new URL('../../', script.src); // gói riêng: <Ngành>/app/ → gốc trang web"),
    ('site-navigation.js', "logo.src = new URL('assets/fin-success-logo.png', root).href", "logo.src = new URL('app/fin-success-logo.png', document.baseURI).href"),
]


def read(p):
    return p.read_bytes().decode('utf-8')


def write(p, s):
    p.write_bytes(s.encode('utf-8'))


def users_of(name, skip):
    """Trang khác (ngoài `skip`) còn nạp assets/<name>."""
    pages = [p for p in ROOT.glob('*/index.html')] + [ROOT / 'index.html', ROOT / '404.html']
    pat = re.compile(r'(src|href)="(\.\./)?assets/' + re.escape(name) + r'["?]')
    return [p for p in pages if p.parent != skip and p.exists() and pat.search(read(p))]


def package(folder):
    """Bước một lần: gom file assets/ mà trang nạp vào <Ngành>/app/ rồi áp chuẩn."""
    d = ROOT / folder
    page = d / 'index.html'
    html = read(page)
    names = sorted({m.group(2) for m in REF.finditer(html)})
    if not names:
        print(f'{folder}: đã là gói riêng — chỉ cập nhật mẫu chuẩn')
        standardize(d)
        return
    app = d / 'app'
    app.mkdir(exist_ok=True)
    moved, copied = [], []
    for n in names:
        src, dst = ROOT / 'assets' / n, app / n
        if ORIGINAL_USERS.setdefault(n, users_of(n, d)):  # dùng chung lúc bắt đầu chạy → chép, assets/ giữ bản gốc
            shutil.copyfile(src, dst); copied.append(n)
        else:
            subprocess.run(['git', 'mv', str(src.relative_to(ROOT)), str(dst.relative_to(ROOT))], cwd=ROOT, check=True); moved.append(n)
    shutil.copyfile(ROOT / 'assets' / 'fin-success-logo.png', app / 'fin-success-logo.png')
    write(page, REF.sub(lambda m: f'{m.group(1)}="app/{m.group(2)}{m.group(3) or ""}"', html))
    standardize(d)
    print(f'{folder}: chuyển {len(moved)} ({", ".join(moved) or "-"}), chép {len(copied)}, thêm {len(STANDARD_JS) + 2} file chuẩn')


def patch(f, old, new, folder):
    s = read(f)
    for o in (old, old.replace('\n', '\r\n')):
        if o in s:
            write(f, s.replace(o, new)); return
    if new not in s:
        raise SystemExit(f'{folder}: không tìm thấy mẫu trong {f.name}: {old[:60]}')


def standardize(d):
    """Chạy lại được nhiều lần: chép bản mới nhất của mẫu chuẩn, đổi hẹn giờ, gắn file chuẩn vào trang, cập nhật ?v=."""
    app, page = d / 'app', d / 'index.html'
    for n in ['sector-boot.js', 'sector-standard.css', *STANDARD_JS]:
        shutil.copyfile(TPL / n, app / n)
    for fname, old, new in TIMERS:
        if (app / fname).exists():
            patch(app / fname, old, new, d.name)
    # research-editorial.js mở IndexedDB bất đồng bộ rồi mới thêm câu hỏi/"Cách đối chiếu" → lượt dựng phải đợi nó.
    ed = app / 'research-editorial.js'
    if ed.exists() and 'SectorBoot.wait(' not in read(ed):
        s = read(ed)
        assert s.count('\n(async () => {') == 1 and s.rstrip().endswith('})();'), 'research-editorial.js đổi cấu trúc'
        s = s.replace('\n(async () => {', '\nSectorBoot.wait((async () => { // sector-boot.js đợi phần này', 1)
        s = s.rstrip()[:-len('})();')] + '})());\n'
        write(ed, s)
    html = read(page)
    nl = '\r\n' if '\r\n' in html else '\n'
    if 'app/sector-boot.js' not in html:
        first = html.index('<script')
        html = html[:first] + '<script src="app/sector-boot.js?v=000000000000"></script>' + nl + html[first:]
    missing = [n for n in STANDARD_JS if f'app/{n}' not in html]
    if missing:
        at = list(re.finditer(r'<script src="[^"]+" defer></script>', html))[-1].end()
        html = html[:at] + ''.join(f'{nl}<script src="app/{n}?v=000000000000" defer></script>' for n in missing) + html[at:]
    if 'app/sector-standard.css' not in html:
        at = list(re.finditer(r'<link rel="stylesheet" href="app/[^"]+">', html))[-1].end()
        html = html[:at] + f'{nl}<link rel="stylesheet" href="app/sector-standard.css?v=000000000000">' + html[at:]
    html = re.sub(r'(app/[\w.-]+\.(?:js|css))(\?v=[0-9a-f]+)?(?=")',
                  lambda m: f'{m.group(1)}?v={hashlib.sha256((d / m.group(1)).read_bytes()).hexdigest()[:12]}', html)
    write(page, html)


ORIGINAL_USERS = {}

if __name__ == '__main__':
    # Tính trước ai dùng file nào, để ngành chạy sau không "lấy hẳn" file dùng chung khỏi assets/.
    for f in sys.argv[1:]:
        pg = ROOT / f.strip('/') / 'index.html'
        if pg.exists():
            for m in REF.finditer(read(pg)):
                ORIGINAL_USERS.setdefault(m.group(2), users_of(m.group(2), pg.parent))
    for f in sys.argv[1:]:
        if f.strip('/') == 'Dien':
            print('Dien: gói gốc (dien-boot.js), bỏ qua'); continue
        package(f.strip('/'))
