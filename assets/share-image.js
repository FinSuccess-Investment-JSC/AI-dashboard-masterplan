/* Chia sẻ ảnh chart: mỗi card có chart nhận nút "Chia sẻ ảnh", bấm vào tạo ảnh có logo FinSuccess,
   tên dashboard, tiêu đề chart, kỳ dữ liệu, link trang và dòng miễn trừ; cho chọn 16:9 / 4:5, sửa caption,
   chia sẻ (điện thoại), tải ảnh, chép ảnh, chép caption. Dùng chung cho Stock dashboard và dashboard ngành. */
(function(){
  if(window.FinShareImage)return;
  const H2C='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  const NAVY='#1D2678',INK='#303540',MUTED='#596272',LINE='#dce1e9',TEAL='#59C5C8';
  const RATIOS={fit:{w:0,h:0,label:'Vừa chart',hint:'Ảnh sát chart, không viền trắng'},wide:{w:1920,h:1080,label:'Ngang 16:9',hint:'X · Telegram · Zalo'},tall:{w:1080,h:1350,label:'Dọc 4:5',hint:'Facebook · Instagram'}};
  const scriptSrc=(document.currentScript&&document.currentScript.src)||'';
  let lib=null,logo=null,state=null;

  const css=`.fs-share-btn{position:absolute;top:18px;right:18px;z-index:3;display:inline-grid;place-items:center;width:32px;height:32px;padding:0;border:1px solid transparent;border-radius:10px;background:transparent;color:#7A819A;font:500 17px/1 Inter,Arial,system-ui,sans-serif;cursor:pointer};border-radius:999px;background:#fff;color:${NAVY};font:600 12px/1.3 Inter,Arial,system-ui,sans-serif;cursor:pointer;opacity:.78}
.fs-share-btn:hover,.fs-share-btn:focus-visible{color:${NAVY};background:#F0F2FA;border-color:${LINE}}
.fs-share-host{position:relative}
.fs-share-host>h3:first-of-type,.fs-share-host>.chart-title:first-of-type{padding-right:44px}
.fs-share-modal{position:fixed;inset:0;z-index:9999;background:rgba(16,22,48,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,Arial,system-ui,sans-serif}
.fs-share-box{background:#fff;color:${INK};border-radius:18px;width:min(1480px,100%);max-height:calc(100vh - 32px);overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.fs-share-head{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid ${LINE};font-weight:700;color:${NAVY}}
.fs-share-head button{border:0;background:none;font-size:22px;line-height:1;cursor:pointer;color:${MUTED}}
.fs-share-body{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px;padding:16px 20px 18px;align-items:start}
.fs-share-prev{background:#f3f5fa;border-radius:12px;display:flex;align-items:center;justify-content:center;min-height:260px;padding:12px}
.fs-sh-stage{position:relative;display:inline-block;line-height:0}
.fs-sh-stage img{max-width:100%;max-height:calc(100vh - 230px);border-radius:6px;box-shadow:0 4px 18px rgba(0,0,0,.12)}
.fs-sh-ov{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
.fs-sh-stage.drawing .fs-sh-ov{pointer-events:auto;cursor:crosshair}
.fs-sh-txt{position:absolute;z-index:3;line-height:normal;height:30px;padding:0 8px;border:2px solid ${NAVY};border-radius:6px;font:600 14px Inter,Arial,sans-serif;min-width:180px}
.fs-sh-tools{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:10px}
.fs-sh-tools>button{height:34px;padding:0 11px;border:1px solid ${LINE};border-radius:9px;background:#fff;color:${NAVY};font:600 13px Inter,Arial,sans-serif;cursor:pointer}
.fs-sh-tools>button[aria-pressed=true]{background:${NAVY};border-color:${NAVY};color:#fff}
.fs-sh-sw{display:inline-flex;gap:5px;margin:0 6px;padding-left:8px;border-left:1px solid ${LINE}}
.fs-sh-sw button{width:24px;height:24px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px ${LINE};cursor:pointer}
.fs-sh-sw button[aria-pressed=true]{box-shadow:0 0 0 2px ${NAVY}}
.fs-sh-hint{margin:8px 0 0;font-size:12.5px;color:${MUTED}}
.fs-share-side{display:flex;flex-direction:column;gap:8px}
.fs-share-ratio{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.fs-share-ratio button{padding:8px 10px;border:1px solid ${LINE};border-radius:10px;background:#fff;cursor:pointer;font:600 13px Inter,Arial,sans-serif;color:${INK};text-align:left}
.fs-share-ratio button small{display:block;font-weight:400;font-size:11px;color:${MUTED};margin-top:2px}
.fs-share-ratio button[aria-pressed="true"]{border-color:${NAVY};background:#f0f4ff;box-shadow:inset 0 0 0 1px ${NAVY}}
.fs-sh-h{margin-top:10px;font:700 12px Inter,Arial,sans-serif;letter-spacing:.08em;color:${MUTED}}
.fs-sh-sub{font-size:11.5px;color:${MUTED};margin-top:-4px}
.fs-sh-list{display:flex;flex-direction:column;gap:8px}
.fs-sh-item{border:1px solid ${LINE};border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.fs-sh-top{display:flex;align-items:center;gap:6px}
.fs-sh-n{flex:none;width:22px;height:22px;border-radius:50%;background:${NAVY};color:#fff;display:grid;place-items:center;font:700 12px Inter,Arial,sans-serif}
.fs-sh-t{flex:1;min-width:0;font:600 13px Inter,Arial,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${INK}}
.fs-sh-ic{flex:none;width:26px;height:26px;border:1px solid ${LINE};border-radius:8px;background:#fff;cursor:pointer;color:${NAVY}}
.fs-sh-ic:disabled{opacity:.35;cursor:default}
.fs-sh-item input{height:32px;padding:0 10px;border:1px solid ${LINE};border-radius:8px;font:13px Inter,Arial,sans-serif}
.fs-sh-row2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.fs-sh-row2 select{width:100%;height:34px;border:1px solid ${LINE};border-radius:10px;padding:0 8px;font:600 13px Inter,Arial,sans-serif;color:${NAVY};background:#fff}
.fs-sh-msg{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid ${LINE};border-radius:10px;font:13px/1.45 Inter,Arial,sans-serif;resize:vertical}
.fs-share-side label{display:block;margin:16px 0 6px;font-size:12px;letter-spacing:.06em;color:${MUTED};font-weight:700}
.fs-share-side textarea#fs-share-caption{width:100%;box-sizing:border-box;min-height:150px}
.fs-share-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.fs-share-acts button{padding:10px;border:1px solid ${LINE};border-radius:10px;background:#fff;font:600 13.5px Inter,Arial,sans-serif;color:${INK};cursor:pointer}
.fs-share-acts .primary{grid-column:1/-1;background:${NAVY};border-color:${NAVY};color:#fff}
.fs-share-acts button:disabled{opacity:.5;cursor:wait}
.fs-share-tip{display:none}
.fs-share-msg{min-height:16px;font-size:13px;color:#256f72;font-weight:600}
@media(max-width:980px){.fs-share-body{grid-template-columns:1fr;padding:14px}.fs-share-btn span{display:none}.fs-share-host>h3:first-of-type,.fs-share-host>.chart-title:first-of-type{padding-right:44px}}
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
    card.classList.add('fs-per-shot'); // thanh Chu kỳ/Số kỳ đang thu vào icon lịch: hiện tạm để ảnh vẫn có
    const selects=[...card.querySelectorAll('select')].map(el=>({text:el.selectedOptions[0]?el.selectedOptions[0].textContent:'',cs:getComputedStyle(el),w:el.offsetWidth,h:el.offsetHeight}));
    try{
      return await h2c(card,{backgroundColor:'#ffffff',scale,useCORS:true,logging:false,onclone:(doc,node)=>{node.style.border='0';node.style.boxShadow='none';node.style.padding='4px';node.style.background='#fff';node.classList.add('fs-shot-clean');const st=doc.createElement('style');st.textContent='.fs-shot-clean,.fs-shot-clean *{background-image:none!important}.fs-shot-clean::before,.fs-shot-clean::after{display:none!important}';doc.head.append(st);
        // Giữ thanh Chu kỳ / Số kỳ; bỏ cụm nút Trục.
        node.querySelectorAll('span').forEach(x=>{if(!x.children.length&&x.textContent.trim()==='Trục'&&x.parentElement)x.parentElement.remove()});
        // html2canvas vẽ <select> lệch chữ: thay bằng ô tĩnh cùng kích thước, chữ căn giữa dọc.
        node.querySelectorAll('select').forEach((el,i)=>{const o=selects[i];if(!o)return;const d=doc.createElement('div'),t=doc.createElement('span'),a=doc.createElement('span');t.textContent=o.text;a.textContent='▾';d.append(t,a);
          Object.assign(d.style,{display:'inline-flex',alignItems:'center',justifyContent:'space-between',gap:'8px',boxSizing:'border-box',width:o.w+'px',height:o.h+'px',padding:'0 10px',border:o.cs.border,borderRadius:o.cs.borderRadius,background:o.cs.backgroundColor,color:o.cs.color,font:o.cs.font,whiteSpace:'nowrap',overflow:'hidden',verticalAlign:'middle'});
          el.replaceWith(d)})},
        ignoreElements:n=>n.tagName==='BUTTON'||n.classList&&(n.classList.contains('fs-share-btn')||n.classList.contains('chart-card-actions')||n.classList.contains('chart-source-details')||n.tagName==='DETAILS'&&!n.open)});
    }finally{card.classList.remove('fs-per-shot');charts.forEach((ch,i)=>{ch.options.devicePixelRatio=dpr[i];ch.resize();ch.update('none')})}
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
  // Ghép nhiều chart (tối đa 6) thành một ảnh: thông điệp chính ở đầu, nhận định ngắn trên từng chart,
  // watermark FinSuccess mờ giữa từng chart, rồi đặt vào khung Vừa chart / 16:9 / 4:5 (28/10/2026).
  const FONT='Inter, Arial, "Helvetica Neue", sans-serif';
  function wrapLines(ctx,text,maxW,maxLines){return wrapText(ctx,text,maxW,maxLines)}
  async function compose(shots,ratio,p,opts){
    const n=shots.length,cols=n===1?1:(opts.cols||2),rows=Math.ceil(n/cols);
    const cw=Math.max(...shots.map(s=>s.width)),gap=Math.round(cw*0.04),pad=Math.round(cw*0.03);
    const tmp=document.createElement('canvas').getContext('2d');
    const noteF=Math.round(cw*0.026),headF=Math.round(cw*(cols>1?0.05:0.04));
    tmp.font=`700 ${headF}px ${FONT}`;const totalW=cols*cw+(cols-1)*gap;
    const head=opts.message?wrapLines(tmp,opts.message,totalW,2):[];const headH=head.length?head.length*headF*1.3+gap*0.6:0;
    const cells=shots.map((s,i)=>{const sc=cw/s.width;tmp.font=`500 ${noteF}px ${FONT}`;const note=opts.notes[i]?wrapLines(tmp,opts.notes[i],cw,2):[];return {s,sc,h:s.height*sc,note,nh:note.length?note.length*noteF*1.35+noteF*0.5:0}});
    const rowH=[...Array(rows)].map((_,r)=>Math.max(...cells.slice(r*cols,r*cols+cols).map(c=>c.h+c.nh)));
    const CW=totalW+pad*2,CH=pad*2+Math.round(cw*0.014)+headH+rowH.reduce((a,b)=>a+b,0)+(rows-1)*gap;
    const content=document.createElement('canvas');content.width=CW;content.height=CH;const ctx=content.getContext('2d');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,CW,CH);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    let y=pad;if(head.length){ctx.fillStyle=NAVY;ctx.font=`700 ${headF}px ${FONT}`;ctx.textBaseline='top';head.forEach(l=>{ctx.fillText(l,pad,y);y+=headF*1.3});y+=gap*0.6}
    const lg=await loadLogo();
    cells.forEach((c,i)=>{const r=Math.floor(i/cols),k=i%cols,x=pad+k*(cw+gap),yy=y+rowH.slice(0,r).reduce((a,b)=>a+b,0)+r*gap;
      let cy=yy;if(c.note.length){ctx.fillStyle=MUTED;ctx.font=`italic 500 ${noteF}px ${FONT}`;ctx.textBaseline='top';c.note.forEach(l=>{ctx.fillText(l,x,cy);cy+=noteF*1.35});cy+=noteF*0.5}
      ctx.drawImage(c.s,x,cy,cw,c.h);
      // Watermark: dùng watermark trong chart (fsWatermark, chart-explore.js), không vẽ thêm (06/11/2026).
    });
    // Nhận diện ở chân ảnh, chỗ trống (người dùng chốt 29/10/2026): chữ "FinSuccess" đậm, rõ + "MÃ · fisc.vn" (watermark trong chart đặt ở khoảng trống, xem emptiest).
    {const fs=Math.max(14,Math.round(cw*0.022)),tail='  ·  '+(p.ticker?p.ticker+'  ·  ':'')+'fisc.vn';ctx.save();ctx.textBaseline='bottom';ctx.textAlign='left';
     ctx.font=`500 ${fs}px ${FONT}`;const tw=ctx.measureText(tail).width;ctx.font=`800 ${fs}px ${FONT}`;const bw=ctx.measureText('FinSuccess').width,x0=CW-pad-tw-bw,yb=CH-pad*0.3;
     ctx.fillStyle=NAVY;ctx.fillText('FinSuccess',x0,yb);ctx.font=`500 ${fs}px ${FONT}`;ctx.fillStyle=MUTED;ctx.fillText(tail,x0+bw,yb);ctx.restore();}
    if(ratio==='fit')return content;
    const R=RATIOS[ratio],cv=document.createElement('canvas');cv.width=R.w;cv.height=R.h;const c2=cv.getContext('2d');c2.fillStyle='#fff';c2.fillRect(0,0,R.w,R.h);
    const s=Math.min(R.w/CW,R.h/CH);c2.imageSmoothingEnabled=true;c2.imageSmoothingQuality='high';c2.drawImage(content,(R.w-CW*s)/2,(R.h-CH*s)/2,CW*s,CH*s);return cv;
  }
  // Tìm vị trí (góc trên trái) của khung w×h có ít điểm ảnh đậm nhất trong vùng vẽ; ưu tiên gần giữa khi ngang nhau.
  function emptiest(cv,w,h){
    const N=96,sx=cv.width/N,M=Math.max(8,Math.round(cv.height/sx)),t=document.createElement('canvas');t.width=N;t.height=M;
    const g=t.getContext('2d');g.drawImage(cv,0,0,N,M);const d=g.getImageData(0,0,N,M).data,I=new Float64Array((N+1)*(M+1));
    for(let y=0;y<M;y++){let row=0;for(let x=0;x<N;x++){const k=(y*N+x)*4,ink=255*3-(d[k]+d[k+1]+d[k+2]);row+=ink>45?ink:0;I[(y+1)*(N+1)+x+1]=I[y*(N+1)+x+1]+row}}
    const bw=Math.max(1,Math.round(w/sx)),bh=Math.max(1,Math.round(h/sx)),y0=Math.round(M*0.30),y1=Math.round(M*0.72)-bh,x0=Math.round(N*0.10),x1=Math.round(N*0.95)-bw;
    let best=null;
    for(let y=y0;y<=Math.max(y0,y1);y++)for(let x=x0;x<=Math.max(x0,x1);x++){
      const sum=I[(y+bh)*(N+1)+x+bw]-I[y*(N+1)+x+bw]-I[(y+bh)*(N+1)+x]+I[y*(N+1)+x];
      const off=Math.abs(x+bw/2-N/2)/N+Math.abs(y+bh/2-M*0.55)/M, sc=sum+off*bw*bh*6;
      if(!best||sc<best.s)best={s:sc,x,y};
    }
    const dense=!best||(best.s/(bw*bh))>90; // trung bình độ đậm mỗi điểm > 90/765: không có khoảng trống thật
    return !dense?{x:best.x*sx,y:best.y*sx,dense:false}:{x:(cv.width-w)/2,y:cv.height*0.48-h/2,dense:true};
  }
  // Logo một màu (navy hoặc trắng) cùng kích thước, để đặt chồng hai lớp watermark.
  function watermark(lg,ww,color){
    const cv=document.createElement('canvas'),c=cv.getContext('2d');
    if(lg){cv.width=Math.round(ww);cv.height=Math.round(ww*lg.height/lg.width);c.drawImage(lg,0,0,cv.width,cv.height);c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,cv.width,cv.height);}
    else{const f=Math.round(ww/5.2);c.font=`800 ${f}px ${FONT}`;cv.width=Math.ceil(c.measureText('FinSuccess').width+f*0.4);cv.height=Math.round(f*1.4);c.fillStyle=color;c.font=`800 ${f}px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText('FinSuccess',cv.width/2,cv.height/2);}
    return cv;
  }
  const toBlob=cv=>new Promise(ok=>cv.toBlob(ok,'image/png'));
  function fileName(p,c){const base=((p.ticker||p.name)+'-'+c.title).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').slice(0,80);return 'FinSuccess-'+base+'.png'}

  /* ---------- Vẽ chú thích lên ảnh (tọa độ tương đối 0–1 để giữ đúng khi đổi khung) ---------- */
  const COLORS=[NAVY,'#861C52','#FFD45D','#C0392B',TEAL];
  const TOOLS=[['none','↖ Không vẽ'],['arrow','→ Mũi tên'],['dash','⇢ Mũi tên đứt'],['hl','▬ Tô sáng'],['rect','▢ Khung'],['ellipse','◯ Khoanh tròn'],['text','T Chữ']];
  function drawShape(ctx,sh,W,H){
    const x1=sh.x1*W,y1=sh.y1*H,x2=sh.x2*W,y2=sh.y2*H,lw=Math.max(3,Math.round(Math.min(W,H)*0.005));
    ctx.save();ctx.strokeStyle=sh.c;ctx.fillStyle=sh.c;ctx.lineWidth=lw;ctx.lineCap='round';ctx.lineJoin='round';
    if(sh.t==='arrow'||sh.t==='dash'){if(sh.t==='dash')ctx.setLineDash([lw*3,lw*2.2]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
      const a=Math.atan2(y2-y1,x2-x1),L=lw*5;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-L*Math.cos(a-0.45),y2-L*Math.sin(a-0.45));ctx.lineTo(x2-L*Math.cos(a+0.45),y2-L*Math.sin(a+0.45));ctx.closePath();ctx.fill()}
    else if(sh.t==='hl'){ctx.globalAlpha=.28;ctx.fillRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1))}
    else if(sh.t==='rect'){ctx.strokeRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1))}
    else if(sh.t==='ellipse'){ctx.beginPath();ctx.ellipse((x1+x2)/2,(y1+y2)/2,Math.abs(x2-x1)/2||1,Math.abs(y2-y1)/2||1,0,0,Math.PI*2);ctx.stroke()}
    else if(sh.t==='text'){const f=Math.round(Math.min(W,H)*0.03);ctx.font=`700 ${f}px ${FONT}`;ctx.textBaseline='top';const w=ctx.measureText(sh.s).width;
      ctx.globalAlpha=.92;ctx.fillStyle='#fff';ctx.fillRect(x1-f*0.25,y1-f*0.15,w+f*0.5,f*1.35);ctx.globalAlpha=1;ctx.fillStyle=sh.c;ctx.fillText(sh.s,x1,y1)}
    ctx.restore();
  }
  async function exportImage(){
    const b=state.base,cv=document.createElement('canvas');cv.width=b.width;cv.height=b.height;const ctx=cv.getContext('2d');ctx.drawImage(b,0,0);
    state.shapes.forEach(sh=>drawShape(ctx,sh,cv.width,cv.height));state.canvas=cv;state.blob=await toBlob(cv);
    if(state.objUrl)URL.revokeObjectURL(state.objUrl);state.objUrl=URL.createObjectURL(state.blob);state.ui.img.src=state.objUrl;
  }
  async function render(){
    const {ratio,p,ui}=state;ui.msg.textContent='';
    const single=state.items.length===1,mode=single&&ratio==='tall'?'tall':'fit',shots=[];
    for(const it of state.items){const k=mode;it.shots=it.shots||{};if(!it.shots[k])it.shots[k]=trim(await snapshot(it.card,k));shots.push(it.shots[k])}
    state.base=await compose(shots,ratio,p,{cols:state.cols,notes:state.items.map(i=>i.note),message:state.message});
    await exportImage();
    ui.ratio.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ratio===ratio)));
    renderList();
  }
  let rT=0;const rerender=()=>{clearTimeout(rT);rT=setTimeout(async()=>{if(!state)return;state.ui.busy(true);try{await render()}catch(e){flash('Không tạo được ảnh: '+e.message)}state.ui.busy(false)},350)};
  function chartCards(){return [...document.querySelectorAll('.fs-share-host')].filter(c=>c.offsetParent&&!c.closest('.fs-share-modal'))}
  function renderList(){
    const ui=state.ui;ui.list.replaceChildren();
    state.items.forEach((it,i)=>{const row=el('div','fs-sh-item'),top=el('div','fs-sh-top'),num=el('b','fs-sh-n',String(i+1)),t=el('span','fs-sh-t',cardInfo(it.card).title);t.title=t.textContent;
      const mk=(txt,lab,fn,dis)=>{const b=el('button','fs-sh-ic',txt);b.type='button';b.setAttribute('aria-label',lab);b.title=lab;b.disabled=!!dis;b.onclick=fn;return b};
      top.append(num,t,mk('↑','Đưa lên',()=>{state.items.splice(i-1,0,state.items.splice(i,1)[0]);rerender();renderList()},i===0),mk('↓','Đưa xuống',()=>{state.items.splice(i+1,0,state.items.splice(i,1)[0]);rerender();renderList()},i===state.items.length-1),mk('×','Bỏ chart',()=>{state.items.splice(i,1);rerender();renderList()},state.items.length===1));
      const inp=el('input');inp.placeholder='Nhận định ngắn cho chart';inp.value=it.note||'';inp.oninput=()=>{it.note=inp.value;rerender()};
      row.append(top,inp);ui.list.append(row)});
    const used=new Set(state.items.map(i=>i.card)),avail=chartCards().filter(c=>!used.has(c));
    ui.add.replaceChildren(el('option','', state.items.length>=6?'Tối đa 6 chart':'+ Thêm chart…'));ui.add.disabled=state.items.length>=6||!avail.length;
    avail.forEach((c,k)=>{const o=el('option','',cardInfo(c).title);o.value=String(k);ui.add.append(o)});ui.add._avail=avail;
    ui.layout.parentElement.style.display=state.items.length>1?'':'none';
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
  function onKey(e){if(e.key==='Escape')close();
    // Ctrl/⌘+C trong khung phóng to: chép ảnh (trừ khi đang chọn chữ hoặc sửa caption)
    else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'&&state&&state.blob&&document.activeElement.tagName!=='TEXTAREA'&&!String(getSelection()||'')){e.preventDefault();copyImage()}}

  function buildModal(){
    const modal=el('div','fs-share-modal'),box=el('div','fs-share-box');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Chia sẻ ảnh');
    const head=el('div','fs-share-head'),x=el('button','', '×');x.setAttribute('aria-label','Đóng');head.append(el('span','', '⇪ Chia sẻ ảnh'),x);
    const body=el('div','fs-share-body'),left=el('div','fs-share-left');
    // Thanh vẽ
    const tools=el('div','fs-sh-tools');
    const tb=TOOLS.map(([k,t])=>{const b=el('button','',t);b.type='button';b.dataset.tool=k;b.setAttribute('aria-pressed',String(k==='none'));tools.append(b);return b});
    const sw=el('span','fs-sh-sw');const cb=COLORS.map((c,i)=>{const b=el('button');b.type='button';b.style.background=c;b.title='Màu';b.setAttribute('aria-label','Màu '+(i+1));b.setAttribute('aria-pressed',String(i===0));sw.append(b);return b});tools.append(sw);
    const bUndo=el('button','', '↶ Hoàn tác'),bClr=el('button','', 'Xóa vẽ');bUndo.type=bClr.type='button';tools.append(bUndo,bClr);
    const prev=el('div','fs-share-prev'),stage=el('div','fs-sh-stage'),img=el('img'),ov=el('canvas','fs-sh-ov');img.alt='Ảnh xem trước';stage.append(img,ov);prev.append(el('span','', 'Đang tạo ảnh…'));
    const hint=el('p','fs-sh-hint','Kéo trên ảnh để vẽ. Chữ: chọn T rồi bấm vào vị trí cần ghi. Ctrl/⌘+C chép ảnh.');
    left.append(tools,prev,hint);
    // Cột phải
    const side=el('div','fs-share-side'),rr=el('div','fs-share-ratio');
    const ratio=Object.entries(RATIOS).map(([k,r])=>{const b=el('button');b.type='button';b.dataset.ratio=k;b.append(r.label,el('small','',r.hint));rr.append(b);return b});
    const h1=el('div','fs-sh-h','CHART TRONG ẢNH'),sub1=el('div','fs-sh-sub','tối đa 6 · chart đang hiện trên trang · nhận định ngắn hiện ngay trên chart');
    const list=el('div','fs-sh-list'),row2=el('div','fs-sh-row2'),add=el('select','fs-sh-add'),lw=el('label','fs-sh-lay'),layout=el('select');
    add.setAttribute('aria-label','Thêm chart');[['1','Bố cục: 1 cột'],['2','Bố cục: 2 cột']].forEach(([v,t])=>{const o=el('option','',t);o.value=v;layout.append(o)});layout.value='2';lw.append(layout);row2.append(add,lw);
    const h2=el('div','fs-sh-h','THÔNG ĐIỆP CHÍNH'),sub2=el('div','fs-sh-sub','tuỳ chọn · thành tiêu đề lớn trên ảnh');
    const msgIn=el('textarea','fs-sh-msg');msgIn.rows=2;msgIn.placeholder='VD: Biên gộp cảng phục hồi 3 quý liên tiếp';
    const lab=el('label','', 'CAPTION'),text=el('textarea');lab.htmlFor=text.id='fs-share-caption';lab.style.display=text.style.display='none';
    const acts=el('div','fs-share-acts'),bShare=el('button','primary','⇪ Chia sẻ…'),bDl=el('button','', 'Tải ảnh'),bImg=el('button','', 'Chép ảnh'),bCap=el('button','', 'Chép caption');
    acts.append(bShare,bDl,bImg,bCap);
    const msg=el('div','fs-share-msg');msg.setAttribute('aria-live','polite');
    side.append(rr,h1,sub1,list,row2,h2,sub2,msgIn,lab,text,acts,msg);
    body.append(left,side);box.append(head,body);modal.append(box);document.body.append(modal);
    const busy=v=>[bShare,bDl,bImg,...ratio].forEach(b=>b.disabled=v);busy(true);
    x.onclick=close;modal.addEventListener('mousedown',e=>{if(e.target===modal)close()});document.addEventListener('keydown',onKey);
    ratio.forEach(b=>b.onclick=async()=>{if(!state)return;state.ratio=b.dataset.ratio;busy(true);await render();busy(false)});
    bShare.onclick=share;bDl.onclick=download;bImg.onclick=copyImage;bCap.onclick=()=>copyCaption(false);
    add.onchange=()=>{const c=add._avail&&add._avail[+add.value];if(c&&state.items.length<6){state.items.push({card:c,note:''});rerender()}add.selectedIndex=0;renderList()};
    layout.onchange=()=>{state.cols=+layout.value;rerender()};
    msgIn.oninput=()=>{state.message=msgIn.value.trim();rerender()};
    // Vẽ
    let tool='none',color=COLORS[0],drag=null;
    tb.forEach(b=>b.onclick=()=>{tool=b.dataset.tool;tb.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));stage.classList.toggle('drawing',tool!=='none');img.classList.remove('fs-zoom')});
    cb.forEach((b,i)=>b.onclick=()=>{color=COLORS[i];cb.forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
    bUndo.onclick=()=>{if(state&&state.shapes.length){state.shapes.pop();exportImage()}};bClr.onclick=()=>{if(state){state.shapes=[];exportImage()}};
    const rel=e=>{const r=img.getBoundingClientRect();return {x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))}};
    const sizeOv=()=>{const r=img.getBoundingClientRect();ov.width=Math.round(r.width);ov.height=Math.round(r.height);ov.style.width=r.width+'px';ov.style.height=r.height+'px'};
    ov.addEventListener('pointerdown',e=>{if(tool==='none'||!state)return;e.preventDefault();const p=rel(e);
      if(tool==='text'){const f=el('input','fs-sh-txt');f.placeholder='Nhập chữ rồi Enter';const sr=stage.getBoundingClientRect();f.style.left=(e.clientX-sr.left)+'px';f.style.top=(e.clientY-sr.top)+'px';stage.append(f);f.focus();
        const done=ok=>{if(ok&&f.value.trim()){state.shapes.push({t:'text',x1:p.x,y1:p.y,x2:p.x,y2:p.y,c:color,s:f.value.trim()});exportImage()}f.remove()};
        f.onkeydown=k=>{if(k.key==='Enter')done(true);if(k.key==='Escape'){k.stopPropagation();done(false)}};f.onblur=()=>done(true);return}
      sizeOv();drag={t:tool,c:color,x1:p.x,y1:p.y,x2:p.x,y2:p.y};ov.setPointerCapture(e.pointerId)});
    ov.addEventListener('pointermove',e=>{if(!drag)return;const p=rel(e);drag.x2=p.x;drag.y2=p.y;const g=ov.getContext('2d');g.clearRect(0,0,ov.width,ov.height);drawShape(g,drag,ov.width,ov.height)});
    ov.addEventListener('pointerup',()=>{if(!drag)return;const d=drag;drag=null;ov.getContext('2d').clearRect(0,0,ov.width,ov.height);if(Math.hypot(d.x2-d.x1,d.y2-d.y1)>0.01){state.shapes.push(d);exportImage()}});
    x.focus();
    return {modal,prev,stage,img,ratio,text,msg,busy,list,add,layout};
  }
  async function open(card,btn){
    if(state)close();
    const p=pageInfo(),c=cardInfo(card),url=pageUrl(),ui=buildModal();
    state={card,p,c,url,ui,ratio:'fit',items:[{card,note:''}],cols:2,message:'',shapes:[],file:fileName(p,c),focus:btn};
    ui.text.value=caption(p,c,url);
    try{
      await render();if(!state||state.ui!==ui)return;ui.prev.replaceChildren(ui.stage);ui.busy(false);
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
      const b=el('button','fs-share-btn');b.type='button';b.title='Chia sẻ ảnh chart — xem lớn, chép (Ctrl/⌘+C) hoặc tải PNG';b.setAttribute('aria-label','Chia sẻ ảnh chart');
      b.innerHTML='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>';b.onclick=e=>{e.stopPropagation();open(card,b)};
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
