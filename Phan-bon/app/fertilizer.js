/* Dashboard ngành Phân bón (Phan-bon/) theo khung trang Điện (25/11/2026):
   - Tổng quan ngành: Bản tin dữ liệu (câu mô tả + 4 ô số có đường nhỏ), sub-tab 00 Bản đồ ngành (sơ đồ chuỗi giá trị tương tác
     ValueChain.draw như Điện, tỷ trọng doanh thu, sản lượng năm) và 01 Doanh nghiệp niêm yết (thẻ từng mã).
   - Bức tranh ngành: thanh pp-nav 01 Giá phân bón · 02 Chi phí đầu vào · 03 Sản xuất trong nước · 04 Chính sách & thuế; mỗi sub-tab có
     hàng KPI, nhóm câu hỏi đánh số (pp-panel) với chart chính + chart phụ (so cùng tháng theo năm, bảng nhiệt so cùng kỳ).
   - Tài chính ngành: app/fertilizer-finance.js (chép bộ Tài chính ngành của Điện qua BĐS KCN).
   Chart vẽ bằng ChartTypes (app/chart-types.js, như Điện): nút Số kỳ, Bảng, Tùy chỉnh; dòng "Nguồn:" hiện sẵn ở góc phải dưới.
   Chỉ mô tả dữ liệu, không nhận định. Dữ liệu: window.FERT_DATA (scripts/build_fertilizer.py). */
