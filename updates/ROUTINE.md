# Claude routine: xử lý hàng chờ cập nhật

Chạy 08:00 thứ Hai–thứ Sáu (giờ Việt Nam), sau job GitHub 07:30 đã xếp hàng chờ. Người dùng cho phép tự publish (06/10/2026); mọi thay đổi phải qua kiểm tra dưới đây. Routine chỉ dùng repo này (một repo/phiên để hook trong `.claude/settings.json` chạy); không cần repo ghi chú.

## 1. Chuẩn bị

1. Nhánh `main`: `git pull origin main`.
2. Đọc `AGENTS.md`, `DASHBOARD_WORKFLOW.md` §2, §5, §12, §16 và mục "Quy tắc của người dùng" cuối file này.
3. `python3 scripts/update_scheduler.py --queue`. Danh sách rỗng thì **dừng, không commit**.

## 2. Xử lý từng mục

Mỗi mục có `where` (trang + card), `source`, `how`, `gates`, `signals` (tài liệu mới watcher thấy), `reasons`.

Mỗi lượt xử lý tối đa 6 mục đầu theo đúng thứ tự `--queue` in ra (đã sắp: B → C → D, mục chưa thử trước mục đã lỗi, mục cũ trước). Mục chưa làm cứ để trong hàng chờ cho sáng hôm sau, không `--fail`.

**B · Wi (Bank).** Không chép tay số Wi.
1. `python3 scripts/wi_ingest.py plan <id mục>` in danh sách lệnh WiMCP cần gọi.
2. Gọi **đúng từng lệnh**: cùng tool, `action`, `indicator_id`/`endpoint_name`/`filters`/`indicator_code`, `from_time` không muộn hơn plan. Hook `scripts/wi_capture.py` tự lưu nguyên văn kết quả vào `data/raw/wi/.inbox/`.
3. `python3 scripts/wi_ingest.py ingest <id mục>`: ghép kết quả vào từng file, đối chiếu kỳ chồng lấn, ghi Wi sửa số vào `revisions`. File báo "lỗi" hoặc "thiếu kết quả" giữ nguyên số cũ; gọi lại lệnh đó một lần, vẫn lỗi thì ghi vào `--fail`.
4. File tin tức (`news_bank_*.json`, "bỏ qua" trong plan): thay bằng 25 CBTT + 11 ai_news mới nhất theo đúng cấu trúc cũ.
5. `python3 scripts/build_bank_wi.py --checked-at <ISO hiện tại>` và `python3 -m unittest tests/test_bank_wi.py tests/test_wi_ingest.py`.

**C · Tài liệu.** Mở tài liệu trong `signals` (hoặc `source`), xác nhận kỳ dữ liệu và đơn vị, rồi sửa số trong `where.page`, đúng card `where.blocks`: mảng dữ liệu của chart trong script cuối trang, bảng dữ liệu, link nguồn bấm được kèm ngày công bố, và ngày "Kiểm tra" ở dòng cadence. Watcher báo nhầm hoặc tài liệu không có số mới → `--done` kèm ghi chú, không sửa trang. Không truy cập được nguồn (403, chặn mạng) → `--fail` ghi rõ tên miền.

**D · Lời bình AI.** Đọc lại số liệu nền đã đổi (trong `reasons`). Cập nhật con số và nhận định bị thay đổi, đổi dấu "AI viết dd/mm/yyyy". Không bao giờ sửa phần analyst (`.analyst-input`, `data-update-kind="analyst"`). Kết luận không đổi → chỉ cập nhật số; không có gì đổi → `--done` kèm ghi chú.

**Luật chung:** không bịa, không nội suy, thiếu thì để trống và ghi hạn chế; phân biệt kỳ quan sát, ngày công bố, ngày kiểm; nguồn phải là link bấm được; ít chữ, số nổi bật. Không chắc số đúng → `--fail` với lý do, để người dùng xem.

## 3. Kết thúc

1. `python3 -m unittest discover -s tests && node tests/data-math.test.cjs && node tests/financial-comparison.test.cjs`. Test lỗi → hoàn tác thay đổi của mục gây lỗi, `--fail` mục đó.
2. Có sửa trang hoặc dữ liệu → `python3 scripts/prepare_release.py --version $(date -u +%Y%m%dT%H%M%SZ)`.
3. Đóng từng mục: `python3 scripts/update_scheduler.py --done ID --note "<số mới + kỳ>"` hoặc `--fail ID --note "<lý do>"`.
4. Ghi đè `updates/routine-notify.txt` (tối đa 10 dòng): mục nào cập nhật số gì cho kỳ nào, Wi sửa số đáng chú ý, mục nào lỗi, và câu "Chưa kiểm giao diện bằng trình duyệt" nếu không có trình duyệt. Push file này sẽ gửi Zalo.
5. `git add` dữ liệu, trang, `updates/` (không add `data/raw/wi/.inbox/`); commit `Routine: cập nhật <ids>` (kèm dòng Co-Authored-By của Claude); `git pull --rebase --autostash origin main`; `git push origin HEAD:main`. Push từ routine tự kích hoạt Pages build.

## Quy tắc của người dùng (bản rút gọn từ memory)

- Dashboard ngành ưu tiên dữ liệu thị trường mới nhất; số BCTC/doanh nghiệp chỉ cập nhật khi người dùng nhắn — routine không tự đi tìm BCTC.

- Màu và font theo FinSuccess (`DESIGN_RULES.md`, `assets/fin-success-theme.css`, style fisc.vn); không thêm màu ngoài token.
- Nguồn dưới mỗi chart/bảng/số là link bấm được tới đúng trang hoặc file gốc; không có URL thì ghi tên file nội bộ, tuyệt đối không bịa link.
- Ít chữ, dễ nắm key: không viết điều đã thấy trên chart; con số và cụm ý chính in đậm/đổi màu (`ResearchLayout.emphasize()`, `<mark class="key-phrase">`); so với kỳ trước thì kẻ bảng Trước/Sau (`.compare-table`). Nhãn lời bình ghi đúng "Phân tích AI ngày dd/mm/yyyy".
- Giữ thứ tự tab chuẩn (Tổng quan → Cung–Cầu → Giá–Chi phí–Margin → Policy/Trade/Tax → Catalyst/Risk → Key players → tab riêng); nội dung một chủ đề nằm trong dropdown của chủ đề đó; không đổi bố cục khi chỉ cập nhật số.
