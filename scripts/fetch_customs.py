#!/usr/bin/env python3
"""Monthly export/import values by commodity and by market from Vietnam Customs (Cục Hải quan) PDF releases.

customs.gov.vn lists every release in a JSON index (`LayDanhSachMoiCongBoServlet`); each entry links the preliminary
(sơ bộ), revised (điều chỉnh) and official (chính thức) PDF. Reports used: 2X / 2N = exports / imports by commodity
for the month; 5X = exports by country × main commodity. The best public file per month wins: official > revised >
preliminary (links on the internal 10.x host are skipped). PDFs are read with `pdftotext -layout`; the month value
is the number right-aligned under the first "Trị giá (USD)" header of each page.

    python3 scripts/fetch_customs.py [--cache DIR] [--since 2019]   # writes data/raw/public/customs-monthly.json
"""
import argparse, json, re, subprocess, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/customs-monthly.json'
INDEX = 'https://www.customs.gov.vn/bridge?url=/customs/api/tkhq/LayDanhSachMoiCongBoServlet&pageSize=5000&language=TIENG_VIET'
PAGE = 'https://www.customs.gov.vn/index.jsp?pageId=4&cid=1294'


def norm(s):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', s or '')).strip().lower()


# key -> (report, country or None, commodity regex, field) ; field 'v' value USD mn, 'q' quantity (tấn / chiếc)
SPEC = {
    'exports': ('2X', None, r'^tổng trị giá', 'v'), 'imports': ('2N', None, r'^tổng trị giá', 'v'),
    'exp_rice': ('2X', None, r'^gạo$', 'v'), 'exp_rice_q': ('2X', None, r'^gạo$', 'q'),
    'exp_coffee': ('2X', None, r'^cà phê$', 'v'), 'exp_coffee_q': ('2X', None, r'^cà phê$', 'q'),
    'exp_rubber': ('2X', None, r'^cao su$', 'v'), 'exp_rubber_q': ('2X', None, r'^cao su$', 'q'),
    'exp_seafood': ('2X', None, r'^hàng thủy sản|^hàng thuỷ sản', 'v'),
    'exp_textile': ('2X', None, r'^hàng dệt,? may', 'v'), 'exp_footwear': ('2X', None, r'^giày dép', 'v'),
    'exp_yarn': ('2X', None, r'^xơ,? sợi dệt', 'v'), 'cement_export': ('2X', None, r'^clanhke và xi măng|^clinker và xi măng', 'v'),
    'steel_export': ('2X', None, r'^sắt thép các loại', 'v'),
    'imp_corn': ('2N', None, r'^ngô', 'v'), 'imp_soy': ('2N', None, r'^đậu tương', 'v'),
    'imp_feed': ('2N', None, r'^thức ăn gia súc', 'v'), 'imp_milk': ('2N', None, r'^sữa và sản phẩm sữa', 'v'),
    'imp_fabric': ('2N', None, r'^vải các loại', 'v'), 'imp_cotton': ('2N', None, r'^bông các loại', 'v'),
    'imp_yarn': ('2N', None, r'^xơ,? sợi dệt', 'v'), 'imp_materials': ('2N', None, r'^nguyên phụ liệu dệt,? may,? da,? giày', 'v'),
    'car_import': ('2N', None, r'^ô tô nguyên chiếc', 'v'), 'import_drugs': ('2N', None, r'^dược phẩm', 'v'),
    'import_api': ('2N', None, r'^nguyên phụ liệu dược phẩm', 'v'),
    'exp_us': ('5X', 'hoa kỳ', r'^hàng thủy sản|^hàng thuỷ sản', 'v'), 'exp_cn': ('5X', 'trung quốc', r'^hàng thủy sản|^hàng thuỷ sản', 'v'),
    'exp_jp': ('5X', 'nhật bản', r'^hàng thủy sản|^hàng thuỷ sản', 'v'), 'exp_kr': ('5X', 'hàn quốc', r'^hàng thủy sản|^hàng thuỷ sản', 'v'),
    'exp_textile_us': ('5X', 'hoa kỳ', r'^hàng dệt,? may', 'v'), 'exp_textile_jp': ('5X', 'nhật bản', r'^hàng dệt,? may', 'v'),
    'exp_textile_kr': ('5X', 'hàn quốc', r'^hàng dệt,? may', 'v'), 'exp_textile_cn': ('5X', 'trung quốc', r'^hàng dệt,? may', 'v'),
    'exp_textile_de': ('5X', 'đức', r'^hàng dệt,? may', 'v'), 'exp_textile_nl': ('5X', 'hà lan', r'^hàng dệt,? may', 'v'),
    'exp_textile_uk': ('5X', r'anh|vương quốc anh', r'^hàng dệt,? may', 'v'), 'exp_textile_ca': ('5X', 'canada|ca-na-đa|canađa', r'^hàng dệt,? may', 'v'),
    'exp_yarn_us': ('5X', 'hoa kỳ', r'^xơ,? sợi dệt', 'v'),
}
NUM = re.compile(r'-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+,\d+|-?\d+')


def tonum(t):
    return float(t.replace('.', '').replace(',', '.'))


def curl(url, out=None):
    args = ['curl', '-sfL', '-m', '120', url] + (['-o', str(out)] if out else [])
    return subprocess.run(args, check=True, capture_output=True, text=out is None).stdout


def pick_file(e):
    for k in ('fileChinhThuc', 'fileDieuChinh', 'fileSoBo'):
        u = e.get(k)
        if u and u.startswith('https://files.customs.gov.vn/'):
            return u, k
    return None, None


