/* BĐS dân cư · khung 5 tab theo flow ngành Dầu khí / Điện (26/11/2026). Chép phần dựng tab từ Dau-khi/app/oil-frame.js.
   Tab lớn: Tổng quan ngành (00 Bản đồ ngành · 01 Mô hình kinh doanh · 02 Vị trí chu kỳ)
          · Bức tranh ngành (01 Vĩ mô & FDI · 02 Nguồn cung · 03 Giao dịch & tồn kho · 04 Giá nhà & chi phí · 05 Tín dụng & trái phiếu · 06 Hạ tầng)
          · Chính sách (01 Luật mới 2026 · 02 Đất đai & bảng giá đất · 03 Nhà ở & NOXH · 04 Tín dụng & trái phiếu · 05 Văn bản & dự án theo dõi)
          · Tài chính ngành (#mt14, app/re-finance.js) · Chủ đề nóng.
   Card cũ được DỜI theo data-block-id, không nhân bản, không xóa. Deep-link: Bat-dong-san/?sub=<khóa>#mt2.
   Link cũ: #mt3 → Bức tranh › 04, #mt10 → Bức tranh › 05, #mt12 → Bức tranh › 06, #mt11 → Chính sách › 05, #mt6/#mt8 → Tổng quan. */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
if (!$('[data-block-id="bds-01"]') || !$('[data-block-id="bds-28"]')) return;  // chỉ trang BĐS dân cư
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const block = id => $(`[data-block-id="${id}"]`);
const byCanvas = id => $('#' + id)?.closest('.card,.viz-block');

const GAP = t => `<p class="data-gap of-gap">${t}</p>`;
const HIDE = ['bds-51'];
const HIDE_SEL = ['.business-models'];  // 26/11/2026: người dùng bỏ thẻ tính trả góp mua nhà 3 tỷ
const TREE = {
  mt1: {label: 'Tổng quan ngành', title: 'Tổng quan ngành BĐS dân cư', intro: 'Chuỗi giá trị → mô hình kinh doanh → doanh nghiệp niêm yết → vị trí chu kỳ.', subs: [
    {k: 'map', n: '00', t: 'Bản đồ ngành', d: 'Quỹ đất → pháp lý → vốn → xây dựng → bán hàng → bàn giao, mỗi khâu gắn mã niêm yết.', sel: ['.research-roadmap', '.value-chain-card'], ids: ['bds-01']},
    {k: 'model', n: '01', t: 'Mô hình kinh doanh', d: 'Doanh nghiệp kiếm tiền từ đâu, người mua trả tiền thế nào.', ids: [], rest: true},  // 26/11/2026: bỏ thẻ mô tả cũ .business-models (lặp Bản đồ ngành)
    {k: 'cycle', n: '02', t: 'Vị trí chu kỳ', d: 'Giá, thanh khoản và vốn đang ở đâu trong chu kỳ.', ids: ['bds-02']},
  ]},
  mt2: {label: 'Bức tranh ngành', title: 'Bức tranh ngành', intro: 'Theo chuỗi: vĩ mô & vốn ngoại → nguồn cung → giao dịch → giá → vốn vay → hạ tầng.', subs: [
    {k: 'macro', n: '01', t: 'Vĩ mô & FDI', d: 'GDP ngành, vốn FDI vào BĐS và CPI nhà ở.', ids: ['bds-04', 'bds-05', 'bds-05c', 'bds-05d', 'bds-05b', 'bds-06']},
    {k: 'supply', n: '02', t: 'Nguồn cung', d: 'Căn hộ mở bán mới theo thành phố, khu vực, mức giá; tỉnh lớn.', ids: ['bds-08b', 'bds-08', 'bds-08c', 'bds-08e', 'bds-08d']},
    {k: 'demand', n: '03', t: 'Giao dịch & tồn kho', d: 'Giao dịch thành công và tồn kho chủ đầu tư theo quý.', ids: ['bds-07', 'bds-07b'],
      gap: 'Chưa có chuỗi tỷ lệ hấp thụ theo quý cùng định nghĩa cho cả Hà Nội và TP.HCM.'},
    {k: 'price', n: '04', t: 'Giá nhà & chi phí', d: 'Giá sơ cấp Hà Nội, TP.HCM; giá thép, xi măng.', ids: ['bds-13', 'bds-13b', 'bds-52', 'bds-14', 'bds-15']},
    {k: 'capital', n: '05', t: 'Tín dụng & trái phiếu', d: 'Lãi suất, tín dụng BĐS, phát hành – đáo hạn – chậm trả trái phiếu.', ids: ['bds-16', 'bds-36', 'bds-33', 'bds-34', 'bds-35', 'bds-28', 'bds-29', 'bds-30', 'bds-31', 'bds-32'],
      gap: 'Chưa có chuỗi tín dụng kinh doanh BĐS theo tháng (NHNN chỉ công bố theo đợt).'},
    {k: 'infra', n: '06', t: 'Hạ tầng', d: 'Cao tốc và dự án hạ tầng trọng điểm mở quỹ đất mới.', ids: ['bds-48', 'bds-50']},
  ]},
  mt4: {label: 'Chính sách', title: 'Chính sách', intro: 'Luật, đất đai, nhà ở xã hội, tín dụng: tác động lên vòng đời dự án và từng doanh nghiệp.', subs: [
    {k: 'law', n: '01', t: 'Luật mới 2026', d: 'Luật đổi gì trong vòng đời dự án, tác động theo doanh nghiệp, lộ trình.', ids: ['bds-44', 'bds-60', 'bds-57', 'bds-58', 'bds-59'], rest: true},
    {k: 'land', n: '02', t: 'Đất đai & bảng giá đất', d: 'Luật Đất đai 2024 và bảng giá đất 2026.', ids: ['bds-19', 'bds-38']},
    {k: 'housing', n: '03', t: 'Nhà ở & NOXH', d: 'Luật Nhà ở, Kinh doanh BĐS và cơ chế nhà ở xã hội.', ids: ['bds-20']},
    {k: 'credit', n: '04', t: 'Tín dụng & trái phiếu', d: 'Chỉ đạo tín dụng và trái phiếu BĐS đang áp dụng.', ids: ['bds-21']},
    {k: 'docs', n: '05', t: 'Văn bản & dự án theo dõi', d: 'Văn bản đang hiệu lực, sắp ban hành; dự án và cơ chế thí điểm.', ids: ['bds-37', 'bds-39']},
  ]},
};
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt4', 'Chính sách'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
const ALIAS = {mt3: 'mt2:price', mt10: 'mt2:capital', mt12: 'mt2:infra', mt11: 'mt4:docs', mt5: 'mt1', mt6: 'mt1', mt8: 'mt1'};

