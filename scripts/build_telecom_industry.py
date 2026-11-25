#!/usr/bin/env python3
"""Dựng dữ liệu ngành cho dashboard Viễn thông (Vien-thong/).

  python scripts/build_telecom_industry.py

Đầu vào (có nguồn, URL, ngày công bố, trạng thái từng điểm; thu thập 25/11/2026):
  data/telecom/industry.json   số liệu toàn thị trường (Bộ KH&CN/Bộ TT&TT, Cục Thống kê, Sách Trắng)
  data/telecom/companies.json  số liệu vận hành doanh nghiệp (CTR, FOX, Viettel, VNPT, MobiFone, VGI)
  data/telecom/policy.json     tần số, mốc 5G, văn bản, giá gói cước, sự kiện
  data/raw/public/telecom-benchmarks.json  World Bank WDI (ITU), scripts/fetch_telecom_benchmarks.py
Đầu ra: data/telecom-industry.json/.js (window.TELECOM), data/telecom-benchmarks.js (window.TELECOM_BENCH).

Chuỗi số đặt về khóa chuẩn (SERIES_MAP) để trang vẽ; điểm giữ nguyên giá trị, kỳ, trạng thái, nguồn. Không nội suy, không
điền số thiếu, không đổi số thiếu thành 0. Điểm 'plan'/'target' không đưa vào chuỗi thực tế (chỉ nằm ở bảng kế hoạch).
"""
import datetime as dt, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/telecom'
OUT = ROOT / 'data/telecom-industry.json'
OUT_JS = ROOT / 'data/telecom-industry.js'
BENCH = ROOT / 'data/raw/public/telecom-benchmarks.json'
BENCH_JS = ROOT / 'data/telecom-benchmarks.js'

