/* Đánh giá ngành · khối đầu tab Tổng quan ngành (thay vị trí "Bản tin dữ liệu" #dataBrief, phía trên Bản đồ ngành). 28/11/2026, thí điểm Bán lẻ.
   Bản gốc: scripts/sector_package/sector-assessment.js (+ .css) → chép vào <Ngành>/app/. DASHBOARD_WORKFLOW §52.
   - Cấu hình đăng chung: data/sector-assessment/<data-sector>.js → window.SECTOR_ASSESSMENT[<sector>]. Mỗi ngành một file.
   - Chỉnh trên web: ?edit=1 bật nút "Chỉnh đánh giá" (nhớ trên trình duyệt; ?edit=0 tắt). Lưu = bản nháp trong IndexedDB
     `finsuccess-research` (store entries, id "<sector>:assessment:config", dùng chung DB với research-editorial.js):
     CHỈ trên trình duyệt đó. Muốn mọi người thấy: "Xuất file cấu hình" → thay file data/… → commit (chưa có server/quyền dùng chung).
   - Bản nháp ghi rev của bản đăng lúc tạo; bản đăng đổi rev sau đó thì hiện cảnh báo để người chỉnh chọn giữ hay bỏ nháp.
   - Đích nút hành động: "?sub=<k>#mtN" (tab/sub-tab), "#<id>" (câu hỏi/thẻ/biểu đồ có id), hoặc URL http(s) ngoài. Trống → ẩn nút. */
