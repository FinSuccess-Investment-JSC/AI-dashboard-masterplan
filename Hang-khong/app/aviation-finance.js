/* Hàng không · Tài chính ngành (?sub=sector#mt14, 27/11/2026). Chép từ Cang-bien/app/port-finance.js (chuẩn 6 câu hỏi của Dien/#mt14),
   số từ window.AVIATION_FIN (BCTC hợp nhất quý, VNDirect finfo; scripts/build_aviation_financials.py), tổng hợp bằng app/industry-fin.js.
   Rổ mặc định: Hãng bay (HVN, VJC) + Cảng hàng không (ACV); bật thêm Nhà ga hàng hóa (SCS, NCT), Dịch vụ sân bay (SGN, AST, SAS).
   Thêm so với Cảng: KPI doanh thu, LNST, CFO, CAPEX, FCF TTM + nợ vay ròng; waterfall đóng góp thay đổi LNST; CFO cạnh LNST theo mã;
   N/A khi mẫu số không dương; câu kết luận mỗi cụm tính từ số kỳ chốt; chart theo mã hk-60, hk-61 dời vào cụm 1 và 5. */
(() => {
'use strict';
const D = window.AVIATION_FIN;
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
const covLine = s => { const i = S.end, ms = [['revenue', 'doanh thu'], ['npat', 'LNST'], ['cfo', 'CFO'], ['capex', 'CAPEX'], ['equity', 'VCSH'], ['da', 'khấu hao']]; return 'độ phủ kỳ chốt ' + qLabel(D.periods[i]) + ': ' + ms.map(([m, n]) => `${n} ${s.filter(t => fin(D.data[t]?.[m]?.[i])).length}/${s.length}`).join(', '); };
const share = (groups, i) => { const tot = groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0); return groups.map(g => fin(g.values[i]) && tot ? g.values[i] / tot * 100 : null); };

/* ---------- Thanh bộ lọc, KPI, xuất dữ liệu ---------- */
function filterBar() {
  const f = el('section', 'pf-filter');
  // Bộ lọc: mỗi dòng một nhãn cố định bên trái; bảng mảng bên dưới. Nút tải CSV ẩn (25/11/2026, theo yêu cầu người dùng).
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
  // Bảng mảng (dùng xuyên suốt tab): nhóm · doanh nghiệp · có trong tổng hay không.
  renders.push(() => { const s = sel(), cons = E.consolidation.filter(c => s.includes(c.parent) && s.includes(c.child));
    f.querySelector('.pf-legend').innerHTML = `<table class="pf-gtable"><thead><tr><th>Nhóm</th><th>Doanh nghiệp</th><th>Trong tổng</th></tr></thead><tbody>${D.groups.map(g => { const on = S.groups.includes(g.id);
        return `<tr class="${on ? '' : 'off'}"><td><i style="background:${g.color}"></i>${esc(g.label)}</td><td>${D.companies.filter(c => c.group === g.id).map(c => `<button type="button" class="pf-tk" data-tk="${c.ticker}" aria-pressed="${on && !S.off.includes(c.ticker)}" title="${esc(c.note || '')} · bấm để bỏ khỏi / thêm vào rổ">${c.ticker}${c.mixed ? '*' : ''}</button>`).join('')}</td><td>${on ? 'Có' : 'Không'}</td></tr>`; }).join('')}</tbody></table>
      <p class="pf-scope"><b>Rổ doanh nghiệp theo dõi</b>: ${s.length} mã (${s.join(', ') || '—'}) · tổng hợp BCTC hợp nhất của rổ, có thể chứa giao dịch giữa các mắt xích trong chuỗi giá trị (hãng bay trả phí cho cảng, nhà ga) · dữ liệu ${qLabel(D.periods[0])} – ${qLabel(D.periods.at(-1))}, cập nhật ${esc(D.captured.split('-').reverse().join('/'))} · ${covLine(s)}</p>
      <p class="pf-note">Bấm mã để bỏ khỏi hoặc thêm vào rổ. Không đại diện toàn ngành: Bamboo, Vietravel, Sun PhuQuoc, VATM và các công ty dịch vụ chưa niêm yết không nằm trong rổ. Chưa loại trùng sở hữu: khi bật thêm nhà ga hàng hóa, dịch vụ sân bay, một phần có thể đã nằm trong số hợp nhất của HVN hoặc ACV.${cons.length ? ` Loại trùng hợp nhất: ${cons.map(c => `${c.parent} trừ ${c.child}`).join(', ')}.` : ''}</p>`; });
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
    const T = (m, mode = 'ttm') => E.total(m, s, mode);
    const tile = (label, val, unit, dTxt, cov, vals, sub, tip) => `<div class="kpi pp-kpi" title="${esc(tip)}"><div class="label l">${esc(label)}</div><div class="value v">${val}${unit ? `<small> ${esc(unit)}</small>` : ''}</div><div class="delta">${dTxt}</div>${spark(vals)}<div class="sub s">${esc(qLabel(D.periods[i]))} · phủ ${cov}/${n} DN${sub ? ' · ' + sub : ''}</div></div>`;
    const ch = (m, mode = 'ttm') => E.growth(m, s, mode).values[i];
    const chAbs = (vals, k = 4) => fin(vals[i]) && fin(vals[i - k]) ? vals[i] - vals[i - k] : null;
    const TIP = 'Tổng hợp BCTC hợp nhất của rổ đang chọn; có thể chứa giao dịch giữa các mắt xích trong chuỗi giá trị. TTM = 4 quý liền đến kỳ chốt. So cùng kỳ chỉ trên các mã có số ở cả hai kỳ.';
    const rev = T('revenue'), np = T('npat'), cfo = T('cfo'), cap = T('capex'), fcf = T('fcf'), nd = T('net_debt', 'q');
    g.innerHTML = [
      tile('Doanh thu TTM của rổ', nf(rev.values[i]), 'tỷ đ', `${sg(ch('revenue'))}% so cùng kỳ`, rev.cov[i], rev.values, '', TIP),
      tile('LNST TTM của rổ', nf(np.values[i]), 'tỷ đ', `${sg(ch('npat'))}% so cùng kỳ`, np.cov[i], np.values, '', TIP),
      tile('CFO TTM', nf(cfo.values[i]), 'tỷ đ', `${sg(chAbs(cfo.values), 0)} tỷ so cùng kỳ`, cfo.cov[i], cfo.values, 'dòng tiền kinh doanh', TIP),
      tile('CAPEX tiền mặt TTM', nf(cap.values[i]), 'tỷ đ', `${sg(ch('capex'))}% so cùng kỳ`, cap.cov[i], cap.values, 'chi mua sắm, xây dựng TSCĐ', TIP),
      tile('FCF TTM', nf(fcf.values[i]), 'tỷ đ', `${sg(chAbs(fcf.values), 0)} tỷ so cùng kỳ`, fcf.cov[i], fcf.values, 'CFO − CAPEX', TIP),
      tile('Nợ vay ròng kỳ chốt', nf(nd.values[i]), 'tỷ đ', `${sg(chAbs(nd.values), 0)} tỷ so cùng kỳ`, nd.cov[i], nd.values, 'số dư cuối quý', TIP)
    ].join('');
  });
  return g;
}
// Section: câu hỏi + hàng mini KPI + các card
// Không có hàng ô số nhỏ dưới câu hỏi (quy tắc chung trang Điện, PR #35, 25/11/2026); chỉ giữ hàng KPI đầu sub-tab.
// Mục lục: 6 nhóm Kết quả kinh doanh → Biên lợi nhuận → CAPEX & dở dang → Công nợ & chuyển đổi tiền → Nợ, thanh khoản & FCF → Hiệu quả vốn.
function section(num, title, q, take) {
  const s = el('section', 'pp-panel pp-q pf-sec'); s.innerHTML = `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(title)}</h3><p class="pf-q">${esc(q)}</p></div></header>`;
  if (take) { const p = el('p', 'pf-take'); s.append(p); renders.push(() => { try { p.innerHTML = take(); } catch (e) { p.textContent = ''; } }); }
  return s;
}
// Số nhóm tại kỳ chốt (TTM) cho câu kết luận.
const gv = (m, mode = 'ttm') => { const b = E.byGroup(m, sel(), mode), i = S.end; return b.groups.map(g => ({id: g.id, l: g.label, v: g.values[i], p: g.values[i - 4], ts: g.tickers})); };
const gr = (a, b, sc = 100, mode = 'ttm', o = {}) => D.groups.filter(g => S.groups.includes(g.id)).map(g => ({l: g.label, ts: E.tickersOf([g.id]).filter(t => !S.off.includes(t)), v: E.ratio(a, b, E.tickersOf([g.id]).filter(t => !S.off.includes(t)), mode, sc, o).values[S.end]}));
const gname = x => x.ts.length === 1 ? `${x.l} (${x.ts[0]})` : `${x.l} (${x.ts.join(', ')})`;
const grid2 = (...cards) => { const g = el('div', 'grid two g2 pf-g2'); cards.forEach(c => g.append(c.el)); return g; };

