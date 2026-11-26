/* Retail & consumer dashboard (Bán lẻ & tiêu dùng): value chain, Bán lẻ hiện đại / Hàng lâu bền / Hàng tiêu dùng nhanh panes
   and sector valuation from window.RETAIL_PUBLIC (scripts/build_sector_public.py: public commodity series only): retail sales, CPI, tourists, output, inputs).
   Document figures sit in the HTML tables and are backed by data/retail/evidence.json.
   Publishes window.RETAIL_BRIEF for catalyst-board.js. Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='retail')return;
const W=window.RETAIL_PUBLIC||{blocks:{}},B=W.blocks||{};
// Sơ đồ không có nguồn số: ghi tay cho dòng "Nguồn:" (chart-source.js đọc khi tải).
window.SECTOR_SOURCE_MANUAL=(window.SECTOR_SOURCE_MANUAL||[]).concat([[/^Chuỗi giá trị/,'FinSuccess tổng hợp từ báo cáo doanh nghiệp và Cục Thống kê']]);
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const qtr=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{},gold=B.gold?.series||{};
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
  ['income',25,40,['Thu nhập & tín dụng','lương · tiền gửi · vay tiêu dùng']],['tourist',25,165,['Khách quốc tế','17,7 triệu lượt 9T/2026']],['input',25,290,['Nguyên liệu F&B','đường · dầu cọ · khô đậu · ngô']],
  ['modern',315,40,['Bán lẻ hiện đại','MWG · FRT · DGW · PET']],['durable',315,165,['Trang sức','PNJ']],['fmcg',315,290,['Tiêu dùng nhanh','QNS · MSN · KDC']],
  ['store',605,40,['Cửa hàng & online','chuỗi · TMĐT']],['price',605,165,['Giá bán & CPI','VAT 2% · TTĐB nước giải khát']],['channel',605,290,['Kênh phân phối','siêu thị · tạp hóa · TMĐT']],
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
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: bán lẻ hiện đại (MWG, FRT) ăn theo sức mua và tốc độ mở cửa hàng — doanh thu đi sát tổng mức bán lẻ, lợi nhuận đi theo biên gộp và chi phí mặt bằng. Trang sức (PNJ) nhạy với giá vàng và chênh lệch thế giới. Tiêu dùng nhanh (đường, thực phẩm, dầu ăn) phụ thuộc giá nguyên liệu nhập và thuế TTĐB nước giải khát. Sữa, Bia, Ô tô – Xe máy có dashboard riêng.'));
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
 const ck=String(checked||'').replace(/-/g,'');n.append(` · Kỳ cuối: ${period}`+(wi?` · Kiểm: ${ck.length>=8?short(ck.slice(0,4)+'-'+ck.slice(4,6)+'-'+ck.slice(6,8)):'—'}`:''));host.after(n);
 if(method)n.after(make('div','source-note method-note',method));
 if(block&&wi){block.dataset.refreshStatus='loaded';block.dataset.sourceIds='public'}
}
function insight(id,text){const block=document.getElementById(id)?.closest('.card');if(!block)return;const n=make('div','chart-insight');n.dataset.inputOwner='ai';n.innerHTML='<b>Cách hiểu trong bối cảnh ngành · AI:</b> ';n.append(text);block.append(n)}
function legend(id,items){const host=document.getElementById(id);if(!host)return;const l=make('div','legend');items.forEach(([n,c])=>{const s=make('span','li'),d=make('span','dot');d.style.background=c;s.append(d,n);l.append(s)});host.after(l)}
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;const ve=card.querySelector('.value'),seg=String(sub??'').split(' · '),hasU=value!=='—'&&seg.length>1&&/^(nghìn|triệu|tỷ|USD|CNY|VND|US cent|điểm|lượt)/.test(seg[0]);ve.textContent=value;if(hasU){const u=document.createElement('span');u.className='unit';u.style.cssText='font-size:12px;font-weight:600;color:var(--muted,#6b7a90);margin-left:6px;letter-spacing:0';u.textContent=seg[0];ve.append(u)}card.querySelector('.sub').textContent=hasU?seg.slice(1).join(' · '):sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();const sv=(series||[]).filter(Number.isFinite);if(sv.length>1)sparkline(spark,sv,color)}
function lines(id,base,series,unit,digits,zeroBase=false){barLineChart(id,{categories:base.map(r=>mon(r.date)),series:series.map(([n,c,f])=>({name:n,color:c,kind:'line',values:base.map(f)})),unit,digits,height:260,zeroBase,rotateLabels:true})}
const BASE='2024-01';
const car=S('car_output'),cimp=S('car_import');
const rt=S('retail_total'),rg=S('retail_goods'),cpi=S('cpi_yoy'),tour=S('tourists'),dep=S('household_deposits'),cred=S('credit_total');
// Bán lẻ hiện đại: sức mua
if(rt.length&&document.getElementById('chRetail')){
 const rs=rt.slice(-36),gm=byMonth(rg);
 barLineChart('chRetail',{categories:rs.map(r=>mon(r.date)),series:[{name:'Tổng mức bán lẻ HH & DV',color:C.navy,values:rs.map(r=>r.value/1000)},{name:'Bán lẻ hàng hóa',color:C.teal,kind:'line',values:rs.map(r=>(gm[ym(r.date)]?.value??NaN)/1000)}],unit:'nghìn tỷ',digits:0,height:260,rotateLabels:true});
 legend('chRetail',[['Tổng mức bán lẻ HH & DV',C.navy],['Bán lẻ hàng hóa',C.teal]]);
 fillTable('tbl-retail',['Tháng','Tổng (nghìn tỷ)','YoY','Hàng hóa (nghìn tỷ)','YoY'],rt.slice().reverse().map(r=>{const g=gm[ym(r.date)];return [mon(r.date),nf(r.value/1000,1),signed(yoyAt(rt,r),1)+'%',nf((g?.value??NaN)/1000,1),signed(yoyAt(rg,g),1)+'%']}));
 sourceLine('chRetail',[SRC.nso],mon(rt.at(-1).date),'Tổng mức bán lẻ hàng hóa và doanh thu dịch vụ tiêu dùng, trong đó bán lẻ hàng hóa; giá hiện hành, chưa loại trừ giá.');
 insight('chRetail','Doanh thu danh nghĩa của chuỗi bán lẻ đi theo đường này, nhưng một phần tăng là do giá nên cần đọc cùng CPI ở lớp chỉ báo giải thích. Kiểm tiếp bán lẻ hàng hóa tháng 11–12 (mùa khuyến mãi, Tết sớm 17/02/2027) và số loại trừ giá cả năm khi NSO công bố.');
}
if(cpi.length&&document.getElementById('chCpi')){
 const rs=cpi.slice(-36),fm=byMonth(S('cpi_food_yoy')),bm=byMonth(S('cpi_bev_yoy'));
 barLineChart('chCpi',{categories:rs.map(r=>mon(r.date)),series:[{name:'CPI chung',color:C.navy,kind:'line',values:rs.map(r=>r.value)},{name:'Hàng ăn & dịch vụ ăn uống',color:C.gold,kind:'line',values:rs.map(r=>fm[ym(r.date)]?.value??null)},{name:'Đồ uống & thuốc lá',color:C.plum,kind:'line',values:rs.map(r=>bm[ym(r.date)]?.value??null)}],unit:'%',digits:1,height:260,rotateLabels:true,zeroBase:true});
 legend('chCpi',[['CPI chung',C.navy],['Hàng ăn, ăn uống',C.gold],['Đồ uống, thuốc lá',C.plum]]);
 fillTable('tbl-cpi',['Tháng','CPI chung','Hàng ăn & ăn uống','Đồ uống & thuốc lá'],cpi.slice().reverse().map(r=>[mon(r.date),nf(r.value,2)+'%',nf(fm[ym(r.date)]?.value,2)+'%',nf(bm[ym(r.date)]?.value,2)+'%']));
 sourceLine('chCpi',[SRC.nso],mon(cpi.at(-1).date),'CPI so cùng kỳ và hai nhóm hàng liên quan tiêu dùng.');
 insight('chCpi','Giá tăng làm doanh thu danh nghĩa của nhà bán lẻ và hàng tiêu dùng đẹp hơn nhưng bào mòn sức mua thực; nhóm đồ uống còn phản ánh thuế TTĐB bia bắt đầu vào giá bán. Kiểm tiếp CPI tháng 1/2027 khi giảm VAT 2% hết hiệu lực và thuế TTĐB bậc mới áp dụng.');
}
if(tour.length&&document.getElementById('chTourist')){
 const rs=tour.slice(-36);
 barLineChart('chTourist',{categories:rs.map(r=>mon(r.date)),series:[{name:'Khách quốc tế',color:C.teal,values:rs.map(r=>r.value/1000)}],unit:'triệu lượt',digits:2,height:260,rotateLabels:true});
 fillTable('tbl-tourist',['Tháng','Triệu lượt','YoY'],tour.slice().reverse().map(r=>[mon(r.date),nf(r.value/1000,3),signed(yoyAt(tour,r),0)+'%']));
 sourceLine('chTourist',[SRC.nso],mon(tour.at(-1).date),'Tổng khách quốc tế đến Việt Nam.');
 insight('chTourist','Khách quốc tế là kênh cầu thứ hai của ăn uống, trang sức ở điểm du lịch và bia kênh nhà hàng, tác động qua doanh thu chứ không qua biên. Kiểm tiếp mùa cao điểm quý IV–quý I và doanh thu lưu trú, ăn uống ở cơ cấu chi tiêu.');
}
if(dep.length&&document.getElementById('chCredit')){
 const rs=dep.filter(r=>Number.isFinite(yoyAt(dep,r))).slice(-36),cm=byMonth(cred);
 barLineChart('chCredit',{categories:rs.map(r=>mon(r.date)),series:[{name:'Tiền gửi dân cư YoY',color:C.navy,kind:'line',values:rs.map(r=>yoyAt(dep,r))},{name:'Tín dụng toàn nền kinh tế YoY',color:C.red,kind:'line',values:rs.map(r=>cm[ym(r.date)]?yoyAt(cred,cm[ym(r.date)]):null)}],unit:'%',digits:1,height:260,rotateLabels:true,zeroBase:true});
 legend('chCredit',[['Tiền gửi dân cư',C.navy],['Tín dụng',C.red]]);
 fillTable('tbl-credit',['Tháng','Tiền gửi dân cư (nghìn tỷ)','YoY','Tín dụng (nghìn tỷ)','YoY'],dep.slice().reverse().map(r=>{const c=cm[ym(r.date)];return [mon(r.date),nf(r.value/1000,0),signed(yoyAt(dep,r),1)+'%',nf((c?.value??NaN)/1000,0),signed(yoyAt(cred,c),1)+'%']}));
 sourceLine('chCredit',[SRC.sbv],mon(dep.at(-1).date),'Tiền gửi của dân cư và tổng dư nợ tín dụng nền kinh tế (NHNN, số liệu từ 01/2025). NHNN đổi phương pháp thống kê tiền gửi từ 10/2025 nên so cùng kỳ quanh mốc này có sai lệch. Nguồn công khai chưa tách tín dụng tiêu dùng.');
 insight('chCredit','Tín dụng ở đây là tổng dư nợ nền kinh tế, không phải tín dụng tiêu dùng, nên chỉ là chỉ báo gián tiếp cho hàng trả góp (điện thoại, điện máy, xe). Tiền gửi dân cư so cùng kỳ bị méo do NHNN phân tổ lại từ 10/2025; đọc lại khi đủ 12 tháng cùng phương pháp.');
}
// Tiêu dùng nhanh
const beer=S('beer_output'),iipF=S('iip_food'),iipB=S('iip_bev');
if(iipF.length&&document.getElementById('chIip')){
 const rs=iipF.slice(-36),bm=byMonth(iipB);
 barLineChart('chIip',{categories:rs.map(r=>mon(r.date)),series:[{name:'Chế biến thực phẩm',color:C.navy,kind:'line',values:rs.map(r=>r.value)},{name:'Sản xuất đồ uống',color:C.gold,kind:'line',values:rs.map(r=>bm[ym(r.date)]?.value??null)}],unit:'%',digits:0,height:260,rotateLabels:true,zeroBase:false});
 legend('chIip',[['Chế biến thực phẩm',C.navy],['Đồ uống',C.gold]]);
 fillTable('tbl-iip',['Tháng','Thực phẩm YoY','Đồ uống YoY'],iipF.slice().reverse().map(r=>[mon(r.date),signed(r.value,1)+'%',signed(bm[ym(r.date)]?.value,1)+'%']));
 sourceLine('chIip',[SRC.nso],mon(iipF.at(-1).date),'IIP sản xuất chế biến thực phẩm và đồ uống, % so cùng kỳ.');
 insight('chIip','IIP là chỉ số sản xuất, không phải doanh thu; nhà máy chạy mạnh trước mùa Tết và trước mốc thuế mới. Kiểm tiếp IIP đồ uống quý I/2027 để tách phần kéo trước.');
}
const sugar=S('sugar'),palm=S('palm_oil'),soy=S('soymeal'),corn=S('corn'),smp=S('smp'),wmp=S('wmp');
if(sugar.length&&document.getElementById('chInputs')){
 const si=byMonth(idx(sugar,BASE)),pi=byMonth(idx(palm,BASE)),so=byMonth(idx(soy,BASE)),co=byMonth(idx(corn,BASE)),wi_=byMonth(idx(wmp,BASE)),base=palm.filter(r=>r.date.slice(0,7)>=BASE);
 lines('chInputs',base,[['Đường thô',C.gold,r=>si[ym(r.date)]?.value??null],['Dầu cọ',C.plum,r=>pi[ym(r.date)]?.value??null],['Khô đậu nành',C.navy,r=>so[ym(r.date)]?.value??null],['Ngô',C.teal,r=>co[ym(r.date)]?.value??null]],'',0);
 legend('chInputs',[['Đường thô',C.gold],['Dầu cọ',C.plum],['Khô đậu nành',C.navy],['Ngô',C.teal]]);
 const sm=byMonth(sugar),pm=byMonth(palm),som=byMonth(soy),cm=byMonth(corn),smm=byMonth(smp),wmm=byMonth(wmp);
 fillTable('tbl-inputs',['Tháng','Đường (US cent/lb)','Dầu cọ (USD/tấn)','Khô đậu (USD/tấn)','Ngô (US cent/bu)','SMP (USD/tấn)','WMP (USD/tấn)'],palm.slice().reverse().map(r=>[mon(r.date),nf(sm[ym(r.date)]?.value,2),nf(r.value,0),nf(som[ym(r.date)]?.value,1),nf(cm[ym(r.date)]?.value,2),nf(smm[ym(r.date)]?.value,0),nf(wmm[ym(r.date)]?.value,0)]));
 sourceLine('chInputs',[['ICE đường thô No.11 (Yahoo Finance)','https://finance.yahoo.com/quote/SB%3DF/'],['IMF qua FRED','https://fred.stlouisfed.org/series/PPOILUSDM'],['FAO FPMA','https://fpma.fao.org/']],short(palm.at(-1).date),'Chỉ số T1/2024 = 100. Đường thô ICE No.11 hợp đồng gần (giá cuối tháng); dầu cọ, khô đậu, ngô: IMF Primary Commodity Prices (FRED), bình quân tháng. Sữa bột WMP: FAO FPMA (bình quân châu Âu & châu Đại Dương, FOB). Chưa có nguồn công khai cho lúa mạch, malt, nhôm lon (nguyên liệu chính của SAB).');
 const sL=sugar.at(-1);
 insight('chInputs','Giá nguyên liệu đi vào giá vốn với độ trễ tồn kho và hợp đồng mua, nên tác động lên biên gộp xuất hiện sau vài quý. Kiểm tiếp đường, sữa bột so với biên gộp VNM, QNS, MSN ở chart biên gộp bên cạnh.');
}
// Định giá
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['220','Chuỗi bán lẻ (MWG, FRT)',C.navy],['215','Phân phối điện tử',C.grey],['227','Trang sức (PNJ)',C.red]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/E '+name,color,kind:'line',values:weekly.map(d=>{const v=at(id,d,1);return v>0&&v<60?v:null})})),unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Rổ mã','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],1),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[['VNDirect finfo','https://dstock.vndirect.com.vn/']],short(dates.at(-1)),'Rổ mã theo dõi: Chuỗi bán lẻ (MWG, FRT); Phân phối điện tử (DGW, PET); Trang sức (PNJ, rổ riêng từ 05/11/2026 vì Wi không phân ngành PNJ). P/E = tổng vốn hóa / tổng lợi nhuận (vốn hóa ÷ P/E từng mã, VNDirect); mã lỗ không có P/E (PNJ lỗ Q2–Q3/2026) chỉ vào P/B và vốn hóa. Không phải toàn ngành. Vẽ mỗi 5 phiên.');
 insight('chSectorVal','P/E của mỗi rổ đọc cùng chu kỳ lợi nhuận: rổ có lợi nhuận đang hồi phục mạnh thường có P/E giảm dù giá cổ phiếu tăng. Kiểm tiếp lợi nhuận 4 quý của từng rổ ở chart doanh thu, lợi nhuận bên dưới.');
}

// Cấu phần sức mua, cửa hàng, ô tô, vàng, thuế, tài chính nhóm: xem phần 5 (26/11/2026).

// ---------- 3b. Vàng SJC/nhẫn (Wi), biên gộp FMCG vs nguyên liệu trễ 2 quý (05/11/2026) ----------
const gS=gold.gold_sjc?.records||[],gR=gold.gold_ring?.records||[];
if(gS.length&&document.getElementById('chGold')){
 const rm=byMonth(gR),rs=gS.slice(-36);
 barLineChart('chGold',{categories:rs.map(r=>mon(r.date)),series:[{name:'Vàng miếng SJC',color:C.gold,kind:'line',values:rs.map(r=>r.value/1000)},{name:'Vàng nhẫn',color:C.plum,kind:'line',values:rs.map(r=>(rm[ym(r.date)]?.value??NaN)/1000)}],unit:'triệu/lượng',digits:1,height:260,rotateLabels:true,zeroBase:false});
 legend('chGold',[['Vàng miếng SJC',C.gold],['Vàng nhẫn',C.plum]]);
 fillTable('tbl-gold',['Ngày','SJC (triệu/lượng)','Nhẫn (triệu/lượng)','SJC YoY'],gS.slice().reverse().map(r=>[short(r.date),nf(r.value/1000,1),nf((rm[ym(r.date)]?.value??NaN)/1000,1),signed(yoyAt(gS,r),0)+'%']));
 sourceLine('chGold',[['WiData · Vàng SJC 1224193, Vàng nhẫn SJC 1224229','https://widata.vn/']],short(gS.at(-1).date),'Giá niêm yết nghìn VND/lượng, chuỗi ngày; gọi khoảng dài bị Wi nén theo tháng (ngày cuối kỳ), điểm cuối là ngày gọi. Chênh lệch với thế giới chưa tính được vì chưa có XAU/USD và tỷ giá theo ngày (bảng ở tab Giá – Chi phí – Margin).');
 const L=gS.at(-1),y=yoyAt(gS,L),pk=gS.reduce((a,r)=>r.value>a.value?r:a,gS[0]);
 insight('chGold','Giá vàng tăng làm doanh thu vàng 24K của PNJ phình nhưng biên mỏng, còn giá giảm từ đỉnh làm tồn kho vàng mất giá. Kiểm tiếp biên gộp PNJ quý IV và chênh lệch giá trong nước – thế giới khi doanh nghiệp được nhập vàng.');
 const gd=document.getElementById('gold-latest-date');if(gd){gd.textContent=short(L.date);document.getElementById('gold-latest-sjc').textContent=nf(L.value/1000,1);document.getElementById('gold-latest-ring').textContent=nf((gR.at(-1)?.value??NaN)/1000,1)}
}
const CQ=window.COMPANY_QUARTERLY;
if(CQ?.companies?.length&&document.getElementById('chMarginQ')){
 const want=['MSN','KDC'],col={KDC:C.plum,MSN:C.teal};
 const cos=want.map(sym=>CQ.companies.find(c=>c.symbol===sym&&c.sector==='retail')||CQ.companies.find(c=>c.symbol===sym)).filter(Boolean);
 const n=CQ.quarters.length,from=Math.max(0,n-12),qs=CQ.quarters.slice(from);
 const ser=cos.map(c=>({name:c.symbol,color:col[c.symbol],kind:'line',values:c.gross_margin.slice(from).map(v=>v==null?null:v)}));
 barLineChart('chMarginQ',{categories:qs,series:ser,unit:'%',digits:1,height:260,rotateLabels:true,zeroBase:true});
 legend('chMarginQ',ser.map(x=>[x.name,x.color]));
 fillTable('tbl-margin-q',['Quý',...cos.map(c=>c.symbol+' (%)')],qs.map((qq,i)=>[qq,...cos.map(c=>nf(c.gross_margin[from+i],1))]).reverse());
 const miss=(CQ.missing||[]).filter(m=>['QNS'].includes(m.symbol)).map(m=>m.symbol);
 sourceLine('chMarginQ',[['VNDirect · BCTC hợp nhất quý (data/company-quarterly.json)','https://dstock.vndirect.com.vn/']],qs.at(-1),'Biên gộp = lợi nhuận gộp ÷ doanh thu thuần theo quý, chỉ đọc từ bộ dữ liệu so sánh tài chính (không cập nhật riêng).'+(miss.length?' Không có '+miss.join(', ')+' trong bộ dữ liệu quý.':'')+'');
 const last=sym=>{const c=cos.find(x=>x.symbol===sym);if(!c)return null;const v=c.gross_margin.filter(x=>x!=null);return v.at(-1)};
 insight('chMarginQ','Biên gộp hàng tiêu dùng nhanh phản ánh giá nguyên liệu đã mua từ các quý trước và khả năng tăng giá bán. Kiểm tiếp biên gộp quý IV của SAB (trước thuế TTĐB 2027) và VNM khi sữa bột, đường đổi chiều.');
}
if(CQ?.quarters?.length&&document.getElementById('chInputLag')){
 const qk=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(0,4);
 const prevQ=(k,nq)=>{let qn=Number(k[1]),y=Number(k.slice(3));qn-=nq;while(qn<1){qn+=4;y-=1}return 'Q'+qn+'/'+y};
 const qavg=rs=>{const a={};rs.forEach(r=>{const k=qk(r.date);(a[k]=a[k]||[]).push(r.value)});return Object.fromEntries(Object.entries(a).map(([k,v])=>[k,v.reduce((x,y)=>x+y,0)/v.length]))};
 const items=[['Đường thô',C.gold,qavg(idx(S('sugar'),BASE))],['Dầu cọ',C.plum,qavg(idx(S('palm_oil'),BASE))],['Khô đậu nành',C.navy,qavg(idx(S('soymeal'),BASE))],['Ngô',C.teal,qavg(idx(S('corn'),BASE))]];
 const n=CQ.quarters.length,qs=CQ.quarters.slice(Math.max(0,n-12));
 const ser=items.map(([name,color,a])=>({name,color,kind:'line',values:qs.map(qq=>{const v=a[prevQ(qq,2)];return v==null?null:Math.round(v)})}));
 barLineChart('chInputLag',{categories:qs,series:ser,unit:'',digits:0,height:260,rotateLabels:true,zeroBase:false});
 legend('chInputLag',ser.map(x=>[x.name,x.color]));
 fillTable('tbl-input-lag',['Quý (biên gộp)','Quý nguyên liệu',...items.map(x=>x[0])],qs.map(qq=>[qq,prevQ(qq,2),...items.map(([,,a])=>nf(a[prevQ(qq,2)],0))]).reverse());
 sourceLine('chInputLag',[SRC.ice,['IMF qua FRED','https://fred.stlouisfed.org/']],qs.at(-1),'Mỗi quý trên trục là quý của biên gộp; giá trị vẽ là bình quân chỉ số nguyên liệu của quý trước đó 2 quý (độ trễ tồn kho và hợp đồng mua). Chỉ số T1/2024 = 100 nên quý trước 2024 trống. Giá sữa bột ở dashboard Sữa.');
 insight('chInputLag','Độ trễ 2 quý là giả định phân tích (tồn kho, hợp đồng mua), không phải quan hệ đã kiểm định: so hình dạng đường này với biên gộp bên cạnh để xem cơ chế có khớp. Để kiểm thật cần thêm tồn kho nguyên liệu, giá bán bình quân và cơ cấu sản phẩm từng doanh nghiệp.');
}

// ---------- 5. Bức tranh theo câu hỏi + Tài chính ngành (26/11/2026, mẫu Điện) ----------
// Số tài liệu ở đây đều có dòng trong data/retail/evidence.json (bl-13, bl-14, bl-15, bl-21, bl-23, bl-50, bl-60); số "tự tính" ghi rõ ở nhãn và bảng.
const LK={nsoQ3:['Cục Thống kê (NSO) · báo cáo quý III/2026','https://www.nso.gov.vn/bai-top/2026/10/bao-cao-tinh-hinh-kinh-te-xa-hoi-quy-iii-va-9-thang-nam-2026/'],vnp:['Cục Thống kê qua VietnamPlus','https://www.vietnamplus.vn/nguoi-tieu-dung-viet-manh-tay-chi-tieu-hon-5925-nghin-ty-dong-trong-9-thang-post1139808.vnp'],
 metric:['Metric qua Người Quan sát','https://nguoiquansat.vn/bo-tui-gan-292-000-ty-dong-sau-6-thang-thuong-mai-dien-tu-viet-nam-tang-toc-ngoai-suc-tuong-tuong-306108.html'],younet:['YouNet ECI qua VietnamPlus','https://www.vietnamplus.vn/doanh-thu-thi-truong-thuong-mai-dien-tu-viet-nam-ra-sao-trong-thoi-gian-qua-post1129441.vnp'],
 mwg9:['MWG qua TBTC 14/10/2026','https://thoibaotaichinhvietnam.vn/doanh-thu-9-thang-cua-the-gioi-di-dong-tang-30-dat-gan-148-000-ty-dong-205356.html'],dmx:['MWG qua TTTC-TT','https://thitruongtaichinhtiente.vn/dien-may-xanh-tien-sat-moc-doanh-thu-100-000-ty-dong-sau-9-thang-86085.html'],
 frt9:['FRT qua DN&PL 29/10/2026','https://doanhnhan.baophapluat.vn/fpt-retail-ghi-nhan-doanh-thu-48-273-ty-dong-sau-9-thang-tang-33-so-voi-cung-ky.html'],msn:['Masan qua DN&PL','https://doanhnhan.baophapluat.vn/masan-group-msn-bao-lai-ky-luc-3-800-ty-dong-quy-ii-2026-tu-tin-nang-chi-tieu-kinh-doanh-ca-nam.html'],
 pnj9:['PNJ qua TTTC-TT 22/10/2026','https://thitruongtaichinhtiente.vn/pnj-lo-gan-258-ty-dong-trong-quy-iii-ton-kho-vuot-18-800-ty-dong-86712.html'],vama:['VAMA qua VietnamPlus','https://www.vietnamplus.vn/doanh-so-ban-oto-tai-viet-nam-tang-38-xe-hybrid-tang-toc-post1141084.vnp'],
 vov:['VOV 11/10/2026','https://vov.vn/thi-truong/gia-vang-hom-nay-1110-vang-trong-nuoc-di-ngang-post1340142.vov'],ttdb:['VnEconomy · Luật Thuế TTĐB 2025','https://vneconomy.vn/thue-tieu-thu-dac-biet-ruou-va-bia-tang-den-90-vao-nam-2031.htm'],
 cq:['BCTC hợp nhất quý (VNDirect, Stock Analysis · data/company-quarterly.js)','https://dstock.vndirect.com.vn/']};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Thanh xếp chồng ngang bằng HTML: các phần cộng về tổng; nhãn ngắn, đọc được trên điện thoại.
function stackBar(id,parts,{unit='',digits=1,total=null,note=''}={}){
 const host=document.getElementById(id);if(!host)return;const sum=total??parts.reduce((a,p)=>a+p.value,0);
 const bar=parts.map(p=>`<span class="rf-seg" style="flex:${p.value} 1 0;background:${p.color}" title="${esc(p.label)}: ${nf(p.value,digits)} ${esc(unit)} (${nf(p.value/sum*100,1)}%)">${p.value/sum>=.08?nf(p.value/sum*100,0)+'%':''}</span>`).join('');
 const rows=parts.map(p=>`<li><i style="background:${p.color}"></i><span>${esc(p.label)}${p.self?' <em>(tự tính)</em>':''}</span><b>${nf(p.value,digits)}${unit?' '+esc(unit):''}</b><small>${unit==='%'?'':nf(p.value/sum*100,1)+'%'}${p.extra?(unit==='%'?'':' · ')+esc(p.extra):''}</small></li>`).join('');
 host.innerHTML=`<div class="rf-stack" role="img" aria-label="${esc(parts.map(p=>p.label+' '+nf(p.value/sum*100,0)+'%').join(', '))}">${bar}</div><ul class="rf-stack-l">${rows}</ul>${note?`<div class="rf-stack-n">${note}</div>`:''}`;
}
// Khối vẽ bằng HTML (thanh xếp chồng, ô số, dòng thời gian) không nằm trong bộ chọn chart của chart-source.js → tự ghi dòng "Nguồn:" hiện sẵn.
function pwSrc(id,parts){const card=document.getElementById(id)?.closest('.card');if(!card||card.querySelector(':scope>.pw-src'))return;const n=make('div','pw-src');n.append('Nguồn: ');parts.forEach(([name,url],i)=>{if(i)n.append('; ');const a=make('a','',name);a.href=url;a.target='_blank';a.rel='noopener';n.append(a)});card.append(n)}
function tiles(id,items){const host=document.getElementById(id);if(!host)return;host.classList.add('rf-tiles');host.innerHTML=items.map(([k,v,s,cls])=>`<div class="rf-tile${cls?' '+cls:''}"><small>${esc(k)}</small><b>${esc(v)}</b><span>${esc(s)}</span></div>`).join('')}
// Toàn ngành: tăng trưởng so cùng kỳ hai phạm vi
if(rt.length&&document.getElementById('chRetailYoY')){
 const gm=byMonth(rg),rs=rt.filter(r=>Number.isFinite(yoyAt(rt,r))).slice(-36);
 barLineChart('chRetailYoY',{categories:rs.map(r=>mon(r.date)),series:[{name:'Tổng mức bán lẻ HH & DVTD',color:C.navy,kind:'line',values:rs.map(r=>yoyAt(rt,r))},{name:'Riêng bán lẻ hàng hóa',color:C.teal,kind:'line',values:rs.map(r=>{const g=gm[ym(r.date)];return g?yoyAt(rg,g):null})}],unit:'%',digits:1,height:260,rotateLabels:true,zeroBase:false});
 legend('chRetailYoY',[['Tổng mức bán lẻ HH & DVTD',C.navy],['Riêng bán lẻ hàng hóa',C.teal]]);
 fillTable('tbl-retail-yoy',['Tháng','Tổng mức YoY','Hàng hóa YoY','Tổng mức lũy kế YoY'],rs.slice().reverse().map(r=>{const g=gm[ym(r.date)],y=r.date.slice(0,4),m=r.date.slice(5,7),p=ytdSum(rt,String(y-1),m);return [mon(r.date),signed(yoyAt(rt,r),1)+'%',signed(g?yoyAt(rg,g):null,1)+'%',p?signed((ytdSum(rt,y,m)/p-1)*100,1)+'%':'—']}));
 sourceLine('chRetailYoY',[SRC.nso],mon(rt.at(-1).date),'Tự tính so cùng tháng năm trước từ số tháng NSO (giá hiện hành). NSO điều chỉnh số tháng trước khi công bố tháng sau nên tỷ lệ tháng gần nhất có thể đổi. Chưa có chuỗi tháng loại trừ yếu tố giá.');
 insight('chRetailYoY','Khoảng cách giữa hai đường cho biết dịch vụ (ăn uống, du lịch) đang tăng nhanh hay chậm hơn hàng hóa, tức phần nào của sức mua chảy vào chuỗi bán lẻ niêm yết. Kiểm tiếp liệu đà tăng danh nghĩa có giữ được khi CPI và thuế gián thu cùng tăng từ 1/2027.');
}
if(document.getElementById('chRetailMix')){
 stackBar('chRetailMix',[{label:'Bán lẻ hàng hóa',value:4463.6,color:C.navy,extra:'+12,8%'},{label:'Lưu trú, ăn uống',value:758.6,color:C.teal,extra:'+16,7%'},{label:'Dịch vụ khác',value:625.4,color:C.grey,extra:'+13,4%'},{label:'Du lịch lữ hành',value:78.1,color:C.plum,extra:'+17,9%'}],{unit:'nghìn tỷ',total:5925.7,note:'Tổng 5.925,7 nghìn tỷ = Σ bốn cấu phần (đã đối chiếu). % tổng là tự tính.'});
 pwSrc('chRetailMix',[LK.vnp]);
 sourceLine('chRetailMix',[LK.vnp],'9T/2026','Bốn cấu phần do NSO công bố, kể cả "dịch vụ khác" (không tính bằng phần dư). Thương mại điện tử là kênh bán, trùng một phần với bán lẻ hàng hóa nên tách sang chart riêng.',false);
 insight('chRetailMix','Lưu trú, ăn uống và du lịch tăng nhanh hơn hàng hóa, nghĩa là phần tiền tăng thêm đang nghiêng về dịch vụ hơn là chuỗi bán hàng hóa. Kiểm tiếp cơ cấu cả năm và tốc độ bán lẻ hàng hóa so với doanh thu cùng cửa hàng của MWG, FRT.');
}
// Bán lẻ hiện đại: mạng lưới, năng suất, SSSG
if(document.getElementById('chStores')){
 hbarCompare('chStores',{items:[{label:'WinCommerce · Q2',value:5141,color:C.plum},{label:'Bách Hóa Xanh · T9',value:3904,color:C.navy},{label:'Long Châu · Q3',value:2741,color:C.teal},{label:'Điện Máy Xanh · T9',value:1998,color:C.navy},{label:'TGDĐ · T9',value:919,color:C.navy},{label:'FPT Shop · Q3',value:622,color:C.teal},{label:'An Khang · T9',value:438,color:C.navy},{label:'PNJ · Q3',value:424,color:C.gold},{label:'EraBlue (Indonesia) · T9',value:337,color:C.grey},{label:'Tiêm chủng LC · Q3',value:244,color:C.teal}],unit:'điểm',digits:0,labelW:190,ariaLabel:'Số điểm bán của các chuỗi'});
 legend('chStores',[['MWG',C.navy],['FRT',C.teal],['MSN',C.plum],['PNJ',C.gold],['Nước ngoài',C.grey]]);
 sourceLine('chStores',[LK.mwg9,LK.dmx,LK.frt9,LK.msn,LK.pnj9],'30/9/2026 (WinCommerce 30/6/2026)','Số cuối kỳ doanh nghiệp công bố. Long Châu = nhà thuốc; Tiêm chủng LC = trung tâm tiêm chủng Long Châu. Long Châu tách nhà thuốc và trung tâm tiêm chủng; EraBlue là chuỗi ở Indonesia, không thuộc thị trường Việt Nam.',false);
 insight('chStores','Bách hóa và nhà thuốc vẫn mở thêm trong khi điện máy, điện thoại, trang sức đứng yên hoặc thu hẹp, nên tăng trưởng hai nhóm đến từ hai nguồn khác nhau. Kiểm tiếp số cửa hàng WinCommerce quý III và số đóng, mở của PNJ cuối năm.');
}
if(document.getElementById('chStoreRev')){
 const P=C.navy,O='#9aa3c7';
 hbarCompare('chStoreRev',{items:[{label:'○ PNJ bán lẻ · 9T',value:4.53,color:O},{label:'○ ĐMX+TGDĐ (VN) · 9T',value:3.50,color:O},{label:'● FPT Shop · Q3',value:3.0,color:P},{label:'○ EraBlue · 9T',value:1.53,color:O},{label:'○ Bách Hóa Xanh · 9T',value:1.31,color:O},{label:'● Long Châu · 9T',value:1.3,color:P},{label:'○ WinCommerce · Q2',value:0.75,color:O}],unit:'tỷ',digits:1,labelW:200,ariaLabel:'Doanh thu bình quân mỗi cửa hàng mỗi tháng'});
 legend('chStoreRev',[['● Doanh nghiệp công bố',P],['○ Tự tính, mẫu số = cửa hàng cuối kỳ',O]]);
 sourceLine('chStoreRev',[LK.frt9,LK.mwg9,LK.dmx,LK.pnj9,LK.msn],'9T/2026 (FPT Shop Q3, WinCommerce Q2)','Tự tính = doanh thu kỳ ÷ số cửa hàng cuối kỳ ÷ số tháng. Chuỗi mở mới nhanh (Bách Hóa Xanh, EraBlue, WinCommerce) bị tính thấp hơn thực vì cửa hàng mở giữa kỳ chưa bán đủ tháng. ĐMX Việt Nam = khối ĐMX trừ doanh thu EraBlue. An Khang (>0,55 tỷ, T11/2025) quá cũ nên không vẽ.',false);
 insight('chStoreRev','Điện máy – điện thoại bán nhiều gấp 2–3 lần mỗi cửa hàng so với bách hóa và nhà thuốc, nên cùng mức tăng doanh thu, chuỗi bách hóa phải mở nhiều điểm hơn và gánh chi phí thuê, nhân công lớn hơn. Kiểm tiếp biên gộp và chi phí bán hàng/doanh thu của MWG (Bách Hóa Xanh), FRT (Long Châu), MSN (WinCommerce) để xem mở mới có giữ được hiệu quả.');
}
if(document.getElementById('chSssg')){
 barLineChart('chSssg',{categories:['Khối Điện Máy Xanh','EraBlue (Indonesia)'],series:[{name:'Doanh thu 9T YoY',color:C.navy,values:[29,86]},{name:'Doanh thu cùng cửa hàng (SSSG)',color:C.teal,values:[30,13]}],unit:'%',digits:0,height:240,rotateLabels:false});
 legend('chSssg',[['Doanh thu 9T so cùng kỳ',C.navy],['SSSG',C.teal]]);
 sourceLine('chSssg',[LK.mwg9,LK.dmx],'9T/2026','Số doanh nghiệp công bố. EraBlue tăng theo Rupiah. Khối Điện Máy Xanh gồm EraBlue. Chưa có SSSG và số cửa hàng bình quân của Long Châu, Bách Hóa Xanh, FPT Shop, WinCommerce nên chưa dựng được cầu nối mở mới / cửa hàng hiện hữu cho các chuỗi này.',false);
 insight('chSssg','Khối Điện Máy Xanh tăng nhờ cửa hàng hiện hữu (số cửa hàng trong nước còn giảm nhẹ), còn EraBlue tăng chủ yếu nhờ mở mới. Kiểm tiếp SSSG quý IV khi nền so sánh cao dần và biên gộp EraBlue khi chuỗi còn non.');
}
const CQ_=window.COMPANY_QUARTERLY;
const cqRow=s=>CQ_?.companies?.find(c=>c.symbol===s&&c.sector==='retail');
if(CQ_?.quarters?.length&&gS.length&&document.getElementById('chPnjGold')){
 const n=CQ_.quarters.length,from=Math.max(0,n-12),qs=CQ_.quarters.slice(from),p=cqRow('PNJ');
 const qk=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(0,4),qa={};gS.forEach(r=>{(qa[qk(r.date)]=qa[qk(r.date)]||[]).push(r.value)});
 const avg=k=>qa[k]?qa[k].reduce((a,b)=>a+b,0)/qa[k].length:null,prev=k=>'Q'+k[1]+'/'+(Number(k.slice(3))-1);
 const gy=qs.map(k=>{const a=avg(k),b=avg(prev(k));return a&&b?(a/b-1)*100:null});
 if(p){
  barLineChart('chPnjGold',{categories:qs,series:[{name:'Biên gộp PNJ',color:C.gold,kind:'line',values:p.gross_margin.slice(from)},{name:'Giá SJC bình quân quý, so cùng kỳ',color:C.plum,kind:'line',values:gy}],unit:'%',digits:1,height:260,rotateLabels:true,zeroBase:true});
  legend('chPnjGold',[['Biên gộp PNJ',C.gold],['Giá SJC so cùng kỳ',C.plum]]);
  fillTable('tbl-pnj-gold',['Quý','Biên gộp PNJ (%)','Doanh thu PNJ (tỷ)','SJC bình quân quý (triệu/lượng)','SJC so cùng kỳ (%)','Số điểm giá trong quý'],qs.map((k,i)=>[k,nf(p.gross_margin[from+i],1),nf(p.revenue[from+i],0),avg(k)?nf(avg(k)/1000,1):'—',signed(gy[i],1),qa[k]?.length??0]).reverse());
  sourceLine('chPnjGold',[LK.cq,['WiData · Vàng SJC','https://widata.vn/']],qs.at(-1),'SJC bình quân quý = trung bình các điểm cuối tháng WiData trong quý (chuỗi bắt đầu T1/2024 nên so cùng kỳ có từ 2025). Biên gộp Q2–Q3/2026 gồm dự phòng thu đổi kim cương và tỷ trọng vàng 24K biên thấp tăng.',false);
  insight('chPnjGold','Khi giá vàng tăng nhanh, tỷ trọng vàng 24K biên thấp tăng và giá vốn tồn kho lệch với giá bán, nên biên gộp PNJ có thể giảm dù doanh thu tăng. Kiểm tiếp cơ cấu trang sức/vàng 24K và dự phòng thu đổi trong BCTC quý IV.');
 }
}
if(document.getElementById('chGoldGap')){
 hbarCompare('chGoldGap',{items:[{label:'SJC miếng, bán ra',value:144.8,color:C.gold},{label:'Nhẫn SJC, bán ra',value:144.3,color:C.plum},{label:'Thế giới quy đổi (bài nguồn)',value:131.7,color:C.grey},{label:'Thế giới quy đổi (tự tính)',value:130.5,color:'#9aa3c7'}],unit:'triệu/lượng',digits:1,labelW:200,ariaLabel:'Giá vàng trong nước và thế giới quy đổi ngày 11/10/2026'});
 sourceLine('chGoldGap',[LK.vov],'11/10/2026','Một ngày đã đối chiếu, không phải chuỗi. Tự tính: 4.152 USD/oz × 26.070 đ/USD × 1,2057 oz/lượng = 130,5; bài nguồn ghi 131,7 (chênh 1,2 triệu, bài không nêu cách quy đổi). Chênh SJC − thế giới: +13,1 (bài) hoặc +14,3 (tự tính).',false);
 insight('chGoldGap','Chênh lệch trong nước – thế giới là phần PNJ trả thêm khi mua vàng nguyên liệu trong nước; nếu được nhập vàng (Nghị định 232/2025), chênh lệch thu hẹp giúp biên trang sức nhưng giảm lãi mảng vàng 24K. Kiểm tiếp quyết định cấp phép nhập khẩu vàng cho PNJ và chuỗi XAU/USD, tỷ giá theo ngày để dựng chuỗi chênh lệch.');
}
// Chính sách: timeline thẻ sự kiện + lộ trình thuế suất
const POLICY=[
 {d:'2025-02-18',name:'QĐ 01/2025/QĐ-TTg',st:'Đã ban hành',what:'Áp VAT với hàng nhập khẩu dưới 1 triệu đồng qua chuyển phát nhanh',who:'MWG · FRT · DGW',v:'Giá bán tương đối so với hàng xuyên biên giới',url:'https://vneconomy.vn/hang-hoa-tren-cac-san-thuong-mai-co-kha-nang-tang-gia-sau-chinh-sach-ngung-mien-thue-nhap-khau.htm'},
 {d:'2025-10-10',name:'Nghị định 232/2025 (sửa NĐ 24)',st:'Đã ban hành',what:'Bỏ độc quyền sản xuất vàng miếng; doanh nghiệp đủ điều kiện được sản xuất, nhập khẩu vàng',who:'PNJ',v:'Giá vốn vàng nguyên liệu, chênh lệch trong nước – thế giới',url:'https://vov.vn/thi-truong/gia-vang/chinh-thuc-xoa-bo-co-che-nha-nuoc-doc-quyen-san-xuat-vang-mieng-post1236837.vov'},
 {d:'2026-01-01',name:'Lương tối thiểu vùng (NĐ 293/2025)',st:'Đã ban hành',what:'+7,2%; vùng I 5.310.000 đ/tháng',who:'Cả ngành',v:'Sức mua · chi phí nhân công chuỗi',url:'https://nhadautu.vn/chinh-thuc-tang-luong-toi-thieu-vung-tu-1-1-2026-d100632.html'},
 {d:'2026-07-01',name:'Luật Thương mại điện tử',st:'Đã ban hành',what:'Nền tảng nước ngoài không hiện diện phải ký quỹ; định danh người livestream',who:'MWG · FRT · DGW',v:'Cạnh tranh giá online',url:'https://baodauthau.vn/8-noi-dung-moi-noi-bat-cua-luat-thuong-mai-dien-tu-post191869.html'},
 {d:'2026-07-01',name:'Lương cơ sở (NĐ 161/2026)',st:'Đã ban hành',what:'2,34 → 2,53 triệu đồng',who:'Cả ngành',v:'Sức mua khu vực công',url:'https://nhadautu.vn/chinh-thuc-tang-luong-co-so-len-253-trieu-dong-tu-ngay-1-7-d105043.html'},
 {d:'2026-07-01',name:'Dự thảo sửa NĐ 24 vòng 2',st:'Dự thảo',what:'Bỏ giấy phép con với vàng trang sức (dự kiến, chưa xác nhận ban hành)',who:'PNJ',v:'Chi phí tuân thủ, cạnh tranh trang sức',url:'https://vietnamfinance.vn/sua-doi-nghi-dinh-24-nhieu-thay-doi-ve-san-xuat-kinh-doanh-vang-trang-suc-d145528.html'},
 {d:'2026-12-31',name:'Hết giảm 2% VAT (NQ Quốc hội 17/6/2025)',st:'Đã ban hành',what:'Từ 1/1/2027 nhiều hàng hóa, dịch vụ trở lại 10%',who:'Cả ngành',v:'Giá bán cuối cùng, sức mua',url:'https://baodauthau.vn/quoc-hoi-thong-qua-giam-2-thue-vat-voi-nhieu-hang-hoa-dich-vu-den-het-nam-2026-post180339.html'},
 {d:'2027-01-01',name:'TTĐB nước giải khát có đường',st:'Đã ban hành',what:'Đường >5 g/100 ml: 8% từ 2027, 10% từ 2028',who:'MSN · QNS',v:'Giá bán, sản lượng nước giải khát',url:'https://vneconomy.vn/thue-tieu-thu-dac-biet-ruou-va-bia-tang-den-90-vao-nam-2031.htm'}];
const pt=document.getElementById('policyTimeline');
if(pt){
 const today=new Date().toISOString().slice(0,10),dd=d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4);
 pt.innerHTML='<ol class="rf-tl">'+POLICY.slice().sort((a,b)=>a.d<b.d?-1:1).map(p=>`<li class="${p.st==='Dự thảo'?'draft':''} ${p.d<today?'past':'next'}"><time datetime="${p.d}">${p.d==='2030-12-31'?'đến 31/12/2030':p.d==='2026-12-31'?'hết 31/12/2026':dd(p.d)}</time><div class="rf-ev"><div class="rf-ev-h"><b>${esc(p.name)}</b><span class="rf-st${p.st==='Dự thảo'?' draft':''}">${p.st==='Dự thảo'?'○ ':'● '}${esc(p.st)}</span></div><p>${esc(p.what)}</p><dl><dt>Doanh nghiệp</dt><dd>${esc(p.who)}</dd><dt>Biến cần theo dõi</dt><dd>${esc(p.v)}</dd></dl><a href="${p.url}" target="_blank" rel="noopener">Nguồn ↗</a></div></li>`).join('')+'</ol>';
 pwSrc('policyTimeline',[['Văn bản và bài nguồn ở từng thẻ','#rf-q-docs']]);
 pt.after(make('div','source-note','Mốc là ngày hiệu lực; "hết 31/12/2026" là ngày cuối còn hiệu lực. Thuế TTĐB bia, lệ phí trước bạ ô tô ở dashboard Bia, Ô tô – Xe máy.'));
}
// Tài chính ngành: Σ theo nhóm (không trùng sở hữu giữa các mã trong rổ)
const FG=[['Bán lẻ hiện đại & điện máy',['MWG','FRT','DGW','PET'],C.navy],['Trang sức',['PNJ'],C.gold],['Hàng tiêu dùng nhanh',['MSN','KDC'],C.plum]];
if(CQ_?.quarters?.length&&document.getElementById('chFinRev')){
 const n=CQ_.quarters.length,from=Math.max(0,n-12),qs=CQ_.quarters.slice(from);
 const sum=(syms,k,i)=>{let s=0;for(const x of syms){const v=cqRow(x)?.[k]?.[i];if(!Number.isFinite(v))return null;s+=v}return s};
 const G=FG.map(([name,syms,color])=>({name,syms:syms.filter(cqRow),color}));
 const ser=(k,div=1000)=>G.map(g=>({name:g.name,color:g.color,values:qs.map((_,j)=>{const v=sum(g.syms,k,from+j);return v==null?null:v/div})}));
 const mser=k=>G.map(g=>({name:g.name,color:g.color,kind:'line',values:qs.map((_,j)=>{const a=sum(g.syms,'revenue',from+j),b=sum(g.syms,k,from+j);return a>0&&b!=null?b/a*100:null})}));
 const mk=(host,opts,fn)=>{if(!host)return;host.innerHTML='';host.classList.add('rf-ctl');opts.forEach(([v,l],i)=>{const b=make('button','rf-tog'+(i?'':' on'),l);b.type='button';b.addEventListener('click',()=>{[...host.children].forEach(x=>x.classList.toggle('on',x===b));fn(v)});host.append(b)});fn(opts[0][0])};
 mk(document.getElementById('finGroupCtl'),[['revenue','Doanh thu thuần'],['net_income','Lợi nhuận sau thuế']],k=>barLineChart('chFinRev',{categories:qs,series:ser(k),unit:'nghìn tỷ',digits:1,height:260,rotateLabels:true,stackable:true}));
 legend('chFinRev',G.map(g=>[g.name+' ('+g.syms.join(', ')+')',g.color]));
 fillTable('tbl-fin-rev',['Quý',...G.map(g=>g.name+' · DT (tỷ)'),...G.map(g=>g.name+' · LNST (tỷ)')],qs.map((q,j)=>[q,...G.map(g=>nf(sum(g.syms,'revenue',from+j),0)),...G.map(g=>nf(sum(g.syms,'net_income',from+j),0))]).reverse());
 sourceLine('chFinRev',[LK.cq],qs.at(-1),'Cộng BCTC hợp nhất quý của các mã trong rổ; không có công ty mẹ – con trùng nhau giữa các mã (WinCommerce đã nằm trong MSN, Long Châu trong FRT, Bách Hóa Xanh trong MWG). QNS chưa có BCTC quý trong bộ dữ liệu nên chưa vào rổ. Thiếu số của một mã thì để trống quý đó. Lợi nhuận sau thuế theo định nghĩa nguồn (hợp nhất).',false);
 insight('chFinRev','Doanh thu cho thấy quy mô, lợi nhuận cho thấy nhóm nào đang chuyển doanh thu thành lãi; nhóm Hàng lâu bền bị kéo xuống bởi dự phòng thu đổi của PNJ. Kiểm tiếp quý IV (mùa cao điểm) và phần dự phòng còn lại của PNJ.');
 const mctl=make('div','rf-ctl');document.getElementById('chFinMargin')?.before(mctl);
 mk(mctl,[['gross_profit','Biên gộp'],['net_income','Biên ròng']],k=>barLineChart('chFinMargin',{categories:qs,series:mser(k),unit:'%',digits:1,height:260,rotateLabels:true,zeroBase:false}));
 legend('chFinMargin',G.map(g=>[g.name,g.color]));
 fillTable('tbl-fin-margin',['Quý',...G.map(g=>g.name+' · biên gộp (%)'),...G.map(g=>g.name+' · biên ròng (%)')],qs.map((q,j)=>{const m=(g,k)=>{const a=sum(g.syms,'revenue',from+j),b=sum(g.syms,k,from+j);return a>0&&b!=null?nf(b/a*100,1):'—'};return [q,...G.map(g=>m(g,'gross_profit')),...G.map(g=>m(g,'net_income'))]}).reverse());
 sourceLine('chFinMargin',[LK.cq],qs.at(-1),'Biên nhóm = Σ lãi gộp (hoặc lãi ròng) ÷ Σ doanh thu thuần của cùng rổ, cùng quý — không lấy bình quân biên từng mã. Cấp hợp nhất doanh nghiệp, không phải cấp mảng.',false);
 insight('chFinMargin','Biên gộp hàng tiêu dùng nhanh cao gấp đôi bán lẻ nhưng nhạy với giá nguyên liệu và thuế; bán lẻ hiện đại biên mỏng nên lãi đi theo chi phí vận hành mỗi cửa hàng. Kiểm tiếp biên gộp quý IV của nhóm tiêu dùng nhanh khi đường, sữa bột tăng lại.');
}
{const g=document.querySelector('[data-block-id="bl-23"] .rf-tiles');if(g){g.id='goldTiles';pwSrc('goldTiles',[LK.vov])}}
window.RETAIL_POLICY=POLICY;

// ---------- 4. KPIs, quick read, catalyst brief ----------
const rL=rt.at(-1),cL=cpi.at(-1),tL=tour.at(-1),caL=car.at(-1),bL=beer.at(-1),sL=sugar.at(-1),rs220=sec['220']?.records||[],v220=rs220.at(-1),v239=(sec['239']?.records||[]).at(-1);
const rtY=ytdYo(rt),rtM=yoyAt(rt,rL),tY=ytdYo(tour),caY=ytdYo(car),beY=ytdYo(beer),suY=yoyAt(sugar,sL),dpY=yoyAt(dep,dep.at(-1)),ipB=iipB.at(-1)?.value;
kpi('spk-retail',rL?nf(rL.value/1000,0):'—',rL?'nghìn tỷ · '+mon(rL.date):'—',rL?signed(rtM,0)+'% so cùng kỳ · lũy kế '+signed(rtY,0)+'%':'',rt.slice(-12).map(r=>r.value));
kpi('spk-cpi',cL?nf(cL.value,2)+'%':'—',cL?'CPI so cùng kỳ · '+mon(cL.date):'—',cpi.length>12?'cùng kỳ '+nf(cpi[cpi.length-13].value,2)+'%':'',cpi.slice(-12).map(r=>r.value),C.red);
kpi('spk-tourist',tL?nf(tL.value/1000,2):'—',tL?'triệu lượt · '+mon(tL.date):'—',tL?'lũy kế '+signed(tY,0)+'%':'',tour.slice(-12).map(r=>r.value),C.teal);
kpi('spk-pe',v220?nf(v220[1],1)+'x':'—',v220?'P/E chuỗi bán lẻ · '+short(v220[0]):'—',v239?'Sữa '+nf(v239[1],1)+'x':'',rs220.slice(-30).map(r=>r[1]),C.grey);
const quick=document.querySelector('.hero .insight');
if(quick&&rL){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu công khai: '),`Tổng mức bán lẻ ${mon(rL.date)} ${nf(rL.value/1000,0)} nghìn tỷ (${signed(rtM,0)}%, lũy kế ${signed(rtY,0)}%). CPI ${nf(cL?.value,1)}%. Khách quốc tế lũy kế ${signed(tY,0)}%. Đường thô ${signed(suY,0)}% YoY. P/E chuỗi bán lẻ ${v220?nf(v220[1],1):'—'}x.`);
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
 headline:'Sức mua '+(rtY==null?'thiếu số':rtY>10?'mạnh nhất từ 2022':rtY>6?'tăng vừa':'yếu đi')+' · Chọn chuỗi đang tăng trưởng: MWG, FRT · Tránh bia, đồ uống có đường trước thuế 1/1/2027 · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Bán lẻ hiện đại & điện máy','MWG · FRT · DGW · PET',rtY!=null&&rtY>10?'up':'flat','Bán lẻ '+signed(rtY,0)+'%'],['Hàng lâu bền','PNJ · HAX · SVC',caY!=null&&caY>10?'up':'flat','Ô tô '+signed(caY,0)+'%'],['Hàng tiêu dùng nhanh','VNM · SAB · QNS · MSN · KDC',beY!=null&&beY>8?'up':'flat','Bia '+signed(beY,0)+'%']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['11/11 · 27/11 · 12/12','Mùa khuyến mãi online: MWG, FRT, DGW'],['31/12/2026','Hết giảm VAT 2% — giá bán +2 điểm từ 1/1/2027'],['01/01/2027','Thuế TTĐB: bia 70%, nước giải khát có đường 8% (SAB, QNS, MSN, VNM)'],['17/02/2027','Tết Đinh Mùi — doanh thu Tết rơi trọn Q1/2027; Thần Tài ~26/02'],['Đầu tháng','NSO: bán lẻ, CPI, khách quốc tế, sản lượng'],['Giữa tháng','VAMA, VAMM doanh số xe; MWG, FRT, PNJ báo tháng']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ nguồn công khai lúc '+new Date(W.built_at).toLocaleString('vi-VN')+' (NSO, NHNN, FRED, ICE, VNDirect)'+(W.wi_filled?.length?'; WiData lấp: '+W.wi_filled.join(', '):'')+'.';
})();
