/* Research flow with a dedicated source register. Move original nodes to preserve data and listeners. */
(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const bank=document.body.dataset.sector==='bank',oil=!!$('#chCurve');
const sector=bank?'bank':oil?'oil':'sugar';document.body.dataset.researchSector=sector;
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
}else{
 const domestic=new Set(oil?['dau-khi-22','dau-khi-26']:['sugar-06','sugar-12','sugar-13']);
 $$('[data-tab="mt3"] .card').filter(n=>!n.parentElement.closest('.card')).forEach(n=>(domestic.has(n.dataset.blockId)?pricesVN:pricesWorld).append(n));
 $$('[data-tab="mt3"] .section').forEach(s=>[...s.children].filter(n=>!n.matches('.sectionhead,.grid')).forEach(n=>pricesVN.append(n)));
 const cycle=block(oil?'dau-khi-02':'sugar-02');if(cycle){vn.append(cycle);cycle.prepend(make('p','research-caption',oil?'Phân tích AI ngày 03/09/2026 · chưa cập nhật theo số mới':'Phân tích AI ngày 17/08/2026 · chưa cập nhật theo số mới'));}
 const kpis=overview.querySelector('.kpis');if(kpis)market.prepend(kpis);
 // All source/player detail stays available in Overview.
 [...pane(6).children].forEach(n=>overview.append(n));
 if(!oil){['sugar-14','sugar-15','sugar-16'].forEach(id=>pricesVN.append(block(id)));[...hot.children].forEach(n=>overview.append(n));}
}
// Old panels can have multiple nodes (Sugar mt3); remove only after moving data.
$$('.majorpane[data-tab="mt3"],.majorpane[data-tab="mt6"]').forEach(n=>n.remove());
const marketHeading=market.querySelector('.sectionhead h2');marketHeading.textContent='Bức tranh ngành';
const mp=market.querySelector('.sectionhead p');if(mp)mp.textContent='Cung cầu → giá & chi phí → biên lợi nhuận.';
[[world,oil?'Cân bằng dầu → tồn kho → Brent & crack':bank?'Vốn quốc tế → chi phí USD → tỷ giá':'Sản lượng → xuất khẩu → giá đường'],[vn,oil?'Sản lượng → nguồn nhập → giá bán & biên':bank?'Huy động → tín dụng → NIM → chi phí rủi ro':'Vùng mía → tồn kho → giá bán so giá nguyên liệu']].forEach(([host,text])=>host.prepend(make('p','research-path',text)));
// Static roadmap focuses on economic roles, not a current market call.
const road=make('section','research-roadmap');road.append(make('h2','','Bản đồ ngành'),make('p','',oil?'Đầu tư & khai thác → xử lý dầu / khí → phân phối & tiêu thụ. Dịch vụ và vận tải hỗ trợ từng khâu.':bank?'Nguồn vốn → tài sản sinh lãi → thu nhập → chi phí vận hành & dự phòng → ROE.':'Vùng mía / nguyên liệu nhập → chế biến → phân phối → khách hàng công nghiệp & bán lẻ.'));
const steps=make('div','research-steps');
(oil?[['01 · Nguồn cung','PVD: khoan; PVS: EPCI, kho nổi. Theo dõi hợp đồng, công suất và tiến độ.'],['02 · Chế biến','GAS: khí và hạ tầng; BSR: lọc dầu. Sản lượng, cơ cấu nguồn và biên chế biến quyết định hiệu quả.'],['03 · Đưa ra thị trường','PLX: phân phối; PVT: vận tải. Theo dõi sản lượng bán, tồn kho, cước và cơ cấu hợp đồng.']]:bank?[['01 · Huy động','Tiền gửi và vốn thị trường tài trợ bảng cân đối; CASA hỗ trợ giá vốn.'],['02 · Phân bổ vốn','Cho vay và đầu tư tạo thu nhập; cơ cấu khách hàng quyết định lợi suất và rủi ro.'],['03 · Giữ lại lợi nhuận','NIM, thu phí, CIR và dự phòng cùng quyết định ROE; đọc cạnh P/B.']]:[['01 · Nguyên liệu','SLS, LSS, KTS: vùng mía và hiệu suất nhà máy; SBT: thêm vai trò nguyên liệu nhập và thương mại.'],['02 · Sản xuất','Giá mía, chữ đường và công suất quyết định giá thành. QNS cần tách mảng đường với các mảng khác.'],['03 · Tiêu thụ','Giá bán, tồn kho và cơ cấu khách hàng quyết định khả năng chuyển chi phí.']]).forEach(([title,body])=>{const n=make('article');n.append(make('h3','',title),make('p','',body));steps.append(n)});road.append(steps);overview.prepend(road);
// Industry mechanisms precede the financial comparison; company deep-dives get their own dashboards.
const chain=bank?overview.querySelector('.flow-scroll')?.closest('.card'):block(oil?'dau-khi-01':'sugar-01');
const originalIntro=overview.querySelector('.sectionhead');if(originalIntro){road.before(originalIntro);originalIntro.querySelector('h2').textContent='Tổng quan ngành '+(oil?'dầu khí':bank?'ngân hàng':'đường');}
if(chain)road.after(chain);
const business=make('section','business-models');business.append(make('h2','','Doanh nghiệp kiếm tiền như thế nào?'));const bmGrid=make('div','business-model-grid');business.append(bmGrid);
const models=oil?[
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
const players=make('section','company-dashboard-links');players.append(make('h2','','Dashboard doanh nghiệp'));const companyLinks=make('div','company-link-grid');
const tickers=oil?['GAS','BSR','PLX','PVD','PVS','PVT']:bank?['VCB','CTG','BID','TCB','VPB','MBB','ACB','HDB','TPB','VIB','SHB']:['SBT','QNS','SLS','LSS','KTS'];
tickers.forEach(t=>{const n=make('div','company-dashboard-pending');n.append(make('b','',t),make('span','','Sẽ bổ sung dashboard'));companyLinks.append(n)});players.append(companyLinks);comp.after(players);
window.FinancialComparison?.mount(comp,{sector,sources});
// Remove the previous summary from the product flow; source metadata remains in Sources.
const hero=$('.hero');if(hero){const header=make('header','research-header');header.append(make('h1','',oil?'Dầu khí':bank?'Ngân hàng':'Đường'));hero.before(header);preserveProvenance(hero);hero.remove();}
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
const UNIT='(?:%|điểm %|điểm phần trăm|USD/thùng|USD/kg|US cent/lb|USD|k đ/kg|đ/kg|đồng/lít|đ/lít|triệu thùng/ngày|triệu thùng|mb/d|nghìn tấn|triệu tấn|tấn|lượt tàu/ngày|lượt/ngày|lượt tàu|lượt|tàu/ngày|tỷ USD|tỷ m³|triệu m³|nghìn ha|tỷ đồng|triệu tỷ|x)';
const NUM='[+\\-−]?\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d+)?';
const KEY=new RegExp('(?<![\\w/.,\\-])('+NUM+'(?:\\s?[–\\-]\\s?'+NUM+')?\\s?'+UNIT+'|\\d{2}/\\d{2}/\\d{4}|\\d{2}/\\d{2}/\\d{2})(?![\\w/%])','g');
function emphasize(root){
 if(!root||root.dataset.emphasized)return;root.dataset.emphasized='1';
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>(n.parentElement.closest('table')&&!n.parentElement.closest('.compare-table'))||n.parentElement.closest('a,code,svg,button,input,textarea,select,label,.chart-sub,.chart-caveat,.chart-freshness,.chart-source-line,.key-number,.key-phrase,.thesis-metric,.thesis-period,.thesis-state,.research-caption,.cadence-note,.source-note,.source-links,.srcrow,.data-gap,.gap-row,.research-editor')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(t=>{const text=t.nodeValue;if(!KEY.test(text)){KEY.lastIndex=0;return}KEY.lastIndex=0;const frag=document.createDocumentFragment();let last=0;text.replace(KEY,(m,_g,offset)=>{frag.append(text.slice(last,offset));frag.append(make('b','key-number',m));last=offset+m.length;return m});frag.append(text.slice(last));t.replaceWith(frag)});
}
const policyTitles={'dau-khi-27':'Điều hành giá xăng dầu','dau-khi-28':'Luật Dầu khí 2026 · khung tác động','sugar-17':'Hạn ngạch & thuế nhập khẩu','sugar-18':'Phòng vệ thương mại · các mốc thay đổi'};
const policyCards=[...policy.querySelectorAll('.card')].filter(n=>!n.parentElement.closest('.card'));
const impacts=new Map();
policyCards.forEach((c,i)=>{const h=c.querySelector('h3,.chart-title'),title=policyTitles[c.dataset.blockId]||h?.childNodes[0]?.textContent?.trim()||'Chính sách phòng vệ thương mại';const f=fold(c,title);if(h)h.classList.add('research-repeated-heading');const p=make('p','research-caption',oil?(c.dataset.blockId!=='dau-khi-28'?'Tác động: PLX và khâu phân phối · trong quý · qua cơ chế giá và vòng quay tồn kho.':'Tác động: PVD/PVS trước, GAS và sản lượng sau · qua tiến độ đầu tư và hợp đồng.') :bank?'Tác động: vốn, thanh khoản và khả năng tăng tín dụng · mức độ khác nhau theo bảng cân đối từng ngân hàng.':'Tác động: giá nhập quy đổi và cạnh tranh nội địa · khác nhau giữa doanh nghiệp tự chủ mía và nhập nguyên liệu.');f.body.prepend(p);impacts.set(p.textContent,[...(impacts.get(p.textContent)||[]),p]);});
// A transmission line shared by several cards is said once under the section heading.
const policyHead=policy.querySelector('.sectionhead');impacts.forEach((ps,text)=>{if(ps.length<2)return;ps.forEach(n=>n.remove());const once=make('p','research-caption policy-impact',text);(policyHead||policy).after(once)});
policy.querySelectorAll('.sectionhead h2').forEach(h=>h.textContent='Chính sách · Thuế · Thương mại');
// Compact chart labels. Unit, observation period, source and warning stay intact.
const titles={chCrudeStock:'Tồn kho dầu thô Mỹ',chProdStock:'Tồn kho sản phẩm Mỹ',chDistYear:'Mùa vụ tồn kho diesel Mỹ',chCushing:'Tồn kho Cushing',chUsProd:'Sản lượng dầu Mỹ',chSpare:'Công suất dự phòng & gián đoạn',chCftc:'Vị thế quỹ WTI',chGasVol:'Khí & LNG Việt Nam',chMarginCompare:'Biên gộp mảng đường',chFastPrice:oil?'Brent Futures':'Sugar No.11 Futures',chHormuzM:'Tàu qua Hormuz',chCrack:'Crack spread',chBrentM:'Brent',chBrentY:'Brent · bình quân năm',chCurve:'Đường cong WTI',chWorldSD:'Cung cầu dầu toàn cầu',chWorldBalance:'Cung trừ cầu',chWorldRecent:'Giá đường thế giới',chWorldLong:'Giá đường · bình quân năm',chVnPrice:'Giá đường Việt Nam',chRetailFuel:'Giá bán lẻ xăng dầu',chVnUpstream:'Sản lượng dầu & khí Việt Nam'};
Object.entries(titles).forEach(([id,title])=>{const c=$('#'+id)?.closest('.viz-block,.card'),h=c?.querySelector('.chart-title');if(h){const t=[...h.childNodes].find(n=>n.nodeType===3);if(t)t.textContent=title;}});
// Own the six primary routes while preserving historical #mt3/#mt6 links.
const nav=$('.majortabbtn').parentElement;nav.replaceChildren();nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Các phần nghiên cứu');
const routes=[['mt1','Tổng quan ngành'],['mt2','Bức tranh ngành'],['mt4','Policy · Tax · Trade'],['mt5','Catalyst · Risk'],['mt7','Chủ đề nóng'],['mt8','Sources']];
function select(key,hash=false){key=key==='mt3'?'mt2':key==='mt6'?(bank?'mt2':'mt1'):key;if(!routes.some(r=>r[0]===key))key='mt1';$$('.majorpane').forEach(p=>{const active=p.dataset.tab===key;p.hidden=!active;p.classList.toggle('active',active)});[...nav.children].forEach(b=>{const active=b.dataset.tab===key;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});if(hash)history.replaceState(null,'','#'+key);return key;}
routes.forEach(([key,label],i)=>{const b=make('button','majortabbtn',`${i+1}. ${label}`);b.type='button';b.dataset.tab=key;b.id='research-tab-'+key;b.setAttribute('role','tab');const p=pane(Number(key.slice(2)));p.id=p.id||'pane-'+key;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);b.setAttribute('aria-controls',p.id);b.addEventListener('click',()=>{select(key,true);window.scrollTo({top:0,behavior:'instant'})});b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?routes.length-1:(i+(e.key==='ArrowRight'?1:routes.length-1))%routes.length;nav.children[j].click();nav.children[j].focus()});nav.append(b)});
window.showMajorTab=key=>select(key,true);window.addEventListener('hashchange',()=>select(location.hash.slice(1)));select(location.hash.slice(1));
// Interactive futures: frequency changes aggregation; range only filters observations.
const feed=window.SECTOR_DAILY?.sources?.[oil?'brent_futures':'sugar_futures'],chart=$('#chFastPrice');
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
  barLineChart('chFastPrice',{categories:rs.map(r=>r.date),series:[{name:oil?'Brent Futures':'Sugar No.11 Futures',kind:'line',color:'#268a76',values:rs.map(r=>r.value)}],unit:oil?'USD/thùng':'US cent/lb',digits:2,height:270,zeroBase:false});
  status.textContent=rs.length+' điểm · '+from+' → '+to+(freq.value==='day'?'':' · close cuối mỗi kỳ, kỳ đầu/cuối có thể chưa đủ');
  table.replaceChildren();const h=make('tr');['Kỳ','Phiên quan sát','Giá đóng cửa'].forEach(t=>h.append(make('th','',t)));table.append(h);rs.forEach(r=>{const tr=make('tr');[r.date,r.last_date,r.value===null?'—':r.value.toLocaleString('vi-VN',{maximumFractionDigits:2})].forEach(t=>tr.append(make('td','',t)));table.append(tr)});
 }
 [freq,range,start,end].forEach(n=>n.addEventListener('change',draw));draw();
 const foot=card.querySelector('.chart-footer');foot?.querySelectorAll('.method-note').forEach(n=>{n.textContent=n.textContent.replace('90 phiên gần nhất,','Lọc khoảng ngày theo bộ chọn; tuần/tháng/năm lấy giá đóng cửa cuối có số,')});
}
window.ResearchLayout={sector,make,fold,emphasize,hot,select,sources};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const d=document.activeElement?.closest('details.research-fold');if(d?.open){d.open=false;d.querySelector('summary').focus()}}});
})();
