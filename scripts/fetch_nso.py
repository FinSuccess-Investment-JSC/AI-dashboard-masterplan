#!/usr/bin/env python3
"""Monthly macro series from the NSO (Cục Thống kê) monthly socio-economic workbooks.

Each month NSO attaches an Excel workbook ("02.-Bieu-T<m>.<yyyy>.xlsx", names vary) to its press release; the
WordPress media API lists them. A workbook gives the previous month (sơ bộ) and the current month (ước tính) for
IIP, main industrial products, state-budget investment, retail sales, CPI, freight, visitors and trade. History is
stitched from one workbook per month; a later workbook's "sơ bộ" value replaces the earlier estimate.
Sheets are found by their title row, rows by label; column order is fixed per table type and checked by year.

    python3 scripts/fetch_nso.py [--cache DIR]      # writes data/raw/public/nso-monthly.json
"""
import argparse, json, re, ssl, subprocess, sys, unicodedata, warnings
from pathlib import Path

warnings.filterwarnings('ignore')
import openpyxl  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/nso-monthly.json'
MEDIA = ('https://www.nso.gov.vn/wp-json/wp/v2/media?per_page=100&page={p}&mime_type=application/'
         'vnd.openxmlformats-officedocument.spreadsheetml.sheet&after={y}-01-01T00:00:00&before={y}-12-31T23:59:59'
         '&_fields=date,source_url')
NAME_OK = re.compile(r'(bieu|so-lieu|solieu|bc-so)', re.I)
NAME_BAD = re.compile(r'(EN|En_|_E\.|E\.xlsx|Tables|CPI|IIP|KSMS|SCOLI|XHKD|CNXD|SXKD|baocao|Khung|KTTG|Lao-dong|chuyen-de|'
                      r'Bieu-so-01|Vu-|Tong-quan|Phu-luc|Bieu-mau|Thue|hopbao|VDS|201[5-8]|Bieu-TH\.)', re.I)


def norm(s):
    s = unicodedata.normalize('NFC', str(s or '')).lower()
    return re.sub(r'\s+', ' ', s).strip()


# key -> (table, label regex, field). field: 'cur' value of the current month, 'yoy' current month vs same month
# last year minus 100, 'ytd' year-to-date value, 'idx' index vs base year. Section (for freight) via 'sec:' prefix.
SPEC = {
    'iip_mfg_yoy': ('iip', r'^công nghiệp chế biến,? chế tạo$', 'yoy'),
    'iip_food': ('iip', r'^sản xuất,? chế biến thực phẩm', 'yoy'),
    'iip_bev': ('iip', r'^sản xuất đồ uống', 'yoy'),
    'iip_textile': ('iip', r'^dệt$', 'yoy'),
    'iip_apparel': ('iip', r'^sản xuất trang phục', 'yoy'),
    'iip_nonmetal': ('iip', r'^sản xuất sản phẩm từ khoáng phi kim', 'yoy'),
    'iip_metal': ('iip', r'^sản xuất kim loại$', 'yoy'),
    'iip_pharma': ('iip', r'^sản xuất thuốc', 'yoy'),
    'cement_output': ('prod', r'^xi măng', 'cur'),
    'steel_rolled': ('prod', r'^thép cán', 'cur'),
    'steel_bar': ('prod', r'^thép thanh', 'cur'),
    'beer': ('prod', r'^bia', 'cur'),
    'fresh_milk': ('prod', r'^sữa tươi', 'cur'),
    'milk_powder': ('prod', r'^sữa bột', 'cur'),
    'feed': ('prod', r'^thức ăn cho gia súc', 'cur'),
    'car_output': ('prod', r'^ô tô', 'cur'),
    'moto_output': ('prod', r'^xe máy', 'cur'),
    'fabric_natural': ('prod', r'^vải dệt từ sợi tự nhiên', 'cur'),
    'fabric_synthetic': ('prod', r'^vải dệt từ sợi tổng hợp', 'cur'),
    'garments': ('prod', r'^quần áo mặc thường', 'cur'),
    'pub_inv': ('inv', r'^tổng số', 'cur'),
    'pub_inv_central': ('inv', r'^trung ương', 'cur'),
    'pub_inv_local': ('inv', r'^địa phương', 'cur'),
    'pub_inv_moc': ('inv', r'^bộ xây dựng', 'cur'),
    'retail_total': ('retail', r'^tổng số', 'cur'),
    'retail_goods': ('retail', r'^bán lẻ hàng hóa|^bán lẻ hàng hoá', 'cur'),
    'cpi_yoy': ('cpi', r'^chỉ số giá tiêu dùng', 'yoy'),
    'cpi_food_yoy': ('cpi', r'^hàng ăn và dịch vụ ăn uống', 'yoy'),
    'cpi_bev_yoy': ('cpi', r'^đồ uống và thuốc lá', 'yoy'),
    'cpi_housing_yoy': ('cpi', r'^nhà ở', 'yoy'),
    'cpi_housing_index': ('cpi', r'^nhà ở', 'idx'),
    'cpi_health': ('cpi', r'^thuốc và dịch vụ y tế', 'idx'),
    'cpi_health_yoy': ('cpi', r'^thuốc và dịch vụ y tế', 'yoy'),
    'sea_freight': ('freight', r'sec:1|^đường biển', 'cur'),
    'overseas_freight': ('freight', r'sec:1|^ngoài nước', 'cur'),
    'inland_freight': ('freight', r'sec:1|^đường thủy nội địa|^đường thuỷ nội địa', 'cur'),
    'air_freight': ('freight', r'sec:1|^hàng không', 'cur'),
    'sea_tonkm_ytd': ('freight', r'sec:2|^đường biển', 'ytd'),
    'tourists': ('visitors', r'^tổng số', 'cur'),
}
TITLES = {
    'iip': r'chỉ số sản xuất công nghiệp',
    'prod': r'sản phẩm (công nghiệp )?chủ yếu',
    'inv': r'vốn đầu tư thực hiện từ nguồn ngân sách',
    'retail': r'tổng mức bán lẻ hàng hóa|tổng mức bán lẻ hàng hoá',
    'cpi': r'chỉ số giá tiêu dùng',
    'freight': r'vận tải hàng hoá|vận tải hàng hóa',
    'visitors': r'khách quốc tế',
}


