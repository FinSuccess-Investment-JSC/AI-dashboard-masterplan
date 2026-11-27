/* BĐS KCN · Tổng quan ngành (#mt1), 3 sub-tab (26/11/2026: 02 Doanh nghiệp niêm yết dời sang tab lớn Tài chính ngành #mt14) theo mẫu trang Điện (power-overview.js), 25/11/2026:
   00 Bản đồ ngành (chỉ chuỗi giá trị) · 01 Chuỗi giá trị theo mô hình kinh doanh · 02 Doanh nghiệp niêm yết
   (so sánh tài chính & định giá, bảng doanh nghiệp) · 03 Triển vọng (nguồn cung mới 2026–2028, điều kiện đổi chiều, chính sách).
   Nội dung lấy từ các khối đã dựng sẵn (research-layout.js: lộ trình, mô hình kinh doanh, so sánh tài chính; kcn-brief.js: chuỗi giá trị)
   và workbook KCN (window.KcnWS từ kcn-workspace.js). Thêm mục "Dữ liệu khu công nghiệp" vào tab Nguồn dữ liệu.
   Không tạo số khi thiếu dữ liệu. Deep-link: ?ov=<map|model>#mt1 (forward đã bỏ 27/11/2026, mở map). */
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
  p.append(vc ? sec('chain', '0.1', 'Đất, vốn và khách thuê đi qua những ai?', vc, {sub: 'Ba lớp bật/tắt được: luồng đất và hạ tầng, luồng hợp đồng và thanh toán, luồng pháp lý và phê duyệt. Rê chuột vào một bên hoặc đường nối để xem luồng.'}) : gap('chưa dựng được sơ đồ chuỗi giá trị.'));
}

/* ---------- 01 · Chuỗi giá trị theo mô hình kinh doanh (26/11/2026, bản 2) ----------
   1.1 Ba bước từ đất đến doanh thu (sơ đồ chung) + ngay dưới: bảng so sánh gọn ba mô hình (cho thuê đất KCN, nhà xưởng/kho xây sẵn,
   tiện ích và dịch vụ). Mỗi dòng trả lời năm câu hỏi; biến cần theo dõi được tô đậm; thời điểm nhận tiền tách khỏi thời điểm ghi nhận
   doanh thu. Ví dụ doanh nghiệp lấy từ thuyết minh BCTC kiểm toán (data/kcn/company-policy.json), chỉ ghi mã khi đã xác minh. */
