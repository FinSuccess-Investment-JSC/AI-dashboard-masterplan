/* Viễn thông · dựng toàn bộ trang theo khung trang Điện (bản 26/11/2026).
   Tab chính: Tổng quan ngành (#mt1) · Bức tranh ngành (#mt2) · Tài chính ngành (#mt14) · Chủ đề nóng (#mt7).
   Cấp điều hướng như Điện: tab chính → tab con (.pp-nav) → khâu (.pp-flow/.pp-stage) → nhóm câu hỏi (.pp-panel, .pp-ph h3)
   → chart/bảng. Mục lục và Tìm nhanh dùng app/sector-smart.js (bản của Điện) — đọc tiêu đề nhóm .pp-ph h3 của tab con đang mở.
   Một bộ định tuyến (route/apply) đọc và ghi URL: ?ov=…#mt1, ?section=…#mt2, ?fin=…#mt14, #mt7; khôi phục link cũ
   (#mt3 → Chính sách, #mt4 → Chủ đề nóng, #mt5 → danh mục nguồn, ?ov=listed, ?section=growth/data/fiveg/compete/finance).
   Số liệu ngành: window.TELECOM (data/telecom-industry.js); BCTC: window.TELECOM_FIN; tin: window.TELECOM_NEWS (telecom-news.js).
   Chỉ mô tả dữ liệu, không kết luận; chỉ tiêu không có số thì không vẽ; nguồn hiện dưới mọi KPI, chart, bảng. */
(() => {
'use strict';
const T = window.TELECOM || {series: {}, sources: []};
const F = window.TELECOM_FIN;
const fin = v => typeof v === 'number' && Number.isFinite(v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => { if (!fin(v)) return '—'; const r = Math.round(v * 10 ** d) / 10 ** d; return (r === 0 ? 0 : r).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}); };
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const dmy = d => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : (/^(\d{4})-(\d\d)$/.test(d || '') ? `${d.slice(5)}/${d.slice(0, 4)}` : (d || '')); };
const per = p => /^\d{4}Q\d$/.test(p) ? `Q${p.slice(-1)}/${p.slice(0, 4)}` : /^\d{4}-\d\d$/.test(p) ? `T${+p.slice(5)}/${p.slice(0, 4)}` : /^\d{4}-\d\d-\d\d$/.test(p) ? dmy(p) : p;
const COL = ['#1D2678', '#2a9fa3', '#c98a00', '#861C52', '#3d4653', '#8997D6', '#2938A8', '#9AA3BD'];
const OPC = {Viettel: '#C8394B', VNPT: '#2938A8', VinaPhone: '#2938A8', MobiFone: '#2a9fa3', 'FPT Telecom': '#c98a00', Vietnamobile: '#861C52', Gmobile: '#3d4653', SCTV: '#8997D6', 'Khác': '#9AA3BD'};
const SRCS = new Map((T.sources || []).map(s => [s.id, s]));
const S = k => T.series?.[k] || null;
const has = (...ks) => ks.every(k => S(k)?.points?.length);
const TODAY = new Date().toISOString().slice(0, 10);

/* ================= Định tuyến ================= */
const TABS = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
const PARAM = {mt1: 'ov', mt2: 'section', mt14: 'fin'};
const DEF = {mt1: 'map', mt2: 'market', mt14: 'fin'};
// Khóa tab con cũ → [tab con mới, khâu]
const SEC_ALIAS = {growth: ['market', 'size'], compete: ['market', 'compete'], data: ['mobile', 'usage'], fiveg: ['mobile', 'network'],
  fixed: ['fixed', null], tower: ['tower', null], policy: ['policy', null], market: ['market', null], mobile: ['mobile', null]};
function route(u = new URL(location.href)) {
  const h = (u.hash || '').slice(1), q = u.searchParams, r = {tab: null, sub: null, stage: null, anchor: null};
  if (TABS.some(t => t[0] === h)) r.tab = h;
  else if (h === 'mt3') { r.tab = 'mt2'; r.sub = 'policy'; }
  else if (h === 'mt4') r.tab = 'mt7';
  else if (h === 'mt5') { r.tab = 'mt2'; r.anchor = 'vt-sources'; }
  const ov = q.get('ov'), sec = q.get('section'), fn = q.get('fin');
  // Link cũ ?ov=listed (bảng doanh nghiệp đã chuyển sang Tài chính ngành). Có cả #mt1 và section=… thì ưu tiên ngữ cảnh #mt1.
  if (ov === 'listed' && (!r.tab || r.tab === 'mt1')) { r.tab = 'mt14'; r.sub = 'listed'; return r; }
  if (sec === 'finance' && (!r.tab || r.tab === 'mt2')) { r.tab = 'mt14'; r.sub = 'fin'; return r; }
  if (!r.tab) r.tab = fn ? 'mt14' : sec ? 'mt2' : 'mt1';
  if (r.tab === 'mt1' && ov) r.sub = ov;
  if (r.tab === 'mt2' && sec && !r.sub) { const a = SEC_ALIAS[sec]; if (a) { r.sub = a[0]; r.stage = a[1]; } }
  if (r.tab === 'mt14' && fn) r.sub = fn;
  return r;
}
const NAV = {}, SUBS = {};
let applying = false;
function writeUrl(push) {
  if (applying) return;
  const u = new URL(location.href), tab = NAV.tab;
  ['ov', 'section', 'fin'].forEach(k => u.searchParams.delete(k));
  if (PARAM[tab]) u.searchParams.set(PARAM[tab], SUBS[tab]?.cur || DEF[tab]);
  if (!(tab === 'mt14' && SUBS.mt14?.cur === 'listed')) u.searchParams.delete('tk');
  u.hash = tab;
  const s = u.pathname + u.search + u.hash;
  if (s === location.pathname + location.search + location.hash) return;
  history[push ? 'pushState' : 'replaceState'](null, '', s);
}
function showTab(tab, push) {
  if (!TABS.some(t => t[0] === tab)) tab = 'mt1';
  NAV.tab = tab;
  document.querySelectorAll('.majorpane').forEach(p => p.classList.toggle('active', p.dataset.tab === tab));
  document.querySelectorAll('.majortabbtn').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
  writeUrl(push);
  setTimeout(() => { dispatchEvent(new Event('resize')); dispatchEvent(new Event('pv:toc')); }, 40);
}
function apply(r, scroll) {
  applying = true;
  showTab(r.tab, false);
  if (SUBS[r.tab]) SUBS[r.tab].select(r.sub || SUBS[r.tab].cur || DEF[r.tab]);
  applying = false; writeUrl(false);
  const target = r.anchor ? document.getElementById(r.anchor) : r.stage ? document.getElementById(`${r.tab}-${SUBS[r.tab]?.cur}-${r.stage}`) : null;
  if (target) { if (target.tagName === 'DETAILS') target.open = true; setTimeout(() => target.scrollIntoView({block: 'start'}), 260); }
  else if (scroll) scrollTo({top: 0});
}
window.showMajorTab = tab => showTab(tab, true);
// Link nội bộ: href="?section=tower#mt2" hoặc data-vt-go="mt2:tower:ctr".
document.addEventListener('click', e => {
  if (e.target.closest('a[href^="http"]')) return;  // link nguồn bên trong ô KPI
  const a = e.target.closest('[data-vt-go], a[href^="?"], a[href^="#mt"]');
  if (!a || e.metaKey || e.ctrlKey || e.button) return;
  let r;
  if (a.dataset.vtGo) { const [tab, sub, stage, code] = a.dataset.vtGo.split(':'); r = {tab, sub: sub || null, stage: stage || null}; if (code) setTimeout(() => window.VTListed?.filter(code), 0); }
  else { const u = new URL(a.getAttribute('href'), location.href); if (u.pathname !== location.pathname) return; r = route(u); applyQuery(u); }
  e.preventDefault(); applying = true; showTab(r.tab, false); if (SUBS[r.tab] && r.sub) SUBS[r.tab].select(r.sub); applying = false; writeUrl(true);
  const target = r.stage ? document.getElementById(`${r.tab}-${SUBS[r.tab]?.cur}-${r.stage}`) : null;
  setTimeout(() => (target || document.querySelector('.majortabs'))?.scrollIntoView({behavior: 'smooth', block: 'start'}), 80);
});
// Tham số phụ trong link (mã trong bảng doanh nghiệp).
function applyQuery(u) { const tk = u.searchParams.get('tk'); if (tk && window.VTListed) window.VTListed.filter(tk); }
addEventListener('popstate', () => apply(route(), false));
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('div[data-vt-go]')) { e.preventDefault(); e.target.click(); } });

/* ================= Khung chung ================= */
function srcLine(ids, extra) {
  const list = [...new Set((ids || []).filter(x => x != null))].map(id => SRCS.get(id)).filter(Boolean);
  const byName = new Map(); list.forEach(s => { const k = s.org || s.name; if (!byName.has(k)) byName.set(k, s); });
  const parts = [...byName.values()].slice(0, 4).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.org || s.name)}</a>${s.published ? ' ' + esc(dmy(s.published)) : ''}`);
  const more = byName.size > 4 ? ` và ${byName.size - 4} nguồn khác` : '';
  return `Nguồn: ${[...parts, ...(extra ? [extra] : [])].join('; ')}${more}`;
}
function foot(card, ids, note, extra) {
  card.append(el('div', 'pw-src', srcLine(ids, extra)));
  if (note) card.append(el('div', 'pw-src-note', esc(note)));
}
const seriesSrc = keys => keys.flatMap(k => (S(k)?.points || []).map(p => p[3]));
const statusOf = keys => keys.some(k => (S(k)?.points || []).some(p => p[2] === 'estimate')) ? 'có số ước tính' : '';
function yearly(k) {
  const s = S(k); if (!s) return new Map();
  const m = new Map();
  s.points.forEach(([p, v]) => { if (fin(v) && /^\d{4}$/.test(p)) m.set(p, v); });
  if (s.kind === 'stock') s.points.forEach(([p, v]) => { const y = p.slice(0, 4); if (!fin(v) || m.has(y)) return; if (/^\d{4}(-12|Q4|-12-31)$/.test(p)) m.set(y, v); });
  return m;
}
const exact = k => new Map((S(k)?.points || []).filter(x => fin(x[1])).map(x => [x[0], x[1]]));
function align(keys, getter = yearly) {
  const maps = keys.map(k => getter(k)), cats = [...new Set(maps.flatMap(m => [...m.keys()]))].sort();
  return {cats, vals: maps.map(m => cats.map(c => m.has(c) ? m.get(c) : null))};
}
function index100(vals) {
  const n = vals[0]?.length || 0; let b = -1; for (let i = 0; i < n; i++) if (vals.every(v => fin(v[i]) && v[i] !== 0)) { b = i; break; }
  return {base: b, vals: vals.map(v => v.map(x => b >= 0 && fin(x) ? x / v[b] * 100 : null))};
}
const yoy = v => v.map((x, i) => i && fin(x) && fin(v[i - 1]) && v[i - 1] > 0 ? (x / v[i - 1] - 1) * 100 : null);
const diff = v => v.map((x, i) => i && fin(x) && fin(v[i - 1]) ? x - v[i - 1] : null);
const r2 = v => v.map(x => fin(x) ? Math.round(x * 100) / 100 : null);
function trimCats(cats, series) {
  let a = 0; while (a < cats.length && series.every(s => !fin(s.values[a]))) a++;
  let b = cats.length - 1; while (b > a && series.every(s => !fin(s.values[b]))) b--;
  return {cats: cats.slice(a, b + 1), series: series.map(s => ({...s, values: r2(s.values.slice(a, b + 1))}))};
}
let seq = 0;
const queue = [];
function chartCard(o) {
  const t = trimCats(o.cats, o.series.filter(s => s.values.some(fin)));
  if (!t.series.length || t.cats.length < (o.min ?? 2)) return null;
  const c = el('div', 'card pp-card vt-card'); c.dataset.blockId = o.id; c.dataset.updateKind = 'public'; c.dataset.cadence = o.cadence || 'monthly'; c.dataset.refreshStatus = 'snapshot';
  c.innerHTML = `<div class="chart-title">${esc(o.title)}</div>${o.sub ? `<div class="chart-sub">${esc(o.sub)}</div>` : ''}<div class="pp-host" id="${o.id}-host-${++seq}"></div>`;
  const host = c.querySelector('.pp-host');
  const model = {key: o.id, categories: t.cats.map(per), series: t.series, unit: o.unit || '', digits: o.digits ?? 1, stackable: !!o.stackable, native: o.native || 'line', zeroBase: o.zeroBase !== false, aria: o.title};
  queue.push(() => { if (window.ChartTypes) ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, model.native); }); });
  const meta = [o.note, `Kỳ: ${per(t.cats[0])}${t.cats.length > 1 ? ' – ' + per(t.cats.at(-1)) : ''}`, o.unit ? 'Đơn vị: ' + o.unit : '', o.status].filter(Boolean).join(' · ');
  foot(c, o.src || [], meta, o.extraSrc);
  return c;
}
function tableCard(id, title, head, rows, src, note, sub, extra) {
  if (!rows.length) return null;
  const c = el('div', 'card pp-tcard vt-card'); c.dataset.blockId = id; c.dataset.updateKind = 'public'; c.dataset.cadence = 'on-data-change'; c.dataset.refreshStatus = 'snapshot';
  c.innerHTML = `<div class="chart-title">${esc(title)}</div>${sub ? `<div class="chart-sub">${esc(sub)}</div>` : ''}<div class="tablewrap"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  foot(c, src, note, extra); return c;
}
function qpanel(num, q, nodes, lead) {
  const ok = [].concat(nodes).flat().filter(Boolean); if (!ok.length) return null;
  const p = el('section', 'pp-panel pp-q'); p.innerHTML = `<header class="pp-ph"><span class="pp-num">${esc(num)}</span><div><h3>${esc(q)}</h3>${lead ? `<p class="vt-lead">${lead}</p>` : ''}</div></header>`;
  const g = el('div', ok.length > 1 ? 'grid two g2 vt-grid' : 'vt-one'); ok.forEach(n => g.append(n)); p.append(g); return p;
}
const go = (label, target) => `<a class="vt-go" href="#" data-vt-go="${target}">${esc(label)} →</a>`;
// Nguồn mô tả cơ chế (bản đồ ngành, chuỗi giá trị): Luật Viễn thông 2023, BCTN FPT, công bố CTR, VGI — tìm theo tên để không lệ thuộc số thứ tự.
const srcBy = re => (T.sources || []).find(s => re.test(s.name + ' ' + s.org))?.id;
const MECH = () => [srcBy(/Luật Viễn thông năm 2023/), srcBy(/BCTN FPT 2025/), T.companies?.CTR?.facts?.[0]?.src, srcBy(/Viettel Global 2025/)];
const srcA = id => { const s = SRCS.get(id); return s ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.org || s.name)}</a>` : '—'; };

// Khâu trong tab con: thanh nhảy .pp-flow + tiêu đề .pp-stage; khâu không có nội dung thì không hiện.
function stages(p, tab, key, list) {
  const live = list.map(([id, k, t, nodes]) => [id, k, t, [].concat(nodes).flat().filter(Boolean)]).filter(x => x[3].length);
  if (live.length > 1) {
    const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Các khâu');
    bar.innerHTML = live.map(([id, k, t], i) => `${i ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#" class="pp-flow-s" data-vt-stage="${tab}-${key}-${id}"><small>${esc(k)}</small><b>${esc(t)}</b></a>`).join('');
    p.append(bar);
  }
  live.forEach(([id, k, t, nodes]) => { const h = el('div', 'pp-stage', `<span>${esc(k)}</span><h3>${esc(t)}</h3>`); h.id = `${tab}-${key}-${id}`; p.append(h, ...nodes); });
}
document.addEventListener('click', e => { const a = e.target.closest('[data-vt-stage]'); if (!a) return; e.preventDefault(); document.getElementById(a.dataset.vtStage)?.scrollIntoView({behavior: 'smooth', block: 'start'}); });

// Tab con: nút có id, khung có aria-labelledby (sector-smart.goTo mở đúng tab con khi tìm nhanh / mục lục).
function subtabs(host, tab, sections) {
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); host.append(nav);
  const panes = {}, btns = {};
  const ctl = SUBS[tab] = {cur: null, panes, select(key) {
    if (!panes[key]) key = sections[0][0];
    Object.entries(panes).forEach(([k, p]) => { const on = k === key; p.hidden = !on; btns[k].setAttribute('aria-selected', String(on)); btns[k].classList.toggle('active', on); });
    ctl.cur = key;
    setTimeout(() => { dispatchEvent(new Event('resize')); dispatchEvent(new Event('pv:toc')); }, 40);
  }};
  sections.forEach(([key, num, label, title, goal, build]) => {
    const b = el('button', 'tabbtn pp-tab', `<span>${num}</span>${esc(label)}`); b.type = 'button'; b.id = `${tab}-${key}-tab`; b.setAttribute('role', 'tab'); b.dataset.section = key; nav.append(b); btns[key] = b;
    const p = el('div', 'pane-subpane pp-pane'); p.id = `${tab}-${key}`; p.hidden = true; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id);
    p.innerHTML = `<header class="pp-head"><div><span class="pp-k">${num}</span><h2>${esc(title)}</h2><p>${goal}</p></div></header>`;
    host.append(p); panes[key] = p;
    try { build(p); } catch (e) { console.error(e); document.documentElement.dataset.vtError = (document.documentElement.dataset.vtError || '') + key + ':' + e.message + ';'; }
    b.addEventListener('click', () => { ctl.select(key); writeUrl(true); });
  });
  ctl.select(sections[0][0]);  // tab chính nào cũng có sẵn tab con mặc định
  return ctl;
}