def releases(since, recent=0):
    import datetime as dt
    rows = json.loads(curl(INDEX))['data']
    if recent:
        cut = dt.date.today() - dt.timedelta(days=recent)
        when = lambda x: dt.datetime.strptime(x, '%d/%m/%Y').date() if x else dt.date.min
        rows = [e for e in rows if max(when(e.get('ngaySoBo')), when(e.get('ngayDieuChinh')) if e.get('fileDieuChinh') else dt.date.min,
                                       when(e.get('ngayChinhThuc')) if str(e.get('fileChinhThuc') or '').startswith('https://files.') else dt.date.min) >= cut]
    out, alt = {}, []
    for e in rows:
        m = re.search(r'tháng (\d{1,2})/(\d{4})', e.get('tieuDe') or '')
        u, kind = pick_file(e)
        if not m or not u:
            continue
        code = re.search(r'-(2X|2N|5X)\(', u, re.I)
        if not code:
            continue
        y, mo = int(m.group(2)), int(m.group(1))
        if y < since:
            continue
        out[(code.group(1).upper(), y, mo)] = (u, kind)
        if code.group(1).upper() == '2X':
            alt.append(((y, mo), e))
    for (y, mo), e in alt:  # some months list no 2N entry; the file sits next to the 2X file with the same name pattern
        if ('2N', y, mo) in out:
            continue
        for k in ('fileChinhThuc', 'fileDieuChinh', 'fileSoBo'):
            u = e.get(k) or ''
            if not u.startswith('https://files.customs.gov.vn/'):
                continue
            cand = u.replace('-2X(', '-2N(').replace('-2x(', '-2n(')
            if subprocess.run(['curl', '-sfI', '-m', '30', cand], capture_output=True).returncode == 0:
                out[('2N', y, mo)] = (cand, k)
                break
    return out


def lines(pdf):
    return subprocess.run(['pdftotext', '-layout', str(pdf), '-'], check=True, capture_output=True, text=True).stdout.split('\n')


def parse(pdf, report):
    """{(country or None, label): (qty, value_usd)} for the month columns."""
    out, col, country = {}, None, None
    for ln in lines(pdf):
        if 'Trị giá (USD)' in ln:
            col = ln.index('Trị giá (USD)') + len('Trị giá (USD)')  # right edge of the month value column
            qcol = ln.rfind('Lượng', 0, ln.index('Trị giá (USD)'))
            continue
        if col is None or not ln.strip():
            continue
        nums = [(m.group(), m.end()) for m in NUM.finditer(ln)]
        text = NUM.sub(' ', ln)
        name = norm(re.sub(r'^\s*\d+\s+', '', text).replace(' USD', ' ').replace(' Tấn', ' ').replace(' Chiếc', ' '))
        name = re.sub(r'\s+(usd|tấn|chiếc|kg|lít|m3)\s*$', '', name).strip(' -')
        if not name or not nums:
            continue
        val = next((tonum(t) for t, e in nums if abs(e - col) <= 6), None)
        vi = next((i for i, (t, e) in enumerate(nums) if abs(e - col) <= 6), None)
        qty = tonum(nums[vi - 1][0]) if vi and re.search(r'\s(Tấn|Chiếc|Kg|Lít)\s', ln) else None
        if report == '5X':
            raw = re.sub(r'^\s+', '', NUM.sub('', ln)).strip()
            if raw and raw == raw.upper() and not re.search(r'(USD|Tấn|Chiếc)\s*$', raw) and len(nums) <= 2:
                country = norm(raw)
                continue
            key = (country, name)
        else:
            key = (None, name)
        if key not in out and val is not None:
            out[key] = (qty, val)
    return out


def lookup(table, country, rx):
    for (c, name), v in table.items():
        if country is None and c is not None:
            continue
        if country is not None and (c is None or not re.fullmatch(country, c)):
            continue
        if re.search(rx, name):
            return v
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', default='/tmp/customs-cache')
    ap.add_argument('--since', type=int, default=2019)
    ap.add_argument('--recent', type=int, default=0, help='only releases published in the last N days; merge into the existing file')
    a = ap.parse_args()
    cache = Path(a.cache)
    cache.mkdir(parents=True, exist_ok=True)
    rel = releases(a.since, a.recent)
    old = json.loads(OUT.read_text()) if a.recent and OUT.exists() else {'series': {}, 'files': {}}
    series, files = {k: dict(v) for k, v in old['series'].items()}, dict(old.get('files', {}))
    for (report, y, m), (u, kind) in sorted(rel.items()):
        f = cache / re.sub(r'[^\w.()-]', '_', u.split('TONG_CUC/')[-1])
        if not f.exists():
            try:
                curl(u, f)
            except Exception as e:
                print('skip', u, e, file=sys.stderr)
                continue
        try:
            table = parse(f, report)
        except Exception as e:
            print('bad', f, e, file=sys.stderr)
            continue
        month = f'{y}-{m:02d}'
        files.setdefault(month, {})[report] = {'url': u, 'status': kind}
        for key, (rep, country, rx, field) in SPEC.items():
            if rep != report:
                continue
            v = lookup(table, country, rx)
            if v is None:
                continue
            x = v[1] / 1e6 if field == 'v' else v[0]
            if x is not None:
                series.setdefault(key, {})[month] = round(x, 4)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'Cục Hải quan · số liệu thống kê xuất nhập khẩu hằng tháng', 'url': PAGE,
                               'files': files, 'series': {k: dict(sorted(v.items())) for k, v in sorted(series.items())}},
                              ensure_ascii=False, indent=0) + '\n')
    print(len(files), 'months', {k: len(v) for k, v in series.items()})


if __name__ == '__main__':
    main()
