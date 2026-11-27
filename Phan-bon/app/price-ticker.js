/* Dải giá chạy cho ngành không dùng sector-visuals.js (27/11/2026): cùng giao diện .fsv-ticker (CSS ở fin-success-theme.css). Mã DN của Phân bón, Xút – Clo chưa có trong company-valuation nên chưa có P/E.
   Số đọc từ dữ liệu đã nạp trên trang (FERT_DATA, XC_DATA); không tính số mới ngoài % so cùng kỳ.
   Mẫu chung ở scripts/sector_package/, chép vào <Ngành>/app/. Thêm ngành: thêm một hàm vào SECTORS. */
(() => {
  'use strict';
  const nf = (v, d) => Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
  const digits = v => Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 10 ? 1 : 2;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const mlabel = d => 'T' + (+d.slice(5, 7)) + '/' + d.slice(2, 4);
  const dlabel = d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
  const chg = v => v == null || !isFinite(v) ? '' : `<span class="${v >= 0 ? 'fsv-up' : 'fsv-dn'}">${v >= 0 ? '▲ +' : '▼ −'}${nf(Math.abs(v), 1)}%</span>`;
  const ok = r => r && r.value != null && isFinite(r.value);

  // Một mục giá: giá trị cuối + % so cùng kỳ năm trước (tháng: cùng tháng năm trước; ngày/tuần: điểm gần nhất cách ≥ 1 năm).
  function priceItem(label, name, unit, recs, daily) {
    const rows = (recs || []).filter(ok);
    const last = rows.at(-1); if (!last) return null;
    const d = String(last.date);
    let prev;
    if (daily || d.length > 7) {
      const t = new Date(d.slice(0, 10)); t.setFullYear(t.getFullYear() - 1);
      const cut = t.toISOString().slice(0, 10);
      prev = rows.filter(r => String(r.date).slice(0, 10) <= cut).at(-1);
      if (prev && (new Date(cut) - new Date(String(prev.date).slice(0, 10))) / 864e5 > 45) prev = null;  // quá xa thì không so
    } else {
      const m = String(+d.slice(0, 4) - 1) + d.slice(4, 7);
      prev = rows.find(r => String(r.date).slice(0, 7) === m);
    }
    const y = prev && prev.value ? (last.value / prev.value - 1) * 100 : null;
    const when = d.length > 7 ? dlabel(d) : mlabel(d);
    return `<span class="fsv-tk" title="${esc(name)} · ${esc(unit)} · ${when}${y == null ? '' : ' · so cùng kỳ năm trước'}"><em>${esc(label)}</em><b>${nf(last.value, digits(last.value))}</b>${chg(y)}</span>`;
  }
  const SECTORS = {
    fertilizer() {
      const S = window.FERT_DATA?.series; if (!S) return [];
      const it = (k, label, daily) => S[k] && priceItem(label, S[k].name, S[k].unit, S[k].records, daily);
      return [it('urea', 'Urê Trung Đông'), it('urea_zce_daily', 'Urê Trịnh Châu', true), it('dap', 'DAP'), it('potash', 'Kali MOP'), it('tsp', 'TSP'),
        it('phosrock', 'Quặng phosphate'), it('gas_eu', 'Khí TTF'), it('lng_jp', 'LNG Nhật Bản'), it('gas_us', 'Khí Henry Hub'), it('coal_au', 'Than Newcastle'),
        it('brent', 'Dầu Brent'), it('usdvnd', 'USD/VND')];
    },
    chloralkali() {
      const D = window.XC_DATA; if (!D) return [];
      const p4 = D.p4 || {}, rows = [...(p4.monthly || []), ...(p4.weekly || [])].filter(ok).sort((a, b) => String(a.date).localeCompare(String(b.date)));
      const seen = new Set(), uniq = rows.filter(r => !seen.has(r.date) && seen.add(r.date));
      // Giá điện bán lẻ bình quân (EVN): so với lần điều chỉnh trước, không phải so cùng kỳ.
      const tf = (D.inputs?.tariffs || []).filter(x => isFinite(x.avg_price)), t = tf.at(-1);
      const power = t && `<span class="fsv-tk" title="Giá bán lẻ điện bình quân · đồng/kWh · ${esc(t.decision)}, hiệu lực ${dlabel(t.effective)} · so với lần điều chỉnh trước"><em>Giá điện bình quân</em><b>${nf(t.avg_price, 0)}</b>${chg(t.avg_change_pct)}</span>`;
      return [priceItem('Phốt pho vàng P4 (TQ)', p4.indicator || 'Giá phốt pho vàng P4', p4.unit || 'CNY/tấn', uniq, true), power];
    }
  };

  function mount() {
    if (document.querySelector('.fsv-ticker')) return true;
    const tabs = document.querySelector('.majortabs'); if (!tabs) return false;
    const build = SECTORS[document.body?.dataset.sector]; if (!build) return true;
    const items = build().filter(Boolean); if (items.length < 2) return true;
    const bar = document.createElement('div'); bar.className = 'fsv-ticker'; bar.setAttribute('aria-label', 'Giá hàng hóa và định giá doanh nghiệp, so với cùng kỳ');
    const run = items.join('');
    bar.innerHTML = `<div class="fsv-tk-run">${run}<span class="fsv-tk-dup" aria-hidden="true">${run}</span></div>`;
    tabs.before(bar);
    // Trang còn dời tiêu đề/thanh tab sau khi dựng: đặt lại ngay trên thanh tab lớn khi trang tải xong.
    const again = () => { const m = document.querySelector('.majortabs'); if (m && m.previousElementSibling !== bar) m.before(bar); };
    addEventListener('load', () => { again(); setTimeout(again, 1500); }, {once: true});
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) bar.classList.add('still');
    return true;
  }
  // Trang dựng thanh tab lớn bằng script (defer): thử lại tới khi có, tối đa 10 giây.
  const start = () => { let n = 0; const t = setInterval(() => { if (mount() || ++n > 40) clearInterval(t); }, 250); mount() && clearInterval(t); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
