#!/usr/bin/env python3
"""Dựng data/fertilizer-data.json/.js (window.FERT_DATA) cho dashboard Phân bón (Phan-bon/).

  python scripts/fetch_fertilizer_markets.py
  python scripts/fetch_fertilizer_customs.py
  python scripts/fetch_fertilizer_nso.py
  python scripts/fetch_fertilizer_financials.py
  python scripts/build_fertilizer.py

Đầu vào (data/raw/public/): fertilizer-markets.json (World Bank, Sina), fertilizer-customs.json (Hải quan),
fertilizer-nso.json (Cục Thống kê), fs_fertilizer_full_vndirect.json (VNDirect). File nào thiếu thì khối đó để trống.
Phần tài chính cùng dạng window.POWER_FIN (scripts/build_power_financials.py) để dùng engine Phan-bon/app/industry-fin.js:
tỷ đồng; LCTT quý lệch số năm > 5% thì để trống cả 4 quý năm đó; LCTT năm lấy từ báo cáo năm.
Tự tính (ghi rõ trên trang): giá XK/NK bình quân = trị giá / lượng.
"""
import datetime as dt, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from fertilizer_fin_items import ITEMS, TICKERS, GROUPS, COMPANIES, CONSOLIDATION, ASSOCIATES  # noqa: E402

RAW = ROOT / 'data/raw/public'
OUT = ROOT / 'data/fertilizer-data.json'
OUT_JS = ROOT / 'data/fertilizer-data.js'
CF = [it['id'] for it in ITEMS if it['model'] == 3]


def load(name):
    p = RAW / name
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else None


def financials(raw):
    periods = sorted({p for t in raw['quarter'].values() for p in t})
    years_all = sorted({p[:4] for p in periods})
    data, ycf, checks = {}, {}, {'is_recon': [], 'bs_recon': [], 'cf_year_mismatch': []}
    for t in TICKERS:
        q = raw['quarter'].get(t, {})
        rows = {it['id']: [] for it in ITEMS}
        for p in periods:
            v = q.get(p, {})
            for it in ITEMS:
                x = v.get(str(it['code']))
                rows[it['id']].append(None if x is None else round(x * it.get('sign', 1) / 1e9, 3))
        rows['cip'] = [a if a not in (None, 0) else (b if b not in (None, 0) else a) for a, b in zip(rows['cip'], rows.pop('cip_old'))]
        for i, p in enumerate(periods):
            g = lambda k: rows[k][i]
            # Giá vốn = 0 khi có doanh thu (vd. DHB Q4/2023 trên VNDirect): số nguồn không dùng được cho biên gộp → để trống.
            if g('cogs') == 0 and (g('revenue') or 0) > 0:
                checks.setdefault('cogs_zero', []).append({'ticker': t, 'period': p, 'revenue': g('revenue'), 'gross': g('gross')})
                rows['cogs'][i] = rows['gross'][i] = None
            if None not in (g('pbt'), g('op_profit'), g('other')) and abs(g('pbt') - g('op_profit') - g('other')) > max(1, abs(g('pbt')) * .01):
                checks['is_recon'].append({'ticker': t, 'period': p, 'gap': round(g('pbt') - g('op_profit') - g('other'), 2)})
            if None not in (g('total_assets'), g('liabilities'), g('equity')) and abs(g('total_assets') - g('liabilities') - g('equity')) > max(1, g('total_assets') * .005):
                checks['bs_recon'].append({'ticker': t, 'period': p, 'gap': round(g('total_assets') - g('liabilities') - g('equity'), 2)})
        ann = raw.get('annual', {}).get(t, {})
        for y in years_all:
            idx = [periods.index(f'{y}Q{k}') for k in range(1, 5) if f'{y}Q{k}' in periods]
            a = ann.get(y, {}).get('32000')
            if len(idx) < 4 or a is None:
                continue
            a, qs = a / 1e9, [rows['cfo'][i] for i in idx]
            if None in qs or abs(sum(qs) - a) > max(2, abs(a) * .05):
                checks['cf_year_mismatch'].append({'ticker': t, 'year': y})
                for k in CF:
                    for i in idx:
                        rows[k][i] = None
        data[t] = rows
        ycf[t] = {k: [] for k in CF}
        for y in years_all:
            v = ann.get(y, {})
            for it in ITEMS:
                if it['model'] == 3:
                    x = v.get(str(it['code']))
                    ycf[t][it['id']].append(None if x is None else round(x * it.get('sign', 1) / 1e9, 3))
    items = [{k: it[k] for k in ('id', 'name', 'kind', 'model', 'code')} for it in ITEMS if it['id'] != 'cip_old']
    return {'captured': raw['captured'], 'source': 'BCTC hợp nhất theo quý (VNDirect finfo)', 'url': raw['url'], 'unit': 'tỷ đồng',
            'periods': periods, 'years': years_all, 'groups': GROUPS, 'companies': COMPANIES, 'consolidation': CONSOLIDATION,
            'associates': ASSOCIATES, 'items': items, 'data': data, 'cf_annual': ycf, 'checks': checks, 'stale': raw.get('stale', [])}


