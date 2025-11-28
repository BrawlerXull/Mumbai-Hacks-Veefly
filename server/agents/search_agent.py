"""
Search Agent for the Fake News Detection System.
Responsible for searching historical news articles to find relevant information.
"""
from typing import List, Dict, Any, Optional
import requests
from datetime import datetime, timedelta
import os
import json
import time
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.docstore.document import Document
import sys

from utils.helpers import load_api_key, fetch_article_content, calculate_similarity

class SearchAgent:
    """Agent for searching historical news articles."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Search Agent.
        
        Args:
            api_key: Optional API key for news services
        """
        self.api_key = api_key or load_api_key("OPENAI_API_KEY")
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        # In a production system, this would be a connection to a database or search API
        self.search_cache = {}
        
    def search_historical_news(self, query: str, time_range_days: int = 365) -> List[Dict[str, Any]]:
        """
        Search for historical news articles related to the query using Google Search MCP Server.
        
        Args:
            query: The search query
            time_range_days: How many days back to search
            
        Returns:
            List of relevant articles with metadata
        """
        print(f"Searching for historical news related to: {query}")
        
        # Determine date restriction based on time_range_days
        date_restrict = self._get_date_restriction(time_range_days)
        
        # Prepare the search query with news focus
        search_query = f"{query} news articles"
        
        try:
            # Use the Google Search MCP Server to search for news articles
            results = self._google_search_mcp(search_query, date_restrict)
            
            # Process and enrich the results
            enriched_results = []
            for result in results:
                # Extract source from the URL
                source = self._extract_source_from_url(result.get("link", ""))
                
                # Extract date from the snippet or use current date
                date = self._extract_date_from_snippet(result.get("snippet", "")) or datetime.now().strftime("%Y-%m-%d")
                
                enriched_result = {
                    "title": result.get("title", "Unknown Title"),
                    "source": source,
                    "date": date,
                    "url": result.get("link", ""),
                    "snippet": result.get("snippet", ""),
                    "relevance_score": self._calculate_relevance(query, result.get("snippet", ""))
                }
                enriched_results.append(enriched_result)
            
            # Sort by relevance score
            enriched_results.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            return enriched_results
            
        except Exception as e:
            print(f"Error searching with Google Search MCP Server: {e}")
            # Fall back to mock data if the MCP server fails
            print("Falling back to mock search data...")
            return self._mock_search_fallback(query, time_range_days)
    
    def _google_search_mcp(self, query: str, date_restrict: str = None, num_results: int = 10) -> List[Dict[str, Any]]:
        """
        Use Google Search MCP Server to search for news articles.
        
        Args:
            query: Search query
            date_restrict: Date restriction (e.g., 'm3' for last 3 months)
            num_results: Number of results to return
            
        Returns:
            List of search results
        """
        try:
            # Import MCP client module
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))
            from mcp_client import call_mcp_server
            
            # Prepare arguments for google_search tool
            args = {
                "query": query,
                "num_results": num_results,
                "resultType": "news",
                "sort": "date"
            }
            
            # Add date restriction if specified
            if date_restrict:
                args["dateRestrict"] = date_restrict
            
            # Call the Google Search MCP Server
            response = call_mcp_server("google-search", "google_search", args)
            
            # Extract search results from the response
            if response and "results" in response:
                return response["results"]
            return []
            
        except Exception as e:
            print(f"Error using Google Search MCP: {e}")
            return []
    
    def _extract_webpage_content(self, url: str) -> str:
        """
        Extract content from a webpage using Google Search MCP Server.
        
        Args:
            url: URL of the webpage
            
        Returns:
            Extracted content as string
        """
        try:
            # Import MCP client module
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))
            from mcp_client import call_mcp_server
            
            # Prepare arguments for extract_webpage_content tool
            args = {
                "url": url,
                "format": "markdown"
            }
            
            # Call the Google Search MCP Server
            response = call_mcp_server("google-search", "extract_webpage_content", args)
            
            # Extract content from the response
            if response and "content" in response:
                return response["content"]
            return ""
            
        except Exception as e:
            print(f"Error extracting webpage content: {e}")
            return ""
    
    def _get_date_restriction(self, time_range_days: int) -> str:
        """
        Convert time_range_days to a date restriction format for Google Search.
        
        Args:
            time_range_days: Number of days to look back
            
        Returns:
            Date restriction string (e.g., 'd7', 'm3', 'y1')
        """
        if time_range_days <= 7:
            return f"d{time_range_days}"
        elif time_range_days <= 30:
            return f"w{time_range_days // 7}"
        elif time_range_days <= 365:
            return f"m{time_range_days // 30}"
        else:
            return f"y{time_range_days // 365}"
    
    def _extract_source_from_url(self, url: str) -> str:
        """
        Extract the source name from a URL.
        
        Args:
            url: URL of the article
            
        Returns:
            Source name
        """
        try:
            from urllib.parse import urlparse
            parsed_url = urlparse(url)
            domain = parsed_url.netloc
            
            # Remove www. prefix if present
            if domain.startswith('www.'):
                domain = domain[4:]
                
            # Extract the main domain name (e.g., nytimes.com -> The New York Times)
            domain_parts = domain.split('.')
            if len(domain_parts) > 1:
                main_domain = domain_parts[0]
                
                # Map common domains to proper source names
                domain_map = {
                    'nytimes': 'The New York Times',
                    'washingtonpost': 'The Washington Post',
                    'wsj': 'The Wall Street Journal',
                    'bbc': 'BBC',
                    'cnn': 'CNN',
                    'reuters': 'Reuters',
                    'apnews': 'Associated Press',
                    'theguardian': 'The Guardian'
                }
                
                return domain_map.get(main_domain, domain)
            
            return domain
        except Exception:
            return "Unknown Source"
    
    def _extract_date_from_snippet(self, snippet: str) -> Optional[str]:
        """
        Extract a date from a snippet if present.
        
        Args:
            snippet: Article snippet
            
        Returns:
            Date string in YYYY-MM-DD format or None
        """
        import re
        
        # Look for common date patterns in the snippet
        date_patterns = [
            r'(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{4})',  # 15 Jan 2023
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{1,2}),\s(\d{4})',  # Jan 15, 2023
            r'(\d{4})-(\d{2})-(\d{2})'  # 2023-01-15
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, snippet)
            if match:
                # Convert the matched date to YYYY-MM-DD format
                if '-' in pattern:
                    # Already in YYYY-MM-DD format
                    return match.group(0)
                else:
                    # Convert to YYYY-MM-DD format
                    month_names = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
                                 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'}
                    
                    if match.group(1) in month_names:  # Jan 15, 2023 format
                        month = month_names[match.group(1)]
                        day = match.group(2).zfill(2)
                        year = match.group(3)
                    else:  # 15 Jan 2023 format
                        day = match.group(1).zfill(2)
                        month = month_names[match.group(2)]
                        year = match.group(3)
                        
                    return f"{year}-{month}-{day}"
        
        return None
        
    def _mock_search_fallback(self, query: str, time_range_days: int) -> List[Dict[str, Any]]:
        """
        Mock implementation of a news search API.
        
        Args:
            query: Search query
            time_range_days: Days to look back
            
        Returns:
            List of mock search results
        """
        # Cache key to avoid regenerating the same results
        cache_key = f"{query}_{time_range_days}"
        if cache_key in self.search_cache:
            return self.search_cache[cache_key]
        
        # Generate some mock results
        # In a real implementation, this would be replaced with actual API calls
        mock_sources = ["The New York Times", "Reuters", "Associated Press", "BBC", "CNN"]
        mock_results = []
        
        # Generate dates within the time range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=time_range_days)
        
        # Create some mock results based on the query
        for i in range(min(10, max(3, len(query) // 2))):  # Number of results based on query length
            # Generate a random date within the range
            days_offset = int(time_range_days * (i / 10))  # Distribute across the time range
            article_date = end_date - timedelta(days=days_offset)
            date_str = article_date.strftime("%Y-%m-%d")
            
            # Create a mock article
            source = mock_sources[i % len(mock_sources)]
            title = f"{query.capitalize()} related news from {source}"
            snippet = f"This is a mock snippet about {query} that would be found in a real news article. " \
                     f"It contains information that might be relevant to fact-checking."
            url = f"https://example.com/news/{date_str.replace('-', '/')}/{query.replace(' ', '-')}-{i}"
            
            mock_results.append({
                "title": title,
                "source": source,
                "date": date_str,
                "url": url,
                "snippet": snippet
            })
        
        # Cache the results
        self.search_cache[cache_key] = mock_results
        return mock_results
    
    def _calculate_relevance(self, query: str, text: str) -> float:
        """
        Calculate the relevance of a text to the query.
        
        Args:
            query: Search query
            text: Text to evaluate
            
        Returns:
            Relevance score between 0 and 1
        """
        # In a real implementation, this would use embeddings and semantic search
        # For now, we'll use a simple similarity measure
        return calculate_similarity(query, text)
    
    def get_article_content(self, url: str) -> Optional[str]:
        """
        Get the full content of an article from its URL using Google Search MCP Server.
        
        Args:
            url: URL of the article
            
        Returns:
            Full text content of the article or None if not available
        """
        # Try to extract the content using Google Search MCP Server
        content = self._extract_webpage_content(url)
        
        if content:
            return content
        
        # Fall back to basic fetch if MCP extraction fails
        if "example.com" in url:
            return f"This is the full content of the article at {url}. " \
                   f"It would contain the complete text that could be used for fact-checking."
        
        # For non-mock URLs, try to fetch the actual content with our basic fetcher
        return fetch_article_content(url)
    
    def create_vector_store(self, documents: List[Dict[str, Any]]) -> FAISS:
        """
        Create a vector store from a list of documents for semantic search.
        
        Args:
            documents: List of document dictionaries with 'content' and 'metadata' keys
            
        Returns:
            FAISS vector store
        """
        docs = [
            Document(
                page_content=doc["content"],
                metadata=doc["metadata"]
            ) for doc in documents
        ]
        
        return FAISS.from_documents(docs, self.embeddings)
    
    def semantic_search(self, query: str, vector_store: FAISS, k: int = 5) -> List[Document]:
        """
        Perform semantic search on a vector store.
        
        Args:
            query: Search query
            vector_store: FAISS vector store
            k: Number of results to return
            
        Returns:
            List of relevant documents
        """
        return vector_store.similarity_search(query, k=k)
