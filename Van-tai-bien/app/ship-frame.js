/* Vận tải biển · khung 5 tab theo flow Dầu khí / Điện (người dùng yêu cầu 26/11/2026: "học theo flow & design của ngành dầu khí").
   Tab lớn: Tổng quan ngành (00 Bản đồ ngành · 01 Chuỗi giá trị · 02 Doanh nghiệp niêm yết · 03 Triển vọng)
          · Bức tranh ngành (01 Tổng quan cước · 02 Tàu dầu thô · 03 Tàu sản phẩm & hóa chất · 04 Hàng rời · 05 Container · 06 Chi phí & giá tàu · 07 Tuyến & địa chính trị)
          · Chính sách (01 Quốc tế · 02 Việt Nam) · Tài chính ngành (#mt14, app/ship-finance.js) · Chủ đề nóng.
   Engine (style, buildTab, nav) chép từ Dau-khi/app/oil-frame.js. Card cũ được DỜI theo data-block-id, không nhân bản, không xóa;
   card không có trong bảng dời gom vào "Nội dung khác của tab cũ". Tab Địa chính trị & tuyến cũ (#mt10) thành Bức tranh ngành › 07,
   như Hormuz ở Dầu khí. Deep-link: Van-tai-bien/?sub=<khóa>#mt2 ; link cũ #mt3/#mt10 → #mt2, #mt6 → #mt1. */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
if (!$('#chTanker') || !$('[data-block-id="vt-01"]')) return;  // chỉ trang Vận tải biển
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const block = id => $(`[data-block-id="${id}"]`);
const byCanvas = id => $('#' + id)?.closest('.card,.viz-block');

