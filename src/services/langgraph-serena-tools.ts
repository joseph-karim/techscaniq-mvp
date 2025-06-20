/**
 * LangGraph Tools for Serena Integration
 * 
 * Provides tools that the LangGraph agent can use to perform
 * semantic code analysis on extracted website code.
 */

import { Tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SerenaCodeAnalyzer } from './serena-integration';

/**
 * Tool for analyzing code structure and symbols
 */
export class AnalyzeCodeStructureTool extends Tool {
  name = 'analyze_code_structure';
  description = `Analyze the structure of extracted code to identify classes, functions, methods, and other symbols.
    Returns a hierarchical overview of the codebase structure with semantic understanding.
    Use this to understand the architecture and organization of the code.`;

  schema = z.object({
    code: z.record(z.string()).describe('Object mapping filenames to code content'),
    language: z.enum(['javascript', 'typescript', 'python', 'java', 'php', 'go', 'rust', 'cpp'])
      .describe('Programming language of the code'),
    depth: z.number().optional().default(2)
      .describe('How deep to analyze nested symbols (e.g., methods within classes)'),
  });

  private analyzer: SerenaCodeAnalyzer;

  constructor(analyzer: SerenaCodeAnalyzer) {
    super();
    this.analyzer = analyzer;
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    const tempPath = `/tmp/techscan-${Date.now()}`;
    
    const result = await this.analyzer.analyzeWebsiteCode(input.code, {
      projectPath: tempPath,
      language: input.language,
      includeBody: false,
    });

    return JSON.stringify({
      totalSymbols: result.symbols.length,
      symbols: result.symbols,
      insights: result.insights,
    }, null, 2);
  }
}

/**
 * Tool for finding specific code patterns
 */
export class FindCodePatternsTool extends Tool {
  name = 'find_code_patterns';
  description = `Search for specific patterns in code using regular expressions with semantic context.
    Returns matches with surrounding context lines to understand usage.
    Use this to find security issues, API usage, framework patterns, etc.`;

  schema = z.object({
    code: z.record(z.string()).describe('Object mapping filenames to code content'),
    patterns: z.array(z.object({
      name: z.string().describe('Name for this pattern search'),
      regex: z.string().describe('Regular expression pattern to search for'),
    })).describe('Patterns to search for'),
    contextLines: z.number().optional().default(2)
      .describe('Number of context lines before and after matches'),
  });

  private analyzer: SerenaCodeAnalyzer;

  constructor(analyzer: SerenaCodeAnalyzer) {
    super();
    this.analyzer = analyzer;
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    const results = await Promise.all(
      input.patterns.map(async (pattern) => {
        const matches = await this.analyzer.searchPattern(
          pattern.regex,
          input.contextLines
        );
        return {
          pattern: pattern.name,
          regex: pattern.regex,
          matchCount: matches.matches.length,
          matches: matches.matches,
        };
      })
    );

    return JSON.stringify(results, null, 2);
  }
}

/**
 * Tool for finding specific symbols by name
 */
export class FindSymbolsTool extends Tool {
  name = 'find_symbols';
  description = `Find specific symbols (classes, functions, methods, variables) by name or pattern.
    Supports exact and substring matching. Returns detailed information about found symbols.
    Use this when you need to locate specific code entities.`;

  schema = z.object({
    code: z.record(z.string()).describe('Object mapping filenames to code content'),
    language: z.enum(['javascript', 'typescript', 'python', 'java', 'php', 'go', 'rust', 'cpp'])
      .describe('Programming language of the code'),
    symbolName: z.string().describe('Name or pattern to search for'),
    symbolTypes: z.array(z.enum(['class', 'function', 'method', 'variable', 'interface', 'enum']))
      .optional()
      .describe('Types of symbols to include in search'),
    includeBody: z.boolean().optional().default(false)
      .describe('Include the source code body of found symbols'),
  });

  private analyzer: SerenaCodeAnalyzer;

