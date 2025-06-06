#!/usr/bin/env python3
"""
Streaming version of Deep Research Crawler that outputs progress updates
"""

import asyncio
import json
import sys
import os
from typing import Dict, List, Any, Optional
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from deep_research_crawler import DeepResearchCrawler


class StreamingDeepResearchCrawler(DeepResearchCrawler):
    """Extended crawler with streaming output support"""
    
    def __init__(self, domain: str, investment_thesis: str, api_keys: Optional[Dict[str, str]] = None):
        super().__init__(domain, investment_thesis, api_keys)
        self.streamed_evidence = set()  # Track what we've already streamed
    
    async def stream_callback(self, update: Dict[str, Any]):
        """Output streaming updates to stdout for the Node.js worker"""
        # Output streaming update
        print(f"STREAM:{json.dumps(update)}", flush=True)
        
        # If this is a progress update with new evidence, stream the evidence items
        if update.get('type') == 'progress' and update.get('new_evidence'):
            for evidence in update['new_evidence']:
                # Only stream each evidence item once
                evidence_key = f"{evidence.get('url')}:{evidence.get('evidence_type')}"
                if evidence_key not in self.streamed_evidence:
                    self.streamed_evidence.add(evidence_key)
                    
                    # Find the corresponding evidence item
                    for item in self.evidence_items:
                        if item['source'] == evidence.get('url') and item['type'] == evidence.get('evidence_type'):
                            print(f"EVIDENCE:{json.dumps(item)}", flush=True)
                            break
    
    async def conduct_research_streaming(self, max_pages: int = 200) -> Dict[str, Any]:
        """Conduct research with streaming updates"""
        return await self.conduct_research(max_pages=max_pages, stream_callback=self.stream_callback)


async def main():
    """Main entry point for streaming crawler"""
    
    if len(sys.argv) < 4:
        print("Usage: python deep_research_crawler_streaming.py <domain> <investment_thesis> <scan_request_id> [api_keys_json]")
        sys.exit(1)
    
    domain = sys.argv[1]
    investment_thesis = sys.argv[2]
    scan_request_id = sys.argv[3]
    
    # Load API keys if provided
    api_keys = {}
    if len(sys.argv) > 4:
        try:
            api_keys = json.loads(sys.argv[4])
        except:
            pass
    
    # Create streaming crawler
    crawler = StreamingDeepResearchCrawler(domain, investment_thesis, api_keys)
    
    try:
        # Initial status
        await crawler.stream_callback({
            'type': 'status',
            'phase': 'starting',
            'message': f'Initializing deep research crawler for {domain}'
        })
        
        # Run research with streaming
        results = await crawler.conduct_research_streaming(max_pages=200)
        
        # Output final summary (not streamed, just for logging)
        print(f"\n🎯 Research Complete:", file=sys.stderr)
        print(f"   Evidence collected: {results['evidence_count']}", file=sys.stderr)
        print(f"   Pages crawled: {results['pages_crawled']}", file=sys.stderr)
        print(f"   Iterations: {results['research_iterations']}", file=sys.stderr)
        
        # Stream any remaining evidence items that weren't streamed during progress
        for item in results['evidence_items']:
            evidence_key = f"{item['source']}:{item['type']}"
            if evidence_key not in crawler.streamed_evidence:
                print(f"EVIDENCE:{json.dumps(item)}", flush=True)
        
        # Final completion marker
        await crawler.stream_callback({
            'type': 'complete',
            'phase': 'done',
            'evidence_count': results['evidence_count'],
            'pages_crawled': results['pages_crawled'],
            'synthesis': results['synthesis']
        })
        
    except Exception as e:
        import traceback
        # Stream error
        await crawler.stream_callback({
            'type': 'error',
            'error': str(e),
            'traceback': traceback.format_exc()
        })
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())