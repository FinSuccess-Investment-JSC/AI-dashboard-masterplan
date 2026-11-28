/* Dầu khí · tab lớn Tài chính ngành (#mt14, 26/11/2026). Chép từ Vien-thong/app/telecom-finance.js ← Dien/app/power-finance.js, số từ window.OIL_FIN
   (BCTC hợp nhất quý, VNDirect finfo; scripts/build_oil_financials.py), tổng hợp bằng window.IndustryFin (app/industry-fin.js).
   Nhóm theo mô hình kinh doanh (28/11/2026): Dịch vụ thượng nguồn (PVS, PVD, PVB) · Khí (GAS, CNG) · Vận tải (PVT, PVP) · Lọc dầu (BSR) · Phân phối (PLX, OIL) · Hóa dầu & thương mại khác (PLC, PET).
   Tỷ số nhóm = tổng tử số ÷ tổng mẫu số. Kỳ có dưới 80% số mã đủ số thì để trống (LCTT quý trước 2024 thiếu ở nhiều mã). Chỉ mô tả dữ liệu; nguồn hiện dưới mọi chart.
   28/11/2026 (người dùng duyệt): bỏ phần khung chép từ Điện không hợp dầu khí — bỏ bảng nhiệt mùa vụ, thêm giá dầu & crack cạnh biên, thêm tồn kho,
   mục 1.5 thành Tiền ròng & cổ tức (ngành giữ tiền ròng, nợ vay ròng/EBITDA âm), ROIC đổi thành ROCE không trừ tiền (tiền của PVS, OIL, PLX phần lớn là vốn chiếm dụng). */
(() => {
'use strict';
const D = window.OIL_FIN;
if (!D || !window.IndustryFin) return;
const E = IndustryFin.create(D);
const fin = v => typeof v === 'number' && Number.isFinite(v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const qLabel = p => /Q\d$/.test(p) ? `Q${p.slice(-1)}/${p.slice(0, 4)}` : p;
const SRC = `<a href="https://api-finfo.vndirect.com.vn/v4/financial_statements" target="_blank" rel="noopener">BCTC hợp nhất theo quý (VNDirect finfo)</a>`;
const LINE = ['#1D2678', '#2a9fa3', '#c98a00', '#861C52', '#3d4653', '#8997D6'];
const GC = Object.fromEntries(D.groups.map(g => [g.id, g.color]));
const S = {groups: D.groups.filter(g => g.default).map(g => g.id), mode: 'ttm', end: D.periods.length - 1, off: []};
// Bộ lọc đọc / ghi URL (26/11/2026): fg = nhóm, fm = chu kỳ, fe = kỳ chốt, fx = mã bỏ khỏi rổ.
(() => { const q = new URL(location.href).searchParams, gs = (q.get('fg') || '').split(',').filter(g => D.groups.some(x => x.id === g));
  if (gs.length) S.groups = gs; if (['q', 'ttm', 'y'].includes(q.get('fm'))) S.mode = q.get('fm');
  const e = D.periods.indexOf(q.get('fe') || ''); if (e >= 0) S.end = e;
  S.off = (q.get('fx') || '').split(',').filter(t => D.companies.some(c => c.ticker === t)); })();
function syncUrl() { if (location.hash !== '#mt14') return; const u = new URL(location.href), def = D.groups.filter(g => g.default).map(g => g.id).join(',');
  const set = (k, v, d) => v && v !== d ? u.searchParams.set(k, v) : u.searchParams.delete(k);
  set('fg', S.groups.join(','), def); set('fm', S.mode, 'ttm'); set('fe', D.periods[S.end], D.periods.at(-1)); set('fx', S.off.join(','), '');
  history.replaceState(null, '', u.pathname + u.search + u.hash); }
const sel = () => E.tickersOf(S.groups).filter(t => !S.off.includes(t));
const MODES = [['q', 'Quý'], ['ttm', 'TTM'], ['y', 'Năm']];
const modeName = m => ({q: 'quý', ttm: 'TTM (4 quý gần nhất)', y: 'năm'})[m];
const renders = [];
let root = null;

/* ---------- Khung card, chart, nút chọn ---------- */
function card(id, title, sub) {
  const c = el('div', 'card pp-card pf-card'); c.dataset.blockId = id; c.dataset.updateKind = 'public'; c.dataset.cadence = 'quarterly'; c.dataset.refreshStatus = 'snapshot';
  c.innerHTML = `<div class="chart-title">${esc(title)}</div>${sub ? `<div class="chart-sub">${sub}</div>` : ''}<div class="pf-ctl"></div><div class="pp-host" id="${id}-host"></div><div class="pf-extra"></div>`;
  return {el: c, host: c.querySelector('.pp-host'), ctl: c.querySelector('.pf-ctl'), extra: c.querySelector('.pf-extra')};
}
// Dòng nguồn (góc phải dưới chart) + ghi chú ngắn: công thức, độ phủ, ngày cập nhật.
function foot(c, note, src) {
  c.el.querySelectorAll(':scope > .pw-src, :scope > .pw-src-note').forEach(n => n.remove());
  c.el.append(el('div', 'pw-src', `Nguồn: ${src || SRC + '; tự tính'}`));
  c.el.append(el('div', 'pw-src-note', `${note ? esc(note) + ' · ' : ''}cập nhật ${esc(D.captured.split('-').reverse().join('/'))}`));
}
function seg(c, name, opts, get, set) {
  // Nút "Cách xem" / "Đơn vị" tách thành ô riêng, đặt bên phải; nút chọn chỉ tiêu ở bên trái (25/11/2026, theo yêu cầu người dùng).
  const w = el('div', 'pf-seg pf-box' + (/Cách xem|Đơn vị/.test(name) ? ' pf-view' : '')); w.setAttribute('role', 'group'); w.setAttribute('aria-label', name);
  opts.forEach(([k, t]) => { const b = el('button', '', esc(t)); b.type = 'button'; b.dataset.k = k; b.setAttribute('aria-pressed', String(get() === k)); b.addEventListener('click', () => { set(k); w.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.k === k))); }); w.append(b); });
  c.ctl.append(w); return w;
}
// Cắt kỳ đầu toàn rỗng; nhãn quý hiển thị Qn/yyyy.
function trim(labels, series) {
  let a = 0; while (a < labels.length && series.every(s => !fin(s.values[a]))) a++;
  let b = labels.length - 1; while (b > a && series.every(s => !fin(s.values[b]))) b--;
  return {labels: labels.slice(a, b + 1).map(qLabel), series: series.map(s => ({...s, values: s.values.slice(a, b + 1).map(v => fin(v) ? Math.round(v * 100) / 100 : null)}))};
}
function chart(host, key, labels, series, o = {}) {
  const t = trim(labels, series);
  const model = {key, categories: t.labels, series: t.series, unit: o.unit || '', digits: o.digits ?? 0, stackable: !!o.stackable, native: o.native || 'line', zeroBase: o.zeroBase !== false, aria: o.aria || key};
  if (!window.ChartTypes) { host.textContent = ''; return; }
  ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, model.native); });
}
const yoy = (vals, mode) => { const k = mode === 'y' ? 1 : 4; return vals.map((v, i) => i >= k && fin(v) && fin(vals[i - k]) && vals[i - k] !== 0 ? (v / Math.abs(vals[i - k]) - (vals[i - k] < 0 ? -1 : 1)) * 100 * (vals[i - k] < 0 ? -1 : 1) : null); };
const yoyPct = (vals, mode) => { const k = mode === 'y' ? 1 : 4; return vals.map((v, i) => i >= k && fin(v) && fin(vals[i - k]) && vals[i - k] > 0 ? (v / vals[i - k] - 1) * 100 : null); };
const endIdx = mode => mode === 'y' ? E.years.indexOf(D.periods[S.end].slice(0, 4)) - (D.periods[S.end].endsWith('Q4') ? 0 : 1) : S.end;
const covNote = (cov, n, i) => `phủ ${fin(cov?.[i]) ? cov[i] : 0}/${n} doanh nghiệp kỳ chốt`;
// Độ phủ: kỳ có dưới 80% số mã đủ số thì để trống, để chuỗi không đổi thành phần giữa chừng (LCTT quý trước 2024 chỉ có ở 1–6/12 mã).
const MINCOV = .8, okCov = (c, n) => n > 0 && c >= n * MINCOV;
const total = (m, ts, mode, o) => { const t = E.total(m, ts, mode, o); return {...t, values: t.values.map((v, i) => okCov(t.cov[i], ts.length) ? v : null)}; };
const byGroup = (m, ts, mode) => { const b = E.byGroup(m, ts, mode), all = b.labels.map((_, i) => okCov(b.groups.reduce((a, g) => a + g.cov[i], 0), ts.length));
  return {...b, groups: b.groups.map(g => ({...g, values: g.values.map((v, i) => all[i] && okCov(g.cov[i], g.tickers.length) ? v : null)}))}; };
const ratio = (a, b, ts, mode, sc) => { const r = E.ratio(a, b, ts, mode, sc); return {...r, values: r.values.map((v, i) => okCov(r.cov[i], ts.length) ? v : null)}; };
const growth = (m, ts, mode) => { const pv = E.per(m, ts, mode), k = mode === 'y' ? 1 : 4, g = E.growth(m, ts, mode);
  const mask = (vals, x) => vals.map((v, i) => i >= k && okCov(x.filter(t => fin(pv[t][i]) && fin(pv[t][i - k])).length, x.length) ? v : null);
  return {...g, values: mask(g.values, ts), groups: g.groups.map(z => ({...z, values: mask(z.values, ts.filter(t => E.groupOf[t] === z.id))}))}; };
const minus = a => a.map(v => fin(v) ? -v : null);
const liveGroups = () => D.groups.filter(g => S.groups.includes(g.id) && sel().some(t => E.groupOf[t] === g.id));
const share = (groups, i) => { const tot = groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0); return groups.map(g => fin(g.values[i]) && tot ? g.values[i] / tot * 100 : null); };

