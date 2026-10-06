# Claude routine: xử lý hàng chờ cập nhật

Chạy 08:00 thứ Hai–thứ Sáu (giờ Việt Nam), sau job GitHub 07:30 đã xếp hàng chờ. Người dùng cho phép tự publish (06/10/2026); mọi thay đổi phải qua kiểm tra dưới đây.

## 1. Chuẩn bị

1. Repo `FinSuccess-Investment-JSC/AI-dashboard-masterplan`, nhánh `main`: `git pull origin main`.
2. Nếu thiếu `AI_WORKSPACE/`: `git clone https://github.com/FinSuccess-Investment-JSC/AI-dashboard-notes.git AI_WORKSPACE`.
3. Đọc `AGENTS.md`, `AI_WORKSPACE/claude-memory/MEMORY.md` và các file nó trỏ tới, `DASHBOARD_WORKFLOW.md` §2, §5, §12.
4. `python3 scripts/update_scheduler.py --queue`. Danh sách rỗng thì **dừng, không commit**.

## 2. Xử lý từng mục (B → C → D)

Mỗi mục có `where` (trang + card), `source`, `how`, `gates`, `signals` (tài liệu mới watcher thấy), `reasons`.

Mỗi lượt xử lý tối đa 6 mục đầu theo đúng thứ tự `--queue` in ra (đã sắp: B → C → D, mục chưa thử trước mục đã lỗi, mục cũ trước). Mục chưa làm cứ để trong hàng chờ cho sáng hôm sau, không `--fail`.

**B · Wi (Bank).** Với từng id trong `wiBlocks`, gọi đúng tool/endpoint/filters/columns trong `data/bank-wi-contract.json` → ghi response vào `data/raw/wi/<raw_file>` theo cấu trúc file hiện có (request, fetched_at, columns/rows hoặc series). Sau đó `python3 scripts/build_bank_wi.py --checked-at <ISO hiện tại>` và `python3 -m unittest tests/test_bank_wi.py`. Không có WiMCP hoặc Wi lỗi → `--fail`, giữ số cũ.

**C · Tài liệu.** Mở tài liệu trong `signals` (hoặc `source`), xác nhận kỳ dữ liệu và đơn vị, rồi sửa số trong `where.page`, đúng card `where.blocks`: mảng dữ liệu của chart trong script cuối trang, bảng dữ liệu, link nguồn bấm được kèm ngày công bố, và ngày "Kiểm tra" ở dòng cadence. Watcher báo nhầm hoặc tài liệu không có số mới → `--done` kèm ghi chú, không sửa trang.

**D · Lời bình AI.** Đọc lại số liệu nền đã đổi (trong `reasons`). Cập nhật con số và nhận định bị thay đổi, đổi dấu "AI viết dd/mm/yyyy". Không bao giờ sửa phần analyst (`.analyst-input`, `data-update-kind="analyst"`). Kết luận không đổi → chỉ cập nhật số; không có gì đổi → `--done` kèm ghi chú.

**Luật chung:** không bịa, không nội suy, thiếu thì để trống và ghi hạn chế; phân biệt kỳ quan sát, ngày công bố, ngày kiểm; nguồn phải là link bấm được; ít chữ, số nổi bật. Không chắc số đúng → `--fail` với lý do, để người dùng xem.

## 3. Kết thúc

1. `python3 -m unittest discover -s tests && node tests/data-math.test.cjs && node tests/financial-comparison.test.cjs`. Test lỗi → hoàn tác thay đổi của mục gây lỗi, `--fail` mục đó.
2. Có sửa trang hoặc dữ liệu → `python3 scripts/prepare_release.py --version $(date -u +%Y%m%dT%H%M%SZ)`.
3. Đóng từng mục: `python3 scripts/update_scheduler.py --done ID --note "<số mới + kỳ>"` hoặc `--fail ID --note "<lý do>"`.
4. Ghi đè `updates/routine-notify.txt` (tối đa 10 dòng): mục nào cập nhật số gì cho kỳ nào, mục nào lỗi, và câu "Chưa kiểm giao diện bằng trình duyệt" nếu không có trình duyệt. Push file này sẽ gửi Zalo.
5. `git add` dữ liệu, trang, `updates/`; commit `Routine: cập nhật <ids>` (kèm dòng Co-Authored-By của Claude); `git pull --rebase --autostash origin main`; `git push origin HEAD:main`. Push từ routine tự kích hoạt Pages build.
6. Thêm một mục ngắn vào `AI_WORKSPACE/UPDATES.md`, commit và push repo notes.
