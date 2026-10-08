/* Shared chart-type switcher: Cột / Cột chồng / Thanh / Đường / Miền.
   The page's own renderer draws the chart's native type; other types are drawn here from
   the same values. Units, periods, null gaps and series colors never change. Overlay lines
   (7-day mean, consumption next to production bars) stay lines in bar views. "Cột chồng"
   is offered only for series the page marks additive (stackable). Choice is per chart,
   remembered in this browser only. Load synchronously before the page's chart script. */
(() => {
  'use strict';
  const STORE = 'fs_sector_chart_types_v1';
  const TYPES = [['bar', 'Cột'], ['stack', 'Cột chồng'], ['hbar', 'Thanh'], ['line', 'Đường'], ['area', 'Miền']];
  const MAX_HBAR = 40;
  const registry = new Map();
  let seq = 0;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const num = v => typeof v === 'number' && Number.isFinite(v);
  function readStore() { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { return {}; } }
  function saved(key) { return readStore()[location.pathname + '#' + key]; }
  function save(key, type) { try { const s = readStore(); s[location.pathname + '#' + key] = type; localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { /* view still switches */ } }

  function niceStep(span, ticks) {
    const raw = (span || 1) / ticks, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }
  function domain(lo, hi, zero) {
    if (zero) { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    if (lo === hi) { hi = lo + 1; if (!zero) lo -= 1; }
    const pad = zero ? 0 : (hi - lo) * 0.12;
    const step = niceStep(hi - lo + 2 * pad, 4);
    let min = Math.floor((lo - pad) / step) * step, max = Math.ceil((hi + (zero ? (hi - lo) * 0.08 : pad)) / step) * step;
    if (!zero && lo >= 0 && min < 0) min = 0;
    if (zero && lo >= 0) min = 0;
    return {min, max, step};
  }
  function isTime(cats) { return cats.length > 1 && cats.every(c => /\d/.test(String(c))); }
  function native(model) {
    if (model.native) return model.native;
    const main = model.series.filter(s => !s.overlay);
    return main.length && main.every(s => s.kind === 'line') ? 'line' : 'bar';
  }
  function reason(model, type) {
    const main = model.series.filter(s => !s.overlay);
    if (type === 'stack' && main.length < 2) return 'Chỉ có một chuỗi cột';
    if (type === 'stack' && !model.stackable) return 'Các chuỗi không cộng được với nhau';
    if ((type === 'line' || type === 'area') && !model.time) return 'Không phải chuỗi thời gian';
    if (type === 'hbar' && model.categories.length > MAX_HBAR) return 'Quá nhiều kỳ để vẽ thanh ngang';
    return '';
  }
  function fmtOf(model) {
    if (model.fmt) return model.fmt;
    const d = model.digits ?? 0;
    return v => Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
  }

  /* ---------- universal SVG renderer ---------- */
  const UNIFORM = true;
  function render(model, type) {
    const cats = model.categories, n = cats.length, f = fmtOf(model);
    const main = model.series.filter(s => !s.overlay), over = model.series.filter(s => s.overlay);
    const label = i => String(model.tickLabels?.[i] ?? cats[i]);
    if (type === 'hbar') return renderH(model, main, over, f, label);
    // Uniform plot height so charts in one row/tab look the same size.
    const W = 640, H = UNIFORM ? 260 : Math.max(240, model.height || 250), L = 52, R = 16, T = 16, B = 30;
    const pw = W - L - R, ph = H - T - B, band = pw / Math.max(n, 1);
    const stacked = type === 'stack' || (type === 'area' && model.stackable && main.length > 1 &&
      main.every(s => s.values.every(v => v == null || v >= 0)) && main.every(s => s.values.every(num)));
    const vals = [];
    if (stacked) cats.forEach((_, i) => {
      let up = 0, down = 0; main.forEach(s => { const v = s.values[i]; if (num(v)) { if (v >= 0) up += v; else down += v; } });
      vals.push(up, down);
    });
    else main.forEach(s => s.values.forEach(v => num(v) && vals.push(v)));
    over.forEach(s => s.values.forEach(v => num(v) && vals.push(v)));
    if (!vals.length) return '<div class="gap-empty">Không có dữ liệu hợp lệ.</div>';
    const zero = type === 'bar' || type === 'stack' || stacked || model.zeroBase !== false;
    const d = domain(Math.min(...vals), Math.max(...vals), zero);
    const Y = v => T + ph * (d.max - v) / (d.max - d.min);
    const X = i => L + band * (i + 0.5);
    const base = Y(Math.max(d.min, Math.min(0, d.max)));
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" class="chartsvg ct-svg" role="img" aria-label="${esc(model.aria || '')}">`;
    for (let v = d.min; v <= d.max + d.step / 2; v += d.step) {
      s += `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="gridline"/>`;
      s += `<text x="${L - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" class="axislabel">${esc(f(v))}</text>`;
    }
    s += `<line x1="${L}" x2="${W - R}" y1="${base.toFixed(1)}" y2="${base.toFixed(1)}" class="axisline"/>`;
    const every = Math.max(1, Math.ceil(n / 8));
    cats.forEach((_, i) => {
      if (i % every === 0 || i === n - 1) {
        if (i !== n - 1 && n - 1 - i < every / 2 && i % every === 0 && i !== 0) return;
        s += `<text x="${X(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" class="catlabel">${esc(label(i))}</text>`;
      }
    });
    const line = (values, color, width = 2.2, dots = n <= 40) => {
      let p = '', pen = false;
      values.forEach((v, i) => { if (!num(v)) { pen = false; return; } p += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; });
      let out = p ? `<path d="${p}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>` : '';
      if (dots) values.forEach((v, i) => { if (num(v)) out += `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3" fill="${color}" stroke="#fff" stroke-width="1.2"/>`; });
      return out;
    };
    if (type === 'bar' || type === 'stack') {
      const gw = Math.min(band * 0.72, type === 'stack' ? 34 : 26 * main.length), bw = type === 'stack' ? gw : gw / main.length;
      cats.forEach((_, i) => {
        let up = 0, down = 0;
        main.forEach((ser, k) => {
          const v = ser.values[i]; if (!num(v)) return;
          let y0, y1;
          if (type === 'stack') { if (v >= 0) { y0 = Y(up + v); y1 = Y(up); up += v; } else { y0 = Y(down); y1 = Y(down + v); down += v; } }
          else { y0 = Y(Math.max(v, 0)); y1 = Y(Math.min(v, 0)); }
          const x = X(i) - gw / 2 + (type === 'stack' ? 0 : k * bw);
          const dim = ser.conf && ser.conf[i] === false ? ' opacity="0.55"' : '';
          s += `<rect x="${(x + 0.5).toFixed(1)}" y="${y0.toFixed(1)}" width="${Math.max(1, bw - 1).toFixed(1)}" height="${Math.max(1, y1 - y0).toFixed(1)}" rx="2" fill="${ser.color}"${dim}/>`;
        });
      });
    } else if (type === 'area') {
      if (stacked) {
        const acc = cats.map(() => 0);
        main.forEach(ser => {
          const lo = acc.slice(), hi = acc.map((a, i) => a + ser.values[i]);
          hi.forEach((v, i) => { acc[i] = v; });
          const top = hi.map((v, i) => `${X(i).toFixed(1)} ${Y(v).toFixed(1)}`), bottom = lo.map((v, i) => `${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).reverse();
          s += `<path d="M${top.join('L')}L${bottom.join('L')}Z" fill="${ser.color}" fill-opacity="0.78" stroke="${ser.color}" stroke-width="1"/>`;
        });
      } else main.forEach(ser => {
        let seg = [];
        const flush = () => { if (seg.length > 1) s += `<path d="M${seg.map(([x, y]) => x + ' ' + y).join('L')}L${seg[seg.length - 1][0]} ${base.toFixed(1)}L${seg[0][0]} ${base.toFixed(1)}Z" fill="${ser.color}" fill-opacity="0.16"/>`; seg = []; };
        ser.values.forEach((v, i) => { if (num(v)) seg.push([X(i).toFixed(1), Y(v).toFixed(1)]); else flush(); });
        flush();
        s += line(ser.values, ser.color, 2, false);
      });
    } else main.forEach(ser => { s += line(ser.values, ser.color); });
    over.forEach(ser => { s += line(ser.values, ser.color, ser.strokeWidth || 2.6, false); });
    cats.forEach((_, i) => { s += `<rect x="${(L + band * i).toFixed(1)}" y="${T}" width="${band.toFixed(2)}" height="${ph}" fill="transparent" class="hitband" data-ct-i="${i}" tabindex="0"/>`; });
    return s + '</svg>';
  }
  function renderH(model, main, over, f, label) {
    const all = main.concat(over), n = model.categories.length;
    let rowH = Math.max(18, all.length * 9 + 8);const labelW = 84, W = 640, B = 22, R = 64;
    if (UNIFORM) rowH = Math.min(40, Math.max(rowH, (260 - 28) / n));
    const T = 6 + (UNIFORM ? Math.max(0, 260 - 28 - rowH * n) : 0);
    const H = T + B + rowH * n, L = labelW + 8, pw = W - L - R;
    const vals = all.flatMap(s => s.values.filter(num));
    if (!vals.length) return '<div class="gap-empty">Không có dữ liệu hợp lệ.</div>';
    const d = domain(Math.min(...vals), Math.max(...vals), true);
    const Xv = v => L + pw * (v - d.min) / (d.max - d.min);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" class="chartsvg ct-svg" role="img" aria-label="${esc(model.aria || '')}">`;
    for (let v = d.min; v <= d.max + d.step / 2; v += d.step) {
      s += `<line x1="${Xv(v).toFixed(1)}" x2="${Xv(v).toFixed(1)}" y1="${T}" y2="${H - B}" class="gridline"/>`;
      s += `<text x="${Xv(v).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="axislabel">${esc(f(v))}</text>`;
    }
    s += `<line x1="${Xv(0).toFixed(1)}" x2="${Xv(0).toFixed(1)}" y1="${T}" y2="${H - B}" class="axisline"/>`;
    const bh = (rowH - 6) / all.length;
    model.categories.forEach((_, i) => {
      const y = T + i * rowH;
      s += `<text x="${labelW}" y="${(y + rowH / 2 + 4).toFixed(1)}" text-anchor="end" class="catlabel">${esc(label(i))}</text>`;
      all.forEach((ser, k) => {
        const v = ser.values[i]; if (!num(v)) return;
        const x0 = Xv(Math.min(v, 0)), x1 = Xv(Math.max(v, 0)), dim = ser.conf && ser.conf[i] === false ? ' opacity="0.55"' : '';
        s += `<rect x="${x0.toFixed(1)}" y="${(y + 3 + k * bh).toFixed(1)}" width="${Math.max(1, x1 - x0).toFixed(1)}" height="${Math.max(2, bh - 1).toFixed(1)}" rx="2" fill="${ser.color}"${dim}/>`;
        if (all.length === 1) s += `<text x="${(x1 + 5).toFixed(1)}" y="${(y + rowH / 2 + 4).toFixed(1)}" class="endlabel">${esc(f(v))}</text>`;
      });
      s += `<rect x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent" class="hitband" data-ct-i="${i}" tabindex="0"/>`;
    });
    return s + '</svg>';
  }

  /* ---------- toolbar, state, tooltip ---------- */
  function toolbar(id, model, current) {
    return `<div class="ct-switch" role="group" aria-label="Kiểu biểu đồ" data-ct-for="${esc(id)}">` + TYPES.map(([t, name]) => {
      const why = reason(model, t);
      return `<button type="button" data-ct-type="${t}" aria-pressed="${t === current}"${why ? ` disabled title="${esc(why)}"` : ''}>${name}</button>`;
    }).join('') + '</div>';
  }
  function choose(model) {
    const want = saved(model.key);
    return want && TYPES.some(([t]) => t === want) && !reason(model, want) ? want : native(model);
  }
  function normalize(model) {
    model.series = model.series.map(s => ({...s, values: s.values.map(v => (num(v) ? v : null))}));
    const bars = model.series.filter(s => s.kind !== 'line');
    // In a combo chart the lines are overlays (mean, comparison line) and stay lines.
    model.series.forEach(s => { s.overlay = bars.length > 0 && s.kind === 'line'; });
    if (model.time == null) model.time = isTime(model.categories);
    return model;
  }
  function paint(id) {
    const entry = registry.get(id); if (!entry) return;
    const body = entry.body || document.querySelector(`[data-ct-body="${CSS.escape(id)}"]`); if (!body) return;
    const type = entry.type;
    if (type === native(entry.model)) entry.base(body);
    else body.innerHTML = render(entry.model, type);
    body.dataset.ctType = type;
    // Mounted charts keep the toolbar inside the host so it moves with the chart.
    if (entry.bar) { entry.bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ctType === type))); body.prepend(entry.bar); }
    body.dispatchEvent(new CustomEvent('ct:render', {bubbles: true, detail: {type}}));
  }

  // Page renderer that draws into a host element (Oil/Sugar engines).
  function mount(host, model, base) {
    if (!host) return;
    const id = host.id || ('ct' + (++seq));
    model.key = model.key || id;
    normalize(model);
    const type = choose(model);
    const tpl = document.createElement('template'); tpl.innerHTML = toolbar(id, model, type);
    document.querySelectorAll('.ct-switch').forEach(b => { if (b.dataset.ctFor === id) b.remove(); });
    registry.set(id, {model, base: () => base(), body: host, type, bar: tpl.content.firstElementChild});
    paint(id);
  }
  // Page renderer that returns an SVG string (Bank Wi engine).
  function html(model, svg) {
    const id = 'ct-' + (++seq);
    normalize(model);
    model.key = model.key || model.aria || model.series.map(s => s.name).join('|') + '|' + (model.unit || '');
    const type = choose(model);
    registry.set(id, {model, base: body => { body.innerHTML = svg; }, type});
    const content = type === native(model) ? svg : render(model, type);
    return toolbar(id, model, type) + `<div class="ct-body" data-ct-body="${id}" data-ct-type="${type}">${content}</div>`;
  }

  let tip;
  function showTip(target, evt) {
    const body = target.closest('[data-ct-body],[id]'), id = body?.dataset.ctBody || body?.id, entry = registry.get(id);
    if (!entry) return;
    const i = Number(target.dataset.ctI), m = entry.model, f = fmtOf(m);
    if (!tip) { tip = document.createElement('div'); tip.className = 'ct-tip'; tip.hidden = true; document.body.append(tip); }
    const rows = m.series.filter(s => num(s.values[i])).map(s => `<div class="ct-tip-row"><span><i style="background:${esc(s.color)}"></i>${esc(s.name)}</span><b>${esc(f(s.values[i]))}${m.unit ? ' ' + esc(m.unit) : ''}</b></div>`);
    tip.innerHTML = `<div class="ct-tip-title">${esc(m.categories[i])}</div>` + (rows.join('') || '<div class="ct-tip-row">Không có số liệu</div>');
    tip.hidden = false;
    const r = target.getBoundingClientRect(), x = evt?.clientX ?? r.left + r.width / 2, y = evt?.clientY ?? r.top;
    tip.style.left = Math.max(8, Math.min(x + 14, innerWidth - tip.offsetWidth - 8)) + 'px';
    tip.style.top = Math.max(8, Math.min(y + 14, innerHeight - tip.offsetHeight - 8)) + 'px';
  }
  const hideTip = () => { if (tip) tip.hidden = true; };
  document.addEventListener('pointermove', e => { const t = e.target.closest?.('.ct-svg [data-ct-i]'); if (t) showTip(t, e); else hideTip(); });
  document.addEventListener('focusin', e => { const t = e.target.closest?.('.ct-svg [data-ct-i]'); if (t) showTip(t); });
  document.addEventListener('focusout', hideTip);
  window.addEventListener('scroll', hideTip, true);
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('.ct-switch button[data-ct-type]'); if (!btn || btn.disabled) return;
    const bar = btn.closest('.ct-switch'), id = bar.dataset.ctFor, entry = registry.get(id); if (!entry) return;
    entry.type = btn.dataset.ctType; save(entry.model.key, entry.type);
    bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    paint(id);
  });

  window.ChartTypes = {mount, html, render, TYPES};
})();
