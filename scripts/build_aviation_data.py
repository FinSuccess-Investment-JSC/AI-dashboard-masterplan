#!/usr/bin/env python3
"""Dựng data/aviation-data.json/.js (window.AVIATION_DATA) cho dashboard ngành Hàng không (Hang-khong/).

  python scripts/build_aviation_data.py [--offline]

Ba nhóm nguồn, mỗi nhóm một nhịp:
  1. Chuỗi tháng tự động: data/raw/public/nso-monthly.json (scripts/fetch_nso.py): khách vận chuyển đường hàng không
     (air_pax, nghìn HK), luân chuyển (air_paxkm, triệu HK.km), hàng hóa vận chuyển đường hàng không (air_freight, nghìn tấn),
     khách quốc tế đến (tourists), theo đường không (visitors_air) và theo thị trường (vis_*). NSO ghi số "ước tính" cho tháng
     báo cáo, workbook tháng sau thay bằng "sơ bộ".
     data/raw/public/sbv-monthly.json (scripts/fetch_sbv.py): tỷ giá trung tâm USD/VND theo ngày và bình quân tháng.
  2. Jet fuel EIA (tải khi chạy): EER_EPJK_PF4_RGC_DPG – U.S. Gulf Coast kerosene-type jet fuel spot FOB, USD/gallon, ngày
     và tháng (file xls của EIA). Lỗi tải thì giữ bản trước trong data/aviation-data.json.
  3. Số đọc tay từ bài công bố/PDF: data/aviation/observations.json (mỗi dòng: metric_id, entity, scope, segment,
     period_start, period_end, frequency, value, unit, published_at, status, source_url, checked_at, quote) và
     data/aviation/airports.json. Không suy ra số tháng từ lũy kế trừ khi dòng ghi derived="tính từ lũy kế".
Kiểm tra (ghi vào 'checks'): trường bắt buộc, đơn vị nhất quán theo metric, YoY chỉ giữ khi nguồn công bố.
"""
import argparse, datetime as dt, io, json, ssl, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OBS = ROOT / 'data/aviation/observations.json'
AIRPORTS = ROOT / 'data/aviation/airports.json'
NSO = ROOT / 'data/raw/public/nso-monthly.json'
SBV = ROOT / 'data/raw/public/sbv-monthly.json'
OUT = ROOT / 'data/aviation-data.json'
OUT_JS = ROOT / 'data/aviation-data.js'
EIA = {'daily': 'https://www.eia.gov/dnav/pet/hist_xls/EER_EPJK_PF4_RGC_DPGd.xls',
       'monthly': 'https://www.eia.gov/dnav/pet/hist_xls/EER_EPJK_PF4_RGC_DPGm.xls'}
EIA_PAGE = 'https://www.eia.gov/dnav/pet/hist/EER_EPJK_PF4_RGC_DPGD.htm'
REQUIRED = ['metric_id', 'entity', 'scope', 'segment', 'period_start', 'period_end', 'frequency', 'value', 'unit',
            'published_at', 'status', 'source_url']
# NSO key -> (tên, đơn vị, hệ số)
NSO_KEYS = {
    'air_pax': ('Khách vận chuyển đường hàng không (doanh nghiệp vận tải trong nước)', 'nghìn lượt khách', 1),
    'air_paxkm': ('Luân chuyển hành khách đường hàng không', 'triệu HK.km', 1),
    'air_freight': ('Hàng hóa vận chuyển đường hàng không (doanh nghiệp vận tải trong nước)', 'nghìn tấn', 1),
    'tourists': ('Khách quốc tế đến Việt Nam', 'lượt', 1),
    'visitors_air': ('Khách quốc tế đến Việt Nam bằng đường không', 'lượt', 1),
    'vis_cn': ('Trung Quốc', 'lượt', 1), 'vis_kr': ('Hàn Quốc', 'lượt', 1), 'vis_tw': ('Đài Loan', 'lượt', 1),
    'vis_jp': ('Nhật Bản', 'lượt', 1), 'vis_us': ('Hoa Kỳ', 'lượt', 1), 'vis_ru': ('Nga', 'lượt', 1),
    'vis_in': ('Ấn Độ', 'lượt', 1), 'vis_au': ('Úc', 'lượt', 1), 'vis_th': ('Thái Lan', 'lượt', 1),
    'vis_my': ('Ma-lai-xi-a', 'lượt', 1), 'vis_sg': ('Xin-ga-po', 'lượt', 1), 'vis_ph': ('Phi-li-pin', 'lượt', 1),
    'vis_kh': ('Cam-pu-chia', 'lượt', 1),
}
SINCE = '2018-01'


def http(url):
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=90, context=ctx).read()


