#!/usr/bin/env python3
"""Build data/<sector>-public-data.(json|js): commodity series for sector dashboards from public sources only.

Sources: IMF Primary Commodity Prices via FRED CSV (monthly average, no key) and month-end values of the
daily public feeds already kept in data/daily-data.js (EIA Brent, ICE sugar No.11 front future, ICE Newcastle).
Macro (NSO/customs/SBV) and sector valuation aggregates have no public replacement yet: those blocks are absent
and the pages show '—'. Unit conversions are stated per series.
"""
import csv, datetime as dt, io, json, re, ssl, sys, time, urllib.request
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
    'barley': ('fred', 'PBARLUSDM', 'Lúa mạch (IMF, Canada, bình quân tháng)', 'USD/tấn', 1),
    'fishmeal': ('fred', 'PFISHUSDM', 'Bột cá (IMF, Peru, bình quân tháng)', 'USD/tấn', 1),
    'eurusd': ('fred', 'EXUSEU', 'Tỷ giá USD/EUR (Fed H.10, bình quân tháng)', 'USD/EUR', 1),
    'cotton_ice': ('fred', 'PCOTTINDUSDM', 'Bông Cotlook A (IMF, bình quân tháng)', 'US cent/pound', 1),
    'sugar': ('feed', 'sugar_futures', 'Đường thô ICE No.11 (hợp đồng gần, cuối tháng)', 'US cent/pound', 1),
    'brent': ('feed', 'brent', 'Dầu Brent (EIA, cuối tháng)', 'USD/thùng', 1),
    'coal_newcastle': ('feed', 'coal_newcastle', 'Than Newcastle (ICE, cuối tháng)', 'USD/tấn', 1),
}
SECTORS = {
    'retail': ['sugar', 'palm_oil', 'soymeal', 'corn'],
    'agri': ['corn', 'soymeal', 'robusta', 'tsr20', 'barley'],
    'seafood': ['soymeal', 'corn', 'fishmeal', 'eurusd'],
    'textile': ['cotton_ice'],
    'shipping': ['brent'],
    'construction': ['coal_newcastle'],
    'steel': ['iron_ore'],
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
    'gdp_construction_nominal': ('gdp_construction_nominal', 'GDP ngành xây dựng (giá hiện hành), lũy kế', 'tỷ VND', 1),
    'gdp_construction_real': ('gdp_construction_real', 'GDP ngành xây dựng (giá so sánh), lũy kế', 'tỷ VND', 1),
    'gdp_construction_q': ('gdp_construction_q', 'GDP ngành xây dựng theo quý (giá hiện hành)', 'tỷ VND', 1),
    'gdp_re_q': ('gdp_re_q', 'GDP hoạt động kinh doanh BĐS theo quý (giá hiện hành)', 'tỷ VND', 1),
    'gdp_re_ytd': ('gdp_re_ytd', 'GDP hoạt động kinh doanh BĐS lũy kế', 'tỷ VND', 1),
    'gdp_health': ('gdp_health', 'GDP y tế và cứu trợ xã hội (danh nghĩa, lũy kế năm)', 'tỷ VND', 1),
    'ppi_handling': ('ppi_handling', 'Chỉ số giá dịch vụ bốc xếp hàng hóa, so cùng kỳ', '%', 1),
    'ppi_warehouse': ('ppi_warehouse', 'Chỉ số giá kho bãi và hỗ trợ vận tải, so cùng kỳ', '%', 1),
    'ppi_sea': ('ppi_sea', 'Chỉ số giá vận tải ven biển và viễn dương, so cùng kỳ', '%', 1),
    'ppi_water': ('ppi_water', 'Chỉ số giá vận tải đường thủy, so cùng kỳ', '%', 1),
}
QUARTERLY = {k for k in NSO if k.startswith(('gdp_', 'ppi_'))}
GDP_SINCE = '2024-01'  # earlier quarters were revised a lot after release; the workbooks only hold the release vintage
MACRO = {
    'agri': ['retail_goods', 'cpi_food', 'cpi_bev', 'beer', 'fresh_milk', 'milk_powder', 'feed', 'iip_food', 'iip_bev'],
    'construction': ['pub_inv', 'pub_inv_central', 'pub_inv_local', 'pub_inv_moc', 'cement_output', 'iip_nonmetal', 'gdp_construction_nominal', 'gdp_construction_real'],
    'steel': ['steel_rolled', 'steel_bar', 'iip_metal'],
    'insurance': ['car_output', 'moto_output'],
    'port': ['sea_freight', 'overseas_freight', 'air_freight', 'inland_freight', 'ppi_handling', 'ppi_warehouse', 'ppi_sea'],
    'realestate': ['cpi_housing_index', 'cpi_housing_yoy', 'iip_mfg_yoy', 'gdp_re_q', 'gdp_re_ytd', 'gdp_construction_q'],
    'retail': ['retail_total', 'retail_goods', 'cpi_yoy', 'tourists', 'cpi_food_yoy', 'cpi_bev_yoy', 'beer_output', 'milk_output', 'milkpowder_output', 'iip_food', 'iip_bev', 'car_output', 'moto_output'],
    'seafood': ['iip_food'],
    'shipping': ['sea_freight', 'overseas_freight', 'sea_tonkm_ytd', 'ppi_sea', 'ppi_water'],
    'textile': ['fabric_natural', 'fabric_synthetic', 'garments', 'iip_textile', 'iip_apparel'],
    'pharma': ['iip_pharma', 'cpi_health', 'gdp_health'],
}


