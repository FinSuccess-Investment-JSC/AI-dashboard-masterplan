#!/usr/bin/env python3
"""Giá thị trường cho dashboard Phân bón (Phan-bon/), từ nguồn công khai không cần tài khoản.

  * World Bank Pink Sheet (CMO Historical Data Monthly, sheet "Monthly Prices"): urê, DAP, TSP, quặng phosphate,
    kali clorua (USD/tấn); khí tự nhiên Mỹ, châu Âu, LNG Nhật (USD/MMBtu); Brent (USD/thùng); than Úc (USD/tấn).
    Bình quân tháng. Link file lấy từ trang https://www.worldbank.org/en/research/commodity-markets mỗi lần chạy.
  * Urê tương lai Trịnh Châu (ZCE, hợp đồng liên tục UR0, CNY/tấn): Sina Finance K-line ngày. Giữ giá đóng cửa
    ngày cuối mỗi tháng và chuỗi ngày 1 năm gần nhất. Hợp đồng liên tục cuộn kỳ hạn nên chênh tháng có thể gồm khoảng cuộn.

    python scripts/fetch_fertilizer_markets.py      # ghi data/raw/public/fertilizer-markets.json
Không điền số thiếu; nguồn nào lỗi thì giữ bản lần trước của nguồn đó.
"""
import io, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/fertilizer-markets.json'
WB_PAGE = 'https://www.worldbank.org/en/research/commodity-markets'
SINA = 'https://stock2.finance.sina.com.cn/futures/api/jsonp.php/x=/InnerFuturesNewService.getDailyKLine?symbol={s}'
# khóa -> (tên cột trong Pink Sheet, tên hiển thị, đơn vị)
WB = {
    'urea': ('Urea', 'Urê (Trung Đông, bình quân tháng)', 'USD/tấn'),
    'dap': ('DAP', 'DAP (Mỹ vùng Vịnh)', 'USD/tấn'),
    'tsp': ('TSP', 'TSP (supe lân kép)', 'USD/tấn'),
    'phosrock': ('Phosphate rock', 'Quặng phosphate (Morocco)', 'USD/tấn'),
    'potash': ('Potassium chloride', 'Kali clorua (MOP)', 'USD/tấn'),
    'gas_us': ('Natural gas, US', 'Khí tự nhiên Mỹ (Henry Hub)', 'USD/MMBtu'),
    'gas_eu': ('Natural gas, Europe', 'Khí tự nhiên châu Âu (TTF)', 'USD/MMBtu'),
    'lng_jp': ('Liquefied natural gas, Japan', 'LNG nhập khẩu Nhật Bản', 'USD/MMBtu'),
    'brent': ('Crude oil, Brent', 'Dầu Brent', 'USD/thùng'),
    'coal_au': ('Coal, Australian', 'Than Úc (Newcastle)', 'USD/tấn'),
}


def get(url, binary=False):
    r = subprocess.run(['curl', '-sfL', '-m', '120', '-A', 'Mozilla/5.0', url], check=True, capture_output=True)
    return r.stdout if binary else r.stdout.decode('utf-8', 'replace')


def world_bank():
    import openpyxl
    links = sorted(set(re.findall(r'https://thedocs\.worldbank\.org/[^"\']*CMO-Historical-Data-Monthly\.xlsx', get(WB_PAGE))))
    if not links:
        raise RuntimeError('không thấy link CMO-Historical-Data-Monthly.xlsx')
    wb = openpyxl.load_workbook(io.BytesIO(get(links[-1], binary=True)), read_only=True, data_only=True)
    rows = list(wb['Monthly Prices'].iter_rows(values_only=True))
    updated = next((str(r[0]) for r in rows[:6] if r[0] and 'Updated' in str(r[0])), None)
    head = next(i for i, r in enumerate(rows) if r[1] and 'Crude oil' in str(r[1]))
    names = [re.sub(r'\s+', ' ', str(h or '')).replace(' **', '').strip() for h in rows[head]]
    out = {}
    for key, (col, label, unit) in WB.items():
        idx = names.index(col)
        recs = []
        for r in rows[head + 2:]:
            m = re.fullmatch(r'(\d{4})M(\d{2})', str(r[0] or ''))
            if m and int(m.group(1)) >= 2015 and isinstance(r[idx], (int, float)):
                recs.append({'date': f'{m.group(1)}-{m.group(2)}', 'value': round(float(r[idx]), 2)})
        out[key] = {'name': label, 'unit': unit, 'freq': 'monthly', 'source': 'World Bank Pink Sheet', 'records': recs}
    return out, {'url': links[-1], 'updated': updated}


def sina(symbol):
    txt = get(SINA.format(s=symbol))
    data = json.loads(txt[txt.index('(') + 1: txt.rindex(')')])
    daily = [(d['d'], round(float(d['c']), 2)) for d in data if d.get('c')]
    last = {}
    for d, v in daily:
        last[d[:7]] = {'date': d[:7], 'value': v, 'day': d}
    return [last[k] for k in sorted(last)], [{'date': d, 'value': v} for d, v in daily[-260:]]


def main():
    out = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {'series': {}, 'sources': {}}
    S, src, errors = out.setdefault('series', {}), out.setdefault('sources', {}), []
    try:
        wb, meta = world_bank()
        S.update(wb)
        src['world_bank'] = meta
    except Exception as e:
        errors.append(f'World Bank: {e}'[:300])
    try:
        monthly, daily = sina('UR0')
        S['urea_zce'] = {'name': 'Urê tương lai Trịnh Châu (ZCE, HĐ liên tục)', 'unit': 'CNY/tấn', 'freq': 'monthly',
                         'source': 'Sina Finance · ZCE UR0', 'note': 'giá đóng cửa ngày giao dịch cuối tháng', 'records': monthly}
        S['urea_zce_daily'] = {'name': 'Urê tương lai Trịnh Châu (ZCE, HĐ liên tục) · ngày', 'unit': 'CNY/tấn', 'freq': 'daily',
                               'source': 'Sina Finance · ZCE UR0', 'records': daily}
        src['sina'] = {'url': SINA.format(s='UR0')}
    except Exception as e:
        errors.append(f'Sina UR0: {e}'[:300])
    import datetime as dt
    out['captured'] = dt.date.today().isoformat()
    out['errors'] = errors
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), {k: (len(v['records']), v['records'][-1]['date'] if v['records'] else None) for k, v in S.items()}, errors)
    return 1 if len(errors) == 2 else 0


if __name__ == '__main__':
    sys.exit(main())