def eia(kind):
    import xlrd
    b = xlrd.open_workbook(file_contents=http(EIA[kind]))
    sh = b.sheet_by_name('Data 1')
    out = []
    for r in range(3, sh.nrows):
        d, v = sh.row_values(r)[:2]
        if d == '' or v == '':
            continue
        day = xlrd.xldate_as_datetime(d, b.datemode).date()
        out.append([day.strftime('%Y-%m') if kind == 'monthly' else day.isoformat(), round(float(v), 3)])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--offline', action='store_true', help='không tải EIA, giữ chuỗi jet fuel của lần dựng trước')
    a = ap.parse_args()
    old = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    checks = {'missing_fields': [], 'unit_conflict': [], 'errors': []}

    # 1. NSO + NHNN
    nso = json.loads(NSO.read_text(encoding='utf-8'))
    url = nso['files'][max(nso['files'])] if nso.get('files') else nso.get('url')
    series = {}
    for k, (name, unit, f) in NSO_KEYS.items():
        s = nso['series'].get(k) or {}
        recs = [{'date': m + '-01', 'value': round(v * f, 4)} for m, v in sorted(s.items()) if m >= SINCE]
        if recs:
            series[k] = {'name': name, 'unit': unit, 'time_type': 'monthly', 'source': nso['source'], 'url': url, 'records': recs}
    sbv = json.loads(SBV.read_text(encoding='utf-8')) if SBV.exists() else {}
    fx = {'source': 'Ngân hàng Nhà nước · tỷ giá trung tâm', 'url': (sbv.get('pages') or {}).get('fx', 'https://sbv.gov.vn/'),
          'unit': 'đồng/USD', 'monthly': sorted([m, v] for m, v in (sbv.get('series', {}).get('usdvnd') or {}).items()),
          'daily': sorted([d, v] for d, v in (sbv.get('central_rate_daily') or {}).items()),
          'method': 'Bình quân tháng = trung bình các ngày NHNN công bố trong tháng; tháng hiện tại tính đến ngày mới nhất.'}

    # 2. EIA jet fuel
    fuel = old.get('fuel') or {}
    if not a.offline:
        try:
            fuel = {'source': 'EIA · Jet fuel spot – US Gulf Coast (EER_EPJK_PF4_RGC_DPG)', 'url': EIA_PAGE, 'unit': 'USD/gallon',
                    'monthly': [r for r in eia('monthly') if r[0] >= '2015-01'], 'daily': [r for r in eia('daily') if r[0] >= '2024-01-01'],
                    'method': 'Giá giao ngay FOB, nhiên liệu phản lực loại kerosene, vùng Vịnh Mỹ; USD/gallon (1 thùng = 42 gallon). Dùng theo dõi xu hướng giá đầu vào, không phải giá hãng Việt mua.',
                    'captured': dt.date.today().isoformat()}
        except Exception as e:  # giữ bản trước
            checks['errors'].append({'source': 'EIA', 'error': str(e)[:200]})
            fuel = old.get('fuel') or {}

    # 3. Số đọc tay
    raw = json.loads(OBS.read_text(encoding='utf-8'))
    obs, units = [], {}
    for o in raw['observations']:
        miss = [k for k in REQUIRED if o.get(k) in (None, '') and not (k == 'value' and o.get('yoy') is not None)]
        if miss:
            checks['missing_fields'].append({'metric_id': o.get('metric_id'), 'period': o.get('period_label'), 'missing': miss})
            continue
        u = units.setdefault((o['metric_id'], o['segment']), o['unit'])
        if u != o['unit']:
            checks['unit_conflict'].append({'metric_id': o['metric_id'], 'units': [u, o['unit']]})
        o.setdefault('period_label', o['period_end'][:4] if o['frequency'] == 'annual' else o['period_end'])
        o.setdefault('source_name', raw.get('sources', {}).get(o['source_url'], ''))
        obs.append(o)
    airports = json.loads(AIRPORTS.read_text(encoding='utf-8')) if AIRPORTS.exists() else {'airports': []}

    payload = {'schema': 1, 'built_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
               'blocks': {'macro': {'series': series}}, 'fx': fx, 'fuel': fuel, 'obs': obs,
               'extra': raw.get('extra', {}), 'airports': airports['airports'], 'airports_meta': airports.get('meta', {}),
               'checks': checks}
    text = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    OUT.write_text(text + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('window.AVIATION_DATA = ' + text + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(series), 'chuỗi tháng;', len(obs), 'quan sát;', 'jet fuel', (fuel.get('daily') or [[None]])[-1][0],
          {k: len(v) for k, v in checks.items()})


if __name__ == '__main__':
    sys.exit(main())
