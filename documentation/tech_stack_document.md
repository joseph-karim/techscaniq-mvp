# Tech Stack Document

This document explains the technology choices for TechScan IQ in plain language. Each section describes what we use, why we chose it, and how it helps deliver a fast, reliable, and user-friendly technical due diligence platform.

## 1. Frontend Technologies

Our frontend is what you see and interact with in your browser. We chose modern tools to make it fast, responsive, and easy to update:

- **Vite.js**
  - A lightning-fast build tool and development server.
  - Delivers near-instant page reloads when we make changes.
- **React**
  - A popular library for building component-based user interfaces.
  - Lets us break the UI into reusable pieces (buttons, cards, charts).
- **TypeScript**
  - Adds simple type checks on top of JavaScript.
  - Helps us catch mistakes early, reducing bugs in production.
- **Tailwind CSS**
  - A utility-first styling framework.
  - Enables consistent spacing, colors, and typography with minimal custom CSS.
- **Shadcn UI**
  - A collection of pre-built, accessible components (cards, modals, tooltips, accordions).
  - Speeds up development and ensures visual consistency.
- **Shadcn ComboBox**
  - A ready-made multi-select dropdown used for thesis tag selection.
- **Custom CSS Variables for Branding**
  - Primary colors: trust blue (#2563eb), risk red (#dc2626), etc.
  - Ensures the look and feel matches our brand guidelines (fonts, spacing, color palette).  

Together, these tools give us a snappy, polished interface that stays in sync with our brand and can adapt quickly as we enhance the product.

## 2. Backend Technologies

The backend handles data storage, business logic, and secure access. For TechScan IQ, we lean on a serverless, managed platform:

- **Supabase**
  - **Database (PostgreSQL)** with `JSONB` fields for flexible data (thesis input, evidence blobs).
  - **Authentication** for email/password and Single Sign-On (Google/Microsoft).
  - **Row-Level Security (RLS)** to keep each investor’s data in an isolated workspace.
  - **Real-Time Subscriptions** for live updates in the dashboard.
- **Serverless API (Netlify Functions or Supabase Edge Functions)**
  - Hosts our endpoints (e.g., POST `/api/scans/create`, GET `/api/scans/:id`).
  - Scales automatically with demand—no servers to manage.
- **TypeScript on the Server**
  - The same type safety benefits from the frontend carry over to our backend code, reducing runtime errors.

These choices allow us to move quickly without managing complex servers, while still supporting multi-tenant data isolation and real-time features.

## 3. Infrastructure and Deployment

To deploy and maintain the application reliably, we use cloud services with built-in automation:

- **Netlify**
  - **Hosting** for the frontend and serverless functions.
  - **Continuous Deployment**: automatically builds and publishes from our GitHub repository on every merge.
  - **Global CDN**: serves static assets from edge locations around the world for fast load times.
- **GitHub**
  - Version control and code review workflows.
  - We use branches, pull requests, and protected merges to maintain code quality.
- **CI/CD Tools**
  - **Linters** and basic **unit/integration tests** run on every commit.
  - Automated builds ensure that code meets style and quality standards before going live.
- **Bolt** & **Cursor**
  - **Bolt** jump-starts project setup with AI-powered scaffolding and best practices.
  - **Cursor** provides an AI-enhanced code editor with real-time suggestions, helping us code faster and more accurately.

This infrastructure makes deployments predictable, repeatable, and resistant to human error, while giving us fast feedback loops.

## 4. Third-Party Integrations

We connect to specialized external services to gather data and perform analysis:

- **Diffbot & Crawl4ai**
  - Web scraping engines that pull public evidence (website text, metadata).
- **AI Models**
  - **Claude-3** for thesis alignment and nuanced insights.
  - **GPT-4** for code quality reviews.
  - **Gemini-Pro** for architecture understanding.
  - We run them in parallel and combine results to improve accuracy.
- **PDF Generation Library**
  - Creates white-labeled reports with customizable headers, footers, and cover pages.
- **(Future)**  
  - **Stripe** (or similar) for pay-per-scan billing.
  - Connectors to GitHub, Jira, AWS, vulnerability scanners as optional add-ons.

These integrations let us focus on building our core workflow while leveraging best-in-class services for specialized tasks.

## 5. Security and Performance Considerations

We built security and speed into every layer:

**Security Measures**
- **Authentication & Authorization**
  - Supabase Auth with email, SSO, and JWT-based sessions.
  - Row-Level Security ensures one tenant cannot see another’s data.
- **Data Encryption**
  - All traffic over HTTPS.
  - Encryption at rest in the Supabase database.
- **Audit Logging**
  - Track admin reviews, approvals, and changes for compliance.
- **Environment Variables**
  - Secrets (API keys, DB credentials) kept out of code and managed securely.

**Performance Optimizations**
- **CDN Caching** for static assets via Netlify.
- **Vite’s Fast Builds** and hot-module replacement for efficient development.
- **Tailwind CSS Purge** to remove unused styles and keep CSS bundles small.
- **Lazy Loading** of heavy components (evidence modals, interactive diagrams).
- **Database Indexing** on key columns (scan IDs, company IDs) for speedy queries.
- **Serverless Functions** that spin up on demand, scaling automatically under load.

These practices help ensure the platform remains fast, reliable, and secure as we grow.

## 6. Conclusion and Overall Tech Stack Summary

In summary, TechScan IQ’s technology choices were guided by three core goals: speed of delivery, clarity of user experience, and operational simplicity.

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + Shadcn UI deliver a snappy, brand-consistent interface.
- **Backend:** Supabase and serverless functions handle data, authentication, and APIs without managing servers.
- **Infrastructure:** Netlify + GitHub + CI/CD pipelines give us automated, global deployments.
- **Integrations:** Diffbot, Crawl4ai, AI models (Claude-3, GPT-4, Gemini-Pro) power our analysis engine, with room to add billing and developer tool connectors in future phases.
- **Security & Performance:** Best practices in encryption, role-based controls, caching, and code quality keep the platform safe and responsive.

By combining managed services with modern open-source tools and AI integrations, we strike a balance between rapid innovation and enterprise-grade reliability. This stack allows us to deliver insightful, actionable technical due diligence to investors at any scale.