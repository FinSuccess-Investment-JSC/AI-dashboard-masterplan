#!/usr/bin/env python3
"""Dựng data/chloralkali-data.json/.js (window.XC_DATA, window.XC_FIN) và data/chloralkali-news.js (window.XC_NEWS)
cho dashboard ngành Xút – Clo (Xut-clo/).

Nguồn:
  * data/raw/public/chloralkali-comtrade.json — UN Comtrade (scripts/fetch_chloralkali_trade.py): Việt Nam báo cáo nhập khẩu
    HS 281511 (xút rắn), 281512 (xút dung dịch) theo tháng, năm, đối tác; số liệu đối tác (mirror) theo năm.
  * data/raw/public/fs_chloralkali_full_vndirect.json — BCTC hợp nhất quý CSV, HVT, DGC (scripts/fetch_chloralkali_financials.py).
  * data/chloralkali/p4-price.json — giá phốt pho vàng (P4) giao ngay Trung Quốc, Sunsirs qua WiData (tier B, cập nhật qua MCP).
  * data/chloralkali/*.json — nhập tay có nguồn từng dòng: fpts.json (số FPTS 10/05/2024), plants.json (nhà máy, sản lượng,
    tiến độ Nghi Sơn, sản phẩm gốc clo), inputs.json (biểu giá điện sản xuất, hạn ngạch muối, định mức điện), news.json (Chủ đề nóng).

Tự tính (ghi rõ trên trang): đơn giá nhập khẩu bình quân = tổng trị giá USD ÷ tổng khối lượng tịnh (tấn), tính lại từ tổng khi gộp
kỳ/đối tác; thiếu khối lượng hợp lệ thì để null. Không quy đổi nồng độ.

    python scripts/build_chloralkali.py
"""
import datetime as dt, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from chloralkali_fin_items import ITEMS, TICKERS, GROUPS, COMPANIES, CONSOLIDATION, ASSOCIATES  # noqa: E402

RAW = ROOT / 'data/raw/public'
MAN = ROOT / 'data/chloralkali'
OUT = ROOT / 'data/chloralkali-data.json'
OUT_JS = ROOT / 'data/chloralkali-data.js'
NEWS_JS = ROOT / 'data/chloralkali-news.js'
CF = [it['id'] for it in ITEMS if it['model'] == 3]
VN_NAME = {156: 'Trung Quốc', 490: 'Đài Loan', 392: 'Nhật Bản', 410: 'Hàn Quốc', 764: 'Thái Lan', 699: 'Ấn Độ', 842: 'Mỹ', 360: 'Indonesia',
           458: 'Malaysia', 702: 'Singapore', 50: 'Bangladesh', 344: 'Hồng Kông', 724: 'Tây Ban Nha', 276: 'Đức', 528: 'Hà Lan', 36: 'Úc',
           608: 'Philippines', 704: 'Việt Nam', 251: 'Pháp', 826: 'Anh', 116: 'Campuchia', 418: 'Lào'}
TOP = [156, 490, 392, 410, 764, 699]  # đối tác hiện riêng trên chart; còn lại gộp "Khác" (không cộng dòng World, dòng khu vực)
TOP_P4 = [392, 699, 410, 156, 360, 528]  # thị trường nhập P4 của Việt Nam hiện riêng


def load(p):
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else None


# Cùng cách dựng với scripts/build_fertilizer.py (dạng window.POWER_FIN để dùng engine app/industry-fin.js).
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



def weight_t(r):
    """Khối lượng tịnh (tấn): netWgt (kg); thiếu thì dùng qty khi đơn vị là kg. Không có thì None."""
    if r.get('net_kg'):
        return r['net_kg'] / 1000
    if r.get('qty') and (r.get('qty_unit') or '').lower() in ('kg',):
        return r['qty'] / 1000
    return None


