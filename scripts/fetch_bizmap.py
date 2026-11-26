#!/usr/bin/env python3
"""Mạng lưới cửa hàng chuỗi bán lẻ niêm yết từ API Bizmap.live → data/retail/bizmap.json + data/retail-bizmap.js.

Luồng: Bizmap API → fetch → validate → normalize (34 tỉnh/thành, miền) → aggregate → dashboard Bán lẻ.
- Key: biến môi trường BIZMAP_API_KEY (GitHub Actions secret). Không có key → in thông báo, giữ nguyên dữ liệu cũ, thoát 0.
- Mỗi lượt chỉ gọi ~2 lời/chuỗi (/v1/chains/{slug} và /v1/stats/provinces?chain=slug) + 1 lời /v1/me:
  ~20 lời/lượt, hạn mức miễn phí 1.000 lời/ngày, 10 lời/giây. Retry theo Retry-After khi 429, backoff khi 5xx.
- Chỉ công bố số tổng hợp (theo chuỗi, theo tỉnh/thành). Không lưu, không công bố tọa độ từng cửa hàng khi chưa có
  xác nhận quyền tái phân phối (điều khoản bizmap.live cho phép trích dẫn số liệu kèm ghi nguồn; cấm bán lại dữ liệu thô).
- Kiểm: tổng theo tỉnh khớp tổng chuỗi (lệch ≤ 2%), số tỉnh ≤ 34, không số âm, đủ 9 chuỗi. Lỗi → không ghi đè bản hợp lệ gần nhất.
- Lịch sử: data/retail/bizmap-history.json, mỗi tuần một ảnh chụp (bỏ qua nếu ảnh gần nhất < 7 ngày); không tạo lịch sử giả.
Chạy tay: BIZMAP_API_KEY=... python scripts/fetch_bizmap.py [--force-snapshot] [--dry-run]
"""
from __future__ import annotations

import json
import os
import sys
import time
import unicodedata
from datetime import date, datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/retail/bizmap.json'
OUT_JS = ROOT / 'data/retail-bizmap.js'
HIST = ROOT / 'data/retail/bizmap-history.json'
BASE = 'https://bizmap.live/api'

# Chuỗi theo dõi: slug Bizmap (đã đối chiếu trang bizmap.live/thuong-hieu/<slug>), mã cổ phiếu, nhóm ngành.
# WinMart (siêu thị) và WiN chưa có trang riêng trên Bizmap (404 ngày 26/11/2026) → chưa theo dõi, tránh cộng trùng với WinMart+.
CHAINS = [
    ('bach-hoa-xanh', 'Bách Hóa Xanh', 'MWG', 'food'),
    ('winmart-plus', 'WinMart+', 'MSN', 'food'),
    ('the-gioi-di-dong', 'Thế Giới Di Động', 'MWG', 'ict'),
    ('dien-may-xanh', 'Điện Máy Xanh', 'MWG', 'appliance'),
    ('an-khang', 'An Khang', 'MWG', 'pharma'),
    ('avakids', 'AVAKids', 'MWG', 'mother'),
    ('long-chau', 'Long Châu', 'FRT', 'pharma'),
    ('fpt-shop', 'FPT Shop', 'FRT', 'ict'),
    ('pnj', 'PNJ', 'PNJ', 'jewelry'),
]

