#!/usr/bin/env python3
"""Build data/insurance-wi-data.js from WiMCP captures in data/raw/wi/.inbox/.

Same capture/match rules as build_realestate_wi.py (shared helpers imported from it);
calls and indicator names live in data/insurance-wi-contract.json. Never copies numbers by hand.
"""
import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_realestate_wi import build_macro, build_sector, load_captures, matches, table  # noqa: E402

BN = 1e9


def build_fs(resps, sectors):
    """Quarterly aggregate insurance P&L per GICS sub-sector, in tỷ đồng; claims made positive."""
    by = {}
    for resp in resps:
        for r in table(resp):
            q = '%d-Q%d' % (r['period_year'], r['period_quarter'])
            by.setdefault(str(r['sector_id']), {})[q] = [q, (r.get('is01_1') or 0) / BN, (r.get('is03') or 0) / BN, -(r.get('is15') or 0) / BN, (r.get('is23') or 0) / BN, (r.get('is25') or 0) / BN]
    return {'columns': ['quarter', 'direct_premium', 'net_premium', 'claims', 'fin_revenue', 'fin_profit'], 'by_sector': {sid: {'name': name, 'records': [by.get(sid, {})[q] for q in sorted(by.get(sid, {}))]} for sid, name in sectors.items()}}


RATIO_COLS = ['claim_ratio_nonlife_insurance', 'claim_ratio_motor_insurance', 'claim_ratio_health_insurance', 'claim_ratio_property_casualty_insurance',
              'claim_ratio_fire_explosion_insurance', 'claim_ratio_life_insurance', 'pct_profit_insurance_operations', 'pct_profit_financial_activities',
              'pct_investment_short_term_deposits', 'pct_investment_long_term_deposits', 'pct_investment_short_term_govt_bonds', 'pct_investment_long_term_govt_bonds',
              'pct_investment_listed_shares', 'pct_revenue_motor_insurance', 'pct_revenue_health_insurance', 'pct_revenue_property_casualty_insurance',
              'pct_revenue_fire_explosion_insurance', 'pct_revenue_marine_insurance', 'direct_premium_growth_yoy', 'net_premium_revenue_growth_yoy']


def build_ratio_ins(resps):
    """ratio_ins per ticker and quarter (05/11/2026): Wi returns fractions 0–1 (meta phan_so_can_x100) → stored as %.
    Formulas are copied from the capture's meta._cong_thuc so the page can quote them; nothing is retyped."""
    by, formulas, cols = {}, {}, None
    for resp in resps:
        meta = (resp.get('meta') or {}) if isinstance(resp, dict) else {}
        formulas.update({k: v for k, v in (meta.get('_cong_thuc') or {}).items() if not k.startswith('_')})
        for r in table(resp):
            cols = cols or [c for c in RATIO_COLS if c in r]
            q = '%d-Q%d' % (r['year'], r['quarter'])
            by.setdefault(r['symbol'], {})[q] = [q] + [None if r.get(c) is None else round(r[c] * 100, 2) for c in cols]
    return {'columns': ['quarter'] + (cols or RATIO_COLS), 'unit': '%', 'formulas': formulas,
            'by_symbol': {s: {'records': [by[s][q] for q in sorted(by[s])]} for s in sorted(by)},
            'note': 'WiData ratio_ins: giá trị gốc là phân số 0–1, đã nhân 100. Tỷ lệ bồi thường thuần = chi bồi thường (gốc + nhận tái − thu nhượng tái) / phí (gốc + nhận tái − nhượng tái). % lợi nhuận = phần của LNTT; nghiệp vụ BH tính trước chi phí quản lý nên hai phần không cộng về 100.'}


def build_gbond(resps):
    rows = {}
    for resp in resps:
        for r in table(resp):
            rows[r['date']] = r['value']
    return {'records': [{'date': d, 'value': rows[d]} for d in sorted(rows)]}

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / 'data' / 'insurance-wi-contract.json'
OUT_JSON = ROOT / 'data' / 'insurance-wi-data.json'
OUT_JS = ROOT / 'data' / 'insurance-wi-data.js'


def main():
    contract = json.loads(CONTRACT.read_text())
    caps = load_captures()
    previous = json.loads(OUT_JSON.read_text()) if OUT_JSON.exists() else {}
    picked, status = {}, {}
    for call in contract['calls']:
        found = [c for c in caps if matches(c, call)]
        if found:
            key = (lambda c: ((c.get('input') or {}).get('to_time', ''), c.get('captured_at', ''))) if call.get('pick') == 'max_to_time' else (lambda c: c.get('captured_at', ''))
            best = max(found, key=key)
            picked[call['block']] = best
            status[call['block']] = {'status': 'ok', 'captured_at': best.get('captured_at'), 'file': best['_file']}
        else:
            status[call['block']] = {'status': 'missing'}
    resp = lambda b: picked[b]['response'] if b in picked else None
    blocks = dict(previous.get('blocks', {}))

    def put(name, deps, build):
        got = [resp(d) for d in deps if resp(d)]
        if not got:
            blocks.setdefault(name, {})['stale'] = True
            return
        value = build(got)
        value['sources'] = [d for d in deps if resp(d)]
        value['captured_at'] = max((status[d].get('captured_at') or '') for d in value['sources'])
        blocks[name] = value

    ind = contract['indicators']
    put('macro', ['macro_insurance'], lambda r: build_macro(r, ind))
    put('fs', ['sector_fs_recent'], lambda r: build_fs(r, contract['sectors']))
    put('gbond', ['gbond_10y'], build_gbond)
    put('sector_ratio', ['sector_ratio_recent'], lambda r: build_sector(r, contract['sectors']))
    put('ratio_ins', ['ratio_ins'], build_ratio_ins)
    bundle = {'schema': 1, 'built_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'provider': 'WiMCP (Widata)',
              'contract': str(CONTRACT.relative_to(ROOT)), 'calls': status, 'blocks': blocks}
    text = json.dumps(bundle, ensure_ascii=False, separators=(',', ':'))
    OUT_JSON.write_text(text + '\n')
    OUT_JS.write_text('window.INSURANCE_WI = ' + text.replace('<', '\\u003c') + ';\n')
    missing = [b for b, s in status.items() if s['status'] != 'ok']
    print('built', OUT_JS.relative_to(ROOT), '| blocks:', ', '.join(sorted(blocks)), '| missing calls:', missing or 'none')
    return 0


if __name__ == '__main__':
    sys.exit(main())
