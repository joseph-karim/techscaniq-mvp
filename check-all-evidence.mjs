#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllEvidence() {
  console.log('=== CHECKING ALL EVIDENCE ===\n');
  
  // Get all Snowplow scans
  const { data: scans } = await supabase
    .from('scan_requests')
    .select('*')
    .ilike('company_name', '%snowplow%')
    .order('created_at', { ascending: false });

  console.log(`Found ${scans?.length || 0} Snowplow scans\n`);

  for (const scan of scans || []) {
    console.log(`\nScan ID: ${scan.id}`);
    console.log(`Status: ${scan.status}`);
    console.log(`Created: ${new Date(scan.created_at).toLocaleString()}`);
    
    // Check evidence_items
    const { data: items, error: itemsError } = await supabase
      .from('evidence_items')
      .select('id, evidence_type, source_url')
      .eq('scan_request_id', scan.id);
    
    if (itemsError) {
      console.log('Error fetching evidence_items:', itemsError.message);
    } else {
      console.log(`Evidence items: ${items?.length || 0}`);
      if (items && items.length > 0) {
        const types = items.reduce((acc, item) => {
          acc[item.evidence_type] = (acc[item.evidence_type] || 0) + 1;
          return acc;
        }, {});
        Object.entries(types).forEach(([type, count]) => {
          console.log(`  - ${type}: ${count}`);
        });
      }
    }
    
    // Check evidence_collections
    const { data: collections } = await supabase
      .from('evidence_collections')
      .select('id, created_at')
      .eq('scan_request_id', scan.id);
    
    console.log(`Evidence collections: ${collections?.length || 0}`);
    
    // Check crawl_results
    const { data: crawls } = await supabase
      .from('crawl_results')
      .select('id, url, success')
      .eq('scan_request_id', scan.id);
    
    console.log(`Crawl results: ${crawls?.length || 0}`);
    if (crawls && crawls.length > 0) {
      const successful = crawls.filter(c => c.success).length;
      console.log(`  - Successful: ${successful}/${crawls.length}`);
    }
  }
  
  // Check overall evidence stats
  console.log('\n=== OVERALL EVIDENCE STATS ===');
  
  const { count: totalItems } = await supabase
    .from('evidence_items')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalCollections } = await supabase
    .from('evidence_collections')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalCrawls } = await supabase
    .from('crawl_results')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total evidence items: ${totalItems || 0}`);
  console.log(`Total evidence collections: ${totalCollections || 0}`);
  console.log(`Total crawl results: ${totalCrawls || 0}`);
}

checkAllEvidence().catch(console.error);