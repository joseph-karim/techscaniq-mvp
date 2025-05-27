# Jina AI Integration Architecture for TechScanIQ

## Overview

Jina AI serves as the core search, retrieval, and storage engine for TechScanIQ's executive report generation system. By leveraging Jina's powerful services, we can gather comprehensive data about target companies while Google's Gemini handles the analysis and insight generation.

## Key Jina Services Used

### 1. **Jina Reader API** (r.jina.ai)
- **Purpose**: Extract structured content from any URL
- **Features Used**:
  - Image captioning for visual content analysis
  - Link gathering for comprehensive site mapping
  - CSS selectors for targeted content extraction
  - Shadow DOM and iframe extraction for complex sites
- **Use Case**: Primary website content extraction for target companies

### 2. **Jina Search API** (s.jina.ai)
- **Purpose**: Web search for additional company information
- **Search Queries**:
  - Technology stack and infrastructure
  - Engineering culture and development practices
  - Security vulnerabilities and data breaches
  - Funding rounds and investor information
  - Leadership team and executive profiles
- **Use Case**: Gathering external intelligence beyond company websites

### 3. **Jina Embeddings API**
- **Purpose**: Create vector embeddings for evidence storage and retrieval
- **Model**: jina-embeddings-v3 (8192 token support)
- **Features**:
  - Text-matching optimized embeddings
  - Support for long documents
  - Multilingual capabilities
- **Use Case**: Storing evidence for citation and retrieval

### 4. **Jina Reranker API**
- **Purpose**: Prioritize most relevant evidence for citations
- **Model**: jina-reranker-v2-base-multilingual
- **Use Case**: Ensuring most relevant evidence is cited in reports

## Architecture Benefits

### 1. **Simplified Infrastructure**
- No need to build custom web scraping logic
- No need to maintain search infrastructure
- Unified API for all data collection needs

### 2. **Enhanced Data Quality**
- Jina Reader handles complex JavaScript-rendered sites
- Search API provides comprehensive web coverage
- Embeddings enable semantic evidence retrieval

### 3. **Scalability**
- API-based approach scales automatically
- No infrastructure maintenance required
- Pay-per-use pricing model

### 4. **Evidence Traceability**
- Every piece of data has a clear source
- Embeddings enable semantic search through evidence
- Reranking ensures most relevant citations

## Integration with Existing Architecture

### Current Service Flow:
1. **jina-data-collector** - Unified interface to all Jina services
2. **tech-intelligence** - Gemini-powered analysis of collected data
3. **report-orchestrator-v2** - Coordinates data collection and analysis

### Data Pipeline:
```
User Request → Orchestrator → Jina Services → Evidence Storage
                    ↓
              Tech Intelligence (Gemini)
                    ↓
              Executive Report
```

## Implementation Details

### Edge Function: jina-data-collector
- Provides unified interface to all Jina services
- Handles authentication and error handling
- Supports all four Jina service types

### Enhanced Orchestrator (v2)
- Uses Jina Reader for primary website analysis
- Performs multiple targeted searches for comprehensive data
- Creates embeddings for all evidence
- Stores structured evidence with source attribution

### Evidence Management
- Each evidence piece includes:
  - Type (website_content, search_result)
  - Source URL or query
  - Timestamp
  - Raw data
  - Vector embedding
- Enables semantic search and retrieval
- Supports citation generation

## Task Integration

Based on the TaskMaster analysis, Jina AI directly addresses:

- **Task 42**: Multi-API Data Collection Service - Replaced with Jina integration
- **Task 45**: Evidence Citation System - Enhanced with embeddings and reranking
- **Task 46**: Multi-Model AI Ensemble - Simplified to Jina + Gemini combination

## Future Enhancements

### 1. **DeepSearch Integration**
- Use Jina's DeepSearch for comprehensive company research
- "Search, read and reason until best answer found"
- Perfect for deep company intelligence gathering

### 2. **Classifier Integration**
- Use Jina Classifier for categorizing evidence
- Automatic tagging of evidence types
- Improved organization of findings

### 3. **Segmenter Integration**
- Break down long documents into analyzable chunks
- Maintain context while processing large documents
- Optimize for LLM token limits

## API Key Management

- Jina API key stored in Supabase secrets
- Accessible via `JINA_API_KEY` environment variable
- Single key provides access to all Jina services

## Cost Optimization

- Jina Reader: Pay per request, includes generous rate limits
- Search API: Cost-effective web search
- Embeddings: Batch processing for efficiency
- Reranker: Only used for final evidence selection

## Conclusion

Jina AI provides the perfect foundation for TechScanIQ's data collection needs. By combining Jina's powerful search and retrieval capabilities with Gemini's analysis prowess, we create a comprehensive executive report generation system that is:

- **Scalable**: API-based approach handles any volume
- **Reliable**: No infrastructure to maintain
- **Comprehensive**: Multiple data sources and search capabilities
- **Traceable**: Every claim backed by stored evidence
- **Efficient**: Optimized costs and performance 