"""
Test script for HarvestAgent to verify claim harvesting across platforms.
Tests Instagram post matching using LLM-based relevance detection.
"""

import sys
import os
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.propogation_agent import HarvestAgent

load_dotenv()

def test_harvest_claim():
    """Test harvesting data for a specific claim."""
    
    # Initialize harvest agent
    print("="*60)
    print("HARVEST AGENT TEST")
    print("="*60)
    
    agent = HarvestAgent(use_smart_accounts=True)
    
    # Test claim
    claim = "Pahalgam terror attack, which occurred on April 22, 2025"
    
    print(f"\n🔍 Testing claim: {claim}\n")
    
    # Harvest data
    results = agent.harvest(claim)
    
    # Display results
    print("\n" + "="*60)
    print("HARVEST RESULTS")
    print("="*60)
    
    print(f"\nTotal items found: {len(results)}")
    
    # Group by platform
    platforms = {}
    for item in results:
        platform = item.get('platform', 'unknown')
        if platform not in platforms:
            platforms[platform] = []
        platforms[platform].append(item)
    
    print(f"Platforms: {', '.join(platforms.keys())}\n")
    
    # Display results by platform
    for platform, items in platforms.items():
        print(f"\n{'='*60}")
        print(f"{platform.upper()} - {len(items)} items")
        print(f"{'='*60}")
        
        for i, item in enumerate(items, 1):  # Show ALL items
            print(f"\n{i}. Author: {item.get('author', 'Unknown')}")
            print(f"   Timestamp: {item.get('timestamp', 'Unknown')}")
            
            content = item.get('content', '')
            # Show more content
            if len(content) > 300:
                print(f"   Content: {content[:300]}...")
            else:
                print(f"   Content: {content}")
            
            if item.get('url'):
                print(f"   URL: {item.get('url')}")
            
            # Platform-specific metadata
            if platform == 'instagram':
                engagement = item.get('likes', 0) + item.get('comments', 0)
                print(f"   ❤️  Likes: {item.get('likes', 0):,}")
                print(f"   💬 Comments: {item.get('comments', 0):,}")
                print(f"   📊 Total Engagement: {engagement:,}")
                print(f"   🎯 Similarity Score: {item.get('similarity_score', 0):.2f}")
                print(f"   📷 Type: {'🎥 Video' if item.get('is_video') else '📸 Photo'}")
                if item.get('media_url'):
                    print(f"   🔗 Media: {item.get('media_url')[:80]}...")
            
            elif platform == 'twitter':
                print(f"   Tweet ID: {item.get('id', 'N/A')}")
            
            elif platform == 'youtube':
                print(f"   Title: {item.get('title', 'N/A')}")
                print(f"   Views: {item.get('view_count', 0):,}")
                print(f"   Likes: {item.get('like_count', 0):,}")
                print(f"   Transcript Words: {item.get('transcript_word_count', 0)}")
            
            elif platform == 'reddit':
                print(f"   Post ID: {item.get('id', 'N/A')}")
    
    # Summary statistics
    print("\n" + "="*60)
    print("SUMMARY STATISTICS")
    print("="*60)
    
    for platform, items in platforms.items():
        print(f"\n{platform.capitalize()}:")
        print(f"  Total items: {len(items)}")
        
        if platform == 'instagram':
            total_likes = sum(item.get('likes', 0) for item in items)
            total_comments = sum(item.get('comments', 0) for item in items)
            avg_similarity = sum(item.get('similarity_score', 0) for item in items) / len(items) if items else 0
            print(f"  Total engagement: {total_likes + total_comments:,}")
            print(f"  Average similarity score: {avg_similarity:.2f}")
        
        elif platform == 'youtube':
            total_views = sum(item.get('view_count', 0) for item in items)
            with_transcripts = sum(1 for item in items if item.get('transcript_word_count', 0) > 0)
            print(f"  Total views: {total_views:,}")
            print(f"  Videos with transcripts: {with_transcripts}/{len(items)}")
    
    return results


def test_multiple_claims():
    """Test with multiple claim types."""
    
    agent = HarvestAgent(use_smart_accounts=True)
    
    test_claims = [
        "Virat Kohli retirement announcement 2024",
        "COVID-19 vaccine side effects study",
        "Climate change report 2025"
    ]
    
    print("\n" + "="*60)
    print("TESTING MULTIPLE CLAIMS")
    print("="*60)
    
    for claim in test_claims:
        print(f"\n\n{'='*60}")
        print(f"Claim: {claim}")
        print(f"{'='*60}")
        
        results = agent.harvest(claim)
        
        # Quick summary
        platforms = {}
        for item in results:
            platform = item.get('platform', 'unknown')
            platforms[platform] = platforms.get(platform, 0) + 1
        
        print(f"\nResults: {len(results)} total items")
        for platform, count in platforms.items():
            print(f"  {platform}: {count} items")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Test HarvestAgent claim harvesting')
    parser.add_argument('--multi', action='store_true', help='Test multiple claims')
    parser.add_argument('--claim', type=str, help='Custom claim to test')
    
    args = parser.parse_args()
    
    if args.multi:
        test_multiple_claims()
    elif args.claim:
        agent = HarvestAgent(use_smart_accounts=True)
        print(f"\nTesting custom claim: {args.claim}\n")
        results = agent.harvest(args.claim)
        print(f"\nFound {len(results)} total items")
    else:
        test_harvest_claim()
