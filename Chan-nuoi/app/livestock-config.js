/* Chăn nuôi · cấu hình dashboard (tách khỏi Nông nghiệp & thực phẩm 26/11/2026). Dữ liệu tháng đọc window.AGRI_PUBLIC
   (scripts/build_sector_public.py: heo hơi WiData, ngô và khô đậu IMF/FRED, thức ăn NSO, nhập khẩu Hải quan, tỷ giá NHNN, P/E rổ VNDirect).
   Số tài liệu có dòng trong data/agri/evidence.json (đã dùng ở trang Nông nghiệp trước khi tách). */
(() => {
const C = {navy: '#2938A8', teal: '#59C5C8', plum: '#861C52', gold: '#c29100', grey: '#6b7686', red: '#d1583f', green: '#27af95'};
const CAFEF_DBC = ['CafeF – Dabaco quý II/2026', 'https://cafef.vn/gia-lon-hoi-giam-keo-lai-rong-quy-ii-2026-cua-dabaco-di-lui-43-188260731094501651.chn'];
const TCCT_BAF = ['Tạp chí Công Thương – BAF 6T/2026', 'https://tapchicongthuong.vn/baf-tang-61--san-luong-heo-6-thang-dau-nam-2026--day-manh-dau-tu-cho-chu-ky-tang-truong-moi-538213.htm'];
const KH_BAF = ['Thị trường Tài chính Tiền tệ – KH 2026 BAF', 'https://thitruongtaichinhtiente.vn/baf-dat-muc-tieu-lai-793-ty-dong-nam-2026-tang-toc-chan-nuoi-cong-nghe-cao-82530.html'];
const MA_HAG = ['MekongAsean – HAG 6T/2026', 'https://mekongasean.vn/hagl-bam-sat-ke-hoach-loi-nhuan-ky-luc-nho-duoc-mien-lai-trai-phieu-57803.html'];
// 28/11/2026 (khung chuẩn Điện): đọc dữ liệu trên trang cho ô số mới và "Dữ liệu mới nhất" của từng sub-tab (gọi lúc dựng khung, sau khi data/*.js đã nạp).
const LD = () => window.LIVESTOCK_DATA || {}, LO = ind => (LD().evidence?.observations || []).filter(o => o.indicator === ind);
const AP = k => { const b = window.AGRI_PUBLIC?.blocks || {}; return b.macro?.series?.[k]?.records || b.commodity?.series?.[k]?.records || []; };
const latest = a => a.filter(Boolean).sort().at(-1) || null;  // 'yyyy-mm' và 'yyyy-mm-dd' so được theo chuỗi
const lastM = rs => rs.at(-1)?.date?.slice(0, 7), lastP = pts => (pts || []).at(-1)?.[0];
const pLab = p => /^\d{4}-\d{2}$/.test(p) ? 'T' + Number(p.slice(5)) + '/' + p.slice(0, 4) : /^\d{4}-\d+M$/.test(p) ? p.slice(5).replace('M', 'T') + '/' + p.slice(0, 4) : /^\d{4}-Q\d$/.test(p) ? p.slice(5) + '/' + p.slice(0, 4) : p;
const nf1 = (v, d) => v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}), sgn = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + nf1(Math.abs(v), d);
const TIMELINE = [
  {d: '2025-03-31', name: 'NĐ 73/2025: thuế nhập khẩu MFN ngô, khô đậu về 0%', st: 'Đã ban hành', what: 'Ngô hạt 2% → 0%; khô dầu đậu tương 1–2% → 0%', who: 'DBC · BAF · HAG', v: 'Giá thức ăn chăn nuôi, giá thành heo', url: 'https://tapchicongthuong.vn/giam-thue-nhap-khau-mot-so-mat-hang-tu-31-3-2025-138889.htm'},
  {d: '2026-02-28', label: '2T/2026', name: 'Dịch tả heo châu Phi (ASF)', st: 'Sự kiện', what: '225 ổ dịch tại 23 tỉnh, khoảng 12.700 con phải tiêu hủy trong 2 tháng đầu năm', who: 'DBC · BAF · HAG', v: 'Đàn heo, nguồn cung, chi phí phòng dịch', url: 'https://www.sggp.org.vn/2-thang-dau-nam-2026-ca-nuoc-co-gan-12700-con-heo-chet-buoc-tieu-huy-vi-dich-post840883.html'}];
