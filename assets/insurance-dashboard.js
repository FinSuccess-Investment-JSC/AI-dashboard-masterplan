/* Insurance dashboard (Bảo hiểm): value chain, Phi nhân thọ / Nhân thọ / Đầu tư & lãi suất panes and sector valuation
   from window.INSURANCE_PUBLIC (scripts/build_sector_public.py: public commodity series only): sector aggregate P&L, bond yield, deposit rate).
   Document figures sit in the HTML tables and are backed by data/insurance/evidence.json.
   Publishes window.INSURANCE_BRIEF for catalyst-board.js. Runs before research-layout.js; uses the page's inline chart helpers. */
(() => {
'use strict';
if(document.body.dataset.sector!=='insurance')return;
const W=window.INSURANCE_PUBLIC||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const qtr=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(2,4);
const signed=(v,d=1)=>v==null||!Number.isFinite(v)?'—':(v>0?'+':'')+nf(v,d);
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com={},sec=B.sector_ratio?.by_sector||{},fs=B.fs?.by_sector||{},gb=B.gbond?.records||[];
const checked=B.macro?.captured_at||W.built_at||'';
const SRC={nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],sbv:['Ngân hàng Nhà nước','https://www.sbv.gov.vn/'],fsw:['VNDirect · BCTC quý các DN niêm yết','https://dstock.vndirect.com.vn/'],hnx:['HNX – lợi suất TPCP','https://hnx.vn/'],wi:['Nguồn công khai',null]};
for(const v of Object.values(macro)){if(/nso\.gov\.vn\/wp-content/.test(v.url||'')&&SRC.nso)SRC.nso=[SRC.nso[0],v.url];if(/customs/.test(v.url||'')&&SRC.customs)SRC.customs=[SRC.customs[0],v.url]}
const S=k=>macro[k]?.records||com[k]?.records||[];
const ym=d=>d.slice(0,7);
const byMonth=rs=>{const m={};rs.forEach(r=>{m[ym(r.date)]=r});return m};
const yoyAt=(rs,r)=>{if(!r)return null;const p=rs.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};
const ytdSum=(rs,y,m)=>rs.filter(r=>r.date.slice(0,4)===y&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0);
const ytdYo=rs=>{const l=rs.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),p=ytdSum(rs,String(y-1),m);return p?(ytdSum(rs,y,m)/p-1)*100:null};
const idx=(rs,base)=>{const b=rs.find(r=>r.date.slice(0,7)>=base);return b&&b.value?rs.map(r=>({date:r.date,value:r.value/b.value*100})):[]};

// ---------- 1. Value chain ----------
const chain=document.querySelector('[data-block-id="bh-01"]');
if(chain){
 const grid=chain.parentElement;if(grid&&grid.classList.contains('grid')){grid.before(chain);grid.style.gridTemplateColumns='1fr'}
 chain.classList.add('value-chain-card');const heading=chain.querySelector('h3');heading.classList.add('chart-title');
 [...chain.children].filter(e=>e!==heading).forEach(e=>{e.classList.add('conf-note');e.dataset.snapshotAt='11/10/2026'});
 const w=220,h=65;
 const nodes=[
  ['client',25,40,['Người mua','cá nhân · doanh nghiệp · ngân hàng (bancassurance)']],['channel',25,165,['Kênh bán','đại lý · ngân hàng · môi giới · online']],
  ['nonlife',315,40,['Phi nhân thọ','PVI · BMI · MIG · PTI · BIC · Bảo Việt']],['life',315,165,['Nhân thọ','Bảo Việt Nhân thọ (BVH)']],['reins',315,290,['Tái bảo hiểm','VNR · tái quốc tế']],
  ['uw',605,40,['Lãi bảo hiểm','phí thuần − bồi thường − chi phí']],['reserve',605,165,['Quỹ dự phòng','phí thu trước, trả sau']],['invest',605,290,['Đầu tư','tiền gửi · TPCP · trái phiếu DN · cổ phiếu']],
  ['profit',895,165,['Lợi nhuận','lãi bảo hiểm + lãi đầu tư']],['rate',895,290,['Lãi suất','tiền gửi 12T · TPCP 10 năm']]
 ];
 const edges=[['client','nonlife'],['channel','life'],['nonlife','uw'],['life','reserve'],['nonlife','reins',true],['reins','invest',true],['reserve','invest'],['uw','profit'],['invest','profit'],['rate','invest',true]];
 const byId=Object.fromEntries(nodes.map(n=>[n[0],n]));
 const paths=edges.map(([a,b,dashed])=>{const A=byId[a],Bn=byId[b];let d;
  if(A[2]===Bn[2]){const fw=Bn[1]>A[1];d=`M${A[1]+(fw?w:0)} ${A[2]+h/2} H${Bn[1]+(fw?0:w)}`}
  else if(A[1]===Bn[1]){d=`M${A[1]+w/2} ${A[2]+(Bn[2]>A[2]?h:0)} V${Bn[2]+(Bn[2]>A[2]?0:h)}`}
  else{const fw=Bn[1]>A[1],x1=A[1]+(fw?w:0),y1=A[2]+h/2,x2=Bn[1]+(fw?0:w),y2=Bn[2]+h/2,mid=(x1+x2)/2;d=`M${x1} ${y1} H${mid} V${y2} H${x2}`}
  return `<path d="${d}" class="chain-edge${dashed?' dashed':''}" marker-end="url(#chain-arrow)"/>`}).join('');
 const boxes=nodes.map(([id,x,y,lines])=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="chain-node"/><text x="${x+w/2}" y="${y+(lines.length===1?37:27)}" text-anchor="middle">${lines.map((t,i)=>`<tspan x="${x+w/2}" dy="${i?21:0}">${t.replace(/&/g,'&amp;')}</tspan>`).join('')}</text></g>`).join('');
 const figure=make('div','value-chain-scroll');figure.tabIndex=0;figure.setAttribute('aria-label','Sơ đồ chuỗi giá trị; có thể cuộn ngang trên màn hình nhỏ');
 figure.innerHTML=`<svg viewBox="0 0 1140 375" role="img" aria-labelledby="chain-title chain-desc"><title id="chain-title">Chuỗi giá trị ngành bảo hiểm</title><desc id="chain-desc">Người mua đóng phí qua đại lý, ngân hàng; doanh nghiệp bảo hiểm trả bồi thường, nhượng một phần rủi ro cho tái bảo hiểm và đầu tư quỹ dự phòng vào tiền gửi, trái phiếu; lợi nhuận gồm lãi bảo hiểm và lãi đầu tư.</desc><defs><marker id="chain-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>${paths}${boxes}</svg>`;
 heading.after(figure);
 chain.append(make('div','chart-insight','AI · cách đọc chuỗi: phi nhân thọ thường có lãi bảo hiểm mỏng hoặc hòa vốn (bồi thường + chi phí ≈ 95–100% phí), lợi nhuận chủ yếu đến từ đầu tư quỹ dự phòng — nên lãi suất tiền gửi và TPCP tăng là tin tốt. Nhân thọ giữ quỹ dài hạn lớn hơn nhiều, nhạy với lãi suất và với kênh bán qua ngân hàng (bancassurance) vốn bị siết từ 2023. Một năm bão lũ lớn (Yagi 2024) đẩy bồi thường lên vọt trong 1–2 quý.'));
 figure.after(make('div','source-note','Mũi tên liền: dòng phí và tiền · Mũi tên đứt: chia sẻ rủi ro và yếu tố lãi suất. Sơ đồ không biểu thị tỷ trọng.'));
}

// ---------- 2. Panes ----------
const section=document.querySelector('.majorpane[data-tab="mt2"] .section');
if(section){
 const head=section.querySelector('.sectionhead');
 const children=[...section.children].filter(e=>e!==head),nlP=make('div','supply-pane'),lifeP=make('div','supply-pane'),invP=make('div','supply-pane');
 nlP.id='supply-world';lifeP.id='supply-vietnam';invP.id='supply-trade';
 let cur=nlP;children.forEach(e=>{if(e.matches('h3.subhead')){const t=e.textContent.trim();cur=t.startsWith('Nhân thọ')?lifeP:t.startsWith('Đầu tư')?invP:nlP;e.remove();return}cur.append(e)});
 const tabs=make('div','supply-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Nhóm');
 const panes=[nlP,lifeP,invP],labels=['Phi nhân thọ','Nhân thọ','Đầu tư & lãi suất'];
 function select(i){panes.forEach((p,j)=>{p.hidden=i!==j;const b=tabs.children[j];b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1})}
 labels.forEach((label,i)=>{const b=make('button','tabbtn',label);b.type='button';b.id='supply-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',panes[i].id);panes[i].setAttribute('role','tabpanel');panes[i].setAttribute('aria-labelledby',b.id);b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{const n=panes.length;let next;if(e.key==='ArrowRight')next=(i+1)%n;else if(e.key==='ArrowLeft')next=(i+n-1)%n;else if(e.key==='Home')next=0;else if(e.key==='End')next=n-1;if(next!==undefined){e.preventDefault();select(next);tabs.children[next].focus()}});tabs.append(b)});
 head.after(tabs,...panes);select(0);
}

