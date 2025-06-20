import { faker } from '@faker-js/faker';

export interface MockWebsiteData {
  html: string;
  technologies: string[];
  expectedDuration: number;
  type: 'simple' | 'complex' | 'enterprise';
}

export interface MockScanResponse {
  scanId: string;
  progress: number;
  stage: string;
  message: string;
  data: {
    technologiesFound: number;
    pagesScanned: number;
    issuesFound: number;
    codeAnalysisResults?: any;
  };
}

export class TestDataGenerator {
  generateWebsiteData(type: 'simple' | 'complex' | 'enterprise'): MockWebsiteData {
    switch (type) {
      case 'simple':
        return {
          html: this.generateSimpleHTML(),
          technologies: ['HTML', 'CSS', 'JavaScript', 'jQuery'],
          expectedDuration: 10000,
          type: 'simple'
        };
        
      case 'complex':
        return {
          html: this.generateComplexHTML(),
          technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
          expectedDuration: 30000,
          type: 'complex'
        };
        
      case 'enterprise':
        return {
          html: this.generateEnterpriseHTML(),
          technologies: ['Angular', 'Java', 'Kubernetes', 'Kafka', 'MongoDB', 'ElasticSearch'],
          expectedDuration: 60000,
          type: 'enterprise'
        };
    }
  }
  
  generateMockResponse(scanId: string, progress: number): MockScanResponse {
    return {
      scanId,
      progress,
      stage: this.getStageFromProgress(progress),
      message: this.getProgressMessage(progress),
      data: {
        technologiesFound: Math.floor(progress / 10),
        pagesScanned: Math.floor(progress / 5),
        issuesFound: Math.floor(Math.random() * 5)
      }
    };
  }
  
