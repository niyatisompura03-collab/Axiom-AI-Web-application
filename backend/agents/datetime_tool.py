from datetime import datetime, timedelta, timezone
try:
    from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
except ImportError:
    ZoneInfo = None

def _get_tz(timezone_str):
    if not timezone_str or not ZoneInfo:
        return timezone.utc
    try:
        return ZoneInfo(timezone_str)
    except ZoneInfoNotFoundError:
        return timezone.utc

def get_current_time(timezone_str=None):

    tz = _get_tz(timezone_str)
    now = datetime.now(tz)

    return {
        "tool": "datetime",
        "type": "current_time",
        "current_time": now.strftime("%I:%M %p %Z"),
        "current_date": now.strftime("%A, %B %d, %Y"),
        "timezone": str(tz),
        "instruction": "This datetime and timezone are authoritative. Do not infer timezone from context. Recalculate any relative dates from this current_date."
    }



def get_current_date(timezone_str=None):

    tz = _get_tz(timezone_str)
    now = datetime.now(tz)

    return {
        "tool": "datetime",
        "type": "current_date",
        "current_time": now.strftime("%I:%M %p %Z"),
        "current_date": now.strftime("%A, %B %d, %Y"),
        "timezone": str(tz),
        "instruction": "This datetime and timezone are authoritative. Do not infer timezone from context. Recalculate any relative dates from this current_date."
    }



def get_relative_date(days, timezone_str=None):

    tz = _get_tz(timezone_str)
    now = datetime.now(tz)
    target = now + timedelta(days=days)

    return {
        "tool": "datetime",
        "type": "relative_date",
        "days_offset": days,
        "target_date_calculated": target.strftime("%A, %B %d, %Y"),
        "current_time": now.strftime("%I:%M %p %Z"),
        "current_date": now.strftime("%A, %B %d, %Y"),
        "timezone": str(tz),
        "instruction": "This datetime and timezone are authoritative. Do not infer timezone from context. Recalculate any relative dates from this current_date."
    }