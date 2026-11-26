/* Thủy sản · khung 4 tab theo mẫu Điện (người dùng chốt 26/11/2026).
   Tab lớn: 1 Tổng quan ngành (#mt1: 00 Bản đồ ngành · 01 Chuỗi giá trị · 02 Triển vọng; Bản tin dữ liệu ở đầu)
          · 2 Bức tranh ngành (#mt2: 01 Toàn ngành · 02 Cá tra · 03 Tôm · 04 Chính sách & thuế)
          · 3 Tài chính ngành (#mt14: 01 Tài chính ngành · 02 Doanh nghiệp niêm yết)
          · 4 Chủ đề nóng (#mt7, giữ nguyên research-editorial).
   Card cũ được DỜI theo data-block-id, không nhân bản, không xóa; card chưa có chỗ gom vào "Nội dung khác" để không mất.
   Mỗi nhóm chart mở bằng một câu hỏi (.pp-panel/.pp-ph như Điện); Cá tra, Tôm theo luồng Đầu vào → Sản xuất → Đầu ra.
   Deep-link: ?sub=<khóa>#mtN; link cũ #mt3 → Cá tra, #mt4/#mt10/?section=policy|tax → Chính sách & thuế, #mt6 → Doanh nghiệp
   niêm yết, #mt8 → Tổng quan. Link "#<id>" tới thẻ/câu hỏi đã dời tự mở đúng tab + sub-tab rồi cuộn tới.
   Chạy bằng SectorBoot (mốc 1200: sau research-layout, research-editorial, pane-subtabs, labels-vi; trước chart-unfold 1400
   và dòng nguồn 1500) nên trang hiện thẳng bố cục cuối. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'seafood') return;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const block = id => $(`[data-block-id="${id}"]`);
const kpi = spark => $('#' + spark)?.closest('.kpi');
const nf = (v, d = 1) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';

/* ---------- Cây nội dung ----------
   Mỗi sub-tab: kpis (spark id của ô số), flow (các khâu), items: {grp} tiêu đề nhóm | {stage} tiêu đề khâu | {q} câu hỏi + card. */
