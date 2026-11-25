/* Điện · tab Policy / Tax / Trade — cẩm nang cơ chế ngành điện (cập nhật 13/11/2026).
   Sơ đồ khung → 4 tab theo vòng đời dự án (Quy hoạch & Đầu tư → Giá điện & Hợp đồng → Điều độ & Thị trường → Thuế & Môi trường)
   → mỗi module theo khuôn A–G (câu hỏi, hiểu nhanh, cơ chế vận hành, quy định hiện hành, hàm ý kinh tế, ai chịu tác động, nguồn pháp lý)
   → phần Tra cứu (ma trận văn bản – doanh nghiệp). Nội dung, tham số lấy từ data/power-policy.js (window.POWER_POLICY);
   văn bản mới chỉ cần sửa data/power-policy.json. Không đổi hash: #mt4 vẫn là route, nhóm đang mở lưu ở ?policy=&m=. */
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
const DIR = {Positive: 'Tích cực', Negative: 'Tiêu cực', Mixed: 'Trái chiều', Uncertain: 'Chưa rõ'};
// Nhãn tiếng Việt cho trạng thái pháp lý (giá trị trong JSON giữ nguyên tiếng Anh để build kiểm).
const ST_VI = {Draft: 'Dự thảo', Issued: 'Đã ban hành', Effective: 'Có hiệu lực', Expired: 'Hết hiệu lực', Superseded: 'Đã bị thay thế'};
const LEVEL = {High: 'Cao', Medium: 'Trung bình', Low: 'Thấp', nq: 'Chưa định lượng'};
const HORIZON = {short: 'Ngắn hạn (≤12 tháng)', medium: 'Trung hạn (1–3 năm)', long: 'Dài hạn (>3 năm)'};
const ETYPE = {direct: 'Trực tiếp', indirect: 'Gián tiếp', potential: 'Tiềm năng', none: 'Chưa xác nhận'};
const DRIVER = {revenue: 'Doanh thu', cost: 'Chi phí', capex: 'Vốn đầu tư', cashflow: 'Dòng tiền', receivables: 'Phải thu', volume: 'Sản lượng'};
const badge = (cls, text, title) => `<span class="pp-badge ${cls}"${title ? ` title="${esc(title)}"` : ''}>${esc(text)}</span>`;
const levelOf = p => p.impact_level && LEVEL[p.impact_level] ? p.impact_level : 'nq';
const yearOf = p => (p.effective_date || p.issue_date || '').slice(0, 4);
const chips = list => (list || []).map(c => `<span class="pp-chip t-${esc(c.type || 'none')}" title="${esc(ETYPE[c.type] || '')}${c.note ? ': ' + esc(c.note) : ''}">${esc(c.ticker)}</span>`).join('');
const srcLine = (sources, checked) => {
  const s = (sources || []).map(x => link(x.url, x.label)).join(' · ');
  return s ? `<div class="pp-src">Nguồn: ${s}${checked ? ` · kiểm ${dmy(checked)}` : ''}</div>` : '';
};

