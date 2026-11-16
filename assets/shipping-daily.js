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
function src(host,parts,period,note){const n=el('div','source-note');n.append('Nguồn: ');parts.forEach(([t,u],i)=>{if(i)n.append(' · ');const a=el('a','',t);a.href=u;a.target='_blank';a.rel='noopener';n.append(a)});n.append(' · Kỳ cuối: '+period);host.after(n);if(note){const d=el('details','note-icon');d.innerHTML='<summary>ⓘ Lưu ý dữ liệu</summary>';d.append(el('div','',note));n.after(d)}}
function table(id,head,rows){const t=$(id);if(!t)return;t.innerHTML='<thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody>'}

// 1. BDI theo phiên
const bdi=(D.bdi?.records||[]).filter(r=>r[0]>='2026-05-01');
if(bdi.length&&$('chBdiDaily')&&window.barLineChart){
 barLineChart('chBdiDaily',{categories:bdi.map(r=>dm(r[0])),series:[{name:'BDI',color:C.navy,kind:'line',values:bdi.map(r=>r[1])}],unit:'điểm',digits:0,height:280,zeroBase:false,rotateLabels:true});
 table('tbl-bdi-daily',['Phiên','Điểm','So phiên trước'],bdi.slice().reverse().map((r,i,a)=>[dmy(r[0]),nf(r[1]),a[i+1]?sg((r[1]/a[i+1][1]-1)*100):'—']));
 src($('chBdiDaily'),[[D.bdi.source,D.bdi.url]],dmy(bdi.at(-1)[0]));
}
const sub=D.bdi_sub;
if(sub&&window.barLineChart){
 const rs=Object.entries(sub.records).filter(([d])=>d>='2026-09-01');
 [['a','BCI','#d1783f'],['b','BPI',C.teal],['c','BSI',C.gold],['d','BHSI',C.plum]].forEach(([k,f,c])=>{const id='chBdiSub'+k;if(!$(id)||!rs.length)return;
  barLineChart(id,{categories:rs.map(([d])=>dm(d)),series:[{name:f,color:c,kind:'line',values:rs.map(([,r])=>r[f])}],unit:'điểm',digits:0,height:180,zeroBase:false,rotateLabels:true});
  src($(id),[[sub.source,sub.url]],dmy(rs.at(-1)[0]),f==='BCI'&&sub.bdi_mismatch?.length?'Handybulk chép lại bản tin Baltic Exchange theo ngày. '+sub.bdi_mismatch.length+' phiên có BDI lệch với CNBC (phần lớn cuối 2025), giữ nguyên số Handybulk.':null)});
}

