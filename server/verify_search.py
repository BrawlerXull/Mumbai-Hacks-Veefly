import os
import sys

# Add server directory to path
sys.path.append(os.path.dirname(__file__))

from agents.search_agent import SearchAgent

def test_search():
    print("Testing SearchAgent...")
    
    # Check if API key is present
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        print("WARNING: SERPER_API_KEY not found in environment variables.")
        print("Please ensure it is set in .env file.")
    else:
        print(f"SERPER_API_KEY found: {api_key[:4]}...")

    try:
        agent = SearchAgent()
        
        query = "fake news detection AI"
        print(f"\nSearching for: {query}")
    
        results = agent.search_historical_news(query, time_range_days=30)
        
        print(f"\nFound {len(results)} results:")
        for i, result in enumerate(results[:3]):
            print(f"\nResult {i+1}:")
            print(f"Title: {result.get('title')}")
            print(f"Source: {result.get('source')}")
            print(f"Date: {result.get('date')}")
            print(f"URL: {result.get('url')}")
            print(f"Snippet: {result.get('snippet')[:100]}...")
            
    except Exception as e:
        print(f"Error during search: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_search()
