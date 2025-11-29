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
from agents.verdict_agent import VerdictAgent

def main():
    load_dotenv()
    
    parser = argparse.ArgumentParser(description='Analyze claims for a given query.')
    parser.add_argument('query', type=str, help='The query or claim to analyze')
    args = parser.parse_args()
    
    query = args.query
    print(f"\n🔍 Analyzing claims for: '{query}'\n")
    
    # 1. Harvest Data
    # Enable smart accounts to find related sources
    harvest_agent = HarvestAgent(use_smart_accounts=True)
    items = harvest_agent.harvest(query)
    print(f"\n✅ Harvested {len(items)} items from web, X, and Reddit.\n")
    
    # 2. Analyze Claims
    claim_agent = ClaimAnalysisAgent()
    analyzed_items = claim_agent.analyze_claims(query, items)
    
    # 3. Determine Verdict
    verdict_agent = VerdictAgent()
    print("⚖️  Determining final verdict...")
    final_verdict = verdict_agent.determine_verdict(query, analyzed_items)

    # 4. Flatten analysis data for easier access
    for item in analyzed_items:
        analysis = item.get('analysis', {})
        item['classification'] = analysis.get('classification', 'NEUTRAL')
        item['claim'] = analysis.get('claim', 'No claim extracted')
        item['reasoning'] = analysis.get('reasoning', 'No reasoning provided')
    
    # 5. Print Results
    supporting = [item for item in analyzed_items if item.get('classification') == 'SUPPORT']
    contradicting = [item for item in analyzed_items if item.get('classification') == 'CONTRADICT']
    neutral = [item for item in analyzed_items if item.get('classification') == 'NEUTRAL']

    print("="*60)
    print(f"RESULTS FOR: {query}")
    print("="*60)
    
    # Print Final Verdict
    print(f"\n🏆 FINAL VERDICT: {final_verdict.get('verdict', 'UNKNOWN')}")
    print(f"🎯 Confidence: {final_verdict.get('confidence', 0.0)}")
    print(f"📝 Explanation: {final_verdict.get('explanation', 'No explanation provided.')}")
    print("\n" + "="*60 + "\n")

    print(f"\n🟢 SUPPORTING CLAIMS (TRUE) - Found: {len(supporting)}\n")
    for i, item in enumerate(supporting[:10], 1):
        print(f"{i}. Source: {item.get('author')} ({item.get('platform')})")
        print(f"   Type: {item.get('source_type', 'general').upper()}")
        print(f"   Claim: {item.get('claim')}")
        print(f"   Reasoning: {item.get('reasoning')}")
        print(f"   URL: {item.get('url')}\n")

    print(f"🔴 CONTRADICTING CLAIMS (FALSE) - Found: {len(contradicting)}\n")
    for i, item in enumerate(contradicting[:10], 1):
        print(f"{i}. Source: {item.get('author')} ({item.get('platform')})")
        print(f"   Type: {item.get('source_type', 'general').upper()}")
        print(f"   Claim: {item.get('claim')}")
        print(f"   Reasoning: {item.get('reasoning')}")
        print(f"   URL: {item.get('url')}\n")

    print("="*60)
    print(f"Summary: {len(supporting)} Supporting, {len(contradicting)} Contradicting, {len(neutral)} Neutral/Irrelevant")
    print("="*60)

if __name__ == "__main__":
    main()
