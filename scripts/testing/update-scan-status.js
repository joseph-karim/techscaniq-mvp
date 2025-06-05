import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';

async function updateScanStatus() {
  try {
    // Use the latest scan request
    const scanRequestId = '41b957c4-622c-445f-bf18-5109779a9fb1';
    
    console.log(`Updating scan request ${scanRequestId} to processing...`);
    
    // Create JWT token
    const token = jwt.sign(
      {
        role: 'service_role',
        aud: 'authenticated',
        iss: supabaseUrl,
        sub: 'system-user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      },
      jwtSecret,
      { algorithm: 'HS256' }
    );

    // Create authenticated client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Update status to processing
    const { data, error } = await supabase
      .from('scan_requests')
      .update({ status: 'processing' })
      .eq('id', scanRequestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating scan request:', error);
      return;
    }

    console.log('Scan request updated successfully:', data);
    
    // Now trigger report generation with a simpler approach
    // We'll call the orchestrator with the scan_request_id
    console.log('\nTriggering report generation with local auth bypass...');
    
    // For local dev, we can use a simple approach
    const response = await fetch(`${supabaseUrl}/functions/v1/report-orchestrator-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        // Pass the Google API key via a custom header for local dev
        'x-google-api-key': process.env.GOOGLE_API_KEY || 'your-google-api-key'
      },
      body: JSON.stringify({
        scan_request_id: scanRequestId,
        // Add this flag to skip certain validations in local dev
        _localDev: true
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Report generation failed:', result);
      return;
    }

    console.log('Report generation completed:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

updateScanStatus(); 