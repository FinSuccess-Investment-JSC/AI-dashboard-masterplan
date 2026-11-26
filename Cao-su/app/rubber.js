/* Dashboard ngành Cao su (Cao-su/, 26/11/2026) theo khung trang Điện / Phân bón, viết sẵn bố cục cuối.
   Trình tự đọc: giá → lượng & tồn kho → biên lợi nhuận → tiền mặt.
   - Tổng quan ngành: Bản tin dữ liệu (4 ô: SVR 10, TSR 20, lượng và đơn giá xuất khẩu so cùng kỳ), 00 Bản đồ ngành (ValueChain),
     01 Doanh nghiệp niêm yết.
   - Bức tranh ngành: 01 Giá cao su · 02 Xuất khẩu Việt Nam · 03 Cầu Trung Quốc · 04 Cung & tồn kho · 05 Doanh nghiệp: ASP & biên
     (03–05 ở app/rubber-more.js, dựng từ khối nhập tay có nguồn).
   - Tài chính ngành: app/rubber-finance.js.
   Chart vẽ bằng ChartTypes (Số kỳ, Bảng, Tùy chỉnh); dòng "Nguồn:" hiện sẵn dưới mọi chart. Chỉ mô tả dữ liệu.
   Dữ liệu: window.RUBBER_DATA (scripts/build_rubber.py). */
