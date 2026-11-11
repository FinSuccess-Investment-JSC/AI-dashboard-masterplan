/* Điện · hình hóa dữ liệu (28/10/2026): cơ cấu nguồn hôm nay, đồng hồ ONI, bản đồ hồ theo vùng,
   heatmap tăng trưởng sản lượng, data bar định giá trong bảng doanh nghiệp, lọc bảng từ sơ đồ chuỗi.
   Chỉ đọc số đã có trên trang (SECTOR_DAILY, HYDRO_RESERVOIRS, COMPANY_VALUATION); không đổi chữ có sẵn. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'power') return;
const src = window.SECTOR_DAILY?.sources || {}, daily = src.vn_power_daily?.records || [];
const nf = (v, d = 1) => v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
const dm = d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
// "1–9/11/2026" khi tháng chưa hết, "tháng 11/2026" khi đủ từ ngày 1 đến cuối tháng (cùng hàm ở power-hub.js).
const hydroSpan = rs => { const a = rs.map(r => r.from).sort()[0], b = rs.map(r => r.to).sort().at(-1); if (!a) return ''; const y = +b.slice(0, 4), m = +b.slice(5, 7); return +a.slice(8) === 1 && +b.slice(8) === new Date(y, m, 0).getDate() ? `tháng ${m}/${y}` : `${+a.slice(8)}–${+b.slice(8)}/${m}/${y}`; };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const link = (url, text) => `<a href="${url}" target="_blank" rel="noopener">${text}</a>`;
// Một màu cho mỗi nguồn, trùng với sơ đồ chuỗi giá trị.
const MIX = [
  ['coal', 'Than', '#3d4653', r => r.coal],
  ['gas', 'Khí • dầu', '#c98a00', r => (r.gas || 0) + (r.oil || 0)],
  ['hydro', 'Thủy điện', '#2938A8', r => r.hydro],
  ['re', 'Gió • mặt trời', '#2a9fa3', r => (r.wind || 0) + (r.solar_farm || 0) + (r.rooftop_solar || 0) + (r.solar || 0)],
  ['imp', 'Nhập khẩu • khác', '#9AA3BD', r => (r.imports || 0) + (r.other || 0)]
];
const shares = r => { const v = MIX.map(m => m[3](r) || 0), t = v.reduce((a, b) => a + b, 0); return t ? v.map(x => x / t * 100) : null; };

/* ---- 3 + 6. Cơ cấu nguồn hôm nay · đồng hồ El Niño (tab Tổng quan, ngay dưới KPI) ---- */
function topRow() {
  const kpis = document.querySelector('.kpis'); if (!kpis || !daily.length) return;
  const row = el('section', 'grid two pv-top');
  const last = daily.at(-1), s = shares(last), prev = daily.slice(-8, -1).map(shares).filter(Boolean);
  const avg = MIX.map((_, i) => prev.reduce((a, p) => a + p[i], 0) / prev.length);
  const mix = el('div', 'card pv-mix');
  mix.dataset.blockId = 'dien-mix-today'; mix.dataset.updateKind = 'public'; mix.dataset.cadence = 'daily';
  mix.innerHTML = `<div class="chart-title">Cơ cấu nguồn ngày ${dm(last.date)}</div>
    <div class="chart-sub">% sản lượng · so bình quân 7 ngày trước đó (điểm %)</div>
    <div class="pv-bar">${MIX.map((m, i) => `<span style="width:${s[i]}%;background:${m[2]}" title="${m[1]}: ${nf(s[i])}%"></span>`).join('')}</div>
    <div class="pv-mix-legend">${MIX.map((m, i) => { const d = s[i] - avg[i]; return `<div><i style="background:${m[2]}"></i><span>${m[1]}</span><b>${nf(s[i])}%</b><em class="${Math.abs(d) < .05 ? '' : d > 0 ? 'up' : 'dn'}">${d > 0 ? '▲ +' : d < 0 ? '▼ −' : ''}${nf(Math.abs(d))}</em></div>`; }).join('')}</div>
    <div class="source-note">Nguồn: ${link(src.vn_power_daily.source_url, 'EVN · bản tin vận hành ngày')} · ${nf(last.output_mkwh)} triệu kWh</div>`;
  row.append(mix);
  const oni = (src.enso_oni?.records || []).filter(r => isFinite(r.oni)), o = oni.at(-1);
  if (o) {
    const pos = v => Math.max(0, Math.min(100, (v + 3) / 6 * 100)), p = oni.at(-4);
    const cls = o.oni >= 1.5 ? 'El Niño mạnh' : o.oni >= .5 ? 'El Niño' : o.oni <= -1.5 ? 'La Niña mạnh' : o.oni <= -.5 ? 'La Niña' : 'Trung tính';
    const g = el('div', 'card pv-oni');
    g.dataset.blockId = 'dien-oni-gauge'; g.dataset.updateKind = 'periodic'; g.dataset.cadence = 'monthly';
    g.innerHTML = `<div class="chart-title">El Niño đang ở đâu</div>
      <div class="chart-sub">ONI ${o.season} ${o.year} · °C chênh so trung bình</div>
      <div class="pv-oni-val"><b>${o.oni > 0 ? '+' : ''}${nf(o.oni, 2)}</b><span>${cls}</span>${p ? `<em>3 mùa trước: ${p.oni > 0 ? '+' : ''}${nf(p.oni, 2)}</em>` : ''}</div>
      <div class="pv-gauge"><div class="pv-scale"></div>${p ? `<i class="pv-ghost" style="left:${pos(p.oni)}%"></i>` : ''}<i class="pv-needle" style="left:${pos(o.oni)}%"></i></div>
      <div class="pv-ticks">${[[-3, 'La Niña mạnh'], [-1.5, '−1,5'], [-.5, '−0,5'], [.5, '+0,5'], [1.5, '+1,5'], [3, 'El Niño mạnh']].map(([v, t]) => `<span style="left:${pos(v)}%">${t}</span>`).join('')}</div>
      <p class="pv-take">${o.oni >= .5 ? 'Nước về hồ mùa khô tới nghiêng về thiếu: thủy điện yếu, than và khí được huy động nhiều hơn.' : o.oni <= -.5 ? 'Mưa nhiều hơn bình thường: thủy điện thuận lợi, nhiệt điện bị huy động ít đi.' : 'Thủy văn chưa nghiêng rõ về phía nào.'}</p>
      <div class="source-note">Nguồn: ${link('https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt', 'NOAA CPC · ONI')}</div>`;
    row.append(g);
  }
  kpis.after(row);
}

