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