def macro_series(sector):
    if not NSO_FILE.exists():
        return {}
    d = json.loads(NSO_FILE.read_text())
    d['url'] = d['files'][max(d['files'])] if d.get('files') else d['url']  # latest monthly workbook
    out = {}
    for k in MACRO.get(sector, []):
        nk, name, unit, f = NSO[k]
        recs = [{'date': m + '-01', 'value': round(v * f, 4)} for m, v in sorted(d['series'].get(nk, {}).items())
                if not (k.startswith('gdp_') and m < GDP_SINCE)]
        if recs:
            out[k] = {'name': name, 'unit': unit, 'time_type': 'quarterly' if k in QUARTERLY else 'monthly',
                      'source': d['source'], 'url': d['url'], 'records': recs}
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
    'steel_import': 'Nhập khẩu sắt thép các loại', 'import_drugs': 'Nhập khẩu dược phẩm', 'import_api': 'Nhập khẩu nguyên phụ liệu dược phẩm',
}
CUSTOMS = {
    'agri': ['exp_rice', 'exp_coffee', 'exp_rubber', 'imp_corn', 'imp_soy', 'imp_feed', 'imp_milk'],
    'construction': ['cement_export'], 'steel': ['steel_export', 'steel_import'], 'port': ['exports', 'imports'], 'shipping': ['exports', 'imports'],
    'retail': ['car_import'], 'seafood': ['exp_seafood', 'exp_us', 'exp_cn', 'exp_jp', 'exp_kr'],
    'textile': ['exp_textile', 'exp_footwear', 'exp_yarn', 'imp_fabric', 'imp_cotton', 'imp_yarn', 'imp_materials',
                'exp_textile_us', 'exp_textile_jp', 'exp_textile_kr', 'exp_textile_cn', 'exp_yarn_us'],
    'pharma': ['import_drugs', 'import_api'],
}
TEXTILE_YEARLY = {'y_us': 'exp_textile_us', 'y_jp': 'exp_textile_jp', 'y_kr': 'exp_textile_kr', 'y_cn': 'exp_textile_cn',
                  'y_de': 'exp_textile_de', 'y_nl': 'exp_textile_nl', 'y_uk': 'exp_textile_uk', 'y_ca': 'exp_textile_ca'}
SHFE = {'construction': {'asphalt': 'bu'}, 'steel': {'hrc': 'hc', 'rebar_cn': 'rb'}, 'shipping': {'fuel_oil_cn': 'fu'}}


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


