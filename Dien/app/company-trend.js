/* Quarterly trend chart in the Stock-dashboard style: pick the metric, add or remove companies as chips,
   choose the time range with horizon buttons or a from/to quarter, hover a quarter to read every line.
   Data: window.COMPANY_QUARTERLY (data/company-quarterly.js). */
(() => {
'use strict';
const NS='http://www.w3.org/2000/svg';
const BASE_METRICS=[
  ['gross_margin','Biên gộp','%'],['net_margin','Biên ròng','%'],
  ['revenue','Doanh thu','tỷ đ'],['gross_profit','Lãi gộp','tỷ đ'],['net_income','Lãi ròng','tỷ đ']
];
const HORIZONS={Q:[['1N','1 năm',4],['2N','2 năm',8],['3N','3 năm',12],['5N','5 năm',20],['all','Toàn bộ',Infinity]],Y:[['1N','1 năm',1],['2N','2 năm',2],['3N','3 năm',3],['5N','5 năm',5],['all','Toàn bộ',Infinity]]};
const KEY='company_trend_v2:';
const TYPES=[['line','Đường'],['bar','Cột'],['area','Miền']];
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const svgEl=(tag,attrs,text)=>{const n=document.createElementNS(NS,tag);for(const k in attrs||{})n.setAttribute(k,attrs[k]);if(text!==undefined)n.textContent=text;return n};
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const fmt=(v,d)=>v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d});
const GROUP_COLORS=['#2938A8','#c98a00','#2a9fa3','#861C52','#3d4653','#5b8c2a','#d1495b','#7a5af5'];
const colorOf=i=>`hsl(${(i*137.5)%360} ${i%2?58:66}% ${i%3===0?38:i%3===1?46:54}%)`;

function niceStep(span,target=4){
  const raw=span/target,mag=Math.pow(10,Math.floor(Math.log10(raw))),n=raw/mag;
  return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*mag;
}
/* Margins clamp to [-30, 100] so one distressed quarter does not flatten every other line;
   clipped points sit on the edge as hollow markers and are listed under the chart. */
function scale(values,clamp,fit){
  let lo=Math.min(...values),hi=Math.max(...values);
  if(!fit){lo=Math.min(0,lo);hi=Math.max(0,hi)}
  if(clamp){lo=Math.max(lo,clamp[0]);hi=Math.min(hi,clamp[1])}
  if(hi===lo){hi+=1;lo-=1}
  const step=niceStep(hi-lo);
  return {lo:Math.floor(lo/step)*step,hi:Math.ceil(hi/step)*step,step};
}
/* Annual view: sum of four quarters, only for years where all four are present for that company. */
function annual(data,cs){
  const years=[...new Set(data.quarters.map(q=>q.split('/')[1]))].filter(y=>data.quarters.filter(q=>q.endsWith('/'+y)).length===4);
  const pos=y=>data.quarters.map((q,i)=>q.endsWith('/'+y)?i:-1).filter(i=>i>=0);
  const sum=(arr,y)=>{const v=pos(y).map(i=>arr[i]);return v.every(finite)?Math.round(v.reduce((a,b)=>a+b,0)*1000)/1000:null};
  const ratio=(a,b)=>a.map((x,i)=>finite(x)&&b[i]?Math.round(x/b[i]*10000)/100:null);
  return {labels:years,companies:cs.map(c=>{const revenue=years.map(y=>sum(c.revenue,y)),gross_profit=years.map(y=>sum(c.gross_profit,y)),net_income=years.map(y=>sum(c.net_income,y));
    return {...c,revenue,gross_profit,net_income,gross_margin:ratio(gross_profit,revenue),net_margin:ratio(net_income,revenue)}})};
}


/* Chỉ tiêu riêng theo ngành (28/11/2026, người dùng: so sánh tài chính chưa customized theo ngành). Tính từ BCTC quý của trang
   (window.<NGÀNH>_FIN, engine IndustryFin), TTM cho số phát sinh, cuối quý cho số dư; chế độ Năm lấy giá trị quý 4. */
