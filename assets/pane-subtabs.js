/* Sub-tabs inside a major tab, same look as Bức tranh ngành (Thế giới / Việt Nam).
   Groups are explicit selector lists per sector; nodes are moved, never cloned. */
(() => {
  'use strict';
  const oil=document.body.dataset.sector!=='power'&&document.body.dataset.sector!=='bank'&&!!document.getElementById('chCurve');
  if(!oil)return;
  const config={
    mt1:[['Chuỗi giá trị','.research-roadmap,.value-chain-card'],['Mô hình kinh doanh','.business-models'],['So sánh tài chính','.financial-comparison'],['Dashboard doanh nghiệp','.company-dashboard-links,:scope>.section']],
    mt4:[['Điều hành giá','.policy-impact,.policy-visuals,.card:has(h2,h3):not(:has(.compare-table))'],['Luật Dầu khí 2026','.card:has(.compare-table)']],
    mt8:[['Độ tin cậy','.focus-card,.classification-key,.update-legend'],['Nguồn dữ liệu','.card:not(.focus-card),.source-register'],['Tài liệu khác','.research-fold']]
  };
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n};
  Object.entries(config).forEach(([key,groups])=>{
    const pane=document.querySelector(`.majorpane[data-tab="${key}"]`);if(!pane)return;
    const root=key==='mt4'?pane.querySelector(':scope>.section')||pane:pane;
    const used=new Set(),panes=groups.map(([label,sel],i)=>{
      const nodes=[...root.querySelectorAll(':scope>*')].filter(n=>!used.has(n)&&sel.split(/,(?![^(]*\))/).some(s=>{try{return s.startsWith(':scope')?n.matches(s.replace(':scope>','')):n.matches(s)}catch{return false}}));
      nodes.forEach(n=>used.add(n));return {label,nodes,i};
    }).filter(g=>g.nodes.length);
    if(panes.length<2)return;
    const bar=make('div','supply-tabs pane-subtabs');bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Mục con');
    const first=panes[0].nodes[0];first.before(bar);
    let anchor=bar;
    const wraps=panes.map(({label,nodes,i})=>{
      const w=make('div','pane-subpane');w.id=`${key}-sub-${i}`;w.setAttribute('role','tabpanel');
      nodes.forEach(n=>w.append(n));anchor.after(w);anchor=w;
      const b=make('button','tabbtn',label);b.type='button';b.id=w.id+'-tab';b.setAttribute('role','tab');b.setAttribute('aria-controls',w.id);w.setAttribute('aria-labelledby',b.id);bar.append(b);
      return w;
    });
    // A sub-tab holding one folded block opens it; the sub-tab click already is the disclosure.
    const buttons=[...bar.children];
    const select=j=>{wraps.forEach((w,k)=>{w.hidden=k!==j;buttons[k].setAttribute('aria-selected',String(k===j));buttons[k].tabIndex=k===j?0:-1});const w=wraps[j];if(w.children.length===1){const d=w.querySelector('details');if(d&&!d.dataset.subOpened){d.open=true;d.dataset.subOpened='1'}}window.dispatchEvent(new Event('resize'))};
    buttons.forEach((b,j)=>{b.addEventListener('click',()=>select(j));b.addEventListener('keydown',e=>{const d={ArrowRight:1,ArrowLeft:-1}[e.key];if(!d)return;e.preventDefault();const n=(j+d+buttons.length)%buttons.length;select(n);buttons[n].focus()})});
    select(0);
  });
  // Links into a hidden sub-tab (e.g. evidence chips) open it first.
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');const t=a&&document.getElementById(a.getAttribute('href').slice(1));const w=t?.closest('.pane-subpane');if(w?.hidden)document.getElementById(w.id+'-tab')?.click()},true);
})();
