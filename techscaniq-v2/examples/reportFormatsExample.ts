/**
 * Example: Different Report Formats with TechScanIQ
 * 
 * This example demonstrates how to generate both Sales Intelligence (BMO)
 * and PE Due Diligence reports for the same company.
 */

import { runFormatAwareResearch } from '../src/orchestrator/formatAwareGraph';
import { Thesis } from '../src/types';

// Example 1: Sales Intelligence Report (BMO Format)
async function generateSalesIntelligenceReport() {
  console.log('\n🎯 Generating Sales Intelligence Report (BMO Format)...\n');
  
  const adobeThesis: Thesis = {
    statement: 'Adobe is a prime enterprise software sales opportunity with expanding digital transformation needs',
    company: 'Adobe',
    pillars: [
      {
        id: 'current-tech',
        name: 'Current Technology Landscape',
        weight: 0.30,
        questions: [
          'What is their current tech stack?',
          'What integrations do they have?',
          'What are their technology pain points?',
          'What systems are they looking to replace?'
        ],
      },
      {
        id: 'business-priorities',
        name: 'Business Priorities',
        weight: 0.25,
        questions: [
          'What are their strategic initiatives for 2024-2025?',
          'What digital transformation projects are underway?',
          'What are their competitive pressures?',
          'What customer experience goals do they have?'
        ],
      },
      {
        id: 'buying-signals',
        name: 'Buying Signals',
        weight: 0.25,
        questions: [
          'What budget announcements have they made?',
          'Are there new executives driving change?',
          'What vendor contracts are up for renewal?',
          'What RFPs have they issued recently?'
        ],
      },
      {
        id: 'stakeholders',
        name: 'Key Stakeholders',
        weight: 0.20,
        questions: [
          'Who are the key decision makers?',
          'What is the reporting structure?',
          'Who are the technical influencers?',
          'What are their backgrounds and priorities?'
        ],
      },
    ],
    metadata: {
      sector: 'Software',
      subSector: 'Creative & Marketing Software',
    },
  };
  
  try {
    const result = await runFormatAwareResearch(adobeThesis, {
      reportType: 'sales-intelligence',
      maxIterations: 2,
      useSonar: true,
      useMarketContext: true,
    });
    
    console.log('\n📊 Sales Intelligence Report Generated!\n');
    
    // Display key sections
    const sections = result.reportSections || {};
    
    if (sections.executive_overview) {
      console.log('📋 Executive Overview:');
      console.log(sections.executive_overview.keyFindings.slice(0, 3).join('\n'));
    }
    
    if (sections.buying_signals) {
      console.log('\n💡 Buying Signals:');
      console.log('Key Findings:', sections.buying_signals.keyFindings.length);
      console.log('Action Items:', sections.buying_signals.metadata?.actionItems?.length || 0);
    }
    
    if (sections.stakeholder_analysis) {
      console.log('\n👥 Key Stakeholders Identified:');
      const stakeholders = sections.stakeholder_analysis.metadata?.metrics || {};
      Object.entries(stakeholders).forEach(([role, info]: [string, any]) => {
        console.log(`  - ${role}: ${info.value}`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('Sales intelligence report generation failed:', error);
  }
}

// Example 2: PE Due Diligence Report
async function generatePEDueDiligenceReport() {
  console.log('\n💼 Generating PE Due Diligence Report...\n');
  
  const snowplowThesis: Thesis = {
    statement: 'Snowplow Analytics represents a compelling growth equity opportunity in the rapidly expanding customer data infrastructure market',
    company: 'Snowplow',
    pillars: [
      {
        id: 'tech-architecture',
        name: 'Technology Architecture',
        weight: 0.25,
        questions: [
          'How scalable is the architecture?',
          'What is the technical debt situation?',
          'How does it compare to competitors technically?',
          'What are the infrastructure costs?'
        ],
      },
      {
        id: 'market-position',
        name: 'Market Position',
        weight: 0.25,
        questions: [
          'What is the TAM for customer data platforms?',
          'What is their market share vs Segment/Amplitude?',
          'How strong is their competitive moat?',
          'What are the growth vectors?'
        ],
      },
      {
        id: 'financial-health',
        name: 'Financial Health',
        weight: 0.30,
        questions: [
          'What are the revenue growth rates?',
          'What are the unit economics (LTV/CAC)?',
          'What is the path to profitability?',
          'How efficient is their go-to-market?'
        ],
      },
      {
        id: 'risks',
        name: 'Risk Assessment',
        weight: 0.20,
        questions: [
          'What are the technology obsolescence risks?',
          'What customer concentration risks exist?',
          'What are the competitive threats?',
          'What execution risks should we consider?'
        ],
      },
    ],
    metadata: {
      sector: 'Data Infrastructure',
      subSector: 'Customer Data Platforms',
      investmentStage: 'Growth Equity',
    },
  };
  
  try {
    const result = await runFormatAwareResearch(snowplowThesis, {
      reportType: 'pe-due-diligence',
      maxIterations: 3,
      useSonar: true,
      useMarketContext: true,
    });
    
    console.log('\n📊 PE Due Diligence Report Generated!\n');
    
    // Display investment recommendation
    const sections = result.reportSections || {};
    
    if (sections.investment_recommendation) {
      const rec = sections.investment_recommendation;
      console.log('🎯 Investment Recommendation:');
      console.log(`Recommendation: ${rec.metadata?.recommendation || 'Pending'}`);
      console.log(`Confidence: ${rec.score}%`);
      console.log('\nKey Drivers:');
      rec.keyFindings.forEach(finding => console.log(`  • ${finding}`));
      console.log('\nCritical Risks:');
      rec.risks.forEach(risk => console.log(`  ⚠️  ${risk}`));
    }
    
    if (sections.financial_analysis) {
      console.log('\n💰 Financial Highlights:');
      const metrics = sections.financial_analysis.metadata?.metrics || {};
      Object.entries(metrics).forEach(([metric, data]: [string, any]) => {
        console.log(`  - ${metric}: ${data.value}`);
      });
    }
    
    if (sections.technology_assessment) {
      console.log('\n🔧 Technology Assessment Score:', sections.technology_assessment.score);
    }
    
    return result;
    
  } catch (error) {
    console.error('PE due diligence report generation failed:', error);
  }
}

// Example 3: Compare Report Formats
async function compareReportFormats() {
  console.log('\n📊 Comparing Report Formats\n');
  
  console.log('Sales Intelligence Report (BMO) Structure:');
  console.log('- Executive Overview: Company snapshot and opportunities');
  console.log('- Technology Landscape: Current stack and gaps');
  console.log('- Business Priorities: Strategic initiatives');
  console.log('- Buying Signals: Budget and timing indicators');
  console.log('- Stakeholder Analysis: Decision makers');
  console.log('- Competitive Intelligence: Vendor relationships');
  
  console.log('\nPE Due Diligence Report Structure:');
  console.log('- Executive Summary: Investment recommendation');
  console.log('- Technology Assessment: Architecture and scalability');
  console.log('- Market Analysis: TAM and competitive position');
  console.log('- Financial Analysis: Unit economics and growth');
  console.log('- Risk Assessment: Key risks and mitigation');
  console.log('- Value Creation: Improvement opportunities');
  console.log('- Investment Recommendation: Terms and exit strategy');
  
  console.log('\nKey Differences:');
  console.log('1. Audience: Sales teams vs Investment committees');
  console.log('2. Focus: Opportunities vs Risk/Return');
  console.log('3. Depth: Actionable insights vs Comprehensive analysis');
  console.log('4. Outcome: Engagement strategy vs Investment decision');
}

// Run examples
if (require.main === module) {
  (async () => {
    console.log('🚀 TechScanIQ Report Format Examples\n');
    
    // Generate Sales Intelligence Report
    await generateSalesIntelligenceReport();
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Generate PE Due Diligence Report
    await generatePEDueDiligenceReport();
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Show format comparison
    await compareReportFormats();
    
    console.log('\n✅ Report format examples complete!');
  })();
}

export {
  generateSalesIntelligenceReport,
  generatePEDueDiligenceReport,
  compareReportFormats,
};