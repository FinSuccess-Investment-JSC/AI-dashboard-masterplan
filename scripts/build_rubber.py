#!/usr/bin/env python3
"""Dựng data/rubber-data.json/.js (window.RUBBER_DATA, window.RUBBER_FIN) cho dashboard ngành Cao su (Cao-su/).

  python scripts/fetch_rubber_markets.py      # World Bank, ARBC, Sina RU/NR/BR, tỷ giá ECB
  python scripts/fetch_rubber_comtrade.py     # UN Comtrade: Trung Quốc nhập HS 4001, 400280 theo nước (mirror)
  python scripts/fetch_rubber_financials.py   # VNDirect finfo: BCTC hợp nhất quý 13 mã
  python scripts/build_rubber.py

Đầu vào khác: data/raw/public/customs-monthly.json (bot, Cục Hải quan, mặt hàng "Cao su"), data/rubber/*.json nhập tay có
nguồn từng dòng (customs-manual, dpr-monthly, ops, demand, group). File nào thiếu thì khối đó để trống.

Quy tắc (mục QA của đề bài):
  * Đơn vị gốc giữ trong original_unit; 1 US cent/kg = 10 USD/tấn; 1 USD/kg = 1.000 USD/tấn; CNY/tấn ÷ CNY/USD = USD/tấn.
  * ARBC: M.C., N.A., ô trống, lỗi công thức đã thành null khi tải; tháng hiện hành là MTD (status 'MTD').
  * Đơn giá xuất khẩu = trị giá ÷ lượng cùng rổ Hải quan; nhiều kỳ = tổng trị giá ÷ tổng lượng; chia cho lượng 0 -> null.
  * Chênh SVR 10 − trung vị (STR 20, SIR 20, SMR 20): chỉ ngày có đủ ba chuỗi; các grade/điều kiện báo giá khác nhau.
  * Tồn kho là số dư tại mốc, không cộng các kỳ. Mirror Trung Quốc không cộng với số xuất khẩu Việt Nam.
"""
import datetime as dt, json, statistics, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import build_fertilizer as bf  # noqa: E402  (dùng lại hàm financials: tỷ đồng, kiểm LCTT quý/năm, giá vốn = 0)
import rubber_fin_items as rf  # noqa: E402

RAW = ROOT / 'data/raw/public'
MAN = ROOT / 'data/rubber'
OUT = ROOT / 'data/rubber-data.json'
OUT_JS = ROOT / 'data/rubber-data.js'

# definition, benchmark/điều kiện báo giá, tần suất công bố, status, phương pháp
META = {
    'wb_tsr20': ('Giá cao su TSR 20, bình quân tháng', 'SGX/SICOM TSR 20 (World Bank)', 'tháng, đầu tháng sau', 'công bố', 'số công bố, USD/kg'),
    'wb_rss3': ('Giá cao su RSS 3, bình quân tháng', 'RSS 3 Singapore (World Bank)', 'tháng, đầu tháng sau', 'công bố', 'số công bố, USD/kg'),
    'vn_svr10': ('Giá SVR 10 Việt Nam theo ngày', 'VRA báo cho ARBC, FOB', 'ngày làm việc', 'công bố', 'US cent/kg; ngày nghỉ không có số'),
    'th_str20': ('Giá STR 20 Thái Lan theo ngày', 'TRA báo cho ARBC, FOB Bangkok', 'ngày làm việc', 'công bố', 'US cent/kg'),
    'th_rss3': ('Giá RSS 3 Thái Lan theo ngày', 'TRA báo cho ARBC, FOB Bangkok', 'ngày làm việc', 'công bố', 'US cent/kg'),
    'id_sir20': ('Giá SIR 20 Indonesia theo ngày', 'GAPKINDO báo cho ARBC', 'ngày làm việc', 'công bố', 'US cent/kg'),
    'my_smr20': ('Giá SMR 20 Malaysia theo ngày', 'MRE báo cho ARBC (nguồn MRB)', 'ngày làm việc', 'công bố', 'US cent/kg'),
    'sg_tsr20': ('Giá TSR 20 Singapore theo ngày', 'RTAS báo cho ARBC', 'ngày làm việc', 'công bố', 'US cent/kg'),
    'sg_rss3': ('Giá RSS 3 Singapore theo ngày', 'RTAS báo cho ARBC', 'ngày làm việc', 'công bố', 'US cent/kg'),
    'shfe_ru': ('Cao su tự nhiên SHFE, giá thanh toán ngày', 'SHFE RU, HĐ liên tục (Sina), gồm VAT, kho nội địa TQ', 'ngày giao dịch', 'công bố', 'CNY/tấn; chuyển kỳ hạn theo Sina'),
    'ine_nr': ('Cao su TSR 20 INE, giá thanh toán ngày', 'INE NR, HĐ liên tục (Sina), kho ngoại quan, chưa thuế', 'ngày giao dịch', 'công bố', 'CNY/tấn'),
    'shfe_br': ('Cao su butadiene SHFE, giá thanh toán ngày', 'SHFE BR, HĐ liên tục (Sina)', 'ngày giao dịch', 'công bố', 'CNY/tấn; cao su tổng hợp'),
    'brent': ('Giá dầu Brent, bình quân tháng', 'World Bank', 'tháng, đầu tháng sau', 'công bố', 'USD/thùng'),
    'cnyusd': ('Tỷ giá CNY/USD, bình quân tháng', 'ECB tỷ giá tham chiếu', 'ngày làm việc', 'tính toán', 'bình quân ngày trong tháng'),
    'exp_q': ('Lượng xuất khẩu cao su Việt Nam', 'Hải quan, rổ "Cao su"', 'tháng', 'công bố', 'tấn; bản chính thức > điều chỉnh > sơ bộ'),
    'exp_v': ('Trị giá xuất khẩu cao su Việt Nam', 'Hải quan, rổ "Cao su", FOB', 'tháng', 'công bố', 'triệu USD'),
    'exp_px': ('Đơn giá xuất khẩu cao su Việt Nam', 'Hải quan, rổ "Cao su"', 'tháng', 'tính toán', 'trị giá ÷ lượng cùng rổ'),
}


