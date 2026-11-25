/* Dashboard ngành Phân bón (Phan-bon/). Trang viết sẵn bố cục cuối; file này chỉ:
   - chuyển tab chính / sub-tab (hash #mt1, #mt2…; ?sub=price|cost|output|fin),
   - vẽ chart vào các thẻ [data-chart] khi thẻ hiện lần đầu (Chart.js không vẽ được trong khung ẩn),
   - mỗi chart có ⓘ (cách đọc, cách tính), nút Bảng (số liệu đúng như chart) và dòng "Nguồn:" hiện sẵn ở góc phải dưới.
   Chỉ mô tả dữ liệu; không viết nhận định. Dữ liệu: window.FERT_DATA (scripts/build_fertilizer.py). */
(() => {
'use strict';
const D = window.FERT_DATA;
if (!D) return;
const S = D.series || {};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fin = v => typeof v === 'number' && Number.isFinite(v);
const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '–';
const pct = (v, d = 1) => fin(v) ? (v > 0 ? '+' : '') + nf(v, d) + '%' : '–';
const mLabel = ym => { const [y, m] = ym.split('-'); return `T${+m}/${y}`; };
const qLabel = p => `Q${p.slice(5)}/${p.slice(0, 4)}`;
const dLabel = d => d.split('-').reverse().join('/');
const C = {navy: '#2938A8', gold: '#c98a00', teal: '#2a9fa3', grey: '#3d4653', plum: '#861C52', sky: '#8997D6', green: '#1f8a5b', red: '#c0392b'};
const SRC = {
  wb: '<a href="https://www.worldbank.org/en/research/commodity-markets" target="_blank" rel="noopener">World Bank · Pink Sheet</a>',
  zce: '<a href="https://finance.sina.com.cn/futures/quotes/UR0.shtml" target="_blank" rel="noopener">Sina Finance · ZCE UR0</a>',
  nso: '<a href="https://www.nso.gov.vn/" target="_blank" rel="noopener">Cục Thống kê · số liệu KT-XH tháng</a>',
  vnd: '<a href="https://dstock.vndirect.com.vn/" target="_blank" rel="noopener">VNDirect · BCTC hợp nhất</a>',
  law: 'Luật Thuế GTGT số 48/2024/QH15 (<a href="https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-thue-gia-tri-gia-tang-sua-doi-556390.aspx" target="_blank" rel="noopener">văn bản</a>, <a href="https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/02/12-vbhn-vpqh.pdf" target="_blank" rel="noopener">văn bản hợp nhất</a>); Luật số 71/2014/QH13',
  ar: 'Báo cáo thường niên, website doanh nghiệp'
};
const recs = k => (S[k] && S[k].records) || [];
const last = k => recs(k).at(-1);
const valAt = (k, date) => recs(k).find(r => r.date === date)?.value;
const ink = () => getComputedStyle(document.documentElement).getPropertyValue('--fb-ink2').trim() || '#3b4256';
const grid = () => getComputedStyle(document.documentElement).getPropertyValue('--fb-line').trim() || '#e3e7f0';

/* ---------- khung thẻ chart ---------- */
const charts = {};
function card(el, o) {
  el.innerHTML = '';
  const title = make('div', 'chart-title', esc(o.title) + (o.unit ? `<span class="fb-unit">${esc(o.unit)}</span>` : ''));
  const tools = make('div', 'fb-tools');
  const infoBtn = make('button', '', 'ⓘ'); infoBtn.type = 'button'; infoBtn.title = 'Cách đọc, cách tính'; infoBtn.setAttribute('aria-expanded', 'false');
  const tblBtn = make('button', '', 'Bảng'); tblBtn.type = 'button'; tblBtn.setAttribute('aria-pressed', 'false');
  if (o.info) tools.append(infoBtn);
  if (o.table) tools.append(tblBtn);
  const info = make('div', 'fb-info', o.info || ''); info.hidden = true;
  const body = make('div', o.html ? 'fb-html' : 'fb-canvas');
  const table = make('div', 'fb-table'); table.hidden = true;
  const src = make('p', 'pw-src', 'Nguồn: ' + o.source);
  el.append(title, tools, info, body, table, src);
  if (o.note) el.append(make('p', 'pw-src-note', esc(o.note)));
  infoBtn.addEventListener('click', () => { info.hidden = !info.hidden; infoBtn.setAttribute('aria-expanded', String(!info.hidden)); });
  tblBtn.addEventListener('click', () => {
    const on = table.hidden; table.hidden = !on; body.hidden = on; tblBtn.setAttribute('aria-pressed', String(on));
    if (on) table.innerHTML = tableHtml(o.table());
  });
  if (o.html) body.innerHTML = o.html;
  return body;
}
function tableHtml(t) {
  const head = '<tr>' + t.head.map(h => `<th>${esc(h)}</th>`).join('') + '</tr>';
  const rows = t.rows.map(r => '<tr>' + r.map((c, i) => `<td>${i === 0 ? esc(c) : (fin(c) ? nf(c, t.digits ?? 1) : esc(c ?? '–'))}</td>`).join('') + '</tr>').join('');
  return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}
// Bảng từ các chuỗi của chart: cột = chuỗi, dòng = kỳ (mới nhất trên cùng).
const seriesTable = (labels, sets, digits = 1) => ({head: ['Kỳ', ...sets.map(s => s.label)], rows: labels.map((l, i) => [l, ...sets.map(s => s.data[i])]).reverse(), digits});

function draw(el, cfg) {
  const id = el.closest('[data-chart]').dataset.chart;
  charts[id]?.destroy();
  const cv = make('canvas'); el.replaceChildren(cv);
  const base = {responsive: true, maintainAspectRatio: false, animation: false, interaction: {mode: 'index', intersect: false},
    plugins: {legend: {position: 'bottom', labels: {boxWidth: 10, boxHeight: 10, color: ink(), font: {size: 12}}},
      tooltip: {filter: c => c.raw != null, callbacks: {label: c => `${c.dataset.label}: ${fin(c.parsed.y ?? c.parsed.x) ? nf(c.parsed[cfg.type === 'bar' && cfg.options?.indexAxis === 'y' ? 'x' : 'y'], cfg.digits ?? 1) : '–'}`}}},
    scales: {x: {ticks: {color: ink(), maxRotation: 0, autoSkip: true, autoSkipPadding: 14}, grid: {display: false}},
      y: {ticks: {color: ink(), callback: v => nf(v, cfg.yDigits ?? 0)}, grid: {color: grid()}}}};
  const options = merge(base, cfg.options || {});
  charts[id] = new Chart(cv, {type: cfg.type || 'line', data: cfg.data, options, plugins: cfg.plugins || []});
}
function merge(a, b) { const o = {...a}; for (const k in b) o[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' ? merge(a[k], b[k]) : b[k]; return o; }
const line = (label, data, color, extra = {}) => ({label, data, borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 0, pointHoverRadius: 3, tension: .2, spanGaps: false, ...extra});
const bar = (label, data, color, extra = {}) => ({label, data, backgroundColor: color, borderColor: color, borderWidth: 0, ...extra});
// Vạch dọc đánh dấu một mốc (vd. thuế GTGT 5% từ 01/07/2025).
const marker = (labelAt, text) => ({id: 'fbMarker', afterDraw(chart) {
  const x = chart.scales.x, i = chart.data.labels.indexOf(labelAt); if (i < 0) return;
  const px = x.getPixelForValue(i), {top, bottom} = chart.chartArea, ctx = chart.ctx;
  ctx.save(); ctx.strokeStyle = C.plum; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, bottom); ctx.stroke();
  ctx.setLineDash([]); ctx.fillStyle = C.plum; ctx.font = '600 11px Inter, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(text, px + 4, top + 12); ctx.restore();
}});

/* ---------- chuỗi tháng ---------- */
function monthAxis(keys, from) {
  const set = new Set(); keys.forEach(k => recs(k).forEach(r => { if (r.date >= from) set.add(r.date); }));
  return [...set].sort();
}
const align = (k, labels) => { const m = new Map(recs(k).map(r => [r.date, r.value])); return labels.map(l => m.has(l) ? m.get(l) : null); };
const yoy = (k, date) => { const [y, m] = date.split('-'); const a = valAt(k, date), b = valAt(k, `${+y - 1}-${m}`); return fin(a) && fin(b) && b ? (a / b - 1) * 100 : null; };

/* ---------- KPI đầu trang ---------- */
function kpis() {
  const host = $('#fb-kpis'); if (!host) return;
  const zce = last('urea_zce_daily');
  const zceYoy = (() => { if (!zce) return null; const d = new Date(zce.date); d.setFullYear(d.getFullYear() - 1); const t = d.toISOString().slice(0, 10);
    const r = recs('urea_zce').find(x => x.date === t.slice(0, 7)); return r ? (zce.value / r.value - 1) * 100 : null; })();
  const items = [
    ['Urê thế giới · ' + mLabel(last('urea').date), nf(last('urea').value, 0), 'USD/tấn', yoy('urea', last('urea').date), 'so cùng kỳ'],
    ['Urê Trịnh Châu · ' + dLabel(zce.date), nf(zce.value, 0), 'CNY/tấn', zceYoy, 'so cuối tháng cùng kỳ'],
    ['DAP · ' + mLabel(last('dap').date), nf(last('dap').value, 0), 'USD/tấn', yoy('dap', last('dap').date), 'so cùng kỳ'],
    ['Khí châu Âu (TTF) · ' + mLabel(last('gas_eu').date), nf(last('gas_eu').value, 2), 'USD/MMBtu', yoy('gas_eu', last('gas_eu').date), 'so cùng kỳ'],
  ];
  host.innerHTML = items.map(([l, v, u, g, gl]) => `<div class="kpi card"><div class="l">${esc(l)}</div><div class="v">${v} <small class="fb-unit">${u}</small></div>`
    + `<div class="d">${fin(g) ? `<b class="${g >= 0 ? 'up' : 'down'}">${pct(g)}</b> ${gl}` : ''}</div></div>`).join('');
}

/* ---------- định nghĩa từng chart ---------- */
const F = D.fin, E = F && window.IndustryFin ? window.IndustryFin.create(F) : null;
const groupColor = Object.fromEntries((F?.groups || []).map(g => [g.id, g.color]));
const finState = {mode: 'q', n: 12, groups: new Set((F?.groups || []).map(g => g.id))};
const finSel = () => E ? E.tickersOf([...finState.groups]) : [];
const finLabels = res => { const L = res.labels.map(l => finState.mode === 'y' ? l : qLabel(l)); return L; };
// Cắt n kỳ gần nhất có số (bỏ kỳ đầu toàn null khi TTM).
function cut(labels, sets) {
  let end = labels.length; while (end > 0 && sets.every(s => !fin(s.data[end - 1]))) end--;
  const n = finState.mode === 'y' ? labels.length : finState.n, start = Math.max(0, end - n);
  return {labels: labels.slice(start, end), sets: sets.map(s => ({...s, data: s.data.slice(start, end)}))};
}
const modeText = () => ({q: 'theo quý', ttm: '4 quý gần nhất cộng dồn', y: 'theo năm'})[finState.mode];
const lastQ = F ? F.periods.at(-1) : null;

const SPEC = {
  chain: () => ({
    title: 'Chuỗi giá trị ngành phân bón và doanh nghiệp niêm yết', source: SRC.ar,
    info: 'Sơ đồ xếp doanh nghiệp theo sản phẩm chính. Đạm urê đi từ khí tự nhiên hoặc than qua amoniac; lân và DAP đi từ quặng apatit và axit; NPK phối trộn đạm, lân, kali (kali Việt Nam nhập khẩu).',
    html: `<div class="fb-chain">
      <div class="fb-col"><h4>Nguyên liệu</h4>
        <div class="fb-node" style="--c:${C.navy}"><b>Khí tự nhiên</b>nguồn khí trong nước</div>
        <div class="fb-node" style="--c:${C.grey}"><b>Than</b>than antraxit</div>
        <div class="fb-node" style="--c:${C.gold}"><b>Quặng apatit, lưu huỳnh</b>apatit Lào Cai</div>
        <div class="fb-node" style="--c:${C.teal}"><b>Kali (MOP)</b>nhập khẩu</div></div>
      <div class="fb-col"><h4>Trung gian</h4>
        <div class="fb-node" style="--c:${C.navy}"><b>Amoniac (NH₃)</b>từ khí hoặc than</div>
        <div class="fb-node" style="--c:${C.gold}"><b>Axit sulfuric, axit phosphoric</b>từ lưu huỳnh, apatit</div></div>
      <div class="fb-col"><h4>Phân bón · doanh nghiệp</h4>
        <div class="fb-node" style="--c:${C.navy}"><b>Urê từ khí</b><span class="fb-tk">DPM</span><span class="fb-tk">DCM</span></div>
        <div class="fb-node" style="--c:${C.grey}"><b>Urê từ than</b><span class="fb-tk">DHB</span></div>
        <div class="fb-node" style="--c:${C.gold}"><b>DAP, supe lân, lân nung chảy</b><span class="fb-tk">DDV</span><span class="fb-tk">LAS</span><span class="fb-tk">VAF</span><span class="fb-tk">NFC</span></div>
        <div class="fb-node" style="--c:${C.teal}"><b>NPK phối trộn</b><span class="fb-tk">BFC</span><span class="fb-tk">SFG</span> · DPM, DCM, LAS cũng có NPK</div></div>
      <div class="fb-col"><h4>Đầu ra</h4>
        <div class="fb-node" style="--c:${C.sky}"><b>Tiêu thụ trong nước</b>lúa, cà phê, cây ăn trái, rau màu</div>
        <div class="fb-node" style="--c:${C.sky}"><b>Xuất khẩu</b>Campuchia, Hàn Quốc, Philippines…</div></div>
    </div>`
  }),
  scale: () => {
    if (!E) return null;
    const sel = E.tickers, rev = E.total('revenue', sel, 'ttm'), np = E.total('npat_parent', sel, 'ttm'), i = rev.labels.length - 1;
    const rows = sel.map(t => ({t, g: E.groupOf[t], r: rev.per[t][i], p: np.per[t][i]})).sort((a, b) => (b.r ?? -1) - (a.r ?? -1));
    return {title: `Doanh thu và lợi nhuận 4 quý gần nhất (đến ${qLabel(lastQ)})`, unit: 'tỷ đồng', source: SRC.vnd,
      info: 'Cộng 4 quý gần nhất của BCTC hợp nhất. Lợi nhuận là LNST thuộc cổ đông công ty mẹ. Màu cột doanh thu theo nhóm sản phẩm chính.',
      table: () => ({head: ['Mã', 'Nhóm', 'Doanh thu', 'LNST cổ đông mẹ'], rows: rows.map(r => [r.t, F.groups.find(g => g.id === r.g).label, r.r, r.p]), digits: 0}),
      // Mỗi nhóm một chuỗi doanh thu (chú giải theo màu nhóm), cùng chồng 'rev'; LNST chồng riêng 'np' đứng cạnh.
      chart: {type: 'bar', digits: 0, data: {labels: rows.map(r => r.t), datasets: [
        ...F.groups.map(g => bar('Doanh thu · ' + g.label, rows.map(r => r.g === g.id ? r.r : null), g.color, {stack: 'rev'})),
        bar('LNST cổ đông mẹ', rows.map(r => r.p), C.sky, {stack: 'np'})]},
        options: {scales: {x: {stacked: true}, y: {stacked: true}}}}};
  },
  prices: () => {
    const keys = ['urea', 'dap', 'tsp', 'potash', 'phosrock'], L = monthAxis(keys, '2019-01');
    const sets = [line('Urê', align('urea', L), C.navy), line('DAP', align('dap', L), C.gold), line('TSP', align('tsp', L), C.plum),
      line('Kali clorua', align('potash', L), C.teal), line('Quặng phosphate', align('phosrock', L), C.grey, {borderDash: [4, 3]})];
    const labels = L.map(mLabel);
    return {title: 'Giá phân bón và nguyên liệu thế giới', unit: 'USD/tấn, bình quân tháng', source: SRC.wb,
      info: 'Urê: hạt, FOB Trung Đông. DAP: FOB Mỹ vùng Vịnh. TSP: supe lân kép. Kali clorua: MOP. Quặng phosphate: Morocco. Số bình quân tháng do World Bank công bố (cập nhật đầu tháng sau).',
      table: () => seriesTable(labels, sets, 1), chart: {data: {labels, datasets: sets}}};
  },
  zce: () => {
    const R = recs('urea_zce_daily'), labels = R.map(r => dLabel(r.date)), sets = [line('Urê ZCE (HĐ liên tục)', R.map(r => r.value), C.navy)];
    return {title: 'Urê tương lai Trịnh Châu · 1 năm', unit: 'CNY/tấn', source: SRC.zce,
      info: 'Giá đóng cửa ngày của hợp đồng urê liên tục (UR0) trên Sở Giao dịch hàng hóa Trịnh Châu. Hợp đồng liên tục chuyển kỳ hạn, nên chênh lệch qua ngày chuyển có thể gồm khoảng chênh giữa hai kỳ hạn.',
      table: () => seriesTable(labels, sets, 0), chart: {digits: 0, data: {labels, datasets: sets}}};
  },
  yoy: () => {
    const lastM = last('urea').date, [y, m] = lastM.split('-').map(Number);
    const months = Array.from({length: 12}, (_, i) => { const d = new Date(y, m - 12 + i, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
    const labels = months.map(mLabel), sets = [bar('Urê', months.map(d => yoy('urea', d)), C.navy), bar('DAP', months.map(d => yoy('dap', d)), C.gold), bar('Kali clorua', months.map(d => yoy('potash', d)), C.teal)];
    return {title: 'Giá so cùng kỳ năm trước', unit: '%', source: SRC.wb, info: 'Giá bình quân tháng so với cùng tháng năm trước, tính từ số World Bank.',
      table: () => seriesTable(labels, sets, 1), chart: {type: 'bar', data: {labels, datasets: sets}, options: {scales: {y: {ticks: {callback: v => nf(v, 0) + '%'}}}}}};
  },
  gas: () => {
    const L = monthAxis(['gas_us', 'gas_eu', 'lng_jp'], '2019-01'), labels = L.map(mLabel);
    const sets = [line('Khí châu Âu (TTF)', align('gas_eu', L), C.navy), line('LNG nhập khẩu Nhật Bản', align('lng_jp', L), C.gold), line('Khí Mỹ (Henry Hub)', align('gas_us', L), C.teal)];
    return {title: 'Giá khí tự nhiên', unit: 'USD/MMBtu, bình quân tháng', source: SRC.wb, info: 'Khí là nguyên liệu chính để sản xuất amoniac rồi urê. Ba chuỗi bình quân tháng của World Bank: TTF (châu Âu), LNG nhập khẩu Nhật Bản, Henry Hub (Mỹ).',
      table: () => seriesTable(labels, sets, 2), chart: {digits: 2, yDigits: 0, data: {labels, datasets: sets}}};
  },
  spread: () => {
    const L = monthAxis(['urea', 'gas_eu'], '2019-01'), labels = L.map(mLabel), u = align('urea', L), g = align('gas_eu', L);
    const cost = g.map(v => fin(v) ? v * 22 : null), sp = u.map((v, i) => fin(v) && fin(cost[i]) ? v - cost[i] : null);
    const sets = [line('Giá urê', u, C.navy), line('Chi phí khí cho 1 tấn urê ở châu Âu', cost, C.gold), bar('Chênh lệch', sp, 'rgba(137,151,214,.45)', {type: 'bar'})];
    return {title: 'Giá urê so với chi phí khí ở châu Âu (tự tính)', unit: 'USD/tấn', source: SRC.wb,
      info: 'Chi phí khí = giá khí TTF × 22 MMBtu cho mỗi tấn urê (mức tiêu hao giả định của nhà máy dùng khí). Chênh lệch = giá urê − chi phí khí; chưa trừ chi phí khác. Không phản ánh giá khí của nhà máy trong nước.',
      table: () => seriesTable(labels, sets, 0), chart: {digits: 0, data: {labels, datasets: sets}}};
  },
  oilcoal: () => {
    const L = monthAxis(['brent', 'coal_au'], '2019-01'), labels = L.map(mLabel);
    const sets = [line('Dầu Brent (USD/thùng)', align('brent', L), C.navy, {yAxisID: 'y'}), line('Than Úc (USD/tấn)', align('coal_au', L), C.grey, {yAxisID: 'y1'})];
    return {title: 'Dầu Brent và than Úc', unit: 'bình quân tháng', source: SRC.wb, info: 'Trục trái: Brent (USD/thùng). Trục phải: than Úc Newcastle (USD/tấn). Than là nguyên liệu của urê từ than.',
      table: () => seriesTable(labels, sets, 1), chart: {data: {labels, datasets: sets}, options: {scales: {y1: {position: 'right', grid: {display: false}, ticks: {color: ink()}}}}}};
  },
  output: () => {
    const L = monthAxis(['urea_output', 'npk_output'], '2021-01'), labels = L.map(mLabel);
    const sets = [bar('Phân urê', align('urea_output', L), C.navy), bar('Phân NPK', align('npk_output', L), C.teal)];
    return {title: 'Sản lượng phân bón sản xuất trong nước theo tháng', unit: 'nghìn tấn', source: SRC.nso,
      info: 'Sản lượng sản phẩm công nghiệp chủ yếu do Cục Thống kê công bố hằng tháng. Tháng gần nhất là số ước tính; số sơ bộ của tháng trước thay số ước tính khi có biểu tháng sau. Tháng không có số để trống.',
      table: () => seriesTable(labels, sets, 1), chart: {type: 'bar', data: {labels, datasets: sets}}};
  },
  outputYtd: () => {
    const lm = last('urea_output').date, M = +lm.slice(5), years = [...new Set(recs('urea_output').map(r => r.date.slice(0, 4)))].filter(y => y >= '2019');
    const sum = (k, y) => { let s = 0; for (let m = 1; m <= M; m++) { const v = valAt(k, `${y}-${String(m).padStart(2, '0')}`); if (!fin(v)) return null; s += v; } return s; };
    const labels = years.map(y => `${M}T/${y}`), sets = [bar('Phân urê', years.map(y => sum('urea_output', y)), C.navy), bar('Phân NPK', years.map(y => sum('npk_output', y)), C.teal)];
    return {title: `Sản lượng lũy kế ${M} tháng đầu năm`, unit: 'nghìn tấn', source: SRC.nso,
      info: `Cộng tháng 1 đến tháng ${M} của từng năm. Năm thiếu số một tháng thì để trống, không ước lượng.`,
      table: () => seriesTable(labels, sets, 1), chart: {type: 'bar', data: {labels, datasets: sets}}};
  },
  finRevenue: () => finGroupBar('revenue', 'Doanh thu thuần theo nhóm', 'Tổng doanh thu thuần của các doanh nghiệp trong nhóm.'),
  finProfit: () => finGroupBar('npat_parent', 'LNST cổ đông công ty mẹ theo nhóm', 'Tổng LNST thuộc cổ đông công ty mẹ của các doanh nghiệp trong nhóm.'),
  finInventory: () => finGroupBar('inventory', 'Hàng tồn kho cuối kỳ theo nhóm', 'Số dư hàng tồn kho cuối kỳ (chế độ Năm: cuối quý 4).', true),
  finMargin: () => finGroupRatio({m: 'gross'}, {m: 'revenue'}, 'Biên lợi nhuận gộp theo nhóm', 'Biên gộp nhóm = tổng LN gộp ÷ tổng doanh thu của các doanh nghiệp có đủ cả hai số trong kỳ (không lấy trung bình các biên).'),
  finRoe: () => {
    if (!E) return null;
    // ROE = LNST hợp nhất (4 quý hoặc năm) ÷ VCSH bình quân; chỉ tính doanh nghiệp có VCSH dương ở cả hai đầu kỳ (VCSH âm làm hệ số vô nghĩa).
    const mode = finState.mode === 'q' ? 'ttm' : finState.mode, k = mode === 'y' ? 1 : 4, sel = finSel();
    const num = E.per('npat', sel, mode), den = E.per('equity', sel, mode, true), eq = E.per('equity', sel, mode === 'y' ? 'y' : 'q');
    const L = E.labels(mode), ok = (t, i) => fin(num[t][i]) && fin(den[t][i]) && den[t][i] > 0 && eq[t][i] > 0 && eq[t][i - k] > 0;
    const roe = ts => L.map((_, i) => { const u = ts.filter(t => ok(t, i)); if (!u.length) return null; const d = u.reduce((a, t) => a + den[t][i], 0); return u.reduce((a, t) => a + num[t][i], 0) / d * 100; });
    const gs = F.groups.filter(g => sel.some(t => E.groupOf[t] === g.id));
    const sets0 = [...gs.map(g => line(g.label, roe(sel.filter(t => E.groupOf[t] === g.id)), g.color)), line('Cả nhóm chọn', roe(sel), C.plum, {borderDash: [5, 4]})];
    const {labels, sets} = cut(L.map(l => mode === 'y' ? l : qLabel(l)), sets0);
    return {title: 'ROE theo nhóm', unit: '% · ' + (mode === 'y' ? 'theo năm' : '4 quý gần nhất cộng dồn'), source: SRC.vnd,
      info: 'ROE nhóm = tổng LNST hợp nhất ÷ tổng VCSH bình quân (cuối kỳ và cùng kỳ năm trước, gồm cổ đông không kiểm soát). Doanh nghiệp có VCSH âm ở một trong hai đầu kỳ không được tính kỳ đó. Chế độ Quý dùng 4 quý gần nhất cộng dồn.',
      table: () => seriesTable(labels, sets, 1), chart: {data: {labels, datasets: sets}, options: {scales: {y: {ticks: {callback: v => nf(v, 0) + '%'}}}}}};
  },
  finNetDebt: () => {
    if (!E) return null;
    const sel = finSel(), i = F.periods.length - 1;
    const rows = sel.map(t => ({t, g: E.groupOf[t], v: E.series(t, 'net_debt', 'q')[i]})).sort((a, b) => (a.v ?? 0) - (b.v ?? 0));
    return {title: `Nợ vay ròng cuối ${qLabel(lastQ)}`, unit: 'tỷ đồng', source: SRC.vnd,
      info: 'Nợ vay ròng = vay ngắn hạn + vay dài hạn − tiền − đầu tư tài chính ngắn hạn. Số âm: tiền và tiền gửi nhiều hơn nợ vay.',
      table: () => ({head: ['Mã', 'Nợ vay ròng'], rows: rows.map(r => [r.t, r.v]), digits: 0}),
      chart: {type: 'bar', digits: 0, data: {labels: rows.map(r => r.t), datasets: [bar('Nợ vay ròng', rows.map(r => r.v), rows.map(r => groupColor[r.g]))]},
        options: {indexAxis: 'y', plugins: {legend: {display: false}}, scales: {x: {grid: {color: grid()}, ticks: {callback: v => nf(v, 0)}}, y: {grid: {display: false}, ticks: {callback(v) { return this.getLabelForValue(v); }}}}}}};
  },
  vat: () => ({
    title: 'Thuế GTGT đối với phân bón', source: SRC.law,
    info: 'Hai mốc thay đổi cách tính thuế giá trị gia tăng với phân bón. Khi không chịu thuế, thuế GTGT đầu vào của nhà sản xuất không được khấu trừ; khi chịu thuế 5%, thuế đầu vào được khấu trừ.',
    html: `<div class="fb-timeline">
      <div class="fb-step"><div class="fb-when">01/01/2015 → 30/06/2025 · Luật số 71/2014/QH13</div><div class="fb-big">Không chịu thuế</div><div class="fb-what">Phân bón chuyển sang nhóm không chịu thuế GTGT; thuế GTGT đầu vào không được khấu trừ.</div></div>
      <div class="fb-step now"><div class="fb-when">Từ 01/07/2025 · Luật Thuế GTGT số 48/2024/QH15</div><div class="fb-big">5%</div><div class="fb-what">Phân bón chịu thuế suất 5%; thuế GTGT đầu vào được khấu trừ.</div></div>
    </div>`
  }),
  vatMargin: () => {
    if (!E) return null;
    const tick = ['DPM', 'DCM', 'DHB', 'DDV', 'BFC'], P = F.periods, start = P.indexOf('2023Q1');
    const labels = P.slice(start).map(qLabel), cols = [C.navy, C.sky, C.grey, C.gold, C.teal];
    const sets = tick.map((t, j) => line(t, E.ratio({m: 'gross'}, {m: 'revenue'}, [t], 'q', 100).values.slice(start), cols[j]));
    return {title: 'Biên lợi nhuận gộp theo quý quanh mốc thuế GTGT 5%', unit: '%', source: SRC.vnd,
      info: 'Biên gộp = LN gộp ÷ doanh thu thuần của từng doanh nghiệp, theo quý. Vạch đứt: quý 3/2025, quý đầu tiên áp dụng thuế GTGT 5%.',
      table: () => seriesTable(labels, sets, 1), chart: {data: {labels, datasets: sets}, plugins: [marker('Q3/2025', 'GTGT 5%')], options: {scales: {y: {ticks: {callback: v => nf(v, 0) + '%'}}}}}};
  },
};
function finGroupBar(m, title, info, stock) {
  if (!E) return null;
  const res = E.byGroup(m, finSel(), finState.mode === 'ttm' && stock ? 'q' : finState.mode);
  const raw = finLabels(res), sets0 = res.groups.map(g => bar(g.label, g.values, g.color, {stack: 's'}));
  const {labels, sets} = cut(raw, sets0);
  return {title, unit: 'tỷ đồng · ' + (stock ? (finState.mode === 'y' ? 'cuối năm' : 'cuối quý') : modeText()), source: SRC.vnd, info: info + ' Doanh nghiệp thiếu số kỳ nào thì không được cộng kỳ đó.',
    table: () => seriesTable(labels, sets, 0), chart: {type: 'bar', digits: 0, data: {labels, datasets: sets}, options: {scales: {x: {stacked: true}, y: {stacked: true}}}}};
}
function finGroupRatio(num, den, title, info) {
  if (!E) return null;
  const sel = finSel(), gs = F.groups.filter(g => sel.some(t => E.groupOf[t] === g.id));
  const raw = finLabels(E.ratio(num, den, sel, finState.mode, 100));
  const sets0 = [...gs.map(g => line(g.label, E.ratio(num, den, E.tickersOf([g.id]), finState.mode, 100).values, g.color)),
    line('Cả nhóm chọn', E.ratio(num, den, sel, finState.mode, 100).values, C.plum, {borderDash: [5, 4]})];
  const {labels, sets} = cut(raw, sets0);
  return {title, unit: '% · ' + modeText(), source: SRC.vnd, info, table: () => seriesTable(labels, sets, 1),
    chart: {data: {labels, datasets: sets}, options: {scales: {y: {ticks: {callback: v => nf(v, 0) + '%'}}}}}};
}

/* ---------- vẽ khi thẻ hiện ---------- */
function render(el) {
  const f = SPEC[el.dataset.chart]; if (!f) return;
  const o = f(); if (!o) { el.hidden = true; return; }
  const body = card(el, o);
  if (o.chart) draw(body, o.chart);
  el.dataset.rendered = '1';
}
function renderVisible(root) { $$('[data-chart]', root).forEach(el => { if (!el.dataset.rendered && el.offsetParent !== null) render(el); }); }

/* ---------- bộ lọc Tài chính ngành ---------- */
function finControls() {
  const host = $('#fb-fin-controls'); if (!host || !F) return;
  host.innerHTML = `<label>Kỳ <select data-k="mode"><option value="q">Quý</option><option value="ttm">4 quý cộng dồn</option><option value="y">Năm</option></select></label>`
    + `<label>Số kỳ <select data-k="n"><option value="8">8</option><option value="12" selected>12</option><option value="20">20</option><option value="99">Tất cả</option></select></label>`
    + F.groups.map(g => `<label><input type="checkbox" data-g="${g.id}" checked><span class="fb-dot" style="background:${g.color}"></span>${esc(g.label)} <small>(${F.companies.filter(c => c.group === g.id).map(c => c.ticker).join(', ')})</small></label>`).join('');
  const redraw = () => $$('#pane-mt2 .fb-subpane[data-sub="fin"] [data-chart]').forEach(render);
  host.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.k === 'mode') finState.mode = t.value;
    if (t.dataset.k === 'n') finState.n = +t.value;
    if (t.dataset.g) { t.checked ? finState.groups.add(t.dataset.g) : finState.groups.delete(t.dataset.g); if (!finState.groups.size) { t.checked = true; finState.groups.add(t.dataset.g); } }
    redraw();
  });
}

/* ---------- tab chính, sub-tab ---------- */
function showTab(key) {
  if (!$(`.majorpane[data-tab="${key}"]`)) key = 'mt1';
  $$('.majorpane').forEach(p => p.classList.toggle('active', p.dataset.tab === key));
  $$('.majortabbtn').forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
  if (location.hash !== '#' + key) history.replaceState(null, '', location.pathname + location.search + '#' + key);
  renderVisible($(`.majorpane[data-tab="${key}"]`));
}
function showSub(key) {
  if (!$(`.fb-subpane[data-sub="${key}"]`)) key = 'price';
  $$('.fb-subpane').forEach(p => { p.hidden = p.dataset.sub !== key; });
  $$('.fb-subtab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.sub === key)));
  const u = new URL(location.href); u.searchParams.set('sub', key); history.replaceState(null, '', u.pathname + u.search + u.hash);
  renderVisible($(`.fb-subpane[data-sub="${key}"]`));
}
function asof() {
  const txt = {urea: () => 'Số mới nhất: ' + mLabel(last('urea').date) + ' (World Bank) · ' + dLabel(last('urea_zce_daily').date) + ' (Trịnh Châu)',
    gas_eu: () => 'Số mới nhất: ' + mLabel(last('gas_eu').date), urea_output: () => 'Số mới nhất: ' + mLabel(last('urea_output').date),
    fin: () => F ? 'BCTC đến ' + qLabel(lastQ) + ' · tải ' + dLabel(F.captured) : ''};
  $$('[data-asof]').forEach(n => { try { n.textContent = txt[n.dataset.asof](); } catch (e) { n.textContent = ''; } });
}
function sources() {
  const host = $('#fb-sources'); if (!host) return;
  const rows = [
    ['Giá urê, DAP, TSP, quặng phosphate, kali; khí TTF, Henry Hub, LNG Nhật; Brent; than Úc', 'World Bank · Pink Sheet (bình quân tháng)', 'đến ' + mLabel(last('urea').date), 'scripts/fetch_fertilizer_markets.py'],
    ['Urê tương lai Trịnh Châu (UR0)', 'Sina Finance · Sở GDHH Trịnh Châu', 'đến ' + dLabel(last('urea_zce_daily').date), 'scripts/fetch_fertilizer_markets.py'],
    ['Sản lượng phân urê, phân NPK', 'Cục Thống kê · biểu KT-XH tháng', 'đến ' + mLabel(last('urea_output').date), 'scripts/fetch_fertilizer_nso.py'],
    ['BCTC hợp nhất theo quý của DPM, DCM, DHB, DDV, LAS, VAF, NFC, BFC, SFG', 'VNDirect finfo', F ? 'đến ' + qLabel(lastQ) : '', 'scripts/fetch_fertilizer_financials.py'],
    ['Thuế GTGT với phân bón', 'Luật 71/2014/QH13; Luật 48/2024/QH15', 'hiệu lực 01/07/2025', 'nhập tay'],
  ];
  host.innerHTML = `<div class="chart-title">Nguồn dữ liệu</div><div class="fb-table fb-src-table"><table><thead><tr><th>Dữ liệu</th><th>Nguồn</th><th>Kỳ</th><th>Cách lấy</th></tr></thead><tbody>`
    + rows.map(r => '<tr>' + r.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + `</tbody></table></div>`
    + `<p class="pw-src">Dữ liệu dựng lại bằng scripts/build_fertilizer.py · ${esc(dLabel(D.built_at.slice(0, 10)))}</p>`;
}

function init() {
  kpis(); asof(); sources(); finControls();
  $$('.majortabbtn').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $$('.fb-subtab').forEach(b => b.addEventListener('click', () => showSub(b.dataset.sub)));
  addEventListener('hashchange', () => showTab(location.hash.slice(1)));
  const sub = new URLSearchParams(location.search).get('sub');
  if (sub) showSub(sub); else $$('.fb-subpane').forEach(p => { p.hidden = p.dataset.sub !== 'price'; });
  showTab(location.hash.slice(1) || 'mt1');
  // Đổi giao diện sáng/tối: vẽ lại để chữ trục theo màu mới.
  new MutationObserver(() => $$('[data-chart][data-rendered]').forEach(el => { if (el.offsetParent !== null) render(el); else delete el.dataset.rendered; }))
    .observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
