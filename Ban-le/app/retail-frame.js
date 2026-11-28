/* Bán lẻ & tiêu dùng · khung 4 tab theo mẫu Điện (26/11/2026), dựng từ khung Thủy sản (Thuy-san/app/seafood-frame.js).
   Tab lớn: Tổng quan ngành (#mt1: 00 Bản đồ ngành · 01 Chuỗi giá trị theo loại hình doanh nghiệp · 02 Triển vọng; bỏ Mô hình kiếm tiền, Vị trí chu kỳ 27/11/2026; Bản tin dữ liệu ở đầu)
          · Bức tranh ngành (#mt2: 01 Toàn ngành · 02 Bán lẻ hiện đại & điện máy · 03 Mạng lưới bán lẻ · 04 Trang sức · 05 Hàng tiêu dùng nhanh · 06 Chính sách & thuế)
          · Tài chính ngành (#mt14: 01 Tài chính ngành · 02 Doanh nghiệp niêm yết · 03 Định giá)
          · Chủ đề nóng (#mt7, giữ research-editorial; mỗi chủ đề thêm dòng mô hình bị tác động, chỉ báo xác nhận, link chart).
   Sữa, Bia, Ô tô – Xe máy tách thành dashboard riêng (Sua/, Bia/, O-to-xe-may/) 26/11/2026; ?sub=durable cũ → Trang sức.
   Card cũ được DỜI theo data-block-id (không nhân bản, không xóa); card chưa có chỗ gom vào "Nội dung khác".
   URL: ?sub=<khóa>#mtN. Bấm tab/sub-tab → pushState nên nút Back/Forward đi lại đúng mục (popstate dựng lại).
   Link cũ: #mt3 → Hàng tiêu dùng nhanh (Giá – Chi phí – Margin cũ), #mt4 / ?section=policy|tax|trade → Chính sách & thuế,
   #mt6 / ?section=listed|companies → Doanh nghiệp niêm yết, #mt8 / ?section=sources → Nguồn dữ liệu (mở sẵn ở cuối Bản đồ ngành).
   28/11/2026 (khung chuẩn Điện, DASHBOARD_WORKFLOW §42): Tổng quan dùng thanh .ov-nav (số · tiêu đề · dòng phụ); mỗi sub-tab Bức tranh ngành có
   "Dữ liệu mới nhất" tính từ chính chuỗi trên sub-tab, 2–4 ô số (ô có sẵn hoặc dựng từ window.RETAIL_PUBLIC, RETAIL_BIZMAP, COMPANY_QUARTERLY và bảng
   trên trang), thanh luồng ở sub-tab phân khúc; mỗi câu hỏi: thẻ đầu = chart trả lời chính (.pp-main), thẻ thứ hai .pp-sup1, còn lại .pp-more.
   Tài chính ngành › 01 = app/retail-finance.js (cộng gộp BCTC quý window.RETAIL_FIN), › 03 Định giá = app/peer-valuation.js (data-auto).
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
    {k: 'map', t: 'Bản đồ ngành', sub: 'Sức mua → loại hình → kênh → biên', d: 'Sức mua (thu nhập, khách, tín dụng) → ba nhóm doanh nghiệp → kênh bán → biên lợi nhuận.', items: [
      {q: 'Sức mua đi qua những khâu nào trước khi thành lợi nhuận?', id: 'rf-q-map', take: ['bl-01']},
    ]},
    {k: 'chain', t: 'Chuỗi giá trị theo loại hình doanh nghiệp', sub: 'Đầu vào → vận hành → kênh → biên', d: 'Mỗi loại hình doanh nghiệp đi từ đầu vào, vận hành, kênh bán đến biên lợi nhuận ra sao.', items: [
      {q: 'Mỗi loại hình doanh nghiệp kiếm tiền ở khâu nào, biên ở mức nào?', id: 'rf-q-chain', meta: 'biên gộp quý gần nhất từ BCTC hợp nhất · số cửa hàng cuối Q3/2026', take: ['bl-08']},
    ]},
    {k: 'outlook', t: 'Triển vọng', sub: 'Ba biến quyết định các quý tới', d: 'Ba biến cần theo dõi: số mới nhất, hàm ý với doanh nghiệp, kỳ cần kiểm tiếp.', items: [
      {q: 'Ba biến nào sẽ quyết định kết quả các quý tới?', id: 'rf-q-outlook', meta: 'số mới nhất tự lấy từ dữ liệu trên trang', take: ['bl-09']},
    ]},
  ]},
  mt2: {title: 'Bức tranh ngành', subs: [
    {k: 'all', t: 'Toàn ngành', d: 'Sức mua thực đang tăng bao nhiêu? Tổng mức bán lẻ, tăng trưởng so cùng kỳ, cơ cấu chi tiêu; CPI, khách quốc tế, tín dụng là lớp giải thích.', kpis: ['spk-retail', 'spk-cpi', 'spk-tourist', 'spk-pe'], items: [
      {grp: 'Sức mua'},
      {q: 'Sức mua thực đang tăng bao nhiêu?', id: 'rf-q-real', meta: 'NSO, giá hiện hành, theo tháng', take: ['bl-10', 'bl-16']},
      {q: 'Tiền chi tiêu đi vào đâu?', id: 'rf-q-mix', meta: 'cơ cấu cộng đúng về tổng 9T/2026', take: ['bl-13']},
      {grp: 'Chỉ báo giải thích'},
      {q: 'Giá, khách quốc tế và tín dụng giải thích gì cho sức mua?', id: 'rf-q-drivers', meta: 'CPI % so cùng kỳ · khách quốc tế theo tháng · <b>tổng</b> tín dụng nền kinh tế (chưa tách tín dụng tiêu dùng)', take: ['bl-11', 'bl-33', 'bl-12'],
        fold: [['.fsv-heat', 'Bảng nhiệt: tăng trưởng so cùng kỳ của các chỉ báo theo tháng']]},
    ]},
    {k: 'modern', t: 'Bán lẻ hiện đại & điện máy', d: 'Doanh thu tăng nhờ mở thêm hay nhờ cửa hàng hiện hữu bán tốt hơn? MWG, FRT, WinCommerce (MSN) so theo đúng mô hình.',
      flow: [['chan', 'Kênh', 'Thị phần kênh hiện đại'], ['store', 'Mạng lưới', 'Số điểm bán, doanh thu mỗi điểm'], ['sssg', 'Tăng trưởng', 'Cửa hàng hiện hữu hay mở mới']], items: [
      {stage: 'chan'},
      {q: 'Kênh hiện đại đang lấy thị phần từ kênh truyền thống nhanh tới đâu?', id: 'rf-q-channel', meta: '% doanh thu bán lẻ theo kênh · theo năm · số làm tròn, khác nguồn tổng hợp', take: ['bl-44']},
      {stage: 'store'},
      {q: 'Mở thêm bao nhiêu điểm bán, mỗi điểm bán được bao nhiêu?', id: 'rf-q-stores', meta: 'số điểm cuối kỳ · tỷ đồng/cửa hàng/tháng · ● công bố ○ tự tính (mẫu số cuối kỳ làm chuỗi mở nhanh bị tính thấp)', take: ['bl-14', 'bl-15']},
      {stage: 'sssg'},
      {q: 'Chuỗi nào tăng nhờ cửa hàng hiện hữu, chuỗi nào nhờ mở mới?', id: 'rf-q-sssg', meta: '% so cùng kỳ 9T/2026 · chỉ chuỗi công bố cả doanh thu và SSSG', take: ['bl-43'],
        after: NOTE('<b>So theo mô hình:</b> điện máy – điện thoại (MWG khối ĐMX, FPT Shop) tăng nhờ năng suất cửa hàng, nên theo dõi SSSG và biên gộp; bách hóa (Bách Hóa Xanh, WinCommerce) và nhà thuốc (Long Châu) tăng nhờ mở mới, nên theo dõi tỷ lệ cửa hàng mới hòa vốn, chi phí bán hàng/doanh thu và doanh thu/cửa hàng sau 12 tháng. <b>Còn thiếu để dựng cầu nối:</b> số cửa hàng bình quân và SSSG theo quý của Long Châu, Bách Hóa Xanh, WinCommerce. Biên gộp từng nhóm: <a href="#rf-q-gm">Tài chính ngành › Doanh nghiệp niêm yết</a>.')},
    ]},
    {k: 'network', t: 'Mạng lưới bán lẻ', d: 'Quy mô và phân bổ 3 miền của mạng lưới cửa hàng: chuỗi niêm yết so với đối thủ cùng mô hình (bách hóa, điện máy, nhà thuốc, trang sức, mẹ & bé), theo số Bizmap.live ghi nhận.',
      flow: [['scale', 'Quy mô', 'Chuỗi niêm yết so với đối thủ'], ['geo', 'Phân bổ', 'Bắc · Trung · Nam'], ['check', 'Kiểm chứng', 'Số công bố, ảnh chụp hằng tuần']], items: [
      {stage: 'scale'},
      {q: 'Chuỗi niêm yết đứng ở đâu so với đối thủ cùng mô hình?', id: 'rf-q-net-scale', meta: 'điểm bán Bizmap ghi nhận (không phải thị phần doanh thu) · chọn nhóm cạnh tranh và chuỗi ở phía trên, dùng chung cho bản đồ và bảng 3 miền', take: ['bl-70', 'bl-71', 'bl-72']},
      {stage: 'geo'},
      {q: 'Mạng lưới từng chuỗi dồn vào miền nào?', id: 'rf-q-net-geo', meta: 'Bắc · Trung · Nam theo 34 tỉnh/thành từ 01/07/2025 · cùng nhóm cạnh tranh đang chọn', take: ['bl-74']},
      {stage: 'check'},
      {q: 'Số Bizmap ghi nhận lệch bao nhiêu so với số doanh nghiệp công bố?', id: 'rf-q-net-official', meta: 'số công bố dùng cho doanh thu/cửa hàng · Bizmap dùng cho phân bố địa lý', take: ['bl-73']},
      {q: 'Mạng lưới đang mở rộng thế nào?', id: 'rf-q-net-hist', meta: 'ảnh chụp hằng tuần · điểm mới ghi nhận chưa chắc là cửa hàng mới khai trương', take: ['bl-77']},
    ]},
    {k: 'jewelry', t: 'Trang sức', d: 'Giá vàng truyền vào lợi nhuận PNJ qua đâu? Giá vàng, chênh lệch với thế giới, biên gộp PNJ. Ô tô – Xe máy có dashboard riêng.',
      flow: [['gold', 'Đầu vào', 'Giá vàng & chênh lệch thế giới'], ['margin', 'Biên', 'Biên gộp PNJ'], ['stores', 'Mạng lưới', 'Cửa hàng PNJ']], items: [
      {stage: 'gold'},
      {q: 'Giá vàng trong nước đang đi đâu?', id: 'rf-q-gold', meta: 'triệu đồng/lượng · SJC miếng và nhẫn, điểm cuối tháng (WiData)', take: ['bl-24', 'bl-23']},
      {q: 'Vàng trong nước đắt hơn thế giới bao nhiêu?', id: 'rf-q-gap', meta: 'một ngày đã đối chiếu (11/10/2026) · quy đổi tự tính và số bài nguồn đặt cạnh nhau', take: ['bl-42']},
      {stage: 'margin'},
      {q: 'Giá vàng truyền vào biên gộp PNJ qua đâu?', id: 'rf-q-pnj', meta: '% · biên gộp hợp nhất PNJ cạnh giá SJC so cùng kỳ', take: ['bl-27'],
        after: NOTE('<b>Cơ chế:</b> biên gộp PNJ = cơ cấu (trang sức biên cao, vàng 24K biên thấp) × chênh giá bán với giá vốn tồn kho. <b>Chỉ báo cần kiểm tiếp:</b> tỷ trọng doanh thu vàng 24K theo quý, tồn kho vàng (18.855 tỷ cuối Q3), dự phòng thu đổi kim cương còn lại — chưa có chuỗi công bố theo quý trong repo.')},
      {stage: 'stores'},
      {q: 'PNJ đang mở thêm hay đóng bớt cửa hàng?', id: 'rf-q-pnj-stores', meta: 'cửa hàng · số PNJ công bố cuối kỳ', take: ['bl-80']},
      {q: 'Cửa hàng PNJ nằm ở đâu?', id: 'rf-q-pnj-geo', meta: 'Bizmap ghi nhận theo tỉnh/thành và 3 miền · đối thủ trang sức ở 03 Mạng lưới bán lẻ', take: ['bl-81']},
      {q: 'Tuần này PNJ mở, đóng cửa hàng ở tỉnh nào?', id: 'rf-q-pnj-week', meta: 'ảnh chụp Bizmap hằng tuần', take: ['bl-82']},
    ]},
    {k: 'fmcg', t: 'Hàng tiêu dùng nhanh', d: 'Giá đầu vào đang tác động thế nào lên biên gộp MSN, KDC? Chỉ số sản xuất → giá nguyên liệu cạnh biên gộp → kiểm độ trễ. Sữa, Bia có dashboard riêng.',
      flow: [['prod', 'Sản xuất', 'IIP thực phẩm, đồ uống'], ['cost', 'Đầu vào → biên', 'Giá nguyên liệu cạnh biên gộp'], ['lag', 'Kiểm cơ chế', 'Độ trễ 2 quý (giả định)']], items: [
      {stage: 'prod'},
      {q: 'Chỉ số sản xuất thực phẩm, đồ uống đang tăng hay giảm?', id: 'rf-q-output', meta: '<b>chỉ số sản xuất</b> IIP (% so cùng kỳ) · NSO, toàn ngành, không phải sản lượng bán của doanh nghiệp', take: ['bl-31']},
      {stage: 'cost'},
      {q: 'Giá đầu vào đang đi hướng nào so với biên gộp doanh nghiệp?', id: 'rf-q-cost', meta: 'chỉ số T1/2024 = 100 (giá gốc USD ở Chi tiết dữ liệu) · biên gộp % BCTC hợp nhất quý', take: ['bl-32', 'bl-40'],
        after: NOTE('<b>Doanh nghiệp × nguyên liệu liên quan:</b> KDC — dầu cọ · MSN (Masan Consumer, Masan MEATLife) — dầu cọ, đường, khô đậu, ngô · QNS — bán đường (giá đường tăng là thuận), chưa có BCTC quý trong bộ dữ liệu.')},
      {stage: 'lag'},
      {q: 'Nếu giá nguyên liệu đi trước biên gộp 2 quý thì sao? (giả định phân tích)', id: 'rf-q-lag', meta: '<b>giả định</b> độ trễ 2 quý do tồn kho và hợp đồng mua · chỉ ghép chuỗi cùng quý quan sát', take: ['bl-41'],
        after: NOTE('<b>Đây là giả định để thử, chưa phải quan hệ đã kiểm định.</b> Để kiểm cơ chế truyền cần thêm: ngày tồn kho nguyên liệu từng doanh nghiệp, giá bán bình quân, cơ cấu sản phẩm và tỷ giá USD/VND theo quý.')},
    ]},
    {k: 'policy', t: 'Chính sách & thuế', d: 'Mốc nào có thể đổi giá bán, sản lượng hoặc chi phí? Thẻ sự kiện theo ngày hiệu lực, lộ trình thuế suất, văn bản gốc.', items: [
      {q: 'Mốc nào có thể đổi giá bán, sản lượng hoặc chi phí?', id: 'rf-q-policy', meta: '● đã ban hành · ○ dự thảo · ngày hiệu lực', take: ['bl-52']},
      {q: 'Văn bản gốc nào quy định các mốc trên?', id: 'rf-q-docs', take: ['bl-50']},
    ]},
  ]},
  mt14: {title: 'Tài chính ngành', subs: [
    // 28/11/2026 (khung chuẩn Điện): 01 Tài chính ngành = chỉ số cộng gộp BCTC quý (app/retail-finance.js tự dựng vào .bl-fin-host khi chỗ chứa hiện;
    // 6 ô số, câu hỏi 1.1–1.7) · 02 Doanh nghiệp niêm yết = từng mã (bảng so sánh, xu hướng theo quý, kế hoạch, P/E rổ cuối cùng như th-03 của Thép)
    // · 03 Định giá = app/peer-valuation.js tự thêm. Ô số spk-pe dời sang Bức tranh ngành › 01 như Thép, Chăn nuôi.
    {k: 'sector', t: 'Tài chính ngành', d: 'Kết quả kinh doanh, biên, CAPEX, công nợ, nợ vay và hiệu quả vốn cộng gộp từ BCTC hợp nhất quý của MWG, FRT, DGW, PET, PNJ, MSN, KDC.', items: [
      {host: 'bl-fin-host', id: 'bl-fin-root'},
    ]},
    {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'Bảng so sánh, xu hướng theo quý của từng nhóm, kế hoạch – kết quả 2026 và P/E rổ mã.', items: [
      {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'rf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ · hợp nhất hoặc thuộc cổ đông công ty mẹ theo định nghĩa nguồn', take: ['.financial-comparison']},
      {q: 'Doanh thu và lợi nhuận từng nhóm đi thế nào?', id: 'rf-q-rev', meta: 'nghìn tỷ đồng · Σ hợp nhất quý · Bán lẻ hiện đại (MWG, FRT, DGW, PET) · Trang sức (PNJ) · Tiêu dùng nhanh (MSN, KDC)', take: ['bl-06']},
      {q: 'Biên của từng nhóm mở rộng hay thu hẹp?', id: 'rf-q-gm', meta: '% · Σ tử số ÷ Σ mẫu số cùng rổ, cùng quý · cấp doanh nghiệp, không phải cấp mảng', take: ['bl-07']},
      {q: 'Doanh nghiệp đã đi được bao nhiêu so với kế hoạch 2026?', id: 'rf-q-plan', meta: 'tỷ đồng · kế hoạch cả năm so với kết quả gần nhất (ghi kỳ ở từng dòng)', take: ['bl-60', 'bl-61']},
      {q: 'Thị trường định giá từng rổ ở mức nào?', id: 'rf-q-pe', meta: 'lần · rổ mã theo dõi (VNDirect) · không phải toàn ngành', take: ['bl-03']},
    ]},
  ]},
};
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
const SUB_ALIAS = {durable: 'jewelry', model: 'chain', cycle: 'outlook'}; // ?sub= cũ trước khi tách Ô tô – Xe máy
// ?sub=model cũ → Bản đồ ngành
const ALIAS = {mt3: ['mt2', 'fmcg'], mt4: ['mt2', 'policy'], mt5: ['mt1'], mt6: ['mt14', 'listed'], mt8: ['mt1', 'map', 'rf-sources'], mt9: ['mt14', 'sector']};
const SECTION = {policy: ['mt2', 'policy'], tax: ['mt2', 'policy'], trade: ['mt2', 'policy'], demand: ['mt2', 'all'], supply: ['mt2', 'modern'], price: ['mt2', 'fmcg'], margin: ['mt2', 'fmcg'],
  finance: ['mt14', 'sector'], listed: ['mt14', 'listed'], companies: ['mt14', 'listed'], players: ['mt14', 'listed'], sources: ['mt1', 'map', 'rf-sources']};

/* ---------- Phần dựng riêng ---------- */
function topicLinks() {
  // Chủ đề nóng: sự kiện → nhóm mã → dòng mô hình có thể đổi → chỉ báo xác nhận → chart.
  const T = {
    'pnj-diamond': ['Biên gộp, chi phí dự phòng, lợi nhuận ròng PNJ; nợ vay khi huy động vốn', 'Biên gộp quý IV, dự phòng thu đổi còn lại, kết quả phát hành riêng lẻ', [['#rf-q-pnj', 'Biên gộp PNJ cạnh giá vàng'], ['#rf-q-gap', 'Chênh lệch vàng trong nước – thế giới']]],
    'bhx': ['Doanh thu (số cửa hàng × doanh thu/cửa hàng), chi phí bán hàng, biên ròng MWG, FRT, MSN', 'Số cửa hàng mở mới quý IV, doanh thu/cửa hàng, tỷ lệ cửa hàng mới hòa vốn', [['#rf-q-stores', 'Mạng lưới & năng suất'], ['#rf-q-sssg', 'SSSG so với tăng trưởng doanh thu']]],
    'ecommerce': ['Doanh thu kênh online và giá bán tại cửa hàng của MWG, FRT, DGW', 'Doanh số 4 sàn 9T/2026, tỷ trọng online trong doanh thu chuỗi', [['#rf-q-policy', 'Luật TMĐT (1/7/2026)']]],
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

/* ---------- Ô số và "Dữ liệu mới nhất" từng sub-tab (28/11/2026, khung chuẩn Điện) ----------
   Ô số dựng từ số đang có trên trang: chuỗi window.RETAIL_PUBLIC (NSO, IMF, WiData), window.RETAIL_BIZMAP, window.COMPANY_QUARTERLY (BCTC quý)
   và bảng số doanh nghiệp công bố trong thẻ bl-14, bl-43. Không chép tay số. Mỗi ô mang kỳ quan sát (data-asof); "Dữ liệu mới nhất" của sub-tab
   = kỳ mới nhất trong các ô (năm/tháng/quý giữ đúng độ chi tiết của nguồn). Dựng trước khi dời thẻ (bảng còn nằm trong trang). */
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const dmy = d => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
const mon = d => `T${+d.slice(5, 7)}/${d.slice(0, 4)}`;
const normD = d => /^\d{4}Q\d$/.test(d) ? `${d.slice(0, 4)}-${String(d.slice(-1) * 3).padStart(2, '0')}-30` : /^\d{4}-\d\d$/.test(d) ? d + '-28' : d;
const showD = d => /^\d{4}Q\d$/.test(d) ? `Q${d.slice(-1)}/${d.slice(0, 4)}` : /^\d{4}-\d\d$/.test(d) ? mon(d) : dmy(d);
const latest = ds => ds.filter(Boolean).sort((a, b) => normD(a).localeCompare(normD(b))).at(-1);
const series = k => { const B = window.RETAIL_PUBLIC?.blocks || {}; return (B.macro?.series?.[k] || B.commodity?.series?.[k] || B.gold?.series?.[k])?.records || []; };
const yoyRec = (rs, r) => { if (!r) return null; const p = rs.find(x => x.date.slice(0, 7) === `${+r.date.slice(0, 4) - 1}${r.date.slice(4, 7)}`); return p && p.value ? (r.value / p.value - 1) * 100 : null; };
const cq = sym => (window.COMPANY_QUARTERLY?.companies || []).find(c => c.symbol === sym && c.sector === 'retail');
const qKey = q => q ? `${q.slice(3)}Q${q[1]}` : null;  // "Q3/2026" → "2026Q3"
function tile(o) {
  if (!o) return null;
  const k = el('div', 'kpi pp-kpi rf-kpi'); if (o.date) k.dataset.asof = o.date;
  k.innerHTML = `<div class="label">${esc(o.label)}</div><div class="value">${o.value}${o.unit ? `<span class="unit"> ${esc(o.unit)}</span>` : ''}</div><div class="delta">${o.delta || ''}</div><div class="sub">${o.sub || ''}</div>`;
  return k;
}
// Ô theo chuỗi tháng của RETAIL_PUBLIC (monthly: kỳ = tháng; có ngày quan sát cụ thể thì giữ ngày).
function tileSeries(k, label, o = {}) {
  const rs = series(k), r = rs.at(-1); if (!r) return null;
  const date = o.day ? r.date : r.date.slice(0, 7), g = o.level ? null : yoyRec(rs, r);
  return tile({label: `${label} · ${showD(date)}`, value: o.fmt ? o.fmt(r.value) : nf(r.value, o.d ?? 1), unit: o.unit, delta: o.delta ? o.delta(r) : fin(g) ? `${sg(g)}% so cùng kỳ` : '', sub: o.sub, date});
}
// Ô theo BCTC quý (COMPANY_QUARTERLY, VNDirect finfo): quý mới nhất có số, so cùng quý năm trước.
function tileFin(sym, key, label, o = {}) {
  const c = cq(sym), a = c?.[key] || [], qs = window.COMPANY_QUARTERLY?.quarters || []; let i = a.length - 1; while (i >= 0 && !fin(a[i])) i--; if (i < 0) return null;
  const pv = a[i - 4], d = o.pp ? (fin(pv) ? `${sg(a[i] - pv)} điểm % so cùng kỳ` : '') : (fin(pv) && pv > 0 ? `${sg((a[i] / pv - 1) * 100)}% so cùng kỳ` : '');
  return tile({label: `${label} · ${qs[i]}`, value: nf(a[i], o.d ?? 0), unit: o.unit, delta: d, sub: 'BCTC hợp nhất quý (VNDirect)', date: qKey(qs[i])});
}
// Ô từ bảng số doanh nghiệp công bố (cột 0 = tên chuỗi). Bảng "Chi tiết dữ liệu" có thể đã được research-layout dời vào khung nguồn
// ngoài thẻ, nên tìm theo tiêu đề cột thay vì theo thẻ.
const tableRow = (head, re) => { for (const t of document.querySelectorAll('table')) { const h = [...t.querySelectorAll('thead th')].map(x => x.textContent.trim()).join('|'); if (!head.test(h)) continue;
  const c = [...t.querySelectorAll('tbody tr')].map(tr => [...tr.cells].map(td => td.textContent.trim())).find(r => re.test(r[0] || '')); if (c) return c; } return null; };
const textDate = t => { let m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; m = /Q(\d)\/(\d{4})/.exec(t); if (m) return `${m[2]}Q${m[1]}`; m = /(\d{1,2})T\/(\d{4})/.exec(t); return m ? `${m[2]}-${m[1].padStart(2, '0')}` : null; };
const KT = {}, ASOF = {};
function buildKpis() {
  const BZ = window.RETAIL_BIZMAP, bzDate = BZ?.source_updated || (BZ?.captured_at || '').slice(0, 10), chains = Object.values(BZ?.chains || {});
  const pct = v => `${sg(v, 1)}%`;
  const ST = /^Chuỗi\|Số điểm bán\|Thời điểm/, SS = /^Chuỗi\|Doanh thu 9T[^|]*\|SSSG/;  // bảng của thẻ bl-14, bl-43 (labels-vi.js có thể đã đổi “YoY” thành “so cùng kỳ”)
  const bhx = tableRow(ST, /^Bách Hóa Xanh/), dmx = tableRow(SS, /^Khối Điện Máy Xanh/), pnj = tableRow(ST, /^PNJ$/);
  const sssgP = textDate(block('bl-43')?.querySelector('.chart-sub')?.textContent || '');
  KT.modern = [tileFin('MWG', 'revenue', 'Doanh thu MWG', {unit: 'tỷ đ'}), tileFin('FRT', 'revenue', 'Doanh thu FRT', {unit: 'tỷ đ'}),
    bhx && tile({label: 'Bách Hóa Xanh: số cửa hàng', value: esc(bhx[1]), unit: 'cửa hàng', delta: esc(bhx[3] || ''), sub: `${esc(bhx[2])} · doanh nghiệp công bố`, date: textDate(bhx[2])}),
    dmx && tile({label: `SSSG khối Điện Máy Xanh${sssgP ? ' · ' + (/^\d{4}-\d\d$/.test(sssgP) ? `${+sssgP.slice(5)}T/${sssgP.slice(0, 4)}` : showD(sssgP)) : ''}`, value: esc(dmx[2]), unit: 'so cùng kỳ', delta: `doanh thu ${esc(dmx[1])}`, sub: 'doanh nghiệp công bố · gồm EraBlue', date: sssgP})];
  if (chains.length) {
    const tot = chains.reduce((a, c) => a + (c.stores || 0), 0), ls = chains.filter(c => c.listed), lt = ls.reduce((a, c) => a + (c.stores || 0), 0), top = [...chains].sort((a, b) => b.stores - a.stores)[0];
    KT.network = [tile({label: 'Điểm bán Bizmap ghi nhận', value: nf(tot), unit: 'điểm', delta: `${chains.length} chuỗi, ${Object.keys(BZ.groups || {}).length} nhóm cạnh tranh`, sub: `bizmap.live · ${dmy(bzDate)}`, date: bzDate}),
      tile({label: 'Của chuỗi niêm yết', value: nf(lt), unit: 'điểm', delta: `${nf(lt / tot * 100, 0)}% tổng ghi nhận · ${ls.length} chuỗi`, sub: 'MWG, FRT, MSN, PNJ', date: bzDate}),
      tile({label: 'Chuỗi nhiều điểm bán nhất', value: esc(top.name), unit: '', delta: `${nf(top.stores)} điểm · ${top.province_count} tỉnh/thành`, sub: `${top.ticker ? top.ticker + ' · ' : ''}Bizmap ghi nhận`, date: bzDate})];
  }
  KT.jewelry = [tileSeries('gold_sjc', 'Vàng miếng SJC', {day: true, fmt: v => nf(v / 1000, 1), unit: 'triệu đ/lượng', sub: 'WiData · điểm cuối tháng'}),
    tileSeries('gold_ring', 'Vàng nhẫn', {day: true, fmt: v => nf(v / 1000, 1), unit: 'triệu đ/lượng', sub: 'WiData · điểm cuối tháng'}),
    tileFin('PNJ', 'gross_margin', 'Biên gộp PNJ', {d: 1, unit: '%', pp: true}),
    pnj && tile({label: 'Cửa hàng PNJ', value: esc(pnj[1]), unit: 'cửa hàng', delta: esc(pnj[3] || ''), sub: `${esc(pnj[2])} · doanh nghiệp công bố`, date: textDate(pnj[2])})];
  KT.fmcg = [tileSeries('iip_food', 'IIP chế biến thực phẩm', {level: true, fmt: pct, unit: 'so cùng kỳ', sub: 'Cục Thống kê'}),
    tileSeries('iip_bev', 'IIP sản xuất đồ uống', {level: true, fmt: pct, unit: 'so cùng kỳ', sub: 'Cục Thống kê'}),
    tileSeries('palm_oil', 'Dầu cọ', {d: 0, unit: 'USD/tấn', sub: 'IMF (FRED) · bình quân tháng'}),
    tileSeries('sugar', 'Đường thô ICE No.11', {day: true, d: 2, unit: 'US cent/lb', sub: 'hợp đồng gần · Yahoo Finance'})];
  Object.entries(KT).forEach(([k, t]) => { KT[k] = t.filter(Boolean); const d = latest(KT[k].map(x => x.dataset.asof)); if (d) ASOF[k] = showD(d); });
  // 01 Toàn ngành: tháng mới nhất của các chuỗi NSO/NHNN trên sub-tab; ô P/E theo phiên ghi riêng.
  const m = latest(['retail_total', 'cpi_yoy', 'tourists', 'credit_total', 'household_deposits'].map(k => series(k).at(-1)?.date.slice(0, 7)));
  const pe = (window.RETAIL_PUBLIC?.blocks?.sector_ratio?.by_sector?.['220']?.records || []).at(-1)?.[0];
  if (m) ASOF.all = showD(m) + (pe ? ` · P/E ${dmy(pe)}` : '');
  // 06 Chính sách: mốc đã hiệu lực gần nhất và mốc kế tiếp (window.RETAIL_POLICY do retail-dashboard.js công bố).
  const today = new Date().toISOString().slice(0, 10), pol = (window.RETAIL_POLICY || []).map(x => x.d).filter(Boolean).sort();
  const past = pol.filter(d => d <= today).at(-1), next = pol.find(d => d > today);
  if (past) ASOF.policy = `${dmy(past)}${next ? ` · mốc kế tiếp ${dmy(next)}` : ''}`;
}

/* ---------- Dựng ---------- */
const TABS = {}, used = new Set(), BUILDS = [];
function take(sel) {
  const n = /^bl-/.test(sel) ? block(sel) : $(sel);
  if (!n || used.has(n) || [...used].some(u => u.contains(n))) return null;
  used.add(n); n.hidden = false; n.classList.remove('rf-hidden-legacy'); n.style.marginTop = '';
  if (/^bl-5\d$/.test(sel)) unfold(n);
  if (/^bl-(70|71|72|73|74|76|01|02|05|08|09|13|15|21|42|44|50|52|60|61)$/.test(sel)) n.classList.add('rf-wide');
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
  const OV = key === 'mt1';  // Tổng quan ngành: thanh .ov-nav (số · tiêu đề · dòng phụ) như Dien/app/power-overview.js
  const nav = el('div', OV ? 'ov-nav' : 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', def.title); sec.append(nav);
  const subs = def.subs.map((s, i) => {
    const lab = key === 'mt1' ? String(i).padStart(2, '0') : String(i + 1).padStart(2, '0');
    const b = el('button', OV ? 'tabbtn ov-tab' : 'tabbtn pp-tab', `<span>${lab}</span>${esc(s.t)}${OV ? `<small>${esc(s.sub || '')}</small>` : ''}`); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = `rf-${key}-${s.k}-tab`; b.dataset.sub = s.k;
    const p = el('div', 'pp-pane rf-pane'); p.id = `rf-${key}-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    const asof = key === 'mt2' && ASOF[s.k] ? `<span class="pp-asof">Dữ liệu mới nhất: ${esc(ASOF[s.k])}</span>` : '';
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${lab}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div><div class="rf-hr">${asof}<a class="rf-permalink" href="?sub=${s.k}#${key}" title="Link trực tiếp tới mục này">Link mục ↗</a></div>`));
    { const g = el('section', 'grid kpis pp-kpis'); (s.kpis || []).forEach(sp => { const c = kpi(sp); if (c) g.append(c); }); if (key === 'mt2') (KT[s.k] || []).forEach(t => g.append(t));
      [...g.children].slice(4).forEach(n => n.remove()); if (g.children.length) p.append(g); }
    if (s.flow) {
      const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Luồng ' + s.t.toLowerCase());
      bar.innerHTML = s.flow.map(([id, k, t], j) => `${j ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#rf-st-${s.k}-${id}" class="pp-flow-s"><small>${k}</small><b>${esc(t)}</b></a>`).join('');
      p.append(bar);
    }
    let qn = 0;
    s.items.forEach(it => {
      if (it.grp) { p.append(el('h3', 'pp-grp', esc(it.grp))); return; }
      if (it.stage) { const f = s.flow.find(x => x[0] === it.stage); const h = el('div', 'pp-stage', `<span>${f[1]}</span><h3>${esc(f[2])}</h3>`); h.id = `rf-st-${s.k}-${f[0]}`; p.append(h); return; }
      // Khối tự dựng (Tài chính ngành › 01: app/retail-finance.js dựng ô số + câu hỏi 1.1–1.7 vào đây khi chỗ chứa hiện).
      if (it.host) { const h = el('div', it.host); h.id = it.id; p.append(h); return; }
      const panel = el('section', 'pp-panel pp-q'); panel.id = it.id;
      qn++; const pn = key === 'mt1' ? `${i}.${qn}` : `${i + 1}.${qn}`;
      panel.innerHTML = `<header class="pp-ph"><span class="pp-num">${pn}</span><div><h3>${esc(it.q)}</h3>${it.meta ? `<p class="rf-meta">${it.meta}</p>` : ''}</div></header>`;
      // 28/11/2026 (khung chuẩn Điện): thẻ đầu = chart trả lời chính (.pp-main) → thẻ thứ hai (.pp-sup1) → còn lại (.pp-more, lưới 2 cột).
      const nodes = (it.take || []).map(take).filter(Boolean);
      (it.fold || []).forEach(([sel, label]) => { const n = take(sel); if (!n) return; const d = el('details', 'rf-fold rf-wide'); d.append(el('summary', '', esc(label)), n); nodes.push(d); });
      if (it.build) BUILDS.push(it.build); // chạy sau khi pane đã gắn vào trang (thẻ đang tách khỏi document)
      if (!nodes.length) return; // không có thẻ nào (dữ liệu chưa đủ) → không hiện câu hỏi
      const main = el('div', 'pp-main'); main.append(nodes[0]); panel.append(main);
      if (nodes[1]) { const w = el('div', 'pp-sup1'); w.append(nodes[1]); panel.append(w); }
      const ex = nodes.slice(2);  // như qpanel của Dien/app/power-picture.js: ≥2 thẻ → lưới 2 cột, 1 thẻ → một khối
      if (ex.length) { const g = el('div', ex.length > 1 ? 'grid two g2 pp-sup pp-more rf-grid' : 'pp-sup1 pp-more'); ex.forEach(n => g.append(n)); panel.append(g); }
      if (it.after) panel.append(it.after());
      p.append(panel);
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
  sub = SUB_ALIAS[sub] || sub;
  // ?sub=valuation#mt14: sub-tab 03 Định giá do app/peer-valuation.js thêm sau khi trang tải; chưa có nút thì giữ URL để peer-valuation tự mở.
  if (key === 'mt14' && sub === 'valuation') { const vb = document.getElementById('of-mt14-valuation-tab'); if (vb) { vb.click(); return; } subs.forEach((x, j) => { x.p.hidden = j > 0; x.b.setAttribute('aria-selected', String(!j)); }); return; }
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
      const val = key === 'mt14' && document.getElementById('of-mt14-valuation');
      if (val && !val.hidden) { /* đang mở 03 Định giá: giữ nguyên */ }
      else if (TABS[key]) { const cur = TABS[key].find(x => !x.p.hidden) || TABS[key][0]; open(key, cur.s.k, 'push'); } else setUrl(key, null, 'push');
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
  buildKpis();
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
  const setTop = () => { const t = $('.majortabs'), cs = t && getComputedStyle(t), top = cs && cs.position === 'sticky' ? t.getBoundingClientRect().height + (parseFloat(cs.top) || 0) + 6 : 0; $$('.rf-section>.pp-nav,.rf-section>.ov-nav').forEach(n => { n.style.top = top + 'px'; }); };
  setTop(); addEventListener('resize', setTop);
  document.documentElement.dataset.rfReady = '1';
  window.dispatchEvent(new Event('rf:frame'));
}
if (window.SectorBoot) SectorBoot.add(1200, run);
else if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
})();