/* ---------- Thanh bộ lọc, KPI, xuất dữ liệu ---------- */
function filterBar() {
  const f = el('section', 'pf-filter');
  // Bộ lọc: mỗi dòng một nhãn cố định bên trái; bảng khâu bên dưới. Nút tải CSV ẩn (25/11/2026, theo yêu cầu người dùng).
  f.innerHTML = `<div class="pf-grid"><span class="pf-lb">Khâu</span><div class="pf-chips">${D.groups.map(g => `<button type="button" data-g="${g.id}" aria-pressed="${S.groups.includes(g.id)}"><i style="background:${g.color}"></i>${esc(g.label)} <small>${D.companies.filter(c => c.group === g.id).length}</small></button>`).join('')}</div>
    <span class="pf-lb">Chu kỳ</span><div class="pf-inline"><div class="pf-seg pf-box" data-role="mode">${MODES.map(([k, t]) => `<button type="button" data-m="${k}" aria-pressed="${S.mode === k}">${t}</button>`).join('')}</div>
    <span class="pf-lb">Kỳ chốt</span><select data-role="end">${D.periods.map((p, i) => `<option value="${i}"${i === S.end ? ' selected' : ''}>${qLabel(p)}</option>`).join('')}</select></div></div>
    <div class="pf-legend"></div>`;
  f.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => { const g = b.dataset.g; S.groups = S.groups.includes(g) ? S.groups.filter(x => x !== g) : [...S.groups, g]; if (!S.groups.length) S.groups = [g]; b.setAttribute('aria-pressed', String(S.groups.includes(g))); f.querySelectorAll('[data-g]').forEach(x => x.setAttribute('aria-pressed', String(S.groups.includes(x.dataset.g)))); redraw(); }));
  f.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { S.mode = b.dataset.m; f.querySelectorAll('[data-m]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.m === S.mode))); redraw(); }));
  f.querySelector('[data-role=end]').addEventListener('change', e => { S.end = +e.target.value; redraw(); });
  f.addEventListener('click', e => { const b = e.target.closest('[data-tk]'); if (!b) return; const t = b.dataset.tk, g = E.groupOf[t];
    if (!S.groups.includes(g)) { S.groups = [...S.groups, g]; S.off = [...S.off.filter(x => x !== t), ...D.companies.filter(c => c.group === g && c.ticker !== t).map(c => c.ticker)];  /* bấm mã ở nhóm chưa chọn: chỉ thêm mã đó */ f.querySelectorAll('[data-g]').forEach(x => x.setAttribute('aria-pressed', String(S.groups.includes(x.dataset.g)))); }
    else S.off = S.off.includes(t) ? S.off.filter(x => x !== t) : [...S.off, t];
    if (!sel().length) S.off = S.off.filter(x => x !== t);
    redraw(); });
  // Bảng khâu (dùng xuyên suốt tab): nhóm · doanh nghiệp · có trong tổng hay không.
  renders.push(() => { const s = sel(), cons = E.consolidation.filter(c => s.includes(c.parent) && s.includes(c.child));
    f.querySelector('.pf-legend').innerHTML = `<table class="pf-gtable"><thead><tr><th>Khâu</th><th>Doanh nghiệp</th><th>Trong tổng</th></tr></thead><tbody>${D.groups.map(g => { const on = S.groups.includes(g.id);
        return `<tr class="${on ? '' : 'off'}"><td><i style="background:${g.color}"></i>${esc(g.label)}</td><td>${D.companies.filter(c => c.group === g.id).map(c => `<button type="button" class="pf-tk" data-tk="${c.ticker}" aria-pressed="${on && !S.off.includes(c.ticker)}" title="${esc(c.note || '')} · bấm để bỏ khỏi / thêm vào rổ">${c.ticker}${c.mixed ? '*' : ''}</button>`).join('')}</td><td>${on ? 'Có' : 'Không'}</td></tr>`; }).join('')}</tbody></table>
      <p class="pf-scope">Rổ đang chọn: <b>${s.length}</b> doanh nghiệp (${s.join(', ') || '—'}) · số tổng hợp từ BCTC hợp nhất; mỗi chart ghi số mã có dữ liệu ở kỳ chốt · không đại diện toàn ngành dầu khí Việt Nam (PVN, PVEP không niêm yết).</p>
      <p class="pf-note">Bấm mã để bỏ khỏi hoặc thêm vào rổ. Mỗi doanh nghiệp xếp vào mảng có doanh thu lớn nhất; dấu * là doanh nghiệp nhiều mảng kinh doanh, số theo nhóm chỉ mang tính tham khảo. Mẫu doanh nghiệp niêm yết, không đại diện toàn ngành dầu khí.${cons.length ? ` Loại trùng hợp nhất: ${cons.map(c => `${c.parent} trừ ${c.child}`).join(', ')}.` : ''}</p>`; });
  return f;
}
function spark(vals) {
  const v = vals.slice(-12), xs = v.filter(fin); if (xs.length < 2) return '';
  const lo = Math.min(...xs), hi = Math.max(...xs), W = 120, H = 28, x = i => i * W / (v.length - 1), y = a => H - 3 - (a - lo) / ((hi - lo) || 1) * (H - 6);
  const pts = v.map((a, i) => fin(a) ? `${x(i).toFixed(1)},${y(a).toFixed(1)}` : null).filter(Boolean).join(' ');
  return `<svg class="pf-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}"/></svg>`;
}
function kpis() {
  const g = el('section', 'grid kpis pp-kpis pf-kpis');
  renders.push(() => {
    const s = sel(), i = S.end, n = s.length;
    const T = (m, mode = 'ttm', avg) => total(m, s, mode, {avg});
    const npat = T('npat'), roe = ratio({m: 'npat'}, {m: 'equity', avg: true}, s, 'ttm', 100), capex = T('capex'), inv = T('inventory', 'q'), div = T('dividends'), nd = T('net_debt', 'q'), nc = {values: minus(nd.values), cov: nd.cov};
    const tile = (label, val, unit, d, dTxt, cov, vals, sub) => `<div class="kpi pp-kpi"><div class="label l">${esc(label)}</div><div class="value v">${val}${unit ? `<small> ${esc(unit)}</small>` : ''}</div><div class="delta">${dTxt}</div>${spark(vals)}<div class="sub s">${esc(qLabel(D.periods[i]))} · phủ ${cov}/${n} DN${sub ? ' · ' + sub : ''}</div></div>`;
    const ch = (_a, m, mode = 'ttm') => growth(m, s, mode).values[i];
    const dAbs = (v, d = 0) => fin(v[i]) && fin(v[i - 4]) ? v[i] - v[i - 4] : null;
    // 28/11/2026: bỏ ô Doanh thu (cộng dọc chuỗi có trùng), XDCB dở dang (2% tổng tài sản), Nợ vay ròng/EBITDA (âm vì ngành giữ tiền ròng).
    g.innerHTML = [
      tile('LNST TTM nhóm đã chọn', nf(npat.values[i]), 'tỷ đ', null, `${sg(ch(0, 'npat'))}% so cùng kỳ`, npat.cov[i], npat.values),
      tile('ROE TTM', nf(roe.values[i], 1), '%', null, `${sg(dAbs(roe.values))} đ.p. so cùng kỳ`, roe.cov[i], roe.values, 'LNST ÷ VCSH bình quân'),
      tile('Tiền ròng', nf(nc.values[i]), 'tỷ đ', null, `${sg(dAbs(nc.values), 0)} tỷ đ so cùng kỳ`, nc.cov[i], nc.values, 'tiền + đầu tư ngắn hạn − nợ vay'),
      tile('Hàng tồn kho', nf(inv.values[i]), 'tỷ đ', null, `${sg(ch(0, 'inventory', 'q'))}% so cùng kỳ`, inv.cov[i], inv.values),
      tile('CAPEX TTM', nf(capex.values[i]), 'tỷ đ', null, `${sg(ch(0, 'capex'))}% so cùng kỳ`, capex.cov[i], capex.values, 'tiền chi mua sắm, xây dựng TSCĐ'),
      tile('Cổ tức đã trả TTM', nf(div.values[i]), 'tỷ đ', null, `${sg(ch(0, 'dividends'))}% so cùng kỳ`, div.cov[i], div.values, 'tiền chi trong kỳ (LCTT)')
    ].join('');
  });
  return g;
}
// Section: câu hỏi + hàng mini KPI + các card
// Không có hàng ô số nhỏ dưới câu hỏi (quy tắc chung trang Điện, PR #35, 25/11/2026); chỉ giữ hàng KPI đầu sub-tab.
// Mục lục: 6 nhóm Kết quả kinh doanh → Biên lợi nhuận → CAPEX & dở dang → Tồn kho, công nợ & chuyển đổi tiền → Tiền ròng & cổ tức → Hiệu quả vốn.
function section(num, title, q) {
  const s = el('section', 'pp-panel pp-q pf-sec'); s.innerHTML = `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(title)}</h3><p class="pf-q">${esc(q)}</p></div></header>`;
  return s;
}
const grid2 = (...cards) => { const g = el('div', 'grid two g2 pf-g2'); cards.forEach(c => g.append(c.el)); return g; };

/* ---------- 1.1 Chu kỳ doanh thu và lợi nhuận ---------- */
const PNL = [['revenue', 'Doanh thu'], ['gross', 'Lợi nhuận gộp'], ['ebitda', 'EBITDA'], ['ebit', 'EBIT'], ['npat', 'LNST']];
function s71() {
  const s = section('1.1', 'Kết quả kinh doanh', 'Lợi nhuận đang dồn về khâu nào trong chuỗi, và tăng trưởng có lan rộng không?');
  // Chart 1: quy mô theo nhóm
  const c1 = card('dk-fin-pnl', 'Doanh thu và lợi nhuận theo khâu (tỷ đồng)', 'Cột chồng theo khâu · đổi chỉ tiêu và cách xem'); let m1 = 'npat', v1 = 'abs';
  seg(c1, 'Chỉ tiêu', PNL, () => m1, k => { m1 = k; draw1(); }); seg(c1, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const b = byGroup(m1, sel(), S.mode), name = PNL.find(p => p[0] === m1)[1];
    if (v1 === 'abs') chart(c1.host, 'dk-fin-pnl-abs', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true});
    else if (v1 === 'yoy') chart(c1.host, 'dk-fin-pnl-yoy', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: growth(m1, sel(), S.mode).groups.find(z => z.id === g.id)?.values || []})), {unit: '%', digits: 1, zeroBase: false});
    else { const tot = b.labels.map((_, i) => b.groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0)), neg = b.labels.map((_, i) => b.groups.some(g => fin(g.values[i]) && g.values[i] < 0));
      chart(c1.host, 'dk-fin-pnl-share', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values.map((v, i) => fin(v) && tot[i] > 0 && !neg[i] ? v / tot[i] * 100 : null)})), {unit: '%', digits: 1, native: 'stack', stackable: true}); }
    foot(c1, `${name} ${modeName(S.mode)}; EBIT = LN gộp − CP bán hàng − CP QLDN; EBITDA = EBIT + khấu hao (LCTT)${v1 === 'share' ? '; tỷ trọng để trống ở kỳ có nhóm lỗ' : ''}${m1 === 'revenue' ? '; doanh thu cộng dọc chuỗi có trùng (BSR bán cho PLX, OIL)' : ''}; ${covNote(b.groups.reduce((a, g) => a.map((x, i) => x + g.cov[i]), b.labels.map(() => 0)), sel().length, b.labels.length - 1)}`); }
  renders.push(draw1);
  // Chart "Chu kỳ lợi nhuận theo khâu" bỏ 25/11/2026 (trùng chart doanh thu và lợi nhuận ở trên).
  // Chart thác nước "đóng góp vào thay đổi LNST" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Bảng nhiệt "Tính mùa vụ của lợi nhuận theo quý" bỏ 28/11/2026: dầu khí không có mùa vụ như thủy điện, lợi nhuận quý đi theo giá dầu và crack (xem 1.2).
  // Chart 5: độ lan tỏa
  const c5 = card('dk-fin-breadth', 'Tăng trưởng lợi nhuận lan rộng hay tập trung?', 'Số doanh nghiệp theo thay đổi LNST so cùng kỳ (quý riêng)');
  function draw5() { const s = sel(), pv = E.per('npat', s, 'q'), L = D.periods;
    const cnt = f => L.map((_, i) => i < 4 ? null : s.filter(t => fin(pv[t][i]) && fin(pv[t][i - 4]) && f(pv[t][i], pv[t][i - 4])).length);
    chart(c5.host, 'dk-fin-breadth', L, [
      {name: 'Tăng (lãi cả hai kỳ)', color: '#2938A8', values: cnt((a, b) => a >= b && a > 0 && b > 0)},
      {name: 'Giảm (lãi cả hai kỳ)', color: '#9AA3BD', values: cnt((a, b) => a < b && a > 0 && b > 0)},
      {name: 'Lỗ sang lãi', color: '#2a9fa3', values: cnt((a, b) => a > 0 && b <= 0)},
      {name: 'Lãi sang lỗ', color: '#c98a00', values: cnt((a, b) => a <= 0 && b > 0)},
      {name: 'Lỗ cả hai kỳ', color: '#3d4653', values: cnt((a, b) => a <= 0 && b <= 0)}], {unit: 'DN', native: 'stack', stackable: true});
    foot(c5, 'LNST quý so cùng quý năm trước; chỉ doanh nghiệp có số cả hai kỳ'); }
  renders.push(draw5);
  s.append(grid2(c1, c5));
  return s;
}
// Thác nước HTML (chiều ngang): các bước có thể bấm (data-id).
function wf(steps, unit) {
  let run = 0; const rows = steps.map(s => { if (s.total) { run = s.v; return {...s, a: 0, b: s.v}; } const a = run; run += s.v; return {...s, a, b: run}; });
  const lo = Math.min(0, ...rows.map(r => Math.min(r.a, r.b))), hi = Math.max(0, ...rows.map(r => Math.max(r.a, r.b))), span = (hi - lo) || 1, pos = v => (v - lo) / span * 100;
  return `<div class="pf-wf">${rows.map(r => `<div class="pf-wf-r${r.id ? ' pf-click' : ''}"${r.id ? ` data-id="${r.id}" role="button" tabindex="0"` : ''}><span>${esc(r.l)}</span><div class="pf-wf-t"><i style="left:${Math.min(pos(r.a), pos(r.b))}%;width:${Math.max(.4, Math.abs(pos(r.b) - pos(r.a)))}%;background:${r.total ? '#1D2678' : r.v < 0 ? '#c98a00' : (r.c || '#2a9fa3')}"></i>${lo < 0 ? `<b style="left:${pos(0)}%"></b>` : ''}</div><em>${r.total ? nf(r.v) : sg(r.v, 0)}</em></div>`).join('')}</div><div class="pf-unit">${esc(unit)}</div>`;
}

