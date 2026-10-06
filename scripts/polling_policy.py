"""Source-specific checks; observation period remains separate from check time."""
from __future__ import annotations

import datetime as dt
from zoneinfo import ZoneInfo

VN = ZoneInfo('Asia/Ho_Chi_Minh')
SPOT = {'brent', 'wti', 'gasoline', 'diesel'}
WPSR = {'crude_stock', 'gasoline_stock', 'distillate_stock', 'cushing', 'us_production'}
FUTURES = {'wti_curve', 'brent_futures', 'sugar_futures'}


def due(key: str, now: dt.datetime, last_checked: str | None) -> bool:
    local = now.astimezone(VN)
    if not last_checked:
        return True  # New adapters must be backfilled even outside a release window.
    try:
        checked = dt.datetime.fromisoformat(last_checked.replace('Z', '+00:00')).astimezone(VN)
    except ValueError:
        return True
    if checked > local:
        return True
    day = local.weekday()  # Mon=0
    if key in SPOT:
        window = day in (2, 3, 4)  # EIA weekly daily-price files; include holiday delay.
    elif key in WPSR:
        window = day in (3, 4)  # Wed US release reaches Vietnam Thu morning.
    elif key in FUTURES or key == 'singapore_cracks':
        window = day in (1, 2, 3, 4, 5)  # Completed trading sessions / KNOC T+1.
    elif key == 'sugar_producers':
        window = (local.month in (5, 11) and local.day >= 15) or (local.day == 1 and day < 5)
    elif key in ('opec_capacity', 'world_balance'):  # both read the monthly EIA STEO workbook
        window = 5 <= local.day <= 15 or day == 0
    elif key == 'wti_cot':
        window = day in (5, 0, 1)  # Tuesday positions normally publish Friday US / Saturday VN.
    elif key == 'sugar_monthly':
        window = local.day <= 10 or day == 0
    elif key == 'middle_east_crude_exports':
        window = 18 <= local.day <= 28 or day == 0  # JODI updates around the 20th; retry delays.
    else:
        window = day < 6  # PortWatch batch timing and Petrolimex events can shift.
    if not window:
        return False
    # Inside a release window every scheduled run re-checks (runs are >= 6 h apart: 07:30, 15:30),
    # so a source that publishes after the morning run still reaches the dashboard that afternoon.
    return (local - checked).total_seconds() >= 6 * 3600


def bank_due(now: dt.datetime, last_checked: str | None) -> bool:
    local = now.astimezone(VN)
    return local.weekday() < 5 and due('bank_lending', now, last_checked)
