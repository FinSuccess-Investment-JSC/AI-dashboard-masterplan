/* So sánh định giá giữa các mã cùng ngành (27/11/2026, người dùng gửi mẫu 4 chart cho dệt may):
   1) P/B so với ROE + đường xu hướng ngành (hồi quy tuyến tính) · 2) Biên gộp so với ROE
   3) Lợi suất lợi nhuận (1/PE) tách cổ tức tiền và lợi nhuận giữ lại · 4) P/E TTM và EV / dòng tiền cho doanh nghiệp TTM.
   Dùng chung mọi ngành phi tài chính có dữ liệu BCTC theo khuôn IndustryFin (window.<NGÀNH>_FIN) và window.COMPANY_VALUATION.
   Không dùng cho ngân hàng, bảo hiểm, chứng khoán (không có biên gộp; EV không có nghĩa).
   Cách tính (TTM = 4 quý gần nhất của BCTC hợp nhất):
   ROE = LNST TTM ÷ VCSH bình quân · Biên gộp = LN gộp TTM ÷ doanh thu TTM · P/E, P/B, vốn hóa: VNDirect theo phiên
   Lợi suất cổ tức tiền = cổ tức đã trả bằng tiền TTM (lưu chuyển tiền tệ) ÷ vốn hóa · Lợi nhuận giữ lại = 1/PE − lợi suất cổ tức (không âm)
   EV = vốn hóa + nợ vay ngắn, dài hạn − tiền − đầu tư tài chính ngắn hạn (cuối quý gần nhất)
   Dòng tiền cho doanh nghiệp (giản lược) = CFO TTM − CAPEX TTM; âm thì không tính bội số, ghi "âm".

   Bộ chỉ số riêng theo ngành (28/11/2026, người dùng: "định giá, so sánh tài chính chưa customized cho từng ngành"): PROFILES bên dưới
   chọn chart và cột bảng theo mô hình kinh doanh; ngành không có profile giữ nguyên 4 chart mẫu. Ở ngành có profile: màu theo nhóm
   doanh nghiệp (D.groups), bấm nhóm để bỏ/thêm, thêm bảng so sánh theo nhóm. Chỉ dùng số đã có trong BCTC quý và định giá theo phiên:
   EV (profile) = vốn hóa + nợ vay + lợi ích cổ đông không kiểm soát (sổ sách) − tiền − đầu tư ngắn hạn; EV ≤ 0 thì không tính bội số
   EBITDA = LN gộp − CP bán hàng − CP QLDN + khấu hao (TTM) · Tiền ròng = tiền + đầu tư ngắn hạn − nợ vay
   P/E trừ tiền ròng = P/E × (1 − tiền ròng ÷ vốn hóa), chỉ tính khi 0 < tiền ròng < vốn hóa · Trung vị P/B 5 năm: COMPANY_VALUATION.median5
   Mức đã khấu hao = hao mòn lũy kế ÷ nguyên giá TSCĐ hữu hình · EV ÷ TSCĐ hữu hình ròng: thước thay cho P/NAV khi chưa có giá tàu thị trường
   Lợi nhuận khác ÷ LNTT: gồm lãi thanh lý tài sản (tàu), không tách được riêng từ BCTC tóm tắt. */
