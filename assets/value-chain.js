/* Sơ đồ chuỗi giá trị kiểu mới cho mọi dashboard ngành (28/10/2026).
   - ValueChain.draw(cfg): vẽ từ cấu hình (Điện, Đường, Dầu khí trong sector-layout.js)
   - Các ngành còn lại vẫn dựng sơ đồ cũ (.chain-node / .chain-edge) trong module riêng; upgrade() đọc lại
     vị trí ô, chữ và mũi tên của sơ đồ đó rồi vẽ lại cùng kiểu, không đổi nội dung. */
(() => {
'use strict';
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
// Sơ đồ chuỗi kiểu mới (Điện, Đường, Dầu khí): mỗi dòng nguyên liệu giữ một màu từ đầu vào tới khách hàng, icon theo khâu,
// mũi tên chạy; rê chuột sáng luồng trên/dưới của khâu, bấm khâu để xem các mã của khâu đó.
const VC_ICON={
 coal:'<path d="M3 19l5-8 3 4 3-5 5 9z"/><path d="M8 11l1-2"/>',
 gas:'<path d="M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-3-1-5 0-7z"/>',
 water:'<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
 factory:'<path d="M3 21V11l5 3v-3l5 3V5h3v16zM3 21h18M18 21V9h3v12"/>',
 dam:'<path d="M4 4h16v8H4zM3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
 wind:'<circle cx="12" cy="9" r="1.4"/><path d="M12 10.4V22M12 9L6 5M12 9l6-2M12 9l1 7"/>',
 bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
 direct:'<path d="M3 12h16M14 7l5 5-5 5M3 6h6M3 18h6"/>',
 tower:'<path d="M12 2L7 22M12 2l5 20M6 7h12M8 13h8M7.5 17l9-4M16.5 17l-9-4"/>',
 home:'<path d="M3 11l9-7 9 7v10H3zM9 21v-6h6v6"/>',
 tool:'<path d="M15 4a5 5 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a5 5 0 0 1-2-2z"/>',
 leaf:'<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7"/>',
 ship:'<path d="M3 15l2 5h14l2-5zM6 15V9h12v6M12 9V4M9 6h6"/>',
 box:'<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
 store:'<path d="M4 10h16l-1-5H5zM5 10v10h14V10M9 20v-5h6v5"/>',
 truck:'<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
 rig:'<path d="M12 2L7 21M12 2l5 19M8 15h8M9.5 9h5M4 21h16"/>',
 refinery:'<path d="M4 21V9h4v12M10 21V5h4v16M16 21v-8h4v8M3 21h18M6 6V4M12 3V1"/>',
 law:'<path d="M12 3v18M5 7h14M7 7l-3 7h6zM17 7l-3 7h6zM8 21h8"/>',
 bank:'<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
 shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
 pill:'<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12.5)"/><path d="M9.5 8.5l5 7"/>',
 fish:'<path d="M3 12c3-4 8-5 12-3l5-3v12l-5-3c-4 2-9 1-12-3z"/><circle cx="8" cy="11" r=".8"/>'
};

// Chữ dài hơn ô thì ép vừa bề rộng (ước lượng theo số ký tự).
const fit=(t,cw,max)=>String(t).length*cw>max?` textLength="${max}" lengthAdjust="spacingAndGlyphs"`:'';
function draw(cfg){
 const {N,E,H=74,height=470,lanes,labels=[],pct=()=>null,width=()=>null}=cfg,B=Object.fromEntries(N.map(n=>[n[0],n]));
 const R=id=>B[id][1]+B[id][3],cy=id=>B[id][2]+H/2;
 const path=([a,b,,d])=>typeof d==='function'?d(R,cy,B):d||(Math.abs(cy(a)-cy(b))<2?`M${R(a)} ${cy(a)} H${B[b][1]}`:`M${R(a)} ${cy(a)} C${(R(a)+B[b][1])/2} ${cy(a)},${(R(a)+B[b][1])/2} ${cy(b)},${B[b][1]} ${cy(b)}`);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,colors=new Set(E.map(e=>e[2]));
 const edges=E.map((e,i)=>{const[a,b,c,,sup]=e,d=path(e),sw=width(a,b);return `<g class="vc-edge" data-a="${a}" data-b="${b}"><path d="${d}" class="edge-base" stroke="${c}"${sw?` style="stroke-width:${sw}px"`:''}/><path id="vce${i}" d="${d}" class="edge-flow${sup?' support':''}" stroke="${c}" marker-end="url(#vca-${c.slice(1)})"/>${reduce||sup?'':`<circle r="3.6" fill="${c}"><animateMotion dur="${2.4+i%4*.35}s" repeatCount="indefinite" begin="${(i*.37)%2}s"><mpath href="#vce${i}"/></animateMotion></circle>`}</g>`}).join('');
 const markers=[...colors].map(c=>`<marker id="vca-${c.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L10 5L0 9Z" fill="${c}"/></marker>`).join('');
 const nodes=N.map(([id,x,y,w,c,ic,title,...sub])=>`<g class="vc-node" data-id="${id}" tabindex="0"><rect class="card" x="${x}" y="${y}" width="${w}" height="${H}" rx="12"/><rect x="${x}" y="${y+12}" width="4" height="${H-24}" rx="2" fill="${c}"/><circle cx="${x+30}" cy="${y+H/2}" r="17" fill="${c}"/><g class="ic" transform="translate(${x+18} ${y+H/2-12})">${VC_ICON[ic]}</g><text x="${x+56}" y="${y+(sub.length>1?24:sub.length?31:H/2+5)}" class="title"${fit(title,7.4,w-66)}>${title}</text>${sub.map((t,i)=>`<text x="${x+56}" y="${y+(sub.length>1?43:50)+i*16}" class="sub"${fit(t,6.2,w-66)}>${t}</text>`).join('')}${pct(id)!=null?`<rect x="${x+w-58}" y="${y-10}" width="52" height="20" rx="10" fill="${c}"/><text x="${x+w-32}" y="${y+4}" text-anchor="middle" class="vc-chip">${pct(id).toLocaleString('vi-VN',{maximumFractionDigits:1})}%</text>`:''}</g>`).join('');
 const lane=lanes.map(([t,x,w,bg,pill])=>`<rect class="chain-lane-bg" x="${x}" y="0" width="${w}" height="${height}" rx="16" fill="${bg}"/><rect x="${x+w/2-t.length*4.4-14}" y="14" width="${t.length*8.8+28}" height="24" rx="12" fill="${pill}"/><text x="${x+w/2}" y="30" text-anchor="middle" class="lane-pill">${t}</text>`).join('');
 const label=(x,y,t)=>`<rect class="edge-label-bg" x="${x-t.length*3.1-8}" y="${y-13}" width="${t.length*6.2+16}" height="19" rx="9.5"/><text x="${x}" y="${y}" text-anchor="middle" class="edge-label">${t}</text>`;
 const fig=make('div','value-chain-scroll');fig.tabIndex=0;fig.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 fig.innerHTML=`<svg class="vc2" data-fs-flow="1" viewBox="0 0 1170 ${height}" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">${cfg.title}</title><desc id="chain-desc">${cfg.desc}</desc><defs>${markers}</defs>${lane}${edges}${nodes}${labels.map(l=>label(...l)).join('')}</svg>${cfg.foot||''}`;
 // Hover or focus a stage to keep only its upstream and downstream links lit.
 const svg=fig.firstElementChild,all=[...svg.querySelectorAll('.vc-edge')];
 const lit=id=>{const on=new Set([id]),walk=(dir)=>{let grow=true;const seen=new Set([id]);while(grow){grow=false;all.forEach(e=>{const[f,t]=dir?[e.dataset.a,e.dataset.b]:[e.dataset.b,e.dataset.a];if(seen.has(f)&&!seen.has(t)){seen.add(t);grow=true}});}seen.forEach(x=>on.add(x))};walk(1);walk(0);svg.classList.add('focus');svg.querySelectorAll('.vc-node').forEach(n=>n.classList.toggle('on',on.has(n.dataset.id)));all.forEach(e=>e.classList.toggle('on',on.has(e.dataset.a)&&on.has(e.dataset.b)))};
 const clear=()=>{svg.classList.remove('focus');svg.querySelectorAll('.on').forEach(n=>n.classList.remove('on'))};
 let picked=null;const status=make('div','vc-status');status.hidden=true;fig.append(status);
 const pick=n=>{const id=picked===n?null:n;picked=id;svg.querySelectorAll('.vc-node').forEach(x=>x.classList.toggle('picked',x===id));
  const codes=id?[...new Set([...id.querySelectorAll('.sub')].flatMap(t=>t.textContent.match(/\b[A-Z][A-Z0-9]{2}\b/g)||[]))]:[],label=id?id.querySelector('.title').textContent:'';
  if(cfg.table){
   document.dispatchEvent(new CustomEvent('vc:select',{detail:id&&codes.length?{id:id.dataset.id,label,codes}:{}}));
   status.innerHTML=id&&codes.length?`Đã lọc bảng doanh nghiệp theo <b>${label}</b> (${codes.join(', ')}) <button type="button">Xem bảng →</button>`:'';
   status.querySelector('button')?.addEventListener('click',()=>{const t=document.querySelector(`[data-block-id="${cfg.table}"]`);const w=t?.closest('[hidden]');if(w)document.getElementById(w.getAttribute('aria-labelledby'))?.click();t?.scrollIntoView({behavior:'smooth',block:'start'})});
  }else status.innerHTML=id&&codes.length?`<b>${label}</b>: ${codes.map(c=>`<span class="pv-chip" data-code="${c}">${c}</span>`).join(' ')} <small>bấm mã để xem định giá và tín hiệu</small>`:'';
  status.hidden=!(id&&codes.length)};
 document.addEventListener('vc:select',e=>{if(!e.detail?.id&&picked){picked.classList.remove('picked');picked=null;status.hidden=true}});
 svg.querySelectorAll('.vc-node').forEach(n=>{n.addEventListener('click',()=>pick(n));n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(n)}});n.addEventListener('mouseenter',()=>lit(n.dataset.id));n.addEventListener('focus',()=>lit(n.dataset.id));n.addEventListener('mouseleave',clear);n.addEventListener('blur',clear)});
 if(cfg.legend){const lg=make('div','vc-legend');lg.innerHTML=cfg.legend.map(([c,t,dash])=>`<span><i style="background:${dash?`repeating-linear-gradient(90deg,${c} 0 4px,transparent 4px 7px)`:c}"></i>${t}</span>`).join('')+'<span>Rê chuột: xem luồng của khâu · bấm: '+(cfg.table?'lọc bảng doanh nghiệp':'xem các mã')+'</span>';fig.prepend(lg)}
 return fig;
}

