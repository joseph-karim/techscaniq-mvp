import { Queue, Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { logger } from '../../utils/logger.js';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapToValidEvidenceType } from '../fix-evidence-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SkyvernDiscoveryJob {
  scanRequestId: string;
  targetUrl: string;
  discoveryMode: 'demo_access' | 'product_discovery' | 'technical_docs' | 'api_endpoints' | 'deep_exploration';
  iterationContext?: {
    previousFindings: string[];
    depthLevel: number;
    authenticationAttempted: boolean;
    discoveredPaths: string[];
    researchQuestions?: string[]; // From iterative research
  };
}

const queue = new Queue<SkyvernDiscoveryJob>('skyvern-discovery', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const ENHANCED_SKYVERN_SCRIPT = `
import asyncio
import json
import sys
import logging
from skyvern import Skyvern
from typing import Dict, List, Any, Optional
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedProductDiscovery:
    def __init__(self):
        self.skyvern = Skyvern()
        
    async def discover_with_intelligence(self, url: str, discovery_mode: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced discovery with research-aware intelligence"""
        
        results = {
            "discovered_urls": [],
            "technical_evidence": [],
            "authentication_opportunities": [],
            "api_endpoints": [],
            "product_features": [],
            "screenshots": [],
            "interactive_elements": [],
            "data_schemas": [],
            "errors": [],
            "discovery_insights": []
        }
        
        try:
            # Enhanced prompts based on research questions
            prompts = self.get_enhanced_prompts(discovery_mode, context)
            
            for idx, prompt in enumerate(prompts[:5]):  # Limit to 5 prompts
                try:
                    logger.info(f"Executing prompt {idx + 1}: {prompt[:100]}...")
                    
                    # Run Skyvern task with enhanced parameters
                    task = await self.skyvern.run_task(
                        url=url,
                        prompt=prompt,
                        max_steps=15,  # More steps for deeper exploration
                        extract_data=True,
                        take_screenshot=True,
                        wait_for_navigation=True,
                        handle_popups=True,
                        extract_network_requests=True  # Capture API calls
                    )
                    
                    if task.status == "completed":
                        # Process results based on discovery mode
                        await self.process_task_results(task, discovery_mode, results)
                        
                        # Extract insights from the discovery
                        insights = self.extract_insights(task, prompt, discovery_mode)
                        if insights:
                            results["discovery_insights"].extend(insights)
                    
                except Exception as e:
                    logger.error(f"Task failed: {str(e)}")
                    results["errors"].append({
                        "prompt": prompt,
                        "error": str(e),
                        "traceback": traceback.format_exc()
                    })
            
            # Perform deep analysis based on mode
            if discovery_mode == "deep_exploration":
                await self.perform_deep_exploration(url, context, results)
                
        except Exception as e:
            logger.error(f"Discovery failed: {str(e)}")
            results["errors"].append({
                "general_error": str(e),
                "url": url
            })
        
        return results
    
    def get_enhanced_prompts(self, discovery_mode: str, context: Dict[str, Any]) -> List[str]:
        """Generate intelligent prompts based on research context"""
        
        research_questions = context.get("researchQuestions", [])
        previous_findings = context.get("previousFindings", [])
        
        base_prompts = {
            "demo_access": [
                "Find and navigate to any demo, trial, or sandbox environment. Look for 'Try it free', 'Get Started', 'Demo', or 'Sandbox' buttons",
                "Search for developer portal or API playground. Look for interactive API testing tools",
                "Find any product tours, walkthroughs, or interactive demos",
                "Look for free tier signup or trial account creation options"
            ],
            "product_discovery": [
                "Navigate through all product feature pages and capture key capabilities",
                "Find and analyze the product architecture or system design documentation",
                "Look for case studies or implementation examples that show the product in action",
                "Explore integrations, plugins, or marketplace offerings",
                "Find performance benchmarks, scalability information, or technical specifications"
            ],
            "technical_docs": [
                "Navigate to the complete API documentation and capture all endpoints",
                "Find SDK documentation for all supported programming languages",
                "Look for webhook documentation, event types, and payload schemas",
                "Search for authentication flows, security documentation, and compliance certifications",
                "Find data models, database schemas, or entity relationship diagrams"
            ],
            "api_endpoints": [
                "Extract all REST API endpoints with their methods (GET, POST, PUT, DELETE)",
                "Find GraphQL schema documentation or introspection endpoints",
                "Look for WebSocket endpoints or real-time streaming APIs",
                "Identify rate limits, quotas, and API versioning strategies",
                "Find example API requests and responses with actual data"
            ],
            "deep_exploration": [
                "Perform a comprehensive exploration of all technical resources",
                "Search for hidden or beta features in documentation",
                "Look for admin panels, configuration interfaces, or management consoles",
                "Find any open-source repositories, GitHub links, or code samples",
                "Explore community forums, Stack Overflow tags, or developer discussions"
            ]
        }
        
        prompts = base_prompts.get(discovery_mode, base_prompts["product_discovery"])
        
        # Enhance prompts with research questions
        if research_questions:
            for question in research_questions[:3]:  # Top 3 questions
                prompts.append(f"Search for information about: {question}")
        
        return prompts
    
    async def process_task_results(self, task, discovery_mode: str, results: Dict[str, Any]):
        """Process Skyvern task results based on discovery mode"""
        
        # Collect discovered URLs
        if hasattr(task, 'visited_urls'):
            results["discovered_urls"].extend(task.visited_urls)
        
        # Extract technical evidence
        if hasattr(task, 'extracted_data') and task.extracted_data:
            evidence = {
                "mode": discovery_mode,
                "url": task.final_url,
                "data": task.extracted_data,
                "timestamp": task.timestamp
            }
            
            # Categorize evidence based on content
            if any(keyword in str(task.extracted_data).lower() 
                   for keyword in ["api", "endpoint", "rest", "graphql"]):
                results["api_endpoints"].append(evidence)
            elif any(keyword in str(task.extracted_data).lower() 
                     for keyword in ["feature", "capability", "function"]):
                results["product_features"].append(evidence)
            else:
                results["technical_evidence"].append(evidence)
        
        # Process network requests for API discovery
        if hasattr(task, 'network_requests'):
            api_calls = [req for req in task.network_requests 
                        if any(path in req['url'] for path in ['/api/', '/v1/', '/v2/', '/graphql'])]
            if api_calls:
                results["api_endpoints"].extend(api_calls)
        
        # Save screenshots with metadata
        if hasattr(task, 'screenshot') and task.screenshot:
            results["screenshots"].append({
                "url": task.final_url,
                "path": task.screenshot,
                "mode": discovery_mode,
                "title": task.page_title if hasattr(task, 'page_title') else ""
            })
        
        # Extract interactive elements
        if hasattr(task, 'interactive_elements'):
            results["interactive_elements"].extend(task.interactive_elements)
    
    def extract_insights(self, task, prompt: str, discovery_mode: str) -> List[Dict[str, Any]]:
        """Extract actionable insights from discovery results"""
        
        insights = []
        
        if hasattr(task, 'extracted_data') and task.extracted_data:
            data_str = str(task.extracted_data).lower()
            
            # Check for authentication methods
            if any(auth in data_str for auth in ["oauth", "api key", "jwt", "bearer"]):
                insights.append({
                    "type": "authentication",
                    "finding": "Authentication method discovered",
                    "details": task.extracted_data
                })
            
            # Check for pricing/limits
            if any(limit in data_str for limit in ["rate limit", "quota", "tier", "plan"]):
                insights.append({
                    "type": "limits",
                    "finding": "Rate limits or quotas identified",
                    "details": task.extracted_data
                })
            
            # Check for technical stack
            if any(tech in data_str for tech in ["react", "vue", "angular", "python", "node", "java"]):
                insights.append({
                    "type": "tech_stack",
                    "finding": "Technology stack information found",
                    "details": task.extracted_data
                })
        
        return insights
    
    async def perform_deep_exploration(self, url: str, context: Dict[str, Any], results: Dict[str, Any]):
        """Perform deep exploration for comprehensive analysis"""
        
        exploration_targets = [
            ("Find the sitemap.xml file", "/sitemap.xml"),
            ("Check robots.txt for hidden paths", "/robots.txt"),
            ("Look for API documentation at common paths", ["/api/docs", "/swagger", "/api-docs"]),
            ("Search for developer portal", ["/developers", "/dev", "/developer"]),
            ("Find status page or health checks", ["/status", "/health", "/.well-known/health"])
        ]
        
        for description, paths in exploration_targets:
            if isinstance(paths, str):
                paths = [paths]
            
            for path in paths:
                try:
                    target_url = url.rstrip('/') + path
                    task = await self.skyvern.run_task(
                        url=target_url,
                        prompt=description,
                        max_steps=5,
                        extract_data=True
                    )
                    
                    if task.status == "completed" and task.extracted_data:
                        results["technical_evidence"].append({
                            "type": "deep_exploration",
                            "target": path,
                            "data": task.extracted_data,
                            "url": target_url
                        })
                
                except Exception as e:
                    logger.debug(f"Exploration of {path} failed: {str(e)}")

if __name__ == "__main__":
    url = sys.argv[1]
    mode = sys.argv[2]
    context = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
    
    discovery = EnhancedProductDiscovery()
    result = asyncio.run(discovery.discover_with_intelligence(url, mode, context))
    print(json.dumps(result))
`;

async function runEnhancedSkyvernDiscovery(job: SkyvernDiscoveryJob): Promise<any> {
  const scriptPath = path.join(__dirname, 'skyvern_enhanced_discovery.py');
  
  // Write the enhanced Python script
  await fs.writeFile(scriptPath, ENHANCED_SKYVERN_SCRIPT);
  
  return new Promise((resolve, reject) => {
    const contextJson = JSON.stringify(job.iterationContext || {});
    
    // Use virtual environment if available
    const pythonPath = process.env.SKYVERN_VENV_PATH 
      ? path.join(process.env.SKYVERN_VENV_PATH, 'bin', 'python')
      : 'python3';
    
    const pythonProcess = spawn(pythonPath, [
      scriptPath,
      job.targetUrl,
      job.discoveryMode,
      contextJson
    ], {
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1'  // For real-time output
      }
    });
    
    let output = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
      // Log progress in real-time
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.includes('INFO') || line.includes('Executing prompt')) {
          logger.info(`[Skyvern Progress] ${line}`);
        }
      });
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
      logger.error(`[Skyvern Error] ${data.toString()}`);
    });
    
    pythonProcess.on('close', async (code) => {
      // Clean up script file
      try {
        await fs.unlink(scriptPath);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      if (code !== 0) {
        reject(new Error(`Skyvern process exited with code ${code}: ${error}`));
      } else {
        try {
          // Extract JSON from output (may have logs before it)
          const jsonMatch = output.match(/\{[\s\S]*\}$/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            resolve(result);
          } else {
            reject(new Error(`Failed to parse Skyvern output: ${output}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Skyvern output: ${output}`));
        }
      }
    });
    
    // Set timeout for long-running discoveries
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Skyvern discovery timed out after 5 minutes'));
    }, 300000); // 5 minutes
  });
}

