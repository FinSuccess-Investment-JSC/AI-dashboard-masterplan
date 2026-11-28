/* Đường · khung 4 tab theo chuẩn Điện (28/11/2026, người dùng: "lấy DB ngành điện làm tiêu chuẩn", DASHBOARD_WORKFLOW.md §42).
   Engine chép cách làm của Thep/app/steel-frame.js (TREE, PICT + buildPicture(), financePane(), nav(), ALIAS) và định tuyến của
   Chan-nuoi/app/pkg-frame.js (?sub=<khóa>#mtN, pushState + popstate). Chạy SAU research-layout.js, sector-layout.js, pane-subtabs.js
   (SectorBoot mốc 1600): các module đó đã dựng #supply-world, #supply-vietnam, pane-mt14…; engine chỉ DỜI thẻ theo id chart / data-block-id,
   không nhân bản, không xóa. Thẻ không còn chỗ (bản trùng, thẻ đã ẩn từ trước) nằm trong details.of-rest ẩn.
   Tab lớn: Tổng quan ngành (.ov-nav 00 Bản đồ ngành · 01 Mô hình kinh doanh · 02 Mùa vụ & sản phẩm phụ)
          · Bức tranh ngành (.pp-nav 01 Toàn ngành · 02 Thị trường thế giới · 03 Việt Nam · 04 Chính sách)
          · Tài chính ngành (#mt14: 01 Tài chính ngành = app/sugar-finance.js · 02 Doanh nghiệp niêm yết · 03 Định giá = app/peer-valuation.js)
          · Chủ đề nóng (#mt7: khối tin app/sugar-news.js như Điện, 28/11/2026).
   Link cũ: #mt3 → Bức tranh › 01, #mt4 → Bức tranh › 04 Chính sách, #mt6 → Tài chính › 02, #mt8 → Tổng quan › 00 (khối Nguồn dữ liệu),
   ?section=policy|finance|companies|sources…, id cũ #price #cane #supply #trade #policy. */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
if (document.body.dataset.researchSector !== 'sugar' || !$('#supply-world')) return;  // chỉ trang Đường
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 1) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const SRC = () => window.SECTOR_DAILY?.sources || {};
const dmy = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '';
const my = y => y + '/' + String(y + 1).slice(2);
// Thẻ theo id chart (ưu tiên) hoặc data-block-id; một số data-block-id bị trùng (sugar-11, sugar-12) nên tránh tra theo id khối.
const C = sel => { const n = $(sel); return n ? (n.matches('.card') ? n : n.closest('.card')) : null; };
const B = id => `[data-block-id="${id}"]`;

/* ---------- Cây Tổng quan ngành ---------- */
const OV = [
  {k: 'map', n: '00', t: 'Bản đồ ngành', s: 'Mía → nhà máy → kênh bán', d: 'Nông dân trồng mía → nhà máy ép, tinh luyện → kênh bán lẻ và công nghiệp; đường nhập khẩu, đường lậu, HFCS cạnh tranh song song.', take: ['.research-roadmap', B('sugar-01')]},
  {k: 'models', n: '01', t: 'Mô hình kinh doanh', s: 'Mía đường · thương mại · đa ngành', d: 'Doanh nghiệp đường niêm yết kiếm tiền theo ba mô hình khác nhau.', take: ['.business-models']},
  {k: 'season', n: '02', t: 'Mùa vụ & sản phẩm phụ', s: 'Vụ ép, rỉ đường, bã mía', d: 'Ba đặc thù riêng của ngành đường: thời vụ ép mía, sản phẩm phụ và cạnh tranh đất trồng.', take: ['#mt1-sub-3 .section:has(.driver)']}
];
/* ---------- Cây Bức tranh ngành (28/11/2026) ----------
   01 Toàn ngành: giá (thế giới, trong nước) và cân đối (thế giới, Việt Nam), nhóm bằng .pp-grp.
   02 Thị trường thế giới, 03 Việt Nam: luồng Đầu vào → Sản xuất → Đầu ra; 04 Chính sách: nội dung tab Chính sách · Thuế · Thương mại cũ.
   Mỗi câu hỏi: main = chart trả lời chính, sup = chart phụ, more = xem thêm (chỉ lấy thẻ đang hiện; thẻ đã ẩn từ trước để lại of-rest). */
