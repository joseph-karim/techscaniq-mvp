# Development Setup Guide

This guide covers setting up the TechScanIQ development environment to avoid CORS issues and ensure smooth local development.

## Overview

TechScanIQ is configured to work with specific domains to maintain security. The application supports both production domains and localhost development environments with proper CORS configuration.

## Supported Development URLs

The application is configured to work with these localhost URLs:

- `http://localhost:5173` - Vite development server (default)
- `http://localhost:3000` - Alternative development server
- `https://scan.techscaniq.com` - Production domain
- `https://techscaniq.com` - Production domain

## Development Server Setup

### Option 1: Vite Default (Recommended)

```bash
# Start the development server on default port
npm run dev
```

This will start the server on `http://localhost:5173`, which is pre-configured in our CORS settings.

### Option 2: Custom Port 3000

If you need to use port 3000, you can configure Vite:

```bash
# Start on port 3000
npm run dev -- --port 3000
```

Or update your `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  // ... other config
})
```

### Option 3: Custom Port (Advanced)

If you need to use a different port, you'll need to:

1. **Update the edge function CORS configuration** in:
   - `/supabase/functions/evidence-collector-v7/index.ts`
   - `/supabase/functions/evidence-orchestrator/index.ts`

2. **Add your port to the allowedOrigins array**:

```typescript
const allowedOrigins = [
  'https://scan.techscaniq.com',
  'https://techscaniq.com', 
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:YOUR_PORT'  // Add your custom port
]
```

3. **Redeploy the edge functions**:

```bash
supabase functions deploy evidence-collector-v7
supabase functions deploy evidence-orchestrator
```

## Environment Variables

Ensure your `.env.local` file contains the correct Supabase configuration:

```bash
VITE_SUPABASE_URL=https://xngbtpbtivygkxnsexjg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## CORS Configuration Details

### Frontend to Edge Functions

The TechScanIQ frontend makes requests to Supabase edge functions for:

- Evidence collection (`evidence-orchestrator`)
- Evidence processing (`evidence-collector-v7`)
- Report generation
- Admin configuration

These functions use dynamic CORS headers that check the request origin against an allowlist.

### Supabase Authentication

For authentication redirects, ensure the Supabase dashboard is configured with:

**Authentication > URL Configuration:**
- Site URL: `http://localhost:5173` (for development)
- Additional Redirect URLs:
  - `http://localhost:5173/**`
  - `http://localhost:3000/**`
  - `https://scan.techscaniq.com/**`
  - `https://techscaniq.com/**`

## Common CORS Issues and Solutions

### Issue 1: "Access to fetch blocked by CORS policy"

**Symptoms:**
```
Access to fetch at 'https://xngbtpbtivygkxnsexjg.supabase.co/functions/v1/evidence-orchestrator' 
from origin 'http://localhost:XXXX' has been blocked by CORS policy
```

**Solutions:**
1. Ensure you're using an allowed localhost port (5173 or 3000)
2. Check that edge functions are deployed with updated CORS configuration
3. Verify your development server is running on the correct port

### Issue 2: "Failed to fetch" errors

**Symptoms:**
- Network errors in browser console
- "Unable to connect to evidence collection service" messages

**Solutions:**
1. Check if Supabase edge functions are deployed and running
2. Verify your `VITE_SUPABASE_URL` environment variable
3. Ensure you're not behind a firewall blocking Supabase requests

### Issue 3: Authentication redirect loops

**Symptoms:**
- Infinite redirects during login/logout
- "Invalid redirect URL" errors

**Solutions:**
1. Update Supabase dashboard Authentication settings
2. Ensure localhost URLs are in the redirect allowlist
3. Check that your Site URL matches your development port

## Testing CORS Configuration

### 1. Verify Edge Function CORS

Test that the evidence-orchestrator function accepts your localhost origin:

```bash
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  https://xngbtpbtivygkxnsexjg.supabase.co/functions/v1/evidence-orchestrator
```

Expected response should include:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: POST, GET, OPTIONS
```

### 2. Test from Browser Console

In your browser's development console, test the connection:

```javascript
fetch('https://xngbtpbtivygkxnsexjg.supabase.co/functions/v1/evidence-orchestrator', {
  method: 'OPTIONS',
  headers: {
    'Origin': window.location.origin
  }
})
.then(response => console.log('CORS test successful:', response.status))
.catch(error => console.error('CORS test failed:', error))
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

### 2. Verify Port

Ensure the server starts on port 5173 or 3000. Check the terminal output:

```
Local:   http://localhost:5173/
Network: use --host to expose
```

### 3. Test Evidence Collection

1. Navigate to Admin Dashboard: `/admin/dashboard`
2. Go to Scan Configuration: `/admin/scan-config`
3. Try triggering evidence collection
4. Check browser console for any CORS errors

### 4. Common Development Commands

```bash
# Start development server
npm run dev

# Start on specific port
npm run dev -- --port 3000

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run type-check

# Deploy edge functions (if you made changes)
supabase functions deploy evidence-orchestrator
supabase functions deploy evidence-collector-v7
```

## Production Deployment Notes

When deploying to production:

1. **Update environment variables** for production URLs
2. **Verify Supabase Authentication settings** use production domains
3. **Test CORS configuration** with production domains
4. **Monitor edge function logs** for any CORS-related errors

## Troubleshooting Checklist

- [ ] Development server running on port 5173 or 3000
- [ ] Environment variables properly configured
- [ ] Supabase edge functions deployed with latest CORS configuration
- [ ] Supabase Authentication redirect URLs updated
- [ ] Browser cache cleared (if testing after configuration changes)
- [ ] No browser extensions blocking requests
- [ ] Network connectivity to Supabase services

## Getting Help

If you encounter CORS issues not covered in this guide:

1. Check the browser console for specific error messages
2. Verify the exact origin being sent in requests
3. Test with curl to isolate frontend vs backend issues
4. Check Supabase edge function logs for server-side errors

## Related Files

- Edge function CORS config: `/supabase/functions/evidence-collector-v7/index.ts`
- Edge function CORS config: `/supabase/functions/evidence-orchestrator/index.ts`
- Vite configuration: `/vite.config.ts`
- Environment variables: `.env.local`
- CORS setup script: `/update-supabase-cors.js`