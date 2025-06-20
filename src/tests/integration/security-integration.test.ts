import { validateScanUrl, sanitizeInput, validateCodeInput } from '@/lib/validation/input-validation';
import { validateEnvironment } from '@/lib/config/env-validation';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Security Integration Tests', () => {
  describe('Input Validation', () => {
    it('should validate URLs correctly', () => {
      expect(validateScanUrl('https://example.com').valid).toBe(true);
      expect(validateScanUrl('http://example.com').valid).toBe(true);
      expect(validateScanUrl('ftp://example.com').valid).toBe(false);
      expect(validateScanUrl('invalid-url').valid).toBe(false);
      expect(validateScanUrl('javascript:alert(1)').valid).toBe(false);
    });

    it('should block private IPs in production', () => {
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      expect(validateScanUrl('http://localhost:3000').valid).toBe(false);
      expect(validateScanUrl('http://127.0.0.1').valid).toBe(false);
      expect(validateScanUrl('http://192.168.1.1').valid).toBe(false);
      expect(validateScanUrl('http://10.0.0.1').valid).toBe(false);
      expect(validateScanUrl('http://172.16.0.1').valid).toBe(false);
      
      process.env.NODE_ENV = oldEnv;
    });

    it('should allow private IPs in development', () => {
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      expect(validateScanUrl('http://localhost:3000').valid).toBe(true);
      expect(validateScanUrl('http://127.0.0.1').valid).toBe(true);
      expect(validateScanUrl('http://192.168.1.1').valid).toBe(true);
      
      process.env.NODE_ENV = oldEnv;
    });

    it('should sanitize input correctly', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitizeInput('  test input  ')).toBe('test input');
      expect(sanitizeInput('normal text')).toBe('normal text');
      expect(sanitizeInput('test"with\'quotes')).toBe('testwithquotes');
    });

    it('should validate code input', () => {
      expect(validateCodeInput({ 'test.js': 'console.log("test")' }).valid).toBe(true);
      expect(validateCodeInput({}).valid).toBe(false);
      
      // Test file count limit
      const manyFiles: Record<string, string> = {};
      for (let i = 0; i < 101; i++) {
        manyFiles[`file${i}.js`] = 'code';
      }
      expect(validateCodeInput(manyFiles).valid).toBe(false);
      
      // Test file size limit
      const largeFile = { 'large.js': 'x'.repeat(1024 * 1024 + 1) };
      expect(validateCodeInput(largeFile).valid).toBe(false);
    });
  });

  describe('Environment Validation', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should validate required environment variables', () => {
      // Set required env vars
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      process.env.SUPABASE_SERVICE_KEY = 'service-key';
      process.env.OPENAI_API_KEY = 'openai-key';
      process.env.ANTHROPIC_API_KEY = 'anthropic-key';

      const result = validateEnvironment();
      expect(result.valid).toBe(true);
      expect(result.missing.length).toBe(0);
    });

    it('should fail validation when required vars are missing', () => {
      // Remove a required var
      delete process.env.OPENAI_API_KEY;

      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('OPENAI_API_KEY');
    });
  });
});