/* ---- 4. Bản đồ hồ thủy điện theo vùng ---- */
function hydroMap() {
  const card = document.querySelector('[data-block-id="dien-hydro-reservoirs"]'), H = window.HYDRO_RESERVOIRS;
  if (!card || !H?.yoy?.rows?.length) return;
  // So cùng kỳ tính sẵn trong scripts/update_hydro_reservoirs.py: đúng các ngày đó năm trước, năm trước đủ ≥80% số ngày.
  const rows = H.yoy.rows.map(r => ({name: r.reservoir, region: r.region, month: r.month, from: r.from, to: r.to, yoy: r.yoy, dl: r.dl}));
  const month = H.yoy.month, span = hydroSpan(rows.filter(r => r.month === month));
  // Ô vùng xếp theo hình chữ S từ Bắc vào Nam.
  const REG = [['Tây Bắc Bộ', 0, 0], ['Đông Bắc Bộ', 1, 0], ['Bắc Trung Bộ', 0.5, 1], ['Tây Nguyên', 0, 2], ['Nam Trung Bộ', 1, 2], ['Đông Nam Bộ', 0.5, 3]];
  const color = v => v == null ? '#C9CFDD' : v <= -40 ? '#b8443a' : v <= -15 ? '#dd7f4e' : v < 15 ? '#B9C1D0' : v < 40 ? '#59C5C8' : '#2938A8';
  const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y), k = s.length >> 1; return s.length ? (s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2) : null; };
  const W = 175, Hh = 112, svg = REG.map(([reg, cx, cy]) => {
    const rs = rows.filter(r => r.region === reg && r.month === month); if (!rs.length) return '';
    const x = 10 + cx * (W + 14), y = 10 + cy * (Hh + 12), m = med(rs.map(r => r.yoy));
    const dots = rs.map((r, i) => `<circle class="pv-res" data-name="${r.name}" cx="${x + 18 + (i % 8) * 20}" cy="${y + 66 + Math.floor(i / 8) * 20}" r="7.5" fill="${color(r.yoy)}"><title>${r.name}: nước về ${r.yoy == null ? '—' : (r.yoy > 0 ? '+' : '') + nf(r.yoy, 0) + '%'} so cùng kỳ${r.dl == null ? '' : ' · mực nước ' + (r.dl > 0 ? '+' : '') + nf(r.dl, 1) + ' m'}</title></circle>`).join('');
    return `<g><rect x="${x}" y="${y}" width="${W}" height="${Hh}" rx="14" class="pv-reg" stroke="${color(m)}"/><text x="${x + 14}" y="${y + 24}" class="pv-reg-name">${reg}</text><text x="${x + W - 14}" y="${y + 24}" text-anchor="end" class="pv-reg-val" fill="${color(m)}">${m == null ? '—' : (m > 0 ? '+' : '') + nf(m, 0) + '%'}</text><text x="${x + 14}" y="${y + 42}" class="pv-reg-sub">${rs.length} hồ · trung vị</text>${dots}</g>`;
  }).join('');
  const box = el('div', 'pv-hydro');
  box.innerHTML = `<svg viewBox="0 0 ${2 * W + 34} ${4 * (Hh + 12) + 8}" role="img" aria-label="Nước về các hồ thủy điện ${span} so cùng kỳ, theo vùng" data-fs-flow="1">${svg}</svg>
    <div class="pv-hydro-side"><div class="chart-title">Nước về hồ ${span} so cùng kỳ</div>
    <div class="chart-sub">Lưu lượng nước về bình quân, so đúng các ngày đó năm trước (năm trước cần đủ ≥80% số ngày, thiếu thì chấm xám) · mỗi chấm là một hồ, bấm để mở chart của hồ đó</div>
    <div class="pv-scale-legend">${[['≤ −40%', -50], ['−40 → −15%', -20], ['±15%', 0], ['+15 → +40%', 20], ['≥ +40%', 50]].map(([t, v]) => `<span><i style="background:${color(v)}"></i>${t}</span>`).join('')}</div>
    <div class="pv-rank"></div></div>`;
  const rank = rows.filter(r => r.month === month && r.yoy != null).sort((a, b) => a.yoy - b.yoy);
  box.querySelector('.pv-rank').innerHTML = `<b>Thiếu nước nhất</b>${rank.slice(0, 3).map(r => `<span>${r.name} <em class="dn">${nf(r.yoy, 0)}%</em></span>`).join('')}<b>Dồi dào nhất</b>${rank.slice(-3).reverse().map(r => `<span>${r.name} <em class="${r.yoy >= 0 ? 'up' : 'dn'}">${r.yoy > 0 ? '+' : ''}${nf(r.yoy, 0)}%</em></span>`).join('')}`;
  card.querySelector('.chart-sub').after(box);
  box.querySelectorAll('.pv-res').forEach(c => c.addEventListener('click', () => {
    const sel = document.getElementById('hydro-reservoir'), o = sel && [...sel.options].find(o => o.textContent.trim() === c.dataset.name || o.value === c.dataset.name);
    if (o) { sel.value = o.value; sel.dispatchEvent(new Event('change', {bubbles: true})); document.getElementById('hydro-reservoir-chart')?.scrollIntoView({behavior: 'smooth', block: 'center'}); }
  }));
}

