/* Thép · khung 4 tab (28/11/2026, người dùng yêu cầu: bỏ tab Chính sách, bỏ Chuỗi giá trị và Doanh nghiệp niêm yết ở Tổng quan,
   Bức tranh ngành chia sub-tab theo loại sản phẩm với luồng Đầu vào → Sản xuất → Đầu ra như trang Điện).
   Tab lớn: Tổng quan ngành (Bản đồ ngành; cuối sub-tab là bản đồ năng lực sản xuất th-cap-map do app/steel-capacity-map.js thêm sau sự kiện steel:frame)
          · Bức tranh ngành (01 Toàn ngành · 02 Thép xây dựng · 03 HRC · 04 Tôn mạ & ống — buildPicture(), cây PICT)
          · Tài chính ngành (#mt14: 01 Tổng quan ngành = app/steel-finance.js · 02 So sánh doanh nghiệp · 03 Định giá = app/peer-valuation.js) · Chủ đề nóng.
   Engine chép từ Cang-bien/app/port-frame.js ← Dau-khi/app/oil-frame.js. Thẻ cũ được DỜI theo data-block-id, không nhân bản, không xóa.
   Thay khung cũ (steel-frame 27/11 sáng: bỏ mt4, mt14 hai sub-tab qua pane-subtabs). Deep-link: Thep/?sub=<khóa>#mt2 ; link cũ #mt3 → #mt2, #mt6 → #mt14.
   28/11/2026 chiều (khung chuẩn Điện, DASHBOARD_WORKFLOW §42): Tổng quan dùng thanh .ov-nav (vẫn một mục 00 Bản đồ ngành, có dòng phụ);
   mỗi sub-tab Bức tranh ngành có mục tiêu + "Dữ liệu mới nhất" (.pp-asof, tính từ chuỗi window.STEEL_PUBLIC của chính sub-tab) và 2–4 ô số;
   Tài chính ngành dùng .pp-nav: 01 Tài chính ngành (?sub=fin) · 02 Doanh nghiệp niêm yết (?sub=companies) · 03 Định giá (peer-valuation.js);
   khóa cũ ?sub=total, ?sub=compare vẫn mở đúng. Giao diện thanh/khung lấy từ app/sector-frame.css (bỏ CSS .of-nav/.of-tab tự chế). */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
if (document.body.dataset.sector !== 'steel' || !$('[data-block-id="th-01"]')) return;  // chỉ trang Thép
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const block = id => $(`[data-block-id="${id}"]`);
const byCanvas = id => $('#' + id)?.closest('.card,.viz-block');

const GAP = t => `<p class="data-gap of-gap">${t}</p>`;
const TREE = {
  mt1: {label: 'Tổng quan ngành', title: 'Tổng quan ngành thép', intro: 'Chuỗi giá trị → mô hình kinh doanh từng mã.', subs: [
    {k: 'map', n: '00', t: 'Bản đồ ngành', small: 'Chuỗi giá trị · năng lực sản xuất', d: 'Quặng, than, thép phế → luyện → thép xây dựng, HRC, tôn mạ → xây dựng, xuất khẩu; mỗi khâu gắn mã niêm yết.', sel: ['.research-roadmap'], ids: ['th-05', 'th-01']},
    // 28/11/2026 (người dùng yêu cầu): bỏ sub-tab Chuỗi giá trị (.business-models) và Doanh nghiệp niêm yết (th-04) khỏi Tổng quan.
    // Hai khối nằm lại trong fold ẩn .of-rest (không xóa khỏi DOM); bảng so sánh doanh nghiệp vẫn ở Tài chính ngành › 02.
  ]},
};
/* Bức tranh ngành theo khung trang Điện (28/11/2026, người dùng yêu cầu): sub-tab theo loại sản phẩm như Điện chia theo loại nguồn
   (01 Toàn ngành · 02 Thép xây dựng · 03 HRC · 04 Tôn mạ & ống); mỗi sub-tab có ô số, thanh luồng Đầu vào → Sản xuất → Đầu ra,
   tiêu đề khâu (.pp-stage) và câu hỏi đánh số (.pp-panel). Thẻ được DỜI, không nhân bản; thẻ nằm ở sub-tab khác thì đặt thẻ dẫn (link).
   Bỏ sub-tab Nguyên liệu / Xuất nhập khẩu / Biên & spread cũ: nội dung chia vào các khâu. Deep-link ?sub=<all|rebar|hrc|coat>#mt2. */
