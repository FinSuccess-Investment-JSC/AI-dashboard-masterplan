/* BĐS KCN · Tổng quan ngành (#mt1), 3 sub-tab (26/11/2026: 02 Doanh nghiệp niêm yết dời sang tab lớn Tài chính ngành #mt14) theo mẫu trang Điện (power-overview.js), 25/11/2026:
   00 Bản đồ ngành (chỉ chuỗi giá trị) · 01 Chuỗi giá trị theo mô hình kinh doanh · 02 Doanh nghiệp niêm yết
   (so sánh tài chính & định giá, bảng doanh nghiệp) · 03 Triển vọng (nguồn cung mới 2026–2028, điều kiện đổi chiều, chính sách).
   Nội dung lấy từ các khối đã dựng sẵn (research-layout.js: lộ trình, mô hình kinh doanh, so sánh tài chính; kcn-brief.js: chuỗi giá trị)
   và workbook KCN (window.KcnWS từ kcn-workspace.js). Thêm mục "Dữ liệu khu công nghiệp" vào tab Nguồn dữ liệu.
   Không tạo số khi thiếu dữ liệu. Deep-link: ?ov=<map|model|companies|forward>#mt1. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'industrial') return;
const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 0) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const gap = t => el('p', 'pp-gap data-gap', 'Chưa có dữ liệu: ' + t);
const refit = root => setTimeout(() => { window.dispatchEvent(new Event('resize')); (root || document).querySelectorAll('canvas').forEach(c => { const ch = window.Chart?.getChart?.(c); if (ch) ch.resize(); }); }, 30);
function sec(id, num, q, body, opts = {}) {
  const s = el('section', 'ov-sec'); s.id = 'ov-' + id;
  s.innerHTML = `<header class="ov-sh"><span class="ov-num">${esc(num)}</span><div><h3>${esc(q)}</h3>${opts.sub ? `<p>${opts.sub}</p>` : ''}</div></header>`;
  [].concat(body).filter(Boolean).forEach(n => s.append(typeof n === 'string' ? el('div', '', n) : n));
  if (opts.method) s.append(el('details', 'ov-an ov-method', `<summary>Dữ liệu & phương pháp</summary><div>${opts.method}</div>`));
  return s;
}
const block = id => document.querySelector(`[data-block-id="${id}"]`);

/* ---------- 00 · Bản đồ ngành ---------- */
// 26/11/2026 (người dùng): Bản đồ ngành chỉ gồm chuỗi giá trị; KCN không có số toàn hệ thống tương đương "% công suất nguồn" của Điện.
function mapPane(p) {
  const vc = block('kcn-01');
  if (vc) { vc.closest('.grid')?.classList.remove('grid'); }
  p.append(vc ? sec('chain', '0.1', 'Đất, vốn và khách thuê đi qua những ai?', vc, {sub: 'Ba lớp bật/tắt được: luồng đất và hạ tầng, luồng hợp đồng và thanh toán, luồng pháp lý và phê duyệt. Bấm một bên để xem việc họ làm, ai trả tiền cho ai, điều kiện mở bước tiếp theo và các mã niêm yết.'}) : gap('chưa dựng được sơ đồ chuỗi giá trị.'));
}

/* ---------- 01 · Chuỗi giá trị theo mô hình kinh doanh (26/11/2026) ----------
   1.1 Ba bước từ đất đến doanh thu (quy trình chung) → 1.2 bốn mô hình cùng một khung → 1.3 tiện ích và dịch vụ →
   1.4 doanh nghiệp đa ngành → 1.5 ghi nhận doanh thu theo chính sách kế toán từng doanh nghiệp (data/kcn/company-policy.json). */
