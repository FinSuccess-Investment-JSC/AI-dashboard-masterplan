/* Lớp "thông minh" dùng chung cho mọi dashboard ngành (28/10/2026):
   - Bảng điều khiển đầu trang: kết luận + chiều nghiêng từng nhóm mã + tín hiệu ưu tiên, lấy từ window.SECTOR_BRIEF (catalyst-board.js)
   - Ngăn trượt khi bấm mã cổ phiếu: định giá (COMPANY_VALUATION), nhóm, các khối có nhắc tới mã
   - Mục lục tab đang mở + tìm nhanh ⌘K / "/" trên mọi tab
   Không tính số mới; chỉ đọc lại số đã hiển thị. Trang Điện bổ sung ma trận riêng qua assets/power-hub.js. */
(() => {
'use strict';
const V = new Proxy({}, {get: (_, k) => window.COMPANY_VALUATION?.companies?.[k]});
const nf = (v, d = 1) => v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
const dm = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '';
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const TICK = /\b[A-Z][A-Z0-9]{2}\b/g;

/* ---------- Điều hướng: mở đúng tab, tab con rồi cuộn tới, nháy sáng ---------- */
function goTo(target) {
  if (typeof target === 'string') target = document.getElementById(target) || document.querySelector(`[data-block-id="${target}"]`);
  if (!target) return;
  const pane = target.closest('.majorpane');
  if (pane && !pane.classList.contains('active')) document.querySelector(`.majortabbtn[data-tab="${pane.dataset.tab}"]`)?.click();
  for (let k = 0; k < 4; k++) {
    const h = target.closest('[hidden]'); if (!h) break;
    const b = document.getElementById(h.getAttribute('aria-labelledby') || ''); if (!b) break; b.click();
  }
  const box = target.closest('.card, section') || target;
  setTimeout(() => { box.scrollIntoView({behavior: 'smooth', block: 'start'}); box.classList.remove('pv-flash'); void box.offsetWidth; box.classList.add('pv-flash'); }, 220);
}

/* ---------- Nhóm mã: từ chiều nghiêng Catalyst và thẻ "kiếm tiền thế nào" ---------- */
const TILT = {up: ['▲', 'Thuận', 'pos'], down: ['▼', 'Nghịch', 'neg'], flat: ['■', 'Trung tính', 'neu'], na: ['·', 'Thiếu số', 'na']};
function groups() {
  const out = [];
  (window.SECTOR_BRIEF?.segs || []).forEach(([name, tick, tilt, why]) => out.push({name, codes: String(tick || '').match(TICK) || [], tilt, why, src: 'brief'}));
  document.querySelectorAll('article.business-model').forEach(a => {
    const name = a.querySelector('h3')?.textContent.trim(); if (!name) return;
    const codes = [...a.querySelectorAll('.fs-chip, .pv-chip')].map(c => c.textContent.trim()).filter(t => /^[A-Z][A-Z0-9]{2}$/.test(t));
    const txt = a.querySelector('.business-ticker')?.textContent.match(TICK) || [];
    out.push({name, codes: [...new Set([...codes, ...txt])], src: 'model', el: a});
  });
  return out;
}
const known = () => new Set([...groups().flatMap(g => g.codes), ...Object.keys(window.COMPANY_VALUATION?.companies || {}).filter(k => document.body.textContent.includes(k))]);

/* ---------- Bảng điều khiển đầu trang ---------- */
function hub() {
  const B = window.SECTOR_BRIEF, tabs = document.querySelector('.majortabs');
  if (!B?.headline || !tabs || document.querySelector('.pv-hub')) return;
  const segs = (B.segs || []).filter(s => s[0]);
  const order = ['risk', 'good', 'watch', 'info', 'na'], st = {good: ['Catalyst', 'pos'], risk: ['Rủi ro', 'neg'], watch: ['Sát ngưỡng', 'warn'], info: ['Bối cảnh', 'neu'], na: ['Thiếu số', 'na']};
  const sig = [...(B.score || [])].filter(r => r.st !== 'na').sort((a, b) => order.indexOf(a.st) - order.indexOf(b.st)).slice(0, 6);
  const h = el('section', 'pv-hub');
  h.innerHTML = `<div class="pv-hub-head"><div><span class="pv-hub-k">${esc(document.querySelector('h1')?.textContent.trim() || 'Ngành')} hôm nay</span><h2>${esc(B.headline)}</h2>
      <a href="#" class="pv-to-cat">Xem lập luận ở Catalyst →</a></div>
      <div class="pv-hub-tools"><button type="button" class="pv-open-search">Tìm nhanh <kbd>⌘K</kbd></button></div></div>
    ${segs.length ? `<div class="pv-segs">${segs.map(([name, tick, tilt, why], i) => { const t = TILT[tilt] || TILT.na, codes = String(tick || '').match(TICK) || []; return `<div class="pv-seg ${t[2]}"><div class="pv-seg-top"><b>${esc(name)}</b><span>${t[0]} ${t[1]}</span></div><p>${esc(why || '')}</p><div class="pv-seg-codes">${codes.map(c => `<button type="button" class="pv-chip" data-code="${c}">${c}</button>`).join('')}</div></div>`; }).join('')}</div>` : ''}
    ${sig.length ? `<div class="pv-sigs">${sig.map((r, i) => `<button type="button" class="pv-sig ${st[r.st]?.[1] || ''}" data-i="${i}"><em>${st[r.st]?.[0] || ''}</em><b>${esc(r.name)}</b><strong>${esc(r.big?.[0] || r.mid?.[0] || '—')}</strong><small>${esc(r.mid?.[1] || '')}</small>${r.end?.[0] ? `<span>${esc(String(r.end[0]))}</span>` : ''}</button>`).join('')}</div>` : ''}`;
  tabs.before(h);
  h.querySelector('.pv-to-cat').onclick = e => { e.preventDefault(); goTo(document.querySelector('.cr-verdict')); };
  h.querySelector('.pv-open-search').onclick = () => palette(true);
  h.querySelectorAll('.pv-sig').forEach(b => b.onclick = () => { const r = sig[+b.dataset.i]; goTo(r.chart && document.getElementById(r.chart) || document.querySelector('.cr-score')); });
}

/* ---------- Ngăn trượt theo mã ---------- */
let dr = null;
const S = window.SectorSmart = {goTo, palette: o => palette(o), drawerExtra: null, index: [], openCode: null};
function drawer(code) {
  if (S.openCode && S.openCode(code)) return;  // trang có ngăn riêng (Điện)
  if (!dr) {
    dr = el('aside', 'pv-drawer'); dr.setAttribute('aria-label', 'Chi tiết mã'); dr.tabIndex = -1;
    const scrim = el('div', 'pv-scrim'); scrim.onclick = closeDrawer;
    document.body.append(dr, scrim);
  }
  const v = V[code], gs = groups().filter(g => g.codes.includes(code));
  const seen = new Set(), hits = [...document.querySelectorAll('.majorpane .card, .majorpane .business-model, .cr-score')].filter(c => {
    if (c.closest('.financial-comparison') || !new RegExp(`\\b${code}\\b`).test(c.textContent)) return false;
    const t = (c.querySelector('.chart-title, h3, h2')?.textContent || '').replace(/[ⓘ↗]/g, '').trim(); if (!t || seen.has(t)) return false; seen.add(t); return true;
  }).slice(0, 8);
  const brief = gs.filter(g => g.src === 'brief'), model = gs.find(g => g.src === 'model');
  dr.innerHTML = `<header style="--c:#2938A8"><div><span class="pv-chip">${code}</span><h3>${esc(model?.name || brief[0]?.name || '')}</h3></div><button type="button" class="pv-x" aria-label="Đóng">✕</button></header>
    ${v ? `<div class="pv-dr-stats"><div><b>${nf(v.close, 2)}</b><span>giá (nghìn đ)</span></div><div><b>${nf(v.market_cap / 1000, 1)}</b><span>vốn hóa (nghìn tỷ)</span></div><div><b>${v.pe > 0 ? nf(v.pe, 1) + 'x' : '—'}</b><span>P/E</span></div><div><b>${v.pb > 0 ? nf(v.pb, 2) + 'x' : '—'}</b><span>P/B</span></div></div>
      <div class="pv-dr-src">Phiên ${dm(v.date)} · <a href="${v.source_url}" target="_blank" rel="noopener">VNDirect dstock</a></div>` : ''}
    ${brief.length ? `<h4>Nhóm đang nghiêng về</h4><div class="pv-dr-mx">${brief.map(g => { const t = TILT[g.tilt] || TILT.na; return `<button type="button" class="${t[2]}" data-cat><b>${esc(g.name)}</b><span>${esc(g.why || '')}</span><em>${t[0]} ${t[1]}</em></button>`; }).join('')}</div>` : ''}
    ${S.drawerExtra ? S.drawerExtra(code) : ''}
    ${model ? `<h4>Cùng nhóm</h4><div class="pv-dr-codes">${model.codes.filter(k => k !== code).map(k => `<button type="button" class="pv-chip" data-code="${k}">${k}${V[k]?.pe > 0 ? ` <small>${nf(V[k].pe, 1)}x</small>` : ''}</button>`).join('')}</div>` : ''}
    ${hits.length ? `<h4>Nhắc tới ở</h4><div class="pv-dr-links">${hits.map((c, i) => `<button type="button" data-hit="${i}">${esc((c.querySelector('.chart-title, h3, h2').textContent || '').replace(/[ⓘ↗]/g, '').trim().slice(0, 70))} <span>→</span></button>`).join('')}</div>` : ''}
    ${document.querySelector('.financial-comparison') ? `<button type="button" class="pv-dr-cmp">So sánh tài chính ${code} với cả ngành →</button>` : ''}`;
  dr.querySelector('.pv-x').onclick = closeDrawer;
  dr.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { closeDrawer(); goTo(document.querySelector('.cr-verdict')); });
  dr.querySelectorAll('[data-hit]').forEach(b => b.onclick = () => { closeDrawer(); goTo(hits[+b.dataset.hit]); });
  dr.querySelector('.pv-dr-cmp')?.addEventListener('click', () => compare(code));
  document.body.classList.add('pv-drawer-open'); dr.focus();
}
function closeDrawer() { document.body.classList.remove('pv-drawer-open'); }
function compare(code) {
  closeDrawer(); const sec = document.querySelector('.financial-comparison'); goTo(sec);
  const inp = sec?.querySelector('input[type="search"], input[type="text"]'); if (inp) { inp.value = code; inp.dispatchEvent(new Event('input', {bubbles: true})); }
}
S.drawer = drawer; S.closeDrawer = closeDrawer; S.compare = compare;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
document.addEventListener('click', e => {
  const t = e.target.closest('.fs-chip, .pv-chip, .pv-co header, [data-code]');
  if (!t || t.closest('.vc2, .pv-mx, .pv-view')) return;
  const code = (t.dataset.code || t.textContent).trim().match(/^[A-Z][A-Z0-9]{2}/)?.[0];
  if (code && (V[code] || known().has(code))) { e.preventDefault(); e.stopPropagation(); drawer(code); }
}, true);

/* ---------- Mục lục + tìm nhanh ---------- */
function blocksOf(root) {
  return [...root.querySelectorAll('.sectionhead h2, h3.subhead, .card .chart-title, .card > h3, .business-models > h2, .cr-verdict')].filter(h => !h.closest('.pv-hub, .pv-drawer, .cr-verdict h3 ~ *')).map(h => {
    const box = h.closest('.card, section, .business-models') || h;
    const label = h.classList.contains('cr-verdict') ? 'Kết luận Catalyst' : h.textContent.replace(/[ⓘ↗]/g, '').replace(/\s+/g, ' ').trim();
    return {box, label: label.slice(0, 80), lvl: h.matches('.sectionhead h2, .business-models > h2') ? 1 : h.matches('.subhead') ? 2 : 3};
  }).filter((x, i, a) => x.label && a.findIndex(y => y.label === x.label) === i);
}
function toc() {
  if (document.querySelector('.pv-toc')) return;
  const box = el('nav', 'pv-toc'); box.setAttribute('aria-label', 'Mục lục tab đang mở');
  const fab = el('div', 'pv-fab', '<button type="button" class="pv-fab-toc">☰ Mục lục</button><button type="button" class="pv-fab-k">⌕ Tìm <kbd>⌘K</kbd></button>');
  document.body.append(box, fab);
  let list = [];
  const build = () => {
    const pane = document.querySelector('.majorpane.active'); if (!pane) return;
    list = blocksOf(pane);
    box.innerHTML = `<div class="pv-toc-h">${esc(document.querySelector('.majortabbtn[aria-selected="true"]')?.textContent || 'Mục lục')}</div>` + list.map((x, i) => `<a href="#" data-i="${i}" class="l${x.lvl}">${esc(x.label)}</a>`).join('');
    box.querySelectorAll('a').forEach(a => a.onclick = e => { e.preventDefault(); goTo(list[+a.dataset.i].box); document.body.classList.remove('pv-toc-open'); });
  };
  const spy = () => { let cur = -1; list.forEach((x, i) => { const r = x.box.getBoundingClientRect(); if (r.height && r.top < 160) cur = i; }); box.querySelectorAll('a').forEach((a, i) => a.classList.toggle('on', i === cur)); };
  build(); addEventListener('scroll', spy, {passive: true});
  document.addEventListener('click', e => {
    if (e.target.closest('.majortabbtn, .pane-subtabs button, .supply-tabs button')) setTimeout(build, 150);
    if (!e.target.closest('.pv-toc, .pv-fab')) document.body.classList.remove('pv-toc-open');
  });
  fab.querySelector('.pv-fab-toc').onclick = () => { build(); document.body.classList.toggle('pv-toc-open'); };
  fab.querySelector('.pv-fab-k').onclick = () => palette(true);
}
let pal = null;
function palette(open) {
  if (!pal) {
    pal = el('div', 'pv-pal', '<div class="pv-pal-box" role="dialog" aria-label="Tìm nhanh"><input type="search" placeholder="Gõ mã cổ phiếu, chỉ số hoặc chủ đề…" aria-label="Tìm nhanh"><div class="pv-pal-list" role="listbox"></div><div class="pv-pal-foot">↑↓ chọn · Enter mở · Esc đóng</div></div>');
    document.body.append(pal);
    const inp = pal.querySelector('input'), list = pal.querySelector('.pv-pal-list');
    let res = [], sel = 0;
    const index = () => [
      ...[...known()].sort().map(k => ({t: k, sub: (groups().find(g => g.codes.includes(k))?.name || '') + (V[k]?.pe > 0 ? ` · P/E ${nf(V[k].pe, 1)}x` : ''), kind: 'Mã', run: () => drawer(k)})),
      ...S.index,
      ...(window.SECTOR_BRIEF?.score || []).map(r => ({t: r.name, sub: (r.big?.[0] || r.mid?.[0] || '') + ' ' + (r.mid?.[1] || ''), kind: 'Tín hiệu', run: () => goTo(r.chart && document.getElementById(r.chart) || document.querySelector('.cr-score'))})),
      ...[...document.querySelectorAll('.majorpane')].flatMap(p => { const tab = document.querySelector(`.majortabbtn[data-tab="${p.dataset.tab}"]`)?.textContent || ''; return blocksOf(p).map(x => ({t: x.label, sub: tab, kind: 'Khối', run: () => goTo(x.box)})); })
    ].filter((x, i, a) => x.t && a.findIndex(y => y.t === x.t && y.kind === x.kind) === i);
    const draw = () => {
      const q = fold(inp.value.trim()), all = index();
      res = (q ? all.filter(x => fold(x.t + ' ' + x.sub).includes(q)).sort((a, b) => fold(b.t).startsWith(q) - fold(a.t).startsWith(q)) : all.filter(x => x.kind !== 'Khối')).slice(0, 14);
      sel = 0;
      list.innerHTML = res.length ? res.map((x, i) => `<div role="option" class="${i ? '' : 'on'}" data-i="${i}"><em>${x.kind}</em><b>${esc(x.t)}</b><span>${esc(x.sub)}</span></div>`).join('') : '<p>Không có kết quả</p>';
      list.querySelectorAll('[data-i]').forEach(d => d.onclick = () => pick(+d.dataset.i));
    };
    const pick = i => { const x = res[i]; if (!x) return; palette(false); x.run(); };
    inp.addEventListener('input', draw);
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % Math.max(1, res.length); list.querySelectorAll('[data-i]').forEach((d, i) => d.classList.toggle('on', i === sel)); list.children[sel]?.scrollIntoView({block: 'nearest'}); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(sel); } else if (e.key === 'Escape') palette(false);
    });
    pal.addEventListener('click', e => { if (e.target === pal) palette(false); });
    pal._draw = draw;
  }
  pal.classList.toggle('open', open);
  if (open) { const i = pal.querySelector('input'); i.value = ''; pal._draw(); setTimeout(() => i.focus(), 20); }
}
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette(!pal?.classList.contains('open')); }
  else if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]')) { e.preventDefault(); palette(true); }
});

function run() { if (document.body.dataset.sector !== 'power') hub(); toc(); }
if (document.readyState === 'complete') setTimeout(run, 700); else addEventListener('load', () => setTimeout(run, 700));
})();
