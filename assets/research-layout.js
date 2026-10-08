/* Research flow with a dedicated source register. Move original nodes to preserve data and listeners. */
(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const bank=document.body.dataset.sector==='bank',power=document.body.dataset.sector==='power',re=document.body.dataset.sector==='realestate',tx=document.body.dataset.sector==='textile',oil=!power&&!re&&!tx&&!!$('#chCurve');
const sector=bank?'bank':power?'power':re?'realestate':tx?'textile':oil?'oil':'sugar';document.body.dataset.researchSector=sector;
const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text)n.textContent=text;return n};
const pane=k=>$(`.majorpane[data-tab="mt${k}"]`),overview=pane(1),market=pane(2),policy=pane(4),hot=pane(7);
const legacyPlayerNodes=[...(bank?hot:pane(6)).children];
const sources=make('section','majorpane');sources.dataset.tab='mt8';sources.id='pane-mt8';sources.hidden=true;hot.after(sources);sources.append(make('h2','','Sources'),make('p','research-caption','Nguồn dữ liệu, kỳ quan sát và phạm vi sử dụng.'));
const world=$(bank?'#geo-pane-world':'#supply-world'),vn=$(bank?'#geo-pane-vn':'#supply-vietnam');
const block=id=>$(`[data-block-id="${id}"]`);
const grid=host=>{const n=make('div','research-grid');host.append(n);return n};
const pricesWorld=grid(world),pricesVN=grid(vn);
// Explicit geographic mapping, not inferred from titles.
if(bank){
 [...pane(3).children].filter(n=>!n.matches('.sectionhead')).forEach(n=>pricesVN.append(n));
 [...pane(6).children].forEach(n=>vn.append(n));
 [...hot.children].forEach(n=>overview.append(n));
 // A single-bank lending example belongs after the industry data and methods.
 const lending=$('#eib-lending')?.closest('.grid.two');
 const rateControls=$('#rate-window')?.closest('.rate-controls');
 const rateTable=$('#eib-table')?.closest('details');
 const rateSummary=$('#eib-summary');
 const example=make('details','research-fold bank-example');example.append(make('summary','','Ví dụ một ngân hàng · Eximbank (dữ liệu công bố)'));
 const exampleBody=make('div','research-detail');exampleBody.append(make('p','data-gap','Hiện mới xác minh được chuỗi lãi suất cho vay bình quân của Eximbank; chưa có cùng loại công bố cho các ngân hàng khác để mở bộ chọn ngân hàng mà vẫn so sánh đúng định nghĩa.'));[rateControls,lending,rateTable,rateSummary].forEach(n=>{if(n)exampleBody.append(n)});example.append(exampleBody);vn.append(example);
 const fx=$('#bank-fx');if(fx){const fxGroup=make('section','bank-fx-group');fxGroup.append(make('h3','','Tỷ giá & USD'),fx);vn.append(fxGroup)}
}else{
 const domestic=new Set(oil?['dau-khi-22','dau-khi-26']:power?['dien-14','dien-15','dien-16']:re?['bds-18','bds-41']:tx?['dm-10','dm-11','dm-12']:['sugar-06','sugar-12','sugar-13']); // real estate: pane A = Nhà ở, pane B = Khu công nghiệp
 $$('[data-tab="mt3"] .card').filter(n=>!n.parentElement.closest('.card')).forEach(n=>(domestic.has(n.dataset.blockId)?pricesVN:pricesWorld).append(n));
 if(oil){
  // Keep the two comparable refinery indicators together after geographic routing.
  const usgc=block('dau-khi-20'),singapore=block('dau-khi-singapore-crack');
  if(usgc&&singapore)pricesWorld.prepend(usgc,singapore);
 }
 $$('[data-tab="mt3"] .section').forEach(s=>[...s.children].filter(n=>!n.matches('.sectionhead,.grid')).forEach(n=>pricesVN.append(n)));
 const cycle=block(oil?'dau-khi-02':power?'dien-02':re?'bds-02':tx?'dm-02':'sugar-02');if(cycle){(re||tx?world:vn).append(cycle);cycle.prepend(make('p','research-caption',oil?'Phân tích AI ngày 03/09/2026 · chưa cập nhật theo số mới':power?'Phân tích AI ngày 06/10/2026':re||tx?'Phân tích AI ngày 08/10/2026':'Phân tích AI ngày 17/08/2026 · chưa cập nhật theo số mới'));}
 const kpis=overview.querySelector('.kpis');if(kpis)market.prepend(kpis);
 // All source/player detail stays available in Overview.
 [...pane(6).children].forEach(n=>overview.append(n));
 if(sector==='sugar'){['sugar-14','sugar-15','sugar-16'].forEach(id=>pricesVN.append(block(id)));[...hot.children].forEach(n=>overview.append(n));}
}
// Old panels can have multiple nodes (Sugar mt3); remove only after moving data.
$$('.majorpane[data-tab="mt3"],.majorpane[data-tab="mt6"]').forEach(n=>n.remove());
const marketHeading=market.querySelector('.sectionhead h2');marketHeading.textContent='Bức tranh ngành';
const mp=market.querySelector('.sectionhead p');if(mp)mp.textContent='Cung cầu → giá & chi phí → biên lợi nhuận.';
[[world,power?'Thủy văn & El Niño · giá than, LNG → chi phí phát điện':oil?'Cân bằng dầu → tồn kho → Brent & crack':bank?'Vốn quốc tế → chi phí USD → tỷ giá':re?'Tín dụng & lãi suất → nguồn cung mở bán → giá nhà & hấp thụ':tx?'Bán lẻ & tồn kho nhãn hàng → đơn hàng → xuất khẩu & thuế Mỹ':'Sản lượng → xuất khẩu → giá đường'],[vn,power?'Phụ tải → cơ cấu nguồn → giá điện & dòng tiền EVN':oil?'Sản lượng → nguồn nhập → giá bán & biên':bank?'Huy động → tín dụng → NIM → chi phí rủi ro':re?'FDI → lấp đầy & giá thuê → quỹ đất sẵn sàng':tx?'Bông, xơ PSF → chênh giá sợi → xuất khẩu sợi':'Vùng mía → tồn kho → giá bán so giá nguyên liệu']].forEach(([host,text])=>host.prepend(make('p','research-path',text)));
if(oil){
 // World: split into Giá sản phẩm / Cung-cầu & Tồn kho / Crack spread so each view stays short.
 const worldCaption=[...world.children].find(n=>n.matches('.research-path'));
 const tier1=[...world.children].find(n=>n.matches('h3.subhead')&&/Tầng 1/.test(n.textContent));if(tier1)tier1.remove();
 const tier2=[...vn.children].find(n=>n.matches('h3.subhead')&&/Tầng 2/.test(n.textContent));if(tier2)tier2.remove();
 const crackCards=[block('dau-khi-20'),block('dau-khi-singapore-crack')].filter(Boolean);
 const priceCards=[...pricesWorld.children].filter(n=>!crackCards.includes(n));
 const crackNote=vn.querySelector('.signal-line');
 const supplyChildren=[...world.children].filter(n=>n!==pricesWorld&&n!==worldCaption);
 const wPrice=make('div','supply-pane'),wSupply=make('div','supply-pane'),wCrack=make('div','supply-pane');
 wPrice.id='world-price';wSupply.id='world-supply';wCrack.id='world-crack';
 supplyChildren.forEach(n=>wSupply.append(n));
 const wPriceGrid=grid(wPrice);priceCards.forEach(n=>wPriceGrid.append(n));
 const wCrackGrid=grid(wCrack);crackCards.forEach(n=>wCrackGrid.append(n));
 if(crackNote)wCrack.prepend(crackNote);
 pricesWorld.remove();
 const worldTabs=make('div','world-subtabs');worldTabs.setAttribute('role','tablist');worldTabs.setAttribute('aria-label','Nội dung Thế giới');
 const worldPanes=[wPrice,wSupply,wCrack];
 function selectWorldSub(i){worldPanes.forEach((p,j)=>{p.hidden=i!==j;const b=worldTabs.children[j];b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1})}
 ['Giá sản phẩm','Cung-cầu & Tồn kho','Crack spread'].forEach((label,i)=>{
  const b=make('button','tabbtn',label);b.type='button';b.id='world-sub-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',worldPanes[i].id);worldPanes[i].setAttribute('role','tabpanel');worldPanes[i].setAttribute('aria-labelledby',b.id);
  b.addEventListener('click',()=>selectWorldSub(i));
  b.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%3;else if(e.key==='ArrowLeft')next=(i+2)%3;else if(e.key==='Home')next=0;else if(e.key==='End')next=2;if(next!==undefined){e.preventDefault();selectWorldSub(next);worldTabs.children[next].focus()}});
  worldTabs.append(b);
 });
 world.append(worldTabs,wPrice,wSupply,wCrack);selectWorldSub(0);
 // Vietnam: collapse long table/prose cards into dropdowns; charts stay visible outside the fold.
 ['dau-khi-18','dau-khi-19','dau-khi-26'].forEach(id=>{
  const c=block(id);if(!c)return;
  const h=c.querySelector('h3');
  const title=h?.childNodes[0]?.textContent?.trim()||h?.textContent?.trim()||'Chi tiết';
  fold(c,title);
  if(h)h.classList.add('research-repeated-heading');
 });
}
// Static roadmap focuses on economic roles, not a current market call.
const road=make('section','research-roadmap');road.append(make('h2','','Bản đồ ngành'),make('p','',tx?'Bông, xơ → kéo sợi → dệt nhuộm → may (CMT/FOB) → nhãn hàng Mỹ, EU, Nhật. Thuế quan và quy tắc xuất xứ quyết định ai được đơn.':re?'Quỹ đất & pháp lý → vốn (ngân hàng, trái phiếu, người mua trả trước) → phát triển → bán / cho thuê → người mua nhà, khách thuê FDI.':power?'Nhiên liệu & thủy văn → phát điện → EVN/EPTC mua, NSMO điều độ → truyền tải, phân phối → khách hàng. DPPA mở kênh bán trực tiếp.':oil?'Đầu tư & khai thác → xử lý dầu / khí → phân phối & tiêu thụ. Dịch vụ và vận tải hỗ trợ từng khâu.':bank?'Nguồn vốn → tài sản sinh lãi → thu nhập → chi phí vận hành & dự phòng → ROE.':'Vùng mía / nguyên liệu nhập → chế biến → phân phối → khách hàng công nghiệp & bán lẻ.'));
const steps=make('div','research-steps');
(tx?[['01 · Nguyên liệu','Bông nhập (Mỹ, Brazil, Úc), xơ polyester từ PTA/MEG. Giá bông và xơ quyết định biên của nhà sợi; nhà may nhập phần lớn vải và phụ liệu, chủ yếu từ Trung Quốc.'],['02 · Sợi & dệt nhuộm','Kéo sợi bán theo chênh lệch giá sợi – nguyên liệu và chịu phòng vệ thương mại ở Mỹ, Thổ Nhĩ Kỳ, Ấn Độ. Dệt nhuộm là khâu yếu nhất vì vướng môi trường, nên tỷ lệ vải tự sản xuất thấp.'],['03 · May & nhãn hàng','May gia công (CMT) hoặc mua nguyên liệu bán thành phẩm (FOB) cho nhãn hàng. Đơn hàng đi sau tồn kho và bán lẻ của nhãn hàng 1–2 quý; thuế Mỹ và quy tắc xuất xứ quyết định nước nào được chọn.']]:re?[['01 · Đất & pháp lý','Quỹ đất sạch, chấp thuận chủ trương, tiền sử dụng đất theo bảng giá đất mới quyết định khi nào dự án được mở bán. Pháp lý là nút thắt số một của nhà ở; với KCN là quyết định thành lập và đền bù giải phóng mặt bằng.'],['02 · Vốn & phát triển','Chủ đầu tư xoay vốn từ ngân hàng, trái phiếu và tiền người mua trả trước. Lãi suất, room tín dụng và lịch đáo hạn trái phiếu quyết định tốc độ triển khai và áp lực bán hàng.'],['03 · Bán hàng & cho thuê','Nhà ở ghi nhận doanh thu khi bàn giao, nên doanh số bán (presales) đi trước lợi nhuận 1–3 năm. KCN và cho thuê bán lẻ thu tiền theo hợp đồng thuê, phụ thuộc FDI và tỷ lệ lấp đầy.']]:power?[['01 · Nhiên liệu & nước','Than, khí/LNG nhập khẩu và thủy văn quyết định chi phí và khả năng phát của từng nhóm nhà máy. El Niño làm giảm nước về hồ thủy điện.'],['02 · Phát điện','Nhiệt điện, điện khí, thủy điện và năng lượng tái tạo bán điện qua hợp đồng PPA và thị trường bán buôn. Mức huy động và giá thị trường quyết định sản lượng và biên.'],['03 · Lưới & khách hàng','EVN/EPTC là bên mua chính; giá bán lẻ và tài chính EVN ảnh hưởng thanh toán cho nhà máy. Truyền tải, phân phối và DPPA mở đầu tư lưới cho xây lắp, thiết bị.']]:oil?[['01 · Nguồn cung','PVD: khoan; PVS: EPCI, kho nổi. Theo dõi hợp đồng, công suất và tiến độ.'],['02 · Chế biến','GAS: khí và hạ tầng; BSR: lọc dầu. Sản lượng, cơ cấu nguồn và biên chế biến quyết định hiệu quả.'],['03 · Đưa ra thị trường','PLX: phân phối; PVT: vận tải. Theo dõi sản lượng bán, tồn kho, cước và cơ cấu hợp đồng.']]:bank?[['01 · Giá vốn','CASA, tiền gửi KBNN và tái cấp vốn có thể hỗ trợ giá vốn, nhưng khác nhau về độ ổn định và điều kiện tiếp cận. Trái phiếu, chứng chỉ tiền gửi và liên ngân hàng cũng bổ sung vốn với chi phí riêng.'],['02 · Phân bổ vốn','Cơ cấu khách hàng, ngành nghề và kỳ hạn cho vay quyết định lợi suất, rủi ro và nhu cầu vốn; so với kỳ hạn huy động và tỷ lệ an toàn.'],['03 · Lợi nhuận & vốn','Tăng trưởng dư nợ, NIM, thu phí ròng, CIR và dự phòng tác động ROE. Cổ tức và kế hoạch tăng vốn quyết định khả năng giữ vốn cho tăng trưởng.']]:[['01 · Nguyên liệu','SLS, LSS, KTS: vùng mía và hiệu suất nhà máy; SBT: thêm vai trò nguyên liệu nhập và thương mại.'],['02 · Sản xuất','Giá mía, chữ đường và công suất quyết định giá thành. QNS cần tách mảng đường với các mảng khác.'],['03 · Tiêu thụ','Giá bán, tồn kho và cơ cấu khách hàng quyết định khả năng chuyển chi phí.']]).forEach(([title,body])=>{const n=make('article');n.append(make('h3','',title),make('p','',body));steps.append(n)});road.append(steps);overview.prepend(road);
// Industry mechanisms precede the financial comparison; company deep-dives get their own dashboards.
const chain=bank?overview.querySelector('.flow-scroll')?.closest('.card'):block(oil?'dau-khi-01':power?'dien-01':re?'bds-01':tx?'dm-01':'sugar-01');
const originalIntro=overview.querySelector('.sectionhead');if(originalIntro){road.before(originalIntro);originalIntro.querySelector('h2').textContent='Tổng quan ngành '+(oil?'dầu khí':bank?'ngân hàng':power?'điện':re?'bất động sản':tx?'dệt may':'đường');}
if(chain)road.after(chain);
const business=make('section','business-models');business.append(make('h2','','Doanh nghiệp kiếm tiền như thế nào?'));const bmGrid=make('div','business-model-grid');business.append(bmGrid);
const models=tx?[
 ['TCM · TNG · MSH · GIL','May xuất khẩu','Nhận đơn của nhãn hàng Mỹ, EU, Nhật, Hàn theo hình thức gia công (CMT, chỉ thu phí may) hoặc FOB (tự mua vải, phụ liệu, biên cao hơn nhưng chịu rủi ro giá nguyên liệu). Doanh thu theo số đơn và đơn giá; chi phí lớn nhất là lương. Rủi ro chính: thuế Mỹ, tồn kho của nhãn hàng, tỷ giá và thiếu lao động.'],
 ['STK · ADS','Sợi','STK kéo sợi filament polyester từ chip PET, ADS kéo sợi cotton và cotton pha. Thu nhập theo chênh lệch giá sợi – giá xơ, bông và hiệu suất máy; cạnh tranh trực tiếp với sợi Trung Quốc. STK còn chịu các vụ chống bán phá giá sợi polyester ở nước ngoài.'],
 ['VGT','Tập đoàn dệt may','Vinatex sở hữu hàng chục công ty sợi, dệt, may; lợi nhuận phần lớn đến từ công ty liên kết và cổ tức. Đọc như một rổ cả chuỗi, nhạy với giá sợi hơn các nhà may thuần.']
]:re?[
 ['VHM · NVL · KDH · NLG · DXG · PDR · DIG · CEO · AGG · TCH · NTL','Phát triển nhà ở','Mua quỹ đất, xin pháp lý, xây và bán căn hộ, nhà thấp tầng, đất nền. Tiền người mua trả trước được ghi là nợ phải trả cho tới khi bàn giao, nên lợi nhuận kế toán đi sau doanh số bán 1–3 năm. Biên gộp phụ thuộc giá đất đầu vào, tiền sử dụng đất và giá bán sơ cấp; rủi ro lớn nhất là pháp lý dự án và lịch trả nợ trái phiếu, vay ngân hàng.'],
 ['KBC · IDC · BCM · SZC · SIP · VGC · LHG','Khu công nghiệp','Đền bù, san lấp và cho thuê đất công nghiệp theo hợp đồng dài hạn (thường trả tiền một lần hoặc theo kỳ), kèm dịch vụ hạ tầng, nước, điện. Doanh thu phụ thuộc diện tích sẵn sàng cho thuê, FDI đăng ký mới và giá thuê; quỹ đất đã đền bù là tài sản quyết định.'],
 ['VRE','Cho thuê bán lẻ','Vận hành trung tâm thương mại, thu tiền thuê cố định và theo doanh thu khách thuê. Dòng tiền ổn định hơn phát triển nhà ở; nhạy với sức mua, tỷ lệ lấp đầy và lịch mở trung tâm mới.'],
 ['DXS','Môi giới','Phí môi giới theo giao dịch sơ cấp, nên doanh thu bám sát số căn mở bán và hấp thụ của toàn thị trường; biên mỏng, biến động mạnh theo chu kỳ.']
]:power?[
 ['POW · NT2 · PPC · QTP · HND · BTP','Nhiệt điện than & khí','Bán điện cho EVN theo hợp đồng PPA (giá công suất + giá điện năng gắn chi phí nhiên liệu) và một phần trên thị trường bán buôn. Lợi nhuận phụ thuộc mức huy động, giá thị trường và cơ chế chuyển ngang giá than/khí; khấu hao và lãi vay giảm dần khi nhà máy già đi.'],
 ['REE · VSH · CHP · SBA · TMP · SHP','Thủy điện','Chi phí biến đổi gần như bằng 0, nên sản lượng theo thủy văn quyết định lợi nhuận. Năm nước nhiều tăng sản lượng và giá thị trường thường thấp; El Niño làm giảm nước về nhưng giá thị trường có thể cao hơn. REE còn có mảng nước, cơ điện và bất động sản.'],
 ['GEG · HDG · TTA','Năng lượng tái tạo','Điện mặt trời và điện gió bán theo giá FIT hoặc khung giá chuyển tiếp; rủi ro chính là cắt giảm công suất, đàm phán lại giá và thanh toán chậm. Dự án mới phụ thuộc Quy hoạch điện VIII và cơ chế DPPA.'],
 ['PC1 · TV2 · GEX','Xây lắp, tư vấn & thiết bị lưới','Hưởng lợi từ vốn đầu tư truyền tải, phân phối và nguồn mới theo Quy hoạch điện VIII. Doanh thu ghi nhận theo tiến độ hợp đồng; backlog và tốc độ giải ngân của EVN/NPT quyết định tăng trưởng.']
]:oil?[
 ['GAS','Khí & hạ tầng','Thu gom, xử lý, vận chuyển và kinh doanh khí; kết nối nguồn khí trong nước, LNG với điện, đạm và công nghiệp. Doanh thu gồm giá khí × sản lượng và dịch vụ hạ tầng. Cơ cấu nguồn và điều khoản giá quyết định phần biên giữ lại.'],
 ['BSR','Lọc hóa dầu','Mua dầu thô, chế biến thành xăng, diesel và sản phẩm khác tại Dung Quất. Thu nhập phụ thuộc chênh lệch giá sản phẩm–nguyên liệu, cơ cấu dầu đầu vào và chi phí chế biến. Bảo dưỡng và đánh giá hàng tồn kho có thể làm lợi nhuận quý biến động.'],
 ['PLX','Phân phối xăng dầu','Mua và phân phối xăng dầu qua hệ thống bán buôn, bán lẻ. Quy mô bán và phần biên trên mỗi lít quan trọng hơn riêng giá dầu. Cơ chế điều hành giá, độ trễ giá vốn và vòng quay tồn kho cùng ảnh hưởng lợi nhuận.'],
 ['PVD','Khoan & dịch vụ giếng','Cho thuê giàn khoan và cung cấp dịch vụ kỹ thuật giếng. Doanh thu khoan hình thành từ số ngày hoạt động và đơn giá thuê; chi phí cố định khiến hiệu suất sử dụng giàn tác động mạnh tới lợi nhuận. Hợp đồng mới thường đi sau quyết định đầu tư thượng nguồn.'],
 ['PVS','Dịch vụ kỹ thuật & EPCI','Thiết kế, mua sắm, chế tạo, lắp đặt công trình dầu khí và cung cấp các dịch vụ kỹ thuật. Doanh thu dự án ghi nhận theo tiến độ; dòng tiền phụ thuộc nghiệm thu và thanh toán. Kho nổi và liên doanh có cơ chế ghi nhận lợi nhuận riêng.'],
 ['PVT','Vận tải dầu, khí & hóa chất','Khai thác đội tàu theo hợp đồng dài hạn hoặc thị trường giao ngay. Doanh thu dựa trên cước và ngày khai thác; lợi nhuận còn phụ thuộc nhiên liệu, khấu hao, lãi vay và thời gian tàu ngừng hoạt động. Giá dầu tăng không tự đồng nghĩa lợi nhuận tăng.']
]:bank?[
 ['VCB · CTG · BID','Ngân hàng thương mại','Huy động vốn và cung cấp tín dụng, thanh toán cùng dịch vụ tài chính. Cơ cấu khách hàng và kỳ hạn tái định giá quyết định NIM; chi phí dự phòng và vốn an toàn giới hạn phần lợi nhuận có thể giữ lại.'],
 ['TCB · VPB · MBB','Ngân hàng & hệ sinh thái','Ngoài tín dụng, thu nhập có thể đến từ thanh toán, phân phối sản phẩm tài chính và công ty con. Cần tách thu nhập thường xuyên với thu nhập đầu tư hoặc khoản một lần; không coi các ngân hàng trong nhóm có cùng mức rủi ro.'],
 ['ACB · HDB · TPB · VIB · SHB','Cơ cấu khách hàng khác nhau','Tỷ trọng bán lẻ, doanh nghiệp và nguồn tiền gửi tạo khác biệt về lợi suất, chi phí vốn và chất lượng tài sản. So NIM cùng CASA, NPL và dự phòng để hiểu ROE, thay vì chỉ so quy mô tín dụng.']
]:[
 ['SBT','Mía đường & thương mại','Kết hợp vùng nguyên liệu, chế biến, tinh luyện và phân phối đường. Tỷ trọng đường từ mía, nguyên liệu nhập và thương mại làm doanh thu và biên khác doanh nghiệp chỉ ép mía; cần đọc cơ cấu sản phẩm cùng quy mô doanh thu.'],
 ['QNS','Đường & thực phẩm','Mảng đường gắn với vùng mía, chế biến và sản phẩm phụ; công ty còn có các hoạt động thực phẩm, đồ uống. Biên và ROE hợp nhất không phải hiệu quả riêng mảng đường.'],
 ['SLS · LSS · KTS','Vùng mía & nhà máy','Thu mua mía, ép và bán đường cùng sản phẩm phụ. Năng suất mía, chữ đường, công suất thực chạy và giá mía ảnh hưởng giá thành; mùa ép và tồn kho làm dòng tiền khác thời điểm ghi nhận lợi nhuận.']
];
models.forEach(([tickers,title,text])=>{const c=make('article','business-model');c.append(make('span','business-ticker',tickers),make('h3','',title),make('p','',text));bmGrid.append(c)});
(chain||road).after(business);
const comp=make('section','financial-comparison');comp.id=bank?'bank-valuation':'company-comparison';business.after(comp);
if(bank){
 const framework=make('section','bank-framework card');framework.innerHTML=`<h2>Đọc ngân hàng qua ba lớp</h2><div class="bank-framework-grid"><div><h3>Sinh lời & tăng trưởng</h3><p>Dư nợ, NII, NFI và lợi nhuận: xem mức tuyệt đối cùng tăng trưởng YoY. NIM, NFI/TOI, CIR, ROA, ROE: so cùng kỳ và cùng định nghĩa. Tách chi phí dự phòng / tổng tài sản bình quân và / dư nợ bình quân.</p><p>Cổ tức tiền mặt, cổ tức cổ phiếu và kế hoạch phát hành/tăng vốn là sự kiện từng ngân hàng; kiểm tác động tới vốn và số cổ phiếu trước khi suy khả năng tăng tín dụng.</p></div><div><h3>Cơ cấu & chất lượng bảng cân đối</h3><p>Đọc ngành cho vay, nhóm khách hàng chiếm tỷ trọng đáng kể và kỳ hạn cho vay so với kỳ hạn huy động. Mốc 5% chỉ là bộ lọc hiển thị đề xuất, không phải chuẩn pháp lý.</p><p>Đọc dư nợ nhóm 2, tỷ lệ NPL, số dư NPL và tốc độ hình thành nợ xấu cùng chuỗi quá khứ. Cần dữ liệu chuyển nhóm và thu hồi để tính hình thành nợ xấu đúng nghĩa.</p></div></div><p class="data-gap">Bảng so sánh public hiện có ROA, ROE, CIR và tăng trưởng tổng thu nhập; các cột còn lại cần đối chiếu BCTC cùng mẫu trước khi hiển thị. Không suy số thiếu bằng 0. Thuyết minh vay/huy động theo USD–VND chưa được chuẩn hóa theo từng ngân hàng; số huy động ngoại tệ không tự chứng minh khả năng vay offshore.</p>`;comp.before(framework);
 const services=$('#bank-services-demand');if(services)services.insertAdjacentHTML('beforeend','<p class="data-gap">Chưa có bộ doanh thu và lợi nhuận toàn ngành riêng cho chứng khoán, bảo lãnh thanh toán cùng định nghĩa. Chỉ số nhu cầu dịch vụ phía trên là proxy, không thay cho doanh thu hoặc lợi nhuận thu phí đã ghi nhận.</p>');
 const funding=$('#bank-funding');if(funding)funding.insertAdjacentHTML('beforeend','<p class="data-gap">Wi đã có M2 (tổng phương tiện thanh toán) nhưng bộ snapshot này chưa có chuỗi tiền mặt lưu thông cùng định nghĩa; chưa tính tỷ lệ tiền mặt/M2.</p>');
 const bonds=$('#bank-bonds');if(bonds)bonds.insertAdjacentHTML('beforeend','<p class="data-gap">Chuỗi trái phiếu hiện chỉ có phát hành ngân hàng năm 2026 từ dữ liệu Wi đã lưu. Cần bổ sung các năm trước, coupon bình quân từng năm, tháng 9/2026 và cơ cấu ngành của toàn thị trường trước khi kết luận xu hướng dịch chuyển từ vay ngân hàng sang trái phiếu.</p>');
 const methods=make('section','majorpane');methods.dataset.tab='mt9';methods.id='pane-mt9';methods.hidden=true;methods.innerHTML=`<div class="sectionhead"><h2>Methodology · cách tính và giới hạn</h2></div><div class="grid two"><article class="card"><h3>Tăng trưởng & biên</h3><p>Tăng trưởng YoY = (giá trị kỳ này / cùng kỳ năm trước − 1) × 100. YTD so với cuối năm trước; hai tỷ lệ trả lời hai câu hỏi khác nhau. NIM = thu nhập lãi thuần / tài sản sinh lãi bình quân theo định nghĩa nguồn. NFI/TOI = thu phí thuần / tổng thu nhập hoạt động, không đồng nghĩa toàn bộ thu ngoài lãi.</p><p>ROA/ROE dùng lợi nhuận và tài sản/vốn bình quân; CIR = chi phí hoạt động / tổng thu nhập hoạt động. Xem kỳ riêng và cách annualize trong nguồn từng bảng.</p></article><article class="card"><h3>Chất lượng tài sản & vốn</h3><p>NPL ratio = dư nợ nhóm 3–5 / dư nợ cho vay. Tỷ lệ nhóm 2 = dư nợ nhóm 2 / dư nợ cho vay. Dư nợ NPL là số tuyệt đối; tỷ lệ có thể giảm chỉ vì mẫu số tăng. Chi phí dự phòng / tổng tài sản bình quân và / dư nợ bình quân dùng hai mẫu số riêng.</p><p>Hình thành nợ xấu gộp cần số chuyển vào nhóm 3–5 trừ các luồng đảo chiều theo một định nghĩa nhất quán; biến động số dư NPL không phải chỉ số này.</p></article><article class="card"><h3>Giá vốn, kỳ hạn & room</h3><p>Tiền gửi dân cư/TCKT, giấy tờ có giá, KBNN, liên ngân hàng và tái cấp vốn khác kỳ hạn, điều kiện sử dụng và giá vốn. Repricing gap theo bucket kỳ hạn cần đối chiếu biến động NIM thực tế; gap tổng RSA−RSL không cho biết tốc độ tái định giá.</p><p>Room từng ngân hàng phụ thuộc thông báo NHNN, định hướng chính sách và an toàn vốn; dữ liệu ngành không thay cho room được giao.</p></article><article class="card"><h3>Nguồn và thời điểm</h3><p>Wi cập nhật tự động qua connector: lãi suất, tỷ giá, TPCP, định giá mỗi sáng ngày làm việc; tiền gửi, tín dụng, dự báo, TPDN kiểm thứ Hai hằng tuần; số BCTC quý cập nhật khi có yêu cầu. Eximbank là một ngân hàng và số công bố riêng; DXY trong Wi là futures. Các nguồn pháp lý và tin công bố được đọc theo sự kiện. Mỗi card giữ kỳ quan sát, nguồn, bảng gốc và cảnh báo dữ liệu.</p><p>Thông tin analyst tự nhập và rumor là nội dung cần xác minh, không được cộng vào số liệu ngành hoặc dùng làm bằng chứng đã kiểm.</p></article></div>`;sources.after(methods);
}
// Retired company charts no longer appear in Overview; retain provenance/limitations in Sources.
const retired=make('details','research-fold');retired.append(make('summary','','Nguồn của dữ liệu doanh nghiệp đã rút khỏi Tổng quan'));const retiredBody=make('div','research-detail');retired.append(retiredBody);
function preserveProvenance(node){
 node.querySelectorAll('.data-gap,.gap-row').forEach(n=>{if(n.closest('table')){const p=make('p','data-gap',n.textContent);retiredBody.append(p)}else retiredBody.append(n)});
 const links=new Map();node.querySelectorAll('a[href^="http"]').forEach(a=>links.set(a.href,a));links.forEach(a=>retiredBody.append(a.cloneNode(true)));
}
if(bank){
 const registry=$('#source-rows')?.closest('.table-scroll');const title=registry?.previousElementSibling;if(title?.matches('.sectionhead'))sources.append(title);if(registry)sources.append(registry);
 const kpis=overview.querySelector('.kpis');if(kpis)market.prepend(kpis);
}
legacyPlayerNodes.forEach(n=>{if(overview.contains(n)){preserveProvenance(n);n.remove()}});
if(retiredBody.children.length)sources.append(retired);
const credibility=block('dau-khi-04');if(credibility)sources.append(credibility);
$$('.classification-key,.global-gap,.update-legend').forEach(n=>sources.append(n));
$$('.card').filter(n=>/Nguồn chưa gắn được đường dẫn|Nguồn dữ liệu và khả năng tự động cập nhật/.test(n.querySelector('h3')?.textContent||'')).forEach(n=>sources.append(n));
$$('.thesis-source-row').forEach(n=>{const wrap=make('section','source-register');wrap.append(make('h3','','Nguồn của bản phân tích Catalyst/Risk'),n);sources.append(wrap)});
window.FinancialComparison?.mount(comp,{sector,sources});
// Remove the previous summary from the product flow; source metadata remains in Sources.
const hero=$('.hero');if(hero){const header=make('header','research-header');header.append(make('h1','',oil?'Dầu khí':bank?'Ngân hàng':power?'Điện':re?'Bất động sản':tx?'Dệt may':'Đường'));hero.before(header);preserveProvenance(hero);hero.remove();}
$$('footer,.footer').forEach(n=>{if(!n.closest('.card'))n.remove()});
if(bank){const filter=$('.bank-filter');if(filter){pane(5).prepend(filter);filter.querySelector('p').textContent='Chọn ngân hàng cho góc nhìn analyst và tín hiệu theo dõi. Số liệu toàn ngành giữ phạm vi ghi trên từng biểu đồ.'}}
// Stick geography below the global navigation, including responsive header height.
const geography=market.querySelector(bank?'.subtabs':'.supply-tabs');geography?.classList.add('sticky-geography');
function stickyOffset(){const nav=$('.majortabbtn')?.closest('.majortabs,.major-tabs');let top=0;[$('.site-navigation-shell'),$('.topbar'),nav].filter(Boolean).forEach(n=>{const style=getComputedStyle(n);if(style.position==='sticky'||style.position==='fixed')top=Math.max(top,parseFloat(style.top||0)+n.getBoundingClientRect().height)});document.documentElement.style.setProperty('--geography-top',top+'px')}
window.addEventListener('resize',stickyOffset);requestAnimationFrame(stickyOffset);
if(window.ResizeObserver){const resize=new ResizeObserver(stickyOffset);[$('.site-navigation-shell'),$('.topbar'),$('.majortabbtn')?.closest('.majortabs,.major-tabs')].filter(Boolean).forEach(n=>resize.observe(n))}
window.ResearchSources=sources;

