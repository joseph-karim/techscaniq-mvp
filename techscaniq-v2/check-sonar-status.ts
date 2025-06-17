import { config as dotenvConfig } from 'dotenv';
import { sonarResearch } from './src/tools/sonarDeepResearch';

dotenvConfig();

async function checkStatus() {
  const jobId = process.argv[2] || 'f730caaf-13c2-435f-af57-d337e251dd3e';
  
  console.log(`Checking status for job: ${jobId}`);
  
  try {
    const result = await sonarResearch.getResults(jobId);
    console.log(`Status: ${result.status}`);
    
    if (result.status === 'COMPLETED') {
      console.log('\nResearch completed!');
      console.log(`Search queries: ${result.response?.usage.num_search_queries}`);
      console.log(`Reasoning tokens: ${result.response?.usage.reasoning_tokens?.toLocaleString()}`);
      console.log(`Total cost: $${sonarResearch.calculateCost(result.response?.usage).toFixed(2)}`);
      
      // Save the result
      const fs = await import('fs/promises');
      await fs.writeFile(
        'billcom-sonar-raw-result.json',
        JSON.stringify(result, null, 2)
      );
      console.log('\nRaw result saved to billcom-sonar-raw-result.json');
      
      // Show a preview of the content
      const content = result.response?.choices[0]?.message.content || '';
      console.log('\nContent preview (first 500 chars):');
      console.log(content.substring(0, 500) + '...');
    } else if (result.status === 'FAILED') {
      console.error('Research failed:', result.error_message);
    } else {
      console.log('Still processing... Try again in 30 seconds.');
    }
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

checkStatus();