const LINK = (href, k, t, s) => ({link: [href, k, t, s]});
const PICT = [
  {k: 'all', t: 'Toàn ngành', d: 'Giá đường thế giới và trong nước; thế giới và Việt Nam đang dư hay thiếu đường.', kpis: ['#spk-sg-fut', 'label:Đường trắng', '#spk-stock'], items: [
    {grp: 'Giá đường'},
    {q: 'Giá đường thế giới đang tăng hay giảm?', id: 'sg-q-price', main: [B('fast-price')], more: ['#chWorldRecent', '#chWorldLong']},
    {q: 'Giá đường trong nước có đi theo giá thế giới?', id: 'sg-q-vnprice', main: ['#chVnPrice'], sup: ['#chRegional']},
    {grp: 'Cân đối cung cầu'},
    {q: 'Niên vụ tới thế giới dư hay thiếu đường?', id: 'sg-q-wbal', main: ['#ch-sugar-11-sd'], wide: true},
    {q: 'Việt Nam dư cung đến đâu, tồn kho ở mức nào?', id: 'sg-q-vnbal', main: ['#chSupplyDemand'], sup: ['#chStocks']}
  ]},
  {k: 'world', t: 'Thị trường thế giới', d: 'Thời tiết và tồn kho → sản lượng Brazil, Ấn Độ, Thái Lan → nhu cầu nhập khẩu, tiêu dùng của thế giới.', kpis: ['#spk-world', '#spk-sg-bal', '#spk-sg-stu'],
    flow: [['in', 'Đầu vào', 'Thời tiết (ENSO), tồn kho thế giới'], ['prod', 'Sản xuất', 'Brazil, Ấn Độ, Thái Lan, EU'], ['out', 'Đầu ra', 'Nhập khẩu, tiêu dùng, giá Sugar No.11']], items: [
    {stage: 'in'},
    {q: 'El Niño và tồn kho thế giới đang đẩy giá đường theo hướng nào?', id: 'sg-q-cycle', main: [B('sugar-cycle')], wide: true},
    {stage: 'prod'},
    {q: 'Brazil, Ấn Độ, Thái Lan đang sản xuất nhiều hơn hay ít hơn?', id: 'sg-q-prod', main: [B('sugar-world-production')], sup: [B('sugar-world-share-prod')]},
    {q: 'Niên vụ 2026/27 nước nào tăng, nước nào giảm sản lượng?', id: 'sg-q-yoy', main: [B('sugar-country-yoy')]},
    {stage: 'out'},
    {q: 'Ai đang mua và tiêu thụ đường của thế giới?', id: 'sg-q-demand', main: [B('sugar-world-share-imp')], sup: [B('sugar-world-share-cons')]},
    LINK('#sg-q-wbal', 'Toàn ngành › 1.3', 'Cán cân cung cầu đường thế giới', 'Sản xuất trừ tiêu thụ (USDA) và dự báo niên vụ 2026/27 của các tổ chức'),
    LINK('#sg-q-price', 'Toàn ngành › 1.1', 'Giá đường thô Sugar No.11', 'Futures theo phiên và bình quân tháng World Bank')
  ]},
  {k: 'vn', t: 'Việt Nam', d: 'Vùng mía, giá mía → mía ép, sản lượng đường → đường nhập khẩu, đường lậu, HFCS cạnh tranh với đường nội.', kpis: ['#spk-prod', '#spk-imp', '#spk-cane'],
    flow: [['in', 'Đầu vào', 'Vùng mía, giá mía nguyên liệu'], ['prod', 'Sản xuất', 'Mía ép, sản lượng đường'], ['out', 'Đầu ra', 'Nhập khẩu, đường lậu, HFCS, giá bán']], items: [
    {stage: 'in'},
    {q: 'Vùng mía đang mở rộng hay thu hẹp?', id: 'sg-q-area', main: ['#chCaneArea']},
    {q: 'Giá mía nguyên liệu đang tăng hay giảm?', id: 'sg-q-caneprice', main: ['#chCanePrice']},
    {stage: 'prod'},
    {q: 'Nhà máy ép được bao nhiêu mía mỗi vụ?', id: 'sg-q-crush', main: ['#chCaneCrush']},
    LINK('#sg-q-vnbal', 'Toàn ngành › 1.4', 'Sản lượng đường so với tiêu thụ nội địa', 'Cân đối cung cầu và tồn kho cuối niên vụ (USDA PSD)'),
    {stage: 'out'},
    {q: 'Nhập khẩu chính ngạch còn lấn đường nội không?', id: 'sg-q-imp', main: ['#chImports']},
    {q: 'Đường lậu và siro HFCS đang chiếm chỗ của đường nội đến đâu?', id: 'sg-q-smuggle', main: ['#chSmuggled'], sup: ['#chHfcs']},
    LINK('#sg-q-vnprice', 'Toàn ngành › 1.2', 'Giá bán đường trong nước', 'Giá đường trắng, tinh luyện và so sánh khu vực'),
    LINK('?sub=fin#mt14', 'Tài chính ngành › 01', 'Biên lợi nhuận doanh nghiệp đường niêm yết', 'Số cộng gộp BCTC quý theo nhóm mô hình')
  ]},
  {k: 'policy', t: 'Chính sách', d: 'Hạn ngạch thuế quan nhập khẩu đường và thuế phòng vệ thương mại với đường Thái Lan, ASEAN.', items: [
    {q: 'Hạn ngạch nhập khẩu đường mở bao nhiêu, đã dùng hết chưa?', id: 'sg-q-trq', main: [B('chPolicyQuota')], sup: [B('sugar-17')]},
    {q: 'Thuế phòng vệ với đường Thái Lan còn hiệu lực đến bao giờ?', id: 'sg-q-adcvd', main: [B('sugar-18')], sup: [B('chPolicyTax')], wide: true}
  ]}
];
const FIN = [
  {k: 'fin', t: 'Tài chính ngành', d: 'Số cộng gộp BCTC hợp nhất quý của doanh nghiệp đường niêm yết, theo nhóm mô hình.'},
  {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'So sánh từng doanh nghiệp: sinh lời, nợ vay, định giá và xu hướng tài chính theo quý.'},
  {k: 'valuation', t: 'Định giá', d: 'P/B so với ROE, biên gộp, lợi suất lợi nhuận và bội số dòng tiền giữa các mã.'}
];
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
const ALIAS = {mt3: ['mt2', 'all'], mt4: ['mt2', 'policy'], mt5: ['mt1'], mt6: ['mt14', 'listed'], mt8: ['mt1', 'map', 'sg-sources'], mt9: ['mt14', 'fin'], mt10: ['mt2']};
const SECTION = {policy: ['mt2', 'policy'], tax: ['mt2', 'policy'], trade: ['mt2', 'policy'], price: ['mt2', 'all'], supply: ['mt2', 'all'], world: ['mt2', 'world'], vietnam: ['mt2', 'vn'],
  finance: ['mt14', 'fin'], listed: ['mt14', 'listed'], companies: ['mt14', 'listed'], players: ['mt14', 'listed'], valuation: ['mt14', 'valuation'], sources: ['mt1', 'map', 'sg-sources'], season: ['mt1', 'season']};
