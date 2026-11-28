/* Gói ngành tách từ Bán lẻ (26/11/2026): Sữa, Bia, Ô tô – Xe máy · khung 4 tab theo mẫu Điện, chép từ Ban-le/app/retail-frame.js.
   Cây tab, link cũ, chủ đề nóng đọc từ window.PKG (app/<ngành>-config.js). Thẻ được DỜI theo data-block-id;
   khối do pipeline chung dựng cho Bán lẻ (mô hình kinh doanh, heatmap…) không được lấy thì bỏ, không gom "Nội dung khác".
   URL ?sub=<khóa>#mtN, pushState + popstate cho Back/Forward. SectorBoot mốc 1200.
   28/11/2026 (khung chuẩn Điện, DASHBOARD_WORKFLOW §42): Tổng quan ngành dùng thanh .ov-nav (số 00 + tiêu đề + dòng phụ s.sub);
   đầu mỗi sub-tab có "Dữ liệu mới nhất" (.pp-asof) lấy từ s.asof() của cấu hình (quan sát mới nhất của chính sub-tab, không phải ngày build);
   thẻ dẫn là a.th-link; thẻ không dời vào cây nằm ẩn trong details.of-rest của đúng tab lớn chứa nó. Cùng một bản cho Chăn nuôi và Hàng không. */
