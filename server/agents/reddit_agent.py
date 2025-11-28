"""
Reddit Agent for harvesting data using RapidAPI.
Responsible for fetching posts and comments from Reddit.
"""
import http.client
import json
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import urllib.parse

load_dotenv()

class RedditAgent:
    """Agent for interacting with Reddit data via RapidAPI."""
    
    def __init__(self, api_key: Optional[str] = None, host: str = "reddit34.p.rapidapi.com"):
        self.api_key = api_key or os.getenv("REDDIT_RAPIDAPI_KEY") or "03145fe773mshcee21ab8622b37ap1395fcjsn915642136ff9" # Fallback to user provided key for now
        self.host = host
        self.headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': self.host
        }
        
    def _make_request(self, endpoint: str, params: Dict[str, str] = None) -> Optional[Dict[str, Any]]:
        """Helper to make HTTP requests to RapidAPI."""
        try:
            conn = http.client.HTTPSConnection(self.host)
            
            url = endpoint
            if params:
                # Ensure params are properly encoded
                query_string = urllib.parse.urlencode(params)
                url = f"{endpoint}?{query_string}"
                
            conn.request("GET", url, headers=self.headers)
            res = conn.getresponse()
            data = res.read()
            
            if res.status != 200:
                print(f"[ERROR] Reddit API error {res.status}: {data.decode('utf-8')}")
                return None
                
            return json.loads(data.decode("utf-8"))
            
        except Exception as e:
            print(f"[ERROR] Reddit request failed: {e}")
            return None

    def get_subreddit_info(self, subreddit: str) -> Dict[str, Any]:
        """Get information about a subreddit."""
        return self._make_request("/getSubredditInfo", {"subreddit": subreddit}) or {}

    def search_posts(self, query: str, subreddit: str = "all", sort: str = "relevance", time_filter: str = "all") -> List[Dict[str, Any]]:
        """
        Search for posts on Reddit.
        Note: The specific endpoint might vary based on the RapidAPI Reddit API version.
        Using a generic search assumption or based on available endpoints.
        If /search endpoint exists (common in these APIs).
        """
        # Based on common Reddit wrapper APIs on RapidAPI, usually there is a search endpoint.
        # If not, we might need to use getSubredditPosts if search isn't directly exposed or use a different endpoint.
        # Let's assume /search exists or we use /getNewPosts if we just want recent.
        # For now, let's try to find posts in a specific subreddit or general.
        
        # Checking the user provided sample, it used /getSubredditInfo.
        # Let's assume there is /getSubredditPosts
        
        # If query is provided, we ideally want a search.
        # Let's try to implement a search if available, otherwise fallback to subreddit posts.
        
        # Hypothetical endpoint based on typical Reddit APIs
        # Using the endpoint provided by the user
        return self._make_request("/getSearchPosts", {"query": query, "sort": sort, "time_filter": time_filter}) or {}

    def get_post_details(self, post_id: str) -> Dict[str, Any]:
        """Get details of a specific post."""
        return self._make_request("/getPostDetails", {"post_id": post_id}) or {}

    def get_comments(self, post_id: str) -> List[Dict[str, Any]]:
        """Get comments for a post."""
        return self._make_request("/getPostComments", {"post_id": post_id}) or {}

if __name__ == "__main__":
    agent = RedditAgent()
    print("Fetching subreddit info for 'memes'...")
    info = agent.get_subreddit_info("memes")
    print(json.dumps(info, indent=2)[:500])
