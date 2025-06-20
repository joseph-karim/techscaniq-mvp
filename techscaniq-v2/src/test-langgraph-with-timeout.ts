#!/usr/bin/env tsx

import { runIntegratedResearch } from './orchestrator/langgraph-integrated';
import { InvestmentThesis } from './types';

async function main() {
  console.log('🚀 Running Integrated LangGraph Pipeline for CIBC Sales Intelligence with 60-minute timeout');
  
  // Set a timeout for the entire process (60 minutes for deep research)
  const timeout = setTimeout(() => {
    console.error('\n⏱️ Pipeline timeout after 60 minutes');
    process.exit(1);
  }, 60 * 60 * 1000);

  try {
    // Create a comprehensive thesis for Adobe selling to CIBC
    const thesis: InvestmentThesis = {
      id: 'adobe-cibc-sales-2024',
      company: 'CIBC',
      companyWebsite: 'https://www.cibc.com',
      website: 'https://www.cibc.com',
      statement: 'Adobe can help CIBC accelerate their digital transformation with Adobe Experience Cloud, enabling personalized customer experiences across all digital channels while improving operational efficiency.',
      type: 'sales-intelligence' as const,
      pillars: [
        {
          id: 'tech-architecture',
          name: 'Technology Architecture & Integration',
          weight: 0.25,
          description: 'Evaluate CIBC\'s current technology stack and identify integration opportunities',
          questions: [
            'What is CIBC\'s current technology architecture and infrastructure?',
            'What digital transformation initiatives has CIBC undertaken recently?',
            'What are the key technology challenges CIBC is facing?',
            'How does CIBC\'s technology compare to other Canadian banks?',
            'What vendors and technologies does CIBC currently use?'
          ]
        },
        {
          id: 'market-position',
          name: 'Market Position & Strategy',
          weight: 0.25,
          description: 'Understand CIBC\'s market position and strategic priorities',
          questions: [
            'What is CIBC\'s market position in Canadian banking?',
            'What are CIBC\'s strategic priorities for the next 3-5 years?',
            'Who are CIBC\'s main competitors and how do they differentiate?',
            'What customer segments does CIBC prioritize?',
            'What are CIBC\'s growth initiatives?'
          ]
        },
        {
          id: 'financial-health',
          name: 'Financial Health & Budget',
          weight: 0.20,
          description: 'Assess CIBC\'s financial capacity for technology investments',
          questions: [
            'What is CIBC\'s financial performance and outlook?',
            'How much does CIBC invest in technology annually?',
            'What is CIBC\'s budget allocation for digital transformation?',
            'What are CIBC\'s revenue streams and profitability?',
            'How does CIBC\'s technology spending compare to peers?'
          ]
        },
        {
          id: 'customer-experience',
          name: 'Customer Experience Initiatives',
          weight: 0.20,
          description: 'Identify customer experience gaps and opportunities',
          questions: [
            'What customer experience initiatives has CIBC implemented?',
            'What are CIBC\'s customer satisfaction scores and pain points?',
            'How does CIBC approach personalization and omnichannel experiences?',
            'What digital channels does CIBC offer to customers?',
            'What are CIBC\'s customer experience goals?'
          ]
        },
        {
          id: 'decision-makers',
          name: 'Key Stakeholders & Decision Makers',
          weight: 0.10,
          description: 'Identify key stakeholders and decision-making process',
          questions: [
            'Who are the key technology decision makers at CIBC?',
            'What is CIBC\'s technology procurement process?',
            'Who leads digital transformation at CIBC?',
            'What are the reporting structures for technology decisions?',
            'What vendor relationships does CIBC have?'
          ]
        }
      ],
      successCriteria: [
        'Identify specific use cases where Adobe solutions address CIBC pain points',
        'Map Adobe capabilities to CIBC\'s digital transformation roadmap',
        'Quantify potential ROI and business impact',
        'Develop competitive differentiation strategy',
        'Create stakeholder engagement plan'
      ],
      riskFactors: [
        'Existing vendor lock-in or long-term contracts',
        'Budget constraints or spending freezes',
        'Complex regulatory requirements in Canadian banking',
        'Internal resistance to change',
        'Competitive solutions already in place'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add metadata for sales intelligence context
    const metadata = {
      reportType: 'sales-intelligence' as const,
      salesContext: {
        offering: 'Adobe Experience Cloud - Digital Experience Platform',
        targetBuyer: 'Chief Digital Officer, CTO, CMO',
        dealSize: 'Enterprise (>$1M annual)',
        salesStage: 'Prospecting/Qualification',
        competitiveContext: 'Competing with Salesforce, Microsoft, custom solutions'
      }
    };
    
    const result = await runIntegratedPipeline(thesis, metadata);
    
    clearTimeout(timeout);
    
    console.log('\n🎯 Adobe selling to CIBC - Digital Experience Platform Opportunity');
    console.log('========================================\n');
    
    // Log summary statistics
    if (result.evidence) {
      console.log(`📊 Evidence Summary:`);
      console.log(`  - Total evidence collected: ${result.evidence.length}`);
      console.log(`  - High quality (≥0.7): ${result.evidence.filter(e => e.qualityScore?.overall >= 0.7).length}`);
      console.log(`  - Medium quality (0.5-0.7): ${result.evidence.filter(e => e.qualityScore?.overall >= 0.5 && e.qualityScore?.overall < 0.7).length}`);
      console.log(`  - Low quality (<0.5): ${result.evidence.filter(e => !e.qualityScore || e.qualityScore.overall < 0.5).length}`);
    }
    
    if (result.reportSections) {
      console.log(`\n📄 Report Sections Generated: ${Object.keys(result.reportSections).length}`);
      
      // Display executive summary if available
      const execSummary = result.reportSections['executive_summary'];
      if (execSummary) {
        console.log('\n📋 Executive Summary:');
        console.log(execSummary.content);
        
        if (execSummary.keyFindings?.length > 0) {
          console.log('\n🔍 Key Findings:');
          execSummary.keyFindings.forEach(finding => {
            console.log(`  • ${finding}`);
          });
        }
      }
      
      // Display recommendation if available
      const recommendation = result.reportSections['recommendation'];
      if (recommendation) {
        console.log('\n💡 Investment Recommendation:');
        console.log(recommendation.content);
      }
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      result.errors.forEach(error => {
        console.log(`  - ${error.phase}: ${error.error}`);
      });
    }
    
    // Save full result to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cibc-adobe-report-${timestamp}.json`;
    await require('fs').promises.writeFile(
      filename,
      JSON.stringify(result, null, 2)
    );
    console.log(`\n💾 Full report saved to: ${filename}`);
    
  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

// Run the pipeline
main().catch(console.error);