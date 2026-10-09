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
  const collectorStatus = document.getElementById('hydro-collector-status');
  if(collectorStatus && dataset.last_observation > '2026-08-27') collectorStatus.textContent='job lấy mẫu 00h đã có quan sát mới; ngày thiếu vẫn để trống';
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
})();
