#!/usr/bin/env python3
"""Dựng data/steel-capacity.js (window.STEEL_CAP) cho bản đồ năng lực sản xuất thép (Thép › Tổng quan › Bản đồ ngành).

Nguồn: data/steel/capacity/plants.json (nhập tay, nguồn từng dòng). Quy trình mỗi lần chạy:
  1. Đọc bản nhập tay; nếu có --gem-csv thì ghép bản GEM mới theo gem_plant_id (chỉ ghi đè khi giá trị mới khác null).
  2. Kiểm tra (dừng, không ghi gì nếu có lỗi): id trùng, tên trùng sau khi bỏ dấu, tọa độ ngoài khung Việt Nam, trạng thái/công nghệ/
     vùng/nhóm sở hữu ngoài danh mục, công suất âm hoặc 0 thay cho null, thành phần công nghệ lớn hơn tổng danh nghĩa, công suất luyện
     gang bị cộng vào thép thô, dự án trỏ tới nhà máy không có, nguồn không khai báo, nhà máy luyện thép không có nguồn.
  3. So với bản dựng trước (data/steel-capacity.json) theo plant_id/project_id: ghi thay đổi công suất, công nghệ, trạng thái, chủ sở hữu
     vào data/steel/capacity/changelog.json; giữ bản cũ ở data/steel/capacity/snapshots/<ngày>.json.
  4. Ghi data/steel-capacity.json và .js.

    python -X utf8 scripts/build_steel_capacity.py [--gem-csv đường_dẫn.csv] [--check]
"""
import argparse, csv, datetime as dt, json, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/steel/capacity/plants.json'
OUT_JSON, OUT_JS = ROOT / 'data/steel-capacity.json', ROOT / 'data/steel-capacity.js'
LOG, SNAP = ROOT / 'data/steel/capacity/changelog.json', ROOT / 'data/steel/capacity/snapshots'
STATUS = {'operating', 'construction', 'preparing', 'announced', 'stalled', 'idle', 'mothballed', 'retired', 'cancelled'}
TECH = {'BF-BOF', 'EAF', 'IF', 'DRI-EAF', 'Rolling', 'Other'}
REGION, OWNG = {'N', 'C', 'S'}, {'listed', 'unlisted', 'fdi', 'jv'}
PRODUCTS = {'hrc', 'rebar', 'section', 'crc', 'coated', 'pipe'}
CAP_KEYS = ('nominal_crude_steel_mtpa', 'bof_mtpa', 'eaf_mtpa', 'if_mtpa', 'dri_mtpa', 'crude_iron_mtpa', 'company_reported_capacity_mtpa', 'under_construction_mtpa')
VN_BOX = (8.0, 102.0, 23.5, 110.0)  # lat_min, lon_min, lat_max, lon_max (đất liền)


def fold(s):
    s = unicodedata.normalize('NFD', s or '').replace('đ', 'd').replace('Đ', 'D')
    return ''.join(c for c in s if not unicodedata.combining(c)).lower().replace('–', '-').strip()


def num_ok(v):
    return v is None or (isinstance(v, (int, float)) and v > 0)


