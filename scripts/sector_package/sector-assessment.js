/* Đánh giá ngành · khối đầu tab Tổng quan ngành (thay vị trí "Bản tin dữ liệu" #dataBrief, phía trên Bản đồ ngành). Thí điểm Bán lẻ 28/11/2026.
   Bản gốc: scripts/sector_package/sector-assessment.js (+ .css) → chép vào <Ngành>/app/. DASHBOARD_WORKFLOW §52.
   - Cấu hình đăng chung: data/sector-assessment/<data-sector>.json (đọc lúc mở trang, cache: no-cache). Mỗi ngành một file.
     (Dự phòng: window.SECTOR_ASSESSMENT[<sector>] nếu trang còn nạp file .js cũ.)
   - Nội dung: điểm + quan điểm ngành (Tích cực / Trung lập / Tiêu cực), luận điểm, catalyst quan trọng.
   - Chỉnh trên web: ?edit=1 bật nút "Chỉnh đánh giá" (nhớ trên trình duyệt; ?edit=0 tắt).
       · "Lưu nháp": IndexedDB `finsuccess-research` (store entries, id "<sector>:assessment:config") — chỉ trình duyệt đó.
       · "Đăng lên web": ghi file JSON của ngành vào repo GitHub qua API (token GitHub của người đăng, cần quyền ghi repo
         = quyền chỉnh). GitHub Pages dựng lại sau ~1–2 phút thì mọi người thấy. Token chỉ gửi tới api.github.com.
       · Bản trên repo đổi rev so với lúc mở trang → hỏi trước khi ghi đè.
   - Đích nút hành động: "?sub=<k>#mtN" (tab/sub-tab), "#<id>" (câu hỏi/thẻ/biểu đồ có id), hoặc URL http(s) ngoài. Trống → ẩn nút. */
