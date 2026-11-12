/* Điện · Tổng quan ngành theo 5 câu hỏi đầu tư (12/11/2026, master prompt "Redesign Industry Overview Dashboard").
   01 Bức tranh hiện tại (Industry Pulse) · 02 Cơ chế vận hành (Industry Economics) · 03 Triển vọng theo nguồn (Generation Mix)
   · 04 Tác động đầu tư (Investment Transmission) · 05 Theo dõi triển vọng (Forward Monitor).
   Số liệu và quy tắc dùng chung: window.POWER_CORE (xuất từ assets/power-picture.js, cùng phép tính với tab Bức tranh ngành). Nội dung định tính,
   ngưỡng quy tắc, mã và luận điểm: window.POWER_OVERVIEW (data/power-overview.json → scripts/build_power_overview.py). Chính sách,
   lịch pháp lý: window.POWER_POLICY. Không tạo số khi thiếu dữ liệu; chi tiết chuyên sâu dẫn sang tab Bức tranh ngành, Policy, Catalyst.
   Card cũ của tab (chuỗi giá trị doanh nghiệp, mô hình kinh doanh, so sánh tài chính, bảng 18 doanh nghiệp) được DỜI, không xóa.
   Deep-link: Dien/?ov=<pulse|economics|mix|transmission|forward>#mt1. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'power') return;
const P = window.POWER_CORE, O = window.POWER_OVERVIEW;
if (!P || !O) return;
const {rec, fin, sum, mean, nf, sg, pc, pp, esc, el, dm, ml, ms, dim, back, link, block, refit, EVN_URL, SRC, M, PERIODS, CMP, months, monthCmp,
  pmaxYtd, accel, oniLast, oni3, ensoState, H, reservoir5y, resYoY, fmp, fmpLast, fmpPrev, fmpLy, coal3, jkm3, hh3, capItems, pipelineShare,
  shortfallYears, shortfallMw, tariffDates, tariffVals, lastDay, LV, tag, lines, gap, mount, G, thermal, topContrib} = P;
const POL = window.POWER_POLICY || {};
const T = Object.fromEntries(Object.entries(O.thresholds).map(([k, v]) => [k, v.value]));
const GROUP = Object.fromEntries(O.groups.map(g => [g.id, g]));
const SOURCES = ['hydro', 'coal', 'gas', 're'];
const plain = s => String(s ?? '').replace(/\[\[([^\]]+)\]\]/g, '$1');
const stockUrl = t => O.stock_dashboards.paths[t] ? O.stock_dashboards.base + O.stock_dashboards.paths[t] : null;
const chip = (t, title) => { const u = stockUrl(t); return u ? `<a class="ov-tk" href="${u}" target="_blank" rel="noopener" title="${esc(title || 'Mở trang phân tích cổ phiếu ' + t)}">${t}<span aria-hidden="true">↗</span></a>` : `<span class="ov-tk" title="${esc(title || 'Chưa có trang phân tích cổ phiếu')}">${t}</span>`; };
const expo = g => O.companies.flatMap(c => c.exposure.filter(e => e.group === g).map(e => ({t: c.ticker, ...e})));
const NOAA_URL = 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml';
const PGV_NOTE = 'FMP: danh mục PGV, tự tính bình quân tháng';
const ymd = d => d.toISOString().slice(0, 10);
const TODAY = ymd(new Date());

/* ===================== 1. Số liệu riêng của Tổng quan ===================== */
const ytd = CMP.ytd?.ok ? CMP.ytd : null, q3 = CMP.q?.ok ? CMP.q : null, y12 = CMP.y?.ok ? CMP.y : null;
// Tăng trưởng cùng kỳ theo tháng (chỉ tháng có ≥80% ngày đối chiếu).
const yoyMonths = months.filter(m => m.m <= M && monthCmp.get(m.m)?.ok).map(m => ({m: m.m, yoy: monthCmp.get(m.m).yoy, c: monthCmp.get(m.m)}));
// Bình quân ngày theo tháng của một nguồn (hoặc tổng) cho năm hiện tại, năm trước và trung bình các năm trước nữa.
function seasonal(k) {
  const Y = M ? +M.slice(0, 4) : null; if (!Y) return null;
  const val = (y, mm) => { const r = months.find(x => x.m === `${y}-${mm}`); if (!r || r.m > M) return null; return k === 'out' ? (r.days / r.n >= 0.8 ? r.avg : null) : (r.mixDays / r.n >= 0.8 ? r.avgSrc[k] : null); };
  const mmList = Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
  const base = [], used = new Set();
  const avg = mmList.map(mm => { const v = []; for (let y = Y - 4; y < Y - 1; y++) { const x = val(y, mm); if (fin(x)) { v.push(x); used.add(y); } } return v.length ? mean(v) : null; });
  return {Y, cats: mmList.map(mm => 'T' + +mm), cur: mmList.map(mm => val(Y, mm)), prev: mmList.map(mm => val(Y - 1, mm)), avg, avgYears: [...used].sort()};
}
const wb = rec('wb_energy_monthly');
const wbYoY = (field, period) => { const a = wb.find(r => r.date.slice(0, 7) === period), b = wb.find(r => r.date.slice(0, 7) === back(period + '-01').slice(0, 7)); return a && b && fin(a[field]) && fin(b[field]) ? (a[field] / b[field] - 1) * 100 : null; };
const fmpYoY = fmpLast && fmpLy ? (fmpLast.fmp / fmpLy.fmp - 1) * 100 : null;
const fmpMoM = fmpLast && fmpPrev ? (fmpLast.fmp / fmpPrev.fmp - 1) * 100 : null;
const tLast = tariffVals?.at(-1), tPrev = tariffVals?.at(-2), tChg = tLast && tPrev ? (tLast / tPrev - 1) * 100 : null;
const mkt = POL.market?.components || [], comp = id => mkt.find(c => c.item.includes(`[[${id}]]`));
const capTotal = capItems ? sum(capItems.map(x => x[1])) : null;
const capRe = capItems?.find(x => /tái tạo/i.test(x[0]))?.[1];
const thQ = thermal('q'), thY = thermal('ytd');

/* ===================== 2. Bộ quy tắc nhận định (Insight Engine) ===================== */
// Mỗi nhận định: quan sát → so sánh → diễn giải → hàm ý → kiểm chứng → nguồn & độ tin cậy. Thiếu dữ liệu thì không kích hoạt.
const INS = [];
const add = o => INS.push({seg: [], conf: 'Trung bình', ...o});
if (ytd) {
  const st = ytd.yoy >= T.demand_strong_pct ? 'support' : ytd.yoy < 0 ? 'risk' : 'note';
  const ac = accel ? accel.now - accel.before : null;
  const acTxt = ac == null ? '' : Math.abs(ac) < T.demand_accel_pp ? 'giữ nhịp' : ac > 0 ? 'tăng tốc' : 'giảm tốc';
  const structural = q3 && y12 && q3.yoy > T.structural_pct && y12.yoy > T.structural_pct;
  add({id: 'demand', kind: st, seg: ['coal', 'gas', 'grid'], lv: 'A', title: 'Phụ tải',
    obs: `Sản lượng hệ thống ${esc(PERIODS.ytd.name)} <b>${pc(ytd.yoy)}</b> so cùng kỳ (${ytd.n}/${ytd.total} ngày đối chiếu).`,
    cmp: accel ? `3 tháng gần nhất ${pc(accel.now)} so với ${pc(accel.before)} của 3 tháng liền trước → <b>${acTxt}</b>${y12 ? `; 12 tháng trượt ${pc(y12.yoy)}` : ''}.` : '',
    interp: structural ? 'Tăng trưởng 3 tháng và 12 tháng cùng dương rõ: xu hướng kéo dài, không chỉ do mùa vụ (so cùng kỳ đã loại phần mùa vụ).' : 'Tăng trưởng 3 tháng và 12 tháng chưa cùng vượt ngưỡng: chưa đủ để gọi là xu hướng cấu trúc.',
    impl: 'Nguồn biên (than, khí) có thêm sản lượng ngoài Qc nếu thủy điện và NLTT không đáp ứng phần tăng thêm; nhu cầu đầu tư nguồn, lưới tăng theo trung hạn.',
    valid: 'Tăng trưởng 3 tháng tới; công suất đỉnh mùa nóng 2027; nguồn nào đóng góp phần tăng thêm.', src: link(EVN_URL, 'EVN · bản tin ngày'), asOf: lastDay, conf: 'Cao'});
}
if (pmaxYtd?.yoy != null && ytd && pmaxYtd.yoy - ytd.yoy > T.peak_gap_pp) add({id: 'peak', kind: 'risk', seg: ['gas', 'hydro', 'grid'], lv: 'B', title: 'Công suất đỉnh',
  obs: `Pmax từ đầu năm ${nf(pmaxYtd.cur.pmax, 0)} MW (${dm(pmaxYtd.cur.date)}), <b>${pc(pmaxYtd.yoy)}</b> so đỉnh cùng khoảng năm trước; điện năng ${pc(ytd.yoy)}.`,
  cmp: `Pmax tăng nhanh hơn điện năng ${pp(pmaxYtd.yoy - ytd.yoy)}.`, interp: 'Áp lực dồn vào công suất giờ cao điểm hơn là tổng điện năng.',
  impl: 'Nguồn điều tiết được giờ cao điểm (thủy điện hồ lớn, khí) và lưới truyền tải chịu áp lực; dự phòng mùa nóng 2027 mỏng hơn.', valid: 'Công suất đỉnh T4–T7/2027; công suất khả dụng (trang chưa có).', src: link(EVN_URL, 'EVN'), asOf: lastDay, conf: 'Trung bình'});
if (resYoY && reservoir5y) {
  const dry = resYoY.med < T.hydro_dry_inflow_pct && reservoir5y.med < 0, wet = resYoY.med > 0 && reservoir5y.med > 0;
  add({id: 'hydro', kind: dry ? 'risk' : wet ? 'support' : 'note', seg: ['hydro'], lv: 'A', title: 'Thủy văn',
    obs: `Nước về hồ ${esc(resYoY.span)} trung vị <b>${pc(resYoY.med, 0)}</b> so cùng kỳ (${resYoY.low}/${resYoY.n} hồ thấp hơn).`,
    cmp: `${ml(reservoir5y.month)}: ${pc(reservoir5y.med, 0)} so trung bình 5 năm, ${reservoir5y.below}/${reservoir5y.n} hồ dưới trung bình.`,
    interp: dry ? 'Nước về thấp hơn cả năm trước lẫn trung bình 5 năm: khả năng phát thủy điện các tháng tới nghiêng về thấp hơn.' : wet ? 'Nước về cao hơn năm trước và trung bình 5 năm: thuận cho sản lượng thủy điện.' : 'Chưa đồng thời lệch một chiều so năm trước và trung bình 5 năm: chưa kết luận thủy văn bất lợi hay thuận lợi.',
    impl: dry ? 'Thủy điện chịu rủi ro sản lượng mùa khô; lợi nhuận thủy điện nhạy với sản lượng vì chi phí gần như cố định.' : 'Theo dõi mực nước cuối mùa tích nước trước khi suy ra sản lượng mùa khô.',
    valid: 'Nước về T12–T2; mực nước hồ lớn so mực nước dâng bình thường.', src: 'EVN · hồ chứa', asOf: H?.last_observation, conf: 'Cao'});
  if (dry) add({id: 'thermal-sub', kind: 'support', seg: ['coal', 'gas'], lv: 'C', title: 'Huy động bù',
    obs: thQ ? `Than + khí 3 tháng gần nhất ${pc(thQ.yoy)} so cùng kỳ.` : 'Chưa đủ ngày đối chiếu than + khí.', cmp: '',
    interp: 'Khi thủy điện thiếu nước, hệ thống thường huy động thêm than rồi khí (quan sát lịch sử, chưa phải quan hệ nhân quả đã kiểm chứng).',
    impl: 'Nhiệt điện có thể tăng sản lượng nếu đáp ứng điều độ, nhiên liệu và tính kinh tế; lợi nhuận còn phụ thuộc Qc, FMP và chi phí nhiên liệu.', valid: 'Sản lượng than, khí các tháng mùa khô; FMP; giá than nhập.', src: link(EVN_URL, 'EVN'), asOf: lastDay});
}
if (oniLast && Math.abs(oniLast.oni) >= 0.5) add({id: 'enso', kind: oniLast.oni >= 0.5 ? 'risk' : 'support', seg: ['hydro'], lv: 'B', title: 'ENSO',
  obs: `ONI ${oniLast.season} ${oniLast.year} <b>${sg(oniLast.oni, 2)} °C</b> (${ensoState(oniLast.oni)})${oni3 ? `, 3 mùa trước ${sg(oni3.oni, 2)}` : ''}.`, cmp: '',
  interp: oniLast.oni >= 0.5 ? 'El Niño thường đi kèm mùa khô ít mưa hơn ở Việt Nam (quan hệ lịch sử); không dùng ONI để dự báo định lượng lưu lượng hồ.' : 'La Niña thường đi kèm mưa nhiều hơn (quan hệ lịch sử).',
  impl: 'Không suy thẳng ONI → lợi nhuận nhiệt điện: cần thêm nước về, huy động thực tế và giá.', valid: 'ONI các mùa tới; nước về hồ.', src: link(NOAA_URL, 'NOAA CPC'), asOf: oniLast.date, conf: 'Cao'});
