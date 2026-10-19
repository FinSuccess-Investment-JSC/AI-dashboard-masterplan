/* Source-gap marker: after Wi data was removed (16/10/2026) some periodic charts and KPI tiles
   have no public source yet and render empty. Flag them in red so the gap is visible until a
   public-source script fills them. Purely visual; runs after every deferred dashboard script. */
(() => {
'use strict';
const NOTE='Chưa có nguồn thay thế Wi — đang tìm nguồn công khai';
function mark(){
 document.querySelectorAll('.card[data-update-kind="periodic"]').forEach(card=>{
  if(card.classList.contains('source-gap'))return;
  const hosts=[...card.querySelectorAll('div[id^="ch"]')];
  if(!hosts.length||hosts.some(h=>h.childElementCount)||card.querySelector('table tr'))return;  // a filled table counts as data (e.g. series too short to chart)
  card.classList.add('source-gap');
  const n=document.createElement('div');n.className='source-gap-note';n.textContent=NOTE;
  hosts[0].before(n);
 });
 document.querySelectorAll('.kpi').forEach(k=>{
  const v=k.querySelector('.value'),s=k.querySelector('.sub');
  if(!v||k.classList.contains('source-gap'))return;
  if(v.textContent.trim()==='—'&&(!s||/tạm trống|^—?$/i.test(s.textContent.trim()))){
   k.classList.add('source-gap');k.title=NOTE;if(s)s.textContent='Chưa có nguồn thay thế';
  }
 });
}
if(document.readyState==='complete')mark();else window.addEventListener('load',mark);
})();
