import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { SerenaCodeAnalyzer } from '../../src/services/serena-integration';
import { MockMCPClient } from '../mocks/mcp-client';

describe('Serena MCP Integration', () => {
  let analyzer: SerenaCodeAnalyzer;
  let mockClient: MockMCPClient;
  
  beforeAll(async () => {
    mockClient = new MockMCPClient();
    await mockClient.start();
    
    analyzer = new SerenaCodeAnalyzer(mockClient as any);
  });
  
  afterAll(async () => {
    await mockClient.stop();
  });
  
  describe('Code Analysis', () => {
    it('should analyze JavaScript code structure', async () => {
      const testCode = {
        'app.js': `
          class UserManager {
            constructor() {
              this.users = [];
            }
            
            async addUser(user) {
              this.users.push(user);
              await this.saveToDatabase(user);
            }
            
            async saveToDatabase(user) {
              // Mock implementation
            }
          }
          
          export default UserManager;
        `
      };
      
      const result = await analyzer.analyzeWebsiteCode(testCode, {
        projectPath: '/tmp/test-project',
        language: 'javascript'
      });
      
      expect(result.symbols).toContainEqual(
        expect.objectContaining({
          name: 'UserManager',
          kind: 'class',
          children: expect.arrayContaining([
            expect.objectContaining({ name: 'constructor' }),
            expect.objectContaining({ name: 'addUser' }),
            expect.objectContaining({ name: 'saveToDatabase' })
          ])
        })
      );
    });
    
    it('should detect security issues', async () => {
      const vulnerableCode = {
        'api.js': `
          const express = require('express');
          const app = express();
          
          app.get('/user/:id', (req, res) => {
            const query = 'SELECT * FROM users WHERE id = ' + req.params.id;
            db.query(query, (err, result) => {
              res.json(result);
            });
          });
          
          const apiKey = 'sk-1234567890abcdef';
        `
      };
      
      const result = await analyzer.analyzeWebsiteCode(vulnerableCode, {
        projectPath: '/tmp/test-vuln',
        language: 'javascript'
      });
      
      expect(result.insights.securityIssues).toContainEqual(
        expect.objectContaining({
          type: 'sql_injection',
          severity: 'critical',
          locations: expect.arrayContaining(['api.js'])
        })
      );
      
      expect(result.insights.securityIssues).toContainEqual(
        expect.objectContaining({
          type: 'hardcoded_credentials',
          severity: 'high',
          locations: expect.arrayContaining(['api.js'])
        })
      );
    });
    
    it('should identify frameworks', async () => {
      const reactCode = {
        'App.jsx': `
          import React, { useState, useEffect } from 'react';
          import { BrowserRouter as Router } from 'react-router-dom';
          
          function App() {
            const [data, setData] = useState([]);
            
            useEffect(() => {
              fetchData().then(setData);
            }, []);
            
            return (
              <Router>
                <div className="app">
                  <h1>My App</h1>
                </div>
              </Router>
            );
          }
          
          export default App;
        `
      };
      
      const result = await analyzer.analyzeWebsiteCode(reactCode, {
        projectPath: '/tmp/test-react',
        language: 'javascript'
      });
      
      expect(result.insights.frameworkDetection).toContainEqual(
        expect.objectContaining({
          name: 'React',
          confidence: expect.any(Number),
          evidence: expect.stringContaining('useState')
        })
      );
    });
    
    it('should analyze TypeScript code', async () => {
      const tsCode = {
        'user.service.ts': `
          interface User {
            id: number;
            name: string;
            email: string;
          }
          
          export class UserService {
            private users: Map<number, User> = new Map();
            
            constructor(private readonly db: Database) {}
            
            async getUser(id: number): Promise<User | null> {
              return this.users.get(id) || null;
            }
            
            async createUser(userData: Omit<User, 'id'>): Promise<User> {
              const id = Date.now();
              const user: User = { id, ...userData };
              this.users.set(id, user);
              await this.db.save('users', user);
              return user;
            }
          }
        `
      };
      
      const result = await analyzer.analyzeWebsiteCode(tsCode, {
        projectPath: '/tmp/test-ts',
        language: 'typescript'
      });
      
      expect(result.symbols).toContainEqual(
        expect.objectContaining({
          name: 'UserService',
          kind: 'class',
          children: expect.arrayContaining([
            expect.objectContaining({ name: 'getUser', kind: 'method' }),
            expect.objectContaining({ name: 'createUser', kind: 'method' })
          ])
        })
      );
      
      expect(result.symbols).toContainEqual(
        expect.objectContaining({
          name: 'User',
          kind: 'interface'
        })
      );
    });
    
    it('should detect code patterns', async () => {
      const patternCode = {
        'observer.js': `
          class EventEmitter {
            constructor() {
              this.events = {};
            }
            
            on(event, listener) {
              if (!this.events[event]) {
                this.events[event] = [];
              }
              this.events[event].push(listener);
            }
            
            emit(event, ...args) {
              if (this.events[event]) {
                this.events[event].forEach(listener => listener(...args));
              }
            }
          }
          
          class DataStore extends EventEmitter {
            constructor() {
              super();
              this.data = {};
            }
            
            set(key, value) {
              this.data[key] = value;
              this.emit('change', key, value);
            }
          }
        `
      };
      
      const result = await analyzer.analyzeWebsiteCode(patternCode, {
        projectPath: '/tmp/test-patterns',
        language: 'javascript'
      });
      
      expect(result.patterns).toContainEqual(
        expect.objectContaining({
          name: 'Observer Pattern',
          confidence: expect.any(Number),
          locations: expect.arrayContaining(['observer.js'])
        })
      );
    });
    
    it('should analyze Vue.js components', async () => {
      const vueCode = {
        'UserList.vue': `
          <template>
            <div class="user-list">
              <h2>{{ title }}</h2>
              <ul>
                <li v-for="user in users" :key="user.id">
                  {{ user.name }}
                </li>
              </ul>
            </div>
          </template>
          
          <script>
          export default {
            name: 'UserList',
            props: {
              title: {
                type: String,
                default: 'Users'
              }
            },
            data() {
              return {
                users: []
              };
            },
            mounted() {
              this.fetchUsers();
            },
            methods: {
              async fetchUsers() {
                const response = await fetch('/api/users');
                this.users = await response.json();
              }
            }
          };
          </script>
          
          <style scoped>
          .user-list {
            padding: 20px;
          }
          </style>
        `
      };
      
      const result = await analyzer.analyzeWebsiteCode(vueCode, {
        projectPath: '/tmp/test-vue',
        language: 'vue'
      });
      
      expect(result.insights.frameworkDetection).toContainEqual(
        expect.objectContaining({
          name: 'Vue.js',
          confidence: expect.any(Number)
        })
      );
      
      expect(result.symbols).toContainEqual(
        expect.objectContaining({
          name: 'UserList',
          kind: 'component'
        })
      );
    });
  });
  
  describe('Error Handling', () => {
    it('should handle MCP connection failures gracefully', async () => {
      mockClient.simulateDisconnect();
      
      const result = await analyzer.analyzeWebsiteCode(
        { 'test.js': 'console.log("test");' },
        { projectPath: '/tmp/test', language: 'javascript' }
      );
      
      // Should return empty results instead of throwing
      expect(result.symbols).toEqual([]);
      expect(result.patterns).toEqual([]);
      
      // Reconnect for other tests
      await mockClient.connect();
    });
    
    it('should timeout long-running analyses', async () => {
      mockClient.setDelay(10000); // 10 second delay
      
      const promise = analyzer.analyzeWebsiteCode(
        { 'large.js': 'x'.repeat(1000000) }, // Large file
        { projectPath: '/tmp/test-timeout', language: 'javascript' }
      );
      
      await expect(promise).rejects.toThrow(/timeout/i);
      
      mockClient.setDelay(0); // Reset delay
    });
    
    it('should handle malformed code gracefully', async () => {
      const malformedCode = {
        'broken.js': `
          function test() {
            // Missing closing brace
            if (true) {
              console.log('test');
            
          const x = {
            // Missing closing quote
            name: "test
          };
        `
      };
      
      const result = await analyzer.analyzeWebsiteCode(malformedCode, {
        projectPath: '/tmp/test-malformed',
        language: 'javascript'
      });
      
      // Should still return some results
      expect(result).toBeDefined();
      expect(result.errors).toHaveLength(expect.any(Number));
      expect(result.errors[0]).toHaveProperty('message');
      expect(result.errors[0]).toHaveProperty('location');
    });
    
    it('should handle empty projects', async () => {
      const result = await analyzer.analyzeWebsiteCode({}, {
        projectPath: '/tmp/test-empty',
        language: 'javascript'
      });
      
      expect(result.symbols).toEqual([]);
      expect(result.patterns).toEqual([]);
      expect(result.insights.frameworkDetection).toEqual([]);
    });
    
    it('should handle binary files', async () => {
      const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47]).toString();
      
      const result = await analyzer.analyzeWebsiteCode(
        { 'image.png': binaryContent },
        { projectPath: '/tmp/test-binary', language: 'javascript' }
      );
      
      // Should skip binary files
      expect(result.skippedFiles).toContain('image.png');
    });
  });
  
  describe('Performance', () => {
    it('should analyze large codebases efficiently', async () => {
      const largeCodebase: Record<string, string> = {};
      
      // Generate 100 files with various sizes
      for (let i = 0; i < 100; i++) {
        largeCodebase[`file${i}.js`] = `
          // File ${i}
          function process${i}(data) {
            return data.map(item => ({
              ...item,
              processed: true,
              timestamp: Date.now()
            }));
          }
          
          module.exports = { process${i} };
        `;
      }
      
      const startTime = Date.now();
      
      const result = await analyzer.analyzeWebsiteCode(largeCodebase, {
        projectPath: '/tmp/test-large',
        language: 'javascript'
      });
      
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(30000); // 30 seconds
      
      // Should find all functions
      const functionSymbols = result.symbols.filter(s => s.kind === 'function');
      expect(functionSymbols.length).toBeGreaterThanOrEqual(100);
    });
    
    it('should cache analysis results', async () => {
      const testCode = {
        'cached.js': 'function test() { return "cached"; }'
      };
      
      // First analysis
      const startTime1 = Date.now();
      const result1 = await analyzer.analyzeWebsiteCode(testCode, {
        projectPath: '/tmp/test-cache',
        language: 'javascript'
      });
      const duration1 = Date.now() - startTime1;
      
      // Second analysis (should be cached)
      const startTime2 = Date.now();
      const result2 = await analyzer.analyzeWebsiteCode(testCode, {
        projectPath: '/tmp/test-cache',
        language: 'javascript'
      });
      const duration2 = Date.now() - startTime2;
      
      // Cached analysis should be significantly faster
      expect(duration2).toBeLessThan(duration1 / 2);
      
      // Results should be identical
      expect(result2).toEqual(result1);
    });
  });
});