const SUBALIAS = {'mt2/vietnam': 'vn', 'mt2/thegioi': 'world', 'mt2/price': 'all', 'mt2/supply': 'all', 'mt2/trade': 'vn', 'mt2/tax': 'policy',
  'mt14/total': 'fin', 'mt14/sector': 'fin', 'mt14/compare': 'listed', 'mt14/companies': 'listed', 'mt1/chain': 'map', 'mt1/business': 'models'};
const HASHID = {price: ['mt2', 'all'], cane: ['mt2', 'vn'], supply: ['mt2', 'all'], trade: ['mt2', 'policy'], policy: ['mt2', 'policy']};  // id section của HTML gốc

const CSS = `/* Bố cục riêng của engine Đường; giao diện thanh/khung ở app/sector-frame.css */
.of-rest{display:none!important}
.sg-q{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:14px;align-items:stretch;scroll-margin-top:140px}
.sg-q>.pp-ph,.sg-q>.pp-more,.sg-q>.sg-note,.sg-q.sg-solo>.pp-main,.sg-q.sg-wide>.pp-main,.sg-q.sg-wide>.pp-sup1{grid-column:1/-1}
.sg-q>.pp-main,.sg-q>.pp-sup1{min-width:0;display:flex;flex-direction:column}.sg-q>.pp-main>.card,.sg-q>.pp-sup1>.card{flex:1 1 auto;margin:0!important;min-width:0}
.sg-q .pp-more{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.sg-q .pp-more>.card{margin:0!important;min-width:0}.sg-q .pp-more>:only-child{grid-column:1/-1}
.sg-pane .card,.sg-pane .card *{min-width:0}.sg-pane canvas{max-width:100%!important}
.sg-pane .research-roadmap>h2{display:none}.sg-pane .section>.sectionhead h2{display:none}
.sg-pane>.pp-head .pp-k{margin-right:6px}.sg-pane .of-gap,.sg-gap{padding:10px 12px;border:1px dashed var(--line,#d6dbe8);border-radius:10px;color:var(--muted,#6b7280);font-size:13px}
.sg-pane>.pp-kpis .kpi{min-width:0}.sg-fin-body>*{margin-top:0}
.sg-next{display:inline-flex;align-items:center;gap:6px;margin:8px 0 0;padding:9px 18px;border:1px solid #C9D0EC;border-radius:999px;background:var(--card,#fff);color:#2938A8;font:600 13.5px Inter,sans-serif;cursor:pointer}
.sg-next:hover{background:#2938A8;color:#fff;border-color:#2938A8}
.sg-policy-note{margin:-4px 0 14px;font-size:13px;color:var(--ink2,#3b4256)}
@media (max-width:900px){.sg-q{grid-template-columns:minmax(0,1fr)}.sg-q>*{grid-column:1/-1}.sg-q .pp-more{grid-template-columns:minmax(0,1fr)}}`;