const MODELS = [
  ['Cho thuê đất', 'KBC • IDC • SZC • LHG • NTC • D2D • TIP • VGC • BCM • SIP'],
  ['Nhà xưởng, nhà kho xây sẵn', 'IDC • LHG • SIP'],
  ['Tiện ích và dịch vụ', 'SIP • IDC'],
  ['Doanh nghiệp đa ngành', 'BCM • VGC; KBC, IDC, D2D, SIP có mảng ngoài KCN']
];
const MODEL_ROWS = [
  ['Ai trả tiền', 'Nhà máy thuê lại đất: doanh nghiệp FDI, doanh nghiệp trong nước', 'Doanh nghiệp thuê nhà xưởng, kho: sản xuất quy mô vừa, logistics', 'Nhà máy đang vận hành trong KCN', 'Khách của từng mảng: khách thuê KCN, người mua nhà, khách mua vật liệu, bên mua điện'],
  ['Doanh thu tính theo', 'Diện tích (m²) × giá thuê cho cả thời hạn còn lại; thêm phí quản lý hạ tầng theo m²/năm', 'm² × giá thuê mỗi tháng', 'Sản lượng điện, nước, nước thải × đơn giá; phí quản lý theo m²', 'Cộng các mảng, mỗi mảng một đơn vị riêng'],
  ['Vốn bỏ vào đâu', 'Bồi thường, tiền thuê đất trả Nhà nước, hạ tầng kỹ thuật (thường nằm ở chi phí dở dang, hàng tồn kho hoặc bất động sản đầu tư)', 'Xây nhà xưởng, kho (bất động sản đầu tư)', 'Trạm điện, trạm xử lý nước thải, mạng cấp nước (tài sản cố định)', 'Theo từng mảng; vốn cho KCN cạnh tranh với đô thị, vật liệu, hạ tầng giao thông'],
  ['Khi nào thu tiền', 'Đặt cọc khi ký, phần lớn thu theo tiến độ hợp đồng trước hoặc khi bàn giao đất', 'Hằng tháng hoặc hằng quý, kèm tiền cọc', 'Hằng tháng', 'Theo từng mảng'],
  ['Khi nào ghi nhận doanh thu', 'Khi bàn giao: một lần nếu đủ điều kiện ghi nhận một lần, hoặc phân bổ đều theo thời hạn thuê, tùy chính sách kế toán từng doanh nghiệp (mục 1.5)', 'Phân bổ theo thời gian thuê', 'Khi cung cấp dịch vụ', 'Theo chính sách của từng mảng'],
  ['Chỉ tiêu quyết định biên', 'Giá thuê so với chi phí đất và hạ tầng trên mỗi m² thương phẩm; đất vào sổ sớm có giá vốn thấp', 'Lấp đầy và giá thuê/m² so với chi phí xây', 'Chênh lệch giá bán và giá mua điện, nước; số nhà máy đang vận hành', 'Cơ cấu doanh thu giữa các mảng và biên từng mảng (khi có báo cáo bộ phận)']
];
let POLICY = null; const policyReady = fetch(new URL('../data/kcn/company-policy.json', document.baseURI), {cache: 'no-cache'}).then(r => r.ok ? r.json() : null).then(j => (POLICY = j)).catch(() => null);
const METHOD = {one_off: 'Ghi nhận một lần', straight_line: 'Phân bổ theo thời hạn thuê', mixed: 'Một lần hoặc phân bổ, tùy hợp đồng', as_delivered: 'Khi cung cấp dịch vụ'};
function policyTable(host, tickers, cols) {
  policyReady.then(() => {
    const rows = (POLICY?.companies || []).filter(c => !tickers || tickers.includes(c.ticker));
    if (!rows.length) { host.replaceChildren(gap('chưa có bảng chính sách kế toán từng doanh nghiệp (data/kcn/company-policy.json).')); return; }
    const src = c => c.source?.url ? `<a href="${esc(c.source.url)}" target="_blank" rel="noopener">${esc(c.source.doc || 'BCTC')} ↗</a>${c.source.pages ? ` <span class="kc-na">${esc(c.source.pages)}</span>` : ''}` : '<span class="kc-na">Chưa có nguồn</span>';
    const cell = {
      land: c => c.land_lease_recognition?.method ? `<b>${esc(METHOD[c.land_lease_recognition.method] || c.land_lease_recognition.method)}</b>${c.land_lease_recognition.quote ? `<br><span class="kc-na">“${esc(c.land_lease_recognition.quote)}”${c.land_lease_recognition.ref ? ` · ${esc(c.land_lease_recognition.ref)}` : ''}</span>` : ''}` : '<span class="kc-na">Chưa xác minh</span>',
      unearned: c => c.unearned_revenue ? (c.unearned_revenue.present ? `Có${fin(c.unearned_revenue.amount_bn) ? ` · ${nf(c.unearned_revenue.amount_bn)} tỷ đ` : ''}${c.unearned_revenue.period ? ` <span class="kc-na">${esc(c.unearned_revenue.period)}</span>` : ''}` : 'Không trình bày') : '<span class="kc-na">—</span>',
      seg: c => c.segments?.names?.length ? `${c.segments.names.map(esc).join(' · ')}<br><span class="kc-na">${c.segments.revenue ? 'có doanh thu' : 'không có doanh thu'}${c.segments.gross_profit ? ', lợi nhuận gộp' : c.segments.segment_result ? ', ' + esc((c.segments.result_label || 'kết quả bộ phận').toLowerCase()) : ''} theo mảng${c.segments.period ? ' · ' + esc(c.segments.period) : ''}</span>` : '<span class="kc-na">Không công bố báo cáo bộ phận hoặc chưa xác minh</span>',
      util: c => c.utility_recognition?.method || c.utility_recognition?.quote ? esc(c.utility_recognition.quote || METHOD[c.utility_recognition.method] || '') : '<span class="kc-na">—</span>'
    };
    const head = {land: 'Doanh thu cho thuê đất', unearned: 'Doanh thu chưa thực hiện', seg: 'Báo cáo bộ phận', util: 'Doanh thu tiện ích, dịch vụ'};
    host.innerHTML = `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Mã</th>${cols.map(k => `<th>${head[k]}</th>`).join('')}<th>Nguồn</th></tr></thead><tbody>${rows.map(c => `<tr><td><button type="button" class="pv-chip" data-code="${esc(c.ticker)}">${esc(c.ticker)}</button></td>${cols.map(k => `<td>${cell[k](c)}</td>`).join('')}<td>${src(c)}${c.gaps ? `<br><span class="kc-na">Còn thiếu: ${esc(c.gaps)}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>` +
      (POLICY.general_rule && cols.includes('land') ? `<p class="ov-cap">Quy tắc chung (${POLICY.general_rule.url ? `<a href="${esc(POLICY.general_rule.url)}" target="_blank" rel="noopener">${esc(POLICY.general_rule.citation || 'văn bản')} ↗</a>` : esc(POLICY.general_rule.citation || '')}): ${esc(POLICY.general_rule.summary || POLICY.general_rule.text || '')}${POLICY.general_rule.caveat ? ` <span class="kc-na">${esc(POLICY.general_rule.caveat)}</span>` : ''}</p>` : '') +
      `<p class="kc-na">Kiểm ${esc((POLICY.checked || '').split('-').reverse().join('/'))} từ BCTC kiểm toán; ô "chưa xác minh" là chưa tìm được văn bản gốc.</p>`;
  });
}
function modelPane(p, pane) {
  const bm = pane.querySelector('.business-models'), road = pane.querySelector('.research-roadmap');
  if (road) road.querySelector(':scope>h2')?.remove();
  const tbl = el('div', 'card ov-models', `<div class="tablewrap" data-no-fold><table class="kc-t ov-mt" data-no-fold><thead><tr><th></th>${MODELS.map(([t, c]) => `<th>${esc(t)}<br><span class="kc-na">${esc(c)}</span></th>`).join('')}</tr></thead><tbody>${MODEL_ROWS.map(r => `<tr><th>${esc(r[0])}</th>${r.slice(1).map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="pw-src">Nguồn: cơ chế chung từ BCTN, BCTC doanh nghiệp; điều khoản cụ thể theo hợp đồng và chính sách kế toán từng doanh nghiệp (mục 1.5)</div>`);
  const util = el('div', 'card');
  util.innerHTML = `<p>Doanh thu tiện ích (phân phối điện, cấp nước, xử lý nước thải, phí quản lý) tăng theo số nhà máy đã vận hành chứ không theo diện tích ký mới, nên ổn định hơn doanh thu cho thuê đất và đi sau bàn giao vài năm. Mảng này cần hạ tầng riêng (trạm điện, trạm xử lý nước thải) và biên phụ thuộc chênh giá mua – bán điện, nước.</p><div class="ov-pol"></div>`;
  policyTable(util.querySelector('.ov-pol'), ['SIP', 'IDC'], ['util', 'seg']);
  const multi = el('div', 'card');
  multi.innerHTML = `<p>Với doanh nghiệp có mảng ngoài KCN, tăng trưởng hay biên hợp nhất chỉ được quy về KCN khi có báo cáo bộ phận. Bảng dưới ghi các mảng doanh nghiệp tự công bố; nếu chỉ có số hợp nhất, số ở tab Tài chính ngành là số toàn doanh nghiệp.</p><div class="ov-pol"></div><p class="ov-cap"><a class="ov-more" href="?fin=fin#mt14" data-ov-fin="fin">Số hợp nhất theo quý ở Tài chính ngành →</a></p>`;
  policyTable(multi.querySelector('.ov-pol'), ['BCM', 'VGC', 'KBC', 'IDC', 'D2D', 'SIP'], ['seg']);
  const rec = el('div', 'card'); rec.innerHTML = '<div class="ov-pol"></div>';
  policyTable(rec.querySelector('.ov-pol'), null, ['land', 'unearned']);
  p.append(
    road ? sec('steps', '1.1', 'Ba bước từ đất đến doanh thu', road, {sub: 'Quy trình chung của mọi mô hình: đất và đền bù → vốn và hạ tầng → cho thuê và bàn giao.'}) : null,
    sec('models', '1.2', 'Mỗi mô hình thu tiền từ ai, khi nào, và ghi nhận doanh thu ra sao?', tbl, {sub: 'Bốn mô hình trên cùng một khung: ai trả tiền, đơn vị tính doanh thu, vốn bỏ vào đâu, khi nào thu tiền, khi nào ghi nhận doanh thu, chỉ tiêu quyết định biên.'}),
    sec('utility', '1.3', 'Tiện ích và dịch vụ kiếm tiền thế nào?', util),
    sec('multi', '1.4', 'Doanh nghiệp đa ngành: mảng KCN đóng góp bao nhiêu?', multi),
    sec('recog', '1.5', 'Từng doanh nghiệp ghi nhận doanh thu cho thuê đất theo cách nào?', rec, {sub: 'Theo thuyết minh chính sách kế toán trong BCTC kiểm toán. Cùng một hợp đồng, doanh nghiệp ghi nhận một lần sẽ có lợi nhuận dồn vào quý bàn giao; doanh nghiệp phân bổ có lợi nhuận đều và số dư doanh thu chưa thực hiện lớn.'})
  );
  bm?.remove();
}

/* ---------- Tab lớn Tài chính ngành › 02 Doanh nghiệp niêm yết (26/11/2026) ----------
   So sánh nhanh (định giá theo phiên) → Lịch sử theo kỳ và bảng chi tiết (khối so sánh tài chính) → Biến quyết định từng mã.
   Ngày định giá ghi riêng với kỳ BCTC. Định giá dời từ Quỹ đất về đây (thẻ bds-41), dùng cùng nguồn VNDirect. */
const WATCH = { // biến cần theo dõi gắn với kết quả; số lấy từ BCTC quý (KCN_FIN) và BCTN (KCN_MARKET) lúc dựng
  KBC: 'Diện tích bàn giao trong quý: tiền khách trả trước chờ bàn giao chuyển thành doanh thu khi bàn giao',
  IDC: 'Diện tích ký mới so kế hoạch năm và tiến độ đất sạch các dự án mới',
  SZC: 'Doanh thu chưa thực hiện được phân bổ và diện tích ký mới tại KCN Châu Đức',
  SIP: 'Lợi nhuận tiện ích (điện, nước) và doanh thu chưa thực hiện phân bổ hằng năm',
  LHG: 'Quỹ đất thương phẩm còn lại và tiến độ dự án mới',
  NTC: 'Doanh thu chưa thực hiện được phân bổ và tiến độ đất sạch dự án mở rộng',
  D2D: 'Bàn giao dự án dân cư và đất thuê lại trong KCN Châu Đức',
  TIP: 'Phần lợi nhuận từ công ty liên kết và quỹ đất còn lại',
  BCM: 'Tiến độ hạ tầng KCN Cây Trường và bán đất đô thị; nợ vay',
  VGC: 'Tách lợi nhuận KCN khỏi vật liệu xây dựng (báo cáo bộ phận)'
};
function companiesPane(p, pane) {
  const fc = pane.querySelector('.financial-comparison'), val = block('bds-41');
  const F = window.KCN_FIN, V = window.COMPANY_VALUATION?.companies || {}, M = window.KCN_MARKET;
  const lastP = t => { const d = F?.data?.[t]; if (!d) return null; for (let i = F.periods.length - 1; i >= 0; i--) if (d.revenue[i] != null) return {p: F.periods[i], i}; return null; };
  const at = (t, k, i) => F?.data?.[t]?.[k]?.[i];
  const dmy = s => s ? s.split('-').reverse().join('/') : '—', QLb = p => String(p || '').replace(/^(\d{4})Q([1-4])$/, 'Q$2/$1');
  const tickers = (F?.companies || []).map(c => c.ticker);
  const quick = el('div', 'card', `<div class="kc-qv">${tickers.map(t => { const v = V[t], l = lastP(t); return `<div class="kc-qv-t"><button type="button" class="pv-chip" data-code="${t}">${t}</button><b>${v && fin(v.pb) ? nf(v.pb, 2) + 'x P/B' : '—'}</b><span>${v && fin(v.pe) ? nf(v.pe, 1) + 'x P/E' : 'P/E —'}</span><small>định giá ${dmy(v?.date)} · BCTC ${QLb(l?.p)}</small></div>`; }).join('')}</div><p class="ov-cap">P/E, P/B của VNDirect tại ngày định giá (giá đóng cửa phiên), EPS và giá trị sổ sách theo BCTC gần nhất; ngày định giá và kỳ BCTC ghi riêng.</p><div class="pw-src">Nguồn: <a href="https://dstock.vndirect.com.vn/" target="_blank" rel="noopener">VNDirect</a></div>`);
  const watch = el('div', 'card');
  watch.innerHTML = `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Mã</th><th>Biến cần theo dõi</th><th>Số kiểm tra được (BCTC ${QLb(F?.periods?.at(-1))})</th><th>Kiểm tra ở đâu</th></tr></thead><tbody>${tickers.map(t => { const l = lastP(t), i = l?.i, une = (at(t, 'unearned_st', i) || 0) + (at(t, 'unearned_lt', i) || 0), adv = at(t, 'adv_customers', i), pipe = (M?.landbank || []).filter(x => x.ticker === t && x.stage === 'pipeline');
    const facts = [adv != null ? `Người mua trả tiền trước ${nf(adv)} tỷ đ` : '', une ? `Doanh thu chưa thực hiện ${nf(une)} tỷ đ` : '', pipe.length ? `${pipe.length} dự án đang đầu tư (${pipe.map(x => esc(x.project)).join(', ')})` : ''].filter(Boolean);
    return `<tr><td><button type="button" class="pv-chip" data-code="${t}">${t}</button><br><span class="kc-na">${esc((F.companies.find(c => c.ticker === t) || {}).note || '').split(':')[0]}</span></td><td>${esc(WATCH[t] || '')}</td><td>${facts.join('<br>') || '<span class="kc-na">—</span>'}<br><span class="kc-na">số dư cuối ${QLb(l?.p)}, ${['LHG', 'NTC', 'D2D'].includes(t) ? 'BCTC riêng' : 'BCTC hợp nhất'}</span></td><td><a class="ov-more" href="?kcn=landbank&co=${t}#mt2" data-kcn-go="landbank" data-kcn-co="${t}">Danh mục dự án, quỹ đất →</a><br><a class="ov-more" href="?fin=fin#mt14" data-ov-fin="fin">Tiền nhận trước, doanh thu chưa thực hiện →</a>${V[t]?.source_url ? `<br><a href="${esc(V[t].source_url)}" target="_blank" rel="noopener">Hồ sơ VNDirect ↗</a>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
  if (val) { val.closest('.grid')?.classList.remove('grid'); }
  const players = block('kcn-03'); // bảng nhóm, nguồn doanh thu, biến quyết định (trước nằm dưới mọi sub-tab Tổng quan)
  p.append(
    sec('quick', '2.1', 'Doanh nghiệp KCN đang được định giá thế nào?', [quick, val].filter(Boolean), {sub: `Định giá theo phiên, ngày ${dmy(window.COMPANY_VALUATION?.latest_observation)}; kỳ BCTC dùng cho EPS, giá trị sổ sách ghi trên từng mã.`}),
    fc ? sec('compare', '2.2', 'Lợi nhuận, nợ vay, định giá từng mã qua các kỳ ra sao?', fc, {sub: 'Lịch sử theo kỳ và bảng chi tiết: chọn năm hoặc quý gần nhất, nhóm chỉ tiêu; bấm tiêu đề cột để sắp xếp. Số hợp nhất toàn doanh nghiệp.'}) : null,
    sec('watch', '2.3', 'Mỗi mã cần theo dõi biến nào?', [watch, players].filter(Boolean), {sub: 'Một biến gắn với kết quả của từng mã, kèm số kiểm tra được trong BCTC và link tới danh mục dự án ở Quỹ đất.'})
  );
}

/* ---------- 02 · Triển vọng (26/11/2026) ----------
   3.1 quy mô cung mới (giai đoạn theo bộ dữ liệu) → 3.2 bảng mốc đáng theo dõi (dự án lớn tách ba nhóm trạng thái, dùng chung danh mục
   dự án với Nguồn cung) → 3.3 điều kiện có thể làm đổi chu kỳ (điều kiện kết thúc của chủ đề đang theo dõi, data/kcn/news.json). */
function forwardPane(p) {
  const D = window.KCN_MARKET, K = window.KcnInsights, WS = window.KcnWS;
  const REG = {North: 'Miền Bắc', South: 'Miền Nam'};
  const pipe = D && K ? K.pipelineRatios(D) : [];
  const yrs = r => ((/(\d{4})-(\d{4})/.exec((D?.pipeline || []).find(x => x.stage === 'REGIONAL_FORECAST' && (!r || x.region === r))?.project || '') || []).slice(1).join('–')) || '';
  const Y = yrs();
  const supply = el('div', 'card ov-q8');
  if (pipe.length) {
    const max = Math.max(...pipe.map(x => x.pipeline || 0), 1);
    supply.innerHTML = `<div class="chart-title">Nguồn cung đất KCN dự kiến ${esc(Y)} theo vùng (ha)</div><div class="chart-sub">dự phóng C&W · tỷ lệ so nguồn cung hiện hữu trong phạm vi khảo sát · chưa phải đất sạch sẵn sàng bàn giao</div>
      <div class="ov-q8-bars">${pipe.map(x => `<div class="ov-q8-r"><span class="ov-q8-l">${esc(REG[x.region] || x.region)}</span><div class="ov-q8-t" title="${esc(REG[x.region] || x.region)}: ${nf(x.pipeline)} ha"><i style="width:${(x.pipeline / max * 100).toFixed(1)}%;background:${x.region === 'North' ? '#2938A8' : '#2a9fa3'}"></i></div><span class="ov-q8-v">${nf(x.pipeline)} ha · ${nf(x.ratio * 100, 0)}%</span></div>`).join('')}</div>
      <a class="ov-more" href="?kcn=supply#mt2" data-kcn-go="supply">Xem nguồn cung theo tỉnh và dự án →</a><div class="pw-src">Nguồn: <a href="${esc(D.sources[pipe[0].src]?.url || '#')}" target="_blank" rel="noopener">Cushman & Wakefield</a></div>`;
  } else supply.append(gap('workbook chưa có số cung dự kiến.'));
  // Mốc đáng theo dõi: dự án từ 200 ha hoặc của doanh nghiệp niêm yết, tách ba nhóm; bảng đầy đủ ở Nguồn cung.
  const mile = el('div', 'card');
  if (WS?.projects) {
    const P = WS.projects(), S = WS.stages, pick = P.filter(x => x.qa !== 'GROUPED_IP' && ((x.area || 0) >= 200 || x.ticker)).sort((a, b) => (b.area || 0) - (a.area || 0));
    mile.innerHTML = Object.keys(S).map(k => { const a = pick.filter(x => x.stage === k).slice(0, 5); return a.length ? `<h4 class="ov-mh"><span class="kc-chip kc-st-${k}">${esc(S[k][0])}</span> <small>${esc(S[k][1])}</small></h4>${WS.projectTable(a)}` : ''; }).join('') +
      `<p class="ov-cap"><a class="ov-more" href="?kcn=supply#mt2" data-kcn-go="supply">Bảng dự án đầy đủ, lọc theo vùng và trạng thái, ở Nguồn cung →</a></p>`;
  } else mile.append(gap('chưa dựng được danh mục dự án.'));
  const watch = el('div', 'card'); watch.innerHTML = '<p class="kc-na">Đang tải chủ đề đang theo dõi…</p>';
  fetch(new URL('../data/kcn/news.json', document.baseURI), {cache: 'no-cache'}).then(r => r.json()).then(n => {
    watch.innerHTML = `<ul class="pp-ul">${n.topics.map(t => `<li><b>${esc(t.title)}</b>: ${esc(t.end_condition || '')}<br><span class="kc-na">Kiểm tra tiếp: ${esc(t.next_check || '')} · phân tích ngày ${esc((t.analysis_date || '').split('-').reverse().join('/'))}</span></li>`).join('')}</ul>
      <p class="ov-cap"><a class="ov-more" href="#mt7" data-ov-main="mt7">Diễn biến của từng chủ đề ở tab Chủ đề nóng →</a> · <a class="ov-more" href="?fin=fin#mt14" data-ov-fin="fin">Doanh thu, biên và dòng tiền ở Tài chính ngành →</a></p>`;
  }).catch(() => { watch.replaceChildren(gap('không tải được chủ đề đang theo dõi.')); });
  p.append(sec('supply', '3.1', `Nguồn cung mới ${Y} lớn đến đâu so với hiện hữu?`, supply),
    sec('mile', '3.2', 'Những mốc dự án nào đáng theo dõi?', mile, {sub: 'Tách dự án đã có quyết định, đang làm hạ tầng và đã đưa ra chào thuê. Diện tích là quy mô dự án theo nguồn, không phải đất sẵn sàng bàn giao.'}),
    sec('watch', '3.3', 'Mốc nào có thể làm đổi chiều chu kỳ?', watch, {sub: 'Điều kiện kết thúc của các chủ đề đang theo dõi.'}));
}

/* ---------- Tab lớn Tài chính ngành (#mt14), theo mẫu trang Điện (power-overview.js finTab), 26/11/2026 ----------
   01 Tài chính ngành (kcn-finance.js, trước là sub-tab 05 của Bức tranh ngành) · 02 Doanh nghiệp niêm yết (trước ở Tổng quan).
   URL: ?fin=<fin|companies>#mt14; link cũ ?kcn=finance#mt2 và ?ov=companies#mt1 tự chuyển. */
const FIN_TABS = [
  ['fin', '01', 'Tài chính ngành', 'Doanh thu, biên lợi nhuận, dòng vốn đầu tư, công nợ và dòng tiền của 10 doanh nghiệp KCN niêm yết, từ BCTC quý.'],
  ['companies', '02', 'Doanh nghiệp niêm yết', 'So sánh nhanh định giá → lịch sử theo kỳ và bảng chi tiết → biến cần theo dõi của từng mã.']
];
function finTab(pane1) {
  const mp = document.getElementById('pane-mt14'); if (!mp) return null;
  const S = el('section', 'section'); S.id = 'kcn-fin-tab'; mp.append(S);
  S.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>BCTC hợp nhất của 10 doanh nghiệp khu công nghiệp niêm yết: tổng hợp theo mẫu đang chọn và từng doanh nghiệp.</p></div>'));
  const nav = el('div', 'pp-nav fn-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Tài chính ngành'); S.append(nav);
  const P2 = {}, built = new Set();
  FIN_TABS.forEach(([key, num, label, goal]) => {
    const b = el('button', 'tabbtn pp-tab', `<span>${num}</span>${esc(label)}`); b.type = 'button'; b.id = 'mt14-fn-' + key + '-tab'; b.setAttribute('role', 'tab'); b.dataset.fn = key; nav.append(b);
    const p = el('div', 'pane-subpane pp-pane fn-pane'); p.id = 'mt14-fn-' + key; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.hidden = true; b.setAttribute('aria-controls', p.id);
    p.innerHTML = `<header class="pp-head"><div><span class="pp-k">${num}</span><h2>${esc(label)}</h2><p>${esc(goal)}</p></div></header>`;
    S.append(p); P2[key] = p;
  });
  companiesPane(P2.companies, pane1);
  const btns = [...nav.children], keys = FIN_TABS.map(x => x[0]);
  let cur = 'fin';
  const run = key => { if (built.has(key)) return; built.add(key);
    try { if (key === 'fin') { if (window.KcnFinance) window.KcnFinance.build(P2.fin); else P2.fin.append(gap('không tải được dữ liệu tài chính ngành.')); } }
    catch (e) { document.documentElement.dataset.ovError = (document.documentElement.dataset.ovError || '') + 'fin-' + key + ':' + e.message + ';'; console.error(e); }
    setTimeout(() => dispatchEvent(new Event('pv:toc')), 60); };
  const show = (key, push) => {
    if (!keys.includes(key)) key = 'fin';
    keys.forEach((k, i) => { const on = k === key; P2[k].hidden = !on; btns[i].setAttribute('aria-selected', String(on)); btns[i].tabIndex = on ? 0 : -1; btns[i].classList.toggle('active', on); });
    if (!mp.hidden) run(key);
    const u = new URL(location.href);
    if (push && (u.searchParams.get('fin') !== key || location.hash !== '#mt14')) { u.searchParams.set('fin', key); ['kcn', 'ov', 'r', 'src', 'seg', 'prov', 'co', 'stage', 'from', 'to', 'mr', 'mq'].forEach(x => u.searchParams.delete(x)); history.pushState({fin: key}, '', u.pathname + u.search + '#mt14'); }
    refit(P2[key]); cur = key;
  };
  const open = key => { window.showMajorTab?.('mt14'); show(key, true); window.scrollTo({top: 0}); };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => show(b.dataset.fn, true));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const n = (i + d + btns.length) % btns.length; btns[n].click(); btns[n].focus(); });
  });
  // Dựng chart khi tab lớn đã hiện (đo đúng chiều rộng).
  new MutationObserver(() => { if (!mp.hidden) { run(cur); refit(P2[cur]); } }).observe(mp, {attributes: true, attributeFilter: ['hidden', 'class']});
  addEventListener('popstate', () => { if (location.hash === '#mt14') show(new URL(location.href).searchParams.get('fin') || 'fin', false); });
  document.addEventListener('click', e => { const a = e.target.closest('[data-ov-fin]'); if (!a) return; e.preventDefault(); open(a.dataset.ovFin); });
  const setTop = () => { const t = document.querySelector('.majortabs'), cs = t && getComputedStyle(t); nav.style.top = cs && cs.position === 'sticky' && innerWidth > 700 ? (t.getBoundingClientRect().height + 8) + 'px' : '0px'; };
  setTop(); addEventListener('resize', setTop);
  const u = new URL(location.href);
  show(location.hash === '#mt14' ? u.searchParams.get('fin') || 'fin' : 'fin', false); // tham số của tab lớn khác không đổi đích
  if (u.searchParams.get('kcn') === 'finance' || u.searchParams.get('ov') === 'companies') setTimeout(() => open(u.searchParams.get('ov') === 'companies' ? 'companies' : 'fin'), 0);
  const api = {open};
  window.KcnFinTab = api;
  return api;
}

const SECTIONS = [
  ['map', '00', 'Bản đồ ngành', 'Chuỗi giá trị ngành', 'Đất, vốn và khách thuê đi qua những ai?', mapPane],
  ['model', '01', 'Chuỗi giá trị theo mô hình', 'Cho thuê đất · nhà xưởng · tiện ích · đa ngành', 'Mỗi mô hình kinh doanh tạo doanh thu, ghi nhận lợi nhuận ở khâu nào?', modelPane],
  ['forward', '02', 'Triển vọng', 'Nguồn cung mới, mốc chính sách', 'Điều gì có thể làm thay đổi luận điểm?', forwardPane]
];

function build() {
  const pane = document.getElementById('pane-mt1'); if (!pane || pane.querySelector('.ov-nav')) return;
  const head = pane.querySelector(':scope>.sectionhead');
  const oldBar = pane.querySelector(':scope>.pane-subtabs'), oldPanes = [...pane.querySelectorAll(':scope>.pane-subpane')];
  if (head) head.innerHTML = '<div><h2 class="sec">Tổng quan ngành bất động sản khu công nghiệp</h2><p>Nhìn để hiểu ngành, bấm để phân tích: bản đồ ngành → chuỗi giá trị theo mô hình → triển vọng. Tài chính và doanh nghiệp niêm yết ở tab Tài chính ngành.</p></div>';
  const nav = el('div', 'ov-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Tổng quan ngành: ba bước');
  head ? head.after(nav) : pane.prepend(nav);
  const panes = {}; let anchor = nav;
  SECTIONS.forEach(([key, num, label, tech, q]) => {
    const b = el('button', 'tabbtn ov-tab', `<span>${num}</span>${esc(label)}<small>${esc(tech)}</small>`); b.type = 'button'; b.id = 'mt1-ov-' + key + '-tab'; b.setAttribute('role', 'tab'); b.dataset.ov = key; nav.append(b);
    const p = el('div', 'pane-subpane ov-pane'); p.id = 'mt1-ov-' + key; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.hidden = true; b.setAttribute('aria-controls', p.id);
    p.innerHTML = `<header class="ov-head"><div><span class="ov-k">${num} · ${esc(tech)}</span><h2>${esc(label)}</h2><p>${esc(q)}</p></div>${key !== 'map' ? '<a href="?ov=map#mt1" data-ov-go="map" class="ov-back">← Bản đồ ngành</a>' : ''}</header>`;
    anchor.after(p); anchor = p; panes[key] = p;
  });
  try { finTab(pane); } catch (e) { document.documentElement.dataset.ovError = (document.documentElement.dataset.ovError || '') + 'finTab:' + e.message + ';'; console.error(e); }
  SECTIONS.forEach(([key, , , , , fn]) => { try { fn(panes[key], pane); } catch (e) { panes[key].append(gap('lỗi dựng phần này: ' + esc(e.message))); document.documentElement.dataset.ovError = (document.documentElement.dataset.ovError || '') + key + ':' + e.message + ';'; console.error(e); } });
  // Phần còn lại của khung sub-tab cũ (nếu có) gom vào Doanh nghiệp niêm yết, không xóa.
  const left = oldPanes.flatMap(w => [...w.children]).filter(n => !n.closest('.ov-pane'));
  if (left.length) { const d = el('details', 'research-fold ov-an', '<summary>Nội dung khác</summary>'); left.forEach(n => d.append(n)); (document.getElementById('mt14-fn-companies') || panes.map).append(d); document.documentElement.dataset.ovLeftover = left.map(n => n.dataset.blockId || n.className).join(','); }
  oldPanes.forEach(w => w.remove()); oldBar?.remove();
  const mp = document.querySelector('#pane-mt2 .sectionhead p'); if (mp) mp.textContent = 'Toàn thị trường → nhu cầu → nguồn cung → giá thuê → quỹ đất doanh nghiệp.';
  // Ô số đầu tab Bức tranh ngành (research-layout dời .kpis sang #mt2) không dùng: ô số nằm ở Bản tin dữ liệu.
  document.querySelectorAll('#pane-mt2 .kpis').forEach(k => { k.hidden = true; k.style.display = 'none'; });

  const keys = SECTIONS.map(s => s[0]), btns = [...nav.children];
  const select = (key, push) => {
    if (!keys.includes(key)) key = 'map';
    keys.forEach((k, i) => { const on = k === key; panes[k].hidden = !on; btns[i].setAttribute('aria-selected', String(on)); btns[i].tabIndex = on ? 0 : -1; btns[i].classList.toggle('active', on); });
    const u = new URL(location.href);
    if (push && (u.searchParams.get('ov') !== key || location.hash !== '#mt1')) { u.searchParams.set('ov', key); ['kcn', 'fin', 'r', 'src', 'seg', 'prov', 'co', 'stage', 'from', 'to', 'mr', 'mq'].forEach(x => u.searchParams.delete(x)); history.pushState({ov: key}, '', u.pathname + u.search + '#mt1'); }
    refit(panes[key]);
  };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => select(b.dataset.ov, true));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (d == null) return; e.preventDefault(); const n = (i + d + btns.length) % btns.length; btns[n].click(); btns[n].focus(); });
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-ov-go]'); if (a) { e.preventDefault(); window.showMajorTab?.('mt1'); select(a.dataset.ovGo, true); window.scrollTo({top: 0}); return; }
    const m = e.target.closest('[data-ov-main]'); if (m) { e.preventDefault(); window.showMajorTab?.(m.dataset.ovMain); window.scrollTo({top: 0}); }
  });
  const mine = () => !location.hash || location.hash === '#mt1', s0 = mine() ? new URL(location.href).searchParams.get('ov') : null;
  if (s0) window.showMajorTab?.('mt1');
  select(s0 || 'map', false);
  addEventListener('popstate', () => { if (mine()) select(new URL(location.href).searchParams.get('ov') || 'map', false); });
  const setTop = () => { const t = document.querySelector('.majortabs'), cs = t && getComputedStyle(t); nav.style.top = cs && cs.position === 'sticky' && innerWidth > 700 ? (t.getBoundingClientRect().height + 8) + 'px' : '0px'; };
  setTop(); addEventListener('resize', setTop);

  document.documentElement.dataset.ovReady = '1';
}
SectorBoot.add(800, () => { try { build(); } catch (e) { document.documentElement.dataset.ovError = 'build:' + e.message; console.error(e); } }); // sau kcn-workspace (700)
})();
