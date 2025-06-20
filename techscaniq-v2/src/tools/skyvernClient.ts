export class SkyvernClient {
  async discover(url: string): Promise<any> {
    return {
      insights: [],
      data: {}
    };
  }
  
  async discoverProducts(url: string): Promise<any[]> {
    return [];
  }
}