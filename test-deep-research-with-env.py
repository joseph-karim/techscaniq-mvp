#!/usr/bin/env python3
"""Test the deep research crawler with environment variables"""

import asyncio
import json
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load test environment variables
load_dotenv('.env.test')

sys.path.append(str(Path(__file__).parent))

from src.workers.deep_research_crawler import DeepResearchCrawler


async def test_deep_research_with_env():
    """Test deep research on Stripe with more aggressive crawling"""
    
    # Test on Stripe - well-documented company
    domain = 'stripe.com'
    investment_thesis = 'buy-and-build'  # Good for API/integration focus
    scan_request_id = 'test-deep-research-env-001'
    
    print(f"🧪 Testing Deep Research Crawler")
    print(f"🎯 Target: {domain}")
    print(f"💼 Thesis: {investment_thesis}")
    print("="*60)
    
    # Load API keys from environment
    api_keys = {
        'google_api_key': os.getenv('GOOGLE_API_KEY'),
        'anthropic_api_key': os.getenv('ANTHROPIC_API_KEY'),
        'google_cse_id': os.getenv('GOOGLE_CSE_ID')
    }
    
    print(f"🔑 API Keys loaded:")
    print(f"   Google: {'✅' if api_keys['google_api_key'] else '❌'}")
    print(f"   Anthropic: {'✅' if api_keys['anthropic_api_key'] else '❌'}")
    
    crawler = DeepResearchCrawler(domain, investment_thesis, api_keys)
    
    try:
        # Run with higher page target
        results = await crawler.conduct_research(max_pages=150)
        
        print("\n" + "="*60)
        print("📊 DEEP RESEARCH RESULTS")
        print("="*60)
        
        print(f"\n✅ Success: {results.get('success', False)}")
        print(f"📄 Pages crawled: {results['pages_crawled']}")
        print(f"🔍 Evidence items: {results['evidence_count']}")
        print(f"🔄 Research iterations: {results['research_iterations']}")
        
        if results.get('evidence_coverage'):
            coverage = results['evidence_coverage']
            print(f"\n📈 Evidence Coverage:")
            print(f"   Collected ({len(coverage['collected'])}): {', '.join(coverage['collected'][:5])}...")
            print(f"   Missing ({len(coverage['missing'])}): {', '.join(coverage['missing'][:5])}...")
        
        if results.get('key_insights'):
            insights = results['key_insights']
            print(f"\n💡 Key Insights:")
            if 'discovered_technologies' in insights:
                print(f"   Technologies: {', '.join(insights['discovered_technologies'][:10])}")
            if 'discovered_leadership' in insights:
                print(f"   Leadership: {len(insights['discovered_leadership'])} people found")
            if 'discovered_features' in insights:
                print(f"   Features: {', '.join(insights['discovered_features'][:5])}")
        
        if results.get('synthesis'):
            synthesis = results['synthesis']
            print(f"\n📋 Synthesis:")
            print(f"   Completeness: {synthesis.get('evidence_completeness', 0)*100:.0f}%")
            if synthesis.get('recommendations'):
                print(f"   Recommendations: {synthesis['recommendations'][0]}")
        
        # Sample evidence quality check
        print(f"\n🔍 Sample Evidence Items:")
        
        # Look for different types
        evidence_types = {}
        for item in results['evidence_items']:
            etype = item['type']
            if etype not in evidence_types:
                evidence_types[etype] = item
                
        for etype, item in list(evidence_types.items())[:5]:
            print(f"\n   Type: {etype}")
            print(f"   Source: {item['source']}")
            print(f"   Confidence: {item['confidence']}")
            content = item.get('content', {})
            if 'summary' in content:
                summary = content['summary']
                if len(summary) > 150:
                    summary = summary[:150] + "..."
                print(f"   Summary: {summary}")
        
        # Check for external evidence
        external_items = [item for item in results['evidence_items'] if 'external' in str(item.get('source', '')).lower() or item.get('content', {}).get('phase') == 'external_validation']
        print(f"\n🌐 External Evidence: {len(external_items)} items from third-party sources")
        
        # Final verdict
        print(f"\n🎯 Final Assessment:")
        if results['pages_crawled'] >= 100:
            print(f"   ✅ Excellent crawl depth: {results['pages_crawled']} pages")
        elif results['pages_crawled'] >= 50:
            print(f"   ✅ Good crawl depth: {results['pages_crawled']} pages")
        else:
            print(f"   ⚠️  Limited crawl depth: {results['pages_crawled']} pages")
            
        if results['evidence_count'] >= 100:
            print(f"   ✅ Rich evidence collection: {results['evidence_count']} items")
        elif results['evidence_count'] >= 50:
            print(f"   ✅ Good evidence collection: {results['evidence_count']} items")
        else:
            print(f"   ⚠️  Limited evidence: {results['evidence_count']} items")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == "__main__":
    success = asyncio.run(test_deep_research_with_env())
    sys.exit(0 if success else 1)