const NOTE = html => () => el('p', 'sf-note', html);
const TREE = {
  mt1: {title: 'Tổng quan ngành', subs: [
    {k: 'map', t: 'Bản đồ ngành', d: 'Thức ăn và giống → vùng nuôi → chế biến → thị trường xuất khẩu; vị trí nhóm cá tra, nhóm tôm và doanh nghiệp đa ngành.', items: [
      {q: 'Chuỗi ngành đi từ đâu đến đâu, mỗi nhóm doanh nghiệp đứng ở khâu nào?', id: 'sf-q-map', take: ['.research-roadmap', 'ts-01', '.fsv-flow']},
    ]},
    {k: 'chain', t: 'Chuỗi giá trị', d: 'Mỗi nhóm kiếm tiền ở khâu nào và biến nào quyết định biên.', items: [
      {q: 'Mỗi nhóm kiếm tiền ở khâu nào?', id: 'sf-q-model', take: ['.business-models']},
      {q: 'Nguyên liệu tự nuôi hay thu mua, biến nào quyết định biên?', id: 'sf-q-driver', take: ['ts-04']},
    ]},
    {k: 'outlook', t: 'Triển vọng', d: 'Ba biến cần theo dõi: số hoặc sự kiện gần nhất, hàm ý với doanh nghiệp, kỳ cần kiểm tiếp.', items: [
      {q: 'Ba biến nào sẽ quyết định kết quả các quý tới?', id: 'sf-q-outlook', take: ['ts-05'], old: 'ts-02'},
    ]},
  ]},
  mt2: {title: 'Bức tranh ngành', subs: [
    {k: 'all', t: 'Toàn ngành', d: 'Kim ngạch theo thị trường và mặt hàng, tách số tháng, năm và lũy kế; thị phần trong nhập khẩu của Mỹ.', kpis: ['spk-exp', 'spk-cn', 'spk-us'], items: [
      {grp: 'Thị trường xuất khẩu'},
      {q: 'Thị trường nào đang kéo kim ngạch?', id: 'sf-q-market', meta: '<span class="sf-period">Số tháng</span>Hải quan · toàn ngành thủy sản (cá tra, tôm, hải sản khai thác)', take: ['ts-10', '.fsv-heat']},
      {q: 'Cả năm và lũy kế: thị trường, mặt hàng nào đóng góp?', id: 'sf-q-ytd', meta: '<span class="sf-period">Năm</span>cộng 12 tháng Hải quan · <span class="sf-period">Lũy kế</span>VASEP 10T/2026 và 2T/2026, không cộng lẫn với số tháng', take: ['ts-14', 'ts-21', 'ts-12', 'ts-23']},
      {grp: 'Cạnh tranh tại Mỹ'},
      {q: 'Việt Nam đang giữ hay mất thị phần trong nhập khẩu thủy sản của Mỹ?', id: 'sf-q-usshare', meta: '% giá trị, 12 tháng trượt · HS 0304 = phi lê cá mọi loài (cá tra là phần lớn của Việt Nam) · HS 0306 = giáp xác (tôm, cua, tôm hùm) · WiData bảng 312', take: ['ts-22']},
    ]},
    {k: 'pang', t: 'Cá tra', d: 'Đầu vào (giống, cá nguyên liệu, thức ăn) → Sản xuất (tín hiệu nguồn cung) → Đầu ra (đơn giá tham chiếu, spread sau nguyên liệu và thuế).', kpis: ['spk-pang'],
      flow: [['in', 'Đầu vào', 'Giống, cá nguyên liệu, thức ăn'], ['prod', 'Sản xuất', 'Nguồn cung cá nguyên liệu'], ['out', 'Đầu ra', 'Giá tham chiếu, spread sau thuế']], items: [
      {stage: 'in'},
      {q: 'Giá cá giống, cá nguyên liệu và thức ăn đang đi hướng nào?', id: 'sf-q-pang-in', meta: 'nghìn đ/kg cuối tháng (VASEP, WiData) · khô đậu, ngô % so cùng kỳ (IMF) · chỉ số chi phí thức ăn quy VND', take: ['ts-11', 'ts-13', 'ts-16']},
      {stage: 'prod'},
      {q: 'Giá cá giống đang báo trước nguồn cung cá nguyên liệu thế nào?', id: 'sf-q-pang-prod', take: ['ts-17'],
        after: NOTE('<b>Độ trễ 7 tháng là giả định</b> (chu kỳ nuôi 6–8 tháng), không phải số đo: điểm tháng t là giá giống tháng t−7. Dùng như tín hiệu theo dõi nguồn cung; chưa có số sản lượng cá tra nuôi theo tháng.')},
      {stage: 'out'},
      {q: 'Giá cá tăng đang hỗ trợ doanh thu hay gây sức ép lên biên?', id: 'sf-q-pang-out', meta: 'USD/kg phi lê · <b>spread mô phỏng</b>, không phải biên gộp BCTC', take: ['ts-15'],
        after: NOTE('<b>Cách tính spread:</b> đơn giá EU nhập HS 0304 từ Việt Nam (benchmark, không phải giá bán thực của doanh nghiệp) − cá nguyên liệu quy ra 1 kg phi lê (giả định 2,7 kg cá/kg phi lê) − CBPG theo doanh nghiệp. CBPG chỉ áp cho hàng vào Mỹ (ANV 0,84 USD/kg POR21; VHC 0 vì đã rút khỏi lệnh), nên dòng ANV chỉ đúng với phần bán sang Mỹ. Chưa trừ chi phí chế biến, Mục 301. Biên gộp thực tế theo BCTC: <a href="#sf-q-gm">Tài chính ngành › 1.2</a>.')},
    ]},
    {k: 'shrimp', t: 'Tôm', d: 'Đầu vào (giá tôm nguyên liệu theo vùng, cỡ) → Đầu ra (thị phần ở Mỹ, thuế so với Ecuador, Ấn Độ).', kpis: ['spk-shrimp'],
      flow: [['in', 'Đầu vào', 'Giá tôm nguyên liệu'], ['out', 'Đầu ra', 'Thị phần Mỹ, thuế so đối thủ']], items: [
      {stage: 'in'},
      {q: 'Giá tôm nguyên liệu theo vùng và cỡ đang tăng hay giảm?', id: 'sf-q-shrimp-in', meta: 'nghìn đ/kg cuối tháng · Cà Mau 50 con/kg (WiData) và Đồng Tháp (VASEP) là hai vùng, hai cỡ khác nhau', take: ['ts-20']},
      {stage: 'out'},
      {q: 'Tôm Việt Nam cạnh tranh ở Mỹ với Ecuador, Ấn Độ ra sao?', id: 'sf-q-shrimp-out', build: shrimpOut,
        after: NOTE('<b>Chưa có trên trang:</b> giá xuất khẩu tôm thực nhận của doanh nghiệp, sản lượng tôm nuôi; cấu phần thuế của Ecuador, Ấn Độ chưa đủ (thuế Mỹ chung và CVD Ấn Độ chưa xác nhận văn bản), nên tổng thuế hai nước này là mức tối thiểu.')},
    ]},
    {k: 'policy', t: 'Chính sách & thuế', d: 'Thuế cá tra theo doanh nghiệp → CBPG/CVD tôm theo quốc gia → cấu phần thuế vào Mỹ → lịch và kết luận POR → IUU, MMPA.', items: [
      {q: 'Mỗi doanh nghiệp cá tra chịu mức CBPG bao nhiêu?', id: 'sf-q-pangduty', meta: 'USD/kg · POR20 (8/2022–7/2023) → POR21 (8/2023–7/2024) · <b>cuối cùng</b> 13/08/2026 · áp riêng từng doanh nghiệp', take: ['ts-40']},
      {q: 'Tôm Việt Nam chịu CBPG, CVD cao hay thấp hơn Ecuador, Ấn Độ?', id: 'sf-q-shrimpduty', meta: '% giá trị · Việt Nam POR19 (2/2024–1/2025) <b>cuối cùng</b> 06/11/2026 · CVD Việt Nam <b>cuối cùng</b> 21/10/2024 · theo nhà xuất khẩu hoặc quốc gia', take: ['ts-41']},
      {q: 'Cộng các lớp thuế, tôm vào Mỹ chịu bao nhiêu?', id: 'sf-q-landed', meta: '% giá trị · cộng thẳng các mức đã có văn bản, không gộp kỳ · "chưa xác nhận" = chưa mở văn bản', take: ['ts-44']},
      {q: 'Kỳ rà soát nào sắp có kết luận?', id: 'sf-q-por', meta: 'Federal Register · trạng thái sơ bộ/cuối cùng ghi ở từng dòng · đếm ngược theo 19 CFR 351.213(h)', take: ['ts-43', 'ts-42']},
      {q: 'IUU và MMPA chặn những mặt hàng nào?', id: 'sf-q-iuu', meta: 'theo sự kiện · áp cho hải sản khai thác, không trực tiếp cá tra, tôm nuôi', take: ['ts-50']},
    ]},
  ]},
  mt14: {title: 'Tài chính ngành', subs: [
    {k: 'sector', t: 'Tài chính ngành', d: 'Định giá rổ theo dõi và biên gộp theo quý của từng nhóm, cộng từ BCTC hợp nhất.', items: [
      {q: 'Thị trường đang định giá rổ thủy sản ở mức nào?', id: 'sf-q-pe', meta: 'lần · rổ mã theo dõi (VNDirect) · theo phiên', take: ['ts-03']},
      {q: 'Biên gộp từng nhóm đang mở rộng hay thu hẹp?', id: 'sf-q-gm', meta: '% · Σ lãi gộp ÷ Σ doanh thu thuần cùng rổ · BCTC hợp nhất quý · loại trùng ASM–IDI', take: ['ts-06']},
    ]},
    {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'So sánh tài chính, xu hướng theo quý, bộ lọc mã; kế hoạch và kết quả 2026.', items: [
      {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'sf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ · phạm vi hợp nhất hoặc thuộc cổ đông công ty mẹ theo định nghĩa nguồn', take: ['.financial-comparison']},
      {q: 'Doanh nghiệp đã đi được bao nhiêu so với kế hoạch 2026?', id: 'sf-q-plan', meta: 'tỷ đồng · kế hoạch cả năm so với kết quả 6T/2026 (lũy kế) trừ khi ghi khác', take: ['ts-60']},
    ]},
  ]},
};
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
// Link cũ → [tab lớn, sub-tab]
const ALIAS = {mt3: ['mt2', 'pang'], mt4: ['mt2', 'policy'], mt10: ['mt2', 'policy'], mt5: ['mt1'], mt6: ['mt14', 'listed'], mt8: ['mt1']};
const SECTION = {policy: ['mt2', 'policy'], tax: ['mt2', 'policy'], trade: ['mt2', 'policy'], pangasius: ['mt2', 'pang'], shrimp: ['mt2', 'shrimp'], finance: ['mt14', 'sector'], listed: ['mt14', 'listed']};

