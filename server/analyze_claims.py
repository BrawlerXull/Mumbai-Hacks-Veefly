"""
Script to analyze claims for a given query.
It harvests posts from various platforms and classifies them as supporting or contradicting the query.
"""
import argparse
import json
import os
import sys
from typing import List, Dict, Any
from dotenv import load_dotenv

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.propogation_agent import HarvestAgent
from agents.claim_agent import ClaimAnalysisAgent

def main():
    load_dotenv()
    
    parser = argparse.ArgumentParser(description='Analyze claims for a given query.')
    parser.add_argument('query', type=str, help='The query or claim to analyze')
    args = parser.parse_args()
    
    query = args.query
    print(f"\n🔍 Analyzing claims for: '{query}'\n")
    
    # 1. Harvest Data
    harvest_agent = HarvestAgent()
    items = harvest_agent.harvest(query)
    print(f"\n✅ Harvested {len(items)} items from web, X, and Reddit.\n")
    
    # 2. Analyze Claims
    claim_agent = ClaimAnalysisAgent()
    analyzed_items = claim_agent.analyze_claims(query, items)
    
    # 3. Filter and Print Results
    supporting_claims = []
    contradicting_claims = []
    neutral_claims = []
    
    for item in analyzed_items:
        analysis = item.get("analysis", {})
        classification = analysis.get("classification", "NEUTRAL")
        
        result_item = {
            "source": item.get("author", "Unknown"),
            "platform": item.get("platform", "Unknown"),
            "claim": analysis.get("claim", "No claim extracted"),
            "reasoning": analysis.get("reasoning", "No reasoning provided"),
            "url": item.get("url", "N/A")
        }
        
        if classification == "SUPPORT":
            supporting_claims.append(result_item)
        elif classification == "CONTRADICT":
            contradicting_claims.append(result_item)
        else:
            neutral_claims.append(result_item)
            
    # Print Results
    print("="*60)
    print(f"RESULTS FOR: {query}")
    print("="*60)
    
    print(f"\n🟢 SUPPORTING CLAIMS (TRUE) - Found: {len(supporting_claims)}")
    for i, item in enumerate(supporting_claims, 1):
        print(f"\n{i}. Source: {item['source']} ({item['platform']})")
        print(f"   Claim: {item['claim']}")
        print(f"   Reasoning: {item['reasoning']}")
        print(f"   URL: {item['url']}")
        
    print(f"\n🔴 CONTRADICTING CLAIMS (FALSE) - Found: {len(contradicting_claims)}")
    for i, item in enumerate(contradicting_claims, 1):
        print(f"\n{i}. Source: {item['source']} ({item['platform']})")
        print(f"   Claim: {item['claim']}")
        print(f"   Reasoning: {item['reasoning']}")
        print(f"   URL: {item['url']}")
        
    print("\n" + "="*60)
    print(f"Summary: {len(supporting_claims)} Supporting, {len(contradicting_claims)} Contradicting, {len(neutral_claims)} Neutral/Irrelevant")
    print("="*60)

if __name__ == "__main__":
    main()
