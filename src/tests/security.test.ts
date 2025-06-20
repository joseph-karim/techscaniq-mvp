import { describe, it, expect, beforeEach } from '@jest/globals'
import { validateScanUrl, sanitizeInput, validateCodeInput } from '../lib/validation/input-validation'
import { NextRequest } from 'next/server'

describe('Security Tests', () => {
  describe('URL Validation', () => {
    it('should accept valid HTTP URLs', () => {
      const result = validateScanUrl('https://example.com')
      expect(result.valid).toBe(true)
    })
    
    it('should accept valid HTTP URLs with paths', () => {
      const result = validateScanUrl('https://example.com/path/to/page')
      expect(result.valid).toBe(true)
    })
    
    it('should reject non-HTTP protocols', () => {
      const result = validateScanUrl('ftp://example.com')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('HTTP or HTTPS')
    })
    
    it('should reject file:// protocol', () => {
      const result = validateScanUrl('file:///etc/passwd')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('HTTP or HTTPS')
    })
    
    it('should reject javascript: protocol', () => {
      const result = validateScanUrl('javascript:alert(1)')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid URL format')
    })
    
    it('should reject localhost in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const result = validateScanUrl('http://localhost:3000')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('private/local')
      
      process.env.NODE_ENV = originalEnv
    })
    
    it('should reject private IP ranges in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const privateIPs = [
        'http://127.0.0.1',
        'http://192.168.1.1',
        'http://10.0.0.1',
        'http://172.16.0.1'
      ]
      
      privateIPs.forEach(ip => {
        const result = validateScanUrl(ip)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('private/local')
      })
      
      process.env.NODE_ENV = originalEnv
    })
    
    it('should allow localhost in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const result = validateScanUrl('http://localhost:3000')
      expect(result.valid).toBe(true)
      
      process.env.NODE_ENV = originalEnv
    })
  })
  
  describe('Input Sanitization', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Normal text'
      const result = sanitizeInput(input)
      expect(result).toBe('scriptalert("xss")/scriptNormal text')
    })
    
    it('should remove quotes', () => {
      const input = 'Text with "quotes" and \'single quotes\''
      const result = sanitizeInput(input)
      expect(result).toBe('Text with quotes and single quotes')
    })
    
    it('should trim whitespace', () => {
      const input = '  text with spaces  '
      const result = sanitizeInput(input)
      expect(result).toBe('text with spaces')
    })
    
    it('should handle empty input', () => {
      const result = sanitizeInput('')
      expect(result).toBe('')
    })
  })
  
  describe('Code Input Validation', () => {
    it('should accept valid code object', () => {
      const code = {
        'file1.js': 'console.log("hello")',
        'file2.js': 'function test() { return true; }'
      }
      const result = validateCodeInput(code)
      expect(result.valid).toBe(true)
    })
    
    it('should reject non-object input', () => {
      const result = validateCodeInput('not an object' as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid code object')
    })
    
    it('should reject null input', () => {
      const result = validateCodeInput(null as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid code object')
    })
    
    it('should enforce size limits', () => {
      const largeCode = {
        'file.js': 'x'.repeat(100001)
      }
      const result = validateCodeInput(largeCode)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds limit')
    })
    
    it('should accept code within size limit', () => {
      const code = {
        'file.js': 'x'.repeat(50000)
      }
      const result = validateCodeInput(code)
      expect(result.valid).toBe(true)
    })
    
    it('should allow custom size limits', () => {
      const code = {
        'file.js': 'x'.repeat(1001)
      }
      const result = validateCodeInput(code, 1000)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds limit of 1000')
    })
  })
})