#!/usr/bin/env python3
"""Refresh public feeds and prepare a release only when observations change.

Each adapter owns its validation and last-good behavior. A failed adapter does not
prevent other sources from updating; its status transition is publishable.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'


def browser_json(path: Path, prefix: str):
    if not path.exists():
        return {}
    text = path.read_text()
    if not text.startswith(prefix):
        raise ValueError(f'Unexpected browser bundle: {path}')
    return json.loads(text[len(prefix):].strip().removesuffix(';'))


def signature(include_comparison: bool):
    daily = browser_json(DATA / 'daily-data.js', 'window.SECTOR_DAILY = ')
    bank = browser_json(DATA / 'bank-public-data.js', 'window.BANK_PUBLIC_DATA = ')
    state = {
        'daily': {key: (source.get('data_hash'), source.get('status'))
                  for key, source in daily.get('sources', {}).items()},
        'bank': (bank.get('data_hash'), bank.get('status')),
    }
    if include_comparison:
        comparison = json.loads((DATA / 'company-comparison.json').read_text()) if (DATA / 'company-comparison.json').exists() else {}
        state['comparison'] = [
            (company['symbol'], company.get('year', {}).get('end') if company.get('year') else None,
             company.get('year', {}).get('values') if company.get('year') else None,
             company.get('quarter', {}).get('end') if company.get('quarter') else None,
             company.get('quarter', {}).get('values') if company.get('quarter') else None,
             {key: value for key, value in (company.get('quote') or {}).items()
              if key in ('date', 'pe', 'pb', 'market_cap')},
             bool(company.get('errors')))
            for company in comparison.get('companies', [])
        ]
    return hashlib.sha256(json.dumps(state, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def source_states():
    daily = browser_json(DATA / 'daily-data.js', 'window.SECTOR_DAILY = ')
    bank = browser_json(DATA / 'bank-public-data.js', 'window.BANK_PUBLIC_DATA = ')
    states = {key: (source.get('data_hash'), source.get('status'), source.get('latest_observation'), source.get('error'))
              for key, source in daily.get('sources', {}).items()}
    states['bank_eximbank'] = (bank.get('data_hash'), bank.get('status'), bank.get('latest_observation'), bank.get('error'))
    return states


def notice(before: dict, after: dict, adapters: dict) -> str:
    """Short message for Zalo: only transitions, so one broken feed alerts once, not every run."""
    broke = [k for k, v in after.items() if v[1] == 'error' and before.get(k, (None, None))[1] != 'error']
    healed = [k for k, v in after.items() if v[1] != 'error' and before.get(k, (None, None))[1] == 'error']
    fresh = [f"{k} ({v[2]})" if v[2] else k for k, v in after.items() if v[0] != before.get(k, (None,))[0]]
    lines = []
    if broke:
        lines.append('Nguồn lỗi, giữ số cũ: ' + '; '.join(f"{k}: {str(after[k][3] or '')[:120]}" for k in broke))
    if healed:
        lines.append('Nguồn đã chạy lại bình thường: ' + ', '.join(healed))
    if fresh:
        lines.append('Đã cập nhật và publish: ' + ', '.join(fresh))
    failed = [name for name, code in adapters.items() if code not in (0, None)]
    if failed and not broke:
        lines.append('Adapter trả mã lỗi (xem log GitHub Actions): ' + ', '.join(failed))
    return '\n'.join(lines)


def main():
    cli = argparse.ArgumentParser()
    cli.add_argument('--comparison', action='store_true', help='Also check the public company tables')
    cli.add_argument('--prepare-release', action='store_true', help='Hash changed browser bundles into a new site release')
    cli.add_argument('--force-release', action='store_true', help='Prepare a release even if observations are unchanged')
    cli.add_argument('--notify-file', type=Path, help='Write a short change/error notice for scripts/notify.py')
    args = cli.parse_args()
    before = signature(args.comparison)
    states_before = source_states()
    results = {}
    polling_args = [] if args.force_release else ['--scheduled']
    for name, script in [('market', 'update_daily.py'), ('bank', 'update_bank.py')]:
        results[name] = subprocess.run([sys.executable, str(ROOT / 'scripts' / script), *polling_args], cwd=ROOT).returncode
    if args.comparison:
        results['comparison'] = subprocess.run([sys.executable, str(ROOT / 'scripts' / 'update_company_comparison.py')], cwd=ROOT).returncode
    after = signature(args.comparison)
    changed = before != after or args.force_release
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            output.write(f"changed={'true' if changed else 'false'}\n")
    if changed and args.prepare_release:
        version = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        subprocess.run([sys.executable, str(ROOT / 'scripts' / 'prepare_release.py'), '--version', version], cwd=ROOT, check=True)
    if args.notify_file:
        args.notify_file.write_text(notice(states_before, source_states(), results), encoding='utf-8')
    print(json.dumps({'changed': changed, 'adapters': results, 'prepared_release': changed and args.prepare_release}), flush=True)
    # One bad feed is recorded in its bundle; healthy feeds still advance.
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
