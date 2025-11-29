import os
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnableSequence
from dotenv import load_dotenv

load_dotenv()

class VerdictAgent:
    """
    Determines the final verdict of a claim by comparing evidence from 
    'related' sources (official/close associates) vs. 'general' sources (public/media).
    """

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.llm = ChatOpenAI(temperature=0, model="gpt-4o", api_key=self.api_key)

    def determine_verdict(self, query: str, analyzed_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes claims by comparing Instagram (related) sources against general sources.
        
        Args:
            query: The original claim/query being investigated.
            analyzed_items: List of items with 'classification', 'reasoning', and 'source_type'.
            
        Returns:
            Dict containing 'verdict', 'confidence', and 'explanation'.
        """
        
        # 1. Separate evidence by source type
        instagram_evidence = [item for item in analyzed_items if item.get('source_type') == 'related']
        general_evidence = [item for item in analyzed_items if item.get('source_type') == 'general']
        
        # 2. Count classifications for each group
        def count_classifications(items):
            support = sum(1 for item in items if item.get('classification') == 'SUPPORT')
            contradict = sum(1 for item in items if item.get('classification') == 'CONTRADICT')
            return support, contradict
        
        insta_support, insta_contradict = count_classifications(instagram_evidence)
        general_support, general_contradict = count_classifications(general_evidence)
        
        # 3. Determine Instagram stance
        if len(instagram_evidence) == 0:
            instagram_stance = "SILENT"
        elif insta_support > insta_contradict:
            instagram_stance = "SUPPORTS_CLAIM"
        elif insta_contradict > insta_support:
            instagram_stance = "CONTRADICTS_CLAIM"
        else:
            instagram_stance = "MIXED"
        
        # 4. Determine General stance
        if len(general_evidence) == 0:
            general_stance = "SILENT"
        elif general_support > general_contradict:
            general_stance = "SUPPORTS_CLAIM"
        elif general_contradict > general_support:
            general_stance = "CONTRADICTS_CLAIM"
        else:
            general_stance = "MIXED"
        
        # 5. Apply comparison logic
        if instagram_stance == "SILENT":
            # No Instagram evidence - rely on general consensus
            if general_stance == "SUPPORTS_CLAIM":
                verdict = "LIKELY TRUE"
                confidence = min(0.7, general_support / (general_support + general_contradict + 1))
                explanation = f"No official sources found. Based on general evidence: {general_support} supporting vs {general_contradict} contradicting claims suggest this is likely true."
            elif general_stance == "CONTRADICTS_CLAIM":
                verdict = "LIKELY FALSE"
                confidence = min(0.7, general_contradict / (general_support + general_contradict + 1))
                explanation = f"No official sources found. Based on general evidence: {general_contradict} contradicting vs {general_support} supporting claims suggest this is likely false."
            else:
                verdict = "UNVERIFIED"
                confidence = 0.5
                explanation = "No official sources found and general evidence is inconclusive or mixed."
        
        elif instagram_stance == "SUPPORTS_CLAIM":
            # Instagram supports the claim
            if general_stance == "SUPPORTS_CLAIM":
                verdict = "TRUE"
                confidence = 0.95
                explanation = f"Official Instagram sources ({insta_support} posts) SUPPORT the claim, and this MATCHES general evidence ({general_support} supporting vs {general_contradict} contradicting). High confidence verdict: TRUE."
            elif general_stance == "CONTRADICTS_CLAIM":
                verdict = "TRUE"
                confidence = 0.85
                explanation = f"Official Instagram sources ({insta_support} posts) SUPPORT the claim, but general sources CONTRADICT it ({general_contradict} vs {general_support}). Trusting official sources over public noise. Verdict: TRUE."
            else:
                verdict = "TRUE"
                confidence = 0.8
                explanation = f"Official Instagram sources ({insta_support} posts) SUPPORT the claim. General evidence is mixed/unclear. Trusting official sources. Verdict: TRUE."
        
        elif instagram_stance == "CONTRADICTS_CLAIM":
            # Instagram contradicts the claim
            if general_stance == "CONTRADICTS_CLAIM":
                verdict = "FALSE"
                confidence = 0.95
                explanation = f"Official Instagram sources ({insta_contradict} posts) CONTRADICT the claim, and this MATCHES general evidence ({general_contradict} contradicting vs {general_support} supporting). High confidence verdict: FALSE."
            elif general_stance == "SUPPORTS_CLAIM":
                verdict = "FALSE"
                confidence = 0.85
                explanation = f"Official Instagram sources ({insta_contradict} posts) CONTRADICT the claim, but general sources support it ({general_support} vs {general_contradict}). This is likely misinformation/rumor. Trusting official sources. Verdict: FALSE."
            else:
                verdict = "FALSE"
                confidence = 0.8
                explanation = f"Official Instagram sources ({insta_contradict} posts) CONTRADICT the claim. General evidence is mixed/unclear. Trusting official sources. Verdict: FALSE."
        
        else:  # MIXED
            verdict = "UNVERIFIED"
            confidence = 0.5
            explanation = f"Official Instagram sources are mixed ({insta_support} support, {insta_contradict} contradict). Cannot determine clear verdict."
        
        return {
            "verdict": verdict,
            "confidence": confidence,
            "explanation": explanation,
            "evidence_summary": {
                "instagram": {
                    "support": insta_support,
                    "contradict": insta_contradict,
                    "stance": instagram_stance
                },
                "general": {
                    "support": general_support,
                    "contradict": general_contradict,
                    "stance": general_stance
                }
            }
        }
