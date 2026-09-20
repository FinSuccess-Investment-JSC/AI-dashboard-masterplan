/* Analyst-owned lifecycle database. No job overwrites user notes or states. */
(async () => {
'use strict';
const R=window.ResearchLayout;if(!R)return;const {make,fold,sector,hot}=R;
let db;const failures=[];
try{db=await new Promise((resolve,reject)=>{const req=indexedDB.open('finsuccess-research',1);req.onupgradeneeded=()=>req.result.createObjectStore('entries',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('blocked'))})}catch(e){failures.push(e)}
const readAll=()=>new Promise((resolve,reject)=>{if(!db)return resolve([]);const q=db.transaction('entries').objectStore('entries').getAll();q.onsuccess=()=>resolve(q.result.filter(r=>r.sector===sector));q.onerror=()=>reject(q.error)});
const save=record=>new Promise((resolve,reject)=>{if(!db)return reject(new Error('Cơ sở dữ liệu không khả dụng'));const tx=db.transaction('entries','readwrite');tx.objectStore('entries').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});
let stored=[];try{stored=await readAll()}catch(e){failures.push(e)}const records=new Map(stored.map(r=>[r.id,r]));
function editor(card,key,type,initial={}){
 const id=sector+':'+type+':'+key;
 let record=records.get(id)||{id,sector,type,status:'active',author:'',note:'',createdAt:new Date().toISOString(),...initial};
 records.set(id,record);const badge=make('span','research-lifecycle');
 const heading=card.querySelector('.thesis-signal-top')||card.querySelector(':scope > details > summary')||card;heading.append(' ',badge);
 const form=make('form','research-editor');
 const select=make('select');select.setAttribute('aria-label','Trạng thái luận điểm');[['active','Đang theo dõi'],['archived','Đã lưu']].forEach(([v,t])=>{const o=make('option','',t);o.value=v;select.append(o)});
 const uid=id.replace(/:/g,'-'),author=make('input');author.id=uid+'-author';author.maxLength=100;author.placeholder='Tên analyst';
 const lab=make('label','','Tác giả');lab.htmlFor=author.id;
 const memo=make('textarea');memo.id=uid+'-memo';memo.rows=3;memo.maxLength=10000;memo.placeholder='Luận điểm / phản biện, lý do lưu và điều kiện mở lại';const ml=make('label','','Góc nhìn analyst');ml.htmlFor=memo.id;
 const button=make('button','','Lưu thay đổi');button.type='submit';const status=make('p','research-save-status');status.setAttribute('role','status');
 form.append(select,lab,author,ml,memo,button,status);
 const d=make('details','research-fold');d.append(make('summary','','Góc nhìn analyst & trạng thái'),form);
 (card.querySelector('.research-detail')||card).append(d);
 const apply=()=>{card.dataset.lifecycle=record.status;badge.textContent=record.status==='archived'?'Đã lưu':'';badge.hidden=record.status!=='archived';badge.classList.toggle('is-archived',record.status==='archived');select.value=record.status;author.value=record.author||'';memo.value=record.note||'';status.textContent=record.updatedAt?'Đã lưu trên trình duyệt · '+new Date(record.updatedAt).toLocaleString('vi-VN'):'';card.dispatchEvent(new CustomEvent('lifecyclechange',{bubbles:true}))};
 form.addEventListener('submit',async e=>{e.preventDefault();if((memo.value.trim()||select.value!==record.status)&&!author.value.trim()){status.textContent='Điền tác giả cho thay đổi hoặc góc nhìn riêng.';author.focus();return}button.disabled=true;const next={...record,status:select.value,author:author.value.trim(),note:memo.value.trim(),updatedAt:new Date().toISOString()};try{await save(next);record=next;records.set(id,next);apply()}catch(e){status.textContent='Chưa lưu được. Nội dung vẫn ở ô nhập; hãy xuất bản sao hoặc thử lại.'}finally{button.disabled=false}});
 apply();if(!db){button.disabled=true;status.textContent='Trình duyệt không cho lưu dữ liệu. Vẫn đọc được nội dung gốc.'}
 return {card,record};
}
const strategies={
 oil:[['Dòng chảy giảm có chuyển thành thay đổi lợi nhuận?','Ngắn hạn · ngày đến quý','Crack, thiếu nguyên liệu và cước có thể truyền dẫn khác nhau tới BSR, PLX, PVT.','Dòng tàu phục hồi nhưng crack còn cao: kiểm tra thêm tồn kho sản phẩm. Không dùng riêng AIS để kết luận.'],['Crack cao có bền qua chu kỳ tồn kho?','1–2 quý','BSR có thể hưởng biên; PLX phụ thuộc giá vốn và cơ chế giá.','Đối chiếu crack cùng kỳ biên BSR, lịch bảo dưỡng và tác động tồn kho.'],['Thắt chặt cung có vượt tác động cầu yếu?','2–4 quý','Giá dầu chỉ truyền tới doanh nghiệp niêm yết qua từng khâu.','So revision cung/cầu và tồn kho, không suy dự báo thiếu cung thành giá chắc chắn tăng.'],['Đầu tư có trở thành hợp đồng và dòng tiền?','Nhiều quý đến nhiều năm','PVD/PVS: khối lượng công việc; GAS: nguồn khí và tiêu thụ.','So chu kỳ dự án trước theo FID → ký hợp đồng → nghiệm thu → thu tiền. Chưa có nghiên cứu sự kiện định lượng.']],
 sugar:[['Tồn kho giảm có mở đường tăng giá bán?','Trong niên vụ','Giá bán và vòng quay hàng có thể hỗ trợ dòng tiền doanh nghiệp.','Đối chiếu tồn kho/tiêu thụ cùng niên vụ; loại ảnh hưởng mùa ép mía.'],['Giá đường tăng có chuyển thành biên và giá cổ phiếu?','Ngắn hạn · 1–2 quý','Tự chủ mía và nhập đường thô có độ nhạy chi phí khác nhau.','Kiểm tra 2022 bằng giá đường, giá mía, biên doanh nghiệp và lợi suất cổ phiếu so VN-Index. Chưa đủ chuỗi để kết luận hay quy nguyên nhân cho chiến tranh.'],['Nguồn cung thay thế có chặn tăng giá nội địa?','1–4 quý','Nhập khẩu và HFCS ảnh hưởng khả năng chuyển giá ở khách hàng công nghiệp.','So cùng kỳ, cùng độ ngọt và chi phí quy đổi; tách nhập khẩu thực tế với hạn ngạch.'],['Bảo hộ có chuyển thành thực thi?','Theo mốc hiệu lực và rà soát','Lợi ích phụ thuộc xuất xứ, thuế thực nộp và cạnh tranh nội địa.','So trước/sau 2021 và 2022 cùng cung cầu; chưa quy toàn bộ biến động giá cho thuế.']],
 bank:[['Tăng trưởng tín dụng có đủ vốn tài trợ?','1–2 quý','Huy động và thanh khoản quyết định khả năng mở rộng tài sản sinh lãi.','So chênh tăng trưởng tín dụng–huy động và giá vốn cùng kỳ.'],['NIM phục hồi có bền sau tái định giá?','1–4 quý','CASA, chi phí tiền gửi và lợi suất tài sản cùng tác động lợi nhuận.','Phân biệt biên cải thiện do cơ cấu với thay đổi chu kỳ lãi suất.'],['Nợ sớm có chuyển thành chi phí dự phòng?','1–4 quý','Credit cost có thể triệt tiêu tăng trưởng thu nhập.','Theo dõi dịch chuyển nhóm nợ, thu hồi và bao phủ; tăng dư nợ có thể làm loãng tỷ lệ NPL.'],['Vốn có mở thêm dư địa tăng trưởng?','Theo công bố từng bank','Room và vốn an toàn giới hạn tín dụng; chưa chấm khi thiếu số.','So cùng định nghĩa CAR và lộ trình áp dụng; không dùng số hệ thống thay room từng bank.'],['ROE cải thiện đã được phản ánh vào P/B?','2–4 quý','P/B cần đối chiếu ROE bền vững, chất lượng tài sản và chi phí vốn.','Chưa có kỳ vọng lợi nhuận thị trường đồng bộ để lượng hóa dư địa định giá lại.']]
};
document.querySelectorAll('.thesis-signal').forEach((c,i)=>{
 const title=c.querySelector('h3').textContent;const s=strategies[sector][i];if(!s)return;
 const ask=make('p','thesis-question');ask.append(s[0],' ',make('span','thesis-horizon',s[1]));c.querySelector('.thesis-signal-top').after(ask);
 const how=make('p','thesis-howto');how.append(make('b','','Cách đối chiếu: '),s[3]);(c.querySelector('.thesis-limitation')||c.querySelector('.thesis-evidence-links')||c.lastElementChild).before(how);
 editor(c,'signal-'+i,'catalyst',{title});
});
// Topic lifecycle can outlive a market event; structural material lives in Overview/Market.
const old=[...hot.children];hot.replaceChildren();const h=make('div','sectionhead');h.append(make('h2','','Chủ đề nóng'));hot.append(h,make('p','research-caption','Câu chuyện có thời hạn · mỗi chủ đề giữ nguồn, ngày phân tích và điều kiện kết thúc.'));
const toolbar=make('div','research-toolbar'),active=make('button','','Đang theo dõi'),archive=make('button','','Đã lưu');active.type=archive.type='button';toolbar.append(active,archive);hot.append(toolbar);const list=make('div','research-topics');hot.append(list);let view='active';
function filter(){list.querySelectorAll(':scope > .research-topic').forEach(n=>n.hidden=n.dataset.lifecycle!==view);active.setAttribute('aria-pressed',String(view==='active'));archive.setAttribute('aria-pressed',String(view==='archived'));const count=[...list.children].filter(n=>!n.hidden).length;empty.hidden=count>0;}
const empty=make('p','research-caption','Chưa có chủ đề trong nhóm này.');hot.append(empty);active.onclick=()=>{view='active';filter()};archive.onclick=()=>{view='archived';filter()};list.addEventListener('lifecyclechange',filter);
function topic(key,title,content,initial={}){const c=make('article','research-topic');c.append(...content);list.append(c);const f=fold(c,title,{all:true,open:true});editor(c,key,'topic',{title,...initial});return c;}
if(sector==='oil')topic('hormuz','Hormuz · dòng chảy & tác động',old);
else if(sector==='bank'){
 const news=document.getElementById('bank-news');if(news)topic('bank-news','Tin & công bố doanh nghiệp',[news]);
}
for(const r of stored.filter(r=>r.type==='topic'&&r.custom)){
 const p=make('p','',r.description||''),source=make('a','','Nguồn tham khảo ↗');if(/^https?:\/\//.test(r.source||'')){source.href=r.source;source.target='_blank';source.rel='noopener';}
 topic(r.id.split(':').slice(2).join(':'),r.title,[p,...(source.href?[source]:[])],r);
}
const create=make('details','research-fold');create.append(make('summary','','Thêm chủ đề theo dõi'));const form=make('form','research-editor');
const inputs={};[['title','Tiêu đề','input'],['description','Luận điểm · bằng chứng · điều kiện kết thúc','textarea'],['source','Link nguồn / dashboard chuyên đề','input'],['author','Analyst','input']].forEach(([k,label,tag])=>{const n=make(tag);n.id='topic-new-'+k;n.maxLength=k==='description'?10000:500;n.required=k!=='source';if(k==='source')n.type='url';const l=make('label','',label);l.htmlFor=n.id;inputs[k]=n;form.append(l,n)});
const add=make('button','','Thêm chủ đề');add.type='submit';const msg=make('p','research-save-status');msg.setAttribute('role','status');form.append(add,msg);create.append(form);hot.append(create);
form.onsubmit=async e=>{e.preventDefault();const values=Object.fromEntries(Object.entries(inputs).map(([k,n])=>[k,n.value.trim()]));if(Object.entries(values).some(([k,v])=>k!=='source'&&!v)){msg.textContent='Điền tiêu đề, nội dung và tác giả.';return}if(values.source&&!/^https?:\/\//.test(values.source)){msg.textContent='Link nguồn cần bắt đầu bằng https:// hoặc http://';return}const key='custom-'+crypto.randomUUID(),record={id:sector+':topic:'+key,sector,type:'topic',custom:true,status:'active',note:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...values};add.disabled=true;try{await save(record);records.set(record.id,record);const content=[make('p','',values.description)];if(values.source){const a=make('a','','Nguồn tham khảo ↗');a.href=values.source;a.target='_blank';a.rel='noopener';content.push(a)}topic(key,values.title,content,record);view='active';filter();form.reset();msg.textContent='Đã lưu chủ đề trên trình duyệt.'}catch(e){msg.textContent='Chưa lưu được. Giữ nguyên nội dung để thử lại.'}finally{add.disabled=false}};
const backup=make('button','','Xuất bản sao JSON');backup.type='button';toolbar.append(backup);backup.onclick=()=>{const blob=new Blob([JSON.stringify({schema:1,sector,exportedAt:new Date().toISOString(),entries:[...records.values()]},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download='research-'+sector+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
hot.append(make('p','research-caption',failures.length?'Không mở được cơ sở dữ liệu của trình duyệt; các nút lưu chưa khả dụng.':'Lưu trên trình duyệt này · xuất JSON để giữ bản sao.'));
// Key figures in prose stand out after every block has settled.
document.querySelectorAll('.thesis-signal,.thesis-scenario-panel,.thesis-fold-body,.majorpane[data-tab="mt4"] .research-detail,.majorpane[data-tab="mt4"] .policy-timeline,.research-topic,.research-steps,.business-models').forEach(n=>R.emphasize(n));
filter();document.body.dataset.editorialReady='true';
})();
