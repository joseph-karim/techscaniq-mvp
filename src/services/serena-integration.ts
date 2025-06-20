/**
 * Serena MCP Integration for TechScanIQ
 * 
 * This module provides semantic code analysis capabilities for extracted website code
 * using Serena's language server protocol (LSP) based tools.
 */

export interface SerenaAnalysisConfig {
  projectPath: string;
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust' | 'php' | 'cpp';
  includeBody?: boolean;
  maxAnswerChars?: number;
}

export interface SymbolInfo {
  name: string;
  kind: string;
  kindNumber: number;
  path: string;
  location: {
    file: string;
    startLine: number;
    endLine: number;
  };
  body?: string;
  children?: SymbolInfo[];
}

export interface CodePattern {
  pattern: string;
  matches: Array<{
    file: string;
    lines: string[];
    lineNumbers: number[];
  }>;
}

export class SerenaCodeAnalyzer {
  private mcpClient: any; // Will be injected
  
  constructor(mcpClient: any) {
    this.mcpClient = mcpClient;
  }

  /**
   * Analyze extracted code from a website
   * Creates a temporary project for Serena to analyze
   */
  async analyzeWebsiteCode(
    code: Record<string, string>, // filename -> content
    config: SerenaAnalysisConfig
  ): Promise<{
    symbols: SymbolInfo[];
    patterns: CodePattern[];
    insights: CodeInsights;
  }> {
    // 1. Create temporary project structure
    const tempProjectId = await this.createTempProject(code, config);
    
    try {
      // 2. Activate project in Serena
      await this.activateProject(tempProjectId, config.projectPath);
      
      // 3. Get symbols overview
      const symbols = await this.getSymbolsOverview();
      
      // 4. Search for common patterns
      const patterns = await this.searchPatterns([
        // Security patterns
        { name: 'api_keys', pattern: 'api[_-]?key|secret[_-]?key|access[_-]?token' },
        { name: 'hardcoded_creds', pattern: 'password\\s*=\\s*["\']\\w+["\']' },
        
        // Architecture patterns  
        { name: 'api_endpoints', pattern: '(fetch|axios|http).*[\'"`]/api/.*[\'"`]' },
        { name: 'database_queries', pattern: 'SELECT.*FROM|INSERT.*INTO|UPDATE.*SET' },
        { name: 'state_management', pattern: 'useState|useReducer|createStore|Redux' },
        
        // Framework detection
        { name: 'react_components', pattern: 'export.*function.*\\(.*\\).*{.*return.*<' },
        { name: 'vue_components', pattern: 'export default.*{.*template:|<template>' },
        { name: 'angular_components', pattern: '@Component\\({' },
      ]);
      
      // 5. Generate insights
      const insights = await this.generateInsights(symbols, patterns);
      
      return { symbols, patterns, insights };
      
    } finally {
      // Clean up temp project
      await this.cleanupTempProject(tempProjectId);
    }
  }

  /**
   * Find specific symbols in the code
   */
  async findSymbols(
    namePattern: string,
    options?: {
      includeKinds?: number[]; // LSP SymbolKind values
      excludeKinds?: number[];
      substringMatching?: boolean;
      includeBody?: boolean;
    }
  ): Promise<SymbolInfo[]> {
    const result = await this.mcpClient.callTool('find_symbol', {
      name_path: namePattern,
      include_body: options?.includeBody || false,
      include_kinds: options?.includeKinds,
      exclude_kinds: options?.excludeKinds,
      substring_matching: options?.substringMatching || false,
    });
    
    return JSON.parse(result);
  }

  /**
   * Search for code patterns with context
   */
  async searchPattern(
    pattern: string,
    contextLines: number = 2
  ): Promise<CodePattern> {
    const result = await this.mcpClient.callTool('search_for_pattern', {
      pattern,
      context_lines_before: contextLines,
      context_lines_after: contextLines,
      only_in_code_files: true,
    });
    
    const matches = JSON.parse(result);
    return {
      pattern,
      matches: Object.entries(matches).map(([file, lines]) => ({
        file,
        lines: lines as string[],
        lineNumbers: this.extractLineNumbers(lines as string[]),
      })),
    };
  }

  /**
   * Get overview of all symbols in the codebase
   */
  async getSymbolsOverview(): Promise<SymbolInfo[]> {
    const result = await this.mcpClient.callTool('get_symbols_overview', {
      depth: 2, // Get methods within classes
      include_body: false,
    });
    
    return JSON.parse(result);
  }

  /**
   * Find references to a specific symbol
   */
  async findReferences(symbolPath: string): Promise<SymbolInfo[]> {
    const result = await this.mcpClient.callTool('find_referencing_symbols', {
      name_path: symbolPath,
      include_body: false,
    });
    
    return JSON.parse(result);
  }

  private async createTempProject(
    code: Record<string, string>,
    config: SerenaAnalysisConfig
  ): Promise<string> {
    // Implementation would create temporary files
    // This is conceptual - actual implementation would depend on
    // how we want to handle temporary project creation
    const tempId = `techscan-${Date.now()}`;
    // Write files to temp directory...
    return tempId;
  }

