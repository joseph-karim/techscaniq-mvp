# TechScan Evidence Collector Chrome Extension

A comprehensive Chrome extension that captures detailed web data for technical due diligence analysis.

## Features

### 🔍 **Comprehensive Data Collection**
- **Network Traffic**: Captures all HTTP requests, responses, headers, and bodies
- **DOM Analysis**: Full HTML structure, scripts, stylesheets, forms, and metadata
- **Technology Detection**: Identifies frameworks, libraries, analytics tools, and CDNs
- **Performance Metrics**: Load times, paint events, and resource counts
- **Page Structure**: Element counts, navigation patterns, and architectural analysis

### 📊 **Collected Data Types**
- HTML/CSS/JavaScript source code
- API endpoints and data flows
- Third-party services and integrations
- Form structures and input validation
- Image assets and media files
- External dependencies and CDN usage

### 💾 **Export Options**
- **JSON Format**: Raw data for programmatic analysis
- **Markdown Report**: Human-readable summary
- **Categorized by Page Type**: Homepage, app, pricing, features, etc.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The TechScan icon should appear in your extension toolbar

## Usage

1. **Navigate** to the target website (e.g., ring4.com)
2. **Click** the TechScan extension icon
3. **Select** the page type (Homepage, App, Pricing, etc.)
4. **Click** "🔍 Collect & Refresh Page"
5. **Wait** for collection to complete (~10 seconds)
6. **Export** data as JSON or view as markdown report

## What Gets Collected

### Network Data
```json
{
  "requests": [
    {
      "url": "https://ring4.com/api/user/profile",
      "method": "GET",
      "headers": { "Authorization": "Bearer ..." },
      "response": { "status": 200, "body": "..." },
      "type": "XHR"
    }
  ],
  "summary": {
    "jsFiles": 15,
    "apiCalls": 8,
    "uniqueDomains": ["ring4.com", "google.com"]
  }
}
```

### DOM Data
```json
{
  "html": { "fullHTML": "<!DOCTYPE html>..." },
  "scripts": [
    { "src": "/js/app.js", "type": "module" }
  ],
  "technologies": {
    "frameworks": ["React", "Next.js"],
    "analytics": ["Google Analytics"]
  },
  "performance": {
    "loadTime": 1200,
    "firstContentfulPaint": 800
  }
}
```

## Integration with TechScan Workflow

The collected data can be fed directly into the TechScan AI analysis pipeline:

1. **Export JSON** from the extension
2. **Upload** to TechScan evidence collector
3. **Analyze** with Claude AI for investment insights
4. **Generate** comprehensive technical due diligence reports

## Privacy & Security

- **Local Storage**: All data stored locally in Chrome
- **No External Transmission**: Extension doesn't send data anywhere
- **Manual Export**: You control when and where data is shared
- **Clear Data**: One-click option to delete all collected evidence

## Advanced Features

### Technology Detection
Automatically identifies:
- Frontend frameworks (React, Vue, Angular)
- CSS frameworks (Bootstrap, Tailwind)
- Analytics tools (Google Analytics, Mixpanel)
- CDNs and external services
- Build tools and bundlers

### Performance Analysis
Captures:
- Page load metrics
- Resource loading times
- First paint and contentful paint
- DOM complexity analysis
- Network efficiency metrics

## Troubleshooting

**Extension not working?**
- Ensure you're on `https://` pages (required for debugger API)
- Refresh the page and try again
- Check Chrome developer console for errors

**No data collected?**
- Make sure page finished loading before collection
- Some sites block debugger access (rare)
- Try different page types (homepage vs app pages)

## Use Cases

- **Investment Due Diligence**: Technical architecture assessment
- **Competitive Analysis**: Technology stack comparison  
- **Security Assessment**: Third-party dependency analysis
- **Performance Audit**: Loading speed and optimization analysis
- **Architecture Review**: Frontend/backend technology choices