const GAP = t => `<p class="data-gap of-gap">${t}</p>`;
const TREE = {
  mt1: {label: 'Tổng quan ngành', title: 'Tổng quan ngành vận tải biển', intro: 'Doanh thu = ngày tàu × cước (TCE); chuỗi giá trị → doanh nghiệp niêm yết → triển vọng.', subs: [
    {k: 'map', n: '00', t: 'Bản đồ ngành', d: 'Chủ hàng → thuê tàu → ba đội tàu → cước thế giới.', sel: ['.research-roadmap'], ids: ['vt-01']},
    {k: 'chain', n: '01', t: 'Chuỗi giá trị', d: 'Cước thế giới đi vào doanh thu theo từng phân khúc tàu.', ids: [], rest: true},
    {k: 'listed', n: '02', t: 'Doanh nghiệp niêm yết', d: 'Mô hình kinh doanh từng mã: phân khúc tàu, doanh thu đến từ đâu, biến quyết định.', sel: ['.business-models'], ids: ['vt-04']},
    {k: 'outlook', n: '03', t: 'Triển vọng', d: 'Vị trí trong chu kỳ và cung tàu mới.', ids: ['vt-02', 'vt-62', 'vt-25']},
  ]},
  mt2: {label: 'Bức tranh ngành', title: 'Bức tranh ngành', intro: 'Theo phân khúc: cước chung → tàu dầu thô → tàu sản phẩm & hóa chất → hàng rời → container → chi phí & giá tàu → tuyến.', subs: [
    {k: 'overview', n: '01', t: 'Tổng quan cước', d: 'Chỉ số cước các phân khúc, so cùng kỳ, vận tải biển Việt Nam.', kpis: true, sel: ['.fsv-heat'], ids: ['vt-21', 'vt-22']},
    {k: 'crude', n: '02', t: 'Tàu dầu thô', d: 'BDTI, thu nhập theo tuyến, TC 1 năm, VLCC tại Vịnh, cung – cầu BIMCO.', ids: ['vt-10', 'vt-61', 'vt-13', 'vt-14', 'vt-12']},
    {k: 'product', n: '03', t: 'Tàu sản phẩm & hóa chất', d: 'BCTI, tuyến sản phẩm, giá tàu MR, thuê tàu LPG, TCE tàu hóa chất.', ids: ['vt-70', 'vt-71', 'vt-75', 'vt-72', 'vt-73', 'vt-74']},
    {k: 'bulk', n: '04', t: 'Hàng rời', d: 'BDI và bốn cỡ tàu, TC 1 năm, cung – cầu BIMCO.', ids: ['vt-65', 'vt-65a', 'vt-65b', 'vt-65c', 'vt-65d', 'vt-20', 'vt-24', 'vt-23']},
    {k: 'container', n: '05', t: 'Container', d: 'Cước FBX theo tuyến, xuất nhập khẩu Việt Nam, cung – cầu BIMCO.', ids: ['vt-32', 'vt-30', 'vt-31'],
      gap: 'Chưa có chuỗi giá thuê tàu container (HARPEX, New ConTex) theo thời gian; mức mới nhất ở Tổng quan › 03 Triển vọng.'},
    {k: 'cost', n: '06', t: 'Chi phí & giá tàu', d: 'Nhiên liệu, giá tàu cũ và đóng mới, đồng hồ lợi nhuận theo mã.', ids: ['vt-11', 'vt-64', 'vt-63']},
    {k: 'routes', n: '07', t: 'Tuyến & địa chính trị', d: 'Hormuz, Bab el-Mandeb, Suez và chi phí đi vòng.', ids: ['vt-40', 'vt-41', 'vt-42']},
  ]},
  // 27/11/2026 (flow ngành nhiều luật): mỗi sub-tab là một văn bản; tóm tắt, Mới duyệt, nhãn luật trên chuỗi giá trị do app/sector-legal.js + app/legal-config.js thêm.
  mt4: {label: 'Chính sách', title: 'Chính sách', intro: 'Mỗi sub-tab là một văn bản pháp lý lớn: tóm tắt, quy định trước và sau, tác động lên doanh nghiệp.', subs: [
    {k: "ustr", n: '01', t: "Phí cảng Mỹ (USTR 301)", d: "Phí cảng với tàu Trung Quốc sở hữu/vận hành/đóng; đang hoãn", ids: ["vt-50"]},
    {k: "sanc", n: '02', t: "Cấm vận dầu Nga · Iran", d: "OFAC SDN và gói 21 EU: siết shadow fleet, giảm cung tàu hợp pháp", ids: []},
    {k: "ets", n: '03', t: "EU ETS hàng hải", d: "Nộp 100% hạn ngạch từ 2026 cho tàu ghé cảng EU", ids: []},
    {k: "imo", n: '04', t: "IMO Net-Zero Framework", d: "Giá carbon toàn cầu; hoãn 10/2025, phiên nối lại 12/2026", ids: []},
    {k: "code", n: '05', t: "Bộ luật Hàng hải & Đường thủy", d: "Hợp nhất luật; QH cho ý kiến 10/2026, dự kiến thông qua 5/2027", ids: ["vt-51"]},
    {k: "fleet", n: '06', t: "Thuế, phí & đề án đội tàu", d: "GTGT 0% vận tải quốc tế, miễn phí hàng hải, QĐ 1254 đội tàu", ids: []},
    {k: "docs", n: '07', t: "Mới duyệt gần đây", d: "Văn bản, biện pháp ban hành trong 12 tháng gần nhất", ids: [], rest: true},
  ]},
};
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt4', 'Chính sách'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
const ALIAS = {mt3: 'mt2', mt6: 'mt1', mt10: 'mt2'};

