/* Hình hóa dữ liệu ngành (28/10/2026): dải giá chạy, sparkline cho ô KPI, heatmap tăng trưởng YoY,
   sơ đồ dòng chảy theo giá trị thật. Chỉ đọc số từ window.*_PUBLIC (cùng nguồn với chart trên trang);
   không tính số mới ngoài YoY và chênh lệch, không đổi nội dung có sẵn. Load sau file *-public-data.js. */
(() => {
  'use strict';
  const key = Object.keys(window).find(k => /_PUBLIC$/.test(k) && window[k] && window[k].blocks);
  if (!key) return;
  const DATA = window[key];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nf = (v, d) => v == null ? '—' : Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
  const digits = v => Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 10 ? 1 : 2;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const mlabel = d => 'T' + (+d.slice(5, 7)) + '/' + d.slice(2, 4);

  // Chuỗi theo tháng: {id, name, unit, src, url, pts:[[yyyy-mm, value]]}
  const series = [];
  Object.entries(DATA.blocks).forEach(([blk, b]) => Object.entries(b.series || {}).forEach(([id, s]) => {
    if (!s || !Array.isArray(s.records) || s.time_type !== 'monthly') return;
    const pts = s.records.filter(r => r && r.value != null && isFinite(r.value)).map(r => [String(r.date).slice(0, 7), +r.value]);
    if (pts.length < 13) return;
    series.push({id, blk, name: s.name, unit: s.unit || '', src: s.source, url: s.url, pts});
  }));
  const yoyAt = (s, i) => {
    const [m, v] = s.pts[i], prev = String(+m.slice(0, 4) - 1) + m.slice(4), p = s.pts.find(x => x[0] === prev);
    if (!p || !p[1]) return null;
    return s.unit.trim() === '%' ? v - p[1] : (v / p[1] - 1) * 100;  // chuỗi % thì so điểm %
  };
  const yoy = s => yoyAt(s, s.pts.length - 1);
  const chg = (v, isPP) => v == null ? '' : `<span class="${v >= 0 ? 'fsv-up' : 'fsv-dn'}">${v >= 0 ? '▲ +' : '▼ −'}${nf(Math.abs(v), 1)}${isPP ? ' điểm %' : '%'}</span>`;

  // Sparkline "xám trước, màu sau": 12 kỳ gần nhất có màu, điểm cuối nhấn.
  function spark(s, n = 36, w = 220, h = 34, color = '#2938A8') {
    const pts = s.pts.slice(-n), vs = pts.map(p => p[1]), lo = Math.min(...vs), hi = Math.max(...vs);
    const X = i => 2 + i * (w - 6) / Math.max(1, pts.length - 1), Y = v => h - 3 - (v - lo) / ((hi - lo) || 1) * (h - 8);
    const cut = Math.max(0, pts.length - 12), path = (a, b) => vs.slice(a, b).map((v, k) => (k ? 'L' : 'M') + X(a + k).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
    const e = vs.length - 1;
    return `<svg class="fsv-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${path(0, cut + 1)}" fill="none" stroke="#B9C1D0" stroke-width="1.5"/>
      <path d="${path(cut, e + 1)}L${X(e)} ${h}L${X(cut)} ${h}Z" fill="${color}" opacity=".10"/>
      <path d="${path(cut, e + 1)}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" class="fsv-line"/>
      <circle cx="${X(e)}" cy="${Y(vs[e])}" r="3" fill="${color}"/></svg>`;
  }

  /* ---------- 1. Dải giá chạy ---------- */
  function ticker() {
    if (document.querySelector('.fsv-ticker')) return;
    const tabs = document.querySelector('.majortabs'); if (!tabs) return;
    const items = series.filter(s => s.blk === 'commodity').map(s => {
      const last = s.pts.at(-1), y = yoy(s);
      return `<span class="fsv-tk" title="${esc(s.name)} · ${esc(s.unit)} · ${mlabel(last[0])}"><em>${esc(short(s.name))}</em><b>${nf(last[1], digits(last[1]))}</b>${chg(y)}</span>`;
    });
    Object.values(DATA.blocks.sector_ratio?.by_sector || {}).forEach(r => {
      const rec = r.records || [], last = rec.at(-1); if (!last) return;
      const ago = rec.filter(x => x[0] <= String(+last[0].slice(0, 4) - 1) + last[0].slice(4)).at(-1);
      const c = ago && ago[1] ? (last[1] / ago[1] - 1) * 100 : null;
      items.push(`<span class="fsv-tk" title="P/E rổ mã ${esc(r.name)} · phiên ${last[0]}"><em>P/E ${esc(r.name)}</em><b>${nf(last[1], 1)}x</b>${chg(c)}</span>`);
    });
    if (items.length < 2) return;
    const bar = document.createElement('div'); bar.className = 'fsv-ticker'; bar.setAttribute('aria-label', 'Giá hàng hóa và định giá ngành, so với cùng kỳ');
    const run = items.join('');
    bar.innerHTML = `<div class="fsv-tk-run">${run}<span class="fsv-tk-dup" aria-hidden="true">${run}</span></div>`;
    tabs.before(bar);
    if (reduce) bar.classList.add('still');
  }
  const short = n => String(n).replace(/\s*\(.*?\)\s*/g, ' ').replace(/,? (bình quân|giá|hợp đồng).*$/i, '').trim().slice(0, 26);

  /* ---------- 2. Sparkline cho ô KPI có sẵn (chỉ khi số trên ô khớp chuỗi) ---------- */
  const parseVi = t => { const m = String(t).match(/-?\d[\d.]*(?:,\d+)?/); return m ? parseFloat(m[0].replace(/\./g, '').replace(',', '.')) : null; };
  function kpiSparks() {
    document.querySelectorAll('.kpi').forEach(k => {
      if (k.dataset.fsvSpark) return; k.dataset.fsvSpark = '1';
      const v = parseVi(k.querySelector('.value')?.textContent); if (v == null || !v) return;
      const sub = (k.textContent || '').toLowerCase();
      const hit = series.find(s => {
        const last = s.pts.at(-1)[1];
        const ok = [1, 1e-3, 1e3].some(f => Math.abs(last * f - v) <= Math.abs(v) * 0.006 + 0.0051);
        if (!ok) return false;
        const m = s.pts.at(-1)[0];  // kỳ trên ô phải là kỳ cuối của chuỗi khi ô ghi kỳ
        const tag = sub.match(/t(\d{1,2})\/(\d{2,4})/);
        return !tag || (+tag[1] === +m.slice(5, 7) && m.slice(2, 4) === tag[2].slice(-2));
      });
      if (!hit) return;
      k.insertAdjacentHTML('beforeend', spark(hit, 24, 200, 30));
      k.classList.add('fsv-has-spark');
    });
  }

  /* ---------- 3. Heatmap tăng trưởng YoY ---------- */
  function heatmap() {
    const pane = document.getElementById('pane-mt2'); if (!pane || pane.querySelector('.fsv-heat')) return;
    const seenName = new Set(), rows = series.filter(s => s.unit.trim() !== '%' && s.pts.length >= 25 && !seenName.has(s.name) && seenName.add(s.name)).slice(0, 12); if (rows.length < 3) return;
    const months = [...new Set(rows.flatMap(s => s.pts.map(p => p[0])))].sort().slice(-24);
    const cell = v => {
      if (v == null) return '<td class="na">·</td>';
      if (Math.abs(v) > 300) return `<td class="big" style="--c:${v > 0 ? 'rgba(26,122,80,.75)' : 'rgba(179,48,63,.75)'};color:#fff" title="${v > 0 ? '+' : '−'}${nf(Math.abs(v), 0)}% · nền so sánh năm trước quá nhỏ">${v > 0 ? '≫' : '≪'}</td>`;
      const a = Math.min(1, Math.abs(v) / 40), bg = v >= 0 ? `rgba(26,122,80,${(.10 + a * .65).toFixed(2)})` : `rgba(179,48,63,${(.10 + a * .65).toFixed(2)})`;
      return `<td style="--c:${bg};color:${a > .55 ? '#fff' : 'inherit'}">${v >= 0 ? '+' : '−'}${nf(Math.abs(v), 0)}</td>`;
    };
    const body = rows.map(s => `<tr><th scope="row" title="${esc(s.name)} (${esc(s.unit)})">${esc(String(s.name).replace(/\s*\(.*?\)\s*/g, ' ').trim())}</th>${months.map(m => { const i = s.pts.findIndex(p => p[0] === m); return cell(i < 0 ? null : yoyAt(s, i)); }).join('')}</tr>`).join('');
    const head = months.map((m, i) => `<th>${i % 3 === 0 || i === months.length - 1 ? mlabel(m) : ''}</th>`).join('');
    const card = document.createElement('section'); card.className = 'card fsv-heat';
    card.innerHTML = `<div class="chart-title">Tăng trưởng so với cùng kỳ theo tháng (%)</div>
      <p class="fsv-note">Mỗi ô = tháng đó so với cùng tháng năm trước, tính từ chuỗi gốc trên trang. Xanh tăng, đỏ giảm; đậm hơn khi thay đổi lớn hơn.</p>
      <div class="fsv-heat-wrap" data-no-fold><table><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    const anchor = pane.querySelector('.grid.kpis');
    anchor ? anchor.after(card) : pane.prepend(card);
  }

  /* ---------- 4. Sơ đồ dòng chảy theo giá trị (theo ngành) ---------- */
  const FLOWS = {
    TEXTILE_PUBLIC: {
      title: 'Dòng tiền qua chuỗi dệt may (triệu USD)',
      nodes: {
        cot: [20, 50, 'Bông nhập', 'imp_cotton'], yin: [20, 150, 'Xơ, sợi nhập', 'imp_yarn'], fab: [20, 280, 'Vải nhập', 'imp_fabric'], mat: [20, 380, 'Phụ liệu nhập', 'imp_materials'],
        spin: [300, 50, 'Kéo sợi', null, 'STK · ADS'], weave: [300, 210, 'Dệt · nhuộm', null, 'chưa có số công khai'],
        sew: [580, 250, 'May', 'exp_textile', 'TCM · TNG · MSH · GIL'], yx: [580, 50, 'Sợi xuất khẩu', 'exp_yarn'],
        us: [870, 30, 'Mỹ', 'exp_textile_us'], jp: [870, 125, 'Nhật Bản', 'exp_textile_jp'], kr: [870, 220, 'Hàn Quốc', 'exp_textile_kr'], cn: [870, 315, 'Trung Quốc', 'exp_textile_cn'], oth: [870, 410, 'Thị trường khác', null, 'tổng trừ 4 nước']
      },
      edges: [['cot', 'spin', 'in', 'imp_cotton'], ['yin', 'weave', 'in', 'imp_yarn'], ['spin', 'weave'], ['spin', 'yx', 'out', 'exp_yarn'], ['weave', 'sew'],
        ['fab', 'sew', 'in', 'imp_fabric'], ['mat', 'sew', 'in', 'imp_materials'], ['sew', 'us', 'out', 'exp_textile_us'], ['sew', 'jp', 'out', 'exp_textile_jp'],
        ['sew', 'kr', 'out', 'exp_textile_kr'], ['sew', 'cn', 'out', 'exp_textile_cn'], ['sew', 'oth', 'out', '=other']],
      other: ['exp_textile', ['exp_textile_us', 'exp_textile_jp', 'exp_textile_kr', 'exp_textile_cn']]
    }
  };
  const byId = id => series.find(s => s.id === id);
  function flow() {
    const cfg = FLOWS[key]; if (!cfg) return;
    const anchor = document.querySelector('#pane-mt1 .value-chain-card'); if (!anchor || document.querySelector('.fsv-flow')) return;
    const last = id => byId(id)?.pts.at(-1);
    const base = last(cfg.other[0]); if (!base) return;
    const month = base[0], at = id => { const s = byId(id); const p = s?.pts.find(x => x[0] === month); return p ? p[1] : null; };
    const other = cfg.other[1].reduce((a, id) => a - (at(id) ?? NaN), at(cfg.other[0]));
    const val = k => k === '=other' ? (isFinite(other) ? other : null) : at(k);
    const W = 170, H = 70;
    const outs = {}, ins = {}; cfg.edges.forEach(e => { (outs[e[0]] ||= []).push(e); (ins[e[1]] ||= []).push(e); });
    const port = (list, e, n, side) => { const i = list.indexOf(e), k = list.length, N = cfg.nodes[n]; return [N[0] + (side ? W : 0), N[1] + H * (k === 1 ? .5 : .2 + .6 * i / (k - 1))]; };
    let edges = '', dots = '';
    cfg.edges.forEach((e, i) => {
      const a = port(outs[e[0]], e, e[0], 1), b = port(ins[e[1]], e, e[1], 0), dx = (b[0] - a[0]) / 2;
      const d = `M${a[0]} ${a[1]} C${a[0] + dx} ${a[1]},${b[0] - dx} ${b[1]},${b[0]} ${b[1]}`, v = e[3] ? val(e[3]) : null;
      if (v == null) { edges += `<path d="${d}" class="fsv-e nd"/>`; return; }
      const w = 2 + Math.sqrt(v) * 0.36, col = e[2] === 'in' ? '#59C5C8' : '#2938A8';
      edges += `<path id="fsv-e${i}" d="${d}" class="fsv-e" stroke="${col}" stroke-width="${w.toFixed(1)}"><title>${esc(cfg.nodes[e[0]][2])} → ${esc(cfg.nodes[e[1]][2])}: ${nf(v, 1)} triệu USD (${mlabel(month)})</title></path>`;
      const n = Math.max(2, Math.min(14, Math.round(v / 110)));
      dots += `<g data-e="${i}" data-v="${v}">` + Array.from({length: n}, () => `<circle r="${Math.min(4.5, 1.6 + w / 7).toFixed(1)}" fill="${col}"/>`).join('') + '</g>';
    });
    const nodes = Object.entries(cfg.nodes).map(([id, N]) => {
      const v = id === 'oth' ? val('=other') : N[3] ? at(N[3]) : null, s = N[3] && byId(N[3]), y = s ? yoy(s) : null;
      return `<g class="fsv-n"><rect x="${N[0]}" y="${N[1]}" width="${W}" height="${H}" rx="12"/><text x="${N[0] + 12}" y="${N[1] + 21}" class="t">${esc(N[2])}</text>` +
        (v != null ? `<text x="${N[0] + 12}" y="${N[1] + 47}" class="v">${nf(v, v >= 1000 ? 0 : 1)}</text>${y != null ? `<text x="${N[0] + W - 10}" y="${N[1] + 47}" text-anchor="end" class="${y >= 0 ? 'u' : 'd'}">${y >= 0 ? '▲' : '▼'} ${nf(Math.abs(y), 1)}%</text>` : ''}` : '') +
        (N[4] ? `<text x="${N[0] + 12}" y="${N[1] + (v != null ? 63 : 47)}" class="s">${esc(N[4])}</text>` : '') + '</g>';
    }).join('');
    const card = document.createElement('section'); card.className = 'card fsv-flow';
    card.innerHTML = `<div class="chart-title">${cfg.title}</div>
      <p class="fsv-note">${mlabel(month)} · độ dày mỗi dòng theo giá trị; hạt chạy dày hơn ở dòng lớn hơn; nét đứt là khâu chưa có số công khai. % là so với cùng kỳ.</p>
      <div class="fsv-flow-wrap"><svg viewBox="0 0 1060 500" role="img" aria-label="${esc(cfg.title)}">${edges}<g class="fsv-dots">${dots}</g>${nodes}</svg></div>`;
    anchor.before(card);
    const svg = card.querySelector('svg'), groups = [...svg.querySelectorAll('.fsv-dots g')].map(g => ({p: svg.querySelector('#fsv-e' + g.dataset.e), v: +g.dataset.v, c: [...g.children]}));
    groups.forEach(o => { o.len = o.p.getTotalLength(); });
    const place = t => groups.forEach(o => { const sp = 40 + Math.sqrt(o.v) * 2.2; o.c.forEach((c, i) => { const s = ((t / 1000) * sp + i * o.len / o.c.length) % o.len, pt = o.p.getPointAtLength(s); c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1)); c.style.opacity = Math.min(1, s / 26, (o.len - s) / 26).toFixed(2); }); });
    place(1500); if (reduce) return;
    let vis = false; new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; })).observe(svg);
    const t0 = performance.now(), loop = now => { if (vis && svg.isConnected) place(now - t0); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  function run() { ticker(); kpiSparks(); heatmap(); flow(); }
  if (document.readyState === 'complete') setTimeout(run, 400); else addEventListener('load', () => setTimeout(run, 400));
  document.addEventListener('click', e => { if (e.target.closest('.majortabbtn, .tabbtn')) setTimeout(() => { kpiSparks(); heatmap(); flow(); }, 350); });
})();
