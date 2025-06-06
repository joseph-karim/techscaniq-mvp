#!/usr/bin/env python3
"""
Intelligent Research Orchestrator with Interleaved Thinking
Leverages Claude 4's extended and interleaved thinking capabilities to orchestrate
complex multi-tool research workflows with adaptive reasoning between tool calls.
"""

import asyncio
import json
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum
import anthropic
from datetime import datetime


class ResearchTool(Enum):
    """Available research tools"""
    WEB_SEARCH = "web_search"
    HTML_COLLECTOR = "html_collector"
    HAR_CAPTURE = "har_capture"
    SECURITY_SCANNER = "security_scanner"
    NETWORK_ANALYZER = "network_analyzer"
    GITHUB_ANALYZER = "github_analyzer"
    FINANCIAL_COLLECTOR = "financial_collector"
    REVIEW_AGGREGATOR = "review_aggregator"
    COMPETITOR_ANALYZER = "competitor_analyzer"
    TECH_STACK_ANALYZER = "tech_stack_analyzer"


@dataclass
class ToolResult:
    """Result from a tool execution"""
    tool: ResearchTool
    success: bool
    data: Any
    metadata: Dict[str, Any]
    timestamp: datetime


@dataclass
class ResearchState:
    """Current state of research"""
    company: str
    domain: str
    investment_thesis: str
    iteration: int
    discoveries: Dict[str, Any]
    evidence_collected: List[Dict[str, Any]]
    tool_history: List[ToolResult]
    current_hypothesis: Optional[str] = None
    market_position: Optional[str] = None
    key_technologies: List[str] = None
    competitors: List[str] = None
    critical_findings: List[Dict[str, Any]] = None


