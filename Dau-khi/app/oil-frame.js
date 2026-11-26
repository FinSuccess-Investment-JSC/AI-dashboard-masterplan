/* Dầu khí · khung 5 tab theo flow ngành Điện (người dùng chốt 26/11/2026).
   Tab lớn: Tổng quan ngành (00 Bản đồ ngành · 01 Chuỗi giá trị · 02 Doanh nghiệp niêm yết · 03 Triển vọng)
          · Bức tranh ngành (01 Dầu thô toàn cầu · 02 Thượng nguồn VN · 03 Khí & LNG · 04 Lọc dầu · 05 Phân phối xăng dầu · 06 Vận tải & dòng chảy)
          · Chính sách (01 Điều hành giá · 02 Luật Dầu khí 2026 · 03 Thuế & phí · 04 Quy hoạch khí & LNG)
          · Tài chính ngành (#mt14, app/oil-finance.js) · Chủ đề nóng.
   Card cũ được DỜI theo data-block-id, không nhân bản, không xóa. Card không có trong bảng dời vẫn ở lại trong tab cũ của nó,
   gom vào mục "Nội dung khác" cuối tab để không mất dữ liệu. Chạy sau research-layout / research-editorial / pane-subtabs.
   Deep-link: Dau-khi/?sub=<khóa sub-tab>#mt2 ; link cũ #mt3 → #mt2, #mt5/#mt6/#mt8 → #mt1. */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
if (!$('#chCurve')) return;  // chỉ trang Dầu khí
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const block = id => $(`[data-block-id="${id}"]`);
const byCanvas = id => $('#' + id)?.closest('.card,.viz-block');

const GAP = t => `<p class="data-gap of-gap">${t}</p>`;
const TREE = {
  mt1: {label: 'Tổng quan ngành', title: 'Tổng quan ngành dầu khí', intro: 'Nhìn để hiểu ngành: chuỗi giá trị → cơ chế lợi nhuận từng khâu → doanh nghiệp niêm yết → triển vọng.', subs: [
    {k: 'map', n: '00', t: 'Bản đồ ngành', d: 'Thượng nguồn → trung nguồn → hạ nguồn, mỗi khâu gắn mã niêm yết.', sel: ['.research-roadmap'], ids: ['dau-khi-01']},
    {k: 'chain', n: '01', t: 'Chuỗi giá trị', d: 'Giá dầu đi vào lợi nhuận từng khâu, mô hình kinh doanh từng mã.', sel: ['.business-models'], ids: ['dau-khi-38', 'dau-khi-30', 'dau-khi-31', 'dau-khi-03', 'dau-khi-32', 'dau-khi-33', 'dau-khi-34', 'dau-khi-35'], rest: true},
  ]},
  mt2: {label: 'Bức tranh ngành', title: 'Bức tranh ngành', intro: 'Theo khâu: dầu thô toàn cầu → thượng nguồn Việt Nam → khí & LNG → lọc dầu → phân phối → vận tải & dòng chảy.', subs: [
    {k: 'crude', n: '01', t: 'Dầu thô toàn cầu', d: 'Cung OPEC+ và ngoài OPEC, cầu, tồn kho, Brent/WTI, đường cong kỳ hạn, vị thế quỹ.', ids: ['dau-khi-05', 'dau-khi-12', 'dau-khi-23', 'dau-khi-24', 'dau-khi-25', 'dau-khi-11', 'dau-khi-06', 'dau-khi-07', 'dau-khi-08', 'dau-khi-09', 'dau-khi-10', 'dau-khi-13'], canv: ['chFastPrice'], sel: ['.opec-drivers', '.inventory-group'], kpis: true},
    {k: 'upstream', n: '02', t: 'Thượng nguồn VN', d: 'Sản lượng khai thác dầu và khí, chuỗi dự án và dòng khí đầu tiên.', ids: ['dau-khi-15', 'dau-khi-19'],
      gap: 'Chưa có chuỗi giá thuê và tỷ lệ sử dụng giàn khoan Đông Nam Á theo thời gian; số của PVD đang ở thẻ PVD (Tổng quan › Chuỗi giá trị).'},
    {k: 'gas', n: '03', t: 'Khí & LNG', d: 'Khí vào bờ, LNG nhập khẩu và vị trí của PV GAS.', ids: ['dau-khi-16', 'dau-khi-17']},
    {k: 'refining', n: '04', t: 'Lọc dầu', d: 'Crack spread Singapore và Mỹ, giá sản phẩm, cân đối hai nhà máy lọc dầu.', ids: ['dau-khi-singapore-crack', 'dau-khi-20', 'dau-khi-21', 'dau-khi-18'],
      gap: 'Biên lọc dầu thực tế của BSR không công bố theo tháng; crack Singapore so Dubai là proxy.'},
    {k: 'retail', n: '05', t: 'Phân phối xăng dầu', d: 'Giá bán lẻ trong nước theo kỳ điều hành.', ids: ['dau-khi-22'],
      gap: 'Chưa có chuỗi sản lượng tiêu thụ xăng dầu, số dư Quỹ bình ổn và mức chiết khấu đại lý.'},
    {k: 'flows', n: '06', t: 'Vận tải & dòng chảy', d: 'Lưu lượng tàu qua Hormuz, Bab el-Mandeb và xuất khẩu dầu thô Trung Đông.', ids: ['dau-khi-37', 'dau-khi-41', 'dau-khi-40']},
  ]},
  mt4: {label: 'Chính sách', title: 'Chính sách', intro: 'Điều hành giá và Luật Dầu khí: tác động lên từng khâu.', subs: [
    {k: 'price', n: '01', t: 'Điều hành giá', d: 'Cơ chế điều hành giá xăng dầu và tác động trong quý.', canv: ['chPolicyPremium', 'chPolicyChange'], ids: ['dau-khi-27'], rest: true},
    {k: 'law', n: '02', t: 'Luật Dầu khí 2026', d: 'Tác động ở đầu nguồn chu kỳ đầu tư.', ids: ['dau-khi-28']},
    {k: 'tax', n: '03', t: 'Thuế & xăng E10', d: 'Các mức thuế xăng dầu đang áp dụng và lộ trình xăng E10.', ids: []},
  ]},
};
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt4', 'Chính sách'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
const ALIAS = {mt3: 'mt2', mt5: 'mt1', mt6: 'mt1', mt8: 'mt1', mt10: 'mt2'};

