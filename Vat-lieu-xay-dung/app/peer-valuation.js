/* So sánh định giá giữa các mã cùng ngành (27/11/2026, người dùng gửi mẫu 4 chart cho dệt may):
   1) P/B so với ROE + đường xu hướng ngành (hồi quy tuyến tính) · 2) Biên gộp so với ROE
   3) Lợi suất lợi nhuận (1/PE) tách cổ tức tiền và lợi nhuận giữ lại · 4) P/E TTM và EV / dòng tiền cho doanh nghiệp TTM.
   Dùng chung mọi ngành phi tài chính có dữ liệu BCTC theo khuôn IndustryFin (window.<NGÀNH>_FIN) và window.COMPANY_VALUATION.
   Không dùng cho ngân hàng, bảo hiểm, chứng khoán (không có biên gộp; EV không có nghĩa).
   Cách tính (TTM = 4 quý gần nhất của BCTC hợp nhất):
   ROE = LNST TTM ÷ VCSH bình quân · Biên gộp = LN gộp TTM ÷ doanh thu TTM · P/E, P/B, vốn hóa: VNDirect theo phiên
   Lợi suất cổ tức tiền = cổ tức đã trả bằng tiền TTM (lưu chuyển tiền tệ) ÷ vốn hóa · Lợi nhuận giữ lại = 1/PE − lợi suất cổ tức (không âm)
   EV = vốn hóa + nợ vay ngắn, dài hạn − tiền − đầu tư tài chính ngắn hạn (cuối quý gần nhất)
   Dòng tiền cho doanh nghiệp (giản lược) = CFO TTM − CAPEX TTM; âm thì không tính bội số, ghi "âm". */
