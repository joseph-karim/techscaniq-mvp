#!/usr/bin/env python3
"""Test script to examine actual evidence content quality"""

import asyncio
import json
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent))

from src.workers.crawl4ai_simple_crawler import SimpleDeepEvidenceCollector

async def test_and_review_content():
    """Test crawler and review actual content quality"""
    
    collector = SimpleDeepEvidenceCollector('mixpanel.com', 'accelerate-organic-growth')
    
    # Run collection with limited pages for testing
    results = await collector.collect_evidence(max_pages=15)
    
    print("\n" + "="*60)
    print("📊 EVIDENCE CONTENT QUALITY REVIEW")
    print("="*60)
    
    print(f"\n📈 Summary:")
    print(f"  - Total evidence items: {results['evidence_count']}")
    print(f"  - Pages crawled: {results['pages_crawled']}")
    print(f"  - Evidence types: {results['evidence_types']}")
    
    print(f"\n🔗 Discovered URLs:")
    print(f"  - Total discovered: {len(collector.discovered_urls)}")
    if collector.discovered_urls:
        print("  - Sample URLs:")
        for url in collector.discovered_urls[:10]:
            print(f"    {url}")
    
    print(f"\n📋 Detailed Evidence Review:")
    
    for i, item in enumerate(results['evidence_items'][:10], 1):  # Review first 10
        print(f"\n--- Evidence Item {i} ---")
        print(f"Type: {item['type']}")
        print(f"Source: {item['source']}")
        print(f"Confidence: {item['confidence']}")
        
        content = item.get('content', {})
        print(f"Title: {content.get('title', 'No title')}")
        print(f"Summary: {content.get('summary', 'No summary')}")
        
        # Check actual extracted data
        extracted_data = content.get('extracted_data', {})
        technical_details = content.get('technical_details', {})
        
        if extracted_data:
            print(f"Extracted Data:")
            for key, value in extracted_data.items():
                if isinstance(value, list):
                    print(f"  {key}: {len(value)} items - {value[:3] if value else 'empty'}")
                elif isinstance(value, dict):
                    print(f"  {key}: {json.dumps(value, indent=2)[:200]}...")
                else:
                    print(f"  {key}: {value}")
                    
        if technical_details:
            print(f"Technical Details:")
            for key, value in technical_details.items():
                if isinstance(value, dict):
                    print(f"  {key}: {len(value)} categories")
                    for cat, items in value.items():
                        if items:
                            print(f"    - {cat}: {items[:3]}")
                else:
                    print(f"  {key}: {value}")
    
    # Analyze content quality
    print("\n" + "="*60)
    print("🎯 CONTENT QUALITY ANALYSIS")
    print("="*60)
    
    # Check for actual meaningful content
    meaningful_count = 0
    empty_count = 0
    
    for item in results['evidence_items']:
        content = item.get('content', {})
        extracted_data = content.get('extracted_data', {})
        technical_details = content.get('technical_details', {})
        
        # Check if we have substantial data
        has_data = False
        if extracted_data:
            for key, value in extracted_data.items():
                if isinstance(value, list) and len(value) > 0:
                    has_data = True
                elif isinstance(value, dict) and len(value) > 0:
                    has_data = True
                elif isinstance(value, str) and len(value) > 10:
                    has_data = True
                    
        if technical_details and technical_details.get('technologies'):
            has_data = True
            
        if has_data:
            meaningful_count += 1
        else:
            empty_count += 1
    
    print(f"\n📊 Content Substance:")
    print(f"  - Meaningful content: {meaningful_count}/{len(results['evidence_items'])} items")
    print(f"  - Empty/generic content: {empty_count}/{len(results['evidence_items'])} items")
    
    quality_ratio = meaningful_count / len(results['evidence_items']) if results['evidence_items'] else 0
    
    if quality_ratio < 0.3:
        print("\n❌ POOR QUALITY: Most evidence lacks substantial content")
    elif quality_ratio < 0.6:
        print("\n⚠️ MARGINAL QUALITY: Many items lack meaningful data")
    else:
        print("\n✅ GOOD QUALITY: Most evidence contains substantial content")
    
    # Check specific extraction quality
    print("\n🔍 Extraction Quality Check:")
    
    # Check pricing extraction
    pricing_items = [item for item in results['evidence_items'] if item['type'] == 'financial_info']
    if pricing_items:
        print(f"\n💰 Pricing Information ({len(pricing_items)} items):")
        for item in pricing_items:
            data = item['content'].get('extracted_data', {})
            if 'pricing_tiers' in data:
                print(f"  - Found {len(data['pricing_tiers'])} pricing tiers: {data['pricing_tiers']}")
            else:
                print(f"  - No pricing data extracted from {item['source']}")
    
    # Check technology extraction
    tech_items = [item for item in results['evidence_items'] if item['type'] == 'technology_stack']
    if tech_items:
        print(f"\n🔧 Technology Stack ({len(tech_items)} items):")
        for item in tech_items:
            details = item['content'].get('technical_details', {})
            if details.get('technologies'):
                total_tech = sum(len(techs) for techs in details['technologies'].values())
                print(f"  - Found {total_tech} technologies across {len(details['technologies'])} categories")
                for cat, techs in details['technologies'].items():
                    if techs:
                        print(f"    {cat}: {', '.join(techs[:5])}")
            else:
                print(f"  - No technologies extracted from {item['source']}")
    
    return results

if __name__ == "__main__":
    results = asyncio.run(test_and_review_content())