# khóa chuẩn của trang  ← (tệp, khóa trong tệp[, doanh nghiệp])
SERIES_MAP = {
    # Toàn thị trường (industry.json). Mỗi khóa một nguồn, một định nghĩa; không ghép hai nguồn vào một chuỗi.
    'rev': ('ind', 'nso_telecom_revenue_y'), 'rev_mic': ('ind', 'mic_telecom_service_revenue_y'),
    'rev_mobile_usd': ('ind', 'mic_revenue_mobile_usd_y'), 'rev_fixed_usd': ('ind', 'mic_revenue_fixed_usd_y'), 'rev_fbb_usd': ('ind', 'mic_revenue_fbb_usd_y'),
    'mob_subs': ('ind', 'nso_mobile_subs_y'), 'mob_traffic_subs': ('ind', 'mic_mobile_subs_traffic'), 'mob_data_users': ('ind', 'mic_mobile_subs_data_users'),
    'mob_bb': ('ind', 'mic_mbb_subs'), 'fix_bb': ('ind', 'nso_fbb_subs_y'), 'ftth': ('ind', 'mic_ftth_subs'), 'xdsl': ('ind', 'mic_xdsl_subs'),
    'ftth_hh_pct': ('ind', 'mst_ftth_household_pct_highlight'), 'smartphone': ('ind', 'mic_smartphone_subs'),
    'subs_5g': ('ind', 'subs_5g_total'), 'bts_5g': ('ind', 'bts_5g_total'), 'bts_total': ('ind', 'bts_total'),
    'pop': ('ind', 'nso_population_avg'), 'hh': ('ind', 'households'),
    # Doanh nghiệp (companies.json)
    'ctr_towers': ('com', 'CTR', 'ctr_bts_owned'), 'ctr_cotenant': ('com', 'CTR', 'ctr_bts_cotenant'), 'ctr_tenancy': ('com', 'CTR', 'ctr_tenancy'),
    'ctr_rev_build': ('com', 'CTR', 'ctr_rev_seg_y_xd'), 'ctr_rev_om': ('com', 'CTR', 'ctr_rev_seg_y_vhkt'),
    'ctr_rev_infra': ('com', 'CTR', 'ctr_rev_seg_y_htct'), 'ctr_rev_solution': ('com', 'CTR', 'ctr_rev_seg_y_gpth'),
    'ctr_gm_infra': ('com', 'CTR', 'ctr_gm_htct'), 'ctr_gm_om': ('com', 'CTR', 'ctr_gm_vhkt'), 'ctr_gm_build': ('com', 'CTR', 'ctr_gm_xd'), 'ctr_gm_solution': ('com', 'CTR', 'ctr_gm_gpth'),
    'ctr_viettel_share': ('com', 'CTR', 'ctr_viettel_share'),
    'fpt_tel_rev': ('com', 'FOX', 'fpt_seg_telecom_services_rev'), 'fpt_bb_rev': ('com', 'FOX', 'fpt_broadband_rev'),
    'op_rev_viettel': ('com', 'VIETTEL', 'viettel_rev'), 'op_profit_viettel': ('com', 'VIETTEL', 'viettel_pbt'),
    'op_rev_vnpt': ('com', 'VNPT', 'vnpt_rev'), 'op_profit_vnpt': ('com', 'VNPT', 'vnpt_pbt'),
    'op_rev_mobifone': ('com', 'MOBIFONE', 'mobifone_parent_rev'), 'op_profit_mobifone': ('com', 'MOBIFONE', 'mobifone_pbt'),
}
# Năm đầu dùng được (đổi phương pháp): Viettel 2015 là "doanh thu tổng", không so được với doanh thu hợp nhất từ 2023.
MIN_PERIOD = {'op_rev_viettel': '2023', 'rev': '2021'}  # doanh thu Cục Thống kê: từ 2021, sau đợt điều chỉnh số 2020 (381 → 315,2)
SCALE = {'hh': (1e-6, 'triệu hộ')}
# Bảng có nhãn theo thứ tự điểm (ghi trong notes của nguồn).
LABELLED = {
    'tower_owner_2019': (('com', 'VN_TOWER_MARKET', 'vn_sites_by_owner_2019'), ['Viettel và công ty con', 'MobiFone', 'VinaPhone', 'Vietnamobile và Gtel', 'TowerCo độc lập']),
    'towerco_2019': (('com', 'VN_TOWER_MARKET', 'vn_towerco_counts_2019'), ['OCK', '55T', 'Kiến Trung', 'Golden Tower', 'Nisco', 'Khác']),
    'towerco_2024': (('com', 'VN_TOWER_MARKET', 'vn_towerco_counts_2024'), ['CTR', 'OCK', 'Golden Tower', 'TowerCo nhỏ địa phương']),
}


def load(name):
    p = SRC / name
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}


