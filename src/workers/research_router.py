#!/usr/bin/env python3
"""
Research Router with Extended Thinking
Uses LLM with extended thinking to make intelligent routing decisions
based on investment thesis, market analysis, and discovered information.
"""

import asyncio
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import anthropic
from enum import Enum


class ResearchDecision(Enum):
    """Types of routing decisions"""
    PHASE_SELECTION = "phase_selection"
    EVIDENCE_PRIORITIZATION = "evidence_prioritization"
    SEARCH_STRATEGY = "search_strategy"
    MARKET_TECH_ALIGNMENT = "market_tech_alignment"
    SYNTHESIS_READINESS = "synthesis_readiness"


@dataclass
class RoutingContext:
    """Context for routing decisions"""
    investment_thesis: str
    company_domain: str
    current_phase: str
    evidence_collected: Dict[str, List[Any]]
    key_insights: Dict[str, Any]
    iteration: int
    coverage: float
    discovered_market_position: Optional[str] = None
    discovered_technologies: Optional[List[str]] = None
    discovered_competitors: Optional[List[str]] = None
    

class ResearchRouter:
    """
    Intelligent router that uses extended thinking to make research decisions
    based on deep understanding of investment thesis and market dynamics
    """
    
    def __init__(self, anthropic_api_key: str):
        self.client = anthropic.Anthropic(api_key=anthropic_api_key)
        
    async def make_routing_decision(
        self, 
        decision_type: ResearchDecision,
        context: RoutingContext
    ) -> Dict[str, Any]:
        """
        Use extended thinking to make intelligent routing decisions
        """
        
        # Build the prompt based on decision type
        prompt = self._build_decision_prompt(decision_type, context)
        
        # Use Claude with extended thinking
        response = self.client.messages.create(
            model="claude-3-opus-20240229",  # Use Opus for best reasoning
            max_tokens=4000,
            temperature=0.2,  # Lower temperature for more consistent decisions
            system="""You are an expert investment analyst and technical due diligence specialist. 
            Use extended thinking to deeply analyze the relationships between business models, 
            target markets, and technical requirements. Consider how different customer segments 
            (enterprise vs SMB) require different technical capabilities and compliance standards.""",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        # Parse the response
        try:
            decision = json.loads(response.content[0].text)
            return decision
        except json.JSONDecodeError:
            # Fallback to text parsing
            return self._parse_text_response(response.content[0].text)
    
    def _build_decision_prompt(self, decision_type: ResearchDecision, context: RoutingContext) -> str:
        """Build specific prompts for different decision types"""
        
        base_context = f"""
Investment Thesis: {context.investment_thesis}
Company: {context.company_domain}
Current Phase: {context.current_phase}
Research Iteration: {context.iteration}
Evidence Coverage: {context.coverage:.1%}

Key Discoveries:
- Market Position: {context.discovered_market_position or 'Unknown'}
- Technologies: {', '.join(context.discovered_technologies[:5]) if context.discovered_technologies else 'None discovered'}
- Competitors: {', '.join(context.discovered_competitors[:3]) if context.discovered_competitors else 'None identified'}

Evidence Collected:
{self._format_evidence_summary(context.evidence_collected)}
"""
        
        if decision_type == ResearchDecision.PHASE_SELECTION:
            return f"""{base_context}

Please analyze the current research state and determine the best next phase. Consider:

1. What critical evidence is still missing for the {context.investment_thesis} thesis?
2. Based on discovered market position, what specific evidence becomes more important?
3. If they target enterprise customers, do we have evidence of enterprise features (SOC2, SSO, audit logs)?
4. If they target SMB/startups, do we have evidence of self-service and ease of use?
5. Should we go deeper on technology assessment or market analysis next?

Think through the relationships between:
- Their target market and required technical capabilities
- Their business model and growth potential
- Their competitive position and differentiation

Return a JSON object with:
{{
    "recommended_phase": "phase_name",
    "reasoning": "detailed explanation",
    "priority_evidence": ["evidence_type1", "evidence_type2"],
    "specific_searches": ["search_query1", "search_query2"],
    "market_tech_insights": "analysis of market-tech alignment"
}}
"""
        
        elif decision_type == ResearchDecision.EVIDENCE_PRIORITIZATION:
            return f"""{base_context}

Based on the investment thesis '{context.investment_thesis}' and discovered market position, 
prioritize which evidence types are most critical to collect next.

Consider:
1. For {context.investment_thesis}, what evidence directly impacts investment decision?
2. Given their market (enterprise/SMB/mixed), what technical validations are crucial?
3. What evidence gaps could be deal-breakers if negative?
4. What positive signals would most strongly support the investment thesis?

Think about market-specific requirements:
- Enterprise: Security certifications, scalability, support SLAs, integration capabilities
- SMB: Ease of adoption, pricing transparency, self-service capabilities
- Developer tools: API quality, documentation, community support

Return a JSON object with:
{{
    "priority_evidence": [
        {{
            "type": "evidence_type",
            "importance": "critical|high|medium",
            "reasoning": "why this matters for the thesis",
            "search_strategy": "how to find this"
        }}
    ],
    "market_specific_requirements": {{
        "identified_market": "enterprise|smb|developer|mixed",
        "critical_features": ["feature1", "feature2"],
        "validation_approach": "how to validate market fit"
    }}
}}
"""
        
        elif decision_type == ResearchDecision.MARKET_TECH_ALIGNMENT:
            return f"""{base_context}

Analyze the alignment between discovered market position and technical capabilities.

Current findings:
- Target customers: {context.key_insights.get('customer_segments', 'Unknown')}
- Technology stack: {', '.join(context.discovered_technologies[:10]) if context.discovered_technologies else 'Unknown'}
- Pricing model: {context.key_insights.get('pricing_model', 'Unknown')}

Questions to consider:
1. Does their tech stack support their target market's needs?
   - Enterprise needs: Scalability, security, compliance, on-prem options
   - SMB needs: Simplicity, cloud-native, cost-effective
   - Developer needs: Modern stack, good APIs, extensibility

2. Are there misalignments that could limit growth?
   - Using legacy tech for a modern market?
   - Over-engineered for SMB customers?
   - Lacking enterprise features for upmarket expansion?

3. Can they easily hire for their tech stack in their market?

Return a JSON object with:
{{
    "alignment_score": "strong|moderate|weak",
    "market_fit_analysis": {{
        "target_market": "identified market segment",
        "tech_requirements": ["required capabilities"],
        "current_capabilities": ["what they have"],
        "gaps": ["what's missing"],
        "opportunities": ["growth potential"]
    }},
    "hiring_feasibility": {{
        "tech_stack_popularity": "assessment",
        "talent_availability": "assessment",
        "concerns": ["any hiring challenges"]
    }},
    "recommendations": ["specific areas to investigate further"]
}}
"""
        
        return f"{base_context}\n\nMake a routing decision for {decision_type.value}"
    
    def _format_evidence_summary(self, evidence: Dict[str, List[Any]]) -> str:
        """Format evidence collection summary"""
        summary = []
        for evidence_type, items in evidence.items():
            summary.append(f"- {evidence_type}: {len(items)} items")
        return '\n'.join(summary) if summary else "- No evidence collected yet"
    
    def _parse_text_response(self, text: str) -> Dict[str, Any]:
        """Fallback parser for non-JSON responses"""
        # Extract key decisions from text
        lines = text.strip().split('\n')
        decision = {
            "recommendation": lines[0] if lines else "Continue research",
            "reasoning": text,
            "parsed_successfully": False
        }
        return decision


class ThesisAwareSearchStrategy:
    """
    Generate search strategies based on deep understanding of investment thesis
    and market dynamics
    """
    
    def __init__(self, router: ResearchRouter):
        self.router = router
        
    async def generate_search_strategy(
        self,
        context: RoutingContext,
        phase: str
    ) -> Dict[str, Any]:
        """
        Generate intelligent search strategy based on thesis and discoveries
        """
        
        # Investment thesis specific search patterns
        thesis_patterns = {
            'accelerate-organic-growth': {
                'market_analysis': [
                    "market size trajectory",
                    "customer acquisition cost trends", 
                    "expansion revenue potential",
                    "competitive dynamics",
                    "barrier to entry analysis"
                ],
                'technical_validation': [
                    "product velocity",
                    "feature adoption rates",
                    "platform extensibility",
                    "scaling bottlenecks"
                ]
            },
            'buy-and-build': {
                'market_analysis': [
                    "platform ecosystem health",
                    "integration partner quality",
                    "developer community engagement",
                    "M&A track record",
                    "platform stickiness"
                ],
                'technical_validation': [
                    "API completeness",
                    "integration complexity",
                    "platform architecture",
                    "multi-tenancy capabilities"
                ]
            },
            'digital-transformation': {
                'market_analysis': [
                    "legacy system displacement",
                    "enterprise adoption patterns",
                    "change management requirements",
                    "ROI evidence",
                    "transformation timelines"
                ],
                'technical_validation': [
                    "migration tooling",
                    "backwards compatibility",
                    "enterprise features",
                    "security compliance",
                    "hybrid deployment options"
                ]
            }
        }
        
        # Get thesis-specific patterns
        patterns = thesis_patterns.get(context.investment_thesis, thesis_patterns['accelerate-organic-growth'])
        
        # Adjust based on discovered market position
        if context.discovered_market_position == 'enterprise':
            # Add enterprise-specific searches
            additional_searches = [
                "security certifications status",
                "compliance roadmap",
                "enterprise support SLAs",
                "data residency options",
                "audit trail capabilities"
            ]
        elif context.discovered_market_position == 'smb':
            # Add SMB-specific searches
            additional_searches = [
                "self-service onboarding",
                "pricing transparency",
                "community support quality",
                "ease of implementation",
                "time to value metrics"
            ]
        else:
            additional_searches = []
            
        return {
            "phase": phase,
            "thesis_patterns": patterns,
            "market_specific": additional_searches,
            "search_depth": 3 if phase in ['market_analysis', 'targeted_search'] else 2,
            "prioritize_external": phase == 'external_validation'
        }


# Example usage
async def route_research_decision(
    anthropic_key: str,
    decision_type: ResearchDecision,
    context_data: dict
) -> Dict[str, Any]:
    """
    Make a routing decision using extended thinking
    """
    router = ResearchRouter(anthropic_key)
    
    context = RoutingContext(
        investment_thesis=context_data['investment_thesis'],
        company_domain=context_data['domain'],
        current_phase=context_data['current_phase'],
        evidence_collected=context_data.get('evidence_collected', {}),
        key_insights=context_data.get('key_insights', {}),
        iteration=context_data.get('iteration', 1),
        coverage=context_data.get('coverage', 0.0),
        discovered_market_position=context_data.get('market_position'),
        discovered_technologies=context_data.get('technologies', []),
        discovered_competitors=context_data.get('competitors', [])
    )
    
    decision = await router.make_routing_decision(decision_type, context)
    return decision


if __name__ == "__main__":
    # Test the router
    test_context = {
        'investment_thesis': 'buy-and-build',
        'domain': 'stripe.com',
        'current_phase': 'initial_context',
        'iteration': 2,
        'coverage': 0.3,
        'evidence_collected': {
            'business_model': [{'type': 'subscription'}],
            'technology_stack': [{'tech': 'ruby', 'modern': True}]
        },
        'key_insights': {
            'customer_segments': 'mixed enterprise and SMB'
        },
        'market_position': 'enterprise',
        'technologies': ['ruby', 'react', 'postgres'],
        'competitors': ['adyen', 'square', 'paypal']
    }
    
    # This would need an actual API key to run
    # decision = asyncio.run(route_research_decision(
    #     'your-api-key',
    #     ResearchDecision.PHASE_SELECTION,
    #     test_context
    # ))
    # print(json.dumps(decision, indent=2))