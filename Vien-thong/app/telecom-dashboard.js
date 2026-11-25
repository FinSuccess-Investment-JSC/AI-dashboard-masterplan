/* Viễn thông · dựng toàn bộ trang (25/11/2026) theo khung trang Điện: Tổng quan ngành · Bức tranh ngành · Chính sách ·
   Tần số · Giá cước · Chủ đề nóng · Nguồn dữ liệu. Số liệu ngành từ window.TELECOM (data/telecom-industry.js, dựng bằng
   scripts/build_telecom_industry.py từ data/telecom/*.json có nguồn, URL, ngày công bố, trạng thái từng điểm) và BCTC từ
   window.TELECOM_FIN (data/telecom-financials.js). Chỉ mô tả dữ liệu: không kết luận, không chấm điểm, không chú thích
   thiếu dữ liệu trên trang (chỉ tiêu nào không có số thì không vẽ). Mọi chart có dòng "Nguồn:" hiện sẵn ở góc phải dưới. */
(() => {
'use strict';
const T = window.TELECOM || {series: {}, sources: []};
const F = window.TELECOM_FIN;
const fin = v => typeof v === 'number' && Number.isFinite(v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const dmy = d => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : (/^(\d{4})-(\d\d)$/.test(d || '') ? `${d.slice(5)}/${d.slice(0, 4)}` : (d || '')); };
const per = p => /^\d{4}Q\d$/.test(p) ? `Q${p.slice(-1)}/${p.slice(0, 4)}` : /^\d{4}-\d\d$/.test(p) ? `T${+p.slice(5)}/${p.slice(0, 4)}` : /^\d{4}-\d\d-\d\d$/.test(p) ? dmy(p) : p;
const COL = ['#1D2678', '#2a9fa3', '#c98a00', '#861C52', '#3d4653', '#8997D6', '#2938A8', '#9AA3BD'];
const OPC = {Viettel: '#C8394B', VNPT: '#2938A8', 'VNPT-VinaPhone': '#2938A8', VinaPhone: '#2938A8', MobiFone: '#2a9fa3', 'FPT Telecom': '#c98a00', FPT: '#c98a00', Vietnamobile: '#861C52', Gmobile: '#3d4653', 'Khác': '#9AA3BD'};
const SRCS = new Map((T.sources || []).map(s => [s.id, s]));
const S = k => T.series?.[k] || null;
const has = (...ks) => ks.every(k => S(k)?.points?.length);

/* ---------- Nguồn dưới chart ---------- */
function srcLine(ids, extra) {
  const list = [...new Set(ids.filter(x => x != null))].map(id => SRCS.get(id)).filter(Boolean);
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

/* ---------- Chuỗi số: căn kỳ, chỉ số 100, so cùng kỳ ---------- */
// Điểm theo năm: 'YYYY', hoặc cuối năm 'YYYY-12' / 'YYYYQ4' / 'YYYY-12-31' với chỉ tiêu tồn (stock).
function yearly(k) {
  const s = S(k); if (!s) return new Map();
  const m = new Map();
  s.points.forEach(([p, v]) => { if (!fin(v)) return; if (/^\d{4}$/.test(p)) m.set(p, v); });
  if (s.kind === 'stock') s.points.forEach(([p, v]) => { const y = p.slice(0, 4); if (!fin(v) || m.has(y)) return; if (/^\d{4}(-12|Q4|-12-31)$/.test(p)) m.set(y, v); });
  return m;
}
function align(keys, getter = yearly) {
  const maps = keys.map(k => getter(k)), cats = [...new Set(maps.flatMap(m => [...m.keys()]))].sort();
  return {cats, vals: maps.map(m => cats.map(c => m.has(c) ? m.get(c) : null))};
}
function index100(vals) {
  // Năm gốc: năm đầu tiên mọi chuỗi đều có số.
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

/* ---------- Card chart ---------- */
let seq = 0;
function chartCard(o) {
  const t = trimCats(o.cats, o.series.filter(s => s.values.some(fin)));
  if (!t.series.length || t.cats.length < (o.min ?? 2)) return null;
  const c = el('div', 'card pp-card vt-card'); c.dataset.blockId = o.id; c.dataset.updateKind = 'public'; c.dataset.cadence = o.cadence || 'monthly'; c.dataset.refreshStatus = 'snapshot';
  c.innerHTML = `<div class="chart-title">${esc(o.title)}</div>${o.sub ? `<div class="chart-sub">${esc(o.sub)}</div>` : ''}<div class="pp-host" id="${o.id}-host-${++seq}"></div>`;
  const host = c.querySelector('.pp-host');
  const model = {key: o.id, categories: t.cats.map(per), series: t.series, unit: o.unit || '', digits: o.digits ?? 1, stackable: !!o.stackable, native: o.native || 'line', zeroBase: o.zeroBase !== false, aria: o.title};
  queue.push(() => { if (window.ChartTypes) ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, model.native); }); });
  foot(c, o.src || [], o.note, o.extraSrc);
  return c;
}
function tableCard(id, title, head, rows, src, note, sub) {
  if (!rows.length) return null;
  const c = el('div', 'card pp-tcard vt-card'); c.dataset.blockId = id; c.dataset.updateKind = 'public'; c.dataset.cadence = 'on-data-change'; c.dataset.refreshStatus = 'snapshot';
  c.innerHTML = `<div class="chart-title">${esc(title)}</div>${sub ? `<div class="chart-sub">${esc(sub)}</div>` : ''}<div class="tablewrap"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  foot(c, src, note); return c;
}
function qpanel(num, q, nodes) {
  const ok = nodes.flat().filter(Boolean); if (!ok.length) return null;
  const p = el('section', 'pp-panel pp-q'); p.innerHTML = `<header class="pp-ph"><span class="pp-num">${esc(num)}</span><div><h3>${esc(q)}</h3></div></header>`;
  const g = el('div', ok.length > 1 ? 'grid two g2 vt-grid' : 'vt-one'); ok.forEach(n => g.append(n)); p.append(g); return p;
}
const queue = [];

/* ---------- Chuỗi tổng hợp từ BCTC (năm, tỷ đồng) ---------- */
function finYear(t, m) {
  if (!F) return new Map(); const d = F.data[t]?.[m]; const out = new Map(); if (!d) return out;
  const by = {}; F.periods.forEach((p, i) => { (by[p.slice(0, 4)] ||= []).push(d[i]); });
  Object.entries(by).forEach(([y, a]) => { if (a.length === 4 && a.every(fin)) out.set(y, a.reduce((x, z) => x + z, 0)); });
  return out;
}
const FIN_SRC = `<a href="https://api-finfo.vndirect.com.vn/v4/financial_statements" target="_blank" rel="noopener">BCTC hợp nhất (VNDirect finfo)</a>`;

/* ---------- Sub-tab ---------- */
function subtabs(pane, id, sections, defKey, param) {
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); pane.append(nav);
  const panes = {}, btns = [], done = new Set();
  sections.forEach(([key, num, label, title, goal, build]) => {
    const b = el('button', 'tabbtn pp-tab', `<span>${num}</span>${esc(label)}`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.section = key; nav.append(b); btns.push(b);
    const p = el('div', 'pane-subpane pp-pane'); p.id = `${id}-${key}`; p.hidden = true; p.setAttribute('role', 'tabpanel');
    p.innerHTML = `<header class="pp-head"><div><span class="pp-k">${num}</span><h2>${esc(title)}</h2><p>${esc(goal)}</p></div></header>`;
    pane.append(p); panes[key] = {p, build};
  });
  const select = (key, push) => {
    if (!panes[key]) key = defKey;
    Object.entries(panes).forEach(([k, x], i) => { const on = k === key; x.p.hidden = !on; btns[i].setAttribute('aria-selected', String(on)); btns[i].classList.toggle('active', on); });
    if (!done.has(key)) { done.add(key); try { panes[key].build(panes[key].p); } catch (e) { console.error(e); document.documentElement.dataset.vtError = (document.documentElement.dataset.vtError || '') + key + ':' + e.message + ';'; } queue.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
    if (push) { const u = new URL(location.href); u.searchParams.set(param, key); history.replaceState(null, '', u.pathname + u.search + '#' + id); }
    setTimeout(() => dispatchEvent(new Event('resize')), 30);
  };
  btns.forEach(b => b.addEventListener('click', () => select(b.dataset.section, true)));
  select(new URL(location.href).searchParams.get(param) || defKey, false);
  return select;
}

/* ================= Tổng quan ngành ================= */
function kpiTile(label, value, unit, sub, srcIds) {
  const k = el('div', 'kpi pp-kpi'); k.innerHTML = `<div class="label l">${esc(label)}</div><div class="value v">${value}${unit ? `<small> ${esc(unit)}</small>` : ''}</div><div class="delta pp-neutral">${sub || ''}</div>`;
  k.append(el('div', 'pw-src', srcLine(srcIds))); return k;
}
function lastPt(k) { const p = S(k)?.points?.filter(x => fin(x[1])); return p?.length ? p[p.length - 1] : null; }
function hero(c) {
  const g = el('section', 'grid kpis pp-kpis vt-hero'); const tiles = [];
  const add = (k, label, d = 1, noYoY) => { const p = lastPt(k); if (!p) return; const s = S(k); const prev = yearly(k), y = p[0].slice(0, 4), pv = prev.get(String(+y - 1));
    tiles.push(kpiTile(`${label} · ${per(p[0])}`, nf(p[1], d), s.unit, !noYoY && fin(pv) && /^\d{4}$/.test(p[0]) ? `${sg((p[1] / pv - 1) * 100)}% so năm trước` : '', [p[3]])); };
  const g5 = ev => (T.fiveg || []).filter(x => x.operator === 'Toàn quốc' && x.event === ev && x.status === 'actual' && fin(x.value)).sort((a, b) => a.date.localeCompare(b.date)).pop();
  add('rev', 'Doanh thu hoạt động viễn thông', 1, true); add('fix_bb', 'Thuê bao băng rộng cố định', 1);
  const s5 = g5('subscribers'), b5 = g5('stations');
  if (s5) tiles.push(kpiTile(`Thuê bao 5G · ${dmy(s5.date)}`, nf(s5.value, 1), 'triệu thuê bao', '', [s5.src]));
  if (b5) tiles.push(kpiTile(`Trạm 5G · ${dmy(b5.date)}`, nf(b5.value, 0), 'trạm', '', [b5.src]));
  tiles.slice(0, 4).forEach(t => g.append(t)); if (tiles.length) c.append(g);
}
// 00 Bản đồ ngành: tiền và hạ tầng đi qua ai.
function mapPane(p) {
  const L = (t, cls = '') => `<span class="vt-tk ${cls}">${t}</span>`;
  const col = (title, sub, items) => `<div class="vt-col"><b>${esc(title)}</b><small>${esc(sub)}</small><div>${items.join('')}</div></div>`;
  const c = el('div', 'card vt-chain'); c.dataset.blockId = 'vt-ov-chain'; c.dataset.updateKind = 'manual'; c.dataset.cadence = 'quarterly'; c.dataset.refreshStatus = 'snapshot';
  c.innerHTML = `<div class="chart-title">Chuỗi giá trị viễn thông và vị trí doanh nghiệp niêm yết</div>
  <div class="vt-flow">
    ${col('Phổ tần & cấp phép', 'Nhà nước đấu giá, cấp phép; nhà mạng trả tiền trúng đấu giá, phí tần số', ['Bộ KH&CN', 'Cục Tần số VTĐ', 'Cục Viễn thông'].map(x => L(x, 'gov')))}
    <i class="vt-arr">→</i>
    ${col('Thiết bị, tư vấn & xây lắp', 'Doanh thu theo CAPEX của nhà mạng', [L('CTR', 'ls') + '<em>xây lắp</em>', L('ELC', 'ls'), L('POT', 'ls'), L('ICT', 'ls'), L('Ericsson, Nokia, Viettel HT', 'un')])}
    <i class="vt-arr">→</i>
    ${col('Hạ tầng thụ động', 'Trạm, cột, nhà trạm, cáp quang; cho nhà mạng thuê theo số trạm × tỷ lệ thuê chung × giá thuê', [L('CTR', 'ls') + '<em>TowerCo</em>', L('Nhà mạng tự sở hữu', 'un'), L('TowerCo khác', 'un')])}
    <i class="vt-arr">→</i>
    ${col('Nhà mạng', 'Thuê bao × ARPU; đầu tư mạng lưới, khấu hao', [L('Viettel', 'un'), L('VNPT', 'un'), L('MobiFone', 'un'), L('FOX', 'ls') + '<em>Internet cố định</em>', L('Vietnamobile, MVNO', 'un'), L('MFS, TTN, VTC', 'ls') + '<em>dịch vụ</em>'])}
    <i class="vt-arr">→</i>
    ${col('Khách hàng', 'Cá nhân, hộ gia đình, doanh nghiệp, Chính phủ', [L('Di động: thoại, SMS, data', 'un'), L('Internet cố định, truyền hình', 'un'), L('Kênh thuê riêng, trung tâm dữ liệu', 'un')])}
  </div>
  <div class="vt-intl">${L('VGI', 'ls')} Viettel Global: nhà mạng tại 10 thị trường nước ngoài (Đông Nam Á, châu Phi, Mỹ Latinh), doanh thu theo thuê bao và ARPU ở các nước đó.</div>
  <div class="vt-legend">${L('Mã', 'ls')} doanh nghiệp niêm yết · ${L('Tên', 'un')} doanh nghiệp chưa niêm yết · ${L('Cơ quan', 'gov')} quản lý nhà nước</div>`;
  c.append(el('div', 'pw-src', 'Nguồn: Luật Viễn thông 2023; công bố thông tin doanh nghiệp (CTR, FOX, VGI, ELC, POT, ICT, MFS)'));
  p.append(qpanel('0.1', 'Tiền và hạ tầng trong ngành viễn thông đi qua những ai?', [c]));
  // 0.2 Ba mô hình kinh doanh
  const m = tableCard('vt-ov-models', 'Ba mô hình kinh doanh và biến số quyết định doanh thu', ['Mô hình', 'Cơ chế tạo doanh thu', 'Biến số kinh tế', 'Chi phí chính', 'Doanh nghiệp niêm yết'], [
    ['<b>Viễn thông di động</b>', 'Thuê bao × ARPU', 'Thuê bao phát sinh lưu lượng, lưu lượng data, giá cước, cơ cấu dịch vụ (thoại, SMS, data)', 'Khấu hao mạng, tần số, thuê hạ tầng, bán hàng', 'Chưa niêm yết (Viettel, VNPT, MobiFone); VGI ở thị trường nước ngoài'],
    ['<b>Internet cố định</b>', 'Thuê bao × ARPU', 'Thuê bao FTTH, tỷ lệ hộ có kết nối, thuê bao mới ròng, thị phần, giá gói', 'Khấu hao cáp quang và thiết bị đầu cuối, nhân công lắp đặt', 'FOX'],
    ['<b>Hạ tầng viễn thông & TowerCo</b>', 'Số trạm × tỷ lệ thuê chung × giá thuê; xây lắp theo hợp đồng', 'CAPEX nhà mạng, số trạm, số khách thuê trên trạm, thời hạn hợp đồng', 'Đầu tư trạm, thuê đất, điện, bảo trì', 'CTR; xây lắp, thiết bị: ELC, POT, ICT']
  ], [], null);
  m?.querySelector('.pw-src')?.remove(); m?.append(el('div', 'pw-src', 'Nguồn: tổng hợp cơ chế doanh thu từ BCTN CTR, FOX, VGI'));
  p.append(qpanel('0.2', 'Mỗi mô hình kinh doanh tạo doanh thu và tốn chi phí ở đâu?', [m]));
}
function listedPane(p) {
  // 1.1 Quy mô doanh nghiệp niêm yết (BCTC)
  if (F) {
    const last = F.periods.length - 1, ttm = (t, m) => { const a = F.data[t]?.[m]?.slice(last - 3, last + 1); return a && a.length === 4 && a.every(fin) ? a.reduce((x, y) => x + y, 0) : null; };
    const stock = (t, m) => F.data[t]?.[m]?.[last];
    const rows = F.companies.map(co => { const g = F.groups.find(x => x.id === co.group); const rv = ttm(co.ticker, 'revenue'), np = ttm(co.ticker, 'npat'), gp = ttm(co.ticker, 'gross'), cx = ttm(co.ticker, 'capex');
      const ebitda = (ttm(co.ticker, 'op_profit') ?? 0) - (ttm(co.ticker, 'fin_income') ?? 0) + (ttm(co.ticker, 'fin_exp') ?? 0) + (ttm(co.ticker, 'da') ?? 0);
      return {rv, row: [`<b>${co.ticker}</b>`, `<i class="vt-dot" style="background:${g?.color}"></i>${esc(g?.label || '')}`, esc(co.note || ''), nf(rv), nf(np), fin(rv) && rv ? nf(gp / rv * 100, 1) + '%' : '—', fin(rv) && rv && fin(ttm(co.ticker, 'da')) ? nf(ebitda / rv * 100, 1) + '%' : '—', fin(rv) && rv && fin(cx) ? nf(cx / rv * 100, 1) + '%' : '—', nf(stock(co.ticker, 'total_assets'))]}; })
      .sort((a, b) => (b.rv ?? -1) - (a.rv ?? -1)).map(x => x.row);
    const t = tableCard('vt-ov-listed', `Doanh nghiệp niêm yết có hoạt động viễn thông · 4 quý đến ${per(F.periods[last])}`, ['Mã', 'Nhóm mô hình', 'Hoạt động chính', 'Doanh thu (tỷ đ)', 'LNST (tỷ đ)', 'Biên gộp', 'Biên EBITDA', 'CAPEX/doanh thu', 'Tổng tài sản (tỷ đ)'], rows, [], 'EBITDA = LN thuần HĐKD − doanh thu tài chính + chi phí tài chính + khấu hao; CAPEX = tiền chi mua sắm, xây dựng TSCĐ (LCTT)');
    t?.querySelector('.pw-src')?.remove(); if (t) { t.insertBefore(el('div', 'pw-src', `Nguồn: ${FIN_SRC}; tự tính`), t.querySelector('.pw-src-note')); }
    p.append(qpanel('1.1', 'Doanh nghiệp niêm yết nào có hoạt động viễn thông, quy mô ra sao?', [t]));
  }
}
function modelsNote() { return 'Không gộp FOX, CTR, VGI thành một nhóm đồng nhất: ba doanh nghiệp thuộc ba mô hình kinh doanh khác nhau.'; }

/* ================= Bức tranh ngành ================= */
function growthPane(p) {
  // 1.1 Doanh thu so với thuê bao (chỉ số 100)
  const K = [['rev', 'Doanh thu hoạt động viễn thông'], ['mob_subs', 'Thuê bao di động'], ['fix_bb', 'Thuê bao băng rộng cố định']].filter(([k]) => has(k));
  const a = align(K.map(x => x[0])), ix = index100(a.vals);
  const REVN = 'Doanh thu: số ước tính lần đầu mỗi năm của Cục Thống kê (khái niệm rộng), từ 2021 sau đợt điều chỉnh số 2020; tăng trưởng Cục công bố tính trên số năm trước đã điều chỉnh nên có thể khác';
  const c1 = ix.base >= 0 ? chartCard({id: 'vt-gr-index', title: `Doanh thu và thuê bao, chỉ số ${a.cats[ix.base]} = 100`, sub: 'Cuối năm với thuê bao; cả năm với doanh thu', cats: a.cats, series: K.map(([k, n], i) => ({name: n, color: COL[i], values: ix.vals[i]})), unit: 'điểm', digits: 1, zeroBase: false, src: seriesSrc(K.map(x => x[0])), cadence: 'yearly', note: REVN}) : null;
  const c2 = chartCard({id: 'vt-gr-yoy', title: 'Tăng trưởng so với năm trước (%)', cats: a.cats, series: K.map(([k, n], i) => ({name: n, color: COL[i], values: yoy(a.vals[i])})), unit: '%', digits: 1, zeroBase: false, native: 'line', src: seriesSrc(K.map(x => x[0])), cadence: 'yearly', note: REVN});
  const rv = align(['rev', 'rev_mic']);
  const c2b = has('rev_mic') ? chartCard({id: 'vt-gr-revdef', title: 'Hai cách đo doanh thu viễn thông (nghìn tỷ đồng)', sub: 'Cục Thống kê: doanh thu hoạt động viễn thông (rộng) · Bộ KH&CN: doanh thu dịch vụ viễn thông', cats: rv.cats, series: [{name: 'Cục Thống kê', color: COL[0], values: rv.vals[0], kind: 'bar'}, {name: 'Bộ TT&TT / Bộ KH&CN', color: COL[2], values: rv.vals[1], kind: 'bar'}], unit: 'nghìn tỷ đ', digits: 1, native: 'bar', src: seriesSrc(['rev', 'rev_mic']), cadence: 'yearly', note: 'Hai định nghĩa khác phạm vi, không cộng hay so trực tiếp'}) : null;
  const ru = align(['rev_mobile_usd', 'rev_fixed_usd']);
  const c2c = has('rev_mobile_usd') ? chartCard({id: 'vt-gr-revmix', title: 'Doanh thu dịch vụ viễn thông theo phân khúc (triệu USD)', cats: ru.cats, series: [{name: 'Di động mặt đất', color: COL[0], values: ru.vals[0], kind: 'bar'}, {name: 'Cố định mặt đất', color: COL[2], values: ru.vals[1], kind: 'bar'}], unit: 'triệu USD', digits: 0, native: 'stack', stackable: true, src: seriesSrc(['rev_mobile_usd', 'rev_fixed_usd']), cadence: 'yearly', note: 'Sách Trắng CNTT-TT; các năm sau không công bố tách phân khúc'}) : null;
  p.append(qpanel('1.1', 'Doanh thu ngành tăng nhanh hay chậm hơn số thuê bao?', [c1, c2, c2b, c2c]));
  // 1.2 Thuê bao mới ròng
  const N = [['mob_subs', 'Di động'], ['mob_bb', 'Băng rộng di động'], ['fix_bb', 'Băng rộng cố định'], ['subs_4g', '4G']].filter(([k]) => has(k));
  const b = align(N.map(x => x[0]));
  const c3 = chartCard({id: 'vt-gr-netadd', title: 'Thuê bao tăng thêm ròng trong năm (triệu thuê bao)', sub: 'Chênh lệch số thuê bao cuối năm', cats: b.cats, series: N.map(([k, n], i) => ({name: n, color: COL[i], values: diff(b.vals[i]), kind: 'bar'})), unit: 'triệu', digits: 2, native: 'bar', src: seriesSrc(N.map(x => x[0])), cadence: 'yearly', note: 'Năm 2018 và 2024–2026 có đợt chuẩn hóa, khóa thuê bao không chính chủ; thay đổi số thuê bao gồm cả phần làm sạch dữ liệu'});
  p.append(qpanel('1.2', 'Tăng trưởng thuê bao đang tăng tốc hay giảm tốc?', [c3]));
  // 1.3 Mức thâm nhập
  const pop = yearly('pop'), hh = yearly('hh');
  const pen = [['mob_subs', 'Thuê bao di động / 100 dân', pop, 100], ['mob_bb', 'Băng rộng di động / 100 dân', pop, 100], ['fix_bb', 'Băng rộng cố định / 100 hộ', hh, 100]].filter(([k, , d]) => has(k) && d.size);
  const cs = [...new Set(pen.flatMap(([k]) => [...yearly(k).keys()]))].sort();
  const c4 = chartCard({id: 'vt-gr-pen', title: 'Mức thâm nhập dịch vụ', sub: 'Thuê bao cuối năm ÷ dân số hoặc số hộ (tự tính)', cats: cs, series: pen.map(([k, n, d, sc], i) => ({name: n, color: COL[i], values: cs.map(y => { const v = yearly(k).get(y), dd = d.get(y); return fin(v) && fin(dd) && dd ? v / dd * sc : null; })})), unit: 'thuê bao', digits: 1, zeroBase: false, src: seriesSrc([...pen.map(x => x[0]), 'pop', 'hh']), cadence: 'yearly', note: 'Thuê bao di động tính theo SIM, một người có thể dùng nhiều SIM'});
  const bm = window.TELECOM_BENCH; let c5 = null;
  if (bm?.series?.mobile_per100) { const s = bm.series.mobile_per100, ys = [...new Set(Object.values(s.data).flatMap(Object.keys))].sort().filter(y => y >= '2015');
    c5 = chartCard({id: 'vt-gr-bench', title: 'Thuê bao di động trên 100 dân: Việt Nam và ASEAN', cats: ys, series: Object.entries(bm.countries).map(([c, n], i) => ({name: n, color: c === 'VNM' ? '#C8394B' : COL[i], values: ys.map(y => s.data[c]?.[y] ?? null)})), unit: 'thuê bao/100 dân', digits: 1, zeroBase: false, src: [], extraSrc: `<a href="https://data.worldbank.org/indicator/IT.CEL.SETS.P2" target="_blank" rel="noopener">World Bank WDI (ITU)</a>`, cadence: 'yearly'}); }
  p.append(qpanel('1.3', 'Phân khúc nào còn dư địa mở rộng số khách hàng?', [c4, c5]));
}
function dataPane(p) {
  const K = [['traffic_mobile', 'Lưu lượng data di động'], ['rev', 'Doanh thu dịch vụ viễn thông'], ['mob_bb', 'Thuê bao băng rộng di động']].filter(([k]) => has(k));
  const a = align(K.map(x => x[0])), ix = index100(a.vals);
  const c1 = ix.base >= 0 && has('traffic_mobile') ? chartCard({id: 'vt-data-index', title: `Lưu lượng data so với doanh thu, chỉ số ${a.cats[ix.base]} = 100`, cats: a.cats, series: K.map(([k, n], i) => ({name: n, color: COL[i], values: ix.vals[i]})), unit: 'điểm', digits: 0, zeroBase: false, src: seriesSrc(K.map(x => x[0])), cadence: 'yearly'}) : null;
  const G = [['gb_sub', 'GB/thuê bao/tháng']].filter(([k]) => has(k)), g = align(G.map(x => x[0]));
  const c2 = G.length ? chartCard({id: 'vt-data-gb', title: 'Data tiêu thụ bình quân trên mỗi thuê bao di động (GB/tháng)', cats: g.cats, series: G.map(([k, n], i) => ({name: n, color: COL[i], values: g.vals[i], kind: 'bar'})), unit: 'GB/tháng', digits: 1, native: 'bar', src: seriesSrc(['gb_sub']), cadence: 'yearly'}) : null;
  const DM = [['rev_mobile_usd', 'Doanh thu dịch vụ di động (USD)'], ['mob_data_users', 'Thuê bao di động có dùng data'], ['mob_bb', 'Thuê bao băng rộng di động']].filter(([k]) => has(k)), dm = align(DM.map(x => x[0])), dmi = index100(dm.vals);
  const c1b = dmi.base >= 0 ? chartCard({id: 'vt-data-users-rev', title: `Người dùng data so với doanh thu di động, chỉ số ${dm.cats[dmi.base]} = 100`, cats: dm.cats, series: DM.map(([k, n], i) => ({name: n, color: COL[i], values: dmi.vals[i]})), unit: 'điểm', digits: 0, zeroBase: false, src: seriesSrc(DM.map(x => x[0])), cadence: 'yearly', note: 'Doanh thu theo phân khúc chỉ có đến 2018 (Sách Trắng)'}) : null;
  p.append(qpanel('2.1', 'Lưu lượng data tăng có đi kèm tăng doanh thu không?', [c1, c2, c1b]));
  const A = [['arpu_mobile', 'ARPU di động'], ['arpu_fixed', 'ARPU Internet cố định']].filter(([k]) => has(k)), ar = align(A.map(x => x[0]));
  const c3 = A.length ? chartCard({id: 'vt-data-arpu', title: 'ARPU theo công bố', cats: ar.cats, series: A.map(([k, n], i) => ({name: n, color: COL[i], values: ar.vals[i]})), unit: S(A[0][0]).unit, digits: 0, zeroBase: false, src: seriesSrc(A.map(x => x[0])), cadence: 'yearly', note: S(A[0][0]).def}) : null;
  const exact = k => new Map((S(k)?.points || []).filter(x => fin(x[1])).map(x => [x[0], x[1]]));
  const sh = align(['mob_data_users', 'mob_traffic_subs'], exact);
  const c4 = has('mob_data_users', 'mob_traffic_subs') ? chartCard({id: 'vt-data-share', title: 'Tỷ lệ thuê bao di động có dùng data (%)', sub: 'Thuê bao có dùng dữ liệu ÷ thuê bao phát sinh lưu lượng, cùng nguồn Bộ TT&TT', cats: sh.cats, series: [{name: 'Thuê bao dùng data / thuê bao phát sinh lưu lượng', color: COL[0], values: sh.cats.map((_, i) => fin(sh.vals[0][i]) && fin(sh.vals[1][i]) ? sh.vals[0][i] / sh.vals[1][i] * 100 : null), kind: 'bar'}], unit: '%', digits: 1, native: 'bar', src: seriesSrc(['mob_data_users', 'mob_traffic_subs']), cadence: 'on-data-change'}) : null;
  p.append(qpanel('2.2', 'Người dùng chuyển sang data đến mức nào, và mức chi tiêu thay đổi ra sao?', [c4, c3]));
  const pr = (T.prices || []).filter(x => x.segment === 'mobile');
  const c5 = tableCard('vt-data-prices', 'Gói cước data di động tiêu biểu theo thời điểm', ['Ngày', 'Nhà mạng', 'Gói', 'Giá (đồng/tháng)', 'Dung lượng'], pr.map(x => [dmy(x.date), esc(x.operator), esc(x.package), nf(x.price_vnd_month), esc(x.speed_or_quota)]), pr.map(x => x.src), 'Giá niêm yết, không phải ARPU thực tế');
  p.append(qpanel('2.3', 'Giá gói data niêm yết đang ở mức nào?', [c5]));
}
function fivegPane(p) {
  const fg = T.fiveg || [], pts = (ev, op) => fg.filter(x => x.event === ev && x.status === 'actual' && (!op || x.operator === op) && fin(x.value));
  const subsN = pts('subscribers', 'Toàn quốc'), stN = pts('stations', 'Toàn quốc');
  const ds = [...new Set([...subsN, ...stN].map(x => x.date.slice(0, 7)))].sort();
  const c1 = chartCard({id: 'vt-5g-subs', title: 'Thuê bao 5G và số trạm 5G toàn quốc', sub: 'Theo các đợt công bố của Bộ KH&CN', cats: ds, series: [{name: 'Thuê bao 5G (triệu)', color: COL[0], values: ds.map(d => subsN.find(x => x.date.startsWith(d))?.value ?? null), kind: 'bar'}, {name: 'Trạm 5G (nghìn trạm)', color: COL[2], values: ds.map(d => { const v = stN.find(x => x.date.startsWith(d))?.value; return fin(v) ? v / 1000 : null; }), kind: 'bar'}], unit: '', digits: 1, native: 'bar', src: [...subsN, ...stN].map(x => x.src), min: 2, cadence: 'on-data-change'});
  const mb = yearly('mob_bb'), lastMb = [...mb.entries()].pop();
  const shareRows = subsN.map(x => { const y = x.date.slice(0, 4), base = mb.get(y) ?? (lastMb && lastMb[0] <= y ? lastMb[1] : null); return [dmy(x.date), nf(x.value, 1), fin(base) ? nf(base, 1) : '—', fin(base) ? nf(x.value / base * 100, 1) + '%' : '—']; });
  const c2 = tableCard('vt-5g-share', 'Thuê bao 5G so với tổng thuê bao băng rộng di động', ['Thời điểm', 'Thuê bao 5G (triệu)', 'Băng rộng di động (triệu)', 'Tỷ lệ'], shareRows, [...subsN.map(x => x.src), ...seriesSrc(['mob_bb'])], 'Mẫu số là số băng rộng di động gần nhất đã công bố cùng năm hoặc trước đó');
  p.append(qpanel('3.1', 'Hạ tầng 5G và thuê bao 5G đang tăng cùng nhịp không?', [c1, c2]));
  const opRows = fg.filter(x => x.operator !== 'Toàn quốc' && ['launch', 'stations', 'subscribers', 'target'].includes(x.event)).sort((a, b) => a.date.localeCompare(b.date))
    .map(x => [dmy(x.date), esc(x.operator), {launch: 'Khai trương', stations: 'Số trạm', subscribers: 'Thuê bao', target: 'Mục tiêu'}[x.event] + (x.status === 'target' ? ' (kế hoạch)' : ''), fin(x.value) ? `${nf(x.value, x.value < 100 ? 1 : 0)} ${esc(x.unit)}` : '—', esc(x.text)]);
  p.append(qpanel('3.2', 'Từng nhà mạng triển khai 5G nhanh đến đâu so với kế hoạch?', [tableCard('vt-5g-ops', 'Mốc 5G theo nhà mạng: thực tế và kế hoạch', ['Ngày', 'Nhà mạng', 'Loại', 'Giá trị', 'Nội dung'], opRows, fg.filter(x => x.operator !== 'Toàn quốc').map(x => x.src), 'Kế hoạch, mục tiêu ghi rõ "(kế hoạch)"; không cộng với số thực tế')]));
  const sp = (T.spectrum || []).filter(x => fin(x.price_bn_vnd));
  const c4 = chartCard({id: 'vt-5g-spectrum', title: 'Giá trúng đấu giá tần số so với giá khởi điểm (tỷ đồng)', cats: sp.map(x => `${x.winner} · ${x.band.split(' (')[0]}`), series: [{name: 'Giá khởi điểm', color: '#9AA3BD', values: sp.map(x => x.reserve_bn_vnd), kind: 'bar'}, {name: 'Giá trúng', color: COL[0], values: sp.map(x => x.price_bn_vnd), kind: 'bar'}], unit: 'tỷ đ', digits: 0, native: 'bar', src: sp.map(x => x.src), min: 1, cadence: 'on-data-change', note: 'Chi tiết từng khối, nghĩa vụ triển khai: tab Chính sách'});
  // CAPEX nhà mạng và doanh thu xây lắp CTR
  const CX = [['op_capex_viettel', 'CAPEX Viettel'], ['op_capex_vnpt', 'CAPEX VNPT'], ['op_capex_mobifone', 'CAPEX MobiFone'], ['ctr_rev_build', 'Doanh thu xây lắp CTR']].filter(([k]) => has(k)), cx = align(CX.map(x => x[0]));
  const c5 = CX.some(([k]) => k.startsWith('op_capex')) ? chartCard({id: 'vt-5g-capex', title: 'Đầu tư của nhà mạng và doanh thu xây lắp hạ tầng (nghìn tỷ đồng)', cats: cx.cats, series: CX.map(([k, n], i) => ({name: n, color: COL[i], values: cx.vals[i].map((v, j) => fin(v) ? (S(k).unit.startsWith('tỷ') ? v / 1000 : v) : null), kind: 'bar'})), unit: 'nghìn tỷ đ', digits: 1, native: 'bar', src: seriesSrc(CX.map(x => x[0])), cadence: 'yearly'}) : null;
  p.append(qpanel('3.3', 'Chi phí tần số và đầu tư mạng lưới của nhà mạng thay đổi thế nào?', [c4, c5]));
}
function fixedPane(p) {
  const K = [['fix_bb', 'Băng rộng cố định'], ['ftth', 'Cáp quang (FTTH)']].filter(([k]) => has(k)), a = align(K.map(x => x[0]));
  const c1 = chartCard({id: 'vt-fx-subs', title: 'Thuê bao Internet băng rộng cố định (triệu thuê bao)', cats: a.cats, series: K.map(([k, n], i) => ({name: n, color: COL[i], values: a.vals[i], kind: 'bar'})), unit: 'triệu', digits: 2, native: 'bar', src: seriesSrc(K.map(x => x[0])), cadence: 'yearly'});
  const hh = yearly('hh'), fx = yearly('fix_bb'), cs = [...fx.keys()].filter(y => hh.has(y)).sort();
  const c2 = cs.length > 1 ? chartCard({id: 'vt-fx-hh', title: 'Thuê bao băng rộng cố định trên số hộ gia đình (%) và thuê bao tăng thêm ròng', cats: cs, series: [{name: 'Thuê bao / số hộ (%)', color: COL[0], values: cs.map(y => fx.get(y) / hh.get(y) * 100)}, {name: 'Tăng thêm ròng (triệu, ×10)', color: COL[2], values: diff(cs.map(y => fx.get(y))).map(v => fin(v) ? v * 10 : null), kind: 'bar'}], unit: '', digits: 1, src: seriesSrc(['fix_bb', 'hh']), cadence: 'yearly', note: 'Thuê bao gồm cả khách hàng doanh nghiệp, nên tỷ lệ trên số hộ cao hơn tỷ lệ hộ thực có kết nối'}) : null;
  const fh = align(['ftth_hh_pct']);
  const c2b = has('ftth_hh_pct') ? chartCard({id: 'vt-fx-hhpct', title: 'Tỷ lệ hộ gia đình sử dụng cáp quang (%)', cats: fh.cats, series: [{name: 'Hộ dùng cáp quang', color: COL[1], values: fh.vals[0], kind: 'bar'}], unit: '%', digits: 1, native: 'bar', src: seriesSrc(['ftth_hh_pct']), cadence: 'yearly', note: 'Bảng số liệu nổi bật của Bộ; các công bố khác lệch 0,2–1,6 điểm %'}) : null;
  const fx2 = align(['ftth', 'xdsl']);
  const c2c = has('ftth', 'xdsl') ? chartCard({id: 'vt-fx-tech', title: 'Thuê bao băng rộng cố định theo công nghệ (triệu thuê bao)', cats: fx2.cats, series: [{name: 'Cáp quang (FTTH)', color: COL[0], values: fx2.vals[0], kind: 'bar'}, {name: 'xDSL', color: '#9AA3BD', values: fx2.vals[1], kind: 'bar'}], unit: 'triệu', digits: 2, native: 'stack', stackable: true, src: seriesSrc(['ftth', 'xdsl']), cadence: 'yearly'}) : null;
  p.append(qpanel('4.1', 'Thuê bao Internet cố định còn tăng nhanh không, đã phủ bao nhiêu hộ?', [c1, c2b, c2c, c2]));
  const sh = T.shares?.fixed || {}, yrs = Object.keys(sh).sort(), ops = [...new Set(yrs.flatMap(y => Object.keys(sh[y])))];
  const c3 = yrs.length ? chartCard({id: 'vt-fx-share', title: 'Thị phần thuê bao băng rộng cố định (%)', cats: yrs, series: ops.map((o, i) => ({name: o, color: OPC[o] || COL[i], values: yrs.map(y => sh[y][o] ?? null), kind: 'bar'})), unit: '%', digits: 1, native: 'stack', stackable: true, src: T.shares?.fixed_src || [], min: 1, cadence: 'yearly'}) : null;
  // FOX so với thị trường
  const foxRev = finYear('FOX', 'revenue'), cy = [...foxRev.keys()].filter(y => fx.has(y)).sort();
  const fs = has('fox_subs') ? yearly('fox_subs') : null;
  const ser = [{name: 'Doanh thu FOX', color: '#c98a00', values: yoy(cy.map(y => foxRev.get(y)))}, {name: 'Thuê bao cố định toàn thị trường', color: COL[0], values: yoy(cy.map(y => fx.get(y)))}];
  if (fs) ser.push({name: 'Thuê bao băng rộng FOX', color: COL[1], values: yoy(cy.map(y => fs.get(y) ?? null))});
  const c4 = cy.length > 2 ? chartCard({id: 'vt-fx-fox', title: 'FOX so với thị trường: tăng trưởng so với năm trước (%)', cats: cy, series: ser, unit: '%', digits: 1, zeroBase: false, src: seriesSrc(['fix_bb', 'fox_subs']), extraSrc: FIN_SRC, cadence: 'yearly', note: 'Doanh thu FOX hợp nhất gồm cả truyền hình, trung tâm dữ liệu'}) : null;
  p.append(qpanel('4.2', 'Doanh nghiệp nào tăng nhanh hơn thị trường, thị phần dịch chuyển ra sao?', [c3, c4]));
  const bm = window.TELECOM_BENCH; let c5 = null, c6 = null;
  if (bm?.series?.fixed_bb_per100) { const s = bm.series.fixed_bb_per100, ys = [...new Set(Object.values(s.data).flatMap(Object.keys))].sort().filter(y => y >= '2012');
    c5 = chartCard({id: 'vt-fx-asean', title: 'Băng rộng cố định trên 100 dân: Việt Nam và ASEAN', cats: ys, series: Object.entries(bm.countries).map(([c, n], i) => ({name: n, color: c === 'VNM' ? '#C8394B' : COL[i], values: ys.map(y => s.data[c]?.[y] ?? null)})), unit: 'thuê bao/100 dân', digits: 1, zeroBase: false, src: [], extraSrc: `<a href="https://data.worldbank.org/indicator/IT.NET.BBND.P2" target="_blank" rel="noopener">World Bank WDI (ITU)</a>`, cadence: 'yearly', note: 'Tính trên 100 dân, không phải trên số hộ; quy mô hộ khác nhau giữa các nước'});
    const g = bm.series.gdp_pc, last = c => { const e = Object.entries(s.data[c] || {}); return e.length ? e[e.length - 1] : null; };
    c6 = tableCard('vt-fx-asean-t', 'So sánh kỳ mới nhất', ['Quốc gia', 'Băng rộng cố định/100 dân', 'Năm', 'GDP bình quân đầu người (USD)', 'Năm'], Object.entries(bm.countries).map(([c, n]) => { const l = last(c), gl = Object.entries(g?.data?.[c] || {}).pop(); return [c === 'VNM' ? `<b>${n}</b>` : n, l ? nf(l[1], 1) : '—', l?.[0], gl ? nf(gl[1], 0) : '—', gl?.[0]]; }), [], null);
    c6?.querySelector('.pw-src')?.remove(); c6?.append(el('div', 'pw-src', 'Nguồn: <a href="https://data.worldbank.org/indicator/IT.NET.BBND.P2" target="_blank" rel="noopener">World Bank WDI (ITU)</a>')); }
  p.append(qpanel('4.3', 'Mức thâm nhập Internet cố định của Việt Nam so với các nước trong khu vực?', [c5, c6]));
  const pr = (T.prices || []).filter(x => x.segment === 'fixed');
  p.append(qpanel('4.4', 'Giá gói Internet cố định thay đổi thế nào?', [tableCard('vt-fx-prices', 'Gói cáp quang thấp nhất theo thời điểm', ['Ngày', 'Nhà mạng', 'Gói', 'Giá (đồng/tháng)', 'Tốc độ'], pr.map(x => [dmy(x.date), esc(x.operator), esc(x.package), nf(x.price_vnd_month), esc(x.speed_or_quota)]), pr.map(x => x.src), 'Giá niêm yết cho khách lắp mới; khách hiện hữu giữ giá theo hợp đồng')]));
}
function towerPane(p) {
  const K = [['ctr_towers', 'Số trạm sở hữu']].filter(([k]) => has(k)), tk = S('ctr_towers');
  const tp = tk ? tk.points.filter(x => fin(x[1])) : [];
  const c1 = tp.length > 1 ? chartCard({id: 'vt-tw-towers', title: 'CTR: số trạm sở hữu (trạm)', cats: tp.map(x => x[0]), series: [{name: 'Số trạm sở hữu', color: COL[0], values: tp.map(x => x[1]), kind: 'bar'}], unit: 'trạm', digits: 0, native: 'bar', src: tp.map(x => x[3]), cadence: 'monthly'}) : null;
  const tn = S('ctr_tenancy')?.points.filter(x => fin(x[1])) || [];
  const c2 = tn.length > 1 ? chartCard({id: 'vt-tw-tenancy', title: 'CTR: tỷ lệ thuê chung (số khách thuê bình quân trên trạm, lần)', cats: tn.map(x => x[0]), series: [{name: 'Tỷ lệ thuê chung', color: COL[2], values: tn.map(x => x[1])}], unit: 'lần', digits: 2, zeroBase: false, src: tn.map(x => x[3]), cadence: 'monthly'}) : null;
  const ct = S('ctr_cotenant')?.points.filter(x => fin(x[1])) || [];
  const c2b = ct.length > 1 ? chartCard({id: 'vt-tw-cotenant', title: 'CTR: số trạm có từ 2 nhà mạng thuê trở lên (trạm)', cats: ct.map(x => x[0]), series: [{name: 'Trạm có ≥2 khách thuê', color: COL[1], values: ct.map(x => x[1]), kind: 'bar'}], unit: 'trạm', digits: 0, native: 'bar', src: ct.map(x => x[3]), cadence: 'monthly'}) : null;
  p.append(qpanel('5.1', 'TowerCo tăng trưởng nhờ thêm trạm hay nhờ thêm khách thuê trên mỗi trạm?', [c1, c2, c2b]));
  const SEG = [['ctr_rev_build', 'Xây lắp'], ['ctr_rev_om', 'Vận hành khai thác'], ['ctr_rev_infra', 'Hạ tầng cho thuê'], ['ctr_rev_solution', 'Giải pháp tích hợp']].filter(([k]) => has(k)), sg2 = align(SEG.map(x => x[0]));
  const c3 = SEG.length ? chartCard({id: 'vt-tw-seg', title: 'CTR: doanh thu theo mảng (tỷ đồng)', cats: sg2.cats, series: SEG.map(([k, n], i) => ({name: n, color: COL[i], values: sg2.vals[i], kind: 'bar'})), unit: 'tỷ đ', digits: 0, native: 'stack', stackable: true, src: seriesSrc(SEG.map(x => x[0])), cadence: 'yearly', note: 'Số theo mảng do CTR công bố; tổng có thể khác doanh thu thuần hợp nhất'}) : null;
  // Doanh thu cho thuê trên mỗi trạm
  const inf = yearly('ctr_rev_infra'), tw = yearly('ctr_towers'), ys = [...inf.keys()].filter(y => tw.has(y)).sort();
  const c4 = ys.length > 1 ? chartCard({id: 'vt-tw-bridge', title: 'CTR: doanh thu cho thuê hạ tầng, số trạm và doanh thu trên mỗi trạm (chỉ số năm đầu = 100)', cats: ys, series: [{name: 'Doanh thu cho thuê', color: COL[0], values: ys.map(y => inf.get(y) / inf.get(ys[0]) * 100)}, {name: 'Số trạm cuối năm', color: COL[2], values: ys.map(y => tw.get(y) / tw.get(ys[0]) * 100)}, {name: 'Doanh thu cho thuê / trạm', color: COL[3], values: ys.map(y => (inf.get(y) / tw.get(y)) / (inf.get(ys[0]) / tw.get(ys[0])) * 100)}], unit: 'điểm', digits: 0, zeroBase: false, src: seriesSrc(['ctr_rev_infra', 'ctr_towers']), cadence: 'yearly', note: 'Doanh thu/trạm dùng số trạm cuối năm, chưa phải số trạm khai thác bình quân'}) : null;
  p.append(qpanel('5.2', 'Doanh thu cho thuê tăng nhanh hay chậm hơn số trạm, mảng nào đóng góp chính?', [c3, c4]));
  const GM = [['ctr_gm_infra', 'Hạ tầng cho thuê'], ['ctr_gm_om', 'Vận hành khai thác'], ['ctr_gm_build', 'Xây lắp'], ['ctr_gm_solution', 'Giải pháp tích hợp']].filter(([k]) => has(k)), gm = align(GM.map(x => x[0]));
  const c5 = GM.length ? chartCard({id: 'vt-tw-margin', title: 'CTR: biên lợi nhuận gộp theo mảng (%)', cats: gm.cats, series: GM.map(([k, n], i) => ({name: n, color: COL[(i + 2) % COL.length], values: gm.vals[i], kind: 'bar'})), unit: '%', digits: 1, native: 'bar', src: seriesSrc(GM.map(x => x[0])), min: 1, cadence: 'yearly'}) : null;
  const vs = align(['ctr_viettel_share']);
  const c6 = has('ctr_viettel_share') ? chartCard({id: 'vt-tw-viettel', title: 'CTR: tỷ trọng doanh thu từ Tập đoàn Viettel (%)', cats: vs.cats, series: [{name: 'Doanh thu từ Viettel / tổng doanh thu', color: '#C8394B', values: vs.vals[0], kind: 'bar'}], unit: '%', digits: 0, native: 'bar', src: seriesSrc(['ctr_viettel_share']), cadence: 'yearly'}) : null;
  p.append(qpanel('5.3', 'Mảng nào có biên lợi nhuận cao hơn, và CTR phụ thuộc vào khách hàng lớn đến mức nào?', [c5, c6]));
  const LB = T.labelled || {}, own = k => LB[k] ? LB[k].rows : [];
  const tot = k => own(k).reduce((a, r) => a + r[1], 0);
  const ownRows = [['tower_owner_2019', 'Cuối 2019 · toàn thị trường'], ['towerco_2019', 'Cuối 2019 · TowerCo độc lập'], ['towerco_2024', 'Cuối 2024 · TowerCo']].flatMap(([k, n]) => own(k).map(r => [n, esc(r[0]), nf(r[1]), nf(r[1] / tot(k) * 100, 1) + '%']));
  const c7 = tableCard('vt-tw-owners', 'Ai sở hữu trạm viễn thông?', ['Thời điểm · phạm vi', 'Chủ sở hữu', 'Số vị trí trạm', 'Tỷ trọng trong nhóm'], ownRows, Object.values(LB).flatMap(x => x.rows.map(r => r[3])), 'Đếm theo vị trí trạm (site), khác số BTS đếm theo thiết bị của Bộ; tỷ trọng tự tính trong từng nhóm');
  p.append(qpanel('5.4', 'Trạm viễn thông do nhà mạng hay TowerCo sở hữu?', [c7]));
  const facts = (T.companies?.CTR?.facts || []).filter(f => !/rủi ro|kỳ vọng|đánh giá|nhận định/i.test(f.text));  // chỉ giữ thông tin mô tả
  p.append(qpanel('5.5', 'CTR công bố gì về kế hoạch trạm, khách hàng và hợp đồng?', [tableCard('vt-tw-facts', 'Thông tin vận hành CTR theo công bố', ['Nội dung', 'Nguồn'], facts.map(f => [esc(f.text), SRCS.get(f.src) ? `<a href="${esc(SRCS.get(f.src).url)}" target="_blank" rel="noopener">${esc(SRCS.get(f.src).org || SRCS.get(f.src).name)}</a>` : '—']), facts.map(f => f.src), 'Số liệu CTR đại diện cho doanh nghiệp, không đại diện toàn thị trường TowerCo Việt Nam')]));
}
function competePane(p) {
  const sh = T.shares?.mobile || {}, yrs = Object.keys(sh).sort(), ops = [...new Set(yrs.flatMap(y => Object.keys(sh[y])))];
  const c1 = yrs.length ? chartCard({id: 'vt-cp-mob', title: 'Thị phần thuê bao di động (%)', cats: yrs, series: ops.map((o, i) => ({name: o, color: OPC[o] || COL[i], values: yrs.map(y => sh[y][o] ?? null), kind: 'bar'})), unit: '%', digits: 1, native: 'stack', stackable: true, src: T.shares?.mobile_src || [], min: 1, cadence: 'yearly'}) : null;
  const conc = (m, name) => Object.keys(m).sort().map(y => { const v = Object.entries(m[y]).filter(([o]) => o !== 'Khác').map(x => x[1]).sort((a, b) => b - a); const tot = Object.values(m[y]).reduce((a, b) => a + b, 0); return [name, y, nf(v.slice(0, 3).reduce((a, b) => a + b, 0), 1) + '%', nf(v.reduce((a, b) => a + b * b, 0), 0), nf(tot, 1) + '%']; });
  const rows = [...conc(sh, 'Di động'), ...conc(T.shares?.fixed || {}, 'Băng rộng cố định')];
  const c2 = tableCard('vt-cp-hhi', 'Mức tập trung thị trường', ['Thị trường', 'Năm', 'CR3', 'HHI', 'Tổng thị phần đã công bố'], rows, [...(T.shares?.mobile_src || []), ...(T.shares?.fixed_src || [])], 'CR3 = tổng thị phần 3 doanh nghiệp lớn nhất; HHI = tổng bình phương thị phần (%), tính trên các doanh nghiệp có công bố, nhóm "Khác" không tính vào HHI');
  const SH = T.shares || {}, ys = ['mobile', 'fixed'].flatMap(m => Object.keys(SH[m + '_rev'] || {}).map(y => [m, y]));
  const srows = ys.flatMap(([m, y]) => Object.keys(SH[m + '_rev'][y]).map(o => [m === 'mobile' ? 'Di động' : 'Băng rộng cố định', y, esc(o), fin(SH[m]?.[y]?.[o]) ? nf(SH[m][y][o], 1) + '%' : '—', nf(SH[m + '_rev'][y][o], 1) + '%']));
  const c2b = tableCard('vt-cp-subrev', 'Thị phần thuê bao so với thị phần doanh thu', ['Thị trường', 'Năm', 'Doanh nghiệp', 'Thị phần thuê bao', 'Thị phần doanh thu'], srows, [...(SH.mobile_rev_src || []), ...(SH.fixed_rev_src || [])], 'Sách Trắng CNTT-TT; năm gần nhất có cả hai chỉ tiêu');
  p.append(qpanel('6.1', 'Thị trường đang tập trung hơn hay phân mảnh hơn, nhà mạng nào giành thêm thị phần?', [c1, c2, c2b]));
  const R = [['op_rev_viettel', 'Viettel'], ['op_rev_vnpt', 'VNPT'], ['op_rev_mobifone', 'MobiFone']].filter(([k]) => has(k)), a = align(R.map(x => x[0]));
  const c3 = R.length ? chartCard({id: 'vt-cp-rev', title: 'Doanh thu hợp nhất của các tập đoàn viễn thông (nghìn tỷ đồng)', cats: a.cats, series: R.map(([k, n], i) => ({name: n, color: OPC[n] || COL[i], values: a.vals[i].map(v => fin(v) ? (S(k).unit.startsWith('tỷ') ? v / 1000 : v) : null), kind: 'bar'})), unit: 'nghìn tỷ đ', digits: 1, native: 'bar', src: seriesSrc(R.map(x => x[0])), cadence: 'yearly', note: 'Doanh thu hợp nhất gồm cả mảng ngoài viễn thông (Viettel có công nghiệp quốc phòng, thị trường nước ngoài)'}) : null;
  const P = [['op_profit_viettel', 'Viettel'], ['op_profit_vnpt', 'VNPT'], ['op_profit_mobifone', 'MobiFone']].filter(([k]) => has(k)), b = align(P.map(x => x[0]));
  const c4 = P.length ? chartCard({id: 'vt-cp-profit', title: 'Lợi nhuận của các tập đoàn viễn thông (nghìn tỷ đồng)', cats: b.cats, series: P.map(([k, n], i) => ({name: n, color: OPC[n] || COL[i], values: b.vals[i].map(v => fin(v) ? (S(k).unit.startsWith('tỷ') ? v / 1000 : v) : null), kind: 'bar'})), unit: 'nghìn tỷ đ', digits: 1, native: 'bar', src: seriesSrc(P.map(x => x[0])), cadence: 'yearly', note: P.map(([k, n]) => `${n}: ${S(k).label}`).join('; ')}) : null;
  p.append(qpanel('6.2', 'Quy mô doanh thu và lợi nhuận phân bổ giữa các nhà mạng thế nào?', [c3, c4]));
  // VGI theo thị trường
  const vg = Object.keys(T.series || {}).filter(k => /^vgi_rev_/.test(k) && has(k)), va = align(vg);
  const c5 = vg.length ? chartCard({id: 'vt-cp-vgi', title: 'VGI: doanh thu theo thị trường', cats: va.cats, series: vg.map((k, i) => ({name: S(k).label.replace(/^VGI[^:]*:\s*/, ''), color: COL[i % COL.length], values: va.vals[i], kind: 'bar'})), unit: S(vg[0]).unit, digits: 0, native: 'stack', stackable: true, src: seriesSrc(vg), cadence: 'yearly', note: 'Thị trường nước ngoài; không đọc bằng số liệu thuê bao Việt Nam'}) : null;
  p.append(qpanel('6.3', 'VGI tạo doanh thu ở thị trường nào?', [c5]));
}
function financePane(p) {
  const host = el('div'); p.append(host);
  if (window.TelecomFinance) window.TelecomFinance.build(host);
}

/* ================= Chính sách · Tần số · Giá cước ================= */
function policyTab(pane) {
  const box = el('section', 'section vt-sec'); pane.append(box);
  box.append(el('div', 'sectionhead', '<div><h2 class="sec">Chính sách · Tần số · Giá cước</h2><p>Văn bản, đấu giá tần số và thay đổi giá có tác động đến CAPEX, giá dịch vụ, cạnh tranh và cấp phép.</p></div>'));
  const sp = T.spectrum || [];
  box.append(qpanel('P.1', 'Nhà mạng đã trả bao nhiêu cho tần số, kèm nghĩa vụ triển khai gì?', [tableCard('vt-pol-spectrum', 'Đấu giá và cấp phép tần số', ['Ngày', 'Băng tần', 'Doanh nghiệp', 'Giá trúng (tỷ đ)', 'Giá khởi điểm (tỷ đ)', 'Thời hạn', 'Nghĩa vụ'], sp.map(x => [dmy(x.date), esc(x.band), esc(x.winner), nf(x.price_bn_vnd, 1), nf(x.reserve_bn_vnd, 1), fin(x.term_years) ? x.term_years + ' năm' : '—', esc(x.obligation)]), sp.map(x => x.src))]));
  const po = [...(T.policy || [])].sort((a, b) => b.date.localeCompare(a.date));
  box.append(qpanel('P.2', 'Văn bản nào đang thay đổi luật chơi của ngành?', [tableCard('vt-pol-docs', 'Văn bản và quyết định chính sách', ['Ngày', 'Văn bản', 'Nội dung', 'Tác động kinh tế', 'Trạng thái'], po.map(x => [dmy(x.date), esc(x.doc), esc(x.title), esc(x.effect), {'in effect': 'Đang hiệu lực', draft: 'Dự thảo', plan: 'Kế hoạch'}[x.status] || esc(x.status)]), po.map(x => x.src))]));
  const g2 = (T.fiveg || []).filter(x => x.operator === 'Toàn quốc').sort((a, b) => a.date.localeCompare(b.date));
  box.append(qpanel('P.3', 'Lộ trình 5G và tắt sóng 2G đang ở đâu?', [tableCard('vt-pol-roadmap', 'Mốc toàn quốc: 5G, dừng 2G', ['Ngày', 'Giá trị', 'Nội dung', 'Loại'], g2.map(x => [dmy(x.date), fin(x.value) ? `${nf(x.value, x.value < 100 ? 1 : 0)} ${esc(x.unit)}` : '—', esc(x.text), x.status === 'target' ? 'Mục tiêu' : 'Thực tế']), g2.map(x => x.src))]));
  const pr = [...(T.prices || [])].sort((a, b) => b.date.localeCompare(a.date));
  box.append(qpanel('P.4', 'Giá cước niêm yết thay đổi khi nào?', [tableCard('vt-pol-prices', 'Giá gói cước theo thời điểm', ['Ngày', 'Phân khúc', 'Nhà mạng', 'Gói', 'Giá (đồng/tháng)', 'Dung lượng / tốc độ'], pr.map(x => [dmy(x.date), x.segment === 'fixed' ? 'Cố định' : 'Di động', esc(x.operator), esc(x.package), nf(x.price_vnd_month), esc(x.speed_or_quota)]), pr.map(x => x.src), 'Giá niêm yết không phải ARPU thực tế')]));
}

/* ================= Chủ đề nóng ================= */
function hotTab(pane) {
  const box = el('section', 'section vt-sec'); pane.append(box);
  box.append(el('div', 'sectionhead', '<div><h2 class="sec">Chủ đề nóng</h2><p>Sự kiện gần nhất theo chủ đề: điều gì mới xảy ra, thay đổi định lượng, doanh nghiệp liên quan, nguồn.</p></div>'));
  const ev = [...(T.events || [])].sort((a, b) => b.date.localeCompare(a.date)), topics = [...new Set(ev.map(e => e.topic))];
  const TN = {'sở hữu': 'Sở hữu & tái cấu trúc', 'hạ tầng quốc tế': 'Cáp quang biển', 'tần số': 'Tần số', capex: 'Đầu tư mạng lưới', '5G': '5G', 'công nghệ': 'Chuyển đổi công nghệ', 'cạnh tranh': 'Cạnh tranh', 'giá cước': 'Giá cước', 'vệ tinh': 'Internet vệ tinh', towerco: 'TowerCo'};
  topics.forEach((t, i) => {
    const rows = ev.filter(e => e.topic === t);
    const s = SRCS;
    box.append(qpanel('H.' + (i + 1), TN[t] || (t[0].toUpperCase() + t.slice(1)), [tableCard('vt-hot-' + i, `${rows.length} sự kiện`, ['Ngày', 'Sự kiện', 'Điều gì mới', 'Thay đổi định lượng', 'Doanh nghiệp', 'Bài gốc'], rows.map(e => [dmy(e.date), `<b>${esc(e.title)}</b>`, esc(e.what), esc(e.quant), esc((e.companies || []).join(', ')), s.get(e.src) ? `<a href="${esc(s.get(e.src).url)}" target="_blank" rel="noopener">${esc(s.get(e.src).org || s.get(e.src).name)}</a>` : '—']), rows.map(e => e.src))]));
  });
}

/* ================= Nguồn dữ liệu ================= */
function sourcesTab(pane) {
  const box = el('section', 'section vt-sec'); pane.append(box);
  box.append(el('div', 'sectionhead', '<div><h2 class="sec">Nguồn dữ liệu</h2><p>Bộ dữ liệu trên trang: nguồn, kỳ dữ liệu, tần suất, cách cập nhật.</p></div>'));
  const fq = {M: 'Tháng', Q: 'Quý', Y: 'Năm', event: 'Theo công bố'};
  const rows = Object.entries(T.series || {}).map(([k, s]) => { const ps = s.points.filter(x => fin(x[1])); return [esc(s.label), esc(s.unit), fq[s.freq] || s.freq, ps.length ? `${per(ps[0][0])} – ${per(ps[ps.length - 1][0])}` : '—', ps.length, esc(s.kind === 'stock' ? 'Số dư cuối kỳ' : s.kind === 'flow' ? 'Phát sinh trong kỳ' : 'Tỷ lệ'), esc(s.def || ''), 'Nhập tay có nguồn']; });
  if (F) rows.push(['BCTC hợp nhất ' + F.companies.length + ' doanh nghiệp', 'tỷ đồng', 'Quý', `${per(F.periods[0])} – ${per(F.periods.at(-1))}`, F.periods.length, 'KQKD, CĐKT, LCTT', 'VNDirect finfo', 'Tự động (scripts/fetch_telecom_financials.py)']);
  if (window.TELECOM_BENCH) rows.push(['Chỉ tiêu ITU so sánh ASEAN (6 nước)', 'nhiều', 'Năm', '2010 – ' + Math.max(...Object.values(TELECOM_BENCH.series.fixed_bb_per100.data).flatMap(o => Object.keys(o).map(Number))), '—', 'Thuê bao/100 dân, GDP/người', 'World Bank WDI', 'Tự động (scripts/fetch_telecom_benchmarks.py)']);
  const t = tableCard('vt-src-datasets', 'Bộ dữ liệu', ['Chỉ tiêu', 'Đơn vị', 'Tần suất', 'Kỳ dữ liệu', 'Số điểm', 'Loại', 'Định nghĩa', 'Cập nhật'], rows, [], null);
  t?.querySelector('.pw-src')?.remove(); if (t) t.append(el('div', 'pw-src', 'Nguồn: data/telecom-industry.json, data/telecom-financials.json, data/raw/public/telecom-benchmarks.json'));
  box.append(t);
  const sr = (T.sources || []).map(s => [esc(s.org || ''), `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`, dmy(s.published)]);
  const t2 = tableCard('vt-src-list', 'Danh mục nguồn', ['Đơn vị công bố', 'Tài liệu', 'Ngày công bố'], sr, [], null); t2?.querySelector('.pw-src')?.remove(); if (t2) box.append(t2);
}

/* ================= Khởi động ================= */
const BTAB = [
  ['growth', '01', 'Tăng trưởng', 'Tăng trưởng hay bão hòa', 'Doanh thu, thuê bao và mức thâm nhập: ngành còn tăng trưởng theo số lượng khách hàng hay đã bão hòa?', growthPane],
  ['data', '02', 'Data & doanh thu', 'Data và khả năng thu tiền', 'Nhu cầu data tăng có tạo thêm doanh thu không?', dataPane],
  ['fiveg', '03', 'Chu kỳ 5G', 'Chu kỳ đầu tư 5G', 'Hạ tầng 5G, thuê bao 5G, tần số và đầu tư của nhà mạng đang ở giai đoạn nào?', fivegPane],
  ['fixed', '04', 'Internet cố định', 'Internet cố định', 'Thuê bao, mức phủ hộ gia đình, thị phần và giá cước của Internet cố định', fixedPane],
  ['tower', '05', 'TowerCo', 'Hạ tầng cho thuê · CTR', 'Số trạm, tỷ lệ thuê chung và doanh thu theo mảng của CTR', towerPane],
  ['compete', '06', 'Cạnh tranh', 'Cạnh tranh và phân bổ giá trị', 'Thị phần, mức tập trung, quy mô doanh thu và lợi nhuận của các nhà mạng', competePane],
  ['finance', '07', 'Tài chính ngành', 'Tài chính ngành', 'Doanh thu, lợi nhuận, CAPEX, dòng tiền và hiệu quả sử dụng vốn của doanh nghiệp niêm yết theo mô hình kinh doanh', financePane]
];
const OTAB = [
  ['map', '00', 'Bản đồ ngành', 'Toàn cảnh ngành', 'Chuỗi giá trị và ba mô hình kinh doanh', mapPane],
  ['listed', '01', 'Doanh nghiệp niêm yết', 'Doanh nghiệp niêm yết', 'Quy mô, biên lợi nhuận và cường độ đầu tư 4 quý gần nhất', listedPane]
];
function start() {
  const st = el('style'); st.textContent = CSS; document.head.append(st);
  const pane = k => document.querySelector(`.majorpane[data-tab="${k}"]`);
  const p1 = pane('mt1'); if (p1) { const s = el('section', 'section vt-sec'); p1.append(s); hero(s); s.append(el('p', 'vt-note', esc(modelsNote()))); subtabs(s, 'mt1', OTAB, 'map', 'ov'); }
  const p2 = pane('mt2'); if (p2) { const s = el('section', 'section vt-sec'); p2.append(s); s.append(el('div', 'sectionhead', '<div><h2 class="sec">Bức tranh ngành</h2><p>Tăng trưởng → data → 5G → Internet cố định → TowerCo → cạnh tranh → tài chính. Mỗi sub-tab trả lời một nhóm câu hỏi bằng dữ liệu.</p></div>')); subtabs(s, 'mt2', BTAB, 'growth', 'section'); }
  if (pane('mt3')) policyTab(pane('mt3'));
  if (pane('mt4')) hotTab(pane('mt4'));
  if (pane('mt5')) sourcesTab(pane('mt5'));
  queue.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } });
  document.documentElement.dataset.vtReady = '1';
}
const CSS = `
.vt-sec{margin-top:6px}.vt-note{font-size:12px;color:var(--muted,#7a8399);margin:0 0 10px}
.vt-grid{gap:12px}.vt-one>.card,.vt-grid>.card{margin-bottom:0}.vt-card .pp-host{min-height:220px}
.vt-hero{margin:4px 0 12px;grid-template-columns:repeat(4,minmax(0,1fr))}.vt-hero .kpi{display:flex;flex-direction:column}.vt-hero .pw-src{margin-top:auto;padding-top:6px}
.vt-chain .vt-flow{display:flex;align-items:stretch;gap:6px;overflow-x:auto;padding:6px 0}
.vt-col{flex:1 1 170px;min-width:160px;border:1px solid var(--line,#d6dbe8);border-radius:10px;padding:10px;background:var(--card,#fff);display:flex;flex-direction:column;gap:4px}
.vt-col b{font-size:13.5px}.vt-col small{font-size:11.5px;color:var(--muted,#7a8399);line-height:1.4}.vt-col>div{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.vt-arr{align-self:center;font-style:normal;font-weight:700;color:#2938A8}
.vt-tk{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:6px;font:600 12px Inter,sans-serif;border:1px solid var(--line,#d6dbe8);background:var(--card,#fff)}
.vt-tk.ls{background:#1D2678;color:#fff;border-color:#1D2678}.vt-tk.gov{background:#fff1d6;color:#7a5200;border-color:#f0d9a8}.vt-col em{font-style:normal;font-size:11px;color:var(--muted,#7a8399);margin:0 6px 0 -2px}
.vt-intl,.vt-legend{margin-top:8px;font-size:12.5px;color:var(--ink2,#3b4256)}.vt-legend{font-size:11.5px;color:var(--muted,#7a8399)}
.vt-dot{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px}
.pp-tcard td{white-space:normal}
:root[data-theme=dark] .vt-col,:root[data-theme=dark] .vt-tk{background:var(--card,#141a33)}:root[data-theme=dark] .vt-tk.ls{background:#6171C5;border-color:#6171C5}
@media (max-width:760px){.vt-hero{grid-template-columns:repeat(2,minmax(0,1fr))}.vt-chain .vt-flow{flex-direction:column}.vt-arr{transform:rotate(90deg)}}
`;
if (window.SectorBoot) SectorBoot.add(-1, start); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
window.TelecomDashboard = {data: T};
})();
