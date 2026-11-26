/* Bán lẻ & tiêu dùng · khung 4 tab theo mẫu Điện (26/11/2026), dựng từ khung Thủy sản (Thuy-san/app/seafood-frame.js).
   Tab lớn: Tổng quan ngành (#mt1: 00 Bản đồ ngành · 01 Mô hình kiếm tiền · 02 Vị trí chu kỳ; Bản tin dữ liệu ở đầu)
          · Bức tranh ngành (#mt2: 01 Toàn ngành · 02 Bán lẻ hiện đại & điện máy · 03 Ô tô & trang sức · 04 Hàng tiêu dùng nhanh · 05 Chính sách & thuế)
          · Tài chính ngành (#mt14: 01 Tài chính ngành · 02 Doanh nghiệp niêm yết)
          · Chủ đề nóng (#mt7, giữ research-editorial; mỗi chủ đề thêm dòng mô hình bị tác động, chỉ báo xác nhận, link chart).
   Card cũ được DỜI theo data-block-id (không nhân bản, không xóa); card chưa có chỗ gom vào "Nội dung khác".
   URL: ?sub=<khóa>#mtN. Bấm tab/sub-tab → pushState nên nút Back/Forward đi lại đúng mục (popstate dựng lại).
   Link cũ: #mt3 → Hàng tiêu dùng nhanh (Giá – Chi phí – Margin cũ), #mt4 / ?section=policy|tax|trade → Chính sách & thuế,
   #mt6 / ?section=listed|companies → Doanh nghiệp niêm yết, #mt8 / ?section=sources → Nguồn dữ liệu (mở sẵn ở cuối Bản đồ ngành).
   Chạy bằng SectorBoot mốc 1200 (sau research-layout, research-editorial, pane-subtabs, stock-dom; trước chart-unfold 1400, dòng nguồn 1500). */