const LINK = (href, k, t, s) => ({link: [href, k, t, s]});
/* 28/11/2026 chiều: goal = mục tiêu một câu dưới tiêu đề sub-tab; asof = [nhãn, khóa chuỗi STEEL_PUBLIC] → "Dữ liệu mới nhất" lấy quan sát
   mới nhất của các chuỗi vẽ trong sub-tab (giá theo ngày dd/mm/yyyy, số tháng Tm/yyyy), không lấy ngày build. Ô số spk-* do steel-dashboard.js điền. */
const PICT = [
  {k: 'all', t: 'Toàn ngành', goal: 'Nguyên liệu → sản xuất khu vực → xuất nhập khẩu: nhịp chung của cả ngành thép.', asof: [['giá', ['iron_ore_cny', 'coke', 'scrap']], ['số tháng', ['crude_cn', 'steel_export', 'steel_import']]],
   kpis: ['spk-ore', 'spk-exp', 'spk-pe'], flow: [['in', 'Đầu vào', 'Quặng sắt, than cốc, thép phế'], ['prod', 'Sản xuất', 'Thép thô khu vực, sản lượng theo sản phẩm'], ['out', 'Đầu ra', 'Xuất nhập khẩu sắt thép']], items: [
    {stage: 'in'},
    {q: 'Giá quặng sắt, than cốc, thép phế đang đi hướng nào?', id: 'th-q-input', take: ['th-10']},
    {stage: 'prod'},
    {q: 'Trung Quốc đang sản xuất nhiều hơn hay ít hơn?', id: 'th-q-crude', take: ['th-11']},
    {q: 'Hòa Phát bán bao nhiêu theo từng sản phẩm?', id: 'th-q-hpgvol', take: ['th-15']},
    {stage: 'out'},
    {q: 'Xuất khẩu và nhập khẩu sắt thép đang tăng hay giảm?', id: 'th-q-trade', take: ['th-30']},
    {q: 'Chỉ báo nào đang tăng, chỉ báo nào giảm so với cùng kỳ?', id: 'th-q-heat', take: ['.fsv-heat']},
  ]},
  {k: 'rebar', t: 'Thép xây dựng', goal: 'Chi phí nguyên liệu → sản lượng thép cán, thép thanh → giá bán CB300.', asof: [['giá', ['rebar_hpg']], ['sản lượng', ['steel_rolled', 'steel_bar']]],
   kpis: ['spk-rebar', 'spk-bar'], flow: [['in', 'Đầu vào', 'Quặng, than cốc (lò cao) · thép phế (lò điện)'], ['prod', 'Sản xuất', 'Sản lượng thép cán, thép thanh và thép góc'], ['out', 'Đầu ra', 'Giá bán thép CB300']], items: [
    {stage: 'in'},
    LINK('#th-q-input', 'Toàn ngành › 1.1', 'Giá quặng sắt, than cốc, thép phế', 'Chi phí nguyên liệu chung của lò cao và lò điện'),
    {stage: 'prod'},
    {q: 'Sản lượng thép cán và thép xây dựng đang tăng hay giảm?', id: 'th-q-rebar-out', take: ['th-13']},
    {stage: 'out'},
    {q: 'Giá thép xây dựng CB300 đang tăng hay giảm?', id: 'th-q-rebar-px', take: ['th-20']},
  ]},
  {k: 'hrc', t: 'HRC (thép cán nóng)', goal: 'Chi phí quặng, than cốc → sản lượng HRC Hòa Phát → spread lò cao và biên gộp HPG.', asof: [['giá', ['hrc', 'iron_ore_cny', 'coke']]],
   kpis: ['spk-hrc', 'spk-spread', 'spk-hrc3'], flow: [['in', 'Đầu vào', 'Chi phí quặng + than cốc'], ['prod', 'Sản xuất', 'Sản lượng HRC Hòa Phát'], ['out', 'Đầu ra', 'Spread lò cao và biên gộp HPG']], items: [
    {stage: 'in'},
    {q: 'Chi phí quặng + than cốc so với giá HRC: spread lò cao còn bao nhiêu?', id: 'th-q-bf', take: ['th-40']},
    {stage: 'prod'},
    LINK('#th-q-hpgvol', 'Toàn ngành › 1.3', 'Sản lượng bán HRC của Hòa Phát', 'Dòng HRC trong chart sản lượng theo sản phẩm'),
    {stage: 'out'},
    {q: 'Spread lò cao theo quý có đi cùng biên gộp HPG?', id: 'th-q-hrc-gm', take: ['th-41']},
  ]},
  {k: 'coat', t: 'Tôn mạ & ống', goal: 'Giá HRC đầu vào → sản lượng tôn mạ, ống → chênh tôn − HRC và xuất khẩu sang Mỹ.', asof: [['giá', ['hrc', 'galv_cn', 'ton_lanh']], ['XK Mỹ', ['us_imp_7210']]],
   kpis: ['spk-ton', 'spk-coat', 'spk-us7210'], flow: [['in', 'Đầu vào', 'Giá HRC (nguyên liệu cán nguội, mạ)'], ['prod', 'Sản xuất', 'Sản lượng tôn mạ, ống thép'], ['out', 'Đầu ra', 'Chênh tôn lạnh − HRC, xuất khẩu sang Mỹ']], items: [
    {stage: 'in'},
    {q: 'Giá HRC, thép mạ và tôn lạnh đang đi hướng nào?', id: 'th-q-flat', take: ['th-21']},
    {stage: 'prod'},
    LINK('#th-q-hpgvol', 'Toàn ngành › 1.3', 'Sản lượng tôn mạ, ống thép của Hòa Phát', 'Dòng Tôn mạ, Ống thép trong chart sản lượng theo sản phẩm'),
    {stage: 'out'},
    {q: 'Chênh lệch tôn lạnh − HRC đang nới hay hẹp lại?', id: 'th-q-coat-sp', take: ['th-42']},
    {q: 'Mỹ còn nhập bao nhiêu tôn mạ Việt Nam?', id: 'th-q-us', take: ['th-32']},
  ]},
];
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
// 28/11/2026: bỏ tab Chính sách (người dùng yêu cầu); link cũ #mt4 về Tổng quan. Thẻ th-50, th-51, th-52 nằm lại trong pane ẩn.
const ALIAS = {mt3: 'mt2', mt6: 'mt14', mt4: 'mt1'};
// Khóa sub-tab cũ theo tab lớn. Tài chính ngành: total/compare (bản 27/11) → fin/companies (tên khóa như Điện ?fin=).
const SUBALIAS = {mt2: {input: 'all', trade: 'all', flat: 'coat', margin: 'hrc'}, mt14: {total: 'fin', sector: 'fin', compare: 'companies', dn: 'companies'}};
const subKey = (key, sub) => (SUBALIAS[key] || {})[sub] || sub;
/* "Dữ liệu mới nhất" từ chuỗi đã nạp (window.STEEL_PUBLIC): chuỗi tháng ghi ngày 01 → Tm/yyyy; chuỗi giá → dd/mm/yyyy. */
const SER = k => { const B = window.STEEL_PUBLIC?.blocks || {}; return B.macro?.series?.[k]?.records || B.commodity?.series?.[k]?.records || []; };
const monthly = k => !!window.STEEL_PUBLIC?.blocks?.macro?.series?.[k];
function asOfText(groups) {
  const parts = (groups || []).map(([label, keys]) => {
    const last = keys.map(k => SER(k).at(-1)?.date).filter(Boolean).sort().at(-1); if (!last) return null;
    const isM = keys.every(monthly);
    return label + ' ' + (isM ? 'T' + Number(last.slice(5, 7)) + '/' + last.slice(0, 4) : last.slice(8, 10) + '/' + last.slice(5, 7) + '/' + last.slice(0, 4));
  }).filter(Boolean);
  return parts.length ? 'Dữ liệu mới nhất: ' + parts.join(' · ') : '';
}