(() => {
'use strict';
const D = window.RUBBER_DATA;
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
const C = {navy: '#1D2678', blue: '#2938A8', teal: '#2a9fa3', gold: '#c98a00', plum: '#861C52', grey: '#3d4653', sky: '#8997D6', slate: '#5a6682', bronze: '#b8801f', green: '#3f8f5a'};
const YEARC = ['#C9D0EE', '#8997D6', '#4B5BD4', '#1D2678'];
const a = (href, t) => `<a href="${href}" target="_blank" rel="noopener">${t}</a>`;
const SRC = {
  wb: a('https://www.worldbank.org/en/research/commodity-markets', 'World Bank · Pink Sheet'),
  arbc: a('https://aseanrubber.net/arbc/index.php/rubber-prices/arbc-prices', 'ARBC · giá ngày hội viên (VRA, TRA, GAPKINDO, MRE, RTAS)'),
  sina: a('https://finance.sina.com.cn/futures/quotes/RU0.shtml', 'SHFE / INE qua Sina Finance (HĐ liên tục)'),
  ecb: a('https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html', 'ECB tỷ giá tham chiếu'),
  customs: a('https://www.customs.gov.vn/index.jsp?pageId=4&cid=1294', 'Cục Hải quan · số liệu thống kê'),
  comtrade: a('https://comtradeplus.un.org/', 'UN Comtrade (Trung Quốc khai báo)'),
  vnd: a('https://api-finfo.vndirect.com.vn/v4/financial_statements', 'BCTC hợp nhất theo quý (VNDirect finfo)'),
  ar: 'Báo cáo thường niên, website doanh nghiệp',
};
const recs = k => (S[k] && S[k].records) || [];
const last = k => recs(k).at(-1);
const val = (k, d) => { const r = recs(k).find(x => x.date === d); return r ? r.value : null; };
const ymAdd = (ym, n) => { const d = new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const yoy = (k, d) => { const x = val(k, d), b = val(k, ymAdd(d, -12)); return fin(x) && fin(b) && b ? (x / b - 1) * 100 : null; };
const months = (from, to) => { const out = []; for (let m = from; m <= to; m = ymAdd(m, 1)) out.push(m); return out; };
const sumYtd = (k, y, M) => { let s = 0; for (let m = 1; m <= M; m++) { const v = val(k, `${y}-${String(m).padStart(2, '0')}`); if (!fin(v)) return null; s += v; } return s; };

/* ---------- thẻ chart (cùng cấu trúc thẻ của Điện) ---------- */
function card(id, title, o = {}) {
  const c = el('div', 'card pp-card fs-share-host' + (o.cls ? ' ' + o.cls : ''));
  c.dataset.blockId = id; c.dataset.updateKind = o.kind || 'public'; c.dataset.cadence = o.cadence || 'monthly'; c.dataset.refreshStatus = 'loaded';
  c.innerHTML = `<div class="chart-title">${esc(title)}${o.info ? '<button class="chart-info-button fb-info-btn" type="button" aria-expanded="false" aria-label="Cách đọc, cách tính">ⓘ</button>' : ''}</div>`
    + (o.sub ? `<div class="chart-sub">${o.sub}</div>` : '') + (o.info ? `<div class="fb-info" hidden>${o.info}</div>` : '')
    + `<div class="cs-ctl"></div><div class="pp-host" id="${id}-host"></div><div class="pw-src">Nguồn: ${o.source || ''}</div>` + (o.note ? `<div class="pw-src-note">${esc(o.note)}</div>` : '');
  const b = c.querySelector('.fb-info-btn');
  if (b) b.addEventListener('click', () => { const i = c.querySelector('.fb-info'); i.hidden = !i.hidden; b.setAttribute('aria-expanded', String(!i.hidden)); });
  return {el: c, host: c.querySelector('.pp-host'), ctl: c.querySelector('.cs-ctl')};
}
function chart(host, key, categories, series, o = {}) {
  const model = {key, categories, series: series.map(s => ({...s, values: s.values.map(v => fin(v) ? Math.round(v * 100) / 100 : null)})), unit: o.unit || '', digits: o.digits ?? 0,
    stackable: !!o.stackable, native: o.native || 'line', zeroBase: o.zeroBase !== false, aria: o.aria || key, flatTicks: !!o.flatTicks};
  if (o.native === 'line' || !o.native) model.series.forEach(s => { s.kind = s.kind || 'line'; });
  if (!window.ChartTypes) return;
  host.innerHTML = '';
  ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, model.native); });
}
// Nút chọn trong card (cùng kiểu pf-seg của Tài chính ngành).
function seg(c, name, opts, cur, on) {
  const w = el('div', 'pf-seg pf-box'); w.setAttribute('role', 'group'); w.setAttribute('aria-label', name);
  const multi = Array.isArray(cur), st = multi ? new Set(cur) : {v: cur};
  const paint = () => w.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(multi ? st.has(b.dataset.k) : b.dataset.k === st.v)));
  opts.forEach(([k, t]) => { const b = el('button', '', esc(t)); b.type = 'button'; b.dataset.k = k; b.addEventListener('click', () => {
    if (multi) { if (st.has(k) && st.size > 1) st.delete(k); else st.add(k); on([...st]); } else { st.v = k; on(k); } paint(); }); w.append(b); });
  paint(); c.ctl.append(w); return w;
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
function seasonal(host, key, k, years, o = {}) {
  const cats = Array.from({length: 12}, (_, i) => `T${String(i + 1).padStart(2, '0')}`);
  const cols = YEARC.slice(-years.length);
  chart(host, key, cats, years.map((y, j) => ({name: String(y), color: cols[j], kind: o.native === 'line' ? 'line' : 'bar', values: cats.map((_, i) => val(k, `${y}-${String(i + 1).padStart(2, '0')}`))})),
    {unit: o.unit, digits: o.digits, native: o.native || 'bar', zeroBase: o.zeroBase});
}
// Thác nước (cột nổi): bước đầu/cuối là mốc tuyệt đối, bước giữa là phần cộng thêm.
function waterfall(host, steps, o = {}) {
  if (!window.Chart) return;
  let run = 0;
  const bars = steps.map(s => { if (s.total) { run = s.value; return [0, s.value]; } const a0 = run; run += s.value; return [a0, run]; });
  const f = v => nf(v, o.digits ?? 1);
  host.innerHTML = '<div class="ct-canvas" style="position:relative;height:280px"><canvas role="img"></canvas></div>';
  new Chart(host.querySelector('canvas'), {type: 'bar', data: {labels: steps.map(s => s.label), datasets: [{data: bars, borderRadius: 3, maxBarThickness: 70,
    backgroundColor: steps.map(s => s.total ? C.navy : s.value >= 0 ? C.teal : C.plum)}]},
    options: {responsive: true, maintainAspectRatio: false, animation: {duration: 250}, scales: {x: {grid: {display: false}, ticks: {color: '#64748B'}}, y: {beginAtZero: o.zero !== false, grid: {color: '#EEF0F6'}, border: {display: false}, ticks: {color: '#64748B'}}},
      plugins: {legend: {display: false}, tooltip: {backgroundColor: '#1D2678', callbacks: {label: x => { const s = steps[x.dataIndex]; return (s.total ? '' : s.value >= 0 ? '+' : '') + f(s.value) + ' ' + (o.unit || ''); }}}}},
    plugins: [{id: 'wfLabels', afterDatasetsDraw(ch) { const c = ch.ctx; c.save(); c.font = '600 11px Inter,Arial,sans-serif'; c.fillStyle = '#334155'; c.textAlign = 'center';
      ch.getDatasetMeta(0).data.forEach((p, i) => { const s = steps[i]; c.fillText((s.total ? '' : s.value >= 0 ? '+' : '−') + f(Math.abs(s.value)), p.x, Math.min(p.y, p.base) - 5); }); c.restore(); }}]});
}
const panel = (num, q, sub) => el('section', 'pp-panel pp-q', `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(q)}</h3>${sub ? `<p>${sub}</p>` : ''}</div></header>`);
const two = (...cards) => { const g = el('div', 'grid two g2'); cards.forEach(c => g.append(c.el || c)); return g; };
function kpi(label, value, unit, delta, sub, spark, color) {
  const k = el('div', 'kpi pp-kpi', `<div class="label l">${esc(label)}</div><div class="value v">${value}${unit ? `<small> ${esc(unit)}</small>` : ''}</div><div class="delta pp-neutral">${delta || ''}</div><div class="sub s">${sub || ''}</div><div class="fb-spark"></div>`);
  if (spark && window.ChartTypes) requestAnimationFrame(() => ChartTypes.spark(k.querySelector('.fb-spark'), spark, color || C.blue));
  return k;
}
const kpiRow = items => { const g = el('section', 'grid kpis pp-kpis'); items.filter(Boolean).forEach(i => g.append(i)); return g; };
const tail = (k, n) => recs(k).slice(-n).map(r => r.value);
const lastYears = (k, n) => [...new Set(recs(k).map(r => r.date.slice(0, 4)))].slice(-n);
// Bình quân tháng (MTD) của tháng gần nhất so cùng tháng năm trước, cho chuỗi ARBC ngày.
function mtdYoy(k) {
  const m = last(k + '_m'); if (!m) return {};
  const p = val(k + '_m', ymAdd(m.date, -12));
  return {m, y: fin(p) && p ? (m.value / p - 1) * 100 : null};
}
function flow(p, key, steps) {
  const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Các khâu trong sub-tab');
  bar.innerHTML = steps.map(([id, k, t], i) => `${i ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#mt2-pp-${key}-${id}" class="pp-flow-s" data-pp-stage="mt2-pp-${key}-${id}"><small>${k}</small><b>${esc(t)}</b></a>`).join('');
  bar.addEventListener('click', e => { const x = e.target.closest('[data-pp-stage]'); if (x) { e.preventDefault(); document.getElementById(x.dataset.ppStage)?.scrollIntoView({behavior: 'smooth', block: 'start'}); } });
  p.append(bar);
}
function stage(p, key, id, k, t) { const h = el('div', 'pp-stage', `<span>${k}</span><h3>${esc(t)}</h3>`); h.id = `mt2-pp-${key}-${id}`; p.append(h); }
function renum(p, n) { p.querySelectorAll(':scope>.pp-panel .pp-num').forEach((x, i) => { x.textContent = `${n}.${i + 1}`; }); }

