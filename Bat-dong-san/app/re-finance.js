/* BĐS dân cư · tab lớn Tài chính ngành (#mt14, 26/11/2026). Chép từ Dau-khi/app/oil-finance.js, thêm hai thẻ tiền khách trả trước và vốn nằm ở
   quỹ đất từ Bat-dong-san-KCN/app/kcn-finance.js. Số từ window.RE_FIN (BCTC hợp nhất quý, VNDirect finfo; scripts/build_re_financials.py), tổng hợp bằng window.IndustryFin (app/industry-fin.js).
   Nhóm (27/11/2026, theo mô hình kinh doanh): Đại đô thị, quỹ đất lớn (VHM, NVL) · Nhà ở đô thị lớn (KDH, NLG, DXG, AGG) · Đất nền & tỉnh (PDR, DIG, CEO, TCH, NTL) · Cho thuê & môi giới (VRE, DXS). Tỷ số nhóm = tổng tử số ÷ tổng mẫu số. Chỉ mô tả dữ liệu; nguồn hiện dưới mọi chart. */
(() => {
'use strict';
const D = window.RE_FIN;
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
function foot(c, note) {
  c.el.querySelectorAll(':scope > .pw-src, :scope > .pw-src-note').forEach(n => n.remove());
  c.el.append(el('div', 'pw-src', `Nguồn: ${SRC}; tự tính`));
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
const share = (groups, i) => { const tot = groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0); return groups.map(g => fin(g.values[i]) && tot ? g.values[i] / tot * 100 : null); };

/* ---------- Thanh bộ lọc, KPI, xuất dữ liệu ---------- */
function filterBar() {
  const f = el('section', 'pf-filter');
  // Bộ lọc: mỗi dòng một nhãn cố định bên trái; bảng nhóm bên dưới. Nút tải CSV ẩn (25/11/2026, theo yêu cầu người dùng).
  f.innerHTML = `<div class="pf-grid"><span class="pf-lb">Nhóm</span><div class="pf-chips">${D.groups.map(g => `<button type="button" data-g="${g.id}" aria-pressed="${S.groups.includes(g.id)}"><i style="background:${g.color}"></i>${esc(g.label)} <small>${D.companies.filter(c => c.group === g.id).length}</small></button>`).join('')}</div>
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
  // Bảng nhóm (dùng xuyên suốt tab): nhóm · doanh nghiệp · có trong tổng hay không.
  renders.push(() => { const s = sel(), cons = E.consolidation.filter(c => s.includes(c.parent) && s.includes(c.child));
    f.querySelector('.pf-legend').innerHTML = `<table class="pf-gtable"><thead><tr><th>Nhóm doanh nghiệp</th><th>Doanh nghiệp</th><th>Trong tổng</th></tr></thead><tbody>${D.groups.map(g => { const on = S.groups.includes(g.id);
        return `<tr class="${on ? '' : 'off'}"><td><i style="background:${g.color}"></i>${esc(g.label)}</td><td>${D.companies.filter(c => c.group === g.id).map(c => `<button type="button" class="pf-tk" data-tk="${c.ticker}" aria-pressed="${on && !S.off.includes(c.ticker)}" title="${esc(c.note || '')} · bấm để bỏ khỏi / thêm vào rổ">${c.ticker}${c.mixed ? '*' : ''}</button>`).join('')}</td><td>${on ? 'Có' : 'Không'}</td></tr>`; }).join('')}</tbody></table>
      <p class="pf-scope">Rổ đang chọn: <b>${s.length}</b> doanh nghiệp (${s.join(', ') || '—'}) · số tổng hợp từ BCTC hợp nhất; mỗi chart ghi số mã có dữ liệu ở kỳ chốt · không đại diện toàn thị trường BĐS (nhiều chủ đầu tư lớn không niêm yết).</p>
      <p class="pf-note">Bấm mã để bỏ khỏi hoặc thêm vào rổ. Mỗi doanh nghiệp xếp vào mảng có doanh thu lớn nhất; dấu * là doanh nghiệp nhiều mảng kinh doanh, số theo nhóm chỉ mang tính tham khảo. Mẫu doanh nghiệp niêm yết, không đại diện toàn ngành.${cons.length ? ` Loại trùng hợp nhất: ${cons.map(c => `${c.parent} trừ ${c.child}`).join(', ')}.` : ''}</p>`; });
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
    const T = (m, mode = 'ttm', avg) => E.total(m, s, mode, {avg});
    const npat = T('npat'), roe = E.ratio({m: 'npat'}, {m: 'equity', avg: true}, s, 'ttm', 100), rec = T('receivables', 'q'), inv = T('inventory', 'q'), adv = T('adv_customers', 'q'), nd = E.ratio({m: 'net_debt'}, {m: 'ebitda'}, s, 'ttm');
    const tile = (label, val, unit, d, dTxt, cov, vals, sub) => `<div class="kpi pp-kpi"><div class="label l">${esc(label)}</div><div class="value v">${val}${unit ? `<small> ${esc(unit)}</small>` : ''}</div><div class="delta">${dTxt}</div>${spark(vals)}<div class="sub s">${esc(qLabel(D.periods[i]))} · phủ ${cov}/${n} DN${sub ? ' · ' + sub : ''}</div></div>`;
    const ch = (_a, m, mode = 'ttm') => E.growth(m, s, mode).values[i];
    g.innerHTML = [
      tile('LNST TTM nhóm đã chọn', nf(npat.values[i]), 'tỷ đ', null, `${sg(ch(0, 'npat'))}% so cùng kỳ`, npat.cov[i], npat.values),
      tile('ROE TTM', nf(roe.values[i], 1), '%', null, `${sg(fin(roe.values[i]) && fin(roe.values[i - 4]) ? roe.values[i] - roe.values[i - 4] : null)} đ.p. so cùng kỳ`, roe.cov[i], roe.values, 'LNST ÷ VCSH bình quân'),
      tile('Doanh thu TTM', nf(T('revenue').values[i]), 'tỷ đ', null, `${sg(ch(0, 'revenue'))}% so cùng kỳ`, T('revenue').cov[i], T('revenue').values),
      tile('Hàng tồn kho', nf(inv.values[i]), 'tỷ đ', null, `${sg(ch(0, 'inventory', 'q'))}% so cùng kỳ`, inv.cov[i], inv.values, 'quỹ đất, dự án dở dang, căn chưa bàn giao'),
      tile('Người mua trả tiền trước', nf(adv.values[i]), 'tỷ đ', null, `${sg(ch(0, 'adv_customers', 'q'))}% so cùng kỳ`, adv.cov[i], adv.values, 'tiền đã bán, chờ bàn giao'),
      tile('Nợ vay ròng / EBITDA TTM', nf(nd.values[i], 2), 'lần', null, `${sg(fin(nd.values[i]) && fin(nd.values[i - 4]) ? nd.values[i] - nd.values[i - 4] : null, 2)} lần so cùng kỳ`, nd.cov[i], nd.values)
    ].join('');
  });
  return g;
}
// Section: câu hỏi + hàng mini KPI + các card
// Không có hàng ô số nhỏ dưới câu hỏi (quy tắc chung trang Điện, PR #35, 25/11/2026); chỉ giữ hàng KPI đầu sub-tab.
// Mục lục: 6 nhóm Kết quả kinh doanh → Biên lợi nhuận → CAPEX & dở dang → Công nợ & chuyển đổi tiền → Nợ, thanh khoản & FCF → Hiệu quả vốn.
function section(num, title, q) {
  const s = el('section', 'pp-panel pp-q pf-sec'); s.innerHTML = `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(title)}</h3><p class="pf-q">${esc(q)}</p></div></header>`;
  return s;
}
const grid2 = (...cards) => { const g = el('div', 'grid two g2 pf-g2'); cards.forEach(c => g.append(c.el)); return g; };

/* ---------- 1.1 Chu kỳ doanh thu và lợi nhuận ---------- */
const PNL = [['revenue', 'Doanh thu'], ['gross', 'Lợi nhuận gộp'], ['ebitda', 'EBITDA'], ['ebit', 'EBIT'], ['npat', 'LNST']];
function s71() {
  const s = section('1.1', 'Kết quả kinh doanh', 'Lợi nhuận ngành đang dồn vào mô hình nào: đại đô thị, nhà ở đô thị lớn hay đất nền tỉnh?');
  // Chart 1: quy mô theo nhóm
  const c1 = card('re-fin-pnl', 'Doanh thu và lợi nhuận theo nhóm doanh nghiệp (tỷ đồng)', 'Cột chồng theo nhóm doanh nghiệp · đổi chỉ tiêu và cách xem'); let m1 = 'npat', v1 = 'abs';
  seg(c1, 'Chỉ tiêu', PNL, () => m1, k => { m1 = k; draw1(); }); seg(c1, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const b = E.byGroup(m1, sel(), S.mode), name = PNL.find(p => p[0] === m1)[1];
    if (v1 === 'abs') chart(c1.host, 're-fin-pnl-abs', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true});
    else if (v1 === 'yoy') chart(c1.host, 're-fin-pnl-yoy', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: E.growth(m1, sel(), S.mode).groups.find(z => z.id === g.id)?.values || []})), {unit: '%', digits: 1, zeroBase: false});
    else { const tot = b.labels.map((_, i) => b.groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0)), neg = b.labels.map((_, i) => b.groups.some(g => fin(g.values[i]) && g.values[i] < 0));
      chart(c1.host, 're-fin-pnl-share', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values.map((v, i) => fin(v) && tot[i] > 0 && !neg[i] ? v / tot[i] * 100 : null)})), {unit: '%', digits: 1, native: 'stack', stackable: true}); }
    foot(c1, `${name} ${modeName(S.mode)}; EBIT = LN gộp − CP bán hàng − CP QLDN; EBITDA = EBIT + khấu hao (LCTT)${v1 === 'share' ? '; tỷ trọng để trống ở kỳ có nhóm lỗ' : ''}; ${covNote(b.groups.reduce((a, g) => a.map((x, i) => x + g.cov[i]), b.labels.map(() => 0)), sel().length, b.labels.length - 1)}`); }
  renders.push(draw1);
  // Chart "Chu kỳ lợi nhuận theo nhóm doanh nghiệp" bỏ 25/11/2026 (trùng chart doanh thu và lợi nhuận ở trên).
  // Chart thác nước "đóng góp vào thay đổi LNST" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Chart 4: mùa vụ
  const c4 = card('re-fin-season', 'Tính mùa vụ của lợi nhuận theo quý', 'Bảng nhiệt năm × quý · chọn nhóm doanh nghiệp và chỉ tiêu'); let g4 = 'all', m4 = 'npat', v4 = 'abs';
  const gsel = el('select', 'pf-sel'); c4.ctl.append(gsel); gsel.addEventListener('change', () => { g4 = gsel.value; draw4(); });
  seg(c4, 'Chỉ tiêu', [['npat', 'LNST'], ['ebit', 'EBIT']], () => m4, k => { m4 = k; draw4(); }); seg(c4, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng trong năm (%)']], () => v4, k => { v4 = k; draw4(); });
  function draw4() { const s = sel(); gsel.innerHTML = `<option value="all">Tất cả nhóm đang chọn</option>` + D.groups.filter(g => S.groups.includes(g.id)).map(g => `<option value="${g.id}"${g.id === g4 ? ' selected' : ''}>${esc(g.label)}</option>`).join('');
    if (g4 !== 'all' && !S.groups.includes(g4)) g4 = 'all';
    const ts = g4 === 'all' ? s : s.filter(t => E.groupOf[t] === g4), q = E.total(m4, ts, 'q').values, yrs = E.years;
    const cell = (y, k) => q[D.periods.indexOf(`${y}Q${k}`)];
    const yearTot = y => { const v = [1, 2, 3, 4].map(k => cell(y, k)); return v.every(fin) ? v.reduce((a, b) => a + b, 0) : null; };
    const val = (y, k) => { const v = cell(y, k); if (!fin(v)) return null; if (v4 === 'yoy') { const p = cell(+y - 1, k); return fin(p) && p > 0 ? (v / p - 1) * 100 : null; } if (v4 === 'share') { const t = yearTot(y); return fin(t) && t > 0 ? v / t * 100 : null; } return v; };
    const all = yrs.flatMap(y => [1, 2, 3, 4].map(k => val(y, k))).filter(fin), mx = Math.max(...all.map(Math.abs), 1);
    const col = v => !fin(v) ? 'var(--line,#eef0f6)' : v >= 0 ? `rgba(41,56,168,${(.12 + .78 * Math.min(1, v / mx)).toFixed(2)})` : `rgba(201,138,0,${(.15 + .7 * Math.min(1, -v / mx)).toFixed(2)})`;
    c4.host.innerHTML = `<div class="pf-hm"><div class="pf-hm-r pf-hm-h"><span></span>${[1, 2, 3, 4].map(k => `<span>Q${k}</span>`).join('')}<span>Năm</span></div>${yrs.map(y => `<div class="pf-hm-r"><span class="pf-hm-y">${y}</span>${[1, 2, 3, 4].map(k => { const v = val(y, k); return `<span style="background:${col(v)};color:${fin(v) && Math.abs(v) / mx > .5 ? '#fff' : 'inherit'}" title="Q${k}/${y}: ${fin(v) ? nf(v, v4 === 'abs' ? 0 : 1) + (v4 === 'abs' ? ' tỷ đ' : '%') : '—'}">${fin(v) ? nf(v, v4 === 'abs' ? 0 : 1) : ''}</span>`; }).join('')}<span class="pf-hm-t">${v4 === 'abs' ? nf(yearTot(y)) : ''}</span></div>`).join('')}</div>`;
    foot(c4, `${m4 === 'npat' ? 'LNST' : 'EBIT'} quý${v4 === 'abs' ? ', tỷ đồng' : v4 === 'yoy' ? ', % so cùng quý năm trước (kỳ gốc dương)' : ', % LNST cả năm (chỉ năm có tổng dương, đủ 4 quý)'}; màu vàng là số âm`); }
  renders.push(draw4);
  // Chart 5: độ lan tỏa
  const c5 = card('re-fin-breadth', 'Tăng trưởng lợi nhuận lan rộng hay tập trung?', 'Số doanh nghiệp theo thay đổi LNST so cùng kỳ (quý riêng)');
  function draw5() { const s = sel(), pv = E.per('npat', s, 'q'), L = D.periods;
    const cnt = f => L.map((_, i) => i < 4 ? null : s.filter(t => fin(pv[t][i]) && fin(pv[t][i - 4]) && f(pv[t][i], pv[t][i - 4])).length);
    chart(c5.host, 're-fin-breadth', L, [
      {name: 'Tăng (lãi cả hai kỳ)', color: '#2938A8', values: cnt((a, b) => a >= b && a > 0 && b > 0)},
      {name: 'Giảm (lãi cả hai kỳ)', color: '#9AA3BD', values: cnt((a, b) => a < b && a > 0 && b > 0)},
      {name: 'Lỗ sang lãi', color: '#2a9fa3', values: cnt((a, b) => a > 0 && b <= 0)},
      {name: 'Lãi sang lỗ', color: '#c98a00', values: cnt((a, b) => a <= 0 && b > 0)},
      {name: 'Lỗ cả hai kỳ', color: '#3d4653', values: cnt((a, b) => a <= 0 && b <= 0)}], {unit: 'DN', native: 'stack', stackable: true});
    foot(c5, 'LNST quý so cùng quý năm trước; chỉ doanh nghiệp có số cả hai kỳ'); }
  renders.push(draw5);
  s.append(c1.el, grid2(c4, c5));
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
function s72() {
  const s = section('1.2', 'Biên lợi nhuận', 'Biên lợi nhuận đang đổi vì cơ cấu sản phẩm bàn giao, giá bán hay chi phí vốn?');
  // Chart 1: biên theo thời gian
  const c1 = card('re-fin-margin', 'Biên lợi nhuận theo thời gian (%)', 'Biên gộp, EBITDA, EBIT, LNST trên doanh thu · chọn nhóm doanh nghiệp'); let g1 = 'all'; const p1 = groupPicker(c1, () => g1, (v, q) => { g1 = v; if (!q) draw1(); });
  function draw1() { p1(); const x = scopeOf(g1), L = E.labels(S.mode), r = n => E.ratio({m: n}, {m: 'revenue'}, x, S.mode, 100).values;
    chart(c1.host, 're-fin-margin', L, [['gross', 'Biên gộp'], ['ebitda', 'Biên EBITDA'], ['ebit', 'Biên EBIT'], ['npat', 'Biên LNST']].map(([m, n], k) => ({name: n, color: LINE[k], values: r(m)})), {unit: '%', digits: 1, zeroBase: false});
    foot(c1, `tổng lợi nhuận ÷ tổng doanh thu, ${modeName(S.mode)}; cùng tập doanh nghiệp có đủ tử và mẫu`); }
  renders.push(draw1);
  // Chart cầu nối "Từ doanh thu đến lợi nhuận sau thuế" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Chart 3: cơ cấu chi phí trên 100 đồng doanh thu
  const c3 = card('re-fin-cost', 'Cơ cấu chi phí trên 100 đồng doanh thu', 'Theo nhóm doanh nghiệp, kỳ chốt · giá vốn trừ khấu hao, khấu hao, bán hàng & QLDN, lãi vay, thuế, lợi nhuận còn lại');
  function draw3() { const mode = S.mode === 'y' ? 'y' : 'ttm', i = endIdx(mode), x = sel();
    const ms = ['revenue', 'opex_other', 'da', 'sga', 'interest', 'tax', 'npat'], pv = Object.fromEntries(ms.map(m => [m, E.per(m, x, mode)]));
    const gs = D.groups.filter(g => S.groups.includes(g.id)), row = g => { const ts = x.filter(t => E.groupOf[t] === g.id && ms.every(m => fin(pv[m][t][i]))), T = m => ts.reduce((a, t) => a + pv[m][t][i], 0), r = T('revenue'); return r ? ms.slice(1).map(m => T(m) / r * 100) : ms.slice(1).map(() => null); };
    const R = gs.map(row), names = ['Giá vốn trừ khấu hao', 'Khấu hao', 'Bán hàng & QLDN', 'Lãi vay', 'Thuế TNDN', 'LNST'], cols = ['#9AA3BD', '#3d4653', '#8997D6', '#c98a00', '#861C52', '#2938A8'];
    const m = {key: 're-fin-cost', categories: gs.map(g => g.label), series: names.map((n, k) => ({name: n, color: cols[k], values: R.map(r => fin(r[k]) ? Math.round(r[k] * 10) / 10 : null)})), unit: 'đồng', digits: 1, stackable: true, native: 'stack', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c3.host, m, () => { c3.host.innerHTML = ChartTypes.render(m, 'stack'); });
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; khoản còn lại (thu nhập tài chính, liên kết, khác, chi phí tài chính ngoài lãi vay) không vẽ nên tổng có thể khác 100; chưa tách chi phí nhiên liệu`); }
  renders.push(draw3);
  // Chart "Khấu hao và chi phí tài trợ so với doanh thu, EBITDA" bỏ 25/11/2026 theo yêu cầu người dùng.
  s.append(grid2(c1, c3));
  return s;
}

