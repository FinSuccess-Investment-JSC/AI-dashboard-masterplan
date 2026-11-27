/* Dầu khí · Pháp lý theo văn bản (27/11/2026, cùng khuôn BĐS: Bat-dong-san/app/re-legal.js):
   - Tổng quan ngành › 00 Bản đồ ngành: mục "Khung pháp lý chính" dưới chuỗi giá trị (luật gắn từng khâu + bảng văn bản, trạng thái).
   - Tab Chính sách: mỗi sub-tab một văn bản, mở đầu tóm tắt 3–5 dòng; sub-tab cuối "Mới duyệt gần đây".
   Số và mốc: thẻ đã có nguồn trên trang (dau-khi-27, 28, dòng thời gian thuế) và trang gốc đã mở ngày 27/11/2026 —
   đoạn trích lưu ở data/oil/evidence.json (block dau-khi-legal). Chạy sau oil-frame.js (sự kiện 'oil:frame'). */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const A = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
const U = {
  law: 'https://baovanhoa.vn/chinh-tri/quoc-hoi-thong-qua-luat-dau-khi-sua-doi-258573.html',
  lawNo: 'https://baoquocte.vn/cong-bo-lenh-cua-chu-tich-nuoc-ve-luat-dau-khi-nam-2026-442209.html',
  nd: 'https://lsvn.vn/truoc-10-11-phai-trinh-quy-dinh-moi-ve-kinh-doanh-xang-dau-a181317.html',
  qh8: 'https://tapchicongthuong.vn/thu-tuong-phe-duyet-dieu-chinh-quy-hoach-dien-viii-139491.htm',
};

