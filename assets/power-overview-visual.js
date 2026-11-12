/* Điện · Tổng quan ngành, lớp hình ảnh (visual-first, 12/11/2026):
   - map(host, ctx): bản đồ toàn ngành SVG, 3 lớp luồng tách riêng: vật lý (nhiên liệu → điện), thương mại (hợp đồng, thanh toán),
     điều độ & quy định. Bấm từng khâu để xem vai trò; bấm một loại hình để mở chuỗi giá trị chi tiết.
   - tech(host, ctx, id, stage): sơ đồ quy trình riêng của 6 công nghệ (than, khí nội, LNG, thủy điện, gió, mặt trời); mỗi khâu mở
     chức năng kinh tế, chi phí, KPI, chart dữ liệu thật, tác động lên doanh thu/lợi nhuận, doanh nghiệp.
   Nội dung: POWER_OVERVIEW.map_nodes / technologies (data/power-overview.json). Số: POWER_CORE (power-picture.js), POWER_FUEL_PARAMS và
   POWER_FX_MONTHLY (power-visuals.js, tham số QĐ 1692/1882), HYDRO_RESERVOIRS, POWER_HYDRO_ASSETS, POWER_POLICY. Thiếu số thì ghi rõ. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'power') return;
const FLOW = {physical: ['Luồng vật lý', 'nhiên liệu, năng lượng, điện'], commercial: ['Luồng thương mại', 'hợp đồng, mua bán, thanh toán'], dispatch: ['Điều độ & quy định', 'lệnh huy động, giá, cơ chế thị trường']};
const ICON = {
  mine: '<path d="M3 20l5-9 4 5 3-4 6 8z"/>', ship: '<path d="M3 15h18l-3 5H6zM6 15V9h9l3 6M10 9V5h3"/>', flame: '<path d="M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-3-1-5 0-7z"/>',
  turbine: '<circle cx="12" cy="12" r="2"/><path d="M12 10V3M13.7 13l6 3.5M10.3 13l-6 3.5"/>', bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', signal: '<path d="M4 20V14M9 20V10M14 20V6M19 20V3"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>', rig: '<path d="M8 21l4-16 4 16M6 21h12M9.5 14h5M12 5V2"/>', factory: '<path d="M3 21V11l5 3v-3l5 3V5h3v16zM3 21h18"/>',
  pipe: '<path d="M3 9h12a3 3 0 0 1 3 3v9M3 13h10a1 1 0 0 1 1 1v7"/>', port: '<path d="M4 21V9l8-5 8 5v12M9 21v-6h6v6"/>', rain: '<path d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 18 9a3 3 0 0 1 0 6zM8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
  wave: '<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>', dam: '<path d="M4 4h16v8H4zM3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>', gate: '<path d="M5 21V5h14v16M9 21V9h6v12M5 13h14"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8"/>', tower: '<path d="M8 21l4-18 4 18M6 9h12M7 14h10"/>', doc: '<path d="M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>', panel: '<path d="M3 17l3-11h12l3 11zM4.5 11.5h15M9 6l-1 11M15 6l1 11M12 17v4"/>', box: '<rect x="5" y="5" width="14" height="14" rx="2"/>'
};
const icon = k => `<svg class="vz-ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[k] || ICON.box}</svg>`;

/* ===================== Số dùng chung ===================== */
function data(ctx) {
  const {P} = ctx, {rec, fin, sum, mean, median, M, months, CMP} = P;
  // Gió, mặt trời tách riêng (lõi chỉ có "gió & mặt trời" gộp): bình quân ngày theo tháng, chỉ ngày có số.
  const raw = rec('vn_power_daily').filter(r => fin(r.output_mkwh));
  const solarOf = r => fin(r.solar) ? r.solar : fin(r.solar_farm) && fin(r.rooftop_solar) ? r.solar_farm + r.rooftop_solar : null;
  const mon = new Map();
  raw.forEach(r => { const k = r.date.slice(0, 7), m = mon.get(k) || {m: k, w: [], s: [], o: []}; if (fin(r.wind)) m.w.push(r.wind); if (fin(solarOf(r))) m.s.push(solarOf(r)); m.o.push(r.output_mkwh); mon.set(k, m); });
  const dim = m => new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).getUTCDate();
  const avgBy = (k, f) => { const m = mon.get(k); return m && m[f].length / dim(k) >= 0.8 && (!M || k <= M) ? mean(m[f]) : null; };
  // Tỷ trọng từ đầu năm: gió, mặt trời trên cùng các ngày có đủ ba số.
  const y = P.lastDay?.slice(0, 4), ytdRows = raw.filter(r => r.date.startsWith(y) && fin(r.wind) && fin(solarOf(r)));
  const ytdOut = sum(ytdRows.map(r => r.output_mkwh));
  const share = {wind: ytdOut ? sum(ytdRows.map(r => r.wind)) / ytdOut * 100 : null, solar: ytdOut ? sum(ytdRows.map(r => solarOf(r))) / ytdOut * 100 : null};
  // Nước về: trung vị lệch so TB 5 năm cùng tháng, từng tháng (≥80% ngày, nền ≥3 năm, ≥10 hồ) — cùng quy tắc tab Bức tranh ngành.
  const H = window.HYDRO_RESERVOIRS, inflow = [];
  if (H?.monthly?.length) {
    const by = new Map(); H.monthly.forEach(r => { if (!by.has(r.reservoir)) by.set(r.reservoir, new Map()); by.get(r.reservoir).set(r.month, r); });
    const ok = r => r && r.inflow != null && r.days / r.expected >= .8 && r.inflow_n / r.expected >= .8;
    const ms = [...new Set(H.monthly.map(r => r.month))].sort().slice(-18);
    ms.forEach(mo => { const devs = []; by.forEach(res => { const c = res.get(mo); if (!ok(c)) return; const yy = +mo.slice(0, 4), mm = mo.slice(5), b = [];
      for (let k = yy - 5; k < yy; k++) { const x = res.get(k + '-' + mm); if (ok(x)) b.push(x.inflow); } const a = mean(b); if (b.length >= 3 && a > 0) devs.push((c.inflow / a - 1) * 100); });
      inflow.push({m: mo, med: devs.length >= 10 ? median(devs) : null, n: devs.length}); });
  }
  return {raw, avgBy, share, inflow, mon};
}

