/* Điện · bộ quy tắc nhận định cho tab Bức tranh ngành (12/11/2026).
   Hàm thuần: nhận "facts" (số đã tính từ dữ liệu trên trang) → trả nhận định có điều kiện, không đọc DOM, không có số viết cứng.
   Luồng: dữ liệu → phép tính (power-picture.js) → quy tắc ở đây → kết luận → kiểm tra hiệu lực (thiếu số / số cũ thì không xuất).
   Nhãn: mức A quan sát · B diễn giải · C hàm ý có điều kiện; trạng thái Verified · Estimated · Scenario · Insufficient · Stale.
   Kiểm thử: node tests/power-insights.test.cjs (tình huống tăng, giảm, đi ngang, thiếu, cũ). */
(function (root) {
'use strict';
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 1) => !fin(v) ? '—' : Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
const sg = (v, d = 1) => !fin(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d);
const pc = (v, d = 1) => !fin(v) ? '—' : sg(v, d) + '%';
const pp = (v, d = 1) => !fin(v) ? '—' : sg(v, d) + ' đ.p.';
const days = (a, b) => (!a || !b) ? null : Math.round((Date.parse(b) - Date.parse(a.length === 7 ? lastOfMonth(a) : a)) / 864e5);
function lastOfMonth(m) { const d = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)); return d.toISOString().slice(0, 10); }

// Độ mới: số ngày tối đa từ ngày quan sát (tháng: từ cuối tháng) tới ngày xem, theo tần suất nguồn.
const MAX_AGE = {daily: 10, monthly: 75, season: 120, reservoir: 10};
const timely = (asOf, today, kind) => { const d = days(asOf, today); return d != null && d <= MAX_AGE[kind]; };

// Thang thứ bậc (không phải điểm số): biên độ theo ngưỡng của từng chỉ tiêu, mức kéo dài theo số tháng cùng chiều gần nhất.
const level3 = (v, hi, mid) => !fin(v) ? null : Math.abs(v) >= hi ? 3 : Math.abs(v) >= mid ? 2 : 1;
const MAG = ['', 'thấp', 'trung bình', 'cao'];
const persistOf = n => n == null ? null : n >= 3 ? 2 : n === 2 ? 1 : 0;
const PERSIST = ['chưa kéo dài', '2/3 tháng cùng chiều', '3/3 tháng cùng chiều'];
const REL = ['', 'gián tiếp (qua điều kiện hợp đồng, giá)', 'trực tiếp (sản lượng là biến lợi nhuận chính)'];
const EVID = {Verified: 3, Estimated: 2, Scenario: 1, Insufficient: 0};
const STATUS = {
  Verified: 'Số từ nguồn công bố hoặc tính trực tiếp từ nguồn đó',
  Estimated: 'Ước tính từ giả định nêu kèm (suất hao nhiệt, tỷ giá…)',
  Scenario: 'Kịch bản do người dùng hoặc cơ quan đặt ra, không phải số thực tế',
  Insufficient: 'Chưa đủ dữ liệu để kết luận',
  Stale: 'Dữ liệu đã cũ so với tần suất công bố'
};

