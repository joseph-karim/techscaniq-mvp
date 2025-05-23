# TechScan IQ – Project Requirements Document (PRD) V1.2

## 1. Project Overview

TechScan IQ is a SaaS platform designed to streamline and democratize technical due diligence for early-stage investors. By combining an AI-driven analysis engine with a structured human-in-the-loop review, the platform turns complex assessments of startups’ technology stacks, architecture, security, and code quality into clear, actionable intelligence. Investors—from budget-conscious angels needing a rapid “gut check” to VC analysts preparing committee-ready reports—get fast, affordable, and thesis-aligned insights that directly inform their funding decisions.

We’re building TechScan IQ to solve four key problems in current due diligence workflows:

1.  **Speed** – Traditional technical reviews are too slow for fast-moving deals.
2.  **Cost** – Smaller investors often can’t afford full-service engineering audits.
3.  **Relevance** – Generic reports rarely map to an investor’s unique thesis.
4.  **Clarity** – Non-engineering stakeholders struggle to interpret highly technical findings.

**Success Criteria**

*   First scan turnaround under 10 minutes of AI processing + human review in 24 hours
*   Investor satisfaction: ≥ 90% positive feedback on report clarity
*   Adoption: 50 paying scans in first quarter post-launch

## 2. In-Scope vs. Out-of-Scope

### In-Scope (V1.2)

*   **User Roles & Multi-Tenancy**: Email/password + SSO auth via Supabase; isolated workspaces per investor organization; two roles (Investor, Admin).
*   **Dashboard & Scan Request**: Interactive Tech Health Score gauge; risk summary cards; “Request Scan” form with company info, URL, thesis tags, and custom criteria.
*   **AI Analysis Engine**: Ensemble of Claude-3 (thesis alignment), GPT-4 (code quality), Gemini-Pro (architecture); Diffbot/Crawl4ai scraping for evidence.
*   **Risk & Architecture Modules**: Color-coded risk cards, block-diagram with clickable components and exportable images.
*   **Security & Compliance**: CVSS-scored vulnerability summary, GDPR/SOC2 checklist, radar chart of security posture.
*   **Code Quality & DevOps**: CI/CD pipeline visualization, technical debt flags, test coverage summary.
*   **Evidence & Citation System**: Hoverable breadcrumbs, citation previews, full-screen modal, timestamped sources, confidence metrics.
*   **Advisor Review Workflow**: Split-screen AI vs. advisor view, inline annotations, quick-approve/flag buttons, bulk approval.
*   **Notifications & PDF Export**: Push notifications on human review completion (to Investor) and scan completion (to Admin); white-labeled PDF reports with customizable headers/footers/cover pages.
*   **Basic QA & CI/CD**: Linter, unit and integration tests, basic end-to-end tests, automated pipeline on Netlify.
*   **Branding & Design System**: Deep navy + slate gray primary palette; electric teal/signal green accents; minimal grid-based UI; Sans-serif typography (Inter, Satoshi, IBM Plex Sans).

### Out-of-Scope (Later Phases)

*   Integrations with GitHub, Jira, AWS, Docker registries, or other SaaS/APIs.
*   Tiered subscription plans, free trials, volume discounts.
*   Advanced compliance certifications (e.g., SOC2 audit readiness).
*   Real-time collaboration (chat, shared annotations).
*   Mobile-native apps (will be responsive web only).
*   On-premise or self-hosted deployments.

## 3. User Flow

A new investor lands on the TechScan IQ homepage, chooses email/password or Google/Microsoft SSO, and is provisioned an isolated workspace. On first login, they see the Dashboard: a prominent Tech Health Score gauge, a list of past scans (empty initially), and clear “Request Scan” CTA. Clicking it opens a form where they enter the target company name, website URL, select predefined thesis tags or type custom criteria (200-character limit), then submit.

Behind the scenes, the system writes a `scan` record in Supabase, enqueues AI models (Claude-3, GPT-4, Gemini-Pro) and scraping jobs. When the AI draft completes, admins receive a notification and open the split-screen review interface. They approve, modify, or flag each section, adding annotations as needed. Upon final admin sign-off, investors get a push notification. Returning to the Dashboard, they can drill into risk cards, view the interactive architecture diagram, explore evidence modals, and click “Export PDF” to generate a branded report for sharing.

## 4. Core Features

*   **Authentication & Multi-Tenant Workspace**\
    Supabase-powered email/password + SSO, isolated data per organization.
*   **Interactive Dashboard**\
    Tech Health Score gauge, confidence bar, risk cards color-coded by severity, key findings summary.
*   **Scan Request Form**\
    Company info, URL, thesis-driven tags (multi-select), custom criteria text areas, industry/tech preferences.
