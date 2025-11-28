"""
Account Finder Agent - Uses LLM to identify relevant social media accounts
for a given person or topic, then searches those accounts for claim-related content.
"""

import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from openai import OpenAI
import json
import re

load_dotenv()


class AccountFinderAgent:
    """Agent for finding relevant social media accounts using LLM."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Account Finder Agent with OpenAI API.
        
        Args:
            api_key: OpenAI API key (optional, will use env variable if not provided)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key)
    
    def find_instagram_accounts(self, query: str, max_accounts: int = 10) -> List[str]:
        """
        Use LLM to find relevant Instagram accounts based on query.
        
        Args:
            query: The person, topic, or claim to find accounts for
            max_accounts: Maximum number of accounts to return
            
        Returns:
            List of Instagram usernames (without @)
        """
        prompt = f"""
User Query: "{query}"
Max Accounts: {max_accounts}

---------------------------------------
Objective
You are an expert system specializing in identifying the most relevant verified, high-credibility Instagram accounts for real-time news monitoring and fact-checking.

Your job is to analyze the user’s query and output exactly the Instagram usernames most likely to post reliable content about the topic, event, individual, or entity mentioned.

---------------------------------------
Task Requirements
---------------------------------------
1. Interpret the User Query
- Accept all query types including public figures, organizations, events, breaking news, sports, politics, crises, entertainment, ambiguous names, spelling variations, or multi-entity topics.
- If multiple interpretations exist, prioritize the globally most recognized one unless context indicates otherwise.

---------------------------------------
Account Selection Logic (Strict Priority)
---------------------------------------
Always follow this hierarchy:

1. Official Instagram accounts of:
   - The individual
   - The organization
   - The event or managing body

2. Immediate family members or direct professional associates:
   - Only verified and publicly recognized accounts

3. Major news outlets (global, national, or India-specific depending on context)

4. Sports outlets (only when relevant)

5. Journalists & reporters specializing in the domain

6. Government bodies or governing authorities relevant to the query

7. Fact-checking organizations

8. High-credibility analysts or subject-matter experts with verified accounts

Stop selecting once you reach the number specified by {max_accounts}.

---------------------------------------
Rules & Constraints
---------------------------------------
- Output verified, publicly known Instagram usernames only.
- One username per line.
- No @ symbol.
- No explanations, commentary, or extra text.
- No duplicates.
- No private individuals or unverified accounts.
- Skip irrelevant or low-credibility accounts silently.
- Prioritize upper categories heavily.
- If no accounts exist in a category, skip it without comment.

---------------------------------------
Output Format
---------------------------------------
username1
username2
username3
…

Limit output to {max_accounts} total accounts.

---------------------------------------
Final Instruction
---------------------------------------
Return ONLY the usernames.
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            
            # Extract usernames (alphanumeric, dots, underscores)
            usernames = []
            for line in content.split('\n'):
                line = line.strip()
                # Remove @ if present, remove any numbering or bullets
                line = re.sub(r'^[\d\.\-\*\)]+\s*', '', line)
                line = line.lstrip('@').strip()
                
                # Validate username format (Instagram format)
                if re.match(r'^[a-zA-Z0-9._]{1,30}$', line) and line:
                    usernames.append(line)
            
            print(f"[INFO] Found {len(usernames)} Instagram accounts for: {query}")
            return usernames[:max_accounts]
            
        except Exception as e:
            print(f"[ERROR] Failed to find Instagram accounts: {e}")
            return []
    
    def find_twitter_accounts(self, query: str, max_accounts: int = 10) -> List[str]:
        """
        Use LLM to find relevant Twitter/X accounts based on query.
        
        Args:
            query: The person, topic, or claim to find accounts for
            max_accounts: Maximum number of accounts to return
            
        Returns:
            List of Twitter handles (without @)
        """
        prompt = f"""
You are an expert in identifying highly relevant Twitter/X accounts for real-time news monitoring and fact-checking.

Query: "{query}"

Task: Identify the most relevant Twitter/X accounts that would be most likely to post about this topic or individual.

Consider the following priority order:

Official accounts of the person or organization

Immediate family members or direct associates

Major sports and general news outlets covering India

Journalists and reporters specializing in cricket

Relevant government or sports-governing bodies

Fact-checking organizations

Subject-matter experts and high-credibility analysts

Instructions:

Provide ONLY Twitter/X handles (no @).

One handle per line.

All accounts must be verified and publicly recognizable.

Exclude:
– Private individuals
– Unverified or low-credibility accounts
– Accounts unlikely to post about the topic

Limit to the {max_accounts} most relevant accounts.

Weight results strongly toward the top two categories.

Response format (no explanations):
username1
username2
username3
…

Twitter/X handles only, no explanations:
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            
            # Extract handles (alphanumeric, underscores)
            handles = []
            for line in content.split('\n'):
                line = line.strip()
                # Remove @ if present, remove any numbering or bullets
                line = re.sub(r'^[\d\.\-\*\)]+\s*', '', line)
                line = line.lstrip('@').strip()
                
                # Validate handle format (Twitter format)
                if re.match(r'^[a-zA-Z0-9_]{1,15}$', line) and line:
                    handles.append(line)
            
            print(f"[INFO] Found {len(handles)} Twitter/X accounts for: {query}")
            return handles[:max_accounts]
            
        except Exception as e:
            print(f"[ERROR] Failed to find Twitter/X accounts: {e}")
            return []
    
    def find_all_accounts(self, query: str) -> Dict[str, List[str]]:
        """
        Find relevant accounts across all platforms.
        
        Args:
            query: The person, topic, or claim to find accounts for
            
        Returns:
            Dictionary with platform names as keys and account lists as values
        """
        return {
            "instagram": self.find_instagram_accounts(query, max_accounts=10),
            # "twitter": self.find_twitter_accounts(query, max_accounts=10),
        }


if __name__ == "__main__":
    agent = AccountFinderAgent()
    
    # Test examples
    queries = [
        "Virat Kohli retiring from international cricket",
    ]
    
    for query in queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print(f"{'='*60}\n")
        
        accounts = agent.find_all_accounts(query)
        
        print("Instagram Accounts:")
        print(accounts['instagram'])
        
        # print("\nTwitter/X Accounts:")
        # print(accounts['twitter'])