// Enhanced evidence processing
async function processAndStoreEvidence(
  discoveryResults: any, 
  job: SkyvernDiscoveryJob
): Promise<{ storedCount: number; insights: any[] }> {
  const evidenceItems = [];
  const insights = [];
  
  // Process discovered URLs with priority scoring
  const urlPriority = (url: string) => {
    const highPriority = ['/api', '/docs', '/developer', '/pricing', '/demo'];
    const mediumPriority = ['/features', '/product', '/solutions', '/integrations'];
    
    if (highPriority.some(path => url.includes(path))) return 0.9;
    if (mediumPriority.some(path => url.includes(path))) return 0.7;
    return 0.5;
  };
  
  // Store discovered URLs
  for (const url of (discoveryResults.discovered_urls || [])) {
    evidenceItems.push({
      scan_request_id: job.scanRequestId,
      evidence_id: `skyvern-url-${Date.now()}-${Math.random()}`,
      source: 'skyvern-discovery',
      evidence_type: 'deep_crawl',
      title: `Discovered: ${url}`,
      content: JSON.stringify({ 
        discovered_url: url, 
        discovery_mode: job.discoveryMode,
        depth: job.iterationContext?.depthLevel || 0
      }),
      url: url,
      relevance_score: urlPriority(url),
      metadata: {
        discovery_mode: job.discoveryMode,
        iteration_depth: job.iterationContext?.depthLevel || 0,
        discovery_type: 'url'
      }
    });
  }
  
  // Process API endpoints with enhanced metadata
  for (const endpoint of (discoveryResults.api_endpoints || [])) {
    evidenceItems.push({
      scan_request_id: job.scanRequestId,
      evidence_id: `skyvern-api-${Date.now()}-${Math.random()}`,
      source: 'skyvern-discovery',
      evidence_type: 'api_response',
      title: 'API Endpoint Discovered',
      content: JSON.stringify(endpoint),
      url: endpoint.url || job.targetUrl,
      relevance_score: 0.95,
      metadata: {
        discovery_mode: job.discoveryMode,
        endpoint_count: Array.isArray(endpoint) ? endpoint.length : 1,
        has_authentication: JSON.stringify(endpoint).includes('auth')
      }
    });
    
    insights.push({
      type: 'api_discovery',
      summary: 'API endpoints discovered via Skyvern',
      details: endpoint
    });
  }
  
  // Process product features
  for (const feature of (discoveryResults.product_features || [])) {
    evidenceItems.push({
      scan_request_id: job.scanRequestId,
      evidence_id: `skyvern-feature-${Date.now()}-${Math.random()}`,
      source: 'skyvern-discovery',
      evidence_type: mapToValidEvidenceType('product_information'),
      title: 'Product Feature Discovered',
      content: JSON.stringify(feature),
      url: feature.url || job.targetUrl,
      relevance_score: 0.85,
      metadata: {
        discovery_mode: job.discoveryMode,
        feature_category: detectFeatureCategory(feature)
      }
    });
  }
  
  // Process technical evidence with categorization
  for (const evidence of (discoveryResults.technical_evidence || [])) {
    const evidenceCategory = categorizeEvidence(evidence);
    evidenceItems.push({
      scan_request_id: job.scanRequestId,
      evidence_id: `skyvern-tech-${Date.now()}-${Math.random()}`,
      source: 'skyvern-discovery',
      evidence_type: mapToValidEvidenceType(evidenceCategory),
      title: `Technical Discovery: ${evidence.mode || 'general'}`,
      content: JSON.stringify(evidence.data || evidence),
      url: evidence.url || job.targetUrl,
      relevance_score: 0.9,
      metadata: {
        discovery_prompt: evidence.prompt,
        discovery_mode: job.discoveryMode,
        evidence_category: evidenceCategory
      }
    });
  }
  
  // Process discovery insights
  for (const insight of (discoveryResults.discovery_insights || [])) {
    insights.push(insight);
    
    evidenceItems.push({
      scan_request_id: job.scanRequestId,
      evidence_id: `skyvern-insight-${Date.now()}-${Math.random()}`,
      source: 'skyvern-discovery',
      evidence_type: mapToValidEvidenceType('technical_analysis'),
      title: `Discovery Insight: ${insight.type}`,
      content: JSON.stringify(insight),
      url: job.targetUrl,
      relevance_score: 1.0,
      metadata: {
        insight_type: insight.type,
        discovery_mode: job.discoveryMode
      }
    });
  }
  
  // Store all evidence items
  if (evidenceItems.length > 0) {
    const { error } = await supabase.from('evidence_items').insert(evidenceItems);
    if (error) {
      logger.error('Failed to store Skyvern evidence', { error });
      throw error;
    }
  }
  
  return { storedCount: evidenceItems.length, insights };
}

