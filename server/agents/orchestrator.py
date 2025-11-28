"""
Orchestrator Agent for the Fake News Detection System.
Responsible for coordinating the overall process and managing communication between agents.
"""
from typing import Dict, Any, List, Optional, Tuple
import json
import logging

logger = logging.getLogger(__name__)
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

from agents.search_agent import SearchAgent
from agents.scorer_agent import ScorerAgent
from utils.helpers import load_api_key, format_evidence

class OrchestratorAgent:
    """Agent for orchestrating the fake news detection process."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Orchestrator Agent.
        
        Args:
            api_key: Optional API key for LLM services
        """
        self.api_key = api_key or load_api_key("OPENAI_API_KEY")
        self.search_agent = SearchAgent(api_key=self.api_key)
        self.scorer_agent = ScorerAgent(api_key=self.api_key)
        self.llm = ChatGoogleGenerativeAI(temperature=0, model="models/gemini-2.5-flash")
        
        # Initialize the LLM chain for extracting key claims
        self.claim_extraction_prompt = PromptTemplate(
            input_variables=["article_text"],
            template="""
            Extract the key factual claims from the following news article text.
            Focus on specific assertions that can be fact-checked.
            
            Article text:
            {article_text}
            
            Return a list of the top 3-5 most important factual claims in this article.
            For each claim, provide:
            1. The claim itself (a concise statement)
            2. Keywords that would be useful for searching for evidence about this claim
            
            Format your response as a JSON array of objects with 'claim' and 'keywords' fields.
            """
        )
        
        self.claim_extraction_chain = LLMChain(
            llm=self.llm,
            prompt=self.claim_extraction_prompt
        )
        
        # Initialize the LLM chain for generating the final report
        self.report_generation_prompt = PromptTemplate(
            input_variables=["article_text", "score_results", "evidence_summary"],
            template="""
            Generate a comprehensive fake news detection report for the following article.
            
            Article:
            {article_text}
            
            Authenticity Analysis:
            {score_results}
            
            Evidence Summary:
            {evidence_summary}
            
            Your report should include:
            1. An executive summary with the overall authenticity assessment
            2. Key findings that support this assessment
            3. Specific red flags or supporting evidence
            4. Recommendations for the reader
            
            Keep the report concise, objective, and evidence-based.
            """
        )
        
        self.report_generation_chain = LLMChain(
            llm=self.llm,
            prompt=self.report_generation_prompt
        )
    
    def process_article(self, article_text: str, article_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a news article to determine its authenticity.
        
        Args:
            article_text: The full text of the article
            article_metadata: Optional metadata about the article (source, date, etc.)
            
        Returns:
            Dictionary with authenticity assessment and supporting evidence
        """
        logger.info("Starting fake news detection process...")
        
        # Initialize metadata if not provided
        if article_metadata is None:
            article_metadata = {
                "source": "Unknown",
                "date": "Unknown",
                "title": "Unknown"
            }
        
        # Step 1: Extract key claims from the article
        key_claims = self._extract_key_claims(article_text)
        
        # Step 2: Search for historical evidence for each claim
        all_evidence = []
        for claim_info in key_claims:
            claim = claim_info.get("claim", "")
            keywords = claim_info.get("keywords", [])
            
            # Create a search query from the claim and keywords
            search_query = f"{claim} {' '.join(keywords)}"
            
            # Search for historical evidence
            evidence = self.search_agent.search_historical_news(search_query)
            all_evidence.extend(evidence)
        
        # Remove duplicates from evidence
        unique_evidence = self._deduplicate_evidence(all_evidence)
        
        # Step 3: Score the article's authenticity
        score_results = self.scorer_agent.score_article(
            article_text, 
            article_metadata, 
            unique_evidence
        )
        
        # Step 4: Generate the final report
        evidence_summary = format_evidence(score_results.get("supporting_evidence", []))
        final_report = self._generate_report(article_text, score_results, evidence_summary)
        
        # Prepare the final result
        result = {
            "article_metadata": article_metadata,
            "authenticity_score": score_results.get("final_score", 0),
            "authenticity_category": score_results.get("authenticity_category", "Unknown"),
            "detailed_scores": score_results.get("detailed_scores", {}),
            "supporting_evidence": score_results.get("supporting_evidence", []),
            "report": final_report,
            "key_claims": key_claims
        }
        
        return result
    
    def _extract_key_claims(self, article_text: str) -> List[Dict[str, Any]]:
        """
        Extract key factual claims from the article.
        
        Args:
            article_text: The article text
            
        Returns:
            List of dictionaries with claims and keywords
        """
        logger.info("Extracting key claims from article...")
        
        try:
            # Use the LLM chain to extract claims
            result = self.claim_extraction_chain.run(article_text=article_text)
            
            # Parse the JSON response
            # The LLM might not always return valid JSON, so we need to handle errors
            try:
                claims = json.loads(result)
                if not isinstance(claims, list):
                    claims = []
            except json.JSONDecodeError:
                # If JSON parsing fails, create a simple claim from the article
                claims = [{
                    "claim": article_text[:100] + "...",
                    "keywords": article_text.split()[:5]
                }]
        except Exception as e:
            logger.error(f"Error extracting claims: {e}")
            # Fallback to a simple approach
            claims = [{
                "claim": article_text[:100] + "...",
                "keywords": article_text.split()[:5]
            }]
        
        return claims
    
    def _deduplicate_evidence(self, evidence_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove duplicate evidence items based on URL.
        
        Args:
            evidence_list: List of evidence items
            
        Returns:
            Deduplicated list
        """
        seen_urls = set()
        unique_evidence = []
        
        for evidence in evidence_list:
            url = evidence.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_evidence.append(evidence)
        
        return unique_evidence
    
    def _generate_report(self, article_text: str, score_results: Dict[str, Any], 
                        evidence_summary: str) -> str:
        """
        Generate a comprehensive report on the article's authenticity.
        
        Args:
            article_text: The article text
            score_results: Results from the scorer agent
            evidence_summary: Summary of supporting evidence
            
        Returns:
            Formatted report as a string
        """
        logger.info("Generating final authenticity report...")
        
        try:
            # Use the LLM chain to generate the report
            report = self.report_generation_chain.run(
                article_text=article_text[:1000],  # Limit length to avoid token limits
                score_results=json.dumps(score_results, indent=2),
                evidence_summary=evidence_summary
            )
            return report
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            # Fallback to a simple report
            score = score_results.get("final_score", 0)
            category = score_results.get("authenticity_category", "Unknown")
            
            return f"""
            Authenticity Assessment
            ----------------------
            Score: {score:.2f}
            Category: {category}
            
            This article has been analyzed for authenticity based on multiple factors.
            Please review the detailed scores and supporting evidence for more information.
            """
