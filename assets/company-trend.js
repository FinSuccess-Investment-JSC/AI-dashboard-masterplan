/* Quarterly trend per company group: revenue, gross profit, net profit and margins (data/company-quarterly.js). */
(() => {
'use strict';
const NS='http://www.w3.org/2000/svg';
const COLORS=['#1f4e9c','#d1583f','#27af95','#d99000','#a45bb8','#2f8f4e','#4b5bd4','#b8443a'];
const METRICS=[
  ['gross_margin','Biên gộp','%'],['net_margin','Biên ròng','%'],
  ['revenue','Doanh thu','tỷ đ'],['gross_profit','Lãi gộp','tỷ đ'],['net_income','Lãi ròng','tỷ đ']
];
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const svgEl=(tag,attrs,text)=>{const n=document.createElementNS(NS,tag);for(const k in attrs||{})n.setAttribute(k,attrs[k]);if(text!==undefined)n.textContent=text;return n};
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const fmt=(v,d)=>v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d});

function niceStep(span,target=4){
  const raw=span/target,mag=Math.pow(10,Math.floor(Math.log10(raw))),n=raw/mag;
  return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*mag;
}

/* Margins clamp to [-20, 100] so one distressed quarter does not flatten every other line;
   clipped points sit on the edge as hollow markers and are listed under the chart. */
function scale(values,pct){
  let lo=Math.min(0,...values),hi=Math.max(0,...values);
  if(pct){lo=Math.max(lo,-20);hi=Math.min(hi,100)}
  const step=niceStep((hi-lo)||1);
  return {lo:Math.floor(lo/step)*step,hi:Math.ceil(hi/step)*step,step};
}

function draw(host,data,group,metric,legendBox,noteBox){
  const [key,label,unit]=metric,pct=unit==='%';
  const cs=data.companies.filter(c=>c.group===group);
  const W=640,H=260,L=54,R=44,T=16,B=34,pw=W-L-R,ph=H-T-B,n=data.quarters.length;
  const all=cs.flatMap(c=>c[key].filter(finite));
  host.replaceChildren();legendBox.replaceChildren();noteBox.replaceChildren();
  if(!all.length){host.append(make('div','gap-empty','Chưa có dữ liệu cho nhóm này.'));return}
  const sc=scale(all,pct),Y=v=>T+ph*(sc.hi-Math.min(Math.max(v,sc.lo),sc.hi))/(sc.hi-sc.lo),X=i=>L+pw*(i+0.5)/n;
  const d=pct?1:0;
  const svg=svgEl('svg',{viewBox:`0 0 ${W} ${H}`,width:'100%',class:'chartsvg ct-svg',role:'img','aria-label':`${label} theo quý, nhóm ${group}`});
  for(let v=sc.lo;v<=sc.hi+sc.step/2;v+=sc.step){
    svg.append(svgEl('line',{x1:L,x2:W-R,y1:Y(v),y2:Y(v),class:v===0?'axisline':'gridline'}));
    svg.append(svgEl('text',{x:L-8,y:Y(v)+4,'text-anchor':'end',class:'axislabel'},fmt(v,pct?(sc.step<1?1:0):0)+(pct?'%':'')));
  }
  data.quarters.forEach((q,i)=>svg.append(svgEl('text',{x:X(i),y:H-12,'text-anchor':'middle',class:'catlabel',transform:`rotate(-35 ${X(i)} ${H-12})`,'font-size':9.5},q)));
  const clipped=[],endY=[];
  cs.forEach((c,ci)=>{
    const color=COLORS[ci%COLORS.length],vals=c[key];let path='',pen=false;
    vals.forEach((v,i)=>{if(!finite(v)){pen=false;return}path+=(pen?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1);pen=true});
    if(path)svg.append(svgEl('path',{d:path,fill:'none',stroke:color,'stroke-width':2.2,'stroke-linecap':'round','stroke-linejoin':'round'}));
    vals.forEach((v,i)=>{
      if(!finite(v))return;
      const out=pct&&(v<sc.lo||v>sc.hi);
      const dot=svgEl('circle',{cx:X(i),cy:Y(v),r:out?4:3,fill:out?'#fff':color,stroke:out?color:'#fff','stroke-width':out?1.8:1.2});
      dot.append(svgEl('title',{},`${c.symbol} · ${data.quarters[i]}: ${fmt(v,d)}${pct?'%':' tỷ đ'}`));
      svg.append(dot);
      if(out)clipped.push(`${c.symbol} ${data.quarters[i]}: ${fmt(v,1)}%`);
    });
    const last=vals.map((v,i)=>finite(v)?i:-1).filter(i=>i>=0).pop();
    if(last!==undefined){let y=Y(vals[last])+4;while(endY.some(e=>Math.abs(e-y)<11))y+=11;endY.push(y);svg.append(svgEl('text',{x:X(last)+8,y,class:'endlabel',fill:color,'font-size':9.5,'font-weight':700},c.symbol))}
    const chip=make('span','li');const dotEl=make('span','dot');dotEl.style.background=color;chip.append(dotEl,c.symbol);legendBox.append(chip);
  });
  host.append(svg);
  const parts=[];
  if(clipped.length)parts.push('Ngoài thang (vẽ tại mép, chấm rỗng): '+clipped.join('; ')+'.');
  const notes=cs.filter(c=>c.note).map(c=>c.symbol+': '+c.note);
  if(notes.length)parts.push(notes.join(' '));
  const missing=(data.missing||[]).filter(x=>x.group===group).map(x=>x.symbol);
  if(missing.length)parts.push('Chưa có dữ liệu quý trên Wi: '+missing.join(', ')+'.');
  if(parts.length)noteBox.append(make('p','source-note',parts.join(' ')));
}

