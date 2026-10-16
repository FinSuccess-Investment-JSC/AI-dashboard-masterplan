#!/usr/bin/env python3
"""Build data/<sector>-public-data.(json|js): commodity series for sector dashboards from public sources only.

Sources: IMF Primary Commodity Prices via FRED CSV (monthly average, no key) and month-end values of the
daily public feeds already kept in data/daily-data.js (EIA Brent, ICE sugar No.11 front future, ICE Newcastle).
Macro (NSO/customs/SBV) and sector valuation aggregates have no public replacement yet: those blocks are absent
and the pages show '—'. Unit conversions are stated per series.
"""
import csv, datetime as dt, io, json, ssl, sys, time, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sector_valuation_public as SV  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
FRED = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id={}'
IMF = 'IMF Primary Commodity Prices (FRED), bình quân tháng'
# key: (kind, id, name, unit, factor)
SERIES = {
    'palm_oil': ('fred', 'PPOILUSDM', 'Dầu cọ (IMF, bình quân tháng)', 'USD/tấn', 1),
    'soymeal': ('fred', 'PSMEAUSDM', 'Khô đậu tương (IMF, bình quân tháng)', 'USD/tấn', 1),
    'corn': ('fred', 'PMAIZMTUSDM', 'Ngô (IMF, bình quân tháng)', 'US cent/bushel', 2.54012),  # USD/t -> cents/bu (25.4012 kg/bu)
    'robusta': ('fred', 'PCOFFROBUSDM', 'Cà phê Robusta (IMF, bình quân tháng)', 'USD/tấn', 22.0462),  # cents/lb -> USD/t
    'cotton_ice': ('fred', 'PCOTTINDUSDM', 'Bông Cotlook A (IMF, bình quân tháng)', 'US cent/pound', 1),
    'sugar': ('feed', 'sugar_futures', 'Đường thô ICE No.11 (hợp đồng gần, cuối tháng)', 'US cent/pound', 1),
    'brent': ('feed', 'brent', 'Dầu Brent (EIA, cuối tháng)', 'USD/thùng', 1),
    'coal_newcastle': ('feed', 'coal_newcastle', 'Than Newcastle (ICE, cuối tháng)', 'USD/tấn', 1),
}
SECTORS = {
    'retail': ['sugar', 'palm_oil', 'soymeal', 'corn'],
    'agri': ['corn', 'soymeal', 'robusta'],
    'seafood': ['soymeal', 'corn'],
    'textile': ['cotton_ice'],
    'shipping': ['brent'],
    'construction': [],
    'port': [], 'pharma': [], 'insurance': [], 'realestate': [],
}
GLOBAL = {s: s.upper() + '_PUBLIC' for s in SECTORS}
SINCE = '2023-01-01'


def http(url):
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        ctx = ssl.create_default_context()
    import subprocess
    try:  # FRED often stalls urllib clients; curl is reliable
        return subprocess.run(['curl', '-sfL', '-m', '60', url], check=True, capture_output=True, text=True).stdout
    except Exception:
        pass
    for i in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40, context=ctx).read().decode()
        except Exception:
            if i == 2:
                raise
            time.sleep(3)


def feeds():
    s = (ROOT / 'data/daily-data.js').read_text()
    return json.loads(s[s.index('{'):s.rstrip().rstrip(';').rindex('}') + 1])['sources']


def build_series(key, cache, F):
    kind, sid, name, unit, k = SERIES[key]
    if kind == 'fred':
        if sid not in cache:
            rows = list(csv.reader(io.StringIO(http(FRED.format(sid)))))[1:]
            cache[sid] = [(d, float(v)) for d, v in rows if v not in ('', '.')]
        recs = [{'date': d, 'value': round(v * k, 2)} for d, v in cache[sid] if d >= SINCE]
        src, url = IMF, f'https://fred.stlouisfed.org/series/{sid}'
    else:
        f = F.get(sid) or {}
        last = {}
        for r in f.get('records') or []:
            if r.get('value') is not None and r['date'] >= SINCE:
                last[r['date'][:7]] = r
        recs = [{'date': r['date'], 'value': round(r['value'] * k, 2)} for _, r in sorted(last.items())]
        src, url = f.get('source_name'), f.get('source_url')
    return {'name': name, 'unit': unit, 'time_type': 'monthly', 'source': src, 'url': url, 'records': recs}


def main():
    F, cache, vcache = feeds(), {}, {}
    now = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    for sector, keys in SECTORS.items():
        series = {k: build_series(k, cache, F) for k in keys}
        blocks = {'commodity': {'series': series, 'captured_at': now[:10]}} if series else {}
        verr = {}
        sr = SV.build(sector, vcache, verr)
        if sr and sr['by_sector']:
            sr['captured_at'], sr['errors'] = now[:10], verr
            blocks['sector_ratio'] = sr
        bundle = {'schema': 1, 'built_at': now, 'provider': 'Nguồn công khai (IMF/FRED, EIA, ICE, VNDirect)', 'blocks': blocks,
                  'absent': [k for k in ('macro', 'sector_ratio', 'commodity') if k not in blocks],
                  'note': 'Số vĩ mô, xuất nhập khẩu và định giá tổng hợp ngành chưa có nguồn công khai thay thế; để trống.'}
        text = json.dumps(bundle, ensure_ascii=False, separators=(',', ':'))
        (ROOT / f'data/{sector}-public-data.json').write_text(text + '\n')
        (ROOT / f'data/{sector}-public-data.js').write_text(f'window.{GLOBAL[sector]} = ' + text.replace('<', '\\u003c') + ';\n')
        print(sector, {k: (len(v['records']), v['records'][-1]['date'] if v['records'] else None) for k, v in series.items()},
              {i: (len(b['records']), b['records'][-1][0]) for i, b in (sr or {}).get('by_sector', {}).items()}, verr or '')
    return 0


if __name__ == '__main__':
    sys.exit(main())