*   **AI Analysis Engine**\
    Ensemble approach:\
    • Claude-3 for thesis alignment\
    • GPT-4 for code quality\
    • Gemini-Pro for architecture\
    • Diffbot + Crawl4ai for evidence scraping
*   **Risk Assessment Module**\
    Critical/red, high/orange, medium/yellow, low/green cards; “View Evidence,” severity badges, business impact.
*   **Architecture Analysis**\
    Interactive block diagram, component details on click, risk overlays, image export.
*   **Security & Compliance**\
    Vulnerability list with CVSS scores, GDPR/SOC2 checklist, data practices summary, radar chart.
*   **Code Quality & DevOps**\
    Pipeline maturity score, CI/CD flow visualization, technical debt flags, test coverage summary.
*   **Evidence & Citation System**\
    Source attribution, timestamp, confidence score, hover preview, full evidence modal, AI/human verification status.
*   **Advisor Review Workflow**\
    Split-screen AI vs. advisor, approve/moderate/flag actions, inline comments, bulk approval.
*   **Notifications**\
    Push alerts when scans complete (Admin) and when human review finishes (Investor).
*   **PDF Export**\
    White-label report generation, customizable headers, footers, cover pages.
*   **Branding & UI Components**\
    Shadcn UI cards, accordions, tooltips, modals, badges, tabs; color and typography per brand guidelines.

## 5. Tech Stack & Tools

*   **Frontend**\
    • Framework: Vite + React + TypeScript\
    • Styling: Tailwind CSS, Shadcn UI components\
    • IDE: Cursor (AI-powered code suggestions)
*   **Backend & Database**\
    • Supabase (PostgreSQL, Auth, Functions)\
    • Netlify Functions (serverless endpoints)\
    • Bolt for project scaffolding best practices
*   **AI & Scraping**\
    • AI Models: Claude-3, GPT-4, Gemini-Pro (OpenAI/Google APIs)\
    • Scraping: Diffbot, Crawl4ai\
    • Evidence storage: JSONB fields in Supabase
*   **DevOps & CI/CD**\
    • Netlify automated deploys\
    • ESLint, Prettier\
    • Unit, integration, basic E2E tests (Playwright/Jest)
*   **PDF Generation**\
    • Library: e.g., Puppeteer or PDFKit for serverless export

## 6. Non-Functional Requirements

*   **Performance**\
    • Dashboard loads in < 2 seconds on 3G;\
    • API responses for completed scans < 500 ms.
*   **Security**\
    • Data encrypted at rest (Supabase) and in transit (TLS).\
    • Role-based access control (RBAC) in Supabase Policies.\
    • Multi-tenant isolation via row-level security.
*   **Usability & Accessibility**\
    • WCAG 2.1 AA compliance for core flows.\
    • Responsive design; mobile first.\
    • Clear, consistent tooltips and onboarding prompts.
*   **Maintainability**\
    • 80%+ code coverage target for critical modules.\
    • Linting and formatting enforced.
*   **Reliability & Availability**\
    • 99.5% uptime SLA.\
    • Automated health checks and alerts for failed Netlify functions.

## 7. Constraints & Assumptions

*   **AI Model Availability**: Rely on API access to Claude-3, GPT-4, Gemini-Pro; assume stable quotas.
*   **Supabase Limits**: Keep data volumes within free/tier limits initially.
*   **Minimal Integrations**: No GitHub/Jira/AWS integration in V1.
*   **User Load**: Expect < 100 concurrent users at launch.
*   **Brand Assets**: Final logo and assets provided before UI implementation.
*   **Compliance**: GDPR support “not right away”; audit logging optional in V1.

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits**: Scraping services or AI endpoints may throttle requests.\
    *Mitigation*: Implement request queuing, exponential backoff, caching.
*   **LLM Hallucinations**: Models may generate inaccurate findings.\
    *Mitigation*: Human-in-the-loop review, confidence thresholds, citation checks.
*   **Data Freshness**: Evidence could become stale quickly.\
    *Mitigation*: Display timestamps prominently; schedule periodic re-scans.
*   **Performance Spikes**: Parallel AI calls and scraping jobs may overload serverless functions.\
    *Mitigation*: Batch processing, concurrency limits, background job queues.
*   **UX Overwhelm**: Too many cards or diagrams risk clutter.\
    *Mitigation*: Progressive disclosure (accordions, tooltips), prioritize critical risks.

This PRD provides a clear, unambiguous blueprint for TechScan IQ V1.2. All core functionality, design principles, and technical constraints are documented so that the AI—Bolt, Cursor, or any other tool—can generate subsequent technical artifacts (Tech Stack, Frontend Guidelines, Backend Structure, etc.) without missing information.
