/* Seafood dashboard: value chain, Cá tra / Tôm panes and charts from window.SEAFOOD_PUBLIC
   (scripts/build_sector_public.py: public commodity series only) plus duty and VASEP figures backed by
   data/seafood/evidence.json. Publishes window.SEAFOOD_BRIEF for catalyst-board.js.
   Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='seafood')return;
const W=window.SEAFOOD_PUBLIC||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={vasep:['VASEP · giá nguyên liệu thủy sản Đồng Tháp','https://vasep.com.vn/gia-thuy-san/gia-trong-nuoc'],ice:['IMF Primary Commodity Prices (FRED)','https://fred.stlouisfed.org/'],customs:['Hải quan Việt Nam','https://www.customs.gov.vn/'],wi:['Nguồn công khai',null]};
for(const v of Object.values(macro)){if(/nso\.gov\.vn\/wp-content/.test(v.url||'')&&SRC.nso)SRC.nso=[SRC.nso[0],v.url];if(/customs/.test(v.url||'')&&SRC.customs)SRC.customs=[SRC.customs[0],v.url]}
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
 n.append(` · Kỳ cuối: ${period}`+(wi?` · Kiểm: ${checked?short(checked.slice(0,4)+'-'+checked.slice(4,6)+'-'+checked.slice(6,8)):'—'}`:''));host.after(n);
 if(method)n.after(make('div','source-note method-note',method));
 if(block&&wi){block.dataset.refreshStatus='loaded';block.dataset.sourceIds='public'}
}
function insight(id,text){const block=document.getElementById(id)?.closest('.card');if(!block)return;const n=make('div','chart-insight');n.dataset.inputOwner='ai';n.innerHTML='<b>Cách hiểu trong bối cảnh ngành · AI:</b> ';n.append(text);block.append(n)}
function legend(id,items){const host=document.getElementById(id);if(!host)return;const l=make('div','legend');items.forEach(([n,c])=>{const s=make('span','li'),d=make('span','dot');d.style.background=c;s.append(d,n);l.append(s)});host.after(l)}
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;const ve=card.querySelector('.value'),seg=String(sub??'').split(' · '),hasU=value!=='—'&&seg.length>1&&/^(nghìn|triệu|tỷ|USD|CNY|VND|US cent|điểm|lượt)/.test(seg[0]);ve.textContent=value;if(hasU){const u=document.createElement('span');u.className='unit';u.style.cssText='font-size:12px;font-weight:600;color:var(--muted,#6b7a90);margin-left:6px;letter-spacing:0';u.textContent=seg[0];ve.append(u)}card.querySelector('.sub').textContent=hasU?seg.slice(1).join(' · '):sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();const sv=(series||[]).filter(Number.isFinite);if(sv.length>1)sparkline(spark,sv,color)}
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
 sourceLine('chMkt',[SRC.customs],mon(us.at(-1).date),'XK hàng thủy sản và theo nước: Mỹ, Trung Quốc, Nhật, Hàn. Số theo nước có đến tháng 8; tổng có đến tháng 9. Gồm cả cá tra, tôm, hải sản khai thác.');
 insight('chMkt','Lũy kế 8T/2026: sang Trung Quốc '+signed(ytdYo(cn),0)+'%, sang Mỹ '+signed(ytdYo(us),0)+'%. Trung Quốc lớn hơn Mỹ và là thị trường lớn duy nhất tăng mạnh; thuế Mục 301 từ 24/07/2026 làm Mỹ khó phục hồi. Doanh nghiệp bán nhiều sang Trung Quốc (VHC +56% tháng 8) bù được phần mất ở Mỹ; doanh nghiệp phụ thuộc Mỹ thì không.');
}
if(us.length&&document.getElementById('chMktYear')){
 const sumY=(rs,y)=>{const m=rs.filter(r=>r.date.slice(0,4)===y);return m.length===12?m.reduce((a,r)=>a+r.value,0):null};
 const ys=[...new Set(us.map(r=>r.date.slice(0,4)))].filter(y=>sumY(us,y)!=null);
 const ser=[['Trung Quốc',cn,C.red],['Mỹ',us,C.navy],['Nhật Bản',jp,C.gold],['Hàn Quốc',kr,C.teal]];
 barLineChart('chMktYear',{categories:ys,series:ser.map(([n,rs,c])=>({name:n,color:c,kind:'line',values:ys.map(y=>sumY(rs,y))})),unit:'triệu USD',digits:0,height:260,zeroBase:true,rotateLabels:false});
 legend('chMktYear',ser.map(([n,,c])=>[n,c]));
 fillTable('tbl-mkt-year',['Năm',...ser.map(s=>s[0]),'Tổng thủy sản'],ys.slice().reverse().map(y=>[y,...ser.map(([,rs])=>nf(sumY(rs,y),0)),nf(sumY(ex,y),0)]));
 sourceLine('chMktYear',[SRC.customs],ys.at(-1),'Cộng 12 tháng của các chỉ tiêu theo nước. Năm hiện tại chưa đủ 12 tháng nên không vẽ.');
 const y1=ys.at(-1);insight('chMktYear','Năm '+y1+': Trung Quốc '+nf(sumY(cn,y1),0)+' so với Mỹ '+nf(sumY(us,y1),0)+' triệu USD. Mỹ từng là thị trường lớn nhất; khoảng cách giữa hai thị trường cho biết doanh nghiệp phụ thuộc Mỹ (thuế CBPG, Mục 301) có còn đường thay thế hay không.');
}
const pa=S('pangasius'),fry=S('pangasius_fry');
if(pa.length&&document.getElementById('chPang')){
 const fm=byMonth(fry);
 barLineChart('chPang',{categories:pa.map(r=>mon(r.date)),series:[{name:'Cá tra thịt trắng',color:C.navy,kind:'line',values:pa.map(r=>r.value)},{name:'Cá tra giống',color:C.gold,kind:'line',values:pa.map(r=>fm[ym(r.date)]?.value??null)}],unit:'nghìn đ/kg',digits:1,height:260,zeroBase:true,rotateLabels:true});
 legend('chPang',[['Cá nguyên liệu',C.navy],['Cá giống',C.gold]]);
 fillTable('tbl-pang',['Kỳ','Cá nguyên liệu','So cùng kỳ','Cá giống'],pa.slice().reverse().map(r=>[short(r.date),nf(r.value,1),signed(yoyAt(pa,r),1)+'%',nf(fm[ym(r.date)]?.value,0)]));
 sourceLine('chPang',[SRC.vasep],short(pa.at(-1).date),'VASEP, giá tại Đồng Tháp theo tuần, điểm giữa khoảng giá: cá tra thịt trắng 0,7–1 kg/con và cá tra giống. Hai mắt xích khác nhau, không thay thế nhau.');
 insight('chPang','Cá nguyên liệu đi trong vùng 25–33 nghìn đ/kg từ 2023, trên giá thành nuôi 24–26 nghìn đ/kg (DN Hội nhập): hộ nuôi có lãi nên cung ổn định. Cá giống biến động mạnh theo mùa (cao đầu năm, thấp giữa năm); giá giống cao đầu 2026 báo hiệu thả nuôi nhiều, có thể làm cá nguyên liệu dồi dào hơn cuối năm.');
}
const VA=['VASEP – XK thủy sản 10 tháng (04/11/2026)','https://vasep.com.vn/san-pham-xuat-khau/tin-tong-hop/xuat-nhap-khau/xuat-khau-thuy-san-10-thang-vuot-10-4-ty-usd-tang-truong-kha-nhung-tom-va-thi-truong-my-chung-lai-38645.html'];
if(document.getElementById('chVasep')){
 ctBar('chVasep',{categories:['Tôm','Cá tra','Cá ngừ'],series:[{name:'10T/2026',color:C.navy,values:[4.2199,2.0,0.8172]}],unit:'tỷ USD',digits:2,aria:'XK tôm, cá tra, cá ngừ 10T/2026'});
 fillTable('tbl-vasep',['Chỉ tiêu','10T/2026','So cùng kỳ'],[['XK thủy sản','10,459 tỷ USD','+12,1%'],['Tháng 10/2026 (ước)','1,315 tỷ USD','+13,5%'],['Tôm các loại','4,22 tỷ USD','+9,0%'],['Cá tra','tiến sát 2 tỷ USD','+11%'],['Cá ngừ','817 triệu USD','+5,1%']]);
 sourceLine('chVasep',[VA],'10T/2026','Số VASEP (theo mã HS của hiệp hội, khác chút số hải quan tổng). Cá tra VASEP ghi "tiến sát 2 tỷ USD", vẽ 2,0.',false);
 insight('chVasep','Tôm vẫn lớn gấp đôi cá tra nhưng tăng chậm hơn (+9% so với +11%); VASEP ghi XK tôm tháng 10 giảm. Tăng trưởng 10 tháng dựa vào nhóm cá và thị trường châu Á.');
}
if(document.getElementById('chMkt2')){
 const cats=['Trung Quốc + HK','Mỹ','ASEAN'];
 ctBar('chMkt2',{categories:cats,series:[{name:'10T/2026',color:C.navy,values:[2.62,1.63,0.722]}],unit:'tỷ USD',digits:2,aria:'XK thủy sản 10T/2026 theo thị trường'});
 fillTable('tbl-mkt2',['Thị trường','10T/2026','So cùng kỳ'],[['Trung Quốc + Hồng Kông','2,62 tỷ USD','+30,3%'],['Mỹ','1,63 tỷ USD','−1,2% (tháng 10 −11,8%)'],['ASEAN','722 triệu USD','+22,9%'],['EU','—','+1,1%'],['Nhật Bản','—','+2,8%']]);
 sourceLine('chMkt2',[VA],'10T/2026','VASEP không nêu kim ngạch EU, Nhật trong bài (chỉ %), nên không vẽ hai thị trường này.',false);
 insight('chMkt2','Trung Quốc – Hồng Kông lớn hơn Mỹ 1,6 lần và tăng 30%, Mỹ chuyển sang giảm (tháng 10 −11,8%): dịch chuyển cơ cấu tiếp diễn sau Mục 301.');
}
const sm=S('soymeal'),co=S('corn');
if(sm.length&&document.getElementById('chFeed')){
 const cm=byMonth(co),rs=sm.slice(-24);
 barLineChart('chFeed',{categories:rs.map(r=>mon(r.date)),series:[{name:'Khô đậu YoY',color:C.green,kind:'line',values:rs.map(r=>yoyAt(sm,r))},{name:'Ngô YoY',color:C.gold,kind:'line',values:rs.map(r=>yoyAt(co,cm[ym(r.date)]))}],unit:'%',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chFeed',[['Khô đậu (IMF)',C.green],['Ngô (IMF)',C.gold]]);
 fillTable('tbl-feed',['Kỳ','Khô đậu (USD/tấn)','Ngô (US cent/bushel)','Khô đậu YoY','Ngô YoY'],sm.slice().reverse().map(r=>{const c=cm[ym(r.date)];return [short(r.date),nf(r.value,1),nf(c?.value,1),signed(yoyAt(sm,r),1)+'%',signed(yoyAt(co,c),1)+'%']}));
 sourceLine('chFeed',[SRC.ice],short(sm.at(-1).date),'IMF Primary Commodity Prices (FRED): khô đậu tương PSMEAUSDM (USD/tấn), ngô PMAIZMTUSDM quy sang US cent/bushel; bình quân tháng. Vẽ % so cùng kỳ vì khác đơn vị.');
 insight('chFeed','Khô đậu '+signed(yoyAt(sm,sm.at(-1)),1)+'% và ngô '+signed(yoyAt(co,co.at(-1)),1)+'% so cùng kỳ ('+mon(sm.at(-1).date)+'): đầu vào thức ăn của cá tra.');
}
const sh=S('shrimp50'),cm50=S('shrimp50_camau'),shSize=(B.commodity?.series?.shrimp50)?.size||'50–100 con/kg';
if((sh.length||cm50.length)&&document.getElementById('chShrimp')){
 const a=byMonth(sh),b=byMonth(cm50),months=[...new Set([...sh,...cm50].map(r=>ym(r.date)))].sort().slice(-36);
 barLineChart('chShrimp',{categories:months.map(m=>mon(m+'-01')),series:[{name:'Cà Mau 50 con/kg (Wi)',color:C.plum,kind:'line',values:months.map(m=>b[m]?.value??null)},{name:'Đồng Tháp '+shSize+' (VASEP)',color:C.gold,kind:'line',values:months.map(m=>a[m]?.value??null)}],unit:'nghìn đ/kg',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chShrimp',[['Cà Mau 50 con/kg · Wi',C.plum],['Đồng Tháp '+shSize+' · VASEP',C.gold]]);
 fillTable('tbl-shrimp',['Tháng','Cà Mau 50 con (Wi)','So cùng kỳ','Đồng Tháp (VASEP)','So cùng kỳ'],months.slice().reverse().map(m=>[mon(m+'-01'),nf(b[m]?.value,1),signed(yoyAt(cm50,b[m]),1)+'%',nf(a[m]?.value,1),signed(yoyAt(sh,a[m]),1)+'%']));
 sourceLine('chShrimp',[['WiData 74379 (Cà Mau 50 con/kg)','https://widata.vn/'],SRC.vasep],(cm50.length?'Cà Mau '+short(cm50.at(-1).date):'')+(sh.length?' · Đồng Tháp '+short(sh.at(-1).date):''),'Hai chuỗi khác vùng và cỡ: Wi 74379 tôm thẻ 50 con/kg Cà Mau (giá ngày, Wi nén về cuối tháng); VASEP tôm chân trắng Đồng Tháp cỡ '+shSize+', điểm giữa khoảng giá theo tuần (khoảng cỡ rộng nên ít nhạy).');
 {const L=cm50.at(-1),V=sh.at(-1);insight('chShrimp',(L?'Cà Mau 50 con '+nf(L.value,1)+' nghìn đ/kg ('+short(L.date)+', '+signed(yoyAt(cm50,L),0)+'% YoY)':'')+(V?'; Đồng Tháp '+nf(V.value,1)+' ('+short(V.date)+')':'')+'. Tôm nguyên liệu là chi phí chính của FMC, MPC (mua của hộ nuôi): giá nguyên liệu giảm nhanh hơn giá bán XK thì biên mở rộng.')}
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
 fillTable('tbl-sector-val',['Rổ mã','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],1),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[['VNDirect finfo','https://dstock.vndirect.com.vn/']],short(dates.at(-1)),'Rổ mã theo dõi: Thủy sản (VHC, ANV, IDI, FMC, MPC, CMX, ASM); Thức ăn chăn nuôi (DBC). P/E = tổng vốn hóa / tổng lợi nhuận (vốn hóa ÷ P/E từng mã, VNDirect); mã lỗ không có P/E chỉ vào P/B và vốn hóa. Không phải toàn ngành. Vẽ mỗi 5 phiên.');
 insight('chSectorVal',(()=>{const L=ids.filter(([id])=>sec[id]?.records?.length);const l0=sec[L[0][0]].records.at(-1);return 'P/E rổ mã theo dõi, phiên '+short(l0[0])+': '+L.map(([id,name])=>{const r=sec[id].records,l=r.at(-1),y=r.find(x=>x[0]>=String(+l[0].slice(0,4)-1)+l[0].slice(4));return name+' '+nf(l[1],(1==2?2:1))+'x'+(y&&y[1]!=null?' (1 năm trước '+nf(y[1],(1==2?2:1))+'x)':'')}).join('; ')+'.'})());
}

// ---------- 3b. Giá – Chi phí – Margin, thị phần Mỹ, lịch POR (đợt 1, 05/11/2026) ----------
const fxm=byMonth(S('usdvnd')),eum=byMonth(S('eurusd')),FP=B.fao_fpma?.series||{};
// Spread cá tra: đơn giá NK của EU (HS 0304 từ VN) − cá nguyên liệu quy ra 1 kg phi lê − CBPG theo DN.
const PANG={yield:2.7,duty:{VHC:0,ANV:0.84}};
let spr=[];
{const ev=byMonth(S('eu_imp_0304_vn_eur')),ek=byMonth(S('eu_imp_0304_vn_kg')),pm=byMonth(pa);
 spr=Object.keys(ev).sort().map(m=>{const v=ev[m]?.value,k=ek[m]?.value,e=eum[m]?.value,f=fxm[m]?.value,fish=pm[m]?.value;if(!v||!k||!e||!f||!fish)return null;
  const eur=v/k,usd=eur*e,raw=fish*1000*PANG.yield/f;return {m,eur,usd,raw,vhc:usd-raw-PANG.duty.VHC,anv:usd-raw-PANG.duty.ANV}}).filter(Boolean).slice(-36);}
if(spr.length&&document.getElementById('chPangSpread')){
 barLineChart('chPangSpread',{categories:spr.map(r=>mon(r.m+'-01')),series:[{name:'Đơn giá NK EU (HS 0304 từ VN)',color:C.navy,kind:'line',values:spr.map(r=>r.usd)},{name:'Cá nguyên liệu / kg phi lê',color:C.gold,kind:'line',values:spr.map(r=>r.raw)},{name:'Spread VHC (CBPG 0)',color:C.green,kind:'line',values:spr.map(r=>r.vhc)},{name:'Spread ANV nếu bán Mỹ (−0,84)',color:C.red,kind:'line',values:spr.map(r=>r.anv)}],unit:'USD/kg',digits:2,height:260,zeroBase:true,rotateLabels:true});
 legend('chPangSpread',[['Đơn giá EU',C.navy],['Cá nguyên liệu/kg phi lê',C.gold],['Spread VHC',C.green],['Spread ANV (CBPG 0,84)',C.red]]);
 fillTable('tbl-pang-spread',['Tháng','EUR/kg','USD/kg','Cá NL quy USD/kg phi lê','Spread VHC','Spread ANV'],spr.slice().reverse().map(r=>[mon(r.m+'-01'),nf(r.eur,2),nf(r.usd,2),nf(r.raw,2),nf(r.vhc,2),nf(r.anv,2)]));
 sourceLine('chPangSpread',[['WiData 312081/310879 (EU NK HS 0304 từ VN)','https://widata.vn/'],SRC.vasep,['FRED EXUSEU','https://fred.stlouisfed.org/series/EXUSEU'],['Federal Register – CBPG POR21','https://www.federalregister.gov/d/2026-16553']],mon(spr.at(-1).m+'-01'),'Ước tính. Đơn giá = giá trị EUR ÷ khối lượng kg EU nhập HS 0304 (phi lê cá, mọi loài) từ Việt Nam, quy USD theo bình quân tháng. Không phải giá bán vào Mỹ.');
 const host=document.getElementById('chPangSpread').closest('.card'),n=make('details','note-icon');
 n.innerHTML='<summary>ⓘ Lưu ý dữ liệu</summary><div>Giả định: '+nf(PANG.yield,1)+' kg cá nguyên liệu cho 1 kg phi lê (vùng ngành 2,6–2,8); giá cá nguyên liệu VASEP Đồng Tháp (thịt trắng 0,7–1 kg/con, tuần cuối tháng) quy USD theo tỷ giá trung tâm bình quân tháng. Đơn giá EU là proxy cho giá XK (cùng mặt hàng, khác thị trường); HS 0304 gồm cả phi lê cá khác. CBPG theo DN là mức POR21 (ANV 0,84 USD/kg, VHC rút khỏi lệnh từ 24/01/2025 nên 0); dòng ANV chỉ đúng với phần bán sang Mỹ. Chưa trừ chi phí chế biến, thức ăn tự nuôi, Mục 301 (12,5% giá trị).</div>';host.append(n);
 const L=spr.at(-1);insight('chPangSpread','Tháng '+mon(L.m+'-01')+': đơn giá EU '+nf(L.usd,2)+' USD/kg ('+nf(L.eur,2)+' EUR), cá nguyên liệu quy '+nf(L.raw,2)+' USD/kg phi lê → còn '+nf(L.vhc,2)+' USD/kg cho chế biến và lãi; trừ CBPG 0,84 thì ANV chỉ còn '+nf(L.anv,2)+' trên hàng bán Mỹ. Khoảng cách VHC − ANV cố định 0,84 USD/kg đến khi có kết quả POR22.');
}
// Thị phần Việt Nam trong nhập khẩu Mỹ (12 tháng trượt)
{const roll=(rs,m,n=12)=>{const i=rs.findIndex(r=>ym(r.date)===m);if(i<n-1)return null;return rs.slice(i-n+1,i+1).reduce((a,r)=>a+r.value,0)};
 const a=S('us_imp_0304_vn'),A=S('us_imp_0304_all'),b=S('us_imp_0306_vn'),bi=S('us_imp_0306_in'),Bt=S('us_imp_0306_all');
 if(A.length&&document.getElementById('chUsShare')){
  const months=A.map(r=>ym(r.date)).filter(m=>roll(A,m)!=null).slice(-48),sh=(x,t,m)=>{const v=roll(x,m),T=roll(t,m);return v!=null&&T?v/T*100:null};
  const rows=months.map(m=>({m,f:sh(a,A,m),s:sh(b,Bt,m),i:sh(bi,Bt,m)}));
  barLineChart('chUsShare',{categories:months.map(m=>mon(m+'-01')),series:[{name:'VN · cá phi lê HS 0304',color:C.navy,kind:'line',values:rows.map(r=>r.f)},{name:'VN · giáp xác HS 0306',color:C.plum,kind:'line',values:rows.map(r=>r.s)},{name:'Ấn Độ · HS 0306',color:C.grey,kind:'line',values:rows.map(r=>r.i)}],unit:'%',digits:1,height:260,zeroBase:true,rotateLabels:true});
  legend('chUsShare',[['VN cá phi lê 0304',C.navy],['VN giáp xác 0306',C.plum],['Ấn Độ 0306',C.grey]]);
  fillTable('tbl-us-share',['Tháng','VN 0304 (%)','VN 0306 (%)','Ấn Độ 0306 (%)','VN 0304 tháng (triệu USD)','VN 0306 tháng (triệu USD)'],rows.slice().reverse().map(r=>[mon(r.m+'-01'),nf(r.f,1),nf(r.s,1),nf(r.i,1),nf(byMonth(a)[r.m]?.value/1e6,1),nf(byMonth(b)[r.m]?.value/1e6,1)]));
  sourceLine('chUsShare',[['WiData bảng 312 (Mỹ NK theo HS4 × đối tác)','https://widata.vn/']],mon(months.at(-1)+'-01'),'Thị phần = giá trị Mỹ NK từ nước đó ÷ tổng Mỹ NK cùng mã HS, cộng 12 tháng trượt. HS 0304 gồm mọi loại phi lê cá (cá tra là phần lớn của VN); HS 0306 gồm tôm, cua, tôm hùm.');
  const L=rows.at(-1),y=rows.find(r=>r.m===String(+L.m.slice(0,4)-1)+L.m.slice(4));
  insight('chUsShare','12 tháng đến '+mon(L.m+'-01')+': Việt Nam chiếm '+nf(L.f,1)+'% phi lê cá và '+nf(L.s,1)+'% giáp xác Mỹ nhập'+(y?' (một năm trước '+nf(y.f,1)+'% và '+nf(y.s,1)+'%)':'')+'; Ấn Độ '+nf(L.i,1)+'% giáp xác. Thị phần giảm khi kim ngạch còn tăng nghĩa là đối thủ (Ecuador, Ấn Độ, Indonesia) tăng nhanh hơn — rủi ro cho FMC, MPC trên thị trường Mỹ.');
 }}
// Chỉ số chi phí thức ăn thủy sản và cá giống dẫn trước
{const fm=byMonth(S('fishmeal')),sm2=byMonth(sm),pm=byMonth(pa);
 const rs=sm.map(r=>{const m=ym(r.date),f=fm[m],x=fxm[m];return f&&x?{m,usd:0.45*r.value+0.15*f.value,vnd:(0.45*r.value+0.15*f.value)*x.value/1e6}:null}).filter(Boolean).slice(-36);
 if(rs.length&&document.getElementById('chFeedIdx')){
  const b0=rs[0],p0=pm[b0.m];
  barLineChart('chFeedIdx',{categories:rs.map(r=>mon(r.m+'-01')),series:[{name:'Chỉ số thức ăn (0,45 khô đậu + 0,15 bột cá)',color:C.green,kind:'line',values:rs.map(r=>r.vnd/b0.vnd*100)},{name:'Cá tra nguyên liệu',color:C.navy,kind:'line',values:rs.map(r=>p0&&pm[r.m]?pm[r.m].value/p0.value*100:null)}],unit:'chỉ số',digits:0,height:260,zeroBase:false,rotateLabels:true});
  legend('chFeedIdx',[['Thức ăn (quy VND)',C.green],['Cá tra nguyên liệu',C.navy]]);
  {const sub=document.getElementById('chFeedIdx').closest('.card')?.querySelector('.chart-sub');if(sub)sub.textContent='chỉ số, '+mon(b0.m+'-01')+' = 100 · quy VND'}
  fillTable('tbl-feed-idx',['Tháng','Khô đậu (USD/tấn)','Bột cá (USD/tấn)','Rổ USD/tấn','Rổ nghìn đ/kg','Cá tra NL (nghìn đ/kg)'],rs.slice().reverse().map(r=>[mon(r.m+'-01'),nf(sm2[r.m]?.value,0),nf(fm[r.m]?.value,0),nf(r.usd,0),nf(r.vnd,2),nf(pm[r.m]?.value,1)]));
  sourceLine('chFeedIdx',[SRC.ice,['FRED PFISHUSDM (IMF bột cá)','https://fred.stlouisfed.org/series/PFISHUSDM'],SRC.vasep],mon(rs.at(-1).m+'-01'),'Rổ thức ăn = 0,45 × khô đậu + 0,15 × bột cá (IMF, USD/tấn) quy VND theo tỷ giá trung tâm. Thiếu cám gạo, ngô, sắn (~40% khẩu phần) vì chưa có nguồn giá mở.');
  const L=rs.at(-1);insight('chFeedIdx','Rổ thức ăn '+nf(L.vnd/b0.vnd*100,0)+' so với cá nguyên liệu '+(p0&&pm[L.m]?nf(pm[L.m].value/p0.value*100,0):'—')+' ('+mon(L.m+'-01')+', gốc '+mon(b0.m+'-01')+' = 100). Thức ăn chiếm phần lớn giá thành nuôi; cá nguyên liệu tăng nhanh hơn rổ thức ăn thì biên nuôi của ANV, IDI, VHC (tự nuôi) mở rộng.');
 }
 const fw=S('pangasius_fry_wi').length?S('pangasius_fry_wi'):fry;
 if(fw.length&&pa.length&&document.getElementById('chFryLead')){
  const shift=(m,k)=>{const d=new Date(m+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+k);return d.toISOString().slice(0,7)};
  const fwm=byMonth(fw),months=[...new Set([...pa.map(r=>ym(r.date)),...fw.map(r=>shift(ym(r.date),7))])].sort().filter(m=>m>=shift(ym(fw[0].date),7)).slice(-36);
  barLineChart('chFryLead',{categories:months.map(m=>mon(m+'-01')),series:[{name:'Cá tra giống, dịch trước 7 tháng',color:C.gold,kind:'line',values:months.map(m=>fwm[shift(m,-7)]?.value??null)},{name:'Cá tra nguyên liệu',color:C.navy,kind:'line',values:months.map(m=>pm[m]?.value??null)}],unit:'nghìn đ/kg',digits:1,height:260,zeroBase:false,rotateLabels:true});
  legend('chFryLead',[['Cá giống (t−7)',C.gold],['Cá nguyên liệu',C.navy]]);
  fillTable('tbl-fry-lead',['Tháng','Cá nguyên liệu','Cá giống 7 tháng trước'],months.slice().reverse().map(m=>[mon(m+'-01'),nf(pm[m]?.value,1),nf(fwm[shift(m,-7)]?.value,1)]));
  sourceLine('chFryLead',[[fw===fry?'VASEP cá giống':'WiData 264825 (cá tra giống)',fw===fry?SRC.vasep[1]:'https://widata.vn/'],SRC.vasep],mon(months.at(-1)+'-01'),'Cá giống vẽ lùi 7 tháng: điểm tháng t là giá giống tháng t−7 (chu kỳ nuôi 6–8 tháng). Các tháng cuối chỉ có cá giống là "dự báo" theo độ trễ, chưa có cá nguyên liệu.');
  insight('chFryLead','Giá giống cao nghĩa là hộ nuôi đang thả nhiều → 6–8 tháng sau cá thương phẩm dồi dào, giá cá nguyên liệu dễ giảm (thuận cho nhà chế biến mua ngoài như IDI, bất lợi cho phần tự nuôi). Đường giống đi trước cho biết hướng cá nguyên liệu tới '+mon(months.at(-1)+'-01')+'.');
 }}
// Lịch POR từ Federal Register
const FRB=B.federal_register?.cases||{};
if(Object.keys(FRB).length&&document.getElementById('tbl-por')){
 const kindVN={initiation:'Khởi xướng',preliminary:'Sơ bộ',final:'Cuối cùng',continuation:'Duy trì lệnh',court:'Phán quyết tòa',rescission:'Hủy rà soát (một phần)',changed:'Rà soát thay đổi hoàn cảnh',amended:'Sửa kết quả'};
 const rows=[];
 for(const [k,c] of Object.entries(FRB))for(const d of c.documents.slice(0,6))rows.push([d.date,k==='shrimp'?'Tôm':'Cá tra',d.kinds.map(x=>kindVN[x]||x).join(' · ')||'Thông báo',d.period||'—',d]);
 rows.sort((a,b)=>b[0]<a[0]?-1:1);
 const t=document.getElementById('tbl-por');t.innerHTML='<thead><tr><th>Ngày đăng</th><th>Vụ</th><th>Loại</th><th>Kỳ</th><th>Văn bản</th></tr></thead><tbody>'+rows.map(([d,c,k,per,doc])=>`<tr><td>${short(d)}</td><td>${c}</td><td>${k}</td><td>${per}</td><td><a href="${doc.url}" target="_blank" rel="noopener">FR ${doc.number}</a></td></tr>`).join('')+'</tbody>';
 const add=(d,n)=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
 const today=new Date().toISOString().slice(0,10),days=d=>Math.round((new Date(d)-new Date(today))/864e5);
 const cd=[];
 for(const [k,c] of Object.entries(FRB)){const docs=c.documents,p=docs.find(d=>d.kinds.includes('preliminary')&&!d.kinds.includes('changed')),f=docs.find(d=>d.kinds.includes('final')&&!d.kinds.includes('court')&&!d.kinds.includes('changed'));
  const name=k==='shrimp'?'Tôm':'Cá tra';
  if(p&&(!f||p.date>f.date)){const due=add(p.date,120),max=add(p.date,180);cd.push([name+' · kết luận cuối '+(p.period||''),due,max,'Sơ bộ '+short(p.date)])}
  else if(f)cd.push([name+' · sơ bộ kỳ kế tiếp',null,null,'Cuối kỳ trước '+short(f.date)+(f.period?' ('+f.period+')':'')+'; chưa thấy văn bản sơ bộ mới'])}
 const box=document.getElementById('por-countdown');
 if(box)box.innerHTML=cd.map(([n,due,max,base])=>`<div class="kpi"><div class="label">${n}</div><div class="value">${due?(days(max)<0?'Quá hạn':days(due)>=0?days(due)+' ngày':days(max)+' ngày'):'—'}</div><div class="delta">${due?'hạn thường '+short(due)+' · tối đa '+short(max):''}</div><div class="sub">${base}</div></div>`).join('');
 const host=document.getElementById('tbl-por').closest('.card'),n=make('div','source-note');n.innerHTML='Nguồn: <a href="https://www.federalregister.gov/" target="_blank" rel="noopener">Federal Register API</a> (lọc đúng tên vụ việc và ITA) · kiểm '+short((B.federal_register.checked||'').slice(0,10));host.append(n);
}

// ---------- 4. KPIs, quick read, catalyst brief ----------
const eL=ex.at(-1),cL=cn.at(-1),uL=us.at(-1),pL=pa.at(-1),sL=sh.at(-1),pe=sec['238']?.records||[],peL=pe.at(-1),pe0=pe[0];
kpi('spk-exp',eL?nf(eL.value,0):'—',eL?'triệu USD · '+mon(eL.date):'—',eL?signed(yoyAt(ex,eL),1)+'% so cùng kỳ':'',ex.slice(-12).map(r=>r.value));
kpi('spk-cn',cL?nf(cL.value,0):'—',cL?'triệu USD · '+mon(cL.date):'—',cL?'lũy kế '+signed(ytdYo(cn),1)+'%':'',cn.slice(-12).map(r=>r.value),C.red);
kpi('spk-us',uL?nf(uL.value,0):'—',uL?'triệu USD · '+mon(uL.date):'—',uL?'lũy kế '+signed(ytdYo(us),1)+'%':'',us.slice(-12).map(r=>r.value));
kpi('spk-pang',pL?nf(pL.value,1):'—',pL?'nghìn đ/kg · '+short(pL.date):'—',pL?signed(yoyAt(pa,pL),1)+'% so cùng kỳ':'',pa.slice(-12).map(r=>r.value),C.navy);
{const cL=cm50.at(-1);kpi('spk-shrimp',cL?nf(cL.value,1):'—',cL?'nghìn đ/kg · Cà Mau (Wi) · '+short(cL.date):'—',cL?signed(yoyAt(cm50,cL),1)+'% so cùng kỳ':'',cm50.slice(-12).map(r=>r.value),C.plum)}
kpi('spk-pe',peL?nf(peL[1],1)+'x':'—',peL?'P/E thủy sản · '+short(peL[0]):'—',peL?'P/B '+nf(peL[2],2)+'x':'',pe.slice(-30).map(r=>r[1]),C.grey);
{const set=(k,v)=>document.querySelectorAll('[data-sf="'+k+'"]').forEach(e=>{e.textContent=v});set('pang',pL?nf(pL.value,1):'—');set('pang-date',pL?short(pL.date):'—');set('soy-yoy',signed(yoyAt(sm,sm.at(-1)),0)+'%')}
const quick=document.querySelector('.hero .insight');
if(quick&&eL){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu công khai: '),`XK thủy sản ${mon(eL.date)} ${nf(eL.value,0)} triệu USD (${signed(yoyAt(ex,eL),1)}%), lũy kế ${signed(ytdYo(ex),1)}%. Sang Trung Quốc lũy kế ${signed(ytdYo(cn),0)}%, sang Mỹ ${signed(ytdYo(us),0)}% (đến ${uL?mon(uL.date):''}). Cá tra nguyên liệu ${nf(pL?.value,1)}, tôm thẻ ${(cm50.at(-1)?'Cà Mau 50 con '+nf(cm50.at(-1).value,1):'Đồng Tháp '+nf(sL?.value,1))} nghìn đ/kg${spr.length?`; spread cá tra (EU) ${nf(spr.at(-1).vhc,2)} USD/kg`:''}. Khô đậu ${signed(yoyAt(sm,sm.at(-1)),0)}% YoY.`);
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
 row('Chi phí','Tôm nguyên liệu rẻ',[signed(shY,0)+'%','tôm chân trắng Đồng Tháp YoY'],'Từ đỉnh 146 nghìn đ/kg (12/2025) về '+(sL?nf(sL.value,1):'—'),'Giá tôm nguyên liệu tăng lại > 120 nghìn',shY==null?'na':shY<-5?'good':shY>10?'risk':'watch','▲ FMC · MPC','chShrimp'),
 row('Margin','Spread cá tra sau thuế',[spr.length?nf(spr.at(-1).anv,2):'—','USD/kg ANV (EU − cá NL − 0,84)'],spr.length?'VHC '+nf(spr.at(-1).vhc,2)+' USD/kg ('+mon(spr.at(-1).m+'-01')+')':'—','Spread ANV dưới 1,0 USD/kg',spr.length?(spr.at(-1).anv<1?'risk':spr.at(-1).anv<1.5?'watch':'good'):'na','▼ ANV · ▲ VHC (tương đối)','chPangSpread'),
 row('Định giá','Định giá đã hạ',[peL?nf(peL[1],1)+'x':'—','P/E thủy sản'],'P/E '+(peL?nf(peL[1],1)+'x':'—')+(pe0?' (đầu kỳ '+nf(pe0[1],1)+'x, '+short(pe0[0])+')':''),'Lợi nhuận quý III giảm do thuế Mỹ',peL?'info':'na','VHC · ANV · FMC · MPC','chSectorVal')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.SEAFOOD_BRIEF={
 headline:'Trung Quốc kéo tăng trưởng, tôm nguyên liệu rẻ giúp nhà tôm; thuế Mỹ (Mục 301, CBPG) và thức ăn đắt ép cá tra · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Cá tra','VHC · ANV · IDI',smY!=null&&smY>10?'down':'flat','Thức ăn '+signed(smY,0)+'% · CBPG POR21'],['Tôm','FMC · MPC · CMX',shY!=null&&shY<-5?'up':'flat','Tôm nguyên liệu '+signed(shY,0)+'%'],['Đa ngành','ASM','flat','Lãi vay cao']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Đầu tháng','Hải quan, VASEP: XK tháng trước'],['Hằng tháng','VHC, FMC công bố doanh số tháng'],['20–30/10','BCTC quý III'],['Theo lịch DOC','Kết luận cuối POR19 tôm (đếm ngược ở tab Thuế); sơ bộ POR22 cá tra'],['Pending đợt 2','CNA Ecuador: XK tôm theo nước (xlsx tháng)']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ nguồn công khai lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; giá hàng hóa: IMF/FRED, EIA, ICE.';
})();