ORG = {'nso.gov.vn': 'Cục Thống kê', 'mst.gov.vn': 'Bộ KH&CN', 'english.mst.gov.vn': 'Bộ KH&CN', 'mic.gov.vn': 'Bộ TT&TT', 'vneconomy.vn': 'VnEconomy',
       'en.vneconomy.vn': 'VnEconomy', 'vietnamnet.vn': 'VietNamNet', 'doanhnhan.baophapluat.vn': 'Báo Pháp luật', 'baodautu.vn': 'Báo Đầu tư',
       'tapchicongthuong.vn': 'Tạp chí Công Thương', 'e.vnexpress.net': 'VnExpress', 'theinvestor.vn': 'The Investor', 'viettimes.vn': 'VietTimes',
       'nhadautu.vn': 'Nhà Đầu tư', 'api.worldbank.org': 'World Bank (ITU)', 'sggp.org.vn': 'Báo SGGP', 'abs.vn': 'ABS', 'elibook.vn': 'Sách Trắng CNTT-TT',
       'tuoitre.vn': 'Tuổi Trẻ', 'news.tuoitre.vn': 'Tuổi Trẻ', 'nguoiquansat.vn': 'Người Quan Sát', 'znews.vn': 'Znews', 'vietnamnews.vn': 'Việt Nam News',
       'cafef.vn': 'CafeF', 'mbs.com.vn': 'MBS', 'new.bsc.com.vn': 'BSC', 'static1.vietstock.vn': 'Vietstock', 'bctn2025.fpt.com': 'BCTN FPT 2025',
       'bctn2023.fpt.com': 'BCTN FPT 2023', 'vir.com.vn': 'VIR', 'nhandan.vn': 'Nhân Dân', 'luatvietnam.vn': 'LuatVietnam', 'kpmg.com': 'KPMG',
       'trungtamwto.vn': 'Trung tâm WTO', 'baohatinh.vn': 'Báo Hà Tĩnh', 'thitruongtaichinhtiente.vn': 'Thị trường Tài chính Tiền tệ', 'vnbusiness.vn': 'VnBusiness',
       'baomoi.com': 'Báo Mới', 'anninhthudo.vn': 'An ninh Thủ đô', '24hmoney.vn': '24HMoney', 'mekongasean.vn': 'Mekong ASEAN', 'telecomlead.com': 'TelecomLead',
       'baodauthau.vn': 'Báo Đấu thầu', 'lsvn.vn': 'Luật sư Việt Nam', 'tienphong.vn': 'Tiền Phong', 'vnreview.vn': 'VnReview', 'vtcnews.vn': 'VTC News',
       'baolaocai.vn': 'Báo Lào Cai', 'pbgdpl.tuyenquang.gov.vn': 'Sở Tư pháp Tuyên Quang'}


def org_of(url):
    m = re.match(r'https?://(?:www\.)?([^/]+)', url or '')
    d = m.group(1) if m else ''
    return ORG.get(d, d)


