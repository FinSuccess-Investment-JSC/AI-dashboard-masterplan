#!/usr/bin/env python3
"""Merge verbatim WiMCP responses into data/raw/wi/*.json for the Claude routine.

Wi has no API key for scripts, so the routine calls WiMCP itself, saves each result
verbatim, and this script merges it into the curated raw file according to
data/bank-wi-ingest.json. Overlapping observations are compared: a different value in
the most recent `revisable_points` observations is a Wi revision (kept, logged under
`revisions`); a difference further back means a transcription error, unless the input is a
verbatim hook capture (`ingest`), where every difference is a Wi revision. An old
observation missing from the new window means an incomplete response: nothing is written.

    python3 scripts/wi_ingest.py plan bank.wi.daily          # MCP calls to make (JSON)
    python3 scripts/wi_ingest.py ingest bank.wi.daily        # merge results captured by the hook
    python3 scripts/wi_ingest.py merge macro_fx_daily.json /tmp/wi/fx.json [more.json ...]

The PostToolUse hook scripts/wi_capture.py (.claude/settings.json) saves every WiMCP
result verbatim to data/raw/wi/.inbox/, so no number is ever retyped.
"""
from __future__ import annotations

import argparse
import copy
import datetime as dt
import json
import math
import os
import re
import sys
import tempfile
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/wi'
SPEC = ROOT / 'data/bank-wi-ingest.json'
INBOX = RAW / '.inbox'
CONTRACT = ROOT / 'data/bank-wi-contract.json'
REGISTRY = ROOT / 'updates/registry.json'
VN = ZoneInfo('Asia/Ho_Chi_Minh')
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}')
MAX_REVISIONS = 100


class IngestError(ValueError):
    pass


def _decimals(x: float) -> int:
    text = repr(float(x))
    return 0 if 'e' in text or '.' not in text else len(text.split('.')[1].rstrip('0'))


def same(a, b) -> bool:
    """Equal, or equal once the more precise value is rounded (Wi now returns 4 decimals)."""
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool) and not isinstance(b, bool):
        if math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-12):
            return True
        places = min(_decimals(a), _decimals(b))
        return round(a, places) == round(b, places) and places >= 2
    return a == b


def day(value) -> str:
    text = str(value or '')
    if not DATE.match(text):
        raise IngestError(f'Ngày không hợp lệ: {value!r}')
    dt.date.fromisoformat(text[:10])
    return text[:10]


def response_rows(responses: list) -> list:
    rows = []
    for res in responses:
        if isinstance(res, dict) and 'response' in res and 'tool' in res:  # hook capture wrapper
            res = res['response']
        data = res.get('data', res) if isinstance(res, dict) else res
        if isinstance(data, dict) and 'cot' in data and 'dong' in data:  # compact table form
            data = [dict(zip(data['cot'], row)) for row in data['dong']]
        if not isinstance(data, list):
            raise IngestError('Kết quả MCP không có danh sách data')
        rows += data
    return rows


def response_points(responses: list) -> dict[int, dict[str, float]]:
    """{indicator_id: {date: value}} from get_values (values[]) or row endpoints (date/value)."""
    out: dict[int, dict[str, float]] = {}
    for row in response_rows(responses):
        if not isinstance(row, dict) or 'indicator_id' not in row:
            continue
        ident = int(row['indicator_id'])
        values = row['values'] if 'values' in row else [row]
        for point in values:
            if point.get('value') is None:
                continue
            out.setdefault(ident, {})[day(point['date'])] = point['value']
    return out


def check_overlap(label: str, old: dict, new: dict, revisable: int | None, log: list, require_overlap: bool) -> None:
    """old/new: {date or key: value}. Raises on old-history mismatch, a missing old point inside the new window, or no overlap."""
    if not new:
        return
    recent = set(old) if revisable is None else set(sorted(old, reverse=True)[:revisable])
    start = min(new)
    shared = [k for k in old if k in new]
    if require_overlap and old and not shared:
        raise IngestError(f'{label}: kết quả mới không chồng kỳ nào với số cũ (cũ đến {max(old)}, mới từ {start}); gọi lại với from_time sớm hơn')
    missing = [k for k in old if k >= start and k not in new]
    if missing:
        raise IngestError(f'{label}: kết quả mới thiếu {len(missing)} kỳ đã có ({", ".join(sorted(missing)[:3])}…); response bị cắt hoặc chép thiếu')
    for key in shared:
        if not same(old[key], new[key]):
            if key not in recent:
                raise IngestError(f'{label} {key}: số cũ {old[key]} khác số mới {new[key]} ở kỳ đã chốt; nghi chép sai')
            log.append({'item': label, 'date': key, 'old': old[key], 'new': new[key]})