/* ---------- Ứng viên insight cho Industry Pulse ---------- */
function candidates(f) {
  const out = [], D = f.demand || {}, Hy = f.hydro || {}, X = f.dispatch || {}, Pr = f.price || {}, dt = f.dates || {};
  const push = o => out.push({level: 'B', evidence: 'Verified', ...o, timely: o.timely !== false});
  if (fin(Hy.yoy) && Math.abs(Hy.yoy) >= 10) {
    const both = fin(Hy.waterYoY) && fin(Hy.water5y) && Hy.waterYoY < 0 && Hy.water5y < 0;
    push({id: 'hydro', segment: 'Thủy điện', section: 'hydro', panel: 'hydro-company',
      headline: Hy.yoy < 0 ? `Thủy điện ${f.mLabel} ${pc(Hy.yoy)} so cùng kỳ${both ? '; nước về thấp hơn cả năm trước và trung bình 5 năm' : ''}` : `Thủy điện ${f.mLabel} ${pc(Hy.yoy)} so cùng kỳ`,
      why: 'Chi phí thủy điện chủ yếu cố định nên sản lượng là biến lợi nhuận chính; nước về quyết định khả năng phát các tháng sau.',
      confirm: 'Nước về và mực nước hồ T12–T2; sản lượng thủy điện tháng kế tiếp.',
      magnitude: level3(Hy.yoy, 20, 10), persist: persistOf(Hy.sameSign3), relevance: 2, asOf: dt.daily, timely: timely(dt.daily, f.today, 'daily')});
  }
  if (fin(X.thermalDpp) && fin(X.hydroDpp) && Math.abs(X.thermalDpp) >= 2) {
    const toThermal = X.thermalDpp > 0 && X.hydroDpp < 0;
    push({id: 'dispatch', segment: 'Nhiệt điện than, khí', section: 'dispatch', panel: 'dispatch-system',
      headline: toThermal ? `Huy động chuyển sang nhiệt điện: tỷ trọng than + khí ${pp(X.thermalDpp)} từ đầu năm, thủy điện ${pp(X.hydroDpp)}` : `Tỷ trọng than + khí ${pp(X.thermalDpp)} từ đầu năm`,
      why: 'Sản lượng nhiệt điện tăng; tác động lợi nhuận còn phụ thuộc Qc, giá thực nhận và chi phí nhiên liệu từng nhà máy.',
      confirm: 'FMP và giá than, LNG cùng kỳ; tỷ lệ Qc năm của nhà máy.',
      magnitude: level3(X.thermalDpp, 6, 3), persist: persistOf(X.thermalSameSign3), relevance: 1, asOf: dt.daily, timely: timely(dt.daily, f.today, 'daily')});
  }
  if (fin(D.yoy) && (D.yoy >= 8 || D.yoy <= 2)) {
    push({id: 'demand', segment: 'Toàn ngành; xây lắp – thiết bị', section: 'demand', panel: 'demand-momentum',
      headline: D.yoy >= 8 ? `Nhu cầu điện ${f.mLabel} ${pc(D.yoy)} so cùng kỳ, từ đầu năm ${pc(D.ytd)}` : `Nhu cầu điện ${f.mLabel} chỉ ${pc(D.yoy)} so cùng kỳ`,
      why: D.yoy >= 8 ? 'Cầu tăng nhanh kéo nguồn biên (than, khí) huy động nhiều hơn và làm tăng nhu cầu nguồn, lưới mới.' : 'Cầu yếu làm giảm huy động nguồn biên trước, ảnh hưởng nhiệt điện nhiều hơn thủy điện.',
      confirm: 'Tăng trưởng 3 tháng tới; Pmax mùa nóng.', magnitude: level3(D.yoy, 10, 5), persist: persistOf(D.sameSign3), relevance: 1, asOf: dt.daily, timely: timely(dt.daily, f.today, 'daily')});
  }
  if (fin(Pr.fmpYoY) && Math.abs(Pr.fmpYoY) >= 20) {
    push({id: 'fmp', segment: 'Nhà máy chào giá trực tiếp', section: 'economics', panel: 'econ-prices',
      headline: `Giá thị trường FMP ${f.fmpLabel} ${nf(Pr.fmp, 0)} đ/kWh, ${pc(Pr.fmpYoY)} so cùng kỳ`,
      why: 'FMP chỉ tác động phần điện năng ngoài Qc và khi vượt chi phí biến đổi; không phải giá thực nhận của mọi nhà máy.',
      confirm: 'FMP các tháng mùa khô; tỷ lệ Qc 2027.', magnitude: level3(Pr.fmpYoY, 50, 20), persist: persistOf(Pr.fmpSameSign3), relevance: 1, asOf: dt.fmp, timely: timely(dt.fmp, f.today, 'monthly')});
  }
  if (fin(Pr.jkm3) && Math.abs(Pr.jkm3) >= 20) {
    push({id: 'lng', segment: 'LNG', section: 'economics', panel: 'econ-unit',
      headline: `Giá LNG JKM ${pc(Pr.jkm3)} trong 3 tháng`,
      why: 'LNG đắt lên làm chi phí biến đổi của nhà máy LNG tăng; huy động ngoài Qc kém cạnh tranh hơn nếu FMP không tăng tương ứng.',
      confirm: 'JKM; FMP; Qc của Nhơn Trạch 3 & 4.', magnitude: level3(Pr.jkm3, 40, 20), persist: null, relevance: 1, asOf: dt.fuel, timely: timely(dt.fuel, f.today, 'daily')});
  }
  if (fin(Pr.coal3) && Math.abs(Pr.coal3) >= 15) {
    push({id: 'coal', segment: 'Nhiệt điện than nhập khẩu', section: 'economics', panel: 'econ-unit',
      headline: `Giá than Newcastle ${pc(Pr.coal3)} trong 3 tháng`, why: 'Tác động chi phí than nhập; than nội theo giá TKV ít biến động hơn.',
      confirm: 'Giá than nhập về cảng; cơ chế chuyển ngang trong PPA.', magnitude: level3(Pr.coal3, 30, 15), persist: null, relevance: 1, asOf: dt.fuel, timely: timely(dt.fuel, f.today, 'daily')});
  }
  if (fin(Hy.oni) && Math.abs(Hy.oni) >= 1) {
    push({id: 'enso', segment: 'Thủy điện', section: 'hydro', panel: 'hydro-climate',
      headline: `ONI ${Hy.oniSeason} ${sg(Hy.oni, 2)} °C (${Hy.oni > 0 ? 'El Niño' : 'La Niña'})`,
      why: Hy.oni > 0 ? 'El Niño thường đi kèm mùa khô ít mưa hơn ở Việt Nam (quan hệ lịch sử, chưa có mô hình độ trễ).' : 'La Niña thường đi kèm mưa nhiều hơn (quan hệ lịch sử).',
      confirm: 'Nước về hồ các tháng tới; dự báo ENSO của NOAA.', magnitude: level3(Hy.oni, 1.5, 1), persist: null, relevance: 1, asOf: dt.oni, timely: timely(dt.oni, f.today, 'season')});
  }
  return out;
}
const key = c => [c.timely ? 1 : 0, c.magnitude || 0, c.persist ?? -1, c.relevance || 0, EVID[c.evidence] || 0];
function top(f, n = 3) {
  return candidates(f).filter(c => c.timely).sort((a, b) => { const x = key(a), y = key(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] - x[i]; return 0; }).slice(0, n);
}
const describe = c => [`Biên độ: ${MAG[c.magnitude] || '—'}`, c.persist != null ? `Kéo dài: ${PERSIST[c.persist]}` : 'Kéo dài: chưa đánh giá', `Liên quan lợi nhuận: ${REL[c.relevance]}`, `Bằng chứng: ${c.evidence}`];

