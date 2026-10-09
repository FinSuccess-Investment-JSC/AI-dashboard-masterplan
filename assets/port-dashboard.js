/* Ports & warehousing dashboard: value chain, Cảng / Vận tải biển / Kho bãi panes and every chart
   drawn from window.PORT_WI (scripts/build_port_wi.py from WiMCP captures) and from the dated
   document figures shown in the HTML tables. Also publishes window.PORT_BRIEF for catalyst-board.js.
   Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='port')return;
const W=window.PORT_WI||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const qtr=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={customs:['Hải quan Việt Nam','https://www.customs.gov.vn/'],nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],baltic:['Baltic Exchange','https://www.balticexchange.com/'],drewry:['Drewry WCI','https://www.drewry.co.uk/supply-chain-advisors/supply-chain-expertise/world-container-index-assessed-by-drewry'],wi:['MCP Wi (Widata)',null]};
const S=k=>macro[k]?.records||com[k]?.records||[];
const ym=d=>d.slice(0,7);
const byMonth=rs=>{const m={};rs.forEach(r=>{m[ym(r.date)]=r});return m};
const yoyAt=(rs,r)=>{if(!r)return null;const p=rs.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};
const ytdYo=rs=>{const l=rs.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),sum=yy=>rs.filter(r=>r.date.slice(0,4)===yy&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0);const p=sum(String(y-1));return p?(sum(y)/p-1)*100:null};

// ---------- 1. Value chain (Tổng quan) ----------
const chain=document.querySelector('[data-block-id="cg-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='09/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['owner',25,40,['Chủ hàng','Hàng XNK, nội địa']],['line',315,40,['Hãng tàu','MSC · CMA CGM · HAH']],['deep',605,40,['Cảng nước sâu (tàu mẹ)','GMD · PHP · SGP']],
  ['feeder',605,165,['Cảng hạ lưu, địa phương','VSC · DVP · CDN · PDN']],['depot',895,165,['Kho bãi, ICD, depot','TCL · STG']],
  ['air',315,165,['Hàng không','SCS · SGN']],['state',315,290,['Nhà nước','Khung giá · quy hoạch']],['inland',895,40,['Vận tải nội địa','Sà lan · bộ · sắt']]
 ];
 const edges=[['owner','line'],['line','deep'],['deep','inland'],['line','feeder'],['feeder','depot'],['owner','air'],['state','deep',true],['state','feeder',true]];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b];let d;
  if(A[2]===Bn[2]){const fw=Bn[1]>A[1];d=`M${A[1]+(fw?w:0)} ${A[2]+h/2} H${Bn[1]+(fw?0:w)}`}
  else if(A[1]===Bn[1]){d=`M${A[1]+w/2} ${A[2]+(Bn[2]>A[2]?h:0)} V${Bn[2]+(Bn[2]>A[2]?0:h)}`}
  else{const fw=Bn[1]>A[1],x1=A[1]+(fw?w:0),y1=A[2]+h/2,x2=Bn[1]+(fw?0:w),y2=Bn[2]+h/2,mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`}
  return `<path d="${d}" class="chain-edge${dashed?' dashed':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t.replace(/&/g,'&amp;')}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1140 375" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành cảng và kho bãi</title><desc id="chain-desc">Chủ hàng xuất nhập khẩu thuê hãng tàu; hàng container đi qua cảng nước sâu hoặc cảng hạ lưu, rồi vào kho bãi, ICD và vận tải nội địa. Hàng không đi qua nhà ga hàng hóa. Nhà nước đặt khung giá và quy hoạch.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: cảng thu tiền theo container bốc xếp, nên sản lượng × giá quyết định doanh thu. Hãng tàu chọn cảng nào (tàu mẹ vào Lạch Huyện, Cái Mép hay chỉ feeder vào cảng hạ lưu) quyết định thị phần; Nhà nước đặt khung giá sàn nên giá chỉ tăng theo từng đợt văn bản. HAH ăn cước và giá thuê tàu, không ăn giá bốc xếp; SCS, SGN đi theo sân bay chứ không theo cảng biển.'));
 figure.after(make('div','source-note','Mũi tên liền: dòng hàng · Mũi tên đứt: quản lý, khung giá. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Bức tranh ngành: Cảng / Vận tải biển / Kho bãi ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead');
 const children=[...section.children].filter(e=>e!==head),port=make('div','supply-pane'),sea=make('div','supply-pane'),wh=make('div','supply-pane');
 port.id='supply-world';sea.id='supply-vietnam';wh.id='supply-trade';
 let cur=port;children.forEach(e=>{if(e.matches('h3.subhead')){const t=e.textContent.trim();cur=t.startsWith('Vận tải')?sea:t.startsWith('Kho')?wh:port;e.remove();return}cur.append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Mảng');
 const panes=[port,sea,wh],labels=['Cảng','Vận tải biển','Kho bãi'];
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
function ctBar(id,model){const host=document.getElementById(id);if(!host)return;if(window.ChartTypes)return ChartTypes.mount(host,{...model,native:'bar'},()=>{host.innerHTML=ChartTypes.render(model,'bar')});barLineChart(id,{...model,height:260})}
function stack(id,model){const host=document.getElementById(id);if(!host)return;if(window.ChartTypes)return ChartTypes.mount(host,{...model,native:'stack',stackable:true},()=>{host.innerHTML=ChartTypes.render(model,'stack')});barLineChart(id,{...model,height:260,rotateLabels:true})}

// XNK theo tháng (cầu của hàng container)
const ex=S('exports'),im=S('imports');
if(ex.length&&document.getElementById('chTrade')){
 const imm=byMonth(im),rs=ex.slice(-36);
 stack('chTrade',{categories:rs.map(r=>mon(r.date)),series:[{name:'Xuất khẩu',color:C.navy,values:rs.map(r=>r.value/1000)},{name:'Nhập khẩu',color:C.teal,values:rs.map(r=>imm[ym(r.date)]?imm[ym(r.date)].value/1000:null)}],unit:'tỷ USD',digits:1,aria:'Xuất nhập khẩu hàng hóa theo tháng'});
 legend('chTrade',[['Xuất khẩu',C.navy],['Nhập khẩu',C.teal]]);
 fillTable('tbl-trade',['Tháng','Xuất khẩu','Nhập khẩu','Tổng XNK','Tổng so cùng kỳ'],ex.slice().reverse().map(r=>{const i=imm[ym(r.date)]?.value,tot=i!=null?r.value+i:null,pr=ex.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7)),pi=pr?imm[ym(pr.date)]?.value:null;return [mon(r.date),nf(r.value/1000,2),nf(i/1000,2),nf(tot/1000,2),pr&&pi!=null&&tot!=null?signed((tot/(pr.value+pi)-1)*100,1)+'%':'—']}));
 sourceLine('chTrade',[SRC.customs,SRC.wi],mon(ex.at(-1).date),'Xuất khẩu (83479) và nhập khẩu (92728) hàng hóa, triệu USD đổi sang tỷ USD. Giá trị USD, không phải sản lượng container: giá hàng tăng (điện tử) làm kim ngạch tăng nhanh hơn TEU.');
 insight('chTrade','Kim ngạch XNK là chỉ báo cầu sớm nhất của cảng container, có hằng tháng trong khi sản lượng cảng chỉ công bố theo quý. Kim ngạch lũy kế 2026 tăng khoảng 30% trong khi TEU cả nước 5T chỉ +14% cho thấy phần lớn tăng trưởng đến từ hàng giá trị cao (điện tử, máy tính) ít container; vì vậy không suy thẳng TEU từ USD.');
}
// Hàng qua cảng toàn quốc (tài liệu)
if(document.getElementById('chThroughput')){
 const rows=[['2025','Hàng hóa',12],['2025','Container',11],['5T/2026','Hàng hóa',15],['5T/2026','Container',14]];
 ctBar('chThroughput',{categories:['2025','5T/2026'],series:[{name:'Hàng hóa (tấn)',color:C.navy,values:[12,15]},{name:'Container (TEU)',color:C.teal,values:[11,14]}],unit:'%',digits:0,aria:'Tăng trưởng hàng qua cảng'});
 legend('chThroughput',[['Hàng hóa (tấn)',C.navy],['Container (TEU)',C.teal]]);
 fillTable('tbl-throughput',['Kỳ','Hàng hóa','Container','Hàng hóa YoY','Container YoY'],[['5T/2026','>546 triệu tấn','>15 triệu TEU','+15%','+14%'],['2025','~1.170 triệu tấn','34,36 triệu TEU','+12%','+11%']]);
 sourceLine('chThroughput',[['Cục Hàng hải và Đường thủy 2025','https://vmrcc.gov.vn/tin-tuc/cuc-hang-hai-va-duong-thuy-viet-nam-to-chuc-hoi-nghi-tong-ket-cong-tac-nam-2025-va-trien-khai-ke-hoach-nam-2026-1907.html'],['Báo Chính phủ 5T/2026','https://baochinhphu.vn/giam-thu-tuc-hanh-chinh-hang-hoa-qua-cang-bien-tang-manh-102260528153427691.htm']],'5T/2026','Hai mốc công bố, % so cùng kỳ theo nguồn.',false);
 insight('chThroughput','Container tăng nhanh hơn năm 2025 (+14% so với +11%) là tín hiệu cầu tốt cho cảng tàu mẹ. Nhưng tăng trưởng đều cả nước không có nghĩa từng cảng đều tăng: cung mới ở Lạch Huyện hút hàng của cảng hạ lưu Hải Phòng.');
}
// Cước container Drewry
const wci=[['Thượng Hải – New York',10220],['Thượng Hải – Los Angeles',7624],['Thượng Hải – Genoa',3696],['Thượng Hải – Rotterdam',3337],['WCI tổng hợp',4351]];
if(document.getElementById('chWci')){
 hbarCompare('chWci',{items:wci.map(([l,v],i)=>({label:l.replace('Thượng Hải – ','TH – '),value:v,color:i===4?C.navy:C.teal})),unit:'USD/FEU',digits:0,labelW:150,ariaLabel:'Drewry WCI theo tuyến'});
 fillTable('tbl-wci',['Tuyến','USD/FEU · 08/10/2026'],wci.map(([l,v])=>[l,nf(v,0)]).concat([['SCFI (30/09, điểm)','3.662']]));
 sourceLine('chWci',[SRC.drewry],'08/10/2026','Giá giao ngay container 40 feet, công bố thứ Năm hằng tuần.',false);
 insight('chWci','Tuyến xuyên Thái Bình Dương đắt gấp 2–3 lần tuyến Á – Âu: hàng Việt Nam đi Mỹ là phần sinh lãi của hãng tàu nên hãng ưu tiên giữ tuyến tàu mẹ vào Cái Mép. Với HAH (nội Á) chỉ số này là chỉ báo gián tiếp; cước nội Á không có trong WCI.');
}
const wk=[['20/08',4526],['24/09',4468],['01/10',4434],['08/10',4351]];
if(document.getElementById('chWciWeeks')){
 barLineChart('chWciWeeks',{categories:wk.map(r=>r[0]),series:[{name:'WCI tổng hợp',color:C.navy,kind:'line',values:wk.map(r=>r[1])}],unit:'USD/FEU',digits:0,height:260,zeroBase:false,rotateLabels:false});
 fillTable('tbl-wci-weeks',['Tuần (2026)','USD/FEU'],wk.slice().reverse().map(r=>[r[0],nf(r[1],0)]));
 sourceLine('chWciWeeks',[SRC.drewry,['Hellenic Shipping News 20/08','https://www.hellenicshippingnews.com/?p=1144957']],'08/10/2026','Các tuần có số đã thu thập; không nối các tuần thiếu.',false);
 insight('chWciWeeks','Cước giảm nhẹ ba tuần liên tiếp quanh Golden Week; Drewry kỳ vọng ổn định ngắn hạn, rủi ro giảm nếu tàu quay lại Suez nhanh (giải phóng tàu, thừa cung). Cước giảm ảnh hưởng HAH trước, cảng sau, vì cảng thu theo container chứ không theo cước.');
}
// Khung giá bốc dỡ
if(document.getElementById('chTariff')){
 ctBar('chTariff',{categories:["Cont 20' · sàn","Cont 20' · trần","Cont 40' · sàn","Cont 40' · trần"],series:[{name:'TT 39/2023 (2024)',color:C.teal,values:[57,66,85,97]},{name:'Sửa QĐ 810 (02/2026)',color:C.navy,values:[63,73,94,107]}],unit:'USD',digits:0,aria:'Khung giá bốc dỡ container'});
 legend('chTariff',[['TT 39/2023 · từ 15/02/2024',C.teal],['Sửa QĐ 810 · từ 01/02/2026',C.navy]]);
 insight('chTariff','Hai lần tăng liên tiếp (~10% mỗi lần) nâng sàn giá tàu mẹ khoảng 21% so với 2023. Cảng nước sâu thường thu sát sàn vì cạnh tranh giành hãng tàu, nên mức sàn gần như là giá thực thu: đây là nguồn tăng doanh thu/TEU trực tiếp cho GMD (Gemalink), PHP (Lạch Huyện), SGP (liên doanh Cái Mép).');
}
// Chỉ số giá dịch vụ (Wi, quý)
const ph=S('ppi_handling'),pw=S('ppi_warehouse'),ps=S('ppi_sea');
if(ph.length&&document.getElementById('chPpi')){
 const wm=byMonth(pw),sm=byMonth(ps),rs=ph.slice(-16);
 barLineChart('chPpi',{categories:rs.map(r=>qtr(r.date)),series:[{name:'Bốc xếp',color:C.navy,kind:'line',values:rs.map(r=>r.value)},{name:'Kho bãi, hỗ trợ vận tải',color:C.teal,kind:'line',values:rs.map(r=>wm[ym(r.date)]?.value??null)},{name:'Vận tải ven biển, viễn dương',color:C.plum,kind:'line',values:rs.map(r=>sm[ym(r.date)]?.value??null)}],unit:'%',digits:1,height:260,zeroBase:false,rotateLabels:false});
 legend('chPpi',[['Bốc xếp',C.navy],['Kho bãi, hỗ trợ vận tải',C.teal],['Vận tải ven biển, viễn dương',C.plum]]);
 fillTable('tbl-ppi',['Quý','Bốc xếp','Kho bãi','Vận tải biển'],ph.slice().reverse().map(r=>[qtr(r.date),nf(r.value,2),nf(wm[ym(r.date)]?.value,2),nf(sm[ym(r.date)]?.value,2)]));
 sourceLine('chPpi',[SRC.nso,SRC.wi],qtr(ph.at(-1).date),'Chỉ số giá sản xuất dịch vụ so cùng kỳ: bốc xếp hàng hóa (75667), kho bãi và hỗ trợ vận tải (75665), vận tải ven biển và viễn dương (75662).');
 insight('chPpi','Giá bốc xếp toàn quốc tăng 3–4% YoY từ Q2/2026, thấp hơn mức +10% của khung giá tàu mẹ vì chỉ số tính cả cảng hạ lưu, hàng rời, nơi giá không tăng. Giá vận tải biển tăng 12% cho thấy cước, thuê tàu đang cao: thuận cho HAH, nhưng là chi phí cho chủ hàng.');
}
// Cạnh tranh Cái Mép
const cm=[['Gemalink (GMD)',523,17],['CMIT (SGP liên doanh)',371,14],['SSIT (SGP liên doanh)',269,47],['Bến khác (TCIT, TCTT…)',777,null]];
if(document.getElementById('chCaiMep')){
 hbarCompare('chCaiMep',{items:cm.map(([l,v],i)=>({label:l,value:v,color:[C.navy,C.teal,C.plum,C.grey][i]})),unit:'nghìn TEU',digits:0,labelW:170,ariaLabel:'Sản lượng các bến Cái Mép Q1/2026'});
 fillTable('tbl-caimep',['Bến','Nghìn TEU','So cùng kỳ','Tỷ trọng cụm'],cm.map(([l,v,g])=>[l,nf(v,0),g==null?'—':'+'+g+'%',nf(v/1940*100,0)+'%']));
 sourceLine('chCaiMep',[['SGGP · Đầu tư Tài chính','https://dttc.sggp.org.vn/cum-cang-cai-mep-thi-vai-don-nhan-gan-2-trieu-teu-sau-3-thang-post133521.html']],'Q1/2026','Tỷ trọng = sản lượng bến / tổng cụm 1,94 triệu TEU, tính từ hai số trong cùng bài.',false);
 insight('chCaiMep','Gemalink giữ khoảng 27% cụm; nhịp Q1 (523 nghìn TEU, quy năm ~2,1 triệu) đã vượt công suất thiết kế giai đoạn 1, nên Gemalink 2 (Q4/2027) là điều kiện để GMD tăng tiếp. SSIT tăng 47% vì nhận thêm tuyến mới: hãng tàu đang chia hàng cho nhiều bến, giới hạn khả năng tăng giá của từng bến.');
}
// Vận chuyển đường biển (Wi)
const sea=S('sea_freight'),ov=S('overseas_freight');
if(sea.length&&document.getElementById('chSea')){
 const om=byMonth(ov),rs=sea.slice(-36);
 barLineChart('chSea',{categories:rs.map(r=>mon(r.date)),series:[{name:'Đường biển',color:C.navy,values:rs.map(r=>r.value/1000)},{name:'Vận chuyển ngoài nước (mọi phương thức)',color:C.plum,kind:'line',values:rs.map(r=>om[ym(r.date)]?om[ym(r.date)].value/1000:null)}],unit:'triệu tấn',digits:1,height:260,rotateLabels:true});
 legend('chSea',[['Đường biển',C.navy],['Ngoài nước (mọi phương thức)',C.plum]]);
 fillTable('tbl-sea',['Tháng','Đường biển (triệu tấn)','So cùng kỳ','Ngoài nước (triệu tấn)'],sea.slice().reverse().map(r=>[mon(r.date),nf(r.value/1000,2),signed(yoyAt(sea,r),1)+'%',nf((om[ym(r.date)]?.value??NaN)/1000,2)]));
 sourceLine('chSea',[SRC.nso,SRC.wi],mon(sea.at(-1).date),'Khối lượng hàng hóa do doanh nghiệp vận tải Việt Nam chở bằng đường biển (82585) và vận chuyển ngoài nước (82583). Không phải hàng qua cảng: hãng tàu nước ngoài chở phần lớn hàng XNK.');
 insight('chSea','Chuỗi này đo việc làm của đội tàu Việt Nam (HAH, VOS, PVT…), không đo sản lượng cảng. Lũy kế 9T tăng gần 10% (chuyến ngoài nước +12%) nghĩa là đội tàu trong nước đang chạy đầy, hỗ trợ cước và giá thuê tàu nội Á.');
}
// BDI
const bdi=S('bdi');
if(bdi.length&&document.getElementById('chBdi')){
 barLineChart('chBdi',{categories:bdi.map(r=>mon(r.date)),series:[{name:'BDI',color:C.gold,kind:'line',values:bdi.map(r=>r.value)}],unit:'điểm',digits:0,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-bdi',['Kỳ','Điểm','So cùng kỳ'],bdi.slice().reverse().map(r=>[short(r.date),nf(r.value,0),signed(yoyAt(bdi,r),1)+'%']));
 sourceLine('chBdi',[SRC.baltic,SRC.wi],short(bdi.at(-1).date),'Baltic Dry Index (73982), Wi nén chuỗi ngày về điểm cuối tháng. Chỉ số tàu hàng rời, không dùng cho tàu container.');
 insight('chBdi','BDI đo cước hàng rời (than, quặng, ngũ cốc): liên quan tới cảng tổng hợp (CDN, SGP thép, PDN) hơn là cảng container. BDI cao hơn cùng kỳ khoảng 50% phản ánh cầu nguyên liệu và tàu chạy vòng xa.');
}
// Hàng không, thủy nội địa (Wi)
const air=S('air_freight');
if(air.length&&document.getElementById('chAir')){
 const rs=air.slice(-36);
 barLineChart('chAir',{categories:rs.map(r=>mon(r.date)),series:[{name:'Hàng không',color:C.teal,values:rs.map(r=>r.value)}],unit:'nghìn tấn',digits:1,height:260,rotateLabels:true});
 fillTable('tbl-air',['Tháng','Nghìn tấn','So cùng kỳ'],air.slice().reverse().map(r=>[mon(r.date),nf(r.value,1),signed(yoyAt(air,r),1)+'%']));
 sourceLine('chAir',[SRC.nso,SRC.wi],mon(air.at(-1).date),'Hàng hóa do hãng hàng không Việt Nam vận chuyển (82588). Không gồm hãng nước ngoài, nên không bằng sản lượng nhà ga SCS.');
 insight('chAir','Hãng Việt Nam chỉ chở một phần hàng quốc tế, nên chuỗi này là chỉ báo xu hướng chứ không phải sản lượng SCS. Lũy kế 9T chỉ +2% trong khi sản lượng SCS Q2/2026 giảm 8%: hàng quốc tế qua hãng nước ngoài (tuyến Trung Đông) là phần yếu.');
}
const inl=S('inland_freight');
if(inl.length&&document.getElementById('chInland')){
 const rs=inl.slice(-36);
 barLineChart('chInland',{categories:rs.map(r=>mon(r.date)),series:[{name:'Thủy nội địa',color:C.navy,values:rs.map(r=>r.value/1000)}],unit:'triệu tấn',digits:1,height:260,rotateLabels:true});
 fillTable('tbl-inland',['Tháng','Triệu tấn','So cùng kỳ'],inl.slice().reverse().map(r=>[mon(r.date),nf(r.value/1000,2),signed(yoyAt(inl,r),1)+'%']));
 sourceLine('chInland',[SRC.nso,SRC.wi],mon(inl.at(-1).date),'Hàng hóa vận chuyển đường thủy nội địa (82586), gồm cả vật liệu xây dựng, không riêng container.');
 insight('chInland','Sà lan là đường nối Cái Mép với Cát Lái, ICD Thủ Đức, Bình Dương: tăng nhanh nghĩa là hàng tàu mẹ cần nhiều kho bãi, depot (TCL, STG). Chuỗi gồm cả cát, đá xây dựng nên chỉ đọc xu hướng.');
}
// P/E ngành (Wi)
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['309','Cảng & dịch vụ hàng hải',C.navy],['186','Hỗ trợ vận tải đường thủy',C.teal],['185','Vận tải hàng hóa đường thủy',C.plum],['182','Logistics',C.gold]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/E '+name,color,kind:'line',values:weekly.map(d=>at(id,d,1))})),unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Phân ngành (GICS Wi)','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],[...ids,['183','Hỗ trợ vận tải hàng không']].filter(([id])=>sec[id]?.records?.length).map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],1),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[SRC.wi],short(dates.at(-1)),'Wi sector_ratio_daily: 309, 186, 185, 182 (bảng có thêm 183). Vẽ mỗi 5 phiên. Wi gán mã vào phân ngành theo cách riêng; định giá tổng hợp bị chi phối bởi mã lớn (GMD, PHP, HAH).');
 insight('chSectorVal','P/E nhóm cảng quanh 12 lần, thấp hơn đầu năm (14–15 lần) dù lợi nhuận 6T tăng mạnh: thị trường chiết khấu phần lãi một lần và rủi ro dư cung Hải Phòng. Nhóm hỗ trợ vận tải đường thủy P/E trên 20 lần là do vài mã vốn hóa lớn, không đại diện cả nhóm.');
}
// Dự án: công suất mới, vốn
const cap=[['2025',[['Lạch Huyện 3–4 (PHP)',1.1],['Lạch Huyện 5–6',1.8],['Nam Đình Vũ 3 (GMD)',0.65]]],['2027',[['Gemalink 2 (GMD, tăng thêm ước)',1.5],['Bạch Đằng (PHP)',0.7]]],['2028',[['Cái Mép Hạ GĐ1',2]]],['2030',[['Cần Giờ',4.8]]]];
if(document.getElementById('chNewCap')){
 const names=[...new Set(cap.flatMap(([,ps])=>ps.map(p=>p[0])))],colors=['#1D2678','#2938A8','#4354B7','#6171C5','#8997D6','#B3BDE8','#D9DEF4'];
 stack('chNewCap',{categories:cap.map(c=>c[0]),series:names.map((n,i)=>({name:n,color:colors[i%colors.length],values:cap.map(([,ps])=>ps.find(p=>p[0]===n)?.[1]??null)})),unit:'triệu TEU',digits:2,aria:'Công suất container mới theo năm'});
 legend('chNewCap',names.map((n,i)=>[n,colors[i%colors.length]]));
 fillTable('tbl-newcap',['Năm khai thác','Dự án','Triệu TEU/năm'],cap.flatMap(([y,ps])=>ps.map(p=>[y,p[0],nf(p[1],2)])));
 sourceLine('chNewCap',[['Tạp chí Công Thương','https://tapchicongthuong.vn/ben-so-3--4-lach-huyen-tao-cu-hich--cang-hai-phong--php--tang-toc-voi-loat-du-an-moi-525571.htm'],['Gemadept','https://www.gemadept.com.vn/en/groundbreaking-for-gemalink-deep-sea-port-phase-2-elevating-the-status-of-an-international-trade-gateway/'],['Tin nhanh chứng khoán','https://www.tinnhanhchungkhoan.vn/tphcm-thuc-nha-dau-tu-du-an-cang-quoc-te-can-gio-khoi-cong-trong-thang-10-post397552.html']],'09/10/2026','Năm khai thác dự kiến của chủ đầu tư; dự án chậm sẽ dời sang năm sau.',false);
 insight('chNewCap','Năm 2025 Hải Phòng nhận khoảng 3,5 triệu TEU công suất mới, bằng ~40% sản lượng cả cụm: đây là lý do cảng hạ lưu chịu áp lực giá dù cầu tăng 13%. Phía Nam cung mới dồn vào 2027–2030; nếu Cần Giờ đúng tiến độ, trung chuyển quốc tế là mảng mới chứ không chỉ chia hàng của Cái Mép.');
}
if(document.getElementById('chCapex')){
 const cx=[['Cần Giờ',128.873],['Cái Mép Hạ',50.2],['Lạch Huyện 7–8',12.793],['Lạch Huyện 5–6',8.951],['Gemalink 2',8.362],['Lạch Huyện 3–4',6.946],['Bạch Đằng',4.2],['Nam Đình Vũ 3',2.8]];
 hbarCompare('chCapex',{items:cx.map(([l,v],i)=>({label:l,value:v,color:i<2?C.navy:C.teal})),unit:'nghìn tỷ',digits:1,labelW:130,ariaLabel:'Vốn đầu tư dự án cảng'});
 sourceLine('chCapex',[['Tin nhanh chứng khoán','https://www.tinnhanhchungkhoan.vn/tphcm-thuc-nha-dau-tu-du-an-cang-quoc-te-can-gio-khoi-cong-trong-thang-10-post397552.html'],['Báo Đấu thầu','https://baodauthau.vn/chay-nuoc-rut-trien-khai-du-an-cang-bien-tai-tphcm-khong-de-nha-dau-tu-vuong-thu-tuc-post196899.html'],['Doanh nhân','https://doanhnhan.baophapluat.vn/viconship-vsc-muon-mua-65-von-mot-doanh-nghiep-de-thuc-hien-du-an-tai-hai-phong-84157.html']],'09/10/2026','Tổng mức đầu tư công bố, chưa phải vốn giải ngân. Lạch Huyện 3–8 từ đoạn trích.',false);
 insight('chCapex','Cần Giờ gần bằng tổng các dự án còn lại cộng lại. Với SGP (15%), phần góp 2.899 tỷ lớn so với lợi nhuận năm (~480 tỷ), nên cổ tức bị cắt; lợi ích chỉ đến sau 2030.');
}

// ---------- 4. KPIs, quick read, catalyst brief ----------
const sL=sea.at(-1),eL=ex.at(-1),aL=air.at(-1),bL=bdi.at(-1),pe=sec['309']?.records||[],peL=pe.at(-1);
const imL=eL?byMonth(im)[ym(eL.date)]:null,trade=eL&&imL?eL.value+imL.value:null;
const tradePrev=(()=>{if(!eL)return null;const k=String(Number(eL.date.slice(0,4))-1)+eL.date.slice(4,7),e=ex.find(r=>r.date.slice(0,7)===k),i=im.find(r=>r.date.slice(0,7)===k);return e&&i?e.value+i.value:null})();
const tradeY=trade&&tradePrev?(trade/tradePrev-1)*100:null;
kpi('spk-sea',sL?nf(sL.value/1000,1):'—',sL?'triệu tấn · '+mon(sL.date):'—',sL?signed(yoyAt(sea,sL),1)+'% so cùng kỳ':'',sea.slice(-12).map(r=>r.value));
kpi('spk-trade',trade?nf(trade/1000,1):'—',eL?'tỷ USD XNK · '+mon(eL.date):'—',tradeY!=null?signed(tradeY,1)+'% so cùng kỳ':'',ex.slice(-12).map(r=>r.value+(byMonth(im)[ym(r.date)]?.value||0)),C.plum);
kpi('spk-air',aL?nf(aL.value,1):'—',aL?'nghìn tấn · '+mon(aL.date):'—',aL?signed(yoyAt(air,aL),1)+'% so cùng kỳ':'',air.slice(-12).map(r=>r.value),C.teal);
const wsp=document.getElementById('spk-wci');if(wsp)sparkline('spk-wci',wk.map(r=>r[1]),C.gold);
kpi('spk-bdi',bL?nf(bL.value,0):'—',bL?'điểm · '+short(bL.date):'—',bL?signed(yoyAt(bdi,bL),0)+'% so cùng kỳ':'',bdi.slice(-12).map(r=>r.value),C.gold);
kpi('spk-pe',peL?nf(peL[1],1)+'x':'—',peL?'P/E cảng & dịch vụ hàng hải · '+short(peL[0]):'—',peL?'P/B '+nf(peL[2],2)+'x · vốn hóa '+nf(peL[3]/1000,1)+' nghìn tỷ':'',pe.slice(-30).map(r=>r[1]),C.grey);
const seaYtd=ytdYo(sea),tradeYtd=(()=>{const l=ex.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),sum=yy=>[...ex,...im].filter(r=>r.date.slice(0,4)===yy&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0),p=sum(String(y-1));return p?(sum(y)/p-1)*100:null})();
const quick=document.querySelector('.hero .insight');
if(quick&&eL){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu Wi: '),`XNK ${mon(eL.date)} ${nf(trade/1000,1)} tỷ USD (${signed(tradeY,1)}% YoY), lũy kế năm ${signed(tradeYtd,1)}%. `+(sL?`Vận chuyển đường biển ${mon(sL.date)} ${nf(sL.value/1000,1)} triệu tấn (${signed(yoyAt(sea,sL),1)}%), lũy kế ${signed(seaYtd,1)}%. `:'')+(bL?`BDI ${nf(bL.value,0)} điểm. `:'')+(peL?`P/E cảng ${nf(peL[1],1)}x.`:''));
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
// Catalyst brief: one tile per moving variable (rendered by catalyst-board.js).
const ppL=ph.at(-1),psL=ps.at(-1),pe0=pe[0];
const row=(group,name,big,evidence,cond,st,who,chart)=>({group,name,big,chart,st,mid:[evidence,cond],end:[who]});
const score=[
 row('Cầu & sản lượng','XNK tăng mạnh',[signed(tradeY,1)+'%','XNK '+(eL?mon(eL.date):'')+' YoY'],'XNK lũy kế '+signed(tradeYtd,1)+'% · container cả nước 5T/2026 +14%','XNK tháng < +5% YoY hai tháng liền',tradeY==null?'na':tradeY>10?'good':tradeY<0?'risk':'watch','▲ cả nhóm cảng · TCL · STG','chTrade'),
 row('Cầu & sản lượng','Đội tàu Việt Nam chạy đầy',[signed(seaYtd,1)+'%','đường biển lũy kế YoY'],'Vận chuyển đường biển '+(sL?mon(sL.date)+' '+signed(yoyAt(sea,sL),1)+'% YoY':'—'),'Lũy kế năm về dưới +5%',seaYtd==null?'na':seaYtd>8?'good':seaYtd<0?'risk':'watch','▲ HAH','chSea'),
 row('Cầu & sản lượng','Hàng không quốc tế yếu',['−8%','sản lượng SCS Q2/26'],'SCS quốc tế 50.163 tấn (−8%); hãng Việt Nam '+(aL?mon(aL.date)+' '+signed(yoyAt(air,aL),1)+'%':'—'),'Sản lượng SCS quý trở lại tăng YoY','risk','▼ SCS · SGN','chAir'),
 row('Giá & cạnh tranh','Giá bốc xếp tàu mẹ tăng',['+10%','khung giá sàn từ 01/02/2026'],'Cái Mép, Lạch Huyện 63–73 USD/20\'; chỉ số giá bốc xếp '+(ppL?qtr(ppL.date)+' '+signed(ppL.value,1)+'% YoY':'—'),'Cảng giảm giá dưới sàn hoặc khung giá bị hoãn','good','▲ GMD · PHP · SGP','chTariff'),
 row('Giá & cạnh tranh','Dư cung Hải Phòng',['+3,5','triệu TEU công suất mới 2025'],'Lạch Huyện 3–6, Nam Đình Vũ 3 so với sản lượng 8,35 triệu TEU (2025)','Sản lượng Hải Phòng tăng > 15% hấp thụ cung mới','risk','▲ PHP · GMD ▼ VSC · DVP','chNewCap'),
 row('Giá & cạnh tranh','Cước container giảm nhẹ',['4.351','USD/FEU WCI 08/10'],'WCI giảm 3 tuần liền; giá vận tải biển '+(psL?qtr(psL.date)+' '+signed(psL.value,1)+'% YoY':'—'),'WCI giảm > 15% trong một quý hoặc tàu quay lại Suez','watch','▼ HAH','chWciWeeks'),
 row('Cung mới phía Nam','Gemalink 2 · Cần Giờ',['Q4/2027','Gemalink 2 khai thác'],'Gemalink ~27% cụm Cái Mép; Cần Giờ 4,8 triệu TEU năm 2030, chưa khởi công','Cần Giờ khởi công đúng 10/2026; Cái Mép Hạ chậm','info','▲ GMD (2028) · SGP','chCaiMep'),
 row('Định giá','Định giá đã chiết khấu',[peL?nf(peL[1],1)+'x':'—','P/E cảng'],'P/E cảng '+(peL?nf(peL[1],1)+'x':'—')+(pe0?' (đầu kỳ '+nf(pe0[1],1)+'x, '+short(pe0[0])+')':''),'Lãi lõi quý III tăng tiếp khi bỏ thu nhập một lần',peL?'info':'na','GMD · PHP · VSC','chSectorVal')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.PORT_BRIEF={
 headline:'Cầu XNK và giá bốc xếp đỡ cảng nước sâu; dư cung Hải Phòng và Long Thành là hai rủi ro · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Cảng nước sâu','GMD · PHP · SGP',tradeY!=null&&tradeY>10?'up':'flat','Giá +10% · XNK '+signed(tradeY,0)+'%'],['Cảng hạ lưu','VSC · DVP · CDN · PDN','down','Cung mới Lạch Huyện'],['Vận tải biển','HAH',seaYtd!=null&&seaYtd>8?'up':'flat','Đường biển lũy kế '+signed(seaYtd,0)+'%'],['Hàng không','SCS · SGN','down','SCS −8% · Long Thành']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Đầu tháng','Hải quan, NSO: XNK, vận chuyển tháng trước'],['Thứ Năm','Drewry WCI'],['20–30/10','BCTC quý III'],['10/2026','Khởi công cảng Cần Giờ (dự kiến)'],['Q4/2027','Gemalink 2 khai thác']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ WiMCP lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; các lời gọi ghi trong data/port-wi-contract.json.';
})();
