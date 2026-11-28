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
    d, today = date(2026, 1, 5), date.today()  # 16/11/2026: lùi về 1/2026 cho chuỗi MR
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
                    m = re.search(r'^\s*MR\s+51,000\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)', txt, re.M)
                    if m and 'NEWBUILD RESALE 5 YEARS 10 YEARS' in re.sub(r'\s+', ' ', txt):
                        row['MR_VAL'] = [int(x) for x in m.groups()]  # newbuild, resale, 5y, 10y (triệu USD)
                        row['MR_VAL_line'] = re.sub(r'\s+', ' ', m.group(0).strip())
                    for k, lab in (('MR_TC', r'MR\s+47,000'), ('LR1_TC', r'LR1\s+80,000')):
                        m = re.search(r'^\s*' + lab + r'\s+([\d,]+)\s+([\d,]+)', txt, re.M)
                        if m:  # 12 tháng T/C, USD/ngày: tuần này, tuần trước
                            row[k] = [int(x.replace(',', '')) for x in m.groups()]
                            row[k + '_line'] = re.sub(r'\s+', ' ', m.group(0).strip())
                    if 'BDTI' in row or 'MR_VAL' in row:
                        reps[key] = row
        d += timedelta(days=7)
    keys = sorted(reps)
    store['mr'] = [{'date': reps[k]['obs'], 'url': reps[k]['url'], 'newbuild': reps[k]['MR_VAL'][0], 'resale': reps[k]['MR_VAL'][1],
                    'y5': reps[k]['MR_VAL'][2], 'y10': reps[k]['MR_VAL'][3], 'line': reps[k]['MR_VAL_line'],
                    **({'tc_mr': reps[k]['MR_TC'][0], 'tc_mr_line': reps[k]['MR_TC_line']} if 'MR_TC' in reps[k] else {}),
                    **({'tc_lr1': reps[k]['LR1_TC'][0], 'tc_lr1_line': reps[k]['LR1_TC_line']} if 'LR1_TC' in reps[k] else {})}
                   for k in keys if 'MR_VAL' in reps[k]]
    for k in ('BDTI', 'BCTI'):
        recs = []
        for i, rk in enumerate(keys):
            r = reps[rk]
            if k not in r or r['obs'] < '2026-10-01':
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
    lpg=J.find('LPG Rates')  # giá thuê tàu khí, USD/tháng → nghìn USD/tháng
    for k,lab in (('lpg_vlgc',"VLGC 84'"),('lpg_mgc',"MGC 38'"),('lpg_sr65',"SR 6.5'"),('lpg_coaster','COASTER Europe')):
        if lpg>=0:
            v,q=after(lab,pat=r'\$([\d,]+)',start=lpg)
            if v is not None:out[k]=(round(v/1000,1),q)
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


AFFINITY = 'https://www.hellenicshippingnews.com/wp-content/uploads/{d:%Y/%m}/Affinity-Tanker-Weekly-{d:%d.%m.%Y}-HSN.pdf'


def affinity_tce(tce):
    """Baltic TCE theo tuyến từ Affinity Tanker Weekly (PDF thứ Sáu trên Hellenic Shipping News), USD/ngày.
    Đọc các thứ Sáu chưa có trong tce.routes; dòng gốc lưu ở tce.quotes để làm evidence."""
    import tempfile
    routes = {r['code']: r for r in tce.get('routes', [])}
    have = {d for r in routes.values() for d, _ in r['records']}
    quotes = tce.setdefault('quotes', {})
    d = date(2026, 10, 30)
    while d <= date.today():
        iso = d.isoformat()
        if iso not in have:
            url = AFFINITY.format(d=d)
            with tempfile.TemporaryDirectory() as tmp:
                pdf = Path(tmp) / 'a.pdf'
                if subprocess.run(['curl', '-sfL', '-m', '60', '-A', 'Mozilla/5.0', '-o', str(pdf), url]).returncode == 0:
                    txt = subprocess.run(['pdftotext', '-layout', str(pdf), '-'], capture_output=True, text=True).stdout
                    got = 0
                    for code, r in routes.items():
                        m = re.search(r'\b' + code + r'\b +[A-Za-z /.]+? +[0-9]{2,3},000 +([0-9]{1,3}(?:,[0-9]{3})+)', txt)
                        if m:
                            r['records'] = sorted(dict(r['records'] + [[iso, int(m.group(1).replace(',', ''))]]).items())
                            r['records'] = [list(x) for x in r['records']]
                            quotes[f'{code} {iso}'] = {'url': url, 'line': re.sub(r' +', ' ', m.group(0))}
                            got += 1
                    if got:
                        tce['url'] = url
                        print('affinity', iso, got, 'tuyến')
        d += timedelta(days=7)
    return tce


