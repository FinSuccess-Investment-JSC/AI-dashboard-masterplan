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
    shipping: {path: 'Van-tai-bien/', label: 'Vận tải biển'},
    construction: {path: 'Xay-dung/', label: 'Xây dựng · VLXD · Đầu tư công'},
    insurance: {path: 'Bao-hiem/', label: 'Bảo hiểm'},
    retail: {path: 'Ban-le/', label: 'Bán lẻ & tiêu dùng'},
    pharma: {path: 'Duoc/', label: 'Dược & y tế'},
    plan: {path: 'Masterplan/', label: 'Master plan'}
  };
  const aliases = {'dau-khi':'oil', 'duong':'sugar', 'sugar':'sugar', 'ngan-hang':'bank', 'bank':'bank', 'dien':'power', 'power':'power', 'bat-dong-san':'realestate', 'bds':'realestate', 'realestate':'realestate', 'det-may':'textile', 'textile':'textile', 'cang-bien':'port', 'cang':'port', 'port':'port', 'nong-nghiep':'agri', 'agri':'agri', 'thuy-san':'seafood', 'seafood':'seafood', 'van-tai-bien':'shipping', 'van-tai':'shipping', 'shipping':'shipping', 'xay-dung':'construction', 'vlxd':'construction', 'dau-tu-cong':'construction', 'construction':'construction', 'bao-hiem':'insurance', 'insurance':'insurance', 'ban-le':'retail', 'tieu-dung':'retail', 'retail':'retail', 'duoc':'pharma', 'y-te':'pharma', 'pharma':'pharma'};
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
  const SECTOR_WORDS = {home:'trang tổng hub', oil:'dầu khí oil gas xăng', sugar:'đường mía sugar', bank:'ngân hàng bank tín dụng', power:'điện power năng lượng', realestate:'bất động sản bds kcn khu công nghiệp nhà ở', textile:'dệt may sợi garment', port:'cảng biển kho bãi logistics vận tải', agri:'nông nghiệp thực phẩm gạo cà phê cao su chăn nuôi heo sữa bia', seafood:'thủy sản cá tra tôm seafood', shipping:'vận tải biển tàu dầu tanker hàng rời container shipping cước hormuz', construction:'xây dựng vật liệu vlxd đầu tư công thép xi măng đá nhựa đường hạ tầng cao tốc nhà thầu giải ngân', insurance:'bảo hiểm insurance nhân thọ phi nhân thọ tái bảo hiểm bancassurance', retail:'bán lẻ tiêu dùng retail siêu thị điện máy sữa bia đường ô tô trang sức vàng tmđt', pharma:'dược phẩm y tế thuốc pharma bệnh viện nhà thuốc long châu bhyt đấu thầu'};
  function mountSearch() {
    const sec = document.createElement('section'); sec.className = 'fs-search'; sec.setAttribute('aria-label', 'Tìm dashboard ngành');
    sec.innerHTML = '<form id="fsSearch" role="search" autocomplete="off"><label for="fsQuery">Tra cứu ngành</label>'
      + '<div class="search-box"><span class="search-icon" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></span>'
      + '<input id="fsQuery" type="search" placeholder="Nhập tên ngành…" aria-controls="fsOptions" aria-expanded="false" aria-describedby="fsMessage" spellcheck="false">'
      + '<button type="submit" aria-label="Mở dashboard" title="Mở dashboard (Enter)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16m-7-7 7 7-7 7"/></svg></button></div>'
      + '<div class="options" id="fsOptions" role="listbox" aria-label="Kết quả phù hợp"></div><div class="message" id="fsMessage" role="status"></div></form>';
    // Trang ngành: ô tra cứu cùng hàng logo như Stock dashboard; trang gốc giữ ô lớn dưới logo.
    const inline = document.querySelector('.majortabs, [data-research-sector], body[data-sector]');
    if (inline) { sec.classList.add('fs-search-inline'); document.querySelector('.fs-brandbar .in').append(sec); }
    else document.querySelector('.fs-brandbar').after(sec);
    const form = sec.querySelector('form'), input = sec.querySelector('input'), options = sec.querySelector('.options'), message = sec.querySelector('.message');
    const norm = t => String(t || '').toLocaleLowerCase('vi').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    let entries = [], loaded = false, matches = [], selected = 0;
    function build() {
      entries = ['oil','sugar','bank','power','realestate','textile','port','agri','seafood','shipping','construction','insurance','retail','pharma'].map(k => ({kind:'sector', code:routes[k].label, sub:'', key:k, words:norm(routes[k].label + ' ' + SECTOR_WORDS[k])}));
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
    // Tab chính không đánh số, như Stock dashboard (thứ tự tab giữ nguyên).
    document.querySelectorAll('.majortabbtn').forEach(b => { const t = b.firstChild; if (t && t.nodeType === 3) t.nodeValue = t.nodeValue.replace(/^\s*\d+\.\s*/, ''); });
    // Sector title band sits above the major tabs, like the ticker band in the Stock dashboard.
    const title = document.querySelector('.container > .research-header'), tabs = document.querySelector('nav.majortabs');
    if (title && tabs) { title.classList.add('fs-titleband'); tabs.before(title); }
    document.querySelectorAll('[data-site-navigation]').forEach(nav => {
      const active = nav.dataset.siteNavigation;
      nav.classList.add('site-navigation');
      nav.setAttribute('aria-label','Điều hướng dashboard ngành');
      nav.replaceChildren();
      for (const key of ['oil','sugar','bank','power','realestate','textile','port','agri','seafood','shipping','construction','insurance','retail','pharma']) {
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

// Card chart như Stock dashboard (rule §5, 28/10/2026): một icon ⓘ cạnh tiêu đề chứa giải thích + nguồn,
// thay hai nút "ⓘ Insight" / "ⓘ Nguồn" dưới chart. Chỉ di chuyển nút và nội dung, giữ nguyên popover.
(() => {
  function merge() {
    document.querySelectorAll('.card, .viz-block, .opec-drivers').forEach(card => {
      if (card.dataset.fsInfo) return;
      const title = card.querySelector('.chart-title, h3');
      const src = card.querySelector('.chart-source-action'), ins = card.querySelector('.chart-insight-action');
      if (!title || (!src && !ins)) return;
      card.dataset.fsInfo = '1';
      const keep = src || ins;
      if (src && ins) {
        const sp = document.getElementById(src.getAttribute('aria-controls')), ip = document.getElementById(ins.getAttribute('aria-controls'));
        if (sp && ip) {
          const head = sp.querySelector('.info-heading');
          const box = document.createElement('div'); box.className = 'fs-info-explain';
          [...ip.childNodes].forEach(n => { if (!(n.classList && n.classList.contains('info-heading'))) box.append(n); });
          head ? head.after(box) : sp.prepend(box);
          ins.remove();
        }
      }
      keep.textContent = 'ⓘ'; keep.classList.add('fs-title-info');
      keep.setAttribute('aria-label', 'Ghi chú và nguồn: ' + title.textContent.trim());
      title.append(keep);
      tidyTitle(card, title, document.getElementById(keep.getAttribute('aria-controls')));
      const acts = card.querySelector('.chart-card-actions');
      if (acts && !acts.children.length) acts.hidden = true;
    });
  }
  // Tiêu đề chỉ tên chỉ tiêu + (đơn vị) (rule §5): bỏ "— theo tháng"…, dòng phụ phương pháp/nguồn vào ⓘ. Không đổi chữ nội dung.
  const UNIT = /(%|°C|USD|VND|đồng|tỷ|triệu|nghìn|tấn|thùng|kWh|MW|GW|TEU|m³|cent|điểm|lần|\/)/;
  function tidyTitle(card, title, panel) {
    const tn = [...title.childNodes].filter(n => n.nodeType === 3 && n.nodeValue.trim()).pop();
    if (tn) tn.nodeValue = tn.nodeValue.replace(/\s*[—–,-]?\s*(theo|hằng|hàng)\s+(ngày|tuần|tháng|quý|năm|phiên)\s*$/i, '');
    const sub = card.querySelector(':scope .chart-sub'); if (!sub || sub.closest('.ct-switch') || !panel) return;
    const parts = sub.textContent.split(' · ').map(t => t.trim()).filter(Boolean);
    let unit = '';
    if (parts.length && parts[0].length <= 32 && UNIT.test(parts[0]) && !/(trung bình|so với|theo|không|chỉ)/i.test(parts[0])) unit = parts.shift();
    if (unit && tn && !/\(.*\)\s*$/.test(tn.nodeValue)) tn.nodeValue = tn.nodeValue.replace(/\s*$/, ` (${unit})`);
    else if (unit) parts.unshift(unit);
    if (parts.length) {
      const note = document.createElement('p'); note.className = 'fs-info-sub'; note.textContent = parts.join(' · ');
      const head = panel.querySelector('.info-heading'); head ? head.after(note) : panel.prepend(note);
    }
    sub.hidden = true;
  }
  // Ngày hiển thị dd/mm/yyyy (rule §3).
  function dmy(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: n => n.parentElement.closest('script,style,code,pre,textarea,select') ? 2 : (/\d{4}-\d{2}-\d{2}/.test(n.nodeValue) ? 1 : 2)});
    const list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(n => { n.nodeValue = n.nodeValue.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, '$3/$2/$1'); });
  }
  const run = () => { merge(); dmy(document.body); setTimeout(() => { merge(); dmy(document.body); }, 1200); };
  if (document.readyState === 'complete') run(); else addEventListener('load', run);
  document.addEventListener('click', e => { if (e.target.closest('.majortabbtn, .tabbtn')) setTimeout(() => { merge(); dmy(document.body); }, 300); });
})();

// Phím tắt như Stock (rule §11): 1–9 chuyển tab chính, ⌘K / Ctrl+K mở ô tra cứu. Giao diện tối Navy đêm (◐).
(() => {
  const THEME = 'fs_theme_v1';
  try { const t = localStorage.getItem(THEME); if (t) document.documentElement.dataset.theme = t; } catch (e) { /* mặc định sáng */ }
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { const q = document.getElementById('fsQuery'); if (q) { e.preventDefault(); q.focus(); q.select(); } return; }
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input,textarea,select,[contenteditable]')) return;
    if (/^[1-9]$/.test(e.key)) { const b = document.querySelectorAll('.majortabbtn')[e.key - 1]; if (b) { b.click(); b.focus(); } }
  });
  function mountToggle() {
    const bar = document.querySelector('.fs-brandbar .in'); if (!bar || bar.querySelector('.fs-theme')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fs-theme'; b.textContent = '◐';
    b.title = 'Giao diện sáng / tối'; b.setAttribute('aria-label', 'Đổi giao diện sáng / tối');
    b.onclick = () => { const dark = document.documentElement.dataset.theme !== 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; try { localStorage.setItem(THEME, dark ? 'dark' : 'light'); } catch (e) { /* chỉ phiên này */ } };
    bar.append(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(mountToggle, 50)); else setTimeout(mountToggle, 50);
  addEventListener('load', mountToggle);
})();

// Lớp chuyển động dùng chung (28/10/2026): flow chart có hạt chạy, gạch chân tab trượt, số KPI đếm lên,
// chart vẽ dần khi xuất hiện lần đầu. Chỉ đổi hình thức; tắt khi prefers-reduced-motion, in ra tĩnh.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const seen = new WeakSet();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); (e.target._fsIn || (() => {}))(); } }), {threshold: .2}) : null;
  const onView = (el, fn) => { if (seen.has(el)) return; seen.add(el); if (!io || reduce) return fn(); el._fsIn = fn; io.observe(el); };

  /* ---- Flow chart: hạt chạy dọc mũi tên, sáng dòng nối khâu đang rê chuột ---- */
  const flows = [];
  function edgesOf(svg) {
    return [...svg.querySelectorAll('path')].filter(p => !p.closest('marker,defs') && getComputedStyle(p).fill === 'none' && getComputedStyle(p).stroke !== 'none' && p.getTotalLength() > 30);
  }
  function setupFlow(svg) {
    if (svg.dataset.fsFlow) return; const edges = edgesOf(svg); if (!edges.length) return;
    svg.dataset.fsFlow = '1'; svg.classList.add('fs-flow');
    const layer = document.createElementNS(SVGNS, 'g'); layer.setAttribute('class', 'fs-dots'); layer.setAttribute('aria-hidden', 'true');
    edges.at(-1).after(layer);
    const items = edges.map(p => {
      const len = p.getTotalLength(), dashed = getComputedStyle(p).strokeDasharray !== 'none';
      const n = Math.max(1, Math.round(len / (dashed ? 160 : 85)));
      const dots = Array.from({length: n}, () => { const c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('r', dashed ? 2.2 : 3.2); c.setAttribute('class', dashed ? 'fs-dot dim' : 'fs-dot'); layer.append(c); return c; });
      const a = p.getPointAtLength(0), b = p.getPointAtLength(len);
      return {p, len, dots, speed: dashed ? 22 : 46, a, b};
    });
    // Khâu (rect/khung) nối với dòng nào: đầu/cuối dòng nằm sát khung.
    const boxes = [...svg.querySelectorAll('rect')].filter(r => !r.closest('marker,defs') && r.getBBox().width > 60 && r.getBBox().height > 24);
    boxes.forEach(r => {
      const g = r.parentNode.tagName === 'g' && r.parentNode !== svg ? r.parentNode : r; const bb = r.getBBox(), pad = 16;
      const near = pt => pt.x >= bb.x - pad && pt.x <= bb.x + bb.width + pad && pt.y >= bb.y - pad && pt.y <= bb.y + bb.height + pad;
      const mine = items.filter(it => near(it.a) || near(it.b));
      if (!mine.length) return;
      g.classList.add('fs-node');
      const on = () => { svg.classList.add('fs-focus'); mine.forEach(it => it.p.classList.add('fs-hot')); };
      const off = () => { svg.classList.remove('fs-focus'); items.forEach(it => it.p.classList.remove('fs-hot')); };
      g.addEventListener('pointerenter', on); g.addEventListener('pointerleave', off);
    });
    const f = {svg, items, t0: performance.now(), visible: false};
    flows.push(f);
    const place = t => items.forEach(it => it.dots.forEach((c, i) => {
      const s = ((t / 1000) * it.speed + i * it.len / it.dots.length) % it.len, pt = it.p.getPointAtLength(s);
      c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1));
      c.style.opacity = Math.min(1, s / 24, (it.len - s) / 24).toFixed(2);
    }));
    f.place = place; place(1200);
    if (io && !reduce) new IntersectionObserver(es => es.forEach(e => { f.visible = e.isIntersecting; })).observe(svg);
  }
  let raf = 0;
  const tick = now => { flows.forEach(f => { if (f.visible && f.svg.isConnected) f.place(now - f.t0); }); raf = requestAnimationFrame(tick); };
  if (!reduce) raf = requestAnimationFrame(tick);

  /* ---- Gạch chân tab chính trượt theo tab đang chọn ---- */
  function ink() {
    const bar = document.querySelector('.majortabs'); if (!bar) return;
    let line = bar.querySelector('.fs-ink'); if (!line) { line = document.createElement('span'); line.className = 'fs-ink'; line.setAttribute('aria-hidden', 'true'); bar.append(line); bar.classList.add('fs-has-ink'); }
    const act = bar.querySelector('.majortabbtn.active, .majortabbtn[aria-selected="true"]'); if (!act) return;
    line.style.width = act.offsetWidth + 'px'; line.style.transform = `translateX(${act.offsetLeft}px)`;
  }
  addEventListener('resize', ink);

  /* ---- Số KPI đếm lên (giữ nguyên chữ gốc ở khung cuối) ---- */
  function countUp(el) {
    if (el.children.length) return;  // chỉ ô số thuần chữ, không phá phần tử con
    const txt = el.textContent, m = txt.match(/-?[\d.]+(,\d+)?/); if (!m) return;
    const raw = m[0], dec = (raw.split(',')[1] || '').length, val = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
    if (!isFinite(val)) return;
    const t0 = performance.now(), dur = 750; let mine = txt;
    const step = now => {
      if (el.textContent !== mine) return;  // script dữ liệu vừa ghi số mới: dừng, không ghi đè
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      mine = k < 1 ? txt.replace(raw, (val * e).toLocaleString('vi-VN', {minimumFractionDigits: dec, maximumFractionDigits: dec})) : txt;
      el.textContent = mine;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---- Quét phần đang hiện ---- */
  function scan() {
    document.querySelectorAll('.value-chain-scroll svg, svg.flow').forEach(svg => { if (svg.getBoundingClientRect().width) setupFlow(svg); });
    document.querySelectorAll('.kpi .value').forEach(el => { if (el.offsetParent) onView(el, () => countUp(el)); });
    document.querySelectorAll('svg.ct-svg, svg.chartsvg').forEach(svg => { if (svg.getBoundingClientRect().width) onView(svg, () => {
      if (reduce) return;
      svg.querySelectorAll('path').forEach(p => {
        if (p.closest('marker,defs') || p.getAttribute('stroke-dasharray') || getComputedStyle(p).fill !== 'none') return;
        const L = Math.ceil(p.getTotalLength()); if (!L) return;
        p.style.strokeDasharray = L; p.style.setProperty('--l', L); p.classList.add('fs-stroke');
        p.addEventListener('animationend', () => { p.style.strokeDasharray = ''; p.classList.remove('fs-stroke'); }, {once: true});
      });
      svg.classList.add('fs-draw');
    }); });
    ink();
  }
  const later = () => setTimeout(scan, 260);
  if (document.readyState === 'complete') later(); else addEventListener('load', () => { scan(); setTimeout(scan, 1300); });
  document.addEventListener('click', e => { if (e.target.closest('.majortabbtn, .tabbtn, [role="tab"]')) later(); });
  let st = 0; addEventListener('scroll', () => { const s = scrollY > 120; if (s !== st) { st = s; document.documentElement.classList.toggle('fs-scrolled', s); } }, {passive: true});
})();