const TABS = {}, used = new Set();
const isUsed = n => used.has(n) || [...used].some(u => u.contains(n));
function grab(n, keepHidden) {
  if (!n || isUsed(n)) return null;
  if (keepHidden && n.hidden) return null;  // thẻ module khác đã chủ động ẩn (vd. sugar-04/05 trùng chế độ World Bank của chart giá) → để of-rest
  used.add(n); n.hidden = false; n.classList.remove('is-lone', 'is-lone-plain'); n.querySelector(':scope>.lone-aside')?.remove(); n.style.gridColumn = '';
  return n;
}
// Thẻ Chính sách bị research-layout gập vào <details>; trong câu hỏi cần chart/bảng hiện sẵn → gỡ lớp gập, giữ tiêu đề.
function unfold(card) {
  const d = card.querySelector(':scope>details.research-fold'); if (!d) return;
  const title = d.querySelector(':scope>summary')?.textContent.trim() || '', body = d.querySelector(':scope>.research-detail');
  if (body) d.before(...body.childNodes);
  d.remove();
  card.querySelectorAll('.research-repeated-heading').forEach(n => n.classList.remove('research-repeated-heading'));
  if (!card.querySelector('.chart-title,h3,h4') && title) { const h = el('div', 'chart-title', esc(title)); const badge = card.querySelector(':scope>.update-badge'); badge ? badge.after(h) : card.prepend(h); }
}
// Ngày lớn nhất ghi trong thẻ và bảng nguồn của thẻ (popover ⓘ do research-sources.js dựng, nối qua aria-controls):
// dd/mm/yyyy, không lấy ngày tương lai như hạn hiệu lực thuế.
function maxDate(nodes) {
  const today = new Date().toISOString().slice(0, 10); let best = '';
  const all = nodes.filter(Boolean).flatMap(n => [n, ...[...n.querySelectorAll('[aria-controls]')].map(b => document.getElementById(b.getAttribute('aria-controls'))).filter(p => p && !n.contains(p))]);
  // Bỏ ngày kiểm nguồn ("Kiểm 22/11/2026", "Kiểm tra: 17:22:22 26/11/2026") — đó là giờ chạy job, không phải kỳ quan sát.
  all.forEach(n => (n.textContent || '').replace(/Kiểm(?: tra)?:?\s*(?:\d{1,2}:\d{2}(?::\d{2})?\s*)?\d{1,2}\/\d{1,2}\/20\d{2}/g, '').replace(/(?<!\d)(\d{1,2})\/(\d{1,2})\/(20\d{2})(?!\d)/g, (m, d, mo, y) => {
    const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`; if (+mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31 && iso <= today && iso > best) best = iso; return m; }));
  return best;
}
function asOf(k, pane) {
  const s = SRC(), cards = [...pane.querySelectorAll('.card,.kpi')];
  if (k === 'all') { const a = [s.sugar_futures?.latest_observation || '', maxDate(cards)].sort().at(-1); return a ? dmy(a) : ''; }
  if (k === 'world') {
    const wb = s.sugar_monthly?.records?.at(-1)?.date, oni = s.enso_oni?.records?.at(-1), y = s.sugar_world_shares?.records?.at(-1)?.market_year;
    return [wb && 'World Bank T' + (+wb.slice(5, 7)) + '/' + wb.slice(0, 4), oni && 'ONI ' + oni.season + '/' + oni.year, y && 'USDA PSD niên vụ ' + my(y) + '*'].filter(Boolean).join(' · ');
  }
  if (k === 'vn') { const d = maxDate(cards), y = s.sugar_vn_balance?.records?.at(-1)?.market_year; return [d && dmy(d), y && 'USDA PSD niên vụ ' + my(y) + '*'].filter(Boolean).join(' · '); }
  if (k === 'policy') { const d = maxDate(cards); return d ? dmy(d) : ''; }
  return '';
}

/* ---------- Ô số thêm cho Bức tranh ngành: tính từ window.SECTOR_DAILY, cùng chuỗi các chart trên trang (không nhập tay) ---------- */
function extraKpis(host) {
  const s = SRC(), tile = (id, label, value, delta, sub, spark) => {
    const k = el('div', 'kpi sg-kpi', `<div class="label">${esc(label)}</div><div class="value">${value}</div><div class="delta">${esc(delta)}</div><div class="sub">${sub}</div><svg class="spark" id="${id}" viewBox="0 0 100 26" width="100" height="26"></svg>`);
    host.append(k); if (spark?.length > 2 && typeof window.sparkline === 'function') { try { window.sparkline(id, spark, '#2938A8'); } catch (e) { /* bỏ spark */ } }
  };
  const fut = s.sugar_futures, fr = fut?.records || [];
  if (fr.length) {
    const L = fr.at(-1), back = new Date(L.date + 'T00:00:00Z'); back.setUTCFullYear(back.getUTCFullYear() - 1);
    const ago = [...fr].reverse().find(r => r.date <= back.toISOString().slice(0, 10)), pct = ago && fin(ago.value) && ago.value ? (L.value / ago.value - 1) * 100 : null;
    const sym = fut.symbol && fut.symbol !== 'SB=F' ? ' · hợp đồng ' + esc(fut.symbol.replace('.NYB', '')) : '';
    tile('spk-sg-fut', 'Sugar No.11 futures ' + dmy(L.date), nf(L.value, 2), fin(pct) ? (pct >= 0 ? '▲ ' : '▼ ') + nf(Math.abs(pct), 1) + '% so cùng kỳ' : 'Giá đóng cửa phiên gần nhất',
      `US cent/lb · <a href="https://finance.yahoo.com/quote/SB%3DF/" target="_blank" rel="noopener">Yahoo SB=F</a>${sym}, không chính thức`, fr.slice(-90).map(r => r.value));
  }
  const sh = s.sugar_world_shares?.records || [];
  if (sh.length > 1 && fin(sh.at(-1).prod_total) && fin(sh.at(-1).use_total)) {
    const L = sh.at(-1), P = sh.at(-2), bal = r => r.prod_total - r.use_total, stu = r => r.stocks_total / r.use_total * 100;
    const usda = '<a href="https://apps.fas.usda.gov/psdonline/app/index.html#/app/advQuery" target="_blank" rel="noopener">USDA PSD</a>';
    tile('spk-sg-bal', 'Cán cân đường thế giới ' + my(L.market_year) + '*', (bal(L) >= 0 ? '+' : '−') + nf(Math.abs(bal(L)), 1) + 'tr', 'Niên vụ ' + my(P.market_year) + ': ' + (bal(P) >= 0 ? '+' : '−') + nf(Math.abs(bal(P)), 1) + ' tr tấn',
      `triệu tấn, sản xuất − tiêu thụ · ${usda}, dự báo`, sh.slice(-12).map(bal));
    if (fin(L.stocks_total)) tile('spk-sg-stu', 'Tồn kho / tiêu thụ thế giới ' + my(L.market_year) + '*', nf(stu(L), 1) + '%', (stu(L) - stu(P) >= 0 ? '▲ ' : '▼ ') + nf(Math.abs(stu(L) - stu(P)), 1) + ' điểm % so vụ trước',
      `% · tồn kho cuối kỳ ÷ tiêu thụ · ${usda}`, sh.slice(-12).map(stu));
  }
}

/* ---------- Tổng quan ngành ---------- */
function overview() {
  const pane = $('.majorpane[data-tab="mt1"]'); if (!pane) return;
  const head = pane.querySelector(':scope>.sectionhead'), oldBar = pane.querySelector(':scope>.pane-subtabs'), oldPanes = [...pane.querySelectorAll(':scope>.pane-subpane')];
  if (head) head.innerHTML = '<div><h2 class="sec">Tổng quan ngành đường</h2><p>Bản đồ ngành → mô hình kinh doanh → mùa vụ và sản phẩm phụ. Doanh nghiệp niêm yết ở tab Tài chính ngành.</p></div>';
  const nav = el('div', 'ov-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Tổng quan ngành');
  head ? head.after(nav) : pane.prepend(nav);
  let anchor = nav;
  const subs = OV.map((s, i) => {
    const b = el('button', 'tabbtn ov-tab', `<span>${s.n}</span>${esc(s.t)}<small>${esc(s.s)}</small>`); b.type = 'button'; b.id = `sg-mt1-${s.k}-tab`; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; nav.append(b);
    const p = el('div', 'sg-pane ov-pane'); p.id = `sg-mt1-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${s.n}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div>`));
    s.take.forEach(q => $$(q).forEach(n => { if (grab(n)) p.append(n); }));
    if (p.children.length < 2) p.append(el('p', 'sg-gap', 'Chưa có nội dung cho mục này.'));
    const nx = OV[i + 1]; if (nx) { const go = el('button', 'sg-next', `Tiếp: ${esc(nx.t)} →`); go.type = 'button'; go.addEventListener('click', () => { open('mt1', nx.k, 'push'); nav.scrollIntoView({behavior: 'instant', block: 'start'}); }); p.append(go); }
    anchor.after(p); anchor = p;
    b.addEventListener('click', () => open('mt1', s.k, 'push'));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const j = (i + d + OV.length) % OV.length; nav.children[j].click(); nav.children[j].focus(); });
    return {s, b, p};
  });
  TABS.mt1 = subs;
  // Tab Nguồn dữ liệu cũ (#mt8, do research-layout dựng, không còn trên thanh tab) → khối mở rộng cuối Bản đồ ngành; link cũ #mt8 mở khối này.
  const p8 = $('.majorpane[data-tab="mt8"]');
  if (p8 && p8.querySelector('.source-register,.card,details')) {
    const d = el('details', 'research-fold sg-sources'); d.id = 'sg-sources'; d.append(el('summary', '', 'Nguồn dữ liệu, kỳ quan sát và độ tin cậy'));
    const box = el('div', 'research-detail');
    [...p8.children].forEach(n => { if (n.matches('h2,.research-caption,.pane-subtabs,.supply-tabs')) return; if (n.matches('.pane-subpane')) { n.hidden = false; n.classList.remove('pane-subpane'); } box.append(n); });
    d.append(box); const go = subs[0].p.querySelector('.sg-next'); go ? go.before(d) : subs[0].p.append(d);
  }
  // Phần còn lại của khung sub-tab cũ: khối có dữ liệu chưa dời (vd. So sánh tài chính — Tài chính ngành › 02 lấy sau) → fold ẩn; bỏ thanh và vỏ cũ.
  const left = oldPanes.flatMap(w => [...w.children]).filter(n => !isUsed(n) && (n.matches('[data-block-id],.financial-comparison') || n.querySelector('[data-block-id],canvas,table,svg,.driver,.card')));
  if (left.length) { const d = el('details', 'research-fold of-rest'); d.hidden = true; d.append(el('summary', '', 'Nội dung khác của bố cục cũ'), ...left); anchor.after(d); }
  oldPanes.forEach(w => w.remove()); oldBar?.remove();
}

/* ---------- Bức tranh ngành ---------- */
function picture() {
  const pane = $('.majorpane[data-tab="mt2"]'); if (!pane) return;
  const legacy = [...pane.children], kpiGrid = pane.querySelector(':scope>.kpis');
  if (kpiGrid) extraKpis(kpiGrid);
  const kpiTile = sel => { if (sel.startsWith('label:')) { const re = new RegExp(sel.slice(6), 'i'); return [...(kpiGrid?.querySelectorAll('.kpi') || [])].find(k => re.test(k.querySelector('.label')?.textContent || '')); } return $(sel)?.closest('.kpi'); };
  const sec = el('section', 'section sg-section');
  sec.append(el('div', 'sectionhead', '<div><h2 class="sec">Bức tranh ngành</h2><p>Toàn ngành → thị trường thế giới → Việt Nam (mía → đường → giá bán) → chính sách. Mỗi phân khúc đi theo luồng đầu vào → sản xuất → đầu ra.</p></div>'));
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Bức tranh ngành'); sec.append(nav);
  const subs = PICT.map((s, i) => {
    const num = String(i + 1).padStart(2, '0');
    const b = el('button', 'tabbtn pp-tab', `<span>${num}</span>${esc(s.t)}`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `sg-mt2-${s.k}-tab`;
    const p = el('div', 'pp-pane sg-pane'); p.id = `sg-mt2-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    const head = el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div><span class="pp-asof"></span>`); p.append(head);
    if (s.kpis) { const g = el('section', 'grid kpis pp-kpis'); s.kpis.forEach(sp => { const t = kpiTile(sp); if (t && !isUsed(t)) { used.add(t); g.append(t); } }); if (g.children.length) p.append(g); }
    if (s.flow) {
      const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Luồng ' + s.t.toLowerCase());
      bar.innerHTML = s.flow.map(([id, k, t], j) => `${j ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#sg-st-${s.k}-${id}" class="pp-flow-s"><small>${k}</small><b>${esc(t)}</b></a>`).join('');
      p.append(bar);
    }
    let qn = 0;
    s.items.forEach(it => {
      if (it.grp) { p.append(el('h3', 'pp-grp', esc(it.grp))); return; }
      if (it.stage) { const f = s.flow.find(x => x[0] === it.stage); const h = el('div', 'pp-stage', `<span>${f[1]}</span><h3>${esc(f[2])}</h3>`); h.id = `sg-st-${s.k}-${f[0]}`; p.append(h); return; }
      if (it.link) { const [href, where, t, sub] = it.link; const a = el('a', 'th-link', `<small>Xem chart ở ${esc(where)}</small><b>${esc(t)} →</b><span>${esc(sub)}</span>`); a.href = href; p.append(a); return; }
      const mains = (it.main || []).map(q => grab(C(q))).filter(Boolean);
      if (!mains.length) return;  // thiếu dữ liệu nguồn (vd. USDA lỗi): bỏ câu hỏi, không để khung rỗng
      if (s.k === 'policy') mains.forEach(unfold);
      const panel = el('section', 'pp-panel pp-q sg-q'); panel.id = it.id; qn++;
      panel.innerHTML = `<header class="pp-ph"><span class="pp-num">${i + 1}.${qn}</span><div><h3>${esc(it.q)}</h3></div></header>`;
      // Như Dien/app/power-picture.js: đúng 1 chart trong .pp-main, 1 chart phụ trong .pp-sup1, phần còn lại .pp-more
      // (1 thẻ: "pp-sup1 pp-more"; ≥2 thẻ: "grid two g2 pp-sup pp-more").
      const w = el('div', 'pp-main'); w.append(mains[0]); panel.append(w);
      const sup = [...mains.slice(1), ...(it.sup || []).map(q => grab(C(q))).filter(Boolean)];
      if (s.k === 'policy') sup.forEach(unfold);
      if (sup.length) { const w2 = el('div', 'pp-sup1'); w2.append(sup[0]); panel.append(w2); }
      const more = [...sup.slice(1), ...(it.more || []).map(q => grab(C(q), true)).filter(Boolean)];
      if (more.length) { const w3 = el('div', more.length > 1 ? 'grid two g2 pp-sup pp-more' : 'pp-sup1 pp-more'); more.forEach(n => w3.append(n)); panel.append(w3); }
      if (!sup.length) panel.classList.add('sg-solo');
      if (it.wide) panel.classList.add('sg-wide');
      p.append(panel);
    });
    const nx = PICT[i + 1]; if (nx) { const go = el('button', 'sg-next', `Tiếp: ${esc(nx.t)} →`); go.type = 'button'; go.addEventListener('click', () => { open('mt2', nx.k, 'push'); nav.scrollIntoView({behavior: 'instant', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open('mt2', s.k, 'push'));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const j = (i + d + PICT.length) % PICT.length; nav.children[j].click(); nav.children[j].focus(); });
    return {s, b, p, head};
  });
  // Câu dẫn tác động chính sách (research-layout gom một lần dưới tiêu đề tab Chính sách cũ) → đầu sub-tab Chính sách.
  const pol = subs.find(x => x.s.k === 'policy');
  if (pol) $$('.majorpane[data-tab="mt4"] .policy-impact').forEach(n => { n.classList.add('sg-policy-note'); pol.p.querySelector('.pp-panel')?.before(n); });
  // Khối còn lại của bố cục cũ (thẻ đã ẩn từ trước, bản trùng, vỏ tab Thế giới / Việt Nam): giữ trong DOM, ẩn.
  if (kpiGrid && !kpiGrid.querySelector('.kpi')) kpiGrid.remove();
  const rest = legacy.filter(n => n.isConnected && !sec.contains(n) && !isUsed(n) && (n.matches?.('[data-block-id],.kpis') || n.querySelector?.('[data-block-id],canvas,table,svg,.card')));
  if (rest.length) { const d = el('details', 'research-fold of-rest'); d.hidden = true; d.append(el('summary', '', 'Nội dung khác của tab cũ'), ...rest); sec.append(d); }
  pane.replaceChildren(sec);
  subs.forEach(x => { const a = asOf(x.s.k, x.p); x.head.querySelector('.pp-asof').textContent = a ? 'Dữ liệu mới nhất: ' + a : ''; });
  TABS.mt2 = subs;
}

/* ---------- Tài chính ngành (#mt14) ---------- */
let finHost = null;
function financePane() {
  let mp = $('.majorpane[data-tab="mt14"]');
  if (!mp) { mp = el('section', 'majorpane'); mp.dataset.tab = 'mt14'; mp.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(mp); }
  mp.id = mp.id || 'pane-mt14';
  const pre = [...mp.children];  // sugar-finance.js dựng thẳng vào pane khi mở trang tại #mt14; peer-valuation.js có thể đã gắn khối dự phòng
  const S = el('section', 'section sg-section');
  S.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>Số liệu tài chính của doanh nghiệp đường niêm yết: tổng hợp toàn ngành, từng doanh nghiệp và định giá.</p></div>'));
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Tài chính ngành'); S.append(nav);
  const D = window.SUGAR_FIN, last = D?.periods?.at(-1), qLab = last ? `Q${last.slice(-1)}/${last.slice(0, 4)}` : '';
  const V = window.COMPANY_VALUATION?.companies || {}, vDay = (D?.companies || []).map(c => V[c.ticker]?.date || '').sort().at(-1);
  const finAsOf = k => k === 'valuation' ? [vDay && 'giá phiên ' + dmy(vDay), qLab && 'BCTC ' + qLab].filter(Boolean).join(' · ') : qLab && 'BCTC ' + qLab;
  const subs = FIN.map((s, i) => {
    const num = String(i + 1).padStart(2, '0');
    const b = el('button', 'tabbtn pp-tab', `<span>${num}</span>${esc(s.t)}`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `of-mt14-${s.k}-tab`;
    const p = el('div', 'pp-pane sg-pane'); p.id = `of-mt14-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div><span class="pp-asof">${finAsOf(s.k) ? 'Dữ liệu mới nhất: ' + esc(finAsOf(s.k)) : ''}</span>`));
    const body = el('div', 'of-body sg-fin-body'); p.append(body);  // peer-valuation.js tìm #of-mt14-valuation .of-body
    nav.append(b); S.append(p);
    b.addEventListener('click', () => open('mt14', s.k, 'push'));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const j = (i + d + FIN.length) % FIN.length; nav.children[j].click(); nav.children[j].focus(); });
    return {s, b, p, body};
  });
  const [f1, f2, f3] = subs.map(x => x.body);
  finHost = f1;
  pre.forEach(n => { if (n.matches('.pv-auto-sec')) { const w = n.querySelector('.pv-wrap'); if (w) f3.append(w); } else f1.append(n); });
  // 02 Doanh nghiệp niêm yết: bảng so sánh tài chính & định giá + xu hướng tài chính theo quý (financial-comparison.js, trước ở Tổng quan › So sánh tài chính).
  const comp = $('#company-comparison');
  if (comp) { const was = comp.closest('.of-rest'); comp.hidden = false; f2.append(comp); if (was && !was.querySelector('[data-block-id],canvas,svg,table,.card')) was.remove(); }
  else f2.append(el('p', 'sg-gap', 'Chưa tải được bảng so sánh doanh nghiệp.'));
  f2.append(el('p', 'sg-gap', 'Chưa có bảng kế hoạch – kết quả kinh doanh và P/E bình quân rổ theo thời gian cho nhóm đường: cần nguồn kế hoạch ĐHCĐ của SBT, QNS, LSS, SLS, KTS.'));
  mp.replaceChildren(S);
  TABS.mt14 = subs;
}
function buildFinance() { if (finHost && window.SugarFinance) { try { window.SugarFinance.build(finHost); } catch (e) { console.error('[sugar-frame] finance', e); } } }

