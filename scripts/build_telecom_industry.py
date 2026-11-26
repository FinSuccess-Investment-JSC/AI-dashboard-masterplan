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
    """Mốc phía trước (từ hôm nay) có nguồn (bản 26/11/2026):
    - Nghĩa vụ giấy phép: ngày = ngày cấp phép + thời hạn (tự tính); các khối cùng ngày cấp phép, cùng nghĩa vụ gộp một dòng / hạn.
    - Mục tiêu 5G: ghi rõ định nghĩa (trạm xây thêm, tổng vị trí trạm, độ phủ theo dân số); tiến độ chỉ ghi khi số thực hiện cùng định nghĩa.
    - Kế hoạch doanh nghiệp: gộp các chỉ tiêu cùng kế hoạch năm của một doanh nghiệp vào một dòng.
    - Văn bản dự thảo: giữ đến khi có văn bản chính thức."""
    out = []
    # 1) Nghĩa vụ theo giấy phép
    groups = {}
    for x in P['spectrum']:
        if not x.get('price_bn_vnd') or not x.get('date'):
            continue
        ob = x.get('obligation') or ''
        groups.setdefault((x['date'], x['band'][:1]), []).append(x)  # các khối cùng băng, cùng ngày cấp phép
    for (d0, _), xs in groups.items():
        base = max((x.get('obligation') or '' for x in xs), key=len)  # mô tả đầy đủ nhất trong nhóm (các khối khác ghi "Như khối …")
        band = '900 MHz' if xs[0]['band'].startswith('9') else xs[0]['band'].split(' (')[0]
        steps = []
        m = re.search(r'12 tháng[^;]*', base)
        if m: steps.append((1, m.group(0)))
        for yrs in (2, 3, 4):
            m = re.search(rf'{yrs} năm:\s*([^;]*)', base) or re.search(rf'sau {yrs} năm[^;]*', base)
            if m: steps.append((yrs, m.group(1) if m.lastindex else m.group(0)))
        for yrs, txt in steps:
            due = add_years(d0, yrs)
            if due < TODAY:
                continue
            out.append({'date': due, 'kind': 'license', 'issued': d0, 'title': f'Băng {band}: hạn nghĩa vụ năm thứ {yrs} (tính từ ngày trúng đấu giá)', 'status': 'Nghĩa vụ giấy phép',
                        'parties': ', '.join(x['winner'] for x in xs), 'variable': 'CAPEX mạng (số BTS, phủ xã); doanh thu xây lắp của nhà thầu',
                        'watch': 'Số BTS và tỷ lệ xã có sóng nhà mạng công bố', 'detail': txt.strip(), 'src': xs[0]['src']})
    # 2) Mục tiêu 5G, ghi rõ định nghĩa
    def measure(unit, text):
        u = (unit or '') + ' ' + (text or '')
        if 'xây thêm' in u: return 'Trạm 5G xây thêm trong năm' + (' · phủ trong nhà' if 'trong nhà' in u else '')
        if 'vị trí' in u: return 'Tổng vị trí trạm 5G' + (' · phủ dân số' if 'dân số' in u else '')
        if '%' in u and 'dân số' in u: return 'Độ phủ 5G theo dân số'
        if 'trạm' in u: return 'Tổng số trạm 5G'
        return unit or ''
    actual = {}
    for x in P['fiveg']:
        if x.get('status') == 'actual' and x.get('event') == 'stations' and isinstance(x.get('value'), (int, float)):
            if x['date'] > actual.get(x['operator'], {}).get('date', ''):
                actual[x['operator']] = x
    for x in P['fiveg']:
        if x.get('status') == 'target' and x['date'] >= TODAY and x.get('event') == 'target':
            ms = measure(x.get('unit'), x.get('text'))
            act = actual.get(x['operator'])
            prog = ''
            if act and 'trạm' in ms:
                same = measure(act.get('unit'), '') == ms
                prog = (f"Thực hiện {act['value']:,.0f} {act['unit']} ({act['date'][8:10]}/{act['date'][5:7]}/{act['date'][:4]})".replace(',', '.') +
                        ('' if same else ' · khác định nghĩa với mục tiêu, không tính tiến độ'))
            out.append({'date': x['date'], 'kind': 'target', 'title': x['text'], 'status': 'Mục tiêu', 'measure': ms, 'progress': prog, 'parties': x['operator'],
                        'variable': 'CAPEX 5G của nhà mạng; doanh thu xây lắp, cho thuê hạ tầng (CTR)', 'watch': 'Số trạm, độ phủ 5G ở đợt công bố tiếp theo của Bộ KH&CN',
                        'detail': f"{x.get('value'):,} {x.get('unit', '')}".replace(',', '.').strip(), 'src': x['src']})
    # 3) Kế hoạch doanh nghiệp: gộp theo doanh nghiệp × năm
    names = {'CTR': 'CTR', 'FOX': 'FOX (FPT Telecom)', 'VNPT': 'VNPT', 'VIETTEL': 'Viettel', 'MOBIFONE': 'MobiFone', 'SGT': 'SGT'}
    lab = {'fox_rev': 'doanh thu', 'fox_pbt': 'LNTT', 'fox_capex_plan': 'đầu tư phát triển hạ tầng', 'ctr_plan': 'doanh thu', 'vnpt_rev': 'doanh thu hợp nhất',
           'vnpt_pbt': 'LNTT hợp nhất', 'vnpt_parent_rev': 'doanh thu công ty mẹ', 'sgt_rev': 'doanh thu'}
    line = {'FOX': 'FOX: doanh thu, LNTT (BCTC FOX); CAPEX hạ tầng cáp quang', 'CTR': 'CTR: doanh thu xây lắp, vận hành, cho thuê hạ tầng', 'VNPT': 'Nhà mạng (chưa niêm yết)', 'SGT': 'SGT: doanh thu'}
    plan = {}
    for x in P['plans']:
        y = x['p'][:4]
        if y + '-12-31' < TODAY or x['key'] == 'viettel_5g_new':  # viettel_5g_new trùng mục tiêu 5G của Viettel (fiveg)
            continue
        plan.setdefault((x['company'], y), []).append(x)
    for (co, y), xs in plan.items():
        parts = [f"{lab.get(x['key'], x['label'])} {x['v']:,.0f} {x['unit']}".replace(',', '.') for x in xs]
        out.append({'date': y + '-12-31', 'kind': 'plan', 'title': f"{names.get(co, co)}: kế hoạch năm {y}", 'status': 'Kế hoạch doanh nghiệp', 'parties': names.get(co, co),
                    'variable': line.get(co, 'Kế hoạch kinh doanh'), 'watch': 'Số thực hiện trong BCTC quý và bản tin tháng', 'detail': ' · '.join(parts), 'src': xs[0]['src']})
    # 4) Văn bản dự thảo
    for x in P['policy']:
        if x.get('status') in ('draft', 'plan'):
            out.append({'date': x['date'], 'kind': 'draft', 'title': x['title'], 'status': 'Dự thảo' if x['status'] == 'draft' else 'Kế hoạch', 'parties': 'VNPT' if 'VNPT' in x['title'] else '',
                        'variable': 'Sở hữu, quản trị doanh nghiệp nhà nước', 'watch': 'Nghị định sửa đổi được ban hành chính thức', 'detail': x.get('effect', ''), 'src': x['src'], 'open': True})
    order = {'draft': 0, 'target': 1, 'plan': 2, 'license': 3}
    return sorted(out, key=lambda z: (z['date'], order.get(z['kind'], 9)))


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
    ('tech', 'Tắt 2G → đấu giá 900 MHz → nghĩa vụ triển khai', 'Theo trình tự: thuê bao chỉ dùng máy 2G bị khóa từ 16/10/2024 → QĐ 3168/QĐ-BKHCN (21/07/2026) duyệt phương án đấu giá 900 MHz → mạng 2G tắt hoàn toàn 15/09/2026 → đấu giá 3 cặp khối 900 MHz ngày 09/09/2026.',
     'Theo dõi: nghĩa vụ giấy phép 900 MHz — ≥20% số BTS sau 12 tháng (09/2027), ≥5.500 BTS và 60% xã có BTS sau 2 năm (09/2028), 85% xã sau 3 năm, 100% xã sau 4 năm (09/2030).', ['Tổng quan › Triển vọng', '?ov=outlook#mt1']),
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
NEXT = {'5g': 'ARPU hoặc doanh thu dịch vụ di động cùng kỳ với số thuê bao 5G; số trạm 5G theo nhà mạng.',
        'spectrum': 'số BTS, tỷ lệ xã có sóng tại các hạn nghĩa vụ giấy phép; CAPEX nhà mạng.',
        'cable': 'thời gian khắc phục, dung lượng dự phòng; tuyến mới đưa vào khai thác.',
        'tower': 'số vị trí sở hữu, số khách thuê trên vị trí, doanh thu hạ tầng cho thuê trong bản tin tháng của CTR.',
        'price': 'giá gói cùng tốc độ, khu vực ở đợt điều chỉnh sau; doanh thu dịch vụ Internet cố định.',
        'ownership': 'văn bản chính thức, thay đổi hội đồng quản trị và kế hoạch đầu tư.',
        'tech': 'số BTS và tỷ lệ xã có sóng băng 900 MHz tại các hạn nghĩa vụ.',
        'competition': 'thị phần thuê bao di động, số thuê bao của nhà mạng mới.',
        'satellite': 'số thuê bao, giá dịch vụ Internet vệ tinh.'}
