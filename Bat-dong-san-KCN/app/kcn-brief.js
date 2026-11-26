/* BĐS KCN · chạy lúc nạp trang (trước research-layout.js và stock-dom.js), 25/11/2026:
   1) Bốn ô số cho "Bản tin dữ liệu" đầu Tổng quan, lấy từ workbook KCN (window.KCN_MARKET, quy tắc window.KcnInsights) và FDI tháng
      (window.REALESTATE_PUBLIC): lấp đầy miền Bắc, miền Nam (C&W), hấp thụ đất cộng dồn (CBRE), FDI chế biến chế tạo cấp mới.
   2) Sơ đồ chuỗi giá trị khu công nghiệp trong thẻ kcn-01, vẽ bằng ValueChain.draw (app/value-chain.js) như trang Điện, Phân bón.
   Thiếu số thì để "—", không ước tính. */
(() => {
'use strict';
if(document.body.dataset.sector!=='industrial')return;
const D=window.KCN_MARKET,K=window.KcnInsights;
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const QL=p=>String(p||'').replace(/^(\d{4})Q([1-4])$/,'Q$2/$1').replace(/^(\d{4})M(\d+)$/,'$2T/$1').replace(/^(\d{4})FY$/,'Năm $1');
const sg=v=>(v>0?'+':v<0?'−':'')+nf(Math.abs(v),1);
// Mỗi thẻ ghi kỳ, nguồn và phạm vi ngay trên thẻ: lấp đầy theo C&W, hấp thụ theo CBRE (thị trường cấp 1), FDI theo Cục ĐTNN (toàn quốc).
// Bốn số khác nguồn, khác kỳ: đọc riêng từng thẻ, không so hay cộng giữa các thẻ.
function setKpi(i,label,value,delta,sub,scope){const k=document.querySelectorAll('#pane-mt1 .kpis .kpi')[i];if(!k)return;k.querySelector('.label').textContent=label;k.querySelector('.value').textContent=value;k.querySelector('.delta').textContent=delta||'';k.querySelector('.sub').textContent=sub||'';
 let sc=k.querySelector('.kpi-scope');if(!sc){sc=make('div','kpi-scope');k.append(sc)}sc.textContent=scope||''}
if(D&&K){
 ['North','South'].forEach((r,i)=>{const l=K.latest(D,r,'occ');if(!l)return;const c=K.change(D,r,'occ',K.kOf(K.qk(l.period)-4),l.period);
  setKpi(i,'Lấp đầy đất KCN miền '+(r==='North'?'Bắc':'Nam'),nf(l.occ*100,1)+'%',c&&c.ok?sg(c.abs*100)+' điểm % so cùng kỳ':'',`${QL(l.period)} · Cushman & Wakefield`,`Phạm vi: KCN trong khảo sát C&W miền ${r==='North'?'Bắc':'Nam'}, địa giới sau sáp nhập tỉnh`)});
 const ab=D.absorption.filter(a=>a.region==='Vietnam'&&/M\d+$/.test(a.period)).sort((a,b)=>a.period<b.period?-1:1).at(-1);
 if(ab){const y=/([+-]?\d+)%\s*YoY/.exec(ab.note||'');setKpi(2,'Hấp thụ đất KCN lũy kế',nf(ab.value,0)+' ha',y?sg(+y[1])+'% so cùng kỳ (CBRE công bố)':'',`${QL(ab.period)} (lũy kế) · CBRE qua Vietcap`,'Phạm vi: thị trường cấp 1 hai miền theo CBRE; không gồm toàn bộ KCN cả nước')}
}
const mfg=(window.REALESTATE_PUBLIC?.blocks?.macro?.series?.fdi_mfg_ytd?.records)||[];
if(mfg.length){const l=mfg.at(-1),p=mfg.find(r=>r.date===String(+l.date.slice(0,4)-1)+l.date.slice(4));setKpi(3,'FDI đăng ký vào chế biến, chế tạo',nf(l.value/1000,2)+' tỷ USD',p&&p.value?sg((l.value/p.value-1)*100)+'% so cùng kỳ':'',`${+l.date.slice(5,7)}T/${l.date.slice(0,4)} (lũy kế) · Cục Đầu tư nước ngoài`,'Phạm vi: toàn quốc, mọi dự án chế biến chế tạo; không riêng dự án trong KCN')}
{const g=document.querySelector('#pane-mt1 .kpis');if(g&&!g.previousElementSibling?.classList.contains('kpi-note')){const n=make('p','kpi-note','Bốn số từ ba nguồn, khác kỳ và phạm vi: đọc riêng từng thẻ. Số lũy kế khác kỳ chỉ là tín hiệu, không so trực tiếp với nhau.');g.before(n)}}

// ---------- Sơ đồ "Đất, vốn và khách thuê đi qua những ai?" (26/11/2026) ----------
// Các bên tham gia nối bằng ba lớp có thể bật/tắt như sơ đồ DPPA của trang Điện: luồng đất & hạ tầng, luồng hợp đồng & thanh toán,
// luồng pháp lý & phê duyệt. Bấm một bên: việc họ làm, ai trả tiền cho ai, điều kiện mở bước tiếp theo, mã niêm yết (bấm mã mở hồ sơ),
// link xuống Quỹ đất. Nội dung là cơ chế chung của ngành; điều khoản cụ thể theo hợp đồng và BCTC từng doanh nghiệp.
const chain=document.querySelector('[data-block-id="kcn-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');heading.textContent='Các bên trong chuỗi giá trị khu công nghiệp';
 [...chain.children].filter(e=>e!==heading).forEach(e=>e.remove());
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const L={land:['Đất & hạ tầng','#2938A8'],money:['Hợp đồng & thanh toán','#16898c'],legal:['Pháp lý & phê duyệt','#a8701a']};
 const W=250,H=66;
 // id, x, y, tiêu đề, dòng phụ, mã niêm yết, việc họ làm, điều kiện mở bước tiếp theo
 const N=[
  ['gov',165,24,'UBND tỉnh · Thủ tướng','Chủ trương, giao và cho thuê đất',[],'Chấp thuận chủ trương đầu tư KCN theo quy hoạch, thu hồi đất, duyệt phương án bồi thường, quyết định cho chủ đầu tư thuê đất.','Có quy hoạch và chủ trương đầu tư thì mới thu hồi, cho thuê đất được.'],
  ['bql',890,24,'Ban quản lý KCN','Cấp phép dự án thuê đất',[],'Cấp giấy chứng nhận đăng ký đầu tư cho dự án đặt trong KCN, quản lý quy hoạch chi tiết và môi trường KCN.','Khách thuê có giấy chứng nhận đăng ký đầu tư thì mới xây nhà máy.'],
  ['owner',20,150,'Người đang sử dụng đất','Hộ dân, đất nông nghiệp, đất cao su',['PHR','GVR'],'Giao lại đất khi Nhà nước thu hồi, nhận bồi thường và hỗ trợ; doanh nghiệp cao su chuyển một phần vườn cây sang KCN.','Nhận đủ bồi thường và bàn giao mặt bằng thì đất mới thành đất sạch.'],
  ['bank',20,250,'Ngân hàng','Vốn vay xây hạ tầng',[],'Cho chủ đầu tư vay để bồi thường và xây hạ tầng.','Giải ngân theo tiến độ dự án và tài sản bảo đảm.'],
  ['epc',20,350,'Nhà thầu hạ tầng','San lấp, đường, cấp thoát nước',[],'Thi công hạ tầng kỹ thuật: san lấp, giao thông nội khu, trạm xử lý nước thải, cấp điện.','Hạ tầng nghiệm thu thì đất mới bàn giao được cho khách thuê.'],
  ['utilin',20,450,'EVN · nhà cung cấp nước','Điện, nước đầu vào',[],'Bán điện, nước sạch cho đơn vị phân phối trong KCN.','Công suất trạm điện, nguồn nước đủ cho nhu cầu khách thuê.'],
  ['dev',310,250,'Chủ đầu tư hạ tầng KCN','KBC • IDC • SZC • LHG • NTC • D2D • TIP • VGC • BCM • SIP',['KBC','IDC','SZC','LHG','NTC','D2D','TIP','VGC','BCM','SIP'],'Thuê đất của Nhà nước, bồi thường, xây hạ tầng rồi cho thuê lại đất có hạ tầng, xây nhà xưởng, cung cấp tiện ích.','Có đất sạch và hạ tầng thì mới ký và bàn giao cho khách thuê; quỹ đất còn lại quyết định doanh thu các năm sau.'],
  ['land',600,150,'Đất có hạ tầng','Thuê lại đến hết thời hạn dự án',['KBC','IDC','SZC','LHG','NTC','D2D','TIP','VGC','BCM','SIP'],'Sản phẩm chính: quyền thuê lại đất trong KCN, thường thu phần lớn tiền một lần cho cả thời hạn còn lại.','Ký hợp đồng thuê lại → thu tiền theo tiến độ → bàn giao đất → ghi nhận doanh thu theo chính sách kế toán của từng doanh nghiệp.'],
  ['rbf',600,250,'Nhà xưởng, kho xây sẵn','Thuê theo tháng, hợp đồng vài năm',['SIP','IDC','LHG'],'Chủ đầu tư xây sẵn nhà xưởng, kho để khách thuê ngắn hạn hơn, không phải tự xây.','Tỷ lệ lấp đầy nhà xưởng và giá thuê theo m² mỗi tháng.'],
  ['util',600,350,'Điện, nước, xử lý nước thải','Phí dịch vụ và phí quản lý hằng tháng',['SIP','IDC'],'Phân phối điện, nước, xử lý nước thải và thu phí quản lý, bảo dưỡng hạ tầng trong KCN.','Doanh thu tăng theo số nhà máy đã vận hành, không theo diện tích ký mới.'],
  ['urban',600,450,'Đô thị, nhà ở quanh KCN','Bán đất nền, nhà ở',['BCM','KBC'],'Phát triển khu đô thị, nhà ở cho chuyên gia và người lao động quanh KCN.','Pháp lý dự án nhà ở và sức mua của thị trường nhà ở.'],
  ['tenant',890,200,'Nhà máy FDI, doanh nghiệp trong nước','Điện tử • cơ khí • dệt may • logistics',[],'Thuê đất hoặc nhà xưởng, xây và vận hành nhà máy; trả tiền thuê, phí quản lý, tiền điện nước.','Có giấy chứng nhận đăng ký đầu tư và được bàn giao đất thì mới xây nhà máy.'],
  ['buyer',890,450,'Người mua nhà, nhà đầu tư','Chuyên gia, người lao động',[],'Mua nhà ở, đất nền trong khu đô thị quanh KCN.','—']
 ];
 const E=[
  ['land','owner','dev','Đất đã giải phóng mặt bằng'],['land','epc','dev','Hạ tầng hoàn thành'],['land','dev','land','Đất sạch có hạ tầng'],['land','dev','rbf','Nhà xưởng xây sẵn'],['land','utilin','util','Điện, nước đầu vào'],
  ['land','land','tenant','Bàn giao đất'],['land','rbf','tenant','Bàn giao nhà xưởng'],['land','util','tenant','Cấp điện, nước'],['land','dev','urban','Đất đô thị'],['land','urban','buyer','Bàn giao nhà'],
  ['money','tenant','land','Tiền thuê lại đất (thường trả trước phần lớn) và phí quản lý hằng năm'],['money','tenant','rbf','Tiền thuê nhà xưởng hằng tháng'],['money','tenant','util','Phí điện, nước, xử lý nước thải'],
  ['money','land','dev','Doanh thu cho thuê đất'],['money','dev','owner','Tiền bồi thường, hỗ trợ'],['money','dev','gov','Tiền thuê đất trả Nhà nước'],['money','bank','dev','Vốn vay'],['money','dev','epc','Thanh toán thi công'],
  ['money','util','utilin','Mua điện, nước'],['money','buyer','urban','Tiền mua nhà']
 ];
 const LEG=[['legal','gov','owner','Thu hồi đất, phương án bồi thường'],['legal','gov','dev','Chủ trương đầu tư, quyết định cho thuê đất'],['legal','bql','tenant','Giấy chứng nhận đăng ký đầu tư'],['legal','gov','urban','Phê duyệt dự án nhà ở']];
 const all=E.concat(LEG),B=Object.fromEntries(N.map(n=>[n[0],n]));
 const OFF={land:-9,money:0,legal:9};
 const path=([k,a,b])=>{const A=B[a],T=B[b],o=OFF[k];const acx=A[1]+W/2,tcx=T[1]+W/2;
  if(Math.abs(acx-tcx)<W*0.6){const down=T[2]>A[2];const x1=acx+o*2,x2=tcx+o*2,y1=down?A[2]+H:A[2],y2=down?T[2]:T[2]+H;return `M${x1} ${y1} C${x1} ${(y1+y2)/2},${x2} ${(y1+y2)/2},${x2} ${y2}`}
  const right=T[1]>A[1],x1=right?A[1]+W:A[1],x2=right?T[1]:T[1]+W,y1=A[2]+H/2+o,y2=T[2]+H/2+o,m=(x1+x2)/2;return `M${x1} ${y1} C${m} ${y1},${m} ${y2},${x2} ${y2}`};
 const defs=Object.entries(L).map(([k,[,c]])=>`<marker id="kf-a-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L10 5L0 9Z" fill="${c}"/></marker>`).join('');
 const edges=all.map(e=>`<g class="kf-e kf-${e[0]}" data-k="${e[0]}" data-a="${e[1]}" data-b="${e[2]}" tabindex="0" data-tip="${esc(L[e[0]][0]+': '+e[3])}"><path class="kf-hit" d="${path(e)}"/><path class="kf-line" d="${path(e)}" stroke="${L[e[0]][1]}" marker-end="url(#kf-a-${e[0]})"/></g>`).join('');
 const nodes=N.map(([id,x,y,t,s,codes])=>`<g class="kf-n${id==='dev'?' kf-key':''}" data-id="${id}" tabindex="0" role="button" aria-label="${esc(t)}"><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="12"/><text x="${x+16}" y="${y+27}" class="kf-t">${esc(t)}</text><text x="${x+16}" y="${y+47}" class="kf-s"${s.length*6.1>W-28?` textLength="${W-28}" lengthAdjust="spacingAndGlyphs"`:''}>${esc(s)}</text>${codes.length&&id!=='dev'&&id!=='land'?`<text x="${x+W-12}" y="${y+16}" text-anchor="end" class="kf-c">${codes.join(' · ')}</text>`:''}</g>`).join('');
 const fig=make('div','kf-wrap');
 fig.innerHTML=`<div class="kf-ctl" role="group" aria-label="Bật/tắt lớp luồng">${Object.entries(L).map(([k,[t,c]])=>`<button type="button" data-k="${k}" aria-pressed="true"><i style="background:${c}"></i>${t}</button>`).join('')}<span class="kf-hint">Rê chuột vào đường nối xem nội dung · bấm một bên để xem chi tiết</span></div>
  <div class="value-chain-scroll" tabindex="0" aria-label="Sơ đồ các bên; cuộn ngang trên màn hình nhỏ"><svg class="kf-svg" viewBox="0 0 1160 540" role="img" aria-labelledby="kf-title kf-desc"><title id="kf-title">Các bên trong chuỗi giá trị khu công nghiệp</title><desc id="kf-desc">Đất đi từ người sử dụng đất qua chủ đầu tư hạ tầng thành đất có hạ tầng, nhà xưởng và tiện ích cho khách thuê; tiền đi ngược lại; Nhà nước và Ban quản lý KCN phê duyệt ở các mốc.</desc><defs>${defs}</defs>${edges}${nodes}</svg></div>
  <div class="kf-tip" role="tooltip" hidden></div><div class="kf-detail" aria-live="polite"></div>`;
 heading.after(fig);
 fig.after(make('div','pw-src','Nguồn: Luật Đầu tư 2020, Luật Đất đai 2024, Nghị định 35/2022/NĐ-CP về quản lý KCN; báo cáo thường niên doanh nghiệp'));
 const svg=fig.querySelector('svg'),tip=fig.querySelector('.kf-tip'),det=fig.querySelector('.kf-detail');
 fig.querySelectorAll('.kf-ctl button').forEach(b=>b.addEventListener('click',()=>{b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));const on=[...fig.querySelectorAll('.kf-ctl button[aria-pressed="true"]')].map(x=>x.dataset.k);fig.querySelectorAll('.kf-e').forEach(e=>e.classList.toggle('kf-off',!on.includes(e.dataset.k)))}));
 const clear=()=>{svg.classList.remove('kf-focus');svg.querySelectorAll('.on').forEach(n=>n.classList.remove('on'));tip.hidden=true};
 const focusNode=id=>{clear();svg.classList.add('kf-focus');svg.querySelector(`.kf-n[data-id="${id}"]`).classList.add('on');svg.querySelectorAll('.kf-e:not(.kf-off)').forEach(e=>{if(e.dataset.a===id||e.dataset.b===id){e.classList.add('on');svg.querySelector(`.kf-n[data-id="${e.dataset.a===id?e.dataset.b:e.dataset.a}"]`).classList.add('on')}})};
 const showTip=(t,x,y)=>{const r=fig.getBoundingClientRect();tip.textContent=t;tip.hidden=false;tip.style.left=Math.max(4,Math.min(x-r.left+12,r.width-tip.offsetWidth-4))+'px';tip.style.top=(y-r.top+14)+'px'};
 svg.querySelectorAll('.kf-e').forEach(e=>{e.addEventListener('mouseenter',v=>{if(e.classList.contains('kf-off'))return;clear();svg.classList.add('kf-focus');e.classList.add('on');[e.dataset.a,e.dataset.b].forEach(n=>svg.querySelector(`.kf-n[data-id="${n}"]`).classList.add('on'));showTip(e.dataset.tip,v.clientX,v.clientY)});e.addEventListener('mousemove',v=>{if(!e.classList.contains('kf-off'))showTip(e.dataset.tip,v.clientX,v.clientY)});e.addEventListener('mouseleave',clear);e.addEventListener('focus',()=>{const b=e.getBoundingClientRect();showTip(e.dataset.tip,b.left+b.width/2,b.top+b.height/2)});e.addEventListener('blur',clear)});
 const name=id=>B[id][3];
 const detail=id=>{const [, , ,t,s,codes,does,next]=B[id];
  const pays=E.filter(e=>e[0]==='money'&&(e[1]===id||e[2]===id)).map(e=>`<li><b>${esc(name(e[1]))}</b> → <b>${esc(name(e[2]))}</b>: ${esc(e[3])}</li>`).join('');
  const legal=LEG.filter(e=>e[1]===id||e[2]===id).map(e=>`<li>${esc(name(e[1]))} → ${esc(name(e[2]))}: ${esc(e[3])}</li>`).join('');
  det.innerHTML=`<div class="kf-d-h"><b>${esc(t)}</b><span>${esc(s)}</span><button type="button" class="kf-x" aria-label="Đóng">✕</button></div><div class="kf-d-g">
   <div><h4>Việc họ làm</h4><p>${esc(does)}</p></div>
   <div><h4>Ai trả tiền cho ai</h4>${pays?`<ul>${pays}</ul>`:'<p>Không có dòng tiền trực tiếp trên sơ đồ.</p>'}</div>
   <div><h4>Điều kiện mở bước tiếp theo</h4><p>${esc(next)}</p>${legal?`<ul class="kf-legal">${legal}</ul>`:''}</div></div>
   ${codes.length?`<div class="kf-d-codes"><span>Doanh nghiệp niêm yết (bấm mã xem hồ sơ):</span> ${codes.map(c=>`<button type="button" class="pv-chip" data-code="${c}">${c}</button>`).join(' ')}${['dev','land','owner'].includes(id)?` <a class="ov-more" href="?kcn=landbank#mt2" data-kcn-go="landbank">Quỹ đất từng doanh nghiệp →</a>`:''}</div>`:''}`;
  det.querySelector('.kf-x').onclick=()=>{det.innerHTML='';svg.querySelectorAll('.picked').forEach(x=>x.classList.remove('picked'))}};
 svg.querySelectorAll('.kf-n').forEach(n=>{const go=()=>{svg.querySelectorAll('.picked').forEach(x=>x.classList.remove('picked'));n.classList.add('picked');detail(n.dataset.id)};n.addEventListener('click',go);n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});n.addEventListener('mouseenter',()=>focusNode(n.dataset.id));n.addEventListener('focus',()=>focusNode(n.dataset.id));n.addEventListener('mouseleave',clear);n.addEventListener('blur',clear)});
 detail('dev');svg.querySelector('.kf-n[data-id="dev"]').classList.add('picked');
}
})();
