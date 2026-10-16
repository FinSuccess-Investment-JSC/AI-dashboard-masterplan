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
    'tsr20': ('fred', 'PRUBBUSDM', 'Cao su (IMF, Singapore/Malaysia, bình quân tháng)', 'US cent/kg', 2.20462),  # cents/lb -> cents/kg
    'iron_ore': ('fred', 'PIORECRUSDM', 'Quặng sắt (IMF, CFR Trung Quốc, bình quân tháng)', 'USD/tấn', 1),
    'cotton_ice': ('fred', 'PCOTTINDUSDM', 'Bông Cotlook A (IMF, bình quân tháng)', 'US cent/pound', 1),
    'sugar': ('feed', 'sugar_futures', 'Đường thô ICE No.11 (hợp đồng gần, cuối tháng)', 'US cent/pound', 1),
    'brent': ('feed', 'brent', 'Dầu Brent (EIA, cuối tháng)', 'USD/thùng', 1),
    'coal_newcastle': ('feed', 'coal_newcastle', 'Than Newcastle (ICE, cuối tháng)', 'USD/tấn', 1),
}
SECTORS = {
    'retail': ['sugar', 'palm_oil', 'soymeal', 'corn'],
    'agri': ['corn', 'soymeal', 'robusta', 'tsr20'],
    'seafood': ['soymeal', 'corn'],
    'textile': ['cotton_ice'],
    'shipping': ['brent'],
    'construction': ['iron_ore', 'coal_newcastle'],
    'port': [], 'pharma': [], 'insurance': [], 'realestate': [],
}
GLOBAL = {s: s.upper() + '_PUBLIC' for s in SECTORS}
SINCE = '2023-01-01'


