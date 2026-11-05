#!/usr/bin/env python3
"""Drug tender awards published by the Drug Administration of Vietnam (Cục Quản lý Dược), aggregated for the
Pharma dashboard.

Source: the public JSON API behind https://dichvucong.dav.gov.vn/congbotrungthau (no login):
    POST https://dichvucong.dav.gov.vn/api/services/app/davCongBoTrungThauThuoc/frontEnd_GetAllServerPaging
    body {"skipCount": <offset>, "maxResultCount": <page size>}
Records come newest first (ngayQDTrungThau desc); ~200k rows, ~5000 rows ≈ 40 s. One record = one drug line of one
award decision: tenThuoc, hoatChat, coSoSanXuat, nuocSanXuat, tenNhaThau (bidder), tenGoiThuoc (Nhóm 1–5 of
TT 07/2024 → TT 40/2025), soLuong, donGia, thanhTien (VND), ngayQDTrungThau, tenBenhVien_SoYTe.

Output data/raw/public/dav-tenders.json (compact, no row-level data):
  quarters            quarter -> {value (VND), n}
  by_group_origin     quarter -> group -> {vn: {value,n}, foreign: {value,n}}   (nuocSanXuat == Việt Nam)
  by_ticker           ticker -> quarter -> group -> {value,n}                    (bidder name matched to TICKERS)
  ticker_names        ticker -> {raw bidder name: n}                              (audit of the mapping)
  top_bidders         [{name, value, n}]  top 40 bidders over the fetched window
  coverage            {from, to, fetched, total_count, complete}
Dates are award-decision dates; value is thanhTien as published (VND, incl. lines with quantity 0 → value 0).

    python3 scripts/fetch_dav_tenders.py [--page-size 5000] [--max-pages N] [--cache DIR] [--offline]
`--offline` re-aggregates cached pages without hitting the API. dav.gov.vn opens from Vietnam; a GitHub runner
may be blocked (then keep the last-good file).
"""
import argparse, json, re, subprocess, sys, tempfile, time, unicodedata, datetime as dt
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/dav-tenders.json'
API = 'https://dichvucong.dav.gov.vn/api/services/app/davCongBoTrungThauThuoc/frontEnd_GetAllServerPaging'
PAGE = 'https://dichvucong.dav.gov.vn/congbotrungthau'

# Listed company -> legal-name patterns (matched on NFC, upper-cased, whitespace-collapsed tenNhaThau).
# DVN = Tổng công ty Dược Việt Nam và hai công ty con hợp nhất (CPC1, Codupha); công ty liên kết (Sanofi VN, IMP) không tính.
TICKERS = {
    'DHG': [r'DƯỢC HẬU GIANG'],
    'IMP': [r'(?<![A-Z])IMEXPHARM'],
    'DBD': [r'BIDIPHAR', r'TRANG THIẾT BỊ Y TẾ BÌNH ĐỊNH', r'TTBYT BÌNH ĐỊNH'],
    'TRA': [r'TRAPHACO'],
    'DMC': [r'DOMESCO'],
    'DVN': [r'TỔNG CÔNG TY DƯỢC VIỆT NAM', r'DƯỢC PHẨM TRUNG ƯƠNG CPC1', r'CODUPHA'],
}
TICKER_RE = {k: re.compile('|'.join(v)) for k, v in TICKERS.items()}
GROUPS = ['Nhóm 1', 'Nhóm 2', 'Nhóm 3', 'Nhóm 4', 'Nhóm 5']


def norm(s):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', str(s or ''))).strip()


def ticker_of(name):
    u = norm(name).upper()
    for k, rx in TICKER_RE.items():
        if rx.search(u):
            return k
    return None


def quarter_of(stamp):
    d = dt.date.fromisoformat(stamp[:10])
    return f'{d.year}-Q{(d.month - 1) // 3 + 1}', d