/* ---------- 1.1 Chu kỳ doanh thu và lợi nhuận ---------- */
const PNL = [['revenue', 'Doanh thu'], ['gross', 'Lợi nhuận gộp'], ['ebitda', 'EBITDA'], ['ebit', 'EBIT'], ['npat', 'LNST']];
function s71() {
  const s = section('1.1', 'Lợi nhuận đang dịch chuyển về khâu nào?', 'Doanh thu, LNST theo nhóm (quý, TTM, năm); đóng góp của từng nhóm, từng mã vào thay đổi LNST so cùng kỳ; mùa vụ theo quý.', () => {
    const w = bridge('group'); if (!w) return '';
    return `<b>Kết luận:</b> LNST TTM của rổ ${qLabel(D.periods[S.end])} đạt ${nf(w.cur)} tỷ đồng, ${w.cur >= w.prev ? 'tăng' : 'giảm'} ${nf(Math.abs(w.cur - w.prev))} tỷ so cùng kỳ; đóng góp theo nhóm: ${w.steps.slice().sort((a, b) => a.v - b.v).map(x => `${esc(x.l)} ${sg(x.v, 0)} tỷ`).join(', ')}.`; });
  // Chart 1: quy mô theo nhóm
  const c1 = card('hk-fin-pnl', 'Doanh thu và LNST theo nhóm (tỷ đồng)', 'Cột chồng theo nhóm · quý, TTM hoặc năm theo bộ lọc · đổi chỉ tiêu và cách xem'); let m1 = 'npat', v1 = 'abs';
  seg(c1, 'Chỉ tiêu', PNL, () => m1, k => { m1 = k; draw1(); }); seg(c1, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const b = E.byGroup(m1, sel(), S.mode), name = PNL.find(p => p[0] === m1)[1];
    if (v1 === 'abs') chart(c1.host, 'hk-fin-pnl-abs', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true});
    else if (v1 === 'yoy') chart(c1.host, 'hk-fin-pnl-yoy', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: E.growth(m1, sel(), S.mode).groups.find(z => z.id === g.id)?.values || []})), {unit: '%', digits: 1, zeroBase: false});
    else { const tot = b.labels.map((_, i) => b.groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0)), neg = b.labels.map((_, i) => b.groups.some(g => fin(g.values[i]) && g.values[i] < 0));
      chart(c1.host, 'hk-fin-pnl-share', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values.map((v, i) => fin(v) && tot[i] > 0 && !neg[i] ? v / tot[i] * 100 : null)})), {unit: '%', digits: 1, native: 'stack', stackable: true}); }
    foot(c1, `${name} ${modeName(S.mode)}; EBIT = LN gộp − CP bán hàng − CP QLDN; EBITDA = EBIT + khấu hao (LCTT)${v1 === 'share' ? '; tỷ trọng để trống ở kỳ có nhóm lỗ' : ''}; ${covNote(b.groups.reduce((a, g) => a.map((x, i) => x + g.cov[i]), b.labels.map(() => 0)), sel().length, b.labels.length - 1)}`); }
  renders.push(draw1);
  // Chart "Chu kỳ lợi nhuận theo mảng" bỏ 25/11/2026 (trùng chart doanh thu và lợi nhuận ở trên).
  // Waterfall đóng góp vào thay đổi LNST TTM so cùng kỳ: cùng tập mã có số ở cả hai kỳ; tổng các bước = thay đổi của rổ.
  const c2 = card('hk-fin-bridge', 'Ai kéo LNST TTM của rổ tăng hay giảm so cùng kỳ? (tỷ đồng)', 'Waterfall: LNST TTM cùng kỳ năm trước → đóng góp từng nhóm hoặc từng mã → LNST TTM kỳ chốt · bước âm là phần kéo lùi'); let v2 = 'group';
  seg(c2, 'Đơn vị', [['group', 'Nhóm'], ['firm', 'Mã']], () => v2, k => { v2 = k; draw2(); });
  function draw2() { const w = bridge(v2); if (!w) { c2.host.innerHTML = '<p class="pf-note">Chưa đủ số hai kỳ để tính.</p>'; foot(c2, ''); return; }
    c2.host.innerHTML = wf([{l: 'LNST TTM ' + qLabel(D.periods[S.end - 4]), v: w.prev, total: 1}, ...w.steps.map(x => ({l: x.l, v: x.v, c: x.c})), {l: 'LNST TTM ' + qLabel(D.periods[S.end]), v: w.cur, total: 1}], 'tỷ đồng');
    foot(c2, `cùng tập ${w.ts.length} mã có LNST TTM ở cả hai kỳ (${w.ts.join(', ')}); tổng đóng góp ${sg(w.steps.reduce((a, x) => a + x.v, 0), 0)} = thay đổi của rổ ${sg(w.cur - w.prev, 0)} tỷ`); }
  renders.push(draw2);
  // Chart 4: mùa vụ
  const c4 = card('hk-fin-season', 'Tính mùa vụ của lợi nhuận theo quý', 'Bảng nhiệt năm × quý · chọn nhóm và chỉ tiêu'); let g4 = 'all', m4 = 'npat', v4 = 'abs';
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
  const c5 = card('hk-fin-breadth', 'Tăng trưởng lợi nhuận lan rộng hay tập trung?', 'Số doanh nghiệp theo thay đổi LNST so cùng kỳ (quý riêng)');
  function draw5() { const s = sel(), pv = E.per('npat', s, 'q'), L = D.periods;
    const cnt = f => L.map((_, i) => i < 4 ? null : s.filter(t => fin(pv[t][i]) && fin(pv[t][i - 4]) && f(pv[t][i], pv[t][i - 4])).length);
    chart(c5.host, 'hk-fin-breadth', L, [
      {name: 'Tăng (lãi cả hai kỳ)', color: '#2938A8', values: cnt((a, b) => a >= b && a > 0 && b > 0)},
      {name: 'Giảm (lãi cả hai kỳ)', color: '#9AA3BD', values: cnt((a, b) => a < b && a > 0 && b > 0)},
      {name: 'Lỗ sang lãi', color: '#2a9fa3', values: cnt((a, b) => a > 0 && b <= 0)},
      {name: 'Lãi sang lỗ', color: '#c98a00', values: cnt((a, b) => a <= 0 && b > 0)},
      {name: 'Lỗ cả hai kỳ', color: '#3d4653', values: cnt((a, b) => a <= 0 && b <= 0)}], {unit: 'DN', native: 'stack', stackable: true});
    foot(c5, 'LNST quý so cùng quý năm trước; chỉ doanh nghiệp có số cả hai kỳ'); }
  renders.push(draw5);
  s.append(c1.el, grid2(c2, c4), c5.el, drill('hk-60', 'Chi tiết từng mã: doanh thu, LNST, biên ròng theo quý'));
  return s;
}
// Thác nước HTML (chiều ngang): các bước có thể bấm (data-id).
function wf(steps, unit) {
  let run = 0; const rows = steps.map(s => { if (s.total) { run = s.v; return {...s, a: 0, b: s.v}; } const a = run; run += s.v; return {...s, a, b: run}; });
  const lo = Math.min(0, ...rows.map(r => Math.min(r.a, r.b))), hi = Math.max(0, ...rows.map(r => Math.max(r.a, r.b))), span = (hi - lo) || 1, pos = v => (v - lo) / span * 100;
  return `<div class="pf-wf">${rows.map(r => `<div class="pf-wf-r${r.id ? ' pf-click' : ''}"${r.id ? ` data-id="${r.id}" role="button" tabindex="0"` : ''}><span>${esc(r.l)}</span><div class="pf-wf-t"><i style="left:${Math.min(pos(r.a), pos(r.b))}%;width:${Math.max(.4, Math.abs(pos(r.b) - pos(r.a)))}%;background:${r.total ? '#1D2678' : r.v < 0 ? '#c98a00' : (r.c || '#2a9fa3')}"></i>${lo < 0 ? `<b style="left:${pos(0)}%"></b>` : ''}</div><em>${r.total ? nf(r.v) : sg(r.v, 0)}</em></div>`).join('')}</div><div class="pf-unit">${esc(unit)}</div>`;
}

