#!/usr/bin/env python3
"""Weekly farm-gate seafood prices in Đồng Tháp from VASEP (vasep.com.vn, "Giá trong nước").

VASEP posts "Giá nguyên liệu thủy sản tại Đồng Tháp từ <dd/mm> – <dd/mm/yyyy>" each week with an HTML table
(item, size, price range in VND/kg, change). Kept rows, as the midpoint of the range in thousand VND/kg:
  * pangasius: "Cá tra thịt trắng" (raw white-flesh pangasius);
  * pangasius_fry: "Cá tra giống";
  * shrimp: "Tôm chân trắng" (whiteleg shrimp; the size band is stored because VASEP quotes a wide band).
Records are dated by the week's end date; posts already stored are not reopened.

    python3 scripts/fetch_vasep_prices.py      # writes data/raw/public/vasep-dongthap-weekly.json
"""
import datetime as dt
import html
import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/vasep-dongthap-weekly.json'
LIST = 'https://vasep.com.vn/gia-thuy-san/gia-trong-nuoc?trang={p}'
LINK = re.compile(r'https://vasep\.com\.vn/gia-thuy-san/gia-trong-nuoc/gia-nguyen-lieu-thuy-san-tai-dong-thap-tu-'
                  r'[0-9-]*?-(\d{1,2})-(\d{1,2})-(\d{4})-\d+\.html')
ROWS = {'pangasius': r'^cá tra thịt trắng', 'pangasius_fry': r'^cá tra giống', 'shrimp': r'^tôm chân trắng'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'


def get(url):
    for i in range(3):
        try:
            return subprocess.run(['curl', '-sfL', '-m', '60', '-A', UA, url], check=True, capture_output=True, text=True).stdout
        except subprocess.CalledProcessError:
            if i == 2:
                raise
            time.sleep(10)


def midpoint(text):
    vals = [float(v.replace('.', '').replace(',', '')) for v in re.findall(r'\d{1,3}(?:[.,]\d{3})+', text)]
    if not 1 <= len(vals) <= 2 or not all(1000 <= v <= 1_000_000 for v in vals):
        raise ValueError(f'price unreadable: {text!r}')
    return round(sum(vals) / len(vals) / 1000, 2)


def parse(page):
    table = re.search(r'<table.*?</table>', page, re.S)
    if not table:
        raise ValueError('table missing')
    out = {}
    for row in re.findall(r'<tr.*?</tr>', table.group(0), re.S):
        c = [re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', '', x))).strip() for x in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.S)]
        if len(c) < 3:
            continue
        for key, pat in ROWS.items():
            if key not in out and re.search(pat, c[0], re.I):
                out[key] = {'value': midpoint(c[2]), 'size': c[1], 'range': c[2]}
    if 'pangasius' not in out:
        raise ValueError('pangasius row missing')
    return out


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    S = old.get('series', {k: {} for k in ROWS})
    seen = set(old.get('urls', []))
    links = {}
    for p in range(1, 120):
        page = get(LIST.format(p=p))
        found = {f'{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}': m.group(0) for m in LINK.finditer(page)}
        if not found:
            break
        new = {d: u for d, u in found.items() if u not in seen}
        links.update(new)
        if seen and not new:
            break  # reached posts already stored
        time.sleep(1)
    errors = {}
    for date, url in sorted(links.items()):
        try:
            for k, v in parse(get(url)).items():
                S.setdefault(k, {})[date] = {**v, 'url': url}
            seen.add(url)
        except Exception as e:
            errors[date] = str(e)
        time.sleep(1)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'VASEP · giá nguyên liệu thủy sản tại Đồng Tháp (tuần)',
                               'url': 'https://vasep.com.vn/gia-thuy-san/gia-trong-nuoc', 'unit': 'nghìn VND/kg (điểm giữa khoảng giá)',
                               'checked': dt.date.today().isoformat(), 'series': {k: dict(sorted(v.items())) for k, v in S.items()},
                               'urls': sorted(seen), 'errors': errors}, ensure_ascii=False, indent=0) + '\n')
    print({k: (len(v), max(v) if v else None) for k, v in S.items()}, errors or '')


if __name__ == '__main__':
    main()
