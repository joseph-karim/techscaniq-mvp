// Environment configuration helper
export const env = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'https://techscaniq-mvp.onrender.com/api',
  
  // Supabase Configuration
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // Feature Flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Google API (optional)
  GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
} as const;

// Required environment variables for frontend
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
] as const;

// Optional environment variables
const optionalEnvVars = [
  'VITE_API_URL',
  'VITE_GOOGLE_API_KEY'
] as const;

// Validate required environment variables
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing = requiredEnvVars.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    console.error('Please check your .env file');
    
    // In production, throw error for missing required vars
    if (env.isProduction) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    return { valid: false, missing };
  }
  
  // Warn about optional vars
  optionalEnvVars.forEach(envVar => {
    if (!import.meta.env[envVar]) {
      console.warn(`Optional environment variable not set: ${envVar}`);
    }
  });
  
  // Log current configuration (without sensitive data)
  console.log('Environment Configuration:', {
    API_URL: env.API_URL,
    SUPABASE_URL: env.SUPABASE_URL ? '✓ Set' : '✗ Missing',
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
  });
  
  return { valid: true, missing: [] };
}

// Helper to get full API URL
export function getApiUrl(path: string): string {
  const baseUrl = env.API_URL.replace(/\/+$/, ''); // Remove trailing slashes
  const cleanPath = path.replace(/^\/+/, ''); // Remove leading slashes
  return `${baseUrl}/${cleanPath}`;
}