// ---- Nâng cấp sơ đồ cũ ----
const fold=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const ICON_RULES=[
 [/^khach|nguoi mua|nguoi tieu dung|benh nhan|nguoi benh/,'home'],
 [/chinh sach|fta|phap ly|quy hoach|luat|xuat xu|nha nuoc|chinh phu|phong ve|cbpg|eudr|dau thau/,'law'],
 [/ngan hang|tin dung|trai phieu|von |nguon von|tai chinh|lai suat/,'bank'],
 [/bao hiem|boi thuong|tai bao|tai tuc/,'shield'],
 [/thuoc|duoc|api|benh vien|y te|bhyt/,'pill'],
 [/ca tra|tom|thuy san|ca /,'fish'],
 [/bong|mia|lua|gao|ca phe|cao su|nong|thuc an|giong|heo|vung nuoi|vung nguyen lieu|ngo|dau tuong|quang|da voi|thoi tiet/,'leaf'],
 [/hang tau|tau |tau$|cang|container|logistics|van tai|icd|kho bai|chu hang|xnk|nhap khau|nhap |xuat khau|khach quoc te/,'ship'],
 [/nhan hang|ban le|phan phoi|cua hang|sieu thi|nha thuoc|kenh|tmdt|dai ly|moi gioi/,'store'],
 [/khach|nguoi mua|nguoi tieu dung|benh nhan|nguoi benh|ho dan|dan cu|khach thue|nguoi dan/,'home'],
 [/xay|thi cong|nha thau|ha tang|du an|quy dat|dat |khu cong nghiep|kcn/,'tool'],
 [/dien|nang luong|xang|dau |khi |than/,'bolt'],
 [/nha may|che bien|san xuat|may |det|soi|thep|xi mang|loc|tinh luyen|ep /,'factory']
];
const iconOf=t=>{if(/thuế/i.test(t))return 'law';const f=fold(t)+' ';return (ICON_RULES.find(([re])=>re.test(f))||[])[1]||'box'};
const PALETTE=['#2938A8','#2a9fa3','#861C52','#c98a00','#2f8f4e','#3d4653','#4b5bd4','#b8443a'],SUPPORT='#5a6682';
function upgrade(svg){
 const rects=[...svg.querySelectorAll('rect.chain-node')];if(rects.length<3)return;
 const box=r=>({x:+r.getAttribute('x'),y:+r.getAttribute('y'),w:+r.getAttribute('width'),h:+r.getAttribute('height')});
 const nodes=rects.map((r,i)=>{const b=box(r),tx=r.parentNode.querySelector('text'),lines=tx?[...tx.querySelectorAll('tspan')].map(t=>t.textContent.trim()).filter(Boolean):[];return {id:'n'+i,...b,lines:lines.length?lines:[tx?.textContent.trim()||'']}});
 const near=pt=>{let best=null,bd=1e9;nodes.forEach(n=>{const dx=Math.max(n.x-pt.x,0,pt.x-(n.x+n.w)),dy=Math.max(n.y-pt.y,0,pt.y-(n.y+n.h)),d=Math.hypot(dx,dy);if(d<bd){bd=d;best=n}});return bd<40?best:null};
 const edges=[...svg.querySelectorAll('path.chain-edge')].map(p=>{let L=0;try{L=p.getTotalLength()}catch(e){}if(!L)return null;const a=near(p.getPointAtLength(0)),b=near(p.getPointAtLength(L));const dashed=/dashed|support/.test(p.getAttribute('class')||'')||(getComputedStyle(p).strokeDasharray||'none')!=='none';return a&&b&&a!==b?{a:a.id,b:b.id,dashed}:null}).filter(Boolean);
 if(!edges.length)return;
 // Cột theo x, hàng theo y; dàn lại trên khung 1170 cho đồng đều.
 const xs=[...new Set(nodes.map(n=>Math.round(n.x/40)*40))].sort((a,b)=>a-b),col=n=>xs.indexOf(Math.round(n.x/40)*40);
 // Hàng: gom các y gần nhau (<40px) thành một hàng rồi xếp theo thứ hạng, để sơ đồ gọn dù toạ độ cũ không đều.
 const ys=[...new Set(nodes.map(n=>n.y))].sort((a,b)=>a-b),rows=[];ys.forEach(y=>{if(!rows.length||y-rows.at(-1)>=40)rows.push(y)});
 const row=n=>rows.filter(r=>n.y>=r).length-1;
 const H=74,colW=1130/xs.length,w=Math.min(250,colW-48);
 nodes.forEach(n=>{n.nx=20+col(n)*colW+(colW-12-w)/2;n.ny=30+row(n)*(H+30)});
 const height=Math.round(Math.max(...nodes.map(n=>n.ny))+H+24);
 // Màu: mỗi gốc (không có mũi tên liền đi vào) một màu, lan theo mũi tên liền; khâu chỉ có mũi tên đứt màu xám.
 const solidIn=id=>edges.filter(e=>!e.dashed&&e.b===id),color={};let k=0;
 const order=[...nodes].sort((a,b)=>col(a)-col(b)||a.y-b.y);
 order.forEach(n=>{if(!solidIn(n.id).length)color[n.id]=edges.some(e=>e.a===n.id&&!e.dashed)?PALETTE[k++%PALETTE.length]:SUPPORT});
 for(let pass=0;pass<6;pass++)order.forEach(n=>{if(color[n.id])return;const src=solidIn(n.id).map(e=>color[e.a]).find(Boolean);if(src)color[n.id]=src});
 order.forEach(n=>color[n.id]||(color[n.id]=SUPPORT));
 const N=nodes.map(n=>[n.id,Math.round(n.nx),Math.round(n.ny),Math.round(w),color[n.id],(iconOf(n.lines[0])!=='box'?iconOf(n.lines[0]):iconOf(n.lines.join(' '))),...n.lines]);
 const B=Object.fromEntries(N.map(n=>[n[0],n]));
 const E=edges.map(e=>{const A=B[e.a],T=B[e.b],c=e.dashed?SUPPORT:color[e.a];let d=null;
  if(Math.abs(A[1]-T[1])<5){const down=T[2]>A[2],x=A[1]+w/2;d=`M${x} ${A[2]+(down?H:0)} V${T[2]+(down?0:H)}`}
  else if(T[1]<A[1]){const y1=A[2]+H/2,y2=T[2]+H/2,x1=A[1],x2=T[1]+w;d=`M${x1} ${y1} C${(x1+x2)/2} ${y1},${(x1+x2)/2} ${y2},${x2} ${y2}`}
  return [e.a,e.b,c,d,e.dashed]});
 const legend=[...new Set(nodes.filter(n=>!solidIn(n.id).length&&color[n.id]!==SUPPORT).map(n=>n.id))].map(id=>[color[id],B[id][6]]);
 if(edges.some(e=>e.dashed))legend.push([SUPPORT,'Hỗ trợ · chính sách',true]);
 const fig=draw({N,E,H,height,lanes:xs.map((_,i)=>['',10+i*colW,colW-12,['#eef3fb','#eefaf9','#fbf6ea','#f6f0fa'][i%4],'transparent']),legend,title:svg.querySelector('title')?.textContent||'Chuỗi giá trị',desc:svg.querySelector('desc')?.textContent||''});
 const old=svg.closest('.value-chain-scroll')||svg;
 old.replaceWith(fig);
}
function upgradeAll(){document.querySelectorAll('svg').forEach(s=>{if(s.querySelector('rect.chain-node')&&!s.classList.contains('vc2'))upgrade(s)})}
window.ValueChain={draw,upgrade,upgradeAll};
if(document.readyState==='complete')setTimeout(upgradeAll,50);else addEventListener('load',()=>setTimeout(upgradeAll,50));
})();