  private async activateProject(
    projectId: string,
    projectPath: string
  ): Promise<void> {
    await this.mcpClient.callTool('activate_project', {
      project_path: projectPath,
    });
  }

  private async searchPatterns(
    patterns: Array<{ name: string; pattern: string }>
  ): Promise<CodePattern[]> {
    const results = await Promise.all(
      patterns.map(p => this.searchPattern(p.pattern))
    );
    return results;
  }

  private async generateInsights(
    symbols: SymbolInfo[],
    patterns: CodePattern[]
  ): Promise<CodeInsights> {
    // Analyze symbols and patterns to generate insights
    const insights: CodeInsights = {
      frameworkDetection: this.detectFrameworks(symbols, patterns),
      architecturePatterns: this.detectArchitecture(symbols),
      securityIssues: this.detectSecurityIssues(patterns),
      codeQuality: this.assessCodeQuality(symbols),
      dependencies: this.detectDependencies(patterns),
    };
    
    return insights;
  }

  private detectFrameworks(
    symbols: SymbolInfo[],
    patterns: CodePattern[]
  ): FrameworkInfo[] {
    const frameworks: FrameworkInfo[] = [];
    
    // React detection
    if (patterns.find(p => p.pattern.includes('useState') && p.matches.length > 0)) {
      frameworks.push({
        name: 'React',
        confidence: 0.95,
        version: 'Unknown',
        evidence: 'React hooks detected',
      });
    }
    
    // Add more framework detection logic...
    
    return frameworks;
  }

  private detectArchitecture(symbols: SymbolInfo[]): ArchitecturePattern[] {
    const patterns: ArchitecturePattern[] = [];
    
    // Detect MVC pattern
    const hasControllers = symbols.some(s => s.name.includes('Controller'));
    const hasModels = symbols.some(s => s.name.includes('Model'));
    const hasViews = symbols.some(s => s.name.includes('View'));
    
    if (hasControllers && hasModels) {
      patterns.push({
        name: 'MVC',
        confidence: 0.8,
        components: ['Controllers', 'Models', hasViews ? 'Views' : 'API'],
      });
    }
    
    return patterns;
  }

  private detectSecurityIssues(patterns: CodePattern[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    // Check for hardcoded credentials
    const credPatterns = patterns.filter(p => 
      p.pattern.includes('password') || p.pattern.includes('api_key')
    );
    
    credPatterns.forEach(p => {
      if (p.matches.length > 0) {
        issues.push({
          type: 'hardcoded_credentials',
          severity: 'high',
          locations: p.matches.map(m => m.file),
          description: 'Potential hardcoded credentials detected',
        });
      }
    });
    
    return issues;
  }

  private assessCodeQuality(symbols: SymbolInfo[]): CodeQualityMetrics {
    // Calculate various metrics
    const totalSymbols = symbols.length;
    const functions = symbols.filter(s => s.kindNumber === 12);
    const classes = symbols.filter(s => s.kindNumber === 5);
    
    return {
      totalSymbols,
      functionCount: functions.length,
      classCount: classes.length,
      avgFunctionLength: this.calculateAvgLength(functions),
      complexity: 'medium', // Would need more analysis
    };
  }

  private detectDependencies(patterns: CodePattern[]): string[] {
    const deps = new Set<string>();
    
    // Extract from import/require statements
    patterns.forEach(p => {
      p.matches.forEach(m => {
        m.lines.forEach(line => {
          const importMatch = line.match(/import.*from ['"](.+)['"]/);
          const requireMatch = line.match(/require\(['"](.+)['"]\)/);
          
          if (importMatch) deps.add(importMatch[1]);
          if (requireMatch) deps.add(requireMatch[1]);
        });
      });
    });
    
    return Array.from(deps);
  }

  private extractLineNumbers(lines: string[]): number[] {
    // Extract line numbers from grep-style output
    return lines.map(line => {
      const match = line.match(/^(\d+):/);
      return match ? parseInt(match[1]) : 0;
    }).filter(n => n > 0);
  }

  private calculateAvgLength(functions: SymbolInfo[]): number {
    if (functions.length === 0) return 0;
    
    const lengths = functions.map(f => 
      f.location.endLine - f.location.startLine
    );
    
    return lengths.reduce((a, b) => a + b, 0) / lengths.length;
  }

  private async cleanupTempProject(projectId: string): Promise<void> {
    // Clean up temporary files
  }
}

// Type definitions
interface CodeInsights {
  frameworkDetection: FrameworkInfo[];
  architecturePatterns: ArchitecturePattern[];
  securityIssues: SecurityIssue[];
  codeQuality: CodeQualityMetrics;
  dependencies: string[];
}

interface FrameworkInfo {
  name: string;
  confidence: number;
  version: string;
  evidence: string;
}

interface ArchitecturePattern {
  name: string;
  confidence: number;
  components: string[];
}

interface SecurityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  locations: string[];
  description: string;
}

interface CodeQualityMetrics {
  totalSymbols: number;
  functionCount: number;
  classCount: number;
  avgFunctionLength: number;
  complexity: 'low' | 'medium' | 'high';
}