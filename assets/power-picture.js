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

/* ===================== 1b. Số bổ sung (12/11/2026): mức kéo dài, nước về từng hồ, kinh tế đơn vị, facts cho bộ quy tắc ===================== */
const PI = window.PowerInsights || null;
const FUEL = window.POWER_FUEL_PARAMS || {};
const fxM = typeof window.POWER_FX_MONTHLY === 'function' ? window.POWER_FX_MONTHLY() : new Map();
// Số tháng liên tiếp gần nhất (tối đa 3, tính từ tháng base) có tăng trưởng cùng dấu; dừng ở tháng thiếu số.
const sameSign3 = (fn, base = M) => { if (!base) return null; let n = 0, sign = 0; for (let k = 0; k < 3; k++) { const v = fn(addMonths(base, -k)); if (!fin(v) || v === 0) break; const s = Math.sign(v); if (k === 0) sign = s; if (s !== sign) break; n++; } return n; };
const yoyOf = (m, key) => { const c = monthCmp.get(m); return c?.ok ? (key ? c.get(key)?.yoy : c.yoy) : null; };
const fmpYoYOf = m => { const a = fmp.find(r => r.period === m), b = fmp.find(r => r.period === back(m + '-01').slice(0, 7)); return a && b ? (a.fmp / b.fmp - 1) * 100 : null; };
// So cùng kỳ theo quý (cùng ngày đối chiếu) để đặt cạnh BCTC quý của doanh nghiệp.
const quarterCmp = q => { const m = /^Q(\d)\/(\d{4})$/.exec(q || ''); if (!m) return null; const a = `${m[2]}-${String(m[1] * 3 - 2).padStart(2, '0')}`, b = `${m[2]}-${String(m[1] * 3).padStart(2, '0')}`; return compare(datesOf(a + '-01', b + '-' + dim(b))); };
// Nước về từng hồ: lệch so TB 5 năm của tháng hợp lệ gần nhất và so cùng kỳ đúng ngày (HYDRO_RESERVOIRS.yoy).
const resWater = (() => {
  const out = new Map(); if (!H?.monthly?.length) return out;
  const by = new Map(); H.monthly.forEach(r => { if (!by.has(r.reservoir)) by.set(r.reservoir, new Map()); by.get(r.reservoir).set(r.month, r); });
  const ok = r => r && r.inflow != null && r.days / r.expected >= .8 && r.inflow_n / r.expected >= .8;
  by.forEach((m, name) => {
    const months2 = [...m.keys()].sort().reverse();
    for (const mo of months2) { const c = m.get(mo); if (!ok(c)) continue; const y = +mo.slice(0, 4), mm = mo.slice(5), b = [];
      for (let k = y - 5; k < y; k++) { const x = m.get(k + '-' + mm); if (ok(x)) b.push(x.inflow); }
      const a = mean(b); if (b.length >= 3 && a > 0) { out.set(name, {dev5: (c.inflow / a - 1) * 100, month: mo}); break; } }
  });
  (H.yoy?.rows || []).filter(r => r.month === H.yoy.month).forEach(r => { const o = out.get(r.reservoir) || {}; out.set(r.reservoir, {...o, yoy: r.yoy, from: r.from, to: r.to}); });
  return out;
})();
// Kinh tế đơn vị: tháng gần nhất có đủ FMP, giá than/LNG World Bank và tỷ giá cùng tháng (đồng kỳ).
const unitM = (() => { const wb = new Map(rec('wb_energy_monthly').map(r => [r.date.slice(0, 7), r]));
  for (const r of [...fmp].reverse()) { const w = wb.get(r.period), x = fxM.get(r.period); if (w && x && fin(w.coal_au) && fin(w.lng_japan)) return {period: r.period, fmp: r.fmp, coalUsd: w.coal_au, lngUsd: w.lng_japan, fx: x.v, fxSrc: x.src}; }
  return null; })();
// Gọi lúc build (sau khi G, thermal ở mục 4 đã khai báo).
const makeFacts = () => ({
  today: new Date().toISOString().slice(0, 10), mLabel: M ? ml(M) : '—', fmpLabel: fmpLast ? ml(fmpLast.period) : '—', fuelParams: FUEL,
  dates: {daily: lastDay, month: M, fmp: fmpLast?.period, fuel: coal3?.date, oni: oniLast?.date, reservoir: H?.last_observation},
  demand: {yoy: CMP.m?.ok ? CMP.m.yoy : null, ytd: CMP.ytd?.ok ? CMP.ytd.yoy : null, energyYtd: CMP.ytd?.ok ? CMP.ytd.yoy : null, accelNow: accel?.now, accelBefore: accel?.before,
    sameSign3: sameSign3(m => yoyOf(m)), pmax: pmaxYtd?.cur.pmax, pmaxDate: pmaxYtd ? dm(pmaxYtd.cur.date) : null, pmaxYoY: pmaxYtd?.yoy},
  hydro: {yoy: G('hydro')?.yoy, ytd: G('hydro', 'ytd')?.yoy, sameSign3: sameSign3(m => yoyOf(m, 'hydro')), waterYoY: resYoY?.med, waterSpan: resYoY?.span, water5y: reservoir5y?.med,
    water5yMonth: reservoir5y?.month, oni: oniLast?.oni, oniSeason: oniLast ? oniLast.season + ' ' + oniLast.year : ''},
  dispatch: (() => { const t = thermal('ytd'), h = G('hydro', 'ytd'); return {thermalDpp: t ? t.coal.dpp + t.gas.dpp : null, hydroDpp: h?.dpp, thermalSameSign3: sameSign3(m => { const c = monthCmp.get(m); if (!c?.ok) return null; const a = c.get('coal'), b = c.get('gas'); return (a.cur + b.cur) / (a.prev + b.prev) * 100 - 100; }),
    coalYoY: G('coal')?.yoy, gasYoY: G('gas')?.yoy, reYoY: G('re')?.yoy}; })(),
  price: {fmp: fmpLast?.fmp, fmpYoY: fmpLast && fmpLy ? (fmpLast.fmp / fmpLy.fmp - 1) * 100 : null, fmpMoM: fmpLast && fmpPrev ? (fmpLast.fmp / fmpPrev.fmp - 1) * 100 : null,
    fmpSameSign3: fmpLast ? sameSign3(fmpYoYOf, fmpLast.period) : null, coal3: coal3?.pct, jkm3: jkm3?.pct, hh3: hh3?.pct}
});

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

