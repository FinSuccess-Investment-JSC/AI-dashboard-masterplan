#!/usr/bin/env python3
"""Dựng data/power-plants.json + data/power-plants.js (window.POWER_PLANTS) cho bản đồ phân bổ nguồn điện
(Điện › Tổng quan ngành › Bản đồ ngành › 0.4; Dien/app/power-plant-map.js).

Đầu vào (data/power/plants/, đã lưu kèm repo để dựng lại không cần mạng):
- osm-vn.json      OpenStreetMap power=plant trong lãnh thổ Việt Nam (Overpass, ảnh chụp ngày ghi trong file): tọa độ, công suất
                   (plant:output:electricity), tên, đơn vị vận hành. Dùng cho thủy điện, mặt trời và phần không có trong các bảng dưới.
- thermal.json     Nhiệt điện than, khí nội địa, LNG, dầu (rà theo GEM wiki, EVN, MOIT, chủ đầu tư; mỗi dòng có nguồn).
- wind.json        Điện gió (rà theo GEM wiki, chủ đầu tư, báo chí; mỗi dòng có nguồn).
- ownership.json   Tài sản phát điện của doanh nghiệp niêm yết: tỷ lệ sở hữu, quan hệ (trực thuộc / công ty con / liên kết / gián tiếp), nguồn.
- provinces.json   Ranh giới 63 tỉnh trước sáp nhập 2025 (geoBoundaries VNM ADM1, public domain), đã rút gọn.

Miền: theo vùng phục vụ của 3 tổng công ty điện lực EVN (EVNNPC: Hà Tĩnh trở ra + Hà Nội; EVNCPC: Quảng Bình–Khánh Hòa + 4 tỉnh Tây Nguyên;
EVNSPC: phần còn lại), trùng cách chia 3 miền của NSMO. Tỉnh lấy theo bảng nguồn nếu có, không có thì theo vị trí điểm trong ranh giới tỉnh.
Không giả định: trường thiếu để null (giao diện hiện N/A). Một nhà máy chỉ có một dòng; nhiều mã cùng sở hữu thì ghi nhiều chủ sở hữu, không cộng trùng MW.

    python scripts/build_power_plants.py
"""
import json, math, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/power/plants'
OUT = ROOT / 'data/power-plants.json'
OUTJS = ROOT / 'data/power-plants.js'

NORTH = {'Hà Giang', 'Cao Bằng', 'Bắc Kạn', 'Lạng Sơn', 'Tuyên Quang', 'Thái Nguyên', 'Phú Thọ', 'Bắc Giang', 'Quảng Ninh', 'Lào Cai', 'Yên Bái', 'Điện Biên',
         'Lai Châu', 'Sơn La', 'Hòa Bình', 'Vĩnh Phúc', 'Bắc Ninh', 'Hưng Yên', 'Hải Dương', 'Hải Phòng', 'Thái Bình', 'Nam Định', 'Hà Nam', 'Ninh Bình',
         'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Hà Nội'}
CENTRAL = {'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông'}
ALIAS = {'Ho Chi Minh': 'TP. Hồ Chí Minh', 'Hồ Chí Minh': 'TP. Hồ Chí Minh', 'TP Hồ Chí Minh': 'TP. Hồ Chí Minh', 'Thành phố Hồ Chí Minh': 'TP. Hồ Chí Minh',
         'Bà Rịa–Vũng Tàu': 'Bà Rịa - Vũng Tàu', 'Bà Rịa-Vũng Tàu': 'Bà Rịa - Vũng Tàu', 'Côn Đảo': 'Bà Rịa - Vũng Tàu', 'Huế': 'Thừa Thiên Huế', 'Thừa Thiên - Huế': 'Thừa Thiên Huế',
         'Đăk Lăk': 'Đắk Lắk', 'Đắc Lắc': 'Đắk Lắk', 'Đăk Nông': 'Đắk Nông', 'Đắc Nông': 'Đắk Nông', 'Kontum': 'Kon Tum', 'Hoà Bình': 'Hòa Bình', 'Thanh Hoá': 'Thanh Hóa', 'Khánh Hoà': 'Khánh Hòa'}
