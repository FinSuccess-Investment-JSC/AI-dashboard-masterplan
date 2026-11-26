#!/usr/bin/env python3
"""Dựng dữ liệu ngành cho dashboard Viễn thông (Vien-thong/).

  python scripts/build_telecom_industry.py

Đầu vào (có nguồn, URL, ngày công bố, trạng thái từng điểm; thu thập 25/11/2026):
  data/telecom/industry.json   số liệu toàn thị trường (Bộ KH&CN/Bộ TT&TT, Cục Thống kê, Sách Trắng)
  data/telecom/companies.json  số liệu vận hành doanh nghiệp (CTR, FOX, Viettel, VNPT, MobiFone, VGI)
  data/telecom/policy.json     tần số, mốc 5G, văn bản, giá gói cước, sự kiện
  data/raw/public/telecom-benchmarks.json  World Bank WDI (ITU), scripts/fetch_telecom_benchmarks.py
Đầu ra: data/telecom-industry.json/.js (window.TELECOM), data/telecom-benchmarks.js (window.TELECOM_BENCH),
  data/telecom-news.json/.js (window.TELECOM_NEWS: bài gốc → sự kiện → chủ đề, cùng khuôn data/power/news.json của Điện).
Thêm (26/11/2026): 'plans' (điểm kế hoạch/mục tiêu của doanh nghiệp, chỉ dùng ở Triển vọng), 'outlook' (mốc phía trước có
nguồn: nghĩa vụ cấp phép tự tính từ ngày cấp phép, mục tiêu 5G, kế hoạch doanh nghiệp, văn bản dự thảo), ngày ban hành /
hiệu lực của văn bản khi chính văn bản nguồn ghi rõ.

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
NEWS = ROOT / 'data/telecom-news.json'
NEWS_JS = ROOT / 'data/telecom-news.js'
TODAY = dt.date.today().isoformat()

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
    'vgi_growth_2024': (('com', 'VGI', 'vgi_mkt_growth_h1_2024'), ['Lumitel (Burundi)', 'Unitel (Lào)', 'Mytel (Myanmar)', 'Movitel (Mozambique)', 'Natcom (Haiti)']),
    'vgi_growth_2025': (('com', 'VGI', 'vgi_mkt_growth_h1_2025'), ['Lumitel (Burundi)', 'Halotel (Tanzania)', 'Natcom (Haiti)']),
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
    # Kế hoạch, mục tiêu của doanh nghiệp (không vào chuỗi thực tế).
    plans = []
    for t, c in com.get('companies', {}).items():
        for sr in c.get('series', []):
            for pt in sr.get('points', []):
                if pt.get('status') in ('plan', 'target') and isinstance(pt.get('v'), (int, float)):
                    plans.append({'company': t, 'key': sr['key'], 'label': sr['label'], 'unit': sr.get('unit', ''), 'p': str(pt['p']), 'v': pt['v'], 'src': remap.get(('com', pt.get('src')))})
    policy = [{**x, 'src': remap.get(('pol', x.get('src'))), **doc_dates(x)} for x in pol.get('policy', [])]
    payload = {
        'schema': 1, 'built_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'series': series, 'labelled': labelled, 'shares': SHARES(ind, remap), 'sources': sources, 'companies': companies,
        'spectrum': rs(pol.get('spectrum', [])), 'fiveg': rs(pol.get('fiveg', [])), 'policy': policy, 'plans': plans,
        'prices': rs(pol.get('prices', [])), 'events': rs(pol.get('events', [])),
    }
    payload['outlook'] = outlook(payload)
    news = build_news(payload)
    ntxt = json.dumps(news, ensure_ascii=False, separators=(',', ':'))
    NEWS.write_text(ntxt + '\n', encoding='utf-8', newline='\n')
    NEWS_JS.write_text('window.TELECOM_NEWS = ' + ntxt + ';\n', encoding='utf-8', newline='\n')
    txt = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    OUT.write_text(txt + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('window.TELECOM = ' + txt + ';\n', encoding='utf-8', newline='\n')
    if BENCH.exists():
        b = json.loads(BENCH.read_text(encoding='utf-8'))
        BENCH_JS.write_text('window.TELECOM_BENCH = ' + json.dumps(b, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    print(NEWS.relative_to(ROOT), len(news['events']), 'sự kiện;', len(news['topics']), 'chủ đề;', len(payload['outlook']), 'mốc triển vọng')
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



def doc_dates(x):
    """Ngày ban hành / hiệu lực chỉ lấy khi văn bản nguồn ghi rõ (không suy đoán)."""
    txt = ' '.join([x.get('doc', ''), x.get('title', '')])
    out = {}
    def d(m):
        dd, mm, yy = m.groups()
        return f'{yy}-{int(mm):02d}-{int(dd):02d}'
    m = re.search(r'(?:ban hành|thông qua)\s+(\d{1,2})/(\d{1,2})/(\d{4})', txt)
    if m:
        out['issued'] = d(m)
    m = re.search(r'hiệu lực\s+(\d{1,2})/(\d{1,2})/(\d{4})', txt)
    if m:
        out['effective'] = d(m)
    elif re.search(r'có hiệu lực$', x.get('title', '')):
        out['effective'] = x.get('date')
    return out


def add_years(date, n):
    y, m, dd = date.split('-')
    return f'{int(y) + n}-{m}-{dd}'


def outlook(P):
    """Mốc phía trước (từ hôm nay) có nguồn. kind: obligation (tự tính từ ngày cấp phép), target, plan, draft."""
    out = []
    for x in P['spectrum']:
        if not x.get('price_bn_vnd') or not x.get('date'):
            continue
        ob = x.get('obligation') or ''
        for yrs, pat in ((1, r'12 tháng'), (2, r'2 năm|sau 2 năm'), (3, r'3 năm'), (4, r'4 năm')):
            if re.search(pat, ob):
                due = add_years(x['date'], yrs)
                if due >= TODAY:
                    out.append({'date': due, 'title': f"Hạn nghĩa vụ {yrs} năm sau cấp phép · {x['band'].split(' (')[0]}", 'status': 'Nghĩa vụ cấp phép (ngày tự tính)',
                                'parties': x['winner'], 'variable': 'Số trạm, tỷ lệ phủ sóng, CAPEX mạng', 'watch': 'Số trạm, mức phủ theo xã/dân số mà doanh nghiệp công bố', 'detail': ob, 'src': x['src']})
    for x in P['fiveg']:
        if x.get('status') == 'target' and x['date'] >= TODAY and x.get('event') == 'target':
            out.append({'date': x['date'], 'title': x['text'], 'status': 'Mục tiêu', 'parties': x['operator'], 'variable': 'Số trạm 5G, độ phủ, CAPEX',
                        'watch': 'Số trạm, thuê bao 5G ở đợt công bố tiếp theo của Bộ KH&CN', 'detail': f"{x.get('value')} {x.get('unit', '')}".strip(), 'src': x['src']})
    names = {'CTR': 'CTR', 'FOX': 'FOX (FPT Telecom)', 'VNPT': 'VNPT', 'VIETTEL': 'Viettel', 'MOBIFONE': 'MobiFone', 'SGT': 'SGT'}
    var = {'rev': 'Doanh thu', 'pbt': 'Lợi nhuận trước thuế', 'capex': 'CAPEX', 'bts': 'Số trạm', '5g': 'Số trạm 5G', 'tenancy': 'Tỷ lệ thuê chung'}
    for x in P['plans']:
        y = x['p'][:4]
        if y + '-12-31' < TODAY or x['key'] == 'viettel_5g_new':  # viettel_5g_new trùng mục tiêu 5G của Viettel (fiveg)
            continue
        if x['key'] == 'ctr_plan':
            x = {**x, 'label': 'kế hoạch doanh thu'}
        k = next((v for k, v in var.items() if k in x['key']), 'Kế hoạch kinh doanh')
        out.append({'date': y + '-12-31', 'title': f"{names.get(x['company'], x['company'])}: {x['label']} {y}", 'status': 'Kế hoạch doanh nghiệp', 'parties': names.get(x['company'], x['company']),
                    'variable': k, 'watch': 'Số thực hiện trong BCTC và bản tin tháng/quý', 'detail': f"{x['v']:,.0f} {x['unit']}".replace(',', '.') if x['v'] >= 100 else f"{x['v']} {x['unit']}", 'src': x['src']})
    for x in P['policy']:
        if x.get('status') in ('draft', 'plan'):
            out.append({'date': x['date'], 'title': x['title'], 'status': 'Dự thảo' if x['status'] == 'draft' else 'Kế hoạch', 'parties': '', 'variable': 'Sở hữu, quản trị doanh nghiệp nhà nước',
                        'watch': 'Văn bản chính thức được ban hành', 'detail': x.get('effect', ''), 'src': x['src'], 'open': True})
    return sorted(out, key=lambda z: z['date'])


TOPICS = [
    ('5g', '5G: trạm và thuê bao', 'Viettel thương mại hóa 5G từ 15/10/2024, VNPT từ 20/12/2024, MobiFone từ 26/3/2025. Bộ KH&CN công bố số trạm, thuê bao 5G theo đợt.',
     'Theo dõi: số trạm 5G, thuê bao 5G và tỷ lệ phủ sóng ở đợt công bố tiếp theo.', ['Bức tranh ngành › Di động & 5G', '?section=mobile#mt2']),
    ('spectrum', 'Đấu giá & cấp phép tần số', 'Từ 2024 Bộ đấu giá các băng 2.500–2.600 MHz, 3.700–3.900 MHz, 700 MHz và 900 MHz (sau khi tắt 2G).',
     'Theo dõi: nghĩa vụ số trạm sau cấp phép, các đợt đấu giá tiếp theo.', ['Bức tranh ngành › Chính sách', '?section=policy#mt2']),
    ('cable', 'Cáp quang biển', 'Kết nối quốc tế đi qua các tuyến cáp biển (AAG, APG, IA, AAE-1, SJC2, ADC).',
     'Theo dõi: thời gian sửa chữa, tuyến mới đưa vào khai thác.', None),
    ('tower', 'TowerCo & hạ tầng dùng chung', 'CTR là TowerCo lớn nhất theo số trạm sở hữu; phần lớn trạm do nhà mạng tự sở hữu.',
     'Theo dõi: số trạm CTR, tỷ lệ thuê chung, doanh thu hạ tầng cho thuê hằng tháng.', ['Bức tranh ngành › TowerCo & hạ tầng', '?section=tower#mt2']),
    ('price', 'Giá cước', 'Giá gói niêm yết thay đổi theo đợt; khách hiện hữu giữ giá theo hợp đồng.',
     'Theo dõi: giá gói thấp nhất theo tốc độ và khu vực.', ['Bức tranh ngành › Internet cố định', '?section=fixed#mt2']),
    ('ownership', 'Sở hữu & tái cấu trúc', 'Vốn nhà nước tại MobiFone, GTEL và FPT Telecom chuyển về Bộ Công an; VNPT có đề xuất chuyển về Bộ KH&CN (dự thảo).',
     'Theo dõi: văn bản chính thức về VNPT, thay đổi quản trị tại FOX.', None),
    ('tech', 'Dừng 2G', 'Thuê bao chỉ dùng máy 2G bị khóa từ 16/10/2024; mạng 2G tắt hoàn toàn 15/9/2026, giải phóng băng 900 MHz.',
     'Theo dõi: dùng băng 900 MHz cho 4G/5G theo nghĩa vụ cấp phép.', None),
    ('competition', 'Cạnh tranh & nhà mạng di động ảo', 'Thị trường di động có ba nhà mạng lớn và các nhà mạng di động ảo (MVNO).',
     'Theo dõi: thị phần thuê bao, số MVNO.', ['Bức tranh ngành › Toàn thị trường', '?section=market#mt2']),
    ('satellite', 'Internet vệ tinh', 'Starlink được cấp phép tần số thí điểm (2/2026) với tối đa 600.000 thiết bị đầu cuối.',
     'Theo dõi: số thuê bao, giá dịch vụ.', None),
]
TOPIC_OF = {'sở hữu': 'ownership', 'hạ tầng quốc tế': 'cable', 'tần số': 'spectrum', 'capex': '5g', '5G': '5g', 'cấp phép': 'satellite',
            'giá cước': 'price', 'cạnh tranh': 'competition', 'towerco': 'tower', 'công nghệ': 'tech'}
CATEGORY = {'5g': 'network', 'spectrum': 'policy', 'cable': 'network', 'tower': 'infra', 'price': 'market', 'ownership': 'companies',
            'tech': 'network', 'competition': 'market', 'satellite': 'policy'}
SEGMENT = {'5g': ['Di động'], 'spectrum': ['Di động'], 'cable': ['Toàn ngành'], 'tower': ['Hạ tầng & TowerCo'], 'price': ['Internet cố định'],
           'ownership': ['Toàn ngành'], 'tech': ['Di động'], 'competition': ['Di động'], 'satellite': ['Internet cố định']}
VARIABLE = {'5g': 'Biến số liên quan: số trạm, thuê bao 5G, CAPEX mạng', 'spectrum': 'Biến số liên quan: chi phí tần số, nghĩa vụ số trạm, CAPEX',
            'cable': 'Biến số liên quan: dung lượng kết nối quốc tế, chất lượng dịch vụ', 'tower': 'Biến số liên quan: số trạm, tỷ lệ thuê chung, doanh thu cho thuê',
            'price': 'Biến số liên quan: giá gói, ARPU, thuê bao mới', 'ownership': 'Biến số liên quan: cổ đông, quản trị, kế hoạch đầu tư',
            'tech': 'Biến số liên quan: thuê bao, băng tần, chi phí vận hành mạng', 'competition': 'Biến số liên quan: thị phần, giá cước',
            'satellite': 'Biến số liên quan: cạnh tranh Internet vùng sâu, xa'}
TICKERS = {'FPT Telecom (FOX)': 'FOX', 'FPT Telecom': 'FOX', 'Viettel Construction (CTR)': 'CTR', 'VNPT (VinaPhone)': 'VNPT', 'Starlink Services Việt Nam (SpaceX)': 'Starlink'}


def build_news(P):
    """Bài gốc → sự kiện → chủ đề (khuôn data/power/news.json). Sự kiện: events trong policy.json, cộng các đợt đấu giá,
    khai trương 5G và số liệu 5G toàn quốc chưa có trong events. Cùng một bài nguồn thì gom vào một sự kiện."""
    S = {s['id']: s for s in P['sources']}
    articles, events = {}, []

    def art(sid):
        s = S.get(sid)
        if s is None:
            return None
        aid = f's{sid}'
        articles.setdefault(aid, {'id': aid, 'source_name': s['org'] or s['name'], 'title': s['name'], 'url': s['url'], 'published_at': s['published'] or ''})
        return aid

    def add(eid, title, what, quant, companies, topic, sid, date, importance):
        a = art(sid)
        if not a:
            return
        for e in events:
            if a in e['article_ids'] and e['topic_ids'] == [topic]:
                if quant and quant not in e['key_figures']:
                    e['key_figures'].append(quant)
                for c in companies:  # cùng một bài nhắc nhiều doanh nghiệp: gom, đặt lại tiêu đề chung
                    c = TICKERS.get(c, c)
                    if c not in e['companies']:
                        e['companies'].append(c)
                        if e['title'].startswith('Thuê bao 5G'):
                            e['title'] = 'Thuê bao 5G theo nhà mạng'
                return
        tk = [TICKERS.get(c, c) for c in companies]
        events.append({'id': eid, 'title': title, 'summary': what, 'new_information': what, 'key_figures': [quant] if quant else [],
                       'companies': tk, 'segments': SEGMENT[topic], 'category': CATEGORY[topic], 'topic_ids': [topic],
                       'importance': importance, 'event_date': date, 'article_ids': [a], 'impact': VARIABLE[topic]})
    imp = {'spectrum': 3, '5g': 3, 'ownership': 3, 'tower': 2, 'price': 2, 'tech': 2, 'cable': 2, 'competition': 1, 'satellite': 1}
    for i, e in enumerate(P['events']):
        t = TOPIC_OF.get(e['topic'], 'competition')
        add(f'ev{i}', e['title'], e['what'], e.get('quant') or '', e.get('companies', []), t, e['src'], e['date'], imp[t])
    for i, x in enumerate(P['spectrum']):
        if x.get('price_bn_vnd'):
            add(f'sp{i}', f"{x['winner']} trúng đấu giá {x['band'].split(' (')[0]}", f"Giá trúng {x['price_bn_vnd']:,.1f} tỷ đồng, giá khởi điểm {x['reserve_bn_vnd']:,.1f} tỷ đồng.".replace(',', 'X').replace('.', ',').replace('X', '.'),
                x.get('obligation', ''), [x['winner']], 'spectrum', x['src'], x['date'], 3)
    for i, x in enumerate(P['fiveg']):
        if x.get('status') != 'actual' or x.get('event') not in ('launch', 'subscribers', 'stations'):
            continue
        title = {'launch': f"{x['operator']} thương mại hóa 5G", 'subscribers': f"Thuê bao 5G {x['operator']}", 'stations': f"Số trạm 5G {x['operator']}"}[x['event']]
        q = f"{x['value']:g} {x['unit']}" if isinstance(x.get('value'), (int, float)) else ''
        add(f'g{i}', title, x['text'], q, [x['operator']] if x['operator'] != 'Toàn quốc' else [], '5g', x['src'], x['date'], 2 if x['event'] != 'launch' else 3)
    used = {t for e in events for t in e['topic_ids']}
    topics = [{'id': i, 'title': t, 'background': b, 'next_check': n, 'related_data': r} for i, t, b, n, r in TOPICS if i in used]
    return {'updated_at': max(a['published_at'] for a in articles.values()), 'articles': sorted(articles.values(), key=lambda a: a['id']),
            'events': events, 'topics': topics}

if __name__ == '__main__':
    sys.exit(main())