/* ---------- bộ lọc của phần tra cứu ---------- */
const FKEYS = {
  cat: {label: 'Nhóm cơ chế', options: () => (P.groups || []).map(g => [g.id, g.label]), test: (p, v) => p.policy_category === v},
  status: {label: 'Tình trạng pháp lý', options: () => STATUS.filter(s => policies.some(p => p.policy_status === s)).map(s => [s, ST_VI[s] || s]), test: (p, v) => p.policy_status === v},
  year: {label: 'Năm hiệu lực', options: () => [...new Set(policies.map(yearOf).filter(Boolean))].sort().reverse().map(y => [y, y]), test: (p, v) => yearOf(p) === v},
  tech: {label: 'Loại nguồn', options: () => (P.technologies || []).map(t => [t.id, t.label]), test: (p, v) => (p.applicable_technologies || []).includes(v)},
  ticker: {label: 'Mã niêm yết', options: () => [...new Set(policies.flatMap(p => (p.exposed_companies || []).map(c => c.ticker)))].sort().map(t => [t, t]), test: (p, v) => (p.exposed_companies || []).some(c => c.ticker === v)},
  driver: {label: 'Tác động tài chính', options: () => Object.entries(DRIVER), test: (p, v) => (p.financial_drivers || []).includes(v)},
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
  dlg.innerHTML = `<div class="pp-dlg-head"><div><div class="pp-badges">${badge('st-' + p.policy_status, ST_VI[p.policy_status] || p.policy_status)}${badge('dir-' + (p.direction || 'Uncertain'), DIR[p.direction] || 'Chưa rõ')}${badge('lv-' + lv, LEVEL[lv])}${p.data_confidence === 'Unverified' ? badge('cf-Unverified', 'Chưa xác minh') : ''}</div>
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


/* ---------- cẩm nang: dữ liệu ---------- */
const HB = P.handbook || {}, TABS = P.tabs || [];
const LV = {H: ['Cao', 'lv-h'], M: ['Trung bình', 'lv-m'], L: ['Thấp', 'lv-l'], '': ['', '']};
const plain = s => String(s ?? '').replace(/\[\[|\]\]/g, '');
const tip = s => s ? ` title="${esc(plain(s))}"` : '';
const tickers = list => (list || []).map(c => `<span class="pp-tk"><span class="pp-chip">${esc(c.t)}</span>${c.n ? `<small>${rich(c.n)}</small>` : ''}</span>`).join('');
// Ô số: nhãn + số lớn; ghi chú nguồn rút một dòng, đủ chữ khi rê chuột.
const kpis = items => `<div class="pp-kpis pp-kpis-row">${(items || []).map(k => `<div class="pp-kpi${k.hl ? ' hl' : ''}"><span>${rich(k.label)}</span><b>${esc(k.value)}<small> ${esc(k.unit || '')}</small></b>${k.sub ? `<em${tip(k.sub)}>${rich(k.sub)}</em>` : ''}</div>`).join('')}</div>`;
const policyRow = p => `<li><button type="button" class="pp-more pp-open" data-id="${esc(p.policy_id)}">${esc(p.document_number || p.policy_name)}</button> ${badge('st-' + p.policy_status, ST_VI[p.policy_status] || p.policy_status)} ${esc(p.short_name || p.policy_name)}${p.effective_date ? ` · hiệu lực ${dmy(p.effective_date)}` : p.issue_date ? ` · ban hành ${dmy(p.issue_date)}` : ''}${p.data_confidence === 'Low' ? ' · <em>độ tin cậy thấp</em>' : ''} · ${link(p.primary_source_url, 'nguồn ↗')}</li>`;
// Dải bước gọn: chỉ tên bước, mô tả hiện khi rê chuột.
const strip = (steps, cls = '') => `<div class="pp-strip ${cls}">${steps.map((s, i) => `${i ? '<span class="pp-sarr" aria-hidden="true">›</span>' : ''}<span class="pp-sstep ${s.cls || ''}"${tip(s.d)}>${rich(s.t)}${s.d ? '<i class="pp-i" aria-hidden="true">ⓘ</i>' : ''}</span>`).join('')}</div>`;
const timeline = ms => `<div class="pp-tl">${ms.map(([dte, t]) => `<div class="pp-tl-i"><b>${esc(dte)}</b><span>${rich(t)}</span></div>`).join('')}</div>`;

/* ---------- hình chính của từng mục ---------- */
const VIS = {
  directions: h => `<div class="pp-dchips">${h.items.map(i => `<span class="pp-dc d-${i.dir}"${tip(i.text)}><b aria-hidden="true">${i.dir === 'up' ? '▲' : i.dir === 'down' ? '▼' : '►'}</b>${esc(i.src)}<small>${esc(i.label)}</small></span>`).join('')}</div>`,
  process: h => `<ol class="pp-steps">${h.steps.map((s, i) => `<li${tip(s.d + (s.stop ? ' · Điểm nghẽn: ' + s.stop : ''))}${s.stop ? ' class="stop"' : ''}><span class="pp-sn">${i + 1}</span><b>${rich(s.t)}</b></li>`).join('')}</ol><div class="pp-key"><span><i class="pp-dot"></i>bước đang có dự án bị nghẽn (rê chuột để xem)</span></div>`,
  flow: h => strip(h.steps),
  stages: () => '',
  pricemap: () => {
    const T = Object.fromEntries((P.price_types || []).map(t => [t.type.replace(/\[\[|\]\]/g, ''), t]));
    const tag = (k, label) => `<span class="pp-ptag"${tip(T[k]?.nature)}><span>${rich(label)}</span><small>${esc(T[k]?.short || '')}</small></span>`;
    return `<div class="pp-pmap">
      <div class="pp-pcol"><h5>Nhà máy bán</h5>${tag('FIT', '[[FIT]]')}${tag('Giá PPA thực tế', 'Giá [[PPA]]')}${tag('Giá thị trường (FMP)', 'Giá thị trường [[FMP]]')}</div>
      <span class="pp-arrow">→</span>
      <div class="pp-pcol"><h5>EVN mua</h5><span class="pp-pnode"><span>${rich('[[EPTC]] theo PPA')}</span></span><span class="pp-pnode"><span>${rich('Thị trường ([[NSMO]])')}</span></span>${tag('Giá mua điện bình quân EVN', 'Giá mua bình quân')}</div>
      <span class="pp-arrow">→</span>
      <div class="pp-pcol"><h5>Lưới</h5><span class="pp-pnode">Truyền tải, phân phối</span></div>
      <span class="pp-arrow">→</span>
      <div class="pp-pcol"><h5>Khách hàng</h5>${tag('Giá bán lẻ bình quân', 'Giá bán lẻ bình quân')}</div></div>`;
  },
  ppa_cards: h => {
    const rows = h.cards.map(c => { const m = 100 - (c.contract ?? 100);
      return `<div class="pp-pr"><div class="pp-pr-t"><b>${esc(c.title)}</b><small>${esc(c.tickers)}</small></div>
        <div class="pp-pr-bar"${tip(`${c.qty} · Phần giá thị trường: ${c.market}`)}><i style="width:${100 - m}%"><span>${esc(c.contract_s || '')}</span></i>${m ? `<i class="mk" style="width:${m}%"><span>${m}%</span></i>` : ''}</div>
        <span class="pp-pr-c"${tip(c.pass)}>${esc(c.pass_s || '')}</span><span class="pp-pr-r"${tip(c.risk)}>${esc(c.risk_s || '')}</span></div>`; }).join('');
    return `<div class="pp-ppa"><div class="pp-pr pp-pr-h"><span>Loại nhà máy</span><span>Sản lượng: giá hợp đồng <i class="k1"></i> · giá thị trường <i class="k2"></i></span><span>Nhiên liệu chuyển vào giá</span><span>Rủi ro chính</span></div>${rows}</div>`;
  },
  dppa: h => `<div class="pp-two">${h.models.map(m => `<div class="pp-mini"><h4${tip('Rủi ro: ' + m.risk)}>${esc(m.title)} <i class="pp-i" aria-hidden="true">ⓘ</i></h4>${m.lanes.map(l => `<div class="pp-lane"><span class="pp-lane-k">${esc(l.k)}</span>${l.steps.map(s => `<span class="pp-lane-s">${rich(s)}</span>`).join('<span class="pp-arrow">→</span>')}</div>`).join('')}</div>`).join('')}</div>`,
  ladder: h => {
    const S = h.scale || [], lo = S[0]?.from ?? 0, hi = S.at(-1)?.to ?? 1, x = v => (v - lo) / (hi - lo) * 100;
    return `<div class="pp-scale"><div class="pp-sc-cap">Giá bán lẻ bình quân tính ra so với hiện hành → ai quyết điều chỉnh</div><div class="pp-sc-bar">${S.map(s => `<div class="pp-sc-seg" style="left:${x(s.from)}%;width:${x(s.to) - x(s.from)}%;background:${s.c}"${tip(s.label + ': ' + s.who)}><b>${esc(s.who)}</b></div>`).join('')}</div>
      <div class="pp-sc-ax">${[...new Set(S.flatMap(s => [s.from, s.to]))].slice(1, -1).map(v => `<span style="left:${x(v)}%">${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}%</span>`).join('')}</div></div>${h.after ? strip(h.after) : ''}`;
  },
  funnel: h => `<div class="pp-funnel">${h.levels.map((l, i) => `${l.cut ? `<div class="pp-cuts">${l.cut.map(c => `<span>− ${esc(c)}</span>`).join('')}</div>` : ''}<div class="pp-fl" style="width:${100 - i * 22}%"${tip(l.d)}><b>${rich(l.t)}</b></div>`).join('')}</div>`,
  example: h => {
    const B = h.bars || [], max = Math.max(...B.map(b => b.parts.reduce((a, p) => a + p[1], 0)));
    return `<div class="pp-exb">${B.map(b => { const tot = b.parts.reduce((a, p) => a + p[1], 0);
      return `<div class="pp-exr"><span class="pp-exl">${esc(b.label)}</span><div class="pp-exbar" style="width:${tot / max * 100}%">${b.parts.map((p, i) => `<i class="p${i}" style="flex:${p[1]}"${tip(p[0] + ' = ' + nf(p[1], 1) + ' triệu đồng')}>${nf(p[1], 0)}</i>`).join('')}</div><b>${nf(tot, 0)} tr · ${esc(b.avg)}</b></div>`; }).join('')}
      <div class="pp-key"><span><i class="k1"></i>Qc × giá hợp đồng</span><span><i class="k2"></i>phần còn lại × FMP</span><span>triệu đồng · ${esc(h.assume || '')}</span></div></div>`;
  },
  settle: h => `<div class="pp-settle">${h.rows.map(r => `<div class="pp-se"><b>${rich(r.t)}</b><span class="pp-se-f">${rich(r.rule)}</span><span class="pp-arrow" aria-hidden="true">→</span><span class="pp-se-c">${rich(r.cash)}</span></div>`).join('')}</div>`,
  techmatrix: h => `<div class="tablewrap"><table class="pp-heat" style="min-width:640px"><thead><tr><th></th>${h.axes.map(a => `<th>${esc(a)}</th>`).join('')}</tr></thead><tbody>${h.rows.map(r => `<tr><th>${esc(r.t)}</th>${r.v.map(([l, t]) => l ? `<td class="${LV[l][1]}"${tip(t)}>${LV[l][0]}</td>` : `<td class="lv-n">${rich(t)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="pp-key"><span><i class="lv-h"></i>Cao</span><span><i class="lv-m"></i>Trung bình</span><span><i class="lv-l"></i>Thấp</span><span>đánh giá định tính · rê chuột để xem lý do</span></div>`,
  taxcards: h => `<div class="pp-taxs">${h.cards.map(c => `<div class="pp-tax"${tip(c.items.join(' · '))}><small>${esc(c.t)}</small><b>${esc(c.big || '')}</b><span>${esc(c.big_s || '')}</span><em>${esc(c.tag)}</em></div>`).join('')}</div>`,
  channels: h => `<div class="pp-chs">${h.channels.map(c => `<div class="pp-ch"><span class="pp-ch-k">${esc(c.title)}</span>${strip(c.steps)}</div>`).join('')}</div>`,
  carbon: () => `${strip([{t: 'Phân bổ hạn ngạch', d: 'theo cường độ phát thải (QĐ 263, QĐ 699)'}, {t: 'Kiểm kê phát thải thực'}, {t: 'So với hạn ngạch', cls: 'hl'}, {t: 'Nộp trả', d: 'trước 31/12 năm kế tiếp giai đoạn'}])}
    <div class="pp-two pp-cb"><div class="pp-cbx short"><b>Thiếu hạn ngạch</b><span>mua trên sàn</span><span>tín chỉ ≤30%</span><span>vay kỳ sau ≤15%</span><span>không nộp đủ: phạt</span></div><div class="pp-cbx surplus"><b>Dư hạn ngạch</b><span>bán trên sàn</span><span>chuyển kỳ sau (đến 2030)</span></div></div>`
};
// Bản đầy đủ (chữ) của sơ đồ, chỉ nằm trong phần gập.
const FULL = {
  directions: h => `<div class="pp-dirs">${h.items.map(i => `<div class="pp-dir d-${i.dir}"><span class="pp-dir-ic" aria-hidden="true">${i.dir === 'up' ? '▲' : i.dir === 'down' ? '▼' : '►'}</span><div><b>${esc(i.src)}</b> <em>${esc(i.label)}</em><small>${rich(i.text)}</small></div></div>`).join('')}</div>`,
  process: h => `<ol class="pp-proc">${h.steps.map((s, i) => `<li><span class="pp-proc-n">${i + 1}</span><div><b>${rich(s.t)}</b><small>${rich(s.d)}</small>${s.stop ? `<em class="pp-stop">Điểm nghẽn: ${rich(s.stop)}</em>` : ''}</div></li>`).join('')}</ol>`,
  ppa_cards: h => table(['Loại nhà máy', ...h.fields.map(f => f[1])], h.cards.map(c => ({cells: [{html: `<b>${esc(c.title)}</b><br><small>${esc(c.tickers)}</small>`}, ...h.fields.map(([k]) => c[k] || '—')]})), {min: 980}),
  ladder: h => table(['Mức giá tính ra so với hiện hành', 'Ai quyết'], h.rows.map(r => ({cells: [r.cond, r.act]})), {min: 420}),
  example: h => `<div class="tablewrap"><table class="pp-table pp-example" style="min-width:420px"><tbody>${h.rows.map((r, i) => `<tr${i >= h.rows.length - 2 ? ' class="pp-ex-sum"' : ''}><td>${rich(r[0])}</td><td class="num"><b>${rich(r[1])}</b></td><td>${rich(r[2])}</td></tr>`).join('')}</tbody></table></div>`,
  taxcards: h => `<div class="pp-cards">${h.cards.map(c => `<div class="pp-mini"><h4>${esc(c.t)}</h4><div class="pp-cardtick">${esc(c.tag)}</div><ul>${c.items.map(i => `<li>${rich(i)}</li>`).join('')}</ul></div>`).join('')}</div>`,
  techmatrix: h => table(['', ...h.axes], h.rows.map(r => ({cells: [{html: `<b>${esc(r.t)}</b>`}, ...r.v.map(([l, t]) => ({html: `${l ? LV[l][0] + ': ' : ''}${rich(t || '')}`}))]})), {min: 760}),
  dppa: h => `<ul>${h.models.map(m => `<li><b>${esc(m.title)}</b> · rủi ro: ${rich(m.risk)}</li>`).join('')}</ul>`
};

/* ---------- số liệu minh họa ---------- */
const DATA = {
  kpis: (host, m) => { host.innerHTML = kpis(m.data.items); },
  plan: host => {
    const Q = P.plan || {};
    host.innerHTML = `<div class="viz-block"><div class="chart-title">Công suất mục tiêu 2030 so với cuối 2025</div><div class="chart-sub">MW · dải thấp–cao theo QĐ 768 · vạch đen: thực tế cuối 2025</div>${ranges((Q.targets || []).map(t => ({label: t.source, low: t.low, high: t.high, year: t.year, color: t.color, actual: t.actual})), {aria: 'Công suất mục tiêu QĐ 768 theo nguồn'})}<div class="pp-legend">${(Q.legend || []).map(l => `<span><i style="background:${l.color}"></i>${esc(l.label)}</span>`).join('')}</div></div>`;
  },
  pipeline: host => {
    const PL = P.pipeline || [], ST = P.pipeline_status || [], tl = [...new Set(PL.map(p => p.tech_label))], pal = ['#1D2678', '#2938A8', '#59C5C8', '#861C52', '#8997D6', '#c29100'];
    host.innerHTML = `<div class="viz-block"><div class="chart-title">MW theo giai đoạn triển khai</div><div class="chart-sub">MW · ${PL.length} dự án lớn đã xác minh</div><div id="chPolicyPipeline"></div></div>`;
    mountChart(document.getElementById('chPolicyPipeline'), {categories: ST.map(s => s.label), series: tl.map((t, i) => ({name: t, color: pal[i % pal.length], values: ST.map(s => PL.filter(p => p.status === s.id && p.tech_label === t).reduce((a, p) => a + (+p.mw || 0), 0) || null)})), unit: 'MW', digits: 0, stackable: true, key: 'pp-14-pipe', aria: 'MW dự án theo giai đoạn'}, 'stack');
  },
  ceilings: host => {
    const F = P.price_frameworks || [], fams = [...new Set(F.map(f => f.family))];
    const REG = {'Bắc Bộ': 'Bắc', 'Nam Trung Bộ': 'Trung', 'Nam Bộ': 'Nam'}, rg = f => REG[f.region] || f.region;
    host.innerHTML = `<div class="pp-controls"><label>Công nghệ <select data-k="fam">${fams.map(f => `<option>${esc(f)}</option>`).join('')}</select></label><label>Vùng <select data-k="reg"></select></label><label>Loại dự án <select data-k="kind"></select></label><label>Năm <select data-k="year"></select></label></div>
      <div class="viz-block"><div class="chart-title">Trần khung giá phát điện theo năm</div><div class="chart-sub">đ/kWh, chưa VAT · trần đàm phán, không phải giá PPA</div><div id="chPolicyCeilingYoY"></div><div class="pp-dchips pp-yoy"></div></div>`;
    const [fam, reg, kind, year] = ['fam', 'reg', 'kind', 'year'].map(k => host.querySelector(`[data-k=${k}]`)), out = host.querySelector('.pp-yoy');
    fam.value = fams.includes(store.get('pp-22-fam')) ? store.get('pp-22-fam') : 'Điện gió';
    const opts = () => {
      const rows = F.filter(f => f.family === fam.value), regs = [...new Set(rows.map(rg))], main = ['Bắc', 'Trung', 'Nam'].filter(r => regs.includes(r));
      reg.innerHTML = (main.length ? main : regs).map(r => `<option>${esc(r)}</option>`).join(''); reg.disabled = reg.options.length < 2;
      kind.innerHTML = '<option value="">Tất cả</option>' + [...new Set(rows.map(r => r.label))].map(l => `<option>${esc(l)}</option>`).join('');
      year.innerHTML = '<option value="">So sánh các năm</option>' + [...new Set(rows.map(r => r.year))].sort().map(y => `<option>${y}</option>`).join('');
    };
    const draw = () => {
      let rows = F.filter(f => f.family === fam.value && (rg(f) === reg.value || f.region === 'Toàn quốc')).map(f => REG[f.region] ? {...f, label: f.label + ' (vùng biển ' + f.region + ')', base: f.label} : f.region === 'Toàn quốc' && reg.value !== 'Toàn quốc' ? {...f, label: f.label + ' (cả nước)', base: f.label} : {...f, base: f.label});
      if (kind.value) rows = rows.filter(r => r.base === kind.value);
      if (year.value) rows = rows.filter(r => String(r.year) === year.value);
      const kinds = [...new Set(rows.map(r => r.label))], years = [...new Set(rows.map(r => r.year))].sort(), pal = ['#8997D6', '#2938A8'];
      const h = document.getElementById('chPolicyCeilingYoY'); h.innerHTML = '';
      if (!rows.length) { h.innerHTML = '<div class="pp-empty">Không có khung giá khớp lựa chọn.</div>'; out.innerHTML = ''; return; }
      mountChart(h, {categories: kinds, series: years.map((y, i) => ({name: String(y), color: years.length > 1 ? pal[i % 2] : '#2938A8', values: kinds.map(k => rows.find(r => r.label === k && r.year === y)?.ceiling ?? null)})), unit: 'đ/kWh', digits: 0, labels: true, key: 'pp-22-' + fam.value + reg.value + kind.value + year.value, aria: 'Trần khung giá phát điện'}, 'bar');
      // Thay đổi so với khung năm trước: một chip mỗi loại hình, văn bản khi rê chuột.
      out.innerHTML = year.value ? '' : kinds.map(k => {
        const a = rows.filter(r => r.label === k).sort((x, y) => x.year - y.year), prev = a.length > 1 ? a.at(-2) : null, cur = a.at(-1);
        if (!prev) return '';
        const pc = (cur.ceiling - prev.ceiling) / prev.ceiling * 100;
        return `<span class="pp-dc ${pc >= 0 ? 'd-up' : 'd-down'}"${tip(`${nf(prev.ceiling, 2)} (${prev.year}) → ${nf(cur.ceiling, 2)} (${cur.year}) đ/kWh · ${cur.decision}`)}><b aria-hidden="true">${pc >= 0 ? '▲' : '▼'}</b>${esc(k)}<small>${sg(pc, 1)}%</small></span>`;
      }).join('');
      store.set('pp-22-fam', fam.value);
    };
    fam.addEventListener('change', () => { opts(); draw(); });
    [reg, kind, year].forEach(s => s.addEventListener('change', draw));
    opts(); draw();
  },
  transitional: host => {
    const T = P.transitional || {};
    host.innerHTML = `<div class="viz-block"><div class="chart-title">Dự án tái tạo chuyển tiếp theo tình trạng giá</div><div class="chart-sub">MW · ${esc(T.as_of_label || '')} · các nhóm chồng lấn</div>${hbars((T.rows || []).map(r => ({label: `${r.label} (${r.projects} dự án)`, value: r.mw, text: r.mw_text || nf(r.mw) + ' MW', color: r.color})), {labelWidth: 300, unit: 'MW', aria: 'Dự án chuyển tiếp theo tình trạng giá'})}</div>`;
  },
  retail: host => {
    const R = P.retail_tariff || [];
    host.innerHTML = `<div class="viz-block"><div class="chart-title">Giá bán lẻ bình quân qua các lần điều chỉnh</div><div class="chart-sub">đ/kWh, chưa VAT</div><div id="chPolicyRetail"></div></div>`;
    mountChart(document.getElementById('chPolicyRetail'), {categories: R.map(r => dmy(r.date)), series: [{name: 'Giá bán lẻ bình quân', color: '#2938A8', values: R.map(r => r.price)}], unit: 'đ/kWh', digits: 0, labels: true, zeroBase: false, key: 'pp-25-retail', aria: 'Giá bán lẻ điện bình quân'}, 'line');
  },
  qcmix: host => {
    const mix = (P.market || {}).mix || [], W = 900, lw = 190, rh = 40, top = 22, H2 = top + mix.length * rh + 8, x = v => lw + (W - lw - 20) * v / 100;
    const seg = (x0, w, fill, ink, text) => `<rect x="${x0.toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="22" rx="4" fill="${fill}"/>` + (text ? `<text x="${(x0 + 8).toFixed(1)}" y="15" class="vl" fill="${ink}">${esc(text)}</text>` : '');
    const rows = mix.map((r, i) => { const mt = `${r.market_text || (100 - r.contract) + '%'} giá thị trường`, small = x(100) - x(r.contract) < 90;
      return `<g transform="translate(0 ${top + i * rh})"><text x="${lw - 10}" y="15" text-anchor="end" class="lb" style="font-weight:600">${esc(r.label)}</text>${seg(x(0), x(r.contract) - x(0) - 1, '#1D2678', '#fff', `${r.contract_text || r.contract + '%'} giá hợp đồng${small ? ' · ' + mt : ''}`)}${seg(x(r.contract) + 1, x(100) - x(r.contract) - 1, r.market_fill || '#F2B8A2', '#7a2e1c', small ? '' : mt)}<title>${esc(r.label)}: ${esc(r.note || '')}</title></g>`; }).join('');
    host.innerHTML = `<div class="viz-block"><div class="chart-title">Mỗi kWh được trả theo giá nào?</div><div class="chart-sub">${rich('% sản lượng năm 2026 · vạch: sàn [[Qc]] 60%')}</div><svg class="pp-svg" viewBox="0 0 ${W} ${H2}" role="img" aria-label="Tỷ lệ sản lượng theo giá hợp đồng và giá thị trường"><line x1="${x(60)}" x2="${x(60)}" y1="${top - 8}" y2="${H2 - 4}" stroke="#861C52" stroke-dasharray="4 3"/>${rows}</svg></div>`;
  },
  quota: host => {
    const C2 = P.carbon || {};
    host.innerHTML = `<div class="viz-block"><div class="chart-title">${esc(C2.intensity_title || '')}</div><div class="chart-sub">${esc(C2.intensity_sub || '')}</div>${hbars((C2.intensity || []).map(r => ({label: r.label, value: r.value, text: r.text, color: r.color})), {labelWidth: 220, unit: C2.intensity_unit || '', aria: 'Hạn ngạch phát thải theo nhà máy'})}</div>`;
  }
};
/* ---------- nội dung tra cứu thêm theo mục (trong phần gập) ---------- */
const REF = {
  pipeline: () => { const PL = [...(P.pipeline || [])].sort((a, b) => (a.cod_actual || a.cod_plan || '9').localeCompare(b.cod_actual || b.cod_plan || '9')), ST = P.pipeline_status || [];
    return `<div class="viz-block"><div class="chart-title">Tiến độ từng dự án: khởi công → COD</div><div class="chart-sub">◇ COD kế hoạch · ◆ COD thực tế · đường đỏ: ${dmy(P.as_of)}</div>${gantt(PL.map(p => ({name: p.name, mw: p.mw_label || nf(p.mw), start: p.start, end: p.cod_plan, actual: p.cod_actual, status: p.status, color: (P.tech_colors || {})[p.tech]})), {aria: 'Tiến độ dự án'})}</div>`
      + table(['Dự án', 'MW', 'Công nghệ', 'Chủ đầu tư', 'Giai đoạn', 'COD', 'Nguồn'], PL.map(p => ({cells: [p.name, {html: esc(p.mw_label || nf(p.mw)), num: 1}, p.tech_label, p.owner, (ST.find(s => s.id === p.status) || {}).label || p.status, p.cod_actual ? 'thực tế ' + p.cod_actual : p.cod_plan || '—', {html: link(p.source_url, p.source_label || 'nguồn')}]})), {min: 820}); },
  ceilings: () => { const F = P.price_frameworks || [];
    const all = [...new Set(F.map(f => f.family + '|' + f.label))].map(key => { const [fa, lb] = key.split('|'), a = F.filter(f => f.family === fa && f.label === lb), y = Math.max(...a.map(r => r.year)), cur = a.filter(r => r.year === y);
      return {cells: [fa, lb, String(y), cur.map(r => (cur.length > 1 ? r.region + ' ' : '') + nf(r.ceiling, 2)).join(' · '), cur[0].decision + (cur[0].decision_date ? ' (' + dmy(cur[0].decision_date) + ')' : '')]}; });
    return `<p><b>Khung mới nhất từng loại hình</b> (đ/kWh, chưa VAT)</p>${table(['Nhóm', 'Loại hình', 'Năm', 'Trần theo vùng', 'Văn bản'], all, {min: 620})}<p><b>Chưa có khung năm hiện tại:</b></p><ul>${(P.pending_frameworks || []).map(x => `<li>${rich(x)}</li>`).join('')}</ul>`; },
  price_types: () => table(['Loại giá', 'Bản chất', 'Đơn vị · kỳ', 'Mức gần nhất', 'Áp dụng cho'], (P.price_types || []).map(t => ({cells: [{html: `<b>${rich(t.type)}</b>`}, t.nature, t.unit, {html: rich(t.latest || '—')}, t.applies]})), {min: 720}),
  dppa: () => { const D = P.dppa || {};
    return `<p><b>PPA truyền thống so với DPPA</b></p>${table(['Khía cạnh', 'PPA với EVN/EPTC', 'DPPA qua lưới quốc gia'], (D.compare || []).map(r => ({cells: [{html: `<b>${rich(r.aspect)}</b>`}, r.ppa, r.dppa]})), {min: 620})}<p><b>Thay đổi theo văn bản</b></p>${table(['Nội dung', 'Trước', 'Sau', 'Văn bản'], (D.changes || []).map(r => ({cells: [r.item, r.before, {html: `<b>${rich(r.after)}</b>`}, r.doc]})), {min: 620})}`; },
  plan: () => { const Q = P.plan || {};
    return `<p><b>Chỉ tiêu 2030</b></p>${table(['Chỉ tiêu', 'Mục tiêu'], (Q.headline || []).map(r => ({cells: [r[0], r[1]]})), {min: 420})}<p><b>Đợt điều chỉnh lần 2 (chưa phê duyệt)</b></p>${table(['Chỉ tiêu', 'QĐ 768', 'Đề xuất', 'Trạng thái'], (Q.revisions || []).map(r => ({cells: [r.item, r.current, r.proposal, r.status]})), {min: 620})}`; },
  market: () => table(['Thành phần', 'Cơ chế', 'Mức đã xác minh'], ((P.market || {}).components || []).map(c => ({cells: [{html: `<b>${rich(c.item)}</b>`}, c.rule, {html: rich(c.value || '—')}]})), {min: 520}),
  taxes: () => table(['Thuế / phí', 'Phân khúc', 'Trước', 'Hiện hành', 'Loại chi phí'], (P.taxes || []).map(t => ({cells: [{html: `<b>${rich(t.item)}</b>`}, t.segment, {html: rich(t.previous)}, {html: rich(t.current)}, t.cost_type]})), {min: 760}),
  trade: () => table(['Chỉ tiêu / văn bản', 'Nội dung', 'Lưu ý'], ((P.trade || {}).facts || []).map(f => ({cells: [{html: `<b>${rich(f.item)}</b>`}, {html: rich(f.value)}, f.caveat || '—']})), {min: 620}),
  carbon: () => table(['Nội dung', 'Quy định', 'Kênh tới doanh nghiệp'], ((P.carbon || {}).facts || []).map(f => ({cells: [{html: `<b>${rich(f.item)}</b>`}, {html: rich(f.value)}, f.channel || '—']})), {min: 620}),
  grid: () => table(['Chỉ tiêu / văn bản', 'Nội dung', 'Kênh tới doanh nghiệp'], ((P.grid || {}).facts || []).map(f => ({cells: [{html: `<b>${rich(f.item)}</b>`}, {html: rich(f.value)}, {html: rich(f.channel || '—')}]})), {min: 620})
};
const REF_BY_MODULE = {'1.1': 'plan', '2.1': 'price_types', '2.2': 'ceilings', '2.4': 'dppa'};
// Thứ tự trong khung hình: số liệu (chart) trước sơ đồ ở các mục mà chart là câu trả lời chính.
const DATA_FIRST = new Set(['1.1', '2.2']);

/* ---------- mục: câu hỏi · kết luận · hình · doanh nghiệp · phần gập ---------- */
function renderModule(m) {
  const host = document.getElementById('pp-m-' + m.id.replace('.', '-')); if (!host) return;
  const af = m.affected || {}, cos = ['direct', 'indirect', 'potential'].flatMap(k => (af[k] || []).map(c => ({...c, k})));
  const drafts = (m.drafts || []).map(id => byId[id]).filter(Boolean), pols = (m.policies || []).map(id => byId[id]).filter(Boolean), type = m.how?.type;
  const how = VIS[type] ? VIS[type](m.how) : '', full = FULL[type] ? FULL[type](m.how) : '';
  const vis = `${how ? `<div class="pp-howv">${how}</div>` : ''}`, data = m.data ? '<div class="pp-data"></div>' : '';
  host.innerHTML = `<header class="pp-mh"><span class="pp-code">${esc(m.id)}</span><h3 class="pp-title">${rich(m.title)}</h3></header>
    <p class="pp-concl">${rich(m.conclusion)}</p>
    <div class="pp-vis">${DATA_FIRST.has(m.id) ? data + vis : vis + data}${m.milestones ? timeline(m.milestones) : ''}</div>
    <div class="pp-foot">${(m.implication?.channels || []).map(c => `<span class="pp-chan">${esc(c)}</span>`).join('')}${cos.length ? `<span class="pp-sep"></span>${cos.map(c => `<span class="pp-chip t-${c.k}" title="${esc(ETYPE[c.k])}${c.n ? ': ' + esc(plain(c.n)) : ''}">${esc(c.t)}</span>`).join('')}` : ''}${drafts.map(p => `<button type="button" class="pp-draftb pp-open" data-id="${esc(p.policy_id)}"${tip(p.radar_change || p.regulatory_change)}>Dự thảo: ${esc(p.short_name || p.policy_name)}</button>`).join('')}</div>
    <details class="research-fold pp-detail"><summary>Giải thích & căn cứ</summary><div class="research-detail">
      <p class="pp-x">${rich(m.quick)}</p>${m.pitfall ? `<p class="pp-pit"><b>Điều dễ nhầm:</b> ${rich(m.pitfall)}</p>` : ''}
      ${m.implication?.text ? `<p class="pp-x"><b>Hàm ý kinh tế:</b> ${rich(m.implication.text)}</p>` : ''}
      ${full ? `<div class="pp-full">${full}</div>` : ''}
      ${cos.some(c => c.n) ? `<div class="pp-who">${['direct', 'indirect', 'potential'].filter(k => (af[k] || []).length).map(k => `<div class="pp-tier t-${k}"><span class="pp-tier-l">${ETYPE[k]}</span><div>${tickers(af[k])}</div></div>`).join('')}${af.note ? `<p class="pp-pnote">${rich(af.note)}</p>` : ''}</div>` : ''}
      <dl class="pp-kv">${(m.framework || []).map(([k, v]) => `<dt>${rich(k)}</dt><dd>${rich(v)}</dd>`).join('')}</dl>
      ${drafts.length ? `<div class="pp-drafts"><b>Đang được xem xét, chưa áp dụng</b>${drafts.map(p => `<p><button type="button" class="pp-more pp-open" data-id="${esc(p.policy_id)}">${esc(p.short_name || p.policy_name)}</button>: ${rich(p.radar_change || p.regulatory_change)}</p>`).join('')}</div>` : ''}
      ${m.gap ? `<div class="pp-gap data-gap"><b>Thiếu dữ liệu:</b> ${rich(m.gap)}</div>` : ''}
      ${REF_BY_MODULE[m.id] ? `<div class="pp-ref">${REF[REF_BY_MODULE[m.id]]()}</div>` : ''}${pols.length ? `<p><b>Văn bản</b> (bấm để mở phân tích chi tiết):</p><ul class="pp-pols">${pols.map(policyRow).join('')}</ul>` : ''}${srcLine(m.sources, P.as_of)}</div></details>`;
  // Chart không nằm trong mục thu gọn: khối hình (vd. tiến độ dự án) đưa vào khung hình; bảng vẫn ở trong.
  host.querySelectorAll('.pp-detail .viz-block').forEach(v => { if (v.querySelector('svg, canvas')) host.querySelector('.pp-vis').append(v); });
  if (m.data && DATA[m.data.type]) { try { DATA[m.data.type](host.querySelector('.pp-data'), m); } catch (e) { console.error('power-policy data', m.id, e); } }
}

/* ---------- tab, mục lục, trạng thái URL ---------- */
const panes = [...root.querySelectorAll('.pp-tabpane')];
const tabbar = document.getElementById('pp-tabs');
function setParam(tab, mod) {
  try { const u = new URL(location.href); u.searchParams.set('policy', tab); if (mod) u.searchParams.set('m', mod); else u.searchParams.delete('m'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch { /* file:// */ }
}
function showTab(id, opts = {}) {
  const i = panes.findIndex(p => p.dataset.pane === id); if (i < 0) return;
  panes.forEach((p, k) => { p.hidden = k !== i; });
  [...tabbar.querySelectorAll('button')].forEach(b => { const on = b.dataset.go === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  store.set('pp-tab', id);
  if (!opts.silent) setParam(id, opts.mod);
  if (opts.mod) { const t = document.getElementById('pp-m-' + opts.mod.replace('.', '-')); if (t) requestAnimationFrame(() => t.scrollIntoView({block: 'start'})); }
  else if (opts.scroll) tabbar.scrollIntoView({block: 'start'});
  window.dispatchEvent(new Event('resize'));
}
function buildNav() {
  tabbar.setAttribute('role', 'tablist'); tabbar.setAttribute('aria-label', 'Nhóm cơ chế');
  // 25/11/2026: chỉ còn 2 tab chính (bỏ Cẩm nang cơ chế và Tra cứu theo yêu cầu người dùng).
  TABS.map(t => [t.id, `${t.n}. ${t.label}`]).forEach(([id, label]) => {
    const b = el('button', '', esc(label)); b.type = 'button'; b.dataset.go = id; b.setAttribute('role', 'tab'); b.id = 'pp-tabbtn-' + id;
    const pane = panes.find(p => p.dataset.pane === id); if (pane) { b.setAttribute('aria-controls', pane.id); pane.setAttribute('role', 'tabpanel'); pane.setAttribute('aria-labelledby', b.id); }
    tabbar.append(b);
  });
  tabbar.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; const bs = [...tabbar.children], i = bs.indexOf(document.activeElement); if (i < 0) return; e.preventDefault(); const n = bs[(i + d + bs.length) % bs.length]; n.click(); n.focus(); });
  TABS.forEach(t => {
    const pane = panes.find(p => p.dataset.pane === t.id), toc = pane?.querySelector('.pp-toc'); if (!toc) return;
    toc.innerHTML = `<ol>${t.modules.map(id => `<li><a href="#pp-m-${id.replace('.', '-')}" data-mod="${id}"><span>${id}</span>${esc(HB[id]?.short || '')}</a></li>`).join('')}</ol>`;
    toc.addEventListener('click', e => { const a = e.target.closest('a[data-mod]'); if (!a) return; e.preventDefault(); document.getElementById('pp-m-' + a.dataset.mod.replace('.', '-'))?.scrollIntoView({block: 'start', behavior: 'smooth'}); setParam(t.id, a.dataset.mod); });
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const id = e.target.dataset.mod, toc = e.target.closest('.pp-tabpane')?.querySelector('.pp-toc'); toc?.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.mod === id)); }), {rootMargin: '-35% 0px -55% 0px'});
    root.querySelectorAll('.pp-module[data-mod]').forEach(m => io.observe(m));
  }
}

