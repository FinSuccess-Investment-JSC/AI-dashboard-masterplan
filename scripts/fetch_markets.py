#!/usr/bin/env python3
"""Month-end market prices without an official free feed: Baltic Dry Index and Chinese commodity futures.

  * BDI: CNBC chart API (symbol .BADI), daily bars for the last year + monthly bars since 1985. Unofficial endpoint.
  * China futures (CNY/tấn): Sina Finance daily K-line of the continuous main contract ("0" symbols) for Zhengzhou
    (CY cotton yarn, CF cotton, PF polyester staple fibre, TA PTA) and Dalian (EG MEG, J coke). The continuous series
    rolls between contracts, so month-to-month changes can include a roll gap.
The last close of each month is kept (latest close for the current month).

    python3 scripts/fetch_markets.py      # writes data/raw/public/markets-monthly.json
"""
import json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/markets-monthly.json'
CNBC = 'https://ts-api.cnbc.com/harmony/app/charts/{span}.json?symbol=.BADI'
SINA = 'https://stock2.finance.sina.com.cn/futures/api/jsonp.php/x=/InnerFuturesNewService.getDailyKLine?symbol={s}'
FUT = {'yarn_cn': ('CY0', 'Sợi cotton (ZCE, hợp đồng liên tục)'), 'cotton_cn': ('CF0', 'Bông (ZCE, hợp đồng liên tục)'),
       'psf': ('PF0', 'Xơ polyester PSF (ZCE, hợp đồng liên tục)'), 'pta': ('TA0', 'PTA (ZCE, hợp đồng liên tục)'),
       'meg': ('EG0', 'Ethylene glycol MEG (DCE, hợp đồng liên tục)'), 'coke': ('J0', 'Than cốc (DCE, hợp đồng liên tục)')}


def get(url):
    return subprocess.run(['curl', '-sfL', '-m', '60', '-A', 'Mozilla/5.0', url], check=True, capture_output=True, text=True).stdout


def month_end(pairs):
    last = {}
    for d, v in sorted(pairs):
        last[d[:7]] = {'date': d, 'value': v}
    return last


def main():
    out = json.loads(OUT.read_text()) if OUT.exists() else {'series': {}}
    S = out.setdefault('series', {})
    try:
        bars = []
        for span in ('ALL', '1Y'):
            for b in json.loads(get(CNBC.format(span=span)))['barData']['priceBars']:
                t = b['tradeTime']
                bars.append((f'{t[:4]}-{t[4:6]}-{t[6:8]}', float(b['close'])))
        S['bdi'] = {'name': 'Baltic Dry Index', 'unit': 'điểm', 'source': 'Baltic Exchange qua CNBC (.BADI)',
                    'url': 'https://www.cnbc.com/quotes/.BADI', 'records': month_end([x for x in bars if x[0] >= '2019-01-01'])}
    except Exception as e:
        print('bdi', e)
    for key, (sym, name) in FUT.items():
        try:
            t = get(SINA.format(s=sym))
            rows = json.loads(re.search(r'x=\((.*)\);', t, re.S).group(1))
            S[key] = {'name': name, 'unit': 'CNY/tấn', 'source': 'Sina Finance · hợp đồng tương lai Trung Quốc',
                      'url': f'https://finance.sina.com.cn/futures/quotes/{sym}.shtml',
                      'records': month_end([(r['d'], float(r['c'])) for r in rows if r['d'] >= '2022-01-01'])}
        except Exception as e:
            print(key, e)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=0) + '\n')
    print({k: (len(v['records']), list(v['records'].values())[-1]) for k, v in S.items()})


if __name__ == '__main__':
    main()
