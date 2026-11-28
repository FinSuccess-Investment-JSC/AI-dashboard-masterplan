/* Vận tải biển · tab lớn Tài chính ngành (#mt14, 26/11/2026). Chép từ Dau-khi/app/oil-finance.js, số từ window.SHIP_FIN
   (BCTC hợp nhất quý, VNDirect finfo; scripts/build_ship_financials.py), tổng hợp bằng window.IndustryFin (app/industry-fin.js).
   Nhóm theo phân khúc: Tàu dầu, hóa chất & khí (PVT, VTO, VIP, PVP, GSP) · Hàng rời (VOS, VNA) · Container (HAH). Tỷ số nhóm = tổng tử số ÷ tổng mẫu số. Kỳ có dưới 80% số mã đủ số thì để trống.
   29/11/2026 (DASHBOARD_WORKFLOW §51): thước đo theo chủ tàu: lãi bán tàu tách khỏi lợi nhuận hoạt động, biên đặt cạnh chỉ số cước Baltic, mục Đội tàu
   (mua ròng, mức đã khấu hao, EBITDA trên nguyên giá), nợ vay ÷ TSCĐ ròng, ROCE thay ROIC, trung vị các mã. Chỉ mô tả dữ liệu; nguồn hiện dưới mọi chart. */
(() => {
'use strict';
const D = window.SHIP_FIN;
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
  // runs: chỉ số dựa vào LCTT quý (EBITDA, CFO, CAPEX) có kỳ lẻ trước 2024; chart đường nối thẳng qua chỗ trống nên chỉ giữ đoạn liền gần nhất.
  if (o.runs) series = series.map(s => { let a = s.values.length - 1; while (a >= 0 && !fin(s.values[a])) a--; while (a > 0 && fin(s.values[a - 1])) a--; return {...s, values: s.values.map((v, i) => i >= a ? v : null)}; });
  const t = trim(labels, series);
  const model = {key, categories: t.labels, series: t.series, unit: o.unit || '', digits: o.digits ?? 0, stackable: !!o.stackable, native: o.native || 'line', zeroBase: o.zeroBase !== false, aria: o.aria || key};
  if (!window.ChartTypes) { host.textContent = ''; return; }
  ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, model.native); });
}
const yoy = (vals, mode) => { const k = mode === 'y' ? 1 : 4; return vals.map((v, i) => i >= k && fin(v) && fin(vals[i - k]) && vals[i - k] !== 0 ? (v / Math.abs(vals[i - k]) - (vals[i - k] < 0 ? -1 : 1)) * 100 * (vals[i - k] < 0 ? -1 : 1) : null); };
const yoyPct = (vals, mode) => { const k = mode === 'y' ? 1 : 4; return vals.map((v, i) => i >= k && fin(v) && fin(vals[i - k]) && vals[i - k] > 0 ? (v / vals[i - k] - 1) * 100 : null); };
const endIdx = mode => mode === 'y' ? E.years.indexOf(D.periods[S.end].slice(0, 4)) - (D.periods[S.end].endsWith('Q4') ? 0 : 1) : S.end;
const covNote = (cov, n, i) => `phủ ${fin(cov?.[i]) ? cov[i] : 0}/${n} doanh nghiệp kỳ chốt`;
const share = (groups, i) => { const tot = groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0); return groups.map(g => fin(g.values[i]) && tot ? g.values[i] / tot * 100 : null); };
// Độ phủ (29/11/2026, như Dầu khí §48): kỳ có dưới 80% số mã đủ số thì để trống, để chuỗi không đổi thành phần giữa chừng. LCTT quý trên VNDirect trước 2024
// chỉ có ở 2–6/8 mã (PVT gần như trống) nên EBITDA TTM cả rổ từng nhảy 790 → 6.461 tỷ giữa Q3 và Q4/2024 chỉ vì rổ từ 3 lên 8 mã.
const MINCOV = .8, okCov = (c, n) => n > 0 && c >= n * MINCOV, COVTXT = 'kỳ phủ dưới 80% số mã để trống', RUNTXT = COVTXT + ', chỉ vẽ đoạn liền gần nhất';
const total = (m, ts, mode, o) => { const t = E.total(m, ts, mode, o); return {...t, values: t.values.map((v, i) => okCov(t.cov[i], ts.length) ? v : null)}; };
const byGroup = (m, ts, mode) => { const b = E.byGroup(m, ts, mode), all = b.labels.map((_, i) => okCov(b.groups.reduce((a, g) => a + g.cov[i], 0), ts.length));
  return {...b, groups: b.groups.map(g => ({...g, values: g.values.map((v, i) => all[i] && okCov(g.cov[i], g.tickers.length) ? v : null)}))}; };
const ratio = (a, b, ts, mode, sc) => { const r = E.ratio(a, b, ts, mode, sc); return {...r, values: r.values.map((v, i) => okCov(r.cov[i], ts.length) ? v : null)}; };
const growth = (m, ts, mode) => { const pv = E.per(m, ts, mode), k = mode === 'y' ? 1 : 4, g = E.growth(m, ts, mode);
  const mask = (vals, x) => vals.map((v, i) => i >= k && okCov(x.filter(t => fin(pv[t][i]) && fin(pv[t][i - k])).length, x.length) ? v : null);
  return {...g, values: mask(g.values, ts), groups: g.groups.map(z => ({...z, values: mask(z.values, ts.filter(t => E.groupOf[t] === z.id))}))}; };
const med = (a, b, ts, mode, sc) => { const r = E.ratio(a, b, ts, mode, sc); return r.dist.map((d, i) => okCov(r.cov[i], ts.length) ? d.med : null); };
const minus = a => a.map(v => fin(v) ? -v : null);
const liveGroups = () => D.groups.filter(g => S.groups.includes(g.id) && sel().some(t => E.groupOf[t] === g.id));

/* ---------- Thanh bộ lọc, KPI, xuất dữ liệu ---------- */
function filterBar() {
  const f = el('section', 'pf-filter');
  // Bộ lọc: mỗi dòng một nhãn cố định bên trái; bảng phân khúc bên dưới. Nút tải CSV ẩn (25/11/2026, theo yêu cầu người dùng).
  f.innerHTML = `<div class="pf-grid"><span class="pf-lb">Phân khúc</span><div class="pf-chips">${D.groups.map(g => `<button type="button" data-g="${g.id}" aria-pressed="${S.groups.includes(g.id)}"><i style="background:${g.color}"></i>${esc(g.label)} <small>${D.companies.filter(c => c.group === g.id).length}</small></button>`).join('')}</div>
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
  // Bảng phân khúc (dùng xuyên suốt tab): nhóm · doanh nghiệp · có trong tổng hay không.
  renders.push(() => { const s = sel(), cons = E.consolidation.filter(c => s.includes(c.parent) && s.includes(c.child));
    f.querySelector('.pf-legend').innerHTML = `<table class="pf-gtable"><thead><tr><th>Phân khúc</th><th>Doanh nghiệp</th><th>Trong tổng</th></tr></thead><tbody>${D.groups.map(g => { const on = S.groups.includes(g.id);
        return `<tr class="${on ? '' : 'off'}"><td><i style="background:${g.color}"></i>${esc(g.label)}</td><td>${D.companies.filter(c => c.group === g.id).map(c => `<button type="button" class="pf-tk" data-tk="${c.ticker}" aria-pressed="${on && !S.off.includes(c.ticker)}" title="${esc(c.note || '')} · bấm để bỏ khỏi / thêm vào rổ">${c.ticker}${c.mixed ? '*' : ''}</button>`).join('')}</td><td>${on ? 'Có' : 'Không'}</td></tr>`; }).join('')}</tbody></table>
      <p class="pf-scope">Rổ đang chọn: <b>${s.length}</b> doanh nghiệp (${s.join(', ') || '—'}) · số tổng hợp từ BCTC hợp nhất; mỗi chart ghi số mã có dữ liệu ở kỳ chốt · không đại diện toàn ngành vận tải biển Việt Nam (chủ tàu chưa niêm yết không nằm trong rổ).</p>
      <p class="pf-note">Bấm mã để bỏ khỏi hoặc thêm vào rổ. Mỗi doanh nghiệp xếp vào mảng có doanh thu lớn nhất; dấu * là doanh nghiệp nhiều mảng kinh doanh, số theo nhóm chỉ mang tính tham khảo. Mẫu doanh nghiệp niêm yết, không đại diện toàn ngành vận tải biển.${cons.length ? ` Loại trùng hợp nhất: ${cons.map(c => `${c.parent} trừ ${c.child}`).join(', ')}.` : ''}</p>`; });
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
    const npat = T('npat'), ebit = T('ebit'), roe = ratio(...ROE, s, 'ttm', 100), oth = ratio({m: 'other'}, {m: 'pbt'}, s, 'ttm', 100), ltv = ratio(...LTV, s, 'q', 100);
    const cx = T('capex'), sale = T('asset_sale'), net = {values: cx.values.map((v, k) => fin(v) && fin(sale.values[k]) ? v - sale.values[k] : null), cov: cx.cov};
    const tile = (label, val, unit, d, dTxt, cov, vals, sub) => `<div class="kpi pp-kpi"><div class="label l">${esc(label)}</div><div class="value v">${val}${unit ? `<small> ${esc(unit)}</small>` : ''}</div><div class="delta">${dTxt}</div>${spark(vals)}<div class="sub s">${esc(qLabel(D.periods[i]))} · phủ ${cov}/${n} DN${sub ? ' · ' + esc(sub) : ''}</div></div>`;
    const ch = (m, mode = 'ttm') => growth(m, s, mode).values[i];
    const dAbs = v => fin(v[i]) && fin(v[i - 4]) ? v[i] - v[i - 4] : null;
    // 29/11/2026: bỏ ô Doanh thu (PVT, GSP, VOS có doanh thu thương mại biên mỏng), CAPEX, XDCB dở dang (0,1–0,3% tổng tài sản), Nợ vay ròng/EBITDA cả rổ
    // (4 mã tiền ròng bù cho 4 mã vay). Thêm lợi nhuận hoạt động, phần lợi nhuận khác (lãi bán tàu), mua ròng tài sản, nợ vay ÷ TSCĐ ròng.
    g.innerHTML = [
      tile('LNST TTM nhóm đã chọn', nf(npat.values[i]), 'tỷ đ', null, `${sg(ch('npat'))}% so cùng kỳ`, npat.cov[i], npat.values, topShare(s, i)),
      tile('Lợi nhuận hoạt động (EBIT) TTM', nf(ebit.values[i]), 'tỷ đ', null, `${sg(ch('ebit'))}% so cùng kỳ`, ebit.cov[i], ebit.values, 'chưa gồm lãi bán tàu, thu nhập tài chính'),
      tile('Lợi nhuận khác ÷ LNTT', nf(oth.values[i], 1), '%', null, `${sg(dAbs(oth.values))} đ.p. so cùng kỳ`, oth.cov[i], oth.values, 'gồm lãi thanh lý tàu'),
      tile('ROE TTM', nf(roe.values[i], 1), '%', null, `${sg(dAbs(roe.values))} đ.p. so cùng kỳ`, roe.cov[i], roe.values, `trung vị các mã ${nf(med(...ROE, s, 'ttm', 100)[i], 1)}%`),
      tile('Mua ròng tài sản cố định TTM', nf(net.values[i]), 'tỷ đ', null, `${sg(dAbs(net.values), 0)} tỷ đ so cùng kỳ`, net.cov[i], net.values, 'CAPEX − tiền thu thanh lý'),
      tile('Nợ vay ÷ TSCĐ ròng', nf(ltv.values[i], 1), '%', null, `${sg(dAbs(ltv.values))} đ.p. so cùng kỳ`, ltv.cov[i], ltv.values, `trung vị các mã ${nf(med(...LTV, s, 'q', 100)[i], 1)}%`)
    ].join('');
  });
  return g;
}
// Hai mã có LNST TTM lớn nhất chiếm bao nhiêu % rổ; công ty con đang trong rổ gộp về công ty mẹ.
function topShare(s, i) {
  const pv = E.per('npat', s, 'ttm'), v = Object.fromEntries(s.map(t => [t, pv[t][i]])), name = Object.fromEntries(s.map(t => [t, t]));
  E.consolidation.filter(c => s.includes(c.parent) && s.includes(c.child)).forEach(c => { if (fin(v[c.parent]) && fin(v[c.child])) { v[c.parent] += v[c.child]; name[c.parent] = `${c.parent} (gồm ${c.child})`; delete v[c.child]; } });
  const a = Object.entries(v).filter(([, x]) => fin(x)).sort((p, q) => q[1] - p[1]), tot = a.reduce((z, [, x]) => z + x, 0);
  return a.length > 2 && tot > 0 && a[1][1] > 0 ? `${a.slice(0, 2).map(([t]) => name[t]).join(' + ')} chiếm ${nf((a[0][1] + a[1][1]) / tot * 100)}%` : '';
}
// Section: câu hỏi + các card. Không có hàng ô số nhỏ dưới câu hỏi (quy tắc chung trang Điện, PR #35, 25/11/2026); chỉ giữ hàng KPI đầu sub-tab.
// Mục lục (29/11/2026): Kết quả kinh doanh → Biên & cước → Đội tàu → Dòng tiền & cổ tức → Nợ vay & thanh khoản → Hiệu quả vốn.
function section(num, title, q) {
  const s = el('section', 'pp-panel pp-q pf-sec'); s.innerHTML = `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(title)}</h3><p class="pf-q">${esc(q)}</p></div></header>`;
  return s;
}
const grid2 = (...cards) => { const g = el('div', 'grid two g2 pf-g2'); cards.forEach(c => g.append(c.el)); return g; };
function groupPicker(c, get, set) { const g = el('select', 'pf-sel'); c.ctl.append(g); g.addEventListener('change', () => set(g.value)); return () => { g.innerHTML = `<option value="all">Tất cả nhóm đang chọn</option>` + D.groups.filter(x => S.groups.includes(x.id)).map(x => `<option value="${x.id}"${x.id === get() ? ' selected' : ''}>${esc(x.label)}</option>`).join(''); if (get() !== 'all' && !S.groups.includes(get())) set('all', true); }; }
const scopeOf = gid => gid === 'all' ? sel() : sel().filter(t => E.groupOf[t] === gid);
// Mỗi đường một phân khúc hoặc một doanh nghiệp (số doanh nghiệp là số hợp nhất của chính mã đó, không loại trùng).
const UNIT = [['group', 'Phân khúc'], ['firm', 'Doanh nghiệp']];
const TKC = ['#1D2678', '#2a9fa3', '#c98a00', '#861C52', '#3d4653', '#8997D6', '#5a9e6f', '#c2603c'];
const tkColor = t => TKC[D.companies.findIndex(c => c.ticker === t) % TKC.length];
const unitLines = (unit, f) => unit === 'firm' ? sel().map(t => ({name: t, color: tkColor(t), values: f([t])})) : liveGroups().map(g => ({name: g.label, color: g.color, values: f(scopeOf(g.id))}));
const MEDC = '#9AA3BD';

/* ---------- 1.1 Kết quả kinh doanh ---------- */
const PNL = [['ebit', 'EBIT'], ['ebitda', 'EBITDA'], ['gross', 'Lợi nhuận gộp'], ['npat', 'LNST'], ['revenue', 'Doanh thu']];
function s71() {
  const s = section('1.1', 'Kết quả kinh doanh', 'Lợi nhuận đến từ chạy tàu hay bán tàu, và dồn về phân khúc nào?');
  const c1 = card('vt-fin-pnl', 'Lợi nhuận và doanh thu theo phân khúc (tỷ đồng)', 'Cột chồng theo phân khúc · đổi chỉ tiêu và cách xem'); let m1 = 'ebit', v1 = 'abs';
  seg(c1, 'Chỉ tiêu', PNL, () => m1, k => { m1 = k; draw1(); }); seg(c1, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const b = byGroup(m1, sel(), S.mode), name = PNL.find(p => p[0] === m1)[1];
    if (v1 === 'abs') chart(c1.host, 'vt-fin-pnl-abs', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true});
    else if (v1 === 'yoy') { const gr = growth(m1, sel(), S.mode); chart(c1.host, 'vt-fin-pnl-yoy', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: gr.groups.find(z => z.id === g.id)?.values || []})), {unit: '%', digits: 1, zeroBase: false}); }
    else { const tot = b.labels.map((_, i) => b.groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0)), neg = b.labels.map((_, i) => b.groups.some(g => fin(g.values[i]) && g.values[i] < 0));
      chart(c1.host, 'vt-fin-pnl-share', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values.map((v, i) => fin(v) && tot[i] > 0 && !neg[i] ? v / tot[i] * 100 : null)})), {unit: '%', digits: 1, native: 'stack', stackable: true}); }
    foot(c1, `${name} ${modeName(S.mode)}; EBIT = LN gộp − CP bán hàng − CP QLDN (chưa gồm lãi bán tàu); EBITDA = EBIT + khấu hao (LCTT)${m1 === 'revenue' ? '; doanh thu PVT, GSP, VOS gồm mảng thương mại biên mỏng' : ''}${v1 === 'share' ? '; tỷ trọng để trống ở kỳ có nhóm lỗ' : ''}; ${COVTXT}`); }
  renders.push(draw1);
  // Chart 2 (29/11/2026): lãi thanh lý tàu nằm ở lợi nhuận khác, ngoài EBIT. Hàng rời (VOS, VNA) TTM Q3/2026: 401/607 tỷ LNTT là lợi nhuận khác.
  const c2 = card('vt-fin-pbtmix', 'Lợi nhuận trước thuế đến từ chạy tàu hay bán tàu?', 'Lợi nhuận hoạt động, tài chính ròng & liên kết, lợi nhuận khác (gồm lãi thanh lý tàu) · chọn phân khúc'); let g2 = 'all', v2 = 'abs'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  seg(c2, 'Cách xem', [['abs', 'Tỷ đồng'], ['share', 'Lợi nhuận khác ÷ LNTT (%)']], () => v2, k => { v2 = k; draw2(); });
  function draw2() { p2(); const L = E.labels(S.mode);
    if (v2 === 'abs') { const x = scopeOf(g2), T = m => total(m, x, S.mode).values;
      chart(c2.host, 'vt-fin-pbtmix-abs', L, [{name: 'Lợi nhuận hoạt động (LN gộp − bán hàng − QLDN)', color: '#2938A8', values: T('ebit')}, {name: 'Tài chính ròng & liên kết', color: '#2a9fa3', values: T('fin_net')}, {name: 'Lợi nhuận khác (gồm lãi thanh lý tàu)', color: '#c98a00', values: T('other')}, {name: 'LNTT', color: '#3d4653', values: T('pbt'), kind: 'line'}], {unit: 'tỷ đ', native: 'stack', stackable: true}); }
    else chart(c2.host, 'vt-fin-pbtmix-share', L, liveGroups().map(g => { const x = scopeOf(g.id), o = total('other', x, S.mode).values, p = total('pbt', x, S.mode).values; return {name: g.label, color: g.color, values: o.map((v, i) => fin(v) && fin(p[i]) && p[i] > 0 ? v / p[i] * 100 : null)}; }), {unit: '%', digits: 1});
    foot(c2, `${modeName(S.mode)}; lợi nhuận khác gồm lãi thanh lý tàu và khoản bất thường, BCTC tóm tắt không tách${v2 === 'share' ? '; kỳ LNTT không dương để trống; trên 100% là phần còn lại lỗ' : ''}`); }
  renders.push(draw2);
  // Bảng nhiệt mùa vụ bỏ 29/11/2026: doanh thu mỗi quý 18–28% cả năm, không có quy luật ổn định (ngành chạy theo chu kỳ cước).
  const c5 = card('vt-fin-breadth', 'Tăng trưởng lợi nhuận lan rộng hay tập trung?', 'Số doanh nghiệp theo thay đổi LNST so cùng kỳ (quý riêng)');
  function draw5() { const s = sel(), pv = E.per('npat', s, 'q'), L = D.periods;
    const cnt = f => L.map((_, i) => i < 4 ? null : s.filter(t => fin(pv[t][i]) && fin(pv[t][i - 4]) && f(pv[t][i], pv[t][i - 4])).length);
    chart(c5.host, 'vt-fin-breadth', L, [
      {name: 'Tăng (lãi cả hai kỳ)', color: '#2938A8', values: cnt((a, b) => a >= b && a > 0 && b > 0)},
      {name: 'Giảm (lãi cả hai kỳ)', color: '#9AA3BD', values: cnt((a, b) => a < b && a > 0 && b > 0)},
      {name: 'Lỗ sang lãi', color: '#2a9fa3', values: cnt((a, b) => a > 0 && b <= 0)},
      {name: 'Lãi sang lỗ', color: '#c98a00', values: cnt((a, b) => a <= 0 && b > 0)},
      {name: 'Lỗ cả hai kỳ', color: '#3d4653', values: cnt((a, b) => a <= 0 && b <= 0)}], {unit: 'DN', native: 'stack', stackable: true});
    foot(c5, 'LNST quý so cùng quý năm trước, gồm cả lãi bán tàu; chỉ doanh nghiệp có số cả hai kỳ'); }
  renders.push(draw5);
  s.append(c1.el, grid2(c2, c5));
  return s;
}

/* ---------- 1.2 Biên lợi nhuận và cước ---------- */
// Chỉ số cước Baltic (East Money, theo phiên từ 2019): bình quân theo đúng chu kỳ của chart biên (quý / 4 quý / năm); quý có dưới 30 phiên thì để trống.
const SD = window.SHIPPING_DAILY || {}, EMS = SD.eastmoney?.series || {};
const DRV = [['bdti', 'BDTI · tàu dầu thô', '#1D2678'], ['bcti', 'BCTI · tàu dầu sản phẩm', '#2a9fa3'], ['bdi', 'BDI · hàng rời', '#c98a00']];
const drvRows = k => EMS[k]?.records || (k === 'bdi' ? SD.bdi?.records : null) || [];
function driverAvg(key, mode) {
  const acc = {}; drvRows(key).forEach(([d, v]) => { if (!fin(v) || !d) return; const a = (acc[`${d.slice(0, 4)}Q${Math.ceil(+d.slice(5, 7) / 3)}`] ||= [0, 0]); a[0] += v; a[1]++; });
  const P = D.periods, span = ks => ks.every(k => acc[k] && acc[k][1] >= 30) ? ks.reduce((a, k) => a + acc[k][0], 0) / ks.reduce((a, k) => a + acc[k][1], 0) : null;
  if (mode === 'y') return E.years.map(y => P.includes(`${y}Q4`) ? span([1, 2, 3, 4].map(q => `${y}Q${q}`)) : null);
  return P.map((p, i) => mode === 'ttm' ? (i < 3 ? null : span(P.slice(i - 3, i + 1))) : span([p]));
}
const MARG = [['gross', 'Biên gộp'], ['ebitda', 'Biên EBITDA'], ['ebit', 'Biên EBIT'], ['npat', 'Biên LNST']];
function s72() {
  const s = section('1.2', 'Biên lợi nhuận & cước', 'Biên mỗi phân khúc đi cùng cước giao ngay đến đâu, và khấu hao tàu chiếm bao nhiêu trong chi phí?');
  // Chart 1 (29/11/2026): mỗi đường một phân khúc hoặc một mã thay cho bốn loại biên của cả rổ (PVT chiếm 67% doanh thu nhóm tàu dầu, Container chỉ có HAH).
  const c1 = card('vt-fin-margin', 'Biên lợi nhuận theo phân khúc hoặc doanh nghiệp (%)', 'Mỗi đường một phân khúc hoặc một mã · đổi loại biên'); let m1 = 'gross', u1 = 'group';
  seg(c1, 'Chỉ tiêu', MARG, () => m1, k => { m1 = k; draw1(); }); seg(c1, 'Đơn vị', UNIT, () => u1, k => { u1 = k; draw1(); });
  function draw1() { const L = E.labels(S.mode), f = x => ratio({m: m1}, {m: 'revenue'}, x, S.mode, 100).values;
    chart(c1.host, `vt-fin-margin-${m1}-${u1}`, L, [...unitLines(u1, f), ...(u1 === 'group' ? [{name: 'Trung vị các mã', color: MEDC, values: med({m: m1}, {m: 'revenue'}, sel(), S.mode, 100)}] : [])], {unit: '%', digits: 1, zeroBase: false, runs: m1 === 'ebitda'});
    foot(c1, `${MARG.find(x => x[0] === m1)[1]} = tổng lợi nhuận ÷ tổng doanh thu, ${modeName(S.mode)}; doanh thu PVT, GSP, VOS gồm mảng thương mại biên mỏng; ${COVTXT}`); }
  renders.push(draw1);
  // Chart 2: chỉ số cước Baltic cùng trục thời gian với chart biên. Tương quan biên gộp quý nhóm tàu dầu với BCTI 2019–Q3/2026: cùng quý 0,24, trễ 2 quý 0,50
  // (đội tàu cho thuê định hạn nhiều nên cước giao ngay thấm chậm).
  const c2 = card('vt-fin-driver', 'Chỉ số cước Baltic (điểm)', 'Bình quân theo cùng chu kỳ với chart biên bên cạnh · cước giao ngay, không phải giá thuê định hạn');
  function draw2() { const A = k => EMS[k]?.url ? `<a href="${esc(EMS[k].url)}" target="_blank" rel="noopener">${k.toUpperCase()}</a>` : k.toUpperCase();
    chart(c2.host, 'vt-fin-driver', E.labels(S.mode), DRV.map(([k, name, color]) => ({name, color, values: driverAvg(k, S.mode)})), {unit: 'điểm', digits: 0, zeroBase: false});
    foot(c2, `bình quân các phiên trong ${S.mode === 'q' ? 'quý' : S.mode === 'y' ? 'năm' : '4 quý gần nhất'}; chưa có chỉ số cước container theo phiên`, `Baltic Exchange qua East Money (${DRV.map(([k]) => A(k)).join(', ')}); tự tính bình quân`); }
  renders.push(draw2);
  // Chart 3: cơ cấu chi phí trên 100 đồng doanh thu
  const c3 = card('vt-fin-cost', 'Cơ cấu chi phí trên 100 đồng doanh thu', 'Theo phân khúc, kỳ chốt · giá vốn trừ khấu hao, khấu hao, bán hàng & QLDN, lãi vay, thuế, lợi nhuận còn lại');
  function draw3() { const mode = S.mode === 'y' ? 'y' : 'ttm', i = endIdx(mode), x = sel();
    const ms = ['revenue', 'opex_other', 'da', 'sga', 'interest', 'tax', 'npat'], pv = Object.fromEntries(ms.map(m => [m, E.per(m, x, mode)]));
    const gs = liveGroups(), row = g => { const all = x.filter(t => E.groupOf[t] === g.id), ts = all.filter(t => ms.every(m => fin(pv[m][t][i]))), T = m => ts.reduce((a, t) => a + pv[m][t][i], 0), r = T('revenue'); return r && okCov(ts.length, all.length) ? ms.slice(1).map(m => T(m) / r * 100) : ms.slice(1).map(() => null); };
    const R = gs.map(row), names = ['Giá vốn trừ khấu hao', 'Khấu hao', 'Bán hàng & QLDN', 'Lãi vay', 'Thuế TNDN', 'LNST'], cols = ['#9AA3BD', '#3d4653', '#8997D6', '#c98a00', '#861C52', '#2938A8'];
    const m = {key: 'vt-fin-cost', categories: gs.map(g => g.label), series: names.map((n, k) => ({name: n, color: cols[k], values: R.map(r => fin(r[k]) ? Math.round(r[k] * 10) / 10 : null)})), unit: 'đồng', digits: 1, stackable: true, native: 'stack', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c3.host, m, () => { c3.host.innerHTML = ChartTypes.render(m, 'stack'); });
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; khoản còn lại (thu nhập tài chính, liên kết, lợi nhuận khác, chi phí tài chính ngoài lãi vay) không vẽ nên tổng có thể khác 100; BCTC tóm tắt không tách chi phí nhiên liệu`); }
  renders.push(draw3);
  s.append(grid2(c1, c2), c3.el);
  return s;
}

/* ---------- 1.3 Đội tàu ---------- */
// 29/11/2026 thay mục "CAPEX & dở dang": tàu mua về ghi thẳng vào TSCĐ nên XDCB dở dang chỉ 0,1–0,3% tổng tài sản; thước đo của chủ tàu là mua ròng,
// mức đã khấu hao (khấu hao lũy kế ÷ nguyên giá) và EBITDA trên nguyên giá. TSCĐ hữu hình gồm cả cảng, kho, FSO (HAH, PVT), BCTC tóm tắt không tách riêng tàu.
const ACC = [{m: 'ppe_accdep'}, {m: 'ppe_gross'}], LTV = [{m: 'debt'}, {m: 'ppe_net'}], ROE = [{m: 'npat'}, {m: 'equity', avg: true}];
const PPENOTE = 'TSCĐ hữu hình gồm cả cảng, kho, FSO (HAH, PVT), không riêng tàu';
function s73() {
  const s = section('1.3', 'Đội tàu', 'Ai đang mở rộng đội tàu, ai đang thu hẹp, và đội tàu đã khấu hao tới đâu?');
  const c1 = card('vt-fin-netcapex', 'Mua ròng tài sản cố định theo phân khúc (tỷ đồng)', 'CAPEX trừ tiền thu thanh lý TSCĐ (LCTT) · dương là mở rộng, âm là thu hẹp'); let v1 = 'net';
  seg(c1, 'Chỉ tiêu', [['net', 'Mua ròng'], ['capex', 'CAPEX'], ['sale', 'Thu thanh lý']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const b = byGroup('capex', sel(), S.mode), a = byGroup('asset_sale', sel(), S.mode);
    chart(c1.host, 'vt-fin-netcapex-' + v1, b.labels, b.groups.map((g, k) => { const sv = a.groups[k]?.values || []; return {name: g.label, color: g.color, values: v1 === 'capex' ? g.values : v1 === 'sale' ? sv : g.values.map((v, i) => fin(v) && fin(sv[i]) ? v - sv[i] : null)}; }), {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c1, `${modeName(S.mode)}; CAPEX = tiền chi mua sắm, xây dựng TSCĐ; không gồm tàu thuê tài chính và tài sản tăng do M&A; ${COVTXT}`); }
  renders.push(draw1);
  const c2 = card('vt-fin-fleetage', 'Đội tàu đã khấu hao tới đâu? (%)', 'Hao mòn lũy kế ÷ nguyên giá TSCĐ hữu hình · càng cao, tàu càng gần hết khấu hao'); let u2 = 'firm';
  seg(c2, 'Đơn vị', [...UNIT].reverse(), () => u2, k => { u2 = k; draw2(); });
  function draw2() { const mode = S.mode === 'y' ? 'y' : 'q', f = x => ratio(...ACC, x, mode, 100).values;
    chart(c2.host, 'vt-fin-fleetage-' + u2, E.labels(mode), unitLines(u2, f), {unit: '%', digits: 1, zeroBase: false});
    foot(c2, `số dư cuối ${mode === 'y' ? 'năm' : 'quý'}; mức khấu hao kế toán, không phải tuổi tàu (tàu mua cũ bắt đầu từ 0); ${PPENOTE}`); }
  renders.push(draw2);
  const c3 = card('vt-fin-intensity', 'CAPEX so với khấu hao (lần)', 'Trên 1 lần: đầu tư nhiều hơn mức hao mòn ghi sổ · mỗi đường một phân khúc hoặc một mã'); let u3 = 'group';
  seg(c3, 'Đơn vị', UNIT, () => u3, k => { u3 = k; draw3(); });
  function draw3() { const mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), f = x => ratio({m: 'capex'}, {m: 'da'}, x, mode).values;
    chart(c3.host, 'vt-fin-intensity-' + u3, L, [...unitLines(u3, f), {name: 'Mốc 1 lần', color: MEDC, values: L.map(() => 1)}], {unit: 'lần', digits: 2, runs: true});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; CAPEX vượt khấu hao không đồng nghĩa toàn bộ là mở rộng (giá tàu thay thế cao hơn nguyên giá cũ); ${RUNTXT}`); }
  renders.push(draw3);
  const c4 = card('vt-fin-yield', 'EBITDA trên nguyên giá tài sản cố định (%)', 'EBITDA ÷ nguyên giá TSCĐ hữu hình bình quân · so được giữa đội tàu mới và đội tàu đã khấu hao'); let u4 = 'group';
  seg(c4, 'Đơn vị', UNIT, () => u4, k => { u4 = k; draw4(); });
  function draw4() { const mode = S.mode === 'q' ? 'ttm' : S.mode, f = x => ratio({m: 'ebitda'}, {m: 'ppe_gross', avg: true}, x, mode, 100).values;
    chart(c4.host, 'vt-fin-yield-' + u4, E.labels(mode), unitLines(u4, f), {unit: '%', digits: 1, runs: true});
    foot(c4, `${mode === 'y' ? 'năm' : 'TTM'}; nguyên giá theo sổ sách, không phải giá tàu thị trường; ${PPENOTE}; ${RUNTXT}`); }
  renders.push(draw4);
  s.append(grid2(c1, c2), grid2(c3, c4));
  return s;
}

/* ---------- 1.4 Dòng tiền và cổ tức ---------- */
// 29/11/2026: bỏ phải thu khách hàng và DSO (23–70 ngày, ổn định, không phải rủi ro của chủ tàu); thêm tiền thu thanh lý tàu vào nguồn tiền.
function s74() {
  const s = section('1.4', 'Dòng tiền & cổ tức', 'Tiền từ chạy tàu và bán tàu có đủ cho mua tàu mới và cổ tức không?');
  const c1 = card('vt-fin-funding', 'Mua tàu được tài trợ bằng nguồn nào? (tỷ đồng)', 'CFO, thu thanh lý TSCĐ, CAPEX, vay nợ ròng, vốn góp bằng tiền, cổ tức đã trả · chọn phân khúc'); let g1 = 'all'; const p1 = groupPicker(c1, () => g1, (v, q) => { g1 = v; if (!q) draw1(); });
  function draw1() { p1(); const x = scopeOf(g1), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), T = m => total(m, x, mode).values;
    chart(c1.host, 'vt-fin-funding', L, [{name: 'CFO', color: LINE[0], values: T('cfo')}, {name: 'Thu thanh lý TSCĐ', color: LINE[1], values: T('asset_sale')}, {name: 'CAPEX', color: LINE[2], values: minus(T('capex'))}, {name: 'Vay nợ ròng', color: LINE[3], values: T('net_borrow')}, {name: 'Vốn góp bằng tiền', color: LINE[5], values: T('equity_raised')}, {name: 'Cổ tức đã trả', color: LINE[4], values: minus(T('dividends'))}], {unit: 'tỷ đ', native: 'bar'});
    foot(c1, `${mode === 'y' ? 'năm' : 'TTM'}; CAPEX và cổ tức vẽ số âm (tiền ra); không phải toàn bộ biến động tiền (còn tiền gửi, đầu tư tài chính, tỷ giá…); ${COVTXT}`); }
  renders.push(draw1);
  const c3 = card('vt-fin-conversion', 'Lợi nhuận chuyển thành tiền đến đâu?', 'CFO/EBITDA, CFO/LNST (lần) và biên CFO (%) · chọn phân khúc'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), R = (a, b, sc = 1) => ratio({m: a}, {m: b}, x, mode, sc).values;
    chart(c3.host, 'vt-fin-conversion', L, [{name: 'CFO/EBITDA (lần)', color: LINE[0], values: R('cfo', 'ebitda')}, {name: 'CFO/LNST (lần)', color: LINE[2], values: R('cfo', 'npat')}, {name: 'Biên CFO (%) ÷ 100', color: LINE[1], values: R('cfo', 'revenue')}], {unit: 'lần', digits: 2, runs: true});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; biên CFO vẽ dạng tỷ lệ (0,2 = 20%); LNST gồm lãi bán tàu, tiền bán tàu nằm ngoài CFO; ${RUNTXT}`); }
  renders.push(draw3);
  const c4 = card('vt-fin-fcf', 'Dòng tiền tự do và phân phối cho cổ đông', 'Theo phân khúc, kỳ chốt: CFO, CAPEX, thu thanh lý, FCF, cổ tức đã trả, vay nợ ròng (tỷ đ)');
  function draw4() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'ttm', i = endIdx(mode), gs = liveGroups();
    const ms = [['cfo', 'CFO', LINE[0], 1], ['capex', 'CAPEX', LINE[2], -1], ['asset_sale', 'Thu thanh lý TSCĐ', '#5a9e6f', 1], ['fcf', 'FCF (CFO − CAPEX)', LINE[1], 1], ['dividends', 'Cổ tức đã trả', LINE[4], -1], ['net_borrow', 'Vay nợ ròng', LINE[3], 1]];
    const B = Object.fromEntries(ms.map(([k]) => [k, byGroup(k, x, mode).groups]));
    const v = (k, g) => { const b = B[k].find(z => z.id === g.id); return b && fin(b.values[i]) ? Math.round(b.values[i]) : null; };
    const m = {key: 'vt-fin-fcf', categories: gs.map(g => g.label), series: ms.map(([k, n, c, sgn]) => ({name: n, color: c, values: gs.map(g => { const a = v(k, g); return fin(a) ? a * sgn : null; })})), unit: 'tỷ đ', digits: 0, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c4.host, m, () => { c4.host.innerHTML = ChartTypes.render(m, 'bar'); });
    foot(c4, `${mode === 'y' ? 'năm' : 'TTM'} ${qLabel(E.labels(mode)[i] || '')}; CAPEX và cổ tức vẽ số âm (tiền ra); FCF chưa cộng tiền thu thanh lý`); }
  renders.push(draw4);
  s.append(grid2(c1, c3), c4.el);
  return s;
}

