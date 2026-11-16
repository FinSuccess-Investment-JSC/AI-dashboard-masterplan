#!/usr/bin/env python3
"""Daily series for the Vận tải biển dashboard (16/11/2026).

  * BDI: CNBC chart API (.BADI), every session close for the last 12 months (the month-end series stays in
    scripts/fetch_markets.py). Unofficial endpoint; on failure the stored series is kept.
  * Shipping stocks PVT, VTO, VOS, VIP: VNDirect finfo stock_prices, adjusted close (adClose) from 2025-12-31.
    Today's row is skipped until 15:05 (session still open); zero-volume rows are skipped.
  * Baltic route TCE (Affinity Tanker Weekly PDFs via Hellenic Shipping News) is entered by hand with an evidence
    quote in data/shipping/evidence.json; this script keeps the stored 'tce' block unchanged.

    python3 scripts/fetch_shipping_daily.py   # writes data/shipping-daily-public-data.json/.js
"""
import html, json, re, subprocess
from datetime import date, datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/shipping-daily-public-data.json'
CNBC = 'https://ts-api.cnbc.com/harmony/app/charts/1Y.json?symbol=.BADI'
VND = 'https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date&q=code:{t}~date:gte:2025-12-31&size=400'
TICKERS = ['PVT', 'VTO', 'VOS', 'VIP']
HB = 'https://www.handybulk.com/baltic-dry-index/'
HB_MONTH = 'https://www.handybulk.com/baltic-dry-index/{y}/{m}/'
MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october',
          'november', 'december']
SUB = {'BCI': ('bci', 'Baltic Capesize Index'), 'BPI': ('bpi', 'Baltic Panamax Index'),
       'BSI': ('bsi', 'Baltic Supramax Index'), 'BHSI': ('bhsi', 'Baltic Handysize Index')}


COMPASS = 'https://compassmar.com/wp-content/uploads/{d:%Y/%m}/Compass-Weekly-Report-{d:%b}-{day}-{d:%y}.pdf'


def compass_reports(store):
    """BDTI/BCTI weekly from Compass Maritime Weekly Report PDFs (Mondays since 05/10/2026, when Wi stopped).
    Row 'BDTI  <this week> <last week> <last year>'; observation = the Friday before the report date.
    A value is 'suspect' when it moves >50% in a week or the next report's 'last week' column disagrees."""
    import tempfile
    reps = store.setdefault('reports', {})
    d, today = date(2026, 10, 5), date.today()
    while d <= today:
        key = d.isoformat()
        if key not in reps:
            url = COMPASS.format(d=d, day=d.day)
            with tempfile.TemporaryDirectory() as tmp:
                pdf = Path(tmp) / 'r.pdf'
                ok = subprocess.run(['curl', '-sfL', '-m', '60', '-A', 'Mozilla/5.0', '-o', str(pdf), url]).returncode == 0
                if ok:
                    txt = subprocess.run(['pdftotext', '-layout', str(pdf), '-'], capture_output=True, text=True).stdout
                    row = {'url': url, 'obs': (d - timedelta(days=3)).isoformat()}
                    for k in ('BDTI', 'BCTI'):
                        m = re.search(r'^\s*' + k + r'\s+(\d+)\s+(\d+)\s+(\d+)', txt, re.M)
                        if m:
                            row[k] = [int(x) for x in m.groups()]
                            row[k + '_line'] = re.sub(r'\s+', ' ', m.group(0).strip())
                    if 'BDTI' in row:
                        reps[key] = row
        d += timedelta(days=7)
    keys = sorted(reps)
    for k in ('BDTI', 'BCTI'):
        recs = []
        for i, rk in enumerate(keys):
            r = reps[rk]
            if k not in r:
                continue
            cur, prev, _ = r[k]
            nxt = reps[keys[i + 1]].get(k) if i + 1 < len(keys) else None
            why = []
            other = r.get('BCTI' if k == 'BDTI' else 'BDTI')
            if other and prev and other[1] and abs(other[0] / prev - 1) <= .5 < abs(cur / prev - 1) and \
                    abs(cur / other[1] - 1) <= .5:  # BDTI/BCTI rows swapped in the PDF
                recs.append({'date': r['obs'], 'value': other[0], 'url': r['url'], 'line': r[k + '_line'],
                             'swapped': 'PDF đảo dòng BDTI/BCTI; lấy số ở dòng ' + ('BCTI' if k == 'BDTI' else 'BDTI')})
                continue
            if prev and abs(cur / prev - 1) > .5:
                why.append(f'đổi {cur / prev - 1:+.0%} so tuần trước')
            if nxt and nxt[1] != cur and not reps[keys[i + 1]].get('swapped'):
                why.append(f'bản kế tiếp ghi tuần trước {nxt[1]}')
            recs.append({'date': r['obs'], 'value': cur, 'url': r['url'], 'line': r[k + '_line'],
                         **({'suspect': '; '.join(why)} if why else {})})
        store[k.lower()] = recs
    return store


