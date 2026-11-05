/* Steel dashboard (Thép): value chain, Nguyên liệu / Thép xây dựng / HRC & tôn mạ / Xuất nhập khẩu panes and sector valuation
   from window.STEEL_PUBLIC (scripts/build_sector_public.py; WiData fills what public sources lack, marked via='wi').
   Document figures sit in the HTML tables and are backed by data/steel/evidence.json.
   Publishes window.STEEL_BRIEF for catalyst-board.js. Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='steel')return;
const W=window.STEEL_PUBLIC||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const S=k=>macro[k]?.records||com[k]?.records||[];
const ym=d=>d.slice(0,7);
const byMonth=rs=>{const m={};rs.forEach(r=>{m[ym(r.date)]=r});return m};
const yoyAt=(rs,r)=>{if(!r)return null;const p=rs.find(x=>ym(x.date)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};
const ytdSum=(rs,y,m)=>rs.filter(r=>r.date.slice(0,4)===y&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0);
const ytdYo=rs=>{const l=rs.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),p=ytdSum(rs,String(y-1),m);return p?(ytdSum(rs,y,m)/p-1)*100:null};
const idx=(rs,base)=>{const b=rs.find(r=>r.date.slice(0,7)>=base);return b&&b.value?rs.map(r=>({date:r.date,value:r.value/b.value*100})):[]};
const SRC={nso:['Cục Thống kê (NSO)',macro.steel_rolled?.url||'https://www.nso.gov.vn/'],customs:['Hải quan Việt Nam',macro.steel_export?.url||'https://www.customs.gov.vn/'],shfe:['SHFE · dữ liệu giao dịch ngày','https://www.shfe.com.cn/eng/Market/Futures/'],wi:['WiData','https://widata.vn/']};

// ---------- 1. Value chain ----------
const chain=document.querySelector('[data-block-id="th-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='04/11/2026'});
 const w=220,h=65;
 const nodes=[
  ['ore',25,40,['Quặng sắt, than cốc','nhập khẩu · lò cao']],['scrap',25,290,['Thép phế, điện','lò điện']],
  ['long',315,40,['Thép xây dựng','HPG · POM · TVN']],['hrc',315,165,['HRC','HPG · nhập khẩu Trung Quốc']],
  ['coat',605,165,['Tôn mạ, ống thép','HSG · NKG · VGS']],['trade',605,40,['Thương mại thép','TLH · SMC']],['export',605,290,['Xuất khẩu','Mỹ · EU · ASEAN']],
  ['build',895,40,['Xây dựng','đầu tư công · BĐS']],['home',895,165,['Mái, nhà xưởng, cơ khí','dân dụng · công nghiệp']],['tariff',895,290,['Thuế phòng vệ','CBPG · Mục 232 · CBAM']]
 ];
 const edges=[['ore','long'],['ore','hrc'],['scrap','long'],['hrc','coat'],['long','trade'],['coat','home'],['coat','export'],['trade','build'],['tariff','export',true]];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b];let d;
  if(A[2]===Bn[2]){const fw=Bn[1]>A[1];d=`M${A[1]+(fw?w:0)} ${A[2]+h/2} H${Bn[1]+(fw?0:w)}`}
  else{const fw=Bn[1]>A[1],x1=A[1]+(fw?w:0),y1=A[2]+h/2,x2=Bn[1]+(fw?0:w),y2=Bn[2]+h/2,mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`}
  return `<path d="${d}" class="chain-edge${dashed?' dashed':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+27}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t.replace(/&/g,'&amp;')}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1140 375" role="img" aria-labelledby="chain-title"><title id="chain-title">Chuỗi giá trị ngành thép</title><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="chain-arrow"/></marker></defs>${paths}${boxes}</svg>`;
 heading.after(figure);
 figure.after(make('div','source-note','Mũi tên liền: dòng thép · Mũi tên đứt: rào cản thương mại. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Panes ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead'),children=[...section.children].filter(e=>e!==head);
 const labels=['Nguyên liệu','Thép xây dựng','HRC & tôn mạ','Xuất nhập khẩu'],ids=['supply-world','supply-vietnam','supply-trade','supply-export'];
 const panes=ids.map(id=>{const p=make('div','supply-pane');p.id=id;return p});
 let cur=panes[0];children.forEach(e=>{if(e.matches('h3.subhead')){cur=panes[labels.indexOf(e.textContent.trim())];e.remove();return}cur.append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Nhóm');
 function select(i){panes.forEach((p,j)=>{p.hidden=i!==j;const b=tabs.children[j];b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1})}
 labels.forEach((label,i)=>{const b=make('button','tabbtn',label);b.type='button';b.id='supply-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',panes[i].id);panes[i].setAttribute('role','tabpanel');panes[i].setAttribute('aria-labelledby',b.id);b.addEventListener('click',()=>select(i));tabs.append(b)});
 head.after(tabs,...panes);select(0);
}

// ---------- 3. Charts ----------
function sourceLine(id,parts,period,method){
 const host=document.getElementById(id);if(!host)return;const block=host.closest('.card');
 const n=make('div','source-note cadence-note');n.append('Nguồn: ');
 parts.forEach(([name,url],i)=>{if(i)n.append(' · ');const a=make('a','',name);a.href=url;a.target='_blank';a.rel='noopener';n.append(a)});
 n.append(' · Kỳ cuối: '+period);host.after(n);
 if(method)n.after(make('div','source-note method-note',method));
 if(block){block.dataset.refreshStatus='loaded';block.dataset.sourceIds='public'}
}
function insight(id,text){const block=document.getElementById(id)?.closest('.card');if(!block)return;const n=make('div','chart-insight');n.dataset.inputOwner='ai';n.innerHTML='<b>Cách hiểu trong bối cảnh ngành · AI:</b> ';n.append(text);block.append(n)}
function legend(id,items){const host=document.getElementById(id);if(!host)return;const l=make('div','legend');items.forEach(([n,c])=>{const s=make('span','li'),d=make('span','dot');d.style.background=c;s.append(d,n);l.append(s)});host.after(l)}
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;card.querySelector('.value').textContent=value;card.querySelector('.sub').textContent=sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();const sv=(series||[]).filter(Number.isFinite);if(sv.length>1)sparkline(spark,sv,color)}
function lines(id,base,series,unit,digits,zeroBase=false){barLineChart(id,{categories:base.map(r=>mon(r.date)),series:series.map(([n,c,f])=>({name:n,color:c,kind:'line',values:base.map(f)})),unit,digits,height:260,zeroBase,rotateLabels:true})}
const bars=(id,rs,name,color,unit,digits,f=r=>r.value)=>barLineChart(id,{categories:rs.map(r=>mon(r.date)),series:[{name,color,values:rs.map(f)}],unit,digits,height:260,rotateLabels:true});
const BASE='2024-02';
const ore=S('iron_ore_cny'),coke=S('coke'),scrap=S('scrap'),hrc=S('hrc'),rbc=S('rebar_cn'),rebar=S('rebar_hpg'),ton=S('ton_lanh'),galv=S('galv_cn'),rolled=S('steel_rolled'),bar=S('steel_bar'),crude=S('crude_vn'),crudeCn=S('crude_cn'),exp=S('steel_export'),imp=S('steel_import'),iipM=S('iip_metal');

// Nguyên liệu
if(ore.length&&document.getElementById('chInput')){
 const oi=byMonth(idx(ore,BASE)),ki=byMonth(idx(coke,BASE)),si=byMonth(idx(scrap,BASE)),base=ore.filter(r=>ym(r.date)>=BASE);
 lines('chInput',base,[['Quặng sắt',C.navy,r=>oi[ym(r.date)]?.value??null],['Than cốc',C.gold,r=>ki[ym(r.date)]?.value??null],['Thép phế',C.teal,r=>si[ym(r.date)]?.value??null]],'',0);
 legend('chInput',[['Quặng sắt',C.navy],['Than cốc',C.gold],['Thép phế',C.teal]]);
 const km=byMonth(coke),sm=byMonth(scrap);
 fillTable('tbl-input',['Kỳ','Quặng sắt (CNY/tấn)','Than cốc (CNY/tấn)','Thép phế (USD/tấn)'],ore.slice().reverse().map(r=>[short(r.date),nf(r.value,1),nf(km[ym(r.date)]?.value,1),nf(sm[ym(r.date)]?.value,1)]));
 sourceLine('chInput',[SRC.wi],short(ore.at(-1).date),'Chỉ số T2/2024 = 100, giá cuối tháng. Quặng và than cốc giao ngay Trung Quốc; thép phế USD/tấn.');
 const oL=ore.at(-1),kL=coke.at(-1),sL=scrap.at(-1);
 insight('chInput','Quặng '+signed(yoyAt(ore,oL),0)+'%, than cốc '+signed(yoyAt(coke,kL),0)+'%, thép phế '+signed(yoyAt(scrap,sL),0)+'% so cùng kỳ. Lò cao ăn theo quặng, than cốc; lò điện theo thép phế: đọc riêng HPG với POM, TVN.');
}
if(crudeCn.length&&document.getElementById('chCrudeCn')){
 const rs=crudeCn.filter(r=>r.date>='2025-01');
 bars('chCrudeCn',rs,'Thép thô Trung Quốc',C.navy,'triệu tấn',1,r=>r.value/100);
 const yy=r=>yoyAt(crudeCn,r);
 fillTable('tbl-crude-cn',['Tháng','Triệu tấn','YoY'],crudeCn.slice().reverse().map(r=>[mon(r.date),nf(r.value/100,1),signed(yy(r),1)+'%']));
 sourceLine('chCrudeCn',[SRC.wi],mon(crudeCn.at(-1).date),'Cục Thống kê Trung Quốc qua WiData. Không có số riêng tháng 1, 2.');
 insight('chCrudeCn','Tháng gần nhất '+signed(yy(crudeCn.at(-1)),1)+'% so cùng kỳ. Sản lượng Trung Quốc quyết định lượng thép dư đẩy ra xuất khẩu, tức sức ép lên giá HRC châu Á.');
}
// Thép xây dựng
if(rebar.length&&document.getElementById('chRebar')){
 const rs=rebar.slice(-28),rm=byMonth(rbc);
 barLineChart('chRebar',{categories:rs.map(r=>mon(r.date)),series:[{name:'CB300 D10 Hòa Phát',color:C.navy,kind:'line',values:rs.map(r=>r.value)}],unit:'nghìn đ/kg',digits:2,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-rebar',['Kỳ','CB300 Hòa Phát (nghìn đ/kg)','YoY','Thép thanh vằn SHFE (CNY/tấn)'],rebar.slice().reverse().map(r=>[short(r.date),nf(r.value,2),signed(yoyAt(rebar,r),1)+'%',nf(rm[ym(r.date)]?.value,0)]));
 sourceLine('chRebar',[SRC.wi,SRC.shfe],short(rebar.at(-1).date),'Giá niêm yết, cuối tháng. Giá giao dịch thực tế có thể thấp hơn do chiết khấu.');
 const L=rebar.at(-1);
 insight('chRebar','CB300 '+nf(L.value,2)+' nghìn đ/kg, '+signed(yoyAt(rebar,L),0)+'% so cùng kỳ, trong khi thép thanh SHFE '+signed(yoyAt(rbc,rbc.at(-1)),0)+'%. Khi giá trong nước cách xa giá Trung Quốc, hàng nhập có động cơ quay lại.');
}
if(rolled.length&&document.getElementById('chSteelOut')){
 const bm=byMonth(bar),rs=rolled.slice(-36);
 barLineChart('chSteelOut',{categories:rs.map(r=>mon(r.date)),series:[{name:'Thép cán',color:C.navy,values:rs.map(r=>r.value)},{name:'Thép thanh, thép góc',color:C.teal,kind:'line',values:rs.map(r=>bm[ym(r.date)]?.value??null)}],unit:'nghìn tấn',digits:0,height:260,rotateLabels:true});
 legend('chSteelOut',[['Thép cán',C.navy],['Thép thanh, thép góc',C.teal]]);
 fillTable('tbl-steel-out',['Tháng','Thép cán (nghìn tấn)','YoY','Thép thanh, góc (nghìn tấn)','YoY'],rolled.slice().reverse().map(r=>{const b=bm[ym(r.date)];return [mon(r.date),nf(r.value,0),signed(yoyAt(rolled,r),1)+'%',nf(b?.value,0),signed(yoyAt(bar,b),1)+'%']}));
 sourceLine('chSteelOut',[SRC.nso],mon(rolled.at(-1).date),'Sản lượng sản xuất, không phải tiêu thụ.');
 insight('chSteelOut','Lũy kế thép cán '+signed(ytdYo(rolled),0)+'%, thép thanh, góc '+signed(ytdYo(bar),0)+'%. Chênh lệch giữa hai đường là phần tăng không đến từ thép xây dựng.');
}
// HRC & tôn mạ
if(hrc.length&&document.getElementById('chHrc')){
 const ti=byMonth(idx(ton,BASE)),hi=byMonth(idx(hrc,BASE)),gi=byMonth(idx(galv,BASE)),base=hrc.filter(r=>ym(r.date)>=BASE);
 lines('chHrc',base,[['HRC SHFE',C.navy,r=>hi[ym(r.date)]?.value??null],['Thép mạ kẽm Trung Quốc',C.gold,r=>gi[ym(r.date)]?.value??null],['Tôn lạnh Hoa Sen',C.teal,r=>ti[ym(r.date)]?.value??null]],'',0);
 legend('chHrc',[['HRC SHFE',C.navy],['Thép mạ kẽm Trung Quốc',C.gold],['Tôn lạnh Hoa Sen',C.teal]]);
 const gm=byMonth(galv),tm=byMonth(ton);
 fillTable('tbl-hrc',['Kỳ','HRC SHFE (CNY/tấn)','Mạ kẽm TQ (CNY/tấn)','Tôn lạnh Hoa Sen 45mm (nghìn đ/m²)'],hrc.slice().reverse().map(r=>[short(r.date),nf(r.value,0),nf(gm[ym(r.date)]?.value,1),nf(tm[ym(r.date)]?.value,2)]));
 sourceLine('chHrc',[SRC.shfe,SRC.wi],short(hrc.at(-1).date),'Chỉ số T2/2024 = 100, cuối tháng. HRC là hợp đồng chính SHFE. Chưa có giá HRC Việt Nam dạng chuỗi.');
 const hL=hrc.at(-1),tL=ton.at(-1);
 insight('chHrc','HRC '+signed(yoyAt(hrc,hL),0)+'%, tôn lạnh Hoa Sen '+signed(yoyAt(ton,tL),0)+'% so cùng kỳ. Tôn tăng nhanh hơn HRC thì biên nới; HRC giảm mạnh thì tồn kho giá cao thành lỗ.');
}
// Xuất nhập khẩu
if(exp.length&&document.getElementById('chTrade')){
 const im=byMonth(imp),rs=exp.slice(-36);
 barLineChart('chTrade',{categories:rs.map(r=>mon(r.date)),series:[{name:'Xuất khẩu sắt thép',color:C.teal,values:rs.map(r=>r.value)},...(imp.length?[{name:'Nhập khẩu sắt thép',color:C.navy,values:rs.map(r=>im[ym(r.date)]?.value??null)}]:[])],unit:'triệu USD',digits:0,height:260,rotateLabels:true});
 legend('chTrade',[['Xuất khẩu',C.teal],...(imp.length?[['Nhập khẩu',C.navy]]:[])]);
 fillTable('tbl-trade',['Tháng','Xuất khẩu (triệu USD)','YoY','Nhập khẩu (triệu USD)','YoY'],exp.slice().reverse().map(r=>{const m=im[ym(r.date)];return [mon(r.date),nf(r.value,1),signed(yoyAt(exp,r),0)+'%',nf(m?.value,1),signed(yoyAt(imp,m),0)+'%']}));
 sourceLine('chTrade',[SRC.customs],mon(exp.at(-1).date),'Giá trị USD theo tháng, "sắt thép các loại". Không tách HRC, tôn mạ.');
 insight('chTrade','Lũy kế xuất khẩu '+signed(ytdYo(exp),0)+'%'+(imp.length?', nhập khẩu '+signed(ytdYo(imp),0)+'%':'')+'. Bảng này không tách HRC, tôn mạ nên chỉ đọc xu hướng chung.');
}
// ---------- 3b. Giá – Chi phí – Margin (05/11/2026): chỉ số dẫn xuất từ chuỗi đã có ----------
const fx=S('cny_usd'),vnd=S('usdvnd'),us7210=S('us_imp_7210');
const fxM=byMonth(fx),vndM=byMonth(vnd),oreM=byMonth(ore),cokeM=byMonth(coke),hrcM=byMonth(hrc),impM=byMonth(imp);
const lastAt=(m,key)=>{let k=key,v=m[k];for(let i=0;i<3&&!v;i++){const d=new Date(k+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()-1);k=d.toISOString().slice(0,7);v=m[k]}return v};
const avg=a=>{const w=a.filter(Number.isFinite);return w.length?w.reduce((s,x)=>s+x,0)/w.length:null};
// Metal spread lò cao (ước) = HRC SHFE − (1,6 × quặng + 0,5 × than cốc), cùng CNY/tấn; USD/tấn qua CNY/USD cuối tháng.
const spread=hrc.map(r=>{const k=ym(r.date),o=oreM[k],c=cokeM[k],f=lastAt(fxM,k);if(!o||!c)return null;const cny=r.value-(1.6*o.value+0.5*c.value);return {date:r.date,cny,usd:f?cny/f.value:null,hrc:r.value,ore:o.value,coke:c.value}}).filter(Boolean);
const spL=spread.at(-1),spUsd=spL?.usd,sp3=spread.at(-4);
const quarterOf=d=>d.slice(0,4)+'Q'+Math.ceil(Number(d.slice(5,7))/3);
const qLabel=q=>'Q'+q.slice(5)+'/'+q.slice(2,4);
if(spread.length&&document.getElementById('chMetalSpread')){
 const rs=spread.slice(-30);
 barLineChart('chMetalSpread',{categories:rs.map(r=>mon(r.date)),series:[{name:'Spread lò cao (ước)',color:C.navy,values:rs.map(r=>Math.round(r.cny))},{name:'HRC SHFE',color:C.teal,kind:'line',values:rs.map(r=>r.hrc)},{name:'Chi phí quặng + cốc (1,6 q + 0,5 c)',color:C.gold,kind:'line',values:rs.map(r=>Math.round(1.6*r.ore+0.5*r.coke))}],unit:'CNY/tấn',digits:0,height:260,rotateLabels:true});
 legend('chMetalSpread',[['Spread lò cao',C.navy],['HRC SHFE',C.teal],['1,6 × quặng + 0,5 × than cốc',C.gold]]);
 fillTable('tbl-metal-spread',['Kỳ','HRC SHFE (CNY/t)','Quặng (CNY/t)','Than cốc (CNY/t)','Spread (CNY/t)','Spread (USD/t)'],spread.slice().reverse().map(r=>[short(r.date),nf(r.hrc,0),nf(r.ore,1),nf(r.coke,1),nf(r.cny,0),nf(r.usd,0)]));
 sourceLine('chMetalSpread',[SRC.shfe,SRC.wi,['FRED · CNY/USD',com.cny_usd?.url||'https://fred.stlouisfed.org/series/DEXCHUS']],short(spL.date),'Ước tính: HRC − (1,6 tấn quặng + 0,5 tấn than cốc) theo định mức lò cao phổ biến; chưa trừ phế liệu thu hồi, nhiên liệu, nhân công, khấu hao. Giá Trung Quốc, chưa phải giá bán và giá vốn của HPG.');
 insight('chMetalSpread','Spread '+nf(spL.cny,0)+' CNY/t ('+(spUsd!=null?nf(spUsd,0)+' USD/t':'—')+(sp3?', 3 tháng trước '+nf(sp3.cny,0):'')+'). Đây là lợi nhuận gộp lý thuyết mỗi tấn HRC của một lò cao mua quặng, than theo giá Trung Quốc: nới rộng thì HPG có dư địa biên dù giá bán đứng yên; co hẹp thì HPG phải dựa vào sản lượng Dung Quất 2.');
}
// Spread theo quý chồng biên gộp HPG (BCTC quý, data/company-quarterly.js; chỉ đọc)
const CQ=window.COMPANY_QUARTERLY||{},hpgQ=(CQ.companies||[]).find(c=>c.symbol==='HPG');
if(spread.length&&document.getElementById('chSpreadMargin')){
 const byQ={};spread.forEach(r=>{(byQ[quarterOf(r.date)]=byQ[quarterOf(r.date)]||[]).push(r)});
 const qs=Object.keys(byQ).sort().slice(-10);
 const gm=q=>{if(!hpgQ)return null;const i=(CQ.quarters||[]).indexOf(qLabel(q));return i>=0?hpgQ.gross_margin[i]:null};
 const spQ=q=>avg(byQ[q].map(r=>r.usd));
 barLineChart('chSpreadMargin',{categories:qs.map(qLabel),series:[{name:'Spread lò cao BQ quý (USD/t)',color:C.navy,values:qs.map(q=>spQ(q)==null?null:Math.round(spQ(q)))},{name:'Biên gộp HPG (%) ×10',color:C.plum,kind:'line',values:qs.map(q=>gm(q)==null?null:gm(q)*10)}],unit:'',digits:0,height:260,rotateLabels:false});
 legend('chSpreadMargin',[['Spread BQ quý (USD/t)',C.navy],['Biên gộp HPG (%) ×10',C.plum]]);
 fillTable('tbl-spread-margin',['Quý','Spread BQ (USD/t)','Số tháng','Biên gộp HPG (%)'],qs.slice().reverse().map(q=>[qLabel(q),nf(spQ(q),0),String(byQ[q].length),nf(gm(q),1)]));
 sourceLine('chSpreadMargin',[SRC.shfe,SRC.wi,['VNDirect · BCTC quý',CQ.source_url||'https://dstock.vndirect.com.vn/']],qs.length?qLabel(qs.at(-1)):'—','Biên gộp hợp nhất HPG (gồm nông nghiệp, điện lạnh, BĐS); quý đang dở chỉ có số tháng đã qua. Biên nhân 10 để cùng trục.');
 insight('chSpreadMargin','Nếu biên gộp HPG đi cùng chiều spread Trung Quốc, giá nguyên liệu nhập là biến giải thích chính; khi biên tách khỏi spread (như 2025–2026), phần chênh đến từ giá bán trong nước được thuế chống bán phá giá bảo hộ và sản lượng Dung Quất 2 hạ khấu hao mỗi tấn.');
}
// Spread tôn − HRC (ước, kênh bán lẻ) và HRC 3 tháng
const KG_M2=0.45e-3*7850; // 0,45 mm × 7.850 kg/m³ = 3,53 kg/m²
const tonT=ton.map(r=>({date:r.date,value:r.value*1000/KG_M2/1e6*1000})); // nghìn đ/m² → triệu đ/tấn
const hrcVnd=hrc.map(r=>{const k=ym(r.date),f=lastAt(fxM,k),u=lastAt(vndM,k);return f&&u?{date:r.date,value:r.value/f.value*u.value/1e6}:null}).filter(Boolean);
const tonM=byMonth(tonT),hrcVM=byMonth(hrcVnd);
const coat=hrcVnd.map(r=>{const t=tonM[ym(r.date)];return t?{date:r.date,hrc:r.value,ton:t.value,spread:t.value-r.value}:null}).filter(Boolean);
const cL=coat.at(-1),c3=coat.at(-4);
const hrc3=hrc.length>3?(hrc.at(-1).value/hrc.at(-4).value-1)*100:null,hrc1=hrc.length>1?(hrc.at(-1).value/hrc.at(-2).value-1)*100:null;
if(coat.length&&document.getElementById('chCoatSpread')){
 const rs=coat.slice(-30);
 barLineChart('chCoatSpread',{categories:rs.map(r=>mon(r.date)),series:[{name:'Chênh tôn lạnh − HRC (ước)',color:C.gold,values:rs.map(r=>+r.spread.toFixed(2))},{name:'Tôn lạnh Hoa Sen quy đổi',color:C.teal,kind:'line',values:rs.map(r=>+r.ton.toFixed(2))},{name:'HRC SHFE quy đổi',color:C.navy,kind:'line',values:rs.map(r=>+r.hrc.toFixed(2))}],unit:'triệu đ/tấn',digits:1,height:260,rotateLabels:true});
 legend('chCoatSpread',[['Chênh tôn − HRC',C.gold],['Tôn lạnh Hoa Sen (triệu đ/tấn)',C.teal],['HRC SHFE (triệu đ/tấn)',C.navy]]);
 fillTable('tbl-coat-spread',['Kỳ','Tôn lạnh (triệu đ/tấn)','HRC SHFE (triệu đ/tấn)','Chênh (triệu đ/tấn)','HRC SHFE (CNY/t)'],coat.slice().reverse().map(r=>[short(r.date),nf(r.ton,2),nf(r.hrc,2),nf(r.spread,2),nf(hrcM[ym(r.date)]?.value,0)]));
 sourceLine('chCoatSpread',[SRC.wi,SRC.shfe,['SBV · tỷ giá trung tâm',macro.usdvnd?.url||'https://www.sbv.gov.vn/'],['FRED · CNY/USD',com.cny_usd?.url||'https://fred.stlouisfed.org/series/DEXCHUS']],short(cL.date),'Quy đổi: tôn lạnh Hoa Sen 0,45 mm (nghìn đ/m²) ÷ 3,53 kg/m² (0,45 mm × 7.850 kg/m³); HRC SHFE (CNY/t) × tỷ giá trung tâm USD/VND ÷ CNY/USD. Giá tôn là giá bán lẻ niêm yết (có VAT, chiết khấu chưa trừ) nên mức chênh cao hơn biên nhà máy; chỉ đọc xu hướng.');
 const box=document.getElementById('hrc3box');
 if(box){box.innerHTML='';const big=make('div','hrc3-big',hrc3==null?'—':signed(hrc3,1)+'%');big.style.color=hrc3==null?'':hrc3<-5?C.red:hrc3>5?C.green:C.navy;box.append(make('div','hrc3-label','HRC SHFE 3 tháng gần nhất'),big,make('div','hrc3-sub',(hrc.length>3?short(hrc.at(-4).date)+' → '+short(hrc.at(-1).date)+' · ':'')+'1 tháng '+signed(hrc1,1)+'%'),make('div','hrc3-read',hrc3==null?'Thiếu dữ liệu':hrc3<-5?'HRC giảm hơn 5%: tồn kho HRC mua 2–3 tháng trước đắt hơn giá hiện tại, HSG/NKG/SMC có rủi ro lỗ tồn kho trong quý.':hrc3>5?'HRC tăng hơn 5%: tồn kho giá thấp bán theo giá mới, HSG/NKG/SMC có lãi tồn kho trong quý.':'HRC đi ngang trong ±5%: lãi/lỗ tồn kho không đáng kể; biên phụ thuộc chênh tôn − HRC.'))}
 insight('chCoatSpread','Chênh tôn − HRC '+nf(cL.spread,1)+' triệu đ/tấn'+(c3?' ('+(cL.spread>=c3.spread?'nới':'hẹp')+' so 3 tháng trước '+nf(c3.spread,1)+')':'')+'. Tôn mạ ăn chênh này trừ chi phí mạ; HRC đi hướng nào trong 3 tháng quyết định thêm lãi/lỗ tồn kho, xem ô bên cạnh.');
}
// Sản lượng bán hàng HPG theo sản phẩm theo quý (hoaphat.com.vn, evidence th-15) và nhập khẩu sắt thép theo quý
if(document.getElementById('chHpgVol')){
 const Q=['2026Q1','2026Q2','2026Q3'];
 const vol={'HRC':[1.4,1.9,2.0],'Thép xây dựng, cuộn CLC':[1.4,1.3,1.3],'Phôi thép':[0.2,0.3,0.383],'Ống thép':[0.241,0.212,0.228],'Tôn mạ':[0.106,0.083,0.118],'Thép dự ứng lực':[0.062,0.065,0.0645]};
 const cols=[C.navy,C.teal,C.grey,C.gold,C.plum,C.green];
 const impQ=q=>{const ms=imp.filter(r=>quarterOf(r.date)===q);return ms.length===3?ms.reduce((a,r)=>a+r.value,0)/1000:null};
 const model={categories:Q.map(qLabel),series:[...Object.entries(vol).map(([n,v],i)=>({name:n,color:cols[i],values:v})),{name:'Nhập khẩu sắt thép VN (tỷ USD, trục chung)',color:C.red,kind:'line',values:Q.map(impQ)}],unit:'',digits:2,height:260,rotateLabels:false,aria:'Sản lượng bán hàng Hòa Phát theo sản phẩm'};
 const host=document.getElementById('chHpgVol');
 if(window.ChartTypes)ChartTypes.mount(host,{...model,native:'stack',stackable:true},()=>{host.innerHTML=ChartTypes.render(model,'stack')});else barLineChart('chHpgVol',model);
 legend('chHpgVol',[...Object.keys(vol).map((n,i)=>[n,cols[i]]),['Nhập khẩu sắt thép VN (tỷ USD)',C.red]]);
 const sum=a=>a.reduce((s,x)=>s+x,0);
 fillTable('tbl-hpg-vol',['Sản phẩm (triệu tấn)','Q1/26','Q2/26','Q3/26','9T/2026','9T/2026 YoY','9T/2025 (suy từ YoY)'],
  [['HRC','>1,4','1,9','>2,0','5,47','+59%','3,44'],['Thép xây dựng, cuộn CLC','1,4','1,3','>1,3','>4,0','+15%','~3,5'],['Phôi thép','~0,2 (suy)','~0,3 (suy)','0,383','0,811','+69%','0,48'],['Ống thép','0,241','0,212','0,228','0,681','+9%','0,625'],['Tôn mạ','0,106','0,083','0,118','0,307','−4%','0,32'],['Thép dự ứng lực','0,062','0,065','0,0645','0,192','+66%','0,116'],['Nhập khẩu sắt thép VN (tỷ USD)',...Q.map(q=>nf(impQ(q),2)),nf(sum(Q.map(q=>impQ(q)||0)),2),signed(ytdYo(imp),0)+'%','—']]);
 sourceLine('chHpgVol',[['Hòa Phát · 9T/2026','https://www.hoaphat.com.vn/tin-tuc/hoa-phat-ban-hon-10-3-trieu-tan-thep-trong-9-thang-tang-39-so-voi-cung-ky-nam-truoc.html'],['Hòa Phát · 6T/2026','https://www.hoaphat.com.vn/tin-tuc/hoa-phat-san-xuat-7-trieu-tan-thep-trong-nua-dau-nam-2026-tang-36-so-voi-cung-ky-2025.html'],['Hòa Phát · Q1/2026','https://www.hoaphat.com.vn/tin-tuc/hoa-phat-dat-9-056-ty-dong-loi-nhuan-sau-thue-quy-1-tang-170-so-voi-cung-ky.html'],SRC.customs],'Q3/2026','Tin Hòa Phát làm tròn ("hơn 1,3", "trên 2 triệu tấn"); phôi Q1, Q2 suy từ tổng bán hàng trừ HRC và thép xây dựng nên lệch làm tròn so với 9T. Nhập khẩu là giá trị USD cả nước, cộng 3 tháng, vẽ chung trục với triệu tấn chỉ để so hướng.');
 insight('chHpgVol','HRC Hòa Phát từ 1,4 lên hơn 2 triệu tấn/quý khi Dung Quất 2 chạy, còn nhập khẩu sắt thép cả nước '+signed(ytdYo(imp),0)+'% lũy kế: hàng nội thay hàng nhập là cơ chế của thuế chống bán phá giá HRC. HRC xuất khẩu chiếm 24,6% sản lượng quý 3, nên quota EU và thuế Mỹ vẫn chạm tới HPG.');
}
// Mỹ nhập khẩu tôn mạ HS 7210 từ Việt Nam (Wi bảng 312, USD)
if(us7210.length&&document.getElementById('chUs7210')){
 const months=[];{const d=new Date(us7210[0].date.slice(0,7)+'-01T00:00:00Z'),end=us7210.at(-1).date.slice(0,7);for(let k=d.toISOString().slice(0,7);k<=end;d.setUTCMonth(d.getUTCMonth()+1),k=d.toISOString().slice(0,7))months.push(k)}
 const m=byMonth(us7210),rs=months.slice(-36);
 barLineChart('chUs7210',{categories:rs.map(k=>mon(k+'-01')),series:[{name:'Mỹ nhập khẩu HS 7210 từ Việt Nam',color:C.plum,values:rs.map(k=>m[k]?m[k].value/1e6:null)}],unit:'triệu USD',digits:1,height:260,rotateLabels:true});
 fillTable('tbl-us-7210',['Tháng','Triệu USD','YoY'],months.slice().reverse().map(k=>[mon(k+'-01'),m[k]?nf(m[k].value/1e6,2):'— (không có số)',m[k]?signed(yoyAt(us7210,m[k]),0)+'%':'—']));
 sourceLine('chUs7210',[SRC.wi,['US Census qua WiData · bảng 312','https://widata.vn/']],mon(us7210.at(-1).date),'HS 7210: sắt thép cán phẳng đã mạ, phủ (tôn mạ kẽm, mạ màu). Tháng không có số là tháng Wi không trả giá trị, không phải bằng 0.');
 const L=us7210.at(-1),peak=us7210.reduce((a,r)=>r.value>a.value?r:a,us7210[0]);
 insight('chUs7210','Tháng gần nhất '+nf(L.value/1e6,1)+' triệu USD so đỉnh '+nf(peak.value/1e6,0)+' triệu USD ('+mon(peak.date)+'). Thuế AD/CVD tôn mạ (HSG 110,19%, NKG 94,89%) và Mục 232 50% gần như đóng cửa thị trường Mỹ với tôn mạ Việt Nam; dòng tiền của HSG/NKG phải tìm ở nội địa, ASEAN và EU trong hạn ngạch.');
}
// Định giá
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['281','Thép xây dựng & HRC',C.navy],['282','Tôn mạ & ống',C.teal],['283','Thương mại thép',C.gold]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/B '+name,color,kind:'line',values:weekly.map(d=>at(id,d,2))})),unit:'x',digits:1,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Rổ mã','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),r[1]>0&&r[1]<200?nf(r[1],1):'—',nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[['VNDirect finfo','https://dstock.vndirect.com.vn/']],short(dates.at(-1)),'Rổ mã theo dõi: Thép xây dựng & HRC (HPG, POM, TVN); Tôn mạ & ống (HSG, NKG, VGS); Thương mại (TLH, SMC). Rổ theo vốn hóa nên nhóm đầu gần như là HPG.');
}
// ---------- 4. KPIs, quick read, catalyst brief ----------
const rL=rebar.at(-1),hL=hrc.at(-1),tL=ton.at(-1),oL=ore.at(-1),kL=coke.at(-1),eL=exp.at(-1),pe=sec['281']?.records||[],peL=pe.at(-1),peT=sec['282']?.records?.at(-1);
const rY=yoyAt(rebar,rL),hY=yoyAt(hrc,hL),tY=yoyAt(ton,tL),oY=yoyAt(ore,oL),kY=yoyAt(coke,kL),sY=yoyAt(scrap,scrap.at(-1)),barY=ytdYo(bar),expY=ytdYo(exp),impY=ytdYo(imp),cnL=crudeCn.at(-1),cnY=yoyAt(crudeCn,cnL);
kpi('spk-rebar',rL?nf(rL.value,2):'—',rL?'nghìn đ/kg · '+short(rL.date):'—',rL?signed(rY,0)+'% so cùng kỳ':'',rebar.slice(-12).map(r=>r.value));
kpi('spk-hrc',hL?nf(hL.value,0):'—',hL?'CNY/tấn · '+short(hL.date):'—',hL?signed(hY,0)+'% so cùng kỳ':'',hrc.slice(-12).map(r=>r.value),C.teal);
kpi('spk-ton',tL?nf(tL.value,1):'—',tL?'nghìn đ/m² · '+short(tL.date):'—',tL?signed(tY,0)+'% so cùng kỳ':'',ton.slice(-12).map(r=>r.value),C.grey);
kpi('spk-ore',oL?nf(oL.value,0):'—',oL?'CNY/tấn · '+short(oL.date):'—',oL?signed(oY,0)+'% so cùng kỳ':'',ore.slice(-12).map(r=>r.value),C.gold);
kpi('spk-bar',bar.at(-1)?nf(bar.at(-1).value,0):'—',bar.at(-1)?'nghìn tấn · '+mon(bar.at(-1).date):'—',barY!=null?'lũy kế '+signed(barY,0)+'%':'',bar.slice(-12).map(r=>r.value),C.navy);
kpi('spk-pe',peL?nf(peL[1],1)+'x':'—',peL?'P/E thép XD & HRC · '+short(peL[0]):'—',peL?'P/B '+nf(peL[2],2)+'x':'',pe.slice(-30).map(r=>r[1]),C.grey);
const quick=document.querySelector('.hero .insight');
if(quick&&rL){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh: '),`CB300 ${nf(rL.value,2)} nghìn đ/kg (${signed(rY,0)}%), HRC SHFE ${signed(hY,0)}%, quặng ${signed(oY,0)}%, than cốc ${signed(kY,0)}%. Thép thanh, góc lũy kế ${signed(barY,0)}%.`);
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
const imp3Y=imp.length>3?avg(imp.slice(-3).map(r=>yoyAt(imp,r))):null;
const row=(group,name,big,evidence,cond,st,who,chart)=>({group,name,big,chart,st,mid:[evidence,cond],end:[who]});
const score=[
 row('Cầu','Thép xây dựng trong nước',[signed(barY,0)+'%','thép thanh, góc lũy kế'],bar.at(-1)?mon(bar.at(-1).date)+' '+nf(bar.at(-1).value,0)+' nghìn tấn':'—','Lũy kế về dưới 0%',barY==null?'na':barY>5?'good':barY<0?'risk':'watch','▲ HPG · POM · TVN','chSteelOut'),
 row('Giá','Giá CB300 trong nước',[rL?nf(rL.value,2):'—','nghìn đ/kg ('+signed(rY,0)+'%)'],'Quặng '+signed(oY,0)+'%, than cốc '+signed(kY,0)+'%, thép phế '+signed(sY,0)+'%','CB300 về dưới 13 nghìn đ/kg',rY==null?'na':rY>3?'good':rY<-5?'risk':'watch','▲ HPG · POM · TVN','chRebar'),
 row('Giá','HRC Trung Quốc',[signed(hY,0)+'%','HRC SHFE YoY'],'HRC '+(hL?nf(hL.value,0):'—')+' CNY/tấn; là trần giá HRC trong nước','HRC SHFE > 3.500 CNY/tấn',hY==null?'na':hY<-5?'risk':hY>5?'good':'watch','HPG (bán HRC) · HSG · NKG (mua HRC)','chHrc'),
 row('Biên','Tôn mạ so HRC',[signed(tY,0)+'%','tôn lạnh Hoa Sen YoY'],'HRC '+signed(hY,0)+'%','Giá tôn giảm nhanh hơn HRC',tY==null||hY==null?'na':tY-(hY||0)>3?'good':tY-(hY||0)<-3?'risk':'watch','▲ HSG · NKG · VGS','chHrc'),
 row('Cung','Thép thô Trung Quốc',[signed(cnY,1)+'%','tháng gần nhất YoY'],cnL?mon(cnL.date)+' '+nf(cnL.value/100,1)+' triệu tấn':'—','Tăng lại trên +3%',cnY==null?'na':cnY<-3?'good':cnY>3?'risk':'watch','HPG · HSG · NKG','chCrudeCn'),
 row('Thương mại','Xuất nhập khẩu thép',[signed(expY,0)+'%','xuất khẩu lũy kế'],'Nhập khẩu '+signed(impY,0)+'%','Xuất khẩu lũy kế về dưới 0%',expY==null?'na':expY>10?'good':expY<0?'risk':'watch','HSG · NKG · HPG','chTrade'),
 row('Biên','Spread lò cao (ước)',[spUsd!=null?nf(spUsd,0)+' USD/t':'—','HRC − (1,6 quặng + 0,5 cốc)'],spL?nf(spL.cny,0)+' CNY/t'+(sp3?', 3 tháng trước '+nf(sp3.cny,0):''):'—','Trên 200 USD/t là thuận; dưới 100 USD/t là rủi ro (ngưỡng ước)',spUsd==null?'na':spUsd>200?'good':spUsd<100?'risk':'watch','▲ HPG (lò cao)','chMetalSpread'),
 row('Giá','HRC 3 tháng (lãi/lỗ tồn kho)',[signed(hrc3,1)+'%','HRC SHFE 3 tháng'],cL?'Chênh tôn − HRC '+nf(cL.spread,1)+' triệu đ/tấn':'—','HRC giảm hơn 5% trong 3 tháng = rủi ro lỗ tồn kho; tăng hơn 5% = lãi tồn kho',hrc3==null?'na':hrc3<-5?'risk':hrc3>5?'good':'watch','HSG · NKG · SMC · TLH','chCoatSpread'),
 row('Thương mại','Nhập khẩu sắt thép (AD20 có tác dụng?)',[imp.at(-1)?nf(imp.at(-1).value,0)+' tr USD':'—','tháng '+(imp.at(-1)?mon(imp.at(-1).date):'—')],'YoY BQ 3 tháng '+signed(imp3Y,0)+'%; chưa có chuỗi lượng (tấn)','Âm YoY 3 tháng liên tiếp = hàng nhập rút; dương hơn 10% = hàng nhập quay lại',imp3Y==null?'na':imp3Y<-10?'good':imp3Y>10?'risk':'watch','▲ HPG · HSG · NKG (bán nội địa)','chTrade'),
 row('Thương mại','Mỹ nhập tôn mạ 7210 từ VN',[us7210.at(-1)?nf(us7210.at(-1).value/1e6,1)+' tr USD':'—','tháng '+(us7210.at(-1)?mon(us7210.at(-1).date):'—')],us7210.at(-1)?'YoY '+signed(yoyAt(us7210,us7210.at(-1)),0)+'%':'—','Trên 50 triệu USD/tháng mới đáng kể với HSG, NKG',us7210.length?'info':'na','HSG · NKG','chUs7210'),
 row('Định giá','Định giá theo rổ',[peL?nf(peL[1],1)+'x':'—','P/E thép XD & HRC'],'P/B '+(peL?nf(peL[2],2):'—')+'x; tôn mạ P/B '+(peT?nf(peT[2],2):'—')+'x','BCTC quý mới',peL?'info':'na','HPG · HSG · NKG','chSectorVal')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.STEEL_BRIEF={
 headline:(spUsd==null?'Thiếu spread lò cao':'Spread lò cao '+nf(spUsd,0)+' USD/t ('+(spUsd>200?'rộng, thuận HPG':spUsd<100?'hẹp, rủi ro HPG':'trung bình')+')')+' · HRC 3 tháng '+signed(hrc3,0)+'% ('+(hrc3==null?'thiếu':hrc3<-5?'rủi ro lỗ tồn kho tôn mạ':hrc3>5?'lãi tồn kho tôn mạ':'tồn kho trung tính')+') · CB300 '+signed(rY,0)+'% YoY · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Nguyên liệu','quặng · than cốc · phế',oY!=null&&oY<-5?'up':oY!=null&&oY>5?'down':'flat','Quặng '+signed(oY,0)+'%'],['Thép xây dựng & HRC','HPG · POM · TVN',spUsd!=null&&spUsd>200?'up':spUsd!=null&&spUsd<100?'down':'flat',spUsd!=null?'Spread '+nf(spUsd,0)+' USD/t':'CB300 '+signed(rY,0)+'%'],['Tôn mạ & ống','HSG · NKG · VGS',hrc3!=null&&hrc3>5?'up':hrc3!=null&&hrc3<-5?'down':'flat','HRC 3T '+signed(hrc3,0)+'%'],['Thương mại thép','TLH · SMC',hrc3!=null&&hrc3>5?'up':hrc3!=null&&hrc3<-5?'down':'flat','Theo hướng HRC'],['Xuất khẩu','Mỹ · EU · ASEAN',expY!=null&&expY>10?'up':expY!=null&&expY<0?'down':'flat','XK lũy kế '+signed(expY,0)+'%']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['25/11/2026','Hạn nộp hồ sơ yêu cầu rà soát CBPG thép cán nguội Trung Quốc (TRAV)'],['01/01/2027','EU mở hạn ngạch thép quý mới (định kỳ 1/1 · 1/4 · 1/7 · 1/10)'],['~7/2027 (ước)','Kết luận rà soát lần 1 CBPG HRC (AR01.AD20), 12 tháng từ 27/7/2026'],['Đầu tháng','NSO: sản lượng thép cán, thép thanh'],['Giữa tháng','Hải quan: xuất nhập khẩu thép; Trung Quốc: thép thô'],['Hằng tuần','Giá CB300, HRC, quặng, than cốc'],['Sau mỗi quý','BCTC quý; Hòa Phát: sản lượng theo sản phẩm']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'. Nguồn công khai ưu tiên; WiData lấp phần thiếu.';
})();
