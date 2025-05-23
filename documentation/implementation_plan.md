# Implementation plan

## Phase 1: Environment Setup

1. **Prevalidation**: In project root, run `ls -a` and verify no existing `package.json` or `.git` directory.  (Environment Setup Guidelines)
2. **Initialize Git**: If no Git repo, run `git init` in project root.  (Q&A: Version Control)
3. **Install Node.js**: Ensure Node.js v20.2.1 is installed. If not, download and install from the official site.  (Tech Stack: Core Tools)
4. **Validation**: Run `node -v` and confirm output is `v20.2.1`.  (Tech Stack: Core Tools)
5. **Scaffold Frontend**: Run `npm create vite@latest techscan-iq -- --template react-ts` and press Enter.  (Tech Stack: Frontend)
6. **Change Directory**: `cd techscan-iq`.  (Environment Setup Guidelines)
7. **Install React Router**: Run `npm install react-router-dom@6`.  (Tech Stack: Frontend)
8. **Install Tailwind CSS**: Run `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`.  (Tech Stack: Frontend)
9. **Configure Tailwind**: In `tailwind.config.cjs`, set `content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}']` and extend theme with the color palette `--primary`,`--danger`,`--warning`,`--success`,`--neutral`.  (UI/UX: Design System)
10. **Install Shadcn UI**: Run `npx shadcn-ui@latest add` and select Cards, Accordions, Tooltips, Modals, Badges, Tabs, ComboBox.  (Tech Stack: Frontend)
11. **Validation**: Run `npm run dev` and open http://localhost:5173; verify Vite starter page loads in <2s.  (Non-Functional Requirements: Performance)
12. **Add Lint & Format**: Create `.eslintrc.js` and `.prettierrc` based on project style guide, then install `eslint` and `prettier`.  (Tech Stack: Tooling)
13. **Validation**: Run `npm run lint` and `npm run format:check`; ensure zero errors.  (Tooling: ESLint/Prettier)
14. **Create Cursor Metrics File**: In project root, create `cursor_metrics.md` and reference `cursor_project_rules.mdc`.  (Cursor Docs: MCP Setup)
15. **Setup MCP Config Directory**: Create `.cursor` folder and inside it `mcp.json`.  (Cursor Docs: MCP Setup)
16. **Ignore MCP Config**: Add `.cursor/mcp.json` to `.gitignore`.  (Cursor Docs: MCP Setup)
17. **Add Supabase MCP Server Config**: In `.cursor/mcp.json`, insert:
    ```json
    {
      "mcpServers": {
        "supabase": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-postgres", "<connection-string>"]
        }
      }
    }
    ```
    (Cursor Docs: MCP Setup)
18. **Provide Connection Link**: Ask user to obtain the Supabase connection string here: https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp.  (Cursor Docs: MCP Setup)
19. **Validation**: After replacing `<connection-string>`, open Cursor Settings → MCP and confirm status is “active.”  (Cursor Docs: MCP Setup)

## Phase 2: Frontend Development

20. **Dashboard Layout**: Create `/src/layouts/DashboardLayout.tsx` using Shadcn UI `Sidebar`, `Header`, and `Content` slots.  (App Flow: Dashboard Layout)
21. **Dashboard Page**: Create `/src/pages/Dashboard.tsx` and import `HealthScoreCard`, `RiskSummaryCard`, `FindingsAccordion`.  (PRD: Interactive Dashboard & Reporting)
22. **HealthScoreCard Component**: Create `/src/components/HealthScoreCard.tsx` using `Card` and `Badge`.  (UI/UX: Design System)
23. **RiskSummaryCard Component**: Create `/src/components/RiskSummaryCard.tsx` with `Card`, colored by severity.  (UI/UX: Design System)
24. **FindingsAccordion Component**: Create `/src/components/FindingsAccordion.tsx` using `Accordion`.  (UI/UX: Design System)
25. **Routing**: In `/src/App.tsx`, set up routes with `BrowserRouter` for `/dashboard`, `/scans/:id`, `/report/:id`.  (App Flow: Routing)
26. **Scan Detail Page**: Create `/src/pages/ScanDetail.tsx` with form for thesis input (JSON editor) and evidence sidebar.  (PRD: Technical Assessment Modules)
27. **ComboBox Component**: Create `/src/components/ComboBox.tsx` for thesis criterion selection.  (UI/UX: ComboBox)
28. **Report Page**: Create `/src/pages/Report.tsx` featuring sticky navigation, expandable findings, and “Export PDF” button.  (PRD: Interactive Dashboard & Reporting)
29. **Install Axios**: Run `npm install axios@1.4.0`.  (Tech Stack: Frontend)
30. **API Service**: Create `/src/services/api.ts` exporting `createScan()`, `getScanById()`, `updateThesis()`, `getReport()`, `exportPdf()`.  (Data Architecture: API Endpoints)
31. **Validation**: Use mocked data to render Dashboard and ScanDetail; verify UI matches Figma designs.  (UI/UX: Layout)

