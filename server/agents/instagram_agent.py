"""
Instagram Agent for Instagram Data Analysis
Responsible for fetching posts and analyzing user or post-level information.
Uses RapidAPI Instagram120 API.
"""

import http.client
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


class InstagramAgent:
    """Agent for interacting with Instagram data via RapidAPI Instagram120."""

    def __init__(self, api_key: Optional[str] = None, host: str = "instagram120.p.rapidapi.com"):
        """
        Initialize Instagram agent with RapidAPI.
        
        Args:
            api_key: RapidAPI key (optional, will use env variable if not provided)
            host: RapidAPI host for Instagram120
        """
        self.api_key = api_key or os.getenv("INSTAGRAM_RAPIDAPI_KEY")
        self.host = host
        self.headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': self.host
        }
    
    def _make_request(self, endpoint: str, body: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Helper to make HTTP POST requests to RapidAPI."""
        try:
            conn = http.client.HTTPSConnection(self.host)
            
            headers = {
                'Content-Type': 'application/json',
                'x-rapidapi-key': self.api_key,
                'x-rapidapi-host': self.host
            }
            
            payload = json.dumps(body) if body else "{}"
                
            conn.request("POST", endpoint, body=payload, headers=headers)
            res = conn.getresponse()
            data = res.read()
            
            if res.status != 200:
                print(f"[ERROR] Instagram API error {res.status}: {data.decode('utf-8')}")
                return None
                
            return json.loads(data.decode("utf-8"))
            
        except Exception as e:
            print(f"[ERROR] Instagram request failed: {e}")
            return None

    def get_user_info(self, username: str) -> Optional[Dict[str, Any]]:
        """Fetch user information for a given Instagram username."""
        username = username.lstrip("@")

        try:
            result = self._make_request("/api/instagram/profile", {"username": username, "maxId": ""})
            
            if not result or "result" not in result:
                print(f"[ERROR] Profile '{username}' not found")
                return None
            
            profile = result["result"]
            
            return {
                "username": profile.get("username"),
                "user_id": profile.get("id"),
                "full_name": profile.get("full_name"),
                "biography": profile.get("biography"),
                "followers": profile.get("edge_followed_by", {}).get("count", 0),
                "following": profile.get("edge_follow", {}).get("count", 0),
                "post_count": profile.get("edge_owner_to_timeline_media", {}).get("count", 0),
                "is_verified": profile.get("is_verified", False),
                "is_private": profile.get("is_private", False),
                "profile_pic_url": profile.get("profile_pic_url", ""),
                "external_url": profile.get("external_url", "")
            }

        except Exception as e:
            print(f"[ERROR] Failed to fetch user info: {e}")
            return None

    def get_user_posts(self, username: str, count: int = 12) -> List[Dict[str, Any]]:
        """Fetch recent posts of user."""
        username = username.lstrip("@")
        posts = []
        
        try:
            print(f"[DEBUG] Fetching posts for @{username}")
            
            result = self._make_request("/api/instagram/posts", {"username": username, "maxId": ""})
            
            if not result or "result" not in result:
                print(f"[ERROR] No posts found for '{username}'")
                return []
            
            edges = result["result"].get("edges", [])
            
            for i, edge in enumerate(edges):
                if i >= count:
                    break
                    
                node = edge.get("node", {})
                caption_obj = node.get("caption", {})
                caption_text = caption_obj.get("text", "") if caption_obj else ""
                
                posts.append({
                    "id": node.get("code", ""),
                    "caption": caption_text,
                    "timestamp": datetime.fromtimestamp(node.get("taken_at", 0)).isoformat() if node.get("taken_at") else datetime.now().isoformat(),
                    "likes": node.get("like_count", 0),
                    "comments": node.get("comment_count", 0),
                    "media_url": node.get("display_uri", ""),
                    "is_video": node.get("product_type") == "igtv" or node.get("video_versions") is not None,
                    "url": f"https://instagram.com/p/{node.get('code', '')}",
                    "views": node.get("view_count", 0),
                    "media_type": node.get("product_type", "feed")
                })
                
            print(f"[DEBUG] Fetched {len(posts)} posts")
            return posts

        except Exception as e:
            print(f"[ERROR] Failed to fetch posts: {e}")
            return []

    def get_user_stories(self, username: str) -> List[Dict[str, Any]]:
        """Fetch current stories of user (no login required with this API!)."""
        username = username.lstrip("@")
        stories = []
        
        try:
            print(f"[DEBUG] Fetching stories for @{username}")
            
            result = self._make_request("/api/instagram/stories", {"username": username, "maxId": ""})
            
            if not result or "result" not in result:
                print(f"[INFO] No active stories found for '{username}'")
                return []
            
            story_items = result["result"]
            
            for item in story_items:
                # Get the highest quality image/video URL (first candidate is highest resolution)
                candidates = item.get("image_versions2", {}).get("candidates", [])
                
                # Find highest resolution candidate by comparing height * width
                best_candidate = None
                max_resolution = 0
                
                for candidate in candidates:
                    resolution = candidate.get("height", 0) * candidate.get("width", 0)
                    if resolution > max_resolution:
                        max_resolution = resolution
                        best_candidate = candidate
                
                media_url = best_candidate.get("url", "") if best_candidate else ""
                media_width = best_candidate.get("width", 0) if best_candidate else 0
                media_height = best_candidate.get("height", 0) if best_candidate else 0
                
                # Check if it's a video and get video URL if available
                is_video = item.get("video_versions") is not None
                if is_video:
                    video_versions = item.get("video_versions", [])
                    if video_versions:
                        # Get highest quality video (first one is usually highest)
                        media_url = video_versions[0].get("url", media_url)
                        media_width = video_versions[0].get("width", media_width)
                        media_height = video_versions[0].get("height", media_height)
                
                stories.append({
                    "id": item.get("pk", ""),
                    "timestamp": datetime.fromtimestamp(item.get("taken_at", 0)).isoformat() if item.get("taken_at") else datetime.now().isoformat(),
                    "expiring_at": None,  # Not provided in this response
                    "media_url": media_url,
                    "is_video": is_video,
                    "url": f"https://instagram.com/stories/{username}/{item.get('pk', '')}",
                    "original_width": item.get("original_width", 0),
                    "original_height": item.get("original_height", 0),
                    "media_width": media_width,
                    "media_height": media_height
                })
                
            print(f"[DEBUG] Fetched {len(stories)} stories")
            return stories

        except Exception as e:
            print(f"[ERROR] Failed to fetch stories: {e}")
            return []



    def analyze_posts(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze post captions and engagement."""
        if not posts:
            return {"error": "No posts found"}

        total_caption_length = 0
        total_engagement = 0
        processed_posts = []
        video_count = 0

        for post in posts:
            caption = post.get("caption", "")
            total_caption_length += len(caption)

            likes = post.get("likes", 0)
            comments = post.get("comments", 0)
            
            total_engagement += (likes + comments)
            
            if post.get("is_video", False):
                video_count += 1
            
            processed_posts.append({
                "caption": caption,
                "likes": likes,
                "comments": comments,
                "is_video": post.get("is_video", False),
                "url": post.get("url", "")
            })

        return {
            "post_count": len(posts),
            "video_count": video_count,
            "photo_count": len(posts) - video_count,
            "average_caption_length": round(total_caption_length / len(posts), 2) if posts else 0,
            "total_engagement": total_engagement,
            "average_engagement": round(total_engagement / len(posts), 2) if posts else 0,
            "posts_summary": processed_posts
        }

    def analyze_stories(self, stories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze stories content and timing."""
        if not stories:
            return {"error": "No stories found"}

        video_count = 0
        processed_stories = []

        for story in stories:
            if story.get("is_video", False):
                video_count += 1
            
            processed_stories.append({
                "timestamp": story.get("timestamp", ""),
                "expiring_at": story.get("expiring_at", ""),
                "is_video": story.get("is_video", False),
                "url": story.get("url", ""),
                "media_url": story.get("media_url", ""),
                "media_width": story.get("media_width", 0),
                "media_height": story.get("media_height", 0)
            })

        return {
            "story_count": len(stories),
            "video_count": video_count,
            "photo_count": len(stories) - video_count,
            "stories_summary": processed_stories
        }

    def get_user_post_report(self, username: str, count: int = 12) -> Dict[str, Any]:
        """Full pipeline: User Info → Posts → Analysis."""
        print(f"[INFO] Fetching data for @{username}...")

        user_info = self.get_user_info(username)
        if not user_info:
            print(f"[WARNING] Could not fetch user info for '{username}', proceeding with posts only")

        posts = self.get_user_posts(username, count)
        print(f"[INFO] Fetched {len(posts)} posts")

        analysis = self.analyze_posts(posts)

        return {
            "username": username,
            "user_info": user_info,
            "analysis": analysis
        }

    def get_user_story_report(self, username: str) -> Dict[str, Any]:
        """Full pipeline: User Info → Stories → Analysis."""
        print(f"[INFO] Fetching stories for @{username}...")

        user_info = self.get_user_info(username)
        if not user_info:
            print(f"[WARNING] Could not fetch user info for '{username}', proceeding with stories only")

        stories = self.get_user_stories(username)
        print(f"[INFO] Fetched {len(stories)} stories")

        analysis = self.analyze_stories(stories)

        return {
            "username": username,
            "user_info": user_info,
            "analysis": analysis
        }

    def get_full_user_report(self, username: str, post_count: int = 12) -> Dict[str, Any]:
        """Full pipeline: User Info → Posts → Stories → Combined Analysis."""
        print(f"[INFO] Fetching complete data for @{username}...")

        user_info = self.get_user_info(username)
        if not user_info:
            print(f"[WARNING] Could not fetch user info for '{username}', proceeding with content only")

        posts = self.get_user_posts(username, post_count)
        print(f"[INFO] Fetched {len(posts)} posts")

        stories = self.get_user_stories(username)
        print(f"[INFO] Fetched {len(stories)} stories")

        post_analysis = self.analyze_posts(posts)
        story_analysis = self.analyze_stories(stories)

        return {
            "username": username,
            "user_info": user_info,
            "post_analysis": post_analysis,
            "story_analysis": story_analysis
        }


if __name__ == "__main__":
    # Initialize agent with your RapidAPI key (from environment or config)
    # Make sure RAPIDAPI_KEY is set in your environment
    agent = InstagramAgent()

    username = "madeinmumbai_"  # Example username

    # Get posts report
    print("="*50)
    print("FETCHING POSTS REPORT")
    print("="*50)
    report = agent.get_user_post_report(username, count=12)

    print("\n" + "="*50)
    print("INSTAGRAM POSTS REPORT")
    print("="*50)
    print(f"Username: @{report.get('username')}")
    
    user_info = report.get("user_info", {})
    if user_info:
        print(f"Full Name: {user_info.get('full_name', 'N/A')}")
        print(f"Followers: {user_info.get('followers', 'N/A')}")
        print(f"Following: {user_info.get('following', 'N/A')}")
        print(f"Posts: {user_info.get('post_count', 'N/A')}")
        print(f"Verified: {'✓' if user_info.get('is_verified') else '✗'}")
    
    analysis = report.get("analysis", {})
    if "error" not in analysis:
        print(f"\nPosts analyzed: {analysis.get('post_count')}")
        print(f"Photos: {analysis.get('photo_count')}")
        print(f"Videos: {analysis.get('video_count')}")
        print(f"Average caption length: {analysis.get('average_caption_length')} chars")
        print(f"Total engagement: {analysis.get('total_engagement')}")
        print(f"Average engagement: {analysis.get('average_engagement')}")
        print("\nRecent Posts:")
        for i, post in enumerate(analysis.get("posts_summary", [])[:5], 1):
            print(f"  {i}. {post['caption']}")
            print(f"     ❤️ {post['likes']} | 💬 {post['comments']} | {'📹' if post['is_video'] else '📷'}")
    else:
        print(f"Error: {analysis.get('error')}")

    # Get stories report (no login required with RapidAPI!)
    print("\n" + "="*50)
    print("FETCHING STORIES REPORT")
    print("="*50)
    story_report = agent.get_user_story_report(username)
    
    story_analysis = story_report.get("analysis", {})
    if "error" not in story_analysis:
        print(f"Stories found: {story_analysis.get('story_count')}")
        print(f"Photo stories: {story_analysis.get('photo_count')}")
        print(f"Video stories: {story_analysis.get('video_count')}")
        print("\nActive Stories:")
        for i, story in enumerate(story_analysis.get("stories_summary", []), 1):
            print(f"  {i}. {'📹' if story['is_video'] else '📷'} | Posted: {story['timestamp'][:19]}")
            print(f"     Expires: {story['expiring_at'][:19] if story['expiring_at'] else 'N/A'}")
            print(f"     Size: {story['media_width']}x{story['media_height']}")
            print(f"     URL: {story['media_url'][:80]}...")
    else:
        print(f"Stories Info: {story_analysis.get('error')}")