/* ---------- 1.3 CAPEX và hình thành tài sản ---------- */
function s73() {
  const s = section('1.3', 'CAPEX & dở dang', 'Doanh nghiệp đang đổ tiền vào tài sản cố định ở đâu? (quỹ đất và dự án nằm ở hàng tồn kho, xem 1.4)');
  // Chart 1: CAPEX theo nhóm
  const c1 = card('re-fin-capex', 'CAPEX theo nhóm doanh nghiệp (tỷ đồng)', 'Tiền chi mua sắm, xây dựng TSCĐ (LCTT) · quy mô, so cùng kỳ, tỷ trọng'); let v1 = 'abs';
  seg(c1, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const b = E.byGroup('capex', sel(), S.mode), tot = b.labels.map((_, i) => b.groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0));
    chart(c1.host, 're-fin-capex-' + v1, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v1 === 'abs' ? g.values : v1 === 'yoy' ? (E.growth('capex', sel(), S.mode).groups.find(z => z.id === g.id)?.values || []) : g.values.map((v, i) => fin(v) && tot[i] ? v / tot[i] * 100 : null)})), {unit: v1 === 'abs' ? 'tỷ đ' : '%', digits: v1 === 'abs' ? 0 : 1, native: v1 === 'yoy' ? 'line' : 'stack', stackable: v1 !== 'yoy', zeroBase: v1 !== 'yoy'});
    foot(c1, `CAPEX tiền mặt ${modeName(S.mode)}; không gồm tăng tài sản do M&A, lãi vay vốn hóa chưa tách; LCTT quý dùng từ năm khớp số năm`); }
  renders.push(draw1);
  // Chart 2: cường độ đầu tư
  const c2 = card('re-fin-intensity', 'Cường độ đầu tư', 'CAPEX/khấu hao (đường 1 lần), CAPEX/doanh thu, CAPEX/tổng tài sản bình quân, CAPEX/CFO'); let g2 = 'all'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  function draw2() { p2(); const x = scopeOf(g2), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), R = (a, b, avg, sc = 1) => E.ratio({m: a}, {m: b, avg}, x, mode, sc).values;
    chart(c2.host, 're-fin-intensity', L, [{name: 'CAPEX/khấu hao (lần)', color: LINE[0], values: R('capex', 'da')}, {name: 'Mốc 1 lần', color: '#9AA3BD', values: L.map(() => 1)}, {name: 'CAPEX/doanh thu (lần)', color: LINE[2], values: R('capex', 'revenue')}, {name: 'CAPEX/tổng tài sản bình quân (lần)', color: LINE[1], values: R('capex', 'total_assets', true)}, {name: 'CAPEX/CFO (lần)', color: LINE[3], values: R('capex', 'cfo')}], {unit: 'lần', digits: 2});
    foot(c2, `${mode === 'y' ? 'năm' : 'TTM'}; CAPEX vượt khấu hao không đồng nghĩa toàn bộ là đầu tư mở rộng`); }
  renders.push(draw2);
  // Chart 3: XDCB dở dang
  const c3 = card('re-fin-cip', 'XDCB dở dang theo nhóm doanh nghiệp', 'Vốn đã đầu tư nhưng tài sản chưa hoàn thành · giá trị, so cùng kỳ, so tổng tài sản, so TSCĐ hữu hình ròng'); let v3 = 'abs';
  seg(c3, 'Cách xem', [['abs', 'Tỷ đồng'], ['yoy', 'So cùng kỳ (%)'], ['ta', '% tổng tài sản'], ['ppe', '% TSCĐ ròng']], () => v3, k => { v3 = k; draw3(); });
  function draw3() { const mode = S.mode === 'y' ? 'y' : 'q', b = E.byGroup('cip', sel(), mode);
    if (v3 === 'abs' || v3 === 'yoy') chart(c3.host, 're-fin-cip-' + v3, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v3 === 'abs' ? g.values : (E.growth('cip', sel(), mode).groups.find(z => z.id === g.id)?.values || [])})), {unit: v3 === 'abs' ? 'tỷ đ' : '%', digits: v3 === 'abs' ? 0 : 1, native: v3 === 'abs' ? 'stack' : 'line', stackable: v3 === 'abs', zeroBase: v3 === 'abs'});
    else chart(c3.host, 're-fin-cip-' + v3, b.labels, D.groups.filter(g => S.groups.includes(g.id)).map(g => ({name: g.label, color: g.color, values: E.ratio({m: 'cip'}, {m: v3 === 'ta' ? 'total_assets' : 'ppe_net'}, scopeOf(g.id), mode, 100).values})), {unit: '%', digits: 1});
    foot(c3, `số dư cuối ${mode === 'y' ? 'năm' : 'quý'}`); }
  renders.push(draw3);
  // Chart "Hình thành tài sản: XDCB dở dang, TSCĐ và khấu hao" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Chart 5: tài trợ CAPEX
  const c5 = card('re-fin-funding', 'CAPEX được tài trợ bằng nguồn nào? (tỷ đồng)', 'CFO, CAPEX, FCF, vay nợ ròng, vốn góp bằng tiền, cổ tức đã trả · và CFO/CAPEX');
  function draw5() { const x = sel(), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), T = m => E.total(m, x, mode).values, cr = E.ratio({m: 'cfo'}, {m: 'capex'}, x, mode).values;
    chart(c5.host, 're-fin-funding', L, [{name: 'CFO', color: LINE[0], values: T('cfo')}, {name: 'CAPEX', color: LINE[2], values: T('capex').map(v => fin(v) ? -v : null)}, {name: 'FCF', color: LINE[1], values: T('fcf')}, {name: 'Vay nợ ròng', color: LINE[3], values: T('net_borrow')}, {name: 'Vốn góp bằng tiền', color: LINE[5], values: T('equity_raised')}, {name: 'Cổ tức đã trả', color: LINE[4], values: T('dividends').map(v => fin(v) ? -v : null)}], {unit: 'tỷ đ', native: 'bar'});
    foot(c5, `${mode === 'y' ? 'năm' : 'TTM'}; FCF = CFO − CAPEX tiền mặt; CAPEX và cổ tức vẽ số âm (tiền ra); không phải toàn bộ biến động tiền (còn đầu tư tài chính, tỷ giá…)`); }
  renders.push(draw5);
  // Chart "Mức hao mòn kế toán của nền tài sản" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Chart "Vốn mới đang vào đâu so với nơi tạo lợi nhuận và dòng tiền?" bỏ 25/11/2026 theo yêu cầu người dùng.
  s.append(grid2(c1, c2), grid2(c3, c5));
  return s;
}

