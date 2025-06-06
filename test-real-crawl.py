#!/usr/bin/env python3
"""Test real URL discovery from Mixpanel"""

import asyncio
from crawl4ai import AsyncWebCrawler

async def test_real_discovery():
    """See what URLs actually exist on Mixpanel"""
    
    async with AsyncWebCrawler(
        headless=True,
        browser_type="chromium"
    ) as crawler:
        
        # Crawl the homepage
        print("🔍 Crawling Mixpanel homepage...")
        result = await crawler.arun(url="https://mixpanel.com")
        
        if result.success:
            print(f"✅ Success! Found {len(result.links.get('internal', []))} internal links")
            
            # Show what links actually exist
            internal_links = result.links.get('internal', [])
            
            print("\n📍 ACTUAL URLs found on Mixpanel.com:")
            
            # Group by path patterns
            product_links = []
            doc_links = []
            company_links = []
            other_links = []
            
            for link in internal_links:
                # Extract URL from dict or string
                url = link if isinstance(link, str) else link.get('href', '') if isinstance(link, dict) else ''
                
                if '/product' in url:
                    product_links.append(url)
                elif '/docs' in url or '/developer' in url:
                    doc_links.append(url)
                elif '/about' in url or '/company' in url or '/blog' in url:
                    company_links.append(url)
                else:
                    other_links.append(url)
            
            print(f"\n🛍️ Product URLs ({len(product_links)}):")
            for url in product_links[:10]:
                print(f"  - {url}")
                
            print(f"\n📚 Documentation URLs ({len(doc_links)}):")
            for url in doc_links[:10]:
                print(f"  - {url}")
                
            print(f"\n🏢 Company URLs ({len(company_links)}):")
            for url in company_links[:10]:
                print(f"  - {url}")
                
            print(f"\n🔗 Other URLs ({len(other_links)}):")
            for url in other_links[:20]:
                print(f"  - {url}")
                
            # Check if my hardcoded URLs exist
            print("\n❌ Checking hardcoded URLs:")
            fake_urls = ['/technology', '/architecture', '/infrastructure', '/scale']
            for fake in fake_urls:
                found = any(fake in str(link) for link in internal_links)
                print(f"  - {fake}: {'FOUND' if found else 'NOT FOUND'}")
                
        else:
            print("❌ Failed to crawl")

if __name__ == "__main__":
    asyncio.run(test_real_discovery())