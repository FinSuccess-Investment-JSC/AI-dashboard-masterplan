/* Pharma & healthcare dashboard (Dược & y tế): value chain, Dược phẩm / Dịch vụ y tế panes and sector valuation
   from window.PHARMA_PUBLIC (scripts/build_sector_public.py: public commodity series only): drug imports, API imports, IIP, CPI health, FX, GDP health).
   Document figures sit in the HTML and in window.PHARMA_DOCS below; every one is backed by data/pharma/evidence.json.
   Publishes window.PHARMA_BRIEF for catalyst-board.js. Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='pharma')return;
const W=window.PHARMA_PUBLIC||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const qtr=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(0,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},sec=B.sector_ratio?.by_sector||{};
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],customs:['Hải quan Việt Nam','https://www.customs.gov.vn/'],sbv:['Ngân hàng Nhà nước','https://www.sbv.gov.vn/'],wi:['Nguồn công khai',null]};
for(const v of Object.values(macro)){if(/nso\.gov\.vn\/wp-content/.test(v.url||'')&&SRC.nso)SRC.nso=[SRC.nso[0],v.url];if(/customs/.test(v.url||'')&&SRC.customs)SRC.customs=[SRC.customs[0],v.url]}
const S=k=>macro[k]?.records||[];
const ym=d=>d.slice(0,7);
const byMonth=rs=>{const m={};rs.forEach(r=>{m[ym(r.date)]=r});return m};
const yoyAt=(rs,r)=>{if(!r)return null;const p=rs.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};
const ytdSum=(rs,y,m)=>rs.filter(r=>r.date.slice(0,4)===y&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0);
const ytdYo=rs=>{const l=rs.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),p=ytdSum(rs,String(y-1),m);return p?(ytdSum(rs,y,m)/p-1)*100:null};

// ---------- 1. Value chain ----------
const chain=document.querySelector('[data-block-id="duoc-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='12/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['api',25,40,['API nhập khẩu','Trung Quốc · Ấn Độ · tá dược']],['import',25,165,['Thuốc nhập thành phẩm','biệt dược gốc · generic ngoại']],['fx',25,290,['Tỷ giá USD/VND','giá vốn nguyên liệu']],
  ['mfg',315,40,['Sản xuất thuốc','DHG · IMP · DBD · TRA · DMC · DVN']],['etc',315,165,['Kênh ETC','bệnh viện · đấu thầu tập trung']],['otc',315,290,['Kênh OTC','nhà thuốc · chuỗi Long Châu (FRT)']],
  ['hosp',605,165,['Bệnh viện, phòng khám','công lập · tư nhân (TNH)']],['bhyt',605,40,['Quỹ BHYT','chi trả thuốc, khám chữa bệnh']],
  ['patient',895,165,['Người bệnh','tự chi trả · BHYT']]
 ];
 const edges=[['api','mfg'],['fx','mfg',true],['mfg','etc'],['mfg','otc'],['import','etc'],['import','otc'],['etc','hosp'],['bhyt','hosp',true],['hosp','patient'],['otc','patient']];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b];let d;
  if(A[2]===Bn[2]){const fw=Bn[1]>A[1];d=`M${A[1]+(fw?w:0)} ${A[2]+h/2} H${Bn[1]+(fw?0:w)}`}
  else if(A[1]===Bn[1]){d=`M${A[1]+w/2} ${A[2]+(Bn[2]>A[2]?h:0)} V${Bn[2]+(Bn[2]>A[2]?0:h)}`}
  else{const fw=Bn[1]>A[1],x1=A[1]+(fw?w:0),y1=A[2]+h/2,x2=Bn[1]+(fw?0:w),y2=Bn[2]+h/2,mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`}
  return `<path d="${d}" class="chain-edge${dashed?' dashed':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t.replace(/&/g,'&amp;')}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1140 375" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành dược và y tế</title><desc id="chain-desc">API nhập khẩu vào nhà máy sản xuất thuốc; thuốc trong nước và thuốc nhập đi qua kênh ETC (bệnh viện, đấu thầu) và OTC (nhà thuốc) tới người bệnh; quỹ BHYT chi trả qua bệnh viện.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: nhà sản xuất trong nước (DHG, IMP, DBD, TRA, DMC) nhập gần hết API nên giá vốn đi theo giá nguyên liệu Trung Quốc, Ấn Độ và tỷ giá. Kênh ETC mua qua đấu thầu, giá do nhóm tiêu chí kỹ thuật quyết định — nhà máy EU-GMP vào nhóm giá cao. Kênh OTC đang dồn về chuỗi lớn (Long Châu); bệnh viện tư như TNH sống nhờ lượt khám và thanh toán BHYT.'));
 figure.after(make('div','source-note','Mũi tên liền: dòng hàng và doanh thu · Mũi tên đứt: chi phí, nguồn chi trả. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Panes: Dược phẩm / Dịch vụ y tế ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead');
 const children=[...section.children].filter(e=>e!==head),drugP=make('div','supply-pane'),careP=make('div','supply-pane');
 drugP.id='supply-world';careP.id='supply-vietnam';
 let cur=drugP;children.forEach(e=>{if(e.matches('h3.subhead')){cur=e.textContent.trim().startsWith('Dịch vụ')?careP:drugP;e.remove();return}cur.append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Nhóm');
 const panes=[drugP,careP],labels=['Dược phẩm','Dịch vụ y tế'];
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

const imp=S('import_drugs'),api=S('import_api'),iip=S('iip_pharma'),cpi=S('cpi_health'),fx=S('usdvnd'),gdp=S('gdp_health');
// Dược phẩm: nhập khẩu thành phẩm (cạnh tranh) và nguyên liệu (đầu vào)
if(imp.length&&document.getElementById('chImports')){
 const rs=imp.slice(-36),am=byMonth(api);
 barLineChart('chImports',{categories:rs.map(r=>mon(r.date)),series:[{name:'Dược phẩm thành phẩm',color:C.navy,values:rs.map(r=>r.value)},{name:'Nguyên phụ liệu dược',color:C.gold,kind:'line',values:rs.map(r=>am[ym(r.date)]?.value??null)}],unit:'triệu USD',digits:0,height:260,rotateLabels:true});
 legend('chImports',[['Thuốc thành phẩm nhập',C.navy],['Nguyên phụ liệu dược (API, tá dược)',C.gold]]);
 fillTable('tbl-imports',['Tháng','Thành phẩm (triệu USD)','YoY','Nguyên phụ liệu (triệu USD)','YoY'],imp.slice().reverse().map(r=>{const a=am[ym(r.date)];return [mon(r.date),nf(r.value,1),signed(yoyAt(imp,r),0)+'%',nf(a?.value,1),signed(yoyAt(api,a),0)+'%']}));
 sourceLine('chImports',[SRC.customs],mon(imp.at(-1).date),'Nhập khẩu dược phẩm và nguyên phụ liệu dược phẩm. Thành phẩm nhập là hàng cạnh tranh với thuốc sản xuất trong nước; nguyên phụ liệu là đầu vào của nhà máy.');
 insight('chImports','Thuốc thành phẩm nhập lũy kế '+signed(ytdYo(imp),0)+'%, nguyên phụ liệu '+signed(ytdYo(api),0)+'%. Thuốc ngoại vẫn chiếm phần lớn giá trị tiền thuốc (~4 tỷ USD/năm), cạnh tranh trực tiếp ở nhóm 1–2 đấu thầu. Nguyên liệu nhập nhỏ về giá trị nhưng quyết định giá vốn của DHG, IMP, DBD.');
}
if(iip.length&&document.getElementById('chIip')){
 const rs=iip.slice(-36);
 barLineChart('chIip',{categories:rs.map(r=>mon(r.date)),series:[{name:'IIP sản xuất thuốc',color:C.teal,kind:'line',values:rs.map(r=>r.value)}],unit:'%',digits:0,height:260,rotateLabels:true,zeroBase:false});
 fillTable('tbl-iip',['Tháng','IIP so cùng kỳ (%)'],iip.slice().reverse().map(r=>[mon(r.date),signed(r.value,1)]));
 sourceLine('chIip',[SRC.nso],mon(iip.at(-1).date),'IIP sản xuất thuốc, hóa dược và dược liệu, % so cùng kỳ. Không có sản lượng tuyệt đối.');
 const last3=iip.slice(-3).map(r=>r.value);
 insight('chIip','Ba tháng gần nhất '+last3.map(v=>signed(v,0)+'%').join(', ')+': nhà máy chạy cao hơn năm trước sau giai đoạn âm đầu năm. Chuỗi biến động mạnh theo tháng (mùa đấu thầu, Tết) nên đọc theo xu hướng quý.');
}
if(fx.length&&document.getElementById('chCost')){
 const base=fx.filter(r=>r.date>='2025-01'),cm=byMonth(cpi);
 barLineChart('chCost',{categories:base.map(r=>mon(r.date)),series:[{name:'Tỷ giá trung tâm (chỉ số T1/2025=100)',color:C.navy,kind:'line',values:base.map(r=>r.value/base[0].value*100)},{name:'CPI thuốc & dịch vụ y tế (T1/2025=100)',color:C.plum,kind:'line',values:base.map(r=>{const c=cm[ym(r.date)],b=cm[ym(base[0].date)];return c&&b?c.value/b.value*100:null})}],unit:'',digits:1,height:260,rotateLabels:true,zeroBase:false});
 legend('chCost',[['Tỷ giá USD/VND',C.navy],['CPI thuốc & dịch vụ y tế',C.plum]]);
 fillTable('tbl-cost',['Tháng','Tỷ giá trung tâm (VND)','CPI y tế (2024=100)'],fx.filter(r=>r.date>='2025-01').reverse().map(r=>[mon(r.date),nf(r.value,0),nf(cm[ym(r.date)]?.value,2)]));
 sourceLine('chCost',[SRC.sbv,SRC.nso],mon(fx.at(-1).date),'Tỷ giá trung tâm bình quân tháng; CPI thuốc và dịch vụ y tế. Nguồn đổi gốc chỉ số CPI từ T1/2025 nên chart bắt đầu từ đó.');
 const fy=yoyAt(fx,fx.at(-1)),cy=yoyAt(cpi,cpi.at(-1));
 insight('chCost','Tỷ giá '+signed(fy,1)+'% so cùng kỳ, CPI thuốc & dịch vụ y tế '+signed(cy,1)+'%: '+(fy>cy+1?'chi phí API (trả bằng USD) tăng nhanh hơn giá bán':'giá bán đang theo kịp chi phí nhập')+'. Giá trúng thầu cố định theo kỳ thầu 12–24 tháng nên khi tỷ giá tăng nhanh, biên gộp nhà sản xuất chịu phần chênh trước.');
}
if(gdp.length&&document.getElementById('chGdpHealth')){
 const yrs=[...new Set(gdp.map(r=>r.date.slice(0,4)))].sort(),q9=yrs.map(y=>gdp.find(r=>r.date===y+'-09-01')).filter(Boolean);
 barLineChart('chGdpHealth',{categories:q9.map(r=>'9T/'+r.date.slice(0,4)),series:[{name:'GDP y tế & cứu trợ xã hội 9 tháng',color:C.teal,values:q9.map(r=>r.value/1000)}],unit:'nghìn tỷ',digits:0,height:260});
 fillTable('tbl-gdp',['Kỳ','Nghìn tỷ đồng (lũy kế, danh nghĩa)'],gdp.slice().reverse().map(r=>[qtr(r.date)+' lũy kế',nf(r.value/1000,1)]));
 sourceLine('chGdpHealth',[SRC.nso],qtr(gdp.at(-1).date),'GDP danh nghĩa ngành y tế và hoạt động cứu trợ xã hội, lũy kế từ đầu năm; so cùng kỳ 9 tháng. Không tách chi tiêu thuốc.');
 const l=q9.at(-1),p=q9.at(-2);
 insight('chGdpHealth','Giá trị tăng thêm ngành y tế 9T/'+l.date.slice(0,4)+' '+nf(l.value/1000,0)+' nghìn tỷ, '+signed((l.value/p.value-1)*100,0)+'% so cùng kỳ — cầu dịch vụ y tế tăng nhanh hơn GDP chung, là nền của bệnh viện tư (TNH) và chuỗi nhà thuốc.');
}
// Định giá ngành dược (GICS 222)
const v222=sec['222']?.records||[];
if(v222.length&&document.getElementById('chSectorVal')){
 const weekly=v222.filter((r,i)=>i%5===0||i===v222.length-1);
 barLineChart('chSectorVal',{categories:weekly.map(r=>r[0].slice(8,10)+'/'+r[0].slice(5,7)+'/'+r[0].slice(2,4)),series:[{name:'P/E ngành dược',color:C.navy,kind:'line',values:weekly.map(r=>r[1])},{name:'P/B ×10',color:C.teal,kind:'line',values:weekly.map(r=>r[2]*10)}],unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',[['P/E',C.navy],['P/B (nhân 10 để cùng trục)',C.teal]]);
 fillTable('tbl-sector-val',['Phiên','P/E','P/B'],v222.slice().reverse().map(r=>[short(r[0]),nf(r[1],2),nf(r[2],2)]));
 sourceLine('chSectorVal',[['VNDirect finfo','https://dstock.vndirect.com.vn/']],short(v222.at(-1)[0]),'Rổ mã theo dõi: Dược phẩm (DHG, IMP, DBD, TRA, DMC, DVN). P/E = tổng vốn hóa / tổng lợi nhuận (vốn hóa ÷ P/E từng mã, VNDirect); mã lỗ không có P/E chỉ vào P/B và vốn hóa. Không phải toàn ngành. Vẽ mỗi 5 phiên.');
 const f=v222[0],l=v222.at(-1);
 insight('chSectorVal',(()=>{const L=[['222','Dược phẩm']].filter(([id])=>sec[id]?.records?.length);const l0=sec[L[0][0]].records.at(-1);return 'P/E rổ mã theo dõi, phiên '+short(l0[0])+': '+L.map(([id,name])=>{const r=sec[id].records,l=r.at(-1),y=r.find(x=>x[0]>=String(+l[0].slice(0,4)-1)+l[0].slice(4));return name+' '+nf(l[1],(1==2?2:1))+'x'+(y&&y[1]!=null?' (1 năm trước '+nf(y[1],(1==2?2:1))+'x)':'')}).join('; ')+'.'})());
}
// Tài liệu: chart từ số có evidence (window.PHARMA_DOCS khai báo trong trang)
const D=window.PHARMA_DOCS||{};
(D.charts||[]).forEach(c=>{if(!document.getElementById(c.id))return;
 if(c.kind==='hbar')hbarCompare(c.id,{items:c.items.map((it,i)=>({label:it[0],value:it[1],color:it[2]||[C.navy,C.teal,C.gold,C.plum,C.grey][i%5]})),unit:c.unit,digits:c.digits??0,labelW:c.labelW||170,ariaLabel:c.title});
 else barLineChart(c.id,{categories:c.categories,series:c.series.map((s,i)=>({name:s[0],color:s[2]||[C.navy,C.teal,C.gold][i],kind:s[3],values:s[1]})),unit:c.unit,digits:c.digits??0,height:260});
 if(c.legend)legend(c.id,c.series.map((s,i)=>[s[0],s[2]||[C.navy,C.teal,C.gold][i]]));
 sourceLine(c.id,c.sources,c.period,c.method,false);if(c.insight)insight(c.id,c.insight)});

// ---------- 4. KPIs, quick read, catalyst brief ----------
const iL=imp.at(-1),aL=api.at(-1),pL=iip.at(-1),cL=cpi.at(-1),fL=fx.at(-1),vL=v222.at(-1);
const impY=ytdYo(imp),apiY=ytdYo(api),fxY=yoyAt(fx,fL),cpiY=yoyAt(cpi,cL),iipQ=iip.slice(-3).reduce((a,r)=>a+r.value,0)/Math.max(1,iip.slice(-3).length);
kpi('spk-import',iL?nf(iL.value,0):'—',iL?'triệu USD thuốc nhập · '+mon(iL.date):'—',iL?'lũy kế '+signed(impY,0)+'%':'',imp.slice(-12).map(r=>r.value));
kpi('spk-api',aL?nf(aL.value,1):'—',aL?'triệu USD nguyên liệu · '+mon(aL.date):'—',aL?'lũy kế '+signed(apiY,0)+'%':'',api.slice(-12).map(r=>r.value),C.gold);
kpi('spk-iip',pL?signed(pL.value,1)+'%':'—',pL?'IIP sản xuất thuốc · '+mon(pL.date):'—',pL?'TB 3 tháng '+signed(iipQ,1)+'%':'',iip.slice(-12).map(r=>r.value),C.teal);
kpi('spk-cpi',cL?signed(cpiY,1)+'%':'—',cL?'CPI thuốc & y tế YoY · '+mon(cL.date):'—','',cpi.slice(-12).map(r=>r.value),C.plum);
kpi('spk-fx',fL?nf(fL.value,0):'—',fL?'VND/USD trung tâm · '+mon(fL.date):'—',fL?signed(fxY,1)+'% so cùng kỳ':'',fx.slice(-12).map(r=>r.value),C.red);
kpi('spk-pe',vL?nf(vL[1],1)+'x':'—',vL?'P/E ngành dược · '+short(vL[0]):'—',vL?'P/B '+nf(vL[2],2)+'x':'',v222.slice(-30).map(r=>r[1]),C.grey);
const quick=document.querySelector('.hero .insight');
if(quick&&iL){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu công khai: '),`Thuốc nhập ${mon(iL.date)} ${nf(iL.value,0)} triệu USD (lũy kế ${signed(impY,0)}%); nguyên liệu dược lũy kế ${signed(apiY,0)}%. IIP sản xuất thuốc ${signed(pL?.value,0)}%. Tỷ giá ${signed(fxY,1)}% YoY, CPI y tế ${signed(cpiY,1)}%. P/E ngành dược ${vL?nf(vL[1],1):'—'}x.`);
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
const row=(group,name,big,evidence,cond,st,who,chart)=>({group,name,big,chart,st,mid:[evidence,cond],end:[who]});
const score=[
 row('Dược phẩm','Tỷ giá đẩy giá vốn API',[signed(fxY,1)+'%','USD/VND so cùng kỳ'],'CPI thuốc & y tế '+signed(cpiY,1)+'%','Tỷ giá tăng quá +4% YoY',fxY==null?'na':fxY>4?'risk':fxY<1?'good':'watch','▼ DHG · IMP · DBD · DMC (API nhập)','chCost'),
 row('Dược phẩm','Thuốc ngoại nhập',[signed(impY,0)+'%','thuốc thành phẩm nhập lũy kế'],iL?nf(iL.value,0)+' triệu USD tháng '+Number(iL.date.slice(5,7)):'—','Lũy kế tăng trên +10% (cạnh tranh nhóm 1–2)',impY==null?'na':impY>10?'risk':impY<0?'good':'watch','▼ nhà sản xuất nội · ▲ nhà phân phối, Long Châu','chImports'),
 row('Dược phẩm','Nhà máy chạy',[signed(iipQ,0)+'%','IIP thuốc, TB 3 tháng'],'Tháng gần nhất '+signed(pL?.value,0)+'%','TB 3 tháng về dưới 0%',pL==null?'na':iipQ>5?'good':iipQ<0?'risk':'watch','▲ DHG · IMP · DBD · TRA','chIip'),
 row('Dịch vụ y tế','Cầu y tế tăng nhanh',[(D.gdpYoY!=null?signed(D.gdpYoY,0):'—')+'%','GDP y tế 9T'],'Dân số già, BHYT bao phủ rộng','Tăng trưởng về dưới GDP chung',D.gdpYoY==null?'na':D.gdpYoY>8?'good':'watch','▲ FRT (Long Châu) · TNH','chGdpHealth'),
 row('Định giá','Dược định giá thấp',[vL?nf(vL[1],1)+'x':'—','P/E ngành dược'],vL?'P/B '+nf(vL[2],2)+'x · '+short(vL[0]):'—','BCTC quý III (20–30/10)',vL?'info':'na','DHG · IMP · DBD','chSectorVal')
];
const g=gdp.filter(r=>r.date.slice(5,7)==='09');if(g.length>1)score[3].big[0]=signed((g.at(-1).value/g.at(-2).value-1)*100,0)+'%',score[3].st=(g.at(-1).value/g.at(-2).value-1)*100>8?'good':'watch';
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.PHARMA_BRIEF={
 headline:'Cầu y tế tăng đều, nhà máy chạy cao hơn năm trước; tỷ giá '+signed(fxY,1)+'% YoY là biến chi phí cần theo dõi · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Dược phẩm','DHG · IMP · DBD · TRA · DMC · DVN',fxY!=null&&fxY>4?'down':'flat','Tỷ giá '+signed(fxY,1)+'%'],['Dịch vụ y tế','FRT · TNH','up',score[3].big[0]+' GDP y tế']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Đầu tháng','NSO: IIP, CPI; Hải quan: nhập khẩu dược'],['20–30/10','BCTC quý III'],['Theo đợt','Cục Quản lý Dược: cấp, gia hạn số đăng ký thuốc'],['Theo kỳ thầu','Kết quả đấu thầu tập trung quốc gia, BHYT']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ nguồn công khai lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; giá hàng hóa: IMF/FRED, EIA, ICE.';
})();
