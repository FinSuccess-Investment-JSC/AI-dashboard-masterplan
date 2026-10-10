#!/usr/bin/env python3
"""Read public company financial tables into a dated comparison snapshot.
No credentials, estimates or calendar-year substitutions. No scheduling/publishing.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
import json, re, hashlib, sys, calendar
import requests
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
UNIVERSE={
 'oil': [('GAS','hose','Khí'),('BSR','hose','Lọc dầu'),('PLX','hose','Phân phối'),('PVD','hose','Dịch vụ'),('PVS','hnx','Dịch vụ'),('PVT','hose','Vận tải')],
 'sugar':[('SBT','hose','Mía & thương mại'),('QNS','upcom','Đa ngành'),('SLS','hnx','Mía đường'),('LSS','hose','Mía đường'),('KTS','hnx','Mía đường')],
 'power':[('POW','hose','Nhiệt điện'),('NT2','hose','Nhiệt điện'),('PPC','hose','Nhiệt điện'),('QTP','upcom','Nhiệt điện'),('HND','upcom','Nhiệt điện'),('BTP','hose','Nhiệt điện'),
          ('REE','hose','Thủy điện & đa ngành'),('VSH','hose','Thủy điện & đa ngành'),('CHP','hose','Thủy điện & đa ngành'),('SBA','hose','Thủy điện & đa ngành'),('TMP','hose','Thủy điện & đa ngành'),('SHP','hose','Thủy điện & đa ngành'),
          ('GEG','hose','Năng lượng tái tạo'),('HDG','hose','Năng lượng tái tạo'),('TTA','hose','Năng lượng tái tạo'),
          ('PC1','hose','Lưới, xây lắp & thiết bị'),('TV2','hose','Lưới, xây lắp & thiết bị'),('GEX','hose','Lưới, xây lắp & thiết bị')],
 'realestate':[('VHM','hose','Nhà ở'),('NVL','hose','Nhà ở'),('KDH','hose','Nhà ở'),('NLG','hose','Nhà ở'),('DXG','hose','Nhà ở'),('PDR','hose','Nhà ở'),('DIG','hose','Nhà ở'),('CEO','hnx','Nhà ở'),('AGG','hose','Nhà ở'),('TCH','hose','Nhà ở'),('NTL','hose','Nhà ở'),
               ('KBC','hose','Khu công nghiệp'),('IDC','hnx','Khu công nghiệp'),('BCM','hose','Khu công nghiệp'),('SZC','hose','Khu công nghiệp'),('SIP','hose','Khu công nghiệp'),('VGC','hose','Khu công nghiệp'),('LHG','hose','Khu công nghiệp'),
               ('VRE','hose','Cho thuê bán lẻ'),('DXS','hose','Môi giới')],
 'textile':[('TCM','hose','May'),('TNG','hnx','May'),('MSH','hose','May'),('GIL','hose','May'),('STK','hose','Sợi'),('ADS','hose','Sợi'),('VGT','upcom','Tập đoàn')],
 'port':[('GMD','hose','Cảng'),('PHP','hnx','Cảng'),('SGP','upcom','Cảng'),('VSC','hose','Cảng'),('CDN','hnx','Cảng'),('DVP','hose','Cảng'),('PDN','hose','Cảng'),('HAH','hose','Vận tải biển'),('SCS','hose','Hàng không'),('SGN','hose','Hàng không'),('TCL','hose','Kho bãi & logistics'),('STG','hose','Kho bãi & logistics')],
 'agri':[('LTG','upcom','Cây trồng XK'),('PAN','hose','Cây trồng XK'),('GVR','hose','Cây trồng XK'),('DPR','hose','Cây trồng XK'),('PHR','hose','Cây trồng XK'),('DBC','hose','Chăn nuôi & thức ăn'),('HAG','hose','Chăn nuôi & thức ăn'),('BAF','hose','Chăn nuôi & thức ăn'),('VNM','hose','Thực phẩm & đồ uống'),('MSN','hose','Thực phẩm & đồ uống'),('SAB','hose','Thực phẩm & đồ uống'),('KDC','hose','Thực phẩm & đồ uống')],
 'seafood':[('VHC','hose','Cá tra'),('ANV','hose','Cá tra'),('IDI','hose','Cá tra'),('FMC','hose','Tôm'),('MPC','upcom','Tôm'),('CMX','hose','Tôm'),('ASM','hose','Đa ngành')],
 'shipping':[('PVT','hose','Tàu dầu & khí'),('VTO','hose','Tàu dầu & khí'),('VIP','hose','Tàu dầu & khí'),('PVP','hose','Tàu dầu & khí'),('GSP','hose','Tàu dầu & khí'),('VOS','hose','Hàng rời'),('VNA','upcom','Hàng rời'),('HAH','hose','Container')],
 'bank':[(s,'hose',g) for s,g in [('VCB','Quốc doanh'),('CTG','Quốc doanh'),('BID','Quốc doanh'),('TCB','Tư nhân'),('VPB','Tư nhân'),('MBB','Tư nhân'),('ACB','Tư nhân'),('HDB','Tư nhân'),('TPB','Tư nhân'),('VIB','Tư nhân'),('SHB','Tư nhân')]]}
PAGES={'income_year':'financials/income-statement/','balance_year':'financials/balance-sheet/','income_quarter':'financials/income-statement/?p=quarterly','balance_quarter':'financials/balance-sheet/?p=quarterly','valuation':'financials/ratios/?p=quarterly'}

def number(text):
 t=text.strip().replace(',','').replace('%','').replace('−','-')
 if t in ('','-','n/a','N/A'):return None
 return float(t)

def parse_table(html):
 soup=BeautifulSoup(html,'html.parser');table=soup.select_one('table')
 if not table:raise ValueError('No public financial table')
 text=soup.get_text(' ',strip=True)
 if not re.search(r'(millions VND|Millions VND)',text):raise ValueError('Expected millions VND')
 headers=table.select_one('thead tr').find_all('th',recursive=False)[1:]
 periods=[{'end':h.get('id'),'label':h.get_text(' ',strip=True)} for h in headers]
 for i,p in enumerate(periods):
  if p['label']=='Current':
   cell=table.select('thead tr')[1].find_all('th',recursive=False)[i+1]
   spans=cell.find_all('span');raw=spans[-1].get_text(' ',strip=True) if spans else cell.get_text(' ',strip=True)
   p['end']=datetime.strptime(raw,'%b %d, %Y').date().isoformat()
 rows={}
 for tr in soup.select('table tbody tr'):
  current_headers=tr.find_parent('table').select_one('thead tr')
  if not current_headers or [h.get('id') for h in current_headers.find_all('th',recursive=False)[1:]]!=[h.get('id') for h in headers]:continue
  cells=tr.find_all('td',recursive=False)
  if len(cells)!=len(periods)+1:continue
  label=cells[0].select_one('.row-label') or cells[0]
  key=label.get_text(' ',strip=True)
  try:rows[key]=[number(c.get_text(' ',strip=True)) for c in cells[1:]]
  except ValueError:continue
 return {'periods':periods,'rows':rows}

def fetch(job):
 sector,symbol,exchange,kind,url=job
 if '--offline' in sys.argv:
  record=json.loads((ROOT/f'data/raw/comparison/{symbol}-{kind}.json').read_text())
  parsed=parse_table((ROOT/f'data/raw/comparison/{symbol}-{kind}.html').read_text())
  return symbol,kind,{**record,**parsed}
 r=requests.get(url,timeout=25);r.raise_for_status()
 if f'{exchange.upper()}:{symbol}' not in BeautifulSoup(r.text,'html.parser').get_text(' ',strip=True):raise ValueError('Symbol / exchange mismatch')
 parsed=parse_table(r.text)
 archive=ROOT/'data/raw/comparison';archive.mkdir(parents=True,exist_ok=True)
 (archive/f'{symbol}-{kind}.html').write_text(r.text)
 record={'url':url,'checked_at':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(r.content).hexdigest(),**parsed}
 (archive/f'{symbol}-{kind}.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
 return symbol,kind,record

def get(table,name,end):
 if not table:return None
 pos=next((i for i,p in enumerate(table['periods']) if p['end']==end),None)
 if pos is None:return None
 values=table['rows'].get(name)
 return values[pos] if values else None

def ratio(a,b):return None if a is None or b is None or b<=0 else a/b*100

def build_period(tables,kind):
 income=tables.get('income_'+kind);balance=tables.get('balance_'+kind)
 if not income or not balance:return None
 periods=[p for p in income['periods'] if re.fullmatch(r'\d{4}-\d{2}-\d{2}',p['end'] or '') and p['label'].startswith('FY ' if kind=='year' else 'Q')]
 if not periods:return None
 p=periods[0];end=p['end'];dates=[x['end'] for x in balance['periods'] if re.fullmatch(r'\d{4}-\d{2}-\d{2}',x['end'] or '')]
 if end not in dates:raise ValueError('Unmatched income/balance period')
 year,month=map(int,end[:7].split('-'));ym=year*12+month-1-(12 if kind=='year' else 3);py,pm=divmod(ym,12);pm+=1
 expected=f'{py:04d}-{pm:02d}-{calendar.monthrange(py,pm)[1]:02d}'
 prior=expected if expected in dates else None
 bank='Revenues Before Loan Losses' in income['rows']
 revenue_key='Revenues Before Loan Losses' if bank else 'Revenue'
 rev=get(income,revenue_key,end);net=get(income,'Net Income to Common',end)
 assets=get(balance,'Total Assets',end);previous_assets=get(balance,'Total Assets',prior)
 try:prior_year=str(int(end[:4])-1)+end[4:];previous_revenue=get(income,revenue_key,prior_year)
 except (ValueError,TypeError):previous_revenue=None
 growth=(rev/previous_revenue-1)*100 if rev is not None and previous_revenue and previous_revenue>0 else None
 eq=get(balance,'Total Common Equity',end);prev=get(balance,'Total Common Equity',prior)
 short=get(balance,'Short-Term Debt',end);current=get(balance,'Current Portion of Long-Term Debt',end)
 # Never assume a missing short/current component is zero.
 debt_short=short+current if short is not None and current is not None else None
 cash=get(balance,'Cash & Equivalents',end)
 metrics={'gross_margin':get(income,'Gross Margin',end),'net_margin':ratio(net,rev),'roe':ratio(net,(eq+prev)/2) if eq is not None and prev is not None else None,'short_debt':debt_short,'long_debt':get(balance,'Long-Term Debt',end),'cash':cash,'revenue':rev,'revenue_growth':growth if bank else get(income,'Revenue Growth',end),'net_income':net,'equity':eq,'roa':ratio(net,(assets+previous_assets)/2) if assets is not None and previous_assets is not None else None,'cir':ratio(get(income,'Total Non-Interest Expense',end),rev) if bank else None}
 for key in ('short_debt','long_debt','cash','revenue','net_income','equity'):
  if metrics[key] is not None:metrics[key]/=1000 # millions VND -> billions VND
 return {'end':end,'label':p['label'],'values':metrics,'source_urls':[income['url'],balance['url']],'checked_at':min(income['checked_at'],balance['checked_at']),'method':'Bank net margin and CIR use revenue before loan losses; bank revenue growth compares the same fiscal period a year earlier. ROA uses net income to common / average total assets. ROE = net income to common / average total common equity at opening and closing of period. Quarterly ROE is not annualized. Net margin uses net income to common. Short debt includes current portion of long-term debt only if both source components exist.'}

def main():
 path=ROOT/'data/company-comparison.json';old=json.loads(path.read_text()) if path.exists() else {'companies':[]};previous={r['symbol']:r for r in old['companies']}
 jobs=[]
 for sector,companies in UNIVERSE.items():
  for symbol,exchange,group in companies:
   jobs += [(sector,symbol,exchange,k,f'https://stockanalysis.com/quote/{exchange}/{symbol}/{p}') for k,p in PAGES.items()]
 tables={};errors={}
 with ThreadPoolExecutor(max_workers=4) as pool:
  futs={pool.submit(fetch,j):j for j in jobs}
  for f in as_completed(futs):
   j=futs[f]
   try:symbol,kind,data=f.result();tables.setdefault(symbol,{})[kind]=data
   except Exception as e:errors.setdefault(j[1],[]).append(j[3]+': '+('No cached public table' if isinstance(e,FileNotFoundError) else str(e)))
 out=[]
 for sector,companies in UNIVERSE.items():
  for symbol,exchange,group in companies:
   t=tables.get(symbol,{});row={'sector':sector,'symbol':symbol,'exchange':exchange,'group':group,'year':None,'quarter':None,'quote':None,'errors':errors.get(symbol,[])}
   for kind in ['year','quarter']:
    try:row[kind]=build_period(t,kind)
    except ValueError as e:row['errors'].append(str(e))
    if row[kind] is None and previous.get(symbol,{}).get(kind):row[kind]=previous[symbol][kind];row[kind]['last_good']=True
   v=t.get('valuation')
   if v:
    current=next((p for p in v['periods'] if p['label']=='Current'),None)
    if current:
     end=current['end'];row['quote']={'date':end,'pe':get(v,'PE Ratio',end),'pb':get(v,'PB Ratio',end),'market_cap':get(v,'Market Capitalization',end),'source_url':v['url'],'checked_at':v['checked_at']}
     if row['quote']['market_cap'] is not None:row['quote']['market_cap']/=1000
   if row['quote'] is None and re.fullmatch(r'\d{4}-\d{2}-\d{2}',previous.get(symbol,{}).get('quote',{}).get('date','') if previous.get(symbol,{}).get('quote') else ''):row['quote']=previous[symbol]['quote'];row['quote']['last_good']=True
   out.append(row)
   print(symbol,'year',row['year']['label'] if row['year'] else 'missing','quarter',row['quarter']['label'] if row['quarter'] else 'missing','quote',row['quote']['date'] if row['quote'] else 'missing',len(row['errors']),'errors')
 checks=[part['checked_at'] for row in out for part in (row['year'],row['quarter'],row['quote']) if part]
 payload={'schema':1,'built_at':datetime.now(timezone.utc).isoformat(),'checked_at':max(checks) if checks else None,'provider':'Stock Analysis · S&P Global Market Intelligence','amount_unit':'tỷ VND','ratio_unit':'% / lần','companies':out}
 content=json.dumps(payload,ensure_ascii=False,indent=2)
 for target,text in [(path,content+'\n'),(ROOT/'data/company-comparison.js','window.COMPANY_COMPARISON = '+content+';\n')]:
  temp=target.with_suffix(target.suffix+'.tmp');temp.write_text(text);temp.replace(target)
if __name__=='__main__':main()
