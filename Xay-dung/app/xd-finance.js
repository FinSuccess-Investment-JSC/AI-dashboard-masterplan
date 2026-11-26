/* Xây dựng · tab lớn Tài chính ngành (#mt14) › 01 Tài chính ngành (26/11/2026, chép khung từ app/kcn-finance.js ← Dien/app/power-finance.js).
   Số từ window.XD_FIN (BCTC hợp nhất quý, VNDirect finfo; scripts/fetch_xd_financials.py + build_xd_financials.py), tổng hợp bằng
   window.IndustryFin (app/industry-fin.js). Dựng khi sub-tab mở lần đầu (xd-frame.js gọi XdFinance.build). Chỉ mô tả dữ liệu.
   Bốn nhóm theo yêu cầu 26/11/2026: Doanh thu & biên → Phải thu, ứng trước & dở dang → CFO & chuyển đổi tiền → Nợ, lãi vay & dòng tiền tự do.
   Bộ lọc chung: mô hình (nhóm doanh nghiệp), mã, chu kỳ Quý / TTM / Năm, kỳ chốt. Mỗi chart ghi loại số: phát sinh trong kỳ, số dư cuối kỳ
   hay TTM, và số mã có dữ liệu ở kỳ chốt. */
(() => {
'use strict';
const D = window.XD_FIN;
if (!D || !window.IndustryFin) return;
// Chỉ tiêu dẫn xuất riêng của nhà thầu (số dư): người mua trả tiền trước ngắn + dài hạn.
IndustryFin.DERIVED.adv_total = {kind: 'stock', name: 'Người mua trả tiền trước (ngắn + dài hạn)', f: r => r.adv_customers + r.adv_customers_lt, need: ['adv_customers', 'adv_customers_lt']};
IndustryFin.DERIVED.wc_tied = {kind: 'flow', name: 'Tiền giữ ở phải thu, tồn kho, phải trả (LCTT)', f: r => r.chg_receivables + r.chg_inventory + r.chg_payables, need: ['chg_receivables', 'chg_inventory', 'chg_payables']};
const E = IndustryFin.create(D);
const fin = v => typeof v === 'number' && Number.isFinite(v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const qLabel = p => /Q\d$/.test(p) ? `Q${p.slice(-1)}/${p.slice(0, 4)}` : p;
const SRC = `<a href="https://api-finfo.vndirect.com.vn/v4/financial_statements" target="_blank" rel="noopener">BCTC hợp nhất theo quý (VNDirect finfo)</a>`;
const LINE = ['#1D2678', '#2a9fa3', '#c98a00', '#861C52', '#3d4653', '#8997D6'];
const S = {groups: D.groups.filter(g => g.default).map(g => g.id), only: [], mode: 'ttm', end: D.periods.length - 1};
const sel = () => E.tickersOf(S.groups).filter(t => !S.only.length || S.only.includes(t));
const MODES = [['q', 'Quý'], ['ttm', 'TTM'], ['y', 'Năm']];
const modeName = m => ({q: 'phát sinh trong quý', ttm: 'TTM (tổng 4 quý gần nhất)', y: 'phát sinh trong năm'})[m];
const renders = [];
let root = null;

/* ---------- Khung card, chart, nút chọn ---------- */
function card(id, title, sub) {
  const c = el('div', 'card pp-card pf-card'); c.dataset.blockId = id; c.dataset.updateKind = 'public'; c.dataset.cadence = 'quarterly'; c.dataset.refreshStatus = 'snapshot';
  c.innerHTML = `<div class="chart-title">${esc(title)}</div>${sub ? `<div class="chart-sub">${sub}</div>` : ''}<div class="pf-ctl"></div><div class="pp-host" id="${id}-host"></div><div class="pf-extra"></div>`;
  return {el: c, host: c.querySelector('.pp-host'), ctl: c.querySelector('.pf-ctl'), extra: c.querySelector('.pf-extra')};
}
function foot(c, note) {
  c.el.querySelectorAll(':scope > .pw-src, :scope > .pw-src-note').forEach(n => n.remove());
  c.el.append(el('div', 'pw-src', `Nguồn: ${SRC}; tự tính`));
  c.el.append(el('div', 'pw-src-note', `${note ? esc(note) + ' · ' : ''}cập nhật ${esc(D.captured.split('-').reverse().join('/'))}`));
}
function seg(c, name, opts, get, set) {
  const w = el('div', 'pf-seg pf-box' + (/Cách xem|Đơn vị/.test(name) ? ' pf-view' : '')); w.setAttribute('role', 'group'); w.setAttribute('aria-label', name);
  opts.forEach(([k, t]) => { const b = el('button', '', esc(t)); b.type = 'button'; b.dataset.k = k; b.setAttribute('aria-pressed', String(get() === k)); b.addEventListener('click', () => { set(k); w.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.k === k))); }); w.append(b); });
  c.ctl.append(w); return w;
}
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
// Độ phủ ở kỳ chốt: số mã có số / số mã đang chọn.
const cov = (m, mode) => { const x = sel(), r = E.total(m, x, mode), i = mode === 'y' ? endIdx('y') : S.end; return `${fin(r.cov?.[i]) ? r.cov[i] : 0}/${x.length} mã có số ở kỳ chốt ${qLabel(E.labels(mode)[i] || '')}`; };
function groupPicker(c, get, set) { const g = el('select', 'pf-sel'); c.ctl.append(g); g.addEventListener('change', () => set(g.value)); return () => { g.innerHTML = `<option value="all">Tất cả mô hình đang chọn</option>` + D.groups.filter(x => S.groups.includes(x.id)).map(x => `<option value="${x.id}"${x.id === get() ? ' selected' : ''}>${esc(x.label)}</option>`).join(''); if (get() !== 'all' && !S.groups.includes(get())) set('all', true); }; }
const scopeOf = gid => gid === 'all' ? sel() : sel().filter(t => E.groupOf[t] === gid);
const grpLines = (fn, mode) => D.groups.filter(g => S.groups.includes(g.id) && scopeOf(g.id).length).map(g => ({name: g.label, color: g.color, values: fn(scopeOf(g.id), mode)}));
function section(num, q, sub) {
  const s = el('section', 'pp-panel pp-q pf-sec'); s.innerHTML = `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(q)}</h3>${sub ? `<p class="kc-q-sub">${sub}</p>` : ''}</div></header>`;
  return s;
}
const grid2 = (...cards) => { const g = el('div', 'grid two g2 pf-g2'); cards.forEach(c => g.append(c.el)); return g; };

