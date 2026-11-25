/* KCN · bộ quy tắc nhận định (hàm thuần, không đụng DOM). Dùng chung cho assets/kcn-workspace.js và
   tests/kcn-insights.test.cjs. Dữ liệu vào là window.KCN_MARKET (scripts/build_kcn_workbook.py).
   Nguyên tắc: không nội suy, không nối chuỗi qua đổi phạm vi (C&W từ Q3/2025) hay đổi đơn vị (USD → VND),
   không cộng CBRE với C&W, không coi kế hoạch là thực hiện. Thiếu điều kiện thì trả lý do, không trả số. */
(function (root) {
  'use strict';
  const num = v => typeof v === 'number' && Number.isFinite(v);
  const qk = p => { const m = /^(\d{4})Q([1-4])$/.exec(String(p || '')); return m ? +m[1] * 4 + (+m[2] - 1) : null; };
  const qlabel = p => { const m = /^(\d{4})Q([1-4])$/.exec(String(p || '')); return m ? `Q${m[2]}/${m[1]}` : String(p || ''); };
  const kOf = k => `${Math.floor(k / 4)}Q${(k % 4) + 1}`;
  const REG = {North: 'Bắc', South: 'Nam', Vietnam: 'Cả nước'};
  const repName = r => /Cushman/.test(r || '') ? 'C&W' : /CBRE via/.test(r || '') ? 'CBRE (qua Vietcap)' : /Shinhan/.test(r || '') ? 'Shinhan (JLL + C&W)' : r;

  // Ngưỡng công khai (hiển thị ở tab Dữ liệu & Phương pháp; ma trận giá thuê cho chỉnh 2 ngưỡng cuối).
  const TH = {
    r1_yoy: 0.10,     // R1: hấp thụ so cùng kỳ ≥ +10% (cùng nguồn, cùng phạm vi) hoặc rolling 4Q tăng ≥ 2 kỳ liền
    r2_stock: 0.03,   // R2: nguồn cung tăng ≥ 3% so cùng kỳ…
    r2_occ: -0.01,    // …và lấp đầy giảm ≥ 1 điểm %, trong khi hấp thụ vẫn dương
    r3_occ: 0.70, r3_rent: -0.02,  // R3: lấp đầy < 70% và giá chào thuê ≤ −2% YoY
    r4_occ: 0.80, r4_rent: 0.02,   // R4: lấp đầy ≥ 80% và giá chào thuê ≥ +2% YoY
    r5_ratio: 0.25,   // R5: cung dự kiến 3 năm ≥ 25% nguồn cung hiện hữu (cùng nhà khảo sát)
    r5_share: 0.35,   // R5 cục bộ: tỉnh nhận ≥ 35% cung mới của vùng và lấp đầy < r3_occ
    r6_move: 0.10,    // R6: ký mới đổi ≥ 10%/năm cùng chiều ≥ 2 năm liên tiếp, chỉ số ACTUAL liên tục
    occ_flat: 0.003,  // thay đổi lấp đầy dưới 0,3 điểm % xem là đi ngang
    m_occ: 0.75, m_rent: 0    // ma trận sức mạnh giá: ngưỡng mặc định, người dùng chỉnh được
  };

  /* ---------- QA flags từ 13_DATA_QA ---------- */
  function periodRange(s) {
    s = String(s || '').trim();
    let m = /^(\d{4})Q([1-4])-(\d{4})Q([1-4])$/.exec(s); if (m) return [qk(`${m[1]}Q${m[2]}`), qk(`${m[3]}Q${m[4]}`)];
    m = /^(\d{4})Q([1-4])-Q([1-4])$/.exec(s); if (m) return [qk(`${m[1]}Q${m[2]}`), qk(`${m[1]}Q${m[3]}`)];
    m = /^(\d{4})Q([1-4])$/.exec(s); if (m) return [qk(s), qk(s)];
    m = /^(\d{4})$/.exec(s); if (m) return [qk(`${m[1]}Q1`), qk(`${m[1]}Q4`)];
    return null;
  }
  function qaFor(D, region, period) {
    const k = qk(period);
    return (D.qa || []).filter(q => {
      const sc = q.scope || '';
      if (region && !(sc.includes(region) || sc === 'Region')) return false;
      const r = periodRange(q.period); if (!r || k == null) return false;
      return k >= r[0] && k <= r[1];
    });
  }

  /* ---------- Chuỗi hấp thụ theo nguồn + phạm vi + vùng ---------- */
  function absorptionSeries(D) {
    const out = [];
    const cw = (D.absorption || []).filter(a => /Cushman/.test(a.reporter || '') && a.ptype === 'Quarter' && qk(a.period) != null);
    ['North', 'South'].forEach(r => ['C&W_PRE_2025Q3', 'C&W_POST_2025_MERGER'].forEach(cov => {
      const pts = cw.filter(a => a.region === r && a.coverage === cov).map(a => ({period: a.period, value: a.value, cls: a.obs === 'ACTUAL' ? 'ACTUAL' : a.obs, precision: a.precision, src: a.src, note: a.note}));
      if (pts.length) out.push({id: `cw-${cov.includes('POST') ? 'post' : 'pre'}-${r}`, reporter: 'C&W', coverage: cov, cohort: cov.includes('POST') ? 'POST' : 'PRE', region: r, points: pts.sort((a, b) => qk(a.period) - qk(b.period))});
    }));
    ['North', 'South'].forEach(r => {
      const pts = (D.cbre || []).filter(c => c.region === r).map(c => {
        const lower = (D.absorption || []).find(a => a.period === c.period && a.region === r && /CBRE/.test(a.reporter || '') && a.obs === 'LOWER_BOUND');
        const est = /DERIVED|ESTIMATE/.test(c.status || '');
        return {period: c.period, value: c.value, cls: est ? 'ESTIMATE' : c.status === 'ACTUAL_PRIMARY' ? 'ACTUAL' : 'ACTUAL_SECONDARY', src: c.src, note: c.note, lower: lower ? lower.value : null};
      });
      if (pts.length) out.push({id: `cbre-${r}`, reporter: 'CBRE', coverage: 'CBRE_TIER1', cohort: 'CBRE', region: r, points: pts.sort((a, b) => qk(a.period) - qk(b.period))});
    });
    return out;
  }
  // Số lũy kế (năm, nửa năm, 9 tháng) giữ riêng: không phải quan sát quý.
  function cumulativeFacts(D) {
    return (D.absorption || []).filter(a => a.ptype !== 'Quarter').map(a => {
      const m = /([+-]?\d+(?:\.\d+)?)%\s*YoY/i.exec(a.note || '');
      return {...a, reported_yoy: m ? +m[1] / 100 : null};
    });
  }
  function longestRun(points) {
    let best = 0, run = 0, prev = null;
    points.filter(p => num(p.value)).map(p => qk(p.period)).sort((a, b) => a - b).forEach(k => { run = prev != null && k === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = k; });
    return best;
  }
  // Rolling 4 quý: chỉ khi đủ 4 quý liên tiếp có số trong CÙNG một chuỗi (nguồn + phạm vi). Có quý ước tính thì kết quả là ước tính.
  function rolling4(series) {
    const by = new Map(series.points.filter(p => num(p.value)).map(p => [qk(p.period), p]));
    const values = [];
    [...by.keys()].sort((a, b) => a - b).forEach(k => {
      const w = [k - 3, k - 2, k - 1, k].map(i => by.get(i));
      if (w.every(Boolean)) values.push({period: kOf(k), value: w.reduce((s, p) => s + p.value, 0), est: w.some(p => p.cls === 'ESTIMATE')});
    });
    const run = longestRun(series.points);
    return values.length ? {ok: true, values} : {ok: false, values: [], reason: `Cần 4 quý liên tiếp cùng nguồn và phạm vi; chuỗi ${series.reporter} ${REG[series.region] || series.region}${series.cohort === 'PRE' ? ' (phạm vi trước sáp nhập)' : series.cohort === 'POST' ? ' (phạm vi sau sáp nhập)' : ''} dài nhất ${run} quý liên tiếp.`};
  }
  // So cùng kỳ: hai quý cách nhau đúng 4 quý trong cùng một chuỗi (cùng nguồn, cùng phạm vi, cùng đơn vị).
  function yoy(series) {
    const by = new Map(series.points.filter(p => num(p.value)).map(p => [qk(p.period), p]));
    const out = [];
    by.forEach((p, k) => { const b = by.get(k - 4); if (b && b.value) out.push({period: p.period, value: p.value / b.value - 1, base: b.period, est: p.cls === 'ESTIMATE' || b.cls === 'ESTIMATE'}); });
    return out.sort((a, b) => qk(a.period) - qk(b.period));
  }

  /* ---------- Thị trường C&W theo vùng ---------- */
  const marketRows = (D, region) => (D.market || []).filter(m => m.region === region).sort((a, b) => qk(a.period) - qk(b.period));
  function latest(D, region, key) { const rows = marketRows(D, region).filter(m => num(m[key])); return rows[rows.length - 1] || null; }
  // Biến động giữa hai quý: chỉ khi cùng phạm vi (cohort) và không có cờ điều chỉnh số nền cho chỉ tiêu đó.
  function change(D, region, key, from, to) {
    const a = marketRows(D, region).find(m => m.period === from), b = marketRows(D, region).find(m => m.period === to);
    if (!a || !b || !num(a[key]) || !num(b[key])) return {ok: false, reason: 'Thiếu số ở một trong hai kỳ.'};
    if (a.cohort !== b.cohort) return {ok: false, reason: `Hai kỳ thuộc hai phạm vi khảo sát khác nhau (đổi từ ${qlabel(D.rebase)}); không so trực tiếp.`};
    return {ok: true, from: a, to: b, abs: b[key] - a[key], rel: a[key] ? b[key] / a[key] - 1 : null};
  }
  // Thay đổi nguồn cung theo quý trong cùng phạm vi; quý bị đánh dấu điều chỉnh số nền thì để trống kèm lý do.
  function stockDelta(D, region) {
    const rows = marketRows(D, region), out = [];
    rows.forEach((b, i) => {
      const a = rows[i - 1]; if (!a) return;
      if (qk(b.period) !== qk(a.period) + 1) return;
      if (a.cohort !== b.cohort) { out.push({period: b.period, value: null, reason: 'Đổi phạm vi khảo sát'}); return; }
      const isRev = per => qaFor(D, region, per).some(q => q.issue === 'STOCK_REVISIONS');
      if (isRev(a.period) && isRev(b.period)) { out.push({period: b.period, value: null, raw: b.stock_ha - a.stock_ha, reason: 'Số nền được điều chỉnh, không phải cung mới'}); return; }
      out.push({period: b.period, value: b.stock_ha - a.stock_ha, approx: a.precision === 'APPROX' || b.precision === 'APPROX'});
    });
    return out;
  }
  // Bốn trạng thái chu kỳ: chỉ dùng hấp thụ C&W và lấp đầy C&W của cùng phạm vi, hai quý liền nhau.
  function regimes(D, region, th = TH) {
    const rows = marketRows(D, region), out = [];
    rows.forEach((b, i) => {
      const a = rows[i - 1]; if (!a || qk(b.period) !== qk(a.period) + 1 || a.cohort !== b.cohort) return;
      if (![a.abs_ha, b.abs_ha, a.occ, b.occ].every(num)) return;
      const dAbs = b.abs_ha - a.abs_ha, dOcc = b.occ - a.occ, flat = Math.abs(dOcc) < th.occ_flat;
      const up = dAbs > 0;
      const key = flat ? (up ? 'abs_up_occ_flat' : 'abs_down_occ_flat') : up ? (dOcc > 0 ? 'demand_exceeds' : 'supply_faster') : (dOcc < 0 ? 'weak_demand' : 'supply_slows');
      out.push({region, from: a.period, to: b.period, cohort: b.cohort, dAbs, dOcc, key, absFrom: a.abs_ha, absTo: b.abs_ha, occFrom: a.occ, occTo: b.occ});
    });
    return out;
  }
  const REGIME_TEXT = {
    demand_exceeds: 'Hấp thụ tăng, lấp đầy tăng: cầu thuê vượt cung mới',
    supply_faster: 'Hấp thụ tăng, lấp đầy giảm: cung mới tăng nhanh hơn hấp thụ',
    weak_demand: 'Hấp thụ giảm, lấp đầy giảm: áp lực cầu yếu',
    supply_slows: 'Hấp thụ giảm, lấp đầy tăng: cung mới chậm lại',
    abs_up_occ_flat: 'Hấp thụ tăng, lấp đầy đi ngang',
    abs_down_occ_flat: 'Hấp thụ giảm, lấp đầy đi ngang'
  };
  // Số năm đủ cung = đất trống ÷ hấp thụ năm hóa. Bốn điều kiện; thiếu điều kiện nào thì ẩn chỉ tiêu.
  function yearsOfSupply(D, region) {
    const reasons = [], last = latest(D, region, 'vacant_proxy');
    const series = absorptionSeries(D).filter(s => s.reporter === 'C&W' && s.region === region && s.cohort === (last && last.cohort));
    const r4 = series.length ? rolling4(series[0]) : {ok: false, reason: 'Không có chuỗi hấp thụ C&W cùng phạm vi với đất trống.'};
    if (!last) reasons.push('Không có đất trống ước tính.');
    if (!r4.ok) reasons.push(r4.reason);
    else {
      const v = r4.values[r4.values.length - 1];
      if (!(v.value > 0)) reasons.push('Hấp thụ 4 quý không dương.');
      if (v.period !== last.period) reasons.push(`Kỳ hấp thụ (${qlabel(v.period)}) khác kỳ đất trống (${qlabel(last.period)}).`);
      const w = [0, 1, 2, 3].map(i => kOf(qk(v.period) - i));
      if (w.some(p => qaFor(D, region, p).some(q => q.issue === 'GEOGRAPHY_REBASE'))) reasons.push('Cửa sổ 4 quý đi qua mốc đổi phạm vi khảo sát.');
      if (!reasons.length) return {ok: true, value: last.vacant_proxy / v.value, vacant: last.vacant_proxy, annual: v.value, period: last.period};
    }
    if (series.length === 0) reasons.push('CBRE đo nhóm KCN Tier-1, khác phạm vi đất trống C&W; không ghép.');
    return {ok: false, reasons, vacant: last && last.vacant_proxy, period: last && last.period};
  }

  /* ---------- Tỉnh: ma trận giá thuê ---------- */
  function provincePoints(D) {
    return (D.province || []).filter(p => num(p.occ) && num(p.rent_yoy));
  }
  function quadrant(occ, g, th = TH) {
    const hi = occ >= th.m_occ, up = g >= th.m_rent;
    return hi && up ? 'HH' : hi ? 'HL' : up ? 'LH' : 'LL';
  }
  const QUAD_TEXT = {HH: 'Lấp đầy cao · giá tăng', HL: 'Lấp đầy cao · giá yếu', LH: 'Lấp đầy thấp · giá tăng', LL: 'Lấp đầy thấp · giá yếu'};

  /* ---------- Nguồn cung tương lai ---------- */
  function pipelineRatios(D) {
    return (D.pipeline || []).filter(p => p.stage === 'REGIONAL_FORECAST').map(p => {
      const last = latest(D, p.region, 'stock_ha');
      return {region: p.region, pipeline: p.area_ha, period: p.period, stock: last && last.stock_ha, stockPeriod: last && last.period,
        ratio: last && last.stock_ha ? p.area_ha / last.stock_ha : null, vacant: last && last.vacant_proxy, src: p.src,
        label: `Cung dự kiến miền ${REG[p.region]} ${(/(\d{4})-(\d{4})/.exec(p.project || '') || []).slice(1).join('–')} (C&W)`};
    });
  }

  /* ---------- Doanh nghiệp: ký mới thực tế liên tục ---------- */
  function leaseMomentum(D, ticker) {
    const rows = (D.lease || []).filter(l => l.ticker === ticker && l.type === 'ACTUAL' && num(l.value_ha)).sort((a, b) => a.year - b.year);
    const cont = rows.every((r, i) => !i || r.year === rows[i - 1].year + 1);
    if (rows.length < 3 || !cont) return {ok: false, reason: 'Chưa đủ 3 năm số thực hiện liên tục cùng định nghĩa.'};
    const ch = rows.slice(1).map((r, i) => ({year: r.year, value: r.value_ha / rows[i].value_ha - 1}));
    return {ok: true, rows, changes: ch};
  }

  /* ---------- 7 quy tắc ---------- */
  const pct = (v, d = 1) => (v > 0 ? '+' : '') + (v * 100).toLocaleString('vi-VN', {maximumFractionDigits: d, minimumFractionDigits: d}) + '%';
  const pp = v => (v > 0 ? '+' : '') + (v * 100).toLocaleString('vi-VN', {maximumFractionDigits: 1, minimumFractionDigits: 1}) + ' điểm %';
  const ha = v => Math.round(v).toLocaleString('vi-VN') + ' ha';
  const occT = v => (v * 100).toLocaleString('vi-VN', {maximumFractionDigits: 1}) + '%';

  function rules(D, th = TH) {
    const out = [], insufficient = [];
    const series = absorptionSeries(D);

    // R1 · Phục hồi nhu cầu
    const comp = series.flatMap(s => yoy(s).map(y => ({...y, s}))).filter(y => !y.est);
    const roll = series.map(s => ({s, r: rolling4(s)}));
    const rising = roll.filter(x => x.r.ok && x.r.values.length >= 3 && x.r.values.slice(-3).every((v, i, a) => !i || v.value > a[i - 1].value));
    const reported = cumulativeFacts(D).filter(c => num(c.reported_yoy));
    const r1ev = [], r1src = new Set();
    comp.filter(y => y.value >= th.r1_yoy).forEach(y => { r1ev.push(`${y.s.reporter} ${REG[y.s.region]} ${qlabel(y.period)}: ${pct(y.value)} so ${qlabel(y.base)}`); });
    rising.forEach(x => r1ev.push(`Rolling 4 quý ${x.s.reporter} ${REG[x.s.region]} tăng 2 kỳ liền`));
    reported.filter(c => c.reported_yoy >= th.r1_yoy).forEach(c => { r1ev.push(`${repName(c.reporter)} ${REG[c.region] || c.region} ${c.period.replace('2026M9', '9T/2026').replace('2026H1', 'H1/2026')}: ${ha(c.value)}, ${pct(c.reported_yoy, 0)} so cùng kỳ (nguồn công bố)`); r1src.add(c.src); });
    const fdiNew = (D.fdi_snap || []).find(f => f.sector === 'FDI_MFG' && f.ctype === 'registered_new');
    if (r1ev.length) {
      const m = fdiNew && /([+-]?\d+)% YoY/.exec(fdiNew.note || '');
      out.push({id: 'R1', key: 'demand', tab: 'demand', status: 'fired', scope: 'Cả nước', headline: 'Nhu cầu hấp thụ đất có dấu hiệu phục hồi',
        evidence: r1ev.concat(fdiNew ? [`FDI chế biến chế tạo cấp mới ${fdiNew.period.replace('2026M9', '9T/2026')}: ${fdiNew.value.toLocaleString('vi-VN')} tỷ USD${m ? `, ${pct(+m[1] / 100, 0)} so cùng kỳ` : ''}`] : []),
        interp: comp.length || rising.length ? 'Tăng trưởng tính trên cùng một chuỗi khảo sát.' : 'Tăng trưởng là số nguồn công bố trên số lũy kế; dashboard chưa có chuỗi quý cùng phạm vi đủ dài để tự tính rolling 4 quý.',
        implication: 'Thuận cho doanh số ký mới của doanh nghiệp còn đất thương phẩm sẵn sàng. Doanh thu ghi nhận theo tiến độ bàn giao nên đi sau số ký mới.',
        sources: [...r1src, fdiNew && fdiNew.src].filter(Boolean), threshold: `So cùng kỳ ≥ ${pct(th.r1_yoy, 0)} hoặc rolling 4Q tăng 2 kỳ liền`});
    } else insufficient.push({id: 'R1', text: 'Chưa có tăng trưởng hấp thụ cùng nguồn vượt ngưỡng.'});
    if (!comp.length && !roll.some(x => x.r.ok)) insufficient.push({id: 'R1', text: 'Rolling 4Q và YoY tự tính: ' + roll.map(x => x.r.reason).filter(Boolean)[0]});

    // R2 · Lấp đầy giảm do cung tăng
    ['North', 'South'].forEach(r => {
      const last = latest(D, r, 'occ'); if (!last) return;
      const base = kOf(qk(last.period) - 4);
      const st = change(D, r, 'stock_ha', base, last.period), oc = change(D, r, 'occ', base, last.period);
      if (!st.ok || !oc.ok) { insufficient.push({id: 'R2', text: `${REG[r]}: ${st.reason || oc.reason}`}); return; }
      const absPos = series.filter(s => s.region === r && (s.cohort === last.cohort || s.reporter === 'CBRE')).flatMap(s => s.points).filter(p => p.cls !== 'ESTIMATE' && qk(p.period) > qk(base) && qk(p.period) <= qk(last.period) && num(p.value) && p.value > 0);
      const rev = qaFor(D, r, last.period).find(q => q.issue === 'STOCK_REVISIONS');
      if (st.rel >= th.r2_stock && oc.abs <= th.r2_occ && absPos.length) {
        const occd = change(D, r, 'occupied_proxy', base, last.period);
        out.push({id: 'R2', key: 'dilution', tab: 'supply', status: 'fired', scope: 'Miền ' + REG[r], headline: `Lấp đầy miền ${REG[r]} giảm chưa chắc do cầu yếu: nguồn cung tăng nhanh hơn`,
          evidence: [`Nguồn cung ${qlabel(base)} → ${qlabel(last.period)}: ${ha(st.from.stock_ha)} → ${ha(st.to.stock_ha)} (${pct(st.rel)})`, `Lấp đầy: ${occT(oc.from.occ)} → ${occT(oc.to.occ)} (${pp(oc.abs)})`,
            `Hấp thụ trong kỳ vẫn dương: ${absPos.length} quan sát C&W/CBRE (${[...new Set(absPos.map(p => p.src))].join(', ')}); chỉ xét hướng vì hai nguồn khác phạm vi`].concat(occd.ok ? [`Diện tích đã lấp (proxy = cung × lấp đầy) ${pct(occd.rel)}, khoảng ${occd.abs > 0 ? '+' : ''}${ha(occd.abs)}; proxy, không phải hấp thụ thuần`] : []),
          interp: 'Cung mới vào nhanh hơn tốc độ khách thuê lấp đất, nên tỷ lệ giảm dù diện tích đã thuê vẫn tăng.' + (rev ? ' Lưu ý: số nguồn cung có điều chỉnh số nền.' : ''),
          implication: 'Cạnh tranh giữa các KCN mới mở tăng; theo dõi giá chào thuê và tốc độ lấp đầy của dự án mới trong vùng.',
          sources: [st.from.src, st.to.src], threshold: `Cung ≥ ${pct(th.r2_stock, 0)}, lấp đầy ≤ ${pp(th.r2_occ)}, hấp thụ > 0`});
      }
    });

    // R3, R4 · Tỉnh: áp lực giá / sức mạnh giá (cần cả lấp đầy và giá thuê YoY cùng kỳ, cùng khảo sát)
    provincePoints(D).forEach(p => {
      if (p.occ < th.r3_occ && p.rent_yoy <= th.r3_rent)
        out.push({id: 'R3', key: 'pressure', tab: 'rent', status: 'fired', scope: p.province_vi, headline: `${p.province_vi}: dấu hiệu cạnh tranh giá hoặc dư cung`,
          evidence: [`Lấp đầy ${qlabel(p.period)}: ${occT(p.occ)}`, `Giá chào thuê so cùng kỳ: ${pct(p.rent_yoy)}`], interp: 'Lấp đầy thấp đi cùng giá chào thuê giảm; cần đối chiếu nguồn cung dự kiến của tỉnh.',
          implication: 'Chủ đầu tư có quỹ đất lớn ở tỉnh này có thể phải giảm giá hoặc kéo dài thời gian lấp đầy.', sources: [p.src], threshold: `Lấp đầy < ${occT(th.r3_occ)} và giá ≤ ${pct(th.r3_rent, 0)}`});
      else if (p.occ >= th.r4_occ && p.rent_yoy >= th.r4_rent)
        out.push({id: 'R4', key: 'power', tab: 'rent', status: 'fired', scope: p.province_vi, headline: `${p.province_vi}: thị trường có thể có sức mạnh tăng giá`,
          evidence: [`Lấp đầy ${qlabel(p.period)}: ${occT(p.occ)}`, `Giá chào thuê so cùng kỳ: ${pct(p.rent_yoy)}`], interp: 'Lấp đầy cao và giá chào thuê tăng. Đây là giá chào sơ cấp, chưa phải giá giao dịch.',
          implication: 'Thuận cho doanh nghiệp còn đất thương phẩm trong tỉnh; kiểm tra tính đại diện của giá chào thuê trước khi dùng cho dự phóng.', sources: [p.src], threshold: `Lấp đầy ≥ ${occT(th.r4_occ)} và giá ≥ ${pct(th.r4_rent, 0)}`});
    });
    insufficient.push({id: 'R3/R4', text: 'Cấp vùng: chưa tính được giá thuê so cùng kỳ (Q3/2026 báo giá VND, các kỳ trước USD; trước Q3/2025 khác phạm vi).'});

    // R5 · Rủi ro nguồn cung tương lai
    pipelineRatios(D).forEach(p => {
      if (num(p.ratio) && p.ratio >= th.r5_ratio)
        out.push({id: 'R5', key: 'pipeline', tab: 'supply', status: 'fired', scope: 'Miền ' + REG[p.region], headline: `Miền ${REG[p.region]}: cung dự kiến lớn so với nguồn cung hiện hữu`,
          evidence: [`${p.label}: ${ha(p.pipeline)} (dự phóng)`, `Nguồn cung ${qlabel(p.stockPeriod)}: ${ha(p.stock)} → bằng ${pct(p.ratio, 0).replace('+', '')}`].concat(num(p.vacant) ? [`Đất trống ước tính (proxy) ${qlabel(p.stockPeriod)}: ${ha(p.vacant)}`] : []),
          interp: 'Nếu cung dự kiến vào đúng tiến độ trong khi hấp thụ không tăng tương ứng, lấp đầy vùng có thể tiếp tục giảm.',
          implication: 'Rủi ro mất cân bằng cung – cầu; lợi thế nghiêng về KCN có hạ tầng, vị trí và đất sạch sẵn sàng.', sources: [p.src], threshold: `Cung 3 năm ≥ ${pct(th.r5_ratio, 0).replace('+', '')} nguồn cung hiện hữu`});
    });
    (D.pipe_area || []).forEach(a => {
      const pr = (D.province || []).filter(p => p.province === a.province && num(p.occ)).sort((x, y) => qk(x.period) - qk(y.period)).pop();
      if (pr && a.share >= th.r5_share && pr.occ < th.r3_occ)
        out.push({id: 'R5', key: 'pipeline', tab: 'supply', status: 'fired', scope: a.province_vi, headline: `${a.province_vi}: nhận phần lớn cung mới trong khi lấp đầy thấp`,
          evidence: [`Tỷ trọng cung mới miền Nam ${a.period}: ${occT(a.share)} (≈ ${ha(a.implied_ha)}, dự phóng phái sinh)`, `Lấp đầy ${qlabel(pr.period)}: ${occT(pr.occ)}`],
          interp: 'Cung mới dồn vào tỉnh đang lấp đầy thấp làm tăng rủi ro dư cung cục bộ.', implication: 'Theo dõi giá chào thuê và ký mới tại các KCN của tỉnh; thận trọng với dự phóng giá thuê tăng đều.',
          sources: [a.src, pr.src], threshold: `Tỷ trọng ≥ ${occT(th.r5_share)} và lấp đầy < ${occT(th.r3_occ)}`});
    });

    // R6 · Động lực ký mới doanh nghiệp
    const tickers = [...new Set((D.coverage || []).map(c => c.ticker))], short = [];
    tickers.forEach(t => {
      const m = leaseMomentum(D, t);
      if (!m.ok) { short.push(t); return; }
      const last2 = m.changes.slice(-2);
      const down = last2.length === 2 && last2.every(c => c.value <= -th.r6_move), up = last2.length === 2 && last2.every(c => c.value >= th.r6_move);
      if (down || up)
        out.push({id: 'R6', key: 'momentum', tab: 'landbank', status: 'fired', scope: t, headline: `${t}: động lực ký mới ${down ? 'suy yếu' : 'cải thiện'} hai năm liên tiếp`,
          evidence: m.rows.map(r => `${r.year}: ${ha(r.value_ha)}`).concat(m.changes.map(c => `${c.year}: ${pct(c.value)}`)),
          interp: down ? 'Diện tích ký mới giảm dù thị trường 2026 có tín hiệu phục hồi; cần xem doanh số ký mới 2026 thực hiện để biết doanh nghiệp có chuyển hóa được cầu ngành.' : 'Ký mới tăng đều.',
          implication: 'Không suy ra kết quả kinh doanh năm sau chỉ từ ký mới năm trước: doanh thu còn phụ thuộc tiến độ bàn giao và cách ghi nhận.', sources: [...new Set((D.dev || []).filter(d => d.ticker === t).map(d => d.src))], link: m.rows[0].url,
          threshold: `Đổi ≥ ${pct(th.r6_move, 0).replace('+', '±')}/năm, 2 năm liên tiếp, chỉ số thực hiện`});
    });
    if (short.length) insufficient.push({id: 'R6', text: `${short.join(', ')}: chưa đủ 3 năm ký mới thực hiện liên tục cùng định nghĩa (20_COVERAGE_QA).`});

    // R7 · Thiếu dữ liệu: các phép tính bị chặn
    ['North', 'South'].forEach(r => { const y = yearsOfSupply(D, r); if (!y.ok) insufficient.push({id: 'R7', text: `Số năm đủ cung miền ${REG[r]}: ${y.reasons[0]}`}); });
    ['North', 'South'].forEach(r => { if (!regimes(D, r).some(g => g.cohort === 'POST')) insufficient.push({id: 'R7', text: `Trạng thái chu kỳ miền ${REG[r]} (phạm vi sau sáp nhập): chưa có hai quý liền nhau cùng có hấp thụ và lấp đầy C&W.`}); });
    insufficient.push({id: 'R7', text: 'Độ trễ FDI → hấp thụ: chỉ có 1 năm hấp thụ cả năm (Shinhan 2025) để đặt cạnh 10 năm FDI; chưa đủ quan sát để đo tương quan.'});
    return {fired: out, insufficient};
  }

  const api = {TH, repName, qk, qlabel, kOf, REG, qaFor, absorptionSeries, cumulativeFacts, rolling4, yoy, longestRun, marketRows, latest, change, stockDelta,
    regimes, REGIME_TEXT, yearsOfSupply, provincePoints, quadrant, QUAD_TEXT, pipelineRatios, leaseMomentum, rules};
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KcnInsights = api;
})(typeof window !== 'undefined' ? window : globalThis);
