import { chromium, Browser, Page, ElementHandle } from 'playwright';
import { ChatOpenAI } from '@langchain/openai';
import { config, models } from '../config';

export interface NavigationResult {
  objective: string;
  steps: NavigationStep[];
  evidence: NavigationEvidence[];
  screenshots: Screenshot[];
  insights: string[];
  success: boolean;
}

export interface NavigationStep {
  action: string;
  target?: string;
  value?: string;
  result: string;
  timestamp: Date;
}

export interface NavigationEvidence {
  type: 'form' | 'pricing' | 'feature' | 'integration' | 'contact' | 'demo' | 'documentation';
  data: any;
  screenshot?: string;
  url: string;
}

export interface Screenshot {
  url: string;
  description: string;
  base64: string;
  timestamp: Date;
}

export interface NavigationObjective {
  type: 'explore_pricing' | 'find_demo' | 'extract_features' | 'test_calculator' | 'find_integrations' | 'explore_docs' | 'custom';
  description: string;
  targetInfo?: string[];
  maxSteps?: number;
}

export class OperatorNavigator {
  private browser?: Browser;
  private llm: ChatOpenAI;
  
  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.OPENAI_API_KEY,
      modelName: models.openai.gpt4o,
      temperature: 0.3,
    });
  }
  
  async navigate(url: string, objective: NavigationObjective): Promise<NavigationResult> {
    const result: NavigationResult = {
      objective: objective.description,
      steps: [],
      evidence: [],
      screenshots: [],
      insights: [],
      success: false,
    };
    
    try {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--disable-blink-features=AutomationControlled']
      });
      
      const context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      });
      
      const page = await context.newPage();
      
      // Navigate based on objective
      switch (objective.type) {
        case 'explore_pricing':
          await this.explorePricing(page, url, result);
          break;
        case 'find_demo':
          await this.findDemo(page, url, result);
          break;
        case 'extract_features':
          await this.extractFeatures(page, url, result);
          break;
        case 'test_calculator':
          await this.testCalculator(page, url, result);
          break;
        case 'find_integrations':
          await this.findIntegrations(page, url, result);
          break;
        case 'explore_docs':
          await this.exploreDocs(page, url, result);
          break;
        case 'custom':
          await this.customNavigation(page, url, objective, result);
          break;
      }
      
      // Generate insights from evidence
      result.insights = await this.generateInsights(result);
      result.success = result.evidence.length > 0;
      
    } catch (error) {
      console.error('Navigation error:', error);
      result.steps.push({
        action: 'error',
        result: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
    
    return result;
  }
  
  private async explorePricing(page: Page, url: string, result: NavigationResult) {
    // Navigate to main page
    await page.goto(url, { waitUntil: 'networkidle' });
    await this.takeScreenshot(page, result, 'Homepage');
    
    // Find pricing link
    const pricingLink = await this.findLink(page, ['pricing', 'plans', 'cost', 'buy', 'purchase']);
    
    if (pricingLink) {
      await this.clickAndWait(page, pricingLink, result, 'Click pricing link');
      await this.takeScreenshot(page, result, 'Pricing page');
      
      // Extract pricing data
      const pricingData = await page.evaluate(() => {
        const plans: any[] = [];
        
        // Look for pricing cards/tables
        const priceElements = document.querySelectorAll('[class*="price"], [class*="plan"], [class*="tier"]');
        
        priceElements.forEach(el => {
          const planName = el.querySelector('h2, h3, h4, [class*="title"], [class*="name"]')?.textContent?.trim();
          const price = el.querySelector('[class*="price"], [class*="cost"], [class*="amount"]')?.textContent?.trim();
          const features = Array.from(el.querySelectorAll('li, [class*="feature"]'))
            .map(f => f.textContent?.trim())
            .filter(Boolean);
          
          if (planName || price) {
            plans.push({ planName, price, features });
          }
        });
        
        return plans;
      });
      
      if (pricingData.length > 0) {
        result.evidence.push({
          type: 'pricing',
          data: pricingData,
          url: page.url(),
          screenshot: result.screenshots[result.screenshots.length - 1]?.base64,
        });
      }
      
      // Look for pricing calculator
      const calculator = await page.$('[class*="calculator"], [class*="estimate"], form[class*="price"]');
      if (calculator) {
        result.steps.push({
          action: 'found',
          target: 'pricing calculator',
          result: 'Found interactive pricing calculator',
          timestamp: new Date(),
        });
        
        // Try to interact with calculator
        await this.interactWithCalculator(page, calculator, result);
      }
    }
  }
  
  private async findDemo(page: Page, url: string, result: NavigationResult) {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Look for demo links
    const demoLink = await this.findLink(page, ['demo', 'try', 'free trial', 'get started', 'request demo']);
    
    if (demoLink) {
      await this.clickAndWait(page, demoLink, result, 'Click demo link');
      await this.takeScreenshot(page, result, 'Demo page');
      
      // Check if it's a form
      const form = await page.$('form');
      if (form) {
        // Extract form fields
        const formData = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
          return inputs.map(input => ({
            type: input.getAttribute('type') || input.tagName.toLowerCase(),
            name: input.getAttribute('name') || input.getAttribute('id'),
            required: input.hasAttribute('required'),
            placeholder: input.getAttribute('placeholder'),
          }));
        });
        
        result.evidence.push({
          type: 'demo',
          data: {
            formFields: formData,
            url: page.url(),
          },
          url: page.url(),
        });
        
        // Check for calendar/scheduling widget
        const calendar = await page.$('[class*="calendar"], [class*="schedule"], iframe[src*="calendly"], iframe[src*="hubspot"]');
        if (calendar) {
          result.steps.push({
            action: 'found',
            target: 'scheduling widget',
            result: 'Found demo scheduling widget',
            timestamp: new Date(),
          });
        }
      }
    }
  }
  
  private async extractFeatures(page: Page, url: string, result: NavigationResult) {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Look for features page
    const featuresLink = await this.findLink(page, ['features', 'products', 'solutions', 'capabilities']);
    
    if (featuresLink) {
      await this.clickAndWait(page, featuresLink, result, 'Click features link');
      await this.takeScreenshot(page, result, 'Features page');
      
      // Extract features
      const features = await page.evaluate(() => {
        const featureList: any[] = [];
        
        // Look for feature sections
        const featureSections = document.querySelectorAll('[class*="feature"], section, article');
        
        featureSections.forEach(section => {
          const title = section.querySelector('h2, h3, h4')?.textContent?.trim();
          const description = section.querySelector('p')?.textContent?.trim();
          const icon = section.querySelector('img, svg')?.getAttribute('src') || 
                       section.querySelector('svg')?.outerHTML;
          
          if (title && description) {
            featureList.push({ title, description, hasIcon: !!icon });
          }
        });
        
        return featureList;
      });
      
      if (features.length > 0) {
        result.evidence.push({
          type: 'feature',
          data: features,
          url: page.url(),
        });
      }
      
      // Look for comparison table
      const comparisonTable = await page.$('table:has(th:has-text("compare")), table:has(th:has-text("vs")), [class*="comparison"]');
      if (comparisonTable) {
        const comparison = await comparisonTable.evaluate(table => {
          const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim());
          const rows = Array.from(table.querySelectorAll('tr')).slice(1).map(row => 
            Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim())
          );
          return { headers, rows };
        });
        
        result.evidence.push({
          type: 'feature',
          data: { comparison },
          url: page.url(),
        });
      }
    }
  }
  
  private async testCalculator(page: Page, url: string, result: NavigationResult) {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Find calculator
    const calcLink = await this.findLink(page, ['calculator', 'estimate', 'roi', 'savings']);
    
    if (calcLink) {
      await this.clickAndWait(page, calcLink, result, 'Navigate to calculator');
      await this.takeScreenshot(page, result, 'Calculator page');
      
      // Find input fields
      const inputs = await page.$$('input[type="number"], input[type="text"], select');
      
      if (inputs.length > 0) {
        // Try different values
        const testCases = [
          { employees: 100, revenue: 10000000 },
          { employees: 1000, revenue: 100000000 },
          { employees: 10000, revenue: 1000000000 },
        ];
        
        for (const testCase of testCases) {
          // Fill inputs with test values
          for (let i = 0; i < inputs.length && i < 2; i++) {
            const input = inputs[i];
            const value = i === 0 ? testCase.employees : testCase.revenue;
            await input.fill(String(value));
          }
          
          // Look for calculate button
          const calcButton = await page.$('button:has-text("calculate"), button:has-text("estimate")');
          if (calcButton) {
            await calcButton.click();
            await page.waitForTimeout(1000);
          }
          
          // Extract results
          const results = await page.evaluate(() => {
            const resultElements = document.querySelectorAll('[class*="result"], [class*="total"], [class*="savings"]');
            return Array.from(resultElements).map(el => ({
              label: el.previousElementSibling?.textContent || 'Result',
              value: el.textContent,
            }));
          });
          
          if (results.length > 0) {
            result.evidence.push({
              type: 'pricing',
              data: {
                calculator: true,
                inputs: testCase,
                results,
              },
              url: page.url(),
            });
          }
        }
      }
    }
  }
  
  private async findIntegrations(page: Page, url: string, result: NavigationResult) {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Look for integrations page
    const integrationsLink = await this.findLink(page, ['integrations', 'partners', 'apps', 'connect', 'ecosystem']);
    
    if (integrationsLink) {
      await this.clickAndWait(page, integrationsLink, result, 'Navigate to integrations');
      await this.takeScreenshot(page, result, 'Integrations page');
      
      // Extract integration data
      const integrations = await page.evaluate(() => {
        const integrationList: any[] = [];
        
        // Look for integration cards/logos
        const cards = document.querySelectorAll('[class*="integration"], [class*="partner"], [class*="app-card"]');
        
        cards.forEach(card => {
          const name = card.querySelector('h3, h4, [class*="name"], [class*="title"]')?.textContent?.trim();
          const logo = card.querySelector('img')?.src;
          const description = card.querySelector('p')?.textContent?.trim();
          const link = card.querySelector('a')?.href;
          
          if (name) {
            integrationList.push({ name, logo, description, link });
          }
        });
        
        // Also check for logo grids
        if (integrationList.length === 0) {
          const logos = document.querySelectorAll('img[alt*="logo"], img[class*="partner"], img[class*="integration"]');
          logos.forEach(logo => {
            const alt = logo.getAttribute('alt') || '';
            if (alt && !alt.toLowerCase().includes('our') && !alt.toLowerCase().includes('company')) {
              integrationList.push({
                name: alt.replace(/logo/i, '').trim(),
                logo: logo.src,
              });
            }
          });
        }
        
        return integrationList;
      });
      
      if (integrations.length > 0) {
        result.evidence.push({
          type: 'integration',
          data: integrations,
          url: page.url(),
        });
      }
      
      // Check for API documentation link
      const apiLink = await this.findLink(page, ['api', 'developers', 'docs', 'documentation']);
      if (apiLink) {
        result.steps.push({
          action: 'found',
          target: 'API documentation',
          result: 'Found API/developer documentation',
          timestamp: new Date(),
        });
      }
    }
  }
  
  private async exploreDocs(page: Page, url: string, result: NavigationResult) {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Find documentation
    const docsLink = await this.findLink(page, ['documentation', 'docs', 'developers', 'api', 'resources']);
    
    if (docsLink) {
      await this.clickAndWait(page, docsLink, result, 'Navigate to documentation');
      await this.takeScreenshot(page, result, 'Documentation page');
      
      // Extract documentation structure
      const docStructure = await page.evaluate(() => {
        const sections: any[] = [];
        
        // Look for navigation/sidebar
        const nav = document.querySelector('nav, [class*="sidebar"], [class*="navigation"]');
        if (nav) {
          const links = nav.querySelectorAll('a');
          links.forEach(link => {
            sections.push({
              title: link.textContent?.trim(),
              href: link.href,
              level: link.parentElement?.tagName === 'LI' ? 1 : 0,
            });
          });
        }
        
        // Look for API endpoints
        const endpoints = Array.from(document.querySelectorAll('code:has-text("GET"), code:has-text("POST"), code:has-text("PUT"), code:has-text("DELETE")'));
        const apiEndpoints = endpoints.map(ep => ep.textContent?.trim());
        
        return { sections, apiEndpoints };
      });
      
      result.evidence.push({
        type: 'documentation',
        data: docStructure,
        url: page.url(),
      });
      
      // Look for code examples
      const codeBlocks = await page.$$('pre code, [class*="code-block"]');
      if (codeBlocks.length > 0) {
        result.steps.push({
          action: 'found',
          target: 'code examples',
          result: `Found ${codeBlocks.length} code examples`,
          timestamp: new Date(),
        });
      }
    }
  }
  
  private async customNavigation(page: Page, url: string, objective: NavigationObjective, result: NavigationResult) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await this.takeScreenshot(page, result, 'Starting page');
    
    // Use AI to determine navigation steps
    const navigationPlan = await this.planNavigation(page, objective);
    
    // Execute plan
    for (const step of navigationPlan.steps) {
      try {
        await this.executeNavigationStep(page, step, result);
      } catch (error) {
        result.steps.push({
          action: 'error',
          target: step.target,
          result: `Failed: ${error}`,
          timestamp: new Date(),
        });
      }
    }
  }
  
  // Helper methods
  private async findLink(page: Page, keywords: string[]): Promise<ElementHandle | null> {
    for (const keyword of keywords) {
      const link = await page.$(`a:has-text("${keyword}"), button:has-text("${keyword}")`);
      if (link) return link;
      
      // Case insensitive search
      const links = await page.$$('a, button');
      for (const l of links) {
        const text = await l.textContent();
        if (text && text.toLowerCase().includes(keyword.toLowerCase())) {
          return l;
        }
      }
    }
    return null;
  }
  
  private async clickAndWait(page: Page, element: ElementHandle, result: NavigationResult, description: string) {
    const url = page.url();
    await element.click();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      // Page might not fully load
    }
    
    const newUrl = page.url();
    result.steps.push({
      action: 'click',
      target: description,
      result: url !== newUrl ? `Navigated to ${newUrl}` : 'Clicked element',
      timestamp: new Date(),
    });
  }
  
  private async takeScreenshot(page: Page, result: NavigationResult, description: string) {
    const screenshot = await page.screenshot({ encoding: 'base64' });
    result.screenshots.push({
      url: page.url(),
      description,
      base64: screenshot,
      timestamp: new Date(),
    });
  }
  
  private async interactWithCalculator(page: Page, calculator: ElementHandle, result: NavigationResult) {
    // Find all inputs within calculator
    const inputs = await calculator.$$('input, select');
    
    if (inputs.length > 0) {
      // Fill with sample values
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const type = await input.getAttribute('type');
        
        if (type === 'number' || type === 'text') {
          await input.fill(String(100 * (i + 1)));
        } else if (await input.evaluate(el => el.tagName === 'SELECT')) {
          // Select middle option
          const options = await input.$$('option');
          if (options.length > 1) {
            await options[Math.floor(options.length / 2)].click();
          }
        }
      }
      
      // Find submit button
      const submitButton = await calculator.$('button[type="submit"], button:has-text("calculate")');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        // Extract results
        const results = await calculator.evaluate(calc => {
          const resultElements = calc.querySelectorAll('[class*="result"], [class*="total"], output');
          return Array.from(resultElements).map(el => el.textContent?.trim());
        });
        
        result.steps.push({
          action: 'calculate',
          result: `Calculator results: ${results.join(', ')}`,
          timestamp: new Date(),
        });
      }
    }
  }
  
  private async planNavigation(page: Page, objective: NavigationObjective): Promise<{ steps: NavigationPlanStep[] }> {
    // Use AI to analyze page and plan navigation
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        links: Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim(),
          href: a.href,
        })).slice(0, 50), // Limit to 50 links
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()),
      };
    });
    
    const prompt = `
      Given this webpage content and objective, plan navigation steps:
      
      Objective: ${objective.description}
      Target Info: ${objective.targetInfo?.join(', ') || 'None specified'}
      
      Page Title: ${pageContent.title}
      
      Available Links: ${pageContent.links.map(l => l.text).filter(Boolean).join(', ')}
      
      Available Buttons: ${pageContent.buttons.filter(Boolean).join(', ')}
      
      Plan up to ${objective.maxSteps || 5} navigation steps to achieve the objective.
      Return a JSON array of steps with: { action: "click|fill|scroll", target: "element description", value?: "for fill actions" }
    `;
    
    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content.toString();
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const steps = JSON.parse(jsonMatch[0]);
        return { steps };
      }
    } catch (error) {
      console.error('Failed to plan navigation:', error);
    }
    
    return { steps: [] };
  }
  
  private async executeNavigationStep(page: Page, step: NavigationPlanStep, result: NavigationResult) {
    switch (step.action) {
      case 'click':
        const element = await this.findElementByDescription(page, step.target);
        if (element) {
          await this.clickAndWait(page, element, result, step.target);
        }
        break;
        
      case 'fill':
        const input = await this.findElementByDescription(page, step.target);
        if (input && step.value) {
          await input.fill(step.value);
          result.steps.push({
            action: 'fill',
            target: step.target,
            value: step.value,
            result: 'Filled input',
            timestamp: new Date(),
          });
        }
        break;
        
      case 'scroll':
        await page.evaluate(() => window.scrollBy(0, 500));
        result.steps.push({
          action: 'scroll',
          result: 'Scrolled page',
          timestamp: new Date(),
        });
        break;
    }
  }
  
  private async findElementByDescription(page: Page, description: string): Promise<ElementHandle | null> {
    // Try exact match first
    let element = await page.$(`*:has-text("${description}")`);
    if (element) return element;
    
    // Try partial match
    const elements = await page.$$('a, button, input, select');
    for (const el of elements) {
      const text = await el.textContent();
      if (text && text.toLowerCase().includes(description.toLowerCase())) {
        return el;
      }
    }
    
    return null;
  }
  
  private async generateInsights(result: NavigationResult): Promise<string[]> {
    const insights: string[] = [];
    
    // Analyze evidence
    const pricingEvidence = result.evidence.filter(e => e.type === 'pricing');
    const featureEvidence = result.evidence.filter(e => e.type === 'feature');
    const integrationEvidence = result.evidence.filter(e => e.type === 'integration');
    
    if (pricingEvidence.length > 0) {
      const plans = pricingEvidence[0].data;
      if (Array.isArray(plans)) {
        insights.push(`Found ${plans.length} pricing tiers with prices ranging from ${this.extractPriceRange(plans)}`);
      }
      if (pricingEvidence.some(e => e.data.calculator)) {
        insights.push('Interactive pricing calculator available for custom estimates');
      }
    }
    
    if (featureEvidence.length > 0) {
      const features = featureEvidence.flatMap(e => e.data);
      insights.push(`Identified ${features.length} key features across ${new Set(features.map((f: any) => f.category)).size} categories`);
    }
    
    if (integrationEvidence.length > 0) {
      const integrations = integrationEvidence.flatMap(e => e.data);
      insights.push(`Supports ${integrations.length} third-party integrations`);
      
      // Categorize integrations
      const categories = this.categorizeIntegrations(integrations);
      Object.entries(categories).forEach(([cat, count]) => {
        if (count > 0) {
          insights.push(`${count} ${cat} integrations available`);
        }
      });
    }
    
    // Navigation success
    if (result.steps.filter(s => s.action === 'error').length > 0) {
      insights.push('Some navigation steps failed - manual verification recommended');
    }
    
    return insights;
  }
  
  private extractPriceRange(plans: any[]): string {
    const prices = plans
      .map(p => p.price)
      .filter(p => p && /\d/.test(p))
      .map(p => {
        const match = p.match(/[\d,]+/);
        return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
      })
      .filter(p => p > 0);
    
    if (prices.length === 0) return 'pricing not displayed';
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    return min === max ? `$${min}` : `$${min} to $${max}`;
  }
  
  private categorizeIntegrations(integrations: any[]): Record<string, number> {
    const categories = {
      'CRM': 0,
      'Analytics': 0,
      'Payment': 0,
      'Communication': 0,
      'Productivity': 0,
      'Developer': 0,
      'Other': 0,
    };
    
    const patterns = {
      'CRM': /salesforce|hubspot|pipedrive|zoho|dynamics/i,
      'Analytics': /google analytics|mixpanel|segment|amplitude|heap/i,
      'Payment': /stripe|paypal|square|braintree|authorize/i,
      'Communication': /slack|teams|discord|twilio|sendgrid/i,
      'Productivity': /google|microsoft|notion|asana|trello/i,
      'Developer': /github|gitlab|bitbucket|jira|api/i,
    };
    
    integrations.forEach(integration => {
      const name = integration.name || '';
      let categorized = false;
      
      for (const [category, pattern] of Object.entries(patterns)) {
        if (pattern.test(name)) {
          categories[category as keyof typeof categories]++;
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        categories.Other++;
      }
    });
    
    return categories;
  }
}

interface NavigationPlanStep {
  action: 'click' | 'fill' | 'scroll';
  target: string;
  value?: string;
}