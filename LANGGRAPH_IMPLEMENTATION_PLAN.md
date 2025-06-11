# LangGraph Implementation Plan for TechScanIQ

Based on Google's Gemini LangGraph quickstart, here's how to implement a proper deep research system:

## Architecture Overview

### 1. Graph Structure (Similar to Google's Implementation)

```python
# src/workers/research_graph.py
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Annotated
from operator import add

class ResearchState(TypedDict):
    # Core state
    company: str
    domain: str
    investment_thesis: str
    
    # Research progress
    messages: Annotated[List[str], add]
    evidence_collected: Annotated[List[Dict], add]
    citations: Dict[str, Dict]
    
    # Report sections
    executive_summary: str
    tech_analysis: str
    team_assessment: str
    security_review: str
    recommendation: str
    
    # Control flow
    current_phase: str
    should_continue: bool
    research_depth: int

# Create the graph
research_graph = StateGraph(ResearchState)

# Add research nodes
research_graph.add_node("initial_search", initial_search_node)
research_graph.add_node("deep_technical", deep_technical_node)
research_graph.add_node("security_scan", security_scan_node)
research_graph.add_node("team_research", team_research_node)
research_graph.add_node("financial_analysis", financial_analysis_node)

# Add report generation nodes
research_graph.add_node("generate_summary", generate_summary_node)
research_graph.add_node("generate_tech_section", generate_tech_section_node)
research_graph.add_node("generate_team_section", generate_team_section_node)
research_graph.add_node("generate_recommendation", generate_recommendation_node)
research_graph.add_node("compile_citations", compile_citations_node)

# Add conditional routing
research_graph.add_conditional_edges(
    "initial_search",
    should_continue_research,
    {
        "continue": "deep_technical",
        "sufficient": "generate_summary"
    }
)

# Set entry and exit
research_graph.set_entry_point("initial_search")
research_graph.add_edge("compile_citations", END)
```

### 2. Node Implementation Pattern

Following Google's pattern of focused, single-purpose nodes:

```python
async def deep_technical_node(state: ResearchState) -> Dict:
    """Deep dive into technical architecture"""
    
    # Use multiple tools
    results = await asyncio.gather(
        tech_stack_analyzer(state["domain"]),
        github_analyzer(state["company"]),
        api_scanner(state["domain"]),
        performance_analyzer(state["domain"])
    )
    
    # Process with Gemini/Claude
    analysis_prompt = f"""
    Analyze the technical architecture of {state["company"]}.
    
    Evidence collected:
    {json.dumps(results, indent=2)}
    
    For each finding, generate a citation reference.
    Focus on: scalability, security, technical debt, innovation
    """
    
    response = await llm.ainvoke(analysis_prompt)
    
    # Extract evidence and citations
    evidence_items = extract_evidence(response)
    new_citations = generate_citations(evidence_items)
    
    return {
        "evidence_collected": evidence_items,
        "citations": {**state["citations"], **new_citations},
        "messages": [f"Completed technical analysis: found {len(evidence_items)} key insights"],
        "current_phase": "technical_complete"
    }
```

### 3. Citation Generation (Key Difference from Current System)

```python
def generate_citations(evidence_items: List[Dict]) -> Dict[str, Dict]:
    """Generate numbered citations for evidence"""
    citations = {}
    
    for idx, item in enumerate(evidence_items, 1):
        citation_id = f"[{idx}]"
        citations[citation_id] = {
            "source": item["source"],
            "url": item.get("url"),
            "content": item["content"],
            "confidence": item.get("confidence", 0.8),
            "tool": item["tool"],
            "timestamp": item["timestamp"]
        }
    
    return citations

async def generate_tech_section_node(state: ResearchState) -> Dict:
    """Generate tech section with embedded citations"""
    
    # Find relevant evidence
    tech_evidence = [e for e in state["evidence_collected"] 
                    if e["category"] == "technical"]
    
    prompt = f"""
    Write the Technology Assessment section.
    
    Evidence available:
    {format_evidence_with_numbers(tech_evidence)}
    
    IMPORTANT: Use citations [1], [2], etc. for every claim.
    
    Example:
    "The company leverages Kubernetes for orchestration [1] with a 
    microservices architecture deployed on AWS [2]. Recent commits 
    show migration to TypeScript [3] improving type safety."
    """
    
    section = await llm.ainvoke(prompt)
    
    return {
        "tech_analysis": section,
        "messages": ["Generated technology section with citations"]
    }
```

