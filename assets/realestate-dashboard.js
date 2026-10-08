/* Real-estate dashboard: value chain, Nhà ở / Khu công nghiệp panes and every chart
   drawn from window.REALESTATE_WI (built by scripts/build_realestate_wi.py from WiMCP
   captures). Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='realestate')return;
const W=window.REALESTATE_WI||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const quarter=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(0,4);
const CS=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const cash=B.cbond_cashflow?.records||[],iss=B.cbond_issuance?.records||[],mat=B.cbond_maturity?.records||[],topIssuers=B.cbond_maturity?.top_issuers||[];
const built=W.built_at?new Date(W.built_at).toLocaleDateString('vi-VN'):'—';
const checked=B.cbond_cashflow?.captured_at||W.built_at||'';
const SRC={hnx:['HNX · Trái phiếu doanh nghiệp','https://cbonds.hnx.vn/'],nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],sbv:['Ngân hàng Nhà nước','https://www.sbv.gov.vn/'],fia:['Cục Đầu tư nước ngoài · FDI','https://fia.mpi.gov.vn/'],wi:['MCP Wi (Widata)',null]};

// ---------- 1. Value chain (Tổng quan) ----------
const chain=document.querySelector('[data-block-id="bds-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='08/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['land',25,40,['Quỹ đất · đấu giá','Bảng giá đất mới từ 01/01/2026']],['legal',25,135,['Pháp lý dự án','Chấp thuận chủ trương · tiền SDĐ']],['bank',25,230,['Vốn ngân hàng','Lãi suất · room tín dụng']],['bond',25,325,['Trái phiếu doanh nghiệp','Đáo hạn · chậm trả']],['presale',25,420,['Tiền người mua trả trước','Presales · bàn giao']],
  ['housing',315,40,['Phát triển nhà ở','VHM • NVL • KDH • NLG • DXG • PDR']],['housing2',315,135,['Nhà ở (tiếp)','DIG • CEO • AGG • TCH • NTL']],['ip',315,230,['Khu công nghiệp','KBC • IDC • BCM • SZC • SIP • VGC • LHG']],['retail',315,325,['Cho thuê bán lẻ','VRE']],['broker',315,420,['Môi giới','DXS']],
  ['buyer',655,88,['Người mua nhà','Tín dụng mua nhà · lãi suất']],['tenant',655,230,['Khách thuê FDI','Chế biến chế tạo · logistics']],['shopper',655,325,['Khách thuê bán lẻ','Sức mua · lấp đầy']],['build',925,135,['Nhà thầu · VLXD','Thép • xi măng • giá nhân công']]
 ];
 const edges=[['land','housing'],['legal','housing'],['legal','housing2'],['bank','housing2'],['bond','housing2'],['presale','housing2'],['land','ip'],['bank','ip'],['housing','buyer'],['housing2','buyer'],['ip','tenant'],['retail','shopper'],['broker','buyer',true],['build','housing',true]];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b],forward=Bn[1]>A[1],x1=A[1]+(forward?w:0),x2=Bn[1]+(forward?0:w),y1=A[2]+h/2,y2=Bn[2]+h/2,mid=(x1+x2)/2;const custom={'build:housing':'M925 167 H900 V72 H535','broker:buyer':'M535 452 H600 V120 H655'};const route=custom[a+':'+b]||`M${x1} ${y1} H${mid} V${y2} H${x2}`;return `<path d="${route}" class="chain-edge ${dashed?'support':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1170 505" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành bất động sản</title><desc id="chain-desc">Quỹ đất, pháp lý và ba nguồn vốn đi vào chủ đầu tư nhà ở và khu công nghiệp; nhà ở bán cho người mua dùng tín dụng, khu công nghiệp cho khách thuê FDI thuê, trung tâm thương mại cho khách thuê bán lẻ. Môi giới và nhà thầu hỗ trợ.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2938A8"/></marker></defs>${['ĐẤT · PHÁP LÝ · VỐN','PHÁT TRIỂN · VẬN HÀNH','KHÁCH HÀNG · HỖ TRỢ'].map((t,i)=>`<rect x="${[0,290,640][i]}" y="0" width="${[275,335,525][i]}" height="500" rx="12" fill="${['#edf5fc','#f0f7ef','#fff4e7'][i]}"/><text x="${[137,457,902][i]}" y="33" text-anchor="middle" class="chain-lane">${t}</text>`).join('')}${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: Nhà ở nhạy với ba thứ theo thứ tự — pháp lý (có được mở bán không), vốn (có xoay được trái phiếu và tín dụng không) rồi mới tới cầu (lãi suất vay mua nhà, giá sơ cấp). Khu công nghiệp nhạy với FDI chế biến chế tạo và quỹ đất đã đền bù; ít phụ thuộc trái phiếu. Cho thuê bán lẻ và môi giới là hai đầu cảm biến: một đo sức mua, một đo số căn mở bán.'));
 figure.after(make('div','source-note','Mũi tên liền: dòng đất, vốn và sản phẩm · Mũi tên đứt: dịch vụ hỗ trợ. Sơ đồ không biểu thị tỷ trọng hay quan hệ sở hữu.'));
}

// ---------- 2. Nhà ở / Khu công nghiệp panes (Bức tranh ngành) ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead');
 const children=[...section.children].filter(e=>e!==head),housing=make('div','supply-pane'),ip=make('div','supply-pane');housing.id='supply-world';ip.id='supply-vietnam';
 let industrial=false;children.forEach(e=>{if(e.matches('h3')&&/Khu công nghiệp/.test(e.textContent))industrial=true;(industrial?ip:housing).append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Phân khúc');
 const panes=[housing,ip];function select(i){panes.forEach((p,j)=>{p.hidden=i!==j;const b=tabs.children[j];b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1})}
 ['Nhà ở','Khu công nghiệp'].forEach((label,i)=>{const b=make('button','tabbtn',label);b.type='button';b.id='supply-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',panes[i].id);panes[i].setAttribute('role','tabpanel');panes[i].setAttribute('aria-labelledby',b.id);b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowLeft')next=1-i;else if(e.key==='Home')next=0;else if(e.key==='End')next=1;if(next!==undefined){e.preventDefault();select(next);tabs.children[next].focus()}});tabs.append(b)});
 head.after(tabs,housing,ip);select(0);
}

// ---------- 3. Charts ----------
const S=key=>macro[key]?.records||[];
const yoy=(rs,lag)=>rs.map((r,i)=>{const p=rs[i-lag];return {date:r.date,value:p&&p.value?(r.value/p.value-1)*100:null}});
function sourceLine(id,parts,period,method){
 const host=document.getElementById(id);if(!host)return;const block=host.closest('.card');
 const n=make('div','source-note cadence-note');n.append('Nguồn: ');
 parts.forEach(([name,url],i)=>{if(i)n.append(' · ');if(url){const a=make('a','',name);a.href=url;a.target='_blank';a.rel='noopener';n.append(a)}else n.append(name)});
 n.append(` · Kỳ cuối: ${period} · Wi kiểm: ${checked?short(checked.slice(0,10)):'—'}`);host.after(n);
 if(method)n.after(make('div','source-note method-note',method));
 if(block){block.dataset.refreshStatus='loaded';block.dataset.sourceIds='wi'}
}
function insight(id,text){const block=document.getElementById(id)?.closest('.card');if(!block)return;const n=make('div','chart-insight');n.dataset.inputOwner='ai';n.innerHTML='<b>Cách hiểu trong bối cảnh ngành · AI:</b> ';n.append(text);block.append(n)}
function gap(id,text){const host=document.getElementById(id);if(host)host.replaceChildren(make('div','gap-empty',text))}
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;card.querySelector('.value').textContent=value;card.querySelector('.sub').textContent=sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();if(series?.length)sparkline(spark,series,color)}
const signed=(v,d=1)=>v==null?'—':(v>0?'+':'')+nf(v,d);

// Bonds (Vốn & Trái phiếu)
const closed=cash.filter(r=>!r.partial);
if(iss.length&&document.getElementById('chBondIssuance')){
 const rs=iss.slice(-36);
 barLineChart('chBondIssuance',{categories:rs.map(r=>mon(r.date)),series:[{name:'Giá trị phát hành',color:C.navy,values:rs.map(r=>r.value)}],unit:'tỷ VND',digits:0,height:260,rotateLabels:true});
 fillTable('tbl-bond-issuance',['Tháng','Giá trị (tỷ VND)','Số đợt','Lãi suất BQ (%)','1–3 năm (tỷ)','3–5 năm (tỷ)'],rs.slice().reverse().map(r=>[mon(r.date),nf(r.value,0),r.issue_count,r.wavg_coupon==null?'—':nf(r.wavg_coupon,2),nf(r.buckets['1-3 năm']||0,0),nf(r.buckets['3-5 năm']||0,0)]));
 sourceLine('chBondIssuance',[SRC.hnx,SRC.wi],mon(rs.at(-1).date),'Wi bonds_corp_issuance_monthly, lọc ngành cấp 1 = Bất động sản, VND; cộng các nhóm kỳ hạn và hình thức phát hành theo tháng. Lãi suất bình quân gia quyền theo giá trị, chỉ đợt có lãi suất. Tháng hiện tại là số tạm tính.');
 insight('chBondIssuance','Phát hành mới là kênh đảo nợ chính của chủ đầu tư nhà ở. Đọc giá trị cùng lãi suất: phát hành tăng nhưng lãi suất 11–12% nghĩa là thị trường vẫn đòi phần bù rủi ro cao. Vài đợt lớn của một tổ chức có thể làm một tháng nhảy vọt.');
}
if(closed.length&&document.getElementById('chBondOutstanding')){
 const rs=closed.slice(-48);
 barLineChart('chBondOutstanding',{categories:rs.map(r=>mon(r.date)),series:[{name:'Dư nợ cuối tháng',color:C.navy,kind:'line',values:rs.map(r=>r.outstanding_value/1000)},{name:'Gốc đã trả trong tháng (nghìn tỷ)',color:C.teal,values:rs.map(r=>r.principal_paid/1000)}],unit:'nghìn tỷ VND',digits:1,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-bond-outstanding',['Tháng','Dư nợ (tỷ VND)','Số mã lưu hành','Gốc phải trả (tỷ)','Gốc đã trả (tỷ)','Mua lại trước hạn (tỷ)'],rs.slice().reverse().map(r=>[mon(r.date),nf(r.outstanding_value,0),r.outstanding_bond_count,nf(r.principal_due,0),nf(r.principal_paid,0),nf(r.principal_buyback,0)]));
 sourceLine('chBondOutstanding',[SRC.hnx,SRC.wi],mon(rs.at(-1).date),'Wi bonds_corp_cashflow_monthly, ngành Bất động sản, VND. Dư nợ ước tính = giá trị phát hành − gốc đã trả lũy kế; loại mã hủy/thất bại. Tháng chưa khép sổ không vẽ.');
 insight('chBondOutstanding','Dư nợ đi ngang trong khi gốc đã trả thấp cho thấy phần lớn nghĩa vụ đang được gia hạn hoặc đảo bằng phát hành mới, không phải trả bằng tiền bán hàng. Đặt cạnh lịch đáo hạn và dư nợ chậm trả trước khi kết luận áp lực đã qua.');
}
if(closed.length&&document.getElementById('chBondLate')){
 const rs=closed.slice(-36);
 barLineChart('chBondLate',{categories:rs.map(r=>mon(r.date)),series:[{name:'Dư nợ chậm trả (gốc + lãi)',color:C.red,values:rs.map(r=>r.late_payment_debt/1000)}],unit:'nghìn tỷ VND',digits:1,height:260,rotateLabels:true});
 fillTable('tbl-bond-late',['Tháng','Chậm trả gốc + lãi (tỷ)','Riêng gốc (tỷ)','Số mã chậm trả','Mã mới chậm trả','Số DN chậm trả','Tỷ lệ trả đúng hạn'],rs.slice().reverse().map(r=>[mon(r.date),nf(r.late_payment_debt,0),nf(r.late_principal_debt,0),r.late_bond_count,r.new_late_bond_count,r.late_issuer_count,r.ontime_ratio==null?'—':nf(r.ontime_ratio*100,0)+'%']));
 sourceLine('chBondLate',[SRC.hnx,SRC.wi],mon(rs.at(-1).date),'Số dư cuối tháng theo công bố thanh toán gốc/lãi trên HNX, không cộng dồn qua các tháng. Số mã mới chậm trả = có nợ chậm trả tháng này và bằng 0 tháng trước.');
 insight('chBondLate','Dư nợ chậm trả giảm có thể do trả thật, do mua lại hoặc do gia hạn được chấp thuận rồi xóa khỏi danh sách chậm trả. Số doanh nghiệp chậm trả giảm chậm hơn số tiền nghĩa là vấn đề tập trung ở vài tổ chức lớn.');
}
if(mat.length&&document.getElementById('chBondMaturity')){
 const now=new Date().toISOString().slice(0,7),rs=mat.filter(r=>r.date.slice(0,7)>=now);
 barLineChart('chBondMaturity',{categories:rs.map(r=>mon(r.date)),series:[{name:'Gốc đến hạn',color:C.navy,values:rs.map(r=>r.due)},{name:'Lãi ước tính',color:C.teal,values:rs.map(r=>r.interest)}],unit:'tỷ VND',digits:0,height:260,rotateLabels:true,stackable:true});
 fillTable('tbl-bond-maturity',['Tháng','Gốc đến hạn (tỷ VND)','Lãi ước tính (tỷ)','Số mã có dòng tiền'],rs.map(r=>[mon(r.date),nf(r.due,0),nf(r.interest,0),r.bond_count]));
 const top=document.getElementById('tbl-bond-top');if(top)fillTable('tbl-bond-top',['Tổ chức phát hành','Mã','Gốc đến hạn tới cuối 2027 (tỷ VND)','Tháng đáo hạn'],topIssuers.map(t=>[t.name,t.symbol,nf(t.due,0),t.months.map(m=>'T'+Number(m.slice(5))+'/'+m.slice(2,4)).join(', ')]));
 sourceLine('chBondMaturity',[SRC.hnx,SRC.wi],mon(rs.at(-1).date),'Wi bonds_corp_maturity_schedule_monthly năm 2026 và 2027, VND, lọc ngành cấp 1 = Bất động sản (endpoint không lọc ngành phía server). Năm 2027 nguồn có 1.002 dòng toàn thị trường, tool trả 1.000; có thể thiếu tối đa 2 dòng nhỏ. Mã chưa niêm yết mang mã nội bộ của HNX.');
 insight('chBondMaturity','Tháng 12/2026 và tháng 8, 12/2027 là ba đỉnh đáo hạn. Gốc đến hạn của một tổ chức lớn có thể chiếm hơn nửa một tháng, nên đọc bảng tổ chức phát hành bên dưới trước khi nói "ngành" chịu áp lực. Lãi ước tính của mã thả nổi là giả định.');
}
// Credit & rates
if(S('credit_construction').length&&document.getElementById('chCreditRe')){
 const cc=S('credit_construction'),tot=S('credit_total'),yc=yoy(cc,12).slice(-36),yt=yoy(tot,12).slice(-36);
 barLineChart('chCreditRe',{categories:yc.map(r=>mon(r.date)),series:[{name:'Tín dụng xây dựng · YoY',color:C.navy,kind:'line',values:yc.map(r=>r.value)},{name:'Tổng tín dụng · YoY',color:C.grey,kind:'line',values:yt.filter(r=>yc.some(x=>x.date===r.date)).map(r=>r.value)}],unit:'%',digits:1,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-credit-re',['Tháng','Dư nợ xây dựng (tỷ VND)','YoY xây dựng','Tổng dư nợ (tỷ VND)','YoY tổng'],cc.slice(-24).reverse().map(r=>{const t=tot.find(x=>x.date===r.date),a=yc.find(x=>x.date===r.date),b=yt.find(x=>x.date===r.date);return [mon(r.date),nf(r.value,0),a?.value==null?'—':nf(a.value,1)+'%',t?nf(t.value,0):'—',b?.value==null?'—':nf(b.value,1)+'%']}));
 sourceLine('chCreditRe',[SRC.sbv,SRC.wi],mon(cc.at(-1).date),'Dư nợ tín dụng theo ngành kinh tế của NHNN qua Wi (chỉ tiêu 75926 xây dựng, 75931 tổng). YoY tự tính so cùng tháng năm trước. Chưa có chuỗi tín dụng kinh doanh bất động sản riêng; proxy từ thuyết minh BCTC ngân hàng nằm ở thẻ bên cạnh.');
 insight('chCreditRe','Tín dụng xây dựng tăng nhanh hơn tổng tín dụng nghĩa là dòng vốn ngân hàng đang nghiêng về đầu tư và dự án; đây là đầu vào cho nguồn cung 1–2 năm tới chứ không phải cầu mua nhà. Cầu mua nhà cần chuỗi cho vay tiêu dùng mua nhà, hiện chưa có.');
}
if(S('credit_total').length&&S('deposits_total').length&&document.getElementById('chCreditGap')){
 const ct=S('credit_total'),dp=S('deposits_total'),y1=yoy(ct,12),y2=yoy(dp,12),dates=y2.map(r=>r.date).filter(d=>y1.some(x=>x.date===d)).slice(-36);
 barLineChart('chCreditGap',{categories:dates.map(mon),series:[{name:'Tín dụng · YoY',color:C.navy,kind:'line',values:dates.map(d=>y1.find(x=>x.date===d)?.value??null)},{name:'Tiền gửi · YoY',color:C.teal,kind:'line',values:dates.map(d=>y2.find(x=>x.date===d)?.value??null)}],unit:'%',digits:1,height:260,zeroBase:false,rotateLabels:true});
 const last=dates.at(-1);fillTable('tbl-credit-gap',['Tháng','Tín dụng YoY','Tiền gửi YoY','Tín dụng / tiền gửi'],dates.slice().reverse().map(d=>{const a=ct.find(x=>x.date===d),b=dp.find(x=>x.date===d);return [mon(d),nf(y1.find(x=>x.date===d)?.value,1)+'%',nf(y2.find(x=>x.date===d)?.value,1)+'%',a&&b?nf(a.value/b.value,3):'—']}));
 sourceLine('chCreditGap',[SRC.sbv,SRC.wi],mon(last),'Tổng dư nợ (75931) và tổng tiền gửi (75920) của NHNN qua Wi; tiền gửi thường công bố trễ hơn tín dụng 1–2 tháng. NHNN đổi phương pháp thống kê tiền gửi tháng 9–10/2025, Wi dùng bảng đã điều chỉnh.');
 insight('chCreditGap','Tín dụng tăng nhanh hơn tiền gửi là lý do lãi suất huy động nhích lên dù lãi suất điều hành đứng yên. Với bất động sản, khoảng cách này đi trước lãi suất vay mua nhà vài tháng và đi trước room tín dụng cho chủ đầu tư.');
}
if(S('refi_rate').length&&document.getElementById('chRefiRate')){
 const rs=S('refi_rate'),byM={};rs.forEach(r=>{byM[r.date.slice(0,7)]=r});const ms=Object.keys(byM).sort().slice(-36).map(k=>byM[k]);
 barLineChart('chRefiRate',{categories:ms.map(r=>mon(r.date)),series:[{name:'Lãi suất tái cấp vốn',color:C.navy,kind:'line',values:ms.map(r=>r.value)}],unit:'%/năm',digits:2,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-refi',['Tháng','%/năm'],ms.slice().reverse().map(r=>[mon(r.date),nf(r.value,2)]));
 sourceLine('chRefiRate',[SRC.sbv,SRC.wi],short(rs.at(-1).date),'Lãi suất tái cấp vốn (chỉ tiêu 81497), giá trị cuối mỗi tháng. Chưa có chuỗi lãi suất cho vay mua nhà công bố đều; xem thẻ tín dụng để biết chênh tín dụng – tiền gửi.');
 insight('chRefiRate','Lãi suất điều hành đứng yên từ giữa 2023 nên biến số thật của người mua nhà là lãi suất thả nổi sau ưu đãi của từng ngân hàng, đi theo lãi suất huy động 12 tháng. Chính sách tiền tệ nới nhưng chi phí vay mua nhà có thể vẫn tăng khi tín dụng chạy nhanh hơn tiền gửi.');
}
// Supply-demand proxies (Nhà ở)
if(S('gdp_re_q').length&&document.getElementById('chGdpRe')){
 const rs=S('gdp_re_q'),y=yoy(rs,4),last=rs.slice(-12),ly=y.slice(-12);
 barLineChart('chGdpRe',{categories:last.map(r=>quarter(r.date)),series:[{name:'GDP kinh doanh BĐS (nghìn tỷ)',color:C.navy,values:last.map(r=>r.value/1000)}],unit:'nghìn tỷ VND',digits:1,height:260,rotateLabels:false});
 fillTable('tbl-gdp-re',['Quý','GDP BĐS (tỷ VND)','So cùng kỳ'],rs.slice(-16).reverse().map(r=>[quarter(r.date),nf(r.value,0),signed(y.find(x=>x.date===r.date)?.value,1)+'%']));
 sourceLine('chGdpRe',[SRC.nso,SRC.wi],quarter(rs.at(-1).date),'GDP hoạt động kinh doanh bất động sản theo quý, giá hiện hành (chỉ tiêu 80032). So cùng kỳ tự tính trên giá hiện hành nên gồm cả yếu tố giá; không phải tăng trưởng thực.');
 insight('chGdpRe','Giá trị gia tăng ngành bất động sản theo quý là thước đo hoạt động rộng nhất có lịch công bố cố định (ngày 6 tháng đầu quý). Quý IV luôn cao vì ghi nhận bàn giao cuối năm; so cùng kỳ, không so quý liền trước.');
}
if(S('fdi_re_ytd').length&&document.getElementById('chFdiRe')){
 const rs=S('fdi_re_ytd'),years={};rs.forEach(r=>{years[r.date.slice(0,4)]=r});const ys=Object.keys(years).sort().slice(-7).map(k=>years[k]);
 const latest=rs.at(-1),ytd=latest.date.slice(0,4);
 barLineChart('chFdiRe',{categories:ys.map(r=>r.date.slice(0,4)+(r.date.slice(5,7)!=='12'?' (đến T'+Number(r.date.slice(5,7))+')':'')),series:[{name:'FDI đăng ký vào kinh doanh BĐS',color:C.navy,values:ys.map(r=>r.value)}],unit:'triệu USD',digits:0,height:260,rotateLabels:false});
 const sameLast=rs.find(r=>r.date===String(Number(ytd)-1)+latest.date.slice(4));
 fillTable('tbl-fdi-re',['Kỳ','Triệu USD','So cùng kỳ'],ys.slice().reverse().map(r=>{const prev=rs.find(x=>x.date===String(Number(r.date.slice(0,4))-1)+r.date.slice(4));return [r.date.slice(0,4)+(r.date.slice(5,7)!=='12'?' (đến T'+Number(r.date.slice(5,7))+')':''),nf(r.value,0),prev?signed((r.value/prev.value-1)*100,1)+'%':'—']}));
 sourceLine('chFdiRe',[SRC.fia,SRC.nso,SRC.wi],mon(latest.date),'Vốn đăng ký (cấp mới + điều chỉnh + góp vốn mua cổ phần) vào hoạt động kinh doanh bất động sản, lũy kế từ đầu năm (chỉ tiêu 77101). Năm chưa kết thúc ghi rõ tháng cuối; so cùng kỳ dùng cùng số tháng.');
 insight('chFdiRe','FDI vào bất động sản chủ yếu chảy vào khu công nghiệp, kho vận và nhà ở cao cấp, nên là tín hiệu cho nhóm KCN và cho thuê hơn là nhà ở đại chúng. Vốn đăng ký có thể dồn vào một thương vụ lớn; cần đối chiếu vốn thực hiện.');
}
if(S('cpi_housing_yoy').length&&document.getElementById('chCpiHousing')){
 const rs=S('cpi_housing_yoy').slice(-36);
 barLineChart('chCpiHousing',{categories:rs.map(r=>mon(r.date)),series:[{name:'CPI nhà ở & VLXD · YoY',color:C.plum,kind:'line',values:rs.map(r=>r.value)}],unit:'%',digits:2,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-cpi-housing',['Tháng','YoY (%)','Chỉ số (2024 = 100)'],rs.slice().reverse().map(r=>[mon(r.date),nf(r.value,2),nf(S('cpi_housing_index').find(x=>x.date===r.date)?.value,2)]));
 sourceLine('chCpiHousing',[SRC.nso,SRC.wi],mon(rs.at(-1).date),'Nhóm "Nhà ở và vật liệu xây dựng" trong CPI (chỉ tiêu 75708), gồm tiền thuê nhà, điện, nước, chất đốt và vật liệu sửa chữa. Không phải chỉ số giá nhà bán.');
 insight('chCpiHousing','Đây là thước đo chi phí ở, không phải giá mua nhà; tiền thuê nhà tăng kéo chỉ số lên là tín hiệu gián tiếp cho cầu thuê và cho lợi suất cho thuê. Giá căn hộ sơ cấp Hà Nội, TP.HCM nằm ở tab Giá – Chi phí – Margin theo báo cáo quý.');
}
// KCN
if(S('fdi_mfg_ytd').length&&document.getElementById('chFdiMfg')){
 const rs=S('fdi_mfg_ytd'),years={};rs.forEach(r=>{years[r.date.slice(0,4)]=r});const ys=Object.keys(years).sort().slice(-7).map(k=>years[k]);
 barLineChart('chFdiMfg',{categories:ys.map(r=>r.date.slice(0,4)+(r.date.slice(5,7)!=='12'?' (đến T'+Number(r.date.slice(5,7))+')':'')),series:[{name:'FDI đăng ký · chế biến, chế tạo',color:C.navy,values:ys.map(r=>r.value)}],unit:'triệu USD',digits:0,height:260,rotateLabels:false});
 fillTable('tbl-fdi-mfg',['Kỳ','Triệu USD','So cùng kỳ'],ys.slice().reverse().map(r=>{const prev=rs.find(x=>x.date===String(Number(r.date.slice(0,4))-1)+r.date.slice(4));return [r.date.slice(0,4)+(r.date.slice(5,7)!=='12'?' (đến T'+Number(r.date.slice(5,7))+')':''),nf(r.value,0),prev?signed((r.value/prev.value-1)*100,1)+'%':'—']}));
 sourceLine('chFdiMfg',[SRC.fia,SRC.nso,SRC.wi],mon(rs.at(-1).date),'FDI đăng ký vào công nghiệp chế biến, chế tạo lũy kế từ đầu năm (chỉ tiêu 77100). Đây là nguồn cầu chính của đất khu công nghiệp.');
 insight('chFdiMfg','Khách thuê KCN là nhà máy chế biến chế tạo, nên FDI nhóm này là chỉ báo cầu sớm 2–6 quý trước khi doanh nghiệp KCN ghi doanh thu bàn giao đất. Vốn đăng ký tăng nhưng dồn vào mở rộng nhà máy cũ sẽ không tạo cầu đất mới.');
}
if(S('fdi_realized').length&&document.getElementById('chFdiRealized')){
 const rs=S('fdi_realized'),roll=rs.map((r,i)=>({date:r.date,value:i>=11?rs.slice(i-11,i+1).reduce((a,x)=>a+x.value,0):null})).slice(-36),last=rs.slice(-36);
 barLineChart('chFdiRealized',{categories:last.map(r=>mon(r.date)),series:[{name:'Vốn thực hiện tháng',color:C.teal,values:last.map(r=>r.value)}],unit:'triệu USD',digits:0,height:260,rotateLabels:true});
 fillTable('tbl-fdi-realized',['Tháng','Vốn thực hiện (triệu USD)','12 tháng trượt (triệu USD)'],last.slice().reverse().map((r,i)=>[mon(r.date),nf(r.value,0),nf(roll.slice().reverse()[i]?.value,0)]));
 sourceLine('chFdiRealized',[SRC.fia,SRC.nso,SRC.wi],mon(rs.at(-1).date),'Vốn FDI thực hiện toàn nền kinh tế theo tháng (chỉ tiêu 76951); chưa tách riêng bất động sản. Tổng 12 tháng trượt tự tính.');
 insight('chFdiRealized','Vốn thực hiện là tiền đã vào nhà xưởng, máy móc — nó xác nhận FDI đăng ký có thành nhà máy thật hay không. Tháng 12 và tháng 6 thường cao do chốt kỳ.');
}
if(S('iip_mfg_yoy').length&&document.getElementById('chIipMfg')){
 const rs=S('iip_mfg_yoy').slice(-36);
 barLineChart('chIipMfg',{categories:rs.map(r=>mon(r.date)),series:[{name:'IIP chế biến, chế tạo · YoY',color:C.navy,kind:'line',values:rs.map(r=>r.value)}],unit:'%',digits:1,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-iip-mfg',['Tháng','YoY (%)'],rs.slice().reverse().map(r=>[mon(r.date),nf(r.value,2)]));
 sourceLine('chIipMfg',[SRC.nso,SRC.wi],mon(rs.at(-1).date),'Chỉ số sản xuất công nghiệp nhóm chế biến, chế tạo, so cùng kỳ (chỉ tiêu 202899). Tháng Tết (1–2) nhiễu mạnh.');
 insight('chIipMfg','Sản xuất của khách thuê tăng là điều kiện để họ mở rộng mặt bằng và trả tiền thuê đúng hạn; IIP giảm hai quý liên tiếp thường đi trước hoãn ký hợp đồng thuê mới.');
}
// Prices & valuation
const steel=com.steel_price?.records||[],cement=com.cement_price?.records||[];
if(steel.length&&document.getElementById('chSteel')){
 const rs=steel.slice(-36);
 barLineChart('chSteel',{categories:rs.map(r=>mon(r.date)),series:[{name:'Thép CB300 D10 Hòa Phát',color:C.navy,kind:'line',values:rs.map(r=>r.value)}],unit:'nghìn VND/kg',digits:2,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-steel',['Kỳ','nghìn VND/kg'],rs.slice().reverse().map(r=>[mon(r.date),nf(r.value,2)]));
 sourceLine('chSteel',[['Giá niêm yết Hòa Phát qua Wi',null]],short(steel.at(-1).date),'Chỉ tiêu 74362, chuỗi ngày được Wi nén về giá cuối tháng. Một thương hiệu, một chủng loại; không phải giá bình quân thị trường.');
 insight('chSteel','Thép chiếm phần lớn chi phí kết cấu; giá tăng 10% làm chi phí xây dựng căn hộ tăng khoảng 1–2% tùy loại hình. Với chủ đầu tư đã khóa giá bán, thép tăng ăn vào biên; với dự án chưa mở bán, nó đẩy giá sơ cấp.');
}
if(cement.length&&document.getElementById('chCement')){
 const rs=cement.slice(-36);
 barLineChart('chCement',{categories:rs.map(r=>mon(r.date)),series:[{name:'Xi măng',color:C.grey,kind:'line',values:rs.map(r=>r.value)}],unit:'nghìn VND/kg',digits:3,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-cement',['Tháng','nghìn VND/kg'],rs.slice().reverse().map(r=>[mon(r.date),nf(r.value,3)]));
 sourceLine('chCement',[['Giá vật liệu xây dựng trong nước qua Wi',null]],mon(cement.at(-1).date),'Chỉ tiêu 80961, giá tháng do Wi tổng hợp từ công bố giá vật liệu địa phương. Thay đổi theo bậc vì nguồn cập nhật theo đợt.');
 insight('chCement','Xi măng ít biến động hơn thép và chỉ đổi theo đợt công bố; dùng như nền chi phí, không dùng để bắt điểm đảo chiều.');
}
if(Object.keys(sec).length&&document.getElementById('chSectorPb')){
 const ids=[['160','BĐS dân cư',C.navy],['157','BĐS công nghiệp',C.teal],['159','Cho thuê',C.gold],['161','Môi giới',C.plum]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort();
 const weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[2]:null};
 barLineChart('chSectorPb',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name,color,kind:'line',values:weekly.map(d=>at(id,d))})),unit:'x',digits:2,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-sector-pb',['Phân ngành (GICS Wi)','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],2),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorPb',[SRC.wi],short(dates.at(-1)),'Wi sector_ratio_daily cho bốn phân ngành cấp 4 (157, 159, 160, 161); vẽ mỗi 5 phiên để nhẹ trang, bảng giữ phiên mới nhất. P/B tổng hợp = vốn hóa / vốn chủ toàn phân ngành, nên bị chi phối bởi mã lớn (VHM, BCM).');
 insight('chSectorPb','P/B phân ngành dân cư do Vinhomes chi phối; đọc nó như định giá của một mã lớn hơn là của ngành. Cho thuê và môi giới dưới 1 lần cho thấy thị trường chưa trả giá cho dòng tiền ổn định hay cho đòn bẩy vào chu kỳ hồi phục. Đợt nhảy P/E dân cư tháng 7–8/2026 là nhiễu từ thay đổi mẫu số, không phải thay đổi kinh doanh.');
}

// ---------- 4. KPIs & quick read ----------
const res=sec['160']?.records||[],resLast=res.at(-1);
const nowM=new Date().toISOString().slice(0,7);
const next12=mat.filter(r=>r.date.slice(0,7)>=nowM).slice(0,12),due12=next12.reduce((a,r)=>a+r.due,0);
const lastClosed=closed.at(-1),prevClosed=closed.at(-2);
const cpi=S('cpi_housing_yoy').at(-1),fdi=S('fdi_re_ytd').at(-1),fdiPrev=fdi&&S('fdi_re_ytd').find(r=>r.date===String(Number(fdi.date.slice(0,4))-1)+fdi.date.slice(4));
const refi=S('refi_rate').at(-1);
kpi('spk-pb',resLast?nf(resLast[2],2)+'x':'—','P/B BĐS dân cư · '+(resLast?short(resLast[0]):'—')+' · Wi',resLast?'P/E '+nf(resLast[1],1)+'x · vốn hóa '+nf(resLast[3]/1000,0)+' nghìn tỷ':'',res.slice(-30).map(r=>r[2]));
kpi('spk-maturity',next12.length?nf(due12/1000,1):'—',next12.length?'nghìn tỷ VND gốc TPDN BĐS đến hạn 12 tháng tới':'Chưa có lịch đáo hạn',next12.length?'Cao nhất '+mon(next12.reduce((a,r)=>r.due>a.due?r:a).date)+': '+nf(next12.reduce((a,r)=>Math.max(a,r.due),0)/1000,1)+' nghìn tỷ':'',next12.map(r=>r.due),C.plum);
kpi('spk-late',lastClosed?nf(lastClosed.late_payment_debt/1000,1):'—',lastClosed?'nghìn tỷ VND TPDN BĐS chậm trả · '+mon(lastClosed.date):'—',lastClosed&&prevClosed?signed((lastClosed.late_payment_debt-prevClosed.late_payment_debt)/1000,2)+' nghìn tỷ so tháng trước · '+lastClosed.late_issuer_count+' doanh nghiệp':'',closed.slice(-12).map(r=>r.late_payment_debt),C.red);
kpi('spk-fdi',fdi?nf(fdi.value/1000,2):'—',fdi?'tỷ USD FDI đăng ký vào BĐS · '+fdi.date.slice(0,4)+' đến T'+Number(fdi.date.slice(5,7)):'—',fdi&&fdiPrev?signed((fdi.value/fdiPrev.value-1)*100,1)+'% so cùng kỳ':'',S('fdi_re_ytd').filter(r=>r.date.slice(0,4)===fdi?.date.slice(0,4)).map(r=>r.value),C.teal);
kpi('spk-cpi',cpi?nf(cpi.value,2)+'%':'—',cpi?'CPI nhà ở & VLXD so cùng kỳ · '+mon(cpi.date):'—',cpi?'Chỉ số '+nf(S('cpi_housing_index').at(-1)?.value,1)+' (2024 = 100)':'',S('cpi_housing_yoy').slice(-12).map(r=>r.value),C.gold);
kpi('spk-refi',refi?nf(refi.value,2)+'%':'—',refi?'lãi suất tái cấp vốn · '+short(refi.date):'—','Giữ nguyên từ 06/2023 · chi phí vay thực theo lãi suất huy động 12T',S('refi_rate').slice(-30).map(r=>r.value),C.grey);
const quick=document.querySelector('.hero .insight');
if(quick&&lastClosed){
 quick.innerHTML='';const b=make('b','','Đọc nhanh từ dữ liệu Wi: ');quick.append(b,`TPDN bất động sản còn ${nf(lastClosed.outstanding_value/1000,0)} nghìn tỷ dư nợ (${mon(lastClosed.date)}), chậm trả ${nf(lastClosed.late_payment_debt/1000,1)} nghìn tỷ tại ${lastClosed.late_issuer_count} doanh nghiệp; 12 tháng tới có ${nf(due12/1000,1)} nghìn tỷ gốc đến hạn. `+(fdi?`FDI đăng ký vào BĐS ${fdi.date.slice(0,4)} đến T${Number(fdi.date.slice(5,7))}: ${nf(fdi.value/1000,2)} tỷ USD${fdiPrev?' ('+signed((fdi.value/fdiPrev.value-1)*100,1)+'% so cùng kỳ)':''}. `:'')+(resLast?`P/B phân ngành dân cư ${nf(resLast[2],2)}x.`:''));
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
// Sources table and meta
const metaRow=document.getElementById('wi-built');if(metaRow)metaRow.textContent='Dựng từ WiMCP ngày '+built+' · các lời gọi ghi trong data/realestate-wi-contract.json.';
// Analyst input slot (parity with other sectors)
const catalyst=document.querySelector('.majorpane[data-tab="mt5"] .section');
if(catalyst){const personal=make('details','analyst-input');personal.dataset.updateKind='analyst';personal.dataset.cadence='on-demand';personal.innerHTML='<summary>Góc nhìn riêng của analyst</summary><p>Chưa có ý kiến riêng được nhập.</p>';catalyst.append(personal)}
window.REALESTATE_DASHBOARD={due12,lastClosed,resLast,fdi,fdiPrev,cpi,refi,topIssuers,next12};
})();
