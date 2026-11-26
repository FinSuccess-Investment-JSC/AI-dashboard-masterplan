/* Xây dựng · Chủ đề nóng (#mt7), 26/11/2026: luồng tin theo bố cục trang Điện (Dien/app/power-news.js, qua bản KCN app/kcn-news.js).
   Dữ liệu: window.XD_HUB (data/construction/hub.json → scripts/build_construction_hub.py kiểm nguồn https, ngày đăng, liên kết dự án).
   Tiêu điểm → Tin tức mới nhất (danh sách chính, sắp theo ngày đăng) → Chủ đề đang theo dõi. Lọc theo thời gian, nhóm tin, dự án,
   phân khúc, mã, từ khóa. Mỗi sự kiện một dòng dù nhiều bài cùng đưa tin (article_ids). Tách ngày đăng, ngày sự kiện, ngày dự kiến,
   ngày hiệu lực. Tin làm đổi tiến độ dự án có nút mở dòng dự án trong bảng chính (Bức tranh ngành › Toàn thị trường). */
(() => {
  'use strict';
  const root = document.getElementById('xd-news');
  const data = window.XD_HUB;
  if (!root) return;
  if (!data) { root.querySelector('[role="status"]').textContent = 'Chưa tải được dữ liệu tin ngành Xây dựng (data/construction-hub.js).'; return; }
  const categories = {public: 'Giải ngân & vốn', project: 'Dự án & tiến độ', contractor: 'Nhà thầu & BOT', materials: 'Vật liệu & giá', policy: 'Chính sách'};
  const projectById = new Map((data.projects || []).map(p => [p.id, p]));
  const articleById = new Map(data.articles.map(article => [article.id, article]));
  const published = event => articleById.get(event.article_ids[0]).published_at;
  const millis = event => Date.parse(published(event)) || 0;
  const newest = (a, b) => millis(b) - millis(a) || a.id.localeCompare(b.id);
  const priority = (a, b) => b.importance - a.importance || newest(a, b);
  // Ngày đủ (yyyy-mm-dd), tháng (yyyy-mm → Tm/yyyy), quý (yyyy-Qn → Qn/yyyy), năm.
  const date = value => { if (!value) return ''; const v = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v.split('-').reverse().join('/');
    if (/^\d{4}-\d{2}$/.test(v)) return 'T' + (+v.slice(5)) + '/' + v.slice(0, 4);
    if (/^\d{4}-Q\d$/.test(value)) return value.slice(5) + '/' + value.slice(0, 4);
    return v; };
  const time = value => value?.includes('T') ? date(value) + ' · ' + value.slice(11, 16) : date(value);
  const today = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Asia/Ho_Chi_Minh'}).format(new Date());
  const normalize = (value = '') => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd');
  const make = (tag, content, cls) => { const element = document.createElement(tag); if (cls) element.className = cls; if (content) element.textContent = content; return element; };
  const button = (label, action) => { const control = make('button', label); control.type = 'button'; control.onclick = action; return control; };
  const link = (label, href) => { const anchor = make('a', label); anchor.href = href; if (href.startsWith('https://')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; } return anchor; };
  const sourceLinks = ids => {
    const list = make('ul', '', 'pn-sources');
    for (const id of new Set(ids)) { const article = articleById.get(id); const item = make('li'); item.append(link([article.source_name, 'đăng ' + time(article.published_at)].filter(Boolean).join(' · '), article.url)); list.append(item); }
    return list;
  };
  const meta = event => make('p', [categories[event.category], articleById.get(event.article_ids[0]).source_name,
    'đăng ' + time(published(event)), ...(event.companies || []), ...(event.segments || [])].filter(Boolean).join(' · '), 'pn-meta');
  const dates = event => ['Ngày đăng ' + date(published(event)), event.event_date ? 'Ngày/kỳ sự kiện ' + date(event.event_date) : '',
    event.expected_date ? 'Dự kiến ' + date(event.expected_date) : '', event.effective_date ? 'Hiệu lực ' + date(event.effective_date) : ''].filter(Boolean).join(' · ');
  const distinct = key => [...new Set(data.events.flatMap(event => event[key] || []))].sort((a, b) => a.localeCompare(b, 'vi'));
  const groups = data.topics.map(topic => ({...topic, events: data.events.filter(event => event.topic_ids.includes(topic.id)).sort(newest)}))
    .filter(topic => topic.events.length).sort((a, b) => newest(a.events[0], b.events[0]));
  const topicsById = new Map(groups.map(topic => [topic.id, topic]));
  const picker = (label, options) => { const wrapper = make('label', label); const control = make('select');
    for (const [value, text] of options) { const option = make('option', text); option.value = value; control.append(option); }
    wrapper.append(control); return [wrapper, control]; };
  const goProject = id => { if (window.XdFrame) window.XdFrame.openProject(id); };
  const goData = href => { if (window.XdFrame) window.XdFrame.go(href); else location.href = href; };

  const header = make('header', '', 'pn-header');
  header.append(make('h2', 'Chủ đề nóng'), make('p', 'Cập nhật nội dung ' + date(data.updated_at) + ' · ngày đăng kiểm trên trang gốc', 'pn-meta'));
  const featured = make('section', '', 'pn-featured');
  featured.append(make('h3', 'Tiêu điểm ngành'));
  const featuredGrid = make('div', '', 'pn-feature-grid');
  const recentCutoff = Date.parse(today) - 60 * 86400000;
  const ranked = data.events.filter(event => millis(event) >= recentCutoff).sort(priority);
  const compact = make('div', '', 'pn-compact');
  const desk = make('div', '', 'pn-desk');
  const main = make('section', '', 'pn-feed');
  const aside = make('aside');
  const entries = make('div');
  const count = make('p', '', 'pn-meta'); count.setAttribute('role', 'status');
  const dialog = make('dialog', '', 'pn-dialog'); dialog.setAttribute('aria-labelledby', 'pn-topic-title');
  const close = button('Đóng', () => dialog.close());
  const topicBody = make('div');
  dialog.append(close, topicBody);
  const showTopic = topic => {
    const title = make('h3', topic.title); title.id = 'pn-topic-title';
    const latest = topic.events[0];
    const timeline = make('ol', '', 'pn-timeline');
    for (const event of [...topic.events].sort((a, b) => (b.event_date || published(b) || '').localeCompare(a.event_date || published(a) || '') || newest(a, b))) {
      const item = make('li');
      item.append(make('p', dates(event), 'pn-meta'), make('strong', event.title), make('p', event.new_information), sourceLinks(event.article_ids));
      timeline.append(item);
    }
    topicBody.replaceChildren(title, make('p', 'Tổng hợp ngày ' + date(topic.analysis_date), 'pn-meta'),
      make('h4', 'Số liệu chính'), make('p', topic.thesis || ''), make('h4', 'Bối cảnh'), make('p', topic.background),
      make('h4', 'Diễn biến mới nhất'), make('p', latest.summary), make('h4', 'Timeline sự kiện'), timeline);
    if (latest.key_figures.length || topic.related_data) {
      topicBody.append(make('h4', 'Dữ liệu liên quan'));
      if (latest.key_figures.length) topicBody.append(make('p', latest.key_figures.join(' · ')));
      if (topic.related_data) { const reference = link(...topic.related_data); reference.onclick = e => { e.preventDefault(); dialog.close(); goData(topic.related_data[1]); }; topicBody.append(reference); }
    }
    topicBody.append(make('h4', 'Mốc kết thúc theo dõi'), make('p', topic.end_condition || ''),
      make('h4', 'Kiểm tra tiếp'), make('p', topic.next_check), make('h4', 'Nguồn thông tin'), sourceLinks(topic.events.flatMap(event => event.article_ids)));
    dialog.showModal();
  };
  const controls = make('div', '', 'pn-controls');
  const [periodLabel, period] = picker('Thời gian', [['30', '30 ngày'], ['90', '90 ngày'], ['180', '180 ngày'], ['custom', 'Tùy chỉnh'], ['all', 'Toàn bộ']]);
  period.value = '90';
  const projectIds = [...new Set(data.events.map(e => e.project_id).filter(Boolean))];
  const [projectLabel, project] = picker('Dự án', [['', 'Tất cả'], ...projectIds.map(id => [id, projectById.get(id)?.name || id])]);
  const [segmentLabel, segment] = picker('Phân khúc', [['', 'Tất cả'], ...distinct('segments').map(x => [x, x])]);
  const [companyLabel, company] = picker('Mã', [['', 'Tất cả'], ...distinct('companies').map(x => [x, x])]);
  const [orderLabel, order] = picker('Sắp xếp', [['latest', 'Mới đăng nhất'], ['priority', 'Mức độ quan trọng']]);
  const searchLabel = make('label', 'Tìm kiếm');
  const search = make('input'); search.type = 'search'; search.placeholder = 'Từ khóa, dự án, mã…'; searchLabel.append(search);
  const range = make('div', '', 'pn-controls');
  const dateInput = label => { const wrapper = make('label', label); const input = make('input'); input.type = 'date'; wrapper.append(input); range.append(wrapper); return input; };
  const from = dateInput('Đăng từ ngày');
  const to = dateInput('Đến ngày');
  controls.append(searchLabel, periodLabel, projectLabel, segmentLabel, companyLabel, orderLabel);

  let category = '';
  let limit = 8;
  const pills = make('div', '', 'pn-pills'); pills.setAttribute('aria-label', 'Nhóm tin');
  const categoryButtons = new Map();
  for (const [id, text] of [['', 'Tất cả'], ...Object.entries(categories)]) { const tab = button(text, () => { category = id; reset(); }); pills.append(tab); categoryButtons.set(id, tab); }
  const more = button('Xem thêm', () => { const previousLimit = limit; limit += 8; update(); entries.children[previousLimit]?.querySelector('summary')?.focus(); });
  const row = event => {
    const article = make('article', '', 'pn-row'); article.id = 'pn-event-' + event.id;
    const details = make('details'); const summary = make('summary');
    summary.append(make('strong', event.title), meta(event), make('span', event.summary, 'pn-summary'));
    const body = make('div', '', 'pn-detail');
    body.append(make('p', dates(event), 'pn-meta'));
    body.append(make('p', 'Điều gì mới: ' + event.new_information));
    if (event.key_figures.length) body.append(make('p', 'Số / mốc: ' + event.key_figures.join(' · ')));
    if (event.companies?.length) body.append(make('p', 'Doanh nghiệp liên quan: ' + event.companies.join(', ') + (event.company_basis ? ' — căn cứ: ' + event.company_basis : '')));
    if (event.variable) body.append(make('p', 'Biến số kinh doanh bị tác động: ' + event.variable));
    if (event.project_id && projectById.has(event.project_id)) body.append(button('Xem dự án "' + projectById.get(event.project_id).name + '" trong bảng dự án →', () => goProject(event.project_id)));
    for (const id of event.topic_ids) { const topic = topicsById.get(id); if (!topic) continue; body.append(button('Chủ đề: ' + topic.title, () => showTopic(topic))); }
    body.append(sourceLinks(event.article_ids));
    details.append(summary, body); article.append(details);
    return article;
  };
  function update() {
    range.hidden = period.value !== 'custom';
    for (const [id, tab] of categoryButtons) tab.setAttribute('aria-pressed', String(category === id));
    const cutoff = /^\d+$/.test(period.value) ? new Date(Date.parse(today) - (Number(period.value) - 1) * 86400000).toISOString().slice(0, 10) : '';
    const start = range.hidden ? cutoff : from.value;
    const end = range.hidden ? today : (to.value || today);
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    const filtered = data.events.filter(event => {
      const day = published(event)?.slice(0, 10) || '';
      const corpus = normalize([event.title, event.summary, event.new_information, categories[event.category], projectById.get(event.project_id)?.name || '',
        ...(event.companies || []), ...(event.segments || []), ...event.topic_ids.map(id => topicsById.get(id)?.title || '')].join(' '));
      return (!category || event.category === category) && (!segment.value || (event.segments || []).includes(segment.value)) &&
        (!company.value || (event.companies || []).includes(company.value)) && (!project.value || event.project_id === project.value) &&
        (!start || day >= start) && (!day || day <= end) && words.every(word => corpus.includes(word));
    }).sort(order.value === 'priority' ? priority : newest);
    entries.replaceChildren(...filtered.slice(0, limit).map(row));
    count.textContent = start && start > end ? 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
      : filtered.length ? 'Hiển thị ' + Math.min(limit, filtered.length) + '/' + filtered.length + ' sự kiện (theo ngày đăng)' : 'Không có sự kiện phù hợp với bộ lọc.';
    more.hidden = filtered.length <= limit;
  }
  function reset() { limit = 8; update(); }
  for (const control of [period, project, segment, company, order, from, to]) control.onchange = reset;
  search.oninput = reset;
  const reveal = event => {
    period.value = 'all'; project.value = segment.value = company.value = search.value = category = '';
    limit = data.events.length; update();
    const item = document.getElementById('pn-event-' + event.id);
    item.firstElementChild.open = true; item.querySelector('summary').focus(); item.scrollIntoView({block: 'nearest'});
  };
  const story = (event, lead) => { const item = make('article', '', lead ? 'pn-lead' : 'pn-short'); item.append(button(event.title, () => reveal(event)), meta(event)); if (lead) item.append(make('p', event.summary)); return item; };
  if (ranked.length) {
    featuredGrid.append(story(ranked[0], true), compact);
    for (const event of ranked.slice(1, 4)) compact.append(story(event, false));
    featured.append(featuredGrid);
  } else featured.append(make('p', 'Chưa có sự kiện đã xác minh đăng trong 60 ngày qua.'));
  main.append(make('h3', 'Tin tức mới nhất'), pills, controls, range, count, entries, more);
  const notable = make('section', '', 'pn-sidebar-section');
  notable.append(make('h3', 'Tin đáng chú ý'));
  for (const event of ranked.slice(4, 7)) notable.append(story(event, false));
  const tracking = make('section', '', 'pn-sidebar-section');
  tracking.append(make('h3', 'Chủ đề đang theo dõi'));
  for (const topic of groups) {
    const item = make('article', '', 'pn-topic'); const latest = topic.events[0];
    item.append(button(topic.title, () => showTopic(topic)), make('p', topic.thesis || topic.background), make('p', 'Mới nhất: ' + latest.title),
      make('p', 'Mốc kết thúc theo dõi: ' + (topic.end_condition || ''), 'pn-meta'),
      make('p', ['đăng ' + date(published(latest)), topic.events.length + ' sự kiện', ...new Set(topic.events.flatMap(event => event.segments || []))].filter(Boolean).join(' · '), 'pn-meta'));
    tracking.append(item);
  }
  if (notable.children.length > 1) aside.append(notable);
  aside.append(tracking);
  desk.append(main, aside);
  root.replaceChildren(header, featured, desk, dialog);
  update();
  window.XdNews = {filterProject: id => { project.value = id; period.value = 'all'; reset(); }};
})();
