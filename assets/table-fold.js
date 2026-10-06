/* Large data tables start collapsed (rule shared with the stock dashboards). Existing folds
   (.dtable, .wi-table-fold, research folds) already comply; this catches any new table with
   more than MIN_ROWS body rows that is not inside a <details>. Never folds a table that holds
   or sits in a data limitation (.data-gap/.gap-row), interactive comparison tables or tables
   marked data-no-fold. Open state survives re-renders within the page. */
(() => {
  'use strict';
  const MIN_ROWS = 8;
  const opened = new Set();
  const skip = t => t.closest('details,[data-no-fold],.data-gap,.gap-row') || t.querySelector('.data-gap,.gap-row') ||
    t.matches('.comparison-table,.compare-table');
  function label(t) {
    const cap = t.querySelector('caption')?.textContent.trim();
    if (cap) return cap;
    const prev = (t.closest('.table-scroll,.table-wrap') || t).previousElementSibling;
    if (prev && /^H[2-5]$/.test(prev.tagName)) return prev.textContent.trim();
    const title = t.closest('.card,.viz-block')?.querySelector('.chart-title')?.textContent.trim();
    return title ? 'Bảng số liệu · ' + title : 'Bảng số liệu';
  }
  function fold(root = document) {
    root.querySelectorAll('table').forEach(t => {
      const rows = t.querySelectorAll('tbody tr').length;
      if (rows <= MIN_ROWS || skip(t)) return;
      const box = t.closest('.table-scroll,.table-wrap') || t, key = label(t);
      const d = document.createElement('details'), s = document.createElement('summary'), body = document.createElement('div');
      d.className = 'table-fold'; body.className = 'table-fold-body';
      s.innerHTML = '<span class="table-fold-label"></span><span class="table-fold-meta"></span>';
      s.firstChild.textContent = key; s.lastChild.textContent = rows + ' dòng';
      box.before(d); body.append(box); d.append(s, body);
      if (opened.has(key)) d.open = true;
      d.addEventListener('toggle', () => { if (d.open) opened.add(key); else opened.delete(key); });
    });
  }
  let pending = 0;
  const run = () => { pending = 0; fold(); };
  function start() {
    fold();
    const hasTable = n => n.nodeType === 1 && (n.tagName === 'TABLE' || n.querySelector('table'));
    new MutationObserver(muts => {
      if (!pending && muts.some(m => [...m.addedNodes].some(hasTable))) pending = requestAnimationFrame(run);
    }).observe(document.body, {childList: true, subtree: true});
  }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
