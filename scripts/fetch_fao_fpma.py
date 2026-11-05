#!/usr/bin/env python3
"""FAO GIEWS FPMA price series (JSON API, no key) -> data/raw/public/fao-fpma.json.

International series (FpmaSerieInternational): Thai 5% (weekly), Viet Nam 5% and 25%, India 25%, Pakistan 25%
(monthly), SMP/WMP Europe & Oceania (monthly), fish meal Bremen, soybean meal Hamburg (monthly).
Domestic series (FpmaSerieDomestic/?country=VNM): rice 5% wholesale An Giang / Dong Thap / Bac Lieu (weekly, VND/kg).
Prices: FpmaSeriePrice/<uuid>/ (datapoints newest first, weekly + calculated monthly).
Offline: when the API fails the existing file is kept (last-good). Run from GitHub; FAO has no IP block.
"""
import datetime as dt
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/fao-fpma.json'
API = 'https://fpma.fao.org/giews/v4/price_module/api/v1/'
PAGE = 'https://fpma.fao.org/giews/pricetool/'
# key: (uuid, name, periodicity kept, unit, note)
SERIES = {
    'rice_thai5': ('eb6de409-12ab-4d90-a427-ecaec4c13edb', 'Gạo Thái 5% tấm, FOB Bangkok', 'weekly', 'USD/tấn', ''),
    'rice_vn5': ('ec5d9f1a-40a7-43f0-b745-761aa96a08ee', 'Gạo Việt Nam 5% tấm, FOB', 'monthly', 'USD/tấn', ''),
    'rice_vn25': ('7a599acb-be8e-4ae2-8bd3-c1e7370c6ced', 'Gạo Việt Nam 25% tấm, FOB', 'monthly', 'USD/tấn', ''),
    'rice_india25': ('ec0bfeb2-6cf3-48a9-8725-3a8860aeae1f', 'Gạo Ấn Độ 25% tấm', 'monthly', 'USD/tấn', ''),
    'rice_pak25': ('9524c0df-0c69-45ba-a321-0bd2275b1ca5', 'Gạo Pakistan 25% tấm', 'monthly', 'USD/tấn', ''),
    'smp': ('050a093f-268a-415b-8e1a-a87033d1908f', 'Sữa bột gầy SMP (bình quân châu Âu & châu Đại Dương, FOB)', 'monthly', 'USD/tấn', ''),
    'wmp': ('70d0099b-3cda-4997-9bf1-dfc86ed1927c', 'Sữa bột nguyên kem WMP (bình quân châu Âu & châu Đại Dương, FOB)', 'monthly', 'USD/tấn', ''),
    'fishmeal': ('f36e9b0a-3b82-4693-a4be-9ffd872cc225', 'Bột cá 64/65% Bremen', 'monthly', 'USD/tấn', ''),
    'soymeal_hamburg': ('469e11ec-f6dc-4e4d-92bc-88e5460d4244', 'Khô đậu tương 44/45% Hamburg', 'monthly', 'USD/tấn', ''),
    'rice5_angiang': ('16230771-cea4-43a2-b438-22a14026c9e2', 'Gạo 5% tấm bán buôn An Giang', 'weekly', 'VND/kg', 'domestic'),
    'rice5_dongthap': ('cc5b62fc-0f69-40d3-bbf3-c9a9807ecb11', 'Gạo 5% tấm bán buôn Đồng Tháp', 'weekly', 'VND/kg', 'domestic'),
    'rice5_baclieu': ('756c8234-c859-404c-9752-20bd51745801', 'Gạo 5% tấm bán buôn Bạc Liêu', 'weekly', 'VND/kg', 'domestic'),
}
SINCE = '2015-01-01'


def http(url):
    last = None
    for i in range(3):
        try:
            return subprocess.run(['curl', '-sfL', '-m', '60', url], check=True, capture_output=True, text=True).stdout
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(3 * (i + 1))
    raise RuntimeError(f'{url}: {last}')


def fetch(uuid, period):
    j = json.loads(http(f'{API}FpmaSeriePrice/{uuid}/'))
    pts = [p for p in j.get('datapoints', []) if p.get('periodicity') == period and p.get('price_value') is not None and p['date'] >= SINCE]
    recs = {p['date']: round(float(p['price_value']), 2) for p in pts}
    return [{'date': d, 'value': recs[d]} for d in sorted(recs)]


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    series, errors = dict(old.get('series') or {}), {}
    for key, (uuid, name, period, unit, note) in SERIES.items():
        try:
            recs = fetch(uuid, period)
            if recs:
                series[key] = {'uuid': uuid, 'name': name, 'time_type': period, 'unit': unit, 'records': recs, 'latest_observation': recs[-1]['date'],
                               'url': f'{API}FpmaSeriePrice/{uuid}/'}
        except Exception as e:  # noqa: BLE001
            errors[key] = str(e)[:200]
            if key not in series:
                series[key] = {'uuid': uuid, 'name': name, 'time_type': period, 'unit': unit, 'records': []}
    out = {'source': 'FAO GIEWS Food Price Monitoring and Analysis (FPMA)', 'url': PAGE, 'api': API,
           'checked': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'errors': errors, 'series': series}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('fao-fpma:', {k: (len(v['records']), v.get('latest_observation')) for k, v in series.items()}, errors or '')
    return 0


if __name__ == '__main__':
    sys.exit(main())
