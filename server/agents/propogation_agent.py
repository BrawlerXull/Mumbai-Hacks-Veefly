# propagation.py
import os
import requests
import json
import time
import networkx as nx
from typing import List, Dict, Any, Set
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI
import sys
import re
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Add parent directory to path to allow imports from root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Agents
from agents.x_agent import XAgent
from agents.reddit_agent import RedditAgent
from agents.instagram_agent import InstagramAgent
from agents.youtube_agent import YouTubeAgent
from agents.account_finder_agent import AccountFinderAgent

load_dotenv()

SERP_API_KEY = os.getenv("SERPER_API_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
REDDIT_API_KEY = os.getenv("REDDIT_RAPIDAPI_KEY")
INSTAGRAM_API_KEY = os.getenv("INSTAGRAM_RAPIDAPI_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

client = OpenAI(api_key=OPENAI_KEY)

class HarvestAgent:
    """Collects posts matching claim signatures across platforms."""
    
    def __init__(self, use_smart_accounts: bool = True):
        """
        Initialize Harvest Agent with platform-specific agents.
        
        Args:
            use_smart_accounts: If True, uses LLM to find relevant accounts for Instagram/Twitter.
                              If False, uses predefined list of news outlets.
        """
        self.x_agent = XAgent(api_key=TWITTER_API_KEY) if TWITTER_API_KEY else None
        self.reddit_agent = RedditAgent(api_key=REDDIT_API_KEY)
        self.instagram_agent = InstagramAgent(api_key=INSTAGRAM_API_KEY) if INSTAGRAM_API_KEY else None
        self.youtube_agent = YouTubeAgent(api_key=YOUTUBE_API_KEY) if YOUTUBE_API_KEY else None
        self.account_finder = AccountFinderAgent(api_key=OPENAI_KEY) if (use_smart_accounts and OPENAI_KEY) else None
        
    def harvest(self, claim: str, keywords: List[str] = None) -> List[Dict[str, Any]]:
        """
        Harvest data from multiple platforms for a given claim.
        
        Platforms searched:
        1. Google (Web) - General search results
        2. Twitter/X - Direct tweet search
        3. Reddit - Post search across subreddits
        4. Instagram - Search posts from known news/influencer accounts, filtered by keywords
        
        Note: Instagram doesn't support direct hashtag/keyword search via API,
        so we search posts from curated list of news outlets and filter by claim keywords.
        """
        print(f"🌾 Harvesting data for claim: '{claim}'")
        results = []
        
        # 1. Google Search (Web)
        print("  🔍 Searching Google...")
        google_results = self._search_google(claim)
        results.extend(google_results)
        
        # 2. Twitter/X
        # 2. Twitter/X
        if self.x_agent:
            print("  🐦 Searching X (Twitter)...")
            try:
                tweets = self.x_agent.search_tweets(claim, count=5)
                for tweet in tweets:
                    # Extract text from legacy or direct dict
                    legacy = tweet.get("legacy", {}) or tweet
                    text = legacy.get("full_text") or legacy.get("text", "")
                    
                    # Extract timestamp
                    created_at = legacy.get("created_at", "Unknown")
                    
                    # Extract author
                    user_info = tweet.get("core", {}).get("user_results", {}).get("result", {}).get("legacy", {})
                    author = user_info.get("screen_name") or "Unknown_User"
                    
                    results.append({
                        "platform": "twitter",
                        "content": text,
                        "url": f"https://twitter.com/{author}/status/{legacy.get('id_str')}" if author != "Unknown_User" else "",
                        "timestamp": created_at,
                        "author": f"@{author}",
                        "id": legacy.get("id_str") or str(hash(text)),
                        "source_type": "general"
                    })
            except Exception as e:
                print(f"Twitter search error: {e}")
            
        # 3. Reddit
        print("  👽 Searching Reddit...")
        try:
            # Assuming search_posts returns a list of post dictionaries
            # We might need to adjust based on actual API response
            reddit_data = self.reddit_agent.search_posts(claim)
            print(f"[DEBUG] Reddit Data Type: {type(reddit_data)}")
            if isinstance(reddit_data, dict):
                print(f"[DEBUG] Reddit Data Keys: {reddit_data.keys()}")
                print(f"[DEBUG] Reddit Data Content (truncated): {str(reddit_data)[:500]}")
            
            # RapidAPI Reddit responses often have a 'data' key or list of posts
            posts = []
            if isinstance(reddit_data, dict):
                # Check for 'data' key which might contain the list or another dict
                data_content = reddit_data.get("data", {})
                if isinstance(data_content, list):
                    posts = data_content
                elif isinstance(data_content, dict):
                    # RapidAPI wrapper structure: data -> posts
                    posts = data_content.get("posts", []) or data_content.get("children", [])
            elif isinstance(reddit_data, list):
                posts = reddit_data
                
            print(f"[DEBUG] Reddit Posts Found: {len(posts)}")
            
            for post in posts:
                # Handle if post is wrapped in 'data' (common in Reddit JSON)
                p_data = post.get("data", post)
                
                title = p_data.get("title", "")
                selftext = p_data.get("selftext", "")
                content = f"{title}\n{selftext}".strip()
                
                # Timestamp
                created_utc = p_data.get("created_utc")
                timestamp = datetime.fromtimestamp(created_utc).strftime('%Y-%m-%d') if created_utc else "Unknown"
                
                results.append({
                    "platform": "reddit",
                    "content": content[:500], # Truncate for sanity
                    "url": f"https://reddit.com{p_data.get('permalink')}" if p_data.get('permalink') else "",
                    "timestamp": timestamp,
                    "author": f"u/{p_data.get('author', 'unknown')}",
                    "id": p_data.get("id") or str(hash(content)),
                    "source_type": "general"
                })
        except Exception as e:
            print(f"Reddit search error: {e}")
        
        # 4. Instagram
        if self.instagram_agent:
            print("  📸 Searching Instagram...")
            try:
                # Use LLM to find relevant accounts or fallback to predefined list
                if self.account_finder:
                    print("     Using LLM to find relevant Instagram accounts...")
                    relevant_accounts = self.account_finder.find_instagram_accounts(claim, max_accounts=5)
                else:
                    # Fallback: Define relevant Instagram accounts to search
                    # These are common news outlets, fact-checkers, and influencers
                    relevant_accounts = [
                        "bbcnews", "cnn", "nytimes", "reuters",
                        "washingtonpost", "aljazeera",
                        "timesofindia", "ndtv",
                        "the_hindu", "hindustantimes", "abpnewstv"
                    ]
                
                # Collect all posts first
                all_posts = []
                for username in relevant_accounts[:10]:  # Limit to 10 accounts
                    try:
                        posts = self.instagram_agent.get_user_posts(username, count=10)
                        for post in posts:
                            post['username'] = username
                            all_posts.append(post)
                    except Exception as account_error:
                        print(f"Error fetching from @{username}: {account_error}")
                        continue
                
                # Use LLM to find posts matching the claim
                if all_posts:
                    print(f"     Analyzing {len(all_posts)} Instagram posts for relevance...")
                    matching_posts = self.instagram_agent.find_matching_posts(claim, all_posts)
                    
                    print(f"     ✓ Found {len(matching_posts)} matching posts")
                    
                    for post in matching_posts:
                        timestamp = post.get("timestamp", "Unknown")
                        username = post.get("username", "unknown")
                        caption = post.get("caption", "")
                        
                        # Log matching post details
                        print(f"       • @{username}: {caption}..." if len(caption) > 80 else f"       • @{username}: {caption}")
                        
                        results.append({
                            "platform": "instagram",
                            "content": caption,
                            "url": post.get("url", ""),
                            "timestamp": timestamp,
                            "author": f"@{username}",
                            "id": post.get("id") or str(hash(caption)),
                            "likes": post.get("likes", 0),
                            "comments": post.get("comments", 0),
                            "is_video": post.get("is_video", False),
                            "similarity_score": post.get("similarity_score", 0),
                            "media_url": post.get("media_url", ""),
                            "source_type": "related" if self.account_finder else "general"
                        })
                        
            except Exception as e:
                print(f"Instagram search error: {e}")
        
        
        # 5. YouTube
        # if self.youtube_agent:
        #     print("  🎥 Searching YouTube...")
        #     try:
        #         videos = self.youtube_agent.search_and_transcribe(claim, max_results=20)
                
        #         for video in videos:
        #             # Only include videos with transcripts
        #             if video.get('has_transcript'):
        #                 results.append({
        #                     "platform": "youtube",
        #                     "content": video.get("transcript", ""),
        #                     "url": video.get("url", ""),
        #                     "timestamp": video.get("published_at", "Unknown"),
        #                     "author": video.get("channel_title", "Unknown"),
        #                     "id": video.get("video_id", ""),
        #                     "title": video.get("title", ""),
        #                     "view_count": video.get("view_count", 0),
        #                     "like_count": video.get("like_count", 0),
        #                     "comment_count": video.get("comment_count", 0),
        #                     "transcript_word_count": video.get("transcript_word_count", 0)
        #                 })
        #     except Exception as e:
        #         print(f"YouTube search error: {e}")

        return results

    def _search_google(self, query: str, n=10) -> List[Dict[str, Any]]:
        url = "https://serpapi.com/search"
        params = {
            "engine": "google",
            "q": query,
            "num": n,
            "api_key": SERP_API_KEY
        }

        try:
            res = requests.get(url, params=params)
            if res.status_code != 200:
                print(f"Google search error: {res.status_code}")
                return []

            data = res.json()
            organic = data.get("organic_results", [])
            
            normalized = []
            for item in organic:
                # improved timestamp extraction
                timestamp = item.get("date") or item.get("datePublished")
                
                # Try to extract date from snippet if missing (e.g., "Oct 12, 2023 — ...")
                if not timestamp and item.get("snippet"):
                    snippet = item.get("snippet")
                    # Regex for common Google date formats at start of snippet
                    # Matches: "Oct 12, 2023 — ", "2 days ago — ", "12 Oct 2023 — "
                    date_match = re.match(r"^([A-Za-z]{3} \d{1,2}, \d{4}|[A-Za-z]{3} \d{1,2}|\d{1,2} [A-Za-z]{3} \d{4}|\d+ (days?|hours?|mins?|weeks?|months?|years?) ago)", snippet)
                    if date_match:
                        timestamp = date_match.group(0)

                normalized.append({
                    "platform": "web",
                    "content": item.get("snippet", ""),
                    "url": item.get("link"),
                    "timestamp": timestamp or "Unknown", 
                    "author": item.get("source", "Unknown"),
                    "id": item.get("link"), # Use URL as ID for web
                    "source_type": "general"
                })
            return normalized
        except Exception as e:
            print("Google search error:", e)
            return []

class CanonicalizerAgent:
    """Groups near-duplicate claims into canonical clusters."""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
        
    def canonicalize(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        print("🔗 Canonicalizing claims...")
        if not items:
            return []
            
        texts = [item['content'] for item in items if item.get('content')]
        if not texts:
            return items
            
        # Simple clustering using Cosine Similarity
        try:
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
            
            # Group items with high similarity (> 0.8)
            # This is a simplified logic. In production, use HDBSCAN or similar.
            # For now, we just assign a cluster ID.
            
            # Placeholder: treat all as one cluster for the specific claim query
            for item in items:
                item['cluster_id'] = 'cluster_0'
                
        except Exception as e:
            print(f"Canonicalization error: {e}")
            
        return items

class OriginDetector:
    """Finds earliest instances."""
    
    def detect_origin(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        print("�️ Detecting origin...")
        # Sort by timestamp (handling various formats is tricky, assuming string sort for MVP or 'date' field)
        # In a real app, parse dates properly.
        
        sorted_items = sorted(items, key=lambda x: str(x.get('timestamp') or '9999-99-99'))
        return sorted_items[:3] # Return top 3 earliest

class PropagationMapper:
    """Builds propagation graph."""
    
    def build_graph(self, items: List[Dict[str, Any]]) -> nx.DiGraph:
        print("🕸️ Building propagation graph...")
        G = nx.DiGraph()
        
        # Add nodes
        for item in items:
            G.add_node(item['id'], **item)
            
        # Prepare content for similarity calculation
        texts = [item.get('content', '') for item in items]
        ids = [item['id'] for item in items]
        
        if not texts:
            return G
            
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(texts)
            cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            cosine_sim = np.zeros((len(texts), len(texts)))

        # Infer edges (simplified)
        # If timestamps allow, and content is similar, draw edge from earlier to later
        # Sort items by timestamp to determine direction
        sorted_indices = np.argsort([str(item.get('timestamp') or '9999-99-99') for item in items])
        
        for i in range(len(sorted_indices)):
            for j in range(i + 1, len(sorted_indices)):
                idx_src = sorted_indices[i]
                idx_dst = sorted_indices[j]
                
                src_id = ids[idx_src]
                dst_id = ids[idx_dst]
                
                # Get similarity score
                similarity = cosine_sim[idx_src, idx_dst]
                
                # Only add edge if similarity is above a threshold (e.g., 0.1)
                # or if it's a significant connection.
                # For this MVP, we add edges with the similarity weight.
                if similarity > 0.1:
                    G.add_edge(src_id, dst_id, weight=float(similarity))
                
        return G

class InfluenceAgent:
    """Computes influence metrics."""
    
    def compute_influence(self, graph: nx.DiGraph) -> Dict[str, float]:
        print("📊 Computing influence...")
        try:
            pagerank = nx.pagerank(graph)
            return pagerank
        except:
            return {}

class ExplainAgent:
    """Compiles narrative."""
    
    def explain(self, claim: str, origin: List[Dict[str, Any]], influencers: Dict[str, float]) -> str:
        print("📝 Generating explanation...")
        
        origin_text = "\n".join([f"- {o.get('author')} ({o.get('timestamp')})" for o in origin])
        top_influencers = sorted(influencers.items(), key=lambda x: x[1], reverse=True)[:3]
        influencer_text = "\n".join([f"- {k}: {v:.4f}" for k, v in top_influencers])
        
        prompt = f"""
        Explain the propagation of the misinformation claim: "{claim}"
        
        Origins found:
        {origin_text}
        
        Top Influencers (PageRank):
        {influencer_text}
        
        Provide a concise narrative of how this claim likely started and spread.
        """
        
        try:
            response = client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Could not generate explanation: {e}"

class MisinformationTracker:
    def __init__(self):
        self.harvest_agent = HarvestAgent()
        self.canonicalizer = CanonicalizerAgent()
        self.origin_detector = OriginDetector()
        self.mapper = PropagationMapper()
        self.influence_agent = InfluenceAgent()
        self.explain_agent = ExplainAgent()
        
    def track(self, claim: str):
        print(f"\n🚀 Starting tracking for: {claim}\n")
        
        # 1. Harvest
        items = self.harvest_agent.harvest(claim)
        print(f"  Found {len(items)} items.")
        
        # 2. Canonicalize
        items = self.canonicalizer.canonicalize(items)
        
        # 3. Detect Origin
        origins = self.origin_detector.detect_origin(items)
        
        # 4. Map Propagation
        graph = self.mapper.build_graph(items)
        
        # 5. Compute Influence
        influence = self.influence_agent.compute_influence(graph)
        
        # 6. Explain
        explanation = self.explain_agent.explain(claim, origins, influence)
        
        return {
            "claim": claim,
            "origins": origins,
            "graph_data": nx.node_link_data(graph), # Full graph for visualization
            "graph_stats": {
                "nodes": graph.number_of_nodes(),
                "edges": graph.number_of_edges()
            },
            "explanation": explanation
        }

if __name__ == "__main__":
    tracker = MisinformationTracker()
    claim = input("Enter claim to track: ")
    report = tracker.track(claim)
    print("\n✅ FINAL REPORT:\n")
    print(json.dumps(report, indent=2, default=str))
