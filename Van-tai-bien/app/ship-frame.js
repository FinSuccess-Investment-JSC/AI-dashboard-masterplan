/* Vận tải biển · khung 4 tab chuẩn Điện (28/11/2026, DASHBOARD_WORKFLOW §42; người dùng: "lấy DB ngành điện làm tiêu chuẩn", "sửa toàn bộ, thật kĩ").
   Tab lớn: Tổng quan ngành (#mt1, thanh .ov-nav: 00 Bản đồ ngành · 01 Chuỗi giá trị theo phân khúc tàu · 02 Triển vọng)
          · Bức tranh ngành (#mt2, thanh .pp-nav: 01 Toàn ngành · 02 Tàu dầu thô · 03 Tàu sản phẩm & hóa chất · 04 Hàng rời · 05 Container
            · 06 Chi phí & giá tàu · 07 Tuyến & địa chính trị · 08 Chính sách — Chính sách là sub-tab cuối có thanh con .pp-subnav như Điện › 06)
          · Tài chính ngành (#mt14, thanh .pp-nav: 01 Tài chính ngành = app/ship-finance.js · 02 Doanh nghiệp niêm yết · 03 Định giá = app/peer-valuation.js)
          · Chủ đề nóng (#mt7, luồng tin như Điện: app/shipping-news.js, 28/11/2026).
   Mỗi sub-tab Bức tranh ngành: tiêu đề .pp-head + "Dữ liệu mới nhất" (.pp-asof, quan sát mới nhất của các chuỗi trong sub-tab, đọc từ
   window.SHIPPING_PUBLIC / SHIPPING_DAILY / SECTOR_DAILY) · ô số .pp-kpis (ô có sẵn + ô tính từ chính các chuỗi đó, không thêm số ngoài dữ liệu)
   · thanh luồng Đầu vào → Sản xuất → Đầu ra · câu hỏi đánh số .pp-panel (.pp-main → .pp-sup1 → .pp-more). Thẻ được DỜI theo data-block-id,
   không nhân bản, không xóa; chỗ thứ hai đặt thẻ dẫn a.th-link; thẻ không còn chỗ nằm trong details.of-rest ẩn.
   Thay khung 5 tab 26/11/2026 (chép Dầu khí, tab Chính sách riêng #mt4, Bức tranh tường thẻ .of-nav). Giao diện thanh/khung: app/sector-frame.css.
   Deep-link: ?sub=<khóa>#mtN. Link cũ: #mt3 → Bức tranh › 06 · #mt4 (?sub=ustr…) → Bức tranh › 08 Chính sách · #mt10 → Bức tranh › 07
   · #mt6 → Tài chính › 02 · #mt8 → Tổng quan › 00 · ?sub=listed#mt1 → Tài chính › 02 · ?sub=total|compare#mt14 → 01|02. */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
if (document.body.dataset.sector !== 'shipping' || !$('[data-block-id="vt-01"]')) return;  // chỉ trang Vận tải biển

