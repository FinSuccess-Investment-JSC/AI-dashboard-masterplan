/* Shipping dashboard: value chain, Tàu dầu & khí / Hàng rời / Container panes, charts from window.SHIPPING_WI
   (scripts/build_shipping_wi.py from WiMCP captures) and the shared PortWatch chokepoint feeds in window.SECTOR_DAILY
   (hormuz, bab_el_mandeb). Document figures sit in the HTML tables and are backed by data/shipping/evidence.json.
   Publishes window.SHIPPING_BRIEF for catalyst-board.js. Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='shipping')return;
const W=window.SHIPPING_WI||{blocks:{}},B=W.blocks||{},D=window.SECTOR_DAILY?.sources||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const qtr=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],baltic:['Baltic Exchange','https://www.balticexchange.com/'],portwatch:['IMF PortWatch','https://portwatch.imf.org/'],wi:['MCP Wi (Widata)',null]};
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
 n.append(` · Kỳ cuối: ${period}`+(wi?` · Wi kiểm: ${checked?short(checked.slice(0,4)+'-'+checked.slice(4,6)+'-'+checked.slice(6,8)):'—'}`:''));host.after(n);
 if(method)n.after(make('div','source-note method-note',method));
 if(block&&wi){block.dataset.refreshStatus='loaded';block.dataset.sourceIds='wi'}
}
function insight(id,text){const block=document.getElementById(id)?.closest('.card');if(!block)return;const n=make('div','chart-insight');n.dataset.inputOwner='ai';n.innerHTML='<b>Cách hiểu trong bối cảnh ngành · AI:</b> ';n.append(text);block.append(n)}
function legend(id,items){const host=document.getElementById(id);if(!host)return;const l=make('div','legend');items.forEach(([n,c])=>{const s=make('span','li'),d=make('span','dot');d.style.background=c;s.append(d,n);l.append(s)});host.after(l)}
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;card.querySelector('.value').textContent=value;card.querySelector('.sub').textContent=sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();if(series?.length)sparkline(spark,series,color)}
function lines(id,base,series,unit,digits,zeroBase=false){barLineChart(id,{categories:base.map(r=>mon(r.date)),series:series.map(([n,c,f])=>({name:n,color:c,kind:'line',values:base.map(f)})),unit,digits,height:260,zeroBase,rotateLabels:true})}

const bdti=S('bdti'),bcti=S('bcti'),bdi=S('bdi'),brent=S('brent'),fo=S('fuel_oil_cn');
// Tàu dầu
if(bdti.length&&document.getElementById('chTanker')){
 const cm=byMonth(bcti);
 lines('chTanker',bdti,[['BDTI (dầu thô)',C.navy,r=>r.value],['BCTI (dầu sản phẩm)',C.teal,r=>cm[ym(r.date)]?.value??null]],'điểm',0,true);
 legend('chTanker',[['BDTI · dầu thô',C.navy],['BCTI · dầu sản phẩm',C.teal]]);
 fillTable('tbl-tanker',['Kỳ','BDTI','BDTI YoY','BCTI','BCTI YoY'],bdti.slice().reverse().map(r=>{const c=cm[ym(r.date)];return [short(r.date),nf(r.value,0),signed(yoyAt(bdti,r),0)+'%',nf(c?.value,0),signed(yoyAt(bcti,c),0)+'%']}));
 sourceLine('chTanker',[SRC.baltic,SRC.wi],short(bdti.at(-1).date),'Baltic Dirty Tanker Index (73983) và Clean Tanker Index (73984), Wi nén chuỗi ngày về cuối tháng. Chỉ số cước thế giới, không phải cước PVT, VTO ký được.');
 insight('chTanker','BDTI '+nf(bdti.at(-1).value,0)+' điểm là mức cao nhất của chuỗi, gấp hơn 5 lần một năm trước; BCTI cũng gấp gần 4 lần. Nguyên nhân là Hormuz gần như đóng từ tháng 3/2026 (xem tab Địa chính trị): dầu Trung Đông phải đi vòng, tấn-dặm tăng trong khi cung tàu không đổi. Doanh nghiệp Việt Nam hưởng lợi ở phần tàu chạy spot và khi hợp đồng TC đáo hạn được ký lại; phần đang khóa giá chưa thấy ngay.');
}
if(brent.length&&document.getElementById('chFuel')){
 const fm=byMonth(fo);
 lines('chFuel',brent,[['Brent (USD/thùng)',C.gold,r=>r.value],['Dầu nhiên liệu TQ (CNY/tấn ÷100)',C.plum,r=>fm[ym(r.date)]?fm[ym(r.date)].value/100:null]],'',1,true);
 legend('chFuel',[['Brent USD/thùng',C.gold],['Dầu nhiên liệu CNY/tấn ÷100',C.plum]]);
 fillTable('tbl-fuel',['Kỳ','Brent (USD/thùng)','Brent YoY','Dầu nhiên liệu (CNY/tấn)','YoY'],brent.slice().reverse().map(r=>{const f=fm[ym(r.date)];return [short(r.date),nf(r.value,2),signed(yoyAt(brent,r),0)+'%',nf(f?.value,0),signed(yoyAt(fo,f),0)+'%']}));
 sourceLine('chFuel',[['ICE · sàn Trung Quốc qua Wi',null]],short(brent.at(-1).date),'Brent (203085) và dầu nhiên liệu spot Trung Quốc (203125, chia 100 để cùng trục). Wi không có VLSFO Singapore; dầu nhiên liệu Trung Quốc là proxy xu hướng.');
 insight('chFuel','Nhiên liệu là chi phí biến đổi lớn nhất của chuyến đi. Brent +'+nf(yoyAt(brent,brent.at(-1)),0)+'% YoY đẩy chi phí lên, nhưng với tàu cho thuê định hạn thì người thuê trả nhiên liệu, nên PVT, GSP ít bị ảnh hưởng hơn VOS, VNA chạy chuyến.');
}
// Hàng rời
if(bdi.length&&document.getElementById('chBdi')){
 lines('chBdi',bdi,[['BDI',C.gold,r=>r.value]],'điểm',0,true);
 fillTable('tbl-bdi',['Kỳ','Điểm','So cùng kỳ'],bdi.slice().reverse().map(r=>[short(r.date),nf(r.value,0),signed(yoyAt(bdi,r),0)+'%']));
 sourceLine('chBdi',[SRC.baltic,SRC.wi],short(bdi.at(-1).date),'Baltic Dry Index (73982), Wi nén về cuối tháng. VOS, VNA chạy tàu Supramax/Handysize; BDI gồm cả Capesize nên biên độ lớn hơn cước thực của hai mã.');
 insight('chBdi','BDI quanh 2.900–3.200 điểm từ tháng 5/2026, cao hơn cùng kỳ gần 50% và gấp 4 lần đáy đầu 2025: cầu than, quặng, ngũ cốc tốt trong khi orderbook hàng rời thấp. Đây là cửa sổ để VOS, VNA bán tàu cũ giá cao hoặc ký TC dài.');
}
const sea=S('sea_freight'),ov=S('overseas_freight');
if(sea.length&&document.getElementById('chSea')){
 const om=byMonth(ov),rs=sea.slice(-36);
 barLineChart('chSea',{categories:rs.map(r=>mon(r.date)),series:[{name:'Đường biển',color:C.navy,values:rs.map(r=>r.value/1000)},{name:'Ngoài nước (mọi phương thức)',color:C.plum,kind:'line',values:rs.map(r=>om[ym(r.date)]?om[ym(r.date)].value/1000:null)}],unit:'triệu tấn',digits:1,height:260,rotateLabels:true});
 legend('chSea',[['Đường biển',C.navy],['Ngoài nước',C.plum]]);
 fillTable('tbl-sea',['Tháng','Đường biển (triệu tấn)','YoY','Ngoài nước (triệu tấn)','YoY'],sea.slice().reverse().map(r=>{const o=om[ym(r.date)];return [mon(r.date),nf(r.value/1000,2),signed(yoyAt(sea,r),1)+'%',nf((o?.value??NaN)/1000,2),signed(yoyAt(ov,o),1)+'%']}));
 sourceLine('chSea',[SRC.nso,SRC.wi],mon(sea.at(-1).date),'Khối lượng hàng do doanh nghiệp vận tải Việt Nam chở bằng đường biển (82585) và vận chuyển ngoài nước (82583). Đo việc làm của đội tàu Việt Nam, không phải hàng qua cảng.');
 insight('chSea','Lũy kế 9T/2026 đường biển '+signed(ytdYo(sea),0)+'%, chuyến ngoài nước '+signed(ytdYo(ov),0)+'%: đội tàu Việt Nam đang chạy nhiều hơn, khớp với cước cao. Luân chuyển (tấn-km) lũy kế '+signed(yoyAt(S('sea_tonkm_ytd'),S('sea_tonkm_ytd').at(-1)),0)+'% — quãng đường dài hơn là dấu hiệu tuyến đi vòng.');
}
const ps=S('ppi_sea'),pw=S('ppi_water');
if(ps.length&&document.getElementById('chPpi')){
 const wm=byMonth(pw),rs=ps.slice(-16);
 barLineChart('chPpi',{categories:rs.map(r=>qtr(r.date)),series:[{name:'Ven biển & viễn dương',color:C.navy,kind:'line',values:rs.map(r=>r.value)},{name:'Đường thủy (chung)',color:C.teal,kind:'line',values:rs.map(r=>wm[ym(r.date)]?.value??null)}],unit:'%',digits:1,height:260,zeroBase:false,rotateLabels:false});
 legend('chPpi',[['Ven biển & viễn dương',C.navy],['Đường thủy chung',C.teal]]);
 fillTable('tbl-ppi',['Quý','Ven biển & viễn dương','Đường thủy chung'],ps.slice().reverse().map(r=>[qtr(r.date),nf(r.value,2),nf(wm[ym(r.date)]?.value,2)]));
 sourceLine('chPpi',[SRC.nso,SRC.wi],qtr(ps.at(-1).date),'Chỉ số giá sản xuất dịch vụ vận tải ven biển và viễn dương (75662), đường thủy (75661), % so cùng kỳ.');
 insight('chPpi','Giá dịch vụ vận tải biển trong nước tăng ~12% YoY hai quý liền, cao nhất từ 2022: cước thế giới đã truyền vào giá doanh nghiệp Việt Nam ký được, không chỉ ở chỉ số Baltic.');
}
// Container (số Wi của toàn ngành đã ở trên; chart riêng dùng XNK làm cầu)
const ex=S('exports'),im=S('imports');
if(ex.length&&document.getElementById('chTrade')){
 const imm=byMonth(im),rs=ex.slice(-36);
 barLineChart('chTrade',{categories:rs.map(r=>mon(r.date)),series:[{name:'XNK (tỷ USD)',color:C.navy,values:rs.map(r=>(r.value+(imm[ym(r.date)]?.value||0))/1000)}],unit:'tỷ USD',digits:1,height:260,rotateLabels:true});
 fillTable('tbl-trade',['Tháng','XNK (tỷ USD)','So cùng kỳ'],ex.slice().reverse().map(r=>{const t=r.value+(imm[ym(r.date)]?.value||0),p=ex.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7)),pt=p?p.value+(imm[ym(p.date)]?.value||0):null;return [mon(r.date),nf(t/1000,1),pt?signed((t/pt-1)*100,1)+'%':'—']}));
 sourceLine('chTrade',[['Hải quan Việt Nam','https://www.customs.gov.vn/'],SRC.wi],mon(ex.at(-1).date),'Xuất khẩu (83479) + nhập khẩu (92728). Cầu của hàng container nội Á mà HAH chở; giá trị USD, không phải TEU.');
 insight('chTrade','XNK tăng trên 25% lũy kế là nền cầu tốt cho tuyến nội Á của HAH. Cước container (SCFI, WCI) không có trên Wi — xem dashboard Cảng & kho bãi, nơi đã có WCI theo tuần.');
}
// Định giá
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['185','Vận tải hàng hóa đường thủy',C.navy],['309','Cảng & dịch vụ hàng hải',C.teal]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/E '+name,color,kind:'line',values:weekly.map(d=>at(id,d,1))})),unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Phân ngành (GICS Wi)','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],1),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[SRC.wi],short(dates.at(-1)),'Wi sector_ratio_daily: vận tải hàng hóa đường thủy (185, gồm PVT, VOS, HAH…), cảng & dịch vụ hàng hải (309). Vẽ mỗi 5 phiên.');
 insight('chSectorVal','P/E vận tải đường thủy ~11 lần, gần như không đổi so với đầu 2025 dù BDTI tăng 5 lần: thị trường coi cước tanker hiện tại là bất thường (do Hormuz) và chưa trả thêm cho lợi nhuận đột biến. Nếu cước giữ cao qua 2027, lợi nhuận TC ký lại sẽ kéo P/E xuống thấp hơn nữa.');
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
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu Wi, PortWatch: '),`BDTI ${nf(tL.value,0)} điểm (${signed(yoyAt(bdti,tL),0)}% YoY), BCTI ${nf(cL?.value,0)}, BDI ${nf(dL?.value,0)} (${signed(yoyAt(bdi,dL),0)}%). Hormuz ${hzM.length?nf(hzM.at(-1).value,0):'—'} lượt/ngày. Brent ${nf(bL?.value,0)} USD/thùng. Vận chuyển đường biển của đội tàu VN lũy kế ${signed(ytdYo(sea),0)}%. P/E vận tải đường thủy ${peL?nf(peL[1],1):'—'}x.`);
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
 row('Chi phí','Nhiên liệu đắt',[signed(bY,0)+'%','Brent YoY'],'Brent '+nf(bL?.value,0)+' USD/thùng; dầu nhiên liệu TQ '+signed(yoyAt(fo,fo.at(-1)),0)+'%','Brent về dưới 80 USD/thùng',bY==null?'na':bY>30?'risk':bY<-10?'good':'watch','▼ VOS · VNA (chạy chuyến) · ít ảnh hưởng TC','chFuel'),
 row('Việt Nam','Đội tàu VN chạy nhiều hơn',[signed(seaY,0)+'%','vận chuyển đường biển lũy kế'],'Giá dịch vụ vận tải biển trong nước '+(ppL?qtr(ppL.date)+' '+signed(ppL.value,0)+'% YoY':'—'),'Lũy kế về dưới +3%',seaY==null?'na':seaY>5?'good':seaY<0?'risk':'watch','▲ cả ngành','chSea'),
 row('Định giá','Thị trường chưa trả cho cước đột biến',[peL?nf(peL[1],1)+'x':'—','P/E vận tải đường thủy'],'P/E '+(peL?nf(peL[1],1)+'x':'—')+(pe0?' (đầu kỳ '+nf(pe0[1],1)+'x, '+short(pe0[0])+')':''),'Hợp đồng TC ký lại ở mức cước mới (BCTC quý IV)',peL?'info':'na','PVT · VOS · HAH','chSectorVal')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.SHIPPING_BRIEF={
 headline:'Hormuz đóng và Biển Đỏ chưa hồi đẩy cước tanker lên đỉnh, hàng rời cao; nhiên liệu đắt là chi phí; định giá chưa phản ánh · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Tàu dầu & khí','PVT · VTO · VIP · PVP · GSP',tY!=null&&tY>50?'up':'flat','BDTI '+signed(tY,0)+'%'],['Hàng rời','VOS · VNA',dY!=null&&dY>20?'up':'flat','BDI '+signed(dY,0)+'%'],['Container','HAH','flat','Biển Đỏ '+(bmM.length?nf(bmM.at(-1).value,0):'—')+' lượt/ngày']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Hằng ngày','Baltic: BDTI, BCTI, BDI · PortWatch: Hormuz, Biển Đỏ'],['Đầu tháng','NSO: vận chuyển tháng trước'],['20–30/10','BCTC quý III'],['Theo sự kiện','Đàm phán Trung Đông; hãng tàu công bố quay lại Suez']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ WiMCP lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; các lời gọi ghi trong data/shipping-wi-contract.json.';
})();
