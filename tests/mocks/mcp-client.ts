export class MockMCPClient {
  private connected: boolean = false;
  private delay: number = 0;
  private responses: Map<string, any> = new Map();
  
  constructor() {
    this.setupDefaultResponses();
  }
  
  async start(): Promise<void> {
    this.connected = true;
  }
  
  async stop(): Promise<void> {
    this.connected = false;
  }
  
  simulateDisconnect(): void {
    this.connected = false;
  }
  
  async connect(): Promise<void> {
    this.connected = true;
  }
  
  setDelay(delayMs: number): void {
    this.delay = delayMs;
  }
  
  setResponse(tool: string, response: any): void {
    this.responses.set(tool, response);
  }
  
  async callTool(toolName: string, params: any): Promise<any> {
    if (!this.connected) {
      throw new Error('MCP client not connected');
    }
    
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
    
    // Check for custom response
    if (this.responses.has(toolName)) {
      return this.responses.get(toolName);
    }
    
    // Default responses based on tool name
    switch (toolName) {
      case 'analyzeCode':
        return this.generateCodeAnalysisResponse(params);
      
      case 'detectFrameworks':
        return this.generateFrameworkDetectionResponse(params);
      
      case 'findSecurityIssues':
        return this.generateSecurityResponse(params);
      
      case 'getSymbols':
        return this.generateSymbolsResponse(params);
      
      case 'detectPatterns':
        return this.generatePatternsResponse(params);
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
  
  private setupDefaultResponses(): void {
    // Setup common responses
  }
  
  private generateCodeAnalysisResponse(params: any): any {
    const { code, language } = params;
    
    return {
      summary: {
        files: Object.keys(code || {}).length,
        language,
        linesOfCode: 1000,
        complexity: 'medium'
      },
      quality: {
        score: 85,
        issues: [
          {
            type: 'code_smell',
            severity: 'minor',
            message: 'Function too long',
            file: Object.keys(code || {})[0] || 'unknown',
            line: 42
          }
        ]
      }
    };
  }
  
  private generateFrameworkDetectionResponse(params: any): any {
    const { code } = params;
    const frameworks = [];
    
    // Simple framework detection based on content
    const allCode = Object.values(code || {}).join('\n');
    
    if (allCode.includes('React') || allCode.includes('useState')) {
      frameworks.push({
        name: 'React',
        version: '18.2.0',
        confidence: 0.95,
        evidence: 'useState hook found'
      });
    }
    
    if (allCode.includes('Vue') || allCode.includes('v-for')) {
      frameworks.push({
        name: 'Vue.js',
        version: '3.0.0',
        confidence: 0.90,
        evidence: 'Vue template syntax detected'
      });
    }
    
    if (allCode.includes('angular') || allCode.includes('ng-')) {
      frameworks.push({
        name: 'Angular',
        version: '15.0.0',
        confidence: 0.85,
        evidence: 'Angular directives found'
      });
    }
    
    return { frameworks };
  }
  
  private generateSecurityResponse(params: any): any {
    const { code } = params;
    const issues = [];
    
    const allCode = Object.values(code || {}).join('\n');
    
    // Check for common security issues
    if (allCode.includes('eval(')) {
      issues.push({
        type: 'code_injection',
        severity: 'critical',
        message: 'Use of eval() detected',
        locations: [Object.keys(code || {})[0] || 'unknown']
      });
    }
    
    if (allCode.match(/SELECT.*FROM.*WHERE.*\+/)) {
      issues.push({
        type: 'sql_injection',
        severity: 'critical',
        message: 'Potential SQL injection vulnerability',
        locations: [Object.keys(code || {})[0] || 'unknown']
      });
    }
    
    if (allCode.match(/api[_-]?key\s*=\s*['"][^'"]+['"]/i)) {
      issues.push({
        type: 'hardcoded_credentials',
        severity: 'high',
        message: 'Hardcoded API key detected',
        locations: [Object.keys(code || {})[0] || 'unknown']
      });
    }
    
    return { issues };
  }
  
  private generateSymbolsResponse(params: any): any {
    const { code } = params;
    const symbols = [];
    
    for (const [filename, content] of Object.entries(code || {})) {
      // Simple regex-based symbol extraction
      const classMatches = content.matchAll(/class\s+(\w+)/g);
      for (const match of classMatches) {
        const className = match[1];
        const symbol: any = {
          name: className,
          kind: 'class',
          file: filename,
          children: []
        };
        
        // Find methods in class
        const methodRegex = new RegExp(`class\\s+${className}[^{]*{([^}]+)}`, 's');
        const classBody = content.match(methodRegex);
        if (classBody) {
          const methodMatches = classBody[1].matchAll(/(?:async\s+)?(\w+)\s*\([^)]*\)/g);
          for (const methodMatch of methodMatches) {
            symbol.children.push({
              name: methodMatch[1],
              kind: 'method'
            });
          }
        }
        
        symbols.push(symbol);
      }
      
      // Find functions
      const functionMatches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g);
      for (const match of functionMatches) {
        symbols.push({
          name: match[1],
          kind: 'function',
          file: filename
        });
      }
      
      // Find interfaces (TypeScript)
      const interfaceMatches = content.matchAll(/interface\s+(\w+)/g);
      for (const match of interfaceMatches) {
        symbols.push({
          name: match[1],
          kind: 'interface',
          file: filename
        });
      }
      
      // Find Vue components
      if (filename.endsWith('.vue')) {
        const componentMatch = content.match(/name:\s*['"](\w+)['"]/);
        if (componentMatch) {
          symbols.push({
            name: componentMatch[1],
            kind: 'component',
            file: filename
          });
        }
      }
    }
    
    return { symbols };
  }
  
  private generatePatternsResponse(params: any): any {
    const { code } = params;
    const patterns = [];
    
    const allCode = Object.values(code || {}).join('\n');
    
    // Detect common patterns
    if (allCode.includes('EventEmitter') || allCode.includes('.on(') && allCode.includes('.emit(')) {
      patterns.push({
        name: 'Observer Pattern',
        confidence: 0.90,
        locations: Object.keys(code || {})
      });
    }
    
    if (allCode.includes('getInstance') && allCode.includes('constructor') && allCode.includes('private')) {
      patterns.push({
        name: 'Singleton Pattern',
        confidence: 0.85,
        locations: Object.keys(code || {})
      });
    }
    
    if (allCode.includes('Repository') || allCode.includes('Service') && allCode.includes('Controller')) {
      patterns.push({
        name: 'Repository Pattern',
        confidence: 0.80,
        locations: Object.keys(code || {})
      });
    }
    
    return { patterns };
  }
}