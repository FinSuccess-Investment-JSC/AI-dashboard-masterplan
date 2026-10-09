/* Seafood dashboard: value chain, Cá tra / Tôm panes and charts from window.SEAFOOD_WI
   (scripts/build_seafood_wi.py from WiMCP captures) plus duty and VASEP figures backed by
   data/seafood/evidence.json. Publishes window.SEAFOOD_BRIEF for catalyst-board.js.
   Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='seafood')return;
const W=window.SEAFOOD_WI||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={customs:['Hải quan Việt Nam','https://www.customs.gov.vn/'],wi:['MCP Wi (Widata)',null]};
const S=k=>macro[k]?.records||com[k]?.records||[];
const ym=d=>d.slice(0,7);
const byMonth=rs=>{const m={};rs.forEach(r=>{m[ym(r.date)]=r});return m};
const yoyAt=(rs,r)=>{if(!r)return null;const p=rs.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};
const ytdYo=rs=>{const l=rs.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),sum=yy=>rs.filter(r=>r.date.slice(0,4)===yy&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0);const p=sum(String(y-1));return p?(sum(y)/p-1)*100:null};

// ---------- 1. Value chain ----------
const chain=document.querySelector('[data-block-id="ts-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='09/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['feed',25,40,['Thức ăn','khô đậu, ngô nhập · ANV, VHC tự làm']],['fry',315,40,['Giống & vùng nuôi','ĐBSCL · tự chủ một phần']],['pang',605,40,['Chế biến cá tra','VHC · ANV · IDI']],['buyer',895,40,['Nhà nhập khẩu','Mỹ · Trung Quốc · EU']],
  ['shrimpfarm',315,165,['Tôm nuôi','Cà Mau · Sóc Trăng · hộ nuôi']],['shrimp',605,165,['Chế biến tôm','FMC · MPC · CMX']],['rival',895,165,['Đối thủ','Ecuador · Ấn Độ']],
  ['us',605,290,['Thuế Mỹ','CBPG theo POR · CVD · Mục 301']],['asm',25,165,['Đa ngành','ASM (sở hữu IDI)']]
 ];
 const edges=[['feed','fry'],['fry','pang'],['pang','buyer'],['feed','shrimpfarm'],['shrimpfarm','shrimp'],['shrimp','buyer'],['rival','buyer',true],['us','shrimp',true],['asm','fry',true]];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b];let d;
  if(A[2]===Bn[2]){const fw=Bn[1]>A[1];d=`M${A[1]+(fw?w:0)} ${A[2]+h/2} H${Bn[1]+(fw?0:w)}`}
  else if(A[1]===Bn[1]){d=`M${A[1]+w/2} ${A[2]+(Bn[2]>A[2]?h:0)} V${Bn[2]+(Bn[2]>A[2]?0:h)}`}
  else{const fw=Bn[1]>A[1],x1=A[1]+(fw?w:0),y1=A[2]+h/2,x2=Bn[1]+(fw?0:w),y2=Bn[2]+h/2,mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`}
  return `<path d="${d}" class="chain-edge${dashed?' dashed':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t.replace(/&/g,'&amp;')}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1140 375" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành thủy sản</title><desc id="chain-desc">Thức ăn và giống vào vùng nuôi cá tra, tôm; nhà chế biến xuất khẩu sang Mỹ, Trung Quốc, EU; thuế Mỹ và đối thủ Ecuador, Ấn Độ tác động tới giá bán.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: nhà cá tra lớn (VHC, ANV) tự nuôi phần lớn cá và tự làm thức ăn, nên biên đi theo giá bán XK trừ giá khô đậu, ngô; nhà tôm mua tôm của hộ nuôi nên giá tôm nguyên liệu giảm là có lợi. Thuế CBPG của Mỹ áp riêng cho từng doanh nghiệp theo từng kỳ rà soát, nên cùng một ngành có mã chịu 0 (VHC) và mã chịu 0,84 USD/kg (ANV).'));
 figure.after(make('div','source-note','Mũi tên liền: dòng nguyên liệu và sản phẩm · Mũi tên đứt: thuế, cạnh tranh, sở hữu. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Panes ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead');
 const children=[...section.children].filter(e=>e!==head),pang=make('div','supply-pane'),shrimp=make('div','supply-pane');
 pang.id='supply-world';shrimp.id='supply-vietnam';
 let cur=pang;children.forEach(e=>{if(e.matches('h3.subhead')){cur=e.textContent.trim().startsWith('Tôm')?shrimp:pang;e.remove();return}cur.append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Chuỗi');
 const panes=[pang,shrimp],labels=['Cá tra','Tôm'];
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
const FR=n=>['Federal Register '+n,'https://www.federalregister.gov/d/'+n];

const ex=S('exp_seafood'),us=S('exp_us'),cn=S('exp_cn'),jp=S('exp_jp'),kr=S('exp_kr');
if(us.length&&document.getElementById('chMkt')){
 const em=byMonth(ex),cm=byMonth(cn),jm=byMonth(jp),km=byMonth(kr),rs=us.slice(-24),v=(m,r)=>m[ym(r.date)]?.value??null;
 const rest=rs.map(r=>{const t=v(em,r),c=v(cm,r),j=v(jm,r),k=v(km,r);return t!=null&&c!=null&&j!=null&&k!=null?t-r.value-c-j-k:null});
 stack('chMkt',{categories:rs.map(r=>mon(r.date)),series:[{name:'Trung Quốc',color:C.red,values:rs.map(r=>v(cm,r))},{name:'Mỹ',color:C.navy,values:rs.map(r=>r.value)},{name:'Nhật Bản',color:C.gold,values:rs.map(r=>v(jm,r))},{name:'Hàn Quốc',color:C.teal,values:rs.map(r=>v(km,r))},{name:'Khác (EU, ASEAN…)',color:C.grey,values:rest}],unit:'triệu USD',digits:0,aria:'Xuất khẩu thủy sản theo thị trường'});
 legend('chMkt',[['Trung Quốc',C.red],['Mỹ',C.navy],['Nhật Bản',C.gold],['Hàn Quốc',C.teal],['Khác (EU, ASEAN…)',C.grey]]);
 fillTable('tbl-mkt',['Tháng','Tổng','Trung Quốc','Mỹ','Nhật','Hàn','TQ YoY','Mỹ YoY'],us.slice().reverse().map(r=>[mon(r.date),nf(v(em,r),0),nf(v(cm,r),0),nf(r.value,0),nf(v(jm,r),0),nf(v(km,r),0),signed(yoyAt(cn,cm[ym(r.date)]),1)+'%',signed(yoyAt(us,r),1)+'%']));
 sourceLine('chMkt',[SRC.customs,SRC.wi],mon(us.at(-1).date),'XK hàng thủy sản (83499) và theo nước: Mỹ (87957), Trung Quốc (87997), Nhật (88726), Hàn (88042). Số theo nước có đến tháng 8; tổng có đến tháng 9. Gồm cả cá tra, tôm, hải sản khai thác.');
 insight('chMkt','Lũy kế 8T/2026: sang Trung Quốc '+signed(ytdYo(cn),0)+'%, sang Mỹ '+signed(ytdYo(us),0)+'%. Trung Quốc lớn hơn Mỹ và là thị trường lớn duy nhất tăng mạnh; thuế Mục 301 từ 24/07/2026 làm Mỹ khó phục hồi. Doanh nghiệp bán nhiều sang Trung Quốc (VHC +56% tháng 8) bù được phần mất ở Mỹ; doanh nghiệp phụ thuộc Mỹ thì không.');
}
if(us.length&&document.getElementById('chMktYear')){
 const sumY=(rs,y)=>{const m=rs.filter(r=>r.date.slice(0,4)===y);return m.length===12?m.reduce((a,r)=>a+r.value,0):null};
 const ys=[...new Set(us.map(r=>r.date.slice(0,4)))].filter(y=>sumY(us,y)!=null);
 const ser=[['Trung Quốc',cn,C.red],['Mỹ',us,C.navy],['Nhật Bản',jp,C.gold],['Hàn Quốc',kr,C.teal]];
 barLineChart('chMktYear',{categories:ys,series:ser.map(([n,rs,c])=>({name:n,color:c,kind:'line',values:ys.map(y=>sumY(rs,y))})),unit:'triệu USD',digits:0,height:260,zeroBase:true,rotateLabels:false});
 legend('chMktYear',ser.map(([n,,c])=>[n,c]));
 fillTable('tbl-mkt-year',['Năm',...ser.map(s=>s[0]),'Tổng thủy sản'],ys.slice().reverse().map(y=>[y,...ser.map(([,rs])=>nf(sumY(rs,y),0)),nf(sumY(ex,y),0)]));
 sourceLine('chMktYear',[SRC.customs,SRC.wi],ys.at(-1),'Cộng 12 tháng của các chỉ tiêu theo nước (87957, 87997, 88726, 88042). Năm hiện tại chưa đủ 12 tháng nên không vẽ.');
 const y1=ys.at(-1);insight('chMktYear','Năm '+y1+': Trung Quốc '+nf(sumY(cn,y1),0)+' so với Mỹ '+nf(sumY(us,y1),0)+' triệu USD. Mỹ từng là thị trường lớn nhất; khoảng cách giữa hai thị trường cho biết doanh nghiệp phụ thuộc Mỹ (thuế CBPG, Mục 301) có còn đường thay thế hay không.');
}
const pa=S('pangasius'),fry=S('pangasius_fry');
if(pa.length&&document.getElementById('chPang')){
 const fm=byMonth(fry);
 barLineChart('chPang',{categories:pa.map(r=>mon(r.date)),series:[{name:'Cá tra thịt trắng',color:C.navy,kind:'line',values:pa.map(r=>r.value)},{name:'Cá tra giống',color:C.gold,kind:'line',values:pa.map(r=>fm[ym(r.date)]?.value??null)}],unit:'nghìn đ/kg',digits:1,height:260,zeroBase:true,rotateLabels:true});
 legend('chPang',[['Cá nguyên liệu',C.navy],['Cá giống',C.gold]]);
 fillTable('tbl-pang',['Kỳ','Cá nguyên liệu','So cùng kỳ','Cá giống'],pa.slice().reverse().map(r=>[short(r.date),nf(r.value,1),signed(yoyAt(pa,r),1)+'%',nf(fm[ym(r.date)]?.value,0)]));
 sourceLine('chPang',[['Wi',null]],short(pa.at(-1).date),'Cá tra thịt trắng nguyên liệu (74384) và cá tra giống (264825), ĐBSCL, Wi nén về cuối tháng. Hai mắt xích khác nhau, không thay thế nhau.');
 insight('chPang','Cá nguyên liệu đi trong vùng 25–33 nghìn đ/kg từ 2023, trên giá thành nuôi 24–26 nghìn đ/kg (DN Hội nhập): hộ nuôi có lãi nên cung ổn định. Cá giống biến động mạnh theo mùa (cao đầu năm, thấp giữa năm); giá giống cao đầu 2026 báo hiệu thả nuôi nhiều, có thể làm cá nguyên liệu dồi dào hơn cuối năm.');
}
if(document.getElementById('chVasep')){
 ctBar('chVasep',{categories:['Tôm','Cá tra'],series:[{name:'8T/2026',color:C.navy,values:[3.2,1.5]}],unit:'tỷ USD',digits:1,aria:'XK tôm, cá tra 8T/2026'});
 fillTable('tbl-vasep',['Chỉ tiêu','Giá trị','So cùng kỳ'],[['XK thủy sản 8T/2026','8 tỷ USD','+11,8%'],['Tôm 8T/2026','3,2 tỷ USD','+12,3%'],['Cá tra 8T/2026','1,5 tỷ USD','+9%'],['Sang TQ + HK 8T/2026','2,03 tỷ USD','+33,4%'],['Sang Mỹ 8T/2026','1,24 tỷ USD','đi ngang'],['Dự báo cả năm 2026','>12 tỷ USD','—'],['Cá tra cả năm 2026 (kỳ vọng)','~2,3 tỷ USD','—']]);
 sourceLine('chVasep',[['MekongAsean – VASEP 8T','https://mekongasean.vn/xuat-khau-thuy-san-nam-2026-du-kien-vuot-moc-12-ty-usd-59256.html'],['Trung tâm WTO','https://trungtamwto.vn/tin-tuc/31929-nguon-cung-ca-thit-trang-giam-ca-tra-rong-duong-xuat-ngoai']],'8T/2026','VASEP tính theo mã HS của hiệp hội, khác chút với số hải quan tổng.',false);
 insight('chVasep','Tôm lớn gấp đôi cá tra và tăng nhanh hơn (+12% so với +9%). Cả hai đều dựa vào Trung Quốc: thị trường Mỹ đi ngang dù trước thuế Mục 301 nhiều nhà nhập khẩu đã đẩy đơn sớm.');
}
const sm=S('soymeal'),co=S('corn');
if(sm.length&&document.getElementById('chFeed')){
 const cm=byMonth(co),rs=sm.slice(-24);
 barLineChart('chFeed',{categories:rs.map(r=>mon(r.date)),series:[{name:'Khô đậu YoY',color:C.green,kind:'line',values:rs.map(r=>yoyAt(sm,r))},{name:'Ngô YoY',color:C.gold,kind:'line',values:rs.map(r=>yoyAt(co,cm[ym(r.date)]))}],unit:'%',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chFeed',[['Khô đậu CBOT',C.green],['Ngô CBOT',C.gold]]);
 fillTable('tbl-feed',['Kỳ','Khô đậu (USD/short ton)','Ngô (US cent/bushel)','Khô đậu YoY','Ngô YoY'],sm.slice().reverse().map(r=>{const c=cm[ym(r.date)];return [short(r.date),nf(r.value,1),nf(c?.value,1),signed(yoyAt(sm,r),1)+'%',signed(yoyAt(co,c),1)+'%']}));
 sourceLine('chFeed',[['CME/CBOT qua Wi',null]],short(sm.at(-1).date),'Khô đậu tương CBOT (203092), ngô CBOT (203105). Vẽ % so cùng kỳ vì khác đơn vị.');
 insight('chFeed','Khô đậu và ngô cùng tăng 13–16% YoY từ quý III: chi phí thức ăn cá tra tăng trong khi giá cá nguyên liệu đi ngang, khớp với biên gộp Q2 của ANV giảm còn 16,1%. Nhà tôm ít bị ảnh hưởng vì mua tôm của hộ nuôi.');
}
const sh=S('shrimp50');
if(sh.length&&document.getElementById('chShrimp')){
 barLineChart('chShrimp',{categories:sh.map(r=>mon(r.date)),series:[{name:'Tôm thẻ 50 con/kg',color:C.plum,kind:'line',values:sh.map(r=>r.value)}],unit:'nghìn đ/kg',digits:1,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-shrimp',['Kỳ','Nghìn đ/kg','So cùng kỳ'],sh.slice().reverse().map(r=>[short(r.date),nf(r.value,1),signed(yoyAt(sh,r),1)+'%']));
 sourceLine('chShrimp',[['Wi',null]],short(sh.at(-1).date),'Tôm thẻ chân trắng cỡ 50 con/kg tại Cà Mau (74379), Wi nén về cuối tháng. Không dùng chuỗi tôm không phân cỡ (264644) vì đứng yên nhiều tháng.');
 insight('chShrimp','Giá tôm nguyên liệu giảm từ đỉnh 146 nghìn đ/kg (12/2025) về ~108 nghìn: đầu vào rẻ hơn cho FMC, MPC, trong khi giá bán XK không giảm tương ứng — giải thích lợi nhuận 6T của FMC +81,5%, MPC +127,5% dù doanh thu FMC giảm.');
}
if(document.getElementById('chMkt2')){
 const cats=['Trung Quốc (+HK với tôm)','Mỹ','EU'];
 ctBar('chMkt2',{categories:cats,series:[{name:'Tôm',color:C.plum,values:[309,60,77]},{name:'Cá tra',color:C.navy,values:[94,38,26]}],unit:'triệu USD',digits:0,aria:'Tôm, cá tra 2T/2026 theo thị trường'});
 legend('chMkt2',[['Tôm',C.plum],['Cá tra',C.navy]]);
 fillTable('tbl-mkt2',['Thị trường','Tôm (triệu USD)','Tôm YoY','Cá tra (triệu USD)','Cá tra YoY'],[['Trung Quốc (tôm gồm HK)','309','+58%','94','+86%'],['Mỹ','~60','−22%','38','−5%'],['EU','77','+28%','26','+7%']]);
 sourceLine('chMkt2',[['Trung tâm WTO – tôm','https://trungtamwto.vn/tin-tuc/32016-xuat-khau-tom-sang-my-giam-sau-truoc-ap-luc-thue-quan-trung-quoc-thanh-luc-day-chinh'],['Trung tâm WTO – cá tra','https://trungtamwto.vn/chuyen-de/32000-trung-quoc-tiep-tuc-la-diem-den-lon-nhat-cua-ca-tra-viet-nam']],'2T/2026','Kỳ 2 tháng đầu năm (có Tết) — chỉ đọc cơ cấu, không ngoại suy cả năm.',false);
 insight('chMkt2','Ngay từ đầu năm, Trung Quốc đã chiếm gần một nửa tôm và hơn một nửa cá tra xuất đi, trong khi Mỹ giảm. Đây là dịch chuyển cơ cấu, không chỉ là mùa vụ.');
}
// Thuế
const pd=[['Nam Việt (ANV)',0,0.84],['Biên Đông',0,1.00],['NTSF',null,0.38],['CASEAMEX',0,0.84]];
if(document.getElementById('chPangDuty')){
 ctBar('chPangDuty',{categories:pd.map(r=>r[0]),series:[{name:'POR20 (cuối 06/2025)',color:C.teal,values:pd.map(r=>r[1])},{name:'POR21 (cuối 08/2026)',color:C.navy,values:pd.map(r=>r[2])}],unit:'USD/kg',digits:2,aria:'CBPG cá tra theo doanh nghiệp'});
 legend('chPangDuty',[['POR20',C.teal],['POR21',C.navy]]);
 fillTable('tbl-pangduty',['Doanh nghiệp','POR20','POR21'],pd.map(r=>[r[0],r[1]==null?'—':nf(r[1],2),nf(r[2],2)]).concat([['Mức toàn quốc','2,39','2,39'],['VHC','rút khỏi lệnh từ 24/01/2025',''],['IDI','—','rút khỏi kỳ rà soát']]));
 sourceLine('chPangDuty',[FR('2025-11205'),FR('2026-16553')],'13/08/2026','Biên độ CBPG theo USD/kg cá phi lê, áp từ ngày công bố kết quả cuối kỳ (tiền ký quỹ).',false);
 insight('chPangDuty','Từ 0 lên 0,84 USD/kg là khoản tiền ký quỹ đáng kể trên mỗi kg phi lê bán sang Mỹ, đẩy ANV sang Trung Quốc, Brazil. VHC không còn trong lệnh nên lợi thế cạnh tranh tại Mỹ lớn lên.');
}
if(document.getElementById('chShrimpDuty')){
 const items=[['VN · POR19 sơ bộ Sao Ta',10.76],['VN · POR18 mức riêng',4.58],['VN · CVD (DN khác)',2.84],['Ấn Độ · CBPG all-others',10.17],['Ấn Độ · CBPG DN không kiểm',5.53],['Ecuador · CVD all-others',3.78]];
 hbarCompare('chShrimpDuty',{items:items.map(([l,v])=>({label:l,value:v,color:l.startsWith('VN')?C.navy:C.grey})),unit:'%',digits:2,labelW:190,ariaLabel:'Thuế tôm vào Mỹ'});
 fillTable('tbl-shrimpduty',['Nước · vụ','%','Nguồn'],items.map(([l,v])=>[l,nf(v,2),'']).concat([['Ecuador · CBPG','phủ định (không có lệnh)','']]));
 sourceLine('chShrimpDuty',[FR('2026-09465'),FR('2026-03511'),FR('2026-18184'),['govinfo – Ecuador CVD','https://govinfo.gov/content/pkg/FR-2024-10-28/pdf/2024-24957.pdf'],['Viet Nam News – CVD VN','https://vietnamnews.vn/economy/1665711/us-issues-final-affirmative-countervailing-duty-determination-on-frozen-warmwater-shrimp-from-viet-nam.html']],'13/05/2026','Mỗi cột là một mức riêng, khác kỳ và khác loại thuế (CBPG, CVD); không cộng để ra tổng thuế. Chưa gồm Mục 301 (12,5%, Việt Nam) và thuế đối ứng của các nước.',false);
 insight('chShrimpDuty','Mức CBPG sơ bộ POR19 của Sao Ta (10,76%) cao hơn hẳn Ecuador (không có CBPG, CVD 3,78%) và ngang mức all-others của Ấn Độ. Cộng thêm Mục 301 12,5%, tôm Việt Nam vào Mỹ đắt hơn Ecuador đáng kể — lý do XK tôm sang Mỹ giảm và chuyển sang Trung Quốc.');
}
// Định giá
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['238','Thủy sản',C.navy],['235','Thức ăn chăn nuôi',C.gold]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/E '+name,color,kind:'line',values:weekly.map(d=>at(id,d,1))})),unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Phân ngành (GICS Wi)','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],1),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[SRC.wi],short(dates.at(-1)),'Wi sector_ratio_daily: nuôi trồng và chế biến thủy sản (238), thức ăn chăn nuôi (235). Vẽ mỗi 5 phiên.');
 insight('chSectorVal','P/E thủy sản giảm từ ~23 lần đầu 2025 về ~11 lần: lợi nhuận phục hồi nhanh hơn giá cổ phiếu, và thị trường chiết khấu thuế Mỹ (Mục 301, CBPG POR21).');
}

// ---------- 4. KPIs, quick read, catalyst brief ----------
const eL=ex.at(-1),cL=cn.at(-1),uL=us.at(-1),pL=pa.at(-1),sL=sh.at(-1),pe=sec['238']?.records||[],peL=pe.at(-1),pe0=pe[0];
kpi('spk-exp',eL?nf(eL.value,0):'—',eL?'triệu USD · '+mon(eL.date):'—',eL?signed(yoyAt(ex,eL),1)+'% so cùng kỳ':'',ex.slice(-12).map(r=>r.value));
kpi('spk-cn',cL?nf(cL.value,0):'—',cL?'triệu USD · '+mon(cL.date):'—',cL?'lũy kế '+signed(ytdYo(cn),1)+'%':'',cn.slice(-12).map(r=>r.value),C.red);
kpi('spk-us',uL?nf(uL.value,0):'—',uL?'triệu USD · '+mon(uL.date):'—',uL?'lũy kế '+signed(ytdYo(us),1)+'%':'',us.slice(-12).map(r=>r.value));
kpi('spk-pang',pL?nf(pL.value,1):'—',pL?'nghìn đ/kg · '+short(pL.date):'—',pL?signed(yoyAt(pa,pL),1)+'% so cùng kỳ':'',pa.slice(-12).map(r=>r.value),C.navy);
kpi('spk-shrimp',sL?nf(sL.value,1):'—',sL?'nghìn đ/kg · '+short(sL.date):'—',sL?signed(yoyAt(sh,sL),1)+'% so cùng kỳ':'',sh.slice(-12).map(r=>r.value),C.plum);
kpi('spk-pe',peL?nf(peL[1],1)+'x':'—',peL?'P/E thủy sản · '+short(peL[0]):'—',peL?'P/B '+nf(peL[2],2)+'x':'',pe.slice(-30).map(r=>r[1]),C.grey);
const quick=document.querySelector('.hero .insight');
if(quick&&eL){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu Wi: '),`XK thủy sản ${mon(eL.date)} ${nf(eL.value,0)} triệu USD (${signed(yoyAt(ex,eL),1)}%), lũy kế ${signed(ytdYo(ex),1)}%. Sang Trung Quốc lũy kế ${signed(ytdYo(cn),0)}%, sang Mỹ ${signed(ytdYo(us),0)}% (đến ${uL?mon(uL.date):''}). Cá tra nguyên liệu ${nf(pL?.value,1)}, tôm thẻ 50 con ${nf(sL?.value,1)} nghìn đ/kg. Khô đậu ${signed(yoyAt(sm,sm.at(-1)),0)}% YoY.`);
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
const cnY=ytdYo(cn),usY=ytdYo(us),smY=yoyAt(sm,sm.at(-1)),shY=yoyAt(sh,sL);
const row=(group,name,big,evidence,cond,st,who,chart)=>({group,name,big,chart,st,mid:[evidence,cond],end:[who]});
const score=[
 row('Thị trường','Trung Quốc tăng mạnh',[signed(cnY,0)+'%','XK sang TQ lũy kế'],'XK sang TQ '+(cL?mon(cL.date)+' '+nf(cL.value,0)+' triệu USD':'—')+'; VHC TQ tháng 8 +56%','XK sang TQ lũy kế về dưới +10%',cnY==null?'na':cnY>15?'good':cnY<0?'risk':'watch','▲ VHC · ANV · MPC','chMkt'),
 row('Thị trường','Mỹ không tăng',[signed(usY,0)+'%','XK sang Mỹ lũy kế'],'Mục 301 +12,5% từ 24/07/2026; VHC Mỹ tháng 8 −15%','XK sang Mỹ trở lại tăng > 5% YoY',usY==null?'na':usY<3?'risk':'watch','▼ cả ngành','chMkt'),
 row('Thuế Mỹ','CBPG cá tra tăng ở POR21',['0,84','USD/kg ANV (từ 0)'],'Biên Đông 1,00; NTSF 0,38; VHC đã rút khỏi lệnh','Kỳ POR22 về 0','risk','▼ ANV · ▲ VHC (tương đối)','chPangDuty'),
 row('Thuế Mỹ','CBPG tôm POR19 cao hơn',['10,76%','Sao Ta sơ bộ (POR18: 4,58%)'],'Ecuador không có CBPG, CVD 3,78%','Kết luận cuối POR19 thấp hơn sơ bộ','risk','▼ FMC','chShrimpDuty'),
 row('Chi phí','Thức ăn cá tra tăng',[signed(smY,0)+'%','khô đậu YoY'],'Ngô '+signed(yoyAt(co,co.at(-1)),0)+'% YoY; ANV biên gộp Q2 16,1%','Khô đậu, ngô về âm YoY',smY==null?'na':smY>10?'risk':smY<0?'good':'watch','▼ ANV · VHC · IDI','chFeed'),
 row('Chi phí','Tôm nguyên liệu rẻ',[signed(shY,0)+'%','tôm thẻ 50 con YoY'],'Từ đỉnh 146 nghìn đ/kg (12/2025) về '+(sL?nf(sL.value,1):'—'),'Giá tôm nguyên liệu tăng lại > 120 nghìn',shY==null?'na':shY<-5?'good':shY>10?'risk':'watch','▲ FMC · MPC','chShrimp'),
 row('Định giá','Định giá đã hạ',[peL?nf(peL[1],1)+'x':'—','P/E thủy sản'],'P/E '+(peL?nf(peL[1],1)+'x':'—')+(pe0?' (đầu kỳ '+nf(pe0[1],1)+'x, '+short(pe0[0])+')':''),'Lợi nhuận quý III giảm do thuế Mỹ',peL?'info':'na','VHC · ANV · FMC · MPC','chSectorVal')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.SEAFOOD_BRIEF={
 headline:'Trung Quốc kéo tăng trưởng, tôm nguyên liệu rẻ giúp nhà tôm; thuế Mỹ (Mục 301, CBPG) và thức ăn đắt ép cá tra · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Cá tra','VHC · ANV · IDI',smY!=null&&smY>10?'down':'flat','Thức ăn '+signed(smY,0)+'% · CBPG POR21'],['Tôm','FMC · MPC · CMX',shY!=null&&shY<-5?'up':'flat','Tôm nguyên liệu '+signed(shY,0)+'%'],['Đa ngành','ASM','flat','Lãi vay cao']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Đầu tháng','Hải quan, VASEP: XK tháng trước'],['Hằng tháng','VHC, FMC công bố doanh số tháng'],['20–30/10','BCTC quý III'],['Theo lịch DOC','Kết luận cuối POR19 tôm; POR22 cá tra']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ WiMCP lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; các lời gọi ghi trong data/seafood-wi-contract.json.';
})();
