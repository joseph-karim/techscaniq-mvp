import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

// Load environment from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = '/Users/josephkarim/techscaniq-mvp/.env.local';
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  console.log('Testing Perplexity API...');
  console.log('API Key:', apiKey?.substring(0, 10) + '...');

  try {
    // Test with a simple query first
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar-deep-research',
      messages: [
        {
          role: 'user',
          content: 'What is OneZero Financial Systems?'
        }
      ],
      temperature: 0,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('\n✅ API Test successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('\n❌ API Test failed!');
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testPerplexityAPI();