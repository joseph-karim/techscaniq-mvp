#!/usr/bin/env python3
"""Test Gemini Search with Google grounding"""

import asyncio
import aiohttp
import os
import json
from dotenv import load_dotenv

# Load test environment variables
load_dotenv('.env.test')

async def test_gemini_search():
    """Test Gemini 2.0 Flash with Google Search grounding"""
    
    google_api_key = os.getenv('GOOGLE_API_KEY')
    
    print(f"🔍 Testing Gemini Search with Google grounding")
    print(f"API Key: {google_api_key[:10]}..." if google_api_key else "No API key found")
    print("="*60)
    
    if not google_api_key:
        print("❌ No Google API key found!")
        return False
    
    # Test queries - similar to what the deep research would use
    test_queries = [
        '"mixpanel" revenue growth funding',
        '"stripe" engineering blog technical architecture',
        'site:techcrunch.com "datadog" funding news'
    ]
    
    for query in test_queries:
        print(f"\n🔎 Testing query: {query}")
        
        try:
            request_body = {
                'contents': [{
                    'parts': [{
                        'text': query
                    }]
                }],
                'tools': [{
                    'googleSearch': {}
                }],
                'generationConfig': {
                    'temperature': 0.1,
                    'topK': 32,
                    'topP': 1,
                    'maxOutputTokens': 8192,
                    'responseMimeType': 'text/plain'
                }
            }
            
            gemini_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    gemini_url,
                    json=request_body,
                    headers={
                        'Content-Type': 'application/json',
                        'x-goog-api-key': google_api_key
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Extract content
                        content = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                        
                        print(f"✅ Response received ({len(content)} chars)")
                        print(f"📝 Content preview: {content[:300]}...")
                        
                        # Check for grounding metadata
                        grounding_metadata = data.get('candidates', [{}])[0].get('groundingMetadata', {})
                        if grounding_metadata:
                            print(f"🔗 Has grounding metadata: Yes")
                            if 'groundingSupports' in grounding_metadata:
                                print(f"   - Grounding supports: {len(grounding_metadata['groundingSupports'])}")
                        
                        # Extract URLs from content
                        import re
                        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]\'()]+'
                        found_urls = re.findall(url_pattern, content)
                        unique_urls = list(set(found_urls))
                        
                        if unique_urls:
                            print(f"🌐 Found {len(unique_urls)} URLs:")
                            for url in unique_urls[:5]:
                                print(f"   - {url}")
                        else:
                            print("⚠️ No URLs found in content")
                            
                    else:
                        error_data = await response.text()
                        print(f"❌ Gemini API Error {response.status}: {error_data}")
                        
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return False
    
    print("\n✅ Gemini Search with Google grounding is working!")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_gemini_search())
    exit(0 if success else 1)