/* ---- 5. Heatmap tăng trưởng sản lượng theo tháng ---- */
function heatmap() {
  const anchor = document.querySelector('[data-block-id="dien-08"]')?.closest('.grid'); if (!anchor || daily.length < 400) return;
  const mon = {};
  daily.forEach(r => { if (!isFinite(r.output_mkwh)) return; const k = r.date.slice(0, 7); (mon[k] ||= {s: 0, n: 0}); mon[k].s += r.output_mkwh; mon[k].n++; });
  const dim = k => new Date(+k.slice(0, 4), +k.slice(5), 0).getDate();
  // So bình quân ngày để tháng thiếu bản tin vẫn so được; tháng có dưới 60% số ngày thì bỏ.
  const avg = k => mon[k] && mon[k].n >= .6 * dim(k) ? mon[k].s / mon[k].n : null;
  const keys = Object.keys(mon).sort(), ys = [...new Set(keys.map(k => k.slice(0, 4)))].slice(-3);
  const cell = v => v == null ? '#EEF0F6' : v >= 15 ? '#1D2678' : v >= 10 ? '#2938A8' : v >= 5 ? '#6171C5' : v >= 0 ? '#B3BDE8' : v >= -5 ? '#f3c3ad' : '#dd7f4e';
  let best = null;
  const grid = ys.map(y => `<div class="pv-hm-row"><span class="pv-hm-y">${y}</span>${Array.from({length: 12}, (_, i) => {
    const k = `${y}-${String(i + 1).padStart(2, '0')}`, a = avg(k), b = avg(`${+y - 1}-${String(i + 1).padStart(2, '0')}`), v = a && b ? (a / b - 1) * 100 : null, part = mon[k] && mon[k].n < dim(k);
    if (v != null && (!best || v > best.v)) best = {k, v};
    return `<span class="pv-hm-c" style="background:${cell(v)};color:${v != null && v >= 5 ? '#fff' : '#303540'}" title="${i + 1}/${y}: ${v == null ? 'chưa đủ dữ liệu' : (v > 0 ? '+' : '') + nf(v) + '% so cùng kỳ'}${part ? ' · tháng chưa đủ ngày' : ''}">${v == null ? '' : (v > 0 ? '+' : '') + nf(v, 0)}${part && v != null ? '*' : ''}</span>`;
  }).join('')}</div>`).join('');
  const c = el('div', 'card pv-hm');
  c.dataset.blockId = 'dien-output-heatmap'; c.dataset.updateKind = 'public'; c.dataset.cadence = 'daily'; c.style.marginTop = '14px';
  c.innerHTML = `<div class="chart-title">Sản lượng điện tăng bao nhiêu so cùng kỳ, từng tháng</div>
    <div class="chart-sub">% · bình quân ngày so cùng tháng năm trước · * tháng chưa đủ ngày${best ? ` · cao nhất ${+best.k.slice(5)}/${best.k.slice(0, 4)}: <b>+${nf(best.v)}%</b>` : ''}</div>
    <div class="pv-hm-grid"><div class="pv-hm-row pv-hm-head"><span class="pv-hm-y"></span>${Array.from({length: 12}, (_, i) => `<span>T${i + 1}</span>`).join('')}</div>${grid}</div>
    <div class="source-note">Nguồn: ${link(src.vn_power_daily.source_url, 'EVN · bản tin vận hành ngày')}, cộng theo tháng như chart sản lượng tháng bên trên.</div>`;
  anchor.after(c);
}