MARKETS_FILE = ROOT / 'data/raw/public/markets-monthly.json'
MARKETS = {'shipping': ['bdi'], 'port': ['bdi'], 'textile': ['yarn_cn', 'cotton_cn', 'psf', 'pta', 'meg']}


def market_series(sector):
    if not MARKETS_FILE.exists():
        return {}
    S = json.loads(MARKETS_FILE.read_text())['series']
    return {k: {'name': S[k]['name'], 'unit': S[k]['unit'], 'time_type': 'monthly', 'source': S[k]['source'], 'url': S[k]['url'],
                'records': [{'date': r['date'], 'value': r['value']} for r in S[k]['records'].values()]}
            for k in MARKETS.get(sector, []) if k in S}


SBV_FILE = ROOT / 'data/raw/public/sbv-monthly.json'
SBV_NAMES = {'refi_rate': ('Lãi suất tái cấp vốn', '%/năm'), 'credit_total': ('Tổng dư nợ tín dụng nền kinh tế', 'tỷ VND'), 'credit_construction': ('Dư nợ tín dụng ngành xây dựng', 'tỷ VND'),
             'household_deposits': ('Tiền gửi của dân cư', 'tỷ VND'), 'deposits_total': ('Tiền gửi của TCKT và dân cư', 'tỷ VND'),
             'usdvnd': ('Tỷ giá trung tâm USD/VND (bình quân tháng)', 'VND')}
SBV = {'retail': ['household_deposits', 'credit_total'], 'realestate': ['credit_construction', 'credit_total', 'deposits_total', 'refi_rate'],
       'construction': ['credit_construction'], 'insurance': ['household_deposits'], 'pharma': ['usdvnd'], 'steel': ['usdvnd']}


def sbv_series(sector):
    if not SBV_FILE.exists():
        return {}
    d = json.loads(SBV_FILE.read_text())
    url = d['pages']['fx'] if sector == 'pharma' else d['pages']['credit']
    return {k: {'name': SBV_NAMES[k][0], 'unit': SBV_NAMES[k][1], 'time_type': 'monthly', 'source': d['source'], 'url': url,
                'records': [{'date': m + '-01', 'value': v} for m, v in d['series'][k].items()]}
            for k in SBV.get(sector, []) if d['series'].get(k)}


FIA_FILE = ROOT / 'data/raw/public/fia-fdi.json'
FIA_NAMES = {'fdi_re_ytd': 'FDI đăng ký vào kinh doanh BĐS, lũy kế từ đầu năm', 'fdi_mfg_ytd': 'FDI đăng ký vào công nghiệp chế biến, chế tạo, lũy kế từ đầu năm',
             'fdi_construction_ytd': 'FDI đăng ký vào xây dựng, lũy kế từ đầu năm', 'fdi_accommodation_ytd': 'FDI đăng ký vào lưu trú và ăn uống, lũy kế từ đầu năm',
             'fdi_transport_ytd': 'FDI đăng ký vào vận tải kho bãi, lũy kế từ đầu năm', 'fdi_ict_ytd': 'FDI đăng ký vào thông tin và truyền thông, lũy kế từ đầu năm',
             'fdi_realized_ytd': 'Vốn FDI thực hiện, lũy kế từ đầu năm', 'fdi_re_stock': 'FDI đăng ký vào kinh doanh BĐS, lũy kế còn hiệu lực'}


