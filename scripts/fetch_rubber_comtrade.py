#!/usr/bin/env python3
"""Nhập khẩu cao su của Trung Quốc theo tháng và nước xuất xứ (UN Comtrade, API công khai preview, không cần khóa),
cho dashboard ngành Cao su (Cao-su/). Đây là số "mirror" do Trung Quốc khai (CIF, kỳ nhập), KHÔNG cộng với số xuất khẩu
Việt Nam do Hải quan Việt Nam khai (FOB, kỳ xuất).

  * Reporter 156 (Trung Quốc), flow M, partner = mọi nước (0 = World), HS 4001 (cao su tự nhiên) và 400280
    (hỗn hợp cao su tự nhiên và tổng hợp). Lưu netWgt (kg), primaryValue (USD), isNetWgtEstimated, classificationCode.
  * Mỗi lần gọi một kỳ (preview chỉ nhận 1 kỳ). Kỳ đã có trong file thì bỏ qua, trừ 6 kỳ gần nhất (bắt revision).

    python scripts/fetch_rubber_comtrade.py [--since 201901]   # ghi data/raw/public/rubber-comtrade.json
"""
import argparse, datetime as dt, json, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/rubber-comtrade.json'
API = 'https://comtradeapi.un.org/public/v1/preview/C/M/HS?reporterCode=156&period={p}&cmdCode={c}&flowCode=M&includeDesc=true'
DA = 'https://comtradeapi.un.org/public/v1/getDA/C/M/HS?reporterCode=156'
CODES = ['4001', '400280']


def get(url):
    r = subprocess.run(['curl', '-sfL', '-m', '90', url], check=True, capture_output=True)
    return json.loads(r.stdout.decode('utf-8', 'replace'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--since', type=int, default=201901)
    a = ap.parse_args()
    old = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {'rows': {}}
    rows = old.get('rows', {})
    avail = sorted(x['period'] for x in get(DA)['data'] if x['period'] >= a.since)
    redo = set(avail[-6:])
    for p in avail:
        for c in CODES:
            key = f'{p}|{c}'
            if key in rows and p not in redo:
                continue
            for k in range(3):
                try:
                    d = get(API.format(p=p, c=c))
                    break
                except Exception:
                    time.sleep(5 * (k + 1))
            else:
                print('lỗi', key, file=sys.stderr)
                continue
            rows[key] = [{'partner': x['partnerDesc'], 'partner_code': x['partnerCode'], 'net_kg': x.get('netWgt'), 'usd': x.get('primaryValue'),
                          'wgt_est': x.get('isNetWgtEstimated'), 'hs': x.get('classificationCode')}
                         for x in d.get('data', []) if x.get('customsCode') == 'C00' and x.get('motCode') == 0 and x.get('partner2Code') in (0, None)]
            time.sleep(1.2)
        print(p, file=sys.stderr)
    out = {'captured': dt.date.today().isoformat(), 'source': 'UN Comtrade · Trung Quốc nhập khẩu theo nước xuất xứ (mirror)',
           'url': 'https://comtradeplus.un.org/', 'api': API.split('?')[0], 'reporter': 156, 'flow': 'M', 'codes': CODES,
           'latest_period': avail[-1] if avail else None, 'rows': dict(sorted(rows.items()))}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(rows), 'kỳ × mã; mới nhất', out['latest_period'])


if __name__ == '__main__':
    sys.exit(main())