/* ===================== 3b. Khung 3 lớp và card phân tích (12/11/2026) ===================== */
// Trạng thái dữ liệu, tách khỏi mức kết luận A/B/C.
const STN = {Verified: 'Đã xác minh', Estimated: 'Ước tính', Scenario: 'Kịch bản', Insufficient: 'Thiếu dữ liệu', Stale: 'Dữ liệu cũ'};
const STT = {Verified: 'Số từ nguồn công bố hoặc tính trực tiếp từ nguồn đó', Estimated: 'Ước tính từ giả định nêu kèm (suất hao nhiệt, tỷ giá…)', Scenario: 'Kịch bản, không phải số thực tế', Insufficient: 'Chưa đủ dữ liệu để kết luận', Stale: 'Dữ liệu đã cũ so với tần suất công bố'};
const chip = s => `<span class="pp-st pp-st-${s}" title="${esc(STT[s])}">${STN[s]}</span>`;
const legend = () => el('details', 'pp-legend', `<summary>ⓘ Cách đọc nhãn</summary><div>${['A', 'B', 'C'].map(l => `${tag(l)} ${esc(LV[l][1])}`).join('<br>')}<br>${Object.keys(STN).map(k => `${chip(k)} ${esc(STT[k])}`).join('<br>')}<br><span class="muted">Màu trên KPI chỉ hướng tăng/giảm của chỉ tiêu, không phải tốt hay xấu cho cổ phiếu: cùng một biến (sản lượng, giá nhiên liệu, FMP) có tác động ngược nhau giữa các nhóm nguồn.</span></div>`);
// Kết luận chính của sub-tab: trả lời câu hỏi trung tâm, sinh theo quy tắc.
const take = (text, lvl = 'B', st = 'Verified') => el('div', 'pp-take', `<span class="pp-take-k">Kết luận chính</span><p>${tag(lvl)} ${chip(st)} ${text}</p>`);
const metric = (label, value, sub) => `<span class="pp-m"><b>${value}</b><small>${esc(label)}${sub ? ' · ' + esc(sub) : ''}</small></span>`;
// Panel 3 lớp: (1) câu hỏi · kết luận ≤2 câu · 2–3 chỉ tiêu · ý nghĩa  (2) chart chính + tối đa 1 chart phụ  (3) Khám phá dữ liệu · Nghiên cứu sâu (thu gọn).
function qpanel(o) {
  const p = el('section', 'pp-panel pp-q'); p.id = 'pp-' + o.id;
  p.innerHTML = `<header class="pp-ph"><span class="pp-num">${esc(o.num)}</span><div><h3>${esc(o.q)}</h3>` +
    `<p class="pp-concl">${tag(o.lv || 'B')} ${chip(o.st || 'Verified')} ${o.concl || '<span class="muted">Chưa đủ dữ liệu để kết luận.</span>'}</p>` +
    (o.metrics?.length ? `<div class="pp-metrics">${o.metrics.filter(Boolean).map(m => metric(...m)).join('')}</div>` : '') +
    (o.impl ? `<p class="pp-impl"><b>Ý nghĩa:</b> ${o.impl}</p>` : '') + `</div></header>`;
  [].concat(o.main || []).filter(Boolean).forEach(n => { const w = el('div', 'pp-main'); w.append(n); p.append(w); });
  if (o.support) { const w = el('div', 'pp-sup1'); w.append(o.support); p.append(w); }
  [].concat(o.body || []).filter(Boolean).forEach(n => p.append(n));
  const ex = [].concat(o.explore || []).filter(Boolean);
  if (ex.length) { const d = el('details', 'research-fold pp-drill pp-explore'); d.append(el('summary', '', `Khám phá dữ liệu · ${ex.length} mục`)); const g = el('div', 'pp-drill-body'); ex.forEach(n => g.append(n)); d.append(g); d.addEventListener('toggle', () => d.open && refit(d)); p.append(d); }
  if (o.deep) {
    const d = el('details', 'pp-deep');
    d.innerHTML = `<summary>Nghiên cứu sâu · cơ chế, điều làm đổi nhận định, phương pháp, giới hạn</summary><dl>${[['Kênh truyền dẫn', o.deep.mech], ['Hàm ý đầu tư (có điều kiện)', o.deep.impl], ['Điều làm thay đổi nhận định', o.deep.change], ['Phương pháp & nguồn', o.deep.method], ['Giới hạn', o.deep.limits]].filter(x => x[1]).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
    [].concat(o.deep.nodes || []).filter(Boolean).forEach(n => d.append(n));
    d.addEventListener('toggle', () => d.open && refit(d));
    p.append(d);
  }
  return p;
}
const tableCard = (id, head, rows, opts = {}) => { const c = el('div', 'card pp-tcard'); if (id) c.dataset.blockId = id; c.innerHTML = `${opts.title ? `<div class="chart-title">${esc(opts.title)}</div>` : ''}${opts.sub ? `<div class="chart-sub">${opts.sub}</div>` : ''}<div class="tablewrap"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${opts.note ? `<p class="source-note">${opts.note}</p>` : ''}`; return c; };
const ul = items => `<ul class="pp-ul">${items.filter(Boolean).map(x => `<li>${x}</li>`).join('')}</ul>`;
const dirTxt = (v, d = 1) => !fin(v) ? '—' : `${v > 0 ? '▲' : v < 0 ? '▼' : '■'} ${pc(v, d)}`;

// 1.3 Bảng áp lực nhu cầu: 5 chỉ báo, không gộp thành điểm.
function demandPressureCard() {
  const lfLast = [...months].reverse().find(m => m.m <= M && m.lf != null), lfLy = lfLast && monthBy.get(back(lfLast.m + '-01').slice(0, 7));
  const gap = fin(pmaxYtd?.yoy) && CMP.ytd?.ok ? pmaxYtd.yoy - CMP.ytd.yoy : null;
  return tableCard('dien-pp-demand-pressure', ['Chỉ báo', 'Giá trị', 'Kỳ', 'So với', 'Cách đọc'], [
    ['Tăng trưởng điện năng', dirTxt(CMP.m?.ok ? CMP.m.yoy : null), M ? ml(M) : '—', 'cùng tháng năm trước, cùng ngày đối chiếu', 'Áp lực đáp ứng tổng điện năng (nhiên liệu, nước)'],
    ['Động lượng 3 tháng', accel ? `${pc(accel.now)} so ${pc(accel.before)}` : '—', M ? `${ms(addMonths(M, -2))}–${ms(M)}` : '—', '3 tháng liền trước', 'Tăng tốc khi chênh > +1 đ.p., giảm tốc khi < −1 đ.p.'],
    ['Tăng trưởng phụ tải đỉnh (Pmax)', dirTxt(pmaxYtd?.yoy), pmaxYtd ? 'đỉnh từ đầu năm ' + dm(pmaxYtd.cur.date) : '—', 'đỉnh cùng khoảng năm trước', 'Áp lực công suất giờ cao điểm'],
    ['Hệ số phụ tải', lfLast ? nf(lfLast.lf, 1) + '%' : '—', lfLast ? ml(lfLast.m) : '—', lfLy?.lf != null ? `cùng kỳ ${nf(lfLy.lf, 1)}% (${pp(lfLast.lf - lfLy.lf)})` : '—', 'Giảm khi đỉnh tăng nhanh hơn điện năng bình quân'],
    ['Chênh tăng trưởng đỉnh − điện năng', fin(gap) ? pp(gap) : '—', 'từ đầu năm', '—', 'Dương: đỉnh tăng nhanh hơn; âm: điện năng tăng nhanh hơn']
  ], {title: 'Bảng áp lực nhu cầu', sub: 'năm chỉ báo đọc riêng, không gộp thành một thang điểm vì chưa có ngưỡng được kiểm định', note: `Nguồn: ${link(EVN_URL, 'EVN · bản tin vận hành ngày')}; tự tính.`});
}
// Đối chiếu lũy kế công bố (thẻ KPI tĩnh) với tổng bản tin ngày.
function reconcileCard(tile) {
  const lab = tile?.querySelector('.label')?.textContent || '', m = /(\d+)T\/(\d{4})/.exec(lab), val = parseFloat((tile?.querySelector('.value')?.textContent || '').replace(/\./g, '').replace(',', '.')), dl = /([\d,]+)%/.exec(tile?.querySelector('.delta')?.textContent || '');
  if (!m) return null;
  const y = m[2], end = `${y}-${String(m[1]).padStart(2, '0')}`, ds = datesOf(y + '-01-01', end + '-' + dim(end));
  const cur = ds.map(d => byDay.get(d)).filter(Boolean), sumOut = sum(cur.map(d => d.out)) / 1000, prevDs = datesOf((y - 1) + '-01-01', (y - 1) + end.slice(4) + '-' + dim((y - 1) + end.slice(4)));
  const prev = prevDs.map(d => byDay.get(d)).filter(Boolean), naive = prev.length ? (sum(cur.map(d => d.out)) / sum(prev.map(d => d.out)) - 1) * 100 : null, same = compare(ds);
  const offYoY = dl ? parseFloat(dl[1].replace(',', '.')) : null;
  return tableCard('dien-pp-demand-reconcile', ['Cách đo', 'Sản lượng (tỷ kWh)', 'Tăng trưởng', 'Số ngày', 'Ghi chú'], [
    [`EVN công bố lũy kế ${m[1]}T/${y}`, nf(val, 1), fin(offYoY) ? '+' + nf(offYoY, 1) + '%' : '—', '—', 'Số chính thức (thẻ KPI, nguồn ghi ở thẻ)'],
    ['Cộng bản tin vận hành ngày', nf(sumOut, 1), pc(naive), `${cur.length}/${ds.length}`, 'So tổng các ngày có bản tin hai năm (số ngày có thể khác nhau)'],
    ['Cộng bản tin, cùng ngày đối chiếu', nf(same.curT / 1000, 1), pc(same.yoy), `${same.n}/${same.total}`, 'Chỉ các ngày có bản tin đủ nguồn ở cả hai năm (cách tính dùng trên tab này)']
  ], {title: 'Đối chiếu số lũy kế công bố với tổng bản tin ngày', note: 'Chênh lệch đến từ ngày thiếu bản tin, số ngày ước tính trong bản tin và việc EVN hiệu chỉnh số năm trước khi công bố lũy kế; hai cách đo không thay thế nhau. KPI và nhận định tự động trên tab dùng cách thứ ba.'});
}
// 2.3 Phơi nhiễm thủy văn theo doanh nghiệp (thay bảng ánh xạ hồ cũ, giữ block-id).
function hydroExposure(card) {
  const A = window.POWER_HYDRO_ASSETS, rows = A?.rows || [], basins = A?.basins || {};
  const region = Object.fromEntries((H?.monthly || []).map(r => [r.reservoir, r.region]));
  const wcell = name => { const w = resWater.get(name); if (!w) return '<span class="muted">—</span>'; return `${w.yoy != null ? `<span class="${w.yoy < 0 ? 'dn' : 'up'}">${pc(w.yoy, 0)}</span> cùng kỳ` : 'cùng kỳ: —'}<br><small>${w.dev5 != null ? `${pc(w.dev5, 0)} so TB 5 năm (${ms(w.month)})` : ''}</small>`; };
  // Gom hồ theo nhà máy (Vĩnh Sơn A/B/C → một nhà máy 66 MW).
  const plants = new Map(); rows.forEach(r => { const k = r.plant || r.reservoir; const p = plants.get(k) || {plant: k, mw: r.plant_mw, res: [], holders: r.holders || [], status: r.status, owner: r.owner, sources: r.sources || []}; p.res.push(r.reservoir); plants.set(k, p); });
  const conf = s => s === 'Đã xác minh' ? chip('Verified') : `<span class="pp-st pp-st-Estimated" title="Nguồn nêu đơn vị quản lý nhưng liên kết hồ ↔ nhà máy hoặc niêm yết của đơn vị mẹ chưa đủ chắc">Xác minh một phần</span>`;
  const tickers = [...new Set([...plants.values()].flatMap(p => p.holders.map(h => h.ticker)))];
  const order = ['VSH', 'REE', 'TMP', 'SBH', 'TBC', 'AVC', 'DNH', 'PGV', 'GE2', ...tickers];
  const comp = [...new Set(order)].filter(t => tickers.includes(t)).map(t => {
    const ps = [...plants.values()].filter(p => p.holders.some(h => h.ticker === t)).map(p => ({...p, h: p.holders.find(h => h.ticker === t)}));
    const known = ps.filter(p => fin(p.mw)), econ = known.filter(p => fin(p.h.share)), missing = ps.length - econ.length;
    const nominal = sum(known.filter(p => p.h.share === 1).map(p => p.mw)), economic = sum(econ.map(p => p.mw * p.h.share));
    const bs = {}; econ.forEach(p => p.res.forEach(r => { const b = basins[r]; if (b) bs[b] = (bs[b] || 0) + p.mw * p.h.share / p.res.length; }));
    const top = Object.entries(bs).sort((a, b) => b[1] - a[1]), totB = sum(top.map(x => x[1]));
    const yoys = ps.flatMap(p => p.res.map(r => resWater.get(r)?.yoy)).filter(fin);
    return [`<b>${t}</b>`, ps.map(p => `${esc(p.plant)}${p.h.share === 1 ? '' : ` <small class="muted">(${fin(p.h.share) ? nf(p.h.share * 100, 1) + '%' : 'tỷ lệ chưa xác minh'})</small>`}`).join('<br>'),
      top.length ? top.map(([b, v]) => `${esc(b)} ${nf(v / totB * 100, 0)}%`).join('<br>') : '—',
      nominal ? nf(nominal, 0) : '—', `${economic ? nf(economic, 1) : '—'}${missing ? `<br><small class="muted">chưa gồm ${missing} nhà máy thiếu MW hoặc tỷ lệ</small>` : ''}`,
      yoys.length ? `trung vị ${pc(median(yoys), 0)} cùng kỳ (${yoys.length} hồ)` : (d5 => d5.length ? `trung vị ${pc(median(d5), 0)} so TB 5 năm <small class="muted">(chưa có số cùng kỳ)</small>` : '<span class="muted">chưa có số</span>')(ps.flatMap(p => p.res.map(r => resWater.get(r)?.dev5)).filter(fin)), ps.every(p => p.status === 'Đã xác minh') ? chip('Verified') : conf('partial')];
  });
  ['CHP', 'SHP', 'SBA', 'HDG'].filter(t => !tickers.includes(t)).forEach(t => comp.push([`<b>${t}</b>`, '<span class="muted">Không có hồ trong danh sách hồ EVN; chưa xác minh vị trí, công suất từng nhà máy</span>', '—', '—', '—', '<span class="muted">không quan sát được</span>', chip('Insufficient')]));
  const plantRows = [...plants.values()].sort((a, b) => (region[a.res[0]] || '').localeCompare(region[b.res[0]] || '', 'vi')).map(p => [esc(p.plant) + (p.res.length > 1 || p.res[0] !== p.plant ? `<br><small class="muted">hồ: ${p.res.map(esc).join(', ')}</small>` : ''), esc(basins[p.res[0]] || '—'), fin(p.mw) ? nf(p.mw, 0) : '—',
    esc(p.owner || '') + (p.holders.length ? `<br><small>${p.holders.map(h => `${esc(h.ticker)} ${fin(h.share) ? nf(h.share * 100, 2) + '%' : 'tỷ lệ chưa xác minh'}`).join(' · ')}</small>` : ''), p.res.map(wcell).join('<hr class="pp-hr">'), conf(p.status),
    p.sources.slice(0, 3).map((s, i) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.quote || '')}">[${i + 1}]</a>`).join(' ')]);
  const unver = (H?.monthly ? [...new Set(H.monthly.map(r => r.reservoir))] : []).filter(n => !rows.some(r => r.reservoir === n));
  card.innerHTML = `<div class="chart-title">Phơi nhiễm thủy văn theo doanh nghiệp niêm yết</div><div class="chart-sub">công suất danh nghĩa (doanh nghiệp sở hữu nhà máy) tách khỏi công suất sở hữu kinh tế (MW × tỷ lệ sở hữu) · nước về tại hồ cấp nước cho nhà máy</div>
    <div class="tablewrap"><table><thead><tr><th>Doanh nghiệp</th><th>Nhà máy (tỷ lệ nếu gián tiếp)</th><th>Lưu vực (tỷ trọng MW kinh tế)</th><th>MW danh nghĩa</th><th>MW sở hữu kinh tế</th><th>Điều kiện nước</th><th>Độ tin cậy</th></tr></thead><tbody>${comp.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <details class="dtable"><summary>Chi tiết từng nhà máy (${plants.size}) · nguồn từng dòng</summary><div class="tablewrap"><table><thead><tr><th>Nhà máy</th><th>Lưu vực</th><th>MW</th><th>Sở hữu</th><th>Nước về</th><th>Độ tin cậy</th><th>Nguồn</th></tr></thead><tbody>${plantRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>
    <p class="source-note">${esc(A?.basin_note || '')} ${esc(A?.holders_note || '')} ${unver.length} hồ EVN chưa xác minh chủ sở hữu (chủ yếu nhà máy lớn của EVN và các tổng công ty phát điện): ${unver.map(esc).join(', ')}. Không quy đổi % nước về thành % EBITDA; nước về một hồ không đại diện cho mọi nhà máy cùng khu vực.</p>`;
}
// 3.2 Vì sao nguồn được huy động: các động lực quan sát được và chưa quan sát được.
function driversCard() {
  const y = CMP.ytd, h = y?.ok ? y.get('hydro') : null, c = y?.ok ? y.get('coal') : null, g = y?.ok ? y.get('gas') : null;
  return tableCard('dien-pp-dispatch-drivers', ['Động lực', 'Quan sát trên trang', 'Kỳ', 'Trạng thái'], [
    ['Nhu cầu', y?.ok ? `điện năng ${sg(y.delta, 0)} triệu kWh (${pc(y.yoy)})` : '—', PERIODS.ytd?.name || '—', chip(y?.ok ? 'Verified' : 'Insufficient')],
    ['Thủy văn', h ? `thủy điện ${sg(h.delta, 0)} triệu kWh (${pc(h.yoy)}); nước về ${pc(resYoY?.med, 0)} cùng kỳ (${resYoY?.span || '—'})` : '—', PERIODS.ytd?.name || '—', chip(h ? 'Verified' : 'Insufficient')],
    ['Nguồn bù', c && g ? `than ${sg(c.delta, 0)}, khí & dầu ${sg(g.delta, 0)} triệu kWh` : '—', PERIODS.ytd?.name || '—', chip(c ? 'Verified' : 'Insufficient')],
    ['Giá nhiên liệu', `Newcastle ${pc(coal3?.pct)}, JKM ${pc(jkm3?.pct)} (3 tháng)`, coal3 ? 'đến ' + dm(coal3.date) : '—', chip('Verified')],
    ['Giá chào, thứ tự huy động', 'Chưa có dữ liệu chào giá theo nhà máy', '—', chip('Insufficient')],
    ['Ràng buộc kỹ thuật, truyền tải', 'Chưa có dữ liệu bảo dưỡng, sự cố, nghẽn lưới', '—', chip('Insufficient')],
    ['Hợp đồng, cơ chế điều độ', 'Chưa có Qc và lịch huy động theo hợp đồng của từng nhà máy', '—', chip('Insufficient')]
  ], {title: 'Động lực huy động', sub: 'chỉ ghi động lực có số trên trang; phần còn lại để trạng thái thiếu dữ liệu'});
}
// 3.3 Từ huy động tới lợi nhuận: hệ thống (EVN) đặt cạnh BCTC quý cùng kỳ của doanh nghiệp.
const SEG = [['Thủy điện', 'hydro', ['REE', 'VSH', 'CHP', 'SBA', 'TMP', 'SHP']], ['Nhiệt điện than & khí', 'thermal', ['POW', 'NT2', 'PPC', 'QTP', 'HND', 'BTP']], ['Gió & mặt trời', 're', ['GEG', 'HDG', 'TTA']]];
function listedCard() {
  const Q = window.COMPANY_QUARTERLY; if (!Q?.companies) return gap('chưa nạp được BCTC quý doanh nghiệp.');
  const by = Object.fromEntries(Q.companies.filter(c => c.sector === 'power').map(c => [c.symbol, c])), qs = Q.quarters || [];
  const lastIdx = a => { for (let i = (a || []).length - 1; i >= 0; i--) if (a[i] != null) return i; return -1; };
  const rows = [], qset = new Set();
  SEG.forEach(([seg, k, codes]) => codes.forEach((t, j) => {
    const c = by[t]; if (!c) return; const i = lastIdx(c.revenue); if (i < 4) return; const q = qs[i]; qset.add(q);
    const qc = quarterCmp(q), sys = qc?.ok ? (k === 'thermal' ? (() => { const a = qc.get('coal'), b = qc.get('gas'); return (a.cur + b.cur) / (a.prev + b.prev) * 100 - 100; })() : qc.get(k)?.yoy) : null;
    const rv = c.revenue[i] && c.revenue[i - 4] ? (c.revenue[i] / c.revenue[i - 4] - 1) * 100 : null, gm = fin(c.gross_margin?.[i]) && fin(c.gross_margin?.[i - 4]) ? c.gross_margin[i] - c.gross_margin[i - 4] : null;
    const ni0 = c.net_income?.[i - 4], ni = c.net_income?.[i], niY = fin(ni) && fin(ni0) && ni0 > 0 ? (ni / ni0 - 1) * 100 : null;
    const read = [fin(sys) ? (sys > 0 ? 'huy động nhóm tăng' : 'huy động nhóm giảm') : null, fin(rv) ? (rv > 0 ? 'doanh thu tăng' : 'doanh thu giảm') : null, fin(gm) ? (gm > 0 ? 'biên gộp tăng' : 'biên gộp giảm') : null, fin(niY) ? (niY > 0 ? 'LNST tăng' : 'LNST giảm') : fin(ni) && fin(ni0) ? 'LNST đổi dấu' : null].filter(Boolean).join(', ');
    rows.push([j ? '' : `<b>${seg}</b>`, j ? '' : `${dirTxt(sys)} <small class="muted">${q}</small>`, `<b>${t}</b>`, dirTxt(rv), fin(gm) ? `${nf(c.gross_margin[i], 1)}% (${pp(gm)})` : '—', fin(niY) ? dirTxt(niY) : fin(ni) && fin(ni0) ? `${nf(ni0, 0)} → ${nf(ni, 0)} tỷ` : '—', read]);
  }));
  return tableCard('dien-pp-listed', ['Nhóm', 'Huy động hệ thống (EVN)', 'Mã', 'Doanh thu YoY', 'Biên gộp (Δ YoY)', 'LNST YoY', 'Đọc'], rows,
    {title: 'Huy động ≠ doanh thu ≠ biên ≠ lợi nhuận', sub: `bốn kết luận khác nhau, đặt cạnh nhau cùng quý (${[...qset].join(', ')}) · huy động hệ thống so cùng kỳ trên cùng ngày đối chiếu`, note: `BCTC: ${esc(Q.source || 'VNDirect')} · đơn vị ${esc(Q.unit || 'tỷ đồng')}. Doanh nghiệp có nhiều mảng (REE, HDG…) nên doanh thu không chỉ từ phát điện; số hợp nhất, không tách theo nhà máy.`});
}
const checklistCard = () => tableCard('dien-pp-fin-checklist', ['Cần kiểm', 'Vì sao', 'Có trên trang?'], [
  ['Giá thực nhận', 'FMP chỉ áp cho phần ngoài Qc; phần Qc theo giá hợp đồng', chip('Insufficient')],
  ['Chi phí nhiên liệu', 'Quyết định spread của nhiệt điện; than nội và nhập khác nhau', chip('Estimated') + ' benchmark (04)'],
  ['Qc', 'Qc cao thì lợi ích từ FMP nhỏ, rủi ro giá thị trường nhỏ', chip('Insufficient')],
  ['Biên năng lượng', 'Giá thực nhận − chi phí biến đổi', chip('Estimated') + ' minh họa (04)'],
  ['Khấu hao, chi phí cố định', 'Sản lượng cao hơn trải chi phí cố định trên nhiều kWh hơn', chip('Insufficient')],
  ['Khả năng cung ứng nhiên liệu', 'Thiếu khí, than làm giới hạn huy động dù được gọi', chip('Insufficient')],
  ['Nhà máy mới hay cũ', 'Nhà máy mới khấu hao lớn, lãi vay cao; nhà máy cũ biên khác', chip('Insufficient')]
], {title: 'Checklist truyền dẫn tài chính', sub: 'khi một nhóm nguồn tăng huy động; chưa đủ đầu vào thì không định lượng tác động lợi nhuận'});
// 4.1 Hệ thống giá: định nghĩa và trạng thái dữ liệu.
const priceDefsCard = () => tableCard('dien-pp-price-defs', ['Loại giá', 'Là gì', 'Không phải', 'Trên trang'], [
  ['FMP', 'Giá thị trường toàn phần theo chu kỳ giao dịch (SMP + CAN), bình quân tháng', 'Giá bán thực nhận của nhà máy', fmpLast ? `${chip('Verified')} đến ${ml(fmpLast.period)}` : chip('Insufficient')],
  ['SMP', 'Giá điện năng thị trường', 'FMP − CAN tháng (không suy ngược từ CAN năm)', chip('Insufficient')],
  ['CAN', 'Giá công suất thị trường, bình quân năm', 'Giá từng tháng', chip('Verified') + ' theo năm'],
  ['Giá PPA', 'Giá trong hợp đồng mua bán điện từng nhà máy (cố định + biến đổi)', 'Giá trần khung giá phát điện', chip('Insufficient')],
  ['Giá thực nhận', 'Doanh thu điện ÷ sản lượng bán của nhà máy', 'FMP', chip('Insufficient')],
  ['Giá nhiên liệu', 'Benchmark quốc tế (World Bank, ICE) và mốc khung giá trong nước', 'Giá nhiên liệu theo hợp đồng của nhà máy', chip('Verified') + ' benchmark']
], {title: 'Hệ thống giá điện: đọc đúng từng loại'});
// 4.2 Kinh tế đơn vị theo công nghệ (minh họa).
function unitEconCard() {
  const P = FUEL, u = unitM;
  if (!u || !fin(P.HR_COAL)) return gap('thiếu FMP, giá nhiên liệu hoặc tỷ giá cùng tháng để tính chi phí nhiên liệu/kWh.');
  const PI2 = window.PowerInsights || {}, ci = PI2.coalCost?.(u.coalUsd, u.fx, P.HR_COAL, P.HHV_NC), cd = PI2.coalCostVnd?.(P.COAL_DOM, P.HR_COAL, P.HHV_DOM), gd = PI2.gasCost?.(P.GAS_USD, P.FEE_USD, P.HR_GAS, P.FX_QD), lg = PI2.gasCost?.(u.lngUsd, P.FEE_USD, P.HR_GAS, u.fx);
  const ref = `FMP ${ml(u.period)}: ${nf(u.fmp, 0)}`, row = (tech, fuel, basis, st, note) => [tech, ref, fin(fuel) ? nf(fuel, 0) : fuel, fin(fuel) ? `≥ ${nf(fuel, 0)}` : '—', fin(fuel) ? `<b class="${u.fmp - fuel >= 0 ? 'up' : 'dn'}">${sg(u.fmp - fuel, 0)}</b>` : '—', basis + (note ? `<br><small class="muted">${note}</small>` : ''), chip(st)];
  return tableCard('dien-pp-unit-econ', ['Công nghệ', 'Giá điện tham chiếu (đ/kWh)', 'Nhiên liệu (đ/kWh)', 'Chi phí biến đổi (đ/kWh)', 'Spread minh họa', 'Cơ sở số liệu', 'Trạng thái'], [
    row('Than nhập khẩu', ci, `đồng kỳ ${ml(u.period)}: than Úc WB ${nf(u.coalUsd, 1)} USD/t × tỷ giá ${nf(u.fx, 0)} (${u.fxSrc}) × ${nf(P.HR_COAL, 1)} kcal/kWh ÷ ${nf(P.HHV_NC, 0)} kcal/kg`, 'Estimated', 'nhiệt trị cơ sở chỉ số Newcastle (NAR); giá về nhà máy còn cước, phí'),
    row('Than nội địa', cd, `mốc giá than khung giá 2026 ${nf(P.COAL_DOM, 0)} đ/t, ${nf(P.HHV_DOM, 2)} kcal/kg`, 'Estimated', `phi đồng kỳ: mốc năm 2026 đặt cạnh FMP ${ml(u.period)}`),
    row('Điện khí nội địa', gd, `mốc khí khung giá 2026 ${nf(P.GAS_USD, 2)} + ${nf(P.FEE_USD, 2)} USD/MMBtu × ${nf(P.HR_GAS, 2)} BTU/kWh × ${nf(P.FX_QD, 0)}`, 'Estimated', `phi đồng kỳ: mốc năm 2026 và tỷ giá trong quyết định; khí mỏ theo hợp đồng bao tiêu`),
    row('LNG', lg, `đồng kỳ ${ml(u.period)}: LNG Nhật WB ${nf(u.lngUsd, 2)} + ${nf(P.FEE_USD, 2)} USD/MMBtu × ${nf(P.HR_GAS, 2)} BTU/kWh × tỷ giá ${nf(u.fx, 0)}`, 'Estimated', 'giá LNG nhập Nhật là proxy, không phải giá hợp đồng của Nhơn Trạch 3 & 4'),
    ['Thủy điện', ref, '0', '<span class="muted">thuế tài nguyên nước, phí dịch vụ môi trường rừng: chưa có số</span>', '—', 'Không tốn nhiên liệu; lợi nhuận theo sản lượng × giá thực nhận', chip('Insufficient')],
    ['Gió, mặt trời', '<span class="muted">không bán theo FMP (FIT/hợp đồng)</span>', '0', '—', '—', 'Giá cố định theo hợp đồng; lợi nhuận theo sản lượng thực phát, cắt giảm', chip('Insufficient')]
  ], {title: 'Kinh tế đơn vị theo công nghệ (minh họa)', sub: 'Spread năng lượng = giá điện tham chiếu − chi phí biến đổi ước tính · đ/kWh · không phải biên gộp, EBITDA hay lợi nhuận doanh nghiệp',
    note: 'Chi phí biến đổi mới tính phần nhiên liệu (chưa gồm vận hành biến đổi, vận chuyển), nên là cận dưới. Tham số suất hao nhiệt, nhiệt trị, mốc giá than/khí theo khung giá phát điện 2026 (QĐ 1692, 1882; nguồn ở card spread). Chuyển đổi: 1 MMBtu = 10⁶ BTU; than: USD/t × tỷ giá ÷ 1.000 = đ/kg; × kcal/kWh ÷ kcal/kg = kg/kWh.'});
}
// 4.3 Máy tính kịch bản.
function calcCard() {
  const P = FUEL, u = unitM, c = el('div', 'card pp-calc'); c.dataset.blockId = 'dien-pp-calc';
  const presets = {coal: {label: 'Than nhập khẩu', fuel: u?.coalUsd, unit: 'USD/tấn', hr: P.HR_COAL, hru: 'kcal/kWh', hhv: P.HHV_NC, fee: 0}, lng: {label: 'LNG', fuel: u?.lngUsd, unit: 'USD/MMBtu', hr: P.HR_GAS, hru: 'BTU/kWh', fee: P.FEE_USD}, gas: {label: 'Khí nội địa', fuel: P.GAS_USD, unit: 'USD/MMBtu', hr: P.HR_GAS, hru: 'BTU/kWh', fee: P.FEE_USD}};
  const base = k => ({...presets[k], fmp: u?.fmp, fx: k === 'gas' ? P.FX_QD : u?.fx, market: 35});
  let tech = 'coal';
  const field = (k, label, v, step) => `<label>${label}<input type="number" step="${step}" data-k="${k}" value="${fin(v) ? Math.round(v * 100) / 100 : ''}"></label>`;
  const draw = () => {
    const b = base(tech);
    c.innerHTML = `<div class="chart-title">Máy tính kịch bản: chi phí nhiên liệu và spread năng lượng</div><div class="chart-sub">${chip('Scenario')} giá trị mặc định lấy từ dữ liệu ${u ? ml(u.period) : '—'} và tham số khung giá 2026 · chỉnh ô để xem độ nhạy · không phải lợi nhuận của POW, NT2, PPC, QTP</div>
      <div class="pp-ctl" role="group">${Object.entries(presets).map(([k, p]) => `<button type="button" data-t="${k}" aria-pressed="${k === tech}">${p.label}</button>`).join('')}</div>
      <div class="pp-form">${field('fuel', `Giá nhiên liệu (${b.unit})`, b.fuel, 0.1)}${tech !== 'coal' ? field('fee', 'Phí tái hóa khí, vận chuyển (USD/MMBtu)', b.fee, 0.01) : field('hhv', 'Nhiệt trị than (kcal/kg)', b.hhv, 10)}${field('hr', `Suất hao nhiệt (${b.hru})`, b.hr, 1)}${field('fx', 'Tỷ giá (VND/USD)', b.fx, 10)}${field('fmp', 'Giá điện tham chiếu FMP (đ/kWh)', b.fmp, 1)}${field('market', 'Phần sản lượng ngoài hợp đồng (%)', b.market, 1)}</div>
      <div class="pp-out"></div><p class="source-note">Công thức: than = giá × tỷ giá ÷ 1.000 × suất hao ÷ nhiệt trị; khí/LNG = (giá + phí) × suất hao ÷ 10⁶ × tỷ giá. Spread = FMP − chi phí nhiên liệu (chưa gồm chi phí biến đổi khác). "Phần ngoài hợp đồng" là giả định của người dùng (35% chỉ là giá trị gợi ý), không phải tỷ lệ Qc thực tế của nhà máy nào.</p>`;
    const out = c.querySelector('.pp-out'), I = window.PowerInsights;
    const calc = () => { const v = Object.fromEntries([...c.querySelectorAll('input')].map(x => [x.dataset.k, parseFloat(x.value)])); const r = I?.scenario({tech: tech === 'coal' ? 'coal' : 'gas', fuel: v.fuel, fee: v.fee, fx: v.fx, hr: v.hr, hhv: v.hhv, fmp: v.fmp, market: v.market});
      const r0 = I?.scenario({tech: tech === 'coal' ? 'coal' : 'gas', fuel: b.fuel, fee: b.fee, fx: b.fx, hr: b.hr, hhv: b.hhv, fmp: b.fmp, market: b.market});
      out.innerHTML = r ? `<div class="pp-metrics">${metric('Chi phí nhiên liệu', nf(r.cost, 0) + ' đ/kWh', fin(r0?.cost) ? 'mặc định ' + nf(r0.cost, 0) : '')}${metric('Spread năng lượng minh họa', `<span class="${r.spread >= 0 ? 'up' : 'dn'}">${sg(r.spread, 0)}</span> đ/kWh`, fin(r0?.spread) ? 'thay đổi ' + sg(r.spread - r0.spread, 0) : '')}${metric('Spread × phần ngoài hợp đồng', sg(r.marketSpread, 0) + ' đ/kWh phát', 'bình quân trên mỗi kWh')}</div>` : gap('nhập đủ các ô').outerHTML; };
    c.querySelectorAll('input').forEach(x => x.addEventListener('input', calc));
    c.querySelectorAll('[data-t]').forEach(x => x.addEventListener('click', () => { tech = x.dataset.t; draw(); }));
    calc();
  };
  draw();
  return c;
}
const qcFlowCard = () => { const c = el('div', 'card pp-flow'); c.dataset.blockId = 'dien-pp-qc-flow';
  c.innerHTML = `<div class="chart-title">FMP tăng thì ai hưởng lợi, đến mức nào?</div><div class="pp-flow-row">${['FMP ↑', 'Sản lượng thực phát của nhà máy', 'Trừ phần Qc (thanh toán theo giá hợp đồng)', 'Phần ngoài Qc × (FMP − chi phí biến đổi)', 'Điều khoản PPA, chuyển ngang nhiên liệu', 'Biên năng lượng của nhà máy'].map((t, i) => `${i ? '<span class="pp-arrow" aria-hidden="true">→</span>' : ''}<div class="pp-flow-box">${t}</div>`).join('')}</div>
    <p class="research-caption"><b>Không mặc định:</b> Qc là tỷ lệ cố định của sản lượng thực phát; giá PPA bất biến; giá nhiên liệu luôn được chuyển ngang toàn bộ; FMP cao nghĩa là biên lợi nhuận cao. Nhà máy có PPA đặc thù (BOT, LNG Qc dài hạn) theo cơ chế riêng.</p>
    <p class="research-caption"><b>Khi nào FMP cao nhưng lợi nhuận vẫn thấp:</b> Qc chiếm phần lớn sản lượng; chi phí nhiên liệu tăng nhanh hơn FMP; nhà máy ít được huy động; chi phí cố định, lãi vay lớn. <b>Khi nào tăng sản lượng cải thiện hiệu quả:</b> chi phí cố định (khấu hao, lãi vay) trải trên nhiều kWh hơn khi biên năng lượng dương.</p>`; return c; };
