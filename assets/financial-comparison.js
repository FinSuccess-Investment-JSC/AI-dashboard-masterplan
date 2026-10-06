/* Public financial comparison: typed numbers, explicit periods, missing values last. */
(() => {
'use strict';
const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n};
const finite=Number.isFinite;
function compare(a,b,direction=1){const am=a===null||a===undefined,bm=b===null||b===undefined;if(am||bm)return am===bm?0:am?1:-1;return direction*(typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b),'vi',{numeric:true}));}
function mount(host,{sector,sources}){
 const bank=sector==='bank',bundle=window.COMPANY_COMPARISON;
 const rows=(bundle?.companies||[]).filter(r=>r.sector===sector);
 const heading=make('div','comparison-heading'),headline=make('div');headline.append(make('span','comparison-eyebrow','FINANCIAL SNAPSHOT'),make('h2','','So sánh tài chính & định giá'));heading.append(headline,make('span','comparison-unit','Tỷ VND · % · lần'));host.append(heading);
 const tools=make('div','comparison-tools'),search=make('input');search.id='comparison-search';search.type='search';search.placeholder='Tìm mã cổ phiếu';search.setAttribute('aria-label','Tìm mã cổ phiếu');
 const group=make('select');group.id='comparison-group';group.setAttribute('aria-label','Lọc nhóm doanh nghiệp');[['all','Tất cả doanh nghiệp'],...[...new Set(rows.map(r=>r.group))].map(g=>[g,g])].forEach(([v,t])=>{const o=make('option','',t);o.value=v;group.append(o)});
 const period=make('select');period.id='comparison-period';period.setAttribute('aria-label','Kỳ tài chính');[['year','Năm gần nhất'],['quarter','Quý gần nhất']].forEach(([v,t])=>{const o=make('option','',t);o.value=v;period.append(o)});
 const reset=make('button','','Đặt lại');reset.type='button';tools.append(search,group,period,reset);host.append(tools);
 const views=make('div','comparison-views');views.setAttribute('aria-label','Nhóm chỉ tiêu');const groups=[['all','Tất cả'],['profit','Sinh lời'],['balance',bank?'Cơ cấu & chất lượng bảng cân đối':'Nợ vay & tiền'],['valuation','Định giá']];let view='all';
 groups.forEach(([v,label])=>{const b=make('button','',label);b.type='button';b.dataset.view=v;b.setAttribute('aria-pressed',String(v==='all'));b.onclick=()=>{view=v;draw()};views.append(b)});host.append(views);
 const info=make('p','comparison-period-note');info.setAttribute('aria-live','polite');host.append(info);
 const scroller=make('div','comparison-scroll');scroller.tabIndex=0;scroller.setAttribute('role','region');scroller.setAttribute('aria-label','Bảng tài chính, cuộn ngang để xem thêm chỉ tiêu');const table=make('table','comparison-table');scroller.append(table);if(bank){const disclosure=make('details','comparison-disclosure');disclosure.open=true;disclosure.append(make('summary','','Bảng so sánh ngân hàng · thu gọn / mở rộng'),scroller);host.append(disclosure)}else host.append(scroller);
 const metrics=[
 ['gross_margin','Biên gộp','profit','percent'],['net_margin',bank?'LN / tổng thu nhập':'Biên ròng','profit','percent'],['roe','ROE kỳ','profit','percent'],['revenue_growth',bank?'Tổng thu nhập YoY':'Doanh thu YoY','profit','percent'],
 ...(bank?[['roa','ROA kỳ','profit','percent'],['cir','CIR','profit','percent']]:[]),
 ['short_debt','Nợ vay ngắn hạn','balance','amount'],['long_debt','Nợ vay dài hạn','balance','amount'],['cash',bank?'Tiền · nguồn chuẩn hóa':'Tiền & tương đương','balance','amount'],
 ['pe','P/E','valuation','multiple'],['pb','P/B','valuation','multiple'],['market_cap','Vốn hóa','valuation','amount']
 ];
 let sort='symbol',direction=1;
 const val=(r,k)=>['pe','pb','market_cap'].includes(k)?r.quote?.[k]:k==='symbol'?r.symbol:r[period.value]?.values?.[k];
 const datum=(r,k)=>bank&&['gross_margin','short_debt','long_debt'].includes(k)?null:val(r,k);
 function draw(){
  [...views.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  const cols=metrics.filter(m=>view==='all'||m[2]===view);let filtered=rows.filter(r=>(group.value==='all'||r.group===group.value)&&r.symbol.toLowerCase().includes(search.value.trim().toLowerCase()));
  filtered.sort((a,b)=>compare(sort==='symbol'?a.symbol:datum(a,sort),sort==='symbol'?b.symbol:datum(b,sort),direction)||a.symbol.localeCompare(b.symbol));
  table.replaceChildren();const thead=make('thead'),ghead=make('tr'),head=make('tr');
  const groupTitle=make('th','','Doanh nghiệp');groupTitle.colSpan=2;ghead.append(groupTitle);
  for(const [key,label] of groups.slice(1)){const count=cols.filter(c=>c[2]===key).length;if(count){const th=make('th','comparison-band '+key,label);th.colSpan=count;th.scope='colgroup';ghead.append(th)}}
  function sortable(key,label,cls){const th=make('th',cls);th.scope='col';th.setAttribute('aria-sort',sort===key?(direction===1?'ascending':'descending'):'none');const b=make('button','',label+(sort===key?(direction===1?' ↑':' ↓'):' ↕'));b.type='button';b.onclick=()=>{if(sort===key)direction*=-1;else{sort=key;direction=-1}draw();table.querySelector(`[data-sort="${key}"]`)?.focus()};b.dataset.sort=key;th.append(b);return th}
  head.append(sortable('symbol','Mã','symbol-col'),make('th','','Kỳ tài chính'));
  cols.forEach(([k,label,g,type])=>{const th=sortable(k,label,g);th.append(make('small','',type==='percent'?'%':type==='multiple'?'lần':'tỷ VND'));head.append(th)});thead.append(ghead,head);table.append(thead);
  const tbody=make('tbody');table.append(tbody);
  filtered.forEach(r=>{const tr=make('tr');tr.dataset.symbol=r.symbol;const sym=make('td','symbol-col');sym.append(make('b','',r.symbol),make('small','',r.group));tr.append(sym);const p=r[period.value];const periodCell=make('td','period-cell');periodCell.append(make('b','',p?.label||'Chưa có kỳ'),make('small','',p?.end||'—'));if(p?.last_good)periodCell.append(make('small','is-stale','Bản giữ lại'));tr.append(periodCell);
   cols.forEach(([key,,g,type])=>{const value=datum(r,key),td=make('td','metric '+g);td.dataset.metric=key;if(finite(value)){td.dataset.value=String(value);td.textContent=value.toLocaleString('vi-VN',{minimumFractionDigits:type==='amount'?0:1,maximumFractionDigits:type==='amount'?0:2})+(type==='percent'?'%':type==='multiple'?'x':'');if(type==='percent'&&value<0)td.classList.add('is-negative')}
    else {td.textContent=bank&&['gross_margin','short_debt','long_debt'].includes(key)?'KAD':'—';td.classList.add('is-missing');td.title=td.textContent==='KAD'?'Không áp dụng cách phân loại của doanh nghiệp sản xuất cho ngân hàng.':'Chưa có số cùng định nghĩa trong nguồn công khai đã lấy.'}
    if(g==='valuation')td.append(make('small','quote-date',(r.quote?.date||'Chưa có ngày giá')+(r.quote?.last_good?' · bản giữ lại':'')));tr.append(td)});tbody.append(tr);
  });
  if(!filtered.length){const tr=make('tr'),td=make('td','comparison-empty','Không có doanh nghiệp khớp bộ lọc.');td.colSpan=cols.length+2;tr.append(td);tbody.append(tr)}
  info.textContent=filtered.length+' doanh nghiệp · '+(period.value==='quarter'?'ROE của riêng quý, chưa quy đổi năm.':'ROE của năm tài chính.')+' Định giá giữ ngày nguồn riêng.';
 }
 [group,period].forEach(n=>n.addEventListener('change',draw));search.addEventListener('input',draw);reset.onclick=()=>{search.value='';group.value='all';period.value='year';sort='symbol';direction=1;view='all';draw()};
 const limitation=make('p','comparison-limit',bank?'KAD: không áp dụng. Tiền của ngân hàng là nhóm chuẩn hóa của nguồn, có thể gồm số dư tại ngân hàng khác; không so ngang tiền của doanh nghiệp sản xuất.':'—: nguồn chưa có số cùng định nghĩa. '+(sector==='sugar'?'Niên độ đường có thể khác năm dương lịch; ':'')+'Xem kỳ kết thúc từng dòng.');host.append(limitation);
 const source=make('details','comparison-source');source.append(make('summary','','Nguồn & định nghĩa'));const body=make('div','comparison-source-body');
 body.append(make('p','','Nguồn public: Stock Analysis / S&P Global Market Intelligence. Snapshot tải '+(bundle?.checked_at?.slice(0,10)||'chưa có')+'. Đây là bộ số chuẩn hóa của nhà cung cấp, chưa đối chiếu toàn bộ với BCTC gốc. Giá và tỷ lệ định giá có độ trễ; xem ngày tại từng dòng.'));
 body.append(make('p','','Biên ròng = lợi nhuận thuộc cổ đông phổ thông / doanh thu (ngân hàng: tổng thu nhập trước dự phòng tín dụng theo nguồn). ROE = cùng lợi nhuận / vốn cổ đông phổ thông bình quân đầu–cuối kỳ. Quý dùng riêng quý, không nhân bốn. Nợ vay ngắn hạn = vay ngắn hạn + phần vay dài hạn đến hạn; thiếu một cấu phần thì để trống. Tiền không cộng đầu tư ngắn hạn. Tiền/nợ là số cuối kỳ. ROA dùng lợi nhuận thuộc cổ đông phổ thông / tổng tài sản bình quân; CIR = chi phí ngoài lãi / tổng thu nhập trước dự phòng. NIM, CASA và NPL chưa có trong nguồn công khai này nên không ghép thêm số Wi khác định nghĩa/kỳ.'));
 rows.forEach(r=>{const n=make('p');n.append(make('b','',r.symbol+' · '));const urls=new Set([...(r.year?.source_urls||[]),...(r.quarter?.source_urls||[]),r.quote?.source_url].filter(Boolean));urls.forEach((url,i)=>{const a=make('a','',i===urls.size-1&&url.includes('ratios')?'Định giá ↗':url.includes('balance-sheet')?'CĐKT '+(url.includes('quarterly')?'quý':'năm')+' ↗':'KQKD '+(url.includes('quarterly')?'quý':'năm')+' ↗');a.href=url;a.target='_blank';a.rel='noopener';n.append(a,' · ')});if(!urls.size)n.append('Chưa lấy được dữ liệu công khai cho đúng mã/sàn.');body.append(n)});source.append(body);host.append(source);
 const registry=make('details','research-fold');registry.append(make('summary','','Nguồn bảng so sánh tài chính'));const registryBody=body.cloneNode(true);registryBody.className='research-detail';registry.append(registryBody);sources.append(registry);
 draw();
}
if(typeof window!=='undefined')window.FinancialComparison={mount,compare};
if(typeof module!=='undefined'&&module.exports)module.exports={compare};
})();
