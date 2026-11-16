#!/usr/bin/env python3
"""Daily series for the Vận tải biển dashboard (16/11/2026).

  * BDI: CNBC chart API (.BADI), every session close for the last 12 months (the month-end series stays in
    scripts/fetch_markets.py). Unofficial endpoint; on failure the stored series is kept.
  * Shipping stocks PVT, VTO, VOS, VIP: VNDirect finfo stock_prices, adjusted close (adClose) from 2025-12-31.
    Today's row is skipped until 15:05 (session still open); zero-volume rows are skipped.
  * Baltic route TCE (Affinity Tanker Weekly PDFs via Hellenic Shipping News) is entered by hand with an evidence
    quote in data/shipping/evidence.json; this script keeps the stored 'tce' block unchanged.

    python3 scripts/fetch_shipping_daily.py   # writes data/shipping-daily-public-data.json/.js
"""
import json, subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/shipping-daily-public-data.json'
CNBC = 'https://ts-api.cnbc.com/harmony/app/charts/1Y.json?symbol=.BADI'
VND = 'https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date&q=code:{t}~date:gte:2025-12-31&size=400'
TICKERS = ['PVT', 'VTO', 'VOS', 'VIP']


def get(url):
    return json.loads(subprocess.run(['curl', '-sfL', '-m', '60', '-A', 'Mozilla/5.0', url],
                                     check=True, capture_output=True, text=True).stdout)


def main():
    out = json.loads(OUT.read_text()) if OUT.exists() else {}
    out['schema'] = 1
    try:
        rows = []
        for b in get(CNBC)['barData']['priceBars']:
            t = b['tradeTime']
            v = float(b['close'])
            if 100 <= v <= 20000:
                rows.append([f'{t[:4]}-{t[4:6]}-{t[6:8]}', v])
        if len(rows) > 100:
            out['bdi'] = {'name': 'Baltic Dry Index', 'unit': 'điểm', 'source': 'Baltic Exchange qua CNBC (.BADI)',
                          'url': 'https://www.cnbc.com/quotes/.BADI', 'records': sorted(dict(rows).items())}
    except Exception as e:
        print('bdi', e)
    now = datetime.now(timezone(timedelta(hours=7)))
    today = now.strftime('%Y-%m-%d') if now.strftime('%H:%M') < '15:05' else ''  # skip the open session
    stocks = out.get('stocks', {})
    for t in TICKERS:
        try:
            data = get(VND.format(t=t))['data']
            rec = {r['date']: r['adClose'] for r in data
                   if r.get('adClose') and r['date'] != today and r.get('nmVolume')}
            if '2025-12-31' in rec and len(rec) > 50:
                stocks[t] = {'records': sorted(rec.items()),
                             'url': f'https://dstock.vndirect.com.vn/tong-quan/{t}'}
        except Exception as e:
            print(t, e)
    out['stocks'] = stocks
    out['stocks_source'] = {'name': 'VNDirect finfo · giá đóng cửa điều chỉnh', 'url': 'https://dstock.vndirect.com.vn/'}
    out['checked_at'] = datetime.now(timezone(timedelta(hours=7))).isoformat(timespec='seconds')
    OUT.write_text(json.dumps(out, ensure_ascii=False) + '\n')
    OUT.with_suffix('.js').write_text('window.SHIPPING_DAILY = ' + json.dumps(out, ensure_ascii=False) + ';\n')
    print({'bdi': out.get('bdi', {}).get('records', [[None]])[-1], **{k: v['records'][-1] for k, v in stocks.items()}})


if __name__ == '__main__':
    main()
