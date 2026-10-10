/* One project-relative route map for the hub and all sector dashboards. */
(() => {
  'use strict';
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const version = script.dataset.release;
  const routes = {
    home: {path: '', label: 'Trang tổng'},
    oil: {path: 'Dau-khi/', label: 'Dầu khí'},
    sugar: {path: 'Sugar/', label: 'Đường'},
    bank: {path: 'Bank/', label: 'Ngân hàng'},
    power: {path: 'Dien/', label: 'Điện'},
    realestate: {path: 'Bat-dong-san/', label: 'Bất động sản'},
    textile: {path: 'Det-may/', label: 'Dệt may'},
    port: {path: 'Cang-bien/', label: 'Cảng & kho bãi'},
    agri: {path: 'Nong-nghiep/', label: 'Nông nghiệp & thực phẩm'},
    seafood: {path: 'Thuy-san/', label: 'Thủy sản'},
    plan: {path: 'Masterplan/', label: 'Master plan'}
  };
  const aliases = {'dau-khi':'oil', 'duong':'sugar', 'sugar':'sugar', 'ngan-hang':'bank', 'bank':'bank', 'dien':'power', 'power':'power', 'bat-dong-san':'realestate', 'bds':'realestate', 'realestate':'realestate', 'det-may':'textile', 'textile':'textile', 'cang-bien':'port', 'cang':'port', 'port':'port', 'nong-nghiep':'agri', 'agri':'agri', 'thuy-san':'seafood', 'seafood':'seafood'};
  function href(key) {
    if (!routes[key]) throw new Error('Unknown dashboard route: '+key);
    const url = new URL(routes[key].path, root);
    if (version) url.searchParams.set('v', version);
    return url.href;
  }
  function redirectHubAlias() {
    const isHub = location.pathname === root.pathname || location.pathname === root.pathname+'index.html';
    const key = aliases[location.hash.slice(1).toLowerCase()];
    if (!isHub || !key) return false;
    document.documentElement.dataset.redirecting = 'true';
    location.replace(href(key));
    return true;
  }

  // Search box as in the Stock dashboard ("Tra cứu cổ phiếu"): sectors by name, listed companies by ticker.
  const SECTOR_WORDS = {home:'trang tổng hub', oil:'dầu khí oil gas xăng', sugar:'đường mía sugar', bank:'ngân hàng bank tín dụng', power:'điện power năng lượng', realestate:'bất động sản bds kcn khu công nghiệp nhà ở', textile:'dệt may sợi garment', port:'cảng biển kho bãi logistics vận tải', agri:'nông nghiệp thực phẩm gạo cà phê cao su chăn nuôi heo sữa bia', seafood:'thủy sản cá tra tôm seafood'};
  function mountSearch() {
    const sec = document.createElement('section'); sec.className = 'fs-search'; sec.setAttribute('aria-label', 'Tìm dashboard ngành');
    sec.innerHTML = '<form id="fsSearch" role="search" autocomplete="off"><label for="fsQuery">Tra cứu ngành</label>'
      + '<div class="search-box"><span class="search-icon" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></span>'
      + '<input id="fsQuery" type="search" placeholder="Nhập tên ngành…" aria-controls="fsOptions" aria-expanded="false" aria-describedby="fsMessage" spellcheck="false">'
      + '<button type="submit" aria-label="Mở dashboard" title="Mở dashboard (Enter)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16m-7-7 7 7-7 7"/></svg></button></div>'
      + '<div class="options" id="fsOptions" role="listbox" aria-label="Kết quả phù hợp"></div><div class="message" id="fsMessage" role="status"></div></form>';
    document.querySelector('.fs-brandbar').after(sec);
    const form = sec.querySelector('form'), input = sec.querySelector('input'), options = sec.querySelector('.options'), message = sec.querySelector('.message');
    const norm = t => String(t || '').toLocaleLowerCase('vi').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    let entries = [], loaded = false, matches = [], selected = 0;
    function build() {
      entries = ['oil','sugar','bank','power','realestate','textile','port','agri','seafood'].map(k => ({kind:'sector', code:routes[k].label, sub:'Dashboard ngành', key:k, words:norm(routes[k].label + ' ' + SECTOR_WORDS[k])}));
      const companies = (window.COMPANY_COMPARISON && window.COMPANY_COMPARISON.companies) || [];
      companies.forEach(c => { if (!routes[c.sector]) return; entries.push({kind:'stock', code:c.symbol, sub:routes[c.sector].label + (c.group ? ' · ' + c.group : ''), key:c.sector, words:norm(c.symbol + ' ' + c.group)}); });
      loaded = companies.length > 0;
    }
    function ensureCompanies() {
      if (loaded || window.COMPANY_COMPARISON || document.querySelector('script[data-fs-search]')) return;
      const s = document.createElement('script'); s.src = new URL('data/company-comparison.js', root).href; s.dataset.fsSearch = '1';
      s.onload = () => { build(); render(); }; document.head.append(s);
    }
    function go(e) {
      if (e.kind === 'stock') { const u = new URL(href(e.key)); u.searchParams.set('ma', e.code); u.hash = 'mt1'; location.assign(u.href); }
      else location.assign(href(e.key));
    }
    function close() { options.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); }
    function render() {
      const q = norm(input.value.trim()); message.textContent = '';
      matches = q ? entries.filter(e => norm(e.code).startsWith(q) || e.words.includes(q)).sort((a, b) => (norm(b.code) === q) - (norm(a.code) === q) || (a.kind === 'sector' ? -1 : 1) - (b.kind === 'sector' ? -1 : 1)).slice(0, 12) : entries.filter(e => e.kind === 'sector');
      selected = 0; options.replaceChildren();
      matches.forEach((e, i) => {
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'option' + (i === selected ? ' selected' : ''); btn.setAttribute('role', 'option');
        const b = document.createElement('b'); b.textContent = e.code; const sp = document.createElement('span'); sp.textContent = e.sub;
        btn.append(b, sp); btn.addEventListener('click', () => go(e)); options.append(btn);
      });
      options.classList.toggle('open', matches.length > 0); input.setAttribute('aria-expanded', String(matches.length > 0));
    }
    form.addEventListener('submit', ev => {
      ev.preventDefault(); const q = norm(input.value.trim());
      if (!q) { input.focus(); render(); return; }
      const m = entries.find(e => norm(e.code) === q) || matches[selected];
      if (m) { go(m); return; }
      close(); message.textContent = loaded ? 'Chưa có dashboard cho ngành này.' : 'Đang tải danh sách mã, thử lại sau giây lát.';
    });
    ['focus', 'click', 'input'].forEach(t => input.addEventListener(t, () => { ensureCompanies(); render(); }));
    input.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') { close(); return; }
      if (!matches.length || (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp')) return;
      ev.preventDefault(); selected = (selected + (ev.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      [...options.children].forEach((n, i) => n.classList.toggle('selected', i === selected));
    });
    document.addEventListener('click', ev => { if (!form.contains(ev.target)) close(); });
    build();
    // Arriving from a ticker search: open Tổng quan › So sánh tài chính filtered to that ticker.
    const ma = new URLSearchParams(location.search).get('ma');
    if (ma) setTimeout(() => {
      const tab = [...document.querySelectorAll('#pane-mt1 .pane-subtabs button')].find(b => /So sánh tài chính/.test(b.textContent)); if (tab) tab.click();
      const box = document.getElementById('comparison-search'); if (box) { box.value = ma; box.dispatchEvent(new Event('input', {bubbles: true})); box.closest('section')?.scrollIntoView({block: 'start'}); }
    }, 300);
  }
  window.DashboardSite = Object.freeze({root: root.href, version, routes, aliases, href, redirectHubAlias});
  // Resolve historical /?v=...#ngan-hang links before rendering hub previews.
  redirectHubAlias();
  window.addEventListener('hashchange', redirectHubAlias);
  document.addEventListener('DOMContentLoaded', () => {
    // Logo bar as in the Stock dashboard; one per page, above the sector switcher.
    if (!document.querySelector('.fs-brandbar') && document.querySelector('[data-site-navigation]')) {
      const bar = document.createElement('div'); bar.className = 'fs-brandbar';
      const inner = document.createElement('div'); inner.className = 'in';
      const home = document.createElement('a'); home.dataset.siteRoute = 'home'; home.href = href('home'); home.setAttribute('aria-label', 'FinSuccess · tra cứu ngành');
      const logo = document.createElement('img'); logo.src = new URL('assets/fin-success-logo.png', root).href; logo.alt = 'FinSuccess';
      home.append(logo); inner.append(home); bar.append(inner); document.body.prepend(bar);
    }
    if (document.querySelector('.fs-brandbar') && !document.querySelector('.fs-search')) mountSearch();
    // Sector title band sits above the major tabs, like the ticker band in the Stock dashboard.
    const title = document.querySelector('.container > .research-header'), tabs = document.querySelector('nav.majortabs');
    if (title && tabs) { title.classList.add('fs-titleband'); tabs.before(title); }
    document.querySelectorAll('[data-site-navigation]').forEach(nav => {
      const active = nav.dataset.siteNavigation;
      nav.classList.add('site-navigation');
      nav.setAttribute('aria-label','Điều hướng dashboard ngành');
      nav.replaceChildren();
      for (const key of ['oil','sugar','bank','power','realestate','textile','port','agri','seafood']) {
        const link = document.createElement('a');
        link.href = href(key);
        link.dataset.siteRoute = key;
        link.textContent = routes[key].label;
        if (key === active) link.setAttribute('aria-current','page');
        nav.append(link);
      }
      // On narrow screens the switcher scrolls horizontally: bring the current sector into view.
      const cur = nav.querySelector('[aria-current]');
      if (cur) requestAnimationFrame(() => { nav.scrollLeft = cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2; });
    });
    document.querySelectorAll('[data-site-route]').forEach(link => {
      link.href = href(link.dataset.siteRoute);
    });
    document.querySelectorAll('[data-release-label]').forEach(label => {
      label.textContent = 'Bản giao diện '+version+' · Kỳ dữ liệu ghi tại từng biểu đồ';
    });
  });
})();
