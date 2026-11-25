/* Gói ngành · dựng bố cục một lượt, không lộ "tab nền" (25/11/2026, mẫu lấy từ Dien/app/dien-boot.js).
   Trước đây các module dời khối và dựng tab chạy theo hẹn giờ sau sự kiện load (load + 50…1500 ms), nên trang hiện HTML gốc
   rồi đổi bố cục nhiều lần trước mắt người xem. File này nạp đồng bộ trong <head>, trước mọi script khác:
   - ẩn phần nội dung (visibility, vẫn đo được kích thước cho chart) ngay từ lúc vẽ đầu tiên;
   - các module đăng ký bằng SectorBoot.add(mốc, hàm) thay cho hẹn giờ; mốc giữ đúng thứ tự cũ (số nhỏ chạy trước,
     cùng mốc thì theo thứ tự nạp script);
   - ngay sau DOMContentLoaded (đã chờ mọi handler DOMContentLoaded khác chạy xong) chạy hết hàng đợi trong một lượt,
     chờ các hẹn giờ ngắn bên trong (≤ 200 ms) rồi mới hiện trang;
   - module đăng ký muộn (sau khi đã chạy) thì chạy ngay ở lượt kế tiếp.
   Chốt an toàn: lỗi ở một module không chặn module khác; quá 12 giây vẫn hiện trang. */
(() => {
  'use strict';
  const root = document.documentElement;
  const q = [];
  let state = 'wait'; // wait → running → done
  const B = window.SectorBoot = {
    add(at, fn) {
      if (state === 'done') { setTimeout(fn, 0); return; }
      q.push({at, i: q.length + (state === 'running' ? 1e6 : 0), fn});
    },
    // Module bất đồng bộ (vd. research-editorial.js chờ IndexedDB) báo trước để lượt dựng đợi nó, tối đa 3 giây.
    wait(p) { if (state === 'wait') waits.push(Promise.resolve(p).catch(() => {})); },
    get done() { return state === 'done'; }
  };
  const waits = [];
  root.classList.add('sector-booting');
  const style = document.createElement('style');
  style.id = 'sector-boot-style';
  style.textContent = '.sector-booting .majortabs,.sector-booting .major-tabs,.sector-booting .container,.sector-booting body>header.topbar,.sector-booting body>main.wrap{visibility:hidden}'
    + '.sector-booting body::after{content:"Đang tải dashboard ngành…";position:fixed;left:0;right:0;top:45vh;text-align:center;'
    + 'font:500 14px/1.4 Inter,system-ui,sans-serif;color:#6b7280;pointer-events:none}';
  document.head.append(style);
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    root.classList.remove('sector-booting');
    performance.mark?.('sector:ready'); // đo: performance.getEntriesByName('sector:ready')
    window.dispatchEvent(new Event('sector:ready'));
  };
  const run = () => {
    state = 'running';
    while (q.length) {
      q.sort((a, b) => a.at - b.at || a.i - b.i);
      const {fn} = q.shift();
      try { fn(); } catch (e) { console.error('[SectorBoot]', e); }
    }
    state = 'done';
    // Hẹn giờ ngắn bên trong module (layout-balance 150 ms, power-labels 150 ms) xong rồi mới hiện.
    setTimeout(reveal, 250);
  };
  const go = () => Promise.race([Promise.all(waits), new Promise(r => setTimeout(r, 3000))]).then(() => setTimeout(run, 0));
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => setTimeout(go, 0), 0));
  setTimeout(reveal, 12000);
})();