def merge_series(raw: dict, part: dict, responses: list, revisable: int, log: list) -> int:
    points = response_points(responses)
    added = 0
    for key, series in raw[part['path']].items():
        new = points.get(int(series['id']))
        if not new:
            raise IngestError(f'Thiếu chỉ tiêu {series["id"]} ({key}) trong kết quả MCP')
        old = {d: v for d, v in series['values']}
        check_overlap(f'{key}/{series["id"]}', old, new, revisable, log, True)
        added += len(set(new) - set(old))
        old.update(new)
        series['values'] = [[d, old[d]] for d in sorted(old, reverse=True)]
    return added


def merge_aligned(raw: dict, part: dict, responses: list, revisable: int, log: list) -> int:
    """Arrays aligned to a shared date list: {dates: [...], path: {key: {id: .., values: [...]}}}
    (aligned) or {path: {dates: [...], "<name>_<id>": [...]}} (aligned_flat)."""
    points = response_points(responses)
    if part['kind'] == 'aligned':
        dates = raw[part['dates']]
        columns = [(f'{key}.{arr}', int(s[idf]), s, arr) for key, s in raw[part['path']].items()
                   for idf, arr in part['pairs'].items() if idf in s]
    else:
        flat = raw[part['path']]
        dates = flat[part['dates']]
        columns = [(key, int(key.rsplit('_', 1)[1]), flat, key) for key in flat if key != part['dates']]
    merged, all_dates = {}, set(dates)
    for label, ident, owner, arr in columns:
        old = {d: v for d, v in zip(dates, owner[arr]) if v is not None}
        new = points.get(ident)
        if not new:
            raise IngestError(f'Thiếu chỉ tiêu {ident} ({label}) trong kết quả MCP')
        check_overlap(f'{label}/{ident}', old, new, revisable, log, True)
        old.update(new)
        merged[label] = old
        all_dates |= set(new)
    ordered = sorted(all_dates, reverse=True)[:part.get('keep', len(all_dates))]
    added = len(set(ordered) - set(dates))
    for label, _, owner, arr in columns:
        owner[arr] = [merged[label].get(d) for d in ordered]
    if part['kind'] == 'aligned':
        raw[part['dates']] = ordered
    else:
        raw[part['path']][part['dates']] = ordered
    return added


def merge_snapshot(raw: dict, part: dict, responses: list, revisable: int, log: list) -> int:
    points = response_points(responses)
    latest = {ident: max(vals) for ident, vals in points.items() if vals}
    if not latest:
        raise IngestError('Kết quả MCP không có số lãi suất nào')
    obs = max(latest.values())
    stale = []
    for row in raw['rows']:
        ident = int(row[part['id_col']])
        if obs in points.get(ident, {}):
            row[part['value_col']] = points[ident][obs]
        else:
            stale.append(row[0])
    raw[part['date_field']] = obs
    raw['stale_symbols'] = stale  # no observation on the snapshot date: previous value kept
    return 1


def coerce(value, kind):
    if isinstance(value, str) and kind in (int, float):
        try:
            number = float(value)
        except ValueError:
            return value
        return int(number) if kind is int and number.is_integer() else number
    return value


def row_date(value: dict, part: dict) -> str:
    return day(value[part['date']])


