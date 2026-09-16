from tavily import TavilyClient
from dotenv import load_dotenv
import os

load_dotenv()

client = TavilyClient(
    api_key=os.getenv("TAVILY_API_KEY")
)


def search_web(query):
    try:
        result = client.search(
            query=query,
            search_depth="basic",
            max_results=5
        )
        results = result.get("results", [])
        if not results:
            return {"tool": "search", "error": f"No results found for query: {query}"}
        return {"tool": "search", "results": results}
    except Exception as e:
        return {"tool": "search", "error": f"Search failed: {str(e)}"}