import { MarketContext, CompanyMarketSignals } from '../types';

export type { CompanyMarketSignals };

export class MarketContextService {
  /**
   * Detect market context from company signals and evidence
   */
  static detectMarketContext(
    company: string,
    signals: CompanyMarketSignals,
    evidence: any[]
  ): MarketContext {
    // Analyze customer size from revenue and contract value
    const targetCustomerSize = this.detectCustomerSize(signals);
    
    // Identify primary buyers from evidence
    const primaryBuyers = this.detectPrimaryBuyers(signals, evidence);
    
    // Assess technical sophistication requirements
    const technicalSophistication = this.detectTechnicalSophistication(
      signals,
      evidence,
      targetCustomerSize
    );
    
    // Build industry norms based on target market
    const industryNorms = this.buildIndustryNorms(targetCustomerSize, signals);
    
    // Identify competitive context
    const competitiveContext = this.extractCompetitiveContext(evidence);
    
    return {
      targetCustomerSize,
      primaryBuyers,
      technicalSophistication,
      industryNorms,
      competitiveContext,
    };
  }
  
  private static detectCustomerSize(signals: CompanyMarketSignals): MarketContext['targetCustomerSize'] {
    const { avgContractValue, customerRevenue, customerCount } = signals;
    
    // Calculate average revenue per customer if possible
    const avgRevPerCustomer = customerRevenue && customerCount 
      ? customerRevenue / customerCount 
      : avgContractValue;
    
    if (!avgRevPerCustomer) {
      // Default based on other signals
      return signals.targetIndustries?.includes('Fortune 500') ? 'Enterprise' : 'Mid-Market';
    }
    
    // Categorize based on typical contract values
    if (avgRevPerCustomer < 10000) return 'SMB';
    if (avgRevPerCustomer < 100000) return 'Mid-Market';
    if (avgRevPerCustomer < 1000000) return 'Enterprise';
    
    // For developer tools, check pricing model
    if (signals.pricingModel?.includes('usage-based') || 
        signals.pricingModel?.includes('freemium')) {
      return 'Developer';
    }
    
    return 'Enterprise';
  }
  
  private static detectPrimaryBuyers(
    signals: CompanyMarketSignals,
    evidence: any[]
  ): string[] {
    const buyers = new Set<string>();
    
    // Common buyer patterns by industry
    const buyerPatterns: Record<string, string[]> = {
      'financial services': ['CFOs', 'Controllers', 'Finance Directors'],
      'accounting': ['Controllers', 'Accounting Managers', 'CFOs'],
      'HR': ['CHROs', 'HR Directors', 'People Managers'],
      'IT': ['CIOs', 'IT Directors', 'CTOs'],
      'sales': ['VPs of Sales', 'Sales Operations', 'RevOps'],
      'marketing': ['CMOs', 'Marketing Directors', 'Demand Gen'],
      'developer tools': ['Developers', 'Engineering Managers', 'CTOs'],
      'security': ['CISOs', 'Security Engineers', 'Compliance Officers'],
    };
    
    // Check evidence for buyer mentions
    evidence.forEach(e => {
      const content = e.content.toLowerCase();
      Object.entries(buyerPatterns).forEach(([industry, titles]) => {
        if (content.includes(industry)) {
          titles.forEach(title => buyers.add(title));
        }
      });
    });
    
    // Default based on target industries
    if (buyers.size === 0 && signals.targetIndustries) {
      signals.targetIndustries.forEach(industry => {
        const industryLower = industry.toLowerCase();
        Object.entries(buyerPatterns).forEach(([key, titles]) => {
          if (industryLower.includes(key)) {
            titles.forEach(title => buyers.add(title));
          }
        });
      });
    }
    
    return Array.from(buyers).slice(0, 3); // Top 3 buyers
  }
  
  private static detectTechnicalSophistication(
    signals: CompanyMarketSignals,
    evidence: any[],
    customerSize: MarketContext['targetCustomerSize']
  ): MarketContext['technicalSophistication'] {
    // Check for technical indicators in evidence
    const techIndicators = {
      high: ['API', 'SDK', 'webhook', 'GraphQL', 'REST', 'integration platform'],
      medium: ['integration', 'automation', 'workflow', 'reporting'],
      low: ['easy to use', 'no code', 'simple', 'intuitive', 'user-friendly'],
    };
    
    let highCount = 0;
    let lowCount = 0;
    
    evidence.forEach(e => {
      const content = e.content.toLowerCase();
      techIndicators.high.forEach(term => {
        if (content.includes(term)) highCount++;
      });
      techIndicators.low.forEach(term => {
        if (content.includes(term)) lowCount++;
      });
    });
    
    // Default by customer size if no clear signals
    if (highCount === 0 && lowCount === 0) {
      switch (customerSize) {
        case 'Developer': return 'High';
        case 'Enterprise': return 'Medium';
        case 'SMB': return 'Low';
        default: return 'Medium';
      }
    }
    
    // Determine based on evidence
    if (highCount > lowCount * 2) return 'High';
    if (lowCount > highCount * 2) return 'Low';
    return 'Medium';
  }
  
  private static buildIndustryNorms(
    customerSize: MarketContext['targetCustomerSize'],
    signals: CompanyMarketSignals
  ): MarketContext['industryNorms'] {
    const norms: Record<MarketContext['targetCustomerSize'], MarketContext['industryNorms']> = {
      SMB: {
        typicalTechStack: ['QuickBooks', 'Excel', 'Google Workspace', 'Basic Cloud Apps'],
        commonIntegrations: ['QuickBooks', 'Bank Feeds', 'Payroll', 'Email'],
        regulatoryRequirements: ['Basic Data Security', 'PCI if payments', 'State Compliance'],
      },
      'Mid-Market': {
        typicalTechStack: ['NetSuite', 'Salesforce', 'HubSpot', 'Modern SaaS'],
        commonIntegrations: ['ERP', 'CRM', 'HRIS', 'BI Tools'],
        regulatoryRequirements: ['SOC2', 'GDPR', 'Industry-Specific'],
      },
      Enterprise: {
        typicalTechStack: ['SAP', 'Oracle', 'Workday', 'Custom Solutions'],
        commonIntegrations: ['Enterprise Systems', 'APIs', 'Data Warehouses'],
        regulatoryRequirements: ['SOC2 Type II', 'ISO 27001', 'FedRAMP', 'HIPAA'],
      },
      Developer: {
        typicalTechStack: ['GitHub', 'AWS/GCP/Azure', 'Kubernetes', 'Modern Frameworks'],
        commonIntegrations: ['CI/CD', 'Monitoring', 'Version Control', 'Cloud Services'],
        regulatoryRequirements: ['SOC2', 'Security Best Practices', 'GDPR'],
      },
      Consumer: {
        typicalTechStack: ['Mobile Apps', 'Web Apps', 'Social Platforms'],
        commonIntegrations: ['Social Login', 'Payment Processors', 'Analytics'],
        regulatoryRequirements: ['COPPA', 'CCPA', 'App Store Policies'],
      },
    };
    
    return norms[customerSize];
  }
  
  private static extractCompetitiveContext(evidence: any[]): MarketContext['competitiveContext'] {
    // Look for competitive mentions in evidence
    const competitors = new Map<string, number>();
    const marketSharePattern = /(\w+)\s+(?:has|holds|commands)\s+(\d+(?:\.\d+)?)\s*%\s*(?:market\s*share|of\s*the\s*market)/gi;
    
    evidence.forEach(e => {
      const content = e.content;
      let match;
      while ((match = marketSharePattern.exec(content)) !== null) {
        const company = match[1];
        const share = parseFloat(match[2]);
        competitors.set(company, Math.max(competitors.get(company) || 0, share));
      }
    });
    
    // Find market leader
    let marketLeader = 'Unknown';
    let marketLeaderShare = 0;
    
    competitors.forEach((share, company) => {
      if (share > marketLeaderShare) {
        marketLeader = company;
        marketLeaderShare = share;
      }
    });
    
    // Extract typical features mentioned
    const featureKeywords = [
      'automation', 'integration', 'reporting', 'analytics', 
      'workflow', 'collaboration', 'security', 'compliance',
      'mobile', 'API', 'real-time', 'AI', 'machine learning'
    ];
    
    const typicalFeatures = new Set<string>();
    evidence.forEach(e => {
      const content = e.content.toLowerCase();
      featureKeywords.forEach(feature => {
        if (content.includes(feature)) {
          typicalFeatures.add(feature);
        }
      });
    });
    
    return {
      marketLeader,
      marketLeaderShare,
      typicalFeatures: Array.from(typicalFeatures).slice(0, 5),
    };
  }
  
  /**
   * Extract market signals from evidence
   */
  static extractMarketSignals(evidence: any[]): CompanyMarketSignals {
    const signals: CompanyMarketSignals = {};
    
    // Patterns to extract key metrics
    const patterns = {
      customerCount: /(\d+(?:,\d{3})*)\s*(?:customers|clients|users|companies)/i,
      avgContractValue: /(?:ACV|average\s+contract\s+value)[\s:]+\$?(\d+(?:,\d{3})*)/i,
      retentionRate: /(?:retention|renewal)\s+rate[\s:]+(\d+(?:\.\d+)?)\s*%/i,
      customerRevenue: /(?:revenue|ARR)[\s:]+\$?(\d+(?:\.\d+)?)\s*(?:M|B|million|billion)/i,
    };
    
    evidence.forEach(e => {
      const content = e.content;
      
      // Extract customer count
      const customerMatch = patterns.customerCount.exec(content);
      if (customerMatch && !signals.customerCount) {
        signals.customerCount = parseInt(customerMatch[1].replace(/,/g, ''));
      }
      
      // Extract ACV
      const acvMatch = patterns.avgContractValue.exec(content);
      if (acvMatch && !signals.avgContractValue) {
        signals.avgContractValue = parseInt(acvMatch[1].replace(/,/g, ''));
      }
      
      // Extract retention rate
      const retentionMatch = patterns.retentionRate.exec(content);
      if (retentionMatch && !signals.retentionRate) {
        signals.retentionRate = parseFloat(retentionMatch[1]);
      }
      
      // Extract revenue (convert to actual number)
      const revenueMatch = patterns.customerRevenue.exec(content);
      if (revenueMatch && !signals.customerRevenue) {
        const value = parseFloat(revenueMatch[1]);
        const multiplier = content.toLowerCase().includes('billion') ? 1000000000 : 1000000;
        signals.customerRevenue = value * multiplier;
      }
    });
    
    return signals;
  }
}