/* ---- 7. Bảng doanh nghiệp: chip mã theo nhóm, cột P/E và vốn hóa (data bar do site-navigation.js vẽ) ---- */
const GROUP = {coalplant: ['PPC', 'QTP', 'HND', 'BTP', 'POW', 'NT2'], hydro: ['REE', 'VSH', 'CHP', 'SBA', 'TMP', 'SHP'], re: ['GEG', 'HDG', 'TTA'], build: ['PC1', 'TV2', 'GEX']};
const GCOLOR = {coalplant: '#3d4653', hydro: '#2938A8', re: '#2a9fa3', build: '#b8801f'};
function table() {
  const card = document.querySelector('[data-block-id="dien-03"]'), tb = card?.querySelector('table'); if (!tb) return;
  const V = window.COMPANY_VALUATION?.companies || {}, rows = [...tb.tBodies[0].rows];
  tb.tHead.rows[0].insertAdjacentHTML('beforeend', '<th class="num">Vốn hóa (tỷ đ)</th><th class="num">P/E</th>');
  let group = null;
  rows.forEach(r => {
    if (r.cells.length === 1) { r.cells[0].colSpan = 6; return; }
    const code = r.cells[0].textContent.trim().split(/\s/)[0], v = V[code];
    group = Object.keys(GROUP).find(g => GROUP[g].includes(code)) || group;
    r.dataset.code = code; r.dataset.group = group || '';
    const b = r.cells[0].querySelector('b'); if (b) { b.classList.add('pv-chip'); b.style.setProperty('--c', GCOLOR[group] || '#2938A8'); }
    r.insertAdjacentHTML('beforeend', v ? `<td class="num">${nf(v.market_cap, 0)}</td><td class="num">${v.pe > 0 ? nf(v.pe, 1) + 'x' : '—'}</td>` : '<td class="num">—</td><td class="num">—</td>');
  });
  const any = Object.values(V).find(v => v.date);
  const note = el('div', 'source-note', `Vốn hóa, P/E: ${link('https://dstock.vndirect.com.vn/', 'VNDirect dstock')}, phiên ${any ? dm(any.date) : '—'}.`);
  card.querySelector('.tablewrap').after(note);
  // 10. Bấm một khâu trên sơ đồ chuỗi → lọc bảng về các mã của khâu đó.
  const pill = el('div', 'pv-filter'); pill.hidden = true; card.querySelector('.tablewrap').before(pill);
  document.addEventListener('vc:select', e => {
    const {id, label, codes} = e.detail || {};
    const set = id ? new Set(codes) : null;
    rows.forEach(r => { if (r.cells.length === 1) { const next = rows.slice(rows.indexOf(r) + 1); const end = next.findIndex(x => x.cells.length === 1); r.hidden = !!set && !next.slice(0, end < 0 ? undefined : end).some(x => set.has(x.dataset.code)); } else r.hidden = !!set && !set.has(r.dataset.code); });
    pill.hidden = !id;
    pill.innerHTML = id ? `Đang lọc theo sơ đồ: <b>${label}</b> · ${rows.filter(r => r.dataset.code && !r.hidden).length} mã <button type="button">Bỏ lọc ✕</button>` : '';
    pill.querySelector('button')?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('vc:select', {detail: {}})));
  });
}