/* ---------- Phần dựng riêng ---------- */
function shrimpOut() {
  // Đầu ra tôm dùng chung dữ liệu với Toàn ngành (thị phần Mỹ) và Chính sách (thuế): dẫn link, không lặp chart.
  const row = id => { const t = document.getElementById(id); const h = [...(t?.querySelectorAll('thead th') || [])].map(x => x.textContent.trim()); const r = t?.querySelector('tbody tr'); return r ? Object.fromEntries([...r.children].map((c, i) => [h[i] || i, c.textContent.trim()])) : null; };
  const us = row('tbl-us-share');
  const box = el('div', 'sf-links');
  box.innerHTML = [
    ['#sf-q-usshare', 'Toàn ngành › 1.3', 'Thị phần trong nhập khẩu giáp xác của Mỹ', us ? `12 tháng đến ${esc(us['Tháng'])}: Việt Nam ${esc(us['VN 0306 (%)'])}%, Ấn Độ ${esc(us['Ấn Độ 0306 (%)'])}% (HS 0306)` : 'HS 0306, 12 tháng trượt'],
    ['#sf-q-shrimpduty', 'Chính sách & thuế › 4.2', 'CBPG, CVD tôm: Việt Nam so với Ecuador, Ấn Độ', 'Sao Ta/Fimex 10,71% (POR19 cuối cùng 06/11/2026) · CVD Việt Nam 2,84%'],
    ['#sf-q-landed', 'Chính sách & thuế › 4.3', 'Cấu phần thuế tôm vào Mỹ', 'CBPG + CVD + thuế Mỹ chung, từng nước'],
  ].map(([h, k, t, s]) => `<a class="sf-link" href="${h}"><small>${k}</small><b>${t}</b><span>${s}</span></a>`).join('');
  return box;
}