function bridge(unit) {
  const i = S.end; if (i < 7) return null; const x = sel(), pv = E.per('npat', x, 'ttm');
  const ts = x.filter(t => fin(pv[t][i]) && fin(pv[t][i - 4])); if (!ts.length) return null;
  const prev = ts.reduce((a, t) => a + pv[t][i - 4], 0), cur = ts.reduce((a, t) => a + pv[t][i], 0);
  const steps = unit === 'firm' ? ts.map(t => ({l: t, v: pv[t][i] - pv[t][i - 4], c: GC[E.groupOf[t]]}))
    : D.groups.filter(g => ts.some(t => E.groupOf[t] === g.id)).map(g => { const gt = ts.filter(t => E.groupOf[t] === g.id); return {l: gt.length === 1 ? `${g.label} (${gt[0]})` : g.label, v: gt.reduce((a, t) => a + pv[t][i] - pv[t][i - 4], 0), c: g.color}; });
  return {prev, cur, steps, ts};
}
// Tầng chi tiết theo mã: thẻ chart theo mã có sẵn của trang (dời vào cụm, giữ chart và bảng).
function drill(blockId, label) {
  const d = el('details', 'pf-drill'); d.dataset.drill = blockId; d.innerHTML = `<summary>${esc(label)}</summary>`;
  const card = document.querySelector(`[data-block-id="${blockId}"]`); if (card) { const panel = card.closest('.pp-q'); d.append(card); if (panel && !panel.querySelector('[data-block-id]')) panel.remove(); }
  d.addEventListener('toggle', () => { if (d.open) setTimeout(() => window.dispatchEvent(new Event('resize')), 40); });
  return d;
}