/* ===================== Chart theo khâu ===================== */
function charts(ctx, D) {
  const {P, POL} = ctx, {rec, fin, nf, sg, pc, esc, ms, dm, ml, back, mount, gap, months, M, fmp, fmpLast, fmpYtd, coal3, jkm3, oni, CMP} = P;
  const FP = window.POWER_FUEL_PARAMS, fxm = window.POWER_FX_MONTHLY ? window.POWER_FX_MONTHLY() : new Map();
  const fxLast = [...fxm.entries()].sort((a, b) => a[0].localeCompare(b[0])).at(-1);
  const wb = rec('wb_energy_monthly');
  const card = (title, sub, src, take) => `<figure class="vz-fig"><figcaption><b>${esc(title)}</b>${sub ? `<span>${sub}</span>` : ''}</figcaption>${take ? `<p class="vz-take">${take}</p>` : ''}<div class="pp-host vz-host"></div><div class="source-note">${src}</div></figure>`;
  const bars = (rows, unit, note) => { const max = Math.max(...rows.filter(r => fin(r.v)).map(r => r.v), 1);
    return `<div class="vz-bars">${rows.map(r => `<div class="vz-bar ${r.cls || ''}"><span>${esc(r.l)}</span><i style="width:${fin(r.v) ? r.v / max * 100 : 0}%;background:${r.c || '#2938A8'}"></i><b>${fin(r.v) ? nf(r.v, r.d ?? 0) : '—'}</b>${r.n ? `<small>${r.n}</small>` : ''}</div>`).join('')}</div><p class="vz-unit">${esc(unit)}${note ? ' · ' + note : ''}</p>`; };
  const seasonal = key => { // key: 'coal' | 'gas' | 'hydro' | 'imports' | 'wind' | 'solar'
    const Y = M ? +M.slice(0, 4) : null; if (!Y) return null;
    const mm = Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
    const val = (yy, m) => { const k = `${yy}-${m}`; if (key === 'wind') return D.avgBy(k, 'w'); if (key === 'solar') return D.avgBy(k, 's'); const r = months.find(x => x.m === k); return r && r.m <= M && r.mixDays / r.n >= 0.8 ? r.avgSrc[key] : null; };
    const used = new Set(), avg = mm.map(m => { const v = []; for (let yy = Y - 4; yy < Y - 1; yy++) { const x = val(yy, m); if (fin(x)) { v.push(x); used.add(yy); } } return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; });
    return {Y, cats: mm.map(m => 'T' + +m), cur: mm.map(m => val(Y, m)), prev: mm.map(m => val(Y - 1, m)), avg, yrs: [...used].sort()};
  };
  const seasonChart = (key, label, color, extra = '') => host => {
    const s = seasonal(key); host.innerHTML = card(`${label}: sản lượng bình quân ngày theo tháng`, 'triệu kWh/ngày · năm nay, năm trước, trung bình các năm trước nữa', `Nguồn: EVN · bản tin vận hành ngày${extra}. Tháng cần ≥80% ngày có số.`,
      s ? (() => { const i = s.cur.map((v, k) => [v, k]).filter(x => fin(x[0])).at(-1); return i ? `${s.cats[i[1]]}/${s.Y}: <b>${nf(i[0], 1)}</b> triệu kWh/ngày, ${pc(s.prev[i[1]] ? (i[0] / s.prev[i[1]] - 1) * 100 : null)} so cùng tháng năm trước.` : ''; })() : '');
    if (!s) { host.querySelector('.vz-host').replaceChildren(gap('chưa đủ dữ liệu.')); return; }
    mount(host.querySelector('.vz-host'), {key: 'vz-season-' + key, categories: s.cats, unit: 'triệu kWh/ngày', digits: 1, zeroBase: false, time: true, height: 230, aria: label,
      series: [{name: String(s.Y), color, kind: 'line', values: s.cur}, {name: String(s.Y - 1), color: '#9AA3BD', kind: 'line', values: s.prev}, ...(s.yrs.length ? [{name: 'TB ' + s.yrs.join('–'), color: '#C9CFDD', kind: 'line', values: s.avg}] : [])]});
  };
  const shareChart = (keys, title) => host => {
    const L = months.filter(m => m.m <= M && m.mixDays / m.n >= 0.8).slice(-24);
    const last = L.at(-1), ly = last && months.find(m => m.m === back(last.m + '-01').slice(0, 7));
    host.innerHTML = card(title, '% sản lượng hệ thống theo tháng', 'Nguồn: EVN · bản tin vận hành ngày; bình quân các ngày có bản tin đủ nguồn.',
      last ? keys.map(([k, n]) => `${n} ${ms(last.m)}: <b>${nf(last.share[k], 1)}%</b>${ly ? ` (cùng kỳ ${nf(ly.share[k], 1)}%)` : ''}`).join(' · ') : '');
    mount(host.querySelector('.vz-host'), {key: 'vz-share-' + keys.map(k => k[0]).join(''), categories: L.map(m => ms(m.m)), unit: '%', digits: 1, zeroBase: false, time: true, height: 230, aria: title,
      series: keys.map(([k, n, c]) => ({name: n, color: c, kind: 'line', values: L.map(m => m.share[k])}))});
  };
  const fuelVsFmp = kind => host => { // chi phí nhiên liệu biến đổi ước tính (đ/kWh) so với FMP
    if (!FP) { host.innerHTML = gap('chưa nạp tham số nhiên liệu (power-visuals.js).').outerHTML; return; }
    const rows = fmp.slice(-24).map(r => { const w = wb.find(x => x.date.slice(0, 7) === r.period), f = fxm.get(r.period)?.v;
      const cost = !w || !f ? null : kind === 'coal' ? (fin(w.coal_au) ? w.coal_au * f / 1000 * FP.HR_COAL / FP.HHV_NC : null) : (fin(w.lng_japan) ? (w.lng_japan + FP.FEE_USD) * FP.HR_GAS / 1e6 * f : null);
      return {p: r.period, fmp: r.fmp, cost}; });
    const dom = kind === 'coal' ? FP.COAL_DOM / 1000 * FP.HR_COAL / FP.HHV_DOM : (FP.GAS_USD + FP.FEE_USD) * FP.HR_GAS / 1e6 * FP.FX_QD;
    const l = [...rows].reverse().find(r => fin(r.cost));
    host.innerHTML = card(kind === 'coal' ? 'Chi phí than/kWh (ước) so với giá thị trường FMP' : 'Chi phí LNG/kWh (ước) so với giá thị trường FMP', 'đ/kWh · tháng',
      `Ước tính theo tham số khung giá: ${kind === 'coal' ? 'than Úc (World Bank) × tỷ giá × 2.411,6 kcal/kWh ÷ 6.000 kcal/kg (QĐ 1692/QĐ-BCT); mốc than nội 2026' : '(LNG Nhật World Bank + cước 1,87 USD/MMBtu) × 6.542,96 BTU/kWh × tỷ giá (QĐ 1882/QĐ-BCT); mốc khí nội 2026'} ≈ ${nf(dom, 0)} đ/kWh. FMP: PGV. Không phải chi phí thực của nhà máy nào.`,
      l ? `${ml(l.p)}: chi phí ${kind === 'coal' ? 'than nhập' : 'LNG'} ≈ <b>${nf(l.cost, 0)}</b> đ/kWh, FMP <b>${nf(l.fmp, 0)}</b> → chênh ${sg(l.fmp - l.cost, 0)} đ/kWh.` : '');
    mount(host.querySelector('.vz-host'), {key: 'vz-fuel-' + kind, categories: rows.map(r => r.p), tickLabels: rows.map(r => ms(r.p)), unit: 'đ/kWh', digits: 0, zeroBase: true, time: true, height: 240, aria: 'Chi phí nhiên liệu so với FMP',
      series: [{name: 'FMP', color: '#861C52', kind: 'line', values: rows.map(r => r.fmp)}, {name: kind === 'coal' ? 'Than nhập (ước)' : 'LNG (ước)', color: kind === 'coal' ? '#3d4653' : '#a35f00', kind: 'line', values: rows.map(r => r.cost)},
        {name: kind === 'coal' ? 'Mốc than nội 2026' : 'Mốc khí nội 2026', color: '#C9CFDD', kind: 'line', values: rows.map(() => dom)}]});
  };
  const ceilingOf = (re, year) => (POL.price_frameworks || []).filter(f => re.test(f.label) && f.year === year);
  const transitional = () => { const t = (POL.price_types || []).find(x => /chuyển tiếp/.test(x.type))?.latest || ''; const g = re => { const m = t.match(re); return m ? +m[1].replace(/\./g, '').replace(',', '.') : null; };
    return {ground: g(/Mặt đất ([\d.,]+)/), floating: g(/nổi ([\d.,]+)/), onshore: g(/gió đất liền ([\d.,]+)/), offshore: g(/gió trên biển ([\d.,]+)/)}; };
  const contract = kind => host => {
    const tr = transitional(), fx = fxLast?.[1]?.v, fit = kind === 'wind' ? [['FIT gió đất liền', 8.5], ['FIT gió trên biển', 9.8]] : [['FIT mặt trời mặt đất', 7.09], ['FIT mặt trời nổi', 7.69], ['FIT mái nhà', 8.38]];
    const fw = ceilingOf(kind === 'wind' ? /^Gió trên bờ$/ : /^Mặt trời mặt đất$/, 2026);
    const rows = [...fit.map(([l, c]) => ({l, v: fx ? c / 100 * fx : null, c: '#1D2678', n: `${nf(c, 2)} US cent`, d: 0})),
      ...(kind === 'wind' ? [{l: 'Trần chuyển tiếp · gió đất liền', v: tr.onshore, c: '#8997D6'}, {l: 'Trần chuyển tiếp · gió trên biển', v: tr.offshore, c: '#8997D6'}] : [{l: 'Trần chuyển tiếp · mặt đất', v: tr.ground, c: '#8997D6'}, {l: 'Trần chuyển tiếp · nổi', v: tr.floating, c: '#8997D6'}]),
      ...fw.map(f => ({l: `Khung giá 2026 · ${f.label.toLowerCase()} · ${f.region}`, v: f.ceiling, c: '#2a9fa3', d: 0})),
      ...(fmpYtd ? [{l: `FMP bình quân ${fmpYtd.n} tháng ${fmpLast.year} (tham chiếu DPPA)`, v: fmpYtd.cur, c: '#861C52'}] : [])];
    host.innerHTML = `<figure class="vz-fig"><figcaption><b>Giá hợp đồng ${kind === 'wind' ? 'điện gió' : 'điện mặt trời'} theo cơ chế</b><span>đ/kWh · FIT quy đổi theo tỷ giá ${fxLast ? ms(fxLast[0]) : '—'}</span></figcaption>
      <p class="vz-take">Cùng một kWh, dự án FIT nhận giá cao hơn nhiều so với giá chuyển tiếp hay trần khung giá mới: rà soát FIT là rủi ro giá lớn nhất của nhóm này.</p>${bars(rows, 'đ/kWh (trần khung giá là mức tối đa đàm phán, không phải giá thực nhận)')}
      <div class="source-note">Nguồn: tab Policy · Tax · Trade (QĐ 13/2020, QĐ 39/2018, QĐ 21/QĐ-BCT, QĐ ${kind === 'wind' ? '2945' : '2946'}/QĐ-BCT); FMP: PGV; tỷ giá: NHNN/WiData.</div></figure>` +
      ((POL.dppa?.models || []).length ? `<div class="vz-dppa">${POL.dppa.models.map(m => `<div><b>DPPA ${esc(m.title.toLowerCase())}</b><div class="vz-mini">${m.flow.map((f, i) => `${i ? '<span aria-hidden="true">→</span>' : ''}<em>${esc(f.t)}${f.d ? `<small>${esc(f.d)}</small>` : ''}</em>`).join('')}</div></div>`).join('')}</div>` : '');
  };
  return {
    coal_price: host => { const L = wb.slice(-36); host.innerHTML = card('Giá than Úc (World Bank)', 'USD/tấn · bình quân tháng', 'Nguồn: World Bank Pink Sheet; Newcastle: ICE futures.', coal3 ? `Newcastle ${nf(coal3.now, 1)} USD/tấn (${dm(coal3.date)}), <b>${pc(coal3.pct)}</b> trong ≈3 tháng.` : '');
      mount(host.querySelector('.vz-host'), {key: 'vz-coalpx', categories: L.map(r => r.date.slice(0, 7)), tickLabels: L.map(r => ms(r.date.slice(0, 7))), unit: 'USD/tấn', digits: 1, zeroBase: false, time: true, height: 230, aria: 'Giá than', series: [{name: 'Than Úc', color: '#3d4653', kind: 'line', values: L.map(r => r.coal_au)}]}); },
    coal_cost: fuelVsFmp('coal'),
    coal_share: shareChart([['coal', 'Than', '#3d4653'], ['hydro', 'Thủy điện', '#2938A8']], 'Than gánh phần thủy điện thiếu như thế nào?'),
    hydro_share: shareChart([['hydro', 'Thủy điện', '#2938A8'], ['coal', 'Than', '#3d4653']], 'Tỷ trọng thủy điện theo mùa'),
    gas_out: seasonChart('gas', 'Khí & dầu (gồm LNG)', '#c98a00', '; khí & dầu gồm cả Nhơn Trạch 3&4 từ 01/2026'),
    gas_cost: host => { if (!FP) { host.innerHTML = gap('chưa nạp tham số nhiên liệu.').outerHTML; return; }
      const dom = (FP.GAS_USD + FP.FEE_USD) * FP.HR_GAS / 1e6 * FP.FX_QD, ceil = ceilingOf(/^Khí thiên nhiên/, 2026)[0];
      host.innerHTML = `<figure class="vz-fig"><figcaption><b>Một kWh điện khí nội: chi phí nhiên liệu, giá thị trường, trần khung giá</b><span>đ/kWh</span></figcaption>
        <p class="vz-take">Chi phí khí/kWh theo tham số khung giá ≈ ${nf(dom, 0)} đ, ${fmpLast && dom > fmpLast.fmp ? 'cao hơn' : 'thấp hơn'} FMP ${fmpLast ? ml(fmpLast.period) : ''}: phần bán ngoài Qc ${fmpLast && dom > fmpLast.fmp ? 'khó có lãi' : 'có biên dương'} khi giá khí ở mức này.</p>
        ${bars([{l: 'Chi phí khí/kWh (11,98 + 1,87 USD/MMBtu, QĐ 1882)', v: dom, c: '#c98a00'}, ...(fmpLast ? [{l: `FMP ${ml(fmpLast.period)}`, v: fmpLast.fmp, c: '#861C52'}] : []), ...(fmpYtd ? [{l: `FMP bình quân ${fmpYtd.n} tháng`, v: fmpYtd.cur, c: '#C98FB0'}] : []), ...(ceil ? [{l: `Trần khung giá khí ${ceil.year} (${ceil.decision})`, v: ceil.ceiling, c: '#1D2678'}] : [])], 'đ/kWh')}
        <div class="source-note">Tham số QĐ 1882/QĐ-BCT (giá khí 11,98 USD/MMBtu, cước 1,87, suất hao 6.542,96 BTU/kWh, tỷ giá 26.378); NT2 công bố giá khí bình quân 9,908 USD/triệu BTU tháng 8/2026 — giá khí từng nhà máy khác tham số.</div></figure>`; },
    lng_price: host => { const L = rec('lng_jkm').slice(-260); host.innerHTML = card('Giá LNG JKM', 'USD/MMBtu · giá đóng cửa phiên, 1 năm', 'Nguồn: ICE futures qua job dữ liệu của trang; LNG Nhật bình quân tháng: World Bank.', jkm3 ? `JKM ${nf(jkm3.now, 2)} USD/MMBtu (${dm(jkm3.date)}), <b>${pc(jkm3.pct)}</b> trong ≈3 tháng.` : '');
      mount(host.querySelector('.vz-host'), {key: 'vz-jkm', categories: L.map(r => r.date), tickLabels: L.map(r => r.date.slice(8, 10) + '/' + r.date.slice(5, 7)), unit: 'USD/MMBtu', digits: 2, zeroBase: false, time: true, height: 230, aria: 'Giá JKM', series: [{name: 'JKM', color: '#a35f00', kind: 'line', values: L.map(r => r.value)}]}); },
    lng_buildup: host => {
      if (!FP) { host.innerHTML = gap('chưa nạp tham số nhiên liệu.').outerHTML; return; }
      const w = [...wb].reverse().find(r => fin(r.lng_japan)), f = fxLast?.[1]?.v, ceil = ceilingOf(/^LNG/, 2025)[0];
      if (!w || !f) { host.innerHTML = gap('thiếu giá LNG Nhật hoặc tỷ giá tháng.').outerHTML; return; }
      const gasP = w.lng_japan + FP.FEE_USD, cost = gasP * FP.HR_GAS / 1e6 * f, part = v => v / gasP * 100;
      host.innerHTML = `<figure class="vz-fig"><figcaption><b>Giá LNG đi vào chi phí một kWh như thế nào? (ước tính)</b><span>${ms(w.date.slice(0, 7))} · tỷ giá ${ms(fxLast[0])}</span></figcaption>
        <div class="vz-build"><div class="vz-stack" role="img" aria-label="Cấu thành giá khí đến nhà máy"><i style="width:${part(w.lng_japan)}%;background:#a35f00">LNG ${nf(w.lng_japan, 2)}</i><i style="width:${part(FP.FEE_USD)}%;background:#d9a54a">cước ${nf(FP.FEE_USD, 2)}</i></div>
          <div class="vz-eq"><span>= ${nf(gasP, 2)} USD/MMBtu đến nhà máy</span><span>× ${nf(FP.HR_GAS, 0)} BTU/kWh × ${nf(f, 0)} đ/USD</span><b>≈ ${nf(cost, 0)} đ/kWh nhiên liệu</b></div></div>
        ${bars([{l: 'Chi phí LNG/kWh (ước)', v: cost, c: '#a35f00'}, ...(fmpLast ? [{l: `FMP ${ml(fmpLast.period)}`, v: fmpLast.fmp, c: '#861C52'}] : []), ...(ceil ? [{l: `Trần khung giá LNG ${ceil.year} (${ceil.decision})`, v: ceil.ceiling, c: '#1D2678'}] : [])], 'đ/kWh')}
        <p class="vz-take">Phí kho cảng, tái hóa khí và điều khoản bao tiêu của hợp đồng thực tế chưa công bố; cước dùng tham số khí nội QĐ 1882 nên chi phí thực có thể cao hơn.</p>
        <div class="source-note">LNG Nhật: World Bank; tham số: QĐ 1882/QĐ-BCT; trần LNG: QĐ 1313/QĐ-BCT (2025, khung 2026 chưa ban hành). Không phải giá nhiên liệu của Nhơn Trạch 3&4.</div></figure>`; },
    oni: host => { const L = oni.slice(-72); host.innerHTML = card('ONI — chỉ số El Niño / La Niña', '°C · trung bình trượt 3 tháng; ≥ +0,5 El Niño, ≤ −0,5 La Niña', 'Nguồn: NOAA CPC (ERSSTv5).', L.length ? `${L.at(-1).season} ${L.at(-1).year}: <b>${sg(L.at(-1).oni, 2)} °C</b>.` : '');
      mount(host.querySelector('.vz-host'), {key: 'vz-oni', categories: L.map(r => r.date.slice(0, 7)), tickLabels: L.map(r => r.season + ' ' + String(r.year).slice(2)), unit: '°C', digits: 2, zeroBase: true, time: true, height: 230, aria: 'ONI', series: [{name: 'ONI', color: '#b8443a', kind: 'bar', values: L.map(r => r.oni)}]}); },
    inflow: host => { const L = D.inflow.filter(x => x.med != null); host.innerHTML = card('Nước về các hồ so với trung bình 5 năm', '% · trung vị các hồ đủ số liệu, theo tháng', 'Nguồn: EVN hồ chứa (ảnh chụp 00h); tháng cần ≥80% ngày, nền ≥3 năm, ≥10 hồ.', L.length ? `${ml(L.at(-1).m)}: <b>${pc(L.at(-1).med, 0)}</b> (${L.at(-1).n} hồ).` : '');
      if (!L.length) { host.querySelector('.vz-host').replaceChildren(gap('chưa đủ hồ có số liệu.')); return; }
      mount(host.querySelector('.vz-host'), {key: 'vz-inflow', categories: L.map(x => x.m), tickLabels: L.map(x => ms(x.m)), unit: '%', digits: 0, zeroBase: true, time: true, height: 230, aria: 'Nước về so trung bình 5 năm', series: [{name: 'Trung vị lệch', color: '#2938A8', kind: 'bar', values: L.map(x => x.med)}]}); },
    ownership: host => { const A = window.POWER_HYDRO_ASSETS, rows = (A?.rows || []).filter(r => r.ticker && /xác minh/i.test(r.status));
      host.innerHTML = `<figure class="vz-fig"><figcaption><b>Hồ nào thuộc doanh nghiệp niêm yết?</b><span>${rows.length} hồ đã xác minh chủ sở hữu có mã · kiểm ${esc(A?.checked_at || '—')}</span></figcaption>
        <div class="vz-own">${rows.map(r => `<span><b>${esc(r.reservoir)}</b>${r.plant_mw ? ` ${nf(r.plant_mw, 0)} MW` : ''} → ${ctx.chip(r.ticker, r.owner)}${/một phần/.test(r.status) ? '<small>một phần</small>' : ''}</span>`).join('') || '<span class="muted">Chưa có dữ liệu sở hữu.</span>'}</div>
        <div class="source-note">Nguồn: data/power-hydro-assets (mỗi dòng có nguồn đã mở). Hồ trong dữ liệu EVN không mặc nhiên là tài sản doanh nghiệp niêm yết. Bản đồ mực nước từng hồ: <a href="?section=hydro#mt2" data-pp-go="hydro">Bức tranh ngành › Thủy văn</a>.</div></figure>`; },
    hydro_out: seasonChart('hydro', 'Thủy điện', '#2938A8'),
    wind_out: seasonChart('wind', 'Điện gió', '#2a9fa3'),
    solar_out: seasonChart('solar', 'Điện mặt trời (trang trại + mái nhà)', '#e0a100', '; mái nhà là số EVN ước tính'),
    curtail: host => { const y = P.lastDay?.slice(0, 4), w = D.share.wind, s = D.share.solar;
      host.innerHTML = `<figure class="vz-fig"><figcaption><b>Tiềm năng → cắt giảm → thực phát</b><span>doanh thu chỉ tính trên thực phát</span></figcaption>
        <div class="vz-curt"><div class="vz-c1"><b>Sản lượng tiềm năng</b><small>theo gió/bức xạ và công suất lắp đặt · <em>chưa có dữ liệu</em></small></div><span aria-hidden="true">−</span>
        <div class="vz-c2"><b>Cắt giảm</b><small>NSMO giảm phát khi nghẽn lưới, dư nguồn · <em>chưa có dữ liệu công khai</em></small></div><span aria-hidden="true">=</span>
        <div class="vz-c3"><b>Thực phát</b><small>EVN · từ đầu năm ${esc(y || '')}: gió ${nf(w, 1)}%, mặt trời ${nf(s, 1)}% sản lượng hệ thống</small></div><span aria-hidden="true">×</span>
        <div class="vz-c4"><b>Giá hợp đồng</b><small>FIT / chuyển tiếp / khung giá / DPPA</small></div><span aria-hidden="true">=</span><div class="vz-c5"><b>Doanh thu</b><small>trước nợ vay</small></div></div>
        <div class="source-note">EVN · bản tin vận hành ngày. Cần thêm: sản lượng tiềm năng và sản lượng bị cắt giảm theo nhà máy (NSMO/EVN chưa công bố chuỗi công khai mà trang lấy được).</div></figure>`; },
    contract_wind: contract('wind'), contract_solar: contract('solar'),
    settlement: (host, tech) => settlement(host, ctx, tech)
  };
}

