import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseUrl || !supabaseAnonKey || !jwtSecret) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createRing4Scan() {
  try {
    console.log('Creating scan request for Ring4.ai...');
    
    // Create JWT token for authenticated request
    const token = jwt.sign(
      {
        role: 'authenticated',
        aud: 'authenticated',
        iss: supabaseUrl,
        sub: 'system-user',
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      },
      jwtSecret
    );

    // Create an authenticated client
    const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // First create the scan request
    const { data: scanRequest, error: scanError } = await authenticatedClient
      .from('scan_requests')
      .insert({
        company_name: 'Ring4',
        website_url: 'https://ring4.ai',
        status: 'pending',
        requestor_name: 'System Admin',
        organization_name: 'TechScanIQ',
        requested_by: null // System generated, no user ID
      })
      .select()
      .single();

    if (scanError) {
      console.error('Error creating scan request:', scanError);
      return;
    }

    console.log('Scan request created:', scanRequest.id);

    // Now trigger the report generation using the orchestrator
    const response = await fetch(`${supabaseUrl}/functions/v1/report-orchestrator-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        company: {
          name: 'Ring4',
          website: 'https://ring4.ai'
        },
        analysisDepth: 'comprehensive',
        scan_request_id: scanRequest.id
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Error generating report:', result.error);
      return;
    }

    console.log('Report generation started');
    console.log('Report ID:', result.report?.id);
    console.log('Evidence Collection ID:', result.evidenceData?.collection_id);
    
    // Check if report was stored
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', result.report?.id)
      .single();
      
    if (reportError) {
      console.error('Error fetching report:', reportError);
    } else {
      console.log('\nReport stored successfully!');
      console.log('Report URL:', `http://localhost:5173/reports/${report.id}`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

createRing4Scan(); 