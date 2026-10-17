#!/usr/bin/env python3
"""State Bank of Vietnam (NHNN) monthly statistics and the daily central USD/VND rate, from sbv.gov.vn's public
Liferay APIs (the same JSON the statistics pages load).

  * Credit by sector (dư nợ tín dụng đối với nền kinh tế): /o/article/v1.0/articles?...contentStructureId=10034332
  * Money supply and deposits (tổng phương tiện thanh toán, tiền gửi TCKT, dân cư): contentStructureId=10038520
  * Central rate (tỷ giá trung tâm): /o/headless-delivery/v1.0/content-structures/137473/structured-contents
The SBV firewall rejects default curl user agents and blocks bursts, so every request uses a browser UA and waits
12 s. Statistics articles exist from 01/2025 (balances in tỷ đồng). NHNN changed its money-supply method from
10/2025; growth across that break is not comparable. Central rate is kept as the monthly average since 2023.

    python3 scripts/fetch_sbv.py      # writes data/raw/public/sbv-monthly.json
"""
import datetime as dt, json, re, subprocess, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/sbv-monthly.json'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
ART = 'https://sbv.gov.vn/o/article/v1.0/articles?scopeKey=20117&contentStructureId={sid}&pageSize=200'
FX = 'https://sbv.gov.vn/o/headless-delivery/v1.0/content-structures/137473/structured-contents'
PAGES = {'credit': 'https://sbv.gov.vn/vi/du-no-tin-dung-doi-voi-nen-kt-dttktt', 'money': 'https://sbv.gov.vn/vi/tong-phuong-tien-thanh-toan',
         'fx': 'https://sbv.gov.vn/vi/t%E1%BB%B7-gi%C3%A1-trung-t%C3%A2m'}
CREDIT = {'credit_total': 'soDuTongCong', 'credit_construction': 'soDuXayDung', 'credit_industry': 'soDuCongNghiep'}
MONEY = {'m2': 'soDuTongPhuongTienThanhToan', 'deposits_firms': 'soDuTienGuiCuaCacTCKT', 'household_deposits': 'soDuTienGuiCuaDanCu'}


def get(url, params=None):
    args = ['curl', '-sfL', '-m', '90', '-A', UA, '-G', url]
    for k, v in (params or {}).items():
        args += ['--data-urlencode', f'{k}={v}']
    time.sleep(12)
    return json.loads(subprocess.run(args, check=True, capture_output=True, text=True).stdout)


def vnum(t):
    t = (t or '').strip()
    return float(t.replace('.', '').replace(',', '.')) if re.match(r'^[\d.]+(,\d+)?$', t) else None


def articles(sid, fields):
    out = {k: {} for k in fields}
    for a in get(ART.format(sid=sid))['articles']:
        f = a.get('fields', {})
        m = re.search(r'Tháng\s*(\d{1,2})\s*năm\s*(\d{4})', f.get('title', ''), re.I)
        dd = next((v for k, v in f.items() if k.startswith('Date') and re.match(r'\d{4}-\d\d-\d\d', v or '')), '')
        if m:
            key = f'{m.group(2)}-{int(m.group(1)):02d}'
        elif re.match(r'Tháng\s*\d', f.get('title', ''), re.I) and dd:
            key = dd[:7]  # title without the year: use the period-end date field
        else:
            continue  # test / junk entries ('dsad')
        for k, name in fields.items():
            v = vnum(f.get(name))
            if v and v > 1000:
                out[k][key] = v
    return out


def central_rate(old, since='2023-01-01'):
    daily = dict(old)
    start = max([since] + [d for d in daily]) if daily else since
    page = 1
    while True:
        d = get(FX, {'pageSize': 100, 'page': page, 'sort': 'datePublished:desc',
                     'filter': f"datePublished ge {start}T00:00:00Z"})
        for it in d.get('items', []):
            f = {c['name']: c['contentFieldValue'].get('data') for c in it['contentFields']}
            m = re.match(r'(\d\d)/(\d\d)/(\d{4})$', it.get('title', ''))
            if m and f.get('TyGiaSo'):
                daily[f'{m.group(3)}-{m.group(2)}-{m.group(1)}'] = float(f['TyGiaSo'])
        if page >= d.get('lastPage', 1):
            return daily
        page += 1


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    S = old.get('series', {})
    for sid, fields in ((10034332, CREDIT), (10038520, MONEY)):
        try:
            for k, v in articles(sid, fields).items():
                S.setdefault(k, {}).update(v)
        except Exception as e:
            print('articles', sid, e)
    if S.get('deposits_firms') and S.get('household_deposits'):
        S['deposits_total'] = {m: S['deposits_firms'][m] + S['household_deposits'][m] for m in S['household_deposits'] if m in S['deposits_firms']}
    try:
        daily = central_rate(old.get('central_rate_daily', {}))
    except Exception as e:
        print('fx', e)
        daily = old.get('central_rate_daily', {})
    by = {}
    for d, v in daily.items():
        by.setdefault(d[:7], []).append(v)
    S['usdvnd'] = {m: round(sum(v) / len(v), 2) for m, v in by.items()}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'Ngân hàng Nhà nước (sbv.gov.vn) · số liệu thống kê', 'pages': PAGES,
                               'series': {k: dict(sorted(v.items())) for k, v in S.items()},
                               'central_rate_daily': dict(sorted(daily.items()))}, ensure_ascii=False, indent=0) + '\n')
    print({k: (len(v), max(v) if v else None) for k, v in S.items()})


if __name__ == '__main__':
    main()