function style() {
  const st = el('style'); st.id = 'port-frame-style';
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
body[data-steel-frame] .majorpane{--of-t1:#1F2A5C;--of-t2:#3B4256;--of-t3:#6B7392}
body[data-steel-frame] .majorpane :is(.chart-title,.card>h3,.card>h4,.card .research-detail>h3,.research-fold>summary,.business-model h3,.opec-drivers h3,.sectionhead h2.sec,.of-section h2){font:700 16px/1.35 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important;letter-spacing:-.005em}
body[data-steel-frame] .majorpane :is(.business-models>h2,.research-roadmap>h2,.section>h2,.sectionhead h2){font:700 20px/1.3 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important}
body[data-steel-frame] .majorpane :is(.card p,.card li,.card td,.research-detail p,.business-model p,.tx-mech,.tx-who,.gt-lab b){font-size:14px!important;line-height:1.55!important;color:var(--of-t2)!important}
body[data-steel-frame] .majorpane :is(.card th,.chart-sub,.note,.source-note,.research-caption,.srcrow,.srcrow a,.pw-src,.card small,.gt-lab small,.gt-name small,.tx-k,.ct-period label,.cts-legend button){font-size:12.5px!important;line-height:1.5!important;color:var(--of-t3)!important}
body[data-steel-frame] .majorpane .card th{font-weight:600!important}
body[data-steel-frame] .majorpane :is(.card td b,.card p b,.tx-ch,.gt-name b){color:var(--of-t1)!important}
body[data-steel-frame] .majorpane .card [style*="font-size:12.5px"]{font-size:14px!important;color:var(--of-t2)!important}
body[data-steel-frame] .majorpane .comparison-heading h2{color:#fff!important;background:none!important;box-shadow:none!important}
:root[data-theme=dark] body[data-steel-frame] .majorpane{--of-t1:#E8EBFA;--of-t2:#C4C9E2;--of-t3:#9AA1BC}
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
  // 28/11/2026 chiều: thanh .ov-nav như Điện (thẻ 00 + tiêu đề + dòng phụ), hiện cả khi chỉ có một mục.
  const nav = el('div', 'ov-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', def.title); sec.append(nav);
  const used = new Set();
  const subs = def.subs.map((s, i) => {
    const b = el('button', 'tabbtn ov-tab', `<span>${s.n || String(i).padStart(2, '0')}</span>${esc(s.t)}<small>${esc(s.small || '')}</small>`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `of-${key}-${s.k}-tab`;
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
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const n = def.subs.length, j = (i + d + n) % n; nav.children[j].click(); nav.children[j].focus(); });
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
  // Chọn sẵn sub-tab đầu (00 Bản đồ ngành) để thẻ trên thanh luôn có trạng thái chọn.
  { const want = new URL(location.href).searchParams.get('sub'); open(key, subs.some(x => x.s.k === want) ? want : subs[0].s.k); }
  [100, 600, 1500].forEach(t => setTimeout(() => { window.dispatchEvent(new Event('resize')); $$('.of-body canvas').forEach(c => { const ch = window.Chart?.getChart?.(c); if (ch && c.offsetParent) ch.resize(); }); }, t));
}
const TABS = {};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
/* 28/11/2026 chiều: giao diện .pp-nav/.pp-head/.pp-kpis/.pp-panel/.pp-flow/.pp-stage/.th-link ở app/sector-frame.css (một bản cho mọi ngành).
   Ở đây chỉ còn lưới chart trong câu hỏi (.th-grid) và khoảng cuộn khi nhảy tới câu hỏi/khâu. */
const PP_CSS = `.pp-panel,.pp-stage{scroll-margin-top:140px}
.th-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}.th-grid>*{min-width:0;margin:0!important}
.th-grid>:only-child,.th-grid>.of-wide,.th-grid>.fsv-heat{grid-column:1/-1}
html body .pp-pane>section.pp-kpis[style*="--pp-n"]{grid-template-columns:repeat(var(--pp-n),minmax(0,1fr))}
@media (max-width:900px){.th-grid{grid-template-columns:minmax(0,1fr)}}
@media (max-width:760px){html body .pp-pane>section.pp-kpis[style*="--pp-n"]{grid-template-columns:repeat(2,minmax(0,1fr))}}`;

function buildPicture() {
  const pane = $('.majorpane[data-tab="mt2"]'); if (!pane) return;
  const st = el('style'); st.id = 'steel-picture-style'; st.textContent = PP_CSS; document.head.append(st);
  const legacy = [...pane.children], used = new Set();
  const kpiTile = sp => document.getElementById(sp)?.closest('.kpi');
  const take = sel => { const n = /^th-/.test(sel) ? block(sel) : $(sel);
    if (!n || used.has(n) || [...used].some(u => u.contains(n))) return null; used.add(n); n.hidden = false; wideIfTable(n); return n; };
  const sec = el('section', 'section of-section');
  sec.append(el('div', 'sectionhead', '<div><h2 class="sec">Bức tranh ngành</h2><p>Toàn ngành → thép xây dựng → HRC → tôn mạ &amp; ống. Mỗi nhóm sản phẩm đi theo luồng đầu vào → sản xuất → đầu ra.</p></div>'));
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Bức tranh ngành'); sec.append(nav);
  const subs = PICT.map((s, i) => {
    const num = String(i + 1).padStart(2, '0');
    const b = el('button', 'tabbtn pp-tab', `<span>${num}</span>${esc(s.t)}`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `of-mt2-${s.k}-tab`;
    const p = el('div', 'pp-pane of-pane'); p.id = `of-mt2-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    const asof = asOfText(s.asof);
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(s.t)}</h2>${s.goal ? `<p>${esc(s.goal)}</p>` : ''}</div><span class="pp-asof">${esc(asof)}</span>`));
    // Ô số: chỉ ô đã có số (steel-dashboard.js điền); ô còn "—" (thiếu chuỗi) để lại trong khối ẩn, không bịa số.
    const g = el('section', 'grid kpis pp-kpis'); (s.kpis || []).forEach(sp => { const t = kpiTile(sp); if (t && /\d/.test(t.querySelector('.value')?.textContent || '')) g.append(t); });
    if (g.children.length) { g.style.setProperty('--pp-n', Math.min(4, g.children.length)); p.append(g); }
    const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Luồng ' + s.t.toLowerCase());
    bar.innerHTML = s.flow.map(([id, k, t], j) => `${j ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#th-st-${s.k}-${id}" class="pp-flow-s"><small>${k}</small><b>${esc(t)}</b></a>`).join('');
    p.append(bar);
    let qn = 0;
    s.items.forEach(it => {
      if (it.stage) { const f = s.flow.find(x => x[0] === it.stage); const h = el('div', 'pp-stage', `<span>${f[1]}</span><h3>${esc(f[2])}</h3>`); h.id = `th-st-${s.k}-${f[0]}`; p.append(h); return; }
      if (it.link) { const [href, k, t, sub] = it.link; const a = el('a', 'th-link', `<small>Xem chart ở ${esc(k)}</small><b>${esc(t)} →</b><span>${esc(sub)}</span>`); a.href = href; p.append(a); return; }
      const grid = el('div', 'pp-main th-grid'); (it.take || []).forEach(sel => { const n = take(sel); if (n) grid.append(n); });
      if (!grid.children.length) return;
      const panel = el('section', 'pp-panel pp-q'); panel.id = it.id; qn++;
      panel.innerHTML = `<header class="pp-ph"><span class="pp-num">${i + 1}.${qn}</span><div><h3>${esc(it.q)}</h3></div></header>`;
      panel.append(grid); p.append(panel);
    });
    const nx = PICT[i + 1]; if (nx) { const go = el('button', 'of-next', `Tiếp: ${esc(nx.t)} →`); go.type = 'button'; go.addEventListener('click', () => { open('mt2', nx.k, true); nav.scrollIntoView({behavior: 'smooth', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open('mt2', s.k, true));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const j = (i + d + PICT.length) % PICT.length; nav.children[j].click(); nav.children[j].focus(); });
    return {s, b, p};
  });
  // Khối còn lại của bố cục cũ (ô số không dùng, thẻ chưa dời): giữ trong DOM, ẩn (Tài chính ngành còn lấy thẻ từ đây).
  const rest = legacy.filter(n => !sec.contains(n) && (n.matches?.('[data-block-id]') || n.querySelector?.('[data-block-id],canvas,table,svg')));
  if (rest.length) { const d = el('details', 'research-fold of-rest'); const box = el('div', 'research-detail'); rest.forEach(n => box.append(n)); d.append(el('summary', '', 'Nội dung khác của tab cũ'), box); sec.append(d); }
  pane.replaceChildren(sec);
  TABS.mt2 = subs;
  // Luôn chọn sẵn một sub-tab (mặc định 01 Toàn ngành); không thì bấm tab lớn từ Tổng quan sẽ hiện cả 4 sub-tab cùng lúc.
  const want = new URL(location.href).searchParams.get('sub');
  open('mt2', subs.some(x => x.s.k === subKey('mt2', want)) ? want : 'all');
  [100, 600, 1500].forEach(t => setTimeout(() => { $$('.pp-pane canvas').forEach(c => { const ch = window.Chart?.getChart?.(c); if (ch && c.offsetParent) ch.resize(); }); }, t));
}

function open(key, sub, push) {
  const subs = TABS[key]; if (!subs) return;
  sub = subKey(key, sub);
  const hit = subs.find(x => x.s.k === sub) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.classList.toggle('active', on); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  if (push) { const u = new URL(location.href); u.searchParams.set('sub', hit.s.k); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
  if (key === 'mt14') setTimeout(finBuild, 30);
}
// Dựng Tài chính ngành › 01 khi chỗ chứa đã hiện (đo đúng chiều rộng chart); mở thẳng ?sub=companies hoặc ?sub=valuation thì đợi tới khi bấm 01.
let finHostEl = null;
const finBuild = () => { if (finHostEl && finHostEl.offsetParent !== null) window.SteelFinance?.build(finHostEl); };

function financePane() {
  let p = $('.majorpane[data-tab="mt14"]');
  if (!p) { p = el('section', 'majorpane'); p.dataset.tab = 'mt14'; p.id = 'pane-mt14'; p.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(p); }
  const sec = el('section', 'section');
  sec.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>Số liệu tài chính của 8 doanh nghiệp thép niêm yết, tổng hợp theo nhóm, từ BCTC hợp nhất quý.</p></div>'));
  const host = el('div', 'of-fin steel-fin-host'); host.id = 'th-fin-root';  // steel-finance.js tìm .steel-fin-host
  // 27/11/2026 (người dùng chốt): 01 = chỉ số cộng gộp (tổng tử số ÷ tổng mẫu số); 02 = từng mã (xu hướng tài chính, P/E, kế hoạch – kết quả).
  // 28/11/2026 chiều (khung chuẩn Điện §42): thanh .pp-nav, tên 01 Tài chính ngành · 02 Doanh nghiệp niêm yết · 03 Định giá (peer-valuation.js tự thêm
  // sau .pp-pane cuối); khóa fin/companies như Điện, khóa cũ total/compare qua SUBALIAS.mt14.
  const CMP_IDS = ['th-60', 'th-03'], CMP_SEL = ['.sector-valuation'];
  const fnav = el('div', 'pp-nav'); fnav.setAttribute('role', 'tablist'); fnav.setAttribute('aria-label', 'Tài chính ngành'); sec.append(fnav);
  const FIN = [{k: 'fin', t: 'Tài chính ngành', goal: 'Lợi nhuận, biên, đầu tư, công nợ và dòng tiền của 8 doanh nghiệp thép niêm yết, cộng gộp từ BCTC quý.'},
    {k: 'companies', t: 'Doanh nghiệp niêm yết', goal: 'Từng mã: so sánh tài chính, xu hướng theo quý, kế hoạch – kết quả và P/E rổ ngành.'}];
  const subs = FIN.map((s, i) => {
    const num = String(i + 1).padStart(2, '0');
    const b = el('button', 'tabbtn pp-tab', `<span>${num}</span>${esc(s.t)}`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `of-mt14-${s.k}-tab`;
    const sp = el('div', 'pane-subpane pp-pane of-pane'); sp.id = `of-mt14-${s.k}`; sp.dataset.sub = s.k; sp.setAttribute('role', 'tabpanel'); sp.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', sp.id);
    sp.append(el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(s.t)}</h2><p>${esc(s.goal)}</p></div>`));
    const body = el('div', 'of-body'); sp.append(body); fnav.append(b); sec.append(sp);
    b.addEventListener('click', () => open('mt14', s.k, true));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const bs = [...fnav.children], j = (bs.indexOf(b) + d + bs.length) % bs.length; bs[j].click(); bs[j].focus(); });
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
  finHostEl = host;
  TABS.mt14 = subs; open('mt14', new URL(location.href).searchParams.get('sub'));
  return host;
}

function nav(finHost) {
  const bar = $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  const select = (key, hash) => {
    key = ALIAS[key] || key; if (!ROUTES.some(r => r[0] === key)) key = 'mt1';
    $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
    [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    if (key === 'mt14') setTimeout(finBuild, 30);  // dựng khi tab và sub-tab 01 hiện để đo đúng chiều rộng chart
    if (hash) { const u = new URL(location.href); u.searchParams.delete('sub'); /* đổi tab lớn: bỏ sub của tab trước */ u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
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
  if (document.body.dataset.steelFrame) return; document.body.dataset.steelFrame = '1';
  style();
  stickySub();
  // KPI: khung lấy KPI của #mt2; trên trang này KPI có thể đang ở #mt1, đưa về đầu #mt2.
  const k = $('.majorpane .kpis'), m2 = $('.majorpane[data-tab="mt2"]'); if (k && m2) m2.prepend(k);
  buildTab('mt1');
  buildPicture();
  const finHost = financePane();
  nav(finHost);
  window.dispatchEvent(new Event('steel:frame'));
}
if (window.SectorBoot) SectorBoot.add(1600, run);
else { const start = () => setTimeout(run, 1700); if (document.readyState === 'complete') start(); else window.addEventListener('load', start); }
})();
