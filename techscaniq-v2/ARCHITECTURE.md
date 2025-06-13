# TechScanIQ 2.0 Architecture

## Overview
TechScanIQ 2.0 is a complete redesign of the PE due diligence platform, built with modern agent architecture to deliver investment-grade research reports with proper evidence collection and citation management.

## Key Improvements from v1
1. **Actual Content Collection**: Fixed the critical issue where v1 was storing job metadata instead of actual content
2. **Thesis-Driven Architecture**: All research is guided by weighted investment thesis pillars
3. **Multi-Model Strategy**: Uses the right AI model for each task
4. **Iterative Refinement**: Reflection loops to identify gaps and improve evidence quality
5. **Proper Citation Management**: Every claim is backed by traceable sources

## Model Strategy

### Claude (Anthropic)
- **Models**: Claude Opus 4, Claude Sonnet 4
- **Used For**: Orchestration, workflow management, high-level reasoning
- **Why**: Claude Opus 4 achieved 72.5% on SWE-bench and excels at complex reasoning

### Gemini (Google)
- **Models**: Gemini 2.0 Flash, Gemini 2.5 Pro
- **Used For**: Fast content parsing, web scraping analysis, entity extraction
- **Why**: Extremely fast processing with good accuracy for information extraction

### OpenAI
- **Models**: GPT-4o (general tasks), o3-pro-2025-06-10 (deep analysis)
- **Used For**: 
  - GPT-4o: Query generation, quality evaluation
  - o3-pro: Deep investment analysis, competitive assessment, technology moat evaluation
- **Why**: o3-pro provides extended thinking time for complex analytical tasks

## Core Components

### 1. LangGraph Orchestrator (`/src/orchestrator/`)
- **Purpose**: Manages the research workflow with stateful, iterative processing
- **Nodes**:
  - `interpretThesis`: Breaks down investment thesis into research components
  - `generateQueries`: Creates targeted search queries based on thesis pillars
  - `gatherEvidence`: Collects actual content from web sources
  - `evaluateQuality`: Scores evidence on relevance, credibility, recency
  - `reflectAndRefine`: Identifies gaps and generates refined queries
  - `generateReport`: Creates investment-grade report with citations

### 2. Evidence Collection (`/src/tools/`)
- **WebSearchTool**: Multi-provider search (Tavily, Serper, DuckDuckGo fallback)
- **DocumentAnalyzer**: Extracts content using Playwright for JS-heavy sites
- **GeminiAnalyzer**: Fast content analysis and entity extraction
- **DeepAnalyzer**: o3-pro powered deep investment analysis

### 3. Background Processing (`/src/services/`)
- **BullMQ + Redis**: Manages parallel evidence gathering jobs
- **Workers**: Search workers and analysis workers for concurrent processing

### 4. Type System (`/src/types/`)
- **InvestmentThesis**: Core thesis with weighted pillars
- **Evidence**: Structured evidence with quality scores
- **ResearchState**: LangGraph state management
- **Citations**: Traceable source references

## Research Flow

1. **Thesis Interpretation** (Claude)
   - Analyzes investment thesis
   - Identifies success criteria and risk factors
   - Generates initial research questions

2. **Query Generation** (GPT-4o)
   - Creates targeted searches for each thesis pillar
   - Generates web, news, and academic queries
   - Prioritizes based on pillar weights

3. **Evidence Gathering** (Gemini + Tools)
   - Searches multiple sources concurrently
   - Extracts actual content (not just metadata!)
   - Parses documents, PDFs, and web pages

4. **Quality Evaluation** (GPT-4o)
   - Scores evidence on multiple factors
   - Filters high-quality evidence
   - Identifies credible sources

5. **Reflection & Refinement** (GPT-4o)
   - Analyzes coverage gaps
   - Identifies contradictions
   - Generates refined queries
   - Iterates up to 5 times

6. **Deep Analysis** (o3-pro)
   - Comprehensive investment thesis validation
   - Competitive position assessment
   - Technology moat evaluation
   - Risk identification

7. **Report Generation** (GPT-4o)
   - Executive summary
   - Pillar-by-pillar analysis
   - Risk assessment
   - Investment recommendation
   - Full citation tracking

## Key Design Decisions

### Why LangGraph?
- Stateful workflow management
- Built-in persistence and recovery
- Natural fit for iterative research
- Easy to extend and modify

### Why Multiple Models?
- Claude: Best-in-class reasoning for orchestration
- Gemini: Ultra-fast for high-volume content processing
- o3-pro: Deep thinking for complex analysis
- GPT-4o: Reliable general-purpose tasks

### Why Separate Evidence Gathering?
- Parallel processing for speed
- Actual content extraction (critical fix from v1)
- Multiple fallback options
- Proper error handling

## Configuration

Environment variables required:
```bash
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key  
GOOGLE_AI_API_KEY=your-key
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Next Steps

1. **Vector Database Integration**: Add semantic search capabilities
2. **API Endpoints**: RESTful API for frontend integration
3. **Real-time Updates**: WebSocket support for progress tracking
4. **Enhanced Sources**: Add LinkedIn, Crunchbase, patent databases
5. **Report Templates**: Customizable report formats
6. **Collaboration Features**: Multi-user review and annotation