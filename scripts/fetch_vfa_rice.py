#!/usr/bin/env python3
"""Weekly domestic rice prices from the Vietnam Food Association (VFA, vietfood.org.vn).

VFA posts "Giá lúa gạo nội địa ngày <dd/mm/yyyy>-<dd/mm/yyyy>" with an HTML table of seven Mekong Delta provinces.
The row "5%" under "Gạo TPXK Không Bao Tại Mạn" (5%-broken export-grade rice, unbagged, at the barge) gives the
province prices; the last column "Giá BQ" (average) is kept, in VND/kg, dated by the end date in the post slug.
Posts are found through the WordPress search API and read once; later runs only open new posts.

    python3 scripts/fetch_vfa_rice.py      # writes data/raw/public/vfa-rice-weekly.json
"""
import datetime as dt
import html
import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/vfa-rice-weekly.json'
SEARCH = ('https://vietfood.org.vn/wp-json/wp/v2/posts?search=Gi%C3%A1%20l%C3%BAa%20g%E1%BA%A1o%20n%E1%BB%99i%20%C4%91%E1%BB%8Ba'
          '&per_page=100&page={p}&_fields=date,link')
LIST = 'https://vietfood.org.vn/gia-lua-gao-noi-dia/'
SLUG = re.compile(r'/gia-lua-gao-noi-dia-ngay-\d\d-\d\d-\d{4}-(\d\d)-(\d\d)-(\d{4})/?$')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'


def get(url):
    for i in range(3):
        try:
            return subprocess.run(['curl', '-sfL', '-m', '60', '-A', UA, url], check=True, capture_output=True, text=True).stdout
        except subprocess.CalledProcessError:
            if i == 2:
                raise
            time.sleep(10)


def num(t):
    t = t.strip()  # whole VND; posts use "." or "," as the thousands separator
    return float(re.sub(r'[.,]', '', t)) if re.match(r'^\d{1,3}([.,]\d{3})+$|^\d{4,5}$', t) else None


def parse(page):
    """VND/kg average of the 5% export-grade row, plus the province count behind it."""
    table = re.search(r'<table.*?</table>', page, re.S)
    if not table:
        raise ValueError('table missing')
    section = None
    for row in re.findall(r'<tr.*?</tr>', table.group(0), re.S):
        cells = [html.unescape(re.sub('<[^>]+>', '', c)).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.S)]
        if len(cells) == 1:
            section = cells[0].lower()
        elif cells and cells[0] == '5%' and section and 'tpxk' in section:
            avg = num(cells[-1])
            provinces = [num(c) for c in cells[1:-2:2]]
            if avg is None or not 4000 <= avg <= 40000:
                raise ValueError(f'5% average unreadable: {cells}')
            return avg, sum(v is not None for v in provinces)
    raise ValueError('5% row missing')


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    rec = old.get('records', {})
    links = {}
    for p in range(1, 40):
        try:
            rows = json.loads(get(SEARCH.format(p=p)))
        except subprocess.CalledProcessError:
            break  # past the last page WordPress answers 400
        if not rows:
            break
        for r in rows:
            m = SLUG.search(r['link'])
            if m:
                links[f'{m.group(3)}-{m.group(2)}-{m.group(1)}'] = r['link']
        if rec and min(links, default='9') <= max(rec):
            break  # reached weeks already stored
    errors = {}
    for date, url in sorted(links.items()):
        if date in rec:
            continue
        try:
            avg, n = parse(get(url))
            rec[date] = {'value': avg, 'provinces': n, 'url': url}
        except Exception as e:
            errors[date] = str(e)
        time.sleep(1)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'Hiệp hội Lương thực Việt Nam (VFA) · giá lúa gạo nội địa', 'url': LIST,
                               'definition': 'Gạo thành phẩm xuất khẩu 5% tấm, không bao, tại mạn; bình quân các tỉnh ĐBSCL',
                               'unit': 'VND/kg', 'checked': dt.date.today().isoformat(),
                               'records': dict(sorted(rec.items())), 'errors': errors}, ensure_ascii=False, indent=0) + '\n')
    print(len(rec), max(rec) if rec else None, errors or '')


if __name__ == '__main__':
    main()