/* ---------- 1.4 Phải thu và chất lượng dòng tiền ---------- */
function s74() {
  const s = section('1.4', 'Công nợ & chuyển đổi tiền', 'Lợi nhuận ghi nhận có chuyển thành tiền, hay đang nằm ở công nợ và hàng tồn kho dự án?');
  const c1 = card('re-fin-recv', 'Phải thu khách hàng theo nhóm doanh nghiệp (tỷ đồng)', 'Số dư cuối kỳ · giá trị hoặc so cùng kỳ'); let v1 = 'abs';
  seg(c1, 'Cách xem', [['abs', 'Tỷ đồng'], ['yoy', 'So cùng kỳ (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const mode = S.mode === 'y' ? 'y' : 'q', b = E.byGroup('receivables', sel(), mode);
    chart(c1.host, 're-fin-recv-' + v1, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v1 === 'abs' ? g.values : (E.growth('receivables', sel(), mode).groups.find(z => z.id === g.id)?.values || [])})), {unit: v1 === 'abs' ? 'tỷ đ' : '%', digits: v1 === 'abs' ? 0 : 1, native: v1 === 'abs' ? 'stack' : 'line', stackable: v1 === 'abs', zeroBase: v1 === 'abs'});
    foot(c1, 'phải thu khách hàng ngắn hạn'); }
  renders.push(draw1);
  const c2 = card('re-fin-dso', 'Số ngày thu tiền bình quân (DSO) theo nhóm doanh nghiệp (ngày)', 'Phải thu khách hàng bình quân ÷ doanh thu TTM × 365');
  function draw2() { const mode = S.mode === 'y' ? 'y' : 'ttm', L = E.labels(mode);
    chart(c2.host, 're-fin-dso', L, D.groups.filter(g => S.groups.includes(g.id)).map(g => ({name: g.label, color: g.color, values: E.ratio({m: 'receivables', avg: true}, {m: 'revenue'}, scopeOf(g.id), mode, 365).values})), {unit: 'ngày'});
    foot(c2, 'DSO của toàn doanh nghiệp'); }
  renders.push(draw2);
  const c3 = card('re-fin-conversion', 'Lợi nhuận chuyển thành tiền đến đâu?', 'CFO/EBITDA, CFO/LNST (lần) và biên CFO (%) · chọn nhóm doanh nghiệp'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), R = (a, b, sc = 1) => E.ratio({m: a}, {m: b}, x, mode, sc).values;
    chart(c3.host, 're-fin-conversion', L, [{name: 'CFO/EBITDA (lần)', color: LINE[0], values: R('cfo', 'ebitda')}, {name: 'CFO/LNST (lần)', color: LINE[2], values: R('cfo', 'npat')}, {name: 'Biên CFO (%) ÷ 100', color: LINE[1], values: R('cfo', 'revenue')}], {unit: 'lần', digits: 2});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; biên CFO vẽ dạng tỷ lệ (0,2 = 20%)`); }
  renders.push(draw3);
  const c4 = card('re-fin-advance', 'Tiền khách trả trước và doanh thu chưa thực hiện (tỷ đồng)', 'Số dư cuối kỳ của mẫu đang chọn · phải thu, người mua trả tiền trước, doanh thu chưa thực hiện ngắn hạn, dài hạn');
  function draw4() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'q', L = E.labels(mode), T = m => E.total(m, x, mode).values;
    chart(c4.host, 're-fin-advance', L, [['receivables', 'Phải thu khách hàng', LINE[4]], ['adv_customers', 'Người mua trả tiền trước', LINE[2]], ['unearned_st', 'Doanh thu chưa thực hiện ngắn hạn', LINE[1]], ['unearned_lt', 'Doanh thu chưa thực hiện dài hạn', LINE[0]]].map(([k, n, c]) => ({name: n, color: c, values: T(k)})), {unit: 'tỷ đ', native: 'line'});
    foot(c4, `số dư cuối ${mode === 'y' ? 'năm' : 'quý'}. Người mua trả tiền trước: tiền đã thu, chờ bàn giao; đây là doanh số đã thu tiền nhưng chưa bàn giao, báo trước doanh thu 1–3 năm tới. Doanh thu chưa thực hiện chủ yếu là tiền thuê VRE nhận trước`); }
  renders.push(draw4);
  const c5 = card('re-fin-landcap', 'Vốn đang nằm ở quỹ đất và dự án (tỷ đồng)', 'Số dư cuối kỳ của mẫu đang chọn · hàng tồn kho, chi phí dở dang dài hạn, XDCB dở dang, bất động sản đầu tư');
  function draw5() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'q', L = E.labels(mode), T = m => E.total(m, x, mode).values;
    chart(c5.host, 're-fin-landcap', L, [['inventory', 'Hàng tồn kho', LINE[2]], ['wip_lt', 'Chi phí SXKD dở dang dài hạn', LINE[3]], ['cip', 'XDCB dở dang', LINE[4]], ['inv_property', 'Bất động sản đầu tư', LINE[0]]].map(([k, n, c]) => ({name: n, color: c, values: T(k)})), {unit: 'tỷ đ', native: 'stack', stackable: true, zeroBase: true});
    foot(c5, 'số dư; khi giải thích CFO, phần tăng hàng tồn kho là tiền đã chi cho quỹ đất, tiền sử dụng đất và xây dựng dự án để bán. Bất động sản đầu tư chủ yếu là trung tâm thương mại VRE. Doanh nghiệp không tách theo dự án'); }
  renders.push(draw5);
  // Chart "Vốn lưu động và áp lực tài trợ" và bảng "Phải thu và chuyển hóa dòng tiền theo doanh nghiệp" bỏ 25/11/2026 theo yêu cầu người dùng.
  s.append(grid2(c1, c2), c3.el, grid2(c4, c5));
  return s;
}

/* ---------- 1.5 Đòn bẩy và phân bổ dòng tiền ---------- */
function s75() {
  const s = section('1.5', 'Nợ, thanh khoản & FCF', 'Chu kỳ đầu tư đang tạo áp lực tài chính hay doanh nghiệp đang thu hoạch dòng tiền?');
  const c1 = card('re-fin-debt', 'Cơ cấu nợ vay (tỷ đồng)', 'Nợ vay ngắn hạn, dài hạn (cột chồng); tiền & đầu tư ngắn hạn, nợ vay ròng (đường)');
  function draw1() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'q', L = E.labels(mode), T = m => E.total(m, x, mode).values;
    chart(c1.host, 're-fin-debt', L, [{name: 'Nợ vay ngắn hạn', color: '#8997D6', values: T('st_debt')}, {name: 'Nợ vay dài hạn', color: '#1D2678', values: T('lt_debt')}, {name: 'Tiền & đầu tư ngắn hạn', color: '#2a9fa3', values: T('cash_all'), kind: 'line'}, {name: 'Nợ vay ròng', color: '#c98a00', values: T('net_debt'), kind: 'line'}], {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c1, 'nợ vay chịu lãi (vay và nợ thuê tài chính), không phải tổng nợ phải trả; nợ vay ròng = nợ vay − tiền − đầu tư tài chính ngắn hạn'); }
  renders.push(draw1);
  const c2 = card('re-fin-leverage', 'Đòn bẩy tài chính', 'Nợ vay/VCSH, nợ vay ròng/EBITDA TTM, nợ vay/tổng tài sản, nợ ngắn hạn/tổng nợ vay'); let g2 = 'all'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  function draw2() { p2(); const x = scopeOf(g2), L = D.periods, R = (a, b, md = 'q') => E.ratio({m: a}, {m: b}, x, md).values;
    chart(c2.host, 're-fin-leverage', L, [{name: 'Nợ vay/VCSH', color: LINE[0], values: R('debt', 'equity')}, {name: 'Nợ vay ròng/EBITDA TTM', color: LINE[2], values: E.ratio({m: 'net_debt'}, {m: 'ebitda'}, x, 'ttm').values}, {name: 'Nợ vay/tổng tài sản', color: LINE[1], values: R('debt', 'total_assets')}, {name: 'Nợ ngắn hạn/tổng nợ vay', color: LINE[3], values: R('st_debt', 'debt')}], {unit: 'lần', digits: 2});
    foot(c2, 'hệ số tính từ tổng; doanh nghiệp EBITDA âm hoặc VCSH âm vẫn nằm trong tổng, xem phân bố ở biểu đồ dưới'); }
  renders.push(draw2);
  const c3 = card('re-fin-interest', 'Chi phí vay và khả năng trả lãi', 'Chi phí lãi vay TTM (tỷ đ), lãi vay/nợ vay bình quân (%), EBIT và EBITDA trên lãi vay (lần)'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    chart(c3.host, 're-fin-interest', L, [{name: 'Lãi vay/nợ vay bình quân (%)', color: LINE[3], values: E.ratio({m: 'interest'}, {m: 'debt', avg: true}, x, mode, 100).values}, {name: 'EBIT/lãi vay (lần)', color: LINE[0], values: E.ratio({m: 'ebit'}, {m: 'interest'}, x, mode).values}, {name: 'EBITDA/lãi vay (lần)', color: LINE[1], values: E.ratio({m: 'ebitda'}, {m: 'interest'}, x, mode).values}], {unit: '', digits: 1});
    foot(c3, 'lãi vay/nợ vay bình quân là chi phí vay ghi nhận ước tính, không phải lãi suất hợp đồng; chưa tách lãi vay vốn hóa'); }
  renders.push(draw3);
  const c4 = card('re-fin-fcf', 'Dòng tiền tự do và phân phối cho cổ đông', 'Theo nhóm doanh nghiệp, kỳ chốt: CFO, CAPEX, FCF, cổ tức đã trả, vay nợ ròng (tỷ đ)');
  function draw4() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'ttm', i = endIdx(mode), gs = D.groups.filter(g => S.groups.includes(g.id));
    const v = (m, g) => { const b = E.byGroup(m, x, mode).groups.find(z => z.id === g.id); return b && fin(b.values[i]) ? Math.round(b.values[i]) : null; };
    const ms = [['cfo', 'CFO', LINE[0], 1], ['capex', 'CAPEX', LINE[2], -1], ['fcf', 'FCF', LINE[1], 1], ['dividends', 'Cổ tức đã trả', LINE[4], -1], ['net_borrow', 'Vay nợ ròng', LINE[3], 1]];
    const m = {key: 're-fin-fcf', categories: gs.map(g => g.label), series: ms.map(([k, n, c, sgn]) => ({name: n, color: c, values: gs.map(g => { const a = v(k, g); return fin(a) ? a * sgn : null; })})), unit: 'tỷ đ', digits: 0, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c4.host, m, () => { c4.host.innerHTML = ChartTypes.render(m, 'bar'); });
    foot(c4, `${mode === 'y' ? 'năm' : 'TTM'} ${qLabel(E.labels(mode)[i] || '')}; CAPEX và cổ tức vẽ số âm (tiền ra)`); }
  renders.push(draw4);
  const c5 = card('re-fin-levdist', 'Phân bố doanh nghiệp theo mức đòn bẩy', 'Số doanh nghiệp theo nợ vay ròng/EBITDA TTM');
  function draw5() { const x = sel(), L = D.periods, nd = E.per('net_debt', x, 'q'), eb = E.per('ebitda', x, 'ttm');
    const cnt = f => L.map((_, i) => { const ts = x.filter(t => fin(nd[t][i]) && fin(eb[t][i])); return ts.length ? ts.filter(t => f(nd[t][i], eb[t][i])).length : null; });
    chart(c5.host, 're-fin-levdist', L, [{name: 'Tiền ròng', color: '#2a9fa3', values: cnt(n => n <= 0)}, {name: '0–2 lần', color: '#8997D6', values: cnt((n, e) => n > 0 && e > 0 && n / e <= 2)}, {name: '2–4 lần', color: '#2938A8', values: cnt((n, e) => n > 0 && e > 0 && n / e > 2 && n / e <= 4)}, {name: 'Trên 4 lần', color: '#1D2678', values: cnt((n, e) => n > 0 && e > 0 && n / e > 4)}, {name: 'EBITDA không dương', color: '#c98a00', values: cnt((n, e) => n > 0 && e <= 0)}], {unit: 'DN', native: 'stack', stackable: true});
    foot(c5, 'công cụ xem mức độ tập trung, không phải xếp hạng tín dụng'); }
  renders.push(draw5);
  s.append(grid2(c1, c2), grid2(c3, c4), c5.el);
  return s;
}

/* ---------- 1.6 Hiệu quả sử dụng vốn ---------- */
// NOPAT = EBIT × (1 − thuế suất hiệu dụng); thuế suất hiệu dụng = thuế TNDN ÷ LNTT cùng kỳ, giới hạn 0–30%.
function roic(x, mode) {
  const L = E.labels(mode), e = E.per('ebit', x, mode), tx = E.per('tax', x, mode), pb = E.per('pbt', x, mode), ic = E.per('ic', x, mode, true);
  const nop = t => L.map((_, i) => { if (!fin(e[t][i]) || !fin(tx[t][i]) || !fin(pb[t][i])) return null; const r = pb[t][i] > 0 ? Math.min(.3, Math.max(0, tx[t][i] / pb[t][i])) : 0; return e[t][i] * (1 - r); });
  const N = Object.fromEntries(x.map(t => [t, nop(t)]));
  const values = L.map((_, i) => { const ts = x.filter(t => fin(N[t][i]) && fin(ic[t][i])); const d = ts.reduce((a, t) => a + ic[t][i], 0); return ts.length && d > 0 ? ts.reduce((a, t) => a + N[t][i], 0) / d * 100 : null; });
  const each = Object.fromEntries(x.map(t => [t, L.map((_, i) => fin(N[t][i]) && fin(ic[t][i]) && ic[t][i] > 0 ? N[t][i] / ic[t][i] * 100 : null)]));
  return {labels: L, values, each, ic};
}
function s76() {
  const s = section('1.6', 'Hiệu quả vốn', 'Vốn bỏ vào từng nhóm doanh nghiệp đang sinh lời thế nào?');
  const c1 = card('re-fin-returns', 'ROE, ROA, ROIC (%)', 'TTM hoặc năm · chọn nhóm doanh nghiệp · đường mảnh là bình quân lịch sử của chính chỉ tiêu'); let g1 = 'all'; const p1 = groupPicker(c1, () => g1, (v, q) => { g1 = v; if (!q) draw1(); });
  function draw1() { p1(); const x = scopeOf(g1), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), roe = E.ratio({m: 'npat'}, {m: 'equity', avg: true}, x, mode, 100).values, roa = E.ratio({m: 'npat'}, {m: 'total_assets', avg: true}, x, mode, 100).values, ri = roic(x, mode).values;
    const avg = v => { const a = v.filter(fin); return a.length ? a.reduce((s, z) => s + z, 0) / a.length : null; };
    chart(c1.host, 're-fin-returns', L, [{name: 'ROE', color: LINE[0], values: roe}, {name: 'ROA', color: LINE[1], values: roa}, {name: 'ROIC', color: LINE[2], values: ri}, {name: 'ROE bình quân', color: '#9AA3BD', values: L.map(() => avg(roe))}, {name: 'ROIC bình quân', color: '#e3c98a', values: L.map(() => avg(ri))}], {unit: '%', digits: 1, zeroBase: false});
    foot(c1, 'ROE = LNST hợp nhất ÷ VCSH (gồm lợi ích CĐKKS) bình quân; ROIC = EBIT × (1 − thuế suất hiệu dụng, tối đa 30%) ÷ (VCSH + nợ vay − tiền − đầu tư ngắn hạn) bình quân'); }
  renders.push(draw1);
  const c2 = card('re-fin-dupont', 'Phân rã ROE (DuPont)', 'Biên LNST × vòng quay tài sản × đòn bẩy (tổng tài sản/VCSH) · chọn nhóm doanh nghiệp'); let g2 = 'all'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  function draw2() { p2(); const x = scopeOf(g2), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    // Cùng tập doanh nghiệp có đủ LNST, doanh thu, tài sản bình quân, VCSH bình quân
    const n = E.per('npat', x, mode), r = E.per('revenue', x, mode), a = E.per('total_assets', x, mode, true), q = E.per('equity', x, mode, true);
    const parts = L.map((_, i) => { const ts = x.filter(t => [n, r, a, q].every(z => fin(z[t][i]))); if (!ts.length) return null; const S2 = z => ts.reduce((s, t) => s + z[t][i], 0), N = S2(n), R = S2(r), A = S2(a), Qv = S2(q); return R && A && Qv ? {m: N / R * 100, t: R / A, l: A / Qv, roe: N / Qv * 100} : null; });
    chart(c2.host, 're-fin-dupont', L, [{name: 'ROE (%)', color: LINE[0], values: parts.map(p => p?.roe ?? null)}, {name: 'Biên LNST (%)', color: LINE[2], values: parts.map(p => p?.m ?? null)}, {name: 'Vòng quay tài sản (lần)', color: LINE[1], values: parts.map(p => p?.t ?? null)}, {name: 'Đòn bẩy (lần)', color: LINE[3], values: parts.map(p => p?.l ?? null)}], {unit: '', digits: 2, zeroBase: false});
    foot(c2, 'ROE = biên × vòng quay × đòn bẩy, cùng tập doanh nghiệp, tài sản và VCSH bình quân'); }
  renders.push(draw2);
  const c3 = card('re-fin-roic-cycle', 'ROIC và chu kỳ vốn', 'ROIC (%), CAPEX/khấu hao (lần), XDCB dở dang/tổng tài sản (%) · chọn nhóm doanh nghiệp'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    const cipTa = mode === 'y' ? E.ratio({m: 'cip'}, {m: 'total_assets'}, x, 'y', 100).values : E.ratio({m: 'cip'}, {m: 'total_assets'}, x, 'q', 100).values;
    chart(c3.host, 're-fin-roic-cycle', L, [{name: 'ROIC (%)', color: LINE[0], values: roic(x, mode).values}, {name: 'CAPEX/khấu hao (lần)', color: LINE[2], values: E.ratio({m: 'capex'}, {m: 'da'}, x, mode).values}, {name: 'XDCB dở dang/tổng tài sản (%)', color: LINE[1], values: cipTa}], {unit: '', digits: 1});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; đặt cạnh nhau để phân biệt ROIC thấp do vận hành với ROIC thấp khi dự án đang xây`); }
  renders.push(draw3);
  const c4 = card('re-fin-map', 'Bản đồ hiệu quả vốn', 'Mỗi bong bóng một doanh nghiệp, màu theo nhóm · trục ngang: nợ vay ròng/EBITDA TTM · trục dọc: ROIC TTM · kích thước: vốn đầu tư'); const v4 = 'firm';  // 27/11/2026: chỉ vẽ từng doanh nghiệp; bong bóng gộp nhóm làm lệch (một mã lớn so với phần còn lại)
  function draw4() { const x = sel(), i = S.end, ri = roic(x, 'ttm'), ndp = E.per('net_debt', x, 'q'), ebp = E.per('ebitda', x, 'ttm'), icp = E.per('ic', x, 'q');
    let pts;
    if (v4 === 'firm') pts = x.map(t => ({l: t, c: GC[E.groupOf[t]], x: fin(ndp[t][i]) && fin(ebp[t][i]) && ebp[t][i] > 0 ? ndp[t][i] / ebp[t][i] : null, y: ri.each[t][i], s: icp[t][i]})).filter(p => fin(p.x) && fin(p.y) && fin(p.s) && p.s > 0);
    else pts = D.groups.filter(g => S.groups.includes(g.id)).map(g => { const ts = x.filter(t => E.groupOf[t] === g.id); const r = roic(ts, 'ttm').values[i], nd = E.ratio({m: 'net_debt'}, {m: 'ebitda'}, ts, 'ttm').values[i], ic = E.total('ic', ts, 'q').values[i]; return {l: g.label, c: g.color, x: nd, y: r, s: ic}; }).filter(p => fin(p.x) && fin(p.y) && fin(p.s) && p.s > 0);
    c4.host.innerHTML = bubble(pts);
    foot(c4, `${qLabel(D.periods[i])}; doanh nghiệp EBITDA âm không vẽ`); }
  renders.push(draw4);
  const c5 = card('re-fin-pool', 'Vốn đầu tư so với lợi nhuận tạo ra', 'Tỷ trọng từng nhóm trong vốn đầu tư và trong EBIT TTM · kỳ chốt');
  function draw5() { const x = sel(), i = S.end, gs = D.groups.filter(g => S.groups.includes(g.id)), ic = E.byGroup('ic', x, 'q').groups, eb = E.byGroup('ebit', x, 'ttm').groups;
    const sh = arr => { const v = gs.map(g => { const z = arr.find(a => a.id === g.id); return z && fin(z.values[i]) ? z.values[i] : null; }); const tot = v.reduce((a, b) => a + (fin(b) && b > 0 ? b : 0), 0); return v.map(z => fin(z) && tot ? z / tot * 100 : null); };
    const a = sh(ic), b = sh(eb);
    const m = {key: 're-fin-pool', categories: gs.map(g => g.label), series: [{name: 'Tỷ trọng vốn đầu tư', color: '#9AA3BD', values: a.map(v => fin(v) ? Math.round(v * 10) / 10 : null)}, {name: 'Tỷ trọng EBIT TTM', color: '#1D2678', values: b.map(v => fin(v) ? Math.round(v * 10) / 10 : null)}], unit: '%', digits: 1, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c5.host, m, () => { c5.host.innerHTML = ChartTypes.render(m, 'bar'); });
    foot(c5, `${qLabel(D.periods[i])}; vốn đầu tư = VCSH + nợ vay − tiền − đầu tư ngắn hạn (số dư)`); }
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
  return `<svg class="pf-bubble" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bản đồ hiệu quả vốn">
    ${ty.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${nf(v, 0)}%</text>`).join('')}
    ${tx.map(v => `<text x="${X(v)}" y="${H - 12}" text-anchor="middle">${nf(v, 1)}x</text>`).join('')}
    ${x0 < 0 ? `<line x1="${X(0)}" x2="${X(0)}" y1="${m.t}" y2="${H - m.b}" class="z"/>` : ''}${y0 < 0 ? `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}" class="z"/>` : ''}
    ${pts.sort((a, b) => b.s - a.s).map(p => `<g><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${R(p.s)}" fill="${p.c}" fill-opacity=".55" stroke="${p.c}"><title>${esc(p.l)}: ROIC ${nf(p.y, 1)}%, nợ vay ròng/EBITDA ${nf(p.x, 2)} lần, vốn đầu tư ${nf(p.s)} tỷ đ</title></circle><text x="${X(p.x)}" y="${Y(p.y) + 4}" text-anchor="middle" class="l">${esc(p.l)}</text></g>`).join('')}</svg>`;
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
      const mode = E.kind[m] === 'stock' ? (S.mode === 'y' ? 'y' : 'q') : S.mode, b = E.byGroup(m, x, mode);
      b.groups.forEach(g => b.labels.forEach((p, i) => { if (g.values[i] != null) rows.push([g.label, p, mode, m, ITEMN[m], Math.round(g.values[i] * 100) / 100, 'tỷ đồng', g.cov[i], g.tickers.length, D.source, 'tổng doanh nghiệp đủ số; loại trùng công ty mẹ − con khi cùng được chọn']); })); });
    return download(`dau-khi-tai-chinh-nhom-${S.mode}-${stamp}.csv`, rows); }
  if (kind === 'ratio') { const rows = [['scope', 'period', 'period_type', 'ratio', 'value', 'unit', 'companies_with_data', 'median', 'p25', 'p75', 'formula']];
    const mode = S.mode === 'q' ? 'ttm' : S.mode, defs = [['ROE', {m: 'npat'}, {m: 'equity', avg: true}, 100, '%', 'LNST ÷ VCSH bình quân'], ['ROA', {m: 'npat'}, {m: 'total_assets', avg: true}, 100, '%', 'LNST ÷ tổng tài sản bình quân'], ['Biên gộp', {m: 'gross'}, {m: 'revenue'}, 100, '%', 'LN gộp ÷ doanh thu'], ['Biên EBITDA', {m: 'ebitda'}, {m: 'revenue'}, 100, '%', 'EBITDA ÷ doanh thu'], ['Biên EBIT', {m: 'ebit'}, {m: 'revenue'}, 100, '%', 'EBIT ÷ doanh thu'], ['Biên LNST', {m: 'npat'}, {m: 'revenue'}, 100, '%', 'LNST ÷ doanh thu'], ['Nợ vay ròng/EBITDA', {m: 'net_debt'}, {m: 'ebitda'}, 1, 'lần', 'nợ vay ròng cuối kỳ ÷ EBITDA'], ['CAPEX/khấu hao', {m: 'capex'}, {m: 'da'}, 1, 'lần', 'CAPEX ÷ khấu hao'], ['CFO/EBITDA', {m: 'cfo'}, {m: 'ebitda'}, 1, 'lần', 'CFO ÷ EBITDA'], ['DSO', {m: 'receivables', avg: true}, {m: 'revenue'}, 365, 'ngày', 'phải thu KH bình quân ÷ doanh thu × 365']];
    [['all', 'Nhóm đang chọn', x], ...D.groups.filter(g => S.groups.includes(g.id)).map(g => [g.id, g.label, scopeOf(g.id)])].forEach(([, name, ts]) => defs.forEach(([n, a, b, sc, u, f]) => { const r = E.ratio(a, b, ts, mode, sc); r.labels.forEach((p, i) => { if (r.values[i] != null) rows.push([name, p, mode, n, Math.round(r.values[i] * 1000) / 1000, u, r.cov[i], r.dist[i].med, r.dist[i].p25, r.dist[i].p75, f]); }); }));
    return download(`dau-khi-tai-chinh-he-so-${mode}-${stamp}.csv`, rows); }
  const rows = [['ticker', 'subsector', 'in_default_universe', 'note', 'consolidated_into', 'since']];
  D.companies.forEach(c => { const g = D.groups.find(z => z.id === c.group); const p = (D.consolidation || []).find(z => z.child === c.ticker); rows.push([c.ticker, g?.label, g?.default ? 'có' : 'không', c.note || '', p?.parent || '', p?.since || '']); });
  rows.push([], ['methodology']); ['Tổng tuyệt đối = tổng doanh nghiệp có số; hệ số = tổng tử ÷ tổng mẫu cùng tập doanh nghiệp.', 'TTM = tổng 4 quý liền; năm: KQKD = tổng 4 quý, LCTT = số báo cáo năm; số dư dùng cuối kỳ, bình quân = (cuối kỳ + cùng kỳ năm trước)/2.', 'EBIT = LN gộp − CP bán hàng − CP QLDN; EBITDA = EBIT + khấu hao (LCTT); CAPEX = tiền chi mua sắm, xây dựng TSCĐ; FCF = CFO − CAPEX.', 'LCTT quý dùng cho năm có tổng 4 quý khớp số năm (lệch ≤ 5%); năm lệch để trống.', 'Loại trùng hợp nhất: khi công ty mẹ và con cùng được chọn, công ty mẹ dùng số (mẹ − con).'].forEach(t => rows.push([t]));
  download(`dau-khi-tai-chinh-universe-${stamp}.csv`, rows);
}

/* ---------- Dựng ---------- */
function methods() {
  const d = el('details', 'card pf-method'); d.dataset.blockId = 're-fin-method'; d.dataset.updateKind = 'public'; d.dataset.cadence = 'quarterly'; d.dataset.refreshStatus = 'snapshot';
  d.innerHTML = `<summary><b>Phương pháp & tải dữ liệu</b> <small>BCTC hợp nhất · ${D.companies.length} doanh nghiệp · ${qLabel(D.periods[0])} – ${qLabel(D.periods.at(-1))}</small></summary>
    <ul class="pp-ul"><li>Tổng tuyệt đối = tổng các doanh nghiệp có số ở kỳ đó; doanh nghiệp thiếu số không được cộng, độ phủ ghi dưới mỗi chart.</li>
    <li>Hệ số = tổng tử số ÷ tổng mẫu số trên cùng tập doanh nghiệp có đủ cả hai; không lấy trung bình các hệ số.</li>
    <li>TTM = tổng 4 quý liền, đủ cả 4 quý. Năm: KQKD = tổng 4 quý, LCTT = số báo cáo năm (LCTT quý trên VNDirect trước 2024 không khớp số năm thì để trống). Số dư: cuối kỳ; bình quân = (cuối kỳ + cùng kỳ năm trước)/2.</li>
    <li>EBITDA = LN gộp − chi phí bán hàng − chi phí QLDN + khấu hao; FCF = CFO − tiền chi mua sắm TSCĐ; vốn đầu tư = VCSH + nợ vay − tiền − đầu tư ngắn hạn.</li>
    <li>Loại trùng công ty mẹ – con khi cả hai cùng trong rổ: DXG hợp nhất DXS (tỷ lệ sở hữu chưa đối chiếu báo cáo thường niên).</li><li>Doanh thu BĐS ghi nhận khi bàn giao, nên lợi nhuận quý dao động theo lịch bàn giao, không theo doanh số bán; doanh số đã bán chờ bàn giao nằm ở người mua trả tiền trước (mục 1.4).</li></ul>
    <div class="pf-ctl"><span class="pf-lb">Tải CSV</span>${[['raw', 'Số liệu từng doanh nghiệp'], ['group', 'Tổng theo nhóm (chu kỳ đang chọn)'], ['ratio', 'Hệ số theo nhóm'], ['universe', 'Danh mục doanh nghiệp & phương pháp']].map(([k, t]) => `<button type="button" class="pf-dl" data-x="${k}">${t}</button>`).join('')}</div>`;
  d.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', () => exportCsv(b.dataset.x)));
  const src = el('div', 'pw-src', `Nguồn: ${SRC}`); d.append(src);
  return d;
}
function redraw() { syncUrl(); renders.forEach(f => { try { f(); } catch (e) { document.documentElement.dataset.pfError = (document.documentElement.dataset.pfError || '') + e.message + ';'; console.error(e); } }); setTimeout(() => window.dispatchEvent(new Event('resize')), 60); }
/* ---------- Tài chính ngành › 02 So sánh doanh nghiệp (27/11/2026, người dùng chốt cách A) ----------
   Mỗi nhóm chỉ số một mục; mỗi mục: chọn chỉ tiêu → chart xếp hạng từng mã ở kỳ chốt + chart xu hướng từng mã (chú giải bấm ẩn/hiện mã).
   Số từng mã tính riêng cho chính mã đó (không trừ hợp nhất), tỷ số = tử ÷ mẫu của chính doanh nghiệp. */
const CS = {mode: 'ttm', end: D.periods.length - 1, on: D.companies.map(c => c.ticker)};
const TK_COLOR = ['#1D2678', '#2a9fa3', '#c98a00', '#861C52', '#3d4653', '#8997D6', '#2BB673', '#E5484D', '#7b61c9', '#3b8fd9', '#a0522d', '#59C5C8', '#D4A72C'];
const tkColor = Object.fromEntries(D.companies.map((c, i) => [c.ticker, TK_COLOR[i % TK_COLOR.length]]));
const cRenders = [];
const one = (m, t, mode, avg) => E.per(m, [t], mode, avg)[t];
const rat = (a, b, t, mode, sc = 1, avgB) => E.ratio({m: a}, {m: b, avg: avgB}, [t], mode, sc).values;
const flowMode = () => CS.mode;                       // dòng tiền, lợi nhuận: quý / TTM / năm
const stockMode = () => CS.mode === 'y' ? 'y' : 'q';  // số dư: cuối quý hoặc cuối năm
const RMODE = () => CS.mode === 'q' ? 'ttm' : CS.mode; // tỷ suất sinh lời: TTM hoặc năm
const cEndIdx = mode => mode === 'y' ? E.years.indexOf(D.periods[CS.end].slice(0, 4)) - (D.periods[CS.end].endsWith('Q4') ? 0 : 1) : CS.end;
// Mỗi chỉ tiêu: tên, đơn vị, số lẻ, chu kỳ dùng, hàm trả chuỗi theo mã.
const CM = {
  revenue: {n: 'Doanh thu', u: 'tỷ đ', d: 0, md: flowMode, f: (t, md) => one('revenue', t, md)},
  npat: {n: 'LNST', u: 'tỷ đ', d: 0, md: flowMode, f: (t, md) => one('npat', t, md)},
  rev_g: {n: 'Doanh thu so cùng kỳ', u: '%', d: 1, md: flowMode, f: (t, md) => yoyPct(one('revenue', t, md), md)},
  npat_g: {n: 'LNST so cùng kỳ', u: '%', d: 1, md: flowMode, f: (t, md) => yoy(one('npat', t, md), md)},
  gm: {n: 'Biên gộp', u: '%', d: 1, md: RMODE, f: (t, md) => rat('gross', 'revenue', t, md, 100)},
  em: {n: 'Biên EBIT', u: '%', d: 1, md: RMODE, f: (t, md) => rat('ebit', 'revenue', t, md, 100)},
  nm: {n: 'Biên ròng', u: '%', d: 1, md: RMODE, f: (t, md) => rat('npat', 'revenue', t, md, 100)},
  sga: {n: 'CP bán hàng + QLDN / doanh thu', u: '%', d: 1, md: RMODE, f: (t, md) => rat('sga', 'revenue', t, md, 100)},
  roe: {n: 'ROE', u: '%', d: 1, md: RMODE, f: (t, md) => rat('npat', 'equity', t, md, 100, true)},
  roa: {n: 'ROA', u: '%', d: 1, md: RMODE, f: (t, md) => rat('npat', 'total_assets', t, md, 100, true)},
  roic: {n: 'ROIC', u: '%', d: 1, md: RMODE, f: (t, md) => roic([t], md).each[t]},
  cfo: {n: 'CFO', u: 'tỷ đ', d: 0, md: RMODE, f: (t, md) => one('cfo', t, md)},
  fcf: {n: 'FCF (CFO − CAPEX)', u: 'tỷ đ', d: 0, md: RMODE, f: (t, md) => one('fcf', t, md)},
  cfo_np: {n: 'CFO / LNST', u: 'lần', d: 2, md: RMODE, f: (t, md) => rat('cfo', 'npat', t, md)},
  inv: {n: 'Hàng tồn kho (quỹ đất, dự án)', u: 'tỷ đ', d: 0, md: stockMode, f: (t, md) => one('inventory', t, md)},
  adv: {n: 'Người mua trả tiền trước', u: 'tỷ đ', d: 0, md: stockMode, f: (t, md) => one('adv_customers', t, md)},
  cover: {n: 'Backlog cover (trả trước ÷ doanh thu TTM)', u: 'lần', d: 2, md: () => 'q', f: t => { const a = one('adv_customers', t, 'q'), r = one('revenue', t, 'ttm'); return a.map((v, i) => fin(v) && fin(r[i]) && r[i] > 0 ? v / r[i] : null); }},
  inv_ta: {n: 'Tồn kho / tổng tài sản', u: '%', d: 1, md: stockMode, f: (t, md) => rat('inventory', 'total_assets', t, md, 100)},
  rec_rev: {n: 'Phải thu / doanh thu TTM', u: 'lần', d: 2, md: () => 'q', f: t => { const a = one('receivables', t, 'q'), r = one('revenue', t, 'ttm'); return a.map((v, i) => fin(v) && fin(r[i]) && r[i] > 0 ? v / r[i] : null); }},
  de: {n: 'Nợ vay / VCSH', u: 'lần', d: 2, md: stockMode, f: (t, md) => rat('debt', 'equity', t, md)},
  nd_eb: {n: 'Nợ vay ròng / EBITDA TTM', u: 'lần', d: 2, md: () => 'q', f: t => { const a = one('net_debt', t, 'q'), b = one('ebitda', t, 'ttm'); return a.map((v, i) => fin(v) && fin(b[i]) && b[i] > 0 ? v / b[i] : null); }},
  st_cash: {n: 'Nợ vay ngắn hạn / tiền', u: 'lần', d: 2, md: stockMode, f: (t, md) => rat('st_debt', 'cash_all', t, md)},
  icov: {n: 'EBIT / lãi vay', u: 'lần', d: 2, md: RMODE, f: (t, md) => rat('ebit', 'interest', t, md)},
};
const CSEC = [
  ['2.1', 'Quy mô & tăng trưởng', 'Mã nào đang lớn lên, mã nào co lại?', ['revenue', 'npat', 'rev_g', 'npat_g']],
  ['2.2', 'Biên lợi nhuận', 'Ai giữ được biên khi cơ cấu bàn giao thay đổi?', ['gm', 'em', 'nm', 'sga']],
  ['2.3', 'Hiệu quả vốn', 'Vốn chủ và vốn đầu tư của từng mã sinh lời bao nhiêu?', ['roe', 'roa', 'roic']],
  ['2.4', 'Dòng tiền', 'Lợi nhuận của mã nào đã thành tiền?', ['cfo', 'fcf', 'cfo_np']],
  ['2.5', 'Quỹ đất, dự án & tiền khách trả trước', 'Doanh thu 4–8 quý tới đã có tiền đặt cọc đứng sau chưa, vốn đang nằm ở dự án bao nhiêu?', ['cover', 'adv', 'inv', 'inv_ta', 'rec_rev']],
  ['2.6', 'Nợ vay & thanh khoản', 'Mã nào chịu áp lực nợ đến hạn?', ['de', 'nd_eb', 'st_cash', 'icov']],
];
const cSel = () => CS.on.slice();
function cSection(num, title, q, keys) {
  const s = section(num, title, q); let k = keys[0];
  const a = card('re-cmp-' + num.replace('.', '') + '-rank', 'Xếp hạng ở kỳ chốt', ' '), b = card('re-cmp-' + num.replace('.', '') + '-trend', 'Xu hướng từng mã', ' ');
  const pick = el('div', 'pf-seg pf-box pf-cmp-pick'); pick.setAttribute('role', 'group'); pick.setAttribute('aria-label', 'Chỉ tiêu');
  keys.forEach(x => { const btn = el('button', '', esc(CM[x].n)); btn.type = 'button'; btn.dataset.k = x; btn.setAttribute('aria-pressed', String(x === k)); btn.addEventListener('click', () => { k = x; pick.querySelectorAll('button').forEach(z => z.setAttribute('aria-pressed', String(z.dataset.k === k))); draw(); }); pick.append(btn); });
  s.append(pick);
  function draw() {
    const m = CM[k], md = m.md(), L = E.labels(md), i = cEndIdx(md), ts = cSel();
    const vals = Object.fromEntries(ts.map(t => [t, m.f(t, md)]));
    const rows = ts.map(t => [t, vals[t][i]]).filter(r => fin(r[1])).sort((x, y) => y[1] - x[1]);
    const per = md === 'y' ? 'năm' : md === 'ttm' ? 'TTM' : 'quý';
    a.el.querySelector('.chart-title').textContent = `${m.n} — xếp hạng ${qLabel(L[i] || '')}`;
    a.el.querySelector('.chart-sub').textContent = `${m.u} · ${per} · ${rows.length}/${ts.length} mã có số`;
    const rm = {key: a.el.dataset.blockId, categories: rows.map(r => r[0]), series: [{name: m.n, color: '#2938A8', values: rows.map(r => Math.round(r[1] * 100) / 100)}], unit: m.u, digits: m.d, native: 'hbar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(a.host, rm, () => { a.host.innerHTML = ChartTypes.render(rm, 'hbar'); });
    foot(a, 'tính riêng từng doanh nghiệp, không trừ hợp nhất');
    b.el.querySelector('.chart-title').textContent = `${m.n} — xu hướng từng mã`;
    b.el.querySelector('.chart-sub').textContent = `${m.u} · ${per} · bấm tên mã ở chú giải để ẩn/hiện`;
    chart(b.host, b.el.dataset.blockId, L.slice(0, i + 1), ts.map(t => ({name: t, color: tkColor[t], values: vals[t].slice(0, i + 1)})), {unit: m.u, digits: m.d, zeroBase: false});
    foot(b, '');
  }
  cRenders.push(draw);
  s.append(grid2(a, b));
  return s;
}
// Định giá: số theo phiên (VNDirect), không cùng kỳ với BCTC.
function cValuation() {
  const V = window.COMPANY_VALUATION; const s = section('2.7', 'Định giá', 'Mã nào đang rẻ hay đắt so với chính lịch sử 5 năm của nó?');
  if (!V || !V.companies) { s.insertAdjacentHTML('beforeend', '<p class="data-gap">Chưa có dữ liệu định giá theo phiên.</p>'); return s; }
  let k = 'pe'; const pick = el('div', 'pf-seg pf-box pf-cmp-pick');
  [['pe', 'P/E'], ['pb', 'P/B']].forEach(([x, n]) => { const btn = el('button', '', n); btn.type = 'button'; btn.dataset.k = x; btn.setAttribute('aria-pressed', String(x === k)); btn.addEventListener('click', () => { k = x; pick.querySelectorAll('button').forEach(z => z.setAttribute('aria-pressed', String(z.dataset.k === k))); draw(); }); pick.append(btn); });
  s.append(pick);
  const a = card('re-cmp-27-now', 'Hiện tại so với trung vị 5 năm', ' '), b = card('re-cmp-27-trend', 'Xu hướng theo phiên', ' ');
  const vsrc = `<a href="https://dstock.vndirect.com.vn/" target="_blank" rel="noopener">VNDirect</a>`;
  function draw() {
    const ts = cSel().filter(t => V.companies[t]), nm = k === 'pe' ? 'P/E' : 'P/B', col = k === 'pe' ? 2 : 3;
    const rows = ts.map(t => [t, V.companies[t][k], V.companies[t].median5?.[k]]).filter(r => fin(r[1]) && r[1] > 0).sort((x, y) => x[1] - y[1]);
    a.el.querySelector('.chart-title').textContent = `${nm} hiện tại và trung vị 5 năm`;
    a.el.querySelector('.chart-sub').textContent = `lần · phiên ${esc((V.latest_observation || V.checked_at || '').slice(0, 10).split('-').reverse().join('/'))} · ${rows.length}/${cSel().length} mã có ${nm} dương`;
    const rm = {key: 're-cmp-27-now', categories: rows.map(r => r[0]), series: [{name: `${nm} hiện tại`, color: '#2938A8', values: rows.map(r => r[1])}, {name: 'Trung vị 5 năm', color: '#c98a00', values: rows.map(r => fin(r[2]) ? r[2] : null)}], unit: 'lần', digits: 2, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(a.host, rm, () => { a.host.innerHTML = ChartTypes.render(rm, 'bar'); });
    a.el.querySelectorAll(':scope > .pw-src, :scope > .pw-src-note').forEach(n => n.remove());
    a.el.append(el('div', 'pw-src', `Nguồn: ${vsrc}; trung vị 5 năm bỏ giá trị ≤ 0`));
    const H = V.history || {}, days = [...new Set(ts.flatMap(t => (H[t] || []).map(r => r[0])))].sort();
    b.el.querySelector('.chart-title').textContent = `${nm} từng mã theo phiên`;
    b.el.querySelector('.chart-sub').textContent = `lần · ${days.length} phiên gần nhất · bấm tên mã ở chú giải để ẩn/hiện`;
    const series = ts.filter(t => H[t]?.length).map(t => { const mp = new Map(H[t].map(r => [r[0], r[col]])); return {name: t, color: tkColor[t], values: days.map(d => { const v = mp.get(d); return fin(v) && v > 0 ? v : null; })}; });
    const lm = {key: 're-cmp-27-trend', categories: days.map(d => d.slice(8, 10) + '/' + d.slice(5, 7)), series, unit: 'lần', digits: 2, native: 'line', zeroBase: false, time: true};
    if (window.ChartTypes) ChartTypes.mount(b.host, lm, () => { b.host.innerHTML = ChartTypes.render(lm, 'line'); });
    b.el.querySelectorAll(':scope > .pw-src').forEach(n => n.remove()); b.el.append(el('div', 'pw-src', `Nguồn: ${vsrc}; P/E, P/B theo giá đóng cửa từng phiên`));
  }
  cRenders.push(draw);
  s.append(grid2(a, b));
  return s;
}
function cFilter() {
  const f = el('section', 'pf-filter');
  f.innerHTML = `<div class="pf-grid"><span class="pf-lb">Doanh nghiệp</span><div class="pf-chips pf-cmp-tk">${D.groups.map(g => D.companies.filter(c => c.group === g.id).map(c => `<button type="button" data-ctk="${c.ticker}" aria-pressed="true" title="${esc(g.label)}"><i style="background:${tkColor[c.ticker]}"></i>${c.ticker}</button>`).join('')).join('')}</div>
    <span class="pf-lb">Chọn nhanh</span><div class="pf-chips">${D.groups.map(g => `<button type="button" data-cg="${g.id}">${esc(g.label)}</button>`).join('')}<button type="button" data-cg="*">Tất cả</button></div>
    <span class="pf-lb">Chu kỳ</span><div class="pf-inline"><div class="pf-seg pf-box">${MODES.map(([k, t]) => `<button type="button" data-cm="${k}" aria-pressed="${CS.mode === k}">${t}</button>`).join('')}</div>
    <span class="pf-lb">Kỳ chốt</span><select data-role="cend">${D.periods.map((p, i) => `<option value="${i}"${i === CS.end ? ' selected' : ''}>${qLabel(p)}</option>`).join('')}</select></div></div>
    <p class="pf-note">Chu kỳ Quý: dòng tiền và tỷ suất sinh lời vẫn tính TTM để tránh nhiễu mùa vụ bàn giao. Số dư (tồn kho, nợ vay, trả trước) lấy cuối kỳ.</p>`;
  const sync = () => f.querySelectorAll('[data-ctk]').forEach(b => b.setAttribute('aria-pressed', String(CS.on.includes(b.dataset.ctk))));
  f.querySelectorAll('[data-ctk]').forEach(b => b.addEventListener('click', () => { const t = b.dataset.ctk; CS.on = CS.on.includes(t) ? CS.on.filter(x => x !== t) : [...CS.on, t]; if (!CS.on.length) CS.on = [t]; sync(); cRedraw(); }));
  f.querySelectorAll('[data-cg]').forEach(b => b.addEventListener('click', () => { const g = b.dataset.cg; CS.on = D.companies.filter(c => g === '*' || c.group === g).map(c => c.ticker); sync(); cRedraw(); }));
  f.querySelectorAll('[data-cm]').forEach(b => b.addEventListener('click', () => { CS.mode = b.dataset.cm; f.querySelectorAll('[data-cm]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.cm === CS.mode))); cRedraw(); }));
  f.querySelector('[data-role=cend]').addEventListener('change', e => { CS.end = +e.target.value; cRedraw(); });
  return f;
}
function cRedraw() { cRenders.forEach(fn => { try { fn(); } catch (e) { document.documentElement.dataset.pfError = (document.documentElement.dataset.pfError || '') + e.message + ';'; console.error(e); } }); setTimeout(() => window.dispatchEvent(new Event('resize')), 60); }
let cRoot = null;
function buildCompare(host) {
  if (!host || cRoot) return; cRoot = host; style();
  host.append(cFilter(), ...CSEC.map(x => cSection(...x)), cValuation());
  cRedraw();
}

function build(pane) {
  if (!pane || root) return; root = pane;
  style();
  pane.append(filterBar(), kpis(), s71(), s72(), s73(), s74(), s75(), s76(), methods());
  redraw();
  buildCompare(document.getElementById('re-cmp-root'));
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
:root[data-theme=dark] .pf-wf-t{background:#262c45}
.pf-cmp-pick{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}.pf-cmp-pick button[aria-pressed=true],.pf-seg button[aria-pressed=true]{background:#1D2678;color:#fff;border-color:#1D2678}
.pf-cmp-tk button[aria-pressed=false]{opacity:.45;text-decoration:line-through}.pf-cmp-tk button i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}`;
  document.head.append(st);
}
window.ReFinance = {build, buildCompare, engine: E, state: S};
})();
