import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findQualityReports() {
  console.log(chalk.bold.cyan('\n🔍 Searching for Quality Reports\n'));
  
  // Get all reports with good scores
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .gte('investment_score', 70)
    .gte('tech_health_score', 70)
    .order('evidence_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${reports.length} reports with good scores\n`);

  // Analyze each report
  for (const report of reports) {
    console.log(chalk.blue(`\n📊 ${report.company_name}`));
    console.log(`ID: ${report.id}`);
    console.log(`Investment Score: ${report.investment_score}`);
    console.log(`Tech Health: ${report.tech_health_score}`);
    console.log(`Evidence Count: ${report.evidence_count || 0}`);
    console.log(`Human Reviewed: ${report.human_reviewed ? 'Yes' : 'No'}`);
    
    // Check content quality
    let contentQuality = 0;
    if (report.executive_summary) {
      console.log(`Executive Summary: ${report.executive_summary.length} chars`);
      contentQuality += report.executive_summary.length > 500 ? 1 : 0;
    }
    
    if (report.report_data?.sections) {
      const sections = Array.isArray(report.report_data.sections) 
        ? report.report_data.sections 
        : Object.values(report.report_data.sections);
      
      let contentfulSections = 0;
      sections.forEach(section => {
        if (section.content && section.content.length > 100) {
          contentfulSections++;
        }
      });
      
      console.log(`Content Sections: ${contentfulSections}/${sections.length}`);
      contentQuality += contentfulSections;
    }
    
    console.log(chalk.yellow(`Content Quality Score: ${contentQuality}`));
    
    if (contentQuality >= 3 && !report.human_reviewed) {
      console.log(chalk.green('✅ Good candidate for publishing!'));
    }
  }
  
  // Find the absolute best report
  console.log(chalk.bold.magenta('\n\n🏆 BEST REPORT TO PUBLISH:\n'));
  
  const bestReport = reports
    .filter(r => !r.human_reviewed)
    .sort((a, b) => {
      // Score based on multiple factors
      const scoreA = (a.investment_score || 0) + (a.tech_health_score || 0) + (a.evidence_count || 0) * 5;
      const scoreB = (b.investment_score || 0) + (b.tech_health_score || 0) + (b.evidence_count || 0) * 5;
      return scoreB - scoreA;
    })[0];
    
  if (bestReport) {
    console.log(`Company: ${bestReport.company_name}`);
    console.log(`ID: ${bestReport.id}`);
    console.log(`URL: http://localhost:3000/reports/${bestReport.id}`);
    
    // Get evidence for this report
    const { data: evidence } = await supabase
      .from('evidence_items')
      .select('type, confidence_score')
      .eq('company_name', bestReport.company_name);
      
    if (evidence) {
      console.log(`\nEvidence Summary:`);
      const types = [...new Set(evidence.map(e => e.type))];
      types.forEach(type => {
        const count = evidence.filter(e => e.type === type).length;
        const avgConf = evidence
          .filter(e => e.type === type)
          .reduce((sum, e) => sum + (e.confidence_score || 0.7), 0) / count;
        console.log(`- ${type}: ${count} items (${Math.round(avgConf * 100)}% avg confidence)`);
      });
    }
  }
}

findQualityReports();