### 4. Streaming Progress (Like Google's Implementation)

```python
# In the API endpoint
@app.post("/api/research-stream")
async def research_stream(request: ResearchRequest):
    # Initialize graph with checkpointing
    checkpointer = AsyncSqliteSaver.from_conn_string("research.db")
    graph = research_graph.compile(checkpointer=checkpointer)
    
    # Create config
    config = {
        "configurable": {
            "thread_id": f"{request.company}-{datetime.now()}",
            "checkpoint_ns": "research"
        }
    }
    
    # Initial state
    initial_state = {
        "company": request.company,
        "domain": request.domain,
        "investment_thesis": request.thesis,
        "messages": [],
        "evidence_collected": [],
        "citations": {},
        "current_phase": "starting",
        "research_depth": 0
    }
    
    # Stream results
    async def generate():
        async for chunk in graph.astream(initial_state, config):
            # Send progress updates
            yield json.dumps({
                "type": "progress",
                "phase": chunk.get("current_phase"),
                "messages": chunk.get("messages", []),
                "evidence_count": len(chunk.get("evidence_collected", []))
            }) + "\n"
        
        # Send final report
        final_state = chunk
        yield json.dumps({
            "type": "complete",
            "report": compile_final_report(final_state),
            "citations": final_state["citations"],
            "evidence_count": len(final_state["evidence_collected"])
        }) + "\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 5. Frontend Integration

```typescript
// src/hooks/useResearchStream.ts
export function useResearchStream() {
  const [progress, setProgress] = useState<ResearchProgress[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  
  const startResearch = async (company: string, thesis: string) => {
    const response = await fetch('/api/research-stream', {
      method: 'POST',
      body: JSON.stringify({ company, domain, thesis }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const data = JSON.parse(chunk);
      
      if (data.type === 'progress') {
        setProgress(prev => [...prev, data]);
      } else if (data.type === 'complete') {
        setReport(data.report);
      }
    }
  };
  
  return { startResearch, progress, report };
}
```

### 6. Key Improvements Over Current System

1. **Unified Flow**: Research and report generation in one graph
2. **Citation Tracking**: Evidence is numbered and tracked throughout
3. **Streaming Updates**: Real-time progress to UI
4. **Checkpointing**: Can resume interrupted research
5. **Conditional Logic**: Adaptive research based on findings
6. **Human-in-the-Loop**: Can add approval nodes for high-stakes decisions

### 7. Migration Steps

1. **Week 1**: Set up LangGraph and create basic graph structure
2. **Week 2**: Port research tools to LangGraph nodes
3. **Week 3**: Implement citation generation and tracking
4. **Week 4**: Add streaming and checkpointing
5. **Week 5**: Integrate with frontend and test

### 8. Example Output

Instead of generic content, we'll get:

```markdown
## Technology Assessment

Ring4 employs a modern microservices architecture [1] built on Node.js and TypeScript [2], 
with React-based frontend applications [3]. The infrastructure runs on AWS ECS [4] with 
auto-scaling capabilities handling 10,000+ concurrent connections [5].

Security measures include OAuth 2.0 implementation [6], end-to-end encryption for voice 
data [7], and SOC 2 Type II compliance achieved in Q2 2024 [8]. Recent penetration 
testing by CrowdStrike [9] identified only minor issues, all resolved within 30 days [10].

The engineering team of 85 developers [11] maintains a healthy velocity with 2-week 
sprint cycles [12] and 98% test coverage [13]. Code quality metrics from SonarQube [14] 
show technical debt below industry average at 3.2% [15].

[1] Source: GitHub repository analysis - microservices pattern detected
[2] Source: package.json analysis - TypeScript 5.2, Node.js 20.x
[3] Source: Frontend bundle analysis - React 18.2, Next.js 14
... etc
```

## Next Steps

1. Create a new `langgraph-research` branch
2. Set up the graph structure following Google's pattern
3. Port the intelligent research orchestrator to LangGraph nodes
4. Implement proper citation tracking throughout the flow
5. Add streaming endpoints for real-time updates
6. Update UI to show research progress and citations