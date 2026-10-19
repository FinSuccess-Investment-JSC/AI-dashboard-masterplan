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
PAGES = {'refi': 'https://sbv.gov.vn/vi/l%C3%A3i-su%E1%BA%A5t1', 'credit': 'https://sbv.gov.vn/vi/du-no-tin-dung-doi-voi-nen-kt-dttktt', 'money': 'https://sbv.gov.vn/vi/tong-phuong-tien-thanh-toan',
         'fx': 'https://sbv.gov.vn/vi/t%E1%BB%B7-gi%C3%A1-trung-t%C3%A2m'}
CREDIT = {'credit_total': 'soDuTongCong', 'credit_construction': 'soDuXayDung', 'credit_industry': 'soDuCongNghiep'}
MONEY = {'m2': 'soDuTongPhuongTienThanhToan', 'deposits_firms': 'soDuTienGuiCuaCacTCKT', 'household_deposits': 'soDuTienGuiCuaDanCu'}


def get(url, params=None, tries=3):
    args = ['curl', '-sfL', '-m', '90', '-A', UA, '-G', url]
    for k, v in (params or {}).items():
        args += ['--data-urlencode', f'{k}={v}']
    for i in range(tries):
        time.sleep(12 if i == 0 else 60 * i)  # the firewall blocks bursts; back off longer after a rejection
        try:
            return json.loads(subprocess.run(args, check=True, capture_output=True, text=True).stdout)
        except subprocess.CalledProcessError:
            if i == tries - 1:
                raise


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
    """Newest first, page by page, until the page reaches dates already stored (or `since`). While stored history
    does not reach back to `since` (an earlier run was cut off), page down to `since` again. A page that still fails
    after retries ends the walk with what was read so far; the next run continues the backfill."""
    daily = dict(old)
    complete = daily and min(daily) <= (dt.date.fromisoformat(since) + dt.timedelta(days=10)).isoformat()
    stop = max(daily) if complete else since
    page = 1
    while True:
        try:
            d = get(FX, {'pageSize': 100, 'page': page, 'sort': 'datePublished:desc'})
        except subprocess.CalledProcessError as e:
            print('fx page', page, e)
            return {k: v for k, v in daily.items() if k >= since}
        dates = []
        for it in d.get('items', []):
            f = {c['name']: c['contentFieldValue'].get('data') for c in it['contentFields']}
            m = re.match(r'(\d\d)/(\d\d)/(\d{4})$', it.get('title', ''))
            k = m and f'{m.group(3)}-{m.group(2)}-{m.group(1)}'
            if k and f.get('TyGiaSo') and k <= dt.date.today().isoformat():  # SBV titles carry typos, e.g. "17/11/2026" posted in 2025
                daily[k] = float(f['TyGiaSo'])
                dates.append(k)
        if not dates or min(dates) < stop or page >= d.get('lastPage', 1):
            return {k: v for k, v in daily.items() if k >= since}
        page += 1


RATES = 'https://sbv.gov.vn/vi/l%C3%A3i-su%E1%BA%A5t1'


def policy_rates(old):
    """Refinancing rate from the SBV interest-rate page, which shows only the rate in force with its decision.
    Monthly records run from the decision month to now; earlier decisions are not on the page and stay empty.
    The page's "Ngày áp dụng" for decision 1123 (16/06/2023) reads 19/03/2023, before the decision, so the
    decision date is used."""
    import html as H
    for i in range(3):
        time.sleep(12 if i == 0 else 60 * i)
        try:
            page = subprocess.run(['curl', '-sfL', '-m', '90', '-A', UA, RATES], check=True, capture_output=True, text=True).stdout
            break
        except subprocess.CalledProcessError:
            if i == 2:
                raise
    for row in re.findall(r'<tr>(.*?)</tr>', page, re.S):
        c = [H.unescape(re.sub('<[^>]+>', '', x)).strip() for x in re.findall(r'<td[^>]*>(.*?)</td>', row, re.S)]
        if len(c) == 4 and c[0] == 'Lãi suất tái cấp vốn':
            rate = float(c[1].rstrip('%').replace(',', '.'))
            m = re.search(r'ngày (\d\d)/(\d\d)/(\d{4})', c[2])
            if not m or not 0 < rate < 20:
                raise ValueError(f'refi row unreadable: {c}')
            start, out = f'{m.group(3)}-{m.group(2)}', dict(old)
            d = dt.date.fromisoformat(start + '-01')
            while d.isoformat()[:7] <= dt.date.today().isoformat()[:7]:
                out.setdefault(d.isoformat()[:7], rate)  # never rewrite a month already recorded
                d = (d + dt.timedelta(days=32)).replace(day=1)
            out[dt.date.today().isoformat()[:7]] = rate
            return out, {'rate': rate, 'decision': c[2], 'page_effective': c[3]}
    raise ValueError('refi row missing')


def main():
    import sys
    fx_only = '--fx-only' in sys.argv
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    S = old.get('series', {})
    for sid, fields in (() if fx_only else ((10034332, CREDIT), (10038520, MONEY))):
        try:
            for k, v in articles(sid, fields).items():
                S.setdefault(k, {}).update(v)
        except Exception as e:
            print('articles', sid, e)
    if S.get('deposits_firms') and S.get('household_deposits'):
        S['deposits_total'] = {m: S['deposits_firms'][m] + S['household_deposits'][m] for m in S['household_deposits'] if m in S['deposits_firms']}
    try:
        S['refi_rate'], refi_doc = policy_rates(S.get('refi_rate', {}))
    except Exception as e:
        print('refi', e)
        refi_doc = old.get('refi_decision')
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
                               'central_rate_daily': dict(sorted(daily.items())), 'refi_decision': refi_doc}, ensure_ascii=False, indent=0) + '\n')
    print({k: (len(v), max(v) if v else None) for k, v in S.items()})


if __name__ == '__main__':
    main()
