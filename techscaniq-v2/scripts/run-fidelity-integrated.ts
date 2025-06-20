#!/usr/bin/env node
import { config } from 'dotenv';
import { runIntegratedResearch } from '../src/orchestrator/langgraph-integrated';
import { StorageService } from '../src/services/storage';
import * as fs from 'fs/promises';
import * as path from 'path';

config();

async function runFidelityIntegrated() {
  console.log('🚀 Running Integrated LangGraph Pipeline for Fidelity Canada Sales Intelligence\n');
  
  const storage = new StorageService();
  const startTime = Date.now();
  
  try {
    // Run the integrated research
    const result = await runIntegratedResearch(
      'Fidelity Canada',
      'https://www.fidelity.ca',
      'sales-intelligence',
      {
        salesContext: {
          company: 'Fidelity Canada',
          offering: 'Interad - Full-service digital agency providing end-to-end web and mobile solutions',
          idealCustomerProfile: {
            industry: 'Financial Services',
            companySize: 'Large Enterprise (1000+ employees)',
            geography: 'Canada (Toronto/Ontario region)',
          },
          useCases: [
            'Develop secure online financial tools and calculators',
            'Build compliant online account application forms',
            'Create mobile apps for customer engagement',
            'Implement accessibility compliance for AODA requirements',
            'Modernize legacy web interfaces',
          ],
          focusAreas: [
            'accessibility compliance AODA',
            'performance optimization',
            'mobile experience',
            'digital transformation',
            'customer experience technology',
          ],
        },
      }
    );
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
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
        console.log(`   - ${quality}: ${count} items`);
      });
    }
    
    // Show tools used
    if (result.metadata?.toolsUsed) {
      console.log('\n🛠️ Tools Used:');
      result.metadata.toolsUsed.forEach(tool => {
        console.log(`   ✓ ${tool}`);
      });
    }
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(process.cwd(), 'data', 'integrated-results');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `fidelity-integrated-${timestamp}.json`);
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    
    console.log(`\n💾 Results saved to: ${outputPath}`);
    
    // Show report preview if available
    if (result.reportSections && Object.keys(result.reportSections).length > 0) {
      console.log('\n📄 Report Preview:');
      Object.entries(result.reportSections).slice(0, 2).forEach(([section, content]: [string, any]) => {
        console.log(`\n=== ${section.toUpperCase()} ===`);
        if (typeof content === 'string') {
          console.log(content.substring(0, 300) + '...');
        } else if (content.content) {
          console.log(content.content.substring(0, 300) + '...');
        }
      });
    }
    
  } catch (error) {
    console.error('\n❌ Research failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the integrated pipeline
runFidelityIntegrated().catch(console.error);