/* ---------- Thanh bộ lọc, KPI ---------- */
function filterBar() {
  const f = el('section', 'pf-filter');
  f.innerHTML = `<div class="pf-grid"><span class="pf-lb">Mô hình</span><div class="pf-chips" data-role="groups">${D.groups.map(g => `<button type="button" data-g="${g.id}" aria-pressed="${S.groups.includes(g.id)}"><i style="background:${g.color}"></i>${esc(g.label)} <small>${D.companies.filter(c => c.group === g.id).length}</small></button>`).join('')}</div>
    <span class="pf-lb">Mã</span><div class="pf-chips" data-role="tickers"></div>
    <span class="pf-lb">Chu kỳ</span><div class="pf-inline"><div class="pf-seg pf-box" data-role="mode">${MODES.map(([k, t]) => `<button type="button" data-m="${k}" aria-pressed="${S.mode === k}">${t}</button>`).join('')}</div>
    <span class="pf-lb">Kỳ chốt</span><select data-role="end">${D.periods.map((p, i) => `<option value="${i}"${i === S.end ? ' selected' : ''}>${qLabel(p)}</option>`).join('')}</select></div></div>
    <div class="pf-legend"></div>`;
  const tick = f.querySelector('[data-role=tickers]');
  const drawTick = () => { const all = E.tickersOf(S.groups); S.only = S.only.filter(t => all.includes(t));
    tick.innerHTML = `<button type="button" data-t="" aria-pressed="${!S.only.length}">Tất cả</button>` + all.map(t => { const c = D.companies.find(x => x.ticker === t); return `<button type="button" data-t="${t}" aria-pressed="${S.only.includes(t)}" title="${esc(c?.note || '')}">${t}${c?.mixed ? '*' : ''}</button>`; }).join('');
    tick.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { const t = b.dataset.t; S.only = !t ? [] : S.only.includes(t) ? S.only.filter(x => x !== t) : [...S.only, t]; drawTick(); redraw(); })); };
  drawTick();
  f.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => { const g = b.dataset.g; S.groups = S.groups.includes(g) ? S.groups.filter(x => x !== g) : [...S.groups, g]; if (!S.groups.length) S.groups = [g]; f.querySelectorAll('[data-g]').forEach(x => x.setAttribute('aria-pressed', String(S.groups.includes(x.dataset.g)))); drawTick(); redraw(); }));
  f.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { S.mode = b.dataset.m; f.querySelectorAll('[data-m]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.m === S.mode))); redraw(); }));
  f.querySelector('[data-role=end]').addEventListener('change', e => { S.end = +e.target.value; redraw(); });
  renders.push(() => { const s = sel(), have = s.filter(t => fin(D.data[t]?.revenue?.[S.end]));
    f.querySelector('.pf-legend').innerHTML = `<table class="pf-gtable"><thead><tr><th>Mô hình</th><th>Doanh nghiệp (dấu * là đa ngành)</th><th>Có BCTC ${qLabel(D.periods[S.end])}</th></tr></thead><tbody>${D.groups.map(g => { const on = S.groups.includes(g.id), ts = D.companies.filter(c => c.group === g.id);
        return `<tr class="${on ? '' : 'off'}"><td><i style="background:${g.color}"></i>${esc(g.label)}</td><td>${ts.map(c => `<span class="pf-tk" title="${esc(c.note || '')}">${c.ticker}${c.mixed ? '*' : ''}</span>`).join('')}</td><td>${on ? `${ts.filter(c => s.includes(c.ticker) && fin(D.data[c.ticker]?.revenue?.[S.end])).length}/${ts.filter(c => s.includes(c.ticker)).length}` : '—'}</td></tr>`; }).join('')}</tbody></table>
      <p class="pf-scope"><b>Thành phần rổ đang tính:</b> ${s.length} mã (${s.join(', ')}); ${have.length} mã có BCTC ${qLabel(D.periods[S.end])}${s.length > have.length ? ` (chưa có: ${s.filter(t => !have.includes(t)).join(', ')})` : ''}. Số tuyệt đối = tổng các mã có số ở kỳ đó; hệ số = tổng tử số ÷ tổng mẫu số trên cùng tập mã có đủ cả hai (không lấy trung bình các hệ số).</p>
      <p class="pf-note"><b>Loại số:</b> doanh thu, lợi nhuận, dòng tiền là số <b>phát sinh</b> trong kỳ (quý, năm) hoặc <b>TTM</b> (tổng 4 quý liền, đủ cả 4 quý); phải thu, ứng trước, tồn kho, nợ vay là <b>số dư cuối kỳ</b>. Số BCTC toàn doanh nghiệp, hợp nhất: mã đa ngành (*) gồm cả mảng ngoài xây dựng (VGC gồm khu công nghiệp; CII, HUT gồm bất động sản). LNST là số hợp nhất (gồm cổ đông không kiểm soát), số thuộc cổ đông công ty mẹ ở bảng Doanh nghiệp niêm yết. CTD có năm tài chính 1/7–30/6; dữ liệu ở đây theo quý dương lịch của BCTC quý. LCTT quý của năm có tổng 4 quý lệch số năm quá 5% để trống.</p>`; });
  return f;
}
function spark(vals) {
  const v = vals.slice(-12), xs = v.filter(fin); if (xs.length < 2) return '';
  const lo = Math.min(...xs), hi = Math.max(...xs), W = 120, H = 28, x = i => i * W / (v.length - 1), y = a => H - 3 - (a - lo) / ((hi - lo) || 1) * (H - 6);
  return `<svg class="pf-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${v.map((a, i) => fin(a) ? `${x(i).toFixed(1)},${y(a).toFixed(1)}` : null).filter(Boolean).join(' ')}"/></svg>`;
}
function kpis() {
  const g = el('section', 'grid kpis pp-kpis pf-kpis');
  renders.push(() => {
    const s = sel(), i = S.end, n = s.length;
    const T = m => E.total(m, s, 'ttm');
    const rev = T('revenue'), npat = T('npat'), gm = E.ratio({m: 'gross'}, {m: 'revenue'}, s, 'ttm', 100), adv = E.ratio({m: 'adv_total'}, {m: 'revenue'}, s, 'ttm'), cfo = T('cfo'), nd = E.ratio({m: 'net_debt'}, {m: 'ebitda'}, s, 'ttm');
    const ch = m => E.growth(m, s, 'ttm').values[i];
    const d4 = (r, dg = 1) => fin(r.values[i]) && fin(r.values[i - 4]) ? r.values[i] - r.values[i - 4] : null;
    const tile = (label, val, unit, dTxt, c, vals, kind) => `<div class="kpi pp-kpi"><div class="label l">${esc(label)}</div><div class="value v">${val}${unit ? `<small> ${esc(unit)}</small>` : ''}</div><div class="delta">${dTxt}</div>${spark(vals)}<div class="sub s">${esc(qLabel(D.periods[i]))} · ${esc(kind)} · ${c}/${n} mã có số</div></div>`;
    g.innerHTML = [
      tile('Doanh thu TTM', nf(rev.values[i]), 'tỷ đ', `${sg(ch('revenue'))}% so cùng kỳ`, rev.cov[i], rev.values, 'phát sinh, TTM'),
      tile('LNST TTM (hợp nhất)', nf(npat.values[i]), 'tỷ đ', `${sg(ch('npat'))}% so cùng kỳ`, npat.cov[i], npat.values, 'phát sinh, TTM'),
      tile('Biên gộp TTM', nf(gm.values[i], 1), '%', `${sg(d4(gm))} đ.p. so cùng kỳ`, gm.cov[i], gm.values, 'LN gộp ÷ doanh thu'),
      tile('Ứng trước / Doanh thu TTM', nf(adv.values[i], 2), 'lần', `${sg(d4(adv), 2)} lần so cùng kỳ`, adv.cov[i], adv.values, 'số dư ÷ TTM'),
      tile('CFO TTM', nf(cfo.values[i]), 'tỷ đ', `${sg(ch('cfo'))}% so cùng kỳ`, cfo.cov[i], cfo.values, 'phát sinh, TTM'),
      tile('Nợ vay ròng / EBITDA TTM', nf(nd.values[i], 2), 'lần', `${sg(d4(nd), 2)} lần so cùng kỳ`, nd.cov[i], nd.values, 'số dư ÷ TTM')
    ].join('');
  });
  return g;
}

/* ---------- 1.1 Doanh thu & biên ---------- */
const PNL = [['revenue', 'Doanh thu'], ['gross', 'Lợi nhuận gộp'], ['ebit', 'EBIT'], ['npat', 'LNST']];
function s1() {
  const s = section('1.1', 'Doanh thu và biên lợi nhuận đang đi về đâu, theo từng mô hình?', 'Số phát sinh: quý, TTM hoặc năm theo bộ lọc Chu kỳ.'); s.id = 'xd-fin-pnl-sec';
  const c1 = card('xd-fin-pnl', 'Doanh thu và lợi nhuận theo mô hình (tỷ đồng)', 'Cột chồng theo mô hình · đổi chỉ tiêu và cách xem'); let m1 = 'revenue', v1 = 'abs';
  seg(c1, 'Chỉ tiêu', PNL, () => m1, k => { m1 = k; draw1(); }); seg(c1, 'Cách xem', [['abs', 'Giá trị'], ['yoy', 'So cùng kỳ (%)'], ['share', 'Tỷ trọng (%)']], () => v1, k => { v1 = k; draw1(); });
  function draw1() { const b = E.byGroup(m1, sel(), S.mode), name = PNL.find(p => p[0] === m1)[1];
    if (v1 === 'abs') chart(c1.host, 'xd-fin-pnl-abs', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true});
    else if (v1 === 'yoy') chart(c1.host, 'xd-fin-pnl-yoy', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: E.growth(m1, sel(), S.mode).groups.find(z => z.id === g.id)?.values || []})), {unit: '%', digits: 1, zeroBase: false});
    else { const tot = b.labels.map((_, i) => b.groups.reduce((a, g) => a + (fin(g.values[i]) ? g.values[i] : 0), 0)), neg = b.labels.map((_, i) => b.groups.some(g => fin(g.values[i]) && g.values[i] < 0));
      chart(c1.host, 'xd-fin-pnl-share', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values.map((v, i) => fin(v) && tot[i] > 0 && !neg[i] ? v / tot[i] * 100 : null)})), {unit: '%', digits: 1, native: 'stack', stackable: true}); }
    foot(c1, `${name}, ${modeName(S.mode)}; EBIT = LN gộp − CP bán hàng − CP QLDN; ${cov(m1, S.mode)}`); }
  renders.push(draw1);
  const c2 = card('xd-fin-gm', 'Biên gộp theo mô hình (%)', 'LN gộp ÷ doanh thu của từng mô hình · đường riêng cho mỗi mô hình');
  function draw2() { const mode = S.mode, L = E.labels(mode);
    chart(c2.host, 'xd-fin-gm', L, grpLines((x, md) => E.ratio({m: 'gross'}, {m: 'revenue'}, x, md, 100).values, mode), {unit: '%', digits: 1, zeroBase: false});
    foot(c2, `tổng LN gộp ÷ tổng doanh thu, ${modeName(mode)}; ${cov('gross', mode)}`); }
  renders.push(draw2);
  const c3 = card('xd-fin-margin', 'Biên lợi nhuận theo tầng (%)', 'Biên gộp, EBIT, LNST trên doanh thu · chọn mô hình'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), L = E.labels(S.mode), r = n => E.ratio({m: n}, {m: 'revenue'}, x, S.mode, 100).values;
    chart(c3.host, 'xd-fin-margin', L, [['gross', 'Biên gộp'], ['ebit', 'Biên EBIT'], ['npat', 'Biên LNST']].map(([m, n], k) => ({name: n, color: LINE[k], values: r(m)})), {unit: '%', digits: 1, zeroBase: false});
    foot(c3, `${modeName(S.mode)}; cùng tập mã có đủ tử và mẫu`); }
  renders.push(draw3);
  s.append(c1.el, grid2(c2, c3));
  return s;
}

