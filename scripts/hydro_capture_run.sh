#!/usr/bin/env bash
# Bù dữ liệu hồ thủy điện EVN (00h mỗi ngày) rồi publish nếu có quan sát mới.
# Chạy từ routine Claude cloud 3 lần/tuần; EVN chặn GitHub runner nên không dùng Actions.
# Ngày EVN không có số liệu được bỏ qua (để trống), không làm job thất bại.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull -q --rebase origin main
last=$(ls data/raw/evn-reservoirs/ 2>/dev/null | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}\.json$' | tail -1 | cut -c1-10 || true)
from=$(python3 -c "import datetime as d,sys;print((d.date.fromisoformat(sys.argv[1])-d.timedelta(days=7)).isoformat())" "${last:-2026-08-28}")
# Kiểm tra kết nối EVN mỗi lần chạy (không ghi file); lỗi mạng làm job thất bại rõ ràng.
python3 scripts/fetch_hydro_reservoirs.py --date "$(date -u +%F)" --dry-run
python3 scripts/fetch_hydro_reservoirs.py --backfill-from "$from" || echo "Một số ngày EVN không có số liệu; giữ trống."
python3 scripts/update_hydro_reservoirs.py
if git diff --quiet -- data/hydro-reservoirs.js && [ -z "$(git status --porcelain data/raw/evn-reservoirs)" ]; then
  echo 'Không có quan sát EVN mới.'; exit 0
fi
python3 scripts/prepare_release.py --version "$(date -u +%Y%m%dT%H%M%SZ)-hydro"
python3 -m unittest discover -s tests -q
git add data/raw/evn-reservoirs data/hydro-reservoirs.js data/site-release.json index.html 404.html */index.html
git commit -q -m "Cập nhật quan sát hồ thủy điện EVN 00h (đến $(ls data/raw/evn-reservoirs | tail -1 | cut -c1-10))"
git pull -q --rebase origin main && git push -q origin HEAD:main
echo "Đã publish."
