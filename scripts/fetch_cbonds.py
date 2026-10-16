#!/usr/bin/env python3
"""Real-estate corporate bonds from HNX's corporate bond portal (cbonds.hnx.vn), public, no login.

The portal returns HTML fragments to POSTs made in the same cookie session as a page GET whose
`__RequestVerificationToken` meta value is sent back as header CP-TOKEN.
  * Issuers with business field "Bất động sản" (code 4): /to-chuc-phat-hanh/danh-sach-doanh-nghiep
  * Issuance list (one row per bond issue, value = quantity × face value): /to-chuc-phat-hanh/thong-tin-phat-hanh/tim-kiem
  * Outstanding bonds (status 6,5) with remaining quantity, coupon, maturity: /to-chuc-phat-hanh/danh-sach-trai-phieu
Real estate = issuer's registered business field on HNX (not HNX's own industry statistics, which put many developers
under construction). VND bonds only. Monthly interest of the maturity schedule = remaining value × coupon / 12 for
every month up to maturity (floating coupons use the issue coupon: an estimate).

    python3 scripts/fetch_cbonds.py      # writes data/raw/public/cbonds-realestate.json
"""
import collections, datetime as dt, html, json, re, time
from pathlib import Path

import requests, urllib3

urllib3.disable_warnings()
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/cbonds-realestate.json'
B = 'https://cbonds.hnx.vn'
KCN = {'KBC', 'IDC', 'BCM', 'SZC', 'SIP', 'VGC', 'LHG'}


def call(s, method, url, **k):
    for i in range(4):
        try:
            r = s.request(method, url, timeout=120, **k)
            r.raise_for_status()
            return r.text
        except requests.RequestException:
            if i == 3:
                raise
            time.sleep(5)


def session(page):
    s = requests.Session()
    s.verify = False
    s.headers['User-Agent'] = 'Mozilla/5.0'
    tok = re.search(r'name="__RequestVerificationToken" content="([^"]+)', call(s, 'GET', B + page)).group(1)
    s.headers.update({'CP-TOKEN': tok, 'X-Requested-With': 'XMLHttpRequest'})
    return s


def rows(h, n):
    out = []
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', html.unescape(h), re.S):
        c = [re.sub(r'\s+', ' ', re.sub('<[^>]+>', '', x)).strip() for x in re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)]
        if len(c) >= n:
            out.append(c)
    return out


num = lambda t: float(t.replace(',', '')) if t and re.match(r'^[\d,.]+$', t) else None
dmy = lambda t: dt.datetime.strptime(t, '%d/%m/%Y').date()


def issuers():
    s = session('/to-chuc-phat-hanh/danh-sach-doanh-nghiep')
    codes, names, p = set(), set(), 1
    while True:
        rr = rows(call(s, 'POST', B + '/to-chuc-phat-hanh/danh-sach-doanh-nghiep',
                       json={'SearchKeys': ['', '', '4', '', '', '', ''], 'CurrentPage': p, 'NumberRecordOnPage': 100}), 8)
        for x in rr:
            code, _, name = x[1].partition(' - ')
            codes.add(code.strip())
            names.add(re.sub(r'\s+', ' ', name).strip().lower())
        if len(rr) < 100:
            return codes, names
        p += 1


def issuance(codes, since=2019):
    s = session('/to-chuc-phat-hanh/thong-tin-phat-hanh')
    out = []
    for y in range(since, dt.date.today().year + 1):
        d = ([('searchKeys[]', x) for x in ['', '', f'01/01/{y}', f'31/12/{y}']] + [('arrCurrentPage[]', '1')] * 12
             + [('arrNumberRecord[]', '5000')] * 12)
        for x in rows(call(s, 'POST', B + '/to-chuc-phat-hanh/thong-tin-phat-hanh/tim-kiem', data=d), 17):
            if not re.match(r'\d\d/\d\d/\d{4}$', x[6]) or x[4] != 'VNĐ' or x[2].split(' - ')[0].strip() not in codes:
                continue
            q, f = num(x[9]), num(x[10])
            if q and f:
                out.append({'code': x[3], 'issuer': x[2].split(' - ')[0].strip(), 'date': dmy(x[6]).isoformat(),
                            'value': q * f / 1e9, 'tenor': x[5], 'coupon': num(x[16])})
    return {b['code']: b for b in out}.values()  # one row per bond code


