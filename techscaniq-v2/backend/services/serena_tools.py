"""
Serena MCP Integration for TechScanIQ LangGraph Agent

Provides semantic code analysis tools using Serena's language server protocol capabilities.
"""

import json
import tempfile
import shutil
from typing import Dict, List, Any, Optional, Literal
from pathlib import Path
from dataclasses import dataclass
from langchain.tools import Tool
from pydantic import BaseModel, Field


class CodeAnalysisInput(BaseModel):
    """Input for code analysis tools"""
    code_files: Dict[str, str] = Field(description="Dictionary mapping filenames to code content")
    language: Literal['javascript', 'typescript', 'python', 'java', 'php', 'go', 'rust', 'cpp'] = Field(
        description="Programming language of the code"
    )


class PatternSearchInput(BaseModel):
    """Input for pattern search"""
    code_files: Dict[str, str] = Field(description="Dictionary mapping filenames to code content")
    patterns: List[Dict[str, str]] = Field(
        description="List of patterns to search, each with 'name' and 'regex' keys"
    )
    context_lines: int = Field(default=2, description="Number of context lines around matches")


class SymbolSearchInput(BaseModel):
    """Input for symbol search"""
    code_files: Dict[str, str] = Field(description="Dictionary mapping filenames to code content")
    language: Literal['javascript', 'typescript', 'python', 'java', 'php', 'go', 'rust', 'cpp'] = Field(
        description="Programming language of the code"
    )
    symbol_name: str = Field(description="Name or pattern to search for")
    symbol_types: Optional[List[str]] = Field(
        default=None,
        description="Types of symbols to search: class, function, method, variable, interface, enum"
    )
    include_body: bool = Field(default=False, description="Include source code body of symbols")