function groupMargin() {
  // Biên gộp nhóm = Σ lãi gộp ÷ Σ doanh thu thuần của rổ mã trong cùng quý; thiếu số của mã nào trong rổ → để trống quý đó.
  const host = document.getElementById('chGroupGM'), D = window.COMPANY_QUARTERLY;
  if (!host || !D || host.dataset.done) return; host.dataset.done = '1';
  const rows = Object.fromEntries((D.companies || []).filter(c => c.sector === 'seafood').map(c => [c.symbol, c]));
  const G = [['Cá tra', ['VHC', 'ANV', 'IDI'], '#2938A8'], ['Tôm', ['FMC', 'CMX'], '#861C52'], ['Đa ngành', ['ASM'], '#c29100'], ['Toàn rổ', ['VHC', 'ANV', 'FMC', 'CMX', 'ASM'], '#6b7686']]
    .map(([name, syms, color]) => ({name, syms: syms.filter(s => rows[s]), color}));
  const Q = D.quarters || [], from = Math.max(0, Q.length - 16), qs = Q.slice(from);
  const val = (g, i) => { let r = 0, p = 0; for (const s of g.syms) { const a = rows[s].revenue?.[i], b = rows[s].gross_profit?.[i]; if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0) return null; r += a; p += b; } return g.syms.length ? p / r * 100 : null; };
  G.forEach(g => { g.values = qs.map((_, j) => val(g, from + j)); });
  if (typeof barLineChart !== 'function') return;
  barLineChart('chGroupGM', {categories: qs, series: G.map(g => ({name: g.name, color: g.color, kind: 'line', values: g.values})), unit: '%', digits: 1, height: 260, rotateLabels: true, aria: 'Biên gộp theo quý của từng nhóm thủy sản'});
  const lg = el('div', 'legend'); G.forEach(g => { const s = el('span', 'li'), d = el('span', 'dot'); d.style.background = g.color; s.append(d, `${g.name} (${g.syms.join(', ')})`); lg.append(s); }); host.after(lg);
  if (typeof fillTable === 'function') fillTable('tbl-group-gm', ['Quý', ...G.map(g => g.name + ' (%)')], qs.map((q, j) => [q, ...G.map(g => nf(g.values[j], 1))]).reverse());
  const src = D.sources?.[rows.VHC?.source || 'vnd'] || D.sources?.vnd || {name: 'BCTC hợp nhất quý'};
  const n = el('div', 'source-note cadence-note'); n.append('Nguồn: ');
  const a = el('a', '', esc(src.name)); a.href = src.url || '#'; a.target = '_blank'; a.rel = 'noopener'; n.append(a, ` · Kỳ cuối: ${qs.at(-1) || '—'} · Lấy số: ${D.captured_at || '—'}`);
  lg.after(n);
  const miss = (D.missing || []).filter(m => m.sector === 'seafood').map(m => m.symbol);
  if (miss.length) n.after(el('div', 'source-note method-note', `${esc(miss.join(', '))} chưa có BCTC quý trong bộ dữ liệu nên chưa vào rổ.`));
}

