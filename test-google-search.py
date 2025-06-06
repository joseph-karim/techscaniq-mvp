#!/usr/bin/env python3
"""Test Google Search API is working properly"""

import asyncio
import aiohttp
import os
from dotenv import load_dotenv

# Load test environment variables
load_dotenv('.env.test')

async def test_google_search():
    """Test Google Custom Search API"""
    
    google_api_key = os.getenv('GOOGLE_API_KEY')
    cse_id = os.getenv('GOOGLE_CSE_ID', '017576662512468239146:omuauf_lfve')
    
    print(f"🔍 Testing Google Search API")
    print(f"API Key: {google_api_key[:10]}..." if google_api_key else "No API key found")
    print(f"CSE ID: {cse_id}")
    print("="*60)
    
    if not google_api_key:
        print("❌ No Google API key found!")
        return False
    
    # Test queries
    test_queries = [
        '"mixpanel" revenue growth funding',
        '"stripe" engineering blog',
        'site:techcrunch.com "datadog"'
    ]
    
    for query in test_queries:
        print(f"\n🔎 Testing query: {query}")
        
        try:
            search_url = "https://www.googleapis.com/customsearch/v1"
            params = {
                'key': google_api_key,
                'cx': cse_id,
                'q': query,
                'num': 5
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(search_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if 'items' in data:
                            print(f"✅ Found {len(data['items'])} results:")
                            for i, item in enumerate(data['items'][:3], 1):
                                print(f"   {i}. {item.get('title', 'No title')}")
                                print(f"      {item.get('link', '')}")
                        else:
                            print("⚠️ No results found")
                    else:
                        error_data = await response.text()
                        print(f"❌ API Error {response.status}: {error_data}")
                        
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return False
    
    print("\n✅ Google Search API is working!")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_google_search())
    exit(0 if success else 1)