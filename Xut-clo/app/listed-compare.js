/* Tài chính ngành › 02 Doanh nghiệp niêm yết: bảng so sánh, xu hướng theo quý, P/E và P/B so với trung vị 5 năm
   (28/11/2026, khung chuẩn Điện DASHBOARD_WORKFLOW.md §42). Một file dùng chung cho Phân bón, Cao su, Xút – Clo (chép giống nhau vào từng gói).
   Số: BCTC hợp nhất theo quý (window.*_FIN, tổng hợp bằng app/industry-fin.js) và P/E, P/B, vốn hóa theo phiên (window.COMPANY_VALUATION,
   scripts/update_valuation.py). TTM = 4 quý gần nhất có đủ số. Chỉ mô tả dữ liệu; mã thiếu số để trống, không ước lượng.
   ListedCompare.mount(D, {prefix, src}) → mảng câu hỏi section.pp-panel (người gọi gắn vào trang và đánh số). */
(() => {
'use strict';
const fin = v => typeof v === 'number' && Number.isFinite(v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '–';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '–';
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const qL = p => /Q\d$/.test(p || '') ? `Q${p.slice(-1)}/${p.slice(0, 4)}` : (p || '');
const dL = d => d ? String(d).slice(0, 10).split('-').reverse().join('/') : '';
const PAL = ['#1D2678', '#2a9fa3', '#c98a00', '#861C52', '#3d4653', '#8997D6', '#b8801f', '#5a6682', '#3f8f5a', '#dd7f4e', '#2938A8', '#9aa1b2', '#6171C5'];
const VND = '<a href="https://dstock.vndirect.com.vn/" target="_blank" rel="noopener">VNDirect</a>';

function panel(q) { return el('section', 'pp-panel pp-q', `<header class="pp-ph"><span class="pp-num">·</span><div><h3>${esc(q)}</h3></div></header>`); }
function card(id, title, sub, src) {
  const c = el('div', 'card pp-card lc-card'); c.dataset.blockId = id; c.dataset.updateKind = 'public'; c.dataset.cadence = 'quarterly';
  c.innerHTML = `<div class="chart-title">${esc(title)}</div>${sub ? `<div class="chart-sub">${sub}</div>` : ''}<div class="lc-ctl"></div><div class="pp-host"></div><div class="pw-src">Nguồn: ${src}</div>`;
  return {el: c, host: c.querySelector('.pp-host'), ctl: c.querySelector('.lc-ctl')};
}
function seg(c, name, opts, cur, on) {
  const w = el('div', 'pf-seg pf-box'); w.setAttribute('role', 'group'); w.setAttribute('aria-label', name);
  opts.forEach(([k, t]) => { const b = el('button', '', esc(t)); b.type = 'button'; b.dataset.k = k; b.setAttribute('aria-pressed', String(k === cur));
    b.addEventListener('click', () => { w.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); on(k); }); w.append(b); });
  c.ctl.append(w); return w;
}
function draw(host, model) { if (!window.ChartTypes) return; ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, model.native); }); }

function rows(D, E) {
  const V = window.COMPANY_VALUATION?.companies || {}, P = D.periods;
  const lastFin = a => { for (let k = a.length - 1; k >= 0; k--) if (fin(a[k])) return k; return -1; };
  const yoy = (a, k) => k >= 4 && fin(a[k]) && fin(a[k - 4]) && a[k - 4] > 0 ? (a[k] / a[k - 4] - 1) * 100 : null;
  return D.companies.map(c => {
    const t = c.ticker, g = D.groups.find(x => x.id === c.group) || {}, v = V[t] || {};
    const rev = E.per('revenue', [t], 'ttm')[t], np = E.per('npat_parent', [t], 'ttm')[t], k = lastFin(rev);
    const gm = E.ratio({m: 'gross'}, {m: 'revenue'}, [t], 'ttm', 100).values, roe = E.ratio({m: 'npat'}, {m: 'equity', avg: true}, [t], 'ttm', 100).values;
    const nde = E.ratio({m: 'net_debt'}, {m: 'equity'}, [t], 'q').values;
    const at = a => k >= 0 ? a[k] : null;
    return {t, group: g.label || '', color: g.color || '#5a6682', period: P[k], rev: at(rev), revY: yoy(rev, k), np: at(np), npY: yoy(np, k), gm: at(gm), roe: Math.abs(at(roe)) > 100 ? null : at(roe),
      nde: at(nde), pe: v.pe > 0 ? v.pe : null, pb: v.pb > 0 ? v.pb : null, mcap: fin(v.market_cap) ? v.market_cap : null, pe5: v.median5?.pe ?? null, pb5: v.median5?.pb ?? null, vdate: v.date};
  });
}