if (q3) {
  const h = q3.get('hydro'), co = q3.get('coal'), ga = q3.get('gas');
  if (h.dpp <= -T.mix_shift_pp && co.dpp + ga.dpp >= T.mix_shift_pp) add({id: 'mix', kind: 'note', seg: ['hydro', 'coal', 'gas'], lv: 'A', title: 'Cơ cấu huy động',
    obs: `3 tháng gần nhất: tỷ trọng thủy điện ${pp(h.dpp)}, than ${pp(co.dpp)}, khí & dầu ${pp(ga.dpp)} so cùng kỳ.`, cmp: '',
    interp: 'Cơ cấu huy động dịch chuyển từ thủy điện sang nhiệt điện.', impl: 'Cần đối chiếu FMP và chi phí nhiên liệu trước khi đánh giá lợi nhuận nhiệt điện.', valid: 'Tỷ trọng thủy điện khi mùa khô bắt đầu.', src: link(EVN_URL, 'EVN'), asOf: lastDay, conf: 'Cao'});
  else if (h.dpp >= T.mix_shift_pp && co.dpp + ga.dpp <= -T.mix_shift_pp) add({id: 'mix', kind: 'note', seg: ['hydro', 'coal', 'gas'], lv: 'A', title: 'Cơ cấu huy động',
    obs: `3 tháng gần nhất: tỷ trọng thủy điện ${pp(h.dpp)}, than ${pp(co.dpp)}, khí & dầu ${pp(ga.dpp)} so cùng kỳ.`, cmp: '',
    interp: 'Huy động nghiêng về thủy điện (nguồn rẻ) khi nước về thuận.', impl: 'Nhiệt điện bị huy động ít hơn ngoài Qc.', valid: 'Tỷ trọng thủy điện mùa khô.', src: link(EVN_URL, 'EVN'), asOf: lastDay, conf: 'Cao'});
  // Phân kỳ: nhóm nguồn tăng khác hẳn tăng trưởng hệ thống.
  SOURCES.forEach(k => { const x = q3.get(k); if (x?.yoy == null) return; const d = x.yoy - q3.yoy; if (Math.abs(d) < T.divergence_pp) return;
    add({id: 'div-' + k, kind: 'note', seg: [k], lv: 'A', title: 'Phân kỳ với phụ tải', obs: `${esc(GROUP[k].label)} 3 tháng ${pc(x.yoy)} so với hệ thống ${pc(q3.yoy)} (${pp(d)}).`, cmp: '',
      interp: d > 0 ? 'Nhóm nguồn này đáp ứng phần lớn hơn mức tăng của phụ tải.' : 'Nhóm nguồn này giảm vai trò dù phụ tải tăng.', impl: '', valid: 'Đóng góp tăng trưởng theo nguồn (tab Bức tranh ngành › Huy động).', src: link(EVN_URL, 'EVN'), asOf: lastDay, conf: 'Cao'}); });
}
if (fmpYoY != null && Math.abs(fmpYoY) >= T.fmp_move_pct) add({id: 'fmp', kind: fmpYoY > 0 ? 'support' : 'risk', seg: ['hydro', 'coal', 'gas'], lv: 'A', title: 'Giá thị trường',
  obs: `FMP ${ml(fmpLast.period)} <b>${nf(fmpLast.fmp, 0)} đ/kWh</b>, ${pc(fmpYoY)} so cùng kỳ${fmpMoM != null ? `, ${pc(fmpMoM)} so tháng trước` : ''}.`, cmp: '',
  interp: fmpYoY > 0 ? 'Giá thị trường cao hơn cùng kỳ: có lợi cho phần sản lượng bán ngoài Qc.' : 'Giá thị trường thấp hơn cùng kỳ: bất lợi cho phần bán ngoài Qc.',
  impl: 'Chỉ nhà máy tham gia trực tiếp thị trường, có điện năng ngoài Qc đáng kể và FMP vượt chi phí biến đổi mới hưởng/chịu tác động.', valid: 'FMP các tháng mùa khô; Qc 2027.', src: PGV_NOTE, asOf: fmpLast.period, conf: 'Trung bình'});
[['coal', coal3, 'Than Newcastle', 'USD/tấn', 1], ['gas', jkm3, 'LNG JKM', 'USD/MMBtu', 2]].forEach(([k, x, name, unit, d]) => {
  if (!x || Math.abs(x.pct) < T.fuel_move_pct) return;
  add({id: 'fuel-' + k, kind: x.pct > 0 ? 'risk' : 'support', seg: [k], lv: 'C', title: 'Giá nhiên liệu',
    obs: `${name} ${nf(x.now, d)} ${unit} (${dm(x.date)}), <b>${pc(x.pct)}</b> trong ≈3 tháng.`, cmp: '',
    interp: x.pct > 0 ? 'Chi phí biến đổi tham chiếu tăng mạnh.' : 'Chi phí biến đổi tham chiếu giảm mạnh.',
    impl: `Tác động lên biên ${esc(GROUP[k].label.toLowerCase())} tùy mức chuyển ngang chi phí nhiên liệu trong PPA và phần bán ngoài Qc; không mặc định biên giảm tương ứng.`,
    valid: 'Biên gộp quý của nhà máy; FMP; giá nhiên liệu theo hợp đồng.', src: 'ICE (hợp đồng tương lai)', asOf: x.date, conf: 'Trung bình'});
});
// Giá điện và chi phí đầu vào phân kỳ (cùng tháng FMP, so cùng kỳ): FMP và than Úc/LNG Nhật (World Bank) đổi ngược chiều, mỗi bên ≥ ngưỡng FMP.
if (fmpYoY != null) {
  const cy = wbYoY('coal_au', fmpLast.period), ly = wbYoY('lng_japan', fmpLast.period);
  const opp = v => v != null && Math.abs(v) >= T.fmp_move_pct && Math.abs(fmpYoY) >= T.fmp_move_pct && Math.sign(v) !== Math.sign(fmpYoY);
  if (opp(cy) || opp(ly)) add({id: 'spread', kind: fmpYoY > 0 ? 'support' : 'risk', seg: ['coal', 'gas'], lv: 'B', title: 'Giá điện so với chi phí',
    obs: `${ml(fmpLast.period)}: FMP ${pc(fmpYoY)}, than Úc ${pc(cy)}, LNG Nhật ${pc(ly)} so cùng kỳ (World Bank).`, cmp: '',
    interp: fmpYoY > 0 ? 'Giá điện thị trường tăng trong khi chi phí nhiên liệu tham chiếu giảm: chênh lệch giá − chi phí mở rộng.' : 'Giá điện thị trường giảm trong khi chi phí nhiên liệu tham chiếu tăng: chênh lệch thu hẹp.',
    impl: 'Có ý nghĩa với phần bán ngoài Qc của nhà máy nhiệt điện; xem chênh lệch giá điện – chi phí nhiên liệu ước tính ở tab Bức tranh ngành › Giá & biên.', valid: 'Chênh lệch FMP − chi phí nhiên liệu biến đổi.', src: 'PGV · World Bank', asOf: fmpLast.period});
}
if (tChg != null && tChg < 0) add({id: 'retail', kind: 'risk', seg: ['hydro', 'coal', 'gas', 're'], lv: 'C', title: 'Giá bán lẻ & EVN',
  obs: `Giá bán lẻ bình quân ${nf(tLast, 2)} đ/kWh từ ${esc(tariffDates.at(-1))}, <b>${pc(tChg)}</b> so mức trước.`, cmp: '',
  interp: 'Doanh thu của EVN giảm theo giá bán lẻ trong khi chi phí mua điện phụ thuộc nhiên liệu và cơ cấu huy động.',
  impl: 'Rủi ro với nhà máy là kỳ thu tiền từ EPTC kéo dài, không phải doanh thu mất đi; trang chưa có dữ liệu phải thu để kiểm chứng.', valid: 'Kết quả tài chính EVN 2026; phải thu tiền điện trong BCTC doanh nghiệp.', src: 'QĐ của EVN/Bộ Công Thương', asOf: null, conf: 'Thấp'});
const insOf = (...ids) => INS.filter(i => ids.includes(i.id) || ids.some(x => x.endsWith('*') && i.id.startsWith(x.slice(0, -1))));

