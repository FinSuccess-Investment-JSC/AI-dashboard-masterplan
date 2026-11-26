/* Dầu khí · khung 5 tab theo flow ngành Điện (người dùng chốt 26/11/2026).
   Tab lớn: Tổng quan ngành (00 Bản đồ ngành · 01 Chuỗi giá trị · 02 Doanh nghiệp niêm yết · 03 Triển vọng)
          · Bức tranh ngành (01 Dầu thô toàn cầu · 02 Thượng nguồn VN · 03 Khí & LNG · 04 Lọc dầu · 05 Phân phối xăng dầu · 06 Vận tải & dòng chảy)
          · Chính sách (01 Điều hành giá · 02 Luật Dầu khí 2026 · 03 Thuế & phí · 04 Quy hoạch khí & LNG)
          · Tài chính ngành (#mt14, app/oil-finance.js) · Chủ đề nóng.
   Card cũ được DỜI theo data-block-id, không nhân bản, không xóa. Card không có trong bảng dời vẫn ở lại trong tab cũ của nó,
   gom vào mục "Nội dung khác" cuối tab để không mất dữ liệu. Chạy sau research-layout / research-editorial / pane-subtabs.
   Deep-link: Dau-khi/?sub=<khóa sub-tab>#mt2 ; link cũ #mt3 → #mt2, #mt5/#mt6/#mt8 → #mt1. */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
if (!$('#chCurve')) return;  // chỉ trang Dầu khí
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const block = id => $(`[data-block-id="${id}"]`);
const byCanvas = id => $('#' + id)?.closest('.card,.viz-block');

const GAP = t => `<p class="data-gap of-gap">${t}</p>`;
const TREE = {
  mt1: {label: 'Tổng quan ngành', title: 'Tổng quan ngành dầu khí', intro: 'Nhìn để hiểu ngành: chuỗi giá trị → cơ chế lợi nhuận từng khâu → doanh nghiệp niêm yết → triển vọng.', subs: [
    {k: 'map', n: '00', t: 'Bản đồ ngành', d: 'Thượng nguồn → trung nguồn → hạ nguồn, mỗi khâu gắn mã niêm yết.', sel: ['.research-roadmap'], ids: ['dau-khi-01', 'dau-khi-04']},
    {k: 'chain', n: '01', t: 'Chuỗi giá trị', d: 'Giá dầu đi vào lợi nhuận từng khâu thế nào.', sel: ['.business-models'], ids: ['dau-khi-38', 'dau-khi-26', 'dau-khi-30', 'dau-khi-31']},
    {k: 'listed', n: '02', t: 'Doanh nghiệp niêm yết', d: 'Mô hình kinh doanh và vị trí trong chuỗi của từng mã.', ids: ['dau-khi-03', 'dau-khi-32', 'dau-khi-33', 'dau-khi-34', 'dau-khi-35'], rest: true},
    {k: 'outlook', n: '03', t: 'Triển vọng', d: 'Vị trí trong chu kỳ và chế độ thị trường hiện tại.', ids: ['dau-khi-02', 'dau-khi-14']},
  ]},
  mt2: {label: 'Bức tranh ngành', title: 'Bức tranh ngành', intro: 'Theo khâu: dầu thô toàn cầu → thượng nguồn Việt Nam → khí & LNG → lọc dầu → phân phối → vận tải & dòng chảy.', subs: [
    {k: 'crude', n: '01', t: 'Dầu thô toàn cầu', d: 'Cung OPEC+ và ngoài OPEC, cầu, tồn kho, Brent/WTI, đường cong kỳ hạn, vị thế quỹ.', ids: ['dau-khi-05', 'dau-khi-12', 'dau-khi-23', 'dau-khi-24', 'dau-khi-25', 'dau-khi-11', 'dau-khi-06', 'dau-khi-07', 'dau-khi-08', 'dau-khi-09', 'dau-khi-10', 'dau-khi-13'], canv: ['chFastPrice'], sel: ['.opec-drivers', '.inventory-group'], kpis: true},
    {k: 'upstream', n: '02', t: 'Thượng nguồn VN', d: 'Sản lượng khai thác dầu và khí, chuỗi dự án và dòng khí đầu tiên.', ids: ['dau-khi-15', 'dau-khi-19'],
      gap: 'Chưa có chuỗi giá thuê và tỷ lệ sử dụng giàn khoan Đông Nam Á theo thời gian; số của PVD đang ở thẻ PVD (Tổng quan › Doanh nghiệp niêm yết).'},
    {k: 'gas', n: '03', t: 'Khí & LNG', d: 'Khí vào bờ, LNG nhập khẩu và vị trí của PV GAS.', ids: ['dau-khi-16', 'dau-khi-17'],
      gap: 'Chưa có chuỗi giá LNG JKM và giá khí bán theo từng hợp đồng trên trang này; JKM đang ở dashboard Điện.'},
    {k: 'refining', n: '04', t: 'Lọc dầu', d: 'Crack spread Singapore và Mỹ, giá sản phẩm, cân đối hai nhà máy lọc dầu.', ids: ['dau-khi-singapore-crack', 'dau-khi-20', 'dau-khi-21', 'dau-khi-18'],
      gap: 'Biên lọc dầu thực tế của BSR không công bố theo tháng; crack Singapore so Dubai là proxy.'},
    {k: 'retail', n: '05', t: 'Phân phối xăng dầu', d: 'Giá bán lẻ trong nước theo kỳ điều hành.', ids: ['dau-khi-22'],
      gap: 'Chưa có chuỗi sản lượng tiêu thụ xăng dầu, số dư Quỹ bình ổn và mức chiết khấu đại lý.'},
    {k: 'flows', n: '06', t: 'Vận tải & dòng chảy', d: 'Lưu lượng tàu qua Hormuz, Bab el-Mandeb và xuất khẩu dầu thô Trung Đông.', ids: ['dau-khi-37', 'dau-khi-41', 'dau-khi-40']},
  ]},
  mt4: {label: 'Chính sách', title: 'Chính sách', intro: 'Điều hành giá, Luật Dầu khí, thuế phí và quy hoạch khí & LNG: tác động lên từng khâu.', subs: [
    {k: 'price', n: '01', t: 'Điều hành giá', d: 'Cơ chế điều hành giá xăng dầu và tác động trong quý.', canv: ['chPolicyPremium', 'chPolicyChange'], ids: ['dau-khi-27'], rest: true},
    {k: 'law', n: '02', t: 'Luật Dầu khí 2026', d: 'Tác động ở đầu nguồn chu kỳ đầu tư.', ids: ['dau-khi-28']},
    {k: 'tax', n: '03', t: 'Thuế & phí', d: 'Thuế bảo vệ môi trường, thuế nhập khẩu, xăng E10.', ids: [],
      gap: 'Chưa có dữ liệu: biểu thuế bảo vệ môi trường, thuế nhập khẩu xăng dầu theo nguồn (FTA/MFN) và lộ trình E10 chưa được dựng thành bảng có nguồn.'},
    {k: 'lng', n: '04', t: 'Quy hoạch khí & LNG', d: 'Quy hoạch hạ tầng khí, kho cảng LNG và điện khí.', ids: [],
      gap: 'Chưa có dữ liệu: danh mục kho cảng LNG và tiến độ theo quy hoạch chưa được dựng. Pipeline điện LNG đang ở dashboard Điện (Chủ đề nóng); chuỗi dự án khí ở Bức tranh ngành › 02 Thượng nguồn VN.'},
  ]},
};
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt4', 'Chính sách'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
const ALIAS = {mt3: 'mt2', mt5: 'mt1', mt6: 'mt1', mt8: 'mt1', mt10: 'mt2'};

