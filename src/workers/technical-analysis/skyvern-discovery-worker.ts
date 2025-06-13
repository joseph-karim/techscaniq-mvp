import { Queue } from 'bullmq';
import { supabase } from '../../lib/supabase.js';
import { logger } from '../../utils/logger.js';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SkyvernDiscoveryJob {
  scanRequestId: string;
  targetUrl: string;
  discoveryMode: 'demo_access' | 'product_discovery' | 'technical_docs' | 'api_endpoints';
  iterationContext?: {
    previousFindings: string[];
    depthLevel: number;
    authenticationAttempted: boolean;
    discoveredPaths: string[];
  };
}

const queue = new Queue<SkyvernDiscoveryJob>('skyvern-discovery', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const SKYVERN_SCRIPT = `
import asyncio
import json
import sys
from skyvern import Skyvern
from typing import Dict, List, Any

async def discover_product_access(url: str, discovery_mode: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Use Skyvern to intelligently discover product areas and technical details"""
    
    skyvern = Skyvern()
    results = {
        "discovered_urls": [],
        "technical_evidence": [],
        "authentication_opportunities": [],
        "api_endpoints": [],
        "product_features": [],
        "screenshots": [],
        "errors": []
    }
    
    try:
        # Define discovery prompts based on mode
        prompts = {
            "demo_access": [
                "Find and click on 'Try it free', 'Demo', 'Get Started', or 'Sign up for free' buttons",
                "Look for sandbox, playground, or trial environment links",
                "Navigate to product demo or interactive tour pages"
            ],
            "product_discovery": [
                "Navigate to the product features or capabilities page",
                "Find technical documentation or developer resources",
                "Look for pricing tiers that might reveal feature sets",
                "Explore any dashboards or user interfaces shown in screenshots"
            ],
            "technical_docs": [
                "Navigate to API documentation or developer docs",
                "Find integration guides or technical architecture pages",
                "Look for SDK references or code examples",
                "Search for system requirements or technical specifications"
            ],
            "api_endpoints": [
                "Find API reference documentation",
                "Look for webhook configurations or endpoints",
                "Search for authentication methods (OAuth, API keys)",
                "Identify rate limits and API versioning information"
            ]
        }
        
        # Execute discovery based on mode
        mode_prompts = prompts.get(discovery_mode, prompts["product_discovery"])
        
        for prompt in mode_prompts:
            try:
                # Run Skyvern task with specific discovery prompt
                task = await skyvern.run_task(
                    url=url,
                    prompt=prompt,
                    max_steps=10,
                    extract_data=True,
                    take_screenshot=True
                )
                
                # Extract discovered information
                if task.status == "completed":
                    # Collect discovered URLs
                    if task.visited_urls:
                        results["discovered_urls"].extend(task.visited_urls)
                    
                    # Extract technical evidence
                    if task.extracted_data:
                        results["technical_evidence"].append({
                            "prompt": prompt,
                            "data": task.extracted_data,
                            "final_url": task.final_url
                        })
                    
                    # Check for authentication opportunities
                    if any(keyword in str(task.extracted_data).lower() 
                           for keyword in ["login", "sign up", "register", "trial", "demo"]):
                        results["authentication_opportunities"].append({
                            "url": task.final_url,
                            "type": "potential_access_point",
                            "context": task.extracted_data
                        })
                    
                    # Save screenshots
                    if task.screenshot:
                        results["screenshots"].append({
                            "url": task.final_url,
                            "prompt": prompt,
                            "screenshot_path": task.screenshot
                        })
                
            except Exception as e:
                results["errors"].append({
                    "prompt": prompt,
                    "error": str(e)
                })
        
        # Additional discovery for API endpoints
        if discovery_mode in ["technical_docs", "api_endpoints"]:
            api_task = await skyvern.run_task(
                url=url,
                prompt="Extract all API endpoints, methods, and authentication requirements from the documentation",
                extract_data=True
            )
            
            if api_task.status == "completed" and api_task.extracted_data:
                results["api_endpoints"] = api_task.extracted_data
        
    except Exception as e:
        results["errors"].append({
            "general_error": str(e),
            "url": url
        })
    
    return results

if __name__ == "__main__":
    url = sys.argv[1]
    mode = sys.argv[2]
    context = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
    
    result = asyncio.run(discover_product_access(url, mode, context))
    print(json.dumps(result))
`;

async function runSkyvernDiscovery(job: SkyvernDiscoveryJob): Promise<any> {
  const scriptPath = path.join(__dirname, 'skyvern_discovery.py');
  
  // Write the Python script
  await fs.writeFile(scriptPath, SKYVERN_SCRIPT);
  
  return new Promise((resolve, reject) => {
    const contextJson = JSON.stringify(job.iterationContext || {});
    const pythonProcess = spawn('python', [
      scriptPath,
      job.targetUrl,
      job.discoveryMode,
      contextJson
    ]);
    
    let output = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
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
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Skyvern output: ${output}`));
        }
      }
    });
  });
}

queue.process(async (job) => {
  logger.info('Starting Skyvern discovery job', {
    jobId: job.id,
    scanRequestId: job.data.scanRequestId,
    targetUrl: job.data.targetUrl,
    discoveryMode: job.data.discoveryMode,
    iterationDepth: job.data.iterationContext?.depthLevel || 0
  });
  
  try {
    // Run Skyvern discovery
    const discoveryResults = await runSkyvernDiscovery(job.data);
    
    // Store discovered evidence in database
    const evidenceItems = [];
    
    // Process discovered URLs
    for (const url of discoveryResults.discovered_urls || []) {
      evidenceItems.push({
        scan_request_id: job.data.scanRequestId,
        evidence_id: `skyvern-url-${Date.now()}-${Math.random()}`,
        source: 'skyvern-discovery',
        evidence_type: 'product_information',
        title: `Discovered URL: ${url}`,
        content: JSON.stringify({ discovered_url: url, discovery_mode: job.data.discoveryMode }),
        url: url,
        relevance_score: 0.8,
        metadata: {
          discovery_mode: job.data.discoveryMode,
          iteration_depth: job.data.iterationContext?.depthLevel || 0
        }
      });
    }
    
    // Process technical evidence
    for (const evidence of discoveryResults.technical_evidence || []) {
      evidenceItems.push({
        scan_request_id: job.data.scanRequestId,
        evidence_id: `skyvern-tech-${Date.now()}-${Math.random()}`,
        source: 'skyvern-discovery',
        evidence_type: 'technical_analysis',
        title: `Technical Discovery: ${evidence.prompt}`,
        content: JSON.stringify(evidence.data),
        url: evidence.final_url || job.data.targetUrl,
        relevance_score: 0.9,
        metadata: {
          discovery_prompt: evidence.prompt,
          discovery_mode: job.data.discoveryMode
        }
      });
    }
    
    // Process authentication opportunities
    for (const auth of discoveryResults.authentication_opportunities || []) {
      evidenceItems.push({
        scan_request_id: job.data.scanRequestId,
        evidence_id: `skyvern-auth-${Date.now()}-${Math.random()}`,
        source: 'skyvern-discovery',
        evidence_type: 'product_information',
        title: 'Authentication Opportunity Found',
        content: JSON.stringify(auth),
        url: auth.url,
        relevance_score: 0.95,
        metadata: {
          auth_type: auth.type,
          discovery_mode: job.data.discoveryMode
        }
      });
    }
    
    // Process API endpoints
    if (discoveryResults.api_endpoints && Object.keys(discoveryResults.api_endpoints).length > 0) {
      evidenceItems.push({
        scan_request_id: job.data.scanRequestId,
        evidence_id: `skyvern-api-${Date.now()}-${Math.random()}`,
        source: 'skyvern-discovery',
        evidence_type: 'technical_analysis',
        title: 'API Endpoints Discovered',
        content: JSON.stringify(discoveryResults.api_endpoints),
        url: job.data.targetUrl,
        relevance_score: 1.0,
        metadata: {
          endpoint_count: Object.keys(discoveryResults.api_endpoints).length,
          discovery_mode: job.data.discoveryMode
        }
      });
    }
    
    // Store all evidence items
    if (evidenceItems.length > 0) {
      const { error } = await supabase.from('evidence_items').insert(evidenceItems);
      if (error) {
        logger.error('Failed to store Skyvern evidence', { error });
      } else {
        logger.info('Stored Skyvern discovery evidence', { 
          count: evidenceItems.length,
          scanRequestId: job.data.scanRequestId
        });
      }
    }
    
    // Queue follow-up discovery jobs based on findings
    if (job.data.iterationContext?.depthLevel < 3) {
      // Queue deeper discovery for promising URLs
      const promisingUrls = discoveryResults.discovered_urls?.filter(url => 
        url.includes('demo') || 
        url.includes('api') || 
        url.includes('docs') ||
        url.includes('developer') ||
        url.includes('playground')
      ) || [];
      
      for (const url of promisingUrls.slice(0, 3)) { // Limit to 3 follow-ups
        await queue.add({
          scanRequestId: job.data.scanRequestId,
          targetUrl: url,
          discoveryMode: 'technical_docs',
          iterationContext: {
            previousFindings: [...(job.data.iterationContext?.discoveredPaths || []), url],
            depthLevel: (job.data.iterationContext?.depthLevel || 0) + 1,
            authenticationAttempted: job.data.iterationContext?.authenticationAttempted || false,
            discoveredPaths: [...(job.data.iterationContext?.discoveredPaths || []), url]
          }
        });
      }
    }
    
    return {
      success: true,
      evidenceCount: evidenceItems.length,
      discoveredUrls: discoveryResults.discovered_urls?.length || 0,
      errors: discoveryResults.errors
    };
    
  } catch (error) {
    logger.error('Skyvern discovery failed', {
      error: error.message,
      jobId: job.id,
      scanRequestId: job.data.scanRequestId
    });
    throw error;
  }
});

logger.info('Skyvern discovery worker started');

export { queue as skyvernDiscoveryQueue };