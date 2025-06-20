# CSP (Content Security Policy) Fix Documentation

## Overview
This document describes the fixes implemented to resolve Content Security Policy (CSP) blocking issues in the TechScanIQ report viewer, particularly affecting the LangGraph report API communication.

## Problem Summary
The application was experiencing CSP violations that prevented:
- API calls to `techscaniq-mvp.onrender.com`
- Dynamic loading of LangGraph reports
- WebSocket connections for real-time updates
- Potential blocking of external resources (fonts, styles)

## Root Cause Analysis
1. **Overly Restrictive CSP**: The original CSP was missing some required domains
2. **API URL Configuration**: The API URL needed to be explicitly included in `connect-src`
3. **Missing CSP Monitoring**: No visibility into CSP violations during development
4. **Fallback Mechanism**: Demo reports were failing when API was blocked

## Implemented Solutions

### 1. Updated CSP Configuration in `netlify.toml`
```toml
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com https://cdn.tailwindcss.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com https://api.fontshare.com https://cdn.fontshare.com; connect-src 'self' https://techscaniq-mvp.onrender.com https://techscaniq-mvp.onrender.com/api https://*.supabase.co https://*.supabase.com wss://*.supabase.co wss://*.supabase.com http://localhost:* ws://localhost:*; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';"
```

Key additions:
- Added `https://techscaniq-mvp.onrender.com/api` to `connect-src`
- Added CDN domains for scripts and styles
- Added `blob:` to `img-src` and `worker-src`
- Added localhost connections for development

### 2. CSP Monitoring and Debugging Tools

#### CSP Configuration Module (`/src/lib/security/csp.ts`)
- Centralized CSP source management
- CSP header generation utility
- Violation logging setup

#### CSP Debugger Component (`/src/components/debug/CSPDebugger.tsx`)
- Real-time CSP violation monitoring in development
- Visual display of violations
- Export violations for analysis

#### CSP Test Page (`/src/pages/test/csp-test.tsx`)
- Comprehensive testing of CSP directives
- Validates API connections, scripts, styles, fonts, WebSocket, and workers

### 3. Enhanced Error Handling in LangGraph Service
Updated `/src/services/langgraph-reports.ts` with:
- Detailed error logging for network failures
- CSP-specific error detection
- Automatic fallback to local files for demo reports
- Clear debugging messages for CSP issues

### 4. Environment Configuration Helper
Created `/src/lib/config/environment.ts` to:
- Centralize environment variable management
- Validate required configurations
- Provide consistent API URL handling

## Testing the Fix

### 1. Deploy Changes
```bash
# Build and deploy to Netlify
npm run build
netlify deploy --prod
```

### 2. Verify CSP Headers
1. Open Chrome DevTools > Network tab
2. Load the application
3. Select the main document request
4. Check Response Headers for `Content-Security-Policy`

### 3. Test API Connectivity
```javascript
// In browser console
fetch('https://techscaniq-mvp.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### 4. Monitor CSP Violations
1. Open the application in development mode
2. Look for the CSP Debugger widget (bottom-right corner)
3. Any violations will appear in real-time

### 5. Run CSP Test Suite
Navigate to `/test/csp-test` to run comprehensive CSP tests

## Environment Configuration

### Required Environment Variables
```env
# API Configuration
VITE_API_URL=https://techscaniq-mvp.onrender.com/api

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Local Development
For local development, the CSP allows `http://localhost:*` connections automatically.

## Troubleshooting

### Issue: API calls still blocked
1. Check browser console for specific CSP violations
2. Verify `VITE_API_URL` is set correctly
3. Ensure the API domain is in `connect-src` directive
4. Clear browser cache and reload

### Issue: Fonts not loading
1. Check if font domains are in `font-src` directive
2. Verify HTTPS is used for font URLs
3. Check for mixed content warnings

### Issue: Scripts blocked
1. Ensure required CDNs are in `script-src`
2. Consider using nonces for inline scripts in production
3. Avoid using `eval()` in production code

## Security Considerations

### Current Security Trade-offs
1. **`unsafe-inline` and `unsafe-eval`**: Required for development and some libraries
   - Consider implementing nonce-based CSP in production
   - Audit code to remove `eval()` usage

2. **Broad `img-src`**: Allows any HTTPS images
   - Consider restricting to specific domains in production

3. **Localhost in Production**: Currently allows localhost connections
   - Remove `http://localhost:*` from production CSP

### Recommended Production CSP
For production, consider this more restrictive policy:
```toml
Content-Security-Policy = "default-src 'self'; script-src 'self' 'nonce-{NONCE}' https://cdn.tailwindcss.com; style-src 'self' 'nonce-{NONCE}' https://fonts.googleapis.com; img-src 'self' data: https://techscaniq.com https://*.supabase.co; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://techscaniq-mvp.onrender.com https://*.supabase.co wss://*.supabase.co; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;"
```

## Monitoring and Maintenance

### 1. CSP Violation Reporting
Consider implementing a CSP report endpoint:
```javascript
// Add to CSP header
report-uri /api/csp-report;

// Implement endpoint to log violations
app.post('/api/csp-report', (req, res) => {
  console.log('CSP Violation:', req.body);
  // Send to monitoring service
});
```

### 2. Regular Audits
- Review CSP violations monthly
- Update allowed domains as needed
- Remove unused domains
- Test after any infrastructure changes

### 3. Documentation Updates
- Keep this document updated with any CSP changes
- Document new external services added
- Maintain a list of allowed domains and their purposes

## Conclusion
The CSP configuration has been updated to allow necessary API communications while maintaining security. The debugging tools provided will help identify and resolve any future CSP issues quickly.