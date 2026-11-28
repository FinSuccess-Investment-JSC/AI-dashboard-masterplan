/* Bia · cấu hình dashboard (tách khỏi Bán lẻ 26/11/2026). Số tài liệu có dòng trong data/beer/evidence.json. */
(() => {
const C = {navy: '#2938A8', teal: '#59C5C8', plum: '#861C52', gold: '#c29100', grey: '#6b7686', red: '#d1583f', green: '#27af95'};
const TTDB = ['VnEconomy · Luật Thuế TTĐB 2025', 'https://vneconomy.vn/thue-tieu-thu-dac-biet-ruou-va-bia-tang-den-90-vao-nam-2031.htm'];
const SAB = ['Sabeco qua DN&PL', 'https://doanhnhan.baophapluat.vn/sabeco-sab-thu-hon-2-480-ty-dong-lai-sau-thue-nua-dau-nam-2026-hoan-thanh-50-ke-hoach.html'];
// "Dữ liệu mới nhất" từng sub-tab (28/11/2026, khung chuẩn Điện): đọc kỳ cuối của chính dữ liệu đã nạp trên trang, không lấy ngày build.
// Trả 'yyyy-mm' (tháng), 'yyyy-mm-dd' (ngày) hoặc chuỗi kỳ (Q3/2026, 6T/2026, năm 2025); pkg-frame.js định dạng.
const RP = () => window.RETAIL_PUBLIC?.blocks || {};
const lastMonth = keys => keys.map(k => (RP().macro?.series?.[k] || RP().commodity?.series?.[k])?.records?.at(-1)?.date).filter(Boolean).sort().at(-1)?.slice(0, 7);
const bmLast = metrics => { const p = (window.BEER_MARKET?.observations || []).filter(o => metrics.includes(o.metric)).map(o => o.period).sort().at(-1); return !p ? '' : /H1$/.test(p) ? '6T/' + p.slice(0, 4) : 'năm ' + p; };
const finLast = key => { const p = window[key]?.periods?.at(-1); return p ? 'Q' + p.slice(-1) + '/' + p.slice(0, 4) : ''; };
const lastMilestone = id => { const d = (window.PKG.charts.find(c => c.id === id)?.items || []).map(x => x.d).sort().at(-1); return d ? 'mốc ' + d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : ''; };
const valDate = () => { const V = window.COMPANY_VALUATION?.companies || {}; return (window.BEER_FIN?.companies || []).map(c => V[c.ticker]?.date).filter(Boolean).sort().at(-1) || ''; };
// Tài chính ngành › 03 Định giá: app/peer-valuation.js (data-auto) tìm #of-mt14-valuation .of-body rồi vẽ 4 chart vào đó.
const valHost = () => { const h = document.createElement('div'); h.id = 'of-mt14-valuation'; h.className = 'rf-wide'; h.innerHTML = '<div class="of-body"></div>'; return h; };
window.PKG = {
  key: 'beer', prefix: 'bia', label: 'Bia',
  wide: ['bia-01', 'bia-05', 'bia-52', 'bia-53', 'bia-60', 'bia-02', 'bia-74', 'bia-82', 'bia-85', 'bia-86', 'bia-77'],
  kpis: [
    {spark: 'spk-beer', series: 'beer_output', unit: 'triệu lít', digits: 0},
    {spark: 'spk-iipb', series: 'iip_bev', pct: true, signed: true, note: 'IIP đồ uống so cùng kỳ', color: '#c29100'},
    {spark: 'spk-cpib', series: 'cpi_bev_yoy', pct: true, signed: true, note: 'CPI đồ uống & thuốc lá', color: '#d1583f'},
    {spark: 'spk-pe', pe: '120', label: 'Bia'},
    // 28/11/2026: ô số sub-tab Doanh nghiệp (BCTC hợp nhất quý, cùng nguồn chart biên gộp bia-20).
    {spark: 'spk-gm-sab', cq: 'SAB', field: 'gross_margin', note: 'biên gộp SAB', color: '#c29100'},
    {spark: 'spk-gm-bhn', cq: 'BHN', field: 'gross_margin', note: 'biên gộp BHN'},
    {spark: 'spk-nm-sab', cq: 'SAB', field: 'net_margin', note: 'LNST ÷ doanh thu thuần SAB', color: '#59C5C8'},
  ],
  charts: [
    {id: 'chBeerChain', type: 'html', src: [['FinSuccess tự tổng hợp', '#rf-q-model']],
      method: 'Số nhà máy, công suất và cơ cấu tiêu thụ theo phân khúc năm 2023 là của SAB (FinSuccess tự tổng hợp).',
      render: esc => `<div class="dc dc-beer">
  <div class="dc-band dc-band4"><span class="dc-b dc-b1">Đầu vào</span><span class="dc-b dc-b2">Sản xuất</span><span class="dc-b dc-b3">Đầu ra</span><span class="dc-b dc-b4">Phân phối</span></div>
  <div class="dc-cols dc-cols4">
    <section class="dc-col"><h4>Nguyên liệu</h4>
      <div class="dc-card"><b>Malt, hoa bia, men bia</b><small>Chủ yếu nhập khẩu từ châu Âu, Mỹ và Úc</small></div>
      <div class="dc-card"><b>Gạo</b><small>Chủ yếu từ nguồn nội địa</small></div>
    </section>
    <section class="dc-col"><h4>Nhà máy</h4>
      <p class="dc-num"><b>26</b> nhà máy · tổng công suất <b>2,4 tỷ lít/năm</b> (SAB)</p>
      <ul class="dc-steps-v"><li>Nấu nguyên liệu thô</li><li>Đường hóa</li><li>Lên men</li><li>Lọc trong bia</li><li class="dc-end">Đóng gói</li></ul>
    </section>
    <section class="dc-col"><h4>Bia thành phẩm</h4>
      <p class="dc-lbl">Cơ cấu tiêu thụ bia theo phân khúc của SAB năm 2023</p>
      <div class="dc-pie-w"><div class="dc-pie" role="img" aria-label="Phân khúc trung cấp 97%, phân khúc cao cấp 3%" style="background:conic-gradient(#C9CDD6 0 3%, #1D2678 3% 100%)"></div>
        <ul class="dc-leg dc-leg-v"><li><i style="background:#1D2678"></i>Phân khúc trung cấp <b>97%</b></li><li><i style="background:#C9CDD6"></i>Phân khúc cao cấp <b>3%</b></li></ul></div>
    </section>
    <section class="dc-col"><h4>Kênh bán</h4>
      <div class="dc-card"><b>On-trade</b><small>Nhà hàng, quán ăn…</small></div>
      <div class="dc-card"><b>Off-trade</b><small>Siêu thị, cửa hàng tiện lợi…</small></div>
    </section>
  </div>
</div>`},
    {id: 'chBeerModels', type: 'models', items: [
      ['Hãng bia lớn, thương hiệu toàn quốc', 'SAB · BHN', 'Bia Sài Gòn, 333 (SAB); Bia Hà Nội (BHN); bán qua đại lý cấp 1 tới nhà hàng, tạp hóa, siêu thị', 'Giá malt, nhôm; thuế TTĐB; giá bán và sản lượng; chi phí bán hàng, quảng cáo', [['#rf-q-output', 'Sản lượng'], ['#rf-q-sintax', 'Thuế TTĐB'], ['#rf-q-gm', 'Biên gộp']]],
      ['Nhà máy bia vùng', 'SMB · HAD', 'Sản xuất bia theo nhãn của hãng lớn (Bia Sài Gòn, Bia Hà Nội) cho thị trường miền Trung, miền Bắc', 'Sản lượng đặt hàng từ hãng, giá gia công, chi phí nguyên liệu', [['#rf-q-gm', 'Biên gộp'], ['#rf-q-rev', 'Doanh thu, lợi nhuận']]]],
      src: [['BCTC và báo cáo thường niên doanh nghiệp', '#rf-q-compare']]},
    {id: 'chBeer', type: 'series', base: 'beer_output', series: [['Bia', 'beer_output', C.gold, 'bar']], unit: 'triệu lít', tableUnit: 'triệu lít', digits: 0, table: 'tbl-beer', src: ['nso'],
      method: 'Sản lượng sản xuất công nghiệp toàn ngành (NSO), không phải sản lượng bán ra của SAB hay BHN.',
      insight: 'Sản lượng sản xuất toàn ngành phản ánh cầu và mức chạy máy trước các mốc thuế. Kiểm tiếp sản lượng tháng 12–1 quanh mốc thuế TTĐB 70% (1/1/2027) để tách phần sản xuất kéo trước.'},
    {id: 'chBeerIip', type: 'series', base: 'iip_bev', series: [['IIP sản xuất đồ uống', 'iip_bev', C.gold, 'line', 'raw'], ['IIP chế biến thực phẩm', 'iip_food', C.navy, 'line', 'raw']], unit: '%', digits: 1, zeroBase: false, table: 'tbl-beer-iip', src: ['nso'],
      method: 'Chỉ số sản xuất công nghiệp, % so cùng kỳ (NSO). Đồ uống gồm bia, nước giải khát, rượu.',
      insight: 'IIP là chỉ số sản xuất, không phải doanh thu; dùng để thấy nhịp chạy máy của nhóm đồ uống so với thực phẩm. Kiểm tiếp IIP đồ uống quý I/2027 sau mốc thuế mới.'},
    {id: 'chBeerCpi', type: 'series', base: 'cpi_bev_yoy', series: [['CPI đồ uống & thuốc lá', 'cpi_bev_yoy', C.red, 'line', 'raw'], ['CPI chung', 'cpi_yoy', C.navy, 'line', 'raw']], unit: '%', digits: 1, zeroBase: true, table: 'tbl-beer-cpi', src: ['nso'],
      method: 'CPI so cùng kỳ (NSO). Nhóm đồ uống & thuốc lá là chỉ báo gián tiếp của giá bán bia, gồm cả hàng khác.',
      insight: 'Khi CPI nhóm đồ uống tăng nhanh hơn CPI chung, doanh nghiệp đang chuyển được thuế và chi phí vào giá bán. Kiểm tiếp nhóm này tháng 1–2/2027 khi bậc thuế 70% áp dụng.'},
    {id: 'chBeerTourist', type: 'series', base: 'tourists', series: [['Khách quốc tế', 'tourists', C.teal, 'bar', 'raw', 1000]], unit: 'triệu lượt', tableUnit: 'triệu lượt', digits: 2, table: 'tbl-beer-tourist', src: ['nso'],
      method: 'Tổng khách quốc tế đến Việt Nam (NSO). Chỉ báo cầu cho kênh nhà hàng, quán (on-trade).',
      insight: 'Khách quốc tế đi vào sản lượng bia qua kênh nhà hàng, quán, nơi giá bán cao hơn kênh siêu thị. Kiểm tiếp mùa cao điểm quý IV–quý I.'},
    {id: 'chBeerGM', type: 'margin', syms: [['SAB', C.gold], ['BHN', C.navy], ['SMB', C.teal], ['HAD', C.plum]], table: 'tbl-beer-gm', src: ['cq'],
      method: 'Biên = lãi gộp (lãi ròng) ÷ doanh thu thuần, BCTC hợp nhất quý từng mã. Doanh thu bia thường đã trừ thuế TTĐB.',
      insight: 'Biên gộp bia phản ánh giá malt, nhôm đã mua và phần thuế TTĐB không chuyển được vào giá. Kiểm tiếp biên gộp quý I/2027 sau mốc thuế 70%.'},
    {id: 'chBeerRev', type: 'revenue', syms: [['SAB', C.gold], ['BHN', C.navy], ['SMB', C.teal], ['HAD', C.plum]], table: 'tbl-beer-rev', src: ['cq'],
      method: 'BCTC hợp nhất quý từng mã, đặt cạnh nhau, không cộng (các mã có quan hệ sở hữu, sản xuất theo nhãn của nhau).',
      insight: 'Doanh thu quý đi theo mùa vụ (cao nhất quanh Tết) và sản lượng; lợi nhuận còn phụ thuộc chi phí bán hàng, quảng cáo. Kiểm tiếp quý IV và quý I/2027.'},
    {id: 'chSinTax', type: 'bars', categories: ['2026', '2027', '2028', '2029', '2030', '2031'], series: [['Bia', [65, 70, 75, 80, 85, 90], C.gold]], unit: '%', digits: 0, src: [TTDB], period: '2026–2031',
      method: 'Thuế suất theo Luật Thuế TTĐB 2025 (hiệu lực 1/1/2026): bia 65% năm 2026, tăng 5 điểm %/năm đến 90% năm 2031. Thuế TTĐB tính trên giá bán của cơ sở sản xuất, nên giá bán lẻ cuối cùng tăng ít hơn mức tăng thuế suất.',
      insight: 'Mỗi bậc thuế buộc doanh nghiệp chọn giữa tăng giá (mất sản lượng) và giữ giá (mất biên). Kiểm tiếp giá bán lẻ bia đầu năm 2027 và sản lượng tháng 1–2 so cùng kỳ.'},
    {id: 'beerTimeline', type: 'timeline', items: [
      {d: '2026-01-01', name: 'Luật Thuế TTĐB 2025', st: 'Đã ban hành', what: 'Bia 65% năm 2026, +5 điểm %/năm đến 90% năm 2031', who: 'SAB · BHN · SMB · HAD', v: 'Giá bán, sản lượng, biên gộp', url: TTDB[1]},
      {d: '2026-01-01', name: 'Lương tối thiểu vùng (NĐ 293/2025)', st: 'Đã ban hành', what: '+7,2%; vùng I 5.310.000 đ/tháng', who: 'Cả ngành', v: 'Sức mua · chi phí nhân công', url: 'https://nhadautu.vn/chinh-thuc-tang-luong-toi-thieu-vung-tu-1-1-2026-d100632.html'},
      {d: '2026-12-31', label: 'hết 31/12/2026', name: 'Hết giảm 2% VAT (NQ Quốc hội 17/6/2025)', st: 'Đã ban hành', what: 'Từ 1/1/2027 nhiều hàng hóa, dịch vụ trở lại 10%', who: 'Cả ngành', v: 'Giá bán cuối cùng', url: 'https://baodauthau.vn/quoc-hoi-thong-qua-giam-2-thue-vat-voi-nhieu-hang-hoa-dich-vu-den-het-nam-2026-post180339.html'},
      {d: '2027-01-01', name: 'Thuế TTĐB bia bậc 70%', st: 'Đã ban hành', what: 'Bậc thứ hai của lộ trình (65% → 70%)', who: 'SAB · BHN · SMB · HAD', v: 'Giá bán, sản lượng quý I/2027', url: TTDB[1]}],
      method: 'Mốc là ngày hiệu lực; "hết 31/12/2026" là ngày cuối còn hiệu lực.'},
    {id: 'chBeerPE', type: 'val', ids: [['120', 'Bia (SAB)', C.gold]], table: 'tbl-beer-pe', src: ['vnd'],
      method: 'Rổ "Bia" của VNDirect (SAB). P/E = vốn hóa ÷ lợi nhuận 4 quý. Vẽ mỗi 5 phiên.',
      insight: 'P/E bia đọc cùng lộ trình thuế: thị trường thường chiết khấu trước các bậc thuế dù lợi nhuận hiện tại còn tốt. Kiểm tiếp lợi nhuận quý I/2027.'},
    {id: 'chBeerPlan', type: 'tiles', items: [['Kế hoạch 2026 · SAB', '28.959 / 4.937 tỷ', 'doanh thu / LNST (+8%); cổ tức 5.000 đ/cp'], ['Kết quả 6T/2026 · SAB', '2.489 tỷ LNST', '+21% so cùng kỳ · 50% kế hoạch'], ['Biên gộp 6T/2026 · SAB', '37,98%', 'cùng kỳ 34,24%; tăng giá 3 đợt (T4, T5, T7)']],
      src: [SAB, ['Mekong ASEAN', 'https://mekongasean.vn/bien-loi-nhuan-gop-cua-sabeco-cai-thien-manh-57663.html']], method: 'Số doanh nghiệp công bố, kỳ ghi ở từng ô. SAB có hai số kế hoạch 2026 lệch nhau giữa các báo; ô dùng số ĐHĐCĐ.'},
  ],
  sourceManual: [[/^Chuỗi giá trị ngành bia/, 'FinSuccess tổng hợp']],
  topics: {'bia-t1': ['Giá bán, sản lượng bia; biên gộp SAB, BHN', 'Giá bán lẻ bia tháng 1/2027, sản lượng tháng 1–2, IIP đồ uống', [['#rf-q-sintax', 'Lộ trình thuế suất'], ['#rf-q-output', 'Sản lượng bia'], ['#rf-q-gm', 'Biên gộp']]]},
  // 28/11/2026 (khung chuẩn Điện, DASHBOARD_WORKFLOW §42): link cũ của bố cục 6 sub-tab (Tác động tới doanh nghiệp, Biên lợi nhuận gộp thành 04 Doanh nghiệp).
  alias: {mt6: ['mt14', 'listed'], mt9: ['mt14', 'sector']},
  section: {tax: ['mt2', 'policy'], demand: ['mt2', 'all'], margin: ['mt2', 'firm', 'rf-q-gm'], impact: ['mt2', 'firm', 'rf-q-impact'], valuation: ['mt14', 'valuation'], pe: ['mt14', 'listed', 'rf-q-pe']},
  subAlias: {'mt2/impact': ['mt2', 'firm'], 'mt2/margin': ['mt2', 'firm'], 'mt14/pe': ['mt14', 'listed']},
  tree: {
    mt1: {title: 'Tổng quan ngành', subs: [
      {k: 'map', t: 'Bản đồ ngành', sub: 'Malt, gạo → nhà máy → kênh bán', d: 'Malt, nhôm → nấu bia → kênh nhà hàng, siêu thị → biên sau thuế TTĐB.', items: [
        {q: 'Bia đi qua những khâu nào trước khi thành lợi nhuận?', id: 'rf-q-map', take: ['bia-01']}]},
      {k: 'model', t: 'Mô hình kiếm tiền', sub: 'Hãng toàn quốc · nhà máy vùng', d: 'Hãng bia lớn và nhà máy vùng kiếm tiền khác nhau thế nào.', items: [
        {q: 'Mỗi nhóm kiếm tiền từ đâu, biến nào quyết định biên?', id: 'rf-q-model', take: ['bia-05']}]},
      {k: 'thesis', t: 'Luận điểm đầu tư', sub: 'Kênh, thị phần, bao bì, thuế', d: 'Kênh tiêu thụ, thị phần, cơ cấu sản phẩm và thuế đi vào sản lượng, biên lợi nhuận doanh nghiệp thế nào.', items: [
        {q: 'Luận điểm chính về ngành bia là gì, cần kiểm gì tiếp?', id: 'rf-q-thesis', take: ['bia-02']}]},
    ]},
    // Bức tranh ngành: 01 Toàn ngành → từng khâu (kênh & bao bì, thị phần, doanh nghiệp) → Chính sách cuối. Ngày dữ liệu đọc kỳ cuối của chính chuỗi trong sub-tab.
    mt2: {title: 'Bức tranh ngành', subs: [
      {k: 'all', t: 'Toàn ngành: sản lượng & cầu', d: 'Ngành bia đang sản xuất và bán nhiều hơn hay ít hơn? Sản lượng, chỉ số sản xuất, giá đồ uống và khách quốc tế.', kpis: ['spk-beer', 'spk-iipb', 'spk-cpib', 'spk-pe'],
        asof: () => lastMonth(['beer_output', 'iip_bev', 'cpi_bev_yoy', 'tourists']), items: [
        {q: 'Sản lượng bia đang tăng hay giảm?', id: 'rf-q-output', meta: '<b>sản lượng sản xuất</b> (NSO) toàn ngành · bảng nhiệt % so cùng kỳ · chỉ số sản xuất IIP', main: ['bia-10'], sup: ['bia-11'], more: ['.fsv-heat']},
        {q: 'Giá đồ uống có tăng nhanh hơn giá chung?', id: 'rf-q-demand', meta: 'CPI % so cùng kỳ (NSO) · nhóm đồ uống & thuốc lá là chỉ báo gián tiếp của giá bia', take: ['bia-12']},
        {q: 'Khách quốc tế đang kéo cầu kênh nhà hàng, quán lên hay xuống?', id: 'rf-q-tourist', meta: 'triệu lượt · theo tháng (NSO)', take: ['bia-13']}]},
      {k: 'channel', t: 'Kênh tiêu thụ & bao bì', d: 'Bia lon tăng nhanh hơn bia chai, bia hơi bao nhiêu, và người tiêu dùng chuyển từ uống tại chỗ sang mua mang về tới đâu?', kpis: ['spk-off', 'spk-offchg', 'spk-offcagr', 'spk-oncagr'],
        asof: () => bmLast(['production', 'volume']),
        flow: [['prod', 'Sản xuất', 'Bia lon, bia chai, bia hơi'], ['out', 'Đầu ra', 'Uống tại chỗ hay mua mang về'], ['why', 'Kiểm cơ chế', 'Mang về tăng thật hay tại chỗ giảm']], items: [
        {stage: 'prod'},
        {q: 'Bia lon đang tăng nhanh hơn bia chai và bia hơi bao nhiêu?', id: 'rf-q-pack', meta: '<b>sản lượng sản xuất</b> theo chủng loại, lũy kế 6 tháng · không phải tiêu thụ', main: ['bia-74'], sup: ['bia-75'], more: ['bia-76']},
        {stage: 'out'},
        {q: 'Người tiêu dùng chuyển từ uống tại chỗ sang mua mang về tới đâu?', id: 'rf-q-channel', meta: '% và triệu lít · sản lượng tiêu thụ theo kênh, Euromonitor', main: ['bia-70'], sup: ['bia-71']},
        {stage: 'why'},
        {q: 'Mua mang về tăng thật, hay do uống tại chỗ giảm?', id: 'rf-q-channel-why', meta: 'chỉ số 2019 = 100 · cầu nối sản lượng', main: ['bia-72'], sup: ['bia-73']}]},
      {k: 'share', t: 'Thị phần & cạnh tranh', d: 'Hãng nào đang giành, hãng nào đang mất thị phần, ở toàn thị trường, ở kênh mua mang về và theo thương hiệu.', kpis: ['spk-cr2', 'spk-cr4', 'spk-gap', 'spk-offsab'],
        asof: () => bmLast(['company_share', 'brand_share']),
        flow: [['all', 'Toàn thị trường', 'Thị phần theo chủ sở hữu thương hiệu'], ['off', 'Kênh mang về', 'Vị thế Sabeco ở siêu thị, tạp hóa'], ['brand', 'Thương hiệu', 'Nhãn đang lên, nhãn đi xuống']], items: [
        {stage: 'all'},
        {q: 'Hãng bia nào đang giành hoặc mất thị phần?', id: 'rf-q-share', meta: '% sản lượng toàn thị trường, theo chủ sở hữu thương hiệu', main: ['bia-78'], sup: ['bia-77'], more: ['bia-79']},
        {stage: 'off'},
        {q: 'Ở kênh mua mang về, Sabeco mất vị thế đến đâu?', id: 'rf-q-offshare', meta: 'chỉ hai mốc có số · không nội suy năm giữa', main: ['bia-80'], sup: ['bia-81']},
        {stage: 'brand'},
        {q: 'Thương hiệu nào đang lên, thương hiệu nào đi xuống?', id: 'rf-q-brand', meta: '% sản lượng toàn thị trường theo thương hiệu', main: ['bia-84'], sup: ['bia-82'], more: ['bia-83']}]},
      // 28/11/2026: gộp hai sub-tab một câu hỏi (Tác động tới doanh nghiệp, Biên lợi nhuận) thành một khâu Doanh nghiệp; ô số biên đọc COMPANY_QUARTERLY như chart bia-20.
      {k: 'firm', t: 'Doanh nghiệp: sản lượng → biên', d: 'Thị phần và kênh đi vào sản lượng, doanh thu của SAB, BHN thế nào, và biên gộp từng hãng đang mở rộng hay thu hẹp?', kpis: ['spk-gm-sab', 'spk-gm-bhn', 'spk-nm-sab'],
        asof: () => window.COMPANY_QUARTERLY?.quarters?.at(-1),
        flow: [['vol', 'Đầu vào', 'Thị phần, kênh → sản lượng doanh nghiệp'], ['margin', 'Đầu ra', 'Biên gộp, biên ròng từng hãng']], items: [
        {stage: 'vol'},
        {q: 'Mất 1 điểm % thị phần thì sản lượng, lợi nhuận đổi bao nhiêu?', id: 'rf-q-impact', meta: 'phân tích kịch bản, không phải dự báo · chuỗi tác động thị trường → lợi nhuận', main: ['bia-86'], sup: ['bia-85']},
        {stage: 'margin'},
        {q: 'Biên gộp từng doanh nghiệp đang mở rộng hay thu hẹp?', id: 'rf-q-gm', meta: '% · BCTC hợp nhất quý từng mã', take: ['bia-20'],
          after: 'Chưa có chuỗi giá malt, lúa mạch, nhôm lon từ nguồn công khai nên chưa đặt giá đầu vào cạnh biên gộp. Chỉ báo cần kiểm: giá malt, nhôm LME, tỷ giá USD/VND, giá bán bình quân sau các đợt tăng giá.'}]},
      {k: 'policy', t: 'Chính sách & thuế', d: 'Mốc nào có thể đổi giá bán, sản lượng hoặc chi phí? Lộ trình thuế TTĐB và các mốc hiệu lực.', asof: () => lastMilestone('beerTimeline'), items: [
        {q: 'Thuế suất tiêu thụ đặc biệt đi lên theo lộ trình nào?', id: 'rf-q-sintax', meta: '% thuế suất theo năm · thuế suất ≠ mức tăng giá bán', take: ['bia-53']},
        {q: 'Mốc nào có thể đổi giá bán, sản lượng hoặc chi phí?', id: 'rf-q-policy', meta: '● đã ban hành · ○ dự thảo · ngày hiệu lực', take: ['bia-52']}]},
    ]},
    // 28/11/2026 (khung chuẩn Điện/Chăn nuôi): 01 Tài chính ngành = chỉ số cộng gộp BCTC quý (app/beer-finance.js, window.BEER_FIN từ scripts/build_beer_financials.py)
    // · 02 Doanh nghiệp niêm yết = từng mã, P/E rổ cuối cùng · 03 Định giá = app/peer-valuation.js gắn vào #of-mt14-valuation.
    mt14: {title: 'Tài chính ngành', subs: [
      {k: 'sector', t: 'Tài chính ngành', d: 'Kết quả kinh doanh, biên, CAPEX, vốn lưu động, nợ vay và tỷ suất sinh lời cộng gộp từ BCTC hợp nhất quý của 12 mã bia niêm yết (loại trùng công ty mẹ – con).',
        asof: () => finLast('BEER_FIN'), items: [{html: () => { const h = document.createElement('div'); h.id = 'bia-fin-root'; h.className = 'bia-fin-host rf-wide'; return h; }}]},
      {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'Doanh thu, lợi nhuận từng mã; bảng so sánh, kế hoạch và kết quả 2026; định giá rổ bia.', asof: () => window.COMPANY_QUARTERLY?.quarters?.at(-1), items: [
        {q: 'Doanh thu và lợi nhuận từng doanh nghiệp đi thế nào?', id: 'rf-q-rev', meta: 'nghìn tỷ đồng · hợp nhất quý từng mã, không cộng', take: ['bia-06']},
        {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'rf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ', take: ['.financial-comparison']},
        {q: 'Doanh nghiệp đã đi được bao nhiêu so với kế hoạch 2026?', id: 'rf-q-plan', take: ['bia-60']},
        {q: 'Thị trường định giá cổ phiếu bia ở mức nào?', id: 'rf-q-pe', meta: 'lần · rổ "Bia" VNDirect (SAB)', take: ['bia-03']}]},
      {k: 'valuation', t: 'Định giá', d: 'P/B so với ROE, biên gộp so với ROE, lợi suất lợi nhuận và bội số dòng tiền giữa các mã bia.', asof: () => valDate(), items: [
        {q: 'Mã bia nào đang rẻ hay đắt so với khả năng sinh lời?', id: 'rf-q-val', meta: 'P/E, P/B theo phiên (VNDirect) · số tài chính TTM từ BCTC hợp nhất quý', after: valHost}]},
    ]},
  },
};
})();
