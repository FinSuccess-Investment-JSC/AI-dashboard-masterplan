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
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;const ve=card.querySelector('.value'),seg=String(sub??'').split(' · '),hasU=value!=='—'&&seg.length>1&&/^(nghìn|triệu|tỷ|USD|CNY|VND|US cent|điểm|lượt)/.test(seg[0]);ve.textContent=value;if(hasU){const u=document.createElement('span');u.className='unit';u.textContent=seg[0];ve.append(u)}card.querySelector('.sub').textContent=hasU?seg.slice(1).join(' · '):sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();const sv=(series||[]).filter(Number.isFinite);if(sv.length>1)sparkline(spark,sv,color)}
function lines(id,base,series,unit,digits,zeroBase=false){barLineChart(id,{categories:base.map(r=>mon(r.date)),series:series.map(([n,c,f])=>({name:n,color:c,kind:'line',values:base.map(f)})),unit,digits,height:260,zeroBase,rotateLabels:true})}

const q=k=>k.replace(/(\d{4})-Q(\d)/,(m,y,n)=>'Q'+n+'/'+y.slice(2));
const F=id=>fs[id]?.records||[];
const yoyQ=(rs,i,k)=>{const r=rs[i];if(!r)return null;const p=rs.find(x=>x[0]===(Number(r[0].slice(0,4))-1)+r[0].slice(4));return p&&p[k]?(r[k]/p[k]-1)*100:null};
const lossR=r=>r&&r[2]?r[3]/r[2]*100:null;
const NL=F('285'),LF=F('151'),RE=F('154');
const fsNote=id=>{const b=fs[id];if(!b)return '';const m=b.missing?.length?' Thiếu mã '+b.missing.join(', ')+' (tải BCTC lỗi lượt này).':'';const st=b.stale?' Giữ bản dựng cũ ('+(b.stale_note||'')+') vì lượt tải mới lỗi.':'';return m+st};
// Phi nhân thọ
if(NL.length&&document.getElementById('chNlPrem')){
 const rs=NL.slice(-16);
 barLineChart('chNlPrem',{categories:rs.map(r=>q(r[0])),series:[{name:'Phí bảo hiểm gốc',color:C.navy,values:rs.map(r=>r[1]/1000)},{name:'Doanh thu phí thuần',color:C.teal,kind:'line',values:rs.map(r=>r[2]/1000)}],unit:'nghìn tỷ',digits:1,height:260,rotateLabels:true});
 legend('chNlPrem',[['Phí bảo hiểm gốc',C.navy],['Doanh thu phí thuần',C.teal]]);
 fillTable('tbl-nl-prem',['Quý','Phí gốc (tỷ)','YoY','Phí thuần (tỷ)','YoY'],NL.map((r,i)=>[q(r[0]),nf(r[1],0),signed(yoyQ(NL,i,1),1)+'%',nf(r[2],0),signed(yoyQ(NL,i,2),1)+'%']).reverse());
 sourceLine('chNlPrem',[SRC.fsw],q(NL.at(-1)[0]),'Cộng BCTC quý của 5 DN phi nhân thọ niêm yết (PVI, BMI, MIG, PTI, BIC), không phải toàn thị trường. Phí gốc là phí khai thác trực tiếp; phí thuần sau nhượng tái và giảm trừ.'+fsNote('285'));
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
const depWi=S('deposit_12m'),depVcb=S('deposit_12m_vcb'),dep=depWi.length>=12?depWi:depVcb.length?depVcb:depWi,depName=dep===depWi?'Lãi suất huy động 12T NHTM lớn (WiData)':'Tiết kiệm 12T Vietcombank';
if(gb.length&&document.getElementById('chYield')){
 const bm={};gb.forEach(r=>{bm[r.date.slice(0,7)]=r});const months=Object.keys(bm).sort(),dm=byMonth(dep);
 barLineChart('chYield',{categories:months.map(m=>mon(m+'-01')),series:[{name:'TPCP 10 năm (HNX)',color:C.navy,kind:'line',values:months.map(m=>bm[m].value)},{name:depName,color:C.teal,kind:'line',values:months.map(m=>dm[m]?.value??null)}],unit:'%',digits:2,height:260,rotateLabels:true,zeroBase:false});
 legend('chYield',[['TPCP 10 năm',C.navy],['Huy động 12 tháng',C.teal]]);
 fillTable('tbl-yield',['Tháng','TPCP 10 năm (%)','Huy động 12T (%)'],months.slice().reverse().map(m=>[mon(m+'-01'),nf(bm[m].value,3),nf(dm[m]?.value,2)]));
 const L=gb.at(-1),Y=gb.find(r=>r.date>=String(Number(L.date.slice(0,4))-1)+L.date.slice(4));
 sourceLine('chYield',[['HNX · đường cong lợi suất TPCP',B.gbond?.url||'https://hnx.vn/vi-vn/trai-phieu/duong-cong-loi-suat.html'],dep===depWi?['WiData · lãi suất huy động 12 tháng NHTM lớn','https://widata.vn/']:['Vietcombank · lãi suất tiết kiệm',macro.deposit_12m_vcb?.url||null]],short(L.date),'TPCP 10 năm: par yield trên đường cong lợi suất HNX, ngày cuối tháng. Huy động 12 tháng: '+(dep===depWi?'bình quân nhóm NHTM lớn theo tháng (WiData, chỉ tiêu 242557); điểm mới nhất của Vietcombank ở KPI.':'lãi tiết kiệm cá nhân 12 tháng Vietcombank; nguồn không có lịch sử nên chuỗi bắt đầu từ 10/2026.'));
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
 hbarCompare('chNlLines',{items:[{label:'Sức khỏe +20,8%',value:27.777,color:C.navy},{label:'Tài sản, kỹ thuật +17,5%',value:20.928,color:C.teal},{label:'Xe cơ giới +9,4%',value:16.29,color:C.gold},{label:'Bồi thường gốc',value:24.693,color:C.red}],unit:'nghìn tỷ',digits:1,labelW:170,ariaLabel:'Phi nhân thọ theo nghiệp vụ 9T/2026'});
 sourceLine('chNlLines',[['Hiệp hội Bảo hiểm qua Báo Đầu tư Chứng khoán, 28/10/2026','https://www.tinnhanhchungkhoan.vn/doanh-thu-bao-hiem-phi-nhan-tho-9-thang-vuot-75000-ty-dong-tang-166-post400365.html']],'9T/2026','Toàn thị trường phi nhân thọ 75.057 tỷ (+16,6%). Bồi thường gốc 24.693 tỷ, tỷ lệ 32,9%.',false);
 insight('chNlLines','Sức khỏe là nghiệp vụ lớn nhất và tăng nhanh nhất, tỷ lệ bồi thường 9T chỉ 23,7%; xe cơ giới bồi thường cao nhất (50,2%); tài sản, kỹ thuật tăng theo đầu tư FDI và hạ tầng, là mảng mạnh của PVI. Xe cơ giới tăng chậm nhất dù sản lượng xe tăng mạnh: cạnh tranh giá phí.');
}

// ---------- 3b. Wi ratio_ins: tỷ lệ bồi thường, nguồn lợi nhuận, danh mục đầu tư (05/11/2026) ----------
const RI=B.ratio_ins?.by_symbol||{},RC=B.ratio_ins?.columns||[],RF=B.ratio_ins?.formulas||{};
const SRC_WI=['WiData · ratio_ins (BCTC quý từng mã)','https://widata.vn/'];
const rg=(sym,k,rec)=>{const i=RC.indexOf(k);return i>0&&rec&&rec[i]!=null?rec[i]:null};
const rrecs=sym=>RI[sym]?.records||[];
const rlast=(sym,keys)=>[...rrecs(sym)].reverse().find(r=>keys.some(k=>rg(sym,k,r)!=null))||null;
const SYM={PVI:C.navy,BMI:C.teal,MIG:C.plum,PTI:C.gold,BIC:C.green,BVH:C.red,VNR:C.grey};
const PNT=['PVI','BMI','MIG','PTI','BIC'];
const fml=k=>RF[k]?' Công thức Wi: '+RF[k]+'.':'';
if(Object.keys(RI).length&&document.getElementById('chClaimQ')){
 const qs=[...new Set([...PNT,'BVH'].flatMap(s=>rrecs(s).map(r=>r[0])))].sort().slice(-12);
 const at=(s,q,k)=>rg(s,k,rrecs(s).find(r=>r[0]===q));
 const ser=[...PNT.map(s=>({name:s,color:SYM[s],kind:'line',values:qs.map(q=>at(s,q,'claim_ratio_nonlife_insurance'))})),{name:'BVH (nhân thọ)',color:SYM.BVH,kind:'line',values:qs.map(q=>at('BVH',q,'claim_ratio_life_insurance'))}];
 barLineChart('chClaimQ',{categories:qs.map(q),series:ser,unit:'%',digits:0,height:260,rotateLabels:true,zeroBase:true});
 legend('chClaimQ',ser.map(x=>[x.name,x.color]));
 fillTable('tbl-claim-q',['Quý',...PNT,'BVH nhân thọ'],qs.map(q0=>[q(q0),...PNT.map(s=>nf(at(s,q0,'claim_ratio_nonlife_insurance'),1)),nf(at('BVH',q0,'claim_ratio_life_insurance'),1)]).reverse());
 sourceLine('chClaimQ',[SRC_WI],q(qs.at(-1)),'Tỷ lệ bồi thường thuần phi nhân thọ = chi bồi thường (gốc + nhận tái − thu nhượng tái) / phí (gốc + nhận tái − nhượng tái); BVH dùng tỷ lệ nhân thọ (chi trả − thu nhượng tái) / (phí gốc − nhượng tái). Giá trị Wi là phân số, đã nhân 100.'+fml('claim_ratio_nonlife_insurance'));
 const L=Object.fromEntries(PNT.map(s=>[s,rg(s,'claim_ratio_nonlife_insurance',rlast(s,['claim_ratio_nonlife_insurance']))]));
 const srt=PNT.filter(s=>L[s]!=null).sort((a,b)=>L[a]-L[b]);
 insight('chClaimQ','Quý gần nhất: thấp nhất '+srt[0]+' '+nf(L[srt[0]],0)+'%, cao nhất '+srt.at(-1)+' '+nf(L[srt.at(-1)],0)+'%. Phí giữ lại sau khi trả bồi thường còn phải gánh hoa hồng và chi phí quản lý (thường 30–40% phí), nên mã có tỷ lệ bồi thường trên ~55% gần như không còn lãi nghiệp vụ; mã dưới 35% (MIG, BIC) là nhóm bán bảo hiểm có lãi thật. PTI biến động mạnh vì nghiệp vụ xe và sức khỏe chiếm phần lớn.');
}
if(Object.keys(RI).length&&document.getElementById('chClaimLines')){
 const LINES=[['Xe cơ giới','claim_ratio_motor_insurance'],['Sức khỏe','claim_ratio_health_insurance'],['Tài sản & thiệt hại','claim_ratio_property_casualty_insurance'],['Cháy nổ','claim_ratio_fire_explosion_insurance']];
 const keys=LINES.map(x=>x[1]);
 const picks=['BMI','MIG','BVH'].map(s=>[s,rlast(s,keys)]).filter(([,r])=>r);
 const ser=picks.map(([s,r])=>({name:s+' · '+q(r[0]),color:SYM[s],values:LINES.map(([,k])=>rg(s,k,r))}));
 barLineChart('chClaimLines',{categories:LINES.map(x=>x[0]),series:ser,unit:'%',digits:0,height:260,rotateLabels:false});
 legend('chClaimLines',ser.map(x=>[x.name,x.color]));
 fillTable('tbl-claim-lines',['Nghiệp vụ',...ser.map(x=>x.name)],LINES.map(([n,k])=>[n,...picks.map(([s,r])=>nf(rg(s,k,r),1))]));
 sourceLine('chClaimLines',[SRC_WI],picks.map(([s,r])=>s+' '+q(r[0])).join(' · '),'Chỉ BMI, MIG (và BVH ở vài quý) thuyết minh bồi thường theo nghiệp vụ; PVI, PTI, BIC, VNR không có. Giá trị bất thường (cháy nổ BMI Q3/2026 95%) là một vụ tổn thất lớn trong quý.'+fml('claim_ratio_motor_insurance'));
 insight('chClaimLines','Xe cơ giới bồi thường cao nhất (~40–45%) và sức khỏe đang tăng theo chi phí y tế — hai nghiệp vụ lớn nhất của PNT; tài sản thường thấp (10–30%) nhưng nhảy vọt khi có bão hoặc cháy lớn. Mã nghiêng về xe (PTI, MIG) cần phí tăng nhanh hơn bồi thường; mã nghiêng tài sản, kỹ thuật (PVI, BVH) chịu rủi ro thiên tai thay vì mòn dần.');
}
if(Object.keys(RI).length&&document.getElementById('chProfitMix')){
 const syms=['BVH','PVI','BMI','MIG','PTI','BIC','VNR'].filter(s=>rrecs(s).length);
 const CAP=300,outl=[];
 const pick=s=>{const r=rrecs(s).at(-1);const a=rg(s,'pct_profit_insurance_operations',r),b=rg(s,'pct_profit_financial_activities',r);if(a!=null&&Math.abs(a)>CAP||b!=null&&Math.abs(b)>CAP){outl.push(s+' '+q(r[0]));return [r,null,null]}return [r,a,b]};
 const rows=syms.map(s=>[s,...pick(s)]);
 barLineChart('chProfitMix',{categories:rows.map(x=>x[0]+' '+q(x[1][0])),series:[{name:'Nghiệp vụ bảo hiểm (trước chi phí quản lý)',color:C.navy,values:rows.map(x=>x[2])},{name:'Hoạt động tài chính',color:C.gold,values:rows.map(x=>x[3])}],unit:'%',digits:0,height:260,rotateLabels:true});
 legend('chProfitMix',[['Nghiệp vụ bảo hiểm',C.navy],['Tài chính',C.gold]]);
 const last4=s=>rrecs(s).slice(-4);
 fillTable('tbl-profit-mix',['Mã','Quý','Nghiệp vụ BH (%)','Tài chính (%)'],syms.flatMap(s=>last4(s).reverse().map(r=>[s,q(r[0]),nf(rg(s,'pct_profit_insurance_operations',r),1),nf(rg(s,'pct_profit_financial_activities',r),1)])));
 sourceLine('chProfitMix',[SRC_WI],q(rows[0][1][0]),'% LNTT: nghiệp vụ = (lãi gộp kinh doanh bảo hiểm + chi phí quản lý) / LNTT, tức trước khi trừ chi phí quản lý, nên hai cột không cộng về 100 và có thể vượt 100. Quý LNTT gần 0 cho tỷ lệ vô nghĩa: bỏ giá trị |x| > 300% (ví dụ BMI Q4/2025 7.835%, PVI Q4/2025 −424%)'+(outl.length?'; quý gần nhất bỏ: '+outl.join(', '):'')+'.'+fml('pct_profit_insurance_operations'));
 insight('chProfitMix','BVH: lợi nhuận gần như toàn bộ từ tài chính (nhân thọ lỗ nghiệp vụ theo kế toán vì trích dự phòng) — là cổ phiếu lãi suất. MIG, BIC: nghiệp vụ bảo hiểm đóng góp lớn hơn tài chính — tăng trưởng phí trực tiếp thành lợi nhuận. PVI, VNR, PTI ở giữa. Đọc cùng tỷ lệ bồi thường: mã vừa bồi thường thấp vừa lãi từ nghiệp vụ cao là mã ít phụ thuộc lãi suất nhất.');
}
if(Object.keys(RI).length&&document.getElementById('chRevMix')){
 const LINES=[['Xe cơ giới','pct_revenue_motor_insurance'],['Sức khỏe','pct_revenue_health_insurance'],['Tài sản & thiệt hại','pct_revenue_property_casualty_insurance'],['Cháy nổ','pct_revenue_fire_explosion_insurance'],['Tàu thủy','pct_revenue_marine_insurance']];
 const keys=LINES.map(x=>x[1]);
 const picks=['BIC','BMI','MIG'].map(s=>[s,rlast(s,keys)]).filter(([,r])=>r);
 const ser=LINES.map(([n,k],i)=>({name:n,color:[C.gold,C.navy,C.teal,C.red,C.grey][i],values:picks.map(([s,r])=>rg(s,k,r))}));
 barLineChart('chRevMix',{categories:picks.map(([s,r])=>s+' '+q(r[0])),series:ser,unit:'%',digits:0,height:260,rotateLabels:false});
 legend('chRevMix',ser.map(x=>[x.name,x.color]));
 fillTable('tbl-rev-mix',['Nghiệp vụ',...picks.map(([s,r])=>s+' '+q(r[0]))],LINES.map(([n,k])=>[n,...picks.map(([s,r])=>nf(rg(s,k,r),1))]));
 sourceLine('chRevMix',[SRC_WI],picks.map(([s,r])=>s+' '+q(r[0])).join(' · '),'% phí thuần (gốc + nhận tái − nhượng tái) theo nghiệp vụ; PVI, PTI, VNR không thuyết minh trên Wi. Các nghiệp vụ còn lại (hàng hóa, hàng không, khác) không hiện.'+fml('pct_revenue_health_insurance'));
 insight('chRevMix','BIC nghiêng sức khỏe (~50–60% phí) — nghiệp vụ tăng nhanh nhất thị trường, bồi thường thấp; MIG cân bằng xe – sức khỏe – tài sản; BMI tài sản & cháy nổ nhiều hơn nên lãi nghiệp vụ nhạy với tổn thất lớn. Cơ cấu phí quyết định mã nào hưởng lợi khi sức khỏe tiếp tục +20%/năm.');
}
if(Object.keys(RI).length&&document.getElementById('chInvMix')){
 const syms=['BVH','PVI','BMI','MIG','PTI','BIC','VNR'].filter(s=>rrecs(s).length);
 const K=['pct_investment_short_term_deposits','pct_investment_long_term_deposits','pct_investment_short_term_govt_bonds','pct_investment_long_term_govt_bonds','pct_investment_listed_shares'];
 const picks=syms.map(s=>[s,rlast(s,K.slice(0,2))]).filter(([,r])=>r);
 const sum=(s,r,ks)=>{const v=ks.map(k=>rg(s,k,r)).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0):null};
 const dep_=([s,r])=>sum(s,r,K.slice(0,2)),gov=([s,r])=>sum(s,r,K.slice(2,4)),shr=([s,r])=>rg(s,K[4],r);
 const ser=[{name:'Tiền gửi, chứng chỉ tiền gửi',color:C.navy,values:picks.map(dep_)},{name:'Trái phiếu chính phủ',color:C.teal,values:picks.map(gov)},{name:'Cổ phiếu niêm yết',color:C.gold,values:picks.map(shr)}];
 barLineChart('chInvMix',{categories:picks.map(([s,r])=>s+' '+q(r[0])),series:ser,unit:'%',digits:0,height:260,rotateLabels:true});
 legend('chInvMix',ser.map(x=>[x.name,x.color]));
 fillTable('tbl-inv-mix',['Mã','Quý','Tiền gửi (%)','TPCP (%)','Cổ phiếu niêm yết (%)','Còn lại (%)'],picks.map(p=>{const d=dep_(p),g=gov(p),h=shr(p);return [p[0],q(p[1][0]),nf(d,1),nf(g,1),nf(h,1),nf(100-(d||0)-(g||0)-(h||0),1)]}));
 sourceLine('chInvMix',[SRC_WI],picks.map(([s,r])=>s+' '+q(r[0])).join(' · '),'% trên tổng đầu tư tài chính ngắn + dài hạn (chưa trừ dự phòng), theo thuyết minh BCTC. "Còn lại" gồm trái phiếu doanh nghiệp, ủy thác, góp vốn, cổ phiếu chưa niêm yết. BIC: quý gần nhất không thuyết minh, lấy quý trước.'+fml('pct_investment_short_term_deposits'));
 window.__insInvShare=Object.fromEntries(picks.map(p=>[p[0],{share:dep_(p),q:q(p[1][0])}]));
 insight('chInvMix','Phi nhân thọ để 55–80% danh mục ở tiền gửi kỳ hạn ngắn → lãi tiền gửi tái tục theo lãi suất huy động trong 2–4 quý. BVH giữ ~25% TPCP dài hạn và ~54% tiền gửi: lợi suất TPCP 10 năm là biến của BVH, lãi huy động 12 tháng là biến của nhóm PNT. Cổ phiếu niêm yết chỉ 1–10% (PVI, BMI, BIC cao nhất) — thị trường chứng khoán tốt là phần thưởng thêm, không phải động cơ chính.');
}
// Độ nhạy lợi nhuận theo 1 điểm % lãi suất
if(document.getElementById('tbl-sens')){
 const sh=window.__insInvShare||{};
 const EV={BVH:{dep:166709,depNote:'tiền gửi ngắn hạn 115.668 + dài hạn 51.041 tỷ (30/6/2026)',url:'https://mekongasean.vn/bao-viet-bao-lai-quy-2-tang-50-dau-tu-hon-4200-ty-dong-vao-co-phieu-57996.html',src:'Mekong ASEAN',lntt:3554,lurl:'https://nhadautu.vn/tap-doan-bao-viet-bvh-tong-tai-san-hop-nhat-tai-31-12-2025-dat-gan-292000-ty-dong-tang-truong-161-d103984.html'},
  PVI:{size:20000,sizeNote:'danh mục sát 20.000 tỷ, tiền gửi >14.300 tỷ (72%) cuối Q2/2026',dep:14300,url:'https://thoibaotaichinhvietnam.vn/pvi-sap-can-dich-ke-hoach-loi-nhuan-chi-sau-6-thang-danh-muc-dau-tu-tien-sat-20-000-ty-dong-201195.html',src:'TBTC',lntt:1460,lurl:'https://thoibaotaichinhvietnam.vn/pvi-chi-dam-co-tuc-tren-770-ty-dong-kinh-doanh-vuot-bao-thien-tai-194343.html'},
  BIC:{size:7453,sizeNote:'đầu tư dài hạn 2.160,6 + ngắn hạn 4.707,2 + CK kinh doanh 585,5 tỷ (30/6/2026)',url:'https://thoibaotaichinhvietnam.vn/bao-hiem-bic-bao-lai-tang-manh-trong-quy-ii-mo-rong-danh-muc-dau-tu-len-gan-7-500-ty-dong-201645.html',src:'TBTC',lntt:679,lurl:'https://www.dnse.com.vn/senses/tin-tuc/dhdcd-bic-muc-tieu-lai-780-ty-dong-trong-nam-2026-tang-chia-co-tuc-tien-mat-len-12-35224725'},
  VNR:{size:6382,sizeNote:'danh mục 6.382 tỷ (30/6/2026)',url:'https://thoibaotaichinhvietnam.vn/bo-trung-nhieu-gio-danh-muc-dau-tu-da-dang-giup-tai-bao-hiem-vinare-bao-lai-hon-290-ty-dong-201416.html',src:'TBTC',lntt:507.8,lurl:'https://thoibaotaichinhvietnam.vn/tai-bao-hiem-vinare-phan-dau-nhieu-chi-tieu-tang-hai-chu-so-lai-560-ty-dong-194784.html'},
  MIG:{lntt:408.8,lurl:'https://mekongasean.vn/dhdcd-mic-2026-muc-tieu-top-3-thi-phan-bao-hiem-tim-doi-tac-chien-luoc-53786.html'},
  PTI:{size:4980,sizeNote:'danh mục ~4.980 tỷ, tiền gửi 3.777,1 tỷ (cuối Q3/2026)',dep:3777.1,url:'https://thoibaotaichinhvietnam.vn/bao-hiem-pti-lai-245-ty-dong-sau-9-thang-loi-nhuan-gop-hoat-dong-tai-chinh-tang-gan-65-206126.html',src:'TBTC',lntt:373,lurl:'https://mekongasean.vn/bao-hiem-buu-dien-khong-thong-qua-phuong-an-phat-hanh-co-phieu-tang-von-54377.html'},
  BMI:{lntt:302,lurl:'https://nhandan.vn/dai-hoi-dong-co-dong-bao-minh-bmi-nam-2026-hoan-thanh-vuot-ke-hoach-loi-nhuan-tiep-tuc-cung-co-nen-tang-phat-trien-ben-vung-post966325.html'}};
 const t=document.getElementById('tbl-sens');t.innerHTML='<thead><tr><th>Mã</th><th>Quy mô danh mục (tỷ)</th><th>Tỷ trọng tiền gửi (Wi)</th><th>Tiền gửi ước (tỷ)</th><th>+1 điểm % lãi suất = Δ lãi (tỷ/năm)</th><th>LNTT 2025 (tỷ)</th><th>% LNTT nhạy / 1 điểm %</th></tr></thead>';
 const tb=document.createElement('tbody');const srcs=[];
 ['BVH','PVI','BMI','MIG','PTI','BIC','VNR'].forEach(s=>{const e=EV[s]||{},w=sh[s]||{};
  const depAmt=e.dep!=null?e.dep:(e.size!=null&&w.share!=null?e.size*w.share/100:null);
  const d=depAmt!=null?depAmt*0.01:null,pct=d!=null&&e.lntt?d/e.lntt*100:null;
  const tr=document.createElement('tr');
  const cells=[s,e.size!=null?nf(e.size,0):(e.dep!=null?nf(e.dep,0)+' (tiền gửi)':'— chưa có bài đã mở'),w.share!=null?nf(w.share,0)+'% ('+w.q+')':'—',depAmt!=null?nf(depAmt,0):'—',d!=null?'+'+nf(d,0):'—',e.lntt?nf(e.lntt,0):'—',pct!=null?'+'+nf(pct,1)+'%':'—'];
  cells.forEach((c,i)=>{const td=document.createElement('td');if(i===6&&pct!=null){const b=document.createElement('b');b.textContent=c;td.append(b)}else td.textContent=c;tr.append(td)});tb.append(tr);
  if(e.url)srcs.push([s+' danh mục: '+e.src,e.url]);if(e.lurl)srcs.push([s+' LNTT 2025',e.lurl])});
 t.append(tb);
 const sn=document.getElementById('sens-note');if(sn)sn.textContent='Giả định: toàn bộ tiền gửi tái tục ở lãi suất mới trong 12 tháng (thực tế 2–4 quý); chưa trừ thuế; chưa tính TPCP (lãi cố định, chỉ ảnh hưởng khi mua mới) và cổ phiếu. BVH nhân thọ còn chiều ngược: lãi suất tăng làm giảm dự phòng toán học nhưng lãi suất cam kết với khách cũng tăng theo — con số chỉ là chiều thu nhập tiền gửi. Quy mô danh mục tại 30/6/2026 (PTI: 30/9/2026) từ bài đã mở (evidence.json); BMI, MIG chưa có bài đã mở nêu quy mô danh mục nên để trống (cập nhật khi có BCTC). Tỷ trọng tiền gửi lấy từ WiData ratio_ins (quý ghi cạnh số).';
 const sl=document.getElementById('sens-src');if(sl){sl.append('Nguồn: ');srcs.forEach(([n,u],i)=>{if(i)sl.append(' · ');const a=make('a','',n);a.href=u;a.target='_blank';a.rel='noopener';sl.append(a)});sl.append(' · tỷ trọng tiền gửi: ');const a=make('a','','WiData');a.href='https://widata.vn/';a.target='_blank';a.rel='noopener';sl.append(a)}
 const card=t.closest('.card');if(card){card.append(make('div','chart-insight','Cách hiểu trong bối cảnh ngành · AI: cùng 1 điểm % lãi suất, BVH thêm ~1.670 tỷ lãi tiền gửi — gần nửa LNTT 2025 — nên BVH là cổ phiếu lãi suất thuần; PVI, BIC, VNR nhạy 10–15% LNTT; mã tăng trưởng nhờ phí (MIG, BIC) ít cần lãi suất hơn. Lãi suất huy động đã tăng gần 1 điểm % từ cuối 2025: phần này vào lợi nhuận dần đến giữa 2027.'));card.querySelector('.chart-insight').dataset.inputOwner='ai'}
}
// TPCP 10N dịch 2 quý vs lợi nhuận tài chính
if(gb.length&&NL.length&&document.getElementById('chYieldLag')){
 const qk=d=>d.slice(0,4)+'-Q'+Math.ceil(Number(d.slice(5,7))/3);
 const qa={};gb.forEach(r=>{const k=qk(r.date);(qa[k]=qa[k]||[]).push(r.value)});
 const qavg=k=>qa[k]?qa[k].reduce((a,b)=>a+b,0)/qa[k].length:null;
 const prevQ=(k,n)=>{let y=Number(k.slice(0,4)),qn=Number(k.slice(6));qn-=n;while(qn<1){qn+=4;y-=1}return y+'-Q'+qn};
 const rs=NL.slice(-12),lm=Object.fromEntries(LF.map(r=>[r[0],r]));
 barLineChart('chYieldLag',{categories:rs.map(r=>q(r[0])),series:[{name:'LN tài chính PNT (trăm tỷ)',color:C.navy,values:rs.map(r=>r[5]/100)},{name:'LN tài chính BVH (nghìn tỷ)',color:C.plum,kind:'line',values:rs.map(r=>lm[r[0]]?lm[r[0]][5]/1000:null)},{name:'TPCP 10N 2 quý trước (%)',color:C.gold,kind:'line',values:rs.map(r=>{const v=qavg(prevQ(r[0],2));return v==null?null:Math.round(v*100)/100})}],unit:'',digits:1,height:260,rotateLabels:true});
 legend('chYieldLag',[['LN tài chính PNT, trăm tỷ',C.navy],['LN tài chính BVH, nghìn tỷ',C.plum],['TPCP 10N bình quân 2 quý trước, %',C.gold]]);
 fillTable('tbl-yield-lag',['Quý','LN tài chính PNT (tỷ)','BVH (tỷ)','TPCP 10N quý đó (%)','TPCP 10N 2 quý trước (%)'],rs.map(r=>[q(r[0]),nf(r[5],0),nf(lm[r[0]]?.[5],0),nf(qavg(r[0]),2),nf(qavg(prevQ(r[0],2)),2)]).reverse());
 sourceLine('chYieldLag',[SRC.fsw,['HNX · đường cong lợi suất TPCP',B.gbond?.url||'https://hnx.vn/']],q(rs.at(-1)[0]),'Lợi suất TPCP 10 năm bình quân các ngày cuối tháng trong quý (HNX, có từ 2024), vẽ tại quý sau đó 2 quý để so với lợi nhuận tài chính cùng kỳ. Ba chuỗi khác đơn vị, cùng một trục: chỉ đọc chiều đi, không so độ lớn.');
 insight('chYieldLag','Lợi nhuận tài chính đi theo lãi suất của 2 quý trước vì tiền gửi 6–12 tháng tái tục dần. TPCP 10 năm chạm đáy ~2,2–2,5% giữa 2024–2025 rồi tăng lên ~4,5% cuối 2026: phần tăng này mới vào lợi nhuận từ nửa cuối 2026 và còn kéo sang 2027 nếu lãi suất giữ.');
}

// ---------- 4. KPIs, quick read, catalyst brief ----------
const nI=NL.length-1,lI=LF.length-1,nL=NL.at(-1),lL=LF.at(-1),gL=gb.at(-1),dL=dep.at(-1),nlS=sec['285']?.records||[],nlV=nlS.at(-1),lfS=sec['151']?.records||[],lfV=lfS.at(-1);
const claimLast=PNT.map(s=>[s,rg(s,'claim_ratio_nonlife_insurance',rlast(s,['claim_ratio_nonlife_insurance']))]).filter(x=>x[1]!=null).sort((a,b)=>a[1]-b[1]);
const medClaim=claimLast.length?claimLast[Math.floor(claimLast.length/2)][1]:null,claimSpan=claimLast.length?claimLast[0][0]+' '+nf(claimLast[0][1],0)+'% → '+claimLast.at(-1)[0]+' '+nf(claimLast.at(-1)[1],0)+'%':'Thiếu Wi ratio_ins';
const nlY=yoyQ(NL,nI,1),lfY=yoyQ(LF,lI,1),finY=yoyQ(NL,nI,5),clY=yoyQ(NL,nI,3),lr=lossR(nL),gY=gL?gL.value-(gb.find(r=>r.date>=String(Number(gL.date.slice(0,4))-1)+gL.date.slice(4))?.value??gL.value):null,carY=ytdYo(car);
kpi('spk-nlprem',nL?nf(nL[1]/1000,1):'—',nL?'nghìn tỷ phí gốc PNT · '+q(nL[0]):'—',nL?signed(nlY,0)+'% so cùng kỳ':'',NL.slice(-8).map(r=>r[1]));
kpi('spk-loss',lr!=null?nf(lr,0)+'%':'—',nL?'bồi thường / phí thuần PNT · '+q(nL[0]):'—',NL.length>4?'cùng kỳ '+nf(lossR(NL[nI-4]),0)+'%':'',NL.slice(-8).map(lossR),C.red);
kpi('spk-lifeprem',lL?nf(lL[1]/1000,1):'—',lL?'nghìn tỷ phí gốc BVH · '+q(lL[0]):'—',lL?signed(lfY,0)+'% so cùng kỳ':'',LF.slice(-8).map(r=>r[1]),C.plum);
kpi('spk-yield',gL?nf(gL.value,2)+'%':'—',gL?'TPCP 10 năm · '+short(gL.date):'—',gY!=null?signed(gY*100,0)+' đcb so cùng kỳ':'',gb.filter((r,i)=>i%20===0).slice(-12).map(r=>r.value),C.navy);
kpi('spk-dep',(depVcb.at(-1)||dL)?nf((depVcb.at(-1)||dL).value,2)+'%':'—',depVcb.at(-1)?'tiết kiệm 12T Vietcombank · '+mon(depVcb.at(-1).date):dL?'huy động 12T NHTM lớn · '+mon(dL.date):'—',(()=>{if(!dL)return '';const p=dep.find(r=>r.date.slice(0,7)===String(Number(dL.date.slice(0,4))-1)+dL.date.slice(4,7));if(p)return 'NHTM lớn '+signed(dL.value-p.value,2)+' điểm % YoY';const m=dep.at(-2);return m?signed(dL.value-m.value,2)+' điểm % so tháng trước':''})(),dep.slice(-12).map(r=>r.value),C.teal);
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
 row('Định giá','PNT rẻ đi, BVH đắt lên',[nlV?nf(nlV[2],2)+'x':'—','P/B phi nhân thọ'],'BVH '+(lfV?nf(lfV[2],2):'—')+'x; tái bảo hiểm ~1,15x','BCTC quý III (20–30/10)',nlV?'info':'na','PVI · BMI · BVH','chSectorVal'),
 row('Chi phí','Bồi thường thuần từng mã (Wi)',[medClaim!=null?nf(medClaim,0)+'%':'—','trung vị 5 mã PNT, quý gần nhất'],claimSpan,'Trung vị vượt 45%',medClaim==null?'na':medClaim<40?'good':medClaim>45?'risk':'watch','▲ MIG · BIC (thấp nhất) · ▼ PTI','chClaimQ'),
 row('Tái bảo hiểm','Giá tái bảo hiểm rẻ hơn',['−19%','APAC ROL 1/7/2026'],'1/1/2026 −12%; toàn cầu −16%','ROL tăng trở lại ở kỳ 1/1/2027','good','▲ PNT nhượng tái (PVI, BVH) · ▼ VNR nhận tái','chNlLoss')];
