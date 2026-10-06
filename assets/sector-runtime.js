/* Applies validated public data to charts and rule-based monitoring.
   No claims of live LLM inference: AI-authored interpretation lives in sector-content.js. */
(() => {
'use strict';
const power=document.body.dataset.sector==='power',oil=!power&&!!document.getElementById('chCurve'), M=window.SectorMath;
const bundle=window.SECTOR_DAILY||{sources:{}}, src=bundle.sources||{};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'chưa có';
const available=k=>Array.isArray(src[k]?.records)&&src[k].records.length>0;
const rows=k=>available(k)?src[k].records:[];
const last=k=>rows(k).at(-1);
// Freshness follows the source's own rhythm: a monthly or seasonal index is not late after two weeks.
const maxAge=k=>{const f=String(src[k]?.observation_frequency||'');return /year|annual/.test(f)?400:/quarter/.test(f)?120:/month|season/.test(f)?75:/week/.test(f)?21:14};
const stale=k=>!available(k)||src[k].status!=='ok'||(Date.now()-Date.parse(src[k].latest_observation)>maxAge(k)*86400000);
const color=['#2938A8','#59C5C8','#861C52','#c29100'];
function note(hostId,keys,method){
 const host=document.getElementById(hostId);if(!host)return;
 const block=host.closest('.card,.viz-block');
 const n=document.createElement('div');n.className='refresh-note';
 const good=keys.every(available), error=keys.some(k=>src[k]?.status==='error');
 block.dataset.refreshStatus=good?'loaded':'snapshot';block.dataset.sourceIds=keys.join(',');
 const dates=keys.map(k=>src[k]?.latest_observation).filter(Boolean);
 // Forecast series (records flagged estimate, e.g. STEO 2027E) are dated by the issue, not by their last forecast year.
 const issues=keys.filter(k=>src[k]?.records?.some(r=>r.estimate)&&src[k]?.issue).map(k=>src[k].issue);
 const through=issues.length?'Bản phát hành '+issues[0].slice(5,7)+'/'+issues[0].slice(0,4):'Dữ liệu nguồn tới '+short(dates.sort()[0]);
 n.textContent=(good?through:'Đang giữ bản chụp gốc')+(error?' · Lần lấy mới chưa thành công, giữ dữ liệu tốt gần nhất.':'.');
 if(bundle.last_run_at)n.textContent+=' Kiểm tra: '+new Date(bundle.last_run_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})+'.';
 if(keys.some(stale)){n.classList.add('is-stale');n.textContent+=' Nguồn có độ trễ hoặc đang chờ dữ liệu mới.'}
 host.after(n);
 if(method){const m=document.createElement('div');m.className='source-note method-note';m.textContent=method;n.after(m)}
 keys.forEach(k=>{if(!src[k]?.source_url)return;const a=document.createElement('a');a.href=src[k].source_url;a.target='_blank';a.rel='noopener';a.textContent=' '+(src[k].source_name||k)+' · '+k;n.append(a)});
}
function plot(id,records,series,unit,digits=1,height=250){
 if(!records.length)return;
 const host=document.getElementById(id);
 // Presentation summaries use the exact plotted series and period; no new feed.
 host.chartReadings=series.filter(([,field])=>Number.isFinite(records.at(-1)[field])).map(([name,field])=>({name,value:records.at(-1)[field],period:records.at(-1).label||records.at(-1).date,previous:records.at(-2)?.[field],previousPeriod:records.at(-2)?.label||records.at(-2)?.date}));
 barLineChart(id,{categories:records.map(r=>r.label||r.date),series:series.map(([name,field,c])=>({name,kind:'line',color:c,values:records.map(r=>r[field]??null)})),unit,digits,height,zeroBase:false,ariaLabel:document.getElementById(id)?.closest('.card,.viz-block')?.querySelector('.chart-title')?.textContent});
}
function table(id,headers,rs,fields,digits=1){fillTable(id,headers,rs.map(r=>[r.label||r.date,...fields.map(f=>nf(r[f],digits))]));}
function monthly(rs,field='value',method='mean',n=24){
 const now=new Date().toISOString().slice(0,7);
 return M.aggregate(rs,field,'month',method).slice(-n).map(r=>({...r,label:'T'+Number(r.date.slice(5))+'/'+r.date.slice(2,4)+(r.date===now?'*':'')}));
}
function showKpi(sparkId,rs,unit,reading){
 const sp=document.getElementById(sparkId),card=sp?.closest('.kpi');if(!card||!rs.length)return;
 const latest=rs.at(-1);card.querySelector('.value').textContent=nf(latest.value,sparkId==='spk-brent'?2:1);
 card.querySelector('.delta').textContent=reading;
 // Preserve source links, append the exact observation date rather than an old date.
 const sub=card.querySelector('.sub');sub.textContent=unit+' · '+short(latest.date);
 const link=document.createElement('a');link.href='https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm';link.textContent=' · EIA';link.target='_blank';link.rel='noopener';sub.append(link);
 sp.replaceChildren();sparkline(sparkId,rs.slice(-12).map(r=>r.value),color[0]);
}
function currentReading(hostId,text){
 const block=document.getElementById(hostId)?.closest('.card,.viz-block');if(!block)return;
 const n=document.createElement('div');n.className='chart-insight current-reading';n.dataset.inputOwner='rule-based';
 const label=document.createElement('b');label.textContent='Tín hiệu từ dữ liệu hiện có: ';n.append(label,text);block.append(n);
}
function archiveSummary(replacement){
 const old=document.querySelector('.hero .insight');if(!old)return;
 const archive=document.createElement('details');archive.className='summary-archive';
 const summary=document.createElement('summary');summary.textContent='Bản phân tích AI lưu ngày '+(oil?'03/09/2026':power?'06/10/2026':'17/08/2026');archive.append(summary);
 old.before(archive);archive.append(old);old.classList.remove('insight');
 const fresh=document.createElement('div');fresh.className='insight';Object.assign(fresh.dataset,{updateKind:'ai',cadence:'on-data-change',refreshStatus:'derived'});
 const title=document.createElement('b');title.textContent='Đọc nhanh từ dữ liệu: ';fresh.append(title,replacement);
 archive.before(fresh);
 const detail=document.createElement('div');detail.className='source-note';detail.textContent='Tóm tắt tự động theo quy tắc từ dữ liệu chart. Nhận định chuyên sâu do AI viết được lưu riêng theo ngày phân tích; analyst bổ sung góc nhìn riêng.';fresh.append(detail);
}
let crackRows=[];
if(oil){
 // Price charts use matching observation dates for spreads, never last-value joins.
 if(available('brent')){
  const rs=monthly(rows('brent'));plot('chBrent24',rs,[['Brent','value',color[0]]],'USD/thùng',2);table('tbl-brent24',['Tháng','USD/thùng'],rs,['value'],2);
  const ys=M.aggregate(rows('brent'),'value','year').map(r=>({...r,label:r.date+(r.date===new Date().getUTCFullYear().toString()?' YTD':'')}));
  plot('chBrentYear',ys,[['Brent bình quân','value',color[0]]],'USD/thùng',2);table('tbl-brentyear',['Năm','USD/thùng'],ys,['value'],2);
  showKpi('spk-brent',rows('brent'),'USD/thùng','Giá phiên gần nhất từ nguồn');
 }
 if(['brent','wti'].every(available)){
  const joined=M.join([rows('brent'),rows('wti')]).map(r=>({date:r.date,brent:r.values[0],wti:r.values[1],spread:r.values[0]-r.values[1]}));
  const base=monthly(joined,'brent');const w=new Map(monthly(joined,'wti').map(r=>[r.date,r.value]));
  const rs=base.map(r=>({...r,brent:r.value,wti:w.get(r.date),spread:r.value-w.get(r.date)}));
  plot('chBrentWti',rs,[['Brent','brent',color[0]],['WTI','wti',color[1]]],'USD/thùng',2);table('tbl-bw',['Tháng','Brent','WTI','Chênh lệch'],rs,['brent','wti','spread'],2);
 }
 if(['brent','gasoline','diesel'].every(available)){
  crackRows=M.cracks(rows('brent'),rows('gasoline'),rows('diesel'));
  const base=monthly(crackRows,'diesel_crack');const fields=['gasoline_crack','crack321','brent','gasoline','diesel'];
  const maps=Object.fromEntries(fields.map(f=>[f,new Map(monthly(crackRows,f).map(r=>[r.date,r.value]))]));
  const rs=base.map(r=>({...r,diesel_crack:r.value,...Object.fromEntries(fields.map(f=>[f,maps[f].get(r.date)]))}));
  plot('chCrack',rs,[['Crack diesel','diesel_crack',color[1]],['Crack xăng USGC','gasoline_crack',color[3]],['Crack 3-2-1','crack321',color[0]]],'USD/thùng');
  table('tbl-crack',['Tháng','Crack diesel','Crack xăng','Crack 3-2-1'],rs,['diesel_crack','gasoline_crack','crack321']);
  plot('chMoit',rs,[['Brent','brent',color[0]],['Xăng USGC','gasoline',color[3]],['Diesel USGC','diesel',color[1]]],'USD/thùng');
  table('tbl-moit',['Tháng','Brent','Xăng USGC','Diesel USGC','Diesel - Brent'],rs,['brent','gasoline','diesel','diesel_crack']);
  currentReading('chCrack',`Crack diesel ${nf(crackRows.at(-1).diesel_crack)} USD/thùng, xăng ${nf(crackRows.at(-1).gasoline_crack)} USD/thùng cùng ngày ${short(crackRows.at(-1).date)}. ${crackRows.at(-1).diesel_crack>crackRows.at(-1).gasoline_crack?'Diesel có phần chênh cao hơn xăng; cần kiểm tra nguồn cung và tồn kho riêng của distillate.':'Chênh diesel không vượt xăng; cần kiểm tra cơ cấu sản phẩm khi đánh giá biên nhà máy.'}`);
  showKpi('spk-crack',crackRows.map(r=>({date:r.date,value:r.diesel_crack})),'USD/thùng','Tính trên các giá cùng ngày');
 }
 if(available('singapore_cracks')){
  const daily=rows('singapore_cracks');
  const gasoil=monthly(daily,'gasoil_crack');
  const gasoline=new Map(monthly(daily,'gasoline_crack').map(r=>[r.date,r.value]));
  const rs=gasoil.map(r=>({...r,gasoil_crack:r.value,gasoline_crack:gasoline.get(r.date)}));
  plot('chSingaporeCrack',rs,[['Gasoil 10ppm – Dubai','gasoil_crack',color[1]],['Gasoline RON 92 – Dubai','gasoline_crack',color[3]]],'USD/thùng');
  table('tbl-singapore-crack',['Tháng','Gasoil – Dubai','Gasoline – Dubai'],rs,['gasoil_crack','gasoline_crack'],2);
  const point=daily.at(-1);
  currentReading('chSingaporeCrack',`Ngày ${short(point.date)}: gasoil – Dubai ${nf(point.gasoil_crack,2)}, gasoline – Dubai ${nf(point.gasoline_crack,2)} USD/thùng. Đây là chênh lệch giá khu vực, chưa phải biên của BSR.`);
 }
 note('chSingaporeCrack',['singapore_cracks'],'KNOC Opinet: lấy giá ước tính Singapore RON 92 và gasoil 0,001% cùng ngày với Dubai spot, đều USD/thùng; trừ từng ngày rồi bình quân theo tháng. Không điền giá ngày nghỉ hoặc ngày thiếu, không dùng Brent futures của KNOC thay Dubai spot. Nguồn khảo sát thứ Ba–thứ Bảy cho giá ngày T vào T+1; job kiểm hai lần/ngày.');
 if(available('opec_capacity')){
  const cap=rows('opec_capacity').map(r=>({...r,label:'T'+Number(r.date.slice(5,7))+'/'+r.date.slice(2,4)}));
  plot('chSpare',cap,[['Dư địa công suất OPEC','capacity',color[1]],['Gián đoạn ngoài kế hoạch','outages',color[2]]],'triệu thùng/ngày',2,280);
  table('tbl-spare',['Tháng','Dư địa công suất OPEC','Gián đoạn ngoài kế hoạch'],cap,['capacity','outages'],2);
  const card=document.getElementById('chSpare')?.closest('.card');
  const title=card?.querySelector('.chart-title');if(title)title.textContent=`Dư địa công suất OPEC và gián đoạn nguồn cung — đến ${short(cap.at(-1).date)}`;
  currentReading('chSpare',`Ước tính EIA cho ${short(cap.at(-1).date)}: dư địa ${nf(cap.at(-1).capacity,2)}, gián đoạn ${nf(cap.at(-1).outages,2)} triệu thùng/ngày. Số có thể được sửa trong báo cáo tháng sau.`);
 }
 if(available('world_balance')&&document.getElementById('chWorldSD')){
  // Same method as the original snapshot (3atab papr_world / patc_world, 12-month means), refreshed with each STEO issue.
  const wb=rows('world_balance'),labels=wb.map(r=>r.year+(r.estimate?'E':''));
  barLineChart('chWorldSD',{categories:labels,series:[{name:'Cung toàn cầu',color:color[2],kind:'line',values:wb.map(r=>r.supply)},{name:'Cầu toàn cầu',color:color[1],kind:'line',values:wb.map(r=>r.demand)}],unit:'mb/d',digits:2,height:250,zeroBase:false});
  if(document.getElementById('chWorldBalance'))balanceBarChart('chWorldBalance',{labels,values:wb.map(r=>r.balance),unit:'mb/d',height:230});
  fillTable('tbl-worldbalance',['Năm','Cung toàn cầu (mb/d)','Cầu toàn cầu (mb/d)','Balance: cung - cầu (mb/d)','Đọc nhanh'],wb.map((r,i)=>[labels[i],nf(r.supply,2),nf(r.demand,2),nf(r.balance,2),r.balance>=0?'Dư cung / tồn kho tăng':'Thiếu cung / tồn kho rút']));
  note('chWorldSD',['world_balance'],'EIA STEO bản '+(src.world_balance?.issue||'mới nhất')+': sheet 3atab, papr_world (cung) và patc_world (cầu), bình quân 12 tháng mỗi năm; năm có tháng dự báo ghi E. Tự cập nhật khi EIA ra bản mới.');
 }
 note('chSpare',['opec_capacity'],'EIA STEO bản '+(src.opec_capacity?.issue||'mới nhất')+': sheet 3dtab, mã cops_opec và padi_OPEC. Chỉ vẽ tháng có cả hai ước tính; tháng dự báo chưa có gián đoạn thực tế để trống.');
 if(available('middle_east_crude_exports')){
  const exports=rows('middle_east_crude_exports').slice(-30).map(r=>({...r,label:'T'+Number(r.date.slice(5,7))+'/'+r.date.slice(2,4)}));
  plot('chMiddleEastExports',exports,[['Saudi Arabia','saudi',color[0]],['Kuwait','kuwait',color[2]]],'triệu thùng/ngày',2,270);
  table('tbl-middleeast-exports',['Tháng','Saudi Arabia · mb/d','Kuwait · mb/d'],exports,['saudi','kuwait'],2);
  currentReading('chMiddleEastExports',`JODI tháng ${exports.at(-1).label}: Saudi Arabia ${nf(exports.at(-1).saudi,2)}, Kuwait ${nf(exports.at(-1).kuwait,2)} triệu thùng/ngày. Hai chuỗi này không đại diện tổng xuất khẩu Trung Đông.`);
  document.getElementById('chMiddleEastExports').dataset.qualityUnassessed=String(['saudi_assessment','kuwait_assessment'].some(field=>exports.at(-1)[field]==='3'));
 }
 note('chMiddleEastExports',['middle_east_crude_exports'],'JODI Oil: CRUDEOIL / TOTEXPSB / KBD, đổi nghìn sang triệu thùng/ngày. Chỉ giữ tháng cả Saudi Arabia và Kuwait cùng báo cáo. Nguồn thường cập nhật quanh ngày 20; job kiểm theo lịch tháng. Thiếu số không được điền bằng 0, không suy ra tổng Trung Đông. Link IEA là bối cảnh xuất khẩu dầu vùng Vịnh rộng hơn, không phải dữ liệu của hai đường chart.');
 if(available('wti_cot')){
  const cot=rows('wti_cot').slice(-104);
  plot('chCot',cot,[['Managed money · ròng','net_thousands',color[0]]],'nghìn hợp đồng',1,290);
  fillTable('tbl-cot',['Tuần kết thúc','Mua','Bán','Ròng (nghìn HĐ)'],cot.map(r=>[short(r.date),nf(r.long,0),nf(r.short,0),nf(r.net_thousands,1)]));
  const point=cot.at(-1);
  currentReading('chCot',`Kỳ ${short(point.date)}: managed money mua ${nf(point.long,0)}, bán ${nf(point.short,0)} hợp đồng; ròng ${nf(point.net_thousands,1)} nghìn hợp đồng. COT phản ánh vị thế, không đo trực tiếp cung cầu dầu.`);
 }
 note('chCot',['wti_cot'],'CFTC disaggregated futures-only, mã 067651 WTI-PHYSICAL: Managed Money Long trừ Short. Vị thế ngày thứ Ba, thường công bố thứ Sáu; job kiểm cuối tuần và đầu tuần sau nếu trễ.');
 if(available('retail_fuel')){
  const retail=rows('retail_fuel').slice(-10).map(r=>({...r,label:short(r.date)}));
  const series=[['E5 RON 92-II','e5',color[3]],['E10 RON 95-III','ron95',color[2]],['DO 0,05S-II','diesel',color[1]]];
  for(const [chart,tableId] of [['chRetailFuelMini','tbl-retailmini'],['chRetailFuel','tbl-retailfuel']]){
   plot(chart,retail,series,'đ/lít',0);
   table(tableId,['Kỳ giá','E5 RON 92-II','E10 RON 95-III','DO 0,05S-II'],retail,['e5','ron95','diesel'],0);
   const sub=document.getElementById(chart)?.closest('.card,.viz-block')?.querySelector('.chart-sub');
   if(sub)sub.textContent=`đồng/lít, Vùng 1 · ${short(retail[0].date)}–${short(retail.at(-1).date)}`;
  }
  const latest=retail.at(-1);
  if(typeof retailYears!=='undefined'){
   const years=retailYears.map((year,i)=>({label:year,e5:i===retailYears.length-1?latest.e5:retailE5Y[i],ron95:i===retailYears.length-1?latest.ron95:retailRon95Y[i],diesel:i===retailYears.length-1?latest.diesel:retailDieselY[i]}));
   plot('chRetailYear',years,series,'đ/lít',0);
   fillTable('tbl-retailyear',['Năm','E5 RON 92-II','RON95/E10 RON95-III','DO 0,05S-II','Mốc'],years.map((r,i)=>[r.label,nf(r.e5,0),nf(r.ron95,0),nf(r.diesel,0),i===years.length-1?short(latest.date):'mốc cuối năm']));
  }
  currentReading('chRetailFuelMini',`Kỳ ${short(latest.date)}: E5 ${nf(latest.e5,0)}, E10 RON 95 ${nf(latest.ron95,0)}, diesel ${nf(latest.diesel,0)} đồng/lít tại Vùng 1.`);
 }
 [['chRetailFuelMini','Thông cáo Petrolimex công bố từng kỳ; bảng giá Vùng 1 được OCR từ ảnh chính thức, kiểm đúng ba mã sản phẩm và đơn vị.'],['chRetailFuel','Thông cáo Petrolimex công bố từng kỳ; giữ 10 kỳ gần nhất.'],['chRetailYear','Các năm trước theo chuỗi CostFlow/Petrolimex; điểm 2026 là giá Petrolimex kỳ mới nhất, không phải bình quân năm.']].forEach(([id,method])=>note(id,['retail_fuel'],method));
 const priceMethod='Tải lịch sử XLS từ EIA; bỏ ngày thiếu số, không điền 0. Bình quân tháng từ các phiên có dữ liệu; dấu * là tháng hiện tại chưa đủ kỳ. Spread/crack chỉ dùng ngày có đủ các đầu vào; xăng và ULSD đổi USD/gallon × 42 rồi trừ Brent.';
 [['chBrent24',['brent']],['chBrentYear',['brent']],['chBrentWti',['brent','wti']],['chCrack',['brent','gasoline','diesel']],['chMoit',['brent','gasoline','diesel']]].forEach(([id,ks])=>note(id,ks,priceMethod));
 const stocks=[['chCrudeStock','tbl-crudestock','crude_stock','Tồn kho dầu thô','last'],['chCushing','tbl-cushing','cushing','Tồn kho Cushing','last'],['chUsProd','tbl-usprod','us_production','Sản lượng dầu Mỹ','mean']];
 stocks.forEach(([id,tbl,key,name,method])=>{if(available(key)){const rs=monthly(rows(key),'value',method,36);plot(id,rs,[[name,'value',color[2]]],key==='us_production'?'triệu thùng/ngày':'triệu thùng');table(tbl,['Tháng',name],rs,['value'])}note(id,[key],method==='last'?'Lấy số tuần cuối cùng có dữ liệu trong từng tháng; tháng hiện tại là mốc gần nhất, chưa phải cuối tháng.':'Bình quân các quan sát tuần có dữ liệu trong tháng; không phải sản lượng tháng do EIA điều tra riêng.');});
 if(['gasoline_stock','distillate_stock'].every(available)){
  const ds=monthly(rows('distillate_stock'),'value','last',36);const gs=new Map(monthly(rows('gasoline_stock'),'value','last',36).map(r=>[r.date,r.value]));const rs=ds.map(r=>({...r,dist:r.value,gas:gs.get(r.date)}));
  plot('chProdStock',rs,[['Xăng','gas',color[3]],['Distillate','dist',color[1]]],'triệu thùng');table('tbl-prodstock',['Tháng','Xăng','Distillate'],rs,['gas','dist']);
 }
 note('chProdStock',['gasoline_stock','distillate_stock'],'Dùng số tuần cuối cùng có dữ liệu trong tháng. Giữ nguyên dữ liệu thiếu.');
 if(available('distillate_stock')){
  const rs=M.aggregate(rows('distillate_stock').filter(r=>r.date.slice(5,7)==='08'),'value','year').slice(-6);
  barLineChart('chDistYear',{categories:rs.map(r=>r.date),series:[{name:'Tồn kho distillate tháng 8',color:color[1],values:rs.map(r=>r.value)}],unit:'triệu thùng',digits:1,height:240});table('tbl-distyear',['Năm','Bình quân tháng 8'],rs,['value']);
  showKpi('spk-dist',rows('distillate_stock'),'triệu thùng','Quan sát tuần gần nhất');
 }
 if(available('crude_stock'))showKpi('spk-crude',rows('crude_stock'),'triệu thùng','Quan sát tuần gần nhất');
 note('chDistYear',['distillate_stock'],'Bình quân các tuần nằm trong tháng 8 từng năm; không lấy riêng tuần cuối tháng.');
 if(available('wti_curve')){
  const rs=rows('wti_curve').map(r=>({...r,label:r.maturity,spread:r.value-rows('wti_curve')[0].value}));
  const slope=rs[0].value-rs.at(-1).value;currentReading('chCurve',`Ngày ${short(rs[0].date)}: hợp đồng ${rs[0].maturity} ở ${nf(rs[0].value,2)}, hợp đồng ${rs.at(-1).maturity} ở ${nf(rs.at(-1).value,2)} USD/thùng. Chênh gần–xa ${nf(slope,2)} USD/thùng, ${slope>0?'đường cong backwardation; phần giao gần đắt hơn giao xa':slope<0?'đường cong contango; phần giao xa đắt hơn giao gần':'đường cong gần như phẳng ở hai đầu'}.`);
  plot('chCurve',rs,[['WTI futures close','value',color[0]]],'USD/thùng',2);table('tbl-curve',['Tháng đáo hạn','USD/thùng','Chênh với kỳ gần nhất'],rs,['value','spread'],2);
 }
 note('chCurve',['wti_curve'],'Yahoo Finance, nguồn không chính thức: giá đóng cửa từng hợp đồng cùng ngày giao dịch, không ghép continuous futures thành đường cong. Nếu thiếu hợp đồng hoặc ngày không khớp, giữ nguyên đường cong đã kiểm tra trước đó.');
 // Full-date raw history, with separate short- and long-range views.
 const hz=available('hormuz')?rows('hormuz'):hzLab.map((l,i)=>({date:'2026-'+l.slice(3)+'-'+l.slice(0,2),tanker:hzTanker[i],total:hzTotal[i]}));
 const hzRolling=M.calendar(M.rolling(hz,'tanker',7));
 const host=document.getElementById('chHormuzM');const controls=document.createElement('div');controls.className='hormuz-controls';host.before(controls);
 const headline=document.createElement('div');headline.className='hormuz-headline';controls.before(headline);
 const latestHz=hzRolling.at(-1);
 headline.innerHTML=`<span><b>${nf(latestHz?.tanker,0)}</b> tàu ngày ${short(latestHz?.date)}</span><span><b>${nf(latestHz?.average,1)}</b> tàu/ngày · bình quân 7 ngày</span>`;
 const viewNote=document.createElement('div');viewNote.className='chart-sub hormuz-view-note';host.after(viewNote);
 function drawHz(days){
  const rs=days?hzRolling.slice(-days):hzRolling;
  let chartRows,series,description;
  if(days===0){
   chartRows=M.aggregate(rs,'tanker','month').map(r=>({date:r.date,label:'T'+Number(r.date.slice(5))+'/'+r.date.slice(2,4),value:r.value}));
   series=[{name:'Bình quân tháng',kind:'line',color:color[0],values:chartRows.map(r=>r.value),markers:false,strokeWidth:3}];
   description='Toàn bộ · bình quân tháng từ ngày có quan sát';
  }else if(days>90){
   chartRows=rs.filter((r,i)=>i%7===0||i===rs.length-1);
   series=[{name:'Bình quân 7 ngày',kind:'line',color:color[2],values:chartRows.map(r=>r.average),markers:false,strokeWidth:3}];
   description='1 năm · bình quân 7 ngày, lấy một mốc mỗi tuần';
  }else{
   chartRows=rs;
   series=[{name:'Tàu từng ngày',kind:'bar',color:color[1],values:rs.map(r=>r.tanker)},
           {name:'Bình quân 7 ngày',kind:'line',color:color[2],values:rs.map(r=>r.average),markers:false,strokeWidth:3}];
   description=`${days} ngày · cột ngày và đường bình quân 7 ngày`;
  }
  barLineChart('chHormuzM',{categories:chartRows.map(r=>r.label||short(r.date)),tickLabels:chartRows.map(r=>r.label||r.date.slice(8)+'/'+r.date.slice(5,7)),series,unit:'lượt/ngày',digits:0,height:270,maxLabels:7,rotateLabels:false,yGridSteps:5,ariaLabel:'Tàu chở dầu qua Hormuz'});
  host.chartReadings=[{name:'Tàu ngày gần nhất',value:latestHz?.tanker,period:latestHz?.date},{name:'Bình quân 7 ngày',value:latestHz?.average,period:latestHz?.date}];
  viewNote.textContent=description;
  table('tbl-hormuz',['Ngày','Tàu chở dầu','Tổng số tàu','Bình quân 7 ngày'],rs,['tanker','total','average']);
  controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.days)===days)));
 }
 [[30,'30 ngày'],[90,'90 ngày'],[365,'1 năm'],[0,'Toàn bộ']].forEach(([days,label])=>{const b=document.createElement('button');b.textContent=label;b.dataset.days=days;b.type='button';b.addEventListener('click',()=>drawHz(days));controls.append(b)});drawHz(30);
 const summary=host.closest('.card').querySelector('.dtable summary');if(summary)summary.textContent='Xem dữ liệu ngày theo khoảng đang chọn';
 ['chHormuzM'].forEach(id=>note(id,['hormuz'],'IMF PortWatch API: lọc portid=chokepoint6, đọc date/n_tanker/n_total và phân trang toàn bộ kết quả. Dữ liệu quan sát theo ngày, nguồn cập nhật theo đợt; job kiểm hằng ngày. Bình quân 7 ngày chỉ có khi đủ 7 ngày lịch, không thay ngày thiếu bằng 0. Khoảng 1 năm lấy một mốc BQ7 mỗi tuần; Toàn bộ là bình quân tháng của ngày có quan sát.'));
 if(available('bab_el_mandeb')){
  const bab=M.calendar(M.rolling(rows('bab_el_mandeb'),'total',7));
  const babHost=document.getElementById('chBabMandeb'),buttons=document.createElement('div');buttons.className='hormuz-controls';babHost.before(buttons);
  const headline=document.createElement('div');headline.className='hormuz-headline';buttons.before(headline);
  const latest=bab.at(-1);
  headline.innerHTML=`<span><b>${nf(latest.total,0)}</b> lượt tàu ngày ${short(latest.date)}</span><span><b>${nf(latest.tanker,0)}</b> tàu chở dầu cùng ngày</span>`;
  const viewNote=document.createElement('div');viewNote.className='chart-sub hormuz-view-note';babHost.after(viewNote);
  function drawBab(days){
   const selected=days?bab.slice(-days):bab;
   let chartRows,series,description;
   if(days===0){chartRows=M.aggregate(selected,'total','month').map(r=>({...r,label:'T'+Number(r.date.slice(5,7))+'/'+r.date.slice(2,4)}));series=[{name:'Bình quân tháng',kind:'line',color:color[2],values:chartRows.map(r=>r.value),markers:false,strokeWidth:3}];description='Toàn bộ · bình quân tháng từ ngày có quan sát';}
   else if(days>90){chartRows=selected.filter((r,i)=>i%7===0||i===selected.length-1);series=[{name:'Bình quân 7 ngày',kind:'line',color:color[2],values:chartRows.map(r=>r.average),markers:false,strokeWidth:3}];description='1 năm · bình quân 7 ngày, lấy một mốc mỗi tuần';}
   else{chartRows=selected;series=[{name:'Tổng lượt từng ngày',kind:'bar',color:color[1],values:selected.map(r=>r.total)},{name:'Bình quân 7 ngày',kind:'line',color:color[2],values:selected.map(r=>r.average),markers:false,strokeWidth:3}];description=`${days} ngày · tổng lượt và bình quân 7 ngày`;}
   barLineChart('chBabMandeb',{categories:chartRows.map(r=>r.label||short(r.date)),tickLabels:chartRows.map(r=>r.label||r.date.slice(8)+'/'+r.date.slice(5,7)),series,unit:'lượt/ngày',digits:0,height:270,maxLabels:7,rotateLabels:false,ariaLabel:'Transit calls qua eo Bab el-Mandeb'});
   babHost.chartReadings=[{name:'Tổng lượt mới nhất',value:latest.total,period:latest.date},{name:'Tàu chở dầu',value:latest.tanker,period:latest.date},{name:'Bình quân 7 ngày',value:latest.average,period:latest.date}];
   viewNote.textContent=description;
   table('tbl-bab-mandeb',['Ngày','Tổng lượt tàu','Tàu chở dầu','Bình quân 7 ngày'],selected,['total','tanker','average']);
   buttons.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.days)===days)));
  }
  [[30,'30 ngày'],[90,'90 ngày'],[365,'1 năm'],[0,'Toàn bộ']].forEach(([days,label])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.days=days;b.addEventListener('click',()=>drawBab(days));buttons.append(b)});drawBab(30);
  currentReading('chBabMandeb',`Ngày ${short(latest.date)} ghi nhận ${nf(latest.total,0)} lượt tàu qua Bab el-Mandeb, trong đó ${nf(latest.tanker,0)} tàu chở dầu; bình quân tổng lượt 7 ngày ${nf(latest.average,1)} lượt/ngày.`);
 }
 note('chBabMandeb',['bab_el_mandeb'],'IMF PortWatch API: portid=chokepoint4, n_total là tổng lượt tàu và n_tanker là số tàu chở dầu. Quan sát ngày, nguồn phát hành theo đợt; job kiểm hằng ngày. Bình quân 7 ngày chỉ tính khi đủ ngày lịch; không thay ngày thiếu bằng 0.');
 // Fix an existing negative-margin omission, without changing the underlying value.
 balanceBarChart('chBsrMargin',{labels:bsrYears,values:bsrMarginRaw,unit:'%',height:250});
 // Public-data summary keeps dated, verified facts separate from unrefreshed research.
 const points=[];
 if(last('brent'))points.push(`Brent ${nf(last('brent').value,2)} USD/thùng (${short(last('brent').date)}).`);
 if(crackRows.length){const r=crackRows.at(-1);points.push(`Crack diesel USGC ${nf(r.diesel_crack)} USD/thùng (${short(r.date)}). `+(r.diesel_crack>60?'Sản phẩm đang có phần chênh lớn so với dầu thô; cần đối chiếu tồn kho và công suất lọc dầu.':'Theo dõi độ bền của chênh lệch sản phẩm–dầu thô cùng tồn kho.'));}
 if(last('distillate_stock'))points.push(`Tồn kho distillate Mỹ ${nf(last('distillate_stock').value)} triệu thùng (${short(last('distillate_stock').date)}).`);
 const average=hzRolling.at(-1)?.average;
 if(Number.isFinite(average))currentReading('chHormuzM',`Ngày cuối ${short(hzRolling.at(-1).date)} ghi nhận ${nf(hzRolling.at(-1).tanker,0)} tàu chở dầu; bình quân 7 ngày ${nf(average)} lượt/ngày. ${average<10?'Vẫn dưới ngưỡng theo dõi 10 lượt/ngày; chưa có tín hiệu phục hồi rõ từ số lượt tàu.':'Đặt cùng xu hướng nhiều tuần để kiểm tra độ bền của phục hồi.'}`);
 if(Number.isFinite(average))points.push(`Hormuz bình quân 7 ngày ${nf(average)} tàu chở dầu/ngày tới ${short(hzRolling.at(-1).date)}. `+(average<10?'Dòng chảy quan sát được còn thấp so với ngưỡng theo dõi 10 lượt/ngày.':'Cần kiểm tra sự phục hồi có kéo dài và có đi cùng sản lượng vận chuyển.'));
 points.push('Tác động lên Việt Nam đi qua crack và khả năng vận hành ở lọc dầu, giá vốn/tồn kho ở phân phối và tiến độ dự án ở dịch vụ. Các số có ngày nguồn khác nhau; nhận định toàn cầu cần đọc cùng báo cáo tháng mới nhất.');
 if(points.length>1)archiveSummary(points.join(' '));
 const kpis=document.querySelector('.majorpane[data-tab="mt5"] .section');
 if(kpis){
  const grid=document.createElement('div');grid.className='monitor-grid';grid.id='live-watch-kpis';kpis.querySelector('.sectionhead').after(grid);
  function monitor(title,value,unit,asOf,text,keys,lo,hi){const c=document.createElement('div');c.className='monitor-item';Object.assign(c.dataset,{updateKind:'ai',cadence:'on-data-change'});const label=document.createElement('div');label.textContent=title;const v=document.createElement('strong');v.textContent=nf(value)+' '+unit;const detail=document.createElement('small');detail.textContent=short(asOf)+' · '+text+(keys.some(stale)?' · Nguồn đang trễ/cần kiểm tra mới.':'');c.append(label,v,detail);if(Number.isFinite(value)&&hi){const bar=document.createElement('progress');bar.max=hi*1.3;bar.value=Math.max(0,value);bar.setAttribute('aria-label',title);c.append(bar)}grid.append(c)}
  const cr=crackRows.at(-1);monitor('Crack diesel · theo dõi BSR/PLX',cr?.diesel_crack,'USD/thùng',cr?.date,cr?.diesel_crack>60?'Trên ngưỡng giả định 60: kiểm tra nút thắt sản phẩm.':'Chưa vượt 60 hoặc chưa có số mới.',['brent','gasoline','diesel'],0,60);
  const ds=last('distillate_stock');monitor('Tồn kho distillate Mỹ',ds?.value,'triệu thùng',ds?.date,ds?.value<100?'Dưới 100: kiểm tra stress tồn kho.':ds?.value>=115?'Từ 115: kiểm tra mức phục hồi.':'Trong vùng 100–115; theo dõi hướng thay đổi.',['distillate_stock'],100,115);
  monitor('Hormuz · dòng chảy thực tế',average,'tàu/ngày (BQ7)',hzRolling.at(-1)?.date,average<10?'Dưới 10: dòng chảy thấp.':average>=30?'Từ 30: kiểm tra phục hồi bền vững.':'Vùng 10–30: chưa xác nhận bình thường hóa.',['hormuz'],10,30);
  const caption=document.createElement('div');caption.className='source-note';caption.textContent='Theo dõi tự động từ cùng dữ liệu chart. Ngưỡng 60 / 100–115 / 10–30 là giả định của khung phân tích, không phải chuẩn thống kê hay tín hiệu giao dịch. Analyst có thể bổ sung ngưỡng riêng.';grid.after(caption);
 }
 // Existing factor map and scenarios are explicitly dated until a new AI research pass.
 document.querySelectorAll('.factor-card,.scenario,.watch-table').forEach(e=>e.dataset.analysisAsOf='2026-09-03');
 const scenarioHead=document.querySelector('.scenarios')?.previousElementSibling;
 if(scenarioHead){const stamp=document.createElement('div');stamp.className='source-note';stamp.textContent='Kịch bản AI đề xuất từ bản 03/09/2026; chưa hiệu chỉnh theo số liệu vừa tải. Ngưỡng là giả định cần theo dõi.';scenarioHead.after(stamp)}
 document.querySelectorAll('.factor-card').forEach(c=>{const n=document.createElement('small');n.className='analysis-date';n.textContent='Phân tích lưu 03/09/2026 · số mới theo bảng theo dõi';c.prepend(n)});
}
else if(power){
 // Power: EVN daily bulletins, NOAA ENSO, World Bank energy and ICE futures. A missing feed shows a gap, never an estimate.
 const pick=(...ks)=>ks.find(available);
 const label=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
 const pct=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&b?(a/b-1)*100:null;
 const signed=(v,d=1)=>Number.isFinite(v)?(v>0?'+':'')+nf(v,d):'—';
 const setKpi=(id,value,delta,cls)=>{const v=document.getElementById(id);if(v&&value)v.textContent=value;const d=document.getElementById(id+'-delta');if(d&&delta){d.textContent=delta;if(cls)d.className='delta '+cls}};
 const spark=(id,values,c)=>{const n=document.getElementById(id);if(!n||!values.length)return;n.replaceChildren();sparkline(id,values,c)};
 const gap=(id,text)=>{const host=document.getElementById(id);if(!host||host.querySelector('svg'))return;const n=document.createElement('p');n.className='data-gap';n.textContent=text;host.after(n)};
 const daily=pick('vn_power_daily');
 if(daily){
  const all=M.rolling(rows(daily).filter(r=>Number.isFinite(r.output_mkwh)),'output_mkwh',7),rs=all.slice(-120);
  barLineChart('chDaily',{categories:rs.map(r=>r.date),tickLabels:rs.map(r=>short(r.date).slice(0,5)),series:[{name:'Sản lượng ngày',kind:'line',color:color[1],markers:false,strokeWidth:1.5,values:rs.map(r=>r.output_mkwh)},{name:'Bình quân 7 ngày',kind:'line',color:color[0],markers:false,strokeWidth:2.5,values:rs.map(r=>r.average)}],unit:'triệu kWh',digits:1,height:260,zeroBase:false,maxLabels:8});
  fillTable('tbl-daily',['Ngày','Sản lượng (triệu kWh)','Bình quân 7 ngày','Pmax (MW)'],rs.slice().reverse().map(r=>[short(r.date),nf(r.output_mkwh,1),nf(r.average,1),nf(r.pmax_mw,0)]));
  note('chDaily',[daily],'Đọc từng bản tin "Thông tin chung về vận hành hệ thống điện Quốc gia" trên evn.com.vn: sản lượng sản xuất và nhập khẩu, Pmax và sản lượng từng loại nguồn. Ngày EVN không đăng bản tin để trống, không nội suy; bình quân 7 ngày chỉ tính khi đủ 7 ngày liền.');
  // 30-day mean against the same window a year earlier: a storm or holiday week does not swing the KPI.
  const byDate=new Map(all.map(r=>[r.date,r.output_mkwh])),last=all.at(-1);
  const mean30=end=>{const d=new Date(end+'T00:00:00Z'),xs=[];for(let i=0;i<30;i++){const v=byDate.get(d.toISOString().slice(0,10));if(Number.isFinite(v))xs.push(v);d.setUTCDate(d.getUTCDate()-1)}return xs.length>=27?xs.reduce((a,b)=>a+b,0)/xs.length:null};
  const ago=new Date(last.date+'T00:00:00Z');ago.setUTCFullYear(ago.getUTCFullYear()-1);
  const yoy=pct(mean30(last.date),mean30(ago.toISOString().slice(0,10)));
  setKpi('kpi-daily',nf(last.output_mkwh,1),short(last.date)+(Number.isFinite(yoy)?' · BQ 30 ngày '+signed(yoy)+'% so cùng kỳ':''),yoy>0?'d-good':'d-warn');
  spark('spk-daily',all.slice(-30).map(r=>r.output_mkwh),color[0]);
  // Months summed from complete bulletins; a month with missing days is flagged, not scaled up.
  const months=new Map();
  rows(daily).forEach(r=>{
   if(!Number.isFinite(r.output_mkwh))return;const k=r.date.slice(0,7);
   const m=months.get(k)||{date:k,days:0,output:0,pmax:null,pmax_date:null,mixDays:0,mixTotal:0,coal:0,hydro:0,gas:0,re:0,imports:0,other:0};
   m.days++;m.output+=r.output_mkwh;if(Number.isFinite(r.pmax_mw)&&(m.pmax===null||r.pmax_mw>m.pmax)){m.pmax=r.pmax_mw;m.pmax_date=r.date}
   const solar=Number.isFinite(r.solar)?r.solar:Number.isFinite(r.solar_farm)&&Number.isFinite(r.rooftop_solar)?r.solar_farm+r.rooftop_solar:null;
   const parts={coal:r.coal,hydro:r.hydro,gas:Number.isFinite(r.gas)?r.gas+(Number.isFinite(r.oil)?r.oil:0):null,re:Number.isFinite(solar)&&Number.isFinite(r.wind)?solar+r.wind:null,imports:r.imports,other:Number.isFinite(r.other)?r.other:0};
   if(Object.values(parts).every(Number.isFinite)){m.mixDays++;m.mixTotal+=r.output_mkwh;Object.entries(parts).forEach(([key,v])=>m[key]+=v)}
   months.set(k,m);
  });
  const today=new Date().toISOString().slice(0,7);
  const ms=[...months.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(m=>{const [y,mo]=m.date.split('-').map(Number);const full=new Date(Date.UTC(y,mo,0)).getUTCDate();return {...m,complete:m.days===full&&m.date<today,label:label(m.date)+(m.days===full&&m.date<today?'':'*')}});
  const mix=ms.filter(m=>m.mixDays).slice(-24).map(m=>({...m,label:label(m.date)+(m.date<today&&m.mixDays>=0.9*Number(new Date(Date.UTC(+m.date.slice(0,4),+m.date.slice(5,7),0)).getUTCDate())?'':'*'),coal_s:m.coal/m.mixTotal*100,hydro_s:m.hydro/m.mixTotal*100,gas_s:m.gas/m.mixTotal*100,re_s:m.re/m.mixTotal*100,imports_s:m.imports/m.mixTotal*100}));
  if(mix.length){
   plot('chMixShare',mix,[['Nhiệt điện than','coal_s',color[0]],['Thủy điện','hydro_s',color[1]],['NLTT (gió, mặt trời)','re_s',color[3]],['Khí & dầu','gas_s',color[2]],['Nhập khẩu','imports_s','#6b7686']],'%',1,280);
   fillTable('tbl-mix',['Tháng','Than %','Thủy điện %','NLTT %','Khí & dầu %','Nhập khẩu %','Ngày có số'],mix.slice().reverse().map(m=>[m.label,...['coal_s','hydro_s','re_s','gas_s','imports_s'].map(f=>nf(m[f],1)),String(m.mixDays)]));
   note('chMixShare',[daily],'Cộng sản lượng từng loại nguồn của các ngày có đủ thành phần, chia cho tổng sản lượng của chính các ngày đó. Điện mặt trời mái nhà là số EVN ước tính (thương phẩm).');
  }
  // Monthly totals are sums of the daily bulletins (checked against EVN's monthly releases within 0.5%).
  const shown=ms.filter(m=>m.date<today).slice(-24).map(m=>{const prev=ms.find(x=>x.date===String(Number(m.date.slice(0,4))-1)+m.date.slice(4));return {...m,value:m.output/1000,yoy:m.complete&&prev?.complete?pct(m.output,prev.output):null}});
  barLineChart('chMonthly',{categories:shown.map(m=>m.label),series:[{name:'Sản lượng tháng',kind:'bar',color:color[0],values:shown.map(m=>m.value)}],unit:'tỷ kWh',digits:2,height:260});
  fillTable('tbl-monthly',['Tháng','Tỷ kWh','So cùng kỳ','Số ngày có bản tin'],shown.slice().reverse().map(m=>[m.label,nf(m.value,2),Number.isFinite(m.yoy)?signed(m.yoy)+'%':'—',String(m.days)]));
  note('chMonthly',[daily],'Cộng sản lượng các bản tin ngày trong tháng; * = tháng chưa đủ ngày (EVN không đăng bản tin hoặc bản tin bị loại vì sai số). So cùng kỳ chỉ tính khi cả hai tháng đủ ngày.');
  const pm=ms.filter(m=>Number.isFinite(m.pmax)).slice(-24);
  barLineChart('chPmax',{categories:pm.map(m=>m.label),series:[{name:'Pmax tháng',kind:'line',color:color[2],values:pm.map(m=>m.pmax)}],unit:'MW',digits:0,height:250,zeroBase:false});
  fillTable('tbl-pmax',['Tháng','Pmax (MW)','Ngày đạt'],pm.slice().reverse().map(m=>[m.label,nf(m.pmax,0),short(m.pmax_date)]));
  note('chPmax',[daily],'Pmax cao nhất trong các bản tin ngày của tháng; tháng thiếu bản tin có thể bỏ sót đỉnh thật (*).');
  const year=last.date.slice(0,4),ytd=ms.filter(m=>m.date.startsWith(year)&&Number.isFinite(m.pmax)).sort((a,b)=>b.pmax-a.pmax)[0];
  if(ytd){setKpi('kpi-pmax',nf(ytd.pmax,0),'cao nhất '+year+' · ngày '+short(ytd.pmax_date));spark('spk-pmax',pm.slice(-12).map(m=>m.pmax),color[2])}
 }else['chDaily','chMixShare','chMonthly','chPmax'].forEach(id=>gap(id,'Chưa tải được bản tin vận hành EVN. Không thay bằng số ước tính.'));
 const oni=pick('enso_oni');
 if(oni){
  const rs=rows(oni).filter(r=>r.year>=2010&&Number.isFinite(r.oni)),last=rs.at(-1);
  balanceBarChart('chEnso',{labels:rs.map(r=>r.season+' '+r.year),values:rs.map(r=>r.oni),unit:'°C',height:260,name:'ONI',colors:[color[2],color[0]],labelEvery:24,digits:2});
  fillTable('tbl-enso',['Mùa (3 tháng)','ONI (°C)'],rs.slice(-36).reverse().map(r=>[r.season+' '+r.year,signed(r.oni,2)]));
  note('chEnso',[oni],'NOAA CPC oni.ascii.txt: nhiệt độ mặt biển Niño 3.4 trung bình 3 tháng trừ trung bình nền trượt 30 năm. Ngưỡng ±0,5 °C theo định nghĩa của NOAA; NOAA chỉ công bố một đợt El Niño/La Niña khi ngưỡng giữ đủ 5 mùa liên tiếp.');
  const state=last.oni>=0.5?'El Niño':last.oni<=-0.5?'La Niña':'trung tính';
  setKpi('kpi-oni',signed(last.oni,2),last.season+' '+last.year+' · '+state,state==='trung tính'?'d-good':'d-warn');
  spark('spk-oni',rs.slice(-12).map(r=>r.oni),color[2]);
 }else gap('chEnso','Chưa tải được ONI của NOAA.');
 const nino=pick('nino34_weekly');
 if(nino){
  const rs=rows(nino).filter(r=>Number.isFinite(r.ssta)).slice(-104);
  barLineChart('chNino34',{categories:rs.map(r=>r.date),tickLabels:rs.map(r=>short(r.date)),series:[{name:'Niño 3.4',kind:'line',color:color[2],markers:false,values:rs.map(r=>r.ssta)}],unit:'°C',digits:2,height:250,zeroBase:false,maxLabels:8});
  fillTable('tbl-nino34',['Tuần (ngày giữa tuần)','Chênh nhiệt độ (°C)'],rs.slice(-26).reverse().map(r=>[short(r.date),signed(r.ssta,2)]));
  note('chNino34',[nino],'NOAA CPC wksst9120.for: nhiệt độ mặt biển tuần vùng Niño 3.4 (OISST), chênh so trung bình 1991–2020. 104 tuần gần nhất.');
 }else gap('chNino34','Chưa tải được chuỗi tuần Niño 3.4.');
 const wb=pick('wb_energy','wb_energy_monthly');
 if(wb){
  const rs=rows(wb).slice(-36).map(r=>({...r,label:label(r.date)}));
  plot('chCoalM',rs,[['Than Australia (Newcastle)','coal_au',color[0]],['Than Nam Phi','coal_za',color[3]]],'USD/tấn',1,250);
  table('tbl-coalm',['Tháng','Australia','Nam Phi'],rs.slice().reverse(),['coal_au','coal_za'],1);
  note('chCoalM',[wb],'Tải file CMO-Historical-Data-Monthly.xlsx của World Bank; chọn đúng cột và đơn vị USD/tấn. Giá bình quân tháng; bộ tải kiểm hằng ngày và chỉ thay số khi World Bank phát hành file mới (đầu tháng).');
  plot('chGasM',rs,[['LNG Nhật Bản','lng_japan',color[0]],['Khí châu Âu (TTF)','gas_europe',color[2]],['Khí Mỹ (Henry Hub)','gas_us',color[1]]],'USD/MMBtu',2,250);
  table('tbl-gasm',['Tháng','LNG Nhật Bản','Khí châu Âu','Khí Mỹ'],rs.slice().reverse(),['lng_japan','gas_europe','gas_us'],2);
  note('chGasM',[wb],'Cùng file Pink Sheet; USD/MMBtu. LNG Nhật Bản là giá nhập khẩu CIF bình quân, phần lớn theo hợp đồng dài hạn gắn giá dầu.');
 }else['chCoalM','chGasM'].forEach(id=>gap(id,'Chưa tải được World Bank Pink Sheet.'));
 const coal=pick('coal_newcastle');
 if(coal){
  const rs=rows(coal),last=rs.at(-1),cut=new Date(Date.parse(last.date)-30*86400000).toISOString().slice(0,10),prev=rs.filter(r=>r.date<=cut).at(-1);
  setKpi('kpi-coal',nf(last.value,1),short(last.date)+(prev?' · '+signed(pct(last.value,prev.value))+'% so 1 tháng':''));
  spark('spk-coal',rs.slice(-30).map(r=>r.value),color[0]);
 }
}
else if(!power){
 if(available('sugar_vn_balance')&&document.getElementById('chSupplyDemand')){
  // USDA PSD Vietnam (same series as the original snapshot), refreshed when USDA revises PSD.
  const vb=rows('sugar_vn_balance'),thisYear=new Date().getFullYear();
  const my=r=>String(r.market_year).slice(2)+'/'+String(r.market_year+1).slice(2);
  const tag=r=>r.market_year>=thisYear?' (dự báo)':r.market_year===thisYear-1?' (ước tính)':'';
  const labels=vb.map(r=>my(r)+(r.market_year>=thisYear-1?'*':'')),full=vb.map(r=>r.market_year+'/'+String(r.market_year+1).slice(2)+tag(r));
  barLineChart('chSupplyDemand',{categories:labels,series:[{name:'Sản lượng đường',color:color[0],values:vb.map(r=>r.production)},{name:'Tiêu thụ nội địa',color:color[1],kind:'line',values:vb.map(r=>r.consumption)}],unit:'nghìn tấn',digits:0,height:260});
  fillTable('tbl-supdem',['Niên vụ','Sản lượng (nghìn tấn)','Tiêu thụ (nghìn tấn)'],vb.map((r,i)=>[full[i],nf(r.production,0),nf(r.consumption,0)]));
  if(document.getElementById('chStocks')){barLineChart('chStocks',{categories:labels,series:[{name:'Tồn kho cuối vụ',color:color[2],values:vb.map(r=>r.end_stock)}],unit:'nghìn tấn',digits:0,height:250});fillTable('tbl-stocks',['Niên vụ','Tồn kho cuối vụ (nghìn tấn)'],vb.map((r,i)=>[full[i],nf(r.end_stock,0)]));}
  if(document.getElementById('chImports')){barLineChart('chImports',{categories:labels,series:[{name:'Nhập khẩu',color:color[0],values:vb.map(r=>r.imports)}],unit:'nghìn tấn',digits:0,height:250});fillTable('tbl-imports',['Niên vụ','Nhập khẩu (nghìn tấn)'],vb.map((r,i)=>[full[i],nf(r.imports,0)]));}
  note('chSupplyDemand',['sugar_vn_balance'],'USDA FAS PSD, Việt Nam, đường ly tâm (0612000), nghìn tấn giá trị thô; * = niên vụ ước tính hoặc dự báo của USDA. Tự cập nhật khi USDA sửa số PSD.');
 }
 // Base snapshot monitoring. sector-layout.js applies validated Sugar feeds when available.
 const section=document.querySelector('.majorpane[data-tab="mt5"] .section');
 if(section){
  const grid=document.createElement('div');grid.className='monitor-grid';
  const items=[['Giá đường quốc tế',nf(worldRecentValues.at(-1),2)+' USD/kg','Pink Sheet · nguồn tháng · bản đang có T7/2026','https://www.worldbank.org/en/research/commodity-markets','Giảm kéo dài có thể gây áp lực giá nhập quy đổi; theo dõi với giá đường nội địa.'],['Tồn kho cuối vụ','426 nghìn tấn','USDA · 2 lần/năm (T5, T11) · 2025/26E','https://esmis.nal.usda.gov/publication/sugar-world-markets-and-trade','Cần đọc tồn kho/tiêu thụ và revision cùng niên vụ, không chờ một chuỗi tồn kho tháng chưa có.'],['HFCS nhập khẩu',nf(hfcsVals[4],1)+' nghìn tấn','Số 2024 · công bố không đều','https://www.vienmiaduong.vn/','AI theo dõi báo cáo mới; không so thẳng số 7 tháng với cả năm.']];
  items.forEach(([title,value,date,url,reading])=>{const c=document.createElement('div');c.className='monitor-item';Object.assign(c.dataset,{updateKind:'ai',cadence:'on-data-change'});const name=document.createElement('div');name.textContent=title;const v=document.createElement('strong');v.textContent=value;const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent=date;const p=document.createElement('small');p.textContent=reading;c.append(name,v,a,p);grid.append(c)});
  section.querySelector('.sectionhead').after(grid);
  const hint=document.createElement('div');hint.className='source-note';hint.textContent='Giá World Bank cập nhật từ bộ tải khi có nguồn mới; tồn kho và HFCS giữ đúng kỳ bản chụp ghi trên thẻ. AI hỗ trợ xác định biến cần theo dõi và đọc thay đổi, analyst bổ sung quan điểm riêng.';grid.after(hint);
 }
}
window.SECTOR_RUNTIME={available,crackRows,loaded:oil,sourceStatus:src};
})();
