# TechScan IQ Frontend Guideline Document

This document outlines the architecture, design principles, technologies, and best practices for the TechScan IQ frontend. It’s written in everyday language so anyone—from designers to non-technical stakeholders—can understand how the frontend is set up and why.

## 1. Frontend Architecture

**Frameworks & Libraries**
- **Vite**: Our build tool and dev server for fast startup and lightning-fast HMR (hot module replacement).
- **React (with TypeScript)**: Component-based UI library with strict typing for better maintainability.
- **Tailwind CSS**: Utility-first styling framework for rapid UI development and consistent styling.
- **Shadcn UI**: Prebuilt, accessible components (Cards, Accordions, Tooltips, Modals, Badges, Tabs, ComboBox) that integrate with Tailwind.

**How It Scales & Stays Maintainable**
- **Modular Components**: Each UI element is its own React component. This keeps code organized and promotes reuse.
- **Type Safety**: TypeScript catches bugs early and makes refactoring safer.
- **Utility-First Styles**: Tailwind’s atomic classes reduce custom CSS and make visual changes predictable.
- **Build Optimizations**: Vite’s code splitting and tree-shaking keep bundle sizes small.

**Performance**
- Fast dev experience with Vite.
- Production builds automatically split code and minify assets.
- Tailwind’s purge tool removes unused CSS.

## 2. Design Principles

We follow three main UX principles:

1. **Usability**
   - Clear, intuitive navigation—users find what they need in two clicks or less.
   - Simple, concise language on buttons and labels.
2. **Accessibility (WCAG 2.1 AA)**
   - All interactive elements reachable via keyboard.
   - Sufficient color contrast for text and UI elements.
   - ARIA labels on custom components (modals, tooltips).
3. **Responsiveness**
   - Mobile-first approach—layouts adapt smoothly from 320px to 1920px.
   - Flexible grid and Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).

**Applying These Principles**
- Form fields and buttons are large enough on small screens.
- Tooltips and modals trap focus.
- Charts and graphs (Tech Health Score, radar charts) shrink or transform into card lists on mobile.

## 3. Styling and Theming

**Styling Approach**
- **Tailwind CSS** utility classes for most styling.
- Minimal custom CSS—when needed, scoped CSS Modules or inline styles via Tailwind’s `@apply`.

**Theming**
- Theme context (`ThemeContext`) to toggle between default and dark mode (future scope).
- All theme variables (colors, fonts, spacing) defined in `tailwind.config.js` under `theme.extend`.

**Visual Style**
- Modern flat design with subtle shadows for depth.
- Occasional glass-morphism panels on dashboards (semi-transparent cards with backdrop blur).

**Color Palette**
| Name             | Hex       | Usage                                    |
|------------------|-----------|------------------------------------------|
| Deep Navy        | #1E293B   | Primary backgrounds, headers             |
| Slate Gray       | #64748B   | Secondary backgrounds, borders           |
| Trust Blue       | #2563EB   | Links, primary buttons, charts           |
| Electric Teal    | #14B8A6   | Highlights, accent elements              |
| Signal Green     | #10B981   | Success states, positive badges          |
| Risk Red         | #DC2626   | Error states, critical risk badges       |
| Caution Amber    | #F59E0B   | Warnings, caution badges                 |
| Neutral Gray     | #6B7280   | Disabled states, placeholder text        |

**Font**
- Primary: **Inter** (sans-serif) for clean, modern readability.
- Fallback: system UI fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`).

## 4. Component Structure

**Folder Organization**
```
/src
 ├── components
 │    ├── atoms      # Smallest pieces: Button, Badge, Input
 │    ├── molecules  # Combined atoms: FormField, NavItem
 │    ├── organisms  # Larger sections: Header, Sidebar, DashboardCard
 │    └── pages      # Page layouts: DashboardPage, ReportPage
 ├── hooks          # Custom React hooks (e.g., useScanData)
 ├── context        # Context providers (Theme, Auth)
 └── utils          # Helpers (formatters, API clients)
```

**Why Component-Based**
- **Reusability:** Build once, use everywhere. Less duplication.
- **Isolation:** Bugs stay in one component, easier to debug.
- **Team Collaboration:** Designers and devs can work on separate components without stepping on each other.

## 5. State Management

**Server State**
- **TanStack Query (React Query)** for fetching, caching, and updating data (scans, findings, thesis inputs).
- Automatic retries, background refetching, and stale-while-revalidate behavior ensure fresh data.

**Client/UI State**
- **React Context + useReducer** for global settings (theme, user preferences).
- **Local state** (`useState`) for transient states (modal open/closed, form field values).

**Data Flow**
1. Components call React Query hooks (`useGetScan(id)`).
2. Query hook fetches from our Netlify Functions API.
3. Data cached and shared; components re-render on updates.

## 6. Routing and Navigation

**Library**
- **React Router v6**

**Structure**
```jsx
<BrowserRouter>
  <AppLayout>
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/scans/:id" element={<ReportPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </AppLayout>
</BrowserRouter>
```

**Navigation**
- Persistent sidebar with links to Dashboard, Scans, Settings.
- Breadcrumbs on report pages (`Home / Scans / Scan #1234`).
- Sticky top nav with logo, search, user profile menu.

## 7. Performance Optimization

- **Code Splitting & Lazy Loading**: React.lazy + Suspense for large pages (e.g., ReportPage).
- **Tree-Shaking**: Vite removes unused code automatically.
- **Asset Optimization**: Compress images, SVGs. Use modern formats (WebP) where possible.
- **Tailwind Purge**: Removes unused CSS classes in production.
- **Memoization**: `React.memo` and `useMemo` for expensive calculations (e.g., chart data transforms).
- **CDN Delivery**: Host static assets and JS bundles on Netlify CDN for low latency.

## 8. Testing and Quality Assurance

**Linters & Formatters**
- **ESLint** with TypeScript plugin. Enforce code style and catch errors.
- **Prettier** for consistent formatting.

**Unit & Integration Tests**
- **Jest** + **React Testing Library**:
  - Test component render behavior (buttons, forms).
  - Mock React Query with MSW (Mock Service Worker) for API endpoints.

**End-to-End (E2E) Tests**
- **Playwright**:
  - Simulate user flows: login, start scan, view report.
  - Test on multiple viewports (mobile, tablet, desktop).

**Continuous Integration**
- GitHub Actions pipeline runs lint, unit tests, and E2E tests on each pull request.
- Fail fast on errors to maintain code quality.

## 9. Conclusion and Overall Frontend Summary

The TechScan IQ frontend is built with modern, battle-tested tools (Vite, React, TypeScript, Tailwind, Shadcn UI) to deliver a fast, accessible, and maintainable user experience. Our component-based architecture, combined with clear design principles and a strict testing regimen, ensures that new features can be rolled out quickly without sacrificing quality.

Key takeaways:
- **Scalable Architecture**: Modular components, type safety, and build optimizations.
- **User-Centered Design**: Usability, accessibility, and responsive layouts.
- **Consistent Styling**: Utility-first approach with a defined color palette and typography.
- **Robust Data Handling**: React Query for server data, React Context for UI state.
- **High Performance**: Lazy loading, code splitting, and CDN delivery.
- **Quality Assurance**: ESLint, Prettier, Jest, React Testing Library, Playwright.

With these guidelines in place, anyone on the TechScan IQ team can confidently build, maintain, and extend the frontend to meet evolving business and user needs.