/* ================= Chuỗi dùng nhiều nơi ================= */
const FG = (T.fiveg || []);
const nat5g = ev => FG.filter(x => x.operator === 'Toàn quốc' && x.event === ev && x.status === 'actual' && fin(x.value)).sort((a, b) => a.date.localeCompare(b.date));
// Trạm, thuê bao 5G toàn quốc: gộp mốc công bố (policy) và chuỗi industry, mỗi tháng một điểm (ưu tiên mốc công bố của Bộ).
function merged(key, ev) {
  const m = new Map();
  (S(key)?.points || []).forEach(([p, v, , src]) => m.set(p.slice(0, 7), {date: p, v, src}));
  nat5g(ev).forEach(x => m.set(x.date.slice(0, 7), {date: x.date, v: x.value, src: x.src}));
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, x]) => ({k, ...x}));
}
const stations5g = () => merged('bts_5g', 'stations'), subs5g = () => merged('subs_5g', 'subscribers');
function finYear(t, m) {
  if (!F) return new Map(); const d = F.data[t]?.[m]; const out = new Map(); if (!d) return out;
  const by = {}; F.periods.forEach((p, i) => { (by[p.slice(0, 4)] ||= []).push(d[i]); });
  Object.entries(by).forEach(([y, a]) => { if (a.length === 4 && a.every(fin)) out.set(y, a.reduce((x, z) => x + z, 0)); });
  return out;
}
// Số liệu cho câu chốt: đọc từ cùng dữ liệu đang vẽ, không chép tay số.
const lastY = k => { const m = yearly(k), ys = [...m.keys()].sort(); const y = ys.at(-1); return y ? {y, v: m.get(y), pv: m.get(String(+y - 1)), py: String(+y - 1)} : null; };
const lastPt = k => { const p = (S(k)?.points || []).filter(x => fin(x[1])); return p.at(-1) || null; };
const ch = (a, b) => fin(a) && fin(b) && b ? (a / b - 1) * 100 : null;
const FE = () => window.TelecomFinance?.engine;
const ttm = (t, m) => { const E = FE(); if (!E || !F) return null; const i = F.periods.length - 1; return E.per(m, [t], 'ttm')[t]?.[i] ?? null; };
const stk = (t, m) => { const E = FE(); if (!E || !F) return null; const i = F.periods.length - 1; return E.per(m, [t], 'q')[t]?.[i] ?? null; };
const LQ = () => F ? per(F.periods.at(-1)) : '';
const FIN_SRC = `<a href="https://api-finfo.vndirect.com.vn/v4/financial_statements" target="_blank" rel="noopener">BCTC hợp nhất (VNDirect finfo)</a>`;
const WB = ind => `<a href="https://data.worldbank.org/indicator/${ind}" target="_blank" rel="noopener">World Bank WDI (ITU)</a>`;
const LISTED = new Set((F?.companies || []).map(c => c.ticker));
const tk = (code, extra) => (LISTED.has(code) ? `<a class="vt-tk ls" href="?fin=listed&tk=${code}#mt14" title="Số liệu tài chính ${code}">${code}</a>` : `<span class="vt-tk ls">${code}</span>`) + (extra ? `<em>${extra}</em>` : '');

