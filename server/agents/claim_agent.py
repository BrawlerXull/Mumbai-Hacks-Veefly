"""
Claim Analysis Agent for the Fake News Detection System.
Responsible for extracting and classifying claims from harvested content.
"""
import json
import logging
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from utils.helpers import load_api_key

logger = logging.getLogger(__name__)

class ClaimAnalysisAgent:
    """Agent for analyzing and classifying claims from harvested content."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Claim Analysis Agent.
        
        Args:
            api_key: Optional API key for LLM services
        """
        self.api_key = "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"
        self.llm = ChatOpenAI(temperature=0, model="gpt-4o", api_key=self.api_key)
        
        # Prompt for classifying claims
        self.classification_prompt = PromptTemplate(
            input_variables=["query", "content"],
            template="""
            Analyze the following content in relation to the query: "{query}"
            
            Content:
            {content}
            
            Determine if this content contains a claim that SUPPORTS (confirms) the query or CONTRADICTS (denies) it.
            If the content is irrelevant or neutral, mark it as NEUTRAL.
            
            Extract the specific claim made in the content.
            
            Format your response as a JSON object with the following fields:
            - "classification": "SUPPORT" | "CONTRADICT" | "NEUTRAL"
            - "claim": "The specific claim extracted from the content"
            - "reasoning": "Brief explanation of why it supports or contradicts"
            """
        )
        
        self.classification_chain = LLMChain(
            llm=self.llm,
            prompt=self.classification_prompt
        )

    def analyze_claims(self, query: str, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze a list of harvested items to extract and classify claims.
        
        Args:
            query: The main search query or topic
            items: List of harvested items (from PropagationAgent)
            
        Returns:
            List of items with added 'analysis' field containing classification and extracted claim
        """
        logger.info(f"Analyzing claims for query: '{query}' from {len(items)} items...")
        
        analyzed_items = []
        
        for item in items:
            content = item.get("content", "")
            if not content:
                continue
                
            try:
                # Truncate content to avoid token limits if necessary
                truncated_content = content[:1000]
                
                result = self.classification_chain.run(query=query, content=truncated_content)
                
                # Parse JSON response
                try:
                    analysis = json.loads(result)
                except json.JSONDecodeError:
                    # Fallback parsing if LLM returns markdown code block
                    if "```json" in result:
                        json_str = result.split("```json")[1].split("```")[0].strip()
                        analysis = json.loads(json_str)
                    else:
                        # Try to find json-like structure
                        try:
                            import re
                            json_match = re.search(r'\{.*\}', result, re.DOTALL)
                            if json_match:
                                analysis = json.loads(json_match.group(0))
                            else:
                                raise ValueError("No JSON found")
                        except:
                            logger.warning(f"Failed to parse LLM response for item {item.get('id')}")
                            analysis = {
                                "classification": "NEUTRAL",
                                "claim": "Could not extract claim",
                                "reasoning": "Parsing error"
                            }
                
                # Add analysis to the item
                item["analysis"] = analysis
                analyzed_items.append(item)
                
            except Exception as e:
                logger.error(f"Error analyzing item {item.get('id')}: {e}")
                # Keep the item but mark as unanalyzed
                item["analysis"] = {
                    "classification": "NEUTRAL", 
                    "claim": "Error during analysis",
                    "reasoning": str(e)
                }
                analyzed_items.append(item)
                
        return analyzed_items
