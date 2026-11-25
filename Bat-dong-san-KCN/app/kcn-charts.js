/* BĐS KCN · các chart cập nhật tự động (tách từ realestate-dashboard.js của trang Bất động sản, 25/11/2026):
 FDI đăng ký chế biến chế tạo và FDI thực hiện (lũy kế cùng kỳ, NSO/Cục ĐTNN), IIP chế biến chế tạo, P/B–P/E rổ 7 mã KCN (VNDirect),
 và ba chart số nhập tay từ báo cáo VDSC 01/2026 (diện tích ký mới, giá thuê KCN mở bán 2026, FDI theo quốc gia).
 Dữ liệu: window.REALESTATE_PUBLIC (scripts/build_sector_public.py). Dùng các hàm vẽ trong script cuối trang (barLineChart, hbarCompare, fillTable). */
(() => {
'use strict';
if(document.body.dataset.sector!=='industrial')return;
const W=window.REALESTATE_PUBLIC||{blocks:{}},B=W.blocks||{};
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e};
const nf=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const short=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const mon=d=>'T'+Number(d.slice(5,7))+'/'+d.slice(2,4);
const quarter=d=>'Q'+Math.ceil(Number(d.slice(5,7))/3)+'/'+d.slice(0,4);
const CS=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const C={navy:'#2938A8',teal:'#59C5C8',plum:'#861C52',gold:'#c29100',grey:'#6b7686',green:'#27af95',red:'#d1583f'};
const macro=B.macro?.series||{},com=B.commodity?.series||{},sec=B.sector_ratio?.by_sector||{};
const cash=B.cbond_cashflow?.records||[],iss=B.cbond_issuance?.records||[],mat=B.cbond_maturity?.records||[],topIssuers=B.cbond_maturity?.top_issuers||[];
const built=W.built_at?new Date(W.built_at).toLocaleDateString('vi-VN'):'—';
const checked=B.cbond_cashflow?.captured_at||W.built_at||'';
const SRC={hnx:['HNX · Trái phiếu doanh nghiệp','https://cbonds.hnx.vn/'],nso:['Cục Thống kê (NSO)','https://www.nso.gov.vn/'],sbv:['Ngân hàng Nhà nước','https://www.sbv.gov.vn/'],fia:['Cục Đầu tư nước ngoài · FDI','https://fia.mof.gov.vn/List/CatID/5102536e-ffed-4c97-83c9-24788f5e7d0c'],wi:['Nguồn công khai',null]};
for(const v of Object.values(macro)){if(/nso\.gov\.vn\/wp-content/.test(v.url||'')&&SRC.nso)SRC.nso=[SRC.nso[0],v.url];if(/customs/.test(v.url||'')&&SRC.customs)SRC.customs=[SRC.customs[0],v.url]}

const S=key=>macro[key]?.records||[];
const yoy=(rs,lag)=>rs.map((r,i)=>{const p=rs[i-lag];return {date:r.date,value:p&&p.value?(r.value/p.value-1)*100:null}});
function sourceLine(id,parts,period,method){
 const host=document.getElementById(id);if(!host)return;const block=host.closest('.card');
 const n=make('div','source-note cadence-note');n.append('Nguồn: ');
 parts.forEach(([name,url],i)=>{if(i)n.append(' · ');if(url){const a=make('a','',name);a.href=url;a.target='_blank';a.rel='noopener';n.append(a)}else n.append(name)});
 n.append(` · Kỳ cuối: ${period} · Kiểm: ${checked?short(checked.slice(0,10)):'—'}`);host.after(n);
 if(method)n.after(make('div','source-note method-note',method));
 if(block){block.dataset.refreshStatus='loaded';block.dataset.sourceIds='public'}
}
function insight(id,text){const block=document.getElementById(id)?.closest('.card');if(!block)return;const n=make('div','chart-insight');n.dataset.inputOwner='ai';n.innerHTML='<b>Cách hiểu trong bối cảnh ngành · AI:</b> ';n.append(text);block.append(n)}
function gap(id,text){const host=document.getElementById(id);if(host)host.replaceChildren(make('div','gap-empty',text))}
function kpi(spark,value,sub,delta,series,color=C.navy){const sp=document.getElementById(spark),card=sp?.closest('.kpi');if(!card)return;const ve=card.querySelector('.value'),seg=String(sub??'').split(' · '),hasU=value!=='—'&&seg.length>1&&/^(nghìn|triệu|tỷ|USD|CNY|VND|US cent|điểm|lượt)/.test(seg[0]);ve.textContent=value;if(hasU){const u=document.createElement('span');u.className='unit';u.style.cssText='font-size:12px;font-weight:600;color:var(--muted,#6b7a90);margin-left:6px;letter-spacing:0';u.textContent=seg[0];ve.append(u)}card.querySelector('.sub').textContent=hasU?seg.slice(1).join(' · '):sub;card.querySelector('.delta').textContent=delta;sp.replaceChildren();const sv=(series||[]).filter(Number.isFinite);if(sv.length>1)sparkline(spark,sv,color)}
const signed=(v,d=1)=>v==null?'—':(v>0?'+':'')+nf(v,d);

// KCN · hai chart FDI cùng một cách đo: lũy kế từ đầu năm đến cùng một tháng M, so giữa các năm.
// M = tháng mới nhất có ở cả hai chuỗi trong năm hiện tại (FDI đăng ký lũy kế sẵn; FDI thực hiện tự cộng tháng 1..M).
const fdiYtd=(()=>{
 const mfg=S('fdi_mfg_ytd'),realY=S('fdi_realized_ytd'),real=realY.length?realY:S('fdi_realized');if(!mfg.length||!real.length)return null;
 const year=mfg.at(-1).date.slice(0,4),m=Math.min(Number(mfg.at(-1).date.slice(5,7)),real.at(-1).date.slice(0,4)===year?Number(real.at(-1).date.slice(5,7)):12);
 const mm=String(m).padStart(2,'0'),years=[...new Set(mfg.map(r=>r.date.slice(0,4)))].sort();
 const mfgRows=years.map(y=>({y,v:mfg.find(r=>r.date===y+'-'+mm+'-01')?.value??null})).filter(r=>r.v!=null).slice(-7);
 const realRows=[...new Set(real.map(r=>r.date.slice(0,4)))].sort().map(y=>{if(realY.length)return {y,v:realY.find(r=>r.date===y+'-'+mm+'-01')?.value??null};const ms=real.filter(r=>r.date.slice(0,4)===y&&Number(r.date.slice(5,7))<=m);return {y,v:ms.length===m?ms.reduce((a,r)=>a+r.value,0):null}}).filter(r=>r.v!=null).slice(-7);
 return {m,mfgRows,realRows,realLast:real.at(-1)};
})();
const yoyCell=(rows,i)=>i>0&&rows[i-1].y===String(Number(rows[i].y)-1)?signed((rows[i].v/rows[i-1].v-1)*100,1)+'%':'—';
if(fdiYtd&&document.getElementById('chFdiMfg')){
 const {m,mfgRows:rs}=fdiYtd,lab=r=>m+'T/'+r.y;
 barLineChart('chFdiMfg',{categories:rs.map(lab),series:[{name:'FDI đăng ký · chế biến, chế tạo · '+m+' tháng',color:C.navy,values:rs.map(r=>r.v)}],unit:'triệu USD',digits:0,height:260,rotateLabels:false});
 fillTable('tbl-fdi-mfg',['Kỳ','Triệu USD','So cùng kỳ'],rs.map((r,i)=>[lab(r),nf(r.v,0),yoyCell(rs,i)]).reverse());
 sourceLine('chFdiMfg',[SRC.fia,SRC.nso],m+'T/'+rs.at(-1).y,'FDI đăng ký vào công nghiệp chế biến, chế tạo, lũy kế '+m+' tháng đầu mỗi năm . Năm trước suy từ % tăng/giảm cùng kỳ trong báo cáo.');
 insight('chFdiMfg','Khách thuê KCN là nhà máy chế biến chế tạo, nên FDI nhóm này là chỉ báo cầu sớm 2–6 quý trước khi doanh nghiệp KCN ghi doanh thu bàn giao đất. Vốn đăng ký tăng nhưng dồn vào mở rộng nhà máy cũ sẽ không tạo cầu đất mới.');
}
if(fdiYtd&&document.getElementById('chFdiRealized')){
 const {m,realRows:rs,realLast}=fdiYtd,lab=r=>m+'T/'+r.y;
 barLineChart('chFdiRealized',{categories:rs.map(lab),series:[{name:'Vốn FDI thực hiện · '+m+' tháng',color:C.teal,values:rs.map(r=>r.v)}],unit:'triệu USD',digits:0,height:260,rotateLabels:false});
 const monthly=S('fdi_realized').slice(-12).reverse();
 fillTable('tbl-fdi-realized',['Kỳ','Triệu USD','So cùng kỳ'],rs.map((r,i)=>[lab(r),nf(r.v,0),yoyCell(rs,i)]).reverse().concat([['Tháng gần nhất','',''],...monthly.map(r=>[mon(r.date),nf(r.value,0),''])]));
 sourceLine('chFdiRealized',[SRC.fia,SRC.nso],mon(realLast.date),'Vốn FDI thực hiện toàn nền kinh tế, cộng tháng 1 đến tháng '+m+' mỗi năm (báo cáo lũy kế của Cục Đầu tư nước ngoài); chưa tách riêng bất động sản. Cùng mốc '+m+' tháng với chart FDI đăng ký để so được; số theo tháng đến '+mon(realLast.date)+' ở bảng.');
 insight('chFdiRealized','Vốn thực hiện là tiền đã vào nhà xưởng, máy móc — nó xác nhận FDI đăng ký có thành nhà máy thật hay không.');
}
// KCN theo khung chỉ số VDSC (01/2026): số nhập tay từ báo cáo, có dòng bằng chứng trong data/realestate-market/evidence.json.
if(document.getElementById('chKcnLeased')){
 const cos=['KBC','LHG','NTC','SIP'],v={2024:[28,2,null,75],'2025F':[138,4,15,45],'2026F':[165,4,26,67]};
 barLineChart('chKcnLeased',{categories:cos,series:[{name:'2024',color:'#b8c7d9',values:v[2024]},{name:'2025F',color:C.teal,values:v['2025F']},{name:'2026F',color:C.navy,values:v['2026F']}],unit:'ha',digits:0,height:260,rotateLabels:false});
}
if(document.getElementById('chKcnRent')){
 const rows=[['Lê Minh Xuân 03 (SIP)','Nam',287,300],['Lộc An – Bình Sơn (SIP)','Nam',498,220],['Tràng Duệ 03 (KBC)','Bắc',621,180],['Quế Võ II mở rộng (KBC)','Bắc',140,150],['Nam Tân Uyên 03 (NTC)','Nam',345,150],['Nam Sơn Hạp Lĩnh (KBC)','Bắc',300,148],['Phước Đông (SIP)','Nam',2189,80]];
 hbarCompare('chKcnRent',{items:rows.map(r=>({label:r[0],value:r[3],color:r[1]==='Bắc'?C.plum:C.teal})),unit:'USD/m²',digits:0,height:260,labelW:190});
 fillTable('tbl-kcn-rent',['KCN','Miền','Diện tích (ha)','Giá thuê (USD/m²)'],rows.map(r=>[r[0],r[1],nf(r[2],0),nf(r[3],0)]));
}
if(document.getElementById('chFdiCountry')){
 hbarCompare('chFdiCountry',{items:[['Singapore',27,C.navy],['Trung Quốc',21,C.plum],['Hồng Kông',10,C.teal],['Khác',42,C.grey]].map(r=>({label:r[0],value:r[1],color:r[2]})),unit:'%',digits:0,height:200,labelW:110});
}
if(S('iip_mfg_yoy').length&&document.getElementById('chIipMfg')){
 const rs=S('iip_mfg_yoy').slice(-36);
 barLineChart('chIipMfg',{categories:rs.map(r=>mon(r.date)),series:[{name:'IIP chế biến, chế tạo · YoY',color:C.navy,kind:'line',values:rs.map(r=>r.value)}],unit:'%',digits:1,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-iip-mfg',['Tháng','YoY (%)'],rs.slice().reverse().map(r=>[mon(r.date),nf(r.value,2)]));
 sourceLine('chIipMfg',[SRC.nso],mon(rs.at(-1).date),'Chỉ số sản xuất công nghiệp nhóm chế biến, chế tạo, so cùng kỳ. Tháng Tết (1–2) nhiễu mạnh.');
 insight('chIipMfg','Sản xuất của khách thuê tăng là điều kiện để họ mở rộng mặt bằng và trả tiền thuê đúng hạn; IIP giảm hai quý liên tiếp thường đi trước hoãn ký hợp đồng thuê mới.');
}

if(sec['157']?.records?.length&&document.getElementById('chIpPb')){
 const rs=sec['157'].records,w=rs.filter((r,i)=>i%5===0||i===rs.length-1);
 barLineChart('chIpPb',{categories:w.map(r=>r[0].slice(8,10)+'/'+r[0].slice(5,7)+'/'+r[0].slice(2,4)),series:[{name:'P/B',color:C.navy,kind:'line',values:w.map(r=>r[2])},{name:'P/E ÷ 10',color:C.gold,kind:'line',values:w.map(r=>r[1]==null?null:r[1]/10)}],unit:'x',digits:2,height:260,zeroBase:false,rotateLabels:true});
 fillTable('tbl-ip-pb',['Phiên','P/B','P/E','Vốn hóa (nghìn tỷ)'],w.slice().reverse().map(r=>[short(r[0]),nf(r[2],2),nf(r[1],1),nf(r[3]/1000,1)]));
 sourceLine('chIpPb',[['VNDirect finfo','https://dstock.vndirect.com.vn/']],short(rs.at(-1)[0]),'Rổ mã theo dõi: BĐS khu công nghiệp (KBC, IDC, BCM, SZC, SIP, VGC, LHG). P/E = tổng vốn hóa / tổng lợi nhuận (vốn hóa ÷ P/E từng mã, VNDirect); mã lỗ không có P/E chỉ vào P/B và vốn hóa. Không phải toàn ngành. Vẽ mỗi 5 phiên.');
 insight('chIpPb',(()=>{const L=[['157','BĐS khu công nghiệp']].filter(([id])=>sec[id]?.records?.length);const l0=sec[L[0][0]].records.at(-1);return 'P/B rổ mã theo dõi, phiên '+short(l0[0])+': '+L.map(([id,name])=>{const r=sec[id].records,l=r.at(-1),y=r.find(x=>x[0]>=String(+l[0].slice(0,4)-1)+l[0].slice(4));return name+' '+nf(l[2],(2==2?2:1))+'x'+(y&&y[2]!=null?' (1 năm trước '+nf(y[2],(2==2?2:1))+'x)':'')}).join('; ')+'.'})());
}
insight('chKcnRent','Giá thuê đất miền Nam cao hơn miền Bắc khoảng 35% và tăng chậm hơn, trong khi lấp đầy cũng cao hơn (76% so với 64%): cầu miền Nam bị giới hạn bởi quỹ đất, miền Bắc bị giới hạn bởi cung mới. Đây là giá chào, không phải giá ký thực tế.');
})();
