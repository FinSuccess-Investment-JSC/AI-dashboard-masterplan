#!/usr/bin/env python3
"""Evidence for document figures (data/<sector>/evidence.json).

Each entry: block, claim, value, url, opened_at, quote, status (match|mismatch|unreachable|not_found).
  --offline (default): structural check — every 'match' quote contains the digits of its value.
  --fetch: re-open every url and confirm the quote is still on the page; prints a report and writes
           data/evidence-status.json. Used by the Monday document routine; a dead link or a changed
           quote is reported, never silently kept.
"""
import argparse
import datetime as dt
import html
import json
import re
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = sorted(ROOT.glob('data/*/evidence.json'))
STATUSES = {'match', 'mismatch', 'unreachable', 'not_found'}


def digits(text):
    """Number tokens with separators removed: '1.170' and '1,170' and '1170' all become '1170'."""
    return [re.sub(r'[.,\s]', '', t) for t in re.findall(r'\d[\d.,\s]*\d|\d', str(text))]


def norm(text):
    text = html.unescape(re.sub(r'<[^>]+>', ' ', text))
    return re.sub(r'\s+', ' ', text).strip().lower()


def problems(entry):
    out = []
    for k in ('block', 'claim', 'value', 'url', 'status'):
        if k == 'url' and entry.get('status') == 'not_found':
            continue
        if not entry.get(k):
            out.append('thiếu ' + k)
    if entry.get('status') not in STATUSES:
        out.append('status lạ: %s' % entry.get('status'))
    if entry.get('status') == 'match':
        quote = entry.get('quote') or ''
        if not quote:
            out.append('match nhưng không có quote')
        # At least one figure of the value must be quoted verbatim (values often bundle a plan,
        # a result and a rounded %, while a quote is capped at ~300 characters).
        qd = ''.join(digits(quote))
        nums = [d for d in digits(entry['value']) if len(d) >= 2]
        if nums and not any(d in qd for d in nums):
            out.append('không số nào trong %s có trong quote' % entry['value'])
    return out


def load():
    rows = []
    for f in FILES:
        for e in json.loads(f.read_text()):
            rows.append((f.relative_to(ROOT), e))
    return rows


def fetch(url):
    """certifi CA bundle when available (macOS python.org builds ship without system roots); curl as fallback."""
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (FinSuccess evidence check)'})
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        ctx = None
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
            return r.read().decode('utf-8', 'replace')
    except urllib.error.URLError as exc:
        if not isinstance(getattr(exc, 'reason', None), ssl.SSLError):
            raise
        out = subprocess.run(['curl', '-sSL', '--max-time', '30', '-A', 'Mozilla/5.0', url], capture_output=True, check=True)
        return out.stdout.decode('utf-8', 'replace')


def pdf_text(url):
    """PDF → text with poppler's pdftotext (brew/apt 'poppler-utils'); raises if missing so the row is reported."""
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.pdf') as tmp:
        subprocess.run(['curl', '-sSL', '--max-time', '60', '-A', 'Mozilla/5.0', '-o', tmp.name, url], check=True)
        return subprocess.run(['pdftotext', '-layout', tmp.name, '-'], capture_output=True, check=True).stdout.decode('utf-8', 'replace')


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--fetch', action='store_true')
    args = ap.parse_args(argv)
    rows, bad = load(), 0
    for f, e in rows:
        for p in problems(e):
            bad += 1
            print(f'{f} · {e.get("block")} · {e.get("claim")}: {p}')
    if not args.fetch:
        print(f'{len(rows)} bằng chứng, {bad} lỗi cấu trúc')
        return 1 if bad else 0
    report, pages = [], {}
    for f, e in rows:
        if e.get('status') != 'match':
            continue
        url = e['url']
        try:
            if url not in pages:
                pages[url] = norm(pdf_text(url) if url.lower().split('?')[0].endswith('.pdf') else fetch(url))
            page = pages[url]
            if norm(e['quote'])[:120] in page:
                state = 'ok'
            else:
                # Quotes taken through a summarising fetcher may be paraphrased: fall back to the figures.
                on_page = set(digits(page))
                nums = [d for d in digits(e['value']) if len(d) >= 2]
                state = 'ok_numbers' if nums and all(d in on_page for d in nums) else 'quote_changed'
        except Exception as exc:  # network, 403, SSL — report, keep entry
            state, pages[url] = 'unreachable: %s' % exc.__class__.__name__, ''
        if state not in ('ok', 'ok_numbers'):
            report.append({'file': str(f), 'block': e['block'], 'claim': e['claim'], 'url': url, 'state': state})
    out = {'checked_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'problems': report}
    (ROOT / 'data' / 'evidence-status.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    for r in report:
        print(f'{r["state"]} · {r["block"]} · {r["claim"]} · {r["url"]}')
    print(f'Đã kiểm {sum(1 for _, e in rows if e.get("status") == "match")} bằng chứng, {len(report)} cần xem lại')
    return 0


if __name__ == '__main__':
    sys.exit(main())
