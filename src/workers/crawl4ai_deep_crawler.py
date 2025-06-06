#!/usr/bin/env python3
"""
Deep Evidence Collection with Crawl4AI
This script performs comprehensive website crawling for PE-grade due diligence
"""

import asyncio
import json
import sys
from typing import Dict, List, Any, Optional
from datetime import datetime
import os
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from crawl4ai import AsyncWebCrawler
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy, CosineStrategy
import aiohttp
import re
from urllib.parse import urljoin, urlparse
from collections import defaultdict
import hashlib


class DeepEvidenceCollector:
    """Comprehensive evidence collector using crawl4ai"""
    
    def __init__(self, domain: str, investment_thesis: str):
        self.domain = domain
        self.base_url = f"https://{domain}"
        self.investment_thesis = investment_thesis
        self.evidence_items = []
        self.visited_urls = set()
        self.technologies_found = defaultdict(int)
        self.code_patterns = defaultdict(list)
        
    async def collect_evidence(self, max_pages: int = 200) -> Dict[str, Any]:
        """Main evidence collection orchestrator"""
        
        # Phase 1: Deep website crawl
        print(f"Starting deep crawl of {self.domain}...")
        crawl_results = await self._deep_crawl_website(max_pages)
        
        # Phase 2: Extract technical evidence
        print("Extracting technical evidence...")
        await self._extract_technical_evidence(crawl_results)
        
        # Phase 3: Analyze code patterns
        print("Analyzing code patterns...")
        await self._analyze_code_patterns(crawl_results)
        
        # Phase 4: Collect business intelligence
        print("Collecting business intelligence...")
        await self._collect_business_intelligence(crawl_results)
        
        # Phase 5: Network and security analysis
        print("Performing network analysis...")
        await self._perform_network_analysis()
        
        # Phase 6: API discovery
        print("Discovering APIs...")
        await self._discover_apis(crawl_results)
        
        # Phase 7: Team and culture analysis
        print("Analyzing team and culture...")
        await self._analyze_team_culture(crawl_results)
        
        # Phase 8: Financial signals
        print("Extracting financial signals...")
        await self._extract_financial_signals(crawl_results)
        
        return {
            "evidence_count": len(self.evidence_items),
            "pages_crawled": len(crawl_results),
            "technologies": dict(self.technologies_found),
            "evidence_items": self.evidence_items
        }
    
    async def _deep_crawl_website(self, max_pages: int) -> List[Dict]:
        """Deep crawl using crawl4ai with multiple strategies"""
        results = []
        
        async with AsyncWebCrawler(
            verbose=True,
            headless=True,
            browser_type="chromium"
        ) as crawler:
            # Start with homepage
            url_queue = [self.base_url]
            
            # Key pages to prioritize
            priority_paths = [
                "/about", "/team", "/technology", "/platform", "/product",
                "/pricing", "/api", "/docs", "/documentation", "/developers",
                "/security", "/compliance", "/privacy", "/careers", "/blog",
                "/case-studies", "/customers", "/partners", "/investors"
            ]
            
            # Add priority URLs to queue
            for path in priority_paths:
                url_queue.append(urljoin(self.base_url, path))
            
            while url_queue and len(results) < max_pages:
                url = url_queue.pop(0)
                
                if url in self.visited_urls:
                    continue
                    
                self.visited_urls.add(url)
                
                try:
                    # Crawl with extraction strategy
                    result = await crawler.arun(
                        url=url,
                        screenshot=True,  # Take screenshots of important pages
                        page_timeout=30000,
                        extraction_strategy=JsonCssExtractionStrategy(
                            schema={
                                "technologies": "script[src], link[href]",
                                "headings": "h1, h2, h3", 
                                "links": "a[href]",
                                "images": "img[src]",
                                "code_blocks": "pre code, .code-block",
                                "meta_tags": "meta[name], meta[property]"
                            }
                        )
                    )
                    
                    if result and result.success:
                        page_data = {
                            "url": url,
                            "title": result.metadata.get("title", ""),
                            "description": result.metadata.get("description", ""),
                            "html": result.html,
                            "markdown": result.markdown,
                            "extracted_data": result.extracted_content if hasattr(result, 'extracted_content') else {},
                            "screenshot": result.screenshot if hasattr(result, 'screenshot') else None,
                            "metadata": result.metadata
                        }
                        
                        results.append(page_data)
                        
                        # Extract links and add to queue
                        if result.html:
                            links = self._extract_links(result.html, url)
                            for link in links[:10]:  # Add up to 10 new links per page
                                if link not in self.visited_urls and len(url_queue) < max_pages * 2:
                                    url_queue.append(link)
                        
                        # Extract technologies from page
                        self._extract_page_technologies(result.html)
                        
                except Exception as e:
                    print(f"Error crawling {url}: {str(e)}")
                    continue
                
                # Rate limiting
                await asyncio.sleep(1)
        
        return results
    
    def _extract_links(self, html: str, base_url: str) -> List[str]:
        """Extract and normalize links from HTML"""
        links = []
        # Simple regex for href extraction
        href_pattern = re.compile(r'href=[\'"]?([^\'" >]+)', re.IGNORECASE)
        
        for match in href_pattern.finditer(html):
            link = match.group(1)
            
            # Skip certain link types
            if link.startswith(('#', 'mailto:', 'tel:', 'javascript:')):
                continue
                
            # Normalize the link
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
            'React': r'react(?:\.js)?|_react',
            'Angular': r'angular(?:\.js)?|ng-',
            'Vue.js': r'vue(?:\.js)?',
            'Node.js': r'node(?:\.js)?|express',
            'Python': r'python|django|flask',
            'Ruby': r'ruby|rails',
            'Java': r'java(?!script)|spring',
            'Kubernetes': r'kubernetes|k8s',
            'Docker': r'docker|container',
            'AWS': r'aws|amazon web services|ec2|s3|lambda',
            'Google Cloud': r'google cloud|gcp|firebase',
            'Azure': r'azure|microsoft cloud',
            'PostgreSQL': r'postgres(?:ql)?',
            'MongoDB': r'mongodb|mongo',
            'Redis': r'redis',
            'Elasticsearch': r'elasticsearch|elastic',
            'GraphQL': r'graphql',
            'REST API': r'rest(?:ful)?\s+api',
            'Microservices': r'microservice',
            'CI/CD': r'ci\/cd|continuous integration|jenkins|github actions',
            'Terraform': r'terraform',
            'Datadog': r'datadog',
            'New Relic': r'new relic|newrelic',
            'Sentry': r'sentry',
            'Stripe': r'stripe',
            'OAuth': r'oauth',
            'SAML': r'saml',
            'WebSocket': r'websocket',
            'gRPC': r'grpc',
            'Kafka': r'kafka',
            'RabbitMQ': r'rabbitmq',
            'Machine Learning': r'machine learning|ml|tensorflow|pytorch',
            'Analytics': r'analytics|mixpanel|segment|amplitude'
        }
        
        html_lower = html.lower()
        for tech, pattern in tech_patterns.items():
            if re.search(pattern, html_lower):
                self.technologies_found[tech] += 1
    
    async def _extract_technical_evidence(self, crawl_results: List[Dict]):
        """Extract detailed technical evidence"""
        
        for result in crawl_results:
            url = result['url']
            
            # Technology stack evidence
            if '/tech' in url or '/engineering' in url or '/platform' in url:
                self.evidence_items.append({
                    'type': 'technical_architecture',
                    'source': url,
                    'confidence': 0.9,
                    'content': {
                        'title': result['title'],
                        'summary': result['description'],
                        'raw': result['markdown'][:5000],
                        'technologies': list(self.technologies_found.keys())
                    }
                })
            
            # API documentation
            if '/api' in url or '/docs' in url or '/developer' in url:
                self.evidence_items.append({
                    'type': 'api_documentation',
                    'source': url,
                    'confidence': 0.95,
                    'content': {
                        'title': result['title'],
                        'summary': 'API documentation and developer resources',
                        'raw': result['markdown'][:5000]
                    }
                })
                
                # Extract API endpoints
                api_pattern = re.compile(r'(?:GET|POST|PUT|DELETE|PATCH)\s+([/\w\-{}]+)')
                endpoints = api_pattern.findall(result.get('html', ''))
                if endpoints:
                    self.evidence_items.append({
                        'type': 'api_endpoints',
                        'source': url,
                        'confidence': 0.85,
                        'content': {
                            'endpoints': list(set(endpoints))[:50],
                            'count': len(endpoints)
                        }
                    })
    
    async def _analyze_code_patterns(self, crawl_results: List[Dict]):
        """Analyze code patterns and architecture"""
        
        code_indicators = {
            'microservices': [r'microservice', r'service mesh', r'api gateway'],
            'serverless': [r'lambda', r'serverless', r'function as a service'],
            'event_driven': [r'event driven', r'pub/sub', r'message queue'],
            'cloud_native': [r'cloud native', r'kubernetes', r'container'],
            'monolithic': [r'monolith', r'single application'],
            'spa': [r'single page application', r'spa', r'client-side routing'],
            'ssr': [r'server side rendering', r'ssr', r'next\.js'],
            'real_time': [r'real-time', r'websocket', r'streaming'],
            'data_pipeline': [r'etl', r'data pipeline', r'batch processing'],
            'ml_infrastructure': [r'machine learning', r'ml platform', r'model serving']
        }
        
        for result in crawl_results:
            content = (result.get('markdown', '') + result.get('html', '')).lower()
            
            for pattern_name, patterns in code_indicators.items():
                for pattern in patterns:
                    if re.search(pattern, content):
                        self.code_patterns[pattern_name].append({
                            'url': result['url'],
                            'evidence': pattern
                        })
        
        # Create evidence from patterns
        for pattern_name, occurrences in self.code_patterns.items():
            if occurrences:
                self.evidence_items.append({
                    'type': 'code_pattern_analysis',
                    'source': 'multiple_pages',
                    'confidence': min(0.7 + len(occurrences) * 0.05, 0.95),
                    'content': {
                        'pattern': pattern_name,
                        'occurrences': len(occurrences),
                        'sources': [o['url'] for o in occurrences[:5]]
                    }
                })
    
    async def _collect_business_intelligence(self, crawl_results: List[Dict]):
        """Collect business-related evidence"""
        
        for result in crawl_results:
            url = result['url']
            content = result.get('markdown', '')
            
            # Company overview
            if '/about' in url or '/company' in url:
                self.evidence_items.append({
                    'type': 'company_overview',
                    'source': url,
                    'confidence': 0.9,
                    'content': {
                        'title': result['title'],
                        'summary': content[:500],
                        'full_content': content[:3000]
                    }
                })
            
            # Team information
            if '/team' in url or '/leadership' in url or '/about' in url:
                # Extract team member names
                name_pattern = re.compile(r'([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*,?\s*(?:CEO|CTO|VP|Director|Engineer|Founder))')
                team_members = name_pattern.findall(content)
                
                if team_members:
                    self.evidence_items.append({
                        'type': 'team_composition',
                        'source': url,
                        'confidence': 0.85,
                        'content': {
                            'team_size_estimate': len(set(team_members)),
                            'key_members': list(set(team_members))[:20]
                        }
                    })
            
            # Customer evidence
            if '/customers' in url or '/case-studies' in url:
                self.evidence_items.append({
                    'type': 'customer_evidence',
                    'source': url,
                    'confidence': 0.9,
                    'content': {
                        'title': result['title'],
                        'summary': 'Customer case studies and testimonials',
                        'content': content[:3000]
                    }
                })
            
            # Pricing information
            if '/pricing' in url:
                self.evidence_items.append({
                    'type': 'pricing_model',
                    'source': url,
                    'confidence': 0.95,
                    'content': {
                        'title': result['title'],
                        'summary': 'Pricing and plans information',
                        'content': content[:3000]
                    }
                })
    
    async def _perform_network_analysis(self):
        """Perform network and infrastructure analysis"""
        
        # SSL certificate check
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, ssl=True) as response:
                    self.evidence_items.append({
                        'type': 'security_analysis',
                        'source': self.base_url,
                        'confidence': 0.9,
                        'content': {
                            'ssl_enabled': True,
                            'status_code': response.status,
                            'headers': dict(response.headers)
                        }
                    })
        except Exception:
            pass
        
        # DNS and subdomain analysis
        common_subdomains = ['api', 'app', 'www', 'docs', 'blog', 'status', 'support']
        active_subdomains = []
        
        for subdomain in common_subdomains:
            test_url = f"https://{subdomain}.{self.domain}"
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.head(test_url, timeout=5) as response:
                        if response.status < 400:
                            active_subdomains.append(subdomain)
            except:
                pass
        
        if active_subdomains:
            self.evidence_items.append({
                'type': 'infrastructure_analysis',
                'source': 'subdomain_scan',
                'confidence': 0.8,
                'content': {
                    'active_subdomains': active_subdomains,
                    'infrastructure_complexity': len(active_subdomains)
                }
            })
    
    async def _discover_apis(self, crawl_results: List[Dict]):
        """Discover API endpoints and integrations"""
        
        # Look for API patterns in JavaScript files
        js_urls = []
        api_patterns = []
        
        for result in crawl_results:
            html = result.get('html', '')
            
            # Find JavaScript files
            js_pattern = re.compile(r'<script[^>]+src=["\']([^"\']+\.js)["\']')
            js_urls.extend(js_pattern.findall(html))
            
            # Look for API endpoints in content
            endpoint_patterns = [
                r'/api/v\d+/[\w/]+',
                r'/v\d+/[\w/]+',
                r'https?://[\w\-\.]+/api/[\w/]+',
                r'endpoint["\']?\s*:\s*["\']([^"\']+)',
                r'baseURL["\']?\s*:\s*["\']([^"\']+)'
            ]
            
            for pattern in endpoint_patterns:
                matches = re.findall(pattern, html)
                api_patterns.extend(matches)
        
        if api_patterns:
            self.evidence_items.append({
                'type': 'api_discovery',
                'source': 'code_analysis',
                'confidence': 0.85,
                'content': {
                    'discovered_endpoints': list(set(api_patterns))[:30],
                    'javascript_files': list(set(js_urls))[:20]
                }
            })
    
    async def _analyze_team_culture(self, crawl_results: List[Dict]):
        """Analyze team and culture signals"""
        
        culture_signals = {
            'remote_friendly': ['remote', 'distributed', 'work from home', 'flexible location'],
            'engineering_culture': ['engineering blog', 'tech blog', 'open source', 'github'],
            'growth_stage': ['series a', 'series b', 'funding', 'venture', 'growth'],
            'innovation_focus': ['ai', 'machine learning', 'cutting edge', 'innovation'],
            'customer_centric': ['customer success', 'customer first', 'user experience'],
            'data_driven': ['data driven', 'analytics', 'metrics', 'measurement']
        }
        
        culture_evidence = defaultdict(list)
        
        for result in crawl_results:
            content = result.get('markdown', '').lower()
            url = result['url']
            
            for signal_type, keywords in culture_signals.items():
                for keyword in keywords:
                    if keyword in content:
                        culture_evidence[signal_type].append({
                            'keyword': keyword,
                            'url': url
                        })
        
        for signal_type, evidence in culture_evidence.items():
            if evidence:
                self.evidence_items.append({
                    'type': 'culture_analysis',
                    'source': 'multiple_pages',
                    'confidence': min(0.7 + len(evidence) * 0.05, 0.9),
                    'content': {
                        'signal': signal_type,
                        'evidence_count': len(evidence),
                        'sources': list(set([e['url'] for e in evidence[:5]]))
                    }
                })
    
    async def _extract_financial_signals(self, crawl_results: List[Dict]):
        """Extract financial and growth signals"""
        
        financial_patterns = {
            'funding': r'\$[\d\.]+[MBK]|\$[\d,]+(?:million|billion)',
            'revenue': r'revenue|arr|mrr',
            'growth': r'\d+%\s*(?:growth|increase|yoy)',
            'customers': r'[\d,]+\s*(?:customers|users|companies)',
            'employees': r'[\d,]+\s*(?:employees|team members)',
            'valuation': r'valued at|valuation'
        }
        
        for result in crawl_results:
            content = result.get('markdown', '')
            
            for signal_type, pattern in financial_patterns.items():
                matches = re.findall(pattern, content, re.IGNORECASE)
                if matches:
                    self.evidence_items.append({
                        'type': 'financial_signal',
                        'source': result['url'],
                        'confidence': 0.75,
                        'content': {
                            'signal_type': signal_type,
                            'evidence': matches[:5],
                            'context': content[max(0, content.find(matches[0])-100):content.find(matches[0])+100]
                        }
                    })


async def main():
    """Main entry point for crawl4ai evidence collection"""
    
    # Get parameters from command line
    if len(sys.argv) < 4:
        print("Usage: python crawl4ai_deep_crawler.py <domain> <investment_thesis> <scan_request_id>")
        sys.exit(1)
    
    domain = sys.argv[1]
    investment_thesis = sys.argv[2]
    scan_request_id = sys.argv[3]
    
    # Create collector
    collector = DeepEvidenceCollector(domain, investment_thesis)
    
    # Collect evidence
    try:
        results = await collector.collect_evidence(max_pages=200)
        
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