/* ---------- Headline trạng thái ngành: chỉ xuất khi đủ ≥2 vế có số còn mới ---------- */
function state(f) {
  const D = f.demand || {}, Hy = f.hydro || {}, X = f.dispatch || {}, ok = timely(f.dates?.daily, f.today, 'daily'), parts = [];
  if (!ok) return {valid: false, reason: 'Bản tin vận hành EVN đã cũ hơn ' + MAX_AGE.daily + ' ngày'};
  if (fin(Hy.yoy) && Math.abs(Hy.yoy) >= 10) parts.push(`thủy điện ${Hy.yoy < 0 ? 'giảm' : 'tăng'} mạnh (${pc(Hy.yoy)} ${f.mLabel})`);
  if (fin(D.yoy)) parts.push(D.yoy >= 5 ? `nhu cầu điện tăng ${pc(D.yoy)}` : D.yoy <= 0 ? `nhu cầu điện giảm ${pc(D.yoy)}` : `nhu cầu điện tăng chậm ${pc(D.yoy)}`);
  const shift = fin(X.thermalDpp) && fin(X.hydroDpp) && X.thermalDpp >= 2 && X.hydroDpp <= -2;
  if (shift) parts.push('cơ cấu huy động chuyển sang nhiệt điện');
  if (parts.length < 2) return {valid: false, reason: 'Chưa đủ hai tín hiệu đạt ngưỡng'};
  const tail = shift ? '; lợi nhuận nhiệt điện còn phụ thuộc giá nhiên liệu và Qc' : '';
  return {valid: true, text: parts.join(', ').replace(/^./, c => c.toUpperCase()) + tail + '.', asOf: f.dates.daily};
}