def load(p):
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else None


def monthly_avg(recs):
    acc = {}
    for r in recs:
        acc.setdefault(r['date'][:7], []).append(r['value'])
    return [{'date': k, 'value': round(sum(v) / len(v), 2), 'n': len(v)} for k, v in sorted(acc.items())]


def main():
    today = dt.date.today()
    out = {'schema': 1, 'built_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'series': {}, 'sources': {}, 'checks': {}}
    S, src, chk = out['series'], out['sources'], out['checks']

    # ---- Giá: World Bank, ARBC, sàn TQ, tỷ giá ----
    m = load(RAW / 'rubber-markets.json')
    if m:
        for k, s in m['series'].items():
            if s.get('records'):
                if s.get('freq') == 'daily' and k.startswith(('shfe_', 'ine_')):
                    s = {**s, 'records': [r for r in s['records'] if r['date'] >= '2023-01-01']}  # giữ 3–4 năm theo ngày cho trang
                S[k] = s
        src['markets'] = {'captured': m.get('captured'), **m.get('sources', {})}
        cur = today.strftime('%Y-%m')
        for k in [k for k in S if S[k].get('freq') == 'daily' and S[k]['unit'] == 'US cent/kg']:
            mm = monthly_avg(S[k]['records'])
            for r in mm:
                r['status'] = 'MTD' if r['date'] == cur else 'tính toán'
            S[k + '_m'] = {'name': S[k]['name'] + ' · bình quân tháng', 'unit': 'US cent/kg', 'freq': 'monthly', 'source': S[k]['source'], 'records': mm,
                           'note': 'bình quân các ngày có số; tháng hiện hành là MTD'}
        # Chênh SVR 10 − trung vị STR 20/SIR 20/SMR 20, chỉ ngày đủ ba chuỗi
        idx = {k: {r['date']: r['value'] for r in S.get(k, {}).get('records', [])} for k in ('vn_svr10', 'th_str20', 'id_sir20', 'my_smr20')}
        days = sorted(set(idx['vn_svr10']) & set(idx['th_str20']) & set(idx['id_sir20']) & set(idx['my_smr20']))
        S['svr_spread'] = {'name': 'SVR 10 − trung vị (STR 20, SIR 20, SMR 20)', 'unit': 'US cent/kg', 'freq': 'daily', 'source': 'ARBC · tự tính',
                           'records': [{'date': d, 'value': round(idx['vn_svr10'][d] - statistics.median([idx['th_str20'][d], idx['id_sir20'][d], idx['my_smr20'][d]]), 2)} for d in days]}
        chk['svr_spread_days'] = len(days)
        if 'wb_tsr20' in S and 'wb_rss3' in S:
            t = {r['date']: r['value'] for r in S['wb_tsr20']['records']}
            S['wb_spread'] = {'name': 'RSS 3 − TSR 20 (World Bank)', 'unit': 'USD/tấn', 'freq': 'monthly', 'source': 'World Bank · tự tính',
                              'records': [{'date': r['date'], 'value': round((r['value'] - t[r['date']]) * 1000, 1)} for r in S['wb_rss3']['records'] if r['date'] in t]}
        # Sàn TQ quy USD/tấn: bình quân tháng giá thanh toán ÷ bình quân tháng CNY/USD
        fx = {r['date']: r['value'] for r in S.get('cnyusd', {}).get('records', [])}
        for k in ('shfe_ru', 'ine_nr', 'shfe_br'):
            if k in S:
                mm = monthly_avg(S[k]['records'])
                S[k + '_m'] = {'name': S[k]['name'] + ' · bình quân tháng', 'unit': 'CNY/tấn', 'freq': 'monthly', 'source': S[k]['source'], 'records': mm}
                S[k + '_usd'] = {'name': S[k]['name'] + ' · quy USD/tấn', 'unit': 'USD/tấn', 'freq': 'monthly', 'source': S[k]['source'] + ' · ECB · tự tính',
                                 'records': [{'date': r['date'], 'value': round(r['value'] / fx[r['date']], 1), 'fx': fx[r['date']]} for r in mm if fx.get(r['date'])],
                                 'note': 'RU gồm VAT 13% và giao tại kho nội địa TQ; NR kho ngoại quan chưa thuế; không cùng điều kiện với giá FOB'}

    # ---- Xuất khẩu Việt Nam (Hải quan) ----
    c = load(RAW / 'customs-monthly.json')
    if c:
        cs = c['series']
        v, q = dict(cs.get('exp_rubber', {})), dict(cs.get('exp_rubber_q', {}))
        status = {mo: f.get('2X', {}).get('status') for mo, f in c.get('files', {}).items()}
        man = load(MAN / 'customs-manual.json') or {'months': []}
        for r in man['months']:
            if r['period'] not in v:
                v[r['period']] = r['exp_rubber_usd'] / 1e6
                q[r['period']] = r['exp_rubber_q']
                status[r['period']] = r['status']
        st = {'fileChinhThuc': 'công bố', 'fileDieuChinh': 'điều chỉnh', 'fileSoBo': 'sơ bộ'}
        S['exp_v'] = {'name': 'Trị giá xuất khẩu cao su', 'unit': 'triệu USD', 'freq': 'monthly', 'source': 'Cục Hải quan',
                      'records': [{'date': d, 'value': round(v[d], 2), 'status': st.get(status.get(d), status.get(d))} for d in sorted(v)]}
        S['exp_q'] = {'name': 'Lượng xuất khẩu cao su', 'unit': 'nghìn tấn', 'freq': 'monthly', 'source': 'Cục Hải quan', 'original_unit': 'tấn',
                      'records': [{'date': d, 'value': round(q[d] / 1000, 2), 'status': st.get(status.get(d), status.get(d))} for d in sorted(q)]}
        S['exp_px'] = {'name': 'Đơn giá xuất khẩu cao su (trị giá ÷ lượng)', 'unit': 'USD/tấn', 'freq': 'monthly', 'source': 'Cục Hải quan · tự tính',
                       'records': [{'date': d, 'value': round(v[d] * 1e6 / q[d], 1), 'status': 'tính toán'} for d in sorted(set(v) & set(q)) if q[d]]}
        chk['exp_zero_qty'] = [d for d in q if not q[d]]
        prod = cs.get('exp_rubber_prod')
        src['customs'] = {'url': c.get('url'), 'manual': [r['source_url'] for r in man['months']]}

    # ---- Trung Quốc nhập khẩu theo nước (UN Comtrade, mirror) ----
    ct = load(RAW / 'rubber-comtrade.json')
    if ct:
        tops = {}
        for key, rows in ct['rows'].items():
            p, code = key.split('|')
            if code != '4001':
                continue
            for r in rows:
                if r['partner_code'] != 0 and r['net_kg']:
                    tops[r['partner']] = tops.get(r['partner'], 0) + r['net_kg']
        keep = [p for p, _ in sorted(tops.items(), key=lambda x: -x[1])[:6]]
        if 'Viet Nam' not in keep:
            keep = keep[:5] + ['Viet Nam']
        cn = {}
        for key, rows in sorted(ct['rows'].items()):
            p, code = key.split('|')
            d = f'{p[:4]}-{p[4:]}'
            w = next((r for r in rows if r['partner_code'] == 0), None)
            row = {'date': d, 'hs': code, 'world_kt': round(w['net_kg'] / 1e6, 2) if w and w['net_kg'] else None,
                   'world_usd_m': round(w['usd'] / 1e6, 2) if w and w['usd'] else None, 'wgt_est': bool(w and w.get('wgt_est'))}
            if code == '4001':
                for pn in keep:
                    r = next((x for x in rows if x['partner'] == pn), None)
                    row[pn] = round(r['net_kg'] / 1e6, 2) if r and r['net_kg'] else None
            cn.setdefault(code, []).append(row)
        out['cn_imports'] = {'partners': keep, 'by_hs': cn, 'latest': ct.get('latest_period'), 'captured': ct.get('captured'),
                             'unit': 'nghìn tấn (net weight)', 'source': ct['source'], 'url': ct['url']}

    # ---- BCTC ----
    f = load(RAW / 'fs_rubber_full_vndirect.json')
    if f:
        grp = load(MAN / 'group.json')
        cons = grp.get('consolidation', []) if grp else []
        for k in ('ITEMS', 'TICKERS', 'GROUPS', 'COMPANIES', 'ASSOCIATES'):
            setattr(bf, k, getattr(rf, k))
        bf.CONSOLIDATION = cons
        bf.CF = [it['id'] for it in rf.ITEMS if it['model'] == 3]
        out['fin'] = bf.financials(f)
        out['fin']['source_note'] = 'GVR hợp nhất; mã khác là BCTC hợp nhất của từng công ty (công ty không có con thì là BCTC riêng)'

    # ---- Nhập tay có nguồn ----
    for name in ('dpr-monthly', 'ops', 'demand', 'group'):
        d = load(MAN / f'{name}.json')
        if d:
            out[name.replace('-', '_')] = d
    # Bản cho trang: bỏ ghi chú dài (giữ đầy đủ trong data/rubber/*.json); giữ source_url từng số.
    def slim(x):
        if isinstance(x, dict):
            return {k: slim(v) for k, v in x.items() if k not in ('notes', 'sources', 'extra', 'split', 'gaps', 'source_locator', 'unit_note')}
        if isinstance(x, list):
            return [slim(v) for v in x]
        return x
    dm = out.get('demand', {}).get('series', {})
    SRC_VI = {'cn_tire_output': 'Cục Thống kê Trung Quốc (NBS, qua WiData)', 'cn_cv_sales': 'Bộ Công nghiệp và CNTT Trung Quốc (MIIT), số CAAM',
              'cn_nr_sr_import': 'Hải quan Trung Quốc (GACC), bảng 14', 'cn_tire_export': 'Hải quan Trung Quốc (GACC), bảng 13',
              'shfe_ru_stock': 'SHFE · báo cáo tồn kho tuần', 'ine_nr_stock': 'SHFE · báo cáo tồn kho tuần (mục TSR 20 của INE)',
              'my_production': 'DOSM Malaysia · thống kê cao su tháng', 'my_stock': 'DOSM Malaysia · thống kê cao su tháng', 'my_export': 'DOSM Malaysia · thống kê cao su tháng',
              'anrpc_world': 'ANRPC · báo cáo tháng (thông cáo công khai)', 'fao': 'FAOSTAT · QCL (bản 23/12/2025)'}
    for k, v in dm.items():
        if k in SRC_VI:
            v['source_raw'], v['source'] = v.get('source'), SRC_VI[k]
        if isinstance(v.get('unit'), str):
            v['unit'] = v['unit'].split(' (')[0]  # vd 'vạn tấn (giá trị: nghìn USD)' -> 'vạn tấn'; trị giá ở trường riêng
        for r in v.get('records', []):
            # T1–T2 công bố gộp: giá trị kỳ gộp = lũy kế T2
            if isinstance(r.get('date'), str) and r['date'].endswith('_02') and r.get('value') is None and r.get('ytd') is not None:
                r['value'], r['status'] = r['ytd'], 'gộp T1–T2'
    if 'anrpc_world' in dm:  # chỉ giữ số năm, mỗi năm bản phát hành (vintage) mới nhất
        best = {}
        for r in dm['anrpc_world']['records']:
            if len(str(r.get('date'))) == 4 and (r.get('production') is not None or r.get('consumption') is not None):
                if r['date'] not in best or str(r.get('vintage')) > str(best[r['date']].get('vintage')):
                    best[r['date']] = r
        dm['anrpc_world']['records'] = [best[y] for y in sorted(best)]
    for k in ('ops', 'dpr_monthly', 'demand'):
        if k in out:
            out[k] = slim(out[k])

    for k, s in S.items():
        base = k[:-2] if k.endswith('_m') else k
        if base in META:
            s['meta'] = dict(zip(('definition', 'quote_basis', 'freq_pub', 'status', 'method'), META[base]))
        if s.get('records'):
            s['as_of'] = s['records'][-1]['date']
    text = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    OUT.write_text(text + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('window.RUBBER_DATA = ' + text + ';\nwindow.RUBBER_FIN = window.RUBBER_DATA.fin;\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), round(len(text) / 1024), 'KB', {k: (len(v['records']), v['records'][-1]['date']) for k, v in S.items() if v.get('records')},
          'fin' in out and {k: len(v) for k, v in out['fin']['checks'].items()})


if __name__ == '__main__':
    sys.exit(main())
