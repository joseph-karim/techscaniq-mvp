#!/usr/bin/env python3
"""Test the deep research crawler with simulated API keys"""

import asyncio
import json
import sys
import os
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from src.workers.deep_research_crawler import DeepResearchCrawler


async def test_deep_research_full():
    """Test deep research crawler with all features"""
    
    # Test on real company
    domain = 'stripe.com'  # Well-documented company with lots of public info
    investment_thesis = 'accelerate-organic-growth'
    scan_request_id = 'test-deep-research-full-001'
    
    print(f"🧪 Testing Deep Research Crawler with External Validation")
    print(f"🎯 Target: {domain}")
    print(f"💼 Thesis: {investment_thesis}")
    print("="*60)
    
    # Note: In production, these come from Supabase vault
    # For testing, you need to set environment variables or use test keys
    api_keys = {
        'google_api_key': os.getenv('GOOGLE_API_KEY') or 'test-key-not-real',
        'anthropic_api_key': os.getenv('ANTHROPIC_API_KEY') or 'test-key-not-real',
        'google_cse_id': os.getenv('GOOGLE_CSE_ID') or 'test-cse-id'
    }
    
    if api_keys['google_api_key'] == 'test-key-not-real':
        print("⚠️  Note: Using test API keys - external search will be skipped")
        print("   Set GOOGLE_API_KEY env var for full testing")
    
    crawler = DeepResearchCrawler(domain, investment_thesis, api_keys)
    
    try:
        # Run with higher page limit
        results = await crawler.conduct_research(max_pages=100)
        
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
            print(f"   Collected ({len(coverage['collected'])}): {', '.join(coverage['collected'])}")
            print(f"   Missing ({len(coverage['missing'])}): {', '.join(coverage['missing'])}")
            completeness = len(coverage['collected']) / (len(coverage['collected']) + len(coverage['missing'])) * 100
            print(f"   Completeness: {completeness:.1f}%")
        
        if results.get('key_insights'):
            insights = results['key_insights']
            print(f"\n💡 Key Insights:")
            if 'discovered_technologies' in insights:
                print(f"   Technologies ({len(insights['discovered_technologies'])}): {', '.join(insights['discovered_technologies'][:10])}")
            if 'discovered_leadership' in insights:
                print(f"   Leadership: {', '.join(insights['discovered_leadership'][:5])}")
            if 'discovered_features' in insights:
                print(f"   Key Features: {', '.join(insights['discovered_features'][:5])}")
        
        # Evidence quality analysis
        print(f"\n📊 Evidence Quality Analysis:")
        
        # Group by type
        evidence_by_type = {}
        for item in results['evidence_items']:
            etype = item['type']
            if etype not in evidence_by_type:
                evidence_by_type[etype] = []
            evidence_by_type[etype].append(item)
        
        for etype, items in evidence_by_type.items():
            avg_confidence = sum(item['confidence'] for item in items) / len(items)
            print(f"   {etype}: {len(items)} items (avg confidence: {avg_confidence:.2f})")
        
        # Check for external evidence
        external_items = [
            item for item in results['evidence_items'] 
            if 'external' in str(item.get('source', '')).lower() 
            or item.get('content', {}).get('phase') == 'external_validation'
            or item.get('content', {}).get('metadata', {}).get('source_type') == 'external'
        ]
        print(f"\n🌐 External Evidence: {len(external_items)} items from third-party sources")
        
        if external_items:
            print("   Sample external sources:")
            for item in external_items[:5]:
                source = item['source']
                if 'techcrunch' in source:
                    print(f"   - TechCrunch article")
                elif 'reddit' in source:
                    print(f"   - Reddit discussion")
                elif 'github' in source:
                    print(f"   - GitHub repository")
                else:
                    print(f"   - {source[:50]}...")
        
        # Synthesis quality
        if results.get('synthesis'):
            synthesis = results['synthesis']
            print(f"\n📋 Investment Thesis Synthesis:")
            print(f"   Thesis: {synthesis['investment_thesis']}")
            print(f"   Evidence Completeness: {synthesis['evidence_completeness']*100:.0f}%")
            
            if synthesis.get('key_findings'):
                print(f"\n   Key Findings:")
                for evidence_type, finding in synthesis['key_findings'].items():
                    if finding['found']:
                        print(f"   ✓ {evidence_type}: {finding['sources']} sources (quality: {finding['quality']:.2f})")
                    else:
                        print(f"   ✗ {evidence_type}: Not found")
            
            if synthesis.get('recommendations'):
                print(f"\n   Recommendations:")
                for rec in synthesis['recommendations']:
                    print(f"   - {rec}")
        
        # Final assessment
        print(f"\n🎯 Final Assessment:")
        if results['pages_crawled'] >= 100:
            print(f"   ✅ Achieved target crawl depth ({results['pages_crawled']} pages)")
        else:
            print(f"   ⚠️  Below target crawl depth ({results['pages_crawled']}/100+ pages)")
        
        if results['evidence_count'] >= 100:
            print(f"   ✅ Collected substantial evidence ({results['evidence_count']} items)")
        else:
            print(f"   ⚠️  Limited evidence collected ({results['evidence_count']}/100+ items)")
        
        if len(external_items) > 0:
            print(f"   ✅ External validation performed ({len(external_items)} sources)")
        else:
            print(f"   ❌ No external validation (API key required)")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_deep_research_full())
    sys.exit(0 if success else 1)