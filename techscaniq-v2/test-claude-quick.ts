import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from '@langchain/core/messages';
import { config } from './src/config';

async function testClaude() {
  console.log('Testing Claude API...');
  console.log('Model: claude-opus-4-20250514'); // Testing Opus 4
  
  try {
    const model = new ChatAnthropic({
      apiKey: config.ANTHROPIC_API_KEY,
      modelName: 'claude-opus-4-20250514', // Testing the actual model
      temperature: 0.3,
      maxTokens: 100,
    });

    const startTime = Date.now();
    const response = await model.invoke([
      new HumanMessage('Say "Hello, I am working!" in exactly 5 words.')
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`\nResponse received in ${duration}ms:`);
    console.log(response.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

testClaude().catch(console.error);