function outlookFill() {
  // Số mới nhất cho 3 biến Triển vọng lấy từ ô số / bảng đã dựng trên trang (cùng nguồn với chart).
  const set = (k, t) => { const n = $(`[data-sf-fill="${k}"]`); if (n && t) n.textContent = t; };
  const kp = sp => { const c = kpi(sp); if (!c) return null; const v = c.querySelector('.value'), u = v?.querySelector('.unit'); return {l: c.querySelector('.label')?.textContent.trim(), v: u ? v.firstChild.textContent.trim() : v?.textContent.trim(), u: u?.textContent.trim() || '', d: c.querySelector('.delta')?.textContent.trim(), s: c.querySelector('.sub')?.textContent.trim()}; };
  const fmt = (x, name) => x && x.v && x.v !== '—' ? `${name}: ${x.v} ${x.u} (${[x.d, x.s].filter(Boolean).join(' · ')})` : null;
  set('cn', fmt(kp('spk-cn'), 'Sang Trung Quốc')); set('us', fmt(kp('spk-us'), 'Sang Mỹ'));
  set('pang', fmt(kp('spk-pang'), 'Cá tra nguyên liệu'));
  const t = document.getElementById('tbl-pang-spread'), r = t?.querySelector('tbody tr');
  if (r) { const c = [...r.children].map(x => x.textContent.trim()); set('spread', `Spread mô phỏng ${c[0]}: VHC ${c[4]}, ANV ${c[5]} USD/kg phi lê`); }
  const p = $('#por-countdown .kpi');
  if (p) set('por', [...p.children].map(x => x.textContent.trim()).filter(Boolean).join(' · '));
}

