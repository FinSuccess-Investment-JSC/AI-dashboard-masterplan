(() => {
  const dataset = window.HYDRO_RESERVOIRS;
  const host = document.getElementById('hydro-reservoir-chart');
  if (!host || !dataset?.monthly?.length) return;
  const reservoir = document.getElementById('hydro-reservoir');
  const metric = document.getElementById('hydro-metric');
  const status = document.getElementById('hydro-reservoir-status');
  const table = document.getElementById('hydro-reservoir-table');
  const lastDate = document.getElementById('hydro-last-date');
  if(lastDate) lastDate.textContent=dataset.last_observation.split('-').reverse().join('/');
  const srcLast=document.getElementById('src-hydro-last'); if(srcLast) srcLast.textContent=dataset.last_observation.split('-').reverse().join('/');
  const names = [...new Set(dataset.monthly.map(r => r.reservoir))].sort((a,b) => a.localeCompare(b,'vi'));
  [...new Set(dataset.monthly.map(r => r.region))].sort((a,b)=>a.localeCompare(b,'vi')).forEach(region => {
    const group=document.createElement('optgroup'); group.label=region;
    names.filter(name=>dataset.monthly.find(r=>r.reservoir===name)?.region===region).forEach(name=>group.append(new Option(name,name)));
    reservoir.append(group);
  });
  reservoir.value = names.includes('Hòa Bình') ? 'Hòa Bình' : names[0];
  const labels = {level:'Mực nước thượng lưu (m)', inflow:'Nước về hồ (m³/s)', generation:'Xả qua nhà máy (m³/s)', spill:'Xả qua tràn (m³/s)'};
  const units = {level:'m',inflow:'m³/s',generation:'m³/s',spill:'m³/s'};
  const fmt = v => v == null ? '—' : v.toLocaleString('vi-VN',{maximumFractionDigits:1});
  const avg = a => a.length ? a.reduce((x,y) => x+y,0)/a.length : null;
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function draw() {
    const name = reservoir.value, field = metric.value;
    const records = dataset.monthly.filter(r => r.reservoir === name);
    const byMonth = new Map(records.map(r => [r.month,r]));
    const years = [...new Set(records.map(r => +r.month.slice(0,4)))].sort();
    const latestYear = Math.max(...years);
    const prior = years.filter(y => y >= latestYear-5 && y < latestYear);
    const actual = Array.from({length:12},(_,i)=>byMonth.get(`${latestYear}-${String(i+1).padStart(2,'0')}`));
    const baseline = Array.from({length:12},(_,i)=>{
      const mm = String(i+1).padStart(2,'0');
      const valid = prior.map(y=>byMonth.get(`${y}-${mm}`)).filter(r=>r && r[field] != null && r.days/r.expected >= .8 && r[field+'_n']/r.expected >= .8);
      return valid.length >= 3 ? avg(valid.map(r=>r[field])) : null;
    });
    const current = actual.map(r => r && r[field] != null && r.days/r.expected >= .8 && r[field+'_n']/r.expected >= .8 ? r[field] : null);
    const older = prior.length ? prior[prior.length-1] : null;
    const previous = actual.map((_,i)=>{
      const r=byMonth.get(`${older}-${String(i+1).padStart(2,'0')}`);
      return r && r[field] != null && r.days/r.expected >= .8 && r[field+'_n']/r.expected >= .8 ? r[field] : null;
    });
    const categories=Array.from({length:12},(_,i)=>`T${String(i+1).padStart(2,'0')}`);
    const series=[{name:`${latestYear}`,color:'#2938A8',kind:'line',values:current},{name:`${older}`,color:'#59C5C8',kind:'line',values:previous},{name:`TB ${prior.join('–')}`,color:'#c29100',kind:'line',values:baseline}];
    if(window.ChartTypes) {
      const model={categories,series,unit:units[field],digits:field==='level'?1:0,zeroBase:field!=='level',aria:`${labels[field]} hồ ${name}, ${latestYear} so với ${older} và trung bình 5 năm`};
      ChartTypes.mount(host,model,()=>{ host.innerHTML=ChartTypes.render(model,'line'); });
    }
    status.textContent = `${name} · ${labels[field]} · dữ liệu đến ${dataset.last_observation} · đường nền: ${prior.length} năm ${prior.join(', ')}; chỉ vẽ tháng đủ ≥80% ngày và ≥3 năm hợp lệ.`;
    table.innerHTML='<thead><tr><th>Tháng</th><th>'+esc(String(latestYear))+'</th><th>'+esc(String(older))+'</th><th>TB 5Y</th><th>Lệch TB</th><th>Đủ ngày</th><th>Đúng 00h</th></tr></thead><tbody>'+categories.map((cat,i)=>{
      const r=actual[i], delta=current[i]!=null&&baseline[i]!=null?current[i]-baseline[i]:null;
      return `<tr><td>${cat}</td><td>${fmt(current[i])}</td><td>${fmt(previous[i])}</td><td>${fmt(baseline[i])}</td><td>${delta==null?'—':(delta>0?'+':'')+fmt(delta)}</td><td>${r?`${r.days}/${r.expected}`:'—'}</td><td>${r?`${r.exact00}/${r.days}`:'—'}</td></tr>`;
    }).join('')+'</tbody>';
  }
  reservoir.addEventListener('change',draw); metric.addEventListener('change',draw); draw();
  /* Heatmap 3 cụm × 12 tháng gần nhất: trung vị lệch của từng hồ so trung bình 5 năm cùng tháng (card dien-31). */
  const heatHost=document.getElementById('hydro-heatmap'), heatSel=document.getElementById('hydro-heat-metric');
  const CLUSTER={'Tây Bắc Bộ':'Bắc','Đông Bắc Bộ':'Bắc','Bắc Trung Bộ':'Bắc','Nam Trung Bộ':'Trung & Tây Nguyên','Tây Nguyên':'Trung & Tây Nguyên','Đông Nam Bộ':'Nam'};
  const ORDER=['Bắc','Trung & Tây Nguyên','Nam','Tất cả hồ'];
  const ok=(r,f)=>r&&r[f]!=null&&r.days/r.expected>=.8&&r[f+'_n']/r.expected>=.8;
  const median=a=>{const v=a.filter(x=>x!=null&&isFinite(x)).sort((x,y)=>x-y);return v.length?(v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2):null};
  function heat(){
    if(!heatHost) return;
    const field=heatSel?.value||'inflow', pctMode=field!=='level';
    const months=[...new Set(dataset.monthly.map(r=>r.month))].sort().slice(-12);
    const byRes=new Map(); dataset.monthly.forEach(r=>{if(!byRes.has(r.reservoir))byRes.set(r.reservoir,{region:r.region,m:new Map()});byRes.get(r.reservoir).m.set(r.month,r)});
    const dev=(res,month)=>{const cur=res.m.get(month); if(!ok(cur,field)) return null; const y=+month.slice(0,4), mm=month.slice(5);
      const base=[]; for(let k=y-5;k<y;k++){const b=res.m.get(k+'-'+mm); if(ok(b,field)) base.push(b[field]);}
      if(base.length<3) return null; const avg=base.reduce((a,b)=>a+b,0)/base.length;
      return pctMode?(avg>0?(cur[field]/avg-1)*100:null):cur[field]-avg};
    const cells={}; ORDER.forEach(c=>cells[c]=months.map(()=>[]));
    byRes.forEach((res,name)=>{const c=CLUSTER[res.region]; months.forEach((mo,i)=>{const d=dev(res,mo); if(d==null) return; if(c) cells[c][i].push(d); cells['Tất cả hồ'][i].push(d);})});
    const lim=pctMode?50:10;
    const color=v=>{if(v==null) return 'transparent'; const t=Math.max(-1,Math.min(1,v/lim)); return t>=0?`rgba(41,56,168,${0.12+0.7*t})`:`rgba(217,119,6,${0.12+0.7*(-t)})`};
    const ink=v=>v!=null&&Math.abs(v)/lim>0.55?'#fff':'#1f2937';
    const f=v=>v==null?'—':(v>0?'+':'')+v.toLocaleString('vi-VN',{maximumFractionDigits:pctMode?0:1})+(pctMode?'%':' m');
    heatHost.innerHTML='<div class="tablewrap"><table class="hydro-heat" style="border-collapse:separate;border-spacing:2px;font-size:12px;width:100%"><thead><tr><th style="text-align:left">Cụm</th>'+months.map(m=>`<th>${'T'+Number(m.slice(5))+'/'+m.slice(2,4)}</th>`).join('')+'</tr></thead><tbody>'+
      ORDER.map(c=>'<tr><td style="font-weight:650;white-space:nowrap">'+esc(c)+'</td>'+cells[c].map((arr,i)=>{const v=median(arr);return `<td title="${esc(c)} · ${months[i]} · ${arr.length} hồ hợp lệ" style="text-align:center;border-radius:6px;padding:7px 4px;background:${color(v)};color:${ink(v)};font-variant-numeric:tabular-nums">${f(v)}<br><small style="opacity:.75">${arr.length} hồ</small></td>`}).join('')+'</tr>').join('')+'</tbody></table></div>';
    const latest=cells['Bắc'].length?ORDER.slice(0,3).map(c=>[c,median(cells[c].at(-1))]).filter(x=>x[1]!=null):[];
    const card=heatHost.closest('.card'); let key=card?.querySelector('.pv-key');
    if(card&&latest.length){ if(!key){key=document.createElement('div');key.className='pv-key';card.querySelector('.chart-sub')?.after(key)}
      const worst=[...latest].sort((a,b)=>a[1]-b[1])[0];
      key.innerHTML=`<b class="${worst[1]<0?'dn':'up'}">${f(worst[1])}</b> cụm ${esc(worst[0])} tháng ${Number(months.at(-1).slice(5))}/${months.at(-1).slice(0,4)} so TB 5 năm (${pctMode?'nước về':'mực nước'}) <span>${latest.map(([c,v])=>esc(c)+' '+f(v)).join(' · ')}</span>`; }
  }
  heatSel?.addEventListener('change',heat); heat();

})();