(() => {
'use strict';
const D = window.FERT_DATA;
if (!D) return;
const S = D.series || {}, F = D.fin;
const E = F && window.IndustryFin ? IndustryFin.create(F) : null;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fin = v => typeof v === 'number' && Number.isFinite(v);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '–';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '–';
const mL = ym => `T${+ym.slice(5, 7)}/${ym.slice(0, 4)}`;
const qL = p => `Q${p.slice(5)}/${p.slice(0, 4)}`;
const dL = d => d.slice(0, 10).split('-').reverse().join('/');
const C = {navy: '#1D2678', blue: '#2938A8', teal: '#2a9fa3', gold: '#c98a00', plum: '#861C52', grey: '#3d4653', sky: '#8997D6', slate: '#5a6682', bronze: '#b8801f'};
const YEARC = ['#C9D0EE', '#8997D6', '#4B5BD4', '#1D2678'];  // màu năm cũ → năm mới (như chart so cùng tháng của Điện)
const SRC = {
  wb: '<a href="https://www.worldbank.org/en/research/commodity-markets" target="_blank" rel="noopener">World Bank · Pink Sheet</a>',
  zce: '<a href="https://finance.sina.com.cn/futures/quotes/UR0.shtml" target="_blank" rel="noopener">Sina Finance · Sở GDHH Trịnh Châu (UR0)</a>',
  nso: '<a href="https://www.nso.gov.vn/bao-cao-tinh-hinh-kinh-te-xa-hoi-hang-thang/" target="_blank" rel="noopener">Cục Thống kê · số liệu KT-XH tháng</a>',
  vnd: '<a href="https://api-finfo.vndirect.com.vn/v4/financial_statements" target="_blank" rel="noopener">BCTC hợp nhất theo quý (VNDirect finfo)</a>',
  ar: 'Báo cáo thường niên, website doanh nghiệp',
  law: 'Luật Thuế GTGT số 48/2024/QH15 (<a href="https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-thue-gia-tri-gia-tang-sua-doi-556390.aspx" target="_blank" rel="noopener">văn bản</a>, <a href="https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/02/12-vbhn-vpqh.pdf" target="_blank" rel="noopener">văn bản hợp nhất</a>); Luật số 71/2014/QH13'
};
const recs = k => (S[k] && S[k].records) || [];
const last = k => recs(k).at(-1);
const val = (k, d) => { const r = recs(k).find(x => x.date === d); return r ? r.value : null; };
const ymAdd = (ym, n) => { const d = new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const yoy = (k, d) => { const a = val(k, d), b = val(k, ymAdd(d, -12)); return fin(a) && fin(b) && b ? (a / b - 1) * 100 : null; };
const months = (from, to) => { const out = []; for (let m = from; m <= to; m = ymAdd(m, 1)) out.push(m); return out; };
const ytd = (k, y, M) => { let s = 0; for (let m = 1; m <= M; m++) { const v = val(k, `${y}-${String(m).padStart(2, '0')}`); if (!fin(v)) return null; s += v; } return s; };

/* ---------- thẻ chart (cùng cấu trúc thẻ của Điện) ---------- */
function card(id, title, o = {}) {
  const c = el('div', 'card pp-card fs-share-host' + (o.cls ? ' ' + o.cls : ''));
  c.dataset.blockId = id; c.dataset.updateKind = o.kind || 'public'; c.dataset.cadence = o.cadence || 'monthly'; c.dataset.refreshStatus = 'loaded';
  c.innerHTML = `<div class="chart-title">${esc(title)}${o.info ? '<button class="chart-info-button fb-info-btn" type="button" aria-expanded="false" aria-label="Cách đọc, cách tính">ⓘ</button>' : ''}</div>`
    + (o.sub ? `<div class="chart-sub">${o.sub}</div>` : '') + (o.info ? `<div class="fb-info" hidden>${o.info}</div>` : '')
    + `<div class="pp-host" id="${id}-host"></div><div class="pw-src">Nguồn: ${o.source || ''}</div>` + (o.note ? `<div class="pw-src-note">${esc(o.note)}</div>` : '');
  const b = c.querySelector('.fb-info-btn');
  if (b) b.addEventListener('click', () => { const i = c.querySelector('.fb-info'); i.hidden = !i.hidden; b.setAttribute('aria-expanded', String(!i.hidden)); });
  return {el: c, host: c.querySelector('.pp-host')};
}
function chart(host, key, categories, series, o = {}) {
  const model = {key, categories, series: series.map(s => ({...s, values: s.values.map(v => fin(v) ? Math.round(v * 100) / 100 : null)})), unit: o.unit || '', digits: o.digits ?? 0,
    stackable: !!o.stackable, native: o.native || 'line', zeroBase: o.zeroBase !== false, aria: o.aria || key};
  if (o.native === 'line' || !o.native) model.series.forEach(s => { s.kind = s.kind || 'line'; });
  if (!window.ChartTypes) return;
  ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, model.native); });
}
// Bảng nhiệt so cùng kỳ năm × tháng (kiểu .pv-hm của Điện).
function heat(id, title, sub, k, years, source) {
  const cell = v => v == null ? '#EEF0F6' : v >= 30 ? '#1D2678' : v >= 15 ? '#2938A8' : v >= 5 ? '#6171C5' : v >= 0 ? '#B3BDE8' : v >= -15 ? '#f3c3ad' : '#dd7f4e';
  const c = el('div', 'card pv-hm'); c.dataset.blockId = id; c.dataset.updateKind = 'public'; c.dataset.cadence = 'monthly';
  const rows = years.map(y => `<div class="pv-hm-row"><span class="pv-hm-y">${y}</span>${Array.from({length: 12}, (_, i) => {
    const m = `${y}-${String(i + 1).padStart(2, '0')}`, v = yoy(k, m);
    return `<span class="pv-hm-c" style="background:${cell(v)};color:${v != null && v >= 5 ? '#fff' : '#303540'}" title="${i + 1}/${y}: ${v == null ? 'chưa có số' : sg(v) + '% so cùng kỳ'}">${v == null ? '' : sg(v, 0)}</span>`; }).join('')}</div>`).join('');
  c.innerHTML = `<div class="chart-title">${esc(title)}</div><div class="chart-sub">${sub}</div>
    <div class="pv-hm-grid"><div class="pv-hm-row pv-hm-head"><span class="pv-hm-y"></span>${Array.from({length: 12}, (_, i) => `<span>T${i + 1}</span>`).join('')}</div>${rows}</div>
    <div class="pw-src">Nguồn: ${source}; tự tính so cùng tháng năm trước</div>`;
  return c;
}
// Chart "so cùng tháng": mỗi năm một chuỗi, trục T1…T12 (như chart sản lượng tháng của Điện).
function seasonal(host, key, k, years, o = {}) {
  const cats = Array.from({length: 12}, (_, i) => `T${String(i + 1).padStart(2, '0')}`);
  const cols = YEARC.slice(-years.length);
  chart(host, key, cats, years.map((y, j) => ({name: String(y), color: cols[j], kind: o.native === 'line' ? 'line' : 'bar', values: cats.map((_, i) => val(k, `${y}-${String(i + 1).padStart(2, '0')}`))})),
    {unit: o.unit, digits: o.digits, native: o.native || 'bar', zeroBase: o.zeroBase});
}
const panel = (num, q, sub) => el('section', 'pp-panel pp-q', `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(q)}</h3>${sub ? `<p>${sub}</p>` : ''}</div></header>`);
const two = (...cards) => { const g = el('div', 'grid two g2'); cards.forEach(c => g.append(c.el || c)); return g; };
// Ô KPI có đường nhỏ (giống hàng KPI đầu sub-tab của Điện).
function kpi(label, value, unit, delta, sub, spark, color) {
  const k = el('div', 'kpi pp-kpi', `<div class="label l">${esc(label)}</div><div class="value v">${value}${unit ? `<small> ${esc(unit)}</small>` : ''}</div><div class="delta pp-neutral">${delta || ''}</div><div class="sub s">${sub || ''}</div><div class="fb-spark"></div>`);
  if (spark && window.ChartTypes) requestAnimationFrame(() => ChartTypes.spark(k.querySelector('.fb-spark'), spark, color || C.blue));
  return k;
}
const kpiRow = items => { const g = el('section', 'grid kpis pp-kpis'); items.forEach(i => g.append(i)); return g; };
const tail = (k, n) => recs(k).slice(-n).map(r => r.value);
const lastYears = (k, n) => { const ys = [...new Set(recs(k).map(r => r.date.slice(0, 4)))]; return ys.slice(-n); };

