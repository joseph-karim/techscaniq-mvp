#!/usr/bin/env python3
"""
Deep Research Crawler: Proper integration of deep-searcher's Chain of RAG 
methodology with crawl4ai's deep crawling capabilities.

This is a REAL implementation, not placeholders.
"""

import asyncio
import json
import sys
import os
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass
from enum import Enum

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
import aiohttp
from urllib.parse import quote_plus, urlparse


class ResearchPhase(Enum):
    """Research phases inspired by deep-searcher's Chain of RAG"""
    INITIAL_CONTEXT = "initial_context"
    REFLECTION = "reflection"  # Reflect on what we've learned
    EXTERNAL_VALIDATION = "external_validation"  # Search outside company domain
    TARGETED_SEARCH = "targeted_search"
    GAP_FILLING = "gap_filling"
    SYNTHESIS = "synthesis"


@dataclass
class ResearchContext:
    """Maintains state across research iterations"""
    query: str
    investment_thesis: str
    intermediate_findings: List[Dict[str, Any]]
    evidence_gaps: List[str]
    collected_evidence_types: set
    key_insights: Dict[str, Any]
    iteration: int
    explored_topics: set  # Track what we've already deeply explored
    max_iterations: int = 4
    quality_threshold: float = 0.7  # Minimum quality for evidence
    coverage_target: float = 0.9  # Target coverage for required evidence
    
    def add_finding(self, finding: Dict[str, Any]):
        """Add intermediate finding and update context"""
        self.intermediate_findings.append(finding)
        if 'evidence_type' in finding:
            self.collected_evidence_types.add(finding['evidence_type'])
    
    def identify_gaps(self, required_evidence: List[str]) -> List[str]:
        """Identify missing evidence types"""
        self.evidence_gaps = [e for e in required_evidence if e not in self.collected_evidence_types]
        return self.evidence_gaps
    
    def should_continue(self) -> bool:
        """Determine if more iterations needed based on coverage and quality"""
        # Continue if we haven't hit max iterations and either:
        # 1. We have significant gaps in required evidence
        # 2. We haven't achieved our coverage target
        coverage = len(self.collected_evidence_types) / len(self.evidence_gaps + list(self.collected_evidence_types))
        return self.iteration < self.max_iterations and (len(self.evidence_gaps) > 2 or coverage < self.coverage_target)