/* ---- Doanh nghiệp kiếm tiền thế nào: công thức lợi nhuận + yếu tố tác động, chữ gốc vào "Chi tiết" ---- */
const ICON = {
  coal: '<path d="M3 21V11l5 3v-3l5 3V5h3v16zM3 21h18M18 21V9h3v12"/>',
  hydro: '<path d="M4 4h16v8H4zM3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  re: '<circle cx="12" cy="9" r="1.4"/><path d="M12 10.4V22M12 9L6 5M12 9l6-2M12 9l1 7"/>',
  build: '<path d="M12 2L7 22M12 2l5 20M6 7h12M8 13h8M7.5 17l9-4M16.5 17l-9-4"/>'
};
// Công thức và chiều tác động lấy từ chính đoạn chữ của từng nhóm (research-layout.js), không thêm nhận định mới.
const MODEL = {
  'Nhiệt điện than & khí': {g: 'coalplant', ic: 'coal', share: r => r.coal + (r.gas || 0) + (r.oil || 0), shareLabel: 'than + khí',
    f: [['Sản lượng huy động', '×'], ['Giá PPA + thị trường', '−'], ['Nhiên liệu than/khí', '−'], ['Khấu hao, lãi vay', '']],
    d: [['Mức huy động ↑', 1], ['Giá thị trường ↑', 1], ['Nhiên liệu ↑ (chưa chuyển ngang)', -1], ['Nhà máy cũ: khấu hao ↓', 1]]},
  'Thủy điện': {g: 'hydro', ic: 'hydro', share: r => r.hydro, shareLabel: 'thủy điện',
    f: [['Nước về → sản lượng', '×'], ['Giá thị trường', '−'], ['Chi phí biến đổi ≈ 0', '']],
    d: [['Năm nước nhiều', 1], ['El Niño: nước về ↓', -1], ['El Niño: giá thị trường ↑', 1]]},
  'Năng lượng tái tạo': {g: 're', ic: 're', share: r => (r.wind || 0) + (r.solar_farm || 0) + (r.rooftop_solar || 0) + (r.solar || 0), shareLabel: 'gió + mặt trời',
    f: [['Bức xạ, gió', '×'], ['Giá FIT / chuyển tiếp', '−'], ['Cắt giảm công suất', '']],
    d: [['Cắt giảm công suất', -1], ['Đàm phán lại giá FIT', -1], ['Thanh toán chậm', -1], ['DPPA, QHĐ VIII mở dự án', 1]]},
  'Xây lắp, tư vấn & thiết bị lưới': {g: 'build', ic: 'build',
    f: [['Vốn EVN/NPT', '→'], ['Backlog hợp đồng', '→'], ['Doanh thu theo tiến độ', '']],
    d: [['Đầu tư lưới theo QHĐ VIII', 1], ['Giải ngân EVN/NPT nhanh', 1], ['Giải ngân chậm', -1]]}
};
function businessCards() {
  const sec = document.querySelector('.business-models'); if (!sec) return;
  const last = daily.at(-1), tot = last && MIX.reduce((a, m) => a + (m[3](last) || 0), 0), V = window.COMPANY_VALUATION?.companies || {};
  sec.querySelectorAll('article.business-model').forEach(art => {
    const title = art.querySelector('h3')?.textContent.trim(), m = MODEL[title]; if (!m) return;
    const codes = GROUP[m.g];  // chữ mã đã bị đổi thành chip dính liền, nên lấy theo nhóm
    const c = GCOLOR[m.g], sh = m.share && tot ? m.share(last) / tot * 100 : null;
    const cap = codes.reduce((a, k) => a + (V[k]?.market_cap || 0), 0);
    const old = [...art.childNodes].filter(n => !(n.classList?.contains('business-ticker') || n.tagName === 'H3'));
    const det = el('details', 'pv-bm-more', '<summary>Chi tiết</summary>'); old.forEach(n => det.append(n));
    art.classList.add('pv-bm'); art.style.setProperty('--c', c);
    art.querySelector('.business-ticker')?.remove(); art.querySelector('h3')?.remove();
    art.insertAdjacentHTML('afterbegin', `<header><span class="pv-bm-ic"><svg viewBox="0 0 24 24">${ICON[m.ic]}</svg></span><div><h3>${title}</h3><div class="pv-bm-codes">${codes.map(k => `<span class="pv-chip" style="--c:${c}">${k}</span>`).join('')}</div></div>
      <div class="pv-bm-stat">${sh != null ? `<b>${nf(sh)}%</b><span>sản lượng ${dm(last.date).slice(0, 5)}</span>` : `<b>${nf(cap / 1000, 1)}</b><span>nghìn tỷ vốn hóa</span>`}</div></header>
      <div class="pv-bm-label">Lợi nhuận đến từ</div>
      <div class="pv-bm-formula">${m.f.map(([t, op]) => `<span class="pv-bm-term">${t}</span>${op ? `<i>${op}</i>` : ''}`).join('')}</div>
      <div class="pv-bm-label">Yếu tố tác động tới lãi</div>
      <div class="pv-bm-drivers">${m.d.map(([t, s]) => `<span class="${s > 0 ? 'pos' : 'neg'}">${s > 0 ? '▲' : '▼'} ${t}</span>`).join('')}</div>`);
    art.append(det);
  });
}