class IntelligentResearchOrchestrator:
    """
    Orchestrates research using Claude 4's interleaved thinking to make
    sophisticated decisions between tool calls
    """
    
    def __init__(self, anthropic_api_key: str, tool_registry: Dict[ResearchTool, Callable]):
        self.client = anthropic.Anthropic(api_key=anthropic_api_key)
        self.tool_registry = tool_registry
        
    async def conduct_adaptive_research(
        self,
        company: str,
        domain: str,
        investment_thesis: str,
        max_iterations: int = 10
    ) -> Dict[str, Any]:
        """
        Conduct research with interleaved thinking between tool calls
        """
        
        # Initialize research state
        state = ResearchState(
            company=company,
            domain=domain,
            investment_thesis=investment_thesis,
            iteration=0,
            discoveries={},
            evidence_collected=[],
            tool_history=[],
            key_technologies=[],
            competitors=[],
            critical_findings=[]
        )
        
        # System prompt for research orchestration
        system_prompt = f"""You are an expert investment analyst conducting deep due diligence on {company}.
Investment thesis: {investment_thesis}

You have access to multiple research tools that you can call to gather information.
After each tool call, think deeply about what you learned and what to investigate next.

Consider the relationships between:
- Target market and required technical capabilities
- Business model and growth potential  
- Competitive position and moats
- Technology choices and hiring/scaling ability

For {investment_thesis} investments, focus on:
{self._get_thesis_focus(investment_thesis)}

Available tools:
{self._format_available_tools()}

Use extended thinking to plan your research strategy and interleaved thinking to 
reason about findings between tool calls. Be hypothesis-driven and test your assumptions."""

        # Initial planning with extended thinking
        initial_plan = await self._create_research_plan(state, system_prompt)
        
        # Execute adaptive research loop
        for iteration in range(max_iterations):
            state.iteration = iteration + 1
            
            # Get next research action with interleaved thinking
            response = await self._get_next_research_action(state, system_prompt)
            
            # Extract tool calls and thinking from response
            tool_calls = self._extract_tool_calls(response)
            thinking = self._extract_thinking(response)
            
            if not tool_calls:
                # No more tools to call - synthesis phase
                break
                
            # Execute tool calls
            for tool_call in tool_calls:
                result = await self._execute_tool(tool_call, state)
                state.tool_history.append(result)
                
                # Update state based on result
                self._update_state_from_result(state, result)
            
            # Check if we have sufficient evidence for thesis
            if self._has_sufficient_evidence(state):
                print(f"✅ Sufficient evidence collected after {iteration + 1} iterations")
                break
                
        # Final synthesis
        synthesis = await self._synthesize_findings(state, system_prompt)
        
        return {
            "company": company,
            "investment_thesis": investment_thesis,
            "iterations": state.iteration,
            "evidence_collected": len(state.evidence_collected),
            "tool_calls": len(state.tool_history),
            "discoveries": state.discoveries,
            "critical_findings": state.critical_findings,
            "synthesis": synthesis,
            "recommendation": synthesis.get("recommendation", "Requires further analysis")
        }
    
    def _get_thesis_focus(self, thesis: str) -> str:
        """Get specific focus areas for investment thesis"""
        
        focus_areas = {
            "accelerate-organic-growth": """
- Market size and growth trajectory
- Customer acquisition costs and expansion revenue
- Competitive dynamics and differentiation
- Product-market fit evidence
- Scalability of go-to-market motion
- Unit economics and path to profitability
""",
            "buy-and-build": """
- Platform architecture and extensibility
- API quality and developer experience
- Integration ecosystem health
- M&A track record and integration capabilities
- Network effects and platform stickiness
- Market consolidation opportunities
""",
            "digital-transformation": """
- Enterprise readiness (security, compliance, scale)
- Legacy system displacement capability
- Change management requirements
- Implementation complexity and time to value
- ROI evidence and case studies
- Technology stack modernity and hiring ability
"""
        }
        
        return focus_areas.get(thesis, focus_areas["accelerate-organic-growth"])
    
    def _format_available_tools(self) -> str:
        """Format available tools for the prompt"""
        tool_descriptions = {
            ResearchTool.WEB_SEARCH: "Search web for company information, news, reviews",
            ResearchTool.HTML_COLLECTOR: "Collect and analyze HTML content from specific pages",
            ResearchTool.HAR_CAPTURE: "Capture HTTP Archive to analyze site performance and API calls",
            ResearchTool.SECURITY_SCANNER: "Scan for security headers, SSL config, vulnerabilities",
            ResearchTool.NETWORK_ANALYZER: "Analyze network topology, CDN usage, infrastructure",
            ResearchTool.GITHUB_ANALYZER: "Analyze public GitHub repos, tech stack, activity",
            ResearchTool.FINANCIAL_COLLECTOR: "Collect financial data, funding info, revenue estimates",
            ResearchTool.REVIEW_AGGREGATOR: "Aggregate reviews from G2, Capterra, TrustRadius",
            ResearchTool.COMPETITOR_ANALYZER: "Analyze competitors and market positioning",
            ResearchTool.TECH_STACK_ANALYZER: "Deep analysis of technology stack and architecture"
        }
        
        return "\n".join([f"- {tool.value}: {desc}" for tool, desc in tool_descriptions.items()])
    
    async def _create_research_plan(self, state: ResearchState, system_prompt: str) -> Dict[str, Any]:
        """Create initial research plan with extended thinking"""
        
        planning_prompt = f"""Create a comprehensive research plan for {state.company}.
        
Consider:
1. What are the most critical questions for the {state.investment_thesis} thesis?
2. What evidence would confirm or refute the investment opportunity?
3. What tools should we use in what sequence?
4. What are the key risks to investigate?

Think deeply about the relationships between business model, target market, and technical requirements.

Return a structured plan."""

        response = self.client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=4000,
            temperature=0.3,
            system=system_prompt,
            messages=[{"role": "user", "content": planning_prompt}],
            extra_headers={"anthropic-beta": "extended-thinking-2025-05-06"}
        )
        
        # Parse plan from response
        plan_text = response.content[0].text
        return self._parse_research_plan(plan_text)
    
    async def _get_next_research_action(self, state: ResearchState, system_prompt: str) -> Any:
        """Get next research action with interleaved thinking"""
        
        # Build context from current state
        context = f"""Current research state:
        
Company: {state.company}
Domain: {state.domain}
Iteration: {state.iteration}

Discoveries so far:
{json.dumps(state.discoveries, indent=2)}

Evidence collected: {len(state.evidence_collected)} items
Recent tool results: {self._format_recent_results(state.tool_history[-3:])}

Market position: {state.market_position or "Unknown"}
Key technologies: {', '.join(state.key_technologies) if state.key_technologies else "None identified"}
Competitors: {', '.join(state.competitors) if state.competitors else "None identified"}

Based on what you've learned, what should we investigate next?
Consider how the findings relate to the {state.investment_thesis} thesis.
What hypotheses should we test? What tools would provide the most valuable information?

Use the tools available to gather specific evidence. Think about what each finding means
before deciding on the next action."""

        # Make request with interleaved thinking
        response = self.client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=6000,  # Higher limit for interleaved thinking
            temperature=0.3,
            system=system_prompt,
            messages=[
                {"role": "user", "content": context}
            ],
            tools=self._format_tools_for_api(),
            extra_headers={"anthropic-beta": "interleaved-thinking-2025-05-14"},
            tool_choice={"type": "auto"}
        )
        
        return response
    
    def _format_tools_for_api(self) -> List[Dict[str, Any]]:
        """Format tools for Anthropic API"""
        tools = []
        
        for tool in ResearchTool:
            tool_spec = {
                "name": tool.value,
                "description": self._get_tool_description(tool),
                "input_schema": self._get_tool_schema(tool)
            }
            tools.append(tool_spec)
            
        return tools
    
    def _get_tool_description(self, tool: ResearchTool) -> str:
        """Get detailed tool description"""
        descriptions = {
            ResearchTool.WEB_SEARCH: "Search the web for information about the company, including news, reviews, discussions, and analysis",
            ResearchTool.HTML_COLLECTOR: "Collect and analyze HTML content from specific URLs to extract structured information",
            ResearchTool.HAR_CAPTURE: "Capture HTTP Archive data to analyze API calls, performance metrics, and third-party integrations",
            ResearchTool.SECURITY_SCANNER: "Scan for security configurations, SSL certificates, headers, and compliance indicators",
            ResearchTool.NETWORK_ANALYZER: "Analyze network infrastructure, CDN usage, hosting providers, and technical architecture",
            ResearchTool.GITHUB_ANALYZER: "Analyze public GitHub repositories to understand tech stack, code quality, and development practices",
            ResearchTool.FINANCIAL_COLLECTOR: "Collect financial information including funding, revenue estimates, and growth metrics",
            ResearchTool.REVIEW_AGGREGATOR: "Aggregate and analyze customer reviews from multiple platforms",
            ResearchTool.COMPETITOR_ANALYZER: "Analyze competitors, market positioning, and competitive advantages",
            ResearchTool.TECH_STACK_ANALYZER: "Deep dive into technology choices, architecture decisions, and technical capabilities"
        }
        return descriptions.get(tool, "Research tool")
    
    def _get_tool_schema(self, tool: ResearchTool) -> Dict[str, Any]:
        """Get tool input schema"""
        
        # Common schema pattern
        base_schema = {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query or target URL"
                },
                "options": {
                    "type": "object",
                    "description": "Tool-specific options"
                }
            },
            "required": ["query"]
        }
        
        # Tool-specific schemas
        tool_schemas = {
            ResearchTool.WEB_SEARCH: {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "search_type": {
                        "type": "string",
                        "enum": ["general", "news", "reviews", "technical", "financial"],
                        "description": "Type of search to perform"
                    },
                    "date_range": {
                        "type": "string",
                        "description": "Date range for results (e.g., 'past_month')"
                    }
                },
                "required": ["query"]
            },
            ResearchTool.HTML_COLLECTOR: {
                "type": "object", 
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "URL to collect"
                    },
                    "extract_patterns": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Patterns to extract from HTML"
                    }
                },
                "required": ["url"]
            },
            ResearchTool.REVIEW_AGGREGATOR: {
                "type": "object",
                "properties": {
                    "company_name": {
                        "type": "string",
                        "description": "Company name to search for"
                    },
                    "platforms": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Review platforms to search"
                    }
                },
                "required": ["company_name"]
            }
        }
        
        return tool_schemas.get(tool, base_schema)
    
    def _extract_tool_calls(self, response: Any) -> List[Dict[str, Any]]:
        """Extract tool calls from response"""
        tool_calls = []
        
        for content in response.content:
            if hasattr(content, 'type') and content.type == 'tool_use':
                tool_calls.append({
                    'tool': ResearchTool(content.name),
                    'input': content.input,
                    'id': content.id
                })
                
        return tool_calls
    
    def _extract_thinking(self, response: Any) -> List[str]:
        """Extract thinking blocks from response"""
        thinking_blocks = []
        
        for content in response.content:
            if hasattr(content, 'type') and content.type == 'text':
                # Look for thinking patterns in text
                text = content.text
                if any(marker in text for marker in ['Thinking:', 'Reasoning:', 'Hypothesis:', 'Analysis:']):
                    thinking_blocks.append(text)
                    
        return thinking_blocks
    
    async def _execute_tool(self, tool_call: Dict[str, Any], state: ResearchState) -> ToolResult:
        """Execute a tool and return result"""
        tool = tool_call['tool']
        tool_input = tool_call['input']
        
        print(f"\n🔧 Executing {tool.value} with input: {json.dumps(tool_input, indent=2)}")
        
        # Get tool implementation from registry
        tool_func = self.tool_registry.get(tool)
        
        if not tool_func:
            return ToolResult(
                tool=tool,
                success=False,
                data={"error": f"Tool {tool.value} not implemented"},
                metadata={},
                timestamp=datetime.now()
            )
        
        try:
            # Execute tool
            result_data = await tool_func(tool_input, state)
            
            return ToolResult(
                tool=tool,
                success=True,
                data=result_data,
                metadata={
                    "iteration": state.iteration,
                    "input": tool_input
                },
                timestamp=datetime.now()
            )
            
        except Exception as e:
            print(f"❌ Tool {tool.value} failed: {e}")
            return ToolResult(
                tool=tool,
                success=False,
                data={"error": str(e)},
                metadata={"input": tool_input},
                timestamp=datetime.now()
            )
    
    def _update_state_from_result(self, state: ResearchState, result: ToolResult):
        """Update research state based on tool result"""
        
        if not result.success:
            return
            
        # Update based on tool type
        if result.tool == ResearchTool.WEB_SEARCH:
            # Extract insights from search results
            self._process_search_results(state, result.data)
            
        elif result.tool == ResearchTool.TECH_STACK_ANALYZER:
            # Update technology discoveries
            if 'technologies' in result.data:
                state.key_technologies.extend(result.data['technologies'])
                state.key_technologies = list(set(state.key_technologies))
                
        elif result.tool == ResearchTool.COMPETITOR_ANALYZER:
            # Update competitor list
            if 'competitors' in result.data:
                state.competitors.extend(result.data['competitors'])
                state.competitors = list(set(state.competitors))
                
        elif result.tool == ResearchTool.REVIEW_AGGREGATOR:
            # Extract market position from reviews
            if 'primary_segment' in result.data:
                state.market_position = result.data['primary_segment']
                
        # Add to evidence
        state.evidence_collected.append({
            'tool': result.tool.value,
            'data': result.data,
            'timestamp': result.timestamp.isoformat()
        })
    
    def _process_search_results(self, state: ResearchState, search_data: Dict[str, Any]):
        """Process search results to extract insights"""
        
        # Look for key patterns in search results
        if 'results' in search_data:
            for result in search_data['results']:
                # Extract mentions of funding, growth, etc.
                snippet = result.get('snippet', '').lower()
                
                if 'funding' in snippet or 'raised' in snippet:
                    if 'funding' not in state.discoveries:
                        state.discoveries['funding'] = []
                    state.discoveries['funding'].append(result)
                    
                if 'revenue' in snippet or 'arr' in snippet:
                    if 'revenue' not in state.discoveries:
                        state.discoveries['revenue'] = []
                    state.discoveries['revenue'].append(result)
    
    def _has_sufficient_evidence(self, state: ResearchState) -> bool:
        """Check if we have sufficient evidence for investment decision"""
        
        # Thesis-specific evidence requirements
        required_evidence = {
            "accelerate-organic-growth": [
                'market_size', 'growth_metrics', 'competitive_position',
                'customer_satisfaction', 'unit_economics'
            ],
            "buy-and-build": [
                'platform_quality', 'api_assessment', 'integration_ecosystem',
                'developer_adoption', 'acquisition_potential'
            ],
            "digital-transformation": [
                'enterprise_readiness', 'security_compliance', 'implementation_complexity',
                'roi_evidence', 'customer_success'
            ]
        }
        
        # Check if key evidence types are covered
        thesis_requirements = required_evidence.get(state.investment_thesis, [])
        evidence_types = [e.get('tool') for e in state.evidence_collected]
        
        # Simple heuristic - need at least 70% of required evidence types
        coverage = sum(1 for req in thesis_requirements if any(req in str(e) for e in evidence_types))
        return coverage / len(thesis_requirements) >= 0.7
    
    def _format_recent_results(self, results: List[ToolResult]) -> str:
        """Format recent tool results for context"""
        if not results:
            return "No recent results"
            
        formatted = []
        for result in results:
            summary = f"- {result.tool.value}: "
            if result.success:
                # Summarize key findings
                data_summary = str(result.data)[:200] + "..." if len(str(result.data)) > 200 else str(result.data)
                summary += f"Success - {data_summary}"
            else:
                summary += f"Failed - {result.data.get('error', 'Unknown error')}"
            formatted.append(summary)
            
        return "\n".join(formatted)
    
    def _parse_research_plan(self, plan_text: str) -> Dict[str, Any]:
        """Parse research plan from text"""
        # Simple parsing - in production would use more sophisticated parsing
        return {
            "plan": plan_text,
            "phases": ["initial_discovery", "deep_analysis", "validation", "synthesis"],
            "priority_tools": [ResearchTool.WEB_SEARCH, ResearchTool.TECH_STACK_ANALYZER]
        }
    
    async def _synthesize_findings(self, state: ResearchState, system_prompt: str) -> Dict[str, Any]:
        """Synthesize all findings into investment recommendation"""
        
        synthesis_prompt = f"""Synthesize all research findings for {state.company}.

Evidence collected: {len(state.evidence_collected)} items across {state.iteration} iterations

Key discoveries:
{json.dumps(state.discoveries, indent=2)}

Market position: {state.market_position}
Technologies: {', '.join(state.key_technologies)}
Competitors: {', '.join(state.competitors)}

Based on the {state.investment_thesis} investment thesis, provide:
1. Investment recommendation (Strong Yes / Yes / Maybe / No / Strong No)
2. Key supporting evidence
3. Major risks identified
4. Areas requiring further investigation
5. Confidence level in the recommendation

Consider how well the company aligns with the thesis requirements."""

        response = self.client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=4000,
            temperature=0.2,
            system=system_prompt,
            messages=[{"role": "user", "content": synthesis_prompt}],
            extra_headers={"anthropic-beta": "extended-thinking-2025-05-06"}
        )
        
        # Parse synthesis
        synthesis_text = response.content[0].text
        
        # Extract structured recommendation (simplified parsing)
        recommendation = "Maybe"  # Default
        if "strong yes" in synthesis_text.lower():
            recommendation = "Strong Yes"
        elif "strong no" in synthesis_text.lower():
            recommendation = "Strong No"
        elif " yes" in synthesis_text.lower():
            recommendation = "Yes"
        elif " no" in synthesis_text.lower():
            recommendation = "No"
            
        return {
            "recommendation": recommendation,
            "synthesis": synthesis_text,
            "evidence_count": len(state.evidence_collected),
            "confidence": "Medium"  # Would extract from response
        }