(() => {
'use strict';
const P = window.PKG; if (!P || document.body.dataset.pkg !== P.key) return;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const block = id => $(`[data-block-id="${id}"]`);
const kpi = spark => $('#' + spark)?.closest('.kpi');
const NOTE = html => () => el('p', 'rf-note', html);
// Ngày dữ liệu: 'yyyy-mm-dd' → dd/mm/yyyy, 'yyyy-mm' → Tm/yyyy, chuỗi khác (Q3/2026, 9T/2026…) giữ nguyên.
const asofText = v => !v ? '' : /^\d{4}-\d\d-\d\d$/.test(v) ? v.slice(8, 10) + '/' + v.slice(5, 7) + '/' + v.slice(0, 4) : /^\d{4}-\d\d$/.test(v) ? 'T' + Number(v.slice(5, 7)) + '/' + v.slice(0, 4) : String(v);

const TREE = P.tree;
const ROUTES = P.routes || [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];  // Chăn nuôi: P.routes (5 tab)
const ALIAS = {mt3: ['mt2'], mt4: ['mt2', 'policy'], mt5: ['mt1'], mt6: ['mt14', 'listed'], mt8: ['mt1', 'map', 'rf-sources'], mt9: ['mt14', 'sector'], ...(P.alias || {})};
const SECTION = {policy: ['mt2', 'policy'], tax: ['mt2', 'policy'], finance: ['mt14', 'sector'], listed: ['mt14', 'listed'], companies: ['mt14', 'listed'], sources: ['mt1', 'map', 'rf-sources'], ...(P.section || {})};

function topicLinks() {
  // Chủ đề nóng: sự kiện → dòng mô hình có thể đổi → chỉ báo xác nhận → chart liên quan.
  $$('[data-block-id]').forEach(card => {
    const t = (P.topics || {})[card.dataset.blockId]; if (!t || card.querySelector('.rf-topic')) return;
    const box = el('dl', 'rf-topic', `<dt>Dòng mô hình có thể đổi</dt><dd>${esc(t[0])}</dd><dt>Chỉ báo xác nhận tiếp</dt><dd>${esc(t[1])}</dd><dt>Chart liên quan</dt><dd>${t[2].map(([h, l]) => `<a href="${h}">${esc(l)} →</a>`).join(' · ')}</dd>`);
    const src = card.querySelector(':scope>.source-note'); src ? src.before(box) : card.append(box);
  });
}

/* ---------- Dựng ---------- */
const TABS = {}, used = new Set(), BUILDS = [];
function take(sel) {
  const n = /^[a-z]+-[0-9a-z]+$/.test(sel) ? block(sel) : $(sel);  // Chăn nuôi: id khối có chữ (cn-h1, cn-s1, cn-d1)
  if (!n || used.has(n) || [...used].some(u => u.contains(n))) return null;
  used.add(n); n.hidden = false; n.classList.remove('rf-hidden-legacy'); n.style.marginTop = '';
  if (/-5\d$/.test(sel)) unfold(n);
  if ((P.wide || []).includes(sel)) n.classList.add('rf-wide');
  return n;
}
// research-layout gập mọi thẻ của tab Chính sách cũ (#mt4) vào <details>; Bức tranh ngành cần thẻ sự kiện và chart hiện sẵn → gỡ lớp gập.
function unfold(card) {
  const d = card.querySelector(':scope > details.research-fold'); if (!d) return;
  const body = d.querySelector(':scope > .research-detail');
  if (body) d.before(...body.childNodes);
  d.remove();
  card.querySelectorAll(':scope > .research-caption').forEach(n => n.remove());
  card.querySelectorAll('.research-repeated-heading').forEach(n => n.classList.remove('research-repeated-heading'));
}
function buildTab(key) {
  const def = TREE[key];
  let pane = $(`.majorpane[data-tab="${key}"]`);
  if (!pane) { pane = el('div', 'majorpane'); pane.dataset.tab = key; pane.id = 'pane-' + key; pane.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(pane); }
  const legacy = [...pane.children];
  const sec = el('section', 'section rf-section');
  if (key === 'mt1') { const brief = $('#dataBrief'); if (brief) sec.append(brief); }
  const ov = key === 'mt1';  // Tổng quan ngành: thẻ .ov-nav như Điện
  const nav = el('div', ov ? 'ov-nav' : 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', def.title); sec.append(nav);
  const subs = def.subs.map((s, i) => {
    const lab = key === 'mt1' ? String(i).padStart(2, '0') : String(i + 1).padStart(2, '0');
    const b = el('button', ov ? 'tabbtn ov-tab' : 'tabbtn pp-tab', `<span>${lab}</span>${esc(s.t)}${ov ? `<small>${esc(s.sub || s.d)}</small>` : ''}`); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = `rf-${key}-${s.k}-tab`; b.dataset.sub = s.k;
    const p = el('div', 'pp-pane rf-pane'); p.id = `rf-${key}-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    let asof = ''; try { asof = asofText(typeof s.asof === 'function' ? s.asof() : s.asof); } catch (e) { console.warn('asof', s.k, e); }
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${lab}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div><div class="rf-hside">${asof ? `<span class="pp-asof">${esc(s.asofLabel || 'Dữ liệu mới nhất')}: ${esc(asof)}</span>` : ''}<a class="rf-permalink" href="?sub=${s.k}#${key}" title="Link trực tiếp tới mục này">Link mục ↗</a></div>`));
    if (s.kpis) { const g = el('section', 'grid kpis pp-kpis'); s.kpis.forEach(sp => { const c = kpi(sp); if (c) g.append(c); }); if (g.children.length) p.append(g); }
    if (s.flow) {
      const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Luồng ' + s.t.toLowerCase());
      bar.innerHTML = s.flow.map(([id, k, t], j) => `${j ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#rf-st-${s.k}-${id}" class="pp-flow-s"><small>${k}</small><b>${esc(t)}</b></a>`).join('');
      p.append(bar);
    }
    let qn = 0;
    s.items.forEach(it => {
      if (it.grp) { p.append(el('h3', 'pp-grp', esc(it.grp))); return; }
      if (it.stage) { const f = s.flow.find(x => x[0] === it.stage); const h = el('div', 'pp-stage', `<span>${f[1]}</span><h3>${esc(f[2])}</h3>`); h.id = `rf-st-${s.k}-${f[0]}`; p.append(h); return; }
      // Thẻ dẫn (28/11/2026, chép cách Thép): khâu dùng chart nằm ở sub-tab khác thì dẫn sang, không nhân bản thẻ.
      // Chỗ chứa do module khác tự dựng câu hỏi bên trong (vd. Tài chính ngành › 01): gắn thẳng vào sub-tab, không bọc thêm câu hỏi để số câu không lặp.
      if (it.html) { p.append(it.html()); return; }
      if (it.link) { const [href, where, t, sub] = it.link; const a = el('a', 'th-link rf-xlink', `<small>Xem chart ở ${esc(where)}</small><b>${esc(t)} →</b>${sub ? `<span>${esc(sub)}</span>` : ''}`); a.href = href; p.append(a); return; }
      const panel = el('section', 'pp-panel pp-q'); panel.id = it.id;
      qn++; const pn = key === 'mt1' ? `${i}.${qn}` : `${i + 1}.${qn}`;
      panel.innerHTML = `<header class="pp-ph"><span class="pp-num">${pn}</span><div><h3>${esc(it.q)}</h3>${it.meta ? `<p class="rf-meta">${it.meta}</p>` : ''}</div></header>`;
      // 28/11/2026 (chuẩn Điện): mỗi câu đúng 1 chart trả lời chính (.pp-main) → chart phụ (.pp-sup1) → xem thêm (.pp-more; ≥2 thẻ thì lưới hai cột).
      // Mặc định theo thứ tự take: thẻ 1 = chính, thẻ 2 = phụ, còn lại = xem thêm; cấu hình có thể ghi rõ main / sup / more (mảng selector).
      const got = sels => (sels || []).map(take).filter(Boolean);
      let main, sup, more;
      if (it.main || it.sup || it.more) { main = got(it.main); sup = got(it.sup); more = got(it.more).concat(got(it.take)); }
      else { const all = got(it.take); main = all.slice(0, 1); sup = all.slice(1, 2); more = all.slice(2); }
      const grid = el('div', 'pp-main'); main.forEach(n => grid.append(n)); panel.append(grid);
      if (it.build) BUILDS.push(it.build); // chạy sau khi pane đã gắn vào trang (thẻ đang tách khỏi document)
      if (it.after) grid.append(typeof it.after === 'function' ? it.after() : el('p', 'rf-note', esc(it.after)));
      if (sup.length) { const w = el('div', 'pp-sup1'); sup.forEach(n => w.append(n)); panel.append(w); }
      (it.fold || []).forEach(([sel, label]) => { const n = take(sel); if (!n) return; const d = el('details', 'rf-fold rf-wide'); d.append(el('summary', '', esc(label)), n); more.push(d); });
      if (more.length) { const g = el('div', more.length > 1 ? 'grid two g2 pp-sup pp-more rf-grid' : 'pp-sup1 pp-more'); more.forEach(n => g.append(n)); panel.append(g); }
      p.append(panel);
    });
    const nx = def.subs[i + 1];
    if (nx) { const go = el('button', 'rf-next', `Tiếp: ${esc(nx.t)} →`); go.type = 'button'; go.addEventListener('click', () => { open(key, nx.k, 'push'); nav.scrollIntoView({behavior: 'instant', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open(key, s.k, 'push'));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const j = (i + d + def.subs.length) % def.subs.length; nav.children[j].click(); nav.children[j].focus(); });
    return {s, b, p};
  });
  TABS[key] = subs;
  return {pane, sec, legacy};
}
function commit({pane, sec, legacy}) {
  const rest = [];
  legacy.forEach(n => { if (sec.contains(n)) return; if (n.querySelector?.('[data-block-id],canvas,table,svg') || n.matches?.('[data-block-id]')) rest.push(n); });
  pane.replaceChildren(sec);
  return {sec, rest};
}
// Thẻ không dời vào cây (vd. bản trùng của chart khác, heatmap chung .fsv-heat): giữ trong DOM, ẩn ngay trong tab lớn chứa nó — không xóa.
// Heatmap .fsv-heat nằm lại pane-mt2 nên sector-visuals.js (dựng lại khi bấm tab) thấy đã có và không chèn thẻ trôi ra ngoài câu hỏi.
function stash(sec, nodes) {
  if (!nodes.length) return;
  const d = el('details', 'research-fold rf-rest of-rest'); d.hidden = true;
  d.append(el('summary', '', 'Nội dung khác của bố cục cũ'), ...nodes); sec.append(d);
}
function sources() {
  // Tab Nguồn dữ liệu cũ (#mt8, do research-layout dựng) → khối mở rộng cuối Bản đồ ngành; link cũ #mt8 mở thẳng khối này.
  const p = $('.majorpane[data-tab="mt8"]'), d = el('details', 'research-fold rf-sources rf-wide'); d.id = 'rf-sources';
  d.append(el('summary', '', 'Nguồn dữ liệu, kỳ quan sát và độ tin cậy'));
  const box = el('div', 'research-detail');
  if (p) { [...p.children].forEach(n => { if (n.matches('h2,.research-caption')) return; n.querySelectorAll('[hidden]').forEach(h => { if (h.matches('.pane-subpane')) h.hidden = false; }); n.querySelectorAll('.pane-subtabs,.supply-tabs').forEach(x => x.classList.add('rf-hidden-legacy')); if (n.matches('.pane-subtabs,.supply-tabs')) return; if (n.matches('.pane-subpane')) n.hidden = false; box.append(n); }); p.replaceChildren(); }
  const b90 = block(P.prefix + '-90'); if (b90 && !used.has(b90)) { used.add(b90); box.append(b90); }
  d.append(box); TABS.mt1[0].p.append(d);
}

function setUrl(key, sub, mode) {
  const u = new URL(location.href);
  if (sub) u.searchParams.set('sub', sub); else u.searchParams.delete('sub');
  u.searchParams.delete('section'); u.hash = key;
  const next = u.pathname + u.search + u.hash;
  if (next === location.pathname + location.search + location.hash) return;
  if (mode === 'push') history.pushState({rf: 1}, '', next); else history.replaceState(history.state, '', next);
}
function open(key, sub, mode) {
  const subs = TABS[key]; if (!subs) return;
  // Sub-tab do script khác thêm vào thanh (03 Định giá, app/peer-valuation.js; Nhựa, Ô tô 28/11/2026): bấm nút đó; chưa có thì mở 01, giữ ?sub= để script đó tự mở.
  const unknown = sub && !subs.some(x => x.s.k === sub), ext = unknown ? subs[0].b.parentElement.querySelector(`[data-sub="${sub}"]`) : null;
  if (ext) { ext.click(); return; }
  const keep = unknown && mode === 'replace';
  const hit = subs.find(x => x.s.k === sub) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.classList.toggle('active', on); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  const bar_ = hit.b.parentElement; if (bar_ && bar_.scrollWidth > bar_.clientWidth) bar_.scrollLeft = Math.max(0, hit.b.offsetLeft - 12);
  if (mode && !keep) setUrl(key, hit.s.k, mode);
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
  window.dispatchEvent(new Event('pv:toc'));
}

let bar;
function showMajor(key) {
  $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
  [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
}
// Đọc URL (vào trang, Back/Forward, đổi hash): ?section= (link cũ) > #mtN (+ ?sub=) > #<id> thẻ đã dời.
function route(mode) {
  const u = new URL(location.href), h = location.hash.slice(1), secQ = SECTION[u.searchParams.get('section')];
  let key, sub = u.searchParams.get('sub'), target = null;
  if (secQ) [key, sub, target] = secQ;
  else if (/^mt\d+$/.test(h)) { key = h; if (ALIAS[h]) [key, sub, target] = ALIAS[h]; }
  else if (h && document.getElementById(h)) return goTo(h, mode);
  else key = 'mt1';
  const sa = (P.subAlias || {})[key + '/' + sub]; if (sa) [key, sub] = sa;  // khóa sub-tab của bố cục cũ
  if (!ROUTES.some(r => r[0] === key)) key = 'mt1';
  showMajor(key);
  if (TABS[key]) open(key, sub, secQ || ALIAS[h] || sa ? 'replace' : mode);
  else setUrl(key, null, mode);
  if (target) { const t = document.getElementById(target); if (t) { if (t.matches('details')) t.open = true; setTimeout(() => t.scrollIntoView({behavior: 'instant', block: 'start'}), 80); } }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
function goTo(id, mode = 'push') {
  const t = id && document.getElementById(id); if (!t) return false;
  const pane = t.closest('.majorpane'); if (!pane) return false;
  const key = pane.dataset.tab, sub = t.closest('.rf-pane');
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
    const p = $(`.majorpane[data-tab="${key}"]`); if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); }
    b.addEventListener('click', () => {
      showMajor(key);
      if (TABS[key]) { const cur = TABS[key].find(x => !x.p.hidden) || TABS[key][0]; open(key, cur.s.k, 'push'); } else setUrl(key, null, 'push');
      window.scrollTo({top: 0, behavior: 'instant'});
    });
    b.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? ROUTES.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : ROUTES.length - 1)) % ROUTES.length; bar.children[j].click(); bar.children[j].focus(); });
    bar.append(b);
  });
  bar.setAttribute('role', 'tablist');
  window.showMajorTab = k => { location.hash = k; };
  window.addEventListener('popstate', () => route(null));
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (/^mt\d+$/.test(h)) route('replace'); else if (h) goTo(h, 'replace'); });
  route('replace');
}