(() => {
'use strict';
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 1) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const HI = '#1F3A68', LO = '#8C93A3', HI2 = '#9DB0D6', LO2 = '#D3D6DE';
const rgba = (hex, a) => { const n = parseInt(String(hex || LO).slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
const DEFAULT_CHARTS = ['pb_roe', 'gm_roe', 'yield', 'pe_evcf'];
// Bộ chart và cột bảng theo ngành. Khóa = tên biến dữ liệu BCTC của trang (window.<KHÓA>).
const PROFILES = {
  OIL_FIN: {charts: ['pe_ev', 'netcash', 'pb_roe', 'yield'], cols: ['pe', 'evebitda', 'pb', 'pbgap', 'ncash', 'dy', 'roe', 'ebitdam', 'assoc', 'dio'],
    note: 'Ba khâu có mô hình khác nhau: so bội số trong cùng khâu. Lọc dầu (BSR) lợi nhuận theo crack spread, P/E một kỳ không đại diện chu kỳ.'},
  RE_FIN: {charts: ['pb_roe', 'pb_lev', 'adv_mcap', 'st_cash'], cols: ['pb', 'pbgap', 'pe', 'roe', 'advmc', 'advrev', 'invta', 'nde', 'stcash', 'finpbt'],
    note: 'Lợi nhuận chủ đầu tư ghi nhận theo thời điểm bàn giao: P/B và tiền khách trả trước ổn định hơn P/E. Chưa có RNAV, doanh số bán trước (cần nhập từ tài liệu doanh nghiệp).'},
  TEXTILE_FIN: {charts: ['pb_roe', 'gm_roe', 'yield', 'pe_ev'], cols: ['pe', 'evebitda', 'pb', 'pbgap', 'dy', 'roe', 'gm', 'ndebitda', 'doubt', 'assoc'],
    note: 'VGT là công ty mẹ nắm nhiều công ty con, liên kết: P/E, EV/EBITDA không so trực tiếp với doanh nghiệp may.'},
  SHIP_FIN: {charts: ['pb_roe', 'pb_med', 'pe_ev', 'ev_ppe'], cols: ['pb', 'pbgap', 'evebitda', 'pe', 'evppe', 'dep', 'ebitdam', 'ndebitda', 'otherpbt', 'dy'],
    note: 'Vận tải biển định giá theo tài sản: P/E thấp ở đỉnh cước hoặc khi có lãi bán tàu không có nghĩa là rẻ. Chưa có P/NAV theo giá tàu thị trường.'}
};
const x1f = v => nf(v, 1) + 'x', p0 = v => nf(v, 0) + '%', p1 = v => nf(v, 1) + '%';
const COLS = {
  pe: ['P/E', x1f, 'P/E TTM theo phiên'], pb: ['P/B', v => nf(v, 2) + 'x', 'P/B theo phiên'],
  pbgap: ['P/B so trung vị 5N', v => (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 0) + '%', 'P/B hiện tại ÷ trung vị P/B 5 năm − 1'],
  evebitda: ['EV/EBITDA', x1f, 'EV ÷ EBITDA TTM; trống khi EBITDA không dương hoặc tiền ròng lớn hơn vốn hóa'],
  ncash: ['Tiền ròng ÷ vốn hóa', p0, '(Tiền + đầu tư ngắn hạn − nợ vay) ÷ vốn hóa; âm là nợ ròng'],
  dy: ['Cổ tức tiền ÷ giá', p1, 'Cổ tức tiền đã trả 4 quý gần nhất ÷ vốn hóa'], roe: ['ROE', p1, 'LNST TTM ÷ VCSH bình quân'], gm: ['Biên gộp', p1, 'LN gộp TTM ÷ doanh thu TTM'],
  ebitdam: ['Biên EBITDA', p1, 'EBITDA TTM ÷ doanh thu TTM'], assoc: ['Lãi liên kết ÷ LNTT', p0, 'Lãi/lỗ công ty liên doanh, liên kết TTM ÷ LNTT TTM'],
  otherpbt: ['LN khác ÷ LNTT', p0, 'Lợi nhuận khác TTM (gồm lãi thanh lý tàu) ÷ LNTT TTM'], finpbt: ['Thu nhập tài chính ÷ LNTT', p0, 'Doanh thu hoạt động tài chính TTM (lãi tiền gửi, chuyển nhượng vốn) ÷ LNTT TTM'],
  dio: ['Ngày tồn kho', v => nf(v, 0), 'Hàng tồn kho bình quân ÷ giá vốn TTM × 365'], invta: ['Tồn kho ÷ tổng tài sản', p0, 'Hàng tồn kho ÷ tổng tài sản, cuối quý'],
  advmc: ['Khách trả trước ÷ vốn hóa', p0, 'Người mua trả tiền trước ngắn hạn ÷ vốn hóa'], advrev: ['Khách trả trước ÷ doanh thu', v => v > 20 ? '>20x' : x1f(v), 'Người mua trả tiền trước ngắn hạn ÷ doanh thu TTM (số năm doanh thu đã thu tiền)'],
  nde: ['Nợ vay ròng ÷ VCSH', p0, '(Nợ vay − tiền − đầu tư ngắn hạn) ÷ vốn chủ sở hữu; âm là tiền ròng'], stcash: ['Nợ vay ngắn hạn ÷ tiền', v => nf(v, 2) + 'x', 'Vay và nợ thuê tài chính ngắn hạn (gồm nợ dài hạn đến hạn trả) ÷ tiền và đầu tư ngắn hạn'],
  ndebitda: ['Nợ vay ròng ÷ EBITDA', v => nf(v, 1) + 'x', 'Nợ vay ròng ÷ EBITDA TTM; âm là tiền ròng'], doubt: ['Dự phòng ÷ phải thu', p0, 'Dự phòng phải thu ngắn hạn khó đòi ÷ phải thu khách hàng ngắn hạn'],
  evppe: ['EV ÷ TSCĐ ròng', v => nf(v, 2) + 'x', 'EV ÷ TSCĐ hữu hình ròng (đội tàu theo sổ sách)'], dep: ['Đã khấu hao', p0, 'Hao mòn lũy kế ÷ nguyên giá TSCĐ hữu hình; càng cao đội tàu càng cũ theo sổ sách']
};

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
    // Chỉ số theo ngành: số dư lấy cuối quý, số phát sinh lấy TTM, cùng kỳ với ROE. Thiếu thành phần thì null.
    const X = k => { const a = E.per(k, [t], E.kind[k] === 'stock' ? 'q' : 'ttm')[t] || []; const x = ri >= 0 ? a[ri] : lastFin(a)[0]; return fin(x) ? x : null; };
    const dv = (a, b, sc = 1) => fin(a) && fin(b) && b > 0 ? a / b * sc : null;
    const hasDebt = fin(X('st_debt')) || fin(X('lt_debt')), hasCash = fin(X('cash')), nci = X('nci') || 0;
    const nd = hasDebt && hasCash ? debt - cash : null, evn = fin(mcap) && fin(nd) ? mcap + nd + nci : null, ebitda = X('ebitda'), pbt = X('pbt'), rev = X('revenue');
    const ncash = fin(nd) && fin(mcap) && mcap > 0 ? -nd / mcap * 100 : null, pbmed = v.median5?.pb, pb0 = fin(v.pb) && v.pb > 0 ? v.pb : null, pe0 = fin(v.pe) && v.pe > 0 ? v.pe : null;
    const [dio] = lastFin(E.ratio({m: 'inventory', avg: true}, {m: 'cogs'}, [t], 'ttm', 365).values);
    const ext = {group: c.group, evn, ebitda, nd, ncash, evebitda: fin(evn) && evn > 0 ? dv(evn, ebitda) : null, evneg: fin(evn) && evn <= 0, ebneg: fin(ebitda) && ebitda <= 0,
      pex: fin(pe0) && fin(ncash) && ncash > 0 && ncash < 100 ? pe0 * (1 - ncash / 100) : null, pbmed: fin(pbmed) && pbmed > 0 ? pbmed : null, pbgap: fin(pb0) && fin(pbmed) && pbmed > 0 ? (pb0 / pbmed - 1) * 100 : null,
      ebitdam: dv(ebitda, rev, 100), assoc: dv(X('assoc'), pbt, 100), otherpbt: dv(X('other'), pbt, 100), finpbt: dv(X('fin_income'), pbt, 100), dio: fin(dio) && dio >= 0 ? dio : null,
      invta: dv(X('inventory'), X('total_assets'), 100), advmc: dv(X('adv_customers'), mcap, 100), advrev: dv(X('adv_customers'), rev), nde: fin(nd) ? dv(nd, X('equity'), 100) : null,
      stcash: hasCash ? dv(X('st_debt'), cash) : null, ndebitda: fin(nd) ? dv(nd, ebitda) : null, doubt: fin(X('doubtful')) ? dv(Math.abs(X('doubtful')), X('receivables'), 100) : null,
      evppe: fin(evn) && evn > 0 ? dv(evn, X('ppe_net')) : null, dep: fin(X('ppe_accdep')) ? dv(Math.abs(X('ppe_accdep')), X('ppe_gross'), 100) : null};
    return {...ext, dy: fin(div) ? div : null, t, name: c.name || '', roe: odd ? null : roe, odd, gm, pb: fin(v.pb) && v.pb > 0 ? v.pb : null, pe: fin(v.pe) && v.pe > 0 ? v.pe : null, ey, div: fin(div) && fin(ey) ? Math.min(div, ey) : div,
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
    ctx.fillStyle = o.inside && ds.pvDark ? '#fff' : '#3B4256';  // chữ trắng trên cột đậm
    if (o.inside) { const h = Math.abs(b.base - b.y); if (h > 16) ctx.fillText(txt, b.x, (b.y + b.base) / 2 + 4); } else ctx.fillText(txt, b.x, b.y - 6); })); ctx.restore(); }};

