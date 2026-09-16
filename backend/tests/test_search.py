import os
from tavily import TavilyClient
from dotenv import load_dotenv
from groq import Groq

load_dotenv("c:/Users/bmvsi-151/Documents/Axiom-V2/.env")
client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def test_query(q):
    print(f"\nUser: {q}")
    # 1. search
    try:
        result = client.search(query=q, search_depth="basic", max_results=3)
        results = result.get("results", [])
        if not results:
            tool_result = {"tool": "search", "error": "No results found."}
        else:
            tool_result = {"tool": "search", "results": results}
    except Exception as e:
        tool_result = {"tool": "search", "error": str(e)}
        
    print(f"Tool Result Keys: {tool_result.keys()}")
    
    # 2. groq
    prompt = f"""
    Rules:
    - Do not mention tools.
    - Do not say "according to tool".
    - Do not recalculate.
    - Keep the response conversational.
    - For web search, you MUST base your answer on the search results and include clickable markdown links [Source Name](URL) for citations. Prefer credible sources. If search failed or has no results, inform the user clearly instead of inventing facts.

    Tool result:
    {tool_result}
    """
    
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": q}
        ]
    )
    print(f"Axiom: {response.choices[0].message.content}")

test_query("What is the latest version of Next.js?")
