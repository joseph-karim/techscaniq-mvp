const fs = require('fs');
const path = require('path');

// Read the most recent CIBC report
const reportPath = './techscaniq-v2/data/integrated-results/cibc-adobe-integrated-2025-06-20T03-35-47-463Z.json';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Generate a UUID for the report
const reportId = '9f8e7d6c-5b4a-3210-fedc-ba9876543210';

// Transform to LangGraph format
const langGraphReport = {
  reportId,
  company: report.thesis.company,
  website: report.thesis.website || report.thesis.companyWebsite,
  reportType: 'sales-intelligence',
  status: 'completed',
  createdAt: new Date(report.thesis.createdAt),
  completedAt: new Date(),
  thesis: report.thesis,
  evidence: report.evidence || [],
  report: {
    executiveSummary: report.reportSections?.executive_summary?.content || report.report?.executiveSummary,
    sections: report.reportSections ? Object.values(report.reportSections).map(section => ({
      title: section.title,
      content: section.content,
      confidence: section.metadata?.confidence,
      citations: section.metadata?.citations
    })) : [],
    technicalAssessment: report.reportSections?.technical_assessment?.metadata || report.technicalAssessment,
    recommendation: report.reportSections?.recommendation?.metadata || report.recommendation
  },
  metadata: {
    evidenceCount: report.evidence?.length || 0,
    averageQualityScore: report.qualityScores ? 
      Object.values(report.qualityScores).reduce((a, b) => a + b, 0) / Object.values(report.qualityScores).length : 0,
    vendorContext: {
      vendor: 'Adobe',
      products: ['Adobe Experience Cloud', 'Real-Time CDP', 'Journey Optimizer']
    }
  }
};

// Save the converted report
const outputPath = `./techscaniq-v2/data/langgraph-reports`;
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

fs.writeFileSync(
  path.join(outputPath, `${reportId}.json`),
  JSON.stringify(langGraphReport, null, 2)
);

console.log(`Report converted and saved with ID: ${reportId}`);
console.log(`View the report at: https://scan.techscaniq.com/admin/langgraph-report/${reportId}`);