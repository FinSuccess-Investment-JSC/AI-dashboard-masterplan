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
const HORIZONS=[['1N','1 năm',4],['2N','2 năm',8],['3N','3 năm',12],['5N','5 năm',20],['all','Toàn bộ',Infinity]];
const KEY='company_trend_v1:';
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
function scale(values,pct){
  let lo=Math.min(0,...values),hi=Math.max(0,...values);
  if(pct){lo=Math.max(lo,-30);hi=Math.min(hi,100)}
  const step=niceStep((hi-lo)||1);
  return {lo:Math.floor(lo/step)*step,hi:Math.ceil(hi/step)*step,step};
}

function mount(host,{sector}){
  const data=window.COMPANY_QUARTERLY;
  if(!data||!data.companies?.some(c=>c.sector===sector))return null;
  const cs=data.companies.filter(c=>c.sector===sector),Q=data.quarters,N=Q.length;
  const groups=[...new Set(cs.map(c=>c.group))];
  const color=Object.fromEntries(cs.map((c,i)=>[c.symbol,colorOf(i)]));
  const bySymbol=Object.fromEntries(cs.map(c=>[c.symbol,c]));
  let state={metric:METRICS[0][0],selected:new Set(cs.filter(c=>c.group===groups[0]).map(c=>c.symbol)),from:Math.max(0,N-12),to:N-1};
  try{
    const s=JSON.parse(localStorage.getItem(KEY+sector)||'null');
    if(s&&METRICS.some(m=>m[0]===s.metric)&&Array.isArray(s.selected)&&s.selected.every(x=>bySymbol[x])&&Number.isInteger(s.from)&&Number.isInteger(s.to)&&s.from>=0&&s.to<N&&s.from<=s.to)
      state={metric:s.metric,selected:new Set(s.selected),from:s.from,to:s.to};
  }catch(e){}
  const save=()=>{try{localStorage.setItem(KEY+sector,JSON.stringify({metric:state.metric,selected:[...state.selected],from:state.from,to:state.to}))}catch(e){}};

  const card=make('div','card company-trend');
  card.append(make('div','chart-title','Xu hướng tài chính theo quý'),
    make('div','chart-sub','Chọn chỉ tiêu, bật/tắt từng doanh nghiệp, chọn khoảng thời gian · '+Q[0]+' → '+Q[N-1]));
  const metricRow=make('div','supply-tabs company-trend-metrics');metricRow.setAttribute('role','tablist');
  METRICS.forEach(([k,label])=>{const b=make('button','tabbtn',label);b.type='button';b.setAttribute('role','tab');b.dataset.k=k;b.onclick=()=>{state.metric=k;update()};metricRow.append(b)});

  const chips=make('div','ct-chips');chips.setAttribute('role','group');chips.setAttribute('aria-label','Chọn doanh nghiệp hiển thị');
  const quick=make('div','ct-quick');
  quick.append(make('span','ct-label','Chọn nhanh'));
  groups.forEach(g=>{const b=make('button','ct-quickbtn',g);b.type='button';b.onclick=()=>{state.selected=new Set(cs.filter(c=>c.group===g).map(c=>c.symbol));update()};quick.append(b)});
  const allBtn=make('button','ct-quickbtn','Tất cả');allBtn.type='button';allBtn.onclick=()=>{state.selected=new Set(cs.map(c=>c.symbol));update()};
  const noneBtn=make('button','ct-quickbtn','Bỏ chọn');noneBtn.type='button';noneBtn.onclick=()=>{state.selected=new Set();update()};
  quick.append(allBtn,noneBtn);
  groups.forEach(g=>{
    const row=make('div','ct-group');row.append(make('span','ct-label',g));
    cs.filter(c=>c.group===g).forEach(c=>{
      const b=make('button','ct-chip');b.type='button';b.dataset.symbol=c.symbol;b.style.setProperty('--series',color[c.symbol]);
      const dot=make('span','dot');dot.setAttribute('aria-hidden','true');b.append(dot,c.symbol);
      b.onclick=()=>{state.selected.has(c.symbol)?state.selected.delete(c.symbol):state.selected.add(c.symbol);update()};
      row.append(b);
    });
    chips.append(row);
  });

  const range=make('div','ct-range');
  const hz=make('div','multiple-horizon');hz.setAttribute('role','group');hz.setAttribute('aria-label','Khoảng thời gian');
  HORIZONS.forEach(([k,label,len])=>{const b=make('button','',k==='all'?'Toàn bộ':k);b.type='button';b.title=label;b.dataset.k=k;b.onclick=()=>{state.to=N-1;state.from=Math.max(0,N-Math.min(len,N));update()};hz.append(b)});
  const sel=label=>{const w=make('label','ct-select');w.append(label+' ');const s=make('select');Q.forEach((q,i)=>{const o=make('option','',q);o.value=String(i);s.append(o)});w.append(s);return [w,s]};
  const [fromW,fromS]=sel('Từ'),[toW,toS]=sel('đến');
  fromS.setAttribute('aria-label','Từ quý');toS.setAttribute('aria-label','Đến quý');
  fromS.onchange=()=>{state.from=+fromS.value;if(state.from>state.to)state.to=state.from;update()};
  toS.onchange=()=>{state.to=+toS.value;if(state.to<state.from)state.from=state.to;update()};
  range.append(hz,fromW,toW);

  const chart=make('div','company-trend-chart'),tip=make('div','chtip ct-tip'),note=make('div'),
    src=make('div','source-note');
  src.append('Nguồn: ');
  const a=make('a','',data.source);a.href='https://widata.vn/';a.target='_blank';a.rel='noopener';
  src.append(a,`. Cập nhật ${data.captured_at.split('-').reverse().join('/')}. Biên = lợi nhuận ÷ doanh thu thuần (tự tính); lãi ròng là lợi nhuận sau thuế của cổ đông công ty mẹ. Quý mới nhất có thể chưa kiểm toán.`);
  card.append(metricRow,quick,chips,range,chart,tip,note,src);

  function draw(){
    const [key,label,unit]=METRICS.find(m=>m[0]===state.metric),pct=unit==='%';
    const syms=cs.filter(c=>state.selected.has(c.symbol)),idx=[];
    for(let i=state.from;i<=state.to;i++)idx.push(i);
    chart.replaceChildren();note.replaceChildren();tip.style.display='none';
    const vals=syms.flatMap(c=>idx.map(i=>c[key][i]).filter(finite));
    if(!syms.length||!vals.length){chart.append(make('div','gap-empty',syms.length?'Không có dữ liệu trong khoảng đã chọn.':'Chưa chọn doanh nghiệp nào. Bấm tên doanh nghiệp hoặc "Chọn nhanh" ở trên.'));return}
    const W=640,H=260,L=54,R=44,T=16,B=36,pw=W-L-R,ph=H-T-B,n=idx.length;
    const sc=scale(vals,pct),Y=v=>T+ph*(sc.hi-Math.min(Math.max(v,sc.lo),sc.hi))/(sc.hi-sc.lo),X=j=>L+pw*(j+0.5)/n;
    const d=pct?1:0;
    const svg=svgEl('svg',{viewBox:`0 0 ${W} ${H}`,width:'100%',class:'chartsvg ct-svg',role:'img','aria-label':`${label} theo quý, ${syms.map(c=>c.symbol).join(', ')}`});
    for(let v=sc.lo;v<=sc.hi+sc.step/2;v+=sc.step){
      svg.append(svgEl('line',{x1:L,x2:W-R,y1:Y(v),y2:Y(v),class:v===0?'axisline':'gridline'}));
      svg.append(svgEl('text',{x:L-8,y:Y(v)+4,'text-anchor':'end',class:'axislabel'},fmt(v,0)+(pct?'%':'')));
    }
    const every=Math.max(1,Math.ceil(n/9));
    idx.forEach((qi,j)=>{if(j%every===0||j===n-1){if(j!==n-1&&n-1-j<every/2&&j!==0)return;
      svg.append(svgEl('text',{x:X(j),y:H-12,'text-anchor':'middle',class:'catlabel',transform:`rotate(-35 ${X(j)} ${H-12})`,'font-size':9.5},Q[qi]))}});
    const clipped=[],endY=[];
    syms.forEach(c=>{
      const col=color[c.symbol];let path='',pen=false;
      idx.forEach((qi,j)=>{const v=c[key][qi];if(!finite(v)){pen=false;return}path+=(pen?'L':'M')+X(j).toFixed(1)+' '+Y(v).toFixed(1);pen=true});
      if(path)svg.append(svgEl('path',{d:path,fill:'none',stroke:col,'stroke-width':2.2,'stroke-linecap':'round','stroke-linejoin':'round'}));
      let last=-1;
      idx.forEach((qi,j)=>{
        const v=c[key][qi];if(!finite(v))return;last=j;
        const out=pct&&(v<sc.lo||v>sc.hi);
        svg.append(svgEl('circle',{cx:X(j),cy:Y(v),r:out?4:n>14?2.2:3,fill:out?'#fff':col,stroke:out?col:'#fff','stroke-width':out?1.8:1}));
        if(out)clipped.push(`${c.symbol} ${Q[qi]}: ${fmt(v,1)}%`);
      });
      if(last>=0){let y=Y(c[key][idx[last]])+4;while(endY.some(e=>Math.abs(e-y)<11))y+=11;endY.push(y);
        svg.append(svgEl('text',{x:X(last)+8,y,class:'endlabel',fill:col,'font-size':9.5,'font-weight':700},c.symbol))}
    });
    // Hover: a vertical guide plus a tooltip listing every visible line for that quarter.
    const guide=svgEl('line',{y1:T,y2:T+ph,stroke:'#b8c7d9','stroke-width':1,visibility:'hidden'});svg.append(guide);
    idx.forEach((qi,j)=>{
      const hit=svgEl('rect',{x:L+pw*j/n,y:T,width:pw/n,height:ph,fill:'transparent',class:'hitband'});
      hit.addEventListener('mouseenter',()=>{
        guide.setAttribute('x1',X(j));guide.setAttribute('x2',X(j));guide.setAttribute('visibility','visible');
        const rows=syms.map(c=>[c.symbol,c[key][qi]]).filter(r=>finite(r[1])).sort((p,q)=>q[1]-p[1]);
        tip.replaceChildren(make('b','',Q[qi]+' · '+label),...rows.map(([s,v])=>{const r=make('div','ct-tip-row');const dot=make('span','dot');dot.style.background=color[s];r.append(dot,`${s}: ${fmt(v,d)}${pct?'%':' tỷ đ'}`);return r}));
        tip.style.display='block';
      });
      hit.addEventListener('mousemove',e=>{const box=card.getBoundingClientRect();tip.style.left=Math.min(e.clientX-box.left+14,box.width-190)+'px';tip.style.top=(e.clientY-box.top+14)+'px'});
      hit.addEventListener('mouseleave',()=>{guide.setAttribute('visibility','hidden');tip.style.display='none'});
      svg.append(hit);
    });
    chart.append(svg);
    const parts=[];
    if(clipped.length)parts.push('Ngoài thang (vẽ tại mép, chấm rỗng): '+clipped.slice(0,6).join('; ')+(clipped.length>6?` và ${clipped.length-6} điểm khác`:'')+'.');
    syms.filter(c=>c.note).forEach(c=>parts.push(c.symbol+': '+c.note));
    if(parts.length)note.append(make('p','source-note',parts.join(' ')));
  }
  function update(){
    [...metricRow.children].forEach(b=>b.setAttribute('aria-selected',String(b.dataset.k===state.metric)));
    chips.querySelectorAll('.ct-chip').forEach(b=>{const on=state.selected.has(b.dataset.symbol);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
    [...hz.children].forEach(b=>{const len=HORIZONS.find(h=>h[0]===b.dataset.k)[2];const on=state.to===N-1&&state.from===Math.max(0,N-Math.min(len,N));b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
    fromS.value=String(state.from);toS.value=String(state.to);
    save();draw();
  }
  update();
  card.style.position='relative';
  return card;
}
if(typeof window!=='undefined')window.CompanyTrend={mount};
})();