EM = ('https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_INDUSTRY_INDEX&columns=REPORT_DATE,INDICATOR_VALUE'
      '&filter=(INDICATOR_ID%3D%22{id}%22)&sortColumns=REPORT_DATE&sortTypes=-1&pageSize=500&pageNumber={p}&source=WEB&client=WEB')
EM_IDS = {'bdti': 'EMI00107668', 'bcti': 'EMI00107669', 'bdi': 'EMI00107664', 'bci': 'EMI00107666', 'bpi': 'EMI00107665',
          'bsi': 'EMI00107667'}  # BHSI: no East Money id found


def eastmoney(sessions):
    """Baltic indices from East Money datacenter (daily, since 2019). East Money repeats the last value on weekends
    and Baltic holidays: weekends are dropped, and inside the CNBC BDI range only CNBC session dates are kept."""
    out = {}
    lo, hi = (min(sessions), max(sessions)) if sessions else ('9999', '0000')
    for key, iid in EM_IDS.items():
        rows, p = [], 1
        while True:
            data = (get(EM.format(id=iid, p=p)).get('result') or {}).get('data') or []
            rows += [(r['REPORT_DATE'][:10], float(r['INDICATOR_VALUE'])) for r in data if r.get('INDICATOR_VALUE') is not None]
            if len(data) < 500 or rows[-1][0] < '2019-01-01':
                break
            p += 1
        keep = {}
        for d, v in rows:
            if d < '2019-01-01' or date.fromisoformat(d).weekday() >= 5:
                continue
            if lo <= d <= hi and d not in sessions:
                continue
            keep[d] = v
        prev = None
        for d in sorted(keep):  # after the last CNBC session: a value equal to the previous day is a holiday repeat
            if d > hi and keep[d] == prev:
                del keep[d]
            else:
                prev = keep[d]
        if len(keep) > 500:
            out[key] = {'id': iid, 'url': f'https://data.eastmoney.com/cjsj/hyzs_list_{iid}.html',
                        'records': sorted(keep.items())}
    return out


FEARN_POST = 'https://www.hellenicshippingnews.com/fearnleys-week-{w}-{y}/'


def parse_fearnleys(t):
    L=[re.sub(r'\s+',' ',x).strip() for x in t.splitlines() if x.strip()]
    J='\n'.join(L);out={}
    m=re.search(r'Week (\d+) - ([A-Z][a-z]+ \d{1,2}, \d{4})',J);out['week']=int(m.group(1));out['date']=datetime.strptime(m.group(2),'%B %d, %Y').strftime('%Y-%m-%d')
    def after(label,pat=r'\$([\d,.]+)',sect=None,start=0):
        i=J.find(label,start)
        if i<0:return None,None
        m=re.search(pat,J[i+len(label):i+len(label)+60])
        return (float(m.group(1).replace(',','')) if m else None),(J[i:i+len(label)+40].replace('\n',' ') if m else None)
    eco=J.find('1 Year T/C - ECO');dry=J.find('1 Year T/C\n(USD/Day');nb=J.find('Newbuilding\nActivity');sp=J.find('Sale & Purchase')
    spec={'tc1y_vlcc':('VLCC Modern',eco,1e-3),'tc1y_suezmax':('Suezmax Modern',eco,1e-3),'tc1y_aframax':('Aframax Modern',eco,1e-3),
      'tc1y_capesize':('Capesize 180',dry,1e-3),'tc1y_panamax':('Panamax 75',dry,1e-3),'tc1y_supramax':('Supramax 58',dry,1e-3),'tc1y_handysize':('Handysize 38',dry,1e-3),
      'nb_vlcc':('VLCC 300',nb,1),'nb_product_tanker':('Product 50',nb,1)}
    for k,(lab,st,f) in spec.items():
        v,q=after(lab,start=max(st,0))
        if v is not None:out[k]=(round(v*f,3),q)
    for k,lab in (('vlcc','VLCC $'),('suezmax','Suezmax $'),('aframax','Aframax / LR2 $'),('mr','MR $')):
        i=J.find(lab,max(sp,0))
        if i>=0:
            m=re.match(re.escape(lab[:-1])+r'\$([\d.]+) \$([\d.]+)',J[i:i+40])
            if m:out['sh5_'+k]=(float(m.group(1)),m.group(0));out['sh10_'+k]=(float(m.group(2)),m.group(0))
    for k,lab in (('vlcc_fixtures','Fixed in all areas last week'),('vlcc_avail_meg','Available in MEG next 30 days')):
        v,q=after(lab,pat=r'(\d+)')
        if v is not None:out[k]=(v,q)
    return out


