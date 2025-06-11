import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xngbtpbtivygkxnsexjg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupOldReports() {
  console.log(chalk.cyan('🧹 Cleaning up old reports and test data...\n'));

  try {
    // 1. Get statistics before cleanup
    console.log(chalk.yellow('Current database statistics:'));
    
    const { count: reportCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });
      
    const { count: citationCount } = await supabase
      .from('report_citations')
      .select('*', { count: 'exact', head: true });
      
    const { count: scanCount } = await supabase
      .from('scan_requests')
      .select('*', { count: 'exact', head: true });
      
    const { count: evidenceCollectionCount } = await supabase
      .from('evidence_collections')
      .select('*', { count: 'exact', head: true });
      
    const { count: evidenceItemCount } = await supabase
      .from('evidence_items')
      .select('*', { count: 'exact', head: true });

    console.log(chalk.gray(`  Reports: ${reportCount}`));
    console.log(chalk.gray(`  Citations: ${citationCount}`));
    console.log(chalk.gray(`  Scan Requests: ${scanCount}`));
    console.log(chalk.gray(`  Evidence Collections: ${evidenceCollectionCount}`));
    console.log(chalk.gray(`  Evidence Items: ${evidenceItemCount}`));

    // 2. Identify reports to keep (last 5 successful reports)
    console.log(chalk.yellow('\nIdentifying reports to keep...'));
    
    const { data: reportsToKeep } = await supabase
      .from('reports')
      .select('id, company_name, created_at, citation_count')
      .order('created_at', { ascending: false })
      .limit(5);
      
    const keepReportIds = reportsToKeep?.map(r => r.id) || [];
    
    console.log(chalk.green(`\n✓ Keeping ${keepReportIds.length} most recent reports:`));
    reportsToKeep?.forEach(r => {
      console.log(chalk.gray(`  - ${r.company_name} (${new Date(r.created_at).toLocaleDateString()}) - ${r.citation_count} citations`));
    });

    // 3. Delete old citations
    console.log(chalk.yellow('\nDeleting old citations...'));
    
    const { error: citationError, count: deletedCitations } = await supabase
      .from('report_citations')
      .delete()
      .not('report_id', 'in', `(${keepReportIds.join(',')})`);
      
    if (citationError) {
      console.error(chalk.red('Error deleting citations:'), citationError);
    } else {
      console.log(chalk.green(`✓ Deleted ${deletedCitations || 0} old citations`));
    }

    // 4. Delete old reports
    console.log(chalk.yellow('\nDeleting old reports...'));
    
    const { error: reportError, count: deletedReports } = await supabase
      .from('reports')
      .delete()
      .not('id', 'in', `(${keepReportIds.join(',')})`);
      
    if (reportError) {
      console.error(chalk.red('Error deleting reports:'), reportError);
    } else {
      console.log(chalk.green(`✓ Deleted ${deletedReports || 0} old reports`));
    }

    // 5. Clean up orphaned scan requests (older than 7 days)
    console.log(chalk.yellow('\nCleaning up old scan requests...'));
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { error: scanError, count: deletedScans } = await supabase
      .from('scan_requests')
      .delete()
      .lt('created_at', sevenDaysAgo.toISOString())
      .in('status', ['failed', 'processing', 'pending']);
      
    if (scanError) {
      console.error(chalk.red('Error deleting scan requests:'), scanError);
    } else {
      console.log(chalk.green(`✓ Deleted ${deletedScans || 0} old/failed scan requests`));
    }

    // 6. Clean up orphaned evidence collections
    console.log(chalk.yellow('\nCleaning up orphaned evidence collections...'));
    
    // First, get scan request IDs that still exist
    const { data: existingScans } = await supabase
      .from('scan_requests')
      .select('id');
      
    const existingScanIds = existingScans?.map(s => s.id) || [];
    
    // Delete evidence items from orphaned collections
    const { data: orphanedCollections } = await supabase
      .from('evidence_collections')
      .select('id')
      .not('scan_request_id', 'in', `(${existingScanIds.join(',')})`);
      
    const orphanedCollectionIds = orphanedCollections?.map(c => c.id) || [];
    
    if (orphanedCollectionIds.length > 0) {
      const { error: evidenceItemError, count: deletedItems } = await supabase
        .from('evidence_items')
        .delete()
        .in('collection_id', orphanedCollectionIds);
        
      if (evidenceItemError) {
        console.error(chalk.red('Error deleting evidence items:'), evidenceItemError);
      } else {
        console.log(chalk.green(`✓ Deleted ${deletedItems || 0} orphaned evidence items`));
      }
      
      // Delete the collections themselves
      const { error: collectionError, count: deletedCollections } = await supabase
        .from('evidence_collections')
        .delete()
        .in('id', orphanedCollectionIds);
        
      if (collectionError) {
        console.error(chalk.red('Error deleting collections:'), collectionError);
      } else {
        console.log(chalk.green(`✓ Deleted ${deletedCollections || 0} orphaned collections`));
      }
    }

    // 7. Clean up analysis traces older than 30 days
    console.log(chalk.yellow('\nCleaning up old analysis traces...'));
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { error: traceError, count: deletedTraces } = await supabase
      .from('analysis_traces')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());
      
    if (traceError) {
      console.error(chalk.red('Error deleting traces:'), traceError);
    } else {
      console.log(chalk.green(`✓ Deleted ${deletedTraces || 0} old analysis traces`));
    }

    // 8. Get final statistics
    console.log(chalk.cyan('\nFinal database statistics:'));
    
    const { count: finalReportCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });
      
    const { count: finalCitationCount } = await supabase
      .from('report_citations')
      .select('*', { count: 'exact', head: true });
      
    const { count: finalScanCount } = await supabase
      .from('scan_requests')
      .select('*', { count: 'exact', head: true });
      
    const { count: finalEvidenceCollectionCount } = await supabase
      .from('evidence_collections')
      .select('*', { count: 'exact', head: true });
      
    const { count: finalEvidenceItemCount } = await supabase
      .from('evidence_items')
      .select('*', { count: 'exact', head: true });

    console.log(chalk.gray(`  Reports: ${reportCount} → ${finalReportCount}`));
    console.log(chalk.gray(`  Citations: ${citationCount} → ${finalCitationCount}`));
    console.log(chalk.gray(`  Scan Requests: ${scanCount} → ${finalScanCount}`));
    console.log(chalk.gray(`  Evidence Collections: ${evidenceCollectionCount} → ${finalEvidenceCollectionCount}`));
    console.log(chalk.gray(`  Evidence Items: ${evidenceItemCount} → ${finalEvidenceItemCount}`));

    console.log(chalk.green('\n✅ Cleanup complete!'));

  } catch (error) {
    console.error(chalk.red('Error during cleanup:'), error);
  }
}

// Run cleanup
cleanupOldReports();