/* ---- 18 doanh nghiệp: dạng thẻ (mặc định) / bảng ---- */
function companyCards() {
  const card = document.querySelector('[data-block-id="dien-03"]'), tb = card?.querySelector('table'); if (!tb || card.querySelector('.pv-cards')) return;
  const V = window.COMPANY_VALUATION?.companies || {}, wrap = el('div', 'pv-cards');
  let grid = null, gname = '';
  [...tb.tBodies[0].rows].forEach(r => {
    if (r.cells.length === 1) { gname = r.textContent.trim(); wrap.insertAdjacentHTML('beforeend', `<div class="pv-cg-head">${gname}</div>`); grid = el('div', 'pv-cg'); wrap.append(grid); return; }
    const code = r.dataset.code, g = r.dataset.group, c = GCOLOR[g] || '#2938A8', v = V[code];
    const ex = (r.cells[0].textContent.split('·')[1] || '').trim();
    const drivers = r.cells[2].textContent.split(/;\s*/).map(t => t.trim()).filter(Boolean);
    const ev = r.cells[3].innerHTML, key = !!r.cells[3].querySelector('mark');
    const k = el('article', 'pv-co'); k.dataset.code = code; k.style.setProperty('--c', c);
    k.innerHTML = `<header><span class="pv-chip" style="--c:${c}">${code}</span><em>${ex}</em>${v ? `<div class="pv-co-val"><b>${nf(v.market_cap / 1000, 1)}</b><span>nghìn tỷ</span><i>${v.pe > 0 ? 'P/E ' + nf(v.pe, 1) + 'x' : 'P/E —'}</i></div>` : ''}</header>
      <p class="pv-co-asset">${r.cells[1].innerHTML}</p>
      <div class="pv-co-tags">${drivers.map(t => `<span>${t}</span>`).join('')}</div>
      <div class="pv-co-ev${key ? ' key' : ''}"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg><span>${ev}</span></div>`;
    grid.append(k);
  });
  const tw = card.querySelector('.tablewrap'), host = tw.closest('details') || tw;
  const sw = el('div', 'pv-view', '<button type="button" aria-pressed="true">Thẻ</button><button type="button" aria-pressed="false">Bảng</button>');
  host.before(sw); host.before(wrap); host.hidden = true;
  sw.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { sw.querySelectorAll('button').forEach((x, j) => x.setAttribute('aria-pressed', String(i === j))); wrap.hidden = i === 1; host.hidden = i === 0; if (host.tagName === 'DETAILS') host.open = true; }));
  document.addEventListener('vc:select', e => {
    const set = e.detail?.id ? new Set(e.detail.codes) : null;
    wrap.querySelectorAll('.pv-co').forEach(k => k.hidden = !!set && !set.has(k.dataset.code));
    wrap.querySelectorAll('.pv-cg').forEach(g => { const hide = ![...g.children].some(k => !k.hidden); g.hidden = hide; g.previousElementSibling.hidden = hide; });
  });
}


/* ---- 7. Spread FMP − chi phí nhiên liệu biến đổi (tab Giá – Chi phí – Margin, card dien-30) ----
   FMP tháng: fmpRows của trang (PGV IR). Than: World Bank coal_au × tỷ giá trung tâm tháng (Wi 242638 qua PHARMA_WI).
   Suất tiêu hao & mốc nội địa theo QĐ 1692/QĐ-BCT (than) và QĐ 1882/QĐ-BCT (khí) năm 2026 — xem ⓘ của card. */