const XR=(num,den,mode,sc,o={})=>(E,t)=>E.ratio({m:num,avg:o.an},{m:den,avg:o.ad},[t],mode,sc).each[t]||[];
const XM={
  roe:['roe','ROE (TTM)','%',XR('npat','equity','ttm',100,{ad:true})],
  ebitdam:['ebitdam','Biên EBITDA','%',XR('ebitda','revenue','ttm',100)],
  ndebitda:['ndebitda','Nợ vay ròng/EBITDA','lần',XR('net_debt','ebitda','ttm',1)],
  nde:['nde','Nợ vay ròng/VCSH','%',XR('net_debt','equity','q',100)],
  dio:['dio','Ngày tồn kho','ngày',XR('inventory','cogs','ttm',365,{an:true})],
  dso:['dso','Ngày phải thu','ngày',XR('receivables','revenue','ttm',365,{an:true})],
  advrev:['advrev','Khách trả trước/doanh thu','lần',XR('adv_customers','revenue','ttm',1)],
  invta:['invta','Tồn kho/tổng tài sản','%',XR('inventory','total_assets','q',100)],
  sellrev:['sellrev','Chi phí bán hàng/doanh thu','%',XR('selling','revenue','ttm',100)],
  darev:['darev','Khấu hao/doanh thu','%',XR('da','revenue','ttm',100)],
  assocpbt:['assocpbt','Lãi liên kết/LNTT','%',XR('assoc','pbt','ttm',100)]
};
const XSET={OIL_FIN:['ebitdam','roe','ndebitda','dio','assocpbt'],RE_FIN:['roe','advrev','invta','nde'],TEXTILE_FIN:['ebitdam','roe','dso','dio','ndebitda'],
  SHIP_FIN:['ebitdam','roe','ndebitda','darev'],PORT_FIN:['ebitdam','roe','ndebitda','assocpbt'],STEEL_FIN:['ebitdam','roe','dio','ndebitda'],
  SUGAR_FIN:['roe','dio','ndebitda'],DAIRY_FIN:['ebitdam','roe','sellrev'],BEER_FIN:['ebitdam','roe','sellrev'],POWER_FIN:['ebitdam','roe','ndebitda','assocpbt'],
  KCN_FIN:['roe','advrev','nde'],RETAIL_FIN:['ebitdam','roe','dio','sellrev'],XD_FIN:['roe','dso','advrev','nde'],AVIATION_FIN:['ebitdam','roe','ndebitda'],
  TELECOM_FIN:['ebitdam','roe','ndebitda','darev'],PHARMA_FIN:['ebitdam','roe','dio','sellrev']};
function sectorExtra(data,base){
  if(!window.IndustryFin)return[];
  const hit=Object.keys(window).filter(k=>/_FIN$/.test(k)&&window[k]?.companies?.length&&window[k]?.periods?.length).find(k=>base.some(c=>window[k].companies.some(x=>x.ticker===c.symbol)));
  if(!hit)return[];
  const D=window[hit],E=IndustryFin.create(D),P=D.periods.map(p=>`Q${p.slice(-1)}/${p.slice(0,4)}`);
  const ms=(XSET[hit]||['ebitdam','roe','ndebitda']).map(k=>XM[k]);
  base.forEach(c=>{const ok=D.companies.some(x=>x.ticker===c.symbol);ms.forEach(([k,,,f])=>{const a=ok?f(E,c.symbol):[];
    c[k]=data.quarters.map(q=>{const i=P.indexOf(q),v=i>=0?a[i]:null;return finite(v)?Math.round(v*100)/100:null})})});
  return ms.map(([k,l,u])=>[k,l,u]);
}

