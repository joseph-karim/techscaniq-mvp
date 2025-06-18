import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: "/Users/josephkarim/techscaniq-mvp/.env.local" });

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.error("No Perplexity API key found");
    return;
  }
  
  try {
    console.log("Testing Perplexity API with sonar-deep-research model...");
    
    const response = await axios.post("https://api.perplexity.ai/chat/completions", {
      model: "sonar-deep-research",
      messages: [
        {
          role: "system",
          content: "You are a helpful research assistant. Search the web and return relevant results with citations."
        },
        {
          role: "user",
          content: `Search for: "Fidelity Investments Canada" "digital transformation"\n\nReturn the top 5 most relevant web results. For each result, provide the title, URL, and a brief summary.`
        }
      ],
      temperature: 0,
      search_domain_filter: [],
      return_images: false,
      search_recency_filter: "month",
    }, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    
    console.log("\n=== Full Response ===");
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log("\n=== Citations ===");
    if (response.data.citations) {
      console.log(`Found ${response.data.citations.length} citations`);
      response.data.citations.slice(0, 3).forEach((citation: any, index: number) => {
        console.log(`\nCitation ${index + 1}:`, JSON.stringify(citation, null, 2));
      });
    } else {
      console.log("No citations found in response");
    }
    
    console.log("\n=== Search Results ===");
    if (response.data.search_results) {
      console.log(`Found ${response.data.search_results.length} search results`);
      response.data.search_results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`\nSearch Result ${index + 1}:`, JSON.stringify(result, null, 2));
      });
    } else {
      console.log("No search_results found in response");
    }
    
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testPerplexityAPI();