/* ---------- 1.2 Phải thu, ứng trước & dở dang ---------- */
function s2() {
  const s = section('1.2', 'Vốn của doanh nghiệp đang nằm ở phải thu, tồn kho dở dang hay được chủ đầu tư ứng trước?', 'Số dư cuối kỳ, đúng dòng trên bảng cân đối (TT200); không cộng các dòng với nhau.'); s.id = 'pf-sec-cash';
  const c1 = card('xd-fin-balances', 'Phải thu, ứng trước, tồn kho của mẫu đang chọn (tỷ đồng)', 'Số dư cuối kỳ · mỗi đường là một dòng bảng cân đối');
  function draw1() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'q', L = E.labels(mode), T = m => E.total(m, x, mode).values;
    chart(c1.host, 'xd-fin-balances', L, [['receivables', 'Phải thu khách hàng ngắn hạn', LINE[4]], ['prog_recv', 'Phải thu theo tiến độ HĐXD', LINE[5]], ['adv_total', 'Người mua trả tiền trước (ngắn + dài hạn)', LINE[1]], ['inventory', 'Hàng tồn kho (gồm chi phí SXKD dở dang)', LINE[2]], ['prog_pay', 'Phải trả theo tiến độ HĐXD', LINE[3]]].map(([k, n, c]) => ({name: n, color: c, values: T(k)})), {unit: 'tỷ đ'});
    foot(c1, `số dư cuối ${mode === 'y' ? 'năm' : 'quý'}. Chi phí dở dang công trình nằm trong hàng tồn kho (bảng cân đối không tách); "phải thu theo tiến độ kế hoạch hợp đồng xây dựng" và "phải trả theo tiến độ" là dòng riêng, các mã trong mẫu đều ghi 0; VAS không có dòng tài sản hợp đồng như IFRS 15. ${cov('receivables', mode)}`); }
  renders.push(draw1);
  const c2 = card('xd-fin-dso', 'Số ngày thu tiền (DSO) theo mô hình (ngày)', 'Phải thu khách hàng ngắn hạn bình quân ÷ doanh thu TTM × 365');
  function draw2() { const mode = S.mode === 'y' ? 'y' : 'ttm', L = E.labels(mode);
    chart(c2.host, 'xd-fin-dso', L, grpLines((x, md) => E.ratio({m: 'receivables', avg: true}, {m: 'revenue'}, x, md, 365).values, mode), {unit: 'ngày'});
    foot(c2, `số dư bình quân (cuối kỳ + cùng kỳ năm trước)/2 ÷ doanh thu ${mode === 'y' ? 'năm' : 'TTM'}; ${cov('receivables', mode === 'y' ? 'y' : 'q')}`); }
  renders.push(draw2);
  const c3 = card('xd-fin-adv', 'Ứng trước / Doanh thu TTM theo mô hình (lần)', 'Người mua trả tiền trước (13130 + 13311, số dư) ÷ doanh thu thuần 4 quý (phát sinh)');
  function draw3() { const mode = S.mode === 'y' ? 'y' : 'ttm', L = E.labels(mode);
    chart(c3.host, 'xd-fin-adv', L, grpLines((x, md) => E.ratio({m: 'adv_total'}, {m: 'revenue'}, x, md).values, mode), {unit: 'lần', digits: 2});
    foot(c3, `cùng công thức trường backlog_cover của data/construction-backlog.js; là tiền tạm ứng của chủ đầu tư, không phải giá trị backlog hợp đồng`); }
  renders.push(draw3);
  const c4 = card('xd-fin-dio', 'Số ngày tồn kho, gồm dở dang (ngày)', 'Hàng tồn kho bình quân ÷ giá vốn TTM × 365');
  function draw4() { const mode = S.mode === 'y' ? 'y' : 'ttm', L = E.labels(mode);
    chart(c4.host, 'xd-fin-dio', L, grpLines((x, md) => E.ratio({m: 'inventory', avg: true}, {m: 'cogs'}, x, md, 365).values, mode), {unit: 'ngày'});
    foot(c4, `hàng tồn kho gồm nguyên vật liệu, thành phẩm và chi phí SXKD dở dang công trình; với vật liệu (xi măng, đá) chủ yếu là nguyên liệu, thành phẩm`); }
  renders.push(draw4);
  s.append(c1.el, grid2(c2, c3), c4.el);
  return s;
}