  generateTestUser() {
    return {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12, memorable: true }),
      name: faker.person.fullName(),
      company: faker.company.name()
    };
  }
  
  generateTestScanRequest() {
    const urls = [
      'https://example-tech-company.com',
      'https://demo-saas-app.com',
      'https://enterprise-platform.com',
      'https://startup-landing.com',
      'https://ecommerce-store.com'
    ];
    
    return {
      url: faker.helpers.arrayElement(urls),
      depth: faker.number.int({ min: 1, max: 5 }),
      includeSubdomains: faker.datatype.boolean(),
      scanType: faker.helpers.arrayElement(['quick', 'standard', 'deep']),
      options: {
        analyzeCode: faker.datatype.boolean(),
        checkSecurity: true,
        detectTechnologies: true,
        measurePerformance: faker.datatype.boolean()
      }
    };
  }
  
  private generateSimpleHTML(): string {
    const companyName = faker.company.name();
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>${companyName} - Welcome</title>
          <meta name="generator" content="WordPress 5.8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="/wp-content/themes/twentytwentyone/style.css">
          <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        </head>
        <body>
          <header>
            <h1>Welcome to ${companyName}</h1>
            <nav>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/services">Services</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </nav>
          </header>
          <main>
            <section class="hero">
              <h2>${faker.company.catchPhrase()}</h2>
              <p>${faker.lorem.paragraphs(3)}</p>
            </section>
            <section class="features">
              <h3>Our Features</h3>
              <div class="feature-grid">
                ${this.generateFeatures(3)}
              </div>
            </section>
          </main>
          <footer>
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </footer>
          <script>
            $(document).ready(function() {
              console.log('Page loaded');
              $('.feature-grid').on('click', '.feature', function() {
                $(this).toggleClass('active');
              });
            });
          </script>
        </body>
      </html>
    `;
  }
  
  private generateComplexHTML(): string {
    const companyName = faker.company.name();
    const buildHash = faker.string.alphanumeric(8);
    
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>${companyName} - Modern Web Application</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="description" content="${faker.lorem.sentence()}">
          <link rel="stylesheet" href="/static/css/app.${buildHash}.css">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <script>
            window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
          </script>
        </head>
        <body>
          <div id="root" data-react-version="18.2.0"></div>
          <script>
            window.__INITIAL_STATE__ = {
              user: null,
              config: {
                apiUrl: 'https://api.${faker.internet.domainName()}',
                version: '2.1.0',
                features: {
                  analytics: true,
                  chat: true,
                  notifications: true
                }
              },
              csrf: '${faker.string.alphanumeric(32)}'
            };
          </script>
          <script src="/static/js/runtime.${buildHash}.js"></script>
          <script src="/static/js/vendors.${buildHash}.js"></script>
          <script src="/static/js/main.${buildHash}.js"></script>
          <script>
            // React app initialization
            if (window.React && window.ReactDOM) {
              ReactDOM.createRoot(document.getElementById('root')).render(
                React.createElement(App)
              );
            }
          </script>
          <!-- Google Analytics -->
          <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
        </body>
      </html>
    `;
  }
  
  private generateEnterpriseHTML(): string {
    const companyName = faker.company.name();
    const buildVersion = faker.system.semver();
    
    return `
      <!DOCTYPE html>
      <html lang="en" ng-app="enterpriseApp">
        <head>
          <title>${companyName} - Enterprise Platform</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <base href="/">
          
          <!-- Angular Material -->
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
          <link href="/assets/css/angular-material.min.css" rel="stylesheet">
          
          <!-- Application styles -->
          <link href="/dist/styles.${faker.string.alphanumeric(12)}.css" rel="stylesheet">
          
          <!-- Security headers -->
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com">
          <meta name="robots" content="noindex, nofollow">
        </head>
        <body class="mat-typography" ng-controller="MainController as vm">
          <div class="app-container">
            <mat-sidenav-container class="sidenav-container">
              <mat-sidenav mode="side" opened>
                <mat-nav-list>
                  <a mat-list-item routerLink="/dashboard">Dashboard</a>
                  <a mat-list-item routerLink="/analytics">Analytics</a>
                  <a mat-list-item routerLink="/reports">Reports</a>
                  <a mat-list-item routerLink="/settings">Settings</a>
                </mat-nav-list>
              </mat-sidenav>
              <mat-sidenav-content>
                <router-outlet></router-outlet>
              </mat-sidenav-content>
            </mat-sidenav-container>
          </div>
          
          <!-- Microservices configuration -->
          <script>
            window.MICROSERVICES_CONFIG = {
              auth: 'https://auth.${faker.internet.domainName()}',
              api: 'https://api.${faker.internet.domainName()}',
              analytics: 'https://analytics.${faker.internet.domainName()}',
              messaging: 'wss://messaging.${faker.internet.domainName()}',
              version: '${buildVersion}'
            };
          </script>
          
          <!-- Angular and dependencies -->
          <script src="/vendor/angular/angular.min.js"></script>
          <script src="/vendor/angular-animate/angular-animate.min.js"></script>
          <script src="/vendor/angular-aria/angular-aria.min.js"></script>
          <script src="/vendor/angular-material/angular-material.min.js"></script>
          <script src="/vendor/angular-route/angular-route.min.js"></script>
          
          <!-- Application bundles -->
          <script src="/dist/vendor.bundle.${faker.string.alphanumeric(12)}.js"></script>
          <script src="/dist/app.bundle.${faker.string.alphanumeric(12)}.js"></script>
          
          <!-- Monitoring -->
          <script src="https://js.sentry-cdn.com/enterprise.min.js"></script>
        </body>
      </html>
    `;
  }
  
  private generateFeatures(count: number): string {
    let features = '';
    for (let i = 0; i < count; i++) {
      features += `
        <div class="feature">
          <h4>${faker.commerce.productName()}</h4>
          <p>${faker.lorem.sentence()}</p>
        </div>
      `;
    }
    return features;
  }
  
  private getStageFromProgress(progress: number): string {
    if (progress < 20) return 'web_scraping';
    if (progress < 40) return 'technology_detection';
    if (progress < 60) return 'security_analysis';
    if (progress < 80) return 'code_analysis';
    return 'report_generation';
  }
  
  private getProgressMessage(progress: number): string {
    const messages = {
      0: 'Initializing scan...',
      10: 'Starting web scraping...',
      20: 'Analyzing page structure...',
      30: 'Detecting technologies...',
      40: 'Running security checks...',
      50: 'Analyzing code patterns...',
      60: 'Processing findings...',
      70: 'Generating insights...',
      80: 'Creating report...',
      90: 'Finalizing analysis...',
      100: 'Scan complete!'
    };
    
    const nearestProgress = Math.floor(progress / 10) * 10;
    return messages[nearestProgress as keyof typeof messages] || `Progress: ${progress}%`;
  }
  
  generateMockAIResponse(type: 'technology' | 'security' | 'code'): any {
    switch (type) {
      case 'technology':
        return {
          technologies: [
            { name: 'React', version: '18.2.0', confidence: 0.95 },
            { name: 'Node.js', version: '18.x', confidence: 0.90 },
            { name: 'PostgreSQL', version: '14', confidence: 0.85 }
          ],
          frameworks: ['Next.js', 'Express', 'TailwindCSS'],
          libraries: ['axios', 'lodash', 'moment.js']
        };
        
      case 'security':
        return {
          vulnerabilities: [
            {
              type: 'XSS',
              severity: 'medium',
              description: 'Potential XSS vulnerability in user input',
              location: '/src/components/UserInput.tsx'
            },
            {
              type: 'SQL Injection',
              severity: 'critical',
              description: 'Raw SQL query construction detected',
              location: '/api/users.js'
            }
          ],
          score: 75,
          recommendations: [
            'Implement input sanitization',
            'Use parameterized queries',
            'Enable CSP headers'
          ]
        };
        
      case 'code':
        return {
          quality: {
            score: 82,
            maintainability: 'B',
            complexity: 'Medium'
          },
          patterns: [
            'MVC Architecture',
            'Repository Pattern',
            'Observer Pattern'
          ],
          issues: [
            {
              type: 'code_smell',
              description: 'Long method detected',
              file: '/src/services/data-processor.ts',
              line: 145
            }
          ]
        };
    }
  }
}