def curl(url, out=None):
    args = ['curl', '-sfL', '-m', '120', url] + (['-o', str(out)] if out else [])
    return subprocess.run(args, check=True, capture_output=True, text=out is None).stdout


def list_workbooks(first_year=2019, last_year=None):
    import datetime as dt
    last_year = last_year or dt.date.today().year
    urls = set()
    for y in range(first_year, last_year + 1):
        for p in range(1, 6):
            try:
                rows = json.loads(curl(MEDIA.format(p=p, y=y)))
            except Exception:
                break
            if not isinstance(rows, list) or not rows:
                break
            urls |= {r['source_url'] for r in rows}
    keep = [u for u in urls if NAME_OK.search(u.rsplit('/', 1)[-1]) and not NAME_BAD.search(u.rsplit('/', 1)[-1])]
    return sorted(keep)


def nums(row):
    return [c for c in row if isinstance(c, (int, float)) and not isinstance(c, bool)]


def label(row):
    s = [c for c in row if isinstance(c, str) and c.strip() and c.strip() not in ('"', "''")]
    s = [x for x in s if not re.match(r'^\s*(trong đó:?)\s*$', x.strip(), re.I)]
    return norm(s[0]) if s else ''


def table_kind(ws):
    head = ' '.join(norm(c) for r in ws.iter_rows(max_row=3, values_only=True) for c in r if c)
    if 'quý' in head or 'lao động' in head:
        return None
    for k, rx in TITLES.items():
        if re.search(rx, head):
            return k
    return None


def report_month(ws_iip):
    """(year, month) of the 'ước tính' month from the IIP header."""
    text = ' '.join(norm(c) for r in ws_iip.iter_rows(max_row=12, values_only=True) for c in r if c)
    ys = [int(y) for y in re.findall(r'năm (20\d\d)', text)]
    ms = [int(m) for m in re.findall(r'(?:ước tính|ước) tháng (\d{1,2})', text)] or [int(m) for m in re.findall(r'tháng (\d{1,2})', text)]
    if not ys or not ms:
        return None
    return max(ys), max(ms)