/* ---------- 1.3 CFO & chuyển đổi tiền ---------- */
function s3() {
  const s = section('1.3', 'Lợi nhuận có chuyển thành tiền không?', 'Dòng tiền là số phát sinh; CFO quý chỉ dùng năm có tổng 4 quý khớp số năm.'); s.id = 'xd-fin-cfo-sec';
  const c1 = card('xd-fin-cfo', 'CFO theo mô hình (tỷ đồng)', 'Lưu chuyển tiền thuần từ hoạt động kinh doanh');
  function draw1() { const mode = S.mode === 'q' ? 'ttm' : S.mode, b = E.byGroup('cfo', sel(), mode);
    chart(c1.host, 'xd-fin-cfo', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c1, `${modeName(mode)}; ${cov('cfo', mode)}`); }
  renders.push(draw1);
  const c2 = card('xd-fin-conv', 'Chuyển đổi lợi nhuận thành tiền (lần)', 'CFO/LNST, CFO/EBITDA · chọn mô hình'); let g2 = 'all'; const p2 = groupPicker(c2, () => g2, (v, q) => { g2 = v; if (!q) draw2(); });
  function draw2() { p2(); const x = scopeOf(g2), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), R = (a, b) => E.ratio({m: a}, {m: b}, x, mode).values;
    chart(c2.host, 'xd-fin-conv', L, [{name: 'CFO/LNST', color: LINE[0], values: R('cfo', 'npat')}, {name: 'CFO/EBITDA', color: LINE[2], values: R('cfo', 'ebitda')}], {unit: 'lần', digits: 2});
    foot(c2, `${mode === 'y' ? 'năm' : 'TTM'}; tổng tử ÷ tổng mẫu`); }
  renders.push(draw2);
  const c3 = card('xd-fin-wc', 'Tiền giữ lại ở vốn lưu động (tỷ đồng)', 'Biến động phải thu, hàng tồn kho, phải trả trong LCTT · số âm là tiền bị giữ');
  function draw3() { const x = sel(), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode), T = m => E.total(m, x, mode).values;
    chart(c3.host, 'xd-fin-wc', L, [{name: 'Phải thu', color: LINE[4], values: T('chg_receivables')}, {name: 'Hàng tồn kho', color: LINE[2], values: T('chg_inventory')}, {name: 'Phải trả', color: LINE[1], values: T('chg_payables')}], {unit: 'tỷ đ', native: 'bar'});
    foot(c3, `${modeName(mode)}; dấu theo LCTT gián tiếp: tăng phải thu, tăng tồn kho là số âm; ${cov('chg_receivables', mode)}`); }
  renders.push(draw3);
  s.append(c1.el, grid2(c2, c3));
  return s;
}