def outstanding(names):
    s = session('/to-chuc-phat-hanh/danh-sach-trai-phieu')
    t = call(s, 'POST', B + '/to-chuc-phat-hanh/danh-sach-trai-phieu',
             json={'SearchKeys': ['', '', '', '', 'VNĐ', '6,5', '', ''], 'CurrentPage': 1, 'NumberRecordOnPage': 9000})
    out = []
    for x in rows(t, 15):
        if not re.match(r'\d\d/\d\d/\d{4}$', x[8] or '') or re.sub(r'\s+', ' ', x[3]).strip().lower() not in names:
            continue
        f, q = num(x[4]), num(x[12])
        if f and q:
            out.append({'code': x[1], 'issuer': x[3], 'maturity': dmy(x[8]).isoformat(), 'value': f * q / 1e9, 'coupon': num(x[14])})
    return out


def bucket(tenor):
    m = re.match(r'(\d+(?:[.,]\d+)?)\s*(Năm|Tháng)', tenor or '')
    if not m:
        return 'khác'
    y = float(m.group(1).replace(',', '.')) / (12 if m.group(2) == 'Tháng' else 1)
    return '≤1 năm' if y <= 1 else '1-3 năm' if y <= 3 else '3-5 năm' if y <= 5 else '>5 năm'


def main():
    codes, names = issuers()
    iss = list(issuance(codes))
    agg = collections.defaultdict(lambda: {'value': 0.0, 'issue_count': 0, 'cw': 0.0, 'cv': 0.0, 'buckets': collections.Counter()})
    for b in iss:
        a = agg[b['date'][:7]]
        a['value'] += b['value']; a['issue_count'] += 1; a['buckets'][bucket(b['tenor'])] += b['value']
        if b['coupon']:
            a['cw'] += b['coupon'] * b['value']; a['cv'] += b['value']
    issuance_recs = [{'date': m + '-01', 'value': round(a['value'], 1), 'issue_count': a['issue_count'],
                      'wavg_coupon': round(a['cw'] / a['cv'], 2) if a['cv'] else None,
                      'buckets': {k: round(v, 1) for k, v in a['buckets'].items()}} for m, a in sorted(agg.items())]
    outs = outstanding(names)
    today = dt.date.today().strftime('%Y-%m')
    end = f'{dt.date.today().year + 1}-12'
    months = []
    y, m = map(int, today.split('-'))
    while f'{y}-{m:02d}' <= end:
        months.append(f'{y}-{m:02d}'); y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    mat = {k: {'due': 0.0, 'interest': 0.0, 'codes': set(), 'issuers': set()} for k in months}
    by_issuer = collections.defaultdict(lambda: {'due': 0.0, 'months': set(), 'symbols': set()})
    for b in outs:
        mm = b['maturity'][:7]
        for k in months:
            if k <= mm and b['coupon']:
                mat[k]['interest'] += b['value'] * b['coupon'] / 100 / 12
        if mm in mat:
            mat[mm]['due'] += b['value']; mat[mm]['codes'].add(b['code']); mat[mm]['issuers'].add(b['issuer'])
            i = by_issuer[b['issuer']]; i['due'] += b['value']; i['months'].add(mm); i['symbols'].add(b['code'])
    mat_recs = [{'date': k + '-01', 'due': round(v['due'], 1), 'interest': round(v['interest'], 1), 'bond_count': len(v['codes']),
                 'issuers': len(v['issuers'])} for k, v in mat.items()]
    top = sorted(by_issuer.items(), key=lambda kv: -kv[1]['due'])[:10]
    top_recs = [{'name': n, 'symbol': ', '.join(sorted(v['symbols']))[:60], 'due': round(v['due'], 1), 'months': sorted(v['months'])} for n, v in top]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        'source': 'HNX · Chuyên trang thông tin trái phiếu doanh nghiệp', 'url': B + '/', 'captured': dt.date.today().isoformat(),
        'definition': 'Tổ chức phát hành có lĩnh vực hoạt động "Bất động sản" trên HNX; VND',
        'issuer_count': len(codes), 'outstanding_bonds': len(outs), 'outstanding_value': round(sum(b['value'] for b in outs), 1),
        'issuance': issuance_recs, 'maturity': mat_recs, 'top_issuers': top_recs}, ensure_ascii=False, indent=0) + '\n')
    print(len(codes), 'issuers', len(iss), 'issues', len(outs), 'outstanding', issuance_recs[-3:], mat_recs[:3])


if __name__ == '__main__':
    main()