// Chữ thành hình (28/10/2026): đổi đoạn chữ dày thành sơ đồ, icon, data bar, timeline, chip mã.
// Không xóa hay viết lại câu nào: chỉ tách câu, gắn icon, vẽ thêm hình từ chính số/ngày trong bảng.
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const ICON = {
    money: '<path d="M3 7h18v10H3z"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>',
    cost: '<path d="M12 3v18M16 7H10a2.5 2.5 0 0 0 0 5h4a2.5 2.5 0 0 1 0 5H7"/>',
    risk: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    client: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M16 4a3 3 0 0 1 0 6M21 20c0-2-1-4-3-4.6"/>',
    make: '<path d="M3 20V10l6 3V9l6 3V5h6v15z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    input: '<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4"/>',
    law: '<path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z"/>',
    time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    dot: '<circle cx="12" cy="12" r="3"/>'
  };
  const RULES = [
    ['risk', /rủi ro|chịu (thuế|rủi ro|phòng vệ|các vụ)|phòng vệ|chống bán phá giá|cạnh tranh|vướng|thiếu|áp lực|khâu yếu/i],
    ['money', /doanh thu|thu nhập|lợi nhuận|biên|thu phí|cổ tức|chênh lệch giá/i],
    ['cost', /chi phí|lương|giá (bông|xơ|nguyên|vốn|than|dầu)|giá thành/i],
    ['law', /thuế|quy tắc|luật|nghị định|chính sách|hạn ngạch|xuất xứ/i],
    ['client', /nhãn hàng|khách|đơn hàng|nhận đơn|người mua|bán cho/i],
    ['time', /quý|tháng|năm|đi sau|chu kỳ/i],
    ['input', /nguyên liệu|nhập|xơ|bông|vải|phụ liệu/i],
    ['make', /kéo sợi|dệt|may|sản xuất|nhà máy|chế biến|gia công/i],
    ['globe', /Mỹ|EU|Nhật|Trung Quốc|xuất khẩu|thị trường/i]
  ];
  const iconOf = t => (RULES.find(([, re]) => re.test(t)) || ['dot'])[0];
  const svgIcon = k => `<svg class="fs-ic fs-ic-${k}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
  const esc = s => s.replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));
  // Tô số trong câu (chữ giữ nguyên).
  const NUM = /([+−-]?~?\d[\d.,]*(?:–\d[\d.,]*)?\s?(?:%|điểm %|tỷ USD|triệu USD|nghìn tỷ|tỷ đồng|tỷ|USD\/tấn|lần|x)(?![\p{L}]))/gu;
  const markNums = html => html.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, txt) => tag || txt.replace(NUM, '<b class="fs-num">$1</b>'));
  // Tách một <p> thành các dòng có icon; giữ nguyên HTML trong câu (link, <b>).
  function sentences(p) {
    if (p.dataset.fsVis || p.closest('.fs-iconlist,table,.chart-info-panel')) return;
    if (p.querySelector("a,[title]")) { p.innerHTML = markNums(p.innerHTML); p.dataset.fsVis = "1"; return; }
    const parts = p.innerHTML.split(/(?<=[.;])\s+(?=[A-ZĐÂÊÔƠƯÁÀẢÃẠ0-9<])/u).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) { p.innerHTML = markNums(p.innerHTML); p.dataset.fsVis = '1'; return; }
    const ul = document.createElement('ul'); ul.className = 'fs-iconlist'; ul.dataset.fsVis = '1';
    ul.innerHTML = parts.map(s => { const t = s.replace(/<[^>]+>/g, ''); return `<li>${svgIcon(iconOf(t))}<span>${markNums(s)}</span></li>`; }).join('');
    p.replaceWith(ul);
  }
  // Chuỗi mã "TCM · TNG · MSH" thành chip.
  const TICKERS = /^\s*(?:Mã chịu tác động:\s*)?([A-Z]{3}(?:\s*[·,]\s*[A-Z]{3})+)\s*$/;
  function chips(el) {
    if (el.dataset.fsChips || el.children.length > 1) return;
    const t = el.textContent, m = t.match(TICKERS); if (!m) return;
    el.dataset.fsChips = '1';
    el.innerHTML = (t.includes('Mã chịu') ? '<span class="fs-chip-lbl">Mã chịu tác động</span>' : '') + m[1].split(/\s*[·,]\s*/).map(s => `<span class="fs-chip">${s}</span>`).join('');
  }
  // Data bar trong cột số của bảng.
  const numIn = t => { const m = String(t).trim().match(/^([+−-]?\d[\d.]*(?:,\d+)?)\s?(%|điểm %|x|lần)?$/); if (!m) return null; const v = parseFloat(m[1].replace(/\./g, '').replace(',', '.').replace('−', '-')); return isFinite(v) ? {v, u: m[2] || ''} : null; };
  function bars(table) {
    if (table.dataset.fsBars || table.classList.contains('fintbl') || table.closest('.chart-info-panel')) return;
    table.dataset.fsBars = '1';
    const rows = [...table.tBodies[0]?.rows || []]; if (rows.length < 3) return;
    const heads = [...(table.tHead?.rows[0]?.cells || [])].map(c => c.textContent.trim());
    const cols = Math.max(...rows.map(r => r.cells.length));
    for (let c = 1; c < cols; c++) {
      if (/nguồn|ghi chú|mã|văn bản|hiệu lực|ngày|kỳ/i.test(heads[c] || '')) continue;
      const cells = rows.map(r => r.cells[c]).filter(Boolean);
      const vals = cells.map(td => (td.querySelector('a') || td.textContent.length > 22) ? null : numIn(td.textContent));
      const ok = vals.filter(v => v != null);
      if (ok.length < Math.max(3, cells.length * .6) || new Set(ok.map(o => o.u)).size > 1) continue;  // cùng đơn vị mới so được
      const max = Math.max(...ok.map(o => Math.abs(o.v))); if (!max) continue;
      cells.forEach((td, i) => {
        const v = vals[i]?.v; if (v == null) return;
        td.classList.add('fs-bar-cell'); td.style.setProperty('--w', (Math.abs(v) / max * 100).toFixed(1) + '%');
        if (v < 0) td.classList.add('neg');
      });
    }
  }
  // Timeline phía trên bảng có cột ngày hiệu lực.
  const dmy = t => { const m = String(t).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? Date.UTC(+m[3], m[2] - 1, +m[1]) : null; };
  function tableTimeline(table) {
    if (table.dataset.fsTl) return; table.dataset.fsTl = '1';
    const heads = [...(table.tHead?.rows[0]?.cells || [])].map(c => c.textContent.trim());
    const di = heads.findIndex(h => /hiệu lực|ngày|thời điểm|mốc/i.test(h)); if (di < 1) return;
    const items = [...table.tBodies[0].rows].map(r => ({t: dmy(r.cells[di]?.textContent), label: (r.cells[0]?.textContent || '').trim(), d: (r.cells[di]?.textContent || '').trim()})).filter(x => x.t);
    if (items.length < 3) return;
    items.sort((a, b) => a.t - b.t);
    const now = Date.now(), lo = Math.min(items[0].t, now), hi = Math.max(items.at(-1).t, now), W = 1000, X = t => 30 + (t - lo) / ((hi - lo) || 1) * (W - 60);
    const lanes = []; // tránh chồng nhãn: xếp hàng so le
    const marks = items.map((it, i) => { const x = X(it.t); let lane = 0; while (lanes[lane] != null && x - lanes[lane] < 170) lane++; lanes[lane] = x; const up = lane % 2 === 0, dy = 18 + Math.floor(lane / 2) * 30;
      const lbl = it.label.length > 34 ? it.label.slice(0, 33) + '…' : it.label, y = up ? 60 - dy : 60 + dy + 10, anc = x < 160 ? 'start' : x > W - 160 ? 'end' : 'middle', tx = anc === 'start' ? x - 6 : anc === 'end' ? x + 6 : x;
      return `<g class="fs-tl-m"><line x1="${x}" x2="${x}" y1="60" y2="${up ? y + 4 : y - 12}"/><circle cx="${x}" cy="60" r="5"/><text x="${tx}" y="${y}" text-anchor="${anc}"><tspan class="d" x="${tx}">${esc(it.d)}</tspan><tspan x="${tx}" dy="13">${esc(lbl)}</tspan></text><title>${esc(it.d + ' · ' + it.label)}</title></g>`; }).join('');
    const H = 140 + Math.max(0, Math.ceil(lanes.length / 2) - 1) * 30;
    const box = document.createElement('div'); box.className = 'fs-tl'; box.setAttribute('aria-hidden', 'true');
    box.innerHTML = `<svg viewBox="0 ${-Math.max(0, Math.ceil(lanes.length / 2) - 1) * 30} ${W} ${H}"><line x1="20" x2="${W - 20}" y1="60" y2="60" class="axis"/><line x1="${X(now)}" x2="${X(now)}" y1="44" y2="76" class="now"/><text x="${X(now)}" y="38" text-anchor="middle" class="nowt">Hôm nay</text>${marks}</svg>`;
    (table.closest('.tablewrap') || table).before(box);
  }
  // Danh sách mốc ngày thành timeline dọc.
  const DATE_LI = /^\s*(?:[\p{L} ]{0,12})?(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{4}|Q\d\/\d{4}|\d{4})\s*:/u;
  function listTimeline(ul) {
    if (ul.dataset.fsTl) return; ul.dataset.fsTl = '1';
    const lis = [...ul.children]; const hits = lis.filter(li => DATE_LI.test(li.textContent));
    if (hits.length < 2 || hits.length < lis.length * .5) return;
    ul.classList.add('fs-vtl');
    hits.forEach(li => { const m = li.innerHTML.match(/^\s*([^:<]{1,30}):\s*/); if (m) li.innerHTML = `<span class="fs-vtl-d">${m[1]}</span><span>${li.innerHTML.slice(m[0].length)}</span>`; });
  }
  // Bản đồ ngành: các bước nối thành quy trình có mũi tên chạy.
  function steps(box) {
    if (box.dataset.fsSteps) return; box.dataset.fsSteps = '1'; box.classList.add('fs-steps');
    [...box.children].forEach((a, i) => { const h = a.querySelector('h3'); if (h) h.insertAdjacentHTML('afterbegin', svgIcon(iconOf(h.textContent))); if (i) a.insertAdjacentHTML('beforebegin', '<span class="fs-step-arrow" aria-hidden="true"><i></i></span>'); });
  }
  function run() {
    document.querySelectorAll('.research-steps').forEach(steps);
    document.querySelectorAll('.research-steps article p, .business-model p, .research-topic p, .thesis-signal p').forEach(sentences);
    document.querySelectorAll('.business-ticker, td, .card > p, li').forEach(chips);
    document.querySelectorAll('.majorpane table').forEach(t => { if (t.offsetParent) { bars(t); tableTimeline(t); } });
    document.querySelectorAll('.majorpane .card ul').forEach(listTimeline);
    document.querySelectorAll('.research-caption').forEach(p => { if (!p.dataset.fsVis && /^Tác động:/.test(p.textContent)) { p.dataset.fsVis = '1'; p.innerHTML = p.innerHTML.replace(/^Tác động:\s*/, '<span class="fs-chip-lbl">Tác động</span>').replace(/\s·\s(qua\s)/, ' <span class="fs-chip-lbl alt">Kênh</span> '); } });
  }
  const later = () => setTimeout(run, 350);
  if (document.readyState === 'complete') later(); else addEventListener('load', () => { run(); setTimeout(run, 1500); });
  document.addEventListener('click', e => { if (e.target.closest('.majortabbtn, .tabbtn, summary')) later(); });
})();
