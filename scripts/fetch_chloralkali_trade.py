#!/usr/bin/env python3
"""Nhập khẩu xút (NaOH) và xuất khẩu phốt pho vàng (P4, HS 280470) của Việt Nam từ UN Comtrade (API công khai preview, không cần khóa) cho dashboard Xút–Clo (Xut-clo/).

  * HS 281511 — natri hydroxit dạng rắn; HS 281512 — natri hydroxit dạng dung dịch (soda kiềm lỏng).
  * Việt Nam báo cáo (reporter 704, flow M), mọi đối tác, theo tháng và theo năm — kỳ lấy từ getDA (dữ liệu có sẵn).
  * Số liệu đối tác (mirror): nước xuất khẩu báo cáo xuất sang Việt Nam (partner 704, flow X), theo năm 2018–nay —
    dùng khi Việt Nam chưa báo cáo kỳ đó; giữ là chuỗi riêng (FOB, kỳ xuất), không cộng với số Việt Nam báo cáo (CIF).
  * Chỉ lấy dòng tổng: customsCode C00, motCode 0, partner2Code 0. Lưu netWgt (kg; trống thì để null và lưu qty + đơn vị),
    primaryValue (USD), cờ ước tính.
  * Kỳ đã có trong file thì bỏ qua, trừ 6 kỳ tháng và 2 năm gần nhất (bắt revision).

    python scripts/fetch_chloralkali_trade.py      # ghi data/raw/public/chloralkali-comtrade.json
"""
import datetime as dt, json, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/chloralkali-comtrade.json'
BASE = 'https://comtradeapi.un.org/public/v1'
VN = BASE + '/preview/C/{f}/HS?reporterCode=704&period={p}&cmdCode={c}&flowCode=M&includeDesc=true'
MIRROR = BASE + '/preview/C/A/HS?period={p}&cmdCode={c}&flowCode=X&partnerCode=704&includeDesc=true'
# P4 (phốt pho vàng, HS 280470): Việt Nam báo cáo XUẤT khẩu theo năm; số liệu đối tác = nước nhập khẩu báo cáo nhập từ Việt Nam.
P4_VN = BASE + '/preview/C/A/HS?reporterCode=704&period={p}&cmdCode=280470&flowCode=X&includeDesc=true'
P4_MIRROR = BASE + '/preview/C/A/HS?period={p}&cmdCode=280470&flowCode=M&partnerCode=704&includeDesc=true'
DA = BASE + '/getDA/C/{f}/HS?reporterCode=704'
CODES = ['281511', '281512']
SINCE = 2018


def get(url):
    for k in range(4):
        try:
            r = subprocess.run(['curl', '-sfL', '-m', '90', url], check=True, capture_output=True)
            return json.loads(r.stdout.decode('utf-8', 'replace'))
        except Exception:
            time.sleep(6 * (k + 1))
    raise RuntimeError(url)


def rows_of(d, who):
    out = []
    for x in d.get('data', []):
        if x.get('customsCode') != 'C00' or x.get('motCode') != 0 or x.get('partner2Code') not in (0, None):
            continue
        out.append({who + '_code': x[who + 'Code'], who: x.get(who + 'Desc'), 'net_kg': x.get('netWgt'), 'qty': x.get('qty'),
                    'qty_unit': x.get('qtyUnitAbbr'), 'usd': x.get('primaryValue'), 'wgt_est': x.get('isNetWgtEstimated'),
                    'agg': x.get('isAggregate'), 'hs': x.get('classificationCode')})
    return out


def main():
    old = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    res = {k: old.get(k, {}) for k in ('vn_monthly', 'vn_annual', 'mirror_annual', 'p4_vn_annual', 'p4_mirror_annual')}
    da_m = sorted(str(x['period']) for x in get(DA.format(f='M'))['data'] if int(str(x['period'])[:4]) >= SINCE)
    da_a = sorted(str(x['period']) for x in get(DA.format(f='A'))['data'] if int(str(x['period'])) >= SINCE)
    redo = set(da_m[-6:]) | set(da_a[-2:])
    jobs = [('vn_monthly', p, VN.format(f='M', p=p, c=c), c, 'partner') for p in da_m for c in CODES] \
        + [('vn_annual', p, VN.format(f='A', p=p, c=c), c, 'partner') for p in da_a for c in CODES] \
        + [('mirror_annual', str(y), MIRROR.format(p=y, c=c), c, 'reporter') for y in range(SINCE, dt.date.today().year + 1) for c in CODES] \
        + [('p4_vn_annual', p, P4_VN.format(p=p), '280470', 'partner') for p in da_a] \
        + [('p4_mirror_annual', str(y), P4_MIRROR.format(p=y), '280470', 'reporter') for y in range(SINCE, dt.date.today().year + 1)]
    for kind, p, url, c, who in jobs:
        key = f'{p}|{c}'
        if key in res[kind] and p not in redo and not (kind.endswith('mirror_annual') and int(p) >= dt.date.today().year - 2):
            continue
        try:
            res[kind][key] = rows_of(get(url), who)
        except Exception as e:
            print('lỗi', kind, key, e, file=sys.stderr)
        time.sleep(1.3)
    out = {'captured': dt.date.today().isoformat(), 'source': 'UN Comtrade (API công khai preview)', 'url': 'https://comtradeplus.un.org/',
           'note': 'vn_*: Việt Nam báo cáo nhập khẩu (CIF). mirror_annual: nước đối tác báo cáo xuất khẩu sang Việt Nam (FOB) — số liệu đối tác, chuỗi riêng.',
           'codes': {'281511': 'Natri hydroxit (xút) dạng rắn', '281512': 'Natri hydroxit dạng dung dịch', '280470': 'Phốt pho (P4, phốt pho vàng)'},
           'vn_months_available': da_m, 'vn_years_available': da_a, **{k: dict(sorted(v.items())) for k, v in res.items()}}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), {k: len(v) for k, v in res.items()}, 'tháng VN mới nhất', da_m[-1] if da_m else None, 'năm', da_a[-1] if da_a else None)


if __name__ == '__main__':
    sys.exit(main())
