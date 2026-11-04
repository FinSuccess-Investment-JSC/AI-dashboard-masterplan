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
  const VIEW = 'fs_sector_chart_view_v1';
  function readView(key) { try { return (JSON.parse(localStorage.getItem(VIEW) || '{}') || {})[location.pathname + '#' + key] || {}; } catch (e) { return {}; } }
  function saveView(key, v) { try { const all = JSON.parse(localStorage.getItem(VIEW) || '{}') || {}; all[location.pathname + '#' + key] = v; localStorage.setItem(VIEW, JSON.stringify(all)); } catch (e) { /* view still changes */ } }
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
  // Chu kỳ chỉ đọc từ nhãn kỳ; không gộp tháng thành quý/năm (giữ nguyên số liệu gốc).
  function cycleOf(cats) {
    const c = cats.map(String);
    const all = re => c.every(x => re.test(x.trim()));
    if (all(/^(T\d{1,2}|\d{1,2})\/\d{2,4}$/)) return ['Tháng', 'tháng'];
    if (all(/^(Q|Quý ?)\d/i) || all(/^\d\/?Q|Q\d\/\d{2,4}$/i)) return ['Quý', 'quý'];
    if (all(/^\d{4}[A-Z]?$/)) return ['Năm', 'năm'];
    const day = x => { let m = x.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return Date.UTC(+m[1], m[2] - 1, +m[3]); m = x.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? Date.UTC(+m[3], m[2] - 1, +m[1]) : NaN; };
    const ts = c.map(x => day(x.trim()));
    if (ts.length > 2 && ts.every(Number.isFinite)) {
      const gaps = ts.slice(1).map((t, i) => Math.abs(t - ts[i]) / 864e5).sort((a, b) => a - b), g = gaps[gaps.length >> 1];
      return g >= 27 ? ['Tháng', 'tháng'] : g >= 6 ? ['Tuần', 'tuần'] : ['Phiên', 'phiên'];
    }
    if (all(/^\d{1,2}\/\d{1,2}$/)) return ['Phiên', 'phiên'];
    if (all(/^(W|Tuần ?)\d/i)) return ['Tuần', 'tuần'];
    return ['Kỳ', 'kỳ'];
  }
  const COUNTS = [1, 3, 5, 8, 10];
  function lum(hex) {
    const m = String(hex).match(/^#?([0-9a-f]{6})$/i); if (!m) return 0.3;
    const v = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  // Chữ trắng trên nền tối, mực đậm trên nền sáng (tương phản ≥ 4,5:1 với 5 màu thương hiệu).
  const inkOn = hex => lum(hex) > 0.28 ? '#1d2333' : '#fff';
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


  /* ---------- Chart.js renderer, same library and look as Stock dashboard ---------- */
  const useChart = () => !!window.Chart;
  const valueLabels = {id: 'ctValueLabels', afterDatasetsDraw(ch) {
    const on = ch.options.plugins.ctValueLabels; if (!on?.show || !ch.$ctFmt) return;
    const c = ch.ctx; c.save(); c.font = '600 11px Inter,Arial,sans-serif'; c.fillStyle = '#334155'; c.textAlign = 'center'; c.textBaseline = 'bottom';
    ch.data.datasets.forEach((d, k) => { if (!ch.isDatasetVisible(k)) return; ch.getDatasetMeta(k).data.forEach((p, i) => { const v = d.data[i]; if (num(v)) c.fillText(ch.$ctFmt(v), p.x, p.y - 4); }); });
    c.restore();
  }};
  const crosshair = {id: 'ctCrosshair', afterDatasetsDraw(ch) { const a = ch.tooltip?.getActiveElements?.()[0]; if (!a || ch.options.indexAxis === 'y') return; const c = ch.ctx, t = ch.chartArea; c.save(); c.strokeStyle = '#94A3B8'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(a.element.x, t.top); c.lineTo(a.element.x, t.bottom); c.stroke(); c.restore(); }};
  const endLabels = {id: 'ctEndLabels', afterDatasetsDraw(ch) { const on = ch.options.plugins.ctEndLabels; if (!on?.show || !ch.$ctFmt) return; const c = ch.ctx; c.save(); c.font = '700 11px Inter,Arial,sans-serif'; c.textBaseline = 'middle';
    ch.data.datasets.forEach((d, k) => { if (d.type !== 'line' || !ch.isDatasetVisible(k)) return; let i = d.data.length - 1; while (i >= 0 && !num(d.data[i])) i--; const p = ch.getDatasetMeta(k).data[i]; if (!p) return; c.fillStyle = d.borderColor; c.fillText(ch.$ctFmt(d.data[i]), p.x + 6, p.y); }); c.restore(); }};
  function chartConfig(vm, type) {
    const f = fmtOf(vm), h = type === 'hbar', stack = type === 'stack', labels = vm.categories.map((c, i) => String(vm.tickLabels?.[i] ?? c).replace(/\n/g, ' '));
    const mult = vm.yMult || 1, thick = 40 * (vm.barScale || 1);
    const sets = vm.series.map(s => {
      const line = s.overlay || type === 'line' || type === 'area';
      const dim = i => (s.conf && s.conf[i] === false ? s.color + '8C' : s.color);
      return line
        ? {type: 'line', label: s.name || '', data: s.values, borderColor: s.color, backgroundColor: type === 'area' && !s.overlay ? s.color + '33' : s.color, fill: type === 'area' && !s.overlay, borderWidth: 2, pointRadius: vm.categories.length > 24 ? 0 : 2.5, pointHoverRadius: 4, tension: 0, spanGaps: true, order: 0}
        : {type: 'bar', label: s.name || '', data: s.values, backgroundColor: s.conf ? s.values.map((_, i) => dim(i)) : s.color, borderRadius: 3, maxBarThickness: thick, order: 1, stack: stack ? 's' : undefined};
    });
    const nums = vm.series.flatMap(s => s.values).filter(num), axis = {grid: {color: '#EEF0F6'}, border: {display: false}, beginAtZero: vm.zeroBase !== false, ticks: {color: '#64748B', font: {size: 12}, callback: v => Number(v).toLocaleString('vi-VN', {maximumFractionDigits: 2})}, stacked: stack};
    if (vm.yMax != null) axis.suggestedMax = vm.yMax / mult; else if (mult !== 1 && nums.length) axis.suggestedMax = Math.max(...nums) / mult;
    const cat = {grid: {display: false}, border: {color: '#D6DDE8'}, stacked: stack, ticks: {color: '#64748B', font: {size: 12}, autoSkip: !vm.allTicks, maxRotation: 45, autoSkipPadding: 8}};
    return {type: 'bar', data: {labels, datasets: sets}, plugins: [valueLabels, crosshair, endLabels], options: {responsive: true, maintainAspectRatio: false, animation: {duration: 250}, layout: {padding: {right: !h && !vm.labels && sets.some(d => d.type === 'line') ? 44 : 0}}, indexAxis: h ? 'y' : 'x', interaction: {mode: 'index', intersect: false, axis: h ? 'y' : 'x'},
      scales: h ? {x: axis, y: cat} : {x: cat, y: axis},
      plugins: {legend: {display: false}, ctValueLabels: {show: !!vm.labels}, ctEndLabels: {show: !vm.labels && !h}, tooltip: {backgroundColor: '#1D2678', titleFont: {weight: '700'}, padding: 10, cornerRadius: 8, usePointStyle: true, filter: x => num(x.raw), callbacks: {title: x => String(vm.categories[x[0]?.dataIndex] ?? ''), label: x => (x.dataset.label ? x.dataset.label + ': ' : '') + f(x.raw) + (vm.unit ? ' ' + vm.unit : '')}}}}};
  }
  function drawChart(body, vm, type) {
    body.querySelectorAll('canvas').forEach(c => Chart.getChart(c)?.destroy());
    const h = Math.max(260, type === 'hbar' ? vm.categories.length * 24 + 60 : 260);
    body.innerHTML = `<div class="ct-canvas" style="position:relative;height:${h}px"><canvas role="img" aria-label="${esc(vm.aria || '')}"></canvas></div>`;
    const ch = new Chart(body.querySelector('canvas'), chartConfig(vm, type));
    ch.$ctFmt = fmtOf(vm);
    return ch;
  }
  function tableHtml(vm) {
    const f = fmtOf(vm), named = vm.series;
    return `<div class="tbl-wrap ct-table"><table class="compare-table"><thead><tr><th>Kỳ</th>${named.map(s => `<th>${esc(s.name || (vm.unit || 'Giá trị'))}</th>`).join('')}</tr></thead><tbody>${vm.categories.map((c, i) => `<tr><td>${esc(String(c))}</td>${named.map(s => `<td>${num(s.values[i]) ? esc(f(s.values[i])) : '—'}</td>`).join('')}</tr>`).reverse().join('')}</tbody></table></div>`;
  }
  // Biểu đồ nhỏ trong ô KPI, cùng kiểu đường có nền nhạt của Stock.
  function spark(host, values, color) {
    if (!host) return false;
    host.ctValues = {values, color};
    host.querySelectorAll('canvas').forEach(c => Chart.getChart(c)?.destroy());
    host.innerHTML = '<div class="ct-spark" style="position:relative;height:38px"><canvas aria-hidden="true"></canvas></div>';
    new Chart(host.querySelector('canvas'), {type: 'line', data: {labels: values.map((_, i) => i), datasets: [{data: values, borderColor: color, backgroundColor: color + '22', fill: true, borderWidth: 1.6, pointRadius: values.map((_, i) => (i === values.length - 1 ? 2.5 : 0)), pointBackgroundColor: color, tension: 0}]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, events: [], layout: {padding: 3}, plugins: {legend: {display: false}, tooltip: {enabled: false}}, scales: {x: {display: false}, y: {display: false}}}});
    return true;
  }
  // Cột dương / âm quanh 0 (balanceBarChart của trang).
  function balance(host, o) {
    if (!host) return false;
    const d = o.digits ?? 1, f = v => Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}), max = Math.max(o.minScale || 1, ...o.values.filter(num).map(Math.abs)) * 1.2;
    host.querySelectorAll('canvas').forEach(c => Chart.getChart(c)?.destroy());
    host.innerHTML = '<div class="ct-canvas" style="position:relative;height:260px"><canvas></canvas></div>';
    new Chart(host.querySelector('canvas'), {type: 'bar', data: {labels: o.labels, datasets: [{data: o.values, backgroundColor: o.values.map(v => (v >= 0 ? (o.posColor || '#59C5C8') : (o.negColor || '#861C52'))), borderRadius: 3, maxBarThickness: 40}]}, plugins: [crosshair],
      options: {responsive: true, maintainAspectRatio: false, animation: {duration: 250}, interaction: {mode: 'index', intersect: false}, scales: {x: {grid: {display: false}, ticks: {color: '#64748B', autoSkipPadding: 8, maxRotation: 45}}, y: {min: -max, max, grid: {color: '#EEF0F6'}, border: {display: false}, ticks: {color: '#64748B', callback: f}}}, plugins: {legend: {display: false}, tooltip: {backgroundColor: '#1D2678', callbacks: {label: x => f(x.raw) + (o.unit ? ' ' + o.unit : '')}}}}});
    return true;
  }
  // Giá theo ngày thật (rangeDotChart của trang): điểm giữa khoảng giá.
  function dots(host, o) {
    if (!host) return false;
    const day = v => new Date(v).toLocaleDateString('vi-VN');
    host.querySelectorAll('canvas').forEach(c => Chart.getChart(c)?.destroy());
    host.innerHTML = '<div class="ct-canvas" style="position:relative;height:260px"><canvas></canvas></div>';
    new Chart(host.querySelector('canvas'), {type: 'scatter', data: {datasets: o.series.map(s => ({label: s.name || '', data: s.points.map(p => ({x: +new Date(p.date + 'T00:00:00'), y: p.mid, l: p.label, lo: p.low, hi: p.high})), backgroundColor: s.color, pointRadius: 4.5, pointHoverRadius: 6}))},
      options: {responsive: true, maintainAspectRatio: false, animation: {duration: 250}, scales: {x: {type: 'linear', min: +o.domain[0], max: +o.domain[1], grid: {display: false}, ticks: {color: '#64748B', maxTicksLimit: 6, callback: day}}, y: {grid: {color: '#EEF0F6'}, border: {display: false}, ticks: {color: '#64748B'}}}, plugins: {legend: {display: false}, tooltip: {backgroundColor: '#1D2678', callbacks: {title: x => day(x[0].raw.x), label: x => `${x.raw.l || x.dataset.label}: ${x.raw.lo === x.raw.hi ? x.raw.y : x.raw.lo + '–' + x.raw.hi}`}}}}});
    return true;
  }
  // Thanh so sánh mỗi thanh một màu (hbarCompare của trang), không có thanh công cụ.
  function hbar(host, o) {
    if (!host) return false;
    const f = v => Number(v).toLocaleString('vi-VN', {minimumFractionDigits: o.digits ?? 0, maximumFractionDigits: o.digits ?? 0});
    host.querySelectorAll('canvas').forEach(c => Chart.getChart(c)?.destroy());
    host.innerHTML = `<div class="ct-canvas" style="position:relative;height:${Math.max(180, o.items.length * 34 + 40)}px"><canvas></canvas></div>`;
    new Chart(host.querySelector('canvas'), {type: 'bar', data: {labels: o.items.map(i => i.label), datasets: [{data: o.items.map(i => i.value), backgroundColor: o.items.map(i => i.color || '#2938A8'), borderRadius: 3, maxBarThickness: 26}]}, plugins: [valueLabels],
      options: {responsive: true, maintainAspectRatio: false, indexAxis: 'y', animation: {duration: 250}, scales: {x: {beginAtZero: true, grid: {color: '#EEF0F6'}, border: {display: false}, ticks: {color: '#64748B'}}, y: {grid: {display: false}, ticks: {color: '#334155', font: {size: 12}}}}, plugins: {legend: {display: false}, tooltip: {backgroundColor: '#1D2678', callbacks: {label: x => f(x.raw) + (o.unit ? ' ' + o.unit : '')}}}}});
    return true;
  }
  /* ---------- universal SVG renderer ---------- */
  const UNIFORM = true;
  function render(model, type) {
    const cats = model.categories, n = cats.length, f = fmtOf(model);
    const main = model.series.filter(s => !s.overlay), over = model.series.filter(s => s.overlay);
    const label = i => String(model.tickLabels?.[i] ?? cats[i]);
    if (type === 'hbar') return renderH(model, main, over, f, label);
    // Uniform plot height so charts in one row/tab look the same size.
    const W = Math.max(280, Math.round(model.width || 640)), H = UNIFORM ? 260 : Math.max(240, model.height || 250), L = 52, R = 16, T = 16, B = cats.some((_, i) => label(i).includes('\n')) ? 44 : 30;
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
    if (model.yMult && model.yMult !== 1) {
      const span = (d.max - d.min) * model.yMult;
      if (zero && d.min === 0) d.max = span; else { const mid = (d.max + d.min) / 2; d.min = mid - span / 2; d.max = mid + span / 2; }
      d.step = niceStep(span, 4);
    }
    if (model.yMax != null && d.max > model.yMax) d.max = model.yMax;  // share charts stop at 100%
    const Y = v => T + ph * (d.max - v) / (d.max - d.min);
    const X = i => L + band * (i + 0.5);
    const base = Y(Math.max(d.min, Math.min(0, d.max)));
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="chartsvg ct-svg" role="img" aria-label="${esc(model.aria || '')}">`;
    for (let k = Math.ceil(d.min / d.step - 1e-9); k * d.step <= d.max + d.step * 1e-6; k++) {
      const v = k * d.step || 0;
      s += `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="gridline"/>`;
      s += `<text x="${L - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" class="axislabel">${esc(f(v))}</text>`;
    }
    s += `<line x1="${L}" x2="${W - R}" y1="${base.toFixed(1)}" y2="${base.toFixed(1)}" class="axisline"/>`;
    const every = model.allTicks ? 1 : Math.max(1, Math.ceil(n / Math.max(3, Math.floor(pw / 70))));
    cats.forEach((_, i) => {
      if (i % every === 0 || i === n - 1) {
        if (i !== n - 1 && n - 1 - i < every / 2 && i % every === 0 && i !== 0) return;
        const parts = label(i).split('\n'), y0 = H - B + 16;
        s += `<text x="${X(i).toFixed(1)}" y="${y0}" text-anchor="middle" class="catlabel">` + parts.map((t, k) => `<tspan x="${X(i).toFixed(1)}" dy="${k ? 13 : 0}">${esc(t)}</tspan>`).join('') + '</text>';
      }
    });
    const off = model.offset || 0, placed = [], showLabels = model.labels && n <= 40;
    let labels = '';
    const fits = (x, y, w) => {
      const b = [x - w / 2 - 2, y - 11, x + w / 2 + 2, y + 2];
      if (b[0] < L || b[2] > W - R || b[1] < T || b[3] > T + ph) return false;
      if (placed.some(p => b[0] < p[2] && b[2] > p[0] && b[1] < p[3] && b[3] > p[1])) return false;
      placed.push(b); return true;
    };
    const tag = (x, y, v, fill) => { const t = f(v), w = t.length * 6.3; if (fits(x, y, w)) labels += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" class="ct-vlabel" fill="${fill}">${esc(t)}</text>`; };
    const line = (values, color, width = 2.2, dots = n <= 40) => {
      let p = '', pen = false;
      values.forEach((v, i) => { if (!num(v)) { pen = false; return; } p += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; });
      let out = p ? `<path d="${p}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>` : '';
      if (dots) values.forEach((v, i) => { if (num(v)) out += `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3" fill="${color}" stroke="#fff" stroke-width="1.2"/>`; });
      if (showLabels) values.forEach((v, i) => { if (!num(v)) return; const y = Y(v); tag(X(i), y - 7 - 11 < T ? y + 16 : y - 7, v, '#1d2333'); });
      return out;
    };
    if (type === 'bar' || type === 'stack') {
      const gw = Math.min(band * 0.92, Math.min(band * 0.72, type === 'stack' ? 34 : 26 * main.length) * (model.barScale || 1)), bw = type === 'stack' ? gw : gw / main.length;
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
          if (showLabels) {
            const cx = x + bw / 2, tw = f(v).length * 6.3;
            if (type === 'stack') { if (y1 - y0 >= 14 && tw <= bw + 2) { const top = Math.max(y0, T), bot = Math.min(y1, T + ph); if (bot - top >= 14) tag(cx, (top + bot) / 2 + 4, v, inkOn(ser.color)); } }
            else if (v >= 0) { if (y0 - 15 >= T) tag(cx, y0 - 4, v, '#1d2333'); else if (y1 - y0 >= 16) tag(cx, y0 + 13, v, inkOn(ser.color)); }
            else if (y1 + 14 <= T + ph) tag(cx, y1 + 12, v, '#1d2333');
          }
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
    s += labels;
    cats.forEach((_, i) => { s += `<rect x="${(L + band * i).toFixed(1)}" y="${T}" width="${band.toFixed(2)}" height="${ph}" fill="transparent" class="hitband" data-ct-i="${i + off}" tabindex="0"/>`; });
    // Kéo trên vùng số của trục để giãn/co, nhấp đúp để về thang tự động.
    s += `<rect x="0" y="${T}" width="${L - 2}" height="${ph}" fill="transparent" class="ct-yhit"><title>Kéo để giãn/co trục · nhấp đúp để về thang tự động</title></rect>`;
    return s + '</svg>';
  }
  function renderH(model, main, over, f, label) {
    const all = main.concat(over), n = model.categories.length;
    let rowH = Math.max(18, all.length * 9 + 8);const labelW = 84, W = Math.max(280, Math.round(model.width || 640)), B = 22, R = 64;
    if (UNIFORM) rowH = Math.min(40, Math.max(rowH, (260 - 28) / n));
    const T = 6 + (UNIFORM ? Math.max(0, 260 - 28 - rowH * n) : 0);
    const H = T + B + rowH * n, L = labelW + 8, pw = W - L - R;
    const vals = all.flatMap(s => s.values.filter(num));
    if (!vals.length) return '<div class="gap-empty">Không có dữ liệu hợp lệ.</div>';
    const d = domain(Math.min(...vals), Math.max(...vals), true);
    const Xv = v => L + pw * (v - d.min) / (d.max - d.min);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="chartsvg ct-svg" role="img" aria-label="${esc(model.aria || '')}">`;
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
        if (all.length === 1 || (model.labels && bh >= 10)) s += `<text x="${(x1 + 5).toFixed(1)}" y="${(y + rowH / 2 + 4).toFixed(1)}" class="endlabel">${esc(f(v))}</text>`;
      });
      s += `<rect x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent" class="hitband" data-ct-i="${i + (model.offset || 0)}" tabindex="0"/>`;
    });
    return s + '</svg>';
  }

  /* ---------- toolbar, state, tooltip ---------- */
  function periodHtml(model) {
    if (!model.time) return '';
    const n = model.categories.length, [cyc, unit] = cycleOf(model.categories);
    const opts = COUNTS.filter(k => k < n).map(k => `<option value="${k}">${k}</option>`).join('') + `<option value="0">Tất cả (${n} ${unit})</option>`;
    return `<span class="ct-period"><label>Chu kỳ <select data-ct-cycle disabled title="Chu kỳ theo nguồn dữ liệu; không gộp kỳ"><option>${cyc}</option></select></label>` +
      `<label>Số kỳ <select data-ct-count>${opts}</select></label></span>`;
  }
  function toolbar(id, model, current) {
    return `<div class="ct-switch" role="group" aria-label="Điều khiển chart" data-ct-for="${esc(id)}">` + periodHtml(model) +
      `<span class="ct-main"><button type="button" data-ct-table aria-pressed="false">Bảng</button><button type="button" data-ct-custom aria-expanded="false">Tùy chỉnh</button></span><span class="ct-more" hidden>` + TYPES.map(([t, name]) => {
      const why = reason(model, t);
      return `<button type="button" data-ct-type="${t}" aria-pressed="${t === current}"${why ? ` disabled title="${esc(why)}"` : ''}>${name}</button>`;
    }).join('') + `<span class="ct-axis" role="group" aria-label="Trục"><span>Trục</span>` +
      [['zero', 'Từ 0'], ['fit', 'Vừa dữ liệu']].map(([k, t]) => `<button type="button" data-ct-axis="${k}">${t}</button>`).join('') +
      `<button type="button" class="ct-values" data-ct-values aria-pressed="false" hidden>Số liệu</button>` +
      `<button type="button" class="ct-bw" data-ct-bw="-1" aria-label="Thu hẹp cột">−</button><button type="button" class="ct-bw" data-ct-bw="1" aria-label="Kéo rộng cột">+</button></span></span></div>`;
  }
  // Bars always start at 0 (bar length = value); "Vừa dữ liệu" only for line/area views.
  const fitAllowed = (entry) => entry.type === 'line' || (entry.type === 'area' && !entry.model.stackable);
  function syncBar(entry, bar = entry.bar) {
    if (!bar) return;
    bar.querySelectorAll('[data-ct-values]').forEach(b => b.setAttribute('aria-pressed', String(!!entry.labels)));
    const cols = entry.type === 'bar' || entry.type === 'stack';
    bar.querySelectorAll('[data-ct-bw]').forEach(b => { b.hidden = !cols; b.disabled = b.dataset.ctBw < 0 ? entry.bw <= 0.5 : entry.bw >= 2; });
    bar.querySelectorAll('[data-ct-count]').forEach(sel => { const v = String(entry.count || 0); sel.querySelectorAll('option').forEach(o => o.toggleAttribute('selected', o.value === v)); sel.value = v; });
    bar.querySelectorAll('[data-ct-type]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ctType === entry.type)));
    const ok = fitAllowed(entry), fit = ok && entry.fit;
    bar.querySelectorAll('[data-ct-axis]').forEach(b => {
      b.setAttribute('aria-pressed', String((b.dataset.ctAxis === 'fit') === fit));
      const lock = b.dataset.ctAxis === 'fit' && !ok; b.disabled = lock;
      if (lock) b.title = 'Cột bắt đầu từ 0 để độ dài cột đúng giá trị'; else b.removeAttribute('title');
    });
  }
  function legendHtml(entry) {
    const named = entry.model.series.filter(s => s.name);
    if (named.length < 2) return '';
    return '<div class="cts-legend" role="group" aria-label="Chú giải, bấm để ẩn/hiện">' + named.map(s => {
      const off = entry.hidden.has(s.name);
      return `<button type="button" data-ct-series="${esc(s.name)}" aria-pressed="${!off}" class="${off ? 'off' : ''}"><i style="background:${esc(s.color)}"></i>${esc(s.name)}</button>`;
    }).join('') + '</div>';
  }
  const yoyLag = cats => /^Q/.test(String(cats[0])) ? 4 : 12;
  function viewModel(entry, width) {
    const m = entry.model, fit = fitAllowed(entry) && entry.fit, n = m.categories.length;
    const k = m.time && entry.count && entry.count < n ? entry.count : n, o0 = n - k;
    const o = entry.zoom ? entry.zoom[0] : o0, e = entry.zoom ? entry.zoom[1] + 1 : n;
    const cut = a => (a && a.length === n ? a.slice(o, e) : a);
    const calc = (vals, i) => { const c = entry.calc, v = vals[i]; if (!c || !num(v)) return v;
      if (c === 'rebase') { const b = vals.slice(o, e).find(num); return b ? v / b * 100 : null; }
      const lag = c === 'yoy' ? yoyLag(m.categories) : 1, p = vals[i - lag]; return num(p) && p ? (v / p - 1) * 100 : null; };
    return {...m, width, zeroBase: !fit, offset: o, categories: cut(m.categories), tickLabels: cut(m.tickLabels),
      labels: !!entry.labels, barScale: entry.bw || 1, yMult: entry.ymult || 1,
      unit: entry.calc ? (entry.calc === 'rebase' ? 'chỉ số' : '%') : m.unit, digits: entry.calc ? 1 : m.digits, fmt: entry.calc ? null : m.fmt,
      series: m.series.filter(s => !entry.hidden.has(s.name)).map(s => ({...s, values: cut(s.values.map((_, i) => calc(s.values, i))), conf: cut(s.conf)}))};
  }
  const isDefault = entry => !entry.zoom && !entry.calc && entry.type === native(entry.model) && !entry.hidden.size && entry.fit === entry.fit0 && !entry.count && !entry.labels && (entry.bw || 1) === 1 && (entry.ymult || 1) === 1;
  const viewState = entry => ({fit: entry.fit, hidden: [...entry.hidden], count: entry.count || 0, labels: !!entry.labels, bw: entry.bw || 1});
  const restore = (v, model) => ({count: model.time ? (v.count || 0) : 0, labels: !!v.labels, bw: v.bw || 1, ymult: 1});
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
    // Native renderer only for the untouched view; any axis/series change uses the shared renderer.
    if (entry.table) { body.querySelectorAll('canvas').forEach(c => window.Chart?.getChart(c)?.destroy()); body.innerHTML = tableHtml(viewModel(entry, 640)); }
    else if (useChart()) { const ch = drawChart(body, viewModel(entry, body.clientWidth || 640), type); ch.$ctId = id; if (entry.zoom || entry.calc) body.insertAdjacentHTML('afterbegin', `<div class="ct-state">${entry.calc ? `<span>Đang xem: ${{pct: '%Δ kỳ trước', yoy: '%Δ cùng kỳ', rebase: 'Rebase 100'}[entry.calc]}</span>` : ''}<button type="button" data-ct-reset>↺ Toàn bộ</button></div>`); }
    else if (isDefault(entry)) entry.base(body);
    else body.innerHTML = render(viewModel(entry, body.clientWidth || 640), type);
    body.dataset.ctType = type;
    body.insertAdjacentHTML('beforeend', legendHtml(entry));
    // Page legends next to the chart are replaced by the clickable one.
    if (body.querySelector('.cts-legend')) {
      const card = body.closest('.card'), one = card && card.querySelectorAll('.cts-legend').length === 1;
      (one ? [...card.querySelectorAll('.legend')] : [body.previousElementSibling, body.nextElementSibling]).forEach(n => { if (n && n.classList.contains('legend') && !body.contains(n)) n.hidden = true; });
    }
    // Mounted charts keep the toolbar inside the host so it moves with the chart.
    if (entry.bar) { syncBar(entry); body.prepend(entry.bar); }
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
    const v = readView(model.key), fit0 = model.zeroBase === false;
    registry.set(id, {model, base: () => base(), body: host, type, bar: tpl.content.firstElementChild, fit0, fit: v.fit ?? fit0, hidden: new Set((v.hidden || []).filter(n => model.series.some(s => s.name === n))), ...restore(v, model)});
    paint(id);
    if (window.ResizeObserver && !host._ctRO) {
      let w = host.clientWidth;
      host._ctRO = new ResizeObserver(() => { const nw = host.clientWidth; if (nw && Math.abs(nw - w) > 8) { w = nw; if (registry.get(id) && !useChart()) paint(id); } });
      host._ctRO.observe(host);
    }
  }
  // Page renderer that returns an SVG string (Bank Wi engine).
  function html(model, svg) {
    const id = 'ct-' + (++seq);
    normalize(model);
    model.key = model.key || model.aria || model.series.map(s => s.name).join('|') + '|' + (model.unit || '');
    const type = choose(model);
    const v = readView(model.key), fit0 = model.zeroBase === false;
    const entry = {model, base: body => { body.innerHTML = svg; }, type, fit0, fit: v.fit ?? fit0, hidden: new Set(v.hidden || []), ...restore(v, model)};
    registry.set(id, entry);
    const content = isDefault(entry) ? svg : render(viewModel(entry, 640), type);
    const tpl = document.createElement('template'); tpl.innerHTML = toolbar(id, model, type); entry.bar = tpl.content.firstElementChild; syncBar(entry);
    // Toolbar stays outside the body here; paint() must not move it.
    const bar = entry.bar.outerHTML; entry.bar = null;
    if (useChart()) setTimeout(() => paint(id), 0); // the page inserts this HTML first
    return bar + `<div class="ct-body" data-ct-body="${id}" data-ct-type="${type}">${content}${legendHtml(entry)}</div>`;
  }

  let tip;
  function showTip(target, evt) {
    const body = target.closest('[data-ct-body],[id]'), id = body?.dataset.ctBody || body?.id, entry = registry.get(id);
    if (!entry) return;
    const i = Number(target.dataset.ctI), m = entry.model, f = fmtOf(m);
    if (!tip) { tip = document.createElement('div'); tip.className = 'ct-tip'; tip.hidden = true; document.body.append(tip); }
    const rows = m.series.filter(s => num(s.values[i]) && !entry.hidden?.has(s.name)).map(s => `<div class="ct-tip-row"><span><i style="background:${esc(s.color)}"></i>${esc(s.name)}</span><b>${esc(f(s.values[i]))}${m.unit ? ' ' + esc(m.unit) : ''}</b></div>`);
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
    const lg = e.target.closest?.('.cts-legend button[data-ct-series]');
    if (lg) {
      const body = lg.closest('[data-ct-body],[id]'), id = body?.dataset.ctBody || body?.id, entry = registry.get(id); if (!entry) return;
      const n = lg.dataset.ctSeries; entry.hidden.has(n) ? entry.hidden.delete(n) : entry.hidden.add(n);
      saveView(entry.model.key, viewState(entry)); paint(id); return;
    }
    const vb = e.target.closest?.('.ct-switch button[data-ct-values], .ct-switch button[data-ct-bw]');
    if (vb) {
      if (vb.disabled) return;
      const bar = vb.closest('.ct-switch'), id = bar.dataset.ctFor, entry = registry.get(id); if (!entry) return;
      if (vb.dataset.ctValues != null) entry.labels = !entry.labels;
      else entry.bw = Math.max(0.5, Math.min(2, Math.round(((entry.bw || 1) + 0.25 * Number(vb.dataset.ctBw)) * 100) / 100));
      saveView(entry.model.key, viewState(entry)); paint(id); syncBar(entry, bar); return;
    }
    const ax = e.target.closest?.('.ct-switch button[data-ct-axis]');
    if (ax) {
      if (ax.disabled) return;
      const bar = ax.closest('.ct-switch'), id = bar.dataset.ctFor, entry = registry.get(id); if (!entry) return;
      entry.fit = ax.dataset.ctAxis === 'fit'; saveView(entry.model.key, viewState(entry));
      if (!entry.bar) bar.querySelectorAll('[data-ct-axis]').forEach(b => b.setAttribute('aria-pressed', String(b === ax)));
      paint(id); syncBar(entry, bar); return;
    }
    const btn = e.target.closest?.('.ct-switch button[data-ct-type]'); if (!btn || btn.disabled) return;
    const bar = btn.closest('.ct-switch'), id = bar.dataset.ctFor, entry = registry.get(id); if (!entry) return;
    entry.type = btn.dataset.ctType; save(entry.model.key, entry.type);
    bar.querySelectorAll('[data-ct-type]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    if (!entry.bar) { const ok = fitAllowed(entry); bar.querySelectorAll('[data-ct-axis]').forEach(b => { b.setAttribute('aria-pressed', String((b.dataset.ctAxis === 'fit') === (ok && entry.fit))); b.disabled = b.dataset.ctAxis === 'fit' && !ok; }); }
    paint(id); syncBar(entry, bar);
  });
  document.addEventListener('change', e => {
    const sel = e.target.closest?.('.ct-switch select[data-ct-count]'); if (!sel) return;
    const bar = sel.closest('.ct-switch'), id = bar.dataset.ctFor, entry = registry.get(id); if (!entry) return;
    entry.count = Number(sel.value) || 0; saveView(entry.model.key, viewState(entry)); paint(id); syncBar(entry, bar);
  });
  const entryOf = el => { const body = el.closest('[data-ct-body],[id]'), id = body?.dataset.ctBody || body?.id; return registry.get(id) ? [id, registry.get(id)] : []; };
  let drag = null, raf = 0;
  document.addEventListener('pointerdown', e => {
    const hit = e.target.closest?.('.ct-svg .ct-yhit'); if (!hit) return;
    const [id, entry] = entryOf(hit); if (!entry) return;
    drag = {id, entry, y: e.clientY, m: entry.ymult || 1}; e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.entry.ymult = Math.max(0.25, Math.min(8, drag.m * Math.exp((e.clientY - drag.y) / 120)));
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (drag) paint(drag.id); });
  });
  document.addEventListener('pointerup', () => { drag = null; });
  document.addEventListener('dblclick', e => {
    const hit = e.target.closest?.('.ct-svg .ct-yhit'); if (!hit) return;
    const [id, entry] = entryOf(hit); if (entry) { entry.ymult = 1; paint(id); }
  });

  const barOf = e => { const b = e.closest('.ct-switch'); return [b, b && registry.get(b.dataset.ctFor), b?.dataset.ctFor]; };
  document.addEventListener('click', e => {
    const c = e.target.closest?.('[data-ct-custom]');
    if (c) { const more = c.closest('.ct-switch').querySelector('.ct-more'); more.hidden = !more.hidden; c.setAttribute('aria-expanded', String(!more.hidden)); return; }
    const t = e.target.closest?.('[data-ct-table]');
    if (t) { const [, entry, id] = barOf(t); if (!entry) return; entry.table = !entry.table; t.setAttribute('aria-pressed', String(entry.table)); t.textContent = entry.table ? 'Chart' : 'Bảng'; paint(id); return; }
    const r = e.target.closest?.('[data-ct-reset]');
    if (r) { const [id, entry] = entryOf(r); if (entry) { entry.zoom = null; entry.calc = null; paint(id); } }
    const m = e.target.closest?.('.ct-menu button');
    if (m) { const [id, entry] = [menu.dataset.id, registry.get(menu.dataset.id)]; if (entry) { entry.calc = m.dataset.calc || null; paint(id); } }
    if (menu) menu.hidden = true;
  });
  // Nhấp đúp: bật/tắt số trên chart. Chuột phải: cách tính. Kéo: phóng to một đoạn.
  document.addEventListener('dblclick', e => { if (e.target.tagName !== 'CANVAS') return; const [id, entry] = entryOf(e.target); if (entry) { entry.labels = !entry.labels; paint(id); } });
  let menu;
  document.addEventListener('contextmenu', e => {
    if (e.target.tagName !== 'CANVAS') return; const [id, entry] = entryOf(e.target); if (!entry?.model.time) return; e.preventDefault();
    if (!menu) { menu = document.createElement('div'); menu.className = 'ct-menu'; menu.innerHTML = [['', 'Giá trị'], ['pct', '%Δ kỳ trước'], ['yoy', '%Δ cùng kỳ'], ['rebase', 'Rebase 100']].map(([k, t]) => `<button type="button" data-calc="${k}">${t}</button>`).join(''); document.body.append(menu); }
    menu.dataset.id = id; menu.hidden = false; menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px';
  });
  let zoomDrag = null;
  document.addEventListener('pointerdown', e => { if (e.target.tagName !== 'CANVAS' || e.button) return; const ch = Chart?.getChart?.(e.target), [id, entry] = entryOf(e.target); if (!ch || !entry?.model.time || ch.options.indexAxis === 'y') return; zoomDrag = {ch, id, entry, x: e.offsetX}; });
  document.addEventListener('pointerup', e => { if (!zoomDrag) return; const d = zoomDrag; zoomDrag = null; if (e.target !== d.ch.canvas || Math.abs(e.offsetX - d.x) < 24) return; const sc = d.ch.scales.x, a = sc.getValueForPixel(Math.min(d.x, e.offsetX)), b = sc.getValueForPixel(Math.max(d.x, e.offsetX)), m = d.entry.model.categories.length, base = d.entry.zoom ? d.entry.zoom[0] : (d.entry.count && d.entry.count < m ? m - d.entry.count : 0); if (b > a) { d.entry.zoom = [base + Math.max(a, 0), base + b]; paint(d.id); } });
  // J / K: chart kế tiếp, chart trước trong tab đang mở.
  document.addEventListener('keydown', e => { if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || !/^[jk]$/i.test(e.key)) return; const cards = [...document.querySelectorAll('.card')].filter(c => c.offsetParent && c.querySelector('canvas')); if (!cards.length) return; const y = scrollY + 90, next = /j/i.test(e.key) ? cards.find(c => c.getBoundingClientRect().top + scrollY > y + 8) : cards.filter(c => c.getBoundingClientRect().top + scrollY < y - 8).pop(); if (next) scrollTo({top: next.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth'}); });
  window.ChartTypes = {mount, html, render, hbar, spark, balance, dots, useChart, TYPES};
})();
