/* Source provenance is one hover/focus/click away; critical qualifiers remain on charts. */
(() => {
'use strict';
const R=window.ResearchLayout;if(!R)return;const {make,sector,sources}=R;
const $=s=>document.querySelector(s);let index=0;
function popover(host,nodes,title){
 const button=make('button','chart-info-button chart-source-action','ⓘ Nguồn');button.type='button';button.setAttribute('aria-label','Nguồn: '+title);button.setAttribute('aria-expanded','false');
 const panel=make('div','chart-info-panel source-popover');panel.id='research-source-'+index++;panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-label','Nguồn và phương pháp: '+title);panel.append(make('div','info-heading',title),...nodes);button.setAttribute('aria-controls',panel.id);host.append(button);document.body.append(panel);window.DashboardPopover.wire(button,panel);return panel;
}
// The old qualitative OPEC table becomes measured charts plus a labelled qualitative supply map.
if(sector==='oil'){
 const original=$('.global-balance-table'),parent=original?.closest('.card');
 if(original&&parent){
  const card=make('section','card opec-drivers');card.id='opec-drivers';card.append(make('h3','chart-title','Động lực cung cầu thế giới'),make('p','chart-sub','Triệu thùng/ngày · bản nguồn tháng 8/2026'));
  const grid=make('div','opec-driver-grid');card.append(grid);
  function bars(title,rows,note){
   const n=make('article','opec-driver'),h=make('h4','',title);n.append(h);const bound=Math.max(...rows.map(r=>Math.abs(r[1])))*1.25||1;const W=450,H=rows.length*62+35,zero=215,scale=145/bound;
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',title+'. '+rows.map(r=>r[0]+': '+r[1]+' triệu thùng/ngày').join('; '));
   function el(tag,attrs,text){const e=document.createElementNS(svg.namespaceURI,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;svg.append(e);return e}
   el('line',{x1:zero,x2:zero,y1:0,y2:H-20,stroke:'#bacbd2'});
   rows.forEach(([label,value,color],i)=>{const y=i*62+15,w=Math.abs(value)*scale;el('text',{x:12,y:y+2,fill:'#516479','font-size':12},label);const r=el('rect',{x:value<0?zero-w:zero,y:y+13,width:w,height:16,rx:3,fill:color});const t=document.createElementNS(svg.namespaceURI,'title');t.textContent=label+': '+value+' triệu thùng/ngày';r.append(t);el('text',{x:zero+(value<0?-w-7:w+7),y:y+27,'text-anchor':value<0?'end':'start',fill:'#19384d','font-size':14,'font-weight':700},(value>0?'+':'')+String(value).replace('.',','));});n.append(svg,make('p','chart-sub',note));grid.append(n);
  }
  bars('OPEC+ & gián đoạn',[['OPEC+ so với mục tiêu',-6,'#d49771'],['Vùng Vịnh so với trước chiến sự',-8.3,'#bf7964']],'T7/2026, IEA · hai mẫu so sánh khác nhau, không cộng.');
  const non=make('article','opec-driver');non.append(make('h4','','Nguồn cung ngoài OPEC'));const map=make('div','non-opec-map');['Mỹ','Brazil','Canada','Guyana','Argentina','Na Uy'].forEach(t=>map.append(make('span','',t)));non.append(map,make('div','non-opec-arrow','↓'),make('p','non-opec-target','Theo dõi sản lượng bổ sung'),make('p','chart-sub','Định tính · chưa lượng hóa từng nước.'));grid.append(non);
  bars('Tăng trưởng cầu 2026',[['IEA',-1.6,'#738fa9'],['OPEC',0.58,'#4b9b87']],'YoY · dự báo tại T8/2026.');
  bars('Nguồn cung & lọc dầu',[['Cung toàn cầu 2026E',-4.3,'#698dac'],['Chạy lọc dầu T7/2026 ≈',-5,'#a192ad']],'YoY · cung: cả năm 2026E; lọc dầu: T7/2026.');
  const foot=make('div','chart-footer'),actions=make('div','chart-card-actions');foot.append(actions);card.append(foot);
  const archive=make('details','chart-source-details');archive.append(make('summary','','Bảng và luận giải gốc'));const body=make('div','source-details-body');body.append(original.closest('.tablewrap'));parent.querySelectorAll(':scope > .srcrow').forEach(n=>body.append(n.cloneNode(true)));archive.append(body);actions.append(archive);
  const insight=make('div','chart-insight','Các số đo dùng mẫu so sánh khác nhau. OPEC+ dưới mục tiêu không phải cùng đại lượng với thay đổi sản lượng toàn cầu. So IEA với OPEC giúp thấy bất định về cầu; danh sách nguồn cung ngoài OPEC chưa phải lượng bù đắp được xác nhận.');
  const ai=make('button','chart-info-button chart-insight-action','ⓘ Insight');ai.type='button';ai.setAttribute('aria-expanded','false');const aiPanel=make('div','chart-info-panel');aiPanel.id='opec-insight';aiPanel.hidden=true;aiPanel.setAttribute('role','region');aiPanel.append(insight);ai.setAttribute('aria-controls',aiPanel.id);ai.setAttribute('aria-label','Insight: Động lực cung cầu thế giới');actions.prepend(ai);document.body.append(aiPanel);window.DashboardPopover.wire(ai,aiPanel);
  parent.after(card);
  // OPEC capacity is also part of the global picture, before the US inventories.
  const capacity=document.querySelector('[data-block-id="dau-khi-12"]');if(capacity)card.after(capacity);
  const intro=parent.querySelector(':scope > p');if(intro){const d=make('details');d.append(make('summary','','Cách đọc cân bằng thế giới'),intro);body.append(d)}
 }
}
const register=make('section','source-register');register.append(make('h3','','Nguồn theo biểu đồ'));const list=make('div','source-register-list');register.append(list);sources.append(register);
// Collect existing source footer nodes. Methods/tables keep their IDs and listeners.
[...document.querySelectorAll('.chart-footer')].forEach(foot=>{
 const card=foot.closest('.card,.viz-block,.opec-drivers');if(!card||sources.contains(card))return;
 const title=card.querySelector('.chart-title,h3')?.childNodes[0]?.textContent?.trim()||'Biểu đồ';let actions=foot.querySelector('.chart-card-actions');if(!actions){actions=make('div','chart-card-actions');foot.append(actions)}
 const nodes=[...foot.querySelectorAll(':scope > .chart-source-line,.chart-source-details')];
 // Source notes retained by the prior layout now live in the source popup too.
 [...card.querySelectorAll(':scope > .source-note,:scope > .cadence-note,:scope > .srcrow,:scope > .source-links')].filter(n=>!n.matches('.data-gap,.gap-row')&&!n.querySelector('.data-gap,.gap-row')).forEach(n=>nodes.push(n));
 if(!nodes.length)return;
 const panel=popover(actions,nodes,title);
 panel.querySelectorAll('details.chart-source-details').forEach(d=>d.open=true);
 const item=make('details','research-fold');item.append(make('summary','',title));const body=make('div','research-detail');const links=new Map();panel.querySelectorAll('a[href^="http"]').forEach(a=>links.set(a.href,a.textContent));links.forEach((text,url)=>{const a=make('a','',text);a.href=url;a.target='_blank';a.rel='noopener';body.append(a)});
 const meta=panel.querySelector('.chart-source-line')?.textContent;if(meta)body.prepend(make('p','',meta));const flag=foot.querySelector('.chart-caveat,.chart-freshness');if(flag)body.append(make('p','source-scope',flag.textContent));
 if(!links.size)body.append(make('p','','Nguồn và phương pháp mở từ nút Nguồn của biểu đồ.'));item.append(body);list.append(item);
});
// Numeric comparison uses the same interaction as chart sources.
const comparison=document.querySelector('.comparison-source');if(comparison){const host=make('div','comparison-source-action');comparison.before(host);const body=comparison.querySelector('.comparison-source-body');popover(host,[body],'So sánh tài chính & định giá');comparison.remove()}
// Broad source-only blocks and provenance outside chart footers belong to Sources.
const oldPlayers=document.querySelector(`[data-block-id="${sector==='oil'?'dau-khi-03':'sugar-03'}"]`);if(oldPlayers)oldPlayers.remove();
const global=document.querySelector('[data-block-id="dau-khi-05"]');if(global){
 const notes=[...global.querySelectorAll(':scope > .source-note,:scope > .srcrow')];if(notes.length){const host=make('div','chart-card-actions');global.append(host);popover(host,notes,'Cân bằng cung cầu toàn cầu')}
}
// Close source/insight popovers when the main or geographic context changes.
document.querySelectorAll('.majortabbtn,.supply-tabs button,.subtabs button,.world-subtabs button').forEach(b=>b.addEventListener('click',window.DashboardPopover.close));
document.body.dataset.sourcesReady='true';
})();
