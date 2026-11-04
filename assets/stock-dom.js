/* Gắn class của Stock dashboard lên phần tử trang ngành để assets/brand.css áp dụng trực tiếp; không đổi nội dung. */
(() => {
'use strict';
const map=[['.container','wrap'],['.majortabs','tabs'],['.sectionhead h2','sec'],['.subhead','sub'],['.tablewrap','tbl-wrap'],['.grid.two','g2'],['.kpi .label','l'],['.kpi .value','v'],['.kpi .sub','s'],['.source-note','src'],['.supply-tabs,.pane-subtabs','subnav']];
const apply=()=>map.forEach(([sel,cls])=>document.querySelectorAll(sel).forEach(n=>n.classList.add(cls)));
apply();
// Bản tin dữ liệu đầu Tổng quan, cùng khung .db của Stock: tóm tắt + 4 ô số đầu tiên.
const pane=document.querySelector('.majorpane[data-tab="mt1"]'),kpis=[...document.querySelectorAll('.kpi')].filter(k=>k.querySelector('.value')?.textContent.trim()!=='—').slice(0,4);
const lead=window.SECTOR_BRIEF?.headline||'';
if(pane&&kpis.length&&lead){
 const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n};
 const db=make('section','db card'),left=make('div','db-l'),right=make('div','db-r'),k=make('div','db-k');db.id='dataBrief';
 k.append(make('span','db-dot'),'Bản tin dữ liệu');left.append(k,make('div','db-tk',document.querySelector('.research-header h1')?.textContent||''),make('p','db-lead',lead));
 kpis.forEach(c=>{const b=make('div','db-c card');b.append(make('div','db-ch',c.querySelector('.label').textContent),make('div','db-v',c.querySelector('.value').textContent),make('div','db-s',[c.querySelector('.delta')?.textContent,c.querySelector('.sub')?.textContent].filter(Boolean).join(' · ')));const sp=c.querySelector('[id^="spk-"]');right.append(b);if(sp?.ctValues){const h=make('div','db-spark');b.append(h);ChartTypes.spark(h,sp.ctValues.values,sp.ctValues.color)}});
 db.append(left,right);pane.prepend(db);
}
new MutationObserver(apply).observe(document.querySelector('.container')||document.body,{childList:true,subtree:true});
})();