def fia_series(sector):
    if sector != 'realestate' or not FIA_FILE.exists():
        return {}
    d = json.loads(FIA_FILE.read_text())
    S = d['series']
    out = {k: {'name': n, 'unit': 'triệu USD', 'time_type': 'monthly', 'source': d['source'], 'url': d['url'],
               'records': [{'date': m + '-01', 'value': v} for m, v in S[k].items()]} for k, n in FIA_NAMES.items() if S.get(k)}
    for src, dst, name in (('fdi_re_ytd', 'fdi_re_monthly', 'FDI đăng ký vào kinh doanh BĐS theo tháng (ròng)'),
                           ('fdi_realized_ytd', 'fdi_realized', 'Vốn FDI thực hiện theo tháng')):
        y = S.get(src, {})
        recs = []
        for m, v in sorted(y.items()):
            yy, mm = int(m[:4]), int(m[5:])
            prev = None if mm == 1 else y.get(f'{yy}-{mm - 1:02d}')
            if mm == 1 or prev is not None:
                recs.append({'date': m + '-01', 'value': round(v - (prev or 0), 2)})
        if recs:
            out[dst] = {'name': name, 'unit': 'triệu USD', 'time_type': 'monthly', 'source': d['source'], 'url': d['url'], 'records': recs}
    return out


SXD_FILE = ROOT / 'data/raw/public/sxd-hanoi-quarterly.json'
SXD = {'construction': {'cement_price': 'cement_pcb40', 'stone_1x2': 'da_1x2', 'sand_yellow': 'cat_vang'},
       'realestate': {'cement_price': 'cement_pcb40'}}


def sxd_series(sector):
    if not SXD_FILE.exists() or sector not in SXD:
        return {}
    d = json.loads(SXD_FILE.read_text())
    q0 = lambda q: f'{q[:4]}-{(int(q[-1]) - 1) * 3 + 1:02d}-01'
    return {k: {'name': d['names'][p] + ', Hà Nội', 'unit': d['units'][p], 'time_type': 'quarterly', 'source': d['source'],
                'url': d['files'][max(d['series'][p])]['page'],
                'records': [{'date': q0(q), 'period': q, 'value': r['value'], 'n': r['n'], 'min': r['min'], 'max': r['max']}
                            for q, r in sorted(d['series'][p].items())]}
            for k, p in SXD[sector].items() if d['series'].get(p)}


VFA_FILE = ROOT / 'data/raw/public/vfa-rice-weekly.json'
VASEP_FILE = ROOT / 'data/raw/public/vasep-dongthap-weekly.json'
VASEP = {'pangasius': ('pangasius', 'Cá tra thịt trắng nguyên liệu, Đồng Tháp'), 'pangasius_fry': ('pangasius_fry', 'Cá tra giống, Đồng Tháp'),
         'shrimp50': ('shrimp', 'Tôm chân trắng, Đồng Tháp')}


def month_last(pairs, since='2019-01'):
    last = {}
    for d, v in sorted(pairs):
        if d[:7] >= since:
            last[d[:7]] = {'date': d, 'value': v}
    return list(last.values())


def farm_series(sector):
    """Domestic prices from weekly posts, kept as the last week of each month: VFA 5% rice (agri), VASEP Đồng Tháp
    pangasius and shrimp (seafood); thousand VND/kg."""
    out = {}
    if sector == 'agri' and VFA_FILE.exists():
        d = json.loads(VFA_FILE.read_text())
        out['rice5'] = {'name': 'Gạo thành phẩm XK 5% tấm, bình quân ĐBSCL', 'unit': 'nghìn VND/kg', 'time_type': 'monthly',
                        'source': d['source'], 'url': d['url'], 'definition': d['definition'],
                        'records': month_last((k, round(r['value'] / 1000, 3)) for k, r in d['records'].items())}
    if sector == 'seafood' and VASEP_FILE.exists():
        d = json.loads(VASEP_FILE.read_text())
        for key, (src, name) in VASEP.items():
            rs = d['series'].get(src, {})
            if src == 'shrimp' and rs:  # VASEP moved from "100 con/kg" to "50 - 100 con/kg": keep the latest size band only
                band = re.sub(r'\s', '', rs[max(rs)]['size'])
                rs = {k: r for k, r in rs.items() if re.sub(r'\s', '', r['size']) == band}
            if rs:
                out[key] = {'name': name, 'unit': 'nghìn VND/kg', 'time_type': 'monthly', 'source': d['source'], 'url': d['url'],
                            'size': rs[max(rs)]['size'], 'records': month_last((k, r['value']) for k, r in rs.items())}
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


