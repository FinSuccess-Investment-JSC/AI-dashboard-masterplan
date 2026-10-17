#!/usr/bin/env python3
"""FDI by industry from the Foreign Investment Agency (Cục Đầu tư nước ngoài, fia.mof.gov.vn) monthly reports.

The "Báo cáo tình hình đầu tư nước ngoài" list page links one article per month; each article attaches a text PDF
("Clean_FDI MM.YYYY (F).pdf") read with `pdftotext -layout`. From each report:
  * total registered capital year to date by industry (new + adjusted + share purchases, mn USD) and its change vs
    the same period last year (the same-period value of last year = value / (1 + change));
  * realized capital year to date; cumulative valid registered capital of real estate (lũy kế còn hiệu lực).
Rows are matched by industry name. Reports accumulate in the output file, so history grows month by month; the
list page shows about nine recent months.

    python3 scripts/fetch_fia.py      # writes data/raw/public/fia-fdi.json
"""
import json, re, subprocess, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/fia-fdi.json'
BASE = 'https://fia.mof.gov.vn'
LIST = BASE + '/List/CatID/5102536e-ffed-4c97-83c9-24788f5e7d0c'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
IND = {'fdi_mfg_ytd': r'công nghiệp chế biến,? chế tạo', 'fdi_re_ytd': r'kinh doanh bất động sản', 'fdi_construction_ytd': r'^\s*xây dựng',
       'fdi_accommodation_ytd': r'lưu trú và ăn uống', 'fdi_transport_ytd': r'vận tải kho bãi', 'fdi_ict_ytd': r'thông tin và truyền thông',
       'fdi_total_ytd': r'^\s*tổng số'}


def get(url, out=None):
    a = ['curl', '-sfL', '-m', '120', '-A', UA, url] + (['-o', out] if out else [])
    return subprocess.run(a, check=True, capture_output=True, text=out is None).stdout


vn = lambda t: float(t.replace('.', '').replace(',', '.'))


def parse(text):
    m = re.search(r'BÁO CÁO NHANH ĐẦU TƯ NƯỚC NGOÀI\s+(\d{1,2})\s+THÁNG\s+NĂM\s+(\d{4})', text, re.I)
    if not m:
        return None, {}
    key, out = f'{m.group(2)}-{int(m.group(1)):02d}', {}
    r = re.search(r'Vốn thực hiện\s+triệu USD\s+([\d.,]+)\s+([\d.,]+)', text)
    if r:
        out['fdi_realized_ytd'] = (vn(r.group(2)), vn(r.group(1)))
    sec = text[text.find('THEO NGÀNH', text.find('THU HÚT') - 400):]
    sec = sec[:sec.find('THEO ĐỐI TÁC')]
    for line in sec.splitlines():
        nums = re.findall(r'-?\d{1,3}(?:\.\d{3})*,\d+|-?\d+', re.sub(r'[↑↓]-?[\d.,]+%', '', line))
        ch = re.search(r'([↑↓])([\d.,]+)%', line)
        name = re.sub(r'^\s*\d+\s+', '', re.split(r'\s{2,}', line.strip())[0] if line.strip() else '').lower()
        for k, rx in IND.items():
            if k not in out and re.search(rx, name) and len(nums) >= 2:
                v = vn(nums[-1])
                c = (1 if ch.group(1) == '↑' else -1) * vn(ch.group(2)) / 100 if ch else None
                out[k] = (v, v / (1 + c) if c is not None and c > -1 else None)
    st = re.search(r'Hoạt động kinh doanh bất động sản\s+[\d.]+\s+([\d.]+,\d+)\s+[\d,]+%', text)
    if st:
        out['fdi_re_stock'] = (vn(st.group(1)), None)
    return key, out


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {'series': {}, 'files': {}}
    S, files = old['series'], old['files']
    ids = sorted(set(re.findall(r'CatID/5102536e-ffed-4c97-83c9-24788f5e7d0c/NewsID/([0-9a-f-]+)', get(LIST))))
    for nid in ids:
        page = get(f'{BASE}/Detail/CatID/5102536e-ffed-4c97-83c9-24788f5e7d0c/NewsID/{nid}/MenuID/')
        pdf = next((p for p in re.findall(r'(/Portals/[^"\']*NewsAttach/[^"\']*\.pdf)', page) if 'FDI' in p), None)
        if not pdf:
            continue
        with tempfile.TemporaryDirectory() as d:
            f = f'{d}/r.pdf'
            get(BASE + pdf.replace(' ', '%20'), f)
            text = subprocess.run(['pdftotext', '-layout', f, '-'], check=True, capture_output=True, text=True).stdout
        key, vals = parse(text)
        if not key:
            continue
        files[key] = BASE + pdf.replace(' ', '%20')
        ly = f'{int(key[:4]) - 1}{key[4:]}'
        for k, (cur, prev) in vals.items():
            S.setdefault(k, {})[key] = round(cur, 2)
            if prev is not None:
                S[k].setdefault(ly, round(prev, 2))  # last year's same period, implied by the reported change
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'Cục Đầu tư nước ngoài · báo cáo tình hình thu hút FDI hằng tháng', 'url': LIST,
                               'files': dict(sorted(files.items())),
                               'series': {k: dict(sorted(v.items())) for k, v in S.items()}}, ensure_ascii=False, indent=0) + '\n')
    print({k: (len(v), list(sorted(v.items()))[-1]) for k, v in S.items()})


if __name__ == '__main__':
    main()
