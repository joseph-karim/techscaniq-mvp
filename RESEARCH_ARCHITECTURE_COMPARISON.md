# Research Architecture Comparison

## The Disconnect

Our current implementation misses the core concepts from both DeepSearcher and Google's LangGraph research agent.

### What DeepSearcher Does (Chain of RAG)

1. **Query Decomposition**
   - Original query: "Analyze Snowplow for investment"
   - Decomposed into:
     - "What is Snowplow's core technology architecture?"
     - "How does Snowplow compare to competitors?"
     - "What is Snowplow's market position and growth?"
     - "What are Snowplow's revenue indicators?"

2. **Iterative Research with Reflection**
   ```
   Initial Research → Reflection → Identify Gaps → Generate New Queries → Research Again
   ```
   - After first round: "We found architecture info, but missing scalability metrics"
   - New query: "Snowplow performance benchmarks enterprise scale"

3. **Dynamic Stopping Criteria**
   - LLM decides: "Do I have enough information to answer confidently?"
   - Not based on arbitrary evidence count (128 items)

### What Google's LangGraph Agent Does

1. **Stateful Research Tracking**
   ```python
   state = {
       "search_queries": ["initial", "refined", "gap-filling"],
       "web_research_result": "accumulated findings",
       "sources_gathered": ["url1", "url2", ...],
       "research_loop_count": 3
   }
   ```

2. **Reflection Node**
   - Analyzes current research: "What questions remain unanswered?"
   - Generates follow-up queries targeting specific gaps
   - Tracks confidence in current knowledge

3. **Citation Integration**
   - Citations created during research, not after
   - Each piece of evidence linked to specific sub-query
   - Final synthesis maintains citation links

### What We're Currently Doing Wrong

1. **Blind Evidence Collection**
   ```
   Current: Crawl 49 URLs → Get 128 random evidence items → Try to use 7
   Should be: Generate claims → Search for specific evidence → Use everything we find
   ```

2. **No Reflection or Gap Analysis**
   ```
   Current: Collect once, done
   Should be: Collect → Reflect → Identify gaps → Collect more → Repeat
   ```

3. **Post-Hoc Citation**
   ```
   Current: Write report → Look back for evidence to cite
   Should be: Find evidence for claim → Write claim with citation
   ```

4. **Fixed Collection Strategy**
   ```
   Current: Always crawl same URLs, always get 128 items
   Should be: Dynamic based on what we learn and what gaps remain
   ```

## The Right Approach

### 1. Start with Decomposed Questions
For Snowplow investment analysis:
```
Main Question: "Is Snowplow a good investment?"

Decomposed:
1. Technical Excellence
   - "What is their core architecture?"
   - "How scalable is their platform?"
   - "What technologies do they use?"

2. Market Position  
   - "Who are their competitors?"
   - "What is their market share?"
   - "What differentiates them?"

3. Business Health
   - "What are their revenue indicators?"
   - "Who are their key customers?"
   - "What is their growth trajectory?"
```

### 2. Iterative Research Process

```typescript
interface ResearchIteration {
  iteration: number
  questions: string[]
  findings: Finding[]
  gaps: string[]
  confidence: number
  decision: 'continue' | 'sufficient'
}

// Iteration 1
{
  questions: ["What is Snowplow's architecture?"],
  findings: ["Uses real-time streaming", "Built on AWS"],
  gaps: ["Missing scalability metrics", "No performance data"],
  confidence: 0.4,
  decision: 'continue'
}

// Iteration 2  
{
  questions: ["Snowplow performance benchmarks", "Events per second capacity"],
  findings: ["Handles 5 billion events/day", "Sub-second latency"],
  gaps: ["Customer case studies needed"],
  confidence: 0.7,
  decision: 'continue'
}

// Iteration 3
{
  questions: ["Snowplow enterprise customers", "Case studies"],
  findings: ["Used by Strava, The Economist", "99.9% uptime SLA"],
  gaps: [],
  confidence: 0.85,
  decision: 'sufficient'
}
```

### 3. Evidence-Claim Linking

Each finding directly supports a claim:
```
Claim: "Snowplow can handle enterprise scale"
Evidence: [
  { source: "architecture page", fact: "5 billion events/day", confidence: 0.9 },
  { source: "case study", fact: "Strava processes 1B events", confidence: 0.85 }
]
Citation: "Snowplow demonstrates enterprise scalability, processing 5 billion events daily [1] with customers like Strava handling over 1 billion events [2]."
```

### 4. Confidence-Based Scoring

Instead of arbitrary scores:
```
Investment Score = weighted_average([
  technical_confidence * technical_importance,
  market_confidence * market_importance,
  business_confidence * business_importance
])

Where confidence comes from:
- How many questions were answered
- Quality of evidence found
- Gaps that remain
```

## Implementation Requirements

1. **Replace blind crawling** with query-driven search
2. **Add reflection layer** to identify knowledge gaps
3. **Implement iterative research** with dynamic stopping
4. **Link evidence to claims** during collection, not after
5. **Track confidence** throughout the process
6. **Generate citations inline** as claims are made

## Key Insight

The fundamental shift is from:
> "Collect everything, then figure out what to use"

To:
> "Know what you need, search until you find it, reflect on what's missing, repeat"

This is what makes DeepSearcher and Google's agent actually do "research" rather than just "retrieval".