(() => {
'use strict';
const sector = document.body?.dataset.sector; if (!sector) return;
const KEY = sector + ':assessment:config', VIEW_KEY = 'fs-assessment-view:' + sector, EDIT_KEY = 'fs-assessment-editor';
const STANCE = {
  positive: {t: 'Tích cực', icon: 'bull'}, neutral: {t: 'Trung lập', icon: 'flat'}, negative: {t: 'Tiêu cực', icon: 'bear'}
};
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
const uid = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtScore = (v) => (Math.round(Number(v) * 10) / 10).toLocaleString('vi-VN');

const BLANK = {schema: 1, rev: '', status: 'illustration', score: null, scoreMax: 10, stance: 'neutral', period: '', updated: '',
  view: {mode: 'full', ratio: '1-2', showPeriod: true, leftTitle: 'Đánh giá ngành', rightTitle: 'Luận điểm chính'}, theses: []};
function normalize(c) {
  const o = Object.assign(clone(BLANK), clone(c || {}));
  o.view = Object.assign(clone(BLANK.view), o.view || {});
  if (!RATIOS[o.view.ratio]) o.view.ratio = '1-2';
  if (!STANCE[o.stance]) o.stance = 'neutral';
  o.theses = (Array.isArray(o.theses) ? o.theses : []).map(t => Object.assign({id: uid(), title: '', text: '', sign: 'neutral', data: '', source: '', sourceUrl: '', catalyst: '', checkpoint: '', actionLabel: '', actionTarget: '', hidden: false}, t));
  return o;
}
const published = normalize(window.SECTOR_ASSESSMENT?.[sector]);
const hasPublished = !!window.SECTOR_ASSESSMENT?.[sector];

/* ---------- Lưu trên trình duyệt (IndexedDB finsuccess-research, như research-editorial.js) ---------- */
let db = null, draft = null, dbError = null;
const dbReady = new Promise(resolve => {
  try {
    const req = indexedDB.open('finsuccess-research', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('entries', {keyPath: 'id'});
    req.onsuccess = () => { db = req.result; const q = db.transaction('entries').objectStore('entries').get(KEY); q.onsuccess = () => { draft = q.result || null; resolve(); }; q.onerror = () => { dbError = q.error; resolve(); }; };
    req.onerror = () => { dbError = req.error; resolve(); }; req.onblocked = () => { dbError = new Error('blocked'); resolve(); };
  } catch (e) { dbError = e; resolve(); }
});
window.SectorBoot?.wait?.(dbReady);
const put = rec => new Promise((res, rej) => { if (!db) return rej(dbError || new Error('Trình duyệt không cho lưu')); const tx = db.transaction('entries', 'readwrite'); tx.objectStore('entries').put(rec); tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
const del = () => new Promise((res, rej) => { if (!db) return res(); const tx = db.transaction('entries', 'readwrite'); tx.objectStore('entries').delete(KEY); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* chế độ riêng tư: bỏ qua */ } };

// Quyền chỉnh: chưa có tài khoản/server → bật bằng ?edit=1 (nhớ trên trình duyệt). Chỉ ảnh hưởng bản nháp của trình duyệt đó.
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
const isExternal = t => /^https?:\/\//i.test(t || '');
function go(target) {
  if (isExternal(target)) { window.open(target, '_blank', 'noopener'); return; }
  const u = new URL(target, location.href);
  if (u.pathname !== location.pathname) { location.assign(u.href); return; }
  const id = u.hash.slice(1), samePath = u.pathname + u.search + u.hash;
  if (id && !/^mt\d+$/.test(id) && !u.search) {
    // #id: khung ngành (vd. retail-frame goTo) nghe hashchange → mở đúng tab/sub-tab rồi cuộn tới.
    if (location.hash === u.hash) history.replaceState(history.state, '', location.pathname + location.search);
    history.pushState({sa: 1}, '', location.pathname + location.search + u.hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    // ?sub=…#mtN: khung ngành nghe popstate → route lại theo URL.
    history.pushState({sa: 1}, '', samePath);
    window.dispatchEvent(new PopStateEvent('popstate', {state: {sa: 1}}));
  }
  // Khung ngành không xử lý được (không mở ra mục) → tải lại theo URL để route lúc vào trang lo.
  setTimeout(() => {
    const t = id && !/^mt\d+$/.test(id) ? document.getElementById(id) : document.querySelector(`.majorpane[data-tab="${id || 'mt1'}"]`);
    if (!t || !t.offsetParent && !t.getClientRects().length) location.assign(u.href);
    else if (id && !/^mt\d+$/.test(id)) { for (let d = t.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true; }
  }, 350);
}

/* ---------- Hiển thị ---------- */
let root;
function badge(sign, big) {
  const s = STANCE[sign] || STANCE.neutral;
  return `<span class="sa-ico sa-${sign}${big ? ' sa-ico-lg' : ''}" title="${s.t}" role="img" aria-label="${s.t}">${ICON[s.icon]}</span>`;
}
function render() {
  const cfg = current(), mode = viewMode(cfg), v = cfg.view, st = STANCE[cfg.stance];
  root.className = `sa card sa-mode-${mode}`; root.style.setProperty('--sa-cols', RATIOS[v.ratio][1]);
  const score = cfg.score == null || cfg.score === '' ? '—' : fmtScore(cfg.score);
  const ill = cfg.status !== 'official' ? '<span class="sa-tag sa-tag-ill" title="Nội dung minh họa, chưa phải đánh giá chính thức">Minh họa</span>' : '';
  const isDraft = !!draft?.config;
  const stale = isDraft && hasPublished && draft.baseRev !== published.rev;
  const meta = [v.showPeriod && cfg.period ? `Kỳ đánh giá: <b>${esc(cfg.period)}</b>` : '', cfg.updated ? `Cập nhật: <b>${esc(dmy(cfg.updated))}</b>` : ''].filter(Boolean).join('<br>');
  const list = cfg.theses.filter(t => !t.hidden && (t.title || t.text));
  const items = list.map((t, i) => {
    const ev = [];
    if (t.data) ev.push(`<li><span class="sa-k">Số liệu</span>${esc(t.data)}</li>`);
    if (t.catalyst) ev.push(`<li><span class="sa-k">Catalyst</span>${esc(t.catalyst)}${t.checkpoint ? ` <span class="sa-check">· kiểm chứng: ${esc(t.checkpoint)}</span>` : ''}</li>`);
    else if (t.checkpoint) ev.push(`<li><span class="sa-k">Mốc kiểm chứng</span>${esc(t.checkpoint)}</li>`);
    if (t.source || t.sourceUrl) ev.push(`<li><span class="sa-k">Nguồn</span>${t.sourceUrl && isExternal(t.sourceUrl) ? `<a href="${esc(t.sourceUrl)}" target="_blank" rel="noopener">${esc(t.source || t.sourceUrl)} ↗</a>` : esc(t.source)}</li>`);
    const act = (t.actionTarget || '').trim()
      ?`<a class="sa-act" href="${esc(t.actionTarget)}" data-sa-target="${esc(t.actionTarget)}"${isExternal(t.actionTarget) ? ' target="_blank" rel="noopener"' : ''}>${esc(t.actionLabel || 'Xem chi tiết')} ${isExternal(t.actionTarget) ? '↗' : '→'}</a>` : '';
    return `<li class="sa-item" data-id="${esc(t.id)}">${badge(t.sign)}<div class="sa-body"><div class="sa-ttl"><span class="sa-n">${i + 1}</span>${esc(t.title)}</div>${t.text ? `<p class="sa-txt">${esc(t.text)}</p>` : ''}${ev.length ? `<ul class="sa-ev">${ev.join('')}</ul>` : ''}${act}</div></li>`;
  }).join('');
  const empty = `<p class="sa-empty">Chưa có luận điểm cho kỳ này.${canEdit() ? ' Bấm <b>Chỉnh đánh giá</b> để thêm.' : ''}</p>`;
  root.innerHTML = `
    <div class="sa-l">
      <div class="sa-h"><h2>${esc(v.leftTitle || 'Đánh giá ngành')}</h2>${ill}</div>
      <div class="sa-score sa-${cfg.stance}">${badge(cfg.stance, true)}<div><div class="sa-num"><b>${score}</b><span>/${esc(cfg.scoreMax || 10)}</span></div><div class="sa-st">${st.t}</div></div></div>
      ${meta ? `<p class="sa-meta">${meta}</p>` : ''}
      ${isDraft ? `<p class="sa-draft">Bản nháp trên trình duyệt này${draft.savedAt ? ' · lưu ' + esc(new Date(draft.savedAt).toLocaleString('vi-VN')) : ''} — người khác chưa thấy.${stale ? ' <b>Bản đăng đã đổi sau khi tạo nháp.</b>' : ''}</p>` : ''}
    </div>
    <div class="sa-r">
      <div class="sa-h"><h3>${esc(v.rightTitle || 'Luận điểm chính')}</h3>
        <div class="sa-tools"><div class="sa-seg" role="group" aria-label="Kiểu hiển thị luận điểm"><button type="button" data-mode="compact" aria-pressed="${mode === 'compact'}">Gọn</button><button type="button" data-mode="full" aria-pressed="${mode === 'full'}">Đầy đủ</button></div>
        ${canEdit() ? '<button type="button" class="sa-edit-btn">Chỉnh đánh giá</button>' : ''}</div></div>
      ${list.length ? `<ol class="sa-list">${items}</ol>` : empty}
      <p class="sa-legend"><span>${badge('positive')}Tích cực</span><span>${badge('neutral')}Trung lập</span><span>${badge('negative')}Tiêu cực</span></p>
    </div>`;
  root.querySelectorAll('.sa-seg button').forEach(b => b.addEventListener('click', () => { lsSet(VIEW_KEY, b.dataset.mode); render(); }));
  root.querySelector('.sa-edit-btn')?.addEventListener('click', openEditor);
  root.querySelectorAll('a.sa-act').forEach(a => a.addEventListener('click', e => {
    if (isExternal(a.dataset.saTarget) || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault(); e.stopPropagation(); go(a.dataset.saTarget);
  }));
}

/* ---------- Trình chỉnh ---------- */
let dlg, work;
function field(label, html, cls) { return `<label class="sa-f${cls ? ' ' + cls : ''}"><span>${label}</span>${html}</label>`; }
function opt(list, val) { return list.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(t)}</option>`).join(''); }
function targetSelect(val) {
  const ts = targets(), groups = {};
  ts.forEach(t => (groups[t.g] = groups[t.g] || []).push(t));
  const known = ts.some(t => t.v === val);
  return `<select data-k="actionPick"><option value="">— Không có đích (ẩn nút) —</option>${Object.entries(groups).map(([g, a]) => `<optgroup label="${esc(g)}">${a.map(t => `<option value="${esc(t.v)}"${t.v === val ? ' selected' : ''}>${esc(t.t)}</option>`).join('')}</optgroup>`).join('')}<option value="__custom"${val && !known ? ' selected' : ''}>Tự nhập: URL ngoài hoặc #id…</option></select>`;
}
function thesisForm(t, i, n) {
  const signOpts = opt(Object.entries(STANCE).map(([k, s]) => [k, s.t]), t.sign);
  return `<li class="sa-ed-item${t.hidden ? ' is-hidden' : ''}" data-i="${i}" draggable="true">
    <div class="sa-ed-bar"><span class="sa-grip" title="Kéo để sắp xếp" aria-hidden="true">⠿</span><b>Luận điểm ${i + 1}</b>${t.hidden ? '<span class="sa-tag">Đang ẩn</span>' : ''}
      <span class="sa-ed-ctl"><button type="button" data-do="top" ${i ? '' : 'disabled'} title="Lên đầu">⤒</button><button type="button" data-do="up" ${i ? '' : 'disabled'} title="Lên">↑</button><button type="button" data-do="down" ${i < n - 1 ? '' : 'disabled'} title="Xuống">↓</button><button type="button" data-do="hide">${t.hidden ? 'Hiện' : 'Ẩn'}</button><button type="button" data-do="del" class="sa-danger">Xóa</button></span></div>
    <div class="sa-ed-grid">
      ${field('Tiêu đề', `<input data-k="title" maxlength="160" value="${esc(t.title)}">`, 'sa-w2')}
      ${field('Tác động', `<select data-k="sign">${signOpts}</select>`)}
      ${field('Diễn giải (dòng đầu hiện ở view Gọn)', `<textarea data-k="text" rows="2" maxlength="1200">${esc(t.text)}</textarea>`, 'sa-w3')}
      ${field('Số liệu dẫn chứng', `<input data-k="data" maxlength="300" value="${esc(t.data)}">`, 'sa-w3')}
      ${field('Catalyst', `<input data-k="catalyst" maxlength="300" value="${esc(t.catalyst)}">`, 'sa-w2')}
      ${field('Mốc kiểm chứng', `<input data-k="checkpoint" maxlength="120" value="${esc(t.checkpoint)}">`)}
      ${field('Nguồn (tên)', `<input data-k="source" maxlength="200" value="${esc(t.source)}">`, 'sa-w2')}
      ${field('Link nguồn (https://…)', `<input data-k="sourceUrl" maxlength="500" value="${esc(t.sourceUrl)}">`)}
      ${field('Nhãn nút', `<input data-k="actionLabel" maxlength="40" placeholder="Xem dữ liệu" value="${esc(t.actionLabel)}">`)}
      ${field('Đích nút', targetSelect(t.actionTarget), 'sa-w2')}
      ${field('Đích (giá trị lưu)', `<input data-k="actionTarget" maxlength="500" placeholder="?sub=modern#mt2 · #rf-q-stores · https://…" value="${esc(t.actionTarget)}">`, 'sa-w3')}
    </div></li>`;
}
function editorHtml() {
  const c = work, v = c.view;
  return `<form method="dialog" class="sa-ed">
    <header><h2>Chỉnh Đánh giá ngành</h2><button type="button" class="sa-x" data-do="close" aria-label="Đóng">✕</button></header>
    <p class="sa-ed-note">Lưu = bản nháp <b>chỉ trên trình duyệt này</b> (IndexedDB). Để mọi người cùng thấy: <b>Xuất file cấu hình</b> rồi thay <code>data/sector-assessment/${esc(sector)}.js</code> trong repo và đăng lại trang.</p>
    <fieldset><legend>Ô điểm</legend><div class="sa-ed-grid">
      ${field('Điểm', `<input type="number" data-c="score" min="0" max="${esc(c.scoreMax)}" step="0.5" value="${c.score ?? ''}">`)}
      ${field('Thang', `<input type="number" data-c="scoreMax" min="1" max="100" step="1" value="${esc(c.scoreMax)}">`)}
      ${field('Trạng thái ngành', `<select data-c="stance">${opt(Object.entries(STANCE).map(([k, s]) => [k, s.t]), c.stance)}</select>`)}
      ${field('Kỳ đánh giá', `<input data-c="period" maxlength="60" placeholder="vd. Q4/2026" value="${esc(c.period)}">`)}
      ${field('Ngày cập nhật', `<input type="date" data-c="updated" value="${esc(c.updated)}">`)}
      ${field('Nhãn', `<select data-c="status">${opt([['illustration', 'Minh họa'], ['official', 'Chính thức']], c.status)}</select>`)}
    </div></fieldset>
    <fieldset><legend>Bố cục</legend><div class="sa-ed-grid">
      ${field('Tiêu đề ô trái', `<input data-v="leftTitle" maxlength="60" value="${esc(v.leftTitle)}">`)}
      ${field('Tiêu đề ô phải', `<input data-v="rightTitle" maxlength="60" value="${esc(v.rightTitle)}">`)}
      ${field('Tỷ lệ hai cột', `<select data-v="ratio">${opt(Object.entries(RATIOS).map(([k, r]) => [k, r[0]]), v.ratio)}</select>`)}
      ${field('View mặc định', `<select data-v="mode">${opt([['full', 'Đầy đủ'], ['compact', 'Gọn']], v.mode)}</select>`)}
      <label class="sa-f sa-chk"><input type="checkbox" data-v="showPeriod"${v.showPeriod ? ' checked' : ''}><span>Hiện dòng kỳ đánh giá</span></label>
    </div></fieldset>
    <fieldset><legend>Luận điểm (${c.theses.length})</legend>
      <ol class="sa-ed-list">${c.theses.map((t, i) => thesisForm(t, i, c.theses.length)).join('')}</ol>
      <button type="button" data-do="add" class="sa-add">+ Thêm luận điểm</button></fieldset>
    <footer>
      <span class="sa-ed-status" role="status"></span>
      <button type="button" data-do="export">Xuất file cấu hình</button>
      <label class="sa-import">Nhập file…<input type="file" accept=".js,.json,application/json,text/javascript" data-do="import"></label>
      <button type="button" data-do="reset" ${draft?.config ? '' : 'disabled'}>Bỏ nháp, về bản đăng</button>
      <button type="button" data-do="close">Hủy</button>
      <button type="submit" class="sa-primary" data-do="save">Lưu</button>
    </footer></form>`;
}
function paintEditor(keepScroll) {
  const y = dlg.querySelector('.sa-ed')?.scrollTop || 0;
  dlg.innerHTML = editorHtml();
  if (keepScroll) dlg.querySelector('.sa-ed').scrollTop = y;
}
const status = msg => { const s = dlg.querySelector('.sa-ed-status'); if (s) s.textContent = msg; };
function move(from, to) { if (to < 0 || to >= work.theses.length || from === to) return; const [t] = work.theses.splice(from, 1); work.theses.splice(to, 0, t); paintEditor(true); }
function openEditor() {
  work = clone(current());
  if (!dlg) {
    dlg = el('dialog', 'sa-dlg'); dlg.setAttribute('aria-label', 'Chỉnh Đánh giá ngành'); document.body.append(dlg);
    dlg.addEventListener('input', e => {
      const n = e.target, li = n.closest('.sa-ed-item');
      if (n.dataset.c) work[n.dataset.c] = n.type === 'number' ? (n.value === '' ? null : Number(n.value)) : n.value;
      else if (n.dataset.v) work.view[n.dataset.v] = n.type === 'checkbox' ? n.checked : n.value;
      else if (li && n.dataset.k && n.dataset.k !== 'actionPick') {
        work.theses[+li.dataset.i][n.dataset.k] = n.value;
        if (n.dataset.k === 'actionTarget') { const pick = li.querySelector('[data-k=actionPick]'); const has = [...pick.options].some(o => o.value === n.value); pick.value = has ? n.value : (n.value ? '__custom' : ''); }
      }
    });
    dlg.addEventListener('change', e => {
      const n = e.target, li = n.closest('.sa-ed-item');
      if (n.dataset.k === 'actionPick' && li) {
        const box = li.querySelector('[data-k=actionTarget]');
        if (n.value !== '__custom') { box.value = n.value; work.theses[+li.dataset.i].actionTarget = n.value; if (n.value && !work.theses[+li.dataset.i].actionLabel) { li.querySelector('[data-k=actionLabel]').value = 'Xem dữ liệu'; work.theses[+li.dataset.i].actionLabel = 'Xem dữ liệu'; } }
        else box.focus();
      }
      if (n.dataset.do === 'import' && n.files?.[0]) {
        n.files[0].text().then(txt => {
          // File xuất ra (và data/sector-assessment/*.js) có phần thân là JSON: lấy từ "{" sau dấu "=" đến "}" cuối.
          const body = txt.replace(/\/\*[\s\S]*?\*\//g, ''), m = [...body.matchAll(/=\s*\{(?!\})/g)].pop(), at = m ? m.index + m[0].length - 1 : body.indexOf('{');
          const obj = JSON.parse(body.slice(at, body.lastIndexOf('}') + 1));
          work = normalize(obj); paintEditor(); status('Đã nạp file — bấm Lưu để giữ.');
        }).catch(err => status('Không đọc được file: ' + err.message));
      }
    });
    dlg.addEventListener('click', e => {
      const b = e.target.closest('[data-do]'); if (!b || b.tagName === 'INPUT') return;
      const li = b.closest('.sa-ed-item'), i = li ? +li.dataset.i : -1, d = b.dataset.do;
      if (d === 'close') { e.preventDefault(); dlg.close(); return; }
      if (d === 'save') { e.preventDefault(); save(); return; }
      if (d === 'add') { work.theses.push(normalize({theses: [{sign: 'neutral'}]}).theses[0]); paintEditor(true); const last = dlg.querySelector('.sa-ed-item:last-child [data-k=title]'); last?.focus(); last?.scrollIntoView({block: 'center'}); return; }
      if (d === 'top') return move(i, 0);
      if (d === 'up') return move(i, i - 1);
      if (d === 'down') return move(i, i + 1);
      if (d === 'hide') { work.theses[i].hidden = !work.theses[i].hidden; paintEditor(true); return; }
      if (d === 'del') { if (confirm(`Xóa luận điểm ${i + 1}${work.theses[i].title ? ' "' + work.theses[i].title + '"' : ''}?`)) { work.theses.splice(i, 1); paintEditor(true); } return; }
      if (d === 'export') { exportFile(); return; }
      if (d === 'reset') { if (confirm('Bỏ bản nháp trên trình duyệt này và hiện lại bản đăng?')) del().then(() => { draft = null; dlg.close(); render(); }); }
    });
    // Kéo thả sắp xếp (bàn phím/cảm ứng: dùng nút ⤒ ↑ ↓).
    let dragI = -1;
    dlg.addEventListener('dragstart', e => { const li = e.target.closest?.('.sa-ed-item'); if (!li || e.target.matches('input,textarea,select')) return; dragI = +li.dataset.i; li.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(dragI)); });
    dlg.addEventListener('dragover', e => { if (dragI < 0) return; const li = e.target.closest?.('.sa-ed-item'); if (!li) return; e.preventDefault(); dlg.querySelectorAll('.is-over').forEach(x => x.classList.remove('is-over')); li.classList.add('is-over'); });
    dlg.addEventListener('drop', e => { const li = e.target.closest?.('.sa-ed-item'); if (dragI < 0 || !li) return; e.preventDefault(); const to = +li.dataset.i, from = dragI; dragI = -1; move(from, to); });
    dlg.addEventListener('dragend', () => { dragI = -1; dlg.querySelectorAll('.is-drag,.is-over').forEach(x => x.classList.remove('is-drag', 'is-over')); });
    dlg.addEventListener('submit', e => { e.preventDefault(); save(); });
  }
  paintEditor();
  dlg.showModal();
  if (dbError) status('Trình duyệt không cho lưu (IndexedDB). Vẫn xuất file được.');
}
function save() {
  const sc = work.score;
  if (sc != null && (isNaN(sc) || sc < 0 || sc > work.scoreMax)) { status(`Điểm phải từ 0 đến ${work.scoreMax}.`); return; }
  work.theses = work.theses.filter(t => t.title.trim() || t.text.trim() || t.data.trim() || t.catalyst.trim());
  const rec = {id: KEY, sector, type: 'assessment', config: clone(work), baseRev: published.rev || '', savedAt: new Date().toISOString()};
  put(rec).then(() => { draft = rec; render(); dlg.close(); }).catch(err => status('Không lưu được: ' + (err?.message || err)));
}
function exportFile() {
  const out = clone(work); out.rev = new Date().toISOString().slice(0, 10) + '-' + Date.now().toString(36).slice(-4);
  const body = `/* Đánh giá ngành · ${sector} — xuất từ khung chỉnh lúc ${new Date().toLocaleString('vi-VN')}. Thay data/sector-assessment/${sector}.js bằng file này rồi đăng lại trang. */\n(window.SECTOR_ASSESSMENT = window.SECTOR_ASSESSMENT || {})[${JSON.stringify(sector)}] = ${JSON.stringify(out, null, 2)};\n`;
  const url = URL.createObjectURL(new Blob([body], {type: 'text/javascript'})), a = el('a'); a.href = url; a.download = sector + '.js'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  status(`Đã xuất ${sector}.js (rev ${out.rev}).`);
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
  window.SectorAssessment = {config: current, published: () => published, targets, go, render};
}
if (window.SectorBoot) SectorBoot.add(1250, () => dbReady.then(mount));
else dbReady.then(() => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', mount) : mount());
})();