const SUM = {
  law: {t: 'Luật Dầu khí 2026 · 10/2026/QH16 · thông qua 23/08/2026 · hiệu lực 01/03/2027', l: [
    `Thay Luật Dầu khí 12/2022/QH15 (${A(U.lawNo, 'Báo Quốc tế')}); Quốc hội thông qua với <b>473/475</b> đại biểu tán thành (${A(U.law, 'Báo Văn hóa')}); ${A('https://static3.luatvietnam.vn/uploaded/others/2026/09/04/10_2026_qh16_155633_0409161522.pdf', 'văn bản 10/2026/QH16')}.`,
    '<b>Phân cấp mạnh cho Petrovietnam</b>: nhiều nội dung chuyên môn, chọn nhà thầu, quản lý hợp đồng không phải trình cấp trên — rút ngắn thời gian ra quyết định đầu tư.',
    'Mỏ cận biên, tận thu: được đề xuất nâng trần thu hồi chi phí thêm tối đa <b>10%</b>; được giữ diện tích đã có phát hiện khí khi gia hạn hợp đồng.',
    'Mở phạm vi sang thu giữ, lưu trữ CO₂ và công trình năng lượng ngoài khơi, có quy định về tín chỉ carbon.',
    'Dịch vụ kỹ thuật (<b>PVD, PVS</b>) hưởng lợi trước qua hợp đồng mới; sản lượng và hạ tầng khí (<b>GAS</b>) hưởng lợi sau; tốc độ phụ thuộc nghị định hướng dẫn.']},
  price: {t: 'Kinh doanh xăng dầu & điều hành giá · NĐ 83/2014/NĐ-CP và các nghị định sửa đổi', l: [
    'Liên Bộ Công Thương – Tài chính công bố giá trần bán lẻ theo kỳ, dựa trên bình quân giá thành phẩm thế giới giữa hai kỳ → độ trễ tạo <b>lãi/lỗ hàng tồn kho</b> cho nhà phân phối (PLX, OIL).',
    `<b>Nghị định thay thế đang trình</b>: Văn bản 10747/VPCP-CN (21/10/2026) yêu cầu Bộ Công Thương trình Chính phủ trước 10/11/2026 (${A(U.nd, 'LSVN 22/10/2026')}).`,
    'Hướng thay đổi của dự thảo: giảm số thương nhân đầu mối, cắt khâu trung gian, điều hành giá theo thị trường có công cụ bình ổn.',
    'Thông tư 68/2026/TT-BCT (30/10/2026) quy định hao hụt xăng dầu tối đa, hiệu lực 01/01/2027, thay Thông tư 43/2015.']},
  tax: {t: 'Thuế xăng dầu · NQ 19/2026/QH16 · NQ 43/2026/NQ-CP · NQ 45/2026/NQ-CP · NĐ 72/2026', l: [
    'Thuế bảo vệ môi trường xăng dầu <b>0 đồng/lít</b> và không phải nộp thuế GTGT từ 16/4/2026, kéo dài tới <b>31/12/2026</b>.',
    'Thuế tiêu thụ đặc biệt xăng 0%: 16/4–30/6/2026, rồi 01/11/2026–31/3/2027.',
    'Thuế nhập khẩu ưu đãi theo NĐ 72/2026 từ 9/3/2026 đến 31/12/2026.',
    'Mốc cần theo dõi: <b>31/12/2026</b> hết giảm thuế BVMT và GTGT — nếu không gia hạn, giá bán lẻ có thể tăng ở kỳ điều hành đầu 2027.']},
  e10: {t: 'Xăng sinh học E10 · Thông tư 50/2025/TT-BCT', l: [
    'Xăng <b>E10 bắt buộc toàn quốc từ 01/06/2026</b>; xăng E5 RON92 được bán song song đến 31/12/2030.',
    'Khâu chịu tác động: pha chế và phân phối (PLX, OIL) cần bồn và hệ thống pha ethanol; lọc dầu (BSR) cung xăng nền.',
    'Giá bán lẻ E10 RON95-III theo từng kỳ ở sub-tab 02 (chart giá bán lẻ xăng dầu).']},
  plan: {t: 'Quy hoạch điện VIII điều chỉnh · QĐ 768/QĐ-TTg ngày 15/4/2025', l: [
    `Đến 2030: nhiệt điện <b>LNG 22.524 MW</b> (9,5–12,3% tổng công suất); nhiệt điện khí trong nước <b>10.861–14.930 MW</b> (${A(U.qh8, 'Tạp chí Công Thương')}).`,
    'Nghĩa là nhu cầu LNG nhập khẩu và khí trong nước cho phát điện tăng mạnh tới 2030 — kênh chính tới <b>GAS</b> (kinh doanh khí, kho LNG).',
    'Dự án điện khí, LNG cần thời gian và vốn lớn; tiến độ thực tế quyết định sản lượng khí bán ra, không phải con số quy hoạch.',
    'Số liệu khí vào bờ, LNG nhập khẩu và giá LNG châu Á ở Bức tranh ngành › 03 Khí & LNG.']},
  docs: {t: 'Văn bản mới duyệt trong 12 tháng gần nhất', l: [
    'Mốc lớn nhất: <b>23/08/2026</b> Quốc hội thông qua Luật Dầu khí 10/2026/QH16 (hiệu lực 01/03/2027).',
    'Đang chờ: nghị định kinh doanh xăng dầu thay NĐ 83/2014 (hạn trình 10/11/2026), nghị định hướng dẫn Luật Dầu khí.',
    'Hết hạn sắp tới: giảm thuế BVMT và GTGT xăng dầu hết 31/12/2026; thuế TTĐB xăng 0% hết 31/3/2027.']},
};
const RECENT = [
  ['30/10/2026', 'Thông tư 68/2026/TT-BCT', 'Hao hụt xăng dầu tối đa; hiệu lực 01/01/2027, thay TT 43/2015', 'price'],
  ['21/10/2026', 'Văn bản 10747/VPCP-CN', 'Yêu cầu trình nghị định kinh doanh xăng dầu thay NĐ 83/2014 trước 10/11/2026 (dự thảo)', 'price'],
  ['01/11/2026', 'NQ 45/2026/NQ-CP', 'Thuế TTĐB xăng 0% từ 01/11/2026 đến 31/3/2027', 'tax'],
  ['23/08/2026', 'Luật Dầu khí 10/2026/QH16', 'Quốc hội thông qua (473/475); hiệu lực 01/03/2027', 'law'],
  ['01/06/2026', 'Thông tư 50/2025/TT-BCT', 'Xăng E10 bắt buộc toàn quốc', 'e10'],
  ['16/04/2026', 'NQ 19/2026/QH16 · NQ 43/2026/NQ-CP', 'Thuế BVMT 0 đồng, miễn nộp GTGT xăng dầu; kéo dài tới 31/12/2026', 'tax'],
  ['09/03/2026', 'NĐ 72/2026', 'Mức thuế nhập khẩu ưu đãi xăng dầu, nguyên liệu tới 31/12/2026', 'tax'],
];
const STAGES = [['Thăm dò, khai thác', [['Luật Dầu khí 2026', 'law']]], ['Dịch vụ kỹ thuật', [['Luật Dầu khí 2026', 'law']]],
  ['Khí & LNG', [['Quy hoạch điện VIII', 'plan'], ['Luật Dầu khí 2026', 'law']]], ['Lọc dầu', [['Thuế xăng dầu', 'tax'], ['Xăng E10', 'e10']]],
  ['Phân phối', [['Kinh doanh xăng dầu', 'price'], ['Thuế xăng dầu', 'tax'], ['Xăng E10', 'e10']]]];