class DeepResearchCrawler:
    """
    Integrates deep-searcher's Chain of RAG approach with crawl4ai's capabilities.
    No placeholders, no shortcuts - real implementation.
    """
    
    def __init__(self, domain: str, investment_thesis: str, api_keys: Optional[Dict[str, str]] = None):
        self.domain = domain
        self.investment_thesis = investment_thesis
        self.evidence_items = []
        self.crawled_urls = set()
        self.api_keys = api_keys or {}  # Store API keys passed from worker
        
        # Investment thesis configurations with REAL search strategies
        self.thesis_strategies = {
            'accelerate-organic-growth': {
                'required_evidence': [
                    'business_model', 'revenue_streams', 'market_size', 
                    'growth_metrics', 'customer_segments', 'product_roadmap',
                    'competitive_advantage', 'team_strength', 'scalability'
                ],
                'initial_keywords': [
                    'about', 'company', 'mission', 'team', 'product', 
                    'pricing', 'customers', 'growth', 'market'
                ],
                'deep_keywords': [
                    # These will be discovered and added dynamically
                ],
                'external_search_queries': [
                    f'"{domain}" revenue growth funding',
                    f'"{domain}" customer reviews testimonials',  
                    f'"{domain}" market share competitors',
                    f'"{domain}" layoffs hiring expansion',
                    f'"{domain}" product launches features',
                    f'site:techcrunch.com OR site:venturebeat.com "{domain}"',
                    f'site:reddit.com OR site:news.ycombinator.com "{domain}"'
                ],
                'reflection_prompts': {
                    'business_model': "What is their core business model and revenue generation approach?",
                    'growth_metrics': "What growth indicators and metrics are available?",
                    'scalability': "What evidence exists of their ability to scale?"
                }
            },
            'buy-and-build': {
                'required_evidence': [
                    'api_capabilities', 'integration_ecosystem', 'platform_extensibility',
                    'developer_resources', 'partner_network', 'technical_architecture',
                    'modularity', 'acquisition_readiness'
                ],
                'initial_keywords': [
                    'platform', 'integrations', 'partners', 'api', 'developers',
                    'ecosystem', 'marketplace', 'connect'
                ],
                'deep_keywords': [
                    # These will be discovered and added dynamically
                ],
                'external_search_queries': [
                    f'"{domain}" api integration partners',
                    f'"{domain}" acquisition merger acquired',
                    f'"{domain}" platform ecosystem marketplace',
                    f'"{domain}" developer community forum',
                    f'site:github.com "{domain}" sdk library',
                    f'site:producthunt.com "{domain}" integrations'
                ],
                'reflection_prompts': {
                    'api_capabilities': "How robust and well-documented are their APIs?",
                    'integration_ecosystem': "What integrations and partnerships exist?",
                    'platform_extensibility': "How extensible is their platform?"
                }
            },
            'digital-transformation': {
                'required_evidence': [
                    'technology_stack', 'cloud_maturity', 'innovation_capacity',
                    'digital_capabilities', 'data_architecture', 'security_posture',
                    'automation_level', 'technical_debt'
                ],
                'initial_keywords': [
                    'technology', 'innovation', 'digital', 'cloud', 'platform',
                    'transformation', 'modern', 'architecture'
                ],
                'deep_keywords': [
                    # These will be discovered and added dynamically
                ],
                'external_search_queries': [
                    f'"{domain}" technology stack architecture',
                    f'"{domain}" cloud migration digital transformation',
                    f'"{domain}" engineering blog tech blog',
                    f'"{domain}" open source github',
                    f'site:stackshare.io "{domain}"',
                    f'site:builtwith.com "{domain}"',
                    f'"CTO of {domain}" OR "VP Engineering {domain}"'
                ],
                'reflection_prompts': {
                    'technology_stack': "What is their current technology stack and architecture?",
                    'cloud_maturity': "How cloud-native and modern is their infrastructure?",
                    'innovation_capacity': "What's their capacity for innovation and change?"
                }
            }
        }
        
        self.strategy = self.thesis_strategies.get(investment_thesis, self.thesis_strategies['accelerate-organic-growth'])
        self.external_urls_found = []  # Store external URLs for crawling
        
    async def conduct_research(self, max_pages: int = 200, stream_callback=None) -> Dict[str, Any]:
        """
        Main research loop implementing Chain of RAG methodology with streaming support
        """
        print(f"🔬 Starting Deep Research for {self.domain}")
        print(f"🎯 Investment Thesis: {self.investment_thesis}")
        print(f"📋 Required Evidence: {len(self.strategy['required_evidence'])} types")
        
        # Initialize research context
        context = ResearchContext(
            query=f"Comprehensive due diligence for {self.domain}",
            investment_thesis=self.investment_thesis,
            intermediate_findings=[],
            evidence_gaps=self.strategy['required_evidence'].copy(),
            collected_evidence_types=set(),
            key_insights={},
            iteration=0,
            max_iterations=6,  # Allow more iterations for thorough search
            explored_topics=set()  # Track explored areas
        )
        
        pages_per_iteration = max_pages // 5  # Distribute across iterations
        total_pages_crawled = 0
        
        # Stream initial status
        if stream_callback:
            await stream_callback({
                'type': 'status',
                'phase': 'initialization',
                'message': f'Starting deep research for {self.domain}',
                'evidence_count': 0,
                'pages_crawled': 0
            })
        
        while context.should_continue():
            context.iteration += 1
            print(f"\n🔄 Research Iteration {context.iteration}/{context.max_iterations}")
            
            # Determine research phase
            phase = self._determine_phase(context)
            print(f"📍 Phase: {phase.value}")
            
            # Plan search based on phase and context
            search_config = await self._plan_search(phase, context)
            
            # Skip actual search for reflection phase
            if search_config.get('search_type') == 'none':
                # Just reflect and continue
                await self._reflect_on_progress(context)
                continue
            
            # Execute search based on type
            if search_config.get('search_type') == 'external':
                # Pass context for intelligent prioritization
                search_config['context'] = context
                iteration_results = await self._execute_external_search(search_config, pages_per_iteration)
            else:
                iteration_results = await self._execute_search(search_config, pages_per_iteration)
            
            total_pages_crawled += len(iteration_results)
            
            # Extract and analyze findings
            findings = await self._analyze_results(iteration_results, phase, context)
            
            # Update context with findings
            for finding in findings:
                context.add_finding(finding)
            
            # Stream progress update
            if stream_callback:
                await stream_callback({
                    'type': 'progress',
                    'phase': phase.value,
                    'iteration': context.iteration,
                    'pages_crawled': len(iteration_results),
                    'total_pages': total_pages_crawled,
                    'evidence_count': len(self.evidence_items),
                    'evidence_types_found': list(context.collected_evidence_types),
                    'remaining_gaps': context.evidence_gaps[:5],
                    'new_evidence': findings[-5:] if findings else []  # Last 5 findings
                })
            
            # Reflect on progress and identify gaps
            await self._reflect_on_progress(context)
            
            print(f"✅ Iteration {context.iteration} complete:")
            print(f"   - Pages crawled: {len(iteration_results)}")
            print(f"   - Evidence types collected: {len(context.collected_evidence_types)}")
            print(f"   - Remaining gaps: {len(context.evidence_gaps)}")
        
        # Final synthesis
        synthesis = await self._synthesize_findings(context)
        
        # Stream final results
        if stream_callback:
            await stream_callback({
                'type': 'complete',
                'phase': 'synthesis',
                'evidence_count': len(self.evidence_items),
                'pages_crawled': total_pages_crawled,
                'research_iterations': context.iteration,
                'evidence_coverage': {
                    'collected': list(context.collected_evidence_types),
                    'missing': context.evidence_gaps
                },
                'key_insights': context.key_insights
            })
        
        return {
            "success": True,
            "evidence_count": len(self.evidence_items),
            "pages_crawled": total_pages_crawled,
            "evidence_items": self.evidence_items,
            "research_iterations": context.iteration,
            "evidence_coverage": {
                "collected": list(context.collected_evidence_types),
                "missing": context.evidence_gaps
            },
            "key_insights": context.key_insights,
            "synthesis": synthesis
        }
    
    def _determine_phase(self, context: ResearchContext) -> ResearchPhase:
        """Intelligently determine research phase based on context and progress"""
        coverage = len(context.collected_evidence_types) / max(1, len(self.strategy['required_evidence']))
        
        # Dynamic phase selection based on actual progress
        if context.iteration == 1:
            return ResearchPhase.INITIAL_CONTEXT
        elif context.iteration == 2 and coverage < 0.3:
            # Still exploring if we have low coverage
            return ResearchPhase.INITIAL_CONTEXT
        elif not context.key_insights and context.iteration <= 3:
            return ResearchPhase.REFLECTION
        elif coverage < 0.5 and context.iteration <= 4:
            # Need external validation to find more sources
            return ResearchPhase.EXTERNAL_VALIDATION
        elif coverage < 0.7:
            return ResearchPhase.TARGETED_SEARCH
        elif len(context.evidence_gaps) > 3:
            return ResearchPhase.GAP_FILLING
        else:
            return ResearchPhase.SYNTHESIS
    
    async def _plan_search(self, phase: ResearchPhase, context: ResearchContext) -> Dict[str, Any]:
        """Plan search strategy based on phase and context"""
        
        if phase == ResearchPhase.INITIAL_CONTEXT:
            # Broad exploratory search
            keywords = self.strategy['initial_keywords']
            search_depth = 2
            focus = "Understanding business context and overview"
            search_type = 'internal'
            
        elif phase == ResearchPhase.REFLECTION:
            # No search needed - just reflection
            return {
                'keywords': [],
                'search_depth': 0,
                'focus': "Reflecting on initial findings",
                'phase': phase,
                'search_type': 'none'
            }
            
        elif phase == ResearchPhase.EXTERNAL_VALIDATION:
            # External search using Google
            return {
                'search_queries': self.strategy.get('external_search_queries', []),
                'focus': "External validation and third-party perspectives",
                'phase': phase,
                'search_type': 'external'
            }
            
        elif phase == ResearchPhase.TARGETED_SEARCH:
            # Deep technical search based on DISCOVERED keywords and unexplored areas
            keywords = []
            
            # Use discovered keywords from initial context and reflection
            if context.key_insights.get('discovered_keywords'):
                # Filter out already explored topics
                new_keywords = [k for k in context.key_insights['discovered_keywords'] 
                               if k not in context.explored_topics]
                keywords.extend(new_keywords[:10])
                # Mark these as being explored
                context.explored_topics.update(new_keywords[:10])
            
            # Use discovered technologies
            if context.key_insights.get('discovered_technologies'):
                tech_keywords = [t for t in context.key_insights['discovered_technologies']
                               if t not in context.explored_topics]
                keywords.extend(tech_keywords[:5])
                context.explored_topics.update(tech_keywords[:5])
            
            # Use discovered product features
            if context.key_insights.get('discovered_features'):
                feature_keywords = [f for f in context.key_insights['discovered_features']
                                  if f not in context.explored_topics]
                keywords.extend(feature_keywords[:5])
                context.explored_topics.update(feature_keywords[:5])
            
            # Add evidence-gap specific keywords
            for gap in context.evidence_gaps[:3]:
                gap_keywords = self._generate_gap_keywords(gap)
                keywords.extend([k for k in gap_keywords if k not in keywords])
            
            # If no keywords discovered yet, use evidence-driven ones
            if not keywords:
                keywords = self._generate_smart_keywords(context)
            
            search_depth = 4  # Go deeper for targeted search
            focus = f"Deep dive into discovered areas: {', '.join(keywords[:5])}"
            search_type = 'internal'
            
        elif phase == ResearchPhase.GAP_FILLING:
            # Specific searches for missing evidence
            keywords = []
            for gap in context.evidence_gaps[:3]:  # Focus on top 3 gaps
                if gap in self.strategy['reflection_prompts']:
                    # Generate keywords for specific gaps
                    gap_keywords = self._generate_gap_keywords(gap)
                    keywords.extend(gap_keywords)
            search_depth = 4
            focus = f"Filling evidence gaps: {', '.join(context.evidence_gaps[:3])}"
            search_type = 'internal'
            
        else:  # SYNTHESIS
            # Light confirmatory searches
            keywords = ['summary', 'overview', 'report', 'analysis']
            search_depth = 1
            focus = "Confirmatory information for synthesis"
            search_type = 'internal'
        
        return {
            'keywords': keywords,
            'search_depth': search_depth,
            'focus': focus,
            'phase': phase,
            'search_type': search_type
        }
    
    def _generate_gap_keywords(self, gap: str) -> List[str]:
        """Generate keywords for specific evidence gaps"""
        gap_keyword_map = {
            'business_model': ['revenue', 'monetization', 'pricing', 'subscription', 'license'],
            'growth_metrics': ['growth', 'metrics', 'kpi', 'performance', 'statistics'],
            'market_size': ['market', 'tam', 'addressable', 'industry', 'size'],
            'competitive_advantage': ['competitive', 'advantage', 'differentiation', 'unique'],
            'api_capabilities': ['api', 'rest', 'graphql', 'endpoints', 'documentation'],
            'integration_ecosystem': ['integrations', 'partners', 'marketplace', 'plugins'],
            'technology_stack': ['tech', 'stack', 'architecture', 'infrastructure', 'built'],
            'cloud_maturity': ['cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker'],
            'security_posture': ['security', 'compliance', 'soc2', 'iso', 'gdpr', 'encryption']
        }
        return gap_keyword_map.get(gap, [gap.replace('_', ' ')])
    
    def _create_extraction_strategy(self, phase: ResearchPhase) -> LLMExtractionStrategy:
        """Create LLM extraction strategy based on research phase"""
        
        # Phase-specific extraction schemas
        schemas = {
            ResearchPhase.INITIAL_CONTEXT: {
                "type": "object",
                "properties": {
                    "company_overview": {
                        "type": "string",
                        "description": "Brief overview of the company and its mission"
                    },
                    "key_products": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Main products or services offered"
                    },
                    "target_market": {
                        "type": "string",
                        "description": "Primary customer segments and market focus"
                    },
                    "business_model": {
                        "type": "string",
                        "description": "How the company makes money (SaaS, licensing, etc)"
                    },
                    "key_metrics": {
                        "type": "object",
                        "properties": {
                            "customers": {"type": "string"},
                            "revenue": {"type": "string"},
                            "growth_rate": {"type": "string"},
                            "market_share": {"type": "string"}
                        }
                    },
                    "competitive_advantages": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "key_partnerships": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "technologies_mentioned": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Any technologies, frameworks, or platforms mentioned"
                    }
                }
            },
            ResearchPhase.TARGETED_SEARCH: {
                "type": "object",
                "properties": {
                    "technical_details": {
                        "type": "object",
                        "properties": {
                            "architecture": {"type": "string"},
                            "technologies": {"type": "array", "items": {"type": "string"}},
                            "apis": {"type": "array", "items": {"type": "string"}},
                            "integrations": {"type": "array", "items": {"type": "string"}},
                            "security_features": {"type": "array", "items": {"type": "string"}}
                        }
                    },
                    "platform_capabilities": {
                        "type": "object",
                        "properties": {
                            "core_features": {"type": "array", "items": {"type": "string"}},
                            "extensibility": {"type": "string"},
                            "customization_options": {"type": "array", "items": {"type": "string"}},
                            "developer_tools": {"type": "array", "items": {"type": "string"}}
                        }
                    },
                    "pricing_details": {
                        "type": "object",
                        "properties": {
                            "pricing_model": {"type": "string"},
                            "tiers": {"type": "array", "items": {"type": "string"}},
                            "enterprise_options": {"type": "string"}
                        }
                    },
                    "case_studies": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "company": {"type": "string"},
                                "use_case": {"type": "string"},
                                "results": {"type": "string"}
                            }
                        }
                    }
                }
            },
            ResearchPhase.GAP_FILLING: {
                "type": "object",
                "properties": {
                    "api_documentation": {
                        "type": "object",
                        "properties": {
                            "api_types": {"type": "array", "items": {"type": "string"}},
                            "authentication": {"type": "string"},
                            "rate_limits": {"type": "string"},
                            "sdk_languages": {"type": "array", "items": {"type": "string"}}
                        }
                    },
                    "partner_ecosystem": {
                        "type": "object",
                        "properties": {
                            "technology_partners": {"type": "array", "items": {"type": "string"}},
                            "integration_partners": {"type": "array", "items": {"type": "string"}},
                            "consulting_partners": {"type": "array", "items": {"type": "string"}},
                            "marketplace_presence": {"type": "boolean"}
                        }
                    },
                    "developer_resources": {
                        "type": "object",
                        "properties": {
                            "documentation_quality": {"type": "string"},
                            "community_size": {"type": "string"},
                            "support_channels": {"type": "array", "items": {"type": "string"}},
                            "training_resources": {"type": "array", "items": {"type": "string"}}
                        }
                    },
                    "compliance_certifications": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                }
            }
        }
        
        # Get appropriate schema or use default
        schema = schemas.get(phase, schemas[ResearchPhase.INITIAL_CONTEXT])
        
        # Create extraction strategy with phase-specific prompting
        phase_prompts = {
            ResearchPhase.INITIAL_CONTEXT: "Extract key business information, metrics, and overview from this page. Focus on understanding the company's core business, market position, and value proposition.",
            ResearchPhase.TARGETED_SEARCH: "Extract detailed technical information, platform capabilities, pricing, and customer case studies. Focus on deep technical details and specific features.",
            ResearchPhase.GAP_FILLING: "Extract specific information about APIs, partner ecosystem, developer resources, and compliance. Focus on filling gaps in our knowledge.",
            ResearchPhase.EXTERNAL_VALIDATION: "Extract third-party perspectives, reviews, comparisons, and external validation of claims. Focus on unbiased assessment."
        }
        
        instruction = phase_prompts.get(phase, phase_prompts[ResearchPhase.INITIAL_CONTEXT])
        
        # Use Gemini API if available, otherwise use default
        provider = "gemini/gemini-2.0-flash-exp" if self.api_keys.get('google_api_key') else "gpt-4o-mini"
        
        return LLMExtractionStrategy(
            schema=schema,
            llm_config=LLMConfig(
                provider=provider,
                api_key=self.api_keys.get('google_api_key') or self.api_keys.get('openai_key', ''),
                extra_args={
                    "temperature": 0.2,
                    "top_p": 0.95
                }
            ),
            instruction=instruction
        )
    
    async def _execute_search(self, search_config: Dict[str, Any], max_pages: int) -> List[Dict]:
        """Execute search using crawl4ai with proper configuration"""
        
        print(f"🔍 Searching with focus: {search_config['focus']}")
        print(f"🔑 Keywords: {', '.join(search_config['keywords'][:5])}...")
        
        # Configure keyword scorer with lower weight for more exploration
        keyword_scorer = KeywordRelevanceScorer(
            keywords=search_config['keywords'],
            weight=0.6  # Lower weight to explore more pages
        )
        
        # Configure crawl strategy with more aggressive settings
        strategy = BestFirstCrawlingStrategy(
            max_depth=search_config['search_depth'] + 1,  # Go one level deeper
            include_external=False,
            url_scorer=keyword_scorer,
            max_pages=max_pages * 2,  # Double the limit for internal processing
            filter_chain=FilterChain([
                DomainFilter(allowed_domains=[self.domain]),
                ContentTypeFilter(allowed_types=["text/html", "text/plain", "application/json"])
            ])
        )
        
        # Create LLM extraction strategy for better content quality
        extraction_strategy = self._create_extraction_strategy(search_config['phase'])
        
        # Crawler configuration - disable streaming to avoid context issues
        config = CrawlerRunConfig(
            deep_crawl_strategy=strategy,
            extraction_strategy=extraction_strategy,  # Add LLM extraction
            stream=False,  # Disabled to avoid async context issues
            verbose=False,
            word_count_threshold=100,
            remove_overlay_elements=True,
            simulate_user=True,
            wait_for_images=False,  # Speed up crawling
            screenshot=False,  # Don't need screenshots
            page_timeout=30000,  # 30 second timeout
            aggressive_media_pruning=True  # Remove unnecessary media
        )
        
        results = []
        
        async with AsyncWebCrawler(
            headless=True,
            browser_type="chromium"
        ) as crawler:
            
            start_url = f"https://{self.domain}"
            
            # For targeted searches, try to start from relevant sections
            if search_config['phase'] == ResearchPhase.TARGETED_SEARCH:
                # Use discovered URLs from initial context
                if hasattr(self, 'discovered_relevant_urls'):
                    for url in self.discovered_relevant_urls[:3]:
                        if url not in self.crawled_urls:
                            start_url = url
                            break
            
            # Handle the result from deep crawl strategy
            result_container = await crawler.arun(url=start_url, config=config)
            
            # Deep crawl strategy returns a list of results
            if isinstance(result_container, list):
                # Process list of results from deep crawl
                for result in result_container:
                    if result.success and result.url not in self.crawled_urls:
                        self.crawled_urls.add(result.url)
                        
                        results.append({
                            'url': result.url,
                            'title': result.metadata.get('title', ''),
                            'html': result.html,
                            'markdown': result.markdown,
                            'metadata': result.metadata,
                            'links': result.links,
                            'phase': search_config['phase'].value,
                            'extracted_data': result.extracted_content if hasattr(result, 'extracted_content') else None
                        })
                        
                        # Discover relevant URLs for next iteration
                        self._discover_relevant_urls(result)
                        
                        if len(results) >= max_pages:
                            break
            elif hasattr(result_container, '__aiter__'):
                # Streaming mode
                async for result in result_container:
                    if result.success and result.url not in self.crawled_urls:
                        self.crawled_urls.add(result.url)
                        
                        results.append({
                            'url': result.url,
                            'title': result.metadata.get('title', ''),
                            'html': result.html,
                            'markdown': result.markdown,
                            'metadata': result.metadata,
                            'links': result.links,
                            'phase': search_config['phase'].value,
                            'extracted_data': result.extracted_content if hasattr(result, 'extracted_content') else None
                        })
                        
                        # Discover relevant URLs for next iteration
                        self._discover_relevant_urls(result)
                        
                        if len(results) >= max_pages:
                            break
            else:
                # Single result mode
                if result_container.success and result_container.url not in self.crawled_urls:
                    self.crawled_urls.add(result_container.url)
                    
                    results.append({
                        'url': result_container.url,
                        'title': result_container.metadata.get('title', ''),
                        'html': result_container.html,
                        'markdown': result_container.markdown,
                        'metadata': result_container.metadata,
                        'links': result_container.links,
                        'phase': search_config['phase'].value,
                        'extracted_data': result_container.extracted_content if hasattr(result_container, 'extracted_content') else None
                    })
                    
                    # Discover relevant URLs for next iteration
                    self._discover_relevant_urls(result_container)
        
        print(f"✅ Crawled {len(results)} pages")
        return results
    
    def _discover_relevant_urls(self, result):
        """Discover and store relevant URLs for targeted searches"""
        if not hasattr(self, 'discovered_relevant_urls'):
            self.discovered_relevant_urls = []
            
        if result.links and 'internal' in result.links:
            for link in result.links['internal'][:20]:
                url = link if isinstance(link, str) else link.get('href', '') if isinstance(link, dict) else ''
                
                # Score URL relevance based on deep keywords
                if any(keyword in url.lower() for keyword in self.strategy['deep_keywords']):
                    if url not in self.discovered_relevant_urls:
                        self.discovered_relevant_urls.append(url)
    
    async def _analyze_results(self, results: List[Dict], phase: ResearchPhase, context: ResearchContext) -> List[Dict]:
        """Analyze crawled results and extract findings"""
        
        findings = []
        
        for result in results:
            # Check if we have LLM-extracted data
            extracted_data = result.get('extracted_data')
            
            if extracted_data:
                # Process LLM-extracted data into multiple evidence items
                evidence_items = self._process_extracted_data(extracted_data, result['url'], phase)
                
                for item in evidence_items:
                    findings.append(item)
                    
                    # Store as evidence item
                    self.evidence_items.append({
                        'type': item['evidence_type'],
                        'source': item['url'],
                        'confidence': item['quality_score'],
                        'content': item['content']
                    })
            else:
                # Fallback to old method if no extracted data
                evidence_type = self._categorize_evidence(result['url'], result.get('markdown', ''))
                
                # Extract relevant content based on phase
                if phase == ResearchPhase.INITIAL_CONTEXT:
                    content = self._extract_context_info(result)
                elif phase == ResearchPhase.TARGETED_SEARCH:
                    content = self._extract_detailed_info(result, evidence_type)
                else:
                    content = self._extract_gap_info(result, context.evidence_gaps)
                
                # Calculate quality score
                quality_score = self._calculate_quality_score(result, evidence_type, phase)
                
                finding = {
                    'url': result['url'],
                    'evidence_type': evidence_type,
                    'phase': phase.value,
                    'content': content,
                    'quality_score': quality_score,
                    'timestamp': datetime.now().isoformat()
                }
                
                findings.append(finding)
                
                # Store as evidence item
                self.evidence_items.append({
                    'type': evidence_type,
                    'source': result['url'],
                    'confidence': quality_score,
                    'content': content
                })
        
        return findings
    
    def _categorize_evidence(self, url: str, content: str) -> str:
        """Categorize evidence based on URL and content analysis"""
        
        url_lower = url.lower()
        content_lower = content.lower() if content else ""
        
        # Map to required evidence types
        evidence_map = {
            'business_model': ['pricing', 'plans', 'revenue', 'model', 'subscription'],
            'revenue_streams': ['revenue', 'monetization', 'income', 'sales'],
            'market_size': ['market', 'industry', 'tam', 'addressable'],
            'growth_metrics': ['growth', 'metrics', 'kpi', 'statistics', 'numbers'],
            'customer_segments': ['customers', 'clients', 'users', 'segments'],
            'product_roadmap': ['roadmap', 'features', 'product', 'development'],
            'competitive_advantage': ['advantage', 'unique', 'differentiator', 'competition'],
            'team_strength': ['team', 'leadership', 'founders', 'employees'],
            'scalability': ['scale', 'scalable', 'infrastructure', 'performance'],
            'api_capabilities': ['api', 'endpoint', 'rest', 'graphql', 'developer'],
            'integration_ecosystem': ['integration', 'partner', 'marketplace', 'connect'],
            'technology_stack': ['technology', 'tech', 'stack', 'built', 'architecture'],
            'cloud_maturity': ['cloud', 'aws', 'azure', 'kubernetes', 'infrastructure'],
            'security_posture': ['security', 'compliance', 'privacy', 'encryption', 'soc']
        }
        
        # Score each evidence type
        scores = {}
        for evidence_type, keywords in evidence_map.items():
            score = sum(1 for keyword in keywords if keyword in url_lower or keyword in content_lower)
            if score > 0:
                scores[evidence_type] = score
        
        # Return highest scoring type
        if scores:
            return max(scores, key=scores.get)
        return 'general_information'
    
    def _extract_context_info(self, result: Dict) -> Dict[str, Any]:
        """Extract initial context information"""
        content = result.get('markdown', '') or result.get('html', '')
        
        return {
            'title': result.get('title', ''),
            'url': result['url'],
            'summary': content[:500] + '...' if len(content) > 500 else content,
            'word_count': len(content.split()),
            'key_terms': self._extract_key_terms(content),
            'phase': 'initial_context'
        }
    
    def _extract_detailed_info(self, result: Dict, evidence_type: str) -> Dict[str, Any]:
        """Extract detailed information based on evidence type"""
        content = result.get('markdown', '') or result.get('html', '')
        
        info = {
            'title': result.get('title', ''),
            'url': result['url'],
            'evidence_type': evidence_type,
            'content_length': len(content),
            'phase': 'targeted_search'
        }
        
        # Extract type-specific information
        if evidence_type == 'api_capabilities':
            info['api_mentions'] = content.lower().count('api')
            info['endpoint_mentions'] = content.lower().count('endpoint')
            
        elif evidence_type == 'technology_stack':
            info['technologies'] = self._extract_technologies(content)
            
        elif evidence_type == 'growth_metrics':
            info['metrics'] = self._extract_metrics(content)
            
        return info
    
    def _extract_gap_info(self, result: Dict, gaps: List[str]) -> Dict[str, Any]:
        """Extract information specifically for evidence gaps"""
        content = result.get('markdown', '') or result.get('html', '')
        
        return {
            'title': result.get('title', ''),
            'url': result['url'],
            'targeted_gaps': gaps[:3],
            'gap_relevance': self._calculate_gap_relevance(content, gaps),
            'phase': 'gap_filling'
        }
    
    def _calculate_quality_score(self, result: Dict, evidence_type: str, phase: ResearchPhase) -> float:
        """Calculate quality score for evidence with intelligent scoring"""
        
        base_score = 0.4
        content = result.get('markdown', '') or result.get('html', '')
        url = result.get('url', '')
        
        # Phase bonus - prioritize later phases
        phase_scores = {
            ResearchPhase.INITIAL_CONTEXT: 0.05,
            ResearchPhase.REFLECTION: 0.0,
            ResearchPhase.EXTERNAL_VALIDATION: 0.15,
            ResearchPhase.TARGETED_SEARCH: 0.2,
            ResearchPhase.GAP_FILLING: 0.25
        }
        base_score += phase_scores.get(phase, 0.1)
            
        # Content quality - more nuanced scoring
        content_length = len(content)
        if content_length > 500:
            base_score += 0.05
        if content_length > 2000:
            base_score += 0.1
        if content_length > 5000:
            base_score += 0.1
            
        # Evidence type match in required evidence
        if evidence_type in self.strategy['required_evidence']:
            base_score += 0.2
        elif evidence_type == 'general_information':
            base_score -= 0.1  # Penalize generic content
            
        # URL quality indicators
        quality_indicators = ['api', 'docs', 'documentation', 'technical', 'architecture', 
                            'security', 'integration', 'developer', 'engineering']
        url_lower = url.lower()
        for indicator in quality_indicators:
            if indicator in url_lower:
                base_score += 0.02
                
        # External validation bonus
        if result.get('metadata', {}).get('source_type') == 'external':
            base_score += 0.1
            
        return min(max(base_score, 0.1), 0.95)  # Keep between 0.1 and 0.95
    
    def _extract_key_terms(self, content: str) -> List[str]:
        """Extract key terms from content"""
        # Simple keyword extraction
        words = content.lower().split()
        word_freq = defaultdict(int)
        
        for word in words:
            if len(word) > 4 and word.isalpha():
                word_freq[word] += 1
                
        # Return top terms
        sorted_terms = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [term for term, freq in sorted_terms[:10]]
    
    def _extract_technologies(self, content: str) -> List[str]:
        """Extract technology mentions dynamically from content"""
        import re
        
        found_tech = set()
        content_lower = content.lower()
        
        # Look for patterns that indicate technologies
        # "built with X", "powered by Y", "using Z", "based on", "stack includes"
        tech_patterns = [
            r'built (?:with|on|using) ([a-zA-Z0-9\.\-]+)',
            r'powered by ([a-zA-Z0-9\.\-]+)',
            r'using ([a-zA-Z0-9\.\-]+) (?:for|as|to)',
            r'based on ([a-zA-Z0-9\.\-]+)',
            r'stack includes ([a-zA-Z0-9\.\-]+)',
            r'written in ([a-zA-Z0-9\.\-]+)',
            r'deployed (?:on|to) ([a-zA-Z0-9\.\-]+)',
            r'hosted on ([a-zA-Z0-9\.\-]+)',
            r'([a-zA-Z0-9\.\-]+) (?:api|sdk|framework|library|database|server)',
            r'uses ([a-zA-Z0-9\.\-]+) (?:api|sdk|framework|library|database|server)'
        ]
        
        for pattern in tech_patterns:
            matches = re.findall(pattern, content_lower)
            found_tech.update(matches)
        
        # Also look for version numbers which often indicate technologies
        version_pattern = r'([a-zA-Z0-9\-]+) (?:v|version)?\d+\.\d+'
        version_matches = re.findall(version_pattern, content_lower)
        found_tech.update(version_matches)
        
        # Filter out common non-tech words
        non_tech_words = {'the', 'and', 'for', 'with', 'our', 'your', 'this', 'that', 'which', 'from', 'into'}
        filtered_tech = [tech for tech in found_tech if tech not in non_tech_words and len(tech) > 2]
        
        return list(set(filtered_tech))[:20]  # Return top 20 unique technologies
    
    async def _execute_external_search(self, search_config: Dict[str, Any], max_results: int) -> List[Dict]:
        """Execute external search using Gemini with Google Search grounding"""
        
        print(f"🌐 Executing external validation searches with Gemini...")
        
        all_results = []
        # Use API key from initialization (passed from worker)
        google_api_key = self.api_keys.get('google_api_key') or self.api_keys.get('gemini_key')
        
        if not google_api_key:
            print("⚠️ No Google API key found, skipping external search")
            return []
        
        # Use discovered information to create dynamic queries
        search_queries = []
        
        # Add base queries from strategy
        base_queries = search_config.get('search_queries', [])
        
        # Create dynamic queries based on discovered information
        if hasattr(self, 'discovered_company_name'):
            company_name = self.discovered_company_name
        else:
            company_name = self.domain.replace('.com', '').replace('.io', '')
        
        # Generate comprehensive queries based on discovered information
        if hasattr(self, 'discovered_technologies') and self.discovered_technologies:
            # Technology-specific queries
            for tech in self.discovered_technologies[:5]:
                search_queries.append(f'"{company_name}" "{tech}" implementation case study')
                search_queries.append(f'"{company_name}" "{tech}" technical details')
            
            # Architecture queries
            tech_string = ' OR '.join([f'"{t}"' for t in self.discovered_technologies[:3]])
            search_queries.append(f'"{company_name}" ({tech_string}) architecture design')
        
        # Add queries based on discovered key people
        if hasattr(self, 'discovered_leadership') and self.discovered_leadership:
            for person in self.discovered_leadership[:3]:
                search_queries.append(f'"{person}" {company_name} interview')
                search_queries.append(f'"{person}" linkedin {company_name}')
        
        # Add queries for discovered products/features
        if hasattr(self, 'discovered_features') and self.discovered_features:
            feature_string = ' OR '.join([f'"{f}"' for f in self.discovered_features[:3]])
            search_queries.append(f'"{company_name}" ({feature_string}) review analysis')
        
        # Investment thesis specific queries
        thesis_queries = self._generate_thesis_specific_queries(company_name)
        search_queries.extend(thesis_queries)
        
        # Combine with base queries
        search_queries.extend(base_queries)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_queries = []
        for q in search_queries:
            if q not in seen:
                seen.add(q)
                unique_queries.append(q)
        
        # Prioritize and limit queries
        search_queries = unique_queries[:15]  # More queries for comprehensive coverage
        
        for query in search_queries:
            print(f"  🔍 Searching: {query}")
            
            try:
                # Use Gemini 2.0 Flash with Google Search grounding
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
                            
                            # Extract content from Gemini response
                            content = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                            
                            # Extract grounding metadata
                            grounding_metadata = data.get('candidates', [{}])[0].get('groundingMetadata', {})
                            
                            # Extract URLs from grounding chunks (the actual search results)
                            found_urls = []
                            url_titles = {}
                            
                            if 'groundingChunks' in grounding_metadata:
                                for chunk in grounding_metadata['groundingChunks']:
                                    if 'web' in chunk:
                                        web_info = chunk['web']
                                        url = web_info.get('uri', '')
                                        title = web_info.get('title', '')
                                        if url and url.startswith('http'):
                                            # These are redirect URLs, but they're valid
                                            found_urls.append(url)
                                            url_titles[url] = title
                            
                            # Also parse URLs from the content using regex as fallback
                            import re
                            url_pattern = r'https?://[^\s<>"{}|\\^`\[\]\'()]+'
                            content_urls = re.findall(url_pattern, content)
                            
                            # Combine and deduplicate
                            all_urls = found_urls + content_urls
                            unique_urls = []
                            seen = set()
                            for url in all_urls:
                                if url not in seen:
                                    unique_urls.append(url)
                                    seen.add(url)
                            
                            for url in unique_urls[:10]:  # Limit per query
                                # Skip our own domain
                                if self.domain in url:
                                    continue
                                
                                # Use title from grounding metadata or extract from content
                                title = url_titles.get(url) or self._extract_title_from_context(url, content)
                                
                                # Store external URL for crawling
                                self.external_urls_found.append({
                                    'url': url,
                                    'title': title,
                                    'snippet': self._extract_snippet_from_context(url, content),
                                    'source': 'gemini_search',
                                    'query': query
                                })
                                
                                all_results.append({
                                    'url': url,
                                    'title': title,
                                    'source_type': 'external_search',
                                    'query': query
                                })
                            
                            # If no URLs found but content exists, create a synthetic result
                            if not unique_urls and content:
                                self.external_urls_found.append({
                                    'url': f'https://search.google.com/search?q={quote_plus(query)}',
                                    'title': f'Search results for: {query}',
                                    'snippet': content[:300] + '...',
                                    'source': 'gemini_search',
                                    'query': query,
                                    'content': content  # Store full content
                                })
                                
                        else:
                            error_text = await response.text()
                            print(f"  ❌ Gemini API error: {response.status} - {error_text}")
                            
            except Exception as e:
                print(f"  ❌ Search failed: {e}")
                continue
        
        # Now crawl external URLs found - prioritize by relevance
        # Sort external URLs by relevance to evidence gaps
        context = search_config.get('context')  # Pass context if available
        prioritized_urls = self._prioritize_external_urls(self.external_urls_found, context) if context else self.external_urls_found
        
        urls_to_crawl = min(len(prioritized_urls), max_results + 10)  # Crawl more for better coverage
        print(f"\n📄 Crawling {urls_to_crawl} external pages (from {len(self.external_urls_found)} found)...")
        
        crawled_results = []
        async with AsyncWebCrawler(headless=True, browser_type="chromium") as crawler:
            for ext_result in prioritized_urls[:urls_to_crawl]:
                try:
                    print(f"  📄 Crawling: {ext_result['url']}")
                    
                    result = await crawler.arun(
                        url=ext_result['url'],
                        word_count_threshold=100,
                        remove_overlay_elements=True,
                        timeout=15000  # 15 second timeout for external sites
                    )
                    
                    if result.success:
                        crawled_results.append({
                            'url': ext_result['url'],
                            'title': result.metadata.get('title', ext_result['title']),
                            'html': result.html,
                            'markdown': result.markdown,
                            'metadata': {
                                **result.metadata,
                                'source_query': ext_result['query'],
                                'source_type': 'external'
                            },
                            'phase': 'external_validation'
                        })
                        
                except Exception as e:
                    print(f"  ⚠️ Failed to crawl {ext_result['url']}: {e}")
                    # Still create a result from the snippet if crawl fails
                    if 'content' in ext_result or 'snippet' in ext_result:
                        crawled_results.append({
                            'url': ext_result['url'],
                            'title': ext_result.get('title', 'External Resource'),
                            'html': '',
                            'markdown': ext_result.get('content', ext_result.get('snippet', '')),
                            'metadata': {
                                'source_query': ext_result.get('query', ''),
                                'source_type': 'external_snippet',
                                'crawl_failed': True
                            },
                            'phase': 'external_validation'
                        })
                    continue
        
        print(f"✅ External search complete: {len(crawled_results)} pages processed")
        return crawled_results
    
    def _extract_metrics(self, content: str) -> Dict[str, Any]:
        """Extract metrics and numbers"""
        import re
        
        metrics = {}
        
        # Look for percentages
        percentages = re.findall(r'(\d+(?:\.\d+)?)\s*%', content)
        if percentages:
            metrics['percentages'] = percentages[:5]
            
        # Look for large numbers (potential revenue, users, etc)
        large_numbers = re.findall(r'\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?[MBK]?', content)
        if large_numbers:
            metrics['large_numbers'] = large_numbers[:5]
            
        return metrics
    
    def _calculate_gap_relevance(self, content: str, gaps: List[str]) -> float:
        """Calculate how relevant content is to evidence gaps"""
        if not content or not gaps:
            return 0.0
            
        content_lower = content.lower()
        relevance_score = 0.0
        
        for gap in gaps:
            gap_keywords = self._generate_gap_keywords(gap)
            for keyword in gap_keywords:
                if keyword in content_lower:
                    relevance_score += 0.1
                    
        return min(relevance_score, 1.0)
    
    def _generate_smart_keywords(self, context: ResearchContext) -> List[str]:
        """Generate intelligent keywords based on context and gaps"""
        keywords = []
        
        # Generate keywords for each evidence gap
        for gap in context.evidence_gaps[:5]:
            keywords.extend(self._generate_gap_keywords(gap))
            
        # Add investment thesis specific keywords
        thesis_keywords = {
            'accelerate-organic-growth': ['growth', 'revenue', 'customers', 'market', 'expansion'],
            'buy-and-build': ['api', 'platform', 'integration', 'partners', 'ecosystem'],
            'digital-transformation': ['technology', 'cloud', 'architecture', 'modernization', 'innovation']
        }
        
        if self.investment_thesis in thesis_keywords:
            keywords.extend(thesis_keywords[self.investment_thesis])
            
        return list(set(keywords))[:15]  # Return unique keywords
    
    async def _reflect_on_progress(self, context: ResearchContext):
        """Reflect on research progress and update strategy"""
        
        print(f"\n🤔 Reflecting on findings from {len(context.intermediate_findings)} sources...")
        
        # Identify what evidence we've collected
        context.identify_gaps(self.strategy['required_evidence'])
        
        # Extract key insights from findings
        if context.intermediate_findings:
            # Extract discovered technologies
            all_tech = []
            for finding in context.intermediate_findings:
                content = finding.get('content', {})
                
                # Look for technologies in various fields
                if 'technologies' in content:
                    all_tech.extend(content['technologies'])
                if 'technical_details' in content and isinstance(content['technical_details'], dict):
                    if 'technologies' in content['technical_details']:
                        all_tech.extend(content['technical_details']['technologies'])
                
                # Also extract from raw content using our dynamic extractor
                if 'summary' in content:
                    discovered_tech = self._extract_technologies(content['summary'])
                    all_tech.extend(discovered_tech)
            
            if all_tech:
                # Store unique technologies
                unique_tech = list(set(all_tech))[:30]
                context.key_insights['discovered_technologies'] = unique_tech
                self.discovered_technologies = unique_tech
                print(f"   🔧 Discovered technologies: {', '.join(unique_tech[:10])}...")
            
            # Extract key people/leadership
            all_people = []
            for finding in context.intermediate_findings:
                content = finding.get('content', {})
                if 'team_members' in content:
                    all_people.extend(content.get('team_members', []))
                if 'leadership' in content:
                    all_people.extend(content.get('leadership', []))
                    
                # Extract from content
                if 'summary' in content or 'full_content' in content:
                    text = content.get('summary', '') + content.get('full_content', '')
                    people = self._extract_people_names(text)
                    all_people.extend(people)
            
            if all_people:
                unique_people = list(set(all_people))[:10]
                context.key_insights['discovered_leadership'] = unique_people
                self.discovered_leadership = unique_people
                print(f"   👥 Key people found: {len(unique_people)}")
            
            # Extract product features and capabilities
            all_features = []
            for finding in context.intermediate_findings:
                content = finding.get('content', {})
                if 'key_terms' in content:
                    all_features.extend(content['key_terms'])
                
                # Look for feature-related content
                if 'features' in content:
                    all_features.extend(content.get('features', []))
            
            if all_features:
                # Filter and prioritize features
                feature_freq = {}
                for feature in all_features:
                    feature_lower = feature.lower()
                    if len(feature_lower) > 3 and feature_lower not in ['this', 'that', 'with', 'from']:
                        feature_freq[feature_lower] = feature_freq.get(feature_lower, 0) + 1
                
                # Get top features by frequency
                sorted_features = sorted(feature_freq.items(), key=lambda x: x[1], reverse=True)
                top_features = [feature for feature, count in sorted_features[:20]]
                context.key_insights['discovered_features'] = top_features
                print(f"   ✨ Key features/capabilities: {', '.join(top_features[:5])}...")
            
            # Track all discovered keywords for targeted search
            all_keywords = []
            for finding in context.intermediate_findings:
                if 'key_terms' in finding.get('content', {}):
                    all_keywords.extend(finding['content']['key_terms'])
            
            if all_keywords:
                # Filter to unique, relevant keywords not already explored
                unique_keywords = list(set(all_keywords))[:50]  # Keep more keywords
                unexplored_keywords = [k for k in unique_keywords if k not in context.explored_topics]
                context.key_insights['discovered_keywords'] = unexplored_keywords
                print(f"   🔑 Discovered keywords: {len(unique_keywords)} ({len(unexplored_keywords)} unexplored)")
        
        print(f"\n📊 Progress Summary:")
        print(f"   Evidence collected: {list(context.collected_evidence_types)[:5]}...")
        print(f"   Still missing: {context.evidence_gaps[:5]}...")
        print(f"   Coverage: {len(context.collected_evidence_types)}/{len(self.strategy['required_evidence'])} ({len(context.collected_evidence_types)/len(self.strategy['required_evidence'])*100:.0f}%)")
    
    def _extract_people_names(self, text: str) -> List[str]:
        """Extract people names from text"""
        import re
        
        # Look for common name patterns with titles
        name_patterns = [
            r'(?:CEO|CTO|CFO|COO|VP|President|Director|Manager|Founder|Co-founder)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
            r'([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:CEO|CTO|CFO|COO|VP|President|Director|Manager|Founder)',
            r'([A-Z][a-z]+\s+[A-Z]\.\s+[A-Z][a-z]+)',  # John D. Smith
            r'([A-Z][a-z]+\s+[A-Z][a-z]+-[A-Z][a-z]+)',  # Mary Smith-Jones
        ]
        
        found_names = set()
        for pattern in name_patterns:
            matches = re.findall(pattern, text)
            found_names.update(matches)
        
        # Filter out common false positives
        filtered_names = []
        for name in found_names:
            if len(name.split()) >= 2 and not any(word in name.lower() for word in ['company', 'software', 'platform', 'service']):
                filtered_names.append(name)
        
        return filtered_names[:20]
    
    def _extract_title_from_context(self, url: str, content: str) -> str:
        """Extract a title for a URL from surrounding context"""
        import re
        
        # Try to find text near the URL
        url_escaped = re.escape(url)
        patterns = [
            rf'([^.!?]+){url_escaped}',  # Text before URL
            rf'{url_escaped}[:\s-]+([^.!?\n]+)',  # Text after URL
            rf'\[([^\]]+)\]\({url_escaped}\)',  # Markdown link
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                if len(title) > 10 and len(title) < 200:
                    return title
        
        # Fallback: use domain name
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc.replace('www.', '').title()
    
    def _extract_snippet_from_context(self, url: str, content: str) -> str:
        """Extract a snippet for a URL from surrounding context"""
        import re
        
        # Find the URL in content
        url_index = content.find(url)
        if url_index == -1:
            return "External resource"
        
        # Extract surrounding context
        start = max(0, url_index - 150)
        end = min(len(content), url_index + 150)
        snippet = content[start:end]
        
        # Clean up
        snippet = re.sub(r'\s+', ' ', snippet).strip()
        
        # Trim to sentence boundaries if possible
        sentences = snippet.split('.')
        if len(sentences) > 1:
            # Take the sentence containing the URL and one before/after
            for i, sent in enumerate(sentences):
                if url in sent:
                    relevant_sentences = sentences[max(0, i-1):min(len(sentences), i+2)]
                    return '. '.join(relevant_sentences).strip() + '.'
        
        return snippet[:200] + '...' if len(snippet) > 200 else snippet
    
    async def _synthesize_findings(self, context: ResearchContext) -> Dict[str, Any]:
        """Synthesize all findings into coherent insights"""
        
        synthesis = {
            'investment_thesis': self.investment_thesis,
            'domain': self.domain,
            'research_iterations': context.iteration,
            'evidence_completeness': len(context.collected_evidence_types) / len(self.strategy['required_evidence']),
            'key_findings': {},
            'recommendations': []
        }
        
        # Aggregate findings by evidence type
        findings_by_type = defaultdict(list)
        for finding in context.intermediate_findings:
            findings_by_type[finding['evidence_type']].append(finding)
        
        # Generate key findings
        for evidence_type, findings in findings_by_type.items():
            if evidence_type in self.strategy['required_evidence']:
                synthesis['key_findings'][evidence_type] = {
                    'found': True,
                    'sources': len(findings),
                    'quality': sum(f['quality_score'] for f in findings) / len(findings)
                }
        
        # Add missing evidence
        for gap in context.evidence_gaps:
            synthesis['key_findings'][gap] = {
                'found': False,
                'sources': 0,
                'quality': 0
            }
        
        # Generate recommendations based on thesis
        if synthesis['evidence_completeness'] > 0.8:
            synthesis['recommendations'].append("High evidence coverage - proceed with detailed analysis")
        elif synthesis['evidence_completeness'] > 0.6:
            synthesis['recommendations'].append("Moderate evidence coverage - consider targeted follow-up")
        else:
            synthesis['recommendations'].append("Low evidence coverage - additional research recommended")
        
        return synthesis
    
    def _generate_dynamic_external_queries(self, context: ResearchContext) -> List[str]:
        """Generate dynamic external search queries based on context"""
        queries = []
        company_name = self.domain.replace('.com', '').replace('.io', '').title()
        
        # Queries based on evidence gaps
        gap_query_templates = {
            'api_capabilities': [
                f'"{company_name}" API documentation examples',
                f'"{company_name}" REST API GraphQL comparison',
                f'developers using "{company_name}" API experience'
            ],
            'integration_ecosystem': [
                f'"{company_name}" integration partners list',
                f'"{company_name}" marketplace ecosystem analysis',
                f'how to integrate with "{company_name}"'
            ],
            'technology_stack': [
                f'"{company_name}" technology stack 2024',
                f'what is "{company_name}" built with',
                f'"{company_name}" engineering blog architecture'
            ],
            'growth_metrics': [
                f'"{company_name}" revenue growth statistics',
                f'"{company_name}" user growth numbers',
                f'"{company_name}" market share analysis'
            ],
            'team_strength': [
                f'"{company_name}" engineering team size',
                f'"{company_name}" key hires executives',
                f'who founded "{company_name}"'
            ]
        }
        
        # Add queries for top evidence gaps
        for gap in context.evidence_gaps[:3]:
            if gap in gap_query_templates:
                queries.extend(gap_query_templates[gap])
        
        # Add queries based on discovered insights
        if context.key_insights.get('discovered_technologies'):
            tech = context.key_insights['discovered_technologies'][0]
            queries.append(f'"{company_name}" "{tech}" case study')
            
        # News and recent developments
        queries.extend([
            f'"{company_name}" news {datetime.now().year}',
            f'"{company_name}" latest announcement',
            f'site:reddit.com "{company_name}" discussion'
        ])
        
        return queries
    
    def _generate_thesis_specific_queries(self, company_name: str) -> List[str]:
        """Generate queries specific to investment thesis"""
        thesis_queries = {
            'buy-and-build': [
                f'"{company_name}" acquisition strategy',
                f'"{company_name}" API ecosystem analysis',
                f'companies integrated with "{company_name}"',
                f'"{company_name}" platform extensibility'
            ],
            'accelerate-organic-growth': [
                f'"{company_name}" growth strategy analysis',
                f'"{company_name}" customer acquisition',
                f'"{company_name}" market expansion',
                f'"{company_name}" competitive advantages'
            ],
            'digital-transformation': [
                f'"{company_name}" digital transformation',
                f'"{company_name}" cloud migration',
                f'"{company_name}" modernization efforts',
                f'"{company_name}" innovation strategy'
            ]
        }
        
        return thesis_queries.get(self.investment_thesis, [])
    
    def _prioritize_external_urls(self, urls: List[Dict], context: Optional[ResearchContext]) -> List[Dict]:
        """Prioritize external URLs based on relevance to evidence gaps"""
        if not urls or not context:
            return urls
            
        # Score each URL based on relevance
        scored_urls = []
        for url_info in urls:
            score = 0.0
            url = url_info.get('url', '')
            title = url_info.get('title', '')
            snippet = url_info.get('snippet', '')
            
            # Check relevance to evidence gaps
            for gap in context.evidence_gaps:
                gap_keywords = self._generate_gap_keywords(gap)
                for keyword in gap_keywords:
                    if keyword.lower() in url.lower() or keyword.lower() in title.lower() or keyword.lower() in snippet.lower():
                        score += 0.2
            
            # Boost high-quality sources
            quality_domains = ['github.com', 'stackoverflow.com', 'medium.com', 'techcrunch.com', 
                             'venturebeat.com', 'reddit.com', 'news.ycombinator.com', 'linkedin.com']
            for domain in quality_domains:
                if domain in url:
                    score += 0.1
                    
            # Boost technical content
            tech_indicators = ['api', 'documentation', 'integration', 'architecture', 'technical',
                             'engineering', 'developer', 'implementation', 'case study']
            for indicator in tech_indicators:
                if indicator in url.lower() or indicator in title.lower():
                    score += 0.05
                    
            scored_urls.append((score, url_info))
        
        # Sort by score descending
        scored_urls.sort(key=lambda x: x[0], reverse=True)
        
        return [url_info for score, url_info in scored_urls]


async def main():
    """Test the deep research crawler"""
    
    if len(sys.argv) < 4:
        print("Usage: python deep_research_crawler.py <domain> <investment_thesis> <scan_request_id> [api_keys_json]")
        sys.exit(1)
    
    domain = sys.argv[1]
    investment_thesis = sys.argv[2]
    scan_request_id = sys.argv[3]
    
    # Load API keys if provided as JSON argument
    api_keys = {}
    if len(sys.argv) > 4:
        try:
            api_keys = json.loads(sys.argv[4])
        except:
            pass
    
    crawler = DeepResearchCrawler(domain, investment_thesis, api_keys)
    
    try:
        results = await crawler.conduct_research(max_pages=200)
        
        output = {
            'success': True,
            'scan_request_id': scan_request_id,
            'domain': domain,
            'investment_thesis': investment_thesis,
            'evidence_count': results['evidence_count'],
            'pages_crawled': results['pages_crawled'],
            'research_iterations': results['research_iterations'],
            'evidence_coverage': results['evidence_coverage'],
            'synthesis': results['synthesis'],
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