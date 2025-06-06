#!/usr/bin/env python3
"""
Proper Deep Evidence Collection using Crawl4AI's built-in features
No more reinventing the wheel!
"""

import asyncio
import json
import sys
import os
from typing import Dict, List, Any
from datetime import datetime
from pathlib import Path

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


class ProperDeepEvidenceCollector:
    """Evidence collector using crawl4ai's proper deep crawling features"""
    
    def __init__(self, domain: str, investment_thesis: str):
        self.domain = domain
        self.investment_thesis = investment_thesis
        self.evidence_items = []
        
        # Investment thesis configurations
        self.thesis_configs = {
            'accelerate-organic-growth': {
                'keywords': ['growth', 'scale', 'expansion', 'market', 'revenue', 'customers', 'product'],
                'url_patterns': ['*product*', '*feature*', '*customer*', '*pricing*', '*case-stud*', '*about*'],
                'priorities': ['scalability', 'market_traction', 'growth_metrics']
            },
            'buy-and-build': {
                'keywords': ['integration', 'api', 'partner', 'platform', 'connect', 'webhook', 'developer'],
                'url_patterns': ['*api*', '*integration*', '*partner*', '*developer*', '*doc*', '*platform*'],
                'priorities': ['integration_capabilities', 'platform_extensibility', 'partner_ecosystem']
            },
            'digital-transformation': {
                'keywords': ['digital', 'cloud', 'modern', 'innovation', 'technology', 'platform', 'data'],
                'url_patterns': ['*technology*', '*platform*', '*cloud*', '*innovation*', '*digital*', '*data*'],
                'priorities': ['technology_stack', 'digital_maturity', 'innovation_capacity']
            }
        }
        
        self.config = self.thesis_configs.get(investment_thesis, self.thesis_configs['accelerate-organic-growth'])
        
    async def collect_evidence(self, max_pages: int = 200) -> Dict[str, Any]:
        """Collect evidence using proper crawl4ai deep crawling"""
        
        print(f"🔍 Starting PROPER deep evidence collection for {self.domain}")
        print(f"🎯 Investment thesis: {self.investment_thesis}")
        print(f"📊 Keywords: {', '.join(self.config['keywords'][:5])}")
        print(f"🔗 URL patterns: {', '.join(self.config['url_patterns'][:3])}")
        
        # Phase 1: Broad discovery crawl
        print("\n📡 Phase 1: Broad discovery crawl...")
        discovery_results = await self._discovery_crawl(max_pages // 3)
        
        # Phase 2: Targeted deep crawl based on discovery
        print(f"\n🎯 Phase 2: Targeted deep crawl based on {len(discovery_results)} discovered pages...")
        deep_results = await self._targeted_deep_crawl(discovery_results, max_pages // 2)
        
        # Phase 3: LLM-enhanced extraction on high-value pages
        print(f"\n🧠 Phase 3: LLM-enhanced extraction on high-value pages...")
        enhanced_results = await self._llm_enhanced_extraction(deep_results[:20])
        
        total_pages = len(discovery_results) + len(deep_results)
        
        return {
            "evidence_count": len(self.evidence_items),
            "pages_crawled": total_pages,
            "discovery_pages": len(discovery_results),
            "deep_pages": len(deep_results),
            "enhanced_pages": len(enhanced_results),
            "evidence_items": self.evidence_items
        }
    
    async def _discovery_crawl(self, max_pages: int) -> List[Any]:
        """Phase 1: Broad discovery to understand site structure"""
        
        # Simple BFS to discover site structure
        config = CrawlerRunConfig(
            deep_crawl_strategy=BestFirstCrawlingStrategy(
                max_depth=2,  # Shallow but broad
                include_external=False,
                filter_chain=FilterChain([
                    DomainFilter(allowed_domains=[self.domain]),
                    ContentTypeFilter(allowed_types=["text/html"]),
                ]),
                url_scorer=KeywordRelevanceScorer(
                    keywords=self.config['keywords'],
                    weight=0.8
                )
            ),
            stream=True,
            verbose=True
        )
        
        results = []
        async with AsyncWebCrawler() as crawler:
            async for result in await crawler.arun(
                url=f"https://{self.domain}",
                config=config
            ):
                results.append(result)
                self._extract_basic_evidence(result)
                
                if len(results) >= max_pages:
                    break
                    
                # Show progress
                if len(results) % 10 == 0:
                    print(f"  📄 Discovered {len(results)} pages...")
        
        print(f"✅ Discovery complete: {len(results)} pages found")
        return results
    
    async def _targeted_deep_crawl(self, discovery_results: List[Any], max_pages: int) -> List[Any]:
        """Phase 2: Deep crawl on high-value areas identified in discovery"""
        
        # Identify high-value starting points from discovery
        high_value_urls = self._identify_high_value_urls(discovery_results)
        
        print(f"🎯 Identified {len(high_value_urls)} high-value areas to explore deeply")
        
        # Configure deeper, more targeted crawl
        config = CrawlerRunConfig(
            deep_crawl_strategy=BestFirstCrawlingStrategy(
                max_depth=4,  # Go deeper on targeted areas
                include_external=False,
                filter_chain=FilterChain([
                    DomainFilter(allowed_domains=[self.domain]),
                    URLPatternFilter(patterns=self.config['url_patterns']),
                    ContentTypeFilter(allowed_types=["text/html"]),
                ]),
                url_scorer=KeywordRelevanceScorer(
                    keywords=self.config['keywords'] + self.config['priorities'],
                    weight=0.9
                )
            ),
            stream=True,
            verbose=False  # Less verbose for deep crawl
        )
        
        all_results = []
        
        # Crawl from multiple high-value starting points
        async with AsyncWebCrawler() as crawler:
            for start_url in high_value_urls[:5]:  # Top 5 starting points
                print(f"  🕸️ Deep crawling from: {start_url}")
                
                async for result in await crawler.arun(url=start_url, config=config):
                    all_results.append(result)
                    self._extract_detailed_evidence(result)
                    
                    if len(all_results) >= max_pages:
                        break
                
                if len(all_results) >= max_pages:
                    break
        
        print(f"✅ Deep crawl complete: {len(all_results)} pages analyzed")
        return all_results
    
    async def _llm_enhanced_extraction(self, high_value_pages: List[Any]) -> List[Any]:
        """Phase 3: Use LLM extraction on the most valuable pages"""
        
        # Only if we have LLM config
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
        
        if not llm_config:
            print("⚠️ No LLM API key found, skipping enhanced extraction")
            return []
        
        enhanced_results = []
        
        # Configure LLM extraction based on investment thesis
        extraction_instruction = f"""
        Extract key information relevant to {self.investment_thesis} investment thesis:
        
        Focus on:
        {', '.join(self.config['priorities'])}
        
        Extract:
        1. Business model and revenue streams
        2. Technology stack and architecture
        3. Market position and growth indicators
        4. Team and leadership information
        5. Customer evidence and case studies
        
        Return as structured JSON.
        """
        
        config = CrawlerRunConfig(
            extraction_strategy=LLMExtractionStrategy(
                llm_config=llm_config,
                instruction=extraction_instruction,
                extraction_type="block"
            ),
            verbose=False
        )
        
        async with AsyncWebCrawler() as crawler:
            for page in high_value_pages:
                print(f"  🧠 LLM analysis: {page.url}")
                try:
                    result = await crawler.arun(url=page.url, config=config)
                    if result.success and result.extracted_content:
                        enhanced_results.append(result)
                        self._store_llm_evidence(result)
                except Exception as e:
                    print(f"  ❌ LLM extraction failed: {e}")
        
        print(f"✅ Enhanced extraction complete: {len(enhanced_results)} pages")
        return enhanced_results
    
    def _extract_basic_evidence(self, result):
        """Extract basic evidence during discovery phase"""
        if not result.success:
            return
            
        self.evidence_items.append({
            'type': 'discovery_page',
            'source': result.url,
            'confidence': 0.6,
            'content': {
                'title': result.metadata.get('title', ''),
                'url': result.url,
                'depth': result.metadata.get('depth', 0),
                'score': result.metadata.get('score', 0),
                'summary': f"Discovery page at depth {result.metadata.get('depth', 0)}",
                'word_count': len(result.markdown.split()) if result.markdown else 0
            }
        })
    
    def _extract_detailed_evidence(self, result):
        """Extract detailed evidence during deep crawl phase"""
        if not result.success:
            return
            
        # Determine evidence type based on URL and content
        evidence_type = self._categorize_page(result.url, result.markdown)
        
        self.evidence_items.append({
            'type': evidence_type,
            'source': result.url,
            'confidence': min(0.5 + result.metadata.get('score', 0), 0.95),
            'content': {
                'title': result.metadata.get('title', ''),
                'url': result.url,
                'depth': result.metadata.get('depth', 0),
                'score': result.metadata.get('score', 0),
                'evidence_type': evidence_type,
                'summary': self._generate_summary(result.markdown, evidence_type),
                'keywords_found': self._count_keywords(result.markdown)
            }
        })
    
    def _store_llm_evidence(self, result):
        """Store LLM-extracted evidence"""
        if not result.extracted_content:
            return
            
        try:
            extracted = json.loads(result.extracted_content)
            self.evidence_items.append({
                'type': 'llm_analysis',
                'source': result.url,
                'confidence': 0.9,
                'content': {
                    'title': result.metadata.get('title', ''),
                    'url': result.url,
                    'analysis': extracted,
                    'extraction_type': 'llm_enhanced',
                    'investment_relevance': 'high'
                }
            })
        except:
            pass
    
    def _identify_high_value_urls(self, results: List[Any]) -> List[str]:
        """Identify high-value URLs from discovery results"""
        # Sort by score and select diverse high-value pages
        scored_urls = []
        for result in results:
            score = result.metadata.get('score', 0)
            if score > 0.5:  # Only high-scoring pages
                scored_urls.append((score, result.url))
        
        # Sort by score and return top URLs
        scored_urls.sort(reverse=True)
        return [url for score, url in scored_urls]
    
    def _categorize_page(self, url: str, content: str) -> str:
        """Categorize page type based on URL and content"""
        url_lower = url.lower()
        content_lower = content.lower() if content else ""
        
        if 'pricing' in url_lower or 'plan' in url_lower:
            return 'pricing_info'
        elif 'about' in url_lower or 'team' in url_lower:
            return 'company_info'
        elif 'api' in url_lower or 'doc' in url_lower:
            return 'technical_docs'
        elif 'customer' in url_lower or 'case' in url_lower:
            return 'customer_evidence'
        elif 'blog' in url_lower or 'news' in url_lower:
            return 'thought_leadership'
        elif 'feature' in url_lower or 'product' in url_lower:
            return 'product_info'
        else:
            return 'general_info'
    
    def _generate_summary(self, content: str, evidence_type: str) -> str:
        """Generate a summary based on content and type"""
        if not content:
            return f"Empty {evidence_type} page"
            
        word_count = len(content.split())
        keyword_density = self._count_keywords(content)
        
        return f"{evidence_type} page with {word_count} words, {keyword_density} keyword matches"
    
    def _count_keywords(self, content: str) -> int:
        """Count keyword occurrences in content"""
        if not content:
            return 0
            
        content_lower = content.lower()
        count = 0
        for keyword in self.config['keywords']:
            count += content_lower.count(keyword.lower())
        return count


async def main():
    """Test the proper deep crawler"""
    import os
    
    if len(sys.argv) < 4:
        print("Usage: python crawl4ai_proper_deep.py <domain> <investment_thesis> <scan_request_id>")
        sys.exit(1)
    
    domain = sys.argv[1]
    investment_thesis = sys.argv[2]
    scan_request_id = sys.argv[3]
    
    collector = ProperDeepEvidenceCollector(domain, investment_thesis)
    
    try:
        results = await collector.collect_evidence(max_pages=100)
        
        output = {
            'success': True,
            'scan_request_id': scan_request_id,
            'domain': domain,
            'investment_thesis': investment_thesis,
            'evidence_count': results['evidence_count'],
            'pages_crawled': results['pages_crawled'],
            'crawl_breakdown': {
                'discovery': results['discovery_pages'],
                'deep_crawl': results['deep_pages'],
                'llm_enhanced': results['enhanced_pages']
            },
            'evidence_items': results['evidence_items']
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        output = {
            'success': False,
            'error': str(e),
            'scan_request_id': scan_request_id
        }
        print(json.dumps(output))
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())