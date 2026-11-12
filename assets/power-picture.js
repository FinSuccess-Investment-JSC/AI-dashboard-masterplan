/* Điện · Bức tranh ngành theo câu hỏi phân tích (12/11/2026): 7 sub-tab thay cách chia "Thế giới / Việt Nam".
   (Industry Pulse chuyển sang Tổng quan ngành, assets/power-overview.js, 12/11/2026) 01 Nhu cầu · 02 Thủy văn & nguồn cung · 03 Cơ cấu huy động · 04 Giá & kinh tế phát điện · 05 EVN · 06 Cung dài hạn.
   Card có sẵn được DỜI (không nhân bản) vào panel; chart mới (cơ cấu nguồn, đóng góp tăng trưởng, thay thế nguồn, Pmax/hệ số phụ tải,
   benchmark nhiên liệu base 100) và nhận định theo quy tắc tính từ dữ liệu đã nạp trên trang: SECTOR_DAILY (bản tin EVN, NOAA, World Bank,
   ICE), HYDRO_RESERVOIRS, hằng số dữ liệu trong script cuối Dien/index.html (fmpRows, capItems, tariffVals…). Thiếu dữ liệu thì ghi rõ,
   không ước tính. Deep-link: Dien/?section=<khóa>#mt2 (giữ hash #mt2 cho router của research-layout.js; Back/Forward theo history). */
(() => {
'use strict';
if (document.body.dataset.sector !== 'power') return;
const S = window.SECTOR_DAILY?.sources || {}, rec = k => S[k]?.records || [];
const fin = Number.isFinite, sum = a => a.reduce((x, y) => x + y, 0), mean = a => a.length ? sum(a) / a.length : null;
const median = a => { const v = a.filter(fin).sort((x, y) => x - y), k = v.length >> 1; return v.length ? (v.length % 2 ? v[k] : (v[k - 1] + v[k]) / 2) : null; };
const nf = (v, d = 1) => v == null || !fin(v) ? '—' : Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
const sg = (v, d = 1) => v == null || !fin(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d);
const pc = (v, d = 1) => v == null || !fin(v) ? '—' : sg(v, d) + '%';
const pp = (v, d = 1) => v == null || !fin(v) ? '—' : sg(v, d) + ' đ.p.';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const dm = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—';
const ml = m => 'T' + +m.slice(5, 7) + '/' + m.slice(0, 4), ms = m => 'T' + +m.slice(5, 7) + '/' + m.slice(2, 4);
const dim = m => new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).getUTCDate();
const back = d => (+d.slice(0, 4) - 1) + d.slice(4);
const addMonths = (m, k) => { const d = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1 + k, 1)); return d.toISOString().slice(0, 7); };
const datesOf = (a, b) => { const out = []; for (let d = new Date(a + 'T00:00:00Z'), e = new Date(b + 'T00:00:00Z'); d <= e; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10)); return out; };
// Hằng số dữ liệu khai báo bằng const trong script cuối trang nằm ở phạm vi toàn cục (không gắn vào window).
const glob = name => { try { return Function(`return typeof ${name}==='undefined'?undefined:${name}`)(); } catch (e) { return undefined; } };
const link = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>`;
const block = id => document.querySelector(`[data-block-id="${id}"]`);
const cardOf = hostId => document.getElementById(hostId)?.closest('.card');
// Chart vẽ lúc khung còn ẩn có chiều rộng 0; đo lại khi khung hiện ra (sub-tab, mục thu gọn).
// Dời DOM làm Chart.js mất theo dõi kích thước, resize() không đủ: dựng lại instance từ chính cấu hình cũ (giữ dữ liệu, tùy chọn, plugin).
const refit = root => setTimeout(() => root.querySelectorAll('canvas').forEach(c => {
  const old = c.offsetParent && c.clientWidth < 10 && window.Chart?.getChart?.(c); if (!old) return;
  const cfg = old.config, keep = {$ctFmt: old.$ctFmt, $ctId: old.$ctId};
  old.destroy(); Object.assign(new Chart(c, {type: cfg.type, data: cfg.data, options: cfg.options, plugins: cfg.plugins}), keep);
}), 40);
const EVN_URL = 'https://www.evn.com.vn/vi-VN/news-l/Thong-tin-tom-tat-van-hanh-HTD-Quoc-gia-60-2015';

/* ===================== 1. Dữ liệu tính sẵn ===================== */
// Một màu cho mỗi nguồn, trùng power-visuals.js (sơ đồ chuỗi giá trị, cơ cấu nguồn ngày).
const SRC = [['coal', 'Than', '#3d4653'], ['gas', 'Khí & dầu', '#c98a00'], ['hydro', 'Thủy điện', '#2938A8'], ['re', 'Gió & mặt trời', '#2a9fa3'], ['imports', 'Nhập khẩu', '#9AA3BD'], ['other', 'Khác', '#C9CFDD']];
const days = rec('vn_power_daily').filter(r => fin(r.output_mkwh)).map(r => {
  const solar = fin(r.solar) ? r.solar : fin(r.solar_farm) && fin(r.rooftop_solar) ? r.solar_farm + r.rooftop_solar : null;
  const p = {coal: r.coal, gas: fin(r.gas) ? r.gas + (fin(r.oil) ? r.oil : 0) : null, hydro: r.hydro, re: fin(solar) && fin(r.wind) ? solar + r.wind : null, imports: r.imports, other: fin(r.other) ? r.other : 0};
  return {date: r.date, out: r.output_mkwh, pmax: fin(r.pmax_mw) ? r.pmax_mw : null, ...p, mix: SRC.every(([k]) => fin(p[k]))};
});
const byDay = new Map(days.map(d => [d.date, d]));
const lastDay = days.at(-1)?.date || null;
// Tháng đủ gần nhất: tháng của ngày cuối nếu ngày đó là cuối tháng, nếu không thì tháng trước.
const M = lastDay ? (+lastDay.slice(8) === dim(lastDay.slice(0, 7)) ? lastDay.slice(0, 7) : addMonths(lastDay.slice(0, 7), -1)) : null;
// So cùng kỳ trên đúng các ngày có bản tin đủ cơ cấu nguồn ở cả hai năm (ngày thiếu không ước tính).
function compare(dates, keys = SRC.map(s => s[0])) {
  const pairs = dates.filter(d => byDay.get(d)?.mix && byDay.get(back(d))?.mix), prevDs = pairs.map(back);
  const tot = (ds, k) => sum(ds.map(d => byDay.get(d)[k]));
  const curT = tot(pairs, 'out'), prevT = tot(prevDs, 'out');
  const rows = SRC.filter(s => keys.includes(s[0])).map(([k, name, color]) => {
    const cur = tot(pairs, k), prev = tot(prevDs, k);
    return {k, name, color, cur, prev, delta: cur - prev, yoy: prev ? (cur / prev - 1) * 100 : null, shareCur: curT ? cur / curT * 100 : null, sharePrev: prevT ? prev / prevT * 100 : null,
            dpp: curT && prevT ? cur / curT * 100 - prev / prevT * 100 : null, contrib: prevT ? (cur - prev) / prevT * 100 : null};
  });
  return {n: pairs.length, total: dates.length, ok: pairs.length > 0 && pairs.length >= 0.8 * dates.length, from: pairs[0], to: pairs.at(-1), curT, prevT,
          yoy: prevT ? (curT / prevT - 1) * 100 : null, delta: curT - prevT, rows, residual: curT - prevT - sum(rows.map(r => r.delta)), get: k => rows.find(r => r.k === k)};
}
const monthDates = m => datesOf(m + '-01', m + '-' + String(dim(m)).padStart(2, '0'));
const PERIODS = M ? {
  m: {label: 'Tháng gần nhất', name: ml(M), dates: monthDates(M)},
  q: {label: '3 tháng', name: ms(addMonths(M, -2)) + '–' + ms(M), dates: datesOf(addMonths(M, -2) + '-01', M + '-' + dim(M))},
  ytd: {label: 'Từ đầu năm', name: '01/01–' + dm(lastDay).slice(0, 5) + '/' + lastDay.slice(0, 4), dates: datesOf(lastDay.slice(0, 4) + '-01-01', lastDay)},
  y: {label: '12 tháng', name: ms(addMonths(M, -11)) + '–' + ms(M), dates: datesOf(addMonths(M, -11) + '-01', M + '-' + dim(M))}
} : {};
const CMP = Object.fromEntries(Object.entries(PERIODS).map(([k, p]) => [k, compare(p.dates)]));
// Tháng: bình quân ngày theo nguồn, độ phủ, Pmax, hệ số phụ tải (chỉ tháng có ≥90% ngày).
const months = (() => {
  const g = new Map();
  days.forEach(d => { const k = d.date.slice(0, 7), m = g.get(k) || {m: k, days: 0, out: 0, pmax: null, pmaxDate: null, mixDays: 0, ...Object.fromEntries(SRC.map(s => [s[0], 0]))};
    m.days++; m.out += d.out; if (fin(d.pmax) && (m.pmax == null || d.pmax > m.pmax)) { m.pmax = d.pmax; m.pmaxDate = d.date; }
    if (d.mix) { m.mixDays++; SRC.forEach(([k2]) => { m[k2] += d[k2]; }); }
    g.set(k, m); });
  return [...g.values()].sort((a, b) => a.m.localeCompare(b.m)).map(m => {
    const n = dim(m.m), cover = m.days / n, avg = m.out / m.days, mixT = sum(SRC.map(s => m[s[0]]));
    return {...m, n, cover, full: m.days === n && m.m <= M, avg, lf: cover >= 0.9 && m.pmax ? avg * 1000 / (m.pmax * 24) * 100 : null,
            avgSrc: Object.fromEntries(SRC.map(([k]) => [k, m.mixDays ? m[k] / m.mixDays : null])), share: Object.fromEntries(SRC.map(([k]) => [k, mixT ? m[k] / mixT * 100 : null]))};
  });
})();
const monthBy = new Map(months.map(m => [m.m, m]));
const monthCmp = new Map(months.map(m => [m.m, compare(monthDates(m.m))]));
const pmaxYoY = m => { const a = monthBy.get(m), b = monthBy.get(back(m + '-01').slice(0, 7)); return a && b && a.cover >= 0.9 && b.cover >= 0.9 && a.pmax && b.pmax ? (a.pmax / b.pmax - 1) * 100 : null; };
// Pmax từ đầu năm so cùng khoảng năm trước, và đỉnh cả năm trước.
const pmaxYtd = (() => {
  if (!lastDay) return null;
  const y = lastDay.slice(0, 4), cur = days.filter(d => d.date.startsWith(y) && fin(d.pmax)), prev = days.filter(d => d.date.startsWith(+y - 1) && fin(d.pmax));
  const top = a => a.reduce((b, d) => !b || d.pmax > b.pmax ? d : b, null);
  const c = top(cur), p = top(prev.filter(d => d.date.slice(5) <= lastDay.slice(5))), pf = top(prev);
  return c && {cur: c, prevSame: p, prevFull: pf, yoy: p ? (c.pmax / p.pmax - 1) * 100 : null};
})();
const ytdOut = CMP.ytd;
// Xu hướng: 3 tháng gần nhất so 3 tháng liền trước (đều là tăng trưởng cùng kỳ trên ngày đối chiếu).
const accel = M ? (() => { const a = compare(datesOf(addMonths(M, -2) + '-01', M + '-' + dim(M))), b = compare(datesOf(addMonths(M, -5) + '-01', addMonths(M, -3) + '-' + dim(addMonths(M, -3)))); return a.ok && b.ok ? {now: a.yoy, before: b.yoy} : null; })() : null;
// ENSO
const oni = rec('enso_oni').filter(r => fin(r.oni)), oniLast = oni.at(-1), oni3 = oni.at(-4), oni6 = oni.at(-7);
const ensoState = v => v == null ? '—' : v >= 1.5 ? 'El Niño mạnh' : v >= 0.5 ? 'El Niño' : v <= -1.5 ? 'La Niña mạnh' : v <= -0.5 ? 'La Niña' : 'Trung tính';
const nino = rec('nino34_weekly').filter(r => fin(r.ssta)), ninoLast = nino.at(-1), nino4 = nino.at(-5);
// Hồ chứa: lệch so TB 5 năm cùng tháng (cùng điều kiện ≥80% ngày, nền ≥3 năm như heatmap) và so cùng kỳ đúng ngày (HYDRO_RESERVOIRS.yoy).
const H = window.HYDRO_RESERVOIRS;
const reservoir5y = (() => {
  if (!H?.monthly?.length) return null;
  const by = new Map(); H.monthly.forEach(r => { if (!by.has(r.reservoir)) by.set(r.reservoir, {region: r.region, m: new Map()}); by.get(r.reservoir).m.set(r.month, r); });
  const ok = r => r && r.inflow != null && r.days / r.expected >= .8 && r.inflow_n / r.expected >= .8;
  const dev = (res, mo) => { const c = res.m.get(mo); if (!ok(c)) return null; const y = +mo.slice(0, 4), mm = mo.slice(5), b = [];
    for (let k = y - 5; k < y; k++) { const x = res.m.get(k + '-' + mm); if (ok(x)) b.push(x.inflow); } const a = mean(b); return b.length >= 3 && a > 0 ? (c.inflow / a - 1) * 100 : null; };
  const all = [...new Set(H.monthly.map(r => r.month))].sort().reverse();
  for (const mo of all) {
    const rows = [...by].map(([name, res]) => ({name, region: res.region, dev: dev(res, mo)})).filter(r => r.dev != null);
    if (rows.length >= 10) {
      const regions = [...new Set(rows.map(r => r.region))].map(reg => ({reg, n: rows.filter(r => r.region === reg).length, med: median(rows.filter(r => r.region === reg).map(r => r.dev))})).filter(r => r.n >= 2).sort((a, b) => a.med - b.med);
      return {month: mo, n: rows.length, total: by.size, below: rows.filter(r => r.dev < 0).length, med: median(rows.map(r => r.dev)), worst: regions[0], best: regions.at(-1)};
    }
  }
  return null;
})();
const resYoY = (() => { const Y = H?.yoy; if (!Y?.rows) return null; const rs = Y.rows.filter(r => r.month === Y.month && r.yoy != null);
  const a = rs.map(r => r.from).sort()[0], b = rs.map(r => r.to).sort().at(-1); return rs.length ? {med: median(rs.map(r => r.yoy)), low: rs.filter(r => r.yoy < 0).length, n: rs.length, span: a && b ? `${+a.slice(8)}–${+b.slice(8)}/${+b.slice(5, 7)}/${b.slice(0, 4)}` : ''} : null; })();
// Giá thị trường điện (PGV) và nhiên liệu
const fmp = (glob('fmpRows') || []).filter(r => fin(r.fmp)), fmpLast = fmp.at(-1);
const fmpPrev = fmpLast && fmp.at(-2), fmpLy = fmpLast && fmp.find(r => r.period === back(fmpLast.period + '-01').slice(0, 7));
const fmpYtd = fmpLast ? (() => { const y = fmpLast.year, cur = fmp.filter(r => r.year === y), prev = cur.map(r => fmp.find(x => x.period === (y - 1) + r.period.slice(4))).filter(Boolean); return prev.length === cur.length ? {cur: mean(cur.map(r => r.fmp)), prev: mean(prev.map(r => r.fmp)), n: cur.length} : null; })() : null;
const chg = (k, n) => { const r = rec(k).filter(x => fin(x.value)); return r.length > n ? {now: r.at(-1).value, date: r.at(-1).date, pct: (r.at(-1).value / r.at(-1 - n).value - 1) * 100} : null; };
const coal3 = chg('coal_newcastle', 63), jkm3 = chg('lng_jkm', 63), hh3 = chg('henry_hub', 63);
// Hằng số trong script trang (có nguồn ghi ở card tương ứng)
const capItems = glob('capItems'), pipelineStages = glob('pipelineStages'), pipelineShare = glob('pipelineShare');
const shortfallYears = glob('shortfallYears'), shortfallMw = glob('shortfallMw'), outVals = glob('outVals'), outLabels = glob('outLabels');
const tariffDates = glob('tariffDates'), tariffVals = glob('tariffVals'), lossLabels = glob('lossLabels'), lossVals = glob('lossVals');

/* ===================== 2. Khung giao diện ===================== */
const LV = {A: ['Quan sát', 'Tính trực tiếp từ dữ liệu'], B: ['Diễn giải', 'Diễn giải có bằng chứng hỗ trợ, chưa phải sự thật đã xác minh'], C: ['Hàm ý có điều kiện', 'Chỉ đúng khi các điều kiện nêu kèm thỏa']};
const tag = l => `<span class="pp-lv pp-lv-${l}" title="${esc(LV[l][1])}">${l} · ${LV[l][0]}</span>`;
const lines = items => items.filter(Boolean).map(([l, t]) => `<p class="pp-line">${tag(l)} ${t}</p>`).join('');
const gap = text => el('div', 'data-gap pp-gap', `<b>Chưa có dữ liệu</b> · ${text}`);
function kpi(o) {
  const k = el('div', 'kpi pp-kpi');
  k.innerHTML = `<div class="label l">${esc(o.label)}</div><div class="value v">${o.value ?? '—'}${o.unit ? `<small> ${esc(o.unit)}</small>` : ''}</div>` +
    (o.delta ? `<div class="delta ${o.cls || ''}">${o.delta}</div>` : '') + `<div class="sub s">${o.sub || ''}</div>`;
  return k;
}
const kpiCls = (v, th = 0) => v == null ? '' : v > th ? 'd-good' : v < -th ? 'd-bad' : 'd-warn';
// Card chart mới: cùng khung với card có sẵn (tiêu đề "chỉ tiêu (đơn vị)", nguồn ở dòng nguồn, bảng thu gọn).
function newCard(id, title, sub, source, opts = {}) {
  const c = el('div', 'card pp-card');
  Object.assign(c.dataset, {blockId: id, updateKind: opts.kind || 'public', cadence: opts.cadence || 'daily', refreshStatus: 'snapshot'});
  c.innerHTML = `<div class="chart-title">${esc(title)}</div>${sub ? `<div class="chart-sub">${sub}</div>` : ''}${opts.controls ? `<div class="pp-ctl" role="group">${opts.controls}</div>` : ''}<div class="pp-host" id="${id}-host"></div>` +
    (source ? `<div class="source-note">${source}</div>` : '') + (opts.table ? `<details class="dtable"><summary>Xem bảng dữ liệu</summary><div class="tablewrap"><table id="${id}-tbl"></table></div></details>` : '');
  return c;
}
function mount(host, model) {
  if (!host) return;
  if (!window.ChartTypes) { host.replaceChildren(gap('không tải được thư viện chart.')); return; }
  ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, model.native || 'line'); });
}
const fillTable = (t, head, rows) => { if (t) t.innerHTML = `<thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`; };
// Một panel = câu hỏi → nhận định chính → bằng chứng (chart chính + tối đa 2 chart phụ) → diễn giải → dữ liệu & phương pháp.
function panel(o) {
  const p = el('section', 'pp-panel'); p.id = 'pp-' + o.id;
  p.innerHTML = `<header class="pp-ph"><span class="pp-num">${esc(o.num)}</span><div><h3>${esc(o.q)}</h3><div class="pp-find">${o.finding || ''}</div></div></header>`;
  if (o.main) { const w = el('div', 'pp-main'); [].concat(o.main).filter(Boolean).forEach(n => w.append(n)); p.append(w); }
  const sup = [].concat(o.support || []).filter(Boolean);
  if (sup.length) { const g = el('div', 'grid two g2 pp-sup'); sup.forEach(n => g.append(n)); p.append(g); }
  [].concat(o.body || []).filter(Boolean).forEach(n => p.append(n));
  if (o.drill?.nodes?.filter(Boolean).length) { const d = el('details', 'research-fold pp-drill'); d.append(el('summary', '', esc(o.drill.label))); const g = el('div', 'pp-drill-body'); o.drill.nodes.filter(Boolean).forEach(n => g.append(n)); d.append(g); d.addEventListener('toggle', () => d.open && refit(d)); p.append(d); }
  if (o.interp) {
    const d = el('details', 'pp-interp'); d.open = !!o.interpOpen;
    d.innerHTML = `<summary>Diễn giải · cơ chế · điều cần theo dõi</summary><dl>${[['Điều gì đang thay đổi', o.interp.what], ['Cơ chế kinh tế / vận hành', o.interp.mech], ['Nhóm phơi nhiễm', o.interp.who], ['Kết luận không còn đúng khi', o.interp.falsify], ['Theo dõi tiếp', o.interp.watch]].filter(x => x[1]).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
    p.append(d);
  }
  if (o.method) { const d = el('details', 'pp-method'); d.innerHTML = `<summary>Dữ liệu & phương pháp</summary><div>${o.method}</div>`; p.append(d); }
  return p;
}

