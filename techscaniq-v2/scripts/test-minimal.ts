#!/usr/bin/env node
import { config } from 'dotenv';
import { runIntegratedResearch } from '../src/orchestrator/langgraph-integrated';

config();

async function testMinimal() {
  console.log('🚀 Testing Minimal Pipeline\n');
  
  try {
    const startTime = Date.now();
    
    // Run minimal test with timeout
    const result = await Promise.race([
      runIntegratedResearch(
        'Test Company',
        'https://example.com',
        'sales-intelligence',
        {
          salesContext: {
            offering: 'Test offering',
            focusAreas: ['test'],
          },
        }
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout after 30s')), 30000)
      )
    ]);
    
    const duration = (Date.now() - startTime) / 1000;
    
    console.log('\n✅ Pipeline completed!');
    console.log(`⏱️ Duration: ${duration.toFixed(1)}s`);
    console.log(`📊 Evidence: ${(result as any).evidence?.length || 0}`);
    console.log(`📝 Status: ${(result as any).status}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Run test
testMinimal().catch(console.error);