/* =========================== TỔNG QUAN NGÀNH =========================== */
function brief() {
  const host = $('#dataBrief'); if (!host) return;
  const u = last('urea'), dap = last('dap'), g = last('gas_eu'), o = last('urea_output'), M = +o.date.slice(5), y = +o.date.slice(0, 4);
  const uo = ytd('urea_output', y, M), uo0 = ytd('urea_output', y - 1, M), no = ytd('npk_output', y, M), no0 = ytd('npk_output', y - 1, M);
  const lead = `Giá urê thế giới ${mL(u.date)} ${nf(u.value)} USD/tấn (${sg(yoy('urea', u.date))}% so cùng kỳ), DAP ${nf(dap.value)} USD/tấn (${sg(yoy('dap', dap.date))}%); `
    + `khí châu Âu ${nf(g.value, 1)} USD/MMBtu (${sg(yoy('gas_eu', g.date), 0)}%); sản lượng urê ${M} tháng ${nf(uo)} nghìn tấn (${sg((uo / uo0 - 1) * 100)}%), NPK ${nf(no)} nghìn tấn (${sg((no / no0 - 1) * 100)}%).`;
  const tiles = [
    ['Giá urê thế giới', nf(u.value), 'USD/tấn', `${sg(yoy('urea', u.date))}% so cùng kỳ · ${mL(u.date)}`, tail('urea', 36), C.blue, SRC.wb],
    ['Giá DAP', nf(dap.value), 'USD/tấn', `${sg(yoy('dap', dap.date))}% so cùng kỳ · ${mL(dap.date)}`, tail('dap', 36), C.gold, SRC.wb],
    ['Khí châu Âu (TTF)', nf(g.value, 1), 'USD/MMBtu', `${sg(yoy('gas_eu', g.date), 0)}% so cùng kỳ · ${mL(g.date)}`, tail('gas_eu', 36), C.grey, SRC.wb],
    [`Sản lượng urê ${M} tháng`, nf(uo), 'nghìn tấn', `${sg((uo / uo0 - 1) * 100)}% so cùng kỳ · 01–${String(M).padStart(2, '0')}/${y}`, tail('urea_output', 36), C.teal, SRC.nso],
  ];
  host.innerHTML = `<div class="db-l"><div class="db-k"><span class="db-dot"></span>Bản tin dữ liệu</div><div class="db-tk">Phân bón</div><p class="db-lead">${esc(lead)}</p></div><div class="db-r"></div>`;
  tiles.forEach(([t, v, un, s, sp, col, src]) => {
    const c = el('div', 'db-c card', `<div class="db-ch">${esc(t)}</div><div class="db-v">${v}<span class="db-u">${esc(un)}</span></div><div class="db-s">${esc(s)}</div><div class="db-spark"></div><div class="pw-src">Nguồn: ${src}</div>`);
    host.querySelector('.db-r').append(c);
    if (window.ChartTypes) requestAnimationFrame(() => ChartTypes.spark(c.querySelector('.db-spark'), sp, col));
  });
}
// Tỷ trọng doanh thu 4 quý gần nhất theo nhóm sản phẩm (chip % và độ dày luồng trên sơ đồ).
function groupShare() {
  if (!E) return {};
  const r = E.byGroup('revenue', E.tickers, 'ttm'), i = r.labels.length - 1, tot = r.groups.reduce((a, g) => a + (g.values[i] || 0), 0);
  return Object.fromEntries(r.groups.map(g => [g.id, tot ? g.values[i] / tot * 100 : null]));
}
function chain(host) {
  if (!window.ValueChain) return;
  const K = {gas: C.blue, coal: C.grey, phos: C.gold, pot: C.plum, npk: C.teal, out: C.slate, pol: C.bronze}, H = 74, share = groupShare();
  const N = [
    ['gas', 20, 40, 230, K.gas, 'gas', 'Khí tự nhiên', 'Mỏ khí trong nước'],
    ['coal', 20, 140, 230, K.coal, 'coal', 'Than', 'Than antraxit trong nước'],
    ['apatit', 20, 240, 230, K.phos, 'box', 'Quặng apatit • lưu huỳnh', 'Apatit Lào Cai'],
    ['potash', 20, 340, 230, K.pot, 'ship', 'Kali (MOP)', 'Nhập khẩu'],
    ['urea_gas', 318, 40, 262, K.gas, 'factory', 'Đạm urê từ khí', 'DPM • DCM'],
    ['urea_coal', 318, 140, 262, K.coal, 'factory', 'Đạm urê từ than', 'DHB'],
    ['phosphate', 318, 240, 262, K.phos, 'refinery', 'DAP • supe lân • lân nung chảy', 'DDV • LAS • VAF • NFC'],
    ['npk', 318, 340, 262, K.npk, 'factory', 'NPK phối trộn', 'BFC • SFG'],
    ['import', 672, 40, 218, K.pot, 'ship', 'Phân bón nhập khẩu', 'Urê • DAP • kali • NPK'],
    ['dist', 672, 190, 218, K.out, 'truck', 'Phân phối • đại lý', 'Tổng công ty • đại lý cấp 1–2'],
    ['export', 672, 340, 218, K.out, 'ship', 'Xuất khẩu', 'Thị trường nước ngoài'],
    ['policy', 935, 40, 222, K.pol, 'law', 'Chính sách', 'Thuế GTGT 5% • giá khí'],
    ['farm', 935, 190, 222, K.out, 'leaf', 'Nông dân', 'Lúa • cà phê • cây ăn trái'],
  ];
  const into = (id, c, o) => [id, 'dist', c, (R, cy) => `M${R(id)} ${cy(id)} C626 ${cy(id)},626 ${cy('dist') + o},672 ${cy('dist') + o}`];
  const E2 = [
    ['gas', 'urea_gas', K.gas], ['coal', 'urea_coal', K.coal], ['apatit', 'phosphate', K.phos], ['potash', 'npk', K.pot],
    into('urea_gas', K.gas, -18), into('urea_coal', K.coal, -6), into('phosphate', K.phos, 6), into('npk', K.npk, 18),
    ['urea_gas', 'npk', K.gas, () => `M${318 + 262} ${40 + H / 2 + 14} H606 V${340 + H / 2 - 10} H${318 + 262}`],
    ['phosphate', 'npk', K.phos, () => `M${318 + 262} ${240 + H / 2 + 14} H598 V${340 + H / 2 + 8} H${318 + 262}`],
    ['npk', 'export', K.npk], ['import', 'dist', K.pot, () => `M${672 + 109} ${40 + H} V190`],
    ['dist', 'farm', K.out], ['policy', 'farm', K.pol, () => `M${935 + 111} ${40 + H} V190`, true],
  ];
  const pct = id => ({urea_gas: share.urea_gas, urea_coal: share.urea_coal, phosphate: share.phosphate, npk: share.npk})[id] ?? null;
  const fig = ValueChain.draw({N, E: E2, H, height: 440, pct, width: (a, b) => b === 'dist' && fin(pct(a)) ? (3 + pct(a) * .3).toFixed(1) : null, table: 'pb-04',
    lanes: [['NGUYÊN LIỆU', 0, 270, '#eef3fb', '#1D2678'], ['SẢN XUẤT PHÂN BÓN', 285, 320, '#eefaf9', '#2a9fa3'], ['PHÂN PHỐI · TIÊU THỤ', 620, 550, '#fbf6ea', '#b8801f']],
    labels: [[781, 176, 'bán buôn'], [1046, 166, 'chi phí đầu vào, giá bán']],
    legend: [[K.gas, 'Khí → urê'], [K.coal, 'Than → urê'], [K.phos, 'Apatit → lân, DAP'], [K.pot, 'Kali, hàng nhập'], [K.npk, 'NPK'], [K.out, 'Phân phối'], [K.pol, 'Chính sách', true]],
    title: 'Chuỗi giá trị ngành phân bón', desc: 'Khí và than đi vào nhà máy đạm urê; quặng apatit và lưu huỳnh đi vào nhà máy DAP và lân; urê, lân và kali nhập khẩu được phối trộn thành NPK; phân bón qua hệ thống phân phối, đại lý tới nông dân, một phần xuất khẩu.',
    foot: E ? `<div class="vc-day">Độ dày luồng và chip % = tỷ trọng doanh thu 4 quý gần nhất (đến ${qL(F.periods.at(-1))}) của 9 doanh nghiệp niêm yết, theo nhóm sản phẩm chính</div>` : ''});
  host.replaceChildren(fig);
}
function overview() {
  const pane = $('#fb-ov-map'); if (!pane) return;
  const s1 = el('section', 'ov-sec', `<header class="ov-sh"><span class="ov-num">0.1</span><div><h3>Phân bón đi từ nguyên liệu nào, qua nhà máy nào, tới ai?</h3><p>Rê chuột vào một khâu để xem luồng; bấm khâu để xem các mã niêm yết.</p></div></header>`);
  const c1 = el('div', 'card value-chain-card'); c1.dataset.blockId = 'pb-01'; c1.dataset.updateKind = 'static'; c1.dataset.cadence = 'rare';
  c1.innerHTML = '<h3 class="chart-title" style="margin-top:0;font-size:13.5px">Chuỗi giá trị và vị trí doanh nghiệp niêm yết</h3><div class="fb-chain"></div><div class="pw-src">Nguồn: ' + SRC.ar + '; ' + SRC.vnd + '</div>';
  s1.append(c1); pane.append(s1); chain(c1.querySelector('.fb-chain'));
  // 0.2 Doanh thu/LNST theo nhóm và 0.3 Sản lượng theo năm bỏ 25/11/2026 (theo yêu cầu người dùng).
  // 0.2 Bản đồ nhà máy, 0.3 cơ cấu công suất, 0.4 ma trận cấu trúc sản xuất (app/fertilizer-map.js, 25/11/2026).
  if (window.FertMap) { try { FertMap.build(pane); } catch (e) { console.error(e); } }
}
// 01 Doanh nghiệp niêm yết: thẻ từng mã (như bảng doanh nghiệp của Điện, rút gọn), bấm một khâu trên sơ đồ để lọc.
function listed() {
  const pane = $('#fb-ov-listed'); if (!pane || !E) return;
  const i = F.periods.length - 1, T = m => E.total(m, E.tickers, 'ttm').per;
  const rev = T('revenue'), np = T('npat_parent'), gr = T('gross'), nd = E.total('net_debt', E.tickers, 'q').per;
  const box = el('div', 'card fb-co-wrap'); box.dataset.blockId = 'pb-04'; box.dataset.updateKind = 'public'; box.dataset.cadence = 'quarterly';
  box.innerHTML = `<div class="chart-title">Doanh nghiệp niêm yết</div><div class="chart-sub">4 quý gần nhất đến ${qL(F.periods[i])} · tỷ đồng · đường nhỏ: doanh thu 12 quý</div><div class="fb-co-filter" hidden></div><div class="fb-co-grid"></div><div class="pw-src">Nguồn: ${SRC.vnd}; tự tính</div>`;
  const grid = box.querySelector('.fb-co-grid'), gl = Object.fromEntries(F.groups.map(g => [g.id, g]));
  const rows = F.companies.map(c => ({...c, r: rev[c.ticker][i], p: np[c.ticker][i], m: fin(gr[c.ticker][i]) && rev[c.ticker][i] ? gr[c.ticker][i] / rev[c.ticker][i] * 100 : null, d: nd[c.ticker][i]})).sort((a, b) => (b.r ?? 0) - (a.r ?? 0));
  rows.forEach(c => {
    const g = gl[c.group], t = el('div', 'fb-co', `<div class="fb-co-h"><b>${c.ticker}</b><span class="fb-co-g" style="--c:${g.color}">${esc(g.label)}</span></div><p>${esc(c.note || '')}</p>
      <dl><div><dt>Doanh thu</dt><dd>${nf(c.r)}</dd></div><div><dt>LNST cổ đông mẹ</dt><dd>${nf(c.p)}</dd></div><div><dt>Biên gộp</dt><dd>${nf(c.m, 1)}%</dd></div><div><dt>Nợ vay ròng</dt><dd>${nf(c.d)}</dd></div></dl><div class="fb-spark"></div>`);
    t.dataset.code = c.ticker; grid.append(t);
    if (window.ChartTypes) requestAnimationFrame(() => ChartTypes.spark(t.querySelector('.fb-spark'), F.data[c.ticker].revenue.slice(-12), g.color));
  });
  pane.append(box);
  // Bấm một khâu trên sơ đồ chuỗi giá trị → chỉ hiện các mã của khâu đó.
  document.addEventListener('vc:select', e => {
    const codes = e.detail?.codes, f = box.querySelector('.fb-co-filter');
    grid.querySelectorAll('.fb-co').forEach(t => { t.hidden = !!codes && !codes.includes(t.dataset.code); });
    f.hidden = !codes; f.innerHTML = codes ? `Đang lọc theo <b>${esc(e.detail.label)}</b> · <button type="button">Bỏ lọc</button>` : '';
    f.querySelector('button')?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('vc:select', {detail: {}})));
  });
}

