/* Thanh ngành bên trái (26/11/2026), mẫu chung chép vào mọi gói bằng scripts/sync_site_sidebar.py — sửa ở đây rồi chạy lại script.
   Cây ngành lấy từ data/site-nav.js (window.FS_SITE_NAV); đường dẫn lấy từ site-navigation.js (window.DashboardSite.href).
   Luôn hiện: máy tính, máy tính bảng là cột trái cố định; điện thoại (<768px) là dải ngành ngang dính đầu trang.
   Trang nhúng trong website tổng (html.fs-embed) không dựng thanh vì website tổng đã có menu. */
(() => {
  'use strict';
  const root = document.documentElement, NAV = window.FS_SITE_NAV;
  if (!NAV || root.classList.contains('fs-embed')) return;
  root.classList.add('fs-has-sidebar');
  const OPEN = 'fs_sb_open_v1', SHUT = 'fs_sb_collapsed_v1';
  // Thu gọn / mở thanh (máy tính, máy tính bảng): nhớ lựa chọn; đặt lớp ngay từ đầu để không xô bố cục.
  try { if (localStorage.getItem(SHUT) === '1') root.classList.add('fs-sb-collapsed'); } catch (e) { /* mặc định mở */ }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const mobile = matchMedia('(max-width: 767px)');
  let opened = {};
  try { opened = JSON.parse(localStorage.getItem(OPEN) || '{}') || {}; } catch (e) { /* mặc định đóng */ }
  const saveOpen = () => { try { localStorage.setItem(OPEN, JSON.stringify(opened)); } catch (e) { /* chỉ phiên này */ } };

  function hrefOf(it) {
    const S = window.DashboardSite; if (!it.key || !S) return null;
    try {
      const u = new URL(S.href(it.key), location.href);
      if (it.sub) u.searchParams.set('sub', it.sub);
      if (it.hash) u.hash = it.hash;
      return u.href;
    } catch (e) { return null; }
  }
  function current() {
    return {key: document.querySelector('[data-site-navigation]')?.dataset.siteNavigation || '', sub: new URLSearchParams(location.search).get('sub') || ''};
  }
  // Mục đang xem: ngành con có sub khớp được ưu tiên; không khớp con nào thì tô ngành cha.
  function activeItem(cur) {
    const all = [];
    const walk = (items, trail) => items.forEach(it => { all.push({it, path: trail.concat(it)}); if (it.children) walk(it.children, trail.concat(it)); });
    NAV.groups.forEach(g => walk(g.items, []));
    const m = all.find(x => x.it.key === cur.key && x.it.sub && x.it.sub === cur.sub) || all.find(x => x.it.key === cur.key && !x.it.sub);
    return m ? {hit: m.it, path: m.path} : {hit: null, path: []};
  }
  const groupId = it => 'g-' + it.label.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  function itemHtml(it, act, depth) {
    const on = it === act.hit, cls = 'fs-sb-i' + (on ? ' on' : '') + (it.soon ? ' soon' : '') + (depth ? ' kid' : '');
    if (it.soon) return `<li><span class="${cls}" aria-disabled="true"><i></i><span>${esc(it.label)}</span><small>Sắp có</small></span></li>`;
    const href = hrefOf(it);
    if (!it.children) return `<li><a class="${cls}" href="${esc(href || '#')}"${on ? ' aria-current="page"' : ''}><i></i><span>${esc(it.label)}</span></a></li>`;
    const id = groupId(it), inPath = act.path.includes(it), open = inPath || opened[id] === true;
    const head = href
      ? `<div class="fs-sb-par${on ? ' on' : ''}"><a class="fs-sb-i${on ? ' on' : ''}" href="${esc(href)}"${on ? ' aria-current="page"' : ''}><i></i><span>${esc(it.label)}</span></a><button type="button" class="fs-sb-tog" data-g="${id}" aria-expanded="${open}" aria-controls="fs-sb-${id}" aria-label="Mở ngành con của ${esc(it.label)}"></button></div>`
      : `<button type="button" class="fs-sb-i fs-sb-grp${inPath ? ' in' : ''}" data-g="${id}" aria-expanded="${open}" aria-controls="fs-sb-${id}"><i></i><span>${esc(it.label)}</span><b class="fs-sb-chev" aria-hidden="true"></b></button>`;
    return `<li class="fs-sb-node">${head}<ul class="fs-sb-kids" id="fs-sb-${id}"${open ? '' : ' hidden'}>${it.children.map(c => itemHtml(c, act, depth + 1)).join('')}</ul></li>`;
  }

  // Điện thoại: dải ngang. Hàng 1 là ngành và nhóm; chạm nhóm thì hàng 2 hiện ngành con.
  function stripHtml(act) {
    const top = NAV.groups[0].items.filter(it => !it.soon);
    const chip = (it, extra) => {
      const on = it === act.hit || (it.children && act.path.includes(it));
      if (it.children) return `<button type="button" class="fs-sbchip grp${on ? ' on' : ''}" data-g="${groupId(it)}" aria-expanded="false">${esc(it.label)}<b class="fs-sb-chev" aria-hidden="true"></b></button>`;
      return `<a class="fs-sbchip${on ? ' on' : ''}" href="${esc(hrefOf(it) || '#')}"${it === act.hit ? ' aria-current="page"' : ''}>${esc(extra || it.label)}</a>`;
    };
    const subs = top.filter(it => it.children).map(it => {
      const kids = it.children.filter(c => !c.soon), all = it.key ? [chip({key: it.key, label: 'Toàn ngành'}, 'Toàn ngành')] : [];
      return `<div class="fs-strip-sub" data-g="${groupId(it)}" hidden>${all.join('')}${kids.map(c => chip(c)).join('')}</div>`;
    }).join('');
    return `<div class="fs-strip-row">${top.map(it => chip(it)).join('')}</div>${subs}`;
  }

  function build() {
    if (document.querySelector('.fs-sb')) return;
    const cur = current(), act = activeItem(cur);
    const homeA = document.querySelector('.fs-brandbar a[data-site-route="home"]'), logo = homeA?.querySelector('img');
    const sb = document.createElement('aside'); sb.className = 'fs-sb'; sb.setAttribute('aria-label', 'Danh mục ngành');
    sb.innerHTML = `<div class="fs-sb-top"><a class="fs-sb-logo" href="${esc(homeA?.href || hrefOf({key: 'home'}) || '../')}" aria-label="FinSuccess · trang tổng">${logo ? `<img src="${esc(logo.src)}" alt="FinSuccess">` : 'FinSuccess'}</a>`
      + '<button type="button" class="fs-sb-fold" aria-controls="fs-sb-body"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>'
      + '<button type="button" class="fs-sb-rail" aria-label="Mở thanh ngành"><span>Ngành</span></button>'
      + '<div class="fs-sb-search"></div><nav class="fs-sb-tree" id="fs-sb-body" aria-label="Ngành">'
      + NAV.groups.map((g, gi) => `<div class="fs-sb-h${gi ? ' sub' : ''}">${gi ? '' : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 14h12M4 12V7M8 12V3M12 12V9" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>'}${esc(g.title)}</div><ul>${g.items.map(it => itemHtml(it, act, 0)).join('')}</ul>`).join('')
      + '</nav>';
    document.body.prepend(sb);
    const strip = document.createElement('nav'); strip.className = 'fs-strip'; strip.setAttribute('aria-label', 'Danh mục ngành'); strip.innerHTML = stripHtml(act);
    const bar = document.querySelector('.fs-brandbar');
    if (bar) bar.after(strip); else document.body.prepend(strip);
    // Trang bọc iframe (Ngân hàng, Chứng khoán) ẩn mọi con của body ngoài danh sách giữ lại: thanh ngành luôn hiện.
    [sb, strip].forEach(el => { el.hidden = false; new MutationObserver(() => { if (el.hidden) el.hidden = false; }).observe(el, {attributes: true, attributeFilter: ['hidden']}); });

    // Đường dẫn trên đầu trang: Ngành › nhóm › ngành con.
    const inner = bar?.querySelector('.in');
    if (inner && act.path.length && !inner.querySelector('.fs-navpath')) {
      const crumb = document.createElement('nav'); crumb.className = 'fs-navpath'; crumb.setAttribute('aria-label', 'Đang xem');
      crumb.innerHTML = '<span>Ngành</span>' + act.path.map((it, i) => { const h = hrefOf(it), last = i === act.path.length - 1; return '<b aria-hidden="true">›</b>' + (h && !last ? `<a href="${esc(h)}">${esc(it.label)}</a>` : `<span${last ? ' aria-current="page"' : ''}>${esc(it.label)}</span>`); }).join('');
      inner.prepend(crumb);
    }

    sb.addEventListener('click', e => {
      const t = e.target.closest('[data-g]'); if (!t || t.closest('.fs-strip')) return;
      const id = t.dataset.g, kids = sb.querySelector('#fs-sb-' + id), open = kids.hidden;
      kids.hidden = !open; sb.querySelectorAll(`[data-g="${id}"]`).forEach(b => b.setAttribute('aria-expanded', String(open)));
      opened[id] = open; saveOpen();
    });
    strip.addEventListener('click', e => {
      const b = e.target.closest('button.fs-sbchip'); if (!b) return;
      const id = b.dataset.g, row = strip.querySelector(`.fs-strip-sub[data-g="${id}"]`), open = row.hidden;
      strip.querySelectorAll('.fs-strip-sub').forEach(r => { r.hidden = true; });
      strip.querySelectorAll('button.fs-sbchip').forEach(x => x.setAttribute('aria-expanded', 'false'));
      row.hidden = !open; b.setAttribute('aria-expanded', String(open)); measure();
    });
    // Nhóm chứa ngành đang xem mở sẵn hàng con trên điện thoại.
    const grp = strip.querySelector('button.fs-sbchip.on'); if (grp && act.path.length > 1) grp.click();

    // Ô tra cứu: trong thanh trái trên máy tính, trở lại đầu trang trên điện thoại.
    const search = document.querySelector('.fs-search.fs-search-inline');
    const collapsed = () => root.classList.contains('fs-sb-collapsed');
    const place = () => {
      if (!search || !inner) return;
      if (mobile.matches || collapsed()) { if (search.parentElement !== inner) inner.insertBefore(search, inner.querySelector('.fs-theme')); }
      else if (search.parentElement !== sb.querySelector('.fs-sb-search')) sb.querySelector('.fs-sb-search').append(search);
    };
    place(); mobile.addEventListener?.('change', () => { place(); measure(); });

    // Nút « thu thanh về một dải hẹp bên trái; bấm dải hẹp để mở lại. Nhớ lựa chọn cho các lần mở trang sau.
    const fold = sb.querySelector('.fs-sb-fold'), rail = sb.querySelector('.fs-sb-rail');
    const syncFold = () => {
      const c = collapsed();
      fold.setAttribute('aria-expanded', String(!c)); fold.setAttribute('aria-label', c ? 'Mở thanh ngành' : 'Thu gọn thanh ngành'); fold.title = c ? 'Mở thanh ngành' : 'Thu gọn thanh ngành';
    };
    const setCollapsed = c => {
      root.classList.toggle('fs-sb-collapsed', c);
      try { localStorage.setItem(SHUT, c ? '1' : '0'); } catch (e) { /* chỉ phiên này */ }
      syncFold(); place();
      // Chart vẽ theo bề rộng khung: báo đổi kích thước sau khi lề trái đổi xong.
      setTimeout(() => dispatchEvent(new Event('resize')), 220);
      (c ? rail : fold).focus({preventScroll: true});
    };
    fold.addEventListener('click', () => setCollapsed(!collapsed()));
    rail.addEventListener('click', () => setCollapsed(false));
    syncFold();

    // Thanh tab lớn dính ngay dưới dải ngành trên điện thoại.
    function measure() { root.style.setProperty('--fs-strip-h', (mobile.matches ? strip.offsetHeight : 0) + 'px'); }
    measure(); addEventListener('resize', measure);
    // Sau khi trang tải xong (bố cục đã ổn định): đưa mục đang xem vào tầm nhìn của dải ngang / cột trái, không cuộn trang.
    const reveal = () => {
      const on = strip.querySelector('.fs-sbchip.on'); if (on && mobile.matches) on.parentElement.scrollLeft = on.offsetLeft - (on.parentElement.clientWidth - on.offsetWidth) / 2;
      const a = sb.querySelector('.fs-sb-i.on'), tr = sb.querySelector('.fs-sb-tree');
      if (a && !mobile.matches && tr.clientHeight > 200) { const ra = a.getBoundingClientRect(), rt = tr.getBoundingClientRect(); if (ra.bottom > rt.bottom - 8) tr.scrollTop += ra.bottom - rt.bottom + rt.height / 3; }
    };
    if (document.readyState === 'complete') setTimeout(reveal, 0); else addEventListener('load', () => setTimeout(reveal, 0), {once: true});

    // Trang tự đổi ?sub= khi bấm sub-tab (Thủy sản Cá tra/Tôm): tô lại mục đang xem.
    const resync = () => setTimeout(() => {
      const c = current(); if (c.sub === cur.sub && c.key === cur.key) return;
      cur.sub = c.sub; const a2 = activeItem(c);
      sb.querySelectorAll('.fs-sb-i.on,.fs-sb-par.on').forEach(n => { n.classList.remove('on'); n.removeAttribute('aria-current'); });
      sb.querySelectorAll('a.fs-sb-i').forEach(n => { if (a2.hit && n.getAttribute('href') === hrefOf(a2.hit)) { n.classList.add('on'); n.setAttribute('aria-current', 'page'); } });
    }, 0);
    document.addEventListener('click', resync); addEventListener('popstate', resync);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
