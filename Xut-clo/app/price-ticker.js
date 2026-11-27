/* Dải giá chạy cho ngành không dùng (hoặc không đủ số cho) sector-visuals.js (27/11/2026): cùng giao diện .fsv-ticker (CSS ở fin-success-theme.css).
   Số đọc từ dữ liệu đã nạp trên trang; không tính số mới ngoài % so cùng kỳ. Ngành chọn theo body[data-pkg] rồi body[data-sector].
   Mẫu chung ở scripts/sector_package/, chép vào <Ngành>/app/. Thêm ngành: thêm một hàm vào SECTORS. */
(() => {
  'use strict';
  const nf = (v, d) => Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
  const digits = v => Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 10 ? 1 : 2;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const dlabel = d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
  const when = d => d.length >= 10 ? dlabel(d) : d.length === 7 ? 'T' + (+d.slice(5, 7)) + '/' + d.slice(2, 4) : d.length === 4 ? 'năm ' + d : d;
  const chg = (v, pp) => v == null || !isFinite(v) ? '' : `<span class="${v >= 0 ? 'fsv-up' : 'fsv-dn'}">${v >= 0 ? '▲ +' : '▼ −'}${nf(Math.abs(v), 1)}${pp ? ' điểm %' : '%'}</span>`;
  // Bản ghi về dạng {date, value}: nhận {date,value} hoặc [date, value, …].
  const norm = recs => (recs || []).map(r => Array.isArray(r) ? {date: String(r[0]), value: r[1]} : r && {date: String(r.date), value: r.value})
    .filter(r => r && r.value != null && isFinite(r.value));
  const tk = (label, title, value, change, pp, suffix = '') =>
    `<span class="fsv-tk" title="${esc(title)}"><em>${esc(label)}</em><b>${nf(value, digits(value))}${suffix}</b>${chg(change, pp)}</span>`;

  // Giá trị cuối + so cùng kỳ năm trước: năm → năm trước; tháng → cùng tháng năm trước; ngày/tuần → điểm gần nhất cách ≥ 1 năm (lệch ≤ 45 ngày).
  // irregular: chuỗi theo sự kiện, không so. Chuỗi đơn vị % thì so bằng điểm %.
  function item(label, name, unit, recs, opt = {}) {
    const rows = norm(recs), last = rows.at(-1); if (!last) return null;
    const d = last.date; let prev = null;
    if (!opt.irregular) {
      if (d.length === 4) prev = rows.find(r => r.date === String(+d - 1));
      else if (d.length === 7) prev = rows.find(r => r.date.slice(0, 7) === String(+d.slice(0, 4) - 1) + d.slice(4, 7));
      else {
        const t = new Date(d.slice(0, 10)); t.setFullYear(t.getFullYear() - 1); const cut = t.toISOString().slice(0, 10);
        prev = rows.filter(r => r.date.slice(0, 10) <= cut).at(-1);
        if (prev && (new Date(cut) - new Date(prev.date.slice(0, 10))) / 864e5 > 45) prev = null;
      }
    }
    const pp = String(unit).trim() === '%';
    const y = prev == null ? null : pp ? last.value - prev.value : prev.value ? (last.value / prev.value - 1) * 100 : null;
    return tk(label, `${name} · ${unit} · ${when(d)}${y == null ? '' : ' · so cùng kỳ năm trước'}`, last.value, y, pp);
  }
  // P/E từng mã (VNDirect, theo phiên): không kèm % vì chưa có chuỗi P/E cùng kỳ; rê chuột xem trung vị 5 năm.
  function peItems(codes, src) {
    const V = src || window.COMPANY_VALUATION?.companies || {};
    return codes.map(c => {
      const q = V[c]; if (!q || !isFinite(q.pe) || q.pe <= 0) return null;
      return `<span class="fsv-tk" title="P/E ${c} · VNDirect · phiên ${esc(q.date)}${q.median5?.pe ? ' · trung vị 5 năm ' + nf(q.median5.pe, 1) + 'x' : ''}"><em>P/E ${c}</em><b>${nf(q.pe, 1)}x</b></span>`;
    });
  }
  // P/E rổ ngành (khối sector_ratio của *_PUBLIC): so cùng kỳ như các ngành khác.
  function sectorPe(pub, id) {
    const r = pub?.blocks?.sector_ratio?.by_sector?.[id]; if (!r) return null;
    const rec = r.records || [], last = rec.at(-1); if (!last) return null;
    const ago = rec.filter(x => x[0] <= String(+last[0].slice(0, 4) - 1) + last[0].slice(4)).at(-1);
    return tk('P/E ' + r.name, `P/E rổ mã ${r.name} · phiên ${last[0]}${ago ? ' · so cùng kỳ năm trước' : ''}`, last[1], ago && ago[1] ? (last[1] / ago[1] - 1) * 100 : null, false, 'x');
  }
  const macro = (pub, id) => pub?.blocks?.macro?.series?.[id];

  const SECTORS = {
    fertilizer() {
      const S = window.FERT_DATA?.series; if (!S) return [];
      const it = (k, label) => S[k] && item(label, S[k].name, S[k].unit, S[k].records);
      return [it('urea', 'Urê Trung Đông'), it('urea_zce_daily', 'Urê Trịnh Châu'), it('dap', 'DAP'), it('potash', 'Kali MOP'), it('tsp', 'TSP'),
        it('phosrock', 'Quặng phosphate'), it('gas_eu', 'Khí TTF'), it('lng_jp', 'LNG Nhật Bản'), it('gas_us', 'Khí Henry Hub'), it('coal_au', 'Than Newcastle'),
        it('brent', 'Dầu Brent'), it('usdvnd', 'USD/VND')];
    },
    chloralkali() {
      const D = window.XC_DATA; if (!D) return [];
      const p4 = D.p4 || {}, rows = [...(p4.monthly || []), ...(p4.weekly || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
      const seen = new Set(), uniq = rows.filter(r => !seen.has(r.date) && seen.add(r.date));
      // Giá điện bán lẻ bình quân (EVN): so với lần điều chỉnh trước, không phải so cùng kỳ.
      const t = (D.inputs?.tariffs || []).filter(x => isFinite(x.avg_price)).at(-1);
      const power = t && tk('Giá điện bình quân', `Giá bán lẻ điện bình quân · đồng/kWh · ${t.decision}, hiệu lực ${dlabel(t.effective)} · so với lần điều chỉnh trước`, t.avg_price, t.avg_change_pct);
      return [item('Phốt pho vàng P4 (TQ)', p4.indicator || 'Giá phốt pho vàng P4', p4.unit || 'CNY/tấn', uniq), power];
    },
    rubber() {
      const S = window.RUBBER_DATA?.series; if (!S) return [];
      const it = (k, label) => S[k] && item(label, S[k].name, S[k].unit, S[k].records);
      return [it('vn_svr10', 'SVR 10 Việt Nam'), it('th_str20', 'STR 20 Thái Lan'), it('th_rss3', 'RSS 3 Thái Lan'), it('id_sir20', 'SIR 20 Indonesia'),
        it('my_smr20', 'SMR 20 Malaysia'), it('sg_tsr20', 'TSR 20 Singapore'), it('shfe_ru', 'Cao su SHFE'), it('ine_nr', 'TSR 20 INE'),
        it('shfe_br', 'Cao su tổng hợp BR'), it('exp_px', 'Giá xuất khẩu VN'), it('brent', 'Dầu Brent'), it('cnyusd', 'CNY/USD'),
        ...peItems(['GVR', 'PHR', 'DPR'])];
    },
    aviation() {
      const D = window.AVIATION_DATA; if (!D) return [];
      const m = k => D.blocks?.macro?.series?.[k];
      const it = (k, label) => m(k) && item(label, m(k).name, m(k).unit, m(k).records);
      return [D.fuel && item('Nhiên liệu bay', 'Jet fuel giao ngay US Gulf Coast (EIA)', D.fuel.unit, D.fuel.monthly),
        D.fx && item('USD/VND', 'Tỷ giá trung tâm (NHNN)', D.fx.unit, D.fx.monthly),
        it('air_pax', 'Khách hàng không'), it('visitors_air', 'Khách quốc tế bằng đường bay'), it('air_freight', 'Hàng hóa hàng không'),
        ...peItems(['HVN', 'VJC', 'ACV', 'SCS', 'NCT', 'SGN', 'AST', 'SAS'], window.AVIATION_VAL?.companies)];
    },
    pharma() {
      const P = window.PHARMA_PUBLIC; if (!P) return [];
      const it = (k, label) => macro(P, k) && item(label, macro(P, k).name, macro(P, k).unit, macro(P, k).records);
      return [sectorPe(P, '222'), it('import_drugs', 'Nhập khẩu thuốc'), it('import_api', 'Nhập khẩu nguyên liệu dược'), it('cpi_health', 'CPI y tế'),
        it('usdvnd', 'USD/VND'), ...peItems(['DHG', 'IMP', 'DBD', 'TRA', 'DMC', 'DVN'])];
    },
    industrial() {
      return [sectorPe(window.REALESTATE_PUBLIC, '157'), ...peItems(['KBC', 'IDC', 'SZC', 'BCM', 'VGC', 'SIP', 'LHG', 'PHR', 'GVR'])];
    },
    telecom() {
      const S = window.TELECOM?.series; if (!S) return [];
      const it = (k, label, irregular) => S[k] && item(label, S[k].name, S[k].unit, S[k].records || S[k].points || S[k].data, {irregular});
      return [it('mob_bb', 'Thuê bao băng rộng di động'), it('subs_5g', 'Thuê bao 5G', true), it('cov_5g_b', 'Phủ sóng 5G', true), it('bts_5g', 'Trạm 5G', true),
        it('ctr_towers', 'Trạm BTS TowerCo (CTR)'), it('mob_subs', 'Thuê bao di động'), it('fix_bb', 'Thuê bao Internet cố định'), it('rev', 'Doanh thu viễn thông')];
    }
  };

  function mount() {
    if (document.querySelector('.fsv-ticker')) return true;
    const tabs = document.querySelector('.majortabs'); if (!tabs) return false;
    const b = document.body?.dataset || {}, build = SECTORS[b.pkg] || SECTORS[b.sector]; if (!build) return true;
    const items = build().filter(Boolean); if (items.length < 2) return true;
    const bar = document.createElement('div'); bar.className = 'fsv-ticker'; bar.setAttribute('aria-label', 'Giá hàng hóa, chỉ số ngành và định giá, so với cùng kỳ');
    const run = items.join('');
    bar.innerHTML = `<div class="fsv-tk-run">${run}<span class="fsv-tk-dup" aria-hidden="true">${run}</span></div>`;
    tabs.before(bar);
    // Trang còn dời tiêu đề/thanh tab sau khi dựng: đặt lại ngay trên thanh tab lớn khi trang tải xong.
    const again = () => { const m = document.querySelector('.majortabs'); if (m && m.previousElementSibling !== bar) m.before(bar); };
    if (document.readyState === 'complete') setTimeout(again, 1500); else addEventListener('load', () => { again(); setTimeout(again, 1500); }, {once: true});
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) bar.classList.add('still');
    return true;
  }
  // Trang dựng thanh tab lớn bằng script (defer): thử lại tới khi có, tối đa 10 giây.
  const start = () => { if (mount()) return; let n = 0; const t = setInterval(() => { if (mount() || ++n > 40) clearInterval(t); }, 250); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