const MQ = ['Ai trả tiền', 'Tính tiền theo đơn vị nào', 'Vốn nằm ở đâu', 'Khi nào thu tiền · khi nào ghi nhận doanh thu', 'Biến quyết định lợi nhuận'];
const POLICY_URL = new URL('../data/kcn/company-policy.json', document.baseURI);
const METHOD_TXT = {one_off: 'một lần khi bàn giao', straight_line: 'phân bổ theo thời hạn thuê', mixed: 'một lần hoặc phân bổ, tùy hợp đồng'};
function modelTable(host) {
  const chips = list => list.map(t => `<button type="button" class="pv-chip" data-code="${esc(t)}">${esc(t)}</button>`).join(' ');
  const draw = P => {
    const cs = (P && P.companies) || [], sure = c => !/không nói rõ|xếp straight_line theo/i.test(c.gaps || ''), by = m => cs.filter(c => c.land_lease_recognition?.method === m && sure(c)).map(c => c.ticker); // chỉ mã có câu chính sách rõ trong BCTC (TIP chưa rõ)
    const rbf = cs.filter(c => c.rbf_recognition?.method === 'straight_line').map(c => c.ticker), util = cs.filter(c => c.utility_recognition?.method).map(c => c.ticker);
    const ex = (lbl, list) => list.length ? `<span class="ov-mx-ex">${esc(lbl)}: ${chips(list)}</span>` : '';
    const rows = [
      ['Cho thuê đất KCN', 'land', [
        'Nhà máy thuê lại đất: doanh nghiệp FDI, doanh nghiệp trong nước',
        'USD hoặc đồng/m² cho cả thời hạn thuê còn lại; cộng phí quản lý hạ tầng theo m²/năm',
        'Bồi thường, tiền thuê đất trả Nhà nước, hạ tầng kỹ thuật; trên BCTC ở hàng tồn kho, chi phí dở dang dài hạn hoặc BĐS đầu tư',
        '<b>Thu tiền:</b> đặt cọc khi ký, phần lớn trước hoặc khi bàn giao (ghi ở người mua trả tiền trước). <b>Ghi nhận:</b> một lần khi bàn giao nếu đủ điều kiện (thời hạn thuê trên 90% thời gian sử dụng, nhận trước từ 90% tiền thuê, không hủy ngang…; Thông tư 200/2014, Điều 79); nếu không, phân bổ đều theo thời hạn thuê (ghi ở doanh thu chưa thực hiện).' +
          `<span class="ov-mx-exs">${ex('Ghi nhận một lần', by('one_off'))}${ex('Phân bổ', by('straight_line'))}${ex('Tùy hợp đồng', by('mixed'))}</span>`,
        '<mark>Diện tích bàn giao</mark> và <mark>giá thuê thực hiện</mark> so với chi phí đất và hạ tầng trên mỗi m² thương phẩm'],
        `<a class="ov-more" href="?kcn=landbank#mt2" data-kcn-go="landbank">Quỹ đất từng doanh nghiệp →</a>`],
      ['Nhà xưởng, kho xây sẵn', 'rbf', [
        'Doanh nghiệp thuê nhà xưởng, kho: sản xuất quy mô vừa, logistics',
        'Đồng/m²/tháng (C&W báo USD/m²/tháng đến Q2/2026, đồng từ Q3/2026)',
        'Nhà xưởng, kho đã xây (BĐS đầu tư)',
        '<b>Thu tiền:</b> hằng tháng hoặc hằng quý, kèm tiền cọc. <b>Ghi nhận:</b> đều theo thời gian thuê (thuê hoạt động).' + `<span class="ov-mx-exs">${ex('Theo thuyết minh BCTC', rbf)}</span>`,
        '<mark>Diện tích cho thuê</mark> và <mark>tỷ lệ lấp đầy</mark>; giá thuê/m² so với chi phí xây'],
        `<a class="ov-more" href="?kcn=supply&seg=RBF#mt2" data-kcn-go="supply" data-kcn-seg="RBF">Lấp đầy nhà xưởng toàn thị trường →</a>`],
      ['Tiện ích và dịch vụ', 'util', [
        'Nhà máy đang vận hành trong KCN',
        'kWh điện, m³ nước, m³ nước thải × đơn giá; phí quản lý theo m²',
        'Trạm điện, trạm xử lý nước thải, mạng cấp nước (tài sản cố định)',
        '<b>Thu tiền</b> và <b>ghi nhận</b> cùng kỳ: hằng tháng, khi cung cấp dịch vụ.' + `<span class="ov-mx-exs">${ex('Theo thuyết minh BCTC', util)}</span>`,
        '<mark>Sản lượng dịch vụ</mark> và <mark>biên đơn vị</mark> (giá bán − giá mua); bộ dữ liệu chưa có sản lượng'],
        `<a class="ov-more" href="?fin=companies#mt14" data-ov-fin="companies">Doanh nghiệp niêm yết →</a>`]
    ];
    host.innerHTML = `<div class="tablewrap ov-mx-wrap" data-no-fold><table class="kc-t ov-mx" data-no-fold><thead><tr><th>Mô hình</th>${MQ.map(q => `<th>${esc(q)}</th>`).join('')}</tr></thead><tbody>` +
      rows.map(([name, , cells, link]) => `<tr><th scope="row">${esc(name)}<br>${link}</th>${cells.map((c, i) => `<td data-q="${esc(MQ[i])}">${c}</td>`).join('')}</tr>`).join('') + '</tbody></table></div>' +
      `<p class="ov-cap"><b>Doanh nghiệp đa ngành</b> thường kết hợp nhiều mô hình (BCM, VGC; KBC có đô thị, IDC có điện và BOT), nên lãi hợp nhất còn chịu ảnh hưởng của các mảng ngoài KCN; chỉ quy biên về KCN khi doanh nghiệp công bố báo cáo bộ phận.</p>` +
      `<div class="pw-src">Nguồn: ${P && P.general_rule && P.general_rule.url ? `<a href="${esc(P.general_rule.url)}" target="_blank" rel="noopener">Thông tư 200/2014/TT-BTC</a>` : 'Thông tư 200/2014/TT-BTC'} · thuyết minh BCTC kiểm toán 2025 của doanh nghiệp (IDC: 2024)</div>`;
  };
  draw(null);
  fetch(POLICY_URL, {cache: 'no-cache'}).then(r => (r.ok ? r.json() : null)).then(draw).catch(() => {});
}
function modelPane(p, pane) {
  const bm = pane.querySelector('.business-models'), road = pane.querySelector('.research-roadmap');
  if (road) road.querySelector(':scope>h2')?.remove();
  const tbl = el('div', 'card ov-mx-card'); modelTable(tbl);
  p.append(road ? sec('steps', '1.1', 'Ba bước từ đất đến doanh thu', [road, tbl], {sub: 'Quy trình chung: đất và đền bù → vốn và hạ tầng → cho thuê và bàn giao. Bảng dưới so sánh ba mô hình kiếm tiền trên cùng năm câu hỏi.'}) : sec('steps', '1.1', 'Ba mô hình kiếm tiền', tbl));
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
    return `<tr><td><button type="button" class="pv-chip" data-code="${t}">${t}</button><br><span class="kc-na">${esc((F.companies.find(c => c.ticker === t) || {}).note || '').split(':')[0]}</span></td><td>${esc(WATCH[t] || '')}</td><td>${facts.join('<br>') || '<span class="kc-na">—</span>'}<br><span class="kc-na">số dư cuối ${QLb(l?.p)}, ${(F.companies.find(c => c.ticker === t) || {}).report === 'separate' ? 'BCTC riêng' : 'BCTC hợp nhất'}</span></td><td><a class="ov-more" href="?kcn=landbank&co=${t}#mt2" data-kcn-go="landbank" data-kcn-co="${t}">Danh mục dự án, quỹ đất →</a><br><a class="ov-more" href="?fin=fin#mt14" data-ov-fin="fin">Tiền nhận trước, doanh thu chưa thực hiện →</a>${V[t]?.source_url ? `<br><a href="${esc(V[t].source_url)}" target="_blank" rel="noopener">Hồ sơ VNDirect ↗</a>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
  if (val) { val.closest('.grid')?.classList.remove('grid'); }
  const players = block('kcn-03'); // bảng nhóm, nguồn doanh thu, biến quyết định (trước nằm dưới mọi sub-tab Tổng quan)
  p.append(
    sec('quick', '2.1', 'Doanh nghiệp KCN đang được định giá thế nào?', [quick, val].filter(Boolean), {sub: `Định giá theo phiên, ngày ${dmy(window.COMPANY_VALUATION?.latest_observation)}; kỳ BCTC dùng cho EPS, giá trị sổ sách ghi trên từng mã.`}),
    fc ? sec('compare', '2.2', 'Lợi nhuận, nợ vay, định giá từng mã qua các kỳ ra sao?', fc, {sub: 'Lịch sử theo kỳ và bảng chi tiết: chọn năm hoặc quý gần nhất, nhóm chỉ tiêu; bấm tiêu đề cột để sắp xếp. Số BCTC toàn doanh nghiệp (hợp nhất; LHG, NTC, D2D là BCTC riêng).'}) : null,
    sec('watch', '2.3', 'Mỗi mã cần theo dõi biến nào?', [watch, players].filter(Boolean), {sub: 'Một biến gắn với kết quả của từng mã, kèm số kiểm tra được trong BCTC và link tới danh mục dự án ở Quỹ đất.'})
  );
}

