# CIBC Report Rendering Issues & Serena Integration Plan

## Executive Summary

This document captures the lessons learned from troubleshooting the CIBC LangGraph report rendering issues and outlines the integration plan for Serena's semantic code analysis capabilities into TechScanIQ.

## Part 1: CIBC Report Rendering - Lessons Learned

### Issues Encountered

1. **Report Structure Mismatch**
   - **Problem**: The CIBC report structure didn't match the expected LangGraph format
   - **Root Cause**: The conversion script expected `report.state.thesis` but the actual structure had `report.thesis`
   - **Solution**: Updated conversion script to match actual data structure

2. **Routing Configuration**
   - **Problem**: Links pointed to old URLs (`/admin/langgraph-report/cibc-adobe-sales-2024`)
   - **Root Cause**: Multiple places in the codebase referenced the old report ID
   - **Solution**: Systematically updated all references to use the new UUID format

3. **Content Security Policy (CSP) Blocking**
   - **Problem**: Browser blocked API calls to `techscaniq-mvp.onrender.com`
   - **Root Cause**: CSP headers didn't include the API domain
   - **Solution**: 
     - Updated `netlify.toml` to include API domain in CSP
     - Implemented local file fallback for demo reports

4. **Empty Report Content**
   - **Problem**: Despite having 2,544 evidence pieces, report sections were empty/null
   - **Root Cause**: The integrated report format had null `reportSections`
   - **Solution**: Created `fix-cibc-report.cjs` to generate comprehensive content from evidence

5. **Poor Evidence Quality**
   - **Problem**: Evidence was just metadata without meaningful excerpts
   - **Root Cause**: Original evidence lacked actual content excerpts
   - **Solution**: Created `enrich-cibc-evidence.cjs` with 16 detailed evidence entries including:
     - Rich excerpts from credible sources
     - Quality scores and confidence ratings
     - Source attribution with dates and authors

### Key Learnings

1. **Data Structure Validation**
   - Always validate the actual data structure before writing conversion scripts
   - Use tools like `console.log(JSON.stringify(report, null, 2))` to inspect structure
   - Create defensive code that handles multiple possible structures

2. **Routing Updates Need Comprehensive Search**
   - Use global search to find all occurrences of old routes
   - Check both TypeScript/JavaScript files AND JSON data files
   - Update route references in:
     - Component files
     - Router configurations
     - Navigation links
     - Data files

3. **CSP Configuration for API Access**
   - When deploying to Netlify, ensure all API domains are in CSP headers
   - Implement fallback mechanisms for local development and demos
   - Consider using environment variables for API URLs

4. **Evidence Quality is Critical**
   - Sales intelligence reports need substantive evidence with excerpts
   - Each evidence piece should include:
     - Title and source information
     - Actual content excerpts (not just metadata)
     - Quality scores and confidence ratings
     - Proper citations linking to report sections

5. **CommonJS vs ES Modules**
   - Quick scripts (.cjs files) are useful for data transformations
   - Keep them in the root directory for easy execution
   - Use `require()` for CommonJS, `import` for ES modules

### Recommended Fixes for Future Reports

1. **Standardize Report Format**
   ```typescript
   interface LangGraphReport {
     reportId: string;
     company: string;
     website: string;
     reportType: string;
     status: string;
     thesis: Thesis;
     evidence: Evidence[];
     report: {
       executiveSummary: string;
       sections: Section[];
       recommendation?: Recommendation;
     };
     metadata: Metadata;
   }
   ```

2. **Create Report Validation**
   ```typescript
   function validateLangGraphReport(report: any): report is LangGraphReport {
     return (
       report.reportId &&
       report.company &&
       report.thesis &&
       Array.isArray(report.evidence) &&
       report.report?.sections?.length > 0
     );
   }
   ```

3. **Implement Robust Conversion**
   ```javascript
   function convertToLangGraphFormat(sourceReport) {
     // Handle multiple possible source formats
     const thesis = sourceReport.state?.thesis || sourceReport.thesis;
     const evidence = sourceReport.evidence || [];
     
     // Generate content if missing
     if (!sourceReport.reportSections || Object.keys(sourceReport.reportSections).length === 0) {
       generateReportContent(evidence, thesis);
     }
     
     return standardFormat;
   }
   ```

## Part 2: Serena Integration Plan

### Overview

Serena provides semantic code analysis capabilities through Language Server Protocol (LSP), enabling deep understanding of code structure beyond simple text extraction.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Scraper   │────▶│  Code Extractor  │────▶│ Serena Analyzer │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ LangGraph Agent │◀────│  Serena Tools    │◀────│ Temp Project    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Implementation Components

