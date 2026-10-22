/* Chia sẻ ảnh chart: mỗi card có chart nhận nút "Chia sẻ ảnh", bấm vào tạo ảnh có logo FinSuccess,
   tên dashboard, tiêu đề chart, kỳ dữ liệu, link trang và dòng miễn trừ; cho chọn 16:9 / 4:5, sửa caption,
   chia sẻ (điện thoại), tải ảnh, chép ảnh, chép caption. Dùng chung cho Stock dashboard và dashboard ngành. */
(function(){
  if(window.FinShareImage)return;
  const H2C='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  const NAVY='#1D2678',INK='#303540',MUTED='#596272',LINE='#dce1e9',TEAL='#59C5C8';
  const RATIOS={wide:{w:1600,h:900,label:'Ngang 16:9',hint:'X · Telegram · Zalo'},tall:{w:1080,h:1350,label:'Dọc 4:5',hint:'Facebook · Instagram'}};
  const scriptSrc=(document.currentScript&&document.currentScript.src)||'';
  let lib=null,logo=null,state=null;

  const css=`.fs-share-btn{position:absolute;top:10px;right:10px;z-index:3;display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border:1px solid ${LINE};border-radius:999px;background:#fff;color:${NAVY};font:600 12px/1.3 Arial,system-ui,sans-serif;cursor:pointer;opacity:.78}
.fs-share-btn:hover,.fs-share-btn:focus-visible{opacity:1;border-color:${NAVY}}
.fs-share-host{position:relative}
.fs-share-host>h3:first-of-type,.fs-share-host>.chart-title:first-of-type{padding-right:118px}
.fs-share-modal{position:fixed;inset:0;z-index:9999;background:rgba(16,22,48,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Arial,system-ui,sans-serif}
.fs-share-box{background:#fff;color:${INK};border-radius:14px;width:min(1120px,100%);max-height:calc(100vh - 32px);overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.fs-share-head{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid ${LINE};font-weight:700;color:${NAVY}}
.fs-share-head button{border:0;background:none;font-size:22px;line-height:1;cursor:pointer;color:${MUTED}}
.fs-share-body{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:20px;padding:20px}
.fs-share-prev{background:#f3f5fa;border-radius:10px;display:flex;align-items:center;justify-content:center;min-height:260px;padding:12px}
.fs-share-prev img{max-width:100%;max-height:62vh;border-radius:6px;box-shadow:0 4px 18px rgba(0,0,0,.12)}
.fs-share-ratio{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fs-share-ratio button{text-align:left;padding:10px 12px;border:1px solid ${LINE};border-radius:10px;background:#fff;cursor:pointer;font:600 14px Arial,system-ui,sans-serif;color:${INK}}
.fs-share-ratio button small{display:block;font-weight:400;color:${MUTED};margin-top:3px}
.fs-share-ratio button[aria-pressed="true"]{border-color:${NAVY};background:#f0f4ff}
.fs-share-side label{display:block;margin:16px 0 6px;font-size:12px;letter-spacing:.06em;color:${MUTED};font-weight:700}
.fs-share-side textarea{width:100%;box-sizing:border-box;min-height:150px;padding:10px;border:1px solid ${LINE};border-radius:10px;font:14px/1.5 Arial,system-ui,sans-serif;color:${INK};resize:vertical}
.fs-share-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.fs-share-acts button{padding:11px;border:1px solid ${LINE};border-radius:10px;background:#fff;font:600 14px Arial,system-ui,sans-serif;color:${INK};cursor:pointer}
.fs-share-acts .primary{grid-column:1/-1;background:${NAVY};border-color:${NAVY};color:#fff}
.fs-share-acts button:disabled{opacity:.5;cursor:wait}
.fs-share-tip{margin-top:12px;font-size:12px;color:${MUTED};line-height:1.5}
.fs-share-msg{min-height:18px;margin-top:8px;font-size:13px;color:#256f72;font-weight:600}
@media(max-width:760px){.fs-share-body{grid-template-columns:1fr;padding:14px}.fs-share-btn span{display:none}.fs-share-host>h3:first-of-type,.fs-share-host>.chart-title:first-of-type{padding-right:44px}}
@media print{.fs-share-btn{display:none}}`;

  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
  function clean(t){return String(t||'').replace(/\s+/g,' ').replace(/[ⓘ]\s*(Insight)?/g,'').trim()}
  function loadLib(){
    if(window.html2canvas)return Promise.resolve(window.html2canvas);
    if(lib)return lib;
    lib=new Promise((ok,fail)=>{const s=document.createElement('script');s.src=H2C;s.onload=()=>ok(window.html2canvas);s.onerror=()=>{lib=null;fail(new Error('Không tải được thư viện chụp ảnh'))};document.head.append(s)});
    return lib;
  }
  function loadLogo(){
    if(logo)return logo;
    const img=document.querySelector('img.logo,.brand img,img[src*="logo"]');
    const src=img?img.src:(scriptSrc?new URL('fin-success-logo.png',scriptSrc).href:'');
    logo=new Promise(ok=>{if(!src)return ok(null);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src});
    return logo;
  }
  function D_GLOBAL(){try{return eval('typeof D!=="undefined"?D:undefined')}catch(e){return undefined}}
  function pageInfo(){
    // D của Stock dashboard là const toàn cục, không nằm trên window.
    const data=window.D||D_GLOBAL(),M=data&&data.meta;
    const ticker=(M&&M.ticker)||'';
    const band=document.querySelector('.titleband h1,header h1,h1');
    const name=ticker?clean(band&&band.textContent):document.title.split(/\s[·|]\s/)[0].trim();
    const updated=M&&M.updated?M.updated.split('-').reverse().join('/'):'';
    return {ticker,name,updated};
  }
  function cardInfo(card){
    const h=card.querySelector('.chart-title,h3,h2');
    // Bỏ nút chọn kiểu chart, icon ⓘ… nằm trong tiêu đề.
    const hc=h&&h.cloneNode(true);if(hc)hc.querySelectorAll('button,select,input,[role="group"],[class*="info"],[class*="toggle"],[class*="ctl"]').forEach(n=>n.remove());
    const title=clean(hc&&hc.textContent).replace(/\s+i$/,'')||'Biểu đồ';
    // Dashboard ngành chuyển dòng nguồn sang panel riêng (aria-controls của nút Nguồn).
    const srcBtn=card.querySelector('.chart-source-action'),panel=srcBtn&&document.getElementById(srcBtn.getAttribute('aria-controls'));
    const line=card.querySelector('.chart-source-line')||(panel&&panel.querySelector('.chart-source-line'));
    const m=line&&line.textContent.match(/Kỳ\s+([^·]+?)(?=Kiểm|Công bố|$)/);
    const period=m?clean(m[1]):'';
    const src=line&&line.querySelector('a');
    return {title,period,source:clean(src&&src.textContent)};
  }
  function pageUrl(){return location.origin+location.pathname+location.hash}
  function caption(p,c,url){
    const head=(p.ticker?p.ticker+' — ':'')+p.name;
    const lines=[head,'',c.title,''];
    if(c.period)lines.push('Kỳ dữ liệu: '+c.period);
    if(p.updated)lines.push('Dữ liệu được cập nhật đến '+p.updated);
    if(c.source)lines.push('Nguồn: '+c.source);
    lines.push('Xem đầy đủ: '+url);
    if(p.ticker)lines.push('$'+p.ticker);
    return lines.join('\n');
  }
  async function snapshot(card){
    const h2c=await loadLib();
    return h2c(card,{backgroundColor:'#ffffff',scale:Math.min(2.5,Math.max(2,window.devicePixelRatio||1)),useCORS:true,logging:false,
      ignoreElements:n=>n.tagName==='BUTTON'||n.tagName==='SELECT'||n.classList&&(n.classList.contains('fs-share-btn')||n.classList.contains('chart-card-actions')||n.classList.contains('chart-source-details')||n.tagName==='DETAILS'&&!n.open)});
  }
  function wrapText(ctx,text,maxW,maxLines){
    const words=text.split(' '),out=[];let cur='';
    for(const w of words){const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=w}else cur=t}
    if(cur)out.push(cur);
    if(out.length>maxLines){out.length=maxLines;out[maxLines-1]=out[maxLines-1].replace(/\s*\S*$/,'')+'…'}
    return out;
  }
  async function compose(shot,ratio,p,c,url){
    const R=RATIOS[ratio],W=R.w,Hh=R.h,cv=document.createElement('canvas');cv.width=W;cv.height=Hh;
    const ctx=cv.getContext('2d'),pad=Math.round(W*0.04),font='Arial, "Helvetica Neue", sans-serif';
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,Hh);
    ctx.fillStyle=NAVY;ctx.fillRect(0,0,W,10);ctx.fillStyle=TEAL;ctx.fillRect(0,10,W*0.22,4);
    // Header: logo trái, tên dashboard phải.
    const headH=Math.round(Hh*(ratio==='wide'?0.11:0.085)),lg=await loadLogo();
    if(lg){const lh=headH*0.62,lw=lg.width*lh/lg.height;ctx.drawImage(lg,pad,14+(headH-lh)/2,lw,lh)}
    else{ctx.fillStyle=NAVY;ctx.font=`700 ${headH*0.38}px ${font}`;ctx.textBaseline='middle';ctx.fillText('FinSuccess',pad,14+headH/2)}
    ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillStyle=NAVY;ctx.font=`700 ${Math.round(headH*0.27)}px ${font}`;
    const right=wrapText(ctx,(p.ticker?p.ticker+' · ':'')+p.name,W*0.55,1)[0]||'';ctx.fillText(right,W-pad,14+headH/2);ctx.textAlign='left';
    ctx.strokeStyle=LINE;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pad,14+headH);ctx.lineTo(W-pad,14+headH);ctx.stroke();
    // Footer 2 dòng: link trang; kỳ dữ liệu · ngày cập nhật | miễn trừ.
    const footH=Math.round(Hh*(ratio==='wide'?0.1:0.085)),fy=Hh-footH,fs=Math.round(Math.min(W,Hh)*0.019);
    ctx.strokeStyle=LINE;ctx.beginPath();ctx.moveTo(pad,fy);ctx.lineTo(W-pad,fy);ctx.stroke();
    ctx.textBaseline='middle';ctx.font=`600 ${fs}px ${font}`;ctx.fillStyle=NAVY;
    ctx.fillText(wrapText(ctx,url.replace(/^https?:\/\//,''),W-pad*2,1)[0],pad,fy+footH*0.33);
    ctx.font=`${fs}px ${font}`;ctx.fillStyle=MUTED;
    const disc='Không phải khuyến nghị mua bán.',dw0=ctx.measureText(disc).width;
    const when=[c.period?'Kỳ '+c.period:'',p.updated?'Cập nhật '+p.updated:''].filter(Boolean).join(' · ');
    if(when)ctx.fillText(wrapText(ctx,when,W-pad*2-dw0-fs*2,1)[0],pad,fy+footH*0.7);
    ctx.textAlign='right';ctx.fillText(disc,W-pad,fy+footH*0.7);ctx.textAlign='left';
    // Ảnh chart vừa khung giữa, giữ tỉ lệ.
    const top=14+headH+pad*0.6,bottom=fy-pad*0.6,bw=W-pad*2,bh=bottom-top;
    const s=Math.min(bw/shot.width,bh/shot.height),dw=shot.width*s,dh=shot.height*s,dx=pad+(bw-dw)/2,dy=top+(bh-dh)/2;
    ctx.save();ctx.shadowColor='rgba(29,38,120,.14)';ctx.shadowBlur=24;ctx.shadowOffsetY=6;ctx.fillStyle='#fff';ctx.fillRect(dx,dy,dw,dh);ctx.restore();
    ctx.drawImage(shot,dx,dy,dw,dh);ctx.strokeStyle=LINE;ctx.lineWidth=1.5;ctx.strokeRect(dx,dy,dw,dh);
    return cv;
  }
  const toBlob=cv=>new Promise(ok=>cv.toBlob(ok,'image/png'));
  function fileName(p,c){const base=((p.ticker||p.name)+'-'+c.title).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').slice(0,80);return 'FinSuccess-'+base+'.png'}

  async function render(){
    const {shot,ratio,p,c,url,ui}=state;ui.msg.textContent='';
    state.canvas=await compose(shot,ratio,p,c,url);
    state.blob=await toBlob(state.canvas);
    if(state.objUrl)URL.revokeObjectURL(state.objUrl);
    state.objUrl=URL.createObjectURL(state.blob);ui.img.src=state.objUrl;
    ui.ratio.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ratio===ratio)));
  }
  function flash(t){if(state)state.ui.msg.textContent=t}
  function download(){const a=document.createElement('a');a.href=state.objUrl;a.download=state.file;document.body.append(a);a.click();a.remove();flash('Đã tải ảnh.')}
  async function copyImage(){
    try{await navigator.clipboard.write([new ClipboardItem({'image/png':state.blob})]);flash('Đã chép ảnh — dán vào bài đăng.')}
    catch(e){flash('Trình duyệt chưa cho chép ảnh. Hãy dùng Tải ảnh.')}
  }
  async function copyCaption(silent){
    const t=state.ui.text.value;
    try{await navigator.clipboard.writeText(t);if(!silent)flash('Đã chép caption.');return true}
    catch(e){state.ui.text.select();try{document.execCommand('copy');if(!silent)flash('Đã chép caption.');return true}catch(_){return false}}
  }
  async function share(){
    const file=new File([state.blob],state.file,{type:'image/png'}),text=state.ui.text.value;
    await copyCaption(true);
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],text,title:state.c.title});flash('Đã mở chia sẻ · caption đã chép sẵn.')}
      catch(e){if(e.name!=='AbortError')flash('Không mở được chia sẻ. Hãy dùng Tải ảnh.')}
    }else{download();flash('Máy này chưa hỗ trợ chia sẻ trực tiếp: đã tải ảnh và chép caption.')}
  }
  function close(){if(!state)return;state.ui.modal.remove();if(state.objUrl)URL.revokeObjectURL(state.objUrl);document.removeEventListener('keydown',onKey);const f=state.focus;state=null;if(f)f.focus()}
  function onKey(e){if(e.key==='Escape')close()}

  function buildModal(){
    const modal=el('div','fs-share-modal'),box=el('div','fs-share-box');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Chia sẻ ảnh');
    const head=el('div','fs-share-head'),x=el('button','', '×');x.setAttribute('aria-label','Đóng');head.append(el('span','', '⇪ Chia sẻ ảnh'),x);
    const body=el('div','fs-share-body'),prev=el('div','fs-share-prev'),img=el('img');img.alt='Ảnh xem trước';prev.append(el('span','', 'Đang tạo ảnh…'));
    const side=el('div','fs-share-side'),rr=el('div','fs-share-ratio');
    const ratio=Object.entries(RATIOS).map(([k,r])=>{const b=el('button');b.type='button';b.dataset.ratio=k;b.append(r.label,el('small','',r.hint));rr.append(b);return b});
    const lab=el('label','', 'CAPTION'),text=el('textarea');lab.htmlFor=text.id='fs-share-caption';
    const acts=el('div','fs-share-acts'),bShare=el('button','primary','⇪ Chia sẻ…'),bDl=el('button','', 'Tải ảnh'),bImg=el('button','', 'Chép ảnh'),bCap=el('button','', 'Chép caption');
    acts.append(bShare,bDl,bImg,bCap);
    const msg=el('div','fs-share-msg');msg.setAttribute('aria-live','polite');
    side.append(rr,lab,text,acts,msg,el('p','fs-share-tip','Trên điện thoại, nút Chia sẻ mở thẳng Zalo, Telegram, Facebook, X… Caption được chép sẵn — dán vào bài đăng.'));
    body.append(prev,side);box.append(head,body);modal.append(box);document.body.append(modal);
    const busy=v=>[bShare,bDl,bImg,...ratio].forEach(b=>b.disabled=v);busy(true);
    x.onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',onKey);
    ratio.forEach(b=>b.onclick=async()=>{if(!state)return;state.ratio=b.dataset.ratio;busy(true);await render();busy(false)});
    bShare.onclick=share;bDl.onclick=download;bImg.onclick=copyImage;bCap.onclick=()=>copyCaption(false);
    x.focus();
    return {modal,prev,img,ratio,text,msg,busy};
  }
  async function open(card,btn){
    if(state)close();
    const p=pageInfo(),c=cardInfo(card),url=pageUrl(),ui=buildModal();
    state={card,p,c,url,ui,ratio:'wide',file:fileName(p,c),focus:btn};
    ui.text.value=caption(p,c,url);
    try{
      const shot=await snapshot(card);if(!state||state.ui!==ui)return;
      state.shot=shot;await render();ui.prev.replaceChildren(ui.img);ui.busy(false);
    }catch(e){ui.prev.replaceChildren(el('span','', 'Không tạo được ảnh: '+e.message))}
  }
  // Card chủ yếu là bảng dài (chart chỉ phụ) không gắn nút: ảnh sẽ quá nhỏ để đọc.
  function hasChart(card){return [...card.querySelectorAll('tr')].filter(r=>!r.closest('details')).length<=12&&!!card.querySelector('canvas,svg.chart,[id^="ch"] svg,[id^="ch"] canvas,.chart svg')}
  function scan(root){
    (root||document).querySelectorAll('.card,.viz-block').forEach(card=>{
      if(card.dataset.fsShare||!hasChart(card)||card.closest('.fs-share-modal'))return;
      // Card lồng nhau: gắn nút ở card trong cùng chứa chart.
      if([...card.querySelectorAll('.card,.viz-block')].some(hasChart))return;
      card.dataset.fsShare='1';card.classList.add('fs-share-host');
      const b=el('button','fs-share-btn');b.type='button';b.title='Chia sẻ ảnh chart này';b.setAttribute('aria-label','Chia sẻ ảnh chart');
      b.append('⇪ ',el('span','', 'Chia sẻ ảnh'));b.onclick=e=>{e.stopPropagation();open(card,b)};
      card.prepend(b);
    });
  }
  function init(){
    const st=el('style');st.textContent=css;document.head.append(st);
    scan();setTimeout(scan,1500);setTimeout(scan,4000);
  }
  window.FinShareImage={scan,open};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