TYPE = {'coal': 'coal', 'gas': 'gas', 'lng': 'lng', 'oil': 'oil', 'hydro': 'hydro', 'wind': 'wind', 'solar': 'solar', 'biomass': 'biomass', 'waste': 'waste', 'other': 'other'}
STATUS = {'operating': 'op', 'op': 'op', 'construction': 'con', 'con': 'con', 'planned': 'plan', 'plan': 'plan', 'approved': 'plan'}
EVN_RE = re.compile(r'\bEVN|GENCO|Tập đoàn Điện lực|Tổng công ty Phát điện|Electricity of Vietnam|Vietnam Electricity', re.I)


def fold(s):
    s = unicodedata.normalize('NFD', s or '').replace('đ', 'd').replace('Đ', 'D')
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()


ROMAN = {'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6'}
# Chỉ bỏ tiền tố loại hình ở đầu tên (không bỏ "điền" trong "Bình Điền") và vài từ chung tiếng Anh.
PREFIX = re.compile(r'^(?:(?:nha may|cong trinh|du an|cum|to hop|trung tam dien luc|tt dien luc|nmnd|nmtd|nmd)\s+)*'
                    r'(?:(?:nhiet dien|thuy dien|dien gio|dien mat troi|dien khi|dien sinh khoi|dien rac|dien|tbkhh|nhiet)\s+)?(?:(?:than|khi|lng|ngoai khoi|gan bo|nong|noi|tren mat nuoc)\s+)?')
STOP = {'power', 'plant', 'station', 'hydropower', 'hydroelectric', 'solar', 'wind', 'farm', 'coal', 'fired', 'gas', 'thermal', 'project', 'giai', 'doan', 'phase',
        'ctcp', 'jsc', 'the', 'and', 'va', 'tpp', 'hpp', 'ccgt', 'dam', 'mw', 'mwp'}


def tokens(name):
    f = fold(re.sub(r'\([^)]*\)', ' ', name or ''))
    f = re.sub(r'[^a-z0-9]+', ' ', f).strip()
    f = PREFIX.sub('', f)
    t = [ROMAN.get(x, x) for x in f.split()]
    return [x for x in t if x not in STOP]


def same(a, b):
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb: return False
    key = lambda t: [x for x in t if x.isdigit() or len(x) == 1] + (['mr'] if ' mo rong' in ' ' + ' '.join(t) or 'mr' in t else [])
    if key(ta) != key(tb): return False  # số tổ máy, hậu tố chữ cái (A, B), phần mở rộng phải khớp
    wa = [x for x in ta if not x.isdigit() and len(x) > 1 and x not in ('mo', 'rong', 'mr')]
    wb = [x for x in tb if not x.isdigit() and len(x) > 1 and x not in ('mo', 'rong', 'mr')]
    if not wa or not wb: return False
    if wa == wb: return True
    short, long_ = (wa, wb) if len(wa) <= len(wb) else (wb, wa)
    return len(short) >= 2 and (' ' + ' '.join(short) + ' ') in (' ' + ' '.join(long_) + ' ')


def base(name):
    return ' '.join(x for x in tokens(name) if not x.isdigit() and x not in ('mr', 'mo', 'rong', 'mrong'))


def km(a, b):
    if None in (a.get('lat'), a.get('lon'), b.get('lat'), b.get('lon')): return None
    p = math.pi / 180
    return 6371 * math.acos(min(1, math.sin(a['lat'] * p) * math.sin(b['lat'] * p) + math.cos(a['lat'] * p) * math.cos(b['lat'] * p) * math.cos((a['lon'] - b['lon']) * p)))


def pip(x, y, ring):
    inside, j = False, len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]; xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi: inside = not inside
        j = i
    return inside


def region(prov):
    p = ALIAS.get(prov, prov)
    return 'N' if p in NORTH else 'C' if p in CENTRAL else 'S' if p else None


LOG = None