/* ===================== 3. Chart mới ===================== */
const renders = {};   // dựng khi sub-tab mở lần đầu (để chart đo đúng chiều rộng)
// 3.1 Cơ cấu nguồn: bình quân ngày (triệu kWh/ngày) hoặc tỷ trọng %, miền chồng theo tháng.
function mixCard() {
  const c = newCard('dien-pp-mix', 'Cơ cấu sản lượng theo nguồn, theo tháng', 'triệu kWh/ngày (bình quân các ngày có bản tin đủ nguồn) hoặc % · * = tháng chưa đủ ngày', `Nguồn: ${link(EVN_URL, 'EVN · bản tin vận hành ngày')}; cộng các bản tin có đủ thành phần, không ước tính ngày thiếu.`,
    {controls: '<button type="button" data-mode="abs" aria-pressed="true">Bình quân ngày</button><button type="button" data-mode="pct" aria-pressed="false">Tỷ trọng %</button>', table: true});
  const host = c.querySelector('.pp-host'), ms2 = months.filter(m => m.mixDays && m.m >= '2023-06');
  let mode = 'abs';
  const cats = ms2.map(m => ms(m.m) + (m.mixDays < m.n ? '*' : ''));
  const draw = () => mount(host, {key: 'dien-pp-mix-' + mode, categories: cats, unit: mode === 'abs' ? 'triệu kWh/ngày' : '%', digits: mode === 'abs' ? 1 : 1, stackable: true, native: 'area', time: true,
    series: SRC.map(([k, name, color]) => ({name, color, kind: 'line', values: ms2.map(m => mode === 'abs' ? m.avgSrc[k] : m.share[k])})), aria: 'Cơ cấu sản lượng điện theo nguồn theo tháng'});
  c.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; c.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); }));
  // Tooltip: thêm tỷ trọng và YoY (cùng ngày) của nguồn trong tháng đang trỏ.
  host.addEventListener('ct:render', () => {
    const ch = window.Chart?.getChart?.(host.querySelector('canvas')); if (!ch) return;
    // Thư viện chung chỉ cộng dồn dạng cột; dạng "Miền" ở chart này cộng dồn (các nguồn cộng được với nhau).
    // Gán nhóm cộng dồn tường minh: chỉ bật y.stacked sau khi chart đã dựng thì Chart.js giữ giá trị cũ, các lớp bị đảo thứ tự.
    if (host.dataset.ctType === 'area') { ch.options.scales.y.stacked = true; ch.data.datasets.forEach(d => { if (d.type === 'line') { d.stack = 'mix'; d.fill = 'stack'; } }); }
    const cb = ch.options.plugins.tooltip.callbacks;
    cb.afterLabel = x => { const m = ms2[cats.indexOf(String(x.label))]; if (!m) return ''; const s = SRC.find(z => z[1] === x.dataset.label); if (!s) return '';
      const y = monthCmp.get(m.m)?.get(s[0]); return `  tỷ trọng ${nf(m.share[s[0]], 1)}% · YoY ${y && monthCmp.get(m.m).ok ? pc(y.yoy) : '—'}`; };
    ch.update('none');
  });
  renders.dispatch.push(draw);
  fillTable(c.querySelector('table'), ['Tháng', ...SRC.map(s => s[1] + ' (triệu kWh/ngày)'), ...SRC.map(s => s[1] + ' %'), 'Ngày đủ nguồn'],
    ms2.slice().reverse().map(m => [ms(m.m), ...SRC.map(([k]) => nf(m.avgSrc[k], 1)), ...SRC.map(([k]) => nf(m.share[k], 1)), `${m.mixDays}/${m.n}`]));
  return c;
}
// 3.2 Đóng góp vào thay đổi sản lượng hệ thống (ΔGWh theo nguồn, cùng ngày đối chiếu), có dòng chênh lệch.
function contribCard() {
  const keys = Object.keys(PERIODS);
  const c = newCard('dien-pp-contrib', 'Đóng góp vào thay đổi sản lượng hệ thống, so cùng kỳ', 'triệu kWh (= GWh) · cộng trên đúng các ngày có bản tin đủ nguồn ở cả hai năm', `Nguồn: ${link(EVN_URL, 'EVN · bản tin vận hành ngày')}. Δ tổng = Σ Δ từng nguồn + chênh lệch; chênh lệch hiển thị riêng, không điều chỉnh cho khớp.`,
    {controls: keys.map((k, i) => `<button type="button" data-p="${k}" aria-pressed="${i === 2}">${PERIODS[k].label}</button>`).join(''), table: true});
  const host = c.querySelector('.pp-host');
  const draw = k => {
    const r = CMP[k]; if (!r?.n) { host.replaceChildren(gap('chưa đủ ngày đối chiếu.')); return; }
    const items = [...r.rows].sort((a, b) => b.delta - a.delta), maxAbs = Math.max(...items.map(x => Math.abs(x.delta)), Math.abs(r.delta), 1);
    const bar = (name, v, color, extra, cls = '') => `<div class="pp-div-row ${cls}"><span class="pp-div-l">${name}</span><span class="pp-div-t"><i style="${v >= 0 ? 'left:50%' : `right:50%`};width:${Math.abs(v) / maxAbs * 50}%;background:${color}"></i></span><b class="${v >= 0 ? 'up' : 'dn'}">${sg(v, 0)}</b><em>${extra}</em></div>`;
    host.innerHTML = `<div class="pp-div-head"><span>${esc(PERIODS[k].name)} · ${r.n}/${r.total} ngày đối chiếu${r.ok ? '' : ' (dưới 80%, đọc thận trọng)'}</span><span>đóng góp vào tăng trưởng · YoY nguồn</span></div>` +
      items.map(x => bar(x.name, x.delta, x.color, `${pp(x.contrib)} · ${pc(x.yoy)}`)).join('') +
      bar('Tổng hệ thống', r.delta, '#1D2678', `${pc(r.yoy)}`, 'pp-div-total') + (Math.abs(r.residual) >= 0.5 ? bar('Chênh lệch phân loại', r.residual, '#b8443a', 'không phân bổ', 'pp-div-res') : `<div class="pp-div-note">Chênh lệch giữa tổng và Σ nguồn: ${nf(r.residual, 1)} triệu kWh.</div>`);
    c.querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === k)));
    fillTable(c.querySelector('table'), ['Nguồn', 'Kỳ này (triệu kWh)', 'Cùng kỳ', 'Δ', 'YoY', 'Đóng góp (đ.p.)', 'Tỷ trọng kỳ này', 'Δ tỷ trọng'],
      [...r.rows.map(x => [x.name, nf(x.cur, 0), nf(x.prev, 0), sg(x.delta, 0), pc(x.yoy), pp(x.contrib), nf(x.shareCur) + '%', pp(x.dpp)]), ['<b>Tổng</b>', nf(r.curT, 0), nf(r.prevT, 0), sg(r.delta, 0), pc(r.yoy), pp(r.yoy), '100%', '']]);
  };
  c.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => draw(b.dataset.p)));
  renders.dispatch.push(() => draw('ytd'));
  return c;
}
// 3.3 Thay thế nguồn: Δ cùng kỳ theo tháng của từng nguồn (cột chồng âm/dương) và đường tổng.
function substCard() {
  const c = newCard('dien-pp-subst', 'Thay đổi sản lượng so cùng kỳ theo nguồn, từng tháng', 'triệu kWh · cùng ngày đối chiếu · cột âm = nguồn giảm, đường = tổng hệ thống', `Nguồn: ${link(EVN_URL, 'EVN · bản tin vận hành ngày')}. Tương quan giữa các cột không chứng minh quan hệ nhân quả.`, {table: true});
  const host = c.querySelector('.pp-host'), list = months.filter(m => m.m <= M && monthCmp.get(m.m)?.ok).slice(-24);
  const model = {key: 'dien-pp-subst', categories: list.map(m => ms(m.m)), unit: 'triệu kWh', digits: 0, stackable: true, native: 'stack', time: true,
    series: [...SRC.filter(s => s[0] !== 'other').map(([k, name, color]) => ({name, color, kind: 'bar', values: list.map(m => monthCmp.get(m.m).get(k).delta)})),
             {name: 'Tổng hệ thống', color: '#1D2678', kind: 'line', values: list.map(m => monthCmp.get(m.m).delta)}], aria: 'Thay đổi sản lượng so cùng kỳ theo nguồn'};
  renders.dispatch.push(() => mount(host, model));
  fillTable(c.querySelector('table'), ['Tháng', ...SRC.map(s => 'Δ ' + s[1]), 'Δ tổng', 'Ngày đối chiếu'], list.slice().reverse().map(m => { const r = monthCmp.get(m.m); return [ms(m.m), ...SRC.map(([k]) => sg(r.get(k).delta, 0)), sg(r.delta, 0), `${r.n}/${r.total}`]; }));
  return c;
}
// 1.2 Pmax so điện năng: tăng trưởng cùng kỳ và hệ số phụ tải.
function peakCard() {
  const c = newCard('dien-pp-peak', 'Tăng trưởng Pmax so với điện năng, so cùng kỳ (%)', 'Pmax tháng (MW, tháng ≥90% ngày) và điện năng (cùng ngày đối chiếu) · % so cùng tháng năm trước', `Nguồn: ${link(EVN_URL, 'EVN · bản tin vận hành ngày')}. Pmax là đỉnh trong các bản tin có trong tháng; tháng thiếu bản tin có thể bỏ sót đỉnh thật.`, {table: true});
  const list = months.filter(m => m.m <= M && m.m >= '2024-06').slice(-24);
  const model = {key: 'dien-pp-peak', categories: list.map(m => ms(m.m)), unit: '%', digits: 1, zeroBase: false, time: true,
    series: [{name: 'Pmax', color: '#861C52', kind: 'line', values: list.map(m => pmaxYoY(m.m))}, {name: 'Điện năng', color: '#2938A8', kind: 'line', values: list.map(m => monthCmp.get(m.m)?.ok ? monthCmp.get(m.m).yoy : null)}], aria: 'Tăng trưởng Pmax và điện năng so cùng kỳ'};
  renders.demand.push(() => mount(c.querySelector('.pp-host'), model));
  fillTable(c.querySelector('table'), ['Tháng', 'Pmax (MW)', 'Pmax YoY', 'Điện năng YoY', 'Ngày có bản tin'], list.slice().reverse().map(m => [ms(m.m), nf(m.pmax, 0), pc(pmaxYoY(m.m)), pc(monthCmp.get(m.m)?.ok ? monthCmp.get(m.m).yoy : null), `${m.days}/${m.n}`]));
  return c;
}
function lfCard() {
  const c = newCard('dien-pp-lf', 'Hệ số phụ tải tháng (%)', 'điện năng bình quân ngày ÷ (Pmax tháng × 24 giờ) · chỉ tháng có ≥90% ngày bản tin', `Nguồn: ${link(EVN_URL, 'EVN · bản tin vận hành ngày')}; tự tính. Hệ số giảm nghĩa là đỉnh tăng nhanh hơn điện năng bình quân.`, {table: true});
  const list = months.filter(m => m.m <= M).slice(-36);
  const model = {key: 'dien-pp-lf', categories: list.map(m => ms(m.m)), unit: '%', digits: 1, zeroBase: false, time: true, series: [{name: 'Hệ số phụ tải', color: '#2938A8', kind: 'line', values: list.map(m => m.lf)}], aria: 'Hệ số phụ tải tháng'};
  renders.demand.push(() => mount(c.querySelector('.pp-host'), model));
  fillTable(c.querySelector('table'), ['Tháng', 'Bình quân ngày (triệu kWh)', 'Pmax (MW)', 'Hệ số phụ tải', 'Ngày có bản tin'], list.slice().reverse().map(m => [ms(m.m), nf(m.avg, 1), nf(m.pmax, 0), m.lf == null ? '—' : nf(m.lf, 1) + '%', `${m.days}/${m.n}`]));
  return c;
}
// 4.2 Benchmark nhiên liệu: một widget, chọn tần suất; base 100 để so xu hướng, giá gốc tách theo đơn vị.
function fuelCard() {
  const wb = rec('wb_energy_monthly');
  const FEEDS = {
    month: [['Than Úc (World Bank)', 'coal', '#3d4653', wb.map(r => [r.date.slice(0, 7), r.coal_au])], ['LNG Nhật (World Bank)', 'gas', '#c98a00', wb.map(r => [r.date.slice(0, 7), r.lng_japan])], ['Henry Hub (World Bank)', 'gas', '#861C52', wb.map(r => [r.date.slice(0, 7), r.gas_us])]],
    day: [['Than Newcastle (ICE)', 'coal', '#3d4653', rec('coal_newcastle').map(r => [r.date, r.value])], ['LNG JKM (ICE)', 'gas', '#c98a00', rec('lng_jkm').map(r => [r.date, r.value])], ['Henry Hub', 'gas', '#861C52', rec('henry_hub').map(r => [r.date, r.value])]]
  };
  const c = newCard('dien-pp-fuel', 'Giá nhiên liệu tham chiếu: xu hướng so sánh', 'base 100 = kỳ đầu của khung xem, hoặc giá gốc theo từng đơn vị (USD/tấn và USD/MMBtu không chung trục)',
    `Nguồn: ${link('https://www.worldbank.org/en/research/commodity-markets', 'World Bank Pink Sheet')} (tháng) · ICE futures, EIA (ngày) qua job dữ liệu của trang. Benchmark quốc tế, không phải giá nhiên liệu đầu vào thực tế của từng nhà máy.`,
    {controls: '<span>Tần suất</span><button type="button" data-f="month" aria-pressed="true">Tháng</button><button type="button" data-f="day" aria-pressed="false">Ngày</button><span>Đơn vị</span><button type="button" data-u="base" aria-pressed="true">Base 100</button><button type="button" data-u="coal" aria-pressed="false">USD/tấn (than)</button><button type="button" data-u="gas" aria-pressed="false">USD/MMBtu (khí)</button>', table: true});
  const host = c.querySelector('.pp-host'); let f = 'month', u = 'base';
  const draw = () => {
    const feeds = FEEDS[f].filter(x => u === 'base' || x[1] === u).map(([name, kind, color, pts]) => [name, color, new Map(pts.filter(p => fin(p[1])))]);
    let cats = [...new Set(feeds.flatMap(x => [...x[2].keys()]))].sort();
    cats = f === 'month' ? cats.slice(-36) : cats.filter(d => d >= (() => { const d = new Date(cats.at(-1) + 'T00:00:00Z'); d.setUTCFullYear(d.getUTCFullYear() - 1); return d.toISOString().slice(0, 10); })());
    const series = feeds.map(([name, color, map]) => { const vals = cats.map(k => map.get(k) ?? null), b = vals.find(fin); return {name, color, kind: 'line', values: u === 'base' ? vals.map(v => fin(v) && b ? v / b * 100 : null) : vals}; });
    mount(host, {key: `dien-pp-fuel-${f}-${u}`, categories: cats, tickLabels: cats.map(k => f === 'month' ? ms(k) : k.slice(8, 10) + '/' + k.slice(5, 7) + '/' + k.slice(2, 4)), unit: u === 'base' ? 'chỉ số' : u === 'coal' ? 'USD/tấn' : 'USD/MMBtu', digits: u === 'base' ? 0 : 1, zeroBase: false, time: true, series, aria: 'Giá nhiên liệu tham chiếu'});
    c.querySelectorAll('[data-f]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === f)));
    c.querySelectorAll('[data-u]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.u === u)));
    fillTable(c.querySelector('table'), ['Kỳ', ...series.map(s => s.name)], cats.slice().reverse().slice(0, f === 'month' ? 36 : 60).map((k, i) => [k, ...series.map(s => nf(s.values[cats.length - 1 - i], 1))]));
  };
  c.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { f = b.dataset.f; draw(); }));
  c.querySelectorAll('[data-u]').forEach(b => b.addEventListener('click', () => { u = b.dataset.u; draw(); }));
  renders.economics.push(draw);
  return c;
}
// 4.3 Kinh tế thủy điện: sản lượng (EVN) và FMP (PGV), không suy ra lợi nhuận.
function hydroEconCard() {
  const c = newCard('dien-pp-hydro-econ', 'Thủy điện: sản lượng và giá thị trường, so cùng kỳ', 'sản lượng thủy điện (EVN, cùng ngày đối chiếu) · FMP bình quân (PGV) · %', `Nguồn: ${link(EVN_URL, 'EVN')} · FMP theo card "Giá thị trường điện" (PGV). Doanh thu thực nhận phụ thuộc Qc và giá hợp đồng từng nhà máy.`, {kind: 'public', cadence: 'monthly'});
  const h = CMP.ytd?.get('hydro'), hm = CMP.m?.get('hydro');
  const fmpM = M && fmp.find(r => r.period === M), fmpMly = M && fmp.find(r => r.period === back(M + '-01').slice(0, 7));
  const rows = [['Sản lượng thủy điện', `${pc(hm?.yoy)} (${ml(M || '')})`, `${pc(h?.yoy)} (${esc(PERIODS.ytd?.name || '')})`],
    ['FMP bình quân', fmpM && fmpMly ? `${pc((fmpM.fmp / fmpMly.fmp - 1) * 100)} (${ml(M)})` : '<span class="muted">chưa có FMP tháng này</span>', fmpYtd ? `${pc((fmpYtd.cur / fmpYtd.prev - 1) * 100)} (${fmpYtd.n} tháng ${fmpLast.year})` : '—']];
  c.querySelector('.pp-host').innerHTML = `<div class="tablewrap"><table class="pp-mini"><thead><tr><th>Chỉ tiêu</th><th>Tháng gần nhất</th><th>Lũy kế năm</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>`;
  return c;
}