function run() {
  if (document.body.dataset.rfFrame) return; document.body.dataset.rfFrame = '1';
  history.scrollRestoration = 'manual';
  // Dựng hết các tab rồi mới thay nội dung pane (tab sau còn lấy thẻ nằm trong tab cũ, vd. bl-03 ở Tổng quan cũ).
  const built = Object.keys(TREE).map(buildTab).map(commit), old = [];
  ['mt4'].forEach(k => { const p = $(`.majorpane[data-tab="${k}"]`); if (!p) return; [...p.children].forEach(n => { if (n.querySelector?.('[data-block-id]') || n.matches?.('[data-block-id]')) old.push(n); }); p.replaceChildren(); });
  sources();
  built.forEach(({sec, rest}, i) => stash(sec, i ? rest : rest.concat(old)));
  BUILDS.forEach(f => f());
  topicLinks();
  // Link "#<id>" tới thẻ/câu hỏi đã dời: mở đúng tab lớn + sub-tab rồi cuộn tới.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); if (!id || /^mt\d+$/.test(id)) return;
    const t = document.getElementById(id);
    if (!t || !t.closest('.majorpane') || a.closest('.pp-flow') && t.closest('.rf-pane') === a.closest('.rf-pane')) {
      if (t && a.closest('.pp-flow')) { e.preventDefault(); t.scrollIntoView({behavior: 'smooth', block: 'start'}); }
      return;
    }
    e.preventDefault(); goTo(id, 'push');
  });
  // Link mục (permalink) → mở tại chỗ bằng pushState để Back quay lại mục trước.
  document.addEventListener('click', e => {
    const a = e.target.closest('a.rf-permalink'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault(); const u = new URL(a.href, location.href); history.pushState({rf: 1}, '', u.pathname + u.search + u.hash); route(null);
  });
  nav();
  const setTop = () => { const t = $('.majortabs'), cs = t && getComputedStyle(t), top = cs && cs.position === 'sticky' ? t.getBoundingClientRect().height + (parseFloat(cs.top) || 0) + 6 : 0; $$('.rf-section>.pp-nav,.rf-section>.ov-nav').forEach(n => { n.style.top = top + 'px'; }); };
  setTop(); addEventListener('resize', setTop);
  document.documentElement.dataset.rfReady = '1';
  window.dispatchEvent(new Event('rf:frame'));
}
if (window.SectorBoot) SectorBoot.add(1200, run);
else if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
})();