def fearnleys_reports(store):
    """Fearnleys Weekly Report PDF (re-posted on Hellenic Shipping News; the PDF file name is not fixed, so read the post
    'fearnleys-week-NN-YYYY' for the link). Same definitions as Wi table 362 (week 43 = Wi 23/10 on all 17 series);
    observation date = report date. Weeks since 43/2026 (Wi stopped); only missing weeks are fetched."""
    import tempfile
    reps = store.setdefault('reports', {})
    today = date.today()
    y, w = 2026, 43
    while date.fromisocalendar(y, w, 3) <= today:
        key = f'{y}-W{w:02d}'
        if key not in reps:
            try:
                post = get_text(FEARN_POST.format(w=w, y=y))
                m = re.search(r'https://www\.hellenicshippingnews\.com/wp-content/uploads/[^"\']+?Fearn[^"\']*?\.pdf', post)
                if m:
                    with tempfile.TemporaryDirectory() as tmp:
                        pdf = Path(tmp) / 'f.pdf'
                        if subprocess.run(['curl', '-sfL', '-m', '60', '-A', 'Mozilla/5.0', '-o', str(pdf), m.group(0)]).returncode == 0:
                            txt = subprocess.run(['pdftotext', '-layout', str(pdf), '-'], capture_output=True, text=True).stdout
                            r = parse_fearnleys(txt)
                            if r.get('week') == w and len(r) > 10:
                                reps[key] = {'date': r['date'], 'url': m.group(0), 'post': FEARN_POST.format(w=w, y=y),
                                             'values': {k: v[0] for k, v in r.items() if isinstance(v, tuple)},
                                             'quotes': {k: v[1] for k, v in r.items() if isinstance(v, tuple)}}
            except Exception as e:
                print('fearnleys', key, e)
        w += 1
        if w > date(y, 12, 28).isocalendar()[1]:
            y, w = y + 1, 1
    return store


def get_text(url):
    return subprocess.run(['curl', '-sfL', '-m', '60', '-A', 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36',
                           url], check=True, capture_output=True, text=True).stdout