/* ===================== Bán điện: PPA, Qc, FMP, thanh toán ===================== */
function settlement(host, ctx, tech) {
  const {P, O} = ctx, {nf, esc, ml, fmpLast} = P;
  let qc = tech.qc ?? 80;
  host.innerHTML = `<figure class="vz-fig vz-settle"><figcaption><b>Một kWh được trả tiền thế nào?</b><span>minh họa cơ chế, không phải số của nhà máy cụ thể</span></figcaption>
    <svg class="vz-svg" viewBox="0 0 760 250" role="img" aria-label="Sơ đồ thanh toán: nhà máy, NSMO, EPTC">
      <defs><marker id="vzA-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7a3fa0"/></marker><marker id="vzA-d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#d26a00"/></marker><marker id="vzA-p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${tech.color}"/></marker></defs>
      <rect x="20" y="95" width="170" height="64" rx="10" class="vz-box" style="stroke:${tech.color}"/><text x="105" y="122" class="vz-t">Nhà máy</text><text x="105" y="142" class="vz-s">phát Q kWh</text>
      <rect x="300" y="14" width="170" height="60" rx="10" class="vz-box vz-dis"/><text x="385" y="40" class="vz-t">NSMO</text><text x="385" y="59" class="vz-s">điều độ · SMP, CAN → FMP</text>
      <rect x="300" y="178" width="170" height="60" rx="10" class="vz-box vz-com"/><text x="385" y="204" class="vz-t">EVN / EPTC</text><text x="385" y="223" class="vz-s">bên mua · thanh toán</text>
      <rect x="570" y="95" width="170" height="64" rx="10" class="vz-box"/><text x="655" y="122" class="vz-t">Lưới → khách hàng</text><text x="655" y="142" class="vz-s">điện năng</text>
      <path d="M190 127H566" class="vz-l-p" style="stroke:${tech.color}" marker-end="url(#vzA-p)"/><text x="380" y="120" class="vz-s">điện năng (luồng vật lý)</text>
      <path d="M330 74V91L190 108" class="vz-l-d" marker-end="url(#vzA-d)"/><text x="232" y="84" class="vz-s vz-sd">lệnh huy động</text>
      <path d="M440 74V176" class="vz-l-d" marker-end="url(#vzA-d)"/><text x="448" y="168" class="vz-s vz-sd" text-anchor="start">bảng kê thị trường</text>
      <path d="M300 208H110V163" class="vz-l-c" marker-end="url(#vzA-c)"/><text x="200" y="200" class="vz-s vz-sc">tiền điện hằng tháng</text>
    </svg>
    <div class="vz-qc"><label>Tỷ lệ Qc <input type="range" min="60" max="100" step="1" value="${qc}" aria-label="Tỷ lệ Qc"> <b data-qc>${qc}%</b></label>
      <div class="vz-qcbar" role="img" aria-label="Phân chia sản lượng theo cách thanh toán"><i data-a style="background:#1D2678"></i><i data-b style="background:#861C52"></i></div>
      <div class="vz-qcleg"><span><i style="background:#1D2678"></i>Phần Qc: trả theo giá PPA (hợp đồng sai khác với EPTC)</span><span><i style="background:#861C52"></i>Phần còn lại: trả theo FMP${fmpLast ? ` (${ml(fmpLast.period)}: ${nf(fmpLast.fmp, 0)} đ/kWh)` : ''}</span></div>
      <p class="vz-take">Mặc định: ${esc(String(tech.qc ?? '—'))}% (${esc(tech.stages.find(s => s.id === 'sell')?.kpi.match(/\(([^)]*)\)/)?.[1] || '')}). Qc càng cao, doanh thu càng ít phụ thuộc giá thị trường.</p></div>
    <details class="vz-mech"><summary>PPA · Qc · SMP · CAN · FMP nghĩa là gì?</summary>${O.mechanisms.filter(m => m.id !== 'DPPA').map(m => `<p><b>${esc(m.label)}:</b> ${esc(m.l1)}</p>`).join('')}<p class="muted">Doanh thu ≈ Qc × giá PPA + (Q − Qc) × FMP (xấp xỉ, bỏ qua điều chỉnh CAN, phí và sai lệch sản lượng). Chi tiết pháp lý: <a href="?policy=market#mt4" data-ov-policy="market">tab Policy › Điều độ & Thị trường</a>.</p></details></figure>`;
  const r = host.querySelector('input'), set = () => { qc = +r.value; host.querySelector('[data-qc]').textContent = qc + '%'; host.querySelector('[data-a]').style.width = qc + '%'; host.querySelector('[data-b]').style.width = (100 - qc) + '%'; host.querySelector('[data-a]').textContent = qc >= 12 ? `Qc ${qc}%` : ''; host.querySelector('[data-b]').textContent = 100 - qc >= 12 ? `thị trường ${100 - qc}%` : ''; };
  r.addEventListener('input', set); set();
}

