# Quy trình chỉnh sửa dashboard ngành cho analyst

Áp dụng cho analyst làm trên máy riêng. Quy tắc nội dung nằm ở `DASHBOARD_WORKFLOW.md`, quy tắc giao diện ở `DESIGN_RULES.md`; đọc cả hai trước khi sửa.

## Repo này hoạt động thế nào

- `AI-dashboard-masterplan` vừa chứa nguồn vừa là website. GitHub Pages đọc thẳng nhánh `main` tại `https://finsuccess-investment-jsc.github.io/AI-dashboard-masterplan/`.
- **Gộp vào `main` là lên website**, không có bước build trung gian như repo cổ phiếu. Vì vậy mọi chỉnh sửa làm trên branch, kiểm xong mới gộp.
- Workflow `Refresh dashboard data` tự cập nhật dữ liệu vào `main` lúc 07:30 và 15:30 giờ VN.

## 1. Cài đặt lần đầu

1. Chấp nhận lời mời vào repo `FinSuccess-Investment-JSC/AI-dashboard-masterplan`.
2. Cài GitHub Desktop (hoặc git), Python 3, Node.js 20, VS Code.
3. Clone repo vào thư mục **ngoài iCloud/OneDrive** (ví dụ `~/fs-work/sector`).

## 2. Bắt đầu một việc

1. Kéo `main` mới nhất (GitHub Desktop: `Fetch origin` → `Pull origin`).
2. Tạo branch từ `main`, đặt tên `<ngành>-<việc>`, ví dụ `thep-gia-hrc`, `bank-nim-q3`.
3. Một branch cho một việc.

## 3. Sửa ở đâu

| Muốn sửa | Chỗ sửa |
|---|---|
| Nội dung, chart, dữ liệu một ngành | Thư mục của ngành (`Thep/`, `Bank/`, `Dau-khi/`…) và dữ liệu tương ứng trong `data/` |
| Script cập nhật dữ liệu | `scripts/` — hỏi chủ repo trước nếu script dùng chung nhiều ngành |
| Giao diện của một ngành | `<Ngành>/app/`: mỗi ngành giữ bản JS/CSS của riêng nó, sửa ở đây không đụng ngành khác. Muốn dùng lại cải tiến của ngành khác thì chép có chủ đích, không trỏ `../assets/` |
| Quy tắc chuẩn áp cho mọi ngành (lấy từ trang Điện) | `scripts/sector_package/` rồi chạy `python scripts/make_sector_package.py <các ngành>` để đưa bản mới vào từng `<Ngành>/app/` |
| `assets/` | Chỉ còn trang chủ, `Chung-khoan/`, `duong/` nạp; bản gốc để đối chiếu. Sửa ở đây **không** đổi trang ngành |

**Gói riêng theo ngành (từ 25/11/2026, cả 16 trang ngành; BĐS KCN tách khỏi Bất động sản thành `Bat-dong-san-KCN/`):** mỗi ngành là một thư mục tự chứa — `<Ngành>/index.html` chỉ nạp `app/…` (giao diện của ngành) và `../data/…` (dữ liệu vẫn dùng chung, bot vẫn ghi vào `data/`). `scripts/sync_brand.py` đồng bộ cả các bản `*/app/brand.css`, `share-image.js`, `motion.js`, `chart-arrange.js` (không sửa tay 4 file này trong `app/`). Trong gói riêng, `site-navigation.js` tính gốc trang web bằng `../../` (vì nằm ở `<Ngành>/app/`).