(() => {
'use strict';
const sector = document.body?.dataset.sector; if (!sector) return;
const SCRIPT = document.currentScript?.src || location.href;
const DATA_PATH = `data/sector-assessment/${sector}.json`;
const DATA_URL = new URL('../../' + DATA_PATH, SCRIPT).href;
// Repo đăng: suy từ địa chỉ GitHub Pages (<owner>.github.io/<repo>/), máy local dùng repo chính.
const REPO = (() => { const m = location.hostname.match(/^([^.]+)\.github\.io$/i), seg = location.pathname.split('/')[1]; return m && seg ? `${m[1]}/${seg}` : 'FinSuccess-Investment-JSC/AI-dashboard-masterplan'; })();
const BRANCH = 'main';
const KEY = sector + ':assessment:config', VIEW_KEY = 'fs-assessment-view:' + sector, EDIT_KEY = 'fs-assessment-editor', TOKEN_KEY = 'fs-assessment-gh-token';
const STANCE = {positive: {t: 'Tích cực', icon: 'bull'}, neutral: {t: 'Trung lập', icon: 'flat'}, negative: {t: 'Tiêu cực', icon: 'bear'}};
const CSTATUS = {upcoming: 'Sắp tới', ongoing: 'Đang diễn ra', done: 'Đã xảy ra'};
const RATIOS = {'1-2': ['1/3 – 2/3', '1fr 2fr'], '2-3': ['2/5 – 3/5', '2fr 3fr'], '1-1': ['1/2 – 1/2', '1fr 1fr'], '1-3': ['1/4 – 3/4', '1fr 3fr']};
const ICON = {
  bull: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4.5c.4 2.6 2 4.2 4.6 4.4M21 4.5c-.4 2.6-2 4.2-4.6 4.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 8.6c1.4-.8 3-1.1 5-1.1s3.6.3 5 1.1l-.9 6.6c-.3 2.4-2 4.3-4.1 4.3s-3.8-1.9-4.1-4.3z" fill="currentColor"/><circle cx="10.2" cy="12" r=".9" fill="#fff"/><circle cx="13.8" cy="12" r=".9" fill="#fff"/><ellipse cx="12" cy="16.6" rx="2.3" ry="1.4" fill="#fff" opacity=".85"/></svg>',
  flat: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10.3" width="16" height="3.4" rx="1.7" fill="currentColor"/></svg>',
  bear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.3" cy="6.6" r="2.7" fill="currentColor"/><circle cx="17.7" cy="6.6" r="2.7" fill="currentColor"/><circle cx="12" cy="13" r="7.3" fill="currentColor"/><circle cx="9.4" cy="11.6" r=".9" fill="#fff"/><circle cx="14.6" cy="11.6" r=".9" fill="#fff"/><ellipse cx="12" cy="15.6" rx="2.6" ry="1.9" fill="#fff" opacity=".85"/><circle cx="12" cy="15" r=".8" fill="currentColor"/></svg>'
};
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const clone = o => JSON.parse(JSON.stringify(o));
const dmy = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d.split('-').reverse().join('/') : (d || '');
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtScore = v => (Math.round(Number(v) * 10) / 10).toLocaleString('vi-VN');
const isExternal = t => /^https?:\/\//i.test(t || '');

const BLANK = {schema: 1, rev: '', status: 'illustration', score: null, scoreMax: 10, stance: 'neutral', period: '', updated: '',
  view: {mode: 'full', ratio: '1-2', showPeriod: true, leftTitle: 'Đánh giá ngành', rightTitle: 'Luận điểm chính', catalystTitle: 'Catalyst quan trọng', showCatalysts: true},
  theses: [], catalysts: []};
const THESIS = {title: '', text: '', sign: 'neutral', data: '', source: '', sourceUrl: '', catalyst: '', checkpoint: '', actionLabel: '', actionTarget: '', hidden: false};
const CATALYST = {title: '', when: '', sign: 'neutral', status: 'upcoming', note: '', source: '', sourceUrl: '', actionLabel: '', actionTarget: '', hidden: false};
function normalize(c) {
  const o = Object.assign(clone(BLANK), clone(c || {}));
  o.view = Object.assign(clone(BLANK.view), o.view || {});
  if (!RATIOS[o.view.ratio]) o.view.ratio = '1-2';
  if (!STANCE[o.stance]) o.stance = 'neutral';
  o.theses = (Array.isArray(o.theses) ? o.theses : []).map(t => Object.assign({id: uid('t')}, THESIS, t));
  o.catalysts = (Array.isArray(o.catalysts) ? o.catalysts : []).map(t => Object.assign({id: uid('c')}, CATALYST, t));
  return o;
}

/* ---------- Nạp: bản đăng (JSON) + bản nháp (IndexedDB) ---------- */
let published = normalize(window.SECTOR_ASSESSMENT?.[sector]), hasPublished = !!window.SECTOR_ASSESSMENT?.[sector], loadError = null;
const pubReady = fetch(DATA_URL, {cache: 'no-cache'}).then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
  .then(j => { published = normalize(j); hasPublished = true; }).catch(e => { if (!hasPublished) loadError = e; });
let db = null, draft = null, dbError = null;
const dbReady = new Promise(resolve => {
  try {
    const req = indexedDB.open('finsuccess-research', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('entries', {keyPath: 'id'});
    req.onsuccess = () => { db = req.result; const q = db.transaction('entries').objectStore('entries').get(KEY); q.onsuccess = () => { draft = q.result || null; resolve(); }; q.onerror = () => { dbError = q.error; resolve(); }; };
    req.onerror = () => { dbError = req.error; resolve(); }; req.onblocked = () => { dbError = new Error('blocked'); resolve(); };
  } catch (e) { dbError = e; resolve(); }
});
const ready = Promise.all([pubReady, dbReady]);
window.SectorBoot?.wait?.(ready);
const put = rec => new Promise((res, rej) => { if (!db) return rej(dbError || new Error('Trình duyệt không cho lưu')); const tx = db.transaction('entries', 'readwrite'); tx.objectStore('entries').put(rec); tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
const del = () => new Promise((res, rej) => { if (!db) return res(); const tx = db.transaction('entries', 'readwrite'); tx.objectStore('entries').delete(KEY); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* chế độ riêng tư */ } };

const qs = new URLSearchParams(location.search);
if (qs.get('edit') === '1') lsSet(EDIT_KEY, '1'); else if (qs.get('edit') === '0') lsSet(EDIT_KEY, null);
const canEdit = () => lsGet(EDIT_KEY) === '1';
const current = () => draft?.config ? normalize(draft.config) : published;
const viewMode = cfg => { const v = lsGet(VIEW_KEY); return v === 'compact' || v === 'full' ? v : cfg.view.mode === 'compact' ? 'compact' : 'full'; };

/* ---------- Đích nội bộ ---------- */
function targets() {
  const out = [];
  document.querySelectorAll('.majorpane[data-tab]').forEach(pane => {
    // Chỉ tab đang có trên thanh tab lớn (pane cũ đã dời hết thẻ như #mt4, #mt8 thì bỏ).
    const mt = pane.dataset.tab, btn = document.querySelector(`.majortabbtn[data-tab="${mt}"]`); if (!btn) return;
    const tab = btn.textContent.trim();
    const subs = [...pane.querySelectorAll('.pp-pane[data-sub],[role=tabpanel][data-sub]')].filter(p => p.closest('.majorpane') === pane);
    if (!subs.length) out.push({g: 'Tab', v: '#' + mt, t: tab});
    subs.forEach(p => {
      const lab = p.getAttribute('aria-labelledby') && document.getElementById(p.getAttribute('aria-labelledby')) || pane.querySelector(`[role=tab][data-sub="${p.dataset.sub}"]`);
      const h = p.querySelector('.pp-head h2')?.textContent.trim() || lab?.textContent.replace(/^\s*\d+\s*/, '').trim() || p.querySelector('h2')?.textContent.trim() || p.dataset.sub;
      out.push({g: 'Tab › sub-tab', v: `?sub=${p.dataset.sub}#${mt}`, t: `${tab} › ${h}`});
      p.querySelectorAll('section.pp-q[id]').forEach(q => {
        const n = q.querySelector('.pp-num')?.textContent.trim() || '', t = q.querySelector('h3')?.textContent.trim() || q.id;
        out.push({g: `Câu hỏi · ${tab} › ${h}`, v: '#' + q.id, t: `${n} ${t}`.trim()});
      });
    });
  });
  return out;
}
function go(target) {
  if (isExternal(target)) { window.open(target, '_blank', 'noopener'); return; }
  const u = new URL(target, location.href);
  if (u.pathname !== location.pathname) { location.assign(u.href); return; }
  const id = u.hash.slice(1);
  if (id && !/^mt\d+$/.test(id) && !u.search) {
    // #id: khung ngành (vd. retail-frame goTo) nghe hashchange → mở đúng tab/sub-tab rồi cuộn tới.
    history.pushState({sa: 1}, '', location.pathname + location.search + u.hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    // ?sub=…#mtN: khung ngành nghe popstate → route lại theo URL.
    history.pushState({sa: 1}, '', u.pathname + u.search + u.hash);
    window.dispatchEvent(new PopStateEvent('popstate', {state: {sa: 1}}));
  }
  // Khung ngành không mở được mục → tải lại theo URL để route lúc vào trang lo.
  setTimeout(() => {
    const t = id && !/^mt\d+$/.test(id) ? document.getElementById(id) : document.querySelector(`.majorpane[data-tab="${id || 'mt1'}"]`);
    if (!t || !t.getClientRects().length) location.assign(u.href);
    else if (id && !/^mt\d+$/.test(id)) { for (let d = t.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true; }
  }, 350);
}

/* ---------- Hiển thị ---------- */
let root;
function badge(sign, big) {
  const s = STANCE[sign] || STANCE.neutral;
  return `<span class="sa-ico sa-${STANCE[sign] ? sign : 'neutral'}${big ? ' sa-ico-lg' : ''}" title="${s.t}" role="img" aria-label="${s.t}">${ICON[s.icon]}</span>`;
}
const actLink = t => (t.actionTarget || '').trim()
  ? `<a class="sa-act" href="${esc(t.actionTarget)}" data-sa-target="${esc(t.actionTarget)}"${isExternal(t.actionTarget) ? ' target="_blank" rel="noopener"' : ''}>${esc(t.actionLabel || 'Xem chi tiết')} ${isExternal(t.actionTarget) ? '↗' : '→'}</a>` : '';
const srcLine = t => (t.source || t.sourceUrl) ? `<li><span class="sa-k">Nguồn</span>${t.sourceUrl && isExternal(t.sourceUrl) ? `<a href="${esc(t.sourceUrl)}" target="_blank" rel="noopener">${esc(t.source || t.sourceUrl)} ↗</a>` : esc(t.source)}</li>` : '';
function render() {
  const cfg = current(), mode = viewMode(cfg), v = cfg.view, st = STANCE[cfg.stance];
  root.className = `sa card sa-mode-${mode}`; root.style.setProperty('--sa-cols', RATIOS[v.ratio][1]);
  const score = cfg.score == null || cfg.score === '' ? '—' : fmtScore(cfg.score);
  const ill = cfg.status !== 'official' ? '<span class="sa-tag sa-tag-ill" title="Nội dung minh họa, chưa phải đánh giá chính thức">Minh họa</span>' : '';
  const isDraft = !!draft?.config, stale = isDraft && hasPublished && draft.baseRev !== published.rev;
  const meta = [v.showPeriod && cfg.period ? `Kỳ đánh giá: <b>${esc(cfg.period)}</b>` : '', cfg.updated ? `Cập nhật: <b>${esc(dmy(cfg.updated))}</b>` : ''].filter(Boolean).join('<br>');
  const list = cfg.theses.filter(t => !t.hidden && (t.title || t.text));
  const items = list.map(t => {
    const ev = [];
    if (t.data) ev.push(`<li><span class="sa-k">Số liệu</span>${esc(t.data)}</li>`);
    if (t.catalyst) ev.push(`<li><span class="sa-k">Catalyst</span>${esc(t.catalyst)}${t.checkpoint ? ` <span class="sa-check">· kiểm chứng: ${esc(t.checkpoint)}</span>` : ''}</li>`);
    else if (t.checkpoint) ev.push(`<li><span class="sa-k">Mốc kiểm chứng</span>${esc(t.checkpoint)}</li>`);
    const s = srcLine(t); if (s) ev.push(s);
    return `<li class="sa-item" data-id="${esc(t.id)}">${badge(t.sign)}<div class="sa-body"><div class="sa-ttl">${esc(t.title)}</div>${t.text ? `<p class="sa-txt">${esc(t.text)}</p>` : ''}${ev.length ? `<ul class="sa-ev">${ev.join('')}</ul>` : ''}${actLink(t)}</div></li>`;
  }).join('');
  const cats = v.showCatalysts ? cfg.catalysts.filter(c => !c.hidden && c.title) : [];
  const catHtml = cats.length ? `<div class="sa-cat"><div class="sa-h"><h3>${esc(v.catalystTitle || 'Catalyst quan trọng')}</h3></div><ol class="sa-cat-list">${cats.map(c => {
    const s = srcLine(c);
    return `<li class="sa-citem" data-id="${esc(c.id)}">${badge(c.sign)}<div class="sa-body"><div class="sa-ttl">${c.when ? `<span class="sa-when">${esc(dmy(c.when))}</span>` : ''}${esc(c.title)}${c.status && CSTATUS[c.status] ? `<span class="sa-cst sa-cst-${c.status}">${CSTATUS[c.status]}</span>` : ''}</div>${c.note ? `<p class="sa-txt">${esc(c.note)}</p>` : ''}${s ? `<ul class="sa-ev">${s}</ul>` : ''}${actLink(c)}</div></li>`;
  }).join('')}</ol></div>` : '';
  const empty = `<p class="sa-empty">Chưa có luận điểm cho kỳ này.${canEdit() ? ' Bấm <b>Chỉnh đánh giá</b> để thêm.' : ''}</p>`;
  root.innerHTML = `
    <div class="sa-l">
      <div class="sa-h"><h2>${esc(v.leftTitle || 'Đánh giá ngành')}</h2>${ill}</div>
      <div class="sa-score sa-${cfg.stance}">${badge(cfg.stance, true)}<div><div class="sa-num"><b>${score}</b><span>/${esc(cfg.scoreMax || 10)}</span></div><div class="sa-st">${st.t}</div></div></div>
      ${meta ? `<p class="sa-meta">${meta}</p>` : ''}
      ${isDraft ? `<p class="sa-draft">Bản nháp trên trình duyệt này${draft.savedAt ? ' · lưu ' + esc(new Date(draft.savedAt).toLocaleString('vi-VN')) : ''} — người khác chưa thấy. Bấm <b>Đăng lên web</b> trong khung chỉnh để đăng.${stale ? ' <b>Bản trên web đã đổi sau khi tạo nháp.</b>' : ''}</p>` : ''}
      ${loadError && canEdit() ? `<p class="sa-draft">Không đọc được ${esc(DATA_PATH)} (${esc(loadError.message)}).</p>` : ''}
    </div>
    <div class="sa-r">
      <div class="sa-h"><h3>${esc(v.rightTitle || 'Luận điểm chính')}</h3>
        <div class="sa-tools"><div class="sa-seg" role="group" aria-label="Kiểu hiển thị"><button type="button" data-mode="compact" aria-pressed="${mode === 'compact'}">Gọn</button><button type="button" data-mode="full" aria-pressed="${mode === 'full'}">Đầy đủ</button></div>
        ${canEdit() ? '<button type="button" class="sa-edit-btn">Chỉnh đánh giá</button>' : ''}</div></div>
      ${list.length ? `<ol class="sa-list">${items}</ol>` : empty}
      <p class="sa-legend"><span>${badge('positive')}Tích cực</span><span>${badge('neutral')}Trung lập</span><span>${badge('negative')}Tiêu cực</span></p>
    </div>
    ${catHtml}`;
  root.querySelectorAll('.sa-seg button').forEach(b => b.addEventListener('click', () => { lsSet(VIEW_KEY, b.dataset.mode); render(); }));
  root.querySelector('.sa-edit-btn')?.addEventListener('click', openEditor);
  root.querySelectorAll('a.sa-act').forEach(a => a.addEventListener('click', e => {
    if (isExternal(a.dataset.saTarget) || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault(); e.stopPropagation(); go(a.dataset.saTarget);
  }));
}

/* ---------- Trình chỉnh ---------- */
let dlg, work;
const field = (label, html, cls) => `<label class="sa-f${cls ? ' ' + cls : ''}"><span>${label}</span>${html}</label>`;
const opt = (list, val) => list.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(t)}</option>`).join('');
const inp = (k, val, max, ph, type) => `<input${type ? ` type="${type}"` : ''} data-k="${k}" maxlength="${max}"${ph ? ` placeholder="${esc(ph)}"` : ''} value="${esc(val)}">`;
function targetSelect(val) {
  const ts = targets(), groups = {};
  ts.forEach(t => (groups[t.g] = groups[t.g] || []).push(t));
  const known = ts.some(t => t.v === val);
  return `<select data-k="actionPick"><option value="">— Không có đích (ẩn nút) —</option>${Object.entries(groups).map(([g, a]) => `<optgroup label="${esc(g)}">${a.map(t => `<option value="${esc(t.v)}"${t.v === val ? ' selected' : ''}>${esc(t.t)}</option>`).join('')}</optgroup>`).join('')}<option value="__custom"${val && !known ? ' selected' : ''}>Tự nhập: URL ngoài hoặc #id…</option></select>`;
}
const signSel = v => `<select data-k="sign">${opt(Object.entries(STANCE).map(([k, s]) => [k, s.t]), v)}</select>`;
const actionFields = t => field('Nhãn nút', inp('actionLabel', t.actionLabel, 40, 'Xem dữ liệu')) + field('Đích nút', targetSelect(t.actionTarget), 'sa-w2')
  + field('Đích (giá trị lưu)', inp('actionTarget', t.actionTarget, 500, '?sub=modern#mt2 · #rf-q-stores · https://…'), 'sa-w3');
function itemShell(list, i, n, t, label, body) {
  return `<li class="sa-ed-item${t.hidden ? ' is-hidden' : ''}" data-list="${list}" data-i="${i}" draggable="true">
    <div class="sa-ed-bar"><span class="sa-grip" title="Kéo để sắp xếp" aria-hidden="true">⠿</span><b>${label} ${i + 1}</b>${t.hidden ? '<span class="sa-tag">Đang ẩn</span>' : ''}
      <span class="sa-ed-ctl"><button type="button" data-do="top" ${i ? '' : 'disabled'} title="Lên đầu" aria-label="Lên đầu">⤒</button><button type="button" data-do="up" ${i ? '' : 'disabled'} title="Lên" aria-label="Lên">↑</button><button type="button" data-do="down" ${i < n - 1 ? '' : 'disabled'} title="Xuống" aria-label="Xuống">↓</button><button type="button" data-do="hide">${t.hidden ? 'Hiện' : 'Ẩn'}</button><button type="button" data-do="del" class="sa-danger">Xóa</button></span></div>
    <div class="sa-ed-grid">${body}</div></li>`;
}
const thesisForm = (t, i, n) => itemShell('theses', i, n, t, 'Luận điểm',
  field('Tiêu đề', inp('title', t.title, 160), 'sa-w2') + field('Tác động', signSel(t.sign))
  + field('Diễn giải (dòng đầu hiện ở view Gọn)', `<textarea data-k="text" rows="2" maxlength="1200">${esc(t.text)}</textarea>`, 'sa-w3')
  + field('Số liệu dẫn chứng', inp('data', t.data, 300), 'sa-w3')
  + field('Catalyst liên quan', inp('catalyst', t.catalyst, 300), 'sa-w2') + field('Mốc kiểm chứng', inp('checkpoint', t.checkpoint, 120))
  + field('Nguồn (tên)', inp('source', t.source, 200), 'sa-w2') + field('Link nguồn (https://…)', inp('sourceUrl', t.sourceUrl, 500))
  + actionFields(t));
const catalystForm = (c, i, n) => itemShell('catalysts', i, n, c, 'Catalyst',
  field('Sự kiện / catalyst', inp('title', c.title, 160, 'vd. Giảm 2% VAT hết hiệu lực'), 'sa-w2') + field('Tác động', signSel(c.sign))
  + field('Mốc thời gian', inp('when', c.when, 40, 'vd. 01/01/2027 · Q1/2027')) + field('Trạng thái', `<select data-k="status">${opt(Object.entries(CSTATUS), c.status)}</select>`)
  + field('Ghi chú (ẩn ở view Gọn)', `<textarea data-k="note" rows="2" maxlength="800">${esc(c.note)}</textarea>`, 'sa-w3')
  + field('Nguồn (tên)', inp('source', c.source, 200), 'sa-w2') + field('Link nguồn (https://…)', inp('sourceUrl', c.sourceUrl, 500))
  + actionFields(c));
function editorHtml() {
  const c = work, v = c.view, tok = lsGet(TOKEN_KEY) || '';
  return `<form method="dialog" class="sa-ed">
    <header><h2>Chỉnh Đánh giá ngành</h2><button type="button" class="sa-x" data-do="close" aria-label="Đóng">✕</button></header>
    <fieldset><legend>Quan điểm ngành</legend><div class="sa-ed-grid">
      ${field('Quan điểm', `<select data-c="stance">${opt(Object.entries(STANCE).map(([k, s]) => [k, s.t]), c.stance)}</select>`)}
      ${field('Điểm', `<input type="number" data-c="score" min="0" max="${esc(c.scoreMax)}" step="0.5" value="${c.score ?? ''}">`)}
      ${field('Thang', `<input type="number" data-c="scoreMax" min="1" max="100" step="1" value="${esc(c.scoreMax)}">`)}
      ${field('Kỳ đánh giá', `<input data-c="period" maxlength="60" placeholder="vd. Q4/2026" value="${esc(c.period)}">`)}
      ${field('Ngày cập nhật', `<input type="date" data-c="updated" value="${esc(c.updated)}">`)}
      ${field('Nhãn', `<select data-c="status">${opt([['illustration', 'Minh họa'], ['official', 'Chính thức']], c.status)}</select>`)}
    </div></fieldset>
    <fieldset><legend>Luận điểm (${c.theses.length})</legend>
      <ol class="sa-ed-list">${c.theses.map((t, i) => thesisForm(t, i, c.theses.length)).join('')}</ol>
      <button type="button" data-do="add" data-list="theses" class="sa-add">+ Thêm luận điểm</button></fieldset>
    <fieldset><legend>Catalyst quan trọng (${c.catalysts.length})</legend>
      <ol class="sa-ed-list">${c.catalysts.map((t, i) => catalystForm(t, i, c.catalysts.length)).join('')}</ol>
      <button type="button" data-do="add" data-list="catalysts" class="sa-add">+ Thêm catalyst</button></fieldset>
    <fieldset><legend>Bố cục</legend><div class="sa-ed-grid">
      ${field('Tiêu đề ô trái', `<input data-v="leftTitle" maxlength="60" value="${esc(v.leftTitle)}">`)}
      ${field('Tiêu đề ô phải', `<input data-v="rightTitle" maxlength="60" value="${esc(v.rightTitle)}">`)}
      ${field('Tiêu đề phần catalyst', `<input data-v="catalystTitle" maxlength="60" value="${esc(v.catalystTitle)}">`)}
      ${field('Tỷ lệ hai cột', `<select data-v="ratio">${opt(Object.entries(RATIOS).map(([k, r]) => [k, r[0]]), v.ratio)}</select>`)}
      ${field('View mặc định', `<select data-v="mode">${opt([['full', 'Đầy đủ'], ['compact', 'Gọn']], v.mode)}</select>`)}
      <div class="sa-f sa-chks"><label class="sa-chk"><input type="checkbox" data-v="showPeriod"${v.showPeriod ? ' checked' : ''}><span>Hiện dòng kỳ đánh giá</span></label>
      <label class="sa-chk"><input type="checkbox" data-v="showCatalysts"${v.showCatalysts ? ' checked' : ''}><span>Hiện phần catalyst</span></label></div>
    </div></fieldset>
    <fieldset class="sa-pub"><legend>Đăng lên web cho mọi người</legend>
      <p class="sa-ed-note">Đăng = ghi <code>${esc(DATA_PATH)}</code> vào repo GitHub <code>${esc(REPO)}</code> (nhánh ${BRANCH}); trang công khai cập nhật sau khoảng 1–2 phút. Cần <b>token GitHub</b> của người có quyền ghi repo: tạo ở
      <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub › Fine-grained token</a> (Repository access: chỉ repo này · Permissions › Contents: Read and write). Token chỉ gửi tới api.github.com.</p>
      <div class="sa-ed-grid">
        ${field('Token GitHub', `<input type="password" data-t="token" autocomplete="off" spellcheck="false" placeholder="github_pat_…" value="${esc(tok)}">`, 'sa-w2')}
        <label class="sa-chk"><input type="checkbox" data-t="remember"${tok ? ' checked' : ''}><span>Nhớ token trên trình duyệt này</span></label>
      </div></fieldset>
    <footer>
      <span class="sa-ed-status" role="status"></span>
      <button type="button" data-do="export">Xuất file</button>
      <label class="sa-import">Nhập file…<input type="file" accept=".json,.js,application/json" data-do="import"></label>
      <button type="button" data-do="reset" ${draft?.config ? '' : 'disabled'}>Bỏ nháp</button>
      <button type="button" data-do="close">Hủy</button>
      <button type="button" data-do="save">Lưu nháp</button>
      <button type="submit" class="sa-primary" data-do="publish">Đăng lên web</button>
    </footer></form>`;
}
function paintEditor(keepScroll) {
  const y = dlg.querySelector('.sa-ed')?.scrollTop || 0, tok = dlg.querySelector('[data-t=token]')?.value;
  dlg.innerHTML = editorHtml();
  if (tok != null) dlg.querySelector('[data-t=token]').value = tok;
  if (keepScroll) dlg.querySelector('.sa-ed').scrollTop = y;
}
const status = (msg, ok) => { const s = dlg?.querySelector('.sa-ed-status'); if (s) { s.textContent = msg; s.classList.toggle('is-ok', !!ok); } };
function move(list, from, to) { const a = work[list]; if (to < 0 || to >= a.length || from === to) return; const [t] = a.splice(from, 1); a.splice(to, 0, t); paintEditor(true); }
function openEditor() {
  work = clone(current());
  if (!dlg) {
    dlg = el('dialog', 'sa-dlg'); dlg.setAttribute('aria-label', 'Chỉnh Đánh giá ngành'); document.body.append(dlg);
    dlg.addEventListener('input', e => {
      const n = e.target, li = n.closest('.sa-ed-item');
      if (n.dataset.c) work[n.dataset.c] = n.type === 'number' ? (n.value === '' ? null : Number(n.value)) : n.value;
      else if (n.dataset.v) work.view[n.dataset.v] = n.type === 'checkbox' ? n.checked : n.value;
      else if (li && n.dataset.k && n.dataset.k !== 'actionPick') {
        work[li.dataset.list][+li.dataset.i][n.dataset.k] = n.value;
        if (n.dataset.k === 'actionTarget') { const pick = li.querySelector('[data-k=actionPick]'); const has = [...pick.options].some(o => o.value === n.value); pick.value = has ? n.value : (n.value ? '__custom' : ''); }
      }
    });
    dlg.addEventListener('change', e => {
      const n = e.target, li = n.closest('.sa-ed-item');
      if (n.dataset.v && n.type === 'checkbox') work.view[n.dataset.v] = n.checked;
      if (n.dataset.k === 'actionPick' && li) {
        const it = work[li.dataset.list][+li.dataset.i], box = li.querySelector('[data-k=actionTarget]');
        if (n.value !== '__custom') { box.value = n.value; it.actionTarget = n.value; if (n.value && !it.actionLabel) { it.actionLabel = isExternal(n.value) ? 'Đọc nguồn' : 'Xem dữ liệu'; li.querySelector('[data-k=actionLabel]').value = it.actionLabel; } }
        else box.focus();
      }
      if (n.dataset.do === 'import' && n.files?.[0]) {
        n.files[0].text().then(txt => {
          // File .json, hoặc file .js cũ dạng "(window.SECTOR_ASSESSMENT …)[…] = {JSON};"
          const body = txt.replace(/\/\*[\s\S]*?\*\//g, ''), m = [...body.matchAll(/=\s*\{(?!\})/g)].pop(), at = m ? m.index + m[0].length - 1 : body.indexOf('{');
          work = normalize(JSON.parse(body.slice(at, body.lastIndexOf('}') + 1))); paintEditor(); status('Đã nạp file — bấm Lưu nháp hoặc Đăng lên web.');
        }).catch(err => status('Không đọc được file: ' + err.message));
      }
    });
    dlg.addEventListener('click', e => {
      const b = e.target.closest('[data-do]'); if (!b || b.tagName === 'INPUT') return;
      const li = b.closest('.sa-ed-item'), list = li?.dataset.list, i = li ? +li.dataset.i : -1, d = b.dataset.do;
      if (d === 'close') { e.preventDefault(); dlg.close(); return; }
      if (d === 'save') { e.preventDefault(); saveDraft(true); return; }
      if (d === 'publish') { e.preventDefault(); publish(); return; }
      if (d === 'add') {
        const L = b.dataset.list; work[L].push(normalize({[L]: [{}]})[L][0]); paintEditor(true);
        const items = dlg.querySelectorAll(`.sa-ed-item[data-list="${L}"] [data-k=title]`), last = items[items.length - 1]; last?.scrollIntoView({block: 'center'}); last?.focus(); return;
      }
      if (d === 'top') return move(list, i, 0);
      if (d === 'up') return move(list, i, i - 1);
      if (d === 'down') return move(list, i, i + 1);
      if (d === 'hide') { work[list][i].hidden = !work[list][i].hidden; paintEditor(true); return; }
      if (d === 'del') { const t = work[list][i]; if (confirm(`Xóa ${list === 'theses' ? 'luận điểm' : 'catalyst'} ${i + 1}${t.title ? ' "' + t.title + '"' : ''}?`)) { work[list].splice(i, 1); paintEditor(true); } return; }
      if (d === 'export') { exportFile(); return; }
      if (d === 'reset') { if (confirm('Bỏ bản nháp trên trình duyệt này và hiện lại bản trên web?')) del().then(() => { draft = null; dlg.close(); render(); }); }
    });
    // Kéo thả sắp xếp trong cùng danh sách (bàn phím/cảm ứng: nút ⤒ ↑ ↓).
    let drag = null;
    dlg.addEventListener('dragstart', e => { const li = e.target.closest?.('.sa-ed-item'); if (!li || e.target.matches?.('input,textarea,select')) return; drag = {list: li.dataset.list, i: +li.dataset.i}; li.classList.add('is-drag'); if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', li.dataset.i); } });
    dlg.addEventListener('dragover', e => { const li = e.target.closest?.('.sa-ed-item'); if (!drag || !li || li.dataset.list !== drag.list) return; e.preventDefault(); dlg.querySelectorAll('.is-over').forEach(x => x.classList.remove('is-over')); li.classList.add('is-over'); });
    dlg.addEventListener('drop', e => { const li = e.target.closest?.('.sa-ed-item'); if (!drag || !li || li.dataset.list !== drag.list) return; e.preventDefault(); const {list, i} = drag; drag = null; move(list, i, +li.dataset.i); });
    dlg.addEventListener('dragend', () => { drag = null; dlg.querySelectorAll('.is-drag,.is-over').forEach(x => x.classList.remove('is-drag', 'is-over')); });
    dlg.addEventListener('submit', e => { e.preventDefault(); publish(); });
  }
  paintEditor();
  dlg.showModal();
  if (dbError) status('Trình duyệt không cho lưu nháp (IndexedDB). Vẫn đăng lên web và xuất file được.');
}
function cleaned() {
  const sc = work.score;
  if (sc != null && (isNaN(sc) || sc < 0 || sc > work.scoreMax)) { status(`Điểm phải từ 0 đến ${work.scoreMax}.`); return null; }
  const out = clone(work);
  out.theses = out.theses.filter(t => [t.title, t.text, t.data, t.catalyst].some(x => (x || '').trim()));
  out.catalysts = out.catalysts.filter(c => [c.title, c.note].some(x => (x || '').trim()));
  return out;
}
function saveDraft(close) {
  const cfg = cleaned(); if (!cfg) return Promise.resolve(false);
  const rec = {id: KEY, sector, type: 'assessment', config: cfg, baseRev: published.rev || '', savedAt: new Date().toISOString()};
  return put(rec).then(() => { draft = rec; work = clone(cfg); render(); if (close) dlg.close(); return true; })
    .catch(err => { status('Không lưu được nháp: ' + (err?.message || err)); return false; });
}
const json = cfg => JSON.stringify(cfg, null, 2) + '\n';
const b64 = s => { const bytes = new TextEncoder().encode(s); let bin = ''; bytes.forEach(x => { bin += String.fromCharCode(x); }); return btoa(bin); };
const unb64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0)));
async function gh(path, opts = {}, token) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/${path}`, Object.assign({}, opts, {headers: Object.assign({'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28'}, opts.body ? {'Content-Type': 'application/json'} : {})}));
  const body = await r.json().catch(() => ({}));
  return {ok: r.ok, status: r.status, body};
}
async function publish() {
  const tokEl = dlg.querySelector('[data-t=token]'), token = (tokEl?.value || '').trim(), remember = dlg.querySelector('[data-t=remember]')?.checked;
  if (!token) { status('Nhập token GitHub để đăng (hoặc bấm Lưu nháp).'); tokEl?.focus(); return; }
  const cfg = cleaned(); if (!cfg) return;
  lsSet(TOKEN_KEY, remember ? token : null);
  const btn = dlg.querySelector('[data-do=publish]'); btn.disabled = true; status('Đang đăng…');
  try {
    await saveDraft(false); // giữ bản đang chỉnh nếu đăng lỗi
    const cur = await gh(`contents/${DATA_PATH}?ref=${BRANCH}`, {}, token);
    if (cur.status === 401) throw new Error('Token không hợp lệ hoặc đã hết hạn.');
    if (!cur.ok && cur.status !== 404) throw new Error(cur.status === 403 || cur.status === 404 ? 'Token không có quyền đọc repo.' : `GitHub trả lỗi ${cur.status}: ${cur.body.message || ''}`);
    let sha;
    if (cur.ok) {
      sha = cur.body.sha;
      let remote = null; try { remote = JSON.parse(unb64(cur.body.content || '')); } catch (e) { /* file hỏng: ghi đè */ }
      // So với bản trang này đã nạp: khác nghĩa là có người đăng sau khi mở trang (hoặc Pages chưa kịp dựng lần đăng trước).
      if (remote && remote.rev && remote.rev !== published.rev &&
          !confirm(`Bản trên web đã được đăng lại (rev ${remote.rev}) sau khi bạn mở trang. Đăng đè bằng bản của bạn?`)) { status('Đã hủy đăng; bản của bạn vẫn giữ ở nháp.'); return; }
    }
    cfg.rev = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13) + '-' + Math.random().toString(36).slice(2, 6);
    if (!cfg.updated) cfg.updated = new Date().toISOString().slice(0, 10);
    const res = await gh(`contents/${DATA_PATH}`, {method: 'PUT', body: JSON.stringify({message: `Đánh giá ngành ${sector}: cập nhật qua web (rev ${cfg.rev})`, content: b64(json(cfg)), branch: BRANCH, ...(sha ? {sha} : {})})}, token);
    if (res.status === 409) throw new Error('Có người vừa đăng cùng lúc; mở lại khung chỉnh rồi đăng lại.');
    if (res.status === 403 || res.status === 404) throw new Error('Token không có quyền ghi repo (cần Contents: Read and write cho ' + REPO + ').');
    if (!res.ok) throw new Error(`GitHub trả lỗi ${res.status}: ${res.body.message || ''}`);
    published = normalize(cfg); hasPublished = true; await del(); draft = null; work = clone(published);
    render(); paintEditor(true);
    status(`Đã đăng (commit ${String(res.body.commit?.sha || '').slice(0, 7)}). Trang công khai cập nhật sau khoảng 1–2 phút.`, true);
  } catch (err) {
    status('Chưa đăng được: ' + (err?.message || err) + ' Bản đang chỉnh đã lưu nháp trên trình duyệt này.');
  } finally { const b = dlg.querySelector('[data-do=publish]'); if (b) b.disabled = false; }
}
function exportFile() {
  const cfg = cleaned(); if (!cfg) return;
  const url = URL.createObjectURL(new Blob([json(cfg)], {type: 'application/json'})), a = el('a'); a.href = url; a.download = sector + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  status(`Đã xuất ${sector}.json (thay ${DATA_PATH} nếu đăng thủ công).`);
}

/* ---------- Gắn vào trang: đúng chỗ Bản tin dữ liệu ---------- */
function mount() {
  if (document.getElementById('sectorAssessment')) return;
  const pane = document.querySelector('.majorpane[data-tab="mt1"]'); if (!pane) return;
  root = el('section'); root.id = 'sectorAssessment'; root.setAttribute('aria-label', 'Đánh giá ngành');
  const brief = document.getElementById('dataBrief');
  if (brief && pane.contains(brief)) { brief.before(root); brief.hidden = true; brief.classList.add('sa-replaced'); }
  else { const sec = pane.querySelector(':scope > .rf-section, :scope > section'); const navEl = sec?.querySelector(':scope > .ov-nav'); if (navEl) navEl.before(root); else pane.prepend(root); }
  render();
  window.SectorAssessment = {config: current, published: () => published, targets, go, render, repo: REPO, path: DATA_PATH};
}
if (window.SectorBoot) SectorBoot.add(1250, () => ready.then(mount));
else ready.then(() => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', mount) : mount());
})();
