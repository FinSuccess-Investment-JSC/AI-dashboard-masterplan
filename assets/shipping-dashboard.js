/* Shipping dashboard: value chain, Tàu dầu & khí / Hàng rời / Container panes, charts from window.SHIPPING_PUBLIC
   (scripts/build_sector_public.py: public commodity series only) and the shared PortWatch chokepoint feeds in window.SECTOR_DAILY
   (hormuz, bab_el_mandeb). Document figures sit in the HTML tables and are backed by data/shipping/evidence.json.
   Publishes window.SHIPPING_BRIEF for catalyst-board.js. Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='shipping')return;
const W=window.SHIPPING_PUBLIC||{blocks:{}},B=W.blocks||{},D=window.SECTOR_DAILY?.sources||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const qtr=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],baltic:['Baltic Exchange','https://www.balticexchange.com/'],portwatch:['IMF PortWatch','https://portwatch.imf.org/'],wi:['Nguồn công khai',null]};
for(const v of Object.values(macro)){if(/nso\.gov\.vn\/wp-content/.test(v.url||'')&&SRC.nso)SRC.nso=[SRC.nso[0],v.url];if(/customs/.test(v.url||'')&&SRC.customs)SRC.customs=[SRC.customs[0],v.url]}
const S=k=>macro[k]?.records||com[k]?.records||[];
const ym=d=>d.slice(0,7);
const byMonth=rs=>{const m={};rs.forEach(r=>{m[ym(r.date)]=r});return m};
const yoyAt=(rs,r)=>{if(!r)return null;const p=rs.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};
const ytdYo=rs=>{const l=rs.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),sum=yy=>rs.filter(r=>r.date.slice(0,4)===yy&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0);const p=sum(String(y-1));return p?(sum(y)/p-1)*100:null};
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;

// ---------- 1. Value chain ----------
const chain=document.querySelector('[data-block-id="vt-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='10/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['cargo',25,40,['Chủ hàng','dầu, LPG · than, ngũ cốc · container']],['charter',315,40,['Thuê tàu','định hạn (TC) · chuyến (spot)']],['tanker',605,40,['Tàu dầu & khí','PVT · VTO · VIP · PVP · GSP']],['rate',895,40,['Cước thế giới','BDTI · BCTI · BDI · SCFI']],
  ['bulk',605,165,['Hàng rời','VOS · VNA']],['box',605,290,['Container nội Á','HAH']],
  ['route',895,165,['Tuyến & eo biển','Hormuz · Biển Đỏ · Suez']],['supply',895,290,['Cung tàu','orderbook · phá dỡ · tuổi tàu']],
  ['cost',315,165,['Chi phí','nhiên liệu · khấu hao · lãi vay USD']],['owner',25,165,['Chủ sở hữu','PVN · VIMC · VSC · tư nhân']]
 ];
 const edges=[['cargo','charter'],['charter','tanker'],['charter','bulk'],['charter','box'],['tanker','rate'],['bulk','rate'],['box','rate'],['route','rate',true],['supply','rate',true],['cost','tanker',true],['owner','tanker',true]];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b];let d;
  if(A[2]===Bn[2]){const fw=Bn[1]>A[1];d=`M${A[1]+(fw?w:0)} ${A[2]+h/2} H${Bn[1]+(fw?0:w)}`}
  else if(A[1]===Bn[1]){d=`M${A[1]+w/2} ${A[2]+(Bn[2]>A[2]?h:0)} V${Bn[2]+(Bn[2]>A[2]?0:h)}`}
  else{const fw=Bn[1]>A[1],x1=A[1]+(fw?w:0),y1=A[2]+h/2,x2=Bn[1]+(fw?0:w),y2=Bn[2]+h/2,mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`}
  return `<path d="${d}" class="chain-edge${dashed?' dashed':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t.replace(/&/g,'&amp;')}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1140 375" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành vận tải biển</title><desc id="chain-desc">Chủ hàng thuê tàu định hạn hoặc theo chuyến; ba đội tàu dầu khí, hàng rời, container nhận cước theo chỉ số thế giới; tuyến đường và cung tàu quyết định cước, chi phí nhiên liệu và lãi vay USD quyết định biên.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: cước là biến số lớn nhất, nhưng doanh nghiệp chỉ nhận cước thị trường ở phần tàu chạy chuyến (spot); phần cho thuê định hạn (TC) đã khóa giá 1–3 năm nên lợi nhuận đi sau cước 2–4 quý. PVT, GSP có hợp đồng dài với PVN nên ổn định nhất; VOS, VNA chạy spot nhiều nên nhạy với BDI nhất. Cước tăng do eo biển bị chặn (Hormuz, Biển Đỏ) là tăng vì tấn-dặm, không vì cầu hàng — cung tàu quay lại tuyến ngắn thì cước xuống nhanh.'));
 figure.after(make('div','source-note','Mũi tên liền: dòng hàng và cước · Mũi tên đứt: yếu tố quyết định cước và chi phí. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Panes ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead');
 const children=[...section.children].filter(e=>e!==head),tank=make('div','supply-pane'),bulk=make('div','supply-pane'),box=make('div','supply-pane');
 tank.id='supply-world';bulk.id='supply-vietnam';box.id='supply-trade';
 let cur=tank;children.forEach(e=>{if(e.matches('h3.subhead')){const t=e.textContent.trim();cur=t.startsWith('Hàng rời')?bulk:t.startsWith('Container')?box:tank;e.remove();return}cur.append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Phân khúc');
 const panes=[tank,bulk,box],labels=['Tàu dầu & khí','Hàng rời','Container'];
 function select(i){panes.forEach((p,j)=>{p.hidden=i!==j;const b=tabs.children[j];b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1})}
 labels.forEach((label,i)=>{const b=make('button','tabbtn',label);b.type='button';b.id='supply-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',panes[i].id);panes[i].setAttribute('role','tabpanel');panes[i].setAttribute('aria-labelledby',b.id);b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{const n=panes.length;let next;if(e.key==='ArrowRight')next=(i+1)%n;else if(e.key==='ArrowLeft')next=(i+n-1)%n;else if(e.key==='Home')next=0;else if(e.key==='End')next=n-1;if(next!==undefined){e.preventDefault();select(next);tabs.children[next].focus()}});tabs.append(b)});
 head.after(tabs,...panes);select(0);
}

// ---------- 3. Charts ----------
function sourceLine(id,parts,period,method,wi=true){
 const host=document.getElementById(id);if(!host)return;const block=host.closest('.card');
 const n=make('div','source-note cadence-note');n.append('Nguồn: ');
 parts.forEach(([name,url],i)=>{if(i)n.append(' · ');if(url){const a=make('a','',name);a.href=url;a.target='_blank';a.rel='noopener';n.append(a)}else n.append(name)});
 n.append(` · Kỳ cuối: ${period}`+(wi?` · Kiểm: ${checked?short(checked.slice(0,4)+'-'+checked.slice(4,6)+'-'+checked.slice(6,8)):'—'}`:''));host.after(n);
 if(method)n.after(make('div','source-note method-note',method));
 if(block&&wi){block.dataset.refreshStatus='loaded';block.dataset.sourceIds='public'}
}
function insight(id,text){const block=document.getElementById(id)?.closest('.card');if(!block)return;const n=make('div','chart-insight');n.dataset.inputOwner='ai';n.innerHTML='<b>Cách hiểu trong bối cảnh ngành · AI:</b> ';n.append(text);block.append(n)}
function legend(id,items){const host=document.getElementById(id);if(!host)return;const l=make('div','legend');items.forEach(([n,c])=>{const s=make('span','li'),d=make('span','dot');d.style.background=c;s.append(d,n);l.append(s)});host.after(l)}
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;const ve=card.querySelector('.value'),seg=String(sub??'').split(' · '),hasU=value!=='—'&&seg.length>1&&/^(nghìn|triệu|tỷ|USD|CNY|VND|US cent|điểm|lượt)/.test(seg[0]);ve.textContent=value;if(hasU){const u=document.createElement('span');u.className='unit';u.style.cssText='font-size:12px;font-weight:600;color:var(--muted,#6b7a90);margin-left:6px;letter-spacing:0';u.textContent=seg[0];ve.append(u)}card.querySelector('.sub').textContent=hasU?seg.slice(1).join(' · '):sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();const sv=(series||[]).filter(Number.isFinite);if(sv.length>1)sparkline(spark,sv,color)}
function lines(id,base,series,unit,digits,zeroBase=false){barLineChart(id,{categories:base.map(r=>mon(r.date)),series:series.map(([n,c,f])=>({name:n,color:c,kind:'line',values:base.map(f)})),unit,digits,height:260,zeroBase,rotateLabels:true})}

const bdti=S('bdti'),bcti=S('bcti'),bdi=S('bdi'),brent=S('brent'),fo=S('fuel_oil_cn');
// Tàu dầu
if(bdti.length&&document.getElementById('chTanker')){
 const cm=byMonth(bcti);
 lines('chTanker',bdti,[['BDTI (dầu thô)',C.navy,r=>r.value],['BCTI (dầu sản phẩm)',C.teal,r=>cm[ym(r.date)]?.value??null]],'điểm',0,true);
 legend('chTanker',[['BDTI · dầu thô',C.navy],['BCTI · dầu sản phẩm',C.teal]]);
 fillTable('tbl-tanker',['Kỳ','BDTI','BDTI YoY','BCTI','BCTI YoY'],bdti.slice().reverse().map(r=>{const c=cm[ym(r.date)];return [short(r.date),nf(r.value,0),signed(yoyAt(bdti,r),0)+'%',nf(c?.value,0),signed(yoyAt(bcti,c),0)+'%']}));
 sourceLine('chTanker',[SRC.baltic],short(bdti.at(-1).date),'Baltic Dirty Tanker Index và Clean Tanker Index, nén chuỗi ngày về cuối tháng. Chỉ số cước thế giới, không phải cước PVT, VTO ký được.');
 insight('chTanker','BDTI '+nf(bdti.at(-1).value,0)+' điểm là mức cao nhất của chuỗi, gấp hơn 5 lần một năm trước; BCTI cũng gấp gần 4 lần. Nguyên nhân là Hormuz gần như đóng từ tháng 3/2026 (xem tab Địa chính trị): dầu Trung Đông phải đi vòng, tấn-dặm tăng trong khi cung tàu không đổi. Doanh nghiệp Việt Nam hưởng lợi ở phần tàu chạy spot và khi hợp đồng TC đáo hạn được ký lại; phần đang khóa giá chưa thấy ngay.');
}
const fx=byMonth(S('cny_usd')),foUsd=r=>{const f=byMonth(fo)[ym(r.date)],x=fx[ym(r.date)];return f&&x?f.value/x.value:null};
if(brent.length&&document.getElementById('chFuel')){
 const fm=byMonth(fo);
 lines('chFuel',brent,[['Brent (USD/thùng)',C.gold,r=>r.value],['Dầu nhiên liệu SHFE (USD/tấn ÷10)',C.plum,r=>{const v=foUsd(r);return v==null?null:v/10}]],'',1,true);
 legend('chFuel',[['Brent USD/thùng',C.gold],['Dầu nhiên liệu SHFE USD/tấn ÷10',C.plum]]);
 fillTable('tbl-fuel',['Kỳ','Brent (USD/thùng)','Brent YoY','Dầu nhiên liệu SHFE (CNY/tấn)','Tỷ giá CNY/USD','Dầu nhiên liệu (USD/tấn)'],brent.slice().reverse().map(r=>{const f=fm[ym(r.date)];return [short(r.date),nf(r.value,2),signed(yoyAt(brent,r),0)+'%',nf(f?.value,0),nf(fx[ym(r.date)]?.value,4),nf(foUsd(r),0)]}));
 sourceLine('chFuel',[['EIA · Brent spot','https://www.eia.gov/dnav/pet/hist/RBRTEd.htm'],['SHFE fuel oil','https://www.shfe.com.cn/eng/Market/Futures/'],['Tỷ giá Fed H.10 (DEXCHUS)','https://fred.stlouisfed.org/series/DEXCHUS']],short(brent.at(-1).date),'Brent spot (EIA), phiên cuối tháng. Dầu nhiên liệu: hợp đồng chính SHFE (CNY/tấn) chia tỷ giá CNY/USD phiên cuối tháng (Fed H.10) = USD/tấn, vẽ ÷10 để cùng trục. Đây là dầu nhiên liệu Thượng Hải, không phải VLSFO Singapore.');
 insight('chFuel','Nhiên liệu là chi phí biến đổi lớn nhất của chuyến đi. Brent +'+nf(yoyAt(brent,brent.at(-1)),0)+'% YoY đẩy chi phí lên, nhưng với tàu cho thuê định hạn thì người thuê trả nhiên liệu, nên PVT, GSP ít bị ảnh hưởng hơn VOS, VNA chạy chuyến.');
}
// Hàng rời
if(bdi.length&&document.getElementById('chBdi')){
 lines('chBdi',bdi,[['BDI',C.gold,r=>r.value]],'điểm',0,true);
 fillTable('tbl-bdi',['Kỳ','Điểm','So cùng kỳ'],bdi.slice().reverse().map(r=>[short(r.date),nf(r.value,0),signed(yoyAt(bdi,r),0)+'%']));
 sourceLine('chBdi',[['Baltic Exchange qua CNBC (.BADI)','https://www.cnbc.com/quotes/.BADI']],short(bdi.at(-1).date),'Baltic Dry Index, phiên cuối mỗi tháng (CNBC). VOS, VNA chạy tàu Supramax/Handysize; BDI gồm cả Capesize nên biên độ lớn hơn cước thực của hai mã.');
 insight('chBdi','BDI '+nf(bdi.at(-1).value,0)+' điểm ('+short(bdi.at(-1).date)+'), '+signed(yoyAt(bdi,bdi.at(-1)),0)+'% so cùng kỳ: cầu than, quặng, ngũ cốc tốt trong khi orderbook hàng rời thấp. Đây là cửa sổ để VOS, VNA bán tàu cũ giá cao hoặc ký TC dài.');
}
const sea=S('sea_freight'),ov=S('overseas_freight');
if(sea.length&&document.getElementById('chSea')){
 const om=byMonth(ov),rs=sea.slice(-36);
 barLineChart('chSea',{categories:rs.map(r=>mon(r.date)),series:[{name:'Đường biển',color:C.navy,values:rs.map(r=>r.value/1000)},{name:'Ngoài nước (mọi phương thức)',color:C.plum,kind:'line',values:rs.map(r=>om[ym(r.date)]?om[ym(r.date)].value/1000:null)}],unit:'triệu tấn',digits:1,height:260,rotateLabels:true});
 legend('chSea',[['Đường biển',C.navy],['Ngoài nước',C.plum]]);
 fillTable('tbl-sea',['Tháng','Đường biển (triệu tấn)','YoY','Ngoài nước (triệu tấn)','YoY'],sea.slice().reverse().map(r=>{const o=om[ym(r.date)];return [mon(r.date),nf(r.value/1000,2),signed(yoyAt(sea,r),1)+'%',nf((o?.value??NaN)/1000,2),signed(yoyAt(ov,o),1)+'%']}));
 sourceLine('chSea',[SRC.nso],mon(sea.at(-1).date),'Khối lượng hàng do doanh nghiệp vận tải Việt Nam chở bằng đường biển và vận chuyển ngoài nước. Đo việc làm của đội tàu Việt Nam, không phải hàng qua cảng.');
 insight('chSea','Lũy kế 9T/2026 đường biển '+signed(ytdYo(sea),0)+'%, chuyến ngoài nước '+signed(ytdYo(ov),0)+'%: đội tàu Việt Nam đang chạy nhiều hơn, khớp với cước cao. Luân chuyển (tấn-km) lũy kế '+signed(yoyAt(S('sea_tonkm_ytd'),S('sea_tonkm_ytd').at(-1)),0)+'% — quãng đường dài hơn là dấu hiệu tuyến đi vòng.');
}
const ps=S('ppi_sea'),pw=S('ppi_water');
if(ps.length&&document.getElementById('chPpi')){
 const wm=byMonth(pw),rs=ps.slice(-16);
 barLineChart('chPpi',{categories:rs.map(r=>qtr(r.date)),series:[{name:'Ven biển & viễn dương',color:C.navy,kind:'line',values:rs.map(r=>r.value)},{name:'Đường thủy (chung)',color:C.teal,kind:'line',values:rs.map(r=>wm[ym(r.date)]?.value??null)}],unit:'%',digits:1,height:260,zeroBase:false,rotateLabels:false});
 legend('chPpi',[['Ven biển & viễn dương',C.navy],['Đường thủy chung',C.teal]]);
 fillTable('tbl-ppi',['Quý','Ven biển & viễn dương','Đường thủy chung'],ps.slice().reverse().map(r=>[qtr(r.date),nf(r.value,2),nf(wm[ym(r.date)]?.value,2)]));
 sourceLine('chPpi',[SRC.nso],qtr(ps.at(-1).date),'Chỉ số giá sản xuất dịch vụ vận tải ven biển và viễn dương, đường thủy, % so cùng kỳ.');
 insight('chPpi','Giá dịch vụ vận tải biển trong nước tăng ~12% YoY hai quý liền, cao nhất từ 2022: cước thế giới đã truyền vào giá doanh nghiệp Việt Nam ký được, không chỉ ở chỉ số Baltic.');
}
// Container (số liệu của toàn ngành đã ở trên; chart riêng dùng XNK làm cầu)
const ex=S('exports'),im=S('imports');
/* Grouped bars for supply vs demand growth (document figures, can be negative). */
function groupBars(id,o){
  const host=document.getElementById(id);if(!host)return;
  const W=640,H=260,padL=46,padR=12,padT=20,padB=34,plotW=W-padL-padR,plotH=H-padT-padB;
  const vals=o.series.flatMap(s=>s.values).filter(v=>Number.isFinite(v));
  const maxV=Math.max(0,...vals),minV=Math.min(0,...vals),span=(maxV-minV)||1;
  const top=maxV+span*0.22,bot=minV<0?minV-span*0.22:0;
  const y=v=>padT+plotH*(top-v)/(top-bot);
  const svg=baseSvg(W,H,o.ariaLabel||id);
  const step=niceMax((top-bot)/4);
  for(let g=Math.ceil(bot/step)*step;g<=top;g+=step){svg.appendChild(el('line',{x1:padL,x2:W-padR,y1:y(g),y2:y(g),class:g===0?'axisline':'gridline'}));svg.appendChild(txt('text',{x:padL-8,y:y(g)+3,'text-anchor':'end',class:'axislabel'},(g>0?'+':'')+nf(g,0)+'%'));}
  const gw=plotW/o.groups.length,ns=o.series.length,bw=Math.min(44,(gw*0.72)/ns);
  o.groups.forEach((g,gi)=>{
    const x0=padL+gi*gw+(gw-bw*ns)/2;
    o.series.forEach((sr,si)=>{const v=sr.values[gi],x=x0+si*bw;
      if(!Number.isFinite(v)){svg.appendChild(txt('text',{x:x+bw/2,y:y(0)-6,'text-anchor':'middle',class:'endlabel',fill:'var(--ink3)'},'chưa có'));return;}
      const r=el('rect',{x:x+3,y:Math.min(y(0),y(v)),width:bw-6,height:Math.max(2,Math.abs(y(0)-y(v))),rx:3,ry:3,fill:sr.color});
      r.appendChild(txt('title',{},g+' · '+sr.name+': '+(v>0?'+':'')+nf(v,1)+'%'));svg.appendChild(r);
      svg.appendChild(txt('text',{x:x+bw/2,y:v>=0?y(v)-5:y(v)+13,'text-anchor':'middle',class:'endlabel',fill:'var(--ink2)'},(v>0?'+':'')+nf(v,1)+'%'));
    });
    svg.appendChild(txt('text',{x:padL+gi*gw+gw/2,y:H-padB+18,'text-anchor':'middle',class:'axislabel'},g));
  });
  host.innerHTML='';host.appendChild(svg);
  const leg=make('div','legend');o.series.forEach(sr=>{const li=make('span','li');const sw=make('i','sw');sw.style.background=sr.color;sw.style.height='9px';li.append(sw,document.createTextNode(sr.name));leg.append(li)});host.appendChild(leg);
}
const BIMCO=[['BIMCO qua Cyprus Shipping News','https://cyprusshippingnews.com/?s=BIMCO']];
if(document.getElementById('chSdTanker')){
  groupBars('chSdTanker',{groups:['2026','2027'],series:[{name:'Cầu nếu Hormuz đóng kéo dài',color:C.navy,values:[-12,-9.5]},{name:'Cầu nếu Hormuz mở lại',color:C.teal,values:[-5,7.5]},{name:'Cung đội tàu',color:C.red,values:[-0.5,5.5]}],ariaLabel:'Cung cầu tanker dầu thô theo BIMCO'});
  sourceLine('chSdTanker',[['BIMCO tanker 6/2026 qua Hellenic Shipping News','https://www.hellenicshippingnews.com/?p=1136526']],'6/2026','Điểm giữa các khoảng BIMCO đưa ra (vd −11…−13% vẽ −12%). Cầu tính theo tấn-dặm.',false);
  insight('chSdTanker','Cầu tanker theo tấn giảm vì dầu Vịnh không xuất được, nhưng cung tàu 2026 gần như không tăng (0 đến −1%) và tàu bị kẹt, nên cước vẫn ở đỉnh. Đến 2027 cung +5–6% — nếu Hormuz vẫn đóng thì cả cầu và cước cùng giảm; nếu mở lại, cầu bật +7,5% nhưng tàu mới cũng về.');
}
if(document.getElementById('chSdBulk')){
  groupBars('chSdBulk',{groups:['2026','2027','2028'],series:[{name:'Cầu (tấn-dặm)',color:C.navy,values:[3,1.5,1.5]},{name:'Cung đội tàu',color:C.red,values:[2,3.5,3.5]}],ariaLabel:'Cung cầu hàng rời theo BIMCO'});
  sourceLine('chSdBulk',[['BIMCO dry bulk 11/2026','https://cyprusshippingnews.com/2026/11/02/bimco-dry-bulk-shipping-market-overview-outlook-3'],['BIMCO dry bulk 7/2026 (số 2026)','https://cyprusshippingnews.com/2026/07/31/bimco-dry-bulk-shipping-market-overview-outlook-2/']],'11/2026 (2027–2028); 7/2026 (2026)','Điểm giữa khoảng BIMCO, kịch bản Hormuz đóng: cầu 2027–2028 +0,5…2,5%, cung +3…4%. Số 2026 (cầu +2,5…3,5%, cung +1,5…2,5%) vẫn từ bản 7/2026 vì bản 11/2026 không nêu lại.',false);
  insight('chSdBulk','2026 cầu còn vượt cung (+3% so +2%) nên BDI giữ cao, thuận cho VOS, VNA. 2027–2028 cung +3,5% vượt cầu +1,5% (BIMCO 11/2026, kịch bản Hormuz đóng) — cung/cầu yếu dần từ mặt bằng cao, cước khó giữ.');
}
if(document.getElementById('chSdCont')){
  groupBars('chSdCont',{groups:['2026','2027'],series:[{name:'Cầu (khối lượng, 7T/2026 thực tế)',color:C.navy,values:[5.1,NaN]},{name:'Cung đội tàu',color:C.red,values:[4.6,9]}],ariaLabel:'Cung cầu container theo BIMCO'});
  sourceLine('chSdCont',[['BIMCO container 9/2026','https://cyprusshippingnews.com/2026/09/28/bimcos-container-shipping-market-overview-outlook-september-2026-is-out/']],'9/2026','BIMCO không nêu % cầu 2027, chỉ nói cầu tàu có thể thấp hơn 5 điểm % nếu các hãng về Suez hoàn toàn.',false);
  insight('chSdCont','2026 còn cân (cầu +5,1% so cung +4,6%), nhưng 2027 cung +9% là mức tăng mạnh nhất ba phân khúc; cộng thêm tàu quay về Suez làm tấn-dặm mất 5–10% → giá thuê tàu của HAH chịu sức ép từ 2027.');
}
if(ex.length&&document.getElementById('chTrade')){
 const imm=byMonth(im),rs=ex.slice(-36);
 barLineChart('chTrade',{categories:rs.map(r=>mon(r.date)),series:[{name:'XNK (tỷ USD)',color:C.navy,values:rs.map(r=>(r.value+(imm[ym(r.date)]?.value||0))/1000)}],unit:'tỷ USD',digits:1,height:260,rotateLabels:true});
 fillTable('tbl-trade',['Tháng','XNK (tỷ USD)','So cùng kỳ'],ex.slice().reverse().map(r=>{const t=r.value+(imm[ym(r.date)]?.value||0),p=ex.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7)),pt=p?p.value+(imm[ym(p.date)]?.value||0):null;return [mon(r.date),nf(t/1000,1),pt?signed((t/pt-1)*100,1)+'%':'—']}));
 sourceLine('chTrade',[['Hải quan Việt Nam','https://www.customs.gov.vn/'],SRC.wi],mon(ex.at(-1).date),'Xuất khẩu (83479) + nhập khẩu (92728). Cầu của hàng container nội Á mà HAH chở; giá trị USD, không phải TEU.');
 insight('chTrade','XNK tăng trên 25% lũy kế là nền cầu tốt cho tuyến nội Á của HAH. Cước container (SCFI, WCI) không có trong nguồn — xem dashboard Cảng & kho bãi, nơi đã có WCI theo tuần.');
}
// Định giá
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['185','Vận tải biển',C.navy],['309','Cảng',C.teal]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/E '+name,color,kind:'line',values:weekly.map(d=>at(id,d,1))})),unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Rổ mã','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],1),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[['VNDirect finfo','https://dstock.vndirect.com.vn/']],short(dates.at(-1)),'Rổ mã theo dõi: Vận tải biển (PVT, VTO, VIP, PVP, GSP, VOS, VNA, HAH); Cảng (GMD, PHP, SGP, VSC, CDN, DVP, PDN). P/E = tổng vốn hóa / tổng lợi nhuận (vốn hóa ÷ P/E từng mã, VNDirect); mã lỗ không có P/E chỉ vào P/B và vốn hóa. Không phải toàn ngành. Vẽ mỗi 5 phiên.');
 insight('chSectorVal',(()=>{const L=ids.filter(([id])=>sec[id]?.records?.length);const l0=sec[L[0][0]].records.at(-1);return 'P/E rổ mã theo dõi, phiên '+short(l0[0])+': '+L.map(([id,name])=>{const r=sec[id].records,l=r.at(-1),y=r.find(x=>x[0]>=String(+l[0].slice(0,4)-1)+l[0].slice(4));return name+' '+nf(l[1],(1==2?2:1))+'x'+(y&&y[1]!=null?' (1 năm trước '+nf(y[1],(1==2?2:1))+'x)':'')}).join('; ')+'.'})());
}
// Địa chính trị: PortWatch chokepoints (shared daily feed)
const hz=D.hormuz?.records||[],bm=D.bab_el_mandeb?.records||[];
function monthlyAvg(rs){const by={};rs.forEach(r=>{(by[r.date.slice(0,7)]=by[r.date.slice(0,7)]||[]).push(r.total)});return Object.entries(by).map(([m,v])=>({date:m+'-01',value:mean(v),n:v.length}))}
const hzM=monthlyAvg(hz),bmM=monthlyAvg(bm);
if(hzM.length&&document.getElementById('chChoke')){
 const rs=hzM.slice(-36),bmm=byMonth(bmM);
 barLineChart('chChoke',{categories:rs.map(r=>mon(r.date)),series:[{name:'Hormuz',color:C.red,kind:'line',values:rs.map(r=>r.value)},{name:'Bab el-Mandeb (Biển Đỏ)',color:C.navy,kind:'line',values:rs.map(r=>bmm[ym(r.date)]?.value??null)}],unit:'lượt/ngày',digits:0,height:260,zeroBase:true,rotateLabels:true});
 legend('chChoke',[['Hormuz',C.red],['Bab el-Mandeb',C.navy]]);
 fillTable('tbl-choke',['Tháng','Hormuz (lượt/ngày)','Bab el-Mandeb (lượt/ngày)','Số ngày'],hzM.slice().reverse().slice(0,36).map(r=>[mon(r.date),nf(r.value,0),nf(bmm[ym(r.date)]?.value,0),String(r.n)]));
 sourceLine('chChoke',[SRC.portwatch],short(hz.at(-1).date),'Số lượt tàu hàng qua eo biển mỗi ngày theo AIS (IMF PortWatch), bình quân tháng; tháng hiện tại chưa đủ ngày. Job GitHub kiểm mỗi lượt; dùng chung với dashboard Dầu khí.',false);
 const h0=hzM.at(-1),h23=mean(hz.filter(r=>r.date.startsWith('2023')).map(r=>r.total)),b23=mean(bm.filter(r=>r.date.startsWith('2023')).map(r=>r.total));
 insight('chChoke','Hormuz '+nf(h0.value,0)+' lượt/ngày so với ~'+nf(h23,0)+' của năm 2023: eo biển gần như đóng từ tháng 3/2026, dầu Trung Đông phải đi đường bộ ra Biển Đỏ hoặc không xuất được — đây là lý do BDTI lập đỉnh. Biển Đỏ '+nf(bmM.at(-1).value,0)+' lượt/ngày, bằng khoảng '+nf(bmM.at(-1).value/b23*100,0)+'% mức 2023: tàu container, tàu dầu vẫn đi vòng Mũi Hảo Vọng, giữ tấn-dặm cao cho cả ba phân khúc. Hai eo mở lại là rủi ro giảm cước lớn nhất.');
}
if(hz.length&&document.getElementById('chHormuzDaily')){
 const rs=hz.slice(-120);
 barLineChart('chHormuzDaily',{categories:rs.map(r=>r.date.slice(8,10)+'/'+r.date.slice(5,7)),series:[{name:'Tổng tàu hàng',color:C.red,values:rs.map(r=>r.total)},{name:'Tàu dầu',color:C.navy,kind:'line',values:rs.map(r=>r.tanker)}],unit:'lượt',digits:0,height:260,rotateLabels:true,maxLabels:12});
 legend('chHormuzDaily',[['Tổng tàu hàng',C.red],['Tàu dầu',C.navy]]);
 fillTable('tbl-hormuz-daily',['Ngày','Tổng','Tàu dầu'],hz.slice(-60).reverse().map(r=>[short(r.date),String(r.total),String(r.tanker)]));
 sourceLine('chHormuzDaily',[SRC.portwatch],short(hz.at(-1).date),'120 ngày gần nhất, số lượt theo ngày. AIS có thể thiếu tàu tắt tín hiệu.',false);
}


