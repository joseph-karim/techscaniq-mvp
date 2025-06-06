#!/usr/bin/env python3
"""Test Gemini grounding metadata extraction"""

import asyncio
import aiohttp
import os
import json
from dotenv import load_dotenv

# Load test environment variables
load_dotenv('.env.test')

async def test_gemini_grounding():
    """Test extracting URLs from Gemini grounding metadata"""
    
    google_api_key = os.getenv('GOOGLE_API_KEY')
    
    if not google_api_key:
        print("❌ No Google API key found!")
        return False
    
    query = '"stripe" API documentation developer resources'
    print(f"🔎 Testing query: {query}")
    
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
                    
                    # Pretty print the full response to understand structure
                    print("\n📋 Full Response Structure:")
                    print(json.dumps(data, indent=2)[:2000] + "...")
                    
                    # Look for grounding metadata
                    candidates = data.get('candidates', [])
                    if candidates:
                        candidate = candidates[0]
                        grounding_metadata = candidate.get('groundingMetadata', {})
                        
                        print(f"\n🔗 Grounding Metadata Keys: {list(grounding_metadata.keys())}")
                        
                        # Check different possible locations for URLs
                        if 'webSearchQueries' in grounding_metadata:
                            print(f"\n🔍 Web Search Queries:")
                            for q in grounding_metadata['webSearchQueries']:
                                print(f"   - {q}")
                        
                        if 'groundingSupports' in grounding_metadata:
                            print(f"\n📄 Grounding Supports ({len(grounding_metadata['groundingSupports'])}):")
                            for i, support in enumerate(grounding_metadata['groundingSupports'][:3]):
                                print(f"\n   Support {i+1}:")
                                print(f"   Keys: {list(support.keys())}")
                                if 'segment' in support:
                                    print(f"   Segment text: {support['segment'].get('text', '')[:200]}...")
                        
                        if 'searchEntryPoint' in grounding_metadata:
                            print(f"\n🌐 Search Entry Point:")
                            entry = grounding_metadata['searchEntryPoint']
                            print(f"   Keys: {list(entry.keys())}")
                            if 'renderedContent' in entry:
                                print(f"   Rendered content: {entry['renderedContent'][:200]}...")
                        
                        # Look for chunks which might contain URLs
                        if 'groundingChunks' in grounding_metadata:
                            print(f"\n📦 Grounding Chunks ({len(grounding_metadata['groundingChunks'])}):")
                            for i, chunk in enumerate(grounding_metadata['groundingChunks'][:3]):
                                print(f"\n   Chunk {i+1}:")
                                if 'web' in chunk:
                                    web_info = chunk['web']
                                    print(f"   URL: {web_info.get('uri', 'No URI')}")
                                    print(f"   Title: {web_info.get('title', 'No title')}")
                    
                    return True
                    
                else:
                    error_data = await response.text()
                    print(f"❌ Error: {error_data}")
                    return False
                    
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_gemini_grounding())
    exit(0 if success else 1)