function style() {
  const st = el('style'); st.id = 're-frame-style';
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
/* Thang chữ thống nhất (theo Dầu khí) (26/11/2026): tiêu đề thẻ 16 · chữ thường 14 · chú thích 12.5; ba màu chữ */
body[data-re-frame] .majorpane{--of-t1:#1F2A5C;--of-t2:#3B4256;--of-t3:#6B7392}
body[data-re-frame] .majorpane :is(.chart-title,.card>h3,.card>h4,.card .research-detail>h3,.research-fold>summary,.business-model h3,.opec-drivers h3,.sectionhead h2.sec,.of-section h2){font:700 16px/1.35 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important;letter-spacing:-.005em}
body[data-re-frame] .majorpane :is(.business-models>h2,.research-roadmap>h2,.section>h2,.sectionhead h2){font:700 20px/1.3 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important}
body[data-re-frame] .majorpane :is(.card p,.card li,.card td,.research-detail p,.business-model p,.tx-mech,.tx-who,.gt-lab b){font-size:14px!important;line-height:1.55!important;color:var(--of-t2)!important}
body[data-re-frame] .majorpane :is(.card th,.chart-sub,.note,.source-note,.research-caption,.srcrow,.srcrow a,.pw-src,.card small,.gt-lab small,.gt-name small,.tx-k,.ct-period label,.cts-legend button){font-size:12.5px!important;line-height:1.5!important;color:var(--of-t3)!important}
body[data-re-frame] .majorpane .card th{font-weight:600!important}
body[data-re-frame] .majorpane :is(.card td b,.card p b,.tx-ch,.gt-name b){color:var(--of-t1)!important}
body[data-re-frame] .majorpane .card [style*="font-size:12.5px"]{font-size:14px!important;color:var(--of-t2)!important}
:root[data-theme=dark] body[data-re-frame] .majorpane{--of-t1:#E8EBFA;--of-t2:#C4C9E2;--of-t3:#9AA1BC}
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
  HIDE.forEach(id => $$(`[data-block-id="${id}"]`).forEach(n => { n.hidden = true; n.classList.add('of-hidden-legacy'); }));
  const sec = el('section', 'section of-section');
  const brief = key === 'mt1' && $('#dataBrief'); if (brief) sec.append(brief);
  const nav = el('div', 'of-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', def.title); sec.append(nav);
  const used = new Set();
  const subs = def.subs.map((s, i) => {
    const b = el('button', 'of-tab', `<span class="of-n">${String(i + 1).padStart(2, '0')}</span><b>${s.t}</b>`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `of-${key}-${s.k}-tab`;
    const p = el('div', 'pane-subpane of-pane'); p.id = `of-${key}-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
        const body = el('div', 'of-body'); p.append(body);
    if (s.kpis) { const k = $('.majorpane .kpis'); if (k) { body.append(k); used.add(k); } }
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
  sec.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>Số liệu tài chính của 13 doanh nghiệp BĐS dân cư niêm yết, tổng hợp theo nhóm, từ BCTC hợp nhất quý.</p></div>'));
  const host = el('div', 'of-fin'); host.id = 're-fin-root'; sec.append(host); p.replaceChildren(sec);
  // So sánh tài chính & định giá (chart xu hướng + bảng) thuộc Tài chính ngành; Tổng quan chỉ giữ mô hình kinh doanh.
  // 26/11/2026 (người dùng chốt): doanh nghiệp theo dõi + backlog cover (bds-03, bds-53 nằm trong) và P/B theo phiên (bds-17) thuộc Tài chính ngành.
  const dn = el('div', 'of-fin-listed'); ['bds-03', 'bds-17'].forEach(id => { const n = block(id); if (n) { n.style.marginTop = '16px'; dn.append(n); } }); sec.append(dn);
  const fc = $('.financial-comparison'); if (fc) { const was = fc.closest('.of-rest'); sec.append(fc); fc.classList.add('of-wide'); if (was && !was.querySelector('[data-block-id],canvas,svg,table,.card')) was.remove(); }
  return host;
}

function nav(finHost) {
  const bar = $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  let built = false;
  const select = (key, hash) => {
    let aliasSub = null; if (ALIAS[key]) { [key, aliasSub] = ALIAS[key].split(':'); } if (!ROUTES.some(r => r[0] === key)) key = 'mt1';
    $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
    [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    if (key === 'mt14' && !built && window.ReFinance) { built = true; window.ReFinance.build(finHost); }
    if (hash) { const u = new URL(location.href); if (!TABS[key]) u.searchParams.delete('sub'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
    if (aliasSub && TABS[key]) open(key, aliasSub, true);
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
  const h0 = location.hash.slice(1) || 'mt1', key = select(h0);
  if (TABS[key] && !(ALIAS[h0] || '').includes(':')) open(key, new URL(location.href).searchParams.get('sub'));
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

// Thẻ chỉ có một nội dung thì không gập (bỏ lớp research-fold, hiện tiêu đề gốc).
function unfoldCards(ids) {
  const go = () => ids.forEach(id => { const card = block(id); if (!card) return; card.querySelectorAll(':scope > details.research-fold').forEach(f => { const body = f.querySelector(':scope > .research-detail') || f; f.replaceWith(...[...body.childNodes].filter(n => n.tagName !== 'SUMMARY')); }); card.querySelectorAll('.research-repeated-heading').forEach(h => h.classList.remove('research-repeated-heading')); });
  go(); [800, 3000].forEach(t => setTimeout(go, t));
}

// Sub-tab đã có chart bổ sung thì ẩn ô "Chưa có dữ liệu cho mục này".
function hideEmptyGaps() { $$('.of-body').forEach(b => { if (b.querySelector('[data-of-added], #of-tax')) b.querySelectorAll(':scope > .of-gap').forEach(g => { if (/Chưa có dữ liệu cho mục này/.test(g.textContent)) g.hidden = true; }); }); }


// ===== Tổng quan › 01 Mô hình kinh doanh (26/11/2026, người dùng chọn phương án A + C) =====
// A. Vòng đời tiền của một dự án: sơ đồ 5 bước + chart thật từ BCTC (người mua trả trước dẫn trước doanh thu).
// C. Bảng mô hình theo mã: phân khúc, quỹ đất (link nguồn), cơ cấu nguồn vốn, tồn kho và tiền trả trước so doanh thu 4 quý.
const LAND = {VHM: [29500, '31/12/2025', 'https://nguoiquansat.vn/he-lo-quy-dat-khung-vinhomes-dang-so-huu-298206.html'],
  NVL: [10600, '08/2026', 'https://nhadautu.vn/novaland-hon-57-du-an-cho-giai-doan-2027-2032-aqua-city-la-khoi-dau-d107095.html'],
  PDR: [6655, '31/12/2025', 'https://nguoiquansat.vn/phat-dat-pdr-du-kien-mo-ban-4-du-an-moi-tai-tp-hcm-286381.html'],
  CEO: [1100, '04/2026', 'https://nguoiquansat.vn/chu-tich-ceo-group-noi-ve-co-hoi-nghin-nam-co-mot-quy-dat-1-100ha-san-sang-cho-20-du-an-moi-288142.html'],
  DIG: [820, 'BCTN 2025', 'https://stockbiz.vn/tin-tuc/dig-dic-group-tinh-chuyen-mo-rong-quy-dat/42835718'],
  NLG: [681, '06/2026', 'https://nguoiquansat.vn/nam-long-nlg-va-chu-ky-tang-truong-moi-tu-quy-dat-681ha-298702.html'],
  KDH: [662.5, '11/2026', 'https://nguoiquansat.vn/khang-dien-kdh-he-lo-ke-hoach-phat-trien-121-000-can-nha-tai-tp-hcm-328540.html'],
  AGG: [34, '06/2026 · tự cộng 4 dự án', 'https://nhadautu.vn/bds-an-gia-loi-nhuan-2026-chu-yeu-tu-hop-nhat-the-gio-riverside-d105973.html'],
  DXG: [null, 'không công bố tổng', 'https://elibook.vn/2026/09/08/dxg-loi-nhuan-cot-loi-chi-con-7-ty-co-dong-thieu-so-am-63-mieng-banh-nghi-quyet-21-co-phai-con-bai-cuu-canh/'],
  TCH: [null, 'không công bố tổng', 'https://nhadautu.vn/hoang-huy-phu-song-thi-truong-bat-dong-san-hai-phong-d107167.html'],
  NTL: [null, 'không công bố tổng', 'https://tapchicongthuong.vn/do-thi-tu-liem--ntl--bat-tay-voi-tap-doan-ha-do--hdg--xay-thap-doi-47-tang-tai-khu-do-thi-dich-vong-123539.htm']};
const SEG = {VHM: 'Đại đô thị, mọi phân khúc · cả nước · bán lẻ và bán buôn dự án', NVL: 'Đô thị sinh thái, nghỉ dưỡng · Đồng Nai, Bình Thuận, Vũng Tàu', KDH: 'Nhà phố, căn hộ trung–cao cấp · TP.HCM',
  NLG: 'Nhà ở vừa túi tiền · TP.HCM, Long An, Đồng Nai', DXG: 'Căn hộ trung cấp · Bình Dương cũ; kèm môi giới (DXS)', PDR: 'Căn hộ, đất nền · Bình Dương, Bình Định',
  DIG: 'Khu đô thị, nghỉ dưỡng · Vũng Tàu, Đồng Nai', CEO: 'Đất nền, nghỉ dưỡng · Phú Quốc, Hà Nội', AGG: 'Căn hộ trung cấp · TP.HCM', TCH: 'Căn hộ · Hải Phòng', NTL: 'Khu đô thị · Hà Nội, Quảng Ninh'};
const FINSRC = '<a href="https://api-finfo.vndirect.com.vn/v4/financial_statements" target="_blank" rel="noopener">BCTC hợp nhất quý (VNDirect finfo)</a>';
function modelTab() {
  const host = $('#of-mt1-model .of-body'), D = window.RE_FIN; if (!host || !D || $('#re-cashlife')) return;
  const P = D.periods, n = P.length, nf = (v, d = 0) => v == null || !isFinite(v) ? '—' : v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
  const v = (t, k, i) => D.data[t]?.[k]?.[i] ?? null;
  const sum = (ts, k, i) => { let a = 0, ok = 0; ts.forEach(t => { const x = v(t, k, i); if (x != null) { a += x; ok++; } }); return ok ? a : null; };
  const ttm = (ts, k, i) => i < 3 ? null : [0, 1, 2, 3].reduce((a, j) => { const x = sum(ts, k, i - j); return a == null || x == null ? null : a + x; }, 0);
  const ql = p => `Q${p.slice(-1)}/${p.slice(2, 4)}`;
  // A. Sơ đồ
  const steps = [['01', 'Đất & pháp lý', 'Trả tiền đất, bồi thường, tiền sử dụng đất', 'Tồn kho tăng · CFO âm', 'out'],
    ['02', 'Xây dựng & mở bán', 'Vay ngân hàng, trái phiếu; nhận đặt cọc', 'Nợ vay tăng', 'out'],
    ['03', 'Thu tiền theo tiến độ', 'Người mua đóng tiền theo tiến độ xây dựng', 'Người mua trả trước tăng · CFO dương', 'in'],
    ['04', 'Bàn giao', 'Giao nhà, người mua trả trước chuyển thành doanh thu', 'Doanh thu, lợi nhuận ghi nhận', 'rec'],
    ['05', 'Cấp sổ, thu nốt', 'Thu phần còn lại khi cấp giấy chứng nhận', 'Phải thu giảm', 'rec']];
  const a = el('div', 'card of-wide'); a.id = 're-cashlife'; a.dataset.ofAdded = 're-cashlife';
  a.innerHTML = `<div class="chart-title">Vòng đời tiền của một dự án nhà ở</div><div class="chart-sub">Tiền chi ra trước, tiền khách trả vào giữa, lợi nhuận ghi nhận sau cùng · mỗi bước hiện lên BCTC ở khoản nào</div>
    <div class="cl-flow">${steps.map(([k, t, d, b, c]) => `<div class="cl-step ${c}"><span class="cl-n">${k}</span><b>${t}</b><p>${d}</p><em>${b}</em></div>`).join('')}</div>
    <div class="cl-key"><span class="out">Tiền ra</span><span class="in">Tiền vào</span><span class="rec">Ghi nhận lợi nhuận</span></div>
    <div class="cl-ctl" role="group" aria-label="Nhóm"><button type="button" data-g="dev" aria-pressed="true">10 chủ đầu tư ngoài VHM</button><button type="button" data-g="vhm" aria-pressed="false">VHM</button></div>
    <div style="position:relative;height:320px"><canvas id="chCashLife" role="img" aria-label="Người mua trả trước, doanh thu 4 quý và CFO 4 quý"></canvas></div>
    <p class="of-lead" id="re-cashlife-lead"></p>
    <div class="pw-src">Nguồn: ${FINSRC} · người mua trả trước là số dư cuối quý (ngắn hạn); doanh thu và CFO cộng 4 quý gần nhất; tỷ đồng</div>`;
  host.prepend(a);
  const G = {vhm: ['VHM'], dev: ['NVL', 'KDH', 'NLG', 'DXG', 'PDR', 'DIG', 'CEO', 'AGG', 'TCH', 'NTL']};
  let ch;
  const draw = g => { const ts = G[g], from = Math.max(3, P.indexOf('2020Q1')), idx = [...Array(n - from)].map((_, j) => from + j);
    const adv = idx.map(i => sum(ts, 'adv_customers', i)), rev = idx.map(i => ttm(ts, 'revenue', i)), cfo = idx.map(i => ttm(ts, 'cfo', i));
    ch?.destroy(); if (!window.Chart) return;
    ch = new Chart($('#chCashLife'), {data: {labels: idx.map(i => ql(P[i])), datasets: [
      {type: 'line', label: 'Người mua trả trước (số dư)', data: adv, borderColor: '#2BA5A8', backgroundColor: '#2BA5A8', borderWidth: 2.5, pointRadius: 0, tension: .25},
      {type: 'line', label: 'Doanh thu 4 quý', data: rev, borderColor: '#2938A8', backgroundColor: '#2938A8', borderWidth: 2.5, pointRadius: 0, tension: .25},
      {type: 'bar', label: 'CFO 4 quý', data: cfo, backgroundColor: cfo.map(x => x != null && x < 0 ? 'rgba(229,72,77,.45)' : 'rgba(43,182,115,.4)'), borderRadius: 3}]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, interaction: {mode: 'index', intersect: false},
        plugins: {legend: {position: 'bottom', labels: {usePointStyle: true, boxWidth: 8, color: '#3B4256', font: {size: 12.5}}}, tooltip: {callbacks: {label: c => ` ${c.dataset.label}: ${nf(c.parsed.y)} tỷ đ`}}},
        scales: {x: {grid: {display: false}, ticks: {color: '#6B7392', maxTicksLimit: 10, maxRotation: 0}}, y: {grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', callback: x => nf(x)}}}}});
    const L = n - 1, Y = n - 5, r = (x, y) => x != null && y ? x / y : null;
    const b1 = r(sum(ts, 'adv_customers', L), ttm(ts, 'revenue', L)), b0 = r(sum(ts, 'adv_customers', Y), ttm(ts, 'revenue', Y));
    $('#re-cashlife-lead').innerHTML = `${g === 'vhm' ? 'VHM' : '10 chủ đầu tư'} đang giữ <b>${nf(sum(ts, 'adv_customers', L) / 1000, 1)} nghìn tỷ</b> tiền khách trả trước, bằng <b>${nf(b1, 2)} lần</b> doanh thu 4 quý (cùng kỳ ${nf(b0, 2)} lần): đây là phần doanh thu sẽ ghi nhận khi bàn giao. CFO 4 quý <b class="${ttm(ts, 'cfo', L) < 0 ? 'neg' : 'pos'}">${nf(ttm(ts, 'cfo', L))} tỷ đ</b>.`; };
  a.querySelectorAll('.cl-ctl button').forEach(b => b.addEventListener('click', () => { a.querySelectorAll('.cl-ctl button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(b.dataset.g); }));
  draw('dev');
  let cur = 'dev'; a.querySelectorAll('.cl-ctl button').forEach(b => b.addEventListener('click', () => { cur = b.dataset.g; }));
  $('#of-mt1-model-tab')?.addEventListener('click', () => setTimeout(() => draw(cur), 60));
  // C. Bảng mô hình theo mã
  const L = n - 1, rows = Object.keys(SEG).map(t => { const debt = (v(t, 'st_debt', L) || 0) + (v(t, 'lt_debt', L) || 0), adv = v(t, 'adv_customers', L) || 0, eq = v(t, 'equity', L) || 0, tot = debt + adv + eq, rev = ttm([t], 'revenue', L);
    return {t, debt: debt / tot * 100, adv: adv / tot * 100, eq: eq / tot * 100, inv: rev > 0 ? v(t, 'inventory', L) / rev : null, bl: rev > 0 ? adv / rev : null, land: LAND[t]}; }).sort((x, y) => (y.land[0] ?? -1) - (x.land[0] ?? -1));
  const c = el('div', 'card of-wide'); c.id = 're-model-table';
  const bar = r => `<div class="mt-bar" title="Nợ vay ${nf(r.debt)}% · khách trả trước ${nf(r.adv)}% · VCSH ${nf(r.eq)}%"><i class="d" style="width:${r.debt}%"></i><i class="a" style="width:${r.adv}%"></i><i class="e" style="width:${r.eq}%"></i></div><small>${nf(r.debt)} · ${nf(r.adv)} · ${nf(r.eq)}</small>`;
  c.innerHTML = `<div class="chart-title">Mô hình kinh doanh theo doanh nghiệp</div><div class="chart-sub">Xếp theo quỹ đất · nguồn vốn, tồn kho và tiền trả trước tính từ BCTC ${ql(P[L])}</div>
    <div class="tablewrap"><table class="mt-table" data-no-fold><thead><tr><th>Mã</th><th>Phân khúc · thị trường chính</th><th>Quỹ đất (ha)</th><th>Nguồn vốn: nợ vay · khách trả trước · VCSH (%)</th><th>Tồn kho ÷ doanh thu 4Q (lần)</th><th>Khách trả trước ÷ doanh thu 4Q (lần)</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><b>${r.t}</b></td><td>${SEG[r.t]}</td><td><a href="${r.land[2]}" target="_blank" rel="noopener">${r.land[0] == null ? '—' : nf(r.land[0], r.land[0] < 100 ? 1 : 0)}</a><small> ${r.land[1]}</small></td><td>${bar(r)}</td><td>${nf(r.inv, 1)}</td><td>${nf(r.bl, 2)}</td></tr>`).join('')}</tbody></table></div>
    <div class="cl-key"><span class="d">Nợ vay</span><span class="a">Khách trả trước</span><span class="e">Vốn chủ sở hữu</span></div>
    <div class="pw-src">Nguồn: quỹ đất theo link từng dòng, số doanh nghiệp công bố hoặc báo dẫn lại, cách tính khác nhau giữa các mã · nguồn vốn, tồn kho, khách trả trước: ${FINSRC}. Tồn kho ÷ doanh thu cao nghĩa là cần nhiều năm bán theo tốc độ hiện tại; doanh thu 4 quý âm hoặc bằng 0 để trống.</div>`;
  a.after(c);
  const st = el('style'); st.textContent = `.cl-flow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:12px 0 6px}
.cl-step{position:relative;padding:12px 12px 10px;border-radius:12px;border:1px solid #E6E9F2;border-top:4px solid #9AA1BC;background:#FAFBFE}.cl-step b{display:block;font:700 14px Inter,sans-serif;color:#1F2A5C;margin:2px 0 4px}
.cl-step p{margin:0 0 6px;font-size:13px!important;line-height:1.45!important}.cl-step em{font-style:normal;font-size:12px;font-weight:600;color:#3B4256}.cl-n{font:700 11px Inter,sans-serif;color:#9AA1BC}
.cl-step.out{border-top-color:#E5484D}.cl-step.in{border-top-color:#2BA5A8}.cl-step.rec{border-top-color:#2938A8}
.cl-key{display:flex;gap:16px;flex-wrap:wrap;margin:6px 0 10px;font-size:12px;color:#5A6385}.cl-key span::before{content:'';display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px;background:#9AA1BC}
.cl-key .out::before,.cl-key .d::before{background:#E5484D}.cl-key .in::before,.cl-key .a::before{background:#2BA5A8}.cl-key .rec::before,.cl-key .e::before{background:#2938A8}
.cl-ctl{display:flex;gap:8px;margin:8px 0}.cl-ctl button{padding:6px 14px;border:1px solid #D6DBEA;border-radius:999px;background:#fff;font:600 13px Inter,sans-serif;color:#3D4566;cursor:pointer}.cl-ctl button[aria-pressed=true]{background:#1F2677;border-color:#1F2677;color:#fff}
.mt-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;min-width:140px;background:#EEF0F6}.mt-bar i{display:block;height:100%}.mt-bar .d{background:#E5484D}.mt-bar .a{background:#2BA5A8}.mt-bar .e{background:#2938A8}
.mt-table td small{color:#6B7392;font-size:11.5px}
@media (max-width:900px){.cl-flow{grid-template-columns:1fr}}`; document.head.append(st);
}

function run() {
  if (document.body.dataset.reFrame) return; document.body.dataset.reFrame = '1';
  style();
  stickySub();
  ['mt1', 'mt2', 'mt4'].forEach(buildTab);
  unfoldCards(['bds-02']);
  { const c = block('bds-02')?.querySelector('.research-caption'); if (c) c.textContent = 'Cập nhật 26/11/2026 · số đến Q3/2026'; }
  { const st = el('style'); st.textContent = 'body[data-re-frame] .majorpane .card td b.neg{color:#B3303F!important}body[data-re-frame] .majorpane .card td b.pos{color:#17784A!important}'; document.head.append(st); }
  // 05 Tín dụng & trái phiếu: hai nhóm tiêu đề như Dầu khí › Dầu thô toàn cầu.
  const grp = (before, t, d) => { const n = block(before); if (n && n.parentElement?.classList.contains('of-body')) n.before(el('div', 'of-group of-wide', `<h3>${t}</h3><p>${d}</p>`)); };
  grp('bds-16', 'Lãi suất & tín dụng', 'Chi phí vốn của người mua nhà và chủ đầu tư.');
  grp('bds-28', 'Trái phiếu doanh nghiệp BĐS', 'Phát hành, dư nợ, chậm trả và lịch đáo hạn (HNX).');
  HIDE_SEL.forEach(q => $$(q).forEach(n => { n.hidden = true; n.classList.add('of-hidden-legacy'); }));
  modelTab();
  hideEmptyGaps();
  const finHost = financePane();
  nav(finHost);
  window.dispatchEvent(new Event('re:frame'));
}
// Dựng khung trong lượt SectorBoot (mốc 1600, sau mọi module ≤ 1500) để trang chỉ hiện khi khung đã xong.
if (window.SectorBoot) SectorBoot.add(1600, run);
else { const start = () => setTimeout(run, 1700); if (document.readyState === 'complete') start(); else window.addEventListener('load', start); }
})();
