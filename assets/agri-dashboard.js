/* Agriculture & food dashboard: value chain, Cây trồng XK / Chăn nuôi & thức ăn / Thực phẩm & đồ uống panes,
   charts from window.AGRI_WI (scripts/build_agri_wi.py from WiMCP captures) and the shared NOAA ENSO feeds in
   window.SECTOR_DAILY (enso_oni, nino34_weekly). Publishes window.AGRI_BRIEF for catalyst-board.js.
   Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='agri')return;
const W=window.AGRI_WI||{blocks:{}},B=W.blocks||{},D=window.SECTOR_DAILY?.sources||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={customs:['Hải quan Việt Nam','https://www.customs.gov.vn/'],nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],noaa:['NOAA CPC','https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml'],wi:['MCP Wi (Widata)',null]};
const S=k=>macro[k]?.records||com[k]?.records||[];
const ym=d=>d.slice(0,7);
const byMonth=rs=>{const m={};rs.forEach(r=>{m[ym(r.date)]=r});return m};
const yoyAt=(rs,r)=>{if(!r)return null;const p=rs.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};
const ytdYo=rs=>{const l=rs.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),sum=yy=>rs.filter(r=>r.date.slice(0,4)===yy&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0);const p=sum(String(y-1));return p?(sum(y)/p-1)*100:null};

// ---------- 1. Value chain ----------
const chain=document.querySelector('[data-block-id="nn-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='09/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['weather',25,40,['Thời tiết, đất','ENSO · mưa · mặn']],['crop',315,40,['Cây trồng XK','Gạo · cà phê · cao su']],['export',605,40,['Xuất khẩu','LTG · PAN · GVR · DPR · PHR']],['world',895,40,['Giá thế giới','ICE · SGX · Philippines']],
  ['grain',25,165,['Ngô, đậu tương nhập','CBOT · Mỹ · Nam Mỹ']],['feed',315,165,['Thức ăn chăn nuôi','DBC']],['hog',605,165,['Chăn nuôi heo','DBC · HAG · BAF']],['meat',895,165,['Thịt, chế biến','MSN (MEATLife)']],
  ['input',315,290,['Sữa bột, lúa mạch, dầu','nguyên liệu nhập']],['food',605,290,['Thực phẩm & đồ uống','VNM · MSN · SAB · KDC']],['consumer',895,290,['Người tiêu dùng','bán lẻ · thuế TTĐB']]
 ];
 const edges=[['weather','crop'],['crop','export'],['export','world'],['grain','feed'],['feed','hog'],['hog','meat'],['input','food'],['food','consumer'],['meat','consumer'],['weather','grain',true]];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b];let d;
  if(A[2]===Bn[2]){const fw=Bn[1]>A[1];d=`M${A[1]+(fw?w:0)} ${A[2]+h/2} H${Bn[1]+(fw?0:w)}`}
  else if(A[1]===Bn[1]){d=`M${A[1]+w/2} ${A[2]+(Bn[2]>A[2]?h:0)} V${Bn[2]+(Bn[2]>A[2]?0:h)}`}
  else{const fw=Bn[1]>A[1],x1=A[1]+(fw?w:0),y1=A[2]+h/2,x2=Bn[1]+(fw?0:w),y2=Bn[2]+h/2,mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`}
  return `<path d="${d}" class="chain-edge${dashed?' dashed':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t.replace(/&/g,'&amp;')}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1140 375" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành nông nghiệp và thực phẩm</title><desc id="chain-desc">Ba chuỗi: cây trồng xuất khẩu theo thời tiết và giá thế giới; chăn nuôi từ ngô, đậu tương nhập qua thức ăn tới heo và thịt; thực phẩm đồ uống từ nguyên liệu nhập tới người tiêu dùng.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: ba hàng không liên quan nhau về giá. Cây trồng XK nhận giá thế giới nên biên đi theo giá ICE/SGX và thời tiết; chăn nuôi là chênh lệch giữa giá heo trong nước và giá ngô, đậu tương nhập khẩu (tính bằng USD); thực phẩm – đồ uống bán theo sức mua trong nước, chi phí là nguyên liệu nhập và thuế. Một tin xấu cho chuỗi này có thể là tin tốt cho chuỗi khác (ngô rẻ đi → lợi cho DBC, BAF).'));
 figure.after(make('div','source-note','Mũi tên liền: dòng hàng · Mũi tên đứt: thời tiết tác động tới vụ ngô, đậu tương nhập. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Panes ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead');
 const children=[...section.children].filter(e=>e!==head),crop=make('div','supply-pane'),live=make('div','supply-pane'),food=make('div','supply-pane');
 crop.id='supply-world';live.id='supply-vietnam';food.id='supply-trade';
 let cur=crop;children.forEach(e=>{if(e.matches('h3.subhead')){const t=e.textContent.trim();cur=t.startsWith('Chăn')?live:t.startsWith('Thực')?food:crop;e.remove();return}cur.append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Chuỗi');
 const panes=[crop,live,food],labels=['Cây trồng XK','Chăn nuôi & thức ăn','Thực phẩm & đồ uống'];
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
function stack(id,model){const host=document.getElementById(id);if(!host)return;if(window.ChartTypes)return ChartTypes.mount(host,{...model,native:'stack',stackable:true},()=>{host.innerHTML=ChartTypes.render(model,'stack')});barLineChart(id,{...model,height:260,rotateLabels:true})}
function lines(id,base,series,unit,digits,zeroBase=false){const rs=base;barLineChart(id,{categories:rs.map(r=>mon(r.date)),series:series.map(([n,c,f,kind])=>({name:n,color:c,kind:kind||'line',values:rs.map(f)})),unit,digits,height:260,zeroBase,rotateLabels:true})}

// Cây trồng XK
const er=S('exp_rice'),ec=S('exp_coffee'),eb=S('exp_rubber');
if(er.length&&document.getElementById('chExp')){
 const cm=byMonth(ec),bm=byMonth(eb),rs=er.slice(-36);
 stack('chExp',{categories:rs.map(r=>mon(r.date)),series:[{name:'Gạo',color:C.gold,values:rs.map(r=>r.value)},{name:'Cà phê',color:C.plum,values:rs.map(r=>cm[ym(r.date)]?.value??null)},{name:'Cao su',color:C.navy,values:rs.map(r=>bm[ym(r.date)]?.value??null)}],unit:'triệu USD',digits:0,aria:'Xuất khẩu gạo, cà phê, cao su'});
 legend('chExp',[['Gạo',C.gold],['Cà phê',C.plum],['Cao su',C.navy]]);
 fillTable('tbl-exp',['Tháng','Gạo','Cà phê','Cao su','Gạo YoY','Cà phê YoY','Cao su YoY'],er.slice().reverse().map(r=>{const c=cm[ym(r.date)],b=bm[ym(r.date)];return [mon(r.date),nf(r.value,0),nf(c?.value,0),nf(b?.value,0),signed(yoyAt(er,r),1)+'%',signed(yoyAt(ec,c),1)+'%',signed(yoyAt(eb,b),1)+'%']}));
 sourceLine('chExp',[SRC.customs,SRC.wi],mon(er.at(-1).date),'Kim ngạch xuất khẩu gạo (83505), cà phê (83502), cao su (83520). Ba mặt hàng khác nhau, cộng chỉ để xem quy mô.');
 insight('chExp','Lũy kế 9T/2026 cả ba mặt hàng đều thấp hơn cùng kỳ (gạo '+signed(ytdYo(er),0)+'%, cà phê '+signed(ytdYo(ec),0)+'%, cao su '+signed(ytdYo(eb),0)+'%) nhưng vì lý do khác nhau: gạo mất thị trường Philippines, Indonesia; cà phê giảm giá từ đỉnh 2025; cao su giảm lượng nhưng giá đang tăng. Mùa cà phê mới bắt đầu tháng 10–12 nên số quý IV mới cho biết niên vụ 2026/27.');
}
const pr=S('px_rice'),pc=S('px_coffee'),pb=S('px_rubber');
if(pr.length&&document.getElementById('chPx')){
 const cm=byMonth(pc),bm=byMonth(pb);
 lines('chPx',pr.slice(-36),[['Gạo',C.gold,r=>r.value],['Cà phê',C.plum,r=>cm[ym(r.date)]?.value??null],['Cao su',C.navy,r=>bm[ym(r.date)]?.value??null]],'USD/kg',2,true);
 legend('chPx',[['Gạo',C.gold],['Cà phê',C.plum],['Cao su',C.navy]]);
 fillTable('tbl-px',['Tháng','Gạo','Cà phê','Cao su'],pr.slice().reverse().map(r=>[mon(r.date),nf(r.value,3),nf(cm[ym(r.date)]?.value,3),nf(bm[ym(r.date)]?.value,3)]));
 sourceLine('chPx',[SRC.customs,SRC.wi],mon(pr.at(-1).date),'Giá xuất khẩu bình quân = kim ngạch / lượng của hải quan (92095, 92092, 92098). Phản ánh cả cơ cấu chủng loại, không chỉ giá thị trường.');
 insight('chPx','Giá XK bình quân trễ giá sàn 1–2 tháng vì hợp đồng ký trước. Cà phê đã giảm khoảng 20% so cùng kỳ, cao su tăng gần 30%: thu nhập của nhà trồng cao su (GVR, DPR, PHR) đang tốt hơn rõ rệt so với cà phê. Gạo nhích lên nhưng vẫn thấp xa đỉnh 2024 khi Ấn Độ cấm xuất khẩu.');
}
const ro=S('robusta'),ts=S('tsr20');
if(ro.length&&document.getElementById('chWorld')){
 const tm=byMonth(ts);
 lines('chWorld',ro,[['Robusta (USD/tấn)',C.plum,r=>r.value],['TSR20 (US cent/kg ×10)',C.navy,r=>tm[ym(r.date)]?tm[ym(r.date)].value*10:null]],'',0,true);
 legend('chWorld',[['Robusta USD/tấn',C.plum],['TSR20 US cent/kg ×10',C.navy]]);
 fillTable('tbl-world',['Kỳ','Robusta (USD/tấn)','Robusta YoY','TSR20 (US cent/kg)','TSR20 YoY'],ro.slice().reverse().map(r=>{const t=tm[ym(r.date)];return [short(r.date),nf(r.value,0),signed(yoyAt(ro,r),1)+'%',nf(t?.value,1),signed(yoyAt(ts,t),1)+'%']}));
 sourceLine('chWorld',[['ICE · SGX qua Wi',null]],short(ro.at(-1).date),'Robusta ICE (203096), cao su TSR20 SGX (203110), Wi nén chuỗi ngày về cuối tháng. TSR20 nhân 10 để cùng trục.');
 insight('chWorld','Hai đường đi ngược chiều từ đầu 2025: Robusta rời đỉnh 5.600 USD/tấn khi Brazil, Việt Nam được mùa; TSR20 tăng từ ~165 lên ~260 cent/kg do cung Thái Lan, Indonesia hạn chế và EUDR sắp áp. El Niño mạnh là rủi ro tăng giá cho cả hai nếu Tây Nguyên, Đông Nam Á khô hạn mùa khô 2027.');
}
const r5=S('rice5');
if(r5.length&&document.getElementById('chRice')){
 lines('chRice',r5,[['Gạo 5% tấm',C.gold,r=>r.value]],'nghìn đ/kg',2,false);
 fillTable('tbl-rice',['Kỳ','Nghìn đ/kg','So cùng kỳ'],r5.slice().reverse().map(r=>[short(r.date),nf(r.value,3),signed(yoyAt(r5,r),1)+'%']));
 sourceLine('chRice',[['Wi',null]],short(r5.at(-1).date),'Gạo thành phẩm 5% tấm (74351), giá nội địa tại ĐBSCL, Wi nén về cuối tháng.');
 insight('chRice','Giá gạo nội địa giảm ~40% từ cuối 2023 rồi hồi lại từ 4/2026. Đây là giá nhà XK (LTG, PAN) mua vào; giá nội địa tăng nhanh hơn giá XK sẽ ép biên xuất khẩu.');
}
// Chăn nuôi
const hog=S('hog');
if(hog.length&&document.getElementById('chHog')){
 lines('chHog',hog,[['Heo hơi',C.red,r=>r.value]],'nghìn đ/kg',1,false);
 fillTable('tbl-hog',['Kỳ','Nghìn đ/kg','So cùng kỳ'],hog.slice().reverse().map(r=>[short(r.date),nf(r.value,1),signed(yoyAt(hog,r),1)+'%']));
 sourceLine('chHog',[['Wi',null]],short(hog.at(-1).date),'Heo hơi trong nước, chuỗi toàn quốc (74124), Wi nén về cuối tháng. Không dùng ba chuỗi vùng.');
 insight('chHog','Giá heo giảm từ ~78 (T1) xuống ~53 nghìn đ/kg: mức này đã gần vùng hòa vốn của nhiều trang trại khi giá thức ăn tăng, nên lợi nhuận mảng heo của DBC, BAF bị thu hẹp mạnh (DBC LNST 6T −35%). Đàn của doanh nghiệp lớn tăng nhanh (BAF +61% xuất bán) làm cung tăng; ASF là biến số có thể đảo chiều cung.');
}
const co=S('corn'),sm=S('soymeal');
if(co.length&&document.getElementById('chFeedPx')){
 const smm=byMonth(sm),base=co.slice(-24);
 barLineChart('chFeedPx',{categories:base.map(r=>mon(r.date)),series:[{name:'Ngô YoY',color:C.gold,values:base.map(r=>yoyAt(co,r))},{name:'Khô đậu YoY',color:C.green,values:base.map(r=>yoyAt(sm,smm[ym(r.date)]))}],unit:'%',digits:1,height:260,rotateLabels:true});
 legend('chFeedPx',[['Ngô CBOT',C.gold],['Khô đậu tương CBOT',C.green]]);
 fillTable('tbl-feedpx',['Kỳ','Ngô (cent/bushel)','Khô đậu (USD/short ton)','Ngô YoY','Khô đậu YoY'],co.slice().reverse().map(r=>{const s=smm[ym(r.date)];return [short(r.date),nf(r.value,1),nf(s?.value,1),signed(yoyAt(co,r),1)+'%',signed(yoyAt(sm,s),1)+'%']}));
 sourceLine('chFeedPx',[['CME/CBOT qua Wi',null]],short(co.at(-1).date),'Ngô future CBOT (203105, US cent/bushel), khô đậu tương CBOT (203092, USD/short ton). Vẽ % so cùng kỳ vì khác đơn vị.');
 insight('chFeedPx','Ngô và khô đậu là nguyên liệu chính của thức ăn, và thức ăn là chi phí lớn nhất của nuôi heo. Hai nguyên liệu cùng tăng 13–16% YoY trong khi giá heo đi ngang so cùng kỳ và giảm mạnh từ đầu năm: biên chăn nuôi bị ép từ hai phía.');
}
const ic=S('imp_corn'),is=S('imp_soy'),iff=S('imp_feed');
if(ic.length&&document.getElementById('chFeedImp')){
 const sm2=byMonth(is),fm=byMonth(iff),rs=ic.slice(-36);
 stack('chFeedImp',{categories:rs.map(r=>mon(r.date)),series:[{name:'Ngô',color:C.gold,values:rs.map(r=>r.value)},{name:'Đậu tương',color:C.green,values:rs.map(r=>sm2[ym(r.date)]?.value??null)},{name:'Thức ăn gia súc & nguyên liệu',color:C.navy,values:rs.map(r=>fm[ym(r.date)]?.value??null)}],unit:'triệu USD',digits:0,aria:'Nhập khẩu nguyên liệu thức ăn'});
 legend('chFeedImp',[['Ngô',C.gold],['Đậu tương',C.green],['Thức ăn gia súc & nguyên liệu',C.navy]]);
 fillTable('tbl-feedimp',['Tháng','Ngô','Đậu tương','Thức ăn & NL'],ic.slice().reverse().map(r=>[mon(r.date),nf(r.value,0),nf(sm2[ym(r.date)]?.value,0),nf(fm[ym(r.date)]?.value,0)]));
 sourceLine('chFeedImp',[SRC.customs,SRC.wi],mon(ic.at(-1).date),'Nhập khẩu ngô (92781), đậu tương (92756), thức ăn gia súc và nguyên liệu (92776, gồm khô đậu).');
 insight('chFeedImp','Nhập ngô lũy kế 9T +29%, đậu tương +53% theo giá trị: vừa do giá tăng vừa do đàn heo, gia cầm lớn lên. Việt Nam nhập gần như toàn bộ đậu tương, nên tỷ giá USD/VND cũng là chi phí của nhà chăn nuôi.');
}
const fd=S('feed');
if(fd.length&&document.getElementById('chFeed')){
 const rs=fd.slice(-36);
 barLineChart('chFeed',{categories:rs.map(r=>mon(r.date)),series:[{name:'Thức ăn gia súc',color:C.teal,values:rs.map(r=>r.value)}],unit:'nghìn tấn',digits:0,height:260,rotateLabels:true});
 fillTable('tbl-feed',['Tháng','Nghìn tấn','So cùng kỳ'],fd.slice().reverse().map(r=>[mon(r.date),nf(r.value,0),signed(yoyAt(fd,r),1)+'%']));
 sourceLine('chFeed',[SRC.nso,SRC.wi],mon(fd.at(-1).date),'Sản lượng thức ăn cho gia súc (82118), NSO.');
 insight('chFeed','Sản lượng thức ăn 9T +10% cho thấy đàn vật nuôi đang mở rộng; cung thịt tăng là một lý do giá heo giảm. Khi thức ăn tăng chậm lại hoặc âm, đàn đang thu hẹp và giá heo thường hồi sau 2–3 quý.');
}
// Thực phẩm & đồ uống
const rt=S('retail_goods');
if(rt.length&&document.getElementById('chRetail')){
 const rs=rt.slice(-36);
 barLineChart('chRetail',{categories:rs.map(r=>mon(r.date)),series:[{name:'Bán lẻ hàng hóa',color:C.navy,values:rs.map(r=>r.value/1000)}],unit:'nghìn tỷ',digits:0,height:260,rotateLabels:true});
 fillTable('tbl-retail',['Tháng','Nghìn tỷ đồng','So cùng kỳ'],rt.slice().reverse().map(r=>[mon(r.date),nf(r.value/1000,1),signed(yoyAt(rt,r),1)+'%']));
 sourceLine('chRetail',[SRC.nso,SRC.wi],mon(rt.at(-1).date),'Doanh thu bán lẻ hàng hóa (74450), giá hiện hành, gồm cả lạm phát.');
 insight('chRetail','Bán lẻ hàng hóa 9T +12% danh nghĩa; trừ CPI hàng ăn ~4% còn khoảng 7–8% thực: sức mua đủ tốt cho VNM, MSN, KDC tăng sản lượng mà không phải giảm giá.');
}
const be=S('beer'),mk=S('fresh_milk');
if(be.length&&document.getElementById('chBev')){
 const mm=byMonth(mk),rs=be.slice(-36);
 barLineChart('chBev',{categories:rs.map(r=>mon(r.date)),series:[{name:'Bia',color:C.gold,values:rs.map(r=>r.value)},{name:'Sữa tươi',color:C.teal,kind:'line',values:rs.map(r=>mm[ym(r.date)]?.value??null)}],unit:'triệu lít',digits:0,height:260,rotateLabels:true});
 legend('chBev',[['Bia',C.gold],['Sữa tươi',C.teal]]);
 fillTable('tbl-bev',['Tháng','Bia','Bia YoY','Sữa tươi','Sữa tươi YoY','Sữa bột (nghìn tấn)'],be.slice().reverse().map(r=>{const m=mm[ym(r.date)],p=byMonth(S('milk_powder'))[ym(r.date)];return [mon(r.date),nf(r.value,0),signed(yoyAt(be,r),1)+'%',nf(m?.value,0),signed(yoyAt(mk,m),1)+'%',nf(p?.value,1)]}));
 sourceLine('chBev',[SRC.nso,SRC.wi],mon(be.at(-1).date),'Sản lượng bia (82086), sữa tươi (82116), sữa bột (82084, ở bảng) của toàn ngành, NSO.');
 insight('chBev','Bia 9T +15% sau hai năm giảm vì NĐ 100 (nồng độ cồn): nền thấp và du lịch hồi phục. Đây là năm cuối trước khi thuế TTĐB bia tăng từ 2027, nên một phần có thể là tích trữ. Sữa tươi +3% đi đều, phù hợp với VNM giành thêm thị phần chứ không phải thị trường tăng nhanh.');
}
const fi=S('iip_food'),bi=S('iip_bev'),cf=S('cpi_food'),cb=S('cpi_bev');
if(fi.length&&document.getElementById('chIip')){
 const bm=byMonth(bi),fm=byMonth(cf),cbm=byMonth(cb);
 lines('chIip',fi.slice(-24),[['IIP chế biến thực phẩm',C.navy,r=>r.value],['IIP đồ uống',C.gold,r=>bm[ym(r.date)]?.value??null],['CPI hàng ăn',C.red,r=>fm[ym(r.date)]?.value??null],['CPI đồ uống, thuốc lá',C.plum,r=>cbm[ym(r.date)]?.value??null]],'%',1,false);
 legend('chIip',[['IIP thực phẩm',C.navy],['IIP đồ uống',C.gold],['CPI hàng ăn',C.red],['CPI đồ uống',C.plum]]);
 fillTable('tbl-iip',['Tháng','IIP thực phẩm','IIP đồ uống','CPI hàng ăn','CPI đồ uống'],fi.slice().reverse().map(r=>[mon(r.date),nf(r.value,2),nf(bm[ym(r.date)]?.value,2),nf(fm[ym(r.date)]?.value,2),nf(cbm[ym(r.date)]?.value,2)]));
 sourceLine('chIip',[SRC.nso,SRC.wi],mon(fi.at(-1).date),'IIP sản xuất chế biến thực phẩm (202900), đồ uống (202901); CPI hàng ăn và dịch vụ ăn uống (75702), đồ uống và thuốc lá (75706). Tất cả % so cùng kỳ.');
 insight('chIip','IIP đồ uống tăng hơn 20% YoY tháng 9 khớp với sản lượng bia. CPI hàng ăn ~4% cho thấy giá bán lẻ thực phẩm đang tăng, thuận cho nhà sản xuất chuyển chi phí nguyên liệu vào giá.');
}
const ml=S('imp_milk');
if(ml.length&&document.getElementById('chMilk')){
 const rs=ml.slice(-36);
 barLineChart('chMilk',{categories:rs.map(r=>mon(r.date)),series:[{name:'Nhập khẩu sữa',color:C.teal,values:rs.map(r=>r.value)}],unit:'triệu USD',digits:0,height:260,rotateLabels:true});
 fillTable('tbl-milk',['Tháng','Triệu USD','So cùng kỳ'],ml.slice().reverse().map(r=>[mon(r.date),nf(r.value,1),signed(yoyAt(ml,r),1)+'%']));
 sourceLine('chMilk',[SRC.customs,SRC.wi],mon(ml.at(-1).date),'Nhập khẩu sữa và sản phẩm sữa (92795), giá trị USD. Chưa có giá sữa bột GDT để tách lượng và giá.');
 insight('chMilk','Nhà sữa nhập phần lớn sữa bột nguyên liệu; nhập khẩu 9T +10% về giá trị. Không có giá GDT nên chưa tách được giá hay lượng — biên gộp của VNM là nơi kiểm tra hiệu ứng giá.');
}
// Định giá
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['282','Cao su',C.navy],['239','Sữa',C.teal],['240','Chăn nuôi, chế biến thịt',C.red],['120','Bia',C.gold]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/E '+name,color,kind:'line',values:weekly.map(d=>at(id,d,1))})),unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Phân ngành (GICS Wi)','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],[...ids,['235','Thức ăn chăn nuôi'],['241','Thực phẩm đóng gói']].filter(([id])=>sec[id]?.records?.length).map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],1),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[SRC.wi],short(dates.at(-1)),'Wi sector_ratio_daily: cao su (282), sữa (239), chăn nuôi chế biến thịt (240), bia (120); bảng có thêm 235, 241. Vẽ mỗi 5 phiên. Định giá tổng hợp bị chi phối bởi mã lớn (GVR, VNM, MSN, SAB).');
 insight('chSectorVal','P/E cao su giảm từ ~25 lần (02/2026) về ~16 lần dù giá mủ tăng: lợi nhuận tăng nhanh hơn giá cổ phiếu. Sữa, bia, chăn nuôi đều về quanh 11 lần, thấp hơn đầu năm 3–5 lần — thị trường chưa trả thêm cho tăng trưởng tiêu dùng.');
}
// ENSO (NOAA, shared feed)
const oni=D.enso_oni?.records||[],nino=D.nino34_weekly?.records||[];
if(oni.length&&document.getElementById('chOni')){
 const rs=oni.slice(-48);
 balanceBarChart('chOni',{labels:rs.map(r=>r.season+'/'+String(r.year).slice(2)),values:rs.map(r=>r.oni),labelEvery:6,digits:2,unit:'°C',name:'ONI',colors:[C.red,C.navy],minScale:1.5,ariaLabel:'Chỉ số ONI'});
 fillTable('tbl-oni',['Mùa','ONI (°C)','Giai đoạn'],oni.slice(-48).reverse().map(r=>[r.season+'/'+r.year,nf(r.oni,2),r.oni>=1.5?'El Niño mạnh':r.oni>=0.5?'El Niño':r.oni<=-0.5?'La Niña':'Trung tính']));
 sourceLine('chOni',[SRC.noaa],oni.at(-1).season+'/'+oni.at(-1).year,'ONI = trung bình trượt 3 tháng chênh nhiệt độ mặt biển vùng Niño-3.4 (NOAA ERSSTv5). Dùng chung feed với dashboard Điện; job GitHub kiểm mỗi lượt.',false);
 insight('chOni','ONI '+nf(oni.at(-1).oni,2)+' °C đã vượt ngưỡng El Niño mạnh (1,5) và gần mức 2015–16, đợt làm Tây Nguyên hạn nặng và mặn ĐBSCL kỷ lục mùa khô 2016. Tác động lên sản lượng đến sau 3–6 tháng: vụ cà phê 2026/27 thu hoạch 10–12 ít bị ảnh hưởng, rủi ro lớn hơn là vụ Đông Xuân 2027 và niên vụ cà phê 2027/28.');
}
if(nino.length&&document.getElementById('chNino')){
 const rs=nino.slice(-52);
 barLineChart('chNino',{categories:rs.map(r=>r.date.slice(8,10)+'/'+r.date.slice(5,7)),series:[{name:'Niño-3.4 SSTA',color:C.red,kind:'line',values:rs.map(r=>r.ssta)}],unit:'°C',digits:1,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-nino',['Tuần','SST (°C)','Chênh (°C)'],nino.slice(-52).reverse().map(r=>[short(r.date),nf(r.sst,1),nf(r.ssta,1)]));
 sourceLine('chNino',[SRC.noaa],short(nino.at(-1).date),'Niño-3.4 theo tuần (NOAA CPC); nhanh hơn ONI nhưng nhiễu hơn.',false);
 insight('chNino','Chênh nhiệt tuần gần nhất '+nf(nino.at(-1).ssta,1)+' °C, vẫn đang tăng. NOAA (08/10/2026) cho 83% khả năng El Niño mạnh kỷ lục vào 10–12/2026 và kéo dài tới Q1/2027.');
}

// ---------- 4. KPIs, quick read, catalyst brief ----------
const roL=ro.at(-1),tsL=ts.at(-1),prL=pr.at(-1),hgL=hog.at(-1),coL=co.at(-1),rtL=rt.at(-1);
kpi('spk-robusta',roL?nf(roL.value,0):'—',roL?'USD/tấn · '+short(roL.date):'—',roL?signed(yoyAt(ro,roL),1)+'% so cùng kỳ':'',ro.slice(-12).map(r=>r.value),C.plum);
kpi('spk-rubber',tsL?nf(tsL.value,1):'—',tsL?'US cent/kg · '+short(tsL.date):'—',tsL?signed(yoyAt(ts,tsL),1)+'% so cùng kỳ':'',ts.slice(-12).map(r=>r.value));
kpi('spk-rice',prL?nf(prL.value*1000,0):'—',prL?'USD/tấn · '+mon(prL.date):'—',prL?signed(yoyAt(pr,prL),1)+'% so cùng kỳ':'',pr.slice(-12).map(r=>r.value),C.gold);
kpi('spk-hog',hgL?nf(hgL.value,1):'—',hgL?'nghìn đ/kg · '+short(hgL.date):'—',hgL?signed(yoyAt(hog,hgL),1)+'% so cùng kỳ':'',hog.slice(-12).map(r=>r.value),C.red);
kpi('spk-corn',coL?nf(coL.value,0):'—',coL?'US cent/bushel · '+short(coL.date):'—',coL?signed(yoyAt(co,coL),1)+'% so cùng kỳ':'',co.slice(-12).map(r=>r.value),C.gold);
kpi('spk-retail',rtL?nf(rtL.value/1000,0):'—',rtL?'nghìn tỷ đồng · '+mon(rtL.date):'—',rtL?signed(yoyAt(rt,rtL),1)+'% so cùng kỳ':'',rt.slice(-12).map(r=>r.value),C.navy);
const oL=oni.at(-1),quick=document.querySelector('.hero .insight');
if(quick&&roL){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu Wi, NOAA: '),`Robusta ${nf(roL.value,0)} USD/tấn (${signed(yoyAt(ro,roL),0)}% YoY), cao su TSR20 ${nf(tsL?.value,0)} cent/kg (${signed(yoyAt(ts,tsL),0)}%). Heo hơi ${nf(hgL?.value,1)} nghìn đ/kg; ngô CBOT ${signed(yoyAt(co,coL),0)}% YoY. Bán lẻ hàng hóa ${rtL?mon(rtL.date):''} ${signed(yoyAt(rt,rtL),1)}%. `+(oL?`ONI ${oL.season}/${oL.year} ${nf(oL.oni,2)} °C (El Niño mạnh).`:''));
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
const roY=yoyAt(ro,roL),tsY=yoyAt(ts,tsL),hgY=yoyAt(hog,hgL),coY=yoyAt(co,coL),smL=sm.at(-1),smY=yoyAt(sm,smL),rtY=ytdYo(rt),beY=ytdYo(be),riY=ytdYo(er);
const hogPeak=Math.max(...hog.slice(-12).map(r=>r.value));
const pe=sec['282']?.records||[],peL=pe.at(-1),pe0=pe[0];
const row=(group,name,big,evidence,cond,st,who,chart)=>({group,name,big,chart,st,mid:[evidence,cond],end:[who]});
const score=[
 row('Cây trồng XK','Giá cao su tăng mạnh',[signed(tsY,0)+'%','TSR20 YoY'],'TSR20 '+(tsL?nf(tsL.value,0)+' cent/kg ('+short(tsL.date)+')':'—')+' · giá XK cao su '+signed(yoyAt(pb,pb.at(-1)),0)+'% YoY','TSR20 về dưới 200 cent/kg',tsY==null?'na':tsY>10?'good':tsY<-10?'risk':'watch','▲ GVR · DPR · PHR','chWorld'),
 row('Cây trồng XK','Giá cà phê giảm từ đỉnh',[signed(roY,0)+'%','Robusta YoY'],'Robusta '+(roL?nf(roL.value,0)+' USD/tấn':'—')+' · giá XK cà phê '+signed(yoyAt(pc,pc.at(-1)),0)+'% YoY','Hạn El Niño làm giảm vụ 2027/28',roY==null?'na':roY<-10?'risk':roY>10?'good':'watch','▼ HAG (cà phê)','chWorld'),
 row('Cây trồng XK','Gạo mất thị trường',[signed(riY,0)+'%','kim ngạch gạo lũy kế'],'Philippines, Indonesia hạn chế nhập; giá XK gạo '+signed(yoyAt(pr,prL),0)+'% YoY','Philippines mở lại nhập khẩu dài hạn',riY==null?'na':riY<-5?'risk':'watch','▼ LTG · PAN','chExp'),
 row('Chăn nuôi','Giá heo hơi giảm',[hgL?nf(hgL.value,0):'—','nghìn đ/kg heo hơi'],'Từ đỉnh 12 tháng '+nf(hogPeak,0)+' nghìn đ/kg; '+signed(hgY,0)+'% YoY','Heo hơi > 60 nghìn đ/kg',hgL==null?'na':hgL.value<56?'risk':hgL.value>62?'good':'watch','▼ DBC · BAF · HAG','chHog'),
 row('Chăn nuôi','Nguyên liệu thức ăn tăng',[signed(coY,0)+'%','ngô CBOT YoY'],'Khô đậu '+signed(smY,0)+'% YoY; nhập ngô 9T +29%','Ngô, khô đậu về âm YoY',coY==null?'na':coY>10?'risk':coY<-5?'good':'watch','▼ DBC · BAF','chFeedPx'),
 row('Thực phẩm & đồ uống','Tiêu dùng trong nước khỏe',[signed(rtY,0)+'%','bán lẻ hàng hóa lũy kế'],'Bia lũy kế '+signed(beY,0)+'%; CPI hàng ăn ~4%','Bán lẻ lũy kế về dưới +8%',rtY==null?'na':rtY>10?'good':rtY<6?'risk':'watch','▲ VNM · MSN · SAB · KDC','chRetail'),
 row('Thực phẩm & đồ uống','Thuế TTĐB bia từ 2027',['+5đ%','thuế TTĐB mỗi năm 2027–2031'],'Bia, rượu từ 20°: 65% → 90% năm 2031; nước có đường 8% từ 2027','Lộ trình được giãn','risk','▼ SAB','chBev'),
 row('Thời tiết','El Niño mạnh',[oL?nf(oL.oni,2)+'°C':'—','ONI '+(oL?oL.season+'/'+oL.year:'')],'NOAA: 83% khả năng El Niño mạnh kỷ lục 10–12/2026, kéo dài tới Q1/2027','ONI về dưới 1,0','risk','▼ LTG · PAN · HAG ▲ giá cà phê, cao su','chOni'),
 row('Định giá','Định giá cao su đã hạ',[peL?nf(peL[1],1)+'x':'—','P/E cao su'],'P/E cao su '+(peL?nf(peL[1],1)+'x':'—')+(pe0?' (đầu kỳ '+nf(pe0[1],1)+'x, '+short(pe0[0])+')':''),'Lợi nhuận cao su giảm khi giá mủ đảo chiều',peL?'info':'na','GVR · DPR · PHR','chSectorVal')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.AGRI_BRIEF={
 headline:'Cao su và tiêu dùng nội địa đang thuận; chăn nuôi bị ép biên, gạo mất thị trường và El Niño mạnh là rủi ro · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Cao su','GVR · DPR · PHR',tsY!=null&&tsY>10?'up':'flat','TSR20 '+signed(tsY,0)+'%'],['Gạo, cà phê','LTG · PAN · HAG','down','Robusta '+signed(roY,0)+'% · El Niño'],['Chăn nuôi','DBC · BAF · HAG','down','Heo '+(hgL?nf(hgL.value,0):'—')+' · ngô '+signed(coY,0)+'%'],['Thực phẩm & đồ uống','VNM · MSN · SAB · KDC',rtY!=null&&rtY>10?'up':'flat','Bán lẻ '+signed(rtY,0)+'%']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Đầu tháng','Hải quan, NSO: XNK, bán lẻ, sản lượng'],['Thứ Năm thứ 2 hằng tháng','NOAA: bản tin ENSO'],['Giữa tháng','USDA WASDE'],['20–30/10','BCTC quý III'],['30/12/2026','EUDR áp dụng DN lớn, vừa']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ WiMCP lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; các lời gọi ghi trong data/agri-wi-contract.json.';
})();
