#!/usr/bin/env python3
"""Build data/plastic-prices.(json|js): giá dầu Brent, khí Henry Hub và chỉ số giá hạt nhựa theo tháng (FRED, không cần khóa).

Chuỗi (tháng, từ 2007):
  WPU066       Chỉ số giá sản xuất (PPI) Mỹ: hạt nhựa và vật liệu nhựa (1982 = 100) – BLS qua FRED
  POILBREUSDM  Giá dầu Brent, USD/thùng – IMF qua FRED
  MHHNGSP      Giá khí Henry Hub, USD/MMBtu – EIA qua FRED
Trang Nhựa (Nhua/app/nhua-charts.js) vẽ cả ba dưới dạng chỉ số cùng kỳ gốc; số gốc nằm trong bảng dữ liệu.
"""
import csv, io, json
from datetime import date
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
FIRST = '2007-01'
SERIES = {
    'resin_ppi': ('WPU066', 'PPI hạt nhựa và vật liệu nhựa (Mỹ)', '1982 = 100', 'BLS qua FRED'),
    'brent': ('POILBREUSDM', 'Dầu Brent', 'USD/thùng', 'IMF qua FRED'),
    'henry_hub': ('MHHNGSP', 'Khí Henry Hub', 'USD/MMBtu', 'EIA qua FRED'),
}


def fetch(fid):
    r = requests.get(f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={fid}', timeout=60)
    r.raise_for_status()
    rows = list(csv.reader(io.StringIO(r.text)))
    if not rows or len(rows[0]) != 2:
        raise ValueError(f'{fid}: unexpected CSV')
    out = []
    for d, v in rows[1:]:
        if d[:7] >= FIRST and v not in ('', '.'):
            out.append([d[:7], round(float(v), 3)])
    if len(out) < 100:
        raise ValueError(f'{fid}: too few rows')
    return out


def main():
    payload = {'schema': 1, 'built_at': date.today().isoformat(), 'series': {}}
    for key, (fid, name, unit, src) in SERIES.items():
        payload['series'][key] = {'fred_id': fid, 'name': name, 'unit': unit, 'source': src,
                                  'url': f'https://fred.stlouisfed.org/series/{fid}', 'records': fetch(fid)}
    text = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    (ROOT / 'data/plastic-prices.json').write_bytes((text + '\n').encode('utf-8'))
    (ROOT / 'data/plastic-prices.js').write_bytes(('window.PLASTIC_PRICES=' + text + ';\n').encode('utf-8'))
    for k, v in payload['series'].items():
        print(k, v['records'][0], v['records'][-1], len(v['records']))


if __name__ == '__main__':
    main()
