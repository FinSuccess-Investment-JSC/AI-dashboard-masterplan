/* BĐS dân cư · Pháp lý theo văn bản (27/11/2026, người dùng chốt flow "ngành nhiều luật"):
   - Tổng quan ngành › 00 Bản đồ ngành: dưới chuỗi giá trị có mục "Khung pháp lý chính" (luật gắn lên từng khâu + bảng văn bản, trạng thái).
   - Tab Chính sách: mỗi sub-tab là một văn bản lớn, mở đầu bằng tóm tắt 3–5 dòng rồi mới tới chi tiết; sub-tab cuối "Mới duyệt gần đây".
   Không thêm số mới: mọi số lấy từ các thẻ đã có nguồn trên trang (bds-19, 20, 21, 37, 39, chuyên đề Luật mới); dòng bảng được DỜI (giữ link gốc).
   Chạy sau re-frame.js (sự kiện 're:frame'). */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const block = id => $(`[data-block-id="${id}"]`);

// Tóm tắt đầu mỗi sub-tab (3–5 dòng). Nguồn: các thẻ cùng sub-tab.
const SUM = {
  land: {t: 'Luật Đất đai 2024 · 31/2024/QH15 · hiệu lực 01/08/2024', l: [
    '<b>Bỏ khung giá đất</b>: bảng giá theo nguyên tắc thị trường, ban hành <b>hằng năm</b> từ 01/01/2026 (Luật 146/2025) — tiền sử dụng đất của dự án tăng theo.',
    'Bảng giá 2026: Hà Nội tăng 2–26%; TP.HCM mở rộng tăng 1,0–1,65 lần (địa bàn cũ), tới <b>&gt;8 lần</b> ở Bình Dương cũ.',
    'Gỡ vướng thu hồi: đã thỏa thuận <b>&gt;75%</b> diện tích và số người thì Nhà nước thu hồi phần còn lại (NQ 254/2025, từ 01/01/2026).',
    'Chuyển đất nông nghiệp lên đất ở: nộp 30% chênh lệch trong hạn mức, 50% phần vượt (NĐ 291/2025).',
    'Đã có bản <b>sửa đổi</b> thông qua 21/11/2026, hiệu lực 01/07/2027 — xem sub-tab 05.']},
  housing: {t: 'Luật Nhà ở 2023 · 27/2023/QH15 · hiệu lực 01/08/2024, và cơ chế nhà ở xã hội', l: [
    'Khung cho nhà ở xã hội (NOXH), nhà ở nhiều tầng nhiều căn, nhà lưu trú công nhân.',
    'NQ 201/2025 rút <b>≥350 ngày</b> thủ tục NOXH; Quỹ nhà ở quốc gia hai cấp (NĐ 302/2025).',
    'NOXH 2025 hoàn thành 102.633 căn (vượt kế hoạch 100.275); 2026 dự kiến 87.601 căn, đạt 90% kế hoạch.',
    'Vốn NOXH được ưu tiên: dư nợ tăng thêm không tính vào giới hạn tín dụng BĐS (sub-tab 06).']},
  kdbds: {t: 'Luật Kinh doanh BĐS 2023 · 29/2023/QH15 · hiệu lực 01/08/2024', l: [
    'Siết <b>đặt cọc</b>, buộc <b>công khai thông tin dự án</b> trước khi bán; điều kiện với sàn giao dịch và môi giới.',
    'Tác động chính lên khâu <b>mở bán và thu tiền</b>: dòng tiền đặt cọc sớm của chủ đầu tư bị chặn tới khi dự án đủ điều kiện.',
    'Bản sửa đổi (thông qua 21/11/2026, hiệu lực 01/07/2027): đặt cọc ≤5%, đợt đầu ≤30%; vốn chủ sở hữu tối thiểu 20%/15% — xem sub-tab 05.']},
  nq171: {t: 'NQ 171/2024/QH15 · NĐ 75/2025 · thí điểm 01/04/2025 – 31/03/2030', l: [
    'Cho làm <b>nhà ở thương mại trên đất không phải đất ở</b> qua thỏa thuận quyền sử dụng đất — mở thêm nguồn quỹ đất cho chủ đầu tư.',
    'TP.HCM đợt 1 duyệt <b>54/74 khu đất, 1.079,62 ha</b>; cần theo dõi đợt 2 và số dự án được chấp thuận chủ trương.',
    'Có thời hạn: hết 31/03/2030, dự án chưa xong thủ tục trước hạn không còn cơ chế này.']},
  law: {t: 'Bộ ba luật sửa đổi · Quốc hội thông qua 21/11/2026 · hiệu lực 01/07/2027', l: [
    'Luật Đất đai, Luật Nhà ở, Luật Kinh doanh BĐS sửa đổi cùng lúc, hiệu lực cùng ngày 01/07/2027; giá đất theo luật mới từ 01/01/2028.',
    'Nhanh hơn ở <b>3 bước</b> (có đất, pháp lý, tiền đất), đắt hơn ở 2 chỗ (bồi thường, chậm tiến độ), chặt hơn ở khâu thu tiền khách.',
    'Theo dự án thật của 11 mã: hưởng lợi KDH, VHM, NLG, DXG; hai chiều NVL, DIG, PDR, AGG, CEO; nghiêng thiệt NTL.',
    'Còn <b>5 ẩn số</b> chờ nghị định hướng dẫn (cuối sub-tab).']},
  credit: {t: 'Tín dụng và trái phiếu BĐS · chỉ đạo NHNN, NĐ 65/2022, NĐ 08/2023', l: [
    'CV 11686/NHNN (31/12/2025): tín dụng BĐS mỗi ngân hàng <b>không vượt tốc độ tăng chung</b>; mục tiêu tín dụng 2026 ~15%.',
    'NOXH được nới: dư nợ tăng thêm không tính vào room; gói 145.000 tỷ mới giải ngân ~12.440 tỷ (8,5%) tới 5/2026.',
    'Trái phiếu: NĐ 65/2022 siết phát hành, NĐ 08/2023 cho gia hạn; phát hành BĐS đã hồi lại từ 2023.',
    'Doanh nghiệp đòn bẩy cao chịu tác động trước: nợ vay/VCSH cao nhất là NVL, PDR (Tài chính ngành › So sánh doanh nghiệp).']},
  docs: {t: 'Văn bản mới duyệt trong 12 tháng gần nhất', l: [
    'Mốc lớn nhất: <b>21/11/2026</b> Quốc hội thông qua bộ ba luật sửa đổi (hiệu lực 01/07/2027).',
    'Từ 01/01/2026: bảng giá đất hằng năm, thu hồi khi thỏa thuận &gt;75%, tiền SDĐ khi chuyển mục đích 30%/50%.',
    'Đang chờ: Luật Thuế sử dụng đất phi nông nghiệp (sửa đổi), nghị định hướng dẫn bộ luật mới, bảng giá đất 2027.']},
};
// Sub-tab Mới duyệt: các mốc trong 12 tháng (ngày, văn bản, điểm chính, sub-tab chi tiết).
const RECENT = [
  ['21/11/2026', 'Luật Đất đai, Luật Nhà ở, Luật KD BĐS (sửa đổi)', 'Quốc hội thông qua; hiệu lực 01/07/2027', 'law'],
  ['15/11/2026', 'Thông báo 586/TB-VPCP', 'Kết luận về tiếp thu, giải trình dự thảo Luật KD BĐS, Luật Nhà ở (sửa đổi)', 'law'],
  ['23/10/2026', 'Luật Thuế SDĐ phi nông nghiệp (sửa đổi)', 'Vào chương trình kỳ họp thứ 2; hướng tới Luật Thuế BĐS — chưa thông qua', 'credit'],
  ['2026', 'Công điện 08/CĐ-BXD', 'Giao địa phương 158.700 căn NOXH (mục tiêu 2026: 110.000 căn)', 'housing'],
  ['01/01/2026', 'Luật 146/2025/QH15 · NQ 254/2025/QH15', 'Bảng giá đất hằng năm; thu hồi phần còn lại khi đã thỏa thuận >75%', 'land'],
  ['31/12/2025', 'CV 11686/NHNN-CSTT', 'Tín dụng BĐS mỗi ngân hàng không vượt tốc độ tăng chung', 'credit'],
  ['19/11/2025', 'NĐ 302/2025/NĐ-CP', 'Quỹ nhà ở quốc gia hai cấp', 'housing'],
  ['06/11/2025', 'NĐ 291/2025/NĐ-CP', 'Tiền SDĐ khi chuyển mục đích: 30% / 50% chênh lệch từ 01/01/2026', 'land'],
];
// Tổng quan: luật gắn lên từng khâu chuỗi giá trị, và bảng văn bản chính.
const STAGES = [['Quỹ đất', [['Luật Đất đai', 'land'], ['NQ 171', 'nq171']]], ['Pháp lý dự án', [['Luật Đất đai', 'land'], ['Luật sửa đổi 2026', 'law']]],
  ['Vốn', [['Tín dụng & trái phiếu', 'credit']]], ['Xây dựng, sản phẩm', [['Luật Nhà ở · NOXH', 'housing']]],
  ['Mở bán, thu tiền', [['Luật KD BĐS', 'kdbds'], ['Luật sửa đổi 2026', 'law']]], ['Bàn giao', [['Luật KD BĐS', 'kdbds']]]];
