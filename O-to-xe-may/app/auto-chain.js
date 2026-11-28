/* Ô tô – Xe máy · Tổng quan ngành (28/11/2026):
   - 00 Bản đồ ngành (#chAutoChain, thẻ oto-01): sơ đồ chuỗi giá trị 5 khâu + nhánh hậu mãi + nhánh sở hữu vốn VEA + lớp hệ sinh thái.
     Bộ lọc Toàn ngành / Ô tô / Xe máy / Xe điện; chế độ luồng hàng hóa / luồng tiền; bấm mã để sáng các khâu; rê/bấm khâu xem kinh tế học, KPI, rủi ro.
   - 01 Mô hình kiếm tiền (#chAutoModels, thẻ oto-05): 4 mô hình (sản xuất & lắp ráp · đại lý · hậu mãi · sở hữu vốn VEA), mỗi mô hình một hình riêng
     và sơ đồ truyền dẫn cuối mô hình.
   Số: window.AUTO_MODEL (scripts/build_auto_model.py: BCTC hợp nhất VNDirect + data/auto/business-model.json). Thiếu số thì ghi rõ, không ước. */
(() => {
'use strict';
if (document.body.dataset.pkg !== 'auto') return;
const AM = window.AUTO_MODEL || {}, F = AM.fin || {}, DOC = AM.doc || {}, FS = AM.fs || {};
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const link = ([n, u]) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>` : esc(n);
const MC = {mfg: '#2938A8', dealer: '#23868a', after: '#a87c00', equity: '#861C52'};
const FSRC = ['BCTC hợp nhất (VNDirect finfo)', FS.url || 'https://dstock.vndirect.com.vn/'];
const fsMeta = () => `tỷ đồng · tải ${esc((FS.captured || '').split('-').reverse().join('/') || '—')}`;

const ICON = {
  parts: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  factory: '<path d="M3 21V11l5 3v-3l5 3V5h3v16zM3 21h18M17 9h3v12"/>',
  truck: '<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7M5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>',
  store: '<path d="M3 9l2-5h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8M10 21v-5h4v5"/>',
  person: '<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  pie: '<path d="M12 3v9h9a9 9 0 1 1-9-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  bank: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3M7 7h4"/>',
  plug: '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>'
};
const icon = k => `<svg class="ac-ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

/* ======================= Nội dung chuỗi giá trị ======================= */
const SEGS = [['all', 'Toàn ngành'], ['car', 'Ô tô'], ['moto', 'Xe máy'], ['ev', 'Xe điện']];
// Mã niêm yết: vai trò và khâu tham gia. part = chỉ một phần doanh thu liên quan ô tô, xe máy (chưa tách tỷ trọng).
const TK = {
  TMT: {seg: ['all', 'car', 'ev'], nodes: ['n2', 'n3'], role: 'Lắp ráp và tự phân phối xe tải nhẹ, xe điện cỡ nhỏ (Wuling) · nhóm Sản xuất & lắp ráp', model: 'mfg'},
  VEA: {seg: ['all', 'car', 'moto', 'ev'], nodes: ['n1', 'vea', 'jv', 'n2'], eq: true, role: 'Sở hữu vốn Honda VN, Toyota VN, Ford VN (lãi liên doanh) + mảng trực tiếp: động cơ, máy nông nghiệp, cơ khí · nhóm Sở hữu vốn', model: 'equity'},
  HAX: {seg: ['all', 'car', 'ev'], nodes: ['n4', 'after'], role: 'Đại lý Mercedes-Benz; hợp nhất đại lý VinFast (Tương Lai Việt) từ 3/2026 · bán xe + dịch vụ', model: 'dealer'},
  SVC: {seg: ['all', 'car'], nodes: ['n4', 'after'], role: 'Đại lý đa hãng ô tô · bán xe + dịch vụ, phụ tùng', model: 'dealer'},
  CTF: {seg: ['all', 'car'], nodes: ['n4', 'after'], role: 'Đại lý ô tô (City Auto) · bán xe + dịch vụ, phụ tùng', model: 'dealer'},
  DRC: {seg: ['all', 'car'], nodes: ['n1', 'after'], part: true, role: 'Lốp ô tô tải, xe khách (gồm thay thế và xuất khẩu) · chỉ một phần doanh thu gắn với xe trong nước'},
  CSM: {seg: ['all', 'car', 'moto'], nodes: ['n1', 'after'], part: true, role: 'Săm lốp ô tô, xe máy (OEM, thay thế, xuất khẩu) · chưa tách tỷ trọng theo kênh'},
  SRC: {seg: ['all', 'moto'], nodes: ['n1', 'after'], part: true, role: 'Săm lốp xe máy, xe đạp · chủ yếu thị trường thay thế; chưa tách tỷ trọng'},
  PAC: {seg: ['all', 'car', 'moto'], nodes: ['n1', 'after'], part: true, role: 'Ắc quy khởi động ô tô, xe máy (OEM và thay thế) · còn ắc quy công nghiệp; chưa tách tỷ trọng'}
};
const tkOf = (node, seg) => Object.entries(TK).filter(([, t]) => t.nodes.includes(node) && t.seg.includes(seg)).map(([k]) => k);

// Khâu: tiêu đề ≤ 2 dòng; lines/brands/tip theo bộ lọc (thiếu thì lấy 'all').
const NODES = [
  {id: 'n1', no: '01', icon: 'parts', t: 'Linh kiện & nguyên vật liệu',
    lines: {all: ['Thép, nhựa, cao su', 'Lốp, ắc quy, động cơ, hộp số, điện tử'], car: ['Thép tấm, nhựa, kính', 'Động cơ, hộp số, lốp, ắc quy, điện tử'], moto: ['Thép, nhựa, cao su', 'Động cơ, lốp, ắc quy, phanh'], ev: ['Cell pin, quản lý pin (BMS)', 'Mô-tơ điện, điện tử công suất']},
    none: {ev: 'Chưa có mã niêm yết sản xuất pin, mô-tơ EV quy mô lớn'},
    tip: {
      all: {econ: 'Bán linh kiện cho nhà lắp ráp (OEM) theo hợp đồng và cho thị trường thay thế. Biên phụ thuộc giá nguyên liệu (cao su, thép, chì) và tỷ lệ nội địa hóa.', kpi: 'Giá cao su, thép, chì · sản lượng lắp ráp trong nước · tỷ trọng OEM/thay thế/xuất khẩu', risk: 'Linh kiện giá trị cao (động cơ, hộp số, điện tử) phần lớn nhập khẩu; chuyển sang xe điện làm giảm nhu cầu một số linh kiện động cơ đốt trong.'},
      ev: {econ: 'Pin là hạng mục chi phí lớn nhất của xe điện; cell pin chủ yếu nhập khẩu, giá theo giá lithium và công nghệ (LFP/NMC).', kpi: 'Giá pin (USD/kWh) · tỷ lệ nội địa hóa pin · sản lượng xe điện', risk: 'Giá pin giảm nhanh làm đổi giá xe điện; doanh nghiệp linh kiện xe xăng mất dần thị phần.'}}},
  {id: 'n2', no: '02', icon: 'factory', t: 'Sản xuất, lắp ráp & nhập khẩu', ckd: true,
    lines: {all: [], car: [], moto: [], ev: []},
    ckdTxt: {all: ['CKD · lắp ráp trong nước', 'CBU · nhập nguyên chiếc'], car: ['CKD · lắp ráp trong nước', 'CBU · nhập (ASEAN, Trung Quốc…)'], moto: ['CKD · chủ yếu sản xuất trong nước', 'CBU · phân khối lớn'], ev: ['CKD · VinFast, Wuling (TMT)', 'CBU · BYD và hãng nhập khác']},
    brands: {all: 'Toyota, Honda, Ford, Hyundai, THACO, VinFast…', car: 'Toyota, Ford, Hyundai, THACO (Kia, Mazda…), Honda, VinFast, Mercedes-Benz, xe nhập Trung Quốc', moto: 'Honda VN, Yamaha, Piaggio, Suzuki, SYM; xe máy điện VinFast, Yadea', ev: 'VinFast, Wuling (TMT lắp ráp), BYD…'},
    tip: {
      all: {econ: 'Doanh thu = số xe × giá bán buôn. Chi phí cố định (khấu hao, nhân công) dàn trên số xe nên biên nhạy với công suất sử dụng; giá linh kiện nhập theo tỷ giá. Xe CBU chịu thuế nhập khẩu (0% với xe ASEAN đủ xuất xứ) và thuế TTĐB.', kpi: 'Sản lượng · công suất sử dụng · ASP · cơ cấu dòng xe · tồn kho thành phẩm · CAPEX', risk: 'Cạnh tranh giá từ xe nhập; tỷ giá; thay đổi thuế TTĐB, lệ phí trước bạ.'},
      moto: {econ: 'Thị trường xe máy xăng đã bão hòa, Honda VN chiếm phần lớn doanh số VAMM. Lợi nhuận đến từ quy mô sản xuất lớn và mạng HEAD rộng.', kpi: 'Doanh số VAMM · thị phần Honda · tỷ trọng xe máy điện', risk: 'Lộ trình hạn chế xe máy xăng ở nội đô (Chỉ thị 20/CT-TTg, 7/2025); xe máy điện giá rẻ cạnh tranh.'},
      ev: {econ: 'Xe điện được miễn lệ phí trước bạ lần đầu đến hết 2030 (NĐ 51/2025) và chịu thuế TTĐB thấp hơn xe xăng; cạnh tranh chủ yếu bằng giá và hạ tầng sạc.', kpi: 'Doanh số VinFast · số xe điện nhập CBU · giá bán', risk: 'Chiến tranh giá xe điện; ưu đãi lệ phí trước bạ hết hạn sau 2030.'}}},
  {id: 'n3', no: '03', icon: 'truck', t: 'Phân phối',
    lines: {all: ['Phân bổ xe về đại lý', 'Giá bán buôn, chiết khấu, hỗ trợ bán hàng'], moto: ['Hãng phân bổ xe cho HEAD', 'Giá bán buôn, chỉ tiêu, thưởng'], ev: ['VinFast bán qua đại lý từ 2023', 'Giá bán buôn, hỗ trợ bán hàng']},
    none: {all: 'Hãng hoặc nhà phân phối chưa niêm yết đảm nhận', car: 'Hãng hoặc nhà phân phối chưa niêm yết đảm nhận', moto: 'Hãng (Honda VN, Yamaha…) tự phân phối', ev: 'Hãng tự phân phối; TMT tự bán xe Wuling'},
    tip: {all: {econ: 'Hãng hoặc nhà phân phối quyết giá bán buôn, chỉ tiêu, phân bổ xe, chiết khấu thương mại và hỗ trợ bán hàng: đây là nơi chính sách giá truyền xuống biên đại lý.', kpi: 'Giá bán buôn · chính sách chiết khấu, khuyến mãi theo tháng · chỉ tiêu doanh số', risk: 'Hãng giảm giá đồng loạt làm giảm giá trị tồn kho đại lý; hãng đổi nhà phân phối hoặc chấm dứt hợp đồng đại lý.'}}},
  {id: 'n4', no: '04', icon: 'store', t: 'Bán lẻ (đại lý)',
    lines: {all: ['Showroom, đại lý ủy quyền 3S/4S', 'Đại lý xe máy (HEAD, 3S)'], car: ['Showroom, đại lý ủy quyền 3S/4S', 'Bán cho cá nhân và doanh nghiệp'], moto: ['HEAD Honda, đại lý 3S', 'Bán lẻ, dịch vụ, phụ tùng'], ev: ['Đại lý VinFast, BYD…', 'Bán xe, lắp sạc, dịch vụ']},
    none: {moto: 'Đại lý xe máy phần lớn tư nhân, chưa có mã niêm yết thuần'},
    tip: {all: {econ: 'Mua xe từ hãng, bán lẻ: lãi gộp trên xe mới mỏng, cộng thưởng doanh số, dịch vụ – phụ tùng; vốn lưu động (tồn kho xe) tài trợ bằng vay ngắn hạn.', kpi: 'Số xe bán · ASP · lãi gộp/xe · biên gộp · số ngày tồn kho · vay ngắn hạn · chi phí lãi vay', risk: 'Lãi suất tăng; giảm giá cạnh tranh; phụ thuộc một hãng; tồn kho xe đời cũ.'}}},
  {id: 'n5', no: '05', icon: 'person', t: 'Người mua cuối', buyers: true,
    pills: {all: [['Tiêu dùng', 'cá nhân, hộ gia đình'], ['Đầu tư phương tiện', 'vận tải, SXKD']], car: [['Tiêu dùng', 'xe gia đình'], ['Đầu tư phương tiện', 'xe tải, xe dịch vụ']], moto: [['Tiêu dùng', 'đi lại hằng ngày'], ['Đầu tư phương tiện', 'giao hàng, xe ôm công nghệ']], ev: [['Tiêu dùng', 'cá nhân'], ['Đầu tư phương tiện', 'đội taxi, xe dịch vụ điện']]},
    tip: {all: {econ: 'Tiêu dùng phụ thuộc thu nhập, lãi vay mua xe, lệ phí trước bạ. Đầu tư phương tiện (xe tải, xe khách, đội xe dịch vụ) phụ thuộc cước vận tải, hoạt động xây dựng, logistics, tín dụng doanh nghiệp.', kpi: 'Doanh số VAMA, VAMM, VinFast · tín dụng tiêu dùng · lãi suất cho vay mua xe', risk: 'Nhu cầu dồn vào kỳ giảm lệ phí trước bạ rồi hụt sau đó; tín dụng thắt chặt.'}}}
];
const AFTER = {items: ['Bảo dưỡng', 'Sửa chữa', 'Phụ tùng thay thế', 'Xe đã qua sử dụng', 'Đồng sơn, phụ kiện'],
  tip: {econ: 'Doanh thu phát sinh suốt vòng đời xe, không chỉ lúc bán xe mới: số xe đang lưu hành × tần suất vào xưởng × chi tiêu mỗi lượt × tỷ lệ khách quay lại. Đại lý vận hành xưởng dịch vụ; nhà sản xuất lốp, ắc quy bán phụ tùng thay thế.', kpi: 'Số xe thuộc tập khách phục vụ · lượt vào xưởng · chi tiêu/lượt · tỷ lệ giữ chân · doanh thu và lãi gộp dịch vụ', risk: 'Xe điện ít hạng mục bảo dưỡng hơn xe xăng; garage ngoài hãng cạnh tranh giá sau hết bảo hành.'}};
const ECO = [
  {id: 'bank', icon: 'bank', t: 'Ngân hàng & tài chính tiêu dùng', tip: {econ: 'Cho vay mua xe, giải ngân thẳng cho đại lý; cho đại lý vay tài trợ tồn kho.', kpi: 'Lãi suất cho vay mua xe · tỷ lệ trả trước · hạn mức tín dụng đại lý', risk: 'Lãi suất tăng làm giảm số người mua trả góp và tăng chi phí tồn kho của đại lý.'}},
  {id: 'ins', icon: 'shield', t: 'Bảo hiểm phương tiện', tip: {econ: 'Bảo hiểm vật chất, TNDS bắt buộc; đại lý có thể nhận hoa hồng giới thiệu nếu có hợp đồng.', kpi: 'Phí bảo hiểm xe cơ giới · tỷ lệ bồi thường', risk: 'Hoa hồng không phải nguồn bắt buộc; mức ghi nhận tùy hợp đồng từng đại lý.'}},
  {id: 'fuel', icon: 'fuel', t: 'Nhiên liệu', tip: {econ: 'Giá xăng dầu quyết định chi phí sử dụng xe, ảnh hưởng lựa chọn xe xăng, hybrid hay điện.', kpi: 'Giá xăng RON95 · chênh lệch chi phí/km xăng – điện', risk: 'Giá xăng giảm làm chậm chuyển dịch sang xe điện.'}},
  {id: 'charge', icon: 'plug', t: 'Hạ tầng sạc xe điện', tip: {econ: 'Mạng trạm sạc (V-Green cho VinFast và trạm của hãng khác) quyết định độ tiện dụng của xe điện.', kpi: 'Số cổng sạc · phủ sóng tỉnh, quốc lộ', risk: 'Hạ tầng sạc chậm hạn chế nhu cầu xe điện ngoài đô thị.'}}
];
// Nhãn mũi tên. goods: hàng hóa/dịch vụ (đi xuôi); money: tiền (đi ngược chiều, đúng chiều thanh toán).
const EDGE = {
  n1n2: {goods: 'linh kiện', money: 'trả tiền|linh kiện'}, n2n3: {goods: 'xe', money: 'tiền xe'},
  n3n4: {goods: 'xe|phân bổ', money: 'giá buôn'}, n4n5: {goods: 'giao xe', money: 'giá|lăn bánh'},
  n5after: {goods: 'xe lưu hành', money: 'phí dịch vụ'}, n4after: {goods: 'xưởng dịch vụ', money: 'DT dịch vụ'}, n1after: {goods: 'phụ tùng thay thế (lốp, ắc quy)', money: 'tiền phụ tùng thay thế'}
};

/* ======================= Tooltip ======================= */
let tip;
function tipHtml(title, d, extra) {
  return `<h5>${esc(title)}</h5><dl><dt>Kinh tế học</dt><dd>${esc(d.econ)}</dd><dt>KPI theo dõi</dt><dd>${esc(d.kpi)}</dd><dt>Rủi ro</dt><dd>${esc(d.risk)}</dd>${extra ? `<dt>Doanh nghiệp niêm yết</dt><dd>${extra}</dd>` : ''}</dl>`;
}
function showTip(e, html) {
  if (!tip) { tip = make('div', 'ac-tip'); tip.setAttribute('role', 'tooltip'); document.body.append(tip); }
  tip.innerHTML = html; tip.style.display = 'block'; moveTip(e);
}
function moveTip(e) {
  if (!tip || tip.style.display !== 'block') return;
  const r = tip.getBoundingClientRect(), p = 14;
  let x = e.clientX + p, y = e.clientY + p;
  if (x + r.width > innerWidth - 8) x = e.clientX - r.width - p;
  if (y + r.height > innerHeight - 8) y = Math.max(8, e.clientY - r.height - p);
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = y + 'px';
}
const hideTip = () => { if (tip) tip.style.display = 'none'; };

/* ======================= 00 Bản đồ ngành ======================= */
function chainMap(host) {
  const S = {seg: 'all', flow: 'goods', tk: null, pin: null};
  host.className = 'ac'; host.innerHTML = '';
  const bar = make('div', 'ac-bar');
  bar.innerHTML = `<span class="ac-bar-l">Phân khúc</span><div class="ac-seg" data-k="seg">${SEGS.map(([k, l]) => `<button type="button" data-v="${k}" aria-pressed="${k === 'all'}">${l}</button>`).join('')}</div>
    <span class="ac-bar-l">Hiển thị</span><div class="ac-seg" data-k="flow"><button type="button" data-v="goods" aria-pressed="true">Luồng hàng hóa</button><button type="button" data-v="money" aria-pressed="false">Luồng tiền</button></div>
    <span class="ac-bar-l">Mã niêm yết</span><div class="ac-tk-all"></div>`;
  const hint = make('p', 'ac-hint', 'Kéo ngang để xem đủ chuỗi giá trị →');
  const scroll = make('div', 'ac-scroll'), map = make('div', 'ac-map');
  map.setAttribute('role', 'group'); map.setAttribute('aria-label', 'Sơ đồ chuỗi giá trị ngành ô tô, xe máy');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'ac-svg'); svg.setAttribute('aria-hidden', 'true');
  const detail = make('div', 'ac-detail'); detail.setAttribute('aria-live', 'polite');
  scroll.append(map); host.append(bar, hint, scroll, detail);

  const jvList = DOC.vea?.jv || [];
  const veaAssoc = F.VEA?.['2025']?.assoc;
  function build() {
    const seg = S.seg;
    map.innerHTML = ''; map.append(svg);
    // Hàng 1: VEA → liên doanh, chú giải.
    const vea = make('div', 'ac-box ac-vea', `<div class="t">${icon('pie')}VEA · sở hữu vốn</div><p>Lãi liên doanh vào LN theo tỷ lệ; tiền về là cổ tức${fin(veaAssoc) ? `<br><b>Lãi LD 2025: ${nf(veaAssoc)} tỷ</b>` : ''}</p>`);
    vea.dataset.node = 'vea'; vea.tabIndex = 0;
    const jv = make('div', 'ac-box ac-jv', `<div class="t">Liên doanh (thuộc khâu 02)</div>${jvList.map(j => `<div class="r${seg === 'all' || j.seg.includes(seg) ? '' : ' off'}"><span>${esc(j.short)}</span><b>${nf(j.pct)}%</b></div>`).join('') || '<p>Chưa có số tỷ lệ sở hữu</p>'}`);
    jv.dataset.node = 'jv'; jv.tabIndex = 0;
    const lg = make('div', 'ac-legend', `<span><svg viewBox="0 0 30 10"><line x1="0" y1="5" x2="24" y2="5" stroke="var(--ac-goods)" stroke-width="2"/><path d="M24 1l6 4-6 4z" fill="var(--ac-goods)"/></svg>Hàng hóa, dịch vụ</span>
      <span><svg viewBox="0 0 30 10"><line x1="30" y1="5" x2="6" y2="5" stroke="var(--ac-money)" stroke-width="2"/><path d="M6 1L0 5l6 4z" fill="var(--ac-money)"/></svg>Tiền (bật "Luồng tiền")</span>
      <span><svg viewBox="0 0 30 10"><line x1="0" y1="5" x2="30" y2="5" stroke="var(--ac-eq)" stroke-width="2" stroke-dasharray="4 3"/></svg>Sở hữu vốn</span>
      <span class="muted">Độ dày mũi tên không biểu thị quy mô. Khâu viền xanh: có doanh nghiệp niêm yết tham gia trực tiếp; mã viền nét đứt: chỉ một phần doanh thu gắn với xe. Rê chuột hoặc bấm khâu để xem kinh tế học, KPI, rủi ro.</span>`);
    map.append(vea, jv, lg);
    // Hàng 2: 5 khâu.
    NODES.forEach((n, i) => {
      const cell = make('div', 'ac-cell ac-row2'); cell.style.gridColumn = String(i + 1);
      const tks = tkOf(n.id, seg);
      const node = make('div', 'ac-node' + (tks.some(t => !TK[t].part && !TK[t].eq) || (n.id === 'n2' && seg !== 'ev') ? ' direct' : ''));
      node.dataset.node = n.id; node.tabIndex = 0; node.setAttribute('role', 'button');
      let body = '';
      const lines = n.lines?.[seg] || n.lines?.all || [];
      if (lines.length) body += `<ul>${lines.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
      if (n.ckd) body += `<div class="ac-pills">${(n.ckdTxt[seg] || n.ckdTxt.all).map(x => { const [a, b] = x.split(' · '); return `<span class="ac-pill">${esc(a)} <i>${esc(b)}</i></span>`; }).join('')}</div>`;
      if (n.buyers) body += `<div class="ac-pills" style="flex-direction:column">${(n.pills[seg] || n.pills.all).map(([a, b]) => `<span class="ac-pill">${esc(a)} <i>· ${esc(b)}</i></span>`).join('')}</div>`;
      if (n.brands) body += `<div class="ac-brands">${esc(n.brands[seg] || n.brands.all)}</div>`;
      node.innerHTML = `<div class="h">${icon(n.icon)}<span class="no">${n.no}</span></div><b>${esc(n.t)}</b>${body}`;
      node.setAttribute('aria-label', n.no + ' ' + n.t);
      const tkBox = make('div', 'ac-tks');
      tkBox.innerHTML = tks.length ? tks.map(t => `<button type="button" class="ac-tk${TK[t].part ? ' part' : ''}${TK[t].eq ? ' eq' : ''}" data-tk="${t}" aria-pressed="${S.tk === t}" title="${esc(TK[t].role)}">${t}</button>`).join('')
        : `<span class="ac-none">${esc(n.none?.[seg] || n.none?.all || '')}</span>`;
      cell.append(node, tkBox); map.append(cell);
    });
    // Hàng 3: ghi chú + hậu mãi.
    const after = make('div', 'ac-box ac-after', `<div class="t">${icon('wrench')}Hậu mãi · vòng đời phương tiện</div><div class="items">${AFTER.items.map(x => `<span>${esc(x)}</span>`).join('')}</div><p>Doanh thu lặp lại suốt vòng đời xe: xe đã bán (05) quay lại xưởng dịch vụ đại lý (04), dùng phụ tùng thay thế của nhà sản xuất lốp, ắc quy (01).</p>`);
    after.dataset.node = 'after'; after.tabIndex = 0; map.append(after);
    // Hàng 3 trái: hệ sinh thái.
    const eco = make('div', 'ac-eco', '<div class="l">Hệ sinh thái hỗ trợ · không phải khâu trong chuỗi sản xuất xe</div>');
    ECO.forEach(x => { const b = make('div', 'ac-box', `<div class="t">${icon(x.icon)}${esc(x.t)}</div>`); b.dataset.node = x.id; b.tabIndex = 0; eco.append(b); });
    map.append(eco);
    // Thanh mã.
    const all = [...new Set(Object.entries(TK).filter(([, t]) => t.seg.includes(seg)).map(([k]) => k))];
    bar.querySelector('.ac-tk-all').innerHTML = all.map(t => `<button type="button" class="ac-tk${TK[t].part ? ' part' : ''}${TK[t].eq ? ' eq' : ''}" data-tk="${t}" aria-pressed="${S.tk === t}" title="${esc(TK[t].role)}">${t}</button>`).join('');
    if (S.tk && !all.includes(S.tk)) S.tk = null;
    focusTk(); requestAnimationFrame(draw); showDetail(S.pin || 'n4');
  }

  function infoOf(id) {
    const seg = S.seg;
    const n = NODES.find(x => x.id === id);
    if (n) return {title: `${n.no} · ${n.t}`, d: n.tip[seg] || n.tip.all, tks: tkOf(id, seg)};
    if (id === 'after') return {title: 'Hậu mãi · vòng đời phương tiện', d: AFTER.tip, tks: tkOf('after', seg)};
    if (id === 'vea' || id === 'jv') {
      const v = F.VEA?.['2025'] || {};
      return {title: 'VEA · sở hữu vốn liên doanh', tks: ['VEA'], d: {
        econ: `Phương pháp vốn chủ sở hữu: lãi liên doanh × tỷ lệ sở hữu vào lợi nhuận hợp nhất VEA (2025: ${nf(v.assoc)} tỷ trên LNTT ${nf(v.pbt)} tỷ). Doanh thu bán xe của liên doanh không cộng vào doanh thu VEA (DT hợp nhất 2025: ${nf(v.revenue)} tỷ). Tiền thực nhận là cổ tức liên doanh chia.`,
        kpi: 'Doanh số Honda VN (xe máy, ô tô), Toyota VN, Ford VN · phần lãi liên doanh · cổ tức nhận · cổ tức trả cổ đông',
        risk: seg === 'ev' ? 'Exposure xe điện của VEA là gián tiếp, qua kế hoạch điện hóa của Honda, Toyota, Ford tại Việt Nam.' : 'Thị phần Honda xe máy và ô tô của Toyota, Ford; chính sách chia cổ tức của liên doanh; hạn chế xe máy xăng ở đô thị.'}};
    }
    const e = ECO.find(x => x.id === id); if (e) return {title: e.t, d: e.tip, tks: []};
    return null;
  }
  function tkLine(tks) { return tks.map(t => `<b>${t}</b>: ${esc(TK[t].role)}`).join('<br>'); }
  function showDetail(id) {
    const x = infoOf(id); if (!x) return;
    detail.innerHTML = `<h5>${esc(x.title)}<small>${S.pin ? 'Đang ghim · bấm lại để bỏ' : 'Bấm một khâu để ghim nội dung ở đây'}</small></h5>
      <dl><dt>Kinh tế học</dt><dd>${esc(x.d.econ)}</dd></dl><dl><dt>KPI theo dõi</dt><dd>${esc(x.d.kpi)}</dd></dl><dl><dt>Rủi ro</dt><dd>${esc(x.d.risk)}</dd></dl>
      ${x.tks.length ? `<div class="go"><dl><dt>Doanh nghiệp niêm yết</dt><dd>${tkLine(x.tks)}</dd></dl></div>` : ''}`;
  }
  function focusTk() {
    map.classList.toggle('focus', !!S.tk);
    map.querySelectorAll('[data-node]').forEach(el => el.classList.toggle('hit', !!S.tk && TK[S.tk].nodes.includes(el.dataset.node)));
    host.querySelectorAll('.ac-tk').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tk === S.tk)));
    if (S.tk) {
      const t = TK[S.tk], m = t.model ? ` · <a href="?sub=model#mt1" data-model="${t.model}">Xem mô hình kiếm tiền →</a>` : '';
      detail.innerHTML = `<h5>${S.tk}<small>${t.part ? 'Exposure một phần' : 'Exposure trực tiếp'}</small></h5><dl style="grid-column:2/-1"><dt>Vai trò trong chuỗi</dt><dd>${esc(t.role)}${m}</dd></dl>`;
      detail.querySelector('a[data-model]')?.addEventListener('click', ev => { ev.preventDefault(); openModel(t.model); });
    }
  }

  /* --- Vẽ mũi tên theo vị trí thật của các khối --- */
  function draw() {
    const mr = map.getBoundingClientRect(); if (!mr.width) return;
    hint.style.display = scroll.scrollWidth > scroll.clientWidth + 4 ? 'block' : 'none';
    svg.setAttribute('viewBox', `0 0 ${mr.width} ${mr.height}`);
    const R = id => { const el = map.querySelector(`[data-node="${id}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return {l: r.left - mr.left, r: r.right - mr.left, t: r.top - mr.top, b: r.bottom - mr.top, cx: (r.left + r.right) / 2 - mr.left, cy: (r.top + r.bottom) / 2 - mr.top}; };
    const money = S.flow === 'money';
    const col = money ? 'var(--ac-money)' : 'var(--ac-goods)';
    let out = `<defs>${['goods', 'money', 'eq'].map(k => `<marker id="ac-m-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5 0 10z" fill="var(--ac-${k})"/></marker>`).join('')}</defs>`;
    const line = (pts, c, mk, dash) => `<path d="M${pts.map(p => p.join(',')).join(' L')}" fill="none" stroke="${c}" stroke-width="2" ${dash ? `stroke-dasharray="${dash}"` : ''} ${mk ? `marker-end="url(#ac-m-${mk})"` : ''}/>`;
    const label = (x, y, t, anchor = 'middle', c) => { const w = t.length * 5.6 + 8; const bx = anchor === 'middle' ? x - w / 2 : anchor === 'start' ? x - 4 : x - w + 4; return `<rect class="lbl-bg" x="${bx}" y="${y - 10}" width="${w}" height="14" rx="3"/><text x="${x}" y="${y}" text-anchor="${anchor}" ${c ? `style="fill:${c}"` : ''}>${esc(t)}</text>`; };
    const mk = money ? 'money' : 'goods';
    // Chuỗi chính.
    for (let i = 0; i < 4; i++) {
      const a = R(NODES[i].id), b = R(NODES[i + 1].id); if (!a || !b) continue;
      const y = Math.min(a.t, b.t) + 46;
      const p = money ? [[b.l - 2, y], [a.r + 4, y]] : [[a.r + 2, y], [b.l - 4, y]];
      out += line(p, col, mk);
      const parts = EDGE[NODES[i].id + NODES[i + 1].id][S.flow].split('|'), mid = (a.r + b.l) / 2;
      parts.forEach((t, k) => { out += `<text x="${mid}" y="${y - 7 - (parts.length - 1 - k) * 12}" text-anchor="middle" style="fill:${col}">${esc(t)}</text>`; });
    }
    // Hậu mãi.
    const af = R('after'), n5 = R('n5'), n4 = R('n4'), n1 = R('n1');
    const tk5 = map.querySelector('[data-node="n5"]')?.parentElement.querySelector('.ac-tks')?.getBoundingClientRect();
    const tk4 = map.querySelector('[data-node="n4"]')?.parentElement.querySelector('.ac-tks')?.getBoundingClientRect();
    if (af && n5) { const x = n5.cx, y0 = (tk5 ? tk5.bottom - mr.top : n5.b) + 2; out += line([[x, y0], [x, af.t - 3]], money ? 'var(--ac-money)' : 'var(--ac-after)', money ? 'money' : 'goods'); out += label(x + 6, (y0 + af.t) / 2 + 4, EDGE.n5after[S.flow], 'start', money ? 'var(--ac-money)' : 'var(--ac-after)'); }
    if (af && n4) { const x = n4.cx, y0 = (tk4 ? tk4.bottom - mr.top : n4.b) + 2; const p = money ? [[x, af.t - 2], [x, y0 + 3]] : [[x, y0], [x, af.t - 3]]; out += line(p, money ? 'var(--ac-money)' : 'var(--ac-after)', money ? 'money' : 'goods'); out += label(x + 6, (y0 + af.t) / 2 + 4, EDGE.n4after[S.flow], 'start', money ? 'var(--ac-money)' : 'var(--ac-after)'); }
    const ec = map.querySelector('.ac-eco')?.getBoundingClientRect();
    if (af && n1) { const tk1 = map.querySelector('[data-node="n1"]')?.parentElement.querySelector('.ac-tks')?.getBoundingClientRect(); const y0 = (tk1 ? tk1.bottom - mr.top : n1.b) + 2;
      const y = Math.min(af.t, ec ? ec.top - mr.top : af.t) - 15, xa = af.l + 18;
      const p = money ? [[xa, af.t - 2], [xa, y], [n1.cx, y], [n1.cx, y0 + 3]] : [[n1.cx, y0], [n1.cx, y], [xa, y], [xa, af.t - 3]];
      out += line(p, money ? 'var(--ac-money)' : 'var(--ac-after)', money ? 'money' : 'goods', '5 3'); out += label((n1.cx + xa) / 2, y - 4, EDGE.n1after[S.flow], 'middle', money ? 'var(--ac-money)' : 'var(--ac-after)'); }
    // Sở hữu vốn.
    const vea = R('vea'), jv = R('jv'), n2 = R('n2');
    if (vea && jv) { const y = Math.min(vea.cy, jv.cy);
      out += line([[vea.r + 2, y - 7], [jv.l - 4, y - 7]], 'var(--ac-eq)', 'eq', '5 3');
      out += `<text x="${(vea.r + jv.l) / 2}" y="${y - 12}" text-anchor="middle" style="fill:var(--ac-eq)">vốn</text>`;
      if (money) { out += line([[jv.l - 2, y + 9], [vea.r + 4, y + 9]], 'var(--ac-money)', 'money'); out += `<text x="${(vea.r + jv.l) / 2}" y="${y + 23}" text-anchor="middle" style="fill:var(--ac-money)">cổ tức</text>`; } }
    if (jv && n2) out += line([[jv.cx, jv.b + 2], [n2.cx, n2.t - 4]], 'var(--ac-eq)', null, '5 3');
    svg.innerHTML = out;
  }

  /* --- Tương tác --- */
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tk) { S.tk = S.tk === b.dataset.tk ? null : b.dataset.tk; focusTk(); if (!S.tk) showDetail(S.pin || 'n4'); return; }
    const g = b.parentElement.dataset.k; if (!g) return;
    S[g] = b.dataset.v; b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (g === 'seg') build(); else draw();
  });
  map.addEventListener('click', e => {
    const t = e.target.closest('.ac-tk'); if (t) { S.tk = S.tk === t.dataset.tk ? null : t.dataset.tk; focusTk(); if (!S.tk) showDetail(S.pin || 'n4'); return; }
    const n = e.target.closest('[data-node]'); if (!n) return;
    S.pin = S.pin === n.dataset.node ? null : n.dataset.node;
    map.querySelectorAll('[data-node]').forEach(x => x.classList.toggle('pinned', x.dataset.node === S.pin));
    S.tk = null; focusTk(); showDetail(n.dataset.node);
  });
  map.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-node]')) { e.preventDefault(); e.target.click(); } });
  map.addEventListener('pointerover', e => {
    const n = e.target.closest('[data-node]'); if (!n || e.pointerType === 'touch') return;
    const x = infoOf(n.dataset.node); if (x) showTip(e, tipHtml(x.title, x.d, x.tks.length ? x.tks.join(' · ') : ''));
  });
  map.addEventListener('pointermove', moveTip);
  map.addEventListener('pointerout', e => { if (!e.relatedTarget || !e.relatedTarget.closest?.('[data-node]')) hideTip(); });
  map.addEventListener('focusin', e => { const n = e.target.closest('[data-node]'); if (n && !S.pin && !S.tk) showDetail(n.dataset.node); });
  new ResizeObserver(() => requestAnimationFrame(draw)).observe(map);
  build();
  // Dòng nguồn ở thẻ.
  const card = host.closest('.card');
  if (card && !card.querySelector(':scope>.pw-src')) {
    const s = make('div', 'pw-src', `Nguồn: FinSuccess tổng hợp; ${link(DOC.vea?.jv_source || ['VEA · Báo cáo thường niên 2024', ''])}; ${link(FSRC)}`);
    card.append(s);
    card.append(make('div', 'source-note', 'Sơ đồ mô hình, không biểu thị tỷ trọng. Tỷ lệ sở hữu: ' + esc(DOC.vea?.jv_period || '—') + '. Mã nhà cung cấp (DRC, CSM, SRC, PAC) chỉ một phần doanh thu gắn với ô tô, xe máy; chưa tách tỷ trọng.'));
    card.dataset.refreshStatus = 'loaded';
  }
}

