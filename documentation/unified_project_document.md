# Unified Project Documentation

## Project Requirements Document

### 1. Project Overview

TechScan IQ is a SaaS platform designed to speed up and simplify technical due diligence for early-stage investors. It uses AI models alongside expert review to transform complex engineering data into concise, actionable reports. Investors can rapidly assess tech health, security posture, architecture resilience, and alignment with their investment thesis—so they can make confident decisions without getting bogged down in technical details.

The platform aims to be affordable for smaller funds, fast enough to keep up with competitive deal timelines, and flexible enough to tailor assessments to each investor’s unique criteria. Success is measured by reduced time-to-decision, clear visibility into technical risks, and high user satisfaction among both non-technical and technical users. This product is being built to fill the gap where traditional due diligence is too slow, costly, or generic for today’s fast-moving seed and early-stage deals.

### 2. In-Scope vs. Out-of-Scope

**In-Scope**

*   Interactive investor dashboard with Tech Health Score gauge, risk cards, and key findings summary
*   Scan request form accepting company info, URL, and thesis criteria (predefined tags or custom inputs)
*   Multi-model AI analysis using Claude-3, GPT-4, and Gemini-pro in parallel
*   Evidence and citation overlay linking each claim to scraped or manual sources
*   Architecture, security, compliance, and code quality modules with visual charts and diagrams
*   Human-in-the-loop advisor review interface with split-screen editing and validation controls
*   Push notifications when scans complete and when advisor review is published
*   White-label PDF export with customizable headers, footers, and cover pages
*   Supabase-based multi-tenant authentication (email/password + optional SSO), database, and real-time updates
*   Serverless deployment on Netlify and basic CI/CD pipeline with linting and tests (unit/integration)

**Out-of-Scope (V1.0)**

*   Deep data retention or compliance modules for GDPR/SOC2
*   Integrations with GitHub, Jira, AWS, or other developer tools
*   Advanced customization beyond basic branding (no workflow builders)
*   Free-tier or trial plan (pay-per-scan only)
*   Audit logging or data residency controls

### 3. User Flow

A new investor arrives at the TechScan IQ website and chooses to sign up using email/password or a single sign-on option like Google. After confirming their email, they enter a simple onboarding wizard to set up their organization’s workspace name and branding preferences. Once setup is complete, they land on a dashboard showing any existing scan results or prompts to request their first analysis.

From the dashboard, the user clicks “Request Scan,” fills out the target company details and any thesis criteria, then submits. The system queues the scan and displays a loading state. When the AI draft is ready, administrators see a notification to review. After the advisor validates and publishes the report, the investor receives a push notification that they can return to the dashboard to view the final Tech Health Score, risk cards, interactive diagrams, and evidence links. They can also export a branded PDF or revisit the dashboard to start another scan.

### 4. Core Features

*   **Interactive Dashboard & Reporting:** Real-time gauge chart, risk cards by severity, drill-down tooltips explaining scores, and key finding summaries.
*   **Thesis-Driven Analysis Engine:** Predefined and custom tags, reusable thesis profiles, alignment percentage visualization, and categorized enablers/blockers/neutral findings.
*   **Technical Assessment Modules:** Simplified interactive architecture diagrams, security radar charts with CVSS scores, compliance checklists, CI/CD pipeline visuals, and code quality metrics.
*   **Evidence & Citation System:** Timestamped sources from web scraping (Diffbot, Crawl4ai) or manual input, hover previews, full-screen modals, confidence indicators, and verification status.
*   **AI Model Integration:** Ensemble approach using Claude-3 for thesis alignment, GPT-4 for code quality, and Gemini-pro for architecture, with processing time and confidence tracking.
*   **Advisor Review Workflow:** Split-screen AI vs. human view, inline comments, validation status controls, and bulk approval actions for efficient sign-off.
*   **Notifications & PDF Export:** Push alerts on scan completion and review publication, plus white-label PDF export with customizable branding.
*   **User Roles & Multi-Tenancy:** Investor users request scans and view reports; admin users review and publish; each organization has isolated data and branding.

### 5. Tech Stack & Tools

*   **Frontend:** React with Vite, TypeScript, Tailwind CSS, Shadcn UI components, Bolt for project scaffolding, Cursor for intelligent IDE assistance
*   **Backend & Database:** Supabase for authentication, Postgres database, serverless functions for API endpoints, Netlify for hosting
*   **AI Models & Data Processing:** Claude-3, GPT-4, Gemini-pro in ensemble; Diffbot and Crawl4ai for web scraping; custom Node.js services for evidence aggregation
*   **CI/CD & Testing:** GitHub Actions for continuous integration, basic unit and integration tests, ESLint and Prettier for code quality
*   **Notifications & Export:** Web push for in-app alerts, PDF generation library for white labeling reports

### 6. Non-Functional Requirements

