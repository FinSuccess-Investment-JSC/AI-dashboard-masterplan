/* Dệt may · tab lớn Tài chính ngành (#mt14, 26/11/2026). Chép từ Dau-khi/app/oil-finance.js, số từ window.TEXTILE_FIN
   (BCTC hợp nhất quý, VNDirect finfo; scripts/build_textile_financials.py), tổng hợp bằng window.IndustryFin (app/industry-fin.js).
   28/11/2026 (người dùng duyệt sau bản rà soát logic): bỏ khung chép từ Dầu khí (CAPEX, XDCB dở dang là trọng tâm của ngành thâm dụng vốn),
   dựng theo mô hình kinh doanh dệt may: 1.1 Doanh thu & mùa vụ (so với kim ngạch xuất khẩu) → 1.2 Biên & giá nguyên liệu (chênh lệch sợi – bông, xơ – PTA/MEG)
   → 1.3 Tồn kho & vốn lưu động → 1.4 Nợ & lãi vay → 1.5 Hiệu quả vốn (DuPont theo mã) → 1.6 CAPEX (1 chart) → 1.7 bảng tỷ số (12 dòng chính, phần còn lại gấp).
   Nhóm: Sợi & xơ (STK, ADS) · Dệt nhuộm – May (TCM, TNG, MSH, HTG, VGG) · Tập đoàn & đa ngành (VGT, GIL). Tỷ số nhóm = tổng tử số ÷ tổng mẫu số;
   kỳ có dưới 80% số mã đủ số thì để trống. Khấu hao quý của TNG, VGG là ước tính (D.estimates.da). Chỉ mô tả dữ liệu; nguồn hiện dưới mọi chart. */
(() => {
'use strict';
const D = window.TEXTILE_FIN;
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
const endIdx = mode => mode === 'y' ? E.years.indexOf(D.periods[S.end].slice(0, 4)) - (D.periods[S.end].endsWith('Q4') ? 0 : 1) : S.end;
const covNote = (cov, n, i) => `phủ ${fin(cov?.[i]) ? cov[i] : 0}/${n} doanh nghiệp kỳ chốt`;
// Độ phủ (theo Dầu khí §48): kỳ có dưới 80% số mã đủ số thì để trống, để chuỗi không đổi thành phần giữa chừng.
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
const FC = ['#1D2678', '#2a9fa3', '#c98a00', '#861C52', '#3d4653', '#8997D6', '#5a9a5a', '#c0603a', '#7b5ea7'];
const tkColor = t => FC[D.companies.findIndex(c => c.ticker === t) % FC.length];
const DA_EST = Object.keys(D.estimates?.da || {}), daNote = DA_EST.length ? `; khấu hao quý của ${DA_EST.join(', ')} ước tính bằng khấu hao năm ÷ 4 (LCTT quý lập trực tiếp)` : '';
const cfNote = (() => { const t = [...new Set((D.checks?.cf_sign_anomaly || []).filter(c => c.period >= '2024').map(c => c.ticker))]; return t.length ? `; LCTT quý 3–4 của ${t.join(', ')} trên nguồn sai dấu nên bỏ, số TTM của mã này trống` : ''; })();

/* ---------- Số ngành theo tháng (window.TEXTILE_PUBLIC): giá nguyên liệu, kim ngạch xuất khẩu, gộp về cùng chu kỳ với BCTC ---------- */
const PUB = window.TEXTILE_PUBLIC?.blocks || {};
const pubSeries = (blk, k) => PUB[blk]?.series?.[k];
const monthMap = (blk, k) => Object.fromEntries((pubSeries(blk, k)?.records || []).filter(r => fin(r.value) && r.date).map(r => [r.date.slice(0, 7), r.value]));
const pubLink = (blk, k, name) => { const s = pubSeries(blk, k); return s?.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(name || s.name)}</a>` : esc(name || k); };
const qMonths = p => { const y = p.slice(0, 4), q = +p.slice(-1); return [0, 1, 2].map(k => `${y}-${String((q - 1) * 3 + k + 1).padStart(2, '0')}`); };
// Gộp chuỗi tháng theo chu kỳ đang xem: quý đủ 3 tháng, TTM đủ 12 tháng, năm đủ 12 tháng. how = 'avg' (giá) | 'sum' (kim ngạch).
function byPeriod(mm, mode, how) {
  const P = D.periods, span = ks => { const v = ks.flatMap(qMonths).map(m => mm[m]); return v.every(fin) ? v.reduce((a, b) => a + b, 0) / (how === 'avg' ? v.length : 1) : null; };
  if (mode === 'y') return E.years.map(y => span([1, 2, 3, 4].map(q => `${y}Q${q}`)));
  return P.map((p, i) => mode === 'ttm' ? (i < 3 ? null : span(P.slice(i - 3, i + 1))) : span([p]));
}
const yoyOf = (v, mode) => { const k = mode === 'y' ? 1 : 4; return v.map((x, i) => i >= k && fin(x) && fin(v[i - k]) && v[i - k] > 0 ? (x / v[i - k] - 1) * 100 : null); };

/* ---------- Thanh bộ lọc, KPI ---------- */
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
      <p class="pf-scope">Rổ đang chọn: <b>${s.length}</b> doanh nghiệp (${s.join(', ') || '—'}) · số tổng hợp từ BCTC hợp nhất; mỗi chart ghi số mã có dữ liệu ở kỳ chốt · không đại diện toàn ngành dệt may (phần lớn xuất khẩu là doanh nghiệp FDI, không niêm yết).</p>
      <p class="pf-note">Bấm mã để bỏ khỏi hoặc thêm vào rổ. Dấu * là doanh nghiệp nhiều mảng: VGT (tập đoàn có cả sợi, dệt, may), GIL (có bất động sản khu công nghiệp), xếp nhóm riêng để không làm lệch chỉ số khâu May.${cons.length ? ` Loại trùng hợp nhất: ${cons.map(c => `${c.parent} trừ ${c.child}`).join(', ')}.` : ''}</p>`; });
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
    const T = (m, mode = 'ttm') => total(m, s, mode);
    const npat = T('npat'), rev = T('revenue'), roe = ratio({m: 'npat'}, {m: 'equity', avg: true}, s, 'ttm', 100), gm = ratio({m: 'gross'}, {m: 'revenue'}, s, 'ttm', 100),
      core = s.filter(t => !D.companies.find(c => c.ticker === t)?.mixed), sx = core.length ? core : s, dio = ratio({m: 'inventory', avg: true}, {m: 'cogs'}, sx, 'ttm', 365), nd = ratio({m: 'net_debt'}, {m: 'ebitda'}, s, 'ttm');
    const tile = (label, val, unit, dTxt, cov, vals, sub, nn = n) => `<div class="kpi pp-kpi"><div class="label l">${esc(label)}</div><div class="value v">${val}${unit ? `<small> ${esc(unit)}</small>` : ''}</div><div class="delta">${dTxt}</div>${spark(vals)}<div class="sub s">${esc(qLabel(D.periods[i]))} · phủ ${cov}/${nn} DN${sub ? ' · ' + sub : ''}</div></div>`;
    const ch = m => growth(m, s, 'ttm').values[i];
    const dAbs = v => fin(v[i]) && fin(v[i - 4]) ? v[i] - v[i - 4] : null;
    // 28/11/2026: bỏ ô CAPEX TTM, XDCB dở dang (dở dang 0–3% tổng tài sản); thêm biên gộp và số ngày tồn kho.
    g.innerHTML = [
      tile('Doanh thu TTM nhóm đã chọn', nf(rev.values[i]), 'tỷ đ', `${sg(ch('revenue'))}% so cùng kỳ`, rev.cov[i], rev.values),
      tile('LNST TTM', nf(npat.values[i]), 'tỷ đ', `${sg(ch('npat'))}% so cùng kỳ`, npat.cov[i], npat.values),
      tile('Biên gộp TTM', nf(gm.values[i], 1), '%', `${sg(dAbs(gm.values))} đ.p. so cùng kỳ`, gm.cov[i], gm.values, 'LN gộp ÷ doanh thu'),
      tile('Số ngày tồn kho', nf(dio.values[i]), 'ngày', `${sg(dAbs(dio.values), 0)} ngày so cùng kỳ`, dio.cov[i], dio.values, sx.length < s.length ? 'không gồm VGT, GIL (nhiều mảng)' : 'tồn kho bình quân ÷ giá vốn TTM', sx.length),
      tile('Nợ vay ròng / EBITDA TTM', nf(nd.values[i], 2), 'lần', `${sg(dAbs(nd.values), 2)} lần so cùng kỳ`, nd.cov[i], nd.values),
      tile('ROE TTM', nf(roe.values[i], 1), '%', `${sg(dAbs(roe.values))} đ.p. so cùng kỳ`, roe.cov[i], roe.values, 'LNST ÷ VCSH bình quân')
    ].join('');
  });
  return g;
}
// Không có hàng ô số nhỏ dưới câu hỏi (quy tắc chung trang Điện, PR #35, 25/11/2026); chỉ giữ hàng KPI đầu sub-tab.
function section(num, title, q) {
  const s = el('section', 'pp-panel pp-q pf-sec'); s.innerHTML = `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(title)}</h3><p class="pf-q">${esc(q)}</p></div></header>`;
  return s;
}
const grid2 = (...cards) => { const g = el('div', 'grid two g2 pf-g2'); cards.forEach(c => g.append(c.el)); return g; };
// Ô chọn phạm vi: tất cả · từng khâu · (tùy chọn) từng mã. Giá trị 'all' | <id nhóm> | 't:<mã>'.
function scopePicker(c, get, set, withFirms) { const g = el('select', 'pf-sel'); c.ctl.append(g); g.addEventListener('change', () => set(g.value));
  return () => { const ok = v => v === 'all' || (v.startsWith('t:') ? sel().includes(v.slice(2)) : S.groups.includes(v)); if (!ok(get())) set('all', true);
    g.innerHTML = `<option value="all">Tất cả nhóm đang chọn</option>` + D.groups.filter(x => S.groups.includes(x.id)).map(x => `<option value="${x.id}"${x.id === get() ? ' selected' : ''}>${esc(x.label)}</option>`).join('')
      + (withFirms ? `<optgroup label="Từng doanh nghiệp">${sel().map(t => `<option value="t:${t}"${'t:' + t === get() ? ' selected' : ''}>${t}</option>`).join('')}</optgroup>` : ''); }; }
const scopeOf = v => v === 'all' ? sel() : v.startsWith('t:') ? [v.slice(2)] : sel().filter(t => E.groupOf[t] === v);
const groupLines = fn => liveGroups().map(g => ({name: g.label, color: g.color, values: fn(scopeOf(g.id), g)}));

/* ---------- 1.1 Doanh thu & mùa vụ ---------- */
const PNL = [['revenue', 'Doanh thu'], ['gross', 'Lợi nhuận gộp'], ['ebitda', 'EBITDA'], ['ebit', 'EBIT'], ['npat', 'LNST']];
function s71() {
  const s = section('1.1', 'Doanh thu & mùa vụ', 'Đơn hàng đang về khâu nào, doanh nghiệp niêm yết tăng nhanh hay chậm hơn xuất khẩu cả nước, và quý nào là cao điểm?');
  const c1 = card('dm-fin-pnl', 'Doanh thu và lợi nhuận theo khâu (tỷ đồng)', 'Cột chồng theo khâu · đổi chỉ tiêu và cách xem'); let m1 = 'revenue', v1 = 'abs';
  seg(c1, 'Chỉ tiêu', PNL, () => m1, k => { m1 = k; draw1(); }); seg(c1, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const b = byGroup(m1, sel(), S.mode), name = PNL.find(p => p[0] === m1)[1];
    if (v1 === 'abs') chart(c1.host, 'dm-fin-pnl-abs', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true});
    else if (v1 === 'yoy') chart(c1.host, 'dm-fin-pnl-yoy', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: growth(m1, sel(), S.mode).groups.find(z => z.id === g.id)?.values || []})), {unit: '%', digits: 1, zeroBase: false});
    else { const tot = b.labels.map((_, i) => b.groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0)), neg = b.labels.map((_, i) => b.groups.some(g => fin(g.values[i]) && g.values[i] < 0));
      chart(c1.host, 'dm-fin-pnl-share', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values.map((v, i) => fin(v) && tot[i] > 0 && !neg[i] ? v / tot[i] * 100 : null)})), {unit: '%', digits: 1, native: 'stack', stackable: true}); }
    foot(c1, `${name} ${modeName(S.mode)}; EBIT = LN gộp − CP bán hàng − CP QLDN (chưa gồm thu nhập tài chính, lãi liên kết); EBITDA = EBIT + khấu hao${/ebitda/.test(m1) ? daNote : ''}${v1 === 'share' ? '; tỷ trọng để trống ở kỳ có nhóm lỗ' : ''}; VGT đã trừ HTG khi cả hai trong rổ; ${covNote(b.groups.reduce((a, g) => a.map((x, i) => x + g.cov[i]), b.labels.map(() => 0)), sel().length, b.labels.length - 1)}`); }
  renders.push(draw1);
  // Doanh thu rổ niêm yết so với kim ngạch xuất khẩu cả nước (28/11/2026): doanh nghiệp niêm yết đang giành hay mất phần đơn hàng.
  const c2 = card('dm-fin-export', 'Doanh thu doanh nghiệp niêm yết so với xuất khẩu cả nước (% so cùng kỳ)', 'Doanh thu của khâu (VND) cạnh kim ngạch xuất khẩu của Việt Nam (USD) · cùng chu kỳ'); let g2 = 'garment';
  seg(c2, 'Chỉ tiêu', [['garment', 'May và hàng dệt, may'], ['yarn', 'Sợi và xơ, sợi dệt']], () => g2, k => { g2 = k; draw2(); });
  function draw2() { const ts = sel().filter(t => E.groupOf[t] === g2), key = g2 === 'garment' ? 'exp_textile' : 'exp_yarn', L = E.labels(S.mode), gl = D.groups.find(g => g.id === g2);
    chart(c2.host, 'dm-fin-export-' + g2, L, [...(ts.length ? [{name: `Doanh thu ${gl.label} (${ts.join(', ')})`, color: gl.color, values: growth('revenue', ts, S.mode).values}] : []),
      {name: g2 === 'garment' ? 'Xuất khẩu hàng dệt, may cả nước' : 'Xuất khẩu xơ, sợi dệt cả nước', color: '#9AA3BD', values: yoyOf(byPeriod(monthMap('macro', key), S.mode, 'sum'), S.mode)}], {unit: '%', digits: 1, zeroBase: false});
    foot(c2, `${modeName(S.mode)} so cùng kỳ năm trước; doanh thu tính bằng VND, kim ngạch bằng USD nên chênh lệch gồm cả biến động tỷ giá; doanh thu gồm phần bán nội địa`, `${SRC}; ${pubLink('macro', key, 'Cục Hải quan (kim ngạch xuất khẩu theo tháng)')}; tự tính`); }
  renders.push(draw2);
  // Bảng nhiệt mùa vụ: giữ (may giao hàng thu đông vào quý 2–3, quý 1 thấp nhất năm).
  const c4 = card('dm-fin-season', 'Tính mùa vụ theo quý', 'Bảng nhiệt năm × quý · chọn khâu và chỉ tiêu'); let g4 = 'all', m4 = 'revenue', v4 = 'share';
  const p4 = scopePicker(c4, () => g4, (v, q) => { g4 = v; if (!q) draw4(); });
  const M4 = [['revenue', 'Doanh thu'], ['npat', 'LNST'], ['ebit', 'EBIT']];
  seg(c4, 'Chỉ tiêu', M4, () => m4, k => { m4 = k; draw4(); }); seg(c4, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng trong năm (%)']], () => v4, k => { v4 = k; draw4(); });
  function draw4() { p4(); const ts = scopeOf(g4), q = E.total(m4, ts, 'q').values, yrs = E.years, nm = M4.find(x => x[0] === m4)[1];
    const cell = (y, k) => q[D.periods.indexOf(`${y}Q${k}`)];
    const yearTot = y => { const v = [1, 2, 3, 4].map(k => cell(y, k)); return v.every(fin) ? v.reduce((a, b) => a + b, 0) : null; };
    const val = (y, k) => { const v = cell(y, k); if (!fin(v)) return null; if (v4 === 'yoy') { const p = cell(+y - 1, k); return fin(p) && p > 0 ? (v / p - 1) * 100 : null; } if (v4 === 'share') { const t = yearTot(y); return fin(t) && t > 0 ? v / t * 100 : null; } return v; };
    const all = yrs.flatMap(y => [1, 2, 3, 4].map(k => val(y, k))).filter(fin), mx = Math.max(...all.map(Math.abs), 1), lo = v4 === 'share' ? Math.min(...all, mx) : 0;
    const col = v => !fin(v) ? 'var(--line,#eef0f6)' : v >= 0 ? `rgba(41,56,168,${(.12 + .78 * Math.min(1, Math.max(0, (v - lo) / ((mx - lo) || 1)))).toFixed(2)})` : `rgba(201,138,0,${(.15 + .7 * Math.min(1, -v / mx)).toFixed(2)})`;
    c4.host.innerHTML = `<div class="pf-hm"><div class="pf-hm-r pf-hm-h"><span></span>${[1, 2, 3, 4].map(k => `<span>Q${k}</span>`).join('')}<span>Năm</span></div>${yrs.map(y => `<div class="pf-hm-r"><span class="pf-hm-y">${y}</span>${[1, 2, 3, 4].map(k => { const v = val(y, k); return `<span style="background:${col(v)};color:${fin(v) && (v - lo) / ((mx - lo) || 1) > .5 ? '#fff' : 'inherit'}" title="Q${k}/${y}: ${fin(v) ? nf(v, v4 === 'abs' ? 0 : 1) + (v4 === 'abs' ? ' tỷ đ' : '%') : '—'}">${fin(v) ? nf(v, v4 === 'abs' ? 0 : 1) : ''}</span>`; }).join('')}<span class="pf-hm-t">${nf(yearTot(y))}</span></div>`).join('')}</div>`;
    foot(c4, `${nm} quý${v4 === 'abs' ? ', tỷ đồng' : v4 === 'yoy' ? ', % so cùng quý năm trước (kỳ gốc dương)' : `, % ${nm.toLowerCase()} cả năm (chỉ năm có tổng dương, đủ 4 quý)`}; cột Năm là tổng 4 quý (tỷ đồng); màu vàng là số âm`); }
  renders.push(draw4);
  const c5 = card('dm-fin-breadth', 'Tăng trưởng lợi nhuận lan rộng hay tập trung?', 'Số doanh nghiệp theo thay đổi LNST so cùng kỳ (quý riêng)');
  function draw5() { const s = sel(), pv = E.per('npat', s, 'q'), L = D.periods;
    const cnt = f => L.map((_, i) => i < 4 ? null : s.filter(t => fin(pv[t][i]) && fin(pv[t][i - 4]) && f(pv[t][i], pv[t][i - 4])).length);
    chart(c5.host, 'dm-fin-breadth', L, [
      {name: 'Tăng (lãi cả hai kỳ)', color: '#2938A8', values: cnt((a, b) => a >= b && a > 0 && b > 0)},
      {name: 'Giảm (lãi cả hai kỳ)', color: '#9AA3BD', values: cnt((a, b) => a < b && a > 0 && b > 0)},
      {name: 'Lỗ sang lãi', color: '#2a9fa3', values: cnt((a, b) => a > 0 && b <= 0)},
      {name: 'Lãi sang lỗ', color: '#c98a00', values: cnt((a, b) => a <= 0 && b > 0)},
      {name: 'Lỗ cả hai kỳ', color: '#3d4653', values: cnt((a, b) => a <= 0 && b <= 0)}], {unit: 'DN', native: 'stack', stackable: true});
    foot(c5, 'LNST quý so cùng quý năm trước; chỉ doanh nghiệp có số cả hai kỳ'); }
  renders.push(draw5);
  s.append(grid2(c1, c2), grid2(c4, c5));
  return s;
}

/* ---------- 1.2 Biên lợi nhuận & giá nguyên liệu ---------- */
const MARG = [['gross', 'Biên gộp'], ['ebitda', 'Biên EBITDA'], ['ebit', 'Biên EBIT'], ['npat', 'Biên LNST']];
function s72() {
  const s = section('1.2', 'Biên lợi nhuận & giá nguyên liệu', 'Biên mỗi khâu và mỗi doanh nghiệp khác nhau ra sao, biên sợi có đi theo chênh lệch giá sợi – nguyên liệu, và lợi nhuận đến từ sản xuất hay tài chính?');
  // Chart 1: biên theo khâu hoặc theo doanh nghiệp (cùng khâu May: FOB/ODM giữ biên gộp cao hơn gia công CMT).
  const c1 = card('dm-fin-margin', 'Biên lợi nhuận theo khâu, theo doanh nghiệp (%)', 'Mỗi đường một khâu hoặc một doanh nghiệp · đổi loại biên'); let m1 = 'gross', u1 = 'group';
  seg(c1, 'Chỉ tiêu', MARG, () => m1, k => { m1 = k; draw1(); }); seg(c1, 'Đơn vị', [['group', 'Khâu'], ['firm', 'Doanh nghiệp']], () => u1, k => { u1 = k; draw1(); });
  function draw1() { const L = E.labels(S.mode), R = x => ratio({m: m1}, {m: 'revenue'}, x, S.mode, 100).values;
    chart(c1.host, `dm-fin-margin-${m1}-${u1}`, L, u1 === 'group' ? groupLines(R) : sel().map(t => ({name: t, color: tkColor(t), values: R([t])})), {unit: '%', digits: 1, zeroBase: false});
    foot(c1, `${MARG.find(x => x[0] === m1)[1]} = tổng lợi nhuận ÷ tổng doanh thu, ${modeName(S.mode)}; biên gộp phụ thuộc phương thức đơn hàng (FOB, ODM tự mua nguyên liệu; CMT chỉ gia công), tỷ trọng FOB từng mã xem sub-tab 03${/ebitda/.test(m1) ? daNote : ''}; kỳ phủ dưới 80% số mã để trống`); }
  renders.push(draw1);
  // Chart 2: chênh lệch giá sợi – nguyên liệu, cùng trục thời gian với chart biên (biến dẫn dắt biên của khâu Sợi).
  const c2 = card('dm-fin-spread', 'Chênh lệch giá sợi – nguyên liệu (CNY/tấn)', 'Bình quân theo cùng chu kỳ với chart biên bên cạnh · giá kỳ hạn Trịnh Châu, Đại Liên'); let v2 = 'spread';
  seg(c2, 'Cách xem', [['spread', 'Chênh lệch'], ['price', 'Giá sợi, bông, xơ']], () => v2, k => { v2 = k; draw2(); });
  function draw2() { const M = k => monthMap('commodity', k), y = M('yarn_cn'), c = M('cotton_cn'), f = M('psf'), p = M('pta'), g = M('meg');
    const sp1 = Object.fromEntries(Object.keys(y).filter(k => fin(c[k])).map(k => [k, y[k] - c[k]])), sp2 = Object.fromEntries(Object.keys(f).filter(k => fin(p[k]) && fin(g[k])).map(k => [k, f[k] - .855 * p[k] - .335 * g[k]]));
    const A = mm => byPeriod(mm, S.mode, 'avg');
    chart(c2.host, 'dm-fin-spread-' + v2, E.labels(S.mode), v2 === 'spread' ? [{name: 'Sợi cotton − bông', color: '#2a9fa3', values: A(sp1)}, {name: 'Xơ polyester (PSF) − PTA, MEG', color: '#c98a00', values: A(sp2)}]
      : [{name: 'Sợi cotton', color: '#2a9fa3', values: A(y)}, {name: 'Bông', color: '#8997D6', values: A(c)}, {name: 'Xơ polyester (PSF)', color: '#c98a00', values: A(f)}], {unit: 'CNY/tấn', digits: 0, zeroBase: false});
    foot(c2, `bình quân các tháng trong ${S.mode === 'q' ? 'quý' : S.mode === 'y' ? 'năm' : '4 quý gần nhất'}, kỳ thiếu tháng để trống; chênh lệch xơ = PSF − 0,855 × PTA − 0,335 × MEG; là giá Trung Quốc, không phải giá bán của STK (sợi filament), ADS (sợi cotton)`, `${pubLink('commodity', 'yarn_cn', 'Sợi cotton')}, ${pubLink('commodity', 'cotton_cn', 'bông')}, ${pubLink('commodity', 'psf', 'PSF')}, ${pubLink('commodity', 'pta', 'PTA')}, ${pubLink('commodity', 'meg', 'MEG')} (Sina Finance, hợp đồng liên tục); tự tính`); }
  renders.push(draw2);
  const c3 = card('dm-fin-cost', 'Cơ cấu chi phí trên 100 đồng doanh thu', 'Theo khâu, kỳ chốt · giá vốn trừ khấu hao, khấu hao, bán hàng & QLDN, lãi vay, thuế, lợi nhuận còn lại');
  function draw3() { const mode = S.mode === 'y' ? 'y' : 'ttm', i = endIdx(mode), x = sel();
    const ms = ['revenue', 'opex_other', 'da', 'sga', 'interest', 'tax', 'npat'], pv = Object.fromEntries(ms.map(m => [m, E.per(m, x, mode)]));
    const gs = liveGroups(), row = g => { const ts = x.filter(t => E.groupOf[t] === g.id && ms.every(m => fin(pv[m][t][i]))), T = m => ts.reduce((a, t) => a + pv[m][t][i], 0), r = T('revenue'); return r ? ms.slice(1).map(m => T(m) / r * 100) : ms.slice(1).map(() => null); };
    const R = gs.map(row), names = ['Giá vốn trừ khấu hao', 'Khấu hao', 'Bán hàng & QLDN', 'Lãi vay', 'Thuế TNDN', 'LNST'], cols = ['#9AA3BD', '#3d4653', '#8997D6', '#c98a00', '#861C52', '#2938A8'];
    const m = {key: 'dm-fin-cost', categories: gs.map(g => g.label), series: names.map((n, k) => ({name: n, color: cols[k], values: R.map(r => fin(r[k]) ? Math.round(r[k] * 10) / 10 : null)})), unit: 'đồng', digits: 1, stackable: true, native: 'stack', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c3.host, m, () => { c3.host.innerHTML = ChartTypes.render(m, 'stack'); });
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; chỉ cộng mã đủ mọi khoản; khoản còn lại (thu nhập tài chính, liên kết, khác, chi phí tài chính ngoài lãi vay) không vẽ nên tổng có thể khác 100; BCTC quý không tách chi phí nhân công và nguyên liệu trong giá vốn${daNote}`); }
  renders.push(draw3);
  // Lợi nhuận trước thuế đến từ đâu (28/11/2026): thu nhập tài chính bằng 13–29% LNTT ở mọi mã, lãi liên kết bằng 34% LNTT của VGT; EBIT hoạt động không gồm hai khoản này.
  const c4 = card('dm-fin-pbtmix', 'Lợi nhuận trước thuế đến từ đâu? (tỷ đồng)', 'Lợi nhuận hoạt động, doanh thu tài chính, chi phí tài chính, lãi liên kết & khác · chọn khâu hoặc doanh nghiệp'); let g4 = 'all'; const p4 = scopePicker(c4, () => g4, (v, q) => { g4 = v; if (!q) draw4(); }, true);
  function draw4() { p4(); const x = scopeOf(g4), T = m => total(m, x, S.mode).values, a = T('assoc'), o = T('other');
    chart(c4.host, 'dm-fin-pbtmix', E.labels(S.mode), [{name: 'Lợi nhuận hoạt động (LN gộp − bán hàng − QLDN)', color: '#2938A8', values: T('ebit')}, {name: 'Doanh thu tài chính', color: '#2a9fa3', values: T('fin_income')}, {name: 'Chi phí tài chính', color: '#c98a00', values: minus(T('fin_exp'))}, {name: 'Lãi liên kết & khác', color: '#8997D6', values: a.map((v, i) => fin(v) && fin(o[i]) ? v + o[i] : null)}, {name: 'LNTT', color: '#3d4653', values: T('pbt'), kind: 'line'}], {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c4, `${modeName(S.mode)}; doanh thu tài chính gồm lãi tiền gửi, lãi chênh lệch tỷ giá, cổ tức được chia; chi phí tài chính gồm lãi vay, lỗ tỷ giá; BCTC tóm tắt không tách riêng tỷ giá`); }
  renders.push(draw4);
  s.append(grid2(c1, c2), grid2(c3, c4));
  return s;
}

/* ---------- 1.3 Tồn kho & vốn lưu động ---------- */
function s73() {
  const s = section('1.3', 'Tồn kho & vốn lưu động', 'Vốn đang nằm ở tồn kho hay công nợ, mất bao nhiêu ngày để quay về tiền, và lợi nhuận ghi nhận có thành dòng tiền?');
  const c1 = card('dm-fin-inv', 'Hàng tồn kho và phải thu theo khâu (tỷ đồng)', 'Số dư cuối kỳ · giá trị hoặc so cùng kỳ'); let m1 = 'inventory', v1 = 'abs';
  seg(c1, 'Chỉ tiêu', [['inventory', 'Hàng tồn kho'], ['receivables', 'Phải thu khách hàng'], ['payables', 'Phải trả người bán']], () => m1, k => { m1 = k; draw1(); }); seg(c1, 'Cách xem', [['abs', 'Tỷ đồng'], ['yoy', 'So cùng kỳ (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const mode = S.mode === 'y' ? 'y' : 'q', b = byGroup(m1, sel(), mode);
    chart(c1.host, `dm-fin-inv-${m1}-${v1}`, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v1 === 'abs' ? g.values : (growth(m1, sel(), mode).groups.find(z => z.id === g.id)?.values || [])})), {unit: v1 === 'abs' ? 'tỷ đ' : '%', digits: v1 === 'abs' ? 0 : 1, native: v1 === 'abs' ? 'stack' : 'line', stackable: v1 === 'abs', zeroBase: v1 === 'abs'});
    foot(c1, `số dư cuối ${mode === 'y' ? 'năm' : 'quý'}${m1 === 'inventory' ? '; hàng tồn kho sau dự phòng giảm giá; tồn kho của GIL phần lớn là dự án khu công nghiệp' : m1 === 'receivables' ? '; phải thu khách hàng ngắn hạn' : '; phải trả người bán ngắn hạn'}`); }
  renders.push(draw1);
  // Chu kỳ tiền = ngày tồn kho + ngày phải thu − ngày phải trả. Ngày phải thu các mã gần nhau (29–55 ngày), ngày tồn kho lệch từ 46 đến 270 ngày.
  const c2 = card('dm-fin-ccc', 'Số ngày vốn lưu động (ngày)', 'Chu kỳ tiền = ngày tồn kho + ngày phải thu − ngày phải trả · theo khâu hoặc doanh nghiệp'); let m2 = 'ccc', u2 = 'group';
  seg(c2, 'Chỉ tiêu', [['ccc', 'Chu kỳ tiền'], ['dio', 'Ngày tồn kho'], ['dso', 'Ngày phải thu'], ['dpo', 'Ngày phải trả']], () => m2, k => { m2 = k; draw2(); }); seg(c2, 'Đơn vị', [['group', 'Khâu'], ['firm', 'Doanh nghiệp']], () => u2, k => { u2 = k; draw2(); });
  function draw2() { const mode = S.mode === 'y' ? 'y' : 'ttm', L = E.labels(mode);
    const day = (m, den, x) => ratio({m, avg: true}, {m: den}, x, mode, 365).values, one = { dio: x => day('inventory', 'cogs', x), dso: x => day('receivables', 'revenue', x), dpo: x => day('payables', 'cogs', x) };
    const R = x => { if (m2 !== 'ccc') return one[m2](x); const a = one.dio(x), b = one.dso(x), c = one.dpo(x); return a.map((v, i) => fin(v) && fin(b[i]) && fin(c[i]) ? v + b[i] - c[i] : null); };
    chart(c2.host, `dm-fin-ccc-${m2}-${u2}`, L, u2 === 'group' ? groupLines(R) : sel().map(t => ({name: t, color: tkColor(t), values: R([t])})), {unit: 'ngày', digits: 0});
    foot(c2, `số dư bình quân (cuối kỳ + cùng kỳ năm trước) ÷ giá vốn (tồn kho, phải trả) hoặc doanh thu (phải thu) ${mode === 'y' ? 'năm' : 'TTM'} × 365; GIL có tồn kho dự án khu công nghiệp nên số ngày rất lớn`); }
  renders.push(draw2);
  const c4 = card('dm-fin-wc', 'Vốn lưu động hút hay nhả tiền? (tỷ đồng)', 'Thay đổi phải thu, tồn kho, phải trả trên LCTT và dòng tiền kinh doanh · chọn khâu hoặc doanh nghiệp'); let g4 = 'all'; const p4 = scopePicker(c4, () => g4, (v, q) => { g4 = v; if (!q) draw4(); }, true);
  function draw4() { p4(); const x = scopeOf(g4), mode = S.mode === 'q' ? 'ttm' : S.mode, T = m => total(m, x, mode).values;
    chart(c4.host, 'dm-fin-wc', E.labels(mode), [{name: 'Thay đổi phải thu', color: '#8997D6', values: T('chg_receivables')}, {name: 'Thay đổi tồn kho', color: '#c98a00', values: T('chg_inventory')}, {name: 'Thay đổi phải trả', color: '#2a9fa3', values: T('chg_payables')}, {name: 'CFO', color: '#1D2678', values: T('cfo'), kind: 'line'}], {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c4, `${mode === 'y' ? 'năm' : 'TTM'}; số âm là tiền bị giữ lại (phải thu, tồn kho tăng hoặc phải trả giảm); TNG, VGG lập LCTT quý trực tiếp nên không có ba dòng này${cfNote}; ADS thiếu LCTT quý năm 2025`); }
  renders.push(draw4);
  const c3 = card('dm-fin-conversion', 'Lợi nhuận chuyển thành tiền đến đâu?', 'CFO/EBITDA, CFO/LNST (lần) · chọn khâu hoặc doanh nghiệp'); let g3 = 'all'; const p3 = scopePicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); }, true);
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), R = (a, b) => ratio({m: a}, {m: b}, x, mode).values;
    chart(c3.host, 'dm-fin-conversion', L, [{name: 'CFO/EBITDA (lần)', color: LINE[0], values: R('cfo', 'ebitda')}, {name: 'CFO/LNST (lần)', color: LINE[2], values: R('cfo', 'npat')}, {name: 'Mốc 1 lần', color: '#9AA3BD', values: L.map(() => 1)}], {unit: 'lần', digits: 2});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}${daNote}${cfNote}`); }
  renders.push(draw3);
  s.append(grid2(c1, c2), grid2(c4, c3));
  return s;
}

/* ---------- 1.4 Nợ & lãi vay ---------- */
function s74() {
  const s = section('1.4', 'Nợ & lãi vay', 'Nợ vay đang nuôi vốn lưu động hay nhà máy, và lãi vay, tỷ giá lấy đi bao nhiêu lợi nhuận gộp?');
  const c1 = card('dm-fin-debt', 'Cơ cấu nợ vay (tỷ đồng)', 'Nợ vay ngắn hạn, dài hạn (cột chồng); tiền & đầu tư ngắn hạn, nợ vay ròng (đường) · chọn khâu hoặc doanh nghiệp'); let g1 = 'all'; const p1 = scopePicker(c1, () => g1, (v, q) => { g1 = v; if (!q) draw1(); }, true);
  function draw1() { p1(); const x = scopeOf(g1), mode = S.mode === 'y' ? 'y' : 'q', L = E.labels(mode), T = m => total(m, x, mode).values;
    chart(c1.host, 'dm-fin-debt', L, [{name: 'Nợ vay ngắn hạn', color: '#8997D6', values: T('st_debt')}, {name: 'Nợ vay dài hạn', color: '#1D2678', values: T('lt_debt')}, {name: 'Tiền & đầu tư ngắn hạn', color: '#2a9fa3', values: T('cash_all'), kind: 'line'}, {name: 'Nợ vay ròng', color: '#c98a00', values: T('net_debt'), kind: 'line'}], {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c1, 'nợ vay chịu lãi (vay và nợ thuê tài chính), không phải tổng nợ phải trả; nợ vay ròng = nợ vay − tiền − đầu tư tài chính ngắn hạn; nợ ngắn hạn chủ yếu tài trợ nguyên liệu và hàng đang sản xuất'); }
  renders.push(draw1);
  const LEV = [['nde', 'Nợ vay ròng/EBITDA', 'lần', 2], ['de', 'Nợ vay/VCSH', 'lần', 2], ['st', 'Nợ vay ngắn hạn/tổng nợ vay', '%', 1]];
  const c2 = card('dm-fin-leverage', 'Đòn bẩy tài chính theo khâu, theo doanh nghiệp', 'Mỗi đường một khâu hoặc một doanh nghiệp · đổi chỉ tiêu'); let m2 = 'nde', u2 = 'group';
  seg(c2, 'Chỉ tiêu', LEV.map(x => [x[0], x[1]]), () => m2, k => { m2 = k; draw2(); }); seg(c2, 'Đơn vị', [['group', 'Khâu'], ['firm', 'Doanh nghiệp']], () => u2, k => { u2 = k; draw2(); });
  function draw2() { const def = LEV.find(x => x[0] === m2), fm = S.mode === 'y' ? 'y' : 'ttm', sm = S.mode === 'y' ? 'y' : 'q', L = E.labels(fm);
    const R = x => m2 === 'nde' ? ratio({m: 'net_debt'}, {m: 'ebitda'}, x, fm).values : m2 === 'de' ? ratio({m: 'debt'}, {m: 'equity'}, x, sm).values : ratio({m: 'st_debt'}, {m: 'debt'}, x, sm, 100).values;
    chart(c2.host, `dm-fin-leverage-${m2}-${u2}`, L, u2 === 'group' ? groupLines(R) : sel().map(t => ({name: t, color: tkColor(t), values: R([t])})), {unit: def[2], digits: def[3], zeroBase: m2 !== 'nde'});
    foot(c2, `${m2 === 'nde' ? `nợ vay ròng cuối kỳ ÷ EBITDA ${fm === 'y' ? 'năm' : 'TTM'}; số âm là tiền ròng; EBITDA âm vẫn nằm trong tổng${daNote}` : 'số dư cuối kỳ; VCSH gồm lợi ích cổ đông không kiểm soát'}`); }
  renders.push(draw2);
  const BUR = [['ig', 'Lãi vay/lợi nhuận gộp', '%', 1], ['cov', 'EBIT/lãi vay', 'lần', 1], ['rate', 'Lãi vay/nợ vay bình quân', '%', 1]];
  const c3 = card('dm-fin-interest', 'Gánh nặng lãi vay theo khâu, theo doanh nghiệp', 'Mỗi đường một khâu hoặc một doanh nghiệp · đổi chỉ tiêu'); let m3 = 'ig', u3 = 'group';
  seg(c3, 'Chỉ tiêu', BUR.map(x => [x[0], x[1]]), () => m3, k => { m3 = k; draw3(); }); seg(c3, 'Đơn vị', [['group', 'Khâu'], ['firm', 'Doanh nghiệp']], () => u3, k => { u3 = k; draw3(); });
  function draw3() { const def = BUR.find(x => x[0] === m3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    const R = x => m3 === 'ig' ? ratio({m: 'interest'}, {m: 'gross'}, x, mode, 100).values : m3 === 'cov' ? ratio({m: 'ebit'}, {m: 'interest'}, x, mode).values : ratio({m: 'interest'}, {m: 'debt', avg: true}, x, mode, 100).values;
    chart(c3.host, `dm-fin-interest-${m3}-${u3}`, L, u3 === 'group' ? groupLines(R) : sel().map(t => ({name: t, color: tkColor(t), values: R([t])})), {unit: def[2], digits: def[3]});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; ${m3 === 'ig' ? 'chi phí lãi vay ÷ lợi nhuận gộp' : m3 === 'cov' ? 'EBIT hoạt động (LN gộp − bán hàng − QLDN) ÷ chi phí lãi vay, chưa gồm thu nhập tài chính' : 'chi phí vay ghi nhận ước tính, không phải lãi suất hợp đồng; chưa tách lãi vay vốn hóa'}`); }
  renders.push(draw3);
  const c4 = card('dm-fin-fininc', 'Doanh thu tài chính so với chi phí tài chính (tỷ đồng)', 'Doanh thu tài chính, chi phí lãi vay, chi phí tài chính khác (gồm lỗ tỷ giá) · chọn khâu hoặc doanh nghiệp'); let g4 = 'all'; const p4 = scopePicker(c4, () => g4, (v, q) => { g4 = v; if (!q) draw4(); }, true);
  function draw4() { p4(); const x = scopeOf(g4), T = m => total(m, x, S.mode).values, fi = T('fin_income'), fe = T('fin_exp'), it = T('interest');
    chart(c4.host, 'dm-fin-fininc', E.labels(S.mode), [{name: 'Doanh thu tài chính', color: '#2a9fa3', values: fi}, {name: 'Chi phí lãi vay', color: '#c98a00', values: minus(it)}, {name: 'Chi phí tài chính khác', color: '#861C52', values: fe.map((v, i) => fin(v) && fin(it[i]) ? -(v - it[i]) : null)}, {name: 'Thu nhập tài chính ròng', color: '#3d4653', values: fi.map((v, i) => fin(v) && fin(fe[i]) ? v - fe[i] : null), kind: 'line'}], {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c4, `${modeName(S.mode)}; chi phí vẽ số âm; chi phí tài chính khác = chi phí tài chính − lãi vay (lỗ chênh lệch tỷ giá, dự phòng đầu tư, chiết khấu thanh toán); doanh nghiệp bán hàng bằng USD và vay USD nên tỷ giá vào cả hai phía`); }
  renders.push(draw4);
  s.append(grid2(c1, c2), grid2(c3, c4));
  return s;
}

/* ---------- 1.5 Hiệu quả vốn ---------- */
// NOPAT = EBIT × (1 − thuế suất hiệu dụng); thuế suất hiệu dụng = thuế TNDN ÷ LNTT cùng kỳ, giới hạn 0–30%.
function roic(x, mode) {
  const L = E.labels(mode), e = E.per('ebit', x, mode), tx = E.per('tax', x, mode), pb = E.per('pbt', x, mode), ic = E.per('ic', x, mode, true);
  const nop = t => L.map((_, i) => { if (!fin(e[t][i]) || !fin(tx[t][i]) || !fin(pb[t][i])) return null; const r = pb[t][i] > 0 ? Math.min(.3, Math.max(0, tx[t][i] / pb[t][i])) : 0; return e[t][i] * (1 - r); });
  const N = Object.fromEntries(x.map(t => [t, nop(t)]));
  const values = L.map((_, i) => { const ts = x.filter(t => fin(N[t][i]) && fin(ic[t][i])); const d = ts.reduce((a, t) => a + ic[t][i], 0); return okCov(ts.length, x.length) && d > 0 ? ts.reduce((a, t) => a + N[t][i], 0) / d * 100 : null; });
  return {labels: L, values};
}
function s75() {
  const s = section('1.5', 'Hiệu quả vốn', 'ROE của mỗi khâu, mỗi doanh nghiệp đến từ biên lợi nhuận, vòng quay tài sản hay đòn bẩy?');
  const c1 = card('dm-fin-returns', 'ROE, ROA, ROIC (%)', 'TTM hoặc năm · chọn khâu hoặc doanh nghiệp · đường mảnh là bình quân lịch sử của chính chỉ tiêu'); let g1 = 'all'; const p1 = scopePicker(c1, () => g1, (v, q) => { g1 = v; if (!q) draw1(); }, true);
  function draw1() { p1(); const x = scopeOf(g1), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), roe = ratio({m: 'npat'}, {m: 'equity', avg: true}, x, mode, 100).values, roa = ratio({m: 'npat'}, {m: 'total_assets', avg: true}, x, mode, 100).values, ri = roic(x, mode).values;
    const avg = v => { const a = v.filter(fin); return a.length ? a.reduce((s, z) => s + z, 0) / a.length : null; };
    chart(c1.host, 'dm-fin-returns', L, [{name: 'ROE', color: LINE[0], values: roe}, {name: 'ROA', color: LINE[1], values: roa}, {name: 'ROIC', color: LINE[2], values: ri}, {name: 'ROE bình quân', color: '#9AA3BD', values: L.map(() => avg(roe))}, {name: 'ROIC bình quân', color: '#e3c98a', values: L.map(() => avg(ri))}], {unit: '%', digits: 1, zeroBase: false});
    foot(c1, 'ROE = LNST hợp nhất ÷ VCSH (gồm lợi ích CĐKKS) bình quân; ROIC = EBIT hoạt động × (1 − thuế suất hiệu dụng, tối đa 30%) ÷ (VCSH + nợ vay − tiền − đầu tư ngắn hạn) bình quân, không gồm thu nhập tài chính và lãi liên kết'); }
  renders.push(draw1);
  const c2 = card('dm-fin-dupont', 'Phân rã ROE (DuPont)', 'Biên LNST × vòng quay tài sản × đòn bẩy (tổng tài sản/VCSH) · chọn khâu hoặc doanh nghiệp'); let g2 = 'all'; const p2 = scopePicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); }, true);
  function draw2() { p2(); const x = scopeOf(g2), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    const n = E.per('npat', x, mode), r = E.per('revenue', x, mode), a = E.per('total_assets', x, mode, true), q = E.per('equity', x, mode, true);
    const parts = L.map((_, i) => { const ts = x.filter(t => [n, r, a, q].every(z => fin(z[t][i]))); if (!okCov(ts.length, x.length)) return null; const S2 = z => ts.reduce((s, t) => s + z[t][i], 0), N = S2(n), R = S2(r), A = S2(a), Qv = S2(q); return R && A && Qv ? {m: N / R * 100, t: R / A, l: A / Qv, roe: N / Qv * 100} : null; });
    chart(c2.host, 'dm-fin-dupont', L, [{name: 'ROE (%)', color: LINE[0], values: parts.map(p => p?.roe ?? null)}, {name: 'Biên LNST (%)', color: LINE[2], values: parts.map(p => p?.m ?? null)}, {name: 'Vòng quay tài sản (lần)', color: LINE[1], values: parts.map(p => p?.t ?? null)}, {name: 'Đòn bẩy (lần)', color: LINE[3], values: parts.map(p => p?.l ?? null)}], {unit: '', digits: 2, zeroBase: false});
    foot(c2, 'ROE = biên × vòng quay × đòn bẩy, cùng tập doanh nghiệp, tài sản và VCSH bình quân'); }
  renders.push(draw2);
  // Bản đồ ROE – đòn bẩy (28/11/2026): thay trục nợ vay ròng/EBITDA × ROIC; cho thấy ROE cao nhờ biên (MSH) hay nhờ nợ vay (TNG).
  const c4 = card('dm-fin-map', 'ROE cao nhờ biên hay nhờ đòn bẩy?', 'Trục ngang: nợ vay/VCSH (lần) · trục dọc: ROE TTM (%) · kích thước: vốn chủ sở hữu'); let v4 = 'firm';
  seg(c4, 'Đơn vị', [['firm', 'Doanh nghiệp'], ['group', 'Khâu']], () => v4, k => { v4 = k; draw4(); });
  function draw4() { const i = S.end, pt = (l, c, ts) => ({l, c, x: ratio({m: 'debt'}, {m: 'equity'}, ts, 'q').values[i], y: ratio({m: 'npat'}, {m: 'equity', avg: true}, ts, 'ttm', 100).values[i], s: total('equity', ts, 'q').values[i], m: ratio({m: 'npat'}, {m: 'revenue'}, ts, 'ttm', 100).values[i]});
    const pts = (v4 === 'firm' ? sel().map(t => pt(t, GC[E.groupOf[t]], [t])) : liveGroups().map(g => pt(g.label, g.color, scopeOf(g.id)))).filter(p => fin(p.x) && fin(p.y) && fin(p.s) && p.s > 0);
    c4.host.innerHTML = bubble(pts);
    foot(c4, `${qLabel(D.periods[i])}; màu theo khâu; rê chuột vào bong bóng để xem biên LNST`); }
  renders.push(draw4);
  const c5 = card('dm-fin-pool', 'Vốn đầu tư so với lợi nhuận tạo ra', 'Tỷ trọng từng khâu trong vốn đầu tư và trong EBIT TTM · kỳ chốt');
  function draw5() { const x = sel(), i = S.end, gs = liveGroups(), ic = byGroup('ic', x, 'q').groups, eb = byGroup('ebit', x, 'ttm').groups;
    const sh = arr => { const v = gs.map(g => { const z = arr.find(a => a.id === g.id); return z && fin(z.values[i]) ? z.values[i] : null; }); const tot = v.reduce((a, b) => a + (fin(b) && b > 0 ? b : 0), 0); return v.map(z => fin(z) && tot ? z / tot * 100 : null); };
    const a = sh(ic), b = sh(eb);
    const m = {key: 'dm-fin-pool', categories: gs.map(g => g.label), series: [{name: 'Tỷ trọng vốn đầu tư', color: '#9AA3BD', values: a.map(v => fin(v) ? Math.round(v * 10) / 10 : null)}, {name: 'Tỷ trọng EBIT TTM', color: '#1D2678', values: b.map(v => fin(v) ? Math.round(v * 10) / 10 : null)}], unit: '%', digits: 1, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c5.host, m, () => { c5.host.innerHTML = ChartTypes.render(m, 'bar'); });
    foot(c5, `${qLabel(D.periods[i])}; vốn đầu tư = VCSH + nợ vay − tiền − đầu tư ngắn hạn (số dư); EBIT hoạt động TTM`); }
  renders.push(draw5);
  s.append(grid2(c1, c2), grid2(c4, c5));
  return s;
}
function bubble(pts) {
  if (!pts.length) return '';
  const W = 640, H = 340, m = {l: 46, r: 30, t: 24, b: 34}, xs = pts.map(p => p.x), ys = pts.map(p => p.y), sm = Math.max(...pts.map(p => p.s));
  let x0 = Math.min(0, ...xs), x1 = Math.max(...xs, 1), y0 = Math.min(0, ...ys), y1 = Math.max(...ys, 1);
  const px = (x1 - x0) * .14, py = (y1 - y0) * .16; x0 -= px; x1 += px; y0 -= y0 < 0 ? py : 0; y1 += py;  // lề để bong bóng và nhãn không bị cắt
  const X = v => m.l + (v - x0) / ((x1 - x0) || 1) * (W - m.l - m.r), Y = v => H - m.b - (v - y0) / ((y1 - y0) || 1) * (H - m.t - m.b), R = v => 6 + Math.sqrt(v / sm) * 26;
  const tx = [0, x1 / 2, x1 - px], ty = [y0, (y0 + y1) / 2, y1];
  return `<svg class="pf-bubble" viewBox="0 0 ${W} ${H}" role="img" aria-label="ROE so với nợ vay trên vốn chủ sở hữu">
    ${ty.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${nf(v, 0)}%</text>`).join('')}
    ${tx.map(v => `<text x="${X(v)}" y="${H - 12}" text-anchor="middle">${nf(v, 1)}x</text>`).join('')}
    ${y0 < 0 ? `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}" class="z"/>` : ''}
    ${pts.sort((a, b) => b.s - a.s).map(p => `<g><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${R(p.s)}" fill="${p.c}" fill-opacity=".55" stroke="${p.c}"><title>${esc(p.l)}: ROE ${nf(p.y, 1)}%, nợ vay/VCSH ${nf(p.x, 2)} lần, biên LNST ${nf(p.m, 1)}%, VCSH ${nf(p.s)} tỷ đ</title></circle><text x="${X(p.x)}" y="${Y(p.y) + 4}" text-anchor="middle" class="l">${esc(p.l)}</text></g>`).join('')}</svg>`;
}

/* ---------- 1.6 CAPEX: một chart (dệt may thâm dụng lao động; XDCB dở dang chỉ 0–3% tổng tài sản, CAPEX 3–7% doanh thu) ---------- */
function s76() {
  const s = section('1.6', 'CAPEX', 'Khâu nào đang mở rộng nhà máy, khâu nào chỉ đầu tư duy trì?');
  const c1 = card('dm-fin-capex', 'CAPEX theo khâu', 'Tiền chi mua sắm, xây dựng TSCĐ (LCTT) · giá trị, so với khấu hao, so với doanh thu'); let v1 = 'abs';
  seg(c1, 'Cách xem', [['abs', 'Tỷ đồng'], ['da', 'CAPEX/khấu hao (lần)'], ['rev', 'CAPEX/doanh thu (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const mode = v1 === 'abs' ? S.mode : S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    if (v1 === 'abs') { const b = byGroup('capex', sel(), mode); chart(c1.host, 'dm-fin-capex-abs', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true}); }
    else if (v1 === 'da') chart(c1.host, 'dm-fin-capex-da', L, [...groupLines(x => ratio({m: 'capex'}, {m: 'da'}, x, mode).values), {name: 'Mốc 1 lần (đầu tư bằng khấu hao)', color: '#9AA3BD', values: L.map(() => 1)}], {unit: 'lần', digits: 2});
    else chart(c1.host, 'dm-fin-capex-rev', L, groupLines(x => ratio({m: 'capex'}, {m: 'revenue'}, x, mode, 100).values), {unit: '%', digits: 1});
    foot(c1, `CAPEX tiền mặt ${modeName(mode)}; không gồm tăng tài sản do M&A; LCTT quý chỉ dùng năm khớp số năm, kỳ phủ dưới 80% số mã để trống${v1 === 'da' ? daNote : ''}${cfNote}; ADS thiếu LCTT quý năm 2025`); }
  renders.push(draw1);
  s.append(c1.el);
  return s;
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
    return download(`det-may-tai-chinh-doanh-nghiep-${stamp}.csv`, rows); }
  if (kind === 'group') { const rows = [['group', 'period', 'period_type', 'metric_id', 'metric_name', 'value', 'unit', 'companies_with_data', 'companies_in_group', 'source', 'method']];
    ['revenue', 'gross', 'ebitda', 'ebit', 'npat', 'da', 'cfo', 'capex', 'fcf', 'cip', 'ppe_net', 'ppe_gross', 'receivables', 'debt', 'net_debt', 'equity', 'total_assets', 'interest', 'dividends'].forEach(m => {
      const mode = E.kind[m] === 'stock' ? (S.mode === 'y' ? 'y' : 'q') : S.mode, b = E.byGroup(m, x, mode);
      b.groups.forEach(g => b.labels.forEach((p, i) => { if (g.values[i] != null) rows.push([g.label, p, mode, m, ITEMN[m], Math.round(g.values[i] * 100) / 100, 'tỷ đồng', g.cov[i], g.tickers.length, D.source, 'tổng doanh nghiệp đủ số; loại trùng công ty mẹ − con khi cùng được chọn']); })); });
    return download(`det-may-tai-chinh-nhom-${S.mode}-${stamp}.csv`, rows); }
  if (kind === 'ratio') { const rows = [['scope', 'period', 'period_type', 'ratio', 'value', 'unit', 'companies_with_data', 'median', 'p25', 'p75', 'formula']];
    const mode = S.mode === 'q' ? 'ttm' : S.mode, defs = [['ROE', {m: 'npat'}, {m: 'equity', avg: true}, 100, '%', 'LNST ÷ VCSH bình quân'], ['ROA', {m: 'npat'}, {m: 'total_assets', avg: true}, 100, '%', 'LNST ÷ tổng tài sản bình quân'], ['Biên gộp', {m: 'gross'}, {m: 'revenue'}, 100, '%', 'LN gộp ÷ doanh thu'], ['Biên EBITDA', {m: 'ebitda'}, {m: 'revenue'}, 100, '%', 'EBITDA ÷ doanh thu'], ['Biên EBIT', {m: 'ebit'}, {m: 'revenue'}, 100, '%', 'EBIT ÷ doanh thu'], ['Biên LNST', {m: 'npat'}, {m: 'revenue'}, 100, '%', 'LNST ÷ doanh thu'], ['Nợ vay ròng/EBITDA', {m: 'net_debt'}, {m: 'ebitda'}, 1, 'lần', 'nợ vay ròng cuối kỳ ÷ EBITDA'], ['CAPEX/khấu hao', {m: 'capex'}, {m: 'da'}, 1, 'lần', 'CAPEX ÷ khấu hao'], ['CFO/EBITDA', {m: 'cfo'}, {m: 'ebitda'}, 1, 'lần', 'CFO ÷ EBITDA'], ['DSO', {m: 'receivables', avg: true}, {m: 'revenue'}, 365, 'ngày', 'phải thu KH bình quân ÷ doanh thu × 365']];
    [['all', 'Nhóm đang chọn', x], ...D.groups.filter(g => S.groups.includes(g.id)).map(g => [g.id, g.label, scopeOf(g.id)])].forEach(([, name, ts]) => defs.forEach(([n, a, b, sc, u, f]) => { const r = E.ratio(a, b, ts, mode, sc); r.labels.forEach((p, i) => { if (r.values[i] != null) rows.push([name, p, mode, n, Math.round(r.values[i] * 1000) / 1000, u, r.cov[i], r.dist[i].med, r.dist[i].p25, r.dist[i].p75, f]); }); }));
    return download(`det-may-tai-chinh-he-so-${mode}-${stamp}.csv`, rows); }
  const rows = [['ticker', 'subsector', 'in_default_universe', 'note', 'consolidated_into', 'since']];
  D.companies.forEach(c => { const g = D.groups.find(z => z.id === c.group); const p = (D.consolidation || []).find(z => z.child === c.ticker); rows.push([c.ticker, g?.label, g?.default ? 'có' : 'không', c.note || '', p?.parent || '', p?.since || '']); });
  rows.push([], ['methodology']); ['Tổng tuyệt đối = tổng doanh nghiệp có số; hệ số = tổng tử ÷ tổng mẫu cùng tập doanh nghiệp.', 'TTM = tổng 4 quý liền; năm: KQKD = tổng 4 quý, LCTT = số báo cáo năm; số dư dùng cuối kỳ, bình quân = (cuối kỳ + cùng kỳ năm trước)/2.', 'EBIT = LN gộp − CP bán hàng − CP QLDN; EBITDA = EBIT + khấu hao (LCTT); CAPEX = tiền chi mua sắm, xây dựng TSCĐ; FCF = CFO − CAPEX.', 'LCTT quý dùng cho năm có tổng 4 quý khớp số năm (lệch ≤ 5%); năm lệch để trống.', 'Khấu hao quý của TNG, VGG ước tính = khấu hao năm ÷ 4 (LCTT quý lập trực tiếp); LCTT quý có dòng tiền gộp sai dấu để trống từ quý đó đến hết năm.', 'Loại trùng hợp nhất: khi công ty mẹ và con cùng được chọn, công ty mẹ dùng số (mẹ − con).'].forEach(t => rows.push([t]));
  download(`det-may-tai-chinh-universe-${stamp}.csv`, rows);
}
/* ---------- Dựng ---------- */
function methods() {
  const d = el('details', 'card pf-method'); d.dataset.blockId = 'dm-fin-method'; d.dataset.updateKind = 'public'; d.dataset.cadence = 'quarterly'; d.dataset.refreshStatus = 'snapshot';
  const cons = E.consolidation.map(c => `${c.parent} hợp nhất ${c.child}`).join(', ');
  d.innerHTML = `<summary><b>Phương pháp & tải dữ liệu</b> <small>BCTC hợp nhất · ${D.companies.length} doanh nghiệp · ${qLabel(D.periods[0])} – ${qLabel(D.periods.at(-1))}</small></summary>
    <ul class="pp-ul"><li>Tổng tuyệt đối = tổng các doanh nghiệp có số ở kỳ đó; kỳ có dưới 80% số mã đủ số thì để trống, độ phủ ghi dưới mỗi chart.</li>
    <li>Hệ số = tổng tử số ÷ tổng mẫu số trên cùng tập doanh nghiệp có đủ cả hai; không lấy trung bình các hệ số.</li>
    <li>TTM = tổng 4 quý liền, đủ cả 4 quý. Năm: KQKD = tổng 4 quý, LCTT = số báo cáo năm. Số dư: cuối kỳ; bình quân = (cuối kỳ + cùng kỳ năm trước)/2.</li>
    <li>EBITDA = LN gộp − chi phí bán hàng − chi phí QLDN + khấu hao; FCF = CFO − tiền chi mua sắm TSCĐ; vốn đầu tư = VCSH + nợ vay − tiền − đầu tư ngắn hạn.</li>
    <li>LCTT quý trên VNDirect: năm có tổng 4 quý lệch số năm quá 5% thì để trống; quý có dòng tiền gộp sai dấu (TNG mọi quý 3) để trống từ quý đó đến hết năm.${DA_EST.length ? ` ${DA_EST.join(', ')} lập LCTT quý theo phương pháp trực tiếp, không có dòng khấu hao: khấu hao quý ước tính bằng khấu hao năm ÷ 4 (năm chưa có báo cáo năm dùng năm gần nhất).` : ''}</li>
    <li>${cons ? `Loại trùng: ${cons}; khi cả hai cùng trong rổ, công ty mẹ dùng số (mẹ − con).` : 'Không có cặp mẹ – con trong rổ.'} VGG là công ty liên kết của VGT (không hợp nhất, phần lãi nằm trong lãi liên kết của VGT).</li>
    <li>GIL có mảng bất động sản khu công nghiệp (tồn kho chủ yếu là dự án); VGT là số hợp nhất của tập đoàn. Hai mã xếp nhóm riêng để không làm lệch chỉ số khâu May.</li></ul>
    <div class="pf-ctl"><span class="pf-lb">Tải CSV</span>${[['raw', 'Số liệu từng doanh nghiệp'], ['group', 'Tổng theo nhóm (chu kỳ đang chọn)'], ['ratio', 'Hệ số theo nhóm'], ['universe', 'Danh mục doanh nghiệp & phương pháp']].map(([k, t]) => `<button type="button" class="pf-dl" data-x="${k}">${t}</button>`).join('')}</div>`;
  d.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', () => exportCsv(b.dataset.x)));
  const src = el('div', 'pw-src', `Nguồn: ${SRC}`); d.append(src);
  return d;
}
function redraw() { syncUrl(); renders.forEach(f => { try { f(); } catch (e) { document.documentElement.dataset.pfError = (document.documentElement.dataset.pfError || '') + e.message + ';'; console.error(e); } }); setTimeout(() => window.dispatchEvent(new Event('resize')), 60); }
/* ---------- 1.7 So sánh tỷ số từng mã (26/11/2026, theo bảng trong BCTN 2025 của TNG) ----------
   Tính lại từ BCTC hợp nhất, không chép số từ BCTN. Năm: KQKD = tổng 4 quý, LCTT = báo cáo năm, số dư cuối Q4,
   bình quân = (cuối năm + cuối năm trước)/2. TTM: 4 quý gần nhất, số dư kỳ chốt, bình quân với cùng kỳ năm trước.
   28/11/2026: dòng có cờ true ở cuối là dòng chính (phân biệt được các mã dệt may), luôn hiện; phần còn lại nằm trong mục gấp. */
const RATIO_ROWS = [
  ['Thanh khoản'],
  ['Thanh toán bằng tiền mặt', 'lần', v => v.d('cash', 'cur_liab')],
  ['Thanh toán nhanh', 'lần', v => v.r(v.b('cur_assets') - v.b('inventory'), v.b('cur_liab'))],
  ['Thanh toán hiện hành', 'lần', v => v.d('cur_assets', 'cur_liab'), true],
  ['(LNTT + lãi vay)/lãi vay', 'lần', v => v.r(v.f('pbt') + v.f('interest'), v.f('interest')), true],
  ['Hiệu quả hoạt động'],
  ['Vòng quay phải thu khách hàng', 'vòng', v => v.r(v.f('revenue'), v.a('receivables'))],
  ['Thời gian thu tiền bình quân', 'ngày', v => v.r(365, v.r(v.f('revenue'), v.a('receivables'))), true],
  ['Vòng quay hàng tồn kho', 'vòng', v => v.r(v.f('cogs'), v.a('inventory'))],
  ['Thời gian tồn kho bình quân', 'ngày', v => v.r(365, v.r(v.f('cogs'), v.a('inventory'))), true],
  ['Vòng quay phải trả người bán', 'vòng', v => v.r(v.f('cogs'), v.a('payables'))],
  ['Thời gian trả tiền người bán', 'ngày', v => v.r(365, v.r(v.f('cogs'), v.a('payables'))), true],
  ['Vòng quay tài sản cố định', 'vòng', v => v.r(v.f('revenue'), v.a('fixed_assets'))],
  ['Vòng quay tổng tài sản', 'vòng', v => v.r(v.f('revenue'), v.a('total_assets')), true],
  ['Vòng quay vốn chủ sở hữu', 'vòng', v => v.r(v.f('revenue'), v.a('equity'))],
  ['Đòn bẩy tài chính'],
  ['Nợ ngắn hạn/Nợ phải trả', '%', v => v.p('cur_liab', 'liabilities')],
  ['Nợ vay/Tổng tài sản', '%', v => v.r(v.b('st_debt') + v.b('lt_debt'), v.b('total_assets'), 100)],
  ['Nợ phải trả/Tổng tài sản', '%', v => v.p('liabilities', 'total_assets')],
  ['Vốn chủ sở hữu/Tổng tài sản', '%', v => v.p('equity', 'total_assets')],
  ['Nợ ngắn hạn/Vốn chủ sở hữu', '%', v => v.p('cur_liab', 'equity')],
  ['Nợ vay/Vốn chủ sở hữu', '%', v => v.r(v.b('st_debt') + v.b('lt_debt'), v.b('equity'), 100), true],
  ['Nợ vay ngắn hạn/Nợ vay', '%', v => v.r(v.b('st_debt'), v.b('st_debt') + v.b('lt_debt'), 100), true],
  ['Nợ phải trả/Vốn chủ sở hữu', '%', v => v.p('liabilities', 'equity')],
  ['Dòng tiền'],
  ['CFO/Doanh thu thuần', '%', v => v.r(v.f('cfo'), v.f('revenue'), 100), true],
  ['CFO/Nợ ngắn hạn', '%', v => v.r(v.f('cfo'), v.b('cur_liab'), 100)],
  ['Lưu chuyển tiền thuần/Nợ ngắn hạn', '%', v => v.r(v.f('net_cash_flow'), v.b('cur_liab'), 100)],
  ['CFO/Tổng tài sản', '%', v => v.r(v.f('cfo'), v.b('total_assets'), 100)],
  ['CFO/Vốn chủ sở hữu', '%', v => v.r(v.f('cfo'), v.b('equity'), 100)],
  ['CFO/LN thuần từ HĐKD', '%', v => v.r(v.f('cfo'), v.f('op_profit'), 100)],
  ['CFO/Nợ phải trả', '%', v => v.r(v.f('cfo'), v.b('liabilities'), 100)],
  ['Cơ cấu chi phí (trên doanh thu thuần)'],
  ['Giá vốn hàng bán', '%', v => v.r(v.f('cogs'), v.f('revenue'), 100), true],
  ['Chi phí bán hàng', '%', v => v.r(v.f('selling'), v.f('revenue'), 100), true],
  ['Chi phí quản lý doanh nghiệp', '%', v => v.r(v.f('admin'), v.f('revenue'), 100), true],
  ['Chi phí lãi vay', '%', v => v.r(v.f('interest'), v.f('revenue'), 100), true],
  ['Cơ cấu tài sản ngắn hạn'],
  ['Tài sản ngắn hạn/Tổng tài sản', '%', v => v.p('cur_assets', 'total_assets')],
  ['Tiền/Tài sản ngắn hạn', '%', v => v.p('cash', 'cur_assets')],
  ['Đầu tư tài chính ngắn hạn/TSNH', '%', v => v.p('st_invest', 'cur_assets')],
  ['Phải thu ngắn hạn/TSNH', '%', v => v.p('st_recv_all', 'cur_assets')],
  ['Hàng tồn kho/TSNH', '%', v => v.p('inventory', 'cur_assets'), true],
  ['Tài sản ngắn hạn khác/TSNH', '%', v => v.p('other_ca', 'cur_assets')],
  ['Cơ cấu tài sản dài hạn'],
  ['Tài sản dài hạn/Tổng tài sản', '%', v => v.p('lt_assets', 'total_assets')],
  ['Tài sản cố định/Tổng tài sản', '%', v => v.p('fixed_assets', 'total_assets'), true],
  ['TSCĐ hữu hình/Tài sản cố định', '%', v => v.p('ppe_net', 'fixed_assets')],
  ['TSCĐ vô hình/Tài sản cố định', '%', v => v.p('intangible', 'fixed_assets')],
];
function ratioCtx(t, basis) {
  const P = D.periods, X = D.data[t] || {}, r = (a, b, k = 1) => fin(a) && fin(b) && b !== 0 ? a / b * k : null;
  let fi, bi, bp;  // quý cộng KQKD, số dư cuối kỳ, số dư cùng kỳ năm trước
  if (basis === 'ttm') { bi = P.length - 1; fi = [0, 1, 2, 3].map(k => bi - k); bp = bi - 4; }
  else { fi = [1, 2, 3, 4].map(q => P.indexOf(`${basis}Q${q}`)); bi = P.indexOf(`${basis}Q4`); bp = P.indexOf(`${+basis - 1}Q4`); }
  const bal = (k, i) => i >= 0 ? X[k]?.[i] : null;
  const b = k => bal(k, bi);
  const f = k => { if (basis !== 'ttm' && (k === 'cfo' || k === 'net_cash_flow')) return D.cf_annual?.[t]?.[k]?.[D.years.indexOf(basis)] ?? null;
    const v = fi.map(i => i >= 0 ? X[k]?.[i] : null); return v.every(fin) ? v.reduce((a, c) => a + c, 0) : null; };
  const a = k => { const x = b(k), y = bal(k, bp); return fin(x) && fin(y) ? (x + y) / 2 : null; };
  return {r, b, f, a, d: (x, y) => r(b(x), b(y)), p: (x, y) => r(b(x), b(y), 100)};
}
function s77() {
  const s = section('1.7', 'So sánh tỷ số từng mã', 'Doanh nghiệp nào quay vòng vốn nhanh, ít nợ và giữ được tiền hơn nhóm?');
  const T = D.groups.flatMap(g => D.companies.filter(x => x.group === g.id).map(x => x.ticker));
  const c = card('dm-fin-ratios', 'Bảng tỷ số tài chính theo doanh nghiệp', `Tính lại từ BCTC hợp nhất · cột cuối là trung vị ${T.length} mã`); s.append(c.el);
  const full = D.years.filter(y => [1, 2, 3, 4].every(q => D.periods.includes(`${y}Q${q}`)));
  let basis = full.at(-1), open = false;
  const opts = [...full.slice(-4).reverse().map(y => [y, 'Năm ' + y]), ['ttm', 'TTM ' + qLabel(D.periods.at(-1))]];
  const pick = el('select', 'pf-sel'); pick.innerHTML = opts.map(([k, n]) => `<option value="${k}"${k === basis ? ' selected' : ''}>${n}</option>`).join(''); c.ctl.append(pick);
  pick.addEventListener('change', () => { basis = pick.value; draw(); });
  const med = a => { const v = a.filter(fin).sort((x, y) => x - y); if (!v.length) return null; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
  const fmt = (v, d) => fin(v) ? (v < 0 ? '(' + nf(-v, d) + ')' : nf(v, d)) : '—';
  function draw() {
    const ctx = Object.fromEntries(T.map(t => [t, ratioCtx(t, basis)]));
    const line = row => { const [n, u, fn] = row, vals = T.map(t => { try { return fn(ctx[t]); } catch { return null; } }), m = med(vals), d = u === 'ngày' ? 0 : 2;
      return `<tr><td>${esc(n)}</td><td class="pf-u">${u}</td>${vals.map(v => `<td class="num">${fmt(v, d)}</td>`).join('')}<td class="num pf-med">${fmt(m, d)}</td></tr>`; };
    const table = rows => `<div class="tablewrap pf-ratio" data-no-fold><table><thead><tr><th>Chỉ số</th><th>ĐVT</th>${T.map(t => `<th class="num" style="color:${GC[E.groupOf[t]]}">${t}</th>`).join('')}<th class="num">Trung vị</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    const key = RATIO_ROWS.filter(r => r[3]), all = RATIO_ROWS.filter(r => r.length > 1).length;
    c.host.innerHTML = table(key.map(line).join('')) + `<details class="pf-more"${open ? ' open' : ''}><summary>Xem đủ ${all} tỷ số theo nhóm</summary>${table(RATIO_ROWS.map(row => row.length === 1 ? `<tr class="pf-rg"><td colspan="${T.length + 3}">${esc(row[0])}</td></tr>` : line(row)).join(''))}</details>`;
    c.host.querySelector('.pf-more').addEventListener('toggle', e => { open = e.target.open; });
  }
  if (!document.getElementById('pf-ratio-style')) { const st = el('style'); st.id = 'pf-ratio-style'; st.textContent = '.pf-ratio table{width:100%;border-collapse:collapse;font-size:13.5px}.pf-ratio th,.pf-ratio td{padding:6px 10px;border-bottom:1px solid #EEF0F6;white-space:nowrap}.pf-ratio td:first-child{white-space:normal;min-width:220px}.pf-ratio .num{text-align:right;font-variant-numeric:tabular-nums}.pf-ratio .pf-u{color:#6B7392}.pf-ratio .pf-rg td{padding-top:14px;font:700 12px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#2938A8;border-bottom:1.5px solid #DCE1EE}.pf-ratio .pf-med{font-weight:700;background:#F5F7FC}:root[data-theme=dark] .pf-ratio .pf-med{background:#1b1b1b}.pf-more{margin-top:10px}.pf-more>summary{cursor:pointer;font:600 12.5px Inter,sans-serif;color:#2938A8;padding:6px 2px}'; document.head.append(st); }
  draw();
  foot(c, 'Số âm trong ngoặc. Năm: KQKD cộng 4 quý, LCTT lấy báo cáo năm; vòng quay dùng số dư bình quân đầu – cuối kỳ. TTM: LCTT là tổng 4 quý, trống nếu quý thiếu hoặc lệch số năm. Nợ vay gồm nợ thuê tài chính. VGT là số hợp nhất tập đoàn (gồm HTG), GIL có mảng BĐS KCN');
  return s;
}
function build(pane) {
  if (!pane || root) return; root = pane;
  style();
  pane.append(filterBar(), kpis(), s71(), s72(), s73(), s74(), s75(), s76(), s77(), methods());
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
window.TextileFinance = {build, engine: E, state: S};
})();
