/* Hàng không · Tài chính ngành › 02 Doanh nghiệp niêm yết (?sub=listed#mt14, 27/11/2026) — theo bố cục Dien/#mt14 › 02 Doanh nghiệp niêm yết.
   2.1 Định giá, hiệu quả, lợi nhuận từng mã (lọc nhóm); 2.2 bảng so sánh chi tiết theo quý (chọn kỳ, bấm tiêu đề để sắp xếp);
   2.3 số vận hành doanh nghiệp công bố (thẻ hk-62 có sẵn). Chỉ mô tả số, không câu nhận định.
   Dữ liệu: window.AVIATION_VAL (scripts/build_aviation_valuation.py: P/E, P/B, vốn hóa VNDirect theo phiên, trung vị 5 năm),
   window.AVIATION_FIN (BCTC hợp nhất quý, tỷ đồng). ROE TTM = LNST 4 quý ÷ VCSH bình quân (cuối kỳ + cùng kỳ năm trước)/2, N/A khi VCSH bình quân ≤ 0. */
(() => {
'use strict';
const V = window.AVIATION_VAL, F = window.AVIATION_FIN;
if (!V?.companies || !F?.data) return;
const fin = v => typeof v === 'number' && Number.isFinite(v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const P = F.periods, ql = p => 'Q' + p.slice(-1) + '/' + p.slice(0, 4), dd = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—';
const G = Object.fromEntries(F.groups.map(g => [g.id, g])), GOF = Object.fromEntries(F.companies.map(c => [c.ticker, c.group]));
const asOf = Object.values(V.companies).map(c => c.date).filter(Boolean).sort().at(-1);
const SRC = `Nguồn: <a href="https://dstock.vndirect.com.vn/" target="_blank" rel="noopener">VNDirect finfo</a> (định giá phiên ${dd(asOf)}); <a href="https://api-finfo.vndirect.com.vn/v4/financial_statements" target="_blank" rel="noopener">BCTC hợp nhất quý</a>; tự tính`;
const S = {g: 'all', end: P.length - 1, sort: ['cap', -1]};
const renders = [];

const val = (t, k, i) => { const v = F.data[t]?.[k]?.[i]; return fin(v) ? v : null; };
const ttm = (t, k, i) => { if (i < 3) return null; const a = [0, 1, 2, 3].map(j => val(t, k, i - j)); return a.every(fin) ? a.reduce((x, y) => x + y, 0) : null; };
const roe = (t, i) => { const n = ttm(t, 'npat', i), e0 = val(t, 'equity', i), e1 = i >= 4 ? val(t, 'equity', i - 4) : null; if (!fin(n) || !fin(e0) || !fin(e1)) return null; const avg = (e0 + e1) / 2; return avg > 0 ? n / avg * 100 : null; };
const yoy = (a, b) => fin(a) && fin(b) && b !== 0 ? (a / Math.abs(b) - (b < 0 ? -1 : 1)) * 100 * (b < 0 ? -1 : 1) : null;
const netDebt = (t, i) => { const a = ['st_debt', 'lt_debt', 'cash'].map(k => val(t, k, i)); if (!a.every(fin)) return null; return a[0] + a[1] - a[2] - (val(t, 'st_invest', i) ?? 0); };
const tks = () => F.companies.map(c => c.ticker).filter(t => S.g === 'all' || GOF[t] === S.g);
const row = (t, i = S.end) => {
  const v = V.companies[t] || {}, rev = val(t, 'revenue', i), np = val(t, 'npat', i), gp = val(t, 'gross', i);
  return {t, g: GOF[t], cap: v.market_cap, pe: v.pe > 0 ? v.pe : null, peRaw: v.pe, pb: v.pb > 0 ? v.pb : null, mpe: v.median5?.pe, mpb: v.median5?.pb, close: v.close,
    rev, revY: yoy(rev, i >= 4 ? val(t, 'revenue', i - 4) : null), np, npY: yoy(np, i >= 4 ? val(t, 'npat', i - 4) : null),
    gm: fin(gp) && rev ? gp / rev * 100 : null, nm: fin(np) && rev ? np / rev * 100 : null, roe: roe(t, i), nd: netDebt(t, i),
    npT: ttm(t, 'npat', i), npTp: ttm(t, 'npat', i - 4), spark: P.slice(Math.max(0, i - 11), i + 1).map((_, k) => val(t, 'npat', Math.max(0, i - 11) + k))};
};

function card(id, title, sub) {
  const c = el('div', 'card hk-co-card'); c.dataset.blockId = id; c.dataset.updateKind = 'public'; c.dataset.cadence = 'daily'; c.dataset.refreshStatus = 'snapshot';
  c.innerHTML = `<div class="chart-title">${esc(title)}</div>${sub ? `<div class="chart-sub">${sub}</div>` : ''}<div class="hk-co-host"></div><div class="pw-src">${SRC}</div>`;
  return {el: c, host: c.querySelector('.hk-co-host')};
}
function section(num, title) { const s = el('section', 'pp-panel pp-q hk-co-sec'); s.innerHTML = `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(title)}</h3></div></header>`; return s; }
const spark = vals => { const v = vals.filter(fin); if (v.length < 2) return ''; const lo = Math.min(...v, 0), hi = Math.max(...v, 0), W = 120, H = 30, x = i => i * W / (vals.length - 1), y = a => H - 2 - (a - lo) / ((hi - lo) || 1) * (H - 4);
  return `<svg class="hk-co-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" class="z"/>${vals.map((a, i) => fin(a) ? `<rect x="${x(i) - 3}" y="${Math.min(y(a), y(0))}" width="6" height="${Math.max(1, Math.abs(y(a) - y(0)))}" class="${a < 0 ? 'n' : 'p'}"/>` : '').join('')}</svg>`; };

/* ---------- Bộ lọc nhóm ---------- */
function filterBar() {
  const f = el('section', 'hk-co-filter');
  const draw = () => { f.innerHTML = `<span class="pf-lb">Nhóm</span><div class="pf-chips">${[['all', 'Tất cả', '#1D2678', F.companies.length], ...F.groups.map(g => [g.id, g.label, g.color, F.companies.filter(c => c.group === g.id).length])].map(([k, l, c, n]) => `<button type="button" data-g="${k}" aria-pressed="${S.g === k}"><i style="background:${c}"></i>${esc(l)} <small>${n}</small></button>`).join('')}</div>
    <span class="hk-co-asof">Định giá phiên ${dd(asOf)} · BCTC đến ${ql(P.at(-1))}</span>`; };
  f.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; S.g = b.dataset.g; redraw(); });
  renders.push(draw); return f;
}

/* ---------- 2.1 Định giá, hiệu quả, lợi nhuận ---------- */
function s21() {
  const s = section('2.1', 'Định giá, hiệu quả và lợi nhuận từng doanh nghiệp');
  // Thẻ từng mã
  const c0 = card('hk-co-tiles', 'Doanh nghiệp hàng không niêm yết', 'vốn hóa, P/E, P/B, ROE TTM · LNST quý gần nhất và 12 quý');
  renders.push(() => { const i = P.length - 1;
    c0.host.innerHTML = `<div class="hk-co-tiles">${tks().map(t => { const r = row(t, i), g = G[r.g];
      return `<article class="hk-co-tile" style="--gc:${g.color}"><header><b>${esc(t)}</b><span>${esc(g.label)}</span></header>
        <dl><div><dt>Vốn hóa</dt><dd>${nf(r.cap)} <small>tỷ</small></dd></div><div><dt>P/E</dt><dd>${r.pe ? nf(r.pe, 1) : 'N/A'}</dd></div><div><dt>P/B</dt><dd>${r.pb ? nf(r.pb, 2) : 'N/A'}</dd></div><div><dt>ROE TTM</dt><dd>${fin(r.roe) ? nf(r.roe, 1) + '%' : 'N/A'}</dd></div></dl>
        <p class="hk-co-np">LNST ${ql(P[i])}: <b>${nf(r.np)}</b> tỷ <span class="${(r.npY ?? 0) < 0 ? 'dn' : 'up'}">${sg(r.npY, 0)}%</span></p>${spark(r.spark)}</article>`; }).join('')}</div>`; });
  // Định giá so với trung vị 5 năm
  const c1 = card('hk-co-valuation', 'Định giá hiện tại so với trung vị 5 năm', 'thanh = hiện tại, vạch = trung vị 5 năm của chính mã · P/E để trống khi lợi nhuận 4 quý âm'); let m1 = 'pe';
  const seg1 = el('div', 'pf-seg pf-box hk-co-seg'); seg1.innerHTML = `<button type="button" data-k="pe" aria-pressed="true">P/E</button><button type="button" data-k="pb" aria-pressed="false">P/B</button>`;
  seg1.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; m1 = b.dataset.k; seg1.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw1(); });
  c1.host.before(seg1);
  function draw1() { const rs = tks().map(t => row(t)).map(r => ({...r, cur: m1 === 'pe' ? r.pe : r.pb, med: m1 === 'pe' ? r.mpe : r.mpb})).sort((a, b) => (b.cur ?? -1) - (a.cur ?? -1));
    const mx = Math.max(...rs.flatMap(r => [r.cur, r.med]).filter(fin), 1) * 1.08;
    c1.host.innerHTML = `<div class="hk-co-bars">${rs.map(r => `<div class="hk-co-br" title="${esc(r.t)}: ${m1 === 'pe' ? 'P/E' : 'P/B'} ${fin(r.cur) ? nf(r.cur, 2) : 'N/A'} · trung vị 5 năm ${nf(r.med, 2)}"><span class="hk-co-bl"><b>${esc(r.t)}</b></span>
      <span class="hk-co-bt">${fin(r.cur) ? `<i style="width:${(r.cur / mx * 100).toFixed(1)}%;background:${G[r.g].color}"></i>` : ''}${fin(r.med) ? `<em style="left:${(r.med / mx * 100).toFixed(1)}%"></em>` : ''}</span>
      <span class="hk-co-bv">${fin(r.cur) ? nf(r.cur, m1 === 'pe' ? 1 : 2) : 'N/A'} <small>tv ${nf(r.med, m1 === 'pe' ? 1 : 2)}</small></span></div>`).join('')}</div>`; }
  renders.push(draw1);
  // ROE và P/B
  const c2 = card('hk-co-roe-pb', 'Hiệu quả và định giá: ROE TTM và P/B', 'trục ngang ROE TTM (%), trục dọc P/B (lần), kích thước = vốn hóa · mã có VCSH bình quân ≤ 0 không vẽ');
  renders.push(() => { const pts = tks().map(t => row(t)).filter(r => fin(r.roe) && fin(r.pb) && fin(r.cap)); c2.host.innerHTML = bubble(pts); });
  // LNST TTM hai kỳ
  const c3 = card('hk-co-profit', 'LNST 4 quý gần nhất so với cùng kỳ (tỷ đồng)', 'TTM kỳ chốt và TTM cùng kỳ năm trước, từng mã');
  renders.push(() => { const i = P.length - 1, rs = tks().map(t => row(t, i)).sort((a, b) => (b.npT ?? 0) - (a.npT ?? 0));
    const m = {key: 'hk-co-profit', categories: rs.map(r => r.t), series: [{name: 'LNST TTM ' + ql(P[i]), color: '#1D2678', values: rs.map(r => fin(r.npT) ? Math.round(r.npT) : null)}, {name: 'LNST TTM ' + ql(P[i - 4]), color: '#9AA3BD', values: rs.map(r => fin(r.npTp) ? Math.round(r.npTp) : null)}], unit: 'tỷ đ', digits: 0, native: 'bar', time: false, zeroBase: true};
    if (window.ChartTypes) ChartTypes.mount(c3.host, m, () => { c3.host.innerHTML = ChartTypes.render(m, 'bar'); }); });
  const g2 = el('div', 'grid two g2 pf-g2'); g2.append(c1.el, c2.el);
  s.append(c0.el, g2, c3.el);
  return s;
}
function bubble(pts) {
  if (!pts.length) return '<p class="pf-note">Chưa đủ số.</p>';
  const W = 640, H = 330, m = {l: 46, r: 30, t: 20, b: 34}, xs = pts.map(p => p.roe), ys = pts.map(p => p.pb), sm = Math.max(...pts.map(p => p.cap));
  let x0 = Math.min(0, ...xs), x1 = Math.max(...xs, 1), y0 = 0, y1 = Math.max(...ys, 1); const px = (x1 - x0) * .12; x0 -= px; x1 += px; y1 *= 1.15;
  const X = v => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r), Y = v => H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b), R = v => 7 + Math.sqrt(v / sm) * 26;
  const ty = [0, y1 / 2, y1], tx = [x0, (x0 + x1) / 2, x1];
  return `<svg class="pf-bubble" viewBox="0 0 ${W} ${H}" role="img" aria-label="ROE TTM và P/B từng mã">${ty.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${nf(v, 1)}x</text>`).join('')}
    ${tx.map(v => `<text x="${X(v)}" y="${H - 12}" text-anchor="middle">${nf(v, 0)}%</text>`).join('')}${x0 < 0 ? `<line x1="${X(0)}" x2="${X(0)}" y1="${m.t}" y2="${H - m.b}" class="z"/>` : ''}
    ${pts.sort((a, b) => b.cap - a.cap).map(p => `<g><circle cx="${X(p.roe)}" cy="${Y(p.pb)}" r="${R(p.cap)}" fill="${G[p.g].color}" fill-opacity=".5" stroke="${G[p.g].color}"><title>${esc(p.t)}: ROE TTM ${nf(p.roe, 1)}%, P/B ${nf(p.pb, 2)} lần, vốn hóa ${nf(p.cap)} tỷ đồng</title></circle><text x="${X(p.roe)}" y="${Y(p.pb) + 4}" text-anchor="middle" class="l">${esc(p.t)}</text></g>`).join('')}</svg>`;
}

/* ---------- 2.2 Bảng so sánh chi tiết theo quý ---------- */
function s22() {
  const s = section('2.2', 'Bảng so sánh chi tiết theo quý');
  const c = card('hk-co-table', 'So sánh doanh nghiệp theo quý', 'chọn quý · bấm tiêu đề cột để sắp xếp · P/E, P/B, vốn hóa theo phiên gần nhất');
  const ctl = el('div', 'pf-ctl', `<span class="pf-lb">Quý</span><select class="pf-sel">${P.map((p, i) => `<option value="${i}"${i === S.end ? ' selected' : ''}>${ql(p)}</option>`).join('')}</select>`);
  ctl.querySelector('select').addEventListener('change', e => { S.end = +e.target.value; draw(); }); c.host.before(ctl);
  const COLS = [['t', 'Mã', 0], ['g', 'Nhóm', 0], ['rev', 'Doanh thu quý (tỷ)', 0], ['revY', 'so cùng kỳ (%)', 1], ['np', 'LNST quý (tỷ)', 0], ['npY', 'so cùng kỳ (%)', 1], ['gm', 'Biên gộp (%)', 1], ['nm', 'Biên ròng (%)', 1], ['roe', 'ROE TTM (%)', 1], ['nd', 'Nợ vay ròng (tỷ)', 0], ['pe', 'P/E', 1], ['pb', 'P/B', 2], ['cap', 'Vốn hóa (tỷ)', 0]];
  c.host.addEventListener('click', e => { const th = e.target.closest('th[data-k]'); if (!th) return; const k = th.dataset.k; S.sort = [k, S.sort[0] === k ? -S.sort[1] : -1]; draw(); });
  function draw() { const [k, dir] = S.sort, rs = tks().map(t => row(t, S.end)).sort((a, b) => { const x = a[k], y = b[k]; if (typeof x === 'string') return String(x).localeCompare(y) * dir; return ((fin(x) ? x : -Infinity) - (fin(y) ? y : -Infinity)) * dir; });
    c.host.innerHTML = `<div class="tablewrap"><table class="pf-table hk-co-table"><thead><tr>${COLS.map(([ck, l]) => `<th data-k="${ck}"${ck === k ? ` aria-sort="${dir < 0 ? 'descending' : 'ascending'}"` : ''}>${esc(l)}${ck === k ? (dir < 0 ? ' ▾' : ' ▴') : ''}</th>`).join('')}</tr></thead><tbody>${rs.map(r => `<tr>${COLS.map(([ck, , d]) => ck === 't' ? `<td><b>${esc(r.t)}</b></td>` : ck === 'g' ? `<td><i class="hk-co-dot" style="background:${G[r.g].color}"></i>${esc(G[r.g].label)}</td>` : `<td class="n">${/Y$/.test(ck) ? sg(r[ck], d) : (ck === 'pe' || ck === 'pb' || ck === 'roe') && !fin(r[ck]) ? 'N/A' : nf(r[ck], d)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
  renders.push(draw); s.append(c.el); return s;
}

let root = null;
function redraw() { renders.forEach(f => { try { f(); } catch (e) { console.error(e); } }); setTimeout(() => window.dispatchEvent(new Event('resize')), 50); }
function build(pane) {
  if (root) return; root = pane; style();
  const first = pane.querySelector(':scope > .pp-q'), at = n => first ? pane.insertBefore(n, first) : pane.append(n);
  [filterBar(), s21(), s22()].forEach(at);
  const ops = pane.querySelector('#rf-q-ops .pp-num'); if (ops) ops.textContent = '2.3';
  redraw();
}
function tryBuild() { const p = document.getElementById('rf-mt14-listed'), mp = p?.closest('.majorpane'); if (!p || root || p.hidden || !mp || mp.hidden) return; build(p); }
['rf:frame', 'pv:toc', 'popstate', 'hashchange'].forEach(ev => window.addEventListener(ev, () => setTimeout(tryBuild, 30)));
document.addEventListener('click', e => { if (e.target.closest('.majortabbtn,.pp-tab,a[href*="mt14"]')) setTimeout(tryBuild, 60); });
function style() {
  if (document.getElementById('hk-co-style')) return; const st = document.createElement('style'); st.id = 'hk-co-style';
  st.textContent = `.hk-co-filter{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:6px 0 12px;padding:10px 12px;border:1px solid var(--line,#e3e7f0);border-radius:12px;background:var(--card,#fff)}
.hk-co-filter .pf-chips{display:flex;flex-wrap:wrap;gap:6px}.hk-co-filter button{border:1px solid var(--line,#d6dbe8);background:var(--card,#fff);color:var(--ink2,#3b4256);border-radius:7px;padding:4px 9px;font:600 12px Inter,sans-serif;cursor:pointer}
.hk-co-filter button i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px}.hk-co-filter button small{color:var(--muted,#7a8399);font-weight:500}.hk-co-filter button[aria-pressed=true]{border-color:#2938A8;box-shadow:inset 0 0 0 1px #2938A8}
.hk-co-filter .pf-lb{font:700 11px Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#7a8399)}.hk-co-asof{margin-left:auto;font-size:11.5px;color:var(--muted,#7a8399)}
.hk-co-sec{margin-top:14px}.hk-co-card .pw-src{margin-top:8px}
.hk-co-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.hk-co-tile{border:1px solid var(--line,#e3e7f0);border-top:3px solid var(--gc);border-radius:10px;padding:10px 12px;background:var(--card,#fff)}
.hk-co-tile header{display:flex;justify-content:space-between;align-items:baseline;gap:6px}.hk-co-tile header b{font-size:15px;color:#1D2678}.hk-co-tile header span{font-size:11px;color:var(--muted,#7a8399)}
.hk-co-tile dl{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin:8px 0 6px}.hk-co-tile dl div{display:flex;justify-content:space-between;gap:4px}.hk-co-tile dt{font-size:11.5px;color:var(--muted,#7a8399)}.hk-co-tile dd{margin:0;font-weight:700;font-size:12.5px;font-variant-numeric:tabular-nums}.hk-co-tile dd small{font-weight:500;color:var(--muted,#7a8399)}
.hk-co-np{margin:0;font-size:12px}.hk-co-np .up{color:#1f8a6e;font-weight:700}.hk-co-np .dn{color:#c0492f;font-weight:700}
.hk-co-spark{display:block;width:100%;height:30px;margin-top:4px}.hk-co-spark rect.p{fill:#2938A8;opacity:.75}.hk-co-spark rect.n{fill:#c98a00}.hk-co-spark .z{stroke:#c9cfe0}
.hk-co-seg{display:inline-flex;gap:4px;margin:4px 0 8px}.hk-co-seg button{border:1px solid var(--line,#d6dbe8);background:var(--card,#fff);border-radius:7px;padding:4px 10px;font:600 12px Inter,sans-serif;cursor:pointer}.hk-co-seg button[aria-pressed=true]{background:#2938A8;color:#fff;border-color:#2938A8}
.hk-co-bars{display:grid;gap:7px}.hk-co-br{display:grid;grid-template-columns:52px minmax(0,1fr) 92px;gap:8px;align-items:center;font-size:12.5px}
.hk-co-bt{position:relative;height:16px;background:var(--line,#eef0f6);border-radius:4px}.hk-co-bt i{position:absolute;inset:0 auto 0 0;border-radius:4px;opacity:.85}.hk-co-bt em{position:absolute;top:-3px;bottom:-3px;width:2px;background:#1d2333}
.hk-co-bv{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}.hk-co-bv small{display:block;font-weight:500;font-size:10.5px;color:var(--muted,#7a8399)}
.hk-co-table th{cursor:pointer;white-space:nowrap}.hk-co-table td{white-space:nowrap}.hk-co-dot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px}
.hk-co-card .pf-ctl{display:flex;gap:8px;align-items:center;margin:4px 0 8px}.hk-co-card .pf-sel{font:600 12px Inter,sans-serif;padding:4px 6px;border:1px solid var(--line,#d6dbe8);border-radius:7px;background:var(--card,#fff);color:inherit}
.hk-co-card .pf-table{width:100%;border-collapse:collapse;font-size:12.5px}.hk-co-card .pf-table th,.hk-co-card .pf-table td{padding:5px 8px;border-bottom:1px solid var(--line,#eef0f6);text-align:left}.hk-co-card .pf-table td.n{text-align:right;font-variant-numeric:tabular-nums}
.hk-co-card .pf-bubble{width:100%;height:auto}.hk-co-card .pf-bubble text{font:11px Inter,sans-serif;fill:#5b6479}.hk-co-card .pf-bubble text.l{font-weight:700;fill:#1D2678}.hk-co-card .pf-bubble line.g{stroke:#eef0f6}.hk-co-card .pf-bubble line.z{stroke:#9AA3BD;stroke-dasharray:3 3}
@media (max-width:640px){.hk-co-asof{margin-left:0}.hk-co-tiles{grid-template-columns:1fr 1fr}.hk-co-tile dl{grid-template-columns:1fr}}`;
  document.head.append(st);
}
window.AviationListed = {build};
})();
