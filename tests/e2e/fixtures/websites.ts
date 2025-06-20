export const mockWebsite = {
  simple: {
    url: 'https://simple-blog.com',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Simple Blog</title>
          <meta name="generator" content="WordPress 5.8">
          <link rel="stylesheet" href="/style.css">
          <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        </head>
        <body>
          <header>
            <h1>Simple Blog</h1>
            <nav>
              <a href="/">Home</a>
              <a href="/about">About</a>
              <a href="/contact">Contact</a>
            </nav>
          </header>
          <main>
            <article>
              <h2>Welcome to our blog</h2>
              <p>This is a simple blog built with WordPress.</p>
            </article>
          </main>
          <footer>
            <p>&copy; 2024 Simple Blog</p>
          </footer>
        </body>
      </html>
    `,
    expectedTechnologies: ['WordPress', 'jQuery', 'PHP'],
    expectedDuration: 10000
  },
  
  complex: {
    url: 'https://modern-app.com',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Modern App</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="/static/css/app.abc123.css">
        </head>
        <body>
          <div id="root"></div>
          <script>
            window.__INITIAL_STATE__ = {
              user: null,
              config: { apiUrl: 'https://api.modern-app.com' }
            };
          </script>
          <script src="/static/js/runtime.abc123.js"></script>
          <script src="/static/js/vendors.abc123.js"></script>
          <script src="/static/js/main.abc123.js"></script>
        </body>
      </html>
    `,
    expectedTechnologies: ['React', 'Node.js', 'Webpack'],
    expectedDuration: 30000
  },
  
  enterprise: {
    url: 'https://enterprise-platform.com',
    html: `
      <!DOCTYPE html>
      <html ng-app="enterpriseApp">
        <head>
          <title>Enterprise Platform</title>
          <base href="/">
          <link href="/assets/angular-material.min.css" rel="stylesheet">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
        </head>
        <body ng-controller="MainController">
          <mat-sidenav-container>
            <mat-sidenav mode="side" opened>
              <mat-nav-list>
                <a mat-list-item routerLink="/dashboard">Dashboard</a>
                <a mat-list-item routerLink="/analytics">Analytics</a>
              </mat-nav-list>
            </mat-sidenav>
            <mat-sidenav-content>
              <router-outlet></router-outlet>
            </mat-sidenav-content>
          </mat-sidenav-container>
          <script src="/vendor/angular/angular.min.js"></script>
          <script src="/vendor/angular-material/angular-material.min.js"></script>
          <script src="/dist/app.bundle.js"></script>
        </body>
      </html>
    `,
    expectedTechnologies: ['Angular', 'TypeScript', 'Material Design'],
    expectedDuration: 60000
  }
};

export const mockAPIResponses = {
  technologies: {
    simple: {
      detected: [
        { name: 'WordPress', version: '5.8', confidence: 0.95 },
        { name: 'jQuery', version: '3.6.0', confidence: 0.99 },
        { name: 'PHP', version: '7.4', confidence: 0.85 },
        { name: 'MySQL', version: '8.0', confidence: 0.80 }
      ]
    },
    complex: {
      detected: [
        { name: 'React', version: '18.2.0', confidence: 0.98 },
        { name: 'Node.js', version: '18.x', confidence: 0.92 },
        { name: 'Webpack', version: '5', confidence: 0.88 },
        { name: 'Express', version: '4.18', confidence: 0.85 }
      ]
    },
    enterprise: {
      detected: [
        { name: 'Angular', version: '15', confidence: 0.96 },
        { name: 'TypeScript', version: '4.9', confidence: 0.94 },
        { name: 'Material Design', version: '15', confidence: 0.90 },
        { name: 'RxJS', version: '7', confidence: 0.87 }
      ]
    }
  },
  
  security: {
    simple: {
      score: 75,
      vulnerabilities: [
        {
          type: 'Outdated WordPress',
          severity: 'medium',
          description: 'WordPress version 5.8 has known vulnerabilities'
        },
        {
          type: 'Missing Security Headers',
          severity: 'low',
          description: 'Missing X-Frame-Options and CSP headers'
        }
      ]
    },
    complex: {
      score: 85,
      vulnerabilities: [
        {
          type: 'Exposed Source Maps',
          severity: 'low',
          description: 'Source maps are publicly accessible'
        }
      ]
    },
    enterprise: {
      score: 95,
      vulnerabilities: []
    }
  },
  
  performance: {
    simple: {
      score: 80,
      metrics: {
        FCP: 1500,
        LCP: 2200,
        CLS: 0.08,
        TBT: 250
      }
    },
    complex: {
      score: 90,
      metrics: {
        FCP: 1200,
        LCP: 1800,
        CLS: 0.05,
        TBT: 150
      }
    },
    enterprise: {
      score: 70,
      metrics: {
        FCP: 2000,
        LCP: 3500,
        CLS: 0.12,
        TBT: 450
      }
    }
  }
};

export const testScenarios = {
  happyPath: {
    name: 'Happy Path - Simple Website',
    url: mockWebsite.simple.url,
    expectedStages: [
      'initialization',
      'web_scraping',
      'technology_detection',
      'security_analysis',
      'performance_analysis',
      'report_generation'
    ],
    expectedDuration: 30000
  },
  
  complexSite: {
    name: 'Complex Website Analysis',
    url: mockWebsite.complex.url,
    expectedStages: [
      'initialization',
      'web_scraping',
      'technology_detection',
      'code_analysis',
      'security_analysis',
      'performance_analysis',
      'report_generation'
    ],
    expectedDuration: 60000
  },
  
  errorScenarios: {
    networkTimeout: {
      name: 'Network Timeout',
      url: 'https://timeout-test.com',
      expectedError: 'Network timeout',
      expectedStage: 'web_scraping'
    },
    
    invalidUrl: {
      name: 'Invalid URL',
      url: 'not-a-valid-url',
      expectedError: 'Invalid URL format',
      expectedStage: 'initialization'
    },
    
    accessDenied: {
      name: 'Access Denied',
      url: 'https://protected-site.com',
      expectedError: 'Access denied',
      expectedStage: 'web_scraping'
    },
    
    rateLimited: {
      name: 'Rate Limited',
      url: 'https://rate-limited.com',
      expectedError: 'Rate limit exceeded',
      expectedStage: 'web_scraping'
    }
  },
  
  edgeCases: {
    singlePageApp: {
      name: 'Single Page Application',
      url: 'https://spa-app.com',
      requiresJavaScript: true,
      expectedTechnologies: ['React', 'React Router', 'Redux']
    },
    
    staticSite: {
      name: 'Static HTML Site',
      url: 'https://static-site.com',
      requiresJavaScript: false,
      expectedTechnologies: ['HTML', 'CSS']
    },
    
    progressiveWebApp: {
      name: 'Progressive Web App',
      url: 'https://pwa-app.com',
      requiresJavaScript: true,
      expectedTechnologies: ['Service Worker', 'Web App Manifest', 'React']
    },
    
    largeSite: {
      name: 'Large Website (1000+ pages)',
      url: 'https://large-site.com',
      pageCount: 1000,
      expectedDuration: 180000 // 3 minutes
    }
  }
};