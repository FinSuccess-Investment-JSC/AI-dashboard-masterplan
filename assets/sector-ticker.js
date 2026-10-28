/* Sector factor ticker: a running strip of the inputs that move each sector, built from data already on the page. */
(() => {
'use strict';
const sector=document.body.dataset.sector,src=window.SECTOR_DAILY?.sources||{};
const num=(v,n=2)=>v.toLocaleString('vi-VN',{maximumFractionDigits:n,minimumFractionDigits:Math.min(n,v>=1000?0:n)});
const day=d=>d?d.slice(8,10)+'/'+d.slice(5,7):'';
// Last two records of a series, read through a field picker.
const pair=(key,pick=r=>r.value)=>{const rs=(src[key]?.records||[]).filter(r=>Number.isFinite(pick(r)));return rs.length?{now:pick(rs.at(-1)),prev:rs.length>1?pick(rs.at(-2)):null,date:rs.at(-1).date,url:src[key].source_url}:null};
const CONFIG={
 power:[
  ['Than Newcastle','coal_newcastle',null,'USD/t',2],
  ['LNG JKM','lng_jkm',null,'USD/MMBtu',2],
  ['Henry Hub','henry_hub',null,'USD/MMBtu',2],
  ['Brent','brent_futures',null,'USD/thùng',2],
  ['Sản lượng HT','vn_power_daily',r=>r.output_mkwh,'tr kWh',1],
  ['Pmax ngày','vn_power_daily',r=>r.pmax_mw,'MW',0],
  ['Tỷ trọng than','vn_power_daily',r=>r.coal&&r.output_mkwh?r.coal/r.output_mkwh*100:NaN,'%',1,true],
  ['Tỷ trọng thủy điện','vn_power_daily',r=>r.hydro&&r.output_mkwh?r.hydro/r.output_mkwh*100:NaN,'%',1,true],
  ['Gió + mặt trời','vn_power_daily',r=>(r.wind||0)+(r.solar_farm||0)+(r.rooftop_solar||0)||NaN,'tr kWh',1],
  ['Than Úc (WB)','wb_energy_monthly',r=>r.coal_au,'USD/t',1],
  ['ONI · El Niño','enso_oni',r=>r.oni,'°C',2,true]
 ]
};
const rows=(CONFIG[sector]||[]).map(([label,key,pick,unit,dp,points])=>{const p=pair(key,pick||undefined);return p&&{label,unit,dp,points,...p}}).filter(Boolean);
if(rows.length<3)return;
const item=r=>{
 const a=document.createElement('a');a.className='ticker-item';a.href=r.url||'#';a.target='_blank';a.rel='noopener';a.title=`${r.label}: ${num(r.now,r.dp)} ${r.unit} · kỳ ${day(r.date)}`;
 let delta='—',cls='flat';
 if(r.prev!=null&&r.prev!==0){const d=r.points?r.now-r.prev:(r.now/r.prev-1)*100;if(Math.abs(d)>=.005){cls=d>0?'up':'down';delta=`${d>0?'▲':'▼'} ${d>0?'+':''}${num(d,2)}${r.points?'':'%'}`}}
 a.innerHTML=`<b>${r.label}</b><span class="tv">${num(r.now,r.dp)}</span><span class="tu">${r.unit}</span><span class="td ${cls}">${delta}</span>`;
 return a;
};
const bar=document.createElement('div');bar.className='sector-ticker';bar.setAttribute('role','region');bar.setAttribute('aria-label','Yếu tố ngành, cập nhật theo kỳ dữ liệu gần nhất');
const track=document.createElement('div');track.className='ticker-track';
for(let i=0;i<2;i++){const g=document.createElement('div');g.className='ticker-group';if(i)g.setAttribute('aria-hidden','true');rows.forEach(r=>g.append(item(r)));track.append(g)}
track.style.setProperty('--ticker-dur',Math.max(30,rows.length*5)+'s');
bar.append(track);
const tabs=document.querySelector('.majortabs');tabs?tabs.before(bar):document.querySelector('.fiscbar')?.after(bar);
})();
