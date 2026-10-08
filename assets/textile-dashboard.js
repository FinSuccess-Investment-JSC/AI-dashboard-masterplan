/* Textile & garment dashboard: value chain, Sợi / Dệt nhuộm – May panes and every chart
   drawn from window.TEXTILE_WI (scripts/build_textile_wi.py from WiMCP captures) and from
   the document figures in data/textile/*.json (shown as HTML tables, charted here).
   Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='textile')return;
const W=window.TEXTILE_WI||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={customs:['Hải quan Việt Nam','https://www.customs.gov.vn/'],nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],census:['US Census · bán lẻ','https://www.census.gov/retail/'],ice:['ICE Cotton No.2','https://www.ice.com/products/254/Cotton-No-2-Futures'],wi:['MCP Wi (Widata)',null]};
const S=k=>macro[k]?.records||[],P=k=>com[k]?.records||[];
// Month-end key so daily commodity points and month-start macro points share one axis.
const ym=d=>d.slice(0,7);
const byMonth=rs=>{const m={};rs.forEach(r=>{m[ym(r.date)]=r});return m};
const yoyAt=(rs,r)=>{if(!r)return null;const p=rs.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};

// ---------- 1. Value chain (Tổng quan) ----------
const chain=document.querySelector('[data-block-id="dm-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='08/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['cotton',25,40,['Bông · xơ PSF','ICE · PTA/MEG Trung Quốc']],['yarn',315,40,['Kéo sợi','STK · ADS']],['fabric',605,40,['Dệt · nhuộm hoàn tất','Nhập ~17 tỷ USD vải/năm']],
  ['garment',605,165,['May (CMT · FOB)','TCM · TNG · MSH · GIL']],['brand',895,165,['Nhãn hàng Mỹ, EU, Nhật','Nike · Adidas · Uniqlo · H&M…']],
  ['vinatex',315,165,['Tập đoàn','VGT (Vinatex)']],['import',315,290,['Vải, nguyên phụ liệu nhập','Trung Quốc · Hàn Quốc · Đài Loan']],['policy',895,290,['Thuế quan · FTA · xuất xứ','Mục 301 12,5% · EVFTA · CPTPP']]
 ];
 const edges=[['cotton','yarn'],['yarn','fabric'],['fabric','garment'],['garment','brand'],['import','garment'],['vinatex','garment',true],['vinatex','yarn',true],['policy','brand',true]];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b];let d;
  if(A[2]===Bn[2]){const fw=Bn[1]>A[1];d=`M${A[1]+(fw?w:0)} ${A[2]+h/2} H${Bn[1]+(fw?0:w)}`}
  else if(A[1]===Bn[1]){d=`M${A[1]+w/2} ${A[2]+(Bn[2]>A[2]?h:0)} V${Bn[2]+(Bn[2]>A[2]?0:h)}`}
  else{const fw=Bn[1]>A[1],x1=A[1]+(fw?w:0),y1=A[2]+h/2,x2=Bn[1]+(fw?0:w),y2=Bn[2]+h/2,mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`}
  return `<path d="${d}" class="chain-edge${dashed?' dashed':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1140 375" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành dệt may</title><desc id="chain-desc">Bông và xơ được kéo thành sợi, dệt nhuộm thành vải, may thành sản phẩm bán cho nhãn hàng Mỹ, EU, Nhật; vải và phụ liệu nhập khẩu đi thẳng vào khâu may.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: Việt Nam mạnh ở khâu may, yếu ở dệt nhuộm nên phải nhập phần lớn vải. Vì vậy biên của nhà may phụ thuộc giá gia công và thuế quan nhiều hơn giá bông; còn nhà sợi (STK, ADS) ăn chênh lệch giữa giá sợi và giá xơ, bông. Quy tắc xuất xứ "từ sợi" của CPTPP và "từ vải" của EVFTA là lý do vải nhập từ Trung Quốc trở thành rủi ro khi Mỹ siết chuyển tải.'));
 figure.after(make('div','source-note','Mũi tên liền: dòng nguyên liệu và sản phẩm · Mũi tên đứt: sở hữu, chính sách. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Bức tranh ngành: Dệt nhuộm – May / Sợi / XK & thuế quan / Đơn hàng & nhãn hàng ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead');
 const children=[...section.children].filter(e=>e!==head),garment=make('div','supply-pane'),yarn=make('div','supply-pane'),trade=make('div','supply-pane'),orders=make('div','supply-pane');
 garment.id='supply-world';yarn.id='supply-vietnam';trade.id='supply-trade';orders.id='supply-orders';
 let isYarn=false;children.forEach(e=>{if(e.matches('h3')&&/^Sợi/.test(e.textContent.trim()))isYarn=true;(isYarn?yarn:garment).append(e)});
 // Former tabs 8–9 become sub-tabs; their intro line stays as a caption, the numbered heading goes.
 [['mt10',trade],['mt11',orders]].forEach(([tab,pane])=>{const old=document.querySelector(`.majorpane[data-tab="${tab}"]`);if(!old)return;
  [...old.children].forEach(n=>{if(n.matches('.sectionhead')){const p=n.querySelector('p');if(p)pane.append(make('p','research-caption',p.textContent));return}pane.append(n)});old.remove()});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Khâu');
 const panes=[garment,yarn,trade,orders],labels=['Dệt nhuộm – May','Sợi','XK & thuế quan','Đơn hàng & nhãn hàng'];
 function select(i){panes.forEach((p,j)=>{p.hidden=i!==j;const b=tabs.children[j];b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1})}
 labels.forEach((label,i)=>{const b=make('button','tabbtn',label);b.type='button';b.id='supply-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',panes[i].id);panes[i].setAttribute('role','tabpanel');panes[i].setAttribute('aria-labelledby',b.id);b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{const n=panes.length;let next;if(e.key==='ArrowRight')next=(i+1)%n;else if(e.key==='ArrowLeft')next=(i+n-1)%n;else if(e.key==='Home')next=0;else if(e.key==='End')next=n-1;if(next!==undefined){e.preventDefault();select(next);tabs.children[next].focus()}});tabs.append(b)});
 head.after(tabs,...panes);select(0);
}

// ---------- 3. Charts ----------
function sourceLine(id,parts,period,method){
 const host=document.getElementById(id);if(!host)return;const block=host.closest('.card');
 const n=make('div','source-note cadence-note');n.append('Nguồn: ');
 parts.forEach(([name,url],i)=>{if(i)n.append(' · ');if(url){const a=make('a','',name);a.href=url;a.target='_blank';a.rel='noopener';n.append(a)}else n.append(name)});
 n.append(` · Kỳ cuối: ${period} · Wi kiểm: ${checked?short(checked.slice(0,4)+'-'+checked.slice(4,6)+'-'+checked.slice(6,8)):'—'}`);host.after(n);
 if(method)n.after(make('div','source-note method-note',method));
 if(block){block.dataset.refreshStatus='loaded';block.dataset.sourceIds='wi'}
}
function insight(id,text){const block=document.getElementById(id)?.closest('.card');if(!block)return;const n=make('div','chart-insight');n.dataset.inputOwner='ai';n.innerHTML='<b>Cách hiểu trong bối cảnh ngành · AI:</b> ';n.append(text);block.append(n)}
function legend(id,items){const host=document.getElementById(id);if(!host)return;const l=make('div','legend');items.forEach(([n,c])=>{const s=make('span','li'),d=make('span','dot');d.style.background=c;s.append(d,n);l.append(s)});host.after(l)}
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;card.querySelector('.value').textContent=value;card.querySelector('.sub').textContent=sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();if(series?.length)sparkline(spark,series,color)}
function ctBar(id,model){const host=document.getElementById(id);if(!host)return;if(window.ChartTypes)return ChartTypes.mount(host,{...model,native:'bar'},()=>{host.innerHTML=ChartTypes.render(model,'bar')});barLineChart(id,{...model,height:260})}
function stack(id,model){const host=document.getElementById(id);if(!host)return;if(window.ChartTypes)return ChartTypes.mount(host,{...model,native:'stack',stackable:true},()=>{host.innerHTML=ChartTypes.render(model,'stack')});barLineChart(id,{...model,height:260,rotateLabels:true})}

// Xuất khẩu dệt may theo tháng
const exp=S('exp_textile');
if(exp.length&&document.getElementById('chExport')){
 const rs=exp.slice(-36);
 barLineChart('chExport',{categories:rs.map(r=>mon(r.date)),series:[{name:'XK hàng dệt, may',color:C.navy,values:rs.map(r=>r.value)}],unit:'triệu USD',digits:0,height:260,rotateLabels:true});
 fillTable('tbl-export',['Tháng','Triệu USD','So cùng kỳ'],exp.slice().reverse().map(r=>[mon(r.date),nf(r.value,0),signed(yoyAt(exp,r),1)+'%']));
 sourceLine('chExport',[SRC.customs,SRC.wi],mon(exp.at(-1).date),'Kim ngạch xuất khẩu nhóm "Hàng dệt, may" theo hải quan (chỉ tiêu 83528). Không gồm xơ sợi, vải, nguyên phụ liệu; VITAS công bố "toàn ngành" gồm cả các nhóm này nên con số lớn hơn.');
 insight('chExport','Đây là doanh thu gộp của khâu may. Tháng 1–2 nhiễu vì Tết; so cùng kỳ quan trọng hơn so tháng trước. Xuất khẩu tăng nhưng đơn giá giảm (nhập khẩu may mặc của Mỹ: Việt Nam +1,1% giá trị, +3,3% lượng 6T/2026) nghĩa là doanh nghiệp đang giữ đơn bằng giá.');
}
// Theo thị trường
const us=S('exp_textile_us'),jp=S('exp_textile_jp'),kr=S('exp_textile_kr'),cn=S('exp_textile_cn');
if(us.length&&exp.length&&document.getElementById('chExportMkt')){
 const em=byMonth(exp),jm=byMonth(jp),km=byMonth(kr),cm=byMonth(cn),rs=us.slice(-24);
 const v=(m,r)=>m[ym(r.date)]?.value??null;
 const rest=rs.map(r=>{const t=em[ym(r.date)],j=v(jm,r),k=v(km,r),c=v(cm,r);return t&&j!=null&&k!=null&&c!=null?t.value-r.value-j-k-c:null});
 stack('chExportMkt',{categories:rs.map(r=>mon(r.date)),series:[{name:'Mỹ',color:C.navy,values:rs.map(r=>r.value)},{name:'Nhật Bản',color:C.gold,values:rs.map(r=>v(jm,r))},{name:'Hàn Quốc',color:C.teal,values:rs.map(r=>v(km,r))},{name:'Trung Quốc',color:C.red,values:rs.map(r=>v(cm,r))},{name:'Khác (EU, Canada, Anh…)',color:C.grey,values:rest}],unit:'triệu USD',digits:0,aria:'Xuất khẩu dệt may theo thị trường'});
 legend('chExportMkt',[['Mỹ',C.navy],['Nhật Bản',C.gold],['Hàn Quốc',C.teal],['Trung Quốc',C.red],['Khác (EU, Canada, Anh…)',C.grey]]);
 fillTable('tbl-export-mkt',['Tháng','Mỹ','Nhật Bản','Hàn Quốc','Trung Quốc','Khác','Tỷ trọng Mỹ'],us.slice().reverse().map(r=>{const t=em[ym(r.date)],j=v(jm,r),k=v(km,r),c=v(cm,r);return [mon(r.date),nf(r.value,0),nf(j,0),nf(k,0),nf(c,0),t&&j!=null&&k!=null&&c!=null?nf(t.value-r.value-j-k-c,0):'—',t?nf(r.value/t.value*100,1)+'%':'—']}));
 sourceLine('chExportMkt',[SRC.customs,SRC.wi],mon(us.at(-1).date),'Hàng dệt, may sang Hoa Kỳ (87978), Nhật Bản (88750), Hàn Quốc (88065), Trung Quốc (88023); "khác" = tổng (83528) trừ bốn nước. Wi chỉ có số theo tháng cho các nước này; EU, Canada, Anh có số theo năm ở tab XK & thuế quan.');
 insight('chExportMkt','Mỹ chiếm khoảng một nửa kim ngạch nên thuế Mỹ quyết định nhịp ngành. Tỷ trọng Mỹ tăng trước các mốc thuế (giao hàng sớm) rồi giảm sau; theo dõi tỷ trọng Mỹ sau 24/07/2026 khi thuế Mục 301 12,5% có hiệu lực.');
}
// Sản lượng quần áo & IIP
const gar=S('garments'),iipA=S('iip_apparel');
if(gar.length&&document.getElementById('chGarment')){
 const rs=gar.slice(-36),im=byMonth(iipA);
 barLineChart('chGarment',{categories:rs.map(r=>mon(r.date)),series:[{name:'Quần áo mặc thường (triệu cái)',color:C.teal,values:rs.map(r=>r.value)},{name:'IIP trang phục YoY (%) ×10',color:C.plum,kind:'line',values:rs.map(r=>im[ym(r.date)]?im[ym(r.date)].value*10:null)}],unit:'',digits:0,height:260,rotateLabels:true});
 legend('chGarment',[['Quần áo (triệu cái)',C.teal],['IIP trang phục YoY ×10',C.plum]]);
 fillTable('tbl-garment',['Tháng','Quần áo (triệu cái)','IIP trang phục YoY (%)'],gar.slice().reverse().map(r=>[mon(r.date),nf(r.value,1),nf(im[ym(r.date)]?.value,2)]));
 sourceLine('chGarment',[SRC.nso,SRC.wi],mon(gar.at(-1).date),'Sản lượng quần áo mặc thường (82090) và IIP sản xuất trang phục so cùng kỳ (202904). IIP nhân 10 để cùng trục.');
 insight('chGarment','Sản lượng đo việc làm của nhà máy, xuất khẩu đo doanh thu: sản lượng tăng nhanh hơn kim ngạch nghĩa là đơn giá gia công đang giảm hoặc chuyển sang hàng đơn giản.');
}
// Nhập khẩu nguyên liệu
const imp=[['imp_fabric','Vải',C.navy],['imp_materials','Nguyên phụ liệu dệt, may, da, giày',C.gold],['imp_cotton','Bông',C.teal],['imp_yarn','Xơ, sợi',C.plum]];
if(S('imp_fabric').length&&document.getElementById('chImport')){
 const base=S('imp_fabric').slice(-24),maps=imp.map(([k])=>byMonth(S(k)));
 stack('chImport',{categories:base.map(r=>mon(r.date)),series:imp.map(([k,n,c],i)=>({name:n,color:c,values:base.map(r=>maps[i][ym(r.date)]?.value??null)})),unit:'triệu USD',digits:0,aria:'Nhập khẩu nguyên liệu dệt may'});
 legend('chImport',imp.map(([,n,c])=>[n,c]));
 fillTable('tbl-import',['Tháng',...imp.map(x=>x[1])],S('imp_fabric').slice().reverse().map(r=>[mon(r.date),...maps.map(m=>nf(m[ym(r.date)]?.value,0))]));
 sourceLine('chImport',[SRC.customs,SRC.wi],mon(S('imp_fabric').at(-1).date),'Nhập khẩu vải (92752), nguyên phụ liệu dệt may da giày (92769, gồm cả da giày), bông (92778), xơ sợi (92787).');
 insight('chImport','Nhập vải và phụ liệu là chỉ báo đơn hàng sớm 1–2 tháng của khâu may: nhà may nhập vải trước khi cắt may. Nhập bông là chỉ báo sản lượng của nhà sợi bông như ADS.');
}
// Sợi
const yx=S('exp_yarn');
if(yx.length&&document.getElementById('chYarnExp')){
 const rs=yx.slice(-36);
 barLineChart('chYarnExp',{categories:rs.map(r=>mon(r.date)),series:[{name:'XK xơ, sợi dệt',color:C.plum,values:rs.map(r=>r.value)}],unit:'triệu USD',digits:0,height:260,rotateLabels:true});
 fillTable('tbl-yarn-exp',['Tháng','Triệu USD','So cùng kỳ','Sang Mỹ (triệu USD)'],yx.slice().reverse().map(r=>[mon(r.date),nf(r.value,0),signed(yoyAt(yx,r),1)+'%',nf(byMonth(S('exp_yarn_us'))[ym(r.date)]?.value,1)]));
 sourceLine('chYarnExp',[SRC.customs,SRC.wi],mon(yx.at(-1).date),'Xuất khẩu xơ, sợi dệt các loại (83527); cột sang Mỹ (87977). Thị trường chính của sợi Việt Nam là Trung Quốc, Hàn Quốc, Thổ Nhĩ Kỳ; Wi chưa có chuỗi theo các nước này trong contract.');
 insight('chYarnExp','Kim ngạch sợi đi theo giá xơ và cầu dệt của Trung Quốc nhiều hơn theo đơn may Mỹ. Với STK, phần xuất khẩu chịu rủi ro điều tra chống bán phá giá sợi polyester ở Mỹ, Thổ Nhĩ Kỳ, Ấn Độ.');
}
const fn=S('fabric_natural'),fs=S('fabric_synthetic'),iipT=S('iip_textile');
if(fn.length&&document.getElementById('chFabric')){
 const rs=fn.slice(-24),sm=byMonth(fs),im=byMonth(iipT);
 stack('chFabric',{categories:rs.map(r=>mon(r.date)),series:[{name:'Vải từ sợi tự nhiên',color:C.teal,values:rs.map(r=>r.value)},{name:'Vải từ sợi tổng hợp, nhân tạo',color:C.navy,values:rs.map(r=>sm[ym(r.date)]?.value??null)}],unit:'triệu m²',digits:1,aria:'Sản lượng vải'});
 legend('chFabric',[['Sợi tự nhiên',C.teal],['Sợi tổng hợp, nhân tạo',C.navy]]);
 fillTable('tbl-fabric',['Tháng','Vải tự nhiên','Vải tổng hợp','IIP dệt YoY (%)'],fn.slice().reverse().map(r=>[mon(r.date),nf(r.value,1),nf(sm[ym(r.date)]?.value,1),nf(im[ym(r.date)]?.value,2)]));
 sourceLine('chFabric',[SRC.nso,SRC.wi],mon(fn.at(-1).date),'Sản lượng vải (82088, 82089) và IIP ngành dệt so cùng kỳ (202903). Hai loại vải khác nguyên liệu, cộng lại chỉ để xem tổng khối lượng.');
 insight('chFabric','Vải tổng hợp là đầu ra của sợi polyester (STK); vải tự nhiên dùng sợi bông (ADS). Sản lượng vải trong nước tăng là điều kiện để nhà may giảm phụ thuộc vải Trung Quốc và đáp ứng quy tắc xuất xứ.');
}
// Giá
const cot=P('cotton_ice');
if(cot.length&&document.getElementById('chCotton')){
 const rs=cot;
 barLineChart('chCotton',{categories:rs.map(r=>mon(r.date)),series:[{name:'Bông ICE No.2',color:C.teal,kind:'line',values:rs.map(r=>r.value)}],unit:'US cent/lb',digits:2,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-cotton',['Kỳ','US cent/lb','So cùng kỳ'],rs.slice().reverse().map(r=>[short(r.date),nf(r.value,2),signed(yoyAt(rs,r),1)+'%']));
 sourceLine('chCotton',[SRC.ice,SRC.wi],short(cot.at(-1).date),'Chỉ tiêu 74393 (Cotton No.2, Wi ghi tên "Vải cotton"); chuỗi ngày được Wi nén về giá cuối tháng.');
 insight('chCotton','Bông là chi phí lớn nhất của sợi cotton, nên giá bông là biến số trực tiếp của ADS và các nhà sợi bông. Với nhà may, bông chỉ ảnh hưởng gián tiếp qua giá vải và thường được chuyển sang nhãn hàng ở đơn FOB.');
}
const yc=P('yarn_cn'),cc=P('cotton_cn');
if(yc.length&&cc.length&&document.getElementById('chYarnSpread')){
 const cm=byMonth(cc),rs=yc.filter(r=>cm[ym(r.date)]).slice(-24);
 barLineChart('chYarnSpread',{categories:rs.map(r=>mon(r.date)),series:[{name:'Sợi cotton',color:C.navy,kind:'line',values:rs.map(r=>r.value)},{name:'Bông xơ',color:C.teal,kind:'line',values:rs.map(r=>cm[ym(r.date)].value)},{name:'Chênh lệch sợi – bông',color:C.gold,values:rs.map(r=>r.value-cm[ym(r.date)].value)}],unit:'CNY/tấn',digits:0,height:260,rotateLabels:true});
 legend('chYarnSpread',[['Sợi cotton',C.navy],['Bông xơ',C.teal],['Chênh lệch',C.gold]]);
 fillTable('tbl-yarn-spread',['Kỳ','Sợi (CNY/t)','Bông (CNY/t)','Chênh lệch'],rs.slice().reverse().map(r=>[mon(r.date),nf(r.value,0),nf(cm[ym(r.date)].value,0),nf(r.value-cm[ym(r.date)].value,0)]));
 sourceLine('chYarnSpread',[['Sàn Trung Quốc qua Wi',null]],short(yc.at(-1).date),'Sợi cotton Trung Quốc (73979) trừ bông xơ (203165), cùng đơn vị CNY/tấn và cùng sàn. Chênh lệch là biên gia công kéo sợi trước chi phí điện, lao động; không phải biên của doanh nghiệp Việt Nam.');
 insight('chYarnSpread','Chênh lệch sợi – bông là thước đo biên kéo sợi của cả vùng: thu hẹp nghĩa là nhà sợi không chuyển được giá bông sang khách. Nhà sợi Việt Nam bán theo giá sợi Trung Quốc nên đi cùng chiều.');
}
const psf=P('psf'),pta=P('pta'),meg=P('meg');
if(psf.length&&document.getElementById('chPoly')){
 const tm=byMonth(pta),mm=byMonth(meg),rs=psf.slice(-24);
 barLineChart('chPoly',{categories:rs.map(r=>mon(r.date)),series:[{name:'Xơ PSF',color:C.navy,kind:'line',values:rs.map(r=>r.value)},{name:'PTA',color:C.gold,kind:'line',values:rs.map(r=>tm[ym(r.date)]?.value??null)},{name:'MEG',color:C.plum,kind:'line',values:rs.map(r=>mm[ym(r.date)]?.value??null)}],unit:'CNY/tấn',digits:0,height:260,zeroBase:false,rotateLabels:true});
 legend('chPoly',[['Xơ PSF',C.navy],['PTA',C.gold],['MEG',C.plum]]);
 fillTable('tbl-poly',['Kỳ','PSF','PTA','MEG','PSF − (0,86·PTA + 0,34·MEG)'],rs.slice().reverse().map(r=>{const a=tm[ym(r.date)]?.value,b=mm[ym(r.date)]?.value;return [mon(r.date),nf(r.value,0),nf(a,0),nf(b,0),a&&b?nf(r.value-0.86*a-0.34*b,0):'—']}));
 sourceLine('chPoly',[['Sàn Trung Quốc qua Wi',null]],short(psf.at(-1).date),'Xơ polyester dạng sợi (203213), PTA (203220), MEG (203187). Cột chênh lệch dùng định mức 0,86 tấn PTA + 0,34 tấn MEG cho 1 tấn polyester (định mức ngành phổ biến, không phải số của STK).');
 insight('chPoly','Sợi filament polyester của STK đi theo giá PTA/MEG (tức giá dầu) và chênh lệch so với giá sợi Trung Quốc bán phá giá. PTA, MEG tăng mạnh từ tháng 8/2026 làm giá đầu vào tăng; STK chỉ giữ được biên nếu giá sợi tăng theo.');
}
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['204','May mặc công nghiệp',C.navy],['207','Sợi và vải thành phẩm',C.teal]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/E '+name,color,kind:'line',values:weekly.map(d=>at(id,d,1))})),unit:'x',digits:2,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Phân ngành (GICS Wi)','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],2),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[SRC.wi],short(dates.at(-1)),'Wi sector_ratio_daily, phân ngành 204 và 207; vẽ mỗi 5 phiên. Phân ngành 252 (sợi tổng hợp, có STK) chưa có số trên Wi. Định giá tổng hợp bị chi phối bởi mã lớn.');
 insight('chSectorVal','P/E ngành may quanh 6,5–7 lần, thấp hơn vùng 9–11 lần của giữa 2025: thị trường đang chiết khấu rủi ro thuế Mỹ và đơn hàng nửa cuối năm. Định giá chỉ mở rộng khi có bằng chứng đơn hàng 2027.');
}
// US retail
const ur=S('us_apparel_retail'),uy=S('us_apparel_retail_yoy');
if(ur.length&&document.getElementById('chUsRetail')){
 const rs=ur.slice(-36),ymap=byMonth(uy);
 barLineChart('chUsRetail',{categories:rs.map(r=>mon(r.date)),series:[{name:'Bán lẻ quần áo (tỷ USD)',color:C.navy,values:rs.map(r=>r.value)},{name:'So cùng kỳ (%)',color:C.plum,kind:'line',values:rs.map(r=>ymap[ym(r.date)]?.value??null)}],unit:'',digits:1,height:260,rotateLabels:true});
 legend('chUsRetail',[['Bán lẻ quần áo, phụ kiện (tỷ USD)',C.navy],['So cùng kỳ (%)',C.plum]]);
 fillTable('tbl-us-retail',['Tháng','Tỷ USD','So cùng kỳ (%)'],ur.slice().reverse().map(r=>[mon(r.date),nf(r.value,2),nf(ymap[ym(r.date)]?.value,2)]));
 sourceLine('chUsRetail',[SRC.census,SRC.wi],mon(ur.at(-1).date),'Doanh thu bán lẻ nhóm quần áo và phụ kiện của Mỹ (chỉ tiêu 652, so cùng kỳ 348). Giá trị danh nghĩa, gồm cả lạm phát giá quần áo.');
 insight('chUsRetail','Bán lẻ quần áo Mỹ là cầu cuối cùng của khoảng một nửa kim ngạch dệt may Việt Nam. Tăng trưởng dương và ổn định giúp nhãn hàng giải phóng tồn kho rồi đặt đơn mới sau 1–2 quý.');
}
// ---------- Document figures (data/textile/*.json, mirrored in the HTML tables) ----------
// US apparel import shares 2025 (OTEXA via Apparel Resources)
if(document.getElementById('chUsShare')){
 const yrs=['2019','2020','2021','2024','2025','5T/2026'];
 const rows=[['Việt Nam',C.navy,[null,16.37,14.84,18.88,21.5,22.2]],['Trung Quốc',C.red,[39.83,36.6,37.76,20.83,13.66,9.7]],['Bangladesh',C.teal,[null,8.17,8.84,9.26,10.53,11.3]],['Campuchia',C.gold,[null,4.87,4.22,4.75,6.2,6.5]],['Ấn Độ',C.plum,[null,3.91,4.35,5.89,6.35,null]],['Indonesia',C.grey,[null,3.99,3.76,5.33,5.98,null]]];
 barLineChart('chUsShare',{categories:yrs,series:rows.map(([n,c,v])=>({name:n,color:c,kind:'line',values:v})),unit:'%',digits:1,height:260,zeroBase:false,rotateLabels:false});
 legend('chUsShare',rows.map(([n,c])=>[n,c]));
 fillTable('tbl-us-share',['Nước',...yrs],rows.map(([n,,v])=>[n,...v.map(x=>x==null?'—':nf(x,2)+'%')]).concat([['Tổng NK may mặc Mỹ (tỷ USD)','—','—','—','79,26','77,88','35,09 (6T)']]));
 fillTable('tbl-us-h1',['Nước','Giá trị YoY','Lượng (m² quy đổi) YoY','Đơn giá YoY'],[['Campuchia','+12,32%','—','—'],['Indonesia','+3,40%','—','—'],['Việt Nam','+1,08%','+3,30%','−2,15%'],['Bangladesh','−5,75%','−3,69%','−2,15%'],['Ấn Độ','−25,27%','−22,74%','−3,28%'],['Trung Quốc','−37,69%','−26,30%','−15,46%'],['Tổng','−8,04%','—','—']]);
 sourceLine('chUsShare',[['OTEXA','https://www.trade.gov/otexa-import-data'],['Just-Style 2019–21','https://www.just-style.com/features/analysis-china-market-share-of-us-apparel-imports-rises-after-four-year-lull/'],['Apparel Resources 2025','https://apparelresources.com/business-news/trade-business-news/bangladesh-raises-us-apparel-market-share-10-53-chinas-exports-decline/']],'5T/2026','2019–2021 theo Just-Style (có thể tính theo lượng); 2024 là 10 tháng đầu năm (Bangladesh: cả năm); 2025 cả năm theo giá trị; 5T/2026 theo OTEXA. Thiếu 2022–2023. Các năm khác cơ sở tính nên chỉ đọc xu hướng.');
 insight('chUsShare','Trung Quốc mất khoảng 30 điểm % thị phần từ 2019, phần lớn sang Việt Nam (từ ~15% lên 22%) và một phần sang Bangladesh, Campuchia. Từ 24/07/2026 Việt Nam chịu thuế cao hơn các nước này 2,5 điểm %, nên tốc độ lấy thị phần là biến số cần theo dõi theo tháng.');
}
const isr=[['2019',2.30],['2020',2.25],['2021',2.09],['2022',2.37],['2023',2.27],['2024',2.22],['2025',2.15],['T1/26',2.16],['T2/26',2.10],['T3/26',2.11],['T4/26',2.13],['T5/26',2.11],['T6/26',2.14],['T7/26',2.11]];
if(document.getElementById('chUsIS')){
 barLineChart('chUsIS',{categories:isr.map(r=>r[0]),series:[{name:'Tồn kho / doanh số',color:C.plum,kind:'line',values:isr.map(r=>r[1])}],unit:'lần',digits:2,height:260,zeroBase:false,rotateLabels:false});
 fillTable('tbl-us-is',['Kỳ','Lần'],isr.slice().reverse().map(r=>[r[0],nf(r[1],2)]));
 sourceLine('chUsIS',[['FRED MRTSIR448USS','https://fred.stlouisfed.org/series/MRTSIR448USS'],SRC.census],'T7/2026','Tỷ lệ tồn kho / doanh số của cửa hàng quần áo và phụ kiện Mỹ, điều chỉnh mùa vụ; các năm lấy tháng 12.');
 insight('chUsIS','Tỷ lệ 2,1 lần là thấp nhất trong chuỗi từ 2019 trừ 2021: kênh bán lẻ Mỹ không thừa hàng, nên nhãn hàng có lý do đặt bổ sung khi doanh số giữ được. Đây là điều kiện cần cho đơn hàng quý tới, chưa đủ nếu thuế làm giảm biên nhãn hàng.');
}
const th=[['Việt Nam',C.navy,[20,10,12.5]],['Trung Quốc',C.red,[20,10,12.5]],['Bangladesh',C.teal,[20,10,10]],['Campuchia',C.gold,[19,10,10]],['Indonesia',C.grey,[19,10,10]],['Ấn Độ',C.plum,[50,10,10]]];
if(document.getElementById('chTariffHist')){
 const per=['IEEPA 8/2025–2/2026','Mục 122 · 24/2–24/7/2026','Mục 301 · từ 24/7/2026'];
 ctBar('chTariffHist',{categories:per,series:th.map(([n,c,v])=>({name:n,color:c,values:v})),unit:'%',digits:1,aria:'Thuế bổ sung của Mỹ theo giai đoạn'});
 legend('chTariffHist',th.map(([n,c])=>[n,c]));
 fillTable('tbl-tariff-hist',['Nước',...per],th.map(([n,,v])=>[n,...v.map(x=>nf(x,1)+'%')]));
 sourceLine('chTariffHist',[['Kelley Drye · Mục 301','https://www.kelleydrye.com/viewpoints/blogs/trade-and-manufacturing-monitor/ustr-announces-final-tariff-rates-exclusions-and-tariff-rate-quotas'],['GHY · Mục 122','https://www.ghy.com/trade-compliance/us-10-percent-section-122-tariff/']],'24/07/2026','Thuế cộng thêm vào MFN. IEEPA: Trung Quốc 20% sau 10/11/2025 (30% trước đó); Ấn Độ gồm 25% phạt dầu Nga. Việt Nam công bố 46% (4/2025) trước khi thỏa thuận xuống 20%.');
 insight('chTariffHist','Qua ba giai đoạn, lợi thế thuế của Việt Nam đổi chiều: thời IEEPA ngang Bangladesh và thấp hơn Ấn Độ rất nhiều; nay cao hơn Bangladesh, Campuchia, Indonesia, Ấn Độ 2,5 điểm % và ngang Trung Quốc. Mức chênh nhỏ nhưng nhãn hàng tính theo đơn giá FOB vài USD, nên đủ để dời một phần đơn.');
}
const osh=[['VN · EU',C.navy,[4.0,4.2,4.6]],['VN · Nhật',C.gold,[19.0,19.6,null]],['VN · Hàn',C.teal,[26.0,26.5,null]],['TQ · EU',C.red,[29.6,29.0,28.3]],['TQ · Nhật',C.plum,[49.4,48.2,null]],['TQ · Hàn',C.grey,[41.0,40.1,null]]];
if(document.getElementById('chOtherShare')){
 const yrs=['2024','2025','5T/2026'];
 barLineChart('chOtherShare',{categories:yrs,series:osh.map(([n,c,v])=>({name:n,color:c,kind:'line',values:v})),unit:'%',digits:1,height:260,zeroBase:true,rotateLabels:false});
 legend('chOtherShare',osh.map(([n,c])=>[n,c]));
 fillTable('tbl-other-share',['Thị trường · nước','2023','2024','2025','5T/2026'],[['EU · Việt Nam','—','4,0%','4,2%','4,6%'],['EU · Trung Quốc','—','29,6%','29,0%','28,3%'],['EU · Bangladesh','—','22,2%','21,9%','21,5%'],['Nhật · Việt Nam','18,4%','19,0%','19,6%','—'],['Nhật · Trung Quốc','50,6%','49,4%','48,2%','—'],['Hàn · Việt Nam','25,2%','26,0%','26,5%','—'],['Hàn · Trung Quốc','42,4%','41,0%','40,1%','—']]);
 sourceLine('chOtherShare',[['TBS News · Eurostat','https://www.tbsnews.net/economy/rmg/bangladesh-loses-eu-apparel-market-share-faster-rivals-1490571'],['Trading Economics · Nhật','https://tradingeconomics.com/japan/imports/vietnam/articles-apparel-accessories-knit-crocheted'],['Trading Economics · Hàn','https://tradingeconomics.com/south-korea/imports/vietnam/articles-apparel-accessories-knit-crocheted']],'5T/2026','Theo dashboard dệt may nội bộ 28/07/2026. Nhật, Hàn: HS 61+62, năm đầy đủ; EU: nhập khẩu may mặc ngoài khối, 2026 là 5 tháng.');
 insight('chOtherShare','Việt Nam đã là nguồn cung số 2 ở Nhật và Hàn (20–27%) nhưng mới chiếm khoảng 4–5% ở EU, nơi Trung Quốc và Bangladesh chiếm một nửa. EU là dư địa lớn nhất nếu EVFTA về 0% thuế toàn bộ năm 2027 và Bangladesh mất ưu đãi sau khi rời nhóm LDC.');
}
if(document.getElementById('tbl-vitas-mkt'))fillTable('tbl-vitas-mkt',['Thị trường','2025 (tỷ USD)','So cùng kỳ','Mục tiêu 2026'],[['Mỹ','17,8','+10,7%','19,7'],['Nhật Bản','4,5','+6,1%','5,1'],['Hàn Quốc','2,8','−8,3%','—'],['Trung Quốc','1,4','+6,1%','—'],['EU','—','—','5,1'],['Tổng XK dệt may','39,4','+7%','48']]);
const yk=[['y_us','Mỹ',C.navy],['y_jp','Nhật Bản',C.gold],['y_kr','Hàn Quốc',C.teal],['y_cn','Trung Quốc',C.red],['y_ca','Canada',C.plum],['y_nl','Hà Lan',C.green],['y_de','Đức','#8a6fd1'],['y_uk','Anh',C.grey]];
if(S('y_us').length&&document.getElementById('chMktYear')){
 const maps=yk.map(([k])=>byMonth(S(k))),ys=S('y_us').map(r=>r.date.slice(0,4));
 const at=(i,y)=>maps[i][y+'-12']?.value??null;
 stack('chMktYear',{categories:ys,series:yk.map(([k,n,c],i)=>({name:n,color:c,values:ys.map(y=>at(i,y))})),unit:'triệu USD',digits:0,aria:'Xuất khẩu dệt may theo thị trường theo năm'});
 legend('chMktYear',yk.map(([,n,c])=>[n,c]));
 fillTable('tbl-mkt-year',['Năm',...yk.map(x=>x[1]),'Tăng Mỹ YoY'],ys.slice().reverse().map(y=>[y,...yk.map((_,i)=>nf(at(i,y),0)),at(0,String(y-1))?signed((at(0,y)/at(0,String(y-1))-1)*100,1)+'%':'—']));
 sourceLine('chMktYear',[SRC.customs,SRC.wi],S('y_us').at(-1).date.slice(0,4),'Hàng dệt, may theo nước đến, số năm của hải quan (bảng 87 Wi: 279542 Mỹ, 279802 Nhật, 279716 Hàn, 279632 Trung Quốc, 279996 Canada, 278542 Hà Lan, 278606 Đức, 280130 Anh). Năm 2026 chưa đủ năm nên chưa có.');
 insight('chMktYear','Từ 2013 Mỹ tăng gấp đôi và luôn chiếm khoảng một nửa; Hà Lan (cửa ngõ EU, gần gấp đôi), Anh và Canada tăng nhanh nhất sau 2021 nhờ EVFTA, UKVFTA, CPTPP, trong khi Hàn Quốc đi ngang. Đa dạng hóa có thật nhưng quy mô các thị trường mới vẫn nhỏ so với Mỹ.');
}
if(us.length&&document.getElementById('chUsYtd')){
 const years={};us.forEach(r=>{const y=r.date.slice(0,4);years[y]=(years[y]||{sum:0,last:r});years[y].sum+=r.value;years[y].last=r});
 const ys=Object.keys(years).sort(),lastM=us.at(-1).date.slice(5,7);
 const same=y=>us.filter(r=>r.date.slice(0,4)===y&&r.date.slice(5,7)<=lastM).reduce((a,r)=>a+r.value,0);
 barLineChart('chUsYtd',{categories:ys.map(y=>y+(years[y].last.date.slice(5,7)!=='12'?' (đến T'+Number(years[y].last.date.slice(5,7))+')':'')),series:[{name:'Cả năm / lũy kế',color:C.navy,values:ys.map(y=>years[y].sum)},{name:'Cùng kỳ đến T'+Number(lastM),color:C.teal,values:ys.map(y=>same(y))}],unit:'triệu USD',digits:0,height:260,rotateLabels:false});
 legend('chUsYtd',[['Cả năm (năm hiện tại: lũy kế)',C.navy],['Cùng số tháng',C.teal]]);
 fillTable('tbl-us-ytd',['Năm','Cả năm / lũy kế','Cùng kỳ đến T'+Number(lastM),'So cùng kỳ'],ys.slice().reverse().map(y=>{const p=String(Number(y)-1);return [y,nf(years[y].sum,0),nf(same(y),0),years[p]?signed((same(y)/same(p)-1)*100,1)+'%':'—']}));
 sourceLine('chUsYtd',[SRC.customs,SRC.wi],mon(us.at(-1).date),'Cộng các tháng của chỉ tiêu 87978 (hàng dệt, may sang Hoa Kỳ). Cột cùng kỳ cộng đúng số tháng như năm hiện tại.');
 insight('chUsYtd','So lũy kế cùng số tháng mới đọc được năm 2026 đang nhanh hay chậm hơn năm trước; số cả năm 2025 của hải quan có thể khác số VITAS 17,8 tỷ USD vì khác phạm vi nhóm hàng.');
}
if(document.getElementById('chBrands')){
 const rows=[['Nike',-3,-4],['Adidas',13,13],['H&M',3.7,0.3],['Inditex',9.3,7.6],['Gap',0,-2]];
 barLineChart('chBrands',{categories:rows.map(r=>r[0]),series:[{name:'Tồn kho YoY',color:C.plum,values:rows.map(r=>r[1])},{name:'Doanh thu YoY',color:C.teal,values:rows.map(r=>r[2])}],unit:'%',digits:1,height:260,rotateLabels:false});
 legend('chBrands',[['Tồn kho YoY',C.plum],['Doanh thu YoY',C.teal]]);
 fillTable('tbl-brands-chart',['Hãng','Kỳ','Tồn kho YoY','Doanh thu YoY'],[['Nike','Q1 FY27 (8/2026)','−3%','−4%'],['Adidas','Q2/2026','+13%','+13%'],['H&M','Q3 FY26 (8/2026)','+3,7%','+0,3%'],['Inditex','6T/2026 (7/2026)','+9,3%','+7,6%'],['Gap','Q2 FY26 (8/2026)','0%','−2%']]);
 insight('chBrands','Tồn kho tăng nhanh hơn doanh thu (Inditex, H&M) báo hiệu nhãn hàng sẽ chậm đặt đơn mới 1–2 quý; tồn kho giảm cùng doanh thu (Nike) là đang dọn kho, chưa phải tín hiệu tăng đơn. Adidas tăng tồn kho chủ động cho World Cup 2026.');
}

// ---------- 4. KPIs & quick read ----------
const eL=exp.at(-1),uL=us.at(-1),cL=cot.at(-1),pL=psf.at(-1),rL=ur.at(-1),may=sec['204']?.records||[],mL=may.at(-1);
kpi('spk-exp',eL?nf(eL.value/1000,2):'—',eL?'tỷ USD hàng dệt, may · '+mon(eL.date):'—',eL?signed(yoyAt(exp,eL),1)+'% so cùng kỳ':'',exp.slice(-12).map(r=>r.value));
kpi('spk-us',uL?nf(uL.value/1000,2):'—',uL?'tỷ USD sang Mỹ · '+mon(uL.date):'—',uL&&eL?signed(yoyAt(us,uL),1)+'% YoY · '+nf(uL.value/(byMonth(exp)[ym(uL.date)]?.value||NaN)*100,0)+'% tổng':'',us.slice(-12).map(r=>r.value),C.plum);
kpi('spk-cotton',cL?nf(cL.value,2):'—',cL?'US cent/lb · '+short(cL.date):'—',cL?signed(yoyAt(cot,cL),1)+'% so cùng kỳ':'',cot.slice(-12).map(r=>r.value),C.teal);
kpi('spk-psf',pL?nf(pL.value,0):'—',pL?'CNY/tấn · '+short(pL.date):'—',pL?signed(yoyAt(psf,pL),1)+'% so cùng kỳ':'',psf.slice(-12).map(r=>r.value),C.gold);
kpi('spk-usretail',rL?nf(rL.value,1):'—',rL?'tỷ USD/tháng · '+mon(rL.date):'—',rL?signed(byMonth(uy)[ym(rL.date)]?.value,1)+'% so cùng kỳ':'',ur.slice(-12).map(r=>r.value),C.navy);
kpi('spk-pe',mL?nf(mL[1],1)+'x':'—',mL?'P/E may mặc công nghiệp · '+short(mL[0]):'—',mL?'P/B '+nf(mL[2],2)+'x · vốn hóa '+nf(mL[3]/1000,1)+' nghìn tỷ':'',may.slice(-30).map(r=>r[1]),C.grey);
const ytd=y=>exp.filter(r=>r.date.slice(0,4)===y&&eL&&r.date.slice(5,7)<=eL.date.slice(5,7)).reduce((a,r)=>a+r.value,0);
const quick=document.querySelector('.hero .insight');
if(quick&&eL){
 const y=eL.date.slice(0,4),now=ytd(y),prev=ytd(String(Number(y)-1));
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu Wi: '),`Xuất khẩu hàng dệt, may ${y} đến T${Number(eL.date.slice(5,7))}: ${nf(now/1000,1)} tỷ USD (${signed((now/prev-1)*100,1)}% so cùng kỳ); riêng T${Number(eL.date.slice(5,7))} ${nf(eL.value/1000,2)} tỷ USD (${signed(yoyAt(exp,eL),1)}%). `+(uL?`Sang Mỹ T${Number(uL.date.slice(5,7))}: ${nf(uL.value/1000,2)} tỷ USD (${signed(yoyAt(us,uL),1)}%). `:'')+(cL?`Bông ICE ${nf(cL.value,1)} cent/lb (${signed(yoyAt(cot,cL),0)}% YoY). `:'')+(mL?`P/E ngành may ${nf(mL[1],1)}x.`:''));
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
window.TEXTILE_DASHBOARD={ytd:eL?{now:ytd(eL.date.slice(0,4)),prev:ytd(String(Number(eL.date.slice(0,4))-1)),month:eL.date}:null};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ WiMCP lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; các lời gọi ghi trong data/textile-wi-contract.json.';
})();