function briefScope() {
  // Bản tin dữ liệu: mỗi ô số ghi rõ đơn vị (đã có), kỳ và phạm vi.
  const S = [[/^XK hàng thủy sản/, 'Số tháng, toàn ngành thủy sản (cá tra, tôm, hải sản khai thác) · % so cùng tháng năm trước · Hải quan'],
    [/Trung Quốc/, 'Số tháng theo nước · % là lũy kế từ đầu năm so cùng kỳ · Hải quan'],
    [/Mỹ/, 'Số tháng theo nước · % là lũy kế từ đầu năm so cùng kỳ · Hải quan'],
    [/Cá tra nguyên liệu/, 'Giá ngày, cá thịt trắng Đồng Tháp · % so cùng kỳ · VASEP'],
    [/Tôm thẻ/, 'Giá Cà Mau, cỡ 50 con/kg · % so cùng kỳ · WiData'],
    [/P\/E/, 'Rổ mã thủy sản theo dõi, theo phiên · VNDirect']];
  $$('#dataBrief .db-c').forEach(c => { if (c.querySelector('.db-scope')) return; const l = c.querySelector('.db-ch')?.textContent || ''; const hit = S.find(([re]) => re.test(l)); if (hit) c.append(el('div', 'db-scope', hit[1])); });
}

/* ---------- Dựng ---------- */
const TABS = {}, used = new Set();
function take(sel) {
  const n = /^ts-/.test(sel) ? block(sel) : $(sel);
  if (!n || used.has(n) || [...used].some(u => u.contains(n))) return null;
  used.add(n); n.hidden = false; n.classList.remove('sf-hidden-legacy');
  if (n.matches('.card') && (n.querySelector('table') && !n.querySelector('[id^="ch"]') || n.querySelectorAll('[id^="ch"]').length > 1)) n.classList.add('sf-wide');
  if (/^ts-(01|04|05|22|43|44|42|50|60)$/.test(sel)) n.classList.add('sf-wide');
  return n;
}
function buildTab(key) {
  const def = TREE[key];
  let pane = $(`.majorpane[data-tab="${key}"]`);
  if (!pane) { pane = el('div', 'majorpane'); pane.dataset.tab = key; pane.id = 'pane-' + key; pane.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(pane); }
  const legacy = [...pane.children];
  const sec = el('section', 'section sf-section');
  if (key === 'mt1') { const brief = $('#dataBrief'); if (brief) sec.append(brief); }
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', def.title); sec.append(nav);
  const subs = def.subs.map((s, i) => {
    const num = String(i + 1).padStart(2, '0'), lab = key === 'mt1' ? String(i).padStart(2, '0') : num;
    const b = el('button', 'tabbtn pp-tab', `<span>${lab}</span>${esc(s.t)}`); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = `sf-${key}-${s.k}-tab`; b.dataset.sub = s.k;
    const p = el('div', 'pp-pane sf-pane'); p.id = `sf-${key}-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${lab}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div>`));
    if (s.kpis) { const g = el('section', 'grid kpis pp-kpis'); s.kpis.forEach(sp => { const c = kpi(sp); if (c) g.append(c); }); if (g.children.length) p.append(g); }
    if (s.flow) {
      const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Luồng ' + s.t.toLowerCase());
      bar.innerHTML = s.flow.map(([id, k, t], j) => `${j ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#sf-st-${s.k}-${id}" class="pp-flow-s"><small>${k}</small><b>${esc(t)}</b></a>`).join('');
      p.append(bar);
    }
    let qn = 0;
    s.items.forEach(it => {
      if (it.grp) { p.append(el('h3', 'pp-grp', esc(it.grp))); return; }
      if (it.stage) { const f = s.flow.find(x => x[0] === it.stage); const h = el('div', 'pp-stage', `<span>${f[1]}</span><h3>${esc(f[2])}</h3>`); h.id = `sf-st-${s.k}-${f[0]}`; p.append(h); return; }
      const panel = el('section', 'pp-panel pp-q'); panel.id = it.id;
      qn++; const pn = key === 'mt1' ? `${i}.${qn}` : `${i + 1}.${qn}`;
      panel.innerHTML = `<header class="pp-ph"><span class="pp-num">${pn}</span><div><h3>${esc(it.q)}</h3>${it.meta ? `<p class="sf-meta">${it.meta}</p>` : ''}</div></header>`;
      const grid = el('div', 'pp-main sf-grid');
      (it.take || []).forEach(sel => { const n = take(sel); if (n) grid.append(n); });
      if (it.build) grid.append(it.build());
      if (it.after) grid.append(it.after());
      if (it.old) { const o = take(it.old); if (o) { const d = el('details', 'sf-old sf-wide'); d.append(el('summary', '', 'Phân tích AI ngày 09/10/2026 (bản cũ, giữ để đối chiếu)'), o); grid.append(d); } }
      panel.append(grid); p.append(panel);
    });
    const nx = def.subs[i + 1];
    if (nx) { const go = el('button', 'sf-next', `Tiếp: ${esc(nx.t)} →`); go.type = 'button'; go.addEventListener('click', () => { open(key, nx.k, true); nav.scrollIntoView({behavior: 'instant', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open(key, s.k, true));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const j = (i + d + def.subs.length) % def.subs.length; nav.children[j].click(); nav.children[j].focus(); });
    return {s, b, p};
  });
  TABS[key] = subs;
  // Phần còn lại của tab cũ: khối có dữ liệu chưa được dời → "Nội dung khác" (không xóa); khung cũ (tiêu đề, sub-tab cũ) ẩn.
  const rest = [];
  // Thay nội dung pane sau khi MỌI tab đã dựng (tab sau còn lấy thẻ nằm trong tab cũ này, vd. ts-03 ở Tổng quan cũ).
  return {pane, sec, legacy};
}
function commit({pane, sec, legacy}) {
  const rest = [];
  legacy.forEach(n => { if (sec.contains(n)) return; if (n.querySelector?.('[data-block-id],canvas,table,svg') || n.matches?.('[data-block-id]')) rest.push(n); });
  pane.replaceChildren(sec);
  return rest;
}
function parkRest(nodes) {
  const live = nodes.filter(n => n.querySelector?.('[data-block-id]:not(.sf-hidden-legacy),canvas,table,svg'));
  live.forEach(n => n.querySelectorAll('.supply-tabs,.pane-subtabs,.sectionhead').forEach(x => x.classList.add('sf-hidden-legacy')));
  const real = live.filter(n => [...n.querySelectorAll('[data-block-id]')].some(b => !used.has(b) && ![...used].some(u => u.contains(b))) || (n.matches('[data-block-id]') && !used.has(n)));
  if (!real.length) return;
  const host = TABS.mt1[0].p, d = el('details', 'research-fold sf-rest');
  d.append(el('summary', '', 'Nội dung khác của bố cục cũ'));
  const box = el('div', 'research-detail'); real.forEach(n => { n.hidden = false; n.querySelectorAll('[hidden]').forEach(h => { if (h.matches('.supply-pane,.pane-subpane')) h.hidden = false; }); box.append(n); });
  d.append(box); host.append(d);
}