// 5.3 Luồng truyền dẫn tài chính EVN (có điều kiện).
const evnFlowCard = () => { const c = el('div', 'card pp-flow'); c.dataset.blockId = 'dien-pp-evn-flow';
  const steps = [['Giá bán lẻ và sản lượng tiêu thụ', tariffVals ? 'Verified' : 'Insufficient'], ['Doanh thu EVN', 'Insufficient'], ['Chi phí mua điện và vận hành hệ thống', 'Insufficient'], ['Khả năng tạo tiền', 'Insufficient'], ['Nghĩa vụ thanh toán tiền điện', 'Insufficient'], ['Phải thu và dòng tiền nhà máy', 'Insufficient']];
  c.innerHTML = `<div class="pp-flow-row">${steps.map(([t, s], i) => `${i ? '<span class="pp-arrow" aria-hidden="true">→</span>' : ''}<div class="pp-flow-box">${t}<br>${chip(s)}</div>`).join('')}</div><p class="research-caption">Kênh truyền dẫn có điều kiện: EVN ghi nhận lỗ không đồng nghĩa chậm thanh toán; chỉ kết luận khi có số phải thu, tuổi nợ trực tiếp.</p>`; return c; };
const paymentCard = () => tableCard('dien-pp-payment', ['Chỉ báo', 'Vì sao cần', 'Trạng thái'], [
  ['Phải thu tiền bán điện (thuyết minh BCTC)', 'Tách khỏi phải thu khác', chip('Insufficient')], ['Số ngày phải thu', 'Đo tốc độ thu tiền', chip('Insufficient')], ['Tăng phải thu so tăng doanh thu', 'Phát hiện thu tiền chậm lại', chip('Insufficient')],
  ['Công nợ quá hạn', 'Bằng chứng trực tiếp về chậm thanh toán', chip('Insufficient')], ['Dòng tiền hoạt động của doanh nghiệp phát điện', 'Tiền thực thu so lợi nhuận', chip('Insufficient')]
], {title: 'Theo dõi rủi ro thanh toán', sub: '<b>Chưa có bằng chứng trực tiếp</b> (Insufficient Direct Evidence): BCTC quý trên trang chỉ có doanh thu, lãi gộp, LNST; không suy công nợ EVN từ tổng phải thu khi thiếu thuyết minh'});
// 6.1 Bốn khái niệm công suất.
function conceptsCard() {
  const cap = capItems ? sum(capItems.map(x => x[1])) : null;
  return tableCard('dien-pp-capacity-concepts', ['Khái niệm', 'Định nghĩa', 'Số trên trang', 'Trạng thái'], [
    ['Công suất đặt (installed)', 'Tổng công suất danh định của nhà máy', fin(cap) ? `${nf(cap, 0)} MW (cuối 2025, EVN ước)` : '—', chip(fin(cap) ? 'Estimated' : 'Insufficient')],
    ['Công suất khả dụng (available)', 'Phần phát được tại thời điểm (trừ bảo dưỡng, sự cố, thiếu nước/nhiên liệu)', '—', chip('Insufficient')],
    ['Công suất tin cậy (reliable)', 'Phần có thể dựa vào lúc phụ tải đỉnh (NLTT tính theo hệ số đóng góp)', '—', chip('Insufficient')],
    ['Phụ tải đỉnh (Pmax)', 'Công suất cực đại hệ thống', pmaxYtd ? `${nf(pmaxYtd.cur.pmax, 0)} MW (${dm(pmaxYtd.cur.date)})` : '—', chip(pmaxYtd ? 'Verified' : 'Insufficient')]
  ], {title: 'Bốn khái niệm công suất', sub: 'không lấy công suất đặt − Pmax làm dự phòng thực tế', note: 'Dự phòng thực tế cần công suất khả dụng/tin cậy theo miền và ràng buộc truyền tải Bắc – Trung – Nam.'});
}
// 6.2 Pipeline LNG theo trạng thái và năm COD (đọc từ bảng dien-26, tab Chủ đề nóng).
const STAGE = [['op', 'Vận hành / COD xác nhận', '#1D2678'], ['build', 'Đang xây dựng', '#2938A8'], ['appr', 'Đã ký hợp đồng, chưa khởi công', '#6171C5'], ['plan', 'Quy hoạch', '#B3BDE8'], ['delay', 'Chậm / chưa chắc chắn', '#b8443a']];
const lngProjects = () => { const t = block('dien-26')?.querySelector('table'); if (!t) return [];
  return [...t.querySelectorAll('tbody tr')].map(tr => { const c = [...tr.cells].map(x => x.textContent.trim()); if (c.length < 5) return null;
    const st = c[3], s = /Đã vận hành/i.test(st) ? 'op' : /Kẹt|vướng|chưa thống nhất|không có hồ sơ|Chưa khởi công/i.test(st) ? 'delay' : /Khởi công|xây dựng/i.test(st) ? 'build' : /Ký EPC|Ký hợp đồng/i.test(st) ? 'appr' : 'plan';
    const y = (/(20\d\d)/.exec(c[4]) || [])[1] || null; return {name: c[0], mw: parseFloat(c[1].replace(/\./g, '').replace(',', '.')), owner: c[2], status: st, cod: c[4], stage: s, year: y}; }).filter(Boolean); };