function detectFeatureCategory(feature: any): string {
  const featureStr = JSON.stringify(feature).toLowerCase();
  
  if (featureStr.includes('api') || featureStr.includes('integration')) return 'integration';
  if (featureStr.includes('analytics') || featureStr.includes('dashboard')) return 'analytics';
  if (featureStr.includes('security') || featureStr.includes('compliance')) return 'security';
  if (featureStr.includes('scale') || featureStr.includes('performance')) return 'scalability';
  
  return 'general';
}

function categorizeEvidence(evidence: any): string {
  const evidenceStr = JSON.stringify(evidence).toLowerCase();
  
  if (evidenceStr.includes('api') || evidenceStr.includes('endpoint')) return 'api_response';
  if (evidenceStr.includes('security') || evidenceStr.includes('ssl')) return 'security_analysis';
  if (evidenceStr.includes('performance') || evidenceStr.includes('speed')) return 'performance_metrics';
  if (evidenceStr.includes('technology') || evidenceStr.includes('stack')) return 'technology_stack';
  
  return 'technical_analysis';
}

// Create worker with enhanced logic
export const skyvernWorker = new Worker(
  'skyvern-discovery',
  async (job) => {
    logger.info('Starting enhanced Skyvern discovery job', {
      jobId: job.id,
      scanRequestId: job.data.scanRequestId,
      targetUrl: job.data.targetUrl,
      discoveryMode: job.data.discoveryMode,
      iterationDepth: job.data.iterationContext?.depthLevel || 0
    });
    
    try {
    // Run enhanced Skyvern discovery
    const discoveryResults = await runEnhancedSkyvernDiscovery(job.data);
    
    // Process and store evidence
    const { storedCount, insights } = await processAndStoreEvidence(discoveryResults, job.data);
    
    logger.info('Skyvern discovery completed', {
      jobId: job.id,
      evidenceStored: storedCount,
      discoveredUrls: discoveryResults.discovered_urls?.length || 0,
      apiEndpoints: discoveryResults.api_endpoints?.length || 0,
      insights: insights.length,
      errors: discoveryResults.errors?.length || 0
    });
    
    // Queue follow-up jobs for promising discoveries
    if (job.data.iterationContext?.depthLevel < 3) {
      await queueFollowUpDiscoveries(job.data, discoveryResults);
    }
    
    // Return results including insights for the research pipeline
    return {
      success: true,
      evidenceCount: storedCount,
      discoveredUrls: discoveryResults.discovered_urls?.length || 0,
      apiEndpoints: discoveryResults.api_endpoints?.length || 0,
      insights,
      errors: discoveryResults.errors
    };
    
  } catch (error) {
    logger.error('Skyvern discovery failed', {
      error: error.message,
      jobId: job.id,
      scanRequestId: job.data.scanRequestId
    });
    
    // Store error as evidence for tracking
    await supabase.from('evidence_items').insert({
      scan_request_id: job.data.scanRequestId,
      evidence_id: `skyvern-error-${Date.now()}`,
      source: 'skyvern-discovery',
      evidence_type: 'webpage_content',
      title: 'Skyvern Discovery Error',
      content: JSON.stringify({ error: error.message, url: job.data.targetUrl }),
      url: job.data.targetUrl,
      relevance_score: 0.1,
      metadata: {
        error: true,
        discovery_mode: job.data.discoveryMode
      }
    });
    
    throw error;
  }
  },
  { connection }
);

