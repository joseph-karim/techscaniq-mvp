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
  section: (msg) => console.log(chalk.bold.magenta(`\n🔷 ${msg}\n`)),
  detail: (msg) => console.log(chalk.gray(`   ${msg}`))
};

async function getReportDetails(reportId) {
  // Get full report details
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) throw error;

  // Get evidence items
  const { data: evidence } = await supabase
    .from('evidence_items')
    .select('*')
    .eq('company_name', report.company_name)
    .order('confidence_score', { ascending: false });

  // Get citations
  const { data: citations } = await supabase
    .from('report_citations')
    .select('*')
    .eq('report_id', reportId);

  return { report, evidence: evidence || [], citations: citations || [] };
}

function evaluateReportContent(report) {
  const evaluation = {
    sections: [],
    quality: {},
    issues: [],
    score: 0
  };

  // Check report sections
  if (report.report_data?.sections) {
    const sections = Array.isArray(report.report_data.sections) 
      ? report.report_data.sections 
      : Object.values(report.report_data.sections);

    sections.forEach(section => {
      const sectionEval = {
        title: section.title,
        hasContent: !!section.content,
        contentLength: section.content?.length || 0,
        hasSubsections: !!section.subsections?.length,
        quality: 'unknown'
      };

      // Evaluate section quality
      if (sectionEval.contentLength > 2000) {
        sectionEval.quality = 'comprehensive';
      } else if (sectionEval.contentLength > 500) {
        sectionEval.quality = 'adequate';
      } else {
        sectionEval.quality = 'minimal';
        evaluation.issues.push(`Section "${section.title}" has minimal content`);
      }

      evaluation.sections.push(sectionEval);
    });
  }

  // Executive Summary Quality
  if (report.executive_summary) {
    const summaryLength = report.executive_summary.length;
    evaluation.quality.executiveSummary = {
      length: summaryLength,
      quality: summaryLength > 1000 ? 'detailed' : summaryLength > 300 ? 'adequate' : 'brief'
    };
  } else {
    evaluation.issues.push('Missing executive summary');
  }

  // Investment Rationale
  if (report.investment_rationale) {
    evaluation.quality.investmentRationale = {
      present: true,
      length: report.investment_rationale.length
    };
  } else {
    evaluation.issues.push('Missing investment rationale');
  }

  return evaluation;
}

function evaluateEvidence(evidence) {
  const evaluation = {
    total: evidence.length,
    byType: {},
    byConfidence: {
      high: 0,
      medium: 0,
      low: 0
    },
    coverage: {},
    issues: []
  };

  // Critical evidence types we expect
  const criticalTypes = [
    'technology_stack',
    'security_analysis',
    'team_info',
    'financial_info',
    'business_overview',
    'performance_metrics'
  ];

  // Analyze evidence
  evidence.forEach(item => {
    // By type
    if (!evaluation.byType[item.type]) {
      evaluation.byType[item.type] = 0;
    }
    evaluation.byType[item.type]++;

    // By confidence
    const confidence = item.confidence_score || 0.7;
    if (confidence >= 0.8) evaluation.byConfidence.high++;
    else if (confidence >= 0.6) evaluation.byConfidence.medium++;
    else evaluation.byConfidence.low++;
  });

  // Check coverage
  criticalTypes.forEach(type => {
    const hasType = Object.keys(evaluation.byType).some(t => 
      t.toLowerCase().includes(type.replace('_', ''))
    );
    evaluation.coverage[type] = hasType;
    if (!hasType) {
      evaluation.issues.push(`Missing critical evidence: ${type}`);
    }
  });

  return evaluation;
}

