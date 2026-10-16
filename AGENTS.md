# Project instructions

- **Cấm dữ liệu Wi ngoài Bank (16/10/2026):** do tranh chấp pháp lý, không gọi WiMCP/WiData/Wifeed và không dùng lại số trong snapshot Wi cũ cho các dashboard doanh nghiệp/ngành (Bán lẻ, Bảo hiểm, BĐS, Cảng, Dệt may, Dược, Nông nghiệp, Thủy sản, Vận tải biển, Xây dựng, Điện, Đường). Nguồn thay thế: VNDirect finfo `financial_statements`/`ratios`/`stock_prices`, BCTC/CafeF, IMF Primary Commodity Prices qua FRED, EIA, ICE (`scripts/build_sector_public.py` → `data/<ngành>-public-data.js`; `scripts/fetch_public_fs.py` → `data/raw/public/`). Ô lệch >1% so với số cũ mà không xác nhận được từ BCTC thì để `null`. Số vĩ mô (NSO/Hải quan/NHNN), định giá tổng hợp ngành, TPDN BĐS và KQKD tổng hợp ngành bảo hiểm hiện để trống cho tới khi có script nguồn công khai.


Before changing sector dashboards, read [DASHBOARD_WORKFLOW.md](DASHBOARD_WORKFLOW.md) and follow its shared chart annotation, data classification and QA rules. Use shared assets in `assets/` for consistent behavior. Preserve visible data limitations and existing data when doing UI-only changes.

For design, color and typography changes, read [DESIGN_RULES.md](DESIGN_RULES.md). Apply the shared FinSuccess theme in `assets/fin-success-theme.css` across the hub and all sector dashboards.

Read `AI_WORKSPACE/README.md` and current status/task/update notes when available. Do not overwrite unrelated user edits.

`AI_WORKSPACE/` is not part of this repository: it is the private repository `FinSuccess-Investment-JSC/AI-dashboard-notes`, cloned into `AI_WORKSPACE/`. If the folder is missing (new machine or cloud session such as claude.ai/code), clone it there before starting. After changing notes, commit and push that repository too.

The user's standing preferences for this project live in `AI_WORKSPACE/claude-memory/` (start from `MEMORY.md`). When no Claude project memory is loaded for this folder (cloud session, new machine), read those files first and follow them like memory; when a preference changes, update the file there and push the notes repository. In a cloud session without a real browser, state that visual/browser QA was not done instead of claiming it passed.

Hydro reservoir data (Điện dashboard): EVN's reservoir site blocks non-Vietnamese IPs, so no cloud job can fetch it. At the start of every local session on the user's machine, check the newest file in `data/raw/evn-reservoirs/`; if it is more than 3 days old, run `bash scripts/hydro_capture_run.sh` (it backfills every missing day and publishes) and mention the result briefly. Skip this in cloud sessions.