def us_apparel_is():
    """Textile (05/11/2026): US clothing-store inventories/sales ratio (Census via FRED MRTSIR448USS, SA, monthly) for the
    lead-lag overlay against VN textile exports to the US. Network failure leaves the series out (page shows the old static table)."""
    try:
        rows = list(csv.reader(io.StringIO(http(FRED.format('MRTSIR448USS')))))[1:]
    except Exception:
        return {}
    recs = [{'date': d, 'value': float(v)} for d, v in rows if v not in ('', '.') and d >= '2015-01-01']
    return {'us_apparel_is': {'name': 'Tồn kho / doanh số cửa hàng quần áo và phụ kiện Mỹ (điều chỉnh mùa vụ)', 'unit': 'lần', 'time_type': 'monthly',
                              'source': 'US Census qua FRED (MRTSIR448USS)', 'url': 'https://fred.stlouisfed.org/series/MRTSIR448USS', 'records': recs}}


def cny_usd():
    """Steel (05/11/2026): CNY per USD (Fed H.10 via FRED DEXCHUS, daily → last value of each month) so SHFE prices can be
    stated in USD/VND next to Vietnamese prices. Network failure leaves the series out."""
    try:
        rows = list(csv.reader(io.StringIO(http(FRED.format('DEXCHUS')))))[1:]
    except Exception:
        return {}
    last = {}
    for d, v in rows:
        if v not in ('', '.') and d >= SINCE:
            last[d[:7]] = {'date': d, 'value': float(v)}
    return {'cny_usd': {'name': 'Tỷ giá CNY/USD (Fed H.10 qua FRED, phiên cuối tháng)', 'unit': 'CNY/USD', 'time_type': 'monthly',
                        'source': 'Federal Reserve H.10 qua FRED (DEXCHUS)', 'url': 'https://fred.stlouisfed.org/series/DEXCHUS', 'records': list(last.values())}}


def port_shipping_feeds(sector):
    """Port & shipping (05/11/2026): IMF PortWatch daily port calls per Vietnamese port (scripts/fetch_portwatch_ports.py)
    for the port page, and the Freightos FBX daily lane snapshot (scripts/fetch_fbx.py) for both pages. Missing raw
    file → block absent (page keeps its ⓘ note)."""
    out = {}
    pw = ROOT / 'data/raw/public/portwatch-ports.json'
    if sector == 'port' and pw.exists():
        p = json.loads(pw.read_text())
        out['portwatch_ports'] = {k: p[k] for k in ('source', 'url', 'checked', 'unit', 'method', 'ports', 'errors') if k in p}
    fb = ROOT / 'data/raw/public/fbx.json'
    if fb.exists():
        f = json.loads(fb.read_text())
        out['fbx'] = {k: f[k] for k in ('source', 'url', 'unit', 'lanes', 'checked', 'note', 'days', 'changes') if k in f}
    return out


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


STEEL_WI_MACRO = ('steel_rolled', 'steel_bar', 'steel_export', 'iip_metal')
STEEL_WI_COMMODITY = ('rebar_hpg', 'hrc', 'hrc_fut', 'iron_ore', 'coke', 'scrap')
WI_SRC = {'source': 'WiData (WiMCP)', 'url': 'https://widata.vn/'}


