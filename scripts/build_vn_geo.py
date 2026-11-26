#!/usr/bin/env python3
"""Dựng Phan-bon/app/vn-geo.js (window.VN_GEO): đường viền Việt Nam + Trung Quốc, Lào, Campuchia, Thái Lan (cắt theo khung)
cho bản đồ nhà máy phân bón. Nguồn: Natural Earth 1:50m (public domain) qua gói npm world-atlas@2.0.2 (TopoJSON).
Chiếu equirectangular, trục kinh độ nhân cos(16°); khung lon 101,8–117,4, lat 6,6–23,5 (gồm Hoàng Sa, Trường Sa).

    python scripts/build_vn_geo.py
"""
import json, math, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json'
OUT = ROOT / 'Phan-bon/app/vn-geo.js'
LON0, LON1, LAT0, LAT1 = 101.8, 117.4, 6.6, 23.5
W = 600


def main():
    d = json.loads(subprocess.run(['curl', '-sfL', '-m', '60', URL], check=True, capture_output=True).stdout)
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

    k = math.cos(math.radians(16)); scale = W / ((LON1 - LON0) * k); H = round((LAT1 - LAT0) * scale)
    P = lambda lo, la: ((lo - LON0) * k * scale, (LAT1 - la) * scale)

    def path(g, minlen=0.6, clamp=False):
        s = []
        for poly in polys(g):
            for r in poly:
                pts = [P(*p) for p in r]
                if clamp:
                    if all(x < -10 or x > W + 10 or y < -10 or y > H + 10 for x, y in pts):
                        continue
                    pts = [(min(max(x, -10), W + 10), min(max(y, -10), H + 10)) for x, y in pts]
                keep = pts[:1]
                for p in pts[1:]:
                    if math.hypot(p[0] - keep[-1][0], p[1] - keep[-1][1]) >= minlen:
                        keep.append(p)
                if len(keep) >= 3:
                    s.append('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in keep) + 'Z')
        return ''.join(s)

    G = {x.get('id'): x for x in d['objects']['countries']['geometries']}
    out = {'viewBox': f'0 0 {W} {H}', 'proj': {'lon0': LON0, 'lat1': LAT1, 'k': k, 'scale': scale},
           'source': 'Natural Earth 1:50m (public domain) qua world-atlas@2.0.2',
           'vn': path(G['704']), 'nb': {c: path(G[i], 1.2, True) for c, i in (('CN', '156'), ('LA', '418'), ('KH', '116'), ('TH', '764'))}}
    OUT.write_text('/* Đường viền Việt Nam và nước láng giềng cho bản đồ nhà máy phân bón. Nguồn: ' + out['source']
                   + '; chiếu equirectangular hệ số cos(16°). Dựng bằng scripts/build_vn_geo.py. */\nwindow.VN_GEO = '
                   + json.dumps(out, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), H)


if __name__ == '__main__':
    main()
