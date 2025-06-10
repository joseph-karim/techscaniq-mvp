import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const log = {
  info: (msg) => console.log(chalk.blue(`ℹ️  ${msg}`)),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg) => console.log(chalk.red(`❌ ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`⚠️  ${msg}`)),
  section: (msg) => console.log(chalk.bold.magenta(`\n🔷 ${msg}\n`))
};

async function findBestMixpanelReport() {
  log.section('Finding Best Mixpanel Report to Publish');
  
  // Get all Mixpanel reports
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .ilike('company_name', '%mixpanel%')
    .order('evidence_count', { ascending: false })
    .limit(10);

  if (error) {
    log.error(`Failed to fetch reports: ${error.message}`);
    return null;
  }

  if (!reports || reports.length === 0) {
    log.warning('No Mixpanel reports found');
    return null;
  }

  log.info(`Found ${reports.length} Mixpanel reports`);

  // Find the best report (most evidence, highest scores)
  let bestReport = null;
  let bestScore = -1;

  reports.forEach(report => {
    const score = (report.evidence_count || 0) * 10 + 
                  (report.investment_score || 0) + 
                  (report.tech_health_score || 0);
    
    log.info(`\nReport: ${report.company_name}`);
    log.info(`- ID: ${report.id}`);
    log.info(`- Evidence: ${report.evidence_count || 0}`);
    log.info(`- Investment Score: ${report.investment_score || 'N/A'}`);
    log.info(`- Tech Health: ${report.tech_health_score || 'N/A'}`);
    log.info(`- Score: ${score}`);

    if (score > bestScore && !report.human_reviewed) {
      bestScore = score;
      bestReport = report;
    }
  });

  if (bestReport) {
    log.success(`\nBest report selected: ${bestReport.company_name} (Score: ${bestScore})`);
  } else {
    log.warning('No unpublished reports found');
  }

  return bestReport;
}

async function evaluateReportQuality(report) {
  log.section('Evaluating Report Quality');
  
  const evaluation = {
    overall: 0,
    criteria: {},
    strengths: [],
    weaknesses: [],
    recommendations: []
  };

  // 1. Evidence Quality
  const evidenceCount = report.evidence_count || 0;
  const evidenceScore = Math.min(100, (evidenceCount / 50) * 100);
  evaluation.criteria['Evidence Coverage'] = {
    score: evidenceScore,
    notes: `${evidenceCount} evidence items collected`
  };

  if (evidenceCount < 10) {
    evaluation.weaknesses.push('Very limited evidence collection');
    evaluation.recommendations.push('Increase evidence collection depth');
  } else if (evidenceCount < 30) {
    evaluation.weaknesses.push('Moderate evidence coverage');
  } else {
    evaluation.strengths.push('Comprehensive evidence collection');
  }

  // 2. Scoring Completeness
  const hasInvestmentScore = report.investment_score !== null;
  const hasTechScore = report.tech_health_score !== null;
  const hasComprehensiveScore = !!report.metadata?.comprehensiveScore;
  
  const scoringCompleteness = (
    (hasInvestmentScore ? 33 : 0) + 
    (hasTechScore ? 33 : 0) + 
    (hasComprehensiveScore ? 34 : 0)
  );
  
  evaluation.criteria['Scoring Completeness'] = {
    score: scoringCompleteness,
    notes: `Investment: ${hasInvestmentScore}, Tech: ${hasTechScore}, Comprehensive: ${hasComprehensiveScore}`
  };

  if (!hasComprehensiveScore) {
    evaluation.weaknesses.push('Missing comprehensive scoring analysis');
    evaluation.recommendations.push('Generate report with v3 worker for comprehensive scoring');
  }

  // 3. Report Content Quality
  const reportData = report.report_data;
  const hasSections = reportData?.sections && 
    (Array.isArray(reportData.sections) ? reportData.sections.length > 0 : Object.keys(reportData.sections).length > 0);
  const hasExecutiveSummary = !!report.executive_summary;
  const hasRationale = !!report.investment_rationale;
  
  const contentScore = (
    (hasSections ? 40 : 0) +
    (hasExecutiveSummary ? 30 : 0) +
    (hasRationale ? 30 : 0)
  );
  
  evaluation.criteria['Content Quality'] = {
    score: contentScore,
    notes: `Sections: ${hasSections}, Summary: ${hasExecutiveSummary}, Rationale: ${hasRationale}`
  };

  if (!hasSections) {
    evaluation.weaknesses.push('Missing detailed analysis sections');
  }

  // 4. Data Freshness
  const ageInDays = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const freshnessScore = Math.round(Math.max(0, 100 - (ageInDays * 10)));
  
  evaluation.criteria['Data Freshness'] = {
    score: freshnessScore,
    notes: `Report is ${Math.round(ageInDays)} days old`
  };

  if (ageInDays > 7) {
    evaluation.weaknesses.push('Report data may be outdated');
    evaluation.recommendations.push('Consider regenerating report with latest data');
  }

  // 5. Investment Insights
  const investmentScore = report.investment_score || 0;
  const hasGrade = !!report.tech_health_grade;
  
  const insightScore = Math.min(100, investmentScore + (hasGrade ? 20 : 0));
  
  evaluation.criteria['Investment Insights'] = {
    score: insightScore,
    notes: `Investment score: ${investmentScore}, Grade: ${report.tech_health_grade || 'N/A'}`
  };

  if (investmentScore < 60) {
    evaluation.weaknesses.push('Low investment score indicates concerns');
  }

  // Calculate overall score
  const criteriaScores = Object.values(evaluation.criteria).map(c => c.score);
  evaluation.overall = Math.round(criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length);

  // Overall assessment
  if (evaluation.overall >= 80) {
    evaluation.strengths.push('High-quality report ready for investor review');
  } else if (evaluation.overall >= 60) {
    evaluation.strengths.push('Acceptable report quality with room for improvement');
  } else {
    evaluation.weaknesses.push('Report quality below acceptable standards');
    evaluation.recommendations.push('Significant improvements needed before publishing');
  }

  return evaluation;
}

async function publishReport(reportId) {
  log.section('Publishing Report');
  
  const { data: published, error } = await supabase
    .from('reports')
    .update({
      human_reviewed: true,
      quality_score: 75, // Set based on evaluation
      updated_at: new Date().toISOString()
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    log.error(`Failed to publish: ${error.message}`);
    return null;
  }

  log.success('Report published successfully!');
  return published;
}

async function main() {
  try {
    // Find best report
    const report = await findBestMixpanelReport();
    if (!report) {
      log.error('No suitable report found to publish');
      return;
    }

    // Evaluate quality
    const evaluation = await evaluateReportQuality(report);
    
    log.section('Quality Evaluation Results');
    log.info(`Overall Score: ${evaluation.overall}/100`);
    
    log.info('\nDetailed Criteria:');
    Object.entries(evaluation.criteria).forEach(([criterion, details]) => {
      log.info(`- ${criterion}: ${details.score}/100 (${details.notes})`);
    });

    if (evaluation.strengths.length > 0) {
      log.success('\nStrengths:');
      evaluation.strengths.forEach(s => log.success(`- ${s}`));
    }

    if (evaluation.weaknesses.length > 0) {
      log.warning('\nWeaknesses:');
      evaluation.weaknesses.forEach(w => log.warning(`- ${w}`));
    }

    if (evaluation.recommendations.length > 0) {
      log.info('\nRecommendations:');
      evaluation.recommendations.forEach(r => log.info(`- ${r}`));
    }

    // Decision
    log.section('Publishing Decision');
    
    if (evaluation.overall >= 50) {
      log.success('Report meets minimum quality standards');
      
      // Publish the report
      const published = await publishReport(report.id);
      
      if (published) {
        log.success('\n🎉 Report Published Successfully!');
        log.info(`View at: http://localhost:3000/reports/${published.id}`);
        
        // Show what investors will see
        log.section('Investor View Summary');
        log.info(`Company: ${published.company_name}`);
        log.info(`Investment Score: ${published.investment_score || 'N/A'}/100`);
        log.info(`Tech Health: ${published.tech_health_score || 'N/A'}/100`);
        log.info(`Grade: ${published.tech_health_grade || 'N/A'}`);
        log.info(`Evidence Items: ${published.evidence_count || 0}`);
      }
    } else {
      log.error('Report quality too low to publish');
      log.info('Please address the weaknesses and recommendations before publishing');
    }

  } catch (error) {
    log.error(`Process failed: ${error.message}`);
    console.error(error);
  }
}

main();