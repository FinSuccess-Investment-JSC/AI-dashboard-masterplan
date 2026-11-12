#!/usr/bin/env python3
"""Build data/power-policy.js (window.POWER_POLICY) from data/power-policy.json after validating it.

data/power-policy.json is the single source for the Điện tab Policy / Tax / Trade
(assets/power-policy.js). Add or update a policy there, then run:
    python3 scripts/build_power_policy.py
The build refuses to write when a record breaks the rules below, so an expired policy
cannot be shown as in force and a chart value cannot appear without opened evidence.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data' / 'power-policy.json'
OUT = ROOT / 'data' / 'power-policy.js'
EVIDENCE = ROOT / 'data' / 'power' / 'evidence.json'

REQUIRED = ['policy_id', 'policy_name', 'issuing_authority', 'document_number', 'issue_date', 'effective_date',
            'expiration_date', 'policy_status', 'policy_category', 'applicable_technologies', 'applicable_assets',
            'previous_regulation', 'regulatory_change', 'impact_mechanism', 'financial_drivers', 'exposed_companies',
            'monitoring_indicators', 'primary_source_url', 'last_verified_at', 'data_confidence',
            'direction', 'impact_level', 'impact_horizon', 'sources']
STATUS = {'Draft', 'Issued', 'Effective', 'Expired', 'Superseded'}
DIRECTION = {'Positive', 'Negative', 'Mixed', 'Uncertain'}
LEVEL = {'High', 'Medium', 'Low', 'nq'}
HORIZON = {'short', 'medium', 'long'}
EXPOSURE = {'direct', 'indirect', 'potential', 'none'}
CONFIDENCE = {'High', 'Medium', 'Low', 'Unverified'}
DRIVERS = {'revenue', 'cost', 'capex', 'cashflow', 'receivables', 'volume'}
CAL_STATUS = {'Upcoming', 'Effective', 'Completed', 'Delayed', 'Superseded'}
# 18 mã theo dõi ở tab Tổng quan của trang Điện.
TICKERS = {'POW', 'NT2', 'PPC', 'QTP', 'HND', 'BTP', 'REE', 'VSH', 'CHP', 'SBA', 'TMP', 'SHP', 'GEG', 'HDG', 'TTA', 'PC1', 'TV2', 'GEX'}
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def digits(text):
    return re.sub(r'[.,\s]', '', str(text))


def validate(data, evidence):
    errors = []
    as_of = data.get('as_of', '')
    if not DATE.match(as_of):
        errors.append('as_of phải dạng YYYY-MM-DD')
    groups = {g['id'] for g in data.get('groups', [])}
    techs = {t['id'] for t in data.get('technologies', [])}
    ids = set()
    for p in data.get('policies', []):
        pid = p.get('policy_id', '?')
        for k in REQUIRED:
            if k not in p:
                errors.append(f'{pid}: thiếu {k}')
        if pid in ids:
            errors.append(f'{pid}: trùng policy_id')
        ids.add(pid)
        for k in ('issue_date', 'effective_date', 'expiration_date', 'last_verified_at'):
            v = p.get(k, '')
            if v and not DATE.match(v):
                errors.append(f'{pid}: {k} "{v}" không đúng YYYY-MM-DD')
        st = p.get('policy_status')
        if st not in STATUS:
            errors.append(f'{pid}: policy_status lạ {st}')
        if p.get('expiration_date') and p['expiration_date'] < as_of and st not in ('Expired', 'Superseded'):
            errors.append(f'{pid}: đã hết hiệu lực {p["expiration_date"]} nhưng trạng thái {st}')
        if st == 'Effective' and p.get('effective_date') and p['effective_date'] > as_of:
            errors.append(f'{pid}: Effective nhưng ngày hiệu lực {p["effective_date"]} sau {as_of}')
        if p.get('policy_category') not in groups:
            errors.append(f'{pid}: nhóm lạ {p.get("policy_category")}')
        for t in p.get('applicable_technologies', []):
            if t not in techs:
                errors.append(f'{pid}: loại nguồn lạ {t}')
        if p.get('direction') not in DIRECTION:
            errors.append(f'{pid}: direction lạ')
        if p.get('impact_level') not in LEVEL:
            errors.append(f'{pid}: impact_level lạ')
        if p.get('impact_level') != 'nq' and not p.get('impact_basis'):
            errors.append(f'{pid}: có mức tác động nhưng thiếu impact_basis')
        if p.get('impact_horizon') not in HORIZON:
            errors.append(f'{pid}: impact_horizon lạ')
        if p.get('data_confidence') not in CONFIDENCE:
            errors.append(f'{pid}: data_confidence lạ')
        for dr in p.get('financial_drivers', []):
            if dr not in DRIVERS:
                errors.append(f'{pid}: financial_driver lạ {dr}')
        for c in p.get('exposed_companies', []):
            if c.get('ticker') not in TICKERS:
                errors.append(f'{pid}: mã ngoài danh sách theo dõi {c.get("ticker")}')
            if c.get('type') not in EXPOSURE:
                errors.append(f'{pid}: loại tác động lạ {c.get("type")}')
        if not p.get('sources'):
            errors.append(f'{pid}: không có nguồn')
        for s in p.get('sources', []):
            if not str(s.get('url', '')).startswith(('http://', 'https://')):
                errors.append(f'{pid}: link nguồn hỏng {s}')
        if not str(p.get('primary_source_url', '')).startswith(('http://', 'https://')):
            errors.append(f'{pid}: primary_source_url hỏng')
    for key, m in data.get('modules', {}).items():
        for ref in m.get('policies', []):
            if ref not in ids:
                errors.append(f'module {key}: không có chính sách {ref}')
        for s in m.get('sources', []):
            if not str(s.get('url', '')).startswith(('http://', 'https://')):
                errors.append(f'module {key}: link nguồn hỏng')
    for c in data.get('calendar', []):
        if c.get('status') not in CAL_STATUS:
            errors.append(f'lịch: trạng thái lạ {c.get("status")}')
        if c.get('date') and not DATE.match(c['date']):
            errors.append(f'lịch: ngày sai {c["date"]}')
        if c.get('policy_id') and c['policy_id'] not in ids:
            errors.append(f'lịch: không có chính sách {c["policy_id"]}')
    # Mỗi trần khung giá trên chart phải có trong đoạn trích đã mở của data/power/evidence.json.
    quotes = ''.join(digits(e.get('quote', '')) for e in evidence if e.get('status') == 'match')
    for f in data.get('price_frameworks', []):
        if digits(f['ceiling']) not in quotes and digits(f'{f["ceiling"]:.2f}') not in quotes:
            errors.append(f'khung giá {f["label"]} {f["region"]} {f["year"]}: {f["ceiling"]} chưa có trong evidence')
    for r in data.get('retail_tariff', []):
        if not str(r.get('url', '')).startswith(('http://', 'https://')):
            errors.append(f'giá bán lẻ {r.get("date")}: thiếu link')
    return errors


def main():
    data = json.loads(SRC.read_text(encoding='utf-8'))
    evidence = json.loads(EVIDENCE.read_text(encoding='utf-8'))
    errors = validate(data, evidence)
    if errors:
        print('\n'.join(errors))
        sys.exit(f'{len(errors)} lỗi trong {SRC.relative_to(ROOT)}; không ghi {OUT.name}')
    OUT.write_text('window.POWER_POLICY=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')  # LF cả trên Windows để ?v= khớp bản trên web
    print(f'{len(data["policies"])} chính sách, {len(data["price_frameworks"])} mức khung giá → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
