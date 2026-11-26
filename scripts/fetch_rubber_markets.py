#!/usr/bin/env python3
"""Giá cao su cho dashboard ngành Cao su (Cao-su/), từ nguồn công khai không cần tài khoản.

  * World Bank Pink Sheet (CMO Historical Data Monthly, sheet "Monthly Prices"): cao su TSR 20 và RSS 3 (USD/kg),
    Brent (USD/thùng). Bình quân tháng; link file lấy từ trang commodity-markets mỗi lần chạy (dùng lại hàm của Phân bón).
  * ARBC (ASEAN Rubber Business Council, aseanrubber.net): bảng giá ngày theo tháng, US cent/kg: STR 20, RSS 3 Thái Lan;
    SIR 20 Indonesia; SMR 20 Malaysia; TSR 20, RSS 3 Singapore; SVR 10 Việt Nam (VRA); CSR 10 Campuchia.
    M.C. (market closed), N.A., ô trống, lỗi công thức -> null; bỏ dòng tổng/bình quân; chỉ giữ ngày <= ngày chạy.
  * Sina Finance K-line ngày, hợp đồng liên tục: RU0 (SHFE cao su tự nhiên, CNY/tấn), NR0 (INE cao su TSR 20, CNY/tấn),
    BR0 (SHFE cao su butadiene, CNY/tấn). Giữ giá thanh toán (settlement), đóng cửa, khối lượng, vị thế mở.
    Hợp đồng liên tục chuyển kỳ hạn theo Sina; chênh qua ngày chuyển có thể gồm khoảng chênh giữa hai kỳ hạn.
  * Tỷ giá CNY/USD, JPY/USD (tỷ giá tham chiếu ECB qua api.frankfurter.app): bình quân tháng để quy CNY/tấn sang USD/tấn.

    python scripts/fetch_rubber_markets.py [--arbc-since 2022]   # ghi data/raw/public/rubber-markets.json
Không điền số thiếu; nguồn nào lỗi thì giữ bản lần trước của nguồn đó.
"""
import argparse, datetime as dt, html, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
OUT = ROOT / 'data/raw/public/rubber-markets.json'
ARBC = 'https://aseanrubber.net/arbc/index.php/rubber-prices/arbc-prices/{y}-prices/{m}'
SINA = 'https://stock2.finance.sina.com.cn/futures/api/jsonp.php/x=/InnerFuturesNewService.getDailyKLine?symbol={s}'
MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
# cột bảng ARBC theo thứ tự sau cột Ngày
ARBC_COLS = [('th_str20', 'STR 20 Thái Lan'), ('th_rss3', 'RSS 3 Thái Lan'), ('id_sir20', 'SIR 20 Indonesia'), ('my_smr20', 'SMR 20 Malaysia'),
             ('sg_tsr20', 'TSR 20 Singapore'), ('sg_rss3', 'RSS 3 Singapore'), ('vn_svr10', 'SVR 10 Việt Nam (VRA)'), ('kh_csr10', 'CSR 10 Campuchia')]
WB = {
    'wb_tsr20': ('Rubber, TSR20', 'Cao su TSR 20 (World Bank)', 'USD/kg'),
    'wb_rss3': ('Rubber, RSS3', 'Cao su RSS 3 (World Bank)', 'USD/kg'),
    'brent': ('Crude oil, Brent', 'Dầu Brent', 'USD/thùng'),
}
FUT = {'shfe_ru': ('RU0', 'Cao su tự nhiên SHFE (RU, HĐ liên tục)'), 'ine_nr': ('NR0', 'Cao su TSR 20 INE (NR, HĐ liên tục)'),
       'shfe_br': ('BR0', 'Cao su butadiene SHFE (BR, HĐ liên tục)')}


def get(url, binary=False):
    r = subprocess.run(['curl', '-sfL', '-m', '120', '-A', 'Mozilla/5.0', url], check=True, capture_output=True)
    return r.stdout if binary else r.stdout.decode('utf-8', 'replace')


def world_bank():
    import io, openpyxl
    page = get('https://www.worldbank.org/en/research/commodity-markets')
    links = sorted(set(re.findall(r'https://thedocs\.worldbank\.org/[^"\']*CMO-Historical-Data-Monthly\.xlsx', page)))
    if not links:
        raise RuntimeError('không thấy link CMO-Historical-Data-Monthly.xlsx')
    wb = openpyxl.load_workbook(io.BytesIO(get(links[-1], binary=True)), read_only=True, data_only=True)
    rows = list(wb['Monthly Prices'].iter_rows(values_only=True))
    updated = next((str(r[0]) for r in rows[:6] if r[0] and 'Updated' in str(r[0])), None)
    head = next(i for i, r in enumerate(rows) if r[1] and 'Crude oil' in str(r[1]))
    names = [re.sub(r'\s+', ' ', str(h or '')).replace(' **', '').replace('**', '').strip() for h in rows[head]]
    out = {}
    for key, (col, label, unit) in WB.items():
        idx = names.index(col)
        recs = []
        for r in rows[head + 2:]:
            m = re.fullmatch(r'(\d{4})M(\d{2})', str(r[0] or ''))
            if m and int(m.group(1)) >= 2015 and isinstance(r[idx], (int, float)):
                recs.append({'date': f'{m.group(1)}-{m.group(2)}', 'value': round(float(r[idx]), 4)})
        out[key] = {'name': label, 'unit': unit, 'freq': 'monthly', 'source': 'World Bank Pink Sheet', 'records': recs,
                    'source_locator': f'sheet Monthly Prices, cột "{col}"'}
    return out, {'url': links[-1], 'updated': updated}


