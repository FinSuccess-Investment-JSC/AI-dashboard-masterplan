/* Gói ngành tách từ Bán lẻ (26/11/2026): Sữa, Bia, Ô tô – Xe máy; Nhựa (26/11/2026) thêm annual, donut, prices; Chăn nuôi (26/11/2026) thêm hog, hogmargin, đọc P.dataVar (AGRI_PUBLIC);
   Hàng không (26/11/2026) thêm cum, mseries, heat, fuelfx, sens, progress, fin, brief, đọc AVIATION_DATA + AVIATION_FIN. Bộ dựng chart đọc cấu hình window.PKG (app/<ngành>-config.js).
   Dữ liệu: window.RETAIL_PUBLIC (scripts/build_sector_public.py: NSO, Hải quan, NHNN, IMF/FRED, FAO, ICE, VNDirect P/E rổ),
   window.COMPANY_QUARTERLY (BCTC hợp nhất quý). Số tài liệu ghi trong cấu hình, có dòng trong data/<ngành>/evidence.json.
   Trang chạy pipeline chung của gói (data-sector="retail") nên company-* được lọc về rổ của ngành ở app/pkg-shim.js.
   Dùng các hàm vẽ inline của trang (barLineChart, hbarCompare, sparkline, fillTable). */
(() => {
'use strict';
const P = window.PKG; if (!P || document.body.dataset.pkg !== P.key) return;
const W = window[P.dataVar || 'RETAIL_PUBLIC'] || {blocks: {}}, B = W.blocks || {};
const make = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls || ''; if (text) e.textContent = text; return e; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 1) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const short = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—';
const mon = d => 'T' + Number(d.slice(5, 7)) + '/' + d.slice(2, 4);
const signed = (v, d = 1) => v == null || !Number.isFinite(v) ? '—' : (v > 0 ? '+' : '') + nf(v, d);
const C = {navy: '#2938A8', teal: '#59C5C8', plum: '#861C52', gold: '#c29100', grey: '#6b7686', green: '#27af95', red: '#d1583f', light: '#9aa3c7'};
const macro = B.macro?.series || {}, com = B.commodity?.series || {}, sec = B.sector_ratio?.by_sector || {};
const S = k => macro[k]?.records || com[k]?.records || [];
const meta = k => macro[k] || com[k] || {};
const ym = d => d.slice(0, 7);
const byMonth = rs => { const m = {}; rs.forEach(r => { m[ym(r.date)] = r; }); return m; };
const yoyAt = (rs, r) => { if (!r) return null; const p = rs.find(x => x.date.slice(0, 7) === String(Number(r.date.slice(0, 4)) - 1) + r.date.slice(4, 7)); return p && p.value ? (r.value / p.value - 1) * 100 : null; };
const ytdSum = (rs, y, m) => rs.filter(r => r.date.slice(0, 4) === y && r.date.slice(5, 7) <= m).reduce((a, r) => a + r.value, 0);
const ytdYo = rs => { const l = rs.at(-1); if (!l) return null; const y = l.date.slice(0, 4), m = l.date.slice(5, 7), p = ytdSum(rs, String(y - 1), m); return p ? (ytdSum(rs, y, m) / p - 1) * 100 : null; };
const idx = (rs, base) => { const b = rs.find(r => r.date.slice(0, 7) >= base); return b && b.value ? rs.map(r => ({date: r.date, value: r.value / b.value * 100})) : []; };
const SRC = {nso: ['Cục Thống kê (NSO)', 'https://www.nso.gov.vn/'], customs: ['Hải quan Việt Nam', 'https://www.customs.gov.vn/'], sbv: ['Ngân hàng Nhà nước', 'https://www.sbv.gov.vn/'],
  fred: ['IMF qua FRED', 'https://fred.stlouisfed.org/'], fao: ['FAO FPMA', 'https://fpma.fao.org/'], ice: ['ICE đường thô No.11 (Yahoo Finance)', 'https://finance.yahoo.com/quote/SB%3DF/'],
  vnd: ['VNDirect finfo', 'https://dstock.vndirect.com.vn/'], cq: ['BCTC hợp nhất quý (Stock Analysis · data/company-quarterly.js)', 'https://stockanalysis.com/'], wi: ['WiData', 'https://widata.vn/']};
for (const v of Object.values(macro)) { if (/nso\.gov\.vn\/wp-content/.test(v.url || '')) SRC.nso = [SRC.nso[0], v.url]; if (/customs/.test(v.url || '')) SRC.customs = [SRC.customs[0], v.url]; }
const src = s => typeof s === 'string' ? SRC[s] : s;

function sourceLine(id, parts, period, method) {
  const host = document.getElementById(id); if (!host) return; const card = host.closest('.card');
  const n = make('div', 'source-note cadence-note'); n.append('Nguồn: ');
  parts.map(src).filter(Boolean).forEach(([name, url], i) => { if (i) n.append(' · '); if (url) { const a = make('a', '', name); a.href = url; a.target = '_blank'; a.rel = 'noopener'; n.append(a); } else n.append(name); });
  if (period) n.append(' · Kỳ cuối: ' + period);
  host.after(n); if (method) n.after(make('div', 'source-note method-note', method));
  if (card) card.dataset.refreshStatus = 'loaded';
}
// Khối vẽ bằng HTML không nằm trong bộ chọn chart của chart-source.js → tự ghi dòng "Nguồn:" hiện sẵn.
function pwSrc(id, parts) { const card = document.getElementById(id)?.closest('.card'); if (!card || card.querySelector(':scope>.pw-src')) return; const n = make('div', 'pw-src'); n.append('Nguồn: '); parts.map(src).filter(Boolean).forEach(([name, url], i) => { if (i) n.append('; '); const a = make('a', '', name); a.href = url || '#'; a.target = '_blank'; a.rel = 'noopener'; n.append(a); }); card.append(n); }
function insight(id, text) { const card = document.getElementById(id)?.closest('.card'); if (!card || !text) return; const n = make('div', 'chart-insight'); n.dataset.inputOwner = 'ai'; n.innerHTML = '<b>Cách hiểu trong bối cảnh ngành · AI:</b> '; n.append(text); card.append(n); }
function legend(id, items) { const host = document.getElementById(id); if (!host) return; const l = make('div', 'legend'); items.forEach(([n, c]) => { const s = make('span', 'li'), d = make('span', 'dot'); d.style.background = c; s.append(d, n); l.append(s); }); host.after(l); }
const finish = (c, period) => { sourceLine(c.id, c.src || [], period, c.method); insight(c.id, c.insight); };

/* ---------- Loại chart ---------- */
const T = {};
// Chuỗi tháng: series [[tên, khóa, màu, 'bar'|'line', 'raw'|'yoy', chia]]
T.series = c => {
  const base = S(c.base).filter(r => !c.yoyOnly || Number.isFinite(yoyAt(S(c.base), r))).slice(-(c.months || 36)); if (!base.length) return;
  const maps = c.series.map(([, k]) => [S(k), byMonth(S(k))]);
  const val = (j, r) => { const [rs, m] = maps[j], x = m[ym(r.date)], [, , , , tf = 'raw', div = 1] = c.series[j]; if (!x) return null; return tf === 'yoy' ? yoyAt(rs, x) : x.value / div; };
  barLineChart(c.id, {categories: base.map(r => mon(r.date)), series: c.series.map(([n, , col, kind], j) => ({name: n, color: col, kind: kind === 'line' ? 'line' : undefined, values: base.map(r => val(j, r))})), unit: c.unit || '', digits: c.digits ?? 1, height: 260, rotateLabels: true, zeroBase: c.zeroBase ?? true});
  legend(c.id, c.series.map(([n, , col]) => [n, col]));
  const cols = c.series.flatMap(([n, k, , , tf = 'raw', div = 1]) => tf === 'yoy' ? [n] : [n + (c.tableUnit ? ' (' + c.tableUnit + ')' : ''), 'so cùng kỳ']);
  fillTable(c.table, ['Tháng', ...cols], S(c.base).slice().reverse().map(r => [mon(r.date), ...c.series.flatMap(([, k, , , tf = 'raw', div = 1], j) => { const [rs, m] = maps[j], x = m[ym(r.date)]; return tf === 'yoy' ? [x ? signed(x.value, 1) + '%' : '—'] : [x ? nf(x.value / div, c.digits ?? 1) : '—', x ? signed(yoyAt(rs, x), 1) + '%' : '—']; })]));
  finish(c, mon(base.at(-1).date));
};
// Chỉ số giá đầu vào, kỳ gốc c.base (T1/2024 = 100); bảng giá gốc.
T.index = c => {
  const ix = c.series.map(([, k]) => byMonth(idx(S(k), c.baseMonth || '2024-01'))); const ref = S(c.series[0][1]).filter(r => r.date.slice(0, 7) >= (c.baseMonth || '2024-01')); if (!ref.length) return;
  barLineChart(c.id, {categories: ref.map(r => mon(r.date)), series: c.series.map(([n, , col], j) => ({name: n, color: col, kind: 'line', values: ref.map(r => ix[j][ym(r.date)]?.value ?? null)})), unit: '', digits: 0, height: 260, rotateLabels: true, zeroBase: false});
  legend(c.id, c.series.map(([n, , col]) => [n, col]));
  const raw = c.series.map(([, k]) => byMonth(S(k)));
  fillTable(c.table, ['Tháng', ...c.series.map(([n, k]) => n + ' (' + (meta(k).unit || '') + ')')], S(c.series[0][1]).slice().reverse().map(r => [mon(r.date), ...raw.map(m => nf(m[ym(r.date)]?.value, 1))]));
  finish(c, mon(ref.at(-1).date));
};
// P/E rổ VNDirect theo phiên (mỗi 5 phiên).
T.val = c => {
  const ids = c.ids.filter(([id]) => sec[id]?.records?.length); if (!ids.length) return;
  const dates = [...new Set(ids.flatMap(([id]) => sec[id].records.map(r => r[0])))].sort(), weekly = dates.filter((d, i) => i % 5 === 0 || i === dates.length - 1);
  const at = (id, d, k) => { const r = sec[id].records.find(x => x[0] === d); return r ? r[k] : null; };
  barLineChart(c.id, {categories: weekly.map(d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(2, 4)), series: ids.map(([id, name, color]) => ({name: 'P/E ' + name, color, kind: 'line', values: weekly.map(d => { const v = at(id, d, 1); return v > 0 && v < 80 ? v : null; })})), unit: 'x', digits: 1, height: 260, zeroBase: false, rotateLabels: true});
  legend(c.id, ids.map(([, n, col]) => [n, col]));
  fillTable(c.table, ['Rổ mã', 'P/B', 'P/E', 'Vốn hóa (nghìn tỷ)', 'Phiên'], ids.map(([id, name]) => { const r = sec[id].records.at(-1); return [name, nf(r[2], 2), nf(r[1], 1), nf(r[3] / 1000, 1), short(r[0])]; }));
  finish(c, short(dates.at(-1)));
};
const CQ = () => window.COMPANY_QUARTERLY;
const cqRow = s => CQ()?.companies?.find(c => c.symbol === s);
// Biên theo quý từng mã (gross_margin | net_margin).
T.margin = c => {
  const D = CQ(); if (!D?.quarters?.length) return; const n = D.quarters.length, from = Math.max(0, n - (c.quarters || 12)), qs = D.quarters.slice(from);
  const cos = c.syms.filter(([s]) => cqRow(s)); if (!cos.length) return;
  const draw = f => barLineChart(c.id, {categories: qs, series: cos.map(([s, col]) => ({name: s, color: col, kind: 'line', values: cqRow(s)[f].slice(from)})), unit: '%', digits: 1, height: 260, rotateLabels: true, zeroBase: false});
  toggles(c.id, [['gross_margin', 'Biên gộp'], ['net_margin', 'Biên ròng']], draw);
  legend(c.id, cos.map(([s, col]) => [s, col]));
  fillTable(c.table, ['Quý', ...cos.map(([s]) => s + ' biên gộp (%)'), ...cos.map(([s]) => s + ' biên ròng (%)')], qs.map((q, i) => [q, ...cos.map(([s]) => nf(cqRow(s).gross_margin[from + i], 1)), ...cos.map(([s]) => nf(cqRow(s).net_margin[from + i], 1))]).reverse());
  finish(c, qs.at(-1));
};
// Doanh thu / lợi nhuận theo quý từng mã (cột cạnh nhau, không cộng khi các mã có thể có quan hệ sở hữu).
T.revenue = c => {
  const D = CQ(); if (!D?.quarters?.length) return; const n = D.quarters.length, from = Math.max(0, n - (c.quarters || 12)), qs = D.quarters.slice(from);
  const cos = c.syms.filter(([s]) => cqRow(s)); if (!cos.length) return;
  const draw = f => barLineChart(c.id, {categories: qs, series: cos.map(([s, col]) => ({name: s, color: col, values: cqRow(s)[f].slice(from).map(v => v == null ? null : v / 1000)})), unit: 'nghìn tỷ', digits: 2, height: 260, rotateLabels: true, stackable: !!c.stackable});
  toggles(c.id, [['revenue', 'Doanh thu thuần'], ['net_income', 'Lợi nhuận sau thuế']], draw);
  legend(c.id, cos.map(([s, col]) => [s, col]));
  fillTable(c.table, ['Quý', ...cos.map(([s]) => s + ' DT (tỷ)'), ...cos.map(([s]) => s + ' LNST (tỷ)')], qs.map((q, i) => [q, ...cos.map(([s]) => nf(cqRow(s).revenue[from + i], 0)), ...cos.map(([s]) => nf(cqRow(s).net_income[from + i], 0))]).reverse());
  finish(c, qs.at(-1));
};
// Giá đầu vào trễ N quý so với trục quý của biên gộp (giả định phân tích).
T.lag = c => {
  const D = CQ(); if (!D?.quarters?.length) return;
  const qk = d => 'Q' + Math.ceil(Number(d.slice(5, 7)) / 3) + '/' + d.slice(0, 4);
  const prevQ = (k, nq) => { let q = Number(k[1]), y = Number(k.slice(3)); q -= nq; while (q < 1) { q += 4; y -= 1; } return 'Q' + q + '/' + y; };
  const qavg = rs => { const a = {}; rs.forEach(r => { const k = qk(r.date); (a[k] = a[k] || []).push(r.value); }); return Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v.reduce((x, y) => x + y, 0) / v.length])); };
  const items = c.series.map(([name, k, col]) => [name, col, qavg(idx(S(k), '2024-01'))]);
  const n = D.quarters.length, qs = D.quarters.slice(Math.max(0, n - 12)), lag = c.lag || 2;
  barLineChart(c.id, {categories: qs, series: items.map(([name, col, a]) => ({name, color: col, kind: 'line', values: qs.map(q => { const v = a[prevQ(q, lag)]; return v == null ? null : Math.round(v); })})), unit: '', digits: 0, height: 260, rotateLabels: true, zeroBase: false});
  legend(c.id, items.map(([n, col]) => [n, col]));
  fillTable(c.table, ['Quý (biên gộp)', 'Quý nguyên liệu', ...items.map(x => x[0])], qs.map(q => [q, prevQ(q, lag), ...items.map(([, , a]) => nf(a[prevQ(q, lag)], 0))]).reverse());
  finish(c, qs.at(-1));
};
T.hbar = c => { hbarCompare(c.id, {items: c.items.map(([label, value, color]) => ({label, value, color: color || C.navy})), unit: c.unit, digits: c.digits ?? 0, labelW: c.labelW || 190, ariaLabel: c.aria || ''}); if (c.legend) legend(c.id, c.legend); finish(c, c.period); };
T.bars = c => { barLineChart(c.id, {categories: c.categories, series: c.series.map(([name, values, color, kind]) => ({name, values, color, kind})), unit: c.unit || '', digits: c.digits ?? 0, height: 250, rotateLabels: false}); legend(c.id, c.series.map(([n, , col]) => [n, col])); finish(c, c.period); };
T.tiles = c => { const h = document.getElementById(c.id); if (!h) return; h.classList.add('rf-tiles'); h.innerHTML = c.items.map(([k, v, s]) => `<div class="rf-tile"><small>${esc(k)}</small><b>${esc(v)}</b><span>${esc(s)}</span></div>`).join(''); pwSrc(c.id, c.src || []); if (c.method) h.after(make('div', 'source-note method-note', c.method)); insight(c.id, c.insight); };
T.timeline = c => {
  const h = document.getElementById(c.id); if (!h) return; const today = new Date().toISOString().slice(0, 10), dd = d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
  h.innerHTML = '<ol class="rf-tl">' + c.items.slice().sort((a, b) => a.d < b.d ? -1 : 1).map(p => `<li class="${/^(Dự thảo|Dự kiến)/.test(p.st) ? 'draft' : ''} ${p.d < today ? 'past' : 'next'}"><time datetime="${p.d}">${esc(p.label || dd(p.d))}</time><div class="rf-ev"><div class="rf-ev-h"><b>${esc(p.name)}</b><span class="rf-st${/^(Dự thảo|Dự kiến)/.test(p.st) ? ' draft' : ''}">${/^(Dự thảo|Dự kiến)/.test(p.st) ? '○ ' : '● '}${esc(p.st)}</span></div><p>${esc(p.what)}</p><dl><dt>${esc(c.whoLabel || 'Doanh nghiệp')}</dt><dd>${esc(p.who)}</dd><dt>${esc(c.vLabel || 'Biến cần theo dõi')}</dt><dd>${esc(p.v)}</dd></dl><a href="${p.url}" target="_blank" rel="noopener">Nguồn ↗</a></div></li>`).join('') + '</ol>';
  pwSrc(c.id, [['Văn bản và bài nguồn ở từng thẻ', '#']]); if (c.method) h.after(make('div', 'source-note', c.method));
};
T.steps = c => {
  const h = document.getElementById(c.id); if (!h) return; h.className = 'rf-chain';
  h.innerHTML = c.steps.map(([k, t, d], i) => `${i ? '<span class="rf-chain-ar" aria-hidden="true">→</span>' : ''}<div class="rf-chain-s"><small>${esc(k)}</small><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('');
  if (c.note) h.after(make('div', 'source-note', c.note)); pwSrc(c.id, c.src || []);
};
// Sơ đồ dựng riêng trong cấu hình ngành: c.render(host) trả HTML; dòng nguồn hiện sẵn.
T.html = c => { const h = document.getElementById(c.id); if (!h) return; h.innerHTML = c.render(esc); pwSrc(c.id, c.src || []); if (c.method) h.after(make('div', 'source-note', c.method)); };
T.models = c => {
  const h = document.getElementById(c.id); if (!h) return; h.className = 'rf-models';
  h.innerHTML = c.items.map(([t, syms, rev, drv, links], i) => `<article class="rf-model"><header><span>${i + 1}</span><h4>${esc(t)}</h4></header><p class="rf-syms">${esc(syms)}</p><dl><dt>Doanh thu đến từ</dt><dd>${esc(rev)}</dd><dt>Biến quyết định biên</dt><dd>${esc(drv)}</dd></dl><nav>${(links || []).map(([hr, l]) => `<a href="${hr}">${esc(l)} →</a>`).join('')}</nav></article>`).join('');
  pwSrc(c.id, c.src || []);
};
/* ---------- Thêm cho Nhựa (26/11/2026): chuỗi năm tĩnh có bảng, cơ cấu dạng vòng, giá Brent – khí – hạt nhựa (FRED) ---------- */
// Chuỗi năm/kỳ tĩnh: c.categories, c.series [[tên, giá trị[], màu, 'line'?]]; bảng tự dựng từ cùng số.
T.annual = c => {
  barLineChart(c.id, {categories: c.categories, series: c.series.map(([name, values, color, kind]) => ({name, values, color, kind, confArr: c.conf})), unit: c.unit || '', digits: c.digits ?? 0, height: c.height || 260, rotateLabels: false, stackable: !!c.stackable, zeroBase: c.zeroBase ?? true});
  legend(c.id, c.series.map(([n, , col]) => [n, col]));
  if (c.table) fillTable(c.table, [c.catLabel || 'Kỳ', ...c.series.map(([n]) => n + (c.unit ? ' (' + c.unit + ')' : ''))], c.categories.map((k, i) => [k, ...c.series.map(([, v]) => nf(v[i], c.digits ?? 0))]).reverse());
  finish(c, c.period);
};
// Cơ cấu %: vòng tròn SVG + chú giải; c.items [[tên, %, màu]].
T.donut = c => {
  const h = document.getElementById(c.id); if (!h) return;
  const tot = c.items.reduce((a, x) => a + x[1], 0), R = 70, r = 44, cx = 90, cy = 90; let a0 = -Math.PI / 2;
  const arc = (a1, a2) => { const p = (rr, a) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)], lg = a2 - a1 > Math.PI ? 1 : 0, [x1, y1] = p(R, a1), [x2, y2] = p(R, a2), [x3, y3] = p(r, a2), [x4, y4] = p(r, a1);
    return `M${x1.toFixed(1)},${y1.toFixed(1)}A${R},${R} 0 ${lg} 1 ${x2.toFixed(1)},${y2.toFixed(1)}L${x3.toFixed(1)},${y3.toFixed(1)}A${r},${r} 0 ${lg} 0 ${x4.toFixed(1)},${y4.toFixed(1)}Z`; };
  const segs = c.items.map(([n, v, col]) => { const a1 = a0, a2 = a0 + v / tot * Math.PI * 2 - 1e-4; a0 = a1 + v / tot * Math.PI * 2; return `<path d="${arc(a1, a2)}" fill="${col}"><title>${esc(n)}: ${nf(v, c.digits ?? 1)}%</title></path>`; }).join('');
  h.className = 'nh-donut';
  h.innerHTML = `<svg viewBox="0 0 180 180" role="img" aria-label="${esc(c.items.map(([n, v]) => n + ' ' + nf(v, c.digits ?? 1) + '%').join(', '))}">${segs}${c.center ? `<text x="90" y="86" text-anchor="middle" class="nh-dc-k">${esc(c.center[0])}</text><text x="90" y="104" text-anchor="middle" class="nh-dc-v">${esc(c.center[1])}</text>` : ''}</svg>`
    + `<ul class="nh-leg">${c.items.map(([n, v, col]) => `<li><i style="background:${col}"></i><span>${esc(n)}</span><b>${nf(v, c.digits ?? 1)}%</b></li>`).join('')}</ul>`;
  if (c.table) fillTable(c.table, ['Hạng mục', 'Tỷ trọng (%)'], c.items.map(([n, v]) => [n, nf(v, c.digits ?? 1)]));
  pwSrc(c.id, c.src || []); if (c.method) h.after(make('div', 'source-note method-note', c.method));
};
// Giá hạt nhựa (PPI Mỹ), dầu Brent, khí Henry Hub: % thay đổi so với tháng gốc; bảng giá gốc.
const PP = () => window.PLASTIC_PRICES?.series || {};
T.prices = c => {
  const S2 = PP(), keys = c.keys.filter(([k]) => S2[k]?.records?.length); if (!keys.length) return;
  const base = c.baseMonth || '2007-01', maps = keys.map(([k]) => Object.fromEntries(S2[k].records)), months = [...new Set(keys.flatMap(([k]) => S2[k].records.map(r => r[0])))].filter(m => m >= base).sort();
  const pct = (m, j) => { const b = maps[j][base], v = maps[j][m]; return b && v != null ? Math.round((v / b - 1) * 1000) / 10 : null; };
  barLineChart(c.id, {categories: months.map(m => 'T' + Number(m.slice(5)) + '/' + m.slice(2, 4)), series: keys.map(([k, n, col], j) => ({name: n, color: col, kind: 'line', values: months.map(m => pct(m, j))})), unit: '%', digits: 1, height: 280, rotateLabels: true, zeroBase: false});
  legend(c.id, keys.map(([, n, col]) => [n, col]));
  fillTable(c.table, ['Tháng', ...keys.map(([k, n]) => n + ' (' + S2[k].unit + ')')], months.slice().reverse().map(m => [m.slice(5) + '/' + m.slice(0, 4), ...keys.map((_, j) => nf(maps[j][m], 1))]));
  const last = months.filter(m => keys.every((_, j) => maps[j][m] != null)).at(-1) || months.at(-1);
  finish(c, 'T' + Number(last.slice(5)) + '/' + last.slice(0, 4));
};
/* ---------- Thêm cho Chăn nuôi (26/11/2026, tách khỏi Nông nghiệp & thực phẩm): giá heo hơi theo vùng, biên chăn nuôi heo ước ---------- */
// Heo hơi toàn quốc (Wi 74124) + 3 vùng (Wi 74368–74370), 36 tháng; điểm cuối là ngày gọi gần nhất.
T.hog = c => {
  const hog = S('hog'); if (!hog.length) return; const HR = c.regions.filter(([k]) => S(k).length);
  const rm = Object.fromEntries(HR.map(([k]) => [k, byMonth(S(k))])), hm = byMonth(hog);
  const months = [...new Set([...hog, ...HR.flatMap(([k]) => S(k))].map(r => ym(r.date)))].sort().slice(-36);
  barLineChart(c.id, {categories: months.map(m => mon(m + '-01')), series: [{name: 'Toàn quốc', color: C.red, kind: 'line', values: months.map(m => hm[m]?.value ?? null)}, ...HR.map(([k, n, col]) => ({name: n, color: col, kind: 'line', values: months.map(m => rm[k][m]?.value ?? null)}))], unit: 'nghìn đ/kg', digits: 1, height: 260, zeroBase: false, rotateLabels: true});
  legend(c.id, [['Toàn quốc', C.red], ...HR.map(([, n, col]) => [n, col])]);
  fillTable(c.table, ['Kỳ', 'Toàn quốc', 'So cùng kỳ', ...HR.map(h => h[1])], months.slice().reverse().map(m => [mon(m + '-01'), nf(hm[m]?.value, 1), signed(yoyAt(hog, hm[m]), 1) + '%', ...HR.map(([k]) => nf(rm[k][m]?.value, 1))]));
  finish(c, short(hog.at(-1).date));
};
// Biên chăn nuôi heo ước: giá thành = FCR × giá thức ăn ước + chi phí khác; thức ăn ước = k × (tỷ trọng ngô × ngô + tỷ trọng khô đậu × khô đậu) quy VND/kg.
T.hogmargin = c => {
  const H = c.param, hog = S('hog'), cm = byMonth(S('corn')), smm = byMonth(S('soymeal')), fxm = byMonth(S('usdvnd'));
  const rows = hog.map(r => { const m = ym(r.date), co = cm[m], so = smm[m], fx = fxm[m]; if (!co || !so || !fx) return null;
    const feed = H.k * (H.corn * co.value / 2.54012 + H.soy * so.value) * fx.value / 1e6, cost = H.fcr * feed + H.other; return {m, hog: r.value, feed, cost, margin: r.value - cost, fx: fx.value}; }).filter(Boolean).slice(-36);
  if (!rows.length) return;
  barLineChart(c.id, {categories: rows.map(r => mon(r.m + '-01')), series: [{name: 'Heo hơi toàn quốc', color: C.red, kind: 'line', values: rows.map(r => r.hog)}, {name: 'Giá thành ước', color: C.navy, kind: 'line', values: rows.map(r => r.cost)}, {name: 'Vùng hòa vốn ' + H.band[0], color: C.grey, kind: 'line', values: rows.map(() => H.band[0])}, {name: 'Vùng hòa vốn ' + H.band[1], color: C.grey, kind: 'line', values: rows.map(() => H.band[1])}], unit: 'nghìn đ/kg', digits: 1, height: 260, zeroBase: false, rotateLabels: true});
  legend(c.id, [['Heo hơi', C.red], ['Giá thành ước', C.navy], ['Vùng hòa vốn ' + H.band[0] + '–' + H.band[1], C.grey]]);
  fillTable(c.table, ['Tháng', 'Heo hơi', 'Thức ăn ước (nghìn đ/kg)', 'Giá thành ước', 'Biên ước', 'USD/VND'], rows.slice().reverse().map(r => [mon(r.m + '-01'), nf(r.hog, 1), nf(r.feed, 2), nf(r.cost, 1), signed(r.margin, 1), nf(r.fx, 0)]));
  finish(c, mon(rows.at(-1).m + '-01'));
};
/* ---------- Thêm cho Hàng không (26/11/2026): số lũy kế Cục HK, chuỗi tháng NSO, heatmap thị trường, jet fuel – tỷ giá, độ nhạy, tiến độ dự án, BCTC từng mã ---------- */
const OBS = () => W.obs || [];
const obsOf = (metric, f = {}) => OBS().filter(o => o.metric_id === metric && Object.entries(f).every(([k, v]) => o[k] === v));
const srcOf = list => { const seen = new Map(); list.forEach(o => { if (o.source_url && !seen.has(o.source_url)) seen.set(o.source_url, [o.source_name + (o.published_at ? ' ' + short(o.published_at) : ''), o.source_url]); }); return [...seen.values()]; };
// Số theo kỳ công bố (năm, lũy kế): c.views [[metric, nhãn]], c.segs [[segment, nhãn, màu]]. Cột = giá trị; dải dưới chart = so cùng kỳ do nguồn công bố.
T.cum = c => {
  const order = rows => [...new Map(rows.slice().sort((a, b) => a.period_end < b.period_end ? -1 : a.period_end > b.period_end ? 1 : (a.period_start < b.period_start ? 1 : -1)).map(o => [o.period_label, o])).keys()];
  const draw = metric => {
    const rows = obsOf(metric), periods = order(rows).filter(p => !c.periods || c.periods.includes(p));
    const at = (p, sg) => rows.find(o => o.period_label === p && o.segment === sg);
    const unit = rows[0]?.unit || '';
    barLineChart(c.id, {categories: periods, series: c.segs.map(([sg, n, col]) => ({name: n, color: col, values: periods.map(p => at(p, sg)?.value ?? null)})), unit, digits: c.digits ?? 1, height: 260, rotateLabels: false, stackable: !!c.stackable});
    const host = document.getElementById(c.id), card = host?.closest('.card');
    card?.querySelector(`[data-yoy="${c.id}"]`)?.remove();
    if (host) { const box = make('div', 'hk-yoy'); box.dataset.yoy = c.id; box.innerHTML = '<b>So cùng kỳ (nguồn công bố)</b>' + periods.map(p => `<span><i>${esc(p)}</i>${c.segs.map(([sg, n, col]) => { const o = at(p, sg); return `<em style="color:${col}">${esc(n)} ${o?.yoy == null ? '—' : signed(o.yoy, 1) + '%'}</em>`; }).join('')}</span>`).join(''); (card?.querySelector(':scope>.legend') || host).after(box); }
    fillTable(c.table, ['Kỳ', ...c.segs.flatMap(([, n]) => [n + ' (' + unit + ')', n + ' so cùng kỳ (%)']), 'Ngày công bố', 'Loại số'], periods.map(p => { const any = rows.find(o => o.period_label === p); return [p, ...c.segs.flatMap(([sg]) => { const o = at(p, sg); return [nf(o?.value, c.digits ?? 1), o?.yoy == null ? '—' : signed(o.yoy, 1)]; }), short(any?.published_at), any?.status || '']; }).reverse());
    return periods.at(-1);
  };
  let last = null;
  if (c.views.length > 1) toggles(c.id, c.views, v => { const r = draw(v); if (last == null) last = r; });
  else last = draw(c.views[0][0]);
  legend(c.id, c.segs.map(([, n, col]) => [n, col]));
  finish({...c, src: srcOf(c.views.flatMap(([m]) => obsOf(m))).concat(c.src || [])}, last);
};
// Chuỗi tháng NSO, bật/tắt Sản lượng | So cùng kỳ: c.series [[tên, khóa, màu, 'line'?]].
T.mseries = c => {
  const base = S(c.series[0][1]).slice(-(c.months || 36)); if (!base.length) return;
  const maps = c.series.map(([, k]) => [S(k), byMonth(S(k))]);
  const draw = v => barLineChart(c.id, {categories: base.map(r => mon(r.date)), series: c.series.map(([n, , col, kind], j) => ({name: n + (v === 'yoy' ? ' · so cùng kỳ' : ''), color: col, kind: v === 'yoy' || kind === 'line' ? 'line' : undefined, values: base.map(r => { const x = maps[j][1][ym(r.date)]; return !x ? null : v === 'yoy' ? yoyAt(maps[j][0], x) : x.value / (c.div || 1); })})), unit: v === 'yoy' ? '%' : c.unit, digits: v === 'yoy' ? 1 : (c.digits ?? 1), height: 260, rotateLabels: true, zeroBase: v !== 'yoy'});
  toggles(c.id, [['raw', c.rawLabel || 'Sản lượng'], ['yoy', 'So cùng kỳ (%)']], draw);
  legend(c.id, c.series.map(([n, , col]) => [n, col]));
  fillTable(c.table, ['Tháng', ...c.series.flatMap(([n]) => [n + ' (' + c.unit + ')', 'so cùng kỳ (%)'])], S(c.series[0][1]).slice().reverse().map(r => [mon(r.date), ...maps.flatMap(([rs, m]) => { const x = m[ym(r.date)]; return [x ? nf(x.value / (c.div || 1), c.digits ?? 1) : '—', x ? signed(yoyAt(rs, x), 1) : '—']; })]));
  finish(c, mon(base.at(-1).date));
};
// Heatmap thị trường × tháng: ô = nghìn lượt hoặc so cùng kỳ (%).
T.heat = c => {
  const h = document.getElementById(c.id); if (!h) return;
  const months = [...new Set(c.rows.flatMap(([k]) => S(k).map(r => ym(r.date))))].sort().slice(-(c.months || 18));
  const draw = v => {
    const cell = (k, m) => { const rs = S(k), r = rs.find(x => ym(x.date) === m); if (!r) return null; return v === 'yoy' ? yoyAt(rs, r) : r.value / 1000; };
    const grid = c.rows.map(([k, n]) => [n, months.map(m => cell(k, m))]);
    const all = grid.flatMap(([, vs]) => vs).filter(Number.isFinite), mx = Math.max(...all.map(Math.abs), 1);
    const color = x => { if (!Number.isFinite(x)) return 'transparent'; if (v === 'yoy') { const a = Math.min(Math.abs(x) / 60, 1); return x >= 0 ? `rgba(39,175,149,${(0.12 + a * 0.75).toFixed(2)})` : `rgba(209,88,63,${(0.12 + a * 0.75).toFixed(2)})`; } return `rgba(41,56,168,${(0.08 + 0.82 * x / mx).toFixed(2)})`; };
    h.innerHTML = `<div class="hk-heat" style="--hk-cols:${months.length}" role="table" aria-label="${esc(c.aria || '')}"><div class="hk-hrow hk-hhead" role="row"><span role="columnheader"></span>${months.map(m => `<span role="columnheader">${mon(m + '-01')}</span>`).join('')}</div>${grid.map(([n, vs]) => `<div class="hk-hrow" role="row"><span role="rowheader">${esc(n)}</span>${vs.map((x, i) => `<span role="cell" style="background:${color(x)};color:${v !== 'yoy' && Number.isFinite(x) && x / mx > 0.55 ? '#fff' : 'inherit'}" title="${esc(n)} · ${mon(months[i] + '-01')}: ${Number.isFinite(x) ? (v === 'yoy' ? signed(x, 1) + '% so cùng kỳ' : nf(x, 1) + ' nghìn lượt') : 'chưa có số'}">${Number.isFinite(x) ? (v === 'yoy' ? signed(x, 0) : nf(x, 0)) : ''}</span>`).join('')}</div>`).join('')}</div>`;
  };
  toggles(c.id, [['raw', 'Nghìn lượt'], ['yoy', 'So cùng kỳ (%)']], draw);
  fillTable(c.table, ['Thị trường', ...months.map(m => mon(m + '-01'))], c.rows.map(([k, n]) => [n, ...months.map(m => { const r = S(k).find(x => ym(x.date) === m); return r ? nf(r.value / 1000, 1) : '—'; })]));
  finish(c, mon(months.at(-1) + '-01'));
};
// Jet fuel và tỷ giá: hai chart nhỏ cùng trục tháng; dòng trên chart = điểm ngày mới nhất + bình quân quý gần nhất; bảng bình quân quý.
T.fuelfx = c => {
  const F = W.fuel || {}, X = W.fx || {};
  const months = [...new Set([...(F.monthly || []).map(r => r[0]), ...(X.monthly || []).map(r => r[0])])].filter(m => m >= (c.from || '2023-01')).sort();
  const fm = Object.fromEntries(F.monthly || []), xm = Object.fromEntries(X.monthly || []);
  const mk = (id, name, map, col, unit, d) => { if (!document.getElementById(id)) return; barLineChart(id, {categories: months.map(m => mon(m + '-01')), series: [{name, color: col, kind: 'line', values: months.map(m => map[m] ?? null)}], unit, digits: d, height: 210, rotateLabels: true, zeroBase: false}); };
  mk(c.id, 'Jet fuel spot – US Gulf Coast', fm, C.red, 'USD/gallon', 2);
  mk(c.id2, 'Tỷ giá trung tâm USD/VND', xm, C.navy, 'đồng/USD', 0);
  const fd = (F.daily || []).at(-1), xd = (X.daily || []).at(-1);
  const q = m => m.slice(0, 4) + 'Q' + Math.ceil(Number(m.slice(5)) / 3);
  const qa = list => { const a = {}; (list || []).forEach(([d, v]) => { if (d >= (c.from || '2023-01')) (a[q(d)] = a[q(d)] || []).push(v); }); return Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v.reduce((x, y) => x + y, 0) / v.length])); };
  const fq = qa(F.daily?.length ? F.daily : F.monthly), xq = qa(X.daily?.length ? X.daily : X.monthly), qs = [...new Set([...Object.keys(fq), ...Object.keys(xq)])].sort();
  const ql = k => 'Q' + k.slice(-1) + '/' + k.slice(0, 4);
  const note = (id, txt) => { const h = document.getElementById(id); if (h && txt) h.before(make('div', 'hk-last', txt)); };
  const fl = Object.keys(fq).sort().at(-1), xl = Object.keys(xq).sort().at(-1);
  note(c.id, fd ? `Ngày ${short(fd[0])}: ${nf(fd[1], 3)} USD/gallon · bình quân ${ql(fl)} (đến ngày): ${nf(fq[fl], 3)}` : '');
  note(c.id2, xd ? `Ngày ${short(xd[0])}: ${nf(xd[1], 0)} đồng/USD · bình quân ${ql(xl)} (đến ngày): ${nf(xq[xl], 0)}` : '');
  fillTable(c.table, ['Quý', 'Jet fuel bình quân (USD/gallon)', 'so cùng kỳ (%)', 'USD/VND trung tâm bình quân', 'so cùng kỳ (%)'], qs.slice().reverse().map(k => { const ly = (Number(k.slice(0, 4)) - 1) + k.slice(4); return [ql(k), nf(fq[k], 3), fq[ly] ? signed((fq[k] / fq[ly] - 1) * 100, 1) : '—', nf(xq[k], 0), xq[ly] ? signed((xq[k] / xq[ly] - 1) * 100, 2) : '—']; }));
  sourceLine(c.id, [[F.source || 'EIA', F.url || 'https://www.eia.gov/dnav/pet/hist/EER_EPJK_PF4_RGC_DPGD.htm']], fd ? short(fd[0]) : '', F.method);
  sourceLine(c.id2, [[X.source || 'Ngân hàng Nhà nước', X.url || 'https://sbv.gov.vn/']], xd ? short(xd[0]) : '', X.method);
};
// Độ nhạy minh họa: tham số người dùng nhập, không phải số doanh nghiệp; c.calc(v) trả [[nhãn, giá trị, ghi chú]].
T.sens = c => {
  const h = document.getElementById(c.id); if (!h) return;
  h.innerHTML = `<div class="hk-sens"><div class="hk-sens-in">${c.param.map(([k, l, v, u, step]) => `<label><span>${esc(l)}</span><input type="number" step="${step || 'any'}" data-k="${k}" value="${v}" inputmode="decimal"><em>${esc(u)}</em></label>`).join('')}</div><div class="hk-sens-out rf-tiles" aria-live="polite"></div></div>`;
  const calc = () => { const v = {}; h.querySelectorAll('input').forEach(i => { v[i.dataset.k] = Number(i.value); }); h.querySelector('.hk-sens-out').innerHTML = c.calc(v, {AF, nf, signed}).map(([k, val, s]) => `<div class="rf-tile"><small>${esc(k)}</small><b>${esc(val)}</b><span>${esc(s)}</span></div>`).join(''); };
  h.addEventListener('input', calc); calc();
  pwSrc(c.id, c.src || []); if (c.method) h.after(make('div', 'source-note method-note', c.method));
};
// Tiến độ dự án: thanh %; c.items [[nhãn, %, màu, ghi chú]].
T.progress = c => {
  const h = document.getElementById(c.id); if (!h) return;
  h.innerHTML = `<div class="hk-prog">${c.items.map(([l, v, col, n]) => `<div class="hk-prow"><div class="hk-plab"><b>${esc(l)}</b><span>${esc(n || '')}</span></div><div class="hk-pbar" role="img" aria-label="${esc(l)} ${nf(v, 2)}%" title="${esc(l)}: ${nf(v, 2)}%"><i style="width:${Math.max(0, Math.min(100, v))}%;background:${col}"></i><em>${nf(v, v % 1 ? 2 : 0)}%</em></div></div>`).join('')}</div>`;
  fillTable(c.table, ['Chỉ tiêu', '%', 'Ghi chú'], c.items.map(([l, v, , n]) => [l, nf(v, 2), n || '']));
  pwSrc(c.id, c.src || []); if (c.method) h.after(make('div', 'source-note method-note', c.method));
};
// BCTC quý từng mã (window.AVIATION_FIN, tỷ đồng). c.views [[khóa, nhãn, đơn vị]]; khóa tính: margin_gross, margin_op, margin_net, fcf (CFO − capex), netdebt.
// c.items (một mã, nhiều khoản mục) [[khóa, tên, màu, 'line'?]] thay cho so sánh nhiều mã.
const AF = () => window.AVIATION_FIN;
const finVal = (t, k, i) => { const r = AF()?.data?.[t]; if (!r) return null; const g = x => r[x]?.[i], ok = (...a) => a.every(Number.isFinite);
  if (k === 'margin_gross') return ok(g('gross'), g('revenue')) && g('revenue') ? g('gross') / g('revenue') * 100 : null;
  if (k === 'margin_op') return ok(g('op_profit'), g('revenue')) && g('revenue') ? g('op_profit') / g('revenue') * 100 : null;
  if (k === 'margin_net') return ok(g('npat'), g('revenue')) && g('revenue') ? g('npat') / g('revenue') * 100 : null;
  if (k === 'fcf') return ok(g('cfo'), g('capex')) ? g('cfo') - g('capex') : null;
  if (k === 'netdebt') return ok(g('st_debt'), g('lt_debt'), g('cash')) ? g('st_debt') + g('lt_debt') - g('cash') - (Number.isFinite(g('st_invest')) ? g('st_invest') : 0) : null;
  return Number.isFinite(g(k)) ? g(k) : null; };
T.fin = c => {
  const D = AF(); if (!D?.periods?.length) return; const n = D.periods.length, from = Math.max(0, n - (c.quarters || 12)), ps = D.periods.slice(from), ql = p => 'Q' + p.slice(-1) + '/' + p.slice(0, 4);
  const syms = c.syms.filter(([t]) => D.data[t]); if (!syms.length) return;
  const isPct = k => /^margin/.test(k);
  const draw = k => {
    const series = c.items ? c.items.map(([kk, nm, col, kind]) => ({name: nm, color: col, kind, values: ps.map((_, i) => { const x = finVal(k || syms[0][0], kk, from + i); return x == null ? null : x / (c.div || 1); })}))
      : syms.map(([t, col]) => ({name: t, color: col, kind: isPct(k) ? 'line' : undefined, values: ps.map((_, i) => { const x = finVal(t, k, from + i); return x == null ? null : isPct(k) ? x : x / (c.div || 1); })}));
    barLineChart(c.id, {categories: ps.map(ql), series, unit: !c.items && isPct(k) ? '%' : (c.unit || 'tỷ đồng'), digits: !c.items && isPct(k) ? 1 : (c.digits ?? 0), height: 260, rotateLabels: true, zeroBase: !(!c.items && isPct(k))});
  };
  const views = c.items ? syms.map(([t]) => [t, t]) : c.views;
  if (views.length > 1) toggles(c.id, views.map(([k, l]) => [k, l]), draw); else draw(views[0][0]);
  legend(c.id, c.items ? c.items.map(([, nm, col]) => [nm, col]) : syms.map(([t, col]) => [t, col]));
  const cols = c.items ? syms.flatMap(([t]) => c.items.map(([kk, nm]) => [t, kk, t + ' · ' + nm])) : syms.flatMap(([t]) => c.views.map(([k, l, u]) => [t, k, t + ' · ' + l + ' (' + (u || 'tỷ đồng') + ')']));
  fillTable(c.table, ['Quý', ...cols.map(x => x[2])], ps.map((p, i) => [ql(p), ...cols.map(([t, k]) => { const x = finVal(t, k, from + i); return x == null ? '—' : nf(x, isPct(k) ? 1 : 0); })]).reverse());
  finish({...c, src: [['BCTC hợp nhất quý (VNDirect finfo)', 'https://api-finfo.vndirect.com.vn/v4/financial_statements'], ...(c.src || [])]}, ql(ps.at(-1)));
};
// Thẻ đọc nhanh / sơ đồ dựng từ dữ liệu: c.render(ctx) trả HTML.
T.brief = c => { const h = document.getElementById(c.id); if (!h) return; h.innerHTML = c.render({obsOf, S, AF, finVal, nf, signed, esc, mon, short, W}); pwSrc(c.id, c.src || []); if (c.method) h.after(make('div', 'source-note method-note', c.method)); };
function toggles(id, opts, fn) {
  const host = document.getElementById(id); if (!host) return; const bar = make('div', 'rf-ctl'); host.before(bar);
  opts.forEach(([v, l], i) => { const b = make('button', 'rf-tog' + (i ? '' : ' on'), l); b.type = 'button'; b.addEventListener('click', () => { [...bar.children].forEach(x => x.classList.toggle('on', x === b)); fn(v); }); bar.append(b); });
  fn(opts[0][0]);
}

/* ---------- Ô số đầu sub-tab ---------- */
function kpi(k) {
  const sp = document.getElementById(k.spark), card = sp?.closest('.kpi'); if (!card) return;
  let value = '—', unit = '', sub = '', delta = '', spark = [], color = k.color || C.navy;
  if (k.series) {
    const rs = S(k.series), l = rs.at(-1);
    if (l && k.pct) { const p = rs.find(x => x.date.slice(0, 7) === String(Number(l.date.slice(0, 4)) - 1) + l.date.slice(4, 7)); value = (k.signed ? signed(l.value, 1) : nf(l.value, 1)) + '%'; sub = mon(l.date) + (k.note ? ' · ' + k.note : ''); delta = p ? 'cùng tháng năm trước ' + (k.signed ? signed(p.value, 1) : nf(p.value, 1)) + '%' : ''; spark = rs.slice(-12).map(r => r.value); }
    else if (l) { value = nf(l.value / (k.div || 1), k.digits ?? 0); unit = k.unit || ''; sub = mon(l.date) + (k.note ? ' · ' + k.note : ''); delta = signed(yoyAt(rs, l), 0) + '% so cùng kỳ' + (k.ytd === false ? '' : ' · lũy kế ' + signed(ytdYo(rs), 0) + '%'); spark = rs.slice(-12).map(r => r.value); }
  } else if (k.price) {
    const rs = (window.PLASTIC_PRICES?.series || {})[k.price]?.records || [], l = rs.at(-1);
    if (l) { const p = rs.find(r => r[0] === String(Number(l[0].slice(0, 4)) - 1) + l[0].slice(4)); value = nf(l[1], k.digits ?? 1); unit = k.unit || ''; sub = 'T' + Number(l[0].slice(5)) + '/' + l[0].slice(0, 4) + (k.note ? ' · ' + k.note : ''); delta = p ? signed((l[1] / p[1] - 1) * 100, 1) + '% so cùng kỳ' : ''; spark = rs.slice(-24).map(r => r[1]); }
  } else if (k.fixed) {
    [value, unit, sub, delta] = k.fixed; spark = k.spark2 || [];
  } else if (k.pe) {
    const rs = sec[k.pe]?.records || [], l = rs.at(-1); if (l) { value = nf(l[1], 1) + 'x'; sub = 'P/E rổ ' + (k.label || '') + ' · ' + short(l[0]); delta = 'P/B ' + nf(l[2], 2) + 'x'; spark = rs.slice(-30).map(r => r[1]); color = C.grey; }
  }
  const ve = card.querySelector('.value'); ve.textContent = value; if (unit) { const u = make('span', 'unit', unit); u.style.cssText = 'font-size:12px;font-weight:600;color:var(--muted,#6b7a90);margin-left:6px;letter-spacing:0'; ve.append(u); }
  card.querySelector('.sub').textContent = sub; card.querySelector('.delta').textContent = delta;
  sp.replaceChildren(); const sv = spark.filter(Number.isFinite); if (sv.length > 1) sparkline(k.spark, sv, color);
}

(P.kpis || []).forEach(k => { try { kpi(k); } catch (e) { console.warn('kpi', k.spark, e); } });
(P.charts || []).forEach(c => { if (!document.getElementById(c.id)) return; try { T[c.type](c); } catch (e) { console.warn('chart', c.id, e); } });
window.SECTOR_SOURCE_MANUAL = (window.SECTOR_SOURCE_MANUAL || []).concat(P.sourceManual || []);
})();
