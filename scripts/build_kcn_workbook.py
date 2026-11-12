#!/usr/bin/env python3
"""Build data/kcn-market.json + data/kcn-market.js (window.KCN_MARKET) from the KCN research workbook.

Nguồn duy nhất: data/raw/kcn/Vietnam_Industrial_Park_Research_Data_2026_Expanded_Landbank.xlsx
(23 sheet, người dùng gửi 12/11/2026). Thay workbook mới vào đúng đường dẫn đó (hoặc truyền
đường dẫn khác làm tham số) rồi chạy:

    python scripts/build_kcn_workbook.py [đường-dẫn.xlsx]

Script chỉ chuẩn hóa và kiểm, không tính chỉ tiêu phái sinh (rolling 4Q, YoY, years of supply…):
các phép tính đó nằm ở assets/kcn-insights.js để trang và test dùng cùng một bản.
Bất kỳ kiểm tra nào hỏng thì dừng, không ghi file (giữ bản cũ trên web).
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from datetime import date
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = ROOT / 'data/raw/kcn/Vietnam_Industrial_Park_Research_Data_2026_Expanded_Landbank.xlsx'
OUT_JSON = ROOT / 'data/kcn-market.json'
OUT_JS = ROOT / 'data/kcn-market.js'

SHEETS = ['01_MARKET_QUARTER', '02_PROVINCE_MARKET', '03_NET_ABSORPTION', '03B_CBRE_LEASING_2026', '04_MFG_FDI_2016_25',
          '05_FDI_SNAPSHOTS', '06_RBF_RBW', '07_DEVELOPER_FACTS', '08_PROJECT_PIPELINE', '09_PIPELINE_BY_AREA', '10_ALL_FACTS_LONG',
          '11_SOURCES', '12_CHART_DATA', '13_DATA_QA', '14_INSIGHT_PLAYBOOK', '15_DATA_DICTIONARY', '00_README', '17_LANDBANK_2025',
          '18_COMPANY_LANDBANK', '19_LEASE_2023_2025', '20_COVERAGE_QA', '21_LANDBANK_GUIDE', '22_LANDBANK_DASH']
LANDBANK_TICKERS = {'KBC', 'IDC', 'BCM', 'SZC', 'VGC', 'LHG', 'NTC', 'D2D'}
REBASE = '2025Q3'  # C&W đổi phạm vi địa lý sau sáp nhập tỉnh

PROVINCE_VI = {
    'HCMC': 'TP.HCM', 'Dong Nai': 'Đồng Nai', 'Tay Ninh': 'Tây Ninh', 'Hanoi': 'Hà Nội', 'Bac Ninh': 'Bắc Ninh',
    'Hai Phong': 'Hải Phòng', 'Hung Yen': 'Hưng Yên', 'Hai Duong': 'Hải Dương (cũ)', 'Vinh Phuc': 'Vĩnh Phúc (cũ)',
    'Quang Ninh': 'Quảng Ninh', 'Phu Tho': 'Phú Thọ', 'Ninh Binh': 'Ninh Bình', 'Dong Thap': 'Đồng Tháp', 'Regional': 'Toàn vùng',
}
REGION_VI = {'North': 'Bắc', 'South': 'Nam', 'Vietnam': 'Cả nước', 'Region': 'Vùng'}


def num(v):
    if v is None or isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace(',', '')
    try:
        return float(s)
    except ValueError:
        return None


def txt(v):
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def r6(v):
    return None if v is None else round(v, 6)


def table(ws):
    """Rows of a header-first sheet as dicts (skips blank rows)."""
    rows = [r for r in ws.iter_rows(values_only=True) if any(c is not None for c in r)]
    head = [txt(h) for h in rows[0]]
    out = []
    for r in rows[1:]:
        d = {h: r[i] if i < len(r) else None for i, h in enumerate(head) if h}
        out.append(d)
    return head, out


def raw_rows(ws):
    return [[c for c in r] for r in ws.iter_rows(values_only=True) if any(c is not None for c in r)]


def qkey(p):
    m = re.match(r'^(\d{4})Q([1-4])$', str(p or ''))
    return int(m.group(1)) * 4 + int(m.group(2)) - 1 if m else None


def main(argv):
    src = Path(argv[1]) if len(argv) > 1 else DEFAULT_SRC
    if not src.exists():
        sys.exit(f'Không thấy workbook: {src}')
    raw = src.read_bytes()
    wb = load_workbook(src, data_only=True)
    errors, checks = [], []

    def check(ok, name, detail=''):
        checks.append({'name': name, 'ok': bool(ok), 'detail': detail})
        if not ok:
            errors.append(f'{name}: {detail}')

    missing = [s for s in SHEETS if s not in wb.sheetnames]
    check(not missing and len(wb.sheetnames) == 23, 'Đủ 23 sheet', f'{len(wb.sheetnames)} sheet' + (f'; thiếu {missing}' if missing else ''))
    if missing:
        sys.exit('\n'.join(errors))
    sheet_rows = {s: len(raw_rows(wb[s])) - 1 for s in SHEETS}

    # ---- 00_README: key/value + bảng mô tả sheet
    readme = {'pairs': [], 'rules': [], 'sheets': []}
    mode = 'pairs'
    for r in raw_rows(wb['00_README']):
        a, b = txt(r[0]), txt(r[1]) if len(r) > 1 else None
        if a and a.startswith('READ FIRST'):
            mode = 'rules'; continue
        if a == 'Sheet':
            mode = 'sheets'; continue
        if mode == 'pairs' and a and b:
            readme['pairs'].append([a, b])
        elif mode == 'rules' and a:
            readme['rules'].append(a)
        elif mode == 'sheets' and a:
            readme['sheets'].append({'sheet': a, 'purpose': b, 'use': txt(r[2]) if len(r) > 2 else None})
    as_of = dict(readme['pairs']).get('As-of')
    if isinstance(as_of, str) is False and as_of is not None:
        as_of = str(as_of)
    as_of = str(as_of)[:10] if as_of else None

    # ---- 11_SOURCES
    _, srows = table(wb['11_SOURCES'])
    sources = {}
    for r in srows:
        sid = txt(r.get('Source_ID'))
        if not sid:
            continue
        sources[sid] = {'what': txt(r.get('What_it_contains')), 'cls': txt(r.get('Source_class')), 'use': txt(r.get('Workbook_use')),
                        'url': txt(r.get('Source_URL')), 'checked': str(r.get('Checked_on'))[:10] if r.get('Checked_on') else None, 'note': txt(r.get('Notes'))}

    def url_or_none(sid, u):
        u = txt(u)
        return None if not u or (sid in sources and sources[sid]['url'] == u) else u

    def sid_ok(sid, where):
        for s in (sid or '').split(';'):
            s = s.strip()
            if s and s not in sources and s != 'CUSHMAN':
                errors.append(f'{where}: Source_ID {s} không có trong 11_SOURCES')

    # ---- 01_MARKET_QUARTER
    _, rows = table(wb['01_MARKET_QUARTER'])
    market = []
    seen = set()
    for r in rows:
        p = txt(r.get('Period'))
        if not qkey(p):
            continue
        reg = txt(r.get('Region'))
        geo = txt(r.get('Geography_version'))
        cohort = 'POST' if 'POST' in (geo or '') else 'PRE'
        if (qkey(p) >= qkey(REBASE)) != (cohort == 'POST'):
            errors.append(f'01_MARKET_QUARTER {p} {reg}: Geography_version {geo} lệch mốc đổi phạm vi {REBASE}')
        if (p, reg) in seen:
            errors.append(f'01_MARKET_QUARTER trùng {p} {reg}')
        seen.add((p, reg))
        usd, vnd = num(r.get('Asking_USD_sqm_term')), num(r.get('Asking_VND_sqm_term'))
        if usd is not None and vnd is not None:
            errors.append(f'01_MARKET_QUARTER {p} {reg}: có cả giá USD và VND')
        sid = txt(r.get('Source_ID')); sid_ok(sid, f'01 {p} {reg}')
        market.append({'period': p, 'region': reg, 'geo': geo, 'cohort': cohort, 'stock_ha': num(r.get('Stock_ha')), 'occ': r6(num(r.get('Occupancy_pct'))),
                       'abs_ha': num(r.get('Net_absorption_ha')), 'ask_usd': usd, 'ask_vnd': vnd, 'precision': txt(r.get('Precision')),
                       'note': txt(r.get('Scope_or_QA_notes')), 'src': sid, 'url': url_or_none(sid, r.get('Source_URL')),
                       'occupied_proxy': r6(num(r.get('Occupied_ha_PROXY'))), 'vacant_proxy': r6(num(r.get('Vacant_ha_PROXY')))})
    market.sort(key=lambda x: (qkey(x['period']), x['region']))
    check(len(market) == 16, '01: 16 dòng vùng × quý', f'{len(market)} dòng')
    # Proxy phải đúng bằng stock × occupancy (chỉ tính trong cùng một dòng, cùng phạm vi).
    bad = [f"{m['period']} {m['region']}" for m in market if m['stock_ha'] and m['occ'] is not None and m['occupied_proxy'] is not None
           and abs(m['stock_ha'] * m['occ'] - m['occupied_proxy']) > 0.5]
    check(not bad, '01: proxy lấp đầy = stock × occupancy', ', '.join(bad) or 'khớp')

    # ---- 02_PROVINCE_MARKET
    _, rows = table(wb['02_PROVINCE_MARKET'])
    province = []
    for r in rows:
        p = txt(r.get('Period'))
        if not p:
            continue
        name = txt(r.get('Province_2025_boundary'))
        note = txt(r.get('Notes')) or ''
        m_abs = re.search(r'net absorption (\d+(?:\.\d+)?)\s*ha', note)
        m_stock = re.search(r'stock approx (\d+(?:\.\d+)?)\s*ha', note)
        sid = txt(r.get('Source_ID')); sid_ok(sid, f'02 {p} {name}')
        province.append({'period': p, 'region': txt(r.get('Region')), 'province': name, 'province_vi': PROVINCE_VI.get(name, name),
                         'geo': txt(r.get('Geography_version')), 'occ': r6(num(r.get('Occupancy_pct'))), 'ask_usd': num(r.get('Ask_USD_sqm_term')),
                         'ask_vnd': num(r.get('Ask_VND_sqm_term')), 'rent_yoy': r6(num(r.get('Rent_YoY_pct'))), 'pricing': txt(r.get('Pricing_type')),
                         'note': note or None, 'abs_ref_ha': float(m_abs.group(1)) if m_abs else None, 'stock_ref_ha': float(m_stock.group(1)) if m_stock else None,
                         'src': sid, 'url': url_or_none(sid, r.get('Source_URL'))})
    check(len(province) == 19, '02: 19 dòng tỉnh', f'{len(province)} dòng')
    ref = [x for x in province if x['abs_ref_ha'] is not None]
    if ref:
        tot = sum(x['abs_ref_ha'] for x in ref)
        head = next((m['abs_ha'] for m in market if m['period'] == ref[0]['period'] and m['region'] == ref[0]['region']), None)
        checks.append({'name': '02: hấp thụ tỉnh miền Bắc Q1/2025 không cộng thành số vùng', 'ok': True,
                       'detail': f'tổng tỉnh {tot:g} ha ≠ số vùng {head:g} ha → chỉ dùng tham khảo hướng' if head else f'tổng tỉnh {tot:g} ha'})

    # ---- 03_NET_ABSORPTION + 03B
    _, rows = table(wb['03_NET_ABSORPTION'])
    absorption = []
    for r in rows:
        p = txt(r.get('Period'))
        if not p:
            continue
        sid = txt(r.get('Source_ID')); sid_ok(sid, f'03 {p}')
        absorption.append({'period': p, 'region': txt(r.get('Region')), 'reporter': txt(r.get('Reporter')), 'coverage': txt(r.get('Coverage')),
                           'ptype': txt(r.get('Period_type')), 'value': num(r.get('Absorption_ha')), 'unit': txt(r.get('Unit')),
                           'obs': txt(r.get('Observation_type')), 'precision': txt(r.get('Precision')), 'src': sid,
                           'url': url_or_none(sid, r.get('Source_URL')), 'note': txt(r.get('Compatibility_note'))})
    _, rows = table(wb['03B_CBRE_LEASING_2026'])
    cbre, cbre_qa = [], None
    for r in rows:
        p = txt(r.get('Quarter'))
        if p == 'QA':
            cbre_qa = txt(r.get('Region')) or next((txt(v) for v in r.values() if txt(v) and txt(v) != 'QA'), None); continue
        if not qkey(p):
            continue
        sid = txt(r.get('Source_ID')); sid_ok(sid, f'03B {p}')
        cbre.append({'period': p, 'region': txt(r.get('Region')), 'value': num(r.get('Net_absorption_ha')), 'unit': txt(r.get('Unit')),
                     'status': txt(r.get('Fact_status')), 'coverage': txt(r.get('Coverage')), 'src': sid, 'url': url_or_none(sid, r.get('Source_URL')),
                     'note': txt(r.get('Derivation_or_caution'))})
    est = [c for c in cbre if (c['status'] or '').startswith('DERIVED')]
    check(all(c['period'] == '2026Q3' for c in est) and len(est) == 2, '03B: chỉ Q3/2026 là số ước tính (dẫn xuất từ 9T)', f'{len(est)} dòng ước tính')
    # Không cộng/nối hai nguồn: C&W và CBRE phải tách theo Reporter + Coverage.
    rep = {(a['reporter'], a['coverage']) for a in absorption}
    check(any('CBRE' in r for r, _ in rep) and any('Cushman' in r for r, _ in rep), '03: tách chuỗi theo nguồn + phạm vi', '; '.join(sorted(f'{a} · {b}' for a, b in rep)))

    # ---- 04 FDI lịch sử
    _, rows = table(wb['04_MFG_FDI_2016_25'])
    fdi = []
    for r in rows:
        y = num(r.get('Year'))
        if not y:
            continue
        fdi.append({'year': int(y), 'new_n': num(r.get('New_project_count')), 'new_usd': num(r.get('New_capital_USDbn')),
                    'adj_n': num(r.get('Adjusted_project_count')), 'adj_usd': num(r.get('Adjusted_capital_USDbn')),
                    'ma_n': num(r.get('M&A_deal_count')), 'ma_usd': num(r.get('Capital_contribution_USDbn')),
                    'note': txt(r.get('Data_note')), 'src': txt(r.get('Source_ID')), 'url': url_or_none(txt(r.get('Source_ID')), r.get('Source_URL'))})
    yrs = [f['year'] for f in fdi]
    check(yrs == list(range(2016, 2026)) and all(f['new_usd'] is not None and f['new_n'] is not None for f in fdi),
          '04: FDI CBCT cấp mới đủ 10 năm 2016–2025', f'{yrs[0]}–{yrs[-1]}')
    check(fdi[0]['ma_usd'] is None, '04: 2016 góp vốn để trống (lỗi đơn vị ở nguồn)', 'không mang 593,51 vào số')

    # ---- 05 FDI snapshot
    _, rows = table(wb['05_FDI_SNAPSHOTS'])
    fdi_snap = []
    for r in rows:
        p = txt(r.get('Period'))
        if not p:
            continue
        sid = txt(r.get('Source_ID')); sid_ok(sid, f'05 {p}')
        fdi_snap.append({'period': p, 'geo': txt(r.get('Geography')), 'sector': txt(r.get('Sector')), 'ctype': txt(r.get('Capital_type')),
                         'value': num(r.get('Value')), 'unit': txt(r.get('Unit')), 'agg': txt(r.get('Aggregation')), 'src': sid,
                         'url': url_or_none(sid, r.get('Source_URL')), 'note': txt(r.get('Notes'))})

    # ---- 06 RBF/RBW
    _, rows = table(wb['06_RBF_RBW'])
    rbf = []
    for r in rows:
        p = txt(r.get('Period'))
        if not qkey(p):
            continue
        sid = txt(r.get('Source_ID'))
        usd, vnd = num(r.get('Ask_USD_sqm_month')), num(r.get('Ask_VND_sqm_month'))
        if usd is not None and vnd is not None:
            errors.append(f'06 {p}: có cả giá USD và VND')
        rbf.append({'period': p, 'region': txt(r.get('Region')), 'segment': txt(r.get('Segment')), 'stock_sqm': num(r.get('Stock_sqm')),
                    'occ': r6(num(r.get('Occupancy_pct'))), 'abs_sqm': num(r.get('Net_absorption_sqm')), 'ask_usd': usd, 'ask_vnd': vnd,
                    'precision': txt(r.get('Precision')), 'geo': txt(r.get('Geography_version')),
                    'cohort': 'POST' if 'POST' in (txt(r.get('Geography_version')) or '') else 'PRE', 'src': sid,
                    'url': url_or_none(sid, r.get('Source_URL')), 'note': txt(r.get('Notes'))})

    # ---- 07 developer facts
    _, rows = table(wb['07_DEVELOPER_FACTS'])
    dev = []
    for r in rows:
        if not txt(r.get('Ticker')):
            continue
        dev.append({'ticker': txt(r.get('Ticker')), 'period': txt(r.get('Period')), 'cls': txt(r.get('Fact_class')), 'metric': txt(r.get('Metric')),
                    'value': num(r.get('Value')), 'unit': txt(r.get('Unit')), 'def': txt(r.get('Definition_and_warning')),
                    'precision': txt(r.get('Precision')), 'src': txt(r.get('Source_ID')), 'url': url_or_none(txt(r.get('Source_ID')), r.get('Source_URL'))})
    plan_as_actual = [d for d in dev if d['cls'] == 'ACTUAL' and str(d['period']).startswith('2026')]
    check(not plan_as_actual, '07: kế hoạch 2026 không gắn nhãn ACTUAL', 'đúng' if not plan_as_actual else str(plan_as_actual))

    # ---- 08 pipeline, 09 theo khu vực
    _, rows = table(wb['08_PROJECT_PIPELINE'])
    pipeline = []
    for r in rows:
        if not txt(r.get('Reported_period')):
            continue
        prov = txt(r.get('Province_new'))
        pipeline.append({'period': txt(r.get('Reported_period')), 'region': txt(r.get('Region')), 'province': prov, 'province_vi': PROVINCE_VI.get(prov, prov),
                         'project': txt(r.get('Project_or_aggregate')), 'area_ha': num(r.get('Area_ha')), 'stage': txt(r.get('Stage')),
                         'developer': txt(r.get('Developer')), 'src': txt(r.get('Source_ID')), 'url': url_or_none(txt(r.get('Source_ID')), r.get('Source_URL')),
                         'caution': txt(r.get('Do_not_double_count'))})
    _, rows = table(wb['09_PIPELINE_BY_AREA'])
    pipe_area = []
    for r in rows:
        if not txt(r.get('Province')):
            continue
        prov = txt(r.get('Province'))
        pipe_area.append({'period': txt(r.get('Forecast_period')), 'region': txt(r.get('Region')), 'province': prov, 'province_vi': PROVINCE_VI.get(prov, prov),
                          'share': r6(num(r.get('Share_of_new_supply'))), 'regional_ha': num(r.get('Regional_pipeline_ha')),
                          'implied_ha': r6(num(r.get('Implied_project_supply_ha'))), 'cls': txt(r.get('Data_class')), 'src': txt(r.get('Source_ID')),
                          'url': url_or_none(txt(r.get('Source_ID')), r.get('Source_URL')), 'note': txt(r.get('Notes'))})
    sh = sum(p['share'] for p in pipe_area)
    check(abs(sh - 1) < 1e-6, '09: tỷ trọng nguồn cung miền Nam cộng 100%', f'{sh:.2%}')

    # ---- 12, 13, 14, 15
    _, chart_data = table(wb['12_CHART_DATA'])
    _, rows = table(wb['13_DATA_QA'])
    qa = [{'severity': txt(r.get('Severity')), 'period': txt(r.get('Period')), 'scope': txt(r.get('Affected_scope')), 'issue': txt(r.get('Issue')),
           'evidence': txt(r.get('Evidence')), 'rule': txt(r.get('Rule_for_dashboard')), 'src': txt(r.get('Source_IDs'))} for r in rows if txt(r.get('Issue'))]
    _, rows = table(wb['14_INSIGHT_PLAYBOOK'])
    playbook = [{'priority': txt(r.get('Priority')), 'insight': txt(r.get('Hypothesis_or_insight')), 'evidence': txt(r.get('Evidence')),
                 'viz': txt(r.get('Suggested_visualization')), 'coverage': txt(r.get('Period_coverage')), 'type': txt(r.get('Evidence_type')),
                 'src': txt(r.get('Source_IDs'))} for r in rows if txt(r.get('Hypothesis_or_insight'))]
    _, rows = table(wb['15_DATA_DICTIONARY'])
    dictionary = [{'field': txt(r.get('Field')), 'vi': txt(r.get('Vietnamese_description')), 'unit': txt(r.get('Unit')), 'def': txt(r.get('Definition')),
                   'family': txt(r.get('Source_family')), 'caution': txt(r.get('Analyst_caution'))} for r in rows if txt(r.get('Field'))]

    # ---- 17 quỹ đất cấp dự án
    _, rows = table(wb['17_LANDBANK_2025'])
    landbank = []
    for r in rows:
        tk = txt(r.get('Ticker'))
        if not tk:
            continue
        gross, comm, leased = num(r.get('Dien_tich_gross_ha')), num(r.get('Dat_thuong_pham_ha')), num(r.get('Da_cho_thue_luy_ke_ha'))
        occ, unl, ready = num(r.get('Ty_le_lap_day')), num(r.get('Dat_chua_lap_day_UOC_TINH_ha')), num(r.get('Dat_sach_san_sang_ha'))
        name = txt(r.get('Du_an_KCN'))
        if unl is not None and comm is None:
            errors.append(f'17 {tk} {name}: có đất chưa lấp đầy ước tính nhưng không có diện tích thương phẩm (có thể đã suy từ gross)')
        method = None
        if unl is not None:
            if leased is not None and abs(comm - leased - unl) < 0.05:
                method = 'commercial_minus_leased'
            elif occ is not None and abs(comm * (1 - occ) - unl) < 0.05:
                method = 'commercial_x_unoccupied'
            else:
                errors.append(f'17 {tk} {name}: đất chưa lấp đầy {unl} không khớp cả hai cách tính trong 21_LANDBANK_GUIDE')
        status = txt(r.get('Tinh_trang')) or ''
        stage = 'full' if 'lấp đầy' in status.lower() else 'operating' if 'khai thác' in status.lower() else 'pipeline'
        landbank.append({'ticker': tk, 'company': txt(r.get('Doanh_nghiep')), 'project': name, 'type': txt(r.get('Loai_hinh')),
                         'province': txt(r.get('Tinh_sau_sap_nhap')), 'base': txt(r.get('Ky_co_so')), 'gross_ha': gross, 'commercial_ha': comm,
                         'leased_ha': leased, 'occ': r6(occ), 'unleased_est_ha': r6(unl), 'unleased_method': method, 'ready_ha': ready,
                         'status': status or None, 'stage': stage, 'ownership': txt(r.get('Quan_he_so_huu')), 'def_note': txt(r.get('Ghi_chu_dinh_nghia')),
                         'src_type': txt(r.get('Loai_nguon')), 'url': txt(r.get('URL_nguon_goc')), 'page': txt(r.get('Vi_tri_trong_nguon')),
                         'qa': txt(r.get('Co_QA'))})
    check(len(landbank) == 39, '17: 39 dòng dự án/giai đoạn', f'{len(landbank)} dòng')
    # VGC chỉ có quy mô danh mục ở sheet 18 (0 dòng dự án), nên sheet 17 có 7 mã.
    check({x['ticker'] for x in landbank} == LANDBANK_TICKERS - {'VGC'}, '17: 7 doanh nghiệp có dòng dự án (VGC chỉ có quy mô danh mục)',
          ', '.join(sorted({x['ticker'] for x in landbank})))
    check(all(x['ready_ha'] is None for x in landbank), '17: đất sạch sẵn sàng chưa có số công bố', 'để trống, không suy')
    ov = [x for x in landbank if x['qa'] == 'OVERLAPS_SZC']
    check(len(ov) == 1 and ov[0]['ticker'] == 'D2D', '17: đất D2D thuê lại tại Châu Đức được đánh dấu chồng lấn SZC', f'{len(ov)} dòng')

    # ---- 18 quỹ đất cấp doanh nghiệp
    _, rows = table(wb['18_COMPANY_LANDBANK'])
    company = []
    for r in rows:
        tk = txt(r.get('Ticker'))
        if not tk:
            continue
        rawv = r.get('Quy_mo_cong_bo_ha')
        status = txt(r.get('Trang_thai_so_lieu')) or ''
        kind = txt(r.get('Loai_dien_tich')) or ''
        val = num(rawv)
        if val is None:
            prec = 'NONE'
        elif '>' in status or 'CẬN DƯỚI' in (txt(r.get('Pham_vi_so_huu_va_su_dung')) or '').upper() or '>' in kind:
            prec = 'LOWER_BOUND'
        elif 'KHOẢNG' in status.upper():
            prec = 'APPROX'
        elif 'CỘNG' in status.upper():
            prec = 'SUM_OF_PROJECTS'
        elif 'CHÍNH XÁC' in status.upper():
            prec = 'EXACT'
        else:
            prec = 'PROJECT'
        company.append({'ticker': tk, 'company': txt(r.get('Doanh_nghiep')), 'period': txt(r.get('Ky')), 'value_ha': val,
                        'value_text': None if val is not None else txt(rawv), 'precision': prec, 'kind': kind or None,
                        'n_parks': num(r.get('So_KCN_nhu_bao_cao')), 'n_rows': txt(r.get('So_du_an_trong_bang_chi_tiet')),
                        'scope': txt(r.get('Pham_vi_so_huu_va_su_dung')), 'status': status or None,
                        'ready_ok': txt(r.get('Co_duoc_dung_lam_DAT_SAN_SANG_ha')), 'url': txt(r.get('Nguon_bao_cao')), 'compare_note': txt(r.get('Ghi_chu_so_sanh'))})
    check({c['ticker'] for c in company} == LANDBANK_TICKERS, '18: 8 doanh nghiệp', ', '.join(c['ticker'] for c in company))
    for c in company:
        n = sum(1 for x in landbank if x['ticker'] == c['ticker'])
        if str(c['n_rows']).isdigit() and int(c['n_rows']) != n:
            errors.append(f"18 {c['ticker']}: ghi {c['n_rows']} dòng dự án nhưng sheet 17 có {n}")
    vgc = next((c for c in company if c['ticker'] == 'VGC'), {})
    check(vgc.get('precision') == 'LOWER_BOUND', '18: VGC 4.500 ha là cận dưới (>4.500)', vgc.get('status') or '')
    check(all((c['ready_ok'] or '').upper() == 'KHÔNG' for c in company), '18: không quy mô nào được dùng làm đất sẵn sàng', 'đúng')
    bcm = next((c for c in company if c['ticker'] == 'BCM'), {})
    check(bcm.get('value_ha') is None, '18: BCM không có tổng gross đồng nhất', bcm.get('value_text') or '')

    # ---- 19 lịch sử cho thuê
    _, rows = table(wb['19_LEASE_2023_2025'])
    lease = []
    for r in rows:
        if not txt(r.get('Ticker')):
            continue
        lease.append({'ticker': txt(r.get('Ticker')), 'year': int(num(r.get('Nam'))), 'value_ha': num(r.get('Cho_thue_DAT_KCN_thuc_te_ha')),
                      'type': txt(r.get('Loai_so')), 'complete': txt(r.get('Do_day_du_ba_nam')), 'metric': txt(r.get('Nhom_chi_tieu')),
                      'page': txt(r.get('Vi_tri_trong_BCTN')), 'url': txt(r.get('Nguon_BCTN2025')), 'def': txt(r.get('Dinh_nghia')), 'qa': txt(r.get('Ghi_chu_QA'))})
    idc = [(x['year'], x['value_ha'], x['type']) for x in lease if x['ticker'] == 'IDC']
    check(idc == [(2023, 170, 'ACTUAL'), (2024, 101, 'ACTUAL'), (2025, 76, 'ACTUAL')], '19: IDC đủ 3 năm actual 170 · 101 · 76 ha', str(idc))
    check({x['ticker'] for x in lease} == {'IDC'}, '19: không có doanh nghiệp khác thiếu năm trong lịch sử cho thuê', ', '.join(sorted({x['ticker'] for x in lease})))

    # ---- 20 coverage, 21 guide, 22 dash
    _, rows = table(wb['20_COVERAGE_QA'])
    coverage = [{'ticker': txt(r.get('Ticker')), 'source': txt(r.get('Nguon_quy_dat_2025')), 'n_parks': txt(r.get('Co_so_KCN_duoc_doi_chieu')),
                 'lease3y': txt(r.get('3Y_LEASE_ACTUAL_2023_25')), 'in19': txt(r.get('Da_co_vao_sheet_19')), 'reason': txt(r.get('Ly_do_quyet_dinh')),
                 'risk': txt(r.get('Rui_ro_so_lieu')), 'upgrade': txt(r.get('Huong_nang_cap_khi_co_du_lieu'))} for r in rows if txt(r.get('Ticker'))]
    yes = {c['ticker'] for c in coverage if (c['lease3y'] or '').upper() == 'YES'}
    check(yes == {'IDC'}, '20: chỉ IDC có chuỗi 3 năm', ', '.join(sorted(yes)))
    guide = [[txt(r[0]), txt(r[1]) if len(r) > 1 else None] for r in raw_rows(wb['21_LANDBANK_GUIDE'])]
    dash_rows = raw_rows(wb['22_LANDBANK_DASH'])
    bcm_dash = None
    for r in dash_rows:
        if txt(r[0]) and txt(r[0]).startswith('TỔNG 6 KCN'):
            bcm_dash = {'commercial_ha': num(r[1]), 'unleased_est_ha': r6(num(r[2]))}
    bcm6 = [x for x in landbank if x['ticker'] == 'BCM' and x['commercial_ha'] is not None]
    if bcm_dash:
        s_c, s_u = sum(x['commercial_ha'] for x in bcm6), sum(x['unleased_est_ha'] or 0 for x in bcm6)
        check(abs(s_c - bcm_dash['commercial_ha']) < 0.01 and abs(s_u - bcm_dash['unleased_est_ha']) < 0.01,
              '22: tổng 6 KCN BCM khớp sheet 17', f'{s_c:g} ha thương phẩm, {s_u:.1f} ha chưa lấp đầy ước tính')

    # ---- 10_ALL_FACTS_LONG: bảng chuẩn hóa để tra cứu, đối chiếu trùng với bảng chuyên đề
    _, rows = table(wb['10_ALL_FACTS_LONG'])
    facts = []
    for r in rows:
        if r.get('Value') is None and not txt(r.get('Metric')):
            continue
        sid = txt(r.get('Source_ID'))
        facts.append({'period': txt(r.get('Period')), 'region': txt(r.get('Region')), 'geo': txt(r.get('Geography')), 'segment': txt(r.get('Segment')),
                      'metric': txt(r.get('Metric')), 'value': num(r.get('Value')), 'unit': txt(r.get('Unit')), 'coverage': txt(r.get('Coverage')),
                      'quality': txt(r.get('Quality')), 'src': sid, 'url': url_or_none(sid, r.get('Source_URL')), 'note': txt(r.get('Analyst_note'))})
    # Mỗi fact dài phải tìm thấy đúng ô số ở một bảng chuyên đề cùng kỳ (là bản sao, không phải số cộng thêm).
    thematic = []
    def add(tbl, period, value, src=None):
        if value is not None:
            thematic.append((tbl, str(period), float(value), src))
    for m in market:
        for k in ('stock_ha', 'occ', 'abs_ha', 'ask_usd', 'ask_vnd'):
            add('01_MARKET_QUARTER', m['period'], m[k], m['src'])
    for p in province:
        for k in ('occ', 'ask_usd', 'ask_vnd', 'rent_yoy'):
            add('02_PROVINCE_MARKET', p['period'], p[k], p['src'])
    for a in absorption:
        add('03_NET_ABSORPTION', a['period'], a['value'], a['src'])
    for c in cbre:
        add('03B_CBRE_LEASING_2026', c['period'], c['value'], c['src'])
    for f in fdi:
        for k in ('new_n', 'new_usd', 'adj_n', 'adj_usd', 'ma_n', 'ma_usd'):
            add('04_MFG_FDI_2016_25', f['year'], f[k], f['src'])
    for s in fdi_snap:
        add('05_FDI_SNAPSHOTS', s['period'], s['value'], s['src'])
    for x in rbf:
        for k in ('stock_sqm', 'occ', 'abs_sqm', 'ask_usd', 'ask_vnd'):
            add('06_RBF_RBW', x['period'], x[k], x['src'])
    for d in dev:
        add('07_DEVELOPER_FACTS', d['period'], d['value'], d['src'])
    for p in pipeline:
        add('08_PROJECT_PIPELINE', p['period'], p['area_ha'], p['src'])
    dup = {}
    unmatched = []
    for f in facts:
        hit = None
        if f['value'] is not None:
            for tbl, per, val, tsrc in thematic:
                if per == str(f['period']) and abs(val - f['value']) <= 1e-6 * max(1, abs(val)) and (not tsrc or not f['src'] or tsrc == f['src']):
                    hit = tbl; break
            if hit is None:
                for tbl, per, val, _ in thematic:
                    if per == str(f['period']) and abs(val - f['value']) <= 1e-6 * max(1, abs(val)):
                        hit = tbl; break
        f['table'] = hit
        if hit:
            dup[hit] = dup.get(hit, 0) + 1
        else:
            unmatched.append(f)
    check(len(facts) >= 200, '10: đọc bảng fact dài', f'{len(facts)} dòng')
    checks.append({'name': '10: fact dài trùng bảng chuyên đề (không cộng thêm)', 'ok': True,
                   'detail': f'{len(facts) - len(unmatched)}/{len(facts)} dòng khớp ô số của bảng chuyên đề; {len(unmatched)} dòng chỉ có ở bảng dài'})

    # Số cùng nguồn, cùng kỳ, cùng vùng nhưng khác bảng: giữ cả hai, ghi quy tắc chọn.
    conflicts = []
    for c in cbre:
        for a in absorption:
            if a['period'] == c['period'] and a['region'] == c['region'] and 'CBRE' in (a['reporter'] or '') and a['value'] != c['value']:
                conflicts.append({'period': c['period'], 'region': c['region'], 'a': {'table': '03_NET_ABSORPTION', 'value': a['value'], 'obs': a['obs'], 'src': a['src']},
                                  'b': {'table': '03B_CBRE_LEASING_2026', 'value': c['value'], 'obs': c['status'], 'src': c['src']},
                                  'rule': 'Chart dùng 03B (số quý của SSI, khớp tổng H1 CBRE); 03 giữ số gốc CBRE ">130 ha" làm cận dưới trong tooltip.'})
    vgc_dev = [d for d in dev if d['ticker'] == 'VGC' and d['metric'] == 'Industrial_park_landbank']
    if vgc_dev and vgc.get('value_ha') is not None:
        conflicts.append({'period': f"{vgc['period']} vs {vgc_dev[0]['period']}", 'region': 'VGC',
                          'a': {'table': '18_COMPANY_LANDBANK', 'value': vgc['value_ha'], 'obs': '>4.500 ha · 17 KCN · BCTN 2025', 'src': 'BCTN 2025'},
                          'b': {'table': '07_DEVELOPER_FACTS', 'value': vgc_dev[0]['value'], 'obs': '>6.000 ha · 19 KCN · ĐHCĐ 2026', 'src': vgc_dev[0]['src']},
                          'rule': 'Khác kỳ và khác số KCN trong danh mục; cả hai là cận dưới, không phải đất thương phẩm. Bảng doanh nghiệp dùng BCTN 2025, ghi kèm số ĐHCĐ 2026.'})

    check(not errors, 'Không có lỗi chuẩn hóa', '; '.join(errors[:5]))
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        sys.exit(f'{len(errors)} lỗi trong workbook; không ghi {OUT_JSON.name}')

    data = {
        'schema': 1,
        'about': 'Dữ liệu workspace Khu công nghiệp (trang Bất động sản). Sinh bằng scripts/build_kcn_workbook.py từ workbook nghiên cứu; '
                 'không sửa tay — thay workbook rồi chạy lại script.',
        'as_of': as_of,
        'built': date.today().isoformat(),
        'workbook': {'file': str(DEFAULT_SRC.relative_to(ROOT)).replace('\\', '/') if src == DEFAULT_SRC else src.name,
                     'sha256': hashlib.sha256(raw).hexdigest(), 'sheets': SHEETS, 'rows': sheet_rows},
        'rebase': REBASE,
        'readme': readme, 'sources': sources,
        'market': market, 'province': province, 'absorption': absorption, 'cbre': cbre, 'cbre_qa': cbre_qa,
        'fdi': fdi, 'fdi_snap': fdi_snap, 'rbf': rbf, 'dev': dev, 'pipeline': pipeline, 'pipe_area': pipe_area,
        'chart_data': chart_data, 'qa': qa, 'playbook': playbook, 'dictionary': dictionary,
        'landbank': landbank, 'company': company, 'lease': lease, 'coverage': coverage, 'guide': guide,
        'facts': facts, 'dup': {'by_table': dup, 'unmatched': len(unmatched)}, 'conflicts': conflicts, 'checks': checks,
    }
    body = json.dumps(data, ensure_ascii=False, separators=(',', ':'), default=str)
    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=1, default=str) + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('window.KCN_MARKET=' + body + ';\n', encoding='utf-8', newline='\n')  # LF cả trên Windows để ?v= khớp bản trên web
    print(f'OK {len(checks)} kiểm tra · {len(market)} dòng vùng-quý · {len(landbank)} dự án · {len(facts)} fact → {OUT_JS.relative_to(ROOT)}')


if __name__ == '__main__':
    main(sys.argv)
