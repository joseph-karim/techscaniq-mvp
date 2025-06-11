# LangGraph with Claude Orchestration & Existing Tools

## Core Architecture: Claude + All Your Tools

### 1. Claude as the Brain (Interleaved Thinking)

```python
from langgraph.graph import StateGraph
from anthropic import Anthropic
import asyncio

class ClaudeResearchGraph:
    def __init__(self):
        self.claude = Anthropic(api_key=ANTHROPIC_KEY)
        self.graph = StateGraph(ResearchState)
        
        # All your existing tools
        self.tools = {
            "google_search": self.google_search_with_gemini,
            "crawl4ai_deep": self.crawl4ai_deep_analysis,
            "github_analyzer": self.github_code_analysis,
            "security_scanner": self.security_header_check,
            "performance_analyzer": self.lighthouse_analysis,
            "tech_stack_detector": self.wappalyzer_scan,
            "financial_collector": self.financial_data_search,
            "review_aggregator": self.g2_glassdoor_search,
            "api_scanner": self.api_endpoint_discovery,
            "ssl_analyzer": self.ssl_cert_analysis
        }
        
    async def claude_orchestrator_node(self, state: ResearchState):
        """Claude with interleaved thinking orchestrates the research"""
        
        # Claude decides what to research next
        orchestration_prompt = f"""You are researching {state['company']} for {state['investment_thesis']} investment.

Current research state:
- Evidence collected: {len(state['evidence_collected'])} items
- Tools used: {[e['tool'] for e in state['evidence_collected']]}
- Key findings: {state.get('key_findings', [])}

Available tools:
1. google_search - Search with Gemini grounding for facts
2. crawl4ai_deep - Deep crawl website with AI extraction  
3. github_analyzer - Analyze GitHub repos, commits, tech stack
4. security_scanner - Check security headers, SSL, vulnerabilities
5. performance_analyzer - Lighthouse scores, Core Web Vitals
6. tech_stack_detector - Detect all technologies used
7. financial_collector - Find funding, revenue, growth metrics
8. review_aggregator - G2, Glassdoor, TrustPilot reviews
9. api_scanner - Discover and analyze API endpoints
10. ssl_analyzer - SSL certificate and security analysis

Based on the {state['investment_thesis']} thesis, what should we investigate next?
Think through what evidence we still need and which tools would be most valuable.
"""

        # Claude with extended thinking
        response = await self.claude.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=4000,
            system="You are an expert investment analyst. Use careful reasoning to decide what evidence to collect next.",
            messages=[{"role": "user", "content": orchestration_prompt}],
            extra_headers={"anthropic-beta": "extended-thinking-2025-05-06"}
        )
        
        # Extract tool calls from Claude's response
        tool_calls = self.extract_tool_decisions(response.content)
        
        # Execute tools in parallel
        results = await asyncio.gather(*[
            self.execute_tool(tool_call) for tool_call in tool_calls
        ])
        
        # Process results into evidence with citations
        new_evidence = []
        for idx, (tool_call, result) in enumerate(zip(tool_calls, results)):
            evidence_id = f"E{len(state['evidence_collected']) + idx + 1}"
            evidence = {
                "id": evidence_id,
                "tool": tool_call["tool"],
                "query": tool_call["query"],
                "result": result,
                "confidence": result.get("confidence", 0.8),
                "timestamp": datetime.now().isoformat()
            }
            new_evidence.append(evidence)
        
        return {
            "evidence_collected": new_evidence,
            "messages": [f"Claude collected {len(new_evidence)} new evidence items"],
            "should_continue": len(state['evidence_collected']) < 50  # Collect up to 50 pieces
        }
```

### 2. Your Existing Tools as LangGraph Nodes

```python
async def crawl4ai_deep_analysis(self, query: Dict) -> Dict:
    """Your existing Crawl4AI implementation"""
    from crawl4ai import AsyncWebCrawler
    
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(
            url=query["url"],
            word_count_threshold=10,
            extraction_strategy=LLMExtractionStrategy(
                provider="openai/gpt-4",
                api_token=OPENAI_KEY,
                schema=query.get("schema", TechStackSchema),
                extraction_type="schema",
                instruction=query.get("instruction", "Extract all technical details")
            ),
            chunking_strategy=RegexChunking(),
            verbose=True
        )
        
        return {
            "url": query["url"],
            "content": result.extracted_content,
            "links": result.links,
            "media": result.media,
            "confidence": 0.9
        }

async def google_search_with_gemini(self, query: Dict) -> Dict:
    """Your existing Gemini grounded search"""
    import google.generativeai as genai
    
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    response = model.generate_content(
        query["search_query"],
        tools='google_search_retrieval'
    )
    
    # Extract grounding results
    grounding_metadata = response.candidates[0].grounding_metadata
    results = []
    
    for chunk in grounding_metadata.search_entry_point.rendered_content.chunks:
        results.append({
            "url": chunk.web.uri,
            "title": chunk.web.title,
            "snippet": chunk.web.snippet,
            "relevance": chunk.relevance_score
        })
    
    return {
        "query": query["search_query"],
        "results": results,
        "confidence": max(r["relevance"] for r in results) if results else 0
    }
```

