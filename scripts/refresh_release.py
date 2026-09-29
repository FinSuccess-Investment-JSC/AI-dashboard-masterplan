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


def main():
    cli = argparse.ArgumentParser()
    cli.add_argument('--comparison', action='store_true', help='Also check the public company tables')
    cli.add_argument('--prepare-release', action='store_true', help='Hash changed browser bundles into a new site release')
    cli.add_argument('--force-release', action='store_true', help='Prepare a release even if observations are unchanged')
    args = cli.parse_args()
    before = signature(args.comparison)
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
    print(json.dumps({'changed': changed, 'adapters': results, 'prepared_release': changed and args.prepare_release}), flush=True)
    # One bad feed is recorded in its bundle; healthy feeds still advance.
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
