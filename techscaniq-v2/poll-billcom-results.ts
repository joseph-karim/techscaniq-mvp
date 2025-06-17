import { config as dotenvConfig } from 'dotenv';
import { sonarResearch } from './src/tools/sonarDeepResearch';

dotenvConfig();

async function pollResults() {
  const jobId = 'f730caaf-13c2-435f-af57-d337e251dd3e';
  const startTime = Date.now();
  let attempts = 0;
  
  console.log(`📊 Polling for Bill.com research results (Job: ${jobId})\n`);
  
  while (true) {
    attempts++;
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    try {
      const result = await sonarResearch.getResults(jobId);
      console.log(`[Attempt ${attempts}, ${elapsed}s elapsed] Status: ${result.status}`);
      
      if (result.status === 'COMPLETED') {
        console.log('\n✅ Research completed!');
        
        // Display results
        const usage = result.response?.usage;
        console.log(`\n📈 Usage Statistics:`);
        console.log(`   Search queries executed: ${usage?.num_search_queries}`);
        console.log(`   Reasoning tokens: ${usage?.reasoning_tokens?.toLocaleString()}`);
        console.log(`   Total tokens: ${usage?.total_tokens?.toLocaleString()}`);
        console.log(`   Citations: ${result.response?.citations.length}`);
        
        // Calculate cost
        const cost = sonarResearch.calculateCost(usage);
        console.log(`   Total cost: $${cost.toFixed(2)}`);
        
        // Parse evidence
        console.log('\n🔄 Parsing evidence...');
        const evidence = sonarResearch.parseToEvidence(result);
        console.log(`   Evidence items created: ${evidence.length}`);
        
        // Extract insights
        const insights = sonarResearch.extractInsights(result);
        console.log('\n💡 Market Insights:');
        console.log(`   TAM: ${insights?.tam.size || 'Not found'}`);
        console.log(`   Growth: ${insights?.tam.growth || 'Not found'}`);
        console.log(`   Competitors: ${insights?.competitors.slice(0, 5).map(c => c.name).join(', ')}`);
        console.log(`   Revenue: ${insights?.financials.revenue || 'Not found'}`);
        
        // Get full content
        const content = result.response?.choices[0]?.message.content || '';
        
        // Extract Bill.com specific metrics
        console.log('\n📊 Bill.com Specific Findings:');
        
        // Revenue
        const revenueMatches = content.match(/revenue.*?\$[\d.]+\s*[BMK](?:illion)?/gi);
        if (revenueMatches) {
          console.log('\n💰 Revenue Information:');
          revenueMatches.slice(0, 3).forEach(match => console.log(`   - ${match}`));
        }
        
        // Growth
        const growthMatches = content.match(/grow(?:th|ing|n)?.*?(\d+%)/gi);
        if (growthMatches) {
          console.log('\n📈 Growth Metrics:');
          growthMatches.slice(0, 3).forEach(match => console.log(`   - ${match}`));
        }
        
        // Customers
        const customerMatches = content.match(/(\d+[,\d]*)\s*(?:customers?|businesses|SMBs|members)/gi);
        if (customerMatches) {
          console.log('\n👥 Customer Base:');
          customerMatches.slice(0, 3).forEach(match => console.log(`   - ${match}`));
        }
        
        // Payment volume
        const paymentMatches = content.match(/(?:payment|transaction)\s*volume.*?\$[\d.]+\s*[BMK](?:illion)?/gi);
        if (paymentMatches) {
          console.log('\n💳 Payment Volume:');
          paymentMatches.forEach(match => console.log(`   - ${match}`));
        }
        
        // Acquisitions
        const acquisitionMatches = content.match(/acqui(?:red|sition).*?(?:Divvy|Invoice2go|Finmark)[^.]*\./gi);
        if (acquisitionMatches) {
          console.log('\n🤝 Recent Acquisitions:');
          acquisitionMatches.forEach(match => console.log(`   - ${match.trim()}`));
        }
        
        // AI/ML mentions
        const aiMatches = content.match(/(?:AI|artificial intelligence|machine learning|ML)[^.]*\./gi);
        if (aiMatches) {
          console.log('\n🤖 AI/ML Capabilities:');
          aiMatches.slice(0, 3).forEach(match => console.log(`   - ${match.trim()}`));
        }
        
        // Save everything
        const fs = await import('fs/promises');
        
        // Save raw result
        await fs.writeFile(
          'billcom-raw-result.json',
          JSON.stringify(result, null, 2)
        );
        
        // Save parsed data
        const parsedData = {
          jobId,
          company: 'Bill.com',
          completedAt: new Date().toISOString(),
          duration: `${elapsed} seconds`,
          cost: cost.toFixed(2),
          usage,
          insights,
          evidenceCount: evidence.length,
          keyMetrics: {
            revenue: revenueMatches?.[0],
            growth: growthMatches?.[0],
            customers: customerMatches?.[0],
            paymentVolume: paymentMatches?.[0],
          },
          sampleEvidence: evidence.slice(0, 10),
        };
        
        await fs.writeFile(
          'billcom-parsed-results.json',
          JSON.stringify(parsedData, null, 2)
        );
        
        // Save first 10K chars of content for review
        await fs.writeFile(
          'billcom-content-preview.txt',
          content.substring(0, 10000)
        );
        
        console.log('\n📁 Files saved:');
        console.log('   - billcom-raw-result.json (complete API response)');
        console.log('   - billcom-parsed-results.json (structured data)');
        console.log('   - billcom-content-preview.txt (content preview)');
        
        console.log('\n✨ Analysis complete! Bill.com research gathered successfully.');
        break;
        
      } else if (result.status === 'FAILED') {
        console.error('\n❌ Research failed:', result.error_message);
        break;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds
      
    } catch (error) {
      console.error(`\n❌ Error polling: ${error}`);
      break;
    }
    
    // Safety timeout after 15 minutes
    if (elapsed > 900) {
      console.error('\n⏱️ Timeout: Research taking too long (>15 minutes)');
      break;
    }
  }
}

pollResults().catch(console.error);