/* ===================== 4. Nhận định theo quy tắc ===================== */
const G = (k, p = 'm') => CMP[p]?.ok ? CMP[p].get(k) : null;
const thermal = p => { const r = CMP[p]; if (!r?.ok) return null; const a = r.get('coal'), b = r.get('gas'); return {yoy: (a.cur + b.cur) / (a.prev + b.prev) * 100 - 100, delta: a.delta + b.delta, coal: a, gas: b}; };
const topContrib = p => CMP[p]?.ok ? [...CMP[p].rows].sort((a, b) => b.delta - a.delta) : [];
const DEMAND = (() => {
  const m = CMP.m, y = CMP.ytd, out = [];
  if (m?.ok) out.push(['A', `Sản lượng hệ thống ${ml(M)} <b>${pc(m.yoy)}</b> so cùng kỳ (${m.n}/${m.total} ngày đối chiếu); từ đầu năm <b>${pc(y?.yoy)}</b>.`]);
  if (accel) { const d = accel.now - accel.before; out.push(['A', `3 tháng gần nhất ${pc(accel.now)} so với ${pc(accel.before)} của 3 tháng liền trước → tăng trưởng <b>${Math.abs(d) < 1 ? 'giữ nhịp' : d > 0 ? 'tăng tốc' : 'giảm tốc'}</b> (${pp(d)}).`]); }
  if (pmaxYtd?.yoy != null && y?.ok) {
    const d = pmaxYtd.yoy - y.yoy;
    out.push(['A', `Pmax từ đầu năm ${nf(pmaxYtd.cur.pmax, 0)} MW (${dm(pmaxYtd.cur.date)}), ${pc(pmaxYtd.yoy)} so đỉnh cùng khoảng năm trước; điện năng ${pc(y.yoy)}.`]);
    out.push(['B', Math.abs(d) < 1 ? 'Đỉnh và điện năng tăng gần cùng tốc độ: chưa thấy áp lực công suất giờ cao điểm tách khỏi áp lực điện năng.' : d > 0 ? 'Đỉnh tăng nhanh hơn điện năng: hệ số phụ tải đi xuống, áp lực dồn vào công suất giờ cao điểm (nguồn điều tiết được: thủy điện hồ lớn, khí, than) hơn là tổng điện năng.' : 'Điện năng tăng nhanh hơn đỉnh: áp lực chủ yếu ở tổng điện năng (nhiên liệu, nước), công suất giờ cao điểm chưa căng thêm.']);
  }
  return out;
})();
const HYDRO = (() => {
  const out = [], hy = G('hydro'), hytd = G('hydro', 'ytd');
  if (oniLast) out.push(['A', `ONI ${oniLast.season} ${oniLast.year} <b>${sg(oniLast.oni, 2)} °C</b> (${ensoState(oniLast.oni)})${oni3 ? `, 3 mùa trước ${sg(oni3.oni, 2)}` : ''}.`]);
  if (resYoY) out.push(['A', `Nước về hồ ${resYoY.span} trung vị <b>${pc(resYoY.med, 0)}</b> so cùng kỳ; ${resYoY.low}/${resYoY.n} hồ thấp hơn năm trước.`]);
  if (reservoir5y) out.push(['A', `${ml(reservoir5y.month)}: trung vị nước về ${pc(reservoir5y.med, 0)} so trung bình 5 năm, ${reservoir5y.below}/${reservoir5y.n} hồ dưới trung bình.`]);
  if (hy) out.push(['A', `Sản lượng thủy điện ${ml(M)} ${pc(hy.yoy)}, từ đầu năm ${pc(hytd?.yoy)}.`]);
  const dry = (resYoY?.med ?? 0) < -10 && (reservoir5y?.med ?? 0) < 0;
  if (resYoY && reservoir5y) out.push(['B', dry ? 'Nước về thấp hơn cả năm trước lẫn trung bình 5 năm: khả năng phát thủy điện các tháng tới nghiêng về thấp hơn; hồ phải tích nước cho mùa khô.' : 'Nước về chưa đồng thời thấp hơn năm trước và trung bình 5 năm; chưa đủ cơ sở kết luận thủy văn bất lợi trên diện rộng.']);
  if (oniLast?.oni >= 0.5) out.push(['B', 'El Niño thường đi kèm mùa khô ít mưa hơn ở Việt Nam (quan hệ lịch sử, chưa có mô hình độ trễ trên trang): không dùng ONI để dự báo định lượng lưu lượng hồ.']);
  return out;
})();
const DISPATCH = (() => {
  const out = [], top = topContrib('ytd'), t = thermal('ytd'), h = G('hydro', 'ytd');
  if (top.length) out.push(['A', `Từ đầu năm, sản lượng tăng ${sg(CMP.ytd.delta, 0)} triệu kWh; đóng góp lớn nhất: ${top.slice(0, 2).map(x => `${x.name} ${sg(x.delta, 0)} (${pp(x.contrib)})`).join(', ')}; giảm nhiều nhất: ${top.at(-1).name} ${sg(top.at(-1).delta, 0)}.`]);
  if (t && h) out.push(['A', `Tỷ trọng thủy điện ${pp(h.dpp)}, than ${pp(t.coal.dpp)}, khí & dầu ${pp(t.gas.dpp)} so cùng kỳ.`]);
  if (t && h) out.push(['B', h.dpp < -1 && t.coal.dpp + t.gas.dpp > 1 ? 'Cơ cấu huy động dịch chuyển từ thủy điện sang nhiệt điện; cần đối chiếu nhu cầu, giá thị trường và chi phí nhiên liệu trước khi đánh giá lợi nhuận.' : h.dpp > 1 && t.coal.dpp + t.gas.dpp < -1 ? 'Thủy điện chiếm tỷ trọng cao hơn, nhiệt điện giảm: huy động nghiêng về nguồn rẻ khi nước về thuận.' : 'Tỷ trọng các nhóm nguồn đổi chưa quá ±1 đ.p.: chưa thấy dịch chuyển cơ cấu rõ ngoài mùa vụ.']);
  return out;
})();
const ECON = (() => {
  const out = [];
  if (fmpLast) out.push(['A', `FMP ${ml(fmpLast.period)} <b>${nf(fmpLast.fmp, 0)} đ/kWh</b>, ${pc(fmpPrev ? (fmpLast.fmp / fmpPrev.fmp - 1) * 100 : null)} so tháng trước${fmpLy ? `, ${pc((fmpLast.fmp / fmpLy.fmp - 1) * 100)} so cùng kỳ` : ''}.`]);
  if (coal3 || jkm3) out.push(['A', `3 tháng (≈63 phiên): than Newcastle ${pc(coal3?.pct)} (${nf(coal3?.now, 1)} USD/tấn), LNG JKM ${pc(jkm3?.pct)} (${nf(jkm3?.now, 2)} USD/MMBtu).`]);
  out.push(['C', 'Nhà máy nhiệt điện chỉ hưởng lợi từ FMP cao hơn ở phần điện năng ngoài hợp đồng (ngoài Qc) và khi FMP vượt chi phí biến đổi; phần Qc theo giá hợp đồng, chi phí nhiên liệu chuyển ngang theo cơ chế PPA.']);
  return out;
})();
const SUPPLY = (() => {
  const out = [], cap = capItems ? sum(capItems.map(x => x[1])) : null;
  if (cap) out.push(['A', `Công suất đặt cuối 2025 khoảng <b>${nf(cap, 0)} MW</b>; Pmax 2026 ${pmaxYtd ? nf(pmaxYtd.cur.pmax, 0) + ' MW' : '—'}. Không lấy hiệu hai số làm dự phòng: công suất khả dụng thấp hơn công suất đặt (thủy văn, bảo dưỡng, NLTT theo thời tiết).`]);
  if (pipelineShare && pipelineStages) out.push(['A', `Báo cáo 760/BC-BCT: ${pipelineShare[0]}% số dự án trong quy hoạch đã vận hành, ${pipelineShare.at(-1)}% chưa có chủ trương đầu tư (tỷ trọng theo <b>số dự án</b>, không phải MW).`]);
  if (shortfallYears && shortfallMw) out.push(['A', `Kịch bản chậm tiến độ của Bộ Công Thương: thiếu ${nf(shortfallMw[0], 0)} MW năm ${shortfallYears[0]}, ${nf(shortfallMw.at(-1), 0)} MW năm ${shortfallYears.at(-1)} — là kịch bản, không phải dự báo chắc chắn.`]);
  return out;
})();

