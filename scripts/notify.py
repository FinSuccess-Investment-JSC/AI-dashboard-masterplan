#!/usr/bin/env python3
"""Gửi nội dung file thông báo (do refresh_release.py --notify-file ghi) tới Zalo OA hoặc Telegram.

File rỗng thì không gửi. Kênh chọn theo biến môi trường có mặt:
  ZALO_OA_TOKEN + ZALO_USER_ID          → Zalo Official Account (tin tư vấn tới người theo dõi OA)
  TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID → Telegram bot
Không có biến nào thì chỉ in ra stdout.

Bản dùng chung với Stock dashboard/_template/tools/notify.py.
CHƯA KIỂM TRA với Zalo thật: endpoint và loại tin của Zalo OA cần đối chiếu tài liệu
developers.zalo.me khi tạo OA (chính sách tin miễn phí/có phí thay đổi theo thời kỳ).
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path

LIMIT = 1800


def post(url: str, payload: dict, headers: dict | None = None) -> str:
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="POST",
                                 headers={"Content-Type": "application/json", **(headers or {})})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode("utf-8", "replace")


def main() -> int:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else ".notify.txt")
    text = path.read_text(encoding="utf-8").strip() if path.exists() else ""
    if not text:
        print("Không có gì cần thông báo.")
        return 0
    text = ("[FinSuccess dashboard ngành]\n" + text)[:LIMIT]
    env = os.environ
    try:
        if env.get("ZALO_OA_TOKEN") and env.get("ZALO_USER_ID"):
            print(post("https://openapi.zalo.me/v3.0/oa/message/cs",
                       {"recipient": {"user_id": env["ZALO_USER_ID"]}, "message": {"text": text}},
                       {"access_token": env["ZALO_OA_TOKEN"]}))
        elif env.get("TELEGRAM_BOT_TOKEN") and env.get("TELEGRAM_CHAT_ID"):
            print(post(f"https://api.telegram.org/bot{env['TELEGRAM_BOT_TOKEN']}/sendMessage",
                       {"chat_id": env["TELEGRAM_CHAT_ID"], "text": text}))
        else:
            print(text)
    except Exception as exc:  # noqa: BLE001 — thông báo lỗi không được làm hỏng job
        print(f"Gửi thông báo thất bại: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
