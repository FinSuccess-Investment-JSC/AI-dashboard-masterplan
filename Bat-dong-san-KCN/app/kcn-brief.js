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
function setKpi(i,label,value,delta,sub){const k=document.querySelectorAll('#pane-mt1 .kpis .kpi')[i];if(!k)return;k.querySelector('.label').textContent=label;k.querySelector('.value').textContent=value;k.querySelector('.delta').textContent=delta||'';k.querySelector('.sub').textContent=sub||''}
if(D&&K){
 ['North','South'].forEach((r,i)=>{const l=K.latest(D,r,'occ');if(!l)return;const c=K.change(D,r,'occ',K.kOf(K.qk(l.period)-4),l.period);
  setKpi(i,'Lấp đầy đất KCN miền '+(r==='North'?'Bắc':'Nam'),nf(l.occ*100,1)+'%',c&&c.ok?sg(c.abs*100)+' điểm % so cùng kỳ':'',`C&W · ${QL(l.period)}`)});
 const ab=D.absorption.filter(a=>a.region==='Vietnam'&&/M\d+$/.test(a.period)).sort((a,b)=>a.period<b.period?-1:1).at(-1);
 if(ab){const y=/([+-]?\d+)%\s*YoY/.exec(ab.note||'');setKpi(2,'Hấp thụ đất KCN cộng dồn',nf(ab.value,0)+' ha',y?sg(+y[1])+'% so cùng kỳ (nguồn công bố)':'',`CBRE Tier-1 · ${QL(ab.period)}`)}
}
const mfg=(window.REALESTATE_PUBLIC?.blocks?.macro?.series?.fdi_mfg_ytd?.records)||[];
if(mfg.length){const l=mfg.at(-1),p=mfg.find(r=>r.date===String(+l.date.slice(0,4)-1)+l.date.slice(4));setKpi(3,'FDI đăng ký vào chế biến, chế tạo',nf(l.value/1000,2)+' tỷ USD',p&&p.value?sg((l.value/p.value-1)*100)+'% so cùng kỳ':'',`Cục ĐTNN · ${+l.date.slice(5,7)}T/${l.date.slice(0,4)}`)}

// ---------- Sơ đồ chuỗi giá trị (ValueChain của trang Điện, 26/11/2026) ----------
// Bốn cột theo dòng tiền và sản phẩm: Đầu vào → Chủ đầu tư → Sản phẩm cho thuê/bán → Khách hàng. Mỗi dòng sản phẩm một màu;
// rê chuột sáng cả luồng của khâu, bấm khâu xem các mã niêm yết. Không biểu thị tỷ trọng hay quan hệ sở hữu.
const chain=document.querySelector('[data-block-id="kcn-01"]');
if(chain&&window.ValueChain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>e.remove());
 const K={land:'#2938A8',rbf:'#2a9fa3',util:'#c98a00',urban:'#861C52'},H=74;
 const c1=20,w1=215,c2=305,w2=235,c3=610,w3=235,c4=915,w4=235,y=[60,160,260,360];
 const N=[
  ['land',c1,y[0],w1,K.land,'leaf','Quỹ đất · đền bù','Đất nông nghiệp, đất cao su'],
  ['ipdev',c2,y[0],w2,K.land,'factory','Hạ tầng khu công nghiệp','KBC • IDC • SZC • LHG • NTC • D2D • TIP • VGC'],
  ['lease',c3,y[0],w3,K.land,'box','Đất có hạ tầng cho thuê','Thuê đến hết dự án, thường trả một lần'],
  ['fdi',c4,y[0]+40,w4,K.land,'ship','Nhà máy FDI','Điện tử • cơ khí • dệt may'],
  ['capex',c1,y[1],w1,K.rbf,'bank','Vốn xây dựng','Vay ngân hàng'],
  ['rbfdev',c2,y[1],w2,K.rbf,'tool','Xây nhà xưởng, kho','SIP • IDC • LHG'],
  ['rbf',c3,y[1],w3,K.rbf,'store','Nhà xưởng, kho cho thuê','Thuê theo năm'],
  ['sme',c4,y[1]+60,w4,K.rbf,'truck','Doanh nghiệp trong nước','Sản xuất • logistics'],
  ['power',c1,y[2],w1,K.util,'bolt','Điện, nước đầu vào','Mua điện • khai thác nước'],
  ['utildev',c2,y[2],w2,K.util,'water','Hạ tầng tiện ích','SIP • IDC'],
  ['util',c3,y[2],w3,K.util,'water','Điện, nước, xử lý nước thải','Phí dịch vụ hằng tháng'],
  ['uland',c1,y[3],w1,K.urban,'home','Quỹ đất quanh KCN','Đất đô thị, dịch vụ'],
  ['urbandev',c2,y[3],w2,K.urban,'home','Đô thị kèm khu công nghiệp','BCM • KBC'],
  ['urban',c3,y[3],w3,K.urban,'home','Đất đô thị, nhà ở','Bán hoặc chuyển nhượng dự án'],
  ['buyer',c4,y[3],w4,K.urban,'home','Người mua nhà, nhà đầu tư','Chuyên gia, người lao động KCN']
 ];
 const E=[
  ['land','ipdev',K.land],['ipdev','lease',K.land],['lease','fdi',K.land],['lease','sme',K.land],
  ['capex','rbfdev',K.rbf],['rbfdev','rbf',K.rbf],['rbf','fdi',K.rbf],['rbf','sme',K.rbf],
  ['power','utildev',K.util],['utildev','util',K.util],['util','fdi',K.util],['util','sme',K.util],
  ['uland','urbandev',K.urban],['urbandev','urban',K.urban],['urban','buyer',K.urban]
 ];
 const fig=window.ValueChain.draw({N,E,H,height:460,
  lanes:[['ĐẦU VÀO',0,260,'#eef3fb','#1D2678'],['CHỦ ĐẦU TƯ',285,280,'#eefaf9','#2a9fa3'],['SẢN PHẨM',590,280,'#fbf6ea','#b8801f'],['KHÁCH HÀNG',895,275,'#f7eef3','#861C52']],
  legend:[[K.land,'Đất khu công nghiệp'],[K.rbf,'Nhà xưởng, kho xây sẵn'],[K.util,'Điện, nước, xử lý nước thải'],[K.urban,'Đô thị kèm khu công nghiệp']],
  title:'Chuỗi giá trị ngành bất động sản khu công nghiệp',
  desc:'Quỹ đất đã đền bù đi vào chủ đầu tư hạ tầng khu công nghiệp, thành đất có hạ tầng cho nhà máy FDI và doanh nghiệp trong nước thuê; vốn xây dựng thành nhà xưởng, kho cho thuê theo năm; điện, nước đầu vào thành dịch vụ tiện ích thu phí hằng tháng; một phần quỹ đất quanh khu công nghiệp làm đô thị, nhà ở.'});
 heading.after(fig);
 fig.after(make('div','pw-src','Nguồn: báo cáo thường niên doanh nghiệp; workbook KCN'));
}
})();
