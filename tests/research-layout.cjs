// Functional regression: routes, geography, aggregation controls, evidence, IndexedDB, lifecycle and backup.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const assert=require('node:assert/strict');const fs=require('fs'),http=require('node:http'),path=require('node:path');
(async()=>{
const root=path.resolve(__dirname,'..');fs.mkdirSync('/private/tmp/dashboard-redesign',{recursive:true});
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
const b=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const p=await b.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
try { for(const sector of ['Dau-khi','Sugar','Bank','Dien','Bat-dong-san','Det-may']){
 await p.goto(base+sector+'/');await p.waitForSelector('body[data-editorial-ready="true"]');
 const tabCount=sector==='Bank'?7:sector==='Bat-dong-san'?8:6;assert.equal(await p.locator('.majortabbtn').count(),tabCount);
 assert.deepEqual(await p.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);return ids.filter((id,i)=>ids.indexOf(id)!==i)}),[],sector+' duplicate ids');
 if(sector==='Bank'){
  assert.equal(await p.locator('#pane-mt9').count(),1);
  await p.locator('.majortabbtn[data-tab="mt9"]').click();assert.equal(await p.locator('#pane-mt9').isVisible(),true);
  await p.locator('.majortabbtn[data-tab="mt2"]').click();
  assert.ok(await p.locator('.bank-example #eib-lending').count());
  const toggles=p.locator('#bank-fx .wi-series-toggle input');assert.equal(await toggles.count(),4);
  await toggles.first().uncheck();assert.equal(await p.locator('#bank-fx .wi-chart .chart-legend span').filter({hasText:'VCB bán'}).count(),0);
  await toggles.first().check();assert.equal(await p.locator('#bank-fx .wi-chart .chart-legend span').filter({hasText:'VCB bán'}).count(),1);
  const folds=p.locator('#pane-mt2 .wi-table-fold');const foldCount=await folds.count();assert.ok(foldCount>=6,'expected many collapsible wi-tables in Bức tranh ngành, got '+foldCount);assert.equal(await folds.first().getAttribute('open'),null,'wi-table fold closed by default');await folds.first().locator('summary').click();assert.notEqual(await folds.first().getAttribute('open'),null,'wi-table opens on summary click');assert.equal(await folds.first().locator('.wi-table table').isVisible(),true,'wi-table content visible after open');assert.equal(await p.locator('.source-details-body .wi-table').count(),0,'wi-table folds must not migrate to source popover');
  await p.locator('.majortabbtn[data-tab="mt7"]').click();await p.locator('#rumor-text').fill('Tin đồn room tín dụng ACB');await p.locator('#rumor-author').fill('QA');await p.locator('.bank-rumors button[type="submit"]').click();await p.waitForSelector('.bank-rumor:has-text("ACB")');
  assert.ok(await p.locator('.bank-rumor').first().textContent().then(t=>t.includes('nguồn không chính thống')));
  await p.locator('.bank-rumor select').first().selectOption('false');await p.reload();await p.waitForSelector('body[data-editorial-ready="true"]');await p.locator('.majortabbtn[data-tab="mt7"]').click();assert.equal(await p.locator('.bank-rumor select').first().inputValue(),'false');await p.locator('.bank-rumor button').first().click();await p.locator('.bank-rumor').first().waitFor({state:'detached'});assert.equal(await p.locator('.bank-rumor').count(),0);
 }
 for(const width of [1440,390]){await p.setViewportSize({width,height:1000});for(let i=0;i<tabCount;i++){await p.locator('.majortabbtn').nth(i).click();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),sector+' overflow '+width+' tab '+i);if(i===0||i===2||i===3)await p.screenshot({path:`/private/tmp/dashboard-redesign/${sector}-${width}-${i}.png`});}}
 await p.locator('.majortabbtn').first().click();
 await p.waitForSelector('body[data-sources-ready="true"]');
 assert.ok(await p.evaluate(()=>Boolean(document.querySelector('.business-models').compareDocumentPosition(document.querySelector('.financial-comparison'))&Node.DOCUMENT_POSITION_FOLLOWING)));
 const symbol=sector==='Dau-khi'?'GAS':sector==='Sugar'?'SBT':sector==='Dien'?'POW':sector==='Bat-dong-san'?'VHM':sector==='Det-may'?'TNG':'VCB';
 const compTab=p.locator('#pane-mt1 button',{hasText:'So sánh tài chính'});if(await compTab.count())await compTab.first().click();
 await p.locator('#comparison-search').fill(symbol);assert.equal(await p.locator('.comparison-table tbody tr').count(),1);
 for(const period of ['year','quarter']){await p.locator('#comparison-period').selectOption(period);assert.equal(await p.locator('.comparison-table [data-metric="roe"]').getAttribute('data-value'),await p.evaluate(({symbol,period})=>String(window.COMPANY_COMPARISON.companies.find(r=>r.symbol===symbol)[period].values.roe),{symbol,period}));}
 await p.locator('.comparison-tools button').click();await p.locator('[data-sort="pe"]').click();
 const sorted=await p.locator('.comparison-table [data-metric="pe"]').evaluateAll(ns=>ns.map(n=>n.dataset.value===undefined?null:Number(n.dataset.value)));assert.deepEqual(sorted,sorted.slice().sort((a,b)=>a===null?1:b===null?-1:b-a));
 const source=p.locator('.comparison-source-action button');await source.click();const sourceId=await source.getAttribute('aria-controls');assert.equal(await p.locator('#'+sourceId).isVisible(),true);await p.keyboard.press('Escape');assert.equal(await p.locator('#'+sourceId).isVisible(),false);
 await p.locator('.majortabbtn[data-tab="mt8"]').click();assert.equal(new URL(p.url()).hash,'#mt8');assert.ok(await p.locator('#pane-mt8 a[href^="http"]').count()>0);
 for(const width of [1440,390]){await p.setViewportSize({width,height:1000});await p.locator('.majortabbtn').first().click();if(await compTab.count())await compTab.first().click();await p.locator('.financial-comparison').scrollIntoViewIfNeeded();await p.screenshot({path:`/private/tmp/dashboard-redesign/${sector}-${width}-comparison.png`});
 await p.locator('.majortabbtn').nth(1).click();await p.screenshot({path:`/private/tmp/dashboard-redesign/${sector}-${width}-market.png`});await p.evaluate(()=>window.scrollTo({top:2000,behavior:'instant'}));
 const sticky=await p.locator('.sticky-geography').evaluate(n=>({top:n.getBoundingClientRect().top,expected:parseFloat(getComputedStyle(n).top)}));assert.ok(Math.abs(sticky.top-sticky.expected)<2,sector+' sticky navigation '+JSON.stringify(sticky));
 if(sector==='Dau-khi'){
  await p.locator('#supply-tab-0').click();
  const worldSubs=p.locator('#supply-world .world-subtabs button');
  assert.equal(await worldSubs.count(),3,'Thế giới có 3 tab con');
  assert.deepEqual(await worldSubs.allTextContents(),['Giá sản phẩm','Cung-cầu & Tồn kho','Crack spread']);
  await p.locator('#world-sub-1').click();await p.locator('#opec-drivers').scrollIntoViewIfNeeded();await p.screenshot({path:`/private/tmp/dashboard-redesign/${sector}-${width}-opec.png`});assert.equal(await p.locator('#opec-drivers svg').count(),3);
  await p.locator('#world-sub-2').click();assert.equal(await p.locator('#world-crack .card').count(),2,'Crack spread giữ 2 biểu đồ');
  await p.locator('#supply-tab-1').click();
  for(const id of ['dau-khi-18','dau-khi-19','dau-khi-26']){const f=p.locator(`[data-block-id="${id}"] details.research-fold`);assert.equal(await f.count(),1,id+' có dropdown');assert.equal(await f.getAttribute('open'),null,id+' dropdown đóng theo mặc định');}
  assert.equal(await p.locator('[data-block-id="dau-khi-19"] > .data-gap').isVisible(),true,'data-gap vẫn hiện ngoài dropdown');
 }
 }
 await p.locator('.majortabbtn').nth(1).click();
 if(['Bat-dong-san','Det-may'].includes(sector)){ // no fast-price chart: check the two supply panes only
  await p.locator('#supply-tab-0').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#supply-vietnam').isVisible(),true);
 }else if(sector!=='Bank'){
  await p.locator('#supply-tab-0').click();if(sector==='Dau-khi')await p.locator('#world-sub-0').click();await p.locator('#price-frequency').selectOption('week');const n=await p.locator('#chFastPrice svg').count();assert.equal(n,1);
  await p.locator('#price-frequency').selectOption('year');await p.locator('#price-range').selectOption('all');assert.equal(await p.locator('#chFastPrice svg').count(),1);
  await p.locator('#price-range').selectOption('custom');await p.locator('#price-from').fill('2026-09-10');await p.locator('#price-to').fill('2026-01-01');await p.locator('#price-to').dispatchEvent('change');assert.equal(await p.locator('#chFastPrice svg').count(),0);
  await p.locator('#price-range').selectOption('90');await p.locator('#price-frequency').selectOption('day');
  await p.locator('#supply-tab-0').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#supply-vietnam').isVisible(),true);
 }
 await p.locator('.majortabbtn[data-tab="mt4"]').click();const policy=p.locator('.majorpane[data-tab="mt4"] details.research-fold').first();if(await policy.getAttribute('data-sub-opened')!==null&&await policy.getAttribute('open')!==null)await policy.locator(':scope > summary').click(); /* a sub-tab holding one fold opens it by design */assert.equal(await policy.getAttribute('open'),null);await policy.locator(':scope > summary').click();assert.notEqual(await policy.getAttribute('open'),null);await p.keyboard.press('Escape');assert.equal(await policy.getAttribute('open'),null);
 await p.locator('.majortabbtn[data-tab="mt5"]').click();const sig=sector==='Det-may'?p.locator('.tx-tile').first():p.locator('.cr-score-table tbody tr:not(.cr-group)').first();assert.equal(await (sector==='Det-may'?sig.locator('.tx-big strong'):sig.locator('.cr-num').first()).isVisible(),true,sector+' signal metric visible without opening a fold');assert.equal(await p.locator('#thesis-evidence, #thesis-archive').evaluateAll(ns=>ns.map(n=>n.open)).then(a=>a.some(Boolean)&&sector!=='Bank'),false,sector+' original detail folds closed unless they carry warnings');
 await p.locator('.majortabbtn[data-tab="mt5"]').click();const ev=p.locator(sector==='Det-may'?'.tx-tile .tx-link':'.cr-score-table tbody a').first();if(await ev.count())await ev.click();
 if(sector==='Dau-khi'){assert.equal(await p.locator('#chHormuzM').isVisible(),true);assert.ok(await p.locator('#chHormuzM').evaluate(n=>n.closest('.research-topic > details.research-fold')?.open),'Hormuz chart lives inside its topic fold');assert.equal(await p.locator('#pane-mt7 h3').filter({hasText:'Nguồn dữ liệu và khả năng tự động cập nhật'}).count(),0,'source table left hot topics');assert.equal(await p.locator('#pane-mt8 h3').filter({hasText:'Nguồn dữ liệu và khả năng tự động cập nhật'}).count(),1,'source table registered in Sources');}
 assert.equal(await p.locator('.thesis-view-tabs').count(),0,sector+' catalyst sub-tabs removed');assert.ok(await p.locator('.thesis-board .key-number, .majorpane[data-tab="mt4"] .key-number').count()>0,sector+' key numbers emphasised');
 await p.locator('.majortabbtn[data-tab="mt7"]').click();const create=p.locator('summary').filter({hasText:'Thêm chủ đề theo dõi'});await create.click();await p.locator('#topic-new-title').fill('QA topic');await p.locator('#topic-new-description').fill('Test hypothesis and end condition');await p.locator('#topic-new-author').fill('QA');await p.locator('#topic-new-source').fill('https://example.com/');await p.getByRole('button',{name:'Thêm chủ đề',exact:true}).click();await p.waitForSelector('.research-topic:has-text("QA topic")',{state:'attached'});await p.reload();await p.waitForSelector('body[data-editorial-ready="true"]');await p.locator('.majortabbtn[data-tab="mt7"]').click();assert.equal(await p.locator('.research-topic:has-text("QA topic")').count(),1);const qaTab=async()=>{const t=p.locator('#pane-mt7 button',{hasText:'QA topic'});if(await t.count()&&await t.first().isVisible())await t.first().click()};await qaTab();
 const topic=p.locator('.research-topic:has-text("QA topic")');
 assert.notEqual(await topic.locator(':scope > details').getAttribute('open'),null,sector+' topic fold open by default');assert.equal(await topic.locator(':scope > details > .research-detail p').first().isVisible(),true,sector+' topic content inside its fold');await topic.locator('.research-editor').locator('..').locator(':scope > summary').click();await topic.locator('.research-editor select').selectOption('archived');await topic.locator('.research-editor button').click();await p.waitForFunction(()=>[...document.querySelectorAll('.research-topic')].find(n=>n.textContent.includes('QA topic'))?.hidden);
 await p.locator('.research-toolbar button').nth(1).click();await qaTab();await topic.waitFor({state:'visible',timeout:5000});await topic.locator('.research-editor select').selectOption('active');await topic.locator('.research-editor button').click();await p.waitForFunction(()=>[...document.querySelectorAll('.research-topic')].find(n=>n.textContent.includes('QA topic'))?.dataset.lifecycle==='active');await p.locator('.research-toolbar button').first().click();await qaTab();await topic.waitFor({state:'visible',timeout:5000});
 const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'Xuất bản sao JSON',exact:true}).click();const download=await downloadPromise;const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.ok(backup.entries.some(r=>r.title==='QA topic'&&r.status==='active'&&r.author==='QA'));
 await p.locator('.majortabbtn').first().focus();await p.keyboard.press('End');assert.equal(await p.locator('.majortabbtn').last().getAttribute('aria-selected'),'true');
 console.log('PASS',sector);
}
assert.deepEqual(errors,[]); } finally {await b.close();await new Promise(resolve=>server.close(resolve))}})().catch(e=>{console.error(e);process.exit(1)});
