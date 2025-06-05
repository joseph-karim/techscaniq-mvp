# CORS Troubleshooting Quick Reference

This is a quick reference for resolving CORS issues during development and testing.

## Quick Diagnostic Commands

### 1. Check Your Development Server Port

```bash
# If using npm/yarn
npm run dev
# Look for output like: "Local: http://localhost:5173/"

# If using a specific port
npm run dev -- --port 3000
```

### 2. Test CORS with curl

```bash
# Test evidence-orchestrator CORS
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  https://xngbtpbtivygkxnsexjg.supabase.co/functions/v1/evidence-orchestrator

# Test evidence-collector-v7 CORS
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  https://xngbtpbtivygkxnsexjg.supabase.co/functions/v1/evidence-collector-v7
```

### 3. Browser Console Test

```javascript
// Paste this in your browser console to test CORS
fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evidence-orchestrator`, {
  method: 'OPTIONS',
}).then(r => console.log('CORS OK:', r.status)).catch(console.error)
```

## Common Error Messages and Fixes

### Error: "Access to fetch has been blocked by CORS policy"

**Full error usually looks like:**
```
Access to fetch at 'https://xngbtpbtivygkxnsexjg.supabase.co/functions/v1/evidence-orchestrator' 
from origin 'http://localhost:XXXX' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Fix Options:**

1. **Use allowed ports:**
   ```bash
   npm run dev -- --port 5173  # or 3000
   ```

2. **Add your port to CORS allowlist:**
   - Edit `/supabase/functions/evidence-orchestrator/index.ts`
   - Add your port to `allowedOrigins` array
   - Redeploy: `supabase functions deploy evidence-orchestrator`

### Error: "Failed to fetch"

**Usually appears as:**
```
TypeError: Failed to fetch
```

**Diagnosis:**
```bash
# Check if edge functions are accessible
curl https://xngbtpbtivygkxnsexjg.supabase.co/functions/v1/evidence-orchestrator

# Should return method not allowed (405) for GET, which means it's running
```

**Fix Options:**
1. Check internet connection
2. Verify Supabase URL in environment variables
3. Check if you're behind a corporate firewall

### Error: "Preflight request doesn't pass access control check"

**Fix:**
1. Ensure edge functions are deployed with latest CORS configuration
2. Check that your origin is in the `allowedOrigins` array

## Port-Specific Solutions

### Default Vite Port (5173) - Recommended

```bash
npm run dev
# Should start on http://localhost:5173 automatically
```

✅ **Pre-configured in CORS settings** - No additional setup needed

### Alternative Port (3000)

```bash
npm run dev -- --port 3000
```

✅ **Pre-configured in CORS settings** - No additional setup needed

### Custom Port (e.g., 8080)

**Step 1:** Update edge function CORS configuration

```typescript
// In /supabase/functions/evidence-orchestrator/index.ts
// And /supabase/functions/evidence-collector-v7/index.ts

const allowedOrigins = [
  'https://scan.techscaniq.com',
  'https://techscaniq.com', 
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080'  // Add your port here
]
```

**Step 2:** Redeploy edge functions

```bash
supabase functions deploy evidence-orchestrator
supabase functions deploy evidence-collector-v7
```

**Step 3:** Start your server

```bash
npm run dev -- --port 8080
```

## Environment-Specific Configurations

### Development (.env.local)

```bash
VITE_SUPABASE_URL=https://xngbtpbtivygkxnsexjg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Production

Update Supabase Authentication settings to include production domains:
- Site URL: `https://scan.techscaniq.com`
- Redirect URLs: `https://scan.techscaniq.com/**`

## Testing Checklist

Before reporting CORS issues, verify:

- [ ] Using ports 5173 or 3000
- [ ] Edge functions deployed recently
- [ ] Environment variables set correctly
- [ ] Browser cache cleared
- [ ] No ad blockers interfering
- [ ] Console shows correct origin in requests

## Emergency Fixes

### If you need to quickly disable CORS checking (DEVELOPMENT ONLY)

**Option 1:** Start Chrome with disabled security (NOT RECOMMENDED)
```bash
# macOS
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security

# Windows
chrome.exe --user-data-dir="c:/temp" --disable-web-security

# Linux
google-chrome --user-data-dir="/tmp/chrome_dev_test" --disable-web-security
```

**Option 2:** Use Firefox with CORS disabled (NOT RECOMMENDED)
```
about:config -> security.fileuri.strict_origin_policy -> false
```

⚠️ **WARNING:** Only use these for testing. Never use in production or with real data.

## Production Deployment Checklist

When deploying to production:

- [ ] Update Supabase Authentication Site URL
- [ ] Add production domain to redirect URLs
- [ ] Test CORS with production domain
- [ ] Remove any localhost URLs from production environment
- [ ] Verify edge functions use latest CORS configuration

## Getting More Help

### Debug Information to Collect

When asking for help, provide:

1. **Exact error message** from browser console
2. **Your development port** (check URL bar)
3. **Network tab** showing the failed request headers
4. **Output of CORS test commands** from this guide

### Useful Browser Developer Tools

1. **Network Tab:** Shows actual request/response headers
2. **Console Tab:** Shows JavaScript errors and CORS messages
3. **Application Tab:** Check if service workers are interfering

### Log Files to Check

- Browser console (F12)
- Supabase edge function logs (Supabase dashboard)
- Terminal output from `npm run dev`