// ---------- 3. Charts ----------
function sourceLine(id,parts,period,method,wi=true){
 const host=document.getElementById(id);if(!host)return;const block=host.closest('.card');
 const n=make('div','source-note cadence-note');n.append('Nguồn: ');
 parts.forEach(([name,url],i)=>{if(i)n.append(' · ');if(url){const a=make('a','',name);a.href=url;a.target='_blank';a.rel='noopener';n.append(a)}else n.append(name)});
 n.append(` · Kỳ cuối: ${period}`+(wi?` · Kiểm: ${checked?short(checked.slice(0,4)+'-'+checked.slice(4,6)+'-'+checked.slice(6,8)):'—'}`:''));host.after(n);
 if(method)n.after(make('div','source-note method-note',method));
 if(block&&wi){block.dataset.refreshStatus='loaded';block.dataset.sourceIds='public'}
}
function insight(id,text){const block=document.getElementById(id)?.closest('.card');if(!block)return;const n=make('div','chart-insight');n.dataset.inputOwner='ai';n.innerHTML='<b>Cách hiểu trong bối cảnh ngành · AI:</b> ';n.append(text);block.append(n)}
function legend(id,items){const host=document.getElementById(id);if(!host)return;const l=make('div','legend');items.forEach(([n,c])=>{const s=make('span','li'),d=make('span','dot');d.style.background=c;s.append(d,n);l.append(s)});host.after(l)}
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;card.querySelector('.value').textContent=value;card.querySelector('.sub').textContent=sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();const sv=(series||[]).filter(Number.isFinite);if(sv.length>1)sparkline(spark,sv,color)}
function lines(id,base,series,unit,digits,zeroBase=false){barLineChart(id,{categories:base.map(r=>mon(r.date)),series:series.map(([n,c,f])=>({name:n,color:c,kind:'line',values:base.map(f)})),unit,digits,height:260,zeroBase,rotateLabels:true})}

const q=k=>k.replace(/(\d{4})-Q(\d)/,(m,y,n)=>'Q'+n+'/'+y.slice(2));
const F=id=>fs[id]?.records||[];
const yoyQ=(rs,i,k)=>{const r=rs[i];if(!r)return null;const p=rs.find(x=>x[0]===(Number(r[0].slice(0,4))-1)+r[0].slice(4));return p&&p[k]?(r[k]/p[k]-1)*100:null};
const lossR=r=>r&&r[2]?r[3]/r[2]*100:null;
const NL=F('285'),LF=F('151'),RE=F('154');
// Phi nhân thọ
if(NL.length&&document.getElementById('chNlPrem')){
 const rs=NL.slice(-16);
 barLineChart('chNlPrem',{categories:rs.map(r=>q(r[0])),series:[{name:'Phí bảo hiểm gốc',color:C.navy,values:rs.map(r=>r[1]/1000)},{name:'Doanh thu phí thuần',color:C.teal,kind:'line',values:rs.map(r=>r[2]/1000)}],unit:'nghìn tỷ',digits:1,height:260,rotateLabels:true});
 legend('chNlPrem',[['Phí bảo hiểm gốc',C.navy],['Doanh thu phí thuần',C.teal]]);
 fillTable('tbl-nl-prem',['Quý','Phí gốc (tỷ)','YoY','Phí thuần (tỷ)','YoY'],NL.map((r,i)=>[q(r[0]),nf(r[1],0),signed(yoyQ(NL,i,1),1)+'%',nf(r[2],0),signed(yoyQ(NL,i,2),1)+'%']).reverse());
 sourceLine('chNlPrem',[SRC.fsw],q(NL.at(-1)[0]),'Cộng BCTC quý của 5 DN phi nhân thọ niêm yết (PVI, BMI, MIG, PTI, BIC), không phải toàn thị trường. Phí gốc là phí khai thác trực tiếp; phí thuần sau nhượng tái và giảm trừ.');
 const i=NL.length-1;
 insight('chNlPrem','Phí gốc 5 DN phi nhân thọ Q'+NL.at(-1)[0].slice(-1)+'/'+NL.at(-1)[0].slice(0,4)+' '+signed(yoyQ(NL,i,1),0)+'% YoY (quý trước '+signed(yoyQ(NL,i-1,1),0)+'%); phí thuần '+signed(yoyQ(NL,i,2),0)+'%. Phí thuần chậm hơn phí gốc khi phần nhượng tái tăng.');
}
if(NL.length&&document.getElementById('chNlSD')){
 const rs=NL.slice(-8),idx0=NL.length-8;
 barLineChart('chNlSD',{categories:rs.map(r=>q(r[0])),series:[{name:'Phí bảo hiểm gốc YoY',color:C.navy,values:rs.map((r,j)=>yoyQ(NL,idx0+j,1))},{name:'Bồi thường YoY',color:C.red,values:rs.map((r,j)=>yoyQ(NL,idx0+j,3))}],unit:'%',digits:0,height:260,rotateLabels:false,zeroBase:true});
 legend('chNlSD',[['Phí gốc (cầu bảo hiểm)',C.navy],['Bồi thường',C.red]]);
 fillTable('tbl-nl-sd',['Quý','Phí gốc YoY','Bồi thường YoY'],rs.map((r,j)=>[q(r[0]),signed(yoyQ(NL,idx0+j,1),1)+'%',signed(yoyQ(NL,idx0+j,3),1)+'%']).reverse());
 sourceLine('chNlSD',[SRC.fsw],q(NL.at(-1)[0]),'So tốc độ tăng phí gốc với tốc độ tăng tổng chi bồi thường của 5 DN phi nhân thọ niêm yết. Phí tăng nhanh hơn bồi thường thì biên bảo hiểm cải thiện.');
 insight('chNlSD','Đây là "cung – cầu" của bảo hiểm: phí là cầu mua bảo hiểm, bồi thường là chi phí của rủi ro đã bán. Q3/2024 bồi thường vọt do bão Yagi; năm 2025 bồi thường giảm lại về mức thường. Quý gần nhất phí '+signed(yoyQ(NL,NL.length-1,1),0)+'%, bồi thường '+signed(yoyQ(NL,NL.length-1,3),0)+'% YoY: phí tăng nhanh hơn bồi thường thì lãi bảo hiểm gốc tốt lên.');
}
if(NL.length&&document.getElementById('chNlLoss')){
 const rs=NL.slice(-16),rm=Object.fromEntries(RE.map(r=>[r[0],r]));
 barLineChart('chNlLoss',{categories:rs.map(r=>q(r[0])),series:[{name:'Phi nhân thọ',color:C.navy,kind:'line',values:rs.map(lossR)},{name:'Tái bảo hiểm',color:C.gold,kind:'line',values:rs.map(r=>lossR(rm[r[0]]))}],unit:'%',digits:0,height:260,rotateLabels:true,zeroBase:true});
 legend('chNlLoss',[['Phi nhân thọ',C.navy],['Tái bảo hiểm (VNR)',C.gold]]);
 fillTable('tbl-nl-loss',['Quý','Phi nhân thọ (%)','Tái bảo hiểm (%)'],NL.map(r=>[q(r[0]),nf(lossR(r),1),nf(lossR(rm[r[0]]),1)]).reverse());
 sourceLine('chNlLoss',[SRC.fsw],q(NL.at(-1)[0]),'Tỷ lệ = tổng chi bồi thường / doanh thu phí bảo hiểm thuần, tự tính trên tổng BCTC của rổ (5 DN phi nhân thọ; VNR). Đây không phải tỷ lệ bồi thường thuần chuẩn (chưa trừ thu đòi người thứ ba, chưa tính tăng dự phòng) — dùng để xem xu hướng.');
 insight('chNlLoss','Tỷ lệ bồi thường phi nhân thọ quanh '+nf(lossR(NL.at(-1)),0)+'%, thấp hơn đỉnh Q3/2024 (~49% do Yagi). Tái bảo hiểm (VNR) dao động mạnh hơn vì nhận phần rủi ro thiên tai, cháy nổ lớn: một sự kiện lớn đủ đẩy tỷ lệ của VNR vượt 60–80% trong quý.');
}
const car=S('car_output'),moto=S('moto_output');
if(car.length&&document.getElementById('chNlDemand')){
 const rs=car.slice(-36),mm=byMonth(moto);
 barLineChart('chNlDemand',{categories:rs.map(r=>mon(r.date)),series:[{name:'Ô tô (nghìn chiếc)',color:C.navy,values:rs.map(r=>r.value)},{name:'Xe máy (chục nghìn chiếc)',color:C.teal,kind:'line',values:rs.map(r=>(mm[ym(r.date)]?.value??NaN)/10)}],unit:'',digits:0,height:260,rotateLabels:true});
 legend('chNlDemand',[['Ô tô, nghìn chiếc',C.navy],['Xe máy, chục nghìn chiếc',C.teal]]);
 fillTable('tbl-nl-demand',['Tháng','Ô tô (nghìn)','YoY','Xe máy (nghìn)','YoY'],car.slice().reverse().map(r=>{const m=mm[ym(r.date)];return [mon(r.date),nf(r.value,1),signed(yoyAt(car,r),0)+'%',nf(m?.value,0),signed(yoyAt(moto,m),0)+'%']}));
 sourceLine('chNlDemand',[SRC.nso],mon(car.at(-1).date),'Sản lượng sản xuất ô tô, xe máy. Xe cơ giới là nghiệp vụ lớn thứ hai của phi nhân thọ (sau sức khỏe); sản lượng xe là chỉ báo dẫn của phí xe cơ giới.');
 insight('chNlDemand','Lũy kế sản lượng ô tô '+signed(ytdYo(car),0)+'%, xe máy '+signed(ytdYo(moto),0)+'%: xe mới bán ra là phí bảo hiểm vật chất xe mới, hỗ trợ trực tiếp PTI, MIG, BIC (mạnh ở kênh xe).');
}
// Nhân thọ
if(LF.length&&document.getElementById('chLifePrem')){
 const rs=LF.slice(-16);
 barLineChart('chLifePrem',{categories:rs.map(r=>q(r[0])),series:[{name:'Phí bảo hiểm gốc',color:C.plum,values:rs.map(r=>r[1]/1000)},{name:'Chi bồi thường, trả tiền BH',color:C.grey,kind:'line',values:rs.map(r=>r[3]/1000)}],unit:'nghìn tỷ',digits:1,height:260,rotateLabels:true});
 legend('chLifePrem',[['Phí bảo hiểm gốc',C.plum],['Chi trả quyền lợi',C.grey]]);
 fillTable('tbl-life-prem',['Quý','Phí gốc (tỷ)','YoY','Chi trả (tỷ)','Chi trả / phí thuần'],LF.map((r,i)=>[q(r[0]),nf(r[1],0),signed(yoyQ(LF,i,1),1)+'%',nf(r[3],0),nf(lossR(r),0)+'%']).reverse());
 sourceLine('chLifePrem',[SRC.fsw],q(LF.at(-1)[0]),'BCTC hợp nhất Bảo Việt (BVH) (gồm cả Bảo hiểm Bảo Việt phi nhân thọ). Không đại diện cho cả thị trường nhân thọ (Prudential, Manulife, AIA… không niêm yết).');
 const i=LF.length-1;
 insight('chLifePrem','Phí gốc Bảo Việt '+signed(yoyQ(LF,i,1),0)+'% YoY — gần như đi ngang từ 2023: nhân thọ chưa thoát khủng hoảng niềm tin sau bancassurance, phí khai thác mới thấp và hợp đồng cũ đáo hạn. Chi trả quyền lợi ~'+nf(lossR(LF.at(-1)),0)+'% phí thuần là mức cao, phần lớn là đáo hạn và hủy hợp đồng.');
}
// Đầu tư & lãi suất
const dep=S('deposit_12m');
if(gb.length&&document.getElementById('chYield')){
 const bm={};gb.forEach(r=>{bm[r.date.slice(0,7)]=r});const months=Object.keys(bm).sort(),dm=byMonth(dep);
 barLineChart('chYield',{categories:months.map(m=>mon(m+'-01')),series:[{name:'TPCP 10 năm (HNX)',color:C.navy,kind:'line',values:months.map(m=>bm[m].value)},{name:'Tiết kiệm 12T Vietcombank',color:C.teal,kind:'line',values:months.map(m=>dm[m]?.value??null)}],unit:'%',digits:2,height:260,rotateLabels:true,zeroBase:false});
 legend('chYield',[['TPCP 10 năm',C.navy],['Huy động 12 tháng',C.teal]]);
 fillTable('tbl-yield',['Tháng','TPCP 10 năm (%)','Huy động 12T (%)'],months.slice().reverse().map(m=>[mon(m+'-01'),nf(bm[m].value,3),nf(dm[m]?.value,2)]));
 const L=gb.at(-1),Y=gb.find(r=>r.date>=String(Number(L.date.slice(0,4))-1)+L.date.slice(4));
 sourceLine('chYield',[['HNX · đường cong lợi suất TPCP',B.gbond?.url||'https://hnx.vn/vi-vn/trai-phieu/duong-cong-loi-suat.html'],['Vietcombank · lãi suất tiết kiệm',macro.deposit_12m?.url||null]],short(L.date),'TPCP 10 năm: par yield trên đường cong lợi suất HNX, ngày cuối tháng. Huy động 12 tháng: lãi tiết kiệm cá nhân 12 tháng Vietcombank công bố; nguồn không có lịch sử nên chuỗi bắt đầu từ 10/2026.');
 insight('chYield','TPCP 10 năm '+nf(L.value,2)+'%, cao hơn một năm trước '+nf((L.value-(Y?.value??L.value))*100,0)+' điểm cơ bản; lãi tiết kiệm 12 tháng Vietcombank '+nf(dep.at(-1)?.value,2)+'%. Doanh nghiệp bảo hiểm để phần lớn quỹ vào tiền gửi và TPCP: lãi suất tăng kéo thu nhập đầu tư lên dần khi tiền gửi cũ đáo hạn và tái tục ở lãi mới — tác động trễ 2–4 quý, mạnh nhất với nhân thọ (quỹ lớn, kỳ hạn dài).');
}
if(NL.length&&document.getElementById('chFin')){
 const rs=NL.slice(-16),lm=Object.fromEntries(LF.map(r=>[r[0],r]));
 barLineChart('chFin',{categories:rs.map(r=>q(r[0])),series:[{name:'Phi nhân thọ',color:C.navy,values:rs.map(r=>r[5])},{name:'Nhân thọ (BVH)',color:C.plum,kind:'line',values:rs.map(r=>lm[r[0]]?.[5]??null)}],unit:'tỷ',digits:0,height:260,rotateLabels:true});
 legend('chFin',[['Phi nhân thọ niêm yết',C.navy],['Bảo Việt (BVH)',C.plum]]);
 fillTable('tbl-fin',['Quý','LN tài chính PNT (tỷ)','YoY','LN tài chính BVH (tỷ)','YoY'],NL.map((r,i)=>{const l=LF.findIndex(x=>x[0]===r[0]);return [q(r[0]),nf(r[5],0),signed(yoyQ(NL,i,5),0)+'%',nf(LF[l]?.[5],0),signed(l>=0?yoyQ(LF,l,5):null,0)+'%']}).reverse());
 sourceLine('chFin',[SRC.fsw],q(NL.at(-1)[0]),'Lợi nhuận hoạt động tài chính — lãi tiền gửi, trái phiếu, cổ tức, lãi kinh doanh chứng khoán trừ chi phí tài chính.');
 const i=NL.length-1,l=LF.length-1;
 insight('chFin','Lợi nhuận tài chính phi nhân thọ '+signed(yoyQ(NL,i,5),0)+'% YoY, Bảo Việt '+signed(yoyQ(LF,l,5),0)+'%: lãi suất tăng từ cuối 2025 bắt đầu vào kết quả. Với phi nhân thọ, phần này thường bằng hoặc lớn hơn lãi bảo hiểm gốc — là động lực lợi nhuận chính 2026–2027 nếu lãi suất giữ mức hiện tại.');
}
// Định giá
if(Object.keys(sec).length&&document.getElementById('chSectorVal')){
 const ids=[['151','Nhân thọ (BVH)',C.plum],['285','Phi nhân thọ',C.navy],['154','Tái bảo hiểm',C.gold]].filter(([id])=>sec[id]?.records?.length);
 const dates=[...new Set(ids.flatMap(([id])=>sec[id].records.map(r=>r[0])))].sort(),weekly=dates.filter((d,i)=>i%5===0||i===dates.length-1);
 const at=(id,d,k)=>{const r=sec[id].records.find(x=>x[0]===d);return r?r[k]:null};
 barLineChart('chSectorVal',{categories:weekly.map(d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4)),series:ids.map(([id,name,color])=>({name:'P/B '+name,color,kind:'line',values:weekly.map(d=>at(id,d,2))})),unit:'x',digits:2,height:260,zeroBase:false,rotateLabels:true});
 legend('chSectorVal',ids.map(([,n,c])=>[n,c]));
 fillTable('tbl-sector-val',['Rổ mã','P/B','P/E','Vốn hóa (nghìn tỷ)','Phiên'],ids.map(([id,name])=>{const r=sec[id].records.at(-1);return [name,nf(r[2],2),nf(r[1],1),nf(r[3]/1000,1),short(r[0])]}));
 sourceLine('chSectorVal',[['VNDirect finfo','https://dstock.vndirect.com.vn/']],short(dates.at(-1)),'Rổ mã theo dõi: Nhân thọ (BVH) (BVH); Phi nhân thọ (PVI, BMI, MIG, PTI, BIC); Tái bảo hiểm (VNR). P/E = tổng vốn hóa / tổng lợi nhuận (vốn hóa ÷ P/E từng mã, VNDirect); mã lỗ không có P/E chỉ vào P/B và vốn hóa. Không phải toàn ngành. Vẽ mỗi 5 phiên.');
 insight('chSectorVal',(()=>{const L=ids.filter(([id])=>sec[id]?.records?.length);const l0=sec[L[0][0]].records.at(-1);return 'P/B rổ mã theo dõi, phiên '+short(l0[0])+': '+L.map(([id,name])=>{const r=sec[id].records,l=r.at(-1),y=r.find(x=>x[0]>=String(+l[0].slice(0,4)-1)+l[0].slice(4));return name+' '+nf(l[2],(2==2?2:1))+'x'+(y&&y[2]!=null?' (1 năm trước '+nf(y[2],(2==2?2:1))+'x)':'')}).join('; ')+'.'})());
}

