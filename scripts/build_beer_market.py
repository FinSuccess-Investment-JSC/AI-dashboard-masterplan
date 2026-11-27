#!/usr/bin/env python3
"""Dựng data/beer-market.js (window.BEER_MARKET) cho Bia › Kênh tiêu thụ & sản phẩm, Thị phần & cạnh tranh (27/11/2026).

  python scripts/build_beer_market.py

Đầu vào nhập tay (không scrape nguồn trả phí): data/beer/market/*.csv + sources.json.
  channel_volume.csv   sản lượng tiêu thụ theo kênh (Euromonitor, triệu lít, năm)
  company_share.csv    thị phần công ty theo sản lượng, NBO; scope = total | off_trade | on_trade
  brand_share.csv      thị phần thương hiệu theo sản lượng toàn thị trường
  pack_production.csv  sản lượng SẢN XUẤT theo chủng loại (lon, chai, hơi), kỳ lũy kế ghi rõ (vd 2026H1)
Mỗi dòng ra một observation có đủ metadata; số tính thêm (kỳ trước suy từ % so cùng kỳ, phần chưa phân loại) gắn data_status
'derived' kèm calculation_method. Chỉ số (tỷ trọng, CAGR, chỉ số 2019=100…) tính ở trang từ số gốc, không lưu sẵn.
Kiểm tra (lỗi thì dừng, không ghi đè dữ liệu cũ):
  - tổng thị phần mỗi kỳ × phạm vi = 100 ± 0,6; tổng kênh = tổng thị trường ± 0,2%;
  - không trộn phạm vi: total / off_trade / on_trade tách chuỗi; chủng loại sản xuất không ghép với tiêu thụ;
  - giá trị trống giữ trống (không điền 0).
Lưu phiên bản: khi số đổi so với bản trước, bản cũ chép vào data/beer/market/history/<ngày>.json để soát nguồn sửa số quá khứ.
"""
import csv, datetime as dt, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IN = ROOT / 'data/beer/market'
OUT = ROOT / 'data/beer/market.json'
OUT_JS = ROOT / 'data/beer-market.js'
HIST = IN / 'history'
TODAY = dt.date.today().isoformat()


def rows(name):
    with open(IN / name, encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))


def num(v):
    v = (v or '').strip()
    return None if v == '' else float(v)


def main():
    src = json.loads((IN / 'sources.json').read_text(encoding='utf-8'))
    obs, errs = [], []

    def add(**o):
        s = src[o.pop('source')]
        o.update(source_name=s['name'], source_url=s['url'], source_table=s.get('table', ''), publication_date=s.get('published', ''),
                 geography='Việt Nam', last_updated=TODAY)
        o.setdefault('calculation_method', '')
        obs.append(o)

    # Kênh tiêu thụ
    vol = {}
    for r in rows('channel_volume.csv'):
        v = num(r['value'])
        vol.setdefault(r['period'], {})[r['channel']] = v
        add(period=r['period'], metric='volume', entity='market', product='beer', channel=r['channel'], value=v, unit='triệu lít',
            measurement_basis='tiêu thụ (total volume)', market_share_scope='', source=r['source'], data_status=r['data_status'])
    for p, d in vol.items():
        if None not in (d.get('off_trade'), d.get('on_trade'), d.get('total')) and abs(d['off_trade'] + d['on_trade'] - d['total']) > d['total'] * .002:
            errs.append(f'kênh {p}: mang về + tại chỗ ≠ tổng')

    # Thị phần công ty
    share = {}
    for r in rows('company_share.csv'):
        v = num(r['value'])
        share.setdefault((r['scope'], r['period']), []).append(v)
        add(period=r['period'], metric='company_share', entity=r['entity'], product='beer', channel=r['scope'], value=v, unit='%',
            measurement_basis='sản lượng, NBO', market_share_scope=r['scope'], source=r['source'], data_status=r['data_status'])
    for (sc, p), vs in share.items():
        if None not in vs and abs(sum(vs) - 100) > .6:
            errs.append(f'thị phần {sc} {p}: tổng {sum(vs):.1f}%')

    # Thị phần thương hiệu
    br = rows('brand_share.csv')
    years = [k for k in br[0] if k.isdigit()]
    for y in years:
        t = sum(num(r[y]) or 0 for r in br)
        if abs(t - 100) > .6:
            errs.append(f'thương hiệu {y}: tổng {t:.1f}%')
        for r in br:
            add(period=y, metric='brand_share', entity=r['company'], product=r['brand'], channel='total', value=num(r[y]), unit='%',
                measurement_basis='sản lượng, NBO', market_share_scope='total', source='euro_2025_brand', data_status='actual')

    # Sản xuất theo chủng loại (lũy kế kỳ), suy kỳ cùng kỳ năm trước từ % tăng
    pk = {}
    for r in rows('pack_production.csv'):
        v, y = num(r['value']), num(r['yoy_pct'])
        pk.setdefault(r['period'], {})[r['product']] = v
        add(period=r['period'], metric='production', entity='market', product=r['product'], channel='', value=v, unit='triệu lít',
            measurement_basis='sản xuất', market_share_scope='', source=r['source'], data_status=r['data_status'])
        if v is not None and y is not None:
            prev = r['period'].replace(r['period'][:4], str(int(r['period'][:4]) - 1), 1)
            add(period=prev, metric='production', entity='market', product=r['product'], channel='', value=round(v / (1 + y / 100), 1), unit='triệu lít',
                measurement_basis='sản xuất', market_share_scope='', source=r['source'], data_status='derived',
                calculation_method=f'derived_from_yoy: {r["period"]} ÷ (1 + {y}%)')
    for p, d in pk.items():
        parts = [d.get(k) for k in ('can', 'bottle', 'draft')]
        if None not in parts and d.get('total') is not None:
            add(period=p, metric='production', entity='market', product='unclassified', channel='', value=round(d['total'] - sum(parts), 1), unit='triệu lít',
                measurement_basis='sản xuất', market_share_scope='', source=next(r['source'] for r in rows('pack_production.csv') if r['period'] == p),
                data_status='derived', calculation_method='tổng − (lon + chai + hơi); không phân bổ vào chủng loại')

    if errs:
        print('build_beer_market: dữ liệu không đạt, giữ bản cũ:', '; '.join(errs))
        return 1
    payload = {'schema': 1, 'built_at': TODAY, 'sources': src, 'observations': obs}
    if OUT.exists():
        old = json.loads(OUT.read_text(encoding='utf-8'))
        key = lambda o: (o['metric'], o['period'], o['entity'], o['product'], o['channel'])
        if {key(o): o['value'] for o in old['observations']} != {key(o): o['value'] for o in obs}:
            HIST.mkdir(exist_ok=True)
            (HIST / f"{old.get('built_at', 'cu')}.json").write_text(json.dumps(old, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
        elif old.get('sources') == src:
            payload['built_at'] = old['built_at']
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('/* Sinh bởi scripts/build_beer_market.py — không sửa tay. */\nwindow.BEER_MARKET = ' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n',
                      encoding='utf-8', newline='\n')
    print(f'build_beer_market: {len(obs)} observation')
    return 0


if __name__ == '__main__':
    sys.exit(main())