function mount(D, o = {}) {
  if (!D || !window.IndustryFin) return [];
  const E = IndustryFin.create(D), R = rows(D, E), pre = o.prefix || 'lc', src = o.src || 'BCTC hợp nhất theo quý';
  const per = R.map(r => r.period).filter(Boolean).sort().at(-1), vd = R.map(r => r.vdate).filter(Boolean).sort().at(-1);
  const out = [];
  // 1. Bảng so sánh
  const p1 = panel('Các mã khác nhau thế nào về quy mô, biên, ROE, nợ vay và định giá?');
  const c1 = card(`${pre}-cmp`, 'So sánh doanh nghiệp niêm yết', `TTM đến ${qL(per)} · tỷ đồng · P/E, P/B, vốn hóa theo phiên ${dL(vd)} · bấm tiêu đề cột để sắp xếp`, `${src}; P/E, P/B, vốn hóa: ${VND}; tự tính`);
  const COLS = [['t', 'Mã'], ['group', 'Nhóm'], ['rev', 'Doanh thu TTM', 0], ['revY', '± so cùng kỳ (%)', 1], ['np', 'LNST cổ đông mẹ TTM', 0], ['npY', '± so cùng kỳ (%)', 1], ['gm', 'Biên gộp (%)', 1], ['roe', 'ROE (%)', 1],
    ['nde', 'Nợ vay ròng / VCSH (lần)', 2], ['mcap', 'Vốn hóa', 0], ['pe', 'P/E', 1], ['pe5', 'P/E trung vị 5 năm', 1], ['pb', 'P/B', 2], ['pb5', 'P/B trung vị 5 năm', 2]];
  let sk = 'rev', sd = -1;
  const paint = () => {
    const L = [...R].sort((a, b) => { const x = a[sk], y = b[sk]; if (typeof x === 'string' || typeof y === 'string') return String(x).localeCompare(String(y)) * sd; return ((fin(x) ? x : -1e18) - (fin(y) ? y : -1e18)) * sd; });
    c1.host.innerHTML = `<div class="tbl-wrap lc-wrap"><table class="compare-table lc-table"><thead><tr>${COLS.map(([k, t]) => `<th data-k="${k}" class="${k === 't' || k === 'group' ? '' : 'n'}${k === sk ? ' on' : ''}" scope="col">${esc(t)}${k === sk ? (sd < 0 ? ' ↓' : ' ↑') : ''}</th>`).join('')}</tr></thead><tbody>`
      + L.map(r => `<tr>${COLS.map(([k, , d]) => k === 't' ? `<th scope="row"><b>${r.t}</b></th>` : k === 'group' ? `<td><i class="lc-dot" style="background:${r.color}"></i>${esc(r.group)}</td>`
        : `<td class="n">${/Y$/.test(k) ? sg(r[k], d) : nf(r[k], d)}</td>`).join('')}</tr>`).join('') + '</tbody></table></div>'
      + `<p class="lc-foot">ROE = LNST TTM ÷ VCSH bình quân (để trống khi trên 100% do vốn chủ gần 0 hoặc âm) · Nợ vay ròng = nợ vay ngắn, dài hạn − tiền − đầu tư ngắn hạn, cuối quý · ô "–" là chưa có số.</p>`;
    c1.host.querySelectorAll('th[data-k]').forEach(th => th.addEventListener('click', () => { const k = th.dataset.k; if (k === sk) sd = -sd; else { sk = k; sd = k === 't' || k === 'group' ? 1 : -1; } paint(); }));
  };
  paint(); p1.append(c1.el); out.push(p1);
  // 2. Xu hướng theo quý
  const p2 = panel('Doanh thu, lợi nhuận từng mã đang đi lên hay đi xuống?');
  const c2 = card(`${pre}-trend`, 'Xu hướng theo quý của từng doanh nghiệp', 'chọn chỉ tiêu và nhóm · TTM (4 quý gần nhất) để bỏ yếu tố mùa vụ', `${src}; tự tính`);
  const GS = D.groups.filter(g => D.companies.some(c => c.group === g.id));
  let m2 = 'revenue', g2 = 'all';
  const M2 = [['revenue', 'Doanh thu TTM', 'tỷ đ', 0], ['npat_parent', 'LNST cổ đông mẹ TTM', 'tỷ đ', 0], ['gm', 'Biên gộp TTM', '%', 1], ['roe', 'ROE TTM', '%', 1]];
  const d2 = () => {
    const ts = D.companies.filter(c => g2 === 'all' || c.group === g2).map(c => c.ticker), [, , unit, dg] = M2.find(x => x[0] === m2);
    const L = E.labels('ttm'), vals = t => m2 === 'gm' ? E.ratio({m: 'gross'}, {m: 'revenue'}, [t], 'ttm', 100).values : m2 === 'roe' ? E.ratio({m: 'npat'}, {m: 'equity', avg: true}, [t], 'ttm', 100).values.map(v => fin(v) && Math.abs(v) <= 100 ? v : null) : E.per(m2, [t], 'ttm')[t];
    const ser = ts.map((t, j) => ({name: t, color: PAL[D.companies.findIndex(c => c.ticker === t) % PAL.length], kind: 'line', values: vals(t).map(v => fin(v) ? Math.round(v * 100) / 100 : null)}));
    let a = 0; while (a < L.length && ser.every(s => !fin(s.values[a]))) a++;
    draw(c2.host, {key: `${pre}-trend-${m2}-${g2}`, categories: L.slice(a).map(qL), series: ser.map(s => ({...s, values: s.values.slice(a)})), unit, digits: dg, native: 'line', zeroBase: m2 === 'revenue', aria: 'Xu hướng theo quý'});
  };
  seg(c2, 'Chỉ tiêu', M2.map(([k, t]) => [k, t]), m2, k => { m2 = k; d2(); });
  if (GS.length > 1) seg(c2, 'Nhóm', [['all', 'Tất cả'], ...GS.map(g => [g.id, g.label])], g2, k => { g2 = k; d2(); });
  d2(); p2.append(c2.el); out.push(p2);
  // 3. P/E, P/B so với trung vị 5 năm (P/E rổ ở cuối, như Thép, Chăn nuôi)
  const ok = R.filter(r => fin(r.pe) || fin(r.pb));
  if (ok.length) {
    const p3 = panel('P/E, P/B hiện tại cao hay thấp so với trung vị 5 năm của chính mã?');
    const c3 = card(`${pre}-pe`, 'P/E, P/B theo phiên so với trung vị 5 năm', `lần · phiên ${dL(vd)} · trung vị theo ngày của 5 năm gần nhất`, `${VND} (P/E, P/B theo ngày); scripts/update_valuation.py; tự tính trung vị`);
    let m3 = 'pe';
    const d3 = () => { const L = ok.filter(r => fin(r[m3]) || fin(r[m3 + '5']));
      draw(c3.host, {key: `${pre}-pe-${m3}`, categories: L.map(r => r.t), time: false, series: [{name: m3 === 'pe' ? 'P/E hiện tại' : 'P/B hiện tại', color: '#1D2678', kind: 'bar', values: L.map(r => r[m3])}, {name: 'Trung vị 5 năm', color: '#B3BDE8', kind: 'bar', values: L.map(r => r[m3 + '5'])}], unit: 'lần', digits: m3 === 'pe' ? 1 : 2, native: 'bar', zeroBase: true, aria: 'P/E, P/B so với trung vị 5 năm'}); };
    seg(c3, 'Bội số', [['pe', 'P/E'], ['pb', 'P/B']], m3, k => { m3 = k; d3(); }); d3();
    const miss = R.filter(r => !fin(r.pe) && !fin(r.pb)).map(r => r.t);
    if (miss.length) c3.el.querySelector('.pw-src').insertAdjacentHTML('beforebegin', `<p class="lc-foot">Chưa có P/E, P/B: ${miss.join(', ')}.</p>`);
    p3.append(c3.el); out.push(p3);
  }
  style();
  return out;
}
function style() {
  if (document.getElementById('lc-style')) return;
  const st = el('style'); st.id = 'lc-style';
  st.textContent = `.lc-ctl{display:flex;flex-wrap:wrap;gap:8px 12px;margin:6px 0}.lc-wrap{overflow-x:auto}.lc-table{width:100%;border-collapse:collapse;font-size:12.5px}.lc-table th[data-k]{cursor:pointer;white-space:nowrap;user-select:none}
.lc-table th.on{color:#2938A8}.lc-table td,.lc-table th{padding:6px 8px;border-bottom:1px solid var(--line,#eef0f6);text-align:left}.lc-table .n{text-align:right;font-variant-numeric:tabular-nums}.lc-table tbody th{position:sticky;left:0;background:var(--card,#fff)}
.lc-dot{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px;vertical-align:-1px}.lc-foot{margin:6px 2px 0;font-size:11.5px;color:var(--muted,#7a8399)}`;
  document.head.append(st);
}
window.ListedCompare = {mount, rows};
})();
