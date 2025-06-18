import { PlaywrightCrawler } from 'crawlee';

async function testDirectCrawl() {
  console.log('Testing direct crawl of fidelity.ca...\n');
  
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 1,
    requestHandlerTimeoutSecs: 10, // 10 second timeout
    navigationTimeoutSecs: 10, // 10 second navigation timeout
    async requestHandler({ page, request }) {
      console.log('📄 Page loaded:', request.url);
      console.log('🔄 Waiting for content...');
      
      // Don't wait for networkidle, just wait for domcontentloaded
      await page.waitForLoadState('domcontentloaded');
      
      const title = await page.title();
      console.log('📌 Title:', title);
      
      // Get some basic info quickly
      const hasReact = await page.evaluate(() => !!(window as any).React);
      const hasJQuery = await page.evaluate(() => !!(window as any).jQuery);
      
      console.log('⚛️ React detected:', hasReact);
      console.log('💲 jQuery detected:', hasJQuery);
      
      // Take a screenshot to prove we loaded
      await page.screenshot({ path: 'fidelity-test.png' });
      console.log('📸 Screenshot saved to fidelity-test.png');
    },
    failedRequestHandler({ request, error }) {
      console.error('❌ Request failed:', request.url);
      console.error('Error:', error);
    },
  });

  try {
    await crawler.run(['https://www.fidelity.ca']);
    console.log('\n✅ Crawl completed successfully!');
  } catch (error) {
    console.error('\n❌ Crawl failed:', error);
  }
}

testDirectCrawl().catch(console.error);