"""
X Agent for Twitter/X Data Analysis
Responsible for fetching tweets and analyzing user or tweet-level information.
"""

import requests
from typing import List, Dict, Any, Optional
import json
import os


class XAgent:
    """Agent for interacting with X (Twitter) data and analyzing tweets."""

    def __init__(self, api_key: str, host: str = "twitter241.p.rapidapi.com"):
        self.base_url = f"https://{host}"
        self.headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": host
        }

    def get_user_id(self, username: str) -> Optional[str]:
        """Fetch the user ID for a given X username."""
        username = username.lstrip("@")

        try:
            response = requests.get(
                f"{self.base_url}/user",
                params={"username": username},
                headers=self.headers
            )

            if response.status_code != 200:
                print(f"[ERROR] Failed to fetch user ID. Status: {response.status_code}")
                print(response.text)
                return None

            user_json = response.json()
            
            user_id = (
                user_json.get("data", {}).get("id") or
                user_json.get("result", {}).get("data", {}).get("user", {}).get("result", {}).get("rest_id") or
                user_json.get("id") or
                user_json.get("user", {}).get("id")
            )

            if not user_id:
                print(f"[DEBUG] Could not find user ID in response: {json.dumps(user_json, indent=2)[:500]}")
            
            return user_id

        except requests.RequestException as e:
            print(f"[ERROR] Request failed: {e}")
            return None

    def get_recent_tweets(self, user_id: str, count: int = 3) -> List[Dict[str, Any]]:
        """Fetch last N tweets of user."""
        try:
            response = requests.get(
                f"{self.base_url}/user-tweets",
                params={"user": user_id, "count": count},
                headers=self.headers
            )

            print(f"[DEBUG] Tweets API Status: {response.status_code}")
            print(f"[DEBUG] Tweets API Response: {response.text[:1000]}")

            if response.status_code != 200:
                print(f"[ERROR] Failed to fetch tweets. Status: {response.status_code}")
                return []

            tweets_json = response.json()

            tweets = self._extract_tweets(tweets_json)
            
            return tweets[:count]

        except requests.RequestException as e:
            print(f"[ERROR] Request failed: {e}")
            return []

    def search_tweets(self, query: str, count: int = 10) -> List[Dict[str, Any]]:
        """Search for tweets matching a query."""
        try:
            # Using a generic search endpoint common in Twitter RapidAPIs
            # Adjust endpoint based on specific API documentation if needed
            # User provided example used /search-lists
            # We will use this endpoint as requested, though it searches lists.
            response = requests.get(
                f"{self.base_url}/search-lists",
                params={"query": query},
                headers=self.headers
            )

            print(f"[DEBUG] Search API Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"[ERROR] Failed to search tweets. Status: {response.status_code}")
                return []

            data = response.json()
            return self._extract_tweets(data)

        except requests.RequestException as e:
            print(f"[ERROR] Search request failed: {e}")
            return []

    def _extract_tweets(self, data: Any) -> List[Dict[str, Any]]:
        """Extract items from API response. Adapted for lists search."""
        items = []

        try:
            # Check if it's a list search response
            if "lists" in data:
                # If searching lists, we get lists, not tweets directly.
                # For this MVP, we'll treat the list description/name as content.
                lists = data.get("lists", [])
                for lst in lists:
                    items.append({
                        "legacy": {
                            "full_text": f"List: {lst.get('name')} - {lst.get('description')}",
                            "created_at": lst.get("created_at"),
                            "id_str": str(lst.get("id")),
                            "user_results": {
                                "result": {
                                    "legacy": {
                                        "screen_name": lst.get("user", {}).get("screen_name", "unknown")
                                    }
                                }
                            }
                        }
                    })
                return items

            # Fallback to timeline extraction (original logic)
            instructions = data.get("result", {}).get("timeline", {}).get("instructions", [])
            for inst in instructions:
                if inst.get("type") == "TimelineAddEntries":
                    entries = inst.get("entries", [])
                    for entry in entries:
                        content = entry.get("content", {})

                        # Path 1: Standard tweet
                        tweet_result = content.get("itemContent", {}).get("tweet_results", {}).get("result")
                        if tweet_result:
                            items.append(tweet_result)
                            continue

                        # Path 2: Module items (sometimes tweets are nested inside items)
                        items_list = content.get("items", [])
                        for item in items_list:
                            item_content = item.get("item", {}).get("itemContent", {})
                            tweet_result = item_content.get("tweet_results", {}).get("result")
                            if tweet_result:
                                items.append(tweet_result)

        except Exception as e:
            print(f"[ERROR] Failed to extract items: {e}")

        return items

    def analyze_tweets(self, tweets: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze tweet length + engagement."""
        if not tweets:
            return {"error": "No tweets found"}

        total_length = 0
        total_engagement = 0
        processed_tweets = []

        for t in tweets:
            # Try to get the legacy data (contains actual tweet content)
            legacy = t.get("legacy", {}) or t
            
            text = legacy.get("full_text") or legacy.get("text", "")
            total_length += len(text)

            likes = legacy.get("favorite_count") or legacy.get("like_count", 0)
            retweets = legacy.get("retweet_count", 0)
            
            total_engagement += (likes + retweets)
            
            processed_tweets.append({
                "text": text[:100] + "..." if len(text) > 100 else text,
                "likes": likes,
                "retweets": retweets
            })

        return {
            "tweet_count": len(tweets),
            "average_length": round(total_length / len(tweets), 2),
            "total_engagement": total_engagement,
            "average_engagement": round(total_engagement / len(tweets), 2),
            "tweets_summary": processed_tweets
        }

    def get_user_tweet_report(self, username: str, count: int = 3) -> Dict[str, Any]:
        """Full pipeline: ID → Tweets → Analysis."""
        print(f"[INFO] Fetching data for @{username}...")

        user_id = self.get_user_id(username)
        if not user_id:
            return {"error": f"User '{username}' not found"}

        print(f"[INFO] Found user ID: {user_id}")

        tweets = self.get_recent_tweets(user_id, count)
        print(f"[INFO] Fetched {len(tweets)} tweets")

        analysis = self.analyze_tweets(tweets)

        return {
            "username": username,
            "user_id": user_id,
            "analysis": analysis
        }


if __name__ == "__main__":
    YOUR_API_KEY = os.getenv("TWITTER_API_KEY")

    agent = XAgent(api_key=YOUR_API_KEY)

    username = "h_7shhv"

    report = agent.get_user_tweet_report(username, count=3)

    print("\n" + "="*50)
    print("REPORT SUMMARY")
    print("="*50)
    print(f"Username: @{report.get('username')}")
    print(f"User ID: {report.get('user_id')}")
    
    analysis = report.get("analysis", {})
    if "error" not in analysis:
        print(f"Tweets analyzed: {analysis.get('tweet_count')}")
        print(f"Average tweet length: {analysis.get('average_length')} chars")
        print(f"Total engagement: {analysis.get('total_engagement')}")
        print(f"Average engagement: {analysis.get('average_engagement')}")
        print("\nTweets:")
        for i, tweet in enumerate(analysis.get("tweets_summary", []), 1):
            print(f"  {i}. {tweet['text']}")
            print(f"     ❤️ {tweet['likes']} | 🔁 {tweet['retweets']}")
    else:
        print(f"Error: {analysis.get('error')}")