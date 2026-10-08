#!/usr/bin/env python3
"""Build data/realestate-wi-data.js from WiMCP captures in data/raw/wi/.inbox/.

The contract (data/realestate-wi-contract.json) lists every Wi call the dashboard
needs. The Claude routine re-issues those calls; scripts/wi_capture.py stores each
result verbatim; this script picks the newest capture matching each call, normalises
it and writes window.REALESTATE_WI. Numbers are never retyped. A block whose capture
is missing keeps the previous build (last-good) and is marked stale.

Usage: python3 scripts/build_realestate_wi.py [--restore <tool-results file> <block>]
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / 'data' / 'realestate-wi-contract.json'
INBOX = ROOT / 'data' / 'raw' / 'wi' / '.inbox'
OUT_JS = ROOT / 'data' / 'realestate-wi-data.js'
OUT_JSON = ROOT / 'data' / 'realestate-wi-data.json'
BN = 1e9  # VND -> tỷ VND
# Listed industrial-park developers (and HNX codes of their bond-issuing subsidiaries) for the KCN split.
KCN = {'KBC', 'IDC', 'BCM', 'SZC', 'SIP', 'VGC', 'LHG', 'BCMC', 'VJVC'}
RE_SECTOR = 'Bất động sản'


def load_captures():
    caps = []
    for f in sorted(INBOX.glob('*.json')):
        try:
            j = json.loads(f.read_text())
        except ValueError:
            continue
        if not isinstance(j.get('response'), (dict, list)):
            continue
        j['_file'] = f.name
        caps.append(j)
    return caps


def tool_name(cap):
    return str(cap.get('tool', '')).split('__')[-1]


def matches(cap, call):
    if tool_name(cap) != call['tool']:
        return False
    inp = cap.get('input') or {}
    keys = call.get('match_keys') or list(call['input'].keys())
    return all(str(inp.get(k)) == str(call['input'].get(k)) for k in keys)


def table(resp):
    """Wi 'dạng bảng' → list of dicts."""
    data = resp.get('data') if isinstance(resp, dict) else None
    if isinstance(data, dict) and 'cot' in data:
        cols = data['cot']
        return [dict(zip(cols, row)) for row in data['dong']]
    if isinstance(data, list):
        return data
    return []


def ym(r):
    return f"{int(r['year']):04d}-{int(r['month']):02d}-01"


def build_cashflow(resp):
    rows = table(resp)
    out = []
    for r in rows:
        if r.get('sector_l1') != RE_SECTOR:
            continue
        d = ym(r)
        asof = r.get('as_of_date') or ''
        out.append({
            'date': d,
            'principal_due': r['principal_due'] / BN, 'interest_due': r['interest_due'] / BN,
            'principal_paid': r['principal_paid'] / BN, 'interest_paid': r['interest_paid'] / BN,
            'principal_buyback': r['principal_buyback'] / BN,
            'ontime_ratio': r['ontime_ratio'], 'late_payment_debt': r['late_payment_debt'] / BN,
            'late_principal_debt': r['late_principal_debt'] / BN,
            'late_bond_count': r['late_bond_count'], 'new_late_bond_count': r['new_late_bond_count'],
            'late_issuer_count': r['late_issuer_count'],
            'outstanding_value': r['outstanding_value'] / BN, 'outstanding_bond_count': r['outstanding_bond_count'],
            'partial': asof[:7] == d[:7], 'as_of_date': asof,
        })
    # one sector_l2 only for real estate today; aggregate defensively by month
    agg = {}
    for r in out:
        a = agg.setdefault(r['date'], dict(r))
        if a is not r:
            for k, v in r.items():
                if isinstance(v, (int, float)) and k not in ('ontime_ratio',):
                    a[k] = (a.get(k) or 0) + v
    rows = sorted(agg.values(), key=lambda x: x['date'])
    return {'unit': 'tỷ VND', 'records': rows, 'latest_observation': rows[-1]['date'] if rows else None}


def build_issuance(resp):
    rows = [r for r in table(resp) if r.get('sector_l1') == RE_SECTOR]
    by_month = defaultdict(lambda: {'value': 0.0, 'issue_count': 0, 'coupon_weight': 0.0, 'coupon_value': 0.0, 'buckets': defaultdict(float), 'methods': defaultdict(float)})
    for r in rows:
        m = by_month[ym(r)]
        v = (r.get('actual_issuance_value') or 0) / BN
        m['value'] += v
        m['issue_count'] += r.get('issue_count') or 0
        if r.get('wavg_coupon') is not None and r.get('wavg_coupon') > 0:
            m['coupon_weight'] += v
            m['coupon_value'] += v * r['wavg_coupon']
        m['buckets'][r.get('maturity_bucket') or 'Chưa xác định'] += v
        m['methods'][r.get('issuance_method') or '—'] += v
    records = []
    for d in sorted(by_month):
        m = by_month[d]
        records.append({'date': d, 'value': m['value'], 'issue_count': m['issue_count'],
                        'wavg_coupon': (m['coupon_value'] / m['coupon_weight']) if m['coupon_weight'] else None,
                        'buckets': dict(m['buckets']), 'methods': dict(m['methods'])})
    return {'unit': 'tỷ VND', 'records': records, 'latest_observation': records[-1]['date'] if records else None,
            'note': 'Chỉ tổ chức phát hành ngành Bất động sản (phân ngành WiFeed), VND. Tháng cũ được tính lại khi có công bố muộn.'}


def build_maturity(resps):
    rows = []
    for resp in resps:
        rows += [r for r in table(resp) if r.get('sector_l1') == RE_SECTOR]
    by_month = defaultdict(lambda: {'due': 0.0, 'interest': 0.0, 'bond_count': 0, 'issuers': 0})
    by_issuer = defaultdict(lambda: {'due': 0.0, 'name': '', 'months': set()})
    for r in rows:
        d = ym(r)
        due = (r.get('due_at_outstanding') or 0) / BN
        by_month[d]['due'] += due
        by_month[d]['interest'] += (r.get('estimated_interest') or 0) / BN
        by_month[d]['bond_count'] += r.get('bond_count') or 0
        if due > 0:
            by_month[d]['issuers'] += 1
            i = by_issuer[r['symbol']]
            i['due'] += due
            i['name'] = r.get('company_name') or r['symbol']
            i['months'].add(d[:7])
    # Continuous month axis: a month with no real-estate row is a true zero, not a gap.
    months = sorted(by_month)
    if months:
        y, m = int(months[0][:4]), int(months[0][5:7])
        last = months[-1]
        while f'{y:04d}-{m:02d}-01' <= last:
            by_month[f'{y:04d}-{m:02d}-01']
            m += 1
            if m == 13:
                y, m = y + 1, 1
    records = [{'date': d, **by_month[d]} for d in sorted(by_month)]
    top = sorted(({'symbol': s, 'name': v['name'], 'due': v['due'], 'months': sorted(v['months'])} for s, v in by_issuer.items()), key=lambda x: -x['due'])[:15]
    kcn = {s: v for s, v in by_issuer.items() if s in KCN}
    kcn_due = sum(v['due'] for v in kcn.values())
    total_due = sum(v['due'] for v in by_issuer.values())
    return {'unit': 'tỷ VND', 'records': records, 'top_issuers': top,
            'kcn': {'due': kcn_due, 'total_due': total_due, 'symbols': sorted(kcn), 'issuers': sorted(({'symbol': s, 'name': v['name'], 'due': v['due']} for s, v in kcn.items()), key=lambda x: -x['due'])},
            'note': 'Gốc dự phóng đến hạn theo dư nợ còn lại; lãi ước tính (mã lãi thả nổi giữ lãi suất hiện hành). Lịch được tính lại toàn bộ mỗi lần Wi cập nhật.'}


def build_macro(resps, indicators):
    series = {}
    for resp in resps:
        for item in (resp.get('data') or []):
            iid = str(item.get('indicator_id'))
            if iid not in indicators:
                continue
            key, name, unit, tf = indicators[iid]
            vals = sorted(({'date': v['date'], 'value': v['value']} for v in item.get('values', []) if v.get('value') is not None), key=lambda x: x['date'])
            series[key] = {'indicator_id': int(iid), 'name': name, 'unit': unit, 'time_type': item.get('time_type') or tf, 'records': vals,
                           'latest_observation': vals[-1]['date'] if vals else None}
    return {'series': series}


def build_sector(resps, sectors):
    by = defaultdict(dict)
    for resp in resps:
        for r in table(resp):
            sid = str(r['sector_id'])
            by[sid][r['trading_date']] = [r['trading_date'], r.get('pe'), r.get('pb'), (r.get('market_cap') or 0) / BN]
    out = {}
    for sid, name in sectors.items():
        rows = [by[sid][d] for d in sorted(by[sid])]
        out[sid] = {'name': name, 'columns': ['date', 'pe', 'pb', 'market_cap_bn'], 'records': rows, 'latest_observation': rows[-1][0] if rows else None}
    return {'by_sector': out}


def main(argv=None):
    cli = argparse.ArgumentParser()
    cli.add_argument('--restore', nargs=2, metavar=('FILE', 'CAPTURE'), help='copy an oversized tool result into an inbox capture')
    args = cli.parse_args(argv)
    if args.restore:
        src, cap = Path(args.restore[0]), INBOX / args.restore[1]
        j = json.loads(cap.read_text())
        j['response'] = json.loads(src.read_text())
        j['note'] = 'response restored from saved tool result'
        cap.write_text(json.dumps(j, ensure_ascii=False))
        print('restored', cap.name)
        return 0
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

    def put(name, value, deps):
        if value is None:
            blocks.setdefault(name, {})['stale'] = True
            return
        value['sources'] = deps
        value['captured_at'] = max((status[d].get('captured_at') or '') for d in deps)
        blocks[name] = value

    put('cbond_cashflow', build_cashflow(resp('cbond_cashflow')) if resp('cbond_cashflow') else None, ['cbond_cashflow'])
    put('cbond_issuance', build_issuance(resp('cbond_issuance')) if resp('cbond_issuance') else None, ['cbond_issuance'])
    mats = [resp(b) for b in ('cbond_maturity_2026', 'cbond_maturity_2027') if resp(b)]
    put('cbond_maturity', build_maturity(mats) if mats else None, [b for b in ('cbond_maturity_2026', 'cbond_maturity_2027') if resp(b)])
    macro_resps = [resp(b) for b in ('macro_core', 'macro_kcn') if resp(b)]
    put('macro', build_macro(macro_resps, contract['indicators']) if macro_resps else None, [b for b in ('macro_core', 'macro_kcn') if resp(b)])
    put('commodity', build_macro([resp('commodity')], contract['indicators']) if resp('commodity') else None, ['commodity'])
    sector_resps = [resp(b) for b in ('sector_ratio_recent', 'sector_ratio_older') if resp(b)]
    put('sector_ratio', build_sector(sector_resps, contract['sectors']) if sector_resps else None, [b for b in ('sector_ratio_recent', 'sector_ratio_older') if resp(b)])

    bundle = {'schema': 1, 'built_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'provider': 'WiMCP (Widata)',
              'contract': str(CONTRACT.relative_to(ROOT)), 'calls': status, 'blocks': blocks}
    text = json.dumps(bundle, ensure_ascii=False, separators=(',', ':'))
    OUT_JSON.write_text(text + '\n')
    OUT_JS.write_text('window.REALESTATE_WI = ' + text.replace('<', '\\u003c') + ';\n')
    missing = [b for b, s in status.items() if s['status'] != 'ok']
    print('built', OUT_JS.relative_to(ROOT), '| blocks:', ', '.join(sorted(blocks)), '| missing calls:', missing or 'none')
    return 0


if __name__ == '__main__':
    sys.exit(main())