def headers(ws, rows):
    """Header text per column (merged cells filled across their span), from the rows above the first data row."""
    first = next((i for i, r in enumerate(rows) if len(nums(r)) >= 2 and label(r)), None)
    if first is None:
        return None, []
    grid = [list(r) for r in rows[:first]]
    width = max((len(r) for r in rows[:first + 1]), default=0)
    for g in grid:
        g.extend([None] * (width - len(g)))
    for mr in getattr(ws, 'merged_cells', None).ranges if getattr(ws, 'merged_cells', None) else []:
        if mr.min_row - 1 < len(grid):
            v = grid[mr.min_row - 1][mr.min_col - 1] if mr.min_col - 1 < width else None
            for rr in range(mr.min_row - 1, min(mr.max_row, len(grid))):
                for cc in range(mr.min_col - 1, min(mr.max_col, width)):
                    grid[rr][cc] = v
    grid = [g for g in grid if len({str(x) for x in g if x not in (None, '')}) > 1]  # drop merged title rows
    out = []
    for c in range(width):
        h = ' '.join(norm(int(g[c]) if isinstance(g[c], float) else g[c]) for g in grid if g[c] is not None and (not isinstance(g[c], (int, float)) or 1990 < g[c] < 2100))
        h = re.sub(r'tháng 0(\d)\b', r'tháng \1', h)
        h = re.sub(r'(?<![\d.])(\d{1,2}) tháng', r'ytd\1', h)
        out.append(h)
    return first, out


def columns(kind, hs, y, m):
    pm = 12 if m == 1 else m - 1
    has = lambda h, k: re.search(r'tháng %d\b' % k, h) is not None
    cmp_ = lambda h: 'so với' in h or 'cùng kỳ' in h or '%' in h
    ytd = lambda h: 'ytd' in h or (m == 3 and 'quý i' in h and 'quý ii' not in h) or 'cộng dồn' in h or 'cả năm' in h or (m == 12 and re.search(r'^\W*(ước tính )?năm 20\d\d', h) is not None)
    col = {}
    for i, h in enumerate(hs):
        if not h:
            continue
        if kind == 'cpi':
            if 'kỳ gốc' in h and 'idx' not in col:
                col['idx'] = i
                col['base2024'] = re.search(r'kỳ gốc\W*2024', h) is not None
            elif re.search(r'tháng %d năm( nay so với)? %d' % (m, y - 1), h) and 'yoy' not in col:
                col['yoy'] = i
            if 'idx' in col and 'yoy' not in col and i == col['idx'] + 1 and has(h, m):
                col['yoy'] = i  # 'Tháng m năm' with the year left blank: the column after the base index
            continue
        if ytd(h):
            if not cmp_(h) and 'ytd' not in col:
                col['ytd'] = i
            continue
        if has(h, m) and not cmp_(h) and 'cur' not in col:
            col['cur'] = i
        elif has(h, pm) and not cmp_(h) and pm != m and 'prev' not in col:
            col['prev'] = i
        elif has(h, m) and 'cùng kỳ' in h and 'tháng trước' not in h and 'yoy' not in col:
            col['yoy'] = i
        elif has(h, pm) and 'cùng kỳ' in h and 'pyoy' not in col:
            col['pyoy'] = i
    return col


ROMAN = {3: 'i', 6: 'ii', 9: 'iii', 12: 'iv'}
# key -> (table, label regex, field): field 'q' quarter value, 'ytd' year to date, 'qyoy' quarter vs same quarter last year - 100
QSPEC = {
    'gdp_construction_q': ('gdp_n', r'^xây dựng$', 'q'), 'gdp_construction_nominal': ('gdp_n', r'^xây dựng$', 'ytd'),
    'gdp_construction_real': ('gdp_r', r'^xây dựng$', 'ytd'),
    'gdp_re_q': ('gdp_n', r'^hoạt động kinh doanh bất động sản', 'q'), 'gdp_re_ytd': ('gdp_n', r'^hoạt động kinh doanh bất động sản', 'ytd'),
    'gdp_health': ('gdp_n', r'^y tế và hoạt động trợ giúp xã hội', 'ytd'),
    'ppi_handling': ('ppi_t', r'^dịch vụ bốc xếp', 'qyoy'), 'ppi_warehouse': ('ppi_t', r'^dịch vụ kho bãi', 'qyoy'),
    'ppi_sea': ('ppi_t', r'^dịch vụ vận tải (đường )?ven biển', 'qyoy'), 'ppi_water': ('ppi_t', r'^dịch vụ vận tải đường (thủy|thuỷ)$', 'qyoy'),
}


