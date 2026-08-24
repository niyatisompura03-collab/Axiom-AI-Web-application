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
        "value": now.strftime("%I:%M %p")
    }



def get_current_date(timezone_str=None):

    tz = _get_tz(timezone_str)
    today = datetime.now(tz)

    return {
        "tool": "datetime",
        "type": "current_date",
        "value": today.strftime("%A, %d %B %Y")
    }



def get_relative_date(days, timezone_str=None):

    tz = _get_tz(timezone_str)
    date = datetime.now(tz) + timedelta(days=days)

    return {
        "tool": "datetime",
        "type": "relative_date",
        "days_offset": days,
        "value": date.strftime("%A, %d %B %Y")
    }