function style() {
  const st = el('style'); st.id = 'oil-frame-style';
  st.textContent = `.of-nav{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:12px 0 20px;counter-reset:x}
.of-nav button{position:relative;display:flex;flex-direction:row;align-items:center;gap:8px;text-align:left;padding:12px 16px;border:1px solid var(--line,#e3e7f0);border-radius:12px;background:var(--card,#fff);font:inherit;color:var(--ink2,#3b4256);cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.of-nav button:hover{border-color:#2938A8;box-shadow:0 4px 14px rgba(41,56,168,.12);transform:translateY(-1px)}
.of-nav button:not(:last-child)::after{content:'→';position:absolute;right:-11px;top:50%;transform:translateY(-50%);font-size:13px;color:#9aa3c7;z-index:1}
.of-nav .of-n{font:700 12px Inter,sans-serif;color:#2938A8;letter-spacing:.04em}
.of-nav b{font:700 16px Inter,sans-serif;color:var(--ink,#1f2a5c)}
.of-nav small{font-size:12.5px;line-height:1.45;color:var(--muted,#6b7280);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.of-nav button[aria-selected=true]{background:#2938A8;border-color:#2938A8;box-shadow:0 6px 18px rgba(41,56,168,.25)}
.of-nav button[aria-selected=true] *{color:#fff!important}.of-nav button[aria-selected=true] small{opacity:.85}
.of-next{display:block;margin:24px 0 0 auto;padding:10px 18px;border:1px solid #2938A8;border-radius:999px;background:none;color:#2938A8;font:600 14px Inter,sans-serif;cursor:pointer}.of-next:hover{background:#2938A8;color:#fff}
@media (max-width:700px){.of-nav{grid-template-columns:1fr 1fr}.of-nav button::after{display:none}}
.of-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin:4px 0 12px;padding:10px 0;border-bottom:1px solid var(--line,#e3e7f0)}
.of-head h2{margin:0;font-size:24px}.of-head .of-k{font:500 13px Inter,sans-serif;color:var(--muted,#7a8399);margin-right:8px}.of-head p{margin:4px 0 0;color:var(--ink2,#3b4256)}
.of-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}.of-body>*{min-width:0;margin:0!important}
.of-body>.of-wide,.of-body>.of-gap,.of-body>details,.of-body>.kpis,.of-body>.research-grid,.of-body>table,.of-body>.tablewrap{grid-column:1/-1}
@media (max-width:900px){.of-body{grid-template-columns:minmax(0,1fr)}}
.of-gap{padding:10px 12px;border:1px dashed var(--line,#d6dbe8);border-radius:10px;color:var(--muted,#6b7280);font-size:13px}
.of-rest>summary{cursor:pointer;font-weight:600}.of-pane .research-roadmap>h2{display:none}.of-hidden-legacy{display:none!important}`;
  document.head.append(st);
}

