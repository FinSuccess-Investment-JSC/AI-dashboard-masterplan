/* Gói ngành tách từ Bán lẻ (26/11/2026): Sữa, Bia, Ô tô – Xe máy. Bộ dựng chart đọc cấu hình window.PKG (app/<ngành>-config.js).
   Dữ liệu: window.RETAIL_PUBLIC (scripts/build_sector_public.py: NSO, Hải quan, NHNN, IMF/FRED, FAO, ICE, VNDirect P/E rổ),
   window.COMPANY_QUARTERLY (BCTC hợp nhất quý). Số tài liệu ghi trong cấu hình, có dòng trong data/<ngành>/evidence.json.
   Trang chạy pipeline chung của gói (data-sector="retail") nên company-* được lọc về rổ của ngành ở app/pkg-shim.js.
   Dùng các hàm vẽ inline của trang (barLineChart, hbarCompare, sparkline, fillTable). */
(() => {
'use strict';
const P = window.PKG; if (!P || document.body.dataset.pkg !== P.key) return;
const W = window.RETAIL_PUBLIC || {blocks: {}}, B = W.blocks || {};
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
  h.innerHTML = '<ol class="rf-tl">' + c.items.slice().sort((a, b) => a.d < b.d ? -1 : 1).map(p => `<li class="${p.st === 'Dự thảo' ? 'draft' : ''} ${p.d < today ? 'past' : 'next'}"><time datetime="${p.d}">${esc(p.label || dd(p.d))}</time><div class="rf-ev"><div class="rf-ev-h"><b>${esc(p.name)}</b><span class="rf-st${p.st === 'Dự thảo' ? ' draft' : ''}">${p.st === 'Dự thảo' ? '○ ' : '● '}${esc(p.st)}</span></div><p>${esc(p.what)}</p><dl><dt>Doanh nghiệp</dt><dd>${esc(p.who)}</dd><dt>Biến cần theo dõi</dt><dd>${esc(p.v)}</dd></dl><a href="${p.url}" target="_blank" rel="noopener">Nguồn ↗</a></div></li>`).join('') + '</ol>';
  pwSrc(c.id, [['Văn bản và bài nguồn ở từng thẻ', '#']]); if (c.method) h.after(make('div', 'source-note', c.method));
};
T.steps = c => {
  const h = document.getElementById(c.id); if (!h) return; h.className = 'rf-chain';
  h.innerHTML = c.steps.map(([k, t, d], i) => `${i ? '<span class="rf-chain-ar" aria-hidden="true">→</span>' : ''}<div class="rf-chain-s"><small>${esc(k)}</small><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('');
  if (c.note) h.after(make('div', 'source-note', c.note)); pwSrc(c.id, c.src || []);
};
T.models = c => {
  const h = document.getElementById(c.id); if (!h) return; h.className = 'rf-models';
  h.innerHTML = c.items.map(([t, syms, rev, drv, links], i) => `<article class="rf-model"><header><span>${i + 1}</span><h4>${esc(t)}</h4></header><p class="rf-syms">${esc(syms)}</p><dl><dt>Doanh thu đến từ</dt><dd>${esc(rev)}</dd><dt>Biến quyết định biên</dt><dd>${esc(drv)}</dd></dl><nav>${(links || []).map(([hr, l]) => `<a href="${hr}">${esc(l)} →</a>`).join('')}</nav></article>`).join('');
  pwSrc(c.id, c.src || []);
};
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
