#!/usr/bin/env python3
"""Build data/steel-wi-data.js from WiMCP captures (data/raw/wi/.inbox/ and data/raw/wi/steel/).

Captures are saved verbatim ({tool,input,captured_at,response}); calls live in data/steel-wi-contract.json.
Same match/merge helpers as build_realestate_wi.py. Never copies numbers by hand; missing calls keep last-good blocks.
"""
import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_realestate_wi import build_macro, load_captures, matches  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / 'data' / 'steel-wi-contract.json'
RAW = ROOT / 'data' / 'raw' / 'wi' / 'steel'
OUT_JSON = ROOT / 'data' / 'steel-wi-data.json'
OUT_JS = ROOT / 'data' / 'steel-wi-data.js'


def captures():
    caps = load_captures()
    for f in sorted(RAW.glob('*.json')):
        j = json.loads(f.read_text())
        if isinstance(j.get('response'), (dict, list)):
            j['_file'] = 'steel/' + f.name
            caps.append(j)
    return caps


def main():
    contract = json.loads(CONTRACT.read_text())
    caps = captures()
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
        missing_deps = [d for d in deps if not resp(d)]
        prev_series = ((previous.get('blocks') or {}).get(name) or {}).get('series') or {}
        if missing_deps and prev_series and isinstance(value.get('series'), dict):
            # A call not captured this run keeps its last-good series; only captured calls are rebuilt.
            for k, v in prev_series.items():
                value['series'].setdefault(k, v)
            value['stale_sources'] = missing_deps
        value['sources'] = [d for d in deps if resp(d)]
        value['captured_at'] = max((status[d].get('captured_at') or '') for d in value['sources'])
        blocks[name] = value

    ind = contract['indicators']
    put('macro', ['macro_steel', 'us_hs_steel'], lambda r: build_macro(r, ind))
    put('commodity', ['commodity_steel'], lambda r: build_macro(r, ind))
    bundle = {'schema': 1, 'built_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'provider': 'WiMCP (Widata)',
              'contract': str(CONTRACT.relative_to(ROOT)), 'calls': status, 'blocks': blocks}
    text = json.dumps(bundle, ensure_ascii=False, separators=(',', ':'))
    OUT_JSON.write_text(text + '\n')
    OUT_JS.write_text('window.STEEL_WI = ' + text.replace('<', '\\u003c') + ';\n')
    missing = [b for b, s in status.items() if s['status'] != 'ok']
    print('built', OUT_JS.relative_to(ROOT), '| blocks:', ', '.join(sorted(blocks)), '| missing calls:', missing or 'none')
    return 0


if __name__ == '__main__':
    sys.exit(main())
