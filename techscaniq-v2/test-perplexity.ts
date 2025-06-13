import axios from 'axios';

async function testPerplexitySearch() {
  try {
    console.log('Testing Perplexity API with Sonar Pro...\n');
    
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful research assistant. Search the web and return relevant results with citations.'
        },
        {
          role: 'user',
          content: `Search for: Pendo revenue growth rate ARR annual recurring revenue 2023 2024\n\nReturn the top 5 most relevant web results. For each result, provide the title, URL, and a brief summary.`
        }
      ],
      temperature: 0,
      return_citations: true,
      search_domain_filter: [],
      return_images: false,
      search_recency_filter: 'all',
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.citations) {
      console.log('\nCitations found:', response.data.citations.length);
      response.data.citations.forEach((citation: any, index: number) => {
        console.log(`\n${index + 1}. ${citation.title || 'No title'}`);
        console.log(`   URL: ${citation.url || citation.link || 'No URL'}`);
        console.log(`   Snippet: ${(citation.snippet || citation.text || 'No snippet').substring(0, 100)}...`);
      });
    }
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPerplexitySearch();