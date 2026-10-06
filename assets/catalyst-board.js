/* Progressive Catalyst/Risk layout. Reuses dated monitor outputs and source
   blocks; does not overwrite provider data, original research or analyst notes. */
(() => {
  'use strict';
  const pane=document.querySelector('.majorpane[data-tab="mt5"]');if(!pane)return;
  const bank=document.body.dataset.sector==='bank',power=document.body.dataset.sector==='power',oil=!power&&!!document.getElementById('chCurve');
  const sector=bank?'bank':power?'power':oil?'oil':'sugar';
  const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n};
  const num=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
  const date=v=>/^\d{4}-\d{2}-\d{2}/.test(v||'')?v.slice(8,10)+'/'+v.slice(5,7)+'/'+v.slice(0,4):v||'Chưa có kỳ';
  const original=[...pane.children];
  const monitors=[...pane.querySelectorAll('.monitor-item')];
  const oldScenarios=[...pane.querySelectorAll('.scenario')];
  const W=window.BANK_WI_DATA,feeds=window.SECTOR_DAILY?.sources||{};
  const board=make('section','thesis-board');board.id='thesis-board';
  const heading=make('div','thesis-heading');heading.append(make('h2','','Catalyst / Risk'),make('p','','Điều gì cần theo dõi, tác động tới đâu và khi nào cần đổi đánh giá?'));board.append(heading);
  function keys(buttons,select){buttons.forEach((b,i)=>b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:buttons.length-1))%buttons.length;select(j);buttons[j].focus()}))}
  const signals=make('div','thesis-view');signals.id='thesis-signals';board.append(signals);
  const stamp=bank?'11/09/2026':power?'06/10/2026':oil?'03/09/2026':'17/08/2026';
  // One page: signals first, then original KPI table and the dated AI analysis under clear folds.
  const fold=(id,title,note)=>{const d=make('details','thesis-fold');d.id=id;const s=make('summary','',title);d.append(s);const body=make('div','thesis-fold-body');if(note)body.append(make('p','thesis-notice',note));d.append(body);return {d,body}};
  const kpi=fold('thesis-evidence','Bảng KPI & ngưỡng theo dõi');
  const archive=fold('thesis-archive','Phân tích AI ngày '+stamp+' · bản gốc, chưa cập nhật theo số mới','Các câu “hiện tại” và mốc giá trong bản này thuộc ngày '+stamp+'.');
  const evidence=kpi.body,archiveBody=archive.body;
  const charts=make('section','thesis-data');
  // Retain complete old DOM (including listeners/IDs); source chips move to Sources later.
  if(bank){
    original.forEach(n=>{if(n.matches('.analyst-input'))return;if(n.matches('[data-blocks="5"]'))charts.append(n);else if(n.matches('#catalyst-watch'))evidence.append(n);else archiveBody.append(n)});
  }else{
    const main=original.find(n=>n.matches('.section'));
    if(main)[...main.children].forEach(n=>{if(n.matches('.analyst-input'))return;if(n.matches('.srcrow')){n.classList.add('thesis-source-row');archiveBody.append(n);return}((n.matches('.monitor-grid,.focus-card')||n.querySelector('.watch-table'))?evidence:archiveBody).append(n)});
    original.filter(n=>n!==main).forEach(n=>archiveBody.append(n));
    if(main){[...main.children].forEach(n=>pane.append(n));main.remove()}
  }
  if(charts.children.length){charts.prepend(make('h3','','Dữ liệu theo dõi'));board.append(charts)}
  if(evidence.children.length){if(evidence.querySelector('.data-gap,.gap-row'))kpi.d.open=true;board.append(kpi.d)}
  if(archiveBody.children.length>1){if(archiveBody.querySelector('.data-gap,.gap-row'))archive.d.open=true;board.append(archive.d)}
  pane.prepend(board);pane.classList.add('has-thesis-board');
  // Evidence navigation reveals the existing chart in its real scope/tab.
  function reveal(id){
    const target=document.getElementById(id);if(!target)return;
    const topic=target.closest('.research-topic');if(topic?.hidden){document.querySelector('.research-toolbar button:nth-child('+(topic.dataset.lifecycle==='archived'?'2':'1')+')')?.click()}
    let parent=target.parentElement;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement}

    if(board.contains(target)){target.scrollIntoView({block:'start',behavior:'smooth'});return}
    const major=target.closest('.majorpane');
    if(major){const button=[...document.querySelectorAll('.majortabbtn')].find(b=>b.dataset.tab===major.dataset.tab)||document.querySelectorAll('.majortabbtn')[Number(major.dataset.tab.slice(2))-1];button?.click()}
    const geo=target.closest('.supply-pane');if(geo?.hidden)document.querySelector(`[aria-controls="${geo.id}"]`)?.click();
    const bankGeo=target.closest('#geo-pane-vn,#geo-pane-world');if(bankGeo?.hidden)document.querySelector(`[aria-controls="${bankGeo.id}"]`)?.click();
    const inventory=target.closest('.inventory-group>.card');if(inventory?.hidden)document.querySelector(`[aria-controls="${inventory.id}"]`)?.click();
    requestAnimationFrame(()=>{target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'smooth'})});
  }
  const item=(title,metric,period,status,impact,condition,limit,links,groups)=>({title,metric,period,status,impact,condition,limit,links,groups});
  const fromMonitor=(i)=>{const m=monitors[i];return {value:m?.querySelector('strong')?.textContent||'—',period:m?.querySelector('small')?.textContent.split(' · ')[0]||'Chưa có kỳ'}};
  let rows=[];
  if(oil){
    const cr=fromMonitor(0),stock=fromMonitor(1),hz=fromMonitor(2);
    rows=[
      item('Dòng chảy Hormuz',hz.value,hz.period,'Theo dõi','Nguồn nguyên liệu lọc dầu và chi phí nhập hàng.','BQ7 phục hồi trên 30 lượt/ngày; đối chiếu độ bền của phục hồi.','Lượt tàu AIS, không phải thùng dầu.',[['chHormuzM','Dòng chảy ngày & BQ7']],['refining','distribution','gas']),
      item('Crack & tồn kho sản phẩm',cr.value+' · '+stock.value,cr.period+' / tồn kho '+stock.period,'Theo dõi','Biên lọc dầu BSR; giá vốn và tồn kho của phân phối.','Crack dưới 60 USD/thùng trong một tháng; distillate trở lại vùng 115–120 triệu thùng.','Proxy USGC, chưa phải biên nhà máy Việt Nam.',[['chCrack','Crack'],['chProdStock','Tồn kho sản phẩm']],['refining','distribution']),
      item('Cân bằng cung–cầu','Dự báo tháng cần rà soát','Bản phân tích '+stamp,'Chờ cập nhật','Giá bán khai thác, nhu cầu và mặt bằng giá đầu vào.','Các nguồn cùng điều chỉnh triển vọng cầu hoặc tốc độ phục hồi cung.','Chưa có revision mới trong tab này.',[['chWorldSD','Cân bằng toàn cầu'],['chWorldBalance','Cung trừ cầu']],['upstream','gas','refining','distribution']),
      item('Dự án & hợp đồng','Chưa có chuỗi FID / backlog mới','Theo CBTT từng doanh nghiệp','Thiếu dữ liệu','Khối lượng công việc PVD/PVS; sản lượng khí và khai thác.','FID, hợp đồng hoặc tiến độ được công bố; kiểm độ trễ ghi nhận.','Chính sách và kế hoạch chưa đồng nghĩa doanh thu.',[['chVnUpstream','Sản lượng Việt Nam'],['chGasVol','Khí & LNG']],['upstream','services','gas'])
    ];
    // Never turn a missing/stale feed into a favourable signal.
    [[0,['hormuz']],[1,['brent','gasoline','diesel','distillate_stock']]].forEach(([i,ids])=>{if(ids.some(k=>!feeds[k]?.records?.length)){rows[i].status='Thiếu dữ liệu';rows[i].metric='—'}else if(ids.some(k=>feeds[k].status!=='ok'||Date.now()-Date.parse(feeds[k].latest_observation)>14*86400000)){rows[i].status='Chờ cập nhật'}});
  }else if(power){
    const last=k=>feeds[k]?.records?.at(-1),oni=last('enso_oni'),wbk=['wb_energy','wb_energy_monthly'].find(k=>feeds[k]?.records?.length),wb=wbk&&last(wbk);
    const coal=last('coal_newcastle'),lng=last('lng_jkm'),day=last('vn_power_daily');
    const coalText=coal?num(coal.value,1)+' USD/tấn':wb&&Number.isFinite(wb.coal_au)?num(wb.coal_au,1)+' USD/tấn (WB)':'—';
    const lngText=lng?num(lng.value,2)+' USD/MMBtu':wb&&Number.isFinite(wb.lng_japan)?num(wb.lng_japan,2)+' USD/MMBtu (WB)':'';
    rows=[
      item('Thủy văn & El Niño',oni?'ONI '+(oni.oni>0?'+':'')+num(oni.oni,2)+' °C':'—',oni?'NOAA · mùa '+oni.season+' '+oni.year:'Chưa có kỳ','Theo dõi','Sản lượng thủy điện mùa khô; tỷ trọng huy động than, khí.','ONI về dưới +0,5 °C (hết El Niño) hoặc nước về hồ mùa khô 2026–27 thấp hơn trung bình nhiều năm.','ONI là chỉ số toàn cầu, chưa phải lưu lượng về hồ; số hồ chứa EVN chỉ mở được trong nước.',[['chEnso','ONI'],['chMixShare','Cơ cấu huy động']],['hydro','thermal']),
      item('Giá than & LNG',coalText+(lngText?' · '+lngText:''),coal?'ICE · '+date(coal.date):wb?'World Bank · '+wb.date.slice(0,7):'Chưa có kỳ','Theo dõi','Chi phí biến đổi nhiệt điện than, khí; giá mua điện bình quân của EVN.','Giá than hoặc LNG đổi hướng và giữ chênh ≥15% so trung bình 3 tháng.','Giá quốc tế, chưa phải giá than TKV hay khí trong nước bán cho nhà máy.',[['chFastPrice','Futures ngày'],['chCoalM','Than tháng'],['chGasM','Khí & LNG tháng']],['thermal']),
      item('Giá bán lẻ & tài chính EVN','2.204,07 đ/kWh','Áp dụng từ 10/05/2025','Theo dõi','Khả năng thanh toán tiền điện cho nhà máy; dòng tiền IPP.','Có quyết định điều chỉnh giá bán lẻ hoặc EVN công bố kết quả tài chính năm.','Chính phủ yêu cầu không tăng giá điện (03/10/2026).',[['chTariff','Giá bán lẻ bình quân'],['chEvnLoss','Lỗ lũy kế EVN']],['thermal','hydro','re']),
      item('Phụ tải & huy động',day?num(day.output_mkwh,1)+' triệu kWh/ngày':'—',day?'EVN · '+date(day.date):'Chưa có kỳ','Theo dõi','Sản lượng phát của nhà máy; nhu cầu đầu tư nguồn, lưới.','Tăng trưởng sản lượng lũy kế năm lệch ≥2 điểm % so kế hoạch EVN.','Bản tin ngày của EVN; chưa có giá thị trường điện SMP (trang NSMO chỉ mở trong nước).',[['chDaily','Sản lượng ngày'],['chMonthly','Sản lượng tháng']],['thermal','hydro','re','grid'])
    ];
    [[0,['enso_oni'],62],[1,['coal_newcastle','lng_jkm',wbk].filter(Boolean),45],[3,['vn_power_daily'],7]].forEach(([i,ids,days])=>{const live=ids.filter(k=>feeds[k]?.records?.length);if(!live.length){rows[i].status='Thiếu dữ liệu';rows[i].metric='—'}else if(live.every(k=>feeds[k].status!=='ok'||Date.now()-Date.parse(feeds[k].latest_observation)>days*86400000)){rows[i].status='Chờ cập nhật'}});
  }else if(!bank){
    const wb=feeds.sugar_monthly,last=wb?.records?.at(-1),stock=monitors[1]?.querySelector('strong')?.textContent||'—',hfcs=monitors[2]?.querySelector('strong')?.textContent||'—';
    rows=[
      item('Áp lực tồn kho',stock,'2025/26E · bản lưu '+stamp,'Theo dõi','Khả năng tăng giá bán và tốc độ giải phóng hàng.','Tồn kho/tiêu thụ giảm qua các kỳ công bố cùng niên vụ.','Ước tính cuối niên vụ; chưa có chuỗi tồn kho tháng.',[['chStocks','Tồn kho'],['chSupplyDemand','Cân đối Việt Nam']],['cane','import']),
      item('Giá bán & nguyên liệu',last?num(last.value,2)+' USD/kg':'—',last?'World Bank · '+last.date.slice(0,7):'Chưa có kỳ','Chưa đủ số','Biên phụ thuộc giá bán, giá mía hoặc chi phí đường thô nhập.','Giá bán cải thiện so chi phí đầu vào trên dữ liệu cùng kỳ.','Giá thế giới chưa phải spread của nhà máy; chưa đủ giá bán–mía cùng kỳ.',[['chVnPrice','Giá bán trong nước'],['chCanePrice','Giá mía'],['chWorldRecent','Giá thế giới']],['cane','import']),
      item('Nhập khẩu & chất thay thế',hfcs,'HFCS 2024 · bản lưu '+stamp,'Chờ cập nhật','Áp lực cạnh tranh tại khách hàng công nghiệp.','Có số nhập khẩu mới cùng kỳ và bằng chứng thay đổi giá cạnh tranh.','HFCS 7T không so trực tiếp cả năm; đường lậu là ước tính.',[['chImports','Nhập khẩu'],['chHfcs','HFCS'],['chSmuggled','Ước tính đường lậu']],['cane','import']),
      item('Bảo hộ & thực thi','Cần đối chiếu văn bản hiệu lực','Theo sự kiện','Chưa xác minh','Mức bảo hộ và thực thi ảnh hưởng giá nhập quy đổi.','Xác minh phạm vi, mức thuế và kết quả thực thi trong công bố mới.','Mức thuế lịch sử chưa xác nhận là mức đang áp dụng.',[['chPolicyTax','Mốc thuế & giới hạn'],['chPolicyQuota','Hạn ngạch']],['cane','import'])
    ];
  }else{
    const defs=[
      [0,'Huy động & thanh khoản','Giá vốn và khả năng tài trợ tăng trưởng.',[['bank-funding','Huy động'],['bank-omo','OMO'],['bank-fx','Tỷ giá']]],
      [1,'NIM & giá vốn','Thu nhập lãi và tốc độ điều chỉnh lãi suất.',[['bank-bank-ratios','NIM'],['bank-yield-funding','Yield & giá vốn'],['bank-deposit-rates','Lãi huy động']]],
      [2,'Nợ sớm & dự phòng','Credit cost và chất lượng lợi nhuận.',[['bank-asset-quality','Chất lượng tài sản']]],
      [4,'Room & vốn','Dư địa tăng dư nợ và nhu cầu bổ sung vốn.',[['bank-safety','Tỷ lệ an toàn'],['bank-credit-room','Room tín dụng']]]
    ];
    rows=defs.map(([i,title,impact,links])=>{const m=monitors[i],meta=m?.querySelector('.cadence-note')?.textContent||'',state=m?.querySelector('.status')?.dataset.state;return item(title,meta.match(/Mới nhất:\s*(.*?) · Kỳ:/)?.[1]||'—',meta.match(/ · Kỳ:\s*(.*?) · Kiểm tra/)?.[1]||'Chưa có kỳ',state==='on'?'Cần chú ý':state==='na'?'Thiếu dữ liệu':'Theo dõi',impact,m?.querySelector('p:not(.cadence-note)')?.textContent.replace('Điều kiện theo dõi: ','')||'Cần bổ sung dữ liệu.',state==='na'?'Chưa có CAR/room để chấm dư địa.':'',links,['all'])});
    const v=W?.blocks?.valuation,p=v?.data?.sector_daily?.find(x=>x[0]===v.price_date);
    rows.push(item('Kỳ vọng & định giá',p?'P/B ngành '+num(p[2],2)+'x':'Chưa có P/B đúng phiên',date(v?.price_date),'Chưa kết luận','Định giá cần đặt cạnh ROE, chất lượng tài sản và kỳ vọng lợi nhuận.','ROE bền vững hoặc kỳ vọng lợi nhuận đổi đủ để giải thích P/B.','P/B thấp chưa đủ kết luận rẻ; dự báo vĩ mô không phải consensus lợi nhuận bank.',[['bank-valuation','Định giá'],['bank-forecast','Dự báo'],['bank-news','Tin & CBTT']],['all']));
    rows.forEach(r=>{
      if(r.metric==='—'||!W){r.status='Thiếu dữ liệu'}
      else if(r.links.some(([id])=>W.blocks?.[id.replace(/^bank-/,'')]?.status==='error')){r.status='Chờ cập nhật';r.limit+=' Lần tải lỗi; đang giữ bản trước.'}
    });
    if(!p)rows.at(-1).status='Thiếu dữ liệu';
  }
  const filter=make('div','thesis-filter');signals.append(filter);
  const intro=make('p','thesis-scope',bank?'Toàn ngành · Wi kiểm '+date(W?.checked_at):'');if(intro.textContent)signals.append(intro);
  const grid=make('div','thesis-signals');signals.append(grid);
  const unknown=['Thiếu dữ liệu','Chưa đủ số','Chưa xác minh','Chờ cập nhật'];
  rows.forEach((r,i)=>{
    const card=make('article','thesis-signal');card.dataset.groups=r.groups.join(',');
    const top=make('div','thesis-signal-top');top.append(make('h3','',r.title),make('span','thesis-state',r.status));card.append(top);
    if(r.status==='Chờ cập nhật')card.dataset.state='stale';else if(unknown.includes(r.status))card.dataset.state='unknown';else if(r.status==='Cần chú ý')card.dataset.state='attention';
    card.append(make('strong','thesis-metric',r.metric),make('small','thesis-period',r.period));
    const impact=make('p','thesis-impact');impact.append(make('b','','Ảnh hưởng: '),r.impact);card.append(impact);
    const condition=make('p','thesis-condition');condition.append(make('b','','Đổi đánh giá khi: '),r.condition);card.append(condition);
    if(r.limit)card.append(make('p','thesis-limitation',r.limit));
    const links=make('div','thesis-evidence-links');r.links.forEach(([id,label])=>{const target=document.getElementById(id);if(!target)return;
    const a=make('a','',label+' ↗');a.href='#'+target.closest('.majorpane')?.dataset.tab;a.addEventListener('click',e=>{e.preventDefault();reveal(id)});links.append(a)});
    if(links.children.length)card.append(links);grid.append(card);
  });
  if(!bank){
    const label=make('label','','Góc nhìn doanh nghiệp');label.htmlFor='thesis-scope';const select=make('select','');select.id='thesis-scope';
    const opts=power?[['all','Toàn ngành'],['thermal','Nhiệt điện'],['hydro','Thủy điện'],['re','Năng lượng tái tạo'],['grid','Lưới, xây lắp & thiết bị']]:oil?[['all','Toàn chuỗi'],['upstream','Khai thác'],['services','Dịch vụ'],['gas','Khí'],['refining','Lọc dầu'],['distribution','Phân phối']]:[['all','Toàn ngành'],['cane','Tự chủ vùng mía'],['import','Phụ thuộc nguyên liệu nhập']];
    opts.forEach(([v,t])=>{const o=make('option','',t);o.value=v;select.append(o)});filter.append(label,select);
    select.addEventListener('change',()=>{[...grid.children].forEach(c=>c.hidden=select.value!=='all'&&!c.dataset.groups.split(',').includes(select.value));intro.textContent=oil||power?'':select.value==='cane'?'Tự chủ mía: ưu tiên giá bán so giá mía, năng suất và độ bền vùng nguyên liệu.':select.value==='import'?'Nguyên liệu nhập: ưu tiên giá đường thô, tỷ giá, thuế và khả năng chuyển giá bán.':'';intro.hidden=!intro.textContent;if(!intro.parentElement)grid.before(intro)});
    if(!oil&&!power)select.addEventListener('change',()=>{
      const c=grid.children[1],raw=select.value==='import',cane=select.value==='cane';
      c.querySelector('h3').textContent=raw?'Giá bán & đường thô nhập':cane?'Giá bán & giá mía':rows[1].title;
      const impact=c.querySelector('.thesis-impact');impact.replaceChildren(make('b','','Ảnh hưởng: '),raw?'Giá đường thô, tỷ giá, thuế và khả năng chuyển giá bán.':cane?'Giá bán so chi phí mía; năng suất và tỷ lệ thu hồi đường.':rows[1].impact);
      c.querySelector('.thesis-limitation').textContent=raw?'Giá thế giới chưa phải giá vốn nhập về; chưa có spread cùng kỳ sau tỷ giá, thuế, logistics.':rows[1].limit;
      c.querySelectorAll('.thesis-evidence-links a').forEach(a=>{a.hidden=raw&&a.textContent.startsWith('Giá mía')});
    });
  }else{
    const go=make('button','','Chọn nhóm / mã ở bộ lọc ngân hàng ↑');go.type='button';go.addEventListener('click',()=>{document.getElementById('bank-group').focus();document.querySelector('.bank-filter').scrollIntoView({block:'center'})});filter.append(go);
    const snapshot=make('div','thesis-bank-snapshot');filter.after(snapshot);
    function selected(){
      const sym=document.getElementById('bank-ticker').value,group=document.getElementById('bank-group');snapshot.replaceChildren();
      if(sym==='all'){snapshot.textContent='Đang chọn '+group.selectedOptions[0].textContent+' · tín hiệu bên dưới chấm toàn ngành.';return}
      const r=W?.blocks?.['bank-ratios']?.data?.banks?.find(x=>x.symbol===sym),v=W?.blocks?.valuation?.data?.banks?.find(x=>x.symbol===sym);
      snapshot.append(make('b','',sym+' · '));snapshot.append(r?'NIM '+num(r.nim*100,2)+'% · NPL '+num(r.npl*100,2)+'% · ROE '+num(r.roe*100,1)+'%':'Chưa có chỉ số Wi cho mã này');
      if(v)snapshot.append(' · P/B '+num(v.pb,2)+'x');snapshot.append(make('small','','TTM Q2/2026 · P/B '+date(W?.blocks?.valuation?.price_date)+' · Wi'));
    }
    ['bank-group','bank-ticker'].forEach(id=>document.getElementById(id).addEventListener('change',selected));
    document.querySelectorAll('[data-player]').forEach(b=>b.addEventListener('click',selected));selected();
  }
  signals.append(make('p','thesis-assumption','Ngưỡng do AI đề xuất, chưa kiểm định thống kê.'));
  const scenarios=make('section','thesis-scenarios');scenarios.append(make('h3','','Kịch bản cần kiểm chứng'),make('p','thesis-scope','Khung ngày '+stamp+' · không gán xác suất hay giá mục tiêu'));
  const scenarioNav=make('div','thesis-scenario-tabs');scenarioNav.setAttribute('role','tablist');scenarioNav.setAttribute('aria-label','Kịch bản');scenarios.append(scenarioNav);
  const conditions=bank?[
    ['Tín dụng và huy động cùng mở rộng; NIM ổn định, nợ sớm không tăng.','Thu nhập lãi và phí hỗ trợ tăng trưởng.','NIM suy giảm hoặc chất lượng tài sản xấu đi.'],
    ['Giá vốn hạ nhanh hơn lợi suất; vốn/room còn dư địa.','Biên và chi phí rủi ro cùng cải thiện.','Bao phủ yếu đi hoặc tăng trưởng che khuất nợ xấu.'],
    ['Huy động đắt lên, lãi đầu ra bị nén và nợ sớm tăng.','Lợi nhuận chịu áp lực từ biên, dự phòng và vốn.','Biên ổn định và chất lượng tài sản phục hồi có bằng chứng.']
  ]:power?[
    ['El Niño mạnh kéo dài qua mùa khô 2027; giá bán lẻ giữ nguyên tới hết 2026.','Thủy điện giảm sản lượng mùa khô; than, khí được huy động nhiều hơn; chi phí mua điện của EVN tăng.','Nước về hồ mùa khô vượt trung bình hoặc ONI về trung tính sớm.'],
    ['Phụ tải tăng nhanh, giá than và LNG hạ, giá bán lẻ được điều chỉnh theo cơ chế.','Dòng tiền EVN cải thiện; nhà máy được thanh toán đúng hạn; nhu cầu đầu tư nguồn, lưới tăng.','Giá nhiên liệu tăng lại hoặc giá bán lẻ bị giữ lâu.'],
    ['El Niño sâu, nhiên liệu đắt lên, giá bán lẻ không điều chỉnh.','EVN lỗ trở lại, chậm thanh toán cho nhà máy; rủi ro thiếu điện miền Bắc mùa khô.','Thủy văn phục hồi hoặc giá bán lẻ được điều chỉnh.']
  ]:oil?[
    ['Gián đoạn kéo dài, không leo thang; crack hạ nhiệt.','Giá và biên phân hóa theo khâu kinh doanh.','Dòng chảy phục hồi bền hoặc mất thêm nguồn cung vật chất.'],
    ['Leo thang gây mất thêm dòng chảy vật chất.','Upstream được hỗ trợ giá; khâu nhập hàng chịu áp lực.','Hormuz bình thường hóa, tồn kho sản phẩm phục hồi.'],
    ['Dòng chảy bình thường hóa và nhu cầu yếu.','Giá bán upstream và kỳ vọng đầu tư chịu sức ép.','Gián đoạn tăng trở lại hoặc cung–cầu thắt chặt hơn.']
  ]:[
    ['Giá đi ngang khi tồn kho chưa giảm rõ.','Biên phụ thuộc chi phí nguyên liệu và tốc độ bán hàng.','Tồn kho/tiêu thụ giảm hoặc áp lực cung tăng mạnh.'],
    ['Giá thế giới hồi phục, thực thi chống cạnh tranh bất hợp pháp hiệu quả hơn.','Khả năng tăng giá bán cải thiện nếu chi phí đầu vào phù hợp.','Tồn kho không giảm hoặc chi phí tăng nhanh hơn giá bán.'],
    ['Tồn kho tăng và giá thế giới giảm sâu hơn.','Giá bán, vòng quay hàng và biên chịu áp lực.','Tồn kho giảm bền cùng phục hồi giá bán.']
  ];
  const scenarioPanels=conditions.map((lines,i)=>{const p=make('div','thesis-scenario-panel');p.id='thesis-case-'+i;p.setAttribute('role','tabpanel');const range=oldScenarios[i]?.querySelector('.range')?.textContent;if(range)p.append(make('strong','',range));['Điều kiện','Tác động','Bác bỏ khi'].forEach((label,j)=>{const n=make('p','');n.append(make('b','',label+': '),lines[j]);p.append(n)});scenarios.append(p);return p});
  function scenario(i){scenarioPanels.forEach((p,j)=>{p.hidden=i!==j;const b=scenarioNav.children[j];b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1})}
  ['Cơ sở','Thuận lợi','Bất lợi'].forEach((label,i)=>{const b=make('button','',label);b.type='button';b.setAttribute('role','tab');b.id='thesis-case-tab-'+i;b.setAttribute('aria-controls',scenarioPanels[i].id);scenarioPanels[i].setAttribute('aria-labelledby',b.id);b.addEventListener('click',()=>scenario(i));scenarioNav.append(b)});keys([...scenarioNav.children],scenario);scenario(0);signals.append(scenarios);
  // Enter the requested tab at its decision board, avoiding the repeated hero.
  const enter=()=>requestAnimationFrame(()=>board.scrollIntoView({block:'start',behavior:'instant'}));
  document.querySelectorAll('.majortabbtn')[4]?.addEventListener('click',enter);
  if(location.hash==='#mt5')enter();
})();