function mount(host,{sector}){
  const data=window.COMPANY_QUARTERLY;
  if(!data||!data.companies?.some(c=>c.sector===sector))return null;
  const base=data.companies.filter(c=>c.sector===sector);
  const XMET=sectorExtra(data,base),METRICS=[...BASE_METRICS,...XMET];
  const yearly=annual(data,base);
  // Năm: chỉ tiêu TTM/số dư lấy giá trị quý 4 của năm đó.
  const fillYear=ms=>yearly.companies.forEach((c,j)=>{const src=base[j];ms.forEach(([k])=>{c[k]=yearly.labels.map(y=>{const i=data.quarters.indexOf('Q4/'+y);return i>=0?src[k][i]:null})})});
  fillYear(XMET);
  const views={Q:{labels:data.quarters,companies:base},Y:yearly};
  const groups=[...new Set(base.map(c=>c.group))];
  const color=Object.fromEntries(base.map((c,i)=>[c.symbol,colorOf(i)]));
  const known=Object.fromEntries(base.map(c=>[c.symbol,c]));
  const defRange=mode=>{const n=views[mode].labels.length;return mode==='Q'?[Math.max(0,n-12),n-1]:[0,n-1]};
  // Metrics without data in this sector (banks and insurers have no gross profit) are disabled; default to the first available.
  const has=k=>base.some(c=>c[k].some(finite));
  const firstMetric=(METRICS.find(m=>has(m[0]))||METRICS[0])[0];
  // Default lines: the whole sector when small, else the first group that has data for the default metric.
  const defaultPick=()=>{const ok=c=>c[firstMetric].some(finite);if(base.length<=8)return base.filter(ok).map(c=>c.symbol);
    const g=groups.find(g=>base.some(c=>c.group===g&&ok(c)));return base.filter(c=>c.group===g&&ok(c)).map(c=>c.symbol)};
  let state={mode:'Q',metric:firstMetric,type:'line',fit:false,agg:false,yoy:false,selected:new Set(defaultPick()),hidden:new Set(),from:defRange('Q')[0],to:defRange('Q')[1]};
  try{
    const s=JSON.parse(localStorage.getItem(KEY+sector)||'null');
    if(s&&views[s.mode]&&METRICS.some(m=>m[0]===s.metric)&&has(s.metric)&&TYPES.some(t=>t[0]===s.type)&&Array.isArray(s.selected)&&s.selected.every(x=>known[x])&&Array.isArray(s.hidden)&&Number.isInteger(s.from)&&Number.isInteger(s.to)&&s.from>=0&&s.to<views[s.mode].labels.length&&s.from<=s.to)
      state={mode:s.mode,metric:s.metric,type:s.type,fit:!!s.fit,agg:!!s.agg,yoy:!!s.yoy,selected:new Set(s.selected),hidden:new Set(s.hidden.filter(x=>known[x])),from:s.from,to:s.to};
  }catch(e){}
  const save=()=>{try{localStorage.setItem(KEY+sector,JSON.stringify({mode:state.mode,metric:state.metric,type:state.type,fit:state.fit,agg:state.agg,yoy:state.yoy,selected:[...state.selected],hidden:[...state.hidden],from:state.from,to:state.to}))}catch(e){}};
  const view=()=>views[state.mode];
  const EXTRA=sector==='power';if(!EXTRA){state.agg=false;state.yoy=false}

  const card=make('div','card company-trend');
  card.append(make('div','chart-title','Xu hướng tài chính theo kỳ'));
  const sub=make('div','chart-sub');card.append(sub);
  const top=make('div','ct-top');
  const metricRow=make('div','supply-tabs company-trend-metrics');metricRow.setAttribute('role','tablist');
  const addMetric=([k,label])=>{const b=make('button','tabbtn',label);b.type='button';b.setAttribute('role','tab');b.dataset.k=k;if(!has(k)){b.disabled=true;b.title='Không có dữ liệu cho ngành này'}b.onclick=()=>{state.metric=k;update()};metricRow.append(b)};
  METRICS.forEach(addMetric);
  // BCTC của trang (window.<NGÀNH>_FIN) nạp sau khối này: thêm chỉ tiêu riêng ngành khi trang nạp xong.
  if(!XMET.length&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{const more=sectorExtra(data,base);if(!more.length)return;METRICS.push(...more);fillYear(more);more.forEach(addMetric);update()});
  const typeRow=make('div','ct-types');typeRow.setAttribute('role','group');typeRow.setAttribute('aria-label','Loại biểu đồ');
  TYPES.forEach(([k,label])=>{const b=make('button','',label);b.type='button';b.dataset.k=k;b.onclick=()=>{state.type=k;update()};typeRow.append(b)});
  top.append(metricRow,typeRow);

  const chips=make('div','ct-chips');chips.setAttribute('role','group');chips.setAttribute('aria-label','Chọn doanh nghiệp hiển thị');
  const quick=make('div','ct-quick');
  quick.append(make('span','ct-label','Chọn nhanh'));
  groups.forEach(g=>{const b=make('button','ct-quickbtn',g);b.type='button';b.onclick=()=>{state.selected=new Set(base.filter(c=>c.group===g).map(c=>c.symbol));state.hidden.clear();update()};quick.append(b)});
  const allBtn=make('button','ct-quickbtn','Tất cả');allBtn.type='button';allBtn.onclick=()=>{state.selected=new Set(base.map(c=>c.symbol));state.hidden.clear();update()};
  const noneBtn=make('button','ct-quickbtn','Bỏ chọn');noneBtn.type='button';noneBtn.onclick=()=>{state.selected=new Set();state.hidden.clear();update()};
  quick.append(allBtn,noneBtn);

  // Chu kỳ / khoảng thời gian / trục, giống khối điều khiển của Stock dashboard.
  const controls=make('div','ct-controls');
  const field=(label,node)=>{const w=make('label','ct-field');w.append(make('span','ct-field-label',label),node);return w};
  const modeS=make('select');[['Q','Quý'],['Y','Năm']].forEach(([k,t])=>{const o=make('option','',t);o.value=k;modeS.append(o)});modeS.setAttribute('aria-label','Chu kỳ');
  modeS.onchange=()=>{state.mode=modeS.value;[state.from,state.to]=defRange(state.mode);update()};
  const fromS=make('select'),toS=make('select');fromS.setAttribute('aria-label','Từ kỳ');toS.setAttribute('aria-label','Đến kỳ');
  fromS.onchange=()=>{state.from=+fromS.value;if(state.from>state.to)state.to=state.from;update()};
  toS.onchange=()=>{state.to=+toS.value;if(state.to<state.from)state.from=state.to;update()};
  const hz=make('div','multiple-horizon');hz.setAttribute('role','group');hz.setAttribute('aria-label','Khoảng thời gian');
  const axis=make('div','ct-axis');axis.setAttribute('role','group');axis.setAttribute('aria-label','Trục giá trị');
  axis.append(make('span','ct-axis-label','Trục'));
  [['zero','Từ 0'],['fit','Vừa dữ liệu']].forEach(([k,t])=>{const b=make('button','',t);b.type='button';b.dataset.k=k;b.onclick=()=>{state.fit=k==='fit';update()};axis.append(b)});
  // Cộng gộp theo nhóm và so cùng kỳ (23/11/2026, chỉ bật cho ngành Điện; ngành khác giữ nguyên): gộp = tổng doanh thu, lãi các DN đang chọn trong cùng nhóm, biên = tổng lãi ÷ tổng doanh thu.
  const toggle2=(label,key,opts)=>{const w=make('div','ct-axis ct-'+key);w.setAttribute('role','group');w.setAttribute('aria-label',label);w.append(make('span','ct-axis-label',label));
    opts.forEach(([v,t,tip])=>{const b=make('button','',t);b.type='button';b.dataset.v=String(v);if(tip)b.title=tip;b.onclick=()=>{state[key]=v;update()};w.append(b)});return w};
  const aggSw=toggle2('Hiển thị','agg',[[false,'Từng DN'],[true,'Cộng gộp nhóm','Cộng tất cả doanh nghiệp đang chọn trong cùng nhóm']]);
  const yoySw=toggle2('Giá trị','yoy',[[false,'Theo kỳ'],[true,'So cùng kỳ','Doanh thu, lãi: % tăng/giảm so cùng kỳ năm trước; biên: chênh lệch điểm %']]);
  const groupColor=Object.fromEntries(groups.map((g,i)=>[g,GROUP_COLORS[i%GROUP_COLORS.length]]));
  controls.append(field('Chu kỳ',modeS),field('Từ',fromS),field('Đến',toS),hz,axis);
  if(EXTRA)controls.append(aggSw,yoySw);

  const chart=make('div','company-trend-chart'),legend=make('div','legend ct-legend'),tip=make('div','chtip ct-tip'),note=make('div'),
    src=make('div','source-note');
  src.append('Nguồn: ');
  const used=[...new Set(base.map(c=>c.source||'vnd'))];
  used.forEach((k,i)=>{const info=data.sources?.[k]||{name:data.source,url:'https://api-finfo.vndirect.com.vn/v4/financial_statements'};const a=make('a','',info.name);a.href=info.url;a.target='_blank';a.rel='noopener';if(i)src.append(' · ');src.append(a)});
  const day=used.includes('vnd')?data.captured_at:data.sa_checked_at||data.captured_at;
  src.append(`. Cập nhật ${day.split('-').reverse().join('/')}. Biên = lợi nhuận ÷ doanh thu thuần (tự tính); lãi ròng là lợi nhuận sau thuế thuộc cổ đông công ty mẹ. Năm = tổng 4 quý, chỉ năm có đủ 4 quý. Quý mới nhất có thể chưa kiểm toán.`);
  const more=make('div','ct-source'),toggle=make('button','ct-source-btn','ⓘ Nguồn & ghi chú'),panel=make('div','ct-source-panel');toggle.type='button';toggle.setAttribute('aria-expanded','false');panel.hidden=true;panel.append(note,src);toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden))};more.append(toggle,panel);
  card.append(top,quick,controls,chart,legend,tip,more);

  function draw(){
    const v=view(),Q=v.labels,[key,label,unit]=METRICS.find(m=>m[0]===state.metric),pct=unit==='%';
    const picked=v.companies.filter(c=>state.selected.has(c.symbol)),idx=[];
    const n=Q.length;
    // Đường vẽ: từng DN, hoặc mỗi nhóm một đường cộng gộp (kỳ thiếu số của bất kỳ DN nào trong nhóm thì để trống, không cộng thiếu).
    let lines=picked.map(c=>({symbol:c.symbol,label:c.symbol,color:color[c.symbol],note:c.note,s:c}));
    if(state.agg){lines=[...new Set(picked.map(c=>c.group))].map(g=>{const m=picked.filter(c=>c.group===g);
      const sum=k=>Array.from({length:n},(_,i)=>m.every(c=>finite(c[k][i]))?m.reduce((a,c)=>a+c[k][i],0):null);
      const revenue=sum('revenue'),gross_profit=sum('gross_profit'),net_income=sum('net_income');
      const r=a=>a.map((x,i)=>finite(x)&&revenue[i]>0?Math.round(x/revenue[i]*10000)/100:null);
      return {symbol:g,label:`${g} (${m.length} DN)`,color:groupColor[g],members:m,s:{revenue,gross_profit,net_income,gross_margin:r(gross_profit),net_margin:r(net_income)}}})}
    // So cùng kỳ: quý so quý cùng kỳ năm trước, năm so năm trước; doanh thu/lãi tính %, chỉ khi kỳ gốc dương; biên tính chênh lệch điểm %.
    const prev=Q.map(l=>Q.indexOf(state.mode==='Q'?l.replace(/\d{4}$/,y=>String(y-1)):String(+l-1)));
    lines.forEach(L=>{const a=L.s[key];L.v=!state.yoy?a:a.map((x,i)=>{const p=prev[i]<0?null:a[prev[i]];if(!finite(x)||!finite(p))return null;return pct?Math.round((x-p)*100)/100:p>0?Math.round((x/p-1)*10000)/100:null})});
    const unitS=state.yoy?(pct?' điểm %':'%'):(pct?'%':unit==='lần'?'x':unit==='ngày'?' ngày':''),dig=pct||state.yoy?1:unit==='lần'?2:0;
    const clamp=state.yoy?(pct?[-50,50]:[-100,300]):pct?[-30,100]:null;
    const syms=lines;
    for(let i=state.from;i<=state.to;i++)idx.push(i);
    chart.replaceChildren();legend.replaceChildren();note.replaceChildren();tip.style.display='none';
    // Legend: click to hide or show a line without dropping it from the selection (struck through when hidden).
    // Legend lists every company: click to add or remove a line (struck through when off).
    // Cộng gộp: chú giải xếp theo nhóm, tên nhóm cùng màu đường gộp.
    let lastG=null;
    (state.agg?groups.flatMap(g=>v.companies.filter(c=>c.group===g)):v.companies).forEach(c=>{
      if(state.agg&&c.group!==lastG){lastG=c.group;const g=make('span','ct-legend-g',c.group);g.style.color=groupColor[c.group];legend.append(g)}
      const on=state.selected.has(c.symbol);
      const b=make('button','ct-legend-item'+(on?'':' off'));b.type='button';b.setAttribute('aria-pressed',String(on));b.title=c.group;
      const dot=make('span','dot');dot.style.background=state.agg?groupColor[c.group]:color[c.symbol];b.append(dot,c.symbol);
      b.onclick=()=>{on?state.selected.delete(c.symbol):state.selected.add(c.symbol);update()};legend.append(b);
    });
    const vals=syms.flatMap(c=>idx.map(i=>c.v[i]).filter(finite));
    if(!syms.length||!vals.length){chart.append(make('div','gap-empty',!picked.length?'Chưa chọn doanh nghiệp nào. Bấm tên trong chú giải bên dưới hoặc "Chọn nhanh".':'Không có dữ liệu trong khoảng đã chọn.'));return}
    const fit=state.fit&&state.type!=='bar',sc=scale(vals,clamp,fit),clipped=[];
    syms.forEach(c=>idx.forEach(qi=>{const val=c.v[qi];if(clamp&&finite(val)&&(val<sc.lo||val>sc.hi))clipped.push(`${c.label} ${Q[qi]}: ${fmt(val,1)}${unitS}`)}));
    if(window.Chart){
     const box=make('div','ct-canvas');box.style.cssText='position:relative;height:300px';const cv=document.createElement('canvas');cv.setAttribute('role','img');cv.setAttribute('aria-label',`${label}${state.yoy?' so cùng kỳ':''} theo kỳ, ${syms.map(c=>c.label).join(', ')}`);box.append(cv);chart.append(box);
     Chart.getChart(cv)?.destroy();
     new Chart(cv,{type:state.type==='bar'?'bar':'line',data:{labels:idx.map(i=>Q[i]),datasets:syms.map(c=>({label:c.label,data:idx.map(i=>finite(c.v[i])?Math.min(Math.max(c.v[i],sc.lo),sc.hi):null),raw:idx.map(i=>c.v[i]),borderColor:c.color,backgroundColor:state.type==='area'?(c.color.startsWith('#')?c.color+'33':c.color.replace(')',' / .2)')):c.color,borderWidth:state.agg?2.5:2,fill:state.type==='area',pointRadius:idx.length>14?0:2.5,tension:0,spanGaps:false,borderRadius:3,maxBarThickness:22}))},
      options:{responsive:true,maintainAspectRatio:false,animation:{duration:250},interaction:{mode:'index',intersect:false},scales:{x:{grid:{display:false},ticks:{color:'#64748B',autoSkipPadding:8,maxRotation:45}},y:{min:sc.lo,max:sc.hi,grid:{color:'#EEF0F6'},border:{display:false},ticks:{color:'#64748B',callback:v=>(state.yoy&&v>0?'+':'')+fmt(v,sc.step<1?1:0)+(state.yoy?(pct?'đ':'%'):pct?'%':'')}}},
      plugins:{legend:{display:false},tooltip:{backgroundColor:'#1D2678',padding:10,cornerRadius:8,itemSort:(p,q)=>q.raw-p.raw,filter:x=>x.raw!=null,callbacks:{label:x=>{const r=x.dataset.raw[x.dataIndex];return `${x.dataset.label}: ${state.yoy&&r>0?'+':''}${fmt(r,dig)}${unitS}`}}}}}});
    }
    const parts=[];
    if(clipped.length)parts.push('Ngoài thang (vẽ tại mép): '+clipped.slice(0,6).join('; ')+(clipped.length>6?` và ${clipped.length-6} điểm khác`:'')+'.');
    if(!state.agg)syms.filter(c=>c.note).forEach(c=>parts.push(c.symbol+': '+c.note));
    if(state.agg){parts.push('Cộng gộp nhóm: tổng các doanh nghiệp đang chọn (bấm mã ở chú giải để thêm/bớt); biên = tổng lãi ÷ tổng doanh thu. Kỳ thiếu số của bất kỳ thành viên nào thì để trống.');
      const need=key==='gross_margin'?['gross_profit','revenue']:key==='net_margin'?['net_income','revenue']:[key];
      syms.forEach(L=>{const miss=L.members.filter(c=>idx.some(i=>need.some(k=>!finite(c[k][i]))));if(miss.length)parts.push(`${L.label}: có kỳ trống do thiếu số của ${miss.map(c=>c.symbol).join(', ')}.`)})}
    if(state.yoy)parts.push(pct?'So cùng kỳ của biên: chênh lệch điểm % so cùng kỳ năm trước.':'So cùng kỳ: % thay đổi so cùng kỳ năm trước; để trống khi kỳ gốc âm hoặc bằng 0.');
    const absent=(data.missing||[]).filter(m=>(m.sector||'power')===sector).map(m=>m.symbol);
    if(absent.length)parts.push('Chưa có dữ liệu quý: '+absent.join(', ')+'.');
    if(parts.length)note.append(make('p','source-note',parts.join(' ')));
  }
  function update(){
    const v=view(),N=v.labels.length;
    state.to=Math.min(state.to,N-1);state.from=Math.min(state.from,state.to);
    sub.textContent='Chọn chỉ tiêu, bật/tắt doanh nghiệp, đổi chu kỳ và khoảng thời gian · '+v.labels[0]+' → '+v.labels[N-1];
    [...metricRow.children].forEach(b=>b.setAttribute('aria-selected',String(b.dataset.k===state.metric)));
    [...typeRow.children].forEach(b=>{const on=b.dataset.k===state.type;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
    for(const [w,k] of [[aggSw,'agg'],[yoySw,'yoy']])[...w.querySelectorAll('button')].forEach(b=>{const on=b.dataset.v===String(state[k]);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
    [...axis.querySelectorAll('button')].forEach(b=>{const on=(b.dataset.k==='fit')===state.fit;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.disabled=state.type==='bar'&&b.dataset.k==='fit'});
    modeS.value=state.mode;
    for(const s of [fromS,toS]){s.replaceChildren(...v.labels.map((q,i)=>{const o=make('option','',q);o.value=String(i);return o}))}
    fromS.value=String(state.from);toS.value=String(state.to);
    hz.replaceChildren(...HORIZONS[state.mode].map(([k,label,len])=>{const b=make('button','',k==='all'?'Toàn bộ':k);b.type='button';b.title=label;
      const on=state.to===N-1&&state.from===Math.max(0,N-Math.min(len,N));b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));
      b.onclick=()=>{state.to=N-1;state.from=Math.max(0,N-Math.min(len,N));update()};return b}));
    save();draw();
  }
  update();
  let lastW=0;if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{const w=Math.round(chart.clientWidth);if(w&&Math.abs(w-lastW)>8){lastW=w;draw()}}).observe(chart);
  card.style.position='relative';
  return card;
}
if(typeof window!=='undefined')window.CompanyTrend={mount};
// Extra placements: any <div data-company-trend="sector"> on the page gets its own copy (e.g. Đường, next to SBT margin).
if(typeof document!=='undefined')document.querySelectorAll('[data-company-trend]').forEach(h=>{const t=mount(h,{sector:h.dataset.companyTrend});if(t){h.append(t);const ti=t.querySelector('h3,.chart-title');if(ti&&h.dataset.title)ti.textContent=h.dataset.title}if(!t)return;t.style.gridColumn='1 / -1';const place=()=>{const card=t,after=document.getElementById(h.dataset.after||'')?.closest('.card');if(card&&after&&after!==card&&after.nextElementSibling!==card)after.after(card)};place();window.DienBoot.add(0,place)});
})();
