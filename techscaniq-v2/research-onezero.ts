/**
 * OneZero Financial Systems PE Due Diligence Research
 * 
 * Investment Thesis: Accelerate Organic Growth with Buy-and-Build overlay
 * Investor: Golden Gate Capital (with Lovell Minnick Partners)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env.local') });

import { runFormatAwareResearch } from './src/orchestrator/formatAwareGraph';
import { Thesis } from './src/types';
import * as fs from 'fs/promises';

async function runOneZeroResearch() {
  console.log('\n🎯 Starting OneZero Financial Systems PE Due Diligence...\n');
  
  const oneZeroThesis: Thesis = {
    statement: 'OneZero represents a compelling Accelerate Organic Growth opportunity - pour fuel on a proven multi-asset trading platform processing >$250B ADV with clear product roadmap expansion and selective M&A opportunities',
    company: 'OneZero Financial Systems',
    website: 'https://www.onezero.com',
    pillars: [
      {
        id: 'scalability-headroom',
        name: 'Scalability & Performance (40%)',
        weight: 0.40,
        questions: [
          'What is the current latency performance under peak loads across regions?',
          'How does the auto-scaling architecture handle the $250B ADV, 12M trades, and 150B quotes daily?',
          'What is the technical headroom for 10x growth without architecture changes?',
          'How resilient is the multi-region deployment and failover capability?',
          'What are the performance benchmarks vs competitors like ION, FlexTrade, and Trading Technologies?'
        ],
      },
      {
        id: 'release-velocity',
        name: 'Release Velocity & Engineering Excellence (20%)',
        weight: 0.20,
        questions: [
          'What is the current CI/CD pipeline health, deployment frequency, and MTTR?',
          'How much technical debt exists in Hub, EcoSystem, and Data Source components?',
          'What is the test coverage and automated testing strategy?',
          'How modular is the architecture for rapid feature development?',
          'What is the engineering team structure and velocity metrics?'
        ],
      },
      {
        id: 'integration-readiness',
        name: 'M&A Integration Capabilities (20%)',
        weight: 0.20,
        questions: [
          'How complete and well-documented are the APIs for potential bolt-on acquisitions?',
          'What is the data model flexibility for integrating new asset classes or products?',
          'How standardized are the integration patterns for liquidity providers?',
          'What acquisition integration playbooks exist from past M&A?',
          'How easily can new trading venues or protocols be onboarded?'
        ],
      },
      {
        id: 'security-compliance',
        name: 'Security & Regulatory Compliance (10%)',
        weight: 0.10,
        questions: [
          'Beyond ISO 27001, what is the SOC-2 and GDPR compliance status?',
          'How robust is the security architecture for institutional trading?',
          'What regulatory certifications exist for different jurisdictions?',
          'How is sensitive trading data encrypted and segregated?',
          'What is the incident response and disaster recovery capability?'
        ],
      },
      {
        id: 'cost-efficiency',
        name: 'Infrastructure Cost Efficiency (10%)',
        weight: 0.10,
        questions: [
          'What is the current $/trade and $/quote on the cloud infrastructure?',
          'How efficient is the resource utilization and auto-scaling?',
          'What are the gross margins on the technology platform?',
          'How does infrastructure cost scale with volume growth?',
          'What optimization opportunities exist for cost reduction?'
        ],
      },
    ],
    metadata: {
      sector: 'Financial Technology',
      subSector: 'Capital Markets Infrastructure',
      investmentStage: 'Growth Equity',
      reportType: 'pe-due-diligence',
    },
  };
  
  try {
    console.log('📊 Configuration:');
    console.log('- Report Type: PE Due Diligence');
    console.log('- Max Iterations: 2');
    console.log('- Using Sonar: Yes (Perplexity Deep Research)');
    console.log('- Market Context: Yes (FinTech infrastructure evaluation)\n');
    
    const result = await runFormatAwareResearch(oneZeroThesis, {
      reportType: 'pe-due-diligence',
      maxIterations: 2,
      useSonar: true, // Enable Sonar Deep Research
      useMarketContext: true,
    });
    
    console.log('\n✅ Research Complete!\n');
    
    // Display key results
    const sections = result.reportSections || {};
    
    // Investment Recommendation
    if (sections.investment_recommendation) {
      const rec = sections.investment_recommendation;
      console.log('🎯 INVESTMENT RECOMMENDATION');
      console.log('═══════════════════════════');
      console.log(`Decision: ${rec.metadata?.recommendation || 'Pending'}`);
      console.log(`Confidence: ${rec.score}%`);
      console.log(`\nThesis Validation: ${rec.metadata?.thesisValidation || 'In Progress'}`);
      
      console.log('\n📈 Key Investment Drivers:');
      rec.keyFindings.forEach(finding => console.log(`  ✓ ${finding}`));
      
      console.log('\n⚠️  Critical Risks:');
      rec.risks.forEach(risk => console.log(`  • ${risk}`));
      
      console.log('\n💡 Value Creation Opportunities:');
      rec.opportunities.forEach(opp => console.log(`  → ${opp}`));
    }
    
    // Technology Assessment
    if (sections.technology_assessment) {
      console.log('\n🔧 TECHNOLOGY ASSESSMENT');
      console.log('══════════════════════');
      console.log(`Overall Score: ${sections.technology_assessment.score}/100`);
      console.log('\nKey Technical Findings:');
      sections.technology_assessment.keyFindings.slice(0, 5).forEach(
        finding => console.log(`  • ${finding}`)
      );
    }
    
    // Market Analysis
    if (sections.market_analysis) {
      console.log('\n📊 MARKET ANALYSIS');
      console.log('════════════════');
      const marketData = sections.market_analysis.metadata || {};
      console.log(`TAM: ${marketData.tam || 'Analyzing...'}`);
      console.log(`Market Position: ${marketData.position || 'Analyzing...'}`);
      console.log(`Growth Rate: ${marketData.growthRate || 'Analyzing...'}`);
    }
    
    // Financial Analysis
    if (sections.financial_analysis) {
      console.log('\n💰 FINANCIAL HIGHLIGHTS');
      console.log('═════════════════════');
      const metrics = sections.financial_analysis.metadata?.metrics || {};
      Object.entries(metrics).forEach(([metric, data]: [string, any]) => {
        console.log(`${metric}: ${data.value}`);
      });
    }
    
    // Risk Assessment
    if (sections.risk_assessment) {
      console.log('\n⚠️  RISK ASSESSMENT');
      console.log('════════════════');
      console.log(`Risk Score: ${sections.risk_assessment.score}/100`);
      console.log('\nTop Risks:');
      sections.risk_assessment.risks.slice(0, 5).forEach(
        risk => console.log(`  ⚠️  ${risk}`)
      );
    }
    
    // Save full report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `onezero-pe-report-${timestamp}.json`;
    
    await fs.writeFile(filename, JSON.stringify(result, null, 2));
    console.log(`\n📄 Full report saved to: ${filename}`);
    
    // Generate executive summary
    if (result.report?.content) {
      const summaryFilename = `onezero-executive-summary-${timestamp}.md`;
      await fs.writeFile(summaryFilename, result.report.content);
      console.log(`📋 Executive summary saved to: ${summaryFilename}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Research failed:', error);
    throw error;
  }
}

// Run the research
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  console.log('🚀 TechScanIQ - OneZero Financial Systems Research\n');
  console.log('Investment Context:');
  console.log('- Investor: Golden Gate Capital (lead) + Lovell Minnick Partners');
  console.log('- Thesis: Accelerate Organic Growth + Buy-and-Build overlay');
  console.log('- Founded: 2009 by Andrew Ralich (CEO) & Jesse Johnson (CTO)');
  console.log('- Scale: >$250B ADV, 12M trades/day, 150B quotes/day');
  
  runOneZeroResearch()
    .then(() => {
      console.log('\n✅ OneZero research complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export { runOneZeroResearch };