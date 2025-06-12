#!/usr/bin/env python3
"""
PROPER Deep Evidence Collection using Crawl4AI's ACTUAL documented features
No more reinventing, no more placeholders - just what the docs say
"""

import asyncio
import json
import sys
import os
from typing import Dict, List, Any
from pathlib import Path
from collections import defaultdict

sys.path.append(str(Path(__file__).parent.parent.parent))

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
from crawl4ai.deep_crawling import BestFirstCrawlingStrategy
from crawl4ai.deep_crawling.filters import (
    FilterChain,
    URLPatternFilter,
    DomainFilter,
    ContentTypeFilter,
)
from crawl4ai.deep_crawling.scorers import KeywordRelevanceScorer
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from crawl4ai.types import LLMConfig
from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher


class DocumentedDeepEvidenceCollector:
    """Evidence collector using crawl4ai's ACTUAL documented deep crawling features"""
    
    def __init__(self, domain: str, investment_thesis: str):
        self.domain = domain
        self.investment_thesis = investment_thesis
        self.evidence_items = []
        self.processed_urls = set()
        
        # Investment thesis configurations - keywords that matter
        self.thesis_configs = {
            'accelerate-organic-growth': {
                'keywords': [
                    'growth', 'scale', 'expansion', 'market', 'revenue', 
                    'customers', 'product', 'features', 'pricing', 'saas',
                    'platform', 'enterprise', 'startup', 'team', 'leadership'
                ],
                # Let crawler discover URLs based on keywords, not hardcoded patterns
                'priority_keywords': ['pricing', 'product', 'customers', 'growth', 'scale']
            },
            'buy-and-build': {
                'keywords': [
                    'integration', 'api', 'partner', 'platform', 'connect', 
                    'webhook', 'developer', 'docs', 'documentation', 'sdk',
                    'ecosystem', 'marketplace', 'plugins', 'extensions'
                ],
                'priority_keywords': ['api', 'integration', 'developer', 'partners']
            },
            'digital-transformation': {
                'keywords': [
                    'digital', 'cloud', 'modern', 'innovation', 'technology', 
                    'platform', 'data', 'ai', 'automation', 'transformation',
                    'architecture', 'infrastructure', 'security', 'compliance'
                ],
                'priority_keywords': ['technology', 'cloud', 'platform', 'innovation']
            }
        }
        
        self.config = self.thesis_configs.get(investment_thesis, self.thesis_configs['accelerate-organic-growth'])
        
    async def collect_evidence(self, max_pages: int = 200) -> Dict[str, Any]:
        """Collect evidence using crawl4ai's documented deep crawling approach"""
        
        print(f"🔍 Starting DOCUMENTED deep evidence collection for {self.domain}")
        print(f"🎯 Investment thesis: {self.investment_thesis}")
        print(f"📊 Keywords: {', '.join(self.config['priority_keywords'])}")
        print(f"🎯 Target: {max_pages} pages")
        
        # Phase 1: Deep crawl with BestFirstCrawlingStrategy (as documented)
        print("\n📡 Phase 1: Deep crawl with BestFirstCrawlingStrategy...")
        deep_results = await self._deep_crawl_with_best_first(max_pages)
        
        # Phase 2: Extract high-quality evidence from results
        print(f"\n🧠 Phase 2: Extracting evidence from {len(deep_results)} pages...")
        await self._extract_evidence_from_results(deep_results)
        
        # Phase 3: If we have API keys, do LLM-enhanced extraction on top pages
        if os.getenv('ANTHROPIC_API_KEY') or os.getenv('GOOGLE_API_KEY'):
            print(f"\n🤖 Phase 3: LLM-enhanced extraction on top pages...")
            await self._llm_enhanced_extraction(deep_results[:10])
        
        return {
            "evidence_count": len(self.evidence_items),
            "pages_crawled": len(deep_results),
            "evidence_items": self.evidence_items,
            "unique_domains": len(set(r['url'] for r in deep_results)),
            "evidence_types": list(set(item['type'] for item in self.evidence_items))
        }
    
    async def _deep_crawl_with_best_first(self, max_pages: int) -> List[Dict]:
        """
        Use BestFirstCrawlingStrategy as documented with:
        - Keyword scoring for URL prioritization
        - Domain filtering to stay on target site
        - Streaming mode for real-time processing
        - Memory adaptive dispatcher for large crawls
        """
        
        # Create keyword scorer based on investment thesis
        keyword_scorer = KeywordRelevanceScorer(
            keywords=self.config['keywords'],
            weight=0.8  # High weight for keyword relevance
        )
        
        # Configure deep crawl strategy (as per docs)
        strategy = BestFirstCrawlingStrategy(
            max_depth=4,  # Go 4 levels deep
            include_external=False,  # Stay on domain
            url_scorer=keyword_scorer,
            max_pages=max_pages,
            filter_chain=FilterChain([
                DomainFilter(allowed_domains=[self.domain]),
                ContentTypeFilter(allowed_types=["text/html", "text/plain"])
            ])
        )
        
        # Configure crawler with streaming (as per docs)
        config = CrawlerRunConfig(
            deep_crawl_strategy=strategy,
            stream=True,  # Enable streaming for real-time processing
            verbose=True,
            word_count_threshold=50,  # Minimum content length
            remove_overlay_elements=True  # Clean extraction
        )
        
        results = []
        
        async with AsyncWebCrawler(
            headless=True,
            browser_type="chromium"
        ) as crawler:
            
            # Use streaming mode as documented
            async for result in await crawler.arun(
                url=f"https://{self.domain}",
                config=config
            ):
                if result.success:
                    # Process result in real-time
                    self.processed_urls.add(result.url)
                    
                    results.append({
                        'url': result.url,
                        'title': result.metadata.get('title', ''),
                        'html': result.html,
                        'markdown': result.markdown,
                        'metadata': result.metadata,
                        'links': result.links
                    })
                    
                    # Show progress
                    if len(results) % 10 == 0:
                        print(f"  📄 Crawled {len(results)} pages...")
                    
                    # Extract evidence in real-time (streaming benefit)
                    self._extract_streaming_evidence(result)
                    
                else:
                    print(f"  ❌ Failed: {result.url} - {result.error}")
        
        print(f"✅ Deep crawl complete: {len(results)} pages crawled")
        return results
    
    def _extract_streaming_evidence(self, result):
        """Extract evidence during streaming (real-time processing)"""
        
        url = result.url
        path = url.split(self.domain)[-1] if self.domain in url else url
        
        # Categorize based on URL and content
        evidence_type = self._categorize_page(url, result.markdown or '')
        
        # Calculate confidence based on keyword density
        keyword_score = self._calculate_keyword_density(result.markdown or '', result.html)
        
        self.evidence_items.append({
            'type': evidence_type,
            'source': url,
            'confidence': min(0.5 + keyword_score, 0.95),
            'content': {
                'title': result.metadata.get('title', ''),
                'url': url,
                'path': path,
                'summary': self._generate_summary(result.markdown, evidence_type),
                'keyword_relevance': keyword_score,
                'depth': result.metadata.get('depth', 0),
                'discovered_at': len(self.evidence_items) + 1
            }
        })
    
    def _categorize_page(self, url: str, content: str) -> str:
        """Categorize page based on URL and content - no hardcoded paths"""
        
        url_lower = url.lower()
        content_lower = content.lower() if content else ""
        
        # Check URL and content for category indicators
        if any(term in url_lower or term in content_lower for term in ['pricing', 'plan', 'cost', 'subscription']):
            return 'pricing_info'
        elif any(term in url_lower or term in content_lower for term in ['about', 'team', 'leadership', 'founder']):
            return 'company_info'
        elif any(term in url_lower or term in content_lower for term in ['api', 'docs', 'documentation', 'developer']):
            return 'technical_docs'
        elif any(term in url_lower or term in content_lower for term in ['customer', 'case', 'testimonial', 'success']):
            return 'customer_evidence'
        elif any(term in url_lower or term in content_lower for term in ['blog', 'news', 'article', 'post']):
            return 'thought_leadership'
        elif any(term in url_lower or term in content_lower for term in ['feature', 'product', 'solution', 'capability']):
            return 'product_info'
        elif any(term in url_lower or term in content_lower for term in ['security', 'compliance', 'privacy', 'gdpr']):
            return 'security_info'
        elif any(term in url_lower or term in content_lower for term in ['integration', 'partner', 'connect', 'plugin']):
            return 'integration_info'
        else:
            return 'general_info'
    
    def _calculate_keyword_density(self, markdown: str, html: str) -> float:
        """Calculate keyword density for confidence scoring"""
        
        text = markdown or html
        if not text:
            return 0.0
            
        text_lower = text.lower()
        word_count = len(text_lower.split())
        
        if word_count == 0:
            return 0.0
            
        keyword_count = 0
        for keyword in self.config['keywords']:
            keyword_count += text_lower.count(keyword.lower())
            
        # Calculate density with priority keyword boost
        priority_count = 0
        for keyword in self.config['priority_keywords']:
            priority_count += text_lower.count(keyword.lower())
            
        # Weighted score
        base_score = keyword_count / word_count
        priority_boost = (priority_count * 2) / word_count
        
        return min(base_score + priority_boost, 0.5)  # Cap at 0.5
    
    def _generate_summary(self, content: str, evidence_type: str) -> str:
        """Generate summary based on actual content"""
        
        if not content:
            return f"Empty {evidence_type.replace('_', ' ')} page"
            
        word_count = len(content.split())
        
        # Extract first meaningful sentence
        sentences = content.split('.')
        first_sentence = next((s.strip() for s in sentences if len(s.strip()) > 20), '')
        
        return f"{evidence_type.replace('_', ' ').title()} - {word_count} words. {first_sentence[:100]}..."
    
    async def _extract_evidence_from_results(self, results: List[Dict]):
        """Extract detailed evidence from crawled results"""
        
        # Group results by evidence type for better organization
        evidence_by_type = defaultdict(list)
        
        for result in results:
            url = result['url']
            evidence_type = self._categorize_page(url, result.get('markdown', ''))
            evidence_by_type[evidence_type].append(result)
        
        # Report on what we found
        print("\n📊 Evidence Distribution:")
        for etype, pages in evidence_by_type.items():
            print(f"  - {etype}: {len(pages)} pages")
    
    async def _llm_enhanced_extraction(self, top_results: List[Dict]):
        """Use LLM to extract structured information from top pages"""
        
        # Configure LLM
        llm_config = None
        if os.getenv('ANTHROPIC_API_KEY'):
            llm_config = LLMConfig(
                provider="anthropic/claude-3-haiku-20240307",
                api_token=os.getenv('ANTHROPIC_API_KEY')
            )
        elif os.getenv('GOOGLE_API_KEY'):
            llm_config = LLMConfig(
                provider="google/gemini-1.5-flash",
                api_token=os.getenv('GOOGLE_API_KEY')
            )
        else:
            print("⚠️ No LLM API key found, skipping enhanced extraction")
            return
        
        # Investment thesis specific prompts
        extraction_prompts = {
            'accelerate-organic-growth': """
            Extract key growth indicators:
            1. Business model and revenue streams
            2. Customer segments and market size
            3. Growth metrics and traction
            4. Product features and roadmap
            5. Team size and key hires
            Return as structured JSON.
            """,
            'buy-and-build': """
            Extract integration capabilities:
            1. API endpoints and documentation quality
            2. Integration partners and marketplace
            3. Webhook capabilities
            4. SDK availability and languages
            5. Platform extensibility features
            Return as structured JSON.
            """,
            'digital-transformation': """
            Extract technology maturity indicators:
            1. Technology stack and architecture
            2. Cloud infrastructure usage
            3. Modern development practices
            4. Security and compliance certifications
            5. Innovation and R&D focus
            Return as structured JSON.
            """
        }
        
        prompt = extraction_prompts.get(self.investment_thesis, extraction_prompts['accelerate-organic-growth'])
        
        # Configure extraction
        config = CrawlerRunConfig(
            extraction_strategy=LLMExtractionStrategy(
                llm_config=llm_config,
                instruction=prompt,
                extraction_type="block"
            ),
            verbose=False
        )
        
        enhanced_count = 0
        async with AsyncWebCrawler() as crawler:
            for result in top_results[:10]:  # Limit LLM calls
                try:
                    print(f"  🧠 LLM analysis: {result['url']}")
                    enhanced_result = await crawler.arun(url=result['url'], config=config)
                    
                    if enhanced_result.success and enhanced_result.extracted_content:
                        # Parse LLM response
                        try:
                            extracted_data = json.loads(enhanced_result.extracted_content)
                            
                            self.evidence_items.append({
                                'type': 'llm_analysis',
                                'source': result['url'],
                                'confidence': 0.9,  # High confidence for LLM extraction
                                'content': {
                                    'title': result.get('title', ''),
                                    'url': result['url'],
                                    'analysis': extracted_data,
                                    'extraction_type': 'llm_enhanced',
                                    'investment_relevance': 'high',
                                    'thesis': self.investment_thesis
                                }
                            })
                            enhanced_count += 1
                            
                        except json.JSONDecodeError:
                            print(f"  ⚠️ Failed to parse LLM response as JSON")
                            
                except Exception as e:
                    print(f"  ❌ LLM extraction error: {e}")
        
        print(f"✅ Enhanced {enhanced_count} pages with LLM analysis")


async def main():
    """Test the documented deep crawler"""
    
    if len(sys.argv) < 4:
        print("Usage: python crawl4ai_documented_deep.py <domain> <investment_thesis> <scan_request_id>")
        sys.exit(1)
    
    domain = sys.argv[1]
    investment_thesis = sys.argv[2]
    scan_request_id = sys.argv[3]
    
    collector = DocumentedDeepEvidenceCollector(domain, investment_thesis)
    
    try:
        results = await collector.collect_evidence(max_pages=200)
        
        output = {
            'success': True,
            'scan_request_id': scan_request_id,
            'domain': domain,
            'investment_thesis': investment_thesis,
            'evidence_count': results['evidence_count'],
            'pages_crawled': results['pages_crawled'],
            'evidence_types': results['evidence_types'],
            'evidence_items': results['evidence_items']
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        import traceback
        output = {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc(),
            'scan_request_id': scan_request_id
        }
        print(json.dumps(output))
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())