  constructor(analyzer: SerenaCodeAnalyzer) {
    super();
    this.analyzer = analyzer;
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    // Map symbol types to LSP SymbolKind numbers
    const symbolKindMap: Record<string, number> = {
      'class': 5,
      'function': 12,
      'method': 6,
      'variable': 13,
      'interface': 11,
      'enum': 10,
    };

    const includeKinds = input.symbolTypes?.map(t => symbolKindMap[t]);

    const symbols = await this.analyzer.findSymbols(input.symbolName, {
      includeKinds,
      substringMatching: true,
      includeBody: input.includeBody,
    });

    return JSON.stringify({
      query: input.symbolName,
      foundCount: symbols.length,
      symbols: symbols,
    }, null, 2);
  }
}

/**
 * Tool for detecting security issues in code
 */
export class DetectSecurityIssuesTool extends Tool {
  name = 'detect_security_issues';
  description = `Analyze code for common security vulnerabilities and bad practices.
    Searches for hardcoded credentials, SQL injection risks, XSS vulnerabilities, etc.
    Returns detailed findings with severity levels and locations.`;

  schema = z.object({
    code: z.record(z.string()).describe('Object mapping filenames to code content'),
    language: z.enum(['javascript', 'typescript', 'python', 'java', 'php', 'go', 'rust', 'cpp'])
      .describe('Programming language of the code'),
  });

  private analyzer: SerenaCodeAnalyzer;

  constructor(analyzer: SerenaCodeAnalyzer) {
    super();
    this.analyzer = analyzer;
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    const securityPatterns = [
      // Credentials
      { name: 'hardcoded_password', regex: 'password\\s*=\\s*["\']\\w+["\']' },
      { name: 'api_key', regex: 'api[_-]?key\\s*=\\s*["\'][\\w-]+["\']' },
      { name: 'secret_key', regex: 'secret[_-]?key\\s*=\\s*["\'][\\w-]+["\']' },
      
      // SQL Injection
      { name: 'sql_concatenation', regex: 'SELECT.*\\+.*\\+.*FROM|"SELECT.*"\\s*\\+' },
      { name: 'sql_interpolation', regex: '`SELECT.*\\$\\{.*\\}.*FROM`' },
      
      // XSS
      { name: 'innerHTML', regex: '\\.innerHTML\\s*=' },
      { name: 'dangerouslySetInnerHTML', regex: 'dangerouslySetInnerHTML' },
      
      // Eval
      { name: 'eval_usage', regex: 'eval\\s*\\(' },
      { name: 'function_constructor', regex: 'new\\s+Function\\s*\\(' },
    ];

    const result = await this.analyzer.analyzeWebsiteCode(input.code, {
      projectPath: `/tmp/techscan-security-${Date.now()}`,
      language: input.language,
    });

    // Search for security patterns
    const securityFindings = [];
    for (const pattern of securityPatterns) {
      const matches = await this.analyzer.searchPattern(pattern.regex, 3);
      if (matches.matches.length > 0) {
        securityFindings.push({
          issue: pattern.name,
          severity: this.getSeverity(pattern.name),
          occurrences: matches.matches.length,
          locations: matches.matches.map(m => ({
            file: m.file,
            lines: m.lineNumbers,
          })),
        });
      }
    }

    return JSON.stringify({
      securityIssues: securityFindings,
      summary: {
        total: securityFindings.length,
        critical: securityFindings.filter(f => f.severity === 'critical').length,
        high: securityFindings.filter(f => f.severity === 'high').length,
        medium: securityFindings.filter(f => f.severity === 'medium').length,
        low: securityFindings.filter(f => f.severity === 'low').length,
      },
    }, null, 2);
  }

  private getSeverity(issueType: string): string {
    const severityMap: Record<string, string> = {
      'hardcoded_password': 'critical',
      'api_key': 'high',
      'secret_key': 'high',
      'sql_concatenation': 'high',
      'sql_interpolation': 'high',
      'innerHTML': 'medium',
      'dangerouslySetInnerHTML': 'medium',
      'eval_usage': 'high',
      'function_constructor': 'high',
    };
    return severityMap[issueType] || 'medium';
  }
}

