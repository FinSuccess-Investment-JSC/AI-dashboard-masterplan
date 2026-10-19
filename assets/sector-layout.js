/* Value chains, geographic navigation, and clearly separated faster price feeds. */
(() => {
'use strict';
if(document.body.dataset.sector==='realestate'||document.body.dataset.sector==='textile'||document.body.dataset.sector==='port'||document.body.dataset.sector==='agri'||document.body.dataset.sector==='seafood'||document.body.dataset.sector==='shipping'||document.body.dataset.sector==='construction'||document.body.dataset.sector==='insurance'||document.body.dataset.sector==='retail'||document.body.dataset.sector==='pharma')return; // assets/realestate-dashboard.js owns the chain and the Nhà ở / KCN panes
const power=document.body.dataset.sector==='power',oil=!power&&!!document.getElementById('chCurve'),sugar=!oil&&!power,src=window.SECTOR_DAILY?.sources||{};
const fmt=(v,n=2)=>v.toLocaleString('vi-VN',{maximumFractionDigits:n});
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const chain=document.querySelector(`[data-block-id="${oil?'dau-khi':power?'dien':'sugar'}-01"]`);
if(chain){
 const grid=chain.parentElement;grid.before(chain);chain.classList.add('value-chain-card');grid.style.gridTemplateColumns='1fr';
 const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 const old=[...chain.children].filter(e=>e!==heading);old.forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt=oil?'03/09/2026':power?'06/10/2026':'17/08/2026'});
 const nodes=oil?[
 ['importgas',25,100,['LNG nhập khẩu']],['domestic',25,230,['Khai thác trong nước','PVN / PVEP, nhà thầu']],['importoil',25,355,['Dầu thô nhập khẩu']],
 ['gas',315,100,['Thu gom • xử lý • tái hóa khí','GAS và hạ tầng khí']],['refine',315,330,['Nhà máy lọc dầu','BSR • Nghi Sơn']],
 ['power',655,75,['Điện khí • đạm','Khách hàng công nghiệp']],['retail',655,315,['Phân phối xăng dầu','PLX • OIL']],['use',925,315,['Vận tải • sản xuất','Người tiêu dùng']],
 ['service',315,445,['Dịch vụ hỗ trợ khai thác','PVD • PVS • PVB']],['transport',655,445,['Vận tải dầu / sản phẩm','PVT • PVP']]
 ]:power?[
 ['coal',25,40,['Than nhập khẩu • trong nước']],['gasfuel',25,135,['Khí trong nước • LNG']],['water',25,230,['Thủy năng','Thủy văn • El Niño']],['sunwind',25,325,['Gió • mặt trời']],
 ['coalplant',315,40,['Nhiệt điện than','PPC • QTP • HND • BTP','POW • PGV']],['gasplant',315,135,['Điện khí • LNG','POW • NT2 • PGV']],['hydro',315,230,['Thủy điện','REE • VSH • CHP • SBA • TMP • SHP']],['re',315,325,['Năng lượng tái tạo','GEG • HDG • TTA • PC1']],
 ['eptc',655,135,['EVN/EPTC mua điện','NSMO điều độ • thị trường']],['dppa',655,325,['DPPA','Mua bán điện trực tiếp']],
 ['grid',925,135,['Truyền tải NPT','Phân phối EVN PCs']],['customer',925,280,['Khách hàng','Công nghiệp • hộ dân']],['build',655,420,['Tư vấn • xây lắp • thiết bị','PC1 • TV1 • TV2 • TV3','GEX • GEE']]
 ]:[
 ['cane',25,100,['Vùng nguyên liệu mía','Nông dân / vùng liên kết']],['raw',25,245,['Đường thô nhập khẩu']],['refined',25,375,['Đường thành phẩm nhập']],
 ['mill',335,100,['Ép mía • chế biến đường','SBT • QNS • SLS • LSS • KTS']],['refinery',335,245,['Tinh luyện đường thô']],['product',625,170,['Đường RS / RE']],
 ['b2b',925,85,['Khách hàng công nghiệp','Đồ uống • bánh kẹo • sữa']],['b2c',925,230,['Bán lẻ / phân phối','Người tiêu dùng']],['hfcs',625,375,['HFCS nhập khẩu','Chất tạo ngọt thay thế']]
 ];
 const edges=oil?[
 ['importgas','gas'],['domestic','gas'],['domestic','refine'],['importoil','refine'],['gas','power'],['refine','retail'],['retail','use'],['service','domestic',true],['transport','refine',true]
 ]:power?[['coal','coalplant'],['gasfuel','gasplant'],['water','hydro'],['sunwind','re'],['coalplant','eptc'],['gasplant','eptc'],['hydro','eptc'],['re','eptc'],['re','dppa'],['eptc','grid'],['grid','customer'],['dppa','customer'],['build','grid',true]]:[['cane','mill'],['raw','refinery'],['mill','product'],['refinery','product'],['product','b2b'],['product','b2c'],['refined','b2c'],['hfcs','b2b',true]];
 const w=oil?215:220,h=65,byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed],edgeIndex)=>{const A=byId[a],B=byId[b],forward=B[1]>A[1],x1=A[1]+(forward?w:0),x2=B[1]+(forward?0:w),y1=A[2]+h/2,y2=B[2]+h/2,mid=(x1+x2)/2;const custom=oil?{ 'domestic:gas':'M240 245 H285 V150 H315', 'domestic:refine':'M240 270 H265 V350 H315', 'service:domestic':'M315 477 H250 V285 H240', 'transport:refine':'M655 477 H610 V380 H530' }:{'refined:b2c':'M245 407 H900 V280 H925','hfcs:b2b':'M845 407 H875 V135 H925'};const route=custom[a+':'+b]||`M${x1} ${y1} H${mid} V${y2} H${x2}`;return `<path d="${route}" class="chain-edge ${dashed?'support':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:lines.length===3?17:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?19:0}">${t}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1170 ${oil?535:power?505:465}" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành ${oil?'dầu khí':power?'điện':'đường'}</title><desc id="chain-desc">${power?'Than, khí/LNG, thủy năng, gió và mặt trời đi vào bốn nhóm nhà máy; EVN/EPTC mua điện theo hợp đồng và thị trường, NSMO điều độ; NPT truyền tải, các tổng công ty điện lực phân phối tới khách hàng. DPPA cho phép bán trực tiếp; xây lắp và thiết bị hỗ trợ lưới.':oil?'Dầu và khí đi theo hai nhánh chế biến riêng. Dịch vụ kỹ thuật hỗ trợ khai thác; vận tải hỗ trợ luân chuyển dầu và sản phẩm.':'Mía nội địa và đường thô nhập đi qua chế biến, cung cấp đường cho khách hàng công nghiệp và bán lẻ. Đường nhập và HFCS tạo cạnh tranh.'}</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2938A8"/></marker></defs>${(power?['NHIÊN LIỆU & NƯỚC','PHÁT ĐIỆN','MUA ĐIỆN · LƯỚI · KHÁCH HÀNG']:['ĐẦU VÀO / THƯỢNG NGUỒN','CHẾ BIẾN / TRUNG NGUỒN','ĐẦU RA / KHÁCH HÀNG']).map((t,i)=>`<rect x="${[0,290,640][i]}" y="0" width="${[275,335,525][i]}" height="${oil?530:power?500:460}" rx="12" fill="${['#edf5fc','#f0f7ef','#fff4e7'][i]}"/><text x="${[137,457,902][i]}" y="33" text-anchor="middle" class="chain-lane">${t}</text>`).join('')}${paths}${boxes}</svg>`;
 heading.after(figure);chain.append(make('div','chart-insight',power?'AI · cách đọc chuỗi: Mỗi nhóm nhà máy nhạy với một biến khác nhau. Nhiệt điện than nhạy giá than và mức huy động; điện khí/LNG nhạy giá khí và hợp đồng bao tiêu; thủy điện nhạy thủy văn (El Niño làm giảm nước về); năng lượng tái tạo nhạy giá FIT/khung giá chuyển tiếp và cắt giảm công suất. EVN là bên mua chính nên giá bán lẻ và tài chính EVN ảnh hưởng tốc độ thanh toán cho mọi nhà máy.':oil?'AI · cách đọc chuỗi: Theo từng nhánh dầu và khí để xác định biến lợi nhuận. Lọc dầu nhạy với crack và công suất vận hành; phân phối nhạy với giá vốn và tồn kho; khí nhạy với sản lượng tiêu thụ và điều khoản giá. Dịch vụ kỹ thuật hưởng tác động qua đầu tư và tiến độ dự án, thường có độ trễ so với giá dầu.':'AI · cách đọc chuỗi: Tách doanh nghiệp tự chủ vùng mía với doanh nghiệp phụ thuộc đường thô nhập để hiểu độ nhạy giá nguyên liệu. Đầu ra công nghiệp và bán lẻ có cơ chế giá khác nhau; đường nhập và HFCS làm thay đổi khả năng chuyển chi phí sang khách hàng.'));
 const legend=make('div','source-note','Mũi tên liền: luồng điện/nhiên liệu chính · Mũi tên đứt: '+(power?'xây lắp và thiết bị hỗ trợ lưới, không phải dòng điện.':oil?'dịch vụ hỗ trợ; không phải bước biến đổi dầu thành khí.':'quan hệ thay thế tại khách hàng công nghiệp.')+' Sơ đồ không biểu thị tỷ trọng hay quan hệ sở hữu.');figure.after(legend);
 if(power){const refs=make('div','source-note');refs.innerHTML='Đối chiếu doanh nghiệp: <a href="https://bctn.genco3.com/thong-tin-chung/" target="_blank" rel="noopener">PGV · EVNGENCO3</a> · <a href="https://www.pecc1.com.vn/c3/gioi-thieu/Thong-tin-chung-2-406.aspx" target="_blank" rel="noopener">TV1 · PECC1</a> · <a href="https://www.pecc3.com.vn/gioi-thieu/" target="_blank" rel="noopener">TV3 · PECC3</a> · <a href="https://gelex.vn/tin-tuc-su-kien/gelex-electric-gioi-thieu-he-sinh-thai-san-pham-xanh-ben-vung.html" target="_blank" rel="noopener">GEE · GELEX Electric</a>. GEE ở nhánh thiết bị, không đại diện cho công suất phát điện.';legend.after(refs)}
}
function card(id,title,subtitle,kind='public',cadence='daily'){
 const c=make('div','card');Object.assign(c.dataset,{blockId:id,updateKind:kind,cadence});c.append(make('div','chart-title',title),make('div','chart-sub',subtitle));return c;
}
function source(c,s,method){
 const PAGE={'https://apps.fas.usda.gov/psdonline/downloads/psd_sugar_csv.zip':'https://apps.fas.usda.gov/psdonline/app/index.html#/app/advQuery'};
 c.dataset.refreshStatus=s.status==='ok'?'loaded':'last-good';c.dataset.sourceIds=Object.keys(src).find(k=>src[k]===s)||'';
 const row=make('div','source-note');const a=make('a','',s.source_name);a.href=PAGE[s.source_url]||s.source_url;a.target='_blank';a.rel='noopener';row.append('Nguồn: ',a,` · ${s.observation_frequency==='marketing year'?'Niên vụ bắt đầu: '+s.latest_observation.slice(0,4):'Kỳ cuối: '+s.latest_observation} · Kiểm tra: ${s.last_checked_at?.slice(0,10)||'—'}`);c.append(row);
 if(s.status!=='ok')c.append(make('div','refresh-note is-stale','Lần tải mới lỗi; giữ dữ liệu tốt gần nhất.'));
 c.append(make('div','source-note method-note',method));
}
// Faster futures stay separate from spot and physical-margin calculations.
const powerKey=['coal_newcastle','lng_jkm'].find(k=>src[k]?.records?.length)||'coal_newcastle';
const key=oil?'brent_futures':power?powerKey:'sugar_futures',feed=src[key];
const coal=key==='coal_newcastle';
const fastTitle=oil?'Brent futures — theo dõi giá hằng ngày':power?(coal?'Than Newcastle — theo dõi giá hằng ngày':'LNG JKM — theo dõi giá hằng ngày'):'Đường No.11 futures — theo dõi giá hằng ngày';
const fastUnit=oil?'USD/thùng':power?(coal?'USD/tấn':'USD/MMBtu'):'US cent/lb';
const fastName=oil?'Brent futures':power?(coal?'Than Newcastle':'LNG JKM'):'Sugar No.11 futures';
if(feed?.records?.length){
 const c=card('fast-price',fastTitle,`${fastUnit} · close phiên hoàn tất`);
 const h=make('div');h.id='chFastPrice';c.append(h);
 const rs=feed.records.slice(-90);c.querySelector('.chart-sub').append(` · ${fmt(rs.at(-1).value)} (${rs.at(-1).date})`);
 document.querySelector('.majorpane[data-tab="mt3"] .sectionhead').after(c);
 barLineChart(h.id,{categories:rs.map(r=>r.date),series:[{name:fastName,kind:'line',color:'#2938A8',values:rs.map(r=>r.value)}],unit:fastUnit,digits:2,height:250,zeroBase:false});
 if(power)source(c,feed,`${feed.source_name}${feed.instrument?' · '+feed.instrument:''}. Một chuỗi/hợp đồng duy nhất của nguồn, không ghép các hợp đồng; 90 phiên gần nhất, chỉ phiên đã hoàn tất. Giá close không phải settlement.`);
 else source(c,feed,`API Yahoo Finance chart, mã ${oil?'BZ=F':'SB=F'}, chuỗi hợp đồng gần tự chuyển kỳ; 90 phiên gần nhất, loại phiên chưa hoàn tất theo múi giờ sàn. Nguồn không chính thức; giá close không phải settlement. Chuyển hợp đồng có thể tạo bước nhảy. ${oil?'Không thay Brent spot EIA trong phép tính crack.':'Đơn vị nguồn USX = US cent/lb; không ghép trực tiếp với chuỗi World Bank USD/kg.'}`);
 if(power)c.append(make('div','chart-insight','AI · bối cảnh ngành: Giá than và LNG nhập khẩu là chi phí biến đổi chính của nhiệt điện. Với hợp đồng có cơ chế chuyển ngang giá nhiên liệu, lợi nhuận phụ thuộc mức huy động và giá thị trường hơn là giá nhiên liệu đơn thuần; giá tăng còn đẩy chi phí mua điện của EVN.'));
 else c.append(make('div','chart-insight',oil?'AI · bối cảnh ngành: Futures giúp theo dõi phản ứng giá nhanh hơn chuỗi spot công khai. Giá tăng chỉ là tín hiệu đầu vào: lợi nhuận lọc dầu phụ thuộc crack, còn phân phối phụ thuộc tồn kho và chu kỳ điều hành. Chênh lệch futures–spot còn chịu ảnh hưởng kỳ hạn và ngày quan sát.':'AI · bối cảnh ngành: Đường No.11 phản ánh kỳ vọng giá đường thô quốc tế, hữu ích theo dõi chi phí nhập cho nhà tinh luyện. Tác động tới giá đường nội địa còn qua tỷ giá, thuế, logistics và tồn kho; futures tăng không bảo đảm doanh nghiệp mía đường tăng biên ngay.'));
}
if(sugar&&src.sugar_monthly?.records?.length){
 const s=src.sugar_monthly,rs=s.records.slice(-24),c=document.getElementById('chWorldRecent').closest('.card');
 lineChart('chWorldRecent',{labels:rs.map(r=>r.date.slice(0,7)),values:rs.map(r=>r.value),color:'#2938A8',unit:'USD/kg',digits:2,seriesName:'Đường thế giới · World Bank'});
 fillTable('tbl-world-recent',['Tháng','USD/kg'],rs.map(r=>[r.date.slice(0,7),fmt(r.value)]));
 source(c,s,'Tải file Monthly Prices của World Bank; chọn đúng cột Sugar, world và đơn vị USD/kg. Kỳ dữ liệu là bình quân tháng; ngày cuối tháng dùng làm khóa kỳ, không phải báo giá ngày. Bộ tải kiểm tra mỗi ngày và chỉ thay số khi World Bank công bố.');
 const originalNote=c.querySelector('.source-note:not(.cadence-note)');if(originalNote&&!originalNote.classList.contains('method-note'))originalNote.remove();
 const annual=window.SectorMath.aggregate(s.records,'value','year','mean').filter(r=>r.count===12),long=document.getElementById('chWorldLong').closest('.card');
 barLineChart('chWorldLong',{categories:annual.map(r=>r.date),series:[{name:'Đường thế giới',color:'#2938A8',values:annual.map(r=>r.value)}],unit:'USD/kg',digits:2,height:250});fillTable('tbl-world-long',['Năm đủ 12 tháng','USD/kg'],annual.map(r=>[r.date,fmt(r.value)]));
 long.querySelector('.chart-title').textContent='Giá đường thế giới — bình quân năm hoàn tất';long.querySelector('.chart-sub').textContent='USD/kg · chỉ năm đủ 12 tháng';source(long,s,'Bình quân số học 12 giá tháng World Bank. Chỉ hiển thị các năm đủ 12 quan sát; không so bình quân YTD với cả năm.');
 const cl=v=>v/2.20462*100;const kpi=document.getElementById('spk-world').closest('.kpi');kpi.querySelector('.value').textContent=fmt(cl(rs.at(-1).value),1);kpi.querySelector('.label').textContent='Giá đường thế giới T'+(+rs.at(-1).date.slice(5,7))+'/'+rs.at(-1).date.slice(0,4);kpi.querySelector('.sub').textContent='US cent/lb · '+rs.at(-1).date.slice(0,7)+' · World Bank';kpi.querySelector('.delta').textContent='Bình quân tháng mới nhất';document.getElementById('spk-world').replaceChildren();sparkline('spk-world',rs.slice(-8).map(r=>cl(r.value)),'#2938A8');
 const cycle=document.querySelector('[data-block-id="sugar-02"] p'),all=s.records,L=all.at(-1),ym=r=>'T'+(+r.date.slice(5,7))+'/'+r.date.slice(0,4);
 const pk=all.filter(r=>r.date>='2023').reduce((a,r)=>r.value>a.value?r:a),tr=all.filter(r=>r.date>pk.date).reduce((a,r)=>r.value<a.value?r:a);
 const pct=(a,b)=>Math.round((a/b-1)*100),stockTxt=document.querySelector('#spk-stock')?.closest('.kpi')?.querySelector('.value')?.textContent;
 cycle.innerHTML='Giá thế giới (World Bank) '+ym(L)+' <b>'+fmt(cl(L.value),1)+' cent/lb</b>: '+(L.value>tr.value?'<b>+'+pct(L.value,tr.value)+'%</b> từ đáy '+fmt(cl(tr.value),1)+' ('+ym(tr)+')':'đang ở đáy chu kỳ')+', vẫn thấp hơn đỉnh '+fmt(cl(pk.value),1)+' ('+ym(pk)+') '+Math.abs(pct(L.value,pk.value))+'%. Trong nước dư cung: tồn kho cuối vụ 25/26 '+(stockTxt||'—')+' tấn (USDA), cao nhất 16 vụ. Giá thế giới hồi làm đường nhập đắt lên, đỡ giá trong nước; tồn kho cao giới hạn đà tăng.';
 const old=document.querySelector('.hero .insight');if(old){const details=make('details','summary-archive'),summary=make('summary','','Bản phân tích AI lưu 17/08/2026');details.append(summary);old.before(details);details.append(old);old.classList.remove('insight');const fresh=make('div','insight','Đọc nhanh từ dữ liệu: Giá đường World Bank bình quân '+rs.at(-1).date.slice(0,7)+' là '+fmt(rs.at(-1).value)+' USD/kg. Futures No.11 có chuỗi ngày riêng ở tab Giá–Chi phí–Margin. Cân đối Việt Nam vẫn theo niên vụ USDA; cần đọc kỳ ước tính và tồn kho cùng giá nhập quy đổi trước khi kết luận biên lợi nhuận.');Object.assign(fresh.dataset,{updateKind:"ai",cadence:"on-data-change",inputOwner:"rule-based"});details.before(fresh)}
 const monitor=document.querySelector('.monitor-item');if(monitor){monitor.querySelector('strong').textContent=fmt(cl(rs.at(-1).value),1)+' cent/lb';monitor.querySelector('a').textContent='World Bank · tháng '+rs.at(-1).date.slice(0,7)}
}
// Geographic tabs separate source scope, preserving all existing limitation elements.
const section=document.querySelector('.majorpane[data-tab="mt2"] .section'),head=section.querySelector('.sectionhead');
const children=[...section.children].filter(e=>e!==head),world=make('div','supply-pane'),vn=make('div','supply-pane');world.id='supply-world';vn.id='supply-vietnam';section.append(world,vn);
if(oil||power){let vietnam=false;children.forEach(e=>{if(e.matches('h3')&&e.textContent.includes('Việt Nam'))vietnam=true;(vietnam?vn:world).append(e)})}
else{
 children.forEach(e=>vn.append(e));head.querySelector('h2').textContent='2. Cung – cầu – tồn kho đường';head.querySelector('p').textContent='Thế giới: các trung tâm sản xuất đường lớn. Việt Nam: cân đối USDA theo niên vụ và dữ liệu mía theo công bố trong nước.';
 const s=src.sugar_producers,c=card('sugar-world-production','Các trung tâm cung đường thế giới','Triệu tấn, giá trị thô · năm bắt đầu niên vụ · kỳ mới là ước tính','periodic','semiannual');world.append(c);
 if(s?.records?.length){const h=make('div');h.id='chSugarProducers';c.append(h);const rs=s.records.slice(-12);const countries=[['Brazil','brazil','#2938A8'],['Ấn Độ','india','#59C5C8'],['Thái Lan','thailand','#861C52'],['EU','eu','#c29100']];barLineChart(h.id,{categories:rs.map(r=>String(r.market_year)+(r.market_year>=2025?'*':'')),series:countries.map(([name,key,color])=>({name,kind:'line',color,values:rs.map(r=>r[key])})),unit:'triệu tấn',digits:1,height:290,stackable:true});
 source(c,s,'USDA PSD, Sugar Centrifugal, Production; nghìn tấn quy đổi giá trị thô chia 1.000. Chọn Brazil, India, Thailand, European Union; không cộng các nước thành tổng thế giới. Năm trên trục là năm bắt đầu niên vụ địa phương, không cùng một kỳ lịch toàn cầu. * Kỳ gần nhất có thể được USDA ước tính/dự báo và điều chỉnh; lịch báo cáo đường tháng 5 và 11.');
 c.append(make('div','chart-insight','AI · bối cảnh ngành: Theo dõi sản lượng Brazil, Ấn Độ và Thái Lan để nhận diện thay đổi nguồn cung có thể giao dịch quốc tế. Sản lượng tăng chưa chắc xuất khẩu tăng nếu tiêu thụ, ethanol hoặc hạn chế xuất khẩu hấp thụ phần tăng. Đây là đối chiếu các trung tâm cung, chưa phải tổng cân bằng toàn cầu.'));
 }else c.append(make('div','source-note','Chưa tải được USDA PSD. Không suy diễn số liệu thế giới từ cân đối Việt Nam.'));
 // Sản lượng 2 niên vụ gần nhất theo nước (USDA PSD), % so cùng kỳ ghi ở nhãn nước.
 if(s?.records?.length&&'vietnam' in s.records.at(-1)){
  const cur=s.records.at(-1),prev=s.records.at(-2),y=cur.market_year,pairs=[['Brazil','brazil'],['Ấn Độ','india'],['EU','eu'],['Trung Quốc','china'],['Thái Lan','thailand'],['Mỹ','us'],['Nga','russia'],['Việt Nam','vietnam']];
  const pct=k=>(cur[k]/prev[k]-1)*100,sg=v=>(v>0?'+':v<0?'−':'')+fmt(Math.abs(v),1)+'%';
  const c=card('sugar-country-yoy',`Dự báo sản lượng đường niên vụ ${y}/${String(y+1).slice(2)} theo nước`,`Nghìn tấn, giá trị thô · nhãn nước kèm % so niên vụ ${y-1}/${String(y).slice(2)}`,'periodic','semiannual');world.append(c);
  const h=make('div');h.id='ch-sugar-country-yoy';c.append(h);
  const model={categories:pairs.map(([n])=>n),tickLabels:pairs.map(([n,k])=>n+'\n'+sg(pct(k))),allTicks:true,series:[{name:`${y-1}/${String(y).slice(2)}`,color:'#C9CED8',kind:'bar',values:pairs.map(([,k])=>prev[k]*1000)},{name:`${y}/${String(y+1).slice(2)}*`,color:'#2938A8',kind:'bar',values:pairs.map(([,k])=>cur[k]*1000)}],unit:'nghìn tấn',digits:0,time:false,aria:'Sản lượng đường theo nước'};
  if(window.ChartTypes)ChartTypes.mount(h,{...model,native:'bar'},()=>{h.innerHTML=ChartTypes.render({...model,width:h.clientWidth||640},'bar')});
  // Dự báo của nguồn khác cho cùng niên vụ, đặt cạnh số USDA thay vì một chart riêng (tránh hai chart lệch số).
  const alt=make('div','chart-caveat');alt.dataset.blockId='sugar-12';const L=(t,u)=>{const x=make('a','',t);x.href=u;x.target='_blank';x.rel='noopener';return x};
  alt.append('Nguồn khác cho '+y+'/'+String(y+1).slice(2)+': EU −19% (EU Sugar Market Observatory, 27/08, qua ',L('Barchart','https://www.barchart.com/story/news/4405309/sugar-prices-supported-by-expectations-of-a-global-deficit'),') so với USDA '+sg(pct('eu'))+'; Brazil −2,9% (',L('Conab 20/08','https://www.brasilagro.com.br/conteudo/conab-projeta-queda-na-producao-de-acucar-e-alta-no-etanol.html'),') so với USDA '+sg(pct('brazil'))+'. Số USDA Ấn Độ là dự báo 05/2026, trước khi gió mùa thiếu hụt.');c.append(alt);
  source(c,s,'USDA PSD, Sugar Centrifugal, Production; '+y+'/'+String(y+1).slice(2)+' là dự báo USDA, khác kỳ với dự báo của EU và Conab.');
 }
 // Tỷ trọng thế giới theo nước (USDA PSD): cung = sản xuất; cầu = nhập khẩu, tiêu dùng. Phần còn lại gộp "Nước khác" để tổng 100%.
 const sh=src.sugar_world_shares;
 if(sh?.records?.length){
  const VN={brazil:'Brazil',india:'Ấn Độ',european_union:'EU',china:'Trung Quốc',thailand:'Thái Lan',united_states:'Mỹ',indonesia:'Indonesia',united_arab_emirates:'UAE',other:'Nước khác'};
  const COL={brazil:'#2938A8',india:'#59C5C8',european_union:'#c29100',china:'#C8102E',thailand:'#861C52',united_states:'#5B6B8C',indonesia:'#2E8B57',united_arab_emirates:'#E07B39',other:'#C9CED8'};
  const keys=g=>Object.keys(sh.records[0]).filter(k=>k.startsWith(g+'_')&&k!==g+'_total').map(k=>k.slice(g.length+1));
  const rs=sh.records.slice(-12),lab=rs.map(r=>String(r.market_year)+(r.market_year>=2025?'*':''));
  const share=(id,g,title,sub)=>{const c=card(id,title,sub,'periodic','semiannual');world.append(c);const h=make('div');h.id='ch-'+id;c.append(h);
   const model={categories:lab,series:keys(g).map(k=>({name:VN[k]||k,color:COL[k]||'#999',kind:'bar',values:rs.map(r=>+(r[g+'_'+k]/r[g+'_total']*100).toFixed(1))})),unit:'%',digits:1,stackable:true,time:true,yMax:100,aria:title};
   if(window.ChartTypes)ChartTypes.mount(h,{...model,native:'stack'},()=>{h.innerHTML=ChartTypes.render({...model,width:h.clientWidth||640},'stack')});
   const L=rs.at(-1);c.append(make('div','source-note','Tổng thế giới '+fmt(L[g+'_total'],1)+' triệu tấn ('+L.market_year+'*, ước tính).'));
   source(c,sh,'USDA PSD, Sugar Centrifugal, giá trị thô. Tỷ trọng = nước ÷ tổng các nước trong PSD cùng năm; EU tính là một khối. Năm trên trục là năm bắt đầu niên vụ của từng nước.')};
  share('sugar-world-share-prod','prod','Tỷ trọng sản xuất đường thế giới','% sản lượng toàn cầu · Cung');
  share('sugar-world-share-imp','imp','Tỷ trọng nhập khẩu đường thế giới','% tổng nhập khẩu · Cầu');
  share('sugar-world-share-cons','cons','Tỷ trọng tiêu dùng đường thế giới','% tiêu dùng toàn cầu · Cầu');
 }
 // Giá – tồn kho/tiêu thụ – ENSO: ba chart riêng trục, cùng mốc 2010 (không dùng hai trục để tránh giao cắt giả).
 const wbm=src.sugar_monthly,oni=src.enso_oni;
 if(sh?.records?.[0]?.stocks_total!=null&&wbm?.records?.length&&oni?.records?.length){
  const c=card('sugar-cycle','Giá đường, tồn kho thế giới và ENSO, 2010 đến nay','Ba chart cùng mốc thời gian, mỗi chart một trục','periodic','monthly');world.append(c);c.style.gridColumn='1 / -1';
  const sub=(id,t)=>{c.append(make('div','chart-sub',t));const h=make('div');h.id=id;c.append(h);return h};
  const pr=wbm.records.filter(r=>r.date>='2010'),h1=sub('ch-sugar-cycle-price','Giá đường thế giới, US cent/lb, bình quân tháng (World Bank, quy đổi từ USD/kg)');
  const m1={categories:pr.map(r=>r.date.slice(0,7)),tickLabels:pr.map(r=>r.date.slice(0,4)),series:[{name:'Giá đường',color:'#2938A8',kind:'line',values:pr.map(r=>+(r.value/2.20462*100).toFixed(2))}],unit:'cent/lb',digits:1,zeroBase:false,aria:'Giá đường thế giới'};
  ChartTypes.mount(h1,m1,()=>{h1.innerHTML=ChartTypes.render({...m1,width:h1.clientWidth||640},'line')});
  const st=sh.records.filter(r=>r.market_year>=2010),h2=sub('ch-sugar-cycle-stu','Tồn kho cuối kỳ / tiêu thụ toàn cầu, % (USDA PSD, năm bắt đầu niên vụ; * ước tính)');
  const m2={categories:st.map(r=>String(r.market_year)+(r.market_year>=2025?'*':'')),series:[{name:'Tồn kho/tiêu thụ',color:'#861C52',kind:'line',values:st.map(r=>+(r.stocks_total/r.use_total*100).toFixed(1))}],unit:'%',digits:1,zeroBase:false,aria:'Tồn kho trên tiêu thụ'};
  ChartTypes.mount(h2,m2,()=>{h2.innerHTML=ChartTypes.render({...m2,width:h2.clientWidth||640},'line')});
  const on=oni.records.filter(r=>r.date>='2010'),h3=sub('ch-sugar-cycle-enso','ENSO, chỉ số ONI °C (NOAA): ≥ +0,5 El Niño, ≤ −0,5 La Niña');
  const pick=f=>on.map(r=>f(r.oni)?r.oni:null);
  const m3={categories:on.map(r=>r.date.slice(0,7)),tickLabels:on.map(r=>r.date.slice(0,4)),series:[{name:'El Niño',color:'#C8102E',kind:'bar',values:pick(v=>v>=0.5)},{name:'La Niña',color:'#2E7BC4',kind:'bar',values:pick(v=>v<=-0.5)},{name:'Trung tính',color:'#C9CED8',kind:'bar',values:pick(v=>v>-0.5&&v<0.5)}],unit:'°C',digits:2,stackable:true,aria:'Chỉ số ENSO ONI'};
  ChartTypes.mount(h3,{...m3,native:'stack'},()=>{h3.innerHTML=ChartTypes.render({...m3,width:h3.clientWidth||640},'stack')});
  const row=make('div','source-note');row.append('Nguồn: ');[['World Bank Pink Sheet','https://www.worldbank.org/en/research/commodity-markets'],['USDA FAS PSD','https://apps.fas.usda.gov/psdonline/app/index.html#/app/advQuery'],['NOAA CPC ONI','https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php']].forEach(([t,u],i)=>{if(i)row.append(' · ');const a=make('a','',t);a.href=u;a.target='_blank';a.rel='noopener';row.append(a)});c.append(row);
  c.append(make('div','source-note method-note','Tồn kho/tiêu thụ = tổng tồn kho cuối kỳ ÷ tổng tiêu thụ (Total Disappearance) của các nước trong PSD. ONI là trung bình trượt 3 tháng, gắn vào tháng cuối. Thời tiết tác động lên vụ mía thường trễ 6–12 tháng.'));
 }
 // Dự báo 2026/27 từ tài liệu: số đã mở trang gốc, câu trích lưu ở data/sugar/evidence.json (sugar-11, sugar-12).
 const fcBar=(id,title,sub,rows,unit,digits,refs,gap)=>{const c=card(id,title,sub,'periodic','on-publish');world.append(c);const h=make('div');h.id='ch-'+id;c.append(h);
  const model={categories:rows.map(r=>r[0]),series:[{name:title,color:'#2938A8',kind:'bar',values:rows.map(r=>r[1])}],unit,digits,stackable:false,time:false,aria:title};
  if(window.ChartTypes)ChartTypes.mount(h,{...model,native:'bar'},()=>{h.innerHTML=ChartTypes.render({...model,width:h.clientWidth||640},'bar')});
  if(gap)c.append(make('div','source-note data-gap',gap));
  const row=make('div','source-note');row.append('Nguồn: ');refs.forEach(([t,u],i)=>{if(i)row.append(' · ');const a=make('a','',t);a.href=u;a.target='_blank';a.rel='noopener';row.append(a)});c.append(row)};
 fcBar('sugar-11','Dự báo cán cân đường thế giới niên vụ 2026/27','Triệu tấn · âm = thiếu hụt · số mới nhất của từng tổ chức',[['Czarnikow (11/06)',-0.1],['ISO (01/09)',-0.2],['Covrig (03/08)',-0.3],['StoneX (28/07)',-1.7],['Green Pool (27/08)',-3.2]],'triệu tấn',1,[['Barchart 02/09/2026','https://www.barchart.com/story/news/4405309/sugar-prices-supported-by-expectations-of-a-global-deficit'],['Barchart 31/08/2026','https://www.barchart.com/story/news/4359559/global-supply-fears-underpin-sugar-prices']]);
}
const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Phạm vi cung cầu');
const panes=[world,vn];function select(i){panes.forEach((p,j)=>{p.hidden=i!==j;const b=tabs.children[j];b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1})}
['Thế giới','Việt Nam'].forEach((label,i)=>{const b=make('button','tabbtn',label);b.type='button';b.id='supply-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',panes[i].id);panes[i].setAttribute('role','tabpanel');panes[i].setAttribute('aria-labelledby',b.id);b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowLeft')next=1-i;else if(e.key==='Home')next=0;else if(e.key==='End')next=1;if(next!==undefined){e.preventDefault();select(next);tabs.children[next].focus()}});tabs.append(b)});
head.after(tabs,world,vn);select(0);
})();
