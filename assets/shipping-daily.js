/* Vận tải biển: BDI theo phiên, TCE theo tuyến (dumbbell), cổ phiếu vận tải VN. Dữ liệu: data/shipping-daily-public-data.js */
(function(){
const D=window.SHIPPING_DAILY;if(!D)return;
const C={navy:'#2938A8',teal:'#27af95',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const $=id=>document.getElementById(id);
const nf=(v,d=0)=>v==null||isNaN(v)?'—':v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d});
const sg=(v,d=1)=>v==null||isNaN(v)?'—':(v>0?'+':'')+nf(v,d)+'%';
const dm=s=>s.slice(8,10)+'/'+s.slice(5,7);
const dmy=s=>dm(s)+'/'+s.slice(0,4);
function el(t,c,x){const n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n}
function src(host,parts,period,note){const n=el('div','source-note');n.append('Nguồn: ');parts.forEach(([t,u],i)=>{if(i)n.append(' · ');const a=el('a','',t);a.href=u;a.target='_blank';a.rel='noopener';n.append(a)});n.append(' · Kỳ cuối: '+period);host.after(n);if(note){const ex=host.closest('.card')?.querySelector('details.note-icon>div');if(ex){ex.prepend(note+' ');return}const d=el('details','note-icon');d.innerHTML='<summary>ⓘ Lưu ý dữ liệu</summary>';d.append(el('div','',note));n.after(d)}}
// Chart theo phiên: nhãn đủ ngày để bộ chọn nhận chu kỳ "Phiên", trục x hiện dd/mm ngang và thưa
function dayChart(id,days,series,unit,digits,height){const host=$(id);if(!host)return;const m={categories:days.map(dmy),tickLabels:days.map(dm),series,unit,digits,zeroBase:false,height,flatTicks:true};
 if(window.ChartTypes)ChartTypes.mount(host,m,()=>barLineChart(id,{categories:days.map(dm),series,unit,digits,height,zeroBase:false}));else barLineChart(id,{categories:days.map(dm),series,unit,digits,height,zeroBase:false})}
function table(id,head,rows){const t=$(id);if(!t)return;t.innerHTML='<thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody>'}

// 1. BDI theo phiên
const bdi=(D.bdi?.records||[]).filter(r=>r[0]>='2026-05-01');
if(bdi.length&&$('chBdiDaily')&&window.barLineChart){
 dayChart('chBdiDaily',bdi.map(r=>r[0]),[{name:'BDI',color:C.navy,kind:'line',values:bdi.map(r=>r[1])}],'điểm',0,260);
 table('tbl-bdi-daily',['Phiên','Điểm','So phiên trước'],bdi.slice().reverse().map((r,i,a)=>[dmy(r[0]),nf(r[1]),a[i+1]?sg((r[1]/a[i+1][1]-1)*100):'—']));
 src($('chBdiDaily'),[[D.bdi.source,D.bdi.url]],dmy(bdi.at(-1)[0]));
}
const sub=D.bdi_sub;
if(sub&&window.barLineChart){
 const rs=Object.entries(sub.records).filter(([d])=>d>='2026-09-01');
 [['a','BCI','#d1783f'],['b','BPI',C.teal],['c','BSI',C.gold],['d','BHSI',C.plum]].forEach(([k,f,c])=>{const id='chBdiSub'+k;if(!$(id)||!rs.length)return;
  dayChart(id,rs.map(([d])=>d),[{name:f,color:c,kind:'line',values:rs.map(([,r])=>r[f])}],'điểm',0,260);
  src($(id),[[sub.source,sub.url]],dmy(rs.at(-1)[0]),f==='BCI'&&sub.bdi_mismatch?.length?'Handybulk chép lại bản tin Baltic Exchange theo ngày. '+sub.bdi_mismatch.length+' phiên có BDI lệch với CNBC (phần lớn cuối 2025), giữ nguyên số Handybulk.':null)});
}

// 2. TCE theo tuyến — dumbbell, thang log
const tce=D.tce;
function tceChart(hostId,group){if(!tce||!$(hostId))return;
 const dates=[...new Set(tce.routes.flatMap(r=>r.records.map(x=>x[0])))].sort().slice(-3);
 const rows=tce.routes.filter(r=>r.group===group).map(r=>({...r,v:dates.map(d=>(r.records.find(x=>x[0]===d)||[])[1]??null)}));
 const all=rows.flatMap(r=>r.v).filter(Boolean),lo=Math.min(...all)/1.35,hi=Math.max(...all)*1.6;
 const host=$(hostId);
 const draw=()=>{
 const W=Math.max(560,host.clientWidth||760),L=270,R=70,rowH=32,top=34;let groups=[],y=top;rows.forEach((r,i)=>{if(!i||rows[i-1].group!==r.group){groups.push([r.group,y]);y+=22}r.y=y;y+=rowH});
 const H=y+30,X=v=>L+(Math.log10(v)-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*(W-L-R);
 const ticks=[];for(let p=Math.pow(10,Math.floor(Math.log10(lo)));p<=hi*10;p*=10)[1,2,5].forEach(m=>{const v=p*m;if(v>=lo&&v<=hi)ticks.push(v)});
 const lab=v=>v>=1e6?nf(v/1e6,2)+' tr':nf(v/1e3)+'k';
 let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto;font:13px var(--font-body,inherit)" role="img" aria-label="TCE theo tuyến Baltic">`;
 ticks.forEach(v=>{s+=`<line x1="${X(v)}" x2="${X(v)}" y1="${top}" y2="${H-26}" stroke="currentColor" stroke-opacity=".12"/><text x="${X(v)}" y="${H-10}" text-anchor="middle" fill="currentColor" fill-opacity=".6">${lab(v)}</text>`});
 [['○',0],['●',1],['●',2]].forEach(([g,i],k)=>{const x=k*90;s+=`<circle cx="${x+6}" cy="14" r="5" fill="${i===0?'none':i===1?C.grey:C.navy}" stroke="${i===0?C.grey:'none'}"/><text x="${x+16}" y="18" fill="currentColor">${dm(dates[i])}</text>`});
 groups.forEach(([g,gy])=>{s+=`<text x="0" y="${gy+14}" font-weight="700" fill="currentColor">${g}</text>`});
 rows.forEach(r=>{const [a,b,c]=r.v,cy=r.y+14;s+=`<text x="0" y="${cy+4}" fill="currentColor"><tspan font-weight="700">${r.code}</tspan> <tspan fill-opacity=".7">${r.name}</tspan></text>`;
  if(b&&c)s+=`<line x1="${X(b)}" x2="${X(c)}" y1="${cy}" y2="${cy}" stroke="${c>=b?C.green:C.red}" stroke-width="4" stroke-linecap="round"/>`;
  if(a)s+=`<circle cx="${X(a)}" cy="${cy}" r="5" fill="none" stroke="${C.grey}" stroke-width="1.5"/>`;
  if(b)s+=`<circle cx="${X(b)}" cy="${cy}" r="5" fill="${C.grey}"/>`;
  if(c){const xs=[a,b,c].filter(Boolean).map(X),right=X(c)>=Math.max(...xs);s+=`<circle cx="${X(c)}" cy="${cy}" r="6" fill="${C.navy}"/><text x="${right?X(c)+10:Math.min(...xs)-10}" text-anchor="${right?'start':'end'}" y="${cy+4}" fill="${C.navy}" font-weight="600">${lab(c)}</text>`}});
 host.innerHTML=s+'</svg>';
 };
 draw();let lastW=host.clientWidth;if(window.ResizeObserver)new ResizeObserver(()=>{const w=host.clientWidth;if(w&&Math.abs(w-lastW)>8){lastW=w;draw()}}).observe(host);
 src(host,[[tce.source,tce.url]],dmy(dates[2]),'Mỗi mốc là thứ Sáu của bản Affinity Tanker Weekly; vạch nối hai tuần gần nhất (xanh tăng, đỏ giảm). Spot Vịnh (TD3C, TC5, TC17) rất cao vì ít tàu chịu vào; tàu VN chủ yếu nhận TC nên hưởng một phần.'+(tce.missing?' '+tce.missing:''));
}
tceChart('chTceRoutes','Dầu thô');tceChart('chTceProduct','Thành phẩm');

// 2b. Tàu sản phẩm: BCTI theo phiên (East Money), giá tàu MR/product (Fearnleys), thuê tàu LPG (Fearnleys)
const bc=(D.eastmoney?.series?.bcti?.records||[]).filter(r=>r[0]>='2026-05-01');
if(bc.length&&$('chBctiDaily')){dayChart('chBctiDaily',bc.map(r=>r[0]),[{name:'BCTI',color:C.teal,kind:'line',values:bc.map(r=>r[1])}],'điểm',0,260);
 src($('chBctiDaily'),[['East Money · BCTI',D.eastmoney.series.bcti.url]],dmy(bc.at(-1)[0]))}
const FE=window.SHIPPING_PUBLIC?.blocks?.fearnleys;
const CM=D.compass?.mr||[];
if(FE&&$('chMrPrice')&&window.barLineChart){const ks=[['sh5_mr','MR 5 tuổi (Fearnleys)',C.navy],['sh10_mr','MR 10 tuổi (Fearnleys)',C.teal],['nb_product_tanker','Đóng mới product tanker (Fearnleys)',C.gold]].filter(([k])=>FE.series[k]);
 const cmM={};CM.forEach(r=>{cmM[r.date.slice(0,7)]=r});
 const months=[...new Set([...ks.flatMap(([k])=>FE.series[k].records.map(r=>r.date.slice(0,7))),...Object.keys(cmM)])].sort().filter(m=>m>='2024-01');
 const val=(k,m)=>{const r=FE.series[k].records.filter(x=>x.date.slice(0,7)===m).at(-1);return r?r.value:null};
 barLineChart('chMrPrice',{categories:months.map(m=>'T'+(+m.slice(5))+'/'+m.slice(2,4)),series:[...ks.map(([k,n,c])=>({name:n,color:c,kind:'line',values:months.map(m=>val(k,m))})),{name:'MR 5 tuổi (Compass)',color:C.plum,kind:'line',values:months.map(m=>cmM[m]?.y5??null)},{name:'MR 10 tuổi (Compass)',color:'#d1783f',kind:'line',values:months.map(m=>cmM[m]?.y10??null)}],unit:'triệu USD',digits:1,height:260,zeroBase:false,rotateLabels:true});
 src($('chMrPrice'),[['Fearnleys qua WiData (bảng 362)','https://widata.vn/'],...(FE.pdf_url?[['Fearnleys Weekly Report (PDF)',FE.pdf_url]]:[])],dmy(FE.series.nb_product_tanker.records.at(-1).date),'Bản PDF Fearnleys không có giá tàu cũ MR nên hai đường MR Fearnleys dừng 23/10/2026 (số Wi). Compass Maritime (MR 51.000 DWT, từ 1/2026) định giá cao hơn Fearnleys 1–3 triệu USD nên vẽ đường riêng, không nối.')
 if(CM.length){const n=$('chMrPrice').parentElement.querySelector('.source-note');if(n){n.append(' · ');const a=el('a','','Compass Maritime Weekly (PDF)');a.href=CM.at(-1).url;a.target='_blank';a.rel='noopener';n.append(a)}}}
if(CM.length&&$('chMrTc')){const rs=CM.filter(r=>r.tc_mr);dayChart('chMrTc',rs.map(r=>r.date),[{name:'MR 47k DWT',color:C.navy,kind:'line',values:rs.map(r=>r.tc_mr/1000)},{name:'LR1 80k DWT',color:C.teal,kind:'line',values:rs.map(r=>r.tc_lr1?r.tc_lr1/1000:null)}],'nghìn USD/ngày',1,260);
 src($('chMrTc'),[['Compass Maritime Weekly (PDF)',rs.at(-1).url]],dmy(rs.at(-1).date),'Giá thuê định hạn 12 tháng Compass ước tính mỗi thứ Hai, ngày ghi = thứ Sáu trước đó. Mức VTO, VIP ký thực tế (~27 nghìn MR theo ACBS 8/2026) thấp hơn vì ký từ trước. Một số tuần (chủ yếu 4–7/2026) không tải được bản PDF nên trục ngày không liên tục.')}
const LP=D.lpg;
if(LP&&LP.reports?.length&&$('chLpg')&&window.barLineChart){const rs=LP.reports,ks=[['lpg_vlgc','VLGC 84k cbm',C.navy],['lpg_mgc','MGC 38k cbm',C.teal],['lpg_sr65','Định áp 6,5k cbm',C.gold],['lpg_coaster','Coaster 3,5–5k cbm (châu Âu)',C.plum]];
 if(window.ChartTypes)ChartTypes.mount($('chLpg'),{categories:rs.map(r=>dmy(r.date)),tickLabels:rs.map(r=>dm(r.date)),series:ks.map(([k,n,c])=>({name:n,color:c,kind:'bar',values:rs.map(r=>r.values[k]??null)})),unit:'nghìn USD/tháng',digits:0,zeroBase:true,height:260,flatTicks:true,native:'bar'});
 src($('chLpg'),[['Fearnleys Weekly Report (PDF)',rs.at(-1).url]],dmy(rs.at(-1).date),'Giá thuê spot theo tháng của Fearnleys. GSP chạy tàu LPG định áp cỡ nhỏ (~5.000 cbm) tuyến Đông Nam Á, gần với hai cỡ nhỏ nhất ở đây; Baltic LPG (BLPG) chưa có nguồn mở.')}

// 2c. Baltic LPG (BLPG1–3) — bảng trong thẻ LPG
const BL=D.blpg;
if(BL?.records?.length&&$('chLpg')){const card=$('chLpg').closest('.card'),rs=BL.records,a=rs.at(-2),b=rs.at(-1);
 const names={blpg1:'BLPG1 Ras Tanura – Chiba',blpg2:'BLPG2 Houston – Flushing',blpg3:'BLPG3 Houston – Chiba'};
 const w=el('div','tablewrap');w.style.marginTop='12px';
 w.innerHTML='<table class="compare-table"><thead><tr><th>Baltic LPG (VLGC)</th><th>USD/tấn '+dm(b.date)+'</th><th>TCE USD/ngày '+(a?dm(a.date)+' → ':'')+dm(b.date)+'</th></tr></thead><tbody>'+Object.keys(names).map(k=>'<tr><td>'+names[k]+'</td><td>'+nf(b[k].usd_t,2)+'</td><td>'+(a?nf(a[k].tce)+' → ':'')+'<b>'+nf(b[k].tce)+'</b></td></tr>').join('')+'</tbody></table>';
 const sn=card.querySelector('.source-note');(sn||card).before(w);
 if(sn){sn.append(' · ');const l=el('a','','Baltic Exchange qua The Edge Malaysia');l.href=b.url;l.target='_blank';l.rel='noopener';sn.append(l)}}

// 3. Cổ phiếu vận tải VN
const st=D.stocks||{},tk=['PVT','VTO','VOS','VIP'].filter(t=>st[t]),col={PVT:C.navy,VTO:C.teal,VOS:'#d1783f',VIP:C.gold};
if(tk.length&&$('chShipStocks')&&window.barLineChart){
 const base={},m={};tk.forEach(t=>{const r=st[t].records;base[t]=r.find(x=>x[0]==='2025-12-31')[1];m[t]=Object.fromEntries(r)});
 const days=[...new Set(tk.flatMap(t=>st[t].records.map(x=>x[0])))].filter(d=>d>='2026-08-01').sort();
 dayChart('chShipStocks',days,tk.map(t=>({name:t,color:col[t],kind:'line',values:days.map(d=>m[t][d]!=null?(m[t][d]/base[t]-1)*100:null)})),'%',1,260);
 table('tbl-ship-stocks',['Mã','Giá (đồng)','1 tuần','Từ đầu năm'],tk.map(t=>{const r=st[t].records,l=r.at(-1),w=r.at(-6);const c=v=>`<span style="color:${v>=0?C.green:C.red}">${sg(v)}</span>`;return [`<a href="${st[t].url}" target="_blank" rel="noopener"><b>${t}</b></a>`,nf(l[1]*1000),w?c((l[1]/w[1]-1)*100):'—',c((l[1]/base[t]-1)*100)]}));
 const last=tk.map(t=>st[t].records.at(-1)[0]).sort().at(-1);
 src($('chShipStocks'),[[D.stocks_source.name,D.stocks_source.url]],dmy(last),'Giá đóng cửa điều chỉnh, so với phiên 31/12/2025. Một tuần = 5 phiên giao dịch.');
}
})();