RETITLE = {'CTR chưa tăng số trạm BTS năm 2026': 'CTR: số trạm BTS đi ngang từ cuối 2025 đến cuối tháng 7/2026 (bài 22/08/2026)'}
SUMMARY = {
    '5G đạt 27,2 triệu thuê bao': 'Bộ KH&CN: 27,2 triệu thuê bao 5G và 60.034 trạm 5G cuối quý 3/2026, phủ 93,4% dân số; thuê bao tăng khoảng 94% so với 14 triệu tháng 9/2025. Biến số: thuê bao 5G, CAPEX trạm của nhà mạng. Kiểm chứng tiếp: ARPU hoặc doanh thu dịch vụ di động cùng kỳ để biết nhà mạng có thu thêm tiền trên mỗi thuê bao hay chỉ chuyển thuê bao 4G sang 5G.',
    'Đấu giá 3 cặp khối 900 MHz': 'VNPT, Viettel, Vietnamobile mỗi bên trúng một cặp khối 2×5 MHz băng 900 MHz, khoảng 1.077–1.079 tỷ đồng mỗi cặp (khởi điểm 1.056,9 tỷ), thời hạn 15 năm. Biến số: chi phí tần số và CAPEX để đạt nghĩa vụ ≥20% số BTS sau 12 tháng (09/2027), ≥5.500 BTS và 60% xã sau 2 năm (09/2028), 100% xã sau 4 năm (09/2030).',
    'CTR: số trạm BTS đi ngang từ cuối 2025 đến cuối tháng 7/2026 (bài 22/08/2026)': 'Bài đăng 22/08/2026: CTR giữ khoảng 12.000 trạm từ cuối 2025 đến cuối tháng 7/2026, tỷ lệ dùng chung 1,05 lần; doanh thu hạ tầng cho thuê Q2/2026 tăng 28%. Chuỗi CTR trên trang (vị trí sở hữu) ghi 12.080 trạm tháng 10/2026. Kiểm chứng tiếp: số vị trí có khách thuê và kế hoạch 1.000 trạm mới năm 2026.',
    'Tắt sóng 2G toàn quốc': 'Mạng 2G ngừng phát sóng từ 15/09/2026 (trừ M2M, Trường Sa, Hoàng Sa, nhà giàn DK); số thuê bao Viettel cần chuyển giảm từ 9,3 triệu cuối 2025 còn khoảng 750.000. Biến số: số SIM ghi nhận, băng 900 MHz được dùng cho 4G/5G. Kiểm chứng tiếp: số thuê bao di động cuối 2026 và nghĩa vụ giấy phép 900 MHz.',
}
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
        title = RETITLE.get(title, title)
        summ = SUMMARY.get(title) or f"{what} {VARIABLE[topic]}. Kiểm chứng tiếp: {NEXT[topic]}"
        events.append({'id': eid, 'title': title, 'summary': summ, 'brief': what, 'new_information': what, 'key_figures': [quant] if quant else [],
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
    for x in P['policy']:
        if re.search(r'2G|3168', x['doc'] + x['title']):
            add('pol' + str(x['src']) + x['date'], x['title'], x['effect'], '', ['Viettel', 'VNPT', 'MobiFone'], 'tech', x['src'], x['date'], 2)
    for e in events:
        if re.search(r'(?<![\d–])900 MHz', e['title']) and 'tech' not in e['topic_ids']:
            e['topic_ids'].append('tech')
    used = {t for e in events for t in e['topic_ids']}
    topics = [{'id': i, 'title': t, 'background': b, 'next_check': n, 'related_data': r} for i, t, b, n, r in TOPICS if i in used]
    return {'updated_at': max(a['published_at'] for a in articles.values()), 'articles': sorted(articles.values(), key=lambda a: a['id']),
            'events': events, 'topics': topics}

if __name__ == '__main__':
    sys.exit(main())