function mount(host,{sector}){
  const data=window.COMPANY_QUARTERLY;
  if(!data||!data.companies?.some(c=>c.sector===sector))return null;
  const own={...data,companies:data.companies.filter(c=>c.sector===sector)};
  const groups=[...new Set(own.companies.map(c=>c.group))];
  const card=make('div','card company-trend');
  const title=make('div','chart-title','Xu hướng tài chính theo quý, theo nhóm');
  const sub=make('div','chart-sub','Doanh thu, lãi gộp, lãi ròng (tỷ đồng) và biên lợi nhuận · '+own.quarters[0]+' → '+own.quarters[own.quarters.length-1]);
  const groupRow=make('div','supply-tabs company-trend-groups');groupRow.setAttribute('role','tablist');
  const metricRow=make('div','supply-tabs company-trend-metrics');metricRow.setAttribute('role','tablist');
  const chart=make('div','company-trend-chart'),legend=make('div','legend'),note=make('div');
  let g=groups[0],m=METRICS[0];
  const refresh=()=>{
    [...groupRow.children].forEach(b=>b.setAttribute('aria-selected',String(b.dataset.k===g)));
    [...metricRow.children].forEach(b=>b.setAttribute('aria-selected',String(b.dataset.k===m[0])));
    draw(chart,own,g,m,legend,note);
  };
  groups.forEach(name=>{const b=make('button','tabbtn',name);b.type='button';b.setAttribute('role','tab');b.dataset.k=name;b.onclick=()=>{g=name;refresh()};groupRow.append(b)});
  METRICS.forEach(mm=>{const b=make('button','tabbtn',mm[1]);b.type='button';b.setAttribute('role','tab');b.dataset.k=mm[0];b.onclick=()=>{m=mm;refresh()};metricRow.append(b)});
  const src=make('div','source-note');
  src.append('Nguồn: ');
  const a=make('a','',own.source);a.href='https://widata.vn/';a.target='_blank';a.rel='noopener';src.append(a,`. Cập nhật ${own.captured_at.split('-').reverse().join('/')}. Biên = lợi nhuận ÷ doanh thu thuần (tự tính); lãi ròng là lợi nhuận sau thuế của cổ đông công ty mẹ. Quý mới nhất có thể chưa kiểm toán.`);
  card.append(title,sub,groupRow,metricRow,chart,legend,note,src);
  refresh();
  return card;
}
if(typeof window!=='undefined')window.CompanyTrend={mount};
})();