/* ---------- Điều hướng ---------- */
function setUrl(key, sub, mode) {
  const u = new URL(location.href);
  if (sub) u.searchParams.set('sub', sub); else u.searchParams.delete('sub');
  u.searchParams.delete('section'); u.hash = key;
  const next = u.pathname + u.search + u.hash;
  if (next === location.pathname + location.search + location.hash) return;
  if (mode === 'push') history.pushState({sg: 1}, '', next); else history.replaceState(history.state, '', next);
}
function open(key, sub, mode) {
  const subs = TABS[key]; if (!subs) return;
  const hit = subs.find(x => x.s.k === sub) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.classList.toggle('active', on); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  const bar = hit.b.parentElement; if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollLeft = Math.max(0, hit.b.offsetLeft - 12);
  if (mode) setUrl(key, hit.s.k, mode);
  try { window.DashboardPopover?.close?.(); } catch (e) { /* popover nguồn: research-sources.js gắn vào nút tab cũ */ }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
let bar;
function showMajor(key) {
  $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
  [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  if (key === 'mt14') buildFinance();  // đồng bộ: sugar-finance.js cũng nghe click [data-tab="mt14"] (setTimeout 0) — phải nhận host trước
}
// Đọc URL (vào trang, Back/Forward, đổi hash): ?section= (link cũ) > #mtN (+ ?sub=) > id section cũ > #<id> thẻ đã dời.
function route(mode) {
  const u = new URL(location.href), h = location.hash.slice(1), secQ = SECTION[u.searchParams.get('section')];
  let key, sub = u.searchParams.get('sub'), target = null, alias = false;
  if (secQ) { [key, sub, target] = secQ; alias = true; }
  else if (/^mt\d+$/.test(h)) { key = h; if (ALIAS[h]) { [key, sub, target] = ALIAS[h]; alias = true; } }
  else if (HASHID[h]) { [key, sub] = HASHID[h]; alias = true; }
  else if (h && document.getElementById(h)?.closest('.majorpane')) return goTo(h, mode);
  else key = 'mt1';
  const sa = SUBALIAS[key + '/' + sub]; if (sa) { sub = sa; alias = true; }
  if (!ROUTES.some(r => r[0] === key)) key = 'mt1';
  showMajor(key);
  if (TABS[key]) open(key, sub, alias ? 'replace' : mode); else setUrl(key, null, alias ? 'replace' : mode);
  if (target) { const t = document.getElementById(target); if (t) { if (t.matches('details')) t.open = true; setTimeout(() => t.scrollIntoView({behavior: 'instant', block: 'start'}), 80); } }
}
function goTo(id, mode = 'push') {
  const t = id && document.getElementById(id); if (!t) return false;
  const pane = t.closest('.majorpane'); if (!pane) return false;
  const key = pane.dataset.tab, sub = t.closest('.sg-pane');
  if (!ROUTES.some(r => r[0] === key)) return false;
  showMajor(key);
  if (sub) open(key, sub.dataset.sub, mode); else setUrl(key, null, mode);
  for (let d = t.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
  setTimeout(() => t.scrollIntoView({behavior: 'instant', block: 'start'}), 80);
  return true;
}
function nav() {
  bar = $('nav.majortabs') || $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  ROUTES.forEach(([key, label], i) => {
    const b = el('button', 'majortabbtn', label); b.type = 'button'; b.dataset.tab = key; b.id = 'research-tab-' + key; b.setAttribute('role', 'tab');
    const p = $(`.majorpane[data-tab="${key}"]`); if (p) { p.id = p.id || 'pane-' + key; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); }
    b.addEventListener('click', () => {
      showMajor(key);
      if (TABS[key]) { const cur = TABS[key].find(x => !x.p.hidden) || TABS[key][0]; open(key, cur.s.k, 'push'); } else setUrl(key, null, 'push');
      window.scrollTo({top: 0, behavior: 'instant'});
    });
    b.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? ROUTES.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : ROUTES.length - 1)) % ROUTES.length; bar.children[j].click(); bar.children[j].focus(); });
    bar.append(b);
  });
  bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', 'Các phần nghiên cứu');
  window.showMajorTab = k => { const r = ALIAS[k]; if (r) { showMajor(r[0]); if (TABS[r[0]]) open(r[0], r[1], 'push'); return; } if (!ROUTES.some(x => x[0] === k)) k = 'mt1'; showMajor(k); if (TABS[k]) { const cur = TABS[k].find(x => !x.p.hidden) || TABS[k][0]; open(k, cur.s.k, 'push'); } else setUrl(k, null, 'push'); };
  window.addEventListener('popstate', () => route(null));
  // research-layout.js cũng nghe hashchange (chạy trước, chỉ biết tab cũ); handler này chạy sau nên quyết định cuối cùng.
  window.addEventListener('hashchange', () => route('replace'));
  route('replace');
  // Link "#<id>" tới thẻ/câu hỏi đã dời, link "?sub=…#mtN": mở đúng tab lớn + sub-tab (pushState để Back quay lại).
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (/^\?[^#]*#mt\d+$/.test(href)) { e.preventDefault(); const u = new URL(href, location.href); history.pushState({sg: 1}, '', u.pathname + u.search + u.hash); route(null); window.scrollTo({top: 0, behavior: 'instant'}); return; }
    if (!href.startsWith('#')) return;
    const id = href.slice(1); if (!id) return;
    if (/^mt\d+$/.test(id) || HASHID[id]) { e.preventDefault(); const u = new URL(location.href); u.searchParams.delete('sub'); u.searchParams.delete('section'); u.hash = id; history.pushState({sg: 1}, '', u.pathname + u.search + u.hash); route(null); return; }
    const t = document.getElementById(id); if (!t || !t.closest('.majorpane')) return;
    if (a.closest('.pp-flow') && t.closest('.sg-pane') === a.closest('.sg-pane')) { e.preventDefault(); t.scrollIntoView({behavior: 'smooth', block: 'start'}); return; }
    e.preventDefault(); goTo(id, 'push');
  });
}
// Thanh sub-tab dính ngay dưới thanh tab chính khi cuộn.
function stickySub() {
  const set = () => { const m = $('nav.majortabs'); if (!m) return; const cs = getComputedStyle(m); const top = cs.position === 'sticky' && innerWidth > 700 ? (parseFloat(cs.top) || 0) + m.offsetHeight + 4 : 0; document.documentElement.style.setProperty('--of-top', top + 'px'); };
  set(); window.addEventListener('resize', set); setTimeout(set, 1500);
}

function run() {
  if (document.body.dataset.sugarFrame) return; document.body.dataset.sugarFrame = '1';
  history.scrollRestoration = 'manual';
  const st = el('style'); st.id = 'sugar-frame-style'; st.textContent = CSS; document.head.append(st);
  stickySub();
  overview();
  picture();
  financePane();
  Object.keys(TABS).forEach(k => open(k, null));  // mỗi tab lớn luôn có đúng một sub-tab đang mở
  nav();
  $$('.sg-pane .research-grid,.sg-pane .grid.two').forEach(g => { if (!g.querySelector('.card,canvas,svg,table')) g.hidden = true; });
  [100, 600, 1500].forEach(t => setTimeout(() => window.dispatchEvent(new Event('resize')), t));
  document.documentElement.dataset.sgReady = '1';
  window.dispatchEvent(new Event('sugar:frame'));
}
if (window.SectorBoot) SectorBoot.add(1600, run);
else { const start = () => setTimeout(run, 1700); if (document.readyState === 'complete') start(); else window.addEventListener('load', start); }
})();