/* ======================= Chart SVG nhỏ ======================= */
const NS = 'http://www.w3.org/2000/svg';
function niceMax(v) { if (v <= 0) return 1; const m = Math.pow(10, Math.floor(Math.log10(v))), n = v / m; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * m; }
// Bề rộng hệ tọa độ theo khung thật (chữ không co quá nhỏ trên mobile); khung ẩn thì ước theo cửa sổ.
const cw = host => Math.round(Math.max(340, Math.min(600, host.clientWidth || host.closest('.ac')?.clientWidth || innerWidth - 60)));
function bindTip(svg) {
  svg.querySelectorAll('[data-tip]').forEach(el => {
    el.addEventListener('pointerenter', e => { const [t, ...rows] = el.dataset.tip.split('|'); showTip(e, `<h5>${esc(t)}</h5>${rows.map(r => `<div>${esc(r)}</div>`).join('')}`); });
    el.addEventListener('pointermove', moveTip); el.addEventListener('pointerleave', hideTip);
  });
}
// Cột nhóm (hoặc chồng) + đường % trục phải (tùy chọn).
function combo(host, o) {
  const W = cw(host), H = o.h || 230, pl = 44, pr = o.line ? 40 : 10, pt = 16, pb = 26, pw = W - pl - pr, ph = H - pt - pb, n = o.cats.length;
  const vals = o.stack ? o.cats.map((_, i) => o.bars.reduce((s, b) => s + Math.max(0, b.values[i] || 0), 0)) : o.bars.flatMap(b => b.values.filter(fin));
  const mins = o.bars.flatMap(b => b.values.filter(fin)).filter(v => v < 0);
  const hiV = Math.max(...vals, 1) * 1.08, loV = mins.length ? Math.min(...mins) * 1.1 : 0, step = niceMax((hiV - loV) / 4);
  const max = Math.ceil(hiV / step) * step, min = Math.floor(loV / step) * step;
  const y = v => pt + ph * (max - v) / (max - min);
  let s = '';
  for (let v = min; v <= max + step / 2; v += step) s += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${nf(v)}</text>`;
  if (min < 0) s += `<line class="axis" x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}"/>`;
  const band = pw / n, nb = o.stack ? 1 : o.bars.length, bw = Math.min(26, band * .7 / nb);
  let lmin = 0, lmax = 1, ly = () => 0;
  if (o.line) { const lv = o.line.values.filter(fin); lmin = Math.min(0, Math.floor(Math.min(...lv) / 5) * 5); lmax = Math.max(5, Math.ceil(Math.max(...lv) / 5) * 5); ly = v => pt + ph * (lmax - v) / (lmax - lmin);
    for (let k = 0; k <= 4; k++) { const v = lmin + (lmax - lmin) * k / 4; s += `<text x="${W - pr + 6}" y="${ly(v) + 3}">${nf(v)}%</text>`; } }
  o.cats.forEach((c, i) => {
    const cx = pl + band * i + band / 2; let acc = 0;
    const rows = [c];
    o.bars.forEach((b, j) => {
      const v = b.values[i]; if (!fin(v)) return; rows.push(`${b.name}: ${nf(v, o.d || 0)} ${o.unit || ''}`);
      let x, y0, y1;
      if (o.stack) { x = cx - bw / 2; y0 = y(acc); y1 = y(acc + v); acc += v; } else { x = cx - nb * bw / 2 + j * bw; y0 = y(0); y1 = y(v); }
      s += `<rect x="${x + 1}" y="${Math.min(y0, y1)}" width="${Math.max(bw - 2, 2)}" height="${Math.max(Math.abs(y0 - y1), 1)}" rx="2" fill="${b.color}"${b.dash ? ` fill-opacity=".35" stroke="${b.color}" stroke-dasharray="3 2"` : ''}/>`;
    });
    if (o.line && fin(o.line.values[i])) rows.push(`${o.line.name}: ${nf(o.line.values[i], 1)}%`);
    s += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${esc(c)}</text><rect x="${pl + band * i}" y="${pt}" width="${band}" height="${ph}" fill="transparent" data-tip="${esc(rows.join('|'))}"/>`;
  });
  if (o.line) {
    const pts = o.cats.map((_, i) => fin(o.line.values[i]) ? [pl + band * i + band / 2, ly(o.line.values[i])] : null);
    let d = '', pen = false; pts.forEach(p => { if (!p) { pen = false; return; } d += (pen ? ' L' : ' M') + p.join(','); pen = true; });
    s += `<path d="${d}" fill="none" stroke="${o.line.color}" stroke-width="2.2"/>` + pts.map((p, i) => p ? `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${o.line.color}" stroke="var(--ac-card)" stroke-width="1.5"/>${i === pts.length - 1 ? `<text class="val" x="${p[0]}" y="${p[1] - 8}" text-anchor="middle" style="fill:${o.line.color}">${nf(o.line.values[i], 1)}%</text>` : ''}` : '').join('');
  }
  const leg = `<div class="ac-leg">${o.bars.map(b => `<span><i style="background:${b.color}${b.dash ? ';opacity:.45' : ''}"></i>${esc(b.name)}</span>`).join('')}${o.line ? `<span><i class="ln" style="background:${o.line.color}"></i>${esc(o.line.name)} (trục phải)</span>` : ''}</div>`;
  host.innerHTML = leg + `<div class="ac-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${s}</svg></div>`;
  bindTip(host.querySelector('svg'));
}
// Thác nước: steps [{l, v, kind:'start'|'delta'|'total', c}]
function waterfall(host, steps, o = {}) {
  const W = cw(host), H = o.h || 240, pl = 44, pr = 10, pt = 22, pb = 40, pw = W - pl - pr, ph = H - pt - pb, n = steps.length;
  let run = 0; const segs = steps.map(st => { if (st.kind === 'delta') { const a = run; run += st.v; return {...st, a, b: run}; } run = st.v; return {...st, a: 0, b: st.v}; });
  const all = segs.flatMap(s => [s.a, s.b]), hiV = Math.max(...all) * 1.08, loV = Math.min(0, ...all) * 1.15, step = niceMax((hiV - loV) / 4);
  const max = Math.ceil(hiV / step) * step, min = Math.floor(loV / step) * step;
  const y = v => pt + ph * (max - v) / (max - min);
  let s = '';
  for (let v = min; v <= max + step / 2; v += step) s += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${nf(v)}</text>`;
  s += `<line class="axis" x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}"/>`;
  const band = pw / n, bw = Math.min(54, band * .62);
  segs.forEach((g, i) => {
    const x = pl + band * i + (band - bw) / 2, y0 = y(Math.max(g.a, g.b)), y1 = y(Math.min(g.a, g.b));
    const c = g.c || (g.kind === 'delta' ? (g.v < 0 ? '#d1583f' : '#27af95') : '#2938A8');
    s += `<rect x="${x}" y="${y0}" width="${bw}" height="${Math.max(y1 - y0, 1.5)}" rx="2" fill="${c}"${g.ghost ? ' fill-opacity=".18" stroke-dasharray="3 2" stroke="' + c + '"' : ''} data-tip="${esc(g.l + '|' + (g.kind === 'delta' && g.v > 0 ? '+' : '') + nf(g.v, 1) + ' tỷ đồng' + (g.note ? '|' + g.note : ''))}"/>`;
    if (i < n - 1 && !g.ghost) s += `<line x1="${x + bw}" x2="${x + band}" y1="${y(g.b)}" y2="${y(g.b)}" stroke="var(--axis,#b9c1d0)" stroke-dasharray="2 2"/>`;
    s += `<text class="val" x="${x + bw / 2}" y="${y0 - 5}" text-anchor="middle">${g.ghost ? 'đã gồm' : (g.kind === 'delta' && g.v > 0 ? '+' : '') + nf(g.v)}</text>`;
    const w = (band < 62 && g.s ? g.s : g.l).split(' '), half = Math.ceil(w.length / 2);
    s += `<text x="${x + bw / 2}" y="${H - 24}" text-anchor="middle">${esc(w.slice(0, half).join(' '))}</text><text x="${x + bw / 2}" y="${H - 12}" text-anchor="middle">${esc(w.slice(half).join(' '))}</text>`;
  });
  host.innerHTML = `<div class="ac-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || 'Cầu lợi nhuận')}">${s}</svg></div>`;
  bindTip(host.querySelector('svg'));
}
// Cột 100%: rows [{l, parts:[{k, v, c}]}]
function stack100(host, rows) {
  const W = cw(host), rh = 30, pl = 120, pr = 10, H = rows.length * (rh + 12) + 10, pw = W - pl - pr;
  let s = '';
  rows.forEach((r, i) => {
    const y = 6 + i * (rh + 12), tot = r.parts.reduce((a, p) => a + (p.v > 0 ? p.v : 0), 0); let x = pl;
    s += `<text x="${pl - 8}" y="${y + rh / 2 + 4}" text-anchor="end" class="val">${esc(r.l)}</text>`;
    r.parts.forEach(p => { if (!(p.v > 0) || !tot) return; const w = pw * p.v / tot; s += `<rect x="${x}" y="${y}" width="${w}" height="${rh}" fill="${p.c}" data-tip="${esc(r.l + '|' + p.k + ': ' + nf(p.v / tot * 100, 1) + '% (' + nf(p.v) + ' tỷ)')}"/>`; if (w > 34) s += `<text x="${x + w / 2}" y="${y + rh / 2 + 4}" text-anchor="middle" style="fill:#fff;font-weight:700">${nf(p.v / tot * 100, 0)}%</text>`; x += w; });
  });
  host.innerHTML = `<div class="ac-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Cơ cấu 100%">${s}</svg></div>`;
  bindTip(host.querySelector('svg'));
}
const spark = (vals, c) => { const v = vals.filter(fin); if (v.length < 2) return ''; const mx = Math.max(...v), mn = Math.min(0, ...v), W = 120, H = 34, bw = W / vals.length;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${vals.map((x, i) => fin(x) ? `<rect x="${i * bw + 1}" y="${H - (x - mn) / (mx - mn || 1) * (H - 4)}" width="${bw - 2}" height="${(x - mn) / (mx - mn || 1) * (H - 4)}" fill="${c}" opacity="${i === vals.length - 1 ? 1 : .45}"/>` : '').join('')}</svg>`; };

/* ======================= 01 Mô hình kiếm tiền ======================= */
const YEARS = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
const g = (t, p, k) => F[t]?.[p]?.[k];
const core = (t, p) => { const r = F[t]?.[p]; return r && [r.gross, r.selling, r.admin].every(fin) ? r.gross - r.selling - r.admin : null; };
const viz = (title, sub, cls = '') => { const v = make('div', 'viz-block ac-v ' + cls); v.innerHTML = `<h4>${esc(title)}</h4><div class="sub">${sub || ''}</div><div class="body"></div>`; return v; };
const srcLine = (v, parts, meta, method) => { v.append(make('div', 'pw-src', 'Nguồn: ' + parts.map(link).join('; ') + (meta ? ' · ' + meta : ''))); if (method) v.append(make('div', 'meth', method)); };
const flow = (steps) => `<div class="ac-flow">${steps.map((s, i) => `${i ? `<span class="ar${s[3] ? ' money' : ''}" aria-hidden="true">→</span>` : ''}<div class="st${s[3] ? ' money' : ''}"><small>${esc(s[0])}</small><b>${esc(s[1])}</b>${s[2] ? `<span>${esc(s[2])}</span>` : ''}</div>`).join('')}</div>`;
const kpis = list => `<div class="ac-kpis">${list.map(([k, has]) => `<span class="${has ? 'has' : 'no'}" title="${has ? 'có số trong BCTC' : 'chưa có nguồn công khai'}">${esc(k)}${has ? '' : ' · chưa có số'}</span>`).join('')}</div>`;
function trans(rows) {
  const t = make('div', 'ac-trans');
  t.innerHTML = `<h4>Truyền dẫn biến số → lợi nhuận<span>cơ chế kinh tế cần kiểm chứng bằng số liệu, không phải dự báo</span></h4>` + rows.map(([c, m, e, w]) => `<div class="ac-tr"><div class="c">${esc(c)}</div><div class="a" aria-hidden="true">→</div><div class="m">${esc(m)}</div><div class="a" aria-hidden="true">→</div><div class="e">${esc(e)}</div><div class="w">${esc(w)}</div></div>`).join('');
  return t;
}

const MODELS = [
  {k: 'mfg', no: '01', t: 'Sản xuất & lắp ráp', who: 'TMT · các hãng xe'},
  {k: 'dealer', no: '02', t: 'Đại lý & phân phối', who: 'HAX · SVC · CTF'},
  {k: 'after', no: '03', t: 'Hậu mãi', who: 'xưởng dịch vụ đại lý, phụ tùng'},
  {k: 'equity', no: '04', t: 'Sở hữu vốn & cổ tức', who: 'VEA'}
];
let openModel = () => {};

function modelsView(host) {
  host.className = 'ac'; host.innerHTML = '';
  const tabs = make('div', 'ac-mtabs'); tabs.setAttribute('role', 'tablist');
  const panes = {};
  MODELS.forEach((m, i) => {
    const b = make('button', 'ac-mtab', `<small>${m.no}</small><b>${esc(m.t)}</b><span>${esc(m.who)}</span>`);
    b.type = 'button'; b.style.setProperty('--mc', MC[m.k]); b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(!i)); b.dataset.m = m.k;
    tabs.append(b);
    const p = make('div', 'ac-model' + (i ? '' : ' on')); p.style.setProperty('--mc', MC[m.k]); p.setAttribute('role', 'tabpanel'); panes[m.k] = p;
  });
  host.append(tabs, ...Object.values(panes));
  const built = {};
  const show = k => {
    tabs.querySelectorAll('.ac-mtab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.m === k)));
    Object.entries(panes).forEach(([kk, p]) => p.classList.toggle('on', kk === k));
    if (!built[k]) { built[k] = true; try { BUILD[k](panes[k]); } catch (e) { console.warn('auto model', k, e); panes[k].append(make('div', 'ac-gap', 'Không dựng được mô hình này.')); } }
  };
  tabs.addEventListener('click', e => { const b = e.target.closest('.ac-mtab'); if (b) show(b.dataset.m); });
  tabs.addEventListener('keydown', e => { if (!/Arrow(Left|Right)/.test(e.key)) return; const bs = [...tabs.children], i = bs.findIndex(b => b.getAttribute('aria-selected') === 'true'), j = (i + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length; bs[j].focus(); show(bs[j].dataset.m); });
  openModel = k => { const btn = [...document.querySelectorAll('.pp-nav button, .pp-nav a, [data-sub]')].find(x => /model/.test(x.dataset.sub || x.getAttribute('href') || '')); if (btn) btn.click(); else location.hash = 'mt1'; show(k); host.scrollIntoView({behavior: 'smooth', block: 'start'}); };
  const want = new URLSearchParams(location.search).get('model');
  show(MODELS.some(m => m.k === want) ? want : 'mfg');
  const card = host.closest('.card');
  if (card && !card.querySelector(':scope>.pw-src')) { card.append(make('div', 'pw-src', `Nguồn: ${link(FSRC)}; BCTC, báo cáo thường niên doanh nghiệp (ghi ở từng hình)`)); card.dataset.refreshStatus = 'loaded'; }
}

const BUILD = {};
BUILD.mfg = p => {
  const L = g('TMT', '2025', 'revenue');
  const v1 = viz('Từ linh kiện đến lợi nhuận hoạt động', 'Nhà lắp ráp bán buôn cho hệ thống đại lý; biên quyết định ở nhà máy', 'full');
  v1.querySelector('.body').innerHTML = flow([['Đầu vào', 'Linh kiện CKD, thép, lốp', 'nhập khẩu theo tỷ giá + nội địa'], ['Nhà máy', 'Hàn, sơn, lắp ráp', 'chi phí cố định: khấu hao, nhân công'], ['Thành phẩm', 'Xe xuất xưởng', 'tồn kho thành phẩm'], ['Doanh thu', 'Bán buôn cho đại lý', 'số xe × giá bán buôn', 1], ['Lợi nhuận', 'LN hoạt động', 'LN gộp − chi phí bán hàng, quản lý', 1]])
    + `<div class="ac-eq"><code><b>Doanh thu</b> = Số xe bán × ASP</code><code><b>LN gộp</b> = Doanh thu − Linh kiện − Chi phí sản xuất</code><code><b>LN hoạt động</b> = LN gộp − Chi phí bán hàng, quản lý</code></div>`
    + kpis([['Số xe bán (năm)', !!DOC.tmt?.units], ['Công suất thiết kế', !!DOC.tmt?.capacity], ['Công suất sử dụng (xấp xỉ)', !!DOC.tmt?.units], ['Doanh thu/xe', !!DOC.tmt?.units], ['Biên lợi nhuận gộp', true], ['Hàng tồn kho', true], ['CAPEX', true]]);
  srcLine(v1, [['FinSuccess tổng hợp', '']], '', 'TMT công bố số xe bán theo năm trong báo cáo thường niên (2024, 2025), không công bố sản lượng sản xuất hay công suất sử dụng theo quý; không tự ước.');
  const tmt = DOC.tmt;
  let v4 = null;
  if (tmt?.units) {
    v4 = viz('TMT: công suất sử dụng và lãi gộp trên mỗi xe', 'xe bán ÷ công suất thiết kế · triệu đồng/xe · năm có số xe bán', 'full');
    const ys = Object.keys(tmt.units).sort();
    v4.querySelector('.body').innerHTML = `<div class="ac-tiles" style="grid-template-columns:repeat(${Math.min(4, ys.length * 2)},minmax(0,1fr))">` + ys.map(y => {
      const u = tmt.units[y], r = F.TMT?.[y] || {}, util = u / tmt.capacity * 100;
      return `<div class="ac-tile"><small>${y} · xe bán / công suất</small><b>${nf(u)}<u>xe · ${nf(util, 0)}%</u></b><em>công suất thiết kế ${nf(tmt.capacity)} xe/năm</em></div>
        <div class="ac-tile"><small>${y} · doanh thu / lãi gộp mỗi xe</small><b>${nf(r.revenue / u * 1000)}<u>tr.đ</u> / ${nf(r.gross / u * 1000, 1)}<u>tr.đ</u></b><em>lãi gộp ${nf(r.gross)} tỷ trên ${nf(u)} xe</em></div>`; }).join('') + '</div>';
    srcLine(v4, [tmt.source, FSRC], 'Kỳ: năm tài chính', `Tự tính. Dùng số xe bán thay cho sản lượng sản xuất (TMT không công bố sản lượng); doanh thu gồm cả phụ tùng, dịch vụ nên doanh thu/xe chỉ là xấp xỉ. ${esc(tmt.capacity_note)}. ${esc(tmt.units_note)}`);
  }
  const v2 = viz('TMT: đòn bẩy hoạt động qua biên gộp', 'tỷ đồng (cột) · % doanh thu (đường) · BCTC hợp nhất năm');
  combo(v2.querySelector('.body'), {cats: YEARS, unit: 'tỷ', bars: [{name: 'Doanh thu thuần', color: '#9aa3c7', values: YEARS.map(y => g('TMT', y, 'revenue'))}, {name: 'LN hoạt động (gộp − BH − QL)', color: MC.mfg, values: YEARS.map(y => core('TMT', y))}],
    line: {name: 'Biên gộp', color: '#c29100', values: YEARS.map(y => { const r = F.TMT?.[y]; return r && fin(r.gross) && r.revenue ? r.gross / r.revenue * 100 : null; })}, aria: 'TMT doanh thu, lợi nhuận hoạt động, biên gộp'});
  srcLine(v2, [FSRC], fsMeta(), `Doanh thu giảm từ ${nf(g('TMT', '2022', 'revenue'))} tỷ (2022) xuống ${nf(L)} tỷ (2025); năm 2024 lãi gộp âm (${nf(g('TMT', '2024', 'gross'))} tỷ).`);
  const v3 = viz('TMT: vốn lưu động và đầu tư', 'tỷ đồng · số dư cuối năm (tồn kho, vay ngắn hạn) và tiền chi CAPEX trong năm');
  combo(v3.querySelector('.body'), {cats: YEARS, unit: 'tỷ', bars: [{name: 'Hàng tồn kho (tổng)', color: MC.mfg, values: YEARS.map(y => g('TMT', y, 'inventory'))}, {name: 'Vay ngắn hạn', color: '#d1583f', values: YEARS.map(y => g('TMT', y, 'st_debt'))}, {name: 'CAPEX', color: '#59C5C8', values: YEARS.map(y => g('TMT', y, 'capex'))}], aria: 'TMT tồn kho, vay ngắn hạn, CAPEX'});
  srcLine(v3, [FSRC], fsMeta(), 'Hàng tồn kho là tổng (linh kiện, bán thành phẩm, thành phẩm); BCTC tóm tắt không tách tồn kho thành phẩm.');
  const grid = make('div', 'ac-mgrid'); grid.append(v1, v2, v3); if (v4) grid.append(v4); p.append(grid);
  p.append(trans([
    ['Tỷ giá USD/VND tăng', 'Giá linh kiện CKD nhập tăng, giá bán buôn khó tăng ngay', 'Biên gộp nhà lắp ráp co lại', 'TMT, các hãng lắp ráp'],
    ['Sản lượng giảm', 'Chi phí cố định dàn trên ít xe hơn', 'LN hoạt động giảm nhanh hơn doanh thu (đòn bẩy hoạt động)', 'TMT'],
    ['Xe nhập CBU giá thấp (ASEAN 0%, Trung Quốc)', 'Cạnh tranh trực tiếp với xe lắp ráp cùng phân khúc', 'Áp lực ASP và thị phần xe lắp ráp', 'TMT, hãng CKD'],
    ['Chuyển dịch sang xe điện', 'Đổi cơ cấu linh kiện (pin, mô-tơ) và thị phần hãng', 'Tác động khác nhau: TMT (xe điện cỡ nhỏ), VEA (liên doanh xe xăng/hybrid), nhà cung cấp lốp, ắc quy', 'TMT · VEA · DRC, CSM, PAC']]));
};

BUILD.dealer = p => {
  const v1 = viz('Dòng hàng và dòng tiền của đại lý', 'xe đi từ hãng qua tồn kho tới khách; tiền thu về sau khi giao xe, trong lúc đó tồn kho được tài trợ bằng vay ngắn hạn', 'full');
  v1.querySelector('.body').innerHTML = flow([['Hãng xe', 'Đặt xe theo chỉ tiêu', 'giá bán buôn − chiết khấu'], ['Nhập kho', 'Thanh toán cho hãng', 'vay ngắn hạn ngân hàng', 1], ['Tồn kho', 'Xe chờ bán', 'lãi vay chạy theo số ngày tồn'], ['Bán xe', 'Giao xe, đăng ký', 'giảm giá cạnh tranh'], ['Thu tiền', 'Khách trả + ngân hàng giải ngân', 'trả nợ vay tồn kho', 1]])
    + `<div class="ac-eq"><code><b>Chênh lệch giá</b> = giá bán lẻ − giá nhập từ hãng</code><code><b>Thưởng doanh số</b>, hỗ trợ bán hàng từ hãng${DOC.dealer_bonus?.policy ? ' · ' + esc(DOC.dealer_bonus.policy) : ' · hạch toán chưa xác minh'}</code><code><b>Hoa hồng</b> giới thiệu bảo hiểm, vay · ${esc(DOC.dealer_bonus?.commission ? 'nhỏ: chỉ SVC có dòng riêng (0,68 tỷ 2025)' : 'nếu có hợp đồng')}</code></div>`
    + kpis([['Số xe bán (SVC, CTF)', !!DOC.dealer_units], ['ASP', false], ['LN gộp/xe (CTF)', !!DOC.dealer_vehicle_gp], ['Biên gộp', true], ['Số ngày tồn kho', true], ['Vay ngắn hạn', true], ['Chi phí lãi vay', true], ['Vòng quay tồn kho', true]]);
  srcLine(v1, [['FinSuccess tổng hợp', '']], '', 'Số xe bán, ASP, LN gộp/xe: HAX, SVC, CTF không công bố đều đặn theo kỳ; không tự ước.');
  // Cầu lợi nhuận.
  const v2 = viz('Cầu lợi nhuận: từ lãi gộp đến lợi nhuận trước thuế', '');
  const pick = make('div', 'ac-pick'); const host2 = make('div'); const note2 = make('div', 'meth');
  const per = [['2025', 'Năm 2025'], [FS.ytd || '9T/2026', FS.ytd || '9T/2026']];
  const st = {t: 'SVC', p: '2025'};
  pick.innerHTML = `<div class="ac-seg" data-k="t">${['HAX', 'SVC', 'CTF'].map(t => `<button type="button" data-v="${t}" aria-pressed="${t === st.t}">${t}</button>`).join('')}</div><div class="ac-seg" data-k="p">${per.map(([k, l]) => `<button type="button" data-v="${k}" aria-pressed="${k === st.p}">${l}</button>`).join('')}</div>`;
  const draw2 = () => {
    const r = F[st.t]?.[st.p]; if (!r) { host2.innerHTML = '<div class="ac-gap">Chưa có số kỳ này.</div>'; return; }
    const cb = r.gross - r.selling - r.admin - r.interest, other = r.pbt - cb;
    v2.querySelector('.sub').innerHTML = `${st.t} · ${st.p} · tỷ đồng · Doanh thu <b>${nf(r.revenue)}</b> − giá vốn <b>${nf(r.cogs)}</b> = LN gộp <b>${nf(r.gross)}</b> (biên ${nf(r.gross / r.revenue * 100, 1)}%)`;
    const B = DOC.dealer_bonus, bonus = B?.rows?.[st.t]?.[st.p];
    const opc = cb + (fin(bonus) ? bonus : 0), rest = r.pbt - opc;
    const steps = [{l: 'LN gộp', s: 'LN gộp', v: r.gross, kind: 'start', c: MC.dealer}];
    if (fin(bonus)) steps.push({l: 'Thưởng từ hãng', s: 'Thưởng', v: bonus, kind: 'delta', c: '#c29100', note: `${B.rows[st.t].label} · ghi ở thu nhập khác, không nằm trong LN gộp`});
    steps.push({l: 'Chi phí bán hàng', s: 'BH', v: -r.selling, kind: 'delta'}, {l: 'Chi phí quản lý', s: 'QL', v: -r.admin, kind: 'delta'}, {l: 'Chi phí lãi vay', s: 'Lãi vay', v: -r.interest, kind: 'delta'},
      {l: 'LNTT từ bán xe, dịch vụ', s: 'LNTT HĐ', v: opc, kind: 'total', c: '#1D2678', note: 'Tự tính = LN gộp' + (fin(bonus) ? ' + thưởng từ hãng' : '') + ' − BH − QL − lãi vay'}, {l: 'Khoản khác', s: 'Khác', v: rest, kind: 'delta', c: '#9aa3c7', note: 'DT tài chính, chi phí tài chính ngoài lãi vay, liên doanh, thu nhập khác còn lại'}, {l: 'LNTT báo cáo', s: 'LNTT', v: r.pbt, kind: 'total', c: '#2938A8'});
    waterfall(host2, steps, {aria: 'Cầu lợi nhuận ' + st.t});
    const chk = (AM.checks || []).find(c => c.ticker === st.t && c.item === 'interest');
    note2.textContent = (fin(bonus) ? `Thưởng, hỗ trợ từ hãng lấy từ thuyết minh thu nhập khác BCTC kiểm toán ${st.p}; bước "Khoản khác" đã trừ phần này nên không cộng hai lần. ${B.note}` : `Kỳ ${st.p} chưa có thuyết minh thưởng từ hãng (BCTC quý không tách); thưởng nằm trong "Khoản khác".`) + ' "Khoản khác" gồm doanh thu tài chính (lãi tiền gửi, lãi đầu tư), chi phí tài chính ngoài lãi vay, phần lãi liên doanh, thu nhập khác còn lại.' + (chk ? ` ${st.t}: chi phí lãi vay cộng 4 quý ${chk.year} (${nf(chk.sum_quarters)} tỷ) khác số năm (${nf(chk.annual)} tỷ); số quý cần đối chiếu.` : '');
  };
  pick.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const k = b.parentElement.dataset.k; st[k] = b.dataset.v; b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw2(); });
  v2.querySelector('.body').append(pick, host2, note2); draw2();
  srcLine(v2, [FSRC, ...Object.values(DOC.dealer_mix || {}).map(m => m.source)], fsMeta());
  // Số xe bán, lãi gộp/xe.
  const U = DOC.dealer_units, vg = DOC.dealer_vehicle_gp || {};
  const v4 = viz('Số xe bán và lãi gộp mảng xe trên mỗi xe', 'xe · triệu đồng/xe · 2024–2025', 'full');
  if (U) {
    const rows = Object.entries(U.rows).map(([t, r]) => {
      const gp = ['2024', '2025'].map(y => vg[t]?.[y] && r[y] ? vg[t][y] / r[y] * 1000 : null);
      return `<div class="ac-tile"><small>${t} · xe bán</small><b>${nf(r['2025'])}<u>xe 2025</u></b><em>2024: ${nf(r['2024'])} xe · ${r['2025'] && r['2024'] ? (r['2025'] >= r['2024'] ? '+' : '') + nf((r['2025'] / r['2024'] - 1) * 100, 1) + '%' : ''} · ${esc(r.note)}</em></div>`
        + (gp[1] ? `<div class="ac-tile"><small>${t} · lãi gộp mảng xe / xe</small><b>${nf(gp[1], 1)}<u>tr.đ 2025</u></b><em>2024: ${nf(gp[0], 1)} tr.đ · chưa gồm thưởng từ hãng</em></div>` : `<div class="ac-tile"><small>${t} · lãi gộp / xe</small><b>—</b><em>không tách được: lãi gộp "kinh doanh xe" gồm cả phụ tùng</em></div>`);
    }).join('');
    v4.querySelector('.body').innerHTML = `<div class="ac-tiles ac-tiles4">${rows}</div>`;
    srcLine(v4, Object.values(U.rows).flatMap(r => [r.src, r.src2]).filter(Boolean).concat([DOC.dealer_mix?.CTF?.source].filter(Boolean)), '', 'Lãi gộp/xe = lãi gộp bộ phận xe ÷ số xe bán (tự tính). ' + esc(U.missing || ''));
  }
  // KPI tồn kho, lãi vay.
  const v3 = viz('Tồn kho và chi phí vốn', 'cuối năm · 2021–2025 · cột đậm là năm gần nhất');
  const yrs = YEARS.slice(-5);
  const tiles = ['HAX', 'SVC', 'CTF'].map(t => {
    const days = yrs.map(y => { const r = F[t]?.[y]; return r && r.cogs ? r.inventory / r.cogs * 365 : null; });
    const icov = yrs.map(y => { const r = F[t]?.[y]; return r && r.gross ? r.interest / r.gross * 100 : null; });
    const debt = yrs.map(y => g(t, y, 'st_debt'));
    return `<div class="ac-tile"><small>${t} · ngày tồn kho</small><b>${nf(days.at(-1))}<u>ngày</u></b>${spark(days, MC.dealer)}<em>${yrs[0]}–${yrs.at(-1)}</em></div>
      <div class="ac-tile"><small>${t} · vay ngắn hạn</small><b>${nf(debt.at(-1))}<u>tỷ</u></b>${spark(debt, '#d1583f')}<em>${yrs[0]}–${yrs.at(-1)}</em></div>
      <div class="ac-tile"><small>${t} · lãi vay / LN gộp</small><b>${nf(icov.at(-1), 1)}<u>%</u></b>${spark(icov, '#c29100')}<em>${yrs[0]}–${yrs.at(-1)}</em></div>`;
  }).join('');
  v3.querySelector('.body').innerHTML = `<div class="ac-tiles">${tiles}</div>`;
  srcLine(v3, [FSRC], fsMeta(), 'Ngày tồn kho = hàng tồn kho cuối năm ÷ giá vốn × 365 (tự tính; tồn kho gồm xe, phụ tùng). Lãi vay / LN gộp: phần lãi gộp dùng để trả lãi vay.');
  const grid = make('div', 'ac-mgrid'); grid.append(v1, v2, v3); if (U) grid.append(v4); p.append(grid);
  p.append(trans([
    ['Lãi suất tăng', 'Người mua trả góp giảm + chi phí tài trợ tồn kho tăng', 'Doanh số và LN đại lý chịu áp lực kép', 'HAX · SVC · CTF'],
    ['Hãng giảm giá xe', 'ASP giảm; xe đã nhập theo giá cũ', 'Biên gộp co lại, có thể phải giảm giá trị tồn kho', 'đại lý tồn kho cao'],
    ['Ưu đãi lệ phí trước bạ', 'Nhu cầu dồn vào kỳ ưu đãi', 'Doanh số tăng trong kỳ, hụt sau khi hết ưu đãi', 'đại lý xe xăng; xe điện miễn đến 2030'],
    ['Hãng đổi chính sách thưởng, chỉ tiêu', 'Thưởng doanh số là phần lớn chênh lệch trên xe mới', 'LN gộp đổi dù số xe không đổi', 'đại lý phụ thuộc một hãng']]));
};

BUILD.after = p => {
  const v1 = viz('Vòng đời khách hàng: một lần bán xe, nhiều lần thu tiền', '', 'full');
  const items = ['Bán xe mới', 'Xe lưu hành', 'Bảo dưỡng định kỳ', 'Sửa chữa, đồng sơn', 'Thay phụ tùng', 'Giữ chân khách · đổi xe'];
  const R = 92, cx = 150, cy = 120;
  let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--ac-line)" stroke-width="10"/>`;
  items.forEach((t, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / items.length, a2 = a + 2 * Math.PI / items.length - .32;
    s += `<path d="M${cx + R * Math.cos(a + .32)},${cy + R * Math.sin(a + .32)} A${R},${R} 0 0 1 ${cx + R * Math.cos(a2)},${cy + R * Math.sin(a2)}" fill="none" stroke="${MC.after}" stroke-width="2.2" marker-end="url(#ac-wh)"/>`;
    const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    s += `<circle cx="${x}" cy="${y}" r="7" fill="${i ? MC.after : '#2938A8'}"/>`;
    const tx = cx + (R + 16) * Math.cos(a), ty = cy + (R + 16) * Math.sin(a) + 4, anc = Math.abs(Math.cos(a)) < .2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
    s += `<text x="${tx}" y="${ty}" text-anchor="${anc}" class="val">${esc(t)}</text>`; });
  s += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" class="val" style="font-size:12px">Xưởng dịch vụ</text><text x="${cx}" y="${cy + 12}" text-anchor="middle">đại lý ủy quyền</text>`;
  v1.querySelector('.body').innerHTML = `<div class="ac-wheel"><div class="ac-chart"><svg viewBox="-60 0 420 245" role="img" aria-label="Vòng đời khách hàng hậu mãi"><defs><marker id="ac-wh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5 0 10z" fill="${MC.after}"/></marker></defs>${s}</svg></div>
    <ul class="ac-drv"><li><b>Doanh thu hậu mãi</b> = xe phục vụ × tần suất × chi tiêu/lượt × tỷ lệ quay lại</li><li><b>Xe phục vụ</b>: xe do đại lý bán còn trong vùng phục vụ, tăng theo số xe bán lũy kế</li><li><b>Tần suất</b>: lịch bảo dưỡng của hãng, số km sử dụng</li><li><b>Chi tiêu/lượt</b>: phụ tùng chính hãng, đồng sơn, phụ kiện</li><li><b>Giữ chân</b>: thường cao trong thời gian bảo hành, giảm khi khách chuyển sang garage ngoài</li></ul></div>`;
  srcLine(v1, [['FinSuccess tổng hợp', '']], '', 'Sơ đồ cơ chế; các đại lý niêm yết không công bố số lượt vào xưởng, chi tiêu/lượt hay tỷ lệ giữ chân.');
  const v2 = viz('Cơ cấu doanh thu và lãi gộp: bán xe so với dịch vụ, phụ tùng', '% · 100% · BCTC (thuyết minh bộ phận/doanh thu) · năm 2025', 'full');
  const mix = DOC.dealer_mix;
  if (mix && Object.keys(mix).length) {
    const rows = [];
    Object.entries(mix).forEach(([t, m]) => {
      const parts = obj => [{k: 'Kinh doanh xe', v: obj.vehicles, c: MC.dealer}, {k: 'Dịch vụ, phụ tùng', v: obj.service, c: MC.after}, {k: 'Khác', v: obj.other, c: '#9aa3c7'}];
      if (m.revenue) rows.push({l: `${t} · DT ${m.period}`, parts: parts(m.revenue)});
      if (m.gross) rows.push({l: `${t} · LN gộp ${m.period}`, parts: parts(m.gross)});
    });
    const b = v2.querySelector('.body'); b.innerHTML = `<div class="ac-leg"><span><i style="background:${MC.dealer}"></i>Kinh doanh xe</span><span><i style="background:${MC.after}"></i>Dịch vụ, phụ tùng</span><span><i style="background:#9aa3c7"></i>Khác</span></div><div></div>`;
    stack100(b.lastElementChild, rows);
    const miss = Object.entries(mix).filter(([, m]) => !m.gross).map(([t]) => t);
    srcLine(v2, Object.values(mix).map(m => m.source).filter(Boolean), 'Đơn vị gốc: tỷ đồng', (miss.length ? `${miss.join(', ')}: không công bố giá vốn theo mảng nên không vẽ cơ cấu lãi gộp. ` : '') + (DOC.dealer_mix_note || ''));
  } else {
    v2.querySelector('.body').innerHTML = '<div class="ac-gap">Chưa có số tách mảng bán xe / dịch vụ, phụ tùng từ BCTC của HAX, SVC, CTF trong nguồn đã mở. Không giả định cơ cấu.</div>';
    srcLine(v2, [['BCTC kiểm toán HAX, SVC, CTF', '']], '', '');
  }
  const grid = make('div', 'ac-mgrid'); grid.append(v1, v2); p.append(grid);
  p.append(trans([
    ['Số xe lưu hành tăng', 'Tập khách cần bảo dưỡng, sửa chữa lớn hơn', 'Cơ hội mở rộng doanh thu hậu mãi, ít phụ thuộc chu kỳ xe mới', 'HAX · SVC · CTF'],
    ['Xe điện tăng tỷ trọng', 'Ít hạng mục bảo dưỡng (dầu, lọc, côn) hơn xe xăng', 'Chi tiêu/lượt có thể giảm; lốp, đồng sơn vẫn còn', 'đại lý; CSM, DRC (lốp)'],
    ['Hết bảo hành', 'Khách chuyển sang garage ngoài giá thấp', 'Tỷ lệ giữ chân giảm theo tuổi xe', 'xưởng dịch vụ đại lý'],
    ['Giá cao su, chì tăng', 'Giá lốp, ắc quy thay thế tăng chậm hơn chi phí', 'Biên nhà sản xuất phụ tùng thay thế co lại', 'DRC · CSM · SRC · PAC']]));
};