/* ---------- Nhu cầu: điện năng hay đỉnh ---------- */
function demand(f) {
  const D = f.demand || {}, out = {lines: [], cannot: [], watch: []};
  if (!fin(D.yoy)) { out.headline = 'Chưa đủ ngày bản tin để so cùng kỳ tháng gần nhất.'; out.status = 'Insufficient'; return out; }
  const acc = fin(D.accelNow) && fin(D.accelBefore) ? D.accelNow - D.accelBefore : null;
  const mom = acc == null ? null : Math.abs(acc) < 1 ? 'giữ nhịp' : acc > 0 ? 'tăng tốc' : 'giảm tốc';
  const gap = fin(D.pmaxYoY) && fin(D.energyYtd) ? D.pmaxYoY - D.energyYtd : null;
  out.momentum = mom; out.gap = gap;
  out.headline = `Nhu cầu ${f.mLabel} ${pc(D.yoy)} so cùng kỳ${mom ? `, ${mom} (3 tháng ${pc(D.accelNow)} so ${pc(D.accelBefore)})` : ''}` +
    (gap == null ? '.' : Math.abs(gap) < 1 ? '; đỉnh và điện năng tăng gần cùng tốc độ.' : gap > 0 ? '; đỉnh tăng nhanh hơn điện năng.' : '; mức tăng thể hiện chủ yếu ở điện năng hơn là ở đỉnh.');
  out.lines.push(['A', `Điện năng ${f.mLabel} ${pc(D.yoy)}, từ đầu năm ${pc(D.ytd)} (cùng ngày đối chiếu).`]);
  if (fin(D.pmaxYoY)) out.lines.push(['A', `Pmax từ đầu năm ${nf(D.pmax, 0)} MW (${D.pmaxDate}), ${pc(D.pmaxYoY)} so đỉnh cùng khoảng năm trước.`]);
  if (gap != null) out.lines.push(['B', gap > 1 ? 'Áp lực công suất đỉnh tăng tương đối nhanh hơn áp lực điện năng (hệ số phụ tải giảm).' : gap < -1 ? 'Áp lực đáp ứng tổng điện năng (nhiên liệu, nước) tăng nhanh hơn áp lực đỉnh (hệ số phụ tải tăng).' : 'Hai loại áp lực tăng tương đương.']);
  out.cannot.push('Chưa thể kết luận hệ thống giờ cao điểm bớt hay thêm căng: trang chưa có công suất khả dụng, dự phòng vận hành, ràng buộc lưới và số liệu theo miền.');
  out.cannot.push('Chưa thể suy ra nguyên nhân tăng (công nghiệp, thời tiết) khi trang chưa có dữ liệu hỗ trợ.');
  out.watch.push('Tăng trưởng 3 tháng tới so cùng kỳ', 'Pmax mùa nóng 2027 (T4–T7) so đỉnh năm 2026', 'Hệ số phụ tải tháng');
  out.status = 'Verified';
  return out;
}

