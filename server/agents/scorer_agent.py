"""
Scorer Agent for the Fake News Detection System.
Responsible for evaluating the authenticity of news articles.
"""
from typing import List, Dict, Any, Tuple, Optional
import re
from datetime import datetime
import numpy as np
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

from utils.helpers import load_api_key, calculate_similarity

class ScorerAgent:
    """Agent for scoring the authenticity of news articles."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Scorer Agent.
        
        Args:
            api_key: Optional API key for LLM services
        """
        self.api_key = api_key or load_api_key("OPENAI_API_KEY")
        self.llm = ChatGoogleGenerativeAI(temperature=0, model="gemini-pro")
        
        # Define the scoring criteria
        self.scoring_criteria = {
            "source_credibility": 0.25,  # Weight for source credibility
            "evidence_support": 0.30,    # Weight for evidence from historical articles
            "consistency": 0.20,         # Weight for internal consistency
            "language_analysis": 0.15,   # Weight for language patterns
            "factual_accuracy": 0.10     # Weight for verifiable facts
        }
        
        # Initialize the LLM chain for analyzing language patterns
        self.language_analysis_prompt = PromptTemplate(
            input_variables=["article_text"],
            template="""
            Analyze the following news article text for signs of fake news based on language patterns.
            Look for sensationalist language, excessive use of emotional terms, lack of attribution,
            vague sources, and other linguistic red flags.
            
            Article text:
            {article_text}
            
            Provide a score from 0 to 1 where 0 is definitely fake news and 1 is likely legitimate news.
            Also provide a brief explanation of your reasoning.
            
            Score (0-1):
            """
        )
        
        self.language_analysis_chain = LLMChain(
            llm=self.llm,
            prompt=self.language_analysis_prompt
        )
    
    def score_article(self, article_text: str, article_metadata: Dict[str, Any], 
                     historical_evidence: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Score the authenticity of a news article.
        
        Args:
            article_text: The full text of the article
            article_metadata: Metadata about the article (source, date, etc.)
            historical_evidence: List of historical articles found by the Search Agent
            
        Returns:
            Dictionary with authenticity score and detailed breakdown
        """
        print("Scoring article authenticity...")
        
        # Calculate individual scores
        source_score = self._evaluate_source_credibility(article_metadata.get("source", "Unknown"))
        evidence_score = self._evaluate_evidence_support(article_text, historical_evidence)
        consistency_score = self._evaluate_internal_consistency(article_text)
        language_score = self._analyze_language_patterns(article_text)
        factual_score = self._check_factual_accuracy(article_text, historical_evidence)
        
        # Calculate weighted final score
        final_score = (
            source_score * self.scoring_criteria["source_credibility"] +
            evidence_score * self.scoring_criteria["evidence_support"] +
            consistency_score * self.scoring_criteria["consistency"] +
            language_score * self.scoring_criteria["language_analysis"] +
            factual_score * self.scoring_criteria["factual_accuracy"]
        )
        
        # Determine the authenticity category
        authenticity_category = self._get_authenticity_category(final_score)
        
        # Prepare the detailed result
        result = {
            "final_score": final_score,
            "authenticity_category": authenticity_category,
            "detailed_scores": {
                "source_credibility": {
                    "score": source_score,
                    "weight": self.scoring_criteria["source_credibility"]
                },
                "evidence_support": {
                    "score": evidence_score,
                    "weight": self.scoring_criteria["evidence_support"]
                },
                "internal_consistency": {
                    "score": consistency_score,
                    "weight": self.scoring_criteria["consistency"]
                },
                "language_analysis": {
                    "score": language_score,
                    "weight": self.scoring_criteria["language_analysis"]
                },
                "factual_accuracy": {
                    "score": factual_score,
                    "weight": self.scoring_criteria["factual_accuracy"]
                }
            },
            "supporting_evidence": self._get_top_evidence(historical_evidence, 3)
        }
        
        return result
    
    def _evaluate_source_credibility(self, source: str) -> float:
        """
        Evaluate the credibility of the news source.
        
        Args:
            source: Name of the news source
            
        Returns:
            Credibility score between 0 and 1
        """
        # In a real implementation, this would check against a database of known sources
        # and their credibility ratings
        
        # Mock implementation with some well-known sources
        high_credibility_sources = [
            "Reuters", "Associated Press", "BBC", "The New York Times", 
            "The Washington Post", "The Wall Street Journal", "NPR"
        ]
        
        medium_credibility_sources = [
            "CNN", "MSNBC", "Fox News", "USA Today", "The Guardian",
            "The Atlantic", "Time", "Newsweek"
        ]
        
        if source in high_credibility_sources:
            return 0.9  # High credibility
        elif source in medium_credibility_sources:
            return 0.7  # Medium credibility
        elif source == "Unknown":
            return 0.3  # Unknown source is suspicious
        else:
            # For other sources, return a moderate score
            # In a real implementation, this would be more sophisticated
            return 0.5
    
    def _evaluate_evidence_support(self, article_text: str, 
                                  historical_evidence: List[Dict[str, Any]]) -> float:
        """
        Evaluate how well the article is supported by historical evidence.
        
        Args:
            article_text: The article text
            historical_evidence: List of historical articles
            
        Returns:
            Evidence support score between 0 and 1
        """
        if not historical_evidence:
            return 0.2  # Very little support if no historical evidence
        
        # Calculate the average relevance score of the top 3 pieces of evidence
        top_evidence = sorted(historical_evidence, 
                             key=lambda x: x.get("relevance_score", 0), 
                             reverse=True)[:3]
        
        if not top_evidence:
            return 0.2
        
        avg_relevance = sum(e.get("relevance_score", 0) for e in top_evidence) / len(top_evidence)
        
        # Check if the evidence contradicts or supports the article
        support_score = 0
        for evidence in top_evidence:
            snippet = evidence.get("snippet", "")
            # Simple check for contradiction or support
            # In a real implementation, this would be more sophisticated
            similarity = calculate_similarity(article_text, snippet)
            support_score += similarity
        
        support_score /= len(top_evidence)
        
        # Combine relevance and support
        return (avg_relevance * 0.5) + (support_score * 0.5)
    
    def _evaluate_internal_consistency(self, article_text: str) -> float:
        """
        Evaluate the internal consistency of the article.
        
        Args:
            article_text: The article text
            
        Returns:
            Consistency score between 0 and 1
        """
        # In a real implementation, this would check for contradictions within the article
        # For now, we'll use a simplified approach
        
        # Check for phrases that might indicate inconsistency
        inconsistency_indicators = [
            "however, earlier", "contradicting previous", "despite earlier claims",
            "in contrast to", "reversing course", "changing the story"
        ]
        
        # Count occurrences of inconsistency indicators
        count = sum(article_text.lower().count(indicator) for indicator in inconsistency_indicators)
        
        # More indicators suggest lower consistency
        if count > 5:
            return 0.3
        elif count > 2:
            return 0.6
        else:
            return 0.9
    
    def _analyze_language_patterns(self, article_text: str) -> float:
        """
        Analyze language patterns for signs of fake news.
        
        Args:
            article_text: The article text
            
        Returns:
            Language pattern score between 0 and 1
        """
        # In a real implementation, this would use the LLM chain
        # For now, we'll use a simplified approach
        
        # Check for sensationalist language
        sensationalist_terms = [
            "shocking", "bombshell", "outrageous", "unbelievable", "mind-blowing",
            "explosive", "stunning", "you won't believe", "breaking", "exclusive"
        ]
        
        # Check for vague attributions
        vague_sources = [
            "sources say", "people are saying", "many believe", "experts claim",
            "according to sources", "it is reported", "some say", "allegedly"
        ]
        
        # Count occurrences
        sensationalist_count = sum(article_text.lower().count(term) for term in sensationalist_terms)
        vague_source_count = sum(article_text.lower().count(source) for source in vague_sources)
        
        # Calculate a score based on these counts
        # More occurrences suggest lower credibility
        sensationalist_score = max(0, 1 - (sensationalist_count * 0.1))
        vague_source_score = max(0, 1 - (vague_source_count * 0.15))
        
        # Combine the scores
        return (sensationalist_score * 0.6) + (vague_source_score * 0.4)
    
    def _check_factual_accuracy(self, article_text: str, 
                               historical_evidence: List[Dict[str, Any]]) -> float:
        """
        Check the factual accuracy of the article against historical evidence.
        
        Args:
            article_text: The article text
            historical_evidence: List of historical articles
            
        Returns:
            Factual accuracy score between 0 and 1
        """
        if not historical_evidence:
            return 0.5  # Neutral if no evidence
        
        # Extract potential facts from the article
        # In a real implementation, this would be more sophisticated
        sentences = re.split(r'[.!?]', article_text)
        potential_facts = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        if not potential_facts:
            return 0.5
        
        # Check each potential fact against the evidence
        fact_scores = []
        for fact in potential_facts:
            best_match_score = 0
            for evidence in historical_evidence:
                snippet = evidence.get("snippet", "")
                similarity = calculate_similarity(fact, snippet)
                best_match_score = max(best_match_score, similarity)
            
            fact_scores.append(best_match_score)
        
        # Average the fact scores
        return sum(fact_scores) / len(fact_scores)
    
    def _get_authenticity_category(self, score: float) -> str:
        """
        Get the authenticity category based on the score.
        
        Args:
            score: Authenticity score between 0 and 1
            
        Returns:
            Category as a string
        """
        if score >= 0.8:
            return "Highly Likely Authentic"
        elif score >= 0.6:
            return "Likely Authentic"
        elif score >= 0.4:
            return "Uncertain"
        elif score >= 0.2:
            return "Likely Fake"
        else:
            return "Highly Likely Fake"
    
    def _get_top_evidence(self, evidence_list: List[Dict[str, Any]], 
                         limit: int = 3) -> List[Dict[str, Any]]:
        """
        Get the top evidence items sorted by relevance.
        
        Args:
            evidence_list: List of evidence items
            limit: Maximum number of items to return
            
        Returns:
            List of top evidence items
        """
        if not evidence_list:
            return []
        
        sorted_evidence = sorted(
            evidence_list, 
            key=lambda x: x.get("relevance_score", 0),
            reverse=True
        )
        
        return sorted_evidence[:limit]
