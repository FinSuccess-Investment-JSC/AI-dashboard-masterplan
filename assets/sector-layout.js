/* Value chains, geographic navigation, and clearly separated faster price feeds. */
(() => {
'use strict';
if(document.body.dataset.sector==='realestate'||document.body.dataset.sector==='textile'||document.body.dataset.sector==='port'||document.body.dataset.sector==='agri'||document.body.dataset.sector==='seafood'||document.body.dataset.sector==='shipping'||document.body.dataset.sector==='construction'||document.body.dataset.sector==='insurance'||document.body.dataset.sector==='retail'||document.body.dataset.sector==='pharma')return; // assets/realestate-dashboard.js owns the chain and the Nhà ở / KCN panes
const power=document.body.dataset.sector==='power',oil=!power&&!!document.getElementById('chCurve'),sugar=!oil&&!power,src=window.SECTOR_DAILY?.sources||{};
const fmt=(v,n=2)=>v.toLocaleString('vi-VN',{maximumFractionDigits:n});
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
// Sơ đồ chuỗi kiểu mới (Điện, Đường, Dầu khí): mỗi dòng nguyên liệu giữ một màu từ đầu vào tới khách hàng, icon theo khâu,
// mũi tên chạy; rê chuột sáng luồng trên/dưới của khâu, bấm khâu để xem các mã của khâu đó.
const VC_ICON={
 coal:'<path d="M3 19l5-8 3 4 3-5 5 9z"/><path d="M8 11l1-2"/>',
 gas:'<path d="M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-3-1-5 0-7z"/>',
 water:'<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
 factory:'<path d="M3 21V11l5 3v-3l5 3V5h3v16zM3 21h18M18 21V9h3v12"/>',
 dam:'<path d="M4 4h16v8H4zM3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
 wind:'<circle cx="12" cy="9" r="1.4"/><path d="M12 10.4V22M12 9L6 5M12 9l6-2M12 9l1 7"/>',
 bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
 direct:'<path d="M3 12h16M14 7l5 5-5 5M3 6h6M3 18h6"/>',
 tower:'<path d="M12 2L7 22M12 2l5 20M6 7h12M8 13h8M7.5 17l9-4M16.5 17l-9-4"/>',
 home:'<path d="M3 11l9-7 9 7v10H3zM9 21v-6h6v6"/>',
 tool:'<path d="M15 4a5 5 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a5 5 0 0 1-2-2z"/>',
 leaf:'<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7"/>',
 ship:'<path d="M3 15l2 5h14l2-5zM6 15V9h12v6M12 9V4M9 6h6"/>',
 box:'<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
 store:'<path d="M4 10h16l-1-5H5zM5 10v10h14V10M9 20v-5h6v5"/>',
 truck:'<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
 rig:'<path d="M12 2L7 21M12 2l5 19M8 15h8M9.5 9h5M4 21h16"/>',
 refinery:'<path d="M4 21V9h4v12M10 21V5h4v16M16 21v-8h4v8M3 21h18M6 6V4M12 3V1"/>'
};
const chain=document.querySelector(`[data-block-id="${oil?'dau-khi':power?'dien':'sugar'}-01"]`);
if(chain){
 const grid=chain.parentElement;grid.before(chain);chain.classList.add('value-chain-card');grid.style.gridTemplateColumns='1fr';
 const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 const old=[...chain.children].filter(e=>e!==heading);old.forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt=oil?'03/09/2026':power?'06/10/2026':'17/08/2026'});
 heading.after(power?powerChain():oil?oilChain():sugarChain());chain.append(make('div','chart-insight',power?'AI · cách đọc chuỗi: Mỗi nhóm nhà máy nhạy với một biến khác nhau. Nhiệt điện than nhạy giá than và mức huy động; điện khí/LNG nhạy giá khí và hợp đồng bao tiêu; thủy điện nhạy thủy văn (El Niño làm giảm nước về); năng lượng tái tạo nhạy giá FIT/khung giá chuyển tiếp và cắt giảm công suất. EVN là bên mua chính nên giá bán lẻ và tài chính EVN ảnh hưởng tốc độ thanh toán cho mọi nhà máy.':oil?'AI · cách đọc chuỗi: Theo từng nhánh dầu và khí để xác định biến lợi nhuận. Lọc dầu nhạy với crack và công suất vận hành; phân phối nhạy với giá vốn và tồn kho; khí nhạy với sản lượng tiêu thụ và điều khoản giá. Dịch vụ kỹ thuật hưởng tác động qua đầu tư và tiến độ dự án, thường có độ trễ so với giá dầu.':'AI · cách đọc chuỗi: Tách doanh nghiệp tự chủ vùng mía với doanh nghiệp phụ thuộc đường thô nhập để hiểu độ nhạy giá nguyên liệu. Đầu ra công nghiệp và bán lẻ có cơ chế giá khác nhau; đường nhập và HFCS làm thay đổi khả năng chuyển chi phí sang khách hàng.'));
 const legend=make('div','source-note','Mũi tên liền: '+(power?'luồng điện/nhiên liệu chính':'luồng hàng chính')+' · Mũi tên đứt: '+(power?'xây lắp và thiết bị hỗ trợ lưới, không phải dòng điện.':oil?'dịch vụ hỗ trợ; không phải bước biến đổi dầu thành khí.':'quan hệ thay thế tại khách hàng công nghiệp.')+(power?' Độ dày luồng theo tỷ trọng sản lượng ngày; sơ đồ không biểu thị quan hệ sở hữu.':' Sơ đồ không biểu thị tỷ trọng hay quan hệ sở hữu.'));heading.nextElementSibling.after(legend);
 if(power){const refs=make('div','source-note');refs.innerHTML='Đối chiếu doanh nghiệp: <a href="https://bctn.genco3.com/thong-tin-chung/" target="_blank" rel="noopener">PGV · EVNGENCO3</a> · <a href="https://www.pecc1.com.vn/c3/gioi-thieu/Thong-tin-chung-2-406.aspx" target="_blank" rel="noopener">TV1 · PECC1</a> · <a href="https://www.pecc3.com.vn/gioi-thieu/" target="_blank" rel="noopener">TV3 · PECC3</a> · <a href="https://gelex.vn/tin-tuc-su-kien/gelex-electric-gioi-thieu-he-sinh-thai-san-pham-xanh-ben-vung.html" target="_blank" rel="noopener">GEE · GELEX Electric</a>. GEE ở nhánh thiết bị, không đại diện cho công suất phát điện.';legend.after(refs)}
}
function drawChain(cfg){
 const {N,E,H=74,height=470,lanes,labels=[],pct=()=>null,width=()=>null}=cfg,B=Object.fromEntries(N.map(n=>[n[0],n]));
 const R=id=>B[id][1]+B[id][3],cy=id=>B[id][2]+H/2;
 const path=([a,b,,d])=>typeof d==='function'?d(R,cy,B):d||(Math.abs(cy(a)-cy(b))<2?`M${R(a)} ${cy(a)} H${B[b][1]}`:`M${R(a)} ${cy(a)} C${(R(a)+B[b][1])/2} ${cy(a)},${(R(a)+B[b][1])/2} ${cy(b)},${B[b][1]} ${cy(b)}`);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,colors=new Set(E.map(e=>e[2]));
 const edges=E.map((e,i)=>{const[a,b,c,,sup]=e,d=path(e),sw=width(a,b);return `<g class="vc-edge" data-a="${a}" data-b="${b}"><path d="${d}" class="edge-base" stroke="${c}"${sw?` style="stroke-width:${sw}px"`:''}/><path id="vce${i}" d="${d}" class="edge-flow${sup?' support':''}" stroke="${c}" marker-end="url(#vca-${c.slice(1)})"/>${reduce||sup?'':`<circle r="3.6" fill="${c}"><animateMotion dur="${2.4+i%4*.35}s" repeatCount="indefinite" begin="${(i*.37)%2}s"><mpath href="#vce${i}"/></animateMotion></circle>`}</g>`}).join('');
 const markers=[...colors].map(c=>`<marker id="vca-${c.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L10 5L0 9Z" fill="${c}"/></marker>`).join('');
 const nodes=N.map(([id,x,y,w,c,ic,title,...sub])=>`<g class="vc-node" data-id="${id}" tabindex="0"><rect class="card" x="${x}" y="${y}" width="${w}" height="${H}" rx="12"/><rect x="${x}" y="${y+12}" width="4" height="${H-24}" rx="2" fill="${c}"/><circle cx="${x+30}" cy="${y+H/2}" r="17" fill="${c}"/><g class="ic" transform="translate(${x+18} ${y+H/2-12})">${VC_ICON[ic]}</g><text x="${x+56}" y="${y+(sub.length>1?24:sub.length?31:H/2+5)}" class="title">${title}</text>${sub.map((t,i)=>`<text x="${x+56}" y="${y+(sub.length>1?43:50)+i*16}" class="sub">${t}</text>`).join('')}${pct(id)!=null?`<rect x="${x+w-58}" y="${y-10}" width="52" height="20" rx="10" fill="${c}"/><text x="${x+w-32}" y="${y+4}" text-anchor="middle" class="vc-chip">${pct(id).toLocaleString('vi-VN',{maximumFractionDigits:1})}%</text>`:''}</g>`).join('');
 const lane=lanes.map(([t,x,w,bg,pill])=>`<rect class="chain-lane-bg" x="${x}" y="0" width="${w}" height="${height}" rx="16" fill="${bg}"/><rect x="${x+w/2-t.length*4.4-14}" y="14" width="${t.length*8.8+28}" height="24" rx="12" fill="${pill}"/><text x="${x+w/2}" y="30" text-anchor="middle" class="lane-pill">${t}</text>`).join('');
 const label=(x,y,t)=>`<rect class="edge-label-bg" x="${x-t.length*3.1-8}" y="${y-13}" width="${t.length*6.2+16}" height="19" rx="9.5"/><text x="${x}" y="${y}" text-anchor="middle" class="edge-label">${t}</text>`;
 const fig=make('div','value-chain-scroll');fig.tabIndex=0;fig.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 fig.innerHTML=`<svg class="vc2" data-fs-flow="1" viewBox="0 0 1170 ${height}" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">${cfg.title}</title><desc id="chain-desc">${cfg.desc}</desc><defs>${markers}</defs>${lane}${edges}${nodes}${labels.map(l=>label(...l)).join('')}</svg>${cfg.foot||''}`;
 // Hover or focus a stage to keep only its upstream and downstream links lit.
 const svg=fig.firstElementChild,all=[...svg.querySelectorAll('.vc-edge')];
 const lit=id=>{const on=new Set([id]),walk=(dir)=>{let grow=true;const seen=new Set([id]);while(grow){grow=false;all.forEach(e=>{const[f,t]=dir?[e.dataset.a,e.dataset.b]:[e.dataset.b,e.dataset.a];if(seen.has(f)&&!seen.has(t)){seen.add(t);grow=true}});}seen.forEach(x=>on.add(x))};walk(1);walk(0);svg.classList.add('focus');svg.querySelectorAll('.vc-node').forEach(n=>n.classList.toggle('on',on.has(n.dataset.id)));all.forEach(e=>e.classList.toggle('on',on.has(e.dataset.a)&&on.has(e.dataset.b)))};
 const clear=()=>{svg.classList.remove('focus');svg.querySelectorAll('.on').forEach(n=>n.classList.remove('on'))};
 let picked=null;const status=make('div','vc-status');status.hidden=true;fig.append(status);
 const pick=n=>{const id=picked===n?null:n;picked=id;svg.querySelectorAll('.vc-node').forEach(x=>x.classList.toggle('picked',x===id));
  const codes=id?[...new Set([...id.querySelectorAll('.sub')].flatMap(t=>t.textContent.match(/\b[A-Z][A-Z0-9]{2}\b/g)||[]))]:[],label=id?id.querySelector('.title').textContent:'';
  if(cfg.table){
   document.dispatchEvent(new CustomEvent('vc:select',{detail:id&&codes.length?{id:id.dataset.id,label,codes}:{}}));
   status.innerHTML=id&&codes.length?`Đã lọc bảng doanh nghiệp theo <b>${label}</b> (${codes.join(', ')}) <button type="button">Xem bảng →</button>`:'';
   status.querySelector('button')?.addEventListener('click',()=>{const t=document.querySelector(`[data-block-id="${cfg.table}"]`);const w=t?.closest('[hidden]');if(w)document.getElementById(w.getAttribute('aria-labelledby'))?.click();t?.scrollIntoView({behavior:'smooth',block:'start'})});
  }else status.innerHTML=id&&codes.length?`<b>${label}</b>: ${codes.map(c=>`<span class="pv-chip" data-code="${c}">${c}</span>`).join(' ')} <small>bấm mã để xem định giá và tín hiệu</small>`:'';
  status.hidden=!(id&&codes.length)};
 document.addEventListener('vc:select',e=>{if(!e.detail?.id&&picked){picked.classList.remove('picked');picked=null;status.hidden=true}});
 svg.querySelectorAll('.vc-node').forEach(n=>{n.addEventListener('click',()=>pick(n));n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(n)}});n.addEventListener('mouseenter',()=>lit(n.dataset.id));n.addEventListener('focus',()=>lit(n.dataset.id));n.addEventListener('mouseleave',clear);n.addEventListener('blur',clear)});
 if(cfg.legend){const lg=make('div','vc-legend');lg.innerHTML=cfg.legend.map(([c,t,dash])=>`<span><i style="background:${dash?`repeating-linear-gradient(90deg,${c} 0 4px,transparent 4px 7px)`:c}"></i>${t}</span>`).join('')+'<span>Rê chuột: xem luồng của khâu · bấm: '+(cfg.table?'lọc bảng doanh nghiệp':'xem các mã')+'</span>';fig.prepend(lg)}
 return fig;
}
function powerChain(){
 const C={coal:'#3d4653',gas:'#c98a00',hydro:'#2938A8',re:'#2a9fa3',dppa:'#861C52',grid:'#5a6682',build:'#b8801f'},H=74;
 const N=[
  ['coal',20,64,230,C.coal,'coal','Than','Nhập khẩu • trong nước'],
  ['gasfuel',20,166,230,C.gas,'gas','Khí • LNG','Mỏ trong nước • LNG nhập'],
  ['water',20,268,230,C.hydro,'water','Thủy năng','Thủy văn • El Niño'],
  ['sunwind',20,370,230,C.re,'sun','Gió • mặt trời','Bức xạ • tốc độ gió'],
  ['coalplant',318,64,262,C.coal,'factory','Nhiệt điện than','PPC • QTP • HND • BTP','POW • PGV'],
  ['gasplant',318,166,262,C.gas,'gas','Điện khí • LNG','POW • NT2 • PGV'],
  ['hydro',318,268,262,C.hydro,'dam','Thủy điện','REE • VSH • CHP','SBA • TMP • SHP'],
  ['re',318,370,262,C.re,'wind','Năng lượng tái tạo','GEG • HDG • TTA • PC1'],
  ['eptc',672,166,218,C.grid,'bolt','EVN / EPTC mua điện','NSMO điều độ • thị trường'],
  ['dppa',672,370,218,C.dppa,'direct','DPPA','Mua bán điện trực tiếp'],
  ['build',935,50,222,C.build,'tool','Xây lắp • thiết bị','TV1 • TV2 • TV3 (tư vấn)','PC1 • GEX • GEE'],
  ['grid',935,166,222,C.grid,'tower','Truyền tải • phân phối','NPT • EVN PCs'],
  ['customer',935,370,222,C.grid,'home','Khách hàng','Công nghiệp • hộ dân']
 ];
 const E=[
  ['coal','coalplant',C.coal],['gasfuel','gasplant',C.gas],['water','hydro',C.hydro],['sunwind','re',C.re],
  ...[['coalplant',C.coal,-18],['gasplant',C.gas,-6],['hydro',C.hydro,6],['re',C.re,18]].map(([id,c,o])=>[id,'eptc',c,(R,cy)=>`M${R(id)} ${cy(id)} C626 ${cy(id)},626 ${cy('eptc')+o},672 ${cy('eptc')+o}`]),
  ['re','dppa',C.dppa],['eptc','grid',C.grid],['dppa','customer',C.dppa],
  ['grid','customer',C.grid,`M1046 ${166+H} V370`],['build','grid',C.build,`M1046 ${50+H} V166`,true]
 ];
 const day=(src.vn_power_daily?.records||[]).filter(r=>r.output_mkwh>0).at(-1);
 const part=day&&{coalplant:day.coal,gasplant:(day.gas||0)+(day.oil||0),hydro:day.hydro,re:(day.wind||0)+(day.solar_farm||0)+(day.rooftop_solar||0)+(day.solar||0)};
 const tot=part&&Object.values(part).reduce((a,b)=>a+(b||0),0)+(day.imports||0)+(day.other||0),pct=id=>part&&part[id]!=null&&tot?part[id]/tot*100:null;
 return drawChain({N,E,H,pct,width:(a,b)=>b==='eptc'&&pct(a)!=null?(3+pct(a)*.32).toFixed(1):null,table:'dien-03',
  lanes:[['NHIÊN LIỆU & NƯỚC',0,270,'#eef3fb','#1D2678'],['PHÁT ĐIỆN',285,320,'#eefaf9','#2a9fa3'],['MUA ĐIỆN · LƯỚI · KHÁCH HÀNG',620,550,'#fbf6ea','#b8801f']],
  labels:[[781,150,'PPA • thị trường bán buôn'],[1046,318,'giá bán lẻ EVN'],[781,356,'hợp đồng kỳ hạn']],
  legend:[['#3d4653','Than'],['#c98a00','Khí • LNG'],['#2938A8','Thủy điện'],['#2a9fa3','Tái tạo'],['#861C52','DPPA'],['#5a6682','Điện lên lưới']],
  title:'Chuỗi giá trị ngành điện',desc:'Than, khí/LNG, thủy năng, gió và mặt trời đi vào bốn nhóm nhà máy; EVN/EPTC mua điện theo hợp đồng và thị trường, NSMO điều độ; NPT truyền tải, các tổng công ty điện lực phân phối tới khách hàng. DPPA cho phép bán trực tiếp; xây lắp và thiết bị hỗ trợ lưới.',
  foot:day?`<div class="vc-day">Độ dày luồng và chip % = tỷ trọng sản lượng ngày ${day.date.slice(8,10)}/${day.date.slice(5,7)}/${day.date.slice(0,4)} theo <a href="${src.vn_power_daily.source_url}" target="_blank" rel="noopener">bản tin EVN</a></div>`:''});
}
function sugarChain(){
 // Mía nội địa (xanh lá), đường thô nhập (xanh dương), đường thành phẩm nhập (tím), HFCS thay thế (vàng, nét đứt), đường bán ra (navy).
 const C={cane:'#2f8f4e',raw:'#2938A8',imp:'#861C52',hfcs:'#c98a00',out:'#1D2678'};
 const N=[
  ['cane',20,64,230,C.cane,'leaf','Vùng nguyên liệu mía','Nông dân / vùng liên kết'],
  ['raw',20,184,230,C.raw,'ship','Đường thô nhập khẩu'],
  ['refined',20,304,230,C.imp,'ship','Đường thành phẩm nhập'],
  ['hfcs',20,404,230,C.hfcs,'water','HFCS nhập khẩu','Chất tạo ngọt thay thế'],
  ['mill',318,64,262,C.cane,'factory','Ép mía • chế biến đường','SBT • QNS • SLS','LSS • KTS'],
  ['refinery',318,184,262,C.raw,'refinery','Tinh luyện đường thô'],
  ['product',672,124,218,C.out,'box','Đường RS / RE'],
  ['b2b',925,64,232,C.out,'factory','Khách hàng công nghiệp','Đồ uống • bánh kẹo • sữa'],
  ['b2c',925,214,232,C.out,'store','Bán lẻ / phân phối','Người tiêu dùng']
 ];
 const E=[
  ['cane','mill',C.cane],['raw','refinery',C.raw],['mill','product',C.cane],['refinery','product',C.raw],
  ['product','b2b',C.out],['product','b2c',C.out],
  ['refined','b2c',C.imp,(R,cy)=>`M${R('refined')} ${cy('refined')} H1046 V${214+74}`],
  ['hfcs','b2b',C.hfcs,(R,cy)=>`M${R('hfcs')} ${cy('hfcs')} H1166 V${cy('b2b')} H1157`,true]
 ];
 return drawChain({N,E,height:500,
  lanes:[['ĐẦU VÀO / THƯỢNG NGUỒN',0,270,'#eef3fb','#1D2678'],['CHẾ BIẾN / TRUNG NGUỒN',285,320,'#eefaf9','#2a9fa3'],['ĐẦU RA / KHÁCH HÀNG',620,550,'#fbf6ea','#b8801f']],
  labels:[[640,341,'cạnh tranh trực tiếp với đường trong nước'],[640,441,'thay thế tại khách hàng công nghiệp']],
  legend:[['#2f8f4e','Mía trong nước'],['#2938A8','Đường thô nhập'],['#861C52','Đường thành phẩm nhập'],['#c98a00','HFCS thay thế',true],['#1D2678','Đường bán ra']],
  title:'Chuỗi giá trị ngành đường',desc:'Mía nội địa và đường thô nhập đi qua chế biến, cung cấp đường cho khách hàng công nghiệp và bán lẻ. Đường nhập và HFCS tạo cạnh tranh.'});
}
function oilChain(){
 // Khí (vàng), dầu thô (navy), sản phẩm lọc dầu (tím), dịch vụ hỗ trợ (xám, nét đứt).
 const C={gas:'#c98a00',crude:'#1D2678',prod:'#861C52',svc:'#5a6682'};
 const N=[
  ['importgas',20,64,230,C.gas,'ship','LNG nhập khẩu'],
  ['domestic',20,194,230,C.crude,'rig','Khai thác trong nước','PVN / PVEP, nhà thầu'],
  ['importoil',20,324,230,C.crude,'ship','Dầu thô nhập khẩu'],
  ['gas',318,64,262,C.gas,'gas','Thu gom • xử lý • tái hóa khí','GAS và hạ tầng khí'],
  ['refine',318,264,262,C.crude,'refinery','Nhà máy lọc dầu','BSR • Nghi Sơn'],
  ['service',318,404,262,C.svc,'tool','Dịch vụ hỗ trợ khai thác','PVD • PVS • PVB'],
  ['power',672,64,218,C.gas,'bolt','Điện khí • đạm','Khách hàng công nghiệp'],
  ['retail',672,264,218,C.prod,'store','Phân phối xăng dầu','PLX • OIL'],
  ['transport',672,404,218,C.svc,'truck','Vận tải dầu / sản phẩm','PVT • PVP'],
  ['use',935,264,222,C.prod,'home','Vận tải • sản xuất','Người tiêu dùng']
 ];
 const E=[
  ['importgas','gas',C.gas],['domestic','gas',C.gas],['domestic','refine',C.crude],['importoil','refine',C.crude],
  ['gas','power',C.gas],['refine','retail',C.prod],['retail','use',C.prod],
  ['service','domestic',C.svc,(R,cy)=>`M318 ${cy('service')} H284 V${cy('domestic')+14} H250`,true],
  ['transport','refine',C.svc,(R,cy)=>`M672 ${cy('transport')} H626 V${cy('refine')+18} H580`,true]
 ];
 return drawChain({N,E,height:500,
  lanes:[['ĐẦU VÀO / THƯỢNG NGUỒN',0,270,'#eef3fb','#1D2678'],['CHẾ BIẾN / TRUNG NGUỒN',285,320,'#eefaf9','#2a9fa3'],['ĐẦU RA / KHÁCH HÀNG',620,550,'#fbf6ea','#b8801f']],
  legend:[['#c98a00','Khí • LNG'],['#1D2678','Dầu thô'],['#861C52','Xăng dầu thành phẩm'],['#5a6682','Dịch vụ hỗ trợ',true]],
  title:'Chuỗi giá trị ngành dầu khí',desc:'Dầu và khí đi theo hai nhánh chế biến riêng. Dịch vụ kỹ thuật hỗ trợ khai thác; vận tải hỗ trợ luân chuyển dầu và sản phẩm.'});
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