/* ---------- Ma trận ngành → doanh nghiệp: tác động vận hành tách khỏi điều kiện lợi nhuận ---------- */
function matrix(f) {
  const Hy = f.hydro || {}, X = f.dispatch || {}, Pr = f.price || {}, P = f.fuelParams || {};
  const op = (v, up, dn, th = 3) => !fin(v) ? ['Chưa đủ dữ liệu', 'Insufficient'] : v > th ? [up, 'up'] : v < -th ? [dn, 'dn'] : ['Đi ngang', 'flat'];
  const undet = 'tác động lợi nhuận chưa xác định';
  const row = (seg, signal, o, earn, listed, section) => ({seg, signal, operating: o[0], dir: o[1], earnings: o[1] === 'Insufficient' ? 'Chưa đủ dữ liệu' : earn, listed, section});
  return [
    row('Thủy điện', `Sản lượng ${pc(Hy.yoy)} (${f.mLabel}); nước về ${pc(Hy.waterYoY, 0)} so cùng kỳ (${Hy.waterSpan || '—'})`, op(Hy.yoy, 'Thuận về sản lượng', 'Bất lợi về sản lượng'),
      `Theo sản lượng từng nhà máy × giá (Qc theo hợp đồng, phần còn lại theo thị trường); ${undet} ở cấp cổ phiếu khi chưa có sản lượng từng nhà máy.`, 'Xem bảng tài sản theo doanh nghiệp (02 › 2.3)', 'hydro'),
    row('Nhiệt điện than', `Sản lượng than ${pc(X.coalYoY)}; Newcastle ${pc(Pr.coal3)} (3 tháng); FMP ${f.fmpLabel} ${nf(Pr.fmp, 0)} đ/kWh`, op(X.coalYoY, 'Thuận về huy động', 'Huy động giảm'),
      `Phụ thuộc Qc, giá than (nội TKV hay nhập), cơ chế chuyển ngang, chi phí cố định trên sản lượng; ${undet}.`, 'QTP, HND, PPC, BTP; POW (Vũng Áng 1)', 'dispatch'),
    row('Điện khí nội địa', `Sản lượng khí & dầu ${pc(X.gasYoY)} (bản tin EVN không tách LNG); mốc giá khí 2026 ${nf(P.GAS_USD, 2)} USD/MMBtu`, op(X.gasYoY, 'Thuận về huy động', 'Huy động giảm'),
      `Giá khí theo hợp đồng bao tiêu, chuyển ngang vào giá điện; phụ thuộc Qc và nguồn cung khí mỏ; ${undet}.`, 'POW (Cà Mau, Nhơn Trạch 1–2), NT2', 'economics'),
    row('LNG', `JKM ${pc(Pr.jkm3)} (3 tháng); sản lượng chung nhóm khí ${pc(X.gasYoY)}`, op(X.gasYoY, 'Thuận về huy động (chung nhóm khí)', 'Huy động giảm (chung nhóm khí)'),
      `Giá LNG nhập cao hơn khí nội; lợi nhuận phụ thuộc Qc dài hạn và mức FMP so chi phí biến đổi; ${undet}.`, 'POW (Nhơn Trạch 3 & 4)', 'economics'),
    row('Gió & mặt trời', `Sản lượng ${pc(X.reYoY)}; chưa có dữ liệu cắt giảm công suất`, op(X.reYoY, 'Thuận về sản lượng', 'Sản lượng giảm'),
      `Giá theo FIT hoặc hợp đồng chuyển tiếp; phụ thuộc sản lượng thực phát và chi phí vốn; ${undet}.`, 'GEG, HDG, TTA, REE', 'dispatch'),
    row('EPC, tư vấn, thiết bị điện', 'Chưa có chỉ báo định lượng COD, giải ngân lưới', ['Chưa đủ dữ liệu', 'Insufficient'], '', 'PC1, TV2, GEX, GEE', 'supply')
  ];
}

/* ---------- Kinh tế đơn vị: chi phí nhiên liệu/kWh và spread minh họa (đồng kỳ hoặc gắn nhãn phi đồng kỳ) ---------- */
// coalUsdT: USD/tấn; hhv: kcal/kg; hr: kcal/kWh; fx: VND/USD → đ/kWh. gasUsd: USD/MMBtu; hrBtu: BTU/kWh.
const coalCost = (coalUsdT, fx, hr, hhv) => [coalUsdT, fx, hr, hhv].every(fin) && hhv > 0 ? coalUsdT * fx / 1000 * hr / hhv : null;
const coalCostVnd = (coalVndT, hr, hhv) => [coalVndT, hr, hhv].every(fin) && hhv > 0 ? coalVndT / 1000 * hr / hhv : null;
const gasCost = (gasUsd, fee, hrBtu, fx) => [gasUsd, fee, hrBtu, fx].every(fin) ? (gasUsd + fee) * hrBtu / 1e6 * fx : null;
function scenario(i) {
  // i: {tech:'coal'|'gas', fuel, fee, fx, hr, hhv, fmp, market} → chi phí nhiên liệu, spread, phần biên trên điện năng ngoài hợp đồng.
  const cost = i.tech === 'coal' ? coalCost(i.fuel, i.fx, i.hr, i.hhv) : gasCost(i.fuel, i.fee || 0, i.hr, i.fx);
  const spread = fin(cost) && fin(i.fmp) ? i.fmp - cost : null;
  const mkt = fin(i.market) ? Math.max(0, Math.min(100, i.market)) / 100 : null;
  return {cost, spread, marketSpread: fin(spread) && mkt != null ? spread * mkt : null, status: 'Scenario'};
}

const api = {fin, nf, sg, pc, pp, timely, MAX_AGE, STATUS, MAG, PERSIST, REL, candidates, top, describe, state, demand, matrix, coalCost, coalCostVnd, gasCost, scenario};
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PowerInsights = api;
})(typeof window !== 'undefined' ? window : this);