def validate(d):
    err, src = [], set(d.get('sources', {}))
    ids, names = set(), {}
    for p in d['plants']:
        i = p.get('plant_id'); where = f'plant {i}'
        if not i or i in ids: err.append(f'{where}: plant_id trống hoặc trùng')
        ids.add(i)
        n = fold(p.get('plant_name'))
        if n in names: err.append(f'{where}: trùng tên với {names[n]}')
        names[n] = i
        for k in [p.get('plant_name_en')] + p.get('aliases', []):
            if k and fold(k) in names and names[fold(k)] != i: err.append(f'{where}: tên khác "{k}" trùng nhà máy {names[fold(k)]}')
        la, lo = p.get('latitude'), p.get('longitude')
        # Nhà máy luyện thép bắt buộc có tọa độ; nhà máy cán chưa xác minh vị trí để null cả hai (không đặt theo tâm tỉnh), không vẽ trên bản đồ.
        if (la is None) != (lo is None) or (la is None and p.get('steelmaking')) or (la is not None and not (VN_BOX[0] <= la <= VN_BOX[2] and VN_BOX[1] <= lo <= VN_BOX[3])):
            err.append(f'{where}: tọa độ ngoài Việt Nam hoặc thiếu ({la}, {lo}) — nhớ thứ tự lat, lon')
        if p.get('status') not in STATUS: err.append(f'{where}: trạng thái lạ {p.get("status")}')
        if p.get('region') not in REGION and not (p.get('region') is None and not p.get('steelmaking')): err.append(f'{where}: vùng lạ {p.get("region")}')
        if p.get('ownership_group') not in OWNG: err.append(f'{where}: nhóm sở hữu lạ {p.get("ownership_group")}')
        if any(t not in TECH for t in p.get('technology', [])): err.append(f'{where}: công nghệ lạ {p.get("technology")}')
        c = p.get('capacity', {})
        for k in CAP_KEYS:
            if not num_ok(c.get(k)): err.append(f'{where}: {k} = {c.get(k)!r} (dùng null cho số thiếu, không dùng 0)')
        parts = [c.get(k) for k in ('bof_mtpa', 'eaf_mtpa', 'if_mtpa', 'dri_mtpa') if c.get(k) is not None]
        nom = c.get('nominal_crude_steel_mtpa')
        if nom is not None and parts and abs(sum(parts) - nom) > 0.011: err.append(f'{where}: tổng thành phần {sum(parts)} ≠ danh nghĩa {nom} (không cộng trùng cấp lò và cấp nhà máy)')
        if nom is not None and c.get('crude_iron_mtpa') is not None and abs(nom - c['crude_iron_mtpa'] - sum(parts or [0])) < 1e-9 and parts:
            err.append(f'{where}: công suất thép thô có vẻ đã cộng luyện gang')
        if p.get('steelmaking') and not p.get('sources'): err.append(f'{where}: thiếu nguồn')
        for g, v in (p.get('product_capacity') or {}).items():
            if g not in PRODUCTS: err.append(f'{where}: nhóm sản phẩm lạ {g}')
            if not num_ok((v or {}).get('mtpa')): err.append(f'{where}: product_capacity.{g} phải > 0 hoặc null')
            for s in (v or {}).get('sources', []):
                if s not in src: err.append(f'{where}: nguồn {s} chưa khai báo')
        if p.get('utilization_rate') is not None and p.get('actual_production_mtpa') is None: err.append(f'{where}: có hiệu suất mà không có sản lượng')
        for s in p.get('sources', []):
            if s not in src: err.append(f'{where}: nguồn {s} chưa khai báo')
    jids = set()
    for j in d.get('projects', []):
        i = j.get('project_id'); where = f'project {i}'
        if not i or i in jids or i in ids: err.append(f'{where}: project_id trống hoặc trùng')
        jids.add(i)
        if j.get('plant_id') and j['plant_id'] not in ids: err.append(f'{where}: plant_id {j["plant_id"]} không có')
        if j.get('status') not in STATUS - {'operating'}: err.append(f'{where}: dự án không được ở trạng thái {j.get("status")} (công suất dự kiến tách khỏi vận hành)')
        if not num_ok(j.get('added_crude_mtpa')): err.append(f'{where}: added_crude_mtpa phải > 0 hoặc null')
        ap = j.get('added_product')
        if ap and (ap.get('group') not in PRODUCTS or not num_ok(ap.get('mtpa'))): err.append(f'{where}: added_product sai')
        la, lo = j.get('latitude'), j.get('longitude')
        if (la is None) != (lo is None) or (la is not None and not (VN_BOX[0] <= la <= VN_BOX[2] and VN_BOX[1] <= lo <= VN_BOX[3])): err.append(f'{where}: tọa độ ngoài Việt Nam hoặc thiếu một nửa')
        if j.get('cod_year') is not None and not j.get('cod_source'): err.append(f'{where}: có năm vận hành mà không có nguồn (không tự suy COD)')
        for s in j.get('sources', []):
            if s not in src: err.append(f'{where}: nguồn {s} chưa khai báo')
    return err


