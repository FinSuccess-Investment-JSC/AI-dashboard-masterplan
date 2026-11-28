#!/usr/bin/env python3
"""Dựng data/textile-financials.json/.js (window.TEXTILE_FIN) cho sub-tab Tài chính ngành (Det-may/).

  python scripts/fetch_textile_financials.py && python scripts/build_textile_financials.py

Đầu vào: data/raw/public/fs_textile_full_vndirect.json (VNDirect finfo, BCTC hợp nhất). Đơn vị đầu ra: tỷ đồng.
Kiểm tra (ghi vào 'checks', không sửa số nguồn):
  - KQKD: LNTT = LN thuần HĐKD + LN khác; LNST = LNTT − thuế (lệch > 1% và > 1 tỷ: ghi lại).
  - Cân đối: Tổng tài sản = Nợ phải trả + Vốn chủ sở hữu.
  - LCTT quý: tổng 4 quý so với số năm của chính VNDirect; năm lệch > 5% thì để trống (null) mọi dòng LCTT của 4 quý năm đó
    (trước 2024 phần lớn số quý trên VNDirect không khớp số năm: không phải quý riêng, cũng không phải lũy kế).
    LCTT theo năm lấy từ báo cáo năm (annual) cho chế độ Năm.
  - LCTT quý có dòng tiền gộp sai dấu (tiền chi mua TSCĐ, tiền vay nhận, tiền trả gốc lệch dấu quá 5 tỷ; TNG mọi quý 3): để trống
    LCTT của quý đó và các quý sau trong năm (số quý của VNDirect là hiệu hai số lũy kế nên quý sau cũng sai), ghi 'cf_sign_anomaly'.
  - Khấu hao quý = 0 trong khi báo cáo năm có khấu hao (TNG, VGG lập LCTT quý theo phương pháp trực tiếp, không có dòng khấu hao):
    ước tính = khấu hao năm ÷ 4; năm chưa có báo cáo năm dùng năm gần nhất. Ghi 'estimates.da' để trang chú thích. Đây là ngoại lệ
    duy nhất của quy tắc không điền số thiếu (28/11/2026): để 0 thì EBITDA của hai mã may lớn nhất bằng EBIT.
Không điền số thiếu khác, không đổi số âm thành 0. Phần tổng hợp ngành (loại trùng công ty mẹ – con, hệ số tính lại từ tổng
tử số / tổng mẫu số, TTM, bình quân) làm ở Det-may/app/industry-fin.js để mọi bộ lọc trên trang dùng cùng một phép tính.
"""
import datetime as dt, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from textile_fin_items import ITEMS, TICKERS, GROUPS, COMPANIES, CONSOLIDATION, ASSOCIATES  # noqa: E402

RAW = ROOT / 'data/raw/public/fs_textile_full_vndirect.json'
OUT = ROOT / 'data/textile-financials.json'
OUT_JS = ROOT / 'data/textile-financials.js'
CF = [it['id'] for it in ITEMS if it['model'] == 3]


