#!/usr/bin/env python3
"""
Research Tool Implementations
Actual implementations of various research tools used by the intelligent orchestrator
"""

import asyncio
import aiohttp
import json
from typing import Dict, List, Any, Optional
from urllib.parse import urlparse, quote_plus
import re
from datetime import datetime


class ResearchTools:
    """Collection of research tool implementations"""
    
    def __init__(self, api_keys: Dict[str, str]):
        self.api_keys = api_keys
        
    async def web_search(self, input_data: Dict[str, Any], state: Any) -> Dict[str, Any]:
        """
        Advanced web search using Gemini with Google grounding
        """
        query = input_data.get('query', '')
        search_type = input_data.get('search_type', 'general')
        date_range = input_data.get('date_range', '')
        
        # Enhance query based on search type and context
        enhanced_query = self._enhance_search_query(query, search_type, state)
        
        google_api_key = self.api_keys.get('google_api_key')
        if not google_api_key:
            return {"error": "No Google API key available", "results": []}
            
        try:
            # Use Gemini with Google Search grounding
            request_body = {
                'contents': [{
                    'parts': [{
                        'text': enhanced_query
                    }]
                }],
                'tools': [{
                    'googleSearch': {}
                }],
                'generationConfig': {
                    'temperature': 0.1,
                    'maxOutputTokens': 8192
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
                    json=request_body,
                    headers={
                        'Content-Type': 'application/json',
                        'x-goog-api-key': google_api_key
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_search_results(data, search_type)
                    else:
                        error = await response.text()
                        return {"error": f"Search failed: {error}", "results": []}
                        
        except Exception as e:
            return {"error": f"Search exception: {str(e)}", "results": []}
    
    async def html_collector(self, input_data: Dict[str, Any], state: Any) -> Dict[str, Any]:
        """
        Collect and analyze HTML content from specific pages
        """
        url = input_data.get('url', '')
        extract_patterns = input_data.get('extract_patterns', [])
        
        if not url:
            return {"error": "No URL provided"}
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=30) as response:
                    if response.status == 200:
                        html = await response.text()
                        
                        # Extract based on patterns
                        extracted = {}
                        
                        # Extract meta information
                        extracted['meta'] = self._extract_meta_info(html)
                        
                        # Extract structured data
                        extracted['structured_data'] = self._extract_structured_data(html)
                        
                        # Extract based on custom patterns
                        if extract_patterns:
                            extracted['custom'] = self._extract_patterns(html, extract_patterns)
                            
                        # Extract key business information
                        extracted['business_info'] = self._extract_business_info(html)
                        
                        return {
                            "url": url,
                            "status": response.status,
                            "extracted": extracted,
                            "content_length": len(html)
                        }
                    else:
                        return {"error": f"HTTP {response.status}", "url": url}
                        
        except Exception as e:
            return {"error": f"Collection failed: {str(e)}", "url": url}
    
    async def har_capture(self, input_data: Dict[str, Any], state: Any) -> Dict[str, Any]:
        """
        Capture HTTP Archive data to analyze API calls and performance
        """
        url = input_data.get('url', '')
        
        # This would typically use a headless browser to capture HAR
        # For now, we'll analyze what we can from direct requests
        
        try:
            async with aiohttp.ClientSession() as session:
                # Make initial request and track redirects
                history = []
                async with session.get(url, allow_redirects=True) as response:
                    # Track redirect chain
                    for hist in response.history:
                        history.append({
                            "url": str(hist.url),
                            "status": hist.status,
                            "headers": dict(hist.headers)
                        })
                    
                    # Analyze response
                    analysis = {
                        "final_url": str(response.url),
                        "status": response.status,
                        "headers": dict(response.headers),
                        "redirect_chain": history,
                        "performance": {
                            "response_time": response.headers.get('X-Response-Time', 'N/A'),
                            "cache_control": response.headers.get('Cache-Control', 'none'),
                            "cdn": self._detect_cdn(response.headers),
                        },
                        "security": {
                            "hsts": 'Strict-Transport-Security' in response.headers,
                            "csp": 'Content-Security-Policy' in response.headers,
                            "x_frame_options": response.headers.get('X-Frame-Options', 'missing')
                        }
                    }
                    
                    # Analyze content for API calls
                    if response.status == 200:
                        content = await response.text()
                        analysis['detected_apis'] = self._detect_api_calls(content)
                        analysis['third_party_services'] = self._detect_third_party(content)
                    
                    return analysis
                    
        except Exception as e:
            return {"error": f"HAR capture failed: {str(e)}", "url": url}
    
    async def security_scanner(self, input_data: Dict[str, Any], state: Any) -> Dict[str, Any]:
        """
        Scan for security configurations and compliance indicators
        """
        domain = input_data.get('domain', state.domain if state else '')
        
        results = {
            "domain": domain,
            "scan_time": datetime.now().isoformat(),
            "security_headers": {},
            "ssl_info": {},
            "compliance_indicators": {},
            "vulnerabilities": []
        }
        
        try:
            # Check security headers
            async with aiohttp.ClientSession() as session:
                async with session.get(f"https://{domain}", timeout=30) as response:
                    headers = dict(response.headers)
                    
                    # Security headers analysis
                    security_headers = {
                        'strict-transport-security': headers.get('Strict-Transport-Security'),
                        'content-security-policy': headers.get('Content-Security-Policy'),
                        'x-frame-options': headers.get('X-Frame-Options'),
                        'x-content-type-options': headers.get('X-Content-Type-Options'),
                        'referrer-policy': headers.get('Referrer-Policy'),
                        'permissions-policy': headers.get('Permissions-Policy'),
                    }
                    
                    results['security_headers'] = {
                        k: {'present': v is not None, 'value': v}
                        for k, v in security_headers.items()
                    }
                    
                    # Check for compliance indicators in content
                    if response.status == 200:
                        content = await response.text()
                        results['compliance_indicators'] = self._check_compliance_indicators(content)
                        
                    # SSL/TLS info from response
                    results['ssl_info'] = {
                        'protocol': str(response.url.scheme),
                        'secure': response.url.scheme == 'https'
                    }
                    
            # Additional security checks
            results['security_score'] = self._calculate_security_score(results)
            
            return results
            
        except Exception as e:
            return {"error": f"Security scan failed: {str(e)}", "domain": domain}
    
    async def network_analyzer(self, input_data: Dict[str, Any], state: Any) -> Dict[str, Any]:
        """
        Analyze network infrastructure and hosting
        """
        domain = input_data.get('domain', state.domain if state else '')
        
        try:
            import socket
            
            # Get IP addresses
            ips = socket.gethostbyname_ex(domain)[2]
            
            analysis = {
                "domain": domain,
                "ip_addresses": ips,
                "hosting": {},
                "cdn": {},
                "infrastructure": {}
            }
            
            # Analyze hosting provider based on IP
            for ip in ips[:1]:  # Check first IP
                analysis['hosting'] = await self._identify_hosting_provider(ip)
                
            # Check for CDN usage
            analysis['cdn'] = await self._check_cdn_usage(domain)
            
            # Infrastructure insights
            analysis['infrastructure'] = {
                "multi_region": len(ips) > 1,
                "load_balanced": len(ips) > 1,
                "ip_count": len(ips)
            }
            
            return analysis
            
        except Exception as e:
            return {"error": f"Network analysis failed: {str(e)}", "domain": domain}
    
    async def github_analyzer(self, input_data: Dict[str, Any], state: Any) -> Dict[str, Any]:
        """
        Analyze public GitHub repositories
        """
        company_name = input_data.get('company_name', state.company if state else '')
        
        # Search for company repos
        github_token = self.api_keys.get('github_token')
        
        headers = {
            'Accept': 'application/vnd.github.v3+json'
        }
        if github_token:
            headers['Authorization'] = f'token {github_token}'
            
        try:
            async with aiohttp.ClientSession() as session:
                # Search for organization
                search_url = f"https://api.github.com/search/users?q={quote_plus(company_name)}+type:org"
                
                async with session.get(search_url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data['items']:
                            org = data['items'][0]
                            org_name = org['login']
                            
                            # Get org repos
                            repos_url = f"https://api.github.com/orgs/{org_name}/repos?sort=stars&per_page=10"
                            async with session.get(repos_url, headers=headers) as repos_response:
                                if repos_response.status == 200:
                                    repos = await repos_response.json()
                                    
                                    return {
                                        "organization": org_name,
                                        "public_repos": len(repos),
                                        "top_repos": [
                                            {
                                                "name": repo['name'],
                                                "stars": repo['stargazers_count'],
                                                "language": repo['language'],
                                                "description": repo['description'],
                                                "topics": repo.get('topics', [])
                                            }
                                            for repo in repos[:5]
                                        ],
                                        "languages": list(set(r['language'] for r in repos if r['language'])),
                                        "total_stars": sum(r['stargazers_count'] for r in repos),
                                        "insights": self._analyze_github_tech_stack(repos)
                                    }
                                    
                        return {"message": "No GitHub organization found", "searched": company_name}
                        
        except Exception as e:
            return {"error": f"GitHub analysis failed: {str(e)}"}
    
    async def review_aggregator(self, input_data: Dict[str, Any], state: Any) -> Dict[str, Any]:
        """
        Aggregate reviews from multiple platforms
        """
        company_name = input_data.get('company_name', '')
        platforms = input_data.get('platforms', ['g2', 'capterra', 'trustradius'])
        
        aggregated = {
            "company": company_name,
            "platforms_checked": platforms,
            "reviews": [],
            "summary": {
                "total_reviews": 0,
                "average_rating": 0,
                "sentiment": {},
                "common_pros": [],
                "common_cons": [],
                "primary_segment": None
            }
        }
        
        # This would normally scrape actual review sites
        # For now, we'll search for review mentions
        for platform in platforms:
            query = f'"{company_name}" site:{platform}.com reviews rating'
            search_result = await self.web_search({"query": query}, state)
            
            if search_result.get('results'):
                # Extract review insights from search results
                platform_reviews = self._extract_review_insights(search_result['results'], platform)
                aggregated['reviews'].extend(platform_reviews)
        
        # Analyze aggregated reviews
        if aggregated['reviews']:
            aggregated['summary'] = self._analyze_reviews(aggregated['reviews'])
            
        return aggregated
    
    async def competitor_analyzer(self, input_data: Dict[str, Any], state: Any) -> Dict[str, Any]:
        """
        Analyze competitors and market positioning
        """
        company = input_data.get('company', state.company if state else '')
        domain = input_data.get('domain', state.domain if state else '')
        
        # Search for competitors
        competitor_queries = [
            f'"{company}" competitors alternatives',
            f'"{company}" vs comparison',
            f'best alternatives to "{company}"',
            f'"{company}" market share industry analysis'
        ]
        
        competitors = []
        market_insights = []
        
        for query in competitor_queries:
            result = await self.web_search({"query": query, "search_type": "general"}, state)
            
            if result.get('results'):
                # Extract competitor mentions
                for item in result['results']:
                    comp_names = self._extract_competitor_names(item.get('snippet', ''), company)
                    competitors.extend(comp_names)
                    
                    # Extract market insights
                    if 'market' in item.get('snippet', '').lower():
                        market_insights.append(item)
        
        # Deduplicate competitors
        unique_competitors = list(set(competitors))[:10]
        
        # Analyze competitive positioning
        positioning = await self._analyze_competitive_positioning(company, unique_competitors, market_insights)
        
        return {
            "company": company,
            "competitors": unique_competitors,
            "market_insights": market_insights[:5],
            "positioning": positioning,
            "competitive_advantages": self._identify_competitive_advantages(market_insights),
            "market_threats": self._identify_market_threats(market_insights)
        }
    
    async def tech_stack_analyzer(self, input_data: Dict[str, Any], state: Any) -> Dict[str, Any]:
        """
        Deep analysis of technology stack
        """
        domain = input_data.get('domain', state.domain if state else '')
        
        tech_stack = {
            "domain": domain,
            "frontend": [],
            "backend": [],
            "infrastructure": [],
            "analytics": [],
            "security": [],
            "other": []
        }
        
        # Multiple detection methods
        
        # 1. Check BuiltWith-style detection
        builtwith_result = await self._check_builtwith(domain)
        if builtwith_result:
            tech_stack.update(builtwith_result)
            
        # 2. Analyze HTTP headers and responses
        header_tech = await self._detect_from_headers(domain)
        for category, techs in header_tech.items():
            if category in tech_stack:
                tech_stack[category].extend(techs)
                
        # 3. Check job postings for tech requirements
        job_tech = await self._analyze_job_postings(state.company if state else domain)
        if job_tech:
            tech_stack['from_jobs'] = job_tech
            
        # 4. Analyze GitHub if available
        if state and state.key_technologies:
            tech_stack['from_github'] = state.key_technologies
            
        # Deduplicate and analyze
        for category in tech_stack:
            if isinstance(tech_stack[category], list):
                tech_stack[category] = list(set(tech_stack[category]))
                
        # Analyze stack modernity and hiring difficulty
        tech_stack['analysis'] = self._analyze_tech_stack_fit(tech_stack, state)
        
        return tech_stack
    
    # Helper methods
    
    def _enhance_search_query(self, query: str, search_type: str, state: Any) -> str:
        """Enhance search query based on type and context"""
        
        enhancements = {
            'news': f'{query} "latest news" "announcement" {datetime.now().year}',
            'reviews': f'{query} reviews "customer testimonial" rating satisfaction',
            'technical': f'{query} "tech stack" architecture infrastructure engineering',
            'financial': f'{query} revenue funding "series" valuation ARR growth',
            'general': query
        }
        
        enhanced = enhancements.get(search_type, query)
        
        # Add context from state if available
        if state and state.investment_thesis:
            if state.investment_thesis == 'buy-and-build':
                enhanced += ' API platform integration ecosystem'
            elif state.investment_thesis == 'digital-transformation':
                enhanced += ' enterprise security compliance migration'
                
        return enhanced
    
    def _parse_search_results(self, gemini_response: Dict, search_type: str) -> Dict[str, Any]:
        """Parse Gemini search results"""
        
        results = []
        
        # Extract content
        content = gemini_response.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        
        # Extract grounding metadata
        grounding = gemini_response.get('candidates', [{}])[0].get('groundingMetadata', {})
        
        # Extract URLs from grounding chunks
        if 'groundingChunks' in grounding:
            for chunk in grounding['groundingChunks']:
                if 'web' in chunk:
                    web_info = chunk['web']
                    results.append({
                        'title': web_info.get('title', ''),
                        'url': web_info.get('uri', ''),
                        'snippet': chunk.get('content', '')[:300],
                        'source': 'grounding_chunk'
                    })
                    
        # Also extract from content
        import re
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]\'()]+'
        urls_in_content = re.findall(url_pattern, content)
        
        for url in urls_in_content[:10]:
            if not any(r['url'] == url for r in results):
                results.append({
                    'title': self._extract_title_from_url(url),
                    'url': url,
                    'snippet': self._extract_context(content, url),
                    'source': 'content'
                })
                
        return {
            'results': results,
            'search_type': search_type,
            'total_results': len(results),
            'summary': content[:500] if content else None
        }
    
    def _extract_meta_info(self, html: str) -> Dict[str, str]:
        """Extract meta information from HTML"""
        
        meta = {}
        
        # Simple regex extraction (production would use BeautifulSoup)
        patterns = {
            'title': r'<title[^>]*>([^<]+)</title>',
            'description': r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
            'keywords': r'<meta\s+name=["\']keywords["\']\s+content=["\'](.*?)["\']',
            'og:type': r'<meta\s+property=["\']og:type["\']\s+content=["\'](.*?)["\']',
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                meta[key] = match.group(1)
                
        return meta
    
    def _extract_structured_data(self, html: str) -> List[Dict]:
        """Extract structured data (JSON-LD, microdata)"""
        
        structured = []
        
        # Extract JSON-LD
        json_ld_pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
        matches = re.findall(json_ld_pattern, html, re.IGNORECASE | re.DOTALL)
        
        for match in matches:
            try:
                data = json.loads(match)
                structured.append(data)
            except:
                pass
                
        return structured
    
    def _extract_business_info(self, html: str) -> Dict[str, Any]:
        """Extract business-relevant information from HTML"""
        
        info = {}
        
        # Pricing detection
        price_patterns = [
            r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:/\s*(?:mo|month|year|user))?',
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP)\s*(?:/\s*(?:mo|month|year|user))?'
        ]
        
        prices = []
        for pattern in price_patterns:
            matches = re.findall(pattern, html, re.IGNORECASE)
            prices.extend(matches)
            
        if prices:
            info['pricing'] = list(set(prices))[:10]
            
        # Customer count/testimonials
        customer_patterns = [
            r'(\d+(?:,\d{3})*)\+?\s*(?:customers|clients|users|companies)',
            r'trusted by\s*(\d+(?:,\d{3})*)',
            r'(\d+(?:,\d{3})*)\s*(?:businesses|organizations)'
        ]
        
        customers = []
        for pattern in customer_patterns:
            matches = re.findall(pattern, html, re.IGNORECASE)
            customers.extend(matches)
            
        if customers:
            info['customer_metrics'] = customers
            
        return info
    
    def _detect_cdn(self, headers: Dict) -> Optional[str]:
        """Detect CDN from headers"""
        
        cdn_headers = {
            'cloudflare': ['cf-ray', 'cf-cache-status'],
            'cloudfront': ['x-amz-cf-id', 'x-amz-cf-pop'],
            'akamai': ['x-akamai-transformed'],
            'fastly': ['x-served-by', 'x-cache-hits'],
            'azure': ['x-ms-request-id'],
        }
        
        for cdn, header_list in cdn_headers.items():
            if any(h.lower() in [k.lower() for k in headers.keys()] for h in header_list):
                return cdn
                
        return None
    
    def _detect_api_calls(self, content: str) -> List[str]:
        """Detect API endpoints in content"""
        
        api_patterns = [
            r'(?:fetch|axios|http|request)\s*\(\s*["\']([^"\']+api[^"\']*)["\']',
            r'(?:api|endpoint|url)\s*[:=]\s*["\']([^"\']+)["\']',
            r'https?://[^/]+/api/[^\s"\'>]+',
        ]
        
        apis = []
        for pattern in api_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            apis.extend(matches)
            
        return list(set(apis))[:20]
    
    def _detect_third_party(self, content: str) -> List[str]:
        """Detect third-party services"""
        
        services = []
        
        # Common third-party domains
        third_party_patterns = [
            r'(?:script|link|img)\s+[^>]*(?:src|href)=["\']https?://([^/\'"]+)',
            r'https?://([^/\s"\']+)(?:/[^\s"\']*)?',
        ]
        
        known_services = {
            'google-analytics.com': 'Google Analytics',
            'googletagmanager.com': 'Google Tag Manager',
            'segment.com': 'Segment',
            'intercom.io': 'Intercom',
            'stripe.com': 'Stripe',
            'sentry.io': 'Sentry',
            'datadog.com': 'Datadog',
            'amplitude.com': 'Amplitude',
            'mixpanel.com': 'Mixpanel',
        }
        
        for pattern in third_party_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                for domain, service in known_services.items():
                    if domain in match:
                        services.append(service)
                        
        return list(set(services))
    
    def _check_compliance_indicators(self, content: str) -> Dict[str, bool]:
        """Check for compliance indicators in content"""
        
        indicators = {
            'soc2': any(term in content.lower() for term in ['soc 2', 'soc2', 'soc ii']),
            'iso27001': any(term in content.lower() for term in ['iso 27001', 'iso27001', 'iso/iec 27001']),
            'gdpr': 'gdpr' in content.lower(),
            'hipaa': 'hipaa' in content.lower(),
            'pci': any(term in content.lower() for term in ['pci dss', 'pci-dss', 'payment card']),
            'privacy_policy': any(term in content.lower() for term in ['privacy policy', 'privacy-policy']),
            'terms_of_service': any(term in content.lower() for term in ['terms of service', 'terms-of-service']),
            'data_processing': 'data processing agreement' in content.lower(),
        }
        
        return indicators
    
    def _calculate_security_score(self, results: Dict) -> float:
        """Calculate overall security score"""
        
        score = 0.0
        max_score = 0.0
        
        # Security headers (40% weight)
        header_weight = 0.4
        for header, info in results['security_headers'].items():
            max_score += header_weight / len(results['security_headers'])
            if info['present']:
                score += header_weight / len(results['security_headers'])
                
        # SSL/TLS (20% weight)
        if results['ssl_info'].get('secure'):
            score += 0.2
        max_score += 0.2
        
        # Compliance indicators (40% weight)
        compliance_weight = 0.4
        compliance_items = results['compliance_indicators']
        if compliance_items:
            compliance_score = sum(1 for v in compliance_items.values() if v) / len(compliance_items)
            score += compliance_weight * compliance_score
        max_score += compliance_weight
        
        return (score / max_score) if max_score > 0 else 0.0
    
    async def _identify_hosting_provider(self, ip: str) -> Dict[str, str]:
        """Identify hosting provider from IP"""
        
        # This would normally use IP geolocation/ASN lookup
        # Simplified version checking IP ranges
        
        providers = {
            'aws': ['52.', '54.', '18.', '35.'],
            'google': ['35.', '104.', '130.', '172.217.'],
            'azure': ['13.', '40.', '52.', '104.'],
            'cloudflare': ['104.', '172.', '173.', '198.', '199.'],
        }
        
        for provider, prefixes in providers.items():
            if any(ip.startswith(prefix) for prefix in prefixes):
                return {'provider': provider, 'ip': ip}
                
        return {'provider': 'unknown', 'ip': ip}
    
    async def _check_cdn_usage(self, domain: str) -> Dict[str, Any]:
        """Check CDN usage for domain"""
        
        cdn_info = {
            'detected': False,
            'provider': None,
            'evidence': []
        }
        
        try:
            # Check DNS for CDN CNAMEs
            import socket
            
            # This would normally do proper DNS lookups
            # Simplified for example
            
            return cdn_info
            
        except:
            return cdn_info
            
    def _analyze_github_tech_stack(self, repos: List[Dict]) -> Dict[str, Any]:
        """Analyze technology stack from GitHub repos"""
        
        languages = {}
        topics = []
        
        for repo in repos:
            if repo['language']:
                languages[repo['language']] = languages.get(repo['language'], 0) + 1
            topics.extend(repo.get('topics', []))
            
        return {
            'primary_language': max(languages, key=languages.get) if languages else None,
            'all_languages': list(languages.keys()),
            'common_topics': list(set(topics)),
            'open_source_activity': len(repos) > 5,
            'engineering_culture': 'strong' if sum(r['stargazers_count'] for r in repos) > 100 else 'moderate'
        }
    
    def _extract_review_insights(self, search_results: List[Dict], platform: str) -> List[Dict]:
        """Extract review insights from search results"""
        
        reviews = []
        
        for result in search_results:
            snippet = result.get('snippet', '')
            
            # Extract rating if present
            rating_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:out of\s*)?/?5', snippet)
            rating = float(rating_match.group(1)) if rating_match else None
            
            # Extract review count
            count_match = re.search(r'(\d+(?:,\d{3})*)\s*reviews?', snippet, re.IGNORECASE)
            review_count = count_match.group(1) if count_match else None
            
            if rating or review_count:
                reviews.append({
                    'platform': platform,
                    'rating': rating,
                    'review_count': review_count,
                    'url': result.get('url'),
                    'snippet': snippet
                })
                
        return reviews
    
    def _analyze_reviews(self, reviews: List[Dict]) -> Dict[str, Any]:
        """Analyze aggregated reviews"""
        
        ratings = [r['rating'] for r in reviews if r.get('rating')]
        
        analysis = {
            'total_reviews': len(reviews),
            'average_rating': sum(ratings) / len(ratings) if ratings else 0,
            'rating_distribution': {},
            'platforms_found': list(set(r['platform'] for r in reviews)),
        }
        
        # Determine primary customer segment from snippets
        enterprise_keywords = ['enterprise', 'large company', 'fortune 500', 'corporate']
        smb_keywords = ['small business', 'startup', 'smb', 'small team']
        
        enterprise_count = sum(1 for r in reviews if any(k in r.get('snippet', '').lower() for k in enterprise_keywords))
        smb_count = sum(1 for r in reviews if any(k in r.get('snippet', '').lower() for k in smb_keywords))
        
        if enterprise_count > smb_count:
            analysis['primary_segment'] = 'enterprise'
        elif smb_count > enterprise_count:
            analysis['primary_segment'] = 'smb'
        else:
            analysis['primary_segment'] = 'mixed'
            
        return analysis
    
    def _extract_competitor_names(self, text: str, company: str) -> List[str]:
        """Extract competitor names from text"""
        
        competitors = []
        
        # Common patterns
        patterns = [
            rf'{company}\s+vs\.?\s+(\w+)',
            rf'(\w+)\s+vs\.?\s+{company}',
            rf'alternatives?\s+to\s+{company}[:\s]+([^.]+)',
            rf'competitors?\s+(?:of\s+)?{company}[:\s]+([^.]+)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Clean up and split if multiple
                names = re.split(r'[,&]|\s+and\s+', match)
                for name in names:
                    name = name.strip()
                    if len(name) > 2 and name.lower() != company.lower():
                        competitors.append(name)
                        
        return competitors
    
    async def _analyze_competitive_positioning(self, company: str, competitors: List[str], insights: List[Dict]) -> Dict[str, Any]:
        """Analyze competitive positioning"""
        
        positioning = {
            'market_leader': False,
            'market_position': 'unknown',
            'key_differentiators': [],
            'competitive_threats': []
        }
        
        # Look for leadership indicators
        leadership_terms = ['leader', 'leading', 'top', '#1', 'best', 'largest']
        for insight in insights:
            snippet = insight.get('snippet', '').lower()
            if company.lower() in snippet and any(term in snippet for term in leadership_terms):
                positioning['market_leader'] = True
                positioning['market_position'] = 'leader'
                break
                
        return positioning
    
    def _identify_competitive_advantages(self, insights: List[Dict]) -> List[str]:
        """Identify competitive advantages from market insights"""
        
        advantages = []
        
        advantage_keywords = {
            'pricing': ['cheaper', 'affordable', 'cost-effective', 'best value'],
            'features': ['more features', 'advanced', 'comprehensive', 'all-in-one'],
            'ease_of_use': ['easier', 'simple', 'intuitive', 'user-friendly'],
            'support': ['better support', 'customer service', '24/7', 'responsive'],
            'integration': ['integrations', 'ecosystem', 'platform', 'connects'],
        }
        
        for insight in insights:
            snippet = insight.get('snippet', '').lower()
            for advantage, keywords in advantage_keywords.items():
                if any(keyword in snippet for keyword in keywords):
                    advantages.append(advantage)
                    
        return list(set(advantages))
    
    def _identify_market_threats(self, insights: List[Dict]) -> List[str]:
        """Identify market threats"""
        
        threats = []
        
        threat_indicators = [
            'new competitor', 'disrupting', 'losing market share',
            'customer churn', 'switching to', 'moved from'
        ]
        
        for insight in insights:
            snippet = insight.get('snippet', '').lower()
            for indicator in threat_indicators:
                if indicator in snippet:
                    threats.append(f"Potential threat: {snippet[:100]}...")
                    break
                    
        return threats[:5]
    
    async def _check_builtwith(self, domain: str) -> Optional[Dict]:
        """Check BuiltWith-style technology detection"""
        
        # This would normally use BuiltWith API or similar
        # For now, return None
        return None
        
    async def _detect_from_headers(self, domain: str) -> Dict[str, List[str]]:
        """Detect technologies from HTTP headers"""
        
        detected = {
            'backend': [],
            'infrastructure': [],
            'security': []
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"https://{domain}") as response:
                    headers = dict(response.headers)
                    
                    # Server detection
                    server = headers.get('Server', '').lower()
                    if 'nginx' in server:
                        detected['infrastructure'].append('nginx')
                    elif 'apache' in server:
                        detected['infrastructure'].append('apache')
                    elif 'cloudflare' in server:
                        detected['infrastructure'].append('cloudflare')
                        
                    # Language detection
                    if 'x-powered-by' in headers:
                        powered_by = headers['x-powered-by'].lower()
                        if 'php' in powered_by:
                            detected['backend'].append('php')
                        elif 'express' in powered_by:
                            detected['backend'].append('node.js')
                            detected['backend'].append('express')
                            
                    # Framework detection
                    if 'x-aspnet-version' in headers:
                        detected['backend'].append('.net')
                        
        except:
            pass
            
        return detected
    
    async def _analyze_job_postings(self, company: str) -> List[str]:
        """Analyze job postings to infer tech stack"""
        
        # Search for job postings
        query = f'"{company}" "engineer" "developer" "requirements" site:linkedin.com OR site:indeed.com'
        results = await self.web_search({"query": query}, None)
        
        technologies = []
        
        if results.get('results'):
            for result in results['results'][:5]:
                snippet = result.get('snippet', '').lower()
                
                # Common technologies to look for
                tech_keywords = [
                    'python', 'java', 'javascript', 'typescript', 'go', 'golang',
                    'react', 'angular', 'vue', 'node.js', 'django', 'rails',
                    'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform',
                    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch'
                ]
                
                for tech in tech_keywords:
                    if tech in snippet:
                        technologies.append(tech)
                        
        return list(set(technologies))
    
    def _analyze_tech_stack_fit(self, tech_stack: Dict, state: Any) -> Dict[str, Any]:
        """Analyze tech stack fit for market and thesis"""
        
        analysis = {
            'modernity': 'unknown',
            'hiring_difficulty': 'unknown',
            'market_fit': 'unknown',
            'recommendations': []
        }
        
        # Flatten all technologies
        all_tech = []
        for category, techs in tech_stack.items():
            if isinstance(techs, list):
                all_tech.extend(techs)
                
        # Assess modernity
        modern_tech = ['react', 'vue', 'typescript', 'go', 'rust', 'kubernetes', 'serverless']
        legacy_tech = ['jquery', 'php', 'perl', 'cobol', 'vb6']
        
        modern_count = sum(1 for t in all_tech if any(m in t.lower() for m in modern_tech))
        legacy_count = sum(1 for t in all_tech if any(l in t.lower() for l in legacy_tech))
        
        if modern_count > legacy_count * 2:
            analysis['modernity'] = 'modern'
        elif legacy_count > modern_count:
            analysis['modernity'] = 'legacy'
        else:
            analysis['modernity'] = 'mixed'
            
        # Assess hiring difficulty
        popular_tech = ['python', 'javascript', 'java', 'react', 'node.js']
        niche_tech = ['erlang', 'haskell', 'clojure', 'cobol', 'fortran']
        
        popular_count = sum(1 for t in all_tech if any(p in t.lower() for p in popular_tech))
        niche_count = sum(1 for t in all_tech if any(n in t.lower() for n in niche_tech))
        
        if popular_count > niche_count * 3:
            analysis['hiring_difficulty'] = 'low'
        elif niche_count > 0:
            analysis['hiring_difficulty'] = 'high'
        else:
            analysis['hiring_difficulty'] = 'moderate'
            
        # Market fit based on thesis and target market
        if state:
            if state.investment_thesis == 'digital-transformation':
                if analysis['modernity'] == 'modern':
                    analysis['market_fit'] = 'strong'
                else:
                    analysis['market_fit'] = 'weak'
                    analysis['recommendations'].append('Modernize tech stack for transformation plays')
                    
            if state.market_position == 'enterprise':
                # Check for enterprise tech
                enterprise_tech = ['java', '.net', 'oracle', 'sap']
                has_enterprise_tech = any(e in t.lower() for t in all_tech for e in enterprise_tech)
                
                if has_enterprise_tech or 'security' in tech_stack:
                    analysis['market_fit'] = 'strong'
                else:
                    analysis['recommendations'].append('Consider enterprise-grade technologies')
                    
        return analysis
    
    def _extract_title_from_url(self, url: str) -> str:
        """Extract readable title from URL"""
        
        parsed = urlparse(url)
        domain = parsed.netloc.replace('www.', '')
        path = parsed.path.strip('/')
        
        if path:
            # Convert path to title-like format
            parts = path.split('/')[-1].replace('-', ' ').replace('_', ' ')
            return f"{parts.title()} - {domain}"
        else:
            return domain.title()
            
    def _extract_context(self, content: str, url: str) -> str:
        """Extract context around URL mention"""
        
        try:
            index = content.find(url)
            if index != -1:
                start = max(0, index - 100)
                end = min(len(content), index + 100)
                return "..." + content[start:end] + "..."
        except:
            pass
            
        return ""
    
    async def financial_collector(self, input_data: Dict[str, Any], state: Any) -> Dict[str, Any]:
        """
        Collect financial information about the company
        """
        company = input_data.get('company', state.company if state else '')
        
        # Search for financial information
        financial_queries = [
            f'"{company}" funding raised valuation',
            f'"{company}" revenue ARR growth',
            f'"{company}" series A B C funding',
            f'"{company}" financial results earnings'
        ]
        
        financial_data = {
            'company': company,
            'funding_rounds': [],
            'revenue_estimates': [],
            'valuation': None,
            'investors': [],
            'financial_highlights': []
        }
        
        for query in financial_queries:
            result = await self.web_search({'query': query, 'search_type': 'financial'}, state)
            
            if result.get('results'):
                for item in result['results']:
                    snippet = item.get('snippet', '')
                    
                    # Extract funding amounts
                    funding_matches = re.findall(r'\$(\d+(?:\.\d+)?)\s*(million|billion|M|B)', snippet, re.IGNORECASE)
                    for amount, unit in funding_matches:
                        multiplier = 1000000 if unit.lower() in ['million', 'm'] else 1000000000
                        financial_data['funding_rounds'].append({
                            'amount': float(amount) * multiplier,
                            'source': item.get('url'),
                            'context': snippet[:200]
                        })
                    
                    # Extract valuation
                    if 'valuation' in snippet.lower() and not financial_data['valuation']:
                        financial_data['valuation'] = snippet
                        
                    # Extract investor names
                    if 'led by' in snippet.lower() or 'investors' in snippet.lower():
                        financial_data['investors'].append(snippet)
                        
        return financial_data


# Create tool registry
def create_tool_registry(api_keys: Dict[str, str]) -> Dict:
    """Create tool registry with all implementations"""
    
    # Import ResearchTool enum here to avoid circular imports
    from intelligent_research_orchestrator import ResearchTool
    
    tools = ResearchTools(api_keys)
    
    return {
        ResearchTool.WEB_SEARCH: tools.web_search,
        ResearchTool.HTML_COLLECTOR: tools.html_collector,
        ResearchTool.HAR_CAPTURE: tools.har_capture,
        ResearchTool.SECURITY_SCANNER: tools.security_scanner,
        ResearchTool.NETWORK_ANALYZER: tools.network_analyzer,
        ResearchTool.GITHUB_ANALYZER: tools.github_analyzer,
        ResearchTool.FINANCIAL_COLLECTOR: tools.financial_collector,  # Would need implementation
        ResearchTool.REVIEW_AGGREGATOR: tools.review_aggregator,
        ResearchTool.COMPETITOR_ANALYZER: tools.competitor_analyzer,
        ResearchTool.TECH_STACK_ANALYZER: tools.tech_stack_analyzer,
    }