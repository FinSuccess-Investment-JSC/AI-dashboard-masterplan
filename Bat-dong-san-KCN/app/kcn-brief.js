/* BĐS KCN · chạy lúc nạp trang (trước research-layout.js và stock-dom.js), 25/11/2026:
   1) Bốn ô số cho "Bản tin dữ liệu" đầu Tổng quan, lấy từ workbook KCN (window.KCN_MARKET, quy tắc window.KcnInsights) và FDI tháng
      (window.REALESTATE_PUBLIC): lấp đầy miền Bắc, miền Nam (C&W), hấp thụ đất cộng dồn (CBRE), FDI chế biến chế tạo cấp mới.
   2) Sơ đồ chuỗi giá trị khu công nghiệp trong thẻ kcn-01 (cùng dạng thẻ value-chain-card của các ngành).
   Thiếu số thì để "—", không ước tính. */
(() => {
'use strict';
if(document.body.dataset.sector!=='industrial')return;
const D=window.KCN_MARKET,K=window.KcnInsights;
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const QL=p=>String(p||'').replace(/^(\d{4})Q([1-4])$/,'Q$2/$1').replace(/^(\d{4})M(\d+)$/,'$2T/$1').replace(/^(\d{4})FY$/,'Năm $1');
const sg=v=>(v>0?'+':v<0?'−':'')+nf(Math.abs(v),1);
function setKpi(i,label,value,delta,sub){const k=document.querySelectorAll('#pane-mt1 .kpis .kpi')[i];if(!k)return;k.querySelector('.label').textContent=label;k.querySelector('.value').textContent=value;k.querySelector('.delta').textContent=delta||'';k.querySelector('.sub').textContent=sub||''}
if(D&&K){
 ['North','South'].forEach((r,i)=>{const l=K.latest(D,r,'occ');if(!l)return;const c=K.change(D,r,'occ',K.kOf(K.qk(l.period)-4),l.period);
  setKpi(i,'Lấp đầy đất KCN miền '+(r==='North'?'Bắc':'Nam'),nf(l.occ*100,1)+'%',c&&c.ok?sg(c.abs*100)+' điểm % so cùng kỳ':'',`C&W · ${QL(l.period)}`)});
 const ab=D.absorption.filter(a=>a.region==='Vietnam'&&/M\d+$/.test(a.period)).sort((a,b)=>a.period<b.period?-1:1).at(-1);
 if(ab){const y=/([+-]?\d+)%\s*YoY/.exec(ab.note||'');setKpi(2,'Hấp thụ đất KCN cộng dồn',nf(ab.value,0)+' ha',y?sg(+y[1])+'% so cùng kỳ (nguồn công bố)':'',`CBRE Tier-1 · ${QL(ab.period)}`)}
}
const mfg=(window.REALESTATE_PUBLIC?.blocks?.macro?.series?.fdi_mfg_ytd?.records)||[];
if(mfg.length){const l=mfg.at(-1),p=mfg.find(r=>r.date===String(+l.date.slice(0,4)-1)+l.date.slice(4));setKpi(3,'FDI đăng ký vào chế biến, chế tạo',nf(l.value/1000,2)+' tỷ USD',p&&p.value?sg((l.value/p.value-1)*100)+'% so cùng kỳ':'',`Cục ĐTNN · ${+l.date.slice(5,7)}T/${l.date.slice(0,4)}`)}

// ---------- Sơ đồ chuỗi giá trị ----------
const chain=document.querySelector('[data-block-id="kcn-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='08/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['land',25,40,['Quỹ đất · đền bù','Đất nông nghiệp, đất cao su']],['legal',25,135,['Pháp lý khu công nghiệp','Quyết định thành lập · quy hoạch']],['bank',25,230,['Vốn vay ngân hàng','Dư nợ KCN/KCX ngoài room BĐS']],['prepay',25,325,['Tiền thuê trả trước','Khách trả một lần · ghi nhận dần']],
  ['ip',315,88,['Hạ tầng khu công nghiệp','KBC • IDC • BCM • SZC']],['ip2',315,230,['Hạ tầng KCN (tiếp)','SIP • VGC • LHG']],['factory',315,372,['Nhà xưởng, kho xây sẵn','Cho thuê theo năm']],
  ['tenant',655,135,['Khách thuê FDI','Chế biến chế tạo · điện tử']],['local',655,300,['Doanh nghiệp trong nước','Logistics · sản xuất']],['build',925,88,['Nhà thầu hạ tầng','San lấp • đường • điện nước']],['utility',925,300,['Dịch vụ tiện ích','Điện, nước, xử lý nước thải']]
 ];
 const edges=[['land','ip'],['land','ip2'],['legal','ip'],['legal','ip2'],['bank','ip2'],['prepay','ip'],['ip','tenant'],['ip2','tenant'],['ip2','local'],['factory','tenant'],['factory','local'],['build','ip',true],['utility','ip2',true]];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b],forward=Bn[1]>A[1],x1=A[1]+(forward?w:0),x2=Bn[1]+(forward?0:w),y1=A[2]+h/2,y2=Bn[2]+h/2,mid=(x1+x2)/2;const custom={'build:ip':'M925 120 H900 V105 H535','utility:ip2':'M925 332 H900 V262 H535'};const route=custom[a+':'+b]||`M${x1} ${y1} H${mid} V${y2} H${x2}`;return `<path d="${route}" class="chain-edge ${dashed?'support':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1170 505" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành bất động sản khu công nghiệp</title><desc id="chain-desc">Quỹ đất, pháp lý, vốn vay và tiền thuê trả trước đi vào chủ đầu tư hạ tầng khu công nghiệp; đất và nhà xưởng cho khách thuê FDI và doanh nghiệp trong nước thuê.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2938A8"/></marker></defs>${['ĐẤT · PHÁP LÝ · VỐN','PHÁT TRIỂN · VẬN HÀNH','KHÁCH HÀNG · HỖ TRỢ'].map((t,i)=>`<rect x="${[0,290,640][i]}" y="0" width="${[275,335,525][i]}" height="500" rx="12" fill="${['#edf5fc','#f0f7ef','#fff4e7'][i]}"/><text x="${[137,457,902][i]}" y="33" text-anchor="middle" class="chain-lane">${t}</text>`).join('')}${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: doanh thu khu công nghiệp đi theo diện tích bàn giao, không theo hợp đồng ký. Ba biến theo thứ tự: quỹ đất đã đền bù (có đất sạch để giao không), FDI chế biến chế tạo (có khách không), rồi giá thuê và lấp đầy từng vùng (cung mới có làm chậm hấp thụ không).'));
 figure.after(make('div','source-note','Mũi tên liền: dòng đất, vốn và sản phẩm · Mũi tên đứt: dịch vụ hỗ trợ. Sơ đồ không biểu thị tỷ trọng hay quan hệ sở hữu.'));
}
})();