### 3. Report Generation with Citation Tracking

```python
async def generate_section_with_citations(self, state: ResearchState, section: str):
    """Generate a report section with Claude, embedding citations"""
    
    # Filter relevant evidence for this section
    relevant_evidence = self.filter_evidence_for_section(
        state['evidence_collected'], 
        section
    )
    
    # Create citation mapping
    citation_map = {}
    evidence_text = []
    
    for idx, evidence in enumerate(relevant_evidence, 1):
        citation_map[f"[{idx}]"] = evidence["id"]
        evidence_text.append(f"""
[{idx}] {evidence['tool']} - {evidence['query']}
Result: {json.dumps(evidence['result'], indent=2)[:500]}...
Confidence: {evidence['confidence']}
""")
    
    # Claude generates section with citations
    section_prompt = f"""Generate the {section} section for {state['company']}.

Investment thesis: {state['investment_thesis']}

Available evidence (use these citations):
{''.join(evidence_text)}

CRITICAL: You MUST cite evidence using [1], [2], etc. for EVERY claim.

Example:
"The company uses Kubernetes for orchestration [1] with 99.9% uptime SLA [2]. 
Their GitHub shows 45 active contributors [3] with consistent commit velocity [4]."

Write a thorough {section} section with specific details from the evidence."""

    response = await self.claude.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=4000,
        messages=[{"role": "user", "content": section_prompt}]
    )
    
    return {
        f"{section}_content": response.content[0].text,
        "citations": citation_map
    }
```

### 4. Complete Graph Definition

```python
# Define the research graph with all your tools
research_graph = StateGraph(ResearchState)

# Research phase - Claude orchestrates your tools
research_graph.add_node("claude_orchestrator", claude_orchestrator_node)
research_graph.add_node("execute_tools", execute_tools_node)

# Report generation phase - with citations
research_graph.add_node("generate_executive_summary", generate_executive_summary_node)
research_graph.add_node("generate_tech_analysis", generate_tech_analysis_node)
research_graph.add_node("generate_security_assessment", generate_security_assessment_node)
research_graph.add_node("generate_team_analysis", generate_team_analysis_node)
research_graph.add_node("generate_recommendation", generate_recommendation_node)
research_graph.add_node("compile_final_report", compile_final_report_node)

# Conditional edges - Claude decides when we have enough evidence
research_graph.add_conditional_edges(
    "claude_orchestrator",
    lambda x: "continue" if x["should_continue"] else "report",
    {
        "continue": "claude_orchestrator",  # Loop back for more research
        "report": "generate_executive_summary"  # Start report generation
    }
)

# Linear report generation
research_graph.add_edge("generate_executive_summary", "generate_tech_analysis")
research_graph.add_edge("generate_tech_analysis", "generate_security_assessment")
research_graph.add_edge("generate_security_assessment", "generate_team_analysis")
research_graph.add_edge("generate_team_analysis", "generate_recommendation")
research_graph.add_edge("generate_recommendation", "compile_final_report")
research_graph.add_edge("compile_final_report", END)

# Set entry point
research_graph.set_entry_point("claude_orchestrator")
```

### 5. Example Research Flow

```
1. Claude analyzes Snowplow, decides to search for basic info
   → Calls google_search("Snowplow analytics platform overview")
   → Evidence E1: Company overview, $40M funding

2. Claude sees tech company, decides to analyze tech stack
   → Calls crawl4ai_deep(snowplow.io) 
   → Evidence E2-E15: React, Node.js, Kubernetes, AWS

3. Claude wants security assessment
   → Calls security_scanner(snowplow.io)
   → Evidence E16-E20: SSL A+, security headers present

4. Claude researches team
   → Calls github_analyzer("snowplow")
   → Evidence E21-E30: 50+ contributors, active development

5. Claude generates report with citations:
   "Snowplow leverages modern cloud infrastructure [E2] with 
   Kubernetes orchestration [E5] achieving 99.9% uptime [E8]..."
```

### 6. Key Benefits

1. **Claude's Intelligence**: Uses interleaved thinking to adaptively research
2. **All Your Tools**: Crawl4AI, Gemini search, security scanners - all integrated
3. **Rich Evidence**: 50-100 pieces of evidence per company
4. **Full Citations**: Every claim linked to specific evidence
5. **Streaming Progress**: Real-time updates as Claude researches

This keeps your powerful tool suite while fixing the core issue: connecting evidence to report content through citations.