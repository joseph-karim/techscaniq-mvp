const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY'
] as const;

const optionalEnvVars = [
  'BACKEND_URL',
  'BACKEND_API_KEY',
  'ENVIRONMENT',
  'REDIS_HOST',
  'REDIS_PORT'
] as const;

export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return { valid: false, missing };
  }
  
  // Warn about optional but recommended vars
  optionalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.warn(`Optional environment variable not set: ${envVar}`);
    }
  });
  
  return { valid: true, missing: [] };
}

// Validate on startup
if (typeof window === 'undefined') { // Server-side only
  const validation = validateEnvironment();
  if (!validation.valid) {
    throw new Error(`Environment validation failed: ${validation.missing.join(', ')}`);
  }
}