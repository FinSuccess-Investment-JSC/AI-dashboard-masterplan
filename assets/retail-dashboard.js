/* Retail & consumer dashboard (Bán lẻ & tiêu dùng): value chain, Bán lẻ hiện đại / Hàng lâu bền / Hàng tiêu dùng nhanh panes
   and sector valuation from window.RETAIL_PUBLIC (scripts/build_sector_public.py: public commodity series only): retail sales, CPI, tourists, output, inputs).
   Document figures sit in the HTML tables and are backed by data/retail/evidence.json.
   Publishes window.RETAIL_BRIEF for catalyst-board.js. Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='retail')return;
const W=window.RETAIL_PUBLIC||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const qtr=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],sbv:['Ngân hàng Nhà nước','https://www.sbv.gov.vn/'],customs:['Hải quan Việt Nam','https://www.customs.gov.vn/'],ice:['ICE, CBOT, Bursa Malaysia',null],wi:['Nguồn công khai',null]};
for(const v of Object.values(macro)){if(/nso\.gov\.vn\/wp-content/.test(v.url||'')&&SRC.nso)SRC.nso=[SRC.nso[0],v.url];if(/customs/.test(v.url||'')&&SRC.customs)SRC.customs=[SRC.customs[0],v.url]}
const S=k=>macro[k]?.records||com[k]?.records||[];
const ym=d=>d.slice(0,7);
const byMonth=rs=>{const m={};rs.forEach(r=>{m[ym(r.date)]=r});return m};
const yoyAt=(rs,r)=>{if(!r)return null;const p=rs.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};
const ytdSum=(rs,y,m)=>rs.filter(r=>r.date.slice(0,4)===y&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0);
const ytdYo=rs=>{const l=rs.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),p=ytdSum(rs,String(y-1),m);return p?(ytdSum(rs,y,m)/p-1)*100:null};
const idx=(rs,base)=>{const b=rs.find(r=>r.date.slice(0,7)>=base);return b&&b.value?rs.map(r=>({date:r.date,value:r.value/b.value*100})):[]};

// ---------- 1. Value chain ----------
const chain=document.querySelector('[data-block-id="bl-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='11/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['income',25,40,['Thu nhập & tín dụng','lương · tiền gửi · vay tiêu dùng']],['tourist',25,165,['Khách quốc tế','17,7 triệu lượt 9T/2026']],['input',25,290,['Nguyên liệu F&B','sữa bột · lúa mạch · đường · dầu cọ']],
  ['modern',315,40,['Bán lẻ hiện đại','MWG · FRT · DGW · PET']],['durable',315,165,['Hàng lâu bền','PNJ · HAX · SVC']],['fmcg',315,290,['Tiêu dùng nhanh','VNM · SAB · QNS · MSN · KDC']],
  ['store',605,40,['Cửa hàng & online','chuỗi · TMĐT · bancassurance xe']],['price',605,165,['Giá bán & CPI','VAT 2% · TTĐB bia, NGK']],['channel',605,290,['Kênh phân phối','siêu thị · tạp hóa · TMĐT']],
  ['margin',895,165,['Biên lợi nhuận','giá bán − giá vốn − thuê mặt bằng']]
 ];
 const edges=[['income','modern'],['income','durable'],['tourist','fmcg',true],['input','fmcg',true],['modern','store'],['durable','price'],['fmcg','channel'],['store','margin'],['price','margin'],['channel','margin']];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b];let d;
  if(A[2]===Bn[2]){const fw=Bn[1]>A[1];d=`M${A[1]+(fw?w:0)} ${A[2]+h/2} H${Bn[1]+(fw?0:w)}`}
  else if(A[1]===Bn[1]){d=`M${A[1]+w/2} ${A[2]+(Bn[2]>A[2]?h:0)} V${Bn[2]+(Bn[2]>A[2]?0:h)}`}
  else{const fw=Bn[1]>A[1],x1=A[1]+(fw?w:0),y1=A[2]+h/2,x2=Bn[1]+(fw?0:w),y2=Bn[2]+h/2,mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`}
  return `<path d="${d}" class="chain-edge${dashed?' dashed':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t.replace(/&/g,'&amp;')}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1140 375" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành bán lẻ và tiêu dùng</title><desc id="chain-desc">Thu nhập, tín dụng và khách quốc tế tạo sức mua; bán lẻ hiện đại, hàng lâu bền và tiêu dùng nhanh bán qua cửa hàng, online; biên phụ thuộc giá bán, giá vốn và thuế.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: bán lẻ hiện đại (MWG, FRT) ăn theo sức mua và tốc độ mở cửa hàng — doanh thu đi sát tổng mức bán lẻ, lợi nhuận đi theo biên gộp và chi phí mặt bằng. Hàng lâu bền (xe, trang sức) nhạy với lãi suất và giá vàng. Tiêu dùng nhanh (sữa, bia, đường, thực phẩm) phụ thuộc giá nguyên liệu nhập và thuế TTĐB; VNM, SAB, QNS cũng có mặt ở dashboard Nông nghiệp theo chiều giá đầu vào.'));
 figure.after(make('div','source-note','Mũi tên liền: dòng cầu và doanh thu · Mũi tên đứt: yếu tố chi phí, hỗ trợ. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Panes ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead');
 const children=[...section.children].filter(e=>e!==head),modP=make('div','supply-pane'),durP=make('div','supply-pane'),fmP=make('div','supply-pane');
 modP.id='supply-world';durP.id='supply-vietnam';fmP.id='supply-trade';
 let cur=modP;children.forEach(e=>{if(e.matches('h3.subhead')){const t=e.textContent.trim();cur=t.startsWith('Hàng lâu bền')?durP:t.startsWith('Hàng tiêu dùng')?fmP:modP;e.remove();return}cur.append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Nhóm');
 const panes=[modP,durP,fmP],labels=['Bán lẻ hiện đại & điện máy','Hàng lâu bền: trang sức, ô tô','Hàng tiêu dùng nhanh'];
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
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;card.querySelector('.value').textContent=value;card.querySelector('.sub').textContent=sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();const sv=(series||[]).filter(Number.isFinite);if(sv.length>1)sparkline(spark,sv,color)}
function lines(id,base,series,unit,digits,zeroBase=false){barLineChart(id,{categories:base.map(r=>mon(r.date)),series:series.map(([n,c,f])=>({name:n,color:c,kind:'line',values:base.map(f)})),unit,digits,height:260,zeroBase,rotateLabels:true})}
const BASE='2024-01';
const rt=S('retail_total'),rg=S('retail_goods'),cpi=S('cpi_yoy'),tour=S('tourists'),dep=S('household_deposits'),cred=S('credit_total');
// Bán lẻ hiện đại: sức mua
if(rt.length&&document.getElementById('chRetail')){
 const rs=rt.slice(-36),gm=byMonth(rg);
 barLineChart('chRetail',{categories:rs.map(r=>mon(r.date)),series:[{name:'Tổng mức bán lẻ HH & DV',color:C.navy,values:rs.map(r=>r.value/1000)},{name:'Bán lẻ hàng hóa',color:C.teal,kind:'line',values:rs.map(r=>(gm[ym(r.date)]?.value??NaN)/1000)}],unit:'nghìn tỷ',digits:0,height:260,rotateLabels:true});
 legend('chRetail',[['Tổng mức bán lẻ HH & DV',C.navy],['Bán lẻ hàng hóa',C.teal]]);
 fillTable('tbl-retail',['Tháng','Tổng (nghìn tỷ)','YoY','Hàng hóa (nghìn tỷ)','YoY'],rt.slice().reverse().map(r=>{const g=gm[ym(r.date)];return [mon(r.date),nf(r.value/1000,1),signed(yoyAt(rt,r),1)+'%',nf((g?.value??NaN)/1000,1),signed(yoyAt(rg,g),1)+'%']}));
 sourceLine('chRetail',[SRC.nso],mon(rt.at(-1).date),'Tổng mức bán lẻ hàng hóa và doanh thu dịch vụ tiêu dùng, trong đó bán lẻ hàng hóa; giá hiện hành, chưa loại trừ giá.');
 insight('chRetail','Tổng mức bán lẻ lũy kế '+signed(ytdYo(rt),0)+'% danh nghĩa; NSO công bố loại trừ giá 9T/2026 +7,8%. Phần tăng thực ~8% là nền doanh thu của MWG, FRT, PNJ; phần còn lại là giá (CPI ~5%). Tháng gần nhất '+signed(yoyAt(rt,rt.at(-1)),0)+'% — tốc độ danh nghĩa cao nhất từ 2022.');
}
if(cpi.length&&document.getElementById('chCpi')){
 const rs=cpi.slice(-36),fm=byMonth(S('cpi_food_yoy')),bm=byMonth(S('cpi_bev_yoy'));
 barLineChart('chCpi',{categories:rs.map(r=>mon(r.date)),series:[{name:'CPI chung',color:C.navy,kind:'line',values:rs.map(r=>r.value)},{name:'Hàng ăn & dịch vụ ăn uống',color:C.gold,kind:'line',values:rs.map(r=>fm[ym(r.date)]?.value??null)},{name:'Đồ uống & thuốc lá',color:C.plum,kind:'line',values:rs.map(r=>bm[ym(r.date)]?.value??null)}],unit:'%',digits:1,height:260,rotateLabels:true,zeroBase:true});
 legend('chCpi',[['CPI chung',C.navy],['Hàng ăn, ăn uống',C.gold],['Đồ uống, thuốc lá',C.plum]]);
 fillTable('tbl-cpi',['Tháng','CPI chung','Hàng ăn & ăn uống','Đồ uống & thuốc lá'],cpi.slice().reverse().map(r=>[mon(r.date),nf(r.value,2)+'%',nf(fm[ym(r.date)]?.value,2)+'%',nf(bm[ym(r.date)]?.value,2)+'%']));
 sourceLine('chCpi',[SRC.nso],mon(cpi.at(-1).date),'CPI so cùng kỳ và hai nhóm hàng liên quan tiêu dùng.');
 insight('chCpi','CPI '+nf(cpi.at(-1).value,1)+'% là mức cao nhất kể từ đầu 2020: giá tăng giúp doanh thu danh nghĩa của nhà bán lẻ đẹp hơn nhưng bào mòn sức mua thực; nhóm đồ uống tăng ~4,3% phản ánh thuế TTĐB bia từ 2026 bắt đầu vào giá bán.');
}
if(tour.length&&document.getElementById('chTourist')){
 const rs=tour.slice(-36);
 barLineChart('chTourist',{categories:rs.map(r=>mon(r.date)),series:[{name:'Khách quốc tế',color:C.teal,values:rs.map(r=>r.value/1000)}],unit:'triệu lượt',digits:2,height:260,rotateLabels:true});
 fillTable('tbl-tourist',['Tháng','Triệu lượt','YoY'],tour.slice().reverse().map(r=>[mon(r.date),nf(r.value/1000,3),signed(yoyAt(tour,r),0)+'%']));
 sourceLine('chTourist',[SRC.nso],mon(tour.at(-1).date),'Tổng khách quốc tế đến Việt Nam.');
 insight('chTourist','Khách quốc tế lũy kế '+signed(ytdYo(tour),0)+'% — kênh cầu thứ hai của ăn uống, trang sức (PNJ ở sân bay, trung tâm) và bia (SAB kênh on-trade). Mùa cao điểm quý IV–quý I quyết định doanh thu PNJ và SAB.');
}
if(dep.length&&document.getElementById('chCredit')){
 const rs=dep.filter(r=>Number.isFinite(yoyAt(dep,r))).slice(-36),cm=byMonth(cred);
 barLineChart('chCredit',{categories:rs.map(r=>mon(r.date)),series:[{name:'Tiền gửi dân cư YoY',color:C.navy,kind:'line',values:rs.map(r=>yoyAt(dep,r))},{name:'Tín dụng toàn nền kinh tế YoY',color:C.red,kind:'line',values:rs.map(r=>cm[ym(r.date)]?yoyAt(cred,cm[ym(r.date)]):null)}],unit:'%',digits:1,height:260,rotateLabels:true,zeroBase:true});
 legend('chCredit',[['Tiền gửi dân cư',C.navy],['Tín dụng',C.red]]);
 fillTable('tbl-credit',['Tháng','Tiền gửi dân cư (nghìn tỷ)','YoY','Tín dụng (nghìn tỷ)','YoY'],dep.slice().reverse().map(r=>{const c=cm[ym(r.date)];return [mon(r.date),nf(r.value/1000,0),signed(yoyAt(dep,r),1)+'%',nf((c?.value??NaN)/1000,0),signed(yoyAt(cred,c),1)+'%']}));
 sourceLine('chCredit',[SRC.sbv],mon(dep.at(-1).date),'Tiền gửi của dân cư và tổng dư nợ tín dụng nền kinh tế (NHNN, số liệu từ 01/2025). NHNN đổi phương pháp thống kê tiền gửi từ 10/2025 nên so cùng kỳ quanh mốc này có sai lệch. Nguồn công khai chưa tách tín dụng tiêu dùng.');
 insight('chCredit','Tín dụng '+signed(yoyAt(cred,cred.at(-1)),0)+'% so cùng kỳ ('+mon(cred.at(-1).date)+'). Tiền gửi dân cư '+signed(yoyAt(dep,dep.at(-1)),0)+'% chủ yếu do NHNN phân tổ lại khu vực từ 10/2025, chưa phải tiết kiệm tăng thật; đọc lại khi có đủ 12 tháng cùng phương pháp (từ 10/2026).');
}
// Hàng lâu bền: xe
const car=S('car_output'),moto=S('moto_output'),cimp=S('car_import');
if(car.length&&document.getElementById('chCar')){
 const rs=car.slice(-36),im=byMonth(cimp);
 barLineChart('chCar',{categories:rs.map(r=>mon(r.date)),series:[{name:'Ô tô sản xuất (nghìn chiếc)',color:C.navy,values:rs.map(r=>r.value)},{name:'Nhập khẩu ô tô (chục triệu USD)',color:C.gold,kind:'line',values:rs.map(r=>(im[ym(r.date)]?.value??NaN)/10)}],unit:'',digits:0,height:260,rotateLabels:true});
 legend('chCar',[['Ô tô sản xuất, nghìn chiếc',C.navy],['Nhập khẩu ô tô, chục triệu USD',C.gold]]);
 fillTable('tbl-car',['Tháng','Ô tô SX (nghìn)','YoY','Nhập khẩu (triệu USD)','YoY'],car.slice().reverse().map(r=>{const i=im[ym(r.date)];return [mon(r.date),nf(r.value,1),signed(yoyAt(car,r),0)+'%',nf(i?.value,0),signed(yoyAt(cimp,i),0)+'%']}));
 sourceLine('chCar',[SRC.nso,SRC.customs],mon(car.at(-1).date),'Sản lượng sản xuất ô tô và nhập khẩu ô tô nguyên chiếc. Doanh số VAMA ở bảng Key players.');
 insight('chCar','Sản xuất ô tô lũy kế '+signed(ytdYo(car),0)+'%, nhập khẩu '+signed(ytdYo(cimp),0)+'%: cầu xe mới vẫn tăng hai chữ số, nghiêng về xe nhập và xe điện (lệ phí trước bạ 0% đến 2030). HAX, SVC bán xe xăng nhập nên hưởng phần nhập khẩu; xe điện VinFast không qua đại lý niêm yết.');
}
if(moto.length&&document.getElementById('chMoto')){
 const rs=moto.slice(-36);
 barLineChart('chMoto',{categories:rs.map(r=>mon(r.date)),series:[{name:'Xe máy sản xuất',color:C.teal,values:rs.map(r=>r.value)}],unit:'nghìn chiếc',digits:0,height:260,rotateLabels:true});
 fillTable('tbl-moto',['Tháng','Nghìn chiếc','YoY'],moto.slice().reverse().map(r=>[mon(r.date),nf(r.value,0),signed(yoyAt(moto,r),0)+'%']));
 sourceLine('chMoto',[SRC.nso],mon(moto.at(-1).date),'Sản lượng sản xuất xe máy. VAMM bán ra ở bảng Key players.');
 insight('chMoto','Xe máy lũy kế '+signed(ytdYo(moto),0)+'%: thị trường đã bão hòa, tăng thêm chủ yếu do xe điện; là chỉ báo sức mua nhóm thu nhập trung bình, cùng nhóm khách của điện máy trả góp.');
}
// Tiêu dùng nhanh
const beer=S('beer_output'),milk=S('milk_output'),mp=S('milkpowder_output'),iipF=S('iip_food'),iipB=S('iip_bev');
if(beer.length&&document.getElementById('chFmcgOut')){
 const rs=beer.slice(-36),mm=byMonth(milk);
 barLineChart('chFmcgOut',{categories:rs.map(r=>mon(r.date)),series:[{name:'Bia (triệu lít)',color:C.gold,values:rs.map(r=>r.value)},{name:'Sữa tươi (triệu lít)',color:C.navy,kind:'line',values:rs.map(r=>mm[ym(r.date)]?.value??null)}],unit:'triệu lít',digits:0,height:260,rotateLabels:true});
 legend('chFmcgOut',[['Bia',C.gold],['Sữa tươi',C.navy]]);
 const pm=byMonth(mp);
 fillTable('tbl-fmcg-out',['Tháng','Bia (triệu lít)','YoY','Sữa tươi (triệu lít)','YoY','Sữa bột (nghìn tấn)'],beer.slice().reverse().map(r=>{const m=mm[ym(r.date)];return [mon(r.date),nf(r.value,0),signed(yoyAt(beer,r),0)+'%',nf(m?.value,0),signed(yoyAt(milk,m),0)+'%',nf(pm[ym(r.date)]?.value,1)]}));
 sourceLine('chFmcgOut',[SRC.nso],mon(beer.at(-1).date),'Sản lượng công nghiệp bia, sữa tươi, sữa bột. Sản lượng toàn ngành, không phải của SAB, VNM.');
 insight('chFmcgOut','Bia lũy kế '+signed(ytdYo(beer),0)+'% — hồi mạnh sau hai năm giảm vì Nghị định 100 và sức mua; sữa tươi '+signed(ytdYo(milk),0)+'%. IIP đồ uống tháng gần nhất '+signed(iipB.at(-1)?.value,0)+'%: nhà máy chạy trước mùa Tết và trước khi thuế TTĐB bia tăng bậc 2027.');
}
if(iipF.length&&document.getElementById('chIip')){
 const rs=iipF.slice(-36),bm=byMonth(iipB);
 barLineChart('chIip',{categories:rs.map(r=>mon(r.date)),series:[{name:'Chế biến thực phẩm',color:C.navy,kind:'line',values:rs.map(r=>r.value)},{name:'Sản xuất đồ uống',color:C.gold,kind:'line',values:rs.map(r=>bm[ym(r.date)]?.value??null)}],unit:'%',digits:0,height:260,rotateLabels:true,zeroBase:false});
 legend('chIip',[['Chế biến thực phẩm',C.navy],['Đồ uống',C.gold]]);
 fillTable('tbl-iip',['Tháng','Thực phẩm YoY','Đồ uống YoY'],iipF.slice().reverse().map(r=>[mon(r.date),signed(r.value,1)+'%',signed(bm[ym(r.date)]?.value,1)+'%']));
 sourceLine('chIip',[SRC.nso],mon(iipF.at(-1).date),'IIP sản xuất chế biến thực phẩm và đồ uống, % so cùng kỳ.');
 insight('chIip','Thực phẩm '+signed(iipF.at(-1).value,0)+'%, đồ uống '+signed(iipB.at(-1).value,0)+'% tháng gần nhất — cả hai tăng hai chữ số liên tiếp từ tháng 7, là mức mạnh nhất kể từ 2022. Cầu nội địa và xuất khẩu thực phẩm (MSN, KDC, VNM) cùng tốt lên.');
}
const sugar=S('sugar'),palm=S('palm_oil'),soy=S('soymeal'),corn=S('corn');
if(sugar.length&&document.getElementById('chInputs')){
 const si=byMonth(idx(sugar,BASE)),pi=byMonth(idx(palm,BASE)),so=byMonth(idx(soy,BASE)),co=byMonth(idx(corn,BASE)),base=palm.filter(r=>r.date.slice(0,7)>=BASE);
 lines('chInputs',base,[['Đường thô',C.gold,r=>si[ym(r.date)]?.value??null],['Dầu cọ',C.plum,r=>pi[ym(r.date)]?.value??null],['Khô đậu nành',C.navy,r=>so[ym(r.date)]?.value??null],['Ngô',C.teal,r=>co[ym(r.date)]?.value??null]],'',0);
 legend('chInputs',[['Đường thô',C.gold],['Dầu cọ',C.plum],['Khô đậu nành',C.navy],['Ngô',C.teal]]);
 const sm=byMonth(sugar),pm=byMonth(palm),som=byMonth(soy),cm=byMonth(corn);
 fillTable('tbl-inputs',['Kỳ','Đường (US cent/lb)','Dầu cọ (USD/tấn)','Khô đậu (USD/tấn)','Ngô (US cent/bu)'],palm.slice().reverse().map(r=>[short(r.date),nf(sm[ym(r.date)]?.value,2),nf(r.value,0),nf(som[ym(r.date)]?.value,1),nf(cm[ym(r.date)]?.value,2)]));
 sourceLine('chInputs',[SRC.ice],short(palm.at(-1).date),'Chỉ số T1/2024 = 100. Đường thô ICE No.11 hợp đồng gần (giá cuối tháng); dầu cọ, khô đậu, ngô: IMF Primary Commodity Prices (FRED), bình quân tháng. Chưa có nguồn công khai cho sữa bột WMP, lúa mạch, nhôm lon.');
 const sL=sugar.at(-1);
 insight('chInputs','Đường thô '+signed(yoyAt(sugar,sugar.at(-1)),0)+'% YoY ('+mon(sugar.at(-1).date)+'); dầu cọ '+signed(yoyAt(palm,palm.at(-1)),0)+'%, khô đậu '+signed(yoyAt(soy,soy.at(-1)),0)+'% ('+mon(palm.at(-1).date)+').');
}
// Định giá
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['220','Chuỗi bán lẻ (MWG, FRT)',C.navy],['215','Phân phối điện tử',C.grey],['224','Bán lẻ xe',C.teal],['239','Sữa',C.plum],['120','Bia',C.gold]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/E '+name,color,kind:'line',values:weekly.map(d=>{const v=at(id,d,1);return v>0&&v<60?v:null})})),unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Rổ mã','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],1),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[['VNDirect finfo','https://dstock.vndirect.com.vn/']],short(dates.at(-1)),'Rổ mã theo dõi: Chuỗi bán lẻ (MWG, FRT) (MWG, FRT); Phân phối điện tử (DGW, PET); Bán lẻ xe (HAX, SVC); Sữa (VNM); Bia (SAB). P/E = tổng vốn hóa / tổng lợi nhuận (vốn hóa ÷ P/E từng mã, VNDirect); mã lỗ không có P/E chỉ vào P/B và vốn hóa. Không phải toàn ngành. Vẽ mỗi 5 phiên.');
 insight('chSectorVal',(()=>{const L=ids.filter(([id])=>sec[id]?.records?.length);const l0=sec[L[0][0]].records.at(-1);return 'P/E rổ mã theo dõi, phiên '+short(l0[0])+': '+L.map(([id,name])=>{const r=sec[id].records,l=r.at(-1),y=r.find(x=>x[0]>=String(+l[0].slice(0,4)-1)+l[0].slice(4));return name+' '+nf(l[1],(1==2?2:1))+'x'+(y&&y[1]!=null?' (1 năm trước '+nf(y[1],(1==2?2:1))+'x)':'')}).join('; ')+'.'})());
}

// Tài liệu: cấu phần sức mua và mạng lưới cửa hàng (số có evidence)
if(document.getElementById('chRetailMix')){
 hbarCompare('chRetailMix',{items:[{label:'Bán lẻ hàng hóa +12,8%',value:4463.6,color:C.navy},{label:'Lưu trú, ăn uống +16,7%',value:758.6,color:C.teal},{label:'TMĐT 6T (Metric) +44,1%',value:291.6,color:C.gold},{label:'Du lịch lữ hành +17,9%',value:78.1,color:C.plum}],unit:'nghìn tỷ',digits:1,labelW:190,ariaLabel:'Cấu phần sức mua 9T/2026'});
 sourceLine('chRetailMix',[['Cục Thống kê qua VietnamPlus','https://www.vietnamplus.vn/nguoi-tieu-dung-viet-manh-tay-chi-tieu-hon-5925-nghin-ty-dong-trong-9-thang-post1139808.vnp'],['Metric qua Người Quan sát','https://nguoiquansat.vn/bo-tui-gan-292-000-ty-dong-sau-6-thang-thuong-mai-dien-tu-viet-nam-tang-toc-ngoai-suc-tuong-tuong-306108.html']],'9T/2026','Tổng 5.925,7 nghìn tỷ (+13,4%). TMĐT là số 6 tháng của Metric, kỳ khác ba cấu phần còn lại; đã nằm một phần trong bán lẻ hàng hóa.',false);
 insight('chRetailMix','Ăn uống, du lịch tăng nhanh hơn hàng hóa — tiền đang dồn vào dịch vụ và trải nghiệm; TMĐT +44% là kênh tăng nhanh nhất, lấy thị phần của cửa hàng điện máy, điện thoại truyền thống. Nhà bán lẻ có online mạnh (MWG, FRT) giữ được, chuỗi thuần offline chịu sức ép giá.');
}
if(document.getElementById('chStores')){
 hbarCompare('chStores',{items:[{label:'WinCommerce (MSN)',value:5141,color:C.plum},{label:'Bách Hóa Xanh (MWG)',value:3612,color:C.navy},{label:'Long Châu (FRT)',value:2639,color:C.teal},{label:'Điện Máy Xanh (MWG)',value:1998,color:C.grey},{label:'TGDĐ (MWG)',value:919,color:C.grey},{label:'PNJ',value:432,color:C.gold}],unit:'điểm bán',digits:0,labelW:170,ariaLabel:'Mạng lưới cửa hàng các chuỗi'});
 sourceLine('chStores',[['Masan qua DN&PL','https://doanhnhan.baophapluat.vn/masan-group-msn-bao-lai-ky-luc-3-800-ty-dong-quy-ii-2026-tu-tin-nang-chi-tieu-kinh-doanh-ca-nam.html'],['Bách Hóa Xanh qua TTTC-TT','https://thitruongtaichinhtiente.vn/bach-hoa-xanh-tang-toc-doanh-thu-8-thang-vuot-40-000-ty-dong-mo-moi-hon-1-000-cua-hang-85540.html'],['Long Châu qua CafeF','https://cafef.vn/doanh-thu-fpt-retail-dat-30743-ty-dong-trong-nua-dau-nam-2026-188260729175454766.chn']],'T6–T8/2026','Thời điểm công bố khác nhau giữa các chuỗi (bảng dưới). Long Châu chưa gồm 236 trung tâm tiêm chủng.',false);
 insight('chStores','Cung điểm bán đang dồn vào bách hóa và nhà thuốc (mở mới hàng trăm điểm/quý) trong khi điện máy, điện thoại, trang sức thu hẹp. Đây là cách ngành tăng trưởng 2026: lấy thị phần từ kênh truyền thống thay vì mở thêm cửa hàng điện máy.');
}
// ---------- 4. KPIs, quick read, catalyst brief ----------
const rL=rt.at(-1),cL=cpi.at(-1),tL=tour.at(-1),caL=car.at(-1),bL=beer.at(-1),sL=sugar.at(-1),rs220=sec['220']?.records||[],v220=rs220.at(-1),v239=(sec['239']?.records||[]).at(-1);
const rtY=ytdYo(rt),rtM=yoyAt(rt,rL),tY=ytdYo(tour),caY=ytdYo(car),beY=ytdYo(beer),suY=yoyAt(sugar,sL),dpY=yoyAt(dep,dep.at(-1)),ipB=iipB.at(-1)?.value;
kpi('spk-retail',rL?nf(rL.value/1000,0):'—',rL?'nghìn tỷ · '+mon(rL.date):'—',rL?signed(rtM,0)+'% so cùng kỳ · lũy kế '+signed(rtY,0)+'%':'',rt.slice(-12).map(r=>r.value));
kpi('spk-cpi',cL?nf(cL.value,2)+'%':'—',cL?'CPI so cùng kỳ · '+mon(cL.date):'—',cpi.length>12?'cùng kỳ '+nf(cpi[cpi.length-13].value,2)+'%':'',cpi.slice(-12).map(r=>r.value),C.red);
kpi('spk-tourist',tL?nf(tL.value/1000,2):'—',tL?'triệu lượt · '+mon(tL.date):'—',tL?'lũy kế '+signed(tY,0)+'%':'',tour.slice(-12).map(r=>r.value),C.teal);
kpi('spk-car',caL?nf(caL.value,1):'—',caL?'nghìn ô tô SX · '+mon(caL.date):'—',caL?'lũy kế '+signed(caY,0)+'%':'',car.slice(-12).map(r=>r.value),C.navy);
kpi('spk-beer',bL?nf(bL.value,0):'—',bL?'triệu lít bia · '+mon(bL.date):'—',bL?'lũy kế '+signed(beY,0)+'%':'',beer.slice(-12).map(r=>r.value),C.gold);
kpi('spk-pe',v220?nf(v220[1],1)+'x':'—',v220?'P/E chuỗi bán lẻ · '+short(v220[0]):'—',v239?'Sữa '+nf(v239[1],1)+'x':'',rs220.slice(-30).map(r=>r[1]),C.grey);
const quick=document.querySelector('.hero .insight');
if(quick&&rL){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu công khai: '),`Tổng mức bán lẻ ${mon(rL.date)} ${nf(rL.value/1000,0)} nghìn tỷ (${signed(rtM,0)}%, lũy kế ${signed(rtY,0)}%). CPI ${nf(cL?.value,1)}%. Khách quốc tế lũy kế ${signed(tY,0)}%. Ô tô sản xuất lũy kế ${signed(caY,0)}%, bia ${signed(beY,0)}%. Đường thô ${signed(suY,0)}% YoY. P/E chuỗi bán lẻ ${v220?nf(v220[1],1):'—'}x, sữa ${v239?nf(v239[1],1):'—'}x.`);
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
const row=(group,name,big,evidence,cond,st,who,chart)=>({group,name,big,chart,st,mid:[evidence,cond],end:[who]});
const score=[
 row('Cầu','Bán lẻ tăng hai chữ số',[signed(rtY,0)+'%','tổng mức bán lẻ lũy kế'],'Loại trừ giá +7,8% (NSO 9T); tháng gần nhất '+signed(rtM,0)+'%','Lũy kế danh nghĩa về dưới +8%',rtY==null?'na':rtY>10?'good':rtY<6?'risk':'watch','▲ MWG · FRT · PNJ · DGW','chRetail'),
 row('Giá','Lạm phát cao hơn',[cL?nf(cL.value,1)+'%':'—','CPI YoY'],'Hàng ăn '+signed(S('cpi_food_yoy').at(-1)?.value,1)+'%, đồ uống '+signed(S('cpi_bev_yoy').at(-1)?.value,1)+'%','CPI vượt 5,5% hai tháng liền',cL==null?'na':cL.value>5.5?'risk':cL.value<4?'good':'watch','▼ sức mua thực · ▲ doanh thu danh nghĩa F&B','chCpi'),
 row('Cầu','Khách quốc tế kỷ lục',[signed(tY,0)+'%','lũy kế'],tL?nf(tL.value/1000,2)+' triệu lượt tháng '+Number(tL.date.slice(5,7)):'—','Lũy kế về dưới +5%',tY==null?'na':tY>10?'good':tY<0?'risk':'watch','▲ PNJ · SAB · MWG (sân bay, du lịch)','chTourist'),
 row('Cầu','Xe mới bán tốt',[signed(caY,0)+'%','ô tô sản xuất lũy kế'],'Nhập khẩu ô tô '+signed(ytdYo(cimp),0)+'%; VAMA 9T +12%','Sản xuất lũy kế về dưới 0%',caY==null?'na':caY>10?'good':caY<0?'risk':'watch','▲ HAX · SVC','chCar'),
 row('Cung','Bia, thực phẩm chạy máy mạnh',[signed(beY,0)+'%','sản lượng bia lũy kế'],'IIP đồ uống '+signed(ipB,0)+'%; thực phẩm '+signed(iipF.at(-1)?.value,0)+'%','IIP đồ uống về dưới +5%',beY==null?'na':beY>8?'good':beY<0?'risk':'watch','▲ SAB · VNM · MSN · KDC','chFmcgOut'),
 row('Chi phí','Đường đổi chiều tăng',[signed(suY,0)+'%','đường thô YoY'],'Dầu cọ '+signed(yoyAt(palm,palm.at(-1)),0)+'%, khô đậu '+signed(yoyAt(soy,soy.at(-1)),0)+'%','Đường về dưới 15 US cent/lb',suY==null?'na':suY>20?'risk':suY<-10?'good':'watch','▲ QNS (bán đường) · ▼ VNM, nước giải khát','chInputs'),
 row('Vốn','Hộ gia đình gửi tiết kiệm nhiều hơn',[signed(dpY,0)+'%','tiền gửi dân cư YoY'],'Tín dụng '+signed(yoyAt(cred,cred.at(-1)),0)+'%; lãi huy động tăng gần 1 điểm %','Tiền gửi dân cư tăng chậm lại dưới +8%',dpY==null?'na':dpY>12?'watch':'info','▼ hàng lâu bền trả góp','chCredit'),
 row('Định giá','Bán lẻ hạ nhiệt, F&B rẻ',[v220?nf(v220[1],1)+'x':'—','P/E chuỗi bán lẻ'],'Sữa '+(v239?nf(v239[1],1):'—')+'x, bia '+nf((sec['120']?.records||[]).at(-1)?.[1],1)+'x','BCTC quý III (20–30/10); KQ tháng của MWG, FRT',v220?'info':'na','MWG · VNM · SAB','chSectorVal')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.RETAIL_BRIEF={
 headline:'Bán lẻ '+signed(rtY,0)+'% và khách quốc tế '+signed(tY,0)+'% kéo cầu; sản lượng bia, thực phẩm tăng mạnh; CPI '+nf(cL?.value,1)+'% và đường tăng giá là chi phí · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Bán lẻ hiện đại & điện máy','MWG · FRT · DGW · PET',rtY!=null&&rtY>10?'up':'flat','Bán lẻ '+signed(rtY,0)+'%'],['Hàng lâu bền','PNJ · HAX · SVC',caY!=null&&caY>10?'up':'flat','Ô tô '+signed(caY,0)+'%'],['Hàng tiêu dùng nhanh','VNM · SAB · QNS · MSN · KDC',beY!=null&&beY>8?'up':'flat','Bia '+signed(beY,0)+'%']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Đầu tháng','NSO: bán lẻ, CPI, khách quốc tế, sản lượng'],['Giữa tháng','VAMA, VAMM doanh số xe; MWG, FRT, PNJ báo tháng'],['20–30/10','BCTC quý III'],['01/01/2027','Thuế TTĐB nước giải khát có đường 8%; bia bậc tiếp theo']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ nguồn công khai lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; giá hàng hóa: IMF/FRED, EIA, ICE.';
})();
