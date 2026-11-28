#!/usr/bin/env python3
"""Dựng data/beer-financials.json/.js (window.BEER_FIN) cho sub-tab Tài chính ngành (Bia/).

  python scripts/fetch_beer_financials.py && python scripts/build_beer_financials.py

Đầu vào: data/raw/public/fs_beer_full_vndirect.json (VNDirect finfo, BCTC hợp nhất). Đơn vị đầu ra: tỷ đồng.
Kiểm tra (ghi vào 'checks', không sửa số nguồn):
  - KQKD: LNTT = LN thuần HĐKD + LN khác; LNST = LNTT − thuế (lệch > 1% và > 1 tỷ: ghi lại).
  - Cân đối: Tổng tài sản = Nợ phải trả + Vốn chủ sở hữu.
  - LCTT quý: tổng 4 quý so với số năm của chính VNDirect; năm lệch > 5% thì để trống (null) mọi dòng LCTT của 4 quý năm đó
    (trước 2024 phần lớn số quý trên VNDirect không khớp số năm: không phải quý riêng, cũng không phải lũy kế).
    LCTT theo năm lấy từ báo cáo năm (annual) cho chế độ Năm.
Không điền số thiếu, không đổi số âm thành 0. Phần tổng hợp ngành (loại trùng công ty mẹ – con, hệ số tính lại từ tổng
tử số / tổng mẫu số, TTM, bình quân) làm ở Bia/app/industry-fin.js để mọi bộ lọc trên trang dùng cùng một phép tính.
"""
import datetime as dt, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from beer_fin_items import ITEMS, TICKERS, GROUPS, COMPANIES, CONSOLIDATION, ASSOCIATES  # noqa: E402

RAW = ROOT / 'data/raw/public/fs_beer_full_vndirect.json'
OUT = ROOT / 'data/beer-financials.json'
OUT_JS = ROOT / 'data/beer-financials.js'
CF = [it['id'] for it in ITEMS if it['model'] == 3]


def main():
    raw = json.loads(RAW.read_text(encoding='utf-8'))
    periods = sorted({p for t in raw['quarter'].values() for p in t})
    years_all = sorted({p[:4] for p in periods})
    ycf = {}
    data, checks = {}, {'is_recon': [], 'bs_recon': [], 'cf_year_mismatch': [], 'missing_cf_year': []}
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
        'items': items, 'data': data, 'years': years_all, 'cf_annual': ycf, 'checks': checks, 'stale': raw.get('stale', []),
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('window.BEER_FIN = ' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(TICKERS), 'mã ×', len(periods), 'quý;', {k: len(v) for k, v in checks.items()})


if __name__ == '__main__':
    sys.exit(main())