/* ===================== 3. Khung giao diện ===================== */
const KIND = {support: ['Hỗ trợ', 'ov-k-up'], risk: ['Rủi ro', 'ov-k-dn'], note: ['Theo dõi', 'ov-k-nt']};
const insLine = i => `<li><span class="ov-k ${KIND[i.kind][1]}">${KIND[i.kind][0]}</span> ${tag(i.lv)} <b>${esc(i.title)}:</b> ${i.obs}${i.cmp ? ' ' + i.cmp : ''}</li>`;
function insBlock(i) {
  return `<details class="ov-ins"><summary>${insLine(i).slice(4, -5)}</summary><dl>
    ${[['Quan sát', i.obs], ['So sánh', i.cmp], ['Diễn giải', i.interp], ['Hàm ý đầu tư', i.impl], ['Kiểm chứng', i.valid],
      ['Nguồn & độ tin cậy', `${i.src || ''}${i.asOf ? ' · dữ liệu ' + esc(/^\d{4}-\d\d-\d\d$/.test(i.asOf) ? dm(i.asOf) : /^\d{4}-\d\d$/.test(i.asOf) ? ml(i.asOf) : i.asOf) : ''} · độ tin cậy ${esc(i.conf)}`]].filter(x => x[1]).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></details>`;
}
// Khối ngắn đầu mỗi section: Đổi gì? · Vì sao quan trọng? · Theo dõi gì? (mỗi mục 1–3 câu).
// Bản visual-first: bỏ khối chữ "Đổi gì / Vì sao / Theo dõi" hiển thị mặc định (kết luận đã nằm ở takeaway của từng chart).
const wwh = () => document.createDocumentFragment();
function sec(id, num, q, body, opts = {}) {
  const s = el('section', 'ov-sec'); s.id = 'ov-' + id;
  s.innerHTML = `<header class="ov-sh"><span class="ov-num">${esc(num)}</span><div><h3>${esc(q)}</h3>${opts.sub ? `<p>${opts.sub}</p>` : ''}</div></header>`;
  [].concat(body).filter(Boolean).forEach(n => s.append(typeof n === 'string' ? el('div', '', n) : n));
  if (opts.method) s.append(el('details', 'ov-an ov-method', `<summary>Dữ liệu & phương pháp</summary><div>${opts.method}</div>`));
  return s;
}
const card = (id, cls, html) => { const c = el('div', 'card ' + cls, html); if (id) Object.assign(c.dataset, {blockId: id, updateKind: 'public', cadence: 'daily', refreshStatus: 'snapshot'}); return c; };
const goDetail = (key, text = 'Xem phân tích chi tiết') => key ? `<a class="ov-more" href="?section=${key}#mt2" data-pp-go="${key}">${esc(text)} →</a>` : '';
const goPolicy = (g, text = 'Xem ở tab Policy') => g ? `<a class="ov-more" href="?policy=${g}#mt4" data-ov-policy="${g}">${esc(text)} →</a>` : '';
// Sparkline SVG: đường chính, đường tham chiếu (đứt), vạch 0; không trục, số chi tiết ở dòng chú thích.
function spark(series, o = {}) {
  const W = 260, Hh = 54, all = series.flatMap(s => s.v).filter(fin); if (all.length < 2) return '<span class="muted">Chưa đủ điểm dữ liệu.</span>';
  let lo = Math.min(...all, o.zero ? 0 : Infinity), hi = Math.max(...all, o.zero ? 0 : -Infinity); if (hi === lo) hi = lo + 1;
  const n = Math.max(...series.map(s => s.v.length)), x = i => 4 + i * (W - 8) / Math.max(1, n - 1), y = v => 4 + (hi - v) * (Hh - 8) / (hi - lo);
  const path = v => v.map((p, i) => fin(p) ? `${x(i).toFixed(1)},${y(p).toFixed(1)}` : null).reduce((a, p) => { if (!p) { a.push([]); } else a.at(-1).push(p); return a; }, [[]]).filter(a => a.length).map(a => `<polyline points="${a.join(' ')}"/>`).join('');
  const last = series[0].v.map((v, i) => [v, i]).filter(p => fin(p[0])).at(-1);
  return `<svg class="ov-spark" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" role="img" aria-label="${esc(o.aria || '')}">${o.zero && lo < 0 && hi > 0 ? `<line class="ov-sp-zero" x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}"/>` : ''}` +
    series.map((s, k) => `<g class="ov-sp-${k ? 'ref' : 'main'}" style="--c:${s.c || '#2938A8'}">${path(s.v)}</g>`).join('') + (last ? `<circle cx="${x(last[1])}" cy="${y(last[0])}" r="3" style="fill:${series[0].c || '#2938A8'}"/>` : '') + '</svg>';
}
const kv = (label, value, unit, sub, cls = '') => `<div class="ov-kv"><span>${esc(label)}</span><b class="${cls}">${value}${unit ? `<small> ${esc(unit)}</small>` : ''}</b><em>${sub || ''}</em></div>`;
const cls = (v, th = 0) => v == null ? '' : v > th ? 'up' : v < -th ? 'dn' : '';
const renders = {};

/* ===================== 4. Bối cảnh chung cho lớp hình ảnh ===================== */
const VIS = window.PowerOverviewVisual;
const chips = g => expo(g).map(e => chip(e.t, `${e.t} · ${e.role}: ${e.note}`)).join(' ');
const ctx = {P, O, POL, chip, expo, chips, insLine, insFor: g => INS.filter(i => i.seg.includes(g)), onState: null};
// Trạng thái ngành một câu (dùng ở thanh trên cùng và Industry Pulse).
function stateParts() {
  const dI = INS.find(i => i.id === 'demand'), hI = INS.find(i => i.id === 'hydro'), mI = INS.find(i => i.id === 'mix'), fI = INS.find(i => i.id === 'fmp');
  return [dI && `cầu điện ${ytd.yoy >= T.demand_strong_pct ? 'tăng mạnh' : ytd.yoy >= 0 ? 'tăng' : 'giảm'} ${pc(ytd.yoy)} từ đầu năm`,
    hI && (hI.kind === 'risk' ? `thủy văn bất lợi (nước về ${pc(resYoY.med, 0)})` : hI.kind === 'support' ? 'thủy văn thuận lợi' : 'thủy văn chưa lệch rõ'),
    mI ? (mI.interp.includes('sang nhiệt điện') ? 'huy động dịch chuyển sang nhiệt điện' : 'huy động nghiêng về thủy điện') : null,
    fI && `FMP ${pc(fmpYoY)} so cùng kỳ`].filter(Boolean);
}

/* ===================== 5. 00 · Bản đồ ngành ===================== */
function mapPane(p) {
  const host = card('dien-ov-map', 'ov-imap', '');
  if (VIS) VIS.map(host, ctx); else host.append(gap('không tải được module hình ảnh.'));
  const vc = document.querySelector('#pane-mt1 .value-chain-card');
  const vcFold = vc ? el('details', 'research-fold ov-vcfold', '<summary>Sơ đồ doanh nghiệp niêm yết theo từng khâu (bấm khâu để lọc mã)</summary>') : null;
  if (vcFold) { vcFold.append(vc); vcFold.addEventListener('toggle', () => vcFold.open && window.dispatchEvent(new Event('resize'))); }
  // Công suất đặt khác sản lượng thực phát
  const MIX = [['coal', 'Than', '#3d4653'], ['hydro', 'Thủy điện', '#2938A8'], ['re', 'Gió & mặt trời', '#2a9fa3'], ['gas', 'Khí, dầu & khác', '#c98a00'], ['imports', 'Nhập khẩu', '#9AA3BD']];
  const gm = card('dien-ov-genmix', 'ov-genmix', `<div class="ov-ctl" role="group" aria-label="Kỳ so sánh">${Object.entries(PERIODS).map(([k, x]) => `<button type="button" data-p="${k}" aria-pressed="${k === 'ytd'}">${esc(x.label)}</button>`).join('')}</div><div class="ov-bars"></div><div class="ov-legend">${MIX.map(m => `<span><i style="background:${m[2]}"></i>${m[1]}</span>`).join('')}</div><p class="ov-note"></p>`);
  const bars = gm.querySelector('.ov-bars');
  const bar = (label, parts, sub) => { const t = sum(parts.map(x => x[1] || 0)); return `<div class="ov-gbar"><div class="ov-bar-l"><b>${esc(label)}</b><small>${sub}</small></div><div class="ov-bar-t" role="img" aria-label="${esc(label)}: ${parts.map(x => `${x[0]} ${nf(x[1] / t * 100, 1)}%`).join(', ')}">${parts.filter(x => x[1] > 0).map(x => `<i style="width:${x[1] / t * 100}%;background:${MIX.find(m => m[1] === x[0])[2]}" title="${esc(x[0])} ${nf(x[1] / t * 100, 1)}%">${x[1] / t > 0.07 ? nf(x[1] / t * 100, 0) + '%' : ''}</i>`).join('')}</div></div>`; };
  const draw = k => { const r = CMP[k]; gm.querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === k)));
    if (!r?.n) { bars.replaceChildren(gap('chưa đủ ngày đối chiếu.')); return; }
    const gen = key => MIX.map(([mk, name]) => [name, mk === 'gas' ? r.get('gas')[key] + r.get('other')[key] : r.get(mk)[key]]);
    bars.innerHTML = (capItems ? bar('Công suất đặt cuối 2025', [['Than', capItems[0][1]], ['Thủy điện', capItems[1][1]], ['Gió & mặt trời', capItems[2][1]], ['Khí, dầu & khác', capItems[3][1]], ['Nhập khẩu', 0]], `${nf(capTotal, 0)} MW`) : '') +
      bar('Sản lượng ' + PERIODS[k].name, gen('cur'), `${nf(r.curT, 0)} triệu kWh`) + bar('Cùng kỳ năm trước', gen('prev'), `${nf(r.prevT, 0)} triệu kWh`);
    const re = r.get('re'), capShare = capItems && capRe ? capRe / capTotal * 100 : null;
    gm.querySelector('.ov-note').innerHTML = capShare != null ? `NLTT chiếm <b>${nf(capShare, 0)}%</b> công suất đặt nhưng gió & mặt trời chỉ <b>${nf(re.shareCur, 1)}%</b> sản lượng: MW không phải kWh.` : ''; };
  gm.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => draw(b.dataset.p)));
  renders.map.push(() => draw('ytd'));
  p.append(sec('map', '0.1', 'Điện đi từ đâu, tiền đi qua ai, ai quyết định huy động?', [host, vcFold], {sub: 'Ba lớp luồng tách riêng, bật/tắt từng lớp. Bấm một loại hình để mở chuỗi giá trị chi tiết.',
      method: 'Tỷ trọng sản lượng từ đầu năm theo bản tin vận hành ngày EVN (cùng ngày đối chiếu với tab Bức tranh ngành; gió và mặt trời tách từ số EVN, mái nhà là số EVN ước tính). Khí, dầu và LNG gộp trong bản tin EVN. Vai trò các đơn vị theo Luật Điện lực 61/2024, TT 29/2026/TT-BCT và bảng 18 doanh nghiệp.'}),
    sec('mix', '0.2', 'Công suất đặt khác sản lượng thực phát thế nào?', gm, {method: 'Công suất đặt cuối 2025 theo biểu đồ "Công suất nguồn cuối 2025" (Bức tranh ngành › Cung dài hạn); "Khí, dầu & khác" là phần còn lại của tổng 87.600 MW; nhóm NLTT của công suất đặt có thể gồm sinh khối, điện rác. Sản lượng: các ngày có bản tin đủ nguồn ở cả hai năm.'}));
}

/* ===================== 6. 01 · Chuỗi giá trị theo công nghệ ===================== */
let techApi = null;
function techPane(p) {
  const host = card('dien-ov-tech', 'ov-tech', '');
  p.append(sec('tech', '1.1', 'Mỗi loại nhà máy tạo doanh thu và tốn chi phí ở khâu nào?', host, {sub: 'Chọn công nghệ → bấm từng khâu: chức năng kinh tế, chi phí, chỉ số vận hành, biểu đồ dữ liệu, tác động lên doanh thu/lợi nhuận, doanh nghiệp. ● = khâu có biểu đồ dữ liệu.'}));
  renders.tech.push(() => { if (!VIS) { host.append(gap('không tải được module hình ảnh.')); return; } const u = new URL(location.href); techApi = VIS.tech(host, ctx, u.searchParams.get('t'), u.searchParams.get('s')); });
}