def cell(s):
    s = html.unescape(re.sub(r'<[^>]+>', '', s)).strip().replace(',', '')
    try:
        return round(float(s), 2)
    except ValueError:
        return None  # M.C., N.A., ô trống, #DIV/0!, #VALUE!


def arbc_month(y, mi, today):
    t = get(ARBC.format(y=y, m=MONTHS[mi - 1]))
    i = t.find('<table')
    if i < 0:
        return []
    tb = t[i:t.find('</table>', i)]
    out = []
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', tb, re.S):
        tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)
        if len(tds) < 9:
            continue
        d = html.unescape(re.sub(r'<[^>]+>', '', tds[0])).strip()
        if not re.fullmatch(r'\d{1,2}', d):
            continue  # dòng tổng / bình quân / tiêu đề
        try:
            day = dt.date(y, mi, int(d))
        except ValueError:
            continue
        if day > today:
            continue
        vals = [cell(x) for x in tds[1:9]]
        if any(v is not None for v in vals):
            out.append((day.isoformat(), vals))
    return out


def arbc(since, today):
    rows, pages = {}, []
    for y in range(since, today.year + 1):
        for mi in range(1, 13):
            if dt.date(y, mi, 1) > today:
                break
            try:
                r = arbc_month(y, mi, today)
            except Exception as e:
                print('ARBC lỗi', y, mi, e, file=sys.stderr)
                continue
            pages.append({'period': f'{y}-{mi:02d}', 'url': ARBC.format(y=y, m=MONTHS[mi - 1]), 'days': len(r)})
            for d, v in r:
                rows[d] = v
    out = {}
    for j, (k, label) in enumerate(ARBC_COLS):
        recs = [{'date': d, 'value': rows[d][j]} for d in sorted(rows) if rows[d][j] is not None]
        out[k] = {'name': label, 'unit': 'US cent/kg', 'freq': 'daily', 'source': 'ARBC · giá ngày thành viên', 'records': recs,
                  'quote_basis': 'giá chào bán FOB/khu vực theo hội viên ARBC; khác grade, khác điều kiện giao hàng'}
    return out, pages


def sina(symbol, since):
    txt = get(SINA.format(s=symbol))
    data = json.loads(txt[txt.index('(') + 1: txt.rindex(')')])
    recs = []
    for d in data:
        if d['d'] < since or not d.get('c'):
            continue
        f = lambda k: round(float(d[k]), 2) if d.get(k) not in (None, '', '0.000') else None
        recs.append({'date': d['d'], 'value': f('s') or f('c'), 'close': f('c'), 'settle': f('s'), 'volume': int(float(d.get('v') or 0)), 'oi': int(float(d.get('p') or 0))})
    return recs


def fx_monthly(today):
    """Tỷ giá tham chiếu ECB (qua Frankfurter): bình quân tháng CNY/USD, JPY/USD."""
    d = json.loads(get(f'https://api.frankfurter.app/2019-01-01..{today.isoformat()}?from=USD&to=CNY,JPY'))
    acc = {}
    for day, r in d['rates'].items():
        for c, v in r.items():
            acc.setdefault(c, {}).setdefault(day[:7], []).append(v)
    return {c: [{'date': k, 'value': round(sum(v) / len(v), 4), 'days': len(v)} for k, v in sorted(m.items())] for c, m in acc.items()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--arbc-since', type=int, default=2022)
    a = ap.parse_args()
    today = dt.date.today()
    out = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {'series': {}, 'sources': {}}
    S, src, errors = out.setdefault('series', {}), out.setdefault('sources', {}), []
    try:
        w, meta = world_bank()
        S.update(w)
        src['world_bank'] = meta
    except Exception as e:
        errors.append(f'World Bank: {e}'[:300])
    try:
        ar, pages = arbc(a.arbc_since, today)
        if not any(v['records'] for v in ar.values()):
            raise RuntimeError('không đọc được bảng ARBC')
        S.update(ar)
        src['arbc'] = {'url': ARBC.format(y=today.year, m=MONTHS[today.month - 1]), 'pages': pages}
    except Exception as e:
        errors.append(f'ARBC: {e}'[:300])
    for k, (sym, label) in FUT.items():
        try:
            S[k] = {'name': label, 'unit': 'CNY/tấn', 'freq': 'daily', 'source': f'Sina Finance · {sym}', 'records': sina(sym, '2021-01-01'),
                    'note': 'value = giá thanh toán (settlement), thiếu thì giá đóng cửa; hợp đồng liên tục Sina'}
            src['sina_' + sym] = {'url': SINA.format(s=sym)}
        except Exception as e:
            errors.append(f'Sina {sym}: {e}'[:300])
    try:
        fx = fx_monthly(today)
        for c in ('CNY', 'JPY'):
            S[c.lower() + 'usd'] = {'name': f'Tỷ giá {c}/USD (bình quân tháng)', 'unit': f'{c}/USD', 'freq': 'monthly',
                                    'source': 'ECB tỷ giá tham chiếu (Frankfurter)', 'records': fx[c], 'note': 'tháng hiện tại chưa đủ ngày'}
        src['fx'] = {'url': 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html'}
    except Exception as e:
        errors.append(f'FX: {e}'[:300])
    out['captured'] = today.isoformat()
    out['errors'] = errors
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), {k: (len(v['records']), v['records'][-1]['date'] if v['records'] else None) for k, v in S.items()}, errors)
    return 1 if len(errors) >= 3 else 0


if __name__ == '__main__':
    sys.exit(main())