DCN = 'https://www.thedcn.com.au/news/baltic-exchange-weekly-report-{day}-{month}-{y}'


def dcn_weekly(out):
    """Bản tin tuần Baltic Exchange đăng lại trên Daily Cargo News (URL theo ngày thứ Sáu, vd ...-6-november-2026):
    BLPG1–3 (USD/tấn, TCE USD/ngày) và round-trip TCE TD34, TC15. Số trùng bản đăng trên The Edge Malaysia (đối chiếu
    30/10 và 06/11/2026). Chỉ đọc các thứ Sáu chưa có."""
    blpg = out.setdefault('blpg', {'records': []})
    have = {r['date'] for r in blpg['records']}
    routes = {r['code']: r for r in out.get('tce', {}).get('routes', [])}
    quotes = out.setdefault('tce', {}).setdefault('quotes', {})
    d = date(2026, 10, 30)
    while d <= date.today():
        iso = d.isoformat()
        if iso not in have:
            url = DCN.format(day=d.day, month=d.strftime('%B').lower(), y=d.year)
            try:
                t = html.unescape(re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', get_text(url)))).replace('\xa0', ' ')
            except Exception:
                t = ''
            rec = {'date': iso, 'url': url}
            for k in ('BLPG1', 'BLPG2', 'BLPG3'):
                i = t.find(k)
                seg = t[i:i + 330] if i >= 0 else ''
                m1 = re.search(r'\$([\d.]+)\s*(?:/tonne|per tonne)', seg)
                m2 = re.search(r'\$([\d,]+)/day', seg)
                if m1 and m2:
                    rec[k.lower()] = {'usd_t': float(m1.group(1)), 'tce': int(m2.group(1).replace(',', '')),
                                      'quote': seg[:seg.find('/day') + 4]}
            if all(k in rec for k in ('blpg1', 'blpg2', 'blpg3')):
                blpg['records'] = sorted(blpg['records'] + [rec], key=lambda r: r['date'])
                print('dcn', iso, 'BLPG')
            for code, pat in (('TD34', r'TD34 \(Gulf of Oman/China\).{0,200}?TCE of (?:US)?\$([\d,]+)'),
                              ('TC15', r'The TC15 80kt Mediterranean/East index.{0,220}?(?:US)?\$([\d,]+)/day')):
                m = re.search(pat, t)
                if m and code in routes and iso not in dict(routes[code]['records']):
                    routes[code]['records'] = sorted(routes[code]['records'] + [[iso, int(m.group(1).replace(',', ''))]])
                    quotes[f'{code} {iso}'] = {'url': url, 'line': m.group(0)}
        d += timedelta(days=7)
    blpg['source'] = 'Baltic Exchange qua Daily Cargo News (đối chiếu The Edge Malaysia)'
    blpg['note'] = 'Tự đọc hằng tuần từ Daily Cargo News; số trùng bản The Edge Malaysia ở hai tuần đã đối chiếu (30/10, 06/11/2026).'
    return out


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
        if out.get('tce'):
            out['tce'] = affinity_tce(out['tce'])
    except Exception as e:
        print('affinity', e)
    try:
        dcn_weekly(out)
    except Exception as e:
        print('dcn', e)
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
    page.get('tce', {}).pop('quotes', None)
    fr = page.pop('fearnleys', {}).get('reports', {})  # TC/giá tàu ghép vào shipping-public-data.js; LPG giữ ở đây
    page['lpg'] = {'reports': [{'date': r['date'], 'url': r['url'], 'values': {k: v for k, v in r['values'].items() if k.startswith('lpg_')}}
                               for _, r in sorted(fr.items()) if any(k.startswith('lpg_') for k in r['values'])]}
    em = page.get('eastmoney', {}).get('series', {})
    for k in list(em):  # the page uses East Money for BDTI/BCTI and, from 29/11/2026, BDI since 2019 (Tài chính ngành › biên & cước); the rest stay in the .json
        if k not in ('bdti', 'bcti', 'bdi'):
            em.pop(k)
    OUT.with_suffix('.js').write_text('window.SHIPPING_DAILY = ' + json.dumps(page, ensure_ascii=False) + ';\n')
    print({'bdi': out.get('bdi', {}).get('records', [[None]])[-1], **{k: v['records'][-1] for k, v in stocks.items()}})


if __name__ == '__main__':
    main()
