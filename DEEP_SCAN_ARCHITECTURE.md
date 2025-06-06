# Deep Evidence Collection Architecture

## 🏗️ System Design

### API Strategy
- **Google Gemini Flash**: High-volume content parsing & extraction (fast & cheap)
- **Claude (Anthropic)**: Strategic decisions & investment analysis (smart & precise)  
- **Google Search API**: Web searches for additional evidence
- **Direct API calls**: No edge functions, direct from worker

### Security
- API keys stored in **Supabase Vault** (not in .env)
- Service role key provides vault access
- Keys loaded once on worker startup

### Evidence Collection Flow

```
1. Deep Crawl (crawl4ai)
   ↓
2. Parse with Gemini Flash (extract tech stack, team, etc.)
   ↓
3. Analyze gaps with Claude (what's missing?)
   ↓
4. Search for missing evidence (Google Search)
   ↓
5. Score by investment thesis alignment
   ↓
6. Store in Supabase (200+ evidence items)
```

### Investment Thesis Alignment

Evidence is weighted based on PE thesis:
- **Accelerate Growth**: Cloud scalability (30%), Dev velocity (25%)
- **Buy & Build**: API architecture (25%), Multi-tenant ready (25%)
- **Margin Expansion**: Cloud costs (30%), Automation potential (25%)
- **Turnaround**: Security gaps (35%), Tech debt (20%)

### Performance

- Crawls 50-200 pages in 15-20 minutes
- Extracts 10-20 evidence items per page
- Total: 200-300 evidence items per scan
- Cost: ~$0.50-1.00 per full scan

### Worker Architecture

```typescript
// Simplified flow
async function collectEvidence() {
  // 1. Load API keys from vault
  const keys = await loadFromSupabaseVault()
  
  // 2. Deep crawl website
  const pages = await crawl4ai.deepCrawl(domain)
  
  // 3. Parse each page with Gemini
  for (const page of pages) {
    const extracted = await geminiFlash.parse(page.html)
    const evidence = scoreByThesis(extracted, investmentThesis)
    await store(evidence)
  }
  
  // 4. Analyze with Claude
  const decision = await claude.analyze(currentEvidence, gaps)
  
  // 5. Fill gaps with search
  if (decision.needsMoreEvidence) {
    const results = await googleSearch(decision.query)
    await processSearchResults(results)
  }
}
```

## 🚀 Running the System

```bash
# Terminal 1: Start worker
npm run worker:evidence:deep

# Terminal 2: Run Mixpanel test
npm run test:mixpanel
```

## 💰 Cost Efficiency

Per scan costs:
- Gemini Flash: ~$0.30 (parsing 200 pages)
- Claude Haiku: ~$0.10 (10-15 decisions)
- Google Search: ~$0.10 (10 searches)
- **Total: ~$0.50 per company**

Compare to:
- Manual PE diligence: $50-100k
- Consulting firm: $25-50k
- This system: $0.50 + infrastructure

## 🎯 PE-Grade Output

The system answers:
1. Can the platform scale 10x? (architecture evidence)
2. How fast can they ship features? (CI/CD evidence)
3. What's the cloud cost structure? (infrastructure evidence)
4. Is the codebase maintainable? (code quality evidence)
5. What security risks exist? (compliance evidence)

All with citations and confidence scores!