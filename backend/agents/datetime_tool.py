from datetime import datetime, timedelta


def get_current_time():

    now = datetime.now()

    return {
        "tool": "datetime",
        "type": "current_time",
        "value": now.strftime("%I:%M %p")
    }



def get_current_date():

    today = datetime.now()

    return {
        "tool": "datetime",
        "type": "current_date",
        "value": today.strftime("%A, %d %B %Y")
    }



def get_relative_date(days):

    date = datetime.now() + timedelta(days=days)

    return {
        "tool": "datetime",
        "type": "relative_date",
        "days_offset": days,
        "value": date.strftime("%A, %d %B %Y")
    }