#!/usr/bin/env python3
"""
Test content quality from deep research crawler
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Add paths
sys.path.append(str(Path(__file__).parent / 'src' / 'workers'))

# Load environment
from dotenv import load_dotenv
load_dotenv('.env.test')

async def test_content_extraction():
    """Test what content is actually being extracted"""
    
    print("🔍 Testing Content Extraction Quality")
    print("=" * 50)
    
    # Check if we have saved results from previous test
    result_files = list(Path('.').glob('deep_research_test_*.json'))
    
    if not result_files:
        print("❌ No previous test results found. Running a quick crawl...")
        
        from deep_research_crawler import DeepResearchCrawler
        
        api_keys = {
            'google_api_key': os.getenv('GOOGLE_API_KEY'),
            'gemini_key': os.getenv('GOOGLE_API_KEY'),
            'anthropic_key': os.getenv('ANTHROPIC_API_KEY')
        }
        
        crawler = DeepResearchCrawler("mixpanel.com", "buy-and-build", api_keys)
        
        # Just do a very limited crawl
        results = await crawler.conduct_research(max_pages=5)
        
        # Save for analysis
        with open('content_quality_test.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
            
        evidence_items = results.get('evidence_items', [])
    else:
        # Load most recent results
        latest_file = max(result_files, key=lambda p: p.stat().st_mtime)
        print(f"📂 Loading results from: {latest_file}")
        
        with open(latest_file) as f:
            results = json.load(f)
            
        evidence_items = results.get('evidence_items', [])
    
    print(f"\n📊 Found {len(evidence_items)} evidence items")
    
    # Analyze content quality
    print("\n🔍 Content Analysis:")
    print("-" * 50)
    
    content_stats = {
        'empty_content': 0,
        'dict_content': 0,
        'string_content': 0,
        'total_length': 0,
        'avg_length': 0,
        'has_actual_data': 0
    }
    
    for i, item in enumerate(evidence_items[:10]):  # Check first 10
        print(f"\n{i+1}. Evidence Type: {item.get('type')}")
        print(f"   Source: {item.get('source')}")
        print(f"   Confidence: {item.get('confidence', 0):.2f}")
        
        content = item.get('content', {})
        
        if isinstance(content, dict):
            content_stats['dict_content'] += 1
            print(f"   Content Type: Dictionary with keys: {list(content.keys())}")
            
            # Check for actual content
            if 'summary' in content:
                summary = content['summary']
                print(f"   Summary length: {len(summary)} chars")
                print(f"   Summary preview: {summary[:200]}...")
                
                if len(summary) > 100:
                    content_stats['has_actual_data'] += 1
                    
            if 'key_terms' in content:
                print(f"   Key terms: {content['key_terms'][:5]}")
                
            if 'technologies' in content:
                print(f"   Technologies: {content.get('technologies', [])}")
                
            if 'pricing' in content:
                print(f"   Pricing info: {content.get('pricing', [])}")
                
        elif isinstance(content, str):
            content_stats['string_content'] += 1
            content_stats['total_length'] += len(content)
            print(f"   Content Type: String ({len(content)} chars)")
            print(f"   Preview: {content[:200]}...")
            
            if len(content) > 100:
                content_stats['has_actual_data'] += 1
        else:
            content_stats['empty_content'] += 1
            print(f"   Content Type: {type(content).__name__}")
    
    # Summary statistics
    print("\n\n📈 Content Quality Summary:")
    print("-" * 50)
    print(f"Total evidence items: {len(evidence_items)}")
    print(f"Items with actual content: {content_stats['has_actual_data']}")
    print(f"Dictionary content: {content_stats['dict_content']}")
    print(f"String content: {content_stats['string_content']}")
    print(f"Empty content: {content_stats['empty_content']}")
    
    if content_stats['string_content'] > 0:
        content_stats['avg_length'] = content_stats['total_length'] / content_stats['string_content']
        print(f"Average content length: {content_stats['avg_length']:.0f} chars")
    
    # Check for specific evidence types
    print("\n\n🎯 Evidence Type Coverage:")
    print("-" * 50)
    
    evidence_types = {}
    for item in evidence_items:
        etype = item.get('type', 'unknown')
        evidence_types[etype] = evidence_types.get(etype, 0) + 1
    
    for etype, count in sorted(evidence_types.items(), key=lambda x: x[1], reverse=True):
        print(f"{etype}: {count} items")
    
    # Quality assessment
    quality_score = content_stats['has_actual_data'] / len(evidence_items) if evidence_items else 0
    
    print(f"\n\n🏆 Overall Content Quality Score: {quality_score:.1%}")
    
    if quality_score < 0.5:
        print("⚠️  Warning: Low content quality detected!")
        print("   Many items have empty or minimal content")
    elif quality_score < 0.8:
        print("⚠️  Content quality could be improved")
    else:
        print("✅ Good content quality!")
    
    return quality_score > 0.5

async def main():
    """Run content quality test"""
    try:
        success = await test_content_extraction()
        print("\n✅ Test completed!" if success else "\n⚠️  Content quality issues detected")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())