(() => {
'use strict';
if (document.body.dataset.sector !== 'retail') return;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const block = id => $(`[data-block-id="${id}"]`);
const kpi = spark => $('#' + spark)?.closest('.kpi');
const NOTE = html => () => el('p', 'rf-note', html);

/* ---------- Cây nội dung ---------- */
const TREE = {
  mt1: {title: 'Tổng quan ngành', subs: [
    {k: 'map', t: 'Bản đồ ngành', d: 'Sức mua (thu nhập, khách, tín dụng) → ba nhóm doanh nghiệp → kênh bán → biên lợi nhuận.', items: [
      {q: 'Sức mua đi qua những khâu nào trước khi thành lợi nhuận?', id: 'rf-q-map', take: ['.research-roadmap', 'bl-01']},
    ]},
    {k: 'model', t: 'Mô hình kiếm tiền', d: 'Doanh thu đến từ đâu, biến nào quyết định biên, mã nào đại diện và xem chart nào tiếp.', items: [
      {q: 'Mỗi nhóm kiếm tiền từ đâu, biến nào quyết định biên?', id: 'rf-q-model', take: ['bl-05'], build: models, fold: [['bl-04', 'Bảng doanh nghiệp theo dõi (bản cũ)']]},
      {q: 'Từng doanh nghiệp kiếm tiền ra sao?', id: 'rf-q-biz', take: ['.business-models']},
    ]},
    {k: 'cycle', t: 'Vị trí chu kỳ', d: 'Đọc nhanh sức mua, kết quả doanh nghiệp và ngược gió 2027.', items: [
      {q: 'Ngành đang ở pha nào của chu kỳ sức mua?', id: 'rf-q-cycle', take: ['bl-02']},
    ]},
  ]},
  mt2: {title: 'Bức tranh ngành', subs: [
    {k: 'all', t: 'Toàn ngành', d: 'Sức mua thực đang tăng bao nhiêu? Tổng mức bán lẻ, phần do giá, cơ cấu chi tiêu và kênh bán; CPI, khách quốc tế, tín dụng là lớp giải thích.', kpis: ['spk-retail', 'spk-cpi', 'spk-tourist'], items: [
      {grp: 'Sức mua'},
      {q: 'Sức mua thực đang tăng bao nhiêu?', id: 'rf-q-real', meta: '<span class="rf-period">Tháng</span>NSO, giá hiện hành · <span class="rf-period">Lũy kế</span>danh nghĩa và loại trừ giá, cùng kỳ 9T/2026, cùng phạm vi', take: ['bl-17', 'bl-10', 'bl-16']},
      {q: 'Tiền chi tiêu đi vào đâu, kênh nào tăng nhanh?', id: 'rf-q-mix', meta: 'cơ cấu cộng đúng về tổng 9T/2026 · TMĐT là chỉ báo kênh riêng (6T/2026, phạm vi 4 sàn)', take: ['bl-13', 'bl-18']},
      {grp: 'Chỉ báo giải thích'},
      {q: 'Giá, khách quốc tế và tín dụng giải thích gì cho sức mua?', id: 'rf-q-drivers', meta: 'CPI % so cùng kỳ · khách quốc tế theo tháng · <b>tổng</b> tín dụng nền kinh tế (chưa tách tín dụng tiêu dùng)', take: ['bl-11', 'bl-33', 'bl-12'],
        fold: [['.fsv-heat', 'Bảng nhiệt: tăng trưởng so cùng kỳ của các chỉ báo theo tháng']]},
    ]},
    {k: 'modern', t: 'Bán lẻ hiện đại & điện máy', d: 'Doanh thu tăng nhờ mở thêm hay nhờ cửa hàng hiện hữu bán tốt hơn? MWG, FRT, WinCommerce (MSN) so theo đúng mô hình.', items: [
      {q: 'Mở thêm bao nhiêu điểm bán, mỗi điểm bán được bao nhiêu?', id: 'rf-q-stores', meta: 'số điểm cuối kỳ · tỷ đồng/cửa hàng/tháng · ● công bố ○ tự tính (mẫu số cuối kỳ làm chuỗi mở nhanh bị tính thấp)', take: ['bl-14', 'bl-15']},
      {q: 'Chuỗi nào tăng nhờ cửa hàng hiện hữu, chuỗi nào nhờ mở mới?', id: 'rf-q-sssg', meta: '% so cùng kỳ 9T/2026 · chỉ chuỗi công bố cả doanh thu và SSSG', take: ['bl-43'],
        after: NOTE('<b>So theo mô hình:</b> điện máy – điện thoại (MWG khối ĐMX, FPT Shop) tăng nhờ năng suất cửa hàng, nên theo dõi SSSG và biên gộp; bách hóa (Bách Hóa Xanh, WinCommerce) và nhà thuốc (Long Châu) tăng nhờ mở mới, nên theo dõi tỷ lệ cửa hàng mới hòa vốn, chi phí bán hàng/doanh thu và doanh thu/cửa hàng sau 12 tháng. <b>Còn thiếu để dựng cầu nối:</b> số cửa hàng bình quân và SSSG theo quý của Long Châu, Bách Hóa Xanh, WinCommerce. Biên gộp từng doanh nghiệp: <a href="#rf-q-gm">Tài chính ngành › 1.3</a>.')},
    ]},
    {k: 'durable', t: 'Ô tô & trang sức', d: 'Sản lượng xe và giá vàng truyền vào lợi nhuận qua đâu? Xe: số bán, cơ cấu nhập khẩu/lắp ráp, biên đại lý. Vàng: giá, chênh lệch thế giới, biên PNJ.', kpis: ['spk-car'], items: [
      {grp: 'Ô tô & xe máy'},
      {q: 'Sản lượng xe đang tăng ở nhóm nào?', id: 'rf-q-car', meta: 'VAMA và VinFast là hai phạm vi riêng · sản lượng sản xuất (NSO) khác số bán ra', take: ['bl-21', 'bl-25', 'bl-20']},
      {q: 'Sản lượng truyền vào lợi nhuận đại lý qua đâu?', id: 'rf-q-dealer', meta: '% · biên gộp hợp nhất quý HAX, SVC', take: ['bl-26'],
        after: NOTE('<b>Cơ chế:</b> lợi nhuận đại lý = số xe bán × (giá bán − giá nhập từ hãng) + dịch vụ, phụ tùng. <b>Chỉ báo cần kiểm tiếp:</b> doanh số theo hãng mà HAX, SVC phân phối (chưa có nguồn công khai theo tháng), tỷ trọng dịch vụ trong lãi gộp, hàng tồn kho xe và chi phí lãi vay.')},
      {q: 'Xe máy: chỉ báo riêng cho sức mua nhóm thu nhập trung bình', id: 'rf-q-moto', take: ['bl-22']},
      {grp: 'Vàng & trang sức'},
      {q: 'Giá vàng trong nước đang đi đâu?', id: 'rf-q-gold', meta: 'triệu đồng/lượng · SJC miếng và nhẫn, điểm cuối tháng (WiData)', take: ['bl-24', 'bl-23']},
      {q: 'Vàng trong nước đắt hơn thế giới bao nhiêu?', id: 'rf-q-gap', meta: 'một ngày đã đối chiếu (11/10/2026) · quy đổi tự tính và số bài nguồn đặt cạnh nhau', take: ['bl-42']},
      {q: 'Giá vàng truyền vào biên gộp PNJ qua đâu?', id: 'rf-q-pnj', meta: '% · biên gộp hợp nhất PNJ cạnh giá SJC so cùng kỳ', take: ['bl-27'],
        after: NOTE('<b>Cơ chế:</b> biên gộp PNJ = cơ cấu (trang sức biên cao, vàng 24K biên thấp) × chênh giá bán với giá vốn tồn kho. <b>Chỉ báo cần kiểm tiếp:</b> tỷ trọng doanh thu vàng 24K theo quý, tồn kho vàng (18.855 tỷ cuối Q3), dự phòng thu đổi kim cương còn lại — chưa có chuỗi công bố theo quý trong repo.')},
    ]},
    {k: 'fmcg', t: 'Hàng tiêu dùng nhanh', d: 'Sản lượng và giá đầu vào đang tác động thế nào lên biên gộp? Sản lượng ngành → giá nguyên liệu cạnh biên gộp → kiểm độ trễ.',
      kpis: ['spk-beer'], flow: [['prod', 'Sản lượng', 'Bia, sữa, IIP'], ['cost', 'Đầu vào → biên', 'Giá nguyên liệu cạnh biên gộp'], ['lag', 'Kiểm cơ chế', 'Độ trễ 2 quý (giả định)']], items: [
      {stage: 'prod'},
      {q: 'Sản lượng ngành đang tăng hay giảm?', id: 'rf-q-output', meta: '<b>sản lượng sản xuất</b> bia, sữa (triệu lít) · <b>chỉ số sản xuất</b> IIP (% so cùng kỳ) · NSO, toàn ngành, không phải sản lượng bán của doanh nghiệp', take: ['bl-30', 'bl-31']},
      {stage: 'cost'},
      {q: 'Giá đầu vào đang đi hướng nào so với biên gộp doanh nghiệp?', id: 'rf-q-cost', meta: 'chỉ số T1/2024 = 100 (giá gốc USD ở Chi tiết dữ liệu) · biên gộp % BCTC hợp nhất quý', take: ['bl-32', 'bl-40'],
        after: NOTE('<b>Doanh nghiệp × nguyên liệu liên quan:</b> VNM — sữa bột (SMP, WMP), đường · SAB — malt, lúa mạch, nhôm lon (chưa có nguồn công khai) · KDC — dầu cọ · MSN (Masan Consumer, Masan MEATLife) — dầu cọ, đường, khô đậu, ngô · QNS — bán đường (giá đường tăng là thuận), chưa có BCTC quý trong bộ dữ liệu.')},
      {stage: 'lag'},
      {q: 'Nếu giá nguyên liệu đi trước biên gộp 2 quý thì sao? (giả định phân tích)', id: 'rf-q-lag', meta: '<b>giả định</b> độ trễ 2 quý do tồn kho và hợp đồng mua · chỉ ghép chuỗi cùng quý quan sát', take: ['bl-41'],
        after: NOTE('<b>Đây là giả định để thử, chưa phải quan hệ đã kiểm định.</b> Để kiểm cơ chế truyền cần thêm: ngày tồn kho nguyên liệu từng doanh nghiệp, giá bán bình quân (đợt tăng giá của SAB, VNM), cơ cấu sản phẩm và tỷ giá USD/VND theo quý.')},
    ]},
    {k: 'policy', t: 'Chính sách & thuế', d: 'Mốc nào có thể đổi giá bán, sản lượng hoặc chi phí? Thẻ sự kiện theo ngày hiệu lực, lộ trình thuế suất, văn bản gốc.', items: [
      {q: 'Mốc nào có thể đổi giá bán, sản lượng hoặc chi phí?', id: 'rf-q-policy', meta: '● đã ban hành · ○ dự thảo · ngày hiệu lực', take: ['bl-52']},
      {q: 'Thuế suất tiêu thụ đặc biệt đi lên theo lộ trình nào?', id: 'rf-q-sintax', meta: '% thuế suất theo năm · phạm vi: bia, nước giải khát >5 g đường/100 ml · thuế suất ≠ mức tăng giá bán', take: ['bl-53']},
      {q: 'Văn bản gốc và ghi chú dữ liệu', id: 'rf-q-docs', take: ['bl-50']},
    ]},
  ]},
  mt14: {title: 'Tài chính ngành', subs: [
    {k: 'sector', t: 'Tài chính ngành', d: 'Định giá từng rổ và doanh thu, lợi nhuận, biên của ba nhóm, cộng từ BCTC hợp nhất quý.', kpis: ['spk-pe'], items: [
      {q: 'Thị trường định giá từng rổ ở mức nào?', id: 'rf-q-pe', meta: 'lần · rổ mã theo dõi (VNDirect) · không phải toàn ngành', take: ['bl-03']},
      {q: 'Doanh thu và lợi nhuận từng nhóm đi thế nào?', id: 'rf-q-rev', meta: 'nghìn tỷ đồng · Σ hợp nhất quý · Bán lẻ hiện đại (MWG, FRT, DGW, PET) · Lâu bền (PNJ, HAX, SVC) · Tiêu dùng nhanh (VNM, SAB, MSN, KDC)', take: ['bl-06']},
      {q: 'Biên của từng nhóm mở rộng hay thu hẹp?', id: 'rf-q-gm', meta: '% · Σ tử số ÷ Σ mẫu số cùng rổ, cùng quý · cấp doanh nghiệp, không phải cấp mảng', take: ['bl-07']},
    ]},
    {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'Bảng so sánh, bộ lọc mã và kỳ báo cáo để tra số chính xác; kế hoạch và kết quả 2026.', items: [
      {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'rf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ · hợp nhất hoặc thuộc cổ đông công ty mẹ theo định nghĩa nguồn', take: ['.financial-comparison']},
      {q: 'Doanh nghiệp đã đi được bao nhiêu so với kế hoạch 2026?', id: 'rf-q-plan', meta: 'tỷ đồng · kế hoạch cả năm so với kết quả gần nhất (ghi kỳ ở từng dòng)', take: ['bl-60', 'bl-61']},
    ]},
  ]},
};
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
const ALIAS = {mt3: ['mt2', 'fmcg'], mt4: ['mt2', 'policy'], mt5: ['mt1'], mt6: ['mt14', 'listed'], mt8: ['mt1', 'map', 'rf-sources'], mt9: ['mt14', 'sector']};
const SECTION = {policy: ['mt2', 'policy'], tax: ['mt2', 'policy'], trade: ['mt2', 'policy'], demand: ['mt2', 'all'], supply: ['mt2', 'modern'], price: ['mt2', 'fmcg'], margin: ['mt2', 'fmcg'],
  finance: ['mt14', 'sector'], listed: ['mt14', 'listed'], companies: ['mt14', 'listed'], players: ['mt14', 'listed'], sources: ['mt1', 'map', 'rf-sources']};

/* ---------- Phần dựng riêng ---------- */
function models() {
  // Ba nhóm: doanh thu đến từ đâu · biến quyết định biên · mã đại diện · chart liên quan.
  const M = [
    ['Bán lẻ hiện đại & điện máy', 'MWG · FRT · DGW · PET', 'Chuỗi điện máy, điện thoại, bách hóa (MWG); nhà thuốc, tiêm chủng, ICT (FRT); phân phối ICT, hàng tiêu dùng (DGW, PET)',
      'Số cửa hàng × doanh thu/cửa hàng; biên gộp theo cơ cấu hàng; chi phí thuê, nhân công mỗi điểm', [['#rf-q-stores', 'Mạng lưới & năng suất'], ['#rf-q-sssg', 'SSSG'], ['#rf-q-real', 'Sức mua']]],
    ['Hàng lâu bền: ô tô, trang sức', 'PNJ · HAX · SVC', 'Trang sức, vàng 24K (PNJ); đại lý Mercedes, MG, VinFast (HAX); đại lý đa hãng (SVC)',
      'Giá vàng và chênh lệch thế giới, cơ cấu trang sức/24K; số xe bán theo hãng, chiết khấu hãng, lãi suất', [['#rf-q-car', 'Sản lượng xe'], ['#rf-q-dealer', 'Biên đại lý'], ['#rf-q-pnj', 'Biên PNJ']]],
    ['Hàng tiêu dùng nhanh', 'VNM · SAB · QNS · MSN · KDC', 'Sữa (VNM), bia (SAB), đường & sữa đậu nành (QNS), thực phẩm, đồ uống, WinCommerce (MSN), dầu ăn, bánh kẹo (KDC)',
      'Giá sữa bột, malt, đường, dầu cọ (giá vốn, trễ theo tồn kho); thuế TTĐB; giá bán và sản lượng', [['#rf-q-output', 'Sản lượng'], ['#rf-q-cost', 'Đầu vào → biên'], ['#rf-q-sintax', 'Thuế TTĐB']]],
  ];
  const host = $('#blModels'); if (!host) return el('span');
  host.className = 'rf-models';
  host.innerHTML = M.map(([t, syms, rev, drv, links], i) => `<article class="rf-model"><header><span>${i + 1}</span><h4>${esc(t)}</h4></header><p class="rf-syms">${esc(syms)}</p>
    <dl><dt>Doanh thu đến từ</dt><dd>${esc(rev)}</dd><dt>Biến quyết định biên</dt><dd>${esc(drv)}</dd></dl>
    <nav>${links.map(([h, l]) => `<a href="${h}">${esc(l)} →</a>`).join('')}</nav></article>`).join('');
  host.after(el('div', 'source-note', 'Sơ đồ mô hình, không biểu thị tỷ trọng. Mã đại diện theo rổ dashboard; VNM, SAB, QNS, MSN cũng có ở dashboard Nông nghiệp theo chiều giá nguyên liệu.'));
  return el('span');
}

function topicLinks() {
  // Chủ đề nóng: sự kiện → nhóm mã → dòng mô hình có thể đổi → chỉ báo xác nhận → chart.
  const T = {
    'pnj-diamond': ['Biên gộp, chi phí dự phòng, lợi nhuận ròng PNJ; nợ vay khi huy động vốn', 'Biên gộp quý IV, dự phòng thu đổi còn lại, kết quả phát hành riêng lẻ', [['#rf-q-pnj', 'Biên gộp PNJ cạnh giá vàng'], ['#rf-q-gap', 'Chênh lệch vàng trong nước – thế giới']]],
    'bhx': ['Doanh thu (số cửa hàng × doanh thu/cửa hàng), chi phí bán hàng, biên ròng MWG, FRT, MSN', 'Số cửa hàng mở mới quý IV, doanh thu/cửa hàng, tỷ lệ cửa hàng mới hòa vốn', [['#rf-q-stores', 'Mạng lưới & năng suất'], ['#rf-q-sssg', 'SSSG so với tăng trưởng doanh thu']]],
    'sin-tax': ['Giá bán, sản lượng bia và nước giải khát; biên gộp SAB, MSN, QNS, VNM', 'Giá bán lẻ bia tháng 1/2027, sản lượng bia tháng 1–2, IIP đồ uống', [['#rf-q-sintax', 'Lộ trình thuế suất'], ['#rf-q-output', 'Sản lượng bia, IIP'], ['#rf-q-policy', 'Mốc hiệu lực']]],
    'ecommerce': ['Doanh thu kênh online và giá bán tại cửa hàng của MWG, FRT, DGW', 'Doanh số 4 sàn 9T/2026, tỷ trọng online trong doanh thu chuỗi', [['#rf-q-mix', 'Cơ cấu chi tiêu & kênh TMĐT'], ['#rf-q-policy', 'Luật TMĐT (1/7/2026)']]],
  };
  $$('[data-block-id^="bl-t"]').forEach(card => {
    if (card.querySelector('.rf-topic')) return;
    const key = card.closest('[data-topic-key]')?.dataset.topicKey || card.closest('[data-key]')?.dataset.key
      || {'bl-t1': 'pnj-diamond', 'bl-t2': 'bhx', 'bl-t3': 'sin-tax', 'bl-t4': 'ecommerce'}[card.dataset.blockId];
    const t = T[key]; if (!t) return;
    const box = el('dl', 'rf-topic', `<dt>Dòng mô hình có thể đổi</dt><dd>${esc(t[0])}</dd><dt>Chỉ báo xác nhận tiếp</dt><dd>${esc(t[1])}</dd><dt>Chart liên quan</dt><dd>${t[2].map(([h, l]) => `<a href="${h}">${esc(l)} →</a>`).join(' · ')}</dd>`);
    const src = card.querySelector(':scope>.source-note'); src ? src.before(box) : card.append(box);
  });
}

/* ---------- Dựng ---------- */
const TABS = {}, used = new Set(), BUILDS = [];
function take(sel) {
  const n = /^bl-/.test(sel) ? block(sel) : $(sel);
  if (!n || used.has(n) || [...used].some(u => u.contains(n))) return null;
  used.add(n); n.hidden = false; n.classList.remove('rf-hidden-legacy'); n.style.marginTop = '';
  if (/^bl-5\d$/.test(sel)) unfold(n);
  if (/^bl-(01|02|05|13|15|17|21|42|50|52|60|61)$/.test(sel)) n.classList.add('rf-wide');
  return n;
}
// research-layout gập mọi thẻ của tab Chính sách cũ (#mt4) vào <details>; Bức tranh ngành cần thẻ sự kiện và chart hiện sẵn → gỡ lớp gập.
function unfold(card) {
  const d = card.querySelector(':scope > details.research-fold'); if (!d) return;
  const body = d.querySelector(':scope > .research-detail');
  if (body) d.before(...body.childNodes);
  d.remove();
  card.querySelectorAll(':scope > .research-caption').forEach(n => n.remove());
  card.querySelectorAll('.research-repeated-heading').forEach(n => n.classList.remove('research-repeated-heading'));
}
function buildTab(key) {
  const def = TREE[key];
  let pane = $(`.majorpane[data-tab="${key}"]`);
  if (!pane) { pane = el('div', 'majorpane'); pane.dataset.tab = key; pane.id = 'pane-' + key; pane.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(pane); }
  const legacy = [...pane.children];
  const sec = el('section', 'section rf-section');
  if (key === 'mt1') { const brief = $('#dataBrief'); if (brief) sec.append(brief); }
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', def.title); sec.append(nav);
  const subs = def.subs.map((s, i) => {
    const lab = key === 'mt1' ? String(i).padStart(2, '0') : String(i + 1).padStart(2, '0');
    const b = el('button', 'tabbtn pp-tab', `<span>${lab}</span>${esc(s.t)}`); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = `rf-${key}-${s.k}-tab`; b.dataset.sub = s.k;
    const p = el('div', 'pp-pane rf-pane'); p.id = `rf-${key}-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${lab}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div><a class="rf-permalink" href="?sub=${s.k}#${key}" title="Link trực tiếp tới mục này">Link mục ↗</a>`));
    if (s.kpis) { const g = el('section', 'grid kpis pp-kpis'); s.kpis.forEach(sp => { const c = kpi(sp); if (c) g.append(c); }); if (g.children.length) p.append(g); }
    if (s.flow) {
      const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Luồng ' + s.t.toLowerCase());
      bar.innerHTML = s.flow.map(([id, k, t], j) => `${j ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#rf-st-${s.k}-${id}" class="pp-flow-s"><small>${k}</small><b>${esc(t)}</b></a>`).join('');
      p.append(bar);
    }
    let qn = 0;
    s.items.forEach(it => {
      if (it.grp) { p.append(el('h3', 'pp-grp', esc(it.grp))); return; }
      if (it.stage) { const f = s.flow.find(x => x[0] === it.stage); const h = el('div', 'pp-stage', `<span>${f[1]}</span><h3>${esc(f[2])}</h3>`); h.id = `rf-st-${s.k}-${f[0]}`; p.append(h); return; }
      const panel = el('section', 'pp-panel pp-q'); panel.id = it.id;
      qn++; const pn = key === 'mt1' ? `${i}.${qn}` : `${i + 1}.${qn}`;
      panel.innerHTML = `<header class="pp-ph"><span class="pp-num">${pn}</span><div><h3>${esc(it.q)}</h3>${it.meta ? `<p class="rf-meta">${it.meta}</p>` : ''}</div></header>`;
      const grid = el('div', 'pp-main rf-grid');
      (it.take || []).forEach(sel => { const n = take(sel); if (n) grid.append(n); });
      if (it.build) BUILDS.push(it.build); // chạy sau khi pane đã gắn vào trang (thẻ đang tách khỏi document)
      if (it.after) grid.append(it.after());
      (it.fold || []).forEach(([sel, label]) => { const n = take(sel); if (!n) return; const d = el('details', 'rf-fold rf-wide'); d.append(el('summary', '', esc(label)), n); grid.append(d); });
      panel.append(grid); p.append(panel);
    });
    const nx = def.subs[i + 1];
    if (nx) { const go = el('button', 'rf-next', `Tiếp: ${esc(nx.t)} →`); go.type = 'button'; go.addEventListener('click', () => { open(key, nx.k, 'push'); nav.scrollIntoView({behavior: 'instant', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open(key, s.k, 'push'));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const j = (i + d + def.subs.length) % def.subs.length; nav.children[j].click(); nav.children[j].focus(); });
    return {s, b, p};
  });
  TABS[key] = subs;
  return {pane, sec, legacy};
}
function commit({pane, sec, legacy}) {
  const rest = [];
  legacy.forEach(n => { if (sec.contains(n)) return; if (n.querySelector?.('[data-block-id],canvas,table,svg') || n.matches?.('[data-block-id]')) rest.push(n); });
  pane.replaceChildren(sec);
  return rest;
}
function parkRest(nodes) {
  const live = nodes.filter(n => n.querySelector?.('[data-block-id]:not(.rf-hidden-legacy),canvas,table,svg') || n.matches?.('[data-block-id]'));
  live.forEach(n => n.querySelectorAll?.('.supply-tabs,.pane-subtabs,.sectionhead').forEach(x => x.classList.add('rf-hidden-legacy')));
  const real = live.filter(n => [...(n.querySelectorAll?.('[data-block-id]') || [])].some(b => !used.has(b) && ![...used].some(u => u.contains(b))) || (n.matches?.('[data-block-id]') && !used.has(n)));
  if (!real.length) return;
  const host = TABS.mt1[0].p, d = el('details', 'research-fold rf-rest');
  d.append(el('summary', '', 'Nội dung khác của bố cục cũ'));
  const box = el('div', 'research-detail'); real.forEach(n => { n.hidden = false; n.querySelectorAll('[hidden]').forEach(h => { if (h.matches('.supply-pane,.pane-subpane')) h.hidden = false; }); box.append(n); });
  d.append(box); host.append(d);
}
function sources() {
  // Tab Nguồn dữ liệu cũ (#mt8, do research-layout dựng) → khối mở rộng cuối Bản đồ ngành; link cũ #mt8 mở thẳng khối này.
  const p = $('.majorpane[data-tab="mt8"]'), d = el('details', 'research-fold rf-sources rf-wide'); d.id = 'rf-sources';
  d.append(el('summary', '', 'Nguồn dữ liệu, kỳ quan sát và độ tin cậy'));
  const box = el('div', 'research-detail');
  if (p) { [...p.children].forEach(n => { if (n.matches('h2,.research-caption')) return; n.querySelectorAll('[hidden]').forEach(h => { if (h.matches('.pane-subpane')) h.hidden = false; }); n.querySelectorAll('.pane-subtabs,.supply-tabs').forEach(x => x.classList.add('rf-hidden-legacy')); if (n.matches('.pane-subtabs,.supply-tabs')) return; if (n.matches('.pane-subpane')) n.hidden = false; box.append(n); }); p.replaceChildren(); }
  const b90 = block('bl-90'); if (b90 && !used.has(b90)) { used.add(b90); box.append(b90); }
  d.append(box); TABS.mt1[0].p.append(d);
}

function setUrl(key, sub, mode) {
  const u = new URL(location.href);
  if (sub) u.searchParams.set('sub', sub); else u.searchParams.delete('sub');
  u.searchParams.delete('section'); u.hash = key;
  const next = u.pathname + u.search + u.hash;
  if (next === location.pathname + location.search + location.hash) return;
  if (mode === 'push') history.pushState({rf: 1}, '', next); else history.replaceState(history.state, '', next);
}
function open(key, sub, mode) {
  const subs = TABS[key]; if (!subs) return;
  const hit = subs.find(x => x.s.k === sub) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.classList.toggle('active', on); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  const bar_ = hit.b.parentElement; if (bar_ && bar_.scrollWidth > bar_.clientWidth) bar_.scrollLeft = Math.max(0, hit.b.offsetLeft - 12);
  if (mode) setUrl(key, hit.s.k, mode);
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
  window.dispatchEvent(new Event('pv:toc'));
}

let bar;
function showMajor(key) {
  $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
  [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
}
// Đọc URL (vào trang, Back/Forward, đổi hash): ?section= (link cũ) > #mtN (+ ?sub=) > #<id> thẻ đã dời.
function route(mode) {
  const u = new URL(location.href), h = location.hash.slice(1), secQ = SECTION[u.searchParams.get('section')];
  let key, sub = u.searchParams.get('sub'), target = null;
  if (secQ) [key, sub, target] = secQ;
  else if (/^mt\d+$/.test(h)) { key = h; if (ALIAS[h]) [key, sub, target] = ALIAS[h]; }
  else if (h && document.getElementById(h)) return goTo(h, mode);
  else key = 'mt1';
  if (!ROUTES.some(r => r[0] === key)) key = 'mt1';
  showMajor(key);
  if (TABS[key]) open(key, sub, secQ || ALIAS[h] ? 'replace' : mode);
  else setUrl(key, null, mode);
  if (target) { const t = document.getElementById(target); if (t) { if (t.matches('details')) t.open = true; setTimeout(() => t.scrollIntoView({behavior: 'instant', block: 'start'}), 80); } }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
function goTo(id, mode = 'push') {
  const t = id && document.getElementById(id); if (!t) return false;
  const pane = t.closest('.majorpane'); if (!pane) return false;
  const key = pane.dataset.tab, sub = t.closest('.rf-pane');
  showMajor(key);
  if (sub) open(key, sub.dataset.sub, mode); else setUrl(key, null, mode);
  for (let d = t.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
  setTimeout(() => t.scrollIntoView({behavior: 'instant', block: 'start'}), 80);
  return true;
}
function nav() {
  bar = $('nav.majortabs') || $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  ROUTES.forEach(([key, label], i) => {
    const b = el('button', 'majortabbtn', label); b.type = 'button'; b.dataset.tab = key; b.id = 'research-tab-' + key; b.setAttribute('role', 'tab');
    const p = $(`.majorpane[data-tab="${key}"]`); if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); }
    b.addEventListener('click', () => {
      showMajor(key);
      if (TABS[key]) { const cur = TABS[key].find(x => !x.p.hidden) || TABS[key][0]; open(key, cur.s.k, 'push'); } else setUrl(key, null, 'push');
      window.scrollTo({top: 0, behavior: 'instant'});
    });
    b.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? ROUTES.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : ROUTES.length - 1)) % ROUTES.length; bar.children[j].click(); bar.children[j].focus(); });
    bar.append(b);
  });
  bar.setAttribute('role', 'tablist');
  window.showMajorTab = k => { location.hash = k; };
  window.addEventListener('popstate', () => route(null));
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (/^mt\d+$/.test(h)) route('replace'); else if (h) goTo(h, 'replace'); });
  route('replace');
}