/* =========================== TỔNG QUAN NGÀNH =========================== */
function brief() {
  const host = $('#dataBrief'); if (!host) return;
  const sv = last('vn_svr10'), {m: svm, y: svy} = mtdYoy('vn_svr10'), t = last('wb_tsr20'), q = last('exp_q'), px = last('exp_px');
  const lead = `SVR 10 Việt Nam ngày ${dL(sv.date)} ${nf(sv.value, 1)} US cent/kg (${nf(sv.value * 10)} USD/tấn), bình quân ${mL(svm.date)} ${sg(svy)}% so cùng kỳ; `
    + `TSR 20 thế giới ${mL(t.date)} ${nf(t.value, 2)} USD/kg (${sg(yoy('wb_tsr20', t.date))}%); xuất khẩu cao su ${mL(q.date)} ${nf(q.value, 1)} nghìn tấn (${sg(yoy('exp_q', q.date))}%), `
    + `đơn giá ${nf(px.value)} USD/tấn (${sg(yoy('exp_px', px.date))}%).`;
  const tiles = [
    ['SVR 10 Việt Nam', nf(sv.value, 1), 'US cent/kg', `${dL(sv.date)} · bình quân ${mL(svm.date)} (đến ngày) ${sg(svy)}% so cùng kỳ`, tail('vn_svr10', 250), C.blue, SRC.arbc],
    ['TSR 20 thế giới', nf(t.value, 2), 'USD/kg', `${sg(yoy('wb_tsr20', t.date))}% so cùng kỳ · ${mL(t.date)}`, tail('wb_tsr20', 36), C.navy, SRC.wb],
    ['Lượng xuất khẩu Việt Nam', nf(q.value, 1), 'nghìn tấn', `${sg(yoy('exp_q', q.date))}% so cùng kỳ · ${mL(q.date)}${q.status === 'sơ bộ' ? ' (sơ bộ)' : ''}`, tail('exp_q', 36), C.teal, SRC.customs],
    ['Đơn giá xuất khẩu', nf(px.value), 'USD/tấn', `${sg(yoy('exp_px', px.date))}% so cùng kỳ · ${mL(px.date)}`, tail('exp_px', 36), C.gold, SRC.customs + '; tự tính trị giá ÷ lượng'],
  ];
  host.innerHTML = `<div class="db-l"><div class="db-k"><span class="db-dot"></span>Bản tin dữ liệu</div><div class="db-tk">Cao su</div><p class="db-lead">${esc(lead)}</p></div><div class="db-r"></div>`;
  tiles.forEach(([tt, v, un, s, sp, col, src]) => {
    const c = el('div', 'db-c card', `<div class="db-ch">${esc(tt)}</div><div class="db-v">${v}<span class="db-u">${esc(un)}</span></div><div class="db-s">${esc(s)}</div><div class="db-spark"></div><div class="pw-src">Nguồn: ${src}</div>`);
    host.querySelector('.db-r').append(c);
    if (window.ChartTypes) requestAnimationFrame(() => ChartTypes.spark(c.querySelector('.db-spark'), sp, col));
  });
}
function chain(host) {
  if (!window.ValueChain) return;
  const K = {tree: C.green, latex: C.teal, proc: C.blue, exp: C.gold, tire: C.plum, land: C.bronze, syn: C.grey}, H = 74;
  const N = [
    ['garden', 20, 40, 230, K.tree, 'leaf', 'Vườn cây cao su', 'VN • Lào • Campuchia'],
    ['buy', 20, 140, 230, K.latex, 'truck', 'Mủ thu mua', 'Tiểu điền, đại lý'],
    ['land', 20, 290, 230, K.land, 'map', 'Đất vườn cây', 'Thanh lý, chuyển KCN'],
    ['tap', 318, 40, 262, K.latex, 'factory', 'Mủ nước • mủ tạp', 'GVR • PHR • DPR • TRC • DRI'],
    ['proc', 318, 140, 262, K.proc, 'refinery', 'Chế biến SVR • latex • RSS', 'Nhà máy của doanh nghiệp'],
    ['kcn', 318, 290, 262, K.land, 'factory', 'Khu công nghiệp • đền bù', 'GVR • PHR • DPR'],
    ['export', 672, 40, 218, K.exp, 'ship', 'Xuất khẩu', 'Trung Quốc ~70% lượng'],
    ['tire', 672, 160, 218, K.tire, 'factory', 'Săm lốp trong nước', 'DRC • CSM • SRC'],
    ['syn', 672, 290, 218, K.syn, 'box', 'Cao su tổng hợp', 'Butadiene từ dầu mỏ'],
    ['oem', 935, 100, 222, K.tire, 'truck', 'Lốp xe • găng tay • công nghiệp', 'Nhu cầu cuối'],
    ['price', 935, 260, 222, K.exp, 'law', 'Giá thế giới', 'SGX TSR 20 • SHFE • INE'],
  ];
  const E2 = [['garden', 'tap', K.tree], ['tap', 'proc', K.latex, () => `M${318 + 131} ${40 + H} V140`], ['buy', 'proc', K.latex], ['land', 'kcn', K.land],
    ['proc', 'export', K.exp, (R, cy) => `M${R('proc')} ${cy('proc')} C626 ${cy('proc')},626 ${cy('export')},672 ${cy('export')}`], ['proc', 'tire', K.tire],
    ['export', 'oem', K.exp], ['tire', 'oem', K.tire], ['syn', 'oem', K.syn, (R, cy) => `M${R('syn')} ${cy('syn')} C912 ${cy('syn')},912 ${cy('oem') + 16},935 ${cy('oem') + 16}`],
    ['price', 'export', K.exp, () => `M935 ${260 + H / 2} C910 ${260 + H / 2},910 ${40 + H / 2 + 12},890 ${40 + H / 2 + 12}`, true]];
  const fig = ValueChain.draw({N, E: E2, H, height: 400, pct: () => null, width: () => null, table: 'cs-04',
    lanes: [['NGUYÊN LIỆU • ĐẤT', 0, 270, '#eef7f0', '#3f8f5a'], ['KHAI THÁC • CHẾ BIẾN', 285, 320, '#eefaf9', '#2a9fa3'], ['TIÊU THỤ • GIÁ', 620, 550, '#fbf6ea', '#b8801f']],
    labels: [], legend: [[K.tree, 'Vườn cây'], [K.latex, 'Mủ'], [K.proc, 'Chế biến'], [K.exp, 'Xuất khẩu, giá'], [K.tire, 'Săm lốp'], [K.land, 'Đất, KCN'], [K.syn, 'Tổng hợp']],
    title: 'Chuỗi giá trị ngành cao su tự nhiên', desc: 'Vườn cây tự khai thác và mủ thu mua đi vào nhà máy chế biến SVR, latex, RSS; phần lớn xuất khẩu, phần còn lại bán cho doanh nghiệp săm lốp; đất vườn cây thanh lý chuyển sang khu công nghiệp và đền bù.',
    foot: ''});
  host.replaceChildren(fig);
}
function overview() {
  const pane = $('#cs-ov-map'); if (!pane) return;
  const s1 = el('section', 'ov-sec', `<header class="ov-sh"><span class="ov-num">0.1</span><div><h3>Cao su đi từ vườn cây nào, qua khâu nào, tới ai?</h3></div></header>`);
  const c1 = el('div', 'card value-chain-card'); c1.dataset.blockId = 'cs-01'; c1.dataset.updateKind = 'static'; c1.dataset.cadence = 'rare';
  c1.innerHTML = '<h3 class="chart-title" style="margin-top:0;font-size:13.5px">Chuỗi giá trị và vị trí doanh nghiệp niêm yết</h3><div class="fb-chain"></div><div class="pw-src">Nguồn: ' + SRC.ar + '</div>';
  s1.append(c1); pane.append(s1); chain(c1.querySelector('.fb-chain'));
}
function listed() {
  const pane = $('#cs-ov-listed'); if (!pane || !E) return;
  const i = F.periods.length - 1, T = m => E.total(m, E.tickers, 'ttm').per;
  const rev = T('revenue'), np = T('npat_parent'), gr = T('gross'), ot = T('other'), cfo = T('cfo');
  const box = el('div', 'card fb-co-wrap'); box.dataset.blockId = 'cs-04'; box.dataset.updateKind = 'public'; box.dataset.cadence = 'quarterly';
  box.innerHTML = `<div class="chart-title">Doanh nghiệp niêm yết</div><div class="chart-sub">4 quý gần nhất đến ${qL(F.periods[i])} · tỷ đồng · đường nhỏ: LNST cổ đông mẹ 12 quý</div><div class="fb-co-filter" hidden></div><div class="fb-co-grid"></div><div class="pw-src">Nguồn: ${SRC.vnd}; tự tính</div>`;
  const grid = box.querySelector('.fb-co-grid'), gl = Object.fromEntries(F.groups.map(g => [g.id, g]));
  const rows = F.companies.map(c => ({...c, r: rev[c.ticker][i], p: np[c.ticker][i], m: fin(gr[c.ticker][i]) && rev[c.ticker][i] ? gr[c.ticker][i] / rev[c.ticker][i] * 100 : null, o: ot[c.ticker][i]}))
    .sort((x, y) => (F.groups.findIndex(g => g.id === x.group) - F.groups.findIndex(g => g.id === y.group)) || ((y.r ?? 0) - (x.r ?? 0)));
  rows.forEach(c => {
    const g = gl[c.group], t = el('div', 'fb-co', `<div class="fb-co-h"><b>${c.ticker}</b><span class="fb-co-g" style="--c:${g.color}">${esc(g.label)}</span></div><p>${esc(c.note || '')}</p>
      <dl><div><dt>Doanh thu</dt><dd>${nf(c.r)}</dd></div><div><dt>LNST cổ đông mẹ</dt><dd>${nf(c.p)}</dd></div><div><dt>Biên gộp</dt><dd>${nf(c.m, 1)}%</dd></div><div><dt>Lợi nhuận khác</dt><dd>${nf(c.o)}</dd></div></dl><div class="fb-spark"></div>`);
    t.dataset.code = c.ticker; grid.append(t);
    if (window.ChartTypes) requestAnimationFrame(() => ChartTypes.spark(t.querySelector('.fb-spark'), F.data[c.ticker].npat_parent.slice(-12), g.color));
  });
  pane.append(box);
  document.addEventListener('vc:select', e => {
    const codes = e.detail?.codes, f = box.querySelector('.fb-co-filter');
    grid.querySelectorAll('.fb-co').forEach(t => { t.hidden = !!codes && !codes.includes(t.dataset.code); });
    f.hidden = !codes; f.innerHTML = codes ? `Đang lọc theo <b>${esc(e.detail.label)}</b> · <button type="button">Bỏ lọc</button>` : '';
    f.querySelector('button')?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('vc:select', {detail: {}})));
  });
}