def merge_table(raw: dict, part: dict, responses: list, revisable: int, log: list) -> int:
    records = part['kind'] == 'records'
    cols = None if records else raw['columns']
    old_rows = raw[part.get('path', 'data')] if records else raw['rows']
    as_dict = (lambda r: r) if records else (lambda r: dict(zip(cols, r)))
    key_of = lambda r: '|'.join(str(r.get(k)) for k in part['key'])
    old = {key_of(as_dict(r)): as_dict(r) for r in old_rows}
    kinds = {}
    for r in old.values():  # column types as stored, so "15" from a new response stays the number 15
        for c, v in r.items():
            if v is not None and not isinstance(v, bool):
                kinds.setdefault(c, type(v))
    fresh = []
    for row in response_rows(responses):
        if not records:
            absent = [c for c in cols if c not in row]
            if absent:
                raise IngestError(f'Kết quả MCP thiếu cột {absent}; gọi lại đúng columns của file')
            row = {c: row[c] for c in cols}
        fresh.append({c: coerce(v, kinds.get(c)) for c, v in row.items()})
    if not fresh:
        return 0
    if part.get('window_replace'):  # no unique key (identical events can repeat): replace the new window wholesale
        start = min(row_date(r, part) for r in fresh)
        kept = [r for r in map(as_dict, old_rows) if row_date(r, part) < start]
        dropped = len(old_rows) - len(kept)
        if dropped != len(fresh):
            log.append({'item': 'window', 'date': start, 'old_rows': dropped, 'new_rows': len(fresh)})
        rows = sorted(kept + fresh, key=lambda r: row_date(r, part), reverse=True)
        raw['rows'] = [[r[c] for c in cols] for r in rows]
        return max(0, len(fresh) - dropped)
    new = {key_of(row): row for row in fresh}
    dates_old = sorted({row_date(r, part) for r in old.values()}, reverse=True)
    recent_dates = set(dates_old if revisable is None else dates_old[:revisable])
    start = min(row_date(r, part) for r in new.values())
    missing = [k for k, r in old.items() if row_date(r, part) >= start and k not in new]
    if missing and not part.get('allow_missing'):
        raise IngestError(f'Kết quả mới thiếu {len(missing)} dòng đã có từ {start} ({missing[0]}…); response bị cắt hoặc chép thiếu')
    for key in set(old) & set(new):
        diff = {c: (old[key][c], new[key][c]) for c in new[key] if not same(old[key].get(c), new[key][c])}
        if diff:
            if row_date(old[key], part) not in recent_dates:
                raise IngestError(f'Dòng {key}: số cũ khác số mới ở kỳ đã chốt {diff}; nghi chép sai')
            log.append({'item': key, 'date': row_date(old[key], part), 'changes': diff})
    added = len(set(new) - set(old))
    old.update(new)
    rows = sorted(old.values(), key=lambda r: (row_date(r, part), key_of(r)), reverse=True)
    if part.get('keep_dates'):
        keep = set(sorted({row_date(r, part) for r in rows}, reverse=True)[:part['keep_dates']])
        rows = [r for r in rows if row_date(r, part) in keep]
    if records:
        raw[part.get('path', 'data')] = rows
    else:
        raw['rows'] = [[r[c] for c in cols] for r in rows]
    return added


MERGERS = {'series': merge_series, 'aligned': merge_aligned, 'aligned_flat': merge_aligned,
           'snapshot_rows': merge_snapshot, 'table': merge_table, 'records': merge_table}


def merge(name: str, responses: list, spec: dict, now: dt.datetime, strict: bool = True) -> dict:
    """strict (hand-made response files): a difference in settled history is a transcription error.
    Not strict (verbatim hook captures): every difference is a Wi revision, logged under `revisions`."""
    conf = spec['files'].get(name)
    if not conf or not conf.get('parts'):
        raise IngestError(f'{name} không nạp tự động được ({"BCTC quý, giai đoạn 2" if conf and conf.get("quarterly") else (conf or {}).get("manual") or "chưa khai báo"})')
    path = RAW / name
    raw = json.loads(path.read_text(encoding='utf-8'))
    work = copy.deepcopy(raw)
    revisable = conf.get('revisable_points', spec.get('revisable_points', 5)) if strict else None
    log, added = [], 0
    for part in conf['parts']:
        added += MERGERS[part['kind']](work, part, responses, revisable, log)
    stamp = now.isoformat(timespec='seconds')
    work['fetched_at'] = stamp
    if log:
        work['revisions'] = (work.get('revisions', []) + [{**entry, 'at': stamp} for entry in log])[-MAX_REVISIONS:]
    if work != raw or added:
        fd, tmp = tempfile.mkstemp(prefix=f'.{name}.', dir=RAW)
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as fh:
                fh.write(json.dumps(work, ensure_ascii=False, separators=(',', ':')))
            os.replace(tmp, path)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)
    return {'file': name, 'added': added, 'revisions': log}