/* ===================== 7. 02 · Kinh tế đơn vị ===================== */
function unitPane(p) {
  const bmg = card('dien-ov-bm', 'ov-bm', O.business_models.map(b => { const g = GROUP[b.group], sh = ytd?.get(g.mix_key);
    return `<article class="ov-bm-c" style="--c:${g.color}"><header><b>${esc(g.label)}</b>${sh ? `<span>${nf(sh.shareCur, 1)}% sản lượng</span>` : ''}</header>
      <p class="ov-formula">${esc(b.formula)}</p><ul class="ov-drv">${b.drivers.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      <details class="ov-an"><summary>Chi phí · dòng tiền · đòn bẩy</summary><dl><dt>Chi phí</dt><dd>${esc(b.cost)}</dd><dt>Dòng tiền</dt><dd>${esc(b.cash)}</dd><dt>Đòn bẩy</dt><dd>${esc(b.lever)}</dd></dl></details>
      <div class="ov-tks">${chips(b.group)}</div></article>`; }).join(''));
  const old = document.querySelector('#pane-mt1 .business-models');
  const bmFold = old ? el('details', 'ov-an research-fold', '<summary>Bản trước: mô hình theo nhóm doanh nghiệp (gộp than & khí, có xây lắp lưới)</summary>') : null;
  if (bmFold) bmFold.append(old);
  const mech = card('dien-ov-mech', 'ov-mech', O.mechanisms.map(m => { const c = m.component && comp(m.component);
    return `<article class="ov-mc"><h4>${esc(m.label)}</h4><p>${esc(m.l1)}</p><details><summary>Ví dụ có điều kiện</summary><p>${esc(m.l2)}</p></details>
      <details class="ov-an"><summary>Công thức, căn cứ & phạm vi</summary>${c ? `<p><b>Quy định:</b> ${esc(plain(c.rule))}</p><p><b>Số hiện có:</b> ${esc(plain(c.value))}</p>` : ''}<p><b>Phạm vi:</b> ${esc(m.scope)}</p>${POL.glossary?.[m.id] ? `<p class="muted">${esc(POL.glossary[m.id])}</p>` : ''}</details>${goPolicy(m.policy_group)}</article>`; }).join(''));
  const pm = O.peer_matrix;
  const peer = card('dien-ov-peer', 'ov-peer', `<div class="tablewrap"><table><thead><tr><th></th>${SOURCES.map(k => `<th style="--c:${GROUP[k].color}">${esc(GROUP[k].label)}</th>`).join('')}</tr></thead><tbody>${pm.dims.map(([d, label]) => `<tr><th scope="row">${esc(label)}</th>${SOURCES.map(k => `<td>${esc(pm.rows[k][d])}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="ov-cap">${esc(pm.note)}</p>`);
  const ue = card('dien-ov-unit', 'ov-unit', '');
  renders.unit.push(() => { if (VIS) VIS.unit(ue, ctx); else ue.append(gap('không tải được module hình ảnh.')); });
  p.append(sec('unit-econ', '2.1', 'Một kWh mang lại bao nhiêu, tốn bao nhiêu, còn lại bao nhiêu?', ue, {sub: 'Chi phí nhiên liệu/kWh theo công nghệ · từ doanh thu tới lãi ròng và cầu nối lợi nhuận từ BCTC quý · thử kịch bản với giả định ghi rõ.'}),
    sec('unit-bm', '2.2', 'Nhà máy điện kiếm tiền như thế nào?', [bmg, bmFold], {sub: 'Công thức nguyên lý; ↗ mở trang phân tích cổ phiếu.'}),
    sec('unit-peer', '2.3', 'Bốn nhóm nguồn khác nhau ở đâu?', peer),
    sec('unit-mech', '2.4', 'PPA, Qc, SMP, CAN, FMP, DPPA nghĩa là gì?', mech, {sub: 'Định nghĩa → ví dụ → căn cứ (mục chi tiết).'}));
}

/* ===================== 8. 03 · Industry Pulse (rút gọn) ===================== */
function pulse(p) {
  const sup = INS.filter(i => i.kind === 'support'), risk = INS.filter(i => i.kind === 'risk');
  const hI = INS.find(i => i.id === 'hydro'), dI = INS.find(i => i.id === 'demand');
  const score = Object.fromEntries(O.groups.map(g => [g.id, {up: 0, dn: 0, why: []}]));
  [...sup, ...risk].forEach(i => i.seg.forEach(g => { if (!score[g]) return; score[g][i.kind === 'support' ? 'up' : 'dn']++; score[g].why.push(i.title); }));
  const sens = Object.entries(score).filter(([, s]) => s.up + s.dn).sort((a, b) => (b[1].up + b[1].dn) - (a[1].up + a[1].dn)).slice(0, 3);
  const flip = [oniLast?.oni >= 0.5 && 'ONI về dưới +0,5 °C (hết El Niño) theo bản tin NOAA', hI?.kind === 'risk' && 'Nước về các hồ T12–T2 trở lại gần trung bình 5 năm',
    INS.find(i => i.id === 'fmp') && `FMP mùa khô 2027 đổi chiều so cùng kỳ (hiện ${pc(fmpYoY)})`, INS.some(i => i.id.startsWith('fuel-')) && 'Giá than/LNG quay đầu quá ±15% trong 3 tháng',
    dI && 'Tăng trưởng sản lượng 3 tháng tới lệch quá ±1 đ.p. so hiện tại', tChg < 0 && 'Lần điều chỉnh giá bán lẻ kế tiếp (sớm nhất 01/02/2027 theo NĐ 72/2025)'].filter(Boolean);
  const st = stateParts();
  const sum = card('dien-ov-summary', 'ov-summary', `<p class="ov-sum-lead">${st.length ? 'Ngành điện: ' + st.join(' · ') + '.' : 'Chưa đủ dữ liệu để tổng hợp trạng thái ngành.'}</p>
    <div class="ov-sum-chips"><span class="ov-k ov-k-up">${sup.length} hỗ trợ</span><span class="ov-k ov-k-dn">${risk.length} rủi ro</span>${sens.map(([g, s]) => `<span class="ov-chip" style="--c:${GROUP[g].color}">${esc(GROUP[g].label)} ${s.up}↑ ${s.dn}↓</span>`).join('')}<span class="muted">EVN đến ${dm(lastDay)}</span></div>
    <details class="ov-fold"><summary>Tín hiệu, nhóm nhạy cảm, điều kiện làm đổi nhận định</summary><div class="ov-sum-grid">
      <div><h4>Hỗ trợ</h4><ul class="ov-list">${sup.slice(0, 3).map(insLine).join('') || '<li class="muted">Không có tín hiệu vượt ngưỡng.</li>'}</ul></div>
      <div><h4>Rủi ro</h4><ul class="ov-list">${risk.slice(0, 3).map(insLine).join('') || '<li class="muted">Không có tín hiệu vượt ngưỡng.</li>'}</ul></div>
      <div><h4>Nhóm nguồn nhạy cảm</h4><ul class="ov-list">${sens.map(([g, s]) => `<li><b>${esc(GROUP[g].label)}</b> · ${s.up} hỗ trợ, ${s.dn} rủi ro <span class="muted">(${esc([...new Set(s.why)].join(', '))})</span></li>`).join('') || '<li class="muted">—</li>'}</ul></div>
      <div><h4>Nhận định đổi khi</h4><ul class="ov-list">${flip.map(t => `<li>${t}</li>`).join('') || '<li class="muted">—</li>'}</ul></div></div>
      <p class="ov-foot">${Object.entries(LV).map(([k, v]) => `${tag(k)} ${esc(v[1])}`).join(' · ')}. Tín hiệu theo nhóm nguồn, không phải khuyến nghị mua/bán.</p></details>`);
  const allIns = el('details', 'ov-an ov-insall', `<summary>Toàn bộ ${INS.length} nhận định (quan sát → so sánh → diễn giải → hàm ý → kiểm chứng → nguồn) và ngưỡng</summary>${INS.map(insBlock).join('')}<p class="ov-foot">${esc(O.threshold_note)}</p><ul class="ov-foot">${Object.values(O.thresholds).map(v => `<li>${esc(v.basis)}</li>`).join('')}</ul>`);
  sum.append(allIns);
  // Ba tín hiệu: kết luận 1 câu + số + chart nhỏ; diễn giải trong mục mở rộng.
  const sig = (id, k, title, headline, kvs, sp, spCap, rows, more, method) => card(id, 'ov-sig', `<div class="ov-sig-h"><span class="ov-eyebrow">Tín hiệu ${k}</span><h4>${esc(title)}</h4></div>
    <p class="ov-headline">${headline}</p><div class="ov-kvs">${kvs.join('')}</div><figure class="ov-sp">${sp}<figcaption>${spCap}</figcaption></figure>
    <details class="ov-fold"><summary>Diễn giải · hàm ý · nguồn</summary><dl class="ov-dl">${rows.filter(r => r[1]).map(([h, t]) => `<dt>${h}</dt><dd>${t}</dd>`).join('')}</dl><div class="ov-cap">${method}</div></details>${more}`);
  const yl = yoyMonths.slice(-18), top = topContrib('ytd');
  const sA = sig('dien-ov-sig-demand', 'A', 'Cung – cầu', ytd ? `Phụ tải ${pc(ytd.yoy)} từ đầu năm${accel ? `, ${Math.abs(accel.now - accel.before) < T.demand_accel_pp ? 'giữ nhịp' : accel.now > accel.before ? 'tăng tốc' : 'giảm tốc'}` : ''}; ${top[0] ? esc(top[0].name.toLowerCase()) + ' đáp ứng phần tăng lớn nhất' : ''}.` : 'Chưa đủ ngày đối chiếu.',
    [kv('Sản lượng hệ thống', pc(ytd?.yoy), '', `${esc(PERIODS.ytd?.name || '—')} so cùng kỳ`, cls(ytd?.yoy)), kv('Công suất đỉnh (Pmax) từ đầu năm', nf(pmaxYtd?.cur.pmax, 0), 'MW', `${dm(pmaxYtd?.cur.date)} · ${pc(pmaxYtd?.yoy)}`)],
    spark([{v: yl.map(x => x.yoy), c: '#2938A8'}], {zero: true, aria: 'Tăng trưởng sản lượng so cùng kỳ theo tháng'}), `% so cùng kỳ theo tháng · ${yl.length ? ms(yl[0].m) + '–' + ms(yl.at(-1).m) : '—'}`,
    [['So sánh', accel ? `3 tháng ${pc(accel.now)} so với 3 tháng trước ${pc(accel.before)}${y12 ? ` · 12 tháng ${pc(y12.yoy)}` : ''}` : ''], ['Nguồn đáp ứng', top.slice(0, 3).map(x => `${esc(x.name)} ${sg(x.delta, 0)} triệu kWh`).join(' · ')],
     ['Mùa vụ hay cấu trúc', dI?.interp], ['Hàm ý', `${tag('C')} ${dI?.impl || ''}`]],
    goDetail('demand'), `EVN bản tin ngày; so cùng kỳ trên ngày có bản tin ở cả hai năm. Pmax: bản tin ngày ghi 24/06/2026, thông cáo EVN 07/07/2026 ghi 25/06/2026.`);
  const shareL = months.filter(m => m.m <= M && m.mixDays / m.n >= 0.8).slice(-18), hyQ = q3?.get('hydro');
  const sB = sig('dien-ov-sig-resource', 'B', 'Tài nguyên phát điện', hI ? `${hI.kind === 'risk' ? 'Thủy văn bất lợi' : hI.kind === 'support' ? 'Thủy văn thuận lợi' : 'Thủy văn chưa lệch rõ'}: thủy điện 3 tháng ${pc(hyQ?.yoy)}, than + khí ${pc(thQ?.yoy)}.` : 'Chưa đủ dữ liệu hồ chứa.',
    [kv('ONI · ' + (oniLast ? oniLast.season + ' ' + oniLast.year : '—'), sg(oniLast?.oni, 2), '°C', ensoState(oniLast?.oni), oniLast?.oni >= 0.5 ? 'dn' : ''), kv('Nước về so cùng kỳ', pc(resYoY?.med, 0), '', esc(resYoY?.span || '—'), cls(resYoY?.med, 10))],
    spark([{v: shareL.map(m => m.share.hydro), c: '#2938A8'}, {v: shareL.map(m => m.share.coal), c: '#3d4653'}], {aria: 'Tỷ trọng thủy điện và than theo tháng'}),
    `Tỷ trọng: <b style="color:#2938A8">thủy điện</b> ${nf(shareL.at(-1)?.share.hydro, 1)}% · <b style="color:#3d4653">than</b> ${nf(shareL.at(-1)?.share.coal, 1)}%`,
    [['Nguyên nhân', [hI?.interp, INS.find(i => i.id === 'enso')?.interp].filter(Boolean).join(' ')], ['Hàm ý', `${tag('C')} ${INS.find(i => i.id === 'thermal-sub')?.impl || 'Không suy thẳng ONI → lợi nhuận nhiệt điện.'}`]],
    goDetail('hydro'), `NOAA CPC; EVN hồ chứa đến ${dm(H?.last_observation)}; tỷ trọng: EVN bản tin ngày.`);
  const fl = fmp.slice(-24), flLy = fl.map(r => fmp.find(x => x.period === back(r.period + '-01').slice(0, 7))?.fmp ?? null);
  const layers = O.price_layers.map(l => { const v = l.id === 'retail' ? `${nf(tLast, 2)} đ/kWh` : l.id === 'market' && fmpLast ? `${nf(fmpLast.fmp, 0)} đ/kWh` : '<span class="muted">không công bố</span>';
    return `<div class="ov-layer"><b>${esc(l.label)}</b><span>${v}</span><small>${esc(l.who)} · ${esc(l.note)}</small></div>`; }).join('');
  const sC = sig('dien-ov-sig-price', 'C', 'Giá điện & chi phí', fmpLast ? `FMP ${ml(fmpLast.period)} ${pc(fmpYoY)} so cùng kỳ; than ${pc(coal3?.pct)}, LNG ${pc(jkm3?.pct)} trong 3 tháng.` : 'Chưa có FMP.',
    [kv('FMP · ' + (fmpLast ? ml(fmpLast.period) : '—'), nf(fmpLast?.fmp, 0), 'đ/kWh', `${pc(fmpYoY)} so cùng kỳ`, cls(fmpYoY)), kv('Giá bán lẻ', nf(tLast, 0), 'đ/kWh', `${pc(tChg)} từ ${esc(tariffDates?.at(-1) || '—')}`, cls(tChg))],
    spark([{v: fl.map(r => r.fmp), c: '#861C52'}, {v: flLy, c: '#9AA3BD'}], {aria: 'FMP theo tháng và cùng kỳ năm trước'}), `FMP đ/kWh: <b style="color:#861C52">năm nay</b> · <b style="color:#9AA3BD">cùng kỳ</b>`,
    [['Bốn loại giá không tương đương', `<div class="ov-layers">${layers}</div>`], ['Diễn giải', [INS.find(i => i.id === 'fmp')?.interp, INS.find(i => i.id === 'spread')?.interp].filter(Boolean).join(' ')], ['Hàm ý', `${tag('C')} FMP chỉ tác động phần ngoài Qc; giá bán lẻ tác động qua tài chính EVN và kỳ thanh toán.`]],
    goDetail('economics', 'Xem giá & biên'), `${PGV_NOTE}; ICE, hợp đồng tương lai (63 phiên ≈ 3 tháng); giá bán lẻ theo quyết định EVN/Bộ Công Thương.`);
  const sigs = el('div', 'ov-sigs'); sigs.append(sA, sB, sC);
  // Lối vào phân tích chi tiết (tab Bức tranh ngành): mỗi ô một chart nhỏ + một dòng.
  const D = VIS ? VIS.data(ctx) : {inflow: []}, inf = D.inflow.filter(x => x.med != null);
  const tv = tariffVals || [], lastShare = shareL.at(-1);
  const tiles = [
    ['demand', '01 Nhu cầu', yl.length ? `${ms(yl.at(-1).m)} ${pc(yl.at(-1).yoy)} so cùng kỳ` : '—', spark([{v: yl.map(x => x.yoy), c: '#2938A8'}], {zero: true})],
    ['hydro', '02 Thủy văn', inf.length ? `nước về ${ml(inf.at(-1).m)} ${pc(inf.at(-1).med, 0)} so TB 5 năm` : '—', spark([{v: inf.map(x => x.med), c: '#2938A8'}], {zero: true})],
    ['dispatch', '03 Huy động', lastShare ? `than ${nf(lastShare.share.coal, 0)}%, thủy điện ${nf(lastShare.share.hydro, 0)}% (${ms(lastShare.m)})` : '—', spark([{v: shareL.map(m => m.share.coal), c: '#3d4653'}, {v: shareL.map(m => m.share.hydro), c: '#2938A8'}])],
    ['economics', '04 Giá & biên', fmpLast ? `FMP ${ml(fmpLast.period)} ${nf(fmpLast.fmp, 0)} đ/kWh` : '—', spark([{v: fl.map(r => r.fmp), c: '#861C52'}])],
    ['evn', '05 EVN', tLast ? `giá bán lẻ ${nf(tLast, 0)} đ/kWh (${pc(tChg)})` : '—', spark([{v: tv, c: '#1D2678'}])],
    ['supply', '06 Cung dài hạn', pipelineShare ? `${pipelineShare[0]}% dự án quy hoạch đã vận hành` : '—', shortfallMw ? spark([{v: shortfallMw, c: '#b8443a'}]) : '']];
  const tl = el('div', 'ov-tiles', tiles.map(([k, t, take, sp]) => `<a class="ov-tile" href="?section=${k}#mt2" data-pp-go="${k}"><b>${esc(t)}</b><span>${take}</span>${sp}<em>Mở phân tích →</em></a>`).join(''));
  const ai = block('dien-02'), aiFold = ai ? el('details', 'ov-an research-fold ov-aifold', '<summary>Nhận định AI đã lưu ngày 06/10/2026 (chưa cập nhật theo số mới)</summary>') : null;
  if (aiFold) aiFold.append(ai);
  p.append(sec('pulse-sum', '3.1', 'Ngành điện đang ở trạng thái nào?', [sum, aiFold]), sec('pulse-sig', '3.2', 'Ba tín hiệu: cầu, tài nguyên, giá', sigs),
    sec('pulse-tiles', '3.3', 'Đi sâu từng chủ đề (tab Bức tranh ngành)', tl, {sub: 'Số liệu động, lịch sử và chỉ báo chuyên sâu nằm ở tab Bức tranh ngành; Tổng quan chỉ giữ kết luận.'}));
}

/* ===================== 7. 04 · Investment Transmission ===================== */
// Giá trị hiện tại của biến số / chỉ báo (null = trang chưa có dữ liệu).
function live(key) {
  const tr = POL.transitional?.rows || [];
  switch (key) {
    case 'enso': case 'oni': return oniLast ? `ONI ${sg(oniLast.oni, 2)} °C (${oniLast.season} ${oniLast.year}, ${ensoState(oniLast.oni)})` : null;
    case 'inflow': return resYoY ? `nước về ${pc(resYoY.med, 0)} so cùng kỳ (${esc(resYoY.span)})` : null;
    case 'hydro_m': return q3 ? `thủy điện 3 tháng ${pc(q3.get('hydro').yoy)}, than ${pc(q3.get('coal').yoy)}` : null;
    case 'gas_m': return q3 ? `khí & dầu 3 tháng ${pc(q3.get('gas').yoy)}` : null;
    case 'demand': return ytd ? `sản lượng ${esc(PERIODS.ytd.name)} ${pc(ytd.yoy)}` : null;
    case 'pmax': return pmaxYtd ? `công suất đỉnh ${nf(pmaxYtd.cur.pmax, 0)} MW (${dm(pmaxYtd.cur.date)})` : null;
    case 'contrib': { const t = topContrib('ytd')[0]; return t ? `đóng góp lớn nhất: ${esc(t.name)} ${pp(t.contrib)}` : null; }
    case 'coal': return coal3 ? `Newcastle ${nf(coal3.now, 1)} USD/tấn, ${pc(coal3.pct)} ≈3 tháng` : null;
    case 'lng': return jkm3 ? `JKM ${nf(jkm3.now, 2)} USD/MMBtu, ${pc(jkm3.pct)} ≈3 tháng` : null;
    case 'fmp': return fmpLast ? `FMP ${ml(fmpLast.period)} ${nf(fmpLast.fmp, 0)} đ/kWh, ${pc(fmpYoY)} so cùng kỳ` : null;
    case 'qc': return comp('Qc') ? esc(plain(comp('Qc').value)) : null;
    case 'policy': { const p = (POL.policies || []).find(x => x.policy_id === 'fit-review'); return p ? `${esc(p.policy_name)} — ${p.policy_status === 'Draft' ? 'đang rà soát, chưa có kết quả' : esc(p.policy_status)}` : null; }
    case 'transitional': { const r = tr.find(x => /PPA chính thức/.test(x.label)); return r ? `${r.projects}/${tr[0].projects} dự án chuyển tiếp đã ký PPA chính thức (${esc(POL.transitional.as_of_label)})` : null; }
    case 'retail': return tLast ? `giá bán lẻ ${nf(tLast, 2)} đ/kWh từ ${esc(tariffDates.at(-1))} (${pc(tChg)})` : null;
    case 'pipeline': return pipelineShare ? `${pipelineShare[0]}% số dự án quy hoạch đã vận hành (Báo cáo 760/BC-BCT)` : null;
    default: return null;
  }
}
const liveTxt = k => live(k) || '<span class="muted">trang chưa có dữ liệu</span>';
function transmission(p) {
  const dv = card('dien-ov-driver', 'ov-driver', `<div class="ov-ctl ov-drvbtn" role="tablist" aria-label="Biến số ngành">${O.drivers.map((d, i) => `<button type="button" role="tab" data-drv="${d.id}" aria-selected="${!i}">${esc(d.label)}</button>`).join('')}</div><div class="ov-drv-body" aria-live="polite"></div>`);
  const showDrv = id => { const d = O.drivers.find(x => x.id === id);
    dv.querySelectorAll('[data-drv]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.drv === id)));
    const gs = O.groups.filter(g => !/^(Không|Ít)/.test(d.groups[g.id]));
    const cos = [...new Set(gs.flatMap(g => expo(g.id).map(e => e.t)))];
    dv.querySelector('.ov-drv-body').innerHTML = `<div class="ov-map">
        <div class="ov-mapbox"><span>Biến số ngành</span><b>${esc(d.label)}</b><small>${d.live ? liveTxt(d.live) : '<span class="muted">trang chưa có dữ liệu</span>'}</small></div><span class="ov-arrow" aria-hidden="true">↓</span>
        <div class="ov-mapbox"><span>Sản lượng / giá / chi phí</span><small>${esc(d.first)}</small></div><span class="ov-arrow" aria-hidden="true">↓</span>
        <div class="ov-mapbox"><span>Doanh thu · lợi nhuận · dòng tiền</span><small>${esc(d.pnl.revenue)} · ${esc(d.pnl.ebitda)}</small></div><span class="ov-arrow" aria-hidden="true">↓</span>
        <div class="ov-mapbox"><span>Doanh nghiệp liên quan</span><small>${cos.map(t => chip(t)).join(' ') || '—'}</small></div></div>
      <ol class="ov-steps">
        <li><h4>Tác động bước một</h4><p>${esc(d.first)}</p></li>
        <li><h4>Tác động lên hoạt động từng nhóm</h4><div class="tablewrap"><table class="ov-mini"><tbody>${O.groups.map(g => `<tr><th scope="row" style="--c:${g.color}">${esc(g.label)}</th><td>${esc(d.groups[g.id])}</td></tr>`).join('')}</tbody></table></div><p class="ov-cap">Tác động lên sản lượng, giá, chi phí — chưa phải chiều lợi nhuận.</p></li>
        <li><h4>Thành phần lợi nhuận</h4><dl class="ov-dl"><dt>Doanh thu</dt><dd>${esc(d.pnl.revenue)}</dd><dt>LN trước khấu hao (EBITDA)</dt><dd>${esc(d.pnl.ebitda)}</dd><dt>Lợi nhuận</dt><dd>${esc(d.pnl.profit)}</dd><dt>Dòng tiền</dt><dd>${esc(d.pnl.cash)}</dd></dl></li>
        <li><h4>Doanh nghiệp có tài sản liên quan</h4><ul class="ov-list ov-co">${gs.flatMap(g => expo(g.id).map(e => `<li>${chip(e.t)} <span class="ov-role">${esc(g.label)} · ${esc(e.role)}</span> ${esc(e.note)}</li>`)).join('') || '<li class="muted">—</li>'}</ul><p class="ov-cap">Mức liên quan theo tài sản đã ghi nguồn; chiều tác động lên lợi nhuận từng mã chưa xác nhận khi chưa có Qc, điều khoản PPA.</p></li>
        <li><h4>Điều kiện khiến tác động không xảy ra</h4><ul class="ov-list">${d.fails.map(f => `<li>${esc(f)}</li>`).join('')}</ul></li>
        <li><h4>Chỉ báo để kiểm chứng</h4><ul class="ov-list">${d.verify.map(v => `<li><b>${esc(v.label)}</b>: ${v.live ? liveTxt(v.live) : '<span class="muted">trang chưa có dữ liệu</span>'}</li>`).join('')}</ul></li>
      </ol>${d.example ? `<div class="ov-example"><h4>Ví dụ chuỗi truyền dẫn</h4><ol>${d.example.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}
      ${goDetail(d.pp_section)}${goPolicy(d.policy_group)}`; };
  dv.querySelectorAll('[data-drv]').forEach(b => b.addEventListener('click', () => showDrv(b.dataset.drv)));
  showDrv(O.drivers[0].id);
  const hm = card('dien-ov-heat', 'ov-heat', '');
  if (VIS) VIS.heat(hm, ctx, id => { showDrv(id); dv.scrollIntoView({block: 'start'}); window.scrollBy(0, -140); }); else hm.append(gap('không tải được module hình ảnh.'));
  // Tín hiệu vận hành hiện tại theo nhóm (chuyển từ Industry Pulse cũ của tab Bức tranh ngành).
  const hy = G('hydro'), re = G('re'), co = G('coal'), ga = G('gas');
  const op = (v, up, dn, th2 = 3) => v == null ? '<span class="muted">chưa đủ dữ liệu</span>' : v > th2 ? `<span class="up">${up}</span>` : v < -th2 ? `<span class="dn">${dn}</span>` : 'Đi ngang';
  const M2 = [
    ['hydro', `Nước về ${resYoY ? pc(resYoY.med, 0) + ' (' + esc(resYoY.span) + ')' : '—'} · sản lượng ${pc(hy?.yoy)} · FMP ${pc(fmpYoY)} so cùng kỳ`, op(hy?.yoy, 'Thuận về sản lượng', 'Bất lợi về sản lượng'), 'Doanh thu = sản lượng × giá (Qc theo hợp đồng, phần còn lại theo thị trường); chi phí chủ yếu cố định nên sản lượng quyết định lợi nhuận.'],
    ['coal', `Sản lượng than ${pc(co?.yoy)} · Newcastle ${pc(coal3?.pct)} (3 tháng) · FMP ${nf(fmpLast?.fmp, 0)} đ/kWh`, op(co?.yoy, 'Thuận về huy động', 'Huy động giảm'), 'Lợi nhuận tăng khi huy động thêm có biên dương (FMP hoặc giá hợp đồng > chi phí biến đổi) và chi phí nhiên liệu được chuyển ngang.'],
    ['gas', `Sản lượng khí & dầu ${pc(ga?.yoy)} · JKM ${pc(jkm3?.pct)} (3 tháng)`, op(ga?.yoy, 'Thuận về huy động', 'Huy động giảm'), 'Biên năng lượng phụ thuộc giá khí/LNG so FMP và tỷ lệ Qc; LNG đắt có thể làm giảm huy động ngoài Qc.'],
    ['re', `Sản lượng ${pc(re?.yoy)} · <span class="muted">chưa có dữ liệu cắt giảm công suất</span>`, op(re?.yoy, 'Thuận về sản lượng', 'Sản lượng giảm'), 'Giá chủ yếu theo FIT/hợp đồng; lợi nhuận theo sản lượng thực phát (thời tiết, cắt giảm) và chi phí vốn.'],
    ['grid', '<span class="muted">Chưa có chỉ báo định lượng COD, giải ngân lưới</span>', '—', 'Giá trị hợp đồng chưa thực hiện và tiến độ ghi nhận doanh thu theo tiến độ dự án nguồn, lưới; tín hiệu sớm là khởi công, ký EPC.']];
  const opm = card('dien-ov-opmatrix', 'ov-opm', `<div class="tablewrap"><table><thead><tr><th>Nhóm</th><th>Tín hiệu vận hành ${M ? ml(M) : ''}</th><th>Tác động lên hoạt động</th><th>Điều kiện để thành lợi nhuận</th><th>Mã</th></tr></thead><tbody>${M2.map(r => `<tr><td><b>${esc(GROUP[r[0]].label)}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${expo(r[0]).map(e => chip(e.t)).join(' ')}</td></tr>`).join('')}</tbody></table></div><p class="ov-cap">${tag('B')} Cột 3 là tác động lên hoạt động (sản lượng, huy động); cột 4 là điều kiện để thành lợi nhuận. Ngưỡng ±3% sản lượng tháng so cùng kỳ. Không phải khuyến nghị mua/bán.</p>`);
  // Ma trận exposure: biến số × nhóm × doanh nghiệp × cơ chế × điều kiện.
  const rows = O.drivers.flatMap(d => O.groups.filter(g => !/^(Không|Ít)/.test(d.groups[g.id])).map(g => ({d, g, cos: expo(g.id)}))).filter(r => r.cos.length);
  const ex = card('dien-ov-exposure', 'ov-exp', `<div class="ov-ctl"><label>Biến số <select data-f="d"><option value="">Tất cả</option>${O.drivers.map(d => `<option value="${d.id}">${esc(d.label)}</option>`).join('')}</select></label><label>Mã <select data-f="t"><option value="">Tất cả</option>${O.companies.map(c => `<option>${c.ticker}</option>`).join('')}</select></label><span class="muted" data-count></span></div>
    <div class="tablewrap"><table><thead><tr><th>Biến số ngành</th><th>Nhóm chịu tác động</th><th>Doanh nghiệp liên quan</th><th>Cơ chế truyền dẫn</th><th>Điều kiện cần kiểm tra</th></tr></thead><tbody>${rows.map(r => `<tr data-d="${r.d.id}" data-t="${r.cos.map(c => c.t).join(' ')}"><td>${esc(r.d.label)}</td><td>${esc(r.g.label)}</td><td>${r.cos.map(c => chip(c.t, `${c.t} · ${c.role}: ${c.note}`)).join(' ')}</td><td>${esc(r.d.groups[r.g.id])}</td><td>${esc(r.d.fails[0])}</td></tr>`).join('')}</tbody></table></div>
    <p class="ov-cap">${esc(O.company_source)} Danh sách mã là tập nghiên cứu, không tự gán chiều tác động khi chưa có Qc, điều khoản PPA, cơ cấu mảng.</p>`);
  const filt = () => { const d = ex.querySelector('[data-f=d]').value, t = ex.querySelector('[data-f=t]').value; let n = 0;
    ex.querySelectorAll('tbody tr').forEach(tr => { const on = (!d || tr.dataset.d === d) && (!t || tr.dataset.t.split(' ').includes(t)); tr.hidden = !on; n += on; });
    ex.querySelector('[data-count]').textContent = `${n}/${rows.length} dòng`; };
  ex.querySelectorAll('select').forEach(s => s.addEventListener('change', filt)); filt();
  // Độ nhạy lợi nhuận: chỉ định tính khi thiếu dữ liệu.
  const sv = card('dien-ov-sens', 'ov-sens', `${gap('Chưa đủ dữ liệu để ước tính độ nhạy lợi nhuận (EBITDA, EPS) theo từng doanh nghiệp: thiếu Qc, giá PPA, suất hao nhiệt, giá nhiên liệu theo hợp đồng và dư nợ từng nhà máy. Trang không tự tạo phần trăm tác động.').outerHTML}
    <div class="tablewrap"><table><thead><tr><th>Nhóm</th><th>Đầu vào cần có để tính độ nhạy</th></tr></thead><tbody>${SOURCES.map(k => `<tr><td><b>${esc(GROUP[k].label)}</b></td><td>${O.sensitivity.inputs[k].map(esc).join(' · ')}</td></tr>`).join('')}</tbody></table></div>
    <details class="ov-an"><summary>Công thức nguyên lý</summary><p class="ov-formula">${esc(O.sensitivity.formula)}</p></details>`);
  // Dữ liệu doanh nghiệp: so sánh tài chính (giữ nguyên module chung) và bảng 18 doanh nghiệp.
  const fc = document.querySelector('#pane-mt1 .financial-comparison');
  const dn = block('dien-03')?.closest('.section') || block('dien-03');
  const dnFold = dn ? el('details', 'research-fold ov-dnfold', '<summary>Bảng 18 doanh nghiệp theo dõi: tài sản phát điện, biến lợi nhuận, sự kiện 2025–26</summary>') : null;
  if (dnFold) { dnFold.id = 'ov-companies'; dnFold.append(dn); dn.querySelectorAll(':scope .grid.two').forEach(g => { if (!g.children.length) g.remove(); }); }
  p.append(wwh(`Biến số đang vượt ngưỡng: ${INS.filter(i => i.kind !== 'note').map(i => esc(i.title)).join(', ') || 'không có'}.`, 'Cùng một biến số ngành tác động khác nhau lên từng doanh nghiệp tùy nhóm nguồn, tỷ lệ Qc, điều khoản PPA và cơ cấu mảng.', 'Qc 2027; biên gộp quý IV/2026 của nhà máy nhiệt điện; kết quả đàm phán giá NLTT.'),
    sec('tr-heat', '4.1', 'Biến số nào chạm tới nhóm nguồn, doanh nghiệp nào mạnh nhất?', hm),
    sec('tr-map', '4.2', 'Một biến số ngành đi tới lợi nhuận doanh nghiệp qua những bước nào?', dv, {sub: 'Chọn biến số: tác động bước một → nhóm nguồn → thành phần lợi nhuận → doanh nghiệp → điều kiện không xảy ra → chỉ báo kiểm chứng (kèm giá trị hiện tại nếu trang có).'}),
    sec('tr-op', '4.3', 'Tín hiệu vận hành hiện tại chạm tới nhóm doanh nghiệp nào?', opm),
    sec('tr-exp', '4.4', 'Doanh nghiệp nào chịu tác động của từng biến số?', ex),
    sec('tr-sens', '4.5', 'Có ước tính được độ nhạy lợi nhuận không?', sv),
    sec('tr-data', '4.6', 'Số liệu doanh nghiệp', [fc, dnFold].filter(Boolean), {sub: 'So sánh tài chính & định giá và bảng 18 doanh nghiệp. ↗ ở các bảng trên mở trang phân tích cổ phiếu khi đã có.'}));
}

/* ===================== 8. 05 · Forward Monitor ===================== */
const nextSecondThursday = from => { for (let k = 0; k < 3; k++) { const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + k, 1)); d.setUTCDate(1 + ((4 - d.getUTCDay() + 7) % 7) + 7); if (ymd(d) >= ymd(from)) return ymd(d); } return null; };
function releaseDate(r) {
  const now = new Date(TODAY + 'T00:00:00Z');
  if (r.rule === 'second_thursday') return {date: nextSecondThursday(now)};
  if (r.rule === 'first_week') { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)); return {date: ymd(d), label: '01–07/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear()}; }
  return r.date ? {date: r.date, end: r.end} : {date: null};
}
const REL = Object.fromEntries(O.releases.map(r => [r.id, {...r, ...releaseDate(r)}]));
const relTxt = id => { const r = REL[id]; if (!r) return ''; return `${esc(r.label)} — ${r.date ? (r.label2 || (r.end ? dm(r.date) + '–' + dm(r.end) : r.rule === 'first_week' ? releaseDate(r).label : (r.kind === 'earliest' ? 'sớm nhất ' : '') + dm(r.date))) : 'chưa có ngày'}`; };
const STATUS = {supported: ['Có bằng chứng', 'ov-st-up'], insufficient: ['Chưa đủ bằng chứng', 'ov-st-nt'], contradicted: ['Bị phản bác', 'ov-st-dn']};
function thesisStatus(t) {
  const ev = [], gaps = [];
  if (t.rule === 'thermal_dry') {
    if (!q3 || !thQ) return {s: 'insufficient', ev, gaps: ['Chưa đủ 80% ngày đối chiếu 3 tháng.']};
    const h = q3.get('hydro').yoy, th = thQ.yoy, dry = resYoY && resYoY.med < T.hydro_dry_inflow_pct;
    ev.push(`Thủy điện 3 tháng ${pc(h)}; than + khí ${pc(th)} so cùng kỳ (${q3.n}/${q3.total} ngày).`);
    if (resYoY) ev.push(`Nước về ${pc(resYoY.med, 0)} so cùng kỳ (${esc(resYoY.span)}).`);
    const premise = h <= T.t1_hydro_pct || dry;
    if (!premise) return {s: 'insufficient', ev, gaps: ['Thủy văn chưa bất lợi theo ngưỡng (thủy điện chưa giảm ≥5% và nước về chưa thấp hơn 10%), luận điểm chưa được thử thách.']};
    return th >= T.t1_thermal_pct ? {s: 'supported', ev, gaps} : th <= 0 ? {s: 'contradicted', ev, gaps: ['Thủy văn bất lợi nhưng than + khí không tăng: kiểm tra phụ tải, nhập khẩu, NLTT, ràng buộc nhiên liệu.']} : {s: 'insufficient', ev, gaps: ['Than + khí tăng dưới ngưỡng 5%.']};
  }
  if (t.rule === 'gas_fuel') {
    if (!jkm3 || !q3) return {s: 'insufficient', ev, gaps: ['Thiếu giá LNG hoặc sản lượng 3 tháng.']};
    const j = jkm3.pct, g = q3.get('gas').yoy;
    ev.push(`LNG JKM ${pc(j)} ≈3 tháng; sản lượng khí & dầu 3 tháng ${pc(g)} so cùng kỳ.`);
    // Công suất mới trong 12 tháng (vd NT3&4) làm so cùng kỳ của sản lượng khí lệch: không chấm ủng hộ/phản bác.
    const cf = t.confound, cfEnd = cf && ymd(new Date(Date.parse(cf.from) + 365 * 864e5));
    if (cf && q3.from && q3.from.slice(0, 10) <= cfEnd) return {s: 'insufficient', ev, gaps: [esc(cf.note)]};
    if (Math.abs(j) < T.fuel_move_pct) return {s: 'insufficient', ev, gaps: ['Giá LNG chưa biến động quá ±15% trong 3 tháng.']};
    if ((j > 0 && g <= -T.t2_gas_pct) || (j < 0 && g >= T.t2_gas_pct)) return {s: 'supported', ev, gaps};
    if (j > 0 && g >= T.t2_gas_pct) return {s: 'contradicted', ev, gaps: ['Giá LNG tăng mạnh nhưng sản lượng khí vẫn tăng; có thể do Qc và công suất mới, cần tách theo nhà máy.']};
    return {s: 'insufficient', ev, gaps: ['Sản lượng khí đổi dưới ngưỡng ±5%.']};
  }
  if (t.rule === 'grid_capex') {
    if (pipelineShare) ev.push(`Báo cáo 760/BC-BCT: ${pipelineShare[0]}% số dự án quy hoạch đã vận hành.`);
    if (shortfallMw) ev.push(`Kịch bản chậm tiến độ: thiếu ${nf(shortfallMw.at(-1), 0)} MW năm ${shortfallYears.at(-1)}.`);
    ev.push('PC1: hợp đồng EPC chưa thực hiện 8.250 tỷ đồng cuối 2025 (bảng 18 doanh nghiệp).');
    return {s: 'insufficient', ev, gaps: ['Trang chưa có chuỗi giải ngân lưới EVN/NPT và giá trị hợp đồng EPC chưa thực hiện theo quý để kiểm chứng.']};
  }
  if (t.rule === 'fit_cash') {
    const tr = POL.transitional?.rows || [], pend = tr.find(r => /chưa thỏa thuận/.test(r.label)), notSent = tr.find(r => /Chưa gửi/.test(r.label));
    if (pend) ev.push(`${pend.projects} dự án đã vận hành nhưng chưa thỏa thuận giá (${esc(POL.transitional.as_of_label)}).`);
    if (notSent) ev.push(`${notSent.projects} dự án chuyển tiếp chưa gửi hồ sơ đàm phán.`);
    const fr = (POL.policies || []).find(x => x.policy_id === 'fit-review'), hdg = fr?.exposed_companies?.find(c => c.ticker === 'HDG' && c.note);
    if (hdg) ev.push(`HDG: ${esc(hdg.note)} (tab Policy · rà soát FIT).`);
    return ev.length ? {s: 'supported', ev, gaps: ['Bằng chứng văn bản, chưa định lượng tác động lên dòng tiền từng doanh nghiệp; chưa có danh sách 173 nhà máy theo chủ đầu tư.']} : {s: 'insufficient', ev, gaps: ['Chưa có dữ liệu chính sách.']};
  }
  return {s: 'insufficient', ev, gaps};
}
const THESES = O.theses.map(t => ({...t, ...thesisStatus(t)}));
THESES.filter(t => t.s === 'contradicted').forEach(t => add({id: 'thesis-' + t.id, kind: 'note', seg: t.segments, lv: 'B', title: 'Luận điểm bị phản bác', obs: esc(t.title) + '.', cmp: t.ev.join(' '), interp: t.gaps.join(' '), impl: 'Dữ liệu thực tế khác giả thuyết theo dõi: rà lại luận điểm.', valid: '', src: 'Theo dõi triển vọng', asOf: lastDay}));
function forward(p) {
  const ol = card('dien-ov-outlook', 'ov-outlook', '');
  if (VIS) VIS.outlook(ol, ctx); else ol.append(gap('không tải được module hình ảnh.'));
  const th = card('dien-ov-thesis', 'ov-thesis', THESES.map(t => `<article class="ov-th"><header><h4>${esc(t.title)}</h4><span class="ov-st ${STATUS[t.s][1]}">${STATUS[t.s][0]}</span></header>
    <dl class="ov-dl"><dt>Bằng chứng hiện tại</dt><dd>${t.ev.map(x => `<p>${tag('A')} ${x}</p>`).join('') || '—'}${t.gaps.map(x => `<p class="muted">${x}</p>`).join('')}</dd>
    <dt>Chỉ báo ủng hộ</dt><dd>${esc(t.support)}</dd><dt>Chỉ báo phản bác</dt><dd>${esc(t.contra)}</dd>
    <dt>Nhóm nguồn</dt><dd>${t.segments.map(g => esc(GROUP[g].label)).join(', ')}</dd><dt>Doanh nghiệp</dt><dd>${t.tickers.map(x => chip(x)).join(' ')}</dd>
    <dt>Mốc dữ liệu tiếp theo</dt><dd>${t.next.map(relTxt).join('<br>')}</dd><dt>Cập nhật</dt><dd>dữ liệu EVN đến ${dm(lastDay)}; trạng thái tính lại mỗi lần mở trang</dd></dl></article>`).join('') +
    `<p class="ov-cap">Trạng thái tính theo quy tắc với ngưỡng cố định của trang (xem mục chi tiết ở Bức tranh hiện tại); không phải tín hiệu mua/bán. ${esc(O.threshold_note)}</p>`);
  // Lịch catalyst: văn bản tab Policy + hạn theo quy định + lịch công bố dữ liệu; phân biệt đã xảy ra / có lịch / sớm nhất theo quy định / dự kiến / chưa có ngày.
  const KINDS = {done: ['Đã xảy ra', '#7a8399'], scheduled: ['Có lịch xác nhận', '#2938A8'], earliest: ['Sớm nhất theo quy định', '#861C52'], expected: ['Dự kiến (nhận định / theo mùa)', '#c98a00'], undated: ['Chưa có ngày', '#9AA3BD']};
  const lo = ymd(new Date(Date.parse(TODAY) - 120 * 864e5)), hi = ymd(new Date(Date.parse(TODAY) + 420 * 864e5));
  const pol = (POL.policies || []).flatMap(p => [
      p.effective_date && {date: p.effective_date, text: `${p.policy_name} có hiệu lực`, kind: p.effective_date <= TODAY ? 'done' : 'scheduled', note: 'ngày hiệu lực theo văn bản', cat: 'Chính sách', url: p.primary_source_url},
      p.expiration_date && {date: p.expiration_date, text: `${p.policy_name} hết hiệu lực`, kind: p.expiration_date <= TODAY ? 'done' : 'scheduled', note: 'theo văn bản', cat: 'Chính sách', url: p.primary_source_url},
      p.policy_status === 'Draft' && !O.releases.some(r => r.policy_id === p.policy_id) && {date: null, text: p.policy_name, kind: 'undated', note: 'dự thảo / đang xử lý', cat: 'Chính sách', url: p.primary_source_url}].filter(Boolean));
  const ev = [...pol,
    ...O.releases.map(r => { const x = REL[r.id]; return {date: x.date, end: x.end, label: r.rule === 'first_week' ? releaseDate(r).label : r.kind === 'earliest' ? 'từ ' + dm(x.date) : null, text: r.label, kind: r.kind, note: r.basis, cat: r.policy_id || /Giấy phép|EVN báo cáo|QCVN|LNG/.test(r.label) ? 'Chính sách & hạn' : 'Dữ liệu & mùa vụ', url: r.url}; })]
    .filter(e => !e.date || (e.date >= lo && e.date <= hi)).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const tl = card('dien-ov-timeline', 'ov-tl', `<div class="ov-ctl" role="group" aria-label="Loại mốc">${Object.entries(KINDS).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="true"><i style="background:${v[1]}"></i>${v[0]} (${ev.filter(e => e.kind === k).length})</button>`).join('')}</div>
    <ol class="ov-tl-list">${ev.map(e => `<li data-k="${e.kind}" class="${e.date && e.date < TODAY ? 'past' : ''}"><span class="ov-tl-d" style="--c:${KINDS[e.kind][1]}">${e.label || (e.date ? dm(e.date) + (e.end ? '–' + dm(e.end) : '') : '—')}</span><div><b>${esc(e.text)}</b><small>${esc(KINDS[e.kind][0])}${e.note ? ' · ' + esc(e.note) : ''} · ${esc(e.cat)}${e.url ? ' · ' + link(e.url, 'nguồn') : ''}</small></div></li>`).join('')}</ol>
    <p class="ov-cap">Mốc chính sách: ngày hiệu lực, hết hiệu lực của văn bản trong tab Policy · Tax · Trade và các hạn theo quy định; không tự điền ngày khi chưa có nguồn. Khoảng hiển thị: 4 tháng trước → 14 tháng sau.</p>`);
  tl.querySelectorAll('[data-k]').forEach(b => b.tagName === 'BUTTON' && b.addEventListener('click', () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); const on = new Set([...tl.querySelectorAll('button[data-k][aria-pressed=true]')].map(x => x.dataset.k)); tl.querySelectorAll('li[data-k]').forEach(li => { li.hidden = !on.has(li.dataset.k); }); }));
  const cnt = s => THESES.filter(t => t.s === s).length;
  p.append(wwh(`${cnt('supported')} luận điểm có bằng chứng, ${cnt('insufficient')} chưa đủ bằng chứng, ${cnt('contradicted')} bị phản bác.`, 'Luận điểm chỉ có giá trị khi được kiểm lại bằng số mới; trạng thái đổi theo dữ liệu, không giữ cố định.', [...new Set(THESES.flatMap(t => t.next))].slice(0, 3).map(relTxt).join('; ') + '.'),
    sec('fw-supply', '5.1', 'Nguồn cung mới đến từ đâu, bao nhiêu MW, chắc chắn đến đâu?', ol),
    sec('fw-thesis', '5.2', 'Những luận điểm nào đang được dữ liệu ủng hộ hoặc phản bác?', th, {sub: 'Mỗi luận điểm: bằng chứng hiện tại, chỉ báo ủng hộ/phản bác, nhóm nguồn, doanh nghiệp, mốc dữ liệu tiếp theo.'}),
    sec('fw-cal', '5.3', 'Sự kiện nào có thể làm thay đổi luận điểm trong 6–12 tháng tới?', tl, {sub: `Đầy đủ tín hiệu, kịch bản và góc nhìn của chuyên viên phân tích: <a href="#mt5" data-ov-main="mt5">tab Catalyst · Risk →</a>`}));
}

/* ===================== 9. Dựng tab, điều hướng ===================== */
const SECTIONS = [
  ['map', '00', 'Bản đồ ngành', 'Toàn cảnh ngành', 'Điện, tiền và quyết định huy động đi qua những ai?', mapPane],
  ['tech', '01', 'Chuỗi giá trị theo công nghệ', 'Than · khí · LNG · thủy điện · gió · mặt trời', 'Mỗi loại nhà máy tạo doanh thu, tốn chi phí ở khâu nào?', techPane],
  ['unit', '02', 'Kinh tế đơn vị', 'Doanh thu, chi phí mỗi kWh', 'Một kWh mang lại bao nhiêu và tốn bao nhiêu?', unitPane],
  ['pulse', '03', 'Bức tranh hiện tại', 'Số liệu mới nhất', 'Ngành đang ở trạng thái nào?', pulse],
  ['transmission', '04', 'Tác động đầu tư', 'Doanh nghiệp · So sánh tài chính', 'Biến động ngành ảnh hưởng đến doanh nghiệp ra sao?', transmission],
  ['forward', '05', 'Triển vọng', 'Nguồn mới, sự kiện sắp tới', 'Điều gì có thể làm thay đổi luận điểm?', forward]
];
// Khóa cũ (bản 5 sub-tab) vẫn mở đúng chỗ.
const ALIAS = {economics: 'unit', mix: 'tech'};
SECTIONS.forEach(s => { renders[s[0]] = []; });
function build() {
  const pane = document.getElementById('pane-mt1'); if (!pane || pane.querySelector('.ov-nav')) return;
  const head = pane.querySelector(':scope>.sectionhead');
  // Gỡ khung sub-tab cũ (Chuỗi giá trị / Mô hình kinh doanh / So sánh tài chính / Doanh nghiệp theo dõi) sau khi dời nội dung.
  const oldBar = pane.querySelector(':scope>.pane-subtabs'), oldPanes = [...pane.querySelectorAll(':scope>.pane-subpane')];
  document.getElementById('dataBrief')?.remove();
  if (head) head.innerHTML = `<div><h2 class="sec">Tổng quan ngành điện</h2><p>Nhìn để hiểu ngành, bấm để phân tích: bản đồ ngành → chuỗi giá trị từng công nghệ → kinh tế một kWh → trạng thái hiện tại → tác động tới doanh nghiệp → triển vọng.</p></div>`;
  const nav = el('div', 'ov-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Tổng quan ngành: sáu bước');
  head ? head.after(nav) : pane.prepend(nav);
  const panes = {}; let anchor = nav;
  SECTIONS.forEach(([key, num, label, tech, q]) => {
    const b = el('button', 'tabbtn ov-tab', `<span>${num}</span>${esc(label)}<small>${esc(tech)}</small>`); b.type = 'button'; b.id = 'mt1-ov-' + key + '-tab'; b.setAttribute('role', 'tab'); b.dataset.ov = key; nav.append(b);
    const p = el('div', 'pane-subpane ov-pane'); p.id = 'mt1-ov-' + key; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.hidden = true; b.setAttribute('aria-controls', p.id);
    p.innerHTML = `<header class="ov-head"><div><span class="ov-k">${num} · ${esc(tech)}</span><h2>${esc(label)}</h2><p>${esc(q)}</p></div>${key !== 'map' ? '<a href="?ov=map#mt1" data-ov-go="map" class="ov-back">← Bản đồ ngành</a>' : ''}</header>`;
    anchor.after(p); anchor = p; panes[key] = p;
  });
  // Nội dung: thứ tự dựng giữ .business-models (02) trước .financial-comparison (04) trong DOM.
  SECTIONS.forEach(([key, , , , , fn]) => { try { fn(panes[key]); } catch (e) { panes[key].append(gap('lỗi dựng phần này: ' + esc(e.message))); document.documentElement.dataset.ovError = (document.documentElement.dataset.ovError || '') + key + ':' + e.message + ';'; console.error(e); } });
  // Bản đồ ngành 3 bước (đã có trong luồng chuỗi giá trị) và khung sub-tab cũ.
  pane.querySelector('.research-roadmap')?.remove();
  const left = oldPanes.flatMap(w => [...w.children]);
  if (left.length) { const d = el('details', 'research-fold ov-an', '<summary>Nội dung khác của bản trước</summary>'); left.forEach(n => d.append(n)); panes.transmission.append(d); document.documentElement.dataset.ovLeftover = left.map(n => n.dataset.blockId || n.className).join(','); }
  oldPanes.forEach(w => w.remove()); oldBar?.remove();

  // Thanh trên cùng (trạng thái, ngày dữ liệu, nút Nhà đầu tư/Analyst, Đi tới) đã bỏ 12/11/2026 theo yêu cầu người dùng: trùng thanh giá và tab chính.
  // Không còn ẩn lớp Analyst: các phần chi tiết vẫn nằm trong mục thu gọn (details), mở khi cần.

  const keys = SECTIONS.map(s => s[0]), done = new Set(), btns = [...nav.children];
  const select = (key, push) => {
    key = ALIAS[key] || key; if (!keys.includes(key)) key = 'map';
    keys.forEach((k, i) => { const on = k === key; panes[k].hidden = !on; btns[i].setAttribute('aria-selected', String(on)); btns[i].tabIndex = on ? 0 : -1; btns[i].classList.toggle('active', on); });
    if (!done.has(key)) { done.add(key); renders[key].forEach(f => { try { f(); } catch (e) { document.documentElement.dataset.ovError = (document.documentElement.dataset.ovError || '') + key + ':' + e.message + ';'; console.error(e); } }); }
    const u = new URL(location.href);
    if (push && u.searchParams.get('ov') !== key) { u.searchParams.set('ov', key); ['section', 'policy', 'm', ...(key !== 'tech' ? ['t', 's'] : [])].forEach(x => u.searchParams.delete(x)); history.pushState({ov: key}, '', u.pathname + u.search + '#mt1'); }
    const b = btns[keys.indexOf(key)]; if (b) nav.scrollLeft = Math.max(0, b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 30); refit(panes[key]);
  };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => select(b.dataset.ov, true));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1, Home: -i, End: btns.length - 1 - i}[e.key]; if (d == null) return; e.preventDefault(); const n = (i + d + btns.length) % btns.length; btns[n].click(); btns[n].focus(); });
  });
  const fromUrl = () => new URL(location.href).searchParams.get('ov');
  addEventListener('popstate', () => { const s = fromUrl(); if (s && location.hash === '#mt1') { window.showMajorTab?.('mt1'); select(s, false); } });
  const jump = (key, node) => { window.showMajorTab?.('mt1'); select(key, true); setTimeout(() => { if (node?.tagName === 'DETAILS') node.open = true; (node || pane).scrollIntoView({block: 'start'}); refit(panes[key]); }, 40); };
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-ov-go]'); if (a) { e.preventDefault(); jump(a.dataset.ovGo); return; }
    const tt = e.target.closest('[data-ov-tech]'); if (tt) { e.preventDefault(); const u = new URL(location.href); u.searchParams.set('t', tt.dataset.ovTech); u.searchParams.delete('s'); history.replaceState(null, '', u.pathname + u.search + location.hash); jump('tech', panes.tech); techApi?.show(tt.dataset.ovTech); return; }
    const j = e.target.closest('[data-ov-jump]'); if (j) { e.preventDefault(); jump('transmission', j.dataset.ovJump === 'companies' ? document.getElementById('ov-companies') : pane.querySelector('.financial-comparison')); return; }
    const m = e.target.closest('[data-ov-main]'); if (m) { e.preventDefault(); window.showMajorTab?.(m.dataset.ovMain); window.scrollTo({top: 0}); return; }
    const g = e.target.closest('[data-ov-policy]'); if (g) { e.preventDefault(); window.showMajorTab?.('mt4'); setTimeout(() => { document.getElementById('pp-tabbtn-' + g.dataset.ovPolicy)?.click(); window.scrollTo({top: 0}); }, 30); }
  });
  // Trạng thái công nghệ / khâu đang chọn lưu ở ?t=&s= để link thẳng tới từng sơ đồ.
  ctx.onState = ({t, s}) => { const u = new URL(location.href); if (u.searchParams.get('ov') !== 'tech') return; u.searchParams.set('t', t); u.searchParams.set('s', s); history.replaceState(null, '', u.pathname + u.search + location.hash); };
  const s0 = fromUrl();
  if (s0) { if (!location.hash || location.hash === '#' || location.hash === '#mt1') { history.replaceState(null, '', location.pathname + location.search + '#mt1'); window.showMajorTab?.('mt1'); } }
  select(s0 || 'map', false);
  const setTop = () => { const t = document.querySelector('.majortabs'); const cs = t && getComputedStyle(t); nav.style.top = cs && cs.position === 'sticky' && innerWidth > 700 ? (t.getBoundingClientRect().height + 8) + 'px' : '0px'; };
  setTop(); addEventListener('resize', setTop);
  document.documentElement.dataset.ovReady = '1';
}
function start() {
  // Sau tab Bức tranh ngành (ppReady): card dùng chung đã về đúng chỗ; nút "Xem phân tích chi tiết" (data-pp-go) dùng điều hướng của tab đó; dien-02 đã được để lại cho Industry Pulse.
  let n = 0; const t = setInterval(() => {
    if (document.documentElement.dataset.ppReady || ++n > 60) { clearInterval(t); try { build(); } catch (e) { document.documentElement.dataset.ovError = 'build:' + e.message; console.error(e); } }
  }, 150);
}
if (document.readyState === 'complete') setTimeout(start, 800); else addEventListener('load', () => setTimeout(start, 800));
})();