/* ---------- 1.2 Cấu trúc chi phí và biên lợi nhuận ---------- */
function groupPicker(c, get, set) { const g = el('select', 'pf-sel'); c.ctl.append(g); g.addEventListener('change', () => set(g.value)); return () => { g.innerHTML = `<option value="all">Tất cả nhóm đang chọn</option>` + D.groups.filter(x => S.groups.includes(x.id)).map(x => `<option value="${x.id}"${x.id === get() ? ' selected' : ''}>${esc(x.label)}</option>`).join(''); if (get() !== 'all' && !S.groups.includes(get())) set('all', true); }; }
const scopeOf = gid => gid === 'all' ? sel() : sel().filter(t => E.groupOf[t] === gid);
// Biến dẫn dắt biên: bình quân ngày theo đúng chu kỳ của chart biên (quý / 4 quý / năm); quý có dưới 30 phiên thì để trống.
const DAILY = window.SECTOR_DAILY?.sources || {};
const DRV = [['brent', 'value', 'Brent', '#1D2678'], ['singapore_cracks', 'gasoil_crack', 'Crack diesel Singapore', '#c98a00'], ['singapore_cracks', 'gasoline_crack', 'Crack xăng 92 Singapore', '#2a9fa3']];
function driverAvg(src, key, mode) {
  const acc = {}; (DAILY[src]?.records || []).forEach(r => { const v = r[key]; if (!fin(v) || !r.date) return; const a = (acc[`${r.date.slice(0, 4)}Q${Math.ceil(+r.date.slice(5, 7) / 3)}`] ||= [0, 0]); a[0] += v; a[1]++; });
  const P = D.periods, span = ks => ks.every(k => acc[k] && acc[k][1] >= 30) ? ks.reduce((a, k) => a + acc[k][0], 0) / ks.reduce((a, k) => a + acc[k][1], 0) : null;
  if (mode === 'y') return E.years.map(y => P.includes(`${y}Q4`) ? span([1, 2, 3, 4].map(q => `${y}Q${q}`)) : null);
  return P.map((p, i) => mode === 'ttm' ? (i < 3 ? null : span(P.slice(i - 3, i + 1))) : span([p]));
}
const MARG = [['gross', 'Biên gộp'], ['ebitda', 'Biên EBITDA'], ['ebit', 'Biên EBIT'], ['npat', 'Biên LNST']];
function s72() {
  const s = section('1.2', 'Biên lợi nhuận', 'Biên mỗi khâu khác nhau ra sao, và đi cùng hay ngược giá dầu, crack spread?');
  // Chart 1: biên theo khâu (28/11/2026: mỗi đường một khâu thay cho bốn loại biên của cả rổ; biên cả rổ bị doanh thu phân phối pha loãng).
  const c1 = card('dk-fin-margin', 'Biên lợi nhuận theo khâu (%)', 'Mỗi đường một khâu · đổi loại biên'); let m1 = 'gross';
  seg(c1, 'Chỉ tiêu', MARG, () => m1, k => { m1 = k; draw1(); });
  function draw1() { const L = E.labels(S.mode);
    chart(c1.host, 'dk-fin-margin-' + m1, L, liveGroups().map(g => ({name: g.label, color: g.color, values: ratio({m: m1}, {m: 'revenue'}, scopeOf(g.id), S.mode, 100).values})), {unit: '%', digits: 1, zeroBase: false});
    foot(c1, `${MARG.find(x => x[0] === m1)[1]} = tổng lợi nhuận ÷ tổng doanh thu của khâu, ${modeName(S.mode)}; biên lọc dầu và phân phối gồm lãi/lỗ tồn kho; kỳ phủ dưới 80% số mã để trống`); }
  renders.push(draw1);
  // Chart 2: giá dầu và crack spread, cùng trục thời gian với chart biên.
  const c2 = card('dk-fin-driver', 'Giá dầu và crack spread (USD/thùng)', 'Bình quân theo cùng chu kỳ với chart biên bên cạnh');
  function draw2() { const A = k => DAILY[k]?.source_url ? `<a href="${esc(DAILY[k].source_url)}" target="_blank" rel="noopener">${esc(DAILY[k].source_name || k)}</a>` : esc(k);
    chart(c2.host, 'dk-fin-driver', E.labels(S.mode), DRV.map(([src, key, name, color]) => ({name, color, values: driverAvg(src, key, S.mode)})), {unit: 'USD/thùng', digits: 1, zeroBase: false});
    foot(c2, `bình quân các phiên trong ${S.mode === 'q' ? 'quý' : S.mode === 'y' ? 'năm' : '4 quý gần nhất'}; crack = giá sản phẩm Singapore − dầu Dubai, chuỗi có từ ${(DAILY.singapore_cracks?.records?.[0]?.date || '').split('-').reverse().join('/')}`, `${A('brent')} (Brent), ${A('singapore_cracks')} (crack Singapore); tự tính bình quân`); }
  renders.push(draw2);
  // Chart cầu nối "Từ doanh thu đến lợi nhuận sau thuế" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Chart 3: cơ cấu chi phí trên 100 đồng doanh thu
  const c3 = card('dk-fin-cost', 'Cơ cấu chi phí trên 100 đồng doanh thu', 'Theo khâu, kỳ chốt · giá vốn trừ khấu hao, khấu hao, bán hàng & QLDN, lãi vay, thuế, lợi nhuận còn lại');
  function draw3() { const mode = S.mode === 'y' ? 'y' : 'ttm', i = endIdx(mode), x = sel();
    const ms = ['revenue', 'opex_other', 'da', 'sga', 'interest', 'tax', 'npat'], pv = Object.fromEntries(ms.map(m => [m, E.per(m, x, mode)]));
    const gs = D.groups.filter(g => S.groups.includes(g.id)), row = g => { const ts = x.filter(t => E.groupOf[t] === g.id && ms.every(m => fin(pv[m][t][i]))), T = m => ts.reduce((a, t) => a + pv[m][t][i], 0), r = T('revenue'); return r ? ms.slice(1).map(m => T(m) / r * 100) : ms.slice(1).map(() => null); };
    const R = gs.map(row), names = ['Giá vốn trừ khấu hao', 'Khấu hao', 'Bán hàng & QLDN', 'Lãi vay', 'Thuế TNDN', 'LNST'], cols = ['#9AA3BD', '#3d4653', '#8997D6', '#c98a00', '#861C52', '#2938A8'];
    const m = {key: 'dk-fin-cost', categories: gs.map(g => g.label), series: names.map((n, k) => ({name: n, color: cols[k], values: R.map(r => fin(r[k]) ? Math.round(r[k] * 10) / 10 : null)})), unit: 'đồng', digits: 1, stackable: true, native: 'stack', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c3.host, m, () => { c3.host.innerHTML = ChartTypes.render(m, 'stack'); });
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; khoản còn lại (thu nhập tài chính, liên kết, khác, chi phí tài chính ngoài lãi vay) không vẽ nên tổng có thể khác 100; chưa tách chi phí nhiên liệu`); }
  renders.push(draw3);
  // Chart "Khấu hao và chi phí tài trợ so với doanh thu, EBITDA" bỏ 25/11/2026 theo yêu cầu người dùng.
  s.append(grid2(c1, c2), c3.el);
  return s;
}

/* ---------- 1.3 CAPEX và hình thành tài sản ---------- */
function s73() {
  const s = section('1.3', 'CAPEX & dở dang', 'Dòng vốn đầu tư đang chảy vào khâu nào, và chu kỳ đầu tư (Lô B, LNG, giàn khoan) đang ở giai đoạn nào?');
  // Chart 1: CAPEX theo nhóm
  const c1 = card('dk-fin-capex', 'CAPEX theo khâu (tỷ đồng)', 'Tiền chi mua sắm, xây dựng TSCĐ (LCTT) · quy mô, so cùng kỳ, tỷ trọng'); let v1 = 'abs';
  seg(c1, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const b = byGroup('capex', sel(), S.mode), tot = b.labels.map((_, i) => b.groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0));
    chart(c1.host, 'dk-fin-capex-' + v1, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v1 === 'abs' ? g.values : v1 === 'yoy' ? (growth('capex', sel(), S.mode).groups.find(z => z.id === g.id)?.values || []) : g.values.map((v, i) => fin(v) && tot[i] ? v / tot[i] * 100 : null)})), {unit: v1 === 'abs' ? 'tỷ đ' : '%', digits: v1 === 'abs' ? 0 : 1, native: v1 === 'yoy' ? 'line' : 'stack', stackable: v1 !== 'yoy', zeroBase: v1 !== 'yoy'});
    foot(c1, `CAPEX tiền mặt ${modeName(S.mode)}; không gồm tăng tài sản do M&A, lãi vay vốn hóa chưa tách; LCTT quý dùng từ năm khớp số năm`); }
  renders.push(draw1);
  // Chart 2: cường độ đầu tư
  const c2 = card('dk-fin-intensity', 'Cường độ đầu tư', 'CAPEX/khấu hao (đường 1 lần), CAPEX/doanh thu, CAPEX/tổng tài sản bình quân, CAPEX/CFO'); let g2 = 'all'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  function draw2() { p2(); const x = scopeOf(g2), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), R = (a, b, avg, sc = 1) => ratio({m: a}, {m: b, avg}, x, mode, sc).values;
    chart(c2.host, 'dk-fin-intensity', L, [{name: 'CAPEX/khấu hao (lần)', color: LINE[0], values: R('capex', 'da')}, {name: 'Mốc 1 lần', color: '#9AA3BD', values: L.map(() => 1)}, {name: 'CAPEX/doanh thu (lần)', color: LINE[2], values: R('capex', 'revenue')}, {name: 'CAPEX/tổng tài sản bình quân (lần)', color: LINE[1], values: R('capex', 'total_assets', true)}, {name: 'CAPEX/CFO (lần)', color: LINE[3], values: R('capex', 'cfo')}], {unit: 'lần', digits: 2});
    foot(c2, `${mode === 'y' ? 'năm' : 'TTM'}; CAPEX vượt khấu hao không đồng nghĩa toàn bộ là đầu tư mở rộng`); }
  renders.push(draw2);
  // Chart 3: XDCB dở dang
  const c3 = card('dk-fin-cip', 'XDCB dở dang theo khâu', 'Vốn đã đầu tư nhưng tài sản chưa hoàn thành · giá trị, so cùng kỳ, so tổng tài sản, so TSCĐ hữu hình ròng'); let v3 = 'abs';
  seg(c3, 'Cách xem', [['abs', 'Tỷ đồng'], ['yoy', 'So cùng kỳ (%)'], ['ta', '% tổng tài sản'], ['ppe', '% TSCĐ ròng']], () => v3, k => { v3 = k; draw3(); });
  function draw3() { const mode = S.mode === 'y' ? 'y' : 'q', b = byGroup('cip', sel(), mode);
    if (v3 === 'abs' || v3 === 'yoy') chart(c3.host, 'dk-fin-cip-' + v3, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v3 === 'abs' ? g.values : (growth('cip', sel(), mode).groups.find(z => z.id === g.id)?.values || [])})), {unit: v3 === 'abs' ? 'tỷ đ' : '%', digits: v3 === 'abs' ? 0 : 1, native: v3 === 'abs' ? 'stack' : 'line', stackable: v3 === 'abs', zeroBase: v3 === 'abs'});
    else chart(c3.host, 'dk-fin-cip-' + v3, b.labels, D.groups.filter(g => S.groups.includes(g.id)).map(g => ({name: g.label, color: g.color, values: ratio({m: 'cip'}, {m: v3 === 'ta' ? 'total_assets' : 'ppe_net'}, scopeOf(g.id), mode, 100).values})), {unit: '%', digits: 1});
    foot(c3, `số dư cuối ${mode === 'y' ? 'năm' : 'quý'}`); }
  renders.push(draw3);
  // Chart "Hình thành tài sản: XDCB dở dang, TSCĐ và khấu hao" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Chart 5: tài trợ CAPEX
  const c5 = card('dk-fin-funding', 'CAPEX được tài trợ bằng nguồn nào? (tỷ đồng)', 'CFO, CAPEX, FCF, vay nợ ròng, vốn góp bằng tiền, cổ tức đã trả · và CFO/CAPEX');
  function draw5() { const x = sel(), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), T = m => total(m, x, mode).values, cr = ratio({m: 'cfo'}, {m: 'capex'}, x, mode).values;
    chart(c5.host, 'dk-fin-funding', L, [{name: 'CFO', color: LINE[0], values: T('cfo')}, {name: 'CAPEX', color: LINE[2], values: T('capex').map(v => fin(v) ? -v : null)}, {name: 'FCF', color: LINE[1], values: T('fcf')}, {name: 'Vay nợ ròng', color: LINE[3], values: T('net_borrow')}, {name: 'Vốn góp bằng tiền', color: LINE[5], values: T('equity_raised')}, {name: 'Cổ tức đã trả', color: LINE[4], values: T('dividends').map(v => fin(v) ? -v : null)}], {unit: 'tỷ đ', native: 'bar'});
    foot(c5, `${mode === 'y' ? 'năm' : 'TTM'}; FCF = CFO − CAPEX tiền mặt; CAPEX và cổ tức vẽ số âm (tiền ra); không phải toàn bộ biến động tiền (còn đầu tư tài chính, tỷ giá…)`); }
  renders.push(draw5);
  // Chart "Mức hao mòn kế toán của nền tài sản" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Chart "Vốn mới đang vào đâu so với nơi tạo lợi nhuận và dòng tiền?" bỏ 25/11/2026 theo yêu cầu người dùng.
  s.append(grid2(c1, c2), grid2(c3, c5));
  return s;
}

/* ---------- 1.4 Phải thu và chất lượng dòng tiền ---------- */
function s74() {
  const s = section('1.4', 'Tồn kho, công nợ & chuyển đổi tiền', 'Vốn đang nằm ở tồn kho hay công nợ, và lợi nhuận ghi nhận có chuyển thành dòng tiền?');
  const c1 = card('dk-fin-recv', 'Phải thu khách hàng theo khâu (tỷ đồng)', 'Số dư cuối kỳ · giá trị hoặc so cùng kỳ'); let v1 = 'abs';
  seg(c1, 'Cách xem', [['abs', 'Tỷ đồng'], ['yoy', 'So cùng kỳ (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const mode = S.mode === 'y' ? 'y' : 'q', b = byGroup('receivables', sel(), mode);
    chart(c1.host, 'dk-fin-recv-' + v1, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v1 === 'abs' ? g.values : (growth('receivables', sel(), mode).groups.find(z => z.id === g.id)?.values || [])})), {unit: v1 === 'abs' ? 'tỷ đ' : '%', digits: v1 === 'abs' ? 0 : 1, native: v1 === 'abs' ? 'stack' : 'line', stackable: v1 === 'abs', zeroBase: v1 === 'abs'});
    foot(c1, 'phải thu khách hàng ngắn hạn'); }
  renders.push(draw1);
  const c2 = card('dk-fin-dso', 'Số ngày thu tiền bình quân (DSO) theo khâu (ngày)', 'Phải thu khách hàng bình quân ÷ doanh thu TTM × 365');
  function draw2() { const mode = S.mode === 'y' ? 'y' : 'ttm', L = E.labels(mode);
    chart(c2.host, 'dk-fin-dso', L, D.groups.filter(g => S.groups.includes(g.id)).map(g => ({name: g.label, color: g.color, values: ratio({m: 'receivables', avg: true}, {m: 'revenue'}, scopeOf(g.id), mode, 365).values})), {unit: 'ngày'});
    foot(c2, 'DSO của toàn doanh nghiệp'); }
  renders.push(draw2);
  const c3 = card('dk-fin-conversion', 'Lợi nhuận chuyển thành tiền đến đâu?', 'CFO/EBITDA, CFO/LNST (lần) và biên CFO (%) · chọn khâu'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), R = (a, b, sc = 1) => ratio({m: a}, {m: b}, x, mode, sc).values;
    chart(c3.host, 'dk-fin-conversion', L, [{name: 'CFO/EBITDA (lần)', color: LINE[0], values: R('cfo', 'ebitda')}, {name: 'CFO/LNST (lần)', color: LINE[2], values: R('cfo', 'npat')}, {name: 'Biên CFO (%) ÷ 100', color: LINE[1], values: R('cfo', 'revenue')}], {unit: 'lần', digits: 2});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; biên CFO vẽ dạng tỷ lệ (0,2 = 20%)`); }
  renders.push(draw3);
  // Chart "Vốn lưu động và áp lực tài trợ" và bảng "Phải thu và chuyển hóa dòng tiền theo doanh nghiệp" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Tồn kho (28/11/2026): biến quyết định lợi nhuận quý của lọc dầu và phân phối khi giá dầu đổi chiều.
  const c4 = card('dk-fin-inv', 'Hàng tồn kho theo khâu', 'Số dư cuối kỳ (tỷ đồng) · số ngày tồn kho · số ngày phải trả người bán'); let v4 = 'abs';
  seg(c4, 'Cách xem', [['abs', 'Tỷ đồng'], ['dio', 'Số ngày tồn kho'], ['dpo', 'Số ngày phải trả']], () => v4, k => { v4 = k; draw4(); });
  function draw4() { const sm = S.mode === 'y' ? 'y' : 'q', fm = S.mode === 'y' ? 'y' : 'ttm';
    if (v4 === 'abs') { const b = byGroup('inventory', sel(), sm); chart(c4.host, 'dk-fin-inv-abs', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true}); }
    else chart(c4.host, 'dk-fin-inv-' + v4, E.labels(fm), liveGroups().map(g => ({name: g.label, color: g.color, values: ratio({m: v4 === 'dio' ? 'inventory' : 'payables', avg: true}, {m: 'cogs'}, scopeOf(g.id), fm, 365).values})), {unit: 'ngày'});
    foot(c4, v4 === 'abs' ? 'hàng tồn kho sau dự phòng giảm giá, cuối kỳ' : `${v4 === 'dio' ? 'hàng tồn kho' : 'phải trả người bán ngắn hạn'} bình quân ÷ giá vốn ${fm === 'y' ? 'năm' : 'TTM'} × 365`); }
  renders.push(draw4);
  s.append(grid2(c1, c2), grid2(c4, c3));
  return s;
}

