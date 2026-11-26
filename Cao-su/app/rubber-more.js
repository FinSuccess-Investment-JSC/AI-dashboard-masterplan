/* Cao su · Bức tranh ngành 03 Cầu Trung Quốc, 04 Cung & tồn kho, 05 Doanh nghiệp: giá bán & biên (26/11/2026).
   Dựng từ khối nhập tay có nguồn từng dòng trong window.RUBBER_DATA (data/rubber/*.json qua scripts/build_rubber.py) và BCTC.
   Sub-tab không có dữ liệu thì không đăng ký (rubber.js ẩn nút). Chỉ mô tả dữ liệu; nguồn hiện dưới mọi chart. */
(() => {
'use strict';
const K = window.RubberKit;
if (!K) return;
const {card, chart, seg, panel, kpi, kpiRow, two, waterfall, flow, stage, renum, el, esc, nf, sg, mL, qL, dL, months, ymAdd, C, E, F, D, PIC, $} = K;
const fin = v => typeof v === 'number' && Number.isFinite(v);
const a = (href, t) => `<a href="${href}" target="_blank" rel="noopener">${esc(t)}</a>`;

/* ======================= 05 DOANH NGHIỆP ======================= */
const DPR = D.dpr_monthly;
const dprSrc = r => a(r?.source_url || 'https://doruco.com.vn/danh-muc/bao-cao-san-xuat-kinh-doanh/', 'Cao su Đồng Phú · báo cáo SXKD tháng');
function company() {
  const p = $('#cs-pp-company');
  const M = DPR ? [...DPR.months].sort((x, y) => x.period < y.period ? -1 : 1) : [];
  const at = per => M.find(r => r.period === per);
  const lr = M.at(-1);
  const svr = m => K.val('vn_svr10_m', m);
  const items = [];
  if (lr) {
    const r0 = at(ymAdd(lr.period, -12));
    items.push(kpi('DPR tiêu thụ · ' + mL(lr.period), nf(lr.sold_t, 1), 'tấn', r0 ? `${sg((lr.sold_t / r0.sold_t - 1) * 100)}% so cùng kỳ` : '', `xuất khẩu ${nf(lr.sold_export_t, 0)} t · nội địa ${nf(lr.sold_domestic_t, 0)} t`, M.slice(-12).map(r => r.sold_t), C.teal));
    items.push(kpi('DPR giá bán bình quân · ' + mL(lr.period), nf(lr.asp_published_mvnd_per_t, 2), 'triệu đồng/tấn', r0 && fin(r0.asp_published_mvnd_per_t) ? `${sg((lr.asp_published_mvnd_per_t / r0.asp_published_mvnd_per_t - 1) * 100)}% so cùng kỳ` : '', 'số công bố', M.slice(-12).map(r => r.asp_published_mvnd_per_t), C.navy));
    items.push(kpi('DPR giá xuất khẩu · ' + mL(lr.period), nf(lr.asp_export_usd_per_t), 'USD/tấn', fin(svr(lr.period)) ? `SVR 10 bình quân tháng ${nf(svr(lr.period) * 10)} USD/tấn` : '', 'số công bố', M.slice(-12).map(r => r.asp_export_usd_per_t), C.gold));
    items.push(kpi(`DPR lũy kế ${+lr.period.slice(5)} tháng · ` + lr.period.slice(0, 4), nf(lr.ytd?.sold_t, 0), 'tấn tiêu thụ', lr.plan_year?.sold_t ? `${nf(lr.ytd.sold_t / lr.plan_year.sold_t * 100, 0)}% kế hoạch năm` : '', `khai thác ${nf(lr.ytd?.tapped_t, 0)} t`, null));
    p.append(kpiRow(items));
  }
  flow(p, 'company', [['vol', 'Lượng', 'Khai thác, thu mua, tiêu thụ'], ['px', 'Giá', 'Giá bán so benchmark'], ['bridge', 'Doanh thu', 'Lượng – giá – cơ cấu'], ['land', 'Ngoài mủ', 'Thanh lý, đền bù, KCN'], ['cash', 'Tiền', 'Biên, dòng tiền, độ nhạy']]);
  const L = M.length ? months(M[0].period, lr.period) : [];
  const g = (per, k) => at(per)?.[k] ?? null;
  stage(p, 'company', 'vol', 'Lượng', 'Khai thác, thu mua, tiêu thụ');
  if (M.length) {
    const q1 = panel('·', 'Cao su Đồng Phú (DPR) khai thác, mua ngoài và bán bao nhiêu mỗi tháng?');
    const c1 = card('cs-50', 'DPR: khai thác, thu mua và tiêu thụ theo tháng', {sub: 'tấn · số tháng (không phải lũy kế) · tháng không có báo cáo để trống', source: dprSrc(lr),
      info: 'Báo cáo SXKD tháng DPR (PDF scan, đọc từng trang). Khai thác: mủ từ vườn cây công ty; thu mua: mủ mua ngoài; tiêu thụ: tấn bán ra (xuất khẩu + nội địa). Báo cáo T1, T7, T8/2024 và T1–T4/2025 không có trên website công ty.'});
    q1.append(c1.el); p.append(q1);
    let v1 = 'src';
    const d1 = () => v1 === 'src'
      ? chart(c1.host, 'cs-50-src', L.map(mL), [{name: 'Tự khai thác', color: C.green, kind: 'bar', values: L.map(m => g(m, 'tapped_t'))}, {name: 'Thu mua', color: C.sky, kind: 'bar', values: L.map(m => g(m, 'purchased_t'))}, {name: 'Tiêu thụ', color: C.navy, kind: 'line', values: L.map(m => g(m, 'sold_t'))}], {unit: 'tấn', digits: 1, native: 'stack', stackable: true})
      : v1 === 'sale'
        ? chart(c1.host, 'cs-50-sale', L.map(mL), [{name: 'Xuất khẩu', color: C.gold, kind: 'bar', values: L.map(m => g(m, 'sold_export_t'))}, {name: 'Nội địa', color: C.teal, kind: 'bar', values: L.map(m => g(m, 'sold_domestic_t'))}], {unit: 'tấn', digits: 1, native: 'stack', stackable: true})
        : (() => { const ks = [...new Set(M.flatMap(r => Object.keys(r.processed_by_product || {})))].filter(k => !/^RSS ?[135]$|RSS3|RSS5|RSS1$/.test(k) || k === 'RSS 1,3,5');
          const pal = [C.navy, C.blue, C.teal, C.gold, C.plum, C.grey, C.sky, C.bronze];
          const v = (m, k) => { const x = at(m)?.processed_by_product; if (!x) return null; if (k === 'RSS 1,3,5' && !fin(x[k])) { const s = ['RSS3', 'RSS5', 'RSS1', 'RSS 3', 'RSS 5', 'RSS 1'].map(z => x[z]).filter(fin); return s.length ? s.reduce((u, w) => u + w, 0) : null; } return x[k] ?? null; };
          chart(c1.host, 'cs-50-prod', L.map(mL), ks.map((k, i) => ({name: k, color: pal[i % pal.length], kind: 'bar', values: L.map(m => v(m, k))})), {unit: 'tấn', digits: 1, native: 'stack', stackable: true}); })();
    seg(c1, 'Cách xem', [['src', 'Nguồn mủ'], ['sale', 'Kênh bán'], ['prod', 'Chế biến theo sản phẩm']], v1, k => { v1 = k; d1(); }); d1();
  }
  opsVolumes(p);
  stage(p, 'company', 'px', 'Giá', 'Giá bán so benchmark');
  if (M.length) {
    const q2 = panel('·', 'Giá bán của DPR đi theo giá SVR 10 thế nào?');
    const c2 = card('cs-51', 'DPR giá bán xuất khẩu so với SVR 10 Việt Nam', {sub: 'USD/tấn · theo tháng', source: dprSrc(lr) + '; ' + K.SRC.arbc + '; tự tính',
      info: 'Giá xuất khẩu DPR công bố (USD/tấn) theo tháng ghi nhận bán; SVR 10 là bình quân tháng giá ngày VRA báo ARBC (US cent/kg × 10). Hợp đồng thường ký trước giao hàng, nên chênh theo tháng gồm cả độ trễ.'});
    const c3 = card('cs-52', 'DPR giá bán bình quân (triệu đồng/tấn)', {sub: 'số công bố · số tự tính (doanh thu mủ ÷ tấn tiêu thụ)', source: dprSrc(lr) + '; tự tính',
      info: 'Giá công bố là số DPR in trong báo cáo. Số tự tính = doanh thu mủ ÷ tấn tiêu thụ cùng tháng; khác số công bố ở một số tháng (vd T4/2026: 52,14 công bố, 71,72 tự tính) do khác phạm vi doanh thu (gồm mủ gia công, điều chỉnh). Chart dùng số công bố làm chuỗi chính. T8/2026 số in 641,47 là lỗi in, để trống.'});
    q2.append(two(c2, c3)); p.append(q2);
    chart(c2.host, 'cs-51', L.map(mL), [{name: 'DPR giá xuất khẩu', color: C.gold, values: L.map(m => g(m, 'asp_export_usd_per_t'))}, {name: 'SVR 10 Việt Nam', color: C.navy, values: L.map(m => fin(svr(m)) ? svr(m) * 10 : null)}], {unit: 'USD/tấn', zeroBase: false});
    chart(c3.host, 'cs-52', L.map(mL), [{name: 'Công bố', color: C.navy, values: L.map(m => g(m, 'asp_published_mvnd_per_t'))}, {name: 'Tự tính', color: C.sky, values: L.map(m => g(m, 'asp_computed_mvnd_per_t'))},
      {name: 'Xuất khẩu', color: C.gold, values: L.map(m => g(m, 'asp_export_mvnd_per_t'))}, {name: 'Nội địa', color: C.teal, values: L.map(m => g(m, 'asp_domestic_mvnd_per_t'))}], {unit: 'triệu đồng/tấn', digits: 2, zeroBase: false});
  }
  opsAsp(p);
  stage(p, 'company', 'bridge', 'Doanh thu', 'Lượng – giá – cơ cấu');
  if (M.length) bridge(p, M, at, lr);
  stage(p, 'company', 'land', 'Ngoài mủ', 'Thanh lý, đền bù, KCN');
  landBridge(p);
  stage(p, 'company', 'cash', 'Tiền', 'Biên, dòng tiền, độ nhạy');
  cashPanel(p);
  sensitivity(p, M, lr);
  // khâu nào không có chart thì bỏ tiêu đề khâu và nút trên thanh luồng
  p.querySelectorAll(':scope>.pp-stage').forEach(h => { let n = h.nextElementSibling; if (!n || n.classList.contains('pp-stage')) { p.querySelector(`.pp-flow [data-pp-stage="${h.id}"]`)?.remove(); h.remove(); } });
  p.querySelectorAll('.pp-flow').forEach(f => f.querySelectorAll('.pp-flow-ar').forEach(ar => { if (!ar.nextElementSibling || ar.nextElementSibling.classList.contains('pp-flow-ar')) ar.remove(); }));
  p.querySelectorAll('.pp-flow').forEach(f => { const x = f.firstElementChild; if (x?.classList.contains('pp-flow-ar')) x.remove(); });
  renum(p, 5);
}
// Cầu nối doanh thu mủ DPR: cùng tháng năm trước → lượng → cơ cấu kênh (xuất khẩu/nội địa) → giá → chênh chưa phân bổ.
function bridge(p, M, at, lr) {
  const opts = M.filter(r => at(ymAdd(r.period, -12))).map(r => r.period);
  if (!opts.length) return;
  const q = panel('·', 'Doanh thu mủ của DPR thay đổi so cùng kỳ vì lượng, cơ cấu hay giá?');
  const c = card('cs-53', 'DPR: doanh thu mủ so cùng tháng năm trước', {sub: 'triệu đồng · tách lượng, cơ cấu kênh bán, giá', source: dprSrc(lr) + '; tự tính',
    info: 'Hiệu ứng lượng = (Q₁ − Q₀) × ASP₀. Cơ cấu = Q₁ × Σ (s₁ − s₀) × P₀ theo hai kênh xuất khẩu, nội địa (s = tỷ trọng tấn, P = giá công bố của kênh). Giá = Q₁ × Σ s₁ × (P₁ − P₀). ASP₀ = doanh thu mủ ÷ tấn tiêu thụ kỳ gốc. Phần chênh chưa phân bổ = thay đổi doanh thu thực tế − tổng ba hiệu ứng (do giá công bố của kênh khác doanh thu mủ ÷ tấn).'});
  q.append(c.el); p.append(q);
  let per = opts.at(-1);
  const draw = () => {
    const r1 = at(per), r0 = at(ymAdd(per, -12));
    const Q1 = r1.sold_t, Q0 = r0.sold_t, R1 = r1.latex_revenue_mvnd, R0 = r0.latex_revenue_mvnd, A0 = R0 / Q0;
    const ch = [['sold_export_t', 'asp_export_mvnd_per_t'], ['sold_domestic_t', 'asp_domestic_mvnd_per_t']];
    const ok = ch.every(([q, pp]) => [r1[q], r0[q], r1[pp], r0[pp]].every(fin));
    const vol = (Q1 - Q0) * A0;
    const mix = ok ? Q1 * ch.reduce((s, [q, pp]) => s + (r1[q] / Q1 - r0[q] / Q0) * r0[pp], 0) : null;
    const px = ok ? Q1 * ch.reduce((s, [q, pp]) => s + r1[q] / Q1 * (r1[pp] - r0[pp]), 0) : (R1 / Q1 - A0) * Q1;
    const res = R1 - R0 - vol - (mix || 0) - px;
    const steps = [{label: mL(r0.period), value: R0, total: true}, {label: 'Lượng', value: vol}];
    if (fin(mix)) steps.push({label: 'Cơ cấu kênh', value: mix});
    steps.push({label: fin(mix) ? 'Giá' : 'Giá & cơ cấu', value: px});
    if (Math.abs(res) > 0.5) steps.push({label: 'Chênh chưa phân bổ', value: res});
    steps.push({label: mL(r1.period), value: R1, total: true});
    waterfall(c.host, steps, {unit: 'triệu đồng', digits: 0});
  };
  const sel = el('label', 'cs-pick', `Tháng <select>${opts.map(o => `<option value="${o}"${o === per ? ' selected' : ''}>${mL(o)}</option>`).join('')}</select>`);
  sel.querySelector('select').addEventListener('change', e => { per = e.target.value; draw(); });
  c.ctl.append(sel); draw();
}

/* ---- Số vận hành theo năm (ops.json: GVR, PHR, TRC, DRI, DPR) ---- */
const OPS = D.ops && D.ops.companies;
const opsSrc = () => 'BCTN, tài liệu ĐHĐCĐ, thuyết minh BCTC (link từng số trong data/rubber/ops.json)';
const opsTk = () => OPS ? Object.keys(OPS).filter(t => (OPS[t].annual || []).length) : [];
function annualSeries(t, k) { const A = OPS[t].annual || []; return y => { const r = A.find(x => String(x.period) === String(y)); return r && fin(r[k]) ? r[k] : null; }; }
function opsYears() { return [...new Set(opsTk().flatMap(t => OPS[t].annual.map(r => String(r.period))))].filter(y => /^\d{4}$/.test(y)).sort(); }
const TKC = {GVR: C.navy, PHR: C.teal, DPR: C.gold, TRC: C.plum, DRI: C.grey};
function opsVolumes(p) {
  const T = opsTk(), Y = opsYears(); if (!T.length || !Y.length) return;
  const q = panel('·', 'Sản lượng khai thác, tiêu thụ và năng suất của từng doanh nghiệp theo năm');
  const c = card('cs-54', 'Sản lượng và năng suất theo năm', {sub: 'chọn chỉ tiêu · phạm vi theo công bố của từng doanh nghiệp', cadence: 'annual', kind: 'manual', source: opsSrc(),
    info: 'Số công bố trong BCTN, báo cáo HĐQT, tài liệu ĐHĐCĐ. Phạm vi (công ty mẹ hay hợp nhất, VN/Lào/Campuchia) ghi trong data/rubber/ops.json; GVR là toàn tập đoàn nên không so trực tiếp với các công ty con. Năm không công bố để trống.'});
  q.append(c.el); p.append(q);
  const M = [['tapped_t', 'Khai thác (tấn)', 'tấn'], ['sold_t', 'Tiêu thụ (tấn)', 'tấn'], ['purchased_t', 'Thu mua (tấn)', 'tấn'], ['area_tapping_ha', 'Diện tích khai thác (ha)', 'ha'], ['yield_t_per_ha', 'Năng suất (tấn/ha)', 'tấn/ha']]
    .filter(([k]) => T.some(t => Y.some(y => fin(annualSeries(t, k)(y)))));
  let m = M[0][0]; let t = T.filter(x => x !== 'GVR');
  const draw = () => { const [k, , u] = M.find(x => x[0] === m); chart(c.host, 'cs-54-' + k, Y, t.map(x => ({name: x, color: TKC[x] || C.slate, kind: 'bar', values: Y.map(annualSeries(x, k))})), {unit: u, digits: u === 'tấn/ha' ? 2 : 0, native: 'bar'}); };
  seg(c, 'Chỉ tiêu', M.map(([k, n]) => [k, n]), m, k => { m = k; draw(); });
  seg(c, 'Doanh nghiệp', T.map(x => [x, x]), t, ks => { t = ks; draw(); }); draw();
}
function opsAsp(p) {
  const T = opsTk(), Y = opsYears(); if (!T.length) return;
  if (!T.some(t => Y.some(y => fin(annualSeries(t, 'asp_mvnd_per_t')(y))))) return;
  const q = panel('·', 'Giá bán bình quân mủ của từng doanh nghiệp so với giá thế giới theo năm');
  const c = card('cs-55', 'Giá bán bình quân mủ theo năm', {sub: 'triệu đồng/tấn · nhãn công bố hoặc tự tính ghi trong bảng', cadence: 'annual', kind: 'manual', source: opsSrc() + '; ' + K.SRC.wb,
    info: 'Giá bán bình quân doanh nghiệp công bố; năm nào chỉ có doanh thu mủ và tấn tiêu thụ cùng phạm vi thì tự tính và ghi "tự tính" trong data/rubber/ops.json. TSR 20 World Bank bình quân năm (USD/kg) để so xu hướng, khác đồng tiền nên vẽ thành chỉ số 100 = năm đầu khi chọn "Chỉ số".'});
  q.append(c.el); p.append(q);
  let v = 'lvl';
  const tsrY = y => { const r = K.recs('wb_tsr20').filter(x => x.date.startsWith(y)); return r.length === 12 ? r.reduce((s, x) => s + x.value, 0) / 12 : null; };
  const draw = () => {
    const ser = T.map(t => ({name: t, color: TKC[t] || C.slate, values: Y.map(annualSeries(t, 'asp_mvnd_per_t'))}));
    if (v === 'idx') { ser.push({name: 'TSR 20 (USD)', color: C.sky, values: Y.map(tsrY)}); ser.forEach(s => { const b = s.values.find(fin); s.values = s.values.map(x => fin(x) && b ? x / b * 100 : null); }); }
    chart(c.host, 'cs-55-' + v, Y, ser, {unit: v === 'idx' ? 'chỉ số' : 'triệu đồng/tấn', digits: 1, zeroBase: false});
  };
  seg(c, 'Đơn vị', [['lvl', 'Triệu đồng/tấn'], ['idx', 'Chỉ số 100 (cùng TSR 20)']], v, k => { v = k; draw(); }); draw();
}
// Lợi nhuận ngoài mủ: BCTC (lợi nhuận gộp, lợi nhuận khác, lãi liên kết, doanh thu tài chính) + số thanh lý/đền bù/KCN theo năm từ thuyết minh.
function landBridge(p) {
  if (!E) return;
  const T = ['GVR', 'PHR', 'DPR', 'TRC', 'DRI'].filter(t => F.data[t]);
  const q = panel('·', 'Lợi nhuận đến từ bán mủ hay từ thanh lý vườn cây, đền bù đất, khu công nghiệp?');
  const c = card('cs-56', 'Cấu phần lợi nhuận trước thuế theo năm', {sub: 'tỷ đồng · lợi nhuận gộp, tài chính & liên kết, lợi nhuận khác (thanh lý, đền bù) · BCTC hợp nhất', cadence: 'quarterly', source: K.SRC.vnd + '; tự tính',
    info: 'Năm = cộng 4 quý BCTC. "Lợi nhuận khác" gồm thanh lý vườn cây, bồi thường đất (khoản thu nhập khác trên KQKD). "Tài chính & liên kết" = doanh thu tài chính − chi phí tài chính + lãi liên kết (gồm cổ tức, lãi từ công ty KCN). "Bán hàng & quản lý" là số âm. Tổng các cột = lợi nhuận trước thuế. Năm chưa đủ 4 quý ghi là lũy kế.'});
  q.append(c.el); p.append(q);
  let t = 'PHR';
  const draw = () => {
    const d = F.data[t], P = F.periods, ys = [...new Set(P.map(x => x.slice(0, 4)))];
    const sumY = (k, y) => { const ix = P.map((x, i) => x.startsWith(y) ? i : -1).filter(i => i >= 0); const v = ix.map(i => d[k][i]); return v.every(fin) ? v.reduce((s, x) => s + x, 0) : null; };
    const lab = ys.map(y => { const n = P.filter(x => x.startsWith(y)).length; return n < 4 ? `${n * 3}T/${y}` : y; });
    const fa = y => { const a1 = sumY('fin_income', y), a2 = sumY('fin_exp', y), a3 = sumY('assoc', y); return [a1, a2].every(fin) ? a1 - a2 + (a3 || 0) : null; };
    const sa = y => { const s1 = sumY('selling', y), s2 = sumY('admin', y); return [s1, s2].every(fin) ? -(s1 + s2) : null; };
    chart(c.host, 'cs-56-' + t, lab, [{name: 'Lợi nhuận gộp', color: C.teal, kind: 'bar', values: ys.map(y => sumY('gross', y))}, {name: 'Tài chính & liên kết', color: C.sky, kind: 'bar', values: ys.map(fa)},
      {name: 'Lợi nhuận khác', color: C.bronze, kind: 'bar', values: ys.map(y => sumY('other', y))}, {name: 'Bán hàng & quản lý', color: C.plum, kind: 'bar', values: ys.map(sa)},
      {name: 'Lợi nhuận trước thuế', color: C.navy, kind: 'line', values: ys.map(y => sumY('pbt', y))}], {unit: 'tỷ đồng', digits: 0, native: 'stack', stackable: true});
  };
  seg(c, 'Doanh nghiệp', T.map(x => [x, x]), t, k => { t = k; draw(); }); draw();
  landEvents(p);
}
function landEvents(p) {
  if (!OPS) return;
  const ev = Object.entries(OPS).flatMap(([t, o]) => (o.land_events || []).map(e => ({...e, t}))).filter(e => e.date).sort((x, y) => x.date < y.date ? -1 : 1);
  const rows = Object.entries(OPS).flatMap(([t, o]) => (o.annual || []).filter(r => [r.liquidation_bvnd, r.land_comp_bvnd, r.kcn_bvnd].some(fin)).map(r => ({...r, t})));
  if (rows.length) {
    const Y = opsYears(), T = [...new Set(rows.map(r => r.t))];
    const q = panel('·', 'Thanh lý vườn cây, đền bù đất và KCN đóng góp bao nhiêu mỗi năm?');
    const c = card('cs-57', 'Thu nhập thanh lý vườn cây, đền bù đất, KCN', {sub: 'tỷ đồng · theo thuyết minh BCTC / BCTN', cadence: 'annual', kind: 'manual', source: opsSrc(),
      info: 'Số theo thuyết minh thu nhập khác, doanh thu bộ phận hoặc BCTN; phạm vi và kỳ ghi nhận theo từng nguồn. Tiền đền bù, giá trị thanh lý cây và lợi nhuận từ KCN theo dõi riêng; ô trống là doanh nghiệp không công bố tách.'});
    q.append(c.el); p.append(q);
    let t = T.includes('PHR') ? 'PHR' : T[0];
    const v = (k, y) => { const r = rows.find(x => x.t === t && String(x.period) === y); return r && fin(r[k]) ? r[k] : null; };
    const draw = () => chart(c.host, 'cs-57-' + t, Y, [{name: 'Thanh lý vườn cây', color: C.green, kind: 'bar', values: Y.map(y => v('liquidation_bvnd', y))}, {name: 'Đền bù đất', color: C.bronze, kind: 'bar', values: Y.map(y => v('land_comp_bvnd', y))}, {name: 'KCN', color: C.plum, kind: 'bar', values: Y.map(y => v('kcn_bvnd', y))}], {unit: 'tỷ đồng', digits: 0, native: 'stack', stackable: true});
    seg(c, 'Doanh nghiệp', T.map(x => [x, x]), t, k => { t = k; draw(); }); draw();
  }
  if (ev.length) {
    const q = panel('·', 'Dòng thời gian chuyển đất cao su sang KCN và đền bù: pháp lý → bàn giao → ghi nhận → thu tiền');
    const c = el('div', 'card cs-tl'); c.dataset.blockId = 'cs-58'; c.dataset.updateKind = 'manual'; c.dataset.cadence = 'event';
    const ST = {'pháp lý': C.grey, 'bàn giao': C.blue, 'ghi nhận': C.teal, 'thu tiền': C.gold};
    c.innerHTML = `<div class="chart-title">Sự kiện đất theo doanh nghiệp</div><div class="cs-tl-list">${ev.map(e => `<div class="cs-tl-row"><span class="cs-tl-d">${esc(dL(e.date))}</span><span class="cs-tl-t">${e.t}</span><span class="cs-tl-s" style="--c:${ST[e.stage] || C.slate}">${esc(e.stage || '')}</span><span class="cs-tl-x">${esc(e.project || '')}${fin(e.ha) ? ` · ${nf(e.ha, 0)} ha` : ''}${fin(e.amount_bvnd) ? ` · ${nf(e.amount_bvnd, 0)} tỷ đồng` : ''}</span><span class="cs-tl-l">${e.source_url ? a(e.source_url, 'nguồn') : ''}</span></div>`).join('')}</div><div class="pw-src">Nguồn: văn bản, nghị quyết, BCTC, BCTN của doanh nghiệp (link từng dòng)</div>`;
    q.append(c); p.append(q);
  }
}
function cashPanel(p) {
  if (!E) return;
  const T = ['GVR', 'PHR', 'DPR', 'TRC', 'DRI', 'TNC', 'HRC', 'BRR', 'DRG', 'RTB'].filter(t => F.data[t]);
  const q = panel('·', 'Lợi nhuận có chuyển thành tiền không, và biên gộp từng doanh nghiệp ra sao?');
  const c1 = card('cs-59', 'Biên gộp theo quý', {sub: '% · lợi nhuận gộp ÷ doanh thu thuần · BCTC hợp nhất (gồm mảng ngoài mủ)', cadence: 'quarterly', source: K.SRC.vnd + '; tự tính'});
  const c2 = card('cs-60', 'CFO so với LNST theo năm', {sub: 'tỷ đồng · lưu chuyển tiền thuần từ HĐKD (báo cáo năm) và LNST', cadence: 'annual', source: K.SRC.vnd + '; tự tính',
    info: 'CFO lấy từ báo cáo lưu chuyển tiền tệ năm (VNDirect); LNST năm = cộng 4 quý. Tiền đền bù đất có thể nằm ở hoạt động đầu tư (thu thanh lý tài sản) thay vì CFO, xem thuyết minh từng doanh nghiệp.'});
  q.append(two(c1, c2)); p.append(q);
  let t1 = ['PHR', 'DPR', 'TRC', 'DRI'];
  const P = F.periods;
  const d1 = () => chart(c1.host, 'cs-59', P.map(qL), t1.map(t => ({name: t, color: TKC[t] || C.slate, values: P.map((_, i) => { const g = F.data[t].gross[i], r = F.data[t].revenue[i]; return fin(g) && fin(r) && r > 0 ? g / r * 100 : null; })})), {unit: '%', digits: 1, zeroBase: false});
  seg(c1, 'Doanh nghiệp', T.map(x => [x, x]), t1, ks => { t1 = ks; d1(); }); d1();
  let t2 = 'PHR';
  const d2 = () => { const Y = F.years, d = F.data[t2], cf = F.cf_annual[t2].cfo;
    const np = Y.map(y => { const ix = P.map((x, i) => x.startsWith(y) ? i : -1).filter(i => i >= 0); const v = ix.map(i => d.npat[i]); return ix.length === 4 && v.every(fin) ? v.reduce((s, x) => s + x, 0) : null; });
    chart(c2.host, 'cs-60-' + t2, Y, [{name: 'CFO', color: C.teal, kind: 'bar', values: cf}, {name: 'LNST', color: C.navy, kind: 'bar', values: np}], {unit: 'tỷ đồng', native: 'bar'}); };
  seg(c2, 'Doanh nghiệp', T.map(x => [x, x]), t2, k => { t2 = k; d2(); }); d2();
}
// Kịch bản: mỗi +1 triệu đồng/tấn giá bán × lượng bán áp dụng; lãi gộp sau phần giá mua ngoài tăng theo; LNST sau thuế; phần cổ đông mẹ.
function sensitivity(p, M, lr) {
  const base = {};
  if (lr?.plan_year?.sold_t) base.DPR = {sold: lr.plan_year.sold_t, buy: lr.plan_year.purchased_t && lr.plan_year.sold_t ? lr.plan_year.purchased_t / lr.plan_year.sold_t * 100 : 15, note: `kế hoạch tiêu thụ ${lr.period.slice(0, 4)} (báo cáo SXKD ${mL(lr.period)})`};
  if (OPS) Object.entries(OPS).forEach(([t, o]) => { if (base[t]) return; const r = [...(o.annual || [])].reverse().find(x => fin(x.sold_t)); if (r) base[t] = {sold: r.sold_t, buy: fin(r.purchased_t) ? r.purchased_t / r.sold_t * 100 : 0, note: `tiêu thụ năm ${r.period} (${o.scope || 'theo công bố'})`}; });
  const T = Object.keys(base); if (!T.length) return;
  const q = panel('·', 'Kịch bản: giá bán tăng thêm 1 triệu đồng/tấn thì doanh thu và lợi nhuận tăng bao nhiêu?');
  const c = el('div', 'card cs-sens'); c.dataset.blockId = 'cs-61'; c.dataset.updateKind = 'manual'; c.dataset.cadence = 'event';
  c.innerHTML = `<div class="chart-title">Độ nhạy lợi nhuận theo giá bán (kịch bản, tự chỉnh tham số)</div>
    <div class="cs-sens-grid"><div class="cs-sens-in">
      <label>Doanh nghiệp <select data-k="t">${T.map(t => `<option>${t}</option>`).join('')}</select></label>
      <label>Thay đổi giá bán (triệu đồng/tấn) <input data-k="dp" type="number" step="0.5" value="1"></label>
      <label>Lượng bán áp dụng (tấn/năm) <input data-k="q" type="number" step="100"></label>
      <label>Tỷ trọng mủ mua ngoài (%) <input data-k="buy" type="number" step="1"></label>
      <label>Giá mua ngoài tăng theo giá bán (%) <input data-k="pass" type="number" step="5" value="100"></label>
      <label>Chi phí khác tăng thêm (triệu đồng/tấn) <input data-k="cost" type="number" step="0.1" value="0"></label>
      <label>Thuế TNDN (%) <input data-k="tax" type="number" step="1" value="20"></label>
      <label>Lợi ích cổ đông công ty mẹ (%) <input data-k="own" type="number" step="1" value="100"></label>
    </div><div class="cs-sens-out"></div></div>
    <div class="pw-src">Nguồn: lượng bán theo báo cáo doanh nghiệp (ghi dưới kết quả); tự tính theo tham số người dùng nhập</div>`;
  q.append(c); p.append(q);
  const I = k => c.querySelector(`[data-k="${k}"]`);
  const fill = () => { const b = base[I('t').value]; I('q').value = Math.round(b.sold); I('buy').value = Math.round(b.buy); calc(); };
  const calc = () => {
    const n = k => +I(k).value || 0, b = base[I('t').value];
    const rev = n('dp') * n('q') / 1000, buyCost = n('dp') * n('q') * n('buy') / 100 * n('pass') / 100 / 1000, oc = n('cost') * n('q') / 1000;
    const gp = rev - buyCost - oc, np = gp * (1 - n('tax') / 100), par = np * n('own') / 100;
    c.querySelector('.cs-sens-out').innerHTML = [['Doanh thu tăng thêm', rev], ['Giá vốn mủ mua ngoài tăng', -buyCost], ['Chi phí khác tăng', -oc], ['Lãi gộp tăng thêm', gp], ['LNST tăng thêm', np], ['Phần cổ đông công ty mẹ', par]]
      .map(([l, v], i) => `<div class="cs-sens-r${i >= 3 ? ' b' : ''}"><span>${l}</span><b>${sg(v, 1)} tỷ đồng</b></div>`).join('') + `<p class="cs-sens-n">Lượng mặc định: ${esc(b.note)}. Kịch bản giữ nguyên lượng; không gồm thay đổi tỷ giá, cơ cấu grade, thanh lý vườn cây.</p>`;
  };
  c.querySelectorAll('input').forEach(x => x.addEventListener('input', calc)); I('t').addEventListener('change', fill); fill();
}
if (DPR || OPS || E) PIC.company = company;

/* ======================= 03 CẦU TRUNG QUỐC ======================= */
const DM = D.demand && D.demand.series || {};
const dser = k => (DM[k] && DM[k].records) || [];
const dsrc = k => DM[k] ? a(DM[k].source_url || '#', DM[k].source || 'nguồn') : '';
function demand() {
  const p = $('#cs-pp-demand'), CN = D.cn_imports;
  const tire = dser('cn_tire_output'), imp = dser('cn_nr_sr_import');
  const ks = [];
  if (tire.length) { const r = tire.at(-1); ks.push(kpi('Lốp ô tô Trung Quốc · ' + (r.date.includes('_') ? r.date : mL(r.date)), nf(r.value, 0), DM.cn_tire_output.unit || '', fin(r.yoy_pub) ? `${sg(r.yoy_pub)}% so cùng kỳ (công bố)` : '', 'sản lượng tháng · NBS', tire.slice(-24).map(x => x.value), C.plum)); }
  if (imp.length) { const r = imp.at(-1); ks.push(kpi('TQ nhập cao su tự nhiên & tổng hợp · ' + mL(r.date.slice(0, 7)), nf(r.value, 1), DM.cn_nr_sr_import.unit || '', fin(r.yoy_pub) ? `${sg(r.yoy_pub)}% so cùng kỳ (công bố)` : '', 'Hải quan Trung Quốc', imp.slice(-24).map(x => x.value), C.navy)); }
  const q = K.last('exp_q');
  ks.push(kpi('Việt Nam xuất khẩu cao su · ' + mL(q.date), nf(q.value, 1), 'nghìn tấn', `${sg(K.yoy('exp_q', q.date))}% so cùng kỳ`, 'Hải quan Việt Nam', K.tail('exp_q', 24), C.teal));
  if (ks.length) p.append(kpiRow(ks));
  // Chuỗi tháng từ khối nhập tay: một card mỗi chuỗi, có YoY công bố nếu có.
  const mon = (id, k, title, color, q1) => {
    const R = dser(k); if (R.length < 3) return;
    const qq = panel('·', q1);
    const c = card(id, title, {sub: `${esc(DM[k].unit || '')} · theo tháng${R.some(r => r.date.includes('_')) ? ' · T1–T2 công bố gộp' : ''}`, source: dsrc(k), kind: 'manual',
      info: esc(DM[k].note || DM[k].name || '')});
    qq.append(c.el); p.append(qq);
    let v = 'lvl';
    const draw = () => chart(c.host, id + '-' + v, R.map(r => r.date.includes('_') ? 'T1–2/' + r.date.slice(0, 4) : mL(r.date.slice(0, 7))),
      v === 'lvl' ? [{name: title, color, kind: 'bar', values: R.map(r => r.value)}] : [{name: '% so cùng kỳ (công bố)', color, kind: 'bar', values: R.map(r => r.yoy_pub ?? null)}], {unit: v === 'lvl' ? DM[k].unit || '' : '%', digits: 1, native: 'bar'});
    if (R.some(r => fin(r.yoy_pub))) seg(c, 'Cách xem', [['lvl', 'Giá trị'], ['yoy', '% so cùng kỳ']], v, x => { v = x; draw(); });
    draw();
  };
  mon('cs-30', 'cn_tire_output', 'Sản lượng lốp ô tô Trung Quốc', C.plum, 'Nhà máy lốp Trung Quốc sản xuất bao nhiêu mỗi tháng?');
  mon('cs-31', 'cn_tire_export', 'Xuất khẩu lốp mới Trung Quốc', C.gold, 'Trung Quốc xuất khẩu bao nhiêu lốp?');
  mon('cs-32', 'cn_cv_sales', 'Doanh số xe thương mại Trung Quốc', C.grey, 'Xe thương mại (xe tải, xe khách) bán bao nhiêu mỗi tháng?');
  mon('cs-33', 'cn_nr_sr_import', 'Trung Quốc nhập khẩu cao su tự nhiên & tổng hợp', C.navy, 'Trung Quốc nhập bao nhiêu cao su mỗi tháng?');
  if (CN && CN.by_hs && CN.by_hs['4001']) {
    const R = CN.by_hs['4001'], pal = [C.navy, C.teal, C.gold, C.plum, C.grey, C.sky];
    const qq = panel('·', 'Trung Quốc nhập cao su tự nhiên (HS 4001) từ những nước nào?');
    const c = card('cs-34', 'Trung Quốc nhập HS 4001 theo nước xuất xứ', {sub: `nghìn tấn · theo tháng · đến ${mL(String(CN.latest).slice(0, 4) + '-' + String(CN.latest).slice(4))} (độ trễ của Comtrade)`, source: K.SRC.comtrade,
      info: 'Số Trung Quốc khai báo nhập (CIF, kỳ nhập), không cộng với số xuất khẩu Việt Nam (FOB, kỳ xuất). HS 4001 gồm latex 400110, RSS 400121, TSNR 400122, loại khác 400129. Hỗn hợp cao su tự nhiên và tổng hợp HS 400280 là chuỗi riêng (chọn ở nút). Khối lượng một số kỳ là ước tính của nguồn.'});
    qq.append(c.el); p.append(qq);
    let v = 'p';
    const draw = () => {
      if (v === 'p') { const ps = CN.partners, rest = R.map(r => fin(r.world_kt) ? r.world_kt - ps.reduce((s, x) => s + (r[x] || 0), 0) : null);
        chart(c.host, 'cs-34-p', R.map(r => mL(r.date)), [...ps.map((x, i) => ({name: x === 'Viet Nam' ? 'Việt Nam' : x, color: pal[i % pal.length], kind: 'bar', values: R.map(r => r[x])})), {name: 'Nước khác', color: '#C9D0EE', kind: 'bar', values: rest}], {unit: 'nghìn tấn', digits: 1, native: 'stack', stackable: true}); }
      else { const H = CN.by_hs['400280'] || []; chart(c.host, 'cs-34-h', R.map(r => mL(r.date)), [{name: 'HS 4001 (tự nhiên)', color: C.navy, kind: 'bar', values: R.map(r => r.world_kt)}, {name: 'HS 400280 (hỗn hợp)', color: C.gold, kind: 'bar', values: R.map(r => H.find(x => x.date === r.date)?.world_kt ?? null)}], {unit: 'nghìn tấn', digits: 1, native: 'bar'}); }
    };
    seg(c, 'Cách xem', [['p', 'Theo nước (HS 4001)'], ['h', 'HS 4001 và 400280']], v, x => { v = x; draw(); }); draw();
  }
  renum(p, 3);
}
if (Object.keys(DM).some(k => /^cn_/.test(k)) || (D.cn_imports && D.cn_imports.by_hs)) PIC.demand = demand;

/* ======================= 04 CUNG & TỒN KHO ======================= */
function supply() {
  const p = $('#cs-pp-supply');
  const st = (id, keys, title, q1) => {
    const ok = keys.filter(([k]) => dser(k).length > 2); if (!ok.length) return;
    const qq = panel('·', q1);
    const c = card(id, title, {sub: `${esc(DM[ok[0][0]].unit || '')} · số dư tại mốc, không cộng các kỳ`, source: ok.map(([k]) => dsrc(k)).join('; '), kind: 'manual', cadence: DM[ok[0][0]].freq || 'weekly',
      info: ok.map(([k]) => esc(DM[k].note || DM[k].name || '')).join(' ')});
    qq.append(c.el); p.append(qq);
    const dates = [...new Set(ok.flatMap(([k]) => dser(k).map(r => r.date)))].sort();
    const ix = Object.fromEntries(ok.map(([k]) => [k, Object.fromEntries(dser(k).map(r => [r.date, r.value]))]));
    chart(c.host, id, dates.map(d => d.length > 7 ? dL(d) : mL(d)), ok.map(([k, n, col]) => ({name: n, color: col, values: dates.map(d => ix[k][d] ?? null)})), {unit: DM[ok[0][0]].unit || '', digits: 0, zeroBase: false, flatTicks: dates.length > 60});
  };
  if (dser('shfe_ru_stock').length > 2 || dser('ine_nr_stock').length > 2) {
    const qq = panel('·', 'Tồn kho cao su ở kho sàn Trung Quốc tăng hay giảm?');
    const c = card('cs-40', 'Tồn kho cao su trên sàn Trung Quốc', {sub: 'tấn · cuối tuần · số dư tại mốc, không cộng các kỳ', cadence: 'weekly', kind: 'manual', source: dsrc('shfe_ru_stock') || dsrc('ine_nr_stock'),
      info: 'Báo cáo tồn kho tuần SHFE (gồm INE): "tổng kho" là tổng hàng trong kho được chỉ định đã báo cáo; "phiếu kho" là phần đã đăng ký thành phiếu kho giao nhận được (warrant). Phiếu kho RU thường giảm mạnh quanh kỳ hết hạn phiếu cũ (tháng 11) theo quy định sàn. Không gồm kho Thanh Đảo ngoài sàn.'});
    qq.append(c.el); p.append(qq);
    let k = 'shfe_ru_stock';
    const draw = () => { const R = dser(k); chart(c.host, 'cs-40-' + k, R.map(r => dL(r.date)), [{name: 'Tổng kho báo cáo', color: C.sky, kind: 'bar', values: R.map(r => r.total_stock ?? null)}, {name: 'Phiếu kho', color: C.navy, kind: 'line', values: R.map(r => r.value)}], {unit: 'tấn', native: 'bar'}); };
    seg(c, 'Sàn', [['shfe_ru_stock', 'SHFE RU'], ['ine_nr_stock', 'INE NR (TSR 20)']].filter(([x]) => dser(x).length), k, x => { k = x; draw(); }); draw();
  }
  st('cs-41', [['my_stock', 'Malaysia', C.gold]], 'Tồn kho cao su tự nhiên Malaysia', 'Tồn kho cao su Malaysia cuối tháng');
  const mon2 = (id, keys, title, q1) => {
    const ok = keys.filter(([k]) => dser(k).length > 2); if (!ok.length) return;
    const qq = panel('·', q1);
    const c = card(id, title, {sub: `${esc(DM[ok[0][0]].unit || '')} · theo tháng`, source: ok.map(([k]) => dsrc(k)).join('; '), kind: 'manual'});
    qq.append(c.el); p.append(qq);
    const dates = [...new Set(ok.flatMap(([k]) => dser(k).map(r => r.date)))].sort();
    const ix = Object.fromEntries(ok.map(([k]) => [k, Object.fromEntries(dser(k).map(r => [r.date, r.value]))]));
    chart(c.host, id, dates.map(mL), ok.map(([k, n, col]) => ({name: n, color: col, kind: 'bar', values: dates.map(d => ix[k][d] ?? null)})), {unit: DM[ok[0][0]].unit || '', digits: 1, native: 'bar'});
  };
  mon2('cs-42', [['my_production', 'Sản lượng', C.green], ['my_consumption', 'Tiêu thụ nội địa', C.plum], ['my_export', 'Xuất khẩu', C.gold]], 'Malaysia: sản lượng, tiêu thụ, xuất khẩu cao su tự nhiên', 'Malaysia sản xuất, dùng và xuất bao nhiêu cao su?');
  const AW = dser('anrpc_world');
  if (AW.length) {
    const qq = panel('·', 'Sản lượng và tiêu thụ cao su tự nhiên thế giới (ANRPC)');
    const c = card('cs-43', 'Cung cầu cao su tự nhiên thế giới', {sub: `${esc(DM.anrpc_world.unit || 'nghìn tấn')} · theo năm · nhãn công bố / ước tính / dự báo theo kỳ phát hành`, source: dsrc('anrpc_world'), kind: 'manual', cadence: 'monthly',
      info: 'ANRPC báo cáo tháng; số năm hiện tại và năm sau là ước tính/dự báo, ghi kỳ phát hành (vintage). Cột chênh = sản lượng − tiêu thụ, chỉ khi hai vế cùng nguồn, cùng phạm vi.'});
    qq.append(c.el); p.append(qq);
    const lab = AW.map(r => `${r.date}${r.status && r.status !== 'công bố' ? ' (' + r.status + ')' : ''}`);
    chart(c.host, 'cs-43', lab, [{name: 'Sản lượng', color: C.green, kind: 'bar', values: AW.map(r => r.production)}, {name: 'Tiêu thụ', color: C.plum, kind: 'bar', values: AW.map(r => r.consumption)},
      {name: 'Sản lượng − tiêu thụ', color: C.navy, kind: 'line', values: AW.map(r => fin(r.production) && fin(r.consumption) ? r.production - r.consumption : null)}], {unit: DM.anrpc_world.unit || 'nghìn tấn', digits: /triệu/.test(DM.anrpc_world.unit || '') ? 2 : 0, native: 'bar'});
  }
  const FA = DM.fao && DM.fao.records || [];
  if (FA.length) {
    const qq = panel('·', 'Diện tích, sản lượng và năng suất cao su của các nước trồng chính');
    const c = card('cs-44', 'Sản lượng, diện tích thu hoạch, năng suất theo nước', {sub: 'theo năm · FAOSTAT · chọn chỉ tiêu', source: dsrc('fao') || a('https://www.fao.org/faostat/en/#data/QCL', 'FAOSTAT QCL'), kind: 'manual', cadence: 'annual'});
    qq.append(c.el); p.append(qq);
    const cs = [...new Set(FA.map(r => r.country))], ys = [...new Set(FA.map(r => r.year))].sort(), pal = [C.navy, C.teal, C.gold, C.plum, C.grey, C.sky, C.bronze, C.green, C.slate];
    let m = 'production_t', sel = cs.filter(x => /Viet|Thai|Indo|Malay|Ivoire|C.te/.test(x)).slice(0, 5);
    const U = {production_t: ['nghìn tấn', 1e3], area_ha: ['nghìn ha', 1e3], yield_kg_ha: ['kg/ha', 1]};
    const draw = () => chart(c.host, 'cs-44-' + m, ys.map(String), sel.map(x => ({name: x === 'Viet Nam' ? 'Việt Nam' : x, color: pal[cs.indexOf(x) % pal.length], values: ys.map(y => { const r = FA.find(z => z.country === x && z.year === y); return r && fin(r[m]) ? r[m] / U[m][1] : null; })})), {unit: U[m][0], digits: m === 'yield_kg_ha' ? 0 : 1, zeroBase: false});
    seg(c, 'Chỉ tiêu', [['production_t', 'Sản lượng'], ['area_ha', 'Diện tích thu hoạch'], ['yield_kg_ha', 'Năng suất']], m, x => { m = x; draw(); });
    seg(c, 'Nước', cs.map(x => [x, x === 'Viet Nam' ? 'Việt Nam' : x]), sel, x => { sel = x; draw(); }); draw();
  }
  renum(p, 4);
}
if (['shfe_ru_stock', 'ine_nr_stock', 'my_stock', 'my_production', 'anrpc_world', 'fao'].some(k => DM[k] && (DM[k].records || []).length)) PIC.supply = supply;
})();