const P = {HR_COAL: 2411.6, HHV_NC: 6000, HHV_DOM: 5012.61, COAL_DOM: 1962004, HR_GAS: 6542.96, GAS_USD: 11.98, FEE_USD: 1.87, FX_QD: 26378};
function spread() {
  const host = document.getElementById('chSpread'); if (!host) return;
  const fmp = typeof fmpRows !== 'undefined' ? fmpRows : null; if (!fmp?.length) return;
  const wb = src.wb_energy_monthly?.records || [], fx = window.PHARMA_WI?.blocks?.macro?.series?.usdvnd?.records || [];
  const wbM = new Map(wb.map(r => [r.date.slice(0, 7), r])), fxM = new Map(fx.map(r => [r.date.slice(0, 7), r.value]));
  const domCoal = P.COAL_DOM / 1000 * P.HR_COAL / P.HHV_DOM, domGas = (P.GAS_USD + P.FEE_USD) * P.HR_GAS / 1e6 * P.FX_QD;
  const rows = fmp.map(r => {
    const w = wbM.get(r.period), f = fxM.get(r.period);
    const coalImp = w && f && isFinite(w.coal_au) ? w.coal_au * f / 1000 * P.HR_COAL / P.HHV_NC : null;
    const lng = w && f && isFinite(w.lng_japan) ? (w.lng_japan + P.FEE_USD) * P.HR_GAS / 1e6 * f : null;
    const y26 = r.year >= 2026;
    return {...r, fx: f ?? null, coalImp, lng, sCoal: coalImp == null ? null : r.fmp - coalImp, sLng: lng == null ? null : r.fmp - lng,
            sDomCoal: y26 ? r.fmp - domCoal : null, sDomGas: y26 ? r.fmp - domGas : null};
  });
  if (!rows.some(r => r.sCoal != null)) { host.innerHTML = '<div class="data-gap">Thiếu tỷ giá tháng hoặc giá than World Bank cùng kỳ; chưa tính được spread.</div>'; return; }
  const model = {categories: rows.map(r => r.period), tickLabels: rows.map(r => r.period.slice(5) + '/' + r.period.slice(2, 4)), unit: 'đ/kWh', digits: 0, zeroBase: true, height: 280,
    series: [{name: 'FMP − than nhập (ước)', color: '#3d4653', kind: 'line', values: rows.map(r => r.sCoal)},
             {name: 'FMP − LNG nhập (ước)', color: '#c98a00', kind: 'line', values: rows.map(r => r.sLng)},
             {name: 'FMP − than nội, mốc QĐ 1692 (2026)', color: '#2938A8', kind: 'line', values: rows.map(r => r.sDomCoal)},
             {name: 'FMP − khí nội, mốc QĐ 1882 (2026)', color: '#861C52', kind: 'line', values: rows.map(r => r.sDomGas)}],
    aria: 'Spread FMP trừ chi phí nhiên liệu biến đổi ước tính theo tháng từ 2023'};
  if (window.ChartTypes) ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, 'line'); });
  const last = [...rows].reverse().find(r => r.sCoal != null), prev = last && rows.find(r => r.period === (last.year - 1) + last.period.slice(4));
  const card = host.closest('.card');
  if (last && card && !card.querySelector('.pv-key')) card.querySelector('.chart-sub')?.after(el('div', 'pv-key',
    `<b class="${last.sCoal >= 0 ? 'up' : 'dn'}">${nf(last.sCoal, 0)} đ/kWh</b> FMP − than nhập tháng ${+last.period.slice(5)}/${last.period.slice(0, 4)}${prev?.sCoal != null ? ` <span>cùng kỳ ${nf(prev.sCoal, 0)}</span>` : ''}${last.sDomCoal != null ? ` <span>· so than nội ${nf(last.sDomCoal, 0)} · so khí nội ${nf(last.sDomGas, 0)}</span>` : ''}`));
  const tb = document.getElementById('tbl-spread');
  if (tb) tb.innerHTML = '<thead><tr><th>Tháng</th><th>FMP</th><th>Tỷ giá</th><th>Than nhập (đ/kWh)</th><th>LNG nhập</th><th>FMP − than nhập</th><th>FMP − LNG</th><th>FMP − than nội</th><th>FMP − khí nội</th></tr></thead><tbody>' +
    rows.map(r => `<tr><td>${r.period}</td><td>${nf(r.fmp, 0)}</td><td>${nf(r.fx, 0)}</td><td>${nf(r.coalImp, 0)}</td><td>${nf(r.lng, 0)}</td><td>${nf(r.sCoal, 0)}</td><td>${nf(r.sLng, 0)}</td><td>${nf(r.sDomCoal, 0)}</td><td>${nf(r.sDomGas, 0)}</td></tr>`).join('') + '</tbody>';
  if (card && !card.querySelector('.chart-insight')) {
    const n = el('div', 'chart-insight'); n.dataset.inputOwner = 'ai';
    n.innerHTML = `<b>Cách hiểu trong bối cảnh ngành:</b> spread dương nghĩa là một kWh bán trên thị trường điện (phần ngoài Qc) vẫn bù được nhiên liệu; than nội (TKV, mốc ≈ ${nf(domCoal, 0)} đ/kWh) rẻ hơn hẳn than nhập nên nhà máy dùng than nội (QTP, HND, PPC) có đệm rộng hơn; khí nội mốc ≈ ${nf(domGas, 0)} đ/kWh và LNG cao hơn FMP phần lớn thời gian → nhiệt điện khí sống bằng Qc và giá hợp đồng, không bằng thị trường. Kiểm chứng bằng biên gộp quý của từng mã ở Tổng quan › So sánh tài chính.`;
    card.querySelector('.source-note')?.before(n);
  }
}

/* ---- 8. Key players: bảng so sánh gọn theo nhóm (card dien-33) ---- */
const GROUPS = [['Nhiệt điện than & khí', ['POW', 'NT2', 'PPC', 'QTP', 'HND', 'BTP'], '#3d4653'], ['Thủy điện', ['REE', 'VSH', 'CHP', 'SBA', 'TMP', 'SHP'], '#2938A8'],
  ['Năng lượng tái tạo', ['GEG', 'HDG', 'TTA'], '#2a9fa3'], ['Xây lắp & thiết bị lưới', ['PC1', 'TV2', 'GEX'], '#b8801f']];