const ST = {on: ['Đang hiệu lực', 're-st-on'], soon: ['Sắp hiệu lực', 're-st-soon'], amend: ['Đang sửa đổi', 're-st-amend'], wait: ['Chờ nghị định', 're-st-wait'], pilot: ['Thí điểm có thời hạn', 're-st-soon']};
const LAWS = [
  ['Luật Đất đai 2024', '31/2024/QH15', '01/08/2024', 'Bỏ khung giá đất, bảng giá hằng năm; thu hồi khi thỏa thuận >75%', 'Quỹ đất · Pháp lý', 'amend', 'land', 'Mọi chủ đầu tư; quỹ đất lớn ở vùng giá đất tăng mạnh'],
  ['Luật Nhà ở 2023 · NQ 201/2025', '27/2023/QH15', '01/08/2024', 'Khung nhà ở xã hội, nhà lưu trú công nhân; rút ≥350 ngày thủ tục NOXH', 'Sản phẩm', 'amend', 'housing', 'Chủ đầu tư có dự án NOXH'],
  ['Luật Kinh doanh BĐS 2023', '29/2023/QH15', '01/08/2024', 'Siết đặt cọc, công khai thông tin dự án, điều kiện sàn và môi giới', 'Mở bán · Thu tiền', 'amend', 'kdbds', 'Mọi chủ đầu tư bán nhà hình thành trong tương lai'],
  ['NQ 171/2024 thí điểm', '171/2024/QH15', '01/04/2025 – 31/03/2030', 'Nhà ở thương mại trên đất không phải đất ở qua thỏa thuận QSDĐ', 'Quỹ đất', 'pilot', 'nq171', 'TP.HCM đợt 1: 54/74 khu đất'],
  ['Bộ ba luật sửa đổi', 'Thông qua 21/11/2026', '01/07/2027', 'Nhanh hơn ở có đất, pháp lý, tiền đất; đặt cọc ≤5%, đợt đầu ≤30%', 'Cả vòng đời dự án', 'wait', 'law', 'Lợi: KDH, VHM, NLG, DXG · Thiệt: NTL'],
  ['Tín dụng & trái phiếu BĐS', 'CV 11686/NHNN · NĐ 65/2022 · NĐ 08/2023', '31/12/2025', 'Room tín dụng BĐS không vượt tăng chung; NOXH ngoài room', 'Vốn', 'on', 'credit', 'Đòn bẩy cao: NVL, PDR'],
];
function go(k) { $('#research-tab-mt4')?.click(); setTimeout(() => { $(`#of-mt4-${k}-tab`)?.click(); $('#pane-mt4')?.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 60); }
const link = (t, k) => `<a href="#mt4" class="re-lg-go" data-go="${k}">${t}</a>`;

function summaries() {
  Object.entries(SUM).forEach(([k, s]) => { const body = $(`#of-mt4-${k} .of-body`); if (!body || body.querySelector('.re-sum')) return;
    body.querySelectorAll(':scope > .of-gap').forEach(g => { if (/Chưa có dữ liệu/.test(g.textContent)) g.remove(); });
    body.prepend(el('div', 'card re-sum of-wide', `<div class="re-sum-k">Tóm tắt</div><h3>${s.t}</h3><ul>${s.l.map(x => `<li>${x}</li>`).join('')}</ul>`)); });
}
// Tách bảng bds-20 (gộp nhiều văn bản) thành bảng theo từng văn bản; dòng được dời nguyên (giữ link gốc).
function splitHousing() {
  const src = block('bds-20'), tb = src?.querySelector('table'); if (!tb || src.dataset.split) return; src.dataset.split = '1';
  const head = tb.querySelector('thead')?.outerHTML || '', rows = [...tb.querySelectorAll('tbody tr')];
  const card = (k, title, rs) => { const body = $(`#of-mt4-${k} .of-body`); if (!body || !rs.length) return;
    const c = el('div', 'card of-wide re-lg-card', `<h3>${title}</h3><div class="tablewrap"><table>${head}<tbody></tbody></table></div>`); rs.forEach(r => c.querySelector('tbody').append(r)); body.append(c); };
  const has = s => r => r.textContent.includes(s);
  const r0 = rows.find(has('27/2023')), rNQ171 = rows.filter(has('171/2024')), rNOXH = rows.filter(r => /201\/2025|08\/CĐ/.test(r.textContent)), rAmend = rows.filter(has('sửa đổi'));
  card('housing', 'Văn bản và mốc của Luật Nhà ở, nhà ở xã hội', [r0 && r0.cloneNode(true), ...rNOXH].filter(Boolean));
  card('kdbds', 'Văn bản và mốc của Luật Kinh doanh BĐS', [r0, ...rAmend].filter(Boolean));
  card('nq171', 'Văn bản thí điểm', rNQ171);
  // Dòng NQ 171 ở bảng dự án theo dõi (bds-39) cũng chép sang đây.
  const p = block('bds-39')?.querySelector('table'); if (p) { const rs = [...p.querySelectorAll('tbody tr')].filter(has('NQ 171')); if (rs.length) { const body = $('#of-mt4-nq171 .of-body');
    const c = el('div', 'card of-wide re-lg-card', `<h3>Tiến độ thí điểm</h3><div class="tablewrap"><table>${p.querySelector('thead')?.outerHTML || ''}<tbody></tbody></table></div>`); rs.forEach(r => c.querySelector('tbody').append(r.cloneNode(true))); body?.append(c); } }
  if (!tb.querySelector('tbody tr')) { src.hidden = true; src.classList.add('of-hidden-legacy'); }
}
function recent() {
  const body = $('#of-mt4-docs .of-body'); if (!body || body.querySelector('.re-recent')) return;
  const c = el('div', 'card of-wide re-recent', `<h3>Mới duyệt và mới có hiệu lực — 12 tháng gần nhất</h3><div class="tablewrap"><table><thead><tr><th>Ngày</th><th>Văn bản</th><th>Điểm chính</th><th>Chi tiết</th></tr></thead><tbody>${RECENT.map(([d, v, n, k]) =>
    `<tr><td>${d}</td><td><b>${v}</b></td><td>${n}</td><td>${link('Xem sub-tab →', k)}</td></tr>`).join('')}</tbody></table></div><p class="note">Nguồn từng văn bản ghi ở bảng đầy đủ bên dưới và ở sub-tab chi tiết.</p>`);
  const sum = body.querySelector('.re-sum'); (sum || body.firstChild) ? (sum ? sum.after(c) : body.prepend(c)) : body.append(c);
}
function overview() {
  const host = $('#of-mt1-map .of-body'); if (!host || host.querySelector('.re-legal-map')) return;
  // 27/11/2026 (cùng cách Dầu khí): bỏ lưới khâu riêng; nhãn văn bản có màu gắn thẳng lên sơ đồ chuỗi giá trị (linkChain).
  const c = el('div', 'card of-wide re-legal-map', `<h3>Khung pháp lý chính</h3><p class="chart-sub">Nhãn màu trên sơ đồ chuỗi giá trị phía trên khớp màu từng văn bản dưới đây · rê chuột để làm nổi khâu hoặc văn bản · bấm nhãn hoặc tên văn bản để xem chi tiết</p>
    <div class="tablewrap"><table class="lg-tbl"><thead><tr><th>Văn bản</th><th>Số hiệu</th><th>Hiệu lực</th><th>Quy định gì</th><th>Khâu</th><th>Cần chú ý</th><th>Trạng thái</th></tr></thead><tbody>${LAWS.map(([n, so, eff, what, stage, st, k, who]) =>
      `<tr data-law="${k}"><td>${link(`<b>${n}</b>`, k)}</td><td>${so}</td><td>${eff}</td><td>${what}</td><td>${stage}</td><td>${who}</td><td><span class="re-st ${ST[st][1]}">${ST[st][0]}</span></td></tr>`).join('')}</tbody></table></div>`);
  host.append(c);
  linkChain();
}
// Khâu trên sơ đồ (data-id của value-chain.js, trang BĐS) → văn bản quy định khâu đó.
const NODE_LAWS = {n0: ['land', 'nq171', 'law'], n1: ['land', 'law'], n2: ['credit'], n3: ['credit'], n4: ['kdbds', 'law'], n5: ['housing'], n6: ['housing'], n8: ['kdbds'], n9: ['kdbds', 'credit']};
const LAW_TAG = {land: {s: 'Đất đai', c: '#2938A8'}, housing: {s: 'Nhà ở · NOXH', c: '#1E9C82'}, kdbds: {s: 'KD BĐS', c: '#861C52'}, nq171: {s: 'NQ 171', c: '#D1583F'}, law: {s: 'Sửa đổi 2026', c: '#B8432C'}, credit: {s: 'Tín dụng · TP', c: '#B07D00'}};
const LAW_NAME = Object.fromEntries(LAWS.map(r => [r[6], r[0]]));
function linkChain(tries = 0) {
  const svg = $('#of-mt1-map svg.vc2'), tbl = $('.re-legal-map .lg-tbl');
  if (!svg || !tbl) { if (tries < 20) setTimeout(() => linkChain(tries + 1), 300); return; }
  if (svg.dataset.lg) return; svg.dataset.lg = '1';
  const NS = 'http://www.w3.org/2000/svg', rows = [...tbl.querySelectorAll('tr[data-law]')], card = svg.closest('.card');
  svg.querySelectorAll('.vc-node').forEach(n => { const ks = NODE_LAWS[n.dataset.id]; const r = n.querySelector('rect.card'); if (!ks || !r) return;
    let x = +r.getAttribute('x') + 12; const y = +r.getAttribute('y') + +r.getAttribute('height') - 9;
    ks.forEach(k => { const t = LAW_TAG[k], w = t.s.length * 6.2 + 14, g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'lg-badge'); g.dataset.law = k;
      g.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="18" rx="9" fill="${t.c}"/><text x="${x + w / 2}" y="${y + 12.5}" text-anchor="middle">${t.s}</text><title>${LAW_NAME[k]}</title>`;
      n.append(g); x += w + 5; }); });
  rows.forEach(r => { const t = LAW_TAG[r.dataset.law], td = r.querySelector('td'); if (t && td && !td.querySelector('.lg-tag')) td.insertAdjacentHTML('afterbegin', `<span class="lg-tag" style="background:${t.c}" data-t="${t.s}" aria-hidden="true"></span>`); });
  if (card && !card.querySelector('.lg-legend')) svg.insertAdjacentHTML('beforebegin', `<div class="lg-legend"><span>Văn bản pháp lý:</span>${LAWS.map(r => `<a href="#mt4" class="re-lg-go" data-go="${r[6]}"><i style="background:${LAW_TAG[r[6]].c}"></i>${r[0]}</a>`).join('')}</div>`);
  const clear = () => { svg.classList.remove('lg-focus'); tbl.classList.remove('lg-focus'); svg.querySelectorAll('.lg-on').forEach(x => x.classList.remove('lg-on')); rows.forEach(r => r.classList.remove('lg-on')); };
  const showLaw = k => { clear(); svg.classList.add('lg-focus'); tbl.classList.add('lg-focus');
    svg.querySelectorAll('.vc-node').forEach(n => n.classList.toggle('lg-on', (NODE_LAWS[n.dataset.id] || []).includes(k))); rows.forEach(r => r.classList.toggle('lg-on', r.dataset.law === k)); };
  const showNode = id => { const ks = NODE_LAWS[id]; if (!ks) return; clear(); tbl.classList.add('lg-focus'); rows.forEach(r => r.classList.toggle('lg-on', ks.includes(r.dataset.law))); };
  rows.forEach(r => { r.addEventListener('mouseenter', () => showLaw(r.dataset.law)); r.addEventListener('mouseleave', clear); });
  svg.querySelectorAll('.vc-node').forEach(n => { n.addEventListener('mouseenter', () => showNode(n.dataset.id)); n.addEventListener('mouseleave', clear); });
  svg.querySelectorAll('.lg-badge').forEach(b => { b.addEventListener('click', e => { e.stopPropagation(); go(b.dataset.law); });
    b.addEventListener('mouseenter', e => { e.stopPropagation(); showLaw(b.dataset.law); }); b.addEventListener('mouseleave', clear); });
  card?.querySelectorAll('.lg-legend a').forEach(a => { a.addEventListener('mouseenter', () => showLaw(a.dataset.go)); a.addEventListener('mouseleave', clear); });
}
function style() {
  if ($('#re-legal-style')) return; const st = el('style'); st.id = 're-legal-style';
  st.textContent = `.re-sum{border-left:4px solid #2938A8;background:#F6F8FE}.re-sum-k{font:700 11px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#2938A8;margin-bottom:4px}.re-sum h3{margin:0 0 8px}.re-sum ul{margin:0;padding-left:18px}.re-sum li{margin:3px 0;font-size:14px;line-height:1.55}
.re-lg-chain{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0 14px}.re-lg-st{display:flex;flex-direction:column;gap:5px;padding:10px;border:1px solid #E4E7EE;border-radius:10px;background:#FAFBFE;position:relative}
.re-lg-st b{font:700 12.5px Inter,sans-serif;color:#1F2A5C}.re-lg-st a{display:inline-block;padding:3px 8px;border-radius:999px;background:#EEF1FB;color:#2938A8;font:600 12px Inter,sans-serif;text-decoration:none}.re-lg-st a:hover{background:#2938A8;color:#fff}
.re-st{display:inline-block;padding:2px 8px;border-radius:999px;font:600 11.5px Inter,sans-serif;white-space:nowrap}.re-st-on{background:#E3F5F0;color:#1d8a73}.re-st-soon{background:#E8EEFB;color:#2938A8}.re-st-amend{background:#FFF5D4;color:#8a6a00}.re-st-wait{background:#FDECEA;color:#b8432c}
.re-lg-card h3,.re-recent h3,.re-legal-map h3{margin:0 0 8px}@media(max-width:900px){.re-lg-chain{grid-template-columns:repeat(2,1fr)}}
.vc2 .lg-badge{cursor:pointer}.vc2 .lg-badge rect{stroke:#fff;stroke-width:1.5}.vc2 .lg-badge text{fill:#fff;font:700 11px Inter,sans-serif;pointer-events:none}
.vc2.lg-focus .vc-node:not(.lg-on){opacity:.25}.vc2 .vc-node{transition:opacity .15s}.vc2.lg-focus .vc-node.lg-on rect.card{stroke:#861C52;stroke-width:2.5}
.lg-tbl tr{transition:opacity .15s,background .15s}.lg-tbl.lg-focus tr[data-law]:not(.lg-on){opacity:.35}.lg-tbl tr.lg-on td{background:#FDF2F7}
.lg-tag::before{content:attr(data-t)}.lg-tag{display:inline-block;margin:0 6px 3px 0;padding:1px 8px;border-radius:999px;color:#fff;font:700 11px Inter,sans-serif;white-space:nowrap}
.lg-legend{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin:6px 0 4px;font-size:12.5px}.lg-legend span{font-weight:600;color:#6B7392}.lg-legend a{display:inline-flex;align-items:center;gap:5px;color:#1F2A5C;text-decoration:none;font-weight:600}.lg-legend a:hover{text-decoration:underline}.lg-legend i{width:10px;height:10px;border-radius:3px;display:inline-block}`;
  document.head.append(st);
}
function run() {
  if (!$('#of-mt4-land') || run.done) return; run.done = true;
  style(); splitHousing(); summaries(); recent(); overview();
  document.addEventListener('click', e => { const a = e.target.closest('.re-lg-go'); if (!a) return; e.preventDefault(); go(a.dataset.go); });
}
window.addEventListener('re:frame', run);
if ($('#of-mt4-land')) run();
})();