/* ---------- 1.5 Nợ vay và thanh khoản ---------- */
const LEV = [['ltv', 'Nợ vay ÷ TSCĐ ròng (%)', '%', 1], ['nde', 'Nợ vay ròng/EBITDA (lần)', 'lần', 2], ['de', 'Nợ vay/VCSH (lần)', 'lần', 2]];
function s75() {
  const s = section('1.5', 'Nợ vay & thanh khoản', 'Đội tàu đang được tài trợ bằng nợ tới mức nào, ai giữ tiền ròng và ai đang vay?');
  const c1 = card('vt-fin-debt', 'Cơ cấu nợ vay (tỷ đồng)', 'Nợ vay ngắn hạn, dài hạn (cột chồng); tiền & đầu tư ngắn hạn, nợ vay ròng (đường) · chọn phân khúc'); let g1 = 'all'; const p1 = groupPicker(c1, () => g1, (v, q) => { g1 = v; if (!q) draw1(); });
  function draw1() { p1(); const x = scopeOf(g1), mode = S.mode === 'y' ? 'y' : 'q', L = E.labels(mode), T = m => total(m, x, mode).values;
    chart(c1.host, 'vt-fin-debt', L, [{name: 'Nợ vay ngắn hạn', color: '#8997D6', values: T('st_debt')}, {name: 'Nợ vay dài hạn', color: '#1D2678', values: T('lt_debt')}, {name: 'Tiền & đầu tư ngắn hạn', color: '#2a9fa3', values: T('cash_all'), kind: 'line'}, {name: 'Nợ vay ròng', color: '#c98a00', values: T('net_debt'), kind: 'line'}], {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c1, 'nợ vay chịu lãi (vay và nợ thuê tài chính), không phải tổng nợ phải trả; nợ vay ròng = nợ vay − tiền − đầu tư tài chính ngắn hạn; tiền của mã này không trả được nợ của mã khác'); }
  renders.push(draw1);
  // Chart 2 (29/11/2026): nợ vay ÷ giá trị còn lại của TSCĐ thay cho hệ số cộng gộp của cả rổ (nợ vay ròng/EBITDA rổ 0,06 lần vì VTO, VIP, PVP, VOS giữ tiền ròng).
  const c2 = card('vt-fin-leverage', 'Đòn bẩy theo phân khúc hoặc doanh nghiệp', 'Nợ vay so với giá trị còn lại của tài sản cố định, EBITDA, vốn chủ sở hữu'); let m2 = 'ltv', u2 = 'group';
  seg(c2, 'Chỉ tiêu', LEV.map(x => [x[0], x[1]]), () => m2, k => { m2 = k; draw2(); }); seg(c2, 'Đơn vị', UNIT, () => u2, k => { u2 = k; draw2(); });
  function draw2() { const y = S.mode === 'y', bal = y ? 'y' : 'q', flow = y ? 'y' : 'ttm', L = E.labels(bal), d = LEV.find(x => x[0] === m2);
    const args = m2 === 'ltv' ? [...LTV, bal, 100] : m2 === 'nde' ? [{m: 'net_debt'}, {m: 'ebitda'}, flow] : [{m: 'debt'}, {m: 'equity'}, bal];
    const f = x => ratio(args[0], args[1], x, args[2], args[3]).values;
    chart(c2.host, `vt-fin-leverage-${m2}-${u2}`, L, [...unitLines(u2, f), ...(u2 === 'group' ? [{name: 'Trung vị các mã', color: MEDC, values: med(args[0], args[1], sel(), args[2], args[3])}] : [])], {unit: d[2], digits: d[3], runs: m2 === 'nde'});
    foot(c2, `${m2 === 'ltv' ? 'nợ vay ÷ giá trị còn lại TSCĐ hữu hình theo sổ sách (không phải giá tàu thị trường); ' + PPENOTE : m2 === 'nde' ? 'nợ vay ròng cuối kỳ ÷ EBITDA ' + (y ? 'năm' : 'TTM') + '; âm là tiền ròng; ' + RUNTXT : 'nợ vay ÷ VCSH (gồm lợi ích cổ đông không kiểm soát)'}`); }
  renders.push(draw2);
  const c3 = card('vt-fin-interest', 'Chi phí vay và khả năng trả lãi', 'Lãi vay/nợ vay bình quân (%), EBIT và EBITDA trên lãi vay (lần) · chọn phân khúc'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    chart(c3.host, 'vt-fin-interest', L, [{name: 'Lãi vay/nợ vay bình quân (%)', color: LINE[3], values: ratio({m: 'interest'}, {m: 'debt', avg: true}, x, mode, 100).values}, {name: 'EBIT/lãi vay (lần)', color: LINE[0], values: ratio({m: 'ebit'}, {m: 'interest'}, x, mode).values}, {name: 'EBITDA/lãi vay (lần)', color: LINE[1], values: ratio({m: 'ebitda'}, {m: 'interest'}, x, mode).values}], {unit: '', digits: 1, runs: true});
    foot(c3, `lãi vay/nợ vay bình quân là chi phí vay ghi nhận ước tính, không phải lãi suất hợp đồng; nợ vay mua tàu phần lớn bằng USD, lỗ tỷ giá nằm ngoài lãi vay; ${RUNTXT}`); }
  renders.push(draw3);
  const c5 = card('vt-fin-levdist', 'Phân bố doanh nghiệp theo mức đòn bẩy', 'Số doanh nghiệp theo nợ vay ròng/EBITDA TTM');
  function draw5() { const x = sel(), L = D.periods, nd = E.per('net_debt', x, 'q'), eb = E.per('ebitda', x, 'ttm');
    const cnt = f => L.map((_, i) => { const ts = x.filter(t => fin(nd[t][i]) && fin(eb[t][i])); return okCov(ts.length, x.length) ? ts.filter(t => f(nd[t][i], eb[t][i])).length : null; });
    chart(c5.host, 'vt-fin-levdist', L, [{name: 'Tiền ròng', color: '#2a9fa3', values: cnt(n => n <= 0)}, {name: '0–2 lần', color: '#8997D6', values: cnt((n, e) => n > 0 && e > 0 && n / e <= 2)}, {name: '2–4 lần', color: '#2938A8', values: cnt((n, e) => n > 0 && e > 0 && n / e > 2 && n / e <= 4)}, {name: 'Trên 4 lần', color: '#1D2678', values: cnt((n, e) => n > 0 && e > 0 && n / e > 4)}, {name: 'EBITDA không dương', color: '#c98a00', values: cnt((n, e) => n > 0 && e <= 0)}], {unit: 'DN', native: 'stack', stackable: true});
    foot(c5, `công cụ xem mức độ tập trung, không phải xếp hạng tín dụng; ${COVTXT}`); }
  renders.push(draw5);
  s.append(grid2(c1, c2), grid2(c3, c5));
  return s;
}

/* ---------- 1.6 Hiệu quả sử dụng vốn ---------- */
// 29/11/2026: ROCE thay ROIC (như Dầu khí §48). ROIC cũ trừ hết tiền khỏi vốn đầu tư nên VTO ra 72%, PVP 39% (tiền chiếm 64% và 48% tổng tài sản).
// ROCE = (LNTT + lãi vay) × (1 − thuế suất hiệu dụng, 0–30%) ÷ (VCSH + nợ vay) bình quân; tử số gồm lãi bán tàu và thu nhập tài chính, mẫu số giữ nguyên tiền.
function roce(x, mode) {
  const L = E.labels(mode), pb = E.per('pbt', x, mode), it = E.per('interest', x, mode), tx = E.per('tax', x, mode), eq = E.per('equity', x, mode, true), db = E.per('debt', x, mode, true);
  const N = Object.fromEntries(x.map(t => [t, L.map((_, i) => { if (![pb, it, tx].every(z => fin(z[t][i]))) return null; const r = pb[t][i] > 0 ? Math.min(.3, Math.max(0, tx[t][i] / pb[t][i])) : 0; return (pb[t][i] + it[t][i]) * (1 - r); })]));
  const C = Object.fromEntries(x.map(t => [t, L.map((_, i) => fin(eq[t][i]) && fin(db[t][i]) ? eq[t][i] + db[t][i] : null)]));
  const values = L.map((_, i) => { const ts = x.filter(t => fin(N[t][i]) && fin(C[t][i])); const d = ts.reduce((a, t) => a + C[t][i], 0); return okCov(ts.length, x.length) && d > 0 ? ts.reduce((a, t) => a + N[t][i], 0) / d * 100 : null; });
  return {labels: L, values};
}
function s76() {
  const s = section('1.6', 'Hiệu quả vốn', 'Vốn bỏ vào đội tàu đang sinh lời thế nào, và ROE cao nhờ cước hay nhờ tàu đã hết khấu hao?');
  const c1 = card('vt-fin-returns', 'ROE, ROA, ROCE (%)', 'TTM hoặc năm · chọn phân khúc · đường xám là trung vị ROE các mã'); let g1 = 'all'; const p1 = groupPicker(c1, () => g1, (v, q) => { g1 = v; if (!q) draw1(); });
  function draw1() { p1(); const x = scopeOf(g1), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    chart(c1.host, 'vt-fin-returns', L, [{name: 'ROE', color: LINE[0], values: ratio(...ROE, x, mode, 100).values}, {name: 'ROA', color: LINE[1], values: ratio({m: 'npat'}, {m: 'total_assets', avg: true}, x, mode, 100).values}, {name: 'ROCE', color: LINE[2], values: roce(x, mode).values}, {name: 'ROE trung vị các mã', color: MEDC, values: med(...ROE, x, mode, 100)}], {unit: '%', digits: 1, zeroBase: false});
    foot(c1, 'ROE = LNST hợp nhất ÷ VCSH (gồm lợi ích CĐKKS) bình quân; ROCE = (LNTT + lãi vay) × (1 − thuế suất hiệu dụng, tối đa 30%) ÷ (VCSH + nợ vay) bình quân, không trừ tiền; LNST gồm lãi bán tàu'); }
  renders.push(draw1);
  const c2 = card('vt-fin-dupont', 'Phân rã ROE (DuPont)', 'Biên LNST × vòng quay tài sản × đòn bẩy (tổng tài sản/VCSH) · chọn phân khúc hoặc doanh nghiệp'); let g2 = 'all';
  const sel2 = el('select', 'pf-sel'); c2.ctl.append(sel2); sel2.addEventListener('change', () => { g2 = sel2.value; draw2(); });
  function draw2() { const gs = liveGroups(), ts0 = sel(); if (g2 !== 'all' && !gs.some(g => g.id === g2) && !ts0.includes(g2)) g2 = 'all';
    sel2.innerHTML = `<option value="all">Tất cả nhóm đang chọn</option>${gs.map(g => `<option value="${g.id}"${g.id === g2 ? ' selected' : ''}>${esc(g.label)}</option>`).join('')}${ts0.map(t => `<option value="${t}"${t === g2 ? ' selected' : ''}>${t}</option>`).join('')}`;
    const x = ts0.includes(g2) ? [g2] : scopeOf(g2), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    // Cùng tập doanh nghiệp có đủ LNST, doanh thu, tài sản bình quân, VCSH bình quân
    const n = E.per('npat', x, mode), r = E.per('revenue', x, mode), a = E.per('total_assets', x, mode, true), q = E.per('equity', x, mode, true);
    const parts = L.map((_, i) => { const ts = x.filter(t => [n, r, a, q].every(z => fin(z[t][i]))); if (!okCov(ts.length, x.length)) return null; const S2 = z => ts.reduce((s, t) => s + z[t][i], 0), N = S2(n), R = S2(r), A = S2(a), Qv = S2(q); return R && A && Qv ? {m: N / R * 100, t: R / A, l: A / Qv, roe: N / Qv * 100} : null; });
    chart(c2.host, 'vt-fin-dupont', L, [{name: 'ROE (%)', color: LINE[0], values: parts.map(p => p?.roe ?? null)}, {name: 'Biên LNST (%)', color: LINE[2], values: parts.map(p => p?.m ?? null)}, {name: 'Vòng quay tài sản (lần)', color: LINE[1], values: parts.map(p => p?.t ?? null)}, {name: 'Đòn bẩy (lần)', color: LINE[3], values: parts.map(p => p?.l ?? null)}], {unit: '', digits: 2, zeroBase: false});
    foot(c2, 'ROE = biên × vòng quay × đòn bẩy, cùng tập doanh nghiệp, tài sản và VCSH bình quân'); }
  renders.push(draw2);
  // "ROIC và chu kỳ vốn" (kèm XDCB dở dang/tổng tài sản) bỏ 29/11/2026.
  // Bản đồ: ROCE theo mức đã khấu hao của tài sản, để thấy mã nào sinh lời cao trên đội tàu đã gần hết khấu hao.
  const c4 = card('vt-fin-map', 'Sinh lời cao trên tàu mới hay tàu đã khấu hao?', 'Trục ngang: hao mòn lũy kế ÷ nguyên giá TSCĐ (%) · trục dọc: ROCE TTM (%) · kích thước: VCSH + nợ vay'); let v4 = 'firm';
  seg(c4, 'Đơn vị', [...UNIT].reverse(), () => v4, k => { v4 = k; draw4(); });
  function draw4() { const i = S.end;
    const pt = (l, c, ts) => ({l, c, x: ratio(...ACC, ts, 'q', 100).values[i], y: roce(ts, 'ttm').values[i], s: (() => { const a = total('equity', ts, 'q').values[i], b = total('debt', ts, 'q').values[i]; return fin(a) && fin(b) ? a + b : null; })()});
    const pts = (v4 === 'firm' ? sel().map(t => pt(t, GC[E.groupOf[t]], [t])) : liveGroups().map(g => pt(g.label, g.color, scopeOf(g.id)))).filter(p => fin(p.x) && fin(p.y) && fin(p.s) && p.s > 0);
    c4.host.innerHTML = bubble(pts, {xs: '%', xd: 0, xname: 'hao mòn lũy kế ÷ nguyên giá', sname: 'VCSH + nợ vay'});
    foot(c4, `${qLabel(D.periods[i])}; ${PPENOTE}`); }
  renders.push(draw4);
  const c5 = card('vt-fin-pool', 'Vốn sử dụng so với lợi nhuận tạo ra', 'Tỷ trọng từng phân khúc trong vốn (VCSH + nợ vay) và trong EBIT TTM · kỳ chốt');
  function draw5() { const x = sel(), i = S.end, gs = liveGroups(), eq = byGroup('equity', x, 'q').groups, db = byGroup('debt', x, 'q').groups, eb = byGroup('ebit', x, 'ttm').groups;
    const val = (arr, g) => { const z = arr.find(a => a.id === g.id); return z && fin(z.values[i]) ? z.values[i] : null; };
    const sh = v => { const tot = v.reduce((a, b) => a + (fin(b) && b > 0 ? b : 0), 0); return v.map(z => fin(z) && tot ? Math.round(z / tot * 1000) / 10 : null); };
    const a = sh(gs.map(g => { const e = val(eq, g), d = val(db, g); return fin(e) && fin(d) ? e + d : null; })), b = sh(gs.map(g => val(eb, g)));
    const m = {key: 'vt-fin-pool', categories: gs.map(g => g.label), series: [{name: 'Tỷ trọng vốn sử dụng', color: '#9AA3BD', values: a}, {name: 'Tỷ trọng EBIT TTM', color: '#1D2678', values: b}], unit: '%', digits: 1, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c5.host, m, () => { c5.host.innerHTML = ChartTypes.render(m, 'bar'); });
    foot(c5, `${qLabel(D.periods[i])}; vốn sử dụng = VCSH + nợ vay (số dư, không trừ tiền); EBIT chưa gồm lãi bán tàu`); }
  renders.push(draw5);
  s.append(grid2(c1, c2), grid2(c4, c5));
  return s;
}
function bubble(pts, o = {}) {
  if (!pts.length) return '';
  const W = 640, H = 340, m = {l: 46, r: 30, t: 24, b: 34}, xs = pts.map(p => p.x), ys = pts.map(p => p.y), sm = Math.max(...pts.map(p => p.s));
  let x0 = Math.min(0, ...xs), x1 = Math.max(...xs, 1), y0 = Math.min(0, ...ys), y1 = Math.max(...ys, 1);
  const px = (x1 - x0) * .14, py = (y1 - y0) * .16; x0 -= x0 < 0 ? px : 0; x1 += px; y0 -= y0 < 0 ? py : 0; y1 += py;  // lề để bong bóng và nhãn không bị cắt
  const X = v => m.l + (v - x0) / ((x1 - x0) || 1) * (W - m.l - m.r), Y = v => H - m.b - (v - y0) / ((y1 - y0) || 1) * (H - m.t - m.b), R = v => 6 + Math.sqrt(v / sm) * 26;
  const tx = [x0, (x0 + x1) / 2, x1], ty = [y0, (y0 + y1) / 2, y1], xf = v => nf(v, o.xd ?? 1) + (o.xs ?? 'x');
  return `<svg class="pf-bubble" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bản đồ hiệu quả vốn">
    ${ty.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${nf(v, 0)}%</text>`).join('')}
    ${tx.map(v => `<text x="${X(v)}" y="${H - 12}" text-anchor="middle">${xf(v)}</text>`).join('')}
    ${x0 < 0 ? `<line x1="${X(0)}" x2="${X(0)}" y1="${m.t}" y2="${H - m.b}" class="z"/>` : ''}${y0 < 0 ? `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}" class="z"/>` : ''}
    ${pts.sort((a, b) => b.s - a.s).map(p => `<g><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${R(p.s)}" fill="${p.c}" fill-opacity=".55" stroke="${p.c}"><title>${esc(p.l)}: ROCE ${nf(p.y, 1)}%, ${esc(o.xname || '')} ${xf(p.x)}, ${esc(o.sname || 'vốn')} ${nf(p.s)} tỷ đ</title></circle><text x="${X(p.x)}" y="${Y(p.y) + 4}" text-anchor="middle" class="l">${esc(p.l)}</text></g>`).join('')}</svg>`;
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
    return download(`van-tai-bien-tai-chinh-doanh-nghiep-${stamp}.csv`, rows); }
  if (kind === 'group') { const rows = [['group', 'period', 'period_type', 'metric_id', 'metric_name', 'value', 'unit', 'companies_with_data', 'companies_in_group', 'source', 'method']];
    ['revenue', 'gross', 'ebitda', 'ebit', 'npat', 'other', 'da', 'cfo', 'capex', 'asset_sale', 'fcf', 'cip', 'ppe_net', 'ppe_gross', 'receivables', 'debt', 'net_debt', 'equity', 'total_assets', 'interest', 'dividends'].forEach(m => {
      const mode = E.kind[m] === 'stock' ? (S.mode === 'y' ? 'y' : 'q') : S.mode, b = E.byGroup(m, x, mode);
      b.groups.forEach(g => b.labels.forEach((p, i) => { if (g.values[i] != null) rows.push([g.label, p, mode, m, ITEMN[m], Math.round(g.values[i] * 100) / 100, 'tỷ đồng', g.cov[i], g.tickers.length, D.source, 'tổng doanh nghiệp đủ số; loại trùng công ty mẹ − con khi cùng được chọn']); })); });
    return download(`van-tai-bien-tai-chinh-nhom-${S.mode}-${stamp}.csv`, rows); }
  if (kind === 'ratio') { const rows = [['scope', 'period', 'period_type', 'ratio', 'value', 'unit', 'companies_with_data', 'median', 'p25', 'p75', 'formula']];
    const mode = S.mode === 'q' ? 'ttm' : S.mode, defs = [['ROE', {m: 'npat'}, {m: 'equity', avg: true}, 100, '%', 'LNST ÷ VCSH bình quân'], ['ROA', {m: 'npat'}, {m: 'total_assets', avg: true}, 100, '%', 'LNST ÷ tổng tài sản bình quân'], ['Biên gộp', {m: 'gross'}, {m: 'revenue'}, 100, '%', 'LN gộp ÷ doanh thu'], ['Biên EBITDA', {m: 'ebitda'}, {m: 'revenue'}, 100, '%', 'EBITDA ÷ doanh thu'], ['Biên EBIT', {m: 'ebit'}, {m: 'revenue'}, 100, '%', 'EBIT ÷ doanh thu'], ['Biên LNST', {m: 'npat'}, {m: 'revenue'}, 100, '%', 'LNST ÷ doanh thu'], ['Nợ vay ròng/EBITDA', {m: 'net_debt'}, {m: 'ebitda'}, 1, 'lần', 'nợ vay ròng cuối kỳ ÷ EBITDA'], ['CAPEX/khấu hao', {m: 'capex'}, {m: 'da'}, 1, 'lần', 'CAPEX ÷ khấu hao'], ['CFO/EBITDA', {m: 'cfo'}, {m: 'ebitda'}, 1, 'lần', 'CFO ÷ EBITDA'], ['Lợi nhuận khác/LNTT', {m: 'other'}, {m: 'pbt'}, 100, '%', 'lợi nhuận khác (gồm lãi thanh lý tàu) ÷ LNTT'], ['EBITDA/nguyên giá TSCĐ', {m: 'ebitda'}, {m: 'ppe_gross', avg: true}, 100, '%', 'EBITDA ÷ nguyên giá TSCĐ hữu hình bình quân']];
    [['all', 'Nhóm đang chọn', x], ...D.groups.filter(g => S.groups.includes(g.id)).map(g => [g.id, g.label, scopeOf(g.id)])].forEach(([, name, ts]) => defs.forEach(([n, a, b, sc, u, f]) => { const r = E.ratio(a, b, ts, mode, sc); r.labels.forEach((p, i) => { if (r.values[i] != null) rows.push([name, p, mode, n, Math.round(r.values[i] * 1000) / 1000, u, r.cov[i], r.dist[i].med, r.dist[i].p25, r.dist[i].p75, f]); }); }));
    return download(`van-tai-bien-tai-chinh-he-so-${mode}-${stamp}.csv`, rows); }
  const rows = [['ticker', 'subsector', 'in_default_universe', 'note', 'consolidated_into', 'since']];
  D.companies.forEach(c => { const g = D.groups.find(z => z.id === c.group); const p = (D.consolidation || []).find(z => z.child === c.ticker); rows.push([c.ticker, g?.label, g?.default ? 'có' : 'không', c.note || '', p?.parent || '', p?.since || '']); });
  rows.push([], ['methodology']); ['Tổng tuyệt đối = tổng doanh nghiệp có số; hệ số = tổng tử ÷ tổng mẫu cùng tập doanh nghiệp.', 'TTM = tổng 4 quý liền; năm: KQKD = tổng 4 quý, LCTT = số báo cáo năm; số dư dùng cuối kỳ, bình quân = (cuối kỳ + cùng kỳ năm trước)/2.', 'EBIT = LN gộp − CP bán hàng − CP QLDN; EBITDA = EBIT + khấu hao (LCTT); CAPEX = tiền chi mua sắm, xây dựng TSCĐ; FCF = CFO − CAPEX.', 'LCTT quý dùng cho năm có tổng 4 quý khớp số năm (lệch ≤ 5%); năm lệch để trống.', 'Loại trùng hợp nhất: khi công ty mẹ và con cùng được chọn, công ty mẹ dùng số (mẹ − con).'].forEach(t => rows.push([t]));
  download(`van-tai-bien-tai-chinh-universe-${stamp}.csv`, rows);
}

/* ---------- Dựng ---------- */
function methods() {
  const d = el('details', 'card pf-method'); d.dataset.blockId = 'vt-fin-method'; d.dataset.updateKind = 'public'; d.dataset.cadence = 'quarterly'; d.dataset.refreshStatus = 'snapshot';
  d.innerHTML = `<summary><b>Phương pháp & tải dữ liệu</b> <small>BCTC hợp nhất · ${D.companies.length} doanh nghiệp · ${qLabel(D.periods[0])} – ${qLabel(D.periods.at(-1))}</small></summary>
    <ul class="pp-ul"><li>Tổng tuyệt đối = tổng các doanh nghiệp có số ở kỳ đó; doanh nghiệp thiếu số không được cộng, độ phủ ghi dưới mỗi chart.</li>
    <li>Hệ số = tổng tử số ÷ tổng mẫu số trên cùng tập doanh nghiệp có đủ cả hai; không lấy trung bình các hệ số.</li>
    <li>TTM = tổng 4 quý liền, đủ cả 4 quý. Năm: KQKD = tổng 4 quý, LCTT = số báo cáo năm (LCTT quý trên VNDirect trước 2024 không khớp số năm thì để trống). Số dư: cuối kỳ; bình quân = (cuối kỳ + cùng kỳ năm trước)/2.</li>
    <li>Kỳ có dưới 80% số mã trong rổ đủ số thì để trống: LCTT quý trên VNDirect trước 2024 thiếu ở nhiều mã (PVT gần như không có), nên chuỗi TTM có EBITDA, CFO, CAPEX bắt đầu từ Q4/2024; chế độ Năm dùng báo cáo năm nên dài hơn.</li>
    <li>EBIT = LN gộp − chi phí bán hàng − chi phí QLDN, chưa gồm lãi thanh lý tàu (nằm ở lợi nhuận khác) và thu nhập tài chính; EBITDA = EBIT + khấu hao; FCF = CFO − tiền chi mua sắm TSCĐ; mua ròng = CAPEX − tiền thu thanh lý TSCĐ.</li>
    <li>ROCE = (LNTT + lãi vay) × (1 − thuế suất hiệu dụng, 0–30%) ÷ (VCSH + nợ vay) bình quân, không trừ tiền. Trung vị các mã vẽ cạnh số cộng gộp vì PVT và HAH chiếm phần lớn lợi nhuận rổ.</li>
    <li>Mức đã khấu hao = hao mòn lũy kế ÷ nguyên giá TSCĐ hữu hình; nợ vay ÷ TSCĐ ròng dùng giá trị sổ sách, không phải giá tàu thị trường. TSCĐ hữu hình gồm cả cảng, kho, FSO, BCTC tóm tắt không tách riêng tàu.</li>
    <li>Chỉ số cước Baltic (BDTI, BCTI, BDI) là cước giao ngay quốc tế; phần lớn đội tàu trong rổ cho thuê định hạn nên biên đi chậm hơn chỉ số.</li>
    <li>Loại trùng công ty mẹ – con khi cả hai cùng trong rổ: PVT hợp nhất PVP (tỷ lệ sở hữu chưa đối chiếu báo cáo thường niên).</li><li>PVT và HAH có mảng ngoài vận tải biển (FSO/FPSO, cảng); số theo nhóm chỉ mang tính tham khảo. Doanh thu PVT, GSP, VOS gồm mảng thương mại biên mỏng (BCTC quý không tách) nên không dùng tổng doanh thu làm thước đo vận tải.</li></ul>
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
window.ShipFinance = {build, engine: E, state: S};
})();
