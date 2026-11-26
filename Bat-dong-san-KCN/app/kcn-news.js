/* BĐS KCN · Chủ đề nóng (#mt7), 26/11/2026: luồng tin theo bố cục trang Điện (Dien/app/power-news.js).
   Dữ liệu: data/kcn/news.json (scripts/update_kcn_news.py kiểm schema, nguồn https, ngày). Tiêu điểm ngành ở trên, Tin tức mới nhất là
   danh sách chính, Tin đáng chú ý và Chủ đề đang theo dõi bên cạnh (xuống dưới trên mobile). Lọc theo thời gian, chủ đề, vùng/tỉnh,
   doanh nghiệp, từ khóa; mỗi sự kiện một dòng dù nhiều bài cùng đưa tin (article_ids). Chủ đề theo dõi giữ luận điểm, ngày phân tích,
   điều kiện kết thúc. */
(() => {
  'use strict';
  const root = document.getElementById('kcn-news');
  if (!root) return;
  const categories = {
    demand: 'Cầu thuê & FDI', supply: 'Nguồn cung & quỹ đất', rent: 'Giá thuê',
    policy: 'Chính sách & pháp lý', companies: 'Doanh nghiệp', finance: 'Tài chính & dòng tiền'
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
      time(published(event)), ...(event.companies || []), ...(event.segments || [])
    ].filter(Boolean).join(' · '), 'pn-meta');
    const distinct = key => [...new Set(data.events.flatMap(event => event[key] || []))].sort((a, b) => a.localeCompare(b, 'vi'));
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
    featured.append(make('h3', 'Tiêu điểm ngành'));
    const featuredGrid = make('div', '', 'pn-feature-grid');
    const recentCutoff = Date.parse(today) - 30 * 86400000;
    const ranked = data.events.filter(event => millis(event) >= recentCutoff).sort(priority);
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
        item.append(make('p', event.event_date ? date(event.event_date) : 'Công bố ' + date(published(event)), 'pn-meta'),
          make('strong', event.title), make('p', event.new_information), sourceLinks(event.article_ids));
        timeline.append(item);
      }
      topicBody.replaceChildren(title, make('p', 'Phân tích ngày ' + date(topic.analysis_date), 'pn-meta'),
        make('h4', 'Luận điểm'), make('p', topic.thesis || ''), make('h4', 'Bối cảnh'), make('p', topic.background),
        make('h4', 'Diễn biến mới nhất'), make('p', latest.summary), make('h4', 'Timeline sự kiện'), timeline);
      if (latest.key_figures.length || topic.related_data) {
        topicBody.append(make('h4', 'Dữ liệu liên quan'));
        if (latest.key_figures.length) topicBody.append(make('p', latest.key_figures.join(' · ')));
        if (topic.related_data) {
          const reference = link(...topic.related_data);
          reference.onclick = e => { dialog.close(); const u = new URL(reference.href, location.href), k = u.searchParams.get('kcn'), f = u.searchParams.get('fin');
            if (k && document.querySelector(`[data-kcn-go]`)) { e.preventDefault(); const a = document.createElement('a'); a.dataset.kcnGo = k; a.hidden = true; document.body.append(a); a.click(); a.remove(); }
            else if (f && window.KcnFinTab) { e.preventDefault(); window.KcnFinTab.open(f); } };
          topicBody.append(reference);
        }
      }
      topicBody.append(make('h4', 'Trạng thái hiện tại'), make('p', latest.new_information),
        make('h4', 'Điều kiện kết thúc'), make('p', topic.end_condition || ''),
        make('h4', 'Kiểm tra tiếp'), make('p', topic.next_check), make('h4', 'Nguồn thông tin'),
        sourceLinks(topic.events.flatMap(event => event.article_ids)));
      dialog.showModal();
    };
    const controls = make('div', '', 'pn-controls');
    const [periodLabel, period] = picker('Thời gian', [['7','7 ngày'], ['30','30 ngày'], ['90','90 ngày'], ['custom','Tùy chỉnh'], ['all','Toàn bộ']]);
    period.value = '30';
    const [segmentLabel, segment] = picker('Vùng / tỉnh', [['','Tất cả'], ...distinct('segments').map(x => [x,x])]);
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
    controls.append(searchLabel, periodLabel, segmentLabel, companyLabel, orderLabel);

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
      body.append(make('p', ['Công bố ' + date(published(event)), event.event_date ? 'Kỳ/ngày sự kiện ' + date(event.event_date) : '', event.effective_date ? 'Hiệu lực ' + date(event.effective_date) : ''].filter(Boolean).join(' · '), 'pn-meta'));
      body.append(make('p', 'Thông tin mới: ' + event.new_information));
      if (event.key_figures.length) body.append(make('p', event.key_figures.join(' · ')));
      for (const id of event.topic_ids) {
        const topic = topicsById.get(id); if (!topic) continue;
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
          ...(event.companies || []), ...(event.segments || []), ...event.topic_ids.map(id => topicsById.get(id)?.title || '')].join(' '));
        return (!category || event.category === category) && (!segment.value || (event.segments || []).includes(segment.value)) &&
          (!company.value || (event.companies || []).includes(company.value)) && (!start || day >= start) &&
          (!day || day <= end) && words.every(word => corpus.includes(word));
      }).sort(order.value === 'priority' ? priority : newest);
      entries.replaceChildren(...filtered.slice(0, limit).map(row));
      count.textContent = start && start > end ? 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
        : filtered.length ? 'Hiển thị ' + Math.min(limit, filtered.length) + '/' + filtered.length + ' sự kiện'
        : 'Không có sự kiện phù hợp với bộ lọc.';
      more.hidden = filtered.length <= limit;
    }
    function reset() {
      limit = 6;
      update();
    }
    for (const control of [period, segment, company, order, from, to]) control.onchange = reset;
    search.oninput = reset;
    const reveal = event => {
      period.value = 'all';
      segment.value = company.value = search.value = category = '';
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
    } else featured.append(make('p', 'Chưa có sự kiện đã xác minh trong 30 ngày qua.'));
    main.append(make('h3', 'Tin tức mới nhất'), pills, controls, range, count, entries, more);
    const notable = make('section', '', 'pn-sidebar-section');
    notable.append(make('h3', 'Tin đáng chú ý'));
    for (const event of ranked.slice(4, 7)) notable.append(story(event, false));
    const tracking = make('section', '', 'pn-sidebar-section');
    tracking.append(make('h3', 'Chủ đề đang theo dõi'));
    for (const topic of groups) {
      const item = make('article', '', 'pn-topic');
      const latest = topic.events[0];
      item.append(button(topic.title, () => showTopic(topic)),
        make('p', topic.thesis || topic.background), make('p', 'Mới nhất: ' + latest.title), make('p', 'Điều kiện kết thúc: ' + (topic.end_condition || ''), 'pn-meta'),
        make('p', [date(published(latest)), topic.events.length + ' sự kiện',
          ...new Set(topic.events.flatMap(event => event.segments || []))].filter(Boolean).join(' · '), 'pn-meta'));
      tracking.append(item);
    }
    if (notable.children.length > 1) aside.append(notable);
    aside.append(tracking);
    desk.append(main, aside);
    root.replaceChildren(header, featured, desk, dialog);
    update();
  };

  fetch(new URL(root.dataset.feed, document.baseURI), {cache: 'no-cache'})
    .then(response => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(render)
    .catch(() => {
      root.querySelector('[role="status"]').textContent = 'Chưa tải được dữ liệu tin ngành BĐS KCN. Hãy thử tải lại trang.';
    });
})();