*   **Performance:** Scan results should appear within 2–5 minutes for average requests; dashboard interactions under 200ms
*   **Security:** TLS for all transport, role-based access control, secure storage of credentials in environment variables
*   **Availability:** 99.9% uptime target on Netlify/Supabase
*   **Scalability:** Serverless functions autoscale with demand; database connection pooling
*   **Quality Assurance:** Minimum 70% test coverage, linting enforced on all pull requests

### 7. Constraints & Assumptions

*   We assume small to medium daily scan volumes (tens per day) initially
*   Supabase will handle auth and data storage with no immediate GDPR/SOC2 audit needs
*   Multi-tenant isolation is logical (schema-level) rather than physical
*   Third-party scraping services (Diffbot/Crawl4ai) provide accurate data without rate-limit issues
*   Initial AI model access is through existing API keys with no extra latency

### 8. Known Issues & Potential Pitfalls

*   **Model Consistency:** Different AI models may return conflicting insights. Mitigation: display confidence scores and allow advisor override.
*   **Data Freshness:** Web-scraped evidence could be stale. Mitigation: timestamp all evidence and refresh critical sources periodically.
*   **Performance Spikes:** Large or complex scans may exceed time targets. Mitigation: queue size limits and fallbacks to async report delivery.
*   **Multi-Tenant Leaks:** Misconfigured row-level security might expose data. Mitigation: strict RLS policies in Supabase and test cases for tenant isolation.
*   **PDF Rendering Variability:** Custom headers/footers may break layout. Mitigation: provide branded templates with bounded layouts.

## App Flow Document

### Onboarding and Sign-In/Sign-Up

A new investor visits the TechScan IQ site and is presented with a sign-up screen offering email/password or Google SSO. After entering credentials and confirming their email, they complete a brief setup to name their workspace and choose a logo or color accents. Password recovery is available via email reset links. Users can sign out from the profile menu and regain access through the same sign-in screen.

### Main Dashboard or Home Page

Once logged in, the dashboard displays a top navigation bar with the logo, primary navigation links, and a profile dropdown. Below, a Tech Health Score gauge sits alongside a risk summary panel and a tile showing recent key findings. A button labeled “Request Scan” invites users to start a new due diligence process. The sidebar lets users jump between Dashboard, Scan History, Settings, and Help.

### Detailed Feature Flows and Page Transitions

When a user clicks “Request Scan,” they see a form slide into view asking for the target company name, website URL, and thesis criteria—selectable via a multi-select dropdown or typed into character-limited text fields. Submitting this form transitions to a scan status page that polls for completion. Once the AI draft is done, admins see a notification badge and can click to open the reviewer interface. In that split-screen view, advisors scroll through sections, click “Approve” or “Flag,” add comments, and hit “Publish.” After publishing, investors return to the dashboard, where the new report appears at the top of their history list.

### Settings and Account Management

From the profile menu, users access Settings to update their name, email, password, and branding assets (logo, color accents). They manage notifications preferences for scan completion and review alerts. Admins can view workspace usage and configure basic account-level options. After saving changes, users click “Back to Dashboard” to continue their regular flow.

### Error States and Alternate Paths

If the user enters invalid data in the scan form (e.g., malformed URL), an inline error message appears under the field and prevents submission. If connection to the server fails, a full-screen retry prompt shows with a “Try Again” button. During a long-running scan, a gentle progress spinner and explanatory text reassure users. If the review fails QA checks, admins see an error banner with a retry option or links to diagnose logs.

### Conclusion and Overall App Journey

Users start by onboarding into an isolated workspace, request technical scans, track progress, and receive AI-driven drafts. Internal advisors review and publish final reports, and investors get notified to view or export branded PDFs. Along the way, they manage account settings, handle errors gracefully, and navigate between dashboard, scans, and configuration without friction.

## Tech Stack Document

### Frontend Technologies

*   React (with Vite) for fast hot-reload development and a modern component model
*   TypeScript for type safety and clearer code intent
*   Tailwind CSS for utility-driven styling and rapid UI iterations
*   Shadcn UI component library to maintain a consistent design system
*   Bolt for quick project scaffolding and best-practice setup
*   Cursor for AI-assisted coding within the IDE

### Backend Technologies

*   Supabase (Postgres) for authentication, database storage, row-level security, and real-time updates
*   Netlify Functions for serverless API endpoints (scan creation, report retrieval, PDF export)
*   Node.js runtime for custom data processing and web scraping orchestration

### Infrastructure and Deployment

*   Netlify for continuous deployment of front-end and serverless functions with atomic builds
*   GitHub Actions for CI pipelines running lint, unit tests, and integration tests on each pull request
*   Environment variables managed securely via Netlify and Supabase dashboards

### Third-Party Integrations

*   Diffbot and Crawl4ai for automated evidence gathering from web sources
*   PDF generation library for branded report exports
*   Web push service for in-app and browser notifications
*   Future-ready hooks for GitHub, Jira, and AWS integrations (planned post-V1)

### Security and Performance Considerations

