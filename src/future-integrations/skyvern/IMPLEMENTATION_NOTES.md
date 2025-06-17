# Skyvern Integration Implementation Notes

## Overview
Skyvern is an AI-powered browser automation tool that uses computer vision and LLMs to interact with websites without relying on CSS selectors.

## Current State
- Template workers exist: `skyvern-enhanced-worker.ts` and `skyvern-discovery-worker.ts`
- No actual API integration implemented
- Workers contain embedded Python scripts that would need Skyvern SDK

## Implementation Requirements

### 1. API Setup
```bash
# Need to add to .env:
SKYVERN_API_KEY=your_api_key
SKYVERN_API_URL=https://api.skyvern.com/v1
```

### 2. SDK Installation
```bash
# Python
pip install skyvern-sdk

# Or use their REST API directly
```

### 3. Key Use Cases
- **SaaS Discovery**: Navigate through product demos and trials
- **Pricing Extraction**: Handle dynamic pricing calculators
- **Review Sites**: Login and extract gated content
- **LinkedIn**: Navigate profiles with anti-bot detection

### 4. Integration Points
- Replace embedded Python scripts with proper Skyvern API calls
- Integrate with existing queue system
- Add to evidence collection pipeline

### 5. Priority Features
1. Website screenshot capture
2. Interactive element detection
3. Multi-step workflow automation
4. CAPTCHA handling
5. Dynamic content extraction

## Example Implementation
```typescript
import { SkyvvernClient } from '@skyvern/sdk';

const client = new SkyvvernClient({
  apiKey: process.env.SKYVERN_API_KEY
});

// Create task
const task = await client.createTask({
  url: 'https://example.com',
  workflow: {
    steps: [
      { action: 'click', selector: 'Sign Up' },
      { action: 'fill', fields: { email: 'test@example.com' } },
      { action: 'extract', data: ['pricing', 'features'] }
    ]
  }
});
```

## Benefits Over Current Approach
- No CSS selector maintenance
- Handles JavaScript-heavy sites better
- Built-in anti-detection features
- Visual debugging capabilities