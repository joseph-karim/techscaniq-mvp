# Backend Structure Document for TechScan IQ

This document outlines the backend setup for TechScan IQ in clear, everyday language. It covers architecture, databases, APIs, hosting, infrastructure, security, monitoring, and more. Anyone reading this will understand how our backend works, even without a deep technical background.

## 1. Backend Architecture

**Overview**
- We use a serverless setup: Supabase handles database and authentication, and Netlify Functions host our custom API logic.  
- Our code is organized by feature (scans, findings, users, reports), following a simple layers pattern:
  - **API layer**: Serverless functions that receive requests and return responses.  
  - **Service layer**: Business logic (e.g., creating a scan, validating findings).  
  - **Data layer**: Interacts with the database via Supabase client.

**Design Patterns & Frameworks**
- **RESTful design**: Clear separation of resources (scans, companies, findings).  
- **Modular functions**: Each Netlify Function handles a specific endpoint.  
- **Configuration via environment variables**: API keys for AI models, database URLs, Stripe secrets.

**Scalability, Maintainability & Performance**
- **Scalability**: Serverless functions automatically scale up/down based on traffic. No servers to manage.  
- **Maintainability**: Small, focused modules are easier to update and test. Clear naming and folder structure.  
- **Performance**: Cold starts minimized by keeping functions lightweight. Using Netlify’s global edge network ensures fast response times worldwide.

## 2. Database Management

**Technology Used**
- **PostgreSQL** (via Supabase): A reliable, relational database.  
- We leverage **Supabase** features:
  - Authentication and row-level security (RLS) for multi-tenancy.  
  - Real-time subscriptions for push notifications when scans complete.

**Data Structure & Access**
- Data is organized into tables: users, workspaces, companies, scans, findings, thesis alignments.  
- Each table has a primary key (UUID) and timestamp columns (`created_at`, `updated_at`).  
- Multi-tenancy is enforced via a `workspace_id` on each record and RLS policies in Supabase.  
- Services use the Supabase client library to read/write data securely.

**Data Management Practices**
- **Backups**: Automated daily backups managed by Supabase.  
- **RLS policies**: Ensure users only see data in their workspace.  
- **Migrations**: SQL migration files stored in GitHub; applied via CI during deployments.

## 3. Database Schema

### Human-Readable Table Descriptions
- **users**: Registered people (angel investors, analysts, admins).  
- **workspaces**: Isolated customer environments (each investor or firm).  
- **companies**: Target companies to scan.  
- **scans**: Individual scan jobs, linking a company, user, and thesis input.  
- **findings**: Results generated by AI or advisors for each scan (risk items).  
- **thesis_alignments**: How each scan aligns with user-defined investment criteria.

### SQL Schema (PostgreSQL)
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  role TEXT NOT NULL, -- e.g., "analyst", "admin"
  workspace_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workspaces table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Scans table
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL, -- "pending", "in_progress", "completed"
  thesis_input JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Findings table
CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id),
  category TEXT NOT NULL,
  severity TEXT NOT NULL, -- "low", "medium", "high"
  title TEXT NOT NULL,
  description TEXT,
  evidence JSONB,
  ai_confidence FLOAT,
  advisor_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Thesis Alignments table
CREATE TABLE thesis_alignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id),
  thesis_criterion TEXT NOT NULL,
  alignment_type TEXT NOT NULL, -- "enabler", "blocker", "neutral"
  related_findings JSONB,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 4. API Design and Endpoints

We follow a RESTful style. All endpoints are implemented as Netlify Functions under `/api/`.

- **POST /api/scans/create**
  - Starts a new scan. Accepts `company_id`, `thesis_input`, `user_token`.  
- **GET /api/scans/:id**
  - Fetches scan details, status, and basic results.  
- **PUT /api/scans/:id/thesis**
  - Updates the thesis criteria for a scan.  
- **GET /api/scans/:id/report**
  - Returns full report data (findings, alignments).  
- **GET /api/scans/:id/export/pdf**
  - Triggers PDF generation and returns a download link.  