def main():
    raw = json.loads(RAW.read_text(encoding='utf-8'))
    periods = sorted({p for t in raw['quarter'].values() for p in t})
    years_all = sorted({p[:4] for p in periods})
    ycf = {}
    data, checks = {}, {'is_recon': [], 'bs_recon': [], 'cf_year_mismatch': [], 'missing_cf_year': [], 'cf_sign_anomaly': []}
    est_da = {}
    for t in TICKERS:
        q = raw['quarter'].get(t, {})
        rows = {it['id']: [] for it in ITEMS}
        for p in periods:
            v = q.get(p, {})
            for it in ITEMS:
                x = v.get(str(it['code']))
                rows[it['id']].append(None if x is None else round(x * it.get('sign', 1) / 1e9, 3))
        # XDCB dở dang: mẫu trước 2015 ghi ở mã 12300
        rows['cip'] = [a if a not in (None, 0) else (b if b not in (None, 0) else a) for a, b in zip(rows['cip'], rows.pop('cip_old'))]
        da0 = list(rows['da'])
        # Kiểm KQKD và cân đối
        for i, p in enumerate(periods):
            g = lambda k: rows[k][i]
            if None not in (g('pbt'), g('op_profit'), g('other')) and abs(g('pbt') - g('op_profit') - g('other')) > max(1, abs(g('pbt')) * .01):
                checks['is_recon'].append({'ticker': t, 'period': p, 'item': 'LNTT ≠ LN thuần HĐKD + LN khác', 'gap': round(g('pbt') - g('op_profit') - g('other'), 2)})
            if None not in (g('npat'), g('pbt'), g('tax')) and abs(g('npat') - g('pbt') + g('tax')) > max(1, abs(g('npat')) * .01):
                checks['is_recon'].append({'ticker': t, 'period': p, 'item': 'LNST ≠ LNTT − thuế', 'gap': round(g('npat') - g('pbt') + g('tax'), 2)})
            if None not in (g('total_assets'), g('liabilities'), g('equity')) and abs(g('total_assets') - g('liabilities') - g('equity')) > max(1, g('total_assets') * .005):
                checks['bs_recon'].append({'ticker': t, 'period': p, 'gap': round(g('total_assets') - g('liabilities') - g('equity'), 2)})
        # LCTT quý: đối chiếu tổng 4 quý với năm
        ann = raw.get('annual', {}).get(t, {})
        years = sorted({p[:4] for p in periods})
        for y in years:
            idx = [periods.index(f'{y}Q{k}') for k in range(1, 5) if f'{y}Q{k}' in periods]
            if len(idx) < 4:
                continue
            a = ann.get(y, {}).get('32000')
            qs = [rows['cfo'][i] for i in idx]
            if a is None:
                if y < str(dt.date.today().year):
                    checks['missing_cf_year'].append({'ticker': t, 'year': y})
                continue
            a = a / 1e9
            if None in qs or abs(sum(qs) - a) > max(2, abs(a) * .05):
                checks['cf_year_mismatch'].append({'ticker': t, 'year': y, 'sum_quarters': None if None in qs else round(sum(qs), 1), 'annual': round(a, 1)})
                for k in CF:
                    for i in idx:
                        rows[k][i] = None
        # Dòng tiền gộp sai dấu: bỏ LCTT từ quý đó đến hết năm
        for y in years:
            idx = [periods.index(f'{y}Q{k}') for k in range(1, 5) if f'{y}Q{k}' in periods]
            bad = next((i for i in idx if any((rows[k][i] or 0) < -5 for k in ('capex', 'repay', 'borrow'))), None)
            if bad is not None:
                checks['cf_sign_anomaly'].append({'ticker': t, 'period': periods[bad], 'capex': rows['capex'][bad], 'repay': rows['repay'][bad], 'borrow': rows['borrow'][bad]})
                for k in CF:
                    for i in idx:
                        if i >= bad:
                            rows[k][i] = None
        # Khấu hao quý = 0 (LCTT trực tiếp): ước tính từ khấu hao năm
        ann_da = {y: v['22230'] / 1e9 for y, v in ann.items() if v.get('22230')}
        for y in years:
            idx = [periods.index(f'{y}Q{k}') for k in range(1, 5) if f'{y}Q{k}' in periods]
            if not idx or any(da0[i] not in (0, None) for i in idx) or all(da0[i] is None for i in idx):  # da0: số nguồn trước khi bỏ LCTT lệch năm
                continue
            src = y if y in ann_da else max((z for z in ann_da if z < y), default=None)
            if src is None:
                continue
            for i in idx:
                rows['da'][i] = round(ann_da[src] / 4, 3)
            est_da.setdefault(t, []).append(y)
        data[t] = {k: v for k, v in rows.items()}
        # LCTT theo năm (báo cáo năm)
        ycf[t] = {k: [] for k in CF}
        for y in years_all:
            v = ann.get(y, {})
            for it in ITEMS:
                if it['model'] == 3:
                    x = v.get(str(it['code']))
                    ycf[t][it['id']].append(None if x is None else round(x * it.get('sign', 1) / 1e9, 3))
    items = [{k: it[k] for k in ('id', 'name', 'kind', 'model', 'code')} for it in ITEMS if it['id'] != 'cip_old']
    payload = {
        'schema': 1, 'built_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'captured': raw['captured'],
        'source': 'BCTC hợp nhất theo quý (VNDirect finfo)', 'url': raw['url'], 'unit': 'tỷ đồng',
        'periods': periods, 'groups': GROUPS, 'companies': COMPANIES, 'consolidation': CONSOLIDATION, 'associates': ASSOCIATES,
        'items': items, 'data': data, 'years': years_all, 'cf_annual': ycf, 'checks': checks, 'estimates': {'da': est_da}, 'stale': raw.get('stale', []),
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('window.TEXTILE_FIN = ' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(TICKERS), 'mã ×', len(periods), 'quý;', {k: len(v) for k, v in checks.items()})


if __name__ == '__main__':
    sys.exit(main())
