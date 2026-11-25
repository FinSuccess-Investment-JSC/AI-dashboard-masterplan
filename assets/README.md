# assets/ — không còn là giao diện của trang ngành

Từ 25/11/2026 mỗi trang ngành (`Dien/`, `Thep/`, `Bank/`…) là một gói riêng và chỉ nạp file trong `<Ngành>/app/`.
Sửa file ở đây **không** làm đổi trang ngành nào.

Thư mục này còn dùng cho: trang chủ `index.html`, `Chung-khoan/`, `duong/`, và là bản gốc để đối chiếu.
`scripts/sync_brand.py` vẫn ghi `brand.css`, `share-image.js`, `motion.js`, `chart-arrange.js` ở đây và ở mọi `*/app/`.

Muốn đổi giao diện một ngành: sửa `<Ngành>/app/`. Muốn đổi quy tắc chuẩn cho mọi ngành: sửa `scripts/sector_package/`
rồi chạy `python scripts/make_sector_package.py <các ngành>`. Xem `CONTRIBUTING.md`.
