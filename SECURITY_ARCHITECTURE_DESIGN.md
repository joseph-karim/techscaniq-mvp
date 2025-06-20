# TechScanIQ Security Architecture Design

## Table of Contents
1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Authentication Architecture](#authentication-architecture)
4. [Authorization Framework](#authorization-framework)
5. [Secret Management System](#secret-management-system)
6. [API Security Gateway](#api-security-gateway)
7. [Security Monitoring & Alerting](#security-monitoring--alerting)
8. [Implementation Guide](#implementation-guide)

## Overview

This document outlines the target security architecture for TechScanIQ, designed to address identified vulnerabilities and establish enterprise-grade security controls.

### Architecture Goals
- **Zero Trust**: Never trust, always verify
- **Defense in Depth**: Multiple security layers
- **Least Privilege**: Minimal required access
- **Security by Design**: Built-in, not bolted-on
- **Compliance Ready**: SOC 2, GDPR, OWASP

## Architecture Principles

### 1. Zero Trust Network Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Public User   │────▶│   WAF/CDN      │────▶│  Load Balancer  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                           │
                                ┌──────────────────────────┴───────────────┐
                                │         API Gateway (Kong/AWS)           │
                                │  • Authentication  • Rate Limiting       │
                                │  • Authorization   • Request Signing     │
                                └──────────────────────┬───────────────────┘
                                                       │
                        ┌──────────────────────────────┴────────────────────────┐
                        │                                                        │
                ┌───────▼──────────┐                              ┌─────────────▼────────┐
                │   Frontend App   │                              │    Backend API       │
                │   (Next.js)      │                              │    (Express)         │
                └───────┬──────────┘                              └──────────┬──────────┘
                        │                                                     │
                        └─────────────────────┬──────────────────────────────┘
                                              │
                                    ┌─────────▼──────────┐
                                    │    Supabase DB     │
                                    │   (PostgreSQL)     │
                                    │  • RLS Policies    │
                                    │  • Encryption      │
                                    └────────────────────┘
```

### 2. Security Layers
1. **Network Layer**: WAF, DDoS protection, TLS 1.3
2. **Application Layer**: Authentication, authorization, validation
3. **Data Layer**: Encryption, RLS, audit logging
4. **Infrastructure Layer**: Container security, secrets management

## Authentication Architecture

### Multi-Factor Authentication System

```typescript
// Authentication Flow Architecture
interface AuthenticationSystem {
  providers: {
    primary: SupabaseAuth;
    mfa: {
      totp: TOTPProvider;
      sms: SMSProvider;
      backup: BackupCodesProvider;
    };
    oauth: {
      github: GitHubOAuth;
      google: GoogleOAuth;
    };
  };
  
  sessionManagement: {
    store: RedisSessionStore;
    timeout: number; // 30 minutes
    refresh: RefreshTokenStrategy;
  };
  
  security: {
    passwordPolicy: PasswordPolicy;
    accountLockout: LockoutPolicy;
    deviceTracking: DeviceFingerprint;
  };
}
```

### Implementation Components

#### 1. Enhanced Supabase Configuration
```typescript
// /src/lib/auth/secure-client.ts
import { createClient } from '@supabase/supabase-js'
import { AuthConfig } from './types'

export const createSecureAuthClient = (config: AuthConfig) => {
  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: {
        // Custom secure storage implementation
        getItem: (key) => secureStorage.get(key),
        setItem: (key, value) => secureStorage.set(key, value),
        removeItem: (key) => secureStorage.remove(key)
      },
      // Enhanced security settings
      flowType: 'pkce',
      debug: false,
      // MFA configuration
      mfa: {
        factorType: ['totp'],
        verify: true,
        enroll: true
      }
    },
    global: {
      headers: {
        'X-Client-Version': process.env.APP_VERSION,
        'X-Request-ID': generateRequestId()
      }
    }
  })
}
```

#### 2. MFA Implementation
```typescript
// /src/lib/auth/mfa-service.ts
export class MFAService {
  async enrollTOTP(userId: string): Promise<TOTPEnrollment> {
    const secret = authenticator.generateSecret()
    const qrCode = await QRCode.toDataURL(
      authenticator.keyuri(userId, 'TechScanIQ', secret)
    )
    
    // Store encrypted secret
    await vault.store(`mfa:totp:${userId}`, encrypt(secret))
    
    return { qrCode, backupCodes: generateBackupCodes() }
  }
  
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const secret = decrypt(await vault.get(`mfa:totp:${userId}`))
    return authenticator.verify({ token, secret })
  }
  
  async enforceForRole(role: UserRole): Promise<void> {
    if (role === 'admin' || role === 'pe') {
      throw new MFARequiredError()
    }
  }
}
```

#### 3. Session Management
```typescript
// /src/lib/auth/session-manager.ts
export class SecureSessionManager {
  private redis: Redis
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  
  async createSession(user: User): Promise<Session> {
    const session: Session = {
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.SESSION_TIMEOUT,
      fingerprint: await getDeviceFingerprint(),
      ipAddress: getClientIP(),
      userAgent: getUserAgent()
    }
    
    await this.redis.setex(
      `session:${session.id}`,
      this.SESSION_TIMEOUT / 1000,
      JSON.stringify(session)
    )
    
    return session
  }
  
  async validateSession(sessionId: string): Promise<User | null> {
    const session = await this.redis.get(`session:${sessionId}`)
    if (!session) return null
    
    const data = JSON.parse(session)
    
    // Validate fingerprint
    if (data.fingerprint !== await getDeviceFingerprint()) {
      await this.revokeSession(sessionId)
      throw new SessionHijackingError()
    }
    
    // Extend session
    await this.extendSession(sessionId)
    
    return await getUserById(data.userId)
  }
}
```

## Authorization Framework

### Policy-Based Access Control (PBAC)

```typescript
// /src/lib/auth/authorization.ts
import { OPA } from '@styra/opa'

export class AuthorizationService {
  private opa: OPA
  
  constructor() {
    this.opa = new OPA({
      url: process.env.OPA_URL,
      // Policies defined in Rego
    })
  }
  
  async authorize(
    user: User,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    const input = {
      user: {
        id: user.id,
        roles: user.roles,
        permissions: user.permissions,
        workspace: user.workspace_id
      },
      resource,
      action,
      context,
      time: new Date().toISOString()
    }
    
    const result = await this.opa.evaluate('authz/allow', input)
    
    // Audit log
    await auditLog.record({
      userId: user.id,
      resource,
      action,
      allowed: result.result,
      timestamp: new Date()
    })
    
    return result.result
  }
}
```

### Resource-Level Permissions

```sql
-- Enhanced RLS Policies
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Demo access reports" ON reports;
DROP POLICY IF EXISTS "Demo insert reports" ON reports;

-- Workspace isolation
CREATE POLICY "Users can only access their workspace data"
  ON reports
  FOR ALL
  USING (
    workspace_id = current_setting('app.workspace_id')::uuid
    AND EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = reports.workspace_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Role-based access
CREATE POLICY "Admins have full access"
  ON reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Granular permissions
CREATE POLICY "Users can only modify their own reports"
  ON reports
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

## Secret Management System

### HashiCorp Vault Integration

```typescript
// /src/lib/secrets/vault-client.ts
import vault from 'node-vault'

export class SecretManager {
  private client: vault.client
  private cache: Map<string, CachedSecret> = new Map()
  
  constructor() {
    this.client = vault({
      endpoint: process.env.VAULT_ADDR,
      token: process.env.VAULT_TOKEN // Initial token, will use AppRole
    })
    
    this.initializeAppRole()
  }
  
  private async initializeAppRole() {
    const roleId = process.env.VAULT_ROLE_ID
    const secretId = await this.getSecretId()
    
    const auth = await this.client.approleLogin({
      role_id: roleId,
      secret_id: secretId
    })
    
    this.client.token = auth.auth.client_token
    
    // Auto-renew token
    setInterval(() => this.renewToken(), 3600000) // 1 hour
  }
  
  async getSecret(path: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(path)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value
    }
    
    // Fetch from Vault
    const response = await this.client.read(`secret/data/${path}`)
    const value = response.data.data.value
    
    // Cache with TTL
    this.cache.set(path, {
      value,
      expiresAt: Date.now() + 300000 // 5 minutes
    })
    
    return value
  }
  
  async rotateSecret(path: string): Promise<void> {
    const newValue = generateSecureToken()
    
    await this.client.write(`secret/data/${path}`, {
      data: { value: newValue },
      options: { cas: 0 }
    })
    
    // Clear cache
    this.cache.delete(path)
    
    // Notify services
    await this.notifyRotation(path)
  }
}
```

### API Key Rotation System

```typescript
// /src/lib/secrets/key-rotation.ts
export class APIKeyRotation {
  private scheduler: Scheduler
  private services: Map<string, ServiceConfig> = new Map([
    ['openai', { rotationDays: 90, provider: 'openai' }],
    ['anthropic', { rotationDays: 90, provider: 'anthropic' }],
    ['supabase', { rotationDays: 30, provider: 'supabase' }]
  ])
  
  async scheduleRotations() {
    for (const [service, config] of this.services) {
      await this.scheduler.schedule({
        name: `rotate-${service}`,
        cron: `0 0 */${config.rotationDays} * *`,
        handler: () => this.rotateServiceKey(service)
      })
    }
  }
  
  private async rotateServiceKey(service: string) {
    const config = this.services.get(service)
    
    // Generate new key from provider
    const newKey = await this.generateNewKey(config.provider)
    
    // Update in Vault
    await secretManager.rotateSecret(`api-keys/${service}`)
    
    // Update application
    await this.updateApplicationConfig(service, newKey)
    
    // Verify new key works
    await this.verifyKey(service, newKey)
    
    // Revoke old key after grace period
    setTimeout(() => this.revokeOldKey(service), 3600000) // 1 hour
  }
}
```

## API Security Gateway

### Kong Gateway Configuration

```yaml
# /infrastructure/kong/kong.yml
_format_version: "2.1"

services:
  - name: techscaniq-api
    url: http://backend:3001
    
routes:
  - name: api-route
    service: techscaniq-api
    paths:
      - /api
    
plugins:
  # Authentication
  - name: jwt
    config:
      key_claim_name: sub
      secret_is_base64: false
      
  # Rate Limiting
  - name: rate-limiting
    config:
      minute: 60
      hour: 1000
      policy: local
      
  # Request Validation
  - name: request-validator
    config:
      body_schema: |
        {
          "type": "object",
          "required": ["data"],
          "properties": {
            "data": { "type": "object" }
          }
        }
        
  # Security Headers
  - name: response-transformer
    config:
      add:
        headers:
          - "X-Frame-Options: DENY"
          - "X-Content-Type-Options: nosniff"
          - "X-XSS-Protection: 1; mode=block"
          - "Strict-Transport-Security: max-age=31536000"
          
  # CORS
  - name: cors
    config:
      origins:
        - https://techscaniq.com
      methods:
        - GET
        - POST
        - PUT
        - DELETE
      headers:
        - Accept
        - Authorization
        - Content-Type
      credentials: true
      max_age: 3600
```

### Request Signing

```typescript
// /src/lib/api/request-signing.ts
import crypto from 'crypto'

export class RequestSigner {
  private readonly algorithm = 'sha256'
  
  signRequest(
    method: string,
    path: string,
    body: any,
    timestamp: number,
    secretKey: string
  ): string {
    const message = [
      method.toUpperCase(),
      path,
      timestamp,
      body ? JSON.stringify(body) : ''
    ].join('\n')
    
    return crypto
      .createHmac(this.algorithm, secretKey)
      .update(message)
      .digest('hex')
  }
  
  verifySignature(
    request: Request,
    secretKey: string,
    maxAge: number = 300000 // 5 minutes
  ): boolean {
    const signature = request.headers['x-signature']
    const timestamp = parseInt(request.headers['x-timestamp'])
    
    // Check timestamp
    if (Date.now() - timestamp > maxAge) {
      throw new Error('Request expired')
    }
    
    // Verify signature
    const expected = this.signRequest(
      request.method,
      request.path,
      request.body,
      timestamp,
      secretKey
    )
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  }
}
```

## Security Monitoring & Alerting

### Comprehensive Logging

```typescript
// /src/lib/monitoring/security-logger.ts
import winston from 'winston'
import { DatadogTransport } from './datadog-transport'

export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'techscaniq',
    environment: process.env.NODE_ENV
  },
  transports: [
    new DatadogTransport({
      apiKey: process.env.DATADOG_API_KEY,
      service: 'techscaniq-security'
    }),
    new winston.transports.File({
      filename: 'security.log',
      level: 'warning'
    })
  ]
})

// Security event types
export const logSecurityEvent = (event: SecurityEvent) => {
  const logData = {
    eventType: event.type,
    userId: event.userId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    resource: event.resource,
    action: event.action,
    result: event.result,
    metadata: event.metadata,
    timestamp: new Date().toISOString()
  }
  
  // Determine severity
  const severity = determineSeverity(event)
  
  securityLogger.log(severity, 'Security Event', logData)
  
  // Real-time alerting for critical events
  if (severity === 'error' || severity === 'critical') {
    alertingService.send({
      channel: 'security-critical',
      message: `Critical security event: ${event.type}`,
      data: logData
    })
  }
}
```

### Intrusion Detection

```typescript
// /src/lib/monitoring/intrusion-detection.ts
export class IntrusionDetectionSystem {
  private patterns: SecurityPattern[] = [
    {
      name: 'brute_force_attack',
      condition: (events) => {
        const failedLogins = events.filter(e => 
          e.type === 'login_failed' && 
          e.timestamp > Date.now() - 300000 // 5 minutes
        )
        return failedLogins.length > 5
      },
      action: 'block_ip'
    },
    {
      name: 'sql_injection_attempt',
      condition: (events) => {
        return events.some(e => 
          e.type === 'invalid_input' &&
          /(\bUNION\b|\bSELECT\b.*\bFROM\b|\bDROP\b|\bDELETE\b)/i.test(e.metadata.input)
        )
      },
      action: 'block_request'
    },
    {
      name: 'api_abuse',
      condition: (events) => {
        const apiCalls = events.filter(e => 
          e.type === 'api_call' && 
          e.timestamp > Date.now() - 60000 // 1 minute
        )
        return apiCalls.length > 100
      },
      action: 'rate_limit'
    }
  ]
  
  async analyze(userId: string, ipAddress: string): Promise<SecurityAction[]> {
    const events = await this.getRecentEvents(userId, ipAddress)
    const actions: SecurityAction[] = []
    
    for (const pattern of this.patterns) {
      if (pattern.condition(events)) {
        actions.push({
          type: pattern.action,
          reason: pattern.name,
          target: ipAddress || userId,
          duration: this.getActionDuration(pattern.action)
        })
        
        // Log detection
        logSecurityEvent({
          type: 'intrusion_detected',
          userId,
          ipAddress,
          metadata: { pattern: pattern.name }
        })
      }
    }
    
    return actions
  }
}
```

## Implementation Guide

### Phase 1: Foundation (Week 1-2)

1. **Security Headers & CORS**
```typescript
// /src/api/middleware/security.ts
import helmet from 'helmet'
import cors from 'cors'

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Gradually tighten
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.VITE_SUPABASE_URL],
        frameAncestors: ["'none'"],
        formAction: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),
  
  cors({
    origin: function(origin, callback) {
      const allowedOrigins = [
        'https://techscaniq.com',
        'https://www.techscaniq.com'
      ]
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    maxAge: 86400 // 24 hours
  })
]
```

2. **Input Validation**
```typescript
// /src/api/middleware/validation.ts
import { body, param, query, validationResult } from 'express-validator'
import DOMPurify from 'isomorphic-dompurify'

export const validateScanRequest = [
  body('url')
    .isURL({ protocols: ['http', 'https'] })
    .normalizeURL()
    .customSanitizer(value => DOMPurify.sanitize(value)),
    
  body('scanType')
    .isIn(['security', 'performance', 'seo', 'accessibility'])
    .trim(),
    
  body('depth')
    .optional()
    .isInt({ min: 1, max: 5 })
    .toInt(),
    
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array(),
        message: 'Validation failed'
      })
    }
    next()
  }
]
```

### Phase 2: Authentication (Week 3-4)

1. **Remove Mock Authentication**
```typescript
// /src/lib/auth/auth-provider.tsx
// DELETE all mock authentication code
// Replace with:
export const useAuth = () => {
  const supabase = useSupabase()
  
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }
  
  // Real authentication only
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    // Check MFA requirement
    if (await mfaService.isRequired(data.user)) {
      return { requiresMFA: true, userId: data.user.id }
    }
    
    return data
  }
  
  // ... rest of auth methods
}
```

2. **Implement MFA**
```typescript
// /src/components/auth/mfa-setup.tsx
export const MFASetup: React.FC = () => {
  const [qrCode, setQrCode] = useState<string>()
  const [backupCodes, setBackupCodes] = useState<string[]>()
  
  const setupMFA = async () => {
    const { qrCode, backupCodes } = await api.post('/auth/mfa/enroll')
    setQrCode(qrCode)
    setBackupCodes(backupCodes)
  }
  
  return (
    <div className="mfa-setup">
      <h2>Setup Two-Factor Authentication</h2>
      
      {qrCode && (
        <>
          <img src={qrCode} alt="MFA QR Code" />
          <p>Scan this code with your authenticator app</p>
          
          <div className="backup-codes">
            <h3>Backup Codes (save these!)</h3>
            {backupCodes.map(code => (
              <code key={code}>{code}</code>
            ))}
          </div>
        </>
      )}
      
      <button onClick={setupMFA}>Enable MFA</button>
    </div>
  )
}
```

### Phase 3: Secret Management (Week 5-6)

1. **Vault Setup**
```bash
# Initialize Vault
vault operator init
vault operator unseal

# Enable AppRole auth
vault auth enable approle

# Create policy
vault policy write techscaniq-policy - <<EOF
path "secret/data/techscaniq/*" {
  capabilities = ["read", "list"]
}
path "secret/metadata/techscaniq/*" {
  capabilities = ["list"]
}
EOF

# Create role
vault write auth/approle/role/techscaniq \
  token_policies="techscaniq-policy" \
  token_ttl=1h \
  token_max_ttl=4h
```

2. **Application Integration**
```typescript
// /src/lib/config/secrets.ts
export const getAPIKey = async (service: string): Promise<string> => {
  return await secretManager.getSecret(`api-keys/${service}`)
}

// Usage
const openAIKey = await getAPIKey('openai')
const anthropicKey = await getAPIKey('anthropic')
```

### Phase 4: Monitoring (Week 7-8)

1. **Security Dashboard**
```typescript
// /src/pages/admin/security-dashboard.tsx
export const SecurityDashboard: React.FC = () => {
  const { data: metrics } = useSecurityMetrics()
  
  return (
    <Dashboard>
      <MetricCard
        title="Failed Login Attempts"
        value={metrics.failedLogins}
        trend={metrics.failedLoginsTrend}
        severity={metrics.failedLogins > 10 ? 'high' : 'low'}
      />
      
      <MetricCard
        title="API Rate Limit Hits"
        value={metrics.rateLimitHits}
        trend={metrics.rateLimitTrend}
      />
      
      <MetricCard
        title="Security Events"
        value={metrics.securityEvents}
        breakdown={metrics.eventsByType}
      />
      
      <AlertsList alerts={metrics.activeAlerts} />
    </Dashboard>
  )
}
```

2. **Automated Response**
```typescript
// /src/lib/security/automated-response.ts
export class AutomatedSecurityResponse {
  async handleThreat(threat: SecurityThreat) {
    switch (threat.type) {
      case 'brute_force':
        await this.blockIP(threat.sourceIP, '1h')
        await this.notifyAdmins(threat)
        break
        
      case 'api_abuse':
        await this.enforceStrictRateLimit(threat.userId)
        await this.requireReauthentication(threat.userId)
        break
        
      case 'suspicious_activity':
        await this.triggerMFAChallenge(threat.userId)
        await this.logDetailedAudit(threat)
        break
    }
  }
}
```

## Security Checklist

### Pre-Deployment
- [ ] All API keys rotated and in Vault
- [ ] Mock authentication removed
- [ ] Security headers scoring A+
- [ ] Input validation on all endpoints
- [ ] RLS policies implemented
- [ ] MFA enabled for admins
- [ ] Monitoring dashboard live
- [ ] Incident response plan tested

### Post-Deployment
- [ ] Security scan completed
- [ ] Penetration test scheduled
- [ ] Team security training done
- [ ] Compliance audit passed
- [ ] Security metrics baseline set
- [ ] Automated alerts configured
- [ ] Backup procedures tested
- [ ] Disaster recovery plan validated

## Conclusion

This security architecture provides defense-in-depth protection for TechScanIQ, addressing all identified vulnerabilities while establishing a foundation for future growth. The implementation follows security best practices and positions the platform for enterprise readiness and compliance certification.