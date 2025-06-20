#!/usr/bin/env node
import { runIntegratedResearch } from '../src/orchestrator/langgraph-integrated';
import { config } from 'dotenv';

config();

async function main() {
  console.log('🚀 Running FAST Integrated LangGraph Pipeline for CIBC Sales Intelligence\n');
  console.log('🎯 Adobe selling to CIBC - Digital Experience Platform Opportunity\n');
  
  try {
    // Set environment variable to use faster search
    process.env.PERPLEXITY_MODEL_OVERRIDE = 'sonar-pro';
    
    const result = await runIntegratedResearch(
      'CIBC',
      'https://www.cibc.com',
      'sales-intelligence',
      {
        salesContext: {
          company: 'CIBC',
          sellingCompany: 'Adobe',
          offering: 'Adobe Experience Cloud - Enterprise digital experience platform including Adobe Experience Manager (AEM), Adobe Target, Adobe Analytics, and Adobe Campaign for personalized customer experiences',
          specificProducts: [
            'Adobe Experience Manager (AEM) - Content management and digital asset management',
            'Adobe Target - A/B testing and personalization',
            'Adobe Analytics - Customer insights and analytics',
            'Adobe Campaign - Cross-channel campaign management',
            'Adobe Experience Platform - Real-time customer data platform'
          ],
          industryContext: 'Financial Services - Banking',
          companySize: '45,000+ employees',
          headquarters: 'Toronto, Canada',
          revenue: '$20+ billion CAD',
          keyInitiatives: [
            'Digital banking transformation',
            'Customer experience modernization',
            'Mobile banking enhancement',
            'Personalization at scale',
            'Data-driven marketing'
          ],
          competitorContext: [
            'Other major Canadian banks (RBC, TD, BMO, Scotiabank)',
            'Digital-first banks and fintechs'
          ]
        }
      }
    );
    
    console.log('\n✅ Research complete!');
    console.log(`Evidence collected: ${result.evidence?.length || 0} pieces`);
    console.log(`Report sections: ${Object.keys(result.reportSections || {}).length}`);
    
    // Save the results
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(process.cwd(), 'data', 'research-results');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `cibc-adobe-sales-intelligence-fast-${timestamp}.json`);
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    
    console.log(`\n💾 Results saved to: ${outputPath}`);
    
    // Display summary
    if (result.report) {
      console.log('\n📄 Report Summary:');
      console.log('================');
      const summary = typeof result.report === 'string' 
        ? result.report.substring(0, 500) + '...'
        : JSON.stringify(result.report).substring(0, 500) + '...';
      console.log(summary);
    }
    
  } catch (error) {
    console.error('❌ Research failed:', error);
    console.error(error.stack);
  }
}

main().catch(console.error);