/* ---------- 1.5 Đòn bẩy và phân bổ dòng tiền ---------- */
function s75() {
  // 28/11/2026: mục cũ "Nợ, thanh khoản & FCF" hỏi về áp lực nợ (khung Điện). Rổ dầu khí giữ tiền ròng nên câu hỏi là tiền nằm ở đâu và trả cổ tức được bao nhiêu.
  const s = section('1.5', 'Tiền ròng & cổ tức', 'Tiền đang nằm ở khâu nào, còn lại bao nhiêu sau nợ vay, và dòng tiền có đủ trả cổ tức?');
  const c1 = card('dk-fin-netcash', 'Tiền ròng theo khâu (tỷ đồng)', 'Tiền + đầu tư ngắn hạn − nợ vay · số âm là nợ vay ròng'); let v1 = 'net';
  seg(c1, 'Cách xem', [['net', 'Tiền ròng'], ['cash', 'Tiền & đầu tư ngắn hạn'], ['debt', 'Nợ vay']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const mode = S.mode === 'y' ? 'y' : 'q', b = byGroup(v1 === 'net' ? 'net_debt' : v1 === 'cash' ? 'cash_all' : 'debt', sel(), mode);
    chart(c1.host, 'dk-fin-netcash-' + v1, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v1 === 'net' ? minus(g.values) : g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c1, `số dư cuối ${mode === 'y' ? 'năm' : 'quý'}; nợ vay chịu lãi (vay và nợ thuê tài chính); tiền gồm cả phần hình thành từ phải trả người bán và khách ứng trước, chưa trừ`); }
  renders.push(draw1);
  const c2 = card('dk-fin-cashmix', 'Tiền so với tài sản, vốn chủ và vốn chiếm dụng (lần)', 'Tiền & đầu tư ngắn hạn/tổng tài sản · tiền ròng/VCSH · nợ vay/VCSH · phải trả người bán/tiền · chọn khâu'); let g2 = 'all'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  function draw2() { p2(); const x = scopeOf(g2), mode = S.mode === 'y' ? 'y' : 'q', L = E.labels(mode), R = (a, b) => ratio({m: a}, {m: b}, x, mode).values;
    chart(c2.host, 'dk-fin-cashmix', L, [{name: 'Tiền & đầu tư ngắn hạn/tổng tài sản', color: LINE[1], values: R('cash_all', 'total_assets')}, {name: 'Tiền ròng/VCSH', color: LINE[0], values: minus(R('net_debt', 'equity'))}, {name: 'Nợ vay/VCSH', color: LINE[2], values: R('debt', 'equity')}, {name: 'Phải trả người bán/tiền & đầu tư ngắn hạn', color: LINE[3], values: R('payables', 'cash_all')}], {unit: 'lần', digits: 2});
    foot(c2, 'hệ số tính từ tổng; phải trả người bán/tiền trên 1 lần: số tiền đang giữ nhỏ hơn khoản nợ nhà cung cấp'); }
  renders.push(draw2);
  const c3 = card('dk-fin-fininc', 'Thu nhập tài chính so với chi phí lãi vay (tỷ đồng)', 'Doanh thu hoạt động tài chính và chi phí lãi vay · chọn khâu'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode, L = E.labels(mode);
    chart(c3.host, 'dk-fin-fininc', L, [{name: 'Doanh thu hoạt động tài chính', color: LINE[1], values: total('fin_income', x, mode).values}, {name: 'Chi phí lãi vay', color: LINE[2], values: total('interest', x, mode).values}], {unit: 'tỷ đ', native: 'bar'});
    foot(c3, `${modeName(mode)}; doanh thu tài chính gồm lãi tiền gửi, lãi tỷ giá, cổ tức được chia; BCTC tóm tắt không tách riêng lãi tiền gửi`); }
  renders.push(draw3);
  const c4 = card('dk-fin-fcf', 'Dòng tiền tự do và cổ tức đã trả', 'Theo khâu, kỳ chốt: CFO, CAPEX, FCF, cổ tức đã trả, vay nợ ròng (tỷ đ)');
  function draw4() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'ttm', i = endIdx(mode), gs = D.groups.filter(g => S.groups.includes(g.id));
    const v = (m, g) => { const b = byGroup(m, x, mode).groups.find(z => z.id === g.id); return b && fin(b.values[i]) ? Math.round(b.values[i]) : null; };
    const ms = [['cfo', 'CFO', LINE[0], 1], ['capex', 'CAPEX', LINE[2], -1], ['fcf', 'FCF', LINE[1], 1], ['dividends', 'Cổ tức đã trả', LINE[4], -1], ['net_borrow', 'Vay nợ ròng', LINE[3], 1]];
    const m = {key: 'dk-fin-fcf', categories: gs.map(g => g.label), series: ms.map(([k, n, c, sgn]) => ({name: n, color: c, values: gs.map(g => { const a = v(k, g); return fin(a) ? a * sgn : null; })})), unit: 'tỷ đ', digits: 0, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c4.host, m, () => { c4.host.innerHTML = ChartTypes.render(m, 'bar'); });
    foot(c4, `${mode === 'y' ? 'năm' : 'TTM'} ${qLabel(E.labels(mode)[i] || '')}; CAPEX và cổ tức vẽ số âm (tiền ra)`); }
  renders.push(draw4);
  const c5 = card('dk-fin-levdist', 'Bao nhiêu doanh nghiệp có tiền ròng?', 'Số doanh nghiệp có tiền ròng và theo mức nợ vay ròng/EBITDA TTM');
  function draw5() { const x = sel(), L = D.periods, nd = E.per('net_debt', x, 'q'), eb = E.per('ebitda', x, 'ttm');
    const cnt = f => L.map((_, i) => { const ts = x.filter(t => fin(nd[t][i]) && fin(eb[t][i])); return ts.length ? ts.filter(t => f(nd[t][i], eb[t][i])).length : null; });
    chart(c5.host, 'dk-fin-levdist', L, [{name: 'Tiền ròng', color: '#2a9fa3', values: cnt(n => n <= 0)}, {name: '0–2 lần', color: '#8997D6', values: cnt((n, e) => n > 0 && e > 0 && n / e <= 2)}, {name: '2–4 lần', color: '#2938A8', values: cnt((n, e) => n > 0 && e > 0 && n / e > 2 && n / e <= 4)}, {name: 'Trên 4 lần', color: '#1D2678', values: cnt((n, e) => n > 0 && e > 0 && n / e > 4)}, {name: 'EBITDA không dương', color: '#c98a00', values: cnt((n, e) => n > 0 && e <= 0)}], {unit: 'DN', native: 'stack', stackable: true});
    foot(c5, 'công cụ xem mức độ tập trung, không phải xếp hạng tín dụng'); }
  renders.push(draw5);
  s.append(grid2(c1, c2), grid2(c3, c4), c5.el);
  return s;
}

