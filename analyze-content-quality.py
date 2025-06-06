#!/usr/bin/env python3
"""
Analyze actual content quality from deep research crawler
"""

import json
import statistics

def analyze_content_quality():
    """Analyze the quality of extracted content"""
    
    # Load the test results
    with open('deep_research_test_mixpanel_com.json') as f:
        data = json.load(f)
    
    print("📊 CONTENT QUALITY ANALYSIS")
    print("=" * 60)
    
    # Overall stats
    total_items = len(data['evidence_items'])
    print(f"\nTotal evidence items: {total_items}")
    print(f"Pages crawled: {data['pages_crawled']}")
    print(f"Evidence types collected: {len(data['evidence_coverage']['collected'])}")
    
    # Analyze content structure
    content_types = {}
    empty_content = 0
    meaningful_content = 0
    summary_lengths = []
    confidence_scores = []
    
    for item in data['evidence_items']:
        # Track evidence types
        evidence_type = item['type']
        content_types[evidence_type] = content_types.get(evidence_type, 0) + 1
        
        # Track confidence scores
        confidence_scores.append(item['confidence'])
        
        # Analyze content quality
        content = item['content']
        
        if isinstance(content, dict):
            # Check for meaningful content
            if 'summary' in content:
                summary = content['summary']
                summary_lengths.append(len(summary))
                
                # Check if it's just navigation/menu content
                if summary.startswith('Fintech, how do you measure'):
                    print(f"\n⚠️  Item {item['source']}: Appears to be navigation/header content")
                elif len(summary) < 100:
                    print(f"\n⚠️  Item {item['source']}: Very short summary ({len(summary)} chars)")
                else:
                    meaningful_content += 1
                    
            elif 'targeted_gaps' in content:
                # External validation items
                if 'gap_relevance' in content and content['gap_relevance'] < 0.3:
                    print(f"\n⚠️  Item {item['source']}: Low gap relevance ({content['gap_relevance']})")
            else:
                empty_content += 1
                print(f"\n❌ Item {item['source']}: No summary or meaningful content")
        else:
            empty_content += 1
            print(f"\n❌ Item {item['source']}: Non-dict content")
    
    # Print analysis
    print(f"\n\n📈 CONTENT QUALITY METRICS:")
    print("-" * 40)
    print(f"Items with meaningful content: {meaningful_content}/{total_items} ({meaningful_content/total_items*100:.1f}%)")
    print(f"Empty/minimal content items: {empty_content}")
    
    if summary_lengths:
        print(f"\nSummary length stats:")
        print(f"  Average: {statistics.mean(summary_lengths):.0f} chars")
        print(f"  Median: {statistics.median(summary_lengths):.0f} chars")
        print(f"  Min: {min(summary_lengths)} chars")
        print(f"  Max: {max(summary_lengths)} chars")
    
    print(f"\nConfidence score stats:")
    print(f"  Average: {statistics.mean(confidence_scores):.2f}")
    print(f"  Min: {min(confidence_scores):.2f}")
    print(f"  Max: {max(confidence_scores):.2f}")
    
    print(f"\n\n🎯 EVIDENCE TYPE DISTRIBUTION:")
    print("-" * 40)
    for etype, count in sorted(content_types.items(), key=lambda x: x[1], reverse=True):
        print(f"{etype}: {count} items")
    
    # Check actual content examples
    print(f"\n\n🔍 SAMPLE CONTENT ANALYSIS:")
    print("-" * 40)
    
    # Find items with actual meaningful content
    meaningful_items = []
    for item in data['evidence_items']:
        if isinstance(item['content'], dict) and 'summary' in item['content']:
            summary = item['content']['summary']
            if len(summary) > 200 and not summary.startswith('Fintech, how do you'):
                meaningful_items.append(item)
    
    print(f"\nFound {len(meaningful_items)} items with substantial content")
    
    # Show a few examples
    for i, item in enumerate(meaningful_items[:3]):
        print(f"\n--- Example {i+1} ---")
        print(f"Type: {item['type']}")
        print(f"Source: {item['source'][:80]}...")
        summary = item['content']['summary']
        
        # Extract some actual facts/data
        import re
        
        # Look for numbers, facts, features
        numbers = re.findall(r'\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|M|B|%|users?|customers?|companies))', summary)
        if numbers:
            print(f"Quantitative data found: {numbers[:3]}")
        
        # Look for product features
        if 'product' in summary.lower() or 'feature' in summary.lower():
            print("✓ Contains product information")
            
        # Look for technical details
        if any(term in summary.lower() for term in ['api', 'integration', 'platform', 'analytics', 'data']):
            print("✓ Contains technical details")
            
        print(f"Content preview: {summary[:200]}...")
    
    # Final verdict
    print(f"\n\n🏁 OVERALL ASSESSMENT:")
    print("-" * 40)
    
    quality_score = (meaningful_content / total_items) * 100
    
    if quality_score < 30:
        print("❌ POOR QUALITY: Most content is navigation/boilerplate")
    elif quality_score < 60:
        print("⚠️  MODERATE QUALITY: Mixed content quality")
    else:
        print("✅ GOOD QUALITY: Substantial content extracted")
        
    print(f"\nQuality Score: {quality_score:.1f}%")
    
    # Specific issues
    print(f"\n⚠️  IDENTIFIED ISSUES:")
    print("1. Many items contain navigation/header content instead of page content")
    print("2. External URLs are Google Vertex AI redirect URLs (need to be crawled)")
    print("3. Content extraction focuses on structure but not deep text analysis")
    print("4. Missing LLM-based content extraction for better quality")

if __name__ == "__main__":
    analyze_content_quality()