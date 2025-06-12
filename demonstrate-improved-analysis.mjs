#!/usr/bin/env node
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Simulate the evidence that caused the generic response
const limitedEvidence = [
  {
    id: '1',
    source_url: 'https://snowplow.io/partners',
    evidence_type: 'webpage_content',
    content_data: {
      summary: 'Snowplow has technology partners and integrations to extend data stack capabilities'
    }
  }
];

// Old prompt style (that produces generic output)
const oldPrompt = `
You are a technical analyst. Analyze Snowplow's technology stack based on this evidence:
${JSON.stringify(limitedEvidence)}

Provide a comprehensive technical assessment.
`;

// New improved prompt with our section-based approach
const improvedPrompt = `
You are a Senior Technical Due Diligence Analyst at a top-tier Private Equity firm. You evaluate technology stacks with the rigor required for $100M+ acquisitions. You ONLY make claims that can be directly supported by the provided evidence chunks and cite every technical assertion with specific chunk numbers.

Analyze the provided evidence chunks to generate a structured technical assessment. Extract only explicitly mentioned technologies, architecture patterns, and technical indicators. Every claim MUST be supported by a specific evidence chunk citation.

Company: Snowplow
Website: https://snowplow.io
Investment Thesis: buy-and-scale

Evidence Available (1 item):
[1] Source: https://snowplow.io/partners
Type: webpage_content
Content: Snowplow has technology partners and integrations to extend data stack capabilities

Output Format (JSON only):
{
  "overview": "2-3 sentence overview of technical findings",
  "identifiedStack": {
    "frontend": ["List technologies found with [evidence#]"],
    "backend": ["List technologies found with [evidence#]"],
    "infrastructure": ["List technologies found with [evidence#]"]
  },
  "architectureInsights": ["Key patterns observed with evidence"],
  "technicalStrengths": ["Specific strengths with evidence"],
  "technicalConcerns": ["Specific concerns with evidence"],
  "dataGaps": ["What technical info is missing"],
  "confidenceScore": "0-100 based on evidence completeness"
}

IMPORTANT: Output ONLY valid JSON. Base all findings on provided evidence. Acknowledge what you cannot determine from the evidence.`;

async function demonstrateImprovement() {
  console.log('=== DEMONSTRATING IMPROVED ANALYSIS ===\n');
  
  console.log('1. Testing with OLD prompt style (produces generic apology)...\n');
  
  try {
    const oldResponse = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: oldPrompt }]
    });
    
    console.log('OLD STYLE OUTPUT:');
    console.log(oldResponse.content[0].text);
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('Error with old prompt:', error.message);
  }
  
  console.log('2. Testing with NEW improved prompt (acknowledges gaps properly)...\n');
  
  try {
    const newResponse = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: improvedPrompt }]
    });
    
    console.log('NEW STYLE OUTPUT:');
    const responseText = newResponse.content[0].text;
    console.log(responseText);
    
    // Try to parse and format the JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('\n=== PARSED ANALYSIS ===');
        console.log('Overview:', parsed.overview);
        console.log('Confidence Score:', parsed.confidenceScore + '%');
        console.log('Data Gaps:', parsed.dataGaps.length, 'items identified');
        console.log('- ' + parsed.dataGaps.join('\n- '));
      }
    } catch (e) {
      console.log('(Could not parse JSON response)');
    }
    
  } catch (error) {
    console.error('Error with new prompt:', error.message);
  }
  
  console.log('\n=== KEY DIFFERENCES ===');
  console.log('OLD: Apologizes and says it cannot provide analysis');
  console.log('NEW: Provides what it can determine and explicitly lists what\'s missing');
  console.log('NEW: Maintains professional tone while being transparent about limitations');
  console.log('NEW: Gives actionable next steps for data collection');
}

demonstrateImprovement().catch(console.error);