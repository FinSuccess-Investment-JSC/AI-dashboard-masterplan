#!/usr/bin/env python3
"""Giá heo hơi theo ngày: ba miền + từng tỉnh (nguồn chính) và giá ba miền nguồn đối chiếu → data/raw/public/hog-prices.json.

Nguồn chính: Báo Hà Tĩnh – công cụ "Giá lợn hôm nay" (https://baohatinh.vn/cong-cu/gia-lon-hom-nay)
  · trang chính: bảng "Lịch sử giá lợn hơi 30 ngày" của 3 miền + bảng giá hôm nay theo tỉnh (nhóm theo miền);
  · trang từng tỉnh (/cong-cu/gia-lon-hom-nay/<slug>): lịch sử 30 ngày của tỉnh.
  "Bình quân miền" do nguồn công bố; kiểm 26/11/2026 = bình quân không trọng số các tỉnh của miền trên trang chính.
Nguồn đối chiếu: Tạp chí Chăn nuôi Việt Nam (nhachannuoi.vn) – ô "Giá heo thịt hơi miền Bắc/Trung/Nam" trên trang chủ.

Kho lưu nối tiếp: mỗi lần chạy thêm ngày mới; ngày đã có mà nguồn đổi giá → ghi vào revisions (giữ giá cũ, giá mới, ngày thấy).
Chạy lại với cùng dữ liệu gốc cho cùng kết quả (chỉ đổi checks[-1] khi kiểm). Nguồn lỗi → giữ số cũ, ghi lỗi vào checks.
"""
import html
import json
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/hog-prices.json'
BASE = 'https://baohatinh.vn/cong-cu/gia-lon-hom-nay'
REF_URL = 'https://nhachannuoi.vn/'
UA = {'User-Agent': 'Mozilla/5.0 (compatible; FinSuccess-dashboard/1.0)'}
VN = timezone(timedelta(hours=7))
REGIONS = {'bac': 'Miền Bắc', 'trung': 'Miền Trung', 'nam': 'Miền Nam'}
# Tỉnh nguồn có trang riêng nhưng không nằm trong bảng chính → miền gán tay theo vị trí địa lý (tên tỉnh theo nguồn,
# là đơn vị hành chính trước sáp nhập 01/07/2025: Bắc Giang → Bắc Ninh, Bình Định → Gia Lai, Bình Dương → TP.HCM,
# Long An → Tây Ninh, Tiền Giang → Đồng Tháp).
EXTRA_REGION = {'bac-giang': 'bac', 'binh-dinh': 'trung', 'binh-duong': 'nam', 'long-an': 'nam', 'tien-giang': 'nam'}
LEGACY = {'bac-giang': 'Bắc Ninh', 'binh-dinh': 'Gia Lai', 'binh-duong': 'TP. Hồ Chí Minh', 'long-an': 'Tây Ninh', 'tien-giang': 'Đồng Tháp'}


def get(url):
    r = requests.get(url, headers=UA, timeout=40)
    r.raise_for_status()
    r.encoding = 'utf-8'
    return r.text