function run() {
  if (document.body.dataset.rfFrame) return; document.body.dataset.rfFrame = '1';
  history.scrollRestoration = 'manual';
  const rest = [];
  // Dựng hết các tab rồi mới thay nội dung pane (tab sau còn lấy thẻ nằm trong tab cũ, vd. bl-03 ở Tổng quan cũ).
  ['mt1', 'mt2', 'mt14'].map(buildTab).forEach(b => rest.push(...commit(b)));
  ['mt4'].forEach(k => { const p = $(`.majorpane[data-tab="${k}"]`); if (!p) return; [...p.children].forEach(n => { if (n.querySelector?.('[data-block-id]') || n.matches?.('[data-block-id]')) rest.push(n); }); p.replaceChildren(); });
  sources();
  parkRest(rest);
  BUILDS.forEach(f => f());
  topicLinks();
  // Link "#<id>" tới thẻ/câu hỏi đã dời: mở đúng tab lớn + sub-tab rồi cuộn tới.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); if (!id || /^mt\d+$/.test(id)) return;
    const t = document.getElementById(id);
    if (!t || !t.closest('.majorpane') || a.closest('.pp-flow') && t.closest('.rf-pane') === a.closest('.rf-pane')) {
      if (t && a.closest('.pp-flow')) { e.preventDefault(); t.scrollIntoView({behavior: 'smooth', block: 'start'}); }
      return;
    }
    e.preventDefault(); goTo(id, 'push');
  });
  // Link mục (permalink) → mở tại chỗ bằng pushState để Back quay lại mục trước.
  document.addEventListener('click', e => {
    const a = e.target.closest('a.rf-permalink'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault(); const u = new URL(a.href, location.href); history.pushState({rf: 1}, '', u.pathname + u.search + u.hash); route(null);
  });
  nav();
  const setTop = () => { const t = $('.majortabs'), cs = t && getComputedStyle(t), top = cs && cs.position === 'sticky' ? t.getBoundingClientRect().height + (parseFloat(cs.top) || 0) + 6 : 0; $$('.rf-section>.pp-nav').forEach(n => { n.style.top = top + 'px'; }); };
  setTop(); addEventListener('resize', setTop);
  document.documentElement.dataset.rfReady = '1';
  window.dispatchEvent(new Event('rf:frame'));
}
if (window.SectorBoot) SectorBoot.add(1200, run);
else if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
})();