// Số liệu và quy tắc dùng chung cho Tổng quan ngành (assets/power-overview.js đọc, không tính lại).
window.POWER_CORE = {S, rec, fin, sum, mean, median, nf, sg, pc, pp, esc, el, dm, ml, ms, dim, back, addMonths, datesOf, glob, link, block, cardOf, refit, EVN_URL, SRC, days, byDay, lastDay, M, compare, monthDates, PERIODS, CMP, months, monthBy, monthCmp, pmaxYoY, pmaxYtd, ytdOut, accel, oni, oniLast, oni3, oni6, ensoState, nino, ninoLast, nino4, H, reservoir5y, resYoY, fmp, fmpLast, fmpPrev, fmpLy, fmpYtd, chg, coal3, jkm3, hh3, capItems, pipelineStages, pipelineShare, shortfallYears, shortfallMw, outVals, outLabels, tariffDates, tariffVals, lossLabels, lossVals, LV, tag, lines, gap, kpi, kpiCls, newCard, mount, fillTable, panel, G, thermal, topContrib, DEMAND, HYDRO, DISPATCH, ECON, SUPPLY};

/* ===================== 5. Sub-tab ===================== */
const SECTIONS = [
  ['demand', '01', 'Nhu cầu', 'Nhu cầu điện', 'Nhu cầu đang tăng thế nào và mức tăng có tạo áp lực lên hệ thống không?'],
  ['hydro', '02', 'Thủy văn', 'Thủy văn & nguồn cung', 'Điều kiện thủy văn và khả năng vận hành nguồn đang thuận lợi hay bất lợi?'],
  ['dispatch', '03', 'Huy động', 'Cơ cấu huy động', 'Nguồn nào đang được huy động nhiều hơn, nguồn nào đóng góp vào tăng trưởng sản lượng?'],
  ['economics', '04', 'Giá & biên', 'Giá & kinh tế phát điện', 'Giá thị trường điện và nhiên liệu đang thuận hay bất lợi cho nhà máy phát điện?'],
  ['evn', '05', 'EVN', 'EVN & dòng tiền hệ thống', 'Giá bán lẻ và tài chính bên mua điện ảnh hưởng thế nào đến dòng tiền ngành?'],
  ['supply', '06', 'Cung dài hạn', 'Cung điện dài hạn', 'Có đủ công suất cho phụ tải 2027–2030 không, nguồn mới đang ở giai đoạn nào?']
];
SECTIONS.forEach(s => { renders[s[0]] = []; });
const asOf = {demand: lastDay, hydro: H?.last_observation, dispatch: lastDay, economics: fmpLast ? 'FMP ' + ml(fmpLast.period) + ' · nhiên liệu ' + dm(coal3?.date) : null, evn: tariffDates ? 'giá bán lẻ từ ' + tariffDates.at(-1) : null, supply: 'Báo cáo 760/BC-BCT (10/09/2026)'};

