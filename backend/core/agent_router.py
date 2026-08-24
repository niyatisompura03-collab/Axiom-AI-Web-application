def detect_tool(user_message):

    message = user_message.lower()


    scores = {

        "calculator": 0,
        "time": 0,
        "date": 0,
        "search": 0

    }


    # -----------------
    # Calculator
    # -----------------

    calculator_keywords = [
        "calculate",
        "plus",
        "minus",
        "multiply",
        "divide",
        "times",
        "%",
        "+",
        "-",
        "*",
        "/"
    ]


    for word in calculator_keywords:

        if word in message:
            scores["calculator"] += 2



    # -----------------
    # Time
    # -----------------

    time_keywords = [
        "what time",
        "what's the time",
        "what is the time",
        "current time",
        "what's the current time",
        "what is the current time",
        "time now",
        "time right now",
        "what time is it",
        "tell me the time",
        "can you tell me the time",
        "do you know the time"
    ]


    for word in time_keywords:

        if word in message:
            scores["time"] += 3



    # -----------------
    # Date
    # -----------------

    date_keywords = [

        "today",
        "today's date",
        "current date",
        "what date",
        "what day",
        "tomorrow",
        "yesterday",
        "weekday"

    ]


    for word in date_keywords:

        if word in message:
            scores["date"] += 3



    # -----------------
    # Search
    # -----------------

    search_keywords = [

        "search",
        "search for",
        "latest",
        "news",
        "look up",
        "find information",
        "who is"

    ]


    for word in search_keywords:

        if word in message:
            scores["search"] += 3



    # -----------------
    # Select winner
    # -----------------

    selected_tool = max(
        scores,
        key=scores.get
    )


    # no useful match

    if scores[selected_tool] == 0:

        return None


    return selected_tool