/* ---------- 1.6 Hiệu quả sử dụng vốn ---------- */
// 28/11/2026: ROCE thay ROIC. ROIC cũ trừ hết tiền khỏi vốn đầu tư nên PVS ra 147%, BSR 78% (tiền của PVS, OIL, PLX phần lớn do phải trả và khách ứng trước),
// và EBIT bỏ lãi liên doanh FSO/FPSO của PVS. ROCE = (LNTT + lãi vay) × (1 − thuế suất hiệu dụng, 0–30%) ÷ (VCSH + nợ vay) bình quân: tử số gồm lãi liên doanh và
// thu nhập tài chính, mẫu số giữ nguyên tiền, không cần giả định "tiền vượt nhu cầu vận hành" (BCTC không tách được).
function roce(x, mode) {
  const L = E.labels(mode), pb = E.per('pbt', x, mode), it = E.per('interest', x, mode), tx = E.per('tax', x, mode), eq = E.per('equity', x, mode, true), db = E.per('debt', x, mode, true);
  const N = Object.fromEntries(x.map(t => [t, L.map((_, i) => { if (![pb, it, tx].every(z => fin(z[t][i]))) return null; const r = pb[t][i] > 0 ? Math.min(.3, Math.max(0, tx[t][i] / pb[t][i])) : 0; return (pb[t][i] + it[t][i]) * (1 - r); })]));
  const C = Object.fromEntries(x.map(t => [t, L.map((_, i) => fin(eq[t][i]) && fin(db[t][i]) ? eq[t][i] + db[t][i] : null)]));
  const values = L.map((_, i) => { const ts = x.filter(t => fin(N[t][i]) && fin(C[t][i])); const d = ts.reduce((a, t) => a + C[t][i], 0); return okCov(ts.length, x.length) && d > 0 ? ts.reduce((a, t) => a + N[t][i], 0) / d * 100 : null; });
  const each = Object.fromEntries(x.map(t => [t, L.map((_, i) => fin(N[t][i]) && fin(C[t][i]) && C[t][i] > 0 ? N[t][i] / C[t][i] * 100 : null)]));
  return {labels: L, values, each, num: N};
}
// Vốn sử dụng cuối kỳ (VCSH + nợ vay) từng mã.
const capital = x => { const eq = E.per('equity', x, 'q'), db = E.per('debt', x, 'q'); return Object.fromEntries(x.map(t => [t, D.periods.map((_, i) => fin(eq[t][i]) && fin(db[t][i]) ? eq[t][i] + db[t][i] : null)])); };
function s76() {
  const s = section('1.6', 'Hiệu quả vốn', 'Vốn bỏ vào từng khâu đang sinh lời thế nào, và khâu nào giữ nhiều tiền chưa dùng?');
  const c1 = card('dk-fin-returns', 'ROE, ROA, ROCE (%)', 'TTM hoặc năm · chọn khâu · đường mảnh là bình quân lịch sử của chính chỉ tiêu'); let g1 = 'all'; const p1 = groupPicker(c1, () => g1, (v, q) => { g1 = v; if (!q) draw1(); });
  function draw1() { p1(); const x = scopeOf(g1), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), roe = ratio({m: 'npat'}, {m: 'equity', avg: true}, x, mode, 100).values, roa = ratio({m: 'npat'}, {m: 'total_assets', avg: true}, x, mode, 100).values, ri = roce(x, mode).values;
    const avg = v => { const a = v.filter(fin); return a.length ? a.reduce((s, z) => s + z, 0) / a.length : null; };
    chart(c1.host, 'dk-fin-returns', L, [{name: 'ROE', color: LINE[0], values: roe}, {name: 'ROA', color: LINE[1], values: roa}, {name: 'ROCE', color: LINE[2], values: ri}, {name: 'ROE bình quân', color: '#9AA3BD', values: L.map(() => avg(roe))}, {name: 'ROCE bình quân', color: '#e3c98a', values: L.map(() => avg(ri))}], {unit: '%', digits: 1, zeroBase: false});
    foot(c1, 'ROE = LNST hợp nhất ÷ VCSH (gồm lợi ích CĐKKS) bình quân; ROCE = (LNTT + lãi vay) × (1 − thuế suất hiệu dụng, tối đa 30%) ÷ (VCSH + nợ vay) bình quân, không trừ tiền'); }
  renders.push(draw1);
  const c2 = card('dk-fin-dupont', 'Phân rã ROE (DuPont)', 'Biên LNST × vòng quay tài sản × đòn bẩy (tổng tài sản/VCSH) · chọn khâu'); let g2 = 'all'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  function draw2() { p2(); const x = scopeOf(g2), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    // Cùng tập doanh nghiệp có đủ LNST, doanh thu, tài sản bình quân, VCSH bình quân
    const n = E.per('npat', x, mode), r = E.per('revenue', x, mode), a = E.per('total_assets', x, mode, true), q = E.per('equity', x, mode, true);
    const parts = L.map((_, i) => { const ts = x.filter(t => [n, r, a, q].every(z => fin(z[t][i]))); if (!okCov(ts.length, x.length)) return null; const S2 = z => ts.reduce((s, t) => s + z[t][i], 0), N = S2(n), R = S2(r), A = S2(a), Qv = S2(q); return R && A && Qv ? {m: N / R * 100, t: R / A, l: A / Qv, roe: N / Qv * 100} : null; });
    chart(c2.host, 'dk-fin-dupont', L, [{name: 'ROE (%)', color: LINE[0], values: parts.map(p => p?.roe ?? null)}, {name: 'Biên LNST (%)', color: LINE[2], values: parts.map(p => p?.m ?? null)}, {name: 'Vòng quay tài sản (lần)', color: LINE[1], values: parts.map(p => p?.t ?? null)}, {name: 'Đòn bẩy (lần)', color: LINE[3], values: parts.map(p => p?.l ?? null)}], {unit: '', digits: 2, zeroBase: false});
    foot(c2, 'ROE = biên × vòng quay × đòn bẩy, cùng tập doanh nghiệp, tài sản và VCSH bình quân'); }
  renders.push(draw2);
  const c3 = card('dk-fin-roic-cycle', 'ROCE và chu kỳ vốn', 'ROCE (%), CAPEX/khấu hao (lần), XDCB dở dang/tổng tài sản (%) · chọn khâu'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    const cipTa = ratio({m: 'cip'}, {m: 'total_assets'}, x, mode === 'y' ? 'y' : 'q', 100).values;
    chart(c3.host, 'dk-fin-roic-cycle', L, [{name: 'ROCE (%)', color: LINE[0], values: roce(x, mode).values}, {name: 'CAPEX/khấu hao (lần)', color: LINE[2], values: ratio({m: 'capex'}, {m: 'da'}, x, mode).values}, {name: 'XDCB dở dang/tổng tài sản (%)', color: LINE[1], values: cipTa}], {unit: '', digits: 1});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; đặt cạnh nhau để phân biệt ROCE thấp do vận hành với ROCE thấp khi dự án đang xây`); }
  renders.push(draw3);
  const c4 = card('dk-fin-map', 'Bản đồ hiệu quả vốn', 'Trục ngang: tiền & đầu tư ngắn hạn/tổng tài sản · trục dọc: ROCE TTM · kích thước: vốn sử dụng'); let v4 = 'group';
  seg(c4, 'Đơn vị', [['group', 'Khâu'], ['firm', 'Doanh nghiệp']], () => v4, k => { v4 = k; draw4(); });
  function draw4() { const x = sel(), i = S.end, cap = capital(x), cs = E.per('cash_all', x, 'q'), ta = E.per('total_assets', x, 'q'), S2 = (z, ts) => ts.reduce((a, t) => a + (fin(z[t][i]) ? z[t][i] : 0), 0);
    const pt = (l, c, ts) => ({l, c, x: S2(ta, ts) > 0 ? S2(cs, ts) / S2(ta, ts) * 100 : null, y: roce(ts, 'ttm').values[i], s: S2(cap, ts)});
    const pts = (v4 === 'firm' ? x.map(t => pt(t, GC[E.groupOf[t]], [t])) : liveGroups().map(g => pt(g.label, g.color, scopeOf(g.id)))).filter(p => fin(p.x) && fin(p.y) && fin(p.s) && p.s > 0);
    c4.host.innerHTML = bubble(pts);
    foot(c4, `${qLabel(D.periods[i])}; bên phải: giữ nhiều tiền; vốn sử dụng = VCSH + nợ vay`); }
  renders.push(draw4);
  const c5 = card('dk-fin-pool', 'Vốn sử dụng so với lợi nhuận tạo ra', 'Tỷ trọng từng khâu trong vốn sử dụng và trong lợi nhuận trước lãi vay TTM · kỳ chốt');
  function draw5() { const x = sel(), i = S.end, gs = liveGroups(), cap = capital(x), pb = E.per('pbt', x, 'ttm'), it = E.per('interest', x, 'ttm');
    const sum = f => gs.map(g => { const v = scopeOf(g.id).map(f); return v.every(fin) ? v.reduce((a, b) => a + b, 0) : null; });
    const sh = v => { const tot = v.reduce((a, b) => a + (fin(b) && b > 0 ? b : 0), 0); return v.map(z => fin(z) && tot ? Math.round(z / tot * 1000) / 10 : null); };
    const m = {key: 'dk-fin-pool', categories: gs.map(g => g.label), series: [{name: 'Tỷ trọng vốn sử dụng', color: '#9AA3BD', values: sh(sum(t => cap[t][i]))}, {name: 'Tỷ trọng LNTT + lãi vay TTM', color: '#1D2678', values: sh(sum(t => fin(pb[t][i]) && fin(it[t][i]) ? pb[t][i] + it[t][i] : null))}], unit: '%', digits: 1, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c5.host, m, () => { c5.host.innerHTML = ChartTypes.render(m, 'bar'); });
    foot(c5, `${qLabel(D.periods[i])}; vốn sử dụng = VCSH + nợ vay (số dư cuối kỳ)`); }
  renders.push(draw5);
  s.append(grid2(c1, c2), grid2(c3, c4), c5.el);
  return s;
}
function bubble(pts) {
  if (!pts.length) return '';
  const W = 640, H = 340, m = {l: 46, r: 30, t: 24, b: 34}, xs = pts.map(p => p.x), ys = pts.map(p => p.y), sm = Math.max(...pts.map(p => p.s));
  let x0 = Math.min(0, ...xs), x1 = Math.max(...xs, 1), y0 = Math.min(0, ...ys), y1 = Math.max(...ys, 1);
  const px = (x1 - x0) * .14, py = (y1 - y0) * .16; x0 -= px; x1 += px; y0 -= y0 < 0 ? py : 0; y1 += py;  // lề để bong bóng và nhãn không bị cắt
  const X = v => m.l + (v - x0) / ((x1 - x0) || 1) * (W - m.l - m.r), Y = v => H - m.b - (v - y0) / ((y1 - y0) || 1) * (H - m.t - m.b), R = v => 6 + Math.sqrt(v / sm) * 26;
  const tx = [x0, (x0 + x1) / 2, x1], ty = [y0, (y0 + y1) / 2, y1];
  // Nhãn các bong bóng gần nhau thì xếp lệch dòng để không chồng chữ.
  const placed = [], LY = p => { const cx = X(p.x), w = String(p.l).length * 3.6 + 8; let ly = Y(p.y) + 4; while (placed.some(q => Math.abs(q.y - ly) < 13 && Math.abs(q.x - cx) < q.w + w)) ly += 13; placed.push({x: cx, y: ly, w}); return ly; };
  return `<svg class="pf-bubble" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bản đồ hiệu quả vốn">
    ${ty.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${nf(v, 0)}%</text>`).join('')}
    ${tx.map(v => `<text x="${X(v)}" y="${H - 12}" text-anchor="middle">${nf(v, 0)}%</text>`).join('')}
    ${x0 < 0 ? `<line x1="${X(0)}" x2="${X(0)}" y1="${m.t}" y2="${H - m.b}" class="z"/>` : ''}${y0 < 0 ? `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}" class="z"/>` : ''}
    ${pts.sort((a, b) => b.s - a.s).map(p => `<g><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${R(p.s)}" fill="${p.c}" fill-opacity=".55" stroke="${p.c}"><title>${esc(p.l)}: ROCE ${nf(p.y, 1)}%, tiền & đầu tư ngắn hạn ${nf(p.x, 1)}% tổng tài sản, vốn sử dụng ${nf(p.s)} tỷ đ</title></circle><text x="${X(p.x)}" y="${LY(p)}" text-anchor="middle" class="l">${esc(p.l)}</text></g>`).join('')}</svg>`;
}

/* ---------- Xuất CSV ---------- */
function download(name, rows) {
  const csv = '﻿' + rows.map(r => r.map(v => { const s = v == null ? '' : String(v); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'})); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const ITEMN = Object.fromEntries([...D.items.map(i => [i.id, i.name]), ...Object.entries(IndustryFin.DERIVED).map(([k, d]) => [k, d.name])]);
function exportCsv(kind) {
  const stamp = D.captured, x = sel();
  if (kind === 'raw') { const rows = [['ticker', 'subsector', 'period', 'period_type', 'metric_id', 'metric_name', 'value', 'unit', 'statement_scope', 'source', 'captured']];
    D.companies.forEach(c => { const g = D.groups.find(z => z.id === c.group)?.label; Object.entries(D.data[c.ticker] || {}).forEach(([m, arr]) => arr.forEach((v, i) => { if (v != null) rows.push([c.ticker, g, D.periods[i], E.kind[m] === 'stock' ? 'cuối quý' : 'quý', m, ITEMN[m], v, 'tỷ đồng', 'hợp nhất', D.source, stamp]); }));
      Object.entries(D.cf_annual?.[c.ticker] || {}).forEach(([m, arr]) => arr.forEach((v, i) => { if (v != null) rows.push([c.ticker, g, E.years[i], 'năm (báo cáo năm)', m, ITEMN[m], v, 'tỷ đồng', 'hợp nhất', D.source, stamp]); })); });
    return download(`dau-khi-tai-chinh-doanh-nghiep-${stamp}.csv`, rows); }
  if (kind === 'group') { const rows = [['group', 'period', 'period_type', 'metric_id', 'metric_name', 'value', 'unit', 'companies_with_data', 'companies_in_group', 'source', 'method']];
    ['revenue', 'gross', 'ebitda', 'ebit', 'npat', 'da', 'cfo', 'capex', 'fcf', 'cip', 'ppe_net', 'ppe_gross', 'receivables', 'debt', 'net_debt', 'equity', 'total_assets', 'interest', 'dividends'].forEach(m => {
      const mode = E.kind[m] === 'stock' ? (S.mode === 'y' ? 'y' : 'q') : S.mode, b = byGroup(m, x, mode);
      b.groups.forEach(g => b.labels.forEach((p, i) => { if (g.values[i] != null) rows.push([g.label, p, mode, m, ITEMN[m], Math.round(g.values[i] * 100) / 100, 'tỷ đồng', g.cov[i], g.tickers.length, D.source, 'tổng doanh nghiệp đủ số; loại trùng công ty mẹ − con khi cùng được chọn']); })); });
    return download(`dau-khi-tai-chinh-nhom-${S.mode}-${stamp}.csv`, rows); }
  if (kind === 'ratio') { const rows = [['scope', 'period', 'period_type', 'ratio', 'value', 'unit', 'companies_with_data', 'median', 'p25', 'p75', 'formula']];
    const mode = S.mode === 'q' ? 'ttm' : S.mode, defs = [['ROE', {m: 'npat'}, {m: 'equity', avg: true}, 100, '%', 'LNST ÷ VCSH bình quân'], ['ROA', {m: 'npat'}, {m: 'total_assets', avg: true}, 100, '%', 'LNST ÷ tổng tài sản bình quân'], ['Biên gộp', {m: 'gross'}, {m: 'revenue'}, 100, '%', 'LN gộp ÷ doanh thu'], ['Biên EBITDA', {m: 'ebitda'}, {m: 'revenue'}, 100, '%', 'EBITDA ÷ doanh thu'], ['Biên EBIT', {m: 'ebit'}, {m: 'revenue'}, 100, '%', 'EBIT ÷ doanh thu'], ['Biên LNST', {m: 'npat'}, {m: 'revenue'}, 100, '%', 'LNST ÷ doanh thu'], ['Số ngày tồn kho', {m: 'inventory', avg: true}, {m: 'cogs'}, 365, 'ngày', 'hàng tồn kho bình quân ÷ giá vốn × 365'], ['Tiền/tổng tài sản', {m: 'cash_all'}, {m: 'total_assets'}, 100, '%', 'tiền + đầu tư ngắn hạn ÷ tổng tài sản'], ['CAPEX/khấu hao', {m: 'capex'}, {m: 'da'}, 1, 'lần', 'CAPEX ÷ khấu hao'], ['CFO/EBITDA', {m: 'cfo'}, {m: 'ebitda'}, 1, 'lần', 'CFO ÷ EBITDA'], ['DSO', {m: 'receivables', avg: true}, {m: 'revenue'}, 365, 'ngày', 'phải thu KH bình quân ÷ doanh thu × 365']];
    [['all', 'Nhóm đang chọn', x], ...D.groups.filter(g => S.groups.includes(g.id)).map(g => [g.id, g.label, scopeOf(g.id)])].forEach(([, name, ts]) => defs.forEach(([n, a, b, sc, u, f]) => { const r = ratio(a, b, ts, mode, sc); r.labels.forEach((p, i) => { if (r.values[i] != null) rows.push([name, p, mode, n, Math.round(r.values[i] * 1000) / 1000, u, r.cov[i], r.dist[i].med, r.dist[i].p25, r.dist[i].p75, f]); }); }));
    return download(`dau-khi-tai-chinh-he-so-${mode}-${stamp}.csv`, rows); }
  const rows = [['ticker', 'subsector', 'in_default_universe', 'note', 'consolidated_into', 'since']];
  D.companies.forEach(c => { const g = D.groups.find(z => z.id === c.group); const p = (D.consolidation || []).find(z => z.child === c.ticker); rows.push([c.ticker, g?.label, g?.default ? 'có' : 'không', c.note || '', p?.parent || '', p?.since || '']); });
  rows.push([], ['methodology']); ['Tổng tuyệt đối = tổng doanh nghiệp có số; hệ số = tổng tử ÷ tổng mẫu cùng tập doanh nghiệp.', 'TTM = tổng 4 quý liền; năm: KQKD = tổng 4 quý, LCTT = số báo cáo năm; số dư dùng cuối kỳ, bình quân = (cuối kỳ + cùng kỳ năm trước)/2.', 'EBIT = LN gộp − CP bán hàng − CP QLDN; EBITDA = EBIT + khấu hao (LCTT); CAPEX = tiền chi mua sắm, xây dựng TSCĐ; FCF = CFO − CAPEX.', 'LCTT quý dùng cho năm có tổng 4 quý khớp số năm (lệch ≤ 5%); năm lệch để trống.', 'Loại trùng hợp nhất: khi công ty mẹ và con cùng được chọn, công ty mẹ dùng số (mẹ − con).'].forEach(t => rows.push([t]));
  download(`dau-khi-tai-chinh-universe-${stamp}.csv`, rows);
}

/* ---------- Dựng ---------- */
function methods() {
  const d = el('details', 'card pf-method'); d.dataset.blockId = 'dk-fin-method'; d.dataset.updateKind = 'public'; d.dataset.cadence = 'quarterly'; d.dataset.refreshStatus = 'snapshot';
  d.innerHTML = `<summary><b>Phương pháp & tải dữ liệu</b> <small>BCTC hợp nhất · ${D.companies.length} doanh nghiệp · ${qLabel(D.periods[0])} – ${qLabel(D.periods.at(-1))}</small></summary>
    <ul class="pp-ul"><li>Tổng tuyệt đối = tổng các doanh nghiệp có số ở kỳ đó; doanh nghiệp thiếu số không được cộng, độ phủ ghi dưới mỗi chart.</li>
    <li>Hệ số = tổng tử số ÷ tổng mẫu số trên cùng tập doanh nghiệp có đủ cả hai; không lấy trung bình các hệ số.</li>
    <li>TTM = tổng 4 quý liền, đủ cả 4 quý. Năm: KQKD = tổng 4 quý, LCTT = số báo cáo năm (LCTT quý trên VNDirect trước 2024 không khớp số năm thì để trống). Số dư: cuối kỳ; bình quân = (cuối kỳ + cùng kỳ năm trước)/2.</li>
    <li>EBITDA = LN gộp − chi phí bán hàng − chi phí QLDN + khấu hao; FCF = CFO − tiền chi mua sắm TSCĐ; tiền ròng = tiền + đầu tư ngắn hạn − nợ vay; vốn sử dụng = VCSH + nợ vay; ROCE = (LNTT + lãi vay) × (1 − thuế suất hiệu dụng) ÷ vốn sử dụng bình quân.</li>
    <li>Kỳ có dưới 80% số mã trong rổ đủ số thì để trống: LCTT quý trên VNDirect trước 2024 thiếu ở nhiều mã, PLC thiếu LCTT quý 2024–2025.</li>
    <li>Doanh thu cộng giữa các khâu có trùng (BSR bán sản phẩm cho PLX, OIL; GAS bán LPG) nên trang không tính biên cho cả rổ, chỉ tính theo từng khâu.</li>
    <li>Loại trùng công ty mẹ – con khi cả hai cùng trong rổ: PLX hợp nhất PLC, PVT hợp nhất PVP, GAS hợp nhất CNG (tỷ lệ sở hữu chưa đối chiếu báo cáo thường niên).</li><li>Biên gộp của BSR, PLX, OIL gồm cả lãi/lỗ do giá trị tồn kho đổi theo giá dầu; BCTC quý không tách riêng khoản này, nên biên ở đây không phải biên lõi.</li></ul>
    <div class="pf-ctl"><span class="pf-lb">Tải CSV</span>${[['raw', 'Số liệu từng doanh nghiệp'], ['group', 'Tổng theo nhóm (chu kỳ đang chọn)'], ['ratio', 'Hệ số theo nhóm'], ['universe', 'Danh mục doanh nghiệp & phương pháp']].map(([k, t]) => `<button type="button" class="pf-dl" data-x="${k}">${t}</button>`).join('')}</div>`;
  d.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', () => exportCsv(b.dataset.x)));
  const src = el('div', 'pw-src', `Nguồn: ${SRC}`); d.append(src);
  return d;
}
function redraw() { syncUrl(); renders.forEach(f => { try { f(); } catch (e) { document.documentElement.dataset.pfError = (document.documentElement.dataset.pfError || '') + e.message + ';'; console.error(e); } }); setTimeout(() => window.dispatchEvent(new Event('resize')), 60); }
function build(pane) {
  if (!pane || root) return; root = pane;
  style();
  pane.append(filterBar(), kpis(), s71(), s72(), s73(), s74(), s75(), s76(), methods());
  redraw();
}
function style() {
  if (document.getElementById('pf-style')) return;
  const st = document.createElement('style'); st.id = 'pf-style';
  st.textContent = `.pf-filter{display:grid;gap:8px;margin:6px 0 12px;padding:10px 12px;border:1px solid var(--line,#e3e7f0);border-radius:12px;background:var(--card,#fff)}
.pf-row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}.pf-grid{display:grid;grid-template-columns:110px 1fr;gap:10px 14px;align-items:center}.pf-inline{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
.pf-legend{margin-top:4px}.pf-gtable{width:100%;border-collapse:collapse;font-size:12.5px}.pf-gtable th{text-align:left;font:600 11px Inter,sans-serif;color:var(--muted,#7a8399);text-transform:uppercase;letter-spacing:.04em;padding:6px 10px;border-bottom:1px solid var(--line,#e3e7f0)}
.pf-gtable td{padding:7px 10px;border-bottom:1px solid var(--line,#eef0f6);vertical-align:middle}.pf-gtable td:first-child{white-space:nowrap;font-weight:600;color:var(--ink2,#3b4256);width:230px}.pf-gtable td:last-child{width:90px;color:var(--muted,#7a8399)}
.pf-gtable td i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:8px;vertical-align:-1px}.pf-gtable tr.off td{opacity:.45}.pf-tk{display:inline-block;margin:2px 6px 2px 0;padding:1px 7px;border:1px solid var(--line,#d6dbe8);border-radius:6px;font:600 12px Inter,sans-serif;cursor:help;background:var(--card,#fff)}
.pf-note{margin:6px 2px 0;font-size:11px;color:var(--muted,#7a8399)}.pf-scope{margin:8px 2px 0;font-size:12px;color:var(--ink2,#3b4256)}.pf-q{margin:2px 0 0;font-size:12.5px;color:var(--ink2,#3b4256)}
button.pf-tk[aria-pressed=false]{opacity:.45;text-decoration:line-through}.pf-method{margin-top:18px}.pf-method>summary{cursor:pointer}.pf-method>summary small{color:var(--muted,#7a8399);margin-left:8px}.pf-dl{border:1px solid var(--line,#d6dbe8);background:var(--card,#fff);border-radius:7px;padding:4px 10px;font:600 12px Inter,sans-serif;cursor:pointer}@media (max-width:640px){.pf-grid{grid-template-columns:1fr;gap:4px}.pf-gtable td:first-child{width:auto;white-space:normal}}.pf-lb{font:600 11.5px Inter,sans-serif;color:var(--muted,#7a8399);text-transform:uppercase;letter-spacing:.04em}
.pf-chips{display:flex;flex-wrap:wrap;gap:6px}.pf-chips button,.pf-seg button{border:1px solid var(--line,#d6dbe8);background:var(--card,#fff);color:var(--ink2,#3b4256);border-radius:7px;padding:4px 9px;font:600 12px Inter,sans-serif;cursor:pointer}
.pf-chips button i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px}.pf-chips button small{color:var(--muted,#7a8399);font-weight:500}
.pf-chips button[aria-pressed=false]{opacity:.55}.pf-seg{display:inline-flex;flex-wrap:wrap;gap:4px}.pf-seg button[aria-pressed=true],.pf-chips button[aria-pressed=true]{border-color:#2938A8;box-shadow:inset 0 0 0 1px #2938A8}
.pf-seg button[aria-pressed=true]{background:#2938A8;color:#fff}.pf-filter select,.pf-sel{font:600 12px Inter,sans-serif;padding:4px 6px;border:1px solid var(--line,#d6dbe8);border-radius:7px;background:var(--card,#fff);color:inherit}
.pf-kpis{grid-template-columns:repeat(6,minmax(0,1fr))!important}.pf-kpis .kpi{position:relative}.pf-spark{display:block;width:100%;height:28px;margin:4px 0}.pf-spark polyline{fill:none;stroke:#2938A8;stroke-width:1.6}
.pf-ctl{display:flex;flex-wrap:wrap;gap:8px 12px;margin:6px 0;align-items:center}.pf-box{padding:3px;border:1px solid var(--line,#d6dbe8);border-radius:9px;background:var(--card,#fff)}.pf-box button{border-color:transparent}.pf-view{margin-left:auto}.pf-sec{margin-top:14px}.pf-h4{margin:10px 0 4px;font-size:12.5px}
.pf-wf{display:grid;gap:4px;margin:6px 0}.pf-wf-r{display:grid;grid-template-columns:minmax(120px,200px) 1fr 84px;gap:8px;align-items:center;font-size:12.5px}.pf-wf-r em{font-style:normal;text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.pf-wf-t{position:relative;height:18px;background:#f4f5f9;border-radius:3px}.pf-wf-t i{position:absolute;top:2px;bottom:2px;border-radius:2px}.pf-wf-t b{position:absolute;top:0;bottom:0;width:1px;background:#9AA3BD}.pf-click{cursor:pointer}.pf-click:hover span{text-decoration:underline}.pf-unit{font-size:11px;color:var(--muted,#7a8399);text-align:right}
.pf-hm{display:grid;gap:3px;margin:6px 0}.pf-hm-r{display:grid;grid-template-columns:52px repeat(4,1fr) 80px;gap:3px;font-size:12px}.pf-hm-r span{border-radius:5px;padding:6px 4px;text-align:center;font-variant-numeric:tabular-nums}.pf-hm-h span{background:none!important;color:var(--muted,#7a8399);padding:2px}.pf-hm-y{background:none!important;font-weight:700;text-align:left!important}.pf-hm-t{background:none!important;font-weight:600}
.pf-table{width:100%;border-collapse:collapse;font-size:12.5px}.pf-table th{cursor:pointer;text-align:left;white-space:nowrap}.pf-table th,.pf-table td{padding:5px 8px;border-bottom:1px solid var(--line,#eef0f6)}.pf-table td.n{text-align:right;font-variant-numeric:tabular-nums}
.pf-bubble{width:100%;height:auto}.pf-bubble text{font:11px Inter,sans-serif;fill:#5b6479}.pf-bubble text.l{font-weight:700;fill:#1D2678}.pf-bubble line.g{stroke:#eef0f6}.pf-bubble line.z{stroke:#9AA3BD;stroke-dasharray:3 3}
@media (max-width:1100px){.pf-kpis{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media (max-width:640px){.pf-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}.pf-wf-r{grid-template-columns:110px 1fr 70px}}
:root[data-theme=dark] .pf-wf-t{background:#262c45}`;
  document.head.append(st);
}
window.OilFinance = {build, engine: E, state: S};
})();