*   Row-Level Security in Supabase to enforce strict data isolation per tenant
*   HTTPS/TLS enforced across all front-end and API traffic
*   Role-Based Access Control differentiating investor and admin functionality
*   Lazy loading of charts and diagrams, code splitting via Vite to reduce initial bundle size
*   Caching strategies for static assets and scan results to minimize repeated processing

### Conclusion and Overall Tech Stack Summary

The chosen stack balances developer productivity and user performance. React with TypeScript and Tailwind ensures a snappy, maintainable UI. Supabase simplifies backend concerns like auth and real-time data. Serverless functions on Netlify scale automatically and keep costs low. AI and scraping services plug in seamlessly, making TechScan IQ a robust, scalable platform aligned with rapid iteration and strong security.

## Frontend Guidelines Document

### Frontend Architecture

The frontend is built as a component-driven React application using Vite for fast builds. Components live in a clear folder structure under `src/components`, grouped by feature. Utility hooks and shared logic sit in `src/hooks` and `src/lib`. This approach supports maintainability and allows new features to be slotted in easily without disrupting core flows.

### Design Principles

We prioritize clarity and accessibility. UI elements use clear labels, consistent spacing, and intuitive interactions. Color contrasts meet WCAG standards. The layout is responsive, adapting gracefully from mobile to large desktop views. Tooltips and progressive disclosure help users digest complex data step-by-step.

### Styling and Theming

Tailwind CSS powers our styling with a utility-first approach. We define custom theme colors matching our brand palette: trust blue (#2563eb), risk red (#dc2626), caution amber (#f59e0b), success green (#10b981), and neutral gray (#6b7280). Fonts use Inter or IBM Plex Sans for readability and a modern tech feel. We apply a consistent glassmorphism effect on cards for depth and clarity.

### Component Structure

Each UI piece is a reusable functional component. We separate presentational (UI-only) and container (data-connected) components. Shared UI primitives like Button, Card, Accordion, and Modal live under `src/components/ui`. Feature components import these primitives, ensuring a uniform look and reducing duplication.

### State Management

Local UI state is handled with React’s useState and useReducer. Global state (user session, scan data) uses React Context with custom providers under `src/context`. This keeps state logic close to where it’s needed and avoids prop drilling.

### Routing and Navigation

React Router manages page transitions. The router lives in `src/App.tsx`, with routes for Dashboard, Scan Form, Scan Status, Review Interface, and Settings. Nested routes allow for sub-views like individual report details under `/scans/:id`.

### Performance Optimization

We use dynamic imports and lazy loading for heavy components like chart modules and interactive diagrams. Vite’s code splitting ensures initial downloads stay small. Static assets (logos, icons) are optimized and served from a CDN by Netlify.

### Testing and Quality Assurance

Unit tests with Jest and React Testing Library cover component behavior. Integration tests verify API interactions with mocked Supabase. End-to-end tests using Playwright simulate key user flows like onboarding, scan requests, and report viewing. Linting rules run on every commit to enforce code style.

### Conclusion and Overall Frontend Summary

These guidelines ensure a scalable, maintainable, and high-performance frontend. By following a component-based architecture, utility-first styling, and robust testing, we keep the development process smooth and the user experience consistently excellent.

## Implementation Plan

1.  **Environment Setup:** Clone the starter repo, configure environment variables for Supabase and AI model keys, and install dependencies.
2.  **Scaffolding:** Use Bolt to generate initial folder structure and common UI primitives with Shadcn UI.
3.  **Authentication & Multi-Tenancy:** Implement Supabase auth with email/password and SSO; enforce row-level security for tenant isolation.
4.  **Database Schema & APIs:** Create core tables (`companies`, `scans`, `findings`, `thesis_alignments`) in Supabase. Build serverless API endpoints for scan creation, thesis updates, report retrieval, and PDF export.
5.  **Dashboard & Scan Form:** Develop React pages for the Dashboard and Request Scan form, integrating form validation and state management.
6.  **AI Orchestration Service:** Build the orchestration layer that calls Diffbot/Crawl4ai, invokes Claude-3, GPT-4, and Gemini-pro, and stores AIAnalysis results.
7.  **Advisor Review Interface:** Create split-screen review component with inline validation controls, comments, and bulk approval features.
8.  **Visualization Modules:** Integrate charting libraries for gauge charts, radar charts, and interactive diagrams; ensure lazy loading.
9.  **Evidence & Citation UI:** Develop citation modals and hover previews linked to evidence records.
10. **Notifications & PDF Export:** Implement web push notifications and white-label PDF generation with customizable layouts.
11. **Testing & CI/CD:** Write unit, integration, and end-to-end tests. Configure GitHub Actions for linting, tests, and deployment on Netlify.
12. **Branding & Theming:** Apply final color palette, typography, and logo assets. Verify responsive layouts and accessibility.
13. **User Acceptance & Iteration:** Conduct UAT with sample investors, gather feedback, and refine UI/UX before public launch.

This plan lays out a clear path from setup through launch, ensuring all core features are delivered with quality and consistency.
