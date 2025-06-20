export class PublicDataClient {
  async fetch(query: string): Promise<any> {
    return {
      data: [],
      sources: []
    };
  }
  
  async fetchCompanyData(company: string): Promise<any> {
    return {
      data: {},
      sources: []
    };
  }
}