def cells(row):
    return [html.unescape(re.sub(r'<.*?>', '', c)).strip() for c in re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', row, re.S)]


def tables(page):
    return [[cells(r) for r in re.findall(r'<tr.*?</tr>', t, re.S)] for t in re.findall(r'<table.*?</table>', page, re.S)]


def vnd(text):
    t = text.replace('.', '').replace(',', '').strip()
    return int(t) if t.isdigit() else None


def iso(dmy):
    d, m, y = dmy.split('/')
    return f'{y}-{m}-{d}'


def parse_main(page):
    regions, members, today = {k: {} for k in REGIONS}, {}, None
    cur = None
    for tb in tables(page):
        head = tb[0] if tb else []
        if head[:1] == ['Ngày'] and len(head) >= 4:          # lịch sử 30 ngày 3 miền
            for r in tb[1:]:
                if len(r) >= 4 and re.fullmatch(r'\d{2}/\d{2}/\d{4}', r[0]):
                    for k, v in zip(REGIONS, r[1:4]):
                        if vnd(v): regions[k][iso(r[0])] = vnd(v)
        elif head[:1] == ['Tỉnh / Vùng']:                   # bảng hôm nay theo tỉnh, nhóm theo miền
            for r in tb[1:]:
                if not r: continue
                name = re.sub(r'^[^\wÀ-ỹ]+', '', r[0]).strip()
                m = re.match(r'Bình quân miền (Bắc|Trung|Nam)', name)
                if m: cur = {'Bắc': 'bac', 'Trung': 'trung', 'Nam': 'nam'}[m.group(1)]; continue
                if cur: members[name] = cur
    h1 = re.search(r'Giá lợn hơi hôm nay (\d{2}/\d{2}/\d{4})', page)
    if h1: today = iso(h1.group(1))
    slugs = sorted(set(re.findall(r'href="https://baohatinh\.vn/cong-cu/gia-lon-hom-nay/([a-z0-9-]+)"', page)))
    return regions, members, slugs, today


def parse_province(page):
    name = re.search(r'Giá lợn hơi (.+?) hôm nay', re.sub(r'<.*?>', '', (re.search(r'<h1[^>]*>(.*?)</h1>', page, re.S) or [None, ''])[1]))
    pts = {}
    for tb in tables(page):
        if tb and tb[0][:2] == ['Ngày', 'Giá (đ/kg)']:
            for r in tb[1:]:
                if len(r) >= 2 and re.fullmatch(r'\d{2}/\d{2}/\d{4}', r[0]) and vnd(r[1]): pts[iso(r[0])] = vnd(r[1])
    return (name.group(1).strip() if name else None), pts


def parse_ref(page):
    txt = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<.*?>', ' ', re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S))))
    d = re.search(r'Thị trường, (\d{2}/\d{2}/\d{4}) Giá heo thịt hơi', txt)
    out = {}
    for k, lab in (('bac', 'Bắc'), ('trung', 'Trung'), ('nam', 'Nam')):
        m = re.search(rf'Giá heo thịt hơi miền {lab} ([\d.]+) đ/kg', txt)
        if m and vnd(m.group(1)): out[k] = vnd(m.group(1))
    return (iso(d.group(1)) if d else None), out


def merge(store, key, meta, pts, seen):
    s = store['series'].setdefault(key, {**meta, 'points': {}})
    s.update({k: v for k, v in meta.items()})
    for d, v in sorted(pts.items()):
        old = s['points'].get(d)
        if old is not None and old != v:
            store['revisions'].append({'series': key, 'date': d, 'old': old, 'new': v, 'seen': seen})
        s['points'][d] = v
    s['points'] = dict(sorted(s['points'].items()))


def main():
    store = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {'schema': 1, 'series': {}, 'revisions': [], 'checks': []}
    seen = datetime.now(VN).date().isoformat()
    check = {'at': seen, 'ok': False, 'source': 'baohatinh', 'provinces': 0, 'latest': None, 'errors': []}
    store['sources'] = {
        'baohatinh': {'name': 'Báo Hà Tĩnh – Giá lợn hôm nay', 'url': BASE, 'role': 'chính',
                      'method': 'Giá tại chuồng theo tỉnh; "bình quân miền" do nguồn công bố = bình quân không trọng số các tỉnh của miền trên trang chính (kiểm 26/11/2026).'},
        'nhachannuoi': {'name': 'Tạp chí Chăn nuôi Việt Nam – giá heo thịt hơi ba miền', 'url': REF_URL, 'role': 'đối chiếu',
                        'method': 'Ô giá ba miền trên trang chủ; phạm vi tỉnh không công bố. Lưu nối tiếp từ 26/11/2026.'}}
    try:
        page = get(BASE)
        regions, members, slugs, today = parse_main(page)
        if not any(regions.values()): raise ValueError('không đọc được bảng 30 ngày ba miền')
        for k, lab in REGIONS.items():
            merge(store, f'region:{k}', {'kind': 'region', 'region': k, 'name': lab, 'unit': 'đ/kg', 'source': 'baohatinh', 'status': 'tham chiếu thị trường'}, regions[k], seen)
        for slug in slugs:
            try:
                name, pts = parse_province(get(f'{BASE}/{slug}'))
                if not pts:  # trang tỉnh cũ (trước sáp nhập) còn link nhưng không có bảng giá → bỏ qua, không phải lỗi
                    check.setdefault('skipped', []).append(slug); continue
                reg = members.get(name) or EXTRA_REGION.get(slug)
                meta = {'kind': 'province', 'slug': slug, 'name': name or slug, 'region': reg, 'unit': 'đ/kg', 'source': 'baohatinh', 'status': 'tham chiếu thị trường',
                        'on_main_table': name in members, 'url': f'{BASE}/{slug}'}
                if slug in LEGACY: meta['note'] = f'Tên tỉnh cũ theo nguồn; từ 01/07/2025 thuộc {LEGACY[slug]}.'
                merge(store, f'prov:{slug}', meta, pts, seen)
                check['provinces'] += 1
            except Exception as e:  # một tỉnh lỗi không chặn cả lượt
                check['errors'].append(f'{slug}: {e}')
        check['latest'] = max(regions['bac']) if regions['bac'] else today
        check['ok'] = check['provinces'] > 0
    except Exception as e:
        check['errors'].append(f'baohatinh: {e}')
    try:
        d, ref = parse_ref(get(REF_URL))
        if d and ref:
            for k, v in ref.items():
                merge(store, f'ref:{k}', {'kind': 'reference', 'region': k, 'name': REGIONS[k] + ' (Tạp chí Chăn nuôi)', 'unit': 'đ/kg', 'source': 'nhachannuoi', 'status': 'tham chiếu thị trường'}, {d: v}, seen)
        else:
            check['errors'].append('nhachannuoi: không đọc được ô giá ba miền')
    except Exception as e:
        # nhachannuoi.vn hay thiếu chứng chỉ trung gian (SSL lỗi với requests) → chỉ ghi lỗi, giữ số đã có; số đối chiếu nhập tay ở data/livestock/observations.json.
        check['errors'].append(f'nhachannuoi: {type(e).__name__}')
    # Mỗi ngày giữ một dòng kiểm (lần chạy sau trong ngày ghi đè) → chạy lặp lại không phình file.
    store['checks'] = [c for c in store.get('checks', []) if c['at'] != seen][-59:] + [check]
    store['series'] = dict(sorted(store['series'].items()))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(store, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    print(f"hog prices: {check['provinces']} provinces, latest {check['latest']}, errors {len(check['errors'])}")
    return 0 if check['ok'] else 1


if __name__ == '__main__':
    sys.exit(main())
