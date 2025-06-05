# Security Guidelines

This document outlines the security measures implemented in TechScanIQ and guidelines for maintaining security.

## Environment Variables

**✅ Secure Implementation:**
- All sensitive credentials are stored in environment variables
- No hardcoded API keys or secrets in the codebase
- `.env.local` is in `.gitignore` to prevent accidental commits

**🔒 Required Environment Variables:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## CORS Configuration

**✅ Secure Implementation:**
- Domain-specific CORS allowlist (no wildcards in production)
- Dynamic CORS headers based on request origin
- Credentials support only for authorized domains

**🔒 Authorized Domains:**
- `https://scan.techscaniq.com` (Production)
- `https://techscaniq.com` (Legacy)
- `http://localhost:5173`, `http://localhost:5174`, `http://localhost:3000` (Development)

**❌ Security Risks Mitigated:**
- No `Access-Control-Allow-Origin: *` in production
- Unauthorized domains cannot access the API
- CORS credentials are properly scoped

## Edge Function Security

**✅ Secure Implementation:**
- All edge functions use dynamic CORS configuration
- Authentication required for data operations
- Input validation and sanitization
- Proper error handling without information leakage

**🔒 Security Headers:**
```javascript
const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  }
}
```

## Database Security

**✅ Secure Implementation:**
- Row Level Security (RLS) policies enabled
- Supabase authentication integration
- Role-based access control (Admin, PE User, Advisor)
- Data isolation between users and organizations

**🔒 RLS Policies:**
- Users can only access their own scan requests
- Admins have elevated privileges for configuration
- Evidence data is properly scoped

## Authentication & Authorization

**✅ Secure Implementation:**
- JWT-based authentication via Supabase Auth
- Secure redirect URLs configured
- Session management handled by Supabase
- Multi-role support with proper authorization

**🔒 Redirect URLs (Production):**
- `https://scan.techscaniq.com/**`
- `https://techscaniq.com/**`

## Development Security

**✅ Secure Development Practices:**
- Localhost ports explicitly whitelisted for development
- Test files use environment variables, not hardcoded secrets
- Comprehensive CORS testing before deployment
- Security-first documentation

**🔒 Development Checklist:**
- [ ] Use approved localhost ports (5173, 5174, 3000)
- [ ] Never commit API keys or secrets
- [ ] Test CORS configuration after changes
- [ ] Verify RLS policies are working
- [ ] Use environment variables in test scripts

## Deployment Security

**✅ Secure Deployment:**
- Edge functions deployed with latest security configurations
- Production domains properly configured
- No development URLs in production settings
- Regular security updates and monitoring

**🔒 Pre-Deployment Checklist:**
- [ ] All edge functions updated with secure CORS
- [ ] Environment variables properly set
- [ ] No hardcoded credentials in codebase
- [ ] Supabase dashboard configured correctly
- [ ] CORS testing passed for all authorized domains
- [ ] RLS policies verified

## File Security

**✅ Files Excluded from Version Control:**
- `.env.local` - Local environment variables
- `.env` - Environment configuration
- Any files containing API keys or secrets

**✅ Files Safe for Version Control:**
- Test scripts (using environment variables)
- Configuration templates
- Documentation
- Source code (no embedded secrets)

## Security Testing

**🔧 Automated Tests:**
- CORS configuration validation
- Edge function security testing
- Authentication flow verification
- Unauthorized access prevention

**🔧 Manual Security Checks:**
- Regular review of Supabase dashboard settings
- Monitoring of edge function logs
- Verification of RLS policy effectiveness
- Review of user access patterns

## Incident Response

**🚨 If Security Issue Detected:**
1. Immediately rotate affected API keys
2. Review and update CORS configuration
3. Check edge function logs for unauthorized access
4. Verify RLS policies are correctly applied
5. Update authentication settings if needed

## Security Contacts

- **Security Issues:** Report via GitHub Issues (for non-sensitive issues)
- **Sensitive Security Issues:** Contact project maintainers directly

## Regular Security Maintenance

**📅 Monthly:**
- Review Supabase dashboard security settings
- Update dependencies with security patches
- Check edge function logs for anomalies
- Verify CORS configuration is still appropriate

**📅 Quarterly:**
- Full security audit of codebase
- Review and update RLS policies
- Update authentication and authorization flows
- Security training for development team

## Compliance Notes

- GDPR considerations for EU users
- Data retention policies
- User consent management
- Right to data portability implementation

---

**Last Updated:** June 2025
**Next Security Review:** September 2025