# Example tool implementations (these would be actual implementations)
async def web_search_tool(input_data: Dict[str, Any], state: ResearchState) -> Dict[str, Any]:
    """Example web search implementation"""
    query = input_data.get('query', '')
    search_type = input_data.get('search_type', 'general')
    
    # In reality, this would call an actual search API
    return {
        "results": [
            {
                "title": f"Search result for {query}",
                "url": f"https://example.com/{query}",
                "snippet": f"Example snippet about {state.company} and {query}"
            }
        ],
        "search_type": search_type,
        "total_results": 10
    }


async def tech_stack_analyzer_tool(input_data: Dict[str, Any], state: ResearchState) -> Dict[str, Any]:
    """Example tech stack analyzer"""
    return {
        "technologies": ["Python", "React", "PostgreSQL", "AWS"],
        "architecture": "Microservices",
        "maturity": "Modern",
        "hiring_difficulty": "Low"
    }


# Usage example
async def main():
    # Initialize tool registry
    tool_registry = {
        ResearchTool.WEB_SEARCH: web_search_tool,
        ResearchTool.TECH_STACK_ANALYZER: tech_stack_analyzer_tool,
        # Add other tool implementations...
    }
    
    # Create orchestrator
    orchestrator = IntelligentResearchOrchestrator(
        anthropic_api_key="your-api-key",
        tool_registry=tool_registry
    )
    
    # Conduct research
    results = await orchestrator.conduct_adaptive_research(
        company="Stripe",
        domain="stripe.com",
        investment_thesis="buy-and-build",
        max_iterations=10
    )
    
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    # This would need actual API key and tool implementations to run
    # asyncio.run(main())
    print("Intelligent Research Orchestrator with Interleaved Thinking")