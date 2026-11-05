/* Construction dashboard (Xây dựng · VLXD · Đầu tư công): value chain, Đầu tư công / Xi măng / Đá & cát / Nhựa đường / Kính & gạch / Xây dựng & hạ tầng panes
   and sector valuation from window.CONSTRUCTION_PUBLIC (scripts/build_sector_public.py: public commodity series only).
   Document figures sit in the HTML tables and are backed by data/construction/evidence.json.
   Publishes window.CONSTRUCTION_BRIEF for catalyst-board.js. Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='construction')return;
const W=window.CONSTRUCTION_PUBLIC||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const qtr=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],sbv:['Ngân hàng Nhà nước','https://www.sbv.gov.vn/'],customs:['Hải quan Việt Nam','https://www.customs.gov.vn/'],moc:['Sở Xây dựng (công bố giá)','https://moc.gov.vn/'],wi:['Nguồn công khai',null]};
for(const v of Object.values(macro)){if(/nso\.gov\.vn\/wp-content/.test(v.url||'')&&SRC.nso)SRC.nso=[SRC.nso[0],v.url];if(/customs/.test(v.url||'')&&SRC.customs)SRC.customs=[SRC.customs[0],v.url]}
const S=k=>macro[k]?.records||com[k]?.records||[];
const ym=d=>d.slice(0,7);
const byMonth=rs=>{const m={};rs.forEach(r=>{m[ym(r.date)]=r});return m};
const yoyAt=(rs,r)=>{if(!r)return null;const p=rs.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};
const ytdSum=(rs,y,m)=>rs.filter(r=>r.date.slice(0,4)===y&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0);
const ytdYo=rs=>{const l=rs.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),p=ytdSum(rs,String(y-1),m);return p?(ytdSum(rs,y,m)/p-1)*100:null};
const idx=(rs,base)=>{const b=rs.find(r=>r.date.slice(0,7)>=base);return b&&b.value?rs.map(r=>({date:r.date,value:r.value/b.value*100})):[]};

// ---------- 1. Value chain ----------
const chain=document.querySelector('[data-block-id="xd-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='11/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['input',25,165,['Nguyên liệu','đá vôi · than · nhựa · cát']],
  ['cement',315,40,['Xi măng','HT1 · BCC']],['stone',315,165,['Đá, cát, nhựa đường','VLB · KSB · DHA · PLC']],['glass',315,290,['Kính, gạch, sứ','VGC']],
  ['civil',605,40,['Xây dựng dân dụng','CTD · HBC · FCN · DPG']],['infra',605,165,['Hạ tầng & BOT','VCG · C4G · LCG · HHV · CII · HUT']],['export',605,290,['Xuất khẩu','clinker · xi măng']],
  ['private',895,40,['BĐS & nhà xưởng','nhà ở · KCN · FDI']],['public',895,165,['Đầu tư công','cao tốc · sân bay · đường sắt']],['fund',895,290,['Nguồn vốn','NSNN · tín dụng · trái phiếu']]
 ];
 const edges=[['input','cement'],['input','stone'],['input','glass'],['cement','civil'],['stone','infra'],['cement','export',true],['private','civil',true],['public','infra',true],['fund','public',true]];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b];let d;
  if(A[2]===Bn[2]){const fw=Bn[1]>A[1];d=`M${A[1]+(fw?w:0)} ${A[2]+h/2} H${Bn[1]+(fw?0:w)}`}
  else if(A[1]===Bn[1]){d=`M${A[1]+w/2} ${A[2]+(Bn[2]>A[2]?h:0)} V${Bn[2]+(Bn[2]>A[2]?0:h)}`}
  else{const fw=Bn[1]>A[1],x1=A[1]+(fw?w:0),y1=A[2]+h/2,x2=Bn[1]+(fw?0:w),y2=Bn[2]+h/2,mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`}
  return `<path d="${d}" class="chain-edge${dashed?' dashed':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t.replace(/&/g,'&amp;')}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1140 375" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành xây dựng và vật liệu xây dựng</title><desc id="chain-desc">Nguyên liệu vào thép, xi măng, đá; vật liệu bán cho nhà thầu dân dụng và hạ tầng; cầu đến từ bất động sản, nhà xưởng và đầu tư công, vốn từ ngân sách và tín dụng.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: đầu tư công là cầu đi trước — vốn NSNN giải ngân đến nhà thầu hạ tầng trước, rồi kéo đá, nhựa đường, xi măng theo khối lượng thi công 1–3 quý sau. Nhà thầu dân dụng sống theo chu kỳ BĐS và nhà xưởng FDI. Vật liệu có biên theo chênh lệch giá bán với nguyên liệu (thép: quặng, than cốc; xi măng: than; nhựa đường: dầu); nhà thầu ăn biên mỏng và chịu rủi ro phải thu.'));
 figure.after(make('div','source-note','Mũi tên liền: dòng vật liệu · Mũi tên đứt: nguồn cầu và vốn. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Panes ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead'),children=[...section.children].filter(e=>e!==head);
 const labels=['Đầu tư công','Xi măng','Đá & cát','Nhựa đường','Kính & gạch','Xây dựng & hạ tầng'],ids=['supply-world','supply-vietnam','supply-trade','supply-asphalt','supply-glass','supply-build'];
 const panes=ids.map(id=>{const p=make('div','supply-pane');p.id=id;return p});
 let cur=panes[0];children.forEach(e=>{if(e.matches('h3.subhead')){cur=panes[labels.indexOf(e.textContent.trim())];e.remove();return}cur.append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Nhóm');
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

// Xi măng & VLXD
const cem=S('cement_output'),cexp=S('cement_export'),iipN=S('iip_nonmetal');
if(iipN.length&&document.getElementById('chIipNon')){
 const rs=iipN.slice(-24);
 barLineChart('chIipNon',{categories:rs.map(r=>mon(r.date)),series:[{name:'IIP khoáng phi kim',color:C.teal,values:rs.map(r=>r.value)}],unit:'%',digits:1,height:260,rotateLabels:true});
 fillTable('tbl-iip-non',['Tháng','YoY'],iipN.slice().reverse().map(r=>[mon(r.date),signed(r.value,1)+'%']));
 sourceLine('chIipNon',[SRC.nso],mon(iipN.at(-1).date),'Chỉ số sản xuất sản phẩm từ khoáng phi kim, % so cùng kỳ. NSO không tách riêng kính, gạch.');
 insight('chIipNon','Tháng gần nhất '+signed(iipN.at(-1).value,0)+'%. Đây là chỉ báo gần nhất cho kính, gạch vì không có chuỗi sản lượng riêng; chuỗi gộp cả xi măng.');
}
if(cem.length&&document.getElementById('chCement')){
 const rs=cem.slice(-36);
 barLineChart('chCement',{categories:rs.map(r=>mon(r.date)),series:[{name:'Xi măng',color:C.navy,values:rs.map(r=>r.value)}],unit:'triệu tấn',digits:1,height:260,rotateLabels:true});
 const im=byMonth(iipN);
 fillTable('tbl-cement',['Tháng','Sản lượng (triệu tấn)','YoY','IIP khoáng phi kim YoY'],cem.slice().reverse().map(r=>[mon(r.date),nf(r.value,2),signed(yoyAt(cem,r),1)+'%',signed(im[ym(r.date)]?.value,1)+'%']));
 sourceLine('chCement',[SRC.nso],mon(cem.at(-1).date),'Sản lượng xi măng. Bảng kèm IIP sản xuất sản phẩm từ khoáng phi kim — gộp xi măng, gạch, kính, không tách được. Chuỗi xi măng có tháng nhảy bất thường (vd T3/2026 16,6 triệu tấn rồi T4 10,5) do cách NSO cập nhật ước tính; đọc theo lũy kế.');
 insight('chCement','Lũy kế xi măng '+signed(ytdYo(cem),0)+'%, IIP khoáng phi kim tháng gần nhất '+signed(iipN.at(-1)?.value,0)+'%. Sản lượng tăng nhưng ngành vẫn dư công suất (công suất trên 130 triệu tấn/năm, tiêu thụ nội địa 2025 ước 75 triệu tấn, xuất khẩu 37,5 triệu tấn) — giá khó tăng mạnh, biên phụ thuộc giá than.');
}
if(cexp.length&&document.getElementById('chCementExp')){
 const rs=cexp.slice(-36);
 barLineChart('chCementExp',{categories:rs.map(r=>mon(r.date)),series:[{name:'Clinker và xi măng',color:C.teal,values:rs.map(r=>r.value)}],unit:'triệu USD',digits:0,height:260,rotateLabels:true});
 fillTable('tbl-cement-exp',['Tháng','Triệu USD','YoY'],cexp.slice().reverse().map(r=>[mon(r.date),nf(r.value,1),signed(yoyAt(cexp,r),0)+'%']));
 sourceLine('chCementExp',[SRC.customs],mon(cexp.at(-1).date),'Xuất khẩu clinker và xi măng, giá trị USD.');
 insight('chCementExp','Lũy kế xuất khẩu '+signed(ytdYo(cexp),0)+'%. Xuất khẩu là van xả cho phần dư công suất, biên thấp hơn bán trong nước; khi giá than tăng, xuất khẩu clinker gần như hòa vốn.');
}
const cp=S('cement_price'),stone=S('stone_1x2'),asph=S('asphalt'),coal=S('coal_newcastle');
const qlab=r=>'Q'+r.period.slice(-1)+'/'+r.period.slice(0,4),sand=S('sand_yellow');
if(cp.length&&document.getElementById('tbl-sxd')){
 const mats=[['Xi măng bao PCB40','đ/tấn',cp],['Đá 1x2','đ/m³',stone],['Cát vàng','đ/m³',sand]].filter(m=>m[2].length);
 const qs=[...new Set(mats.flatMap(m=>m[2].map(r=>r.period)))].sort().slice(-4);
 if(qs.length>=3){const base=cp.filter(r=>qs.includes(r.period)),by=m=>Object.fromEntries(m.map(r=>[r.period,r]));
  const bm=mats.map(m=>[m[0],by(m[2])]),b0=qs[0];
  barLineChart('chSxd',{categories:qs.map(q=>qlab({period:q})),series:bm.map(([n,o],i)=>({name:n,color:[C.navy,C.gold,C.plum][i],kind:'line',values:qs.map(q=>o[q]&&o[b0]?o[q].value/o[b0].value*100:null)})),unit:'chỉ số '+qlab({period:b0})+' = 100',digits:0,height:240,zeroBase:false});
  legend('chSxd',bm.map(([n],i)=>[n,[C.navy,C.gold,C.plum][i]]))}
 else document.getElementById('chSxd')?.remove();  // under 3 quarters: table only
 fillTable('tbl-sxd',['Vật liệu',...qs.map(q=>qlab({period:q})),'Khoảng giá kỳ cuối','Số điểm'],mats.map(([n,u,rs])=>{const o=Object.fromEntries(rs.map(r=>[r.period,r])),L=rs.at(-1);return [n+' ('+u+')',...qs.map(q=>o[q]?nf(o[q].value,0):'—'),nf(L.min,0)+' – '+nf(L.max,0),String(L.n)]}));
 sourceLine('tbl-sxd',[['Sở Xây dựng Hà Nội · công bố giá VLXD',com.cement_price?.url||'https://soxaydung.hanoi.gov.vn/kinh-te-vat-lieu-xay-dung']],qlab(cp.at(-1)),'Phụ lục 1, giá chưa VAT. Trung vị các nhà sản xuất (xi măng, bỏ hàng rời và loại đa dụng) hoặc các mỏ, bãi (đá, cát). Website đổi hệ thống năm 2026, lịch sử bắt đầu từ Q3/2026.');
}
if(asph.length&&document.getElementById('chVlxdPrice')){
 const ai=byMonth(idx(asph,BASE)),ki=byMonth(idx(coal,BASE)),base=asph.filter(r=>r.date.slice(0,7)>=BASE);
 lines('chVlxdPrice',base,[['Nhựa đường SHFE',C.plum,r=>ai[ym(r.date)]?.value??null],['Than Newcastle',C.gold,r=>ki[ym(r.date)]?.value??null]],'',0);
 legend('chVlxdPrice',[['Nhựa đường SHFE',C.plum],['Than Newcastle',C.gold]]);
 const km=byMonth(coal);
 fillTable('tbl-vlxd-price',['Kỳ','Nhựa đường SHFE (CNY/tấn)','Than Newcastle (USD/tấn)'],asph.slice().reverse().map(r=>[short(r.date),nf(r.value,0),nf(km[ym(r.date)]?.value,1)]));
 sourceLine('chVlxdPrice',[['SHFE · dữ liệu giao dịch ngày','https://www.shfe.com.cn/eng/Market/Futures/'],['ICE Newcastle',com.coal_newcastle?.url||null]],short(asph.at(-1).date),'Chỉ số T1/2024 = 100. Nhựa đường: giá thanh toán hợp đồng chính SHFE, phiên cuối tháng; than Newcastle: ICE, phiên cuối tháng. Giá xi măng, đá, cát của Sở Xây dựng Hà Nội ở thẻ bên cạnh (theo quý).');
 const aL=asph.at(-1),kL=coal.at(-1);
 insight('chVlxdPrice','Nhựa đường '+signed(yoyAt(asph,aL),0)+'% YoY và than Newcastle '+signed(yoyAt(coal,kL),0)+'% — chi phí của nhà thầu đường (C4G, HHV, LCG) và xi măng (HT1, BCC) đi theo giá dầu, than thế giới.');
}
// Xây dựng & hạ tầng
const cred=S('credit_construction'),gdpN=S('gdp_construction_nominal');
if(cred.length&&document.getElementById('chCredit')){
 const rs=cred.slice(-36);
 barLineChart('chCredit',{categories:rs.map(r=>mon(r.date)),series:[{name:'Dư nợ tín dụng xây dựng',color:C.navy,values:rs.map(r=>r.value/1000)}],unit:'nghìn tỷ',digits:0,height:260,rotateLabels:true,zeroBase:false});
 fillTable('tbl-credit',['Tháng','Dư nợ (nghìn tỷ)','YoY'],cred.slice().reverse().map(r=>[mon(r.date),nf(r.value/1000,0),signed(yoyAt(cred,r),1)+'%']));
 sourceLine('chCredit',[SRC.sbv],mon(cred.at(-1).date),'Dư nợ tín dụng ngành xây dựng, cuối tháng (NHNN, số liệu từ 01/2025).');
 insight('chCredit','Tín dụng xây dựng '+signed(yoyAt(cred,cred.at(-1)),0)+'% YoY, nhanh hơn tăng trưởng tín dụng chung: nhà thầu vay vốn lưu động theo khối lượng đầu tư công và nhà ở. Mặt trái là nợ vay và phải thu của nhà thầu tăng cùng (xem Key players).');
}
if(gdpN.length&&document.getElementById('chGdpCons')){
 const rs=gdpN.filter(r=>r.date>='2025-01').map(r=>({date:r.date,value:yoyAt(gdpN,r)})).filter(r=>r.value!=null);
 barLineChart('chGdpCons',{categories:rs.map(r=>qtr(r.date)),series:[{name:'GDP xây dựng lũy kế, giá hiện hành',color:C.teal,values:rs.map(r=>r.value)}],unit:'%',digits:1,height:260,rotateLabels:false});
 fillTable('tbl-gdp-cons',['Kỳ (lũy kế)','GDP xây dựng giá hiện hành (nghìn tỷ)','YoY'],gdpN.slice().reverse().map(r=>[qtr(r.date),nf(r.value/1000,0),signed(yoyAt(gdpN,r),1)+'%']));
 sourceLine('chGdpCons',[SRC.nso],qtr(gdpN.at(-1).date),'GDP ngành xây dựng giá hiện hành, lũy kế từ đầu năm, % so cùng kỳ, từ 2024; số công bố lúc đó (sơ bộ), chưa gồm điều chỉnh năm sau. Không vẽ chuỗi giá so sánh: năm 2026 nhảy +60% so cùng kỳ, nhiều khả năng đổi năm gốc, không so được với các năm trước.');
 insight('chGdpCons','GDP xây dựng giá hiện hành 9T/2026 '+signed(yoyAt(gdpN,gdpN.at(-1)),0)+'%. Phần tăng gồm cả giá vật liệu; khối lượng thực tăng ít hơn.');
}
// Định giá
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['264','Xi măng',C.teal],['260','Đá, VLXD',C.gold],['170','Hạ tầng, cầu đường',C.plum],['171','Xây dựng công trình',C.grey]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/B '+name,color,kind:'line',values:weekly.map(d=>at(id,d,2))})),unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Rổ mã','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),r[1]>0&&r[1]<200?nf(r[1],1):'—',nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[['VNDirect finfo','https://dstock.vndirect.com.vn/']],short(dates.at(-1)),'Rổ mã theo dõi: Xi măng (HT1, BCC); Đá, VLXD (KSB, DHA, VLB, PLC); Hạ tầng, cầu đường (C4G, LCG, HHV, CII, HUT); Xây dựng công trình (CTD, HBC, VCG, FCN, DPG). P/E = tổng vốn hóa / tổng lợi nhuận (vốn hóa ÷ P/E từng mã, VNDirect); mã lỗ không có P/E chỉ vào P/B và vốn hóa. Không phải toàn ngành. Vẽ mỗi 5 phiên.');
 insight('chSectorVal',(()=>{const L=ids.filter(([id])=>sec[id]?.records?.length);const l0=sec[L[0][0]].records.at(-1);return 'P/B rổ mã theo dõi, phiên '+short(l0[0])+': '+L.map(([id,name])=>{const r=sec[id].records,l=r.at(-1),y=r.find(x=>x[0]>=String(+l[0].slice(0,4)-1)+l[0].slice(4));return name+' '+nf(l[2],(2==2?2:1))+'x'+(y&&y[2]!=null?' (1 năm trước '+nf(y[2],(2==2?2:1))+'x)':'')}).join('; ')+'.'})());
}
// Giải ngân đầu tư công
const pi=S('pub_inv'),piC=S('pub_inv_central'),piL=S('pub_inv_local'),piM=S('pub_inv_moc');
if(pi.length&&document.getElementById('chPubInv')){
 const lm=byMonth(piL),rs=piC.slice(-36);
 barLineChart('chPubInv',{categories:rs.map(r=>mon(r.date)),series:[{name:'Trung ương',color:C.navy,values:rs.map(r=>r.value/1000)},{name:'Địa phương',color:C.teal,values:rs.map(r=>(lm[ym(r.date)]?.value??0)/1000)}],unit:'nghìn tỷ',digits:0,height:260,rotateLabels:true,stackable:true});
 legend('chPubInv',[['Trung ương',C.navy],['Địa phương',C.teal]]);
 const cm=byMonth(piC);
 fillTable('tbl-pub-inv',['Tháng','Tổng (nghìn tỷ)','YoY','Trung ương','Địa phương','Bộ Xây dựng'],pi.slice().reverse().map(r=>{const k=ym(r.date),mm=byMonth(piM)[k];return [mon(r.date),nf(r.value/1000,1),signed(yoyAt(pi,r),1)+'%',nf((cm[k]?.value??NaN)/1000,1),nf((lm[k]?.value??NaN)/1000,1),nf((mm?.value??NaN)/1000,2)]}));
 sourceLine('chPubInv',[SRC.nso],mon(pi.at(-1).date),'Vốn đầu tư thực hiện từ ngân sách Nhà nước trong tháng, tách Trung ương và địa phương. Đây là số NSO thống kê, khác số giải ngân Bộ Tài chính báo cáo theo kế hoạch vốn (xem bảng dưới).');
 const L=pi.at(-1),y=L.date.slice(0,4),m=L.date.slice(5,7);
 insight('chPubInv','9T/'+y+' vốn NSNN thực hiện '+nf(ytdSum(pi,y,m)/1000,0)+' nghìn tỷ, '+signed(ytdYo(pi),0)+'% so cùng kỳ; tháng '+Number(m)+' '+signed(yoyAt(pi,L),0)+'%. Địa phương chiếm ~85% và tăng nhanh — sau sáp nhập tỉnh, vốn dồn vào dự án liên tỉnh, vành đai. Vốn Trung ương qua Bộ Xây dựng (gồm cao tốc) lại thấp hơn năm ngoái: các dự án cao tốc lớn đã qua đỉnh giải ngân, nhóm mới (đường sắt) chưa vào khối lượng.');
}
if(pi.length&&document.getElementById('chPubYtd')){
 const years=['2023','2024','2025','2026'],cols=[C.grey,C.gold,C.teal,C.navy];
 const cum=y=>{let a=0;return Array.from({length:12},(_,i)=>{const k=y+'-'+String(i+1).padStart(2,'0'),r=pi.find(x=>ym(x.date)===k);if(!r)return null;a+=r.value;return a/1000})};
 barLineChart('chPubYtd',{categories:Array.from({length:12},(_,i)=>'T'+(i+1)),series:years.map((y,i)=>({name:y,color:cols[i],kind:'line',values:cum(y)})),unit:'nghìn tỷ',digits:0,height:260,zeroBase:true,rotateLabels:false});
 legend('chPubYtd',years.map((y,i)=>[y,cols[i]]));
 fillTable('tbl-pub-ytd',['Tháng',...years],Array.from({length:12},(_,i)=>['T'+(i+1),...years.map(y=>nf(cum(y)[i],0))]));
 sourceLine('chPubYtd',[SRC.nso],mon(pi.at(-1).date),'Cộng dồn vốn NSNN thực hiện theo tháng cho từng năm.');
 insight('chPubYtd','Đường 2026 nằm trên mọi năm trước từ tháng 2 và khoảng cách với 2025 đang mở rộng. Theo mùa vụ, quý IV thường chiếm 30–35% cả năm, nên cả năm 2026 có thể quanh 0,95–1 triệu tỷ nếu giữ nhịp.');
}

// Tài liệu: cung – cầu xi măng, kế hoạch so giải ngân (số có evidence)
if(document.getElementById('chCementSD')){
 hbarCompare('chCementSD',{items:[{label:'Công suất',value:130,color:C.red},{label:'Nội địa + XK',value:112.5,color:C.navy},{label:'Tiêu thụ nội địa',value:75,color:C.teal},{label:'Xuất khẩu',value:37.5,color:C.gold}],unit:'triệu tấn',digits:1,labelW:130,ariaLabel:'Cung cầu xi măng 2025'});
 sourceLine('chCementSD',[['Thương hiệu & Công luận','https://thuonghieucongluan.com.vn/xi-mang-viet-nam-tim-them-du-dia-xuat-khau-khi-thi-truong-my-tang-toc-a332321.html'],['Báo Đấu thầu','https://baodauthau.vn/doanh-nghiep-xi-mang-rong-cua-tang-truong-nam-2026-post191331.html']],'2025','Công suất "trên 130 triệu tấn" vẽ 130; tiêu thụ nội địa ước ~75 triệu tấn; xuất khẩu xi măng + clinker 37,5 triệu tấn (clinker tính như xi măng, nên tổng cầu hơi cao hơn thực).',false);
 insight('chCementSD','Kể cả cộng xuất khẩu, cầu (~112 triệu tấn) vẫn thấp hơn công suất ~17 triệu tấn — ngành chạy ~77–85% công suất. Đợt tăng giá 50.000–70.000 đ/tấn tháng 10/2026 chủ yếu để bù than, không phải vì cầu vượt cung; giá giữ được hay không phụ thuộc đầu tư công quý IV.');
}
if(document.getElementById('chPubPlan')){
 barLineChart('chPubPlan',{categories:['2025','2026'],series:[{name:'Kế hoạch Thủ tướng giao',color:C.grey,values:[905.5,1022.6]},{name:'Giải ngân đến 30/9',color:C.teal,values:[440.4,643.0]},{name:'Giải ngân cả năm',color:C.navy,values:[858.6,null]}],unit:'nghìn tỷ',digits:0,height:260,rotateLabels:false});
 legend('chPubPlan',[['Kế hoạch',C.grey],['Đến 30/9',C.teal],['Cả năm',C.navy]]);
 sourceLine('chPubPlan',[['Bộ Tài chính qua Báo Lào Cai','https://baolaocai.vn/giai-ngan-von-dau-tu-cong-9-thang-nam-2026-mot-so-bo-nganh-dia-phuong-con-cham-post910995.html'],['Thời báo Tài chính','https://thoibaotaichinhvietnam.vn/dau-an-dieu-hanh-quyet-liet-va-nen-tang-cho-but-pha-nam-2026-191834.html']],'30/09/2026','9T/2025 suy ra: 642.961,6 − 202.559,3 tỷ. Cả năm 2025 tính đến 31/1/2026.',false);
 insight('chPubPlan','Sau 9 tháng 2026 đã giải ngân 643 nghìn tỷ — bằng 75% cả năm 2025 và cao hơn cùng kỳ ~46%. Để đạt 95% kế hoạch như 2025, quý IV và tháng 1/2027 cần thêm ~330 nghìn tỷ, lớn hơn mọi quý trước: khối lượng thi công, đá, nhựa đường sẽ dồn vào cuối năm.');
}
// ---------- 3b. Đợt 1 (05/11/2026): đường đua giải ngân, rổ giá vật liệu, BOT HHV, timeline, backlog ----------
const WI=window.CONSTRUCTION_WI?.blocks||{},wcom=WI.commodity?.series||{},WS=k=>wcom[k]?.records||[];
const note=html=>{const d=make('details','note-icon');d.innerHTML='<summary>ⓘ Lưu ý dữ liệu</summary><div>'+html+'</div>';return d};
const newCard=(after,id,title,sub,chartId,tableId)=>{if(!after)return null;const c=make('div','card');c.style.marginTop='14px';c.dataset.blockId=id;c.dataset.refreshStatus='loaded';c.append(make('div','chart-title',title),make('div','chart-sub',sub));if(chartId){const h=make('div');h.id=chartId;c.append(h)}if(tableId){const d=make('details','dtable');d.innerHTML='<summary>Xem bảng dữ liệu</summary><div class="tablewrap"><table id="'+tableId+'"></table></div>';c.append(d)}after.after(c);return c};
const link=(name,url)=>'<a href="'+url+'" target="_blank" rel="noopener">'+name+'</a>';
// Đường đua giải ngân: % kế hoạch năm, vốn NSNN thực hiện (NSO) cộng dồn theo tháng; mốc Bộ Tài chính.
const PLAN={'2025':905481.7,'2026':1022607};
const MOF=[['2026',9,62.9,'30/9'],['2026',10,74.1,'31/10'],['2025',9,48.6,'30/9 (suy ra)'],['2025',12,94.8,'31/1/2026']];
const WEEK=[['03/09',513304.7,50.2],['10/09',523813.6,51.2],['24/09',567776.1,55.5],['01/10',644013.5,63.0],['08/10',652125.4,63.8],['15/10',660739.5,64.6],['22/10',673970.1,65.9],['31/10',708567.4,74.1]];
const race=newCard(document.querySelector('[data-block-id="xd-42"]'),'xd-43','Đường đua giải ngân — % kế hoạch năm','% kế hoạch Thủ tướng giao · cộng dồn theo tháng','chPubRace','tbl-pub-race');
if(race&&pi.length){
 const cum=y=>{let a=0;return Array.from({length:12},(_,i)=>{const r=pi.find(x=>ym(x.date)===y+'-'+String(i+1).padStart(2,'0'));if(!r)return null;a+=r.value;return a/PLAN[y]*100})};
 const mof=y=>Array.from({length:12},(_,i)=>MOF.find(m=>m[0]===y&&m[1]===i+1)?.[2]??null);
 barLineChart('chPubRace',{categories:Array.from({length:12},(_,i)=>'T'+(i+1)),series:[{name:'2025 · NSO',color:C.gold,kind:'line',values:cum('2025')},{name:'2026 · NSO',color:C.navy,kind:'line',values:cum('2026')},{name:'2025 · Bộ Tài chính',color:C.grey,kind:'line',values:mof('2025')},{name:'2026 · Bộ Tài chính',color:C.plum,kind:'line',values:mof('2026')}],unit:'% KH',digits:1,height:260,zeroBase:true,rotateLabels:false});
 const c25=cum('2025'),c26=cum('2026'),m=c26.findLastIndex(v=>v!=null);
 fillTable('tbl-pub-race',['Mốc 2026 (Bộ Tài chính)','Lũy kế (tỷ)','% KH'],WEEK.map(w=>[w[0],nf(w[1],1),nf(w[2],1)+'%']).reverse().concat([['NSO · tháng','2025 % KH','2026 % KH']],Array.from({length:12},(_,i)=>['T'+(i+1),nf(c25[i],1),nf(c26[i],1)])));
 race.append(make('div','source-note','Nguồn: '),note('Kế hoạch: 2026 1.022.607 tỷ, 2025 905.481,7 tỷ (Bộ Tài chính, đã có bằng chứng ở thẻ "Kế hoạch so giải ngân"). Đường NSO = vốn NSNN thực hiện cộng dồn ÷ kế hoạch — khác phạm vi số giải ngân Bộ Tài chính nên cao hơn. 9T/2025 Bộ Tài chính suy ra từ chênh lệch +202.559,3 tỷ. Mốc 31/10 (74,1%) lấy từ tóm tắt bài TBTCVN 10T trên trang đã mở; bài đầy đủ chưa mở. Chưa có 2024: chưa mở được văn bản kế hoạch vốn 2024.'));
 race.querySelector('.source-note').innerHTML='Nguồn: '+link('NSO',SRC.nso[1])+' · Bộ Tài chính qua '+link('TBTCVN 16/09','https://thoibaotaichinhvietnam.vn/giai-ngan-von-dau-tu-cong-dat-51-2-ke-hoach-thu-tuong-giao-203900.html')+', '+link('08/10','https://thoibaotaichinhvietnam.vn/giai-ngan-dau-tu-cong-tang-hon-76-000-ty-dong-trong-mot-tuan-205054.html')+', '+link('15/10','https://thoibaotaichinhvietnam.vn/giai-ngan-dau-tu-cong-dat-63-8-ke-hoach-sau-hon-9-thang-205408.html')+', '+link('Thanh Tra 28/10','https://thanhtra.com.vn/dau-tu-72A9E3223/giai-ngan-von-dau-tu-cong-vuot-673000-ty-dong-dat-gan-66-ke-hoach-cce9750d0.html');
 insight('chPubRace','Theo Bộ Tài chính, 2026 đạt 62,9% kế hoạch sau 9 tháng so với ~48,6% cùng kỳ 2025, và 74,1% sau 10 tháng. Để về đích như 2025 (94,8%), hai tháng cuối năm và tháng 1/2027 cần thêm ~21 điểm % (~210 nghìn tỷ). Đường 2026 nằm trên 2025 ở mọi tháng: giữ nhóm nhà thầu hạ tầng và đá.');
}
// Rổ giá vật liệu nhà thầu đường (chỉ số 2024 = 100) và chỉ số giá XD Bắc Ninh.
const W8={stone:37.5,asphalt:31.25,cement:18.75,steel:12.5};
const mats={stone:WS('stone_1x2'),cement:WS('cement_price'),steel:WS('rebar_hpg'),asphalt:asph};
const priceSec=document.querySelector('.majorpane[data-tab="mt3"] .section .sectionhead');
let basketYoY=null;
if(priceSec&&Object.values(mats).every(r=>r.length)){
 const bm=Object.fromEntries(Object.entries(mats).map(([k,rs])=>[k,byMonth(rs)]));
 const base=Object.fromEntries(Object.entries(mats).map(([k,rs])=>{const v=rs.filter(r=>r.date.slice(0,4)==='2024').map(r=>r.value);return [k,v.reduce((a,b)=>a+b,0)/v.length]}));
 const months=[...new Set(Object.values(mats).flatMap(rs=>rs.map(r=>ym(r.date))))].filter(m=>m>='2024-01').sort();
 const comp=k=>months.map(m=>bm[k][m]?bm[k][m].value/base[k]*100:null);
 const cs=Object.fromEntries(Object.keys(W8).map(k=>[k,comp(k)]));
 const basket=months.map((m,i)=>Object.keys(W8).every(k=>cs[k][i]!=null)?Object.keys(W8).reduce((a,k)=>a+cs[k][i]*W8[k]/100,0):null);
 const card=make('div','card');card.dataset.blockId='xd-72';card.dataset.refreshStatus='loaded';
 card.append(make('div','chart-title','Rổ giá vật liệu nhà thầu đường — chỉ số 2024 = 100'),make('div','chart-sub','bình quân 2024 = 100 · tháng · đá, nhựa đường, xi măng, thép'));
 const h=make('div');h.id='chBasket';card.append(h);const d=make('details','dtable');d.innerHTML='<summary>Xem bảng dữ liệu</summary><div class="tablewrap"><table id="tbl-basket"></table></div>';card.append(d);
 card.append(note('Trọng số (ghi rõ): đá 1x2 37,5% · nhựa đường 31,25% · xi măng 18,75% · thép 12,5% — khung đá 30/cát 20/nhựa 25/xi măng 15/thép 10 chia lại sau khi bỏ cát (chưa có chuỗi tháng; Sở XD Hà Nội mới có Q3/2026). Nguồn: đá 1x2 (80968), xi măng (80961) theo Sở Xây dựng qua '+link('WiData','https://widata.vn/')+'; thép CB300 Hòa Phát (Wi 74362, từ 6/2024 nên gốc thép là bình quân 6–12/2024); nhựa đường '+link('SHFE','https://www.shfe.com.cn/eng/Market/Futures/')+' (CNY/tấn, phiên cuối tháng). Tháng thiếu một thành phần thì không tính rổ. Đây là bước 1 của "biên bị bào": chưa so với đơn giá hợp đồng.'));
 priceSec.after(card);
 barLineChart('chBasket',{categories:months.map(m=>mon(m+'-01')),series:[{name:'Rổ vật liệu',color:C.navy,kind:'line',values:basket},{name:'Đá 1x2',color:C.gold,kind:'line',values:cs.stone},{name:'Nhựa đường',color:C.plum,kind:'line',values:cs.asphalt},{name:'Xi măng',color:C.teal,kind:'line',values:cs.cement},{name:'Thép',color:C.grey,kind:'line',values:cs.steel}],unit:'chỉ số',digits:0,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-basket',['Tháng','Rổ','Đá','Nhựa đường','Xi măng','Thép'],months.map((m,i)=>[mon(m+'-01'),nf(basket[i],1),nf(cs.stone[i],1),nf(cs.asphalt[i],1),nf(cs.cement[i],1),nf(cs.steel[i],1)]).reverse());
 const li=basket.findLastIndex(v=>v!=null),pi12=months.indexOf(String(+months[li].slice(0,4)-1)+months[li].slice(4));basketYoY=pi12>=0&&basket[pi12]?(basket[li]/basket[pi12]-1)*100:null;
 insight('chBasket','Rổ '+mon(months[li]+'-01')+': '+nf(basket[li],0)+' (2024 = 100), '+signed(basketYoY,1)+'% so cùng kỳ; đá '+nf(cs.stone[li],0)+', nhựa đường '+nf(cs.asphalt[li],0)+'. Đá và nhựa đường kéo rổ lên, xi măng và thép gần đi ngang: nhà thầu đường (C4G, LCG, HHV) chịu phần tăng nếu đơn giá hợp đồng chưa điều chỉnh; bên bán đá (VLB, KSB, DHA) hưởng.');
 const bn=make('div','card');bn.style.marginTop='14px';bn.dataset.blockId='xd-71';bn.dataset.updateKind='document';
 bn.innerHTML='<div class="chart-title">Chỉ số giá xây dựng Bắc Ninh Q3/2026 — năm 2025 = 100</div><div class="chart-sub">mốc rời · QĐ 913/QĐ-SXD</div><div class="tablewrap"><table class="compare-table"><thead><tr><th>Chỉ số</th><th>T7</th><th>T8</th><th>T9</th><th>Quý III</th></tr></thead><tbody>'+
  [['Đường bê tông nhựa làm mới · Bắc Giang cũ','111,64','113,38','121,55','<b>115,53</b>'],['Đường bê tông nhựa làm mới · Bắc Ninh cũ','107,05','109,93','116,29','<b>111,09</b>'],['Vật liệu: đá xây dựng · Bắc Giang cũ','161,59','154,69','157,42','<b>157,90</b>'],['Vật liệu: đá xây dựng · Bắc Ninh cũ','126,00','128,37','139,61','<b>131,33</b>'],['Vật liệu: bê tông nhựa, nhựa đường','114,61','116,56','130,19','<b>120,45</b>'],['Vật liệu: cát · Bắc Giang cũ','92,93','99,22','114,42','102,19'],['Vật liệu: xi măng · Bắc Giang cũ','96,23','96,23','100,36','97,60'],['Vật liệu: thép xây dựng','105,67','105,60','105,61','105,62']].map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+
  '<div class="source-note">Nguồn: '+link('Sở Xây dựng Bắc Ninh · QĐ 913/QĐ-SXD (PDF)','https://cdn.thuviennhadat.vn//upload/hinh-anh-bai-viet/2026/nhom3/NTDM/Thang10/28/quyet-dinh-913-qd-sxd-chi-so-gia-xay-dung-bac-ninh-quy-3-2026-phan-xay-dung.pdf')+' qua '+link('thuviennhadat.vn','https://thuviennhadat.vn/phap-luat/chi-so-gia-xay-dung-bac-ninh-quy-3-2026-phan-xay-dung-748836.html')+'</div>';
 bn.append(note('Một tỉnh, một quý, gốc 2025 (khác gốc 2024 của rổ bên trên) nên chỉ đọc chiều: đá tăng 31–58% so bình quân 2025 trong khi chỉ số công trình đường chỉ +11–16% — phần chênh là chi phí nhà thầu phải tự hấp thụ nếu hợp đồng trọn gói. Bản quốc gia chưa tìm được.'));
 card.after(bn);
}
// BOT HHV: doanh thu thu phí theo quý, lưu lượng trạm Q3/2026 (bản tin IR).
const build=document.getElementById('supply-build');
if(build){
 const qs=['Q2/24','Q3/24','Q4/24','Q1/25','Q2/25','Q3/25','Q4/25','Q1/26','Q2/26','Q3/26'],rev=[486,475,null,null,null,556,null,656.5,590.5,588];
 const card=make('div','card');card.style.marginTop='14px';card.dataset.blockId='xd-70';card.dataset.updateKind='document';card.dataset.refreshStatus='loaded';
 card.append(make('div','chart-title','HHV: doanh thu thu phí BOT theo quý'),make('div','chart-sub','tỷ đồng · bản tin nhà đầu tư'));
 const h=make('div');h.id='chHhvBot';card.append(h);
 const t=make('div','tablewrap');t.innerHTML='<table class="compare-table"><thead><tr><th>Trạm (Q3/2026)</th><th>Lượt xe</th><th>So cùng kỳ</th></tr></thead><tbody>'+[['Bắc Hải Vân','1.236.029','+20,4%'],['Ninh Lộc','1.071.687','+7,2%'],['Đèo Cả','933.310','+14,7%'],['Cam Lâm – Vĩnh Hảo','873.272','+1,6%'],['Cao tốc Bắc Giang – Lạng Sơn','858.819','+21,1%'],['Cù Mông','642.704','<b>+82,6%</b>'],['QL1 Km93 Bắc Giang – Lạng Sơn','579.321','−2,9%'],['An Dân','351.500','<b>−64,8%</b>']].map(r=>'<tr><td>'+r.join('</td><td>')+'</td></tr>').join('')+'</tbody></table>';card.append(t);
 card.append(make('div','source-note',''));card.querySelector('.source-note').innerHTML='Nguồn: '+['2024/08/Ban-tin-nha-dau-tu-Q2.2024.pdf|Q2/24','2024/11/Ban-tin-nha-dau-tu-Q3.24.pdf|Q3/24','2025/10/HHV-Ban-tin-IR-Q3.2025.pdf|Q3/25','2026/05/HHV-Ban-tin-IR-Q1.2026-viet.pdf|Q1/26','2026/08/HHV-Ban-tin-IR-Q2.2026-viet.pdf|Q2/26','2026/10/HHV-2026-Q3-Ban-tin-IR-final.pdf|Q3/26'].map(x=>{const [u,l]=x.split('|');return link('HHV IR '+l,'https://hhv.cdn.vccloud.vn/wp-content/uploads/'+u)}).join(' · ');
 card.append(note('Q2/26 = 6T 1.247 − Q1 656,5; Q3/26 = 9T 1.835 − 6T 1.247 (tự tính). Q4/24, Q1–Q2/25, Q4/25 để trống: bản tin chỉ có số năm (2024 1.913, 2025 2.106 tỷ) hoặc bản Q1/2025 không tải được. Lưu lượng: An Dân giảm do xe chuyển sang cao tốc Quy Nhơn – Vân Phong, Ninh Lộc giảm lũy kế đã nằm trong phương án tài chính (theo HHV). HHV vay 18.179 tỷ (31/3/2026) — chưa có lãi vay theo quý để tính "lãi vay ÷ thu phí".'));
 build.append(card);
 barLineChart('chHhvBot',{categories:qs,series:[{name:'Thu phí BOT',color:C.navy,values:rev}],unit:'tỷ đồng',digits:0,height:240,rotateLabels:false});
 insight('chHhvBot','Thu phí 9T/2026 1.835 tỷ (+13%), chiếm 61% doanh thu và 87% lãi gộp HHV. Quý gần nhất ~590 tỷ/quý, thấp hơn đỉnh Q1 vì lưu lượng An Dân giảm mạnh; Cù Mông, Bắc Hải Vân, BGLS bù lại. Đồng Đăng – Trà Lĩnh khai thác cuối 2026 là động lực tiếp theo cho trạm BGLS.');
 // Timeline dự án lớn + gói đã ký theo mã (gom từ thẻ dự án trọng điểm và Key players, đã có nguồn tại các thẻ đó).
 const tl=[['Đã khởi công','Đường sắt Lào Cai – Hà Nội – Hải Phòng','203.231 tỷ; vốn 2026 44.891 tỷ','—'],['9/2026','Vành đai 4 Hà Nội','sản lượng >34%; gói 1.221 tỷ','DPG'],['12/2026','Sân bay Long Thành khai thác','gói 5.10 liên danh >35.000 tỷ','VCG'],['Cuối 2026','Cao tốc Đồng Đăng – Trà Lĩnh khai thác','HHV sở hữu 40%','HHV'],['2026–2027','Cầu Trần Hưng Đạo','2.896 tỷ','DPG'],['2026–2027','Sân bay Gia Bình','~1.600 tỷ (FCN); CTD tham gia','FCN · CTD'],['2026–2027','Đường Di sản Hưng Yên; cao tốc Nội Bài – Lào Cai','1.140 tỷ; ~1.400 tỷ','LCG'],['2026–2027','Cầu Ninh Cường','~453 tỷ','C4G'],['Chưa có mốc','BOT mở rộng TP.HCM – Trung Lương – Mỹ Thuận','36.172 tỷ; HUT ~500 tỷ','CII · HUT'],['12/2027','Khởi công đường sắt tốc độ cao Bắc–Nam','1.713.548 tỷ; 20 km Gia Bình – Quảng Ninh (nguyên tắc)','DPG · HPG']];
 const tc=make('div','card');tc.style.marginTop='14px';tc.dataset.blockId='xd-73';tc.dataset.updateKind='document';
 tc.innerHTML='<div class="chart-title">Timeline dự án lớn và gói đã ký theo mã</div><div class="chart-sub">mốc công bố gần nhất · gom từ thẻ Dự án trọng điểm và bảng Key players</div><div class="tablewrap"><table class="compare-table"><thead><tr><th>Mốc</th><th>Dự án</th><th>Quy mô / gói</th><th>Mã</th></tr></thead><tbody>'+tl.map(r=>'<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>').join('')+'</tbody></table></div>';
 tc.append(note('Số và link nguồn ở thẻ "Dự án trọng điểm" (Bức tranh ngành) và bảng Key players; bảng này chỉ sắp lại theo mốc. Vành đai 3 TP.HCM thông xe chưa xác nhận nên không đưa vào.'));
 const anchorCard=document.querySelector('[data-block-id="xd-32"]');(anchorCard||card).after(tc);
}
// Backlog cover (ứng trước của chủ đầu tư) & phải thu ÷ doanh thu, 10 mã nhà thầu (VNDirect finfo).
const XB=window.CONSTRUCTION_BACKLOG;let recvMed=null;
if(XB&&XB.rows){
 const codes=XB.codes.filter(c=>XB.rows[c]),qs=[...new Set(codes.flatMap(c=>Object.keys(XB.rows[c])))].sort(),q=qs.at(-1),q4=qs.at(-5),ql=x=>x.slice(4)+'/'+x.slice(0,4);
 const rows=codes.map(c=>{const r=XB.rows[c][q]||{},p=XB.rows[c][q4]||{};return [c,r.backlog_cover,p.backlog_cover,r.receivables_ratio,p.receivables_ratio,r.revenue_ttm]});
 const rr=rows.map(r=>r[3]).filter(v=>v!=null).sort((a,b)=>a-b);recvMed=rr.length?rr[Math.floor(rr.length/2)]:null;
 const host=document.querySelector('[data-block-id="xd-04"]'); // Key players (mt6) bị research-layout gỡ; đặt ở Tổng quan · Doanh nghiệp theo dõi
 const c=host?make('div','xd-backlog'):null;if(c){c.style.marginTop='14px';c.dataset.blockId='xd-74';c.append(make('div','chart-title','Nhà thầu: tiền ứng trước và phải thu so doanh thu 4 quý'),make('div','chart-sub','lần · BCTC hợp nhất '+ql(q)+' · 10 mã'));host.append(c)}
 if(c){const t=make('div','tablewrap');t.innerHTML='<table id="tbl-xd-backlog"></table>';c.append(t);
  c.append((()=>{const d=make('details','note-icon');d.innerHTML='<summary>ⓘ Nguồn &amp; ghi chú</summary><div>Nguồn: '+link('VNDirect finfo · BCTC quý','https://api-finfo.vndirect.com.vn/v4/financial_statements?q=code:CTD~reportType:QUARTER~modelType:1~fiscalDate:gte:2025-01-01&size=400')+' (scripts/fetch_realestate_backlog.py --sector construction), kiểm '+short(XB.checked)+'. Ứng trước ÷ DT = người mua trả tiền trước (13130 + 13311) ÷ doanh thu thuần 4 quý (21001) — với nhà thầu là tiền tạm ứng của chủ đầu tư, chỉ là phần nhỏ của backlog hợp đồng (backlog công bố ở bảng trên). Phải thu ÷ DT = phải thu khách hàng (11310 + 12110) ÷ cùng doanh thu; chưa gồm "phải thu theo tiến độ hợp đồng xây dựng". Ngưỡng: phải thu &gt;0,5 lần doanh thu là chậm thu tiền.</div>';return d})());
  fillTable('tbl-xd-backlog',['Mã','Ứng trước ÷ DT','4 quý trước','Phải thu ÷ DT','4 quý trước','Doanh thu 4Q (tỷ)'],rows.sort((a,b)=>(b[3]??0)-(a[3]??0)).map(r=>[r[0],nf(r[1],2)+'x',nf(r[2],2)+'x',(r[3]>0.5?'▲ ':'')+nf(r[3],2)+'x',nf(r[4],2)+'x',nf(r[5],0)]));
 }
}
// ---------- 4. KPIs, quick read, catalyst brief ----------
const piLast=pi.at(-1),cemL=cem.at(-1),aL=asph.at(-1),coalL=coal.at(-1),cpL=cp.at(-1),pe=sec['264']?.records||[],peL=pe.at(-1),pe0=pe[0],road=sec['170']?.records?.at(-1);
const piY=piLast?piLast.date.slice(0,4):'',piMo=piLast?piLast.date.slice(5,7):'';
kpi('spk-pub',piLast?nf(ytdSum(pi,piY,piMo)/1000,0):'—',piLast?'nghìn tỷ · NSNN '+Number(piMo)+'T/'+piY:'—',piLast?signed(ytdYo(pi),0)+'% so cùng kỳ':'',pi.slice(-12).map(r=>r.value));
kpi('spk-cprice',cpL?nf(cpL.value/1000000,2):'—',cpL?'triệu đ/tấn · '+qlab(cpL):'—','',cp.slice(-12).map(r=>r.value),C.navy);
kpi('spk-coal',coalL?nf(coalL.value,0):'—',coalL?'USD/tấn · '+short(coalL.date):'—',coalL?signed(yoyAt(coal,coalL),0)+'% so cùng kỳ':'',coal.slice(-12).map(r=>r.value),C.teal);
kpi('spk-cement',cemL?nf(cemL.value,1):'—',cemL?'triệu tấn · '+mon(cemL.date):'—',cemL?'lũy kế '+signed(ytdYo(cem),0)+'%':'',cem.slice(-12).map(r=>r.value),C.grey);
kpi('spk-asphalt',aL?nf(aL.value,0):'—',aL?'CNY/tấn · '+short(aL.date):'—',aL?signed(yoyAt(asph,aL),0)+'% so cùng kỳ':'',asph.slice(-12).map(r=>r.value),C.plum);
kpi('spk-pe',peL?nf(peL[1],1)+'x':'—',peL?'P/E xi măng · '+short(peL[0]):'—',peL?'P/B '+nf(peL[2],2)+'x':'',pe.slice(-30).map(r=>r[1]),C.grey);
const quick=document.querySelector('.hero .insight');
if(quick&&piLast){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu công khai: '),`Vốn NSNN thực hiện ${Number(piMo)}T/${piY} ${nf(ytdSum(pi,piY,piMo)/1000,0)} nghìn tỷ (${signed(ytdYo(pi),0)}%). Xi măng lũy kế ${signed(ytdYo(cem),0)}%. Nhựa đường ${signed(yoyAt(asph,aL),0)}%, than ${signed(yoyAt(coal,coalL),0)}%. P/E xi măng ${peL?nf(peL[1],1):'—'}x.`);
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
const piYo=ytdYo(pi),cY=ytdYo(cem),aY=yoyAt(asph,aL),coY=yoyAt(coal,coalL),crY=yoyAt(cred,cred.at(-1));
const row=(group,name,big,evidence,cond,st,who,chart)=>({group,name,big,chart,st,mid:[evidence,cond],end:[who]});
const score=[
 row('Cầu','Đầu tư công tăng tốc',[signed(piYo,0)+'%','vốn NSNN lũy kế'],nf(ytdSum(pi,piY,piMo)/1000,0)+' nghìn tỷ '+Number(piMo)+'T/'+piY,'Lũy kế về dưới +10%',piYo==null?'na':piYo>15?'good':piYo<5?'risk':'watch','▲ C4G · LCG · HHV · VCG · VLB · KSB · DHA','chPubInv'),
 row('Chi phí','Nhựa đường, than đắt',[signed(aY,0)+'%','nhựa đường YoY'],'Than Newcastle '+signed(coY,0)+'%','Nhựa đường về dưới mức cùng kỳ',aY==null?'na':aY>20?'risk':aY<0?'good':'watch','▼ C4G · HHV · LCG · HT1 · BCC','chVlxdPrice'),
 row('Cung','Xi măng dư cung',[signed(cY,0)+'%','sản lượng lũy kế'],'Công suất >130 triệu tấn; nội địa 2025 ~75 triệu, XK 37,5 triệu','Đóng cửa lò hoặc giá xi măng tăng >10%',cY==null?'na':'watch','HT1 · BCC','chCement'),
 row('Vốn','Tín dụng xây dựng tăng',[signed(crY,0)+'%','dư nợ YoY'],'Nhà thầu vay theo khối lượng; nợ vay, phải thu tăng cùng','Tăng trưởng về dưới 10%',crY==null?'na':crY>15?'good':crY<8?'risk':'watch','CTD · HBC · VCG · FCN','chCredit'),
 row('Định giá','Xi măng so cầu đường',[peL?nf(peL[1],1)+'x':'—','P/E xi măng'],'P/B xi măng '+(peL?nf(peL[2],2):'—')+'x'+(pe0?' (đầu kỳ '+nf(pe0[2],2)+'x)':'')+(road?'; cầu đường P/B '+nf(road[2],2)+'x':''),'BCTC quý mới',peL?'info':'na','HT1 · BCC · C4G · VCG','chSectorVal'),
 row('Cầu','Giải ngân % KH (Bộ Tài chính)',['62,9%','9T/2026'],'Cùng kỳ 2025 ~48,6%; 10T/2026 74,1%','Thấp hơn cùng kỳ năm trước','good','▲ C4G · LCG · HHV · VCG · VLB · KSB · DHA','chPubRace'),
 row('Chi phí','Rổ vật liệu nhà thầu đường',[signed(basketYoY,1)+'%','so cùng kỳ'],'Đá, nhựa đường, xi măng, thép; 2024 = 100','Rổ tăng >10% YoY là Risk',basketYoY==null?'na':basketYoY>10?'risk':basketYoY<0?'good':'watch','▼ C4G · LCG · HHV · ▲ VLB · KSB · DHA','chBasket'),
 row('Vốn','Phải thu ÷ doanh thu nhà thầu (trung vị)',[nf(recvMed,2)+'x','10 mã'],'BCTC quý mới nhất (VNDirect)','>0,5 lần là Risk',recvMed==null?'na':recvMed>0.5?'risk':recvMed<0.3?'good':'watch','CTD · HBC · FCN · LCG','tbl-xd-backlog')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.CONSTRUCTION_BRIEF={
 headline:'Giải ngân nhanh hơn cùng kỳ (74,1% KH sau 10T) kéo khối lượng thi công; rổ vật liệu '+signed(basketYoY,0)+'% YoY bào biên nhà thầu đường · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Xi măng & VLXD','HT1 · BCC · VLB · KSB · DHA · PLC · VGC',cY!=null&&cY>5?'up':'flat','Xi măng '+signed(cY,0)+'%'],['Xây dựng & hạ tầng','CTD · HBC · VCG · FCN · DPG · C4G · LCG · HHV · CII · HUT',piYo!=null&&piYo>15?'up':'flat','NSNN '+signed(piYo,0)+'%']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Đầu tháng','NSO: vốn NSNN thực hiện, sản lượng xi măng'],['Hằng tuần','Giá than, nhựa đường'],['Sau mỗi quý','BCTC quý'],['Cuối năm','Giao kế hoạch vốn 2027'],['12/2027','Mục tiêu khởi công đường sắt tốc độ cao Bắc–Nam']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ nguồn công khai lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; giá hàng hóa: ICE, SHFE, Sở Xây dựng Hà Nội.';
})();
