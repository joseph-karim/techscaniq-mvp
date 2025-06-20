# Responsible Disclosure Protocol for TechScanIQ

## Overview
When TechScanIQ discovers potential security vulnerabilities during research, we follow responsible disclosure practices to ensure organizations can address issues before they're exploited.

## What We Consider Reportable

### High Priority
- Exposed API documentation (Swagger/OpenAPI) without authentication
- GraphQL endpoints allowing full schema introspection
- Exposed admin panels or internal tools
- API keys or credentials in public endpoints
- Database connection strings or internal URLs

### Medium Priority  
- Overly permissive CORS policies
- Missing security headers on sensitive endpoints
- Outdated/vulnerable framework versions
- Information disclosure through error messages

### Low Priority
- Missing security headers on static content
- Non-HTTPS resources
- Outdated SSL/TLS configurations

## Disclosure Process

### 1. Initial Discovery
- Document the finding with timestamps
- Take screenshots (without attempting exploitation)
- Record exact URLs and response codes

### 2. Verification
- Confirm the issue is reproducible
- Ensure it's not intentionally public
- Check if it exposes sensitive data

### 3. Contact Process
- Find security contact (security@domain, security.txt, bug bounty program)
- If none exists, contact general support with "Security Disclosure" subject
- Use encrypted communication when possible

### 4. Disclosure Timeline
- **Day 0**: Initial private disclosure to organization
- **Day 1-7**: Await acknowledgment 
- **Day 14**: Follow up if no response
- **Day 30**: Second follow up
- **Day 90**: Consider coordinated disclosure with CERT/CC if critical

## Sample Disclosure Email

```
Subject: Security Disclosure - Exposed API Documentation

Hello [Organization] Security Team,

During routine technical analysis, we discovered what appears to be unintended public exposure of API documentation at your domain. We wanted to bring this to your attention through responsible disclosure.

**Finding Summary:**
- Type: Exposed API Documentation  
- URLs: [redacted until confirmed receipt]
- Discovered: [Date]
- Severity: Medium (potential information disclosure)

We have not attempted to exploit this issue and are reporting it to help improve your security posture. Please acknowledge receipt of this report so we can share specific details.

We typically follow a 90-day disclosure timeline but are happy to work with your security team's preferences.

Best regards,
[Your Name]
[Organization]
```

## For CIBC Specifically

Given the findings:
1. **Exposed API Documentation** (/api-docs, /swagger, /openapi returning 200)
2. **GraphQL Endpoint** (potential for introspection attacks)
3. **Multiple API versions** (/api/v1, /api/v2 all accessible)

### Recommended Actions:
1. Check if these are intentionally public
2. Test if authentication is required for sensitive operations
3. Verify if GraphQL introspection is disabled in production
4. Document in report but mark as "Potential Security Concern"

### CIBC Security Contacts:
- General security: Check https://www.cibc.com/.well-known/security.txt
- Bug bounty: Check if CIBC has a program on HackerOne/Bugcrowd
- Corporate contact: Use official channels for financial institutions

## Integration with TechScanIQ Reports

When including security findings in reports:

1. **For Sales Intelligence Reports:**
   - Note as "Technical Debt" or "Security Maturity Indicators"
   - Don't include exploitable details
   - Focus on business impact

2. **For PE Due Diligence:**
   - Include in "Technical Risk Assessment"
   - Estimate remediation costs
   - Note compliance implications

## Legal Considerations

- Always comply with Computer Fraud and Abuse Act (CFAA)
- Never attempt to access data beyond initial discovery
- Document all actions taken
- Consider legal review for critical findings

## Automation Considerations

Future TechScanIQ features could include:
- Automatic security.txt checking
- Severity scoring based on exposed endpoints
- Responsible disclosure tracking system
- Integration with bug bounty platforms