function keyPlayers() {
  const host = document.getElementById('kp-groups'); if (!host) return;
  const val = window.COMPANY_VALUATION?.companies || {}, comp = window.COMPANY_COMPARISON?.companies || [], CQ = window.COMPANY_QUARTERLY || {}, qs = CQ.quarters || [];
  const cq = Object.fromEntries((CQ.companies || []).filter(c => c.sector === 'power').map(c => [c.symbol, c]));
  const cmp = Object.fromEntries(comp.filter(c => c.sector === 'power').map(c => [c.symbol, c]));
  const lastIdx = a => { for (let i = (a || []).length - 1; i >= 0; i--) if (a[i] != null && isFinite(a[i])) return i; return -1; };
  const med = a => { const v = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y); return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : null; };
  const row = t => {
    const v = val[t] || {}, q = cq[t], i = q ? lastIdx(q.revenue) : -1, rev = i >= 0 ? q.revenue[i] : null, gp = i >= 0 ? q.gross_profit?.[i] : null;
    const prevRev = i >= 4 ? q.revenue[i - 4] : null;
    return {t, mcap: v.market_cap ?? null, pe: v.pe > 0 ? v.pe : null, pb: v.pb ?? null, gm: rev && gp != null ? gp / rev * 100 : null, yoy: rev && prevRev ? (rev / prevRev - 1) * 100 : null,
            roe: cmp[t]?.quarter?.values?.roe ?? null, q: i >= 0 ? qs[i] : null, date: v.date};
  };
  const pct = (v, d = 1) => v == null ? '—' : (v > 0 ? '+' : '') + nf(v, d) + '%';
  const groups = GROUPS.map(([name, codes, c]) => { const rs = codes.map(row); return {name, c, rs, mcap: rs.reduce((a, r) => a + (r.mcap || 0), 0), pe: med(rs.map(r => r.pe)), pb: med(rs.map(r => r.pb)), gm: med(rs.map(r => r.gm)), yoy: med(rs.map(r => r.yoy)), roe: med(rs.map(r => r.roe)), q: rs.map(r => r.q).filter(Boolean).sort().at(-1)}; });
  if (!groups.some(g => g.mcap)) { host.innerHTML = '<div class="data-gap">Chưa nạp được định giá hằng ngày.</div>'; return; }
  const d = groups.flatMap(g => g.rs.map(r => r.date)).filter(Boolean).sort().at(-1);
  host.innerHTML = '<div class="tablewrap"><table><thead><tr><th>Nhóm</th><th>Mã</th><th>Vốn hóa (tỷ)</th><th>P/E</th><th>P/B</th><th>Biên gộp</th><th>Doanh thu YoY</th><th>ROE quý</th></tr></thead><tbody>' +
    groups.map(g => `<tr><td><b class="pv-chip" style="--c:${g.c}">${g.name}</b></td><td>${g.rs.length}</td><td><b>${nf(g.mcap, 0)}</b></td><td>${nf(g.pe, 1)}</td><td>${nf(g.pb, 2)}</td><td>${nf(g.gm, 1)}%</td><td>${pct(g.yoy)}</td><td>${nf(g.roe, 1)}%</td></tr>`).join('') +
    '</tbody></table></div>' + groups.map(g => `<details class="dtable"><summary>${g.name} · từng mã (quý gần nhất ${g.q || '—'})</summary><div class="tablewrap"><table><thead><tr><th>Mã</th><th>Vốn hóa (tỷ)</th><th>P/E</th><th>P/B</th><th>Biên gộp</th><th>Doanh thu YoY</th><th>ROE quý</th><th>Quý</th></tr></thead><tbody>` +
      g.rs.sort((a, b) => (b.mcap || 0) - (a.mcap || 0)).map(r => `<tr><td><b>${r.t}</b></td><td>${nf(r.mcap, 0)}</td><td>${nf(r.pe, 1)}</td><td>${nf(r.pb, 2)}</td><td>${r.gm == null ? '—' : nf(r.gm, 1) + '%'}</td><td>${pct(r.yoy)}</td><td>${r.roe == null ? '—' : nf(r.roe, 1) + '%'}</td><td>${r.q || '—'}</td></tr>`).join('') + '</tbody></table></div></details>').join('') +
    `<div class="source-note">Định giá phiên ${d ? dm(d) : '—'}; vốn hóa nhóm là tổng các mã, chỉ số khác là trung vị.</div>`;
}

function run() { topRow(); hydroMap(); heatmap(); table(); businessCards(); spread(); keyPlayers(); setTimeout(companyCards, 200); }
if (document.readyState === 'complete') setTimeout(run, 300); else addEventListener('load', () => setTimeout(run, 300));
})();
