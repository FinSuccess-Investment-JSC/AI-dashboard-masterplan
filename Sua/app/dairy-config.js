/* Sữa · cấu hình dashboard (tách khỏi Bán lẻ 26/11/2026). Số tài liệu có dòng trong data/dairy/evidence.json. */
(() => {
const C = {navy: '#2938A8', teal: '#59C5C8', plum: '#861C52', gold: '#c29100', grey: '#6b7686', red: '#d1583f', green: '#27af95'};
const DNPL_VNM = ['Vinamilk qua DN&PL', 'https://doanhnhan.baophapluat.vn/vinamilk-vnm-bao-lai-nua-dau-nam-2026-tang-manh-38-xuat-khau-dong-vai-tro-diem-sang.html'];
window.PKG = {
  key: 'dairy', prefix: 'sua', label: 'Sữa',
  wide: ['sua-01', 'sua-05', 'sua-50', 'sua-52', 'sua-60'],
  kpis: [
    {spark: 'spk-milk', series: 'milk_output', unit: 'triệu lít', digits: 0},
    {spark: 'spk-mp', series: 'milkpowder_output', unit: 'nghìn tấn', digits: 1},
    {spark: 'spk-wmp', series: 'wmp', unit: 'USD/tấn', digits: 0, ytd: false, color: C.red},
    {spark: 'spk-pe', pe: '239', label: 'Sữa'},
  ],
  charts: [
    {id: 'chDairyChain', type: 'html', src: [['FinSuccess tự tổng hợp', '#rf-q-model']],
      method: 'Số trang trại, hộ chăn nuôi, nhà máy, tỷ trọng nhập khẩu sữa bột theo nước, cơ cấu doanh thu theo loại sữa năm 2023 và số thị trường xuất khẩu: FinSuccess tự tổng hợp. Cơ cấu doanh thu là của toàn thị trường sữa Việt Nam, không phải của một doanh nghiệp.',
      render: esc => {
        const box = t => `<span class="dc-box">${esc(t)}</span>`;
        const ar = '<span class="dc-ar" aria-hidden="true">→</span>';
        const flow = (steps, out) => `<li><span class="dc-steps">${steps.map(esc).join(' → ')}</span>${ar}<b class="dc-out">${esc(out)}</b></li>`;
        const mix = [['Sữa uống', 48, '#1D2678'], ['Sữa bột', 29, '#C0272D'], ['Yogurt', 15, '#4A90D9'], ['Khác', 6, '#C9CDD6'], ['Phô mai', 2, '#2FB3D8']];
        return `<div class="dc dc-dairy">
  <p class="dc-lead">Việt Nam chỉ đáp ứng 40–50% nhu cầu sữa trong nước</p>
  <div class="dc-band"><span class="dc-b dc-b1">Đầu vào</span><span class="dc-b dc-b2">Quy trình sản xuất</span><span class="dc-b dc-b3">Đầu ra</span></div>
  <div class="dc-cols">
    <section class="dc-col dc-in"><h4><span>1</span>Nguyên vật liệu đầu vào</h4>
      <div class="dc-row">${box('Bò')}${box('Cỏ')}${box('Trang trại, hộ chăn nuôi')}</div>
      <p class="dc-num"><b>&gt; 1.700</b> trại · <b>&gt; 28.700</b> hộ</p>
      <div class="dc-or"><div class="dc-src"><b>Sữa tươi tự cung</b></div><em>hoặc</em><div class="dc-src"><b>Nhập khẩu từ nước ngoài</b><small>Sữa bột nguyên kem (WMP) · Sữa bột gầy (SMP)</small></div></div>
      <p class="dc-lbl">Nguồn nhập sữa bột</p>
      <ul class="dc-ctry"><li><b>28%</b>New Zealand</li><li><b>18%</b>Hoa Kỳ</li><li>Úc</li><li>Nhật Bản</li></ul>
      <p class="dc-note">Và các nguyên liệu khác: đường, hương liệu, bao bì…</p>
    </section>
    <section class="dc-col dc-mid"><h4><span>2</span>Quy trình sản xuất</h4>
      <p class="dc-num"><b>30+</b> nhà máy đạt chuẩn GMP / HACCP / ISO · bắt đầu bằng <b>chuẩn hóa</b> sữa nguyên liệu</p>
      <ul class="dc-flow">
        ${flow(['Phối trộn', 'Đồng hóa', 'Thanh trùng'], 'Rót sản phẩm')}
        ${flow(['140°C trong 4–6 giây', 'làm lạnh 20°C'], 'Sữa tiệt trùng')}
        ${flow(['90°C trong 30 giây', 'làm lạnh 4°C'], 'Sữa thanh trùng')}
        ${flow(['Trộn sữa bột và nước ở 40°C'], 'Sữa hoàn nguyên')}
        ${flow(['Nấu', 'bổ sung syrup', 'kết tinh'], 'Sữa đặc')}
        ${flow(['Thanh trùng', 'cô đặc', 'đồng hóa', 'sấy sữa'], 'Sữa bột')}
        ${flow(['Tách béo một phần', 'lên men', 'đông sữa lactic', 'tạo hình, rút nước váng sữa'], 'Phô mai')}
      </ul>
      <h4 class="dc-sub"><span>3</span>Thành phẩm · doanh thu các loại sữa năm 2023</h4>
      <div class="dc-stack" role="img" aria-label="${mix.map(([n, v]) => n + ' ' + v + '%').join(', ')}">${mix.map(([n, v, c]) => `<span style="flex:${v} 1 0;background:${c}">${v >= 6 ? v + '%' : ''}</span>`).join('')}</div>
      <ul class="dc-leg">${mix.map(([n, v, c]) => `<li><i style="background:${c}"></i>${esc(n)} <b>${v}%</b></li>`).join('')}<li><i style="background:#111"></i>Bơ</li></ul>
      <p class="dc-lbl">Doanh nghiệp dẫn đầu</p>
      <p class="dc-brands"><b>Vinamilk</b> (số 1) · Nutifood · TH true MILK · IDP · Nestlé</p>
    </section>
    <section class="dc-col dc-right">
      <h4><span>5</span>Phân phối trong nước</h4>
      <ul class="dc-list"><li>Siêu thị, trung tâm thương mại, cửa hàng tiện lợi</li><li>Phân phối độc quyền, đại lý</li><li>Cửa hàng thương hiệu riêng</li><li>Sàn thương mại điện tử</li><li>Điểm bán lẻ, tạp hóa</li></ul>
      <h4><span>4</span>Xuất khẩu</h4>
      <p class="dc-num"><b>60+</b> quốc gia, vùng lãnh thổ</p>
      <p class="dc-note">Thị trường chính: Đông Nam Á, Trung Đông, Nhật Bản, Hàn Quốc, Trung Quốc</p>
    </section>
  </div>
</div>`;
      }},
    {id: 'chDairyModels', type: 'models', items: [
      ['Sữa đa sản phẩm, nội địa + xuất khẩu', 'VNM', 'Sữa nước, sữa bột, sữa chua, sữa đặc, nước giải khát; kênh truyền thống, hiện đại, chuỗi cửa hàng riêng và xuất khẩu', 'Giá sữa bột nhập (SMP, WMP), đường; giá bán và cơ cấu sản phẩm; chi phí bán hàng', [['#rf-q-input', 'Giá đầu vào'], ['#rf-q-gm', 'Biên gộp']]],
      ['Sữa tươi từ đàn bò', 'MCM', 'Sữa tươi, sữa chua từ trang trại tại Mộc Châu, thị trường chủ yếu miền Bắc', 'Giá sữa tươi nguyên liệu, thức ăn chăn nuôi (ngô, khô đậu), khấu hao trang trại', [['#rf-q-output', 'Sản lượng'], ['#rf-q-gm', 'Biên gộp']]]],
      src: [['BCTC và báo cáo thường niên doanh nghiệp', '#rf-q-compare']]},
    {id: 'chMilk', type: 'series', base: 'milk_output', series: [['Sữa tươi', 'milk_output', C.navy, 'bar']], unit: 'triệu lít', tableUnit: 'triệu lít', digits: 0, table: 'tbl-milk', src: ['nso'],
      method: 'Sản lượng sản xuất công nghiệp toàn ngành (NSO), không phải sản lượng bán ra của doanh nghiệp.',
      insight: 'Sản lượng sản xuất toàn ngành cho biết cầu nội địa và mức chạy máy, chưa tách được phần của VNM hay MCM. Kiểm tiếp sản lượng quý IV, mùa cao điểm Tết.'},
    {id: 'chMilkPowder', type: 'series', base: 'milkpowder_output', series: [['Sữa bột', 'milkpowder_output', C.plum, 'bar']], unit: 'nghìn tấn', tableUnit: 'nghìn tấn', digits: 1, table: 'tbl-milkpowder', src: ['nso'],
      method: 'Sản lượng sản xuất công nghiệp sữa bột (NSO), toàn ngành.',
      insight: 'Sữa bột là mảng biên cao của ngành; sản lượng đi ngang phản ánh cạnh tranh của hàng nhập khẩu và tỷ lệ sinh giảm. Kiểm tiếp cơ cấu doanh thu sữa bột trong báo cáo quý của VNM.'},
    {id: 'chMilkYoY', type: 'series', base: 'milk_output', yoyOnly: true, series: [['Sữa tươi', 'milk_output', C.navy, 'line', 'yoy'], ['Sữa bột', 'milkpowder_output', C.plum, 'line', 'yoy'], ['CPI hàng ăn & dịch vụ ăn uống', 'cpi_food_yoy', C.gold, 'line', 'raw']], unit: '%', digits: 1, zeroBase: false, table: 'tbl-milk-yoy', src: ['nso'],
      method: 'Sản lượng: % so cùng tháng năm trước (tự tính từ số tháng NSO). CPI hàng ăn: % so cùng kỳ NSO công bố.',
      insight: 'Sản lượng tăng cùng lúc giá hàng ăn tăng cho thấy cầu thực còn tốt; nếu sản lượng giảm khi CPI hàng ăn tăng, giá bán đang ăn vào sức mua. Kiểm tiếp sản lượng 2–3 tháng tới.'},
    {id: 'chDairyInput', type: 'index', series: [['Sữa bột nguyên kem WMP', 'wmp', C.red], ['Sữa bột gầy SMP', 'smp', C.plum], ['Đường thô', 'sugar', C.gold], ['Ngô', 'corn', C.teal], ['Khô đậu nành', 'soymeal', C.navy]], table: 'tbl-dairy-input', src: ['fao', 'ice', 'fred'],
      method: 'Chỉ số, T1/2024 = 100. WMP, SMP: FAO FPMA (bình quân châu Âu & châu Đại Dương, FOB); đường thô ICE No.11 cuối tháng; ngô, khô đậu: IMF bình quân tháng. Ngô, khô đậu là chi phí thức ăn của đàn bò (MCM, trang trại VNM).',
      insight: 'Sữa bột nhập là giá vốn chính của sữa hoàn nguyên, ngô và khô đậu là chi phí đàn bò; giá đi vào biên gộp sau độ trễ tồn kho và hợp đồng mua. Kiểm tiếp biên gộp VNM, MCM 1–2 quý sau khi giá đổi chiều.'},
    {id: 'chDairyGM', type: 'margin', syms: [['VNM', C.navy], ['MCM', C.teal]], table: 'tbl-dairy-gm', src: ['cq'],
      method: 'Biên = lãi gộp (lãi ròng) ÷ doanh thu thuần, BCTC hợp nhất quý từng mã. MCM nằm trong hợp nhất của VNM (qua GTNfoods) nên không cộng hai mã.',
      insight: 'Biên gộp VNM phản ánh giá sữa bột đã mua từ các quý trước và khả năng tăng giá bán; MCM nhạy với thức ăn chăn nuôi hơn. Kiểm tiếp biên gộp quý IV khi giá WMP, SMP đổi chiều.'},
    {id: 'chDairyLag', type: 'lag', lag: 2, series: [['WMP', 'wmp', C.red], ['SMP', 'smp', C.plum], ['Đường thô', 'sugar', C.gold]], table: 'tbl-dairy-lag', src: ['fao', 'ice'],
      method: 'Giả định phân tích: mỗi quý trên trục là quý của biên gộp; giá trị là bình quân chỉ số nguyên liệu của quý trước đó 2 quý (độ trễ tồn kho, hợp đồng). Không phải quan hệ đã kiểm định.',
      insight: 'So hình dạng đường này với biên gộp VNM bên trên để xem độ trễ 2 quý có khớp. Để kiểm thật cần thêm ngày tồn kho nguyên liệu, giá bán bình quân và cơ cấu sản phẩm.'},
    {id: 'chDairyRev', type: 'revenue', syms: [['VNM', C.navy], ['MCM', C.teal]], table: 'tbl-dairy-rev', src: ['cq'],
      method: 'BCTC hợp nhất quý từng mã. MCM đã nằm trong hợp nhất VNM nên không cộng.',
      insight: 'Doanh thu VNM gồm nội địa và xuất khẩu; lợi nhuận đi theo biên gộp và chi phí bán hàng. Kiểm tiếp doanh thu xuất khẩu và nội địa trong báo cáo quý.'},
    {id: 'chDairyPE', type: 'val', ids: [['239', 'Sữa (VNM)', C.navy]], table: 'tbl-dairy-pe', src: ['vnd'],
      method: 'Rổ "Sữa" của VNDirect (VNM). P/E = vốn hóa ÷ lợi nhuận 4 quý. Vẽ mỗi 5 phiên.',
      insight: 'P/E đọc cùng chu kỳ lợi nhuận: lợi nhuận tăng nhờ nguyên liệu rẻ thường làm P/E giảm dù giá cổ phiếu đi ngang. Kiểm tiếp lợi nhuận 4 quý ở chart doanh thu, lợi nhuận.'},
    {id: 'dairyTimeline', type: 'timeline', items: [
      {d: '2026-01-01', name: 'Lương tối thiểu vùng (NĐ 293/2025)', st: 'Đã ban hành', what: '+7,2%; vùng I 5.310.000 đ/tháng', who: 'VNM · MCM', v: 'Sức mua · chi phí nhân công', url: 'https://nhadautu.vn/chinh-thuc-tang-luong-toi-thieu-vung-tu-1-1-2026-d100632.html'},
      {d: '2026-12-31', label: 'hết 31/12/2026', name: 'Hết giảm 2% VAT (NQ Quốc hội 17/6/2025)', st: 'Đã ban hành', what: 'Từ 1/1/2027 nhiều hàng hóa, dịch vụ trở lại 10%', who: 'VNM · MCM', v: 'Giá bán cuối cùng, sức mua', url: 'https://baodauthau.vn/quoc-hoi-thong-qua-giam-2-thue-vat-voi-nhieu-hang-hoa-dich-vu-den-het-nam-2026-post180339.html'},
      {d: '2027-01-01', name: 'Thuế TTĐB nước giải khát có đường', st: 'Đã ban hành', what: 'Nước giải khát có đường >5 g/100 ml: 8% từ 2027, 10% từ 2028', who: 'VNM (mảng nước giải khát)', v: 'Giá bán, sản lượng nước giải khát', url: 'https://vneconomy.vn/thue-tieu-thu-dac-biet-ruou-va-bia-tang-den-90-vao-nam-2031.htm'}],
      method: 'Mốc là ngày hiệu lực; "hết 31/12/2026" là ngày cuối còn hiệu lực.'},
    {id: 'chDairyPlan', type: 'tiles', items: [['Kế hoạch 2026 · VNM', '66.477 / 9.828 tỷ', 'doanh thu / LNST (+4%); cổ tức ≥50% LNST'], ['Kết quả 6T/2026 · VNM', '5.643 tỷ LNST', '+38% so cùng kỳ · 55% kế hoạch'], ['Xuất khẩu 6T/2026 · VNM', '4.990 tỷ', '+42% so cùng kỳ; nội địa +12,6%']],
      src: [DNPL_VNM], method: 'Số doanh nghiệp công bố, kỳ ghi ở từng ô. Kết quả 9T/2026 xem bảng so sánh tài chính bên trên.'},
  ],
  sourceManual: [[/^Chuỗi giá trị ngành sữa/, 'FinSuccess tổng hợp']],
  topics: {'sua-t1': ['Doanh thu xuất khẩu và nội địa, biên gộp VNM', 'Doanh thu xuất khẩu quý III–IV, giá WMP/SMP, biên gộp quý IV', [['#rf-q-input', 'Giá sữa bột'], ['#rf-q-gm', 'Biên gộp VNM, MCM']]]},
  alias: {mt3: ['mt2', 'input']},
  section: {input: ['mt2', 'input'], price: ['mt2', 'input']},
  tree: {
    mt1: {title: 'Tổng quan ngành', subs: [
      {k: 'map', t: 'Bản đồ ngành', d: 'Nguồn sữa (bò trong nước, sữa bột nhập) → chế biến → kênh bán → biên.', items: [
        {q: 'Sữa đi qua những khâu nào trước khi thành lợi nhuận?', id: 'rf-q-map', take: ['sua-01']}]},
      {k: 'model', t: 'Mô hình kiếm tiền', d: 'Doanh thu đến từ đâu, biến nào quyết định biên, mã nào đại diện.', items: [
        {q: 'Mỗi doanh nghiệp kiếm tiền từ đâu, biến nào quyết định biên?', id: 'rf-q-model', take: ['sua-05']}]},
    ]},
    mt2: {title: 'Bức tranh ngành', subs: [
      {k: 'all', t: 'Sản lượng & sức mua', d: 'Ngành đang sản xuất nhiều hơn hay ít hơn? Sản lượng sữa tươi, sữa bột và giá hàng ăn.', kpis: ['spk-milk', 'spk-mp'], items: [
        {q: 'Ngành đang sản xuất nhiều hơn hay ít hơn?', id: 'rf-q-output', meta: '<b>sản lượng sản xuất</b> toàn ngành (NSO), không phải sản lượng bán của doanh nghiệp', take: ['sua-10', 'sua-11']},
        {q: 'Sản lượng đi cùng hay ngược giá hàng ăn?', id: 'rf-q-demand', meta: '% so cùng kỳ · sản lượng tự tính, CPI do NSO công bố', take: ['sua-12']}]},
      {k: 'input', t: 'Giá đầu vào → biên', d: 'Giá sữa bột, đường, thức ăn chăn nuôi đang tác động thế nào lên biên gộp?', kpis: ['spk-wmp'],
        flow: [['cost', 'Đầu vào', 'Sữa bột, đường, thức ăn'], ['margin', 'Biên', 'Biên gộp VNM, MCM'], ['lag', 'Kiểm cơ chế', 'Độ trễ 2 quý (giả định)']], items: [
        {stage: 'cost'},
        {q: 'Giá sữa bột, đường và thức ăn chăn nuôi đang đi hướng nào?', id: 'rf-q-input', meta: 'chỉ số T1/2024 = 100 · giá gốc (USD) ở Chi tiết dữ liệu', take: ['sua-20']},
        {stage: 'margin'},
        {q: 'Biên gộp doanh nghiệp đang mở rộng hay thu hẹp?', id: 'rf-q-gm', meta: '% · BCTC hợp nhất quý từng mã', take: ['sua-21']},
        {stage: 'lag'},
        {q: 'Nếu giá nguyên liệu đi trước biên gộp 2 quý thì sao? (giả định phân tích)', id: 'rf-q-lag', meta: '<b>giả định</b> độ trễ 2 quý · chỉ ghép chuỗi cùng quý quan sát', take: ['sua-22']}]},
      {k: 'policy', t: 'Chính sách & thuế', d: 'Mốc nào có thể đổi giá bán, sản lượng hoặc chi phí?', items: [
        {q: 'Mốc nào có thể đổi giá bán, sản lượng hoặc chi phí?', id: 'rf-q-policy', meta: '● đã ban hành · ○ dự thảo · ngày hiệu lực', take: ['sua-52']}]},
    ]},
    mt14: {title: 'Tài chính ngành', subs: [
      {k: 'sector', t: 'Tài chính ngành', d: 'Định giá rổ sữa, doanh thu và lợi nhuận theo quý từng mã.', kpis: ['spk-pe'], items: [
        {q: 'Thị trường định giá cổ phiếu sữa ở mức nào?', id: 'rf-q-pe', meta: 'lần · rổ "Sữa" VNDirect (VNM)', take: ['sua-03']},
        {q: 'Doanh thu và lợi nhuận đi thế nào?', id: 'rf-q-rev', meta: 'nghìn tỷ đồng · hợp nhất quý từng mã, không cộng (MCM trong hợp nhất VNM)', take: ['sua-06']}]},
      {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'Bảng so sánh, bộ lọc mã và kỳ báo cáo; kế hoạch và kết quả 2026.', items: [
        {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'rf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ', take: ['.financial-comparison']},
        {q: 'Doanh nghiệp đã đi được bao nhiêu so với kế hoạch 2026?', id: 'rf-q-plan', take: ['sua-60']}]},
    ]},
  },
};
})();