function wideIfTable(n) {
  if (!n.matches?.('.card')) return;
  const charts = n.querySelectorAll('[id^="ch"]').length;
  if (charts > 1 || (!charts && !n.querySelector('canvas,svg') && n.querySelector('table'))) n.classList.add('of-wide');
}

function buildTab(key) {
  const def = TREE[key], pane = $(`.majorpane[data-tab="${key}"]`);
  if (!pane) return;
  const legacy = [...pane.children];
  const sec = el('section', 'section of-section');
  const brief = key === 'mt1' && $('#dataBrief'); if (brief) sec.append(brief);
  sec.append(el('div', 'sectionhead', `<div><h2 class="sec">${def.title}</h2></div>`));
  const nav = el('div', 'of-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', def.title); sec.append(nav);
  const used = new Set();
  const subs = def.subs.map((s, i) => {
    const b = el('button', '', `<span class="of-n">${String(i + 1).padStart(2, '0')}</span><b>${s.t}</b>`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `of-${key}-${s.k}-tab`;
    const p = el('div', 'pane-subpane of-pane'); p.id = `of-${key}-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
        const body = el('div', 'of-body'); p.append(body);
    if (s.kpis) { const k = $('.majorpane[data-tab="mt2"] .kpis'); if (k) { body.append(k); used.add(k); } }
    const put = n => { if (!n || used.has(n) || [...used].some(u => u.contains?.(n))) return; body.append(n); used.add(n); wideIfTable(n); };
    (s.canv || []).forEach(c => put(byCanvas(c)));
    (s.sel || []).forEach(q => $$(q).forEach(n => { put(n); n.classList.add('of-wide'); }));
    s.ids.forEach(id => put(block(id)));
    if (s.gap) body.insertAdjacentHTML('beforeend', GAP(s.gap));
    if (!body.children.length) body.insertAdjacentHTML('beforeend', GAP('Chưa có dữ liệu cho mục này.'));
    const nx = def.subs[i + 1]; if (nx) { const go = el('button', 'of-next', `Tiếp: ${nx.t} →`); go.type = 'button'; go.addEventListener('click', () => { open(key, nx.k, true); nav.scrollIntoView({behavior: 'smooth', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open(key, s.k, true));
    return {s, b, p, body};
  });
  // Phần còn lại của tab cũ: thẻ có data-block-id chưa dời + khối nội dung khác. Không xóa: gom vào "Nội dung khác".
  const restHost = subs.find(x => x.s.rest) || subs[0];
  const restItems = [];
  legacy.forEach(n => {
    if (sec.contains(n)) return;
    if (n.matches('.sectionhead')) { n.classList.add('of-hidden-legacy'); return; }
    if (n.matches('.pane-subtabs,.supply-tabs,.world-subtabs,[role=tablist]')) { n.classList.add('of-hidden-legacy'); return; }
    // Chỉ giữ khối có dữ liệu (thẻ, chart, bảng); câu dẫn/đường dẫn của bố cục cũ bỏ.
    if (n.matches?.('[data-block-id]') || n.querySelector?.('[data-block-id],canvas,table,svg')) restItems.push(n);
  });
  if (restItems.length) {
    const d = el('details', 'research-fold of-rest of-wide'); d.append(el('summary', '', 'Nội dung khác của tab cũ'));
    const box = el('div', 'research-detail'); restItems.forEach(n => { n.hidden = false; n.querySelectorAll('[hidden]').forEach(h => { if (h.matches('.supply-pane,.pane-subpane,[role=tabpanel]')) h.hidden = false; }); box.append(n); });
    d.append(box); restHost.body.append(d);
    // Tab con cũ rỗng (khung sub-tab không còn card nào) thì ẩn.
    box.querySelectorAll('.supply-pane,.pane-subpane').forEach(x => { if (!x.querySelector('[data-block-id],canvas,svg,table,.card')) x.classList.add('of-hidden-legacy'); });
    if (!box.querySelector('[data-block-id],canvas,svg,table,.card')) d.remove();
  }
  pane.replaceChildren(sec);
  TABS[key] = subs;
}
const TABS = {};
function open(key, sub, push) {
  const subs = TABS[key]; if (!subs) return;
  const hit = subs.find(x => x.s.k === sub) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  if (push) { const u = new URL(location.href); u.searchParams.set('sub', hit.s.k); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}

function financePane() {
  let p = $('.majorpane[data-tab="mt14"]');
  if (!p) { p = el('section', 'majorpane'); p.dataset.tab = 'mt14'; p.id = 'pane-mt14'; p.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(p); }
  const sec = el('section', 'section');
  sec.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>Số liệu tài chính của 12 doanh nghiệp dầu khí niêm yết, tổng hợp theo khâu, từ BCTC hợp nhất quý.</p></div>'));
  const host = el('div', 'of-fin'); host.id = 'dk-fin-root'; sec.append(host); p.replaceChildren(sec);
  // So sánh tài chính & định giá (chart xu hướng + bảng) thuộc Tài chính ngành; Tổng quan chỉ giữ mô hình kinh doanh.
  const fc = $('.financial-comparison'); if (fc) { const was = fc.closest('.of-rest'); sec.append(fc); fc.classList.add('of-wide'); if (was && !was.querySelector('[data-block-id],canvas,svg,table,.card')) was.remove(); }
  return host;
}

function nav(finHost) {
  const bar = $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  let built = false;
  const select = (key, hash) => {
    key = ALIAS[key] || key; if (!ROUTES.some(r => r[0] === key)) key = 'mt1';
    $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
    [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    if (key === 'mt14' && !built && window.OilFinance) { built = true; window.OilFinance.build(finHost); }
    if (hash) { const u = new URL(location.href); if (!TABS[key]) u.searchParams.delete('sub'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
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
  window.showMajorTab = k => select(k, true);
  window.addEventListener('hashchange', () => select(location.hash.slice(1)));
  const key = select(location.hash.slice(1) || 'mt1');
  if (TABS[key]) open(key, new URL(location.href).searchParams.get('sub'));
  // Link trỏ vào thẻ đã dời: mở đúng tab lớn + sub-tab rồi cuộn tới.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t || t.matches('.majorpane')) return;
    const pane = t.closest('.majorpane'), sub = t.closest('.of-pane');
    if (!pane) return; e.preventDefault();
    select(pane.dataset.tab, true); if (sub) open(pane.dataset.tab, sub.dataset.sub, true);
    setTimeout(() => t.scrollIntoView({behavior: 'smooth', block: 'start'}), 120);
  });
}

function run() {
  if (document.body.dataset.oilFrame) return; document.body.dataset.oilFrame = '1';
  style();
  // Hormuz: thẻ đang nằm trong chủ đề "Hormuz · dòng chảy & tác động" ở Chủ đề nóng → Bức tranh ngành › 06.
  ['mt1', 'mt2', 'mt4'].forEach(buildTab);
  // Thẻ truyền dẫn dau-khi-38 nằm cùng chủ đề Hormuz; đã dời sang Tổng quan › 01. Chủ đề rỗng thì ẩn.
  // Chủ đề Hormuz giữ lại (ghi chú chuyên viên lưu theo chủ đề), thêm đường dẫn tới số liệu đã chuyển.
  $$('.majorpane[data-tab="mt7"] .research-topic').forEach(t => {
    if (!/Hormuz/.test(t.textContent) || t.querySelector('.of-moved')) return;
    const a = el('p', 'research-caption of-moved', 'Biểu đồ Hormuz, Bab el-Mandeb và xuất khẩu dầu Trung Đông đã chuyển sang <a href="#of-mt2-flows">Bức tranh ngành › 06 Vận tải & dòng chảy</a>; năm kênh truyền dẫn ở <a href="#of-mt1-chain">Tổng quan › 01 Chuỗi giá trị</a>.');
    (t.querySelector('details.research-fold > :not(summary)') || t).prepend(a);
  });
  const finHost = financePane();
  nav(finHost);
  // Tab Sources không còn trong thanh tab (nguồn đã ghi dưới từng chart, như Điện); nội dung vẫn trong DOM.
  window.dispatchEvent(new Event('oil:frame'));
}
const start = () => setTimeout(run, 1700);  // sau các module dời khối theo hẹn giờ (≤ 1500 ms)
if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
