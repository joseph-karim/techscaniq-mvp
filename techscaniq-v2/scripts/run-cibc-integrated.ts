#!/usr/bin/env node
import { config } from 'dotenv';
import { runIntegratedResearch } from '../src/orchestrator/langgraph-integrated';
import { StorageService } from '../src/services/storage';
import * as fs from 'fs/promises';
import * as path from 'path';

config();

async function runCIBCIntegrated() {
  console.log('🚀 Running Integrated LangGraph Pipeline for CIBC Sales Intelligence\n');
  console.log('🎯 Adobe selling to CIBC - Digital Experience Platform Opportunity\n');
  console.log('⏱️ Timeout set to 2 hours for comprehensive deep research\n');
  
  // Set a timeout for the entire process (2 hours for deep research)
  const timeout = setTimeout(() => {
    console.error('\n⏱️ Pipeline timeout after 2 hours');
    process.exit(1);
  }, 2 * 60 * 60 * 1000);
  
  const storage = new StorageService();
  const startTime = Date.now();
  
  try {
    // Run the integrated research for CIBC
    const result = await runIntegratedResearch(
      'CIBC',
      'https://www.cibc.com',
      'sales-intelligence',
      {
        salesContext: {
          company: 'CIBC',
          sellingCompany: 'Adobe',
          offering: 'Adobe Experience Cloud - Enterprise digital experience platform including AEM, Analytics, Target, Campaign, and Commerce',
          idealCustomerProfile: {
            industry: 'Financial Services - Banking',
            companySize: 'Large Enterprise (45,000+ employees)',
            geography: 'Canada (Toronto HQ)',
            revenue: '$20B+ CAD annually',
          },
          useCases: [
            'Unified digital experience across web, mobile, and branch channels',
            'Real-time personalization for millions of banking customers',
            'Omnichannel campaign management and marketing automation',
            'Digital asset management for marketing content',
            'A/B testing and optimization for conversion improvement',
            'Customer journey analytics and insights',
            'Commerce capabilities for banking products',
            'Content management for multilingual requirements (EN/FR)',
          ],
          competitiveAlternatives: [
            'Salesforce Marketing Cloud',
            'Sitecore Experience Platform',
            'Acquia Digital Experience Platform',
            'Optimizely (Episerver)',
            'Current incumbent solutions',
          ],
          valueProposition: 'Adobe Experience Cloud provides CIBC with an integrated platform to deliver personalized banking experiences at scale, improve customer acquisition and retention, ensure regulatory compliance, and accelerate digital transformation initiatives.',
          focusAreas: [
            'digital transformation banking',
            'customer experience personalization',
            'marketing automation financial services',
            'regulatory compliance digital banking',
            'mobile banking experience',
            'omnichannel banking platform',
            'real-time customer analytics',
            'content management multilingual',
          ],
          differentiators: [
            'Industry-leading AI/ML with Adobe Sensei for banking insights',
            'Proven track record with major financial institutions globally',
            'Deep integration capabilities with core banking systems',
            'Enterprise-grade security and compliance certifications',
            'Scalability to handle millions of banking customers',
            'Strong partner ecosystem for implementation',
            'Canadian data residency options',
          ],
        },
      }
    );
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Clear the timeout on success
    clearTimeout(timeout);
    
    console.log('\n✅ Research completed successfully!');
    console.log(`⏱️ Total time: ${duration.toFixed(1)} seconds`);
    console.log(`📊 Evidence collected: ${result.evidence?.length || 0} pieces`);
    console.log(`📝 Final status: ${result.status}`);
    
    // Display evidence summary
    if (result.evidence && result.evidence.length > 0) {
      console.log('\n📋 Evidence Summary by Source:');
      const sourceCounts = result.evidence.reduce((acc, ev) => {
        const source = ev.source.name;
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`   - ${source}: ${count} items`);
      });
      
      // Show quality distribution
      console.log('\n📊 Evidence Quality Distribution:');
      const qualityBuckets = {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      };
      
      result.evidence.forEach(ev => {
        const score = ev.qualityScore?.overall || 0;
        if (score >= 0.8) qualityBuckets.excellent++;
        else if (score >= 0.6) qualityBuckets.good++;
        else if (score >= 0.4) qualityBuckets.fair++;
        else qualityBuckets.poor++;
      });
      
      Object.entries(qualityBuckets).forEach(([quality, count]) => {
        const percentage = ((count / result.evidence.length) * 100).toFixed(1);
        console.log(`   - ${quality}: ${count} items (${percentage}%)`);
      });
      
      // Show top evidence pieces
      console.log('\n🌟 Top Quality Evidence:');
      const topEvidence = result.evidence
        .sort((a, b) => (b.qualityScore?.overall || 0) - (a.qualityScore?.overall || 0))
        .slice(0, 5);
      
      topEvidence.forEach((ev, idx) => {
        console.log(`\n${idx + 1}. [${(ev.qualityScore?.overall || 0).toFixed(2)}] ${ev.source.name}`);
        if (ev.source.url) {
          console.log(`   URL: ${ev.source.url}`);
        }
        // Show brief content preview
        try {
          const content = typeof ev.content === 'string' ? JSON.parse(ev.content) : ev.content;
          if (content.data?.title) {
            console.log(`   Title: ${content.data.title}`);
          }
          if (content.query) {
            console.log(`   Query: ${content.query}`);
          }
        } catch (e) {
          // If not JSON, show raw preview
          const preview = ev.content.substring(0, 100).replace(/\n/g, ' ');
          console.log(`   Preview: ${preview}...`);
        }
      });
    }
    
    // Show tools used
    if (result.metadata?.toolsUsed) {
      console.log('\n🛠️ Tools Used:');
      const toolCounts = result.metadata.toolsUsed.reduce((acc, tool) => {
        acc[tool] = (acc[tool] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(toolCounts).forEach(([tool, count]) => {
        console.log(`   ✓ ${tool} (${count} calls)`);
      });
    }
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(process.cwd(), 'data', 'integrated-results');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `cibc-adobe-integrated-${timestamp}.json`);
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    
    console.log(`\n💾 Results saved to: ${outputPath}`);
    
    // Show report preview if available
    if (result.reportSections && Object.keys(result.reportSections).length > 0) {
      console.log('\n📄 Report Preview:');
      Object.entries(result.reportSections).slice(0, 3).forEach(([section, content]: [string, any]) => {
        console.log(`\n=== ${section.toUpperCase()} ===`);
        if (typeof content === 'string') {
          console.log(content.substring(0, 400) + '...');
        } else if (content.content) {
          console.log(content.content.substring(0, 400) + '...');
        }
      });
    }
    
    // Show key insights
    console.log('\n💡 Key Insights:');
    if (result.evidence && result.evidence.length > 0) {
      // Look for synthesis evidence
      const synthesis = result.evidence.find(ev => ev.id === 'synthesis');
      if (synthesis) {
        const insights = synthesis.content.split('\n').filter(line => line.trim()).slice(0, 5);
        insights.forEach((insight, idx) => {
          console.log(`${idx + 1}. ${insight.substring(0, 150)}${insight.length > 150 ? '...' : ''}`);
        });
      }
    }
    
  } catch (error) {
    clearTimeout(timeout);
    console.error('\n❌ Research failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the integrated pipeline
runCIBCIntegrated().catch(console.error);