/* ======================= CẤU HÌNH RIÊNG VẬN TẢI BIỂN ======================= */
const SP = () => window.SHIPPING_PUBLIC?.blocks || {}, SD = () => window.SHIPPING_DAILY || {}, SX = () => window.SECTOR_DAILY?.sources || {};
const COM = () => SP().commodity?.series || {}, MAC = () => SP().macro?.series || {}, FE = () => SP().fearnleys?.series || {};
const tce = crude => (SD().tce?.routes || []).filter(r => (r.group === 'Dầu thô') === crude);
const LINK = (href, where, t, s) => ({link: [href, where, t, s]});
const CFG = {
  name: 'vận tải biển', flag: 'shipFrame', event: 'ship:frame', pre: 'vt', fin: () => window.ShipFinance, finHost: 'vt-fin-root',
  finIntro: 'Số liệu tài chính của 8 doanh nghiệp vận tải biển niêm yết, tổng hợp theo phân khúc, từ BCTC hợp nhất quý.',
  // Tổng quan ngành: thẻ .ov-nav (số · tiêu đề · dòng phụ). Doanh nghiệp niêm yết (vt-04, bảng so sánh) sang Tài chính ngành › 02.
  OV: [
    {k: 'map', t: 'Bản đồ ngành', s: 'Toàn cảnh ngành', d: 'Chủ hàng → thuê tàu → ba đội tàu → cước thế giới; mỗi khâu gắn mã niêm yết.', items: [
      {q: 'Hàng đi qua những ai, cước quyết định ở khâu nào?', id: 'vt-ov-road', main: ['.research-roadmap']},
      {q: 'Doanh nghiệp niêm yết nằm ở khâu nào của chuỗi?', id: 'vt-ov-chain', main: ['vt-01']},
    ], legal: 'Văn bản pháp lý nào quy định từng khâu?'},  // khung pháp lý (.re-legal-map) do app/sector-legal.js thêm, bọc thành mục 0.3
    {k: 'chain', t: 'Chuỗi giá trị', s: 'Tàu dầu & khí · hàng rời · container', d: 'Doanh thu từng phân khúc tàu đến từ đâu, biến nào quyết định.', items: [
      {q: 'Mỗi phân khúc tàu kiếm tiền thế nào, biến nào quyết định?', id: 'vt-ov-models', main: ['.business-models']},
    ]},
    {k: 'outlook', t: 'Triển vọng', s: 'Vị trí chu kỳ · cung tàu mới', d: 'Cước đang ở đâu trong chu kỳ, cung tàu mới vào bao nhiêu.', items: [
      {q: 'Cước đang ở đâu trong chu kỳ?', id: 'vt-ov-cycle', main: ['vt-02']},
      {q: 'Cung tàu mới vào bao nhiêu, phân khúc nào nhiều nhất?', id: 'vt-ov-orderbook', main: ['vt-25']},
      {q: 'Giá thuê tàu container, hàng rời và giá tàu mới nhất ra sao?', id: 'vt-ov-charter', main: ['vt-62']},
    ]},
  ],
  // Bức tranh ngành theo phân khúc tàu như Điện chia theo loại nguồn. Mỗi câu hỏi: main = chart trả lời chính, sup = chart phụ, more = xem thêm.
  PICT: [
    {k: 'overview', t: 'Toàn ngành', d: 'Cước các phân khúc so cùng kỳ, vận tải biển Việt Nam và định giá ngành.', kpis: ['spk-pe', 'spk-vt-sea', 'spk-vt-ppi'],
      asof: [['cước Baltic', () => [COM().bdti, COM().bcti, COM().bdi], 'd'], ['vận chuyển Việt Nam', () => [MAC().sea_freight], 'm']], items: [
      {grp: 'Thị trường thế giới'},
      {q: 'Chỉ báo nào đang tăng, chỉ báo nào giảm so với cùng kỳ?', id: 'vt-q-heat', main: ['.fsv-heat']},
      {grp: 'Việt Nam'},
      {q: 'Đội tàu Việt Nam chở nhiều hàng hơn hay ít hơn?', id: 'vt-q-sea', main: ['vt-21']},
      {q: 'Giá cước trong nước có tăng theo cước thế giới?', id: 'vt-q-ppi', main: ['vt-22']},
    ]},
    {k: 'crude', t: 'Tàu dầu thô', d: 'Cung – cầu tàu, cước giao ngay theo tuyến và giá thuê định hạn so mức doanh nghiệp đang ký.', kpis: ['spk-bdti', 'spk-vt-tcvlcc'],
      asof: [['', () => [SD().eastmoney?.series?.bdti, COM().bdti, tce(true), FE().tc1y_vlcc, FE().vlcc_avail_meg], 'd']],
      flow: [['in', 'Đầu vào', 'Cung – cầu tàu, VLCC trống tại Vịnh'], ['prod', 'Sản xuất', 'Cước giao ngay BDTI, thu nhập theo tuyến'], ['out', 'Đầu ra', 'Thuê định hạn 1 năm so mức doanh nghiệp ký']], items: [
      {stage: 'in'},
      {q: 'Cung tàu dầu thô có theo kịp cầu?', id: 'vt-q-sdtanker', main: ['vt-12']},
      {q: 'Còn bao nhiêu VLCC trống tại Vịnh Ba Tư?', id: 'vt-q-vlcc', main: ['vt-14']},
      {stage: 'prod'},
      {q: 'Cước tàu dầu đang ở đâu so với các năm trước?', id: 'vt-q-bdti', main: ['vt-10']},
      {q: 'Tuyến tàu dầu thô nào đang kiếm nhiều nhất?', id: 'vt-q-tce', main: ['vt-61']},
      {stage: 'out'},
      {q: 'Giá thuê 1 năm cao hơn mức doanh nghiệp Việt Nam đang ký bao nhiêu?', id: 'vt-q-tc1y', main: ['vt-13']},
      LINK('#vt-q-gauge', 'Chi phí & giá tàu › 6.3', 'Giá thuê đang ký của từng mã so thị trường', 'PVP, PVT: TC đang ký so TC 1 năm cùng cỡ tàu'),
    ]},
    {k: 'product', t: 'Tàu sản phẩm & hóa chất', d: 'Giá tàu MR, cước BCTI theo tuyến, giá thuê định hạn tàu sản phẩm, tàu khí và tàu hóa chất.', kpis: ['spk-bcti', 'spk-vt-tcmr'],
      asof: [['', () => [SD().eastmoney?.series?.bcti, COM().bcti, tce(false), SD().compass?.mr, SD().lpg, SD().blpg, FE().sh5_mr, FE().nb_product_tanker], 'd']],
      flow: [['in', 'Đầu vào', 'Giá tàu MR cũ và đóng mới'], ['prod', 'Sản xuất', 'Cước giao ngay BCTI, thu nhập theo tuyến'], ['out', 'Đầu ra', 'Thuê định hạn MR, LR1, tàu khí, tàu hóa chất']], items: [
      {stage: 'in'},
      {q: 'Giá tàu MR đang lên hay xuống?', id: 'vt-q-mrprice', main: ['vt-72']},
      {stage: 'prod'},
      {q: 'Cước tàu sản phẩm đang tăng hay giảm?', id: 'vt-q-bcti', main: ['vt-70']},
      {q: 'Tuyến tàu sản phẩm nào kiếm nhiều nhất?', id: 'vt-q-tceprod', main: ['vt-71']},
      {stage: 'out'},
      {q: 'Thuê 12 tháng tàu MR, LR1 đang ở mức nào?', id: 'vt-q-mrtc', main: ['vt-75']},
      {q: 'Giá thuê tàu khí LPG đi hướng nào?', id: 'vt-q-lpg', main: ['vt-73']},
      {q: 'Tàu hóa chất có giữ được thu nhập?', id: 'vt-q-chem', main: ['vt-74']},
    ]},
    {k: 'bulk', t: 'Hàng rời', d: 'Cung – cầu hàng rời, BDI và bốn cỡ tàu, giá thuê định hạn 1 năm.', kpis: ['spk-bdi', 'spk-vt-tccape'],
      asof: [['', () => [SD().bdi, SD().bdi_sub, COM().bdi, FE().tc1y_capesize, FE().tc1y_panamax, FE().tc1y_supramax, FE().tc1y_handysize], 'd']],
      flow: [['in', 'Đầu vào', 'Cung – cầu hàng rời (BIMCO)'], ['prod', 'Sản xuất', 'Cước BDI và bốn cỡ tàu'], ['out', 'Đầu ra', 'Thuê định hạn 1 năm theo cỡ']], items: [
      {stage: 'in'},
      {q: 'Cung tàu hàng rời có tăng nhanh hơn cầu?', id: 'vt-q-sdbulk', main: ['vt-23']},
      {stage: 'prod'},
      {q: 'Cước hàng rời (BDI) đang tăng hay giảm?', id: 'vt-q-bdi', main: ['vt-65'], sup: ['vt-20']},
      {q: 'Cỡ tàu nào đang kéo BDI?', id: 'vt-q-bdisub', main: ['vt-65a', 'vt-65b', 'vt-65c', 'vt-65d']},
      {stage: 'out'},
      {q: 'Thuê định hạn 1 năm theo cỡ tàu đang ở mức nào?', id: 'vt-q-tcbulk', main: ['vt-24']},
    ]},
    {k: 'container', t: 'Container', d: 'Cầu xuất nhập khẩu, cung – cầu đội tàu container và cước FBX theo tuyến.', kpis: ['spk-vt-fbx', 'spk-vt-trade'],
      asof: [['FBX', () => [SP().fbx], 'd'], ['xuất nhập khẩu', () => [MAC().exports, MAC().imports], 'm']],
      flow: [['in', 'Đầu vào', 'Cầu: xuất nhập khẩu Việt Nam'], ['prod', 'Sản xuất', 'Cung – cầu đội tàu container (BIMCO)'], ['out', 'Đầu ra', 'Cước FBX theo tuyến']], items: [
      {stage: 'in'},
      {q: 'Xuất nhập khẩu, cầu của hàng container, tăng hay chững?', id: 'vt-q-trade', main: ['vt-30']},
      {stage: 'prod'},
      {q: 'Đội tàu container tăng nhanh hơn cầu bao nhiêu?', id: 'vt-q-sdcont', main: ['vt-31']},
      {stage: 'out'},
      {q: 'Cước container theo tuyến đang tăng hay giảm?', id: 'vt-q-fbx', main: ['vt-32'],
        gap: 'Chưa có chuỗi giá thuê tàu container (HARPEX, New ConTex) theo thời gian; mức mới nhất ở Tổng quan ngành › 02 Triển vọng.'},
      LINK('#of-mt1-outlook', 'Tổng quan ngành › 02 Triển vọng', 'Giá thuê tàu container (HARPEX) mới nhất', 'Thẻ Hàng rời, container và giá tàu'),
    ]},
    {k: 'cost', t: 'Chi phí & giá tàu', d: 'Nhiên liệu, giá tàu cũ và đóng mới, giá thuê đang ký của từng mã so thị trường.', kpis: ['spk-brent', 'spk-vt-vlcc5'],
      asof: [['', () => [COM().brent, COM().fuel_oil_cn, FE().sh5_vlcc, FE().sh10_vlcc, FE().nb_vlcc], 'd']],
      flow: [['in', 'Đầu vào', 'Nhiên liệu: Brent, dầu nhiên liệu'], ['prod', 'Sản xuất', 'Giá tàu cũ và đóng mới'], ['out', 'Đầu ra', 'Giá thuê đang ký của từng mã so thị trường']], items: [
      {stage: 'in'},
      {q: 'Chi phí nhiên liệu đang tăng hay giảm?', id: 'vt-q-fuel', main: ['vt-11']},
      {stage: 'prod'},
      {q: 'Giá tàu cũ và đóng mới đã chạm đỉnh chưa?', id: 'vt-q-shipprice', main: ['vt-64']},
      {stage: 'out'},
      {q: 'Mã nào đang cho thuê thấp hơn giá thị trường nhiều nhất?', id: 'vt-q-gauge', main: ['vt-63']},
    ]},
    {k: 'routes', t: 'Tuyến & địa chính trị', d: 'Lượt tàu qua Hormuz, Bab el-Mandeb, Suez và chi phí đi vòng.', kpis: ['spk-hormuz', 'spk-vt-bab'],
      asof: [['', () => [SX().hormuz, SX().bab_el_mandeb], 'd']],
      flow: [['in', 'Đầu vào', 'Eo biển Hormuz, Bab el-Mandeb'], ['prod', 'Sản xuất', 'Qua Suez hay đi vòng Mũi Hảo Vọng'], ['out', 'Đầu ra', 'Tấn-dặm và cước tàu dầu']], items: [
      {stage: 'in'},
      {q: 'Lượt tàu qua Hormuz, Bab el-Mandeb đã hồi phục chưa?', id: 'vt-q-choke', main: ['vt-40']},
      {q: 'Hormuz còn bao nhiêu lượt tàu mỗi ngày?', id: 'vt-q-hormuz', main: ['vt-41']},
      {stage: 'prod'},
      {q: 'Đi vòng Mũi Hảo Vọng tốn thêm bao nhiêu?', id: 'vt-q-cape', main: ['vt-42']},
      {stage: 'out'},
      LINK('#vt-q-bdti', 'Tàu dầu thô › 2.3', 'Cước tàu dầu BDTI, BCTI', 'Eo biển đóng làm tấn-dặm tăng, đẩy cước tàu dầu'),
    ]},
  ],
  // Chính sách: sub-tab cuối của Bức tranh ngành; mỗi văn bản một mục trong thanh con (tóm tắt, bảng "Mới duyệt" do app/sector-legal.js thêm).
  POLICY: {d: 'Mỗi văn bản pháp lý lớn: tóm tắt, quy định trước và sau, tác động lên doanh nghiệp.', subs: [
    {k: 'ustr', t: 'Phí cảng Mỹ (USTR 301)', ids: ['vt-50']},
    {k: 'sanc', t: 'Cấm vận dầu Nga · Iran'},
    {k: 'ets', t: 'EU ETS hàng hải'},
    {k: 'imo', t: 'IMO Net-Zero Framework'},
    {k: 'code', t: 'Bộ luật Hàng hải & Đường thủy', ids: ['vt-51']},
    {k: 'fleet', t: 'Thuế, phí & đề án đội tàu'},
    {k: 'docs', t: 'Mới duyệt gần đây'},
  ]},
  FIN: {fin: 'Lợi nhuận, biên, đòn bẩy và dòng tiền của 8 doanh nghiệp vận tải biển, cộng gộp theo phân khúc từ BCTC quý.',
    companies: 'Bảng so sánh, xu hướng theo quý, kế hoạch – kết quả, biến quyết định từng mã và P/E rổ.',
    items: [  // P/E rổ (vt-03) cuối cùng
      {q: 'Doanh nghiệp nào tăng trưởng và biên tốt nhất qua các quý?', id: 'vt-fn-cmp', main: ['.financial-comparison']},
      {q: 'Kế hoạch 2026 của từng mã đã hoàn thành bao nhiêu?', id: 'vt-fn-plan', main: ['vt-60']},
      {q: 'Mỗi nhóm doanh nghiệp phụ thuộc biến nào?', id: 'vt-fn-drivers', main: ['vt-04']},
      {q: 'Cổ phiếu vận tải đã tăng, giảm bao nhiêu từ đầu năm?', id: 'vt-fn-stocks', main: ['vt-66'], sup: ['vt-67']},
      {q: 'P/E của rổ vận tải đường thủy đang ở đâu so với lịch sử?', id: 'vt-fn-pe', main: ['vt-03']},
    ]},
  ALIAS: {mt3: ['mt2', 'cost'], mt4: ['mt2', 'policy'], mt10: ['mt2', 'routes'], mt6: ['mt14', 'companies'], mt8: ['mt1', 'map'], mt5: ['mt1', 'map'], mt9: ['mt14', 'fin']},
  XSUB: {mt1: {listed: ['mt14', 'companies']}},
  SUBALIAS: {mt14: {total: 'fin', sector: 'fin', compare: 'companies', listed: 'companies'}},
  // Ô số mới, tính từ đúng các chuỗi đã nạp trên trang (cùng nguồn với chart của sub-tab).
  KPI: {
    'spk-vt-sea': () => { const r = MAC().sea_freight?.records || [], L = r.at(-1); if (!L) return null;
      return {label: 'Vận chuyển đường biển đội tàu VN', value: nf(L.value / 1000, 1), unit: 'triệu tấn', delta: pctTxt(yoyM(r), 1, 'so cùng kỳ'), sub: fmt(L.date, 'm') + ' · Cục Thống kê', series: r.slice(-12).map(x => x.value / 1000)}; },
    'spk-vt-ppi': () => { const r = MAC().ppi_sea?.records || [], L = r.at(-1), P = r.at(-2); if (!L) return null;
      return {label: 'Giá vận tải biển trong nước', value: sg(L.value, 1) + '%', unit: '', delta: P ? `quý trước ${sg(P.value, 1)}%` : '', sub: 'so cùng kỳ · ' + fmt(L.date, 'q') + ' · Cục Thống kê', series: r.slice(-8).map(x => x.value)}; },
    'spk-vt-tcvlcc': () => fearn('tc1y_vlcc', 'TC 1 năm tàu VLCC', 'nghìn USD/ngày', 0),
    'spk-vt-tccape': () => fearn('tc1y_capesize', 'TC 1 năm tàu Capesize', 'nghìn USD/ngày', 1),
    'spk-vt-vlcc5': () => fearn('sh5_vlcc', 'Giá tàu VLCC 5 tuổi', 'triệu USD', 0),
    'spk-vt-tcmr': () => { const r = (SD().compass?.mr || []).filter(x => fin(x.tc_mr)), L = r.at(-1), P = r.at(-2); if (!L) return null;
      return {label: 'Thuê 12 tháng tàu MR', value: nf(L.tc_mr / 1000, 1), unit: 'nghìn USD/ngày', delta: P ? pctTxt((L.tc_mr / P.tc_mr - 1) * 100, 1, 'so tuần trước') : '', sub: fmt(L.date) + ' · Compass Maritime', series: r.slice(-16).map(x => x.tc_mr / 1000)}; },
    'spk-vt-fbx': () => fbxTile(SP().fbx),
    'spk-vt-trade': () => tradeTile(MAC()),
    'spk-vt-bab': () => { const r = SX().bab_el_mandeb?.records || []; if (!r.length) return null; const m = monthAvg(r, 'total'), L = m.at(-1), b23 = r.filter(x => x.date.startsWith('2023')).map(x => x.total);
      return {label: 'Bab el-Mandeb', value: nf(L.v, 0), unit: 'lượt/ngày', delta: b23.length ? `2023: ~${nf(b23.reduce((a, b) => a + b, 0) / b23.length, 0)} lượt/ngày` : '', sub: `bình quân ${fmt(L.m + '-01', 'm')} đến ${fmt(r.at(-1).date)} · IMF PortWatch`, series: m.slice(-12).map(x => x.v), color: '#d1583f'}; },
  },
  // Chủ đề Hormuz / Suez: 28/11/2026 chuyển vào luồng tin (app/shipping-news.js), link số liệu nằm ở related_data của chủ đề.
};
// Ô số Fearnleys (chuỗi tháng): so cùng tháng năm trước nếu có, không thì so kỳ trước.
function fearn(key, label, unit, d) {
  const r = FE()[key]?.records || [], L = r.at(-1); if (!L) return null;
  const y = yoyM(r), P = r.at(-2);
  return {label, value: nf(L.value, d), unit, delta: y != null ? pctTxt(y, 0, 'so cùng kỳ') : P ? pctTxt((L.value / P.value - 1) * 100, 0, 'so kỳ trước') : '', sub: fmt(L.date) + ' · Fearnleys', series: r.slice(-12).map(x => x.value)};
}