# Macro series from data/raw/public/nso-monthly.json (scripts/fetch_nso.py). js key -> (nso key, name, unit, factor)
NSO_FILE = ROOT / 'data/raw/public/nso-monthly.json'
NSO = {
    'retail_goods': ('retail_goods', 'Bán lẻ hàng hóa', 'tỷ VND', 1), 'retail_total': ('retail_total', 'Tổng mức bán lẻ hàng hóa và doanh thu dịch vụ', 'tỷ VND', 1),
    'cpi_food': ('cpi_food_yoy', 'CPI hàng ăn và dịch vụ ăn uống, so cùng kỳ', '%', 1), 'cpi_food_yoy': ('cpi_food_yoy', 'CPI hàng ăn và dịch vụ ăn uống, so cùng kỳ', '%', 1),
    'cpi_bev': ('cpi_bev_yoy', 'CPI đồ uống và thuốc lá, so cùng kỳ', '%', 1), 'cpi_bev_yoy': ('cpi_bev_yoy', 'CPI đồ uống và thuốc lá, so cùng kỳ', '%', 1),
    'cpi_yoy': ('cpi_yoy', 'CPI so cùng kỳ', '%', 1),
    'cpi_housing_yoy': ('cpi_housing_yoy', 'CPI nhóm nhà ở, điện, nước, chất đốt và VLXD, so cùng kỳ', '%', 1),
    'cpi_housing_index': ('cpi_housing_index', 'CPI nhóm nhà ở, điện, nước, chất đốt và VLXD (2024 = 100)', 'chỉ số', 1),
    'cpi_health': ('cpi_health', 'CPI thuốc và dịch vụ y tế (2024 = 100)', 'chỉ số 2024=100', 1),
    'beer': ('beer', 'Sản lượng bia', 'triệu lít', 1), 'beer_output': ('beer', 'Sản lượng bia', 'triệu lít', 1),
    'fresh_milk': ('fresh_milk', 'Sản lượng sữa tươi', 'triệu lít', 1), 'milk_output': ('fresh_milk', 'Sản lượng sữa tươi', 'triệu lít', 1),
    'milk_powder': ('milk_powder', 'Sản lượng sữa bột', 'nghìn tấn', 1), 'milkpowder_output': ('milk_powder', 'Sản lượng sữa bột', 'nghìn tấn', 1),
    'feed': ('feed', 'Sản lượng thức ăn gia súc', 'nghìn tấn', 1),
    'iip_food': ('iip_food', 'IIP chế biến thực phẩm, so cùng kỳ', '%', 1), 'iip_bev': ('iip_bev', 'IIP sản xuất đồ uống, so cùng kỳ', '%', 1),
    'iip_mfg_yoy': ('iip_mfg_yoy', 'IIP công nghiệp chế biến, chế tạo, so cùng kỳ', '%', 1),
    'iip_nonmetal': ('iip_nonmetal', 'IIP khoáng phi kim loại, so cùng kỳ', '%', 1), 'iip_metal': ('iip_metal', 'IIP sản xuất kim loại, so cùng kỳ', '%', 1),
    'iip_textile': ('iip_textile', 'IIP ngành dệt, so cùng kỳ', '%', 1), 'iip_apparel': ('iip_apparel', 'IIP sản xuất trang phục, so cùng kỳ', '%', 1),
    'iip_pharma': ('iip_pharma', 'IIP sản xuất thuốc, hóa dược và dược liệu', '% so cùng kỳ', 1),
    'pub_inv': ('pub_inv', 'Vốn đầu tư thực hiện từ NSNN trong tháng', 'tỷ VND', 1), 'pub_inv_central': ('pub_inv_central', 'Vốn NSNN Trung ương trong tháng', 'tỷ VND', 1),
    'pub_inv_local': ('pub_inv_local', 'Vốn NSNN Địa phương trong tháng', 'tỷ VND', 1), 'pub_inv_moc': ('pub_inv_moc', 'Vốn NSNN Bộ Xây dựng trong tháng', 'tỷ VND', 1),
    'cement_output': ('cement_output', 'Sản lượng xi măng', 'triệu tấn', 1), 'steel_rolled': ('steel_rolled', 'Sản lượng thép cán', 'nghìn tấn', 1),
    'steel_bar': ('steel_bar', 'Sản lượng thép thanh, thép góc', 'nghìn tấn', 1),
    'car_output': ('car_output', 'Sản lượng sản xuất ô tô', 'nghìn chiếc', 1), 'moto_output': ('moto_output', 'Sản lượng sản xuất xe máy', 'nghìn chiếc', 1),
    'sea_freight': ('sea_freight', 'Vận chuyển hàng hóa đường biển', 'nghìn tấn', 1), 'overseas_freight': ('overseas_freight', 'Vận chuyển hàng hóa ngoài nước', 'nghìn tấn', 1),
    'air_freight': ('air_freight', 'Vận chuyển hàng hóa hàng không', 'nghìn tấn', 1), 'inland_freight': ('inland_freight', 'Vận chuyển hàng hóa đường thủy nội địa', 'nghìn tấn', 1),
    'sea_tonkm_ytd': ('sea_tonkm_ytd', 'Luân chuyển hàng hóa đường biển (lũy kế)', 'triệu tấn.km', 1),
    'tourists': ('tourists', 'Khách quốc tế', 'nghìn lượt', 0.001),
    'fabric_natural': ('fabric_natural', 'Sản lượng vải dệt từ sợi tự nhiên', 'triệu m²', 1), 'fabric_synthetic': ('fabric_synthetic', 'Sản lượng vải dệt từ sợi tổng hợp, nhân tạo', 'triệu m²', 1),
    'garments': ('garments', 'Sản lượng quần áo mặc thường', 'triệu cái', 1),
}
MACRO = {
    'agri': ['retail_goods', 'cpi_food', 'cpi_bev', 'beer', 'fresh_milk', 'milk_powder', 'feed', 'iip_food', 'iip_bev'],
    'construction': ['pub_inv', 'pub_inv_central', 'pub_inv_local', 'pub_inv_moc', 'cement_output', 'steel_rolled', 'steel_bar', 'iip_nonmetal', 'iip_metal'],
    'insurance': ['car_output', 'moto_output'],
    'port': ['sea_freight', 'overseas_freight', 'air_freight', 'inland_freight'],
    'realestate': ['cpi_housing_index', 'cpi_housing_yoy', 'iip_mfg_yoy'],
    'retail': ['retail_total', 'retail_goods', 'cpi_yoy', 'tourists', 'cpi_food_yoy', 'cpi_bev_yoy', 'beer_output', 'milk_output', 'milkpowder_output', 'iip_food', 'iip_bev', 'car_output', 'moto_output'],
    'seafood': ['iip_food'],
    'shipping': ['sea_freight', 'overseas_freight', 'sea_tonkm_ytd'],
    'textile': ['fabric_natural', 'fabric_synthetic', 'garments', 'iip_textile', 'iip_apparel'],
    'pharma': ['iip_pharma', 'cpi_health'],
}