def agri_seafood_extra(sector, blocks):
    """Đợt 1 (05/11/2026): tỷ giá USD/VND tháng, FAO FPMA (gạo, sữa bột, bột cá), USDA PSD cà phê, lịch Federal Register.
    Chỉ đọc file raw đã có (scripts/fetch_fao_fpma.py, fetch_usda_psd_coffee.py, fetch_federal_register.py, fetch_sbv.py)."""
    if sector not in ('agri', 'seafood'):
        return
    raw = ROOT / 'data/raw/public'
    fx, src = {}, []
    ph = ROOT / 'data/pharma-wi-data.json'  # Wi 242638 tỷ giá trung tâm bình quân tháng (đã có trong repo), cho kỳ trước 2025
    if ph.exists():
        s = ((json.loads(ph.read_text()).get('blocks', {}).get('macro') or {}).get('series') or {}).get('usdvnd') or {}
        fx.update({r['date'][:7]: r['value'] for r in s.get('records', [])})
        if fx:
            src.append('WiData 242638 (bình quân tháng)')
    sb = raw / 'sbv-monthly.json'
    if sb.exists():
        by = {}
        for d, v in (json.loads(sb.read_text()).get('central_rate_daily') or {}).items():
            if isinstance(v, (int, float)):
                by.setdefault(d[:7], []).append(v)
        fx.update({m: sum(v) / len(v) for m, v in by.items()})
        src.append('NHNN tỷ giá trung tâm (bình quân các ngày có số)')
    if fx:
        blocks.setdefault('macro', {'series': {}})['series']['usdvnd'] = {
            'name': 'Tỷ giá trung tâm USD/VND, bình quân tháng', 'unit': 'VND/USD', 'time_type': 'monthly', 'source': ' + '.join(src),
            'url': 'https://sbv.gov.vn/vi/t%E1%BB%B7-gi%C3%A1-trung-t%C3%A2m', 'records': [{'date': m + '-01', 'value': round(fx[m], 1)} for m in sorted(fx)]}
    fp = raw / 'fao-fpma.json'
    if fp.exists():
        f = json.loads(fp.read_text())
        keep = ('rice_thai5', 'rice_vn5', 'rice_vn25', 'rice_india25', 'rice_pak25', 'smp', 'wmp', 'rice5_angiang', 'rice5_dongthap', 'rice5_baclieu') if sector == 'agri' else ('fishmeal', 'soymeal_hamburg')
        ser = {}
        for k in keep:
            v = f['series'].get(k) or {}
            recs = v.get('records') or []
            if v.get('time_type') == 'weekly':  # bình quân tháng của các tuần
                by = {}
                for r in recs:
                    by.setdefault(r['date'][:7], []).append(r['value'])
                recs = [{'date': m + '-01', 'value': round(sum(x) / len(x), 2), 'weeks': len(x)} for m, x in sorted(by.items())]
            if recs:
                ser[k] = {'name': v['name'], 'unit': v['unit'], 'time_type': 'monthly', 'records': [r for r in recs if r['date'] >= '2019-01-01'], 'api': v.get('url')}
        blocks['fao_fpma'] = {'source': f['source'], 'url': f['url'], 'checked': f['checked'], 'series': ser}
    pc = raw / 'usda-psd-coffee.json'
    if sector == 'agri' and pc.exists():
        c = json.loads(pc.read_text())
        blocks['psd_coffee'] = {k: c[k] for k in ('source', 'url', 'file', 'unit', 'marketing_year', 'checked')} | {'vietnam': c['countries'].get('vietnam', [])}
    fr = raw / 'federal-register-por.json'
    if sector == 'seafood' and fr.exists():
        f = json.loads(fr.read_text())
        blocks['federal_register'] = {'source': f['source'], 'url': f['url'], 'checked': f['checked'],
                                      'cases': {k: {kk: v[kk] for kk in ('case', 'name', 'phrase')} | {'documents': v['documents'][:30]} for k, v in f['cases'].items()}}