// 2. TCE theo tuyến — dumbbell, thang log
const tce=D.tce;
if(tce&&$('chTceRoutes')){
 const dates=[...new Set(tce.routes.flatMap(r=>r.records.map(x=>x[0])))].sort().slice(-3);
 const rows=tce.routes.map(r=>({...r,v:dates.map(d=>(r.records.find(x=>x[0]===d)||[])[1]??null)}));
 const all=rows.flatMap(r=>r.v).filter(Boolean),lo=Math.pow(10,Math.floor(Math.log10(Math.min(...all)))),hi=Math.pow(10,Math.ceil(Math.log10(Math.max(...all))));
 const W=760,L=230,R=70,rowH=30,top=34;let groups=[],y=top;rows.forEach((r,i)=>{if(!i||rows[i-1].group!==r.group){groups.push([r.group,y]);y+=22}r.y=y;y+=rowH});
 const H=y+30,X=v=>L+(Math.log10(v)-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*(W-L-R);
 const ticks=[];for(let p=lo;p<=hi;p*=10)[1,2,5].forEach(m=>{const v=p*m;if(v>=lo&&v<=hi)ticks.push(v)});
 const lab=v=>v>=1e6?nf(v/1e6,2)+' tr':nf(v/1e3)+'k';
 let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="TCE theo tuyến Baltic" style="font:12px var(--font-body,inherit)">`;
 ticks.forEach(v=>{s+=`<line x1="${X(v)}" x2="${X(v)}" y1="${top}" y2="${H-26}" stroke="currentColor" stroke-opacity=".12"/><text x="${X(v)}" y="${H-10}" text-anchor="middle" fill="currentColor" fill-opacity=".6">${lab(v)}</text>`});
 [['○',0],['●',1],['●',2]].forEach(([g,i],k)=>{const x=k*90;s+=`<circle cx="${x+6}" cy="14" r="5" fill="${i===0?'none':i===1?C.grey:C.navy}" stroke="${i===0?C.grey:'none'}"/><text x="${x+16}" y="18" fill="currentColor">${dm(dates[i])}</text>`});
 groups.forEach(([g,gy])=>{s+=`<text x="0" y="${gy+14}" font-weight="700" fill="currentColor">${g}</text>`});
 rows.forEach(r=>{const [a,b,c]=r.v,cy=r.y+14;s+=`<text x="0" y="${cy+4}" fill="currentColor"><tspan font-weight="700">${r.code}</tspan> <tspan fill-opacity=".7">${r.name}</tspan></text>`;
  if(b&&c)s+=`<line x1="${X(b)}" x2="${X(c)}" y1="${cy}" y2="${cy}" stroke="${c>=b?C.green:C.red}" stroke-width="4" stroke-linecap="round"/>`;
  if(a)s+=`<circle cx="${X(a)}" cy="${cy}" r="5" fill="none" stroke="${C.grey}" stroke-width="1.5"/>`;
  if(b)s+=`<circle cx="${X(b)}" cy="${cy}" r="5" fill="${C.grey}"/>`;
  if(c)s+=`<circle cx="${X(c)}" cy="${cy}" r="6" fill="${C.navy}"/><text x="${Math.max(X(c),X(b||c),X(a||c))+10}" y="${cy+4}" fill="currentColor" fill-opacity=".75">${lab(c)}</text>`});
 $('chTceRoutes').innerHTML=s+'</svg>';
 src($('chTceRoutes'),[[tce.source,tce.url]],dmy(dates[2]),'Mỗi mốc là thứ Sáu của bản Affinity Tanker Weekly; vạch nối hai tuần gần nhất (xanh tăng, đỏ giảm). Spot Vịnh (TD3C, TC5, TC17) rất cao vì ít tàu chịu vào; tàu VN chủ yếu nhận TC nên hưởng một phần.'+(tce.missing?' '+tce.missing:''));
}

// 3. Cổ phiếu vận tải VN
const st=D.stocks||{},tk=['PVT','VTO','VOS','VIP'].filter(t=>st[t]),col={PVT:C.navy,VTO:C.teal,VOS:'#d1783f',VIP:C.gold};
if(tk.length&&$('chShipStocks')&&window.barLineChart){
 const base={},m={};tk.forEach(t=>{const r=st[t].records;base[t]=r.find(x=>x[0]==='2025-12-31')[1];m[t]=Object.fromEntries(r)});
 const days=[...new Set(tk.flatMap(t=>st[t].records.map(x=>x[0])))].filter(d=>d>='2026-08-01').sort();
 barLineChart('chShipStocks',{categories:days.map(dm),series:tk.map(t=>({name:t,color:col[t],kind:'line',values:days.map(d=>m[t][d]!=null?(m[t][d]/base[t]-1)*100:null)})),unit:'%',digits:1,height:280,zeroBase:false,rotateLabels:true});
 table('tbl-ship-stocks',['Mã','Giá (đồng)','1 tuần','Từ đầu năm'],tk.map(t=>{const r=st[t].records,l=r.at(-1),w=r.at(-6);const c=v=>`<span style="color:${v>=0?C.green:C.red}">${sg(v)}</span>`;return [`<a href="${st[t].url}" target="_blank" rel="noopener"><b>${t}</b></a>`,nf(l[1]*1000),w?c((l[1]/w[1]-1)*100):'—',c((l[1]/base[t]-1)*100)]}));
 const last=tk.map(t=>st[t].records.at(-1)[0]).sort().at(-1);
 src($('chShipStocks'),[[D.stocks_source.name,D.stocks_source.url]],dmy(last),'Giá đóng cửa điều chỉnh, so với phiên 31/12/2025. Một tuần = 5 phiên giao dịch.');
}
})();
