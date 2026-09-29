"""Singapore product cracks against Dubai spot from KNOC Opinet public tables."""
from __future__ import annotations

import datetime as dt
import hashlib
import re
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = 'https://www.opinet.co.kr/'
PAGES = {'product': 'glopopdSelect.do', 'crude': 'gloptotSelect.do'}
FORMS = {'product': 'glopopdVO', 'crude': 'glopcoilVO'}
DATE_RE = re.compile(r'^(\d{2})년(\d{2})월(\d{2})일$')


def parse_table(html: str, kind: str) -> dict[str, dict[str, float]]:
    soup = BeautifulSoup(html, 'html.parser')
    form = soup.find('form', id=FORMS[kind])
    body = form.find('tbody', id='tbody2') if form else None
    if body is None or '$/Bbl' not in soup.get_text(' ', strip=True):
        raise ValueError('Opinet USD/barrel table or form missing')
    # KNOC's displayed USD table columns: product = 95RON, 92RON, kerosene,
    # 0.001% gasoil, 0.05% gasoil, fuel oil, naphtha; crude = Dubai, Brent, WTI.
    fields = {'product': {2: 'gasoline_92', 4: 'gasoil_10ppm'},
              'crude': {1: 'dubai'}}[kind]
    out = {}
    for tr in body.find_all('tr'):
        cells = [td.get_text(' ', strip=True) for td in tr.find_all('td')]
        if not cells:
            continue
        match = DATE_RE.fullmatch(cells[0])
        if not match:
            raise ValueError('Unexpected Opinet date format')
        date = f'20{match[1]}-{match[2]}-{match[3]}'
        values = {}
        for idx, name in fields.items():
            if idx >= len(cells):
                raise ValueError('Opinet price column missing')
            if cells[idx] in ('', '-'):
                break
            value = float(cells[idx].replace(',', ''))
            if value == 0:  # KNOC occasionally uses zero as a missing quote.
                break
            if not 0 < value < 1000:
                raise ValueError('Opinet price outside expected USD/barrel range')
            values[name] = value
        if len(values) == len(fields):
            if date in out:
                raise ValueError('Duplicate Opinet date')
            out[date] = values
    if not out:
        raise ValueError('No Opinet prices in response')
    return out


def query(session: requests.Session, kind: str, start: dt.date, end: dt.date):
    url = urljoin(BASE, PAGES[kind])
    landing = session.get(url, timeout=30)
    landing.raise_for_status()
    form = BeautifulSoup(landing.text, 'html.parser').find('form', id=FORMS[kind])
    if form is None:
        raise ValueError('Opinet query form missing')
    payload = []
    skip = {'STDDATE', 'ENDDATE', 'STA_Y', 'STA_M', 'STA_D', 'END_Y', 'END_M', 'END_D',
            'TERM', 'HOLIDAY_YN', 'SEL_DIV'}
    for element in form.find_all(['input', 'select']):
        name = element.get('name')
        if not name or name in skip:
            continue
        if element.name == 'input':
            if element.get('type') in ('radio', 'checkbox') and not element.has_attr('checked'):
                continue
            value = element.get('value', '')
        else:
            option = element.find('option', selected=True) or element.find('option')
            value = option.get('value', '') if option else ''
        payload.append((name, value))
    payload.extend([('TERM', 'D'), ('HOLIDAY_YN', 'N'), ('SEL_DIV', 'div_dar'),
                    ('STDDATE', start.strftime('%Y%m%d')), ('ENDDATE', end.strftime('%Y%m%d'))])
    for prefix, date in (('STA', start), ('END', end)):
        payload.extend([(prefix + '_Y', str(date.year)), (prefix + '_M', date.strftime('%m')),
                        (prefix + '_D', date.strftime('%d'))])
    response = session.post(url, data=payload, timeout=45)
    response.raise_for_status()
    return parse_table(response.text, kind), response.content


def load(old_records=None, today=None):
    today = today or dt.date.today()
    last = dt.date.fromisoformat(old_records[-1]['date']) if old_records else None
    start = max(dt.date(2024, 9, 1), last - dt.timedelta(days=14)) if last else today - dt.timedelta(days=760)
    if start > today:
        raise ValueError('Opinet cache date is in the future')
    with requests.Session() as session:
        session.headers.update({'User-Agent': 'FinSuccessDashboard/2.0 (public data research)'})
        prices = {}
        raw_pages = []
        cursor = start
        while cursor <= today:
            end = min(cursor + dt.timedelta(days=89), today)
            product, product_raw = query(session, 'product', cursor, end)
            crude, crude_raw = query(session, 'crude', cursor, end)
            prices.update({date: {**values, **crude[date]} for date, values in product.items()
                           if date in crude})
            raw_pages.extend([product_raw, crude_raw])
            cursor = end + dt.timedelta(days=1)
    records = []
    for date, value in sorted(prices.items()):
        if date > today.isoformat():
            raise ValueError('Future Opinet observation')
        records.append({'date': date, 'dubai': value['dubai'],
                        'gasoline_92': value['gasoline_92'], 'gasoil_10ppm': value['gasoil_10ppm'],
                        'gasoline_crack': round(value['gasoline_92'] - value['dubai'], 2),
                        'gasoil_crack': round(value['gasoil_10ppm'] - value['dubai'], 2)})
    if len(records) < (1 if last else 300):
        raise ValueError('Opinet history unexpectedly short')
    if old_records:
        records = list({row['date']: row for row in [*old_records, *records]}.values())
        records.sort(key=lambda row: row['date'])
    source = {'source_url': urljoin(BASE, PAGES['product']), 'source_name': 'KNOC Opinet',
              'observation_frequency': 'daily trading day', 'publication_frequency': 'Tue-Sat (T+1)',
              'unit': 'USD/barrel', 'records': records,
              'method': 'Singapore 92 RON gasoline and 0.001% sulfur gasoil minus Dubai spot, same date'}
    raw = b'\n<!-- OPINET PAGE BREAK -->\n'.join(raw_pages)
    source['raw_sha256'] = hashlib.sha256(raw).hexdigest()
    return source, raw
