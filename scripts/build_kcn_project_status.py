#!/usr/bin/env python3
"""Kiểm và xuất trạng thái dự án KCN đã xác minh từ văn bản gốc cho trang Bat-dong-san-KCN.

  python scripts/build_kcn_project_status.py

Đầu vào: data/kcn/project-status.json (mỗi dự án: key theo khóa dự án của trang, milestone, loại văn bản, ngày, link).
Đầu ra: data/kcn-project-status.js (window.KCN_PROJECT_STATUS), nạp trước app/kcn-workspace.js. Trang dùng một nguồn trạng thái cho
Triển vọng, Nguồn cung và Quỹ đất. Dự án chỉ được nhắc tên/diện tích giữ milestone "unverified"; không suy mốc.
"""
import datetime as dt, json, sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/kcn/project-status.json'
OUT = ROOT / 'data/kcn-project-status.js'
MILESTONES = {'policy_approval', 'land_allocation', 'site_clearance', 'infrastructure', 'leasing', 'ready', 'unverified'}


def validate(d):
    errors, keys = [], set()
    for p in d['projects']:
        k = p.get('key')
        if not k or k in keys:
            errors.append(f'khóa thiếu hoặc trùng: {k}')
        keys.add(k)
        if p.get('milestone') not in MILESTONES:
            errors.append(f'{k}: milestone lạ {p.get("milestone")}')
        if p.get('milestone') != 'unverified':
            u = urlsplit(p.get('url') or '')
            if u.scheme != 'https' or not u.hostname:
                errors.append(f'{k}: mốc {p.get("milestone")} cần link https tới văn bản/công bố')
            if not p.get('doc_type'):
                errors.append(f'{k}: thiếu loại văn bản')
        if p.get('doc_date'):
            dt.date.fromisoformat(p['doc_date'])
        if p.get('ready_ha') is not None and not p.get('ready_basis'):
            errors.append(f'{k}: có diện tích sẵn sàng nhưng thiếu căn cứ (ready_basis)')
    for p in d['projects']:
        for s in p.get('same_as') or []:
            if s not in keys:
                errors.append(f'{p["key"]}: same_as trỏ tới khóa không có {s}')
    return errors


def main():
    d = json.loads(SRC.read_text(encoding='utf-8'))
    errors = validate(d)
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    OUT.write_text('window.KCN_PROJECT_STATUS = ' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(d['projects']), 'dự án;', {m: sum(p['milestone'] == m for p in d['projects']) for m in sorted(MILESTONES)})
    return 0


if __name__ == '__main__':
    sys.exit(main())