/* 02 · Triển vọng: bỏ 27/11/2026 theo yêu cầu người dùng; link cũ ?ov=forward mở Bản đồ ngành. */

/* ---------- Tab lớn Tài chính ngành (#mt14), theo mẫu trang Điện (power-overview.js finTab), 26/11/2026 ----------
   01 Tài chính ngành (kcn-finance.js, trước là sub-tab 05 của Bức tranh ngành) · 02 Doanh nghiệp niêm yết (trước ở Tổng quan).
   URL: ?fin=<fin|companies>#mt14; link cũ ?kcn=finance#mt2 và ?ov=companies#mt1 tự chuyển. */
const FIN_TABS = [
  ['fin', '01', 'Tài chính ngành', 'Doanh thu, biên lợi nhuận, dòng vốn đầu tư, công nợ và dòng tiền từ BCTC quý toàn doanh nghiệp của 10 doanh nghiệp KCN niêm yết.'],
  ['companies', '02', 'Doanh nghiệp niêm yết', 'So sánh nhanh định giá → lịch sử theo kỳ và bảng chi tiết → biến cần theo dõi của từng mã.']
];
function finTab(pane1) {
  const mp = document.getElementById('pane-mt14'); if (!mp) return null;
  const S = el('section', 'section'); S.id = 'kcn-fin-tab'; mp.append(S);
  S.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>BCTC toàn doanh nghiệp của 10 doanh nghiệp KCN niêm yết (hợp nhất; LHG, NTC, D2D là BCTC riêng): tổng hợp theo mẫu đang chọn và từng doanh nghiệp.</p></div>'));
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
  ['model', '01', 'Chuỗi giá trị theo mô hình', 'Ba bước · ba mô hình kiếm tiền', 'Mỗi mô hình kinh doanh tạo doanh thu, ghi nhận lợi nhuận ở khâu nào?', modelPane],
];

function build() {
  const pane = document.getElementById('pane-mt1'); if (!pane || pane.querySelector('.ov-nav')) return;
  const head = pane.querySelector(':scope>.sectionhead');
  const oldBar = pane.querySelector(':scope>.pane-subtabs'), oldPanes = [...pane.querySelectorAll(':scope>.pane-subpane')];
  if (head) head.innerHTML = '<div><h2 class="sec">Tổng quan ngành bất động sản khu công nghiệp</h2><p>Nhìn để hiểu ngành, bấm để phân tích: bản đồ ngành → chuỗi giá trị theo mô hình. Tài chính và doanh nghiệp niêm yết ở tab Tài chính ngành.</p></div>';
  const nav = el('div', 'ov-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Tổng quan ngành: hai bước');
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