async function queueFollowUpDiscoveries(jobData: SkyvernDiscoveryJob, results: any) {
  const followUpJobs = [];
  
  // Identify high-value URLs for follow-up
  const highValuePaths = [
    '/api', '/docs', '/developer', '/documentation',
    '/playground', '/sandbox', '/demo', '/trial'
  ];
  
  const promisingUrls = (results.discovered_urls || [])
    .filter(url => highValuePaths.some(path => url.includes(path)))
    .slice(0, 3); // Limit follow-ups
  
  for (const url of promisingUrls) {
    const followUpMode = determineFollowUpMode(url);
    
    followUpJobs.push(
      queue.add({
        scanRequestId: jobData.scanRequestId,
        targetUrl: url,
        discoveryMode: followUpMode,
        iterationContext: {
          previousFindings: [...(jobData.iterationContext?.previousFindings || []), url],
          depthLevel: (jobData.iterationContext?.depthLevel || 0) + 1,
          authenticationAttempted: jobData.iterationContext?.authenticationAttempted || false,
          discoveredPaths: [...(jobData.iterationContext?.discoveredPaths || []), url],
          researchQuestions: jobData.iterationContext?.researchQuestions
        }
      }, {
        delay: 5000, // 5 second delay between follow-ups
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000
        }
      })
    );
  }
  
  await Promise.all(followUpJobs);
  logger.info(`Queued ${followUpJobs.length} follow-up Skyvern discoveries`);
}

function determineFollowUpMode(url: string): SkyvernDiscoveryJob['discoveryMode'] {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('/api') || urlLower.includes('/docs')) return 'api_endpoints';
  if (urlLower.includes('/demo') || urlLower.includes('/trial')) return 'demo_access';
  if (urlLower.includes('/developer') || urlLower.includes('/technical')) return 'technical_docs';
  
  return 'deep_exploration';
}

// Ensure proper cleanup
process.on('SIGTERM', async () => {
  console.log('Shutting down Skyvern worker...');
  await skyvernWorker.close();
  await connection.quit();
  process.exit(0);
});

logger.info('Enhanced Skyvern discovery worker started');

export { queue as skyvernEnhancedQueue };