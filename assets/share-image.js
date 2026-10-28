/* Chia sẻ ảnh chart: mỗi card có chart nhận nút "Chia sẻ ảnh", bấm vào tạo ảnh có logo FinSuccess,
   tên dashboard, tiêu đề chart, kỳ dữ liệu, link trang và dòng miễn trừ; cho chọn 16:9 / 4:5, sửa caption,
   chia sẻ (điện thoại), tải ảnh, chép ảnh, chép caption. Dùng chung cho Stock dashboard và dashboard ngành. */
(function(){
  if(window.FinShareImage)return;
  const H2C='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  const NAVY='#1D2678',INK='#303540',MUTED='#596272',LINE='#dce1e9',TEAL='#59C5C8';
  const RATIOS={wide:{w:1920,h:1080,label:'Ngang 16:9',hint:'X · Telegram · Zalo'},tall:{w:1080,h:1350,label:'Dọc 4:5',hint:'Facebook · Instagram'}};
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
  async function snapshot(card,ratio){
    const h2c=await loadLib();
    // Khung dọc: tạm thu hẹp card và kéo cao khung chart để chart lấp đầy 4:5, chụp xong trả lại như cũ.
    const restore=[];
    if(ratio==='tall'){
      const box=[...card.querySelectorAll('canvas,svg')].map(n=>n.parentElement).filter(n=>n&&n.offsetHeight>120)[0];
      const width=Math.min(card.offsetWidth,620);
      restore.push([card,card.getAttribute('style')]);card.style.width=width+'px';card.style.maxWidth=width+'px';
      if(box){
        const extra=Math.round(width*1.17)-card.offsetHeight;
        if(extra>0){restore.push([box,box.getAttribute('style')]);box.style.height=(box.offsetHeight+extra)+'px';box.style.maxHeight='none'}
      }
      (window.Chart&&Chart.getChart?[...card.querySelectorAll('canvas')].map(c=>Chart.getChart(c)).filter(Boolean):[]).forEach(ch=>{ch.resize();ch.update('none')});
    }
    try{return await shoot(card,h2c)}
    finally{
      restore.reverse().forEach(([n,st])=>st==null?n.removeAttribute('style'):n.setAttribute('style',st));
      if(restore.length)(window.Chart&&Chart.getChart?[...card.querySelectorAll('canvas')].map(c=>Chart.getChart(c)).filter(Boolean):[]).forEach(ch=>{ch.resize();ch.update('none')});
    }
  }
  async function shoot(card,h2c){
    // Chụp đủ nét cho khung 1920px: tăng scale theo bề rộng card, vẽ lại Chart.js ở mật độ điểm cao rồi trả về như cũ.
    const scale=Math.min(4,Math.max(2,1920*1.25/Math.max(1,card.offsetWidth)));
    const charts=window.Chart&&Chart.getChart?[...card.querySelectorAll('canvas')].map(c=>Chart.getChart(c)).filter(Boolean):[];
    const dpr=charts.map(ch=>ch.options.devicePixelRatio);
    charts.forEach(ch=>{ch.options.devicePixelRatio=scale;ch.resize();ch.update('none')});
    const selects=[...card.querySelectorAll('select')].map(el=>({text:el.selectedOptions[0]?el.selectedOptions[0].textContent:'',cs:getComputedStyle(el),w:el.offsetWidth,h:el.offsetHeight}));
    try{
      return await h2c(card,{backgroundColor:'#ffffff',scale,useCORS:true,logging:false,onclone:(doc,node)=>{node.style.border='0';node.style.boxShadow='none';node.style.padding='4px';
        // Giữ thanh Chu kỳ / Số kỳ; bỏ cụm nút Trục.
        node.querySelectorAll('span').forEach(x=>{if(!x.children.length&&x.textContent.trim()==='Trục'&&x.parentElement)x.parentElement.remove()});
        // html2canvas vẽ <select> lệch chữ: thay bằng ô tĩnh cùng kích thước, chữ căn giữa dọc.
        node.querySelectorAll('select').forEach((el,i)=>{const o=selects[i];if(!o)return;const d=doc.createElement('div'),t=doc.createElement('span'),a=doc.createElement('span');t.textContent=o.text;a.textContent='▾';d.append(t,a);
          Object.assign(d.style,{display:'inline-flex',alignItems:'center',justifyContent:'space-between',gap:'8px',boxSizing:'border-box',width:o.w+'px',height:o.h+'px',padding:'0 10px',border:o.cs.border,borderRadius:o.cs.borderRadius,background:o.cs.backgroundColor,color:o.cs.color,font:o.cs.font,whiteSpace:'nowrap',overflow:'hidden',verticalAlign:'middle'});
          el.replaceWith(d)})},
        ignoreElements:n=>n.tagName==='BUTTON'||n.classList&&(n.classList.contains('fs-share-btn')||n.classList.contains('chart-card-actions')||n.classList.contains('chart-source-details')||n.tagName==='DETAILS'&&!n.open)});
    }finally{charts.forEach((ch,i)=>{ch.options.devicePixelRatio=dpr[i];ch.resize();ch.update('none')})}
  }
  // Cắt bỏ viền trắng quanh nội dung của bản chụp (giữ lề nhỏ) để chart to nhất trong khung.
  function trim(cv){
    const w=cv.width,h=cv.height,d=cv.getContext('2d').getImageData(0,0,w,h).data;
    let x0=w,y0=h,x1=-1,y1=-1;
    for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){const i=(y*w+x)*4;if(d[i]<240||d[i+1]<240||d[i+2]<240){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
    if(x1<0)return cv;
    const m=Math.round(Math.min(w,h)*0.015);x0=Math.max(0,x0-m);y0=Math.max(0,y0-m);x1=Math.min(w,x1+m);y1=Math.min(h,y1+m);
    const out=document.createElement('canvas');out.width=x1-x0;out.height=y1-y0;out.getContext('2d').drawImage(cv,x0,y0,out.width,out.height,0,0,out.width,out.height);
    return out;
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
    // Logo ngay trên góc trái của chart, tên mã/ngành canh phải theo mép chart; chart lớn nhất có thể, cả khối căn giữa.
    const m=Math.round(Math.min(W,Hh)*0.025),logoH=Math.round(Math.min(W,Hh)*0.06),gap=Math.round(logoH*0.3),lg=await loadLogo();
    const bw=W-m*2,bh=Hh-m*2-logoH-gap;
    const s=Math.min(bw/shot.width,bh/shot.height),dw=shot.width*s,dh=shot.height*s;
    const dx=(W-dw)/2,top=(Hh-(logoH+gap+dh))/2,dy=top+logoH+gap;
    if(lg)ctx.drawImage(lg,dx,top,lg.width*logoH/lg.height,logoH);
    else{ctx.fillStyle=NAVY;ctx.font=`700 ${logoH*0.7}px ${font}`;ctx.textBaseline='middle';ctx.fillText('FinSuccess',dx,top+logoH/2)}
    ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillStyle=MUTED;ctx.font=`600 ${Math.round(logoH*0.36)}px ${font}`;
    ctx.fillText(wrapText(ctx,(p.ticker?p.ticker+' · ':'')+p.name,dw*0.6,1)[0]||'',dx+dw,top+logoH/2);ctx.textAlign='left';
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(shot,dx,dy,dw,dh);
    return cv;
  }
  const toBlob=cv=>new Promise(ok=>cv.toBlob(ok,'image/png'));
  function fileName(p,c){const base=((p.ticker||p.name)+'-'+c.title).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').slice(0,80);return 'FinSuccess-'+base+'.png'}

  async function render(){
    const {ratio,p,c,url,ui}=state;ui.msg.textContent='';
    if(!state.shots[ratio])state.shots[ratio]=trim(await snapshot(state.card,ratio));
    const shot=state.shots[ratio];
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
    const lab=el('label','', 'CAPTION'),text=el('textarea');lab.htmlFor=text.id='fs-share-caption';lab.style.display=text.style.display='none';
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
    state={card,p,c,url,ui,ratio:'wide',shots:{},file:fileName(p,c),focus:btn};
    ui.text.value=caption(p,c,url);
    try{
      await render();if(!state||state.ui!==ui)return;ui.prev.replaceChildren(ui.img);ui.busy(false);
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