def quarter_kind(ws):
    head = ' '.join(norm(c) for r in ws.iter_rows(max_row=3, values_only=True) for c in r if c)
    if re.search(r'tổng sản phẩm trong nước', head) and 'grdp' not in head and 'bình quân' not in head:
        return 'gdp_r' if 'so sánh' in head else 'gdp_n' if 'hiện hành' in head else None
    if re.search(r'chỉ số giá (cước )?vận tải', head):
        return 'ppi_t'
    return None


def parse_quarterly(wb, y, m):
    r = ROMAN[m]
    out = {}
    jobs = []
    for ws in wb.worksheets:
        kind = quarter_kind(ws)
        if not kind:
            continue
        head = ' '.join(norm(c) for rr in ws.iter_rows(max_row=8, values_only=True) for c in rr if c)
        if kind.startswith('gdp') and m == 3 and 'hiện hành' in head and 'so sánh' in head:
            jobs += [(ws, 'gdp_n'), (ws, 'gdp_r')]
        else:
            jobs.append((ws, kind))
    for ws, kind in jobs:
        rows = list(ws.iter_rows(values_only=True))
        first, hs = headers(ws, rows)
        if first is None:
            continue
        qrx = re.compile(r'quý %s(?![iv])' % r)
        col = {}
        for i, h in enumerate(hs):
            if not h or 'cơ cấu' in h:
                continue
            cmp_ = 'so với' in h or 'cùng kỳ' in h or '%' in h
            if kind == 'ppi_t':
                if qrx.search(h) and 'năm %d' % (y - 1) in h and 'ytd' not in h and 'qyoy' not in col:
                    col['qyoy'] = i
                elif qrx.search(h) and 'ytd' not in h and 'first_q' not in col:
                    col['first_q'] = i  # year row left blank: the first 'quý r' column is the same quarter last year
                continue
            if m == 3 and 'tổng số' in h and ('hiện hành' in h or 'so sánh' in h):
                if ('hiện hành' in h) == (kind == 'gdp_n') and 'q' not in col:
                    col['q'] = i
                continue
            if cmp_:
                continue
            ytd = 'ytd%d' % m in h or (m == 12 and re.search(r'(cả )?năm 20\d\d', h) and 'quý' not in h)
            if ytd and 'ytd' not in col:
                col['ytd'] = i
            elif qrx.search(h) and 'q' not in col and not ytd:
                col['q'] = i
        if kind == 'ppi_t' and 'qyoy' not in col and 'first_q' in col:
            col['qyoy'] = col['first_q']
        if m == 3:
            col.setdefault('ytd', col.get('q'))
            col.setdefault('q', col.get('ytd'))
        for row in rows[first:]:
            lb = label(row)
            if not lb:
                continue
            for key, (k, rx, field) in QSPEC.items():
                if k != kind or key in out or field not in col or col[field] is None or not re.search(rx, lb):
                    continue
                v = row[col[field]] if col[field] < len(row) else None
                if isinstance(v, (int, float)):
                    out[key] = {'cur': v - 100 if field == 'qyoy' else v}
    return out