def merge_wi(sector, blocks):
    """Lấp chỗ trống bằng data/<sector>-wi-data.json (scripts/build_<sector>_wi.py từ WiMCP, AGENTS.md 26/10/2026).
    Nguồn gốc luôn ưu tiên: chỉ thêm chuỗi, mã ngành hoặc khối mà bản công khai không có hoặc rỗng; không trộn
    hai nguồn trong một chuỗi. Mỗi chuỗi lấy từ Wi mang via='wi' để trang ghi đúng nguồn."""
    f = ROOT / f'data/{sector}-wi-data.json'
    if not f.exists():
        return []
    wi, filled = json.loads(f.read_text()).get('blocks', {}), []
    if sector == 'construction':  # thép đã tách sang dashboard Thép (04/11/2026)
        for name, keys in (('macro', STEEL_WI_MACRO), ('commodity', STEEL_WI_COMMODITY)):
            for k in keys:
                ((wi.get(name) or {}).get('series') or {}).pop(k, None)
        ((wi.get('sector_ratio') or {}).get('by_sector') or {}).pop('281', None)
    for name in ('macro', 'commodity'):
        for k, v in ((wi.get(name) or {}).get('series') or {}).items():
            have = ((blocks.get(name) or {}).get('series') or {}).get(k)
            if v.get('records') and not (have and have.get('records')):
                blocks.setdefault(name, {'series': {}, 'captured_at': wi[name].get('captured_at')})['series'][k] = {**v, **WI_SRC, 'via': 'wi', 'captured_at': wi[name].get('captured_at')}
                filled.append(f'{name}.{k}')
    sr = (wi.get('sector_ratio') or {}).get('by_sector') or {}
    for k, v in sr.items():
        have = (blocks.get('sector_ratio') or {}).get('by_sector', {}).get(k)
        if v.get('records') and not (have and have.get('records')):
            blocks.setdefault('sector_ratio', {'by_sector': {}})['by_sector'][k] = {**v, 'via': 'wi'}
            filled.append(f'sector_ratio.{k}')
    for name, v in wi.items():
        if name not in blocks and name not in ('macro', 'commodity', 'sector_ratio'):
            blocks[name] = {**v, **WI_SRC, 'via': 'wi'}
            filled.append(name)
    return filled