/* ===================== Module 00 · bản đồ ngành ===================== */
const ROWS = [['coal', 'Than nội & nhập khẩu'], ['gas', 'Khí mỏ trong nước'], ['lng', 'LNG nhập khẩu'], ['hydro', 'Nước về hồ'], ['wind', 'Gió'], ['solar', 'Bức xạ mặt trời'], ['import', 'Lào, Trung Quốc']];
function map(host, ctx) {
  const {P, O} = ctx, {nf, esc, CMP} = P, D = data(ctx), T = Object.fromEntries(O.technologies.map(t => [t.id, t])), N = O.map_nodes;
  const y0 = 104, step = 52, h = 40, rowY = i => y0 + i * step, mid = i => rowY(i) + h / 2, colB = ROWS.length;
  const shareOf = id => id === 'wind' ? D.share.wind : id === 'solar' ? D.share.solar : id === 'import' ? CMP.ytd?.get('imports')?.shareCur : id === 'gas' ? CMP.ytd?.get('gas')?.shareCur : id === 'lng' ? null : CMP.ytd?.get(T[id]?.mix)?.shareCur;
  const color = id => T[id]?.color || '#9AA3BD';
  const plantLabel = id => id === 'import' ? 'Nhập khẩu điện' : T[id].long;
  const plantSub = id => { const s = shareOf(id); return id === 'lng' ? 'Nhơn Trạch 3&4 · 1.624 MW' : id === 'gas' ? `khí, dầu & LNG ${nf(s, 1)}% sản lượng` : `${nf(s, 1)}% sản lượng từ đầu năm`; };
  const box = (id, x, y, w, hh, t, s, cls = '', style = '') => `<g class="vm-node ${cls}" data-node="${id}" tabindex="0" role="button" aria-label="${esc(t)}"><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="9" style="${style}"/><text x="${x + w / 2}" y="${y + (s ? hh / 2 - 3 : hh / 2 + 4)}" class="vm-t">${esc(t)}</text>${s ? `<text x="${x + w / 2}" y="${y + hh / 2 + 13}" class="vm-s">${esc(s)}</text>` : ''}</g>`;
  const yB = rowY(colB) + 14, yE = yB + 62, H2 = yE + 54;
  const svg = `<svg class="vm-svg" viewBox="0 0 1080 ${H2}" role="group" aria-label="Bản đồ chuỗi giá trị ngành điện Việt Nam">
    <defs>${[['p', '#5b6378'], ['c', '#7a3fa0'], ['d', '#d26a00']].map(([k, c]) => `<marker id="vmA-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')}</defs>
    <text x="102" y="96" class="vm-col">Nhiên liệu · tài nguyên</text><text x="330" y="96" class="vm-col">Nhà máy phát điện</text><text x="530" y="96" class="vm-col">Truyền tải</text><text x="695" y="96" class="vm-col">Phân phối</text><text x="895" y="96" class="vm-col">Khách hàng</text>
    <g class="vm-layer vm-dis">
      ${box('moit', 230, 6, 200, 42, N.moit.t, 'quy hoạch · khung giá · Qc', 'vm-dis')}${box('nsmo', 470, 6, 260, 42, 'NSMO', 'điều độ · thị trường điện (SMP, FMP)', 'vm-dis')}
      <path d="M430 27H466" class="vm-l-d" marker-end="url(#vmA-d)"/><path d="M520 48V60H360V${rowY(0) - 2}" class="vm-l-d" marker-end="url(#vmA-d)"/><text x="440" y="74" class="vm-lab vm-ld">lệnh huy động theo bản chào 30 phút</text>
      <path d="M640 48V${rowY(0) - 2}" class="vm-l-d" marker-end="url(#vmA-d)"/><text x="648" y="74" class="vm-lab vm-ld" text-anchor="start">vận hành hệ thống</text></g>
    <g class="vm-layer vm-phy">
      ${ROWS.map(([id, src], i) => `<g class="vm-row" data-tech="${id}">${box(id, 14, rowY(i), 176, h, src, '', 'vm-src', `stroke:${color(id)}`)}${box(id, 230, rowY(i), 200, h, plantLabel(id), plantSub(id), 'vm-plant', `stroke:${color(id)};fill:color-mix(in srgb,${color(id)} 9%,var(--card,#fff))`)}
        <path d="M190 ${mid(i)}H226" class="vm-l-p" style="stroke:${color(id)}" marker-end="url(#vmA-p)"/><path d="M430 ${mid(i) - 4}H${id === 'import' ? 476 : 476}" class="vm-l-p" style="stroke:${color(id)}" marker-end="url(#vmA-p)"/></g>`).join('')}
      ${box('trans', 480, rowY(0), 100, rowY(colB - 1) + h - rowY(0), 'EVNNPT', '500/220 kV', 'vm-grid')}${box('dist', 640, rowY(0), 110, rowY(colB - 1) + h - rowY(0), 'Điện lực', '110 kV trở xuống', 'vm-grid')}
      ${box('user', 810, rowY(0), 170, rowY(colB - 1) + h - rowY(0), 'Khách hàng', 'sản xuất · dịch vụ · sinh hoạt', 'vm-grid')}
      <path d="M580 ${mid(3)}H636" class="vm-l-p vm-thick" marker-end="url(#vmA-p)"/><path d="M750 ${mid(3)}H806" class="vm-l-p vm-thick" marker-end="url(#vmA-p)"/></g>
    <g class="vm-layer vm-com">
      ${box('eptc', 230, yB, 350, 42, 'EVN / EPTC', 'bên mua buôn · thanh toán tiền điện cho nhà máy', 'vm-com')}${box('pc', 640, yB, 110, 42, 'Thu tiền điện', 'biểu giá bán lẻ', 'vm-com')}${box('dppa', 810, yB, 170, 42, 'DPPA', 'khách lớn ↔ nhà máy NLTT', 'vm-com')}
      <path d="M895 ${rowY(colB - 1) + h}V${yB - 4}" class="vm-l-c"/><path d="M860 ${rowY(colB - 1) + h + 6}V${yB + 21}H754" class="vm-l-c" marker-end="url(#vmA-c)"/><path d="M640 ${yB + 21}H584" class="vm-l-c" marker-end="url(#vmA-c)"/>
      <path d="M445 ${yB}V${rowY(0) + 8}" class="vm-l-c"/>${ROWS.slice(0, colB).map((r, i) => `<path d="M445 ${mid(i) + 9}H434" class="vm-l-c" marker-end="url(#vmA-c)"/>`).join('')}
      <text x="452" y="${yB - 6}" class="vm-lab vm-lc" text-anchor="start">PPA: Qc × giá HĐ + thị trường</text><text x="790" y="${yB + 36}" class="vm-lab vm-lc" text-anchor="end">tiền điện</text></g>
    <g class="vm-layer vm-epc">${box('epc', 230, yE, 520, 40, N.epc.t, 'xây nhà máy, đường dây, trạm · PC1 · TV2 · GEX', 'vm-epc')}<path d="M330 ${yE}V${yB + 46}" class="vm-l-e" marker-end="url(#vmA-p)"/><path d="M530 ${yE}V${yB + 46}" class="vm-l-e"/></g>
  </svg>`;
  host.innerHTML = `<div class="vm-ctl" role="group" aria-label="Lớp luồng">${Object.entries(FLOW).map(([k, v]) => `<button type="button" data-layer="${k}" aria-pressed="true"><i class="vm-k-${k}"></i>${v[0]}<small>${v[1]}</small></button>`).join('')}</div>
    <div class="vm-scroll">${svg}</div><div class="vm-detail" aria-live="polite"><span class="muted">Bấm một khâu để xem vai trò; bấm một loại hình phát điện để mở chuỗi giá trị chi tiết.</span></div>`;
  const s = host.querySelector('svg'), det = host.querySelector('.vm-detail');
  host.querySelectorAll('[data-layer]').forEach(b => b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); s.classList.toggle('vm-off-' + b.dataset.layer, !on); }));
  const pick = id => {
    s.querySelectorAll('.vm-node').forEach(n => n.classList.toggle('on', n.dataset.node === id)); s.querySelectorAll('.vm-row').forEach(r => r.classList.toggle('dim', !!T[id] || id === 'import' ? r.dataset.tech !== id : false));
    const t = T[id];
    if (t) { const g = ctx.insFor(t.groups[0]); det.innerHTML = `<div class="vm-dh" style="--c:${t.color}"><b>${esc(t.long)}</b><span>${esc(t.source)} · ${esc(plantSub(id))}</span></div>
      <div class="vm-flow">${t.stages.map((st, i) => `${i ? '<span aria-hidden="true">→</span>' : ''}<em class="vz-f-${st.flow}">${esc(st.t)}</em>`).join('')}</div>
      ${g.length ? `<ul class="ov-list">${g.slice(0, 2).map(ctx.insLine).join('')}</ul>` : ''}<p>${ctx.chips(t.groups[0])}</p><a class="ov-more" href="?ov=tech&t=${id}#mt1" data-ov-tech="${id}">Mở chuỗi giá trị ${esc(t.long.toLowerCase())} →</a>`; return; }
    const n = N[id] || (id === 'import' ? N.import : null); if (!n) return;
    const go = n.go || {};
    det.innerHTML = `<div class="vm-dh"><b>${esc(n.t)}</b></div><p>${esc(n.d)}</p>${n.tickers ? `<p>${n.tickers.map(x => ctx.chip(x)).join(' ')}</p>` : ''}${go.pp ? `<a class="ov-more" href="?section=${go.pp}#mt2" data-pp-go="${go.pp}">Xem dữ liệu ở Bức tranh ngành →</a>` : ''}${go.policy ? `<a class="ov-more" href="?policy=${go.policy}#mt4" data-ov-policy="${go.policy}">Xem cơ chế ở tab Policy →</a>` : ''}${go.ov ? `<a class="ov-more" href="?ov=${go.ov}#mt1" data-ov-go="${go.ov}">Xem tác động đầu tư →</a>` : ''}`;
  };
  s.addEventListener('click', e => { const n = e.target.closest('.vm-node'); if (n) pick(n.dataset.node); });
  s.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.vm-node')) { e.preventDefault(); pick(e.target.closest('.vm-node').dataset.node); } });
}

/* ===================== Module 01 · chuỗi giá trị theo công nghệ ===================== */
function tech(host, ctx, id0, stage0) {
  const {P, O} = ctx, {nf, pc, esc, CMP} = P, D = data(ctx), C = charts(ctx, D);
  host.innerHTML = `<div class="vt-sel" role="tablist" aria-label="Công nghệ phát điện">${O.technologies.map(t => `<button type="button" role="tab" data-t="${t.id}" style="--c:${t.color}">${esc(t.label)}</button>`).join('')}</div><div class="vt-body"></div>`;
  const body = host.querySelector('.vt-body');
  const show = (id, sid) => {
    const t = O.technologies.find(x => x.id === id) || O.technologies[0];
    host.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === t.id)));
    const x3 = CMP.q?.ok ? CMP.q.get(t.mix === 'wind' || t.mix === 'solar' ? 're' : t.mix) : null;
    const sh = t.mix === 'wind' ? D.share.wind : t.mix === 'solar' ? D.share.solar : CMP.ytd?.get(t.mix)?.shareCur;
    body.innerHTML = `<div class="vt-head" style="--c:${t.color}"><div><b>${esc(t.long)}</b><span>${esc(t.source)}</span></div>
        <div class="vt-kpi"><span>Tỷ trọng sản lượng từ đầu năm<b>${nf(sh, 1)}%</b>${t.id === 'gas' || t.id === 'lng' ? '<small>khí, dầu & LNG gộp</small>' : ''}</span><span>3 tháng so cùng kỳ<b class="${x3?.yoy > 0 ? 'up' : x3?.yoy < 0 ? 'dn' : ''}">${pc(x3?.yoy)}</b><small>${t.mix === 'wind' || t.mix === 'solar' ? 'gió & mặt trời gộp' : t.id === 'gas' || t.id === 'lng' ? 'khí & dầu' : ''}</small></span>${t.qc != null ? `<span>Qc<b>${t.qc}%</b><small>${t.id === 'lng' ? 'tối thiểu' : 'nguồn thứ cấp'}</small></span>` : ''}</div></div>
      <div class="vt-legend">${Object.entries(FLOW).map(([k, v]) => `<span><i class="vz-k-${k}"></i>${v[0]}</span>`).join('')}</div>
      <ol class="vt-chain" aria-label="Quy trình ${esc(t.long)}">${t.stages.map((st, i) => `<li><button type="button" class="vt-st vz-f-${st.flow}" data-s="${st.id}" style="--c:${t.color}">${icon(st.icon)}<b>${esc(st.t)}</b><small>${esc(st.s)}</small>${st.chart ? '<i class="vt-dot" title="có chart dữ liệu">●</i>' : ''}</button></li>`).join('')}</ol>
      <div class="vt-detail"></div>
      <div class="vt-foot"><div><h4>Rủi ro chính</h4><ul class="ov-list">${(O.source_profiles[t.groups[0]]?.risks || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul></div><div><h4>Doanh nghiệp có tài sản</h4><p>${ctx.chips(t.groups[0])}</p></div></div>`;
    const det = body.querySelector('.vt-detail');
    const pickStage = sid2 => {
      const st = t.stages.find(s => s.id === sid2) || t.stages[0];
      body.querySelectorAll('.vt-st').forEach(b => { const on = b.dataset.s === st.id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      const tk = ctx.expo(t.groups[0]);
      det.innerHTML = `<div class="vt-dgrid"><div class="vt-txt"><h4>${icon(st.icon)}${esc(st.t)} <span class="vz-tag vz-f-${st.flow}">${FLOW[st.flow][0]}</span></h4>
        <dl><dt>Chức năng kinh tế</dt><dd>${esc(st.fn)}</dd><dt>Chi phí chủ đạo</dt><dd>${esc(st.cost)}</dd><dt>KPI vận hành</dt><dd>${esc(st.kpi)}</dd><dt>Tác động DT / LN</dt><dd>${esc(st.impact)}</dd><dt>Doanh nghiệp</dt><dd>${tk.map(e => ctx.chip(e.t, `${e.t} · ${e.role}: ${e.note}`)).join(' ')}</dd></dl></div>
        <div class="vt-chart"></div></div>`;
      const ch = det.querySelector('.vt-chart');
      if (st.chart && C[st.chart]) { try { C[st.chart](ch, t); } catch (e) { ch.replaceChildren(P.gap('lỗi dựng chart: ' + esc(e.message))); } } else ch.innerHTML = '<div class="vz-none">Khâu này chưa có chuỗi dữ liệu công khai trên trang. Các khâu có ● có chart dữ liệu.</div>';
      ctx.onState?.({t: t.id, s: st.id});
      P.refit(det);
    };
    body.querySelectorAll('.vt-st').forEach(b => b.addEventListener('click', () => pickStage(b.dataset.s)));
    pickStage(sid && t.stages.some(s => s.id === sid) ? sid : (t.stages.find(s => s.chart && s.chart !== 'settlement') || t.stages[0]).id);
  };
  host.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => show(b.dataset.t)));
  show(id0 || 'coal', stage0);
  return {show};
}


