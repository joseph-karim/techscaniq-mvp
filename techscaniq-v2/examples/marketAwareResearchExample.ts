/**
 * Example: Running Market-Aware Research with TechScanIQ
 * 
 * This example demonstrates how the market context integration enhances
 * investment research by adjusting analysis based on target market.
 */

import { runMarketAwareResearch } from '../src/orchestrator/marketAwareGraph';
import { Thesis } from '../src/types';

// Example 1: Analyzing Bill.com with Market Context
async function analyzeBillcomWithMarketContext() {
  console.log('🚀 Starting market-aware analysis of Bill.com...\n');
  
  const billcomThesis: Thesis = {
    statement: 'Bill.com is well-positioned to capture the SMB financial automation market through its network effects and integration ecosystem',
    company: 'Bill.com',
    pillars: [
      {
        id: 'tech-architecture',
        name: 'Technology Architecture',
        weight: 0.15, // Lower weight for SMB market
        questions: [
          'How does the technology serve SMB needs?',
          'What integrations exist with SMB tools?',
          'Is the architecture appropriate for the market?'
        ],
      },
      {
        id: 'market-position',
        name: 'Market Position',
        weight: 0.30,
        questions: [
          'What is the market share in SMB segment?',
          'How strong are network effects?',
          'What is customer retention rate?'
        ],
      },
      {
        id: 'financial-health',
        name: 'Financial Health',
        weight: 0.35, // Higher weight for SMB market
        questions: [
          'What are the unit economics?',
          'Is the business model sustainable?',
          'What is the path to profitability?'
        ],
      },
      {
        id: 'competitive-moat',
        name: 'Competitive Moat',
        weight: 0.20,
        questions: [
          'What are switching costs for SMBs?',
          'How deep are accounting software integrations?',
          'What is the partner ecosystem strength?'
        ],
      },
    ],
    successCriteria: [
      'Customer retention above 80%',
      'Growing market share vs QuickBooks',
      'Positive unit economics',
      'Strong integration ecosystem',
    ],
    metadata: {
      sector: 'Financial Technology',
      subSector: 'SMB Financial Automation',
      investmentStage: 'Growth',
    },
  };
  
  try {
    const result = await runMarketAwareResearch(billcomThesis, {
      maxIterations: 2,
      useSonar: true, // Use Perplexity Sonar for market intelligence
    });
    
    console.log('\n📊 Market-Aware Analysis Complete!\n');
    console.log('Market Context Detected:', result.metadata?.marketContext);
    console.log('Market Signals:', result.metadata?.marketSignals);
    console.log('\nKey Market Insights:');
    result.metadata?.marketSpecificInsights?.forEach((insight: string) => {
      console.log(`  • ${insight}`);
    });
    
    // Show how technical assessment changed with market context
    const techSection = result.reportSections?.['tech_assessment'];
    if (techSection) {
      console.log('\n🔧 Market-Aware Technical Assessment:');
      console.log(`Title: ${techSection.title}`);
      console.log(`Score: ${techSection.score}/100`);
      console.log('\nKey Findings:');
      techSection.keyFindings.forEach(finding => {
        console.log(`  • ${finding}`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

// Example 2: Comparing Developer vs Enterprise Market Analysis
async function compareMarketContexts() {
  console.log('🔄 Comparing market context impact on analysis...\n');
  
  // Base thesis for a hypothetical API company
  const baseThesis = {
    statement: 'TechAPI provides best-in-class payment infrastructure',
    company: 'TechAPI',
    pillars: [
      {
        id: 'tech-architecture',
        name: 'Technology Architecture',
        weight: 0.25,
        questions: ['API quality?', 'Performance?', 'Developer experience?'],
      },
      {
        id: 'market-position',
        name: 'Market Position',
        weight: 0.25,
        questions: ['Market share?', 'Growth rate?', 'Customer segments?'],
      },
    ],
    successCriteria: ['Technical excellence', 'Market traction'],
  };
  
  // This will automatically detect different market contexts
  // based on the evidence found, showing how the same company
  // gets evaluated differently for different markets
  
  console.log('The market-aware system will:');
  console.log('1. Detect target market from evidence');
  console.log('2. Adjust evaluation criteria');
  console.log('3. Focus on market-relevant aspects');
  console.log('4. Generate contextualized recommendations');
}

// Example 3: Market-Specific Gap Detection
async function demonstrateMarketGapDetection() {
  console.log('\n🎯 Market-Specific Gap Detection Example\n');
  
  const exampleGaps = {
    SMB: [
      'QuickBooks integration quality',
      'Ease of use for non-technical users',
      'Local support availability',
      'Predictable pricing model',
    ],
    Enterprise: [
      'SOC2 Type II compliance status',
      'API rate limits and SLAs',
      'Global infrastructure presence',
      'Professional services availability',
    ],
    Developer: [
      'GitHub presence and activity',
      'SDK quality and language coverage',
      'API documentation completeness',
      'Community engagement metrics',
    ],
  };
  
  console.log('Market-aware gap detection identifies different priorities:\n');
  
  Object.entries(exampleGaps).forEach(([market, gaps]) => {
    console.log(`${market} Market Gaps:`);
    gaps.forEach(gap => console.log(`  • ${gap}`));
    console.log();
  });
}

// Run examples
if (require.main === module) {
  (async () => {
    // Run Bill.com analysis with market context
    await analyzeBillcomWithMarketContext();
    
    // Show market context comparison
    await compareMarketContexts();
    
    // Demonstrate gap detection
    await demonstrateMarketGapDetection();
    
    console.log('\n✅ Market-aware analysis examples complete!');
  })();
}

export {
  analyzeBillcomWithMarketContext,
  compareMarketContexts,
  demonstrateMarketGapDetection,
};