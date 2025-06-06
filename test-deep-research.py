#!/usr/bin/env python3
"""Test the deep research crawler independently"""

import asyncio
import json
import sys
import os
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from src.workers.deep_research_crawler import DeepResearchCrawler


async def test_deep_research():
    """Test deep research on Mixpanel"""
    
    # Test on Mixpanel
    domain = 'mixpanel.com'
    investment_thesis = 'accelerate-organic-growth'
    scan_request_id = 'test-deep-research-001'
    
    print(f"🧪 Testing Deep Research Crawler")
    print(f"🎯 Target: {domain}")
    print(f"💼 Thesis: {investment_thesis}")
    print("="*60)
    
    # Simulate API keys for testing (in production these come from Supabase vault)
    api_keys = {
        'google_api_key': os.getenv('GOOGLE_API_KEY'),
        'anthropic_api_key': os.getenv('ANTHROPIC_API_KEY'),
        'google_cse_id': os.getenv('GOOGLE_CSE_ID')
    }
    
    crawler = DeepResearchCrawler(domain, investment_thesis, api_keys)
    
    try:
        # Run with limited pages for testing
        results = await crawler.conduct_research(max_pages=50)
        
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
        
        # Sample evidence quality
        print(f"\n🔍 Sample Evidence Items:")
        for i, item in enumerate(results['evidence_items'][:5], 1):
            print(f"\n   Item {i}:")
            print(f"   Type: {item['type']}")
            print(f"   Source: {item['source']}")
            print(f"   Confidence: {item['confidence']}")
            content = item.get('content', {})
            if 'summary' in content:
                print(f"   Summary: {content['summary'][:100]}...")
        
        # Check for external evidence
        external_items = [item for item in results['evidence_items'] if 'external' in str(item.get('source', '')).lower() or item.get('content', {}).get('phase') == 'external_validation']
        print(f"\n🌐 External Evidence: {len(external_items)} items from third-party sources")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == "__main__":
    success = asyncio.run(test_deep_research())
    sys.exit(0 if success else 1)