// ---------- Fearnleys (Wi bảng 362): TC 1 năm, giá tàu cũ, VLCC MEG ----------
const FE=B.fearnleys?.series||{},F=k=>FE[k]?.records||[];
const feBase=F('tc1y_vlcc');
function feLines(id,keys,unit,digits,hl){if(!feBase.length||!document.getElementById(id))return false;const maps=keys.map(([k])=>byMonth(F(k)));
 const series=keys.map(([k,n,c],i)=>({name:n,color:c,kind:'line',values:feBase.map(r=>maps[i][ym(r.date)]?.value??null)}));
 (hl||[]).forEach(([n,c,v])=>series.push({name:n,color:c,kind:'line',markers:false,strokeWidth:1.5,values:feBase.map(()=>v)}));
 barLineChart(id,{categories:feBase.map(r=>mon(r.date)),series,unit,digits,height:260,zeroBase:true,rotateLabels:true});legend(id,series.map(s=>[s.name,s.color]));return true}
const feL=k=>F(k).at(-1),feSrc=[['Fearnleys qua WiData (bảng 362)','https://widata.vn/']];
if(feLines('chTc1yTanker',[['tc1y_vlcc','VLCC',C.navy],['tc1y_suezmax','Suezmax',C.teal],['tc1y_aframax','Aframax',C.plum]],'nghìn USD/ngày',1,[['TC Aframax PVT ký (~55, ACBS 8/2026)',C.grey,55],['TC MR (~27, ACBS)',C.gold,27]])){
 fillTable('tbl-tc1y-tanker',['Tháng','VLCC','Suezmax','Aframax'],feBase.slice().reverse().map(r=>{const a=byMonth(F('tc1y_suezmax'))[ym(r.date)],b=byMonth(F('tc1y_aframax'))[ym(r.date)];return [mon(r.date),nf(r.value,1),nf(a?.value,1),nf(b?.value,1)]}));
 sourceLine('chTc1yTanker',[...feSrc,['ACBS PVT 8/2026','https://acbs.com.vn/acbsmedia/2026/08/PVT_Update-Q2-2026.pdf']],mon(feL('tc1y_vlcc').date),'Giá thuê định hạn 1 năm (Fearnleys, tuần; Wi nén về tháng). Đường ngang: mức TC quốc tế doanh nghiệp VN đang ký theo ACBS 8/2026 (Aframax ~55.000, MR ~27.000 USD/ngày).');
 insight('chTc1yTanker','TC 1 năm Aframax '+nf(feL('tc1y_aframax').value,0)+' nghìn USD/ngày, gấp '+nf(feL('tc1y_aframax').value/55,1)+' lần mức ~55 nghìn PVT đang nhận (ACBS): phần chênh chỉ về lợi nhuận khi hợp đồng đáo hạn và ký lại. Spot TD3C >1 triệu USD/ngày là mức cực đoan của tàu chịu vào Vịnh; TC 1 năm mới là giá thị trường trả cho rủi ro kéo dài 12 tháng.');
}
if(feLines('chTc1yBulk',[['tc1y_capesize','Capesize',C.navy],['tc1y_panamax','Panamax',C.teal],['tc1y_supramax','Supramax',C.plum],['tc1y_handysize','Handysize',C.gold]],'nghìn USD/ngày',1)){
 sourceLine('chTc1yBulk',feSrc,mon(feL('tc1y_supramax').date),'Giá thuê định hạn 1 năm tàu hàng rời (Fearnleys, tuần; Wi nén về tháng). VOS, VNA chạy Supramax/Handysize.');
 insight('chTc1yBulk','Supramax '+nf(feL('tc1y_supramax').value,1)+', Handysize '+nf(feL('tc1y_handysize').value,1)+' nghìn USD/ngày (1 năm trước '+nf(F('tc1y_supramax').at(-13)?.value,1)+' / '+nf(F('tc1y_handysize').at(-13)?.value,1)+'): cỡ tàu của VOS, VNA tăng ít hơn Capesize — BDI phóng đại mức lợi của hai mã.');
}
if(feLines('chShipPrice',[['sh5_vlcc','VLCC 5 tuổi',C.navy],['sh10_vlcc','VLCC 10 tuổi',C.teal],['sh5_aframax','Aframax 5 tuổi',C.plum],['sh10_mr','MR 10 tuổi',C.gold],['nb_vlcc','VLCC đóng mới',C.grey]],'triệu USD',0)){
 fillTable('tbl-ship-price',['Loại','Mới nhất','1 năm trước','Đầu 2024'],[['sh5_vlcc','VLCC 5 tuổi'],['sh10_vlcc','VLCC 10 tuổi'],['sh5_suezmax','Suezmax 5 tuổi'],['sh10_suezmax','Suezmax 10 tuổi'],['sh5_aframax','Aframax/LR2 5 tuổi'],['sh10_aframax','Aframax/LR2 10 tuổi'],['sh5_mr','MR 5 tuổi'],['sh10_mr','MR 10 tuổi'],['nb_vlcc','VLCC đóng mới'],['nb_product_tanker','Product tanker đóng mới']].map(([k,n])=>{const r=F(k);return [n,nf(r.at(-1)?.value,1),nf(r.at(-13)?.value,1),nf(r[0]?.value,1)]}));
 sourceLine('chShipPrice',feSrc,mon(feL('sh5_vlcc').date),'Giá tàu cũ 5/10 tuổi và đóng mới (Fearnleys, tuần; Wi nén về tháng).');
 insight('chShipPrice','VLCC 5 tuổi '+nf(feL('sh5_vlcc').value,0)+' triệu USD, cao hơn giá đóng mới '+nf(feL('nb_vlcc').value,0)+': tàu có sẵn đắt hơn tàu chờ 3 năm — thị trường trả tiền cho cước hiện tại. MR 10 tuổi '+nf(feL('sh10_mr').value,0)+' triệu: cửa sổ bán tàu cũ có lãi cho VOS, VNA; ngược lại PVT, VTO, VIP mua tàu lúc này sẽ khấu hao cao.');
}
if(feLines('chVlccMeg',[['vlcc_avail_meg','VLCC sẵn sàng Vịnh Ba Tư 30 ngày tới',C.navy],['vlcc_fixtures','VLCC chốt hợp đồng tuần trước',C.plum]],'tàu',0)){
 sourceLine('chVlccMeg',feSrc,mon(feL('vlcc_avail_meg').date),'Số tàu (Fearnleys, tuần; Wi nén về tháng). Tàu sẵn sàng thấp + chốt nhiều = cung chặt.');
}
// Đồng hồ lợi nhuận theo mã — bước 1: chỉ mã có TC đang ký trên trang gốc
if(document.getElementById('tbl-profit-gauge')){
 const af=feL('tc1y_aframax')?.value;
 const rows=[['PVP','Aframax Apollo (1 tàu)','TC tái ký 70.000 USD/ngày (5/2026)',70,af,'—'],['PVT','Aframax (đội tàu quốc tế)','TC Aframax ~55.000 (ACBS 8/2026)',55,af,'—'],['PVT · VTO · VIP','MR','TC MR ~27.000 (ACBS 8/2026)',27,null,'—'],['HAH','12/20 tàu cho thuê 1.700–2.500 TEU','HARPEX 23/10: 2.500 TEU 46.000; 1.700 TEU 35.000 (thị trường)',null,null,'—']];
 fillTable('tbl-profit-gauge',['Mã','Tàu','TC đang ký / thị trường (nguồn)','TC ký (nghìn USD/ngày)','TCE 1 năm cùng cỡ (Fearnleys, nghìn)','Chênh thị trường − đang ký','Tháng đáo hạn'],rows.map(([m,t,n,tc,mk,exp])=>[m,t,n,tc==null?'—':nf(tc,0),mk==null?'— (Fearnleys không có TC 1 năm MR)':nf(mk,0),tc!=null&&mk!=null?signed(mk-tc,0)+' ('+signed((mk/tc-1)*100,0)+'%)':'—',exp]));
}
// Cung tàu theo phân khúc (số đã có trong evidence: Clarksons H1/2026, BIMCO)
if(document.getElementById('chOrderbook')){
 ctBarS('chOrderbook',{categories:['Tanker','Hàng rời','Container'],series:[{name:'Orderbook % đội tàu (Clarksons giữa 2026)',color:C.navy,values:[25,14,40]},{name:'Cung đội tàu 2027 % (BIMCO)',color:C.red,values:[5.5,4,9]}],unit:'%',digits:1,aria:'Cung tàu theo phân khúc'});
 legend('chOrderbook',[['Orderbook % đội tàu',C.navy],['Tăng cung đội tàu 2027',C.red]]);
 sourceLine('chOrderbook',[['Clarksons H1/2026','https://hellenicshippingnews.com/first-half-2026-shipping-market-review-clarksea-index-up-61'],['BIMCO tanker 6/2026','https://www.hellenicshippingnews.com/?p=1136526'],['BIMCO dry bulk 7/2026','https://cyprusshippingnews.com/2026/07/31/bimco-dry-bulk-shipping-market-overview-outlook-2/'],['BIMCO container 9/2026','https://cyprusshippingnews.com/2026/09/28/bimcos-container-shipping-market-overview-outlook-september-2026-is-out/']],'9/2026','Orderbook theo CGT/đội tàu (Clarksons); cung 2027 = điểm giữa khoảng BIMCO (tanker dầu thô +5–6%, hàng rời +3,5–4,5%). Phá dỡ, lịch giao theo năm chưa có nguồn mở được.',false);
 insight('chOrderbook','Container có orderbook 40% và cung 2027 +9% — sóng cước ngắn nhất (▼ HAH 2027). Hàng rời 14% là phân khúc cung chặt nhất, giữ cước VOS, VNA lâu hơn.');
}
// FBX (data/raw/public/fbx.json do phần Cảng tạo) + HARPEX cho HAH
const FB=B.fbx||{},fbD=Object.keys(FB.days||{}).sort(),fbv=fbD.length?FB.days[fbD.at(-1)]:{};
if(fbD.length&&document.getElementById('chFbx')){
 const L=[['FBX01','→ Bờ Tây Bắc Mỹ'],['FBX03','→ Bờ Đông Bắc Mỹ'],['FBX11','→ Bắc Âu'],['FBX13','→ Địa Trung Hải'],['FBX','FBX tổng hợp']].filter(([k])=>fbv[k]);
 hbarCompare('chFbx',{items:L.map(([k,l])=>({label:l,value:fbv[k],color:k==='FBX'?C.navy:C.teal})),unit:'USD/FEU',digits:0,labelW:150,ariaLabel:'FBX theo tuyến'});
 sourceLine('chFbx',[['Freightos Baltic Index',FB.url],['HARPEX','https://www.harperpetersen.com/harpex']],short(fbD.at(-1)),'Cước giao ngay container 40 feet (Freightos FBX, ngày đọc). HARPEX (giá thuê tàu) 23/10/2026 2.525 điểm — ở bảng Key players. HAH chạy nội Á, không có trong FBX: đọc gián tiếp.',false);
 insight('chFbx','FBX tổng hợp '+nf(fbv.FBX,0)+' USD/FEU; HAH ăn chủ yếu giá thuê tàu (HARPEX, 12/20 tàu cho thuê) hơn là cước tuyến dài. Cước tuyến dài giảm thường dẫn giá thuê tàu giảm 1–2 quý sau.');
}
function ctBarS(id,model){const host=document.getElementById(id);if(!host)return;if(window.ChartTypes)return ChartTypes.mount(host,{...model,native:'bar'},()=>{host.innerHTML=ChartTypes.render(model,'bar')});barLineChart(id,{...model,height:260})}

