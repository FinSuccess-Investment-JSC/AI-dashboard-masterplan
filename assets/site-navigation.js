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
  window.DashboardSite = Object.freeze({root: root.href, version, routes, aliases, href, redirectHubAlias});
  // Resolve historical /?v=...#ngan-hang links before rendering hub previews.
  redirectHubAlias();
  window.addEventListener('hashchange', redirectHubAlias);
  document.addEventListener('DOMContentLoaded', () => {
    // Logo bar as in the Stock dashboard; one per page, above the sector switcher.
    if (!document.querySelector('.fs-brandbar') && document.querySelector('[data-site-navigation]')) {
      const bar = document.createElement('div'); bar.className = 'fs-brandbar';
      const inner = document.createElement('div'); inner.className = 'in';
      const logo = document.createElement('img'); logo.src = new URL('assets/fin-success-logo.png', root).href; logo.alt = 'FinSuccess';
      inner.append(logo); bar.append(inner); document.body.prepend(bar);
    }
    // Sector title band sits above the major tabs, like the ticker band in the Stock dashboard.
    const title = document.querySelector('.container > .research-header'), tabs = document.querySelector('nav.majortabs');
    if (title && tabs) { title.classList.add('fs-titleband'); tabs.before(title); }
    document.querySelectorAll('[data-site-navigation]').forEach(nav => {
      const active = nav.dataset.siteNavigation;
      nav.classList.add('site-navigation');
      nav.setAttribute('aria-label','Điều hướng dashboard ngành');
      nav.replaceChildren();
      for (const key of ['home','oil','sugar','bank','power','realestate','textile','port','agri','seafood']) {
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