/* ================= Tổng quan ngành ================= */
function sparkSvg(vals) {
  const v = vals.filter(fin); if (v.length < 2) return '';
  const lo = Math.min(...v), hi = Math.max(...v), W = 160, H = 34, n = vals.length;
  const pts = vals.map((x, i) => fin(x) ? `${(i / (n - 1) * W).toFixed(1)},${(H - 3 - (hi > lo ? (x - lo) / (hi - lo) : .5) * (H - 6)).toFixed(1)}` : null).filter(Boolean).join(' ');
  return `<svg class="vt-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#2938A8" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg>`;
}
function dataBrief() {
  const cards = [];
  const card = o => cards.push(`<div class="db-c card vt-db" role="link" tabindex="0" data-vt-go="${o.go}" title="Mở phần phân tích"><div class="db-ch">${esc(o.label)}</div><div class="db-v">${o.value}<span class="db-u"> ${esc(o.unit)}</span></div><div class="db-s"><span>${o.yoy || ''}</span><span>${esc(o.period)}</span></div><div class="db-spark">${sparkSvg(o.spark || [])}</div><div class="pw-src">${srcLine(o.src)}</div></div>`);
  const rp = (S('rev')?.points || []).filter(x => fin(x[1])), rl = rp.at(-1);
  if (rl) card({label: 'Doanh thu hoạt động viễn thông', value: nf(rl[1], 1), unit: 'nghìn tỷ đồng', yoy: 'Số ước tính lần đầu', period: 'Năm ' + rl[0] + ' · ước tính', spark: rp.map(x => x[1]), src: [rl[3]], go: 'mt2:market:size'});
  const fx = lastY('fix_bb'), fg = fx ? ch(fx.v, fx.pv) : null;
  if (fx) card({label: 'Thuê bao băng rộng cố định', value: nf(fx.v, 1), unit: 'triệu thuê bao', yoy: fin(fg) ? `<b class="${fg >= 0 ? 'up' : 'dn'}">${sg(fg)}%</b> so cuối ${fx.py}` : '', period: 'Số cuối năm ' + fx.y, spark: [...yearly('fix_bb').values()], src: [lastPt('fix_bb')?.[3]], go: 'mt2:fixed:subs'});
  const s5 = subs5g(), l5 = s5.at(-1), p5 = l5 && s5.find(x => Math.abs((new Date(l5.date) - new Date(x.date)) / 864e5 - 365) <= 20), g5 = p5 ? ch(l5.v, p5.v) : null;
  if (l5) card({label: 'Thuê bao 5G', value: nf(l5.v, 1), unit: 'triệu thuê bao', yoy: fin(g5) ? `<b class="up">${sg(g5)}%</b> so ${dmy(p5.date)}` : '', period: 'Ngày quan sát ' + dmy(l5.date), spark: s5.map(x => x.v), src: [l5.src], go: 'mt2:mobile:usage'});
  const b5 = stations5g(), lb = b5.at(-1);
  if (lb) card({label: 'Trạm 5G toàn quốc', value: nf(lb.v, 0), unit: 'trạm', yoy: '', period: 'Ngày quan sát ' + dmy(lb.date), spark: b5.map(x => x.v), src: [lb.src], go: 'mt2:mobile:network'});
  if (!cards.length) return null;
  const lead = [
    fx && `Thuê bao Internet cố định vẫn tăng về số lượng: <b>${nf(fx.v, 1)} triệu</b> cuối ${fx.y}${fin(fg) ? `, <em class="${fg >= 0 ? 'up' : 'dn'}">${sg(fg)}%</em> so cuối ${fx.py}` : ''}.`,
    l5 && `Thuê bao 5G tăng nhanh: <b>${nf(l5.v, 1)} triệu</b> ngày ${dmy(l5.date)}${fin(g5) ? ` (<em class="up">${sg(g5, 0)}%</em> so ${dmy(p5.date)})` : ''}${lb ? `, ${nf(lb.v, 0)} trạm 5G` : ''}; chưa có ARPU hoặc doanh thu dịch vụ di động cùng kỳ để kiểm chứng nhà mạng có thu thêm tiền trên mỗi thuê bao.`
  ].filter(Boolean).join(' ');
  const note = rl ? `Doanh thu hoạt động viễn thông năm ${rl[0]} ước ${nf(rl[1], 1)} nghìn tỷ đồng là số ước tính lần đầu của Cục Thống kê. Bốn ô có kỳ quan sát khác nhau (năm, cuối năm, ngày quan sát), không đọc như một ảnh chụp cùng thời điểm.` : '';
  const s = el('section', 'db card vt-brief'); s.id = 'dataBrief';
  s.innerHTML = `<div class="db-l"><div class="db-k"><span class="db-dot"></span>Bản tin dữ liệu</div><div class="db-tk">Viễn thông</div><p class="db-lead">${lead}</p><p class="vt-note">${note} Bấm từng ô để mở phần phân tích.</p></div><div class="db-r">${cards.join('')}</div>`;
  return s;
}
// Sơ đồ chuỗi giá trị: ValueChain.draw (app/value-chain.js, chép từ Điện) — làn, ô có icon, luồng màu theo mô hình, mũi tên chạy.
// Khung 1170 × 480; ô cao 74. Bấm một khâu: lọc bảng 0.3 theo các mã niêm yết của khâu đó (sự kiện vc:select).
function telecomChain() {
  const C = {mob: '#2938A8', fix: '#c98a00', tow: '#2a9fa3', bld: '#b8801f', intl: '#861C52', pol: '#5a6682'}, H = 74;
  const N = [
    ['spec', 20, 40, 230, C.pol, 'law', 'Phổ tần & cấp phép', 'Bộ KH&CN đấu giá • phí tần số'],
    ['equip', 20, 150, 230, C.bld, 'factory', 'Thiết bị mạng', 'ELC • POT • ICT', 'Ericsson • Nokia • Viettel HT'],
    ['build', 20, 260, 230, C.bld, 'tool', 'Xây lắp • vận hành mạng', 'CTR (xây lắp, vận hành)', 'MFS (vận hành MobiFone)'],
    ['tower', 318, 95, 262, C.tow, 'tower', 'Hạ tầng trạm (cột, nhà trạm)', 'CTR ~12.000 trạm • OCK', 'phần lớn do nhà mạng tự sở hữu'],
    ['fiber', 318, 260, 262, C.fix, 'direct', 'Mạng cáp quang tới hộ', 'nhà mạng tự đầu tư (FTTH)'],
    ['cable', 318, 370, 262, C.pol, 'ship', 'Cáp quang biển quốc tế', 'ADC • APG • AAG • IA • SJC2'],
    ['mobile', 672, 95, 218, C.mob, 'bolt', 'Nhà mạng di động', 'Viettel • VNPT • MobiFone', 'Vietnamobile • MVNO'],
    ['fixed', 672, 260, 218, C.fix, 'home', 'Internet cố định • truyền hình', 'FOX • Viettel • VNPT'],
    ['intl', 672, 370, 218, C.intl, 'ship', 'Nhà mạng quốc tế', 'VGI • 10 thị trường'],
    ['vas', 935, 40, 222, C.pol, 'store', 'Dịch vụ số • nội dung', 'TTN • VTC • ABC • SGT'],
    ['cust', 935, 205, 222, C.mob, 'home', 'Khách hàng trong nước', 'cá nhân • hộ • doanh nghiệp'],
    ['custintl', 935, 370, 222, C.intl, 'home', 'Thuê bao nước ngoài', 'Đông Nam Á • châu Phi • Mỹ Latinh']
  ];
  const E = [
    ['spec', 'mobile', C.pol, 'M250 77 C430 48,600 48,700 95', true],
    ['equip', 'tower', C.bld], ['build', 'tower', C.bld], ['build', 'fiber', C.bld],
    ['tower', 'mobile', C.tow], ['fiber', 'fixed', C.fix], ['cable', 'fixed', C.pol, 'M580 407 C626 407,626 312,672 312', true],
    ['mobile', 'cust', C.mob], ['fixed', 'cust', C.fix], ['intl', 'custintl', C.intl],
    ['vas', 'cust', C.pol, `M1046 ${40 + H} V205`, true]
  ];
  const fig = ValueChain.draw({N, E, H, height: 480, table: 'vt-ov-position',
    lanes: [['PHỔ TẦN · THIẾT BỊ · XÂY LẮP', 0, 270, '#eef3fb', '#1D2678'], ['HẠ TẦNG', 285, 320, '#eefaf9', '#2a9fa3'], ['NHÀ MẠNG · KHÁCH HÀNG', 620, 550, '#fbf6ea', '#b8801f']],
    labels: [[470, 64, 'tiền trúng đấu giá, phí tần số'], [626, 122, 'giá thuê trạm'], [284, 232, 'hợp đồng'], [1046, 182, 'cước × ARPU'], [781, 462, 'doanh thu ở nước sở tại']],
    legend: [[C.mob, 'Di động'], [C.fix, 'Internet cố định'], [C.tow, 'Hạ tầng cho thuê'], [C.bld, 'Thiết bị · xây lắp'], [C.intl, 'Quốc tế (VGI)'], [C.pol, 'Cấp phép · kết nối quốc tế · dịch vụ số', true]],
    title: 'Chuỗi giá trị ngành viễn thông', desc: 'Nhà nước cấp phép tần số; nhà cung cấp thiết bị và nhà thầu xây lắp phục vụ nhà mạng và TowerCo; TowerCo cho nhà mạng thuê trạm; nhà mạng di động và Internet cố định thu cước của khách hàng; VGI hoạt động ở thị trường nước ngoài.'});
  return fig;
}
// Bấm khâu trên sơ đồ: lọc bảng doanh nghiệp 0.3 theo mã niêm yết của khâu.
document.addEventListener('vc:select', e => {
  const t = document.querySelector('[data-block-id="vt-ov-position"]'); if (!t) return;
  const codes = (e.detail?.codes || []).filter(c => LISTED.has(c));
  t.querySelectorAll('tbody tr').forEach(tr => { const code = tr.querySelector('td')?.textContent.trim(); tr.hidden = codes.length > 0 && !codes.includes(code); });
});
function mapPane(p) {
  const L = (t, cls = '') => `<span class="vt-tk ${cls}">${t}</span>`;
  const col = (title, sub, items) => `<div class="vt-col"><b>${esc(title)}</b><small>${esc(sub)}</small><div>${items.join('')}</div></div>`;
  const c = el('div', 'card vt-chain'); c.dataset.blockId = 'vt-ov-chain'; c.dataset.updateKind = 'manual'; c.dataset.cadence = 'quarterly'; c.dataset.refreshStatus = 'snapshot';
  c.innerHTML = `<div class="chart-title">Chuỗi giá trị viễn thông</div><div class="chart-sub">Mũi tên: chiều dịch vụ và hạ tầng đi tới khách hàng · nhãn trên luồng: chiều thanh toán (ngược mũi tên) · mỗi ô ghi bên sở hữu tài sản · rê chuột xem luồng, bấm khâu để lọc bảng 0.3</div>`;
  if (window.ValueChain) c.append(telecomChain()); else c.append(el('p', 'vt-note', 'Không tải được sơ đồ.'));
  c.append(el('div', 'vt-legend', `${L('Mã', 'ls')} doanh nghiệp niêm yết · bấm mã ở bảng 0.3 để xem số liệu tài chính · ${go('TowerCo & hạ tầng', 'mt2:tower')} ${go('Internet cố định', 'mt2:fixed')} ${go('Di động & 5G', 'mt2:mobile')}`));
  c.append(el('div', 'pw-src', srcLine(MECH())));
  p.append(qpanel('0.1', 'Dịch vụ viễn thông đi từ phổ tần, hạ tầng đến khách hàng qua những ai?', [c],
    `Ba mã đại diện ba nguồn doanh thu: <b>FOX</b> thu cước Internet cố định và truyền hình (${go('Trường hợp FOX', 'mt2:fixed:fox')}); <b>CTR</b> thu từ xây lắp, vận hành mạng cho nhà mạng và cho thuê hạ tầng trạm (${go('TowerCo & hạ tầng', 'mt2:tower')}); <b>VGI</b> thu cước tại các thị trường nước ngoài (${go('Hồ sơ VGI', 'mt14:listed::VGI')}). Nhà mạng di động trong nước (Viettel, VNPT, MobiFone) chưa niêm yết.`));
  const flows = tableCard('vt-ov-money', 'Ai trả tiền cho ai, ai sở hữu tài sản, ai ghi nhận doanh thu', ['Bên', 'Sở hữu tài sản', 'Trả tiền cho', 'Ghi nhận doanh thu từ'], [
    ['<b>Nhà nước</b> (Bộ KH&CN)', 'Phổ tần (cấp quyền sử dụng có thời hạn)', '—', 'Tiền trúng đấu giá, phí sử dụng tần số'],
    ['<b>Nhà mạng trong nước</b> (Viettel, VNPT, MobiFone, Vietnamobile, Gtel; FOX ở Internet cố định)', 'Thiết bị phát sóng, lõi mạng, cáp quang, phần lớn nhà trạm', 'Nhà nước (tần số), TowerCo (thuê trạm), nhà thầu (xây lắp, thiết bị, vận hành)', 'Cước thuê bao của khách hàng'],
    [`<b>TowerCo</b> (${tk('CTR')}, OCK…)`, 'Cột, nhà trạm, hạ tầng thụ động', 'Nhà thầu xây trạm, chủ đất, điện', 'Giá thuê trạm của nhà mạng theo hợp đồng'],
    [`<b>Nhà thầu, thiết bị, vận hành</b> (${['CTR', 'ELC', 'POT', 'ICT', 'MFS'].map(x => tk(x)).join(' ')})`, 'Không sở hữu trạm của khách hàng', 'Nhà cung cấp vật tư, thiết bị', 'Hợp đồng xây lắp, bán thiết bị, phí vận hành khai thác'],
    [`<b>Nhà mạng quốc tế</b> (${tk('VGI')})`, 'Cổ phần nhà mạng ở nước ngoài', 'Cơ quan quản lý, nhà cung cấp tại nước sở tại', 'Cước thuê bao tại các nước hoạt động'],
    ['<b>Khách hàng</b>', '—', 'Nhà mạng (cước trả trước, trả sau, gói Internet)', '—']
  ], [], null);
  flows?.querySelector('.pw-src')?.remove(); flows?.append(el('div', 'pw-src', srcLine(MECH())));
  p.append(qpanel('0.2', 'Ai trả tiền cho ai, bên nào sở hữu tài sản và ghi nhận doanh thu?', [flows]));
  if (F) {
    const DEEP = {CTR: go('TowerCo & hạ tầng', 'mt2:tower') + go('Hồ sơ CTR', 'mt14:listed::CTR'), FOX: go('Trường hợp FOX', 'mt2:fixed:fox') + go('Hồ sơ FOX', 'mt14:listed::FOX'), VGI: go('Hồ sơ VGI', 'mt14:listed::VGI')};
    const rows = F.companies.map(co => { const g = F.groups.find(x => x.id === co.group); return [tk(co.ticker), `<i class="vt-dot" style="background:${g?.color}"></i>${esc(g?.label || '')}`, esc(co.note || ''), DEEP[co.ticker] || '—']; });
    const t = tableCard('vt-ov-position', 'Doanh nghiệp niêm yết theo vị trí trong chuỗi', ['Mã', 'Nhóm mô hình', 'Hoạt động chính', 'Phân tích sâu'], rows, [], 'Bấm mã để xem số liệu ở Tài chính ngành › Doanh nghiệp niêm yết');
    t?.querySelector('.pw-src')?.remove(); if (t) t.insertBefore(el('div', 'pw-src', srcLine(MECH(), FIN_SRC)), t.querySelector('.pw-src-note'));
    p.append(qpanel('0.3', 'Doanh nghiệp niêm yết nằm ở khâu nào?', [t]));
  }
}
function chainPane(p) {
  const gmY = k => { const x = lastY(k); return x ? `${nf(x.v, 1)}% (${x.y})` : null; };
  const box = (k, t, small) => `<div class="pp-flow-box"><small>${esc(k)}</small><br>${esc(t)}${small ? `<br><small>${esc(small)}</small>` : ''}</div>`;
  const row = cells => `<div class="pp-flow-row">${cells.map((c, i) => (i ? '<span class="pp-arrow">→</span>' : '') + c).join('')}</div>`;
  const model = (id, title, rows, listed, link, src) => {
    const c = el('div', 'card vt-model'); c.dataset.blockId = id; c.dataset.updateKind = 'manual'; c.dataset.cadence = 'quarterly'; c.dataset.refreshStatus = 'snapshot';
    c.innerHTML = `<div class="chart-title">${esc(title)}</div>${rows.join('')}<div class="vt-legend">Doanh nghiệp niêm yết: ${listed} · ${link}</div>`;
    c.append(el('div', 'pw-src', src)); return c;
  };
  p.append(qpanel('1.1', 'Di động: tiền đầu tư vào đâu và thu về thế nào?', [model('vt-ov-m-mobile', 'Di động', [row([
    box('Đầu tư · đầu vào', 'Phổ tần (đấu giá), trạm BTS/5G, lõi mạng, thuê trạm'), box('Vận hành', 'Điện, thuê đất và trạm, bảo dưỡng, khấu hao mạng'),
    box('Thu tiền', 'Thuê bao trả tiền × ARPU', 'trả trước, trả sau; thoại, SMS, data'), box('Biến số biên & dòng tiền', 'ARPU, CAPEX mạng, dòng tiền sau đầu tư')])],
    'nhà mạng chưa niêm yết (Viettel, VNPT, MobiFone); dịch vụ: ' + ['MFS', 'TTN', 'VTC', 'ABC'].map(x => tk(x)).join(' '), go('Di động & 5G', 'mt2:mobile'), srcLine(MECH()))],
    'Hiệu quả do số thuê bao trả tiền, ARPU, CAPEX mạng (phổ tần, trạm 5G) và dòng tiền còn lại sau đầu tư quyết định. ARPU chưa có số công bố cùng phạm vi; nhà mạng di động trong nước chưa niêm yết nên chưa có BCTC để đối chiếu CAPEX và dòng tiền.'));
  const fm = F ? ttm('FOX', 'gross') / ttm('FOX', 'revenue') * 100 : null, fc = F ? ttm('FOX', 'capex') / ttm('FOX', 'revenue') * 100 : null;
  p.append(qpanel('1.2', 'Internet cố định: tiền đầu tư vào đâu và thu về thế nào?', [model('vt-ov-m-fixed', 'Internet cố định', [row([
    box('Đầu tư · đầu vào', 'Kéo cáp quang tới khu vực, thiết bị đầu cuối, lắp đặt'), box('Vận hành', 'Bảo trì mạng, chăm sóc khách hàng, nội dung truyền hình'),
    box('Thu tiền', 'Thuê bao trả tiền × giá thực thu', 'gói theo tốc độ, phí lắp đặt'), box('Biến số biên & dòng tiền', 'Thuê bao trên vùng đã kéo cáp, giá thực thu, chi phí kết nối thuê bao mới')])],
    tk('FOX'), go('Internet cố định', 'mt2:fixed'), srcLine([srcBy(/BCTN FPT 2025/), srcBy(/BCTN FPT 2023/)], FIN_SRC))],
    `Hiệu quả do số thuê bao trả tiền trên vùng đã kéo cáp, giá thực thu (khác giá niêm yết do khuyến mại) và chi phí kết nối một thuê bao mới quyết định.${fin(fm) ? ` FOX TTM ${LQ()}: biên gộp ${nf(fm, 1)}%, CAPEX bằng ${nf(fc, 1)}% doanh thu (BCTC hợp nhất FOX, gồm cả truyền hình, quảng cáo trực tuyến).` : ''}`));
  const tw = lastPt('ctr_towers'), tn = lastPt('ctr_tenancy'), ct = lastPt('ctr_cotenant');
  p.append(qpanel('1.3', 'Cho thuê hạ tầng: tiền đến từ đâu?', [model('vt-ov-m-infra', 'Cho thuê hạ tầng trạm · hợp đồng dài hạn', [row([
    box('Đầu tư', 'Xây trạm, cột, nhà trạm'), box('Vận hành', 'Thuê đất, điện, bảo trì'), box('Thu tiền', 'Vị trí có khách thuê × số khách thuê/vị trí × giá thuê'), box('Biến số', 'Khách thuê trên vị trí, chi phí vận hành', gmY('ctr_gm_infra') ? 'biên gộp CTR ' + gmY('ctr_gm_infra') : '')])],
    tk('CTR'), go('TowerCo & hạ tầng', 'mt2:tower'), srcLine(seriesSrc(['ctr_towers', 'ctr_tenancy', 'ctr_gm_infra'])))],
    `Hiệu quả do số vị trí có khách thuê, số khách thuê trên mỗi vị trí và chi phí vận hành quyết định: thêm khách thuê trên vị trí sẵn có tăng doanh thu mà không cần xây thêm.${tw ? ` CTR: ${nf(tw[1], 0)} vị trí sở hữu (${per(tw[0])})` : ''}${ct ? `, ${nf(ct[1], 0)} vị trí có từ 2 nhà mạng thuê (${per(ct[0])})` : ''}${tn ? `, ${nf(tn[1], 2)} khách thuê/vị trí (${per(tn[0])})` : ''}${gmY('ctr_gm_infra') ? `; biên gộp mảng cho thuê ${gmY('ctr_gm_infra')}` : ''}.`));
  const b = lastY('ctr_rev_build'), o = lastY('ctr_rev_om');
  const E = FE(), rec = F ? stk('CTR', 'receivables') : null, dso = E && F ? E.ratio({m: 'receivables', avg: true}, {m: 'revenue'}, ['CTR'], 'ttm', 365).values[F.periods.length - 1] : null;
  p.append(qpanel('1.4', 'Xây lắp và vận hành: doanh thu ghi nhận và thu tiền thế nào?', [model('vt-ov-m-build', 'Xây lắp · vận hành khai thác', [
    '<div class="vt-sub">Xây lắp · theo dự án</div>' + row([box('Đầu vào', 'Nhân công, vật tư, thiết bị'), box('Thực hiện', 'Thi công cho nhà mạng, khách hàng doanh nghiệp'), box('Ghi nhận', 'Theo tiến độ, nghiệm thu'), box('Biến số', 'CAPEX nhà mạng, công nợ', gmY('ctr_gm_build') ? 'biên gộp CTR ' + gmY('ctr_gm_build') : '')]),
    '<div class="vt-sub">Vận hành khai thác · hợp đồng dịch vụ</div>' + row([box('Đầu vào', 'Nhân sự kỹ thuật'), box('Thực hiện', 'Bảo dưỡng mạng thay nhà mạng'), box('Ghi nhận', 'Phí dịch vụ định kỳ'), box('Biến số', 'Số trạm phục vụ, đơn giá', gmY('ctr_gm_om') ? 'biên gộp CTR ' + gmY('ctr_gm_om') : '')])],
    `${tk('CTR')} · ${tk('MFS')} · thiết bị: ${['ELC', 'POT', 'ICT'].map(x => tk(x)).join(' ')}`, go('TowerCo & hạ tầng', 'mt2:tower:rev'), srcLine(seriesSrc(['ctr_rev_build', 'ctr_rev_om', 'ctr_gm_build', 'ctr_gm_om']), FIN_SRC))],
    `Xây lắp ghi nhận doanh thu theo tiến độ, nghiệm thu dự án; vận hành khai thác thu phí dịch vụ định kỳ.${b && o ? ` CTR năm ${b.y}: xây lắp ${nf(b.v, 0)} tỷ đồng, vận hành khai thác ${nf(o.v, 0)} tỷ đồng.` : ''}${fin(rec) ? ` Thu tiền: phải thu khách hàng của CTR ${nf(rec, 0)} tỷ đồng cuối ${LQ()}${fin(dso) ? `, tương đương ${nf(dso, 0)} ngày doanh thu TTM` : ''} (toàn công ty, chưa tách theo mảng).` : ''}`));
}
function outlookPane(p) {
  const rows = (T.outlook || []).filter(o => o.date >= TODAY || o.open);
  const when = o => o.kind === 'license' ? `${dmy(o.date)}<br><small>tính từ ngày trúng đấu giá ${dmy(o.issued)}</small>` : (o.kind === 'target' || o.kind === 'plan') && /-12-31$/.test(o.date) ? `Cuối năm ${o.date.slice(0, 4)}<br><small>kỳ mục tiêu</small>` : o.open && o.date < TODAY ? `${dmy(o.date)}<br><small>chưa có văn bản chính thức</small>` : dmy(o.date);
  const t = tableCard('vt-ov-outlook', 'Mốc phía trước đã có nguồn', ['Kỳ / hạn', 'Mốc', 'Trạng thái', 'Bên chịu tác động', 'Dòng mô hình chịu tác động', 'Chi tiết', 'Dữ liệu cần quan sát'],
    rows.map(o => [when(o), `<b>${esc(o.title)}</b>${o.measure ? `<br><small>Định nghĩa: ${esc(o.measure)}</small>` : ''}${o.progress ? `<br><small>${esc(o.progress)}</small>` : ''}`, esc(o.status), esc(o.parties || '—'), esc(o.variable), esc(o.detail || ''), esc(o.watch)]),
    rows.map(o => o.src), 'Hạn nghĩa vụ = ngày trúng đấu giá + thời hạn trong giấy phép (tự tính; nguồn chưa nêu ngày cấp giấy phép, hạn thực tế có thể muộn hơn); mục tiêu, kế hoạch là số doanh nghiệp/cơ quan công bố, chưa phải thực hiện; tiến độ chỉ ghi khi số thực hiện cùng định nghĩa với mục tiêu');
  const b5 = stations5g().at(-1), tw = lastPt('ctr_towers');
  const checks = el('div', 'card vt-checks'); checks.dataset.blockId = 'vt-ov-checks'; checks.dataset.updateKind = 'manual'; checks.dataset.cadence = 'quarterly'; checks.dataset.refreshStatus = 'snapshot';
  checks.innerHTML = `<div class="chart-title">Ba điểm kiểm chứng</div><ol class="vt-ol">
    <li><b>Tiến độ triển khai mạng</b>: số trạm 5G toàn quốc (gần nhất ${b5 ? `${nf(b5.v, 0)} trạm, ${dmy(b5.date)}` : '—'}) và số BTS băng 900 MHz theo nhà mạng. Bộ KH&CN công bố theo đợt, thường sau mỗi quý. Dòng mô hình: CAPEX nhà mạng; doanh thu xây lắp của CTR.</li>
    <li><b>Kết quả xây lắp và cho thuê của CTR</b>: số vị trí sở hữu (gần nhất ${tw ? `${nf(tw[1], 0)}, ${per(tw[0])}` : '—'}), khách thuê trên vị trí, doanh thu xây lắp và hạ tầng cho thuê. CTR công bố kết quả tháng và BCTC quý (quý 4/2026 vào cuối tháng 1/2027). Dòng mô hình: doanh thu, biên gộp CTR.</li>
    <li><b>ARPU hoặc doanh thu dịch vụ di động cùng kỳ với thuê bao 5G</b>: chưa có nguồn công bố định kỳ; doanh thu hoạt động viễn thông của Cục Thống kê có theo quý nhưng không tách di động. Dòng mô hình: doanh thu nhà mạng; giả định tăng ARPU nhờ 5G.</li></ol>`;
  checks.append(el('div', 'pw-src', srcLine([b5?.src, tw?.[3]])));
  p.append(qpanel('2.1', 'Mốc nào phía trước có thể làm thay đổi số trạm, CAPEX và doanh thu?', [checks, t],
    `Nhà mạng đầu tư trạm 5G và băng 900 MHz (sau khi tắt 2G) → khả năng thu thêm tiền thể hiện ở ARPU, doanh thu dịch vụ khi vùng phủ đủ rộng → <b>CTR</b> ghi nhận ở doanh thu xây lắp và cho thuê hạ tầng, <b>FOX</b> ở doanh thu và CAPEX Internet cố định, <b>VGI</b> ở doanh thu các thị trường nước ngoài. Căn cứ, điều khoản ở ${go('Chính sách', 'mt2:policy')}; diễn biến mới ở ${go('Chủ đề nóng', 'mt7')}.`));
}
/* ================= Bức tranh ngành ================= */
const REVN = 'Doanh thu Cục Thống kê: số ước tính lần đầu mỗi năm, từ 2021 sau đợt điều chỉnh số 2020';
function leadMarket() {
  const fx = lastY('fix_bb'), mb = lastY('mob_subs'), pop = yearly('pop'), fg = fx ? ch(fx.v, fx.pv) : null, mg = mb ? ch(mb.v, mb.pv) : null, pen = mb && pop.get(mb.y) ? mb.v / pop.get(mb.y) * 100 : null;
  return [fx && `Internet cố định còn tăng về số lượng: <b>${nf(fx.v, 1)} triệu</b> thuê bao cuối ${fx.y}${fin(fg) ? `, <b>${sg(fg)}%</b> so cuối ${fx.py}` : ''}.`,
    mb && `Di động: ${nf(mb.v, 1)} triệu thuê bao cuối ${mb.y}${fin(mg) ? ` (${sg(mg)}% so cuối ${mb.py})` : ''}${fin(pen) ? `, khoảng ${nf(pen, 0)} SIM/100 dân` : ''}: số lượng gần bão hòa nên cần nhìn doanh thu trên mỗi thuê bao — số này chưa có nguồn công bố sau 2018.`,
    'Doanh thu là số ước tính lần đầu của Cục Thống kê, không cùng kỳ quan sát với thuê bao cuối năm.'].filter(Boolean).join(' ');
}
function marketPane(p) {
  const K = [['rev', 'Doanh thu hoạt động viễn thông'], ['mob_subs', 'Thuê bao di động'], ['fix_bb', 'Thuê bao băng rộng cố định']].filter(([k]) => has(k));
  const a = align(K.map(x => x[0])), ix = index100(a.vals);
  const c1 = ix.base >= 0 ? chartCard({id: 'vt-gr-index', title: `Doanh thu và thuê bao, chỉ số ${a.cats[ix.base]} = 100`, sub: 'Thuê bao: cuối năm · doanh thu: cả năm', cats: a.cats, series: K.map(([k, n], i) => ({name: n, color: COL[i], values: ix.vals[i]})), unit: 'điểm', digits: 1, zeroBase: false, src: seriesSrc(K.map(x => x[0])), cadence: 'yearly', note: REVN}) : null;
  const c2 = chartCard({id: 'vt-gr-yoy', title: 'Tăng trưởng so với năm trước (%)', cats: a.cats, series: K.map(([k, n], i) => ({name: n, color: COL[i], values: yoy(a.vals[i])})), unit: '%', digits: 1, zeroBase: false, src: seriesSrc(K.map(x => x[0])), cadence: 'yearly', note: REVN});
  const rv = align(['rev', 'rev_mic']);
  const c3 = has('rev_mic') ? chartCard({id: 'vt-gr-revdef', title: 'Hai cách đo doanh thu viễn thông (nghìn tỷ đồng)', sub: 'Cục Thống kê: doanh thu hoạt động viễn thông · Bộ TT&TT/Bộ KH&CN: doanh thu dịch vụ viễn thông', cats: rv.cats, series: [{name: 'Doanh thu hoạt động viễn thông (Cục Thống kê)', color: COL[0], values: rv.vals[0], kind: 'bar'}, {name: 'Doanh thu dịch vụ viễn thông (Bộ)', color: COL[2], values: rv.vals[1], kind: 'bar'}], unit: 'nghìn tỷ đ', digits: 1, native: 'bar', src: seriesSrc(['rev', 'rev_mic']), cadence: 'yearly', note: 'Hai phạm vi khác nhau, giữ hai chuỗi riêng, không cộng hay so trực tiếp'}) : null;
  const N = [['mob_subs', 'Di động'], ['mob_bb', 'Băng rộng di động'], ['fix_bb', 'Băng rộng cố định']].filter(([k]) => has(k)), b = align(N.map(x => x[0]));
  const c4 = chartCard({id: 'vt-gr-netadd', title: 'Thuê bao tăng thêm ròng trong năm (triệu thuê bao)', sub: 'Chênh lệch thuê bao cuối năm, chỉ tính khi có số hai năm liền kề', cats: b.cats, series: N.map(([k, n], i) => ({name: n, color: COL[i], values: diff(b.vals[i]), kind: 'bar'})), unit: 'triệu', digits: 2, native: 'bar', src: seriesSrc(N.map(x => x[0])), cadence: 'yearly', note: 'Năm 2018 và 2024–2026 có đợt khóa thuê bao không chính chủ, dừng 2G'});
  const pop = yearly('pop'), hh = yearly('hh');
  const pen = [['mob_subs', 'Thuê bao di động / 100 dân', pop], ['mob_bb', 'Băng rộng di động / 100 dân', pop], ['fix_bb', 'Băng rộng cố định / 100 hộ', hh]].filter(([k, , d]) => has(k) && d.size);
  const cs = [...new Set(pen.flatMap(([k]) => [...yearly(k).keys()]))].sort();
  const c5 = chartCard({id: 'vt-gr-pen', title: 'Mức thâm nhập dịch vụ', sub: 'Thuê bao cuối năm ÷ dân số hoặc số hộ (tự tính)', cats: cs, series: pen.map(([k, n, d], i) => ({name: n, color: COL[i], values: cs.map(y => { const v = yearly(k).get(y), dd = d.get(y); return fin(v) && fin(dd) && dd ? v / dd * 100 : null; })})), unit: 'thuê bao', digits: 1, zeroBase: false, src: seriesSrc([...pen.map(x => x[0]), 'pop', 'hh']), cadence: 'yearly', note: 'Tự tính; thuê bao di động tính theo SIM'});
  const bm = window.TELECOM_BENCH; let c6 = null;
  if (bm?.series?.mobile_per100) { const s = bm.series.mobile_per100, ys = [...new Set(Object.values(s.data).flatMap(Object.keys))].sort().filter(y => y >= '2015');
    c6 = chartCard({id: 'vt-gr-bench', title: 'Thuê bao di động trên 100 dân: Việt Nam và ASEAN', cats: ys, series: Object.entries(bm.countries).map(([c, n], i) => ({name: n, color: c === 'VNM' ? '#C8394B' : COL[i], values: ys.map(y => s.data[c]?.[y] ?? null)})), unit: 'thuê bao/100 dân', digits: 1, zeroBase: false, extraSrc: WB('IT.CEL.SETS.P2'), cadence: 'yearly', note: 'Cùng định nghĩa ITU cho mọi nước'}); }
  const ru = align(['rev_mobile_usd', 'rev_fixed_usd']);
  const c7 = has('rev_mobile_usd') ? chartCard({id: 'vt-gr-revmix', title: 'Doanh thu dịch vụ viễn thông theo phân khúc (triệu USD)', cats: ru.cats, series: [{name: 'Di động mặt đất', color: COL[0], values: ru.vals[0], kind: 'bar'}, {name: 'Cố định mặt đất', color: COL[2], values: ru.vals[1], kind: 'bar'}], unit: 'triệu USD', digits: 0, native: 'stack', stackable: true, src: seriesSrc(['rev_mobile_usd', 'rev_fixed_usd']), cadence: 'yearly', note: 'Sách Trắng CNTT-TT; sau 2018 không công bố tách phân khúc'}) : null;
  const conc = (m, name) => Object.keys(m).sort().map(y => { const e = Object.entries(m[y]), named = e.filter(([o]) => o !== 'Khác').map(x => x[1]).sort((x, z) => z - x), other = m[y]['Khác'], tot = e.reduce((x, [, v]) => x + v, 0);
    return [name, y, nf(named.slice(0, 3).reduce((x, z) => x + z, 0), 1) + '%', nf(named.reduce((x, z) => x + z * z, 0), 0), `${named.length} doanh nghiệp có tên${fin(other) ? ` + nhóm "Khác" ${nf(other, 1)}%` : ''}; tổng ${nf(tot, 1)}%`]; });
  const c8 = tableCard('vt-cp-hhi', 'Mức tập trung thị trường', ['Thị trường', 'Năm', 'CR3', 'HHI', 'Độ phủ dữ liệu'], [...conc(T.shares?.mobile || {}, 'Thuê bao di động'), ...conc(T.shares?.fixed || {}, 'Thuê bao băng rộng cố định')], [...(T.shares?.mobile_src || []), ...(T.shares?.fixed_src || [])], 'CR3 = tổng thị phần 3 doanh nghiệp lớn nhất; HHI = tổng bình phương thị phần (%), chỉ tính doanh nghiệp có tên, không tính nhóm "Khác"');
  const R = [['op_rev_viettel', 'Viettel'], ['op_rev_vnpt', 'VNPT'], ['op_rev_mobifone', 'MobiFone']].filter(([k]) => has(k)), ra = align(R.map(x => x[0]));
  const c9 = R.length ? chartCard({id: 'vt-cp-rev', title: 'Doanh thu của các tập đoàn viễn thông (nghìn tỷ đồng)', sub: 'Phạm vi báo cáo khác nhau giữa các doanh nghiệp', cats: ra.cats, series: R.map(([k, n], i) => ({name: n, color: OPC[n] || COL[i], values: ra.vals[i].map(v => fin(v) ? v / 1000 : null), kind: 'bar'})), unit: 'nghìn tỷ đ', digits: 1, native: 'bar', src: seriesSrc(R.map(x => x[0])), cadence: 'yearly', note: R.map(([k, n]) => `${n}: ${S(k).label}`).join('; '), status: statusOf(R.map(x => x[0]))}) : null;
  const P = [['op_profit_viettel', 'Viettel'], ['op_profit_vnpt', 'VNPT'], ['op_profit_mobifone', 'MobiFone']].filter(([k]) => has(k)), pa = align(P.map(x => x[0]));
  const c10 = P.length ? chartCard({id: 'vt-cp-profit', title: 'Lợi nhuận trước thuế của các tập đoàn viễn thông (nghìn tỷ đồng)', cats: pa.cats, series: P.map(([k, n], i) => ({name: n, color: OPC[n] || COL[i], values: pa.vals[i].map(v => fin(v) ? v / 1000 : null), kind: 'bar'})), unit: 'nghìn tỷ đ', digits: 1, native: 'bar', src: seriesSrc(P.map(x => x[0])), cadence: 'yearly', note: P.map(([k, n]) => `${n}: ${S(k).label}`).join('; '), status: statusOf(P.map(x => x[0]))}) : null;
  stages(p, 'mt2', 'market', [
    ['size', 'Quy mô', 'Quy mô & tăng trưởng', [qpanel('1.1', 'Doanh thu ngành tăng nhanh hay chậm hơn số thuê bao?', [c1, c2], leadMarket()), qpanel('1.2', 'Hai cách đo doanh thu ngành khác nhau thế nào?', [c3], 'Dùng chuỗi <b>doanh thu hoạt động viễn thông</b> của Cục Thống kê (phạm vi rộng, có số quý) để theo dõi tốc độ tăng của cả ngành; dùng chuỗi <b>doanh thu dịch vụ viễn thông</b> của Bộ TT&TT/Bộ KH&CN khi đặt cạnh thuê bao hoặc doanh thu theo dịch vụ. Hai chuỗi khác phạm vi, giữ riêng, không ghép.')]],
    ['subs', 'Khách hàng', 'Thuê bao mới & mức thâm nhập', [qpanel('1.3', 'Tăng trưởng thuê bao đang tăng tốc hay giảm tốc?', [c4], 'Số thuê bao di động là số SIM ghi nhận. Các đợt khóa SIM không chính chủ, xác thực sinh trắc (2026), dừng 2G và thay đổi cách đếm có thể làm số SIM tăng, giảm mà không phản ánh khách hàng mới hay mất đi; nguồn chưa tách phần này nên không quy nguyên nhân cho từng năm.'), qpanel('1.4', 'Phân khúc nào còn dư địa mở rộng số khách hàng?', [c5, c6])]],
    ['mix', 'Cơ cấu', 'Cơ cấu doanh thu', [qpanel('1.5', 'Doanh thu đến từ di động hay cố định?', [c7])]],
    ['compete', 'Cạnh tranh', 'Cấu trúc cạnh tranh', [qpanel('1.6', 'Thị trường tập trung đến mức nào, quy mô các nhà mạng ra sao?', [c8, c9, c10], `Thị phần chi tiết: ${go('Di động', 'mt2:mobile:share')} ${go('Internet cố định', 'mt2:fixed:price')}`)]]
  ]);
}
function mobilePane(p) {
  p.append(el('p', 'vt-sublead', 'Hai khả năng cần phân biệt: thuê bao chuyển từ 4G sang 5G với cùng mức chi tiêu, hay nhà mạng thu thêm tiền trên mỗi thuê bao. Số thuê bao 5G và số trạm chỉ cho biết mức chuyển đổi và độ phủ; chỉ ARPU hoặc doanh thu dịch vụ di động cùng kỳ mới phân biệt được hai khả năng — hiện chưa có nguồn công bố định kỳ.'));
  // Chart giá trúng đấu giá tần số (2.1) bỏ 26/11/2026 theo yêu cầu người dùng; bảng đấu giá đầy đủ ở Chính sách.
  const st = stations5g();
  const c2 = chartCard({id: 'vt-5g-stations', title: 'Số trạm 5G toàn quốc (trạm, thực tế)', cats: st.map(x => x.k), series: [{name: 'Trạm 5G', color: COL[2], values: st.map(x => x.v), kind: 'bar'}], unit: 'trạm', digits: 0, native: 'bar', src: st.map(x => x.src), cadence: 'on-data-change', note: 'Mỗi tháng một mốc công bố; mục tiêu không vẽ vào chuỗi thực tế'});
  const ops = FG.filter(x => x.operator !== 'Toàn quốc' && ['launch', 'stations', 'subscribers'].includes(x.event) && x.status === 'actual').sort((a, b) => a.date.localeCompare(b.date));
  const tgt = FG.filter(x => x.operator !== 'Toàn quốc' && x.status === 'target').sort((a, b) => a.date.localeCompare(b.date));
  const LBL = {launch: 'Khai trương', stations: 'Số trạm', subscribers: 'Thuê bao', target: 'Mục tiêu'};
  const val = x => fin(x.value) ? `${nf(x.value, x.value < 100 ? 1 : 0)} ${esc(x.unit)}` : '—';
  const c3 = tableCard('vt-5g-ops', 'Tiến độ 5G theo nhà mạng: số thực tế đã công bố', ['Ngày', 'Nhà mạng', 'Loại', 'Giá trị', 'Nội dung'], ops.map(x => [dmy(x.date), esc(x.operator), LBL[x.event], val(x), esc(x.text)]), ops.map(x => x.src));
  const c4 = tableCard('vt-5g-targets', 'Mục tiêu 5G theo nhà mạng (kế hoạch)', ['Hạn', 'Nhà mạng', 'Mục tiêu', 'Nội dung'], tgt.map(x => [dmy(x.date), esc(x.operator), val(x), esc(x.text)]), tgt.map(x => x.src), 'Mục tiêu, kế hoạch tách khỏi số thực tế');
  const s5 = subs5g();
  const c5 = chartCard({id: 'vt-5g-subs', title: 'Thuê bao 5G toàn quốc (triệu thuê bao)', cats: s5.map(x => x.k), series: [{name: 'Thuê bao 5G', color: COL[0], values: s5.map(x => x.v), kind: 'bar'}], unit: 'triệu', digits: 1, native: 'bar', src: s5.map(x => x.src), cadence: 'on-data-change'});
  // Tỷ lệ 5G / băng rộng di động: mẫu số cùng tháng nếu có; nếu không, ghi kỳ mẫu số và đánh dấu "tham chiếu".
  const mbb = (S('mob_bb')?.points || []).filter(x => fin(x[1]));
  const shareRows = s5.map(x => { const same = mbb.find(m => m[0].slice(0, 7) === x.k), near = same || [...mbb].reverse().find(m => m[0] <= x.date) || null;
    return [dmy(x.date), nf(x.v, 1), near ? nf(near[1], 1) : '—', near ? per(near[0]) : '—', near ? nf(x.v / near[1] * 100, 1) + '%' + (same ? '' : ' <small>(tham chiếu)</small>') : '—']; });
  const allRef = shareRows.every(r => /tham chiếu/.test(r[4]));
  const c6 = tableCard('vt-5g-share', 'Thuê bao 5G so với thuê bao băng rộng di động', ['Thời điểm', 'Thuê bao 5G (triệu)', 'Băng rộng di động (triệu)', 'Kỳ mẫu số', 'Tỷ lệ'], shareRows, [...s5.map(x => x.src), ...seriesSrc(['mob_bb'])], null, allRef ? 'Tất cả tỷ lệ là số tham chiếu: mẫu số (thuê bao băng rộng di động) khác kỳ với tử số, không dùng để đọc xu hướng.' : 'Dòng ghi "tham chiếu": mẫu số khác kỳ với tử số; chỉ đọc xu hướng từ các dòng có tử, mẫu cùng kỳ.');
  const sh = align(['mob_data_users', 'mob_traffic_subs'], exact);
  const c7 = has('mob_data_users', 'mob_traffic_subs') ? chartCard({id: 'vt-data-share', title: 'Tỷ lệ thuê bao di động có dùng data (%)', sub: 'Thuê bao có dùng dữ liệu ÷ thuê bao phát sinh lưu lượng, cùng nguồn Bộ TT&TT', cats: sh.cats, series: [{name: 'Thuê bao dùng data / thuê bao phát sinh lưu lượng', color: COL[0], values: sh.cats.map((_, i) => fin(sh.vals[0][i]) && fin(sh.vals[1][i]) ? sh.vals[0][i] / sh.vals[1][i] * 100 : null), kind: 'bar'}], unit: '%', digits: 1, native: 'bar', src: seriesSrc(['mob_data_users', 'mob_traffic_subs']), cadence: 'on-data-change', note: 'Tự tính'}) : null;
  const pr = (T.prices || []).filter(x => x.segment === 'mobile').sort((a, b) => a.date.localeCompare(b.date));
  const cond = x => [/trả sau/i.test(x.package) ? 'trả sau' : /trả trước/i.test(x.package) ? 'trả trước' : '', /chọn lọc/i.test(x.package) ? 'đối tượng chọn lọc' : '', /5G/.test(x.package) ? 'gói 5G' : /4G/.test(x.package) ? 'gói 4G' : '', /miễn phí/i.test(x.speed_or_quota) ? 'kèm ưu đãi' : ''].filter(Boolean).join(' · ');
  const c8 = tableCard('vt-data-prices', 'Gói cước di động · giá niêm yết tại thời điểm quan sát', ['Ngày quan sát', 'Nhà mạng', 'Gói', 'Dung lượng', 'Điều kiện', 'Giá (đồng/tháng)'], pr.map(x => [dmy(x.date), esc(x.operator), esc(x.package.replace(/\s*\([^)]*\)/, '')), esc(x.speed_or_quota), esc(cond(x)), nf(x.price_vnd_month)]), pr.map(x => x.src), 'Giá niêm yết, không phải ARPU; khả năng so sánh phụ thuộc trả trước/trả sau, dung lượng, đối tượng và ưu đãi — chỉ so các dòng cùng điều kiện');
  // Chỉ giai đoạn hai chuỗi cùng có số (doanh thu di động theo Sách Trắng có đến 2018).
  const DM = [['rev_mobile_usd', 'Doanh thu dịch vụ di động (USD)'], ['mob_data_users', 'Thuê bao di động có dùng data']].filter(([k]) => has(k)), dm0 = align(DM.map(x => x[0]));
  const keep = dm0.cats.map((_, i) => dm0.vals.every(v => fin(v[i]))), dm = {cats: dm0.cats.filter((_, i) => keep[i]), vals: dm0.vals.map(v => v.filter((_, i) => keep[i]))}, dmi = index100(dm.vals);
  const yr = dm.cats.length ? `${dm.cats[0]}–${dm.cats.at(-1)}` : '';
  const c9 = dmi.base >= 0 && dm.cats.length > 1 ? chartCard({id: 'vt-data-users-rev', title: `Đối chiếu lịch sử ${yr}: thuê bao dùng data và doanh thu dịch vụ di động (chỉ số ${dm.cats[0]} = 100)`, cats: dm.cats, series: DM.map(([k, n], i) => ({name: n, color: COL[i], values: dmi.vals[i]})), unit: 'điểm', digits: 0, zeroBase: false, src: seriesSrc(DM.map(x => x[0])), cadence: 'yearly', note: 'Chỉ giai đoạn hai chuỗi cùng có số; doanh thu di động theo phân khúc không được công bố sau 2018'}) : null;
  const dmLead = dm.cats.length > 1 ? `Giai đoạn ${yr}: thuê bao dùng data ${sg(ch(dm.vals[1].at(-1), dm.vals[1][0]), 0)}%, doanh thu dịch vụ di động ${sg(ch(dm.vals[0].at(-1), dm.vals[0][0]), 0)}% (tính bằng USD, chịu ảnh hưởng tỷ giá). Đây là đối chiếu lịch sử; tác động của 5G lên ARPU cần doanh thu di động sau 2018, hiện chưa có nguồn công bố cùng phạm vi.` : '';
  const ms = T.shares?.mobile || {}, yrs = Object.keys(ms).sort(), opsN = [...new Set(yrs.flatMap(y => Object.keys(ms[y])))];
  const c10 = yrs.length ? chartCard({id: 'vt-cp-mob', title: 'Thị phần thuê bao di động (%)', cats: yrs, series: opsN.map((o, i) => ({name: o, color: OPC[o] || COL[i], values: yrs.map(y => ms[y][o] ?? null), kind: 'bar'})), unit: '%', digits: 1, native: 'stack', stackable: true, src: T.shares?.mobile_src || [], min: 1, cadence: 'yearly', note: 'Sách Trắng CNTT-TT; chỉ năm có đủ các nhà mạng'}) : null;
  const SH = T.shares || {};
  const rowsSR = Object.keys(SH.mobile_rev || {}).flatMap(y => Object.keys(SH.mobile_rev[y]).map(o => [y, esc(o), fin(SH.mobile?.[y]?.[o]) ? nf(SH.mobile[y][o], 1) + '%' : '—', fin(SH.mbb?.[y]?.[o]) ? nf(SH.mbb[y][o], 1) + '%' : '—', nf(SH.mobile_rev[y][o], 1) + '%']));
  const c11 = tableCard('vt-cp-subrev-mob', 'Di động: thị phần thuê bao so với thị phần doanh thu', ['Năm', 'Nhà mạng', 'Thuê bao di động', 'Thuê bao băng rộng di động', 'Doanh thu di động'], rowsSR, [...(SH.mobile_rev_src || []), ...(SH.mbb_src || [])], 'Năm gần nhất có cả ba chỉ tiêu (Sách Trắng CNTT-TT)');
  stages(p, 'mt2', 'mobile', [
    ['network', 'Đầu tư', 'Đầu tư & năng lực mạng', [qpanel('2.1', 'Số trạm 5G tăng thế nào, từng nhà mạng ở đâu so với mục tiêu?', [c2, c3, c4], st.length ? `Số thực hiện: <b>${nf(st.at(-1).v, 0)} trạm 5G</b> toàn quốc ngày ${dmy(st.at(-1).date)}. Bảng tiến độ ghi số trạm, thuê bao đã công bố; bảng mục tiêu tách riêng vì khác định nghĩa (trạm xây thêm trong năm, tổng vị trí trạm, độ phủ theo dân số) — không tính tỷ lệ hoàn thành khi khác định nghĩa.` : '')]],
    ['usage', 'Sử dụng', 'Thuê bao & người dùng data', [qpanel('2.2', 'Thuê bao 5G tăng ra sao, chiếm bao nhiêu trong băng rộng di động?', [c5, c6], allRef ? 'Các tỷ lệ 5G trên băng rộng di động hiện đều là số tham chiếu (mẫu số khác kỳ), chưa đủ để đọc xu hướng thâm nhập 5G.' : ''), qpanel('2.3', 'Bao nhiêu thuê bao di động dùng data?', [c7])]],
    ['commercial', 'Thương mại hóa', 'Gói cước & doanh thu di động', [qpanel('2.4', 'Gói data niêm yết ở mức nào?', [c8]), qpanel('2.5', `Giai đoạn ${yr || 'trước 5G'}: người dùng data tăng có đi kèm doanh thu di động không?`, [c9], dmLead)]],
    ['share', 'Thị phần', 'Thị phần di động', [qpanel('2.6', 'Nhà mạng nào chiếm bao nhiêu thuê bao và doanh thu di động?', [c10, c11])]]
  ]);
}
function leadFixedDef() {
  const hp = lastY('ftth_hh_pct');
  return `Ba cách đo khác nhau: <b>thuê bao/100 dân</b> (ITU, dùng để so quốc tế); <b>số thuê bao ÷ số hộ</b> (tự tính, thuê bao gồm cả doanh nghiệp nên cao hơn tỷ lệ hộ thực có kết nối); <b>tỷ lệ hộ dùng cáp quang</b> (Bộ KH&CN công bố${hp ? `, ${nf(hp.v, 1)}% năm ${hp.y}` : ''}). Nguồn chưa công bố số hộ có khả năng kết nối (vùng đã kéo cáp).`;
}
function leadAsean() {
  const s = window.TELECOM_BENCH?.series?.fixed_bb_per100; if (!s) return '';
  const last = c => { const e = Object.entries(s.data[c] || {}); return e.at(-1); }, vn = last('VNM'); if (!vn) return '';
  const others = Object.keys(TELECOM_BENCH.countries).filter(c => c !== 'VNM').map(c => [c, last(c)]).filter(x => x[1] && x[1][0] === vn[0]);
  const top = others.every(([, v]) => v[1] < vn[1]);
  return `Việt Nam đạt <b>${nf(vn[1], 1)} thuê bao/100 dân</b> năm ${vn[0]}${others.length ? (top ? `, cao hơn ${others.length} nước còn lại trong mẫu cùng năm` : '') + ` (${others.map(([c, v]) => `${TELECOM_BENCH.countries[c]} ${nf(v[1], 1)}`).join(', ')})` : ''}. Câu hỏi tiếp theo: tăng trưởng đến từ hộ mới kết nối, nâng gói tốc độ hay giành thị phần — cần thuê bao mới ròng theo nhà mạng, cơ cấu gói và ARPU.`;
}
function leadFixedPrice() {
  const area = t => /nội thành/i.test(t) ? 'nội thành Hà Nội, TP.HCM' : /ngoại thành|tỉnh/i.test(t) ? 'ngoại thành/tỉnh' : '';
  const pr = (T.prices || []).filter(x => x.segment === 'fixed'), last = pr.map(x => x.date.slice(0, 7)).sort().at(-1);
  const g = pr.filter(x => x.date.startsWith(last) && area(x.package) === 'ngoại thành/tỉnh'), sp = [...new Set(g.map(x => x.speed_or_quota))];
  if (!g.length || sp.length !== 1) return '';
  const v = g.map(x => x.price_vnd_month);
  return `Gói ${sp[0]} ngoại thành/tỉnh cho khách lắp mới, tháng ${+last.slice(5)}/${last.slice(0, 4)}: <b>${nf(Math.min(...v) / 1000, 0)}–${nf(Math.max(...v) / 1000, 0)} nghìn đồng/tháng</b> (${g.map(x => `${x.operator} ${nf(x.price_vnd_month / 1000, 0)}`).join(', ')}). Giá niêm yết chưa gồm phí lắp đặt và khuyến mại; khách hiện hữu giữ giá theo hợp đồng.`;
}
function leadFox() {
  const fr = finYear('FOX', 'revenue'), ys = [...fr.keys()].sort(), y = ys.at(-1), fx = yearly('fix_bb');
  const g = y && fr.get(String(+y - 1)) ? ch(fr.get(y), fr.get(String(+y - 1))) : null, gm = fx.get(y) && fx.get(String(+y - 1)) ? ch(fx.get(y), fx.get(String(+y - 1))) : null;
  return `Ba chuỗi khác phạm vi: <b>doanh thu thuần FOX hợp nhất</b> (BCTC FOX, gồm truyền hình, quảng cáo trực tuyến FPT Online, trung tâm dữ liệu), <b>mảng Dịch vụ viễn thông</b> và <b>doanh thu băng rộng</b> do FPT công bố.${fin(g) && fin(gm) ? ` Năm ${y}: doanh thu FOX hợp nhất ${sg(g)}%, thuê bao băng rộng cố định toàn thị trường ${sg(gm)}%.` : ''} Chênh lệch này chưa đủ để kết luận FOX giành thị phần: doanh thu FOX gồm cả mảng ngoài Internet và có thể tăng nhờ giá, nâng gói; cần số thuê bao FOX và thị phần cùng kỳ. Từ 01/01/2026 FPT ghi nhận FOX theo phương pháp vốn chủ sở hữu; chuỗi FOX ở đây lấy từ BCTC của chính FOX nên không đổi phạm vi. ${go('Hồ sơ FOX', 'mt14:listed::FOX')}`;
}
function fixedPane(p) {
  const fx2 = align(['ftth', 'xdsl']);
  const c1 = has('ftth', 'xdsl') ? chartCard({id: 'vt-fx-tech', title: 'Thuê bao băng rộng cố định theo công nghệ (triệu thuê bao)', cats: fx2.cats, series: [{name: 'Cáp quang (FTTH)', color: COL[0], values: fx2.vals[0], kind: 'bar'}, {name: 'xDSL', color: '#9AA3BD', values: fx2.vals[1], kind: 'bar'}], unit: 'triệu', digits: 2, native: 'stack', stackable: true, src: seriesSrc(['ftth', 'xdsl']), cadence: 'yearly'}) : null;
  const fh = align(['ftth_hh_pct']);
  const c2 = has('ftth_hh_pct') ? chartCard({id: 'vt-fx-hhpct', title: 'Tỷ lệ hộ gia đình sử dụng cáp quang (%)', sub: 'Hộ đang sử dụng dịch vụ; nguồn chưa công bố số hộ có khả năng kết nối', cats: fh.cats, series: [{name: 'Hộ dùng cáp quang', color: COL[1], values: fh.vals[0], kind: 'bar'}], unit: '%', digits: 1, native: 'bar', src: seriesSrc(['ftth_hh_pct']), cadence: 'yearly', note: 'Bảng số liệu nổi bật của Bộ; các công bố khác lệch 0,2–1,6 điểm %'}) : null;
  const K = [['fix_bb', 'Băng rộng cố định (Cục Thống kê)'], ['ftth', 'Cáp quang FTTH (Bộ)']].filter(([k]) => has(k)), a = align(K.map(x => x[0]));
  const c3 = chartCard({id: 'vt-fx-subs', title: 'Thuê bao Internet băng rộng cố định (triệu thuê bao)', cats: a.cats, series: K.map(([k, n], i) => ({name: n, color: COL[i], values: a.vals[i], kind: 'bar'})), unit: 'triệu', digits: 2, native: 'bar', src: seriesSrc(K.map(x => x[0])), cadence: 'yearly', note: 'Hai nguồn, hai định nghĩa: không cộng'});
  const hh = yearly('hh'), fx = yearly('fix_bb'), cs = [...fx.keys()].filter(y => hh.has(y)).sort();
  const c4 = cs.length > 1 ? chartCard({id: 'vt-fx-hh', title: 'Thuê bao băng rộng cố định trên số hộ gia đình (%)', cats: cs, series: [{name: 'Thuê bao / số hộ', color: COL[0], values: cs.map(y => fx.get(y) / hh.get(y) * 100), kind: 'bar'}], unit: '%', digits: 1, native: 'bar', src: seriesSrc(['fix_bb', 'hh']), cadence: 'yearly', note: 'Tự tính; thuê bao gồm cả doanh nghiệp nên tỷ lệ cao hơn tỷ lệ hộ có kết nối'}) : null;
  const bm = window.TELECOM_BENCH; let c5 = null, c6 = null;
  if (bm?.series?.fixed_bb_per100) { const s = bm.series.fixed_bb_per100, ys = [...new Set(Object.values(s.data).flatMap(Object.keys))].sort().filter(y => y >= '2012');
    c5 = chartCard({id: 'vt-fx-asean', title: 'Băng rộng cố định trên 100 dân: Việt Nam và ASEAN', cats: ys, series: Object.entries(bm.countries).map(([c, n], i) => ({name: n, color: c === 'VNM' ? '#C8394B' : COL[i], values: ys.map(y => s.data[c]?.[y] ?? null)})), unit: 'thuê bao/100 dân', digits: 1, zeroBase: false, extraSrc: WB('IT.NET.BBND.P2'), cadence: 'yearly', note: 'Tính trên 100 dân, không phải trên số hộ; quy mô hộ khác nhau giữa các nước'});
    const g = bm.series.gdp_pc, last = c => { const e = Object.entries(s.data[c] || {}); return e.length ? e[e.length - 1] : null; };
    c6 = tableCard('vt-fx-asean-t', 'So sánh kỳ mới nhất', ['Quốc gia', 'Băng rộng cố định/100 dân', 'Năm', 'GDP bình quân đầu người (USD)', 'Năm'], Object.entries(bm.countries).map(([c, n]) => { const l = last(c), gl = Object.entries(g?.data?.[c] || {}).pop(); return [c === 'VNM' ? `<b>${n}</b>` : n, l ? nf(l[1], 1) : '—', l?.[0], gl ? nf(gl[1], 0) : '—', gl?.[0]]; }), [], null, null, WB('IT.NET.BBND.P2')); }
  const pr = (T.prices || []).filter(x => x.segment === 'fixed').sort((x, y) => x.date.localeCompare(y.date));
  const area = t => /nội thành/i.test(t) ? 'Nội thành Hà Nội, TP.HCM' : /ngoại thành|tỉnh/i.test(t) ? 'Ngoại thành, tỉnh' : 'Nguồn không tách khu vực';
  const c7 = tableCard('vt-fx-prices', 'Gói cáp quang thấp nhất cho khách lắp mới', ['Ngày', 'Nhà mạng', 'Gói', 'Tốc độ', 'Khu vực', 'Giá (đồng/tháng)'], pr.map(x => [dmy(x.date), esc(x.operator), esc(x.package.replace(/\s*\([^)]*\)/, '')), esc(x.speed_or_quota), area(x.package), nf(x.price_vnd_month)]), pr.map(x => x.src), 'Chỉ so các dòng cùng tốc độ và cùng khu vực; giá chưa gồm phí lắp đặt, khuyến mại; khách hiện hữu giữ giá theo hợp đồng');
  const fr = align(['rev_fixed_usd', 'rev_fbb_usd']);
  const c8 = has('rev_fixed_usd') ? chartCard({id: 'vt-fx-rev', title: 'Doanh thu dịch vụ cố định (triệu USD)', cats: fr.cats, series: [{name: 'Cố định mặt đất (tổng)', color: COL[2], values: fr.vals[0], kind: 'bar'}, {name: 'Trong đó: băng rộng cố định', color: COL[0], values: fr.vals[1], kind: 'bar'}], unit: 'triệu USD', digits: 0, native: 'bar', src: seriesSrc(['rev_fixed_usd', 'rev_fbb_usd']), cadence: 'yearly', note: 'Băng rộng cố định là một phần của cố định mặt đất, không cộng'}) : null;
  const fs = T.shares?.fixed || {}, yrs = Object.keys(fs).sort(), opsN = [...new Set(yrs.flatMap(y => Object.keys(fs[y])))];
  const c9 = yrs.length ? chartCard({id: 'vt-fx-share', title: 'Thị phần thuê bao băng rộng cố định (%)', cats: yrs, series: opsN.map((o, i) => ({name: o, color: OPC[o] || COL[i], values: yrs.map(y => fs[y][o] ?? null), kind: 'bar'})), unit: '%', digits: 1, native: 'stack', stackable: true, src: T.shares?.fixed_src || [], min: 1, cadence: 'yearly'}) : null;
  const SH = T.shares || {};
  const c10 = tableCard('vt-cp-subrev-fix', 'Internet cố định: thị phần thuê bao so với thị phần doanh thu', ['Năm', 'Doanh nghiệp', 'Thị phần thuê bao', 'Thị phần doanh thu'], Object.keys(SH.fixed_rev || {}).flatMap(y => Object.keys(SH.fixed_rev[y]).map(o => [y, esc(o), fin(SH.fixed?.[y]?.[o]) ? nf(SH.fixed[y][o], 1) + '%' : '—', nf(SH.fixed_rev[y][o], 1) + '%'])), SH.fixed_rev_src || [], 'Sách Trắng CNTT-TT');
  const foxRev = finYear('FOX', 'revenue'), ft = yearly('fpt_tel_rev'), fb = yearly('fpt_bb_rev'), fy = [...new Set([...foxRev.keys(), ...ft.keys(), ...fb.keys()])].sort();
  const c11 = fy.length ? chartCard({id: 'vt-fx-fox-scope', title: 'FOX: doanh thu theo phạm vi báo cáo (tỷ đồng)', cats: fy, series: [{name: 'Doanh thu thuần FOX hợp nhất (gồm FPT Online)', color: '#c98a00', values: fy.map(y => foxRev.get(y) ?? null), kind: 'bar'}, {name: 'Mảng Dịch vụ viễn thông (BCTN FPT)', color: COL[0], values: fy.map(y => ft.get(y) ?? null), kind: 'bar'}, {name: 'Doanh thu băng rộng (BCTN FPT)', color: COL[1], values: fy.map(y => fb.get(y) ?? null), kind: 'bar'}], unit: 'tỷ đ', digits: 0, native: 'bar', src: seriesSrc(['fpt_tel_rev', 'fpt_bb_rev']), extraSrc: FIN_SRC, cadence: 'yearly', note: 'Ba phạm vi khác nhau, không cộng; từ 2026 FPT ghi nhận FOX theo phương pháp vốn chủ sở hữu'}) : null;
  const cy = [...foxRev.keys()].filter(y => fx.has(y)).sort();
  const c12 = cy.length > 2 ? chartCard({id: 'vt-fx-fox', title: 'FOX so với thị trường: tăng trưởng so với năm trước (%)', cats: cy, series: [{name: 'Doanh thu thuần FOX hợp nhất', color: '#c98a00', values: yoy(cy.map(y => foxRev.get(y)))}, {name: 'Thuê bao băng rộng cố định toàn thị trường', color: COL[0], values: yoy(cy.map(y => fx.get(y)))}], unit: '%', digits: 1, zeroBase: false, src: seriesSrc(['fix_bb']), extraSrc: FIN_SRC, cadence: 'yearly', note: 'Doanh thu FOX hợp nhất gồm cả truyền hình, quảng cáo trực tuyến, trung tâm dữ liệu'}) : null;
  stages(p, 'mt2', 'fixed', [
    ['infra', 'Hạ tầng', 'Hạ tầng & mức phủ', [qpanel('3.1', 'Mạng cố định đã chuyển sang cáp quang đến mức nào, bao nhiêu hộ đang dùng?', [c1, c2], leadFixedDef())]],
    ['subs', 'Khách hàng', 'Thuê bao FTTH & thâm nhập hộ gia đình', [qpanel('3.2', 'Thuê bao Internet cố định còn tăng nhanh không?', [c3, c4]), qpanel('3.3', 'Mức thâm nhập của Việt Nam so với khu vực?', [c5, c6], leadAsean())]],
    ['price', 'Thương mại', 'Gói cước, doanh thu & thị phần', [qpanel('3.4', 'Giá gói Internet cố định thay đổi thế nào?', [c7], leadFixedPrice()), qpanel('3.5', 'Doanh thu và thị phần Internet cố định phân bổ ra sao?', [c8, c9, c10])]],
    ['fox', 'Doanh nghiệp', 'Trường hợp FOX', [qpanel('3.6', 'FOX tăng trưởng nhanh hay chậm hơn thị trường?', [c11, c12], leadFox())]]
  ]);
}
function towerPane(p) {
  { const tw = (S('ctr_towers')?.points || []).filter(x => fin(x[1])), y24 = yearly('ctr_towers'), tn = (S('ctr_tenancy')?.points || []).filter(x => fin(x[1])), inf = lastY('ctr_rev_infra'), gm = lastY('ctr_gm_infra');
    const l = tw.at(-1), ref = tw.find(x => x[0] === `${+l?.[0].slice(0, 4) - 1}-12`) || tw.find(x => /-12$/.test(x[0]) && x[0] < l?.[0]);
    const parts = [
      l && `(1) CTR có thêm vị trí sở hữu không: ${nf(l[1], 0)} vị trí (${per(l[0])})${ref ? ` so với ${nf(ref[1], 0)} (${per(ref[0])})` : ''}.`,
      tn.length && `(2) Có thêm khách thuê trên mỗi vị trí không: ${nf(tn[0][1], 2)} lần (${per(tn[0][0])}) → ${nf(tn.at(-1)[1], 2)} lần (${per(tn.at(-1)[0])}).`,
      inf && `(3) Doanh thu cho thuê và biên gộp: ${nf(inf.v, 0)} tỷ đồng năm ${inf.y}${inf.pv ? ` (${sg(ch(inf.v, inf.pv))}% so ${inf.py})` : ''}${gm ? `, biên gộp ${nf(gm.v, 1)}%${gm.pv ? ` (${nf(gm.pv, 1)}% năm ${gm.py})` : ''}` : ''}.`];
    p.append(el('p', 'vt-sublead', parts.filter(Boolean).join(' ') + ' Số CTR đại diện doanh nghiệp, không đại diện toàn thị trường TowerCo.')); }
  const LB = T.labelled || {}, own = k => LB[k] ? LB[k].rows : [], tot = k => own(k).reduce((a, r) => a + r[1], 0);
  const c1 = tableCard('vt-tw-owners-market', 'Toàn thị trường cuối 2019: ai sở hữu vị trí trạm?', ['Chủ sở hữu', 'Số vị trí trạm', 'Tỷ trọng toàn thị trường'], own('tower_owner_2019').map(r => [esc(r[0]), nf(r[1]), nf(r[1] / tot('tower_owner_2019') * 100, 1) + '%']), own('tower_owner_2019').map(r => r[3]), 'Đếm theo vị trí trạm (site); tỷ trọng tự tính');
  const c2 = tableCard('vt-tw-owners-towerco', 'Nhóm TowerCo: số vị trí trạm theo doanh nghiệp', ['Thời điểm', 'TowerCo', 'Số vị trí trạm', 'Tỷ trọng trong nhóm TowerCo'], [['towerco_2019', 'Cuối 2019'], ['towerco_2024', 'Cuối 2024']].flatMap(([k, n]) => own(k).map(r => [n, esc(r[0]), nf(r[1]), nf(r[1] / tot(k) * 100, 1) + '%'])), [...own('towerco_2019'), ...own('towerco_2024')].map(r => r[3]), 'Tỷ trọng trong nhóm TowerCo, không phải tỷ trọng toàn thị trường');
  const bt = (S('bts_total')?.points || []);
  const c3 = tableCard('vt-tw-bts', 'Số trạm BTS cả nước (đếm theo thiết bị phát sóng)', ['Thời điểm', 'Số trạm BTS'], bt.map(x => [per(x[0]), nf(x[1])]), bt.map(x => x[3]), 'BTS đếm theo thiết bị/công nghệ (2G, 3G, 4G, 5G) nên lớn hơn số vị trí trạm; không so trực tiếp với số site');
  const tp = (S('ctr_towers')?.points || []).filter(x => fin(x[1]));
  const c4 = tp.length > 1 ? chartCard({id: 'vt-tw-towers', title: 'CTR: số trạm sở hữu (trạm)', cats: tp.map(x => x[0]), series: [{name: 'Trạm sở hữu', color: COL[0], values: tp.map(x => x[1]), kind: 'bar'}], unit: 'trạm', digits: 0, native: 'bar', src: tp.map(x => x[3]), cadence: 'monthly', note: 'CTR công bố số trạm sở hữu, không công bố riêng số trạm đang khai thác'}) : null;
  const tn = (S('ctr_tenancy')?.points || []).filter(x => fin(x[1]));
  const c5 = tn.length > 1 ? chartCard({id: 'vt-tw-tenancy', title: 'CTR: số khách thuê bình quân trên trạm (lần)', cats: tn.map(x => x[0]), series: [{name: 'Tỷ lệ thuê chung', color: COL[2], values: tn.map(x => x[1])}], unit: 'lần', digits: 2, zeroBase: false, src: tn.map(x => x[3]), cadence: 'monthly'}) : null;
  const ct = (S('ctr_cotenant')?.points || []).filter(x => fin(x[1]));
  const c6 = ct.length > 1 ? chartCard({id: 'vt-tw-cotenant', title: 'CTR: số trạm có từ 2 nhà mạng thuê trở lên (trạm)', cats: ct.map(x => x[0]), series: [{name: 'Trạm có ≥2 khách thuê', color: COL[1], values: ct.map(x => x[1]), kind: 'bar'}], unit: 'trạm', digits: 0, native: 'bar', src: ct.map(x => x[3]), cadence: 'monthly'}) : null;
  const SEG = [['ctr_rev_build', 'Xây lắp'], ['ctr_rev_om', 'Vận hành khai thác'], ['ctr_rev_infra', 'Hạ tầng cho thuê'], ['ctr_rev_solution', 'Giải pháp tích hợp']].filter(([k]) => has(k)), sg2 = align(SEG.map(x => x[0]));
  const c7 = SEG.length ? chartCard({id: 'vt-tw-seg', title: 'CTR: doanh thu theo mảng (tỷ đồng)', cats: sg2.cats, series: SEG.map(([k, n], i) => ({name: n, color: COL[i], values: sg2.vals[i], kind: 'bar'})), unit: 'tỷ đ', digits: 0, native: 'stack', stackable: true, src: seriesSrc(SEG.map(x => x[0])), cadence: 'yearly', note: 'Số theo mảng do CTR công bố; tổng có thể khác doanh thu thuần hợp nhất'}) : null;
  const GM = [['ctr_gm_infra', 'Hạ tầng cho thuê'], ['ctr_gm_om', 'Vận hành khai thác'], ['ctr_gm_build', 'Xây lắp'], ['ctr_gm_solution', 'Giải pháp tích hợp']].filter(([k]) => has(k)), gm = align(GM.map(x => x[0]));
  const c8 = GM.length ? chartCard({id: 'vt-tw-margin', title: 'CTR: biên lợi nhuận gộp theo mảng (%)', cats: gm.cats, series: GM.map(([k, n], i) => ({name: n, color: COL[(i + 2) % COL.length], values: gm.vals[i], kind: 'bar'})), unit: '%', digits: 1, native: 'bar', src: seriesSrc(GM.map(x => x[0])), min: 1, cadence: 'yearly'}) : null;
  const vs = align(['ctr_viettel_share']);
  const c9 = has('ctr_viettel_share') ? chartCard({id: 'vt-tw-viettel', title: 'CTR: tỷ trọng doanh thu từ Tập đoàn Viettel (%)', cats: vs.cats, series: [{name: 'Doanh thu từ Viettel / tổng doanh thu', color: '#C8394B', values: vs.vals[0], kind: 'bar'}], unit: '%', digits: 0, native: 'bar', src: seriesSrc(['ctr_viettel_share']), cadence: 'yearly'}) : null;
  const inf = yearly('ctr_rev_infra'), tw = yearly('ctr_towers'), ys = [...inf.keys()].filter(y => tw.has(y)).sort();
  const c10 = ys.length > 1 ? chartCard({id: 'vt-tw-bridge', title: 'CTR: doanh thu hạ tầng cho thuê trên mỗi trạm sở hữu · chỉ số tham chiếu (triệu đồng/trạm/năm)', sub: 'Tử số: doanh thu mảng hạ tầng cho thuê cả năm · mẫu số: số trạm sở hữu cuối năm', cats: ys, series: [{name: 'Doanh thu hạ tầng cho thuê / trạm sở hữu cuối năm', color: COL[3], values: ys.map(y => inf.get(y) / tw.get(y) * 1000), kind: 'bar'}], unit: 'triệu đ/trạm', digits: 1, native: 'bar', src: seriesSrc(['ctr_rev_infra', 'ctr_towers']), cadence: 'yearly', note: 'Chỉ số tham chiếu: mẫu số là trạm sở hữu cuối kỳ, không phải trạm khai thác bình quân; chưa tách giá thuê và số khách thuê'}) : null;
  const facts = (T.companies?.CTR?.facts || []).filter(f => !/rủi ro|kỳ vọng|đánh giá|nhận định/i.test(f.text));
  const c11 = tableCard('vt-tw-facts', 'CTR: kế hoạch, hợp đồng và thông tin vận hành theo công bố', ['Nội dung', 'Nguồn'], facts.map(f => [esc(f.text), srcA(f.src)]), facts.map(f => f.src), 'Số liệu CTR đại diện cho doanh nghiệp, không đại diện toàn thị trường TowerCo');
  stages(p, 'mt2', 'tower', [
    ['market', 'Thị trường', 'Tài sản & chủ sở hữu trạm', [qpanel('4.1', 'Trạm viễn thông do nhà mạng hay TowerCo sở hữu?', [c1, c2, c3], 'Phân biệt các cách đếm: <b>vị trí trạm</b> (site, nơi đặt cột/nhà trạm) khác <b>thiết bị BTS</b> (đếm theo công nghệ, nên lớn hơn). CTR công bố số vị trí sở hữu và số vị trí có từ 2 nhà mạng thuê; chưa công bố số vị trí đang khai thác. Cơ cấu sở hữu toàn thị trường là số cuối 2019; nhóm TowerCo có thêm số cuối 2024.')]],
    ['ctr', 'CTR', 'Số trạm & khách thuê trên trạm', [qpanel('4.2', 'CTR tăng trưởng nhờ thêm trạm hay thêm khách thuê trên mỗi trạm?', [c4, c5, c6])]],
    ['rev', 'Doanh thu', 'Doanh thu, biên gộp & tập trung khách hàng', [qpanel('4.3', 'Mảng nào tạo doanh thu, biên lợi nhuận ra sao?', [c7, c8, c10], leadCtrSeg()), qpanel('4.4', 'CTR phụ thuộc vào khách hàng lớn đến mức nào?', [c9], (() => { const v = lastY('ctr_viettel_share'), f = (S('ctr_viettel_share')?.points || [])[0]; return v ? `Doanh thu từ Tập đoàn Viettel chiếm <b>${nf(v.v, 0)}%</b> tổng doanh thu CTR năm ${v.y}${f ? ` (${nf(f[1], 0)}% năm ${f[0]})` : ''}, theo CTR công bố cho toàn công ty, chưa tách theo mảng.` : ''; })())]],
    ['plan', 'Kế hoạch', 'Kế hoạch & hợp đồng', [qpanel('4.5', 'CTR công bố gì về kế hoạch trạm và hợp đồng?', [c11], go('Số liệu tài chính CTR', 'mt14:listed'))]]
  ]);
}
function leadCtrSeg() {
  const seg = [['ctr_rev_om', 'vận hành khai thác (phí dịch vụ)'], ['ctr_rev_build', 'xây lắp (theo dự án)'], ['ctr_rev_solution', 'giải pháp tích hợp'], ['ctr_rev_infra', 'cho thuê hạ tầng (định kỳ)']].map(([k, n]) => [n, lastY(k)]).filter(x => x[1]);
  if (!seg.length) return '';
  const y = seg[0][1].y, tot = seg.reduce((a, [, x]) => a + (x.y === y ? x.v : 0), 0), d = seg.filter(([, x]) => fin(x.pv)).map(([n, x]) => [n, x.v - x.pv]).sort((a, b) => b[1] - a[1]);
  return `CTR năm ${y} (số theo mảng do CTR công bố): ${seg.map(([n, x]) => `${n} ${nf(x.v, 0)} tỷ (${nf(x.v / tot * 100, 0)}%)`).join(', ')}.${d.length ? ` Tăng so ${+y - 1} chủ yếu từ ${d.slice(0, 2).map(([n, v]) => `${n} ${sg(v, 0)} tỷ`).join(', ')}.` : ''} Doanh thu hạ tầng chia số trạm sở hữu cuối năm là chỉ số tham chiếu (tử số: doanh thu mảng cho thuê cả năm; mẫu số: trạm sở hữu cuối năm).`;
}
const DOC_GROUP = d => /65\/2025|Starlink|3168/.test(d) ? 'license' : /1132|193\/2025|2G/.test(d) ? 'roadmap' : 'market';
function policyPane(p) {
  const sp = T.spectrum || [];
  const c1 = tableCard('vt-pol-spectrum', 'Đấu giá, cấp phép và phí tần số', ['Ngày', 'Băng tần', 'Doanh nghiệp', 'Giá trúng (tỷ đ)', 'Giá khởi điểm (tỷ đ)', 'Thời hạn', 'Nghĩa vụ'], sp.map(x => [dmy(x.date), esc(x.band), esc(x.winner), nf(x.price_bn_vnd, 1), nf(x.reserve_bn_vnd, 1), fin(x.term_years) ? x.term_years + ' năm' : '—', esc(x.obligation)]), sp.map(x => x.src));
  const ST = {'in effect': 'Đã hiệu lực', draft: 'Dự thảo', plan: 'Kế hoạch'};
  const docTable = (id, title, g) => { const r = [...(T.policy || [])].filter(x => DOC_GROUP(x.doc) === g).sort((a, b) => b.date.localeCompare(a.date));
    return tableCard(id, title, ['Văn bản', 'Nội dung', 'Tác động đến hoạt động kinh doanh', 'Ban hành', 'Hiệu lực', 'Mốc nguồn ghi', 'Trạng thái'], r.map(x => [esc(x.doc), `<b>${esc(x.title)}</b>`, esc(x.effect), x.issued ? dmy(x.issued) : '—', x.effective ? dmy(x.effective) : '—', dmy(x.date), ST[x.status] || esc(x.status)]), r.map(x => x.src), 'Ngày ban hành, hiệu lực chỉ ghi khi văn bản nguồn nêu rõ'); };
  const g2 = FG.filter(x => x.operator === 'Toàn quốc').sort((a, b) => a.date.localeCompare(b.date));
  const c3 = tableCard('vt-pol-roadmap', 'Mốc toàn quốc: 5G và dừng 2G', ['Ngày', 'Giá trị', 'Nội dung', 'Loại'], g2.map(x => [dmy(x.date), fin(x.value) ? `${nf(x.value, x.value < 100 ? 1 : 0)} ${esc(x.unit)}` : '—', esc(x.text), x.status === 'target' ? 'Mục tiêu' : 'Thực tế']), g2.map(x => x.src));
  stages(p, 'mt2', 'policy', [
    ['license', 'Cấp phép', 'Cấp phép & phổ tần', [qpanel('5.1', 'Nhà mạng trả bao nhiêu cho tần số, kèm nghĩa vụ gì?', [c1, docTable('vt-pol-docs-license', 'Văn bản về tần số và cấp phép', 'license')], 'Biến số kinh doanh: <b>giá trúng đấu giá</b> là chi phí quyền sử dụng tần số trong thời hạn giấy phép; <b>CAPEX thực hiện nghĩa vụ</b> (xây trạm, phủ xã) là khoản riêng, nhà mạng chưa công bố số. Mốc và biến số cần theo dõi ở ' + go('Triển vọng', 'mt1:outlook') + '; diễn biến mới ở ' + go('Chủ đề nóng', 'mt7'))]],
    ['roadmap', 'Lộ trình', 'Lộ trình & nghĩa vụ triển khai', [qpanel('5.2', 'Lộ trình 5G, dừng 2G và nghĩa vụ hạ tầng đang ở đâu?', [c3, docTable('vt-pol-docs-roadmap', 'Văn bản về lộ trình và nghĩa vụ triển khai', 'roadmap')], `Nghĩa vụ đo theo các tiêu chí khác nhau: <b>số trạm/BTS</b> (≥3.000 trạm 5G sau 2 năm với băng 5G; ≥5.500 BTS sau 2 năm với 900 MHz), <b>tỷ lệ xã có sóng</b> (900 MHz: 60% sau 2 năm, 100% sau 4 năm), <b>tỷ lệ dân số được phủ</b> (mục tiêu 99% năm 2030). Bảng văn bản tách ngày ban hành, ngày hiệu lực và mốc nguồn ghi; kỳ mục tiêu và hạn nghĩa vụ ở ${go('Triển vọng', 'mt1:outlook')}. ${go('Tiến độ 5G theo nhà mạng', 'mt2:mobile:network')}`)]],
    ['market', 'Thị trường', 'Quy định về giá cước & cạnh tranh', [qpanel('5.3', 'Văn bản nào thay đổi luật chơi về giá, cạnh tranh và sở hữu?', [docTable('vt-pol-docs', 'Văn bản về thị trường, giá cước và sở hữu', 'market')], `Biến số kinh doanh: Luật Viễn thông 2023 cho phép Bộ hướng dẫn giá thuê hạ tầng kỹ thuật thụ động và yêu cầu chung cư bảo đảm tối thiểu 2 nhà mạng (tác động giá thuê hạ tầng, cạnh tranh tại tòa nhà); xác thực sinh trắc thuê bao (2026) tác động số SIM ghi nhận. Dự thảo chuyển quyền đại diện vốn VNPT về Bộ KH&CN chỉ có hiệu lực khi Chính phủ ban hành nghị định sửa Nghị định 55/2025 — văn bản cần kiểm tra tiếp. Giá gói niêm yết: ${go('Di động', 'mt2:mobile:commercial')} ${go('Internet cố định', 'mt2:fixed:price')}`)]]
  ]);
}
function sourcesFold(host) {
  const fq = {M: 'Tháng', Q: 'Quý', Y: 'Năm', event: 'Theo công bố'};
  const rows = Object.entries(T.series || {}).map(([, s]) => { const ps = s.points.filter(x => fin(x[1])); return [esc(s.label), esc(s.unit), fq[s.freq] || s.freq, ps.length ? `${per(ps[0][0])} – ${per(ps[ps.length - 1][0])}` : '—', ps.length, s.kind === 'stock' ? 'Số dư cuối kỳ' : s.kind === 'flow' ? 'Phát sinh trong kỳ' : 'Tỷ lệ', esc(s.def || s.scope || ''), ps.some(x => x[2] === 'estimate') ? 'Có số ước tính' : 'Thực tế', 'Nhập tay có nguồn (data/telecom/*.json)']; });
  if (F) rows.push(['BCTC hợp nhất ' + F.companies.length + ' doanh nghiệp', 'tỷ đồng', 'Quý', `${per(F.periods[0])} – ${per(F.periods.at(-1))}`, F.periods.length, 'KQKD, CĐKT, LCTT', 'VNDirect finfo', 'Thực tế', 'Tự động (scripts/fetch_telecom_financials.py)']);
  if (window.TELECOM_BENCH) rows.push(['Chỉ tiêu ITU so sánh ASEAN (6 nước)', 'nhiều', 'Năm', '2010 – ' + Math.max(...Object.values(TELECOM_BENCH.series.fixed_bb_per100.data).flatMap(o => Object.keys(o).map(Number))), '—', 'Thuê bao/100 dân, GDP/người', 'World Bank WDI', 'Thực tế', 'Tự động (scripts/fetch_telecom_benchmarks.py)']);
  if (window.TELECOM_NEWS) rows.push(['Tin & sự kiện ngành', 'sự kiện', 'Theo công bố', '—', TELECOM_NEWS.events.length, 'Bài gốc → sự kiện → chủ đề', '', 'Thực tế', 'Dựng từ data/telecom/policy.json (scripts/build_telecom_industry.py)']);
  const d = el('details', 'card vt-sources'); d.id = 'vt-sources';
  d.innerHTML = `<summary><b>Danh mục bộ dữ liệu & phương pháp cập nhật</b> <small>${rows.length} bộ dữ liệu · ${(T.sources || []).length} nguồn</small></summary>`;
  const t1 = tableCard('vt-src-datasets', 'Bộ dữ liệu', ['Chỉ tiêu', 'Đơn vị', 'Tần suất', 'Kỳ dữ liệu', 'Số điểm', 'Loại', 'Định nghĩa / phạm vi', 'Trạng thái', 'Cập nhật'], rows, [], null);
  t1?.querySelector('.pw-src')?.remove(); if (t1) { t1.append(el('div', 'pw-src', 'Nguồn: data/telecom-industry.json, data/telecom-financials.json, data/raw/public/telecom-benchmarks.json')); d.append(t1); }
  const t2 = tableCard('vt-src-list', 'Danh mục nguồn', ['Đơn vị công bố', 'Tài liệu', 'Ngày công bố'], (T.sources || []).map(s => [esc(s.org || ''), `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`, dmy(s.published)]), [], null);
  t2?.querySelector('.pw-src')?.remove(); if (t2) d.append(t2);
  host.append(d);
}