# ---------- plan ----------

def latest_date(raw: dict) -> str | None:
    found = re.findall(r'"(\d{4}-\d{2}-\d{2})', json.dumps({k: v for k, v in raw.items() if k not in ('request', 'requests', 'fetched_at', 'revisions')}))
    return max(found) if found else None


def block_files(contract: dict, block: str) -> list[str]:
    spec = contract['blocks'][block]
    names = []
    for part in spec.get('tools') or [spec]:
        for key in ('raw_file', 'raw_files'):
            value = part.get(key)
            names += value if isinstance(value, list) else [value] if value else []
    return list(dict.fromkeys(names))


def part_ids(raw: dict, part: dict) -> list[int]:
    """Indicator ids a macro-backed part needs (taken from the file, not its old request)."""
    if part['kind'] == 'series':
        return [int(s['id']) for s in raw[part['path']].values()]
    if part['kind'] == 'aligned':
        return [int(s[idf]) for s in raw[part['path']].values() for idf in part['pairs'] if idf in s]
    if part['kind'] == 'aligned_flat':
        return [int(k.rsplit('_', 1)[1]) for k in raw[part['path']] if k != part['dates']]
    if part['kind'] == 'snapshot_rows':
        return [int(r[part['id_col']]) for r in raw['rows']]
    return []


def part_last_date(raw: dict, part: dict) -> str:
    if part['kind'] == 'series':
        return max(s['values'][0][0] for s in raw[part['path']].values() if s['values'])
    if part['kind'] == 'aligned':
        return max(raw[part['dates']])
    if part['kind'] == 'aligned_flat':
        return max(raw[part['path']][part['dates']])
    return raw[part['date_field']]


def plan(item: str, spec: dict, today: dt.date) -> list[dict]:
    registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
    contract = json.loads(CONTRACT.read_text(encoding='utf-8'))
    blocks = next(i['wiBlocks'] for i in registry['items'] if i['id'] == item)
    names = list(dict.fromkeys(n for b in blocks for n in block_files(contract, b)))
    out = []
    for name in names:
        conf = spec['files'].get(name, {})
        raw = json.loads((RAW / name).read_text(encoding='utf-8'))
        if not conf.get('parts'):
            out.append({'file': name, 'auto': False, 'note': conf.get('manual') or 'BCTC quý: giai đoạn 2, chưa nạp tự động'})
            continue
        last = latest_date(raw)
        start = dt.date.fromisoformat(last) - dt.timedelta(days=conf.get('overlap_days', spec['overlap_days'])) if last else today - dt.timedelta(days=30)
        if conf.get('recent_days'):
            start = today - dt.timedelta(days=conf['recent_days'])
        days = (today - start).days + 1
        requests = [r for r in (raw['request'] if isinstance(raw['request'], list) else [raw['request']])
                    if not str(r.get('tool', '')).startswith('wifeed_search')]
        calls = []
        if requests and requests[0].get('action') == 'get_values':
            for part in conf['parts']:  # each part has its own last observation (monthly vs daily)
                p_last = part_last_date(raw, part)
                p_start = dt.date.fromisoformat(p_last) - dt.timedelta(days=part.get('overlap_days', conf.get('overlap_days', spec['overlap_days'])))
                if conf.get('recent_days'):  # snapshot-style files only keep the latest observations
                    p_start = today - dt.timedelta(days=conf['recent_days'])
                calls.append({'tool': spec['tool_names']['wifeed_macro'], 'action': 'get_values',
                              'indicator_id': ','.join(map(str, part_ids(raw, part))), 'from_time': p_start.isoformat(),
                              'to_time': today.isoformat(), 'limit': min(1000, (today - p_start).days + 5)})
        else:
            for req in requests:
                call = {'tool': spec['tool_names'].get(req['tool'], req['tool']),
                        **{k: v for k, v in req.items() if k not in ('tool', 'tables', 'table', 'note', 'meta', 'limit', 'from_time', 'to_time', 'fetched_at')}}
                if 'columns' in raw and call.get('columns'):  # always ask for every column the file keeps
                    call['columns'] = ','.join(dict.fromkeys(raw['columns'] + str(call['columns']).split(',')))
                if isinstance(call.get('filters'), dict):
                    call['filters'] = json.dumps(call['filters'], ensure_ascii=False)
                call.update(from_time=start.isoformat(), to_time=today.isoformat(), limit=spec.get('limit_max', {}).get(call['tool'], 1000))
                calls.append(call)
        out.append({'file': name, 'auto': True, 'last_date': last, 'calls': calls,
                    'then': f'python3 scripts/wi_ingest.py merge {name} <file kết quả của từng call>'})
    return out


