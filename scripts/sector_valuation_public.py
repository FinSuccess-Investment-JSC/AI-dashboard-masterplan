#!/usr/bin/env python3
"""Sector valuation (P/E, P/B, market cap per session) aggregated from the tracked tickers.

Source: VNDirect finfo `ratios` history (51003 market cap VND, 51006 P/E, 51012 P/B), one call per ticker.
Each basket keeps the block id the pages already read (old GICS-4 ids) but its members are our own tickers,
so the series is "rổ mã theo dõi", not a full GICS industry:
    P/E = Σ market cap / Σ (market cap / P/E),  P/B = Σ market cap / Σ (market cap / P/B)
Market cap sums every ticker with a value; P/E sums tickers VNDirect gives a P/E for (it omits P/E for loss-making
tickers, e.g. STK) and P/B those with a P/B. A session needs at least half of the basket (by count). Aggregate
P/E is null when summed earnings are not positive.
"""
import json, ssl, subprocess, time, urllib.request
from collections import defaultdict

URL = ('https://api-finfo.vndirect.com.vn/v4/ratios?q=code:{t}~itemCode:51003,51006,51012~reportDate:gte:{since}'
       '&sort=reportDate:asc&size=5000&fields=itemCode,value,reportDate')
PAGE = 'https://dstock.vndirect.com.vn/tong-quan/{t}'
SINCE = '2024-01-01'
# block id -> (label, tickers)
BASKETS = {
    'agri': {'282': ('Cao su', 'GVR DPR PHR'), '239': ('Sữa', 'VNM'), '240': ('Chăn nuôi, chế biến thịt', 'DBC HAG BAF'),
             '120': ('Bia', 'SAB'), '235': ('Thức ăn chăn nuôi', 'DBC'), '241': ('Thực phẩm đóng gói', 'MSN KDC')},
    'construction': {'281': ('Thép', 'HPG HSG NKG'), '264': ('Xi măng', 'HT1 BCC'), '260': ('Đá, VLXD', 'KSB DHA VLB PLC'),
                     '170': ('Hạ tầng, cầu đường', 'C4G LCG HHV CII HUT'), '171': ('Xây dựng công trình', 'CTD HBC VCG FCN DPG')},
    'insurance': {'151': ('Nhân thọ (BVH)', 'BVH'), '285': ('Phi nhân thọ', 'PVI BMI MIG PTI BIC'), '154': ('Tái bảo hiểm', 'VNR')},
    'port': {'309': ('Cảng', 'GMD PHP SGP VSC CDN DVP PDN'), '185': ('Vận tải biển', 'HAH'),
             '182': ('Kho bãi & logistics', 'TCL STG'), '183': ('Hỗ trợ vận tải hàng không', 'SCS SGN')},
    'realestate': {'160': ('BĐS dân cư', 'VHM NVL KDH NLG DXG PDR DIG CEO AGG TCH NTL'), '159': ('Cho thuê', 'VRE'),
                   '161': ('Môi giới', 'DXS'), '157': ('BĐS khu công nghiệp', 'KBC IDC BCM SZC SIP VGC LHG')},
    'retail': {'220': ('Chuỗi bán lẻ (MWG, FRT)', 'MWG FRT'), '215': ('Phân phối điện tử', 'DGW PET'),
               '224': ('Bán lẻ xe', 'HAX SVC'), '239': ('Sữa', 'VNM'), '120': ('Bia', 'SAB')},
    'seafood': {'238': ('Thủy sản', 'VHC ANV IDI FMC MPC CMX ASM'), '235': ('Thức ăn chăn nuôi', 'DBC')},
    'shipping': {'185': ('Vận tải biển', 'PVT VTO VIP PVP GSP VOS VNA HAH'), '309': ('Cảng', 'GMD PHP SGP VSC CDN DVP PDN')},
    'textile': {'204': ('May', 'TCM TNG MSH GIL'), '207': ('Sợi', 'STK ADS')},
    'pharma': {'222': ('Dược phẩm', 'DHG IMP DBD TRA DMC DVN')},
}


def fetch(t):
    url = URL.format(t=t, since=SINCE)
    for i in range(3):
        try:
            out = subprocess.run(['curl', '-sfL', '-m', '60', '-A', 'Mozilla/5.0', url], check=True, capture_output=True, text=True).stdout
            return json.loads(out)['data']
        except Exception:
            if i == 2:
                raise
            time.sleep(3)


def ticker_rows(t, cache):
    if t not in cache:
        rows = defaultdict(dict)
        for r in fetch(t):
            if r.get('value') is not None:
                rows[r['reportDate']][r['itemCode']] = r['value']
        cache[t] = {d: v for d, v in rows.items() if '51003' in v}
    return cache[t]


def basket(label, tickers, cache, errors):
    members = tickers.split()
    data = {}
    for t in members:
        try:
            data[t] = ticker_rows(t, cache)
        except Exception as e:
            errors[t] = str(e)[:120]
    dates = sorted({d for v in data.values() for d in v})
    recs = []
    for d in dates:
        live = [data[t][d] for t in data if d in data[t]]
        if len(live) * 2 < len(members):
            continue
        cap = sum(x['51003'] for x in live)
        pe = [x for x in live if x.get('51006')]
        pb = [x for x in live if x.get('51012')]
        earn = sum(x['51003'] / x['51006'] for x in pe)
        book = sum(x['51003'] / x['51012'] for x in pb)
        recs.append([d, round(sum(x['51003'] for x in pe) / earn, 4) if earn > 0 else None,
                     round(sum(x['51003'] for x in pb) / book, 4) if book > 0 else None, round(cap / 1e9, 1)])
    return {'name': label, 'members': members, 'columns': ['date', 'pe', 'pb', 'market_cap_bn'], 'records': recs,
            'sources': {t: PAGE.format(t=t) for t in members}}


def build(sector, cache, errors):
    spec = BASKETS.get(sector)
    if not spec:
        return None
    by = {i: basket(lbl, tk, cache, errors) for i, (lbl, tk) in spec.items()}
    return {'by_sector': {i: b for i, b in by.items() if b['records']},
            'source': 'VNDirect finfo · P/E, P/B, vốn hóa từng mã theo phiên; tổng hợp rổ mã theo dõi',
            'url': 'https://dstock.vndirect.com.vn/',
            'method': 'P/E = Σ vốn hóa / Σ (vốn hóa / P/E); P/B tương tự. Một phiên cần ≥ 1/2 số mã của rổ.'}
