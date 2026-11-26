/* Lớp chuyển động dùng chung (chỉ hình thức, không đổi chức năng). Tắt toàn bộ khi người xem bật
   giảm chuyển động; bản in không bị ảnh hưởng.
   1 Tương tác nhỏ: gợn sóng khi bấm nút · 2 Hover: thanh gạch chân trượt giữa các tab ·
   3 Chuyển tab: trượt theo hướng tab · 4 Tải trang: thanh tiến trình ở đỉnh ·
   5 Cuộn: card hiện lần lượt khi vào màn hình, nền lưới trôi chậm (parallax nhẹ) ·
   6 Điểm nhấn: bản tin hiện theo lớp, %D nháy một lần · 7 3D: nghiêng nhẹ theo chuột. */
(function(){
  const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOVER=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root=document.documentElement;
  if(REDUCED) return;
  root.classList.add('mo');

  /* 4 · Thanh tiến trình tải trang */
  const bar=document.createElement('div'); bar.className='mo-load'; document.body.prepend(bar);
  requestAnimationFrame(()=>bar.classList.add('run'));
  const done=()=>{bar.classList.add('done'); setTimeout(()=>bar.remove(),700);};
  if(document.readyState==='complete') setTimeout(done,600); else addEventListener('load',()=>setTimeout(done,300));

  /* 1 · Gợn sóng khi bấm nút (chỉ hiệu ứng, không chặn sự kiện) */
  document.addEventListener('pointerdown',e=>{
    const b=e.target.closest('button,.btn,.mkt-ti,.db-c,.tb-c,.fs-next'); if(!b||b.disabled) return;
    const r=b.getBoundingClientRect(), s=Math.max(r.width,r.height)*1.6;
    const w=document.createElement('span'); w.className='mo-ripple';
    w.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;
    if(getComputedStyle(b).position==='static') b.classList.add('mo-rel');
    b.append(w); setTimeout(()=>w.remove(),600);
  },{passive:true});

  /* 2 · Thanh gạch chân trượt giữa các tab */
  function tabInk(){
    const bar=document.getElementById('tabbar'); if(!bar||bar.querySelector('.mo-ink')) return;
    const ink=document.createElement('span'); ink.className='mo-ink'; bar.append(ink);
    const place=()=>{const a=bar.querySelector('button.active'); if(!a) return;
      ink.style.width=Math.max(a.offsetWidth-20,12)+'px'; ink.style.transform=`translateX(${a.offsetLeft+10}px)`;};
    place(); root.classList.add('mo-ink-on');
    new MutationObserver(place).observe(bar,{subtree:true,attributes:true,attributeFilter:['class']});
    addEventListener('resize',place);
  }

  /* 3 · Chuyển tab trượt theo hướng */
  let lastIdx=-1;
  function tabDir(){
    const btns=()=>[...document.querySelectorAll('#tabbar button[data-tab]')];
    lastIdx=btns().findIndex(b=>b.classList.contains('active'));
    document.querySelectorAll('section.tab').forEach(sec=>{sec.dataset.moOn=sec.classList.contains('active')?'1':'0';});
    // Chỉ chạy khi tab vừa chuyển sang active; tự đổi class mo-from-* sẽ kích hoạt lại observer,
    // nên phải nhớ trạng thái trước để không lặp vô hạn (từng làm đơ trang).
    document.querySelectorAll('section.tab').forEach(sec=>new MutationObserver(()=>{
      const on=sec.classList.contains('active');
      if(on===(sec.dataset.moOn==='1')) return;
      sec.dataset.moOn=on?'1':'0'; if(!on) return;
      const i=btns().findIndex(b=>b.dataset.tab===sec.id);
      sec.classList.remove('mo-from-l','mo-from-r'); void sec.offsetWidth;
      sec.classList.add(i>=lastIdx?'mo-from-r':'mo-from-l'); lastIdx=i;
      reveal(sec);
    }).observe(sec,{attributes:true,attributeFilter:['class']}));
  }

  /* 5 · Card hiện lần lượt khi vào màn hình (một lần), dự phòng hiện hết sau 2,5 giây */
  const seen=new WeakSet();
  const io='IntersectionObserver' in window?new IntersectionObserver(es=>{
    let k=0; es.forEach(e=>{ if(!e.isIntersecting) return; const el=e.target; io.unobserve(el);
      el.style.transitionDelay=Math.min(k++*60,240)+'ms'; el.classList.add('mo-in');
      setTimeout(()=>{el.style.transitionDelay='';},900); });
  },{rootMargin:'0px 0px -6% 0px',threshold:.06}):null;
  function reveal(scope){
    if(!io) return;
    (scope||document).querySelectorAll('section.tab.active .card:not(.card .card), section.tab.active .tb, .db').forEach(el=>{
      if(seen.has(el)) return; seen.add(el);
      const r=el.getBoundingClientRect(); if(r.top<innerHeight*.92){el.classList.add('mo-in');return;} // đã trong màn hình: hiện ngay
      el.classList.add('mo-pre'); io.observe(el);
      setTimeout(()=>el.classList.add('mo-in'),2500);
    });
  }

  /* 5 · Parallax nhẹ cho nền lưới chấm */
  let py=0; addEventListener('scroll',()=>{ if(py) return; py=requestAnimationFrame(()=>{py=0; root.style.setProperty('--mo-par',(scrollY*.25).toFixed(1)+'px');}); },{passive:true});

  /* 6 · Điểm nhấn: bản tin hiện theo lớp; %D nháy một lần */
  function hero(){
    const db=document.getElementById('dataBrief'); if(db) db.classList.add('mo-hero');
    const chg=document.querySelector('.mkt-chg'); if(chg) chg.classList.add('mo-flash1');
  }

  /* 7 · Nghiêng 3D theo chuột (tối đa ~4°) */
  function tilt(){
    if(!HOVER) return;
    const SEL='.db .db-c,#kpiRow .kpi,.vc .vc-chart';
    document.addEventListener('pointermove',e=>{
      const el=e.target.closest&&e.target.closest(SEL); if(!el) return;
      const r=el.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      const max=el.classList.contains('vc-chart')?2:4;
      el.style.transform=`perspective(900px) rotateX(${(-y*max).toFixed(2)}deg) rotateY(${(x*max).toFixed(2)}deg)`;
      el.classList.add('mo-tilt');
    },{passive:true});
    document.addEventListener('pointerout',e=>{
      const el=e.target.closest&&e.target.closest(SEL); if(!el||el.contains(e.relatedTarget)) return;
      el.style.transform='';
    },{passive:true});
  }

  function boot(){ tabInk(); tabDir(); reveal(); hero(); tilt();
    document.addEventListener('click',e=>{if(e.target.closest('#finSubnav')){const p=document.querySelector('#bs .fin-pane:not([hidden])'); if(p){p.classList.remove('mo-fade'); void p.offsetWidth; p.classList.add('mo-fade'); reveal(p);}}});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));
  else setTimeout(boot,300);
})();