/* =========================== BỨC TRANH NGÀNH =========================== */
const BUILT = new Set();
const PIC = {
  price() {
    const p = $('#fb-pp-price'), u = last('urea'), dap = last('dap'), k = last('potash'), z = last('urea_zce_daily');
    const zy = (() => { const t = ymAdd(z.date.slice(0, 7), -12); const r = val('urea_zce', t); return fin(r) ? (z.value / r - 1) * 100 : null; })();
    p.append(kpiRow([
      kpi('Urê · ' + mL(u.date), nf(u.value), 'USD/tấn', `${sg(yoy('urea', u.date))}% so cùng kỳ`, 'FOB Trung Đông · World Bank', tail('urea', 24), C.blue),
      kpi('Urê Trịnh Châu · ' + dL(z.date), nf(z.value), 'CNY/tấn', `${sg(zy)}% so cuối tháng cùng kỳ`, 'hợp đồng liên tục UR0', tail('urea_zce_daily', 120), C.navy),
      kpi('DAP · ' + mL(dap.date), nf(dap.value), 'USD/tấn', `${sg(yoy('dap', dap.date))}% so cùng kỳ`, 'FOB Mỹ vùng Vịnh · World Bank', tail('dap', 24), C.gold),
      kpi('Kali clorua · ' + mL(k.date), nf(k.value), 'USD/tấn', `${sg(yoy('potash', k.date))}% so cùng kỳ`, 'MOP · World Bank', tail('potash', 24), C.plum)]));
    p.append(el('h3', 'pp-grp', 'Đạm urê'));
    const q1 = panel('1.1', 'Giá urê thế giới năm nay so với các năm trước thế nào?');
    const a = card('pb-10', 'Giá urê thế giới — so cùng tháng', {sub: 'USD/tấn · bình quân tháng · FOB Trung Đông', source: SRC.wb, info: 'Số bình quân tháng World Bank công bố đầu tháng sau. Mỗi cột một năm để so cùng tháng.'});
    const ys = lastYears('urea', 4);
    q1.append(el('div', 'pp-main'), heat('pb-13', 'Giá urê tăng giảm bao nhiêu so cùng kỳ, từng tháng', '% · so cùng tháng năm trước', 'urea', ys.slice(-3), SRC.wb));
    q1.querySelector('.pp-main').append(a.el); p.append(q1); seasonal(a.host, 'pb-10', 'urea', ys, {unit: 'USD/tấn'});
    const q2 = panel('1.2', 'Giá urê tương lai ở Trung Quốc biến động thế nào trong năm qua?');
    const b = card('pb-11', 'Urê tương lai Trịnh Châu — 1 năm', {sub: 'CNY/tấn · giá đóng cửa ngày', cadence: 'daily', source: SRC.zce, info: 'Hợp đồng urê liên tục UR0 trên Sở Giao dịch hàng hóa Trịnh Châu. Hợp đồng liên tục chuyển kỳ hạn nên chênh lệch qua ngày chuyển có thể gồm khoảng chênh giữa hai kỳ hạn.'});
    q2.append(b.el); p.append(q2);
    const R = recs('urea_zce_daily'); chart(b.host, 'pb-11', R.map(r => dL(r.date)), [{name: 'Urê ZCE', color: C.navy, values: R.map(r => r.value)}], {unit: 'CNY/tấn', zeroBase: false});
    p.append(el('h3', 'pp-grp', 'Lân, DAP và kali'));
    const q3 = panel('1.3', 'Giá DAP, lân và kali đi cùng hay ngược chiều với urê?');
    const L = months('2019-01', u.date), c = card('pb-12', 'Giá phân bón và nguyên liệu thế giới', {sub: 'USD/tấn · bình quân tháng', source: SRC.wb, info: 'Urê: FOB Trung Đông. DAP: FOB Mỹ vùng Vịnh. TSP: supe lân kép. Kali clorua: MOP. Quặng phosphate: Morocco.'});
    const d = card('pb-14', 'Giá so cùng kỳ năm trước, 12 tháng gần nhất', {sub: '%', source: SRC.wb + '; tự tính'});
    q3.append(c.el, d.el); p.append(q3);
    chart(c.host, 'pb-12', L.map(mL), [['urea', 'Urê', C.blue], ['dap', 'DAP', C.gold], ['tsp', 'TSP', C.plum], ['potash', 'Kali clorua', C.teal], ['phosrock', 'Quặng phosphate', C.grey]].map(([k2, n, col]) => ({name: n, color: col, values: L.map(m => val(k2, m))})), {unit: 'USD/tấn'});
    const L12 = months(ymAdd(u.date, -11), u.date);
    chart(d.host, 'pb-14', L12.map(mL), [['urea', 'Urê', C.blue], ['dap', 'DAP', C.gold], ['potash', 'Kali clorua', C.teal]].map(([k2, n, col]) => ({name: n, color: col, kind: 'bar', values: L12.map(m => yoy(k2, m))})), {unit: '%', digits: 1, native: 'bar', zeroBase: true});
  },
  cost() { if (window.FertCost) FertCost.build($('#fb-pp-cost')); },  // app/fertilizer-cost.js: tổ chức theo mô hình sản xuất (25/11/2026)
  output() {
    const p = $('#fb-pp-output'), u = last('urea_output'), n = last('npk_output'), M = +u.date.slice(5), y = +u.date.slice(0, 4);
    const uy = ytd('urea_output', y, M), uy0 = ytd('urea_output', y - 1, M), ny = ytd('npk_output', y, M), ny0 = ytd('npk_output', y - 1, M);
    p.append(kpiRow([
      kpi('Phân urê · ' + mL(u.date), nf(u.value, 1), 'nghìn tấn', `${sg(yoy('urea_output', u.date))}% so cùng kỳ`, 'tháng gần nhất là số ước tính', tail('urea_output', 24), C.blue),
      kpi(`Phân urê ${M} tháng`, nf(uy), 'nghìn tấn', `${sg((uy / uy0 - 1) * 100)}% so cùng kỳ`, 'lũy kế từ đầu năm', null),
      kpi('Phân NPK · ' + mL(n.date), nf(n.value, 1), 'nghìn tấn', `${sg(yoy('npk_output', n.date))}% so cùng kỳ`, 'tháng gần nhất là số ước tính', tail('npk_output', 24), C.teal),
      kpi(`Phân NPK ${M} tháng`, nf(ny), 'nghìn tấn', `${sg((ny / ny0 - 1) * 100)}% so cùng kỳ`, 'lũy kế từ đầu năm', null)]));
    const info = 'Sản lượng sản phẩm công nghiệp chủ yếu do Cục Thống kê công bố hằng tháng. Tháng gần nhất là số ước tính; số sơ bộ của tháng trước thay số ước tính khi có biểu tháng sau. Tháng không có số để trống.';
    [['3.1', 'Sản lượng phân urê năm nay so với các năm trước?', 'urea_output', 'Phân urê', 'pb-30', 'pb-32'], ['3.2', 'Sản lượng phân NPK năm nay so với các năm trước?', 'npk_output', 'Phân NPK', 'pb-33', 'pb-34']].forEach(([num, q, k, name, id, hid]) => {
      const pn = panel(num, q), a = card(id, `${name} — so cùng tháng`, {sub: 'nghìn tấn', source: SRC.nso, info});
      const pm = el('div', 'pp-main'); pm.append(a.el); pn.append(pm, heat(hid, `${name} tăng giảm bao nhiêu so cùng kỳ, từng tháng`, '% · so cùng tháng năm trước', k, lastYears(k, 3), SRC.nso)); p.append(pn);
      seasonal(a.host, id, k, lastYears(k, 4), {unit: 'nghìn tấn', digits: 1});
    });
    const q3 = panel('3.3', `Lũy kế ${M} tháng đầu năm qua các năm`);
    const c = card('pb-31', `Sản lượng lũy kế ${M} tháng đầu năm`, {sub: 'nghìn tấn', source: SRC.nso, info: `Cộng tháng 1 đến tháng ${M} của từng năm. Năm thiếu số một tháng thì để trống, không ước lượng.`});
    q3.append(c.el); p.append(q3);
    const ys = []; for (let yy = 2019; yy <= y; yy++) ys.push(yy);
    chart(c.host, 'pb-31', ys.map(yy => `${M}T/${yy}`), [{name: 'Phân urê', color: C.blue, kind: 'bar', values: ys.map(yy => ytd('urea_output', yy, M))}, {name: 'Phân NPK', color: C.teal, kind: 'bar', values: ys.map(yy => ytd('npk_output', yy, M))}], {unit: 'nghìn tấn', native: 'bar', stackable: true});
  },
  policy() {
    const p = $('#fb-pp-policy');
    const q1 = panel('4.1', 'Thuế GTGT với phân bón thay đổi thế nào?');
    const c = el('div', 'card'); c.dataset.blockId = 'pb-50'; c.dataset.updateKind = 'event'; c.dataset.cadence = 'event';
    c.innerHTML = `<div class="chart-title">Thuế GTGT đối với phân bón</div><div class="fb-timeline">
      <div class="fb-step"><div class="fb-when">01/01/2015 → 30/06/2025 · Luật số 71/2014/QH13</div><div class="fb-big">Không chịu thuế</div><div class="fb-what">Thuế GTGT đầu vào của nhà sản xuất không được khấu trừ.</div></div>
      <div class="fb-arrow" aria-hidden="true">→</div>
      <div class="fb-step now"><div class="fb-when">Từ 01/07/2025 · Luật Thuế GTGT số 48/2024/QH15</div><div class="fb-big">5%</div><div class="fb-what">Phân bón chịu thuế suất 5%; thuế GTGT đầu vào được khấu trừ.</div></div>
    </div><div class="pw-src">Nguồn: ${SRC.law}</div>`;
    q1.append(c); p.append(q1);
    if (!E) return;
    const q2 = panel('4.2', 'Biên lợi nhuận gộp của các nhà sản xuất trước và sau mốc thuế 5%?', 'Quý 3/2025 là quý đầu áp dụng thuế suất 5%.');
    const a = card('pb-51', 'Biên lợi nhuận gộp theo quý', {sub: '% · LN gộp ÷ doanh thu thuần · từng doanh nghiệp', cadence: 'quarterly', source: SRC.vnd + '; tự tính'});
    q2.append(a.el); p.append(q2);
    const P = F.periods, st = P.indexOf('2023Q1'), cols = [C.blue, C.sky, C.grey, C.gold, C.teal];
    chart(a.host, 'pb-51', P.slice(st).map(qL), ['DPM', 'DCM', 'DHB', 'DDV', 'BFC'].map((t, j) => ({name: t, color: cols[j], values: E.ratio({m: 'gross'}, {m: 'revenue'}, [t], 'q', 100).values.slice(st)})), {unit: '%', digits: 1, zeroBase: false});
  }
};
function showPic(key) {
  if (!PIC[key]) key = 'price';
  $$('#pane-mt2 .pp-pane').forEach(p => { p.hidden = p.dataset.sub !== key; });
  $$('#pane-mt2 .pp-tab').forEach(b => { const on = b.dataset.sub === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  if (!BUILT.has(key)) { BUILT.add(key); try { PIC[key](); } catch (e) { console.error(e); } }
  const u = new URL(location.href); u.searchParams.set('sub', key); history.replaceState(null, '', u.pathname + u.search + u.hash);
}
function showOv(key) {
  $$('#pane-mt1 .ov-pane').forEach(p => { p.hidden = p.dataset.ov !== key; });
  $$('#pane-mt1 .ov-tab').forEach(b => { const on = b.dataset.ov === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
}

/* =========================== NGUỒN DỮ LIỆU =========================== */
function sources() {
  const host = $('#fb-sources'); if (!host) return;
  const rows = [
    ['Giá urê, DAP, TSP, quặng phosphate, kali; khí TTF, Henry Hub, LNG Nhật; Brent; than Úc', SRC.wb + ' (bình quân tháng)', 'đến ' + mL(last('urea').date), 'scripts/fetch_fertilizer_markets.py'],
    ['Urê tương lai Trịnh Châu (UR0)', SRC.zce, 'đến ' + dL(last('urea_zce_daily').date), 'scripts/fetch_fertilizer_markets.py'],
    ['Sản lượng phân urê, phân NPK', SRC.nso, 'đến ' + mL(last('urea_output').date), 'scripts/fetch_fertilizer_nso.py'],
    ['BCTC hợp nhất theo quý: DPM, DCM, DHB, DDV, LAS, VAF, NFC, BFC, SFG', SRC.vnd, F ? 'đến ' + qL(F.periods.at(-1)) : '', 'scripts/fetch_fertilizer_financials.py'],
    ['Thuế GTGT với phân bón', SRC.law, 'hiệu lực 01/07/2025', 'nhập tay'],
    ['Nhà máy, công suất thiết kế, vùng nguyên liệu, quan hệ cung ứng, cơ chế giá khí', 'BCTN, website doanh nghiệp, Petrovietnam, Vinachem, báo chuyên ngành (nguồn từng dòng)', D.plants ? 'tài liệu 2012–2026, kỳ ghi từng nhà máy' : 'N/A', 'nhập tay · data/fertilizer/plants.json'],
    ['Tỷ giá trung tâm USD/VND', 'Ngân hàng Nhà nước', recs('usdvnd').length ? 'đến ' + mL(last('usdvnd').date) : 'N/A', 'scripts/fetch_sbv.py (bot)'],
  ];
  host.innerHTML = `<div class="chart-title">Nguồn dữ liệu</div><div class="chart-sub">Mỗi chart ghi nguồn ngay dưới chart; bảng dưới gom lại nguồn, kỳ số mới nhất và cách lấy.</div><div class="tbl-wrap"><table class="compare-table fb-src-table"><thead><tr><th>Dữ liệu</th><th>Nguồn</th><th>Kỳ</th><th>Cách lấy</th></tr></thead><tbody>`
    + rows.map(r => `<tr><td>${esc(r[0])}</td><td>${r[1]}</td><td>${esc(r[2])}</td><td><code>${esc(r[3])}</code></td></tr>`).join('') + `</tbody></table></div>`
    + (D.plants && D.plants.gaps && D.plants.gaps.length ? `<div class="chart-title" style="margin-top:16px">Dữ liệu chưa thu thập được</div><ul class="fb-gaps">${D.plants.gaps.map(g => `<li>${esc(g)}</li>`).join('')}<li>Giá urê, DAP nội địa (Phú Mỹ, Cà Mau, Đình Vũ): WiData hết hạn mức tuần này, làm mới 27/11/2026</li><li>Giá FO/MFO Singapore, lưu huỳnh, amoniac: chưa có nguồn công khai miễn phí</li><li>Xuất nhập khẩu phân bón (Hải quan): bản PDF đọc ra số không ổn định, chưa dùng</li></ul>` : '')
    + `<div class="pw-src">Dữ liệu dựng lại bằng scripts/build_fertilizer.py · ${esc(dL(D.built_at))}</div>`;
}

/* =========================== khung trang =========================== */
function showTab(key) {
  if (!$(`.majorpane[data-tab="${key}"]`)) key = 'mt1';
  $$('.majorpane').forEach(p => p.classList.toggle('active', p.dataset.tab === key));
  $$('.majortabbtn').forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
  if (location.hash !== '#' + key) history.replaceState(null, '', location.pathname + location.search + '#' + key);
  if (key === 'mt3' && window.FertFinance && !$('#fb-fin-root').childElementCount) FertFinance.build($('#fb-fin-root'));
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
function asof() {
  const t = {urea: () => mL(last('urea').date) + ' (World Bank) · ' + dL(last('urea_zce_daily').date) + ' (Trịnh Châu)', gas_eu: () => mL(last('gas_eu').date),
    urea_output: () => mL(last('urea_output').date), fin: () => F ? `BCTC đến ${qL(F.periods.at(-1))} · tải ${dL(F.captured)}` : ''};
  $$('[data-asof]').forEach(n => { try { n.textContent = 'Dữ liệu mới nhất: ' + t[n.dataset.asof](); } catch (e) { n.textContent = ''; } });
}
function init() {
  brief(); overview(); listed(); sources(); asof();
  $$('#pane-mt1 .ov-tab').forEach(b => b.addEventListener('click', () => showOv(b.dataset.ov)));
  $$('#pane-mt2 .pp-tab').forEach(b => b.addEventListener('click', () => { showPic(b.dataset.sub); setTimeout(() => window.dispatchEvent(new Event('resize')), 30); }));
  $$('.majortabbtn').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  addEventListener('hashchange', () => showTab(location.hash.slice(1)));
  // Nút "Xem bảng →" của sơ đồ: mở sub-tab Doanh nghiệp niêm yết.
  document.addEventListener('click', e => { if (e.target.closest('.vc-status button')) showOv('listed'); });
  showOv('map');
  showPic(new URLSearchParams(location.search).get('sub') || 'price');
  showTab(location.hash.slice(1) || 'mt1');
}
window.FertKit = {card, chart, panel, kpi, kpiRow, el, esc, nf, sg, mL, qL, dL, last, recs, yoy, val, months, ymAdd, heat, two, lastYears, SRC, C, E, F, D};
if (window.SectorBoot) SectorBoot.add(10, init); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