// ---------- 4. KPIs, quick read, catalyst brief ----------
const tL=bdti.at(-1),cL=bcti.at(-1),dL=bdi.at(-1),bL=brent.at(-1),sL=sea.at(-1),pe=sec['185']?.records||[],peL=pe.at(-1),pe0=pe[0];
kpi('spk-bdti',tL?nf(tL.value,0):'—',tL?'điểm · '+short(tL.date):'—',tL?signed(yoyAt(bdti,tL),0)+'% so cùng kỳ':'',bdti.slice(-12).map(r=>r.value));
kpi('spk-bcti',cL?nf(cL.value,0):'—',cL?'điểm · '+short(cL.date):'—',cL?signed(yoyAt(bcti,cL),0)+'% so cùng kỳ':'',bcti.slice(-12).map(r=>r.value),C.teal);
kpi('spk-bdi',dL?nf(dL.value,0):'—',dL?'điểm · '+short(dL.date):'—',dL?signed(yoyAt(bdi,dL),0)+'% so cùng kỳ':'',bdi.slice(-12).map(r=>r.value),C.gold);
kpi('spk-hormuz',hzM.length?nf(hzM.at(-1).value,0):'—',hz.length?'lượt/ngày · '+short(hz.at(-1).date):'—',hzM.length?'2023: ~'+nf(mean(hz.filter(r=>r.date.startsWith('2023')).map(r=>r.total)),0)+' lượt/ngày':'',hzM.slice(-12).map(r=>r.value),C.red);
kpi('spk-brent',bL?nf(bL.value,1):'—',bL?'USD/thùng · '+short(bL.date):'—',bL?signed(yoyAt(brent,bL),0)+'% so cùng kỳ':'',brent.slice(-12).map(r=>r.value),C.gold);
kpi('spk-pe',peL?nf(peL[1],1)+'x':'—',peL?'P/E vận tải đường thủy · '+short(peL[0]):'—',peL?'P/B '+nf(peL[2],2)+'x':'',pe.slice(-30).map(r=>r[1]),C.grey);
const quick=document.querySelector('.hero .insight');
if(quick&&tL){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu công khai, PortWatch: '),`BDTI ${nf(tL.value,0)} điểm (${signed(yoyAt(bdti,tL),0)}% YoY), BCTI ${nf(cL?.value,0)}, BDI ${nf(dL?.value,0)} (${signed(yoyAt(bdi,dL),0)}%). Hormuz ${hzM.length?nf(hzM.at(-1).value,0):'—'} lượt/ngày. TC 1 năm Aframax ${nf(feL('tc1y_aframax')?.value,0)} nghìn USD/ngày (Fearnleys). Brent ${nf(bL?.value,0)} USD/thùng. Vận chuyển đường biển của đội tàu VN lũy kế ${signed(ytdYo(sea),0)}%. P/E vận tải đường thủy ${peL?nf(peL[1],1):'—'}x.`);
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
const tY=yoyAt(bdti,tL),cY=yoyAt(bcti,cL),dY=yoyAt(bdi,dL),bY=yoyAt(brent,bL),hzNow=hzM.length?hzM.at(-1).value:null,hzBase=mean(hz.filter(r=>r.date.startsWith('2023')).map(r=>r.total)),seaY=ytdYo(sea),ppL=ps.at(-1);
const row=(group,name,big,evidence,cond,st,who,chart)=>({group,name,big,chart,st,mid:[evidence,cond],end:[who]});
const score=[
 row('Cước','Cước tàu dầu thô lập đỉnh',[tL?nf(tL.value,0):'—','BDTI ('+signed(tY,0)+'% YoY)'],'Cao nhất chuỗi từ 2023; đáy 12 tháng '+nf(Math.min(...bdti.slice(-12).map(r=>r.value)),0),'BDTI về dưới 3.000 (Hormuz mở lại)',tY==null?'na':tY>50?'good':tY<-20?'risk':'watch','▲ PVT · PVP · VTO · VIP','chTanker'),
 row('Cước','Cước tàu dầu sản phẩm',[cL?nf(cL.value,0):'—','BCTI ('+signed(cY,0)+'% YoY)'],'Đi cùng BDTI; tàu MR/LR của PVT, VTO chở xăng dầu','BCTI về dưới 1.000',cY==null?'na':cY>50?'good':cY<-20?'risk':'watch','▲ PVT · VTO · VIP','chTanker'),
 row('Cước','Cước hàng rời cao',[dL?nf(dL.value,0):'—','BDI ('+signed(dY,0)+'% YoY)'],'Vùng 2.900–3.200 từ T5/2026; đáy đầu 2025 735','BDI về dưới 1.500',dY==null?'na':dY>20?'good':dY<-20?'risk':'watch','▲ VOS · VNA','chBdi'),
 row('Tuyến','Hormuz gần như đóng',[hzNow!=null?nf(hzNow,0):'—','lượt/ngày (2023: ~'+nf(hzBase,0)+')'],'Từ T3/2026; dầu Trung Đông đi vòng → tấn-dặm tanker tăng','Hormuz > 50 lượt/ngày 2 tuần liền',hzNow==null?'na':hzNow<20?'good':hzNow<60?'watch':'info','▲ tanker · ▼ nếu mở lại đột ngột','chChoke'),
 row('Tuyến','Biển Đỏ chưa hồi',[bmM.length?nf(bmM.at(-1).value,0):'—','lượt/ngày Bab el-Mandeb'],'Bằng ~'+(bmM.length?nf(bmM.at(-1).value/mean(bm.filter(r=>r.date.startsWith('2023')).map(r=>r.total))*100,0):'—')+'% mức 2023; tàu đi vòng Mũi Hảo Vọng','Lượt qua Biển Đỏ > 50/ngày (hãng tàu quay lại Suez)',bmM.length?(bmM.at(-1).value<45?'good':'watch'):'na','▲ HAH (cung tàu bị hút) · tanker','chChoke'),
 row('Chi phí','Nhiên liệu đắt',[signed(bY,0)+'%','Brent YoY'],'Brent '+nf(bL?.value,0)+' USD/thùng; dầu nhiên liệu SHFE '+(fo.length?nf(foUsd(fo.at(-1)),0):'—')+' USD/tấn','Brent về dưới 80 USD/thùng',bY==null?'na':bY>30?'risk':bY<-10?'good':'watch','▼ VOS · VNA (chạy chuyến) · ít ảnh hưởng TC','chFuel'),
 row('Việt Nam','Đội tàu VN chạy nhiều hơn',[signed(seaY,0)+'%','vận chuyển đường biển lũy kế'],'Giá dịch vụ vận tải biển trong nước '+(ppL?qtr(ppL.date)+' '+signed(ppL.value,0)+'% YoY':'—'),'Lũy kế về dưới +3%',seaY==null?'na':seaY>5?'good':seaY<0?'risk':'watch','▲ cả ngành','chSea'),
 row('Cước','TC 1 năm Aframax vượt mức PVT ký',[nf(feL('tc1y_aframax')?.value,0),'nghìn USD/ngày (ký ~55)'],'Fearnleys '+(feL('tc1y_aframax')?mon(feL('tc1y_aframax').date):'—')+'; phần chênh về khi TC đáo hạn','TC 1 năm Aframax về dưới 55',feL('tc1y_aframax')?(feL('tc1y_aframax').value>55?'good':'risk'):'na','▲ PVT · PVP (khi tái ký)','chTc1yTanker'),
 row('Định giá','Thị trường chưa trả cho cước đột biến',[peL?nf(peL[1],1)+'x':'—','P/E vận tải đường thủy'],'P/E '+(peL?nf(peL[1],1)+'x':'—')+(pe0?' (đầu kỳ '+nf(pe0[1],1)+'x, '+short(pe0[0])+')':''),'Hợp đồng TC ký lại ở mức cước mới (BCTC quý IV)',peL?'info':'na','PVT · VOS · HAH','chSectorVal')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.SHIPPING_BRIEF={
 headline:'Hormuz đóng và Biển Đỏ chưa hồi đẩy cước tanker lên đỉnh, hàng rời cao; nhiên liệu đắt là chi phí; định giá chưa phản ánh · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Tàu dầu & khí','PVT · VTO · VIP · PVP · GSP',tY!=null&&tY>50?'up':'flat','BDTI '+signed(tY,0)+'%'],['Hàng rời','VOS · VNA',dY!=null&&dY>20?'up':'flat','BDI '+signed(dY,0)+'%'],['Container','HAH','flat','Biển Đỏ '+(bmM.length?nf(bmM.at(-1).value,0):'—')+' lượt/ngày']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Hằng ngày','Baltic: BDTI, BCTI, BDI · PortWatch: Hormuz, Biển Đỏ'],['Đầu tháng','NSO: vận chuyển tháng trước'],['20–30/10','BCTC quý III'],['09/01/2027','USTR đề xuất hoãn tiếp phí cảng Mỹ với tàu TQ tới mốc này (Federal Register 26/10/2026, chưa chốt)'],['Theo sự kiện','Đàm phán Trung Đông; hãng tàu công bố quay lại Suez']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ nguồn công khai lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; giá hàng hóa: IMF/FRED, EIA, ICE.';
})();