(() => {
'use strict';
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 1) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const HI = '#1F3A68', LO = '#8C93A3', HI2 = '#9DB0D6', LO2 = '#D3D6DE';

function metrics(D, E) {
  const V = window.COMPANY_VALUATION?.companies || {}, i = D.periods.length - 1;
  const one = (m, t, md, avg) => E.per(m, [t], md, avg)[t];
  const lastFin = (arr) => { for (let k = arr.length - 1; k >= 0; k--) if (fin(arr[k])) return [arr[k], k]; return [null, -1]; };
  return D.companies.map(c => {
    const t = c.ticker, v = V[t] || {};
    const [roe, ri] = lastFin(E.ratio({m: 'npat'}, {m: 'equity', avg: true}, [t], 'ttm', 100).values);
    const [gm] = lastFin(E.ratio({m: 'gross'}, {m: 'revenue'}, [t], 'ttm', 100).values);
    const at = k => { const a = one(k, t, k === 'cfo' || k === 'capex' || k === 'dividends' ? 'ttm' : 'q'); return ri >= 0 && fin(a[ri]) ? a[ri] : lastFin(a)[0]; };
    const mcap = v.market_cap, debt = (at('st_debt') || 0) + (at('lt_debt') || 0), cash = (at('cash') || 0) + (at('st_invest') || 0);
    const ev = fin(mcap) ? mcap + debt - cash : null, cff = fin(at('cfo')) && fin(at('capex')) ? at('cfo') - Math.abs(at('capex')) : null;
    const ey = fin(v.pe) && v.pe > 0 ? 100 / v.pe : null, div = fin(at('dividends')) && fin(mcap) && mcap > 0 ? Math.abs(at('dividends')) / mcap * 100 : null;
    const odd = fin(roe) && Math.abs(roe) > 100;  // vốn chủ gần 0 hoặc âm: ROE vô nghĩa, bỏ khỏi chart
    return {t, name: c.name || '', roe: odd ? null : roe, odd, gm, pb: fin(v.pb) && v.pb > 0 ? v.pb : null, pe: fin(v.pe) && v.pe > 0 ? v.pe : null, ey, div: fin(div) && fin(ey) ? Math.min(div, ey) : div,
      kept: fin(ey) && fin(div) ? Math.max(0, ey - div) : null, ev, cff, evcff: fin(ev) && fin(cff) && cff > 0 ? ev / cff : null, period: D.periods[ri] || D.periods[i], vdate: v.date};
  });
}
// Hồi quy y = a + b·x trên các điểm có đủ số.
function fit(pts) { const n = pts.length; if (n < 3) return null; const mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
  const b = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / (pts.reduce((s, p) => s + (p.x - mx) ** 2, 0) || 1); return {a: my - b * mx, b}; }
const labelPlugin = {id: 'pvLabels', afterDatasetsDraw(ch) { const ctx = ch.ctx; ctx.save(); ctx.font = '600 12.5px Inter, sans-serif'; ctx.fillStyle = '#3B4256';
  ch.data.datasets.forEach((ds, di) => { if (!ds.pvLabel) return; ch.getDatasetMeta(di).data.forEach((pt, k) => { const lb = ds.data[k]?.t; if (lb) ctx.fillText(lb, pt.x + 11, pt.y + 4); }); }); ctx.restore(); }};
const valPlugin = {id: 'pvVals', afterDatasetsDraw(ch, _a, o) { if (!o?.on) return; const ctx = ch.ctx; ctx.save(); ctx.font = '600 11.5px Inter, sans-serif'; ctx.fillStyle = '#3B4256'; ctx.textAlign = 'center';
  ch.data.datasets.forEach((ds, di) => ch.getDatasetMeta(di).data.forEach((b, k) => { const v = ds.data[k]; if (!fin(v)) return; const txt = o.fmt(v, ds);
    ctx.fillStyle = o.inside && [HI, LO].includes(ds.backgroundColor?.[k]) ? '#fff' : '#3B4256';  // chữ trắng trên cột đậm
    if (o.inside) { const h = Math.abs(b.base - b.y); if (h > 16) ctx.fillText(txt, b.x, (b.y + b.base) / 2 + 4); } else ctx.fillText(txt, b.x, b.y - 6); })); ctx.restore(); }};

function mount(host, D, opt = {}) {
  if (!host || !D || !window.IndustryFin || !window.Chart) return;
  const E = IndustryFin.create(D), M = metrics(D, E);
  let hi = opt.highlight && M.some(m => m.t === opt.highlight) ? opt.highlight : M[0]?.t;
  const wrap = el('section', 'pv-wrap');
  const head = el('div', 'pv-head', `<label>Mã so sánh <select>${M.map(m => `<option${m.t === hi ? ' selected' : ''}>${m.t}</option>`).join('')}</select></label>
    <span class="pv-note">Mỗi chart: mã được chọn tô đậm, các mã khác màu xám. P/E, P/B, vốn hóa theo phiên ${esc(M.find(m => m.vdate)?.vdate?.split('-').reverse().join('/') || '')}; số tài chính TTM đến ${esc((M[0]?.period || '').replace(/(\d{4})Q(\d)/, 'Q$2/$1'))}.</span>`);
  const grid = el('div', 'pv-grid'); wrap.append(head, grid); host.append(wrap);
  const SRC = `Nguồn: ${opt.src || 'BCTC hợp nhất theo quý'}; P/E, P/B, vốn hóa: <a href="https://dstock.vndirect.com.vn/" target="_blank" rel="noopener">VNDirect</a>; tự tính`;
  const card = (title, sub, note) => { const c = el('div', 'card pv-card', `<div class="chart-title"></div><div class="chart-sub">${sub}</div><div class="pv-cv"><canvas role="img"></canvas></div><div class="pw-src">${SRC}${note ? ' · ' + note : ''}</div>`); grid.append(c); return c; };
  const C = [card('', 'Trục ngang: ROE TTM (%) · trục dọc: P/B (lần) · đường đứt là xu hướng ngành (hồi quy); nằm dưới đường = rẻ hơn so với ROE'),
    card('', 'Trục ngang: biên gộp TTM (%) · trục dọc: ROE TTM (%)'),
    card('', '% giá cổ phiếu · 1/PE tách phần trả bằng cổ tức tiền (TTM) và phần giữ lại', 'cổ tức = tiền đã trả trong lưu chuyển tiền tệ 4 quý gần nhất'),
    card('', 'lần · P/E TTM và EV ÷ (CFO − CAPEX) TTM; dòng tiền âm thì không có cột', 'EV = vốn hóa + nợ vay − tiền và đầu tư ngắn hạn')];
  const skip = new Set(opt.skip || []); skip.forEach(k => C[k]?.remove());
  const charts = [];
  const scatter = (c, pts, xl, yl, xf, yf, trend) => {
    const f = trend ? fit(pts) : null, xs = pts.map(p => p.x), lo = Math.min(...xs), hi2 = Math.max(...xs);
    return new Chart(c.querySelector('canvas'), {type: 'scatter', data: {datasets: [
        {pvLabel: true, data: pts, pointRadius: pts.map(p => p.t === hi ? 11 : 8), pointHoverRadius: 12, backgroundColor: pts.map(p => p.t === hi ? HI : LO), borderWidth: 0},
        ...(f ? [{type: 'line', data: [{x: lo - (hi2 - lo) * .08, y: f.a + f.b * (lo - (hi2 - lo) * .08)}, {x: hi2 + (hi2 - lo) * .08, y: f.a + f.b * (hi2 + (hi2 - lo) * .08)}], borderColor: '#9AA1B4', borderDash: [8, 6], borderWidth: 2, pointRadius: 0, label: 'Xu hướng ngành'}] : [])]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, layout: {padding: {right: 40}},
        plugins: {legend: {display: false}, tooltip: {callbacks: {label: x => x.raw.t ? ` ${x.raw.t}: ${xl} ${xf(x.raw.x)}, ${yl} ${yf(x.raw.y)}` : ' Xu hướng ngành'}}},
        scales: {x: {title: {display: true, text: xl, color: '#6B7392'}, grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', callback: xf}}, y: {title: {display: true, text: yl, color: '#6B7392'}, grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', callback: yf}}}},
      plugins: [labelPlugin]});
  };
  const pct = v => nf(v, 0) + '%', x1 = v => nf(v, 1);
  function draw() {
    charts.forEach(ch => ch.destroy()); charts.length = 0;
    const H = M.find(m => m.t === hi) || {};
    // 1. P/B so với ROE
    const p1 = M.filter(m => fin(m.roe) && fin(m.pb)).map(m => ({x: m.roe, y: m.pb, t: m.t})), f1 = fit(p1);
    const gap = f1 && fin(H.roe) && fin(H.pb) ? H.pb / (f1.a + f1.b * H.roe) - 1 : null;
    C[0].querySelector('.chart-title').textContent = `P/B so với ROE: ${hi} ${gap == null ? '' : Math.abs(gap) < .1 ? 'nằm gần đường xu hướng ngành' : gap < 0 ? `rẻ hơn đường xu hướng ${nf(-gap * 100, 0)}%` : `đắt hơn đường xu hướng ${nf(gap * 100, 0)}%`}`;
    charts.push(scatter(C[0], p1, 'ROE', 'P/B', pct, v => nf(v, 1) + 'x', true));
    // 2. Biên gộp so với ROE
    const p2 = M.filter(m => fin(m.gm) && fin(m.roe)).map(m => ({x: m.gm, y: m.roe, t: m.t})), top = [...p2].sort((a, b) => b.x - a.x)[0];
    C[1].querySelector('.chart-title').textContent = `Biên gộp so với ROE: ${top ? `${top.t} biên gộp cao nhất (${nf(top.x, 0)}%)` : ''}${fin(H.gm) && top?.t !== hi ? `; ${hi} biên gộp ${nf(H.gm, 0)}%, ROE ${nf(H.roe, 0)}%` : ''}`;
    charts.push(scatter(C[1], p2, 'Biên gộp', 'ROE', pct, pct, false));
    // 3. Lợi suất lợi nhuận
    const m3 = M.filter(m => fin(m.ey));
    C[2].querySelector('.chart-title').textContent = fin(H.ey) ? `Lợi suất lợi nhuận (1/PE): mỗi 100 đồng giá ${hi} mua ~${nf(H.ey, 1)} đồng lợi nhuận${fin(H.div) ? `, ~${nf(H.div, 1)} đồng trả về bằng cổ tức tiền` : ''}` : 'Lợi suất lợi nhuận (1/PE)';
    charts.push(new Chart(C[2].querySelector('canvas'), {type: 'bar', data: {labels: m3.map(m => m.t), datasets: [
        {label: 'Cổ tức tiền', data: m3.map(m => m.div), backgroundColor: m3.map(m => m.t === hi ? HI : LO), stack: 's'},
        {label: 'Lợi nhuận giữ lại', data: m3.map(m => m.kept), backgroundColor: m3.map(m => m.t === hi ? HI2 : LO2), stack: 's'}]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend: {position: 'bottom', labels: {usePointStyle: true, boxWidth: 8, color: '#3B4256'}}, pvVals: {on: true, inside: true, fmt: v => nf(v, 1) + '%'},
        tooltip: {callbacks: {label: x => ` ${x.dataset.label}: ${nf(x.parsed.y, 1)}% giá`}}}, scales: {x: {stacked: true, grid: {display: false}, ticks: {color: '#3B4256'}}, y: {stacked: true, beginAtZero: true, grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', callback: pct}, title: {display: true, text: '% giá cổ phiếu', color: '#6B7392'}}}},
      plugins: [valPlugin]}));
    // 4. P/E và EV/CFF
    if (skip.has(3)) return;
    const m4 = M.filter(m => fin(m.pe) || fin(m.evcff));
    C[3].querySelector('.chart-title').textContent = `EV/dòng tiền cho doanh nghiệp so với P/E: ${hi} P/E ${nf(H.pe, 1)}x, EV/dòng tiền ${fin(H.evcff) ? nf(H.evcff, 1) + 'x' : fin(H.cff) ? 'dòng tiền âm' : '—'}${fin(H.pe) && fin(H.evcff) && H.evcff > H.pe * 2 ? ' — rẻ trên lợi nhuận nhưng dòng tiền còn thấp' : ''}`;
    charts.push(new Chart(C[3].querySelector('canvas'), {type: 'bar', data: {labels: m4.map(m => m.t + (fin(m.cff) && m.cff <= 0 ? ' (dòng tiền âm)' : '')), datasets: [
        {label: 'P/E TTM', data: m4.map(m => m.pe), backgroundColor: m4.map(m => m.t === hi ? HI2 : LO2)},
        {label: 'EV / dòng tiền cho doanh nghiệp TTM', data: m4.map(m => m.evcff), backgroundColor: m4.map(m => m.t === hi ? HI : LO)}]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend: {position: 'bottom', labels: {usePointStyle: true, boxWidth: 8, color: '#3B4256'}}, pvVals: {on: true, fmt: v => nf(v, 1) + 'x'},
        tooltip: {callbacks: {label: x => ` ${x.dataset.label}: ${nf(x.parsed.y, 1)}x`}}}, scales: {x: {grid: {display: false}, ticks: {color: '#3B4256'}}, y: {beginAtZero: true, grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', callback: v => nf(v, 0) + 'x'}, title: {display: true, text: 'Bội số (lần)', color: '#6B7392'}}}},
      plugins: [valPlugin]}));
  }
  head.querySelector('select').addEventListener('change', e => { hi = e.target.value; draw(); });
  const miss = M.filter(m => !fin(m.pe) && !fin(m.pb)).map(m => m.t);
  if (miss.length) head.insertAdjacentHTML('beforeend', `<span class="pv-note">Chưa có P/E, P/B: ${miss.join(', ')}.</span>`);
  const odd = M.filter(m => m.odd).map(m => m.t);
  if (odd.length) head.insertAdjacentHTML('beforeend', `<span class="pv-note">Bỏ khỏi chart ROE: ${odd.join(', ')} (ROE trên 100% vì vốn chủ gần 0 hoặc âm).</span>`);
  if (!document.getElementById('pv-style')) { const st = el('style'); st.id = 'pv-style'; st.textContent = `.pv-head{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;margin:4px 0 12px}.pv-head label{font:600 12.5px Inter,sans-serif;color:#3B4256}.pv-head select{margin-left:6px;font:600 12.5px Inter,sans-serif;padding:4px 8px;border:1px solid #D6DBE8;border-radius:7px}.pv-note{font-size:12px;color:#6B7392}
.pv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pv-cv{position:relative;height:330px;margin-top:8px}.pv-card .chart-title{min-height:2.7em}@media(max-width:900px){.pv-grid{grid-template-columns:1fr}}`; document.head.append(st); }
  draw();
  return {metrics: M};
}
// Tự gắn vào tab Tài chính ngành (#mt14) của mọi trang có dữ liệu BCTC theo khuôn IndustryFin (window.*_FIN).
// Trang dùng khung sub-tab (*-frame.js): thêm sub-tab "Định giá" (hoặc dùng sub-tab Định giá đã có); trang khác: thêm mục cuối tab.
// BĐS dân cư, KCN: bỏ chart EV/dòng tiền (tiền khách trả trước làm CFO nhảy mạnh, bội số không có nghĩa).
const NO_EV = ['RE_FIN', 'KCN_FIN'];
function auto() {
  const key = Object.keys(window).find(k => /_FIN$/.test(k) && window[k]?.companies?.length && window[k]?.periods?.length);
  if (!key || !window.COMPANY_VALUATION) return;
  const D = window[key], start = Date.now();
  const tick = () => {
    const pane = document.querySelector('.majorpane[data-tab="mt14"]');
    if (pane?.querySelector('.pv-wrap')) return;  // trang đã gắn sẵn (Dệt may)
    // Hai kiểu thanh sub-tab: khung mới (.of-nav/.of-tab/.of-pane) và kiểu cũ (.pane-subtabs/.tabbtn/.pane-subpane, trang Điện, Thép).
    // Kiểu thứ ba: .pp-nav/.pp-tab/.pp-pane (trang Điện, Viễn thông).
    const nav = pane?.querySelector('.of-nav') || pane?.querySelector('.pp-nav') || pane?.querySelector(':scope > .pane-subtabs'), late = Date.now() - start > 8000, old = !!nav && !nav.matches('.of-nav'), pp = !!nav?.matches('.pp-nav');
    if (!pane || (!nav && !late)) return setTimeout(tick, 400);
    const opt = {highlight: D.companies[0].ticker, skip: NO_EV.includes(key) ? [3] : [], src: `<a href="${D.url || 'https://api-finfo.vndirect.com.vn/v4/financial_statements'}" target="_blank" rel="noopener">${esc(D.source || 'BCTC hợp nhất theo quý')}</a>`};
    let body = pane.querySelector('#of-mt14-valuation .of-body');
    if (!body && nav) {
      const sec = nav.parentElement, TAB = pp ? '.pp-tab' : old ? '.tabbtn' : '.of-tab', PANE = pp ? ':scope > .pp-pane' : old ? ':scope > .pane-subpane' : ':scope > .of-pane', n = nav.querySelectorAll(TAB).length + 1;
      const b = el('button', pp ? 'tabbtn pp-tab' : old ? 'tabbtn' : 'of-tab', pp ? `<span>${String(n).padStart(2, '0')}</span>Định giá` : old ? 'Định giá' : `<span class="of-n">${String(n).padStart(2, '0')}</span><b>Định giá</b>`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = 'valuation'; b.id = 'of-mt14-valuation-tab'; b.setAttribute('aria-selected', 'false');
      const sp = el('div', pp ? 'pane-subpane pp-pane' : 'pane-subpane of-pane'); sp.id = 'of-mt14-valuation'; sp.dataset.sub = 'valuation'; sp.setAttribute('role', 'tabpanel'); sp.hidden = true; body = el('div', 'of-body'); sp.append(body);
      nav.append(b); const panes = sec.querySelectorAll(PANE); (panes[panes.length - 1] || nav).after(sp);
      const show = on => { sp.hidden = !on; sp.style.display = on ? '' : 'none'; b.setAttribute('aria-selected', String(on)); b.classList.toggle('active', on); if (on) { sec.querySelectorAll(PANE).forEach(p => { if (p !== sp) { p.hidden = true; p.classList.remove('active'); } }); nav.querySelectorAll(TAB).forEach(x => { if (x !== b) { x.setAttribute('aria-selected', 'false'); x.classList.remove('active'); } });
        const u = new URL(location.href); u.searchParams.set('sub', 'valuation'); history.replaceState(null, '', u.pathname + u.search + u.hash); setTimeout(() => window.dispatchEvent(new Event('resize')), 30); } };
      nav.addEventListener('click', e => { const t = e.target.closest(TAB); if (t) show(t === b); }, true);
      if (new URL(location.href).searchParams.get('sub') === 'valuation') show(true);
    }
    if (!body) { body = el('section', 'section pv-auto-sec', '<div class="sectionhead"><div><h2 class="sec">Định giá so sánh giữa các mã</h2></div></div>'); pane.append(body); }
    mount(body, D, opt);
    body.querySelector('.pv-wrap')?.classList.add('of-wide');
  };
  tick();
}
window.PeerValuation = {mount, metrics, auto};
if (document.currentScript?.dataset.auto != null) { if (document.readyState === 'complete') auto(); else window.addEventListener('load', auto); }
})();
