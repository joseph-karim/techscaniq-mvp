# LangGraph vs Current Architecture for Deep Research Reports

## Why LangGraph Would Be Better

### 1. **Stateful Graph-Based Workflows**
LangGraph excels at complex, multi-step workflows with conditional logic - exactly what we need:

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict

class ResearchState(TypedDict):
    company: str
    thesis: str
    evidence: List[Dict]
    citations: Dict[str, Dict]
    current_section: str
    report_sections: Dict[str, str]
    iteration: int
    
# Define the research graph
workflow = StateGraph(ResearchState)

# Add nodes for each research phase
workflow.add_node("initial_search", initial_company_search)
workflow.add_node("deep_technical_analysis", analyze_tech_stack)
workflow.add_node("security_assessment", assess_security)
workflow.add_node("team_research", research_team)
workflow.add_node("financial_analysis", analyze_financials)
workflow.add_node("generate_section", generate_report_section)
workflow.add_node("add_citations", embed_citations)

# Add conditional edges based on findings
workflow.add_conditional_edges(
    "initial_search",
    route_based_on_findings,
    {
        "needs_technical": "deep_technical_analysis",
        "needs_security": "security_assessment",
        "sufficient": "generate_section"
    }
)
```

### 2. **Key Advantages of LangGraph**

#### a) **Checkpointing & Persistence**
```python
# Save state at each step - perfect for long-running research
checkpointer = SqliteSaver.from_conn_string("research.db")
app = workflow.compile(checkpointer=checkpointer)

# Can resume from any point if interrupted
thread_id = "snowplow-research-001"
config = {"configurable": {"thread_id": thread_id}}
```

#### b) **Human-in-the-Loop**
```python
# Add approval nodes for investment decisions
workflow.add_node("human_review", wait_for_human_approval)
workflow.add_edge("generate_recommendation", "human_review")
```

#### c) **Streaming Updates**
```python
# Stream progress to UI in real-time
async for state in app.astream(initial_state, config):
    print(f"Completed: {state['current_section']}")
    await update_ui_progress(state)
```

#### d) **Parallel Execution**
```python
# Research multiple aspects simultaneously
workflow.add_node("parallel_research", parallel_research_node)

async def parallel_research_node(state):
    results = await asyncio.gather(
        search_github(state['company']),
        analyze_job_postings(state['company']),
        check_security_headers(state['domain']),
        find_customer_reviews(state['company'])
    )
    return {"evidence": state['evidence'] + results}
```

### 3. **Better Citation Management**

```python
class CitationTracker:
    """Track evidence usage throughout the graph"""
    
    def __init__(self):
        self.citations = {}
        self.citation_counter = 0
    
    def add_evidence(self, evidence: Dict, section: str) -> str:
        """Add evidence and return citation marker"""
        self.citation_counter += 1
        citation_id = f"[{self.citation_counter}]"
        
        self.citations[citation_id] = {
            "evidence": evidence,
            "section": section,
            "source": evidence['source'],
            "confidence": evidence['confidence'],
            "timestamp": datetime.now()
        }
        
        return citation_id

# Use in report generation
async def generate_report_section(state: ResearchState):
    tracker = CitationTracker()
    
    # Generate with citations
    section_prompt = f"""
    Generate {state['current_section']} section.
    
    Evidence available:
    {format_evidence(state['evidence'])}
    
    When making claims, I'll provide citation markers.
    """
    
    # As we generate, track citations
    for evidence in relevant_evidence:
        citation = tracker.add_evidence(evidence, state['current_section'])
        section_text += f"The company uses {evidence['tech']} {citation}. "
```

### 4. **Complete LangGraph Implementation**

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
import asyncio

class DeepResearchGraph:
    def __init__(self, anthropic_key: str, gemini_key: str):
        self.workflow = StateGraph(ResearchState)
        self.setup_nodes()
        self.setup_edges()
        
    def setup_nodes(self):
        # Research nodes
        self.workflow.add_node("start_research", self.start_research)
        self.workflow.add_node("collect_evidence", self.collect_evidence)
        self.workflow.add_node("analyze_technical", self.analyze_technical)
        self.workflow.add_node("assess_team", self.assess_team)
        self.workflow.add_node("evaluate_security", self.evaluate_security)
        self.workflow.add_node("analyze_market", self.analyze_market)
        
        # Report generation nodes
        self.workflow.add_node("generate_executive_summary", self.generate_executive_summary)
        self.workflow.add_node("generate_tech_section", self.generate_tech_section)
        self.workflow.add_node("generate_team_section", self.generate_team_section)
        self.workflow.add_node("generate_recommendation", self.generate_recommendation)
        
        # Citation and finalization
        self.workflow.add_node("compile_citations", self.compile_citations)
        self.workflow.add_node("finalize_report", self.finalize_report)
    
    def setup_edges(self):
        # Research flow
        self.workflow.add_edge("start_research", "collect_evidence")
        
        # Conditional routing based on thesis
        self.workflow.add_conditional_edges(
            "collect_evidence",
            self.route_by_thesis,
            {
                "technical": "analyze_technical",
                "team_focused": "assess_team",
                "security_critical": "evaluate_security",
                "market_driven": "analyze_market"
            }
        )
        
        # Report generation flow
        self.workflow.add_edge("analyze_technical", "generate_tech_section")
        self.workflow.add_edge("assess_team", "generate_team_section")
        
        # All paths lead to executive summary
        for node in ["generate_tech_section", "generate_team_section"]:
            self.workflow.add_edge(node, "generate_executive_summary")
        
        # Finalization
        self.workflow.add_edge("generate_executive_summary", "generate_recommendation")
        self.workflow.add_edge("generate_recommendation", "compile_citations")
        self.workflow.add_edge("compile_citations", "finalize_report")
        self.workflow.add_edge("finalize_report", END)
    
    async def run(self, company: str, thesis: str):
        """Execute the research graph"""
        checkpointer = SqliteSaver.from_conn_string("research.db")
        app = self.workflow.compile(checkpointer=checkpointer)
        
        initial_state = {
            "company": company,
            "thesis": thesis,
            "evidence": [],
            "citations": {},
            "report_sections": {},
            "iteration": 0
        }
        
        config = {"configurable": {"thread_id": f"{company}-{datetime.now()}"}}
        
        # Stream execution with progress updates
        async for state in app.astream(initial_state, config):
            print(f"Progress: {state.get('current_section', 'Researching...')}")
            
        return state
```

## Recommendation: Adopt LangGraph

### Why:
1. **Built for this use case**: Agentic workflows with state management
2. **Production-ready**: Checkpointing, streaming, error recovery
3. **Better debugging**: Visual graph representation, state inspection
4. **Easier to extend**: Just add nodes and edges
5. **LangSmith integration**: Built-in observability

### Migration Path:
1. **Phase 1**: Wrap existing Python orchestrator in LangGraph
2. **Phase 2**: Break into discrete nodes (search, analyze, generate)
3. **Phase 3**: Add checkpointing and streaming
4. **Phase 4**: Full UI integration with progress tracking

### Example Integration:
```typescript
// TypeScript side
const response = await fetch('/api/deep-research', {
  method: 'POST',
  body: JSON.stringify({ company, thesis }),
  stream: true
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const progress = JSON.parse(new TextDecoder().decode(value));
  updateUI(progress); // Show real-time progress
}
```

## Conclusion

LangGraph would significantly improve our architecture by providing:
- Stateful workflow management
- Built-in persistence
- Streaming capabilities
- Better error handling
- Visual debugging
- Human-in-the-loop support

It's designed exactly for complex, multi-step AI workflows like deep research.