/* Two-column chart grids never leave an empty cell: when the number of cards is odd, the last
   one spans the row and shows its "how to read it" text beside the chart instead of a blank half.
   Counted from the DOM (not layout), so it also works for panes that are hidden at load. */
(() => {
  'use strict';
  const fullRow = k => { const cs = getComputedStyle(k); return cs.gridColumnEnd === '-1' || /span 2/.test(cs.gridColumnEnd); };
  const chartHost = k => k.querySelector('[id^="ch"]:not([id^="chain"]), svg.ct-svg, svg[viewBox^="0 0 580"]');
  // The insight lives in a popover panel (dashboard-ui.js) wired from the (i) button in the card heading.
  const insightOf = k => {
    const id = k.querySelector('.chart-info-button')?.getAttribute('aria-controls');
    return id ? [...(document.getElementById(id)?.querySelectorAll('.chart-insight') || [])] : [];
  };
  // A chart card sitting alone before a grid joins that grid, so cards flow in pairs.
  function joinGrids() {
    document.querySelectorAll('.supply-pane > .card, .pane-subpane > .card').forEach(c => {
      const next = c.nextElementSibling;
      if (chartHost(c) && next?.matches('.research-grid, .grid.two')) next.prepend(c);
    });
  }
  // Consecutive cards between full-row items (sub-headings, tables) form one segment; an odd segment ends in a lone card.
  function segments(g) {
    const out = []; let seg = [];
    [...g.children].forEach(k => { if (fullRow(k) || !k.matches('.card')) { if (seg.length) out.push(seg); seg = []; } else seg.push(k); });
    if (seg.length) out.push(seg);
    return out;
  }
  function balance() {
    joinGrids();
    document.querySelectorAll('.grid.two, .research-grid').forEach(g => {
      g.querySelectorAll(':scope > .card.is-lone, :scope > .card.is-lone-plain').forEach(c => { c.classList.remove('is-lone', 'is-lone-plain'); c.querySelector(':scope > .lone-aside')?.remove(); });
      segments(g).forEach(seg => {
        if (seg.length % 2 === 0) return;
        const last = seg.at(-1), notes = chartHost(last) ? insightOf(last) : [];
        if (!notes.length) { last.classList.add('is-lone-plain'); return; } // no reading text to show: still take the full row
        const aside = document.createElement('aside');
        aside.className = 'lone-aside';
        notes.forEach(n => aside.append(n.cloneNode(true)));
        last.append(aside);
        last.classList.add('is-lone');
      });
    });
  }
  // Insight panels are created by dashboard-ui.js; rebalance once everything has settled and on later DOM changes.
  let timer;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(balance, 150); };
  schedule();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
