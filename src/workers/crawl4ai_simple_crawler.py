#!/usr/bin/env python3
"""
Simplified Deep Evidence Collection with Crawl4AI
This script performs comprehensive website crawling for PE-grade due diligence
"""

import asyncio
import json
import sys
from typing import Dict, List, Any
from datetime import datetime
import os
from pathlib import Path
import re
from urllib.parse import urljoin, urlparse
from collections import defaultdict
import aiohttp

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent.parent))

try:
    from crawl4ai import AsyncWebCrawler
    HAS_CRAWL4AI = True
except ImportError:
    HAS_CRAWL4AI = False


class SimpleDeepEvidenceCollector:
    """Deep evidence collector using deep-searcher inspired routing"""
    
    def __init__(self, domain: str, investment_thesis: str):
        self.domain = domain
        self.base_url = f"https://{domain}"
        self.investment_thesis = investment_thesis
        self.evidence_items = []
        self.visited_urls = set()
        self.discovered_urls = []
        self.search_context = {
            'evidence_gaps': [],
            'search_iterations': 0,
            'collected_evidence_types': set(),
            'business_context': {},
            'technical_context': {}
        }
        
        # Investment thesis routing patterns
        self.thesis_search_strategies = self._initialize_search_strategies()
    
    def _initialize_search_strategies(self) -> Dict[str, Any]:
        """Initialize search strategies based on investment thesis"""
        strategies = {
            'accelerate-organic-growth': {
                'priority_evidence': ['business_model', 'scalability', 'market_expansion', 'technology_stack'],
                'url_patterns': ['/about', '/product', '/pricing', '/technology', '/platform', '/api'],
                'qualitative_first': ['/about', '/company', '/pricing', '/customers'],
                'technical_follow_up': ['/technology', '/api', '/docs', '/platform', '/architecture']
            },
            'buy-and-build': {
                'priority_evidence': ['api_integration', 'modularity', 'partnerships', 'technology_stack'],
                'url_patterns': ['/api', '/integrations', '/partners', '/developers', '/platform'],
                'qualitative_first': ['/about', '/partners', '/integrations'],
                'technical_follow_up': ['/api', '/docs', '/developers', '/webhooks']
            },
            'margin-expansion': {
                'priority_evidence': ['automation', 'efficiency', 'cost_structure', 'operations'],
                'url_patterns': ['/pricing', '/automation', '/efficiency', '/operations'],
                'qualitative_first': ['/pricing', '/about', '/product'],
                'technical_follow_up': ['/automation', '/operations', '/infrastructure']
            },
            'digital-transformation': {
                'priority_evidence': ['modern_tech', 'cloud_native', 'api_first', 'innovation'],
                'url_patterns': ['/technology', '/api', '/cloud', '/innovation', '/platform'],
                'qualitative_first': ['/about', '/innovation', '/technology'],
                'technical_follow_up': ['/api', '/docs', '/cloud', '/infrastructure']
            }
        }
        return strategies.get(self.investment_thesis, strategies['accelerate-organic-growth'])
    
    async def _plan_next_search(self, iteration: int, max_pages: int) -> Dict[str, Any]:
        """Plan next search phase based on evidence gaps and investment thesis"""
        
        if iteration == 0:
            # Phase 1: Qualitative context building (your guidance)
            urls = [urljoin(self.base_url, path) for path in self.thesis_search_strategies['qualitative_first']]
            urls.insert(0, self.base_url)  # Always start with homepage
            return {
                'phase': 'qualitative_context',
                'urls_to_search': urls[:max_pages//3],
                'focus': 'business_model_and_context'
            }
        
        elif iteration == 1:
            # Phase 2: Use ACTUAL discovered URLs for technical search
            print(f"🔗 Using {len(self.discovered_urls)} discovered URLs")
            
            # Prioritize discovered URLs that match technical patterns
            tech_patterns = ['feature', 'developer', 'doc', 'api', 'integration', 'security', 'data']
            tech_urls = []
            other_urls = []
            
            for url in self.discovered_urls:
                if any(pattern in url.lower() for pattern in tech_patterns):
                    tech_urls.append(url)
                else:
                    other_urls.append(url)
            
            # Combine prioritized tech URLs with other discovered URLs
            urls = tech_urls[:max_pages//2] + other_urls[:max_pages//4]
            
            if not urls:
                # Fallback only if no URLs discovered
                print("⚠️ No URLs discovered, using fallback patterns")
                urls = [urljoin(self.base_url, path) for path in self.thesis_search_strategies['technical_follow_up']]
            
            return {
                'phase': 'technical_deep_dive',
                'urls_to_search': urls[:max_pages//3], 
                'focus': 'technical_capabilities_and_architecture'
            }
        
        else:
            # Phase 3: Gap filling based on reflection
            missing_evidence = self._identify_evidence_gaps()
            gap_urls = self._generate_gap_urls(missing_evidence)
            return {
                'phase': 'gap_filling',
                'urls_to_search': gap_urls[:max_pages//3],
                'focus': 'filling_critical_evidence_gaps',
                'missing_evidence': missing_evidence
            }
    
    async def _execute_smart_crawl(self, search_plan: Dict[str, Any]) -> List[Dict]:
        """Execute crawling with phase-specific extraction strategies"""
        results = []
        
        async with AsyncWebCrawler(
            headless=True,
            browser_type="chromium"
        ) as crawler:
            
            print(f"🎯 Focus: {search_plan['focus']}")
            print(f"📍 URLs to crawl: {len(search_plan['urls_to_search'])}")
            
            # Process URLs with phase-specific strategies
            for url in search_plan['urls_to_search']:
                if url in self.visited_urls:
                    continue
                    
                self.visited_urls.add(url)
                print(f"📄 Processing: {url}")
                
                try:
                    result = await crawler.arun(
                        url=url,
                        word_count_threshold=50,
                        remove_overlay_elements=True,
                        simulate_user=True
                    )
                    
                    if result and result.success:
                        # Extract content using phase-specific strategies
                        await self._extract_phase_specific_evidence(url, result, search_plan['phase'])
                        
                        # Discover new URLs intelligently
                        await self._discover_urls_from_content(url, result)
                        
                        results.append({
                            "url": url,
                            "title": getattr(result, 'title', ''),
                            "success": True,
                            "phase": search_plan['phase']
                        })
                        
                except Exception as e:
                    print(f"❌ Error crawling {url}: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
                
                # Rate limiting
                await asyncio.sleep(1)
        
        return results
    
    async def collect_evidence(self, max_pages: int = 100) -> Dict[str, Any]:
        """Deep search evidence collection with intelligent routing"""
        
        print(f"🔍 Starting deep evidence collection for {self.domain}")
        print(f"🎯 Investment thesis: {self.investment_thesis}")
        print(f"📋 Priority evidence: {self.thesis_search_strategies['priority_evidence']}")
        
        max_iterations = 3
        results = []
        
        for iteration in range(max_iterations):
            print(f"\n🔄 Search Iteration {iteration + 1}/{max_iterations}")
            
            # Identify evidence gaps and plan next search
            search_plan = await self._plan_next_search(iteration, max_pages)
            
            if not search_plan['urls_to_search']:
                print("✅ No more URLs needed - evidence collection complete")
                break
            
            # Execute search phase
            if HAS_CRAWL4AI:
                phase_results = await self._execute_smart_crawl(search_plan)
            else:
                phase_results = await self._execute_fallback_crawl(search_plan['urls_to_search'])
            
            results.extend(phase_results)
            
            # Reflect on collected evidence and update context
            await self._reflect_on_evidence()
            
            print(f"📊 Phase {iteration + 1} collected {len(phase_results)} pages")
            print(f"📈 Total evidence items: {len(self.evidence_items)}")
        
        return {
            "evidence_count": len(self.evidence_items),
            "pages_crawled": len(results),
            "search_iterations": self.search_context['search_iterations'],
            "evidence_types": list(self.search_context['collected_evidence_types']),
            "evidence_items": self.evidence_items
        }
    
    async def _extract_phase_specific_evidence(self, url: str, result, phase: str):
        """Extract evidence using phase-specific strategies"""
        path = urlparse(url).path.lower()
        
        if phase == 'qualitative_context':
            # Focus on business context, pricing, team, market positioning
            await self._extract_business_context(url, result)
            
        elif phase == 'technical_deep_dive':
            # Focus on technology stack, APIs, architecture
            await self._extract_technical_context(url, result)
            
        elif phase == 'gap_filling':
            # Focus on specific missing evidence types
            await self._extract_targeted_evidence(url, result)
    
    async def _extract_business_context(self, url: str, result):
        """Extract business model, pricing, team context"""
        path = urlparse(url).path.lower()
        html = result.html
        markdown = result.markdown or ""
        title = getattr(result, 'title', '')
        
        # Determine evidence type based on URL and content
        evidence_type = 'business_overview'
        if 'pricing' in path or 'plan' in path:
            evidence_type = 'financial_info'
        elif 'team' in path or 'about' in path or 'leadership' in path:
            evidence_type = 'team_info'
        elif 'customer' in path or 'case' in path:
            evidence_type = 'market_analysis'
            
        # Extract with improved content analysis
        content = self._extract_smart_content(html, markdown, evidence_type)
        
        self.evidence_items.append({
            'type': evidence_type,
            'source': url,
            'confidence': self._calculate_confidence(content, evidence_type),
            'content': {
                'title': title,
                'summary': self._generate_smart_summary(content, evidence_type),
                'url_path': urlparse(url).path,
                'extracted_data': content,
                'phase': 'qualitative_context',
                'investment_relevance': self._score_investment_relevance(content, evidence_type)
            }
        })
        
        # Update search context
        self.search_context['collected_evidence_types'].add(evidence_type)
        self.search_context['business_context'][evidence_type] = content
    
    async def _extract_technical_context(self, url: str, result):
        """Extract technical capabilities, APIs, architecture"""
        path = urlparse(url).path.lower()
        html = result.html
        markdown = result.markdown or ""
        title = getattr(result, 'title', '')
        
        evidence_type = 'technology_stack'
        if 'api' in path or 'developer' in path:
            evidence_type = 'api_response'
        elif 'security' in path:
            evidence_type = 'security_analysis'
            
        # Advanced technical content extraction
        technical_content = self._extract_technical_details(html, markdown)
        
        self.evidence_items.append({
            'type': evidence_type,
            'source': url,
            'confidence': self._calculate_confidence(technical_content, evidence_type),
            'content': {
                'title': title,
                'summary': self._generate_smart_summary(technical_content, evidence_type),
                'url_path': urlparse(url).path,
                'technical_details': technical_content,
                'phase': 'technical_deep_dive',
                'investment_relevance': self._score_investment_relevance(technical_content, evidence_type)
            }
        })
        
        self.search_context['collected_evidence_types'].add(evidence_type)
        self.search_context['technical_context'][evidence_type] = technical_content
    
    async def _discover_urls_from_content(self, url: str, result):
        """Intelligently discover new URLs based on content and investment thesis"""
        if not result.links:
            return
            
        internal_links = result.links.get('internal', [])
        
        # Filter URLs based on investment thesis priorities
        priority_patterns = self.thesis_search_strategies['url_patterns']
        
        for link in internal_links[:20]:  # Limit discovery
            # Handle both string and dict link formats
            link_url = link if isinstance(link, str) else link.get('href', '') if isinstance(link, dict) else ''
            
            if link_url and any(pattern in link_url.lower() for pattern in priority_patterns):
                if link_url not in self.visited_urls and link_url not in self.discovered_urls:
                    self.discovered_urls.append(link_url)
    
    def _extract_smart_content(self, html: str, markdown: str, evidence_type: str) -> Dict[str, Any]:
        """Smart content extraction based on evidence type"""
        content = {}
        text = markdown or html
        
        if evidence_type == 'financial_info':
            content.update(self._extract_pricing_info(html))
        elif evidence_type == 'team_info':
            content.update(self._extract_team_info(html))
        elif evidence_type == 'market_analysis':
            content.update(self._extract_customer_info(html))
        else:
            content.update(self._extract_general_business_info(text))
            
        return content
    
    def _extract_general_business_info(self, text: str) -> Dict[str, Any]:
        """Extract general business information"""
        info = {}
        text_lower = text.lower()
        
        # Business model indicators
        if 'saas' in text_lower or 'software as a service' in text_lower:
            info['business_model'] = 'SaaS'
        elif 'marketplace' in text_lower:
            info['business_model'] = 'Marketplace'
        elif 'platform' in text_lower:
            info['business_model'] = 'Platform'
            
        # Company stage indicators
        if any(word in text_lower for word in ['startup', 'founded', 'early']):
            info['stage_indicators'] = 'Early Stage'
        elif any(word in text_lower for word in ['enterprise', 'scale', 'global']):
            info['stage_indicators'] = 'Growth/Enterprise'
            
        return info
    
    def _extract_technical_details(self, html: str, markdown: str) -> Dict[str, Any]:
        """Extract technical architecture and capabilities"""
        text = markdown or html
        details = {}
        
        # Technology detection (improved from original)
        tech_patterns = {
            'Frontend': r'react|angular|vue|svelte|nextjs|gatsby',
            'Backend': r'node\.js|python|java|golang|rust|ruby|php|\.net',
            'Database': r'postgresql|mysql|mongodb|redis|elasticsearch|cassandra',
            'Cloud': r'aws|azure|gcp|google cloud|kubernetes|docker',
            'API': r'rest|graphql|grpc|webhook|api|endpoint',
            'Security': r'oauth|saml|jwt|ssl|tls|encryption|2fa|mfa'
        }
        
        detected_tech = {}
        text_lower = text.lower()
        
        for category, pattern in tech_patterns.items():
            matches = re.findall(pattern, text_lower)
            if matches:
                detected_tech[category] = list(set(matches))
        
        details['technologies'] = detected_tech
        details['api_mentions'] = len(re.findall(r'api|endpoint|integration', text_lower))
        details['security_mentions'] = len(re.findall(r'security|secure|encrypt|auth', text_lower))
        
        return details
    
    def _identify_evidence_gaps(self) -> List[str]:
        """Identify missing evidence types for investment thesis"""
        required_evidence = set(self.thesis_search_strategies['priority_evidence'])
        collected_evidence = self.search_context['collected_evidence_types']
        return list(required_evidence - collected_evidence)
    
    def _generate_gap_urls(self, missing_evidence: List[str]) -> List[str]:
        """Generate URLs to fill evidence gaps"""
        gap_urls = []
        
        # Map evidence types to potential URL patterns
        evidence_url_map = {
            'business_model': ['/about', '/company', '/business'],
            'scalability': ['/architecture', '/infrastructure', '/scale'],
            'api_integration': ['/api', '/developers', '/integrations'],
            'automation': ['/automation', '/features', '/platform']
        }
        
        for evidence in missing_evidence:
            if evidence in evidence_url_map:
                for path in evidence_url_map[evidence]:
                    gap_urls.append(urljoin(self.base_url, path))
        
        return gap_urls
    
    async def _reflect_on_evidence(self):
        """Reflect on collected evidence and update search context"""
        self.search_context['search_iterations'] += 1
        
        # Calculate evidence completeness
        required_evidence = set(self.thesis_search_strategies['priority_evidence'])
        collected_evidence = self.search_context['collected_evidence_types']
        completeness = len(collected_evidence) / len(required_evidence)
        
        print(f"📊 Evidence completeness: {completeness:.1%}")
        print(f"✅ Collected: {list(collected_evidence)}")
        
        missing = required_evidence - collected_evidence
        if missing:
            print(f"❌ Missing: {list(missing)}")
    
    def _calculate_confidence(self, content: Dict[str, Any], evidence_type: str) -> float:
        """Calculate confidence score based on content quality"""
        base_confidence = 0.7
        
        # Boost confidence for substantial content
        if content and len(str(content)) > 100:
            base_confidence += 0.1
            
        # Boost for evidence type alignment
        if evidence_type in self.thesis_search_strategies['priority_evidence']:
            base_confidence += 0.1
            
        return min(base_confidence, 0.95)
    
    def _generate_smart_summary(self, content: Dict[str, Any], evidence_type: str) -> str:
        """Generate intelligent summary based on content and evidence type"""
        if not content:
            return f"No {evidence_type.replace('_', ' ')} information extracted"
            
        # Create contextual summaries based on content
        if evidence_type == 'financial_info' and 'pricing_tiers' in content:
            return f"Found {len(content.get('pricing_tiers', []))} pricing tiers and business model information"
        elif evidence_type == 'technology_stack' and 'technologies' in content:
            technologies = content['technologies']
            if isinstance(technologies, dict):
                tech_count = sum(len(techs) for techs in technologies.values() if isinstance(techs, list))
                return f"Identified {tech_count} technologies across multiple categories"
            else:
                return f"Found technology information: {len(str(technologies))} characters"
        else:
            return f"Extracted {evidence_type.replace('_', ' ')} information with {len(content)} data points"
    
    def _score_investment_relevance(self, content: Dict[str, Any], evidence_type: str) -> float:
        """Score relevance to investment thesis"""
        if evidence_type in self.thesis_search_strategies['priority_evidence']:
            return 0.9
        return 0.7
    
    async def _execute_fallback_crawl(self, urls: List[str]) -> List[Dict]:
        """Fallback crawling method when crawl4ai not available"""
        results = []
        async with aiohttp.ClientSession() as session:
            for url in urls[:10]:  # Limit fallback
                try:
                    async with session.get(url, timeout=15) as response:
                        if response.status == 200:
                            html = await response.text()
                            self.evidence_items.append({
                                'type': 'website_content',
                                'source': url,
                                'confidence': 0.5,
                                'content': {
                                    'title': 'Basic content (fallback mode)',
                                    'html_snippet': html[:1000],
                                    'note': 'Limited extraction - crawl4ai not available'
                                }
                            })
                            results.append({"url": url, "success": True})
                except Exception as e:
                    print(f"❌ Fallback failed for {url}: {e}")
        return results
    
    async def _extract_targeted_evidence(self, url: str, result):
        """Extract specific evidence for gap filling"""
        # Simplified targeted extraction
        self.evidence_items.append({
            'type': 'general_information',
            'source': url,
            'confidence': 0.6,
            'content': {
                'title': getattr(result, 'title', ''),
                'summary': 'Gap-filling evidence',
                'phase': 'gap_filling'
            }
        })
    
    async def _crawl_with_crawl4ai(self, max_pages: int) -> List[Dict]:
        """Smart crawling with agentic URL discovery and content-aware extraction"""
        results = []
        discovered_urls = set()
        
        async with AsyncWebCrawler(
            headless=True,
            browser_type="chromium"
        ) as crawler:
            
            # Phase 1: Smart URL Discovery
            urls_to_crawl = await self._discover_priority_urls(crawler)
            
            for url in urls_to_crawl[:max_pages]:
                if url in self.visited_urls:
                    continue
                    
                self.visited_urls.add(url)
                
                try:
                    # Simple crawl without complex configuration
                    result = await crawler.arun(url=url)
                    
                    if result and result.success:
                        page_data = {
                            "url": url,
                            "title": getattr(result, 'title', ''),
                            "html": result.html,
                            "markdown": result.markdown,
                            "links": result.links.get('internal', []) if result.links else [],
                            "metadata": result.metadata if result.metadata else {}
                        }
                        
                        results.append(page_data)
                        self._extract_page_technologies(result.html)
                        
                except Exception as e:
                    print(f"Error crawling {url}: {e}")
                    continue
                
                # Rate limiting
                await asyncio.sleep(1)
        
        return results
    
    async def _crawl_with_aiohttp(self, max_pages: int) -> List[Dict]:
        """Fallback HTTP crawling"""
        results = []
        
        # Priority URLs for PE diligence
        urls_to_crawl = [self.base_url]
        priority_paths = [
            "/about", "/team", "/company", "/leadership",
            "/technology", "/platform", "/product", "/features",
            "/pricing", "/plans", 
            "/api", "/docs", "/documentation", "/developers",
            "/security", "/compliance", "/privacy",
            "/careers", "/jobs", "/hiring",
            "/blog", "/news", "/press",
            "/case-studies", "/customers", "/testimonials",
            "/partners", "/integrations",
            "/investors", "/funding"
        ]
        
        # Add priority URLs
        for path in priority_paths:
            urls_to_crawl.append(urljoin(self.base_url, path))
        
        async with aiohttp.ClientSession() as session:
            for url in urls_to_crawl[:max_pages]:
                if url in self.visited_urls:
                    continue
                    
                self.visited_urls.add(url)
                
                try:
                    async with session.get(url, timeout=15) as response:
                        if response.status == 200:
                            html = await response.text()
                            
                            # Extract basic metadata
                            title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
                            title = title_match.group(1) if title_match else ''
                            
                            desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', html, re.IGNORECASE)
                            description = desc_match.group(1) if desc_match else ''
                            
                            page_data = {
                                "url": url,
                                "title": title.strip(),
                                "html": html,
                                "description": description.strip(),
                                "links": self._extract_links(html, url),
                                "metadata": {"status": response.status}
                            }
                            
                            results.append(page_data)
                            self._extract_page_technologies(html)
                            
                except Exception as e:
                    print(f"Error crawling {url}: {e}")
                    continue
                
                # Rate limiting
                await asyncio.sleep(1)
        
        return results
    
    def _extract_links(self, html: str, base_url: str) -> List[str]:
        """Extract links from HTML"""
        links = []
        href_pattern = re.compile(r'href=[\'"]?([^\'" >]+)', re.IGNORECASE)
        
        for match in href_pattern.finditer(html):
            link = match.group(1)
            
            if link.startswith(('#', 'mailto:', 'tel:', 'javascript:')):
                continue
                
            if link.startswith('http'):
                parsed = urlparse(link)
                if parsed.netloc == urlparse(self.base_url).netloc:
                    links.append(link)
            elif link.startswith('/'):
                links.append(urljoin(base_url, link))
        
        return list(set(links))
    
    def _extract_page_technologies(self, html: str):
        """Extract technologies from page content"""
        tech_patterns = {
            'React': r'react(?:\.js)?|_react|ReactDOM',
            'Angular': r'angular(?:\.js)?|ng-|@angular',
            'Vue.js': r'vue(?:\.js)?|vuejs',
            'Node.js': r'node(?:\.js)?|nodejs|express',
            'Python': r'python|django|flask|fastapi',
            'Ruby': r'ruby|rails|rubygems',
            'Java': r'java(?!script)|spring|hibernate',
            'PHP': r'php|laravel|symfony',
            'Go': r'golang|go\s+lang',
            'Rust': r'rust\s+lang|rustc',
            'Kubernetes': r'kubernetes|k8s',
            'Docker': r'docker|container|dockerfile',
            'AWS': r'aws|amazon web services|ec2|s3|lambda|cloudfront',
            'Google Cloud': r'google cloud|gcp|firebase|gae',
            'Azure': r'azure|microsoft cloud',
            'PostgreSQL': r'postgres(?:ql)?|pg_',
            'MongoDB': r'mongodb|mongo',
            'Redis': r'redis|elasticache',
            'Elasticsearch': r'elasticsearch|elastic search',
            'GraphQL': r'graphql|graph\s+ql',
            'REST API': r'rest(?:ful)?\s+api|rest\s+service',
            'Microservices': r'microservice|micro\s+service',
            'CI/CD': r'ci\/cd|continuous integration|jenkins|github actions|gitlab ci',
            'Terraform': r'terraform|tf\s+config',
            'Ansible': r'ansible|playbook',
            'Datadog': r'datadog|dd\s+agent',
            'New Relic': r'new relic|newrelic',
            'Sentry': r'sentry|sentry\.io',
            'Stripe': r'stripe|stripe\.com',
            'OAuth': r'oauth|oauth2',
            'SAML': r'saml|sso',
            'WebSocket': r'websocket|ws://',
            'gRPC': r'grpc|protobuf',
            'Kafka': r'kafka|kafka\s+stream',
            'RabbitMQ': r'rabbitmq|amqp',
            'Machine Learning': r'machine learning|ml\s+model|tensorflow|pytorch|scikit-learn',
            'Analytics': r'analytics|mixpanel|segment|amplitude|google analytics'
        }
        
        html_lower = html.lower()
        for tech, pattern in tech_patterns.items():
            matches = len(re.findall(pattern, html_lower))
            if matches > 0:
                self.technologies_found[tech] += matches
    
    async def _extract_all_evidence(self, crawl_results: List[Dict]):
        """Extract comprehensive evidence from crawl results"""
        
        for result in crawl_results:
            url = result['url']
            html = result.get('html', '')
            title = result.get('title', '')
            
            # Technical architecture evidence
            if any(term in url.lower() for term in ['/tech', '/engineering', '/platform', '/architecture']):
                self.evidence_items.append({
                    'type': 'technology_stack',
                    'source': url,
                    'confidence': 0.9,
                    'content': {
                        'title': title,
                        'summary': f'Technical architecture information from {urlparse(url).path}',
                        'url_path': urlparse(url).path,
                        'page_content': html[:3000],
                        'technologies_mentioned': self._get_tech_mentions(html)
                    }
                })
            
            # API documentation
            if any(term in url.lower() for term in ['/api', '/docs', '/developer', '/documentation']):
                api_endpoints = self._extract_api_endpoints(html)
                self.evidence_items.append({
                    'type': 'api_response',
                    'source': url,
                    'confidence': 0.95,
                    'content': {
                        'title': title,
                        'summary': 'API documentation and developer resources',
                        'api_endpoints': api_endpoints,
                        'endpoint_count': len(api_endpoints)
                    }
                })
            
            # Company and team information
            if any(term in url.lower() for term in ['/about', '/team', '/company', '/leadership']):
                team_info = self._extract_team_info(html)
                self.evidence_items.append({
                    'type': 'business_overview',
                    'source': url,
                    'confidence': 0.9,
                    'content': {
                        'title': title,
                        'summary': f'Company information from {urlparse(url).path}',
                        'team_members': team_info.get('members', []),
                        'leadership_count': len(team_info.get('leadership', [])),
                        'total_mentions': team_info.get('total_count', 0)
                    }
                })
            
            # Pricing and business model
            if any(term in url.lower() for term in ['/pricing', '/plans', '/subscription']):
                pricing_info = self._extract_pricing_info(html)
                self.evidence_items.append({
                    'type': 'financial_info',
                    'source': url,
                    'confidence': 0.95,
                    'content': {
                        'title': title,
                        'summary': 'Pricing and business model information',
                        'pricing_tiers': pricing_info.get('tiers', []),
                        'pricing_signals': pricing_info.get('signals', [])
                    }
                })
            
            # Security and compliance
            if any(term in url.lower() for term in ['/security', '/compliance', '/privacy']):
                security_info = self._extract_security_info(html)
                self.evidence_items.append({
                    'type': 'security_analysis',
                    'source': url,
                    'confidence': 0.9,
                    'content': {
                        'title': title,
                        'summary': 'Security and compliance information',
                        'certifications': security_info.get('certifications', []),
                        'security_features': security_info.get('features', [])
                    }
                })
            
            # Customer evidence
            if any(term in url.lower() for term in ['/customers', '/case-studies', '/testimonials']):
                customer_info = self._extract_customer_info(html)
                self.evidence_items.append({
                    'type': 'market_analysis',
                    'source': url,
                    'confidence': 0.85,
                    'content': {
                        'title': title,
                        'summary': 'Customer testimonials and case studies',
                        'customer_names': customer_info.get('customers', []),
                        'case_studies': customer_info.get('case_studies', [])
                    }
                })
            
            # Career and culture
            if any(term in url.lower() for term in ['/careers', '/jobs', '/culture']):
                culture_info = self._extract_culture_info(html)
                self.evidence_items.append({
                    'type': 'team_info',
                    'source': url,
                    'confidence': 0.8,
                    'content': {
                        'title': title,
                        'summary': 'Team culture and hiring information',
                        'job_openings': culture_info.get('openings', []),
                        'culture_signals': culture_info.get('signals', [])
                    }
                })
        
        # Technology stack summary
        if self.technologies_found:
            self.evidence_items.append({
                'type': 'technology_stack',
                'source': 'comprehensive_scan',
                'confidence': 0.9,
                'content': {
                    'title': 'Technology Stack Analysis',
                    'summary': f'Identified {len(self.technologies_found)} different technologies',
                    'technologies': dict(self.technologies_found),
                    'primary_stack': self._identify_primary_stack(),
                    'architecture_patterns': self._identify_architecture_patterns()
                }
            })
    
    def _get_tech_mentions(self, html: str) -> List[str]:
        """Get technology mentions from HTML content"""
        mentions = []
        for tech, count in self.technologies_found.items():
            if count > 0:
                mentions.append(tech)
        return mentions[:10]  # Top 10
    
    def _extract_api_endpoints(self, html: str) -> List[str]:
        """Extract API endpoints from documentation"""
        endpoints = []
        
        # Look for common API patterns
        patterns = [
            r'(?:GET|POST|PUT|DELETE|PATCH)\s+([/\w\-{}]+)',
            r'/api/v\d+/[\w/\-{}]+',
            r'/v\d+/[\w/\-{}]+',
            r'endpoint["\']?\s*:\s*["\']([^"\']+)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, html, re.IGNORECASE)
            endpoints.extend(matches)
        
        return list(set(endpoints))[:20]  # Top 20 unique endpoints
    
    def _extract_team_info(self, html: str) -> Dict[str, Any]:
        """Extract team and leadership information"""
        # Look for names and titles
        name_pattern = re.compile(r'([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*,?\s*(?:CEO|CTO|VP|Director|Engineer|Founder|Lead|Manager|President|COO|CFO))', re.IGNORECASE)
        
        members = []
        leadership = []
        
        matches = name_pattern.findall(html)
        for match in matches:
            name = match.strip()
            if name:
                members.append(name)
                # Check if it's leadership
                context = html[html.find(name):html.find(name) + 100].lower()
                if any(title in context for title in ['ceo', 'cto', 'founder', 'president', 'vp']):
                    leadership.append(name)
        
        return {
            'members': list(set(members))[:20],
            'leadership': list(set(leadership)),
            'total_count': len(set(members))
        }
    
    def _extract_pricing_info(self, html: str) -> Dict[str, Any]:
        """Extract pricing and business model information"""
        # Look for pricing tiers and signals
        price_pattern = re.compile(r'\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:/|\s+per\s+|\s+monthly|\s+annually)', re.IGNORECASE)
        tier_pattern = re.compile(r'(free|basic|pro|premium|enterprise|starter|professional|business)', re.IGNORECASE)
        
        prices = price_pattern.findall(html)
        tiers = tier_pattern.findall(html)
        
        return {
            'prices': prices[:10],
            'tiers': list(set([t.lower() for t in tiers])),
            'signals': prices + tiers
        }
    
    def _extract_security_info(self, html: str) -> Dict[str, Any]:
        """Extract security and compliance information"""
        cert_pattern = re.compile(r'(SOC\s*\d+|ISO\s*\d+|GDPR|HIPAA|PCI\s*DSS|CCPA|FedRAMP)', re.IGNORECASE)
        security_pattern = re.compile(r'(encryption|2FA|two.factor|SSL|TLS|security|audit)', re.IGNORECASE)
        
        certifications = cert_pattern.findall(html)
        features = security_pattern.findall(html)
        
        return {
            'certifications': list(set(certifications)),
            'features': list(set(features))[:10]
        }
    
    def _extract_customer_info(self, html: str) -> Dict[str, Any]:
        """Extract customer and case study information"""
        # Look for company names and case studies
        company_pattern = re.compile(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+Inc\.?|\s+Corp\.?|\s+LLC|\s+Ltd\.?)?)\b')
        
        potential_customers = []
        case_studies = []
        
        # Look for customer sections
        if 'customer' in html.lower() or 'case study' in html.lower():
            matches = company_pattern.findall(html)
            # Filter out common words
            common_words = {'The', 'This', 'That', 'And', 'But', 'For', 'With', 'Our', 'Inc', 'Corp', 'LLC', 'Ltd'}
            potential_customers = [m for m in matches if m not in common_words and len(m) > 3]
        
        return {
            'customers': list(set(potential_customers))[:15],
            'case_studies': case_studies
        }
    
    def _extract_culture_info(self, html: str) -> Dict[str, Any]:
        """Extract culture and hiring information"""
        job_pattern = re.compile(r'(engineer|developer|designer|manager|director|analyst|scientist|architect)', re.IGNORECASE)
        culture_pattern = re.compile(r'(remote|flexible|culture|values|mission|vision|diversity|inclusion)', re.IGNORECASE)
        
        openings = job_pattern.findall(html)
        signals = culture_pattern.findall(html)
        
        return {
            'openings': list(set(openings)),
            'signals': list(set(signals))
        }
    
    def _identify_primary_stack(self) -> List[str]:
        """Identify the primary technology stack"""
        # Sort by frequency and return top technologies
        sorted_techs = sorted(self.technologies_found.items(), key=lambda x: x[1], reverse=True)
        return [tech for tech, count in sorted_techs[:8]]
    
    def _identify_architecture_patterns(self) -> List[str]:
        """Identify architecture patterns from technologies"""
        patterns = []
        
        if 'Kubernetes' in self.technologies_found or 'Docker' in self.technologies_found:
            patterns.append('containerized')
        
        if 'Microservices' in self.technologies_found:
            patterns.append('microservices')
        
        if any(cloud in self.technologies_found for cloud in ['AWS', 'Google Cloud', 'Azure']):
            patterns.append('cloud-native')
        
        if 'GraphQL' in self.technologies_found:
            patterns.append('modern-api')
        
        return patterns
    
    async def _collect_business_intelligence(self):
        """Collect additional business intelligence"""
        # Add general business intelligence evidence
        self.evidence_items.append({
            'type': 'business_overview',
            'source': 'comprehensive_analysis',
            'confidence': 0.8,
            'content': {
                'title': 'Business Intelligence Summary',
                'summary': 'Collected business intelligence from website analysis',
                'pages_analyzed': len(self.visited_urls),
                'evidence_categories': len(set([item['type'] for item in self.evidence_items])),
                'technology_diversity': len(self.technologies_found)
            }
        })
    
    async def _perform_network_analysis(self):
        """Perform network and infrastructure analysis"""
        # Check common subdomains
        subdomains = ['api', 'app', 'www', 'docs', 'blog', 'status', 'support', 'cdn', 'assets']
        active_subdomains = []
        
        async with aiohttp.ClientSession() as session:
            for subdomain in subdomains:
                test_url = f"https://{subdomain}.{self.domain}"
                try:
                    async with session.head(test_url, timeout=5) as response:
                        if response.status < 400:
                            active_subdomains.append(subdomain)
                except:
                    pass
        
        if active_subdomains:
            self.evidence_items.append({
                'type': 'tech_deep_dive',
                'source': 'subdomain_scan',
                'confidence': 0.85,
                'content': {
                    'title': 'Infrastructure Analysis',
                    'summary': f'Found {len(active_subdomains)} active subdomains',
                    'active_subdomains': active_subdomains,
                    'infrastructure_complexity': len(active_subdomains)
                }
            })


async def main():
    """Main entry point for evidence collection"""
    
    # Get parameters from command line
    if len(sys.argv) < 4:
        print("Usage: python crawl4ai_simple_crawler.py <domain> <investment_thesis> <scan_request_id>")
        sys.exit(1)
    
    domain = sys.argv[1]
    investment_thesis = sys.argv[2]
    scan_request_id = sys.argv[3]
    
    # Create collector
    collector = SimpleDeepEvidenceCollector(domain, investment_thesis)
    
    # Collect evidence
    try:
        results = await collector.collect_evidence(max_pages=50)
        
        # Output results as JSON
        output = {
            'success': True,
            'scan_request_id': scan_request_id,
            'domain': domain,
            'investment_thesis': investment_thesis,
            'evidence_count': results['evidence_count'],
            'pages_crawled': results['pages_crawled'],
            'technologies': results['technologies'],
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