def main():
    F, cache, vcache = feeds(), {}, {}
    now = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    only = [a for a in sys.argv[1:] if a in SECTORS]  # optional: build only these sectors
    for sector, keys in SECTORS.items():
        if only and sector not in only:
            continue
        series = {k: build_series(k, cache, F) for k in keys}
        blocks = {'commodity': {'series': series, 'captured_at': now[:10]}} if series else {}
        ms = macro_series(sector)
        ms.update(customs_series(sector))
        ms.update(sbv_series(sector))
        ms.update(fia_series(sector))
        if sector == 'textile':
            ms.update(us_apparel())
            ms.update(us_apparel_is())
        sh = {**shfe_series(sector), **market_series(sector), **sxd_series(sector), **farm_series(sector)}
        if sector == 'steel':
            sh.update(cny_usd())
        fp = ROOT / 'data/raw/public/fao-fpma.json'
        if sector == 'retail' and fp.exists():  # 05/11/2026: sữa bột SMP/WMP (FAO FPMA, file do agent Nông nghiệp tạo) cho biên gộp VNM
            fj = json.loads(fp.read_text())
            for k in ('smp', 'wmp'):
                v = (fj.get('series') or {}).get(k)
                if v and v.get('records'):
                    sh[k] = {'name': v['name'], 'unit': v['unit'], 'time_type': v.get('time_type', 'monthly'), 'source': fj.get('source', 'FAO FPMA'),
                             'url': v.get('url') or fj.get('url'), 'records': [r for r in v['records'] if r['date'] >= SINCE]}
        if sh:
            blocks.setdefault('commodity', {'series': {}, 'captured_at': now[:10]})['series'].update(sh)
        if ms:
            blocks['macro'] = {'series': ms, 'captured_at': now[:10]}
        verr = {}
        sr = SV.build(sector, vcache, verr)
        wf = ROOT / 'data/raw/public/drewry-wci-weekly.json'
        if sector == 'port' and wf.exists():
            w = json.loads(wf.read_text())
            blocks['wci'] = {'source': w['source'], 'url': w['url'], 'unit': w['unit'], 'checked': w['checked'], 'weeks': w['weeks']}
        if sector in ('port', 'shipping'):
            blocks.update(port_shipping_feeds(sector))
            if sector == 'shipping':  # SHFE fuel oil CNY/tấn → USD/tấn on the page
                blocks.setdefault('commodity', {'series': {}, 'captured_at': now[:10]})['series'].update(cny_usd())
        cb = ROOT / 'data/raw/public/cbonds-realestate.json'
        if sector == 'realestate' and cb.exists():
            c = json.loads(cb.read_text())
            meta = {'source': c['source'], 'url': c['url'], 'captured_at': c['captured'], 'definition': c['definition'], 'unit': 'tỷ VND'}
            blocks['cbond_issuance'] = {**meta, 'records': c['issuance']}
            blocks['cbond_maturity'] = {**meta, 'records': c['maturity'], 'top_issuers': c['top_issuers'],
                                        'outstanding_value': c['outstanding_value'], 'outstanding_bonds': c['outstanding_bonds']}
        if sector == 'insurance':
            blocks['fs'] = SV.insurance_fs(verr)
            # 05/11/2026: rổ nào tải hỏng cả (finfo timeout) thì giữ bản dựng trước, đánh dấu stale thay vì mất chart
            prev_f = ROOT / 'data/insurance-public-data.json'
            if prev_f.exists():
                prev_fs = (json.loads(prev_f.read_text()).get('blocks') or {}).get('fs') or {}
                for bid, old in (prev_fs.get('by_sector') or {}).items():
                    if bid not in blocks['fs']['by_sector'] and old.get('records'):
                        blocks['fs']['by_sector'][bid] = {**old, 'stale': True, 'stale_note': 'giữ bản dựng ' + str(prev_fs.get('captured_at') or '')[:10]}
                blocks['fs']['captured_at'] = now[:10]
            hy = ROOT / 'data/raw/public/hnx-yield-10y.json'
            if hy.exists():
                h = json.loads(hy.read_text())
                blocks['gbond'] = {'records': [{'date': r['date'], 'value': round(r['value'], 3)} for r in h['records'].values()],
                                   'source': h['source'], 'url': h['url']}
                dp = h.get('deposit_12m', {})
                if dp.get('records'):
                    # 05/11/2026: đặt tên riêng để Wi deposit_12m (242557, lịch sử từ 2019) lấp qua merge_wi; Vietcombank giữ làm điểm mới nhất
                    blocks.setdefault('macro', {'series': {}, 'captured_at': now[:10]})['series']['deposit_12m_vcb'] = {
                        'name': 'Lãi suất tiết kiệm 12 tháng Vietcombank', 'unit': '%', 'time_type': 'monthly', 'source': dp['source'],
                        'url': dp['url'], 'records': [{'date': m + '-01', 'value': r['value']} for m, r in dp['records'].items()]}
        if sr and sr['by_sector']:
            sr['captured_at'], sr['errors'] = now[:10], verr
            blocks['sector_ratio'] = sr
        agri_seafood_extra(sector, blocks)
        wi_filled = merge_wi(sector, blocks)
        bundle = {'schema': 1, 'built_at': now, 'provider': 'Nguồn công khai (IMF/FRED, EIA, ICE, VNDirect)' + (' + WiData lấp chỗ thiếu' if wi_filled else ''),
                  'blocks': blocks, 'wi_filled': wi_filled,
                  'absent': [k for k in ('macro', 'sector_ratio', 'commodity') if k not in blocks]}
        text = json.dumps(bundle, ensure_ascii=False, separators=(',', ':'))
        (ROOT / f'data/{sector}-public-data.json').write_text(text + '\n')
        (ROOT / f'data/{sector}-public-data.js').write_text(f'window.{GLOBAL[sector]} = ' + text.replace('<', '\\u003c') + ';\n')
        print(sector, {k: (len(v['records']), v['records'][-1]['date'] if v['records'] else None) for k, v in series.items()},
              {i: (len(b['records']), b['records'][-1][0]) for i, b in (sr or {}).get('by_sector', {}).items()}, verr or '')
    return 0


if __name__ == '__main__':
    sys.exit(main())
