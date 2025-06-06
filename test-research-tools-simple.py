#!/usr/bin/env python3
"""
Simple test of research tools without orchestration
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Add the workers directory to path
sys.path.append(str(Path(__file__).parent / 'src' / 'workers'))

from research_tools import ResearchTools

async def test_simple_search():
    """Test just the search functionality"""
    
    print("🔍 Testing Simple Search Tool")
    print("=" * 50)
    
    # Load API keys
    api_keys = {
        'google_api_key': os.getenv('GOOGLE_API_KEY'),
    }
    
    if not api_keys['google_api_key']:
        print("❌ No Google API key found")
        print("Loading from .env.test...")
        from dotenv import load_dotenv
        load_dotenv('.env.test')
        api_keys['google_api_key'] = os.getenv('GOOGLE_API_KEY')
    
    tools = ResearchTools(api_keys)
    
    # Test search
    print("\n📊 Testing Mixpanel search...")
    result = await tools.web_search({
        'query': '"Mixpanel" API platform analytics',
        'search_type': 'technical'
    }, None)
    
    print(f"\nResults: {len(result.get('results', []))} found")
    
    # Show results
    for i, r in enumerate(result.get('results', [])[:3]):
        print(f"\n{i+1}. {r.get('title', 'No title')}")
        print(f"   URL: {r.get('url', 'No URL')}")
        print(f"   Snippet: {r.get('snippet', 'No snippet')[:150]}...")
    
    # Test security scanner
    print("\n\n🔒 Testing Security Scanner...")
    security_result = await tools.security_scanner({
        'domain': 'mixpanel.com'
    }, None)
    
    print(f"Security Score: {security_result.get('security_score', 0):.2f}")
    print(f"Headers checked: {len(security_result.get('security_headers', {}))}")
    
    # Show security headers
    for header, info in security_result.get('security_headers', {}).items():
        status = "✅" if info.get('present') else "❌"
        print(f"  {status} {header}")
    
    # Check compliance
    print("\nCompliance Indicators:")
    for indicator, found in security_result.get('compliance_indicators', {}).items():
        status = "✅" if found else "❌"
        print(f"  {status} {indicator}")
    
    return True

async def main():
    """Run simple test"""
    try:
        success = await test_simple_search()
        print("\n✅ Test completed successfully!" if success else "\n❌ Test failed!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())