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
  wide: ['cn-01', 'cn-05', 'cn-52', 'cn-60'],
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
      ['Chuỗi khép kín thức ăn – giống – thịt', 'DBC', 'Thức ăn chăn nuôi, con giống, heo thịt, thịt chế biến; có thêm mảng bất động sản', 'Giá heo hơi; giá ngô, khô đậu nhập (biên thức ăn và giá thành heo); dịch bệnh', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-margin', 'Biên chăn nuôi']]],
      ['Chăn nuôi heo quy mô lớn', 'BAF', 'Heo thịt từ trang trại công nghệ cao, thức ăn chăn nuôi tự sản xuất', 'Giá heo hơi; số đầu heo xuất bán; giá ngô, khô đậu', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-gm', 'Biên gộp']]],
      ['Chăn nuôi heo và cây ăn trái', 'HAG', 'Heo thịt, chuối, sầu riêng và cây ăn trái khác', 'Giá heo hơi; giá và sản lượng trái cây xuất khẩu; chi phí lãi vay', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-rev', 'Doanh thu, lợi nhuận']]]],
      src: [['BCTC và báo cáo thường niên doanh nghiệp', '#rf-q-compare']]},
    {id: 'chHog', type: 'hog', table: 'tbl-hog', src: ['wi'],
      regions: [['hog_r1', 'Vùng · Wi 74368', C.navy], ['hog_r2', 'Vùng · Wi 74369', C.gold], ['hog_r3', 'Vùng · Wi 74370', C.teal]],
      method: 'Heo hơi toàn quốc (Wi 74124) và ba chuỗi vùng (Wi 74368, 74369, 74370). Wi nén giá ngày về cuối tháng; điểm cuối là ngày gọi gần nhất. Response Wi chưa ghi tên vùng nên nhãn ghi theo id.'},
    {id: 'chFeed', type: 'series', base: 'feed', series: [['Thức ăn gia súc', 'feed', C.teal, 'bar']], unit: 'nghìn tấn', tableUnit: 'nghìn tấn', digits: 0, table: 'tbl-feed', src: ['nso'],
      method: 'Sản lượng sản xuất công nghiệp thức ăn cho gia súc toàn ngành (NSO), không phải sản lượng của doanh nghiệp.'},
    {id: 'chFeedImp', type: 'series', base: 'imp_corn', months: 24, series: [['Ngô', 'imp_corn', C.gold, 'bar'], ['Đậu tương', 'imp_soy', C.green, 'bar'], ['Thức ăn gia súc & nguyên liệu', 'imp_feed', C.navy, 'bar']], unit: 'triệu USD', tableUnit: 'triệu USD', digits: 0, table: 'tbl-feedimp', src: ['customs'],
      method: 'Kim ngạch nhập khẩu theo tháng, Cục Hải quan.'},
    {id: 'chFeedPx', type: 'index', series: [['Ngô', 'corn', C.gold], ['Khô đậu tương', 'soymeal', C.green], ['Heo hơi toàn quốc', 'hog', C.red]], table: 'tbl-feedpx', src: ['fred', 'wi'],
      method: 'Chỉ số, T1/2024 = 100. Ngô (PMAIZMTUSDM), khô đậu tương (PSMEAUSDM): IMF bình quân tháng qua FRED; heo hơi: WiData. Giá gốc ở Chi tiết dữ liệu (ngô theo US cent/bushel).'},
    {id: 'chHogMargin', type: 'hogmargin', table: 'tbl-hog-margin', src: [['WiData (heo hơi)', 'https://widata.vn/'], 'fred', ['NHNN tỷ giá trung tâm', 'https://sbv.gov.vn/vi/t%E1%BB%B7-gi%C3%A1-trung-t%C3%A2m']],
      param: {fcr: 2.7, k: 1.75, corn: 0.55, soy: 0.25, other: 17, band: [48, 52]},
      method: 'Ước tính, không phải số doanh nghiệp. Giá thành = 2,7 kg thức ăn/kg heo hơi × giá thức ăn ước + 17 nghìn đ/kg chi phí khác (giống, thú y, khấu hao chuồng, lao động, lãi vay). Giá thức ăn ước = 1,75 × (0,55 × ngô + 0,25 × khô đậu) quy VND/kg theo tỷ giá trung tâm bình quân tháng. Vùng hòa vốn 48–52 nghìn đ/kg là vùng tham chiếu. Ngô, khô đậu IMF trễ 1–2 tháng nên tháng mới nhất của heo có thể chưa có giá thành. Doanh nghiệp tự sản xuất thức ăn (DBC, BAF) có giá thành thấp hơn mức ước.'},
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
  topics: {'cn-t1': ['Biên gộp mảng heo của DBC, BAF, HAG', 'Giá heo hơi so với vùng hòa vốn 48–52 nghìn đ/kg; giá ngô, khô đậu', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-margin', 'Biên chăn nuôi ước']]]},
  alias: {mt3: ['mt2', 'cost']},
  section: {input: ['mt2', 'cost'], price: ['mt2', 'price'], feed: ['mt2', 'cost']},
  tree: {
    mt1: {title: 'Tổng quan ngành', subs: [
      {k: 'map', t: 'Bản đồ ngành', d: 'Nguyên liệu nhập → thức ăn → nuôi heo → giết mổ, chế biến → người tiêu dùng.', items: [
        {q: 'Heo đi qua những khâu nào trước khi thành lợi nhuận?', id: 'rf-q-map', take: ['cn-01']}]},
      {k: 'model', t: 'Mô hình kiếm tiền', d: 'Doanh thu đến từ đâu, biến nào quyết định biên, mã nào đại diện.', items: [
        {q: 'Mỗi doanh nghiệp kiếm tiền từ đâu, biến nào quyết định biên?', id: 'rf-q-model', take: ['cn-05']}]},
    ]},
    mt2: {title: 'Bức tranh ngành', subs: [
      {k: 'price', t: 'Giá heo hơi', d: 'Giá đầu ra: heo hơi toàn quốc và theo vùng.', kpis: ['spk-hog'], items: [
        {q: 'Giá heo hơi đang ở đâu?', id: 'rf-q-hog', meta: 'nghìn đ/kg · toàn quốc và 3 vùng (WiData)', take: ['cn-10']}]},
      {k: 'cost', t: 'Thức ăn & nguyên liệu', d: 'Giá ngô, khô đậu, nhập khẩu nguyên liệu và sản lượng thức ăn.', kpis: ['spk-soy', 'spk-feed'], items: [
        {q: 'Giá ngô, khô đậu đi cùng hay ngược giá heo?', id: 'rf-q-input', meta: 'chỉ số T1/2024 = 100 · giá gốc ở Chi tiết dữ liệu', take: ['cn-20']},
        {q: 'Nhập khẩu nguyên liệu thức ăn bao nhiêu?', id: 'rf-q-import', meta: 'triệu USD · theo tháng (Hải quan)', take: ['cn-12']},
        {q: 'Sản lượng thức ăn chăn nuôi đang tăng hay giảm?', id: 'rf-q-feed', meta: '<b>sản lượng sản xuất</b> toàn ngành (NSO)', take: ['cn-11']}]},
      {k: 'margin', t: 'Biên chăn nuôi', d: 'Giá heo trừ giá thành ước; biên gộp doanh nghiệp theo quý.',
        flow: [['est', 'Ước tính', 'Heo hơi − giá thành ước'], ['gm', 'Doanh nghiệp', 'Biên gộp DBC, BAF, HAG']], items: [
        {stage: 'est'},
        {q: 'Nuôi heo đang lời hay lỗ trên mỗi kg?', id: 'rf-q-margin', meta: '<b>ước tính</b> · tham số ở dòng phương pháp', take: ['cn-21']},
        {stage: 'gm'},
        {q: 'Biên gộp doanh nghiệp đang mở rộng hay thu hẹp?', id: 'rf-q-gm', meta: '% · BCTC hợp nhất quý từng mã', take: ['cn-22']}]},
      {k: 'policy', t: 'Chính sách & dịch bệnh', d: 'Mốc nào có thể đổi giá thành hoặc nguồn cung?', items: [
        {q: 'Mốc nào có thể đổi giá thành hoặc nguồn cung?', id: 'rf-q-policy', meta: '● đã ban hành / sự kiện · ngày hiệu lực', take: ['cn-52']}]},
    ]},
    mt14: {title: 'Tài chính ngành', subs: [
      {k: 'sector', t: 'Tài chính ngành', d: 'Định giá rổ chăn nuôi, doanh thu và lợi nhuận theo quý từng mã.', kpis: ['spk-pe'], items: [
        {q: 'Thị trường định giá cổ phiếu chăn nuôi ở mức nào?', id: 'rf-q-pe', meta: 'lần · rổ VNDirect', take: ['cn-03']},
        {q: 'Doanh thu và lợi nhuận đi thế nào?', id: 'rf-q-rev', meta: 'nghìn tỷ đồng · hợp nhất quý từng mã, không cộng', take: ['cn-06']}]},
      {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'Bảng so sánh, bộ lọc mã và kỳ báo cáo; kế hoạch và kết quả 2026.', items: [
        {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'rf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ', take: ['.financial-comparison']},
        {q: 'Doanh nghiệp đã đi được bao nhiêu so với kế hoạch 2026?', id: 'rf-q-plan', take: ['cn-60']}]},
    ]},
  },
};
})();
