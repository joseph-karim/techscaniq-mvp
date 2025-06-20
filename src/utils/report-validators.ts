/**
 * Report validation utilities to prevent runtime errors
 */

// Type guard to check if a value is a non-empty string
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

// Safely convert a value to lowercase
export function safeToLowerCase(value: unknown): string {
  if (isNonEmptyString(value)) {
    return value.toLowerCase();
  }
  return '';
}

// Safely get a substring
export function safeSubstring(value: unknown, start: number, end?: number): string {
  if (isNonEmptyString(value)) {
    return value.substring(start, end);
  }
  return '';
}

// Validate report sections
export function validateReportSections(sections: any[]): boolean {
  if (!Array.isArray(sections)) {
    console.warn('Report sections is not an array');
    return false;
  }
  
  let isValid = true;
  sections.forEach((section, index) => {
    if (!section.title) {
      console.warn(`Section ${index} missing title`);
      isValid = false;
    }
    if (!section.content) {
      console.warn(`Section ${index} missing content`);
      isValid = false;
    }
  });
  
  return isValid;
}

// Validate evidence items
export function validateEvidence(evidence: any[]): boolean {
  if (!Array.isArray(evidence)) {
    console.warn('Evidence is not an array');
    return false;
  }
  
  let isValid = true;
  evidence.forEach((item, index) => {
    if (!item.id) {
      console.warn(`Evidence ${index} missing id`);
      isValid = false;
    }
    if (!item.source && !item.source?.name) {
      console.warn(`Evidence ${index} missing source information`);
      isValid = false;
    }
    if (!item.content && !item.excerpt) {
      console.warn(`Evidence ${index} missing content/excerpt`);
      isValid = false;
    }
  });
  
  return isValid;
}

// Safe filter function for sections
export function filterSectionsByKeywords(
  sections: any[], 
  keywords: string[]
): any[] {
  if (!Array.isArray(sections)) return [];
  
  return sections.filter(section => {
    if (!section?.title) return false;
    
    const titleLower = safeToLowerCase(section.title);
    return keywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
  });
}

// Safe filter function for evidence
export function filterEvidenceByKeywords(
  evidence: any[], 
  keywords: string[]
): any[] {
  if (!Array.isArray(evidence)) return [];
  
  return evidence.filter(item => {
    if (!item?.content) return false;
    
    const contentLower = safeToLowerCase(item.content);
    return keywords.some(keyword => contentLower.includes(keyword.toLowerCase()));
  });
}

// Report health check
export interface ReportHealthCheck {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function checkReportHealth(report: any): ReportHealthCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check basic structure
  if (!report) {
    errors.push('Report is null or undefined');
    return { isValid: false, errors, warnings };
  }
  
  // Check required fields
  if (!report.company) errors.push('Missing company field');
  if (!report.reportType) errors.push('Missing reportType field');
  if (!report.thesis) errors.push('Missing thesis field');
  if (!report.evidence || !Array.isArray(report.evidence)) {
    errors.push('Missing or invalid evidence array');
  }
  if (!report.report) errors.push('Missing report field');
  
  // Check report sections
  if (report.report?.sections) {
    if (!validateReportSections(report.report.sections)) {
      warnings.push('Some report sections have missing fields');
    }
  } else {
    errors.push('Missing report sections');
  }
  
  // Check evidence
  if (report.evidence) {
    if (!validateEvidence(report.evidence)) {
      warnings.push('Some evidence items have missing fields');
    }
  }
  
  // Check recommendation
  if (report.report?.recommendation) {
    if (!report.report.recommendation.decision) {
      warnings.push('Recommendation missing decision');
    }
    if (typeof report.report.recommendation.confidence !== 'number') {
      warnings.push('Recommendation missing or invalid confidence score');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Logging utility for report errors
export function logReportError(
  reportId: string,
  error: Error,
  context?: Record<string, any>
): void {
  console.error('Report Error:', {
    reportId,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  });
  
  // In production, this could send to a monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service (e.g., Sentry)
  }
}