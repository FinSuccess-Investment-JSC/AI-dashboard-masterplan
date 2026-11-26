#!/usr/bin/env python3
"""Dựng Phan-bon/app/gas-base.js (window.GAS_BASE): nền GeoJSON cho bản đồ hệ thống cung cấp khí (Bức tranh ngành › 04 Nguồn khí).

Nguồn: Natural Earth 1:10m Admin 0 (public domain) qua gói npm world-atlas@2.0.2 (TopoJSON countries-10m.json).
- Lấy Việt Nam và các nước quanh Biển Đông, bỏ đa giác nằm ngoài khung lon 100–121, lat 3–26; điểm ngoài khung được kẹp vào mép khung
  (phần kẹp nằm ngoài vùng xem tối đa của bản đồ).
- Thể hiện chủ quyền: quần đảo Hoàng Sa (Natural Earth gán vào Trung Quốc) và Trường Sa (Natural Earth để đơn vị riêng "Spratly Is.")
  được tách ra, đặt thuộc Việt Nam (role 'vn-isl'). Bãi cạn Scarborough không thuộc phạm vi, bỏ.
- Rút gọn: bỏ điểm cách điểm trước dưới 0,008° (~0,9 km).

    python scripts/build_gas_basemap.py
"""
import json, math, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json'
OUT = ROOT / 'Phan-bon/app/gas-base.js'
BOX = (100.0, 3.0, 121.0, 26.0)
KEEP = {'704': ('VN', 'Việt Nam'), '156': ('CN', 'Trung Quốc'), '418': ('LA', 'Lào'), '116': ('KH', 'Campuchia'), '764': ('TH', 'Thái Lan'),
        '458': ('MY', 'Malaysia'), '360': ('ID', 'Indonesia'), '096': ('BN', 'Brunei'), '608': ('PH', 'Philippines'), '158': ('TW', 'Đài Loan'),
        '104': ('MM', 'Myanmar'), '344': ('HK', 'Hồng Kông'), '446': ('MO', 'Ma Cao')}
PARACEL = (110.9, 15.6, 113.0, 17.3)  # khung chứa các đảo Hoàng Sa
MIN = 0.008


def main(src=None):
    raw = Path(src).read_bytes() if src else subprocess.run(['curl', '-sfL', '-m', '120', URL], check=True, capture_output=True).stdout
    d = json.loads(raw)
    sx, sy = d['transform']['scale']; tx, ty = d['transform']['translate']
    arcs = []
    for a in d['arcs']:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(ids):
        out = []
        for i in ids:
            pts = arcs[i] if i >= 0 else arcs[~i][::-1]
            out += pts if not out else pts[1:]
        return out

    def polys(g):
        return [[ring(r) for r in g['arcs']]] if g['type'] == 'Polygon' else [[ring(r) for r in p] for p in g['arcs']]

    def inside(p, b):
        return b[0] <= p[0] <= b[2] and b[1] <= p[1] <= b[3]

    def clean(r):
        r = [(min(max(x, BOX[0]), BOX[2]), min(max(y, BOX[1]), BOX[3])) for x, y in r]
        keep = [r[0]]
        for p in r[1:]:
            if math.hypot(p[0] - keep[-1][0], p[1] - keep[-1][1]) >= MIN: keep.append(p)
        if keep[0] != keep[-1]: keep.append(keep[0])
        return [[round(x, 3), round(y, 3)] for x, y in keep] if len(keep) >= 4 else None

    feats, paracel, spratly = [], [], []
    for g in d['objects']['countries']['geometries']:
        if 'arcs' not in g: continue
        name = g['properties'].get('name')
        if name == 'Spratly Is.':
            spratly += polys(g); continue
        if g.get('id') not in KEEP: continue
        code, vn = KEEP[g['id']]
        out = []
        for poly in polys(g):
            outer = poly[0]
            if not any(inside(p, BOX) for p in outer): continue
            if code == 'CN' and all(inside(p, PARACEL) for p in outer):
                paracel.append(poly); continue
            rr = [c for c in (clean(r) for r in poly) if c]
            if rr: out.append(rr)
        if out:
            feats.append({'type': 'Feature', 'properties': {'id': code, 'name': vn, 'role': 'vn' if code == 'VN' else 'nb'},
                          'geometry': {'type': 'MultiPolygon', 'coordinates': out}})
    for nm, ps in (('Quần đảo Hoàng Sa (Việt Nam)', paracel), ('Quần đảo Trường Sa (Việt Nam)', spratly)):
        rr = [[c for c in (clean(r) for r in p) if c] for p in ps]
        rr = [p for p in rr if p]
        if rr:
            feats.append({'type': 'Feature', 'properties': {'id': 'VN-ISL', 'name': nm, 'role': 'vn-isl'}, 'geometry': {'type': 'MultiPolygon', 'coordinates': rr}})
    fc = {'type': 'FeatureCollection', 'source': 'Natural Earth 1:10m Admin 0 (public domain) qua world-atlas@2.0.2; Hoàng Sa, Trường Sa thể hiện thuộc Việt Nam',
          'features': feats}
    OUT.write_text('/* Sinh bởi scripts/build_gas_basemap.py — không sửa tay. */\nwindow.GAS_BASE = ' + json.dumps(fc, ensure_ascii=False, separators=(',', ':')) + ';\n',
                   encoding='utf-8', newline='\n')
    print(OUT, OUT.stat().st_size, len(paracel), len(spratly), [f['properties']['id'] for f in feats])


if __name__ == '__main__':
    import sys
    main(sys.argv[1] if len(sys.argv) > 1 else None)