// Tài liệu: toàn thị trường và nghiệp vụ (số có evidence)
if(document.getElementById('chMarket')){
 barLineChart('chMarket',{categories:['9T/2025 (suy ra)','9T/2026'],series:[{name:'Phí phi nhân thọ',color:C.navy,values:[64.4,74.1]},{name:'Phí nhân thọ',color:C.plum,values:[107.3,101.7]},{name:'Chi trả quyền lợi',color:C.red,values:[68.9,77.9]}],unit:'nghìn tỷ',digits:1,height:260,rotateLabels:false});
 legend('chMarket',[['Phí phi nhân thọ',C.navy],['Phí nhân thọ',C.plum],['Chi trả quyền lợi',C.red]]);
 sourceLine('chMarket',[['Bộ Tài chính qua Tạp chí Kinh tế Tài chính','https://tapchikinhtetaichinh.vn/doanh-thu-phi-bao-hiem-dat-gan-176-nghin-ty-dong-sau-9-thang-168594.html']],'9T/2026','Cột 9T/2025 suy ra từ số 2026 và % tăng công bố (74,1/1,151; 101,7/0,948; 77,9/1,131), không phải số công bố riêng.',false);
 insight('chMarket','Toàn thị trường 9T/2026: phí +2,4% nhưng chi trả quyền lợi +13,1% — chi trả tăng nhanh gấp 5 lần phí. Phần lớn chi trả là nhân thọ (đáo hạn, hủy hợp đồng); phi nhân thọ thì ngược lại, phí tăng nhanh hơn bồi thường. Hai mảng đang đi ngược chiều.');
}
if(document.getElementById('chNlLines')){
 hbarCompare('chNlLines',{items:[{label:'Sức khỏe +20,7%',value:23.979,color:C.navy},{label:'Tài sản, kỹ thuật +17,3%',value:18.6,color:C.teal},{label:'Xe cơ giới +8,2%',value:14.501,color:C.gold},{label:'Bồi thường gốc',value:21.365,color:C.red}],unit:'nghìn tỷ',digits:1,labelW:170,ariaLabel:'Phi nhân thọ theo nghiệp vụ 8T/2026'});
 sourceLine('chNlLines',[['Hiệp hội Bảo hiểm qua Thị trường Tài chính Tiền tệ','https://thitruongtaichinhtiente.vn/thi-truong-bao-hiem-8-thang-hon-1-trieu-hop-dong-nhan-tho-doanh-thu-phi-nhan-tho-tang-16-6-86142.html']],'8T/2026','Toàn thị trường phi nhân thọ 66.191 tỷ (+16,6%). Bồi thường gốc 21.365 tỷ, tỷ lệ 32,3%.',false);
 insight('chNlLines','Sức khỏe là nghiệp vụ lớn nhất và tăng nhanh nhất — nhưng cũng có tỷ lệ bồi thường cao nhất; tài sản, kỹ thuật tăng theo đầu tư FDI và hạ tầng, là mảng mạnh của PVI. Xe cơ giới tăng chậm nhất dù sản lượng xe tăng mạnh: cạnh tranh giá phí.');
}
// ---------- 4. KPIs, quick read, catalyst brief ----------
const nI=NL.length-1,lI=LF.length-1,nL=NL.at(-1),lL=LF.at(-1),gL=gb.at(-1),dL=dep.at(-1),nlS=sec['285']?.records||[],nlV=nlS.at(-1),lfS=sec['151']?.records||[],lfV=lfS.at(-1);
const nlY=yoyQ(NL,nI,1),lfY=yoyQ(LF,lI,1),finY=yoyQ(NL,nI,5),clY=yoyQ(NL,nI,3),lr=lossR(nL),gY=gL?gL.value-(gb.find(r=>r.date>=String(Number(gL.date.slice(0,4))-1)+gL.date.slice(4))?.value??gL.value):null,carY=ytdYo(car);
kpi('spk-nlprem',nL?nf(nL[1]/1000,1):'—',nL?'nghìn tỷ phí gốc PNT · '+q(nL[0]):'—',nL?signed(nlY,0)+'% so cùng kỳ':'',NL.slice(-8).map(r=>r[1]));
kpi('spk-loss',lr!=null?nf(lr,0)+'%':'—',nL?'bồi thường / phí thuần PNT · '+q(nL[0]):'—',NL.length>4?'cùng kỳ '+nf(lossR(NL[nI-4]),0)+'%':'',NL.slice(-8).map(lossR),C.red);
kpi('spk-lifeprem',lL?nf(lL[1]/1000,1):'—',lL?'nghìn tỷ phí gốc BVH · '+q(lL[0]):'—',lL?signed(lfY,0)+'% so cùng kỳ':'',LF.slice(-8).map(r=>r[1]),C.plum);
kpi('spk-yield',gL?nf(gL.value,2)+'%':'—',gL?'TPCP 10 năm · '+short(gL.date):'—',gY!=null?signed(gY*100,0)+' đcb so cùng kỳ':'',gb.filter((r,i)=>i%20===0).slice(-12).map(r=>r.value),C.navy);
kpi('spk-dep',dL?nf(dL.value,2)+'%':'—',dL?'tiết kiệm 12T Vietcombank · '+mon(dL.date):'—',(()=>{const p=dL&&dep.find(r=>r.date.slice(0,7)===String(Number(dL.date.slice(0,4))-1)+dL.date.slice(4,7));return p?signed(dL.value-p.value,2)+' điểm % YoY':''})(),dep.slice(-12).map(r=>r.value),C.teal);
kpi('spk-pb',nlV?nf(nlV[2],2)+'x':'—',nlV?'P/B phi nhân thọ · '+short(nlV[0]):'—',lfV?'BVH '+nf(lfV[2],2)+'x':'',nlS.slice(-30).map(r=>r[2]),C.grey);
const quick=document.querySelector('.hero .insight');
if(quick&&nL){
 quick.innerHTML='';quick.append(make('b','','Đọc nhanh từ dữ liệu công khai: '),`Phí gốc phi nhân thọ niêm yết ${q(nL[0])} ${nf(nL[1]/1000,1)} nghìn tỷ (${signed(nlY,0)}%), tỷ lệ bồi thường ${nf(lr,0)}%. Bảo Việt phí gốc ${signed(lfY,0)}%. Lợi nhuận tài chính phi nhân thọ ${signed(finY,0)}%. TPCP 10 năm ${nf(gL?.value,2)}%, huy động 12 tháng ${nf(dL?.value,2)}%. P/B phi nhân thọ ${nlV?nf(nlV[2],2):'—'}x, BVH ${lfV?nf(lfV[2],2):'—'}x.`);
 Object.assign(quick.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
}
const row=(group,name,big,evidence,cond,st,who,chart)=>({group,name,big,chart,st,mid:[evidence,cond],end:[who]});
const score=[
 row('Cầu','Phí phi nhân thọ tăng mạnh',[signed(nlY,0)+'%','phí gốc PNT YoY'],'Phí thuần '+signed(yoyQ(NL,nI,2),0)+'%; sản lượng ô tô lũy kế '+signed(carY,0)+'%','Phí gốc về dưới +8%',nlY==null?'na':nlY>12?'good':nlY<5?'risk':'watch','▲ PVI · PTI · MIG · BIC · BMI','chNlPrem'),
 row('Chi phí','Bồi thường thấp hơn tăng phí',[nf(lr,0)+'%','bồi thường / phí thuần'],'Bồi thường '+signed(clY,0)+'% YoY so phí '+signed(nlY,0)+'%','Tỷ lệ vượt 45% (thiên tai lớn)',lr==null?'na':lr<40?'good':lr>45?'risk':'watch','▲ phi nhân thọ · VNR','chNlSD'),
 row('Cầu','Nhân thọ chưa hồi',[signed(lfY,0)+'%','phí gốc BVH YoY'],'Chi trả ~'+nf(lossR(lL),0)+'% phí thuần (đáo hạn, hủy hợp đồng)','Phí gốc BVH tăng >10% hai quý liền',lfY==null?'na':lfY>8?'good':lfY<0?'risk':'watch','BVH','chLifePrem'),
 row('Đầu tư','Lãi suất cao hơn',[gL?nf(gL.value,2)+'%':'—','TPCP 10 năm'],'Tăng '+(gY!=null?nf(gY*100,0):'—')+' đcb YoY; huy động 12T '+nf(dL?.value,2)+'%','TPCP 10 năm về dưới 4%',gY==null?'na':gY>0.3?'good':gY<-0.3?'risk':'watch','▲ BVH · BMI · PVI (quỹ lớn)','chYield'),
 row('Đầu tư','Lợi nhuận tài chính tăng',[signed(finY,0)+'%','LN tài chính PNT YoY'],'Bảo Việt '+signed(yoyQ(LF,lI,5),0)+'%','LN tài chính giảm YoY',finY==null?'na':finY>10?'good':finY<0?'risk':'watch','Cả ngành','chFin'),
 row('Định giá','PNT rẻ đi, BVH đắt lên',[nlV?nf(nlV[2],2)+'x':'—','P/B phi nhân thọ'],'BVH '+(lfV?nf(lfV[2],2):'—')+'x; tái bảo hiểm ~1,15x','BCTC quý III (20–30/10)',nlV?'info':'na','PVI · BMI · BVH','chSectorVal')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.INSURANCE_BRIEF={
 headline:'Phí phi nhân thọ +'+nf(nlY,0)+'% trong khi bồi thường tăng chậm, lãi suất cao hơn kéo lãi đầu tư; nhân thọ vẫn đi ngang · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Phi nhân thọ','PVI · BMI · MIG · PTI · BIC',nlY!=null&&nlY>12?'up':'flat','Phí gốc '+signed(nlY,0)+'%'],['Nhân thọ','BVH',lfY!=null&&lfY>8?'up':'flat','Phí gốc '+signed(lfY,0)+'%'],['Tái bảo hiểm','VNR','flat','Bồi thường/phí '+nf(lossR(RE.at(-1)),0)+'%']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Hằng tuần','Lợi suất TPCP, lãi suất huy động'],['Đầu tháng','NSO: sản lượng ô tô, xe máy'],['20–30/10','BCTC quý III — số tổng hợp ngành cập nhật'],['Mùa bão 9–11','Thiên tai lớn → bồi thường phi nhân thọ, VNR']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ nguồn công khai lúc '+new Date(W.built_at).toLocaleString('vi-VN')+'; giá hàng hóa: IMF/FRED, EIA, ICE.';
})();
