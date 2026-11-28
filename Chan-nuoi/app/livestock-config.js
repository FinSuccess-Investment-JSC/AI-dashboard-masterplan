/* Chăn nuôi · cấu hình dashboard (tách khỏi Nông nghiệp & thực phẩm 26/11/2026). Dữ liệu tháng đọc window.AGRI_PUBLIC
   (scripts/build_sector_public.py: heo hơi WiData, ngô và khô đậu IMF/FRED, thức ăn NSO, nhập khẩu Hải quan, tỷ giá NHNN, P/E rổ VNDirect).
   Số tài liệu có dòng trong data/agri/evidence.json (đã dùng ở trang Nông nghiệp trước khi tách). */
(() => {
const C = {navy: '#2938A8', teal: '#59C5C8', plum: '#861C52', gold: '#c29100', grey: '#6b7686', red: '#d1583f', green: '#27af95'};
const CAFEF_DBC = ['CafeF – Dabaco quý II/2026', 'https://cafef.vn/gia-lon-hoi-giam-keo-lai-rong-quy-ii-2026-cua-dabaco-di-lui-43-188260731094501651.chn'];
const TCCT_BAF = ['Tạp chí Công Thương – BAF 6T/2026', 'https://tapchicongthuong.vn/baf-tang-61--san-luong-heo-6-thang-dau-nam-2026--day-manh-dau-tu-cho-chu-ky-tang-truong-moi-538213.htm'];
const KH_BAF = ['Thị trường Tài chính Tiền tệ – KH 2026 BAF', 'https://thitruongtaichinhtiente.vn/baf-dat-muc-tieu-lai-793-ty-dong-nam-2026-tang-toc-chan-nuoi-cong-nghe-cao-82530.html'];
const MA_HAG = ['MekongAsean – HAG 6T/2026', 'https://mekongasean.vn/hagl-bam-sat-ke-hoach-loi-nhuan-ky-luc-nho-duoc-mien-lai-trai-phieu-57803.html'];
window.PKG = {
  key: 'livestock', prefix: 'cn', label: 'Chăn nuôi', dataVar: 'AGRI_PUBLIC',
  ticker: {commodity: ['hog', 'corn', 'soymeal'], ratio: ['240', '235']},
  // 28/11/2026 (người dùng yêu cầu): khung 4 tab theo trang Điện — Tổng quan ngành · Bức tranh ngành · Tài chính ngành · Chủ đề nóng.
  // Bức tranh ngành chia sub-tab theo khâu sản phẩm (01 Thức ăn chăn nuôi · 02 Chăn nuôi heo), mỗi sub-tab có luồng Đầu vào → Sản xuất → Đầu ra;
  // nội dung không thuộc luồng (bản đồ, mô hình kinh doanh, mốc chính sách) về Tổng quan. Bỏ tab Chi phí & biên (#mt11) và Doanh nghiệp (#mt14 đổi tên).
  routes: [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']],
  wide: ['cn-01', 'cn-05', 'cn-h1', 'cn-h6', 'cn-h7', 'cn-30', 'cn-21h', 'cn-22h', 'cn-52', 'cn-60', 'cn-s1', 'cn-s2', 'cn-d1', 'cn-40', 'cn-10'],
  kpis: [
    {spark: 'spk-hog', series: 'hog', unit: 'nghìn đ/kg', digits: 1, ytd: false, color: C.red},
    {spark: 'spk-feed', series: 'feed', unit: 'nghìn tấn', digits: 0},
    {spark: 'spk-soy', series: 'soymeal', unit: 'USD/tấn', digits: 0, ytd: false, color: C.green},
    {spark: 'spk-pe', pe: '240', label: 'Chăn nuôi'},
  ],
  charts: [
    {id: 'chLiveChain', type: 'html', src: [['FinSuccess tổng hợp', '#rf-q-model']],
      method: 'Sơ đồ các khâu và vị trí doanh nghiệp niêm yết; không có số liệu định lượng.',
      render: esc => {
        const box = t => `<span class="dc-box">${esc(t)}</span>`;
        const col = (n, t, boxes, who, note) => `<section class="dc-col"><h4><span>${n}</span>${esc(t)}</h4><div class="dc-row">${boxes.map(box).join('')}</div>${note ? `<p class="dc-note">${esc(note)}</p>` : ''}<p class="dc-lbl">Doanh nghiệp niêm yết</p><p class="dc-brands">${who}</p></section>`;
        return `<div class="dc dc-live">
  <p class="dc-lead">Thức ăn chiếm phần lớn giá thành; nguyên liệu thức ăn chủ yếu nhập khẩu, giá heo hơi do cung – cầu trong nước quyết định</p>
  <div class="dc-band dc-band4"><span class="dc-b dc-b1">Đầu vào</span><span class="dc-b dc-b2">Thức ăn</span><span class="dc-b dc-b2">Chăn nuôi</span><span class="dc-b dc-b3">Đầu ra</span></div>
  <div class="dc-cols dc-cols4">
    ${col(1, 'Nguyên liệu, con giống', ['Ngô', 'Đậu tương, khô đậu', 'Con giống', 'Thuốc thú y'], '<b>DBC</b> (tự sản xuất con giống)', 'Ngô, đậu tương chủ yếu nhập từ Mỹ, Brazil, Argentina')}
    ${col(2, 'Thức ăn chăn nuôi', ['Phối trộn', 'Ép viên', 'Thức ăn hỗn hợp, đậm đặc'], '<b>DBC</b> · <b>BAF</b> (tự cung cho trang trại)')}
    ${col(3, 'Nuôi heo thịt', ['Trang trại doanh nghiệp', 'Gia trại, hộ nhỏ'], '<b>DBC</b> · <b>BAF</b> · <b>HAG</b>')}
    ${col(4, 'Giết mổ, chế biến, bán ra', ['Heo hơi cho thương lái', 'Thịt mát, thịt chế biến', 'Chợ, siêu thị, cửa hàng thịt'], '<b>DBC</b> (thịt chế biến) · MSN (MEATLife)')}
  </div>
</div>`;
      }},
    {id: 'chLiveModels', type: 'models', items: [
      ['Chuỗi khép kín thức ăn – giống – thịt', 'DBC', 'Thức ăn chăn nuôi, con giống, heo thịt, thịt chế biến; có thêm mảng bất động sản', 'Giá heo hơi; giá ngô, khô đậu nhập (biên thức ăn và giá thành heo); dịch bệnh', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-sim', 'Lãi một con heo']]],
      ['Chăn nuôi heo quy mô lớn', 'BAF', 'Heo thịt từ trang trại công nghệ cao, thức ăn chăn nuôi tự sản xuất', 'Giá heo hơi; số đầu heo xuất bán; giá ngô, khô đậu', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-co-gm', 'Biên gộp']]],
      ['Chăn nuôi heo và cây ăn trái', 'HAG', 'Heo thịt, chuối, sầu riêng và cây ăn trái khác', 'Giá heo hơi; giá và sản lượng trái cây xuất khẩu; chi phí lãi vay', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-rev', 'Doanh thu, lợi nhuận']]]],
      src: [['BCTC và báo cáo thường niên doanh nghiệp', '#rf-q-compare']]},
    {id: 'chHog', type: 'hog', table: 'tbl-hog', src: ['wi'], months: 120, regions: [],
      method: 'Heo hơi toàn quốc (WiData 74124), bình quân tháng; điểm cuối là ngày gọi gần nhất. Khác nguồn với giá ba miền theo ngày (Báo Hà Tĩnh) — dùng để xem nhiều năm.'},
    {id: 'chFeed', type: 'series', base: 'feed', series: [['Thức ăn gia súc', 'feed', C.teal, 'bar']], unit: 'nghìn tấn', tableUnit: 'nghìn tấn', digits: 0, table: 'tbl-feed', src: ['nso'],
      method: 'Sản lượng sản xuất công nghiệp thức ăn cho gia súc toàn ngành (NSO), không phải sản lượng của doanh nghiệp.'},
    {id: 'chFeedImp', type: 'series', base: 'imp_corn', months: 24, series: [['Ngô', 'imp_corn', C.gold, 'bar'], ['Đậu tương', 'imp_soy', C.green, 'bar'], ['Thức ăn gia súc & nguyên liệu', 'imp_feed', C.navy, 'bar']], unit: 'triệu USD', tableUnit: 'triệu USD', digits: 0, table: 'tbl-feedimp', src: ['customs'],
      method: 'Kim ngạch nhập khẩu theo tháng, Cục Hải quan.'},
    {id: 'chLiveGM', type: 'margin', syms: [['DBC', C.navy], ['BAF', C.red], ['HAG', C.teal]], table: 'tbl-live-gm', src: ['cq'],
      method: 'Biên = lãi gộp (lãi ròng) ÷ doanh thu thuần, BCTC hợp nhất quý từng mã.'},
    {id: 'liveTimeline', type: 'timeline', items: [
      {d: '2025-03-31', name: 'NĐ 73/2025: thuế nhập khẩu MFN ngô, khô đậu về 0%', st: 'Đã ban hành', what: 'Ngô hạt 2% → 0%; khô dầu đậu tương 1–2% → 0%', who: 'DBC · BAF · HAG', v: 'Giá thức ăn chăn nuôi, giá thành heo', url: 'https://tapchicongthuong.vn/giam-thue-nhap-khau-mot-so-mat-hang-tu-31-3-2025-138889.htm'},
      {d: '2026-02-28', label: '2T/2026', name: 'Dịch tả heo châu Phi (ASF)', st: 'Sự kiện', what: '225 ổ dịch tại 23 tỉnh, khoảng 12.700 con phải tiêu hủy trong 2 tháng đầu năm', who: 'DBC · BAF · HAG', v: 'Đàn heo, nguồn cung, chi phí phòng dịch', url: 'https://www.sggp.org.vn/2-thang-dau-nam-2026-ca-nuoc-co-gan-12700-con-heo-chet-buoc-tieu-huy-vi-dich-post840883.html'}],
      method: 'Mốc là ngày hiệu lực của văn bản; với dịch bệnh là kỳ số liệu được công bố.'},
    {id: 'chLivePE', type: 'val', ids: [['240', 'Chăn nuôi, chế biến thịt (DBC, HAG, BAF)', C.navy], ['235', 'Thức ăn chăn nuôi (DBC)', C.gold]], table: 'tbl-live-pe', src: ['vnd'],
      method: 'Rổ ngành của VNDirect. P/E = vốn hóa ÷ lợi nhuận 4 quý. Vẽ mỗi 5 phiên.'},
    {id: 'chLiveRev', type: 'revenue', syms: [['DBC', C.navy], ['BAF', C.red], ['HAG', C.teal]], table: 'tbl-live-rev', src: ['cq'],
      method: 'BCTC hợp nhất quý từng mã, không cộng.'},
    {id: 'chLivePlan', type: 'tiles', items: [
      ['Kế hoạch 2026 · DBC', '1.117 tỷ LNST', 'giảm 25% so với 2025'],
      ['Kết quả 6T/2026 · DBC', '8.377 / 663 tỷ', 'doanh thu +13% / LNST −35%'],
      ['Kế hoạch 2026 · BAF', '8.431 / 793 tỷ', 'doanh thu / LNST'],
      ['Kết quả 6T/2026 · BAF', '3.899 tỷ doanh thu', '+55%; xuất bán heo +61%, đàn khoảng 900 nghìn con'],
      ['Kết quả 6T/2026 · HAG', '3.707 / 2.299 tỷ', 'doanh thu / LNST; có khoản miễn hơn 1.500 tỷ lãi trái phiếu']],
      src: [CAFEF_DBC, KH_BAF, TCCT_BAF, MA_HAG], method: 'Số doanh nghiệp công bố, kỳ ghi ở từng ô. Kết quả 9T/2026 xem bảng so sánh tài chính bên trên.'},
  ],
  sourceManual: [[/^Chuỗi giá trị ngành chăn nuôi/, 'FinSuccess tổng hợp']],
  topics: {'cn-t1': ['Giá bán thực nhận và biên gộp mảng heo của BAF, DBC', 'Giá heo BQ 7 ngày ba miền, độ rộng theo tỉnh, xuất chuồng quý IV', [['#rf-q-hog', 'Giá heo ba miền'], ['#rf-q-breadth', 'Độ rộng theo tỉnh'], ['#rf-q-sim', 'Mô phỏng một con heo']]]},
  // Link cũ: tab lớn (#mtN) và ?section= của bố cục 5 tab; khóa sub-tab cũ ở subAlias ('tab/sub' → [tab, sub]).
  alias: {mt3: ['mt2', 'heo', 'rf-q-sim'], mt4: ['mt1', 'policy'], mt6: ['mt14', 'sector'], mt9: ['mt14', 'sector'], mt11: ['mt2', 'feed']},
  section: {price: ['mt2', 'heo', 'rf-q-hog'], breadth: ['mt2', 'heo', 'rf-q-breadth'], supply: ['mt2', 'heo', 'rf-st-heo-prod'], import: ['mt2', 'heo', 'rf-q-import'], asf: ['mt2', 'heo', 'rf-q-asf'], policy: ['mt1', 'policy'], input: ['mt2', 'feed'], feed: ['mt2', 'feed'], sim: ['mt2', 'heo', 'rf-q-sim'], companies: ['mt14', 'dn'], listed: ['mt14', 'sector']},
  subAlias: {'mt1/gia': ['mt2', 'heo'], 'mt1/rong': ['mt2', 'heo'], 'mt2/dan': ['mt2', 'heo'], 'mt2/nk': ['mt2', 'heo'], 'mt2/asf': ['mt2', 'heo'], 'mt11/nl': ['mt2', 'feed'], 'mt11/sim': ['mt2', 'heo']},
  // cn-h3 (chHerdS) và cn-h4 (chPigOutS) là bản rút gọn của cn-21h, cn-22h (cùng hàm herd()/output(), cùng số NSO) → không dời, nằm ẩn trong .rf-rest.
  tree: {
    mt1: {title: 'Tổng quan ngành', subs: [
      {k: 'map', t: 'Bản đồ ngành', d: 'Nguyên liệu nhập → thức ăn → nuôi heo → giết mổ, chế biến; doanh nghiệp kiếm tiền ở khâu nào.', items: [
        {q: 'Heo đi qua những khâu nào trước khi thành lợi nhuận?', id: 'rf-q-map', take: ['cn-01']},
        {q: 'Mỗi doanh nghiệp kiếm tiền từ đâu, biến nào quyết định biên?', id: 'rf-q-model', take: ['cn-05']}]},
      {k: 'policy', t: 'Mốc chính sách & dịch bệnh', d: 'Văn bản và sự kiện có thể đổi giá thành hoặc nguồn cung của cả chuỗi.', items: [
        {q: 'Mốc nào có thể đổi giá thành hoặc nguồn cung?', id: 'rf-q-policy', meta: '● đã ban hành / sự kiện · ngày hiệu lực', take: ['cn-52']}]},
    ]},
    mt2: {title: 'Bức tranh ngành', subs: [
      {k: 'feed', t: 'Thức ăn chăn nuôi', d: 'Ngô, khô đậu nhập khẩu → nhà máy thức ăn → cám cho đàn heo, gia cầm.', kpis: ['spk-soy', 'spk-feed'],
        flow: [['in', 'Đầu vào', 'Ngô, khô đậu tương nhập khẩu'], ['prod', 'Sản xuất', 'Sản lượng thức ăn gia súc'], ['out', 'Đầu ra', 'Cám cho đàn heo, gia cầm']], items: [
        {stage: 'in'},
        {q: 'Ngô và khô đậu tương đang đi cùng chiều?', id: 'rf-q-input', meta: 'USD/tấn · World Bank Pink Sheet · 3 năm và 10 năm', take: ['cn-h2', 'cn-h2b']},
        {q: 'Nhập khẩu nguyên liệu thức ăn bao nhiêu?', id: 'rf-q-feedimp', meta: 'triệu USD · theo tháng (Hải quan)', take: ['cn-12']},
        {stage: 'prod'},
        {q: 'Sản lượng thức ăn chăn nuôi đang tăng hay giảm?', id: 'rf-q-feed', meta: '<b>sản lượng sản xuất</b> toàn ngành (NSO)', take: ['cn-11']},
        {stage: 'out'},
        {link: ['#rf-q-herd', 'Chăn nuôi heo › 2.2', 'Cầu thức ăn đi theo tổng đàn heo', 'Tổng đàn cuối kỳ so cùng kỳ (NSO)']},
        {link: ['#rf-q-sim', 'Chăn nuôi heo › 2.10', 'Giá cám trong giá thành một con heo', 'Mô phỏng doanh thu, chi phí, lãi theo giá heo và giá cám']}]},
      {k: 'heo', t: 'Chăn nuôi heo', d: 'Thức ăn, con giống, dịch bệnh → tổng đàn, xuất chuồng → giá heo hơi, cạnh tranh của thịt nhập khẩu, lãi một con heo.', kpis: ['spk-hog'],
        flow: [['in', 'Đầu vào', 'Giá thức ăn, dịch bệnh'], ['prod', 'Sản xuất', 'Tổng đàn và heo xuất chuồng'], ['out', 'Đầu ra', 'Giá heo hơi, thịt cạnh tranh, lãi một con heo']], items: [
        {stage: 'in'},
        {link: ['#rf-q-input', 'Thức ăn chăn nuôi › 1.1', 'Giá ngô, khô đậu tương', 'Thức ăn chiếm phần lớn giá thành heo']},
        {q: 'Dịch tả heo châu Phi đang ở mức nào?', id: 'rf-q-asf', meta: 'sự kiện có kỳ và nguồn · lũy kế ghi riêng', take: ['cn-40']},
        {stage: 'prod'},
        {q: 'Tổng đàn heo cuối kỳ tăng bao nhiêu so với cùng kỳ?', id: 'rf-q-herd', meta: 'số tồn cuối tháng · % so cùng kỳ, NSO ước tính', take: ['cn-21h']},
        {q: 'Sản lượng heo hơi xuất chuồng tăng hay giảm?', id: 'rf-q-out', meta: 'dòng chảy trong kỳ · NSO', take: ['cn-22h']},
        {stage: 'out'},
        {q: 'Giá heo hơi ba miền đang ở đâu?', id: 'rf-q-hog', meta: 'đ/kg tại chuồng · bình quân 7 ngày, bật giá ngày ở nút trên chart', take: ['cn-h1']},
        {q: 'Giá hồi ở diện rộng hay chỉ một số tỉnh?', id: 'rf-q-breadth', meta: 'tỉnh × tuần · % tỉnh tăng/giảm so với 7 ngày trước, mẫu số ở bảng', take: ['cn-h6', 'cn-h7']},
        {q: 'Các nguồn báo giá cùng ngày có khớp nhau?', id: 'rf-q-ref', meta: 'khác phạm vi tỉnh và cách lấy giá — đối chiếu, không ghép', take: ['cn-h8']},
        {q: 'Giá hiện tại đứng đâu trong nhiều năm?', id: 'rf-q-long', meta: 'nghìn đ/kg · bình quân tháng, nguồn khác chuỗi ngày', take: ['cn-10']},
        {q: 'Thịt heo nhập khẩu cạnh tranh bao nhiêu, giá bao nhiêu, từ đâu?', id: 'rf-q-import', meta: 'HS 0203 · tấn và USD/tấn; phụ phẩm, tổng thịt là chuỗi riêng', take: ['cn-30', 'cn-31', 'cn-32']},
        {q: 'Cung protein thay thế (gia cầm) đi thế nào?', id: 'rf-q-poultry', meta: 'NSO · chỉ báo cung, không đo sức mua', take: ['cn-24']},
        {q: 'Một con heo lãi bao nhiêu, giá heo và giá cám đổi thì lãi đổi thế nào?', id: 'rf-q-sim', meta: '<b>mô phỏng</b> · preset lịch sử VCBS hoặc số tự nhập · các yếu tố khác giữ cố định', take: ['cn-s1', 'cn-s2']}]},
    ]},
    mt14: {title: 'Tài chính ngành', subs: [
      {k: 'sector', t: 'Tổng quan ngành', d: 'Định giá rổ chăn nuôi, doanh thu và biên theo quý của các mã niêm yết.', kpis: ['spk-pe'], items: [
        {q: 'Thị trường định giá cổ phiếu chăn nuôi ở mức nào?', id: 'rf-q-pe', meta: 'lần · rổ VNDirect', take: ['cn-03']},
        {q: 'Doanh thu, biên theo quý?', id: 'rf-q-rev', meta: 'nghìn tỷ đồng · %, hợp nhất quý từng mã, không cộng', take: ['cn-06', 'cn-22']}]},
      {k: 'dn', t: 'So sánh doanh nghiệp', d: 'Thay đổi giá heo, chi phí đi vào doanh thu, biên của từng doanh nghiệp; bảng so sánh và kế hoạch 2026.', items: [
        {q: 'Doanh thu, lợi nhuận và chỉ tiêu vận hành từng doanh nghiệp?', id: 'rf-q-co', meta: 'chọn mã ở nút trên chart · BCTC hợp nhất quý + chỉ tiêu doanh nghiệp công bố', take: ['cn-d1']},
        {q: 'Biên gộp có đi theo giá heo?', id: 'rf-q-co-gm', meta: '% biên gộp · giá heo tham chiếu bình quân quý, không phải ASP', take: ['cn-d2']},
        {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'rf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ', take: ['.financial-comparison']},
        {q: 'Doanh nghiệp đã đi được bao nhiêu so với kế hoạch 2026?', id: 'rf-q-plan', take: ['cn-60']}]},
    ]},
  },
};
})();