def parse(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    sheets = {}
    for ws in wb.worksheets:
        k = table_kind(ws)
        if k and k not in sheets:
            sheets[k] = ws
    if 'iip' not in sheets:
        return None, {}
    rm = report_month(sheets['iip'])
    if not rm:
        return None, {}
    y, m = rm
    out = {}
    for kind, ws in sheets.items():
        rows = list(ws.iter_rows(values_only=True))
        first, hs = headers(ws, rows)
        if first is None:
            continue
        col = columns(kind, hs, y, m)
        sec = 0
        for r in rows[first:]:
            lb = label(r)
            if kind == 'freight' and re.match(r'^i\.\s*vận chuyển', lb):
                sec = 1
            elif kind == 'freight' and re.match(r'^ii\.\s*luân chuyển', lb):
                sec = 2
            if not lb:
                continue
            get = lambda k: r[col[k]] if k in col and col[k] < len(r) and isinstance(r[col[k]], (int, float)) else None
            for key, (k, rx, field) in SPEC.items():
                if k != kind or key in out:
                    continue
                need = None
                if rx.startswith('sec:'):
                    need, rx = int(rx[4]), rx.split('|', 1)[1]
                if need and need != sec:
                    continue
                if not re.search(rx, lb):
                    continue
                if field == 'yoy':
                    cv, pv = get('yoy'), get('pyoy')
                    v = {'cur': cv - 100 if cv is not None else None, 'prev': pv - 100 if pv is not None else None}
                elif field == 'idx':  # index 2024 = 100 only; earlier bases are rebuilt from YoY below
                    v = {'cur': get('idx') if col.get('base2024') else None}
                elif field == 'ytd':
                    v = {'cur': get('ytd') if 'ytd' in col or m != 1 else get('cur')}
                else:
                    cv, yo = get('cur'), get('yoy')
                    v = {'cur': cv, 'prev': get('prev'),
                         'ly': cv / yo * 100 if cv is not None and yo else None}
                if any(x is not None for x in v.values()):
                    out[key] = v
    if m % 3 == 0:
        out.update(parse_quarterly(wb, y, m))
    return rm, out


def ym_prev(y, m):
    return (y - 1, 12) if m == 1 else (y, m - 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', default='/tmp/nso-cache')
    ap.add_argument('--recent', type=int, default=0, help='only workbooks uploaded in the last N days; merge into the existing file')
    a = ap.parse_args()
    cache = Path(a.cache)
    cache.mkdir(parents=True, exist_ok=True)
    files = []
    import datetime as dt
    urls = list_workbooks(first_year=dt.date.today().year - 1) if a.recent else list_workbooks()
    if a.recent:
        cutoff = (dt.date.today() - dt.timedelta(days=a.recent)).strftime('%Y/%m')
        urls = [u for u in urls if u.split('uploads/')[1][:7] >= cutoff]
    for u in urls:
        f = cache / u.split('uploads/')[1].replace('/', '_')
        if not f.exists():
            try:
                curl(u, f)
            except Exception as e:
                print('skip', u, e, file=sys.stderr)
                continue
        files.append((u, f))
    # newest upload per report month wins; within a month estimate < later preliminary
    by_month = {}
    for u, f in files:
        try:
            rm, vals = parse(f)
        except Exception as e:
            print('bad', f.name, e, file=sys.stderr)
            continue
        if rm and vals and (rm not in by_month or u > by_month[rm][0]):
            by_month[rm] = (u, vals)
    # priority: newer workbook wins; within one workbook cur < prev (sơ bộ) < same month last year (current basis)
    old = json.loads(OUT.read_text()) if a.recent and OUT.exists() else {'series': {}, 'files': {}}
    series, src, rank = {k: dict(v) for k, v in old['series'].items()}, dict(old.get('files', {})), {}
    for (y, m) in sorted(by_month):
        u, vals = by_month[(y, m)]
        cur, prev, ly = f'{y}-{m:02d}', '%d-%02d' % ym_prev(y, m), f'{y - 1}-{m:02d}'
        for key, v in vals.items():
            s = series.setdefault(key, {})
            for slot, month, pr in (('cur', cur, 0), ('prev', prev, 1), ('ly', ly, 2)):
                if v.get(slot) is not None:
                    s[month] = round(v[slot], 4)
                    rank[(key, month)] = (y, m, pr)
        src[cur] = u
    for idx, yoy in (('cpi_health', 'cpi_health_yoy'), ('cpi_housing_index', 'cpi_housing_yoy')):
        s, g = series.get(idx, {}), series.get(yoy, {})
        for mth in sorted(set(g) | set(s), reverse=True):  # idx[m-12] = idx[m] / (1 + yoy[m] / 100)
            y, m = map(int, mth.split('-'))
            back = f'{y - 1}-{m:02d}'
            if mth in s and mth in g and back not in s:
                s[back] = round(s[mth] / (1 + g[mth] / 100), 4)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'Cục Thống kê (NSO) · biểu số liệu kinh tế – xã hội hằng tháng',
                               'url': 'https://www.nso.gov.vn/', 'files': src,
                               'series': {k: dict(sorted(v.items())) for k, v in sorted(series.items())}},
                              ensure_ascii=False, indent=0) + '\n')
    print(len(by_month), 'months', min(by_month), max(by_month), {k: len(v) for k, v in series.items()})


if __name__ == '__main__':
    main()
