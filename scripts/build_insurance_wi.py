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