def post(skip, size, tries=3):
    body = json.dumps({'skipCount': skip, 'maxResultCount': size})
    for i in range(tries):
        try:
            r = subprocess.run(['curl', '-sf', '-m', '300', '-X', 'POST', '-H', 'Content-Type: application/json',
                                '-H', 'Accept: application/json', '-A', 'Mozilla/5.0', '-d', body, API],
                               check=True, capture_output=True, text=True)
            data = json.loads(r.stdout)
            res = data['result']
            if not isinstance(res.get('items'), list) or not isinstance(res.get('totalCount'), int):
                raise ValueError('schema changed')
            return res
        except Exception as exc:
            if i == tries - 1:
                raise
            print(f'retry {i + 1} at skip={skip}: {exc}', file=sys.stderr)
            time.sleep(5 * (i + 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--page-size', type=int, default=5000)
    ap.add_argument('--max-pages', type=int, default=0, help='0 = all pages')
    ap.add_argument('--cache', default=str(Path(tempfile.gettempdir()) / 'dav-tenders'))
    ap.add_argument('--offline', action='store_true')
    a = ap.parse_args()
    cache = Path(a.cache); cache.mkdir(parents=True, exist_ok=True)

    def cell():
        return {'value': 0.0, 'n': 0}
    quarters, group_origin, by_ticker = defaultdict(cell), defaultdict(lambda: defaultdict(lambda: {'vn': cell(), 'foreign': cell()})), defaultdict(lambda: defaultdict(lambda: defaultdict(cell)))
    names, bidders = defaultdict(lambda: defaultdict(int)), defaultdict(cell)
    seen, dmin, dmax, total = set(), None, None, None
    skip, page, fetched = 0, 0, 0
    while True:
        f = cache / f'page-{a.page_size}-{skip}.json'
        if f.exists():
            res = json.loads(f.read_text())
        elif a.offline:
            break
        else:
            res = post(skip, a.page_size)
            f.write_text(json.dumps(res, ensure_ascii=False))
        total = res['totalCount']
        items = res['items']
        for it in items:
            if it.get('isDeleted') or it['id'] in seen:
                continue
            seen.add(it['id'])
            q, d = quarter_of(it['ngayQDTrungThau'])
            dmin, dmax = min(dmin or d, d), max(dmax or d, d)
            v = float(it.get('thanhTien') or 0)
            g = norm(it.get('tenGoiThuoc'))
            g = g if g in GROUPS else 'Khác'
            origin = 'vn' if norm(it.get('nuocSanXuat')).lower() in ('việt nam', 'viet nam', 'vietnam') else 'foreign'
            quarters[q]['value'] += v; quarters[q]['n'] += 1
            go = group_origin[q][g][origin]; go['value'] += v; go['n'] += 1
            name = norm(it.get('tenNhaThau'))
            b = bidders[name.upper()]; b['value'] += v; b['n'] += 1
            t = ticker_of(name)
            if t:
                c = by_ticker[t][q][g]; c['value'] += v; c['n'] += 1
                names[t][name] += 1
        fetched += len(items); page += 1; skip += a.page_size
        print(f'page {page}: {fetched}/{total} rows, {dmin}..{dmax}', file=sys.stderr)
        if not items or skip >= total or (a.max_pages and page >= a.max_pages):
            break
    if not fetched:
        sys.exit('no rows fetched')
    rnd = lambda c: {'value': round(c['value']), 'n': c['n']}
    out = {
        'source': 'Cục Quản lý Dược · công bố kết quả trúng thầu thuốc', 'url': PAGE, 'api': API,
        'checked': dt.datetime.now().astimezone().isoformat(timespec='seconds'),
        'unit': 'VND (thanhTien)', 'groups': GROUPS, 'tickers': {k: v for k, v in TICKERS.items()},
        'coverage': {'from': dmin.isoformat(), 'to': dmax.isoformat(), 'fetched': fetched, 'total_count': total,
                     'complete': fetched >= (total or 0)},
        'quarters': {q: rnd(c) for q, c in sorted(quarters.items())},
        'by_group_origin': {q: {g: {o: rnd(c) for o, c in og.items()} for g, og in sorted(gs.items())} for q, gs in sorted(group_origin.items())},
        'by_ticker': {t: {q: {g: rnd(c) for g, c in sorted(gs.items())} for q, gs in sorted(qs.items())} for t, qs in sorted(by_ticker.items())},
        'ticker_names': {t: dict(sorted(n.items(), key=lambda x: -x[1])) for t, n in sorted(names.items())},
        'top_bidders': [{'name': k, **rnd(c)} for k, c in sorted(bidders.items(), key=lambda x: -x[1]['value'])[:40]],
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print(f'wrote {OUT} · {fetched} rows · {dmin}..{dmax} · complete={out["coverage"]["complete"]}')


if __name__ == '__main__':
    main()
