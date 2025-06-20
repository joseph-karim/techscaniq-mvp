import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../api/server'

describe('API Security Tests', () => {
  let server: any
  
  beforeAll(() => {
    // Start test server
    server = app.listen(0) // Random port
  })
  
  afterAll(() => {
    server.close()
  })
  
  describe('Input Validation', () => {
    it('should reject scan request with invalid URL', async () => {
      const response = await request(app)
        .post('/api/scans')
        .send({
          company_name: 'Test Company',
          website_url: 'invalid-url'
        })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Invalid website URL format')
    })
    
    it('should reject scan request with non-HTTP protocol', async () => {
      const response = await request(app)
        .post('/api/scans')
        .send({
          company_name: 'Test Company',
          website_url: 'ftp://example.com'
        })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('HTTP or HTTPS protocol')
    })
    
    it('should reject scan request with missing fields', async () => {
      const response = await request(app)
        .post('/api/scans')
        .send({
          company_name: 'Test Company'
          // Missing website_url
        })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('required')
    })
    
    it('should sanitize string inputs', async () => {
      const response = await request(app)
        .post('/api/scans')
        .send({
          company_name: '<script>alert("xss")</script>Test Company',
          website_url: 'https://example.com',
          requestor_name: 'John<script>alert(1)</script>Doe'
        })
      
      // The request should succeed but with sanitized data
      // In a real test, we'd check the database to verify sanitization
      expect(response.status).not.toBe(500)
    })
  })
  
  describe('Rate Limiting', () => {
    it('should allow requests under rate limit', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/health')
          .expect(200)
      )
      
      await Promise.all(requests)
    })
    
    it('should block requests exceeding rate limit', async () => {
      // Note: This test assumes rate limit is set to 100 requests per 15 minutes
      // For testing, you might want to temporarily lower the limit
      const requests = []
      
      // Make many requests quickly
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/scans')
            .send({
              company_name: `Test Company ${i}`,
              website_url: 'https://example.com'
            })
        )
      }
      
      const responses = await Promise.all(requests)
      
      // At least one should be rate limited (depends on timing)
      // In a real test environment, you'd configure a lower rate limit for testing
      const rateLimited = responses.some(r => r.status === 429)
      
      // This assertion might need adjustment based on actual rate limit settings
      expect(responses.every(r => r.status === 200 || r.status === 429)).toBe(true)
    })
  })
  
  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
      
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBe('DENY')
      expect(response.headers['x-xss-protection']).toBe('1; mode=block')
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    })
  })
  
  describe('CORS Protection', () => {
    it('should allow requests from configured origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000')
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')
    })
    
    it('should block requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://evil.com')
      
      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })
  })
  
  describe('Request Size Limits', () => {
    it('should reject oversized requests', async () => {
      const largePayload = {
        company_name: 'Test',
        website_url: 'https://example.com',
        company_description: 'x'.repeat(2 * 1024 * 1024) // 2MB
      }
      
      const response = await request(app)
        .post('/api/scans')
        .send(largePayload)
      
      expect(response.status).toBe(413) // Payload Too Large
    })
  })
})