function open(key, sub, push) {
  const subs = TABS[key]; if (!subs) return;
  const hit = subs.find(x => x.s.k === sub) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.classList.toggle('active', on); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  if (push) { const u = new URL(location.href); u.searchParams.set('sub', hit.s.k); u.searchParams.delete('section'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
  window.dispatchEvent(new Event('pv:toc'));
}

function nav() {
  const bar = $('nav.majortabs') || $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  const select = (key, hash) => {
    let sub = null;
    if (ALIAS[key]) { [key, sub] = ALIAS[key]; sub = sub || TREE[key]?.subs[0].k; }
    if (!ROUTES.some(r => r[0] === key)) key = 'mt1';
    $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
    [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    if (sub) open(key, sub, true);
    else if (TABS[key]) open(key, (TABS[key].find(x => !x.p.hidden) || TABS[key][0]).s.k, !!hash || /[?&]sub=/.test(location.search));
    else if (hash || /[?&]sub=/.test(location.search)) { const u = new URL(location.href); if (!TABS[key]) u.searchParams.delete('sub'); u.searchParams.delete('section'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
    setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
    return key;
  };
  ROUTES.forEach(([key, label], i) => {
    const b = el('button', 'majortabbtn', `${i + 1}. ${label}`); b.type = 'button'; b.dataset.tab = key; b.id = 'research-tab-' + key; b.setAttribute('role', 'tab');
    const p = $(`.majorpane[data-tab="${key}"]`); if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); }
    b.addEventListener('click', () => { select(key, true); window.scrollTo({top: 0, behavior: 'instant'}); });
    b.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? ROUTES.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : ROUTES.length - 1)) % ROUTES.length; bar.children[j].click(); bar.children[j].focus(); });
    bar.append(b);
  });
  bar.setAttribute('role', 'tablist');
  window.showMajorTab = k => select(k, true);
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (/^mt\d+$/.test(h)) select(h); else goTo(h); });
  // Vào trang: ?section= (link cũ) > #mtN > ?sub=
  const u = new URL(location.href), secQ = SECTION[u.searchParams.get('section')];
  const h = location.hash.slice(1);
  if (secQ) { select(secQ[0]); open(secQ[0], secQ[1], true); return; }
  if (h && !/^mt\d+$/.test(h) && document.getElementById(h)) { select('mt1'); goTo(h); return; }
  const want = u.searchParams.get('sub'), key = select(h || 'mt1');
  if (TABS[key] && !ALIAS[h]) open(key, want, !!want);
}
function goTo(id) {
  const t = id && document.getElementById(id); if (!t) return false;
  const pane = t.closest('.majorpane'); if (!pane) return false;
  const key = pane.dataset.tab, sub = t.closest('.sf-pane');
  $$('.majorpane').forEach(p => { const on = p === pane; p.hidden = !on; p.classList.toggle('active', on); });
  $$('nav.majortabs .majortabbtn').forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  if (sub) open(key, sub.dataset.sub, true); else { const u = new URL(location.href); u.searchParams.delete('sub'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
  // Thẻ trong chủ đề đang thu gọn thì mở ra.
  for (let d = t.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
  setTimeout(() => t.scrollIntoView({behavior: 'instant', block: 'start'}), 80);
  return true;
}

function run() {
  if (document.body.dataset.sfFrame) return; document.body.dataset.sfFrame = '1';
  // ts-60 được research-layout giữ lại vì đã nằm ở Tổng quan; thẻ của tab cũ Chính sách (mt4) và Thuế (mt10) dời vào Bức tranh ngành.
  const rest = [];
  ['mt1', 'mt2', 'mt14'].map(buildTab).forEach(b => rest.push(...commit(b)));
  ['mt4', 'mt10'].forEach(k => { const p = $(`.majorpane[data-tab="${k}"]`); if (!p) return; [...p.children].forEach(n => { if (n.querySelector?.('[data-block-id]') || n.matches?.('[data-block-id]')) rest.push(n); }); p.replaceChildren(); });
  parkRest(rest);
  groupMargin(); outlookFill(); briefScope();
  // Link "#<id>" trỏ vào thẻ/câu hỏi đã dời: mở đúng tab lớn + sub-tab rồi cuộn tới.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); if (!id || /^mt\d+$/.test(id)) return;
    const t = document.getElementById(id); if (!t || !t.closest('.majorpane') || a.closest('.pp-flow') && t.closest('.sf-pane') === a.closest('.sf-pane')) {
      if (t && a.closest('.pp-flow')) { e.preventDefault(); t.scrollIntoView({behavior: 'smooth', block: 'start'}); }
      return;
    }
    e.preventDefault(); goTo(id);
  });
  nav();
  // Thanh sub-tab dính ngay dưới thanh tab lớn (như Điện).
  const setTop = () => { const t = $('.majortabs'), cs = t && getComputedStyle(t), top = cs && cs.position === 'sticky' ? t.getBoundingClientRect().height + (parseFloat(cs.top) || 0) + 6 : 0; $$('.sf-section>.pp-nav').forEach(n => { n.style.top = top + 'px'; }); };
  setTop(); addEventListener('resize', setTop);
  document.documentElement.dataset.sfReady = '1';
  window.dispatchEvent(new Event('sf:frame'));
}
if (window.SectorBoot) SectorBoot.add(1200, run);
else if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
})();