def macro_series(sector):
    if not NSO_FILE.exists():
        return {}
    d = json.loads(NSO_FILE.read_text())
    d['url'] = d['files'][max(d['files'])] if d.get('files') else d['url']  # latest monthly workbook
    out = {}
    for k in MACRO.get(sector, []):
        nk, name, unit, f = NSO[k]
        recs = [{'date': m + '-01', 'value': round(v * f, 4)} for m, v in sorted(d['series'].get(nk, {}).items())]
        if recs:
            out[k] = {'name': name, 'unit': unit, 'time_type': 'monthly', 'source': d['source'], 'url': d['url'], 'records': recs}
    if sector == 'construction' and 'pub_inv' in out:  # month vs same month last year, from the levels
        lv = {r['date']: r['value'] for r in out['pub_inv']['records']}
        recs = [{'date': dte, 'value': round((v / lv[f'{int(dte[:4]) - 1}{dte[4:]}'] - 1) * 100, 2)}
                for dte, v in lv.items() if lv.get(f'{int(dte[:4]) - 1}{dte[4:]}')]
        out['pub_inv_yoy'] = {'name': 'Vốn đầu tư từ NSNN trong tháng, so cùng kỳ', 'unit': '%', 'time_type': 'monthly',
                              'source': d['source'], 'url': d['url'], 'records': recs}
    return out


CUSTOMS_FILE = ROOT / 'data/raw/public/customs-monthly.json'
SHFE_FILE = ROOT / 'data/raw/public/shfe-monthly.json'
CUS_NAMES = {
    'exports': 'Xuất khẩu hàng hóa', 'imports': 'Nhập khẩu hàng hóa', 'exp_rice': 'Xuất khẩu gạo', 'exp_coffee': 'Xuất khẩu cà phê',
    'exp_rubber': 'Xuất khẩu cao su', 'imp_corn': 'Nhập khẩu ngô', 'imp_soy': 'Nhập khẩu đậu tương',
    'imp_feed': 'Nhập khẩu thức ăn gia súc và nguyên liệu', 'imp_milk': 'Nhập khẩu sữa và sản phẩm sữa',
    'cement_export': 'Xuất khẩu clinker và xi măng', 'steel_export': 'Xuất khẩu sắt thép các loại', 'car_import': 'Nhập khẩu ô tô nguyên chiếc',
    'exp_seafood': 'Xuất khẩu hàng thủy sản', 'exp_us': 'Xuất khẩu thủy sản sang Hoa Kỳ', 'exp_cn': 'Xuất khẩu thủy sản sang Trung Quốc',
    'exp_jp': 'Xuất khẩu thủy sản sang Nhật Bản', 'exp_kr': 'Xuất khẩu thủy sản sang Hàn Quốc',
    'exp_textile': 'Xuất khẩu hàng dệt, may', 'exp_footwear': 'Xuất khẩu giày dép', 'exp_yarn': 'Xuất khẩu xơ, sợi dệt',
    'imp_fabric': 'Nhập khẩu vải', 'imp_cotton': 'Nhập khẩu bông', 'imp_yarn': 'Nhập khẩu xơ, sợi dệt',
    'imp_materials': 'Nhập khẩu nguyên phụ liệu dệt, may, da, giày', 'exp_textile_us': 'Xuất khẩu hàng dệt, may sang Hoa Kỳ',
    'exp_textile_jp': 'Xuất khẩu hàng dệt, may sang Nhật Bản', 'exp_textile_kr': 'Xuất khẩu hàng dệt, may sang Hàn Quốc',
    'exp_textile_cn': 'Xuất khẩu hàng dệt, may sang Trung Quốc', 'exp_yarn_us': 'Xuất khẩu xơ, sợi sang Hoa Kỳ',
    'import_drugs': 'Nhập khẩu dược phẩm', 'import_api': 'Nhập khẩu nguyên phụ liệu dược phẩm',
}
CUSTOMS = {
    'agri': ['exp_rice', 'exp_coffee', 'exp_rubber', 'imp_corn', 'imp_soy', 'imp_feed', 'imp_milk'],
    'construction': ['cement_export', 'steel_export'], 'port': ['exports', 'imports'], 'shipping': ['exports', 'imports'],
    'retail': ['car_import'], 'seafood': ['exp_seafood', 'exp_us', 'exp_cn', 'exp_jp', 'exp_kr'],
    'textile': ['exp_textile', 'exp_footwear', 'exp_yarn', 'imp_fabric', 'imp_cotton', 'imp_yarn', 'imp_materials',
                'exp_textile_us', 'exp_textile_jp', 'exp_textile_kr', 'exp_textile_cn', 'exp_yarn_us'],
    'pharma': ['import_drugs', 'import_api'],
}
TEXTILE_YEARLY = {'y_us': 'exp_textile_us', 'y_jp': 'exp_textile_jp', 'y_kr': 'exp_textile_kr', 'y_cn': 'exp_textile_cn',
                  'y_de': 'exp_textile_de', 'y_nl': 'exp_textile_nl', 'y_uk': 'exp_textile_uk', 'y_ca': 'exp_textile_ca'}
