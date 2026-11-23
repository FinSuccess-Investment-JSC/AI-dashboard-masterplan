/* Điện · Tổng quan ngành (#mt1), 5 sub-tab: 00 Bản đồ ngành · 01 Chuỗi giá trị theo công nghệ · 02 Kinh tế đơn vị
   · 03 Doanh nghiệp niêm yết (định giá, hiệu quả, lợi nhuận + bảng so sánh) · 04 Triển vọng (nguồn cung mới, luận điểm, lịch).
   Sub-tab Bức tranh hiện tại đã bỏ 23/11/2026 theo yêu cầu người dùng (trạng thái ngành xem ở tab Bức tranh ngành); khóa cũ ?ov=pulse mở Bản đồ ngành.
   Số liệu và quy tắc dùng chung: window.POWER_CORE (xuất từ assets/power-picture.js). Nội dung định tính, ngưỡng, mã và luận điểm:
   window.POWER_OVERVIEW (data/power-overview.json → scripts/build_power_overview.py). Chính sách: window.POWER_POLICY. Lớp hình ảnh:
   assets/power-overview-visual.js. Không tạo số khi thiếu dữ liệu. Card cũ của tab được DỜI, không xóa.
   Deep-link: Dien/?ov=<map|tech|unit|transmission|forward>[&t=&s=]#mt1. */
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
  p.append(sec('unit-econ', '2.1', 'Giá thị trường đang ở đâu so với trần giá của từng loại hình?', ue, {sub: 'FMP bình quân tháng gần nhất so với trần khung giá phát điện năm gần nhất của từng loại hình.'}),
    sec('unit-bm', '2.2', 'Nhà máy điện kiếm tiền như thế nào?', [bmg, bmFold], {sub: 'Công thức nguyên lý; ↗ mở trang phân tích cổ phiếu.'}),
    sec('unit-peer', '2.3', 'Bốn nhóm nguồn khác nhau ở đâu?', peer),
    sec('unit-mech', '2.4', 'PPA, Qc, SMP, CAN, FMP, DPPA nghĩa là gì?', mech, {sub: 'Định nghĩa → ví dụ → căn cứ (mục chi tiết).'}));
}

/* ===================== 7. 03 · Doanh nghiệp niêm yết ===================== */
// 23/11/2026: người dùng bỏ các khối chữ (heatmap biến số, bản đồ truyền dẫn, ma trận, độ nhạy); chỉ giữ số liệu doanh nghiệp, làm trực quan.
function transmission(p) {
  const host = card('dien-ov-companies', 'ov-companies', '');
  renders.transmission.push(() => { if (VIS?.companies) VIS.companies(host, ctx); else host.append(gap('không tải được module hình ảnh.')); });
  const fc = document.querySelector('#pane-mt1 .financial-comparison');
  const dn = block('dien-03')?.closest('.section') || block('dien-03');
  const dnFold = dn ? el('details', 'research-fold ov-dnfold', '<summary>Bảng 18 doanh nghiệp: tài sản phát điện, biến lợi nhuận, sự kiện 2025–26</summary>') : null;
  if (dnFold) { dnFold.id = 'ov-companies'; dnFold.append(dn); dn.querySelectorAll(':scope .grid.two').forEach(g => { if (!g.children.length) g.remove(); }); }
  p.append(sec('co-dash', '3.1', '18 doanh nghiệp điện: định giá, hiệu quả, lợi nhuận', host, {sub: 'Bấm nhóm để lọc mọi biểu đồ.'}),
    sec('tr-data', '3.2', 'Bảng so sánh chi tiết và xu hướng theo quý', [fc, dnFold].filter(Boolean)));
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
    `<p class="ov-cap">Trạng thái tính theo quy tắc với ngưỡng cố định của trang ; không phải tín hiệu mua/bán. ${esc(O.threshold_note)}</p><details class="ov-fold"><summary>Các ngưỡng dùng để tính trạng thái</summary><ul class="ov-foot">${Object.values(O.thresholds).map(v => `<li>${esc(v.basis)}</li>`).join('')}</ul></details>`);
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
    sec('fw-supply', '4.1', 'Nguồn cung mới đến từ đâu, bao nhiêu MW, chắc chắn đến đâu?', ol),
    sec('fw-thesis', '4.2', 'Những luận điểm nào đang được dữ liệu ủng hộ hoặc phản bác?', th, {sub: 'Mỗi luận điểm: bằng chứng hiện tại, chỉ báo ủng hộ/phản bác, nhóm nguồn, doanh nghiệp, mốc dữ liệu tiếp theo.'}),
    sec('fw-cal', '4.3', 'Sự kiện nào có thể làm thay đổi luận điểm trong 6–12 tháng tới?', tl, {sub: `Đầy đủ tín hiệu, kịch bản và góc nhìn của chuyên viên phân tích: <a href="#mt5" data-ov-main="mt5">tab Catalyst · Risk →</a>`}));
}

/* ===================== 9. Dựng tab, điều hướng ===================== */
const SECTIONS = [
  ['map', '00', 'Bản đồ ngành', 'Toàn cảnh ngành', 'Điện, tiền và quyết định huy động đi qua những ai?', mapPane],
  ['tech', '01', 'Chuỗi giá trị theo công nghệ', 'Than · khí · LNG · thủy điện · gió · mặt trời', 'Mỗi loại nhà máy tạo doanh thu, tốn chi phí ở khâu nào?', techPane],
  ['unit', '02', 'Kinh tế đơn vị', 'Giá thị trường so với trần giá', 'Giá bán mỗi kWh nằm ở đâu và nhà máy kiếm tiền thế nào?', unitPane],
  ['transmission', '03', 'Doanh nghiệp niêm yết', 'Định giá · lợi nhuận · So sánh tài chính', 'Doanh nghiệp điện đang được định giá và có lợi nhuận ra sao?', transmission],
  ['forward', '04', 'Triển vọng', 'Nguồn mới, sự kiện sắp tới', 'Điều gì có thể làm thay đổi luận điểm?', forward]
];
// Khóa cũ (bản 5 sub-tab) vẫn mở đúng chỗ.
const ALIAS = {economics: 'unit', mix: 'tech', pulse: 'map'};
SECTIONS.forEach(s => { renders[s[0]] = []; });
function build() {
  const pane = document.getElementById('pane-mt1'); if (!pane || pane.querySelector('.ov-nav')) return;
  const head = pane.querySelector(':scope>.sectionhead');
  // Gỡ khung sub-tab cũ (Chuỗi giá trị / Mô hình kinh doanh / So sánh tài chính / Doanh nghiệp theo dõi) sau khi dời nội dung.
  const oldBar = pane.querySelector(':scope>.pane-subtabs'), oldPanes = [...pane.querySelectorAll(':scope>.pane-subpane')];
  document.getElementById('dataBrief')?.remove();
  if (head) head.innerHTML = `<div><h2 class="sec">Tổng quan ngành điện</h2><p>Nhìn để hiểu ngành, bấm để phân tích: bản đồ ngành → chuỗi giá trị từng công nghệ → kinh tế một kWh → doanh nghiệp niêm yết → triển vọng.</p></div>`;
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
