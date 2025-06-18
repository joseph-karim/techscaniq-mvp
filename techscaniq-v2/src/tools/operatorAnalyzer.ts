import { Browser, Page, chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';

interface OperatorTask {
  id: string;
  type: 'navigation' | 'interaction' | 'extraction' | 'validation';
  description: string;
  steps: OperatorStep[];
  results: any;
}

interface OperatorStep {
  action: string;
  selector?: string;
  value?: string;
  wait?: number;
  screenshot?: boolean;
}

interface InteractionResult {
  success: boolean;
  data: any;
  screenshots: string[];
  logs: string[];
  errors: string[];
}

export class OperatorAnalyzer {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logs: string[] = [];

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false, // Can be toggled for debugging
      args: ['--disable-blink-features=AutomationControlled'],
    });
  }

  async analyzeUserFlow(
    url: string,
    flowDescription: string
  ): Promise<InteractionResult> {
    console.log(`🤖 Analyzing user flow: ${flowDescription}`);
    
    try {
      if (!this.browser) await this.initialize();
      
      const context = await this.browser!.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      });

      this.page = await context.newPage();
      const screenshots: string[] = [];
      const errors: string[] = [];

      // Set up console and error logging
      this.page.on('console', msg => this.logs.push(`[Console] ${msg.type()}: ${msg.text()}`));
      this.page.on('pageerror', err => errors.push(`[Page Error] ${err.message}`));

      // Navigate to the URL
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Analyze the flow based on description
      const tasks = this.parseFlowDescription(flowDescription);
      const results: any = {};

      for (const task of tasks) {
        try {
          const taskResult = await this.executeTask(task);
          results[task.id] = taskResult;
          
          if (task.steps.some(s => s.screenshot)) {
            const screenshotPath = `/tmp/operator_${task.id}_${Date.now()}.png`;
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            screenshots.push(screenshotPath);
          }
        } catch (error) {
          errors.push(`Task ${task.id} failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      await context.close();

      return {
        success: errors.length === 0,
        data: results,
        screenshots,
        logs: this.logs,
        errors,
      };
    } catch (error) {
      console.error('Operator analysis error:', error);
      throw error;
    }
  }

  async testAuthentication(
    url: string,
    credentials?: { username: string; password: string }
  ): Promise<{
    hasAuth: boolean;
    authType: string;
    authFlow: string[];
    requiresMFA: boolean;
    ssoProviders: string[];
  }> {
    if (!this.browser) await this.initialize();
    
    const context = await this.browser!.newContext();
    this.page = await context.newPage();

    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Look for authentication indicators
      const authIndicators = await this.page.evaluate(() => {
        const indicators = {
          hasLoginForm: !!document.querySelector('form[action*="login"], form[action*="signin"]'),
          hasPasswordField: !!document.querySelector('input[type="password"]'),
          hasOAuthButtons: !!document.querySelector('[href*="oauth"], [href*="auth0"], [href*="okta"]'),
          hasSSOOptions: [] as string[],
          authEndpoints: [] as string[],
        };

        // Check for SSO providers
        const ssoButtons = document.querySelectorAll('button, a');
        ssoButtons.forEach(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('google') || btn.outerHTML.includes('google')) {
            indicators.hasSSOOptions.push('Google');
          }
          if (text.includes('microsoft') || text.includes('azure')) {
            indicators.hasSSOOptions.push('Microsoft');
          }
          if (text.includes('github')) {
            indicators.hasSSOOptions.push('GitHub');
          }
          if (text.includes('saml')) {
            indicators.hasSSOOptions.push('SAML');
          }
        });

        // Check for auth endpoints in forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
          const action = form.getAttribute('action');
          if (action && (action.includes('auth') || action.includes('login'))) {
            indicators.authEndpoints.push(action);
          }
        });

        return indicators;
      });

      // If credentials provided, attempt login
      let authFlow: string[] = [];
      if (credentials && authIndicators.hasLoginForm) {
        authFlow = await this.attemptLogin(credentials);
      }

      await context.close();

      return {
        hasAuth: authIndicators.hasLoginForm || authIndicators.hasOAuthButtons,
        authType: authIndicators.hasSSOOptions.length > 0 ? 'SSO' : 'Traditional',
        authFlow,
        requiresMFA: authFlow.some(step => step.includes('MFA') || step.includes('2FA')),
        ssoProviders: authIndicators.hasSSOOptions,
      };
    } catch (error) {
      console.error('Auth testing error:', error);
      throw error;
    }
  }

  async extractDynamicContent(
    url: string,
    waitForSelectors: string[]
  ): Promise<{
    content: Record<string, any>;
    apiCalls: any[];
    websocketMessages: any[];
    dynamicElements: string[];
  }> {
    if (!this.browser) await this.initialize();
    
    const context = await this.browser!.newContext();
    this.page = await context.newPage();
    
    const apiCalls: any[] = [];
    const websocketMessages: any[] = [];

    try {
      // Intercept API calls
      await this.page.route('**/*', route => {
        const request = route.request();
        if (request.url().includes('/api/') || request.url().includes('graphql')) {
          apiCalls.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postData(),
          });
        }
        route.continue();
      });

      // Monitor WebSocket connections
      this.page.on('websocket', ws => {
        ws.on('framesent', frame => websocketMessages.push({ type: 'sent', data: frame }));
        ws.on('framereceived', frame => websocketMessages.push({ type: 'received', data: frame }));
      });

      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for dynamic content
      for (const selector of waitForSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 10000 });
        } catch {
          console.log(`Selector ${selector} not found within timeout`);
        }
      }

      // Extract dynamic content
      const content = await this.page.evaluate(() => {
        const extractedData: Record<string, any> = {};

        // Extract data from common SPA frameworks
        if ((window as any).__NEXT_DATA__) {
          extractedData.nextjs = (window as any).__NEXT_DATA__;
        }
        if ((window as any).__NUXT__) {
          extractedData.nuxt = (window as any).__NUXT__;
        }
        if ((window as any).__INITIAL_STATE__) {
          extractedData.initialState = (window as any).__INITIAL_STATE__;
        }

        // Extract from data attributes
        const dataElements = document.querySelectorAll('[data-props], [data-state]');
        dataElements.forEach((el, idx) => {
          const props = el.getAttribute('data-props');
          const state = el.getAttribute('data-state');
          if (props) {
            try {
              extractedData[`element_${idx}_props`] = JSON.parse(props);
            } catch {}
          }
          if (state) {
            try {
              extractedData[`element_${idx}_state`] = JSON.parse(state);
            } catch {}
          }
        });

        return extractedData;
      });

      // Identify dynamic elements
      const dynamicElements = await this.page.evaluate(() => {
        const elements: string[] = [];
        
        // Find elements with React/Vue/Angular attributes
        document.querySelectorAll('[data-reactroot], [data-v-], [ng-]').forEach(el => {
          elements.push(el.tagName + '.' + el.className);
        });

        return [...new Set(elements)];
      });

      await context.close();

      return {
        content,
        apiCalls,
        websocketMessages,
        dynamicElements,
      };
    } catch (error) {
      console.error('Dynamic content extraction error:', error);
      throw error;
    }
  }

  async performActionSequence(
    url: string,
    actions: Array<{
      type: 'click' | 'fill' | 'select' | 'hover' | 'scroll' | 'wait';
      selector?: string;
      value?: string;
      duration?: number;
    }>
  ): Promise<{
    success: boolean;
    results: any[];
    finalState: any;
  }> {
    if (!this.browser) await this.initialize();
    
    const context = await this.browser!.newContext();
    this.page = await context.newPage();
    const results: any[] = [];

    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      for (const action of actions) {
        try {
          let result: any = null;

          switch (action.type) {
            case 'click':
              await this.page.click(action.selector!);
              result = `Clicked ${action.selector}`;
              break;
              
            case 'fill':
              await this.page.fill(action.selector!, action.value!);
              result = `Filled ${action.selector} with value`;
              break;
              
            case 'select':
              await this.page.selectOption(action.selector!, action.value!);
              result = `Selected ${action.value} in ${action.selector}`;
              break;
              
            case 'hover':
              await this.page.hover(action.selector!);
              result = `Hovered over ${action.selector}`;
              break;
              
            case 'scroll':
              await this.page.evaluate(sel => {
                document.querySelector(sel)?.scrollIntoView();
              }, action.selector!);
              result = `Scrolled to ${action.selector}`;
              break;
              
            case 'wait':
              await this.page.waitForTimeout(action.duration || 1000);
              result = `Waited ${action.duration}ms`;
              break;
          }

          results.push({ action, result, success: true });
        } catch (error) {
          results.push({ action, error: error instanceof Error ? error.message : String(error), success: false });
        }
      }

      // Capture final state
      const finalState = await this.page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          bodyText: document.body.innerText.substring(0, 1000),
        };
      });

      await context.close();

      return {
        success: results.every(r => r.success),
        results,
        finalState,
      };
    } catch (error) {
      console.error('Action sequence error:', error);
      throw error;
    }
  }

  private parseFlowDescription(description: string): OperatorTask[] {
    // Simple parser - in production, use NLP or more sophisticated parsing
    const tasks: OperatorTask[] = [];
    
    if (description.includes('login') || description.includes('sign in')) {
      tasks.push({
        id: 'auth_flow',
        type: 'interaction',
        description: 'Test authentication flow',
        steps: [
          { action: 'click', selector: 'a[href*="login"], button:has-text("Sign In")', screenshot: true },
          { action: 'wait', value: '2000' },
          { action: 'screenshot' },
        ],
        results: null,
      });
    }

    if (description.includes('search')) {
      tasks.push({
        id: 'search_flow',
        type: 'interaction',
        description: 'Test search functionality',
        steps: [
          { action: 'fill', selector: 'input[type="search"], input[placeholder*="search"]', value: 'test query' },
          { action: 'click', selector: 'button[type="submit"], button:has-text("Search")' },
          { action: 'wait', value: '3000' },
          { action: 'screenshot' },
        ],
        results: null,
      });
    }

    return tasks;
  }

  private async executeTask(task: OperatorTask): Promise<any> {
    const results: any = {};
    
    for (const step of task.steps) {
      if (step.action === 'wait' && step.value) {
        await this.page!.waitForTimeout(parseInt(step.value));
      } else if (step.action === 'screenshot') {
        results.screenshot = true;
      } else if (step.selector) {
        await this.page!.locator(step.selector).first().click();
      }
    }

    return results;
  }

  private async attemptLogin(credentials: { username: string; password: string }): Promise<string[]> {
    const flow: string[] = [];
    
    try {
      // Find and fill username field
      const usernameSelector = 'input[type="text"], input[type="email"], input[name*="user"], input[name*="email"]';
      await this.page!.fill(usernameSelector, credentials.username);
      flow.push('Entered username');

      // Find and fill password field
      const passwordSelector = 'input[type="password"]';
      await this.page!.fill(passwordSelector, credentials.password);
      flow.push('Entered password');

      // Submit form
      const submitButton = 'button[type="submit"], input[type="submit"], button:has-text("Sign In"), button:has-text("Login")';
      await this.page!.click(submitButton);
      flow.push('Submitted login form');

      // Wait for navigation or error
      await this.page!.waitForLoadState('domcontentloaded', { timeout: 15000 });
      
      // Check for MFA
      const mfaIndicators = await this.page!.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('verification') || text.includes('authenticate') || text.includes('2fa');
      });

      if (mfaIndicators) {
        flow.push('MFA/2FA required');
      }

    } catch (error) {
      flow.push(`Login attempt failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return flow;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}