/* ===================== Module 02 · kinh tế đơn vị ===================== */
// Waterfall HTML: các bước cộng/trừ, cột tổng; số âm/dương có màu riêng.
function waterfall(steps, unit, digits = 0) {
  const fin = Number.isFinite, nf = (v, d) => !fin(v) ? '—' : Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
  let run = 0; const rows = steps.map(s => { if (s.total) { const r = {...s, a: 0, b: s.v}; run = s.v; return r; } const a = run, b = run + s.v; run = b; return {...s, a, b}; });
  const lo = Math.min(0, ...rows.map(r => Math.min(r.a, r.b))), hi = Math.max(0, ...rows.map(r => Math.max(r.a, r.b))) || 1, span = hi - lo || 1, pos = v => (v - lo) / span * 100;
  return `<div class="vw" role="img" aria-label="Waterfall ${unit}">${rows.map(r => { const x = Math.min(pos(r.a), pos(r.b)), w = Math.max(Math.abs(pos(r.b) - pos(r.a)), .4);
    return `<div class="vw-r ${r.total ? 'tot' : r.v < 0 ? 'neg' : 'pos'}"><span>${r.l}</span><div class="vw-t"><i style="left:${x}%;width:${w}%"></i>${lo < 0 ? `<b class="vw-0" style="left:${pos(0)}%"></b>` : ''}</div><em>${r.total ? '' : r.v > 0 ? '+' : ''}${nf(r.v, digits)}</em></div>`; }).join('')}</div><p class="vz-unit">${unit}</p>`;
}
function unit(host, ctx) {
  const {P, O, POL} = ctx, {rec, fin, nf, sg, pc, esc, ml, ms, fmpLast, gap} = P;
  const FP = window.POWER_FUEL_PARAMS, fxm = window.POWER_FX_MONTHLY ? window.POWER_FX_MONTHLY() : new Map();
  const fxLast = [...fxm.entries()].sort((a, b) => a[0].localeCompare(b[0])).at(-1), fx = fxLast?.[1]?.v;
  const wb = rec('wb_energy_monthly'), w = [...wb].reverse().find(r => fin(r.coal_au) && fin(r.lng_japan));
  const ceil = re => (POL.price_frameworks || []).filter(f => re.test(f.label)).sort((a, b) => b.year - a.year)[0];
  // 1) Một kWh theo công nghệ: chi phí nhiên liệu biến đổi (ước) so với FMP và trần khung giá.
  const kwh = [];
  if (FP && w && fx) {
    kwh.push(['Than nhập', w.coal_au * fx / 1000 * FP.HR_COAL / FP.HHV_NC, ceil(/^Than$/), '#3d4653'], ['Than nội (mốc 2026)', FP.COAL_DOM / 1000 * FP.HR_COAL / FP.HHV_DOM, ceil(/^Than$/), '#5b6378'],
      ['Khí nội (mốc 2026)', (FP.GAS_USD + FP.FEE_USD) * FP.HR_GAS / 1e6 * FP.FX_QD, ceil(/^Khí thiên nhiên/), '#c98a00'], ['LNG', (w.lng_japan + FP.FEE_USD) * FP.HR_GAS / 1e6 * fx, ceil(/^LNG/), '#a35f00'], ['Thủy điện', 0, ceil(/^Thủy điện$/), '#2938A8']);
  }
  const maxK = Math.max(...kwh.map(k => Math.max(k[1], k[2]?.ceiling || 0)), fmpLast?.fmp || 0, 1);
  const kwhHtml = kwh.length ? `<div class="vu-kwh">${kwh.map(([l, c, cl, col]) => `<div class="vu-k"><span>${esc(l)}</span><div class="vu-kt"><i style="width:${c / maxK * 100}%;background:${col}"></i>${fmpLast ? `<b class="vu-fmp" style="left:${fmpLast.fmp / maxK * 100}%" title="FMP ${ml(fmpLast.period)}"></b>` : ''}${cl ? `<b class="vu-ceil" style="left:${cl.ceiling / maxK * 100}%" title="Trần khung giá ${cl.year}: ${nf(cl.ceiling, 0)} đ/kWh"></b>` : ''}</div><em>${nf(c, 0)}${cl ? `<small>trần ${nf(cl.ceiling, 0)}</small>` : ''}</em></div>`).join('')}</div>
    <div class="vu-leg"><span><i class="vu-fmp-k"></i>FMP ${fmpLast ? ml(fmpLast.period) + ' ' + nf(fmpLast.fmp, 0) + ' đ/kWh' : ''}</span><span><i class="vu-ceil-k"></i>trần khung giá phát điện gần nhất (mức tối đa đàm phán PPA)</span></div>` : gap('thiếu tham số nhiên liệu hoặc tỷ giá.').outerHTML;
  // 2) Waterfall và cầu nối lợi nhuận từ BCTC quý (doanh thu, lãi gộp, lãi ròng: số thật).
  const Q = window.COMPANY_QUARTERLY, cos = (Q?.companies || []).filter(c => c.sector === 'power' && c.revenue?.some(fin));
  const qs = Q?.quarters || [];
  // 3) Bộ thử kịch bản.
  const S = O.scenario;
  host.innerHTML = `<section class="vu-sec"><h4>Một kWh tốn bao nhiêu nhiên liệu so với giá bán?</h4><p class="vz-take">Thanh = chi phí nhiên liệu biến đổi ước tính (đ/kWh). Vạch đỏ = FMP; vạch xanh đậm = trần khung giá. Nhiên liệu càng gần FMP, phần bán ngoài Qc càng mỏng.</p>${kwhHtml}
      <div class="source-note">Tham số QĐ 1692/QĐ-BCT (than: 2.411,6 kcal/kWh; nhiệt trị than nhập 6.000, than nội 5.012,61 kcal/kg; than nội 1.962.004 đ/tấn), QĐ 1882/QĐ-BCT (khí: 6.542,96 BTU/kWh; 11,98 + 1,87 USD/MMBtu); than Úc, LNG Nhật: World Bank ${w ? ms(w.date.slice(0, 7)) : ''}; tỷ giá ${fxLast ? ms(fxLast[0]) : ''}. Chưa gồm chi phí vận hành, khấu hao, lãi vay.</div></section>
    <section class="vu-sec"><h4>Doanh thu đi tới lãi ròng thế nào? (BCTC quý, số thật)</h4>
      <div class="ov-ctl"><label>Mã <select data-co>${cos.map(c => `<option>${esc(c.symbol)}</option>`).join('')}</select></label><label>Quý <select data-q>${qs.map((q, i) => `<option value="${i}">${esc(q)}</option>`).reverse().join('')}</select></label><span class="muted" data-grp></span></div>
      <div class="vu-two"><div data-wf></div><div data-br></div></div>
      <div class="source-note">COMPANY_QUARTERLY (BCTC hợp nhất quý, nguồn ghi ở tab Tổng quan › So sánh tài chính). "Chi phí khác ròng" = lãi gộp − lãi ròng (bán hàng, quản lý, tài chính ròng, thuế, lợi ích CĐ không kiểm soát…): BCTC trên trang chưa tách các khoản này.</div></section>
    <section class="vu-sec vu-scn"><h4>Thử kịch bản: đổi giá, sản lượng, Qc → lợi nhuận một nhà máy giả định</h4>
      <p class="vz-take vu-warn">${esc(S.note)}</p>
      <div class="ov-ctl" role="group" aria-label="Loại nhà máy">${Object.entries(S.techs).map(([k, t], i) => `<button type="button" data-tk="${k}" aria-pressed="${!i}">${esc(t.label)}</button>`).join('')}</div>
      <div class="vu-scn-g"><div class="vu-in"></div><div><div data-swf></div><p class="vz-take" data-sum></p></div></div></section>`;
  // --- waterfall công ty
  const coSel = host.querySelector('[data-co]'), qSel = host.querySelector('[data-q]');
  const drawCo = () => {
    const c = cos.find(x => x.symbol === coSel.value), i = +qSel.value; if (!c) return;
    host.querySelector('[data-grp]').textContent = c.group || '';
    const R = c.revenue[i], G = c.gross_profit[i], N = c.net_income[i];
    const wf = host.querySelector('[data-wf]'), br = host.querySelector('[data-br]');
    if (![R, G, N].every(fin)) { wf.replaceChildren(gap(`${c.symbol} chưa có đủ số quý ${qs[i]}.`)); br.innerHTML = ''; return; }
    wf.innerHTML = `<b class="vu-h">${esc(c.symbol)} · ${esc(qs[i])}</b>` + waterfall([{l: 'Doanh thu', v: R, total: true}, {l: 'Giá vốn', v: G - R}, {l: 'Lãi gộp', v: G, total: true}, {l: 'Chi phí khác ròng', v: N - G}, {l: 'Lãi ròng', v: N, total: true}], `tỷ đồng · biên gộp ${nf(G / R * 100, 1)}% · biên ròng ${nf(N / R * 100, 1)}%`);
    // Cầu nối lãi ròng so cùng kỳ: hiệu ứng doanh thu (theo biên gộp kỳ trước) + hiệu ứng biên gộp + chi phí khác.
    const j = i - 4, R0 = c.revenue[j], G0 = c.gross_profit[j], N0 = c.net_income[j];
    if (j < 0 || ![R0, G0, N0].every(fin) || !R0) { br.innerHTML = `<div class="vz-none">Chưa có số cùng kỳ năm trước để dựng cầu nối.</div>`; return; }
    const vol = (R - R0) * G0 / R0, mar = R * (G / R - G0 / R0), oth = (N - G) - (N0 - G0);
    br.innerHTML = `<b class="vu-h">Lãi ròng ${esc(qs[j])} → ${esc(qs[i])}</b>` + waterfall([{l: `Lãi ròng ${qs[j]}`, v: N0, total: true}, {l: 'Do doanh thu', v: vol}, {l: 'Do biên gộp', v: mar}, {l: 'Do chi phí khác', v: oth}, {l: `Lãi ròng ${qs[i]}`, v: N, total: true}], `tỷ đồng · doanh thu ${pc((R / R0 - 1) * 100)}, biên gộp ${sg((G / R - G0 / R0) * 100, 1)} đ.p.`) +
      `<p class="vz-take">${Math.abs(mar) > Math.abs(vol) ? 'Biên gộp' : 'Quy mô doanh thu'} giải thích phần lớn thay đổi lãi gộp so cùng kỳ.</p>`;
  };
  coSel.addEventListener('change', drawCo); qSel.addEventListener('change', drawCo);
  const pref = cos.find(c => c.symbol === 'POW'); if (pref) coSel.value = 'POW';
  // Quý mới nhất có đủ số của mã đang chọn.
  const lastOk = () => { const c = cos.find(x => x.symbol === coSel.value); for (let i = qs.length - 1; i >= 0; i--) if ([c?.revenue[i], c?.gross_profit[i], c?.net_income[i]].every(fin)) return i; return qs.length - 1; };
  qSel.value = String(lastOk()); coSel.addEventListener('change', () => { qSel.value = String(lastOk()); drawCo(); }); drawCo();
  // --- kịch bản
  const inBox = host.querySelector('.vu-in'), swf = host.querySelector('[data-swf]'), sumP = host.querySelector('[data-sum]');
  let tk = Object.keys(S.techs)[0], v = {};
  const fuelUnit = k => k === 'coal' ? {lab: 'Giá than nhập (USD/tấn)', def: w?.coal_au ?? 100, step: 1} : k === 'lng' ? {lab: 'Giá LNG (USD/MMBtu)', def: w?.lng_japan ?? 12, step: 0.1} : null;
  const setup = k => {
    tk = k; const t = S.techs[k], f = fuelUnit(k), c = ceil(new RegExp('^' + t.ppa_from.replace(/[()]/g, '\\$&') + '$'));
    v = {mw: t.mw, cf: t.cf, qc: t.qc, ppa: c?.ceiling ?? 1500, fmp: fmpLast?.fmp ?? 1400, fuel: f?.def ?? 0, fx: fx ?? 26000, fixed: t.fixed, dep: t.dep, interest: t.interest};
    const F = [['mw', 'Công suất (MW)', 50], ['cf', 'Hệ số huy động (%)', 1], ['qc', 'Qc (%)', 1], ['ppa', `Giá PPA (đ/kWh)${c ? ' · mặc định = trần ' + c.year : ''}`, 10], ['fmp', 'FMP (đ/kWh)', 10], ...(f ? [['fuel', f.lab, f.step], ['fx', 'Tỷ giá (đ/USD)', 10]] : []), ['fixed', 'Chi phí cố định O&M (tỷ/năm)', 10], ['dep', 'Khấu hao (tỷ/năm)', 10], ['interest', 'Lãi vay (tỷ/năm)', 10]];
    inBox.innerHTML = F.map(([id, l, st]) => `<label><span>${esc(l)}</span><input type="number" step="${st}" data-v="${id}" value="${Math.round(v[id] * 100) / 100}"></label>`).join('') + '<button type="button" class="vu-reset">Về mặc định</button>';
    inBox.querySelectorAll('input').forEach(x => x.addEventListener('input', () => { v[x.dataset.v] = +x.value; calc(); }));
    inBox.querySelector('.vu-reset').addEventListener('click', () => setup(tk));
    host.querySelectorAll('[data-tk]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tk === k)));
    calc();
  };
  const calc = () => {
    const kwhY = v.mw * 1000 * 8760 * v.cf / 100, rev = kwhY * (v.qc / 100 * v.ppa + (1 - v.qc / 100) * v.fmp) / 1e9;
    const fuelKwh = !FP ? 0 : tk === 'coal' ? v.fuel * v.fx / 1000 * FP.HR_COAL / FP.HHV_NC : tk === 'lng' ? (v.fuel + FP.FEE_USD) * FP.HR_GAS / 1e6 * v.fx : 0;
    const fuel = kwhY * fuelKwh / 1e9, ebitda = rev - fuel - v.fixed, ebit = ebitda - v.dep, pbt = ebit - v.interest;
    swf.innerHTML = waterfall([{l: 'Doanh thu', v: rev, total: true}, {l: 'Nhiên liệu', v: -fuel}, {l: 'O&M cố định', v: -v.fixed}, {l: 'EBITDA', v: ebitda, total: true}, {l: 'Khấu hao', v: -v.dep}, {l: 'EBIT', v: ebit, total: true}, {l: 'Lãi vay', v: -v.interest}, {l: 'Lợi nhuận trước thuế', v: pbt, total: true}], 'tỷ đồng/năm · minh họa');
    sumP.innerHTML = `Sản lượng ≈ <b>${nf(kwhY / 1e6, 0)}</b> triệu kWh/năm · nhiên liệu ≈ ${nf(fuelKwh, 0)} đ/kWh · biên EBITDA ${nf(rev ? ebitda / rev * 100 : null, 1)}%. Doanh thu = sản lượng × (Qc × PPA + (1 − Qc) × FMP).`;
  };
  host.querySelectorAll('[data-tk]').forEach(b => b.addEventListener('click', () => setup(b.dataset.tk)));
  setup(tk);
}

/* ===================== Module 04 · heatmap phơi nhiễm ===================== */
function heat(host, ctx, onPick) {
  const {P, O} = ctx, {esc, nf} = P, G = O.groups, ROLE = {'chính': 1, 'chính trong mảng điện': .8, 'một phần': .5, 'gián tiếp': .3, 'nhỏ': .2};
  const lvl = ['không', 'thấp', 'trung bình', 'cao'], col = x => `rgba(41,56,168,${(x / 3 * .85).toFixed(2)})`;
  const coScore = (c, d) => Math.max(0, ...c.exposure.map(e => (d.heat[e.group] || 0) * (ROLE[e.role] ?? .5)));
  host.innerHTML = `<div class="ov-ctl" role="group" aria-label="Chế độ xem"><button type="button" data-hv="g" aria-pressed="true">Theo nhóm nguồn</button><button type="button" data-hv="c" aria-pressed="false">Theo mã (18 doanh nghiệp)</button></div><div class="vh-wrap"></div>
    <p class="ov-cap">${esc(O.heat_note)} Bấm một ô để mở chuỗi truyền dẫn của biến số đó.</p>`;
  const wrap = host.querySelector('.vh-wrap');
  const draw = mode => {
    host.querySelectorAll('[data-hv]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.hv === mode)));
    const cols = mode === 'g' ? G.map(g => ({id: g.id, l: g.label, c: g.color})) : O.companies.map(c => ({id: c.ticker, l: c.ticker}));
    wrap.innerHTML = `<div class="tablewrap"><table class="vh ${mode === 'c' ? 'vh-c' : ''}"><thead><tr><th>Biến số</th>${cols.map(c => `<th${c.c ? ` style="--c:${c.c}"` : ''}>${esc(c.l)}</th>`).join('')}</tr></thead><tbody>${O.drivers.map(d => `<tr><th scope="row">${esc(d.label)}</th>${cols.map(c => {
      const x = mode === 'g' ? d.heat[c.id] : coScore(O.companies.find(k => k.ticker === c.id), d);
      return `<td><button type="button" data-d="${d.id}" style="background:${col(x)};color:${x > 1.6 ? '#fff' : 'inherit'}" title="${esc(d.label)} × ${esc(c.l)}: ${mode === 'g' ? lvl[x] : nf(x, 1) + ' / 3'}">${mode === 'g' ? lvl[x] : x ? nf(x, 1) : ''}</button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  };
  host.querySelectorAll('[data-hv]').forEach(b => b.addEventListener('click', () => draw(b.dataset.hv)));
  host.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) onPick?.(b.dataset.d); });
  draw('g');
}

/* ===================== Module 05 · triển vọng nguồn cung ===================== */
function outlook(host, ctx) {
  const {P, POL} = ctx, {esc, nf, dm} = P;
  const L = POL.pipeline || [], ST = POL.pipeline_status || [], TC = POL.tech_colors || {};
  // Màu thống nhất theo loại hình (cùng bản đồ ngành, sơ đồ công nghệ); loại không có trong 6 công nghệ lấy màu tab Policy.
  const color = t => ctx.O.technologies.find(x => x.id === t)?.color || TC[t] || '#9AA3BD';
  const yearOf = p => (p.cod_actual || p.cod_plan || '').slice(0, 4) || null;
  const ticker = p => (String(p.owner || '').match(/\(([A-Z0-9]{3})\)/) || [])[1];
  const certainty = {cod: 'Đã vận hành', construction: 'Đang xây dựng', financing: 'Ký EPC / thu xếp vốn', approved: 'Đã chọn nhà đầu tư', planned: 'Trong quy hoạch'};
  const ord = ['cod', 'construction', 'financing', 'approved', 'planned'];
  // Công suất theo năm COD và mức chắc chắn.
  const years = [...new Set(L.map(yearOf).filter(Boolean))].sort();
  const byY = years.map(y => ({y, rows: ord.map(s => ({s, mw: L.filter(p => yearOf(p) === y && p.status === s).reduce((a, p) => a + (+p.mw || 0), 0)}))}));
  const maxY = Math.max(...byY.map(x => x.rows.reduce((a, r) => a + r.mw, 0)), 1);
  const scol = {cod: '#1D2678', construction: '#2938A8', financing: '#8997D6', approved: '#C9CFDD', planned: '#e3e7f0'};
  const undated = L.filter(p => !yearOf(p));
  const tgt = (POL.plan?.targets || []).filter(t => t.actual != null);
  host.innerHTML = `<section class="vu-sec"><h4>Nguồn mới dự kiến vào khi nào, chắc chắn đến đâu?</h4>
      <div class="vo-bars">${byY.map(x => `<div class="vo-col"><div class="vo-stack" style="height:${x.rows.reduce((a, r) => a + r.mw, 0) / maxY * 100}%">${x.rows.filter(r => r.mw).map(r => `<i style="flex:${r.mw};background:${scol[r.s]}" title="${certainty[r.s]}: ${nf(r.mw, 0)} MW"></i>`).join('')}</div><b>${nf(x.rows.reduce((a, r) => a + r.mw, 0), 0)}</b><span>${x.y}</span></div>`).join('')}</div>
      <div class="vu-leg">${ord.map(s => `<span><i style="background:${scol[s]}"></i>${certainty[s]}</span>`).join('')}</div>
      <p class="vz-take">MW theo năm vận hành thực tế hoặc kế hoạch của ${L.length} dự án lớn đang theo dõi${undated.length ? `; ${undated.length} dự án chưa có năm COD` : ''}. Không phải toàn bộ pipeline quy hoạch.</p></section>
    <section class="vu-sec"><h4>Timeline COD và doanh nghiệp liên quan</h4><ol class="vo-tl">${[...L].sort((a, b) => (yearOf(a) || '9999').localeCompare(yearOf(b) || '9999') || (a.cod_actual || a.cod_plan || '').localeCompare(b.cod_actual || b.cod_plan || '')).map(p => { const t = ticker(p);
      return `<li class="vo-${p.status}"><span class="vo-d">${esc(p.cod_actual || p.cod_plan || 'chưa có')}</span><i style="background:${color(p.tech)}"></i><div><b>${esc(p.name)}</b> <small>${nf(+p.mw, 0)} MW · ${esc(p.tech_label || p.tech)} · ${esc(certainty[p.status] || p.status)}</small><small>${esc(p.owner || '')}${t ? ' ' + ctx.chip(t) : ''}${p.source_url ? ` · <a href="${esc(p.source_url)}" target="_blank" rel="noopener">${esc(p.source_label || 'nguồn')}</a>` : ''}</small></div></li>`; }).join('')}</ol></section>
    ${tgt.length ? `<section class="vu-sec"><h4>Mục tiêu 2030 so với công suất cuối 2025</h4><div class="vz-bars">${tgt.map(t => `<div class="vz-bar"><span>${esc(t.source)}</span><i style="width:${t.actual / t.high * 100}%;background:#2938A8"></i><b>${nf(t.actual / t.high * 100, 0)}%</b><small>${nf(t.actual, 0)} MW / mục tiêu ${nf(t.low, 0)}${t.high !== t.low ? '–' + nf(t.high, 0) : ''} MW (${esc(t.year)})</small></div>`).join('')}</div><div class="source-note">Quy hoạch điện VIII điều chỉnh (QĐ 768/QĐ-TTg) qua tab Policy · Quy hoạch.</div></section>` : ''}`;
}

window.PowerOverviewVisual = {map, tech, data, unit, heat, outlook, waterfall};
})();
