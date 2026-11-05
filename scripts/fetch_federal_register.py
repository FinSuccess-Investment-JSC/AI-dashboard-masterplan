#!/usr/bin/env python3
"""US Federal Register notices for the two Vietnamese seafood AD orders -> data/raw/public/federal-register-por.json.

API: https://www.federalregister.gov/api/v1/documents.json?conditions[term]=...&order=newest (JSON, no key).
The term search is loose, so every result is filtered on the exact title phrase and the agency
(International Trade Administration). Each notice is classified (initiation / preliminary / final / continuation /
court decision / rescission) from its title. Offline: last-good file kept when the API fails.
"""
import datetime as dt
import json
import re
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/raw/public/federal-register-por.json'
API = 'https://www.federalregister.gov/api/v1/documents.json'
CASES = {
    'pangasius': {'phrase': 'Certain Frozen Fish Fillets From the Socialist Republic of Vietnam', 'case': 'A-552-801', 'name': 'CBPG cá tra phi lê đông lạnh'},
    'shrimp': {'phrase': 'Certain Frozen Warmwater Shrimp From the Socialist Republic of Vietnam', 'case': 'A-552-802', 'name': 'CBPG tôm nước ấm đông lạnh'},
}
AGENCY = 'International Trade Administration'
FIELDS = ['title', 'publication_date', 'html_url', 'document_number', 'type', 'abstract', 'agencies', 'docket_ids']
KINDS = [('initiation', r'initiation'), ('final', r'final results'), ('preliminary', r'preliminary results'),
         ('continuation', r'continuation'), ('court', r'court decision'), ('rescission', r'rescission|rescinding'),
         ('changed', r'changed circumstances'), ('amended', r'amended')]


def http(url):
    last = None
    for i in range(3):
        try:
            return subprocess.run(['curl', '-sfL', '-m', '60', url], check=True, capture_output=True, text=True).stdout
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(3 * (i + 1))
    raise RuntimeError(f'{url}: {last}')


def query(phrase):
    q = [('conditions[term]', f'"{phrase}"'), ('conditions[agencies][]', 'international-trade-administration'), ('order', 'newest'), ('per_page', '100')]
    q += [('fields[]', f) for f in FIELDS]
    return json.loads(http(API + '?' + urllib.parse.urlencode(q)))


def classify(title):
    t = title.lower()
    kinds = [k for k, rx in KINDS if re.search(rx, t)]
    m = re.search(r'(\d{4})-(\d{4})\s*$', title.strip())
    return kinds, (m.group(0) if m else None)


def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    cases, errors = dict(old.get('cases') or {}), {}
    for key, c in CASES.items():
        try:
            j = query(c['phrase'])
            pat = re.compile(re.escape(c['phrase']).replace('From', '[Ff]rom').replace('Socialist', '[Ss]ocialist'), re.I)
            docs = []
            for d in j.get('results', []):
                if not pat.search(d.get('title', '')) or not any(AGENCY in (a.get('name') or '') for a in d.get('agencies', [])):
                    continue
                kinds, period = classify(d['title'])
                docs.append({'date': d['publication_date'], 'number': d['document_number'], 'title': d['title'], 'url': d['html_url'],
                             'kinds': kinds, 'period': period, 'abstract': (d.get('abstract') or '')[:600]})
            docs.sort(key=lambda x: x['date'], reverse=True)
            cases[key] = {**c, 'count': j.get('count'), 'documents': docs}
        except Exception as e:  # noqa: BLE001
            errors[key] = str(e)[:200]
    out = {'source': 'Federal Register (Bộ Thương mại Mỹ – ITA)', 'url': 'https://www.federalregister.gov/', 'api': API,
           'checked': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'errors': errors, 'cases': cases}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('federal-register:', {k: (len(v['documents']), v['documents'][0]['date'] if v['documents'] else None) for k, v in cases.items()}, errors or '')
    return 0


if __name__ == '__main__':
    sys.exit(main())