/* ================= Tài chính ngành ================= */
function financePane(p) { const host = el('div'); p.append(host); if (window.TelecomFinance) window.TelecomFinance.build(host); }
// Đầu hồ sơ: mảng nào tạo doanh thu, mảng nào tạo biên, đâu là chi phí vốn chính (theo dữ liệu sẵn có).
function profileLead(t) {
  const rv = ttm(t, 'revenue'), gp = ttm(t, 'gross'), cx = ttm(t, 'capex'), np = ttm(t, 'npat'), npp = ttm(t, 'npat_parent'), q = LQ();
  const lastRev = (F?.data[t]?.revenue || []).map((v, i) => fin(v) ? i : -1).filter(i => i >= 0).at(-1);
  if (!fin(rv)) return `<p class="vt-plead">${lastRev != null && lastRev >= 0 ? `BCTC trên nguồn chỉ có đến ${per(F.periods[lastRev])}; không đủ 4 quý để tính số TTM, không so với các mã khác.` : 'Chưa có số BCTC.'}</p>`;
  const gm = fin(gp) ? gp / rv * 100 : null, cxr = fin(cx) ? cx / rv * 100 : null;
  const base = `TTM ${q}: doanh thu ${nf(rv, 0)} tỷ đồng, biên gộp ${nf(gm, 1)}%, CAPEX ${nf(cx, 0)} tỷ (${nf(cxr, 1)}% doanh thu).`;
  let x = '';
  if (t === 'CTR') { const seg = [['ctr_rev_om', 'vận hành khai thác'], ['ctr_rev_build', 'xây lắp'], ['ctr_rev_solution', 'giải pháp tích hợp'], ['ctr_rev_infra', 'cho thuê hạ tầng']].map(([k, n]) => [n, lastY(k)]).filter(z => z[1]).sort((a, b) => b[1].v - a[1].v), gi = lastY('ctr_gm_infra');
    x = seg.length ? `Doanh thu lớn nhất năm ${seg[0][1].y}: ${seg[0][0]} ${nf(seg[0][1].v, 0)} tỷ. Biên cao nhất: cho thuê hạ tầng${gi ? ` ${nf(gi.v, 1)}% (${gi.y})` : ''} nhưng doanh thu nhỏ; biên gộp hợp nhất ${nf(gm, 1)}% (TTM ${q}) thấp vì các mảng biên khoảng 5% chiếm phần lớn doanh thu (số mảng theo năm ${seg[0][1].y}, khác kỳ với số TTM). Tài sản vốn chính: trạm cho thuê${lastPt('ctr_towers') ? ` (${nf(lastPt('ctr_towers')[1], 0)} vị trí sở hữu, ${per(lastPt('ctr_towers')[0])})` : ''}.` : ''; }
  if (t === 'FOX') { const bb = lastY('fpt_bb_rev'); x = `Doanh thu hợp nhất FOX gồm Internet cố định, truyền hình, quảng cáo trực tuyến (FPT Online) và trung tâm dữ liệu${bb ? `; riêng doanh thu băng rộng do FPT công bố ${nf(bb.v, 0)} tỷ đồng năm ${bb.y}` : ''}. Chi phí vốn chính: hạ tầng cáp quang và thiết bị đầu cuối.`; }
  if (t === 'VGI') x = `Hoạt động tại các thị trường nước ngoài. LNST hợp nhất TTM ${nf(np, 0)} tỷ đồng, trong đó thuộc cổ đông công ty mẹ ${nf(npp, 0)} tỷ; phần chênh thuộc cổ đông không kiểm soát tại các công ty con nước ngoài.`;
  return `<p class="vt-plead">${base} ${x}</p>`;
}
function listedPane(p) {
  if (!F || !window.TelecomFinance) return;
  const E = TelecomFinance.engine, last = F.periods.length - 1;
  const lastIdx = t => { const r = F.data[t]?.revenue || []; for (let i = r.length - 1; i >= 0; i--) if (fin(r[i])) return i; return -1; };
  const at = (t, m, mode, i, avg) => { if (i < 0) return null; const s = E.per(m, [t], mode, avg)[t]; return s?.[i] ?? null; };
  const rows = F.companies.map(co => { const t = co.ticker, i = lastIdx(t), g = F.groups.find(x => x.id === co.group);
    const rv = at(t, 'revenue', 'ttm', i), gp = at(t, 'gross', 'ttm', i), eb = at(t, 'ebitda', 'ttm', i), np = at(t, 'npat', 'ttm', i), npp = at(t, 'npat_parent', 'ttm', i), cx = at(t, 'capex', 'ttm', i);
    const eq = at(t, 'equity', 'q', i), nci = at(t, 'nci', 'q', i), eq4 = at(t, 'equity', 'q', i - 4), nci4 = at(t, 'nci', 'q', i - 4);
    const eqp = fin(eq) ? eq - (fin(nci) ? nci : 0) : null, eqp4 = fin(eq4) ? eq4 - (fin(nci4) ? nci4 : 0) : null;
    const roe = fin(npp) && fin(eqp) && fin(eqp4) && eqp + eqp4 > 0 ? npp / ((eqp + eqp4) / 2) * 100 : null;
    return {t, g: co.group, gl: g?.label, gc: g?.color, per: i >= 0 ? F.periods[i] : null, stale: i >= 0 && i < last,
      v: {rv, gm: fin(gp) && fin(rv) && rv ? gp / rv * 100 : null, em: fin(eb) && fin(rv) && rv ? eb / rv * 100 : null, np, npp, roe, cx: fin(cx) && fin(rv) && rv ? cx / rv * 100 : null,
        nd: at(t, 'net_debt', 'q', i), eq, ta: at(t, 'total_assets', 'q', i)}}; });
  const COLS = [['rv', 'Doanh thu thuần', 'TTM', 0], ['gm', 'Biên gộp', 'TTM', 1, '%'], ['em', 'Biên EBITDA', 'TTM', 1, '%'], ['np', 'LNST hợp nhất', 'TTM', 0], ['npp', 'LNST thuộc cổ đông công ty mẹ', 'TTM', 0], ['roe', 'ROE công ty mẹ', 'TTM', 1, '%'], ['cx', 'CAPEX / doanh thu', 'TTM', 1, '%'], ['nd', 'Nợ vay ròng', 'cuối kỳ', 0], ['eq', 'Vốn chủ sở hữu', 'cuối kỳ', 0], ['ta', 'Tổng tài sản', 'cuối kỳ', 0]];
  const st = {sort: 'rv', dir: -1, group: '', q: ''};
  const c = el('div', 'card pp-tcard vt-card vt-listed'); c.dataset.blockId = 'vt-ov-listed'; c.dataset.updateKind = 'public'; c.dataset.cadence = 'quarterly'; c.dataset.refreshStatus = 'snapshot';
  c.innerHTML = `<div class="chart-title">Doanh nghiệp niêm yết có hoạt động viễn thông</div><div class="chart-sub">Kết quả kinh doanh, dòng tiền: 4 quý gần nhất (TTM) đến kỳ BCTC mới nhất của từng mã · tài sản, nợ, vốn: số dư cuối kỳ đó · đơn vị tỷ đồng · bấm tiêu đề cột để sắp xếp</div>
    <div class="pf-ctl vt-lctl"><label>Nhóm mô hình <select class="pf-sel" data-f="group"><option value="">Tất cả</option>${F.groups.map(g => `<option value="${g.id}">${esc(g.label)}</option>`).join('')}</select></label><label>Mã <input class="pf-sel" data-f="q" type="search" placeholder="FOX, CTR…" size="10"></label><span class="vt-count" role="status"></span></div>
    <div class="tablewrap"><table class="vt-sort"><thead><tr><th data-k="t">Mã</th><th data-k="gl">Nhóm mô hình</th><th data-k="per">Kỳ BCTC</th>${COLS.map(([k, n, w]) => `<th data-k="${k}" class="num">${esc(n)}<br><small>${w}</small></th>`).join('')}</tr></thead><tbody></tbody></table></div>`;
  const tb = c.querySelector('tbody'), cnt = c.querySelector('.vt-count');
  const DEEP = {CTR: ['TowerCo', 'mt2:tower'], FOX: ['Internet cố định', 'mt2:fixed:fox']};
  const draw = () => {
    const q = st.q.trim().toUpperCase().split(/[\s,]+/).filter(Boolean);
    const list = rows.filter(r => (!st.group || r.g === st.group) && (!q.length || q.some(x => r.t.startsWith(x)))).sort((a, b) => {
      const va = st.sort in a.v ? a.v[st.sort] : a[st.sort], vb = st.sort in b.v ? b.v[st.sort] : b[st.sort];
      if (!fin(va) && !fin(vb)) return String(va ?? '').localeCompare(String(vb ?? '')) * st.dir; if (!fin(va)) return 1; if (!fin(vb)) return -1; return (va - vb) * st.dir; });
    tb.innerHTML = list.map(r => `<tr data-t="${r.t}"${r.stale ? ' class="vt-stale"' : ''}><td><b>${r.t}</b>${r.stale ? `<br><small>BCTC trên nguồn chỉ đến ${per(r.per)}</small>` : ''}${DEEP[r.t] ? ` ${go(DEEP[r.t][0], DEEP[r.t][1])}` : ''}</td><td><i class="vt-dot" style="background:${r.gc}"></i>${esc(r.gl)}</td><td>${r.per ? per(r.per) : '—'}${r.stale ? ' <small>(chưa có kỳ mới nhất)</small>' : ''}</td>${COLS.map(([k, , , d, u]) => `<td class="num">${fin(r.v[k]) ? nf(r.v[k], d) + (u || '') : '—'}</td>`).join('')}</tr>`).join('');
    cnt.textContent = `${list.length}/${rows.length} doanh nghiệp`;
    c.querySelectorAll('th[data-k]').forEach(th => th.setAttribute('aria-sort', th.dataset.k === st.sort ? (st.dir > 0 ? 'ascending' : 'descending') : 'none'));
    tb.querySelectorAll('tr').forEach(tr => tr.onclick = e => { if (!e.target.closest('a')) { profile(tr.dataset.t); prof.scrollIntoView({behavior: 'smooth', block: 'start'}); } });
  };
  c.querySelectorAll('th[data-k]').forEach(th => th.addEventListener('click', () => { st.dir = st.sort === th.dataset.k ? -st.dir : -1; st.sort = th.dataset.k; draw(); }));
  c.querySelector('[data-f=group]').addEventListener('change', e => { st.group = e.target.value; draw(); });
  c.querySelector('[data-f=q]').addEventListener('input', e => { st.q = e.target.value; draw(); const u = new URL(location.href); if (st.q.trim()) u.searchParams.set('tk', st.q.trim().toUpperCase()); else u.searchParams.delete('tk'); history.replaceState(null, '', u.pathname + u.search + u.hash); });
  c.append(el('div', 'pw-src', `Nguồn: ${FIN_SRC}; tự tính bằng cùng engine với Tài chính ngành`));
  c.append(el('div', 'pw-src-note', 'EBITDA = LN gộp − chi phí bán hàng − chi phí QLDN + khấu hao, thiếu một thành phần thì để trống · ROE công ty mẹ = LNST thuộc cổ đông công ty mẹ ÷ VCSH công ty mẹ bình quân (VCSH − lợi ích cổ đông không kiểm soát) · chưa có cột định giá vì repo chưa có dữ liệu giá các mã này · bấm một dòng để xem hồ sơ'));
  p.append(qpanel('2.1', 'Doanh nghiệp niêm yết nào có hoạt động viễn thông, quy mô và hiệu quả ra sao?', [c]));
  const prof = el('div', 'card vt-profile'); prof.dataset.blockId = 'vt-listed-profile'; prof.dataset.updateKind = 'manual'; prof.dataset.cadence = 'quarterly'; prof.dataset.refreshStatus = 'snapshot';
  const pick = el('div', 'pf-ctl'); pick.innerHTML = `<span class="pf-lb">Chọn mã</span>` + F.companies.map(co => `<button type="button" class="vt-tk ls" data-p="${co.ticker}">${co.ticker}</button>`).join('');
  const body = el('div'), psrc = el('div', 'pw-src');
  prof.append(el('div', 'chart-title', 'Hồ sơ doanh nghiệp'), pick, body, psrc);
  function profile(t) {
    const co = F.companies.find(x => x.ticker === t), C = T.companies?.[t] || {}, LB = T.labelled || {};
    pick.querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === t)));
    const facts = (C.facts || []).filter(f => !/rủi ro|kỳ vọng|đánh giá|nhận định/i.test(f.text));
    const vk = t === 'VGI' ? ['vgi_growth_2024', 'vgi_growth_2025'].filter(k => LB[k]) : [];
    const vgi = vk.map(k => `<h4>${esc(LB[k].label)}</h4><div class="tablewrap"><table><thead><tr><th>Thị trường</th><th>Tăng trưởng doanh thu so cùng kỳ</th></tr></thead><tbody>${LB[k].rows.map(r => `<tr><td>${esc(r[0])}</td><td>${sg(r[1], 0)}%</td></tr>`).join('')}</tbody></table></div>`).join('');
    body.innerHTML = `<h3>${t} <small>${esc(F.groups.find(g => g.id === co?.group)?.label || '')}</small></h3>${profileLead(t)}<p>${esc(C.profile || co?.note || '')}</p>${facts.length ? `<ul class="pp-ul">${facts.map(f => `<li>${esc(f.text)} <small>${srcA(f.src)}</small></li>`).join('')}</ul>` : ''}${vgi}${t === 'VGI' ? '<p class="vt-note">Doanh thu VGI đến từ thị trường nước ngoài, tách khỏi thị phần trong nước; doanh thu tuyệt đối theo từng nước chưa được công bố.</p>' : ''}`;
    const ids = [...facts.map(f => f.src), ...vk.flatMap(k => LB[k].rows.map(r => r[3]))];
    psrc.innerHTML = ids.length ? srcLine(ids) : 'Nguồn: BCTN doanh nghiệp; nhóm mô hình ở scripts/telecom_fin_items.py';
  }
  pick.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => profile(b.dataset.p)));
  p.append(qpanel('2.2', 'Từng doanh nghiệp hoạt động ở đâu, công bố gì?', [prof]));
  window.VTListed = {filter(code) { code = String(code || '').toUpperCase(); st.q = code; c.querySelector('[data-f=q]').value = code; draw(); if (LISTED.has(code)) profile(code); }};
  draw(); profile('CTR');
  const tkq = new URL(location.href).searchParams.get('tk'); if (tkq) window.VTListed.filter(tkq);
}