# definition, benchmark/khu vực, tần suất công bố, loại (Actual/Calculated/Estimate/Proxy), phương pháp
META = {
    'urea': ('Giá urê hạt rời, bình quân tháng', 'FOB Trung Đông (World Bank)', 'tháng, đầu tháng sau', 'Actual', 'số công bố, không tính lại'),
    'dap': ('Giá DAP, bình quân tháng', 'FOB Mỹ vùng Vịnh (World Bank)', 'tháng, đầu tháng sau', 'Actual', 'số công bố'),
    'tsp': ('Giá supe lân kép TSP, bình quân tháng', 'World Bank', 'tháng, đầu tháng sau', 'Actual', 'số công bố'),
    'phosrock': ('Giá quặng phosphate, bình quân tháng', 'Morocco (World Bank)', 'tháng, đầu tháng sau', 'Actual', 'số công bố; benchmark quốc tế, không phải giá apatit nội địa'),
    'potash': ('Giá kali clorua (MOP), bình quân tháng', 'World Bank', 'tháng, đầu tháng sau', 'Actual', 'số công bố'),
    'gas_eu': ('Giá khí tự nhiên châu Âu, bình quân tháng', 'TTF Hà Lan (World Bank)', 'tháng, đầu tháng sau', 'Actual', 'số công bố; không phải giá khí của DPM, DCM'),
    'gas_us': ('Giá khí tự nhiên Mỹ, bình quân tháng', 'Henry Hub (World Bank)', 'tháng, đầu tháng sau', 'Actual', 'số công bố'),
    'lng_jp': ('Giá LNG nhập khẩu Nhật Bản, bình quân tháng', 'Nhật Bản CIF (World Bank)', 'tháng, đầu tháng sau', 'Actual', 'số công bố'),
    'brent': ('Giá dầu Brent, bình quân tháng', 'Brent (World Bank)', 'tháng, đầu tháng sau', 'Actual', 'số công bố'),
    'coal_au': ('Giá than nhiệt Úc, bình quân tháng', 'Newcastle (World Bank)', 'tháng, đầu tháng sau', 'Proxy', 'benchmark quốc tế; không phải giá than DHB mua'),
    'urea_zce': ('Giá urê tương lai, đóng cửa ngày cuối tháng', 'Sở GDHH Trịnh Châu, HĐ liên tục UR0', 'ngày giao dịch', 'Actual', 'giá đóng cửa ngày cuối tháng'),
    'urea_zce_daily': ('Giá urê tương lai, đóng cửa ngày', 'Sở GDHH Trịnh Châu, HĐ liên tục UR0', 'ngày giao dịch', 'Actual', 'giá đóng cửa; HĐ liên tục có khoảng chuyển kỳ hạn'),
    'urea_output': ('Sản lượng phân urê sản xuất trong nước', 'Việt Nam (Cục Thống kê)', 'tháng, ngày 6 tháng sau', 'Actual', 'tháng gần nhất là số ước tính, tháng trước là sơ bộ'),
    'npk_output': ('Sản lượng phân NPK sản xuất trong nước', 'Việt Nam (Cục Thống kê)', 'tháng, ngày 6 tháng sau', 'Actual', 'tháng gần nhất là số ước tính, tháng trước là sơ bộ'),
    'usdvnd': ('Tỷ giá trung tâm USD/VND, bình quân tháng', 'Ngân hàng Nhà nước', 'ngày làm việc', 'Calculated', 'bình quân các ngày trong tháng; tháng hiện tại chưa đủ ngày'),
}


