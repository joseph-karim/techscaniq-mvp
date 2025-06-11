import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUnifiedReportGeneration() {
  console.log('Testing Unified Report Generation with Citations...\n');

  try {
    // 1. Find a recent scan with evidence collection
    const { data: recentScans, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);

    if (scanError) throw scanError;

    console.log(`Found ${recentScans?.length || 0} completed scans`);

    // Find a scan with evidence
    let scanWithEvidence = null;
    let evidenceCollection = null;

    for (const scan of recentScans || []) {
      const { data: collections } = await supabase
        .from('evidence_collections')
        .select('*')
        .eq('scan_request_id', scan.id)
        .single();

      if (collections) {
        const { data: items } = await supabase
          .from('evidence_items')
          .select('*')
          .eq('collection_id', collections.id)
          .limit(1);

        if (items && items.length > 0) {
          scanWithEvidence = scan;
          evidenceCollection = collections;
          break;
        }
      }
    }

    if (!scanWithEvidence || !evidenceCollection) {
      console.log('No scan with evidence found. Creating test data...');
      
      // Create test scan request
      const { data: testScan } = await supabase
        .from('scan_requests')
        .insert({
          company_name: 'Snowplow Analytics',
          company_url: 'https://snowplow.io',
          scan_type: 'deep_scan',
          investment_thesis: 'Modern data infrastructure platform',
          thesis_tags: ['data_infrastructure', 'analytics', 'real_time'],
          status: 'completed'
        })
        .select()
        .single();

      // Create evidence collection
      const { data: testCollection } = await supabase
        .from('evidence_collections')
        .insert({
          scan_request_id: testScan.id,
          company_name: 'Snowplow Analytics',
          collection_type: 'unified_deep_research',
          status: 'completed',
          total_evidence: 20
        })
        .select()
        .single();

      // Create sample evidence items
      const evidenceItems = [
        {
          collection_id: testCollection.id,
          type: 'github_analysis',
          category: 'technical',
          title: 'Active GitHub Repository',
          summary: 'Snowplow has 52 contributors, 2.3k commits, and active development',
          content: 'Repository shows consistent commit activity with multiple contributors...',
          url: 'https://github.com/snowplow/snowplow',
          confidence_score: 0.95
        },
        {
          collection_id: testCollection.id,
          type: 'technology_detection',
          category: 'technical',
          title: 'Modern Tech Stack',
          summary: 'Uses Scala, Kafka, AWS Kinesis for real-time data processing',
          content: 'Technology stack includes modern streaming technologies...',
          confidence_score: 0.90
        },
        {
          collection_id: testCollection.id,
          type: 'team_analysis',
          category: 'team',
          title: 'Engineering Team Size',
          summary: '187 employees with 45% in engineering roles',
          content: 'LinkedIn data shows strong engineering focus...',
          url: 'https://linkedin.com/company/snowplow',
          confidence_score: 0.85
        },
        {
          collection_id: testCollection.id,
          type: 'security_scan',
          category: 'security',
          title: 'SOC 2 Compliance',
          summary: 'SOC 2 Type II certified with annual audits',
          content: 'Security compliance documentation found...',
          confidence_score: 0.92
        },
        {
          collection_id: testCollection.id,
          type: 'infrastructure_analysis',
          category: 'infrastructure',
          title: 'Multi-Region Deployment',
          summary: 'Deployed across AWS us-east-1, eu-west-1 with 99.99% uptime',
          content: 'Infrastructure analysis shows robust deployment...',
          confidence_score: 0.88
        }
      ];

      await supabase
        .from('evidence_items')
        .insert(evidenceItems);

      scanWithEvidence = testScan;
      evidenceCollection = testCollection;
    }

    console.log(`\nUsing scan: ${scanWithEvidence.company_name}`);
    console.log(`Evidence collection ID: ${evidenceCollection.id}`);

    // 2. Load the unified report generator
    console.log('\nTesting report generation with citations...');

    // Import and test the generator
    const { generateUnifiedReport } = await import('./src/workers/report-generation-worker-unified.ts');

    const reportId = await generateUnifiedReport(
      scanWithEvidence.id,
      scanWithEvidence.company_name,
      scanWithEvidence.investment_thesis || 'General technology assessment',
      evidenceCollection.id
    );

    console.log(`\nReport generated with ID: ${reportId}`);

    // 3. Verify the report and citations
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    console.log('\nReport details:');
    console.log(`- Type: ${report.report_type}`);
    console.log(`- Status: ${report.status}`);
    console.log(`- Sections: ${Object.keys(report.content.sections).length}`);
    console.log(`- Total citations: ${report.content.metadata.total_citations}`);
    console.log(`- Evidence used: ${report.content.metadata.total_evidence_used}`);

    // Check citations
    const { data: citations } = await supabase
      .from('report_citations')
      .select('*')
      .eq('report_id', reportId)
      .order('citation_number');

    console.log(`\nCitations in database: ${citations?.length || 0}`);

    if (citations && citations.length > 0) {
      console.log('\nSample citations:');
      citations.slice(0, 5).forEach(c => {
        console.log(`  [${c.citation_number}] ${c.citation_text} (${c.section})`);
      });
    }

    // 4. Check if citations are embedded in content
    const executiveSummary = report.content.sections.executive_summary;
    const citationPattern = /\[\d+\]\(#cite-\d+\)/g;
    const embeddedCitations = executiveSummary.match(citationPattern);

    console.log(`\nEmbedded citations in executive summary: ${embeddedCitations?.length || 0}`);
    if (embeddedCitations) {
      console.log('Sample embedded citations:', embeddedCitations.slice(0, 3));
    }

    // 5. Validate scoring
    const scoring = report.content.comprehensive_scoring;
    console.log('\nComprehensive Scoring:');
    console.log(`- Overall: ${scoring.overall_score}/100`);
    console.log(`- Technology: ${scoring.sub_scores.technology_sophistication}/100`);
    console.log(`- Team Quality: ${scoring.sub_scores.team_quality}/100`);
    console.log(`- Confidence Level: ${scoring.confidence_level}`);
    console.log(`- Citation Density: ${scoring.evidence_quality.citation_density.toFixed(2)} per section`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testUnifiedReportGeneration();