function style() {
  const st = el('style'); st.id = 'ship-frame-style';
  st.textContent = `.of-lead{margin:6px 0 4px;font-size:14px;line-height:1.6;color:#3B4256}.of-lead b{color:#1F2A5C}.of-lead b.neg{color:#B3303F}.of-lead b.pos{color:#17784A}
.dv-row.dv-total{border-bottom:2px solid #DCE1EE}.dv-row.dv-total .dv-l b{font-weight:800}.dv-row.dv-total .dv-bar{opacity:1}
.dv{margin:10px 0 4px}.dv-axis{display:grid;grid-template-columns:260px 1fr;margin-bottom:4px}.dv-axis{position:relative}.dv-axis span{font:600 11.5px Inter,sans-serif;color:#9AA1BC}
.dv-axis{display:flex;justify-content:space-between;padding-left:276px}.dv-g{margin:12px 0 4px;font:700 12px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#2938A8}
.dv-row{display:grid;grid-template-columns:260px minmax(0,1fr);gap:16px;align-items:center;min-height:44px;border-bottom:1px solid #F0F2F8}
.dv-l b{display:block;font:600 14px/1.3 Inter,sans-serif;color:#1F2A5C}.dv-l small{font-size:12px;color:#6B7392}
.dv-track{position:relative;height:28px}.dv-zero{position:absolute;left:50%;top:-8px;bottom:-8px;border-left:1.5px solid #C9CEE0}
.dv-bar{position:absolute;top:6px;height:16px;border-radius:4px}.dv-bar.neg{background:#E5484D;opacity:.8;border-radius:4px 0 0 4px}.dv-bar.pos{background:#2BB673;opacity:.85;border-radius:0 4px 4px 0}
.dv-v{position:absolute;top:4px;font:700 13.5px Inter,sans-serif;font-style:normal}.dv-v.neg{color:#B3303F}.dv-v.pos{color:#17784A}
.dv-note{margin:12px 0 0;font-size:12.5px;color:#6B7392}
@media (max-width:900px){.dv-row{grid-template-columns:1fr}.dv-axis{padding-left:0}}
.of-ops-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:12px 0 4px}
.of-ops-i{display:flex;flex-direction:column;gap:3px;padding:12px 14px;border:1px solid #E6E9F2;border-radius:12px;background:#FAFBFE}
.of-ops-i span{font:600 12.5px Inter,sans-serif;color:#6B7392}.of-ops-i b{font:700 26px/1.15 Inter,sans-serif;color:#1F2A5C}.of-ops-i b small{font:600 13px Inter,sans-serif;color:#6B7392;margin-left:4px}.of-ops-i em{font-style:normal;font-size:12px;color:#6B7392}
.tx2{margin:10px 0 6px;font-size:13px}.tx2-head,.tx2-row{display:grid;grid-template-columns:190px minmax(0,1fr);gap:16px;align-items:center}
.tx2-head{height:40px}.tx2-axis{position:relative;height:100%;border-bottom:1px solid #DCE1EE}.tx2-axis span{position:absolute;bottom:6px;transform:translateX(-50%);font:600 12px Inter,sans-serif;color:#7A84A6}
.tx2-row{min-height:64px;border-bottom:1px solid #F0F2F8}.tx2-lane{position:relative;height:64px}
.tx2-bar{position:absolute;top:8px;bottom:8px;display:flex;flex-direction:column;justify-content:center;padding:0 10px;border-radius:9px;overflow:hidden;white-space:nowrap;background:#E8ECFB;border-left:4px solid #2938A8}
.tx2-bar b{font:700 13px Inter,sans-serif;color:#1F2A5C;overflow:hidden;text-overflow:ellipsis}.tx2-bar small{font-size:11.5px;color:#5A6385;overflow:hidden;text-overflow:ellipsis}.tx2-bar small a{color:#2938A8}
.tx2-bar.e10{background:#E7F7EF;border-left-color:#2BB673;right:0;width:auto!important}
.of-group{grid-column:1/-1;margin:18px 0 -4px;padding-top:14px;border-top:1px solid #E6E9F2}
.of-group h3{margin:0;font:700 20px/1.3 Inter,system-ui,sans-serif;color:#1F2A5C}.of-group p{margin:4px 0 0;font-size:13.5px;color:#6B7392}
.of-body>.kpis+.of-group{border-top:0;padding-top:0}
/* Thang chữ thống nhất cho Dầu khí (26/11/2026): tiêu đề thẻ 16 · chữ thường 14 · chú thích 12.5; ba màu chữ */
body[data-ship-frame] .majorpane{--of-t1:#1F2A5C;--of-t2:#3B4256;--of-t3:#6B7392}
body[data-ship-frame] .majorpane :is(.chart-title,.card>h3,.card>h4,.card .research-detail>h3,.research-fold>summary,.business-model h3,.opec-drivers h3,.sectionhead h2.sec,.of-section h2){font:700 16px/1.35 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important;letter-spacing:-.005em}
body[data-ship-frame] .majorpane :is(.business-models>h2,.research-roadmap>h2,.section>h2,.sectionhead h2){font:700 20px/1.3 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important}
body[data-ship-frame] .majorpane :is(.card p,.card li,.card td,.research-detail p,.business-model p,.tx-mech,.tx-who,.gt-lab b){font-size:14px!important;line-height:1.55!important;color:var(--of-t2)!important}
body[data-ship-frame] .majorpane :is(.card th,.chart-sub,.note,.source-note,.research-caption,.srcrow,.srcrow a,.pw-src,.card small,.gt-lab small,.gt-name small,.tx-k,.ct-period label,.cts-legend button){font-size:12.5px!important;line-height:1.5!important;color:var(--of-t3)!important}
body[data-ship-frame] .majorpane .card th{font-weight:600!important}
body[data-ship-frame] .majorpane :is(.card td b,.card p b,.tx-ch,.gt-name b){color:var(--of-t1)!important}
body[data-ship-frame] .majorpane .card [style*="font-size:12.5px"]{font-size:14px!important;color:var(--of-t2)!important}
body[data-ship-frame] .majorpane .comparison-heading h2{color:#fff!important;background:none!important;box-shadow:none!important}
:root[data-theme=dark] body[data-ship-frame] .majorpane{--of-t1:#E8EBFA;--of-t2:#C4C9E2;--of-t3:#9AA1BC}
.gt{margin:12px 0 8px;font-size:13px}
.gt-head,.gt-row{display:grid;grid-template-columns:200px minmax(0,1fr) 230px;gap:16px;align-items:center}
.gt-head{height:46px}.gt-axis{position:relative;height:100%;border-bottom:1px solid #DCE1EE}
.gt-axis span{position:absolute;bottom:6px;transform:translateX(-50%);font:600 12px Inter,sans-serif;color:#7A84A6}
.gt-now{position:absolute;top:0;bottom:0;border-left:2px dashed #E5484D;opacity:.7;z-index:0;pointer-events:none}.gt-nowh{position:absolute;top:2px;transform:translateX(-50%);font:700 10.5px Inter,sans-serif;font-style:normal;color:#E5484D;background:#FDECEE;padding:1px 6px;border-radius:6px;white-space:nowrap}

.gt{position:relative;overflow:hidden}
.gt-tbd{font:600 12px Inter,sans-serif;color:#7A84A6}
.gt-row{min-height:58px;border-bottom:1px solid #F0F2F8}
.gt-name b{display:block;font:700 14px/1.3 Inter,sans-serif;color:#1F2A5C}.gt-name small{color:#7A84A6;font-size:12px}
.gt-lane{position:relative;height:58px;background:repeating-linear-gradient(90deg,transparent 0 calc(100%/6 - 1px),#F0F2F8 calc(100%/6 - 1px) calc(100%/6))}
.gt-pin{position:absolute;top:50%;display:flex;align-items:center;gap:8px;transform:translateY(-50%);z-index:1}
.gt-pin .gt-dot{transform:translateX(-50%);flex:none}
.gt-pin.left{flex-direction:row-reverse;transform:translate(calc(-100% + 0px),-50%)}.gt-pin.left .gt-dot{transform:translateX(50%)}.gt-pin.left .gt-lab{text-align:right}
.gt-pin.tbd{position:static;transform:none}.gt-pin.tbd .gt-lab{white-space:normal}.gt-pin.tbd .gt-dot{transform:none}
.gt-lab{display:flex;flex-direction:column;white-space:nowrap;line-height:1.3}.gt-lab b{font:600 13px Inter,sans-serif;color:#1F2A5C}.gt-lab small{font-size:11.5px;color:#6B7392}
.gt-dot{display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(31,42,92,.15),0 3px 8px -2px rgba(31,42,92,.35)}
.gt-dot.on{background:#2BB673}.gt-dot.next{background:#2938A8}.gt-dot.tbd{background:#B4BAD0}
.gt-key{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:10px;font-size:12px;color:#5A6385}.gt-key span{display:inline-flex;align-items:center;gap:6px}.gt-key .gt-dot{width:10px;height:10px}
@media (max-width:900px){.gt-head,.gt-row{grid-template-columns:110px minmax(0,1fr) 70px;gap:8px}.gt-lab small{display:none}}
:root[data-theme=dark] .gt-name b,:root[data-theme=dark] .gt-lab b{color:#E8EBFA}:root[data-theme=dark] .gt-row{border-color:#2A2A2A}
.tx-flow{display:grid;grid-template-columns:170px minmax(0,1fr);gap:0 26px;align-items:stretch;margin:10px 0 8px}
.tx-src{position:relative;align-self:center;display:flex;flex-direction:column;gap:4px;padding:18px 16px;border-radius:16px;color:#fff;background:linear-gradient(150deg,#2938A8,#6C5CE7 60%,#59C5C8);box-shadow:0 10px 26px -10px rgba(41,56,168,.55)}
.tx-src b{font:700 16px/1.25 Inter,sans-serif}.tx-src small{color:#EEF0FF!important;font-size:12px}.tx-src .tx-k{color:#DDE3FF}
.tx-k{display:block;font:700 10px/1 Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#8A93B8;margin-bottom:3px}
.tx-rows{position:relative;display:grid;gap:10px;padding-left:22px;border-left:2px dashed #C9C3F5}
.tx-row{position:relative;display:grid;grid-template-columns:150px minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:center;padding:12px 14px;border:1px solid #E6E8F4;border-radius:12px;background:#fff;transition:box-shadow .2s,transform .2s}
.tx-row:hover{box-shadow:0 6px 18px -8px rgba(41,56,168,.3);transform:translateX(2px)}
.tx-row::before{content:'';position:absolute;left:-23px;top:50%;width:22px;border-top:2px dashed #C9C3F5}
.tx-row::after{content:'';position:absolute;left:-28px;top:calc(50% - 4px);width:8px;height:8px;border-radius:50%;background:#A78BFA}
.tx-ch{font:700 14px/1.3 Inter,sans-serif;color:#1F2A5C}.tx-ch b{font-weight:700}
.tx-mech{font-size:13px;line-height:1.5;color:#3B4256}.tx-who{font-size:13px;line-height:1.45;color:#1F2A5C}
.tx-dir{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.45;padding:8px 10px;border-radius:10px}
.tx-dir i{font-style:normal;font-size:11px;line-height:1.6}
.tx-row.neg{border-left:4px solid #E5484D}.tx-row.neg .tx-dir{background:#FDECEE;color:#A1252B}
.tx-row.pos{border-left:4px solid #2BB673}.tx-row.pos .tx-dir{background:#E7F7EF;color:#17784A}
.tx-row.mix{border-left:4px solid #A78BFA}.tx-row.mix .tx-dir{background:#F1EDFF;color:#5B4FD6}
@media (max-width:900px){.tx-flow{grid-template-columns:1fr;gap:12px}.tx-row{grid-template-columns:1fr}.tx-rows{padding-left:14px}.tx-row::before{width:14px;left:-15px}.tx-row::after{left:-20px}}
:root[data-theme=dark] .tx-row{background:var(--card);border-color:var(--line)}:root[data-theme=dark] .tx-ch,:root[data-theme=dark] .tx-who{color:#E8EBFA}:root[data-theme=dark] .tx-mech{color:#B8BEDA}
.of-nav{position:sticky;top:var(--of-top,76px);z-index:30;display:flex;flex-wrap:wrap;gap:10px;margin:4px 0 20px;padding:10px 0 12px;background:var(--fs-page,#F7F8FC);border-bottom:1px solid #E6E9F2}
body .of-nav button.of-tab{display:flex;align-items:center;padding:10px 20px;border:1px solid #E2E5EE;border-radius:12px;background:#fff;font:600 15.5px/1.2 Inter,system-ui,sans-serif;color:#3D4566;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
body .of-nav button.of-tab:hover{border-color:#B9C0DC;color:#1F2677}
body .of-nav .of-n{display:none}
body .of-nav b{font-weight:600}
body .of-nav button.of-tab[aria-selected=true]{background:#1F2677!important;border-color:#1F2677!important;color:#fff!important;box-shadow:0 4px 12px -4px rgba(31,38,119,.45)!important}
:root[data-theme=dark] .of-nav{background:#0A0A0A;border-color:#2A2A2A}:root[data-theme=dark] body .of-nav button.of-tab{background:#161616;border-color:#2A2A2A;color:#C8CCE0}:root[data-theme=dark] body .of-nav button.of-tab[aria-selected=true]{background:#2938A8!important;color:#fff!important}
.of-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin:4px 0 12px;padding:10px 0;border-bottom:1px solid var(--line,#e3e7f0)}
.of-head h2{margin:0;font-size:24px}.of-head .of-k{font:500 13px Inter,sans-serif;color:var(--muted,#7a8399);margin-right:8px}.of-head p{margin:4px 0 0;color:var(--ink2,#3b4256)}
.of-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}.of-body>*{min-width:0;margin:0!important}
.of-body>.of-wide,.of-body>.of-gap,.of-body>details,.of-body>.kpis,.of-body>.research-grid,.of-body>table,.of-body>.tablewrap{grid-column:1/-1}
@media (max-width:900px){.of-body{grid-template-columns:minmax(0,1fr)}}
.of-body>.of-span{grid-column:1/-1}
.of-body .ct-switch{display:flex!important;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;margin:6px 0 2px!important}
.of-body .ct-switch .ct-main{margin:0 0 0 auto!important;order:2}.of-body .ct-switch .ct-period{order:1;margin:0!important}
.of-body .ct-canvas{margin-top:4px}
.of-body>.card{padding:18px 20px 12px!important}
.of-body>.card .chart-title{margin-bottom:4px!important}
.of-body .cts-legend{margin:6px 0 0!important}
.of-body .pw-src,.of-body .chart-source,.of-body .source-note,.of-body .srcrow{margin-top:6px!important;padding-top:6px!important}
.of-body>.card::after{margin-top:2px!important}
.of-body .card,.of-body .card *{min-width:0}.of-body canvas{max-width:100%!important}
.of-body>.card{display:flex;flex-direction:column;align-self:stretch}
.of-body>.card .chart{position:relative;width:100%;height:300px!important;min-height:0!important;flex:none}
.of-gap{padding:10px 12px;border:1px dashed var(--line,#d6dbe8);border-radius:10px;color:var(--muted,#6b7280);font-size:13px}
.of-rest{display:none!important}.of-next{display:inline-flex;align-items:center;gap:6px;margin:24px 0 0;padding:9px 18px;border:1px solid #C9D0EC;border-radius:999px;background:#fff;color:#2938A8;font:600 13.5px Inter,sans-serif;cursor:pointer;box-shadow:0 1px 2px rgba(31,42,92,.06);transition:.2s}.of-next:hover{background:#2938A8;color:#fff;border-color:#2938A8;box-shadow:0 4px 12px rgba(41,56,168,.2)}.of-pane .research-roadmap>h2{display:none}.of-hidden-legacy{display:none!important}`;
  document.head.append(st);
}