**Kho mẫu chuẩn `scripts/sector_package/`** (quy tắc rút từ trang Điện, áp cho 14 ngành; Điện giữ bản gốc `power-*` + `dien-boot.js`):
- `sector-boot.js` — nạp đầu `<head>`, che nội dung và dựng bố cục một lượt rồi mới hiện (hết lộ "tab nền"). Module cần dựng/dời DOM khi mở trang đăng ký `SectorBoot.add(mốc, hàm)`; module bất đồng bộ báo `SectorBoot.wait(promise)`. Không dùng `setTimeout` sau `load`.
- `labels-vi.js` — chữ tiếng Anh do module chung sinh ra (Policy · Tax · Trade, Catalyst · Risk, Sources, YoY…) thành tiếng Việt.
- `chart-unfold.js` — chart không nằm trong mục thu gọn (mục `<details>` có chart được mở sẵn); bảng/chữ vẫn thu gọn được. Muốn giữ gập thì gắn `data-keep-folded`.
- `chart-source.js` + `sector-standard.css` — dòng "Nguồn: …" dưới mọi chart. Chart không tự tìm được nguồn được liệt kê ở `document.documentElement.dataset.pwSrcMissing`; thêm nguồn ghi tay cho ngành bằng `window.SECTOR_SOURCE_MANUAL = [[/^Tiêu đề/, 'Nguồn'], …]` trong trang ngành, không đoán.
- Sửa mẫu → chạy lại `python scripts/make_sector_package.py Ban-le Bank …` (chạy lại được nhiều lần: chép bản mẫu mới, đổi hẹn giờ, cập nhật `?v=`) → so lại từng ngành trước khi PR.

**Điện không còn lộ "tab nền":** `Dien/app/dien-boot.js` nạp đầu tiên trong `<head>`, che nội dung từ lúc vẽ đầu tiên và chạy mọi bước dựng bố cục trong một lượt ngay sau DOMContentLoaded, rồi mới hiện trang. Module mới của Điện cần dựng/dời DOM khi mở trang thì đăng ký `DienBoot.add(mốc, hàm)` (mốc nhỏ chạy trước; các mốc đang dùng: -1, 0, 50, 300, 500, 600, 700, 800, 900, 1500, 2000), **không** dùng `setTimeout` sau sự kiện `load` — làm vậy sẽ lóe lại bố cục cũ. Đo thời điểm hiện trang: `performance.getEntriesByName('dien:ready')`.

**Không sửa tay:**
- `assets/brand.css` và `share-image.js`: hai file này được chép nguyên văn từ repo cổ phiếu (`FinSuccess-dashboard-source/_template/`) bằng `scripts/sync_brand.py`; sửa ở đây sẽ bị ghi đè. Muốn đổi giao diện chung thì sửa bên repo cổ phiếu.
- File dữ liệu do workflow tự ghi (`data/daily-data.js`, `data/update-status.json`…), trừ khi đang sửa đúng script sinh ra chúng.

Quy tắc dữ liệu: số không xác minh được để trống, không điền 0, không nội suy. Mỗi chart ghi nguồn, kỳ quan sát và lịch công bố theo `DASHBOARD_WORKFLOW.md` mục 2. Nhận định của analyst tách khỏi phần AI viết.

## 4. Kiểm tra trước khi gộp

1. Mở trang ngành vừa sửa trên máy: chạy `python3 -m http.server 8000` ở gốc repo rồi vào `http://localhost:8000/<Thư-mục-ngành>/`. Kiểm từng tab, mở console (F12) xem có lỗi đỏ không.
2. Chạy test: `node tests/data-math.test.cjs`, `node tests/financial-comparison.test.cjs`, và `python3 -m pytest tests` nếu sửa script Python.
3. Nếu sửa `assets/`, mở thêm vài ngành khác để chắc không vỡ.

## 5. Gộp vào main

1. Kéo `main` mới nhất về branch (GitHub Desktop: `Branch` → `Update from main`). Tránh gộp đúng lúc workflow 07:30/15:30 đang chạy.
2. Nếu báo **conflict** ở file dữ liệu do workflow ghi: giữ bản của `main`. Ở file mình sửa: đọc kỹ hai bên; không chắc thì hỏi chủ repo.
3. Mở **Pull Request** vào `main`, ghi: ngành và phần thay đổi, nguồn và ngày dữ liệu, đã kiểm gì, giới hạn còn lại.
4. Gộp PR. GitHub Pages tự triển khai trong vài phút (cache có thể tới 10 phút).
5. Mở website kiểm lại. Nếu sau 15 phút chưa đổi, xem tab **Actions** → `pages build and deployment`; lỗi thì báo chủ repo.

Git gộp theo từng dòng, không chép đè cả file; mọi phiên bản cũ còn trong lịch sử nên có thể khôi phục.

## 6. Tuyệt đối không

- `git push --force` lên `main`.
- Commit thẳng vào `main` thay đổi chưa kiểm.
- Commit PDF/Excel gốc, token, mật khẩu, ảnh chụp QA, file `~$*.xlsx`.
- Sửa tay `assets/brand.css` / `share-image.js`.