/* ================= Khởi động ================= */
const BTAB = [
  ['market', '01', 'Toàn thị trường', 'Toàn thị trường', 'Quy mô và tăng trưởng → thuê bao mới, mức thâm nhập → cơ cấu doanh thu → cạnh tranh', marketPane],
  ['mobile', '02', 'Di động & 5G', 'Di động & 5G', 'Đầu tư và năng lực mạng → sử dụng → thương mại hóa → thị phần', mobilePane],
  ['fixed', '03', 'Internet cố định', 'Internet cố định', 'Hạ tầng và mức phủ → thuê bao, thâm nhập hộ gia đình → gói cước, doanh thu, thị phần → trường hợp FOX', fixedPane],
  ['tower', '04', 'TowerCo & hạ tầng', 'TowerCo & hạ tầng', 'Tài sản và chủ sở hữu trạm → số trạm, khách thuê CTR → doanh thu, biên gộp → kế hoạch, hợp đồng', towerPane],
  ['policy', '05', 'Chính sách', 'Chính sách', 'Cấp phép và phổ tần → lộ trình, nghĩa vụ triển khai → quy định về giá cước và cạnh tranh', policyPane]
];
const OTAB = [
  ['map', '00', 'Bản đồ ngành', 'Bản đồ ngành', 'Dịch vụ, tiền và tài sản đi qua những ai trong chuỗi', mapPane],
  ['chain', '01', 'Chuỗi giá trị theo mô hình', 'Chuỗi giá trị theo mô hình', 'Di động · Internet cố định · TowerCo và hạ tầng: đầu tư → vận hành → thu tiền → biến số biên và dòng tiền', chainPane],
  ['outlook', '02', 'Triển vọng', 'Triển vọng', 'Cấp phép, nghĩa vụ phủ sóng, mục tiêu 5G và kế hoạch doanh nghiệp phía trước', outlookPane]
];
const FTAB = [
  ['fin', '01', 'Tài chính ngành', 'Tài chính ngành', 'Kết quả kinh doanh → biên lợi nhuận → CAPEX và dở dang → công nợ, chuyển đổi tiền → nợ, thanh khoản, FCF → hiệu quả vốn, theo rổ doanh nghiệp đang chọn', financePane],
  ['listed', '02', 'Doanh nghiệp niêm yết', 'Doanh nghiệp niêm yết', 'Quy mô, biên lợi nhuận, cường độ đầu tư và bảng cân đối từng doanh nghiệp; hồ sơ doanh nghiệp', listedPane]
];
function head(pane, title, text) { pane.append(el('div', 'sectionhead', `<div><h2 class="sec">${esc(title)}</h2><p>${text}</p></div>`)); }
function start() {
  const st = el('style'); st.textContent = CSS; document.head.append(st);
  const pane = k => document.querySelector(`.majorpane[data-tab="${k}"]`);
  document.querySelectorAll('.majortabbtn').forEach(b => { b.setAttribute('role', 'tab'); b.addEventListener('click', () => showTab(b.dataset.tab, true)); });
  const p1 = pane('mt1'); if (p1) { const b = dataBrief(); if (b) p1.append(b); head(p1, 'Tổng quan ngành viễn thông', 'Bản đồ ngành → chuỗi giá trị từng mô hình → triển vọng. Doanh nghiệp niêm yết ở tab Tài chính ngành.'); subtabs(p1, 'mt1', OTAB); }
  const p2 = pane('mt2'); if (p2) { head(p2, 'Bức tranh ngành', 'Mỗi mục đi theo các khâu; mỗi nhóm trả lời một câu hỏi bằng dữ liệu, biểu đồ đặt ngay bên dưới.'); subtabs(p2, 'mt2', BTAB); sourcesFold(p2); }
  const p14 = pane('mt14'); if (p14) { head(p14, 'Tài chính ngành', 'Số tổng hợp từ BCTC hợp nhất của rổ doanh nghiệp niêm yết đang chọn; không đại diện toàn thị trường viễn thông Việt Nam.'); subtabs(p14, 'mt14', FTAB); }
  const p7 = pane('mt7'); if (p7) { const s = el('section', 'section'); s.innerHTML = '<div id="vt-news" aria-label="Tin ngành Viễn thông"><p role="status">Đang tải tin ngành Viễn thông…</p></div>'; p7.append(s); }
  queue.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } });
  apply(route(), false);
  document.documentElement.dataset.vtReady = '1';
  // Tìm nhanh: thêm tab con, khâu vào chỉ mục của sector-smart.js
  const addIndex = () => { const SS = window.SectorSmart; if (!SS) return; const tabName = k => TABS.find(t => t[0] === k)[1];
    [['mt1', OTAB], ['mt2', BTAB], ['mt14', FTAB]].forEach(([tab, list]) => list.forEach(([key, , label]) => SS.index.push({t: label, sub: tabName(tab), kind: 'Mục', run: () => { applying = true; showTab(tab, false); SUBS[tab].select(key); applying = false; writeUrl(true); scrollTo({top: 0, behavior: 'smooth'}); }})));
    // Nhóm câu hỏi, chart, bảng ở mọi tab con (kể cả đang ẩn): sector-smart.goTo mở đúng tab chính, tab con rồi cuộn tới.
    const seen = new Set();
    document.querySelectorAll('.majorpane .pp-ph h3, .majorpane .card .chart-title').forEach(h => { const t = h.textContent.replace(/\s+/g, ' ').trim(); if (!t || seen.has(t)) return; seen.add(t);
      const pn = h.closest('.pp-pane'), lab = document.getElementById(pn?.getAttribute('aria-labelledby') || '')?.textContent.replace(/^\d+/, '') || '', tab = h.closest('.majorpane')?.dataset.tab;
      SS.index.push({t, sub: tabName(tab) + (lab ? ' › ' + lab : ''), kind: h.matches('.pp-ph h3') ? 'Nhóm' : 'Chart', run: () => SS.goTo(h.closest('.pp-panel, .card') || h)}); });
    document.querySelectorAll('.pp-stage').forEach(h => { const pn = h.closest('.pp-pane'), lab = document.getElementById(pn?.getAttribute('aria-labelledby') || '')?.textContent.replace(/^\d+/, '') || ''; SS.index.push({t: h.querySelector('h3').textContent, sub: tabName(pn?.id.split('-')[0]) + ' › ' + lab, kind: 'Khâu', run: () => SS.goTo(h)}); }); };
  if (window.SectorBoot) SectorBoot.add(800, addIndex); else setTimeout(addIndex, 900);
}
const CSS = `
.vt-note{font-size:12px;color:var(--muted,#7a8399);margin:4px 0 0}.vt-lead{margin:6px 0 0;font-size:13px;line-height:1.55;color:var(--ink,#1d2333)}
.vt-sublead,.vt-plead{margin:0 0 14px;padding:8px 12px;font-size:13.5px;line-height:1.6;border-left:3px solid #2938A8;border-radius:6px;background:color-mix(in srgb,var(--card,#fff) 90%,#2938A8 6%)}.vt-plead{margin:6px 0 10px}
.vt-checks .vt-ol{margin:6px 0 0;padding-left:20px;font-size:13px;line-height:1.55}.vt-checks .vt-ol li{margin:4px 0}.vt-stale td{color:var(--muted,#7a8399)}
.vt-grid{gap:12px}.vt-one>.card,.vt-grid>.card{margin-bottom:0}.vt-card .pp-host{min-height:220px}
.pp-panel,.pp-stage,.vt-sources{scroll-margin-top:150px}
.vt-brief{margin:4px 0 16px}.vt-db{text-decoration:none;cursor:pointer}.vt-db:hover{border-color:#2938A8}.vt-db .db-s{font-size:12px;color:var(--muted,#7a8399)}.vt-db .db-s b.up{color:#1A7A50}.vt-db .db-s b.dn{color:#B3303F}
.vt-spark{display:block;width:100%;height:34px}.vt-db .pw-src{margin-top:auto;padding-top:6px}.db-u{font:600 13px Inter,sans-serif;color:var(--muted,#7a8399)}
.vt-chain .vt-flow{display:flex;align-items:stretch;gap:6px;overflow-x:auto;padding:6px 0}
.vt-col{flex:1 1 170px;min-width:160px;border:1px solid var(--line,#d6dbe8);border-radius:10px;padding:10px;background:var(--card,#fff);display:flex;flex-direction:column;gap:4px}
.vt-col b{font-size:13.5px}.vt-col small{font-size:11.5px;color:var(--muted,#7a8399);line-height:1.4}.vt-col>div{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;align-items:center}
.vt-arr{align-self:center;font-style:normal;font-weight:700;color:#2938A8}
.vt-tk{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:6px;font:600 12px Inter,sans-serif;border:1px solid var(--line,#d6dbe8);background:var(--card,#fff);color:inherit;text-decoration:none;cursor:pointer}
.vt-tk.ls,a.vt-tk.ls,.pp-tcard td a.vt-tk.ls{background:#eef1fa;color:#1D2678!important;border-color:#c9d0ee;font-weight:700;text-decoration:none!important}a.vt-tk.ls:hover,button.vt-tk.ls:hover{background:#1D2678;color:#fff!important;border-color:#1D2678}.vt-tk.gov{background:#fff1d6;color:#7a5200;border-color:#f0d9a8}.vt-col em{font-style:normal;font-size:11px;color:var(--muted,#7a8399);margin:0 6px 0 -2px}
.vt-tk[aria-pressed=true]{box-shadow:0 0 0 2px #59C5C8}
.vt-intl,.vt-legend{margin-top:8px;font-size:12.5px;color:var(--ink2,#3b4256)}.vt-legend{font-size:11.5px;color:var(--muted,#7a8399)}
.vt-go{font-size:12px;font-weight:600;white-space:nowrap;margin-right:10px}
.vt-dot{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px}
.vt-sub{margin:12px 0 6px;font:700 11px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#7a8399)}.vt-model .pp-flow-box{min-width:150px}
.vt-sources{margin-top:22px}.vt-sources>summary{cursor:pointer;padding:4px 0}.vt-sources>summary small{color:var(--muted,#7a8399);margin-left:8px}.vt-sources>.card{margin-top:12px}
.vt-lctl label{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--muted,#7a8399)}.vt-count{font-size:12px;color:var(--muted,#7a8399)}
.vt-sort th{cursor:pointer;white-space:nowrap}.vt-sort th small{font-weight:500;color:var(--muted,#7a8399)}.vt-sort th[aria-sort=descending]::after{content:' ▼';font-size:9px}.vt-sort th[aria-sort=ascending]::after{content:' ▲';font-size:9px}
.vt-sort td.num,.vt-sort th.num{text-align:right;font-variant-numeric:tabular-nums}.vt-sort tbody tr{cursor:pointer}.vt-sort tbody tr:hover td{background:#f4f6fb}
.vt-profile h3 small{font-weight:500;color:var(--muted,#7a8399);font-size:12px}.vt-profile .pf-ctl{flex-wrap:wrap}
.pp-tcard td{white-space:normal}
:root[data-theme=dark] .vt-col,:root[data-theme=dark] .vt-tk{background:var(--card,#141a33)}:root[data-theme=dark] .vt-tk.ls{background:#26306b;color:#dfe4ff!important;border-color:#3a4590}:root[data-theme=dark] .vt-sort tbody tr:hover td{background:#1b2244}
@media (max-width:760px){.vt-chain .vt-flow{flex-direction:column}.vt-arr{transform:rotate(90deg)}.vt-sort{min-width:900px}}
`;
if (window.SectorBoot) SectorBoot.add(-1, start); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
window.TelecomDashboard = {data: T, route, apply};
})();
