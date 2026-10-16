/* Construction dashboard (Xây dựng · VLXD · Đầu tư công): value chain, Thép / Xi măng & VLXD / Xây dựng & hạ tầng panes,
   public-investment tab and sector valuation from window.CONSTRUCTION_PUBLIC (scripts/build_sector_public.py: public commodity series only).
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
  ['input',25,165,['Nguyên liệu','quặng · than · đá vôi · nhựa']],
  ['steel',315,40,['Thép','HPG · HSG · NKG']],['cement',315,165,['Xi măng','HT1 · BCC']],['stone',315,290,['Đá, nhựa, kính','VLB · KSB · DHA · PLC · VGC']],
  ['civil',605,40,['Xây dựng dân dụng','CTD · HBC · FCN · DPG']],['infra',605,165,['Hạ tầng & BOT','VCG · C4G · LCG · HHV · CII · HUT']],['export',605,290,['Xuất khẩu','thép · tôn mạ · clinker']],
  ['private',895,40,['BĐS & nhà xưởng','nhà ở · KCN · FDI']],['public',895,165,['Đầu tư công','cao tốc · sân bay · đường sắt']],['fund',895,290,['Nguồn vốn','NSNN · tín dụng · trái phiếu']]
 ];
 const edges=[['input','steel'],['input','cement'],['input','stone'],['steel','civil'],['cement','infra'],['stone','infra'],['stone','export',true],['private','civil',true],['public','infra',true],['fund','public',true]];
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
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: đầu tư công là cầu đi trước — vốn NSNN giải ngân đến nhà thầu hạ tầng trước, rồi kéo đá, nhựa đường, xi măng, thép theo khối lượng thi công 1–3 quý sau. Nhà thầu dân dụng sống theo chu kỳ BĐS và nhà xưởng FDI. Vật liệu có biên theo chênh lệch giá bán với nguyên liệu (thép: quặng, than cốc; xi măng: than; nhựa đường: dầu); nhà thầu ăn biên mỏng và chịu rủi ro phải thu.'));
 figure.after(make('div','source-note','Mũi tên liền: dòng vật liệu · Mũi tên đứt: nguồn cầu và vốn. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Panes ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead');
 const children=[...section.children].filter(e=>e!==head),steelP=make('div','supply-pane'),matP=make('div','supply-pane'),conP=make('div','supply-pane');
 steelP.id='supply-world';matP.id='supply-vietnam';conP.id='supply-trade';
 let cur=steelP;children.forEach(e=>{if(e.matches('h3.subhead')){const t=e.textContent.trim();cur=t.startsWith('Xi măng')?matP:t.startsWith('Xây dựng')?conP:steelP;e.remove();return}cur.append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Nhóm');
 const panes=[steelP,matP,conP],labels=['Thép','Xi măng & VLXD','Xây dựng & hạ tầng'];
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
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;card.querySelector('.value').textContent=value;card.querySelector('.sub').textContent=sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();if(series?.length)sparkline(spark,series,color)}
function lines(id,base,series,unit,digits,zeroBase=false){barLineChart(id,{categories:base.map(r=>mon(r.date)),series:series.map(([n,c,f])=>({name:n,color:c,kind:'line',values:base.map(f)})),unit,digits,height:260,zeroBase,rotateLabels:true})}
const BASE='2024-01';

// Thép
const rebar=S('rebar_hpg'),hrc=S('hrc'),ore=S('iron_ore'),coke=S('coke'),rolled=S('steel_rolled'),bar=S('steel_bar'),sexp=S('steel_export');
const rbc=S('rebar_cn');
if(hrc.length&&document.getElementById('chSteelPrice')){
 const ri=byMonth(idx(rbc,BASE)),hi=byMonth(idx(hrc,BASE)),oi=byMonth(idx(ore,BASE)),base=hrc.filter(r=>r.date.slice(0,7)>=BASE);
 lines('chSteelPrice',base,[['Thép thanh vằn SHFE',C.navy,r=>ri[ym(r.date)]?.value??null],['HRC SHFE',C.teal,r=>hi[ym(r.date)]?.value??null],['Quặng sắt',C.gold,r=>oi[ym(r.date)]?.value??null]],'',0);
 legend('chSteelPrice',[['Thép thanh vằn SHFE',C.navy],['HRC SHFE',C.teal],['Quặng sắt (IMF)',C.gold]]);
 const rm=byMonth(rbc),om=byMonth(ore);
 fillTable('tbl-steel-price',['Kỳ','Thép thanh vằn SHFE (CNY/tấn)','HRC SHFE (CNY/tấn)','Quặng sắt IMF (USD/tấn)'],hrc.slice().reverse().map(r=>[short(r.date),nf(rm[ym(r.date)]?.value,0),nf(r.value,0),nf(om[ym(r.date)]?.value,1)]));
 sourceLine('chSteelPrice',[['SHFE · dữ liệu giao dịch ngày','https://www.shfe.com.cn/eng/Market/Futures/'],['IMF qua FRED (PIORECRUSDM)','https://fred.stlouisfed.org/series/PIORECRUSDM']],short(hrc.at(-1).date),'Chỉ số T1/2024 = 100 để ba chuỗi khác đơn vị cùng trục. Thép thanh vằn và HRC: giá thanh toán hợp đồng chính (OI lớn nhất) của SHFE, phiên cuối tháng; quặng sắt: IMF, CFR Trung Quốc, bình quân tháng. Giá thép CB300 Hòa Phát và than cốc chưa có nguồn công khai thay thế.');
 const hL=hrc.at(-1),oL=ore.at(-1),bL=rbc.at(-1);
 insight('chSteelPrice','HRC SHFE '+nf(hL.value,0)+' CNY/tấn ('+signed(yoyAt(hrc,hL),0)+'% YoY), thép thanh vằn '+signed(yoyAt(rbc,bL),0)+'%, quặng sắt '+signed(yoyAt(ore,oL),0)+'% ('+mon(oL.date)+'). Giá thép Trung Quốc là trần giá cho HRC Việt Nam dù đã có thuế chống bán phá giá.');
}
if(rolled.length&&document.getElementById('chSteelOut')){
 const bm=byMonth(bar),rs=rolled.slice(-36);
 barLineChart('chSteelOut',{categories:rs.map(r=>mon(r.date)),series:[{name:'Thép cán',color:C.navy,values:rs.map(r=>r.value)},{name:'Thép thanh, thép góc',color:C.teal,kind:'line',values:rs.map(r=>bm[ym(r.date)]?.value??null)}],unit:'nghìn tấn',digits:0,height:260,rotateLabels:true});
 legend('chSteelOut',[['Thép cán',C.navy],['Thép thanh, thép góc',C.teal]]);
 fillTable('tbl-steel-out',['Tháng','Thép cán (nghìn tấn)','YoY','Thép thanh, góc (nghìn tấn)','YoY'],rolled.slice().reverse().map(r=>{const b=bm[ym(r.date)];return [mon(r.date),nf(r.value,0),signed(yoyAt(rolled,r),1)+'%',nf(b?.value,0),signed(yoyAt(bar,b),1)+'%']}));
 sourceLine('chSteelOut',[SRC.nso],mon(rolled.at(-1).date),'Sản lượng công nghiệp: thép cán, thép thanh, thép góc. Sản lượng sản xuất, không phải tiêu thụ; thép thanh, góc là phần dùng cho xây dựng.');
 insight('chSteelOut','Lũy kế thép cán '+signed(ytdYo(rolled),0)+'%, thép thanh, góc '+signed(ytdYo(bar),0)+'%: phần thép xây dựng tăng chậm hơn tổng vì phần tăng mạnh là HRC từ Dung Quất 2. Thép thanh tháng 7–9 cao hơn cùng kỳ 20–30% — cầu xây dựng đã hồi, khớp với giải ngân đầu tư công tăng.');
}
if(sexp.length&&document.getElementById('chSteelExp')){
 const rs=sexp.slice(-36);
 barLineChart('chSteelExp',{categories:rs.map(r=>mon(r.date)),series:[{name:'Xuất khẩu sắt thép',color:C.gold,values:rs.map(r=>r.value)}],unit:'triệu USD',digits:0,height:260,rotateLabels:true});
 fillTable('tbl-steel-exp',['Tháng','Triệu USD','YoY'],sexp.slice().reverse().map(r=>[mon(r.date),nf(r.value,1),signed(yoyAt(sexp,r),0)+'%']));
 sourceLine('chSteelExp',[SRC.customs],mon(sexp.at(-1).date),'Mã 87985 trong bảng xuất khẩu theo mặt hàng. Chuỗi này nhỏ hơn nhiều số Hải quan công bố cho "sắt thép các loại" (vài trăm triệu USD/tháng) — nhiều khả năng chỉ là một thị trường hoặc một nhóm hàng; dùng để xem xu hướng, chưa đối chiếu được phạm vi.');
 insight('chSteelExp','Tháng 7–8/2026 cao gấp 3–4 lần cùng kỳ, sau một năm 2025 rất thấp vì Mỹ nâng thuế Mục 232 lên 50% và EU siết hạn ngạch. Mức tăng chủ yếu do nền thấp; xuất khẩu thép vẫn là kênh xả hàng khi cầu trong nước yếu, không phải động lực chính.');
}
// Xi măng & VLXD
const cem=S('cement_output'),cexp=S('cement_export'),iipN=S('iip_nonmetal');
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
if(asph.length&&document.getElementById('chVlxdPrice')){
 const ai=byMonth(idx(asph,BASE)),ki=byMonth(idx(coal,BASE)),base=asph.filter(r=>r.date.slice(0,7)>=BASE);
 lines('chVlxdPrice',base,[['Nhựa đường SHFE',C.plum,r=>ai[ym(r.date)]?.value??null],['Than Newcastle',C.gold,r=>ki[ym(r.date)]?.value??null]],'',0);
 legend('chVlxdPrice',[['Nhựa đường SHFE',C.plum],['Than Newcastle',C.gold]]);
 const km=byMonth(coal);
 fillTable('tbl-vlxd-price',['Kỳ','Nhựa đường SHFE (CNY/tấn)','Than Newcastle (USD/tấn)'],asph.slice().reverse().map(r=>[short(r.date),nf(r.value,0),nf(km[ym(r.date)]?.value,1)]));
 sourceLine('chVlxdPrice',[['SHFE · dữ liệu giao dịch ngày','https://www.shfe.com.cn/eng/Market/Futures/'],['ICE Newcastle',com.coal_newcastle?.url||null]],short(asph.at(-1).date),'Chỉ số T1/2024 = 100. Nhựa đường: giá thanh toán hợp đồng chính SHFE, phiên cuối tháng; than Newcastle: ICE, phiên cuối tháng. Giá xi măng, đá 1x2 của Sở Xây dựng chưa có nguồn công khai dạng dữ liệu.');
 const aL=asph.at(-1),kL=coal.at(-1);
 insight('chVlxdPrice','Nhựa đường '+signed(yoyAt(asph,aL),0)+'% YoY và than Newcastle '+signed(yoyAt(coal,kL),0)+'% — chi phí của nhà thầu đường (C4G, HHV, LCG) và xi măng (HT1, BCC) đi theo giá dầu, than thế giới.');
}
// Xây dựng & hạ tầng
const cred=S('credit_construction'),gdpN=S('gdp_construction_nominal');
if(cred.length&&document.getElementById('chCredit')){
 const rs=cred.slice(-36);
 barLineChart('chCredit',{categories:rs.map(r=>mon(r.date)),series:[{name:'Dư nợ tín dụng xây dựng',color:C.navy,values:rs.map(r=>r.value/1000)}],unit:'nghìn tỷ',digits:0,height:260,rotateLabels:true,zeroBase:false});
 fillTable('tbl-credit',['Tháng','Dư nợ (nghìn tỷ)','YoY'],cred.slice().reverse().map(r=>[mon(r.date),nf(r.value/1000,0),signed(yoyAt(cred,r),1)+'%']));
 sourceLine('chCredit',[SRC.sbv],mon(cred.at(-1).date),'Dư nợ tín dụng ngành xây dựng, cuối tháng.');
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
 const ids=[['281','Thép',C.navy],['264','Xi măng',C.teal],['260','Đá, VLXD',C.gold],['170','Hạ tầng, cầu đường',C.plum],['171','Xây dựng công trình',C.grey]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/B '+name,color,kind:'line',values:weekly.map(d=>at(id,d,2))})),unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Rổ mã','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),r[1]>0&&r[1]<200?nf(r[1],1):'—',nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[['VNDirect finfo','https://dstock.vndirect.com.vn/']],short(dates.at(-1)),'Rổ mã theo dõi: Thép (HPG, HSG, NKG); Xi măng (HT1, BCC); Đá, VLXD (KSB, DHA, VLB, PLC); Hạ tầng, cầu đường (C4G, LCG, HHV, CII, HUT); Xây dựng công trình (CTD, HBC, VCG, FCN, DPG). P/E = tổng vốn hóa / tổng lợi nhuận (vốn hóa ÷ P/E từng mã, VNDirect); mã lỗ không có P/E chỉ vào P/B và vốn hóa. Không phải toàn ngành. Vẽ mỗi 5 phiên.');
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
// ---------- 4. KPIs, quick read, catalyst brief ----------
const piLast=pi.at(-1),rL=rebar.at(-1),hL=hrc.at(-1),cemL=cem.at(-1),aL=asph.at(-1),pe=sec['281']?.records||[],peL=pe.at(-1),pe0=pe[0];
const piY=piLast?piLast.date.slice(0,4):'',piMo=piLast?piLast.date.slice(5,7):'';
kpi('spk-pub',piLast?nf(ytdSum(pi,piY,piMo)/1000,0):'—',piLast?'nghìn tỷ · NSNN '+Number(piMo)+'T/'+piY:'—',piLast?signed(ytdYo(pi),0)+'% so cùng kỳ':'',pi.slice(-12).map(r=>r.value));
kpi('spk-rebar',rL?nf(rL.value,2):'—',rL?'nghìn đ/kg · '+short(rL.date):'—',rL?signed(yoyAt(rebar,rL),0)+'% so cùng kỳ':'',rebar.slice(-12).map(r=>r.value),C.navy);
kpi('spk-hrc',hL?nf(hL.value,0):'—',hL?'CNY/tấn · '+short(hL.date):'—',hL?signed(yoyAt(hrc,hL),0)+'% so cùng kỳ':'',hrc.slice(-12).map(r=>r.value),C.teal);
kpi('spk-cement',cemL?nf(cemL.value,1):'—',cemL?'triệu tấn · '+mon(cemL.date):'—',cemL?'lũy kế '+signed(ytdYo(cem),0)+'%':'',cem.slice(-12).map(r=>r.value),C.grey);
kpi('spk-asphalt',aL?nf(aL.value,0):'—',aL?'CNY/tấn · '+short(aL.date):'—',aL?signed(yoyAt(asph,aL),0)+'% so cùng kỳ':'',asph.slice(-12).map(r=>r.value),C.plum);
kpi('spk-pe',peL?nf(peL[1],1)+'x':'—',peL?'P/E thép · '+short(peL[0]):'—',peL?'P/B '+nf(peL[2],2)+'x':'',pe.slice(-30).map(r=>r[1]),C.grey);
const quick=document.querySelector('.hero .insight');
if(quick&&piLast){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu công khai: '),`Vốn NSNN thực hiện ${Number(piMo)}T/${piY} ${nf(ytdSum(pi,piY,piMo)/1000,0)} nghìn tỷ (${signed(ytdYo(pi),0)}%). Thép CB300 Hòa Phát ${nf(rL?.value,2)} nghìn đ/kg (${signed(yoyAt(rebar,rL),0)}%), HRC Trung Quốc ${signed(yoyAt(hrc,hL),0)}%. Xi măng lũy kế ${signed(ytdYo(cem),0)}%. Nhựa đường ${signed(yoyAt(asph,aL),0)}%. P/E thép ${peL?nf(peL[1],1):'—'}x.`);
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
const piYo=ytdYo(pi),rY=yoyAt(rebar,rL),hY=yoyAt(hrc,hL),oY=yoyAt(ore,ore.at(-1)),kY=yoyAt(coke,coke.at(-1)),cY=ytdYo(cem),aY=yoyAt(asph,aL),coY=yoyAt(coal,coal.at(-1)),crY=yoyAt(cred,cred.at(-1)),barY=ytdYo(bar);
const row=(group,name,big,evidence,cond,st,who,chart)=>({group,name,big,chart,st,mid:[evidence,cond],end:[who]});
const score=[
 row('Cầu','Đầu tư công tăng tốc',[signed(piYo,0)+'%','vốn NSNN lũy kế'],nf(ytdSum(pi,piY,piMo)/1000,0)+' nghìn tỷ '+Number(piMo)+'T/'+piY,'Lũy kế về dưới +10%',piYo==null?'na':piYo>15?'good':piYo<5?'risk':'watch','▲ C4G · LCG · HHV · VCG · VLB · KSB · DHA','chPubInv'),
 row('Cầu','Thép xây dựng tiêu thụ tốt',[signed(barY,0)+'%','thép thanh, góc lũy kế'],'Tháng 7–9 cao hơn cùng kỳ 20–30%','Lũy kế về dưới 0%',barY==null?'na':barY>5?'good':barY<0?'risk':'watch','▲ HPG','chSteelOut'),
 row('Giá','Giá thép trong nước giữ',[rL?nf(rL.value,2):'—','nghìn đ/kg CB300 ('+signed(rY,0)+'%)'],'Quặng '+signed(oY,0)+'%, than cốc '+signed(kY,0)+'%','Thép CB300 về dưới 13 nghìn đ/kg',rY==null?'na':rY>3?'good':rY<-5?'risk':'watch','▲ HPG','chSteelPrice'),
 row('Giá','HRC Trung Quốc yếu',[signed(hY,0)+'%','HRC TQ YoY'],'HRC '+(hL?nf(hL.value,0):'—')+' CNY/tấn; là trần giá HRC Việt Nam','HRC TQ > 3.500 CNY/tấn',hY==null?'na':hY<-5?'risk':hY>5?'good':'watch','▼ HPG (HRC) · ▲ HSG · NKG (nguyên liệu rẻ)','chSteelPrice'),
 row('Chi phí','Nhựa đường, than đắt',[signed(aY,0)+'%','nhựa đường YoY'],'Than Newcastle '+signed(coY,0)+'%','Nhựa đường về dưới mức cùng kỳ',aY==null?'na':aY>20?'risk':aY<0?'good':'watch','▼ C4G · HHV · LCG · HT1 · BCC','chVlxdPrice'),
 row('Cung','Xi măng dư cung',[signed(cY,0)+'%','sản lượng lũy kế'],'Công suất >130 triệu tấn; nội địa 2025 ~75 triệu, XK 37,5 triệu','Đóng cửa lò hoặc giá xi măng tăng >10%',cY==null?'na':'watch','HT1 · BCC','chCement'),
 row('Vốn','Tín dụng xây dựng tăng',[signed(crY,0)+'%','dư nợ YoY'],'Nhà thầu vay theo khối lượng; nợ vay, phải thu tăng cùng','Tăng trưởng về dưới 10%',crY==null?'na':crY>15?'good':crY<8?'risk':'watch','CTD · HBC · VCG · FCN','chCredit'),
 row('Định giá','Thép rẻ, cầu đường đắt',[peL?nf(peL[1],1)+'x':'—','P/E thép'],'P/B thép '+(peL?nf(peL[2],2):'—')+'x'+(pe0?' (đầu kỳ '+nf(pe0[2],2)+'x)':'')+'; cầu đường P/B ~4,6x','BCTC quý III (20–30/10)',peL?'info':'na','HPG · C4G · VCG','chSectorVal')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.CONSTRUCTION_BRIEF={
 headline:'Đầu tư công +'+nf(piYo,0)+'% kéo khối lượng thi công và thép xây dựng; giá thép trong nước giữ, nhưng HRC Trung Quốc yếu và nhựa đường, than đắt ăn vào biên nhà thầu đường, xi măng · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Thép','HPG · HSG · NKG',rY!=null&&rY>3?'up':'flat','CB300 '+signed(rY,0)+'%'],['Xi măng & VLXD','HT1 · BCC · VLB · KSB · DHA · PLC · VGC',cY!=null&&cY>5?'up':'flat','Xi măng '+signed(cY,0)+'%'],['Xây dựng & hạ tầng','CTD · HBC · VCG · FCN · DPG · C4G · LCG · HHV · CII · HUT',piYo!=null&&piYo>15?'up':'flat','NSNN '+signed(piYo,0)+'%']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Đầu tháng','NSO: vốn NSNN thực hiện, sản lượng thép, xi măng'],['Hằng tuần','Giá thép, HRC, quặng, than'],['20–30/10','BCTC quý III'],['Cuối năm','Giao kế hoạch vốn 2027; khởi công đường sắt']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ nguồn công khai lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; giá hàng hóa: IMF/FRED, EIA, ICE.';
})();
