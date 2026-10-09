/* Sub-tabs inside a major tab, same look as Bức tranh ngành (Thế giới / Việt Nam).
   Groups are explicit selector lists per sector; nodes are moved, never cloned. */
(() => {
  'use strict';
  const sector=document.body.dataset.sector==='power'?'power':document.body.dataset.sector==='bank'?'bank':document.body.dataset.sector==='realestate'?'realestate':document.body.dataset.sector==='textile'?'textile':document.body.dataset.sector==='port'?'port':document.getElementById('chCurve')?'oil':'sugar';
  const card=i=>(n,root)=>[...root.children].filter(c=>c.matches('.card'))[i]===n;
  const common={
    mt1:[['Chuỗi giá trị','.research-roadmap,.value-chain-card'],['Mô hình kinh doanh','.business-models'],['So sánh tài chính','.financial-comparison']],
    mt8:[['Độ tin cậy','.focus-card,.classification-key,.update-legend'],['Nguồn dữ liệu','.card:not(.focus-card),.source-register'],['Tài liệu khác','.research-fold']]
  };
  const config={
    oil:{...common,mt4:[['Điều hành giá','.policy-impact,.policy-visuals,.card:has(h2,h3):not(:has(.compare-table))'],['Luật Dầu khí 2026','.card:has(.compare-table)']]},
    power:{...common,mt1:[...common.mt1,['Doanh nghiệp theo dõi',':scope>.section']],mt4:[['Giá điện',card(0)],['Quy hoạch điện VIII',card(1)],['DPPA & điện mái nhà',card(2)]]},
    sugar:{...common,mt1:[...common.mt1,['Mùa vụ & sản phẩm phụ',':scope>.section']]},
    realestate:{...common,mt1:[...common.mt1,['Doanh nghiệp theo dõi','.grid.two']],mt4:[['Đất đai & bảng giá đất',card(0)],['Nhà ở & NOXH',card(1)],['Tín dụng & trái phiếu',card(2)],['Khu công nghiệp',card(3)]],mt10:[['Trái phiếu BĐS','.bds-bond'],['Tín dụng & lãi suất','.bds-credit']],mt11:[['Khung pháp lý','.bds-legal'],['Bảng giá đất','.bds-landprice'],['Dự án theo dõi','.bds-projects']]},
    port:{...common,mt1:[['Chuỗi giá trị','.research-roadmap,.value-chain-card'],['Mô hình kinh doanh','.business-models'],['Giá cước & bốc xếp','.port-prices'],['So sánh tài chính','.financial-comparison,.sector-valuation'],['Doanh nghiệp theo dõi','[data-block-id="cg-03"]']],mt4:[['Giá dịch vụ cảng',card(0)],['Quy hoạch & đầu tư',card(1)]]},
    textile:{...common,mt1:[['Chuỗi giá trị','.research-roadmap,.value-chain-card'],['Mô hình kinh doanh','.business-models'],['So sánh tài chính','.financial-comparison,.sector-valuation'],['Doanh nghiệp theo dõi','.grid.two']],mt4:[['Chính sách trong nước & EU',card(0)],['Phòng vệ thương mại sợi',card(1)]]},
    bank:{
      mt1:[['Luồng vốn','.research-roadmap,.card:not(.compact-chart-card)'],['Mô hình kinh doanh','.business-models,.bank-framework'],['So sánh tài chính','.financial-comparison'],['Đọc nhanh','.grid.two,.sectionhead:not(:first-child),.monitor-grid']],
      mt4:[['Mốc pháp lý','.policy-impact,.card'],['Room tín dụng','.grid.two,.note']],
      mt8:common.mt8
    }
  };
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n};
  Object.entries(config[sector]).forEach(([key,groups])=>{
    const pane=document.querySelector(`.majorpane[data-tab="${key}"]`);if(!pane)return;
    const root=key==='mt4'?pane.querySelector(':scope>.section')||pane:pane;
    const used=new Set(),panes=groups.map(([label,sel],i)=>{
      const nodes=[...root.querySelectorAll(':scope>*')].filter(n=>!used.has(n)&&(typeof sel==='function'?sel(n,root):sel.split(/,(?![^(]*\))/).some(s=>{try{return s.startsWith(':scope')?n.matches(s.replace(':scope>','')):n.matches(s)}catch{return false}})));
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
