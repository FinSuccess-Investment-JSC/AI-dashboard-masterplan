/* BĐS dân cư · chart cho tab Chính sách (27/11/2026, người dùng: "thêm chart cho tab chính sách").
   Mỗi chart trả lời "chính sách tác động vào thị trường thế nào", có vạch đánh dấu mốc hiệu lực.
   Không lặp chart ở Bức tranh ngành: ở đây tách theo phân khúc / theo năm / theo tỷ lệ, kèm mốc chính sách.
   Số: Bộ Xây dựng (window.RE_MARKET_HISTORY.moc_quarterly), HNX & WiData (window.REALESTATE_PUBLIC.blocks),
   nhà ở xã hội: số Bộ Xây dựng do báo trích (đoạn gốc lưu ở data/realestate/evidence.json, block bds-p2). */
(() => {
'use strict';
const $ = s => document.querySelector(s);
if (!document.body?.dataset || !/Bat-dong-san\/(index\.html)?$/.test(location.pathname)) return;
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const C = {navy: '#2938A8', teal: '#59C5C8', plum: '#861C52', gold: '#c29100', grey: '#9AA3BD', green: '#27af95', red: '#d1583f'};

// Vạch mốc chính sách: {at: chỉ số nhãn trục x, text}
const marks = {id: 'rePolicyMarks', afterDatasetsDraw(ch, _a, o) {
  const xs = ch.scales.x, ya = ch.chartArea, ctx = ch.ctx; if (!o?.list?.length) return;
  ctx.save(); ctx.font = '600 11px Inter, sans-serif'; ctx.fillStyle = '#861C52'; ctx.strokeStyle = 'rgba(134,28,82,.55)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
  o.list.forEach((m, i) => { const x = xs.getPixelForValue(m.at); if (!fin(x)) return; ctx.beginPath(); ctx.moveTo(x, ya.top); ctx.lineTo(x, ya.bottom); ctx.stroke();
    const w = ctx.measureText(m.text).width, left = x + 4 + w > ya.right; ctx.fillText(m.text, left ? x - 4 - w : x + 4, ya.top + 12 + (i % 2) * 14); });
  ctx.restore(); }};

function card(id, title, sub, src, h = 300) {
  const c = el('div', 'card re-pol-card'); c.dataset.blockId = id; c.dataset.updateKind = 'public'; c.dataset.refreshStatus = 'loaded';
  c.innerHTML = `<div class="chart-title">${title}</div><div class="chart-sub">${sub}</div><div style="position:relative;height:${h}px;margin-top:8px"><canvas role="img" aria-label="${title}"></canvas></div><div class="pw-src">Nguồn: ${src}</div>`;
  return c;
}
function draw(c, cfg) {
  const opt = cfg.options ||= {};
  opt.responsive = true; opt.maintainAspectRatio = false; opt.animation = false; opt.interaction = {mode: 'index', intersect: false};
  opt.plugins = Object.assign({legend: {position: 'bottom', labels: {usePointStyle: true, boxWidth: 8, color: '#3B4256', font: {size: 12}}}}, opt.plugins || {});
  cfg.plugins = [marks];
  new Chart(c.querySelector('canvas'), cfg);
}
const axis = (cb, extra = {}) => Object.assign({grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', font: {size: 11.5}, callback: cb}}, extra);
const xAxis = {grid: {display: false}, ticks: {color: '#6B7392', font: {size: 11.5}, maxRotation: 0, autoSkip: true, maxTicksLimit: 12}};

/* ---------- 02 Đất đai: giao dịch đất nền và căn hộ/nhà ở theo quý, mốc luật ---------- */
function landChart() {
  const Q = window.RE_MARKET_HISTORY?.moc_quarterly; if (!Q?.length) return null;
  const L = Q.map(r => r.quarter), at = q => L.indexOf(q);
  const c = card('bds-p1', 'Giao dịch đất nền và căn hộ, nhà ở — trước và sau các mốc luật',
    'giao dịch thành công · theo quý · vạch đỏ là mốc hiệu lực chính sách',
    '<a href="https://moc.gov.vn/vn/tin-tuc/1206/96449/thi-truong-bat-dong-san-quy-ii2026-nguon-cung-khoi-sac-tap-trung-thao-go-the-che-va-thuc-day-nha-o-xa-hoi.aspx" target="_blank" rel="noopener">Bộ Xây dựng, bản tin thị trường hằng quý</a> (qua báo trích; số làm tròn ghi ở Bức tranh ngành)', 320);
  draw(c, {type: 'bar', data: {labels: L, datasets: [
      {label: 'Đất nền', data: Q.map(r => r.transactions_land), backgroundColor: C.navy, borderRadius: 3, stack: 's'},
      {label: 'Căn hộ, nhà riêng lẻ', data: Q.map(r => r.transactions_apt_house), backgroundColor: C.teal, borderRadius: 3, stack: 's'}]},
    options: {scales: {x: xAxis, y: axis(v => nf(v), {stacked: true, beginAtZero: true})},
      plugins: {tooltip: {callbacks: {label: x => ` ${x.dataset.label}: ${nf(x.parsed.y)} giao dịch`}},
        rePolicyMarks: {list: [{at: at('Q3/2024'), text: 'Luật Đất đai, Nhà ở, KD BĐS 01/08/2024'}, {at: at('Q3/2025'), text: 'Sáp nhập tỉnh 01/07/2025'}, {at: at('Q1/2026'), text: 'Bảng giá đất mới 01/01/2026'}].filter(m => m.at >= 0)}}}});
  return c;
}

/* ---------- 03 Nhà ở xã hội: kế hoạch và hoàn thành ---------- */
// Bộ Xây dựng qua báo: 2025 (VOH 21/12/2025), 2026 (Hà Nội mới/CafeF 05/11/2026). Đoạn gốc: data/realestate/evidence.json (bds-p2).
const NOXH = [
  {y: '2025', plan: 100275, done: 102633, est: null},
  {y: '2026', plan: 97271, done: 46962, est: 87601},
];
function noxhChart() {
  const c = card('bds-p2', 'Nhà ở xã hội: kế hoạch giao và số căn hoàn thành',
    'căn · 2026: đã hoàn thành đến đầu 11/2026 và dự kiến cả năm (90% kế hoạch) · Nghị quyết 244/2025/QH15 đặt mục tiêu trên 110.000 căn',
    '<a href="https://voh.com.vn/xa-hoi/nha-o-xa-hoi-vuot-chi-tieu-chung-12-tinh-thanh-van-chua-co-du-an-641637.html" target="_blank" rel="noopener">VOH 21/12/2025</a>, <a href="https://cafef.vn/phan-dau-hoan-thanh-87601-can-nha-o-xa-hoi-trong-nam-2026-188261105102750855.chn" target="_blank" rel="noopener">CafeF 05/11/2026</a> (trích Bộ Xây dựng)');
  draw(c, {type: 'bar', data: {labels: NOXH.map(r => r.y), datasets: [
      {label: 'Kế hoạch giao', data: NOXH.map(r => r.plan), backgroundColor: C.grey, borderRadius: 4},
      {label: 'Đã hoàn thành', data: NOXH.map(r => r.done), backgroundColor: C.navy, borderRadius: 4},
      {label: 'Dự kiến cả năm', data: NOXH.map(r => r.est), backgroundColor: C.teal, borderRadius: 4}]},
    options: {scales: {x: xAxis, y: axis(v => nf(v), {beginAtZero: true})}, plugins: {tooltip: {callbacks: {label: x => ` ${x.dataset.label}: ${nf(x.parsed.y)} căn`}}}}});
  return c;
}

/* ---------- 03 Trái phiếu BĐS: phát hành theo năm, mốc nghị định ---------- */
function bondIssueChart() {
  const R = window.REALESTATE_PUBLIC?.blocks?.cbond_issuance?.records; if (!R?.length) return null;
  const by = {}; R.forEach(r => { const y = r.date.slice(0, 4); by[y] = (by[y] || 0) + (r.value || 0); });
  const Y = Object.keys(by).sort().filter(y => y >= '2021'), last = R.at(-1).date.slice(0, 7);
  const c = card('bds-p3', 'Phát hành trái phiếu BĐS theo năm và các nghị định',
    `nghìn tỷ đồng · tổ chức phát hành ngành BĐS trên HNX · năm ${Y.at(-1)} tính đến ${last.slice(5)}/${last.slice(0, 4)}`,
    '<a href="https://cbonds.hnx.vn/" target="_blank" rel="noopener">HNX · Chuyên trang trái phiếu doanh nghiệp</a>');
  const at = y => Y.indexOf(y);
  draw(c, {type: 'bar', data: {labels: Y.map(y => y === Y.at(-1) ? y + ' (đến nay)' : y), datasets: [{label: 'Giá trị phát hành', data: Y.map(y => by[y] / 1000), backgroundColor: Y.map(y => y === Y.at(-1) ? C.teal : C.navy), borderRadius: 4}]},
    options: {scales: {x: xAxis, y: axis(v => nf(v), {beginAtZero: true})}, plugins: {legend: {display: false}, tooltip: {callbacks: {label: x => ` ${nf(x.parsed.y, 1)} nghìn tỷ đồng`}},
      rePolicyMarks: {list: [{at: at('2022'), text: 'NĐ 65/2022 siết phát hành (16/09/2022)'}, {at: at('2023'), text: 'NĐ 08/2023 cho gia hạn (05/03/2023)'}].filter(m => m.at >= 0)}}}});
  return c;
}

/* ---------- 03 Trái phiếu BĐS: tỷ lệ trả nợ đúng hạn theo tháng ---------- */
function ontimeChart() {
  const R = (window.REALESTATE_PUBLIC?.blocks?.cbond_cashflow?.records || []).filter(r => fin(r.ontime_ratio) && r.date >= '2021-01'); if (R.length < 6) return null;  // trước 2021 ít trái phiếu đến hạn, tỷ lệ nhảy mạnh
  const L = R.map(r => r.date.slice(5, 7) + '/' + r.date.slice(0, 4)), at = m => R.findIndex(r => r.date.startsWith(m));
  const c = card('bds-p4', 'Trái phiếu BĐS trả nợ đúng hạn trong tháng',
    '% số trái phiếu đến hạn được trả đúng hạn · theo tháng · tháng hiện tại có thể chưa đủ số',
    '<a href="https://widata.vn/" target="_blank" rel="noopener">WiData</a> (tổng hợp từ HNX)');
  draw(c, {type: 'line', data: {labels: L, datasets: [{label: 'Tỷ lệ trả đúng hạn', data: R.map(r => r.ontime_ratio * 100), borderColor: C.navy, backgroundColor: C.navy + '22', fill: 'origin', borderWidth: 2, pointRadius: 0, tension: .25}]},
    options: {scales: {x: xAxis, y: axis(v => nf(v) + '%', {min: 0, max: 100})}, plugins: {legend: {display: false}, tooltip: {callbacks: {label: x => ` ${nf(x.parsed.y, 1)}%`}},
      rePolicyMarks: {list: [{at: at('2023-03'), text: 'NĐ 08/2023'}, {at: at('2024-12'), text: 'Hết hạn gia hạn NĐ 08 (31/12/2024)'}].filter(m => m.at >= 0)}}}});
  return c;
}

function grid(...cards) { const g = el('div', 're-pol-grid of-wide'); cards.filter(Boolean).forEach(c => g.append(c)); if (g.children.length === 1) g.firstChild.style.gridColumn = '1 / -1'; return g; }
function run() {
  if (!window.Chart || !$('#of-mt4-land')) return;
  const land = $('#of-mt4-land .of-body'), home = $('#of-mt4-housing .of-body');
  if (land && !$('[data-block-id="bds-p1"]')) { const c = landChart(); if (c) { c.classList.add('of-wide'); land.append(c); } }
  if (home && !$('[data-block-id="bds-p2"]')) { home.prepend(grid(noxhChart(), bondIssueChart())); const o = ontimeChart(); if (o) { o.classList.add('of-wide'); home.querySelector('.re-pol-grid').after(o); } }
  const st = el('style'); st.textContent = '.re-pol-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.re-pol-card.of-wide,.re-pol-grid+.re-pol-card{margin-top:0}@media(max-width:900px){.re-pol-grid{grid-template-columns:1fr}}'; document.head.append(st);
}
// re-frame.js dựng sub-tab sau khi trang tải ~1,7 giây rồi phát 're:frame'.
window.addEventListener('re:frame', run);
if ($('#of-mt4-land')) run();
})();