def parse_handybulk(raw):
    """Daily paragraphs '12-November-2026 The Baltic Dry Index (BDI) ... to reach 3,020 points. The Baltic Capesize
    Index (BCI) ... to 4,836 points ...' → {date: {'BDI':..,'BCI':..,'BPI':..,'BSI':..,'BHSI':.., 'quote': paragraph}}.
    Weekly market commentaries (no 'The Baltic Dry Index' right after the date) are skipped."""
    t = html.unescape(re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', raw)))
    parts = re.split(r'(\d{1,2}-[A-Z][a-z]+-\d{4}) ', t)
    out = {}
    for i in range(1, len(parts) - 1, 2):
        body = parts[i + 1]
        if not body.startswith('The Baltic Dry Index (BDI)'):
            continue
        try:
            d = datetime.strptime(parts[i], '%d-%B-%Y').strftime('%Y-%m-%d')
        except ValueError:
            continue
        row = {}
        for k in ['BDI', *SUB]:
            m = re.search(r'\(' + k + r'\)[^()]*?(?:to|at) (?:reach )?([\d,]+) points', body)
            if m:
                row[k] = int(m.group(1).replace(',', ''))
        if len(row) == 5:
            row['quote'] = body[:body.find('(BHSI)') + 200].rsplit('.', 1)[0][:900] + '.'
            out[d] = row
    return out



def get(url):
    return json.loads(subprocess.run(['curl', '-sfL', '-m', '60', '-A', 'Mozilla/5.0', url],
                                     check=True, capture_output=True, text=True).stdout)


def main():
    out = json.loads(OUT.read_text()) if OUT.exists() else {}
    out['schema'] = 1
    try:
        rows = []
        for b in get(CNBC)['barData']['priceBars']:
            t = b['tradeTime']
            v = float(b['close'])
            if 100 <= v <= 20000:
                rows.append([f'{t[:4]}-{t[4:6]}-{t[6:8]}', v])
        if len(rows) > 100:
            out['bdi'] = {'name': 'Baltic Dry Index', 'unit': 'điểm', 'source': 'Baltic Exchange qua CNBC (.BADI)',
                          'url': 'https://www.cnbc.com/quotes/.BADI', 'records': sorted(dict(rows).items())}
    except Exception as e:
        print('bdi', e)
    # Baltic sub-indices from Handybulk daily paragraphs; history accumulates (the page shows only recent days)
    subs = out.get('bdi_sub', {'source': 'Handybulk · bản tin Baltic Exchange hằng ngày', 'url': HB, 'records': {}})
    pages = [HB]
    if not subs['records']:  # first run: backfill the monthly archives of this year and last
        y = datetime.now().year
        pages += [HB_MONTH.format(y=yy, m=mm) for yy in (y - 1, y) for mm in MONTHS]
    for url in pages:
        try:
            for d, row in parse_handybulk(get_text(url)).items():
                subs['records'].setdefault(d, row)
        except Exception as e:
            print('handybulk', url, e)
    subs['records'] = dict(sorted(subs['records'].items()))
    cnbc = dict(out.get('bdi', {}).get('records', []))
    subs['bdi_mismatch'] = [[d, r['BDI'], cnbc[d]] for d, r in subs['records'].items()
                            if d in cnbc and abs(r['BDI'] - cnbc[d]) > 1]
    if subs['bdi_mismatch']:
        print('BDI Handybulk ≠ CNBC:', subs['bdi_mismatch'][-5:])
    out['bdi_sub'] = subs
    try:
        em = eastmoney(set(dict(out.get('bdi', {}).get('records', []))))
        if em:
            out['eastmoney'] = {'source': 'East Money datacenter (Baltic Exchange)', 'series': em}
            hbr = out.get('bdi_sub', {}).get('records', {})
            chk = {}
            for k in ('bci', 'bpi', 'bsi', 'bdi'):
                e = dict(em.get(k, {}).get('records', []))
                diff = [[d, r[k.upper()], e[d]] for d, r in hbr.items() if d in e and abs(r[k.upper()] - e[d]) > 1]
                chk[k] = {'compared': sum(d in e for d in hbr), 'diff': diff}
            out['eastmoney']['check_handybulk'] = chk
            print('East Money vs Handybulk:', {k: (v['compared'], len(v['diff'])) for k, v in chk.items()})
    except Exception as e:
        print('eastmoney', e)
    try:
        out['fearnleys'] = fearnleys_reports(out.get('fearnleys', {'source': 'Fearnleys Weekly Report qua Hellenic Shipping News'}))
    except Exception as e:
        print('fearnleys', e)
    try:
        out['compass'] = compass_reports(out.get('compass', {'source': 'Compass Maritime Weekly Report'}))
    except Exception as e:
        print('compass', e)
    now = datetime.now(timezone(timedelta(hours=7)))
    today = now.strftime('%Y-%m-%d') if now.strftime('%H:%M') < '15:05' else ''  # skip the open session
    stocks = out.get('stocks', {})
    for t in TICKERS:
        try:
            data = get(VND.format(t=t))['data']
            rec = {r['date']: r['adClose'] for r in data
                   if r.get('adClose') and r['date'] != today and r.get('nmVolume')}
            if '2025-12-31' in rec and len(rec) > 50:
                stocks[t] = {'records': sorted(rec.items()),
                             'url': f'https://dstock.vndirect.com.vn/tong-quan/{t}'}
        except Exception as e:
            print(t, e)
    out['stocks'] = stocks
    out['stocks_source'] = {'name': 'VNDirect finfo · giá đóng cửa điều chỉnh', 'url': 'https://dstock.vndirect.com.vn/'}
    out['checked_at'] = datetime.now(timezone(timedelta(hours=7))).isoformat(timespec='seconds')
    OUT.write_text(json.dumps(out, ensure_ascii=False) + '\n')
    page = json.loads(json.dumps(out))  # the page does not need the quoted paragraphs (kept in the .json)
    for r in page.get('bdi_sub', {}).get('records', {}).values():
        r.pop('quote', None)
    page.pop('fearnleys', None)  # merged into data/shipping-public-data.js by build_sector_public.py
    em = page.get('eastmoney', {}).get('series', {})
    for k in list(em):  # the page uses East Money only for BDTI/BCTI; the rest stay in the .json for cross-checks
        if k not in ('bdti', 'bcti'):
            em.pop(k)
    OUT.with_suffix('.js').write_text('window.SHIPPING_DAILY = ' + json.dumps(page, ensure_ascii=False) + ';\n')
    print({'bdi': out.get('bdi', {}).get('records', [[None]])[-1], **{k: v['records'][-1] for k, v in stocks.items()}})


if __name__ == '__main__':
    main()
