import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

(async () => {
  try {
    console.log('Creating report for Ring4...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/report-orchestrator-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        company: {
          name: 'Ring4',
          website: 'https://ring4.ai'
        },
        investorProfile: {
          firmName: 'TechScanIQ Demo',
          website: 'https://techscaniq.com',
          thesis: 'AI and automation technologies',
          thesisTags: ['AI', 'Automation', 'B2B'],
          primaryCriteria: 'Strong technical foundation with AI capabilities',
          secondaryCriteria: 'Market opportunity and team expertise'
        },
        analysisDepth: 'comprehensive',
        focusAreas: ['technical', 'security', 'team', 'market', 'financial']
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log('Report generated successfully!');
    console.log('Report ID:', result.reportId);
    
    // Save to file for reference
    writeFileSync('latest-report.json', JSON.stringify(result, null, 2));
    console.log('\nSaved to latest-report.json');
    
  } catch (error) {
    console.error('Error generating report:', error);
  }
})(); 