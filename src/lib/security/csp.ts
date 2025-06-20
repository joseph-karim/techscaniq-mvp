// Content Security Policy configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Define allowed sources
export const CSP_SOURCES = {
  self: "'self'",
  unsafeInline: "'unsafe-inline'",
  unsafeEval: "'unsafe-eval'",
  none: "'none'",
  data: 'data:',
  blob: 'blob:',
  
  // API endpoints
  api: [
    'https://techscaniq-mvp.onrender.com',
    'http://localhost:3000',
    process.env.VITE_API_URL
  ].filter(Boolean),
  
  // External services
  scripts: [
    "'self'",
    "'unsafe-inline'", // Required for Vite/React
    "'unsafe-eval'", // Required for development
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
    'https://cdnjs.cloudflare.com'
  ],
  
  styles: [
    "'self'",
    "'unsafe-inline'", // Required for styled-components, emotion, etc.
    'https://fonts.googleapis.com',
    'https://api.fontshare.com',
    'https://cdn.jsdelivr.net',
    'https://cdn.tailwindcss.com'
  ],
  
  fonts: [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
    'https://api.fontshare.com',
    'https://cdn.fontshare.com'
  ],
  
  images: [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://*.supabase.co',
    'https://*.supabase.com',
    'https://*.githubusercontent.com'
  ],
  
  connect: [
    "'self'",
    'https://techscaniq-mvp.onrender.com',
    'https://*.supabase.co',
    'https://*.supabase.com',
    'wss://*.supabase.co',
    'wss://*.supabase.com',
    'https://api.openai.com',
    'https://api.anthropic.com',
    isDevelopment && 'http://localhost:*',
    isDevelopment && 'ws://localhost:*'
  ].filter(Boolean)
};

// Generate CSP header string
export function generateCSP(): string {
  const directives: Record<string, string[]> = {
    'default-src': [CSP_SOURCES.self],
    'script-src': CSP_SOURCES.scripts,
    'style-src': CSP_SOURCES.styles,
    'font-src': CSP_SOURCES.fonts,
    'img-src': CSP_SOURCES.images,
    'connect-src': CSP_SOURCES.connect,
    'worker-src': [CSP_SOURCES.self, CSP_SOURCES.blob],
    'frame-ancestors': [CSP_SOURCES.none],
    'base-uri': [CSP_SOURCES.self],
    'form-action': [CSP_SOURCES.self],
    'object-src': [CSP_SOURCES.none],
    'upgrade-insecure-requests': isProduction ? [''] : [],
  };
  
  return Object.entries(directives)
    .filter(([_, values]) => values.length > 0)
    .map(([directive, values]) => 
      `${directive} ${values.join(' ')}`
    )
    .join('; ');
}

// CSP violation logger
export function setupCSPViolationLogger() {
  if (typeof window !== 'undefined') {
    window.addEventListener('securitypolicyviolation', (e) => {
      console.error('CSP Violation:', {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber,
        columnNumber: e.columnNumber
      });
      
      // In production, send to monitoring service
      if (window.location.hostname !== 'localhost') {
        // You can send to your monitoring service here
        console.warn('CSP violation detected in production:', e.blockedURI);
      }
    });
  }
}