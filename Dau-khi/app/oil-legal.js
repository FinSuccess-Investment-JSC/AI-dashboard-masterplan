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
function run() {
  if (!$('#of-mt4-law') || run.done) return; run.done = true;
  style(); summaries(); recent(); overview();
  document.addEventListener('click', e => { const a = e.target.closest('.re-lg-go'); if (!a) return; e.preventDefault(); go(a.dataset.go); });
}
window.addEventListener('oil:frame', run);
if ($('#of-mt4-law')) run();
})();