/* ---------- 1.4 Nợ, lãi vay & dòng tiền tự do ---------- */
function s4() {
  const s = section('1.4', 'Nợ vay, chi phí lãi và dòng tiền tự do ra sao?', 'Nợ vay là số dư cuối kỳ; lãi vay, FCF là số phát sinh.'); s.id = 'xd-fin-debt-sec';
  const c1 = card('xd-fin-debt', 'Cơ cấu nợ vay (tỷ đồng)', 'Nợ vay ngắn hạn, dài hạn (cột chồng); tiền & đầu tư ngắn hạn, nợ vay ròng (đường)');
  function draw1() { const x = sel(), mode = S.mode === 'y' ? 'y' : 'q', L = E.labels(mode), T = m => E.total(m, x, mode).values;
    chart(c1.host, 'xd-fin-debt', L, [{name: 'Nợ vay ngắn hạn', color: '#8997D6', values: T('st_debt')}, {name: 'Nợ vay dài hạn', color: '#1D2678', values: T('lt_debt')}, {name: 'Tiền & đầu tư ngắn hạn', color: '#2a9fa3', values: T('cash_all'), kind: 'line'}, {name: 'Nợ vay ròng', color: '#c98a00', values: T('net_debt'), kind: 'line'}], {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c1, `số dư cuối kỳ; nợ vay chịu lãi (vay và nợ thuê tài chính), không gồm trái phiếu chuyển đổi ghi ở dòng khác nếu có; ${cov('st_debt', mode)}`); }
  renders.push(draw1);
  const c2 = card('xd-fin-lev', 'Đòn bẩy theo mô hình', 'Nợ vay ròng / EBITDA TTM (lần)');
  function draw2() { const L = D.periods;
    chart(c2.host, 'xd-fin-lev', L, grpLines(x => E.ratio({m: 'net_debt'}, {m: 'ebitda'}, x, 'ttm').values), {unit: 'lần', digits: 2});
    foot(c2, 'số dư nợ vay ròng ÷ EBITDA TTM (EBIT + khấu hao); mô hình BOT có nợ dài hạn lớn theo dự án'); }
  renders.push(draw2);
  const c3 = card('xd-fin-int', 'Chi phí lãi vay và khả năng trả lãi', 'Lãi vay/nợ vay bình quân (%), EBIT/lãi vay (lần) · chọn mô hình'); let g3 = 'all'; const p3 = groupPicker(c3, () => g3, (v, q) => { g3 = v; if (!q) draw3(); });
  function draw3() { p3(); const x = scopeOf(g3), mode = S.mode === 'q' ? 'ttm' : S.mode, L = E.labels(mode);
    chart(c3.host, 'xd-fin-int', L, [{name: 'Lãi vay/nợ vay bình quân (%)', color: LINE[3], values: E.ratio({m: 'interest'}, {m: 'debt', avg: true}, x, mode, 100).values}, {name: 'EBIT/lãi vay (lần)', color: LINE[0], values: E.ratio({m: 'ebit'}, {m: 'interest'}, x, mode).values}], {unit: '', digits: 1});
    foot(c3, `${mode === 'y' ? 'năm' : 'TTM'}; lãi vay ghi nhận vào chi phí, chưa gồm lãi vay vốn hóa vào dự án`); }
  renders.push(draw3);
  const c4 = card('xd-fin-fcf', 'Dòng tiền tự do theo mô hình (tỷ đồng)', 'FCF = CFO − tiền chi mua sắm, xây dựng TSCĐ');
  function draw4() { const mode = S.mode === 'q' ? 'ttm' : S.mode, b = E.byGroup('fcf', sel(), mode);
    chart(c4.host, 'xd-fin-fcf', b.labels, b.groups.map(g => ({name: g.label, color: g.color, values: g.values})), {unit: 'tỷ đ', native: 'stack', stackable: true});
    foot(c4, `${modeName(mode)}; chi đầu tư dự án BOT có thể ghi ở XDCB dở dang (tiền chi TSCĐ); ${cov('fcf', mode)}`); }
  renders.push(draw4);
  s.append(grid2(c1, c2), grid2(c3, c4));
  return s;
}

/* ---------- Dựng ---------- */
function redraw() { renders.forEach(f => { try { f(); } catch (e) { document.documentElement.dataset.pfError = (document.documentElement.dataset.pfError || '') + e.message + ';'; console.error(e); } }); setTimeout(() => window.dispatchEvent(new Event('resize')), 60); }
function build(pane) {
  if (!pane || root) return; root = pane;
  style();
  pane.append(filterBar(), kpis(), s1(), s2(), s3(), s4());
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
.pf-note{margin:6px 2px 0;font-size:11px;color:var(--muted,#7a8399)}@media (max-width:640px){.pf-grid{grid-template-columns:1fr;gap:4px}.pf-gtable td:first-child{width:auto;white-space:normal}}.pf-lb{font:600 11.5px Inter,sans-serif;color:var(--muted,#7a8399);text-transform:uppercase;letter-spacing:.04em}
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
// Mục của tab để Tìm nhanh mở đúng sub-tab trước khi dựng (xd-frame.js).
const SECTIONS = [['xd-fin-pnl-sec', '1.1 Doanh thu và biên lợi nhuận'], ['pf-sec-cash', '1.2 Phải thu, ứng trước & dở dang'], ['xd-fin-cfo-sec', '1.3 CFO & chuyển đổi tiền'], ['xd-fin-debt-sec', '1.4 Nợ, lãi vay & dòng tiền tự do']];
window.XdFinance = {build, engine: E, state: S, sections: SECTIONS};
})();