const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
window.INSURANCE_BRIEF={
 headline:(nlY==null?'Thiếu số phí PNT':'Phi nhân thọ '+(nlY>12?'ở pha tốt nhất nhiều năm':nlY>8?'còn tăng':'chậm lại')+': phí '+signed(nlY,0)+'% (ngưỡng +8%), bồi thường '+(lr!=null?nf(lr,0)+'%':'—')+' (ngưỡng 45%)')+' · lãi suất '+(gY!=null&&gY>0.3?'cao hơn năm trước':gY!=null&&gY<-0.3?'thấp hơn năm trước':'đi ngang')+' (TPCP 10N '+(gL?nf(gL.value,2)+'%':'—')+', vào lãi đầu tư sau 2 quý) · nhân thọ '+(lfY!=null&&lfY>8?'đã hồi':'chưa hồi')+' (BVH phí '+signed(lfY,0)+'%) · tái bảo hiểm rẻ hơn (APAC ROL −19%) · '+nGood+' thuận, '+nRisk+' rủi ro',
 segs:[['Phi nhân thọ','PVI · BMI · MIG · PTI · BIC',nlY!=null&&nlY>12?'up':'flat','Phí gốc '+signed(nlY,0)+'%'],['Nhân thọ','BVH',lfY!=null&&lfY>8?'up':'flat','Phí gốc '+signed(lfY,0)+'%'],['Tái bảo hiểm','VNR','flat','Bồi thường/phí '+nf(lossR(RE.at(-1)),0)+'%']],
 headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
 score,
 events:[['Hằng tuần','Lợi suất TPCP, lãi suất huy động'],['Mùa bão 9–11','Thiên tai lớn → bồi thường phi nhân thọ, VNR (Q4 là quý rủi ro)'],['Đầu T1 và T7','Guy Carpenter ROL — giá tái bảo hiểm kỳ tái tục 1/1/2027'],['Đầu tháng','NSO: sản lượng ô tô, xe máy'],['20–30/01','BCTC quý IV — tỷ lệ bồi thường, cơ cấu đầu tư từng mã (Wi) cập nhật']]
};
const built=document.getElementById('wi-built');if(built&&W.built_at)built.textContent='Dựng từ nguồn công khai lúc '+new Date(W.built_at).toLocaleString('vi-VN')+' (VNDirect, HNX, NSO, Vietcombank)'+(W.wi_filled?.length?'; WiData lấp: '+W.wi_filled.join(', '):'')+'.';
})();
