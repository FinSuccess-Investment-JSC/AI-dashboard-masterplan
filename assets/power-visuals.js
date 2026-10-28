/* Điện · hình hóa dữ liệu (28/10/2026): cơ cấu nguồn hôm nay, đồng hồ ONI, bản đồ hồ theo vùng,
   heatmap tăng trưởng sản lượng, data bar định giá trong bảng doanh nghiệp, lọc bảng từ sơ đồ chuỗi.
   Chỉ đọc số đã có trên trang (SECTOR_DAILY, HYDRO_RESERVOIRS, COMPANY_VALUATION); không đổi chữ có sẵn. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'power') return;
const src = window.SECTOR_DAILY?.sources || {}, daily = src.vn_power_daily?.records || [];
const nf = (v, d = 1) => v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
const dm = d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
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
  if (!card || !H?.monthly?.length) return;
  const by = {};
  H.monthly.forEach(r => (by[r.reservoir] ||= []).push(r));
  const rows = Object.entries(by).map(([name, rs]) => {
    rs.sort((a, b) => a.month < b.month ? -1 : 1);
    const cur = rs.filter(r => r.inflow_n >= 7 && isFinite(r.inflow)).at(-1); if (!cur) return null;
    const ly = rs.find(r => r.month === (+cur.month.slice(0, 4) - 1) + cur.month.slice(4));
    const yoy = ly && ly.inflow > 0 ? (cur.inflow / ly.inflow - 1) * 100 : null;
    const dl = ly && isFinite(ly.level) && isFinite(cur.level) ? cur.level - ly.level : null;
    return {name, region: cur.region, month: cur.month, yoy, dl, n: cur.inflow_n};
  }).filter(Boolean);
  const month = rows.map(r => r.month).sort().at(-1);
  // Ô vùng xếp theo hình chữ S từ Bắc vào Nam.
  const REG = [['Tây Bắc Bộ', 0, 0], ['Đông Bắc Bộ', 1, 0], ['Bắc Trung Bộ', 0.5, 1], ['Tây Nguyên', 0, 2], ['Nam Trung Bộ', 1, 2], ['Đông Nam Bộ', 0.5, 3]];
  const color = v => v == null ? '#C9CFDD' : v <= -40 ? '#b8443a' : v <= -15 ? '#dd7f4e' : v < 15 ? '#B9C1D0' : v < 40 ? '#59C5C8' : '#2938A8';
  const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
  const W = 175, Hh = 112, svg = REG.map(([reg, cx, cy]) => {
    const rs = rows.filter(r => r.region === reg && r.month === month); if (!rs.length) return '';
    const x = 10 + cx * (W + 14), y = 10 + cy * (Hh + 12), m = med(rs.map(r => r.yoy));
    const dots = rs.map((r, i) => `<circle class="pv-res" data-name="${r.name}" cx="${x + 18 + (i % 8) * 20}" cy="${y + 66 + Math.floor(i / 8) * 20}" r="7.5" fill="${color(r.yoy)}"><title>${r.name}: nước về ${r.yoy == null ? '—' : (r.yoy > 0 ? '+' : '') + nf(r.yoy, 0) + '%'} so cùng kỳ${r.dl == null ? '' : ' · mực nước ' + (r.dl > 0 ? '+' : '') + nf(r.dl, 1) + ' m'}</title></circle>`).join('');
    return `<g><rect x="${x}" y="${y}" width="${W}" height="${Hh}" rx="14" class="pv-reg" stroke="${color(m)}"/><text x="${x + 14}" y="${y + 24}" class="pv-reg-name">${reg}</text><text x="${x + W - 14}" y="${y + 24}" text-anchor="end" class="pv-reg-val" fill="${color(m)}">${m == null ? '—' : (m > 0 ? '+' : '') + nf(m, 0) + '%'}</text><text x="${x + 14}" y="${y + 42}" class="pv-reg-sub">${rs.length} hồ · trung vị</text>${dots}</g>`;
  }).join('');
  const box = el('div', 'pv-hydro');
  box.innerHTML = `<svg viewBox="0 0 ${2 * W + 34} ${4 * (Hh + 12) + 8}" role="img" aria-label="Nước về các hồ thủy điện tháng ${month.slice(5)}/${month.slice(0, 4)} so cùng kỳ, theo vùng" data-fs-flow="1">${svg}</svg>
    <div class="pv-hydro-side"><div class="chart-title">Nước về hồ tháng ${+month.slice(5)}/${month.slice(0, 4)} so cùng kỳ</div>
    <div class="chart-sub">Lưu lượng nước về bình quân của các ngày có số liệu, so cùng tháng năm trước · mỗi chấm là một hồ, bấm để mở chart của hồ đó</div>
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

function run() { topRow(); hydroMap(); heatmap(); table(); }
if (document.readyState === 'complete') setTimeout(run, 300); else addEventListener('load', () => setTimeout(run, 300));
})();
