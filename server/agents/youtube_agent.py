"""
YouTube Agent for Video Search and Transcript Extraction
Responsible for searching YouTube videos and extracting transcripts.
Uses YouTube Data API v3 and youtube-transcript-api.
"""

import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from googleapiclient.discovery import build
import re
import requests
from xml.etree import ElementTree

load_dotenv()


class YouTubeAgent:
    """Agent for searching YouTube videos and extracting transcripts."""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize YouTube agent with API key.
        
        Args:
            api_key: YouTube Data API v3 key (optional, will use env variable if not provided)
        """
        self.api_key = api_key or os.getenv("YOUTUBE_API_KEY")
        if not self.api_key:
            raise ValueError("YouTube API key is required. Set YOUTUBE_API_KEY in .env or pass api_key parameter.")
        
        self.youtube = build('youtube', 'v3', developerKey=self.api_key)
    
    def search_videos(self, query: str, max_results: int = 20, order: str = "relevance") -> List[Dict[str, Any]]:
        """
        Search for YouTube videos matching a query.
        
        Args:
            query: Search query
            max_results: Maximum number of results to return (default: 20, max: 50)
            order: Sort order - relevance, date, rating, viewCount, title
            
        Returns:
            List of video information dictionaries
        """
        print(f"[INFO] Searching YouTube for: '{query}'")
        
        try:
            # Search for videos
            search_response = self.youtube.search().list(
                q=query,
                part='id,snippet',
                type='video',
                maxResults=min(max_results, 50),  # API limit is 50
                order=order,
                relevanceLanguage='en'
            ).execute()
            
            videos = []
            for item in search_response.get('items', []):
                video_id = item['id']['videoId']
                snippet = item['snippet']
                
                videos.append({
                    'video_id': video_id,
                    'title': snippet.get('title', ''),
                    'description': snippet.get('description', ''),
                    'channel_title': snippet.get('channelTitle', ''),
                    'channel_id': snippet.get('channelId', ''),
                    'published_at': snippet.get('publishedAt', ''),
                    'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                    'url': f"https://www.youtube.com/watch?v={video_id}"
                })
            
            print(f"[INFO] Found {len(videos)} videos")
            return videos
            
        except Exception as e:
            print(f"[ERROR] Failed to search YouTube: {e}")
            return []
    
    def get_video_details(self, video_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific video.
        
        Args:
            video_id: YouTube video ID
            
        Returns:
            Video details dictionary
        """
        try:
            video_response = self.youtube.videos().list(
                part='snippet,statistics,contentDetails',
                id=video_id
            ).execute()
            
            if not video_response.get('items'):
                return None
            
            item = video_response['items'][0]
            snippet = item['snippet']
            statistics = item.get('statistics', {})
            
            return {
                'video_id': video_id,
                'title': snippet.get('title', ''),
                'description': snippet.get('description', ''),
                'channel_title': snippet.get('channelTitle', ''),
                'published_at': snippet.get('publishedAt', ''),
                'view_count': int(statistics.get('viewCount', 0)),
                'like_count': int(statistics.get('likeCount', 0)),
                'comment_count': int(statistics.get('commentCount', 0)),
                'duration': item['contentDetails'].get('duration', ''),
                'url': f"https://www.youtube.com/watch?v={video_id}"
            }
            
        except Exception as e:
            print(f"[ERROR] Failed to get video details for {video_id}: {e}")
            return None
    
    def get_transcript(self, video_id: str, languages: List[str] = None) -> Optional[str]:
        """
        Get transcript/captions for a YouTube video using YouTube's public timedtext API.
        This method tries multiple language codes and caption types (auto-generated and manual).
        
        Args:
            video_id: YouTube video ID
            languages: Preferred language codes (default: ['en', 'hi'])
            
        Returns:
            Full transcript text or None if not available
        """
        if languages is None:
            languages = ['en', 'hi']
        
        try:
            # YouTube's timedtext API endpoint (public, no auth required)
            base_url = "https://www.youtube.com/api/timedtext"
            
            # Try different language codes and caption types
            lang_variants = []
            for lang in languages:
                # Add both base language and regional variants
                if lang == 'en':
                    lang_variants.extend(['en', 'en-US', 'en-GB', 'en-IN'])
                elif lang == 'hi':
                    lang_variants.extend(['hi', 'hi-IN'])
                else:
                    lang_variants.append(lang)
            
            # Try each language variant with different caption kinds
            for lang_code in lang_variants:
                # Try manual captions first, then auto-generated
                for kind in ['', 'asr']:  # '' = manual, 'asr' = auto-generated
                    try:
                        params = {
                            'lang': lang_code,
                            'v': video_id
                        }
                        if kind:
                            params['kind'] = kind
                        
                        # Try different formats
                        for fmt in ['srv3', 'srv2', 'srv1', '']:
                            if fmt:
                                params['fmt'] = fmt
                            
                            response = requests.get(base_url, params=params, timeout=10)
                            
                            if response.status_code == 200 and response.text and len(response.text) > 100:
                                # Parse XML and extract text
                                try:
                                    root = ElementTree.fromstring(response.content)
                                    
                                    # Extract all text elements
                                    texts = []
                                    for text_elem in root.iter():
                                        if text_elem.text and text_elem.text.strip():
                                            # Clean up text (remove extra whitespace, newlines)
                                            text_content = ' '.join(text_elem.text.split())
                                            if text_content:
                                                texts.append(text_content)
                                    
                                    if texts:
                                        full_transcript = ' '.join(texts)
                                        # Verify we got actual content
                                        if len(full_transcript) > 50:
                                            return full_transcript
                                except:
                                    continue
                    except:
                        continue
            
            # If all attempts fail, try getting caption track list from video page
            try:
                watch_url = f"https://www.youtube.com/watch?v={video_id}"
                response = requests.get(watch_url, timeout=10)
                
                if response.status_code == 200:
                    # Look for caption tracks in page source
                    text = response.text
                    
                    # Search for caption track URLs in the page
                    caption_tracks = re.findall(r'"captionTracks":\[(.*?)\]', text)
                    if caption_tracks:
                        # Try to extract language codes from found tracks
                        lang_codes = re.findall(r'"languageCode":"([^"]+)"', caption_tracks[0])
                        
                        for lang_code in lang_codes[:5]:  # Try first 5 languages
                            params = {'lang': lang_code, 'v': video_id}
                            response = requests.get(base_url, params=params, timeout=10)
                            
                            if response.status_code == 200 and len(response.text) > 100:
                                try:
                                    root = ElementTree.fromstring(response.content)
                                    texts = []
                                    for text_elem in root.iter():
                                        if text_elem.text and text_elem.text.strip():
                                            texts.append(' '.join(text_elem.text.split()))
                                    
                                    if texts:
                                        full_transcript = ' '.join(texts)
                                        if len(full_transcript) > 50:
                                            return full_transcript
                                except:
                                    continue
            except:
                pass
            
            return None
            
        except Exception as e:
            return None
    
    def search_and_transcribe(self, query: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """
        Search for videos and get their transcripts.
        
        Args:
            query: Search query
            max_results: Maximum number of videos to process
            
        Returns:
            List of videos with transcripts
        """
        print(f"[INFO] Searching and transcribing videos for: '{query}'")
        
        # Search for videos
        videos = self.search_videos(query, max_results)
        
        results = []
        for i, video in enumerate(videos, 1):
            video_id = video['video_id']
            print(f"[{i}/{len(videos)}] Processing: {video['title'][:50]}...")
            
            # Get detailed stats
            details = self.get_video_details(video_id)
            if details:
                video.update(details)
            
            # Get transcript
            transcript = self.get_transcript(video_id)
            video['transcript'] = transcript
            video['has_transcript'] = transcript is not None
            
            if transcript:
                video['transcript_word_count'] = len(transcript.split())
                print(f"    ✓ Transcript: {video['transcript_word_count']} words")
            else:
                video['transcript_word_count'] = 0
                print(f"    ✗ No transcript available")
            
            results.append(video)
        
        # Summary
        with_transcripts = sum(1 for v in results if v['has_transcript'])
        print(f"\n[SUMMARY] {with_transcripts}/{len(results)} videos have transcripts")
        
        return results
    
    def analyze_transcripts(self, videos: List[Dict[str, Any]], keyword: str = None) -> Dict[str, Any]:
        """
        Analyze transcripts for keyword mentions and patterns.
        
        Args:
            videos: List of video dictionaries with transcripts
            keyword: Optional keyword to search for in transcripts
            
        Returns:
            Analysis summary
        """
        total_videos = len(videos)
        videos_with_transcript = [v for v in videos if v.get('has_transcript')]
        
        analysis = {
            'total_videos': total_videos,
            'videos_with_transcript': len(videos_with_transcript),
            'total_words': sum(v.get('transcript_word_count', 0) for v in videos_with_transcript),
            'average_words_per_video': 0,
            'keyword_mentions': []
        }
        
        if videos_with_transcript:
            analysis['average_words_per_video'] = round(
                analysis['total_words'] / len(videos_with_transcript), 2
            )
        
        # Search for keyword mentions
        if keyword:
            keyword_lower = keyword.lower()
            for video in videos_with_transcript:
                transcript = video.get('transcript', '').lower()
                if keyword_lower in transcript:
                    # Count occurrences
                    count = transcript.count(keyword_lower)
                    analysis['keyword_mentions'].append({
                        'video_id': video['video_id'],
                        'title': video['title'],
                        'url': video['url'],
                        'mentions': count,
                        'view_count': video.get('view_count', 0)
                    })
        
        return analysis


if __name__ == "__main__":
    # Test the YouTube agent
    agent = YouTubeAgent()
    
    query = input("Enter search query (or press Enter for default 'AI misinformation'): ").strip()
    if not query:
        query = "Virat Kohli retirement announcement"
    
    print(f"\n{'='*60}")
    print(f"YOUTUBE SEARCH & TRANSCRIPT EXTRACTION")
    print(f"{'='*60}\n")
    
    # Search and transcribe
    results = agent.search_and_transcribe(query, max_results=10)
    
    # Display results
    print(f"\n{'='*60}")
    print(f"RESULTS")
    print(f"{'='*60}\n")
    
    for i, video in enumerate(results[:5], 1):  # Show first 5
        print(f"{i}. {video['title']}")
        print(f"   Channel: {video['channel_title']}")
        print(f"   Views: {video.get('view_count', 'N/A'):,}")
        print(f"   Published: {video['published_at'][:10]}")
        print(f"   Transcript: {'✓' if video['has_transcript'] else '✗'} ({video['transcript_word_count']} words)")
        if video['has_transcript']:
            print(f"   Preview: {video['transcript'][:150]}...")
        print(f"   URL: {video['url']}\n")
    
    # Analyze
    analysis = agent.analyze_transcripts(results, keyword=query.split()[0])
    
    print(f"\n{'='*60}")
    print(f"ANALYSIS")
    print(f"{'='*60}")
    print(f"Videos found: {analysis['total_videos']}")
    print(f"Videos with transcripts: {analysis['videos_with_transcript']}")
    print(f"Total words in transcripts: {analysis['total_words']:,}")
    print(f"Average words per video: {analysis['average_words_per_video']}")
    
    if analysis['keyword_mentions']:
        print(f"\nVideos mentioning '{query.split()[0]}':")
        for mention in analysis['keyword_mentions'][:5]:
            print(f"  • {mention['title'][:50]}... ({mention['mentions']} times)")
