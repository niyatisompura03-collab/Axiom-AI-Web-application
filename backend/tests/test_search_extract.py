import re

def _extract_search_query(text):
    """
    Deterministically extract the search-relevant clause from a compound query
    when LLM reformulation fails. Strips out time/date/calculator sub-clauses.
    """
    if not text:
        return text

    # Non-search clauses: time/date/calculator intent markers
    non_search_markers = [
        "what time", "current time", "time right now", "tell me the time",
        "what is the time", "whats the time", "what's the time",
        "today's date", "todays date", "what date", "what day", "current date",
        "tell me the date", "tell me today",
        "calculate ", "compute ", "evaluate ",
    ]

    # Split the compound query into clauses on common conjunctions/separators
    clauses = re.split(
        r',\s*and\s+|\s+and\s+also\s+|\s+and\s+tell\s+me\s+|\s+and\s+',
        text,
        flags=re.IGNORECASE,
    )

    if len(clauses) <= 1:
        return text

    # Find clauses that are NOT about other tools
    search_clauses = []
    for clause in clauses:
        clause_lower = clause.lower().strip()
        is_other_tool = False
        for marker in non_search_markers:
            if marker in clause_lower:
                is_other_tool = True
                break
        # Also check for bare math expressions
        if not is_other_tool and re.match(r'^[\d\s\+\-\*\/\%\^\(\)\.]+$', clause.strip()):
            is_other_tool = True
        if not is_other_tool and clause.strip():
            search_clauses.append(clause.strip())

    if search_clauses:
        result = " ".join(search_clauses)
        # Clean up leading/trailing punctuation
        result = result.strip(" .,;!?")
        return result

    return text


tests = [
    "What's today's date, and find the latest Node.js security update.",
    "Find recent news about NVIDIA, and tell me the current time in New York.",
    "What time is it in Tokyo, and search for the latest Python release?",
    "What is the current time in Tokyo, and search for the latest unreleased secret internal codename of Apple 2099 device?",
    "Calculate 847 * 29 and search for best restaurants in London",
    "Search for latest NVIDIA news",
    "What is the latest Python release?",
    "What's today's date, and search for recent AI developments",
    "Tell me the current time in London, and find information about climate change",
    "What day is tomorrow, and look up the latest SpaceX launch?",
]

if __name__ == "__main__":
    for t in tests:
        result = _extract_search_query(t)
        print(f"INPUT:  {t}")
        print(f"OUTPUT: {result!r}")
        print()