def trade(raw):
    out = {'captured': raw['captured'], 'codes': raw['codes'], 'vn_months_available': raw['vn_months_available'], 'vn_years_available': raw['vn_years_available']}
    for kind, who in (('vn_monthly', 'partner'), ('vn_annual', 'partner'), ('mirror_annual', 'reporter'), ('p4_vn_annual', 'partner'), ('p4_mirror_annual', 'reporter')):
        series = {}
        top = TOP_P4 if kind.startswith('p4') else TOP
        for key, rows in raw.get(kind, {}).items():
            p, c = key.split('|')
            world = next((r for r in rows if r.get(who + '_code') == 0), None)
            parts = [r for r in rows if r.get(who + '_code') not in (0, None)]
            rec = {'period': p, 'code': c}
            if world:
                t = weight_t(world)
                rec.update(t=round(t, 1) if t is not None else None, usd=round(world['usd']) if world.get('usd') is not None else None,
                           est=bool(world.get('wgt_est')))
                rec['price'] = round(rec['usd'] / t, 1) if t and rec['usd'] is not None else None
            elif who == 'reporter':
                ok = [r for r in parts if weight_t(r) is not None and r.get('usd') is not None]
                tt = sum(weight_t(r) for r in ok) if ok else None
                rec.update(t=round(tt, 1) if tt else None, usd=round(sum(r['usd'] for r in ok)) if ok else None, est=any(r.get('wgt_est') for r in ok))
                rec['price'] = round(rec['usd'] / tt, 1) if tt else None
                rec['reporters'] = sorted({VN_NAME.get(r['reporter_code'], r.get('reporter') or str(r['reporter_code'])) for r in ok})
            by = {}
            for r in parts:
                k = r[who + '_code'] if r[who + '_code'] in top else -1
                t = weight_t(r)
                d = by.setdefault(k, {'t': 0.0, 'usd': 0.0, 'n_t': 0})
                if t is not None:
                    d['t'] += t; d['n_t'] += 1
                d['usd'] += r.get('usd') or 0
            rec['partners'] = {('Khác' if k == -1 else VN_NAME.get(k, str(k))): {'t': round(v['t'], 1) if v['n_t'] else None, 'usd': round(v['usd'])} for k, v in by.items()}
            psum = sum(v['t'] for v in by.values() if v['n_t'])
            if rec.get('t') and psum:
                rec['partner_gap_pct'] = round((psum / rec['t'] - 1) * 100, 2)
            # P4 (HS 280470) Việt Nam báo cáo: một số năm khối lượng lệch bất thường (vd. 2019, 2020 vài trăm tấn → đơn giá >100.000 USD/tấn).
            # Đơn giá P4 thực tế vài nghìn USD/tấn (số liệu đối tác) nên đơn giá >20.000 USD/tấn coi là lỗi khối lượng ở nguồn → để trống, gắn cờ.
            if kind == 'p4_vn_annual' and rec.get('price') and rec['price'] > 20000:
                rec.update(t=None, price=None, weight_suspect=True)
                for v in rec.get('partners', {}).values():
                    v['t'] = None
            series[key] = rec
        out[kind] = dict(sorted(series.items()))
    return out


def main():
    out = {'built_at': dt.datetime.now().isoformat(timespec='seconds'), 'partners_top': [VN_NAME[k] for k in TOP] + ['Khác'], 'p4_partners_top': [VN_NAME[k] for k in TOP_P4] + ['Khác']}
    raw = load(RAW / 'chloralkali-comtrade.json')
    if raw:
        out['trade'] = trade(raw)
    f = load(RAW / 'fs_chloralkali_full_vndirect.json')
    if f:
        out['fin'] = financials(f)
    for name in ('fpts', 'plants', 'inputs', 'p4-price'):
        d = load(MAN / f'{name}.json')
        if d is not None:
            out['p4' if name == 'p4-price' else name] = d
    text = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    OUT.write_text(text + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('/* Sinh bởi scripts/build_chloralkali.py — không sửa tay. */\nwindow.XC_DATA = ' + text + ';\nwindow.XC_FIN = window.XC_DATA.fin;\n', encoding='utf-8', newline='\n')
    news = load(MAN / 'news.json')
    if news:
        arts = {a['id'] for a in news['articles']}
        for e in news['events']:
            assert set(e['article_ids']) <= arts, e['id']
        NEWS_JS.write_text('/* Sinh bởi scripts/build_chloralkali.py từ data/chloralkali/news.json — không sửa tay. */\nwindow.XC_NEWS = '
                           + json.dumps(news, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), {k: (len(v) if isinstance(v, (dict, list)) else '') for k, v in out.items() if k != 'built_at'},
          'trade' in out and {k: len(v) for k, v in out['trade'].items() if isinstance(v, dict)})


if __name__ == '__main__':
    sys.exit(main())