const ASOF = {
  // Thức ăn: giá ngô, khô đậu (World Bank tháng), nhập khẩu nguyên liệu (Hải quan tháng), sản lượng thức ăn (NSO tháng).
  feed: () => latest([lastP(LD().pinksheet?.series?.maize?.points), lastP(LD().pinksheet?.series?.soymeal?.points), ...['feed', 'imp_corn', 'imp_soy', 'imp_feed'].map(k => lastM(AP(k)))]),
  // Chăn nuôi heo: giá heo theo ngày (Báo Hà Tĩnh), heo hơi WiData, tổng đàn, xuất chuồng, thịt nhập khẩu (tháng/quý).
  heo: () => latest([...Object.values(LD().hog?.series || {}).map(x => lastP(x.points)), AP('hog').at(-1)?.date, ...['herd_pig_yoy', 'imp_hs0203_t'].map(i => latest(LO(i).map(o => o.period).filter(p => /^\d{4}-\d\d$/.test(p))))]),
  // Chính sách: mốc mới nhất trên dòng thời gian (nhãn kỳ nếu mốc là kỳ số liệu).
  policy: () => { const t = TIMELINE.slice().sort((a, b) => a.d < b.d ? -1 : 1).at(-1); return t ? (t.label || t.d) : null; },
};
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
    // 28/11/2026: hai ô số sub-tab Chăn nuôi heo, cùng số NSO với chart cn-21h, cn-22h (LIVESTOCK_DATA.evidence).
    {spark: 'spk-herd', calc: () => { const rs = LO('herd_pig_yoy').sort((a, b) => a.period < b.period ? -1 : 1), l = rs.at(-1); if (!l) return null;
      const p = rs.find(o => o.period === (Number(l.period.slice(0, 4)) - 1) + l.period.slice(4));
      return {value: sgn(l.value) + '%', sub: pLab(l.period) + ' · NSO ước tính, số tồn cuối tháng', delta: p ? 'cùng tháng năm trước ' + sgn(p.value) + '%' : '', spark: rs.slice(-12).map(o => o.value), color: C.navy}; }},
    {spark: 'spk-pigout', calc: () => { const cum = LO('pig_output').filter(o => /M$/.test(o.period)).sort((a, b) => a.period.slice(0, 4) !== b.period.slice(0, 4) ? (a.period < b.period ? -1 : 1) : parseInt(a.period.slice(5)) - parseInt(b.period.slice(5))), l = cum.at(-1); if (!l) return null;
      const q = LO('pig_output').filter(o => /Q\d$/.test(o.period)).sort((a, b) => a.period < b.period ? -1 : 1);
      return {value: nf1(l.value, 0), unit: l.unit, sub: pLab(l.period) + ' · NSO ' + (l.status || ''), delta: Number.isFinite(l.yoy_pct) ? sgn(l.yoy_pct) + '% so cùng kỳ (NSO)' : '', spark: q.slice(-8).map(o => o.value), color: C.plum}; }},
  ],
  charts: [
    // 28/11/2026: sơ đồ luồng vẽ bằng window.CN_DRAW_CHAIN (cuối file) khi Bản đồ ngành dựng xong.
    {id: 'chLiveChain', type: 'html', src: [['FinSuccess tổng hợp; tỷ trọng chi phí: VCBS 11/05/2023', '#rf-q-sim']],
      method: '% trên mũi tên vào trại nuôi: tỷ trọng trong chi phí nuôi một con heo (VCBS T5/2023, trại chuyên nghiệp; số lịch sử, không phải hiện tại). Số trong ô: kỳ mới nhất của chart cùng khâu. Rê chuột xem luồng của khâu, bấm khâu xem mã niêm yết; nút dưới sơ đồ mở chart của khâu.',
      render: () => '<div class="cn-vc" id="cnVcHost"></div>'},
    {id: 'chLiveModels', type: 'models', items: [
      ['Chuỗi khép kín thức ăn – giống – heo', 'DBC', 'Thức ăn chăn nuôi, con giống, heo thịt, thịt chế biến; có thêm mảng bất động sản', 'Giá heo hơi; giá ngô, khô đậu nhập (biên thức ăn và giá thành heo); dịch bệnh', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-sim', 'Lãi một con heo']]],
      // 28/11/2026 (người dùng sửa): BAF cùng mô hình khép kín với DBC; thêm HPA, MML cho khớp rổ Tài chính ngành.
      ['Chuỗi khép kín thức ăn – giống – heo', 'BAF', 'Thức ăn tự sản xuất, con giống, heo thịt từ trang trại công nghệ cao', 'Giá heo hơi; số đầu heo xuất bán; giá ngô, khô đậu', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-co-gm', 'Biên gộp']]],
      ['Chuỗi khép kín thức ăn – giống – heo', 'HPA', 'Thức ăn chăn nuôi, heo giống và heo thịt, bò, trứng gà (công ty con của HPG)', 'Giá heo hơi; giá ngô, khô đậu nhập; giá trứng, giá bò', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-input', 'Giá ngô, khô đậu']]],
      ['Chăn nuôi – chế biến thịt', 'MML', 'Trại heo, gà; thịt mát MEATDeli và thịt chế biến (công ty con của MSN; đã bán mảng thức ăn năm 2021)', 'Giá heo hơi (đầu vào khâu chế biến, đầu ra khâu trại); giá bán lẻ thịt mát; sức mua', [['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-import', 'Thịt nhập khẩu']]],
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
    {id: 'liveTimeline', type: 'timeline', items: TIMELINE,
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
  // 28/11/2026 (khung chuẩn Điện): Mốc chính sách & dịch bệnh rời Tổng quan → sub-tab cuối "Chính sách" của Bức tranh ngành (#mt4, ?sub=policy#mt1 cũ về đây).
  alias: {mt3: ['mt2', 'heo', 'rf-q-sim'], mt4: ['mt2', 'policy'], mt6: ['mt14', 'sector'], mt9: ['mt14', 'sector'], mt11: ['mt2', 'feed']},
  section: {price: ['mt2', 'heo', 'rf-q-hog'], breadth: ['mt2', 'heo', 'rf-q-breadth'], supply: ['mt2', 'heo', 'rf-st-heo-prod'], import: ['mt2', 'heo', 'rf-q-import'], asf: ['mt2', 'heo', 'rf-q-asf'], policy: ['mt2', 'policy'], input: ['mt2', 'feed'], feed: ['mt2', 'feed'], sim: ['mt2', 'heo', 'rf-q-sim'], companies: ['mt14', 'dn'], listed: ['mt14', 'sector']},
  subAlias: {'mt1/gia': ['mt2', 'heo'], 'mt1/rong': ['mt2', 'heo'], 'mt2/dan': ['mt2', 'heo'], 'mt2/nk': ['mt2', 'heo'], 'mt2/asf': ['mt2', 'heo'], 'mt11/nl': ['mt2', 'feed'], 'mt11/sim': ['mt2', 'heo'], 'mt1/policy': ['mt2', 'policy']},
  // cn-h3 (chHerdS) và cn-h4 (chPigOutS) là bản rút gọn của cn-21h, cn-22h (cùng hàm herd()/output(), cùng số NSO) → không dời, nằm ẩn trong .rf-rest.
  tree: {
    // 28/11/2026 (khung chuẩn Điện): thanh .ov-nav 00 Bản đồ ngành · 01 Mô hình kinh doanh (dòng phụ = sub); chính sách chuyển sang Bức tranh ngành.
    mt1: {title: 'Tổng quan ngành', subs: [
      {k: 'map', t: 'Bản đồ ngành', sub: 'Chuỗi ngô, đậu → cám → heo → thịt', d: 'Nguyên liệu nhập → thức ăn → nuôi heo → giết mổ, chế biến; số mới nhất ở từng khâu.', items: [
        {q: 'Heo đi qua những khâu nào trước khi thành lợi nhuận?', id: 'rf-q-map', take: ['cn-01'], build: () => window.CN_DRAW_CHAIN?.()}]},
      {k: 'model', t: 'Mô hình kinh doanh', sub: 'DBC, BAF, HPA, MML, HAG kiếm tiền ở khâu nào', d: 'Năm doanh nghiệp niêm yết: mảng hoạt động, biến quyết định biên và chart cần theo dõi.', items: [
        {q: 'Mỗi doanh nghiệp kiếm tiền từ đâu, biến nào quyết định biên?', id: 'rf-q-model', take: ['cn-05']}]},
    ]},
    mt2: {title: 'Bức tranh ngành', subs: [
      {k: 'feed', t: 'Thức ăn chăn nuôi', d: 'Ngô, khô đậu nhập khẩu → nhà máy thức ăn → cám cho đàn heo, gia cầm.', asof: ASOF.feed, kpis: ['spk-soy', 'spk-feed', 'spk-pe'],
        flow: [['in', 'Đầu vào', 'Ngô, khô đậu tương nhập khẩu'], ['prod', 'Sản xuất', 'Sản lượng thức ăn gia súc'], ['out', 'Đầu ra', 'Cám cho đàn heo, gia cầm']], items: [
        {stage: 'in'},
        {q: 'Ngô và khô đậu tương đang đi cùng chiều?', id: 'rf-q-input', meta: 'USD/tấn · World Bank Pink Sheet · 3 năm và 10 năm', take: ['cn-h2', 'cn-h2b']},
        {q: 'Nhập khẩu nguyên liệu thức ăn bao nhiêu?', id: 'rf-q-feedimp', meta: 'triệu USD · theo tháng (Hải quan)', take: ['cn-12']},
        {stage: 'prod'},
        {q: 'Sản lượng thức ăn chăn nuôi đang tăng hay giảm?', id: 'rf-q-feed', meta: '<b>sản lượng sản xuất</b> toàn ngành (NSO)', take: ['cn-11']},
        {stage: 'out'},
        {link: ['#rf-q-herd', 'Chăn nuôi heo › 2.1', 'Cầu thức ăn đi theo tổng đàn heo', 'Tổng đàn cuối kỳ so cùng kỳ (NSO)']},
        {link: ['#rf-q-sim', 'Chăn nuôi heo › 2.9', 'Giá cám trong giá thành một con heo', 'Mô phỏng doanh thu, chi phí, lãi theo giá heo và giá cám']}]},
      {k: 'heo', t: 'Chăn nuôi heo', d: 'Thức ăn, con giống, dịch bệnh → tổng đàn, xuất chuồng → giá heo hơi, cạnh tranh của thịt nhập khẩu, lãi một con heo.', asof: ASOF.heo, kpis: ['spk-hog', 'spk-herd', 'spk-pigout'],
        flow: [['in', 'Đầu vào', 'Giá thức ăn'], ['prod', 'Sản xuất', 'Tổng đàn và heo xuất chuồng'], ['out', 'Đầu ra', 'Giá heo hơi, thịt cạnh tranh, lãi một con heo']], items: [
        {stage: 'in'},
        {link: ['#rf-q-input', 'Thức ăn chăn nuôi › 1.1', 'Giá ngô, khô đậu tương', 'Thức ăn chiếm phần lớn giá thành heo']},
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
        {q: 'Một con heo lãi bao nhiêu, giá heo và giá cám đổi thì lãi đổi thế nào?', id: 'rf-q-sim', meta: '<b>mô phỏng</b> · preset lịch sử VCBS hoặc số tự nhập · các yếu tố khác giữ cố định', take: ['cn-s1', 'cn-s2']},
        // 28/11/2026 (người dùng yêu cầu): dịch tả heo châu Phi đưa xuống cuối sub-tab.
        {grp: 'Rủi ro dịch bệnh'},
        {q: 'Dịch tả heo châu Phi đang ở mức nào?', id: 'rf-q-asf', meta: 'sự kiện có kỳ và nguồn · lũy kế ghi riêng', take: ['cn-40']}]},
      // 28/11/2026 (khung chuẩn Điện): Chính sách là sub-tab cuối của Bức tranh ngành, như Điện › 06 Chính sách.
      {k: 'policy', t: 'Chính sách', d: 'Văn bản và sự kiện có thể đổi giá thành hoặc nguồn cung của cả chuỗi.', asof: ASOF.policy, items: [
        {q: 'Mốc nào có thể đổi giá thành hoặc nguồn cung?', id: 'rf-q-policy', meta: '● đã ban hành / sự kiện · ngày hiệu lực', take: ['cn-52']}]},
    ]},
    // 28/11/2026 (người dùng yêu cầu, theo chuẩn Điện/Thép/Dược): 01 Tổng quan ngành = chỉ số cộng gộp BCTC quý (app/livestock-finance.js,
    // window.LIVESTOCK_FIN từ scripts/build_livestock_financials.py) · 02 So sánh doanh nghiệp = từng mã · 03 Định giá = app/peer-valuation.js tự thêm.
    // 28/11/2026 (khung chuẩn Điện): đổi tên 01 Tài chính ngành · 02 Doanh nghiệp niêm yết · 03 Định giá; khóa sub-tab (sector, dn) giữ nguyên cho link cũ.
    mt14: {title: 'Tài chính ngành', subs: [
      {k: 'sector', t: 'Tài chính ngành', d: 'Kết quả kinh doanh, biên, CAPEX, vốn lưu động, nợ vay và tỷ suất sinh lời cộng gộp từ BCTC hợp nhất quý của DBC, BAF, HPA, MML, HAG.', items: [
        // 28/11/2026: livestock-finance.js tự dựng câu hỏi 1.1…1.7 trong .cn-fin-host → gắn thẳng vào sub-tab (trước đây bọc trong câu 1.1 nên số câu lặp 1.1).
        {html: () => { const h = document.createElement('div'); h.className = 'cn-fin-host rf-wide'; h.id = 'cn-fin-root'; return h; }}]},
      {k: 'dn', t: 'Doanh nghiệp niêm yết', d: 'Thay đổi giá heo, chi phí đi vào doanh thu, biên của từng doanh nghiệp; bảng so sánh và kế hoạch 2026.', items: [
        {q: 'Doanh thu, biên theo quý từng mã?', id: 'rf-q-rev', meta: 'nghìn tỷ đồng · %, hợp nhất quý từng mã, không cộng', take: ['cn-06', 'cn-22']},
        {q: 'Doanh thu, lợi nhuận và chỉ tiêu vận hành từng doanh nghiệp?', id: 'rf-q-co', meta: 'chọn mã ở nút trên chart · BCTC hợp nhất quý + chỉ tiêu doanh nghiệp công bố', take: ['cn-d1']},
        {q: 'Biên gộp có đi theo giá heo?', id: 'rf-q-co-gm', meta: '% biên gộp · giá heo tham chiếu bình quân quý, không phải ASP', take: ['cn-d2']},
        {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'rf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ', take: ['.financial-comparison']},
        {q: 'Doanh nghiệp đã đi được bao nhiêu so với kế hoạch 2026?', id: 'rf-q-plan', take: ['cn-60']},
        // 28/11/2026 (người dùng yêu cầu đồng bộ): P/E rổ ngành ở So sánh doanh nghiệp như P/B nhóm thép th-03; ô số spk-pe ở sub-tab đầu Bức tranh ngành như Thép, Dược.
        {q: 'Thị trường định giá cổ phiếu chăn nuôi ở mức nào?', id: 'rf-q-pe', meta: 'lần · rổ VNDirect', take: ['cn-03']}]},
    ]},
  },
};
})();
/* Sơ đồ chuỗi giá trị chăn nuôi heo (28/11/2026, người dùng yêu cầu trực quan hơn): luồng Đầu vào → Thức ăn → Chăn nuôi → Đầu ra
   vẽ bằng ValueChain.draw (app/value-chain.js, cùng kiểu Điện, Phân bón, Cá tra). Mỗi ô có số mới nhất của chart cùng khâu (window.AGRI_PUBLIC).
   % trên mũi tên vào trại = tỷ trọng trong chi phí nuôi một con heo, VCBS 11/05/2023 tr. 5, cột T5/2023 trại chuyên nghiệp:
   thức ăn 2.685.000 (64%) · giống 1.235.000 (29%) · thú y + nhân công 306.000 (7%) đ/con trên tổng các dòng 4.226.000 — cùng preset mô phỏng cn-s1. */
window.CN_DRAW_CHAIN = () => {
  const host = document.getElementById('cnVcHost'); if (!host || !window.ValueChain || host.dataset.done) return; host.dataset.done = '1';
  const A = window.AGRI_PUBLIC?.blocks || {}, S = k => A.macro?.series?.[k]?.records || A.commodity?.series?.[k]?.records || [];
  const nf = (v, d = 0) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : null;
  const per = r => r ? 'T' + Number(r.date.slice(5, 7)) + '/' + r.date.slice(2, 4) : '';
  const yoy = k => { const rs = S(k), l = rs.at(-1); if (!l) return null; const p = rs.find(x => x.date.slice(0, 7) === (Number(l.date.slice(0, 4)) - 1) + l.date.slice(4, 7)); return p ? (l.value / p.value - 1) * 100 : null; };
  const sg = v => Number.isFinite(v) ? (v >= 0 ? '+' : '−') + nf(Math.abs(v), 0) + '%' : null;
  const line = (k, unit, d = 0) => { const r = S(k).at(-1); return r ? `${nf(r.value, d)} ${unit} · ${per(r)}` : 'chưa có số'; };
  const chg = (k, alt) => { const y = sg(yoy(k)); return y ? y + ' so cùng kỳ' : alt; };
  const hog = S('hog').at(-1);
  const IN = '#2a9fa3', FEED = '#c98a00', FARM = '#2f8f4e', OUT = '#2938A8', IMP = '#861C52', H = 74;
  const N = [
    ['corn', 24, 52, 236, IN, 'leaf', 'Ngô nhập khẩu', 'NK ' + line('imp_corn', 'tr. USD'), chg('imp_corn', 'chủ yếu từ Mỹ, Brazil, Argentina')],
    ['soy', 24, 140, 236, IN, 'leaf', 'Đậu tương, khô đậu', 'NK ' + line('imp_soy', 'tr. USD'), chg('imp_soy', 'nguồn đạm chính của cám')],
    ['piglet', 24, 252, 236, IN, 'box', 'Con giống', 'trại tự sản xuất hoặc mua', 'DBC tự sản xuất giống'],
    ['vet', 24, 340, 236, IN, 'pill', 'Thú y, nhân công', 'vaccine, an toàn sinh học', 'rủi ro: dịch tả heo'],
    ['mill', 292, 96, 200, FEED, 'factory', 'Nhà máy thức ăn', line('feed', 'nghìn tấn'), (sg(yoy('feed')) ? sg(yoy('feed')) + ' · ' : '') + 'DBC, BAF, HPA tự cung'],
    ['farm', 520, 96, 196, FARM, 'home', 'Trại doanh nghiệp', 'quy mô lớn, khép kín', 'DBC · BAF · HPA · MML · HAG'],
    ['house', 520, 296, 196, FARM, 'home', 'Gia trại, hộ nhỏ', 'mua cám, mua giống', 'giá thành cao hơn'],
    ['trader', 750, 52, 204, OUT, 'truck', 'Heo hơi', hog ? `${nf(hog.value, 1)} nghìn đ/kg · ${per(hog)}` : 'giá heo hơi', chg('hog', 'bán cho thương lái, lò mổ')],
    ['slaughter', 750, 186, 204, OUT, 'factory', 'Giết mổ, chế biến', 'thịt mát, thịt chế biến', 'DBC · MML (MEATDeli)'],
    ['import', 750, 336, 204, IMP, 'ship', 'Thịt heo nhập khẩu', 'HS 0203 · cạnh tranh giá', 'xem nước xuất xứ ở chart'],
    ['market', 982, 120, 172, OUT, 'store', 'Chợ, siêu thị', 'cửa hàng thịt', 'kênh bán lẻ'],
    ['consumer', 982, 290, 172, OUT, 'home', 'Người tiêu dùng', 'thịt heo, gia cầm', 'gia cầm là hàng thay thế'],
  ];
  const E = [
    ['corn', 'mill', IN], ['soy', 'mill', IN],
    ['mill', 'farm', FEED], ['mill', 'house', FEED],
    ['piglet', 'farm', IN], ['piglet', 'house', IN], ['vet', 'farm', IN], ['vet', 'house', IN],
    ['farm', 'trader', FARM], ['house', 'trader', FARM], ['farm', 'slaughter', FARM],
    ['trader', 'slaughter', OUT], ['slaughter', 'market', OUT], ['import', 'market', IMP], ['market', 'consumer', OUT],
  ];
  const W = {'mill>farm': 6, 'mill>house': 6, 'piglet>farm': 3.5, 'piglet>house': 3.5};
  const fig = ValueChain.draw({N, E, H, height: 440,
    lanes: [['ĐẦU VÀO', 10, 264, '#eef6f6', '#2a9fa3'], ['THỨC ĂN', 284, 214, '#fbf4e4', '#c98a00'], ['CHĂN NUÔI', 506, 224, '#edf6ee', '#2f8f4e'], ['ĐẦU RA', 740, 424, '#eaf0f8', '#2938A8']],
    labels: [[500, 150, '64%'], [500, 268, '29%'], [500, 372, '7%']],
    width: (a, b) => W[a + '>' + b] || null,
    legend: [[IN, 'Nguyên liệu, giống, thú y'], [FEED, 'Thức ăn (64% chi phí nuôi)'], [FARM, 'Heo hơi từ trại'], [OUT, 'Thịt đến người tiêu dùng'], [IMP, 'Thịt nhập khẩu cạnh tranh']],
    title: 'Chuỗi giá trị ngành chăn nuôi heo',
    desc: 'Ngô, đậu tương nhập khẩu vào nhà máy thức ăn; thức ăn, con giống, thú y vào trại doanh nghiệp và gia trại; heo hơi qua thương lái, giết mổ, chế biến tới chợ, siêu thị và người tiêu dùng; thịt nhập khẩu cạnh tranh ở khâu bán lẻ.'});
  host.replaceChildren(fig);
  // Nút mở chart của từng khâu (chart nằm ở Bức tranh ngành).
  const go = [['#rf-q-input', 'Giá ngô, khô đậu'], ['#rf-q-feedimp', 'Nhập khẩu nguyên liệu'], ['#rf-q-feed', 'Sản lượng thức ăn'], ['#rf-q-herd', 'Tổng đàn'], ['#rf-q-out', 'Xuất chuồng'], ['#rf-q-hog', 'Giá heo hơi'], ['#rf-q-import', 'Thịt nhập khẩu'], ['#rf-q-sim', 'Lãi một con heo'], ['#rf-q-asf', 'Dịch tả heo châu Phi']];
  const nav = document.createElement('p'); nav.className = 'cn-vc-go';
  nav.innerHTML = '<b>Xem chart từng khâu:</b> ' + go.map(([h, t]) => `<a href="${h}">${t} →</a>`).join('');
  host.append(nav);
  if (!document.getElementById('cn-vc-style')) { const st = document.createElement('style'); st.id = 'cn-vc-style';
    st.textContent = '.cn-vc-go{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;margin:10px 0 0;font-size:12.5px}.cn-vc-go b{color:var(--ink2,#3b4256);margin-right:4px}.cn-vc-go a{padding:4px 10px;border:1px solid var(--line,#d6dbe8);border-radius:999px;background:var(--card,#fff);color:#2938A8;text-decoration:none;font-weight:600}.cn-vc-go a:hover{border-color:#2938A8}';
    document.head.append(st); }
};
