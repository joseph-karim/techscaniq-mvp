export class PerplexityClient {
  async search(query: string): Promise<any> {
    return {
      answer: '',
      citations: []
    };
  }
}