def main():
    load = lambda n: json.loads((SRC / n).read_text(encoding='utf-8'))
    prov_fc = load('provinces.json')
    polys = [(f['properties']['name'], f['geometry']['coordinates'] if f['geometry']['type'] == 'MultiPolygon' else [f['geometry']['coordinates']]) for f in prov_fc['features']]

    def prov_at(lat, lon):
        if lat is None or lon is None: return None
        for name, mp in polys:
            if any(pip(lon, lat, poly[0]) for poly in mp): return ALIAS.get(name, name)
        best = min(((min(math.hypot(lon - x, lat - y) for poly in mp for x, y in poly[0]), name) for name, mp in polys))
        return ALIAS.get(best[1], best[1]) if best[0] < 0.08 else None

    def canon_prov(p):
        if not p: return None
        p = re.sub(r'^(tỉnh|thành phố|tp\.?)\s+', '', p.strip(), flags=re.I)
        p = ALIAS.get(p, p)
        names = {ALIAS.get(n, n) for n, _ in polys}
        if p in names: return p
        fp = fold(p)
        for n in names:
            if fold(n) == fp: return n
        return p

    plants = []

    def add(rec):
        plants.append(rec); return rec

    compat = lambda a, b: a == b or {a, b} <= {'gas', 'lng'}
    AGG = re.compile(r'áp mái|danh mục', re.I)

    def find(name, lat=None, lon=None, typ=None, mw=None):
        if AGG.search(name or ''): return None  # danh mục điện mặt trời áp mái: không phải một nhà máy
        cands = [p for p in plants if not p.get('agg') and (same(name, p['name']) or any(same(name, a) for a in p.get('aka', [])))]
        if typ: cands = [p for p in cands if compat(p['type'], typ)]
        if mw: cands = [p for p in cands if not p.get('mw') or abs(p['mw'] - mw) <= 0.4 * max(p['mw'], mw)]
        if lat is not None and cands:
            near = [p for p in cands if (km(p, {'lat': lat, 'lon': lon}) or 0) < 25]
            cands = near or ([] if all(km(p, {'lat': lat, 'lon': lon}) is not None for p in cands) else cands)
        return cands[0] if len(cands) >= 1 else None

    # 1. Nhiệt điện, LNG (bảng rà riêng) và điện gió.
    for fname, default in (('thermal.json', None), ('wind.json', 'wind')):
        for r in load(fname)['rows']:
            typ = TYPE.get((r.get('type') or default or '').lower())
            if not typ: continue
            st = STATUS.get((r.get('status') or '').lower())
            if not st: continue
            lat, lon = r.get('lat'), r.get('lon')
            prov = canon_prov(r.get('province')) or prov_at(lat, lon)
            src = [{'label': r.get('source_label') or re.sub(r'^https?://(www\.)?([^/]+).*$', r'\2', r.get('source_url') or ''), 'url': r.get('source_url')}] if r.get('source_url') else []
            if r.get('coord_source') and r.get('coord_source') != r.get('source_url'): src.append({'label': 'Tọa độ: ' + re.sub(r'^https?://(www\.)?([^/]+).*$', r'\2', r['coord_source']), 'url': r['coord_source']})
            add({'from': fname, 'name': r.get('name_vi') or r.get('name_en'), 'aka': [x for x in [r.get('name_en')] if x], 'type': typ, 'mw': r.get('mw'), 'lat': lat, 'lon': lon, 'prov': prov,
                 'status': st, 'cod': r.get('cod'), 'owner': r.get('owner'), 'operator': r.get('operator'), 'fuel': r.get('fuel'), 'ppa': r.get('ppa'), 'src': src,
                 'note': ' '.join(x for x in ['Trạng thái theo bảng EVN cập nhật 31/10/2024, chưa xác minh 2025–2026.' if fname == 'wind.json' and 'chưa xác minh' in (r.get('notes') or '') and st != 'op' else '',
                                              'Tọa độ gần đúng (cấp vùng/cụm).' if (r.get('coord_precision') or '').startswith(('approximate', 'site-level')) else '',
                                              'Dự án dự phòng trong QHĐ VIII điều chỉnh.' if 'dự phòng' in (r.get('notes') or '').lower() or 'reserve' in (r.get('notes') or '').lower() else ''] if x) or None,
                 'evn': bool(EVN_RE.search(r.get('owner') or '') or EVN_RE.search(r.get('operator') or ''))})

    # 2. OpenStreetMap: thủy điện, mặt trời, phần chưa có ở bước 1 (nhà máy có tên; thủy điện/mặt trời/gió từ 10 MW).
    osm = load('osm-vn.json')
    for r in osm['rows']:
        typ = TYPE.get((r.get('src') or '').split(';')[0])
        if not typ or not r.get('name'): continue
        if typ in ('hydro', 'solar', 'wind', 'biomass', 'waste') and (r.get('mw') or 0) < 10: continue
        hit = find(r['name'], r['lat'], r['lon'], typ)
        if not hit and typ == 'wind':
            near = [p for p in plants if p.get('from') == 'wind.json' and (km(p, r) if p.get('lat') is not None else 99) < 2]
            if near: continue  # trại gió trong bảng điện gió, cách dưới 2 km: cùng dự án (OSM đặt tên khác)
        if hit:
            if hit.get('lat') is None: hit['lat'], hit['lon'] = r['lat'], r['lon']; hit['src'].append({'label': 'Tọa độ: OpenStreetMap', 'url': 'https://www.openstreetmap.org/' + r['id']})
            continue
        if typ in ('coal', 'gas', 'oil') and (r.get('mw') or 0) < 30: continue
        b = base(r['name'])
        if b and any(base(p['name']) == b and (km(p, r) is None or km(p, r) < 15) and compat(p['type'], typ) for p in plants):
            continue  # cụm đã được liệt kê theo từng tổ máy ở bảng nhiệt điện
        add({'name': re.sub(r'^Nhà máy\s+', '', r['name']).strip(), 'aka': [x for x in [r.get('name_en')] if x], 'type': typ, 'mw': r.get('mw'), 'lat': r['lat'], 'lon': r['lon'],
             'prov': prov_at(r['lat'], r['lon']), 'status': 'con' if r.get('construction') else 'op', 'cod': (r.get('start') or '')[:4] or None,
             'owner': r.get('owner'), 'operator': r.get('operator'), 'fuel': None, 'ppa': None, 'src': [{'label': 'OpenStreetMap', 'url': 'https://www.openstreetmap.org/' + r['id']}],
             'evn': bool(EVN_RE.search(r.get('owner') or '') or EVN_RE.search(r.get('operator') or ''))})

    # 3. Sở hữu của doanh nghiệp niêm yết.
    own = load('ownership.json'); unmatched = []
    for r in own['rows']:
        typ = TYPE.get((r.get('type') or '').lower()) or 'other'
        st = STATUS.get((r.get('status') or '').lower()) or 'op'
        p = find(r['plant_vi'], typ=typ, mw=r.get('mw') if isinstance(r.get('mw'), (int, float)) else None)
        if p and LOG is not None: LOG.append((r['ticker'], r['plant_vi'], p['name'], p.get('mw'), r.get('mw')))
        targets = [p] if p else []
        if not p:
            # Tổ máy lẻ gắn vào cụm có số bao trùm (Cà Mau 2 → Cà Mau 1&2); dòng không số gắn vào mọi tổ máy cùng tên gốc (REE nắm Phả Lại → Phả Lại 1, 2).
            b, rd = base(r['plant_vi']), [x for x in tokens(r['plant_vi']) if x.isdigit()]
            grp = [] if AGG.search(r['plant_vi']) else [q for q in plants if b and not q.get('agg') and base(q['name']) == b and compat(q['type'], typ)]
            sup = [q for q in grp if rd and set(rd) <= {x for x in tokens(q['name']) if x.isdigit()}]
            targets = sup[:1] if sup else (grp if not rd else [])
            p = targets[0] if targets else None
        for p2 in targets[1:]:
            o2 = {'t': r['ticker'], 'pct': r.get('stake_pct'), 'rel': r.get('relation') or None, 'via': r.get('via')}
            if not any(x['t'] == o2['t'] for x in p2.setdefault('owners', [])): p2['owners'].append(o2)
            if r.get('source_url'): p2['src'].append({'label': r['ticker'] + ': ' + re.sub(r'^https?://(www\.)?([^/]+).*$', r'', r['source_url']), 'url': r['source_url']})
        if not p:
            p = add({'agg': bool(AGG.search(r['plant_vi'])), 'name': r['plant_vi'], 'aka': [], 'type': typ, 'mw': r.get('mw'), 'lat': None, 'lon': None, 'prov': canon_prov(r.get('province')), 'status': st, 'cod': r.get('cod'),
                     'owner': r.get('via') or None, 'operator': None, 'fuel': r.get('fuel_or_basin'), 'ppa': r.get('ppa'), 'src': [], 'evn': False})
            unmatched.append(r['plant_vi'])
        o = {'t': r['ticker'], 'pct': r.get('stake_pct'), 'rel': r.get('relation') or None, 'via': r.get('via')}
        if r.get('source_url'): p['src'].append({'label': r['ticker'] + ': ' + re.sub(r'^https?://(www\.)?([^/]+).*$', r'\2', r['source_url']), 'url': r['source_url']})
        if not any(x['t'] == o['t'] for x in p.setdefault('owners', [])): p['owners'].append(o)
        for k, v in (('mw', r.get('mw')), ('cod', r.get('cod')), ('fuel', r.get('fuel_or_basin')), ('ppa', r.get('ppa')), ('prov', canon_prov(r.get('province')))):
            if p.get(k) in (None, '') and v not in (None, ''): p[k] = v
        if r['ticker'] == 'PGV': p['evn'] = True

    # 3a. Dòng sở hữu chưa có tọa độ: tìm trong toàn bộ OSM (kể cả nhà máy dưới 10 MW đã lọc ở bước 2), cùng loại nguồn.
    for u in [p for p in plants if p.get('lat') is None and p.get('owners') and not p.get('agg')]:
        hit = [r for r in osm['rows'] if r.get('name') and same(u['name'], r['name']) and (TYPE.get((r.get('src') or '').split(';')[0]) == u['type'])]
        if len(hit) == 1:
            r = hit[0]; u['lat'], u['lon'] = r['lat'], r['lon']
            if u.get('mw') is None and r.get('mw'): u['mw'] = r['mw']
            u['src'].append({'label': 'Tọa độ: OpenStreetMap', 'url': 'https://www.openstreetmap.org/' + r['id']})

    # 3b. Tổ máy chỉ có ở bảng sở hữu: lấy tọa độ cụm OSM cùng tên gốc (cùng loại nguồn, cùng tỉnh nếu biết); cụm không có chủ sở hữu
    #     và các tổ máy phủ ≥ 80% công suất cụm thì bỏ cụm để không cộng trùng.
    drop = set()
    for u in [p for p in plants if p.get('lat') is None]:
        b = base(u['name'])
        if not b: continue
        if u.get('agg'): continue
        hosts = [p for p in plants if p is not u and p.get('lat') is not None and base(p['name']) == b and compat(p['type'], u['type'])
                 and (not u.get('prov') or not p.get('prov') or canon_prov(p['prov']) == canon_prov(u['prov']) or True)]
        if len(hosts) != 1: continue
        h = hosts[0]
        u['lat'], u['lon'] = h['lat'], h['lon']; u['prov'] = u.get('prov') or h.get('prov')
        u['src'].append({'label': 'Tọa độ: vị trí cụm ' + h['name'] + ' (' + (h['src'][0]['label'] if h['src'] else 'OSM') + ')', 'url': h['src'][0]['url'] if h['src'] else None})
        units = [p for p in plants if p.get('lat') == h['lat'] and p.get('lon') == h['lon'] and p is not h]
        if not h.get('owners') and h.get('mw') and sum(p.get('mw') or 0 for p in units) >= 0.8 * h['mw']: drop.add(id(h))
    plants[:] = [p for p in plants if id(p) not in drop]

    # 3c. Sửa tay sau rà soát (overrides.json): gộp dòng trùng, tọa độ tra thêm, sửa tọa độ/tỉnh/MW sai.
    def pick(n):
        ex = [p for p in plants if fold(p['name']) == fold(n)]
        return ex if ex else [p for p in plants if same(n, p['name'])]
    miss = []
    for o in (load('overrides.json')['rows'] if (SRC / 'overrides.json').exists() else []):
        hit = pick(o['name'])
        if len(hit) != 1: miss.append((o['name'], len(hit))); continue
        p = hit[0]
        if o.get('spread_to'):
            tgs = [pick(n) for n in o['spread_to']]
            if not all(len(t) == 1 for t in tgs): miss.append(('spread→' + str(o['spread_to']), [len(t) for t in tgs])); continue
            for (t,) in tgs:
                for ow in p.get('owners', []):
                    if not any(x['t'] == ow['t'] for x in t.setdefault('owners', [])): t['owners'].append(dict(ow))
                t['src'] += [x for x in p['src'] if x not in t['src']]
            plants.remove(p); continue
        if o.get('dup_of'):
            tg = pick(o['dup_of'])
            if len(tg) != 1 or tg[0] is p: miss.append(('dup→' + o['dup_of'], len(tg))); continue
            t = tg[0]
            for ow in p.get('owners', []):
                if not any(x['t'] == ow['t'] for x in t.setdefault('owners', [])): t['owners'].append(ow)
            t['src'] += [x for x in p['src'] if x not in t['src']]
            plants.remove(p); continue
        for k, v in (o.get('set') or {}).items(): p[k] = v
        if o.get('src'): p['src'].append({'label': 'Tọa độ: ' + re.sub(r'^https?://(www\.)?([^/]+).*$', r'', o['src']), 'url': o['src']})
        if o.get('note'): p['note'] = ' '.join(x for x in [p.get('note'), o['note']] if x)
    if miss: print('overrides not applied:', miss)

    # 4. Hoàn thiện: miền, mã định danh, bỏ trường trống.
    out, seen = [], set()
    for i, p in enumerate(plants):
        p['prov'] = canon_prov(p.get('prov')) or prov_at(p.get('lat'), p.get('lon'))
        p['region'] = region(p['prov']) if p.get('prov') else None
        if p.get('lat') is not None: p['lat'], p['lon'] = round(p['lat'], 4), round(p['lon'], 4)
        if isinstance(p.get('mw'), str):
            m = re.search(r'[\d.]+', p['mw'].replace(',', '.')); p['mw'] = float(m.group()) if m else None
        p['cod'] = str(p['cod']) if p.get('cod') not in (None, '') else None
        sid = re.sub(r'[^a-z0-9]+', '-', fold(p['name'])).strip('-')[:48] + '-' + p['type']
        n = 2
        while sid in seen: sid = sid.rsplit('~', 1)[0] + '~' + str(n); n += 1
        seen.add(sid); p['id'] = sid
        p.pop('aka', None); p.pop('from', None)
        out.append({k: v for k, v in p.items() if v not in (None, '', [], False) or k in ('lat', 'lon', 'mw')})

    regions = {'type': 'FeatureCollection', 'features': [{'type': 'Feature', 'properties': {'r': region(ALIAS.get(n, n))}, 'geometry': {'type': 'MultiPolygon', 'coordinates': mp}} for n, mp in polys]}
    data = {'meta': {'checked_at': own.get('checked_at'), 'built_from': ['data/power/plants/' + n for n in ('osm-vn.json', 'thermal.json', 'wind.json', 'ownership.json', 'provinces.json')],
                     'source_note': 'OpenStreetMap (tọa độ, công suất thủy điện, mặt trời), Global Energy Monitor, EVN, MOIT, BCTN/BCTC doanh nghiệp, báo chí; ranh giới tỉnh: geoBoundaries; nền: Natural Earth.',
                     'region_rule': 'Miền theo vùng phục vụ của 3 tổng công ty điện lực EVN (ranh giới 63 tỉnh trước sáp nhập 2025).'},
            'tickers': {t: {k: v.get(k) for k in ('exchange', 'name', 'listed')} for t, v in own.get('tickers', {}).items()}, 'plants': out, 'regions': regions}
    # Bản .json để đọc, đối chiếu: không kèm đa giác tỉnh (chỉ nằm trong bản .js mà trang nạp).
    OUT.write_text(json.dumps({k: v for k, v in data.items() if k != 'regions'}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    OUTJS.write_text('/* Sinh bởi scripts/build_power_plants.py — không sửa tay. */\nwindow.POWER_PLANTS = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    import collections
    print(len(out), 'plants;', collections.Counter(p['type'] for p in out), collections.Counter(p['status'] for p in out), collections.Counter(p.get('region') for p in out))
    print('no coords:', sum(1 for p in out if p.get('lat') is None), '| ownership rows not matched to a mapped plant:', len(unmatched), unmatched[:40])
    print('size', OUTJS.stat().st_size)


if __name__ == '__main__':
    main()