/* ---------- 1.2 Cấu trúc chi phí và biên lợi nhuận ---------- */
function groupPicker(c, get, set) { const g = el('select', 'pf-sel'); c.ctl.append(g); g.addEventListener('change', () => set(g.value)); return () => { g.innerHTML = `<option value="all">Tất cả nhóm đang chọn</option>` + D.groups.filter(x => S.groups.includes(x.id)).map(x => `<option value="${x.id}"${x.id === get() ? ' selected' : ''}>${esc(x.label)}</option>`).join(''); if (get() !== 'all' && !S.groups.includes(get())) set('all', true); }; }
const scopeOf = gid => gid === 'all' ? sel() : sel().filter(t => E.groupOf[t] === gid);
function s72() {
  const s = section('1.2', 'Biên lợi nhuận thay đổi vì đâu?', 'Biên gộp, EBITDA, EBIT, LNST theo nhóm; cơ cấu chi phí trên 100 đồng doanh thu. Hãng bay: ASK, RPK, hệ số tải, yield, nhiên liệu, thuê tàu chưa có số cùng kỳ theo hãng nên mới là giả thuyết; cảng: tỷ trọng khách quốc tế xem ở Bức tranh ngành › Sân bay.', () => {
    const g = gr({m: 'gross'}, {m: 'revenue'}), e = gr({m: 'ebit'}, {m: 'revenue'});
    return `<b>Kết luận:</b> biên gộp TTM ${qLabel(D.periods[S.end])}: ${g.map(x => `${esc(gname(x))} ${nf(x.v, 1)}%`).join(', ')}; biên EBIT: ${e.map(x => `${esc(x.l)} ${nf(x.v, 1)}%`).join(', ')}. Hãng bay biên mỏng nên nhạy với nhiên liệu, tỷ giá; cảng biên cao, chi phí chủ yếu là khấu hao.`; });
  // Chart 1: biên theo thời gian
  const c1 = card('hk-fin-margin', 'Biên lợi nhuận theo thời gian (%)', 'Biên gộp, EBITDA, EBIT, LNST trên doanh thu · chọn nhóm'); let g1 = 'all'; const p1 = groupPicker(c1, () => g1, (v, q) => { g1 = v; if (!q) draw1(); });
  function draw1() { p1(); const x = scopeOf(g1), L = E.labels(S.mode), r = n => E.ratio({m: n}, {m: 'revenue'}, x, S.mode, 100).values;
    chart(c1.host, 'hk-fin-margin', L, [['gross', 'Biên gộp'], ['ebitda', 'Biên EBITDA'], ['ebit', 'Biên EBIT'], ['npat', 'Biên LNST']].map(([m, n], k) => ({name: n, color: LINE[k], values: r(m)})), {unit: '%', digits: 1, zeroBase: false});
    foot(c1, `tổng lợi nhuận ÷ tổng doanh thu, ${modeName(S.mode)}; cùng tập doanh nghiệp có đủ tử và mẫu`); }
  renders.push(draw1);
  // Chart cầu nối "Từ doanh thu đến lợi nhuận sau thuế" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Chart 3: cơ cấu chi phí trên 100 đồng doanh thu
  const c3 = card('hk-fin-cost', 'Cơ cấu chi phí trên 100 đồng doanh thu', 'Theo nhóm, kỳ chốt · giá vốn trừ khấu hao, khấu hao, bán hàng & QLDN, lãi vay, thuế, lợi nhuận còn lại');
  function draw3() { const mode = S.mode === 'y' ? 'y' : 'ttm', i = endIdx(mode), x = sel();
    const ms = ['revenue', 'opex_other', 'da', 'sga', 'interest', 'tax', 'npat'], pv = Object.fromEntries(ms.map(m => [m, E.per(m, x, mode)]));
    const gs = D.groups.filter(g => S.groups.includes(g.id)), row = g => { const ts = x.filter(t => E.groupOf[t] === g.id && ms.every(m => fin(pv[m][t][i]))), T = m => ts.reduce((a, t) => a + pv[m][t][i], 0), r = T('revenue'); return r ? ms.slice(1).map(m => T(m) / r * 100) : ms.slice(1).map(() => null); };
    const R = gs.map(row), names = ['Giá vốn trừ khấu hao', 'Khấu hao', 'Bán hàng & QLDN', 'Lãi vay', 'Thuế TNDN', 'LNST'], cols = ['#9AA3BD', '#3d4653', '#8997D6', '#c98a00', '#861C52', '#2938A8'];
    const m = {key: 'hk-fin-cost', categories: gs.map(g => g.label), series: names.map((n, k) => ({name: n, color: cols[k], values: R.map(r => fin(r[k]) ? Math.round(r[k] * 10) / 10 : null)})), unit: 'đồng', digits: 1, stackable: true, native: 'stack', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c3.host, m, () => { c3.host.innerHTML = ChartTypes.render(m, 'stack'); });
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; khoản còn lại (thu nhập tài chính, liên kết, khác, chi phí tài chính ngoài lãi vay, chênh lệch tỷ giá) không vẽ nên tổng có thể khác 100; chưa tách chi phí nhiên liệu, thuê tàu (cần thuyết minh BCTC)`); }
  renders.push(draw3);
  // Chart "Khấu hao và chi phí tài trợ so với doanh thu, EBITDA" bỏ 25/11/2026 theo yêu cầu người dùng.
  s.append(grid2(c1, c3));
  return s;
}

/* ---------- 1.3 CAPEX và hình thành tài sản ---------- */
function s73() {
  const s = section('1.3', 'Dòng vốn đầu tư đang đi vào đâu?', 'CAPEX tiền mặt theo nhóm, CAPEX/khấu hao, XDCB dở dang. ACV: XDCB dở dang tăng theo Long Thành (dự án thành phần 3 giải ngân 57% đến 25/11/2026). Hãng bay: chi đầu tư tiền mặt khác với đội tàu thuê hoạt động.', () => {
    const c = gv('capex'), cip = gv('cip', 'q'), tot = c.reduce((a, x) => a + (fin(x.v) ? x.v : 0), 0), top = c.slice().sort((a, b) => (b.v || 0) - (a.v || 0))[0];
    return `<b>Kết luận:</b> CAPEX tiền mặt TTM của rổ ${nf(tot)} tỷ đồng, ${esc(top.l)} chiếm ${nf(tot ? top.v / tot * 100 : null, 0)}%; XDCB dở dang cuối ${qLabel(D.periods[S.end])}: ${cip.map(x => `${esc(x.l)} ${nf(x.v)} tỷ`).join(', ')}.`; });
  // Chart 1: CAPEX theo nhóm
  const c1 = card('hk-fin-capex', 'CAPEX tiền mặt theo nhóm (tỷ đồng)', 'Tiền chi mua sắm, xây dựng TSCĐ (LCTT) · quy mô, so cùng kỳ, tỷ trọng'); let v1 = 'abs';
  seg(c1, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const b = E.byGroup('capex', sel(), S.mode), tot = b.labels.map((_, i) => b.groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0));
    chart(c1.host, 'hk-fin-capex-' + v1, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v1 === 'abs' ? g.values : v1 === 'yoy' ? (E.growth('capex', sel(), S.mode).groups.find(z => z.id === g.id)?.values || []) : g.values.map((v, i) => fin(v) && tot[i] ? v / tot[i] * 100 : null)})), {unit: v1 === 'abs' ? 'tỷ đ' : '%', digits: v1 === 'abs' ? 0 : 1, native: v1 === 'yoy' ? 'line' : 'stack', stackable: v1 !== 'yoy', zeroBase: v1 !== 'yoy'});
    foot(c1, `CAPEX tiền mặt ${modeName(S.mode)} (tiền chi mua sắm, xây dựng TSCĐ trên LCTT); không gồm tàu bay thuê hoạt động (VAS không ghi lên bảng cân đối, nghĩa vụ thuê chỉ có trong thuyết minh năm, chưa nạp); LCTT quý chỉ dùng năm có 4 quý khớp số năm`); }
  renders.push(draw1);
  // Chart 2: cường độ đầu tư
  const c2 = card('hk-fin-intensity', 'Cường độ đầu tư', 'CAPEX/khấu hao (đường 1 lần), CAPEX/doanh thu, CAPEX/tổng tài sản bình quân, CAPEX/CFO'); let g2 = 'all'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  function draw2() { p2(); const x = scopeOf(g2), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), R = (a, b, avg, sc = 1) => E.ratio({m: a}, {m: b, avg}, x, mode, sc).values;
    chart(c2.host, 'hk-fin-intensity', L, [{name: 'CAPEX/khấu hao (lần)', color: LINE[0], values: R('capex', 'da')}, {name: 'Mốc 1 lần', color: '#9AA3BD', values: L.map(() => 1)}, {name: 'CAPEX/doanh thu (lần)', color: LINE[2], values: R('capex', 'revenue')}, {name: 'CAPEX/tổng tài sản bình quân (lần)', color: LINE[1], values: R('capex', 'total_assets', true)}, {name: 'CAPEX/CFO (lần)', color: LINE[3], values: R('capex', 'cfo')}], {unit: 'lần', digits: 2});
    foot(c2, `${mode === 'y' ? 'năm' : 'TTM'}; CAPEX vượt khấu hao không đồng nghĩa toàn bộ là đầu tư mở rộng`); }
  renders.push(draw2);
  // Chart 3: XDCB dở dang
  const c3 = card('hk-fin-cip', 'XDCB dở dang theo nhóm', 'Vốn đã đầu tư nhưng tài sản chưa hoàn thành · giá trị, so cùng kỳ, so tổng tài sản, so TSCĐ hữu hình ròng'); let v3 = 'abs';
  seg(c3, 'Cách xem', [['abs', 'Tỷ đồng'], ['yoy', 'So cùng kỳ (%)'], ['ta', '% tổng tài sản'], ['ppe', '% TSCĐ ròng']], () => v3, k => { v3 = k; draw3(); });
  function draw3() { const mode = S.mode === 'y' ? 'y' : 'q', b = E.byGroup('cip', sel(), mode);
    if (v3 === 'abs' || v3 === 'yoy') chart(c3.host, 'hk-fin-cip-' + v3, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v3 === 'abs' ? g.values : (E.growth('cip', sel(), mode).groups.find(z => z.id === g.id)?.values || [])})), {unit: v3 === 'abs' ? 'tỷ đ' : '%', digits: v3 === 'abs' ? 0 : 1, native: v3 === 'abs' ? 'stack' : 'line', stackable: v3 === 'abs', zeroBase: v3 === 'abs'});
    else chart(c3.host, 'hk-fin-cip-' + v3, b.labels, D.groups.filter(g => S.groups.includes(g.id)).map(g => ({name: g.label, color: g.color, values: E.ratio({m: 'cip'}, {m: v3 === 'ta' ? 'total_assets' : 'ppe_net'}, scopeOf(g.id), mode, 100).values})), {unit: '%', digits: 1});
    foot(c3, `số dư cuối ${mode === 'y' ? 'năm' : 'quý'}`); }
  renders.push(draw3);
  // Chart "Hình thành tài sản: XDCB dở dang, TSCĐ và khấu hao" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Chart 5: tài trợ CAPEX
  const c5 = card('hk-fin-funding', 'CAPEX được tài trợ bằng nguồn nào? (tỷ đồng)', 'CFO, CAPEX, FCF, vay nợ ròng, vốn góp bằng tiền, cổ tức đã trả · và CFO/CAPEX');
  function draw5() { const x = sel(), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), T = m => E.total(m, x, mode).values, cr = E.ratio({m: 'cfo'}, {m: 'capex'}, x, mode).values;
    chart(c5.host, 'hk-fin-funding', L, [{name: 'CFO', color: LINE[0], values: T('cfo')}, {name: 'CAPEX', color: LINE[2], values: T('capex').map(v => fin(v) ? -v : null)}, {name: 'FCF', color: LINE[1], values: T('fcf')}, {name: 'Vay nợ ròng', color: LINE[3], values: T('net_borrow')}, {name: 'Vốn góp bằng tiền', color: LINE[5], values: T('equity_raised')}, {name: 'Cổ tức đã trả', color: LINE[4], values: T('dividends').map(v => fin(v) ? -v : null)}], {unit: 'tỷ đ', native: 'bar'});
    foot(c5, `${mode === 'y' ? 'năm' : 'TTM'}; FCF = CFO − CAPEX tiền mặt; CAPEX và cổ tức vẽ số âm (tiền ra); không phải toàn bộ biến động tiền (còn đầu tư tài chính, tỷ giá…)`); }
  renders.push(draw5);
  // Chart "Mức hao mòn kế toán của nền tài sản" bỏ 25/11/2026 theo yêu cầu người dùng.
  // Chart "Vốn mới đang vào đâu so với nơi tạo lợi nhuận và dòng tiền?" bỏ 25/11/2026 theo yêu cầu người dùng.
  s.append(grid2(c1, c2), grid2(c3, c5));
  return s;
}

/* ---------- 1.4 Phải thu và chất lượng dòng tiền ---------- */
function s74() {
  const s = section('1.4', 'Lợi nhuận có chuyển thành tiền?', 'CFO đặt cạnh LNST theo nhóm và theo mã; CFO/LNST, CFO/EBITDA, biên CFO; phải thu và số ngày thu tiền. Hãng bay thu tiền vé trước khi bay nên CFO thường cao hơn LNST mùa cao điểm.', () => {
    const r = gr({m: 'cfo'}, {m: 'npat'}, 1, 'ttm', {posDen: true});
    return `<b>Kết luận:</b> CFO/LNST TTM ${qLabel(D.periods[S.end])}: ${r.map(x => `${esc(gname(x))} ${fin(x.v) ? nf(x.v, 2) + ' lần' : 'N/A (LNST không dương)'}`).join(', ')}.`; });
  const c1 = card('hk-fin-recv', 'Phải thu khách hàng theo nhóm (tỷ đồng)', 'Số dư cuối kỳ · giá trị hoặc so cùng kỳ'); let v1 = 'abs';
  seg(c1, 'Cách xem', [['abs', 'Tỷ đồng'], ['yoy', 'So cùng kỳ (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const mode = S.mode === 'y' ? 'y' : 'q', b = E.byGroup('receivables', sel(), mode);
    chart(c1.host, 'hk-fin-recv-' + v1, b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: v1 === 'abs' ? g.values : (E.growth('receivables', sel(), mode).groups.find(z => z.id === g.id)?.values || [])})), {unit: v1 === 'abs' ? 'tỷ đ' : '%', digits: v1 === 'abs' ? 0 : 1, native: v1 === 'abs' ? 'stack' : 'line', stackable: v1 === 'abs', zeroBase: v1 === 'abs'});
    foot(c1, 'phải thu khách hàng ngắn hạn'); }
  renders.push(draw1);
  const c2 = card('hk-fin-dso', 'Số ngày thu tiền bình quân (DSO) theo nhóm (ngày)', 'Phải thu khách hàng bình quân ÷ doanh thu TTM × 365');
  function draw2() { const mode = S.mode === 'y' ? 'y' : 'ttm', L = E.labels(mode);
    chart(c2.host, 'hk-fin-dso', L, D.groups.filter(g => S.groups.includes(g.id)).map(g => ({name: g.label, color: g.color, values: E.ratio({m: 'receivables', avg: true}, {m: 'revenue'}, scopeOf(g.id), mode, 365).values})), {unit: 'ngày'});
    foot(c2, 'DSO của toàn doanh nghiệp'); }
  renders.push(draw2);
  const c3 = card('hk-fin-conversion', 'Lợi nhuận chuyển thành tiền đến đâu?', 'CFO/EBITDA, CFO/LNST (lần) và biên CFO (%) · chọn nhóm'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), R = (a, b, sc = 1) => E.ratio({m: a}, {m: b}, x, mode, sc).values;
    chart(c3.host, 'hk-fin-conversion', L, [{name: 'CFO/EBITDA (lần)', color: LINE[0], values: E.ratio({m: 'cfo'}, {m: 'ebitda'}, x, mode, 1, {posDen: true}).values}, {name: 'CFO/LNST (lần)', color: LINE[2], values: E.ratio({m: 'cfo'}, {m: 'npat'}, x, mode, 1, {posDen: true}).values}, {name: 'Biên CFO (%) ÷ 100', color: LINE[1], values: R('cfo', 'revenue')}], {unit: 'lần', digits: 2});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; biên CFO vẽ dạng tỷ lệ (0,2 = 20%); để trống (N/A) khi EBITDA hoặc LNST của tập mã không dương`); }
  renders.push(draw3);
  // CFO cạnh LNST theo nhóm / theo mã (kỳ chốt).
  const c4 = card('hk-fin-cfo-npat', 'CFO đặt cạnh LNST (tỷ đồng)', 'Kỳ chốt, TTM hoặc năm · theo nhóm hoặc từng mã'); let v4 = 'group';
  seg(c4, 'Đơn vị', [['group', 'Nhóm'], ['firm', 'Mã']], () => v4, k => { v4 = k; draw4(); });
  function draw4() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'ttm', i = endIdx(mode);
    let cats, a, b;
    if (v4 === 'firm') { const pc = E.per('cfo', x, mode), pn = E.per('npat', x, mode); cats = x; a = x.map(t => pc[t][i]); b = x.map(t => pn[t][i]); }
    else { const gs = D.groups.filter(g => S.groups.includes(g.id)), bc = E.byGroup('cfo', x, mode).groups, bn = E.byGroup('npat', x, mode).groups; cats = gs.map(g => { const ts = x.filter(t => E.groupOf[t] === g.id); return ts.length === 1 ? `${g.label} (${ts[0]})` : g.label; }); a = gs.map(g => bc.find(z => z.id === g.id)?.values[i] ?? null); b = gs.map(g => bn.find(z => z.id === g.id)?.values[i] ?? null); }
    const m = {key: 'hk-fin-cfo-npat-' + v4, categories: cats, series: [{name: 'CFO', color: LINE[0], values: a.map(v => fin(v) ? Math.round(v) : null)}, {name: 'LNST', color: LINE[2], values: b.map(v => fin(v) ? Math.round(v) : null)}], unit: 'tỷ đ', digits: 0, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c4.host, m, () => { c4.host.innerHTML = ChartTypes.render(m, 'bar'); });
    foot(c4, `${mode === 'y' ? 'năm' : 'TTM'} ${qLabel(E.labels(mode)[i] || '')}; ô trống là mã thiếu LCTT kỳ đó (năm LCTT quý lệch số năm để trống)`); }
  renders.push(draw4);
  s.append(grid2(c4, c3), grid2(c1, c2));
  return s;
}