def monthly(d):
    return [{'date': k, 'value': v} for k, v in sorted(d.items())]


def main():
    out = {'schema': 1, 'built_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'series': {}, 'sources': {}}
    S, src = out['series'], out['sources']
    m = load('fertilizer-markets.json')
    if m:
        S.update(m['series'])
        src['markets'] = {'captured': m.get('captured'), **m.get('sources', {})}
    c = load('fertilizer-customs.json')
    if c:
        cs = c['series']
        names = {'exp_fert': ('Xuất khẩu phân bón (trị giá)', 'triệu USD'), 'exp_fert_q': ('Xuất khẩu phân bón (lượng)', 'tấn'),
                 'imp_fert': ('Nhập khẩu phân bón (trị giá)', 'triệu USD'), 'imp_fert_q': ('Nhập khẩu phân bón (lượng)', 'tấn')}
        for k, (n, u) in names.items():
            if k in cs:
                S[k] = {'name': n, 'unit': u, 'freq': 'monthly', 'source': 'Cục Hải quan', 'records': monthly(cs[k])}
        for k, vk, qk, n in (('exp_fert_px', 'exp_fert', 'exp_fert_q', 'Giá xuất khẩu bình quân (tự tính)'),
                             ('imp_fert_px', 'imp_fert', 'imp_fert_q', 'Giá nhập khẩu bình quân (tự tính)')):
            v, q = cs.get(vk, {}), cs.get(qk, {})
            recs = [{'date': d, 'value': round(v[d] * 1e6 / q[d], 1)} for d in sorted(set(v) & set(q)) if q[d]]
            if recs:
                S[k] = {'name': n, 'unit': 'USD/tấn', 'freq': 'monthly', 'source': 'Cục Hải quan · trị giá ÷ lượng', 'records': recs}
        src['customs'] = {'url': c.get('url'), 'months': len(c.get('files', {}))}
    n = load('fertilizer-nso.json')
    if n:
        for k, name in (('urea_output', 'Sản lượng phân urê'), ('npk_output', 'Sản lượng phân NPK')):
            if k in n['series']:
                S[k] = {'name': name, 'unit': 'nghìn tấn', 'freq': 'monthly', 'source': 'Cục Thống kê', 'records': monthly(n['series'][k])}
        src['nso'] = {'url': n.get('url'), 'months': len(n.get('files', {}))}
    sbv = load('sbv-monthly.json')  # scripts/fetch_sbv.py (bot refresh-data.yml): bình quân tháng tỷ giá trung tâm
    if sbv and sbv.get('series', {}).get('usdvnd'):
        S['usdvnd'] = {'name': 'Tỷ giá trung tâm USD/VND', 'unit': 'đồng/USD', 'freq': 'monthly', 'source': 'Ngân hàng Nhà nước',
                       'records': monthly(sbv['series']['usdvnd'])}
    f = load('fs_fertilizer_full_vndirect.json')
    if f:
        out['fin'] = financials(f)
    # Metadata từng chuỗi (định nghĩa, benchmark, loại số liệu); kỳ và ngày cập nhật lấy từ records/captured.
    for k, s in S.items():
        if k in META:
            s['meta'] = dict(zip(('definition', 'benchmark', 'freq_pub', 'class', 'method'), META[k]))
            s['meta']['period'] = s['records'][-1]['date'] if s['records'] else None
            s['meta']['updated'] = (m or {}).get('captured') if k in (m or {}).get('series', {}) else out['built_at'][:10]
    gas = ROOT / 'data/fertilizer/gas-system.json'  # hệ thống khí cho bản đồ 4.4, nhập tay có nguồn từng dòng
    if gas.exists():
        out['gas'] = json.loads(gas.read_text(encoding='utf-8'))
    plants = ROOT / 'data/fertilizer/plants.json'  # nhập tay có nguồn từng dòng (xem file)
    if plants.exists():
        out['plants'] = json.loads(plants.read_text(encoding='utf-8'))
    text =json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    OUT.write_text(text + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('window.FERT_DATA = ' + text + ';\nwindow.FERT_FIN = window.FERT_DATA.fin;\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), {k: (len(v['records']), v['records'][-1]['date'] if v['records'] else None) for k, v in S.items()},
          'fin' in out and {k: len(v) for k, v in out['fin']['checks'].items()})


if __name__ == '__main__':
    sys.exit(main())
