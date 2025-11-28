"""
Example script demonstrating how to use the Fake News Detection Multi-Agent System.
"""
from agents.orchestrator import OrchestratorAgent
import json

def run_example():
    """Run an example of the fake news detection system."""
    print("Fake News Detection System - Example Run")
    print("-" * 50)
    
    # Load the sample article
    with open('sample_article.txt', 'r', encoding='utf-8') as f:
        article_text = f.read()
    
    # Set up article metadata
    article_metadata = {
        "source": "Unknown Blog",
        "title": "Scientists Discover Miracle Cure for All Diseases",
        "date": "2025-05-10"
    }
    
    # Print article summary
    print(f"Analyzing article: {article_metadata['title']}")
    print(f"Source: {article_metadata['source']}")
    print(f"Date: {article_metadata['date']}")
    print("-" * 50)
    print("Article excerpt:")
    print(article_text[:300] + "...\n")
    
    # Initialize the orchestrator agent
    print("Initializing agents...")
    orchestrator = OrchestratorAgent()
    
    # Process the article
    print("Processing article with multi-agent system...\n")
    results = orchestrator.process_article(article_text, article_metadata)
    
    # Print the results
    print("\nResults:")
    print(f"Authenticity Score: {results['authenticity_score']:.2f}")
    print(f"Category: {results['authenticity_category']}")
    
    print("\nDetailed Scores:")
    for category, details in results['detailed_scores'].items():
        print(f"  - {category.replace('_', ' ').title()}: {details['score']:.2f}")
    
    print("\nKey Claims Identified:")
    for i, claim in enumerate(results['key_claims'], 1):
        print(f"  {i}. {claim['claim']}")
    
    print("\nTop Supporting Evidence:")
    for i, evidence in enumerate(results['supporting_evidence'], 1):
        print(f"  {i}. {evidence['title']} ({evidence['source']})")
        print(f"     Relevance: {evidence['relevance_score']:.2f}")
    
    # Save the full results to a file
    with open('example_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print("\nFull results saved to 'example_results.json'")
    print("\nReport Summary:")
    print("-" * 50)
    print(results['report'][:500] + "...")
    print("-" * 50)

if __name__ == "__main__":
    run_example()
