/* Progressive Catalyst/Risk layout. Reuses dated monitor outputs and source
   blocks; does not overwrite provider data, original research or analyst notes. */
(() => {
  'use strict';
  const pane=document.querySelector('.majorpane[data-tab="mt5"]');if(!pane)return;
  const bank=document.body.dataset.sector==='bank',power=document.body.dataset.sector==='power',re=document.body.dataset.sector==='realestate',tx=document.body.dataset.sector==='textile',oil=!power&&!re&&!tx&&!!document.getElementById('chCurve');
  const sector=bank?'bank':power?'power':re?'realestate':tx?'textile':oil?'oil':'sugar';
  const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n};
  const num=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
  const date=v=>/^\d{4}-\d{2}-\d{2}/.test(v||'')?v.slice(8,10)+'/'+v.slice(5,7)+'/'+v.slice(0,4):v||'Chưa có kỳ';
  const original=[...pane.children];
  const monitors=[...pane.querySelectorAll('.monitor-item')];
  const oldScenarios=[...pane.querySelectorAll('.scenario')];
  const W=window.BANK_WI_DATA,feeds=window.SECTOR_DAILY?.sources||{};
  const board=make('section','thesis-board');board.id='thesis-board';
  const heading=make('div','sectionhead'),headingText=make('div','');headingText.append(make('h2','','Catalyst / Risk'),make('p','','Kết luận hiện tại, tín hiệu đo được và các mốc sắp tới.'));heading.append(headingText);board.append(heading);
  function keys(buttons,select){buttons.forEach((b,i)=>b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:buttons.length-1))%buttons.length;select(j);buttons[j].focus()}))}
  const signals=make('div','thesis-view');signals.id='thesis-signals';board.append(signals);
  const stamp=bank?'11/09/2026':power?'06/10/2026':re||tx?'08/10/2026':oil?'03/09/2026':'17/08/2026';
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
    const sub=target.closest('.pane-subpane');if(sub?.hidden)document.getElementById(sub.id+'-tab')?.click();
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
  }else if(re||tx){
    rows=[]; // the verdict board below reads window.REALESTATE_WI directly; no legacy tiles
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
    const opts=tx?[['all','Toàn ngành'],['garment','May'],['yarn','Sợi'],['group','Tập đoàn']]:re?[['all','Toàn ngành'],['housing','Nhà ở'],['industrial','Khu công nghiệp'],['leasing','Cho thuê'],['broker','Môi giới']]:power?[['all','Toàn ngành'],['thermal','Nhiệt điện'],['hydro','Thủy điện'],['re','Năng lượng tái tạo'],['grid','Lưới, xây lắp & thiết bị']]:oil?[['all','Toàn chuỗi'],['upstream','Khai thác'],['services','Dịch vụ'],['gas','Khí'],['refining','Lọc dầu'],['distribution','Phân phối']]:[['all','Toàn ngành'],['cane','Tự chủ vùng mía'],['import','Phụ thuộc nguyên liệu nhập']];
    opts.forEach(([v,t])=>{const o=make('option','',t);o.value=v;select.append(o)});filter.append(label,select);
    select.addEventListener('change',()=>{[...grid.children].forEach(c=>c.hidden=select.value!=='all'&&!c.dataset.groups.split(',').includes(select.value));intro.textContent=oil||power?'':select.value==='cane'?'Tự chủ mía: ưu tiên giá bán so giá mía, năng suất và độ bền vùng nguyên liệu.':select.value==='import'?'Nguyên liệu nhập: ưu tiên giá đường thô, tỷ giá, thuế và khả năng chuyển giá bán.':'';intro.hidden=!intro.textContent;if(!intro.parentElement)grid.before(intro)});
    if(!oil&&!power&&!re&&!tx)select.addEventListener('change',()=>{
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
  // Verdict-first layout (oil pilot 08/10/2026, rolled out to all sectors): verdict → signal table → upcoming events.
  // Verdict, states and key numbers are computed from feeds by explicit thresholds; a missing feed is "Thiếu dữ liệu", never a good signal.
  const rec=k=>feeds[k]?.status==='ok'?feeds[k].records||[]:[];
  const ago=(r,days)=>{if(!r.length)return null;const t=Date.parse(r.at(-1).date)-days*86400000;return [...r].reverse().find(x=>Date.parse(x.date)<=t)||null};
  const v=(r,f='value')=>r.at(-1)?.[f],p=(r,f='value',d=7)=>ago(r,d)?.[f];
  const S=(x,d,u)=>x==null?'—':num(x,d)+u;
  const D=(a,b,d)=>a==null||b==null?'—':(a-b>0?'▲ +':a-b<0?'▼ ':'■ ')+num(a-b,d);
  const pct=(a,b)=>a==null||!b?null:(a/b-1)*100;
  const mean=(r,n,f='value')=>{const w=r.slice(-n).map(x=>x[f]).filter(Number.isFinite);return w.length?w.reduce((s,x)=>s+x,0)/w.length:null};
  const stateText={good:'Catalyst',risk:'Risk',watch:'Sát ngưỡng',info:'Bối cảnh',na:'Thiếu dữ liệu'},order=['risk','watch','good','info','na'];
  const next=(dow,from=new Date())=>{const d=new Date(from);d.setHours(0,0,0,0);d.setDate(d.getDate()+(dow-d.getDay()+7)%7);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')};
  // score row: {name,chart,st,mid:[cells],end:[cells]}; segs: [name,tickers,tilt(up|down|flat|na),why]
  function renderBrief({headline,segs=[],headers,score,events}){
    const brief=make('section','cr-brief');
    const head=make('div','cr-verdict card');head.append(make('span','cr-verdict-label','Kết luận hiện tại'),make('h3','',headline));
    if(segs.length){const box=make('div','cr-segments');
      segs.forEach(([n,t,s,why])=>{const c=make('div','cr-seg');c.dataset.tilt=s;c.append(make('b','',n),make('em','',t),make('span','cr-seg-tilt',{up:'▲',down:'▼',flat:'■',na:'?'}[s]),make('small','',why));box.append(c)});head.append(box)}
    brief.append(head);
    const tb=make('section','cr-score card');tb.append(make('h3','','Tín hiệu'));
    const wrap=make('div','cr-score-wrap'),table=make('table','cr-score-table');table.dataset.noFold=''; /* main content: never fold */wrap.append(table);
    const tr=make('tr','');headers.forEach(t=>tr.append(make('th','',t)));const thead=make('thead','');thead.append(tr);table.append(thead);
    const tbody=make('tbody','');
    const groupsSeen=[...new Set(score.map(x=>x.group||''))];
    groupsSeen.flatMap(g=>score.filter(x=>(x.group||'')===g).sort((a,b)=>order.indexOf(a.st)-order.indexOf(b.st))).forEach(({name,chart,st,mid,end,group},i,arr)=>{
      if(group&&group!==arr[i-1]?.group){const gr=make('tr','cr-group'),td=make('td','',group);td.colSpan=headers.length;gr.append(td);tbody.append(gr)}
      const r=make('tr','');r.dataset.state=st;const c0=make('td','');
      if(chart&&document.getElementById(chart)){const a=make('a','',name+' ↗');a.href='#'+chart;a.addEventListener('click',e=>{e.preventDefault();reveal(chart)});c0.append(a)}else c0.textContent=name;
      r.append(c0);mid.forEach((t,i)=>r.append(make('td',i<2?'cr-num':'',t)));r.append(make('td','cr-state',stateText[st]));end.forEach(t=>r.append(make('td','',t)));tbody.append(r)});
    table.append(tbody);tb.append(wrap,make('p','thesis-scope','Ngưỡng AI đề xuất, chưa kiểm định · bấm tên để xem biểu đồ.'));
    const snap=signals.querySelector('.thesis-bank-snapshot');if(snap)brief.append(snap);
    brief.append(tb);
    if(events?.length){const cal=make('section','cr-cal card');cal.append(make('h3','','Sắp tới'));const ol=make('ol','');
      events.forEach(([d,e])=>{const li=make('li','');li.append(make('time','',d),make('b','',e));ol.append(li)});cal.append(ol);brief.append(cal)}
    signals.prepend(brief);
    // Old tiles fold into one hidden block (kept in DOM so sources still move to Sources); scenarios removed per user.
    const detail=fold('thesis-detail','Chi tiết từng tín hiệu');
    detail.body.append(filter,grid,signals.querySelector('.thesis-assumption'));scenarios.replaceWith(detail.d);
    if(grid.querySelector('.data-gap,.gap-row'))detail.d.open=true;
    pane.classList.add('brief-compact');
  }
  const y=new Date().getFullYear();
  if(oil){
    const hz=rec('hormuz'),bf=rec('brent_futures'),sg=rec('singapore_cracks'),ds=rec('distillate_stock'),rf=rec('retail_fuel'),wb=rec('world_balance');
    const bq7=(r,end)=>{const w=r.filter(x=>Date.parse(x.date)<=end).slice(-7);return w.length===7?w.reduce((a,x)=>a+x.total,0)/7:null};
    const hzNow=hz.length?bq7(hz,Date.parse(hz.at(-1).date)):null,hzPrev=hz.length?bq7(hz,Date.parse(hz.at(-1).date)-7*86400000):null;
    const bNow=wb.find(x=>x.year===y),bNext=wb.find(x=>x.year===y+1),crack=v(sg,'gasoil_crack'),dist=v(ds);
    const crackOk=crack!=null&&crack>=60,hzLow=hzNow!=null&&hzNow<30,surplus=bNext&&bNext.balance>0;
    const row=(name,now,prev,unit,d,th,st,who,chart)=>({name,chart,st,mid:[S(now,d,unit),prev===undefined?'—':D(now,prev,d),th],end:[who]});
    renderBrief({
      headline:hzLow?(crackOk?'Khai thác, lọc dầu thuận · phân phối chịu áp lực':'Chỉ khai thác còn thuận · lọc dầu, phân phối chịu áp lực'):'Hormuz mở lại · lợi thế giá cao thu hẹp',
      segs:[['Khai thác','PVEP · GAS',bf.length?'up':'na','Giá cao; '+(y+1)+' dư cung'],['Lọc dầu','BSR',crackOk?'up':'down',crackOk?'Crack ≥ 60':'Crack < 60'],['Phân phối','PLX · OIL',hzLow?'down':'flat','Giá vốn cao'],['Dịch vụ','PVD · PVS','na','Chưa có hợp đồng mới'],['Khí','GAS · PVG','flat','LNG đắt']],
      headers:['Tín hiệu','Mới nhất','1 tuần','Ngưỡng','','Ai chịu'],
      score:[
        row('Tàu qua Hormuz (BQ7)',hzNow,hzPrev,' lượt/ngày',1,'≥ 30',hzNow==null?'na':hzNow<30?'risk':'good','BSR · PLX · PVT','chHormuzM'),
        row('Brent kỳ hạn gần',v(bf),p(bf),' USD/thùng',2,'—',v(bf)==null?'na':'info','Khai thác ▲ · Phân phối ▼','chBrent24'),
        row('Crack gasoil Singapore',crack,p(sg,'gasoil_crack'),' USD/thùng',2,'≥ 60',crack==null?'na':crack<60?'risk':crack<65?'watch':'good','BSR','chSingaporeCrack'),
        row('Tồn kho distillate Mỹ',dist,p(ds),' triệu thùng',1,'< 115',dist==null?'na':dist<115?'good':'watch','BSR','chProdStock'),
        row('Giá dầu diesel VN (Vùng 1)',v(rf,'diesel'),p(rf,'diesel'),' đ/lít',0,'—',v(rf,'diesel')==null?'na':'info','PLX · OIL','chRetailFuel'),
        row('Cân đối cung – cầu '+y+' (EIA)',bNow?.balance,undefined,' triệu thùng/ngày',2,'< 0',bNow?bNow.balance<0?'good':'risk':'na','Khai thác · GAS','chWorldBalance')],
      events:[[next(3),'EIA tồn kho tuần'],[next(4),'Điều hành giá xăng dầu'],['Giữa tháng','EIA STEO'],['Từ 20/10','BCTC quý III'],['Chưa xác nhận','Họp OPEC+']]
    });
  }else if(power){
    const oni=rec('enso_oni'),n34=rec('nino34_weekly'),coal=rec('coal_newcastle'),lng=rec('lng_jkm'),day=rec('vn_power_daily');
    const oniNow=v(oni,'oni'),el=oniNow!=null&&oniNow>=0.5,cd=pct(v(coal),mean(coal,63)),ld=pct(v(lng),mean(lng,63));
    const fuelHi=(cd!=null&&cd>=15)||(ld!=null&&ld>=15);
    const dn=day.at(-1),dp=ago(day,7),hy=r=>r?.output_mkwh?r.hydro/r.output_mkwh*100:null;
    const g=pct(mean(day.slice(-30),30,'output_mkwh'),mean(day.filter(x=>{const t=Date.parse(x.date),e=Date.parse(day.at(-1)?.date||0)-365*86400000;return t<=e&&t>e-30*86400000}),30,'output_mkwh'));
    const fuelSt=d=>d==null?'na':d>=15?'risk':d<=-15?'good':Math.abs(d)>=10?'watch':'info';
    const row=(name,now,prev,unit,dg,th,st,who,chart)=>({name,chart,st,mid:[S(now,dg,unit),D(now,prev,dg),th],end:[who]});
    renderBrief({
      headline:el?(fuelHi?'El Niño mạnh nhưng nhiên liệu đắt · nhiệt điện bị kẹp, thủy điện chịu áp lực':'El Niño mạnh · thủy điện chịu áp lực, nhiệt điện được huy động nhiều hơn'):(fuelHi?'Nhiên liệu đắt · nhiệt điện chịu áp lực':'Thủy văn trung tính · chưa có áp lực rõ lên các khâu'),
      segs:[['Thủy điện','REE · VSH · CHP · SBA',oniNow==null?'na':el?'down':'up',oniNow==null?'Thiếu ONI':'ONI '+num(oniNow,2)+(el?' ≥ 0,5':' < 0,5')],
        ['Nhiệt điện','PPC · QTP · POW · NT2',oniNow==null&&cd==null?'na':fuelHi?'down':el?'up':'flat',fuelHi?'Nhiên liệu đắt':el?'Được huy động nhiều':'Trung tính'],
        ['Năng lượng tái tạo','','na','Chưa có dữ liệu'],
        ['Lưới & xây lắp','PC1 · TV2',g==null?'na':g>=5?'up':'flat',g==null?'Thiếu dữ liệu':'Sản lượng '+(g>0?'+':'')+num(g,1)+'% cùng kỳ']],
      headers:['Tín hiệu','Mới nhất','Kỳ trước','Ngưỡng','','Ai chịu'],
      score:[
        row('ONI (El Niño)',oniNow,oni.at(-2)?.oni,' °C',2,'≥ +0,5',oniNow==null?'na':el?'risk':'good','Thủy điện ▼ · Nhiệt điện ▲','chEnso'),
        row('Nino 3.4 (tuần)',v(n34,'ssta'),p(n34,'ssta'),' °C',1,'≥ +0,5',v(n34,'ssta')==null?'na':v(n34,'ssta')>=0.5?'risk':'good','Thủy điện','chNino34'),
        row('Than Newcastle',v(coal),p(coal),' USD/tấn',1,'±15% vs TB 3T',fuelSt(cd),'Nhiệt điện than','chCoalM'),
        row('LNG JKM',v(lng),p(lng),' USD/MMBtu',2,'±15% vs TB 3T',fuelSt(ld),'Nhiệt điện khí','chGasM'),
        row('Sản lượng điện ngày',dn?.output_mkwh,dp?.output_mkwh,' triệu kWh',1,'—',dn?'info':'na','Toàn ngành','chDaily'),
        row('Thủy điện / tổng sản lượng',hy(dn),hy(dp),'%',1,'—',dn?'info':'na','Thủy điện','chMixShare')],
      events:[['Đầu tháng','EVN sản lượng tháng'],['Giữa tháng','NOAA cập nhật ONI'],['Từ 20/10','BCTC quý III'],['Từ 11/2026','Mùa khô thủy điện']]
    });
  }else if(re){
    const R=window.REALESTATE_DASHBOARD||{},B=window.REALESTATE_WI?.blocks||{},cash=(B.cbond_cashflow?.records||[]).filter(r=>!r.partial),iss=B.cbond_issuance?.records||[];
    const lc=cash.at(-1),pc=cash.at(-2),due3=(R.next12||[]).slice(0,3).reduce((a,r)=>a+r.due,0),dueShare=lc?due3/lc.outstanding_value*100:null;
    const issNow=iss.slice(-3).reduce((a,r)=>a+r.value,0),issPrev=iss.slice(-6,-3).reduce((a,r)=>a+r.value,0),issChg=issPrev?(issNow/issPrev-1)*100:null;
    const mac=B.macro?.series||{},yoyLast=(k,lag)=>{const rs=mac[k]?.records||[],a=rs.at(-1),b=rs.at(-1-lag);return a&&b?(a.value/b.value-1)*100:null};
    const cc=yoyLast('credit_construction',12),ct=yoyLast('credit_total',12),cpi=R.cpi?.value,fdiChg=R.fdi&&R.fdiPrev?(R.fdi.value/R.fdiPrev.value-1)*100:null;
    const lateChg=lc&&pc?lc.late_payment_debt-pc.late_payment_debt:null,lateSt=lateChg==null?'na':lateChg>500?'risk':lateChg<-500?'good':'watch';
    const dueSt=dueShare==null?'na':dueShare>=5?'risk':dueShare>=3?'watch':'good',issSt=issChg==null?'na':issChg>=20?'good':issChg<=-20?'risk':'info';
    const housingUp=lateSt==='good'&&dueSt!=='risk';let kcnUp=fdiChg!=null&&fdiChg>0;
    const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
    const row=(name,now,prev,unit,d,th,st,who,chart,group='Nhà ở')=>({name,chart,st,group,mid:[S(now,d,unit),prev===undefined?'—':D(now,prev,d),th],end:[who]});
    const fm=mac.fdi_mfg_ytd?.records||[],fmL=fm.at(-1),fmP=fmL&&fm.find(r=>r.date===String(Number(fmL.date.slice(0,4))-1)+fmL.date.slice(4)),fmChg=fmL&&fmP?(fmL.value/fmP.value-1)*100:null;
    const iip=mac.iip_mfg_yoy?.records||[],iipL=iip.at(-1),iip3=iip.slice(-3).reduce((a,r)=>a+r.value,0)/Math.max(1,iip.slice(-3).length);
    const ipb=window.REALESTATE_WI?.blocks?.sector_ratio?.by_sector?.['157']?.records||[],ipbL=ipb.at(-1),ipbP=ipb.at(-6);
    renderBrief({
      headline:(dueSt==='risk'||lateSt==='risk')?'Nhà ở: áp lực đáo hạn trái phiếu còn nặng · khu công nghiệp thuận nhờ FDI':housingUp?'Nhà ở: vốn đang dễ thở hơn · khu công nghiệp thuận nhờ FDI':'Nhà ở trung tính về vốn · khu công nghiệp '+(kcnUp?'thuận nhờ FDI':'chờ FDI'),
      segs:[['Nhà ở','VHM · NVL · KDH · NLG · DXG · PDR…',lc?(housingUp?'up':dueSt==='risk'||lateSt==='risk'?'down':'flat'):'na',lc?'Đáo hạn 3T = '+num(dueShare,1)+'% dư nợ':'Thiếu TPDN'],['Khu công nghiệp','KBC · IDC · BCM · SZC · SIP · VGC · LHG',fdiChg==null?'na':kcnUp?'up':'down',fdiChg==null?'Thiếu FDI':'FDI BĐS '+(fdiChg>0?'+':'')+num(fdiChg,0)+'% YoY'],['Cho thuê','VRE',cpi==null?'na':cpi>=7?'up':'flat',cpi==null?'Thiếu CPI':'CPI nhà ở '+num(cpi,1)+'%'],['Môi giới','DXS','na','Chờ số giao dịch Q3']],
      headers:['Tín hiệu','Mới nhất','Kỳ trước','Ngưỡng','','Ai chịu'],
      score:[
        row('TPDN BĐS chậm trả (cuối tháng)',lc?lc.late_payment_debt/1000:null,pc?pc.late_payment_debt/1000:null,' nghìn tỷ',1,'± 0,5 nghìn tỷ/tháng',lateSt,'Nhà ở (NVL, nhóm chưa niêm yết)','chBondLate'),
        row('Gốc đến hạn 3 tháng tới / dư nợ',dueShare,undefined,'%',1,'≥ 5% là rủi ro',dueSt,'Nhà ở · VHM','chBondMaturity'),
        row('Phát hành TPDN BĐS 3T gần nhất',issNow/1000,issPrev/1000,' nghìn tỷ',1,'±20% so 3T trước',issSt,'Nhà ở','chBondIssuance'),
        row('Tín dụng xây dựng YoY',cc,undefined,'%',1,ct==null?'so tổng tín dụng':'> tổng tín dụng '+num(ct,1)+'%',cc==null?'na':ct!=null&&cc>ct?'good':'watch','Nhà ở · nhà thầu','chCreditRe'),
        row('FDI đăng ký vào BĐS (YTD)',R.fdi?R.fdi.value/1000:null,R.fdiPrev?R.fdiPrev.value/1000:null,' tỷ USD',2,'> cùng kỳ',fdiChg==null?'na':fdiChg>0?'good':'risk','KCN · cho thuê','chFdiRe','Khu công nghiệp'),
        row('CPI nhà ở & VLXD YoY',cpi,undefined,'%',2,'≥ 7% sát ngưỡng',cpi==null?'na':cpi>=7?'watch':'info','Cho thuê · người mua','chCpiHousing'),
        row('P/B BĐS dân cư',R.resLast?R.resLast[2]:null,undefined,'x',2,'—',R.resLast?'info':'na','Nhà ở ▲ VHM','chSectorPb'),
        row('FDI đăng ký CB-CT (YTD)',fmL?fmL.value/1000:null,fmP?fmP.value/1000:null,' tỷ USD',2,'> cùng kỳ',fmChg==null?'na':fmChg>0?'good':'risk','KBC · IDC · BCM · SZC · SIP · VGC · LHG','chFdiMfg','Khu công nghiệp'),
        row('IIP chế biến, chế tạo (BQ 3 tháng)',iip.length?iip3:null,undefined,'%',1,'≥ 8% YoY',iipL?iip3>=8?'good':iip3<0?'risk':'watch':'na','Khách thuê KCN','chIipMfg','Khu công nghiệp'),
        row('P/B BĐS công nghiệp',ipbL?ipbL[2]:null,ipbP?ipbP[2]:null,'x',2,'—',ipbL?'info':'na','KCN niêm yết','chIpPb','Khu công nghiệp')],
      events:[['20/10','Khai mạc kỳ họp QH: Luật Đất đai sửa đổi'],['20–30/10','BCTC quý III'],['Đầu tháng','NSO: CPI, FDI, GDP quý'],['Hằng tháng','HNX/VBMA: TPDN đáo hạn'],['Cuối T11','Bộ Xây dựng: thị trường Q3']]
    });
  }else if(tx){
    // Thesis delta: one row per variable that is moving — evidence (latest number), direction, who gains/loses, what would reverse it.
    const T=window.TEXTILE_DASHBOARD||{},M=window.TEXTILE_WI?.blocks?.macro?.series||{},Cm=window.TEXTILE_WI?.blocks?.commodity?.series||{},Sec=window.TEXTILE_WI?.blocks?.sector_ratio?.by_sector||{};
    const R=k=>M[k]?.records||Cm[k]?.records||[];
    const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
    const yo=(rs,r)=>{if(!r)return null;const p=rs.find(x=>x.date.slice(0,7)===String(Number(r.date.slice(0,4))-1)+r.date.slice(4,7));return p&&p.value?(r.value/p.value-1)*100:null};
    const ytdYo=k=>{const rs=R(k),l=rs.at(-1);if(!l)return null;const y=l.date.slice(0,4),m=l.date.slice(5,7),sum=yy=>rs.filter(r=>r.date.slice(0,4)===yy&&r.date.slice(5,7)<=m).reduce((a,r)=>a+r.value,0);const p=sum(String(y-1));return p?(sum(y)/p-1)*100:null};
    const sg=v=>v==null?'—':(v>0?'+':'')+num(v,1)+'%';
    const us=R('exp_textile_us'),usL=us.at(-1),usY=yo(us,usL),us2=us.length>1?yo(us,us.at(-2)):null,usYtd=ytdYo('exp_textile_us');
    const jpY=ytdYo('exp_textile_jp'),krY=ytdYo('exp_textile_kr'),cnY=ytdYo('exp_textile_cn');
    const imf=R('imp_fabric'),imL=imf.at(-1),imY3=(()=>{const w=imf.slice(-3).map(r=>yo(imf,r)).filter(x=>x!=null);return w.length?w.reduce((a,x)=>a+x,0)/w.length:null})();
    const ur=R('us_apparel_retail_yoy'),urL=ur.at(-1);
    const ps=R('psf'),psL=ps.at(-1),psY=yo(ps,psL),pta=R('pta'),ptaL=pta.at(-1),ptaY=yo(pta,ptaL);
    const yc=R('yarn_cn'),cc=R('cotton_cn'),spr=yc.map(r=>{const c=cc.find(x=>x.date.slice(0,7)===r.date.slice(0,7));return c?{date:r.date,value:r.value-c.value}:null}).filter(Boolean),spL=spr.at(-1),spP=spr.at(-4);
    const ct=R('cotton_ice'),ctL=ct.at(-1);
    const pe=Sec['204']?.records||[],peL=pe.at(-1),pe1y=pe.find(r=>r[0]>=String(Number((peL?.[0]||'2026').slice(0,4))-1)+(peL?.[0]||'').slice(4));
    const ytd=T.ytd?pct(T.ytd.now,T.ytd.prev):null;
    const row=(group,name,evidence,cond,st,who,chart)=>({group,name,chart,st,mid:[evidence,cond],end:[who]});
    const usSt=usY==null?'na':usY<0&&us2!=null&&us2<0?'risk':usYtd!=null&&usYtd>3?'good':'watch';
    const asiaSt=[jpY,krY].every(v=>v!=null)?(jpY<0&&krY<0?'risk':jpY<0||krY<0?'watch':'good'):'na';
    const score=[
      row('Cầu & đơn hàng','Việt Nam lấy thị phần tại Mỹ','Thị phần 21,5% (2025) → 22,2% (5T/2026) · XK sang Mỹ '+(usL?mon(usL.date)+' '+sg(usY)+' YoY, lũy kế '+sg(usYtd):'—'),'XK sang Mỹ âm YoY 2 tháng liên tiếp, hoặc thị phần OTEXA giảm',usSt,'▲ MSH · TNG · GIL','chUsShare'),
      row('Cầu & đơn hàng','Kênh bán lẻ Mỹ không thừa hàng','Tồn kho/doanh số quần áo 2,11 lần (T7/26, gần đáy từ 2019) · bán lẻ quần áo '+(urL?mon(urL.date)+' '+sg(urL.value):'—'),'Tồn kho/doanh số > 2,2 lần hoặc bán lẻ quần áo Mỹ âm YoY',urL==null?'na':urL.value<0?'risk':'good','▲ cả nhóm may','chUsIS'),
      row('Cầu & đơn hàng','Nhãn hàng còn tồn kho cao hơn doanh thu','Inditex tồn kho +9,3% / doanh thu +7,6%; Adidas +13% / +13%; Nike −3% / −4%','Tồn kho các hãng tăng chậm hơn doanh thu ở kỳ báo cáo tới','watch','▼ đơn Q4–Q1 của nhà may','chBrands'),
      row('Cầu & đơn hàng','Đơn hàng sớm qua nhập khẩu vải','Nhập vải BQ 3 tháng '+sg(imY3)+' YoY'+(imL?' (đến '+mon(imL.date)+')':''),'Nhập vải BQ 3 tháng âm YoY',imY3==null?'na':imY3<0?'risk':imY3>5?'good':'info','Nhà may FOB · TNG · MSH','chImport'),
      row('Cầu & đơn hàng','Nhật, Hàn suy yếu; Trung Quốc tăng','Lũy kế năm: Nhật '+sg(jpY)+' · Hàn '+sg(krY)+' · Trung Quốc '+sg(cnY),'Nhật và Hàn trở lại tăng YoY',asiaSt,'▼ TCM (Nhật, Hàn) · ▲ STK, ADS (sợi sang TQ)','chExportMkt'),
      row('Thuế & cạnh tranh','Thuế Mỹ bất lợi tương đối','Việt Nam 12,5% vs Bangladesh, Campuchia, Indonesia, Ấn Độ 10% (từ 24/07/2026); ba nước đầu có hạn ngạch miễn thuế','Việt Nam được miễn trừ hoặc có hạn ngạch; đối thủ bị tăng thuế','risk','▼ TNG · MSH · GIL · TCM','chTariffHist'),
      row('Thuế & cạnh tranh','Trung Quốc mất thị phần Mỹ','Thị phần TQ 13,7% (2025) → 9,7% (5T/2026); NK may mặc Mỹ từ TQ 6T/2026 −37,7%','Thuế với Trung Quốc giảm so với Việt Nam','good','▲ cả nhóm may','chUsShare'),
      row('Thuế & cạnh tranh','EU là dư địa mới','Việt Nam ~4,6% thị phần EU; EVFTA về 0% toàn bộ ~2027; Bangladesh rời LDC 24/11/2026','EU gia hạn ưu đãi cho Bangladesh','info','▲ TCM · TNG (khách EU)','chOtherShare'),
      row('Chi phí & biên','Nguyên liệu polyester tăng mạnh','PSF '+sg(psY)+' YoY · PTA '+sg(ptaY)+' YoY'+(psL?' ('+mon(psL.date)+')':''),'Giá sợi polyester tăng theo, hoặc PTA/MEG hạ nhiệt',psY==null?'na':psY>15?'risk':'watch','▼ STK (nếu giá sợi không theo)','chPoly'),
      row('Chi phí & biên','Biên kéo sợi bông','Chênh sợi – bông TQ '+(spL?num(spL.value/1000,2)+' nghìn CNY/t':'—')+(spP?' so 3 tháng trước '+num(spP.value/1000,2):'')+' · bông ICE '+(ctL?num(ctL.value,1)+' cent/lb':'—'),'Chênh lệch tăng trở lại; bông ICE > 90 cent/lb là áp lực',!spL||!spP?'na':spL.value>=spP.value?'good':'watch','ADS · VGT','chYarnSpread'),
      row('Chi phí & biên','Lương tối thiểu +7,2% từ 01/01/2026','Vùng I 5,31 triệu đ/tháng; lương là chi phí lớn nhất của nhà may CMT','Đề xuất tăng lương 2027 > 7%','watch','▼ TNG · MSH · TCM · GIL','dm-14'),
      row('Định giá','Định giá đã chiết khấu rủi ro thuế','P/E ngành may '+(peL?num(peL[1],1)+'x':'—')+(pe1y?' (một năm trước '+num(pe1y[1],1)+'x)':''),'Có bằng chứng đơn hàng 2027 hoặc thuế Việt Nam giảm',peL?'info':'na','TCM · TNG · MSH · GIL','chSectorVal')];
    const bigs={'Việt Nam lấy thị phần tại Mỹ':['22,2%','thị phần Mỹ 5T/26'],'Kênh bán lẻ Mỹ không thừa hàng':['2,11x','tồn kho / doanh số'],'Nhãn hàng còn tồn kho cao hơn doanh thu':['+9,3%','tồn kho Inditex (DT +7,6%)'],'Đơn hàng sớm qua nhập khẩu vải':[sg(imY3),'nhập vải BQ 3T YoY'],'Nhật, Hàn suy yếu; Trung Quốc tăng':[sg(krY),'XK sang Hàn lũy kế'],'Thuế Mỹ bất lợi tương đối':['12,5%','vs 10% đối thủ'],'Trung Quốc mất thị phần Mỹ':['9,7%','thị phần TQ 5T/26 (từ 13,7%)'],'EU là dư địa mới':['4,6%','thị phần VN tại EU'],'Nguyên liệu polyester tăng mạnh':[sg(psY),'xơ PSF YoY'],'Biên kéo sợi bông':[spL?num(spL.value/1000,2):'—','nghìn CNY/t chênh sợi–bông'],'Lương tối thiểu +7,2% từ 01/01/2026':['+7,2%','lương tối thiểu vùng'],'Định giá đã chiết khấu rủi ro thuế':[peL?num(peL[1],1)+'x':'—','P/E ngành may']};
    score.forEach(r=>{r.big=bigs[r.name]||['—','']});
    const nGood=score.filter(r=>r.st==='good').length,nRisk=score.filter(r=>r.st==='risk').length;
    renderBrief({
      headline:'Cầu Mỹ và thị phần còn đỡ ngành; thuế cao hơn đối thủ và chi phí nguyên liệu là hai biến số xấu đi · '+nGood+' thuận, '+nRisk+' rủi ro',
      segs:[['May','TCM · TNG · MSH · GIL',usSt==='risk'?'down':usSt==='good'?'up':'flat',usYtd==null?'Thiếu XK Mỹ':'XK Mỹ lũy kế '+sg(usYtd)],['Sợi','STK · ADS',psY!=null&&psY>15?'down':'flat',psY==null?'Thiếu PSF':'PSF '+sg(psY)+' YoY'],['Tập đoàn','VGT',ytd==null?'na':ytd>3?'up':'flat',ytd==null?'Cả chuỗi':'XK lũy kế '+sg(ytd)]],
      headers:['Biến số đang thay đổi','Đang thấy (số mới nhất)','Đổi đánh giá khi','','Hưởng lợi ▲ / chịu thiệt ▼'],
      score,
      events:[['Đầu tháng','Hải quan, NSO: XK dệt may tháng trước'],['Giữa tháng','US Census: bán lẻ, tồn kho quần áo'],['20–30/10','BCTC quý III'],['24/11/2026','Bangladesh rời nhóm LDC'],['Theo sự kiện','USTR: hạn ngạch, miễn trừ Mục 301']]
    });
    // Scannable view: tiles instead of a wide table (table stays under a fold).
    (()=>{const sc=document.querySelector('.cr-score');if(!sc)return;
      const wrap=sc.querySelector('.cr-score-wrap'),title=sc.querySelector('h3');
      const chip={good:'Catalyst',risk:'Risk',watch:'Sát ngưỡng',info:'Bối cảnh',na:'Thiếu số'};
      const groups=[...new Set(score.map(r=>r.group))];
      const box=make('div','tx-tiles');
      groups.forEach(g=>{const gh=make('h4','tx-group',g);box.append(gh);const grid=make('div','tx-grid');
        score.filter(r=>r.group===g).sort((a,b)=>order.indexOf(a.st)-order.indexOf(b.st)).forEach(r=>{
          const t=make('article','tx-tile');t.dataset.state=r.st;
          const top=make('div','tx-top');top.append(make('span','tx-dot'),make('span','tx-chip',chip[r.st]));
          const h=make('h5','',r.name);
          const n=make('div','tx-big');n.append(make('strong','',r.big[0]),make('small','',r.big[1]));
          const ev=make('p','tx-ev',r.mid[0]);
          const who=make('div','tx-who');String(r.end[0]).split(/(?=[▲▼])/).forEach(part=>{const m=part.trim();if(!m)return;const c=make('span','tx-tag',m);c.dataset.dir=m.startsWith('▲')?'up':m.startsWith('▼')?'down':'';who.append(c)});
          const cond=make('p','tx-cond');cond.append(make('b','','Đảo chiều khi: '),r.mid[1]);
          t.append(top,h,n,ev,who,cond);
          if(r.chart&&document.getElementById(r.chart)){const a=make('a','tx-link','Xem chart ↗');a.href='#'+r.chart;a.addEventListener('click',e=>{e.preventDefault();reveal(r.chart)});t.append(a)}
          grid.append(t)});
        box.append(grid)});
      const fold=make('details','tx-tablefold');fold.append(make('summary','','Xem dạng bảng'));fold.append(wrap);
      sc.append(box,fold);if(title)title.after(sc.querySelector('.thesis-scope')||document.createComment(''));
    })();
  }else if(bank){
    const map={'Cần chú ý':'risk','Theo dõi':'info'};
    const att=rows.filter(r=>r.status==='Cần chú ý').length,na=rows.filter(r=>!map[r.status]).length;
    renderBrief({
      headline:att?att+'/'+rows.length+' tín hiệu cần chú ý':rows.length-na+'/'+rows.length+' tín hiệu đang theo dõi · chưa tín hiệu nào vượt ngưỡng'+(na?' · '+na+' thiếu số':''),
      headers:['Tín hiệu','Mới nhất','Kỳ','','Ảnh hưởng'],
      score:rows.map(r=>({name:r.title,chart:r.links[0]?.[0],st:map[r.status]||'na',mid:[r.metric,r.period],end:[r.impact]})),
      events:[['Từ 15/10','BCTC quý III ngân hàng'],['Hằng ngày','OMO · liên ngân hàng · tỷ giá'],['Hằng tháng','SBV tín dụng, huy động'],['Đầu tháng','GSO: CPI, tăng trưởng']]
    });
  }else{
    const fut=rec('sugar_futures'),wbm=rec('sugar_monthly'),bal=rec('sugar_vn_balance'),prod=rec('sugar_producers');
    const fd=pct(v(fut),mean(fut,63)),b0=bal.at(-1),b1=bal.at(-2),ratio=b=>b?b.end_stock/b.consumption*100:null;
    const pr=r=>r?r.brazil+r.eu+r.india+r.thailand:null,pg=pct(pr(prod.at(-1)),pr(prod.at(-2))),ig=pct(b0?.imports,b1?.imports);
    const up=fd!=null&&fd>=5,dn=fd!=null&&fd<=-5;
    const row=(name,mid,th,st,who,chart)=>({name,chart,st,mid:[...mid,th],end:[who]});
    renderBrief({
      headline:fd==null?'Chưa đủ giá đường thế giới để kết luận':up?'Giá đường thế giới tăng · lợi cho tự chủ mía, áp lực chi phí cho nhà nhập nguyên liệu':dn?'Giá đường thế giới giảm · áp lực cho tự chủ mía, nhẹ chi phí cho nhà nhập nguyên liệu':'Giá đường thế giới đi ngang · chưa có tín hiệu phân hóa rõ',
      segs:[['Tự chủ mía','',fd==null?'na':up?'up':dn?'down':'flat',fd==null?'Thiếu giá':'Giá TG '+(fd>0?'+':'')+num(fd,1)+'% vs TB 3T'],['Nhập nguyên liệu','',fd==null?'na':up?'down':dn?'up':'flat',fd==null?'Thiếu giá':up?'Đường thô đắt lên':dn?'Đường thô rẻ đi':'Trung tính']],
      headers:['Tín hiệu','Mới nhất','Kỳ trước','Ngưỡng','','Ai chịu'],
      score:[
        row('Sugar No.11 (kỳ hạn gần)',[S(v(fut),2,' cent/lb'),D(v(fut),p(fut),2)],'±10% vs TB 3T',fd==null?'na':fd<=-10?'risk':fd>=10?'good':Math.abs(fd)>=5?'watch':'info','Tự chủ mía · Nhập nguyên liệu','chWorldRecent'),
        row('Giá đường World Bank (tháng)',[S(v(wbm),2,' USD/kg'),D(v(wbm),wbm.at(-2)?.value,2)],'—',v(wbm)==null?'na':'info','Toàn ngành','chWorldRecent'),
        row('Tồn kho / tiêu thụ VN',[S(ratio(b0),1,'%'),D(ratio(b0),ratio(b1),1)],'Giảm qua các kỳ',b0&&b1?ratio(b0)<ratio(b1)?'good':'risk':'na','Toàn ngành','chStocks'),
        row('Nhập khẩu đường VN',[S(b0?.imports,0,' nghìn tấn'),D(b0?.imports,b1?.imports,0)],'±3% so năm trước',ig==null?'na':ig>3?'risk':ig<-3?'good':'info','Nhập nguyên liệu','chImports'),
        row('Cung 4 trung tâm (BR, EU, IN, TH)',[S(pr(prod.at(-1)),1,' triệu tấn'),D(pr(prod.at(-1)),pr(prod.at(-2)),1)],'±2% so năm trước',pg==null?'na':pg>=2?'risk':pg<=-2?'good':'info','Giá thế giới',null)],
      events:[['Từ 20/10','BCTC quý III'],['Đầu tháng','World Bank giá hàng hóa'],['Giữa tháng 11','USDA PSD cập nhật'],['Thường T11–T12','Mở vụ ép mới']]
    });
  }
  // Enter the requested tab at its decision board, avoiding the repeated hero.
  const enter=()=>requestAnimationFrame(()=>board.scrollIntoView({block:'start',behavior:'instant'}));
  document.querySelectorAll('.majortabbtn')[4]?.addEventListener('click',enter);
  if(location.hash==='#mt5')enter();
})();
