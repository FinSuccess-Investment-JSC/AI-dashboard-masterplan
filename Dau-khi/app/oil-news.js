/* Dầu khí · Chủ đề nóng (28/11/2026, chép Cao-su/app/rubber-news.js). Gốc: Vien-thong/app/telecom-news.js (gốc Dien/app/power-news.js): Tiêu điểm ngành → Tin tức mới nhất
   → Tin đáng chú ý / Chủ đề đang theo dõi; lọc theo nhóm tin, chủ đề, phân khúc, doanh nghiệp, thời gian.
   Đọc window.OIL_NEWS (data/oil-news.js, scripts/build_oil_news.py từ data/oil/news.json: bài gốc → sự kiện → chủ đề).
   Thẻ chủ đề cũ "Hormuz · dòng chảy & tác động" thành chủ đề `hormuz` (link Bức tranh ngành › 06, ?sub=flows#mt2). */
(() => {
  'use strict';
  const init = () => {
  const root = document.getElementById('dk-news');
  if (!root || !window.OIL_NEWS) return;
  const categories = {
    crude: 'Giá dầu & OPEC+', flows: 'Hormuz & dòng chảy', retail: 'Giá bán lẻ & nguồn cung', refining: 'Lọc dầu',
    gas: 'Khí, LNG & điện khí', policy: 'Chính sách & thuế', companies: 'Doanh nghiệp'
  };
  const render = data => {
    const articleById = new Map(data.articles.map(article => [article.id, article]));
    const published = event => articleById.get(event.article_ids[0]).published_at;
    const millis = event => Date.parse(published(event)) || 0;
    const newest = (a, b) => millis(b) - millis(a) || a.id.localeCompare(b.id);
    const priority = (a, b) => b.importance - a.importance || newest(a, b);
    const date = value => value ? value.slice(0, 10).split('-').reverse().join('/') : '';
    const time = value => value?.includes('T') ? date(value) + ' · ' + value.slice(11, 16) + ' ICT' : date(value);
    const today = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Asia/Ho_Chi_Minh'}).format(new Date());
    const normalize = (value = '') => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd');
    const make = (tag, content, cls) => {
      const element = document.createElement(tag);
      if (cls) element.className = cls;
      if (content) element.textContent = content;
      return element;
    };
    const button = (label, action) => {
      const control = make('button', label);
      control.type = 'button';
      control.onclick = action;
      return control;
    };
    const link = (label, href) => {
      const anchor = make('a', label);
      anchor.href = href;
      if (href.startsWith('https://')) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
      return anchor;
    };
    const sourceLinks = ids => {
      const list = make('ul', '', 'pn-sources');
      for (const id of new Set(ids)) {
        const article = articleById.get(id);
        const item = make('li');
        item.append(link([article.source_name, time(article.published_at)].filter(Boolean).join(' · '), article.url));
        list.append(item);
      }
      return list;
    };
    const meta = event => make('p', [
      categories[event.category], articleById.get(event.article_ids[0]).source_name,
      time(published(event)), ...event.companies, ...event.segments
    ].filter(Boolean).join(' · '), 'pn-meta');
    const distinct = key => [...new Set(data.events.flatMap(event => event[key]))].sort((a, b) => a.localeCompare(b, 'vi'));
    const groups = data.topics.map(topic => ({
      ...topic, events: data.events.filter(event => event.topic_ids.includes(topic.id)).sort(newest)
    })).filter(topic => topic.events.length).sort((a, b) => newest(a.events[0], b.events[0]));
    const topicsById = new Map(groups.map(topic => [topic.id, topic]));
    const picker = (label, options) => {
      const wrapper = make('label', label);
      const control = make('select');
      for (const [value, text] of options) {
        const option = make('option', text);
        option.value = value;
        control.append(option);
      }
      wrapper.append(control);
      return [wrapper, control];
    };

    const header = make('header', '', 'pn-header');
    header.append(make('h2', 'Chủ đề nóng'), make('p', 'Cập nhật nội dung ' + date(data.updated_at), 'pn-meta'));
    const featured = make('section', '', 'pn-featured');
    const FEAT_DAYS = 90;
    featured.append(make('h3', 'Tiêu điểm ngành'));
    const featuredGrid = make('div', '', 'pn-feature-grid');
    const recentCutoff = Date.parse(today) - FEAT_DAYS * 86400000;
    let ranked = data.events.filter(event => millis(event) >= recentCutoff).sort(priority);
    if (ranked.length < 7) ranked = [...data.events].sort(newest).slice(0, 7).sort(priority);  // ít tin trong 90 ngày: lấy 7 tin mới nhất
    const compact = make('div', '', 'pn-compact');
    const desk = make('div', '', 'pn-desk');
    const main = make('section', '', 'pn-feed');
    const aside = make('aside');
    const entries = make('div');
    const count = make('p', '', 'pn-meta');
    count.setAttribute('role', 'status');
    const dialog = make('dialog', '', 'pn-dialog');
    dialog.setAttribute('aria-labelledby', 'pn-topic-title');
    const close = button('Đóng', () => dialog.close());
    const topicBody = make('div');
    dialog.append(close, topicBody);
    const showTopic = topic => {
      const title = make('h3', topic.title);
      title.id = 'pn-topic-title';
      const latest = topic.events[0];
      const timeline = make('ol', '', 'pn-timeline');
      for (const event of [...topic.events].sort((a, b) =>
        (b.event_date || published(b) || '').localeCompare(a.event_date || published(a) || '') || newest(a, b))) {
        const item = make('li');
        item.append(make('p', (event.event_date ? 'Ngày sự kiện ' + date(event.event_date) + ' · ' : '') + 'đăng ' + date(published(event)), 'pn-meta'),
          make('strong', event.title), make('p', event.new_information), sourceLinks(event.article_ids));
        timeline.append(item);
      }
      topicBody.replaceChildren(title, make('h4', 'Bối cảnh'), make('p', topic.background),
        make('h4', 'Diễn biến mới nhất'), make('p', latest.summary), make('h4', 'Timeline sự kiện'), timeline);
      if (latest.key_figures.length || topic.related_data) {
        topicBody.append(make('h4', 'Dữ liệu liên quan'));
        if (latest.key_figures.length) topicBody.append(make('p', latest.key_figures.join(' · ')));
        if (topic.related_data) {
          const reference = link(...topic.related_data);
          reference.onclick = () => dialog.close();
          topicBody.append(reference);
        }
      }
      topicBody.append(make('h4', 'Trạng thái hiện tại'), make('p', latest.new_information),
        make('p', topic.next_check), make('h4', 'Nguồn thông tin'),
        sourceLinks(topic.events.flatMap(event => event.article_ids)));
      dialog.showModal();
    };
    const controls = make('div', '', 'pn-controls');
    const [periodLabel, period] = picker('Thời gian', [['7','7 ngày'], ['30','30 ngày'], ['90','90 ngày'], ['365','12 tháng'], ['custom','Tùy chỉnh'], ['all','Toàn bộ']]);
    period.value = '90';
    const [topicLabel, topicSel] = picker('Chủ đề', [['','Tất cả'], ...groups.map(t => [t.id, t.title])]);
    const [segmentLabel, segment] = picker('Phân khúc', [['','Tất cả'], ...distinct('segments').map(x => [x,x])]);
    const [companyLabel, company] = picker('Doanh nghiệp / mã', [['','Tất cả'], ...distinct('companies').map(x => [x,x])]);
    const [orderLabel, order] = picker('Sắp xếp', [['latest','Mới nhất'], ['priority','Mức độ quan trọng']]);
    const searchLabel = make('label', 'Tìm kiếm');
    const search = make('input');
    search.type = 'search';
    search.placeholder = 'Từ khóa, doanh nghiệp…';
    searchLabel.append(search);
    const range = make('div', '', 'pn-controls');
    const dateInput = label => {
      const wrapper = make('label', label);
      const input = make('input');
      input.type = 'date';
      wrapper.append(input);
      range.append(wrapper);
      return input;
    };
    const from = dateInput('Từ ngày');
    const to = dateInput('Đến ngày');
    controls.append(searchLabel, periodLabel, topicLabel, segmentLabel, companyLabel, orderLabel);

    let category = '';
    let limit = 6;
    const pills = make('div', '', 'pn-pills');
    pills.setAttribute('aria-label', 'Chủ đề tin tức');
    const categoryButtons = new Map();
    for (const [id, text] of [['', 'Tất cả'], ...Object.entries(categories)]) {
      const tab = button(text, () => {
        category = id;
        reset();
      });
      pills.append(tab);
      categoryButtons.set(id, tab);
    }
    const more = button('Xem thêm', () => {
      const previousLimit = limit;
      limit += 6;
      update();
      entries.children[previousLimit]?.querySelector('summary')?.focus();
    });
    const row = event => {
      const article = make('article', '', 'pn-row');
      article.id = 'pn-event-' + event.id;
      const details = make('details');
      const summary = make('summary');
      summary.append(make('strong', event.title), meta(event), make('span', event.summary, 'pn-summary'));
      const body = make('div', '', 'pn-detail');
      body.append(make('p', 'Ngày đăng bài: ' + date(published(event)) + (event.event_date ? ' · ngày sự kiện: ' + date(event.event_date) : ''), 'pn-meta'));
      body.append(make('p', 'Thông tin mới: ' + event.new_information));
      if (event.key_figures.length) body.append(make('p', 'Số thay đổi: ' + event.key_figures.join(' · ')));
      if (event.impact) body.append(make('p', event.impact, 'pn-impact'));
      for (const id of event.topic_ids) {
        const topic = topicsById.get(id);
        body.append(button(topic.title, () => showTopic(topic)));
      }
      body.append(sourceLinks(event.article_ids));
      details.append(summary, body);
      article.append(details);
      return article;
    };
    function update() {
      range.hidden = period.value !== 'custom';
      for (const [id, tab] of categoryButtons) tab.setAttribute('aria-pressed', String(category === id));
      const cutoff = /^\d+$/.test(period.value)
        ? new Date(Date.parse(today) - (Number(period.value) - 1) * 86400000).toISOString().slice(0, 10) : '';
      const start = range.hidden ? cutoff : from.value;
      const end = range.hidden ? today : (to.value || today);
      const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      const filtered = data.events.filter(event => {
        const day = published(event)?.slice(0, 10) || '';
        const corpus = normalize([event.title, event.summary, event.new_information, categories[event.category],
          ...event.companies, ...event.segments, ...event.topic_ids.map(id => topicsById.get(id).title)].join(' '));
        return (!category || event.category === category) && (!topicSel.value || event.topic_ids.includes(topicSel.value)) && (!segment.value || event.segments.includes(segment.value)) &&
          (!company.value || event.companies.includes(company.value)) && (!start || day >= start) &&
          (!day || day <= end) && words.every(word => corpus.includes(word));
      }).sort(order.value === 'priority' ? priority : newest);
      entries.replaceChildren(...filtered.slice(0, limit).map(row));
      count.textContent = start && start > end ? 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
        : filtered.length ? 'Hiển thị ' + Math.min(limit, filtered.length) + '/' + filtered.length + ' sự kiện'
        : 'Không có sự kiện phù hợp với bộ lọc.';
      more.hidden = filtered.length <= limit;
      const wider = {'7': '30', '30': '90', '90': '365', '365': 'all', custom: 'all'}[period.value];
      widen.hidden = filtered.length > 0 || !wider;
      if (wider) {
        widen.textContent = wider === 'all' ? 'Xem toàn bộ thời gian' : 'Mở rộng ra ' + period.querySelector(`option[value="${wider}"]`).textContent;
        widen.onclick = () => { period.value = wider; reset(); };
      }
    }
    function reset() {
      limit = 6;
      update();
    }
    for (const control of [period, topicSel, segment, company, order, from, to]) control.onchange = reset;
    search.oninput = reset;
    const reveal = event => {
      period.value = 'all';
      segment.value = company.value = search.value = topicSel.value = category = '';
      limit = data.events.length;
      update();
      const item = document.getElementById('pn-event-' + event.id);
      item.firstElementChild.open = true;
      item.querySelector('summary').focus();
      item.scrollIntoView({block: 'nearest'});
    };
    const story = (event, lead) => {
      const item = make('article', '', lead ? 'pn-lead' : 'pn-short');
      item.append(button(event.title, () => reveal(event)), meta(event));
      if (lead) item.append(make('p', event.summary));
      return item;
    };
    if (ranked.length) {
      featuredGrid.append(story(ranked[0], true), compact);
      for (const event of ranked.slice(1, 4)) compact.append(story(event, false));
      featured.append(featuredGrid);
    }
    const widen = button('', () => {});
    widen.className = 'pn-widen';
    main.append(make('h3', 'Tin tức mới nhất'), pills, controls, range, count, widen, entries, more);
    const notable = make('section', '', 'pn-sidebar-section');
    notable.append(make('h3', 'Tin đáng chú ý'));
    for (const event of ranked.slice(4, 7)) notable.append(story(event, false));
    const tracking = make('section', '', 'pn-sidebar-section');
    tracking.append(make('h3', 'Chủ đề đang theo dõi'));
    for (const topic of groups) {
      const item = make('article', '', 'pn-topic');
      const latest = topic.events[0];
      item.append(button(topic.title, () => showTopic(topic)),
        make('p', topic.background), make('p', latest.title),
        make('p', [date(published(latest)), topic.events.length + ' sự kiện',
          ...new Set(topic.events.flatMap(event => event.segments))].filter(Boolean).join(' · '), 'pn-meta'));
      tracking.append(item);
    }
    if (notable.children.length > 1) aside.append(notable);
    aside.append(tracking);
    desk.append(main, aside);
    root.replaceChildren(header, featured, desk, dialog);
    update();
  };

  render(window.OIL_NEWS);
  };
  if (window.SectorBoot) SectorBoot.add(100, init); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