1. **Serena MCP Server**
   - Installed at: `~/mcp-servers/serena`
   - Configuration: `serena_config.yml`
   - Integrated with Claude Code via `claude mcp add`

2. **TypeScript Integration** (`src/services/serena-integration.ts`)
   - `SerenaCodeAnalyzer` class
   - Wraps MCP client calls
   - Handles temporary project creation
   - Provides high-level analysis methods

3. **LangGraph Tools** (`src/services/langgraph-serena-tools.ts`)
   - 5 LangChain-compatible tools:
     - `analyze_code_structure`
     - `find_code_patterns`
     - `find_symbols`
     - `detect_security_issues`
     - `analyze_dependencies`

4. **Python Backend** (`backend/services/serena_tools.py`)
   - Async implementation for LangGraph
   - Pydantic models for input validation
   - Integration with existing agent workflow

### Integration Steps

1. **Phase 1: MCP Client Setup**
   ```python
   # In backend configuration
   from mcp import MCPClient
   
   serena_client = MCPClient({
     'server': 'serena',
     'transport': 'stdio',
     'command': ['uv', 'run', '--directory', '/path/to/serena', 'serena-mcp-server']
   })
   ```

2. **Phase 2: Agent Tool Integration**
   ```python
   # In agent initialization
   from services.serena_tools import create_serena_tools
   
   serena_tools = create_serena_tools(serena_client)
   all_tools = existing_tools + serena_tools
   ```

3. **Phase 3: Enhanced Code Extraction**
   ```python
   # In web scraping pipeline
   def extract_code_files(html_content):
       # Extract inline scripts
       scripts = extract_script_tags(html_content)
       
       # Extract linked JS files
       js_files = fetch_linked_scripts(html_content)
       
       # Extract from browser console
       console_code = extract_console_exports()
       
       return {
           'inline_scripts.js': combine_scripts(scripts),
           'linked_files.js': combine_js_files(js_files),
           'console_exports.js': console_code
       }
   ```

4. **Phase 4: Agent Prompt Enhancement**
   ```python
   ENHANCED_PROMPT = """
   You now have access to semantic code analysis tools:
   
   1. When analyzing a website's technology:
      - First extract code using web scraping tools
      - Then use `analyze_code_structure` to understand the architecture
      - Use `find_symbols` to locate specific components/classes
      - Use `detect_security_issues` for vulnerability assessment
   
   2. For framework detection:
      - Use `analyze_dependencies` to identify imported libraries
      - Use `find_code_patterns` to confirm framework-specific patterns
   
   3. For detailed analysis:
      - Use symbol search to find specific implementations
      - Use pattern search to identify coding practices
   """
   ```

### Benefits

1. **Deeper Technical Understanding**
   - Move beyond surface-level tech detection
   - Understand actual code architecture
   - Identify specific implementations

2. **Security Analysis**
   - Detect hardcoded credentials
   - Find SQL injection vulnerabilities
   - Identify XSS risks

3. **Framework Detection**
   - Accurate framework identification
   - Version detection through code patterns
   - Architecture pattern recognition

4. **Quality Assessment**
   - Code complexity metrics
   - Maintainability indicators
   - Best practices compliance

### Testing Plan

1. **Unit Tests**
   - Test each Serena tool individually
   - Mock MCP client responses
   - Validate output formats

2. **Integration Tests**
   - Test full pipeline with sample websites
   - Verify temporary project cleanup
   - Check error handling

3. **Performance Tests**
   - Measure analysis time for different code sizes
   - Optimize temporary file handling
   - Cache analysis results

### Deployment Considerations

1. **Resource Management**
   - Clean up temporary projects after analysis
   - Implement analysis caching
   - Set reasonable timeouts

2. **Error Handling**
   - Graceful fallback if Serena unavailable
   - Clear error messages for users
   - Retry logic for transient failures

3. **Security**
   - Sandbox code analysis environment
   - Limit resource consumption
   - Validate extracted code before analysis

### Next Steps

1. **Immediate Actions**
   - Complete MCP client initialization in backend
   - Add Serena tools to agent workflow
   - Update agent prompts

2. **Short Term**
   - Enhance code extraction from websites
   - Add caching layer for analysis results
   - Create dashboard for code insights

3. **Long Term**
   - Support more programming languages
   - Add custom LSP servers for specific frameworks
   - Build code similarity detection across scans

### Conclusion

The integration of Serena's semantic code analysis capabilities will transform TechScanIQ from a surface-level scanner to a deep technical analysis platform. By learning from the CIBC report issues and implementing robust data handling, we can ensure reliable and insightful reports for all future scans.