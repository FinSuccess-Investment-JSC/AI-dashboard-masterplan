/* Gắn class của Stock dashboard lên phần tử trang ngành để assets/brand.css áp dụng trực tiếp; không đổi nội dung. */
(() => {
'use strict';
const map=[['.container','wrap'],['.majortabs','tabs'],['.sectionhead h2','sec'],['.subhead','sub'],['.tablewrap','tbl-wrap'],['.grid.two','g2'],['.kpi .label','l'],['.kpi .value','v'],['.kpi .sub','s'],['.source-note','src'],['.supply-tabs,.pane-subtabs','subnav']];
const apply=()=>map.forEach(([sel,cls])=>document.querySelectorAll(sel).forEach(n=>n.classList.add(cls)));
apply();
// Bản tin dữ liệu đầu Tổng quan, cùng khung .db của Stock: tóm tắt + 4 ô số đầu tiên.
const pane=document.querySelector('.majorpane[data-tab="mt1"]'),kpis=[...document.querySelectorAll('.kpi')].filter(k=>k.querySelector('.value')?.textContent.trim()!=='—').slice(0,4);
const lead=window.SECTOR_BRIEF?.headline||'';
if(pane&&kpis.length){ // ô số vẫn hiện; câu dẫn (kết luận tab Động lực · Rủi ro) đã bỏ 25/11/2026
 const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n};
 const db=make('section','db card'),left=make('div','db-l'),right=make('div','db-r'),k=make('div','db-k');db.id='dataBrief';
 k.append(make('span','db-dot'),'Bản tin dữ liệu');left.append(k,make('div','db-tk',document.querySelector('.research-header h1')?.textContent||''),...(lead?[make('p','db-lead',lead)]:[]));
 kpis.forEach(c=>{const b=make('div','db-c card');b.append(make('div','db-ch',c.querySelector('.label').textContent),...(()=>{const ve=c.querySelector('.value'),ue=ve.querySelector('.unit'),num=ue?ve.firstChild.textContent:ve.textContent,UR=/^(nghìn|triệu|tỷ|USD|CNY|VND|US cent|điểm|lượt|tấn|đồng|đ\/|%)/;let segs=[c.querySelector('.delta')?.textContent,c.querySelector('.sub')?.textContent].filter(Boolean).join(' · ').split(' · ');let unit=ue?.textContent||'';if(!unit){const i=segs.findIndex(x=>UR.test(x.trim())&&x.trim().length<=24);if(i>=0){unit=segs[i].trim();segs.splice(i,1)}}const v=make('div','db-v',num);if(unit)v.append(make('span','db-u',unit));const sc=c.querySelector('.kpi-scope')?.textContent;return[v,make('div','db-s',segs.join(' · ')),...(sc?[make('div','db-scope',sc)]:[])]})());const sp=c.querySelector('[id^="spk-"]');right.append(b);if(sp?.ctValues){const h=make('div','db-spark');b.append(h);ChartTypes.spark(h,sp.ctValues.values,sp.ctValues.color)}});
 const note=document.querySelector('.kpi-note');if(note)left.append(make('p','db-lead db-note',note.textContent));db.append(left,right);pane.prepend(db);
}
new MutationObserver(apply).observe(document.querySelector('.container')||document.body,{childList:true,subtree:true});
})();