function style() {
  const st = el('style'); st.id = 'oil-frame-style';
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
body[data-oil-frame] .majorpane{--of-t1:#1F2A5C;--of-t2:#3B4256;--of-t3:#6B7392}
body[data-oil-frame] .majorpane :is(.chart-title,.card>h3,.card>h4,.card .research-detail>h3,.research-fold>summary,.business-model h3,.opec-drivers h3,.sectionhead h2.sec,.of-section h2){font:700 16px/1.35 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important;letter-spacing:-.005em}
body[data-oil-frame] .majorpane :is(.business-models>h2,.research-roadmap>h2,.section>h2,.sectionhead h2){font:700 20px/1.3 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important}
body[data-oil-frame] .majorpane :is(.card p,.card li,.card td,.research-detail p,.business-model p,.tx-mech,.tx-who,.gt-lab b){font-size:14px!important;line-height:1.55!important;color:var(--of-t2)!important}
body[data-oil-frame] .majorpane :is(.card th,.chart-sub,.note,.source-note,.research-caption,.srcrow,.srcrow a,.pw-src,.card small,.gt-lab small,.gt-name small,.tx-k,.ct-period label,.cts-legend button){font-size:12.5px!important;line-height:1.5!important;color:var(--of-t3)!important}
body[data-oil-frame] .majorpane .card th{font-weight:600!important}
body[data-oil-frame] .majorpane :is(.card td b,.card p b,.tx-ch,.gt-name b){color:var(--of-t1)!important}
body[data-oil-frame] .majorpane .card [style*="font-size:12.5px"]{font-size:14px!important;color:var(--of-t2)!important}
:root[data-theme=dark] body[data-oil-frame] .majorpane{--of-t1:#E8EBFA;--of-t2:#C4C9E2;--of-t3:#9AA1BC}
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
  ['dau-khi-04', 'dau-khi-26', 'dau-khi-02', 'dau-khi-14'].forEach(id => $$(`[data-block-id="${id}"]`).forEach(n => { n.hidden = true; n.classList.add('of-hidden-legacy'); }));
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
  sec.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>Số liệu tài chính của 12 doanh nghiệp dầu khí niêm yết, tổng hợp theo khâu, từ BCTC hợp nhất quý.</p></div>'));
  const host = el('div', 'of-fin'); host.id = 'dk-fin-root'; sec.append(host); p.replaceChildren(sec);
  // So sánh tài chính & định giá (chart xu hướng + bảng) thuộc Tài chính ngành; Tổng quan chỉ giữ mô hình kinh doanh.
  const fc = $('.financial-comparison'); if (fc) { const was = fc.closest('.of-rest'); sec.append(fc); fc.classList.add('of-wide'); if (was && !was.querySelector('[data-block-id],canvas,svg,table,.card')) was.remove(); }
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
    if (key === 'mt14' && !built && window.OilFinance) { built = true; window.OilFinance.build(finHost); }
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


// Năm kênh truyền dẫn (dau-khi-38): vẽ sơ đồ cú sốc → kênh → ai chịu → chiều tác động; bảng gốc giữ trong "Xem bảng".
function channelDiagram() {
  const card = $('[data-block-id="dau-khi-38"]'), wrap = card?.querySelector('.tablewrap'); if (!wrap || card.querySelector('.tx-flow')) return;
  const rows = [...wrap.querySelectorAll('tbody tr')].map(tr => [...tr.cells].map(td => td.innerHTML)); if (!rows.length) return;
  const tone = t => /Tích cực/i.test(t) ? 'pos' : /Tiêu cực/i.test(t) ? 'neg' : 'mix';
  const icon = {pos: '▲', neg: '▼', mix: '◆'};
  const flow = el('div', 'tx-flow');
  flow.innerHTML = `<div class="tx-src"><span class="tx-k">Cú sốc</span><b>Gián đoạn vùng Vịnh</b><small>giá dầu &amp; dòng chảy</small></div>
  <div class="tx-rows">${rows.map(([ch, mech, who, dir]) => { const t = tone(dir.replace(/<[^>]+>/g, '')); return `<div class="tx-row ${t}">
    <div class="tx-ch">${ch}</div><div class="tx-mech">${mech}</div><div class="tx-who"><span class="tx-k">Ai chịu</span>${who}</div>
    <div class="tx-dir"><i>${icon[t]}</i>${dir}</div></div>`; }).join('')}</div>`;
  const d = el('details', 'dtable'); d.append(el('summary', '', 'Xem dạng bảng')); wrap.before(flow); wrap.replaceWith(d); d.append(wrap);
}

// Thanh sub-tab dính ngay dưới thanh tab chính khi cuộn.
function stickySub() {
  const set = () => { const m = $('nav.majortabs'); if (!m) return; const cs = getComputedStyle(m); const top = (parseFloat(cs.top) || 0) + m.offsetHeight + 4; document.documentElement.style.setProperty('--of-top', top + 'px'); };
  set(); window.addEventListener('resize', set); setTimeout(set, 1500);
}

// Chuỗi dự án khí (dau-khi-19): dòng thời gian dòng khí đầu tiên, chấm to theo trữ lượng; bảng gốc trong "Xem dạng bảng".
function gasTimeline() {
  const card = $('[data-block-id="dau-khi-19"]'), wrap = card?.querySelector('.tablewrap'); if (!wrap || card.querySelector('.gt')) return;
  const txt = n => n.textContent.replace(/\s+/g, ' ').trim(), num = t => { const m = t.match(/[\d.]+(?:,\d+)?/); return m ? +m[0].replace(/\./g, '').replace(',', '.') : null; };
  const when = t => { let m;
    if ((m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return +m[3] + (+m[2] - .5) / 12;
    if ((m = t.match(/quý\s*(\d)\/(\d{4})/i))) return +m[2] + (+m[1] - .5) / 4;
    if ((m = t.match(/(\d{4})\s*[–-]\s*(\d{4})/))) return (+m[1] + +m[2] + 1) / 2;
    if ((m = t.match(/cuối\s*(\d{4})/i))) return +m[1] + .85;
    if ((m = t.match(/(\d{4})/))) return +m[1] + .5; return null; };
  const rows = [...wrap.querySelectorAll('tbody tr')].map(tr => { const c = [...tr.cells].map(txt); return {name: c[0], lot: c[1], res: num(c[2]), out: num(c[3]), first: c[4], capex: num(c[5]), t: when(c[4])}; });
  if (!rows.length) return;
  const now = 2026 + (10 + 26 / 30) / 12, y0 = 2026, y1 = 2032, X = t => ((Math.min(Math.max(t, y0), y1) - y0) / (y1 - y0) * 100).toFixed(2) + '%';
  const maxR = Math.max(...rows.map(r => r.res || 0)), size = r => r.res ? 12 + 30 * Math.sqrt(r.res / maxR) : 10;
  const f = v => v == null ? '—' : v.toLocaleString('vi-VN');
  rows.sort((a, b) => (a.t ?? 9999) - (b.t ?? 9999));
  const axis = [...Array(y1 - y0 + 1)].map((_, i) => `<span style="left:${X(y0 + i)}">${y0 + i}</span>`).join('');
  const box = el('div', 'gt');
  box.innerHTML = `<div class="gt-head"><div></div><div class="gt-axis">${axis}<i class="gt-nowh" style="left:${X(now)}">Hôm nay</i></div><div class="gt-tbd">Chưa có lịch</div></div>` +
    rows.map(r => { const st = r.t == null ? 'tbd' : (r.t <= now && /\d{1,2}\/\d{1,2}\/\d{4}/.test(r.first)) ? 'on' : 'next', d = size(r);  // 'on' chỉ khi có ngày cụ thể đã qua; mốc theo quý vẫn là sắp vận hành
      const dot = `<span class="gt-dot ${st}" style="width:${d}px;height:${d}px" title="${r.first}"></span>`;
      const lab = `<span class="gt-lab"><b>${r.first}</b><small>${r.res ? 'Trữ lượng ' + f(r.res) + ' tỷ m³' : 'Trữ lượng chưa công bố'}${r.out ? ' · ' + f(r.out) + ' tỷ m³/năm' : ''}${r.capex ? ' · ' + f(r.capex) + ' tr USD' : ''}</small></span>`;
      return `<div class="gt-row"><div class="gt-name"><b>${r.name}</b><small>${r.lot}</small></div>
      <div class="gt-lane"><i class="gt-now" style="left:${X(now)}"></i>${r.t != null ? `<span class="gt-pin ${r.t > 2029 ? 'left' : ''}" style="left:${X(r.t)}">${dot}${lab}</span>` : ''}</div>
      <div class="gt-tbd">${r.t == null ? `<span class="gt-pin tbd">${dot}${lab}</span>` : ''}</div></div>`; }).join('') +
    `<div class="gt-key"><span><i class="gt-dot on"></i>Đã có dòng khí</span><span><i class="gt-dot next"></i>Sắp vận hành</span><span><i class="gt-dot tbd"></i>Chưa có mốc chắc chắn</span><span>Chấm càng to, trữ lượng càng lớn</span></div>`;
  const d = el('details', 'dtable'); d.append(el('summary', '', 'Xem dạng bảng')); wrap.before(box); wrap.replaceWith(d); d.append(wrap);
  // Không gập: bỏ lớp "research-fold" bọc thẻ, hiện tiêu đề gốc.
  const unfold = () => card.querySelectorAll(':scope > details.research-fold').forEach(f => { const body = f.querySelector(':scope > .research-detail') || f; f.replaceWith(...[...body.childNodes].filter(n => n.tagName !== 'SUMMARY')); card.querySelectorAll('.research-repeated-heading').forEach(h => h.classList.remove('research-repeated-heading')); });
  unfold(); [800, 3000].forEach(t => setTimeout(unfold, t));
}

// Dầu thô toàn cầu: sắp theo 4 nhóm (Cung–cầu → Tồn kho → Giá → Dòng tiền đầu cơ); tách 2 chart cung cầu khỏi khối gộp cho to; bỏ chart Brent 24 tháng trùng với Brent so với WTI.
function crudeLayout() {
  const body = $('#of-mt2-crude .of-body'); if (!body || body.dataset.ofCrude) return; body.dataset.ofCrude = '1';
  const card = id => { const n = $('#' + id); return n && (n.closest('.fs-share-host') || n.closest('.card')); };
  const wrap05 = block('dau-khi-05');
  const sd = card('chWorldSD'), gap = card('chWorldBalance');
  if (sd && wrap05) { const t = wrap05.querySelector('details'); if (t) sd.append(t); }
  const hide = n => { if (n) { n.hidden = true; n.classList.add('of-hidden-legacy'); } };
  const head = (t, d) => { const h = el('div', 'of-group of-wide', `<h3>${t}</h3>${d ? `<p>${d}</p>` : ''}`); return h; };
  const groups = [
    ['Cung – cầu', 'Cân bằng cung cầu toàn cầu, dư địa công suất và các nguồn cung chính.', [sd, gap, block('dau-khi-12'), $('#of-top-exporters'), $('.opec-drivers'), block('dau-khi-09')]],
    ['Tồn kho', 'Tồn kho Mỹ cập nhật theo tuần, chỉ báo sớm cho cân bằng.', [$('.inventory-group'), block('dau-khi-06'), block('dau-khi-07'), block('dau-khi-08'), block('dau-khi-10')]],
    ['Giá', 'Mặt bằng giá dài hạn theo năm và đường cong kỳ hạn WTI.', [block('dau-khi-24'), block('dau-khi-11')]],
    ['Dòng tiền đầu cơ', '', [block('dau-khi-13')]],
  ];
  const kpis = body.querySelector(':scope > .kpis');
  const keep = [kpis].filter(Boolean);
  groups.forEach(([t, d, items]) => { const xs = items.filter(n => n && body.contains(n) && (n.parentElement === body || n === sd || n === gap) && !keep.includes(n) && !keep.some(k => k.contains(n))); if (!xs.length) return; keep.push(head(t, d), ...xs); });
  [...body.children].forEach(n => { if (!keep.includes(n)) keep.push(n); });
  keep.forEach(n => body.append(n));
  [sd, gap, block('dau-khi-12')].forEach(n => n && n.classList.add('of-wide'));
  hide(wrap05); hide(block('dau-khi-23')); hide(block('dau-khi-25')); hide(card('chFastPrice'));  // 23, 25 trùng Brent Futures theo ngày
  hide(card('chUsProd'));
  hide($('#of-top-exporters'));
  hide($('#opec-drivers'));  // 26/11/2026: số nhập tay bản T8/2026, trùng combo cung–cầu (2026E) và chart đóng góp theo nước/khu vực  // 26/11/2026: trùng chart đóng góp thay đổi cung theo nước (cùng 10 nước, so cùng kỳ)  // 26/11/2026: Mỹ đã có trong chart 10 nước xuất khẩu lớn + ticker
  [...body.children].forEach(n => n.classList.remove('of-span'));
  let run = []; const flush = () => { if (run.length % 2) run.at(-1).classList.add('of-span'); run = []; };
  [...body.children].forEach(n => { if (n.hidden) return; if (n.matches('.of-wide,.of-group,details,.kpis')) flush(); else run.push(n); }); flush();
}

// 10 nước xuất khẩu dầu lớn: sản lượng tháng gần nhất (EIA STEO, tổng chất lỏng) và thay đổi so cùng kỳ.
function topExporters() {
  const src = window.SECTOR_DAILY?.sources?.top_producers, rec = src?.records; if (!rec?.length || $('#of-top-exporters')) return;
  const last = rec.at(-1), ym = last.date.slice(0, 7), prev = rec.find(r => r.date.slice(0, 7) === (+ym.slice(0, 4) - 1) + ym.slice(4));
  const names = src.names || {}, nf = (v, d = 2) => v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
  const rows = Object.keys(names).map(k => ({k, name: names[k], v: last[k], d: prev ? last[k] - prev[k] : null})).sort((a, b) => b.v - a.v);
  const mm = +ym.slice(5), yy = ym.slice(0, 4);
  const card = el('div', 'card of-wide'); card.id = 'of-top-exporters';
  card.innerHTML = `<div class="chart-title">Sản lượng dầu của 10 nước xuất khẩu lớn (triệu thùng/ngày)</div>
    <div class="chart-sub">Tháng ${mm}/${yy} · tổng chất lỏng (dầu thô, condensate, NGL) · nhãn: so cùng kỳ ${mm}/${+yy - 1}</div>
    <div class="ct-canvas" style="position:relative;height:340px"><canvas id="chTopExporters" role="img" aria-label="Sản lượng dầu 10 nước xuất khẩu lớn"></canvas></div>
    <div class="pw-src">Nguồn: <a href="https://www.eia.gov/outlooks/steo/" target="_blank" rel="noopener">EIA STEO ${src.issue || ''}</a> · bảng 3b, 3c; chỉ tháng đã có số, không dùng dự báo</div>`;
  const anchor = block('dau-khi-12'); if (!anchor) return; anchor.after(card);
  if (!window.Chart) return;
  new Chart(card.querySelector('canvas'), {type: 'bar', data: {labels: rows.map(r => r.name), datasets: [{data: rows.map(r => r.v), backgroundColor: rows.map(r => r.d == null ? '#2938A8' : r.d >= 0 ? '#2938A8' : '#8C95C9'), borderRadius: 6, barThickness: 20}]},
    options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, layout: {padding: {right: 120}}, plugins: {legend: {display: false}, tooltip: {callbacks: {label: c => ` ${nf(rows[c.dataIndex].v)} tr thùng/ngày` + (rows[c.dataIndex].d == null ? '' : ` · ${rows[c.dataIndex].d >= 0 ? '+' : ''}${nf(rows[c.dataIndex].d)} so cùng kỳ`)}}},
      scales: {x: {beginAtZero: true, grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', font: {size: 12}}}, y: {grid: {display: false}, ticks: {color: '#1F2A5C', font: {size: 13, weight: 600}}}}},
    plugins: [{id: 'ofLabels', afterDatasetsDraw(ch) { const {ctx} = ch, meta = ch.getDatasetMeta(0); ctx.save(); ctx.font = '600 12.5px Inter, sans-serif'; ctx.textBaseline = 'middle';
      meta.data.forEach((b, i) => { const r = rows[i]; ctx.fillStyle = '#1F2A5C'; ctx.fillText(nf(r.v), b.x + 8, b.y); if (r.d != null) { const w = ctx.measureText(nf(r.v)).width; ctx.fillStyle = r.d >= 0 ? '#17784A' : '#B3303F'; ctx.fillText(`${r.d >= 0 ? '▲ +' : '▼ '}${nf(r.d)}`, b.x + 16 + w, b.y); } }); ctx.restore(); }}]});
}

// Thẻ chỉ có một nội dung thì không gập (bỏ lớp research-fold, hiện tiêu đề gốc).
function unfoldCards(ids) {
  const go = () => ids.forEach(id => { const card = block(id); if (!card) return; card.querySelectorAll(':scope > details.research-fold').forEach(f => { const body = f.querySelector(':scope > .research-detail') || f; f.replaceWith(...[...body.childNodes].filter(n => n.tagName !== 'SUMMARY')); }); card.querySelectorAll('.research-repeated-heading').forEach(h => h.classList.remove('research-repeated-heading')); });
  go(); [800, 3000].forEach(t => setTimeout(go, t));
}

// Thẻ chart đường dùng chung cho các chart bổ sung (26/11/2026).
function lineCard(host, o) {
  if (!host || $('#' + o.id)) return null;
  const card = el('div', 'card ' + (o.wide === false ? '' : 'of-wide')); card.dataset.ofAdded = o.id;
  card.innerHTML = `<div class="chart-title">${o.title}</div>${o.sub ? `<div class="chart-sub">${o.sub}</div>` : ''}
    <div class="ct-canvas" style="position:relative;height:${o.h || 300}px"><canvas id="${o.id}" role="img" aria-label="${o.title}"></canvas></div>
    <div class="pw-src">Nguồn: ${o.src}</div>`;
  (o.before ? o.before.before(card) : host.append(card));
  if (!window.Chart) return card;
  const nf = (v, d) => v == null ? '—' : v.toLocaleString('vi-VN', {maximumFractionDigits: d ?? 1});
  new Chart(card.querySelector('canvas'), {type: o.type || 'line', data: {labels: o.labels, datasets: o.series.map(s => ({label: s.name, data: s.values, borderColor: s.color, backgroundColor: s.fill || s.color, borderWidth: 2, pointRadius: 0, tension: .25, yAxisID: s.axis || 'y', type: s.type, borderRadius: s.type === 'bar' || o.type === 'bar' ? 4 : 0, spanGaps: true}))},
    options: {responsive: true, maintainAspectRatio: false, interaction: {mode: 'index', intersect: false},
      plugins: {legend: {display: o.series.length > 1, position: 'bottom', labels: {usePointStyle: true, boxWidth: 8, color: '#3B4256', font: {size: 12.5}}}, tooltip: {callbacks: {label: c => ` ${c.dataset.label}: ${nf(c.parsed.y, o.digits)}${o.unit ? ' ' + o.unit : ''}`}}},
      scales: Object.assign({x: {grid: {display: false}, ticks: {color: '#6B7392', maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: {size: 12}}, stacked: !!o.stacked},
        y: {beginAtZero: !!o.zero, stacked: !!o.stacked, grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', font: {size: 12}, callback: v => nf(v, o.digits)}, title: o.yTitle ? {display: true, text: o.yTitle, color: '#6B7392'} : undefined}},
        o.y2 ? {y2: {position: 'right', grid: {display: false}, ticks: {color: '#6B7392', font: {size: 12}}, title: {display: true, text: o.y2, color: '#6B7392'}}} : {})}});
  return card;
}
const vnDate = d => { const [y, m, dd] = d.split('-'); return dd ? `${dd}/${m}/${y.slice(2)}` : `${m}/${y.slice(2)}`; };

// Vận tải: chỉ số cước tàu dầu thô (BDTI) và tàu sản phẩm (BCTI), 2 năm gần nhất, số ngày.
function tankerRates() {
  const s = window.SHIPPING_DAILY?.eastmoney?.series; if (!s?.bdti?.records?.length) return;
  const from = '2019-01-01';  // 26/11/2026: cả chuỗi East Money (từ 2019) thay vì 2 năm
  const bcti = new Map(s.bcti.records.map(r => [r[0], r[1]]));
  const rows = s.bdti.records.filter(r => r[0] >= from);
  lineCard($('#of-mt2-flows .of-body'), {id: 'chTankerIdx', title: 'Cước tàu dầu: Baltic Dirty Tanker (dầu thô) và Clean Tanker (sản phẩm) — 2 năm', sub: `điểm chỉ số, số ngày · mới nhất ${vnDate(rows.at(-1)[0])}: BDTI ${rows.at(-1)[1].toLocaleString('vi-VN')}, BCTI ${(bcti.get(rows.at(-1)[0]) ?? '—').toLocaleString('vi-VN')}`,
    labels: rows.map(r => vnDate(r[0])), series: [{name: 'BDTI · tàu dầu thô', color: '#2938A8', values: rows.map(r => r[1])}, {name: 'BCTI · tàu sản phẩm', color: '#59C5C8', values: rows.map(r => bcti.get(r[0]) ?? null)}], digits: 0,
    src: '<a href="https://data.eastmoney.com/cjsj/hyzs_list_EMI00107668.html" target="_blank" rel="noopener">East Money datacenter (số Baltic Exchange)</a> · cùng chuỗi dashboard Vận tải biển; PVT hưởng lợi khi cước tàu dầu tăng'});
}

// Khí & LNG: giá LNG châu Á (JKM) so với khí Mỹ (Henry Hub), bình quân tuần 2 năm — biên nhập LNG và giá khí đầu vào điện.
function lngPrices() {
  const src = window.SECTOR_DAILY?.sources, j = src?.lng_jkm?.records, h = src?.henry_hub?.records; if (!j?.length || !h?.length) return;
  const from = '2019-01-01';  // 26/11/2026: từ 2019 thay vì 2 năm
  const wk = d => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7)); return t.toISOString().slice(0, 10); };
  const avg = recs => { const m = new Map(); recs.filter(r => r.date >= from).forEach(r => { const k = wk(r.date); (m.get(k) || m.set(k, []).get(k)).push(r.value); }); return new Map([...m].map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length])); };
  const J = avg(j), H = avg(h), keys = [...J.keys()].sort();
  const lj = j.at(-1), lh = h.at(-1);
  lineCard($('#of-mt2-gas .of-body'), {id: 'chLngSpread', title: 'Giá LNG châu Á (JKM) so với khí Mỹ (Henry Hub) — bình quân tuần, 2 năm', sub: `USD/MMBtu · JKM ${lj.value.toLocaleString('vi-VN', {maximumFractionDigits: 2})} (${vnDate(lj.date)}), Henry Hub ${lh.value.toLocaleString('vi-VN', {maximumFractionDigits: 2})} (${vnDate(lh.date)}) · chênh lệch là dư địa giá LNG nhập về Việt Nam so với khí nội địa`,
    labels: keys.map(vnDate), series: [{name: 'JKM (LNG giao Nhật–Hàn)', color: '#2938A8', values: keys.map(k => J.get(k))}, {name: 'Henry Hub (Mỹ)', color: '#D4A72C', values: keys.map(k => H.get(k) ?? null)}], digits: 2, unit: 'USD/MMBtu', zero: true,
    src: `<a href="${src.lng_jkm.source_url}" target="_blank" rel="noopener">ICE · JKM (Platts) hợp đồng tương lai, dữ liệu biểu đồ công khai</a> · <a href="https://www.eia.gov/dnav/ng/hist/rngwhhdd.htm" target="_blank" rel="noopener">EIA · Henry Hub giao ngay</a>`});
}

// Chính sách › Thuế & xăng E10: dòng thời gian các mức thuế đang áp dụng (đã mở văn bản gốc, xem data/oil/evidence.json).
function taxTimeline() {
  const host = $('#of-mt4-tax .of-body'); if (!host || $('#of-tax')) return;
  const t = s => { const [d, m, y] = s.split('/').map(Number); return y + (m - 1) / 12 + (d - 1) / 365; };
  const y0 = 2026, y1 = 2027.5, X = v => ((Math.min(Math.max(v, y0), y1) - y0) / (y1 - y0) * 100).toFixed(2) + '%', W = (a, b) => ((Math.min(b, y1) - Math.max(a, y0)) / (y1 - y0) * 100).toFixed(2) + '%';
  const now = 2026 + 10 / 12 + 25 / 365;
  const L = (u, n) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`;
  const U19 = 'https://lsvn.vn/ban-hanh-nghi-quyet-ve-thue-xang-dau-va-nhien-lieu-bay-a172369.html', U43 = 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/9/43_2026_nq-cp_30092026_1-signed.signed.pdf',
    U45 = 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/11/45_2026_nq-cp_31102026-signed.signed.pdf', UE = 'https://hatinh.gov.vn/vi/bai-viet/bo-cong-thuong-chot-lo-trinh-cung-ung-xang-e10-tren-toan-quoc-tu-0162026';
  const rows = [
    ['Thuế bảo vệ môi trường', 'xăng, dầu, nhiên liệu bay', [['16/4/2026', '31/12/2026', '0 đồng/lít', 'cut', `${L(U19, 'NQ 19/2026/QH16')} · kéo dài bởi ${L(U43, 'NQ 43/2026/NQ-CP')}`]]],
    ['Thuế GTGT', 'xăng, dầu, nhiên liệu bay', [['16/4/2026', '31/12/2026', 'Không phải nộp, vẫn khấu trừ đầu vào', 'cut', `${L(U19, 'NQ 19/2026/QH16')} · ${L(U43, 'NQ 43/2026/NQ-CP')}`]]],
    ['Thuế tiêu thụ đặc biệt', 'xăng các loại', [['16/4/2026', '30/6/2026', '0%', 'cut', L(U19, 'NQ 19/2026/QH16')], ['1/11/2026', '31/3/2027', '0%', 'cut', L(U45, 'NQ 45/2026/NQ-CP')]]],
    ['Thuế nhập khẩu ưu đãi', 'xăng, dầu, nguyên liệu', [['9/3/2026', '31/12/2026', 'Mức ưu đãi theo NĐ 72/2026', 'cut', L(U43, 'NQ 43/2026/NQ-CP')]]],
    ['Xăng sinh học', 'TT 50/2025/TT-BCT', [['1/6/2026', '30/6/2027', 'E10 bắt buộc toàn quốc · E5 RON92 bán song song đến 31/12/2030', 'e10', L(UE, 'Bộ Công Thương')]]],
  ];
  const axis = ['1/2026', '4/2026', '7/2026', '10/2026', '1/2027', '4/2027'].map(m => { const [mm, yy] = m.split('/'); return `<span style="left:${X(+yy + (mm - 1) / 12)}">T${m}</span>`; }).join('');
  const card = el('div', 'card of-wide'); card.id = 'of-tax';
  card.innerHTML = `<div class="chart-title">Thuế xăng dầu đang được giảm thế nào, đến khi nào</div><div class="chart-sub">Mỗi thanh là một mức thuế đặc biệt đang áp dụng, đặt theo thời gian hiệu lực trong văn bản · ngoài các thanh: mức thuế theo luật thông thường</div>
    <div class="tx2"><div class="tx2-head"><div></div><div class="tx2-axis">${axis}<i class="gt-nowh" style="left:${X(now)}">Hôm nay</i></div></div>
    ${rows.map(([n, sub, bars]) => `<div class="tx2-row"><div class="gt-name"><b>${n}</b><small>${sub}</small></div><div class="tx2-lane"><i class="gt-now" style="left:${X(now)}"></i>${bars.map(([a, b, lab, k, src]) => `<div class="tx2-bar ${k}" style="left:${X(t(a))};width:${W(t(a), t(b) + 1 / 365)}" title="${a} → ${b}"><b>${lab}</b><small>${a} → ${b === '30/6/2027' ? 'tiếp tục' : b} · ${src}</small></div>`).join('')}</div></div>`).join('')}</div>
    <div class="pw-src">Nguồn: văn bản gốc trên Cổng thông tin Chính phủ (NQ 43, NQ 45), Luật sư Việt Nam (tóm lược NQ 19), Bộ Công Thương qua VOV (TT 50/2025). Từ 01/10/2026 thuế TTĐB xăng theo Luật 66/2025 cho tới khi NQ 45 có hiệu lực.</div>`;
  host.append(card);
}

// Hải quan / Cục Thống kê theo tháng (data/oil-public-data.js): nhập xăng dầu, dầu thô, LPG; xuất dầu thô; sản lượng khai thác.
function vnMonthly() {
  const P = window.OIL_PUBLIC; if (!P) return;
  const C = P.customs?.series || {}, N = P.nso?.series || {};
  const lab = m => { const [y, mm] = m.split('-'); return `T${+mm}/${y.slice(2)}`; };
  const cusSrc = `<a href="${P.customs.url}" target="_blank" rel="noopener">Cục Hải quan · số liệu xuất nhập khẩu hằng tháng</a> (báo cáo 2N/2X, bản tốt nhất mỗi tháng)`;
  const pair = (host, id, title, vk, qk, color) => { const v = C[vk], q = C[qk]; if (!v) return; const ms = Object.keys(v).filter(m => m >= '2024-01').sort(); if (!ms.length) return;
    const last = ms.at(-1), yoy = v[(+last.slice(0, 4) - 1) + last.slice(4)];
    lineCard(host, {id, title, sub: `Tháng ${lab(last).slice(1)}: ${q ? Math.round(q[last] / 1000).toLocaleString('vi-VN') + ' nghìn tấn · ' : ''}${Math.round(v[last]).toLocaleString('vi-VN')} triệu USD${yoy ? ` (${v[last] >= yoy ? '+' : ''}${Math.round((v[last] / yoy - 1) * 100)}% so cùng kỳ)` : ''}`,
      labels: ms.map(lab), series: [...(q ? [{name: 'Lượng (nghìn tấn)', type: 'bar', color: color, fill: color + '99', values: ms.map(m => q[m] != null ? q[m] / 1000 : null)}] : []), {name: 'Trị giá (triệu USD)', type: 'line', color: '#1F2A5C', axis: q ? 'y2' : 'y', values: ms.map(m => v[m])}],
      y2: q ? 'triệu USD' : null, yTitle: q ? 'nghìn tấn' : 'triệu USD', zero: true, digits: 0, src: cusSrc}); };
  pair($('#of-mt2-retail .of-body'), 'chImpFuel', 'Nhập khẩu xăng dầu thành phẩm theo tháng', 'imp_fuel', 'imp_fuel_q', '#2938A8');
  pair($('#of-mt2-refining .of-body'), 'chImpCrude', 'Nhập khẩu dầu thô theo tháng (nguyên liệu lọc dầu)', 'imp_crude', 'imp_crude_q', '#7C3AED');
  pair($('#of-mt2-gas .of-body'), 'chImpLpg', 'Nhập khẩu khí đốt hóa lỏng (LPG) theo tháng', 'imp_lpg', 'imp_lpg_q', '#59C5C8');
  pair($('#of-mt2-upstream .of-body'), 'chExpCrude', 'Xuất khẩu dầu thô theo tháng', 'exp_crude', 'exp_crude_q', '#D4A72C');
  const nsoSrc = `<a href="${P.nso.url}" target="_blank" rel="noopener">Cục Thống kê · biểu số liệu kinh tế – xã hội hằng tháng</a>`;
  if (N.crude_output || N.gas_output) { const ms = [...new Set([...Object.keys(N.crude_output || {}), ...Object.keys(N.gas_output || {})])].filter(m => m >= '2024-01').sort();
    if (ms.length) lineCard($('#of-mt2-upstream .of-body'), {id: 'chVnOutputM', title: 'Sản lượng khai thác dầu thô và khí tự nhiên Việt Nam theo tháng', sub: 'dầu thô: nghìn tấn · khí: triệu m³ · tháng hiện tại là ước tính của Cục Thống kê', labels: ms.map(lab),
      series: [{name: 'Dầu thô (nghìn tấn)', type: 'bar', color: '#2938A8', fill: '#2938A899', values: ms.map(m => N.crude_output?.[m] ?? null)}, {name: 'Khí tự nhiên (triệu m³)', type: 'line', color: '#59C5C8', axis: 'y2', values: ms.map(m => N.gas_output?.[m] ?? null)}], y2: 'triệu m³', yTitle: 'nghìn tấn', zero: true, digits: 0, src: nsoSrc}); }
}
// Sub-tab đã có chart bổ sung thì ẩn ô "Chưa có dữ liệu cho mục này".
function hideEmptyGaps() { $$('.of-body').forEach(b => { if (b.querySelector('[data-of-added], #of-tax')) b.querySelectorAll(':scope > .of-gap').forEach(g => { if (/Chưa có dữ liệu cho mục này/.test(g.textContent)) g.hidden = true; }); }); }

// Chỉ số vận hành doanh nghiệp (nhập tay, đã mở trang gốc; xem data/oil/evidence.json khối dau-khi-ops).
function opsCards() {
  const kpi = (host, id, title, items, src) => { if (!host || $('#' + id)) return; const c = el('div', 'card of-wide of-ops'); c.id = id; c.dataset.ofAdded = id;
    c.innerHTML = `<div class="chart-title">${title}</div><div class="of-ops-grid">${items.map(([k, v, u, note]) => `<div class="of-ops-i"><span>${k}</span><b>${v}<small>${u}</small></b><em>${note}</em></div>`).join('')}</div><div class="pw-src">Nguồn: ${src} · số doanh nghiệp công bố, báo chí trích lại; BCTC quý chưa kiểm toán</div>`; host.append(c); };
  kpi($('#of-mt2-gas .of-body'), 'of-ops-thivai', 'Kho LNG Thị Vải (PV GAS) — năng lực nhập và tái hóa LNG', [
    ['Công suất tái hóa hiện tại', '288', ' tấn/giờ', 'chạy thử thành công, công bố 07/04/2026'], ['Công suất thiết kế ban đầu', '171', ' tấn/giờ', 'tăng khoảng 68% sau nâng cấp'],
    ['Tương đương', '9,5', ' triệu m³ khí/ngày', 'quy đổi theo công bố của PV GAS'], ['Giai đoạn 2', '1 → 3', ' triệu tấn/năm', 'dự kiến hoàn thành 2029']],
    '<a href="https://vir.com.vn/pv-gas-increases-capacity-of-thi-vai-lng-terminal-150173.html" target="_blank" rel="noopener">VIR 08/04/2026</a> · <a href="https://baonghean.vn/en/doan-cong-tac-tinh-nghe-an-khao-sat-kho-cang-lng-thi-vai-10330025.html" target="_blank" rel="noopener">Báo Nghệ An 25/03/2026</a>');
  kpi($('#of-mt2-upstream .of-body'), 'of-ops-pvd', 'PV Drilling (PVD) — quý 3/2026', [
    ['Hiệu suất sử dụng giàn', '91', '%', 'cùng kỳ 87%'], ['Giàn thuê hoạt động bình quân', '3,7', ' giàn', 'cùng kỳ 1,1 giàn'],
    ['Doanh thu thuần', '3.213,5', ' tỷ đồng', '+25% so cùng kỳ'], ['Lãi gộp', '410,5', ' tỷ đồng', '−32,6% so cùng kỳ'], ['LNST hợp nhất', '81,7', ' tỷ đồng', '−70,5% so cùng kỳ']],
    '<a href="https://doanhnhan.baophapluat.vn/pv-drilling-pvd-loi-nhuan-quy-iii-lao-doc-70-vi-ganh-nang-lai-vay.html" target="_blank" rel="noopener">Doanh nhân · Báo Pháp luật 03/11/2026, trích BCTC hợp nhất Q3/2026 và giải trình của PVD</a> · PVD không công bố giá thuê giàn bình quân trong BCTC');
  kpi($('#of-mt2-gas .of-body'), 'of-ops-gas', 'PV GAS (GAS) — quý 3/2026', [
    ['Khí khô và LNG tiêu thụ', '+24', '%', 'so cùng kỳ'], ['Brent bình quân quý', '97', ' USD/thùng', 'cùng kỳ 69'],
    ['Doanh thu thuần', '39.708', ' tỷ đồng', '+11,26% so cùng kỳ'], ['LNST', '4.569', ' tỷ đồng', '+74,86% so cùng kỳ'], ['Biên lãi gộp', '15,66', '%', 'cùng kỳ 11,49%']],
    '<a href="https://mekongasean.vn/khi-kho-va-lng-dan-dat-da-tang-truong-doanh-thu-cua-pv-gas-trong-quy-3-61334.html" target="_blank" rel="noopener">Mekong ASEAN 31/10/2026, theo BCTC hợp nhất Q3/2026 và thuyết minh</a> · BCTC không tách sản lượng tuyệt đối theo quý');
  kpi($('#of-mt2-refining .of-body'), 'of-ops-bsr', 'Lọc dầu Dung Quất (BSR) — 9 tháng 2026', [
    ['Sản lượng sản xuất', '6,15', ' triệu tấn', 'khoảng, 9 tháng 2026'], ['Sản lượng tiêu thụ', '6,08', ' triệu tấn', 'khoảng, 9 tháng 2026']],
    '<a href="https://giaoduc.net.vn/bsr-cung-co-noi-luc-mo-rong-khong-gian-tang-truong-post263415.gd" target="_blank" rel="noopener">Giáo dục & Thời đại, hội thảo nhà đầu tư BSR 15/10/2026</a>');
}

// Cung – cầu: một chart gộp. Cột = cung trừ cầu (trục phải, xanh dư cung / đỏ thiếu cung), đường = cung và cầu (trục trái).
function supplyDemandCombo() {
  const wb = window.SECTOR_DAILY?.sources?.world_balance, rec = wb?.records; const old = $('#chWorldSD'); if (!rec?.length || !old || $('#chSDCombo')) return;
  const sdCard = old.closest('.fs-share-host') || old.closest('.card'), gapCard = $('#chWorldBalance')?.closest('.fs-share-host') || $('#chWorldBalance')?.closest('.card');
  const labels = rec.map(r => r.year + (r.estimate ? 'E' : '')), nf = (v, d = 2) => v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
  const last = rec.filter(r => !r.estimate).at(-1), next = rec.filter(r => r.estimate);
  const sub = `triệu thùng/ngày, bình quân năm · ${last.year}: cung ${nf(last.supply)}, cầu ${nf(last.demand)} → ${last.balance >= 0 ? 'dư' : 'thiếu'} ${nf(Math.abs(last.balance))}` + (next.length ? ` · EIA dự báo ${next.map(r => `${r.year}E ${r.balance >= 0 ? 'dư' : 'thiếu'} ${nf(Math.abs(r.balance))}`).join(', ')}` : '');
  const card = lineCard(sdCard.parentElement, {id: 'chSDCombo', before: sdCard, title: 'Cân bằng cung – cầu dầu toàn cầu', sub, h: 360,
    labels, series: [], src: `<a href="https://www.eia.gov/outlooks/steo/" target="_blank" rel="noopener">EIA STEO ${wb.issue || ''}</a> · bảng 3a: cung (papr_world), cầu (patc_world); năm có tháng dự báo ghi E`});
  if (!card) return;
  const t = sdCard.querySelector('details'); if (t) card.append(t);
  const cv = card.querySelector('canvas'), ch = window.Chart?.getChart?.(cv); if (ch) ch.destroy();
  const bal = rec.map(r => r.balance), lim = Math.ceil(Math.max(...bal.map(Math.abs)) + .5);
  new Chart(cv, {data: {labels, datasets: [
      {type: 'line', label: 'Cung toàn cầu', data: rec.map(r => r.supply), borderColor: '#7A1F4F', backgroundColor: '#7A1F4F', borderWidth: 2.5, pointRadius: 4, tension: .2, yAxisID: 'y', order: 1, segment: {borderDash: c => rec[c.p1DataIndex]?.estimate ? [6, 4] : undefined}},
      {type: 'line', label: 'Cầu toàn cầu', data: rec.map(r => r.demand), borderColor: '#2BA5A8', backgroundColor: '#2BA5A8', borderWidth: 2.5, pointRadius: 4, tension: .2, yAxisID: 'y', order: 1, segment: {borderDash: c => rec[c.p1DataIndex]?.estimate ? [6, 4] : undefined}},
      {type: 'bar', label: 'Cung trừ cầu (dư + / thiếu −)', data: bal, backgroundColor: rec.map(r => (r.balance >= 0 ? 'rgba(43,165,168,' : 'rgba(229,72,77,') + (r.estimate ? '.35)' : '.6)')), borderColor: rec.map(r => r.balance >= 0 ? '#2BA5A8' : '#E5484D'), borderWidth: rec.map(r => r.estimate ? 1.5 : 0), borderRadius: 4, barPercentage: .55, yAxisID: 'y2', order: 2}]},
    options: {responsive: true, maintainAspectRatio: false, interaction: {mode: 'index', intersect: false},
      plugins: {legend: {position: 'bottom', labels: {usePointStyle: true, boxWidth: 8, color: '#3B4256', font: {size: 12.5}}}, tooltip: {callbacks: {label: c => ` ${c.dataset.label}: ${nf(c.parsed.y)} tr thùng/ngày`}}},
      scales: {x: {grid: {display: false}, ticks: {color: '#3B4256', font: {size: 12.5, weight: 600}}},
        y: {position: 'left', grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', callback: v => nf(v, 0)}, title: {display: true, text: 'Cung, cầu (tr thùng/ngày)', color: '#6B7392'}},
        y2: {position: 'right', min: -lim, max: lim, grid: {display: false}, ticks: {color: '#6B7392', callback: v => (v > 0 ? '+' : '') + nf(v, 0)}, title: {display: true, text: 'Cung − cầu', color: '#6B7392'}}}},
    plugins: [{id: 'zeroLine', afterDraw(c) { const y = c.scales.y2.getPixelForValue(0), {left, right} = c.chartArea, x = c.ctx; x.save(); x.strokeStyle = '#9AA1BC'; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(left, y); x.lineTo(right, y); x.stroke(); x.restore(); }}]});
  [sdCard, gapCard].forEach(n => { if (n) { n.hidden = true; n.classList.add('of-hidden-legacy'); } });
}

// Động lực cung cầu: một biểu đồ thanh hai chiều (âm trái, dương phải) thay cho 4 ô nhỏ; số giữ nguyên từ research-sources.js.
function driversChart() {
  const card = $('#opec-drivers'), grid = card?.querySelector('.opec-driver-grid'); if (!grid || card.querySelector('.dv')) return;
  const groups = [
    ['Cung', [['OPEC+ so với mục tiêu', -6, 'T7/2026 · IEA'], ['Vùng Vịnh so với trước chiến sự', -8.3, 'T7/2026 · IEA'], ['Cung toàn cầu 2026E', -4.3, 'so cùng kỳ, cả năm']]],
    ['Cầu', [['Tăng trưởng cầu 2026 · IEA', -1.6, 'dự báo tại T8/2026'], ['Tăng trưởng cầu 2026 · OPEC', 0.58, 'dự báo tại T8/2026']]],
    ['Lọc dầu', [['Công suất chạy lọc dầu toàn cầu', -5, 'T7/2026 so cùng kỳ, xấp xỉ']]],
  ];
  const max = 9, pct = v => (Math.abs(v) / max * 50).toFixed(2) + '%', nf = v => (v > 0 ? '+' : '') + v.toLocaleString('vi-VN');
  const box = el('div', 'dv');
  box.innerHTML = `<div class="dv-axis"><span>← giảm</span><span>0</span><span>tăng →</span></div>` + groups.map(([g, rows]) => `<div class="dv-g">${g}</div>` + rows.map(([l, v, n]) =>
    `<div class="dv-row"><div class="dv-l"><b>${l}</b><small>${n}</small></div><div class="dv-track"><i class="dv-zero"></i><span class="dv-bar ${v < 0 ? 'neg' : 'pos'}" style="${v < 0 ? 'right:50%' : 'left:50%'};width:${pct(v)}"></span><em class="dv-v ${v < 0 ? 'neg' : 'pos'}" style="${v < 0 ? `right:calc(50% + ${pct(v)} + 6px)` : `left:calc(50% + ${pct(v)} + 6px)`}">${nf(v)}</em></div></div>`).join('')).join('') +
    `<p class="dv-note">Triệu thùng/ngày. Các dòng dùng mốc so sánh khác nhau nên không cộng với nhau. Nguồn cung bù từ ngoài OPEC (Mỹ, Brazil, Canada, Guyana, Argentina, Na Uy) xem chart sản lượng 10 nước xuất khẩu lớn phía trên.</p>`;
  grid.replaceWith(box);
  const sub = card.querySelector('.chart-sub'); if (sub) sub.textContent = 'Thay đổi so với mốc tham chiếu · bản nguồn tháng 8/2026';
}

// Đóng góp vào thay đổi cung và cầu so cùng kỳ (EIA STEO, tháng gần nhất có số): nước/khu vực nào kéo tăng, kéo giảm.
function contribCharts() {
  const S = window.SECTOR_DAILY?.sources, anchor = $('#chSDCombo')?.closest('.card'); if (!anchor || $('#of-contrib-supply')) return;
  const nf = (v, d = 2) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
  const build = (src, id, kind) => {
    const rec = src?.records; if (!rec?.length) return null;
    const last = rec.at(-1), ym = last.date.slice(0, 7), prev = rec.find(r => r.date.slice(0, 7) === (+ym.slice(0, 4) - 1) + ym.slice(4)); if (!prev) return null;
    const names = src.names, keys = Object.keys(names).filter(k => k !== 'WD');
    const rows = keys.map(k => [names[k], last[k] - prev[k]]);
    const total = last.WD - prev.WD, other = total - rows.reduce((a, r) => a + r[1], 0);
    rows.push([kind === 'cung' ? 'Các nước khác' : 'Khu vực khác', other]);
    rows.sort((a, b) => a[1] - b[1]);
    const max = Math.max(...rows.map(r => Math.abs(r[1])), Math.abs(total)) * 1.15, pct = v => (Math.abs(v) / max * 50).toFixed(2) + '%';
    const mm = `${+ym.slice(5)}/${ym.slice(0, 4)}`, mp = `${+ym.slice(5)}/${+ym.slice(0, 4) - 1}`;
    const down = rows.filter(r => r[1] < -0.05).slice(0, 3), up = rows.filter(r => r[1] > 0.05).reverse().slice(0, 3);
    const lead = `${kind === 'cung' ? 'Cung' : 'Cầu'} dầu toàn cầu tháng ${mm} ${total < 0 ? 'giảm' : 'tăng'} <b>${nf(Math.abs(total)).replace(/^[+−]/, '')}</b> triệu thùng/ngày so với ${mp} (${last.WD.toLocaleString('vi-VN', {maximumFractionDigits: 2})} so với ${prev.WD.toLocaleString('vi-VN', {maximumFractionDigits: 2})}).` +
      (down.length ? ` Kéo giảm: ${down.map(r => `${r[0]} <b class="neg">${nf(r[1])}</b>`).join(', ')}.` : '') + (up.length ? ` ${total < 0 ? 'Bù lại' : 'Kéo tăng'}: ${up.map(r => `${r[0]} <b class="pos">${nf(r[1])}</b>`).join(', ')}.` : '');
    const bar = (l, v, cls = '') => `<div class="dv-row ${cls}"><div class="dv-l"><b>${l}</b></div><div class="dv-track"><i class="dv-zero"></i><span class="dv-bar ${v < 0 ? 'neg' : 'pos'}" style="${v < 0 ? 'right:50%' : 'left:50%'};width:${pct(v)}"></span><em class="dv-v ${v < 0 ? 'neg' : 'pos'}" style="${v < 0 ? `right:calc(50% + ${pct(v)} + 6px)` : `left:calc(50% + ${pct(v)} + 6px)`}">${nf(v)}</em></div></div>`;
    const card = el('div', 'card of-wide'); card.id = id; card.dataset.ofAdded = id;
    card.innerHTML = `<div class="chart-title">${kind === 'cung' ? 'Thay đổi nguồn cung dầu toàn cầu theo quốc gia' : 'Thay đổi nhu cầu dầu toàn cầu theo khu vực'}</div>
      <p class="of-lead">${lead}</p><div class="dv">${bar(`Tổng ${kind} toàn cầu`, total, 'dv-total')}${rows.map(r => bar(r[0], r[1])).join('')}</div>
      <div class="pw-src">Nguồn: <a href="https://www.eia.gov/outlooks/steo/" target="_blank" rel="noopener">EIA STEO ${src.issue || ''}</a> · ${kind === 'cung' ? 'sản lượng tổng chất lỏng, bảng 3b, 3c; "các nước khác" = thế giới trừ 10 nước' : 'tiêu thụ, bảng 3e; "khu vực khác" = thế giới trừ các nhóm trên (Canada, Mexico, châu Á khác…)'} · triệu thùng/ngày, số ước tính của EIA có thể được sửa ở bản sau</div>`;
    return card;
  };
  const sup = build(S?.top_producers, 'of-contrib-supply', 'cung'), dem = build(S?.world_demand, 'of-contrib-demand', 'cầu');
  if (sup) anchor.after(sup); if (dem) (sup || anchor).after(dem);
}
function run() {
  if (document.body.dataset.oilFrame) return; document.body.dataset.oilFrame = '1';
  style();
  channelDiagram();
  gasTimeline();
  stickySub();
  // Hormuz: thẻ đang nằm trong chủ đề "Hormuz · dòng chảy & tác động" ở Chủ đề nóng → Bức tranh ngành › 06.
  ['mt1', 'mt2', 'mt4'].forEach(buildTab);
  // Thẻ truyền dẫn dau-khi-38 nằm cùng chủ đề Hormuz; đã dời sang Tổng quan › 01. Chủ đề rỗng thì ẩn.
  // Chủ đề Hormuz giữ lại (ghi chú chuyên viên lưu theo chủ đề), thêm đường dẫn tới số liệu đã chuyển.
  $$('.majorpane[data-tab="mt7"] .research-topic').forEach(t => {
    if (!/Hormuz/.test(t.textContent) || t.querySelector('.of-moved')) return;
    const a = el('p', 'research-caption of-moved', 'Biểu đồ Hormuz, Bab el-Mandeb và xuất khẩu dầu Trung Đông đã chuyển sang <a href="#of-mt2-flows">Bức tranh ngành › 06 Vận tải & dòng chảy</a>; năm kênh truyền dẫn ở <a href="#of-mt1-chain">Tổng quan › 01 Chuỗi giá trị</a>.');
    (t.querySelector('details.research-fold > :not(summary)') || t).prepend(a);
  });
  topExporters();
  unfoldCards(['dau-khi-28']);
  crudeLayout();
  supplyDemandCombo();
  driversChart();
  contribCharts();
  tankerRates();
  lngPrices();
  taxTimeline();
  vnMonthly();
  opsCards();
  // 26/11/2026: Giá sản phẩm USGC (Brent, xăng, diesel) trùng chart Crack spread USGC, cùng ba chuỗi EIA.
  { const m = block('dau-khi-21'); if (m) { m.hidden = true; m.classList.add('of-hidden-legacy'); } }
  hideEmptyGaps();
  const finHost = financePane();
  nav(finHost);
  // Tab Sources không còn trong thanh tab (nguồn đã ghi dưới từng chart, như Điện); nội dung vẫn trong DOM.
  shortTitles(); setTimeout(shortTitles, 1600);  // lần hai sau các module đặt lại tiêu đề muộn
  window.dispatchEvent(new Event('oil:frame'));
}
// 26/11/2026: tiêu đề chart gọn ở Bức tranh ngành; kỳ và đơn vị để ở dòng phụ dưới tiêu đề.
function shortTitles() {
  const T = {chSDCombo: 'Cân bằng cung – cầu dầu toàn cầu', chSpare: 'Công suất dự phòng OPEC và gián đoạn cung',
    chCrudeStock: 'Tồn kho dầu thô Mỹ', chProdStock: 'Tồn kho xăng và distillate Mỹ', chDistYear: 'Tồn kho distillate Mỹ theo mùa', chCushing: 'Tồn kho Cushing',
    chBrentYear: 'Giá Brent bình quân năm', chCurve: 'Đường cong kỳ hạn WTI', chCot: 'Vị thế ròng quỹ đầu cơ WTI',
    chVnUpstream: 'Sản lượng dầu khí Việt Nam theo năm', chVnOutputM: 'Sản lượng dầu khí Việt Nam theo tháng', chExpCrude: 'Xuất khẩu dầu thô Việt Nam',
    chGasVol: 'Khí vào bờ và LNG nhập khẩu', chGasCustomer: 'Vị thế của PV GAS trong nền kinh tế', chLngSpread: 'Giá LNG châu Á và khí Mỹ', chImpLpg: 'Nhập khẩu LPG',
    chSingaporeCrack: 'Crack spread Singapore', chCrack: 'Crack spread Mỹ', chImpCrude: 'Nhập khẩu dầu thô',
    chRetailFuelMini: 'Giá bán lẻ xăng dầu', chImpFuel: 'Nhập khẩu xăng dầu thành phẩm',
    chHormuzM: 'Tàu dầu qua Hormuz', chBabMandeb: 'Lưu lượng tàu qua Bab el-Mandeb', chMiddleEastExports: 'Xuất khẩu dầu thô Ả Rập Xê Út và Kuwait', chTankerIdx: 'Cước tàu dầu Baltic'};
  Object.entries(T).forEach(([id, t]) => document.querySelectorAll('[id="' + id + '"]').forEach(c => {
    if (!c.closest('[id^="of-mt2"]')) return;
    const h = (c.closest('.fs-share-host') || c.closest('.card'))?.querySelector('.chart-title'); if (!h) return;
    const n = [...h.childNodes].find(x => x.nodeType === 3 && x.textContent.trim()); if (n) n.textContent = t; else h.prepend(t);
  }));
}

// 26/11/2026: dựng khung trong lượt SectorBoot (mốc 1600, sau mọi module ≤ 1500) để trang chỉ hiện khi khung đã xong.
// Trước đây chạy load + 1700 ms, tức SAU khi sector-boot đã hiện trang: người xem thấy bố cục cũ rồi giật sang khung mới.
if (window.SectorBoot) SectorBoot.add(1600, run);
else { const start = () => setTimeout(run, 1700); if (document.readyState === 'complete') start(); else window.addEventListener('load', start); }
})();