/* ---------- chạy ---------- */
root.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { showTab(g.dataset.go, {scroll: true}); return; }
  if (e.target.closest('a')) return;
  const t = e.target.closest('.pp-row,.pp-open'); if (t) openPolicy(t.dataset.id);
});
root.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.pp-row')) { e.preventDefault(); openPolicy(e.target.dataset.id); } });
Object.values(HB).forEach(m => { try { renderModule(m); } catch (e) { console.error('power-policy', m.id, e); } });
buildNav();
const q = new URLSearchParams(location.search), qt = q.get('policy'), qm = q.get('m');
const start = panes.some(p => p.dataset.pane === qt) ? qt : qm ? (TABS.find(t => t.modules.includes(qm)) || {}).id : store.get('pp-tab');
showTab(panes.some(p => p.dataset.pane === start) ? start : TABS[0]?.id, {silent: true});
// Link sâu ?m=2.4: cuộn sau khi các script chung đã chọn tab lớn và đưa trang về đầu.
if (qm && HB[qm]) { const go = () => setTimeout(() => { if (document.querySelector('.majorpane.active')?.dataset.tab === 'mt4') document.getElementById('pp-m-' + qm.replace('.', '-'))?.scrollIntoView({block: 'start'}); }, 400); if (document.readyState === 'complete') go(); else addEventListener('load', go, {once: true}); }
})();
