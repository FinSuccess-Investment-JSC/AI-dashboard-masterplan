/* Ô tô – Xe máy · cấu hình dashboard (tách khỏi Bán lẻ 26/11/2026). Số tài liệu có dòng trong data/auto/evidence.json. */
(() => {
const C = {navy: '#2938A8', teal: '#59C5C8', plum: '#861C52', gold: '#c29100', grey: '#6b7686', red: '#d1583f', green: '#27af95'};
const VAMA = ['VAMA qua VietnamPlus', 'https://www.vietnamplus.vn/doanh-so-ban-oto-tai-viet-nam-tang-38-xe-hybrid-tang-toc-post1141084.vnp'];
const VF = ['VinFast qua VOV', 'https://vov.vn/o-to-xe-may/doanh-so-vinfast-thang-92026-tang-truong-an-tuong-voi-hon-23000-xe-ban-giao-post1340347.vov'];
const VAMM = ['VAMM qua VietnamPlus', 'https://www.vietnamplus.vn/doanh-so-xe-may-viet-nam-vuot-2-trieu-chiec-xe-xang-van-tang-truong-post1141075.vnp'];
const LPTB = 'https://lsvn.vn/o-to-dien-duoc-ap-dung-le-phi-truoc-ba-lan-dau-0-den-het-nam-2030-a173952.html';
window.PKG = {
  key: 'auto', prefix: 'oto', label: 'Ô tô - Xe máy',
  wide: ['oto-01', 'oto-05', 'oto-11', 'oto-52', 'oto-60'],
  kpis: [
    {spark: 'spk-car', series: 'car_output', unit: 'nghìn chiếc', digits: 1},
    {spark: 'spk-carimp', series: 'car_import', unit: 'triệu USD', digits: 0},
    {spark: 'spk-moto', series: 'moto_output', unit: 'nghìn chiếc', digits: 0},
    {spark: 'spk-pe', pe: '224', label: 'Bán lẻ xe'},
  ],
  charts: [
    {id: 'chAutoChain', type: 'steps', steps: [
      ['Nguồn xe', 'Lắp ráp trong nước + nhập khẩu nguyên chiếc', 'Hãng, liên doanh, nhà lắp ráp (TMT); xe nhập chịu thuế nhập khẩu, TTĐB'],
      ['Phân phối', 'Đại lý ủy quyền (HAX, SVC, CTF)', 'Mua xe từ hãng, hưởng chiết khấu và thưởng doanh số'],
      ['Người mua', 'Vay mua xe, lệ phí trước bạ, đăng ký', 'Lãi suất, tín dụng, lệ phí trước bạ 0% xe điện đến 2030'],
      ['Biên đại lý', 'Chiết khấu xe mới + dịch vụ, phụ tùng', 'Giảm giá cạnh tranh, tồn kho xe, lãi vay']],
      note: 'Sơ đồ mô hình, không biểu thị tỷ trọng.', src: [['FinSuccess tổng hợp', '#rf-q-model']]},
    {id: 'chAutoModels', type: 'models', items: [
      ['Đại lý ô tô', 'HAX · SVC · CTF', 'Bán xe mới của các hãng (HAX: Mercedes, MG và đại lý VinFast từ 3/2026; SVC, CTF: đa hãng), dịch vụ, phụ tùng, sửa chữa', 'Số xe bán theo hãng, chiết khấu từ hãng, mức giảm giá; tồn kho xe và lãi vay', [['#rf-q-car', 'Doanh số xe'], ['#rf-q-gm', 'Biên đại lý']]],
      ['Sản xuất, lắp ráp', 'TMT', 'Lắp ráp và bán xe tải, xe điện cỡ nhỏ', 'Sản lượng, giá linh kiện nhập, tỷ giá; thuế TTĐB, lệ phí trước bạ xe điện', [['#rf-q-output', 'Sản lượng sản xuất'], ['#rf-q-policy', 'Chính sách']]]],
      src: [['BCTC và báo cáo thường niên doanh nghiệp', '#rf-q-compare']]},
    {id: 'chCar', type: 'series', base: 'car_output', series: [['Ô tô sản xuất (nghìn chiếc)', 'car_output', C.navy, 'bar'], ['Nhập khẩu ô tô nguyên chiếc (chục triệu USD)', 'car_import', C.gold, 'line', 'raw', 10]], unit: '', digits: 1, table: 'tbl-car', src: ['nso', 'customs'],
      method: 'Sản lượng sản xuất ô tô (NSO) và kim ngạch nhập khẩu ô tô nguyên chiếc (Hải quan, chia 10 để cùng trục). Đây không phải doanh số bán ra.',
      insight: 'Sản xuất trong nước và nhập khẩu là nguồn cung xe cho đại lý; doanh số bán ra (VAMA, VinFast) ở chart bên cạnh mới quyết định doanh thu đại lý. Kiểm tiếp tháng 11–12, mùa cao điểm mua xe cuối năm.'},
    {id: 'carTiles', type: 'tiles', items: [['VAMA · 9T/2026', '282.029 xe', '+12% so cùng kỳ · thành viên VAMA'], ['VAMA · tháng 9/2026', '35.094 xe', '+38% so tháng trước'], ['VinFast · 9T/2026', '177.697 xe', 'bàn giao tại Việt Nam · tháng 9: 23.624 xe']],
      src: [VAMA, VF], method: 'Hai phạm vi riêng, không cộng: VinFast không là thành viên VAMA; cộng cần loại xe Hyundai Thành Công và xe nhập ngoài hiệp hội. HAX, SVC, CTF không công bố số xe bán ra.',
      insight: 'Doanh số bán ra của hiệp hội và VinFast là biến trực tiếp của doanh thu đại lý; xe điện tăng nhanh làm đổi cơ cấu hãng mà đại lý phân phối. Kiểm tiếp doanh số VAMA và VinFast tháng 10–11.'},
    {id: 'chCarMix', type: 'hbar', items: [['Xe hybrid', 64, C.teal], ['Xe nhập khẩu nguyên chiếc', 22, C.navy], ['Toàn bộ VAMA', 12, C.grey], ['Xe lắp ráp trong nước', 2, C.plum]], unit: '%', digits: 0, labelW: 200, src: [VAMA], period: '9T/2026',
      method: '% so cùng kỳ, cùng phạm vi thành viên VAMA. Hybrid là nhóm theo động cơ, chồng lên nhóm nhập khẩu/lắp ráp, nên không cộng các thanh.',
      insight: 'Cơ cấu nghiêng về xe nhập khẩu đổi biên đại lý tùy hãng phân phối, nên sản lượng chung tăng chưa đủ để kết luận lợi nhuận đại lý. Kiểm tiếp số xe bán theo hãng và biên gộp đại lý.'},
    {id: 'chCredit', type: 'series', base: 'credit_total', yoyOnly: true, months: 24, series: [['Tổng tín dụng nền kinh tế', 'credit_total', C.red, 'line', 'yoy']], unit: '%', digits: 1, zeroBase: false, table: 'tbl-credit', src: ['sbv'],
      method: '% so cùng kỳ của tổng dư nợ tín dụng nền kinh tế (NHNN, số liệu từ 01/2025). Nguồn công khai chưa tách tín dụng mua xe.',
      insight: 'Phần lớn xe mới mua bằng vay, nên tín dụng nới ra hỗ trợ doanh số đại lý; đây là tổng tín dụng nên chỉ là chỉ báo gián tiếp. Kiểm tiếp lãi suất cho vay mua xe của ngân hàng.'},
    {id: 'chMoto', type: 'series', base: 'moto_output', series: [['Xe máy sản xuất', 'moto_output', C.teal, 'bar']], unit: 'nghìn chiếc', tableUnit: 'nghìn chiếc', digits: 0, table: 'tbl-moto', src: ['nso'],
      method: 'Sản lượng sản xuất xe máy (NSO), toàn ngành.',
      insight: 'Xe máy là chỉ báo sức mua của nhóm thu nhập trung bình; thị trường đã bão hòa, phần tăng chủ yếu từ xe điện. Kiểm tiếp số VAMM quý IV.'},
    {id: 'motoTiles', type: 'tiles', items: [['VAMM bán ra · Q3/2026', '686.661 xe', '+10,4% so cùng kỳ'], ['VAMM bán ra · 9T/2026', '2.054.213 xe', 'thành viên VAMM']],
      src: [VAMM], method: 'Số bán ra của thành viên Hiệp hội các nhà sản xuất xe máy, khác phạm vi với sản lượng sản xuất NSO.'},
    {id: 'chAutoGM', type: 'margin', syms: [['HAX', C.navy], ['SVC', C.teal], ['CTF', C.plum], ['TMT', C.gold]], table: 'tbl-auto-gm', src: ['cq'],
      method: 'Biên = lãi gộp (lãi ròng) ÷ doanh thu thuần, BCTC hợp nhất quý. HAX hợp nhất đại lý VinFast (Tương Lai Việt) từ cuối Q1/2026 nên cơ cấu doanh thu đổi từ quý này.',
      insight: 'Biên gộp đại lý phụ thuộc chiết khấu từ hãng và mức giảm giá cạnh tranh, nên có thể đi ngược sản lượng khi thị trường tăng nhờ khuyến mãi. Kiểm tiếp doanh số theo hãng và tồn kho xe trong BCTC quý.'},
    {id: 'chAutoRev', type: 'revenue', syms: [['HAX', C.navy], ['SVC', C.teal], ['CTF', C.plum], ['TMT', C.gold]], stackable: true, table: 'tbl-auto-rev', src: ['cq'],
      method: 'BCTC hợp nhất quý từng mã. Bốn mã không có quan hệ mẹ – con với nhau nên có thể xếp chồng để xem quy mô rổ.',
      insight: 'Doanh thu đại lý đi sát số xe bán; lợi nhuận mỏng nên nhạy với chi phí lãi vay tồn kho. Kiểm tiếp quý IV, mùa cao điểm.'},
    {id: 'autoTimeline', type: 'timeline', items: [
      {d: '2030-12-31', label: 'đến 31/12/2030', name: 'Lệ phí trước bạ ô tô điện 0% (NĐ 51/2025, 202/2026)', st: 'Đã ban hành', what: '0% lần đầu cho ô tô điện chạy pin đến hết 31/12/2030', who: 'HAX (đại lý VinFast) · SVC · CTF', v: 'Cơ cấu xe điện/xe xăng, doanh số', url: LPTB},
      {d: '2026-01-01', name: 'Lương tối thiểu vùng (NĐ 293/2025)', st: 'Đã ban hành', what: '+7,2%; vùng I 5.310.000 đ/tháng', who: 'Cả ngành (xe máy)', v: 'Sức mua nhóm thu nhập trung bình', url: 'https://nhadautu.vn/chinh-thuc-tang-luong-toi-thieu-vung-tu-1-1-2026-d100632.html'},
      {d: '2026-12-31', label: 'hết 31/12/2026', name: 'Hết giảm 2% VAT (NQ Quốc hội 17/6/2025)', st: 'Đã ban hành', what: 'Từ 1/1/2027 nhiều hàng hóa, dịch vụ trở lại 10%', who: 'Cả ngành', v: 'Giá xe lăn bánh', url: 'https://baodauthau.vn/quoc-hoi-thong-qua-giam-2-thue-vat-voi-nhieu-hang-hoa-dich-vu-den-het-nam-2026-post180339.html'}],
      method: 'Mốc là ngày hiệu lực; với lệ phí trước bạ, mốc ghi là ngày cuối áp dụng. Thuế TTĐB xe điện tăng từ 3/2027 mới thấy trong bài báo, chưa mở được văn bản gốc nên chưa đưa vào.'},
    {id: 'chAutoPE', type: 'val', ids: [['224', 'Bán lẻ xe (HAX, SVC)', C.navy]], table: 'tbl-auto-pe', src: ['vnd'],
      method: 'Rổ "Bán lẻ xe" của VNDirect (HAX, SVC). P/E = tổng vốn hóa ÷ tổng lợi nhuận 4 quý. Vẽ mỗi 5 phiên.',
      insight: 'P/E đại lý dao động mạnh vì lợi nhuận mỏng: một quý lãi tăng làm P/E giảm nhanh. Kiểm tiếp lợi nhuận 4 quý ở chart doanh thu, lợi nhuận.'},
    {id: 'chAutoPlan', type: 'tiles', items: [['Kế hoạch 2026 · HAX', 'LNTT 180–200 tỷ', 'gấp 4–5 lần, chưa gồm đại lý VinFast'], ['Kết quả 6T/2026 · HAX', 'LNTT 49,8 tỷ', '25% kế hoạch; Q2 doanh thu 1.559 tỷ (+52%)'], ['Kế hoạch 2026 · SVC', '22.094 / ~159 tỷ', 'doanh thu (−21%) / LNST (−68%, nền 2025 có lãi bất thường)'], ['Kết quả 6T/2026 · SVC', '103,5 tỷ lãi ròng', '−30% so cùng kỳ · 65% kế hoạch']],
      src: [['HAX qua DNSE', 'https://www.dnse.com.vn/senses/tin-tuc/haxaco-kinh-doanh-ra-sao-sau-khi-mua-cong-ty-phan-phoi-xe-vinfast-35252657'], ['SVC qua Nhà đầu tư', 'https://nhadautu.vn/thi-truong-o-to-tang-toc-doanh-nghiep-nao-huong-loi-d106829.html']], method: 'Số doanh nghiệp công bố, kỳ ghi ở từng ô. HAX: số Q2 hợp nhất (DNSE) khác số công ty mẹ ở một số bài.'},
  ],
  sourceManual: [[/^Chuỗi giá trị ngành ô tô/, 'FinSuccess tổng hợp']],
  topics: {'oto-t1': ['Doanh thu, cơ cấu hãng và biên gộp HAX; doanh số đại lý xe xăng (SVC, CTF)', 'Doanh số VinFast và VAMA hằng tháng, biên gộp HAX quý III–IV', [['#rf-q-car', 'Doanh số xe'], ['#rf-q-gm', 'Biên đại lý'], ['#rf-q-policy', 'Lệ phí trước bạ']]]},
  section: {supply: ['mt2', 'all'], demand: ['mt2', 'all']},
  tree: {
    mt1: {title: 'Tổng quan ngành', subs: [
      {k: 'map', t: 'Bản đồ ngành', d: 'Hãng, nhà lắp ráp, xe nhập → đại lý → người mua (vay, lệ phí) → biên đại lý.', items: [
        {q: 'Một chiếc xe đi qua những khâu nào trước khi thành lợi nhuận?', id: 'rf-q-map', take: ['oto-01']}]},
      {k: 'model', t: 'Mô hình kiếm tiền', d: 'Đại lý và nhà lắp ráp kiếm tiền khác nhau thế nào.', items: [
        {q: 'Mỗi nhóm kiếm tiền từ đâu, biến nào quyết định biên?', id: 'rf-q-model', take: ['oto-05']}]},
    ]},
    mt2: {title: 'Bức tranh ngành', subs: [
      {k: 'all', t: 'Ô tô', d: 'Sản lượng và doanh số xe đang tăng ở nhóm nào? Nguồn cung, số bán, cơ cấu nhập khẩu/lắp ráp, tín dụng.', kpis: ['spk-car', 'spk-carimp'], items: [
        {q: 'Nguồn cung xe: sản xuất trong nước và nhập khẩu', id: 'rf-q-output', meta: 'nghìn chiếc (NSO) · chục triệu USD (Hải quan) · không phải doanh số bán', take: ['oto-10']},
        {q: 'Doanh số xe đang tăng ở nhóm nào?', id: 'rf-q-car', meta: 'VAMA và VinFast là hai phạm vi riêng · % so cùng kỳ 9T/2026 cùng phạm vi VAMA', take: ['oto-11', 'oto-12']},
        {q: 'Tín dụng có đang hỗ trợ người mua xe?', id: 'rf-q-credit', meta: '<b>tổng</b> tín dụng nền kinh tế (chưa tách vay mua xe)', take: ['oto-13']}]},
      {k: 'moto', t: 'Xe máy', d: 'Xe máy: sản lượng sản xuất và số bán ra của hiệp hội.', kpis: ['spk-moto'], items: [
        {q: 'Thị trường xe máy đang tăng hay đi ngang?', id: 'rf-q-moto', meta: 'sản xuất (NSO) và bán ra (VAMM) là hai phạm vi khác nhau', take: ['oto-14', 'oto-15']}]},
      {k: 'margin', t: 'Biên đại lý', d: 'Sản lượng xe truyền vào lợi nhuận đại lý qua đâu?', items: [
        {q: 'Biên gộp đại lý và nhà lắp ráp đi thế nào?', id: 'rf-q-gm', meta: '% · BCTC hợp nhất quý từng mã', take: ['oto-20'],
          after: 'Lợi nhuận đại lý = số xe bán × (giá bán − giá nhập từ hãng) + dịch vụ, phụ tùng. Chỉ báo cần kiểm tiếp: doanh số theo hãng mà HAX, SVC, CTF phân phối (chưa có nguồn công khai theo tháng), tỷ trọng dịch vụ trong lãi gộp, tồn kho xe, chi phí lãi vay.'}]},
      {k: 'policy', t: 'Chính sách & thuế', d: 'Mốc nào có thể đổi giá xe, doanh số hoặc cơ cấu xe điện/xe xăng?', items: [
        {q: 'Mốc nào có thể đổi giá bán, sản lượng hoặc chi phí?', id: 'rf-q-policy', meta: '● đã ban hành · ○ dự thảo · ngày hiệu lực', take: ['oto-52']}]},
    ]},
    mt14: {title: 'Tài chính ngành', subs: [
      {k: 'sector', t: 'Tài chính ngành', d: 'Định giá rổ bán lẻ xe, doanh thu và lợi nhuận theo quý từng mã.', kpis: ['spk-pe'], items: [
        {q: 'Thị trường định giá cổ phiếu đại lý ô tô ở mức nào?', id: 'rf-q-pe', meta: 'lần · rổ "Bán lẻ xe" VNDirect (HAX, SVC)', take: ['oto-03']},
        {q: 'Doanh thu và lợi nhuận từng doanh nghiệp đi thế nào?', id: 'rf-q-rev', meta: 'nghìn tỷ đồng · hợp nhất quý từng mã', take: ['oto-06']}]},
      {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'Bảng so sánh, bộ lọc mã và kỳ báo cáo; kế hoạch và kết quả 2026.', items: [
        {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'rf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ', take: ['.financial-comparison']},
        {q: 'Doanh nghiệp đã đi được bao nhiêu so với kế hoạch 2026?', id: 'rf-q-plan', take: ['oto-60']}]},
    ]},
  },
};
})();
