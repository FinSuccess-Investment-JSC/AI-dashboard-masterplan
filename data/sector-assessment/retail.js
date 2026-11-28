/* Đánh giá ngành · Bán lẻ & tiêu dùng — cấu hình đăng chung (mọi người xem đều thấy bản này). DASHBOARD_WORKFLOW §52.
   Khối hiển thị: scripts/sector_package/sector-assessment.js (bản chạy: Ban-le/app/sector-assessment.js).
   Chỉnh trên web: mở Ban-le/?edit=1 → nút "Chỉnh đánh giá" → Lưu (bản nháp CHỈ trên trình duyệt đó, IndexedDB finsuccess-research).
   Đăng cho mọi người: trong khung chỉnh bấm "Xuất file cấu hình" → thay file này bằng file vừa xuất → prepare_release.py → commit, push.
   Mỗi ngành một file data/sector-assessment/<data-sector>.js; sửa file này không ảnh hưởng ngành khác. Phần thân giữ dạng JSON (nút "Nhập file…" đọc được).
   status "illustration" = nhãn "Minh họa" (giữ đến khi có đánh giá chính thức).
   Ba luận điểm minh họa trong mockup của người dùng: chưa điền vì phiên làm không có mockup (không tự viết luận điểm). */
(window.SECTOR_ASSESSMENT = window.SECTOR_ASSESSMENT || {})["retail"] = {
  "schema": 1,
  "rev": "2026-11-28-1",
  "status": "illustration",
  "score": 5,
  "scoreMax": 10,
  "stance": "neutral",
  "period": "",
  "updated": "2026-11-28",
  "view": {"mode": "full", "ratio": "1-2", "showPeriod": true, "leftTitle": "Đánh giá ngành", "rightTitle": "Luận điểm chính"},
  "theses": []
};