function wideIfTable(n) {
  if (!n.matches?.('.card')) return;
  const charts = n.querySelectorAll('[id^="ch"]').length;
  if (charts > 1 || (!charts && !n.querySelector('canvas,svg') && n.querySelector('table'))) n.classList.add('of-wide');
}

function buildTab(key) {
  const def = TREE[key], pane = $(`.majorpane[data-tab="${key}"]`);
  if (!pane) return;
  const legacy = [...pane.children];
  // Người dùng bỏ 26/11/2026: ghi chú độ tin cậy (04), thẻ biên phân phối (26), hai ô phân tích AI (02, 14).
  const sec = el('section', 'section of-section');
  const brief = key === 'mt1' && $('#dataBrief'); if (brief) sec.append(brief);
  const nav = el('div', 'of-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', def.title); sec.append(nav);
  const used = new Set();
  const subs = def.subs.map((s, i) => {
    const b = el('button', 'of-tab', `<span class="of-n">${String(i + 1).padStart(2, '0')}</span><b>${s.t}</b>`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `of-${key}-${s.k}-tab`;
    const p = el('div', 'pane-subpane of-pane'); p.id = `of-${key}-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
        const body = el('div', 'of-body'); p.append(body);
    if (s.kpis) { const k = $('.majorpane[data-tab="mt2"] .kpis'); if (k) { body.append(k); used.add(k); } }
    const put = n => { if (!n || used.has(n) || [...used].some(u => u.contains?.(n))) return; body.append(n); used.add(n); wideIfTable(n); };
    (s.canv || []).forEach(c => put(byCanvas(c)));
    (s.sel || []).forEach(q => $$(q).forEach(n => { put(n); n.classList.add('of-wide'); }));
    s.ids.forEach(id => put(block(id)));
    if (s.gap) body.insertAdjacentHTML('beforeend', GAP(s.gap));
    if (!body.children.length) body.insertAdjacentHTML('beforeend', GAP('Chưa có dữ liệu cho mục này.'));
    const nx = def.subs[i + 1]; if (nx) { const go = el('button', 'of-next', `Tiếp: ${nx.t} →`); go.type = 'button'; go.addEventListener('click', () => { open(key, nx.k, true); nav.scrollIntoView({behavior: 'smooth', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open(key, s.k, true));
    return {s, b, p, body};
  });
  // Phần còn lại của tab cũ: thẻ có data-block-id chưa dời + khối nội dung khác. Không xóa: gom vào "Nội dung khác".
  const restHost = subs.find(x => x.s.rest) || subs[0];
  const restItems = [];
  legacy.forEach(n => {
    if (sec.contains(n)) return;
    if (n.matches('.sectionhead')) { n.classList.add('of-hidden-legacy'); return; }
    if (n.matches('.pane-subtabs,.supply-tabs,.world-subtabs,[role=tablist]')) { n.classList.add('of-hidden-legacy'); return; }
    // Chỉ giữ khối có dữ liệu (thẻ, chart, bảng); câu dẫn/đường dẫn của bố cục cũ bỏ.
    if (n.matches?.('.of-hidden-legacy')) return;
    if (n.matches?.('[data-block-id]') || n.querySelector?.('[data-block-id],canvas,table,svg')) restItems.push(n);
  });
  if (restItems.length) {
    const d = el('details', 'research-fold of-rest of-wide'); d.append(el('summary', '', 'Nội dung khác của tab cũ'));
    const box = el('div', 'research-detail'); restItems.forEach(n => { n.hidden = false; n.querySelectorAll('[hidden]').forEach(h => { if (h.matches('.supply-pane,.pane-subpane,[role=tabpanel]')) h.hidden = false; }); box.append(n); });
    d.append(box); restHost.body.append(d);
    // Tab con cũ rỗng (khung sub-tab không còn card nào) thì ẩn.
    box.querySelectorAll('.supply-pane,.pane-subpane').forEach(x => { if (!x.querySelector('[data-block-id],canvas,svg,table,.card')) x.classList.add('of-hidden-legacy'); });
    if (!box.querySelector('[data-block-id],canvas,svg,table,.card')) d.remove();
  }
  pane.replaceChildren(sec);
  // Thẻ lẻ đứng một mình trước khối rộng (hoặc cuối) thì trải hết hàng, tránh nửa trang trống.
  subs.forEach(({body}) => { let run = []; const flush = () => { if (run.length % 2) run.at(-1).classList.add('of-span'); run = []; };
    [...body.children].forEach(n => { const wide = n.matches('.of-wide,.of-gap,details,.kpis,.research-grid,table,.tablewrap') || getComputedStyle(n).gridColumnEnd === '-1'; if (wide) flush(); else run.push(n); }); flush(); });
  TABS[key] = subs;
  [100, 600, 1500].forEach(t => setTimeout(() => { window.dispatchEvent(new Event('resize')); $$('.of-body canvas').forEach(c => { const ch = window.Chart?.getChart?.(c); if (ch && c.offsetParent) ch.resize(); }); }, t));
}
const TABS = {};
function open(key, sub, push) {
  const subs = TABS[key]; if (!subs) return;
  const hit = subs.find(x => x.s.k === sub) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  if (push) { const u = new URL(location.href); u.searchParams.set('sub', hit.s.k); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}

function financePane() {
  let p = $('.majorpane[data-tab="mt14"]');
  if (!p) { p = el('section', 'majorpane'); p.dataset.tab = 'mt14'; p.id = 'pane-mt14'; p.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(p); }
  const sec = el('section', 'section');
  sec.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>Số liệu tài chính của 8 doanh nghiệp vận tải biển niêm yết, tổng hợp theo phân khúc, từ BCTC hợp nhất quý.</p></div>'));
  const host = el('div', 'of-fin'); host.id = 'vt-fin-root';
  // 27/11/2026 (người dùng chốt): Tài chính ngành có 2 sub-tab. 01 Tổng quan ngành = chỉ số cộng gộp (tổng tử số ÷ tổng mẫu số);
  // 02 So sánh doanh nghiệp = từng mã (xu hướng tài chính, P/E, kế hoạch – kết quả, số vận hành riêng). Tổng quan ngành (mt1) chỉ giữ mô hình kinh doanh.
  const CMP_IDS = ['vt-60', 'vt-66', 'vt-67', 'vt-03'], CMP_SEL = ['.sector-valuation'];
  const fnav = el('div', 'of-nav'); fnav.setAttribute('role', 'tablist'); fnav.setAttribute('aria-label', 'Tài chính ngành'); sec.append(fnav);
  const subs = [{k: 'total', t: 'Tổng quan ngành'}, {k: 'compare', t: 'So sánh doanh nghiệp'}].map((s, i) => {
    const b = el('button', 'of-tab', `<span class="of-n">${String(i + 1).padStart(2, '0')}</span><b>${s.t}</b>`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `of-mt14-${s.k}-tab`;
    const sp = el('div', 'pane-subpane of-pane'); sp.id = `of-mt14-${s.k}`; sp.dataset.sub = s.k; sp.setAttribute('role', 'tabpanel'); sp.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', sp.id);
    const body = el('div', 'of-body'); sp.append(body); fnav.append(b); sec.append(sp);
    b.addEventListener('click', () => open('mt14', s.k, true));
    return {s, b, p: sp, body};
  });
  subs[0].body.append(host); host.classList.add('of-wide');
  const cb = subs[1].body, moved = new Set();
  const take = n => { if (!n || moved.has(n) || [...moved].some(m => m.contains(n))) return; const was = n.closest('.of-rest'); n.hidden = false; cb.append(n); moved.add(n);
    if (n.matches('.financial-comparison') || n.querySelector('table')) n.classList.add('of-wide');
    if (was && !was.querySelector('[data-block-id],canvas,svg,table,.card')) was.remove(); };
  take($('.financial-comparison'));
  CMP_IDS.forEach(id => take(block(id))); CMP_SEL.forEach(q => $$(q).forEach(take));
  if (!cb.children.length) cb.insertAdjacentHTML('beforeend', GAP('Chưa có dữ liệu so sánh doanh nghiệp.'));
  { let run = []; const flush = () => { if (run.length % 2) run.at(-1).classList.add('of-span'); run = []; };
    [...cb.children].forEach(n => { if (n.matches('.of-wide,.of-gap,details,table,.tablewrap')) flush(); else run.push(n); }); flush(); }
  p.replaceChildren(sec);
  TABS.mt14 = subs; open('mt14', new URL(location.href).searchParams.get('sub'));
  return host;
}

function nav(finHost) {
  const bar = $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  let built = false;
  const select = (key, hash) => {
    key = ALIAS[key] || key; if (!ROUTES.some(r => r[0] === key)) key = 'mt1';
    $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
    [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    if (key === 'mt14' && !built && window.ShipFinance) { built = true; window.ShipFinance.build(finHost); }
    if (hash) { const u = new URL(location.href); if (!TABS[key]) u.searchParams.delete('sub'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
    setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
    return key;
  };
  ROUTES.forEach(([key, label], i) => {
    const b = el('button', 'majortabbtn', label); b.type = 'button'; b.dataset.tab = key; b.id = 'research-tab-' + key; b.setAttribute('role', 'tab');
    const p = $(`.majorpane[data-tab="${key}"]`); if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); }
    b.addEventListener('click', () => { select(key, true); window.scrollTo({top: 0, behavior: 'instant'}); });
    b.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? ROUTES.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : ROUTES.length - 1)) % ROUTES.length; bar.children[j].click(); bar.children[j].focus(); });
    bar.append(b);
  });
  window.showMajorTab = k => select(k, true);
  window.addEventListener('hashchange', () => select(location.hash.slice(1)));
  const key = select(location.hash.slice(1) || 'mt1');
  if (TABS[key]) open(key, new URL(location.href).searchParams.get('sub'));
  // Link trỏ vào thẻ đã dời: mở đúng tab lớn + sub-tab rồi cuộn tới.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t || t.matches('.majorpane')) return;
    const pane = t.closest('.majorpane'), sub = t.closest('.of-pane');
    if (!pane) return; e.preventDefault();
    select(pane.dataset.tab, true); if (sub) open(pane.dataset.tab, sub.dataset.sub, true);
    setTimeout(() => t.scrollIntoView({behavior: 'smooth', block: 'start'}), 120);
  });
}


// Thanh sub-tab dính ngay dưới thanh tab chính khi cuộn.
function stickySub() {
  const set = () => { const m = $('nav.majortabs'); if (!m) return; const cs = getComputedStyle(m); const top = (parseFloat(cs.top) || 0) + m.offsetHeight + 4; document.documentElement.style.setProperty('--of-top', top + 'px'); };
  set(); window.addEventListener('resize', set); setTimeout(set, 1500);
}


function run() {
  if (document.body.dataset.shipFrame) return; document.body.dataset.shipFrame = '1';
  style();
  stickySub();
  // KPI cước: khung lấy KPI của #mt2; trên trang này KPI có thể đang ở #mt1 hoặc trong sub-pane cũ, đưa về đầu #mt2.
  const k = $('.majorpane .kpis'), m2 = $('.majorpane[data-tab="mt2"]'); if (k && m2) m2.prepend(k);
  ['mt1', 'mt2', 'mt4'].forEach(buildTab);
  // Chủ đề Hormuz / Suez: thêm đường dẫn tới số liệu lượt tàu đã chuyển sang Bức tranh ngành › 07.
  $$('.majorpane[data-tab="mt7"] [data-topic-key="hormuz"], .majorpane[data-tab="mt7"] [data-topic-key="suez"]').forEach(t => {
    if (t.querySelector('.of-moved')) return;
    t.append(el('p', 'research-caption of-moved', 'Lượt tàu Hormuz, Bab el-Mandeb, Suez: <a href="#of-mt2-routes">Bức tranh ngành › 07 Tuyến & địa chính trị</a>.'));
  });
  const finHost = financePane();
  nav(finHost);
  window.dispatchEvent(new Event('ship:frame'));
}
if (window.SectorBoot) SectorBoot.add(1600, run);
else { const start = () => setTimeout(run, 1700); if (document.readyState === 'complete') start(); else window.addEventListener('load', start); }
})();