def main():
    ind, com, pol = load('industry.json'), load('companies.json'), load('policy.json')
    sources, remap = [], {}

    def add_sources(doc, tag):
        for s in doc.get('sources', []):
            nid = len(sources)
            remap[(tag, s['id'])] = nid
            sources.append({'id': nid, 'name': s.get('name', ''), 'org': s.get('org') or org_of(s.get('url')), 'url': s.get('url', ''),
                            'published': s.get('published', ''), 'quote': s.get('quote', '')})
    add_sources(ind, 'ind'); add_sources(com, 'com'); add_sources(pol, 'pol')

    def pts(s, tag):
        out = []
        for p in s.get('points', []):
            if p.get('status') in ('plan', 'target') or not isinstance(p.get('v'), (int, float)):
                continue
            out.append([str(p['p']), p['v'], p.get('status', 'actual'), remap.get((tag, p.get('src')))])
        return sorted(out, key=lambda x: x[0])

    series = {}
    raw = {('ind', s['key']): s for s in ind.get('series', [])}
    for t, c in com.get('companies', {}).items():
        for s in c.get('series', []):
            raw[('com', t, s['key'])] = s
    for key, ref in SERIES_MAP.items():
        s = raw.get(ref)
        if not s:
            continue
        p = [x for x in pts(s, ref[0]) if x[0] >= MIN_PERIOD.get(key, '')]
        sc, unit = SCALE.get(key, (1, s.get('unit', '')))
        p = [[a, round(v * sc, 4), st, sr] for a, v, st, sr in p]
        if p:
            series[key] = {'label': s.get('label', key), 'unit': unit, 'freq': s.get('freq', ''), 'kind': s.get('kind', ''),
                           'def': s.get('definition', ''), 'scope': s.get('scope', ''), 'points': p}

    def rs(items):
        return [{**x, 'src': remap.get(('pol', x.get('src')))} for x in items]
    companies = {}
    for t, c in com.get('companies', {}).items():
        companies[t] = {'profile': c.get('profile', ''), 'facts': [{'text': f['text'], 'src': remap.get(('com', f.get('src')))} for f in c.get('facts', [])]}
    labelled = {}
    for key, (ref, names) in LABELLED.items():
        s = raw.get(ref)
        if s and len(s['points']) == len(names):
            labelled[key] = {'label': s['label'], 'unit': s['unit'], 'scope': s.get('scope', ''), 'rows': [[n, p['v'], p['p'], remap.get((ref[0], p.get('src')))] for n, p in zip(names, s['points'])]}
    payload = {
        'schema': 1, 'built_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'series': series, 'labelled': labelled, 'shares': SHARES(ind, remap), 'sources': sources, 'companies': companies,
        'spectrum': rs(pol.get('spectrum', [])), 'fiveg': rs(pol.get('fiveg', [])), 'policy': rs(pol.get('policy', [])),
        'prices': rs(pol.get('prices', [])), 'events': rs(pol.get('events', [])),
    }
    txt = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    OUT.write_text(txt + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('window.TELECOM = ' + txt + ';\n', encoding='utf-8', newline='\n')
    if BENCH.exists():
        b = json.loads(BENCH.read_text(encoding='utf-8'))
        BENCH_JS.write_text('window.TELECOM_BENCH = ' + json.dumps(b, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(series), 'chuỗi;', len(sources), 'nguồn;', {k: len(payload[k]) for k in ('spectrum', 'fiveg', 'policy', 'prices', 'events')})


def SHARES(ind, remap):
    """Thị phần theo năm: {'mobile': {năm: {doanh nghiệp: %}}, 'fixed': …, '<thị trường>_src': [nguồn]} (chuỗi share_* trong industry.json)."""
    out = {m: {} for m in ('mobile', 'fixed', 'fixed_rev', 'mobile_rev', 'mbb')}
    out.update({m + '_src': [] for m in list(out)})
    for s in ind.get('series', []):
        m = SHARE_KEYS.get(s['key'])
        if not m:
            continue
        mk, op = m
        for p in s.get('points', []):
            if p.get('status') in ('plan', 'target') or not isinstance(p.get('v'), (int, float)) or not re.fullmatch(r'\d{4}', str(p['p'])):
                continue
            out[mk].setdefault(str(p['p']), {})[op] = p['v']
            out[mk + '_src'].append(remap.get(('ind', p.get('src'))))
    # Năm chỉ có một phần thị trường (vd. 2024 chỉ Viettel) không đưa vào chart chồng / CR3 / HHI.
    for m in ('mobile', 'fixed', 'mbb'):
        out[m] = {y: v for y, v in out[m].items() if sum(v.values()) >= 90}
    return out


SHARE_KEYS = {
    **{f'ms_mobile_subs_{k}': ('mobile', n) for k, n in [('viettel', 'Viettel'), ('vnpt', 'VinaPhone'), ('mobifone', 'MobiFone'), ('vietnamobile', 'Vietnamobile'), ('gtel', 'Gmobile'), ('others', 'Khác')]},
    **{f'ms_fbb_subs_{k}': ('fixed', n) for k, n in [('vnpt', 'VNPT'), ('viettel', 'Viettel'), ('fpt', 'FPT Telecom'), ('sctv', 'SCTV'), ('others', 'Khác')]},
    **{f'ms_fbb_rev_{k}': ('fixed_rev', n) for k, n in [('vnpt', 'VNPT'), ('viettel', 'Viettel'), ('fpt', 'FPT Telecom'), ('others', 'Khác')]},
    **{f'ms_mobile_rev_{k}': ('mobile_rev', n) for k, n in [('viettel', 'Viettel'), ('vnpt', 'VinaPhone')]},
    **{f'ms_mbb_subs_{k}': ('mbb', n) for k, n in [('viettel', 'Viettel'), ('vnpt', 'VinaPhone'), ('mobifone', 'MobiFone'), ('vietnamobile', 'Vietnamobile'), ('indochina', 'Khác')]},
}

if __name__ == '__main__':
    sys.exit(main())
