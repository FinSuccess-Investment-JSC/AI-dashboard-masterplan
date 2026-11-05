/* Sắp xếp bố cục chart: bấm nút "Bố cục" (góc dưới phải) để bật chế độ sắp xếp.
   Mỗi card chart có tay kéo ⠿ (góc trên trái) để đổi chỗ với card khác trong cùng khu vực,
   và góc kéo ◢ (dưới phải) để đổi rộng theo lưới 12 cột (3/4/6/8/9/12) và cao theo bước 20px.
   Lưu theo trình duyệt (localStorage, theo trang); "Mặc định" trả bố cục gốc.
   Dùng chung cho Stock dashboard và dashboard ngành (sao nguyên văn, như share-image.js). */
(function(){
  if(window.FinChartArrange)return;
  const NAVY='#1D2678',LINE='#dce1e9',SPANS=[3,4,6,8,9,12],STEP=20,MINH=60,MAXH=960;
  const KEY='fs-arrange:'+location.pathname;
  const css=`.fs-arr-toggle{position:fixed;right:16px;bottom:88px;z-index:900;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border:1px solid ${LINE};border-radius:999px;background:#fff;color:${NAVY};font:600 13px Inter,Arial,system-ui,sans-serif;box-shadow:0 4px 14px rgba(16,22,48,.12);cursor:pointer}
.fs-arr-toggle[aria-pressed=true]{background:${NAVY};border-color:${NAVY};color:#fff}
.fs-arr-reset{position:fixed;right:16px;bottom:132px;z-index:900;height:32px;padding:0 12px;border:1px solid ${LINE};border-radius:999px;background:#fff;color:#596272;font:600 12.5px Inter,Arial,system-ui,sans-serif;cursor:pointer;display:none}
body.fs-arr-on .fs-arr-reset{display:inline-block}
.fs-arr-grid{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;align-items:start}
.fs-arr-grid>*{grid-column:span 12;min-width:0}
body.fs-arr-on .fs-arr-card{outline:1.5px dashed #9aa6d6;outline-offset:2px}
.fs-arr-handle,.fs-arr-size{display:none}
body.fs-arr-on .fs-arr-handle{display:grid;place-items:center;position:absolute;left:6px;top:6px;z-index:5;width:26px;height:26px;border:1px solid ${LINE};border-radius:8px;background:#fff;color:${NAVY};font:700 15px/1 Arial,sans-serif;cursor:grab;touch-action:none}
body.fs-arr-on .fs-arr-size{display:block;position:absolute;right:2px;bottom:2px;z-index:5;width:18px;height:18px;cursor:nwse-resize;touch-action:none;background:linear-gradient(135deg,transparent 50%,${NAVY} 50%);border-radius:0 0 8px 0;opacity:.75}
.fs-arr-card.fs-arr-drag{opacity:.45}
.fs-arr-card.fs-arr-over-before{box-shadow:-4px 0 0 0 #D4A72C}
.fs-arr-card.fs-arr-over-after{box-shadow:4px 0 0 0 #D4A72C}
.fs-arr-tip{position:fixed;z-index:9998;padding:4px 8px;border-radius:6px;background:${NAVY};color:#fff;font:600 12px Inter,Arial,sans-serif;pointer-events:none}
@media(max-width:760px){.fs-arr-toggle,.fs-arr-reset{display:none!important}.fs-arr-grid>*{grid-column:span 12!important}}`;
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}};
  const el=(t,c,x)=>{const n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n};
  const clean=t=>String(t||'').replace(/\s+/g,' ').replace(/[ⓘ⛶]/g,'').trim().slice(0,80);
  function isCard(n){return n.nodeType===1&&n.classList.contains('fs-share-host')}
  function cardKey(card){
    if(card.dataset.fsArrKey)return card.dataset.fsArrKey;
    const h=card.querySelector('.chart-title,h3,h2,h4');const c=card.querySelector('canvas[id],[id^="ch"]');
    let t=clean(h&&h.textContent);
    if(!t){const n=[...card.querySelectorAll('div,span,p,strong')].find(x=>!x.children.length&&!x.closest('button')&&x.textContent.trim());t=clean(n&&n.textContent)}
    return card.dataset.fsArrKey=t+'#'+(c?c.id:'');
  }
  function childKey(n,i){return isCard(n)?cardKey(n):'x'+i+':'+n.tagName}
  function boxKey(box){
    if(box.dataset.fsArrBox)return box.dataset.fsArrBox;
    return box.dataset.fsArrBox=[...box.children].filter(isCard).map(cardKey).sort().join('|');
  }
  function chartBox(card){
    const c=card.querySelector('canvas')||card.querySelector('svg.chart,[id^="ch"] svg');return c&&c.parentElement;
  }
  function charts(card){return window.Chart&&Chart.getChart?[...card.querySelectorAll('canvas')].map(c=>Chart.getChart(c)).filter(Boolean):[]}
  function setHeight(card,h){
    const b=chartBox(card);if(!b)return;
    if(h){if(!b.dataset.fsArrH0)b.dataset.fsArrH0=b.style.height||'-';b.style.height=h+'px';b.style.maxHeight='none'}
    else if(b.dataset.fsArrH0){b.style.height=b.dataset.fsArrH0==='-'?'':b.dataset.fsArrH0;b.style.maxHeight='';delete b.dataset.fsArrH0}
    charts(card).forEach(ch=>{try{ch.resize()}catch(e){}});
  }
  // Chuyển khu vực sang lưới 12 cột, giữ bề rộng hiện tại của từng card (làm tròn về nấc gần nhất).
  function toGrid(box){
    if(box.classList.contains('fs-arr-grid'))return;
    const W=box.clientWidth||1,st=saved[boxKey(box)]||{};
    const spans=st.spans||{};
    [...box.children].forEach((n,i)=>{const k=childKey(n,i);if(spans[k]==null){const w=n.offsetWidth;spans[k]=w?snap(Math.round(w/W*12)):12}});
    box.classList.add('fs-arr-grid');
    [...box.children].forEach((n,i)=>{n.style.gridColumn='span '+spans[childKey(n,i)]});
    saved[boxKey(box)]=Object.assign(st,{spans});
  }
  function snap(n){return SPANS.reduce((a,b)=>Math.abs(b-n)<Math.abs(a-n)?b:a)}
  function record(box){
    const st=saved[boxKey(box)]||(saved[boxKey(box)]={spans:{}});
    st.order=[...box.children].filter(isCard).map(cardKey);persist();
  }
  function apply(box){
    const st=saved[boxKey(box)];if(!st)return;
    if(st.spans)toGrid(box);
    if(st.order){const cards=[...box.children].filter(isCard),slots=cards.map(c=>({c,next:c.nextSibling}));
      const byKey=new Map(cards.map(c=>[cardKey(c),c]));const ordered=st.order.map(k=>byKey.get(k)).filter(Boolean);
      cards.forEach(c=>{if(!ordered.includes(c))ordered.push(c)});
      // Đặt lại card vào đúng các vị trí card cũ (giữ chỗ các phần tử không phải card).
      const marks=cards.map(c=>{const m=document.createComment('fs');box.insertBefore(m,c);return m});
      ordered.forEach((c,i)=>box.insertBefore(c,marks[i]));marks.forEach(m=>m.remove());void slots}
    if(st.heights)[...box.children].filter(isCard).forEach(c=>{const h=st.heights[cardKey(c)];if(h)setHeight(c,h)});
  }
  function tip(text,x,y){let t=document.querySelector('.fs-arr-tip');if(!t){t=el('div','fs-arr-tip');document.body.append(t)}t.textContent=text;t.style.left=(x+14)+'px';t.style.top=(y+14)+'px'}
  const untip=()=>{const t=document.querySelector('.fs-arr-tip');if(t)t.remove()};
  function onDrag(card,e){
    e.preventDefault();e.stopPropagation();const box=card.parentElement;toGrid(box);card.classList.add('fs-arr-drag');
    let target=null,after=false;
    const clear=()=>box.querySelectorAll('.fs-arr-over-before,.fs-arr-over-after').forEach(n=>n.classList.remove('fs-arr-over-before','fs-arr-over-after'));
    const move=ev=>{const hit=document.elementFromPoint(ev.clientX,ev.clientY);const t=hit&&hit.closest('.fs-share-host');clear();target=null;
      if(t&&t!==card&&t.parentElement===box){const r=t.getBoundingClientRect();after=ev.clientX>r.left+r.width/2;target=t;t.classList.add(after?'fs-arr-over-after':'fs-arr-over-before');tip('Thả để đổi chỗ',ev.clientX,ev.clientY)}
      else tip(t&&t.parentElement!==box?'Chỉ đổi chỗ trong cùng khu vực':'Kéo tới card khác',ev.clientX,ev.clientY)};
    const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);clear();untip();card.classList.remove('fs-arr-drag');
      if(target){box.insertBefore(card,after?target.nextSibling:target);record(box)}};
    document.addEventListener('pointermove',move);document.addEventListener('pointerup',up);
  }
  function onSize(card,e){
    e.preventDefault();e.stopPropagation();const box=card.parentElement;toGrid(box);
    const W=box.clientWidth||1,x0=e.clientX,y0=e.clientY,w0=card.offsetWidth,b=chartBox(card),h0=b?b.offsetHeight:0;
    const st=saved[boxKey(box)];st.heights=st.heights||{};const k=cardKey(card);
    let span=st.spans[k]||12,h=st.heights[k]||0;
    const move=ev=>{span=snap(Math.max(1,Math.round((w0+ev.clientX-x0)/W*12)));card.style.gridColumn='span '+span;
      if(b&&Math.abs(ev.clientY-y0)>12){h=Math.min(MAXH,Math.max(MINH,Math.round((h0+ev.clientY-y0)/STEP)*STEP));setHeight(card,h)}
      tip('Rộng '+span+'/12'+(b?' · cao '+h+'px':''),ev.clientX,ev.clientY)};
    const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);untip();
      st.spans[k]=span;if(h)st.heights[k]=h;persist()};
    document.addEventListener('pointermove',move);document.addEventListener('pointerup',up);
  }
  function scan(){
    const boxes=new Set();
    document.querySelectorAll('.fs-share-host').forEach(card=>{
      if(card.closest('.fs-share-modal,.fs-arr-skip')||!card.parentElement)return;
      boxes.add(card.parentElement);
      if(card.dataset.fsArr)return;card.dataset.fsArr='1';card.classList.add('fs-arr-card');
      if(getComputedStyle(card).position==='static')card.style.position='relative';
      const hd=el('button','fs-arr-handle','⠿');hd.type='button';hd.title='Kéo để đổi chỗ';hd.setAttribute('aria-label','Kéo để đổi chỗ chart');
      const sz=el('span','fs-arr-size');sz.title='Kéo để đổi kích thước';
      hd.addEventListener('pointerdown',e=>onDrag(card,e));sz.addEventListener('pointerdown',e=>onSize(card,e));
      card.append(hd,sz);
    });
    boxes.forEach(box=>{if(!box.dataset.fsArrDone){box.dataset.fsArrDone='1';apply(box)}});
  }
  function reset(){
    try{localStorage.removeItem(KEY)}catch(e){}saved={};location.reload();
  }
  function init(){
    const s=el('style');s.textContent=css;document.head.append(s);
    const tg=el('button','fs-arr-toggle','⇲ Bố cục');tg.type='button';tg.title='Sắp xếp chart: kéo ⠿ để đổi chỗ, kéo góc ◢ để đổi kích thước';tg.setAttribute('aria-pressed','false');
    const rs=el('button','fs-arr-reset','Bố cục mặc định');rs.type='button';rs.onclick=reset;
    tg.onclick=()=>{const on=!document.body.classList.contains('fs-arr-on');document.body.classList.toggle('fs-arr-on',on);tg.setAttribute('aria-pressed',String(on));tg.textContent=on?'✓ Xong':'⇲ Bố cục';if(on)scan()};
    document.body.append(rs,tg);
    scan();setTimeout(scan,1600);setTimeout(scan,4200);
    document.addEventListener('click',()=>setTimeout(scan,300),true);
  }
  window.FinChartArrange={scan,reset};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
