import { config } from 'dotenv';
import { runIntegratedResearch } from '../src/orchestrator/langgraph-integrated';

config();

async function testIntegratedPipeline() {
  console.log('🚀 Testing Integrated LangGraph Pipeline for Fidelity Canada\n');
  
  try {
    // Test with Fidelity Canada
    const result = await runIntegratedResearch(
      'Fidelity Canada',
      'https://www.fidelity.ca',
      'sales-intelligence',
      {
        salesContext: {
          offering: 'Interad digital transformation services',
          focusAreas: ['accessibility', 'performance', 'mobile experience'],
        },
      }
    );
    
    console.log('\n✅ Pipeline completed successfully!');
    console.log(`📊 Evidence collected: ${result.evidence?.length || 0}`);
    console.log(`📝 Status: ${result.status}`);
    
    // Display some evidence samples
    if (result.evidence && result.evidence.length > 0) {
      console.log('\n📋 Evidence Samples:');
      result.evidence.slice(0, 3).forEach((ev, idx) => {
        console.log(`\n${idx + 1}. ${ev.source.name}`);
        console.log(`   Type: ${ev.source.type}`);
        console.log(`   Quality: ${ev.qualityScore?.overall || 'N/A'}`);
        
        // Show brief content preview
        const preview = ev.content.substring(0, 200) + '...';
        console.log(`   Preview: ${preview}`);
      });
    }
    
    // Display report sections if available
    if (result.reportSections && Object.keys(result.reportSections).length > 0) {
      console.log('\n📄 Report Sections:');
      Object.keys(result.reportSections).forEach(section => {
        console.log(`   - ${section}`);
      });
    }
    
    // Show tools used
    if (result.metadata?.toolsUsed) {
      console.log('\n🛠️ Tools Used:');
      result.metadata.toolsUsed.forEach(tool => {
        console.log(`   - ${tool}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    console.error(error.stack);
  }
}

// Run the test
testIntegratedPipeline().catch(console.error);