/**
 * Tool for understanding code dependencies and imports
 */
export class AnalyzeDependenciesTool extends Tool {
  name = 'analyze_dependencies';
  description = `Analyze code to extract dependencies, imports, and module relationships.
    Identifies external libraries, internal modules, and dependency patterns.
    Useful for understanding the tech stack and architecture.`;

  schema = z.object({
    code: z.record(z.string()).describe('Object mapping filenames to code content'),
    language: z.enum(['javascript', 'typescript', 'python', 'java', 'php', 'go', 'rust', 'cpp'])
      .describe('Programming language of the code'),
  });

  private analyzer: SerenaCodeAnalyzer;

  constructor(analyzer: SerenaCodeAnalyzer) {
    super();
    this.analyzer = analyzer;
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    const importPatterns = {
      javascript: [
        { name: 'es6_import', regex: 'import\\s+.*\\s+from\\s+[\'"]([^"\']+)[\'"]' },
        { name: 'require', regex: 'require\\([\'"]([^"\']+)[\'"]\\)' },
      ],
      typescript: [
        { name: 'es6_import', regex: 'import\\s+.*\\s+from\\s+[\'"]([^"\']+)[\'"]' },
        { name: 'require', regex: 'require\\([\'"]([^"\']+)[\'"]\\)' },
      ],
      python: [
        { name: 'import', regex: 'import\\s+([\\w.]+)' },
        { name: 'from_import', regex: 'from\\s+([\\w.]+)\\s+import' },
      ],
      java: [
        { name: 'import', regex: 'import\\s+([\\w.]+);' },
      ],
      php: [
        { name: 'use', regex: 'use\\s+([\\w\\\\]+);' },
        { name: 'require', regex: 'require(?:_once)?\\s*[\'"]([^"\']+)[\'"]' },
      ],
    };

    const patterns = importPatterns[input.language] || importPatterns.javascript;
    const dependencies = new Set<string>();
    const moduleGraph: Record<string, string[]> = {};

    for (const [filename, content] of Object.entries(input.code)) {
      moduleGraph[filename] = [];
      
      for (const pattern of patterns) {
        const regex = new RegExp(pattern.regex, 'gm');
        let match;
        while ((match = regex.exec(content)) !== null) {
          const dep = match[1];
          dependencies.add(dep);
          moduleGraph[filename].push(dep);
        }
      }
    }

    // Categorize dependencies
    const categorized = {
      external: Array.from(dependencies).filter(d => !d.startsWith('.') && !d.startsWith('/')),
      internal: Array.from(dependencies).filter(d => d.startsWith('.') || d.startsWith('/')),
    };

    return JSON.stringify({
      totalDependencies: dependencies.size,
      external: categorized.external,
      internal: categorized.internal,
      moduleGraph: moduleGraph,
      frameworks: this.detectFrameworks(categorized.external),
    }, null, 2);
  }

  private detectFrameworks(deps: string[]): string[] {
    const frameworks = [];
    
    if (deps.some(d => d.includes('react'))) frameworks.push('React');
    if (deps.some(d => d.includes('vue'))) frameworks.push('Vue');
    if (deps.some(d => d.includes('@angular'))) frameworks.push('Angular');
    if (deps.some(d => d.includes('express'))) frameworks.push('Express');
    if (deps.some(d => d.includes('django'))) frameworks.push('Django');
    if (deps.some(d => d.includes('flask'))) frameworks.push('Flask');
    if (deps.some(d => d.includes('spring'))) frameworks.push('Spring');
    
    return frameworks;
  }
}

/**
 * Create all Serena-based tools for LangGraph
 */
export function createSerenaTools(mcpClient: any): Tool[] {
  const analyzer = new SerenaCodeAnalyzer(mcpClient);
  
  return [
    new AnalyzeCodeStructureTool(analyzer),
    new FindCodePatternsTool(analyzer),
    new FindSymbolsTool(analyzer),
    new DetectSecurityIssuesTool(analyzer),
    new AnalyzeDependenciesTool(analyzer),
  ];
}