def _ids(value) -> set[str]:
    return {x.strip() for x in str(value or '').split(',') if x.strip()}


def _filters(value) -> dict:
    if isinstance(value, str):
        try:
            value = json.loads(value) if value else {}
        except ValueError:
            return {'_raw': value}
    return {k: str(v).replace(' ', '') for k, v in (value or {}).items()}


def matches(call: dict, capture: dict) -> bool:
    """A capture answers a planned call if it is the same tool/endpoint/ids and starts no later."""
    got = capture.get('input') or {}
    if capture.get('tool', '').rsplit('__', 1)[-1] != call['tool'] or got.get('action') != call['action']:
        return False
    if call['action'] == 'get_values':
        same_target = _ids(got.get('indicator_id')) == _ids(call['indicator_id'])
    else:  # every identifying parameter must agree (two forecast calls differ only by indicator_code)
        ident = [k for k in call if k not in ('tool', 'action', 'from_time', 'to_time', 'limit', 'columns', 'filters', 'by_time', 'sort')]
        same_target = _filters(got.get('filters')) == _filters(call.get('filters')) and \
            all(str(got.get(k, '')).replace(' ', '') == str(call[k]).replace(' ', '') for k in ident)
    return same_target and str(got.get('from_time') or '') <= call['from_time']


def ingest(item: str, spec: dict, now: dt.datetime) -> tuple[list[dict], bool]:
    captures = []
    for path in sorted(INBOX.glob('*.json')) if INBOX.exists() else []:
        try:
            captures.append((path, json.loads(path.read_text(encoding='utf-8'))))
        except ValueError:
            continue
    report, ok, used = [], True, set()
    for entry in plan(item, spec, now.date()):
        if not entry['auto']:
            report.append({'file': entry['file'], 'status': 'bỏ qua', 'note': entry['note']})
            continue
        found = []
        for call in entry['calls']:
            hits = [(p, c) for p, c in captures if matches(call, c)]
            found.append(hits[-1] if hits else None)  # newest capture wins
        if not all(found):
            ok = False
            report.append({'file': entry['file'], 'status': 'thiếu kết quả', 'note': 'chưa gọi WiMCP đúng lệnh trong plan (tool, ids/endpoint, from_time)'})
            continue
        try:
            result = merge(entry['file'], [c for _, c in found], spec, now, strict=False)
            used |= {p for p, _ in found}
            report.append({'status': 'ok', **result})
        except (IngestError, KeyError, ValueError) as exc:
            ok = False
            report.append({'file': entry['file'], 'status': 'lỗi', 'note': str(exc)})
    for path in used:
        path.unlink()
    return report, ok


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('plan'); p.add_argument('item')
    i = sub.add_parser('ingest'); i.add_argument('item')
    m = sub.add_parser('merge'); m.add_argument('raw_file'); m.add_argument('responses', nargs='+', type=Path)
    args = ap.parse_args(argv)
    spec = json.loads(SPEC.read_text(encoding='utf-8'))
    now = dt.datetime.now(VN)
    if args.cmd == 'plan':
        print(json.dumps(plan(args.item, spec, now.date()), ensure_ascii=False, indent=1))
        return 0
    if args.cmd == 'ingest':
        report, ok = ingest(args.item, spec, now)
        print(json.dumps(report, ensure_ascii=False, indent=1))
        return 0 if ok else 1
    try:
        result = merge(Path(args.raw_file).name, [json.loads(p.read_text(encoding='utf-8')) for p in args.responses], spec, now)
    except (IngestError, KeyError, ValueError) as exc:
        print(f'LỖI, không ghi file: {exc}', file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