SHFE = {'construction': {'hrc': 'hc', 'hrc_fut': 'hc', 'asphalt': 'bu'}, 'shipping': {'fuel_oil_cn': 'fu'}}


def customs_series(sector):
    if not CUSTOMS_FILE.exists():
        return {}
    d = json.loads(CUSTOMS_FILE.read_text())
    S = d['series']
    meta = lambda name, unit, recs, tt='monthly': {'name': name, 'unit': unit, 'time_type': tt, 'source': d['source'], 'url': d['url'], 'records': recs}
    out = {}
    for k in CUSTOMS.get(sector, []):
        recs = [{'date': m + '-01', 'value': v} for m, v in sorted(S.get(k, {}).items())]
        if recs:
            out[k] = meta(CUS_NAMES[k], 'triệu USD', recs)
    if sector == 'agri':  # average export price = value / volume
        for c in ('rice', 'coffee', 'rubber'):
            v, q = S.get(f'exp_{c}', {}), S.get(f'exp_{c}_q', {})
            recs = [{'date': m + '-01', 'value': round(v[m] * 1e6 / (q[m] * 1000), 4)} for m in sorted(v) if q.get(m)]
            out[f'px_{c}'] = meta(f'Giá xuất khẩu {dict(rice="gạo", coffee="cà phê", rubber="cao su")[c]} bình quân (trị giá / lượng)', 'USD/kg', recs)
    if sector == 'textile':  # full calendar years only
        for yk, mk in TEXTILE_YEARLY.items():
            by = {}
            for m, v in S.get(mk, {}).items():
                by.setdefault(m[:4], []).append(v)
            recs = [{'date': f'{y}-12-01', 'value': round(sum(vs), 4)} for y, vs in sorted(by.items()) if len(vs) == 12]
            if recs:
                out[yk] = meta(f'XK dệt may {mk.split("_")[-1].upper()}, năm', 'triệu USD', recs, 'yearly')
    return out


def shfe_series(sector):
    if not SHFE_FILE.exists() or sector not in SHFE:
        return {}
    d = json.loads(SHFE_FILE.read_text())
    out = {}
    for k, p in SHFE[sector].items():
        recs = [{'date': r['date'], 'value': r['value']} for _, r in sorted(d['series'].get(p, {}).items())]
        out[k] = {'name': d['names'][p], 'unit': 'CNY/tấn', 'time_type': 'monthly', 'source': d['source'], 'url': d['url'],
                  'records': recs, 'note': 'giá thanh toán hợp đồng chính (OI lớn nhất), phiên cuối tháng'}
    return out


def us_apparel():
    rows = list(csv.reader(io.StringIO(http(FRED.format('RSCCAS')))))[1:]
    lv = {d[:7]: float(v) / 1000 for d, v in rows if v not in ('', '.')}
    src = 'US Census qua FRED (RSCCAS, đã điều chỉnh mùa vụ)'
    recs = [{'date': m + '-01', 'value': round(v, 3)} for m, v in sorted(lv.items()) if m >= '2019']
    yoy = [{'date': m + '-01', 'value': round((v / lv[f'{int(m[:4]) - 1}{m[4:]}'] - 1) * 100, 4)} for m, v in sorted(lv.items())
           if m >= '2019' and lv.get(f'{int(m[:4]) - 1}{m[4:]}')]
    u = 'https://fred.stlouisfed.org/series/RSCCAS'
    return {'us_apparel_retail': {'name': 'Bán lẻ quần áo, phụ kiện của Mỹ', 'unit': 'tỷ USD', 'time_type': 'monthly', 'source': src, 'url': u, 'records': recs},
            'us_apparel_retail_yoy': {'name': 'Bán lẻ quần áo, phụ kiện của Mỹ, so cùng kỳ', 'unit': '%', 'time_type': 'monthly', 'source': src, 'url': u, 'records': yoy}}


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
        ms = macro_series(sector)
        ms.update(customs_series(sector))
        if sector == 'textile':
            ms.update(us_apparel())
        sh = shfe_series(sector)
        if sh:
            blocks.setdefault('commodity', {'series': {}, 'captured_at': now[:10]})['series'].update(sh)
        if ms:
            blocks['macro'] = {'series': ms, 'captured_at': now[:10]}
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