def merge_gem(d, path):
    """Ghép bản GEM mới (CSV xuất từ sheet Plant-level). Cột cần: GEM Plant ID, Nominal crude steel capacity (ttpa), Nominal BOF/EAF/DRI
    steel capacity (ttpa), Nominal iron capacity (ttpa), Capacity operating status, Latitude, Longitude. Không ghi đè số có sẵn bằng ô trống."""
    by = {p.get('gem_plant_id'): p for p in d['plants'] if p.get('gem_plant_id')}
    cols = {'Nominal crude steel capacity (ttpa)': 'nominal_crude_steel_mtpa', 'Nominal BOF steel capacity (ttpa)': 'bof_mtpa',
            'Nominal EAF steel capacity (ttpa)': 'eaf_mtpa', 'Nominal DRI capacity (ttpa)': 'dri_mtpa', 'Nominal iron capacity (ttpa)': 'crude_iron_mtpa'}
    changed = []
    with open(path, encoding='utf-8-sig', newline='') as f:
        for r in csv.DictReader(f):
            p = by.get(r.get('GEM Plant ID'))
            if not p: continue
            for col, key in cols.items():
                raw = (r.get(col) or '').replace(',', '').strip()
                if not raw or raw.lower() in {'n/a', 'unknown', '>0'}: continue  # ô trống: giữ số cũ
                v = round(float(raw) / 1000, 3)
                if p['capacity'].get(key) != v: changed.append((p['plant_id'], key, p['capacity'].get(key), v)); p['capacity'][key] = v
    return changed


def diff(old, new):
    out, keys = [], ('status', 'technology', 'capacity', 'owners', 'added_crude_mtpa', 'added_product', 'cod_year')
    for kind, idk in (('plants', 'plant_id'), ('projects', 'project_id')):
        o = {x[idk]: x for x in old.get(kind, [])}; n = {x[idk]: x for x in new.get(kind, [])}
        for i in sorted(set(o) | set(n)):
            if i not in o: out.append({'id': i, 'change': 'thêm mới'}); continue
            if i not in n: out.append({'id': i, 'change': 'bị bỏ'}); continue
            for k in keys:
                if o[i].get(k) != n[i].get(k): out.append({'id': i, 'field': k, 'from': o[i].get(k), 'to': n[i].get(k)})
    return out


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--gem-csv'); ap.add_argument('--check', action='store_true', help='chỉ kiểm tra, không ghi')
    a = ap.parse_args()
    d = json.loads(SRC.read_text(encoding='utf-8'))
    merged = merge_gem(d, a.gem_csv) if a.gem_csv else []
    err = validate(d)
    if err: raise SystemExit('Dữ liệu chưa đạt, không ghi:\n- ' + '\n- '.join(err))
    if a.check: print(f'OK: {len(d["plants"])} nhà máy, {len(d.get("projects", []))} dự án'); return
    today = dt.date.today().isoformat()
    old = json.loads(OUT_JSON.read_text(encoding='utf-8')) if OUT_JSON.exists() else {}
    ch = diff(old, d)
    if old and ch:
        SNAP.mkdir(parents=True, exist_ok=True)
        (SNAP / f'{old.get("meta", {}).get("built_at", today)[:10]}.json').write_text(json.dumps(old, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    if ch or merged:
        log = json.loads(LOG.read_text(encoding='utf-8')) if LOG.exists() else []
        log.append({'date': today, 'gem_merge': [list(x) for x in merged], 'changes': ch})
        LOG.write_text(json.dumps(log, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    d['meta']['built_at'] = today
    txt = json.dumps(d, ensure_ascii=False, separators=(',', ':'))
    OUT_JSON.write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('/* Sinh bởi scripts/build_steel_capacity.py — không sửa tay. */\nwindow.STEEL_CAP = ' + txt + ';\n', encoding='utf-8', newline='\n')
    print(f'Ghi {OUT_JS.relative_to(ROOT)}: {len(d["plants"])} nhà máy, {len(d.get("projects", []))} dự án, {len(ch)} thay đổi')


if __name__ == '__main__':
    main()
