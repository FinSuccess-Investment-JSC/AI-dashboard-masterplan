#!/usr/bin/env python3
"""Quarterly construction-material prices published by the Hanoi Department of Construction (Sở Xây dựng Hà Nội).

The "Kinh tế & Vật liệu xây dựng" section posts "Công bố giá một số vật liệu xây dựng quý <N> năm <YYYY>" with
"Phụ lục 1" as a text PDF (~340 pages, prices before VAT). From each Phụ lục 1:
  * cat_vang: median of "Cát vàng" across the yards of group I (VND/m3);
  * da_1x2: median of "Đá 1x2" across the quarries and yards of group II (VND/m3);
  * cement_pcb40: median of bagged PCB40 cement across manufacturers (VND/tấn), loose (rời) and
    multipurpose (đa dụng) cement excluded.
A median keeps one outlying yard or brand from moving the series. The site moved to a new CMS in 2026 and older
notices are gone, so history starts at Q3/2026 and accumulates in the output file.

    python3 scripts/fetch_sxd_hanoi.py      # writes data/raw/public/sxd-hanoi-quarterly.json
"""
import json
import re
import statistics
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/sxd-hanoi-quarterly.json'
BASE = 'https://soxaydung.hanoi.gov.vn'
LIST = BASE + '/kinh-te-vat-lieu-xay-dung'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
NOTICE = re.compile(r'href="(/kinh-te-vat-lieu-xay-dung/cong-bo-gia-mot-so-vat-lieu-xay-dung-quy-(i|ii|iii|iv)-nam-(\d{4})-\d+\.htm)"')
ROMAN = {'i': 1, 'ii': 2, 'iii': 3, 'iv': 4}
NAMES = {'cat_vang': 'Cát vàng (trung vị các bãi)', 'da_1x2': 'Đá 1x2 (trung vị các mỏ, bãi)',
         'cement_pcb40': 'Xi măng bao PCB40 (trung vị các nhà sản xuất)'}
UNITS = {'cat_vang': 'VND/m3', 'da_1x2': 'VND/m3', 'cement_pcb40': 'VND/tấn'}


def get(url, out=None):
    args = ['curl', '-sfL', '-m', '120', '-A', UA, url] + (['-o', str(out)] if out else [])
    return subprocess.run(args, check=True, capture_output=True, text=out is None).stdout


def num(t):
    return float(re.sub(r'[.,]', '', t))


def parse(text):
    lines = text.splitlines()
    sec = lambda a, b: '\n'.join(lines[next(i for i, l in enumerate(lines) if re.search(a, l)):
                                     next(i for i, l in enumerate(lines) if re.search(b, l))])
    row = lambda block, name: [num(m) for m in re.findall(rf'^\s*\d+\s+{name}\s+m3?\s+([\d.]+)\s*$', block, re.M)]
    cat = row(sec(r'I - NHÓM VẬT LIỆU CÁT', r'II - NHÓM VẬT LIỆU ĐÁ'), 'Cát vàng')
    da = row(sec(r'II - NHÓM VẬT LIỆU ĐÁ', r'BẢNG CÔNG BỐ GIÁ MỘT SỐ VẬT LIỆU XÂY DỰNG QUÝ'), r'Đá 1x2')
    cement = []
    for i, line in enumerate(lines):
        if 'PCB40' in line and re.search(r'\bbao\b', line, re.I) and not re.search(r'rời|đa dụng', line, re.I):
            for cand in lines[i:i + 3]:
                vals = [num(v) for v in re.findall(r'\b\d{1}[.,]\d{3}[.,]\d{3}\b', cand) if 900_000 <= num(v) <= 3_000_000]
                if vals:
                    cement.append(vals[-1])
                    break
    out = {}
    for key, vals, need in (('cat_vang', cat, 3), ('da_1x2', da, 3), ('cement_pcb40', cement, 4)):
        if len(vals) < need:
            raise ValueError(f'{key}: only {len(vals)} rows')
        out[key] = {'value': statistics.median(vals), 'n': len(vals), 'min': min(vals), 'max': max(vals)}
    return out


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    S = old.get('series', {k: {} for k in NAMES})
    files = old.get('files', {})
    for path, q, year in sorted(set(NOTICE.findall(get(LIST)))):
        period = f'{year}-Q{ROMAN[q]}'
        if period in files:
            continue
        page = get(BASE + path)
        pdf = re.search(r'href="(https://[^"]+phu-luc-1[^"]+\.pdf)"', page)
        if not pdf:
            print(period, 'Phụ lục 1 missing')
            continue
        with tempfile.TemporaryDirectory() as tmp:
            get(pdf.group(1), Path(tmp) / 'p.pdf')
            text = subprocess.run(['pdftotext', '-layout', str(Path(tmp) / 'p.pdf'), '-'], check=True,
                                  capture_output=True, text=True).stdout
        for key, v in parse(text).items():
            S.setdefault(key, {})[period] = v
        files[period] = {'page': BASE + path, 'pdf': pdf.group(1)}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'Sở Xây dựng Hà Nội · công bố giá vật liệu xây dựng (chưa VAT)', 'url': LIST,
                               'names': NAMES, 'units': UNITS, 'files': dict(sorted(files.items())),
                               'series': {k: dict(sorted(v.items())) for k, v in S.items()}},
                              ensure_ascii=False, indent=0) + '\n')
    print({k: v for k, v in S.items()})


if __name__ == '__main__':
    main()
