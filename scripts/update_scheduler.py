#!/usr/bin/env python3
"""Schedule Wi, document and AI-text updates from updates/registry.json.

Tier A (scripted public feeds) is run by refresh_release.py under polling_policy.py;
this script only reports its health. Tiers B (Wi via Claude), C (documents read by
Claude) and D (AI text after data changes) are put on a queue that the Claude routine
(updates/ROUTINE.md) consumes and closes with --done / --fail.

    python3 scripts/update_scheduler.py                       # dry run: what is due
    python3 scripts/update_scheduler.py --run --watch         # cloud job: queue + watchers
    python3 scripts/update_scheduler.py --queue               # queue with registry details (JSON)
    python3 scripts/update_scheduler.py --done ID --note "..."
    python3 scripts/update_scheduler.py --fail ID --note "..."
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import ssl
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
UPD = ROOT / 'updates'
REGISTRY = UPD / 'registry.json'
STATE = UPD / 'state.json'
REPORT = UPD / 'last-run.md'
VN = ZoneInfo('Asia/Ho_Chi_Minh')
DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
TIERS = {'A', 'B', 'C', 'D', 'static'}
MAX_SEEN = 3000
MAX_SIGNALS = 20
STUCK_AFTER = 3            # failed routine attempts before the item is flagged
A_REMIND_DAYS = 7          # repeat "still broken" alerts for a tier-A source weekly


# ---------- schedule ----------

def _at(d: date, hhmm: str) -> datetime:
    h, m = map(int, hhmm.split(':'))
    return datetime.combine(d, time(h, m), VN)


def _day_set(spec: str | None) -> set[int]:
    if spec in (None, '', 'mon-sun'):
        return set(range(7))
    out: set[int] = set()
    for part in spec.split(','):
        if '-' in part:
            a, b = (DAYS.index(x) for x in part.split('-'))
            out.update(range(a, b + 1))
        else:
            out.add(DAYS.index(part))
    return out


def _in_windows(d: date, windows) -> bool:
    md = d.strftime('%m-%d')
    return any(a <= md <= b if a <= b else md >= a or md <= b for a, b in windows)


def last_slot(sched: dict, now: datetime) -> datetime | None:
    """Latest scheduled time <= now; None for event-driven schedules."""
    kind, today = sched.get('type'), now.date()
    if kind == 'daily':
        days = _day_set(sched.get('days'))
        for back in range(8):
            d = today - timedelta(days=back)
            if d.weekday() in days and _at(d, sched['at']) <= now:
                return _at(d, sched['at'])
    elif kind == 'weekly':
        target = DAYS.index(sched['day'])
        for back in range(8):
            d = today - timedelta(days=back)
            if d.weekday() == target and _at(d, sched['at']) <= now:
                return _at(d, sched['at'])
    elif kind == 'monthly':
        first, last = sched['days']
        for back in range(40):
            d = today - timedelta(days=back)
            if first <= d.day <= last and _at(d, sched['at']) <= now:
                return _at(d, sched['at'])
    elif kind == 'window':
        sub = {'type': 'daily', 'at': sched['at'], 'days': sched.get('days')} if sched.get('every', 'daily') == 'daily' \
            else {'type': 'weekly', 'day': sched.get('day', 'mon'), 'at': sched['at']}
        slot = last_slot(sub, now)
        if slot and _in_windows(slot.date(), sched['windows']):
            return slot
    return None


def _parse(ts: str | None) -> datetime | None:
    if not ts:
        return None
    try:
        out = datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except ValueError:
        return None
    return out if out.tzinfo else out.replace(tzinfo=VN)


def browser_json(path: Path, prefix: str) -> dict:
    if not path.exists():
        return {}
    text = path.read_text(encoding='utf-8')
    return json.loads(text[len(prefix):].strip().removesuffix(';')) if text.startswith(prefix) else {}


def source_status() -> dict:
    """Tier-A source records keyed like the registry (daily feeds + Eximbank)."""
    daily = browser_json(ROOT / 'data/daily-data.js', 'window.SECTOR_DAILY = ').get('sources', {})
    bank = browser_json(ROOT / 'data/bank-public-data.js', 'window.BANK_PUBLIC_DATA = ')
    out = dict(daily)
    if bank:
        out['bank_eximbank'] = bank
    return out


def data_changed_since(keys: list[str], since: datetime | None, sources: dict) -> list[str]:
    changed = []
    for key in keys:
        at = _parse(sources.get(key, {}).get('changed_at'))
        if at and (since is None or at > since):
            changed.append(key)
    return changed


def is_due(item: dict, st: dict, state: dict, now: datetime, sources: dict) -> tuple[bool, str]:
    sched = item['schedule']
    kind = sched.get('type')
    done = _parse(st.get('lastSuccess'))
    signal = (bool(st.get('signals')), 'watcher báo có công bố mới')
    if kind in ('policy', 'none'):
        return False, ''
    if not done and not st.get('lastAttempt'):
        # Watchers only baseline on their first fetch, so documents published before the
        # registry existed would be missed; review every item once.
        return True, 'lần đầu: rà soát số đang hiển thị'
    if kind == 'watch':
        return signal
    if kind in ('after', 'data') and done and now - done < timedelta(days=sched.get('minDays', 0)):
        return signal
    if kind == 'after':
        floor = datetime.min.replace(tzinfo=VN)
        deps = [d for d in sched['items'] if (_parse(state['items'].get(d, {}).get('lastSuccess')) or floor) > (done or floor)]
        return (True, 'sau ' + ', '.join(deps)) if deps else signal
    if kind == 'data':
        changed = data_changed_since(sched['sources'], done, sources)
        return (True, 'số liệu nền đổi: ' + ', '.join(changed)) if changed else signal
    slot = last_slot(sched, now)
    if slot and (not done or done < slot):
        return True, f'lịch {slot:%d/%m %H:%M}'
    return signal


# ---------- watchers ----------

ANCHOR = re.compile(r'<a\b[^>]*href\s*=\s*["\']([^"\'#]+)["\'][^>]*>(.*?)</a>', re.I | re.S)
TAG = re.compile(r'<[^>]+>')


def fetch(url: str, timeout: int = 40) -> tuple[int, str, str]:
    """GET with a browser UA. Some Vietnamese public sites ship broken TLS chains, so a
    certificate failure retries unverified: watchers only read public listing pages."""
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; FinSuccessDashboardBot/1.0)',
                                               'Accept-Language': 'vi,en;q=0.8'})
    for ctx in (None, ssl._create_unverified_context()):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as res:
                return res.status, res.read().decode(res.headers.get_content_charset() or 'utf-8', 'replace'), ''
        except ssl.SSLError as exc:
            err = f'SSL: {exc}'
            continue
        except urllib.error.HTTPError as exc:
            return exc.code, '', f'HTTP {exc.code}'
        except Exception as exc:  # network errors are recorded, never fatal
            if isinstance(getattr(exc, 'reason', None), ssl.SSLError):
                err = f'SSL: {exc.reason}'
                continue
            return 0, '', f'{type(exc).__name__}: {exc}'[:200]
    return 0, '', err


def _sha(text: str) -> str:
    return hashlib.sha1(text.encode()).hexdigest()[:16]


def _clean(text: str) -> str:
    text = re.sub(r'<!\[CDATA\[(.*?)\]\]>', r'\1', text, flags=re.S)
    return re.sub(r'\s+', ' ', html.unescape(TAG.sub(' ', text))).strip()


def fingerprints(kind: str, body: str, match: str | None = None, spec: dict | None = None) -> dict[str, str]:
    """Items visible on a listing page: {hash: label}. A new hash = a new publication.

    kinds: links (<a> titles), rss (<item> title+link), hash (whole file, e.g. a data zip),
    json (spec.list = dotted path to the list, spec.title = label field, spec.fields = identity
    fields; without spec.list every dict with a title-like key is an item)."""
    items: dict[str, str] = {}
    spec = spec or {}
    pattern = re.compile(match, re.I) if match else None
    if kind == 'hash':
        return {_sha(body): 'tệp dữ liệu đổi nội dung'}
    if kind == 'rss':
        for block in re.findall(r'<item\b.*?</item>', body, re.S | re.I):
            title = re.search(r'<title[^>]*>(.*?)</title>', block, re.S | re.I)
            link = re.search(r'<link[^>]*>(.*?)</link>', block, re.S | re.I)
            label, href = _clean(title.group(1)) if title else '', _clean(link.group(1)) if link else ''
            if label and (not pattern or pattern.search(label)):
                items[_sha(f'{href}|{label}')] = f'{label[:140]} — {href}'
        return items
    if kind == 'json':
        try:
            data = json.loads(body)
        except ValueError:
            return items
        if spec.get('list'):
            rows = data
            for part in spec['list'].split('.'):
                rows = rows.get(part, []) if isinstance(rows, dict) else []
            title_key = spec.get('title', 'title')
            for row in rows if isinstance(rows, list) else []:
                label = str(row.get(title_key) or '') if isinstance(row, dict) else ''
                if not label or (pattern and not pattern.search(label)):
                    continue
                ident = json.dumps([row.get(f) for f in spec.get('fields') or [title_key]], ensure_ascii=False, default=str)
                items[_sha(ident)] = label[:160]
            return items

        def walk(node):
            if isinstance(node, dict):
                title = next((str(node[k]) for k in ('title', 'Title', 'name', 'Name', 'TieuDe') if node.get(k)), None)
                if title and (not pattern or pattern.search(title)):
                    key = json.dumps(node, sort_keys=True, ensure_ascii=False)[:2000]
                    items[hashlib.sha1(key.encode()).hexdigest()[:16]] = title[:160]
                for v in node.values():
                    walk(v)
            elif isinstance(node, list):
                for v in node:
                    walk(v)
        walk(data)
        return items
    for href, text in ANCHOR.findall(body):
        label = _clean(text)
        if len(label) < 20 or (pattern and not pattern.search(label)):
            continue  # menus/buttons are short; publication titles are long
        items[_sha(f'{href}|{label}')] = f'{label[:140]} — {href}'
    return items


def run_watchers(reg: dict, state: dict, now: datetime, only: set[str] | None, fetcher=fetch) -> tuple[list[str], list[str]]:
    lines, alerts = [], []
    today = now.date().isoformat()
    for w in reg.get('watchers', []):
        if w.get('status') in ('todo', 'blocked') or (only and w['id'] not in only):
            continue
        ws = state['watchers'].setdefault(w['id'], {})
        status, body, error = fetcher(w['url'])
        if status != 200 or not body:
            ws['lastError'] = error or f'HTTP {status}'
            if ws.get('alertedOn') != today:
                ws['alertedOn'] = today
                alerts.append(f"⚠️ Watcher {w['id']} không đọc được trang ({ws['lastError']})")
            lines.append(f"⚠️ watcher {w['id']}: {ws['lastError']}")
            continue
        seen_now = fingerprints(w.get('kind', 'links'), body, w.get('match'), w)
        # No match for the filter is normal; an unfiltered empty page means a redesign or a
        # blocked response, which must not reset the baseline.
        if not seen_now and not (w.get('match') and fingerprints(w.get('kind', 'links'), body, None, w)):
            ws['lastError'] = 'không thấy mục nào trên trang'
            if ws.get('alertedOn') != today:
                ws['alertedOn'] = today
                alerts.append(f"⚠️ Watcher {w['id']}: trang không còn mục nào khớp, kiểm lại cấu hình")
            lines.append(f"⚠️ watcher {w['id']}: {ws['lastError']}")
            continue
        ws.pop('lastError', None)
        ws.pop('alertedOn', None)
        if ws.get('seen') is None:  # first fetch only records a baseline
            ws['seen'] = list(seen_now)[:MAX_SEEN]
            lines.append(f"watcher {w['id']}: lập baseline {len(seen_now)} mục")
            continue
        before = set(ws['seen'])
        new = {k: v for k, v in seen_now.items() if k not in before}
        if not new:
            continue
        ws['seen'] = (list(new) + ws['seen'])[:MAX_SEEN]
        ws['lastNew'] = now.isoformat(timespec='seconds')
        for item in reg['items']:
            if w['id'] in item.get('watch', []):
                st = state['items'].setdefault(item['id'], {})
                st['signals'] = (st.get('signals', []) + [{'watcher': w['id'], 'seenAt': ws['lastNew'], 'what': v} for v in new.values()])[-MAX_SIGNALS:]
        lines.append(f"🆕 {w['id']}: {len(new)} mục mới — " + '; '.join(list(new.values())[:3]))
    return lines, alerts


# ---------- queue ----------

def load_state() -> dict:
    state = json.loads(STATE.read_text(encoding='utf-8')) if STATE.exists() else {}
    for key, empty in (('items', {}), ('watchers', {}), ('queue', [])):
        state.setdefault(key, empty)
    return state


def enqueue(state: dict, item: dict, reason: str, now: datetime) -> None:
    st = state['items'].setdefault(item['id'], {})
    signals = st.pop('signals', [])
    entry = next((q for q in state['queue'] if q['id'] == item['id']), None)
    if entry is None:
        entry = {'id': item['id'], 'tier': item['tier'], 'title': item['title'],
                 'since': now.isoformat(timespec='seconds'), 'reasons': [], 'signals': []}
        state['queue'].append(entry)
    entry['reasons'] = sorted(set(entry['reasons'] + [reason]))
    entry['signals'] = (entry['signals'] + signals)[-MAX_SIGNALS:]


def close(state: dict, item_id: str, ok: bool, note: str, now: datetime) -> str:
    st = state['items'].setdefault(item_id, {})
    stamp = now.isoformat(timespec='seconds')
    st['lastAttempt'] = stamp
    if ok:
        state['queue'] = [q for q in state['queue'] if q['id'] != item_id]
        st.update(lastSuccess=stamp, lastNote=note)
        for key in ('lastError', 'attempts', 'stuck'):
            st.pop(key, None)
        return f'✅ {item_id}: {note}'
    st['lastError'] = note[:600]
    st['attempts'] = st.get('attempts', 0) + 1
    if st['attempts'] >= STUCK_AFTER:
        st['stuck'] = True
    return f"❌ {item_id} (lần {st['attempts']}): {note[:300]}"


def a_health(reg: dict, state: dict, now: datetime, sources: dict) -> tuple[list[str], list[str]]:
    """Long-broken tier-A feeds: refresh_release only alerts on the transition, so remind weekly."""
    lines, alerts = [], []
    for item in reg['items']:
        if item['tier'] != 'A':
            continue
        st = state['items'].setdefault(item['id'], {})
        broken = [k for k in item.get('sources', []) if sources.get(k, {}).get('status') == 'error']
        if not broken:
            st.pop('brokenSince', None)
            st.pop('alertedOn', None)
            continue
        since = st.setdefault('brokenSince', now.date().isoformat())
        days = (now.date() - date.fromisoformat(since)).days
        lines.append(f"❌ {item['id']} lỗi {days} ngày: " + ', '.join(broken))
        last = st.get('alertedOn')
        if days and (not last or (now.date() - date.fromisoformat(last)).days >= A_REMIND_DAYS):
            st['alertedOn'] = now.date().isoformat()
            errors = '; '.join(f"{k}: {str(sources[k].get('error') or '')[:100]}" for k in broken)
            alerts.append(f"❌ Nguồn tự động vẫn lỗi {days} ngày, web giữ số cũ — {item['title']} ({errors})")
    return lines, alerts


def queue_details(reg: dict, state: dict) -> list[dict]:
    items = {i['id']: i for i in reg['items']}
    out = []
    for q in state['queue']:
        item = items.get(q['id'], {})
        st = state['items'].get(q['id'], {})
        out.append({**q, **{k: item.get(k) for k in ('where', 'source', 'how', 'gates', 'wiBlocks', 'sources') if item.get(k)},
                    'lastSuccess': st.get('lastSuccess'), 'lastError': st.get('lastError'), 'attempts': st.get('attempts', 0)})
    return out


# ---------- main ----------

def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--run', action='store_true', help='queue due items and write state')
    ap.add_argument('--watch', action='store_true', help='check watcher pages')
    ap.add_argument('--only', help='comma-separated item/watcher ids')
    ap.add_argument('--now', help='simulate a time (ISO, Vietnam time)')
    ap.add_argument('--queue', action='store_true', help='print the queue with registry details as JSON')
    ap.add_argument('--done', metavar='ID', help='close a queue item after a successful update or a check with nothing new')
    ap.add_argument('--fail', metavar='ID', help='record a failed routine attempt; the item stays queued')
    ap.add_argument('--note', default='', help='what changed / why it failed (shown in the report)')
    ap.add_argument('--notify-file', type=Path, help='append alerts and new-publication lines for scripts/notify.py')
    args = ap.parse_args(argv)

    reg = json.loads(REGISTRY.read_text(encoding='utf-8'))
    state = load_state()
    before = json.dumps({k: v for k, v in state.items() if k != 'updatedAt'}, sort_keys=True)
    now = datetime.fromisoformat(args.now).replace(tzinfo=VN) if args.now else datetime.now(VN)
    only = set(args.only.split(',')) if args.only else None
    lines: list[str] = []
    alerts: list[str] = []

    if args.queue:
        print(json.dumps(queue_details(reg, state), ensure_ascii=False, indent=1))
        return 0
    if args.done or args.fail:
        item_id = args.done or args.fail
        if item_id not in {i['id'] for i in reg['items']}:
            print(f'Unknown item: {item_id}', file=sys.stderr)
            return 2
        line = close(state, item_id, bool(args.done), args.note or ('cập nhật xong' if args.done else 'lỗi'), now)
        lines.append(line)
        if args.fail and state['items'][item_id].get('stuck'):
            alerts.append(f"❌ Routine thất bại {state['items'][item_id]['attempts']} lần với {item_id}: {args.note[:200]}")
    else:
        sources = source_status()
        if args.watch:
            more, warn = run_watchers(reg, state, now, only)
            lines += more
            alerts += warn
        if args.run:
            more, warn = a_health(reg, state, now, sources)
            lines += more
            alerts += warn
        for item in reg['items']:
            if item['tier'] not in ('B', 'C', 'D') or item.get('status') in ('todo', 'blocked') or (only and item['id'] not in only):
                continue
            st = state['items'].setdefault(item['id'], {})
            due, reason = is_due(item, st, state, now, sources)
            if not due:
                continue
            lines.append(f"→ hàng chờ [{item['tier']}] {item['id']}: {reason}")
            if args.run:
                enqueue(state, item, reason, now)

    queue = state['queue']
    summary = [f'Lịch cập nhật — {now:%d/%m/%Y %H:%M}'] + lines
    if queue:
        summary.append(f'Hàng chờ Claude: {len(queue)} mục — ' + ', '.join(q['id'] for q in queue[:10]))
    print('\n'.join(summary) if lines or queue else 'Không có mục nào đến hạn.')
    for a in alerts:
        print(a, file=sys.stderr)

    write = args.run or args.watch or args.done or args.fail
    after = json.dumps({k: v for k, v in state.items() if k != 'updatedAt'}, sort_keys=True)
    if write and after != before:  # avoid empty commits from the twice-daily job
        state['updatedAt'] = now.isoformat(timespec='seconds')
        STATE.write_text(json.dumps(state, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        REPORT.write_text('# ' + summary[0] + '\n\n' + '\n'.join(f'- {l}' for l in summary[1:]) + '\n'
                          + ('\n## Cảnh báo\n\n' + '\n'.join(f'- {a}' for a in alerts) + '\n' if alerts else ''), encoding='utf-8')
    if args.notify_file:
        notice = alerts + [l for l in lines if l.startswith('🆕')]
        if notice:
            with args.notify_file.open('a', encoding='utf-8') as fh:
                fh.write(('\n' if args.notify_file.exists() and args.notify_file.stat().st_size else '') + '\n'.join(notice) + '\n')
    return 0  # alerts never block publishing of healthy feeds


if __name__ == '__main__':
    raise SystemExit(main())
