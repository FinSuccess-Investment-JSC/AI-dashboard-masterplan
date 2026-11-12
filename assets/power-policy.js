/* Điện · tab Policy / Tax / Trade (11/11/2026).
   Policy Radar → 4 nhóm chính sách (Giá & PPA · Thị trường & điều độ · Quy hoạch & đầu tư · Thuế, thương mại, carbon)
   → Ma trận tác động & lịch pháp lý. Mọi số và câu chữ lấy từ data/power-policy.js (window.POWER_POLICY);
   thiếu dữ liệu thì hiện trạng thái thiếu, không vẽ số giả. Không đổi hash (#mt4 vẫn là route của tab). */
(() => {
'use strict';
if (document.body.dataset.sector !== 'power') return;
const P = window.POWER_POLICY, root = document.getElementById('power-policy');
if (!root || !P) return;

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
const sg = (v, d = 1) => v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d);
const dmy = s => !s ? '' : /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : /^\d{4}-\d{2}$/.test(s) ? s.slice(5, 7) + '/' + s.slice(0, 4) : s;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const link = (url, text) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>` : esc(text);
const store = {get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } }};
const GL = P.glossary || {};
// Thuật ngữ trong chuỗi dữ liệu viết dạng [[Qc]] → tooltip giải thích.
const rich = s => esc(s).replace(/\[\[([^\]]+)\]\]/g, (_, t) => GL[t] ? `<abbr class="pp-term" tabindex="0" data-tip="${esc(GL[t])}">${esc(t)}</abbr>` : esc(t));
const groups = Object.fromEntries((P.groups || []).map(g => [g.id, g]));
const techs = Object.fromEntries((P.technologies || []).map(t => [t.id, t]));
const policies = P.policies || [];
const byId = Object.fromEntries(policies.map(p => [p.policy_id, p]));
const STATUS = ['Draft', 'Issued', 'Effective', 'Expired', 'Superseded'];
const DIR = {Positive: 'Positive', Negative: 'Negative', Mixed: 'Mixed', Uncertain: 'Uncertain'};
const LEVEL = {High: 'High', Medium: 'Medium', Low: 'Low', nq: 'Impact not quantified'};
const HORIZON = {short: 'Ngắn hạn (≤12 tháng)', medium: 'Trung hạn (1–3 năm)', long: 'Dài hạn (>3 năm)'};
const ETYPE = {direct: 'Trực tiếp', indirect: 'Gián tiếp', potential: 'Tiềm năng', none: 'Chưa xác nhận'};
const DRIVER = {revenue: 'Doanh thu', cost: 'Chi phí', capex: 'CAPEX', cashflow: 'Dòng tiền', receivables: 'Phải thu', volume: 'Sản lượng'};
const badge = (cls, text, title) => `<span class="pp-badge ${cls}"${title ? ` title="${esc(title)}"` : ''}>${esc(text)}</span>`;
const levelOf = p => p.impact_level && LEVEL[p.impact_level] ? p.impact_level : 'nq';
const yearOf = p => (p.effective_date || p.issue_date || '').slice(0, 4);
const chips = list => (list || []).map(c => `<span class="pp-chip t-${esc(c.type || 'none')}" title="${esc(ETYPE[c.type] || '')}${c.note ? ': ' + esc(c.note) : ''}">${esc(c.ticker)}</span>`).join('');
const srcLine = (sources, checked) => {
  const s = (sources || []).map(x => link(x.url, x.label)).join(' · ');
  return s ? `<div class="pp-src">Nguồn: ${s}${checked ? ` · kiểm ${dmy(checked)}` : ''}</div>` : '';
};

/* ---------- shared filter state (Radar + Ma trận dùng chung) ---------- */
const FKEYS = {
  cat: {label: 'Nhóm chính sách', options: () => (P.groups || []).filter(g => g.id !== 'matrix').map(g => [g.id, g.label]), test: (p, v) => p.policy_category === v},
  status: {label: 'Trạng thái', options: () => STATUS.filter(s => policies.some(p => p.policy_status === s)).map(s => [s, s]), test: (p, v) => p.policy_status === v},
  year: {label: 'Năm hiệu lực', options: () => [...new Set(policies.map(yearOf).filter(Boolean))].sort().reverse().map(y => [y, y]), test: (p, v) => yearOf(p) === v},
  tech: {label: 'Loại nguồn', options: () => (P.technologies || []).map(t => [t.id, t.label]), test: (p, v) => (p.applicable_technologies || []).includes(v)},
  ticker: {label: 'Mã niêm yết', options: () => [...new Set(policies.flatMap(p => (p.exposed_companies || []).map(c => c.ticker)))].sort().map(t => [t, t]), test: (p, v) => (p.exposed_companies || []).some(c => c.ticker === v)},
  level: {label: 'Mức tác động', options: () => Object.entries(LEVEL), test: (p, v) => levelOf(p) === v},
  horizon: {label: 'Thời gian tác động', options: () => Object.entries(HORIZON), test: (p, v) => p.impact_horizon === v}
};
const state = {};
const listeners = [];
const matches = (p, keys) => keys.every(k => !state[k] || FKEYS[k].test(p, state[k]));
function filterBar(keys, label) {
  const bar = el('div', 'pp-filters');
  bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', label);
  keys.forEach(k => {
    const l = el('label', '', `<span>${esc(FKEYS[k].label)}</span>`), s = el('select');
    s.dataset.key = k;
    s.append(new Option('Tất cả', ''));
    FKEYS[k].options().forEach(([v, t]) => s.append(new Option(t, v)));
    s.addEventListener('change', () => { state[k] = s.value; sync(); });
    l.append(s); bar.append(l);
  });
  const reset = el('button', '', 'Bỏ lọc'); reset.type = 'button';
  reset.addEventListener('click', () => { Object.keys(state).forEach(k => state[k] = ''); sync(); });
  bar.append(reset);
  return bar;
}
function sync() {
  root.querySelectorAll('.pp-filters select').forEach(s => { s.value = state[s.dataset.key] || ''; });
  listeners.forEach(f => f());
}

/* ---------- detail dialog (What changed → Sources) ---------- */
let dlg;
function openPolicy(id) {
  const p = byId[id]; if (!p) return;
  if (!dlg) {
    dlg = el('dialog', 'pp-dialog'); dlg.setAttribute('aria-labelledby', 'pp-dlg-title'); document.body.append(dlg);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }
  const lv = levelOf(p);
  const exp = (p.exposed_companies || []).length ? `<div class="tablewrap"><table class="pp-table" style="min-width:420px"><thead><tr><th>Mã</th><th>Loại tác động</th><th>Tài sản / điều kiện áp dụng</th></tr></thead><tbody>${p.exposed_companies.map(c => `<tr><td><b>${esc(c.ticker)}</b></td><td>${esc(ETYPE[c.type] || '—')}</td><td>${rich(c.note || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p>Chưa xác định được doanh nghiệp niêm yết thuộc phạm vi điều chỉnh.</p>';
  dlg.innerHTML = `<div class="pp-dlg-head"><div><div class="pp-badges">${badge('st-' + p.policy_status, p.policy_status)}${badge('dir-' + (p.direction || 'Uncertain'), DIR[p.direction] || 'Uncertain')}${badge('lv-' + lv, LEVEL[lv])}${p.data_confidence === 'Unverified' ? badge('cf-Unverified', 'Unverified') : ''}</div>
    <h3 id="pp-dlg-title">${esc(p.policy_name)}</h3><div class="pp-doc" style="font-size:12px;color:#64748B">${esc(p.document_number || 'Chưa có số hiệu')} · ${esc(p.issuing_authority || '')}</div>
    <div class="pp-dates" style="margin-top:4px"><span>Ban hành <b>${dmy(p.issue_date) || 'chưa xác minh'}</b></span><span>Hiệu lực <b>${dmy(p.effective_date) || 'chưa xác minh'}</b></span>${p.expiration_date ? `<span>Hết hiệu lực <b>${dmy(p.expiration_date)}</b></span>` : ''}${p.impact_from ? `<span>Doanh nghiệp chịu tác động từ <b>${rich(p.impact_from)}</b></span>` : ''}</div></div>
    <button type="button" class="pp-close" aria-label="Đóng">×</button></div>
    <div class="pp-dlg-body">
      <section><h4>1. What changed?</h4><div class="pp-cmp"><div><small>Trước</small>${rich(p.previous_regulation || 'Văn bản không nêu / chưa xác minh')}</div><div class="after"><small>Hiện tại</small>${rich(p.regulatory_change)}</div></div></section>
      <section><h4>2. Why does it matter?</h4><p style="margin:0">${rich(p.impact_mechanism)}</p></section>
      <section><h4>3. Financial transmission</h4><div class="pp-chips">${(p.financial_drivers || []).map(d => `<span class="pp-chip">${esc(DRIVER[d] || d)}</span>`).join('')}<span class="pp-chip">${esc(HORIZON[p.impact_horizon] || 'Chưa xác định thời gian')}</span></div>${p.impact_basis ? `<p style="margin:6px 0 0">${rich(p.impact_basis)}</p>` : ''}</section>
      <section><h4>4. Company exposure</h4>${exp}</section>
      <section><h4>5. What to monitor next?</h4><ul style="margin:0;padding-left:18px">${(p.monitoring_indicators || []).map(m => `<li>${rich(m)}</li>`).join('') || '<li>Chưa xác định</li>'}</ul>${p.implementation ? `<p style="margin:6px 0 0"><b>Còn chờ:</b> ${rich(p.implementation)}</p>` : ''}</section>
      <section><h4>6. Source &amp; legal references</h4><ul style="margin:0;padding-left:18px">${(p.sources || []).map(s => `<li>${link(s.url, s.label)}${s.kind ? ` <small style="color:#64748B">(${esc(s.kind)})</small>` : ''}</li>`).join('')}</ul>
        <p style="margin:6px 0 0;font-size:12px;color:#64748B">Xác minh ${dmy(p.last_verified_at)} · độ tin cậy dữ liệu: ${esc(p.data_confidence || '—')}</p></section>
    </div>`;
  dlg.querySelector('.pp-close').addEventListener('click', () => dlg.close());
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
}

/* ---------- module shell: tiêu đề → câu hỏi → hình chính → kết luận → hàm ý → chi tiết ---------- */
function shell(id, fill) {
  const host = document.getElementById('pp-' + id); if (!host) return;
  const m = (P.modules || {})[id] || {};
  host.innerHTML = `<h3 class="pp-title"><span class="pp-code">${esc(id)}</span>${esc(m.title || '')}</h3>${m.question ? `<p class="pp-q">${rich(m.question)}</p>` : ''}`;
  const body = el('div', 'pp-body'); host.append(body);
  let detail = '';
  try { detail = fill(body, m) || ''; } catch (e) { body.innerHTML = `<div class="pp-empty">Không dựng được phần này (${esc(e.message)}).</div>`; console.error('power-policy', id, e); }
  if (m.takeaway) host.append(el('p', 'pp-take', `<b class="pp-lbl">Key takeaway</b>${rich(m.takeaway)}`));
  if (m.implication) host.append(el('p', 'pp-impl', `<b class="pp-lbl">Investment implication</b>${rich(m.implication)}${m.impact_type ? `<span class="pp-itype">${esc(m.impact_type)}</span>` : ''}`));
  if (m.limitation) host.append(el('details', 'note-icon', `<summary>ⓘ Giới hạn</summary><div>${rich(m.limitation)}</div>`));
  if (m.gap) host.append(el('div', 'pp-gap data-gap', `<b>Thiếu dữ liệu:</b> ${rich(m.gap)}`));
  const pols = (m.policies || []).map(x => byId[x]).filter(Boolean);
  if (detail || pols.length) {
    const d = el('details', 'research-fold pp-detail');
    d.innerHTML = `<summary>${esc(m.detail_label || 'Chi tiết: văn bản, số liệu và phương pháp')}</summary><div class="research-detail">${detail}${pols.length ? `<p style="margin:10px 0 4px"><b>Văn bản liên quan</b> (bấm để mở phân tích):</p><div class="pp-chips">${pols.map(p => `<button type="button" class="pp-chip pp-open" data-id="${esc(p.policy_id)}">${esc(p.document_number || p.policy_name)}</button>`).join('')}</div>` : ''}</div>`;
    host.append(d);
  }
  host.insertAdjacentHTML('beforeend', srcLine(m.sources, m.checked || P.as_of));
}

/* ---------- small SVG kit (sơ đồ, thanh ngang, dải, Gantt) ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
function hbars(rows, o = {}) {
  // rows: [{label, value, color, note}] · vẽ thanh ngang có nhãn giá trị; không dùng cho chuỗi thời gian.
  const W = 960, lw = o.labelWidth || 220, rh = 30, top = 8, H = top + rows.length * rh + 22;
  const max = Math.max(...rows.map(r => r.value || 0)) * 1.12 || 1, x = v => lw + (W - lw - 70) * v / max;
  const body = rows.map((r, i) => {
    const y = top + i * rh;
    return `<text x="${lw - 8}" y="${y + 18}" text-anchor="end" class="lb">${esc(r.label)}</text><rect x="${lw}" y="${y + 6}" width="${Math.max(0, x(r.value) - lw).toFixed(1)}" height="16" rx="3" fill="${r.color || '#2938A8'}"><title>${esc(r.label)}: ${esc(r.text || nf(r.value))}</title></rect><text x="${(x(r.value) + 6).toFixed(1)}" y="${y + 18}" class="vl" fill="${r.color || '#2938A8'}">${esc(r.text || nf(r.value))}</text>`;
  }).join('');
  return `<svg class="pp-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${body}<text x="${lw}" y="${H - 4}" class="ax" style="font-size:11px">${esc(o.unit || '')}</text></svg>`;
}
function ranges(rows, o = {}) {
  // rows: [{label, low, high, year, color}] · dải mục tiêu min–max (một năm mục tiêu mỗi dòng).
  const W = 980, lw = 210, rh = 28, top = 26, H = top + rows.length * rh + 30;
  const top0 = Math.max(...rows.map(r => r.high || r.low || 0)), step = [5000, 10000, 20000, 25000, 50000].find(s => top0 / s <= 5) || 100000, max = Math.ceil(top0 / step) * step, x = v => lw + (W - lw - 170) * v / max;
  const ticks = Array.from({length: Math.round(max / step) + 1}, (_, i) => i * step);
  const grid = ticks.map(t => `<line x1="${x(t)}" x2="${x(t)}" y1="${top - 6}" y2="${H - 26}" class="gl"/><text x="${x(t)}" y="${H - 10}" text-anchor="middle" class="ax" style="font-size:11px">${nf(t)}</text>`).join('');
  const body = rows.map((r, i) => {
    const y = top + i * rh + 4, lo = r.low, hi = r.high ?? r.low, c = r.color || '#2938A8';
    const bar = hi > lo ? `<rect x="${x(lo)}" y="${y + 3}" width="${(x(hi) - x(lo)).toFixed(1)}" height="12" rx="6" fill="${c}" opacity=".35"/><circle cx="${x(lo)}" cy="${y + 9}" r="5" fill="${c}"/><circle cx="${x(hi)}" cy="${y + 9}" r="5" fill="${c}"/>` : `<circle cx="${x(lo)}" cy="${y + 9}" r="5" fill="${c}"/>`;
    const act = r.actual != null ? `<line x1="${x(r.actual)}" x2="${x(r.actual)}" y1="${y - 1}" y2="${y + 19}" stroke="#303540" stroke-width="3"><title>Thực tế cuối 2025: ${nf(r.actual)} MW</title></line>` : '';
    return `<text x="${lw - 8}" y="${y + 13}" text-anchor="end" class="lb">${esc(r.label)}</text>${bar}${act}<text x="${(x(hi) + 10).toFixed(1)}" y="${y + 13}" class="vl" fill="${c}">${hi > lo ? nf(lo) + '–' + nf(hi) : nf(lo)}${r.year ? ' · ' + esc(r.year) : ''}</text><title>${esc(r.label)}</title>`;
  }).join('');
  return `<svg class="pp-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${grid}${body}</svg>`;
}
function gantt(rows, o = {}) {
  // rows: [{name, mw, start, end, actual, status, color}] · start/end dạng YYYY hoặc YYYY-MM; thiếu mốc thì không vẽ thanh.
  const toN = s => { if (!s) return null; const m = String(s).match(/^(\d{4})(?:-(\d{2}))?/); return m ? +m[1] + ((+m[2] || 6) - 1) / 12 : null; };
  const ys = rows.flatMap(r => [toN(r.start), toN(r.end), toN(r.actual)]).filter(v => v != null);
  const y0 = Math.floor(Math.min(...ys, 2025)), y1 = Math.ceil(Math.max(...ys, 2030)) + 1;
  const W = 980, lw = 250, rh = 30, top = 24, H = top + rows.length * rh + 12, x = v => lw + (W - lw - 20) * (v - y0) / (y1 - y0);
  const now = toN(P.as_of.slice(0, 7));
  let grid = '';
  for (let y = y0; y <= y1; y++) grid += `<line x1="${x(y)}" x2="${x(y)}" y1="${top - 4}" y2="${H - 8}" class="gl"/><text x="${x(y) + 3}" y="${top - 8}" class="ax" style="font-size:11px">${y}</text>`;
  grid += `<line x1="${x(now)}" x2="${x(now)}" y1="${top - 4}" y2="${H - 8}" stroke="#861C52" stroke-dasharray="3 3"/>`;
  const body = rows.map((r, i) => {
    const y = top + i * rh, s = toN(r.start), e = toN(r.end), a = toN(r.actual), c = r.color || '#2938A8';
    let g = `<text x="${lw - 8}" y="${y + 17}" text-anchor="end" class="lb">${esc(r.name)}${r.mw ? ' · ' + esc(r.mw) + ' MW' : ''}</text>`;
    if (s != null && (e ?? a) != null) g += `<rect x="${x(s)}" y="${y + 7}" width="${Math.max(3, x(e ?? a) - x(s)).toFixed(1)}" height="14" rx="4" fill="${c}" opacity="${r.status === 'COD' ? 1 : .75}"><title>${esc(r.name)}: khởi công ${esc(r.start)} → ${r.actual ? 'COD ' + esc(r.actual) : 'COD kế hoạch ' + esc(r.end)}</title></rect>`;
    else if ((e ?? a) != null) g += `<line x1="${Math.max(lw + 4, x(e ?? a) - 40)}" x2="${x(e ?? a) - 6}" y1="${y + 14}" y2="${y + 14}" stroke="${c}" stroke-dasharray="3 3" opacity=".6"><title>Chưa công bố ngày khởi công</title></line>`;
    if (e != null) g += `<path d="M${x(e)} ${y + 6}l6 8-6 8-6-8z" fill="#fff" stroke="${c}" stroke-width="2"><title>COD kế hoạch ${esc(r.end)}</title></path>`;
    if (a != null) g += `<path d="M${x(a)} ${y + 6}l6 8-6 8-6-8z" fill="#1f7a4d"><title>COD thực tế ${esc(r.actual)}</title></path>`;
    return g;
  }).join('');
  return `<svg class="pp-svg pp-gantt" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${grid}${body}</svg>`;
}
const flow = (steps, cls = '') => `<div class="pp-flow ${cls}">${steps.map((s, i) => `${i ? `<span class="pp-arrow" aria-hidden="true">${cls.includes('vertical') ? '↓' : '→'}</span>` : ''}<div class="pp-step ${s.cls || ''}"><b>${rich(s.t)}</b>${s.d ? `<small>${rich(s.d)}</small>` : ''}</div>`).join('')}</div>`;
const table = (head, rows, o = {}) => `<div class="tablewrap"><table class="pp-table ${o.cls || ''}"${o.min ? ` style="min-width:${o.min}px"` : ''}><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr${r.id ? ` class="pp-row" tabindex="0" data-id="${esc(r.id)}"` : ''}>${r.cells.map(c => `<td${c && c.num ? ' class="num"' : ''}>${c && typeof c === 'object' ? c.html : rich(c ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function mountChart(host, model, kind) {
  // Đi qua ChartTypes (nút đổi kiểu chart, chú giải bấm ẩn/hiện) như mọi chart ngành; không có thì vẽ SVG tĩnh.
  if (window.ChartTypes) ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, kind); });
}

/* ---------- TOP: Policy Radar ---------- */
function radar() {
  const host = document.getElementById('pp-radar'); if (!host) return;
  const m = (P.modules || {}).radar || {};
  host.innerHTML = `<h3 class="pp-title">${esc(m.title || 'Policy Radar')}</h3><p class="pp-q">${rich(m.question || '')}</p>`;
  host.append(filterBar(['cat', 'status', 'year', 'tech', 'ticker'], 'Lọc Policy Radar'));
  const count = el('div', 'pp-count'), grid = el('div', 'pp-radar');
  host.append(count, grid);
  host.insertAdjacentHTML('beforeend', `<div class="pp-chip-key"><span><span class="pp-chip t-direct">Mã</span> chịu tác động trực tiếp (đã xác định tài sản trong phạm vi)</span><span><span class="pp-chip t-indirect">Mã</span> gián tiếp</span><span><span class="pp-chip t-potential">Mã</span> tiềm năng, còn điều kiện</span></div>`);
  if (m.limitation) host.append(el('details', 'note-icon', `<summary>ⓘ Cách chấm mức tác động</summary><div>${rich(m.limitation)}</div>`));
  const rank = {High: 0, Medium: 1, Low: 2, nq: 3};
  const draw = () => {
    const keys = ['cat', 'status', 'year', 'tech', 'ticker'], filtered = keys.some(k => state[k]);
    const pool = policies.filter(p => matches(p, keys)).filter(p => filtered || p.radar);
    pool.sort((a, b) => (a.radar || 99) - (b.radar || 99) || rank[levelOf(a)] - rank[levelOf(b)] || (b.effective_date || '').localeCompare(a.effective_date || ''));
    const list = pool.slice(0, 5);
    count.textContent = filtered ? `${list.length}/${pool.length} chính sách khớp bộ lọc (hiện tối đa 5, xếp theo mức tác động)` : `${list.length} thay đổi chính sách đáng chú ý nhất · cập nhật ${dmy(P.as_of)}`;
    grid.innerHTML = list.length ? list.map(p => {
      const lv = levelOf(p);
      return `<article class="pp-rc" tabindex="0" role="button" data-id="${esc(p.policy_id)}" aria-label="Mở phân tích ${esc(p.policy_name)}">
        <div class="pp-badges">${badge('st-' + p.policy_status, p.policy_status)}${badge('dir-' + (p.direction || 'Uncertain'), DIR[p.direction] || 'Uncertain')}${badge('lv-' + lv, LEVEL[lv], p.impact_basis || '')}</div>
        <h4>${esc(p.short_name || p.policy_name)}</h4><div class="pp-doc">${esc(p.document_number || '')}${p.issuing_authority ? ' · ' + esc(p.issuing_authority) : ''}</div>
        <div class="pp-dates"><span>Ban hành <b>${dmy(p.issue_date) || '—'}</b></span><span>Hiệu lực <b>${dmy(p.effective_date) || '—'}</b></span></div>
        <p><b>Thay đổi:</b> ${rich(p.radar_change || p.regulatory_change)}</p>
        <div class="pp-chips">${chips(p.exposed_companies)}</div>
        ${p.implementation ? `<p style="font-size:12px;color:#64748B"><b>Còn chờ:</b> ${rich(p.implementation)}</p>` : ''}
        <div class="pp-rc-foot">${p.primary_source_url ? link(p.primary_source_url, 'Văn bản ↗') : '<span></span>'}<span class="pp-more">Phân tích →</span></div></article>`;
    }).join('') : '<div class="pp-empty">Không có chính sách khớp bộ lọc.</div>';
  };
  listeners.push(draw); draw();
}

/* ---------- GROUP 1 · Giá điện & PPA ---------- */
function m1A() {
  shell('1A', (body, m) => {
    const F = P.price_frameworks || [];
    const techList = [...new Set(F.map(f => f.family))];
    const ctl = el('div', 'pp-controls');
    ctl.innerHTML = `<label>Công nghệ <select data-k="family">${techList.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label><label>Vùng <select data-k="region"></select></label>`;
    const viz = el('div', 'viz-block');
    viz.innerHTML = `<div class="chart-title">Trần khung giá phát điện: năm trước so với năm hiện tại</div><div class="chart-sub">đ/kWh, chưa VAT · chỉ so cùng loại hình, cùng vùng, cùng bản chất (giá trần đàm phán PPA)</div><div id="chPolicyCeilingYoY"></div>`;
    const delta = el('div'), latest = el('div', 'viz-block');
    body.append(ctl, viz, delta);
    const fam = ctl.querySelector('[data-k=family]'), reg = ctl.querySelector('[data-k=region]');
    fam.value = store.get('pp-1a-family') && techList.includes(store.get('pp-1a-family')) ? store.get('pp-1a-family') : (m.default_family || techList[0]);
    // Vùng biển gió ngoài khơi quy về miền tương ứng; khung một mức cho cả nước hiện ở mọi miền.
    const REG = {'Bắc Bộ': 'Bắc', 'Nam Trung Bộ': 'Trung', 'Nam Bộ': 'Nam'}, rg = f => REG[f.region] || f.region;
    const regions = () => { const r = [...new Set(F.filter(f => f.family === fam.value).map(rg))]; const m = r.filter(x => x !== 'Toàn quốc'); return m.length ? ['Bắc', 'Trung', 'Nam'].filter(x => m.includes(x)) : r; };
    const fillReg = () => { const r = regions(); reg.innerHTML = r.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join(''); reg.disabled = r.length < 2; };
    const draw = () => {
      const rows = F.filter(f => f.family === fam.value && (rg(f) === reg.value || f.region === 'Toàn quốc')).map(f => REG[f.region] ? {...f, label: f.label + ' (vùng biển ' + f.region + ')'} : f.region === 'Toàn quốc' && reg.value !== 'Toàn quốc' ? {...f, label: f.label + ' (cả nước)'} : f);
      const kinds = [...new Set(rows.map(r => r.label))], years = [...new Set(rows.map(r => r.year))].sort();
      const pal = ['#8997D6', '#2938A8', '#1D2678'];
      const model = {categories: kinds, series: years.map((y, i) => ({name: String(y), color: pal[Math.max(0, pal.length - years.length + i)], values: kinds.map(k => rows.find(r => r.label === k && r.year === y)?.ceiling ?? null)})), unit: 'đ/kWh', digits: 0, labels: true, key: 'pp-1a-' + fam.value + '-' + reg.value, aria: `Trần khung giá ${fam.value} ${reg.value} theo năm`};
      const host = document.getElementById('chPolicyCeilingYoY');
      host.innerHTML = '';
      mountChart(host, model, 'bar');
      const pairs = kinds.map(k => { const a = rows.filter(r => r.label === k).sort((x, y) => x.year - y.year); const prev = a.at(-2), cur = a.at(-1); return {k, prev, cur}; });
      delta.innerHTML = table(['Loại hình', 'Năm trước', 'Năm hiện tại', 'Thay đổi (đ/kWh)', '% thay đổi YoY', 'Văn bản'], pairs.map(({k, prev, cur}) => {
        const ok = prev && cur && prev.year !== cur.year && prev.comparable !== false && cur.comparable !== false, d = ok ? cur.ceiling - prev.ceiling : null, pct = ok ? d / prev.ceiling * 100 : null;
        return {cells: [k, {html: prev && prev !== cur ? `${nf(prev.ceiling, 2)} <small>(${prev.year})</small>` : `<small>chỉ có khung ${cur ? cur.year : ''}</small>`, num: 1}, {html: cur ? `<b>${nf(cur.ceiling, 2)}</b> <small>(${cur.year})</small>` : '—', num: 1}, {html: d == null ? '—' : `<span class="${d >= 0 ? 'pp-delta-up' : 'pp-delta-dn'}">${sg(d, 2)}</span>`, num: 1}, {html: pct == null ? (prev && cur && prev !== cur && !ok ? '<small>không cùng phạm vi</small>' : '—') : `<span class="${pct >= 0 ? 'pp-delta-up' : 'pp-delta-dn'}">${sg(pct, 1)}%</span>`, num: 1}, [cur?.decision, prev && prev !== cur ? prev.decision : ''].filter(Boolean).join(' ← ')]};
      }), {min: 640});
      store.set('pp-1a-family', fam.value);
    };
    fam.addEventListener('change', () => { fillReg(); draw(); });
    reg.addEventListener('change', draw);
    fillReg(); draw();
    // Bảng mới nhất mọi loại hình, theo miền và văn bản (thay bảng cũ dưới chart dien-17).
    const all = [...new Set(F.map(f => f.family + '|' + f.label))].map(key => {
      const [fa, lb] = key.split('|'), a = F.filter(f => f.family === fa && f.label === lb), y = Math.max(...a.map(r => r.year)), cur = a.filter(r => r.year === y);
      return [fa, lb, String(y), cur.map(r => (cur.length > 1 ? r.region + ' ' : '') + nf(r.ceiling, 2)).join(' · '), cur[0].decision + (cur[0].decision_date ? ' (' + dmy(cur[0].decision_date) + ')' : '')];
    });
    return `<p style="margin:0 0 6px"><b>Khung mới nhất của từng loại hình</b> (đ/kWh, chưa VAT):</p>${table(['Nhóm', 'Loại hình', 'Năm', 'Trần theo vùng', 'Văn bản'], all.map(r => ({cells: r})), {min: 620})}${(P.pending_frameworks || []).length ? `<p style="margin:10px 0 4px"><b>Chưa có khung năm hiện tại</b> (không vẽ cột năm mới):</p><ul style="margin:0;padding-left:18px">${P.pending_frameworks.map(x => `<li>${rich(x)}</li>`).join('')}</ul>` : ''}`;
  });
}
function m1A2() {
  // Chart B: các loại giá không cùng một biến số → tách làn, không nối thành một chuỗi.
  shell('1A2', (body, m) => {
    const T = P.price_types || [];
    body.innerHTML = table(['Loại giá', 'Bản chất', 'Đơn vị · kỳ', 'Mức gần nhất', 'Áp dụng cho', 'Ở đâu trên dashboard'], T.map(t => ({cells: [{html: `<b>${rich(t.type)}</b>`}, t.nature, t.unit, {html: rich(t.latest || '—')}, t.applies, {html: t.where_html || rich(t.where || '—')}]})), {min: 760});
    return '';
  });
}
function m1B() {
  shell('1B', (body, m) => {
    const T = P.transitional || {};
    const viz = el('div', 'viz-block');
    viz.innerHTML = `<div class="chart-title">Dự án điện tái tạo chuyển tiếp theo tình trạng giá</div><div class="chart-sub">MW · ${esc(T.as_of_label || '')} · các nhóm có thể chồng lấn, không cộng thành tổng</div>${hbars((T.rows || []).map(r => ({label: `${r.label} (${r.projects} dự án)`, value: r.mw, text: r.mw_text || nf(r.mw) + ' MW', color: r.color})), {labelWidth: 290, unit: 'MW', aria: 'Dự án chuyển tiếp theo tình trạng giá'})}`;
    body.append(viz);
    body.insertAdjacentHTML('beforeend', `<div style="margin-top:12px">${table(['Cơ chế', 'Tài sản áp dụng', 'Quy tắc giá', 'Rủi ro chính', 'Doanh nghiệp liên quan'], (P.mechanisms || []).map(r => ({cells: [{html: `<b>${rich(r.mechanism)}</b>`}, r.assets, r.rule, r.risk, {html: chips(r.companies)}]})), {min: 820})}</div>`);
    return (P.fit_risk_notes || []).length ? `<ul style="margin:0;padding-left:18px">${P.fit_risk_notes.map(x => `<li>${rich(x)}</li>`).join('')}</ul>` : '';
  });
}
function m1C() {
  shell('1C', (body, m) => {
    const PR = P.ppa_profiles || [], EL = P.ppa_elements || [];
    const ctl = el('div', 'pp-controls');
    ctl.innerHTML = `<label>Nhóm nhà máy <select>${PR.map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select></label>`;
    const out = el('div');
    body.append(ctl, out);
    const sel = ctl.querySelector('select');
    const mark = v => v?.level === 'yes' ? '<span class="pp-yes">●</span>' : v?.level === 'partial' ? '<span class="pp-part">◐</span>' : '<span class="pp-no">○</span>';
    const draw = () => {
      const p = PR.find(x => x.id === sel.value) || PR[0]; if (!p) return;
      out.innerHTML = flow([{t: 'Tài sản phát điện', d: p.asset}, {t: 'Cơ chế giá', d: p.pricing, cls: 'hl'}, {t: 'Bên mua / thị trường', d: p.buyer}, {t: 'Thu tiền', d: p.collection}])
        + `<div style="margin-top:10px">${table(['Yếu tố', '', 'Áp dụng cho nhóm này'], EL.map(e => ({cells: [{html: `<b>${rich(e.label)}</b>`}, {html: mark(p.elements?.[e.id])}, {html: rich(p.elements?.[e.id]?.text || 'Không áp dụng / chưa xác định')}]})), {min: 520})}</div>`
        + `<div class="pp-chips" style="margin-top:8px"><span style="font-size:12px;color:#64748B;margin-right:4px">Mã có tài sản thuộc nhóm:</span>${chips(p.companies)}</div>`;
    };
    sel.addEventListener('change', draw); draw();
    return '<p style="margin:0">● áp dụng · ◐ một phần hoặc tùy hợp đồng · ○ không áp dụng. Khung tham chiếu theo văn bản; điều khoản cụ thể (giá, sản lượng, thời hạn thanh toán) nằm trong PPA từng nhà máy và không được công bố đầy đủ.</p>';
  });
}
function m1D() {
  shell('1D', (body, m) => {
    const R = P.retail_tariff || [];
    const viz = el('div', 'viz-block');
    viz.innerHTML = `<div class="chart-title">Giá bán lẻ điện bình quân qua các lần điều chỉnh</div><div class="chart-sub">đ/kWh, chưa VAT · mỗi điểm là một quyết định điều chỉnh, không phải chuỗi tháng</div><div id="chPolicyRetail"></div>`;
    body.append(viz);
    const model = {categories: R.map(r => dmy(r.date)), series: [{name: 'Giá bán lẻ bình quân', color: '#2938A8', values: R.map(r => r.price)}], unit: 'đ/kWh', digits: 0, labels: true, zeroBase: false, key: 'pp-1d-retail', aria: 'Giá bán lẻ điện bình quân theo quyết định'};
    mountChart(document.getElementById('chPolicyRetail'), model, 'line');
    body.insertAdjacentHTML('beforeend', `<div style="margin-top:12px">${flow((P.retail_chain || []).map(s => ({t: s.t, d: s.d, cls: s.cls})))}</div>`);
    return table(['Áp dụng từ', 'đ/kWh', 'Thay đổi', 'Văn bản'], R.map(r => ({cells: [dmy(r.date), {html: nf(r.price, 2), num: 1}, {html: `<span class="${/^[−-]/.test(r.change) ? 'pp-delta-dn' : 'pp-delta-up'}">${esc(r.change)}</span>`, num: 1}, {html: link(r.url, r.decision)}]})), {min: 480});
  });
}

/* ---------- GROUP 2 · Thị trường & điều độ ---------- */
function m2A() {
  shell('2A', (body, m) => {
    const M = P.market || {};
    body.innerHTML = `<div class="pp-two"><div>${flow((M.chain || []).map(s => ({t: s.t, d: s.d, cls: s.cls})), 'vertical')}</div><div>${table(['Thành phần', 'Cơ chế', 'Mức đã xác minh'], (M.components || []).map(c => ({cells: [{html: `<b>${rich(c.item)}</b>`}, c.rule, {html: rich(c.value || '—')}]})), {min: 420})}</div></div>`;
    return (M.notes || []).length ? `<ul style="margin:0;padding-left:18px">${M.notes.map(x => `<li>${rich(x)}</li>`).join('')}</ul>` : '';
  });
}
function m2B() {
  shell('2B', (body, m) => {
    const D = P.dispatch || {};
    body.innerHTML = table(['Yếu tố', 'Ảnh hưởng đến huy động', 'Căn cứ', 'Ngoại lệ / lưu ý'], (D.factors || []).map(f => ({cells: [{html: `<b>${rich(f.factor)}</b>`}, f.effect, {html: rich(f.basis || '—')}, f.exception || '—']})), {min: 760})
      + `<p style="margin:14px 0 6px;font-size:12.5px;font-weight:700;color:#1D2678">Năm khái niệm hay bị nhầm</p>` + flow((D.capacity_terms || []).map(t => ({t: t.t, d: t.d})));
    return '';
  });
}
function m2C() {
  shell('2C', (body, m) => {
    const D = P.dppa || {};
    body.innerHTML = `<div class="pp-two">${(D.models || []).map(x => `<div class="pp-mini"><h4>${rich(x.title)}</h4>${flow(x.flow.map(s => ({t: s.t, d: s.d})), 'vertical')}<ul style="margin-top:8px">${x.points.map(p => `<li>${rich(p)}</li>`).join('')}</ul></div>`).join('')}</div>`
      + `<p style="margin:14px 0 6px;font-size:12.5px;font-weight:700;color:#1D2678">PPA truyền thống so với DPPA</p>` + table(['Khía cạnh', 'PPA với EVN/EPTC', 'DPPA qua lưới quốc gia'], (D.compare || []).map(r => ({cells: [{html: `<b>${rich(r.aspect)}</b>`}, r.ppa, r.dppa]})), {min: 620})
      + `<p style="margin:14px 0 6px;font-size:12.5px;font-weight:700;color:#1D2678">Thay đổi theo văn bản</p>` + table(['Nội dung', 'Trước', 'Sau', 'Văn bản'], (D.changes || []).map(r => ({cells: [r.item, r.before, {html: `<b>${rich(r.after)}</b>`}, r.doc]})), {min: 620});
    return (D.facts || []).length ? `<ul style="margin:0;padding-left:18px">${D.facts.map(x => `<li>${rich(x)}</li>`).join('')}</ul>` : '';
  });
}

/* ---------- GROUP 3 · Quy hoạch & đầu tư ---------- */
function m3A() {
  shell('3A', (body, m) => {
    const Q = P.plan || {};
    const viz = el('div', 'viz-block');
    viz.innerHTML = `<div class="chart-title">Công suất mục tiêu theo nguồn — QĐ 768/QĐ-TTg</div><div class="chart-sub">MW · dải thấp–cao theo quyết định · năm mục tiêu ghi ở từng dòng; không cộng các mốc khác năm</div>${ranges((Q.targets || []).map(t => ({label: t.source, low: t.low, high: t.high, year: t.year, color: t.color})), {aria: 'Công suất mục tiêu QĐ 768 theo nguồn'})}<div class="pp-legend">${(Q.legend || []).map(l => `<span><i style="background:${l.color}"></i>${esc(l.label)}</span>`).join('')}</div>`;
    body.append(viz);
    body.insertAdjacentHTML('beforeend', `<div style="margin-top:12px">${table(['Chỉ tiêu', 'QĐ 768 (hiệu lực)', 'Đợt điều chỉnh lần 2', 'Trạng thái'], (Q.revisions || []).map(r => ({cells: [r.item, {html: rich(r.current)}, {html: rich(r.proposal)}, r.status]})), {min: 620})}</div>`);
    return table(['Chỉ tiêu năm 2030', 'Mục tiêu'], (Q.headline || []).map(r => ({cells: [r[0], {html: `<b>${esc(r[1])}</b>`}]})), {min: 420});
  });
}
function m3B() {
  shell('3B', (body, m) => {
    const PL = P.pipeline || [], ST = P.pipeline_status || [];
    const cats = ST.map(s => s.label), techs2 = [...new Set(PL.map(p => p.tech_label))];
    const pal = ['#1D2678', '#2938A8', '#59C5C8', '#861C52', '#8997D6', '#c29100'];
    const viz = el('div', 'viz-block');
    viz.innerHTML = `<div class="chart-title">Dự án đã xác minh theo giai đoạn triển khai</div><div class="chart-sub">MW · ${PL.length} dự án có nguồn chủ đầu tư / cơ quan nhà nước · không phải toàn bộ danh mục QĐ 768</div><div id="chPolicyPipeline"></div>`;
    body.append(viz);
    const model = {categories: cats, series: techs2.map((t, i) => ({name: t, color: pal[i % pal.length], values: ST.map(s => { const v = PL.filter(p => p.status === s.id && p.tech_label === t).reduce((a, p) => a + (+p.mw || 0), 0); return v || null; })})), unit: 'MW', digits: 0, stackable: true, key: 'pp-3b-pipe', aria: 'MW dự án theo giai đoạn'};
    mountChart(document.getElementById('chPolicyPipeline'), model, 'stack');
    const g = el('div', 'viz-block');
    g.style.marginTop = '14px';
    const rows = [...PL].sort((a, b) => (a.cod_actual || a.cod_plan || '9').localeCompare(b.cod_actual || b.cod_plan || '9'));
    g.innerHTML = `<div class="chart-title">Tiến độ từng dự án: khởi công → COD</div><div class="chart-sub">◇ COD kế hoạch · ◆ COD thực tế · đường đỏ: ${dmy(P.as_of)} · dự án chưa công bố ngày khởi công chỉ có mốc COD</div>${gantt(rows.map(p => ({name: p.name, mw: p.mw_label || nf(p.mw), start: p.start, end: p.cod_plan, actual: p.cod_actual, status: p.status, color: (P.tech_colors || {})[p.tech] })), {aria: 'Tiến độ dự án nguồn điện'})}`;
    body.append(g);
    return table(['Dự án', 'MW', 'Công nghệ', 'Chủ đầu tư', 'Giai đoạn', 'Khởi công', 'COD kế hoạch', 'COD thực tế', 'Tổng mức đầu tư', 'Nguồn'], rows.map(p => ({cells: [p.name, {html: esc(p.mw_label || nf(p.mw)), num: 1}, p.tech_label, p.owner, (ST.find(s => s.id === p.status) || {}).label || p.status, p.start || '—', p.cod_plan || '—', p.cod_actual || '—', p.capex || 'chưa công bố', {html: link(p.source_url, p.source_label || 'nguồn')}]})), {min: 1100});
  });
}
function m3C() {
  shell('3C', (body, m) => {
    const G = P.grid || {};
    body.innerHTML = flow((G.chain || []).map(s => ({t: s.t, d: s.d, cls: s.cls}))) + `<div style="margin-top:12px">${table(['Chỉ tiêu / văn bản', 'Nội dung đã xác minh', 'Kênh tới doanh nghiệp'], (G.facts || []).map(f => ({cells: [{html: `<b>${rich(f.item)}</b>`}, {html: rich(f.value)}, {html: rich(f.channel || '—') + (f.companies ? ' ' + chips(f.companies) : '')}]})), {min: 680})}</div>`;
    return '';
  });
}

/* ---------- GROUP 4 · Thuế, thương mại, carbon ---------- */
function m4A() {
  shell('4A', (body, m) => {
    const T = P.taxes || [];
    body.innerHTML = T.length ? table(['Thuế / phí', 'Phân khúc áp dụng', 'Quy định trước', 'Quy định hiện hành', 'Loại chi phí', 'Hàm ý kinh tế'], T.map(t => ({cells: [{html: `<b>${rich(t.item)}</b>`}, t.segment, {html: rich(t.previous)}, {html: rich(t.current)}, t.cost_type, {html: rich(t.implication)}]})), {min: 920}) : '<div class="pp-empty">Chưa có thay đổi thuế/phí đã xác minh có kênh tác động rõ đến ngành điện.</div>';
    return '';
  });
}
function m4B() {
  shell('4B', (body, m) => {
    const T = P.trade || {};
    body.innerHTML = `<div class="pp-two">${(T.channels || []).map(c => `<div class="pp-mini"><h4>${rich(c.title)}</h4>${flow(c.flow.map(s => ({t: s.t, d: s.d, cls: s.cls})), 'vertical')}</div>`).join('')}</div>` + ((T.facts || []).length ? `<div style="margin-top:12px">${table(['Chỉ tiêu / văn bản', 'Nội dung đã xác minh', 'Lưu ý khi suy luận'], T.facts.map(f => ({cells: [{html: `<b>${rich(f.item)}</b>`}, {html: rich(f.value)}, f.caveat || '—']})), {min: 680})}</div>` : '');
    return '';
  });
}
function m4C() {
  shell('4C', (body, m) => {
    const C = P.carbon || {};
    let h = '';
    if ((C.intensity || []).length) h += `<div class="viz-block"><div class="chart-title">${esc(C.intensity_title || 'Cường độ phát thải theo công nghệ')}</div><div class="chart-sub">${esc(C.intensity_sub || '')}</div>${hbars(C.intensity.map(r => ({label: r.label, value: r.value, text: r.text, color: r.color})), {labelWidth: 200, unit: C.intensity_unit || '', aria: 'Cường độ phát thải theo công nghệ'})}</div>`;
    h += (C.facts || []).length ? `<div style="margin-top:12px">${table(['Nội dung', 'Quy định đã xác minh', 'Kênh tới doanh nghiệp'], C.facts.map(f => ({cells: [{html: `<b>${rich(f.item)}</b>`}, {html: rich(f.value)}, {html: rich(f.channel || '—') + (f.companies ? ' ' + chips(f.companies) : '')}]})), {min: 680})}</div>` : '';
    body.innerHTML = h || '<div class="pp-empty">Chưa có dữ liệu carbon đã xác minh.</div>';
    return '';
  });
}

/* ---------- BOTTOM · Ma trận tác động & lịch pháp lý ---------- */
function matrix() {
  shell('MX', (body, m) => {
    const keys = ['ticker', 'tech', 'cat', 'level', 'status', 'horizon'];
    body.append(filterBar(keys, 'Lọc ma trận tác động'));
    const count = el('div', 'pp-count'), out = el('div');
    body.append(count, out);
    const draw = () => {
      const rows = policies.filter(p => matches(p, keys));
      count.textContent = `${rows.length}/${policies.length} thay đổi chính sách · bấm một dòng để mở phân tích`;
      out.innerHTML = rows.length ? table(['Policy', 'Category', 'Status', 'Regulatory change', 'Transmission channel', 'Financial driver', 'Horizon', 'Direction', 'Exposed companies', 'Confidence', 'Monitoring indicator'], rows.map(p => ({id: p.policy_id, cells: [{html: `<b>${esc(p.short_name || p.policy_name)}</b><br><small>${esc(p.document_number || '')}</small>`}, (groups[p.policy_category] || {}).short || p.policy_category, {html: badge('st-' + p.policy_status, p.policy_status)}, {html: rich(p.radar_change || p.regulatory_change)}, {html: rich(p.channel || p.impact_mechanism)}, (p.financial_drivers || []).map(d => DRIVER[d] || d).join(', '), HORIZON[p.impact_horizon] || '—', {html: badge('dir-' + (p.direction || 'Uncertain'), DIR[p.direction] || 'Uncertain') + ' ' + badge('lv-' + levelOf(p), LEVEL[levelOf(p)])}, {html: `<div class="pp-chips">${chips(p.exposed_companies)}</div>`}, {html: p.data_confidence === 'Unverified' ? badge('cf-Unverified', 'Unverified') : esc(p.data_confidence || '—')}, {html: rich((p.monitoring_indicators || [])[0] || '—')}]})), {min: 1500}) : '<div class="pp-empty">Không có chính sách khớp bộ lọc.</div>';
    };
    listeners.push(draw); draw();
    return '';
  });
}
function calendar() {
  shell('CAL', (body, m) => {
    const C = P.calendar || [], S = {Upcoming: 'Sắp tới', Effective: 'Đang hiệu lực', Completed: 'Đã xong', Delayed: 'Chậm', Superseded: 'Bị thay thế'};
    const dated = C.filter(c => c.date).sort((a, b) => a.date.localeCompare(b.date)), undated = C.filter(c => !c.date);
    body.innerHTML = `<ol class="pp-cal">${dated.map(c => `<li class="s-${esc(c.status)}"><span class="pp-cal-date">${esc(c.date_label || dmy(c.date))}</span>${badge(c.status === 'Effective' ? 'st-Effective' : c.status === 'Upcoming' ? 'st-Issued' : c.status === 'Delayed' ? 'dir-Negative' : 'st-Expired', S[c.status] || c.status)} ${rich(c.event)}${c.policy_id && byId[c.policy_id] ? ` <button type="button" class="pp-more pp-open" data-id="${esc(c.policy_id)}">phân tích →</button>` : ''}${c.source_url ? ` · ${link(c.source_url, c.source_label || 'nguồn')}` : ''}</li>`).join('')}</ol>`
      + (undated.length ? `<p style="margin:12px 0 4px;font-size:12.5px;font-weight:700;color:#1D2678">Đang chờ, chưa có ngày công bố chính thức</p><ul style="margin:0;padding-left:18px;font-size:12.5px">${undated.map(c => `<li>${rich(c.event)}${c.source_url ? ` · ${link(c.source_url, c.source_label || 'nguồn')}` : ''}</li>`).join('')}</ul>` : '');
    return '';
  });
}

/* ---------- layout: radar → sub-nav → nhóm ---------- */
function nav() {
  const bar = document.getElementById('pp-subnav'); if (!bar) return;
  const panes = [...root.querySelectorAll('.pp-group')];
  bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', 'Nhóm chính sách');
  panes.forEach((p, i) => {
    const g = groups[p.dataset.group] || {label: p.dataset.group};
    const b = el('button', p.dataset.group === 'matrix' ? 'pp-jump' : '', esc(g.label)); b.type = 'button'; b.id = 'pp-tab-' + p.dataset.group;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', p.id); p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id);
    b.addEventListener('click', () => select(i, true));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const n = (i + d + panes.length) % panes.length; select(n, true); bar.children[n].focus(); });
    bar.append(b);
  });
  function select(i, scroll) {
    panes.forEach((p, k) => { p.hidden = k !== i; bar.children[k].setAttribute('aria-selected', String(k === i)); bar.children[k].tabIndex = k === i ? 0 : -1; });
    store.set('pp-group', panes[i].dataset.group);
    if (scroll && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({block: 'start'});
    window.dispatchEvent(new Event('resize'));
  }
  const saved = panes.findIndex(p => p.dataset.group === store.get('pp-group'));
  select(saved >= 0 ? saved : 0, false);
  window.PowerPolicyNav = {show: id => { const i = panes.findIndex(p => p.dataset.group === id); if (i >= 0) select(i, true); }};
}

// Mở phân tích từ thẻ radar, dòng ma trận hoặc nút văn bản; Enter/Space trên thẻ cũng mở.
root.addEventListener('click', e => {
  if (e.target.closest('a')) return;
  const t = e.target.closest('.pp-rc,.pp-row,.pp-open'); if (t) openPolicy(t.dataset.id);
  const j = e.target.closest('[data-jump]'); if (j && window.PowerPolicyNav) PowerPolicyNav.show(j.dataset.jump);
});
root.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.pp-rc,.pp-row')) { e.preventDefault(); openPolicy(e.target.dataset.id); } });

[radar, m1A, m1A2, m1B, m1C, m1D, m2A, m2B, m2C, m3A, m3B, m3C, m4A, m4B, m4C, matrix, calendar, nav].forEach(f => { try { f(); } catch (e) { console.error('power-policy', f.name, e); } });
root.querySelectorAll('.pp-group').forEach(g => { if (g.dataset.group === 'matrix') return; const h = g.querySelector('.pp-group-head'); if (h) h.insertAdjacentHTML('beforeend', ' <button type="button" class="pp-more" data-jump="matrix">→ Ma trận tác động</button>'); });
})();