/* =========================== BỨC TRANH NGÀNH =========================== */
const ARBC = [['vn_svr10', 'SVR 10 Việt Nam', C.navy], ['th_str20', 'STR 20 Thái Lan', C.teal], ['my_smr20', 'SMR 20 Malaysia', C.gold], ['id_sir20', 'SIR 20 Indonesia', C.plum],
  ['sg_tsr20', 'TSR 20 Singapore', C.sky], ['th_rss3', 'RSS 3 Thái Lan', C.grey], ['sg_rss3', 'RSS 3 Singapore', C.slate]];
const PIC = {
  price() {
    const p = $('#cs-pp-price'), t = last('wb_tsr20'), sv = last('vn_svr10'), sm = last('my_smr20'), ru = last('shfe_ru');
    const {y: svy, m: svm} = mtdYoy('vn_svr10'), {y: smy} = mtdYoy('my_smr20');
    const ruy = (() => { const b = val('shfe_ru_m', ymAdd(last('shfe_ru_m').date, -12)); return fin(b) ? (last('shfe_ru_m').value / b - 1) * 100 : null; })();
    p.append(kpiRow([
      kpi('SVR 10 Việt Nam · ' + dL(sv.date), nf(sv.value, 1), 'US cent/kg', `bình quân ${mL(svm.date)} ${sg(svy)}% so cùng kỳ`, `= ${nf(sv.value * 10)} USD/tấn · VRA`, tail('vn_svr10', 250), C.navy),
      kpi('SMR 20 Malaysia · ' + dL(sm.date), nf(sm.value, 1), 'US cent/kg', `bình quân tháng ${sg(smy)}% so cùng kỳ`, `= ${nf(sm.value * 10)} USD/tấn · MRE`, tail('my_smr20', 250), C.gold),
      kpi('TSR 20 thế giới · ' + mL(t.date), nf(t.value, 2), 'USD/kg', `${sg(yoy('wb_tsr20', t.date))}% so cùng kỳ`, 'bình quân tháng · World Bank', tail('wb_tsr20', 36), C.blue),
      kpi('SHFE RU · ' + dL(ru.date), nf(ru.value), 'CNY/tấn', `bình quân tháng ${sg(ruy)}% so cùng kỳ`, 'giá thanh toán HĐ liên tục', tail('shfe_ru', 250), C.plum)]));
    flow(p, 'price', [['world', 'Thế giới', 'TSR 20 & RSS 3'], ['region', 'Khu vực', 'Giá ngày theo grade'], ['fut', 'Sàn tương lai', 'SHFE • INE'], ['syn', 'Thay thế', 'Cao su tổng hợp, dầu']]);
    // --- Thế giới
    stage(p, 'price', 'world', 'Thế giới', 'TSR 20 & RSS 3');
    const q1 = panel('·', 'Giá cao su thế giới đang ở đâu so với các năm trước?');
    const c1 = card('cs-10', 'TSR 20 và RSS 3 — bình quân tháng', {sub: 'USD/kg · World Bank Pink Sheet', source: SRC.wb,
      info: 'World Bank: TSR 20 là giá SGX/SICOM, RSS 3 là giá Singapore, bình quân tháng; công bố đầu tháng sau. Nút: mức giá, % so cùng tháng năm trước, chỉ số 100 tại tháng đầu của khung.'});
    q1.append(c1.el); p.append(q1);
    const L1 = months('2019-01', t.date); let v1 = 'lvl';
    const d1 = () => {
      const base = k => { const r = val(k, L1[0]); return v => fin(v) && r ? v / r * 100 : null; };
      const vals = k => v1 === 'yoy' ? L1.map(m => yoy(k, m)) : v1 === 'idx' ? L1.map(m => base(k)(val(k, m))) : L1.map(m => val(k, m));
      chart(c1.host, 'cs-10-' + v1, L1.map(mL), [{name: 'TSR 20', color: C.navy, values: vals('wb_tsr20')}, {name: 'RSS 3', color: C.gold, values: vals('wb_rss3')}],
        {unit: v1 === 'yoy' ? '%' : v1 === 'idx' ? 'chỉ số' : 'USD/kg', digits: v1 === 'lvl' ? 2 : 1, zeroBase: v1 === 'yoy'});
    };
    seg(c1, 'Cách xem', [['lvl', 'Mức giá'], ['yoy', '% so cùng kỳ'], ['idx', `Chỉ số 100 = ${mL(L1[0])}`]], v1, k => { v1 = k; d1(); }); d1();
    const c2 = card('cs-11', 'Chênh RSS 3 − TSR 20', {sub: 'USD/tấn · bình quân tháng', source: SRC.wb + '; tự tính',
      info: 'RSS 3 (tờ xông khói) và TSR 20 (cao su khối) là hai benchmark khác nhau về grade, phương thức định giá và thị trường; chênh lệch không phải một khoản lãi có thể thu được.'});
    const L2 = recs('wb_spread').filter(r => r.date >= '2019-01');
    const ys = lastYears('wb_tsr20', 4), c3 = card('cs-12', 'TSR 20 — so cùng tháng', {sub: 'USD/kg · bình quân tháng', source: SRC.wb});
    const q2 = panel('·', 'RSS 3 cao hơn TSR 20 bao nhiêu, và TSR 20 năm nay so cùng tháng các năm trước?');
    q2.append(two(c2, c3)); p.append(q2);
    if (window.ChartTypes) ChartTypes.balance(c2.host, {labels: L2.map(r => mL(r.date)), values: L2.map(r => r.value), digits: 0, unit: 'USD/tấn', posColor: C.gold, negColor: C.plum});
    seasonal(c3.host, 'cs-12', 'wb_tsr20', ys, {unit: 'USD/kg', digits: 2, native: 'line', zeroBase: false});
    // --- Khu vực
    stage(p, 'price', 'region', 'Khu vực', 'Giá ngày theo grade');
    const q3 = panel('·', 'Giá SVR 10 Việt Nam đi cùng giá các nước trong khu vực thế nào?');
    const c4 = card('cs-13', 'Giá cao su khu vực theo ngày', {sub: 'US cent/kg · chọn grade · 1 US cent/kg = 10 USD/tấn', cadence: 'daily', source: SRC.arbc,
      info: 'Giá ngày hội viên ARBC báo: SVR 10 (VRA), STR 20 và RSS 3 (TRA), SIR 20 (GAPKINDO), SMR 20 (MRE, nguồn MRB), TSR 20 và RSS 3 (RTAS). Các grade và điều kiện giao hàng khác nhau. Ngày nghỉ (M.C.), N.A. và ô lỗi để trống. CSR 10 Campuchia thiếu nhiều kỳ nên không vẽ.'});
    q3.append(c4.el); p.append(q3);
    let g4 = ['vn_svr10', 'th_str20', 'my_smr20'], w4 = '1y';
    const d4 = () => {
      const cut = w4 === '1y' ? 365 : w4 === '3y' ? 1100 : 99999, from = new Date(Date.now() - cut * 864e5).toISOString().slice(0, 10);
      const days = [...new Set(g4.flatMap(k => recs(k).map(r => r.date)))].filter(d => d >= from).sort();
      const ix = Object.fromEntries(g4.map(k => [k, Object.fromEntries(recs(k).map(r => [r.date, r.value]))]));
      chart(c4.host, 'cs-13', days.map(dL), ARBC.filter(([k]) => g4.includes(k)).map(([k, n, col]) => ({name: n, color: col, values: days.map(d => ix[k][d] ?? null)})), {unit: 'US cent/kg', digits: 1, zeroBase: false, flatTicks: true});
    };
    seg(c4, 'Grade', ARBC.map(([k, n]) => [k, n]), g4, ks => { g4 = ks; d4(); });
    seg(c4, 'Khung', [['1y', '1 năm'], ['3y', '3 năm']], w4, k => { w4 = k; d4(); }); d4();
    const q4 = panel('·', 'SVR 10 Việt Nam cao hay thấp hơn mặt bằng TSR khu vực?');
    const c5 = card('cs-14', 'SVR 10 − trung vị (STR 20, SIR 20, SMR 20)', {sub: 'US cent/kg · chỉ ngày có đủ ba báo giá', cadence: 'daily', source: SRC.arbc + '; tự tính',
      info: 'Chênh giữa các báo giá khác grade và điều kiện giao hàng, tính lại theo từng ngày; có thể dương hoặc âm. Không phải chênh lệch cùng một hàng hóa.'});
    const c6 = card('cs-15', 'Giá khu vực — bình quân tháng', {sub: 'US cent/kg · tháng hiện hành là bình quân đến ngày', source: SRC.arbc + '; tự tính'});
    q4.append(two(c5, c6)); p.append(q4);
    let w5 = '1y';
    const d5 = () => { const n = w5 === '1y' ? 250 : 800, R = recs('svr_spread').slice(-n);
      if (window.ChartTypes) ChartTypes.balance(c5.host, {labels: R.map(r => dL(r.date)), values: R.map(r => r.value), digits: 1, unit: 'US cent/kg', posColor: C.navy, negColor: C.plum}); };
    seg(c5, 'Khung', [['1y', '1 năm'], ['3y', '3 năm']], w5, k => { w5 = k; d5(); }); d5();
    const LM = recs('vn_svr10_m').map(r => r.date);
    chart(c6.host, 'cs-15', LM.map(mL), ARBC.slice(0, 5).map(([k, n, col]) => ({name: n, color: col, values: LM.map(m => val(k + '_m', m))})), {unit: 'US cent/kg', digits: 1, zeroBase: false});
    // --- Sàn tương lai
    stage(p, 'price', 'fut', 'Sàn tương lai', 'SHFE • INE');
    const q5 = panel('·', 'Giá cao su trên sàn Trung Quốc đi thế nào so với giá FOB khu vực?');
    const c7 = card('cs-16', 'SHFE RU, INE NR so với SVR 10 và TSR 20', {sub: 'bình quân tháng · chỉ số 100 hoặc USD/tấn', source: SRC.sina + '; ' + SRC.ecb + '; ' + SRC.arbc + '; tự tính',
      info: 'RU: cao su tự nhiên SHFE, giao tại kho nội địa Trung Quốc, giá gồm VAT 13%. NR: TSR 20 INE, kho ngoại quan, chưa thuế. Hợp đồng liên tục theo Sina (chuyển sang kỳ hạn có khối lượng lớn nhất); giữ giá thanh toán gốc. Chế độ USD/tấn: bình quân tháng CNY/tấn ÷ bình quân tháng tỷ giá CNY/USD (ECB). SVR 10, TSR 20 Singapore là giá FOB, US cent/kg × 10.'});
    q5.append(c7.el); p.append(q5);
    let v7 = 'idx';
    const d7 = () => {
      const L = months('2023-01', last('shfe_ru_usd').date);
      const ser = [['shfe_ru_usd', 'SHFE RU', C.plum, 1], ['ine_nr_usd', 'INE NR (TSR 20)', C.blue, 1], ['vn_svr10_m', 'SVR 10 Việt Nam', C.navy, 10], ['sg_tsr20_m', 'TSR 20 Singapore', C.teal, 10]];
      chart(c7.host, 'cs-16-' + v7, L.map(mL), ser.map(([k, n, col, f]) => { const v = L.map(m => fin(val(k, m)) ? val(k, m) * f : null), b = v.find(fin);
        return {name: n, color: col, values: v7 === 'idx' ? v.map(x => fin(x) ? x / b * 100 : null) : v}; }), {unit: v7 === 'idx' ? `chỉ số (${mL(L[0])} = 100)` : 'USD/tấn', digits: v7 === 'idx' ? 1 : 0, zeroBase: false});
    };
    seg(c7, 'Đơn vị', [['idx', 'Chỉ số 100'], ['usd', 'USD/tấn']], v7, k => { v7 = k; d7(); }); d7();
    const q6 = panel('·', 'Thanh khoản và vị thế mở trên sàn Trung Quốc thay đổi ra sao?');
    const c8 = card('cs-17', 'Khối lượng và vị thế mở — 1 năm', {sub: 'hợp đồng · theo ngày · HĐ liên tục', cadence: 'daily', source: SRC.sina,
      info: 'Khối lượng giao dịch và vị thế mở (open interest) của hợp đồng liên tục theo Sina; ngày chuyển kỳ hạn có thể làm vị thế mở nhảy bậc.'});
    q6.append(c8.el); p.append(q6);
    let k8 = 'shfe_ru';
    const d8 = () => { const R = recs(k8).slice(-250);
      chart(c8.host, 'cs-17-' + k8, R.map(r => dL(r.date)), [{name: 'Khối lượng', color: C.sky, kind: 'bar', values: R.map(r => r.volume)}, {name: 'Vị thế mở', color: C.navy, kind: 'line', values: R.map(r => r.oi)}], {unit: 'hợp đồng', native: 'bar', flatTicks: true}); };
    seg(c8, 'Sàn', [['shfe_ru', 'SHFE RU'], ['ine_nr', 'INE NR'], ['shfe_br', 'SHFE BR']], k8, k => { k8 = k; d8(); }); d8();
    // --- Thay thế
    stage(p, 'price', 'syn', 'Thay thế', 'Cao su tổng hợp, dầu');
    const q7 = panel('·', 'Cao su tổng hợp đắt hay rẻ hơn cao su tự nhiên, và giá dầu đi thế nào?');
    const c9 = card('cs-18', 'Cao su butadiene SHFE BR so với cao su tự nhiên SHFE RU', {sub: 'USD/tấn · bình quân tháng', source: SRC.sina + '; ' + SRC.ecb + '; tự tính',
      info: 'BR là cao su butadiene (tổng hợp), RU là cao su tự nhiên, cùng sàn SHFE, cùng quy đổi bằng tỷ giá bình quân tháng. Hai loại thay thế một phần trong sản xuất lốp.'});
    const c10 = card('cs-19', 'Dầu Brent', {sub: 'USD/thùng · bình quân tháng · đầu vào hóa dầu của cao su tổng hợp', source: SRC.wb});
    q7.append(two(c9, c10)); p.append(q7);
    const LB = months(recs('shfe_br_usd')[0].date, last('shfe_br_usd').date);
    chart(c9.host, 'cs-18', LB.map(mL), [{name: 'SHFE BR (tổng hợp)', color: C.grey, values: LB.map(m => val('shfe_br_usd', m))}, {name: 'SHFE RU (tự nhiên)', color: C.plum, values: LB.map(m => val('shfe_ru_usd', m))}], {unit: 'USD/tấn', zeroBase: false});
    const LO = months('2021-01', last('brent').date);
    chart(c10.host, 'cs-19', LO.map(mL), [{name: 'Brent', color: C.grey, values: LO.map(m => val('brent', m))}], {unit: 'USD/thùng', digits: 1, zeroBase: false});
    renum(p, 1);
  },
  export() {
    const p = $('#cs-pp-export'), q = last('exp_q'), v = last('exp_v'), px = last('exp_px'), M = +q.date.slice(5), y = +q.date.slice(0, 4);
    const qy = sumYtd('exp_q', y, M), qy0 = sumYtd('exp_q', y - 1, M), vy = sumYtd('exp_v', y, M), vy0 = sumYtd('exp_v', y - 1, M);
    p.append(kpiRow([
      kpi('Lượng xuất khẩu · ' + mL(q.date), nf(q.value, 1), 'nghìn tấn', `${sg(yoy('exp_q', q.date))}% so cùng kỳ`, q.status === 'sơ bộ' ? 'số sơ bộ Hải quan' : 'Hải quan', tail('exp_q', 24), C.teal),
      kpi('Kim ngạch · ' + mL(v.date), nf(v.value, 1), 'triệu USD', `${sg(yoy('exp_v', v.date))}% so cùng kỳ`, 'FOB', tail('exp_v', 24), C.navy),
      kpi('Đơn giá xuất khẩu · ' + mL(px.date), nf(px.value), 'USD/tấn', `${sg(yoy('exp_px', px.date))}% so cùng kỳ`, 'trị giá ÷ lượng', tail('exp_px', 24), C.gold),
      kpi(`Lượng ${M} tháng ${y}`, nf(qy, 0), 'nghìn tấn', `${sg((qy / qy0 - 1) * 100)}% so cùng kỳ`, `kim ngạch ${nf(vy, 0)} triệu USD (${sg((vy / vy0 - 1) * 100)}%)`, null)]));
    const L = months('2019-01', q.date);
    const q1 = panel('·', 'Lượng và đơn giá xuất khẩu cao su Việt Nam theo tháng');
    const c1 = card('cs-20', 'Lượng xuất khẩu cao su', {sub: 'nghìn tấn · theo tháng', source: SRC.customs,
      info: 'Rổ "Cao su" của Hải quan (cao su tự nhiên, tổng hợp, hỗn hợp; chưa tách theo mã HS trong báo cáo tháng). Bản chính thức thay bản sơ bộ khi Hải quan công bố. Tháng gần nhất có thể là số sơ bộ.'});
    const c2 = card('cs-21', 'Đơn giá xuất khẩu cao su', {sub: 'USD/tấn · trị giá ÷ lượng cùng rổ', source: SRC.customs + '; tự tính'});
    q1.append(c1.el, c2.el); p.append(q1);
    chart(c1.host, 'cs-20', L.map(mL), [{name: 'Lượng', color: C.teal, kind: 'bar', values: L.map(m => val('exp_q', m))}], {unit: 'nghìn tấn', digits: 1, native: 'bar'});
    chart(c2.host, 'cs-21', L.map(mL), [{name: 'Đơn giá', color: C.gold, values: L.map(m => val('exp_px', m))}], {unit: 'USD/tấn', zeroBase: false});
    // Thác nước YoY kim ngạch: đóng góp lượng = (Q1−Q0)×P0, đóng góp giá = Q1×(P1−P0); rổ Hải quan là một ASP tổng nên giá và cơ cấu gộp.
    const q2 = panel('·', 'Kim ngạch tăng giảm so cùng kỳ là do lượng hay do giá?');
    const c3 = card('cs-22', `Kim ngạch ${mL(q.date)} so với ${mL(ymAdd(q.date, -12))}`, {sub: 'triệu USD · tách lượng và giá', source: SRC.customs + '; tự tính',
      info: 'Đóng góp lượng = (lượng kỳ này − lượng kỳ gốc) × đơn giá kỳ gốc. Đóng góp giá = lượng kỳ này × (đơn giá kỳ này − đơn giá kỳ gốc). Báo cáo tháng chỉ có đơn giá bình quân của cả rổ nên phần giá gộp cả thay đổi cơ cấu grade, thị trường.'});
    const c4 = card('cs-23', 'Đóng góp lượng và giá vào thay đổi kim ngạch so cùng kỳ', {sub: 'triệu USD · 24 tháng gần nhất', source: SRC.customs + '; tự tính'});
    q2.append(two(c3, c4)); p.append(q2);
    const eff = m => { const m0 = ymAdd(m, -12), Q1 = val('exp_q', m), Q0 = val('exp_q', m0), P1 = val('exp_px', m), P0 = val('exp_px', m0);
      return [Q1, Q0, P1, P0].every(fin) ? {vol: (Q1 - Q0) * P0 / 1000, px: Q1 * (P1 - P0) / 1000, v0: Q0 * P0 / 1000, v1: Q1 * P1 / 1000} : null; };
    const e = eff(q.date);
    if (e) waterfall(c3.host, [{label: mL(ymAdd(q.date, -12)), value: e.v0, total: true}, {label: 'Lượng', value: e.vol}, {label: 'Giá & cơ cấu', value: e.px}, {label: mL(q.date), value: e.v1, total: true}], {unit: 'triệu USD', digits: 1});
    const L24 = L.slice(-24);
    chart(c4.host, 'cs-23', L24.map(mL), [{name: 'Lượng', color: C.teal, kind: 'bar', values: L24.map(m => eff(m)?.vol)}, {name: 'Giá & cơ cấu', color: C.gold, kind: 'bar', values: L24.map(m => eff(m)?.px)}], {unit: 'triệu USD', digits: 1, native: 'stack', stackable: true});
    const q3 = panel('·', 'Lượng xuất khẩu năm nay so với các năm trước, từng tháng');
    const c5 = card('cs-24', 'Lượng xuất khẩu — so cùng tháng', {sub: 'nghìn tấn', source: SRC.customs});
    const pm = el('div', 'pp-main'); pm.append(c5.el); q3.append(pm, heat('cs-25', 'Lượng xuất khẩu tăng giảm bao nhiêu so cùng kỳ, từng tháng', '% · so cùng tháng năm trước', 'exp_q', lastYears('exp_q', 3), SRC.customs)); p.append(q3);
    seasonal(c5.host, 'cs-24', 'exp_q', lastYears('exp_q', 4), {unit: 'nghìn tấn', digits: 1});
    const q4 = panel('·', 'Đơn giá xuất khẩu đi sau giá thị trường bao lâu?');
    const c6 = card('cs-26', 'Đơn giá xuất khẩu so với SVR 10 và TSR 20', {sub: 'USD/tấn · bình quân tháng', source: SRC.customs + '; ' + SRC.arbc + '; ' + SRC.wb + '; tự tính',
      info: 'Đơn giá xuất khẩu là bình quân của mọi chủng loại trong rổ "Cao su", theo ngày tờ khai; hợp đồng thường ký trước giao hàng 1–2 tháng. SVR 10 là bình quân tháng giá ngày VRA báo ARBC (US cent/kg × 10). TSR 20 là bình quân tháng World Bank (USD/kg × 1.000).'});
    q4.append(c6.el); p.append(q4);
    const L6 = months('2023-01', q.date);
    chart(c6.host, 'cs-26', L6.map(mL), [{name: 'Đơn giá xuất khẩu', color: C.gold, values: L6.map(m => val('exp_px', m))}, {name: 'SVR 10 Việt Nam', color: C.navy, values: L6.map(m => fin(val('vn_svr10_m', m)) ? val('vn_svr10_m', m) * 10 : null)},
      {name: 'TSR 20 thế giới', color: C.teal, values: L6.map(m => fin(val('wb_tsr20', m)) ? val('wb_tsr20', m) * 1000 : null)}], {unit: 'USD/tấn', zeroBase: false});
    const q5 = panel('·', `Lượng và kim ngạch lũy kế ${M} tháng đầu năm qua các năm`);
    const c7 = card('cs-27', `Lũy kế ${M} tháng đầu năm`, {sub: 'nghìn tấn (cột) · đơn giá bình quân = tổng trị giá ÷ tổng lượng', source: SRC.customs + '; tự tính'});
    q5.append(c7.el); p.append(q5);
    const YS = []; for (let yy = 2019; yy <= y; yy++) YS.push(yy);
    chart(c7.host, 'cs-27', YS.map(yy => `${M}T/${yy}`), [{name: 'Lượng', color: C.teal, kind: 'bar', values: YS.map(yy => sumYtd('exp_q', yy, M))},
      {name: 'Kim ngạch (triệu USD)', color: C.navy, kind: 'bar', values: YS.map(yy => sumYtd('exp_v', yy, M))}], {unit: '', native: 'bar'});
    renum(p, 2);
  },
};
function showPic(key) {
  if (!PIC[key]) key = 'price';
  $$('#pane-mt2 .pp-pane').forEach(p => { p.hidden = p.dataset.sub !== key; });
  $$('#pane-mt2 .pp-tab').forEach(b => { const on = b.dataset.sub === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  if (!BUILT.has(key)) { BUILT.add(key); try { PIC[key](); } catch (e) { console.error(e); } }
  const u = new URL(location.href); u.searchParams.set('sub', key); history.replaceState(null, '', u.pathname + u.search + u.hash);
}
const BUILT = new Set();
function showOv(key) {
  $$('#pane-mt1 .ov-pane').forEach(p => { p.hidden = p.dataset.ov !== key; });
  $$('#pane-mt1 .ov-tab').forEach(b => { const on = b.dataset.ov === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
function showTab(key) {
  if (!$(`.majorpane[data-tab="${key}"]`)) key = 'mt1';
  $$('.majorpane').forEach(p => p.classList.toggle('active', p.dataset.tab === key));
  $$('.majortabbtn').forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
  if (location.hash !== '#' + key) history.replaceState(null, '', location.pathname + location.search + '#' + key);
  if (key === 'mt3' && window.RubberFinance && !$('#cs-fin-root').childElementCount) RubberFinance.build($('#cs-fin-root'));
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
function asof() {
  const t = {price: () => `${dL(last('vn_svr10').date)} (ARBC, sàn TQ) · ${mL(last('wb_tsr20').date)} (World Bank)`, export: () => mL(last('exp_q').date) + ' (Hải quan)',
    fin: () => F ? `BCTC đến ${qL(F.periods.at(-1))} · tải ${dL(F.captured)}` : ''};
  $$('[data-asof]').forEach(n => { try { n.textContent = t[n.dataset.asof] ? 'Dữ liệu mới nhất: ' + t[n.dataset.asof]() : ''; } catch (e) { n.textContent = ''; } });
}
window.RubberKit = {card, chart, seg, panel, kpi, kpiRow, two, heat, seasonal, waterfall, flow, stage, renum, el, esc, nf, sg, mL, qL, dL, last, recs, yoy, val, months, ymAdd, lastYears, tail, SRC, C, E, F, D, PIC, $};
function init() {
  brief(); overview(); listed(); asof();
  $$('#pane-mt1 .ov-tab').forEach(b => b.addEventListener('click', () => showOv(b.dataset.ov)));
  $$('#pane-mt2 .pp-tab').forEach(b => b.addEventListener('click', () => { showPic(b.dataset.sub); setTimeout(() => window.dispatchEvent(new Event('resize')), 30); }));
  $$('.majortabbtn').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  addEventListener('hashchange', () => showTab(location.hash.slice(1)));
  document.addEventListener('click', e => { if (e.target.closest('.vc-status button')) showOv('listed'); });
  showOv('map');
  // Sub-tab không có khối nào (dữ liệu chưa có) thì ẩn nút.
  $$('#pane-mt2 .pp-tab').forEach(b => { if (!PIC[b.dataset.sub]) { b.hidden = true; const pn = $(`#pane-mt2 .pp-pane[data-sub="${b.dataset.sub}"]`); if (pn) pn.hidden = true; } });
  showPic(new URLSearchParams(location.search).get('sub') || 'price');
  showTab(location.hash.slice(1) || 'mt1');
}
if (window.SectorBoot) SectorBoot.add(10, init); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