/* ======================= ENGINE (giống Cang-bien/app/port-frame.js) ======================= */
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const block = id => $(`[data-block-id="${id}"]`);
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 0) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const pctTxt = (v, d, tail) => fin(v) ? `${sg(v, d)}% ${tail}` : '';
const GAP = t => `<p class="data-gap of-gap">${esc(t)}</p>`;
const TODAY = new Date().toISOString().slice(0, 10), ISO = /^\d{4}-\d\d-\d\d/;
const fmt = (iso, kind) => kind === 'm' ? `T${+iso.slice(5, 7)}/${iso.slice(0, 4)}` : kind === 'q' ? `Q${Math.ceil(+iso.slice(5, 7) / 3)}/${iso.slice(0, 4)}` : `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
// Quan sát mới nhất (≤ hôm nay) trong một khối dữ liệu: khóa date/obs, phần tử [ngày, giá trị], khóa đối tượng dạng ngày.
function maxDate(o, depth = 0, best = '') {
  if (!o || typeof o !== 'object' || depth > 7) return best;
  const cand = s => { if (typeof s === 'string' && ISO.test(s)) { const d = s.slice(0, 10); if (d <= TODAY && d > best) best = d; } };
  if (Array.isArray(o)) { o.forEach(x => { if (Array.isArray(x)) cand(x[0]); else if (x && typeof x === 'object') best = maxDate(x, depth + 1, best); }); return best; }
  Object.entries(o).forEach(([k, v]) => { cand(k); if (k === 'date' || k === 'obs') cand(v); else if (v && typeof v === 'object') best = maxDate(v, depth + 1, best); });
  return best;
}
// So cùng tháng năm trước (chuỗi {date, value}).
function yoyM(r) { const L = r.at(-1); if (!L) return null; const m = (+L.date.slice(0, 4) - 1) + L.date.slice(4, 7), P = r.find(x => x.date.slice(0, 7) === m); return P && P.value ? (L.value / P.value - 1) * 100 : null; }
function monthAvg(r, f) { const m = new Map(); r.forEach(x => { const k = x.date.slice(0, 7); if (!fin(x[f])) return; const a = m.get(k) || [0, 0]; a[0] += x[f]; a[1]++; m.set(k, a); }); return [...m].map(([k, [s, n]]) => ({m: k, v: s / n})); }
function fbxTile(F) {
  const days = Object.keys(F?.days || {}).filter(d => d <= TODAY && fin(F.days[d].FBX)).sort(), L = days.at(-1); if (!L) return null;
  const wk = new Date(Date.parse(L) - 7 * 864e5).toISOString().slice(0, 10), P = days.filter(d => d <= wk).at(-1), v = F.days[L].FBX;
  return {label: 'Cước container FBX tổng hợp', value: nf(v, 0), unit: 'USD/FEU', delta: P ? pctTxt((v / F.days[P].FBX - 1) * 100, 0, 'so tuần trước') : '', sub: fmt(L) + ' · Freightos', series: days.slice(-30).map(d => F.days[d].FBX), color: '#59C5C8'};
}
function tradeTile(M) {
  const ex = M.exports?.records || [], im = new Map((M.imports?.records || []).map(x => [x.date.slice(0, 7), x.value]));
  const r = ex.filter(x => im.has(x.date.slice(0, 7))).map(x => ({date: x.date, value: x.value + im.get(x.date.slice(0, 7))})), L = r.at(-1); if (!L) return null;
  return {label: 'Xuất nhập khẩu hàng hóa', value: nf(L.value / 1000, 1), unit: 'tỷ USD', delta: pctTxt(yoyM(r), 1, 'so cùng kỳ'), sub: fmt(L.date, 'm') + ' · Hải quan', series: r.slice(-12).map(x => x.value / 1000)};
}

const TABS = {}, SPARKS = [];
const POLK = CFG.POLICY.subs.map(s => s.k);
let polCur = POLK[0];

function style() {
  const st = el('style'); st.id = 'sector-frame4-style';
  st.textContent = `/* Thang chữ (26/11/2026): tiêu đề thẻ 16 · chữ thường 14 · chú thích 12.5; ba màu chữ */