- **POST /api/advisor/review/:scanId**
  - Submits advisor feedback (validations, comments).

Each endpoint:
- Requires a valid Supabase JWT in the `Authorization` header.  
- Checks row-level permissions to enforce multi-tenancy.  
- Returns standard HTTP status codes (200 OK, 400 Bad Request, 401 Unauthorized).

## 5. Hosting Solutions

**Supabase**
- Hosts the PostgreSQL database, authentication, and real-time features.  
- Managed service with automatic scaling and backups.

**Netlify**
- Serves static frontend (Vite + React) and runs serverless API functions.  
- Benefits:
  - **Global CDN**: Fast static asset delivery worldwide.  
  - **Serverless scaling**: No server setup or capacity planning.  
  - **Built-in CI/CD**: Automatic deploys from GitHub.

**Cost-Effectiveness & Reliability**
- Pay-as-you-go model in Netlify and Supabase.  
- High uptime SLA from both providers.

## 6. Infrastructure Components

- **Load Balancing**: Handled by Netlify’s global edge network.  
- **CDN**: Netlify CDN caches static assets (JS, CSS, images).  
- **Caching**: 
  - Edge caching of API responses where appropriate (e.g., static lookup data).  
  - In-function memory caching for short-lived AI model tokens.
- **Content Delivery**: 
  - Static UI and assets served by Netlify CDN.  
- **Background Jobs**: 
  - Hosted via Supabase Functions or scheduled serverless functions (e.g., nightly data cleanup).  
- **PDF Generation**: 
  - Serverless function (using Puppeteer) generates reports on demand.

## 7. Security Measures

- **Authentication & Authorization**:
  - Supabase Auth issues JWTs for users.  
  - Row-level security policies in Postgres ensure users only access their workspace data.
- **Data Encryption**:
  - HTTPS everywhere (Supabase and Netlify).  
  - Data at rest encrypted by Supabase.
- **API Security**:
  - JWT validation in every endpoint.  
  - Rate limiting on critical functions to prevent abuse.
- **Secrets Management**:
  - Environment variables in Netlify for AI model keys and Stripe secrets.  
- **Compliance**:
  - We follow general best practices (GDPR-ready data deletion, encryption).  
- **Vulnerability Scanning**:
  - Regular npm dependency audits.  
  - Static code analysis in CI.

## 8. Monitoring and Maintenance

**Monitoring Tools & Practices**
- **Supabase Dashboard**: Real-time database metrics, query performance.  
- **Netlify Logs**: Function invocation logs, error tracking.  
- **Third-Party APM**: (Optional) integrate Sentry or Datadog for full-stack tracing.

**Maintenance Strategies**
- **CI/CD Pipeline**:
  - GitHub Actions (triggered on pull requests) run linters, unit tests, and deploy previews.  
  - Main branch merges trigger production deploys.
- **Testing**:
  - Unit tests for services.  
  - Integration tests for key API endpoints.  
- **Backup & Recovery**:
  - Supabase automated backups and point-in-time recovery.  
- **Versioning & Rollbacks**:
  - Function versioning via Git.  
  - Netlify instant rollbacks if a deploy fails.

## 9. Conclusion and Overall Backend Summary

TechScan IQ’s backend is a modern, serverless setup built on Supabase and Netlify. It’s designed for:
- **Scalability**: Auto-scaling functions and a managed database.  
- **Maintainability**: Clear separation of concerns, modular code, and automated CI/CD.  
- **Performance**: Global CDN, edge caching, and lightweight serverless functions.  
- **Security**: Robust auth, RLS, encryption, and best practices.

Unique aspects:
- **Multi-model AI integration** (Claude-3, GPT-4, Gemini-Pro) handled seamlessly in serverless functions.
- **Real-time updates** via Supabase’s real-time features for push notifications.  
- **On-demand PDF reports** generated in a scalable, serverless way.

With this setup, TechScan IQ meets its goals: swift delivery of AI-driven due diligence, secure multi-tenant isolation, and a smooth, scalable experience for users.