const ST = {on: ['Đang hiệu lực', 're-st-on'], soon: ['Sắp hiệu lực', 're-st-soon'], amend: ['Đang thay thế', 're-st-amend'], wait: ['Chờ nghị định', 're-st-wait'], temp: ['Có thời hạn', 're-st-soon']};
const LAWS = [
  ['Luật Dầu khí 2026', '10/2026/QH16', '01/03/2027', 'Phân cấp cho Petrovietnam; nâng trần thu hồi chi phí mỏ cận biên; thêm CO₂ và năng lượng ngoài khơi', 'Thượng nguồn · Dịch vụ', 'wait', 'law', 'PVD, PVS trước; GAS sau'],
  ['Kinh doanh xăng dầu', 'NĐ 83/2014/NĐ-CP và sửa đổi', 'Đang áp dụng', 'Điều hành giá theo kỳ, thương nhân đầu mối, Quỹ bình ổn; nghị định thay thế đang trình', 'Phân phối', 'amend', 'price', 'PLX, OIL'],
  ['Thuế xăng dầu', 'NQ 19/2026/QH16 · NQ 43, 45/2026/NQ-CP', '16/4/2026 – 31/3/2027', 'Thuế BVMT 0 đồng, miễn GTGT, TTĐB xăng 0% có thời hạn', 'Lọc dầu · Phân phối', 'temp', 'tax', 'PLX, OIL, BSR'],
  ['Xăng sinh học E10', 'TT 50/2025/TT-BCT', '01/06/2026', 'E10 bắt buộc; E5 RON92 bán song song đến 31/12/2030', 'Lọc dầu · Phân phối', 'on', 'e10', 'PLX, OIL, BSR'],
  ['Quy hoạch điện VIII điều chỉnh', 'QĐ 768/QĐ-TTg', '15/4/2025', 'Nhiệt điện LNG 22.524 MW, khí trong nước 10.861–14.930 MW đến 2030', 'Khí & LNG', 'on', 'plan', 'GAS'],
];
function go(k) { $('#research-tab-mt4')?.click(); setTimeout(() => { $(`#of-mt4-${k}-tab`)?.click(); $('#pane-mt4')?.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 60); }
const link = (t, k) => `<a href="#mt4" class="re-lg-go" data-go="${k}">${t}</a>`;

function summaries() {
  Object.entries(SUM).forEach(([k, s]) => { const body = $(`#of-mt4-${k} .of-body`); if (!body || body.querySelector('.re-sum')) return;
    body.querySelectorAll(':scope > .of-gap').forEach(g => { if (/Chưa có dữ liệu/.test(g.textContent)) g.remove(); });
    body.prepend(el('div', 'card re-sum of-wide', `<div class="re-sum-k">Tóm tắt</div><h3>${s.t}</h3><ul>${s.l.map(x => `<li>${x}</li>`).join('')}</ul>`)); });
}
function recent() {
  const body = $('#of-mt4-docs .of-body'); if (!body || body.querySelector('.re-recent')) return;
  body.append(el('div', 'card of-wide re-recent', `<h3>Mới duyệt, mới hiệu lực và đang trình — 12 tháng gần nhất</h3><div class="tablewrap"><table><thead><tr><th>Ngày</th><th>Văn bản</th><th>Điểm chính</th><th>Chi tiết</th></tr></thead><tbody>${RECENT.map(([d, v, n, k]) =>
    `<tr><td>${d}</td><td><b>${v}</b></td><td>${n}</td><td>${link('Xem sub-tab →', k)}</td></tr>`).join('')}</tbody></table></div><p class="note">Nguồn từng văn bản ở sub-tab chi tiết. Văn bản 10747/VPCP-CN và nghị định thay thế NĐ 83/2014 là dự thảo, chưa ban hành.</p>`));
}
function overview() {
  const host = $('#of-mt1-map .of-body'); if (!host || host.querySelector('.re-legal-map')) return;
  host.append(el('div', 'card of-wide re-legal-map', `<h3>Khung pháp lý chính</h3><p class="chart-sub">Văn bản nào quy định khâu nào của chuỗi giá trị · bấm tên văn bản để xem chi tiết ở tab Chính sách</p>
    <div class="re-lg-chain" style="grid-template-columns:repeat(${STAGES.length},minmax(0,1fr))">${STAGES.map(([s, ls], i) => `<div class="re-lg-st"><b>${i + 1}. ${s}</b>${ls.map(([t, k]) => link(t, k)).join('')}</div>`).join('')}</div>
    <div class="tablewrap"><table><thead><tr><th>Văn bản</th><th>Số hiệu</th><th>Hiệu lực</th><th>Quy định gì</th><th>Khâu</th><th>Mã liên quan</th><th>Trạng thái</th></tr></thead><tbody>${LAWS.map(([n, so, eff, what, stage, st, k, who]) =>
      `<tr><td>${link(`<b>${n}</b>`, k)}</td><td>${so}</td><td>${eff}</td><td>${what}</td><td>${stage}</td><td>${who}</td><td><span class="re-st ${ST[st][1]}">${ST[st][0]}</span></td></tr>`).join('')}</tbody></table></div>`));
}
function style() {
  if ($('#re-legal-style')) return; const st = el('style'); st.id = 're-legal-style';
  st.textContent = `.re-sum{border-left:4px solid #2938A8;background:#F6F8FE}.re-sum-k{font:700 11px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#2938A8;margin-bottom:4px}.re-sum h3{margin:0 0 8px}.re-sum ul{margin:0;padding-left:18px}.re-sum li{margin:3px 0;font-size:14px;line-height:1.55}
.re-lg-chain{display:grid;gap:8px;margin:12px 0 14px}.re-lg-st{display:flex;flex-direction:column;gap:5px;padding:10px;border:1px solid #E4E7EE;border-radius:10px;background:#FAFBFE}
.re-lg-st b{font:700 12.5px Inter,sans-serif;color:#1F2A5C}.re-lg-st a{display:inline-block;padding:3px 8px;border-radius:999px;background:#EEF1FB;color:#2938A8;font:600 12px Inter,sans-serif;text-decoration:none}.re-lg-st a:hover{background:#2938A8;color:#fff}
.re-st{display:inline-block;padding:2px 8px;border-radius:999px;font:600 11.5px Inter,sans-serif;white-space:nowrap}.re-st-on{background:#E3F5F0;color:#1d8a73}.re-st-soon{background:#E8EEFB;color:#2938A8}.re-st-amend{background:#FFF5D4;color:#8a6a00}.re-st-wait{background:#FDECEA;color:#b8432c}
.re-recent h3,.re-legal-map h3{margin:0 0 8px}@media(max-width:900px){.re-lg-chain{grid-template-columns:repeat(2,1fr)!important}}`;
  document.head.append(st);
}
/* ---------- Chart cho sub-tab 04 E10 và 05 Quy hoạch điện VIII (27/11/2026) ---------- */
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const vnd = s => s.split('-').reverse().join('/');
function chartCard(id, title, sub, src, h = 320) {
  const c = el('div', 'card ol-card'); c.dataset.blockId = id; c.dataset.updateKind = 'public'; c.dataset.refreshStatus = 'loaded';
  c.innerHTML = `<div class="chart-title">${title}</div><div class="chart-sub">${sub}</div><div style="position:relative;height:${h}px;margin-top:8px"><canvas role="img" aria-label="${title}"></canvas></div><div class="pw-src">Nguồn: ${src}</div>`;
  return c;
}
const LEG = {position: 'bottom', labels: {usePointStyle: true, boxWidth: 8, color: '#3B4256', font: {size: 12}}};
const AX = (cb, o = {}) => Object.assign({grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', font: {size: 11.5}, callback: cb}}, o);
const XA = {grid: {display: false}, ticks: {color: '#6B7392', font: {size: 11.5}, maxRotation: 0, autoSkip: true, maxTicksLimit: 10}};
// E10: giá bán lẻ từng kỳ (Petrolimex Vùng 1) — E10 RON95-III, E5 RON92-II và chênh lệch.
function e10Chart() {
  const R = window.SECTOR_DAILY?.sources?.retail_fuel?.records?.filter(r => fin(r.e5) && fin(r.ron95)); if (!R?.length || !window.Chart) return null;
  const c = chartCard('dau-khi-e10', 'Giá bán lẻ xăng E10 RON95-III và E5 RON92 theo kỳ điều hành',
    `đồng/lít, Vùng 1 · ${R.length} kỳ từ ${vnd(R[0].date)} (sau mốc E10 bắt buộc 01/06/2026) · cột: E10 đắt hơn E5 bao nhiêu`,
    `<a href="https://home.petrolimex.com.vn/ndi/thong-cao-bao-chi.html" target="_blank" rel="noopener">Petrolimex · thông cáo điều chỉnh giá</a>`, 340);
  new Chart(c.querySelector('canvas'), {data: {labels: R.map(r => vnd(r.date).slice(0, 5)), datasets: [
      {type: 'line', label: 'E10 RON95-III', data: R.map(r => r.ron95), borderColor: '#2938A8', backgroundColor: '#2938A8', borderWidth: 2.5, pointRadius: 2, tension: .2, yAxisID: 'y'},
      {type: 'line', label: 'E5 RON92-II', data: R.map(r => r.e5), borderColor: '#c29100', backgroundColor: '#c29100', borderWidth: 2.5, pointRadius: 2, tension: .2, yAxisID: 'y'},
      {type: 'bar', label: 'Chênh lệch E10 − E5', data: R.map(r => r.ron95 - r.e5), backgroundColor: 'rgba(89,197,200,.45)', borderRadius: 3, yAxisID: 'y2'}]},
    options: {responsive: true, maintainAspectRatio: false, animation: false, interaction: {mode: 'index', intersect: false}, plugins: {legend: LEG, tooltip: {callbacks: {label: x => ` ${x.dataset.label}: ${nf(x.parsed.y)} đ/lít`}}},
      scales: {x: XA, y: AX(v => nf(v), {title: {display: true, text: 'Giá bán lẻ (đ/lít)', color: '#6B7392'}}), y2: AX(v => nf(v), {position: 'right', beginAtZero: true, grid: {display: false}, title: {display: true, text: 'Chênh lệch (đ/lít)', color: '#6B7392'}})}}});
  return c;
}
// Quy hoạch điện VIII: điện khí thực tế theo tháng (EVN/NSMO) và mục tiêu công suất 2030.
function gasPowerChart() {
  const R = window.SECTOR_DAILY?.sources?.vn_power_daily?.records; if (!R?.length || !window.Chart) return null;
  const M = {}; R.forEach(r => { if (!fin(r.gas) || !fin(r.output_mkwh)) return; const k = r.date.slice(0, 7); (M[k] ||= {g: 0, t: 0, n: 0}); M[k].g += r.gas; M[k].t += r.output_mkwh; M[k].n++; });
  const now = new Date().toISOString().slice(0, 7), K = Object.keys(M).sort().filter(k => M[k].n >= 20 || k === now);  // bỏ tháng thiếu nhiều ngày, trừ tháng hiện tại
  const c = chartCard('dau-khi-gaspower', 'Điện khí thực tế: sản lượng theo tháng và tỷ trọng trong tổng sản lượng',
    'triệu kWh (cột) · % tổng sản lượng (đường) · tổng hợp từ báo cáo vận hành hằng ngày; tháng hiện tại chưa đủ ngày',
    `<a href="https://www.evn.com.vn/vi-VN/news-l/Thong-tin-tom-tat-van-hanh-HTD-Quoc-gia-60-2015" target="_blank" rel="noopener">EVN / NSMO · thông tin vận hành hệ thống điện</a>; tự cộng theo tháng`, 320);
  new Chart(c.querySelector('canvas'), {data: {labels: K.map(k => k.slice(5) + '/' + k.slice(0, 4)), datasets: [
      {type: 'bar', label: 'Điện khí (triệu kWh)', data: K.map(k => Math.round(M[k].g)), backgroundColor: K.map(k => k === now ? 'rgba(41,56,168,.35)' : '#2938A8'), borderRadius: 3, yAxisID: 'y'},
      {type: 'line', label: 'Tỷ trọng (%)', data: K.map(k => M[k].g / M[k].t * 100), borderColor: '#c29100', backgroundColor: '#c29100', borderWidth: 2.5, pointRadius: 0, tension: .25, yAxisID: 'y2'}]},
    options: {responsive: true, maintainAspectRatio: false, animation: false, interaction: {mode: 'index', intersect: false},
      plugins: {legend: LEG, tooltip: {callbacks: {label: x => x.dataset.yAxisID === 'y2' ? ` Tỷ trọng: ${nf(x.parsed.y, 1)}%` : ` Điện khí: ${nf(x.parsed.y)} triệu kWh`}}},
      scales: {x: XA, y: AX(v => nf(v), {beginAtZero: true}), y2: AX(v => nf(v) + '%', {position: 'right', beginAtZero: true, grid: {display: false}})}}});
  return c;
}
function qh8Chart() {
  if (!window.Chart) return null;
  // 27/11/2026: thêm công suất đang vận hành. LNG: Nhơn Trạch 3 & 4 (1.624 MW, vận hành thương mại 05/01/2026) là nhà máy LNG duy nhất.
  // Khí trong nước: EVN/Bộ Công Thương không công bố tách riêng — chỉ ghi phần còn lại của cơ cấu EVN cuối 2025 (tự tính), không vẽ cột.
  const LNG_NOW = 1624, LNG_T = 22524;
  const c = chartCard('dau-khi-qh8', `Điện LNG: đang vận hành ${nf(LNG_NOW)} MW, mới bằng ${nf(LNG_NOW / LNG_T * 100, 1)}% mục tiêu 2030`,
    'MW · cột đậm: đang vận hành (đầu 2026) · cột nhạt: mục tiêu 2030 theo QĐ 768/QĐ-TTg; khí trong nước là khoảng 10.861–14.930 MW',
    `${A('https://vietnamnews.vn/economy/1731874/viet-nam-inaugurates-1-4-billion-lng-power-plants-in-energy-security-push.html', 'Viet Nam News 14/12/2025')} (1.624 MW), ${A('https://vneconomy.vn/nha-may-dien-lng-dau-tien-van-hanh-thuong-mai-mo-duong-cho-chuyen-dich-nang-luong.htm', 'VnEconomy 07/01/2026')} (vận hành thương mại 05/01/2026), ${A('https://tapchicongthuong.vn/thu-tuong-phe-duyet-dieu-chinh-quy-hoach-dien-viii-139491.htm', 'QĐ 768/QĐ-TTg')}`, 230);
  new Chart(c.querySelector('canvas'), {type: 'bar', data: {labels: ['Nhiệt điện LNG', 'Nhiệt điện khí trong nước'], datasets: [
      {label: 'Đang vận hành', data: [LNG_NOW, null], backgroundColor: '#2938A8', borderRadius: 4},
      {label: 'Mục tiêu 2030 (mức thấp)', data: [LNG_T, 10861], backgroundColor: 'rgba(41,56,168,.3)', borderRadius: 4, stack: 't'},
      {label: 'Mục tiêu 2030 (biên trên thêm)', data: [0, 14930 - 10861], backgroundColor: 'rgba(41,56,168,.14)', borderRadius: 4, stack: 't'}]},
    options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend: LEG, tooltip: {callbacks: {label: x => x.datasetIndex === 2 ? ` Biên trên: ${nf(14930)} MW` : ` ${x.dataset.label}: ${nf(x.parsed.x)} MW`}}},
      scales: {x: AX(v => nf(v), {beginAtZero: true}), y: {grid: {display: false}, ticks: {color: '#3B4256', font: {size: 12.5}}}}}});
  c.querySelector('.pw-src').insertAdjacentHTML('beforebegin', `<p class="note" style="margin:8px 0 0">Công suất nhiệt điện khí trong nước đang vận hành chưa có số chính thức tách riêng. EVN công bố cuối 2025 tổng công suất ~87.600 MW, trong đó than 28.100, thủy điện 24.640, tái tạo 24.453 MW → phần còn lại <b>~10.400 MW</b> gồm điện khí, dầu và nguồn khác (tự tính, ${A('https://cafef.vn/evn-cong-bo-doanh-thu-nam-2025-dat-645195-ty-dong-tang-10-so-voi-nam-ngoai-188251229150234112.chn', 'CafeF 29/12/2025')}).</p>`);
  return c;
}
function charts() {
  const put = (k, ...cards) => { const body = $(`#of-mt4-${k} .of-body`), cs = cards.filter(Boolean); if (!body || !cs.length || body.querySelector('.ol-card')) return;
    const g = el('div', 'ol-grid of-wide'); cs.forEach(x => g.append(x)); if (cs.length === 1) g.style.gridTemplateColumns = '1fr';
    const s = body.querySelector(':scope > .re-sum'); s ? s.after(g) : body.prepend(g); };
  put('e10', e10Chart());
  put('plan', gasPowerChart(), qh8Chart());
  if (!$('#ol-chart-style')) { const st = el('style'); st.id = 'ol-chart-style'; st.textContent = '.ol-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px}@media(max-width:900px){.ol-grid{grid-template-columns:1fr}}'; document.head.append(st); }
}
function run() {
  if (!$('#of-mt4-law') || run.done) return; run.done = true;
  style(); summaries(); recent(); overview(); charts();
  document.addEventListener('click', e => { const a = e.target.closest('.re-lg-go'); if (!a) return; e.preventDefault(); go(a.dataset.go); });
}
window.addEventListener('oil:frame', run);
if ($('#of-mt4-law')) run();
})();