body[data-frame4] .majorpane{--of-t1:#1F2A5C;--of-t2:#3B4256;--of-t3:#6B7392}
body[data-frame4] .majorpane :is(.chart-title,.card>h3,.card>h4,.card .research-detail>h3,.research-fold>summary,.business-model h3,.sectionhead h2.sec){font:700 16px/1.35 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important;letter-spacing:-.005em}
body[data-frame4] .majorpane :is(.business-models>h2,.research-roadmap>h2,.section>h2,.sectionhead h2){font:700 20px/1.3 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important}
body[data-frame4] .majorpane :is(.card p,.card li,.card td,.research-detail p,.business-model p){font-size:14px!important;line-height:1.55!important;color:var(--of-t2)!important}
body[data-frame4] .majorpane :is(.card th,.chart-sub,.note,.source-note,.research-caption,.srcrow,.srcrow a,.pw-src,.card small,.ct-period label,.cts-legend button){font-size:12.5px!important;line-height:1.5!important;color:var(--of-t3)!important}
body[data-frame4] .majorpane .card th{font-weight:600!important}
body[data-frame4] .majorpane :is(.card td b,.card p b){color:var(--of-t1)!important}
body[data-frame4] .majorpane .card [style*="font-size:12.5px"]{font-size:14px!important;color:var(--of-t2)!important}
body[data-frame4] .majorpane .comparison-heading h2{color:#fff!important;background:none!important;box-shadow:none!important}
:root[data-theme=dark] body[data-frame4] .majorpane{--of-t1:#E8EBFA;--of-t2:#C4C9E2;--of-t3:#9AA1BC}
/* Lưới thẻ: Tổng quan, Tài chính › 02, mục văn bản Chính sách */
.of-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}.of-body>*{min-width:0;margin:0!important}
.of-body>.pp-panel{grid-column:1/-1;margin:0!important}.of-body>.of-wide,.of-body>.of-gap,.of-body>details,.of-body>.kpis,.of-body>.research-grid,.of-body>table,.of-body>.tablewrap,.of-body>.of-span{grid-column:1/-1}
.of-body>.card{display:flex;flex-direction:column;align-self:stretch;padding:18px 20px 12px!important}
.of-body .card,.of-body .card *,.pp-panel .card,.pp-panel .card *{min-width:0}.of-body canvas,.pp-panel canvas{max-width:100%!important}
.of-pane .research-roadmap>h2{display:none}
/* Câu hỏi: nhiều thẻ trong một khối thì xếp hai cột, bảng trải hết hàng */
.fr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}.fr-grid>*{min-width:0;margin:0!important}.fr-grid>.fr-wide,.fr-grid>.fsv-heat{grid-column:1/-1}
.pp-main>.card:last-child,.pp-sup1>.card:last-child,.pp-more>.card:last-child{margin-bottom:0}.pp-panel>.of-gap{margin:10px 0 0}
.pp-more{margin-top:12px}
.of-gap{padding:10px 12px;border:1px dashed var(--line,#d6dbe8);border-radius:10px;color:var(--muted,#6b7280);font-size:13px}
.of-rest{display:none!important}.of-hidden-legacy{display:none!important}
.of-next{display:inline-flex;align-items:center;gap:6px;margin:8px 0 0;padding:9px 18px;border:1px solid #C9D0EC;border-radius:999px;background:#fff;color:#2938A8;font:600 13.5px Inter,sans-serif;cursor:pointer;box-shadow:0 1px 2px rgba(31,42,92,.06);transition:.2s}.of-next:hover{background:#2938A8;color:#fff;border-color:#2938A8}
/* Thanh con của Chính sách (như Điện › 06 Chính sách) */
.pp-subnav{display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin;margin:4px 0 14px;padding:4px 2px}
html body .pp-subnav button{flex:0 0 auto;white-space:nowrap;font:500 12.5px/1.2 Inter,system-ui,sans-serif;padding:7px 12px;border-radius:999px;border:1px solid var(--line,#d6dbe8);background:var(--card,#fff);color:var(--ink2,#3b4256);cursor:pointer}
html body .pp-subnav button span{color:var(--muted,#7a8399);margin-right:5px;font-variant-numeric:tabular-nums}
html body .pp-subnav button[aria-selected=true]{background:#E8ECFB;border-color:#2938A8;color:#1D2678;font-weight:700}
:root[data-theme=dark] body .pp-subnav button{background:#161616;border-color:#2A2A2A;color:#C8CCE0}:root[data-theme=dark] body .pp-subnav button[aria-selected=true]{background:#2938A8;color:#fff}
:root[data-theme=dark] .of-next{background:#161616;border-color:#2A2A2A;color:#C8CCE0}
@media (max-width:900px){.of-body,.fr-grid{grid-template-columns:minmax(0,1fr)}}`;
  document.head.append(st);
}

// Lấy một khối: mã thẻ (vt-…) hoặc bộ chọn. Đã dời thì không lấy lần hai (dời, không nhân bản).
const USED = new Set();
function take(sel) {
  const n = new RegExp(`^${CFG.pre}-`).test(sel) ? block(sel) : $(sel);
  if (!n || USED.has(n) || [...USED].some(u => u.contains(n))) return null;
  USED.add(n); n.hidden = false; n.classList.remove('of-hidden-legacy', 'of-span', 'of-wide'); n.style.marginTop = '';
  return n;
}
const tableOnly = n => n.matches?.('.card') && !n.querySelector('canvas,svg,[id^="ch"]') && !!n.querySelector('table');
function group(cls, nodes) {
  const g = el('div', cls); if (nodes.length > 1) g.classList.add('fr-grid');
  nodes.forEach(n => { if (nodes.length > 1 && tableOnly(n)) n.classList.add('fr-wide'); g.append(n); });
  if (nodes.length > 1 && nodes.filter(n => !n.classList.contains('fr-wide') && !n.matches('.fsv-heat')).length % 2) [...g.children].reverse().find(n => !n.classList.contains('fr-wide'))?.classList.add('fr-wide');
  return g;
}
function pickRest(legacy, sec) {
  return legacy.filter(n => !sec.contains(n) && !n.matches?.('.sectionhead,.pane-subtabs,.supply-tabs,[role=tablist]') && (n.matches?.('[data-block-id]') || n.querySelector?.('[data-block-id],canvas,table,svg')));
}
function restFold(items) {
  const d = el('details', 'research-fold of-rest'); const box = el('div', 'research-detail');
  items.forEach(n => { n.hidden = false; box.append(n); }); d.append(el('summary', '', 'Nội dung khác của bố cục cũ'), box); return d;
}
// Một câu hỏi đánh số: .pp-ph (số + câu hỏi) → .pp-main (chart trả lời chính) → .pp-sup1 (chart phụ) → .pp-more (xem thêm).
function question(num, it) {
  // Đúng một chart trong .pp-main, một chart phụ trong .pp-sup1, phần còn lại .pp-more (≥2 thẻ: lưới hai cột) như Dien/app/power-picture.js.
  const all = [...(it.main || []), ...(it.sup || []), ...(it.more || [])].map(take).filter(Boolean); if (!all.length) return null;
  const panel = el('section', 'pp-panel pp-q'); if (it.id) panel.id = it.id;
  panel.innerHTML = `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(it.q)}</h3></div></header>`;
  panel.append(group('pp-main', all.slice(0, 1)));
  if (all[1]) panel.append(group('pp-sup1', all.slice(1, 2)));
  const more = all.slice(2); if (more.length) panel.append(group(more.length > 1 ? 'grid two g2 pp-sup pp-more' : 'pp-sup1 pp-more', more));
  if (it.gap) panel.insertAdjacentHTML('beforeend', GAP(it.gap));
  return panel;
}
function tabBtn(cls, html, id, sub) { const b = el('button', cls, html); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = id; b.dataset.sub = sub; return b; }
function pane(cls, id, sub, b) { const p = el('div', cls); p.id = id; p.dataset.sub = sub; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); return p; }
function keys(nav, btns, i) { btns[i].addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const j = (i + d + btns.length) % btns.length; btns[j].click(); btns[j].focus(); }); }

/* ---------- Tổng quan ngành: .ov-nav ---------- */
function buildOverview() {
  const pn = $('.majorpane[data-tab="mt1"]'); if (!pn) return;
  const legacy = [...pn.children], sec = el('section', 'section of-section');
  const brief = $('#dataBrief'); if (brief) sec.append(brief);
  const nav = el('div', 'ov-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Tổng quan ngành ' + CFG.name); sec.append(nav);
  const subs = CFG.OV.map((s, i) => {
    const num = String(i).padStart(2, '0');
    const b = tabBtn('tabbtn ov-tab', `<span>${num}</span>${esc(s.t)}<small>${esc(s.s)}</small>`, `of-mt1-${s.k}-tab`, s.k);
    const p = pane('pane-subpane ov-pane of-pane', `of-mt1-${s.k}`, s.k, b);
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div>`));
    const body = el('div', 'of-body'); p.append(body);
    let qn = 0; s.items.forEach(it => { const q = question(`${i}.${qn + 1}`, it); if (q) { qn++; body.append(q); } });
    if (!body.children.length) body.insertAdjacentHTML('beforeend', GAP('Chưa có dữ liệu cho mục này.'));
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open('mt1', s.k, true));
    return {k: s.k, b, p, s, body, n: qn, i};
  });
  subs.forEach((x, i) => keys(nav, subs.map(y => y.b), i));
  const rest = pickRest(legacy, sec); if (rest.length) sec.append(restFold(rest));
  pn.replaceChildren(sec);
  TABS.mt1 = subs;
}
// Sau sự kiện khung: bảng "Khung pháp lý chính" (app/sector-legal.js) vào mục đánh số tiếp theo của Bản đồ ngành.
function wrapLegal() {
  (TABS.mt1 || []).filter(x => x.s.legal).forEach(x => { const lm = x.body.querySelector(':scope > .re-legal-map'); if (!lm) return;
    const panel = el('section', 'pp-panel pp-q'); panel.id = `${CFG.pre}-ov-legal`; panel.innerHTML = `<header class="pp-ph"><span class="pp-num">${x.i}.${++x.n}</span><div><h3>${esc(x.s.legal)}</h3></div></header>`;
    lm.before(panel); lm.classList.remove('of-wide'); panel.append(group('pp-main', [lm])); });
}

/* ---------- Bức tranh ngành: .pp-nav, câu hỏi theo khâu ---------- */
function kpiTile(id) {
  const old = document.getElementById(id)?.closest('.kpi'); if (old) { USED.add(old); return old; }
  const f = CFG.KPI[id]; let k = null; try { k = f && f(); } catch (e) { console.error(e); }
  if (!k) return null;
  const t = el('div', 'kpi fr-kpi', `<div class="label">${esc(k.label)}</div><div class="value">${esc(k.value)}${k.unit ? `<span class="unit" style="font-size:12px;font-weight:600;color:var(--muted,#6b7a90);margin-left:6px;letter-spacing:0">${esc(k.unit)}</span>` : ''}</div><div class="delta">${esc(k.delta || '')}</div><div class="sub">${esc(k.sub || '')}</div><div id="${id}"></div>`);
  if ((k.series || []).filter(fin).length > 1) SPARKS.push([id, k.series.filter(fin), k.color || '#2938A8']);
  return t;
}
function asofText(spec, p) {
  const parts = (spec || []).map(([lab, get, kind]) => { let d = ''; try { (get() || []).forEach(o => { d = maxDate(o, 0, d); }); } catch (e) { console.error(e); } return d ? fmt(d, kind) + (lab ? ` (${lab})` : '') : ''; }).filter(Boolean);
  if (!parts.length && p) {
    // Sub-tab chỉ có số tài liệu: lấy "Kỳ cuối" do chính các chart ghi (dòng nguồn, kể cả hộp ⓘ).
    let best = '';
    p.querySelectorAll('.pp-panel [data-block-id]').forEach(c => { let t = c.textContent; c.querySelectorAll('[aria-controls]').forEach(b => { t += ' ' + (document.getElementById(b.getAttribute('aria-controls'))?.textContent || ''); });
      (t.match(/Kỳ cuối:?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/g) || []).forEach(m => { const [, dd, mm, yy] = m.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); const iso = `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`; if (iso <= TODAY && iso > best) best = iso; }); });
    if (best) parts.push(fmt(best) + ' (kỳ cuối tài liệu)');
  }
  return parts.length ? 'Dữ liệu mới nhất: ' + parts.join(' · ') : '';
}
function buildPicture() {
  const pn = $('.majorpane[data-tab="mt2"]'); if (!pn) return;
  const legacy = [...pn.children], sec = el('section', 'section of-section');
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Bức tranh ngành ' + CFG.name); sec.append(nav);
  const all = [...CFG.PICT, {k: 'policy', t: 'Chính sách', d: CFG.POLICY.d, policy: true}];
  const subs = all.map((s, i) => {
    const num = String(i + 1).padStart(2, '0');
    const b = tabBtn('tabbtn pp-tab', `<span>${num}</span>${esc(s.t)}`, `of-mt2-${s.k}-tab`, s.k);
    const p = pane('pp-pane of-pane', `of-mt2-${s.k}`, s.k, b);
    const head = el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div><span class="pp-asof"></span>`);
    p.append(head);
    if (s.policy) buildPolicy(p, head);
    else {
      const g = el('section', 'grid kpis pp-kpis'); (s.kpis || []).forEach(id => { const t = kpiTile(id); if (t) g.append(t); }); if (g.children.length) p.append(g);
      if (s.flow) { const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Luồng ' + s.t.toLowerCase());
        bar.innerHTML = s.flow.map(([id, k, t], j) => `${j ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#${CFG.pre}-st-${s.k}-${id}" class="pp-flow-s"><small>${k}</small><b>${esc(t)}</b></a>`).join(''); p.append(bar); }
      let qn = 0;
      s.items.forEach(it => {
        if (it.grp) { p.append(el('h3', 'pp-grp', esc(it.grp))); return; }
        if (it.stage) { const f = s.flow.find(x => x[0] === it.stage); const h = el('div', 'pp-stage', `<span>${f[1]}</span><h3>${esc(f[2])}</h3>`); h.id = `${CFG.pre}-st-${s.k}-${f[0]}`; p.append(h); return; }
        if (it.link) { const [href, where, t, sub] = it.link; const a = el('a', 'th-link', `<small>Xem chart ở ${esc(where)}</small><b>${esc(t)} →</b>${sub ? `<span>${esc(sub)}</span>` : ''}`); a.href = href; p.append(a); return; }
        const panel = question(`${i + 1}.${qn + 1}`, it); if (panel) { qn++; p.append(panel); }
      });
    }
    const nx = all[i + 1]; if (nx) { const go = el('button', 'of-next', `Tiếp: ${esc(nx.t)} →`); go.type = 'button'; go.addEventListener('click', () => { open('mt2', nx.k, true); nav.scrollIntoView({behavior: 'smooth', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open('mt2', s.k, true));
    return {k: s.k, b, p, head, s};
  });
  subs.forEach((x, i) => keys(nav, subs.map(y => y.b), i));
  const rest = pickRest(legacy, sec); if (rest.length) sec.append(restFold(rest));
  pn.replaceChildren(sec);
  TABS.mt2 = subs;
  subs.forEach(x => { const a = x.s.policy ? x.head.querySelector('.pp-asof').textContent : asofText(x.s.asof, x.p); x.head.querySelector('.pp-asof').textContent = a; });
  SPARKS.splice(0).forEach(([id, v, c]) => { try { if (typeof window.sparkline === 'function') window.sparkline(id, v, c); else if (window.ChartTypes?.spark) ChartTypes.spark(document.getElementById(id), v, c); } catch (e) { console.error(e); } });
}
// Chính sách: thanh con .pp-subnav, mỗi văn bản một mục (#of-mt2-<k> .of-body: app/sector-legal.js gắn tóm tắt, bảng "Mới duyệt").
function buildPolicy(p, head) {
  const recent = (window.SECTOR_LEGAL?.RECENT || []).map(r => String(r[0]).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)).filter(Boolean).map(m => `${m[3]}-${m[2]}-${m[1]}`).filter(d => d <= TODAY).sort().at(-1);
  head.querySelector('.pp-asof').textContent = recent ? `Dữ liệu mới nhất: ${fmt(recent)} (văn bản)` : '';
  const nav = el('nav', 'pp-subnav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Chính sách: văn bản'); p.append(nav);
  const subs = CFG.POLICY.subs.map((s, i) => {
    const b = tabBtn('pp-subtab', `<span>${String(i + 1).padStart(2, '0')}</span>${esc(s.t)}`, `of-mt2-${s.k}-tab`, s.k);
    const q = pane('pol-pane', `of-mt2-${s.k}`, s.k, b); q.dataset.pol = s.k;
    const body = el('div', 'of-body'); q.append(body);
    (s.ids || []).forEach(id => { const n = take(id); if (n) { body.append(n); n.classList.add('of-wide'); } });
    nav.append(b); p.append(q);
    b.addEventListener('click', () => open('mt2', s.k, true));
    return {k: s.k, b, p: q};
  });
  subs.forEach((x, i) => keys(nav, subs.map(y => y.b), i));
  TABS.pol = subs;
}
function openPol(k) {
  const subs = TABS.pol; if (!subs) return; const hit = subs.find(x => x.k === k) || subs[0]; polCur = hit.k;
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
}

/* ---------- Tài chính ngành: .pp-nav 01 Tài chính ngành · 02 Doanh nghiệp niêm yết · (03 Định giá do peer-valuation.js thêm) ---------- */
let finHost = null, finBuilt = false;
function financePane() {
  let pn = $('.majorpane[data-tab="mt14"]');
  if (!pn) { pn = el('section', 'majorpane'); pn.dataset.tab = 'mt14'; pn.id = 'pane-mt14'; pn.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(pn); }
  const sec = el('section', 'section');
  sec.append(el('div', 'sectionhead', `<div><h2 class="sec">Tài chính ngành</h2><p>${esc(CFG.finIntro)}</p></div>`));
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Tài chính ngành'); sec.append(nav);
  const subs = [['fin', 'Tài chính ngành', CFG.FIN.fin], ['companies', 'Doanh nghiệp niêm yết', CFG.FIN.companies]].map(([k, t, d], i) => {
    const num = String(i + 1).padStart(2, '0');
    const b = tabBtn('tabbtn pp-tab', `<span>${num}</span>${esc(t)}`, `of-mt14-${k}-tab`, k);
    const p = pane('pane-subpane pp-pane of-pane', `of-mt14-${k}`, k, b);
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(t)}</h2><p>${esc(d)}</p></div>`));
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open('mt14', k, true));
    return {k, b, p};
  });
  subs.forEach((x, i) => keys(nav, subs.map(y => y.b), i));
  finHost = el('div', 'of-fin'); finHost.id = CFG.finHost; subs[0].p.append(finHost);
  const cb = el('div', 'of-body'); subs[1].p.append(cb);
  const rest = $('.majorpane[data-tab="mt1"] .of-rest');
  let qn = 0; CFG.FIN.items.forEach(it => { const q = question(`2.${qn + 1}`, it); if (q) { qn++; cb.append(q); } });
  if (rest && !rest.querySelector('[data-block-id],canvas,svg,table,.card')) rest.remove();
  if (!cb.children.length) cb.insertAdjacentHTML('beforeend', GAP('Chưa có dữ liệu so sánh doanh nghiệp.'));
  pn.replaceChildren(sec);
  TABS.mt14 = subs;
}
// Dựng số tài chính khi chỗ chứa đã hiện (đo đúng chiều rộng chart).
function finBuild() { if (finBuilt || !finHost || !finHost.offsetParent || !CFG.fin()) return; finBuilt = true; try { CFG.fin().build(finHost); } catch (e) { console.error(e); } }

/* ---------- Mở sub-tab, điều hướng ---------- */
function open(tab, sub, push) {
  const subs = TABS[tab]; if (!subs) return;
  let inner = null;
  if (tab === 'mt2' && POLK.includes(sub)) { inner = sub; sub = 'policy'; }
  sub = CFG.SUBALIAS[tab]?.[sub] || sub;
  if (tab === 'mt14' && sub === 'valuation') { const v = $('#of-mt14-valuation-tab'); if (v) { v.click(); return; } }
  const hit = subs.find(x => x.k === sub) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.classList.toggle('active', on); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; x.p.style.display = ''; });
  if (tab === 'mt14') { const v = $('#of-mt14-valuation'); if (v) { v.hidden = true; v.style.display = 'none'; $('#of-mt14-valuation-tab')?.setAttribute('aria-selected', 'false'); $('#of-mt14-valuation-tab')?.classList.remove('active'); } setTimeout(finBuild, 30); }
  if (hit.k === 'policy') openPol(inner || polCur);
  if (push) { const u = new URL(location.href); u.searchParams.set('sub', hit.k === 'policy' ? polCur : hit.k); u.hash = tab; history.replaceState(null, '', u.pathname + u.search + u.hash); }
  refit();
}
function refit() {
  [30, 300, 900, 1800].forEach(t => setTimeout(() => { window.dispatchEvent(new Event('resize')); $$('.majorpane:not([hidden]) canvas').forEach(c => { const ch = window.Chart?.getChart?.(c); if (ch && c.offsetParent) ch.resize(); }); }, t));
}
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
const valid = (tab, sub) => !!sub && (!!TABS[tab]?.some(x => x.k === sub) || (tab === 'mt2' && POLK.includes(sub)) || !!CFG.SUBALIAS[tab]?.[sub] || (tab === 'mt14' && sub === 'valuation'));
let selectTab = () => {};
// Tab + sub-tab từ link (kể cả link cũ của khung 5 tab).
function route(tab, sub, push) {
  tab = String(tab || '').replace(/^#/, '');
  if (CFG.ALIAS[tab]) { const [t, s] = CFG.ALIAS[tab]; tab = t; if (!valid(t, sub)) sub = s; }
  const x = CFG.XSUB[tab]?.[sub]; if (x) [tab, sub] = x;
  if (!ROUTES.some(r => r[0] === tab)) tab = 'mt1';
  selectTab(tab, push);
  if (TABS[tab]) open(tab, valid(tab, sub) ? sub : (TABS[tab].find(y => y.b.getAttribute('aria-selected') === 'true')?.k || TABS[tab][0].k), push);
}
function nav() {
  const bar = $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  selectTab = (key, push) => {
    $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
    [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    if (key === 'mt14') setTimeout(finBuild, 30);
    if (push) { const u = new URL(location.href); if (!TABS[key]) u.searchParams.delete('sub'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
    refit();
  };
  ROUTES.forEach(([key, label], i) => {
    const b = el('button', 'majortabbtn', label); b.type = 'button'; b.dataset.tab = key; b.id = 'research-tab-' + key; b.setAttribute('role', 'tab');
    const p = $(`.majorpane[data-tab="${key}"]`); if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); }
    b.addEventListener('click', () => { selectTab(key, true); if (TABS[key] && !(key === 'mt14' && $('#of-mt14-valuation-tab')?.getAttribute('aria-selected') === 'true')) { const cur = TABS[key].find(y => y.b.getAttribute('aria-selected') === 'true'); open(key, cur ? (cur.k === 'policy' ? polCur : cur.k) : TABS[key][0].k, true); } window.scrollTo({top: 0, behavior: 'instant'}); });
    b.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? ROUTES.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : ROUTES.length - 1)) % ROUTES.length; bar.children[j].click(); bar.children[j].focus(); });
    bar.append(b);
  });
  window.showMajorTab = k => route(k, null, true);
  window.addEventListener('hashchange', () => route(location.hash.slice(1), new URL(location.href).searchParams.get('sub')));
  route(location.hash.slice(1) || 'mt1', new URL(location.href).searchParams.get('sub'));
  // Link trỏ vào khối đã dời (câu hỏi, khâu, thẻ): mở đúng tab lớn + sub-tab rồi cuộn tới.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a || a.closest('.re-lg-go')) return;
    const t = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); if (!t || t.matches('.majorpane')) return;
    const pn = t.closest('.majorpane'); if (!pn) return; e.preventDefault();
    const pol = t.closest('.pol-pane'), sub = t.closest('.of-pane');
    selectTab(pn.dataset.tab, true); if (pol) open('mt2', pol.dataset.pol, true); else if (sub) open(pn.dataset.tab, sub.dataset.sub, true);
    setTimeout(() => { if (t.tagName === 'DETAILS') t.open = true; t.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 120);
  });
}
// Thanh sub-tab dính ngay dưới thanh tab chính khi cuộn (biến --of-top dùng trong sector-frame.css).
function stickySub() {
  const set = () => { const m = $('nav.majortabs') || $('.majortabs'); if (!m) return; const cs = getComputedStyle(m); const top = cs.position === 'sticky' && innerWidth > 700 ? (parseFloat(cs.top) || 0) + m.offsetHeight + 4 : 0; document.documentElement.style.setProperty('--of-top', top + 'px'); };
  set(); window.addEventListener('resize', set); setTimeout(set, 1500);
}

function run() {
  if (document.body.dataset[CFG.flag]) return; document.body.dataset[CFG.flag] = '1'; document.body.dataset.frame4 = '1';
  style();
  stickySub();
  // Ô số đang ở #mt1: đưa về #mt2 trước khi dựng (Bức tranh ngành lấy từng ô theo id).
  const k = $('.majorpane[data-tab="mt1"] .kpis'), m2 = $('.majorpane[data-tab="mt2"]'); if (k && m2) m2.prepend(k);
  buildOverview();
  buildPicture();
  financePane();
  ['mt1', 'mt2', 'mt14'].forEach(t => { if (TABS[t]) open(t, TABS[t][0].k); });  // mỗi tab luôn có đúng một sub-tab đang mở
  nav();
  CFG.extra?.();
  window.dispatchEvent(new Event(CFG.event));
  wrapLegal();
}
if (window.SectorBoot) SectorBoot.add(1600, run);
else { const start = () => setTimeout(run, 1700); if (document.readyState === 'complete') start(); else window.addEventListener('load', start); }
})();
