"""
Main application for the Fake News Detection Multi-Agent System.
"""
import os
import argparse
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

from agents.orchestrator import OrchestratorAgent
from utils.helpers import fetch_article_content

def load_article_from_file(file_path: str) -> str:
    """
    Load article text from a file.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Article text as a string
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def save_results_to_file(results: Dict[str, Any], output_file: str) -> None:
    """
    Save results to a JSON file.
    
    Args:
        results: Results dictionary
        output_file: Path to the output file
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {output_file}")

def print_summary(results: Dict[str, Any]) -> None:
    """
    Print a summary of the results to the console.
    
    Args:
        results: Results dictionary
    """
    print("\n" + "="*50)
    print("FAKE NEWS DETECTION SUMMARY")
    print("="*50)
    
    print(f"\nArticle: {results.get('article_metadata', {}).get('title', 'Unknown')}")
    print(f"Source: {results.get('article_metadata', {}).get('source', 'Unknown')}")
    print(f"Date: {results.get('article_metadata', {}).get('date', 'Unknown')}")
    
    print(f"\nAuthenticity Score: {results.get('authenticity_score', 0):.2f}")
    print(f"Category: {results.get('authenticity_category', 'Unknown')}")
    
    print("\nDetailed Scores:")
    detailed_scores = results.get('detailed_scores', {})
    for category, info in detailed_scores.items():
        print(f"  - {category.replace('_', ' ').title()}: {info.get('score', 0):.2f}")
    
    print("\nKey Claims:")
    for i, claim in enumerate(results.get('key_claims', []), 1):
        print(f"  {i}. {claim.get('claim', '')}")
    
    print("\nSupporting Evidence:")
    for i, evidence in enumerate(results.get('supporting_evidence', []), 1):
        print(f"  {i}. {evidence.get('title', 'Unknown')} ({evidence.get('source', 'Unknown')})")
        print(f"     Relevance: {evidence.get('relevance_score', 0):.2f}")
    
    print("\nReport Summary:")
    report_lines = results.get('report', '').split('\n')[:5]
    for line in report_lines:
        print(f"  {line.strip()}")
    print("  ...")
    
    print("\nFor full details, check the saved JSON file.")
    print("="*50)

def main() -> None:
    """Main function to run the fake news detection system."""
    # Load environment variables
    load_dotenv()
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Fake News Detection Multi-Agent System')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--text', type=str, help='News article text to analyze')
    group.add_argument('--file', type=str, help='Path to a file containing news article text')
    group.add_argument('--url', type=str, help='URL of a news article to analyze')
    
    parser.add_argument('--source', type=str, help='Source of the article', default='Unknown')
    parser.add_argument('--title', type=str, help='Title of the article', default='Unknown')
    parser.add_argument('--date', type=str, help='Date of the article', default='Unknown')
    parser.add_argument('--output', type=str, help='Output file for results', default='results.json')
    
    args = parser.parse_args()
    
    # Get the article text
    article_text = ""
    if args.text:
        article_text = args.text
    elif args.file:
        article_text = load_article_from_file(args.file)
    elif args.url:
        content = fetch_article_content(args.url)
        if content:
            article_text = content
        else:
            print(f"Error: Could not fetch content from {args.url}")
            return
    
    # Prepare article metadata
    article_metadata = {
        "source": args.source,
        "title": args.title,
        "date": args.date,
        "url": args.url if args.url else None
    }
    
    # Initialize the orchestrator agent
    orchestrator = OrchestratorAgent()
    
    # Process the article
    print("Processing article...")
    results = orchestrator.process_article(article_text, article_metadata)
    
    # Save results to file
    save_results_to_file(results, args.output)
    
    # Print summary
    print_summary(results)

if __name__ == "__main__":
    main()
