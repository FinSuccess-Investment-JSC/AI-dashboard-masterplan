#!/usr/bin/env python3
"""Build data/power-overview.js (window.POWER_OVERVIEW) from data/power-overview.json after validating it.

data/power-overview.json holds the qualitative layer of the Điện tab Tổng quan ngành
(assets/power-overview.js): value-chain flows, business models, market mechanisms, driver → earnings
map, theses and the thresholds of the insight rules. Numbers are not stored there; the page computes
them from data already loaded. Edit the JSON, then run:
    python3 scripts/build_power_overview.py
The build refuses to write when a ticker, group, rule or threshold is unknown, so the page cannot show
an exposure for a company outside the tracked list or a rule without a defined threshold.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data' / 'power-overview.json'
OUT = ROOT / 'data' / 'power-overview.js'
POLICY = ROOT / 'data' / 'power-policy.json'

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_power_policy import TICKERS  # noqa: E402  (18 mã theo dõi của trang Điện)

GROUPS = {'hydro', 'coal', 'gas', 're', 'grid'}
SOURCES = GROUPS - {'grid'}
PP_SECTIONS = {'demand', 'hydro', 'dispatch', 'economics', 'evn', 'supply', None}
LIVE = {'enso', 'oni', 'inflow', 'hydro_m', 'gas_m', 'demand', 'pmax', 'contrib', 'coal', 'lng', 'fmp', 'qc', 'policy', 'transitional', 'pipeline', None}
RULES = {'thermal_dry', 'gas_fuel', 'grid_capex', 'fit_cash'}
KINDS = {'scheduled', 'expected', 'undated', 'earliest'}
RELEASE_RULES = {'second_thursday', 'first_week', 'none'}
ROLES = {'chính', 'chính trong mảng điện', 'một phần', 'gián tiếp', 'nhỏ'}
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
THRESHOLDS = {'demand_accel_pp', 'demand_strong_pct', 'structural_pct', 'mix_shift_pp', 'divergence_pp', 'peak_gap_pp',
              'hydro_dry_inflow_pct', 'fuel_move_pct', 'fmp_move_pct', 't1_hydro_pct', 't1_thermal_pct', 't2_gas_pct'}


def validate(data, policy):
    errors = []
    if not DATE.match(data.get('as_of', '')):
        errors.append('as_of phải dạng YYYY-MM-DD')
    th = data.get('thresholds', {})
    if set(th) != THRESHOLDS:
        errors.append(f'thresholds phải đúng bộ khóa {sorted(THRESHOLDS)}; thừa {sorted(set(th) - THRESHOLDS)}, thiếu {sorted(THRESHOLDS - set(th))}')
    for k, v in th.items():
        if not isinstance(v.get('value'), (int, float)) or not v.get('basis'):
            errors.append(f'ngưỡng {k}: cần value số và basis')
    if {g['id'] for g in data.get('groups', [])} != GROUPS:
        errors.append('groups phải gồm hydro, coal, gas, re, grid')
    seen = set()
    for c in data.get('companies', []):
        t = c.get('ticker')
        if t not in TICKERS:
            errors.append(f'{t}: không thuộc 18 mã theo dõi')
        if t in seen:
            errors.append(f'{t}: trùng')
        seen.add(t)
        if not c.get('exposure'):
            errors.append(f'{t}: thiếu exposure')
        for e in c.get('exposure', []):
            if e.get('group') not in GROUPS or e.get('role') not in ROLES or not e.get('note'):
                errors.append(f'{t}: exposure sai {e}')
    if seen != TICKERS:
        errors.append(f'companies thiếu {sorted(TICKERS - seen)}')
    sd = data.get('stock_dashboards', {})
    if not str(sd.get('base', '')).startswith('https://') or not DATE.match(sd.get('checked_at', '')):
        errors.append('stock_dashboards cần base https và checked_at')
    for t, path in sd.get('paths', {}).items():
        if t not in TICKERS or not re.fullmatch(r'[a-z0-9]+/', path):
            errors.append(f'stock_dashboards {t}: {path}')
    for f in data.get('flows', []):
        if not f.get('nodes') or any(not (n.get('id') and n.get('t') and n.get('d')) for n in f['nodes']):
            errors.append(f'luồng {f.get("id")}: node thiếu id/t/d')
    if {b['group'] for b in data.get('business_models', [])} != SOURCES:
        errors.append('business_models phải có đủ hydro, coal, gas, re')
    pgroups = {g['id'] for g in policy.get('groups', [])}
    comps = ' '.join(c.get('item', '') for c in policy.get('market', {}).get('components', []))
    for m in data.get('mechanisms', []):
        if m.get('policy_group') not in pgroups:
            errors.append(f'cơ chế {m.get("id")}: policy_group {m.get("policy_group")} không có ở tab Policy')
        if m.get('component') and f'[[{m["component"]}]]' not in comps:
            errors.append(f'cơ chế {m.get("id")}: không tìm thấy {m["component"]} trong power-policy market.components')
        if not (m.get('l1') and m.get('l2') and m.get('scope')):
            errors.append(f'cơ chế {m.get("id")}: cần đủ l1, l2, scope')
    pm = data.get('peer_matrix', {})
    dims = [d[0] for d in pm.get('dims', [])]
    for g in SOURCES:
        row = pm.get('rows', {}).get(g, {})
        if set(row) != set(dims):
            errors.append(f'peer_matrix {g}: thiếu {sorted(set(dims) - set(row))}')
    if set(data.get('source_profiles', {})) != SOURCES:
        errors.append('source_profiles phải có đủ hydro, coal, gas, re')
    for g, p in data.get('source_profiles', {}).items():
        if p.get('pp_section') not in PP_SECTIONS or not p.get('risks') or not p.get('transmission'):
            errors.append(f'source_profiles {g}: thiếu risks/transmission hoặc pp_section sai')
    for d in data.get('drivers', []):
        did = d.get('id')
        if d.get('live') not in LIVE or d.get('pp_section') not in PP_SECTIONS:
            errors.append(f'biến số {did}: live/pp_section sai')
        if d.get('policy_group') and d['policy_group'] not in pgroups:
            errors.append(f'biến số {did}: policy_group sai')
        if set(d.get('groups', {})) != GROUPS:
            errors.append(f'biến số {did}: groups phải đủ 5 nhóm')
        if set(d.get('pnl', {})) != {'revenue', 'ebitda', 'profit', 'cash'}:
            errors.append(f'biến số {did}: pnl phải có revenue, ebitda, profit, cash')
        if not d.get('fails') or not d.get('verify'):
            errors.append(f'biến số {did}: cần điều kiện không xảy ra và chỉ báo kiểm chứng')
        for v in d.get('verify', []):
            if v.get('live') not in LIVE:
                errors.append(f'biến số {did}: chỉ báo {v.get("label")} live sai')
    if len(data.get('drivers', [])) != 9:
        errors.append('cần đúng 9 biến số ngành (mục 6.1)')
    rel = {r['id'] for r in data.get('releases', [])}
    for r in data.get('releases', []):
        if r.get('kind') not in KINDS or not r.get('basis'):
            errors.append(f'lịch {r.get("id")}: kind/basis sai')
        if r.get('rule') and r['rule'] not in RELEASE_RULES:
            errors.append(f'lịch {r.get("id")}: rule sai')
        for k in ('date', 'end'):
            if r.get(k) and not DATE.match(r[k]):
                errors.append(f'lịch {r.get("id")}: {k} sai định dạng')
        if r.get('kind') == 'undated' and r.get('date'):
            errors.append(f'lịch {r.get("id")}: undated không được có ngày')
    for t in data.get('theses', []):
        if t.get('rule') not in RULES:
            errors.append(f'luận điểm {t.get("id")}: rule sai')
        if not set(t.get('tickers', [])) <= TICKERS or not set(t.get('segments', [])) <= GROUPS:
            errors.append(f'luận điểm {t.get("id")}: mã hoặc nhóm ngoài danh sách')
        cf = t.get('confound')
        if cf and (not DATE.match(cf.get('from', '')) or not cf.get('note')):
            errors.append(f'luận điểm {t.get("id")}: confound cần from (YYYY-MM-DD) và note')
        if not set(t.get('next', [])) <= rel:
            errors.append(f'luận điểm {t.get("id")}: mốc tiếp theo không có trong releases')
    pids = {p.get('policy_id') for p in policy.get('policies', [])}
    for r in data.get('releases', []):
        if r.get('policy_id') and r['policy_id'] not in pids:
            errors.append(f'lịch {r.get("id")}: policy_id {r["policy_id"]} không có ở tab Policy')
    return errors


def main():
    data = json.loads(SRC.read_text(encoding='utf-8'))
    policy = json.loads(POLICY.read_text(encoding='utf-8'))
    errors = validate(data, policy)
    if errors:
        print('\n'.join(errors))
        sys.exit(f'{len(errors)} lỗi trong {SRC.relative_to(ROOT)}; không ghi {OUT.name}')
    OUT.write_text('window.POWER_OVERVIEW=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')  # LF để ?v= khớp bản trên web
    print(f'{len(data["drivers"])} biến số, {len(data["theses"])} luận điểm, {len(data["companies"])} mã → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