function build() {
  const pane = document.querySelector('.majorpane[data-tab="mt2"]'), section = pane?.querySelector(':scope>.section'); if (!section || pane.querySelector('.pp-nav')) return;
  const head = section.querySelector('.sectionhead'), kpiGrid = pane.querySelector('.grid.kpis'), top = pane.querySelector('.pv-top');
  const tile = sel => { const n = kpiGrid?.querySelector(sel); return n?.closest('.kpi'); };
  const tileByLabel = re => [...(kpiGrid?.querySelectorAll('.kpi') || [])].find(k => re.test(k.querySelector('.label')?.textContent || ''));
  const keep = {daily: tile('#kpi-daily'), ytd: tileByLabel(/Lũy kế/), pmax: tile('#kpi-pmax'), tariff: tileByLabel(/bán lẻ/i), oni: tileByLabel(/ONI/), coal: tileByLabel(/Newcastle/)};
  const C = id => block(id), H2 = hostId => cardOf(hostId);
  // Card dời từ Chủ đề nóng (pipeline, thiếu hụt): để lại liên kết ở chỗ cũ.
  const moved = ['dien-24', 'dien-25'].map(id => { const c = C(id); if (!c) return null; const note = el('div', 'card pp-moved', `<div class="chart-title">${esc(c.querySelector('.chart-title')?.textContent || '')}</div><p class="research-caption">Chart đã chuyển sang <a href="?section=supply#mt2" data-pp-go="supply">Bức tranh ngành › Cung điện dài hạn</a>.</p>`); c.before(note); return c; });

  if (head) head.innerHTML = `<div><h2 class="sec">Bức tranh ngành</h2><p>Cầu → thủy văn & nguồn cung → huy động → giá & biên → dòng tiền EVN → cung dài hạn. Mỗi sub-tab trả lời một câu hỏi; chi tiết số liệu và phương pháp thu gọn ở cuối panel. Trạng thái chung của ngành: <a href="?ov=pulse#mt1" data-ov-go="pulse">← Tổng quan · Industry Pulse</a>.</p></div>`;
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Nhóm câu hỏi phân tích');
  head ? head.after(nav) : section.prepend(nav);
  const panes = {}; let anchor = nav;
  SECTIONS.forEach(([key, num, label, title, goal]) => {
    const b = el('button', 'tabbtn pp-tab', `<span>${num}</span>${esc(label)}`); b.type = 'button'; b.id = 'mt2-pp-' + key + '-tab'; b.setAttribute('role', 'tab'); b.dataset.section = key; nav.append(b);
    const p = el('div', 'pane-subpane pp-pane'); p.id = 'mt2-pp-' + key; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.hidden = true; b.setAttribute('aria-controls', p.id);
    p.innerHTML = `<header class="pp-head"><div><span class="pp-k">${num}</span><h2>${esc(title)}</h2><p>${esc(goal)}</p></div><span class="pp-asof">${asOf[key] ? 'Dữ liệu mới nhất: ' + esc(/^\d{4}-\d\d-\d\d$/.test(asOf[key]) ? dm(asOf[key]) : asOf[key]) : ''}</span></header>`;
    anchor.after(p); anchor = p; panes[key] = p;
  });
  const strip = (key, tiles) => { const g = el('section', 'grid kpis pp-kpis'); tiles.filter(Boolean).slice(0, 4).forEach(t => g.append(t)); panes[key].append(g); };

  const pick = (arr, l) => arr.filter(x => x[0] === l);

  /* ---------- 01 Nhu cầu ---------- */
  const lfLast = [...months].reverse().find(m => m.m <= M && m.lf != null), lfLy = lfLast && monthBy.get(back(lfLast.m + '-01').slice(0, 7));
  strip('demand', [keep.daily, keep.ytd, keep.pmax, kpi({label: 'Hệ số phụ tải · ' + (lfLast ? ml(lfLast.m) : '—'), value: nf(lfLast?.lf, 1), unit: '%', delta: lfLy?.lf != null ? `${pp(lfLast.lf - lfLy.lf)} so cùng kỳ` : '', cls: '', sub: 'điện năng ÷ (Pmax × 24h) · tự tính từ EVN'})]);
  const seasonal = pane.querySelector('.power-seasonal-status');
  panes.demand.append(panel({id: 'demand-trend', num: '1.1', q: 'Tiêu thụ điện đang tăng tốc hay giảm tốc?', finding: lines(pick(DEMAND, 'A').slice(0, 2)), main: C('dien-06') || H2('chDaily'), support: [C('dien-08') || H2('chMonthly'), block('dien-output-heatmap')], body: seasonal,
    interp: {what: 'Sản lượng hệ thống (sản xuất + nhập khẩu) theo ngày, tháng và so cùng kỳ.', mech: 'Điện năng tăng kéo theo nhu cầu nhiên liệu và nước; nguồn biên (than, khí) được huy động thêm khi cầu vượt khả năng thủy điện và NLTT.', who: 'Nhiệt điện than, khí (sản lượng biên); EVN (chi phí mua điện).', falsify: 'Tăng trưởng do yếu tố một lần (thời tiết cực đoan, ngày lễ) — đọc cùng chuỗi nhiều tháng.', watch: 'Tăng trưởng 3 tháng tới so cùng kỳ; bản tin tháng của EVN để đối chiếu tổng.'},
    method: 'Bản tin "Thông tin vận hành HTĐ Quốc gia" của EVN, đọc từng ngày. Tăng trưởng cùng kỳ chỉ cộng các ngày có bản tin ở cả hai năm; ngày thiếu không nội suy. Không suy luận nguyên nhân (công nghiệp, thời tiết) khi trang chưa có dữ liệu hỗ trợ.'}));
  panes.demand.append(panel({id: 'demand-peak', num: '1.2', q: 'Phụ tải đỉnh có tăng nhanh hơn điện năng không?', finding: lines(pick(DEMAND, 'A').slice(2)), main: C('dien-09') || H2('chPmax'), support: [peakCard(), lfCard()],
    interp: {what: 'Pmax (công suất đỉnh, MW) so với điện năng (triệu kWh) và hệ số phụ tải.', mech: 'Hệ số phụ tải giảm nghĩa là đỉnh tăng nhanh hơn bình quân: hệ thống cần thêm công suất đáp ứng giờ cao điểm dù tổng điện năng tăng chậm hơn.', who: 'Nguồn điều tiết được giờ cao điểm: thủy điện hồ lớn, khí, than; lưới truyền tải.', falsify: 'Đỉnh một ngày nắng nóng bất thường; tháng thiếu bản tin bỏ sót đỉnh thật.', watch: 'Đỉnh mùa nóng 2027; công suất khả dụng (chưa có dữ liệu — công suất đặt ở sub-tab 06 không thay được).'},
    method: 'Pmax tháng = cao nhất trong các bản tin của tháng (chỉ so khi cả hai tháng có ≥90% ngày). Hệ số phụ tải = điện năng bình quân ngày ÷ (Pmax × 24 giờ). Chưa có công suất khả dụng tin cậy để tính "đỉnh so công suất khả dụng".'}));
  panes.demand.append(panel({id: 'demand-read', num: '1.3', q: 'Áp lực nhu cầu nói gì với hệ thống?', finding: lines(DEMAND), body: el('p', 'research-caption', 'Không suy ra nguyên nhân tăng trưởng (sản xuất công nghiệp, thời tiết, kinh tế) khi trang chưa có dữ liệu hỗ trợ. Mùa vụ: so cùng tháng các năm ở chart 1.1.')}));

  /* ---------- 02 Thủy văn & nguồn cung ---------- */
  const r5 = reservoir5y;
  strip('hydro', [keep.oni, kpi({label: 'Hồ dưới TB 5 năm · ' + (r5 ? ml(r5.month) : '—'), value: r5 ? `${r5.below}/${r5.n}` : '—', unit: 'hồ', delta: r5 ? `trung vị ${pc(r5.med, 0)} so TB 5 năm` : '', cls: r5?.med < 0 ? 'd-bad' : 'd-good', sub: `${r5?.n ?? 0}/${r5?.total ?? 0} hồ đủ ≥80% ngày, nền ≥3 năm`}),
    kpi({label: 'Nước về so cùng kỳ', value: pc(resYoY?.med, 0), delta: resYoY ? `${resYoY.low}/${resYoY.n} hồ thấp hơn năm trước` : '', cls: kpiCls(resYoY?.med, 10), sub: `${resYoY?.span || '—'} · đúng các ngày năm trước`}),
    kpi({label: 'Vùng bất lợi / thuận lợi nhất', value: r5?.worst ? esc(r5.worst.reg) : '—', delta: r5?.worst ? `${pc(r5.worst.med, 0)} · thuận nhất ${esc(r5.best.reg)} ${pc(r5.best.med, 0)}` : '', cls: 'd-warn', sub: `${r5 ? ml(r5.month) : '—'} · trung vị lệch so TB 5 năm (vùng ≥2 hồ)`})]);
  panes.hydro.append(panel({id: 'hydro-enso', num: '2.1', q: 'ENSO đang nghiêng về khô hay ẩm?', finding: lines([HYDRO.find(x => /ONI/.test(x[1])), ninoLast && ['A', `Niño 3.4 tuần ${dm(ninoLast.date)} lệch ${sg(ninoLast.ssta, 2)} °C${nino4 ? `, 4 tuần trước ${sg(nino4.ssta, 2)}` : ''}.`]]), main: C('dien-04') || H2('chEnso'), support: [C('dien-05') || H2('chNino34'), block('dien-oni-gauge')],
    interp: {what: 'Nhiệt độ mặt biển vùng Niño 3.4 (tuần) và ONI (trung bình 3 tháng).', mech: 'El Niño thường đi kèm mùa khô ít mưa hơn ở Việt Nam, làm nước về hồ thấp; La Niña ngược lại (quan hệ lịch sử).', who: 'Thủy điện (sản lượng); nhiệt điện (huy động bù).', falsify: 'Lượng mưa lưu vực cụ thể lệch khỏi xu hướng ENSO; trang chưa có mô hình độ trễ ONI → lưu lượng.', watch: 'ONI các mùa tới; dự báo ENSO của NOAA.'},
    method: 'NOAA CPC: ONI (ERSSTv5) và Niño 3.4 tuần (OISST). Ngưỡng El Niño ≥ +0,5 °C, La Niña ≤ −0,5 °C. Không dùng ONI để dự báo định lượng lưu lượng hồ.'}));
  panes.hydro.append(panel({id: 'hydro-res', num: '2.2', q: 'Nước về các hồ đang thuận hay bất lợi so lịch sử?', finding: lines(pick(HYDRO, 'A').filter(x => /hồ/.test(x[1]))), main: C('dien-31'), support: [], body: C('dien-hydro-reservoirs'),
    interp: {what: 'Lưu lượng nước về và mực nước các hồ EVN so trung bình 5 năm và so năm trước.', mech: 'Nước về quyết định sản lượng thủy điện các tháng sau; mùa tích nước (cuối mưa) quyết định khả năng phát mùa khô.', who: 'Thủy điện theo vùng (xem 2.3); nhiệt điện huy động bù khi thủy điện thiếu.', falsify: 'Hồ đã tích đầy từ trước; mưa lớn cuối mùa.', watch: 'Mực nước hồ lớn so mực nước dâng bình thường; nước về T12–T2.'},
    method: 'EVN, ảnh chụp 00h mỗi ngày (±2 giờ). Tháng hợp lệ cần ≥80% ngày; nền 5 năm cần ≥3 năm hợp lệ. Trung vị không trọng số theo dung tích. So cùng kỳ ở bản đồ vùng dùng đúng các ngày đó năm trước, năm trước cần ≥80% số ngày.'}));
  const expo = el('div', 'card pp-expo'); expo.dataset.blockId = 'dien-pp-hydro-expo';
  panes.hydro.append(panel({id: 'hydro-expo', num: '2.3', q: 'Biến động thủy văn chạm tới tài sản của doanh nghiệp nào?', finding: lines([['B', 'Hồ trong dữ liệu EVN không mặc nhiên là tài sản của doanh nghiệp niêm yết; chỉ ghi chủ sở hữu khi đã xác minh nguồn.']]), main: expo,
    method: 'Bảng ánh xạ hồ → nhà máy → đơn vị sở hữu → công suất, mỗi dòng có nguồn đã mở. Dòng chưa tìm được nguồn ghi "Chưa xác minh". Tỷ trọng đóng góp vào doanh thu doanh nghiệp chưa tính.'}));
  renders.hydro.push(() => hydroExposure(expo));
  panes.hydro.append(panel({id: 'hydro-other', num: '2.4', q: 'Nguồn thay thế (than, khí, LNG) có bị hạn chế không?', finding: lines([['A', 'Trang chưa có chuỗi dữ liệu tin cậy về cung ứng nhiên liệu, dừng máy/bảo dưỡng, công suất khả dụng hay ràng buộc truyền tải.']]),
    body: gap('Khả năng cung ứng than/khí/LNG cho nhà máy, lịch bảo dưỡng – sự cố, công suất khả dụng, nghẽn truyền tải Bắc–Trung–Nam. Cần nguồn: báo cáo vận hành NSMO/EVN, công bố của TKV, PV GAS. Giá nhiên liệu xem sub-tab 04.')}));

  /* ---------- 03 Cơ cấu huy động ---------- */
  strip('dispatch', ['hydro', 'coal', 'gas', 're'].map(k => { const x = G(k); return kpi({label: SRC.find(s => s[0] === k)[1] + ' · ' + (M ? ml(M) : '—'), value: pc(x?.yoy), delta: x ? `tỷ trọng ${nf(x.shareCur, 1)}% (${pp(x.dpp)})` : '', cls: kpiCls(x?.yoy, 2), sub: `${sg(x?.delta, 0)} triệu kWh so cùng kỳ`}); }));
  panes.dispatch.append(panel({id: 'dispatch-mix', num: '3.1', q: 'Cơ cấu nguồn đang thay đổi thế nào?', finding: lines(pick(DISPATCH, 'A').slice(1)), main: mixCard(), support: [block('dien-mix-today')],
    method: 'Bình quân ngày theo nguồn = tổng các bản tin đủ thành phần trong tháng ÷ số ngày đó (không bị lệch khi tháng thiếu bản tin). Khí & dầu = khí + dầu; gió & mặt trời = gió + điện mặt trời trang trại + mái nhà (EVN ước tính theo cơ sở thương phẩm).'}));
  panes.dispatch.append(panel({id: 'dispatch-contrib', num: '3.2', q: 'Nguồn nào đóng góp vào tăng trưởng sản lượng?', finding: lines(pick(DISPATCH, 'A').slice(0, 1)), main: contribCard(), support: [C('dien-11-sources')],
    method: 'Δ từng nguồn = sản lượng kỳ này − cùng kỳ trên đúng các ngày có bản tin đủ nguồn ở cả hai năm. Đóng góp (đ.p.) = Δ nguồn ÷ tổng cùng kỳ; cộng các nguồn = tăng trưởng tổng. Card "Sản lượng tăng chủ yếu từ nguồn nào?" dùng số lũy kế công bố của EVN (kỳ khác), giữ để đối chiếu.'}));
  panes.dispatch.append(panel({id: 'dispatch-subst', num: '3.3', q: 'Thủy điện giảm thì nguồn nào bù?', finding: lines(pick(DISPATCH, 'B')), main: substCard(),
    drill: {label: 'Xem từng nguồn so cùng tháng các năm (5 chart)', nodes: [C('dien-07') || H2('chMixShare'), C('dien-07-coal'), C('dien-07-gas'), C('dien-07-renewables'), C('dien-07-imports')]},
    interp: {what: 'Thay đổi sản lượng từng nguồn so cùng tháng năm trước.', mech: 'Thủy điện có chi phí biến đổi thấp nhất; khi nước về ít, hệ thống huy động thêm than (rẻ hơn) rồi khí/LNG để đáp ứng cầu.', who: 'Thủy điện (giảm sản lượng); than, khí (tăng huy động).', falsify: 'Cầu tăng mạnh khiến mọi nguồn cùng tăng; thay đổi do bảo dưỡng lớn hoặc ràng buộc truyền tải.', watch: 'Δ thủy điện và than các tháng mùa khô 2027.'},
    method: 'Tương quan giữa các nguồn trên chart chỉ là quan sát cùng thời điểm, không chứng minh quan hệ nhân quả.'}));
  const dt = el('div', 'card pp-dtable'); dt.dataset.blockId = 'dien-pp-dispatch-table';
  const r12 = CMP.ytd;
  dt.innerHTML = r12?.n ? `<div class="chart-sub">${esc(PERIODS.ytd.name)} so cùng kỳ · ${r12.n}/${r12.total} ngày đối chiếu</div><div class="tablewrap"><table><thead><tr><th>Nguồn</th><th>Sản lượng YoY</th><th>Thay đổi tỷ trọng</th><th>Đóng góp</th><th>Điều cần kiểm chứng</th></tr></thead><tbody>${r12.rows.filter(x => x.k !== 'other').map(x => `<tr><td><b>${x.name}</b></td><td>${pc(x.yoy)}</td><td>${pp(x.dpp)}</td><td>${pp(x.contrib)}</td><td>${{hydro: 'Nước về, mực nước hồ; tỷ lệ Qc của từng nhà máy', coal: 'Giá than nhập/nội, FMP; chi phí có được chuyển ngang', gas: 'Giá khí/LNG so FMP; Qc NT3&4 và các nhà máy khí', re: 'Cắt giảm công suất (chưa có dữ liệu); hợp đồng FIT/chuyển tiếp', imports: 'Hợp đồng nhập khẩu Lào, Trung Quốc; giá mua'}[x.k] || ''}</td></tr>`).join('')}</tbody></table></div>` : '';
  if (!r12?.n) dt.append(gap('chưa đủ ngày đối chiếu.'));
  panes.dispatch.append(panel({id: 'dispatch-read', num: '3.4', q: 'Đọc thay đổi huy động thế nào cho đúng?', finding: lines([['C', 'Bảng chưa đủ để suy ra lợi nhuận: cần FMP theo nhà máy, tỷ lệ Qc và chi phí nhiên liệu chuyển ngang (xem sub-tab 04).']]), main: dt}));

  /* ---------- 04 Giá & kinh tế phát điện ---------- */
  strip('economics', [kpi({label: 'FMP · ' + (fmpLast ? ml(fmpLast.period) : '—'), value: nf(fmpLast?.fmp, 0), unit: 'đ/kWh', delta: `${pc(fmpPrev ? (fmpLast.fmp / fmpPrev.fmp - 1) * 100 : null)} so tháng trước`, cls: '', sub: `${fmpLy ? 'cùng kỳ ' + nf(fmpLy.fmp, 0) : ''}${fmpYtd ? ' · BQ ' + fmpYtd.n + ' tháng ' + pc((fmpYtd.cur / fmpYtd.prev - 1) * 100) + ' YoY' : ''}`}),
    keep.coal, kpi({label: 'LNG JKM', value: nf(jkm3?.now, 2), unit: 'USD/MMBtu', delta: `${pc(jkm3?.pct)} so 3 tháng`, cls: '', sub: `${dm(jkm3?.date)} · ICE futures`}),
    kpi({label: 'Henry Hub', value: nf(hh3?.now, 2), unit: 'USD/MMBtu', delta: `${pc(hh3?.pct)} so 3 tháng`, cls: '', sub: `${dm(hh3?.date)} · tham chiếu giá LNG Mỹ`})]);
  panes.economics.append(panel({id: 'econ-fmp', num: '4.1', q: 'Giá thị trường điện đang lên hay xuống?', finding: lines([pick(ECON, 'A')[0]]), main: C('dien-15') || H2('chFmpTrend'),
    interp: {what: 'FMP (giá thị trường toàn phần) theo tháng; CAN bình quân năm ở lớp tham chiếu.', mech: 'FMP cao hơn có lợi cho phần điện năng bán ngoài hợp đồng (ngoài Qc) của các nhà máy chào giá.', who: 'Nhà máy trực tiếp tham gia thị trường; thủy điện, nhiệt điện có tỷ lệ Qc thấp.', falsify: 'Nhà máy có Qc cao hoặc gián tiếp tham gia thị trường gần như không hưởng FMP.', watch: 'FMP mùa khô; CAN năm 2027 khi công bố.'},
    method: 'FMP không phải giá bán thực nhận của mọi nhà máy. CAN là giá năm, không phải giá từng tháng; không lấy FMP tháng trừ CAN năm để suy SMP tháng.'}));
  panes.economics.append(panel({id: 'econ-fuel', num: '4.2', q: 'Nhiên liệu đang đắt lên hay rẻ đi?', finding: lines([pick(ECON, 'A')[1]]), main: fuelCard(), support: [C('fast-price') || H2('chFastPrice')],
    drill: {label: 'Bảng & chart gốc theo benchmark (World Bank tháng)', nodes: [C('dien-12') || H2('chCoalM'), C('dien-13') || H2('chGasM')]},
    method: 'Base 100 = giá trị đầu tiên trong khung xem của từng benchmark. Chế độ giá gốc chỉ đặt chung trục các benchmark cùng đơn vị (USD/tấn với than, USD/MMBtu với khí). Benchmark quốc tế không phải giá đầu vào thực tế của nhà máy (hợp đồng than TKV, khí trong nước).'}));
  panes.economics.append(panel({id: 'econ-margin', num: '4.3', q: 'FMP có bù được chi phí nhiên liệu không?', finding: lines([['B', 'Spread dưới đây là <b>biên năng lượng minh họa</b> (FMP − chi phí nhiên liệu biến đổi ước tính theo suất hao nhiệt giả định), không phải biên gộp, EBITDA hay lợi nhuận của doanh nghiệp.']]), main: C('dien-30') || H2('chSpread'), support: [hydroEconCard()],
    interp: {what: 'Chênh lệch FMP với chi phí nhiên liệu than nhập, LNG và mốc khung giá than/khí nội.', mech: 'Spread dương: một kWh bán thêm trên thị trường bù được nhiên liệu; spread âm: nhà máy chào giá cao, ít được huy động ngoài Qc.', who: 'Than nhập (dark spread), khí/LNG (spark spread); thủy điện không tốn nhiên liệu nên chỉ phụ thuộc sản lượng × giá.', falsify: 'Suất hao nhiệt thực tế khác giả định; giá nhiên liệu theo hợp đồng dài hạn khác benchmark.', watch: 'Heat rate thực tế của từng nhà máy (chưa có); giá than TKV, khí trong nước 2027.'},
    method: 'Theo card "Spread FMP − chi phí nhiên liệu biến đổi": than WB/LNG WB × tỷ giá × suất hao nhiệt giả định theo tham số khung giá (QĐ 1692, 1882). Chưa trừ chi phí carbon nên dùng "spark/dark spread", không dùng "clean spread".'}));
  const fw = el('div', 'card pp-frame'); fw.dataset.blockId = 'dien-pp-contract';
  fw.innerHTML = `<div class="tablewrap"><table><thead><tr><th>Yếu tố</th><th>Cơ chế</th><th>Khi FMP tăng</th><th>Cần để định lượng</th></tr></thead><tbody>
    <tr><td><b>Giá PPA</b></td><td>Giá hợp đồng mua bán điện với EVN/EPTC (giá cố định + biến đổi)</td><td>Không đổi trong kỳ hợp đồng</td><td>Điều khoản PPA từng nhà máy</td></tr>
    <tr><td><b>Sản lượng hợp đồng Qc</b></td><td>Phần sản lượng thanh toán theo giá hợp đồng (CfD)</td><td>Qc càng cao, lợi ích từ FMP càng nhỏ</td><td>Tỷ lệ Qc năm của từng nhà máy</td></tr>
    <tr><td><b>Điện năng ngoài Qc</b></td><td>Bán theo giá thị trường (FMP)</td><td>Hưởng trực tiếp nếu FMP > chi phí biến đổi</td><td>Sản lượng thực phát − Qc</td></tr>
    <tr><td><b>Nhiên liệu chuyển ngang</b></td><td>Giá biến đổi điều chỉnh theo giá than/khí</td><td>Biên theo hợp đồng giữ ổn định; phần thị trường chịu rủi ro giá nhiên liệu</td><td>Công thức điều chỉnh trong PPA</td></tr>
    <tr><td><b>Khấu hao, lãi vay</b></td><td>Chi phí cố định, thu hồi qua giá cố định</td><td>Sản lượng cao hơn trải chi phí cố định</td><td>Lịch khấu hao, nợ vay từng nhà máy</td></tr></tbody></table></div>`;
  panes.economics.append(panel({id: 'econ-contract', num: '4.4', q: 'Khi nào giá thị trường tăng thành lợi nhuận tăng?', finding: lines([['C', 'Giá thị trường tăng chỉ thành lợi nhuận khi nhà máy có điện năng ngoài Qc đáng kể, được huy động, và FMP vượt chi phí biến đổi. Trang chưa có Qc, điều khoản PPA từng nhà máy nên không tạo số độ nhạy.']]), main: fw}));

  /* ---------- 05 EVN ---------- */
  const tFirst = tariffVals?.[0], tLast = tariffVals?.at(-1);
  strip('evn', [keep.tariff, kpi({label: 'Thay đổi từ ' + (tariffDates?.[0]?.slice(-4) || '—'), value: pc(tFirst && tLast ? (tLast / tFirst - 1) * 100 : null), delta: `${tariffVals ? tariffVals.length - 1 : '—'} lần điều chỉnh`, cls: '', sub: `giá bán lẻ bình quân, ${tariffDates?.[0] || '—'} → ${tariffDates?.at(-1) || '—'}`}),
    kpi({label: 'Lỗ lũy kế công ty mẹ EVN', value: lossVals ? (lossVals.at(-1) === 0 ? 'Đã xử lý hết' : nf(lossVals.at(-1), 0)) : '—', delta: lossVals ? `cuối 2024: ${nf(lossVals[0], 0)} tỷ đồng` : '', cls: 'd-good', sub: `${lossLabels?.at(-1) || '—'} · công ty mẹ, không phải hợp nhất`})]);
  panes.evn.append(panel({id: 'evn-tariff', num: '5.1', q: 'Giá bán lẻ đã điều chỉnh thế nào?', finding: lines([tLast && ['A', `Giá bán lẻ bình quân ${nf(tLast, 2)} đ/kWh (chưa VAT) từ ${tariffDates.at(-1)}, ${pc((tLast / tariffVals.at(-2) - 1) * 100, 1)} so mức trước.`]]), main: C('dien-14') || H2('chTariff'),
    method: 'Giá bán lẻ bình quân theo quyết định của EVN/Bộ Công Thương. Không ghép với khung giá phát điện (loại giá khác, xem tab Policy · Tax · Trade).'}));
  panes.evn.append(panel({id: 'evn-fin', num: '5.2', q: 'Tài chính EVN đang cải thiện hay xấu đi?', finding: lines([lossVals && ['A', `Lỗ lũy kế công ty mẹ: ${nf(lossVals[0], 0)} tỷ đồng (${lossLabels[0]}) → ${nf(lossVals[1], 0)} (${lossLabels[1]}) → ${lossVals.at(-1) === 0 ? 'đã xử lý hết' : nf(lossVals.at(-1), 0)} (${lossLabels.at(-1)}).`]]), main: C('dien-16') || H2('chEvnLoss'),
    body: gap('Báo cáo hợp nhất EVN, dòng tiền, khoản phải trả các đơn vị phát điện theo kỳ. Không ghép số công ty mẹ với số hợp nhất thành một chuỗi.'),
    method: 'Số công ty mẹ EVN theo công bố (card gốc ghi nguồn). Phạm vi hợp nhất chưa có chuỗi trên trang.'}));
  const flow = el('div', 'card pp-flow'); flow.dataset.blockId = 'dien-pp-evn-flow';
  flow.innerHTML = `<div class="pp-flow-row">${['Giá bán lẻ điện<br><small>doanh thu của EVN</small>', 'Chi phí mua điện + truyền tải, phân phối, hệ thống', 'Tình hình tài chính EVN / EPTC', 'Khả năng thanh toán cho nhà máy', 'Dòng tiền, vốn lưu động doanh nghiệp phát điện'].map((t, i) => `${i ? '<span class="pp-arrow" aria-hidden="true">→</span>' : ''}<div class="pp-flow-box">${t}</div>`).join('')}</div><p class="research-caption">Sơ đồ truyền dẫn phân tích, không khẳng định biến động lợi nhuận EVN luôn dẫn tới chậm thanh toán.</p>`;
  panes.evn.append(panel({id: 'evn-flow', num: '5.3', q: 'Tài chính EVN truyền sang dòng tiền nhà máy qua kênh nào?', finding: lines([['B', 'Khi giá bán lẻ không theo kịp chi phí mua điện, áp lực dồn về EVN/EPTC; rủi ro với nhà máy là kỳ thu tiền kéo dài, không phải doanh thu mất đi.']]), main: flow}));
  panes.evn.append(panel({id: 'evn-risk', num: '5.4', q: 'Có dấu hiệu rủi ro thanh toán từ bên mua điện không?', finding: lines([['A', 'Trang chưa có chuỗi phải thu tiền điện, tuổi nợ hay công nợ EVN theo kỳ nên chưa đánh giá được; không suy diễn rủi ro khi chưa có bằng chứng trực tiếp.']]),
    body: gap('Phải thu tiền điện và tuổi nợ của các doanh nghiệp phát điện (thuyết minh BCTC), công nợ EVN/EPTC với đơn vị phát điện. Dữ liệu quý của doanh nghiệp trên trang hiện chỉ có doanh thu, lãi gộp, lãi ròng.')}));

  /* ---------- 06 Cung dài hạn ---------- */
  const capTotal = capItems ? sum(capItems.map(x => x[1])) : null;
  strip('supply', [kpi({label: 'Công suất đặt cuối 2025', value: nf(capTotal, 0), unit: 'MW', delta: capItems ? `than ${nf(capItems[0][1] / capTotal * 100, 0)}% · thủy điện ${nf(capItems[1][1] / capTotal * 100, 0)}% · NLTT ${nf(capItems[2][1] / capTotal * 100, 0)}%` : '', cls: '', sub: 'công suất đặt, không phải khả dụng'}),
    kpi({label: 'Pmax từ đầu năm', value: nf(pmaxYtd?.cur.pmax, 0), unit: 'MW', delta: dm(pmaxYtd?.cur.date), cls: 'd-warn', sub: 'EVN · không so trực tiếp với công suất đặt'}),
    kpi({label: 'Sản lượng 2030 cần đạt', value: outVals ? `${nf(outVals[1], 0)}–${nf(outVals[2], 0)}` : '—', unit: 'tỷ kWh', delta: outVals ? `từ ${nf(outVals[0], 1)} năm 2025 (ước)` : '', cls: '', sub: 'mục tiêu Quy hoạch điện VIII điều chỉnh'}),
    kpi({label: 'Thiếu hụt 2030 nếu dự án chậm', value: nf(shortfallMw?.at(-1), 0), unit: 'MW', delta: 'kịch bản, không phải dự báo', cls: 'd-warn', sub: 'Báo cáo 760/BC-BCT'})]);
  panes.supply.append(panel({id: 'supply-cap', num: '6.1', q: 'Công suất hiện có so với phụ tải và mục tiêu 2030?', finding: lines([SUPPLY[0]]), main: C('dien-10') || H2('chCapacity'), support: [C('dien-11') || H2('chOutputTarget')],
    body: gap('Chuỗi công suất đặt theo năm, công suất khả dụng và dự phòng thực tế. Hiện chỉ có công suất đặt cuối 2025.'),
    method: 'Không lấy công suất đặt trừ Pmax để kết luận mức dự phòng: công suất khả dụng phụ thuộc thủy văn, bảo dưỡng, NLTT theo thời tiết và ràng buộc lưới.'}));
  panes.supply.append(panel({id: 'supply-pipe', num: '6.2', q: 'Nguồn mới trong quy hoạch đang ở giai đoạn nào?', finding: lines([SUPPLY[1]]), main: moved[0],
    body: gap('Pipeline theo MW và theo nhóm nguồn (báo cáo gốc công bố tỷ trọng theo số dự án). Danh sách dự án LNG theo MW xem tab Chủ đề nóng › Chuyển dịch năng lượng.'),
    method: 'Báo cáo 760/BC-BCT ngày 10/09/2026, theo Tạp chí Năng lượng Việt Nam. Tỷ lệ là % số dự án; không diễn giải thành % MW.'}));
  panes.supply.append(panel({id: 'supply-gap', num: '6.3', q: 'Nếu dự án tiếp tục chậm, thiếu hụt lớn đến đâu?', finding: lines([SUPPLY[2]]), main: moved[1],
    interp: {what: 'Công suất thiếu hụt theo kịch bản chậm tiến độ của Bộ Công Thương.', mech: 'Phụ tải tăng nhanh hơn nguồn mới vào vận hành làm giảm dự phòng, tăng huy động nguồn đắt và rủi ro cắt điện mùa khô.', who: 'Nhiệt điện hiện hữu (huy động cao), xây lắp – thiết bị (đẩy nhanh dự án).', falsify: 'Dự án lớn về đích đúng hạn; phụ tải tăng chậm hơn kịch bản.', watch: 'Báo cáo tiến độ kế tiếp; COD các dự án LNG, than, tích năng.'},
    method: 'Đây là kịch bản "tiến độ chậm", không phải kịch bản cơ sở. Chưa có kịch bản cơ sở/stress của cùng nguồn để đặt cạnh.'}));
  panes.supply.append(panel({id: 'supply-invest', num: '6.4', q: 'Chu kỳ đầu tư tạo việc cho EPC, tư vấn, thiết bị ở đâu?', finding: lines([['C', 'Nhóm xây lắp – thiết bị (PC1, TV2, GEX) hưởng lợi nếu các dự án nguồn, lưới khởi công và giải ngân đúng kế hoạch; tín hiệu sớm là ký EPC, khởi công.']]),
    body: [el('p', 'research-caption', 'Văn bản Quy hoạch điện VIII, khung giá, cơ chế phê duyệt: xem <a href="#mt4" data-pp-main="mt4">Policy · Tax · Trade</a>. Danh sách dự án LNG và tiến độ: <a href="#mt7" data-pp-main="mt7">Chủ đề nóng</a>. Sự kiện sắp tới: <a href="#mt5" data-pp-main="mt5">Catalyst · Risk</a>.'), gap('COD dự kiến theo năm (MW theo nhóm nguồn), nhu cầu vốn đầu tư lưới truyền tải.')]}));

  // Chuyển phần còn lại của bố cục cũ (Thế giới / Việt Nam) — nếu sót card thì đưa vào Pulse, không mất.
  // dien-02 (nhận định AI đã lưu) do Tổng quan ngành lấy sang Industry Pulse.
  const left = [...section.querySelectorAll('#supply-world .card, #supply-vietnam .card')].filter(c => !c.closest('.pp-pane') && !c.parentElement.closest('.card') && c.dataset.blockId !== 'dien-02');
  if (left.length) { const d = el('details', 'research-fold'); d.append(el('summary', '', 'Card chưa phân loại')); left.forEach(c => d.append(c)); panes.demand.append(d); document.documentElement.dataset.ppLeftover = left.map(c => c.dataset.blockId || '?').join(','); }
  section.querySelectorAll(':scope>.supply-tabs, :scope>.supply-pane, :scope>#supply-world, :scope>#supply-vietnam').forEach(n => { n.hidden = true; n.classList.add('pp-old'); });
  [kpiGrid, top].forEach(n => { if (n && !n.querySelector('.kpi,.card')) n.remove(); });
  if (kpiGrid?.isConnected && kpiGrid.querySelector('.kpi')) panes.demand.append(kpiGrid);

  // Điều hướng: chọn sub-tab, URL ?section=…#mt2, Back/Forward.
  const keys = SECTIONS.map(s => s[0]), done = new Set();
  const btns = [...nav.children];
  const select = (key, push) => {
    if (!keys.includes(key)) key = 'demand';
    keys.forEach((k, i) => { const on = k === key; panes[k].hidden = !on; btns[i].setAttribute('aria-selected', String(on)); btns[i].tabIndex = on ? 0 : -1; btns[i].classList.toggle('active', on); });
    if (!done.has(key)) { done.add(key); renders[key].forEach(f => { try { f(); } catch (e) { document.documentElement.dataset.ppError = (document.documentElement.dataset.ppError || '') + key + ':' + e.message + ';'; } }); }
    const u = new URL(location.href);
    if (push && u.searchParams.get('section') !== key) { u.searchParams.set('section', key); history.pushState({ppSection: key}, '', u.pathname + u.search + (location.hash || '#mt2')); }
    const b = btns[keys.indexOf(key)]; if (b) nav.scrollLeft = Math.max(0, b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 30); refit(panes[key]);
  };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => select(b.dataset.section, true));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const n = (i + d + btns.length) % btns.length; btns[n].click(); btns[n].focus(); });
  });
  const fromUrl = () => new URL(location.href).searchParams.get('section');
  addEventListener('popstate', () => { const s = fromUrl(); if (s && (location.hash === '#mt2' || !location.hash)) window.showMajorTab?.('mt2'); select(s || 'demand', false); });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-pp-go]'); if (a) { e.preventDefault(); window.showMajorTab?.('mt2'); select(a.dataset.ppGo, true); pane.scrollIntoView({block: 'start'}); return; }
    const m = e.target.closest('[data-pp-main]'); if (m) { e.preventDefault(); window.showMajorTab?.(m.dataset.ppMain); window.scrollTo({top: 0}); }
  });
  const s0 = fromUrl();
  if (s0 && (!location.hash || location.hash === '#')) { history.replaceState(null, '', location.pathname + location.search + '#mt2'); window.showMajorTab?.('mt2'); }
  // Link cũ ?section=pulse#mt2: Industry Pulse nay ở Tổng quan ngành.
  if (s0 === 'pulse') { history.replaceState(null, '', location.pathname + '?ov=pulse#mt1'); window.showMajorTab?.('mt1'); }
  select(s0 && s0 !== 'pulse' ? s0 : 'demand', false);
  // Thanh sub-tab dính ngay dưới thanh tab chính (thanh tab chính chỉ dính ở desktop).
  const setTop = () => { const t = document.querySelector('.majortabs'); const cs = t && getComputedStyle(t); nav.style.top = cs && cs.position === 'sticky' && innerWidth > 700 ? (t.getBoundingClientRect().height + 8) + 'px' : '0px'; };
  setTop(); addEventListener('resize', setTop);
  document.documentElement.dataset.ppReady = '1';
}

