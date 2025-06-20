export function validateScanUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    // Must be HTTP or HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname;
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
      ) {
        return { valid: false, error: 'Cannot scan private/local addresses' };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>'"]/g, '');
}

export function validateCodeInput(code: Record<string, string>, maxSize: number = 100000): { valid: boolean; error?: string } {
  if (!code || typeof code !== 'object') {
    return { valid: false, error: 'Invalid code object' };
  }
  
  const totalSize = Object.values(code).join('').length;
  
  if (totalSize > maxSize) {
    return { valid: false, error: `Code size exceeds limit of ${maxSize} characters` };
  }
  
  return { valid: true };
}