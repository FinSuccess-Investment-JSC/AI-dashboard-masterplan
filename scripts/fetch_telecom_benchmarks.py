#!/usr/bin/env python3
"""Chỉ tiêu so sánh quốc tế cho dashboard Viễn thông (Vien-thong/, Bức tranh ngành › Internet cố định, Tăng trưởng).
Nguồn: World Bank WDI API (số gốc của ITU World Telecommunication/ICT Indicators). Năm, Việt Nam và các nước ASEAN
có quy mô/thu nhập gần (Thái Lan, Indonesia, Philippines, Malaysia, Campuchia).

  python scripts/fetch_telecom_benchmarks.py      # ghi data/raw/public/telecom-benchmarks.json

Không điền năm thiếu; giữ bản trước cho chỉ tiêu tải lỗi."""
import datetime as dt, json, ssl, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/telecom-benchmarks.json'
API = 'https://api.worldbank.org/v2/country/{c}/indicator/{i}?format=json&per_page=200&date=2010:2030'
COUNTRIES = {'VNM': 'Việt Nam', 'THA': 'Thái Lan', 'IDN': 'Indonesia', 'PHL': 'Philippines', 'MYS': 'Malaysia', 'KHM': 'Campuchia'}
INDICATORS = {
    'IT.NET.BBND.P2': ('fixed_bb_per100', 'Thuê bao băng rộng cố định trên 100 dân', 'thuê bao/100 dân'),
    'IT.NET.BBND': ('fixed_bb', 'Thuê bao băng rộng cố định', 'thuê bao'),
    'IT.CEL.SETS.P2': ('mobile_per100', 'Thuê bao di động trên 100 dân', 'thuê bao/100 dân'),
    'IT.NET.USER.ZS': ('internet_users', 'Người dùng Internet', '% dân số'),
    'SP.POP.TOTL': ('population', 'Dân số', 'người'),
    'NY.GDP.PCAP.CD': ('gdp_pc', 'GDP bình quân đầu người', 'USD'),
}


def http(url):
    ctx = ssl.create_default_context()
    for i in range(3):
        try:
            return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60, context=ctx).read())
        except Exception:
            if i == 2:
                raise
            time.sleep(3)


def main():
    old = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    series, stale = {}, []
    for ind, (key, label, unit) in INDICATORS.items():
        try:
            data = {}
            for c in COUNTRIES:
                rows = http(API.format(c=c, i=ind))
                data[c] = {r['date']: r['value'] for r in (rows[1] if len(rows) > 1 and rows[1] else []) if r.get('value') is not None}
                data[c] = dict(sorted(data[c].items()))
                time.sleep(0.2)
            if not any(data.values()):
                raise ValueError('rỗng')
            series[key] = {'indicator': ind, 'label': label, 'unit': unit, 'data': data}
        except Exception as e:
            if key in old.get('series', {}):
                series[key] = old['series'][key]
            stale.append({'indicator': ind, 'error': str(e)[:200]})
    payload = {'captured': dt.date.today().isoformat(), 'source': 'World Bank WDI (số liệu ITU World Telecommunication/ICT Indicators)',
               'url': 'https://data.worldbank.org/indicator/IT.NET.BBND.P2', 'countries': COUNTRIES, 'series': series, 'stale': stale}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(series), 'chỉ tiêu;', len(stale), 'lỗi')


if __name__ == '__main__':
    sys.exit(main())
