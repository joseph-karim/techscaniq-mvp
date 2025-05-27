# Evidence & Citation Architecture with Jina AI

## Overview

The evidence and citation system leverages Jina AI's complete suite of services to create a comprehensive, traceable, and verifiable report generation pipeline. Every claim in our executive reports is backed by real evidence with a complete audit trail.

## Architecture Components

### 1. Evidence Collection Pipeline

```
DeepSearch → Reader → Search → Segmenter → Embeddings → Classifier → Storage
```

#### 1.1 DeepSearch (Primary Intelligence)
- **Purpose**: Comprehensive, iterative research on companies
- **How it works**: 
  - Takes a research query like "Analyze Company X's technology infrastructure"
  - Iteratively searches, reads, and reasons until finding comprehensive answers
  - Returns structured findings with source URLs and confidence scores
- **Breadcrumb**: Records the search query and reasoning steps

#### 1.2 Reader API (Direct Extraction)
- **Purpose**: Extract content from specific URLs
- **Features used**:
  - `X-With-Shadow-Dom`: Extract content from complex React/Vue apps
  - `X-With-Generated-Alt`: Generate descriptions for images
  - `X-With-Links-Summary`: Gather all links for deeper exploration
  - `X-Target-Selector`: Focus on specific page sections
- **Breadcrumb**: Records URL, selectors used, extraction method

#### 1.3 Search API (Broad Intelligence)
- **Purpose**: Find additional information beyond company websites
- **Queries include**:
  - Technical: "Company X GitHub open source"
  - Security: "Company X CVE vulnerability disclosure"
  - Financial: "Company X funding revenue metrics"
- **Breadcrumb**: Records search query, number of results

### 2. Evidence Processing Pipeline

#### 2.1 Segmentation
- **Purpose**: Break long documents into analyzable chunks
- **Process**:
  ```
  Long Document → Jina Segmenter → Semantic Chunks (1000 chars max)
  ```
- **Metadata captured**:
  - Character positions (start/end)
  - Token count per chunk
  - Semantic density score

#### 2.2 Embedding Generation
- **Purpose**: Create vector representations for semantic search
- **Model**: `jina-embeddings-v3` (1024 dimensions)
- **Configuration**:
  - Task: `retrieval.passage` (optimized for evidence chunks)
  - Late chunking: Disabled (already segmented)
- **Storage**: Vectors stored in PostgreSQL with pgvector

#### 2.3 Classification
- **Purpose**: Categorize evidence for better organization
- **Categories**:
  - Technology Infrastructure
  - Security Risk
  - Team & Culture
  - Financial Data
  - Market Position
  - Technical Debt
  - Compliance Issue
  - Competitive Advantage

### 3. Citation Generation Pipeline

#### 3.1 Claim-Evidence Matching
When generating a report claim:
1. **Embed the claim** using Jina Embeddings
2. **Semantic search** through evidence chunks using pgvector
3. **Rerank results** using Jina Reranker for relevance
4. **Select top citations** based on combined score

#### 3.2 Reranking Process
- **Model**: `jina-reranker-v2-base-multilingual`
- **Input**: Claim + Evidence chunks
- **Output**: Relevance scores (0-1)
- **Selection criteria**:
  - Relevance score > 0.7
  - Semantic similarity > 0.5
  - Combined score = (0.7 × relevance) + (0.3 × similarity)

#### 3.3 Citation Classification
Each citation is classified as:
- **Direct Evidence**: Directly supports the claim
- **Supporting Context**: Provides background
- **Counter Evidence**: Contradicts or challenges
- **Technical Specification**: Technical details
- **Market Data**: Industry/market information
- **Expert Opinion**: Third-party analysis

### 4. Breadcrumb Trail Structure

Every piece of evidence maintains a complete trail:

```json
{
  "citation_id": "uuid",
  "trail": [
    {
      "level": "source",
      "method": "deepsearch",
      "query": "Company X security posture",
      "timestamp": "2024-01-27T10:00:00Z"
    },
    {
      "level": "extraction",
      "url": "https://company.com/security",
      "selectors": ["main", ".security-content"],
      "method": "jina_reader"
    },
    {
      "level": "processing",
      "segmentation": {
        "chunks": 5,
        "avgSize": 850
      },
      "embedding": {
        "model": "jina-embeddings-v3",
        "dimension": 1024
      }
    },
    {
      "level": "matching",
      "claim": "Company has strong security practices",
      "relevanceScore": 0.92,
      "semanticSimilarity": 0.87
    }
  ]
}
```

## Database Schema

### Evidence Storage Hierarchy

1. **evidence_collections**: Top-level collection for a company
2. **evidence_items**: Raw evidence from various sources
3. **evidence_chunks**: Segmented, embedded chunks
4. **citation_candidates**: Reranked chunks for specific claims
5. **structured_citations**: Final citations used in reports

### Key Features

- **Vector indexes** for fast semantic search
- **JSONB indexes** for efficient breadcrumb queries
- **Full-text search** indexes for keyword matching
- **Composite scoring** functions for citation ranking

## Processing Flow Example

```
1. User requests report on "OpenAI"
   ↓
2. DeepSearch: "OpenAI technology infrastructure analysis"
   → Finds 15 relevant sources
   ↓
3. Reader extracts content from each source
   → Shadow DOM extraction for React apps
   → Image captioning for architecture diagrams
   ↓
4. Segmenter breaks content into chunks
   → Average 850 chars per chunk
   → 127 total chunks created
   ↓
5. Embeddings created for all chunks
   → Stored in pgvector for search
   ↓
6. Classifier categorizes chunks
   → 45% Technology, 20% Security, etc.
   ↓
7. Report makes claim: "OpenAI uses Kubernetes"
   ↓
8. System embeds claim and searches chunks
   → Finds 8 relevant chunks
   ↓
9. Reranker scores chunks against claim
   → Top 3 selected (scores: 0.94, 0.91, 0.88)
   ↓
10. Citations created with full breadcrumb
    → Each citation traceable to source
```

## API Integration Points

### Edge Functions
1. **evidence-collector**: Orchestrates DeepSearch, Reader, Search
2. **evidence-processor**: Handles segmentation, embedding, classification
3. **citation-generator**: Manages reranking and citation creation
4. **report-orchestrator-v3**: Coordinates entire pipeline

### Jina API Usage
- **DeepSearch**: 5-10 queries per report (comprehensive research)
- **Reader**: 10-20 pages per company
- **Search**: 5-10 queries for external intel
- **Segmenter**: All collected content
- **Embeddings**: All chunks + claims
- **Reranker**: ~50 reranking operations per report
- **Classifier**: All evidence chunks

## Benefits

1. **Complete Traceability**: Every claim → citation → chunk → source
2. **High Relevance**: Reranking ensures best evidence selection
3. **Semantic Understanding**: Embeddings capture meaning, not just keywords
4. **Scalability**: Vector search handles millions of evidence pieces
5. **Flexibility**: Easy to add new evidence sources or citation types

## Cost Optimization

1. **Batch Processing**: Group embedding/classification requests
2. **Caching**: Store embeddings for reuse
3. **Smart Segmentation**: Optimal chunk size (1000 chars) balances quality/cost
4. **Selective Reranking**: Only rerank when generating citations

## Future Enhancements

1. **Multi-modal Evidence**: Process images/videos with Jina CLIP
2. **Cross-lingual**: Use multilingual models for global companies
3. **Real-time Updates**: Continuous evidence collection
4. **Citation Confidence**: ML model to predict citation quality
5. **Evidence Deduplication**: Identify duplicate information across sources 