/* ---------- 1.5 Đòn bẩy và phân bổ dòng tiền ---------- */
function s75() {
  const s = section('1.5', 'Ai đang dùng tiền tự tạo ra và ai đang cần thêm vốn?', 'CFO, CAPEX, FCF, vay nợ ròng, vốn góp, cổ tức theo nhóm; cơ cấu nợ vay, đòn bẩy, chi phí lãi vay. Nợ vay = vay và nợ thuê tài chính (đã gồm thuê tài chính tàu bay); thuê hoạt động không nằm trong nợ vay, không cộng thêm.', () => {
    const f = gv('fcf'), nd = gv('net_debt', 'q');
    return `<b>Kết luận:</b> FCF TTM ${qLabel(D.periods[S.end])}: ${f.map(x => `${esc(x.l)} ${nf(x.v)} tỷ`).join(', ')}; nợ vay ròng cuối kỳ: ${nd.map(x => `${esc(x.l)} ${nf(x.v)} tỷ`).join(', ')} (số âm là tiền ròng).`; });
  const c1 = card('hk-fin-debt', 'Cơ cấu nợ vay (tỷ đồng)', 'Nợ vay ngắn hạn, dài hạn (cột chồng); tiền & đầu tư ngắn hạn, nợ vay ròng (đường)');
  function draw1() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'q', L = E.labels(mode), T = m => E.total(m, x, mode).values;
    chart(c1.host, 'hk-fin-debt', L, [{name: 'Nợ vay ngắn hạn', color: '#8997D6', values: T('st_debt')}, {name: 'Nợ vay dài hạn', color: '#1D2678', values: T('lt_debt')}, {name: 'Tiền & đầu tư ngắn hạn', color: '#2a9fa3', values: T('cash_all'), kind: 'line'}, {name: 'Nợ vay ròng', color: '#c98a00', values: T('net_debt'), kind: 'line'}], {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c1, 'nợ vay chịu lãi = vay và nợ thuê tài chính (gồm thuê tài chính tàu bay), không gồm nghĩa vụ thuê hoạt động; nợ vay ròng = nợ vay − tiền − đầu tư tài chính ngắn hạn'); }
  renders.push(draw1);
  const c2 = card('hk-fin-leverage', 'Đòn bẩy tài chính', 'Nợ vay/VCSH, nợ vay ròng/EBITDA TTM, nợ vay/tổng tài sản, nợ ngắn hạn/tổng nợ vay'); let g2 = 'all'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  function draw2() { p2(); const x = scopeOf(g2), L = D.periods, R = (a, b, md = 'q') => E.ratio({m: a}, {m: b}, x, md).values;
    chart(c2.host, 'hk-fin-leverage', L, [{name: 'Nợ vay/VCSH', color: LINE[0], values: R('debt', 'equity')}, {name: 'Nợ vay ròng/EBITDA TTM', color: LINE[2], values: E.ratio({m: 'net_debt'}, {m: 'ebitda'}, x, 'ttm', 1, {posDen: true}).values}, {name: 'Nợ vay/tổng tài sản', color: LINE[1], values: R('debt', 'total_assets')}, {name: 'Nợ ngắn hạn/tổng nợ vay', color: LINE[3], values: R('st_debt', 'debt')}], {unit: 'lần', digits: 2});
    foot(c2, 'hệ số tính từ tổng; nợ vay ròng/EBITDA để trống (N/A) khi EBITDA TTM của tập mã không dương; HVN có VCSH âm đến Q3/2024 nên nợ vay/VCSH nhóm hãng bay các kỳ đó cần đọc thận trọng'); }
  renders.push(draw2);
  const c3 = card('hk-fin-interest', 'Chi phí vay và khả năng trả lãi', 'Chi phí lãi vay TTM (tỷ đ), lãi vay/nợ vay bình quân (%), EBIT và EBITDA trên lãi vay (lần)'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    chart(c3.host, 'hk-fin-interest', L, [{name: 'Lãi vay/nợ vay bình quân (%)', color: LINE[3], values: E.ratio({m: 'interest'}, {m: 'debt', avg: true}, x, mode, 100).values}, {name: 'EBIT/lãi vay (lần)', color: LINE[0], values: E.ratio({m: 'ebit'}, {m: 'interest'}, x, mode).values}, {name: 'EBITDA/lãi vay (lần)', color: LINE[1], values: E.ratio({m: 'ebitda'}, {m: 'interest'}, x, mode).values}], {unit: '', digits: 1});
    foot(c3, 'lãi vay/nợ vay bình quân là chi phí vay ghi nhận ước tính, không phải lãi suất hợp đồng; chưa tách lãi vay vốn hóa'); }
  renders.push(draw3);
  const c4 = card('hk-fin-fcf', 'Dòng tiền tự do và phân phối cho cổ đông', 'Theo nhóm, kỳ chốt: CFO, CAPEX, FCF, vay nợ ròng, vốn góp bằng tiền, cổ tức đã trả (tỷ đ)');
  function draw4() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'ttm', i = endIdx(mode), gs = D.groups.filter(g => S.groups.includes(g.id));
    const v = (m, g) => { const b = E.byGroup(m, x, mode).groups.find(z => z.id === g.id); return b && fin(b.values[i]) ? Math.round(b.values[i]) : null; };
    const ms = [['cfo', 'CFO', LINE[0], 1], ['capex', 'CAPEX', LINE[2], -1], ['fcf', 'FCF', LINE[1], 1], ['net_borrow', 'Vay nợ ròng', LINE[3], 1], ['equity_raised', 'Vốn góp bằng tiền', LINE[5], 1], ['dividends', 'Cổ tức đã trả', LINE[4], -1]];
    const m = {key: 'hk-fin-fcf', categories: gs.map(g => g.label), series: ms.map(([k, n, c, sgn]) => ({name: n, color: c, values: gs.map(g => { const a = v(k, g); return fin(a) ? a * sgn : null; })})), unit: 'tỷ đ', digits: 0, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c4.host, m, () => { c4.host.innerHTML = ChartTypes.render(m, 'bar'); });
    foot(c4, `${mode === 'y' ? 'năm' : 'TTM'} ${qLabel(E.labels(mode)[i] || '')}; CAPEX và cổ tức vẽ số âm (tiền ra)`); }
  renders.push(draw4);
  const c5 = card('hk-fin-levdist', 'Phân bố doanh nghiệp theo mức đòn bẩy', 'Số doanh nghiệp theo nợ vay ròng/EBITDA TTM');
  function draw5() { const x = sel(), L = D.periods, nd = E.per('net_debt', x, 'q'), eb = E.per('ebitda', x, 'ttm');
    const cnt = f => L.map((_, i) => { const ts = x.filter(t => fin(nd[t][i]) && fin(eb[t][i])); return ts.length ? ts.filter(t => f(nd[t][i], eb[t][i])).length : null; });
    chart(c5.host, 'hk-fin-levdist', L, [{name: 'Tiền ròng', color: '#2a9fa3', values: cnt(n => n <= 0)}, {name: '0–2 lần', color: '#8997D6', values: cnt((n, e) => n > 0 && e > 0 && n / e <= 2)}, {name: '2–4 lần', color: '#2938A8', values: cnt((n, e) => n > 0 && e > 0 && n / e > 2 && n / e <= 4)}, {name: 'Trên 4 lần', color: '#1D2678', values: cnt((n, e) => n > 0 && e > 0 && n / e > 4)}, {name: 'EBITDA không dương', color: '#c98a00', values: cnt((n, e) => n > 0 && e <= 0)}], {unit: 'DN', native: 'stack', stackable: true});
    foot(c5, 'công cụ xem mức độ tập trung, không phải xếp hạng tín dụng'); }
  renders.push(draw5);
  s.append(c4.el, grid2(c1, c2), grid2(c3, c5), drill('hk-61', 'Chi tiết từng mã: nợ vay ròng và chi phí lãi vay theo quý'));
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
  const s = section('1.6', 'Vốn đầu tư đang sinh lời thế nào?', 'ROE, ROA, ROIC theo nhóm; DuPont (biên ròng × vòng quay tài sản × đòn bẩy); bản đồ ROIC – đòn bẩy. Để trống (N/A) khi VCSH bình quân hoặc vốn đầu tư không dương, hoặc EBITDA không dương với nợ vay ròng/EBITDA.', () => {
    const r = gr({m: 'npat'}, {m: 'equity', avg: true}, 100, 'ttm', {posDen: true});
    return `<b>Kết luận:</b> ROE TTM ${qLabel(D.periods[S.end])}: ${r.map(x => `${esc(gname(x))} ${fin(x.v) ? nf(x.v, 1) + '%' : 'N/A (VCSH bình quân không dương)'}`).join(', ')}.`; });
  const c1 = card('hk-fin-returns', 'ROE, ROA, ROIC (%)', 'TTM hoặc năm · chọn nhóm · đường mảnh là bình quân lịch sử của chính chỉ tiêu'); let g1 = 'all'; const p1 = groupPicker(c1, () => g1, (v, q) => { g1 = v; if (!q) draw1(); });
  function draw1() { p1(); const x = scopeOf(g1), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), roe = E.ratio({m: 'npat'}, {m: 'equity', avg: true}, x, mode, 100, {posDen: true}).values, roa = E.ratio({m: 'npat'}, {m: 'total_assets', avg: true}, x, mode, 100).values, ri = roic(x, mode).values;
    const avg = v => { const a = v.filter(fin); return a.length ? a.reduce((s, z) => s + z, 0) / a.length : null; };
    chart(c1.host, 'hk-fin-returns', L, [{name: 'ROE', color: LINE[0], values: roe}, {name: 'ROA', color: LINE[1], values: roa}, {name: 'ROIC', color: LINE[2], values: ri}, {name: 'ROE bình quân', color: '#9AA3BD', values: L.map(() => avg(roe))}, {name: 'ROIC bình quân', color: '#e3c98a', values: L.map(() => avg(ri))}], {unit: '%', digits: 1, zeroBase: false});
    foot(c1, 'ROE để trống khi VCSH bình quân không dương (HVN đến 2024); ROE = LNST hợp nhất ÷ VCSH (gồm lợi ích CĐKKS) bình quân; ROIC = EBIT × (1 − thuế suất hiệu dụng, tối đa 30%) ÷ (VCSH + nợ vay − tiền − đầu tư ngắn hạn) bình quân'); }
  renders.push(draw1);
  const c2 = card('hk-fin-dupont', 'Phân rã ROE (DuPont)', 'Biên LNST × vòng quay tài sản × đòn bẩy (tổng tài sản/VCSH) · chọn nhóm'); let g2 = 'all'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  function draw2() { p2(); const x = scopeOf(g2), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    // Cùng tập doanh nghiệp có đủ LNST, doanh thu, tài sản bình quân, VCSH bình quân
    const n = E.per('npat', x, mode), r = E.per('revenue', x, mode), a = E.per('total_assets', x, mode, true), q = E.per('equity', x, mode, true);
    const parts = L.map((_, i) => { const ts = x.filter(t => [n, r, a, q].every(z => fin(z[t][i]))); if (!ts.length) return null; const S2 = z => ts.reduce((s, t) => s + z[t][i], 0), N = S2(n), R = S2(r), A = S2(a), Qv = S2(q); return R && A && Qv > 0 ? {m: N / R * 100, t: R / A, l: A / Qv, roe: N / Qv * 100} : null; });
    chart(c2.host, 'hk-fin-dupont', L, [{name: 'ROE (%)', color: LINE[0], values: parts.map(p => p?.roe ?? null)}, {name: 'Biên LNST (%)', color: LINE[2], values: parts.map(p => p?.m ?? null)}, {name: 'Vòng quay tài sản (lần)', color: LINE[1], values: parts.map(p => p?.t ?? null)}, {name: 'Đòn bẩy (lần)', color: LINE[3], values: parts.map(p => p?.l ?? null)}], {unit: '', digits: 2, zeroBase: false});
    foot(c2, 'ROE = biên × vòng quay × đòn bẩy, cùng tập doanh nghiệp, tài sản và VCSH bình quân; để trống khi VCSH bình quân không dương'); }
  renders.push(draw2);
  const c3 = card('hk-fin-roic-cycle', 'ROIC và chu kỳ vốn', 'ROIC (%), CAPEX/khấu hao (lần), XDCB dở dang/tổng tài sản (%) · chọn nhóm'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    const cipTa = mode === 'y' ? E.ratio({m: 'cip'}, {m: 'total_assets'}, x, 'y', 100).values : E.ratio({m: 'cip'}, {m: 'total_assets'}, x, 'q', 100).values;
    chart(c3.host, 'hk-fin-roic-cycle', L, [{name: 'ROIC (%)', color: LINE[0], values: roic(x, mode).values}, {name: 'CAPEX/khấu hao (lần)', color: LINE[2], values: E.ratio({m: 'capex'}, {m: 'da'}, x, mode).values}, {name: 'XDCB dở dang/tổng tài sản (%)', color: LINE[1], values: cipTa}], {unit: '', digits: 1});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; đặt cạnh nhau để phân biệt ROIC thấp do vận hành với ROIC thấp khi dự án đang xây`); }
  renders.push(draw3);
  const c4 = card('hk-fin-map', 'Bản đồ hiệu quả vốn', 'Trục ngang: nợ vay ròng/EBITDA TTM · trục dọc: ROIC TTM · kích thước: vốn đầu tư'); let v4 = 'group';
  seg(c4, 'Đơn vị', [['group', 'Nhóm'], ['firm', 'Mã']], () => v4, k => { v4 = k; draw4(); });
  function draw4() { const x = sel(), i = S.end, ri = roic(x, 'ttm'), ndp = E.per('net_debt', x, 'q'), ebp = E.per('ebitda', x, 'ttm'), icp = E.per('ic', x, 'q');
    let pts;
    if (v4 === 'firm') pts = x.map(t => ({l: t, c: GC[E.groupOf[t]], x: fin(ndp[t][i]) && fin(ebp[t][i]) && ebp[t][i] > 0 ? ndp[t][i] / ebp[t][i] : null, y: ri.each[t][i], s: icp[t][i]})).filter(p => fin(p.x) && fin(p.y) && fin(p.s) && p.s > 0);
    else pts = D.groups.filter(g => S.groups.includes(g.id)).map(g => { const ts = x.filter(t => E.groupOf[t] === g.id); const r = roic(ts, 'ttm').values[i], nd = E.ratio({m: 'net_debt'}, {m: 'ebitda'}, ts, 'ttm').values[i], ic = E.total('ic', ts, 'q').values[i]; return {l: g.label, c: g.color, x: nd, y: r, s: ic}; }).filter(p => fin(p.x) && fin(p.y) && fin(p.s) && p.s > 0);
    c4.host.innerHTML = bubble(pts);
    foot(c4, `${qLabel(D.periods[i])}; doanh nghiệp EBITDA âm không vẽ`); }
  renders.push(draw4);
  const c5 = card('hk-fin-pool', 'Vốn đầu tư so với lợi nhuận tạo ra', 'Tỷ trọng từng nhóm trong vốn đầu tư và trong EBIT TTM · kỳ chốt');
  function draw5() { const x = sel(), i = S.end, gs = D.groups.filter(g => S.groups.includes(g.id)), ic = E.byGroup('ic', x, 'q').groups, eb = E.byGroup('ebit', x, 'ttm').groups;
    const sh = arr => { const v = gs.map(g => { const z = arr.find(a => a.id === g.id); return z && fin(z.values[i]) ? z.values[i] : null; }); const tot = v.reduce((a, b) => a + (fin(b) && b > 0 ? b : 0), 0); return v.map(z => fin(z) && tot ? z / tot * 100 : null); };
    const a = sh(ic), b = sh(eb);
    const m = {key: 'hk-fin-pool', categories: gs.map(g => g.label), series: [{name: 'Tỷ trọng vốn đầu tư', color: '#9AA3BD', values: a.map(v => fin(v) ? Math.round(v * 10) / 10 : null)}, {name: 'Tỷ trọng EBIT TTM', color: '#1D2678', values: b.map(v => fin(v) ? Math.round(v * 10) / 10 : null)}], unit: '%', digits: 1, native: 'bar', time: false, zeroBase: true};
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
    return download(`hang-khong-tai-chinh-doanh-nghiep-${stamp}.csv`, rows); }
  if (kind === 'group') { const rows = [['group', 'period', 'period_type', 'metric_id', 'metric_name', 'value', 'unit', 'companies_with_data', 'companies_in_group', 'source', 'method']];
    ['revenue', 'gross', 'ebitda', 'ebit', 'npat', 'da', 'cfo', 'capex', 'fcf', 'cip', 'ppe_net', 'ppe_gross', 'receivables', 'debt', 'net_debt', 'equity', 'total_assets', 'interest', 'dividends'].forEach(m => {
      const mode = E.kind[m] === 'stock' ? (S.mode === 'y' ? 'y' : 'q') : S.mode, b = E.byGroup(m, x, mode);
      b.groups.forEach(g => b.labels.forEach((p, i) => { if (g.values[i] != null) rows.push([g.label, p, mode, m, ITEMN[m], Math.round(g.values[i] * 100) / 100, 'tỷ đồng', g.cov[i], g.tickers.length, D.source, 'tổng doanh nghiệp đủ số; loại trùng công ty mẹ − con khi cùng được chọn']); })); });
    return download(`hang-khong-tai-chinh-nhom-${S.mode}-${stamp}.csv`, rows); }
  if (kind === 'ratio') { const rows = [['scope', 'period', 'period_type', 'ratio', 'value', 'unit', 'companies_with_data', 'median', 'p25', 'p75', 'formula']];
    const mode = S.mode === 'q' ? 'ttm' : S.mode, defs = [['ROE', {m: 'npat'}, {m: 'equity', avg: true}, 100, '%', 'LNST ÷ VCSH bình quân'], ['ROA', {m: 'npat'}, {m: 'total_assets', avg: true}, 100, '%', 'LNST ÷ tổng tài sản bình quân'], ['Biên gộp', {m: 'gross'}, {m: 'revenue'}, 100, '%', 'LN gộp ÷ doanh thu'], ['Biên EBITDA', {m: 'ebitda'}, {m: 'revenue'}, 100, '%', 'EBITDA ÷ doanh thu'], ['Biên EBIT', {m: 'ebit'}, {m: 'revenue'}, 100, '%', 'EBIT ÷ doanh thu'], ['Biên LNST', {m: 'npat'}, {m: 'revenue'}, 100, '%', 'LNST ÷ doanh thu'], ['Nợ vay ròng/EBITDA', {m: 'net_debt'}, {m: 'ebitda'}, 1, 'lần', 'nợ vay ròng cuối kỳ ÷ EBITDA'], ['CAPEX/khấu hao', {m: 'capex'}, {m: 'da'}, 1, 'lần', 'CAPEX ÷ khấu hao'], ['CFO/EBITDA', {m: 'cfo'}, {m: 'ebitda'}, 1, 'lần', 'CFO ÷ EBITDA'], ['DSO', {m: 'receivables', avg: true}, {m: 'revenue'}, 365, 'ngày', 'phải thu KH bình quân ÷ doanh thu × 365']];
    [['all', 'Nhóm đang chọn', x], ...D.groups.filter(g => S.groups.includes(g.id)).map(g => [g.id, g.label, scopeOf(g.id)])].forEach(([, name, ts]) => defs.forEach(([n, a, b, sc, u, f]) => { const r = E.ratio(a, b, ts, mode, sc); r.labels.forEach((p, i) => { if (r.values[i] != null) rows.push([name, p, mode, n, Math.round(r.values[i] * 1000) / 1000, u, r.cov[i], r.dist[i].med, r.dist[i].p25, r.dist[i].p75, f]); }); }));
    return download(`hang-khong-tai-chinh-he-so-${mode}-${stamp}.csv`, rows); }
  const rows = [['ticker', 'subsector', 'in_default_universe', 'note', 'consolidated_into', 'since']];
  D.companies.forEach(c => { const g = D.groups.find(z => z.id === c.group); const p = (D.consolidation || []).find(z => z.child === c.ticker); rows.push([c.ticker, g?.label, g?.default ? 'có' : 'không', c.note || '', p?.parent || '', p?.since || '']); });
  rows.push([], ['methodology']); ['Tổng tuyệt đối = tổng doanh nghiệp có số; hệ số = tổng tử ÷ tổng mẫu cùng tập doanh nghiệp.', 'TTM = tổng 4 quý liền; năm: KQKD = tổng 4 quý, LCTT = số báo cáo năm; số dư dùng cuối kỳ, bình quân = (cuối kỳ + cùng kỳ năm trước)/2.', 'EBIT = LN gộp − CP bán hàng − CP QLDN; EBITDA = EBIT + khấu hao (LCTT); CAPEX = tiền chi mua sắm, xây dựng TSCĐ; FCF = CFO − CAPEX.', 'LCTT quý dùng cho năm có tổng 4 quý khớp số năm (lệch ≤ 5%); năm lệch để trống.', 'Loại trùng hợp nhất: khi công ty mẹ và con cùng được chọn, công ty mẹ dùng số (mẹ − con).'].forEach(t => rows.push([t]));
  download(`hang-khong-tai-chinh-universe-${stamp}.csv`, rows);
}

/* ---------- Dựng ---------- */
function methods() {
  const d = el('details', 'card pf-method'); d.dataset.blockId = 'hk-fin-method'; d.dataset.updateKind = 'public'; d.dataset.cadence = 'quarterly'; d.dataset.refreshStatus = 'snapshot';
  d.innerHTML = `<summary><b>Phương pháp & tải dữ liệu</b> <small>BCTC hợp nhất · ${D.companies.length} doanh nghiệp · ${qLabel(D.periods[0])} – ${qLabel(D.periods.at(-1))}</small></summary>
    <ul class="pp-ul"><li>Tổng tuyệt đối = tổng các doanh nghiệp có số ở kỳ đó; doanh nghiệp thiếu số không được cộng, độ phủ ghi dưới mỗi chart.</li>
    <li>Hệ số = tổng tử số ÷ tổng mẫu số trên cùng tập doanh nghiệp có đủ cả hai; không lấy trung bình các hệ số.</li>
    <li>TTM = tổng 4 quý liền, đủ cả 4 quý. Năm: KQKD = tổng 4 quý, LCTT = số báo cáo năm (LCTT quý trên VNDirect trước 2024 không khớp số năm thì để trống). Số dư: cuối kỳ; bình quân = (cuối kỳ + cùng kỳ năm trước)/2.</li>
    <li>EBITDA = LN gộp − chi phí bán hàng − chi phí QLDN + khấu hao; FCF = CFO − tiền chi mua sắm TSCĐ; vốn đầu tư = VCSH + nợ vay − tiền − đầu tư ngắn hạn.</li>
    <li>Chưa loại trùng sở hữu giữa các mã (chưa đối chiếu báo cáo thường niên); rổ mặc định HVN, VJC, ACV không trùng nhau. Tổng của rổ có thể chứa giao dịch giữa các mắt xích (hãng bay trả phí cho ACV).</li><li>VJC: doanh thu, lợi nhuận hợp nhất gồm cả giao dịch bán và thuê lại tàu bay, không tách được theo quý. Nghĩa vụ thuê hoạt động tàu bay chỉ có ở thuyết minh năm, chưa nạp; nợ vay đã gồm thuê tài chính.</li><li>LCTT quý trên VNDirect là số riêng quý (tổng 4 quý khớp số năm); năm lệch hơn 5% để trống cả 4 quý.</li><li>Đã đối chiếu: VJC 9T/2026 doanh thu 74.385 tỷ, LNST 1.721 tỷ khớp bản tin IR; HVN 9T/2026 doanh thu 114.265 tỷ (báo nêu "hơn 114,5 nghìn tỷ", lệch nhỏ do làm tròn hoặc cách gộp).</li></ul>
    <div class="pf-ctl"><span class="pf-lb">Tải CSV</span>${[['raw', 'Số liệu từng doanh nghiệp'], ['group', 'Tổng theo nhóm (chu kỳ đang chọn)'], ['ratio', 'Hệ số theo nhóm'], ['universe', 'Danh mục doanh nghiệp & phương pháp']].map(([k, t]) => `<button type="button" class="pf-dl" data-x="${k}">${t}</button>`).join('')}</div>`;
  d.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', () => exportCsv(b.dataset.x)));
  const src = el('div', 'pw-src', `Nguồn: ${SRC}`); d.append(src);
  return d;
}
function redraw() { syncUrl(); renders.forEach(f => { try { f(); } catch (e) { document.documentElement.dataset.pfError = (document.documentElement.dataset.pfError || '') + e.message + ';'; console.error(e); } }); setTimeout(() => window.dispatchEvent(new Event('resize')), 60); }
function build(pane) {
  if (!pane || root) return; root = pane;
  style();
  const parts = [filterBar(), kpis(), s71(), s72(), s73(), s74(), s75(), s76(), methods()], nx = pane.querySelector(':scope > .rf-next');
  parts.forEach(n => nx ? pane.insertBefore(n, nx) : pane.append(n));
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
button.pf-tk[aria-pressed=false]{opacity:.45;text-decoration:line-through}.pf-method{margin-top:18px}.pf-method>summary{cursor:pointer}.pf-method>summary small{color:var(--muted,#7a8399);margin-left:8px}.pf-take{margin:0 0 10px;padding:8px 12px;border-left:3px solid #2938A8;background:#f3f5fd;border-radius:0 8px 8px 0;font-size:13px;line-height:1.55;color:var(--ink,#1d2333)}.pf-drill{margin-top:12px;border:1px solid var(--line,#e3e7f0);border-radius:10px;padding:8px 12px;background:var(--card,#fff)}.pf-drill>summary{cursor:pointer;font-weight:700;font-size:13px;color:#1D2678}.pf-drill>.card{margin-top:10px!important;box-shadow:none}.pf-dl{border:1px solid var(--line,#d6dbe8);background:var(--card,#fff);border-radius:7px;padding:4px 10px;font:600 12px Inter,sans-serif;cursor:pointer}@media (max-width:640px){.pf-grid{grid-template-columns:1fr;gap:4px}.pf-gtable td:first-child{width:auto;white-space:normal}}.pf-lb{font:600 11.5px Inter,sans-serif;color:var(--muted,#7a8399);text-transform:uppercase;letter-spacing:.04em}
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
@media (max-width:640px){.pf-hm-r{grid-template-columns:38px repeat(4,minmax(0,1fr)) 54px;font-size:10.5px}.pf-hm-r span{padding:5px 1px}.pf-take{font-size:12.5px}}`;
  document.head.append(st);
}
window.AviationFinance = {build, engine: E, state: S};
function tryBuild() { const p = document.getElementById('rf-mt14-sector'), mp = p?.closest('.majorpane'); if (!p || root || p.hidden || !mp || mp.hidden) return; build(p); }
['rf:frame', 'pv:toc', 'popstate', 'hashchange'].forEach(ev => window.addEventListener(ev, () => setTimeout(tryBuild, 30)));
document.addEventListener('click', e => { if (e.target.closest('.majortabbtn,.pp-tab,a[href*="mt14"]')) setTimeout(tryBuild, 60); });
})();