BUILD.equity = p => {
  const jv = DOC.vea?.jv || [], v25 = F.VEA?.['2025'] || {};
  const v1 = viz('Lợi nhuận kế toán: phần lãi theo tỷ lệ sở hữu', 'phương pháp vốn chủ sở hữu · doanh thu bán xe của liên doanh không vào doanh thu VEA', 'full');
  const W = 760, H = 190;
  let s = '';
  jv.forEach((j, i) => { const y = 14 + i * 56; s += `<rect x="4" y="${y}" width="170" height="44" rx="10" fill="var(--ac-card)" stroke="${MC.equity}" stroke-dasharray="5 3"/><text x="16" y="${y + 19}" class="val" style="font-size:12px">${esc(j.name)}</text><text x="16" y="${y + 35}">${esc(j.note.split(' · ')[0])}</text>
    <path d="M176 ${y + 22} L${300} ${y + 22} L330 95" fill="none" stroke="${MC.equity}" stroke-width="2" stroke-dasharray="5 3"/><rect x="208" y="${y + 12}" width="52" height="20" rx="10" fill="${MC.equity}"/><text x="234" y="${y + 26}" text-anchor="middle" style="fill:#fff;font-weight:800">${nf(j.pct)}%</text>`; });
  s += `<rect x="334" y="62" width="180" height="66" rx="10" fill="color-mix(in srgb, ${MC.equity} 8%, var(--ac-card))" stroke="${MC.equity}"/><text x="424" y="86" text-anchor="middle" class="val" style="font-size:12px">Phần lãi liên doanh</text><text x="424" y="104" text-anchor="middle">LN sau thuế LD × tỷ lệ</text><text x="424" y="120" text-anchor="middle" class="val" style="fill:${MC.equity}">2025: ${nf(v25.assoc)} tỷ</text>
    <path d="M516 95 L572 95" stroke="${MC.equity}" stroke-width="2" marker-end="url(#ac-eqm)"/>
    <rect x="576" y="50" width="180" height="90" rx="10" fill="var(--ac-card)" stroke="#2938A8"/><text x="666" y="72" text-anchor="middle" class="val" style="font-size:12px">LN hợp nhất VEA</text><text x="666" y="90" text-anchor="middle">LNTT 2025: ${nf(v25.pbt)} tỷ</text><text x="666" y="106" text-anchor="middle">trong đó lãi LD ${fin(v25.assoc) && v25.pbt ? nf(v25.assoc / v25.pbt * 100, 0) : '—'}%</text><text x="666" y="124" text-anchor="middle">DT hợp nhất chỉ ${nf(v25.revenue)} tỷ</text>`;
  v1.querySelector('.body').innerHTML = `<div class="ac-chart" style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" style="min-width:560px" role="img" aria-label="Sơ đồ lợi nhuận liên doanh vào VEA"><defs><marker id="ac-eqm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5 0 10z" fill="${MC.equity}"/></marker></defs>${s}</svg></div>`;
  srcLine(v1, [DOC.vea?.jv_source, FSRC].filter(Boolean), 'Tỷ lệ sở hữu: ' + esc(DOC.vea?.jv_period || '—'), (DOC.vea?.jv_profit_by_brand_note || '') + ' ' + (DOC.vea?.audit_note || ''));
  // Dòng tiền.
  const v2 = viz('Dòng tiền thực nhận: cổ tức liên doanh → tiền VEA → cổ tức cổ đông', 'tách khỏi lợi nhuận kế toán', 'full');
  const dv = DOC.vea?.dividends_by_jv, last = dv ? Object.keys(dv.rows).filter(k => /^\d{4}$/.test(k)).sort().at(-1) : null, dps = DOC.vea?.dps?.rows || [];
  const d25 = dps.find(r => r.fy === '2025'), d24 = dps.find(r => r.fy === '2024');
  v2.querySelector('.body').innerHTML = flow([['Liên doanh', 'Honda VN, Toyota VN, Ford VN', 'chia cổ tức theo quyết định HĐQT liên doanh'], ['Cổ tức thực nhận', last ? `${nf(dv.rows[last].reduce((a, b) => a + b, 0))} tỷ (${last}, theo báo chí)` : 'chưa có số', 'tiền về công ty mẹ', 1], ['Tiền mặt VEA', `tiền + đầu tư ngắn hạn cuối 2025: ${nf((v25.cash || 0) + (v25.st_invest || 0))} tỷ`, 'gửi ngân hàng sinh lãi', 1], ['Cổ tức cổ đông', d25 ? `${nf(d25.dps)} đ/cp năm TC 2025 (~${nf(d25.total)} tỷ)` : '—', d25 ? 'chi ' + d25.paid : '', 1]]);
  srcLine(v2, [dv?.source, d25?.src, FSRC].filter(Boolean), '', 'Không đồng nhất phần lãi liên doanh (kế toán) với cổ tức thực nhận (tiền).');
  // Chart 1: phần lãi LD vs LN hoạt động trực tiếp.
  const v3 = viz('Lãi liên doanh so với kinh doanh trực tiếp', 'tỷ đồng · BCTC hợp nhất năm');
  combo(v3.querySelector('.body'), {cats: YEARS, unit: 'tỷ', bars: [{name: 'Phần lãi liên doanh, liên kết', color: MC.equity, values: YEARS.map(y => g('VEA', y, 'assoc'))}, {name: 'LN hoạt động trực tiếp (gộp − BH − QL)', color: '#2938A8', values: YEARS.map(y => core('VEA', y))}], aria: 'VEA lãi liên doanh và lợi nhuận hoạt động trực tiếp'});
  const neg = YEARS.filter(y => (core('VEA', y) ?? 0) < 0);
  srcLine(v3, [FSRC], fsMeta(), 'LN hoạt động trực tiếp = LN gộp − chi phí bán hàng − chi phí quản lý (tự tính); mảng trực tiếp (động cơ, máy nông nghiệp, cơ khí) ' + (neg.length === YEARS.length ? `lỗ ở cả ${neg.length} năm ${YEARS[0]}–${YEARS.at(-1)}.` : neg.length ? `lỗ ở ${neg.join(', ')}.` : 'nhỏ so với lãi liên doanh.'));
  // Chart 2: cổ tức nhận theo hãng.
  const v4 = viz('Cổ tức thực nhận theo liên doanh', dv ? `${dv.unit} · ${esc(dv.scope)}` : '');
  if (dv) {
    const cats = Object.keys(dv.rows), cols = ['#861C52', '#2938A8', '#59C5C8'];
    combo(v4.querySelector('.body'), {cats, unit: 'tỷ', stack: true, bars: dv.cols.map((c, i) => ({name: c, color: cols[i], values: cats.map(k => dv.rows[k][i])})), aria: 'Cổ tức VEA nhận theo liên doanh'});
    srcLine(v4, [dv.source, dv.source2].filter(Boolean), '', dv.conflict + ' 6T/2026 là nửa năm, chưa so được với cả năm.');
  } else v4.querySelector('.body').innerHTML = '<div class="ac-gap">Chưa có số cổ tức theo liên doanh.</div>';
  // Chart 3: tiền: thu lãi + cổ tức vs cổ tức trả.
  const v5 = viz('Tiền thu cổ tức, lãi và cổ tức VEA trả', 'tỷ đồng · lưu chuyển tiền tệ hợp nhất năm');
  combo(v5.querySelector('.body'), {cats: YEARS, unit: 'tỷ', bars: [{name: 'Tiền thu lãi, cổ tức, LN được chia', color: '#27af95', values: YEARS.map(y => g('VEA', y, 'cash_div_int_recv'))}, {name: 'Cổ tức đã trả cổ đông', color: '#c29100', values: YEARS.map(y => g('VEA', y, 'dividends_paid'))}], aria: 'VEA tiền thu cổ tức và cổ tức trả'});
  srcLine(v5, [FSRC], fsMeta(), 'Dòng "tiền thu lãi, cổ tức" gồm cả lãi tiền gửi, không chỉ cổ tức liên doanh. Cổ tức trả theo năm chi tiền (năm TC trước chi vào tháng 12 năm sau).');
  // Chart 4: DPS.
  const v6 = viz('Cổ tức tiền VEA trả cổ đông theo năm tài chính', 'đồng/cổ phiếu');
  if (dps.length) {
    combo(v6.querySelector('.body'), {cats: dps.map(r => 'NTC ' + r.fy), unit: 'đ/cp', bars: [{name: 'Cổ tức tiền (đ/cp)', color: '#c29100', values: dps.map(r => r.dps)}], aria: 'Cổ tức tiền VEA theo năm tài chính', h: 200});
    srcLine(v6, dps.map(r => r.src), 'Ngày chi: ' + dps.map(r => `NTC ${r.fy} ${r.paid}`).join(', '), d24 && d25 ? `Tổng tiền: ${dps.map(r => `NTC ${r.fy} ~${nf(r.total)} tỷ`).join(', ')}.` : '');
  }
  const grid = make('div', 'ac-mgrid'); grid.append(v1, v2, v3, v4, v5, v6); p.append(grid);
  p.append(trans([
    ['Doanh số Honda VN (xe máy) giảm', 'LN Honda VN giảm; 30% thuộc VEA', 'Phần lãi LD và cổ tức nhận giảm theo độ trễ chia cổ tức', 'VEA'],
    ['Hạn chế xe máy xăng ở nội đô', 'Cơ cấu chuyển sang xe máy điện, nơi Honda chưa dẫn đầu', 'Rủi ro dài hạn cho nguồn lãi lớn nhất của VEA', 'VEA'],
    ['Liên doanh giữ lại tiền thay vì chia', 'Phần lãi kế toán vẫn ghi nhận, tiền chưa về', 'Cổ tức VEA trả cổ đông có thể không tăng theo lãi', 'VEA'],
    ['Lãi suất tiền gửi giảm', 'Thu lãi trên số dư tiền, đầu tư ngắn hạn lớn giảm', 'Doanh thu tài chính giảm, ảnh hưởng nhỏ hơn lãi LD', 'VEA']]));
};

/* ======================= Khởi động ======================= */
function init() {
  const a = document.getElementById('chAutoChain'), b = document.getElementById('chAutoModels');
  try { if (a && !a.dataset.acDone) { a.dataset.acDone = '1'; chainMap(a); } } catch (e) { console.warn('auto chain', e); }
  try { if (b && !b.dataset.acDone) { b.dataset.acDone = '1'; modelsView(b); } } catch (e) { console.warn('auto models', e); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
window.addEventListener('scroll', hideTip, {passive: true});
})();