# 34 tỉnh/thành từ 01/07/2025 và miền (Tây Nguyên, Nam Trung Bộ tính vào miền Trung).
PROVINCES = {
    'Bắc': ['Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Hưng Yên', 'Ninh Bình', 'Phú Thọ', 'Thái Nguyên', 'Tuyên Quang',
            'Lào Cai', 'Lạng Sơn', 'Cao Bằng', 'Lai Châu', 'Điện Biên', 'Sơn La'],
    'Trung': ['Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Trị', 'Huế', 'Đà Nẵng', 'Quảng Ngãi', 'Gia Lai', 'Khánh Hòa', 'Đắk Lắk', 'Lâm Đồng'],
    'Nam': ['Hồ Chí Minh', 'Đồng Nai', 'Tây Ninh', 'Cần Thơ', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Cà Mau'],
}
REGION = {p: r for r, ps in PROVINCES.items() for p in ps}
assert len(REGION) == 34


def norm(s: str) -> str:
    s = str(s or '').replace('Đ', 'D').replace('đ', 'd')
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    s = s.replace('-', ' ').replace('.', ' ')
    for pre in ('thanh pho ', 'tinh ', 'tp '):
        if s.startswith(pre): s = s[len(pre):]
    return ' '.join(s.split())


ALIAS = {norm(p): p for p in REGION}
ALIAS.update({'ho chi minh city': 'Hồ Chí Minh', 'hcm': 'Hồ Chí Minh', 'thua thien hue': 'Huế', 'ha noi city': 'Hà Nội'})


def province_name(raw) -> str | None:
    return ALIAS.get(norm(raw))


class Api:
    def __init__(self, key: str):
        self.s = requests.Session(); self.s.headers.update({'X-API-Key': key, 'User-Agent': 'finsuccess-dashboard/1.0'})
        self.calls = 0; self.remaining = None; self._last = 0.0

    def get(self, path: str, **params):
        for attempt in range(5):
            wait = 0.15 - (time.monotonic() - self._last)  # ≤ ~7 lời/giây
            if wait > 0: time.sleep(wait)
            self._last = time.monotonic()
            r = self.s.get(BASE + path, params=params, timeout=30); self.calls += 1
            self.remaining = r.headers.get('X-RateLimit-Remaining', self.remaining)
            if r.status_code == 429:
                time.sleep(min(int(r.headers.get('Retry-After', '5') or 5), 60)); continue
            if r.status_code >= 500:
                time.sleep(2 ** attempt); continue
            if r.status_code != 200:
                raise RuntimeError(f'{path} HTTP {r.status_code}: {r.text[:200]}')
            return r.json()
        raise RuntimeError(f'{path}: hết số lần thử lại')


def pick(d: dict, *keys, default=None):
    for k in keys:
        if isinstance(d, dict) and d.get(k) is not None: return d[k]
    return default


def rows_of(payload):
    if isinstance(payload, list): return payload
    for k in ('data', 'provinces', 'items', 'results'):
        v = payload.get(k) if isinstance(payload, dict) else None
        if isinstance(v, list): return v
        if isinstance(v, dict):
            for k2 in ('provinces', 'items'):
                if isinstance(v.get(k2), list): return v[k2]
    return []


def fetch_chain(api: Api, slug: str) -> dict:
    info = api.get(f'/v1/chains/{slug}')
    chain = info.get('data', info) if isinstance(info, dict) else {}
    total = pick(chain, 'store_count', 'stores', 'total', 'count')
    logo = pick(chain, 'logo_url', 'logo')
    st = api.get('/v1/stats/provinces', chain=slug)
    prov, unknown, pop = {}, [], {}
    for row in rows_of(st):
        name = province_name(pick(row, 'name', 'province_name', 'province', 'ten'))
        n = pick(row, 'stores', 'store_count', 'count', 'total')
        if n is None: continue
        if name is None: unknown.append(pick(row, 'name', 'province_name', 'province', 'code')); continue
        prov[name] = prov.get(name, 0) + int(n)
        if row.get('population'): pop[name] = int(row['population'])
    updated = pick(st if isinstance(st, dict) else {}, 'updated_at') or pick(info if isinstance(info, dict) else {}, 'updated_at') or getattr(api, 'updated', None)
    return {'total': int(total) if total is not None else sum(prov.values()), 'provinces': {k: v for k, v in prov.items() if v > 0}, 'population': pop, 'logo_url': logo,
            'unknown_provinces': [u for u in unknown if u], 'source_updated': updated}


def validate(chains: dict) -> list[str]:
    errs = []
    if len(chains) != len(CHAINS): errs.append(f'thiếu chuỗi: {len(chains)}/{len(CHAINS)}')
    for slug, c in chains.items():
        s = sum(c['provinces'].values())
        if c['total'] <= 0: errs.append(f'{slug}: tổng ≤ 0')
        if any(v < 0 for v in c['provinces'].values()): errs.append(f'{slug}: số âm')
        if len(c['provinces']) > 34: errs.append(f'{slug}: > 34 tỉnh')
        if c['provinces'] and abs(s - c['total']) > max(2, 0.02 * c['total']): errs.append(f'{slug}: Σ tỉnh {s} lệch tổng {c["total"]}')
        if c['unknown_provinces']: errs.append(f'{slug}: tên tỉnh không nhận ra {c["unknown_provinces"][:5]}')
    return errs


def aggregate(chains: dict) -> dict:
    out = {}
    for slug, name, ticker, cat in CHAINS:
        c = chains[slug]; reg = {'Bắc': 0, 'Trung': 0, 'Nam': 0}
        for p, n in c['provinces'].items(): reg[REGION[p]] += n
        out[slug] = {'name': name, 'ticker': ticker, 'category': cat, 'stores': c['total'],
                     'province_count': sum(1 for v in c['provinces'].values() if v > 0),
                     'provinces': dict(sorted(c['provinces'].items(), key=lambda x: -x[1])), 'regions': reg,
                     'logo_url': c['logo_url'], 'source_updated': c['source_updated']}
    return out


def write_js(payload: dict):
    OUT_JS.write_text('/* Sinh bởi scripts/fetch_bizmap.py — không sửa tay. Nguồn: bizmap.live. */\nwindow.RETAIL_BIZMAP = '
                      + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')


def snapshot(payload: dict, force: bool) -> None:
    hist = json.loads(HIST.read_text(encoding='utf-8')) if HIST.exists() else {'schema': 1, 'source': 'bizmap.live', 'snapshots': []}
    snaps = hist['snapshots']; today = payload['captured_at'][:10]
    if snaps and not force and (date.fromisoformat(today) - date.fromisoformat(snaps[-1]['date'])).days < 7: return
    snaps[:] = [s for s in snaps if s['date'] != today]
    snaps.append({'date': today, 'mode': payload['mode'], 'source_updated': payload.get('source_updated'),
                  'chains': {k: {'stores': v['stores'], 'province_count': v['province_count'], 'provinces': v.get('provinces', {})} for k, v in payload['chains'].items()}})
    HIST.write_text(json.dumps(hist, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')


def main(argv=None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    key = os.environ.get('BIZMAP_API_KEY', '').strip()
    if not key:
        print('fetch_bizmap: chưa có BIZMAP_API_KEY (GitHub Actions secret) — giữ nguyên dữ liệu hiện có.'); return 0
    api = Api(key)
    try:
        me = api.get('/v1/me')
        api.updated = me.get('updated_at') if isinstance(me, dict) else None
        print('fetch_bizmap: còn', me.get('remaining_today', api.remaining) if isinstance(me, dict) else api.remaining, 'lời gọi hôm nay')
        chains = {slug: fetch_chain(api, slug) for slug, *_ in CHAINS}
    except Exception as e:  # noqa: BLE001 — lỗi mạng/API: giữ bản hợp lệ gần nhất
        print('fetch_bizmap: lỗi API, giữ dữ liệu cũ:', e); return 0
    errs = validate(chains)
    if errs:
        print('fetch_bizmap: dữ liệu không đạt kiểm tra, giữ dữ liệu cũ:', '; '.join(errs)); return 0
    agg = aggregate(chains)
    upd = sorted({c['source_updated'] for c in agg.values() if c['source_updated']})
    population = {}
    for c in chains.values(): population.update(c.get('population') or {})
    payload = {'schema': 1, 'mode': 'api', 'source': 'bizmap.live', 'source_url': 'https://bizmap.live/', 'population': dict(sorted(population.items())),
               'captured_at': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'source_updated': upd[-1] if upd else None,
               'tracking_since': None, 'api_calls': api.calls, 'chains': agg}
    old = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    payload['tracking_since'] = old.get('tracking_since') or payload['captured_at'][:10]
    if '--dry-run' in argv:
        print(json.dumps({k: (v['stores'], v['province_count']) for k, v in agg.items()}, ensure_ascii=False)); return 0
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    snapshot(payload, '--force-snapshot' in argv)
    hist = json.loads(HIST.read_text(encoding='utf-8')) if HIST.exists() else {'snapshots': []}
    write_js({**payload, 'history': hist['snapshots']})
    print(f'fetch_bizmap: {len(agg)} chuỗi, {sum(c["stores"] for c in agg.values())} điểm bán, {api.calls} lời gọi, còn {api.remaining}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
