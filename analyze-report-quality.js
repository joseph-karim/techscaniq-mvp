import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeReportQuality() {
  const { data: report } = await supabase
    .from('reports')
    .select('report_data')
    .eq('id', 'a1be4b4d-f64d-4725-bf41-533da608daec')
    .single();
  
  const sections = report.report_data.sections;
  
  console.log('=== PE-GRADE REPORT QUALITY ASSESSMENT ===\n');
  
  // Check for PE-required content
  const peRequirements = {
    financial: ['revenue', 'EBITDA', 'growth rate', 'margin', 'ARR', 'CAC', 'LTV', 'burn rate', 'runway'],
    market: ['TAM', 'SAM', 'SOM', 'market share', 'competitive', 'customers', 'win rate'],
    technology: ['architecture', 'scalability', 'cloud', 'API', 'performance', 'technical debt'],
    team: ['CEO', 'CTO', 'headcount', 'retention', 'hiring', 'leadership'],
    security: ['SOC', 'ISO', 'GDPR', 'penetration test', 'incident', 'compliance']
  };
  
  let totalPresent = 0;
  let totalRequired = 0;
  
  Object.entries(peRequirements).forEach(([sectionName, keywords]) => {
    const section = sections[sectionName];
    const content = (section?.content || '').toLowerCase();
    
    console.log(`${sectionName.toUpperCase()} SECTION:`);
    const missing = keywords.filter(keyword => !content.includes(keyword.toLowerCase()));
    const present = keywords.filter(keyword => content.includes(keyword.toLowerCase()));
    
    totalPresent += present.length;
    totalRequired += keywords.length;
    
    console.log(`  Coverage: ${present.length}/${keywords.length} (${Math.round(present.length/keywords.length*100)}%)`);
    console.log(`  Present: ${present.join(', ') || 'None'}`);
    console.log(`  Missing: ${missing.join(', ')}`);
    console.log();
  });
  
  console.log('=== OVERALL PE READINESS SCORE ===');
  const overallScore = Math.round(totalPresent / totalRequired * 100);
  console.log(`Coverage: ${totalPresent}/${totalRequired} required topics (${overallScore}%)`);
  
  if (overallScore >= 80) console.log('Grade: A - PE Ready');
  else if (overallScore >= 70) console.log('Grade: B - Needs Minor Improvements');
  else if (overallScore >= 60) console.log('Grade: C - Significant Gaps');
  else if (overallScore >= 40) console.log('Grade: D - Major Overhaul Required');
  else console.log('Grade: F - Fundamentally Inadequate');
  
  // Check for specific financial metrics
  console.log('\n=== QUANTITATIVE METRICS ANALYSIS ===');
  
  const allContent = Object.values(sections).map(s => s.content).join(' ');
  
  const metrics = {
    'Revenue numbers': allContent.match(/\$[\d,.]+(M|B|K)/g) || [],
    'Percentages': allContent.match(/\d+(\.\d+)?%/g) || [],
    'Multipliers': allContent.match(/\d+(\.\d+)?x/g) || [],
    'Employee counts': allContent.match(/\d+\s+(employees|people|team)/gi) || [],
    'Years/dates': allContent.match(/(20\d{2}|\d+ years?)/g) || []
  };
  
  Object.entries(metrics).forEach(([type, values]) => {
    console.log(`${type}: ${values.length} found - ${values.slice(0,5).join(', ')}${values.length > 5 ? '...' : ''}`);
  });
  
  // Critical gaps assessment
  console.log('\n=== CRITICAL GAPS FOR $1B DECISION ===');
  
  const criticalGaps = [];
  
  if (!allContent.includes('revenue') || !allContent.match(/\$[\d,.]+(M|B)/)) {
    criticalGaps.push('❌ No revenue figures');
  }
  
  if (!allContent.includes('growth') || !allContent.match(/\d+%.*growth/i)) {
    criticalGaps.push('❌ No growth rates');
  }
  
  if (!allContent.includes('TAM') && !allContent.includes('market size')) {
    criticalGaps.push('❌ No market sizing');
  }
  
  if (!allContent.includes('competitor') || allContent.match(/competitor/gi).length < 3) {
    criticalGaps.push('❌ Insufficient competitive analysis');
  }
  
  if (!allContent.includes('architecture') && !allContent.includes('technical')) {
    criticalGaps.push('❌ No technical architecture analysis');
  }
  
  if (!allContent.includes('CEO') && !allContent.includes('founder')) {
    criticalGaps.push('❌ No leadership assessment');
  }
  
  if (criticalGaps.length > 0) {
    console.log('CRITICAL DEFICIENCIES:');
    criticalGaps.forEach(gap => console.log(`  ${gap}`));
  } else {
    console.log('✅ No critical gaps identified');
  }
  
  console.log('\n=== RECOMMENDATION ===');
  if (overallScore < 60 || criticalGaps.length > 3) {
    console.log('🚫 REPORT REJECTED - Does not meet PE standards for $1B decision');
    console.log('   Requires fundamental reconstruction before investment consideration');
  } else if (overallScore < 80 || criticalGaps.length > 1) {
    console.log('⚠️  CONDITIONAL APPROVAL - Significant improvements needed');
    console.log('   Address critical gaps before final investment committee');
  } else {
    console.log('✅ APPROVED - Meets PE standards for investment decision');
  }
  
  process.exit(0);
}

analyzeReportQuality();