@dataclass
class SerenaIntegration:
    """Manages integration with Serena MCP server"""
    
    def __init__(self, mcp_client):
        self.mcp_client = mcp_client
        self.temp_projects = []
    
    async def create_temp_project(self, code_files: Dict[str, str], language: str) -> str:
        """Create a temporary project directory with code files"""
        temp_dir = tempfile.mkdtemp(prefix="techscan_")
        self.temp_projects.append(temp_dir)
        
        # Write code files to temp directory
        for filename, content in code_files.items():
            file_path = Path(temp_dir) / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content)
        
        # Activate project in Serena
        await self.mcp_client.call_tool("activate_project", {
            "project_path": temp_dir
        })
        
        return temp_dir
    
    async def cleanup_temp_projects(self):
        """Clean up all temporary project directories"""
        for temp_dir in self.temp_projects:
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Error cleaning up {temp_dir}: {e}")
        self.temp_projects.clear()
    
    async def analyze_code_structure(self, code_files: Dict[str, str], language: str) -> Dict[str, Any]:
        """Analyze code structure and symbols"""
        project_path = await self.create_temp_project(code_files, language)
        
        try:
            # Get symbols overview
            symbols_result = await self.mcp_client.call_tool("get_symbols_overview", {
                "depth": 2,
                "include_body": False
            })
            symbols = json.loads(symbols_result)
            
            # Analyze patterns for insights
            insights = await self._generate_insights(symbols, project_path)
            
            return {
                "total_symbols": len(symbols),
                "symbols": symbols,
                "insights": insights
            }
        finally:
            await self.cleanup_temp_projects()
    
    async def search_patterns(self, code_files: Dict[str, str], patterns: List[Dict[str, str]], 
                            context_lines: int = 2) -> List[Dict[str, Any]]:
        """Search for patterns in code"""
        project_path = await self.create_temp_project(code_files, "javascript")  # Default language
        
        try:
            results = []
            for pattern in patterns:
                search_result = await self.mcp_client.call_tool("search_for_pattern", {
                    "pattern": pattern["regex"],
                    "context_lines_before": context_lines,
                    "context_lines_after": context_lines,
                    "only_in_code_files": True
                })
                
                matches = json.loads(search_result)
                results.append({
                    "pattern": pattern["name"],
                    "regex": pattern["regex"],
                    "match_count": sum(len(m) for m in matches.values()),
                    "matches": matches
                })
            
            return results
        finally:
            await self.cleanup_temp_projects()
    
    async def find_symbols(self, code_files: Dict[str, str], language: str, 
                          symbol_name: str, symbol_types: Optional[List[str]] = None,
                          include_body: bool = False) -> Dict[str, Any]:
        """Find specific symbols by name"""
        project_path = await self.create_temp_project(code_files, language)
        
        try:
            # Map symbol types to LSP SymbolKind numbers
            symbol_kind_map = {
                'class': 5,
                'function': 12,
                'method': 6,
                'variable': 13,
                'interface': 11,
                'enum': 10
            }
            
            include_kinds = None
            if symbol_types:
                include_kinds = [symbol_kind_map[t] for t in symbol_types if t in symbol_kind_map]
            
            result = await self.mcp_client.call_tool("find_symbol", {
                "name_path": symbol_name,
                "include_body": include_body,
                "include_kinds": include_kinds,
                "substring_matching": True
            })
            
            symbols = json.loads(result)
            
            return {
                "query": symbol_name,
                "found_count": len(symbols),
                "symbols": symbols
            }
        finally:
            await self.cleanup_temp_projects()
    
    async def detect_security_issues(self, code_files: Dict[str, str], language: str) -> Dict[str, Any]:
        """Detect security issues in code"""
        security_patterns = [
            # Credentials
            {"name": "hardcoded_password", "regex": r"password\s*=\s*[\"']\w+[\"']"},
            {"name": "api_key", "regex": r"api[_-]?key\s*=\s*[\"'][\w-]+[\"']"},
            {"name": "secret_key", "regex": r"secret[_-]?key\s*=\s*[\"'][\w-]+[\"']"},
            
            # SQL Injection
            {"name": "sql_concatenation", "regex": r"SELECT.*\+.*\+.*FROM|\"SELECT.*\"\s*\+"},
            {"name": "sql_interpolation", "regex": r"`SELECT.*\$\{.*\}.*FROM`"},
            
            # XSS
            {"name": "innerHTML", "regex": r"\.innerHTML\s*="},
            {"name": "dangerouslySetInnerHTML", "regex": r"dangerouslySetInnerHTML"},
            
            # Eval
            {"name": "eval_usage", "regex": r"eval\s*\("},
            {"name": "function_constructor", "regex": r"new\s+Function\s*\("},
        ]
        
        findings = await self.search_patterns(code_files, security_patterns, context_lines=3)
        
        security_issues = []
        for finding in findings:
            if finding["match_count"] > 0:
                security_issues.append({
                    "issue": finding["pattern"],
                    "severity": self._get_severity(finding["pattern"]),
                    "occurrences": finding["match_count"],
                    "locations": list(finding["matches"].keys())
                })
        
        summary = {
            "total": len(security_issues),
            "critical": len([i for i in security_issues if i["severity"] == "critical"]),
            "high": len([i for i in security_issues if i["severity"] == "high"]),
            "medium": len([i for i in security_issues if i["severity"] == "medium"]),
            "low": len([i for i in security_issues if i["severity"] == "low"])
        }
        
        return {
            "security_issues": security_issues,
            "summary": summary
        }
    
    async def analyze_dependencies(self, code_files: Dict[str, str], language: str) -> Dict[str, Any]:
        """Analyze code dependencies and imports"""
        import_patterns = {
            "javascript": [
                {"name": "es6_import", "regex": r"import\s+.*\s+from\s+['\"]([^\"']+)['\"]"},
                {"name": "require", "regex": r"require\(['\"]([^\"']+)['\"]\)"},
            ],
            "typescript": [
                {"name": "es6_import", "regex": r"import\s+.*\s+from\s+['\"]([^\"']+)['\"]"},
                {"name": "require", "regex": r"require\(['\"]([^\"']+)['\"]\)"},
            ],
            "python": [
                {"name": "import", "regex": r"import\s+([\w.]+)"},
                {"name": "from_import", "regex": r"from\s+([\w.]+)\s+import"},
            ],
            "java": [
                {"name": "import", "regex": r"import\s+([\w.]+);"},
            ],
            "php": [
                {"name": "use", "regex": r"use\s+([\w\\]+);"},
                {"name": "require", "regex": r"require(?:_once)?\s*['\"]([^\"']+)['\"]"},
            ],
        }
        
        patterns = import_patterns.get(language, import_patterns["javascript"])
        findings = await self.search_patterns(code_files, patterns)
        
        dependencies = set()
        module_graph = {}
        
        for finding in findings:
            for file_path, matches in finding["matches"].items():
                if file_path not in module_graph:
                    module_graph[file_path] = []
                
                for match in matches:
                    # Extract dependency from match
                    # This is simplified - real implementation would parse more carefully
                    deps = self._extract_dependencies_from_match(match, finding["regex"])
                    dependencies.update(deps)
                    module_graph[file_path].extend(deps)
        
        # Categorize dependencies
        external = [d for d in dependencies if not d.startswith('.') and not d.startswith('/')]
        internal = [d for d in dependencies if d.startswith('.') or d.startswith('/')]
        
        return {
            "total_dependencies": len(dependencies),
            "external": external,
            "internal": internal,
            "module_graph": module_graph,
            "detected_frameworks": self._detect_frameworks(external)
        }
    
    async def _generate_insights(self, symbols: List[Dict[str, Any]], project_path: str) -> Dict[str, Any]:
        """Generate insights from code analysis"""
        return {
            "architecture_patterns": self._detect_architecture_patterns(symbols),
            "code_quality": self._assess_code_quality(symbols),
            "framework_indicators": self._detect_framework_indicators(symbols)
        }
    
    def _detect_architecture_patterns(self, symbols: List[Dict[str, Any]]) -> List[str]:
        """Detect common architecture patterns"""
        patterns = []
        
        # Check for MVC pattern
        has_controllers = any('Controller' in s.get('name', '') for s in symbols)
        has_models = any('Model' in s.get('name', '') for s in symbols)
        has_views = any('View' in s.get('name', '') for s in symbols)
        
        if has_controllers and has_models:
            patterns.append("MVC")
        
        # Check for service pattern
        has_services = any('Service' in s.get('name', '') for s in symbols)
        if has_services:
            patterns.append("Service Layer")
        
        # Check for repository pattern
        has_repos = any('Repository' in s.get('name', '') for s in symbols)
        if has_repos:
            patterns.append("Repository Pattern")
        
        return patterns
    
    def _assess_code_quality(self, symbols: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess code quality metrics"""
        functions = [s for s in symbols if s.get('kind') == 12]  # Functions
        classes = [s for s in symbols if s.get('kind') == 5]  # Classes
        
        return {
            "total_symbols": len(symbols),
            "function_count": len(functions),
            "class_count": len(classes),
            "avg_symbols_per_file": len(symbols) / max(len(set(s.get('relative_path', '') for s in symbols)), 1)
        }
    
    def _detect_framework_indicators(self, symbols: List[Dict[str, Any]]) -> List[str]:
        """Detect framework usage from symbol names"""
        indicators = []
        
        symbol_names = ' '.join(s.get('name', '') for s in symbols).lower()
        
        if 'component' in symbol_names or 'usestate' in symbol_names:
            indicators.append("React")
        if 'controller' in symbol_names and 'module' in symbol_names:
            indicators.append("Angular")
        if 'vue' in symbol_names or 'mounted' in symbol_names:
            indicators.append("Vue")
        
        return indicators
    
    def _get_severity(self, issue_type: str) -> str:
        """Get severity level for security issue"""
        severity_map = {
            'hardcoded_password': 'critical',
            'api_key': 'high',
            'secret_key': 'high',
            'sql_concatenation': 'high',
            'sql_interpolation': 'high',
            'innerHTML': 'medium',
            'dangerouslySetInnerHTML': 'medium',
            'eval_usage': 'high',
            'function_constructor': 'high',
        }
        return severity_map.get(issue_type, 'medium')
    
    def _extract_dependencies_from_match(self, match: str, pattern: str) -> List[str]:
        """Extract dependency names from regex matches"""
        import re
        deps = []
        
        # This is simplified - real implementation would be more robust
        if 'import' in pattern or 'require' in pattern:
            # Try to extract module name
            import_match = re.search(r"['\"]([^\"']+)['\"]", match)
            if import_match:
                deps.append(import_match.group(1))
        
        return deps
    
    def _detect_frameworks(self, dependencies: List[str]) -> List[str]:
        """Detect frameworks from dependencies"""
        frameworks = []
        deps_str = ' '.join(dependencies).lower()
        
        if 'react' in deps_str:
            frameworks.append('React')
        if 'vue' in deps_str:
            frameworks.append('Vue')
        if '@angular' in deps_str:
            frameworks.append('Angular')
        if 'express' in deps_str:
            frameworks.append('Express')
        if 'django' in deps_str:
            frameworks.append('Django')
        if 'flask' in deps_str:
            frameworks.append('Flask')
        
        return frameworks


def create_serena_tools(mcp_client) -> List[Tool]:
    """Create LangChain tools that use Serena for code analysis"""
    serena = SerenaIntegration(mcp_client)
    
    tools = []
    
    # Code Structure Analysis Tool
    async def analyze_code_structure(code_files: Dict[str, str], language: str) -> str:
        """Analyze the structure of code to identify classes, functions, and symbols"""
        result = await serena.analyze_code_structure(code_files, language)
        return json.dumps(result, indent=2)
    
    tools.append(Tool(
        name="analyze_code_structure",
        description="Analyze code structure to identify classes, functions, methods, and other symbols with semantic understanding",
        func=None,  # Will be wrapped for async
        coroutine=analyze_code_structure,
        args_schema=CodeAnalysisInput
    ))
    
    # Pattern Search Tool
    async def search_code_patterns(code_files: Dict[str, str], patterns: List[Dict[str, str]], 
                                 context_lines: int = 2) -> str:
        """Search for specific patterns in code using regular expressions"""
        result = await serena.search_patterns(code_files, patterns, context_lines)
        return json.dumps(result, indent=2)
    
    tools.append(Tool(
        name="search_code_patterns",
        description="Search for specific patterns in code using regex with semantic context",
        func=None,
        coroutine=search_code_patterns,
        args_schema=PatternSearchInput
    ))
    
    # Symbol Search Tool
    async def find_symbols(code_files: Dict[str, str], language: str, symbol_name: str,
                         symbol_types: Optional[List[str]] = None, include_body: bool = False) -> str:
        """Find specific symbols by name or pattern"""
        result = await serena.find_symbols(code_files, language, symbol_name, symbol_types, include_body)
        return json.dumps(result, indent=2)
    
    tools.append(Tool(
        name="find_symbols",
        description="Find specific symbols (classes, functions, methods) by name with semantic understanding",
        func=None,
        coroutine=find_symbols,
        args_schema=SymbolSearchInput
    ))
    
    # Security Analysis Tool
    async def detect_security_issues(code_files: Dict[str, str], language: str) -> str:
        """Detect security vulnerabilities in code"""
        result = await serena.detect_security_issues(code_files, language)
        return json.dumps(result, indent=2)
    
    tools.append(Tool(
        name="detect_security_issues",
        description="Analyze code for security vulnerabilities like hardcoded credentials, SQL injection, XSS",
        func=None,
        coroutine=detect_security_issues,
        args_schema=CodeAnalysisInput
    ))
    
    # Dependency Analysis Tool
    async def analyze_dependencies(code_files: Dict[str, str], language: str) -> str:
        """Analyze code dependencies and imports"""
        result = await serena.analyze_dependencies(code_files, language)
        return json.dumps(result, indent=2)
    
    tools.append(Tool(
        name="analyze_dependencies",
        description="Analyze code to extract dependencies, imports, and framework usage",
        func=None,
        coroutine=analyze_dependencies,
        args_schema=CodeAnalysisInput
    ))
    
    return tools