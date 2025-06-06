#!/usr/bin/env python3
"""
Test deep research crawler in simple mode
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

async def test_deep_research():
    """Test the deep research crawler"""
    
    print("🔬 Testing Deep Research Crawler")
    print("=" * 50)
    
    # Import the crawler
    from deep_research_crawler import DeepResearchCrawler
    
    # Configuration
    domain = "mixpanel.com"
    thesis = "buy-and-build"
    
    # API keys
    api_keys = {
        'google_api_key': os.getenv('GOOGLE_API_KEY'),
        'gemini_key': os.getenv('GOOGLE_API_KEY'),
        'anthropic_key': os.getenv('ANTHROPIC_API_KEY')
    }
    
    print(f"\n🎯 Target: {domain}")
    print(f"📊 Thesis: {thesis}")
    print(f"🔑 API keys loaded: {list(api_keys.keys())}")
    
    # Create crawler
    crawler = DeepResearchCrawler(domain, thesis, api_keys)
    
    # Run limited research
    print("\n🚀 Starting research (limited to 20 pages for testing)...")
    
    try:
        results = await crawler.conduct_research(max_pages=20)
        
        print("\n📋 Results Summary:")
        print(f"✅ Success: {results['success']}")
        print(f"📄 Pages crawled: {results['pages_crawled']}")
        print(f"🔍 Evidence items: {results['evidence_count']}")
        print(f"🔄 Research iterations: {results['research_iterations']}")
        
        print("\n📊 Evidence Coverage:")
        coverage = results['evidence_coverage']
        print(f"✅ Collected: {', '.join(coverage['collected'][:5])}...")
        print(f"❌ Missing: {', '.join(coverage['missing'][:5])}...")
        
        print("\n💡 Key Insights:")
        insights = results.get('key_insights', {})
        if insights.get('discovered_technologies'):
            print(f"🔧 Technologies: {', '.join(insights['discovered_technologies'][:5])}...")
        if insights.get('competitors'):
            print(f"🏢 Competitors: {', '.join(insights['competitors'][:3])}")
        
        print("\n📝 Sample Evidence Items:")
        for i, item in enumerate(results['evidence_items'][:3]):
            print(f"\n{i+1}. Type: {item['type']} | Confidence: {item['confidence']:.2f}")
            print(f"   Source: {item['source']}")
            if isinstance(item['content'], dict):
                print(f"   Content keys: {list(item['content'].keys())}")
        
        # Save results
        output_file = f"deep_research_test_{domain.replace('.', '_')}.json"
        with open(output_file, 'w') as f:
            # Limit size for saving
            save_data = results.copy()
            save_data['evidence_items'] = save_data['evidence_items'][:10]  # Just save first 10
            json.dump(save_data, f, indent=2, default=str)
        print(f"\n💾 Results saved to: {output_file}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Research failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run test"""
    success = await test_deep_research()
    print("\n✅ Test completed!" if success else "\n❌ Test failed!")

if __name__ == "__main__":
    asyncio.run(main())