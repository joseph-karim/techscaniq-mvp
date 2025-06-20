"""
Code Analysis API Endpoint

Provides HTTP API for code analysis using Serena MCP tools.
Integrates with the LangGraph frontend worker.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import asyncio
import logging
import json
from datetime import datetime
import tempfile
import shutil
from pathlib import Path

from ..services.mcp_client_service import mcp_client, with_mcp_connection
from ..services.serena_tools import (
    AnalyzeCodeStructureTool,
    FindCodePatternsTool,
    DetectSecurityIssuesTool,
    AnalyzeDependenciesTool,
    SerenaIntegration
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/code-analysis", tags=["code-analysis"])


class CodeAnalysisRequest(BaseModel):
    """Request model for code analysis"""
    code: Dict[str, str] = Field(description="Dictionary mapping filenames to code content")
    url: str = Field(description="Source URL of the code")
    options: Dict[str, bool] = Field(
        default_factory=lambda: {
            "includeSecurityScan": True,
            "detectFrameworks": True,
            "analyzeDependencies": True
        },
        description="Analysis options"
    )


class SymbolInfo(BaseModel):
    """Information about a code symbol"""
    name: str
    kind: str
    kindNumber: int
    path: str
    location: Dict[str, Any]
    body: Optional[str] = None
    children: Optional[List['SymbolInfo']] = None


class CodePattern(BaseModel):
    """Code pattern match result"""
    pattern: str
    matches: List[Dict[str, Any]]


class SecurityIssue(BaseModel):
    """Security issue found in code"""
    type: str
    severity: str
    description: str
    locations: List[str]
    occurrences: int


class FrameworkInfo(BaseModel):
    """Detected framework information"""
    name: str
    confidence: float
    version: Optional[str] = None
    evidence: str


class CodeAnalysisResponse(BaseModel):
    """Response model for code analysis"""
    symbols: List[Dict[str, Any]]
    patterns: List[Dict[str, Any]]
    securityIssues: List[SecurityIssue]
    dependencies: List[str]
    frameworks: List[FrameworkInfo]
    metadata: Dict[str, Any]


@router.post("/analyze", response_model=CodeAnalysisResponse)
@with_mcp_connection
async def analyze_code(request: CodeAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Analyze code using Serena MCP tools
    
    This endpoint performs comprehensive code analysis including:
    - Code structure and symbol detection
    - Security vulnerability scanning
    - Dependency analysis
    - Framework detection
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Starting code analysis for {request.url} with {len(request.code)} files")
        
        # Create temporary project for analysis
        project_id = f"analysis-{request.url.replace('/', '-').replace(':', '')}-{int(start_time.timestamp())}"
        
        # Initialize Serena integration
        serena = SerenaIntegration(mcp_client)
        
        # Create analysis tasks based on options
        tasks = []
        
        # Always analyze code structure
        tasks.append(analyze_structure(serena, request.code, project_id))
        
        # Conditionally add other analyses
        if request.options.get('includeSecurityScan', True):
            tasks.append(analyze_security(serena, request.code))
            
        if request.options.get('analyzeDependencies', True):
            tasks.append(analyze_dependencies(serena, request.code))
        
        # Run all analyses in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        structure_result = results[0] if not isinstance(results[0], Exception) else {"symbols": [], "patterns": []}
        security_result = None
        dependency_result = None
        
        idx = 1
        if request.options.get('includeSecurityScan', True):
            security_result = results[idx] if not isinstance(results[idx], Exception) else {"security_issues": []}
            idx += 1
            
        if request.options.get('analyzeDependencies', True):
            dependency_result = results[idx] if not isinstance(results[idx], Exception) else {"dependencies": [], "frameworks": []}
        
        # Detect frameworks from all available data
        frameworks = detect_frameworks_comprehensive(
            structure_result.get("symbols", []),
            dependency_result.get("dependencies", []) if dependency_result else [],
            request.code
        )
        
        # Format response
        response = CodeAnalysisResponse(
            symbols=structure_result.get("symbols", []),
            patterns=structure_result.get("patterns", []),
            securityIssues=format_security_issues(security_result) if security_result else [],
            dependencies=dependency_result.get("dependencies", []) if dependency_result else [],
            frameworks=frameworks,
            metadata={
                "analysis_time": (datetime.now() - start_time).total_seconds(),
                "file_count": len(request.code),
                "total_lines": sum(len(code.splitlines()) for code in request.code.values()),
                "project_id": project_id
            }
        )
        
        # Schedule cleanup
        background_tasks.add_task(cleanup_temp_project, serena)
        
        logger.info(f"Code analysis completed in {response.metadata['analysis_time']:.2f}s")
        return response
        
    except Exception as e:
        logger.error(f"Code analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Code analysis failed: {str(e)}")


async def analyze_structure(serena: SerenaIntegration, code: Dict[str, str], project_id: str) -> Dict[str, Any]:
    """Analyze code structure using Serena tools"""
    try:
        # Detect primary language
        language = detect_language(code)
        
        # Get code structure
        result = await serena.analyze_code_structure(code, language)
        
        # Search for common patterns
        patterns = [
            {"name": "api_endpoints", "regex": r"(fetch|axios|http|request).*['\"`]/api/.*['\"`]"},
            {"name": "state_management", "regex": r"(useState|useReducer|createStore|Redux|Vuex)"},
            {"name": "component_patterns", "regex": r"(export.*function.*return.*<|class.*extends.*Component|@Component)"},
            {"name": "async_patterns", "regex": r"(async\s+function|async.*=>|await\s+)"},
            {"name": "event_handlers", "regex": r"(onClick|onChange|onSubmit|addEventListener)"},
        ]
        
        pattern_results = await serena.search_patterns(code, patterns)
        
        return {
            "symbols": result.get("symbols", []),
            "patterns": pattern_results,
            "insights": result.get("insights", {})
        }
        
    except Exception as e:
        logger.error(f"Structure analysis failed: {e}")
        return {"symbols": [], "patterns": []}


async def analyze_security(serena: SerenaIntegration, code: Dict[str, str]) -> Dict[str, Any]:
    """Analyze code for security issues"""
    try:
        language = detect_language(code)
        return await serena.detect_security_issues(code, language)
    except Exception as e:
        logger.error(f"Security analysis failed: {e}")
        return {"security_issues": [], "summary": {}}


async def analyze_dependencies(serena: SerenaIntegration, code: Dict[str, str]) -> Dict[str, Any]:
    """Analyze code dependencies"""
    try:
        language = detect_language(code)
        return await serena.analyze_dependencies(code, language)
    except Exception as e:
        logger.error(f"Dependency analysis failed: {e}")
        return {"dependencies": [], "frameworks": []}


def detect_language(code: Dict[str, str]) -> str:
    """Detect the primary programming language from file extensions"""
    extension_map = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.java': 'java',
        '.php': 'php',
        '.go': 'go',
        '.rs': 'rust',
        '.cpp': 'cpp',
        '.c': 'cpp',
        '.cc': 'cpp'
    }
    
    # Count extensions
    ext_counts = {}
    for filename in code.keys():
        ext = Path(filename).suffix.lower()
        if ext in extension_map:
            lang = extension_map[ext]
            ext_counts[lang] = ext_counts.get(lang, 0) + 1
    
    # Return most common language, default to javascript
    if ext_counts:
        return max(ext_counts, key=ext_counts.get)
    return 'javascript'


def detect_frameworks_comprehensive(symbols: List[Dict], dependencies: List[str], code: Dict[str, str]) -> List[FrameworkInfo]:
    """Comprehensive framework detection using multiple signals"""
    frameworks = []
    seen = set()
    
    # Combine all code for pattern matching
    all_code = '\n'.join(code.values()).lower()
    
    # React detection
    react_signals = 0
    if any('react' in dep.lower() for dep in dependencies):
        react_signals += 3
    if 'usestate' in all_code or 'useeffect' in all_code:
        react_signals += 2
    if 'jsx' in all_code or any(f.endswith('.jsx') or f.endswith('.tsx') for f in code.keys()):
        react_signals += 1
    
    if react_signals >= 2 and 'React' not in seen:
        frameworks.append(FrameworkInfo(
            name='React',
            confidence=min(0.95, 0.5 + react_signals * 0.15),
            version='Unknown',
            evidence='React hooks, JSX files, and/or React dependencies detected'
        ))
        seen.add('React')
    
    # Vue detection
    vue_signals = 0
    if any('vue' in dep.lower() for dep in dependencies):
        vue_signals += 3
    if '<template>' in all_code or 'export default {' in all_code:
        vue_signals += 2
    if any(f.endswith('.vue') for f in code.keys()):
        vue_signals += 2
    
    if vue_signals >= 2 and 'Vue' not in seen:
        frameworks.append(FrameworkInfo(
            name='Vue',
            confidence=min(0.95, 0.5 + vue_signals * 0.15),
            version='Unknown',
            evidence='Vue components, templates, and/or Vue dependencies detected'
        ))
        seen.add('Vue')
    
    # Angular detection
    angular_signals = 0
    if any('@angular' in dep.lower() for dep in dependencies):
        angular_signals += 3
    if '@component' in all_code or '@injectable' in all_code:
        angular_signals += 2
    if any(f.endswith('.component.ts') for f in code.keys()):
        angular_signals += 1
    
    if angular_signals >= 2 and 'Angular' not in seen:
        frameworks.append(FrameworkInfo(
            name='Angular',
            confidence=min(0.95, 0.5 + angular_signals * 0.15),
            version='Unknown',
            evidence='Angular decorators, components, and/or Angular dependencies detected'
        ))
        seen.add('Angular')
    
    # Backend frameworks
    if any('express' in dep.lower() for dep in dependencies) and 'Express' not in seen:
        frameworks.append(FrameworkInfo(
            name='Express',
            confidence=0.9,
            version='Unknown',
            evidence='Express.js dependency detected'
        ))
        seen.add('Express')
    
    if any('django' in dep.lower() for dep in dependencies) and 'Django' not in seen:
        frameworks.append(FrameworkInfo(
            name='Django',
            confidence=0.9,
            version='Unknown',
            evidence='Django dependency detected'
        ))
        seen.add('Django')
    
    if any('flask' in dep.lower() for dep in dependencies) and 'Flask' not in seen:
        frameworks.append(FrameworkInfo(
            name='Flask',
            confidence=0.9,
            version='Unknown',
            evidence='Flask dependency detected'
        ))
        seen.add('Flask')
    
    return frameworks


def format_security_issues(security_result: Dict[str, Any]) -> List[SecurityIssue]:
    """Format security issues for response"""
    issues = []
    
    for issue in security_result.get("security_issues", []):
        issues.append(SecurityIssue(
            type=issue["issue"],
            severity=issue["severity"],
            description=get_security_description(issue["issue"]),
            locations=issue["locations"],
            occurrences=issue["occurrences"]
        ))
    
    return issues


def get_security_description(issue_type: str) -> str:
    """Get human-readable description for security issue"""
    descriptions = {
        'hardcoded_password': 'Hardcoded password found in source code',
        'api_key': 'API key or token hardcoded in source code',
        'secret_key': 'Secret key hardcoded in source code',
        'sql_concatenation': 'Potential SQL injection vulnerability through string concatenation',
        'sql_interpolation': 'Potential SQL injection vulnerability through template literal interpolation',
        'innerHTML': 'Potential XSS vulnerability through innerHTML usage',
        'dangerouslySetInnerHTML': 'Potential XSS vulnerability through React dangerouslySetInnerHTML',
        'eval_usage': 'Dangerous eval() usage that could execute arbitrary code',
        'function_constructor': 'Dangerous Function constructor usage that could execute arbitrary code'
    }
    
    return descriptions.get(issue_type, f'Security issue: {issue_type}')


async def cleanup_temp_project(serena: SerenaIntegration):
    """Clean up temporary project files"""
    try:
        await serena.cleanup_temp_projects()
    except Exception as e:
        logger.error(f"Error cleaning up temp projects: {e}")


# Health check endpoint
@router.get("/health")
async def health_check():
    """Check the health of the code analysis service"""
    try:
        mcp_health = await mcp_client.check_mcp_health()
        
        return {
            "status": "healthy" if mcp_health["connected"] else "degraded",
            "mcp_connected": mcp_health["connected"],
            "available_tools": mcp_health["available_tools"],
            "tool_count": mcp_health["tool_count"],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }