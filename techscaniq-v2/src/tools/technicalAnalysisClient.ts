export class TechnicalAnalysisClient {
  async analyze(url: string): Promise<any> {
    return {
      stack: [],
      findings: []
    };
  }
  
  async analyzeTechnology(company: string, context: any): Promise<any> {
    return {
      stack: [],
      findings: [],
      insights: []
    };
  }
}