// Bảng 2.3: dữ liệu ánh xạ sở hữu (data/power-hydro-assets.js) nếu đã nạp; hồ không có dòng → "Chưa xác minh".
function hydroExposure(card) {
  const A = window.POWER_HYDRO_ASSETS, names = H?.monthly ? [...new Set(H.monthly.map(r => r.reservoir))] : [];
  if (!names.length) { card.replaceChildren(gap('chưa nạp dữ liệu hồ EVN.')); return; }
  const region = Object.fromEntries((H.monthly || []).map(r => [r.reservoir, r.region]));
  const by = Object.fromEntries((A?.rows || []).map(r => [r.reservoir, r]));
  const yoy = Object.fromEntries((H.yoy?.rows || []).filter(r => r.month === H.yoy.month).map(r => [r.reservoir, r.yoy]));
  const rows = names.map(n => ({n, reg: region[n], a: by[n], y: yoy[n]})).sort((x, y) => (x.reg || '').localeCompare(y.reg || '', 'vi') || x.n.localeCompare(y.n, 'vi'));
  const tickers = [...new Set(rows.map(r => r.a?.ticker).filter(Boolean))].sort();
  card.innerHTML = `<div class="pp-ctl" role="group"><label>Doanh nghiệp <select data-tk><option value="">Tất cả</option>${tickers.map(t => `<option>${esc(t)}</option>`).join('')}</select></label><span class="muted">${A ? `Kiểm tra nguồn ${esc(A.checked_at || '')}` : 'Chưa nạp bảng sở hữu: mọi dòng ghi "Chưa xác minh".'}</span></div>
    <div class="tablewrap"><table><thead><tr><th>Vùng</th><th>Hồ / nhà máy</th><th>Công suất (MW)</th><th>Đơn vị sở hữu</th><th>Mã</th><th>Nước về so cùng kỳ</th><th>Nguồn</th></tr></thead><tbody>${rows.map(r => {
      const a = r.a, ok = !!a && (a.status === 'Đã xác minh' || a.status === 'Xác minh một phần'), part = a?.status === 'Xác minh một phần';
      const note = [a?.stake_note, a?.mw_basis].filter(Boolean).join(' · ');
      return `<tr data-tk="${esc(a?.ticker || a?.parent_ticker || '')}"><td>${esc(r.reg || '')}</td><td><a href="#" data-res="${esc(r.n)}">${esc(r.n)}</a></td><td${a?.mw_basis ? ` title="${esc(a.mw_basis)}"` : ''}>${ok && a.plant_mw ? nf(a.plant_mw, 0) + (a.mw_basis ? '*' : '') : '—'}</td>` +
        `<td>${ok ? esc(a.owner || '') + (a.parent ? ` <small class="muted">(thuộc ${esc(a.parent)})</small>` : '') + (part ? ' <small class="pp-part">xác minh một phần</small>' : '') : '<span class="muted">Chưa xác minh</span>'}${note ? `<br><small class="muted">${esc(note)}</small>` : ''}</td>` +
        `<td>${ok && a.ticker ? `<b>${esc(a.ticker)}</b>${a.exchange ? ' · ' + esc(a.exchange) : ''}` : ok && a.parent_ticker ? `<span title="mã của đơn vị mẹ / liên kết">${esc(a.parent_ticker)}</span>` : '—'}</td><td class="${r.y < 0 ? 'dn' : 'up'}">${pc(r.y, 0)}</td>` +
        `<td>${ok ? (a.sources || []).slice(0, 3).map((s, i) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.quote || '')}">[${i + 1}]</a>`).join(' ') : ''}</td></tr>`; }).join('')}</tbody></table></div>
    <p class="source-note">Hồ trong dữ liệu EVN không mặc nhiên là tài sản doanh nghiệp niêm yết. "Xác minh một phần": nguồn nêu đơn vị quản lý nhưng liên kết hồ ↔ nhà máy hoặc trạng thái niêm yết của đơn vị mẹ chưa đủ chắc. * = công suất có ghi chú cách xác định (rê chuột). Tỷ trọng đóng góp vào doanh thu doanh nghiệp chưa tính.</p>`;
  const sel = card.querySelector('[data-tk]');
  sel.addEventListener('change', () => {
    const t = sel.value; card.querySelectorAll('tbody tr').forEach(tr => tr.classList.toggle('pp-hl', !!t && tr.dataset.tk === t));
    const set = new Set(rows.filter(r => t && (r.a?.ticker === t || r.a?.parent_ticker === t)).map(r => r.n));
    document.querySelectorAll('.pv-res').forEach(c => c.classList.toggle('pp-hl', set.has(c.dataset.name)));
  });
  card.addEventListener('click', e => { const a = e.target.closest('[data-res]'); if (!a) return; e.preventDefault(); const s = document.getElementById('hydro-reservoir'); if (s) { s.value = a.dataset.res; s.dispatchEvent(new Event('change', {bubbles: true})); s.closest('.card')?.scrollIntoView({behavior: 'smooth', block: 'start'}); } });
}

const CSS = `
.pp-nav{position:sticky;z-index:6;display:flex;gap:4px;overflow-x:auto;scrollbar-width:thin;margin:6px 0 14px;padding:6px;border:1px solid var(--line,#e3e7f0);border-radius:12px;background:var(--card,#fff);box-shadow:0 2px 10px rgba(29,38,120,.06)}
.pp-nav .pp-tab{flex:0 0 auto;white-space:nowrap;border:0;border-radius:8px;padding:7px 12px;background:transparent;color:var(--ink2,#3b4256);font:600 13px/1.2 Inter,system-ui,sans-serif;cursor:pointer}
.pp-nav .pp-tab span{font-variant-numeric:tabular-nums;color:var(--muted,#7a8399);margin-right:6px;font-weight:500}
.pp-nav .pp-tab[aria-selected=true]{background:#2938A8;color:#fff}.pp-nav .pp-tab[aria-selected=true] span{color:#cfd5f5}
.pp-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin:2px 0 12px;flex-wrap:wrap}
.pp-head h2{margin:0;font-size:19px}.pp-head p{margin:4px 0 0;color:var(--ink2,#3b4256);font-size:13.5px}.pp-k{font:600 12px Inter,sans-serif;color:var(--muted,#7a8399);letter-spacing:.04em}
.pp-asof{font-size:12px;color:var(--muted,#7a8399)}
.pp-kpis{margin-bottom:16px}.pp-pane .pp-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}.pp-kpi .value small{font-size:12px;font-weight:500;color:var(--muted,#7a8399)}
.pp-panel{margin:0 0 22px;padding:14px 14px 10px;border:1px solid var(--line,#e3e7f0);border-radius:14px;background:color-mix(in srgb,var(--card,#fff) 92%,#2938A8 3%)}
.pp-ph{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}.pp-num{flex:0 0 auto;font:700 12px Inter,sans-serif;color:#fff;background:#1D2678;border-radius:6px;padding:3px 7px;margin-top:2px}
.pp-ph h3{margin:0 0 4px;font-size:15.5px;line-height:1.35}.pp-find{font-size:13px;line-height:1.55}
.pp-line{margin:2px 0}.pp-lv{display:inline-block;font:600 10.5px/1.6 Inter,sans-serif;border-radius:4px;padding:0 6px;margin-right:4px;vertical-align:1px}
.pp-lv-A{background:#e7ebfb;color:#1D2678}.pp-lv-B{background:#fff1d6;color:#7a5200}.pp-lv-C{background:#f7e3ee;color:#861C52}
.pp-main>.card,.pp-panel>.card{margin-bottom:12px}.pp-sup{margin-bottom:12px}
.pp-interp,.pp-method,.pp-drill{margin-top:8px;border-top:1px dashed var(--line,#e3e7f0);padding-top:6px;font-size:13px}
.pp-interp summary,.pp-method summary,.pp-drill summary{cursor:pointer;color:var(--ink2,#3b4256);font-weight:600}
.pp-interp dl{display:grid;grid-template-columns:minmax(150px,220px) 1fr;gap:4px 12px;margin:8px 0}.pp-interp dt{color:var(--muted,#7a8399)}.pp-interp dd{margin:0}
.pp-method>div{margin:6px 0;color:var(--ink2,#3b4256);line-height:1.55}.pp-drill-body{display:grid;gap:12px;margin-top:10px}
.pp-gap{margin:8px 0}.pp-ctl{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0}.pp-ctl>span{font-size:12px;color:var(--muted,#7a8399);margin-left:4px}
.pp-ctl button{border:1px solid var(--line,#d6dbe8);background:var(--card,#fff);color:var(--ink2,#3b4256);border-radius:7px;padding:4px 10px;font:600 12px Inter,sans-serif;cursor:pointer}
.pp-ctl button[aria-pressed=true]{background:#2938A8;border-color:#2938A8;color:#fff}
.pp-div-head{display:flex;justify-content:space-between;font-size:12px;color:var(--muted,#7a8399);margin:4px 0 8px}
.pp-div-row{display:grid;grid-template-columns:130px 1fr 80px 150px;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid var(--line,#eef0f6);font-size:13px}
.pp-div-t{position:relative;height:16px;background:linear-gradient(90deg,transparent calc(50% - .5px),#b9c1d0 calc(50% - .5px),#b9c1d0 calc(50% + .5px),transparent calc(50% + .5px))}
.pp-div-t i{position:absolute;top:2px;height:12px;border-radius:3px}.pp-div-row b{text-align:right;font-variant-numeric:tabular-nums}.pp-div-row em{font-style:normal;color:var(--muted,#7a8399);font-size:12px}
.pp-div-total{font-weight:700;border-top:2px solid var(--line,#d6dbe8)}.pp-div-res .pp-div-l{color:#b8443a}.pp-div-note{font-size:12px;color:var(--muted,#7a8399);margin-top:6px}
.pp-assess-grid{gap:12px}.pp-assess{padding:14px}.pp-as-h{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.pp-as-h b{font-size:14.5px}.pp-as-h a{font-size:12px;white-space:nowrap}
.pp-as-sub{margin:2px 0 8px;font-size:12px;color:var(--muted,#7a8399)}.pp-as-row{display:grid;grid-template-columns:96px 1fr;gap:8px;padding:6px 0;border-top:1px solid var(--line,#eef0f6);font-size:13px;line-height:1.5}
.pp-as-row>span{color:var(--muted,#7a8399);font-size:12px}
.pp-matrix td,.pp-frame td,.pp-dtable td,.pp-expo td{vertical-align:top;font-size:12.8px;line-height:1.45}.pp-mini-go{font-size:11.5px}
.pp-flow-row{display:flex;align-items:stretch;gap:6px;flex-wrap:wrap}.pp-flow-box{flex:1 1 140px;border:1px solid var(--line,#d6dbe8);border-radius:10px;padding:10px;font-size:13px;font-weight:600;background:var(--card,#fff)}
.pp-flow-box small{font-weight:400;color:var(--muted,#7a8399)}.pp-arrow{align-self:center;color:#2938A8;font-weight:700}
.pp-expo tr.pp-hl td{background:#fff4d6!important}.pv-res.pp-hl{stroke:#c98a00;stroke-width:3}
.pp-part{background:#fff1d6;color:#7a5200;border-radius:4px;padding:0 5px}.pp-moved{opacity:.85}.pp-old{display:none!important}
:root[data-theme=dark] .pp-panel{background:color-mix(in srgb,var(--card,#141a33) 94%,#6171C5 6%)}:root[data-theme=dark] .pp-expo tr.pp-hl td{background:#3a3214!important}
:root[data-theme=dark] .pp-lv-A{background:#26306b;color:#dfe4ff}:root[data-theme=dark] .pp-lv-B{background:#4a3b12;color:#ffe3a6}:root[data-theme=dark] .pp-lv-C{background:#4b1d34;color:#ffd0e6}
@media (max-width:760px){.pp-pane .pp-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.pp-div-row{grid-template-columns:96px 1fr 60px}.pp-div-row em{grid-column:2/4}.pp-interp dl{grid-template-columns:1fr}.pp-as-row{grid-template-columns:1fr}.pp-panel{padding:12px 10px}}
`;
function start() {
  if (!document.getElementById('pp-style')) { const s = el('style'); s.id = 'pp-style'; s.textContent = CSS; document.head.append(s); }
  // Chờ các module khác (power-visuals 300ms, power-hub 600ms sau load) dựng xong card để dời đúng chỗ.
  let n = 0; const t = setInterval(() => {
    const ready = block('dien-mix-today') && block('dien-oni-gauge') && block('dien-output-heatmap') && document.querySelector('.pv-hydro');
    if (ready || ++n > 40) { clearInterval(t); try { build(); } catch (e) { document.documentElement.dataset.ppError = 'build:' + e.message; console.error(e); } }
  }, 150);
}
if (document.readyState === 'complete') setTimeout(start, 700); else addEventListener('load', () => setTimeout(start, 700));
})();