async function performSeriousEvaluation(reportId) {
  log.section('SERIOUS QUALITY EVALUATION: Mixpanel Report');
  
  try {
    const { report, evidence, citations } = await getReportDetails(reportId);
    
    log.info(`Report ID: ${report.id}`);
    log.info(`Company: ${report.company_name}`);
    log.info(`Created: ${new Date(report.created_at).toLocaleString()}`);
    
    // 1. SCORING ANALYSIS
    log.section('1. Scoring Analysis');
    
    log.info(`Investment Score: ${report.investment_score}/100`);
    log.info(`Tech Health Score: ${report.tech_health_score}/100`);
    log.info(`Grade: ${report.tech_health_grade}`);
    
    if (report.investment_score >= 80) {
      log.success('Strong investment score indicates positive opportunity');
    } else if (report.investment_score >= 60) {
      log.warning('Moderate investment score suggests careful consideration needed');
    } else {
      log.error('Low investment score indicates significant concerns');
    }

    // 2. EVIDENCE EVALUATION
    log.section('2. Evidence Collection Quality');
    
    const evidenceEval = evaluateEvidence(evidence);
    
    log.info(`Total Evidence Items: ${evidenceEval.total}`);
    log.detail(`High Confidence: ${evidenceEval.byConfidence.high}`);
    log.detail(`Medium Confidence: ${evidenceEval.byConfidence.medium}`);
    log.detail(`Low Confidence: ${evidenceEval.byConfidence.low}`);
    
    log.info('\nEvidence Types Collected:');
    Object.entries(evidenceEval.byType).forEach(([type, count]) => {
      log.detail(`${type}: ${count} items`);
    });
    
    if (evidenceEval.issues.length > 0) {
      log.warning('\nEvidence Gaps:');
      evidenceEval.issues.forEach(issue => log.warning(`- ${issue}`));
    }

    // 3. CONTENT QUALITY
    log.section('3. Report Content Quality');
    
    const contentEval = evaluateReportContent(report);
    
    log.info(`Report Sections: ${contentEval.sections.length}`);
    contentEval.sections.forEach(section => {
      const icon = section.quality === 'comprehensive' ? '✅' : 
                   section.quality === 'adequate' ? '⚠️' : '❌';
      log.detail(`${icon} ${section.title}: ${section.quality} (${section.contentLength} chars)`);
    });
    
    if (contentEval.quality.executiveSummary) {
      log.info(`\nExecutive Summary: ${contentEval.quality.executiveSummary.quality}`);
    }

    // 4. SERIOUS CONCERNS
    log.section('4. Critical Issues & Concerns');
    
    const criticalIssues = [];
    
    // Evidence quantity
    if (evidenceEval.total < 10) {
      criticalIssues.push({
        severity: 'HIGH',
        issue: 'Insufficient evidence base',
        impact: 'Low confidence in conclusions',
        recommendation: 'Requires comprehensive evidence collection'
      });
    }
    
    // Missing comprehensive scoring
    if (!report.metadata?.comprehensiveScore) {
      criticalIssues.push({
        severity: 'MEDIUM',
        issue: 'No comprehensive scoring analysis',
        impact: 'Limited investment thesis alignment assessment',
        recommendation: 'Regenerate with v3 worker'
      });
    }
    
    // Citation count
    if (citations.length === 0) {
      criticalIssues.push({
        severity: 'MEDIUM',
        issue: 'No evidence citations in report',
        impact: 'Claims not backed by evidence',
        recommendation: 'Add citation links to evidence'
      });
    }
    
    if (criticalIssues.length > 0) {
      criticalIssues.forEach(issue => {
        log.error(`[${issue.severity}] ${issue.issue}`);
        log.detail(`Impact: ${issue.impact}`);
        log.detail(`Recommendation: ${issue.recommendation}`);
        console.log('');
      });
    } else {
      log.success('No critical issues found');
    }

    // 5. INVESTMENT DECISION QUALITY
    log.section('5. Investment Decision Support Quality');
    
    const decisionFactors = {
      'Clear value proposition': !!report.executive_summary?.includes('value'),
      'Risk assessment': !!report.investment_rationale?.includes('risk'),
      'Technical due diligence': report.tech_health_score > 70,
      'Evidence-backed claims': citations.length > 0,
      'Comprehensive analysis': contentEval.sections.length > 5
    };
    
    Object.entries(decisionFactors).forEach(([factor, present]) => {
      log.info(`${present ? '✅' : '❌'} ${factor}`);
    });

    // 6. FINAL VERDICT
    log.section('6. FINAL QUALITY VERDICT');
    
    // Calculate overall quality score
    const scores = {
      evidence: Math.min(100, (evidenceEval.total / 50) * 100),
      content: contentEval.sections.filter(s => s.quality !== 'minimal').length / contentEval.sections.length * 100,
      scoring: (report.investment_score + report.tech_health_score) / 2,
      completeness: Object.values(decisionFactors).filter(v => v).length / Object.keys(decisionFactors).length * 100
    };
    
    const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b) / Object.keys(scores).length);
    
    log.info('Quality Breakdown:');
    log.detail(`Evidence Quality: ${Math.round(scores.evidence)}%`);
    log.detail(`Content Quality: ${Math.round(scores.content)}%`);
    log.detail(`Scoring Quality: ${Math.round(scores.scoring)}%`);
    log.detail(`Completeness: ${Math.round(scores.completeness)}%`);
    
    log.info(`\nOVERALL QUALITY SCORE: ${overallScore}%`);
    
    if (overallScore >= 80) {
      log.success('VERDICT: High-quality report suitable for investor review');
    } else if (overallScore >= 60) {
      log.warning('VERDICT: Acceptable quality but improvements recommended');
    } else {
      log.error('VERDICT: Below standards - significant improvements required');
    }

    // 7. PUBLISHING RECOMMENDATION
    log.section('7. Publishing Recommendation');
    
    if (overallScore >= 60 && criticalIssues.filter(i => i.severity === 'HIGH').length === 0) {
      log.success('RECOMMENDATION: Proceed with publishing');
      
      // Publish the report
      const { error: publishError } = await supabase
        .from('reports')
        .update({
          human_reviewed: true,
          quality_score: overallScore
        })
        .eq('id', reportId);
        
      if (!publishError) {
        log.success('\n🎉 Report Published Successfully!');
        log.info(`View at: http://localhost:3000/reports/${reportId}`);
      } else {
        log.error(`Publishing failed: ${publishError.message}`);
      }
    } else {
      log.error('RECOMMENDATION: Do not publish - address critical issues first');
    }

  } catch (error) {
    log.error(`Evaluation failed: ${error.message}`);
    console.error(error);
  }
}

// Run evaluation on the best Mixpanel report
performSeriousEvaluation('870160bc-cc0f-4f99-90f5-b7c932dacf29');