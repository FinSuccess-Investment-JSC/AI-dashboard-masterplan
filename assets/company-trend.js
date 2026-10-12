/* Quarterly trend chart in the Stock-dashboard style: pick the metric, add or remove companies as chips,
   choose the time range with horizon buttons or a from/to quarter, hover a quarter to read every line.
   Data: window.COMPANY_QUARTERLY (data/company-quarterly.js). */
(() => {
'use strict';
const NS='http://www.w3.org/2000/svg';
const METRICS=[
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
const colorOf=i=>`hsl(${(i*137.5)%360} ${i%2?58:66}% ${i%3===0?38:i%3===1?46:54}%)`;

function niceStep(span,target=4){
  const raw=span/target,mag=Math.pow(10,Math.floor(Math.log10(raw))),n=raw/mag;
  return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*mag;
}
/* Margins clamp to [-30, 100] so one distressed quarter does not flatten every other line;
   clipped points sit on the edge as hollow markers and are listed under the chart. */
function scale(values,pct,fit){
  let lo=Math.min(...values),hi=Math.max(...values);
  if(!fit){lo=Math.min(0,lo);hi=Math.max(0,hi)}
  if(pct){lo=Math.max(lo,-30);hi=Math.min(hi,100)}
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

function mount(host,{sector}){
  const data=window.COMPANY_QUARTERLY;
  if(!data||!data.companies?.some(c=>c.sector===sector))return null;
  const base=data.companies.filter(c=>c.sector===sector);
  const yearly=annual(data,base);
  const views={Q:{labels:data.quarters,companies:base},Y:yearly};
  const groups=[...new Set(base.map(c=>c.group))];
  const color=Object.fromEntries(base.map((c,i)=>[c.symbol,colorOf(i)]));
  const known=Object.fromEntries(base.map(c=>[c.symbol,c]));
  const defRange=mode=>{const n=views[mode].labels.length;return mode==='Q'?[Math.max(0,n-12),n-1]:[0,n-1]};
  let state={mode:'Q',metric:METRICS[0][0],type:'line',fit:false,selected:new Set(base.filter(c=>c.group===groups[0]).map(c=>c.symbol)),hidden:new Set(),from:defRange('Q')[0],to:defRange('Q')[1]};
  try{
    const s=JSON.parse(localStorage.getItem(KEY+sector)||'null');
    if(s&&views[s.mode]&&METRICS.some(m=>m[0]===s.metric)&&TYPES.some(t=>t[0]===s.type)&&Array.isArray(s.selected)&&s.selected.every(x=>known[x])&&Array.isArray(s.hidden)&&Number.isInteger(s.from)&&Number.isInteger(s.to)&&s.from>=0&&s.to<views[s.mode].labels.length&&s.from<=s.to)
      state={mode:s.mode,metric:s.metric,type:s.type,fit:!!s.fit,selected:new Set(s.selected),hidden:new Set(s.hidden.filter(x=>known[x])),from:s.from,to:s.to};
  }catch(e){}
  const save=()=>{try{localStorage.setItem(KEY+sector,JSON.stringify({mode:state.mode,metric:state.metric,type:state.type,fit:state.fit,selected:[...state.selected],hidden:[...state.hidden],from:state.from,to:state.to}))}catch(e){}};
  const view=()=>views[state.mode];

  const card=make('div','card company-trend');
  card.append(make('div','chart-title','Xu hướng tài chính theo kỳ'));
  const sub=make('div','chart-sub');card.append(sub);
  const top=make('div','ct-top');
  const metricRow=make('div','supply-tabs company-trend-metrics');metricRow.setAttribute('role','tablist');
  METRICS.forEach(([k,label])=>{const b=make('button','tabbtn',label);b.type='button';b.setAttribute('role','tab');b.dataset.k=k;b.onclick=()=>{state.metric=k;update()};metricRow.append(b)});
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
  groups.forEach(g=>{
    const row=make('div','ct-group');row.append(make('span','ct-label',g));
    base.filter(c=>c.group===g).forEach(c=>{
      const b=make('button','ct-chip');b.type='button';b.dataset.symbol=c.symbol;b.style.setProperty('--series',color[c.symbol]);
      const dot=make('span','dot');dot.setAttribute('aria-hidden','true');b.append(dot,c.symbol);
      b.onclick=()=>{if(state.selected.has(c.symbol)){state.selected.delete(c.symbol);state.hidden.delete(c.symbol)}else state.selected.add(c.symbol);update()};
      row.append(b);
    });
    chips.append(row);
  });

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
  controls.append(field('Chu kỳ',modeS),field('Từ',fromS),field('Đến',toS),hz,axis);

  const chart=make('div','company-trend-chart'),legend=make('div','legend ct-legend'),tip=make('div','chtip ct-tip'),note=make('div'),
    src=make('div','source-note');
  src.append('Nguồn: ');
  const a=make('a','',data.source);a.href='https://widata.vn/';a.target='_blank';a.rel='noopener';
  src.append(a,`. Cập nhật ${data.captured_at.split('-').reverse().join('/')}. Biên = lợi nhuận ÷ doanh thu thuần (tự tính); lãi ròng là lợi nhuận sau thuế của cổ đông công ty mẹ. Năm = tổng 4 quý, chỉ năm có đủ 4 quý. Quý mới nhất có thể chưa kiểm toán.`);
  card.append(top,quick,chips,controls,chart,legend,tip,note,src);

  function draw(){
    const v=view(),Q=v.labels,[key,label,unit]=METRICS.find(m=>m[0]===state.metric),pct=unit==='%';
    const picked=v.companies.filter(c=>state.selected.has(c.symbol)),syms=picked.filter(c=>!state.hidden.has(c.symbol)),idx=[];
    for(let i=state.from;i<=state.to;i++)idx.push(i);
    chart.replaceChildren();legend.replaceChildren();note.replaceChildren();tip.style.display='none';
    // Legend: click to hide or show a line without dropping it from the selection (struck through when hidden).
    picked.forEach(c=>{
      const b=make('button','ct-legend-item'+(state.hidden.has(c.symbol)?' off':''));b.type='button';b.setAttribute('aria-pressed',String(!state.hidden.has(c.symbol)));
      const dot=make('span','dot');dot.style.background=color[c.symbol];b.append(dot,c.symbol);
      b.onclick=()=>{state.hidden.has(c.symbol)?state.hidden.delete(c.symbol):state.hidden.add(c.symbol);update()};legend.append(b);
    });
    const vals=syms.flatMap(c=>idx.map(i=>c[key][i]).filter(finite));
    if(!syms.length||!vals.length){chart.append(make('div','gap-empty',!picked.length?'Chưa chọn doanh nghiệp nào. Bấm tên doanh nghiệp hoặc "Chọn nhanh" ở trên.':!syms.length?'Mọi đường đang ẩn. Bấm tên trong chú giải để hiện lại.':'Không có dữ liệu trong khoảng đã chọn.'));return}
    const W=640,H=260,L=54,R=state.type==='bar'?14:44,T=16,B=36,pw=W-L-R,ph=H-T-B,n=idx.length;
    const fit=state.fit&&state.type!=='bar';
    const sc=scale(vals,pct,fit),Y=val=>T+ph*(sc.hi-Math.min(Math.max(val,sc.lo),sc.hi))/(sc.hi-sc.lo),X=j=>L+pw*(j+0.5)/n;
    const zeroY=Y(Math.max(sc.lo,Math.min(0,sc.hi)));
    const d=pct?1:0;
    const svg=svgEl('svg',{viewBox:`0 0 ${W} ${H}`,width:'100%',class:'chartsvg ct-svg',role:'img','aria-label':`${label} theo kỳ, ${syms.map(c=>c.symbol).join(', ')}`});
    for(let g=sc.lo;g<=sc.hi+sc.step/2;g+=sc.step){
      svg.append(svgEl('line',{x1:L,x2:W-R,y1:Y(g),y2:Y(g),class:g===0?'axisline':'gridline'}));
      svg.append(svgEl('text',{x:L-8,y:Y(g)+4,'text-anchor':'end',class:'axislabel'},fmt(g,sc.step<1?1:0)+(pct?'%':'')));
    }
    const every=Math.max(1,Math.ceil(n/9));
    idx.forEach((qi,j)=>{if(j%every===0||j===n-1){if(j!==n-1&&n-1-j<every/2&&j!==0)return;
      svg.append(svgEl('text',{x:X(j),y:H-(state.mode==='Y'?14:12),'text-anchor':'middle',class:'catlabel',...(state.mode==='Q'?{transform:`rotate(-35 ${X(j)} ${H-12})`}:{}),'font-size':9.5},Q[qi]))}});
    const clipped=[],endY=[],bw=Math.min(22,pw/n*0.8/Math.max(syms.length,1));
    syms.forEach((c,si)=>{
      const col=color[c.symbol];let path='',pen=false,seg=[];
      const flush=()=>{if(seg.length>1&&state.type==='area')svg.append(svgEl('path',{d:`M${seg.map(p=>p.join(' ')).join('L')}L${seg[seg.length-1][0]} ${zeroY}L${seg[0][0]} ${zeroY}Z`,fill:col,'fill-opacity':.14}));seg=[]};
      idx.forEach((qi,j)=>{const val=c[key][qi];if(!finite(val)){pen=false;flush();return}path+=(pen?'L':'M')+X(j).toFixed(1)+' '+Y(val).toFixed(1);pen=true;seg.push([X(j).toFixed(1),Y(val).toFixed(1)])});flush();
      if(path&&state.type!=='bar')svg.append(svgEl('path',{d:path,fill:'none',stroke:col,'stroke-width':2.2,'stroke-linecap':'round','stroke-linejoin':'round'}));
      let last=-1;
      idx.forEach((qi,j)=>{
        const val=c[key][qi];if(!finite(val))return;last=j;
        const out=pct&&(val<sc.lo||val>sc.hi);
        if(state.type==='bar'){
          const x=X(j)-bw*syms.length/2+si*bw,y=Y(val),r=svgEl('rect',{x:x+.5,y:Math.min(y,zeroY),width:Math.max(1,bw-1),height:Math.max(1,Math.abs(zeroY-y)),rx:2,fill:col,'fill-opacity':out?.45:1});
          svg.append(r);
        }else svg.append(svgEl('circle',{cx:X(j),cy:Y(val),r:out?4:n>14?2.2:3,fill:out?'#fff':col,stroke:out?col:'#fff','stroke-width':out?1.8:1}));
        if(out)clipped.push(`${c.symbol} ${Q[qi]}: ${fmt(val,1)}%`);
      });
      if(last>=0&&state.type!=='bar'){let y=Y(c[key][idx[last]])+4;while(endY.some(e=>Math.abs(e-y)<11))y+=11;endY.push(y);
        svg.append(svgEl('text',{x:X(last)+8,y,class:'endlabel',fill:col,'font-size':9.5,'font-weight':700},c.symbol))}
    });
    // Hover: a vertical guide plus a tooltip listing every visible line for that period.
    const guide=svgEl('line',{y1:T,y2:T+ph,stroke:'#b8c7d9','stroke-width':1,visibility:'hidden'});svg.append(guide);
    idx.forEach((qi,j)=>{
      const hit=svgEl('rect',{x:L+pw*j/n,y:T,width:pw/n,height:ph,fill:'transparent',class:'hitband'});
      hit.addEventListener('mouseenter',()=>{
        guide.setAttribute('x1',X(j));guide.setAttribute('x2',X(j));guide.setAttribute('visibility','visible');
        const rows=syms.map(c=>[c.symbol,c[key][qi]]).filter(r=>finite(r[1])).sort((p,q)=>q[1]-p[1]);
        tip.replaceChildren(make('b','',Q[qi]+' · '+label),...rows.map(([s,val])=>{const r=make('div','ct-tip-row');const dot=make('span','dot');dot.style.background=color[s];r.append(dot,`${s}: ${fmt(val,d)}${pct?'%':' tỷ đ'}`);return r}));
        tip.style.display='block';
      });
      hit.addEventListener('mousemove',e=>{const box=card.getBoundingClientRect();tip.style.left=Math.min(e.clientX-box.left+14,box.width-190)+'px';tip.style.top=(e.clientY-box.top+14)+'px'});
      hit.addEventListener('mouseleave',()=>{guide.setAttribute('visibility','hidden');tip.style.display='none'});
      svg.append(hit);
    });
    chart.append(svg);
    const parts=[];
    if(clipped.length)parts.push('Ngoài thang (vẽ tại mép): '+clipped.slice(0,6).join('; ')+(clipped.length>6?` và ${clipped.length-6} điểm khác`:'')+'.');
    syms.filter(c=>c.note).forEach(c=>parts.push(c.symbol+': '+c.note));
    if(parts.length)note.append(make('p','source-note',parts.join(' ')));
  }
  function update(){
    const v=view(),N=v.labels.length;
    state.to=Math.min(state.to,N-1);state.from=Math.min(state.from,state.to);
    sub.textContent='Chọn chỉ tiêu, bật/tắt doanh nghiệp, đổi chu kỳ và khoảng thời gian · '+v.labels[0]+' → '+v.labels[N-1];
    [...metricRow.children].forEach(b=>b.setAttribute('aria-selected',String(b.dataset.k===state.metric)));
    [...typeRow.children].forEach(b=>{const on=b.dataset.k===state.type;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
    [...axis.querySelectorAll('button')].forEach(b=>{const on=(b.dataset.k==='fit')===state.fit;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.disabled=state.type==='bar'&&b.dataset.k==='fit'});
    chips.querySelectorAll('.ct-chip').forEach(b=>{const on=state.selected.has(b.dataset.symbol);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
    modeS.value=state.mode;
    for(const s of [fromS,toS]){s.replaceChildren(...v.labels.map((q,i)=>{const o=make('option','',q);o.value=String(i);return o}))}
    fromS.value=String(state.from);toS.value=String(state.to);
    hz.replaceChildren(...HORIZONS[state.mode].map(([k,label,len])=>{const b=make('button','',k==='all'?'Toàn bộ':k);b.type='button';b.title=label;
      const on=state.to===N-1&&state.from===Math.max(0,N-Math.min(len,N));b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));
      b.onclick=()=>{state.to=N-1;state.from=Math.max(0,N-Math.min(len,N));update()};return b}));
    save();draw();
  }
  update();
  card.style.position='relative';
  return card;
}
if(typeof window!=='undefined')window.CompanyTrend={mount};
})();