function pipelineCard() {
  const ps = lngProjects(), c = newCard('dien-pp-pipeline-cod', 'Dự án điện khí LNG theo trạng thái và năm vận hành dự kiến (MW)', 'MW · phân loại theo mô tả trạng thái trong bảng nguồn, không phải xác suất hoàn thành · năm = năm đầu tiên nêu ở mốc vận hành dự kiến', `Nguồn: bảng "Điện khí LNG" ở tab ${'<a href="#mt7" data-pp-main="mt7">Chủ đề nóng</a>'} (Dân trí, VnEconomy, Báo Chính phủ…).`, {kind: 'document', cadence: 'monthly', table: true});
  if (!ps.length) { c.querySelector('.pp-host').replaceChildren(gap('không đọc được bảng dự án LNG.')); return c; }
  const years = [...new Set(ps.map(p => p.year || 'Chưa có mốc'))].sort();
  renders.supply.push(() => mount(c.querySelector('.pp-host'), {key: 'dien-pp-pipeline-cod', categories: years, unit: 'MW', digits: 0, stackable: true, native: 'stack', time: false,
    series: STAGE.map(([k, name, color]) => ({name, color, kind: 'bar', values: years.map(y => { const v = sum(ps.filter(p => (p.year || 'Chưa có mốc') === y && p.stage === k).map(p => p.mw)); return v || null; })})).filter(s => s.values.some(fin)), aria: 'Dự án LNG theo năm COD và trạng thái'}));
  fillTable(c.querySelector('table'), ['Dự án', 'MW', 'Chủ đầu tư', 'Trạng thái (nguồn)', 'Phân loại', 'Vận hành dự kiến'], ps.map(p => [esc(p.name), nf(p.mw, 0), esc(p.owner), esc(p.status), STAGE.find(s => s[0] === p.stage)[1], esc(p.cod)]));
  return c;
}
function epcCard() {
  const ps = lngProjects(), q = ps.find(p => /Ký EPC/.test(p.status)), m = q && /Ký EPC ([\d/]+) \(([\d.,]+) tỷ đồng\)/.exec(q.status);
  const Q = window.COMPANY_QUARTERLY, by = Object.fromEntries((Q?.companies || []).filter(c => c.sector === 'power').map(c => [c.symbol, c])), qs = Q?.quarters || [];
  const rev = t => { const c = by[t]; if (!c) return '—'; let i = c.revenue.length - 1; while (i >= 0 && c.revenue[i] == null) i--; return i >= 4 && c.revenue[i - 4] ? `${nf(c.revenue[i], 0)} tỷ ${qs[i]} (${pc((c.revenue[i] / c.revenue[i - 4] - 1) * 100)})` : '—'; };
  return tableCard('dien-pp-epc', ['Đại lượng', 'Định nghĩa', 'Dữ liệu trên trang', 'Trạng thái'], [
    ['Tổng vốn đầu tư dự án', 'Toàn bộ CAPEX dự án (thiết bị, xây lắp, lãi vay thời gian xây dựng…)', '—', chip('Insufficient')],
    ['Giá trị hợp đồng EPC', 'Phần nhà thầu EPC nhận, nhỏ hơn tổng vốn', m ? `Quảng Trạch II: ${m[2]} tỷ đồng (EVN ký EPC ${m[1]})` : '—', chip(m ? 'Verified' : 'Insufficient')],
    ['Backlog đã ký của doanh nghiệp', 'Giá trị hợp đồng chưa ghi nhận doanh thu', 'PC1, TV2, GEX, GEE: chưa có số trên trang', chip('Insufficient')],
    ['Doanh thu dự kiến ghi nhận', 'Theo tiến độ thi công', '—', chip('Insufficient')],
    ['Lợi nhuận tiềm năng', 'Biên gộp EPC × doanh thu ghi nhận', '—', chip('Insufficient')],
    ['Doanh thu quý gần nhất (tham khảo)', 'BCTC hợp nhất', `PC1 ${rev('PC1')} · TV2 ${rev('TV2')} · GEX ${rev('GEX')}`, chip('Verified')]
  ], {title: 'Cơ hội EPC, tư vấn, thiết bị: đừng lấy tổng CAPEX ngành làm doanh thu doanh nghiệp', note: 'Doanh thu quý là số hợp nhất (gồm mảng ngoài điện); không phải backlog.'});
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

  /* ---------- 01–06: khung 3 lớp (12/11/2026) — kết luận theo quy tắc, chart phụ và dữ liệu sâu thu gọn ---------- */
  const F = makeFacts(); window.POWER_FACTS = F;
  const PIr = window.PowerInsights, nk = s => (s || []).filter(Boolean);
  const neutral = t => { t?.querySelectorAll('.delta').forEach(d => d.classList.add('pp-neutral')); return t; };

  /* ---------- 01 Nhu cầu ---------- */
  const lfLast = [...months].reverse().find(m => m.m <= M && m.lf != null), lfLy = lfLast && monthBy.get(back(lfLast.m + '-01').slice(0, 7));
  const dmd = PIr ? PIr.demand(F) : {headline: '', lines: [], cannot: [], watch: []};
  panes.demand.append(take(dmd.headline, 'B', dmd.status || 'Insufficient'), legend());
  strip('demand', [keep.daily, keep.ytd, keep.pmax, kpi({label: 'Hệ số phụ tải · ' + (lfLast ? ml(lfLast.m) : '—'), value: nf(lfLast?.lf, 1), unit: '%', delta: lfLy?.lf != null ? `${pp(lfLast.lf - lfLy.lf)} so cùng kỳ` : '', cls: 'pp-neutral', sub: 'điện năng ÷ (Pmax × 24h) · tự tính từ EVN'})].map(neutral));
  const seasonal = pane.querySelector('.power-seasonal-status');
  panes.demand.append(qpanel({id: 'demand-momentum', num: '1.1', q: 'Nhu cầu điện đang tăng tốc hay giảm tốc?', lv: 'A',
    concl: accel ? `Điện năng ${F.mLabel} ${pc(F.demand.yoy)} so cùng kỳ; 3 tháng gần nhất ${pc(accel.now)} so ${pc(accel.before)} của 3 tháng trước: ${dmd.momentum || '—'}.` : '',
    metrics: [[F.mLabel + ' so cùng kỳ', pc(F.demand.yoy)], ['3 tháng gần nhất', pc(accel?.now), 'trước đó ' + pc(accel?.before)], ['Từ đầu năm', pc(F.demand.ytd), PERIODS.ytd?.name]],
    impl: 'Cầu tăng nhanh kéo nguồn biên (than, khí) huy động nhiều hơn; tác động lợi nhuận phụ thuộc Qc và giá (xem 03, 04).',
    main: C('dien-08') || H2('chMonthly'), support: block('dien-output-heatmap'), explore: [seasonal, C('dien-06') || H2('chDaily')],
    deep: {mech: 'Điện năng tăng → nhu cầu nhiên liệu, nước tăng → nguồn biên được huy động thêm khi vượt khả năng thủy điện và NLTT.', change: 'Tăng trưởng 3 tháng quay về dưới 5% so cùng kỳ; tăng trưởng do yếu tố một lần (nắng nóng, ngày lễ).',
      method: 'Bản tin vận hành ngày của EVN; so cùng kỳ chỉ cộng các ngày có bản tin đủ nguồn ở cả hai năm; ngày thiếu không nội suy.', limits: 'Không suy ra nguyên nhân (công nghiệp, thời tiết) khi trang chưa có dữ liệu hỗ trợ.', nodes: [reconcileCard(keep.ytd)]}}));
  panes.demand.append(qpanel({id: 'demand-peak', num: '1.2', q: 'Mức tăng thể hiện qua điện năng hay qua công suất đỉnh?', lv: 'B',
    concl: nk(dmd.lines).filter(x => x[0] === 'B').map(x => x[1]).join(' ') || '',
    metrics: [['Pmax từ đầu năm', pc(pmaxYtd?.yoy), pmaxYtd ? nf(pmaxYtd.cur.pmax, 0) + ' MW, ' + dm(pmaxYtd.cur.date) : ''], ['Điện năng từ đầu năm', pc(F.demand.ytd)], ['Hệ số phụ tải', lfLast ? nf(lfLast.lf, 1) + '%' : '—', lfLast ? ml(lfLast.m) : '']],
    impl: 'Đỉnh tăng nhanh cần thêm công suất giờ cao điểm (thủy điện hồ lớn, khí, lưu trữ); điện năng tăng nhanh cần thêm nhiên liệu, nước. Không suy ra dư thừa hay thiếu hụt công suất từ hai số này.',
    main: peakCard(), support: lfCard(), explore: [C('dien-09') || H2('chPmax')],
    deep: {mech: 'Hệ số phụ tải = điện năng bình quân ÷ (Pmax × 24h); giảm khi đỉnh tăng nhanh hơn bình quân.', change: 'Pmax mùa nóng 2027 vượt mạnh đỉnh 2026 trong khi điện năng chậm lại.',
      method: 'Pmax tháng là cao nhất trong các bản tin của tháng; chỉ so khi cả hai tháng có ≥90% ngày. Ngày đạt Pmax theo ngày vận hành của bản tin (bản tin ngày D đăng ngày D+1).', limits: dmd.cannot?.join(' ')}}));
  panes.demand.append(qpanel({id: 'demand-pressure', num: '1.3', q: 'Áp lực nhu cầu đang ở mức nào?', lv: 'A', concl: 'Năm chỉ báo dưới đây đọc riêng từng cái; chưa gộp thành điểm rủi ro vì chưa có ngưỡng được kiểm định.',
    main: demandPressureCard(), body: el('div', 'pp-twocol', `<div><b>Chưa thể kết luận</b>${ul(nk(dmd.cannot))}</div><div><b>Theo dõi tiếp</b>${ul(nk(dmd.watch))}</div>`)}));

  /* ---------- 02 Thủy văn ---------- */
  const r5 = reservoir5y, dry = fin(resYoY?.med) && fin(r5?.med) && resYoY.med < -10 && r5.med < 0;
  panes.hydro.append(take(resYoY && r5 ? `${dry ? 'Thủy văn bất lợi' : 'Thủy văn chưa bất lợi trên diện rộng'}: nước về ${resYoY.span} ${pc(resYoY.med, 0)} so cùng kỳ, ${ml(r5.month)} ${pc(r5.med, 0)} so TB 5 năm; thủy điện ${F.mLabel} ${pc(F.hydro.yoy)}. Mức tác động lợi nhuận tùy mực nước, điều tiết, giá và danh mục từng doanh nghiệp.` : 'Chưa đủ số nước về để kết luận.', 'B', resYoY && r5 ? 'Verified' : 'Insufficient'), legend());
  strip('hydro', [keep.oni, kpi({label: 'Hồ dưới TB 5 năm · ' + (r5 ? ml(r5.month) : '—'), value: r5 ? `${r5.below}/${r5.n}` : '—', unit: 'hồ', delta: r5 ? `trung vị ${pc(r5.med, 0)} so TB 5 năm` : '', cls: 'pp-neutral', sub: `${r5?.n ?? 0}/${r5?.total ?? 0} hồ đủ ≥80% ngày, nền ≥3 năm`}),
    kpi({label: 'Nước về so cùng kỳ', value: pc(resYoY?.med, 0), delta: resYoY ? `${resYoY.low}/${resYoY.n} hồ thấp hơn năm trước` : '', cls: 'pp-neutral', sub: `${resYoY?.span || '—'} · đúng các ngày năm trước`}),
    kpi({label: 'Vùng bất lợi / thuận lợi nhất', value: r5?.worst ? esc(r5.worst.reg) : '—', delta: r5?.worst ? `${pc(r5.worst.med, 0)} · thuận nhất ${esc(r5.best.reg)} ${pc(r5.best.med, 0)}` : '', cls: 'pp-neutral', sub: `${r5 ? ml(r5.month) : '—'} · trung vị lệch so TB 5 năm (vùng ≥2 hồ)`})].map(neutral));
  panes.hydro.append(qpanel({id: 'hydro-climate', num: '2.1', q: 'Tín hiệu khí hậu toàn cầu nghiêng về khô hay ẩm?', lv: 'A',
    concl: oniLast ? `ONI ${oniLast.season} ${oniLast.year} ${sg(oniLast.oni, 2)} °C (${ensoState(oniLast.oni)}), 3 mùa trước ${sg(oni3?.oni, 2)}${ninoLast ? `; Niño 3.4 tuần ${dm(ninoLast.date)} ${sg(ninoLast.ssta, 2)} °C` : ''}.` : '',
    metrics: [['ONI', sg(oniLast?.oni, 2) + ' °C', oniLast ? oniLast.season + ' ' + oniLast.year : ''], ['Niño 3.4 tuần', sg(ninoLast?.ssta, 2) + ' °C', ninoLast ? dm(ninoLast.date) : ''], ['ONI 6 mùa trước', sg(oni6?.oni, 2) + ' °C']],
    impl: 'El Niño thường đi kèm mùa khô ít mưa hơn ở Việt Nam (quan hệ lịch sử): rủi ro sản lượng thủy điện mùa khô; không dùng để dự báo định lượng lưu lượng hồ.',
    main: C('dien-04') || H2('chEnso'), support: block('dien-oni-gauge'), explore: [C('dien-05') || H2('chNino34')],
    deep: {mech: 'ENSO → lượng mưa lưu vực → nước về hồ → mực nước → sản lượng thủy điện; độ trễ và cường độ khác nhau theo vùng.', change: 'ONI quay về vùng trung tính (±0,5) trước mùa khô; mưa trái mùa lớn ở các lưu vực chính.',
      method: 'NOAA CPC: ONI (ERSSTv5, trung bình trượt 3 tháng) và Niño 3.4 tuần (OISST). Số quan sát; không trộn với dự báo.', limits: 'Chưa có chuỗi dự báo ENSO có ngày phát hành và chưa có RONI chính thức trên trang (thiếu dữ liệu); chưa có mô hình độ trễ ONI → lưu lượng.'}}));
  panes.hydro.append(qpanel({id: 'hydro-vn', num: '2.2', q: 'Nước về các hồ đang thuận hay bất lợi so lịch sử?', lv: 'A',
    concl: resYoY && r5 ? `Nước về ${resYoY.span} trung vị ${pc(resYoY.med, 0)} so cùng kỳ (${resYoY.low}/${resYoY.n} hồ thấp hơn); ${ml(r5.month)} trung vị ${pc(r5.med, 0)} so TB 5 năm, bất lợi nhất ${esc(r5.worst?.reg || '—')} ${pc(r5.worst?.med, 0)}.` : '',
    metrics: [['Nước về so cùng kỳ', pc(resYoY?.med, 0), resYoY?.span], ['So TB 5 năm', pc(r5?.med, 0), r5 ? ml(r5.month) : ''], ['Hồ dưới TB 5 năm', r5 ? `${r5.below}/${r5.n}` : '—']],
    impl: 'Nước về thấp ở mùa tích nước làm giảm khả năng phát mùa khô của hồ lớn; nhiệt điện được huy động bù.',
    main: C('dien-31'), explore: [C('dien-hydro-reservoirs')],
    deep: {mech: 'Nước về quyết định mực nước cuối mùa mưa; mực nước quyết định sản lượng mùa khô.', change: 'Mưa lớn cuối mùa đưa hồ lớn về mực nước dâng bình thường; nước về T12–T2 trở lại mức TB 5 năm.',
      method: 'EVN, ảnh chụp 00h mỗi ngày (±2 giờ). Tháng hợp lệ cần ≥80% ngày; nền 5 năm cần ≥3 năm hợp lệ; trung vị không trọng số theo dung tích. So cùng kỳ dùng đúng các ngày đó năm trước, năm trước cần ≥80% số ngày.', limits: 'Một số hồ thiếu ngày; Thượng Kon Tum thiếu từ 28/08/2026 (EVN ghi giờ 19:00).'}}));
  const expo = el('div', 'card pp-expo'); expo.dataset.blockId = 'dien-pp-hydro-expo';
  const exposed = (window.POWER_HYDRO_ASSETS?.rows || []).filter(r => r.status === 'Đã xác minh' && fin(resWater.get(r.reservoir)?.yoy) && resWater.get(r.reservoir).yoy < -30);
  const exBasins = [...new Set(exposed.map(r => window.POWER_HYDRO_ASSETS.basins?.[r.reservoir]).filter(Boolean))], exT = [...new Set(exposed.flatMap(r => (r.holders || []).map(h => h.ticker)))];
  panes.hydro.append(qpanel({id: 'hydro-company', num: '2.3', q: 'Thủy văn bất lợi chạm tới tài sản của doanh nghiệp nào?', lv: 'B', st: exposed.length ? 'Verified' : 'Insufficient',
    concl: exposed.length ? `Tài sản đã xác minh tại lưu vực ${exBasins.join(', ')} có nước về thấp hơn cùng kỳ trên 30%; doanh nghiệp liên quan: ${exT.join(', ')}. Mức tác động lợi nhuận phụ thuộc mực nước, kế hoạch điều tiết, giá điện và cơ cấu danh mục.` : 'Chưa có tài sản đã xác minh với nước về giảm trên 30% so cùng kỳ.',
    impl: 'Phân biệt công suất danh nghĩa với công suất sở hữu kinh tế (ví dụ REE hưởng gián tiếp qua VSH, SBH, TMP); không quy đổi % nước về thành % EBITDA.',
    main: expo, deep: {method: 'Ánh xạ hồ → nhà máy → đơn vị sở hữu từ nguồn đã mở (không dùng Wikipedia); lưu vực theo vị trí địa lý; tỷ lệ sở hữu theo nguồn của từng dòng.', limits: 'Chưa có sản lượng từng nhà máy, tỷ trọng thủy điện trong lợi nhuận doanh nghiệp; nhà máy của CHP, SHP, SBA, HDG không nằm trong danh sách hồ EVN; 18 hồ lớn chưa xác minh chủ sở hữu.'}}));
  renders.hydro.push(() => hydroExposure(expo));
  panes.hydro.append(qpanel({id: 'hydro-other', num: '2.4', q: 'Nguồn thay thế (than, khí, LNG) có bị hạn chế không?', lv: 'A', st: 'Insufficient', concl: 'Trang chưa có chuỗi dữ liệu tin cậy về cung ứng nhiên liệu, dừng máy, công suất khả dụng hay ràng buộc truyền tải.',
    body: gap('Khả năng cung ứng than/khí/LNG, lịch bảo dưỡng – sự cố, công suất khả dụng, nghẽn truyền tải Bắc–Trung–Nam. Nguồn cần: báo cáo vận hành NSMO/EVN, TKV, PV GAS. Giá nhiên liệu xem sub-tab 04.')}));

  /* ---------- 03 Huy động ---------- */
  const yt = CMP.ytd, tth = thermal('ytd'), hY = G('hydro', 'ytd'), up = topContrib('ytd');
  panes.dispatch.append(take(yt?.ok && tth && hY ? `Từ đầu năm sản lượng ${sg(yt.delta, 0)} triệu kWh (${pc(yt.yoy)}); ${up[0].name.toLowerCase()} đóng góp nhiều nhất (${pp(up[0].contrib)}), thủy điện ${pp(hY.contrib)}; tỷ trọng than + khí ${pp(tth.coal.dpp + tth.gas.dpp)}: huy động ${tth.coal.dpp + tth.gas.dpp > 1 && hY.dpp < -1 ? 'dịch chuyển sang nhiệt điện' : 'chưa đổi cơ cấu rõ'}; doanh thu, biên, lợi nhuận từng doanh nghiệp xem 3.3.` : 'Chưa đủ ngày đối chiếu.', 'B', yt?.ok ? 'Verified' : 'Insufficient'), legend());
  strip('dispatch', ['hydro', 'coal', 'gas', 're'].map(k => { const x = G(k); return kpi({label: SRC.find(s => s[0] === k)[1] + ' · ' + (M ? ml(M) : '—'), value: pc(x?.yoy), delta: x ? `tỷ trọng ${nf(x.shareCur, 1)}% (${pp(x.dpp)})` : '', cls: 'pp-neutral', sub: `${sg(x?.delta, 0)} triệu kWh so cùng kỳ`}); }));
  panes.dispatch.append(qpanel({id: 'dispatch-system', num: '3.1', q: 'Nguồn nào đang tăng, nguồn nào giảm sản lượng?', lv: 'A',
    concl: yt?.ok ? `Từ đầu năm: ${up.slice(0, 2).map(x => `${x.name} ${sg(x.delta, 0)} triệu kWh (${pp(x.contrib)})`).join(', ')}; ${up.at(-1).name} ${sg(up.at(-1).delta, 0)} (${pp(up.at(-1).contrib)}).` : '',
    metrics: ['hydro', 'coal', 'gas'].map(k => { const x = yt?.ok ? yt.get(k) : null; return [`Tỷ trọng ${SRC.find(s => s[0] === k)[1].toLowerCase()}`, pp(x?.dpp), x ? nf(x.shareCur, 1) + '% từ đầu năm' : '']; }),
    impl: 'Huy động là tín hiệu vận hành; chưa phải doanh thu hay lợi nhuận của doanh nghiệp (xem 3.3).', main: mixCard(), support: contribCard(), explore: [block('dien-mix-today'), C('dien-11-sources')],
    deep: {method: 'Cơ cấu: bình quân ngày theo nguồn (không lệch khi thiếu bản tin). Đóng góp: Δ từng nguồn trên đúng các ngày có bản tin đủ nguồn ở cả hai năm ÷ tổng cùng kỳ; chênh lệch phân loại tách riêng. Card "Sản lượng tăng chủ yếu từ nguồn nào?" dùng lũy kế công bố của EVN (kỳ khác).'}}));
  panes.dispatch.append(qpanel({id: 'dispatch-why', num: '3.2', q: 'Vì sao các nguồn đó được huy động?', lv: 'B',
    concl: hY && tth ? `Thủy điện giảm ${sg(hY.delta, 0)} triệu kWh trong khi cầu tăng ${sg(yt.delta, 0)}: than (${sg(tth.coal.delta, 0)}) và khí & dầu (${sg(tth.gas.delta, 0)}) bù phần lớn. Giá chào, ràng buộc kỹ thuật và Qc chưa quan sát được nên chưa tách được vai trò từng yếu tố.` : '',
    impl: 'Khi nước về ít, hệ thống huy động thêm nguồn có chi phí biến đổi kế tiếp (than, rồi khí/LNG); thứ tự thực tế còn tùy giá chào và ràng buộc lưới.', main: substCard(), support: driversCard(),
    explore: [C('dien-07') || H2('chMixShare'), C('dien-07-coal'), C('dien-07-gas'), C('dien-07-renewables'), C('dien-07-imports')],
    deep: {change: 'Thủy điện phục hồi mà nhiệt điện vẫn tăng (cầu là động lực chính); hoặc nhiệt điện giảm dù thủy điện yếu (ràng buộc nhiên liệu, lưới).', limits: 'Tương quan giữa các cột không chứng minh nhân quả; chưa có dữ liệu chào giá và điều độ theo nhà máy.'}}));
  panes.dispatch.append(qpanel({id: 'dispatch-listed', num: '3.3', q: 'Huy động tăng đã thành doanh thu, biên và lợi nhuận của doanh nghiệp nào?', lv: 'B',
    concl: 'Bảng đặt huy động hệ thống cạnh BCTC quý cùng kỳ; bốn cột là bốn kết luận khác nhau. Tác động lợi nhuận chỉ đọc từ BCTC, không suy từ sản lượng toàn hệ thống.',
    impl: 'Đọc cột cuối: doanh thu tăng nhưng biên giảm thường là nhiên liệu đắt lên hoặc giá thực nhận thấp hơn; cần Qc và giá thực nhận để kết luận nguyên nhân.', main: listedCard(),
    deep: {nodes: [checklistCard()], method: 'Huy động hệ thống: so cùng kỳ quý trên đúng ngày đối chiếu (thủy điện; than + khí & dầu; gió & mặt trời). BCTC quý hợp nhất (VNDirect).', limits: 'Doanh nghiệp đa ngành; số hợp nhất không tách theo nhà máy; quý gần nhất có thể chưa đủ mọi mã.'}}));

  /* ---------- 04 Giá & biên ---------- */
  const U = unitM, ciT = U ? PIr?.coalCost(U.coalUsd, U.fx, FUEL.HR_COAL, FUEL.HHV_NC) : null, lgT = U ? PIr?.gasCost(U.lngUsd, FUEL.FEE_USD, FUEL.HR_GAS, U.fx) : null;
  panes.economics.append(take(U && fin(ciT) ? `FMP ${ml(U.period)} ${nf(U.fmp, 0)} đ/kWh; chi phí nhiên liệu ước than nhập ${nf(ciT, 0)}, LNG ${nf(lgT, 0)} đ/kWh → spread minh họa than nhập ${sg(U.fmp - ciT, 0)}, LNG ${sg(U.fmp - lgT, 0)} đ/kWh. Chỉ phần điện năng ngoài Qc hưởng trực tiếp; không phải lợi nhuận nhà máy.` : 'Chưa đủ dữ liệu đồng kỳ để tính kinh tế đơn vị.', 'C', U ? 'Estimated' : 'Insufficient'), legend());
  strip('economics', [kpi({label: 'FMP · ' + (fmpLast ? ml(fmpLast.period) : '—'), value: nf(fmpLast?.fmp, 0), unit: 'đ/kWh', delta: `${pc(F.price.fmpMoM)} so tháng trước`, cls: 'pp-neutral', sub: `${fmpLy ? 'cùng kỳ ' + nf(fmpLy.fmp, 0) : ''}${fmpYtd ? ' · BQ ' + fmpYtd.n + ' tháng ' + pc((fmpYtd.cur / fmpYtd.prev - 1) * 100) + ' YoY' : ''}`}),
    neutral(keep.coal), kpi({label: 'LNG JKM', value: nf(jkm3?.now, 2), unit: 'USD/MMBtu', delta: `${pc(jkm3?.pct)} so 3 tháng`, cls: 'pp-neutral', sub: `${dm(jkm3?.date)} · ICE futures`}),
    kpi({label: 'Tỷ giá dùng tính chi phí', value: nf(U?.fx, 0), unit: 'VND/USD', delta: U ? ml(U.period) : '', cls: 'pp-neutral', sub: U ? (U.fxSrc === 'NHNN' ? 'tỷ giá trung tâm NHNN, bình quân tháng' : 'WiData 242638, bình quân tháng') : ''})]);
  panes.economics.append(qpanel({id: 'econ-prices', num: '4.1', q: 'Giá thị trường điện đang lên hay xuống, và đó là giá gì?', lv: 'A',
    concl: fmpLast ? `FMP ${ml(fmpLast.period)} ${nf(fmpLast.fmp, 0)} đ/kWh, ${pc(F.price.fmpMoM)} so tháng trước, ${pc(F.price.fmpYoY)} so cùng kỳ. FMP là giá thị trường, không phải giá bán thực nhận của mọi nhà máy.` : '',
    metrics: [['FMP', nf(fmpLast?.fmp, 0) + ' đ/kWh', fmpLast ? ml(fmpLast.period) : ''], ['So cùng kỳ', pc(F.price.fmpYoY)], ['Bình quân từ đầu năm', fmpYtd ? pc((fmpYtd.cur / fmpYtd.prev - 1) * 100) : '—', fmpYtd ? fmpYtd.n + ' tháng' : '']],
    impl: 'FMP cao có lợi cho phần điện năng ngoài Qc của nhà máy chào giá trực tiếp; nhà máy Qc cao hoặc gián tiếp tham gia gần như không hưởng.', main: C('dien-15') || H2('chFmpTrend'), support: priceDefsCard(),
    deep: {method: 'FMP bình quân tháng từ bản tin IR PGV; CAN là giá năm, không trừ FMP tháng với CAN năm để suy SMP tháng.'}}));
  panes.economics.append(qpanel({id: 'econ-unit', num: '4.2', q: 'Mỗi công nghệ còn bao nhiêu biên năng lượng ở giá hiện tại?', lv: 'C', st: U ? 'Estimated' : 'Insufficient',
    concl: U ? `Ở FMP ${ml(U.period)}, than nhập và LNG có spread minh họa ${sg(U.fmp - ciT, 0)} và ${sg(U.fmp - lgT, 0)} đ/kWh trên phần ngoài hợp đồng; than nội và khí nội tính theo mốc khung giá 2026 (phi đồng kỳ).` : '',
    impl: 'Giá nhiên liệu tăng bất lợi trước hết cho nhà máy nhiên liệu nhập ít được chuyển ngang; thủy điện và NLTT không chịu chi phí nhiên liệu.', main: unitEconCard(), support: C('dien-30') || H2('chSpread'),
    explore: [fuelCard(), C('fast-price') || H2('chFastPrice'), C('dien-12') || H2('chCoalM'), C('dien-13') || H2('chGasM'), hydroEconCard()],
    deep: {mech: 'Spread = giá điện tham chiếu − chi phí biến đổi; dương thì kWh bán thêm trên thị trường bù được chi phí biến đổi.', change: 'Giá than, LNG tăng nhanh hơn FMP; tỷ giá tăng mạnh; FMP mùa mưa giảm sâu.',
      method: 'Chuỗi spread (card phụ) tính đồng kỳ từng tháng: FMP, giá World Bank và tỷ giá cùng tháng (NHNN, thiếu thì WiData). Bảng dùng tháng gần nhất có đủ ba số.', limits: 'Chưa có heat rate thực tế, giá nhiên liệu hợp đồng, chi phí biến đổi ngoài nhiên liệu của từng nhà máy; spread không phải biên gộp hay EBITDA.'}}));
  panes.economics.append(qpanel({id: 'econ-calc', num: '4.3', q: 'Nếu giá nhiên liệu, FMP, tỷ giá thay đổi thì spread đổi bao nhiêu?', lv: 'C', st: 'Scenario', concl: 'Chỉnh các ô để xem độ nhạy của chi phí nhiên liệu/kWh và spread; kết quả là kịch bản minh họa, không phải lợi nhuận thực tế.', main: calcCard()}));
  panes.economics.append(qpanel({id: 'econ-qc', num: '4.4', q: 'Khi nào giá thị trường tăng thành lợi nhuận tăng?', lv: 'C', concl: 'Chỉ khi nhà máy có điện năng ngoài Qc đáng kể, được huy động và FMP vượt chi phí biến đổi; trang chưa có Qc, điều khoản PPA từng nhà máy nên không định lượng độ nhạy lợi nhuận.',
    main: qcFlowCard(), explore: [(() => { const fw = el('div', 'card pp-frame'); fw.dataset.blockId = 'dien-pp-contract'; fw.innerHTML = `<div class="tablewrap"><table><thead><tr><th>Yếu tố</th><th>Cơ chế</th><th>Khi FMP tăng</th><th>Cần để định lượng</th></tr></thead><tbody>
      <tr><td><b>Giá PPA</b></td><td>Giá hợp đồng mua bán điện với EVN/EPTC (giá cố định + biến đổi)</td><td>Không đổi trong kỳ hợp đồng</td><td>Điều khoản PPA từng nhà máy</td></tr>
      <tr><td><b>Sản lượng hợp đồng Qc</b></td><td>Phần sản lượng thanh toán theo giá hợp đồng (CfD)</td><td>Qc càng cao, lợi ích từ FMP càng nhỏ</td><td>Tỷ lệ Qc năm của từng nhà máy</td></tr>
      <tr><td><b>Điện năng ngoài Qc</b></td><td>Bán theo giá thị trường (FMP)</td><td>Hưởng trực tiếp nếu FMP > chi phí biến đổi</td><td>Sản lượng thực phát − Qc</td></tr>
      <tr><td><b>Nhiên liệu chuyển ngang</b></td><td>Giá biến đổi điều chỉnh theo giá than/khí</td><td>Biên theo hợp đồng ổn định; phần thị trường chịu rủi ro giá nhiên liệu</td><td>Công thức điều chỉnh trong PPA</td></tr>
      <tr><td><b>Khấu hao, lãi vay</b></td><td>Chi phí cố định, thu hồi qua giá cố định</td><td>Sản lượng cao hơn trải chi phí cố định</td><td>Lịch khấu hao, nợ vay từng nhà máy</td></tr></tbody></table></div>`; return fw; })()],
    deep: {change: 'Có công bố Qc năm 2027 hoặc điều khoản PPA cụ thể của nhà máy.', limits: 'Cần thêm để dự phóng lợi nhuận: Qc, giá hợp đồng, giá nhiên liệu theo hợp đồng, heat rate thực tế, sản lượng từng nhà máy.'}}));

  /* ---------- 05 EVN ---------- */
  const tFirst = tariffVals?.[0], tLast = tariffVals?.at(-1);
  panes.evn.append(take(tLast && lossVals ? `Giá bán lẻ bình quân ${nf(tLast, 2)} đ/kWh từ ${tariffDates.at(-1)} (${pc((tLast / tariffVals.at(-2) - 1) * 100)}); lỗ lũy kế công ty mẹ EVN ${lossVals.at(-1) === 0 ? 'đã xử lý hết' : nf(lossVals.at(-1), 0) + ' tỷ đồng'} (${lossLabels.at(-1)}). Chưa có bằng chứng trực tiếp về rủi ro thanh toán cho nhà máy.` : 'Chưa đủ dữ liệu.', 'B', 'Verified'), legend());
  strip('evn', [neutral(keep.tariff), kpi({label: 'Thay đổi từ ' + (tariffDates?.[0]?.slice(-4) || '—'), value: pc(tFirst && tLast ? (tLast / tFirst - 1) * 100 : null), delta: `${tariffVals ? tariffVals.length - 1 : '—'} lần điều chỉnh`, cls: 'pp-neutral', sub: `giá bán lẻ bình quân, ${tariffDates?.[0] || '—'} → ${tariffDates?.at(-1) || '—'}`}),
    kpi({label: 'Lỗ lũy kế công ty mẹ EVN', value: lossVals ? (lossVals.at(-1) === 0 ? 'Đã xử lý hết' : nf(lossVals.at(-1), 0)) : '—', delta: lossVals ? `cuối 2024: lỗ ${nf(Math.abs(lossVals[0]), 0)} tỷ đồng` : '', cls: 'pp-neutral', sub: `${lossLabels?.at(-1) || '—'} · công ty mẹ, không phải hợp nhất`})]);
  panes.evn.append(qpanel({id: 'evn-tariff', num: '5.1', q: 'Giá bán lẻ đã điều chỉnh thế nào?', lv: 'A', concl: tLast ? `Giá bán lẻ bình quân ${nf(tLast, 2)} đ/kWh (chưa VAT) từ ${tariffDates.at(-1)}, ${pc((tLast / tariffVals.at(-2) - 1) * 100)} so mức trước; ${pc((tLast / tFirst - 1) * 100)} so ${tariffDates[0]}.` : '',
    impl: 'Giá bán lẻ là nguồn tiền chính của bên mua điện; giảm giá thu hẹp đệm tài chính của EVN nếu chi phí mua điện không giảm tương ứng.', main: C('dien-14') || H2('chTariff'),
    deep: {method: 'Quyết định giá bán lẻ bình quân của EVN/Bộ Công Thương. Không ghép với khung giá phát điện (loại giá khác, xem tab Policy · Tax · Trade).'}}));
  panes.evn.append(qpanel({id: 'evn-fin', num: '5.2', q: 'Tài chính EVN đang cải thiện hay xấu đi?', lv: 'A', concl: lossVals ? `Phạm vi: công ty mẹ EVN. Lỗ lũy kế ${nf(Math.abs(lossVals[0]), 0)} tỷ đồng (${lossLabels[0]}) → ${nf(Math.abs(lossVals[1]), 0)} (${lossLabels[1]}) → ${lossVals.at(-1) === 0 ? 'đã xử lý hết' : nf(lossVals.at(-1), 0)} (${lossLabels.at(-1)}).` : '',
    impl: 'Lỗ lũy kế giảm làm giảm áp lực tài chính lên bên mua; chưa đủ để kết luận về tốc độ thanh toán cho từng nhà máy.', main: C('dien-16') || H2('chEvnLoss'),
    body: gap('Báo cáo hợp nhất EVN, dòng tiền, khoản phải trả các đơn vị phát điện theo kỳ. Không nối số công ty mẹ với số hợp nhất thành một chuỗi.')}));
  panes.evn.append(qpanel({id: 'evn-flow', num: '5.3', q: 'Tài chính EVN truyền sang dòng tiền nhà máy qua kênh nào?', lv: 'B', concl: 'Giá bán lẻ và sản lượng → doanh thu EVN → chi phí mua điện → khả năng tạo tiền → thanh toán → phải thu của nhà máy. Mới quan sát được bước đầu; các bước sau thiếu dữ liệu.', main: evnFlowCard()}));
  panes.evn.append(qpanel({id: 'evn-risk', num: '5.4', q: 'Có dấu hiệu rủi ro thanh toán từ bên mua điện không?', lv: 'A', st: 'Insufficient', concl: 'Chưa có bằng chứng trực tiếp: trang chưa có phải thu tiền điện, số ngày phải thu hay công nợ quá hạn. Không suy diễn rủi ro khi thiếu thuyết minh.', main: paymentCard()}));

  /* ---------- 06 Cung dài hạn ---------- */
  const capTotal = capItems ? sum(capItems.map(x => x[1])) : null, lngP = lngProjects(), lngMw = sum(lngP.map(p => p.mw)), lngOp = sum(lngP.filter(p => p.stage === 'op').map(p => p.mw)), lngBuild = sum(lngP.filter(p => p.stage === 'build').map(p => p.mw)), lngDelay = sum(lngP.filter(p => p.stage === 'delay').map(p => p.mw));
  panes.supply.append(take(shortfallMw && lngP.length ? `Kịch bản chậm tiến độ của Bộ Công Thương thiếu ${nf(shortfallMw[0], 0)} MW năm ${shortfallYears[0]} và ${nf(shortfallMw.at(-1), 0)} MW năm ${shortfallYears.at(-1)} (kịch bản, không phải dự báo). Trong ${nf(lngMw, 0)} MW điện khí LNG theo dõi: ${nf(lngOp, 0)} MW đã vận hành, ${nf(lngBuild, 0)} MW đang xây dựng, ${nf(lngDelay, 0)} MW chậm hoặc chưa chắc chắn.` : 'Chưa đủ dữ liệu.', 'B', 'Scenario'), legend());
  strip('supply', [kpi({label: 'Công suất đặt cuối 2025', value: nf(capTotal, 0), unit: 'MW', delta: capItems ? `than ${nf(capItems[0][1] / capTotal * 100, 0)}% · thủy điện ${nf(capItems[1][1] / capTotal * 100, 0)}% · NLTT ${nf(capItems[2][1] / capTotal * 100, 0)}%` : '', cls: 'pp-neutral', sub: 'công suất đặt, không phải khả dụng'}),
    kpi({label: 'Pmax từ đầu năm', value: nf(pmaxYtd?.cur.pmax, 0), unit: 'MW', delta: dm(pmaxYtd?.cur.date), cls: 'pp-neutral', sub: 'EVN · không so trực tiếp với công suất đặt'}),
    kpi({label: 'LNG đang xây dựng', value: nf(lngBuild, 0), unit: 'MW', delta: `${nf(lngDelay, 0)} MW chậm/chưa chắc`, cls: 'pp-neutral', sub: `trên ${nf(lngMw, 0)} MW dự án LNG theo dõi`}),
    kpi({label: 'Thiếu hụt 2030 nếu dự án chậm', value: nf(shortfallMw?.at(-1), 0), unit: 'MW', delta: 'kịch bản, không phải dự báo', cls: 'pp-neutral', sub: 'Báo cáo 760/BC-BCT'})]);
  panes.supply.append(qpanel({id: 'supply-cap', num: '6.1', q: 'Công suất hiện có so với phụ tải: biết được gì, chưa biết gì?', lv: 'A',
    concl: capTotal && pmaxYtd ? `Công suất đặt cuối 2025 khoảng ${nf(capTotal, 0)} MW, Pmax 2026 ${nf(pmaxYtd.cur.pmax, 0)} MW; chưa có công suất khả dụng và tin cậy nên chưa đo được dự phòng thực tế.` : '',
    main: conceptsCard(), support: C('dien-10') || H2('chCapacity'), explore: [C('dien-11') || H2('chOutputTarget')],
    deep: {method: 'Công suất đặt theo EVN (ước cuối 2025); Pmax theo bản tin vận hành.', limits: 'Thiếu chuỗi công suất đặt theo năm, công suất khả dụng, dự phòng theo miền.'}}));
  panes.supply.append(qpanel({id: 'supply-pipe', num: '6.2', q: 'Nguồn mới đang ở giai đoạn nào và vào vận hành năm nào?', lv: 'A', st: lngP.length ? 'Verified' : 'Insufficient',
    concl: lngP.length ? `Danh sách có MW mới có cho điện khí LNG (${lngP.length} dự án, ${nf(lngMw, 0)} MW). Các nguồn khác chỉ có tỷ trọng theo số dự án (Báo cáo 760), không suy ra MW.` : '',
    impl: 'Dự án đang xây dựng và đã ký EPC là nguồn việc gần nhất cho nhà thầu, thiết bị; dự án vướng PPA, vốn có rủi ro trượt COD.', main: pipelineCard(), support: moved[0],
    deep: {method: 'Phân loại theo mô tả trạng thái trong bảng nguồn: vận hành; đang xây dựng (khởi công); đã ký hợp đồng EPC/dự án; chậm/chưa chắc (vướng PPA, vốn, chưa khởi công, không có hồ sơ); còn lại là quy hoạch. Đây là phân loại trạng thái, không phải xác suất hoàn thành.', limits: 'Chưa có danh sách MW theo COD cho than, thủy điện, gió, mặt trời, lưu trữ; tỷ lệ 5% của Báo cáo 760 là theo số dự án.'}}));
  panes.supply.append(qpanel({id: 'supply-gap', num: '6.3', q: 'Nếu dự án tiếp tục chậm, thiếu hụt lớn đến đâu?', lv: 'A', st: 'Scenario', concl: shortfallMw ? `Kịch bản chậm tiến độ: thiếu ${nf(shortfallMw[0], 0)} MW (${shortfallYears[0]}) đến ${nf(shortfallMw.at(-1), 0)} MW (${shortfallYears.at(-1)}). Không phải dự báo thiếu điện chắc chắn.` : '',
    main: moved[1], deep: {method: 'Báo cáo 760/BC-BCT ngày 10/09/2026; chưa có kịch bản cơ sở và stress của cùng nguồn để đặt cạnh.'}}));
  panes.supply.append(qpanel({id: 'supply-epc', num: '6.4', q: 'Chu kỳ đầu tư tạo việc cho EPC, tư vấn, thiết bị ở đâu?', lv: 'C', concl: 'Nhà thầu, thiết bị hưởng lợi khi dự án ký EPC, khởi công và giải ngân đúng kế hoạch; tổng vốn đầu tư ngành không phải doanh thu khả dụng của doanh nghiệp EPC.',
    main: epcCard(), body: el('p', 'research-caption', 'Văn bản Quy hoạch điện VIII, khung giá, cơ chế phê duyệt: <a href="#mt4" data-pp-main="mt4">Policy · Tax · Trade</a>. Sự kiện sắp tới: <a href="#mt5" data-pp-main="mt5">Catalyst · Risk</a>.')}));

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
// CSS cho khung 3 lớp (12/11/2026): kết luận chính, nhãn trạng thái, chỉ tiêu, máy tính kịch bản; màu KPI trung tính.
const CSS2 = `
.pp-take{margin:0 0 10px;padding:12px 14px;border-left:4px solid #1D2678;border-radius:10px;background:color-mix(in srgb,var(--card,#fff) 88%,#2938A8 6%)}
.pp-take-k{display:block;font:700 11px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#7a8399);margin-bottom:4px}.pp-take p{margin:0;font-size:14px;line-height:1.55}
.pp-legend{margin:0 0 12px;font-size:12px}.pp-legend summary{cursor:pointer;color:var(--muted,#7a8399)}.pp-legend>div{margin-top:6px;line-height:1.9}
.pp-st{display:inline-block;font:600 10.5px/1.6 Inter,sans-serif;border-radius:4px;padding:0 6px;margin-right:4px;vertical-align:1px;border:1px solid transparent}
.pp-st-Verified{background:#e6f4ea;color:#1e6b3a}.pp-st-Estimated{background:#fff1d6;color:#7a5200}.pp-st-Scenario{background:#ede7fb;color:#4b2a8f}.pp-st-Insufficient{background:#eef0f4;color:#5b6478;border-color:#d6dbe8}.pp-st-Stale{background:#fde8e6;color:#9a2c22}
.pp-concl{margin:2px 0 6px;font-size:13.5px;line-height:1.55}.pp-impl{margin:6px 0 0;font-size:13px;color:var(--ink2,#3b4256)}
.pp-metrics{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}.pp-m{display:flex;flex-direction:column;min-width:130px;padding:6px 10px;border:1px solid var(--line,#e3e7f0);border-radius:8px;background:var(--card,#fff)}
.pp-m b{font-size:15px;font-variant-numeric:tabular-nums}.pp-m small{font-size:11.5px;color:var(--muted,#7a8399)}
.pp-sup1{margin-bottom:12px}.pp-deep{margin-top:8px;border-top:1px dashed var(--line,#e3e7f0);padding-top:6px;font-size:13px}.pp-deep summary{cursor:pointer;color:var(--ink2,#3b4256);font-weight:600}
.pp-deep dl{display:grid;grid-template-columns:minmax(150px,220px) 1fr;gap:4px 12px;margin:8px 0}.pp-deep dt{color:var(--muted,#7a8399)}.pp-deep dd{margin:0}.pp-deep>.card{margin-top:10px}
.pp-twocol{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;margin-top:10px}.pp-ul{margin:4px 0 0;padding-left:18px}.pp-ul li{margin:2px 0}
.pp-tcard td,.pp-tcard th{font-size:12.8px;vertical-align:top}.pp-hr{border:0;border-top:1px dashed var(--line,#e3e7f0);margin:4px 0}
.pp-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px 12px;margin:8px 0}.pp-form label{display:flex;flex-direction:column;font-size:12px;color:var(--muted,#7a8399)}
.pp-form input{margin-top:3px;padding:6px 8px;border:1px solid var(--line,#d6dbe8);border-radius:7px;font:600 13px Inter,sans-serif;font-variant-numeric:tabular-nums;background:var(--card,#fff);color:var(--ink,#1d2333)}
.pp-kpi .delta.pp-neutral,.kpi .delta.pp-neutral{color:var(--ink2,#3b4256)!important}
.pp-pane .ct-period label:first-child{display:none}
@media (max-width:760px){.pp-tcard table,.pp-expo table{min-width:720px}.pp-twocol{grid-template-columns:1fr}.pp-deep dl{grid-template-columns:1fr}.pp-m{min-width:46%}}
:root[data-theme=dark] .pp-take{background:color-mix(in srgb,var(--card,#141a33) 90%,#6171C5 10%)}
:root[data-theme=dark] .pp-st-Verified{background:#173d27;color:#bfe8cc}:root[data-theme=dark] .pp-st-Estimated{background:#4a3b12;color:#ffe3a6}:root[data-theme=dark] .pp-st-Scenario{background:#33245c;color:#ddd0ff}:root[data-theme=dark] .pp-st-Insufficient{background:#262c3d;color:#b4bbdd;border-color:#3a4260}:root[data-theme=dark] .pp-st-Stale{background:#4a1f1b;color:#ffc9c2}
`;
function start() {
  if (!document.getElementById('pp-style')) { const s = el('style'); s.id = 'pp-style'; s.textContent = CSS + CSS2; document.head.append(s); }
  // Chờ các module khác (power-visuals 300ms, power-hub 600ms sau load) dựng xong card để dời đúng chỗ.
  let n = 0; const t = setInterval(() => {
    const ready = block('dien-mix-today') && block('dien-oni-gauge') && block('dien-output-heatmap') && document.querySelector('.pv-hydro');
    if (ready || ++n > 40) { clearInterval(t); try { build(); } catch (e) { document.documentElement.dataset.ppError = 'build:' + e.message; console.error(e); } }
  }, 150);
}
if (document.readyState === 'complete') setTimeout(start, 700); else addEventListener('load', () => setTimeout(start, 700));
})();