function mount(host, D, opt = {}) {
  if (!host || !D || !window.IndustryFin || !window.Chart) return;
  const E = IndustryFin.create(D), pkey = opt.profile || Object.keys(PROFILES).find(k => window[k] === D), P = PROFILES[pkey] || null;
  const GO = D.groups.map(g => g.id), GC = Object.fromEntries(D.groups.map(g => [g.id, g.color]));
  // Ngành có profile: xếp mã theo nhóm doanh nghiệp để cột cùng mô hình đứng cạnh nhau.
  const ALL = P ? metrics(D, E).sort((a, b) => GO.indexOf(a.group) - GO.indexOf(b.group)) : metrics(D, E);
  let hi = opt.highlight && ALL.some(m => m.t === opt.highlight) ? opt.highlight : ALL[0]?.t, on = new Set(GO), M = ALL;
  const wrap = el('section', 'pv-wrap');
  const head = el('div', 'pv-head', `<label>Mã so sánh <select>${ALL.map(m => `<option${m.t === hi ? ' selected' : ''}>${m.t}</option>`).join('')}</select></label>
    ${P ? `<span class="pv-groups" role="group" aria-label="Nhóm doanh nghiệp">${D.groups.map(g => `<button type="button" data-g="${esc(g.id)}" aria-pressed="true"><i style="background:${esc(g.color)}"></i>${esc(g.label)}</button>`).join('')}</span>` : ''}
    <span class="pv-note">${P ? 'Màu theo nhóm doanh nghiệp, mã được chọn có viền đậm; bấm nhóm để bỏ hoặc thêm.' : 'Mỗi chart: mã được chọn tô đậm, các mã khác màu xám.'} P/E, P/B, vốn hóa theo phiên ${esc(ALL.find(m => m.vdate)?.vdate?.split('-').reverse().join('/') || '')}; số tài chính TTM đến ${esc((ALL[0]?.period || '').replace(/(\d{4})Q(\d)/, 'Q$2/$1'))}.</span>`);
  const grid = el('div', 'pv-grid'); wrap.append(head, grid); host.append(wrap);
  const SRC = `Nguồn: ${opt.src || 'BCTC hợp nhất theo quý'}; P/E, P/B, vốn hóa: <a href="https://dstock.vndirect.com.vn/" target="_blank" rel="noopener">VNDirect</a>; tự tính`;
  const EVN = 'EV = vốn hóa + nợ vay + lợi ích cổ đông không kiểm soát − tiền và đầu tư ngắn hạn';
  // Màu: profile → theo nhóm (mã chọn đậm + viền); mặc định → mã chọn navy, còn lại xám.
  const cMain = m => P ? rgba(GC[m.group], m.t === hi ? 1 : .7) : m.t === hi ? HI : LO, cSoft = m => P ? rgba(GC[m.group], m.t === hi ? .45 : .25) : m.t === hi ? HI2 : LO2;
  const bw = arr => arr.map(m => P && m.t === hi ? 2 : 0), AX = {grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392'}}, LEG = {position: 'bottom', labels: {usePointStyle: true, boxWidth: 8, color: '#3B4256'}};
  const pct = v => nf(v, 0) + '%', x1 = v => nf(v, 1);
  const scatter = (c, src, xk, yk, xl, yl, xf, yf, trend) => {
    const pts = src.filter(m => fin(m[xk]) && fin(m[yk])).map(m => ({x: m[xk], y: m[yk], t: m.t, m}));
    const f = trend ? fit(pts) : null, xs = pts.map(p => p.x), lo = Math.min(...xs), hi2 = Math.max(...xs);
    const ch = new Chart(c.querySelector('canvas'), {type: 'scatter', data: {datasets: [
        {pvLabel: true, data: pts, pointRadius: pts.map(p => p.t === hi ? 11 : 8), pointHoverRadius: 12, backgroundColor: pts.map(p => cMain(p.m)), borderColor: '#1B2340', borderWidth: bw(pts.map(p => p.m))},
        ...(f ? [{type: 'line', data: [{x: lo - (hi2 - lo) * .08, y: f.a + f.b * (lo - (hi2 - lo) * .08)}, {x: hi2 + (hi2 - lo) * .08, y: f.a + f.b * (hi2 + (hi2 - lo) * .08)}], borderColor: '#9AA1B4', borderDash: [8, 6], borderWidth: 2, pointRadius: 0, label: 'Xu hướng ngành'}] : [])]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, layout: {padding: {right: 40}},
        plugins: {legend: {display: false}, tooltip: {callbacks: {label: x => x.raw.t ? ` ${x.raw.t}: ${xl} ${xf(x.raw.x)}, ${yl} ${yf(x.raw.y)}` : ' Xu hướng ngành'}}},
        scales: {x: {title: {display: true, text: xl, color: '#6B7392'}, grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', callback: xf}}, y: {title: {display: true, text: yl, color: '#6B7392'}, grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', callback: yf}}}},
      plugins: [labelPlugin]});
    return {ch, pts, f};
  };
  // Cột: sets = [[nhãn, khóa, hàm màu]]; một bộ thì ẩn chú giải.
  const bars = (c, src, sets, yl, fmt, o = {}) => new Chart(c.querySelector('canvas'), {type: 'bar', data: {labels: src.map(m => m.t + (o.tag?.(m) || '')), datasets: sets.map(([label, k, col], si) => (
      {label, data: src.map(m => m[k]), backgroundColor: src.map(col), borderColor: '#1B2340', borderWidth: bw(src), pvDark: si === (o.dark ?? -1), stack: o.stacked ? 's' : undefined}))},
    options: {responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend: sets.length > 1 ? LEG : {display: false}, pvVals: {on: true, inside: !!o.stacked, fmt},
      tooltip: {callbacks: {label: x => ` ${x.dataset.label}: ${fmt(x.parsed.y)}${o.tip || ''}`}}}, scales: {x: {stacked: !!o.stacked, grid: {display: false}, ticks: {color: '#3B4256'}},
      y: {stacked: !!o.stacked, beginAtZero: true, ...AX, ticks: {color: '#6B7392', callback: o.tick || fmt}, title: {display: true, text: yl, color: '#6B7392'}}}}, plugins: [valPlugin]});
  const best = (src, k, dir = 1) => [...src.filter(m => fin(m[k]))].sort((a, b) => (b[k] - a[k]) * dir)[0];
  // Danh mục chart: sub = dòng phụ, note = ghi chú cạnh nguồn, draw trả về [tiêu đề, chart].
  const CAT = {
    pb_roe: {sub: 'Trục ngang: ROE TTM (%) · trục dọc: P/B (lần) · đường đứt là xu hướng ngành (hồi quy); nằm dưới đường = rẻ hơn so với ROE', draw(c, H) {
      const r = scatter(c, M, 'roe', 'pb', 'ROE', 'P/B', pct, v => nf(v, 1) + 'x', true), f1 = r.f, gap = f1 && fin(H.roe) && fin(H.pb) ? H.pb / (f1.a + f1.b * H.roe) - 1 : null;
      return [`P/B so với ROE: ${hi} ${gap == null ? '' : Math.abs(gap) < .1 ? 'nằm gần đường xu hướng ngành' : gap < 0 ? `rẻ hơn đường xu hướng ${nf(-gap * 100, 0)}%` : `đắt hơn đường xu hướng ${nf(gap * 100, 0)}%`}`, r.ch]; }},
    gm_roe: {sub: 'Trục ngang: biên gộp TTM (%) · trục dọc: ROE TTM (%)', draw(c, H) {
      const r = scatter(c, M, 'gm', 'roe', 'Biên gộp', 'ROE', pct, pct, false), top = [...r.pts].sort((a, b) => b.x - a.x)[0];
      return [`Biên gộp so với ROE: ${top ? `${top.t} biên gộp cao nhất (${nf(top.x, 0)}%)` : ''}${fin(H.gm) && top?.t !== hi ? `; ${hi} biên gộp ${nf(H.gm, 0)}%, ROE ${nf(H.roe, 0)}%` : ''}`, r.ch]; }},
    yield: {sub: '% giá cổ phiếu · 1/PE tách phần trả bằng cổ tức tiền (TTM) và phần giữ lại', note: 'cổ tức = tiền đã trả trong lưu chuyển tiền tệ 4 quý gần nhất', draw(c, H) {
      const m3 = M.filter(m => fin(m.ey));
      return [fin(H.ey) ? `Lợi suất lợi nhuận (1/PE): mỗi 100 đồng giá ${hi} mua ~${nf(H.ey, 1)} đồng lợi nhuận${fin(H.div) ? `, ~${nf(H.div, 1)} đồng trả về bằng cổ tức tiền` : ''}` : 'Lợi suất lợi nhuận (1/PE)',
        bars(c, m3, [['Cổ tức tiền', 'div', cMain], ['Lợi nhuận giữ lại', 'kept', cSoft]], '% giá cổ phiếu', v => nf(v, 1) + '%', {stacked: true, dark: 0, tick: pct, tip: ' giá'})]; }},
    pe_evcf: {sub: 'lần · P/E TTM và EV ÷ (CFO − CAPEX) TTM; dòng tiền âm thì không có cột', note: 'EV = vốn hóa + nợ vay − tiền và đầu tư ngắn hạn', draw(c, H) {
      const m4 = M.filter(m => fin(m.pe) || fin(m.evcff));
      return [`EV/dòng tiền cho doanh nghiệp so với P/E: ${hi} P/E ${nf(H.pe, 1)}x, EV/dòng tiền ${fin(H.evcff) ? nf(H.evcff, 1) + 'x' : fin(H.cff) ? 'dòng tiền âm' : '—'}${fin(H.pe) && fin(H.evcff) && H.evcff > H.pe * 2 ? ' — rẻ trên lợi nhuận nhưng dòng tiền còn thấp' : ''}`,
        bars(c, m4, [['P/E TTM', 'pe', cSoft], ['EV / dòng tiền cho doanh nghiệp TTM', 'evcff', cMain]], 'Bội số (lần)', v => nf(v, 1) + 'x', {tick: v => nf(v, 0) + 'x', tag: m => fin(m.cff) && m.cff <= 0 ? ' (dòng tiền âm)' : ''})]; }},
    pe_ev: {sub: 'lần · P/E TTM và EV ÷ EBITDA TTM; EBITDA không dương hoặc tiền ròng lớn hơn vốn hóa thì không có cột EV', note: EVN, draw(c, H) {
      const s = M.filter(m => fin(m.pe) || fin(m.evebitda)), lowPeHighEv = fin(H.pe) && fin(H.evebitda) && fin(H.nd) && H.nd > 0 && H.evebitda > H.pe;
      return [`P/E và EV/EBITDA: ${hi} P/E ${fin(H.pe) ? nf(H.pe, 1) + 'x' : '—'}, EV/EBITDA ${fin(H.evebitda) ? nf(H.evebitda, 1) + 'x' : H.evneg ? 'không tính (tiền ròng lớn hơn vốn hóa)' : H.ebneg ? 'không tính (EBITDA âm)' : '—'}${lowPeHighEv ? ' — tính cả nợ vay thì đắt hơn P/E cho thấy' : ''}`,
        bars(c, s, [['P/E TTM', 'pe', cSoft], ['EV/EBITDA TTM', 'evebitda', cMain]], 'Bội số (lần)', v => nf(v, 1) + 'x', {tick: v => nf(v, 0) + 'x', tag: m => m.evneg ? ' (tiền ròng > vốn hóa)' : ''})]; }},
    netcash: {sub: 'lần · P/E TTM và P/E sau khi trừ tiền ròng khỏi vốn hóa; doanh nghiệp nợ ròng chỉ có cột P/E', note: 'tiền ròng = tiền + đầu tư ngắn hạn − nợ vay, gồm cả tiền khách ứng trước và phần của cổ đông không kiểm soát', draw(c, H) {
      const s = M.filter(m => fin(m.pe)), top = best(M, 'ncash');
      return [fin(H.ncash) ? H.ncash > 0 ? `Tiền ròng: ${hi} có tiền ròng bằng ${nf(H.ncash, 0)}% vốn hóa${fin(H.pex) ? `, P/E trừ tiền còn ${nf(H.pex, 1)}x (từ ${nf(H.pe, 1)}x)` : ''}` : `Tiền ròng: ${hi} đang nợ ròng bằng ${nf(-H.ncash, 0)}% vốn hóa${top && top.ncash > 0 ? `; ${top.t} nhiều tiền ròng nhất (${nf(top.ncash, 0)}% vốn hóa)` : ''}` : 'P/E và P/E trừ tiền ròng',
        bars(c, s, [['P/E TTM', 'pe', cSoft], ['P/E trừ tiền ròng', 'pex', cMain]], 'Bội số (lần)', v => nf(v, 1) + 'x', {tick: v => nf(v, 0) + 'x'})]; }},
    pb_med: {sub: 'lần · P/B theo phiên và trung vị P/B 5 năm của chính mã đó', draw(c, H) {
      const s = M.filter(m => fin(m.pb) && fin(m.pbmed)), below = s.filter(m => m.pbgap < 0).length;
      return [`P/B so với trung vị 5 năm: ${fin(H.pbgap) ? `${hi} ${Math.abs(H.pbgap) < 5 ? 'ngang trung vị' : H.pbgap < 0 ? `thấp hơn ${nf(-H.pbgap, 0)}%` : `cao hơn ${nf(H.pbgap, 0)}%`}; ` : ''}${below}/${s.length} mã dưới trung vị`,
        bars(c, s, [['Trung vị P/B 5 năm', 'pbmed', cSoft], ['P/B hiện tại', 'pb', cMain]], 'P/B (lần)', v => nf(v, 2) + 'x', {tick: v => nf(v, 1) + 'x'})]; }},
    pb_lev: {sub: 'Trục ngang: nợ vay ròng ÷ vốn chủ sở hữu (%), âm là tiền ròng · trục dọc: P/B (lần)', draw(c, H) {
      const r = scatter(c, M, 'nde', 'pb', 'Nợ vay ròng/VCSH', 'P/B', pct, v => nf(v, 1) + 'x', false), top = best(M, 'nde');
      return [`P/B so với đòn bẩy: ${fin(H.nde) ? `${hi} ${H.nde < 0 ? 'có tiền ròng' : `nợ vay ròng ${nf(H.nde, 0)}% vốn chủ`}, P/B ${fin(H.pb) ? nf(H.pb, 2) + 'x' : '—'}` : ''}${top && top.t !== hi ? `; ${top.t} đòn bẩy cao nhất (${nf(top.nde, 0)}%)` : ''}`, r.ch]; }},
    adv_mcap: {sub: '% vốn hóa · người mua trả tiền trước ngắn hạn (tiền đã thu của dự án chưa bàn giao) ÷ vốn hóa', note: 'thước thay cho vốn hóa ÷ doanh số bán trước khi chưa có số bán hàng', draw(c, H) {
      const s = M.filter(m => fin(m.advmc)), top = best(s, 'advmc');
      return [`Tiền khách trả trước so với vốn hóa: ${fin(H.advmc) ? `${hi} ${nf(H.advmc, 0)}%` : ''}${top && top.t !== hi ? `; cao nhất ${top.t} (${nf(top.advmc, 0)}%)` : ''}`,
        bars(c, s, [['Người mua trả tiền trước ÷ vốn hóa', 'advmc', cMain]], '% vốn hóa', pct)]; }},
    st_cash: {sub: 'lần · vay và nợ thuê tài chính ngắn hạn (gồm nợ dài hạn đến hạn trả) ÷ tiền và đầu tư ngắn hạn; trên 1 lần = tiền không đủ trả nợ vay đến hạn 12 tháng', draw(c, H) {
      const s = M.filter(m => fin(m.stcash)), over = s.filter(m => m.stcash > 1);
      return [`Nợ vay đến hạn so với tiền: ${fin(H.stcash) ? `${hi} ${nf(H.stcash, 2)} lần; ` : ''}${over.length}/${s.length} mã trên 1 lần${over.length ? ` (${over.map(m => m.t).join(', ')})` : ''}`,
        bars(c, s, [['Nợ vay ngắn hạn ÷ tiền và đầu tư ngắn hạn', 'stcash', cMain]], 'lần', v => nf(v, 2) + 'x', {tick: v => nf(v, 1) + 'x'})]; }},
    ev_ppe: {sub: 'Trục ngang: mức đã khấu hao của TSCĐ hữu hình (%) · trục dọc: EV ÷ TSCĐ hữu hình ròng (lần); đội tàu khấu hao gần hết thì giá trị sổ sách thấp hơn giá thị trường', note: EVN, draw(c, H) {
      const r = scatter(c, M, 'dep', 'evppe', 'Đã khấu hao', 'EV/TSCĐ ròng', pct, v => nf(v, 1) + 'x', false), neg = M.filter(m => m.evneg).map(m => m.t);
      return [`EV so với giá trị sổ sách đội tàu: ${fin(H.evppe) ? `${hi} ${nf(H.evppe, 2)} lần, tài sản đã khấu hao ${nf(H.dep, 0)}%` : H.evneg ? `${hi} có tiền ròng lớn hơn vốn hóa` : ''}${neg.length ? `; không tính: ${neg.join(', ')} (tiền ròng lớn hơn vốn hóa)` : ''}`, r.ch]; }}
  };
  const keys = P ? P.charts : DEFAULT_CHARTS.filter((_, k) => !(opt.skip || []).includes(k));
  const cards = keys.map(k => { const d = CAT[k], c = el('div', 'card pv-card', `<div class="chart-title"></div><div class="chart-sub">${d.sub}</div><div class="pv-cv"><canvas role="img"></canvas></div><div class="pw-src">${SRC}${d.note ? ' · ' + d.note : ''}</div>`); grid.append(c); return c; });
  // Bảng so sánh theo nhóm doanh nghiệp (chỉ ngành có profile).
  let tbl = null;
  if (P) { tbl = el('div', 'card pv-tcard', `<div class="chart-title">So sánh theo mô hình kinh doanh</div><div class="chart-sub">${esc(P.note)}</div><div class="pv-tw"></div><div class="pw-src">${SRC}</div>`); wrap.append(tbl); }
  const table = () => { if (!tbl) return;
    tbl.querySelector('.pv-tw').innerHTML = `<table class="pv-table"><thead><tr><th>Mã</th>${P.cols.map(k => `<th title="${esc(COLS[k][2])}">${esc(COLS[k][0])}</th>`).join('')}</tr></thead><tbody>${D.groups.filter(g => on.has(g.id)).map(g => { const ms = M.filter(m => m.group === g.id);
      return ms.length ? `<tr class="pv-g"><td colspan="${P.cols.length + 1}"><i style="background:${esc(g.color)}"></i>${esc(g.label)}</td></tr>` + ms.map(m => `<tr${m.t === hi ? ' class="pv-hi"' : ''}><td>${esc(m.t)}</td>${P.cols.map(k => `<td>${fin(m[k]) ? COLS[k][1](m[k]) : '—'}</td>`).join('')}</tr>`).join('') : ''; }).join('')}</tbody></table>
      <p class="pv-note">${P.cols.filter(k => !['pe', 'pb', 'roe', 'gm'].includes(k)).map(k => `<b>${esc(COLS[k][0])}</b>: ${esc(COLS[k][2])}`).join(' · ')}.</p>`; };
  const charts = [];
  function draw() {
    charts.forEach(ch => ch.destroy()); charts.length = 0;
    M = ALL.filter(m => on.has(m.group) || !P);
    const H = ALL.find(m => m.t === hi) || {};
    keys.forEach((k, n) => { const [title, ch] = CAT[k].draw(cards[n], H); cards[n].querySelector('.chart-title').textContent = title; charts.push(ch); });
    table();
  }
  head.querySelector('select').addEventListener('change', e => { hi = e.target.value; const g = ALL.find(m => m.t === hi)?.group; if (P && !on.has(g)) { on.add(g); head.querySelector(`[data-g="${g}"]`)?.setAttribute('aria-pressed', 'true'); } draw(); });
  head.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => { const g = b.dataset.g; if (on.has(g)) { if (on.size === 1) return; on.delete(g); } else on.add(g);
    b.setAttribute('aria-pressed', String(on.has(g)));
    if (!on.has(ALL.find(m => m.t === hi)?.group)) { hi = ALL.find(m => on.has(m.group))?.t || hi; head.querySelector('select').value = hi; }
    draw(); }));
  const miss = ALL.filter(m => !fin(m.pe) && !fin(m.pb)).map(m => m.t);
  if (miss.length) head.insertAdjacentHTML('beforeend', `<span class="pv-note">Chưa có P/E, P/B: ${miss.join(', ')}.</span>`);
  const odd = ALL.filter(m => m.odd).map(m => m.t);
  if (odd.length) head.insertAdjacentHTML('beforeend', `<span class="pv-note">Bỏ khỏi chart ROE: ${odd.join(', ')} (ROE trên 100% vì vốn chủ gần 0 hoặc âm).</span>`);
  if (!document.getElementById('pv-style')) { const st = el('style'); st.id = 'pv-style'; st.textContent = `.pv-head{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;margin:4px 0 12px}.pv-head label{font:600 12.5px Inter,sans-serif;color:#3B4256}.pv-head select{margin-left:6px;font:600 12.5px Inter,sans-serif;padding:4px 8px;border:1px solid #D6DBE8;border-radius:7px}.pv-note{font-size:12px;color:#6B7392}
.pv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pv-cv{position:relative;height:330px;margin-top:8px}.pv-card .chart-title{min-height:2.7em}@media(max-width:900px){.pv-grid{grid-template-columns:1fr}}
.pv-groups{display:flex;flex-wrap:wrap;gap:6px}.pv-groups button{display:inline-flex;align-items:center;gap:6px;font:600 12px Inter,sans-serif;color:#3B4256;background:#fff;border:1px solid #D6DBE8;border-radius:999px;padding:4px 10px;cursor:pointer}.pv-groups button[aria-pressed="false"]{opacity:.45}.pv-groups i,.pv-g i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}.pv-groups i{margin-right:0}
.pv-tcard{margin-top:14px}.pv-tw{overflow-x:auto;margin-top:8px}.pv-table{width:100%;border-collapse:collapse;font:13px Inter,sans-serif;color:#1B2340}.pv-table th,.pv-table td{padding:7px 10px;text-align:right;white-space:nowrap;border-bottom:1px solid #EEF0F6;font-variant-numeric:tabular-nums}.pv-table th{font-weight:600;font-size:12px;color:#6B7392;white-space:normal;vertical-align:bottom;min-width:68px}.pv-table th:first-child,.pv-table td:first-child{text-align:left;font-weight:600}.pv-table tr.pv-g td{text-align:left;font-size:12px;font-weight:600;color:#3B4256;background:#F6F7FB}.pv-table tr.pv-hi td{font-weight:700;background:#EEF1FA}.pv-tw .pv-note{margin:8px 0 0;line-height:1.5}`; document.head.append(st); }
  draw();
  return {metrics: ALL, profile: pkey || null};
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
