import { GoogleGenerativeAI, DynamicRetrievalMode } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGoogleSearchRetrieval() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GOOGLE_AI_API_KEY not found in environment variables');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test configuration with proper DynamicRetrievalMode enum
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      tools: [{
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: DynamicRetrievalMode.MODE_DYNAMIC,
            dynamicThreshold: 0.3,
          }
        }
      }],
    });

    console.log('✅ Google Search Retrieval configuration successful');
    console.log('Configuration:', {
      model: 'gemini-1.5-flash',
      tool: 'googleSearchRetrieval',
      mode: 'DynamicRetrievalMode.MODE_DYNAMIC',
      threshold: 0.3
    });

    // Test a simple search query
    const prompt = 'Search for information about the latest developments in AI and machine learning in 2024.';
    console.log('\n🔍 Testing search with prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('\n📄 Response received:');
    console.log(text.substring(0, 500) + '...');
    
    // Check if grounding metadata is available
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata) {
      console.log('\n🔗 Grounding metadata found:');
      console.log('- Search queries:', groundingMetadata.webSearchQueries);
      console.log('- Number of grounding chunks:', groundingMetadata.groundingChunks?.length || 0);
      
      if (groundingMetadata.groundingChunks) {
        console.log('\n📌 Sample grounding chunks:');
        groundingMetadata.groundingChunks.slice(0, 3).forEach((chunk, index) => {
          console.log(`${index + 1}. ${chunk.web?.title || 'No title'}`);
          console.log(`   URL: ${chunk.web?.uri || 'No URL'}`);
        });
      }
    } else {
      console.log('\n⚠️  No grounding metadata found in response');
    }

  } catch (error) {
    console.error('❌ Error testing Google Search Retrieval:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the test
testGoogleSearchRetrieval();