## Phase 3: Backend Development

32. **Obtain Supabase Keys**: Get `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from Supabase dashboard.  (Tech Stack: Backend)
33. **Environment File**: Create `.env` at project root with the three Supabase variables.  (Tech Stack: Backend)
34. **Define Database Schema**: In a file `supabase/schema.sql`, write:
    ```sql
    CREATE TABLE companies(id uuid PRIMARY KEY, name text, website text);
    CREATE TABLE scans(id uuid PRIMARY KEY, company_id uuid REFERENCES companies(id), user_id uuid, status text, thesis_input jsonb);
    CREATE TABLE findings(id uuid PRIMARY KEY, scan_id uuid REFERENCES scans(id), category text, severity text, title text, description text, evidence jsonb, ai_confidence numeric, advisor_validated boolean);
    CREATE TABLE thesis_alignments(id uuid PRIMARY KEY, scan_id uuid REFERENCES scans(id), thesis_criterion text, alignment_type text, related_findings uuid[], explanation text);
    ```  (Data Architecture: Supabase Database Schema)
35. **Create Tables via MCP**: Run `npx @modelcontextprotocol/server-postgres <connection-string> < supabase/schema.sql` in project root.  (Cursor Docs: MCP with Supabase)
36. **Validation**: In Supabase Dashboard → Table Editor, confirm all tables and columns.  (Data Architecture: Supabase Database Schema)
37. **Init Supabase Functions**: In `supabase/functions/`, run `npx supabase functions init`.  (Tech Stack: Backend)
38. **Function: scansCreate**: Create `supabase/functions/scansCreate/index.ts` to handle `POST /api/scans/create` using Supabase client and return new scan ID.  (Data Architecture: API Endpoints)
39. **Other Functions**: Similarly create `getScanById`, `updateThesis`, `getReport`, `exportPdf`, and `advisorReview` under `supabase/functions/`.  (Data Architecture: API Endpoints)
40. **AI Model Calls**: In relevant functions, integrate calls to Claude-3, GPT-4, Gemini-Pro using `process.env.CLAUDE_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`.  (Key Considerations: AI Model Integration)
41. **Scraping Logic**: In `supabase/functions/scrapeEvidence/index.ts`, implement Diffbot and Crawl4ai calls with retry and rate-limit handling.  (Key Considerations: Web Scraping)
42. **Validation**: Run `supabase functions serve` and test each endpoint with `curl`; confirm <500 ms responses.  (Non-Functional Requirements: Performance)

## Phase 4: Integration

43. **Configure API Base URL**: In `.env`, add `VITE_API_BASE_URL=http://localhost:54321/functions/v1`.  (Tech Stack: Backend)
44. **Wire API Calls**: In `/src/services/api.ts`, replace mock URLs with `import.meta.env.VITE_API_BASE_URL`.  (App Flow: Data Fetching)
45. **Implement Frontend Calls**: Update pages to call `createScan()`, `getScanById()`, etc., handle loading & errors.  (PRD: Advisor Review Workflow)
46. **Configure CORS**: In `supabase/functions/_middleware.ts`, allow origins `http://localhost:5173` and your production domain.  (Tech Stack: Security)
47. **Validation**: Perform end-to-end test: create scan → view details → update thesis → view report → export PDF.  (Q&A: Pre-Launch Checklist)

## Phase 5: Deployment

48. **netlify.toml**: Create file at project root with:
    ```toml
    [build]
      command   = "npm run build"
      functions = "supabase/functions"
      publish   = "dist"
    ```  (Tech Stack: DevOps)
49. **Set Netlify Env Vars**: In Netlify dashboard, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `CLAUDE_API_KEY`, `GEMINI_API_KEY`.  (Tech Stack: DevOps)
50. **Validation**: Connect GitHub repo to Netlify, push `main`, then run Cypress E2E tests against the deployed URL. Confirm Dashboard loads <2 s and API calls <500 ms.  (Q&A: Pre-Launch Checklist)
