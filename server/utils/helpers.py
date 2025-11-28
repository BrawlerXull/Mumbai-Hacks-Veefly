"""
Helper functions for the fake news detection system.
"""
import os
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import numpy as np
from datetime import datetime

# Load environment variables
load_dotenv()

def load_api_key(key_name: str) -> str:
    """Load API key from environment variables."""
    # Support both OpenAI and Google API keys
    if key_name == "OPENAI_API_KEY":
        # Try to get Google API key first
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            # Fall back to OpenAI key if specified
            api_key = os.getenv(key_name)
    else:
        api_key = os.getenv(key_name)
        
    if not api_key:
        raise ValueError(f"API key not found in environment variables. Please set GOOGLE_API_KEY.")
    return api_key

def fetch_article_content(url: str) -> Optional[str]:
    """
    Fetch the content of an article from a URL.
    
    Args:
        url: URL of the article to fetch
        
    Returns:
        The text content of the article or None if the request fails
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.text
    except (requests.RequestException, Exception) as e:
        print(f"Error fetching article: {e}")
        return None

def calculate_similarity(text1: str, text2: str) -> float:
    """
    Calculate the cosine similarity between two text snippets.
    This is a placeholder for more sophisticated similarity calculation.
    
    Args:
        text1: First text
        text2: Second text
        
    Returns:
        Similarity score between 0 and 1
    """
    # In a real implementation, this would use embeddings and proper similarity calculation
    # This is just a simple placeholder
    common_words = set(text1.lower().split()) & set(text2.lower().split())
    if not common_words:
        return 0.0
    
    return len(common_words) / (len(set(text1.lower().split())) + len(set(text2.lower().split())) - len(common_words))

def get_current_date() -> str:
    """Get the current date in YYYY-MM-DD format."""
    return datetime.now().strftime("%Y-%m-%d")

def format_evidence(evidence_list: List[Dict[str, Any]]) -> str:
    """
    Format a list of evidence items into a readable string.
    
    Args:
        evidence_list: List of evidence dictionaries
        
    Returns:
        Formatted string with evidence details
    """
    if not evidence_list:
        return "No supporting evidence found."
    
    result = "Supporting Evidence:\n\n"
    for i, evidence in enumerate(evidence_list, 1):
        result += f"{i}. {evidence.get('title', 'Untitled')}\n"
        result += f"   Source: {evidence.get('source', 'Unknown')}\n"
        result += f"   Date: {evidence.get('date', 'Unknown')}\n"
        result += f"   Relevance: {evidence.get('relevance_score', 0):.2f}\n"
        result += f"   URL: {evidence.get('url', 'N/A')}\n\n"
    
    return result
