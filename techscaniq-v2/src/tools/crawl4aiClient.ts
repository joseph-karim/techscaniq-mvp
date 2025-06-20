export class Crawl4AIClient {
  async analyze(url: string): Promise<any> {
    return {
      content: '',
      metadata: {}
    };
  }
  
  async crawlPages(urls: string[]): Promise<any[]> {
    return urls.map(() => ({
      content: '',
      metadata: {}
    }));
  }
}