// Disclosure keeps source nodes and visible limitation siblings intact.
function fold(card,title,opts={}){
 const d=make('details','research-fold'),summary=make('summary','',title),body=make('div','research-detail');
 d.append(summary,body);const children=[...card.children];children.forEach(n=>{if(!opts.all&&(n.matches('.data-gap,.gap-row')||n.querySelector('.data-gap,.gap-row')))return;body.append(n)});if(opts.open)d.open=true;card.prepend(d);return {d,body,summary};
}
// Numbers with units, percentages and dates stand out inside prose; chart captions, links, code and tables are left alone.
const UNIT='(?:%|đ/kWh|đồng/kWh|tỷ kWh|triệu kWh|GW|MW|USD/tấn|USD/MMBtu|°C|điểm %|điểm phần trăm|USD/thùng|USD/kg|US cent/lb|USD|k đ/kg|đ/kg|đồng/lít|đ/lít|triệu thùng/ngày|triệu thùng|mb/d|nghìn tấn|triệu tấn|tấn|lượt tàu/ngày|lượt/ngày|lượt tàu|lượt|tàu/ngày|tỷ USD|tỷ m³|triệu m³|nghìn ha|tỷ đồng|triệu tỷ|x)';
const NUM='[+\\-−]?\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d+)?';
const KEY=new RegExp('(?<![\\w/.,\\-])('+NUM+'(?:\\s?[–\\-]\\s?'+NUM+')?\\s?'+UNIT+'|\\d{2}/\\d{2}/\\d{4}|\\d{2}/\\d{2}/\\d{2})(?![\\w/%])','g');
function emphasize(root){
 if(!root||root.dataset.emphasized)return;root.dataset.emphasized='1';
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>(n.parentElement.closest('table')&&!n.parentElement.closest('.compare-table'))||n.parentElement.closest('a,code,svg,button,input,textarea,select,label,.chart-title,.chart-sub,.chart-caveat,.chart-freshness,.chart-source-line,.key-number,.key-phrase,.thesis-metric,.thesis-period,.thesis-state,.research-caption,.cadence-note,.source-note,.source-links,.srcrow,.data-gap,.gap-row,.research-editor')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(t=>{const text=t.nodeValue;if(!KEY.test(text)){KEY.lastIndex=0;return}KEY.lastIndex=0;const frag=document.createDocumentFragment();let last=0;text.replace(KEY,(m,_g,offset)=>{frag.append(text.slice(last,offset));frag.append(make('b','key-number',m));last=offset+m.length;return m});frag.append(text.slice(last));t.replaceWith(frag)});
}
const policyTitles={'bds-19':'Luật Đất đai 2024 · bảng giá đất','bds-20':'Nhà ở, kinh doanh BĐS & nhà ở xã hội','bds-21':'Tín dụng & trái phiếu BĐS','dien-17':'Giá điện · cơ chế điều chỉnh','dien-18':'Quy hoạch điện VIII & chuyển dịch','dien-19':'DPPA, điện mái nhà & thị trường điện','dau-khi-27':'Điều hành giá xăng dầu','dau-khi-28':'Luật Dầu khí 2026 · khung tác động','sugar-17':'Hạn ngạch & thuế nhập khẩu','sugar-18':'Phòng vệ thương mại · các mốc thay đổi'};
const policyCards=[...policy.querySelectorAll('.card')].filter(n=>!n.parentElement.closest('.card'));
const impacts=new Map();
policyCards.forEach((c,i)=>{const h=c.querySelector('h3,.chart-title'),title=policyTitles[c.dataset.blockId]||h?.childNodes[0]?.textContent?.trim()||'Chính sách phòng vệ thương mại';const f=fold(c,title);if(h)h.classList.add('research-repeated-heading');const p=make('p','research-caption',tx?({'dm-15':'Tác động: chi phí lao động, thuế và tuân thủ môi trường của nhà may · qua lương tối thiểu, BHXH, EPR và yêu cầu xanh EU.','dm-16':'Tác động: sản lượng và giá bán sợi xuất khẩu của STK · qua thuế chống bán phá giá ở Mỹ, Thổ Nhĩ Kỳ, Ấn Độ, Brazil.'}[c.dataset.blockId]||'Tác động: chi phí và đơn hàng của doanh nghiệp dệt may.'):re?({'bds-19':'Tác động: tiền sử dụng đất và giá vốn quỹ đất của chủ đầu tư · qua bảng giá đất và phương pháp định giá.','bds-20':'Tác động: tốc độ cấp phép, mở bán và cầu nhà ở xã hội · qua điều kiện kinh doanh và gói tín dụng.','bds-21':'Tác động: chi phí vốn và khả năng đảo nợ · qua room tín dụng, hệ số rủi ro và điều kiện phát hành trái phiếu.'}[c.dataset.blockId]||'Tác động: dòng tiền chủ đầu tư · qua pháp lý và vốn.'):power?({'dien-17':'Tác động: dòng tiền EVN và khả năng thanh toán cho nhà máy · theo từng kỳ điều chỉnh giá.','dien-18':'Tác động: PC1, TV2, GEX và dự án nguồn mới · qua danh mục dự án và vốn đầu tư lưới.','dien-19':'Tác động: GEG, HDG, TTA và nhà máy bán điện trên thị trường · qua cơ chế giá và khách hàng mua trực tiếp.'}[c.dataset.blockId]||'Tác động: giá bán và sản lượng của nhà máy điện · khác nhau theo loại nguồn.'):oil?(c.dataset.blockId!=='dau-khi-28'?'Tác động: PLX và khâu phân phối · trong quý · qua cơ chế giá và vòng quay tồn kho.':'Tác động: PVD/PVS trước, GAS và sản lượng sau · qua tiến độ đầu tư và hợp đồng.') :bank?'Tác động: vốn, thanh khoản và khả năng tăng tín dụng · mức độ khác nhau theo bảng cân đối từng ngân hàng.':'Tác động: giá nhập quy đổi và cạnh tranh nội địa · khác nhau giữa doanh nghiệp tự chủ mía và nhập nguyên liệu.');f.body.prepend(p);impacts.set(p.textContent,[...(impacts.get(p.textContent)||[]),p]);});
// A transmission line shared by several cards is said once under the section heading.
const policyHead=policy.querySelector('.sectionhead');impacts.forEach((ps,text)=>{if(ps.length<2)return;ps.forEach(n=>n.remove());const once=make('p','research-caption policy-impact',text);(policyHead||policy).after(once)});
policy.querySelectorAll('.sectionhead h2').forEach(h=>h.textContent='Chính sách · Thuế · Thương mại');
// Compact chart labels. Unit, observation period, source and warning stay intact.
const titles={chCrudeStock:'Tồn kho dầu thô Mỹ',chProdStock:'Tồn kho sản phẩm Mỹ',chDistYear:'Mùa vụ tồn kho diesel Mỹ',chCushing:'Tồn kho Cushing',chUsProd:'Sản lượng dầu Mỹ',chSpare:'Công suất dự phòng & gián đoạn',chCftc:'Vị thế quỹ WTI',chGasVol:'Khí & LNG Việt Nam',chMarginCompare:'Biên gộp mảng đường',chFastPrice:oil?'Brent Futures':power?'':'Sugar No.11 Futures',chHormuzM:'Tàu qua Hormuz',chCrack:'Crack spread',chBrentM:'Brent',chBrentY:'Brent · bình quân năm',chCurve:'Đường cong WTI',chWorldSD:'Cung cầu dầu toàn cầu',chWorldBalance:'Cung trừ cầu',chWorldRecent:'Giá đường thế giới',chWorldLong:'Giá đường · bình quân năm',chVnPrice:'Giá đường Việt Nam',chRetailFuel:'Giá bán lẻ xăng dầu',chVnUpstream:'Sản lượng dầu & khí Việt Nam'};
Object.entries(titles).forEach(([id,title])=>{if(!title)return;const c=$('#'+id)?.closest('.viz-block,.card'),h=c?.querySelector('.chart-title');if(h){const t=[...h.childNodes].find(n=>n.nodeType===3);if(t)t.textContent=title;}});
// Own the six primary routes while preserving historical #mt3/#mt6 links.
const nav=$('.majortabbtn').parentElement;nav.replaceChildren();nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Các phần nghiên cứu');
const routes=[['mt1','Tổng quan ngành'],['mt2','Bức tranh ngành'],['mt4','Policy · Tax · Trade'],['mt5','Catalyst · Risk'],['mt7','Chủ đề nóng'],...(re?[['mt10','Vốn & Trái phiếu'],['mt11','Pháp lý dự án']]:[]),['mt8','Sources'],...(bank?[['mt9','Methodology']]:[])];
function select(key,hash=false){key=key==='mt3'?'mt2':key==='mt6'?(bank?'mt2':'mt1'):key;if(!routes.some(r=>r[0]===key))key='mt1';$$('.majorpane').forEach(p=>{const active=p.dataset.tab===key;p.hidden=!active;p.classList.toggle('active',active)});[...nav.children].forEach(b=>{const active=b.dataset.tab===key;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});if(hash)history.replaceState(null,'','#'+key);return key;}
routes.forEach(([key,label],i)=>{const b=make('button','majortabbtn',`${i+1}. ${label}`);b.type='button';b.dataset.tab=key;b.id='research-tab-'+key;b.setAttribute('role','tab');const p=pane(Number(key.slice(2)));p.id=p.id||'pane-'+key;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);b.setAttribute('aria-controls',p.id);b.addEventListener('click',()=>{select(key,true);window.scrollTo({top:0,behavior:'instant'})});b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?routes.length-1:(i+(e.key==='ArrowRight'?1:routes.length-1))%routes.length;nav.children[j].click();nav.children[j].focus()});nav.append(b)});
window.showMajorTab=key=>select(key,true);window.addEventListener('hashchange',()=>select(location.hash.slice(1)));select(location.hash.slice(1));
// Interactive futures: frequency changes aggregation; range only filters observations.
const fastSrc=window.SECTOR_DAILY?.sources||{},powerFeed=['coal_newcastle','lng_jkm'].find(k=>fastSrc[k]?.records?.length)||'coal_newcastle';
const feed=fastSrc[oil?'brent_futures':power?powerFeed:'sugar_futures'],chart=$('#chFastPrice');
const fastName=oil?'Brent Futures':power?(powerFeed==='coal_newcastle'?'Than Newcastle':'LNG JKM'):'Sugar No.11 Futures',fastUnit=oil?'USD/thùng':power?(powerFeed==='coal_newcastle'?'USD/tấn':'USD/MMBtu'):'US cent/lb';
if(chart&&feed?.records?.length){
 const card=chart.closest('.card'),control=make('div','chart-explore'),freq=make('select'),range=make('select'),start=make('input'),end=make('input');
 freq.id='price-frequency';range.id='price-range';start.id='price-from';end.id='price-to';start.type=end.type='date';
 [['day','Ngày'],['week','Tuần'],['month','Tháng'],['year','Năm']].forEach(([v,t])=>{const o=make('option','',t);o.value=v;freq.append(o)});
 [['90','3 tháng'],['365','1 năm'],['all','Toàn bộ'],['custom','Tùy chọn']].forEach(([v,t])=>{const o=make('option','',t);o.value=v;range.append(o)});
 [[freq,'Kỳ'],[range,'Khoảng'],[start,'Từ'],[end,'Đến']].forEach(([n,t])=>{const l=make('label','',t);l.htmlFor=n.id;control.append(l,n)});
 const raw=feed.records,startDate=raw[0].date,endDate=raw.at(-1).date;start.min=end.min=startDate;start.max=end.max=endDate;start.value=startDate;end.value=endDate;
 const status=make('p','research-caption');status.setAttribute('aria-live','polite');chart.before(control);chart.after(status);
 const details=make('details','dtable');details.append(make('summary','','Bảng dữ liệu đang xem'));const tablewrap=make('div','tablewrap'),table=make('table');tablewrap.append(table);details.append(tablewrap);card.append(details);
 function draw(){
  start.disabled=end.disabled=range.value!=='custom';const last=new Date(endDate+'T00:00:00Z');if(range.value!=='all'&&range.value!=='custom')last.setUTCDate(last.getUTCDate()-Number(range.value));
  const from=range.value==='custom'?start.value:range.value==='all'?startDate:last.toISOString().slice(0,10),to=range.value==='custom'?end.value:endDate;
  if(!from||!to||from>to){chart.replaceChildren();table.replaceChildren();status.textContent='Chọn ngày bắt đầu không sau ngày kết thúc.';return}
  const rs=window.SectorMath.periodClose(raw.filter(r=>r.date>=from&&r.date<=to),freq.value);
  if(!rs.length){chart.replaceChildren();table.replaceChildren();status.textContent='Không có dữ liệu trong khoảng đã chọn.';return}
  barLineChart('chFastPrice',{categories:rs.map(r=>r.date),series:[{name:fastName+(!oil&&!power&&feed.symbol&&feed.symbol!=='SB=F'?' · hợp đồng '+feed.symbol.replace('.NYB',''):''),kind:'line',color:'#2938A8',values:rs.map(r=>r.value)}],unit:fastUnit,digits:2,height:270,zeroBase:false});
  status.textContent=rs.length+' điểm · '+from+' → '+to+(freq.value==='day'?'':' · close cuối mỗi kỳ, kỳ đầu/cuối có thể chưa đủ')+(feed.symbol&&feed.symbol!=='SB=F'&&!oil&&!power?' · Một hợp đồng '+feed.symbol.replace('.NYB','')+' (Yahoo không trả đủ chuỗi SB=F); không ghép các hợp đồng.':'');
  table.replaceChildren();const h=make('tr');['Kỳ','Phiên quan sát','Giá đóng cửa'].forEach(t=>h.append(make('th','',t)));table.append(h);rs.forEach(r=>{const tr=make('tr');[r.date,r.last_date,r.value===null?'—':r.value.toLocaleString('vi-VN',{maximumFractionDigits:2})].forEach(t=>tr.append(make('td','',t)));table.append(tr)});
 }
 [freq,range,start,end].forEach(n=>n.addEventListener('change',draw));draw();
 const foot=card.querySelector('.chart-footer');foot?.querySelectorAll('.method-note').forEach(n=>{n.textContent=n.textContent.replace('90 phiên gần nhất,','Lọc khoảng ngày theo bộ chọn; tuần/tháng/năm lấy giá đóng cửa cuối có số,')});
}
window.ResearchLayout={sector,make,fold,emphasize,hot,select,sources};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const d=document.activeElement?.closest('details.research-fold');if(d?.open){d.open=false;d.querySelector('summary').focus()}}});
})();
