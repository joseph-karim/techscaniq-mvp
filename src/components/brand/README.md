# TechScan IQ Brand Component Library

A comprehensive collection of reusable React components that implement the TechScan IQ brand design system. These components ensure consistent UI/UX across the application while maintaining high performance and accessibility standards.

## Installation

All components are located in the `/src/components/brand` directory and can be imported from the index file.

```typescript
import { 
  TechScanButton, 
  TechScanCard, 
  MetricCard 
} from '@/components/brand';
```

## Core Principles

- **Brand Consistency**: All components follow TechScan IQ brand guidelines
- **Accessibility First**: WCAG AA compliant with proper ARIA labels
- **Performance Optimized**: Lazy loading, code splitting, and efficient animations
- **Mobile Responsive**: Works seamlessly across all device sizes
- **Developer Friendly**: TypeScript support with comprehensive props

## Components

### Core UI Components

#### TechScanButton
Primary interactive element with multiple variants.

```tsx
<TechScanButton 
  variant="primary" // primary | secondary | white | ghost
  size="md" // sm | md | lg
  loading={false}
  icon={<ArrowRight />}
>
  Start Intelligence Scan
</TechScanButton>
```

#### TechScanCard
Versatile container component with hover animations.

```tsx
<TechScanCard 
  variant="default" // default | highlighted | dark | gradient
  hoverable={true}
  delay={0.2}
  onClick={() => handleClick()}
>
  <h3>Card Content</h3>
</TechScanCard>
```

#### TechScanInput
Form input with built-in validation styling.

```tsx
<TechScanInput
  label="Company Name"
  placeholder="Enter company name"
  error="This field is required"
  icon={<Building />}
/>
```

### Layout Components

#### TechScanSection
Page section wrapper with consistent spacing.

```tsx
<TechScanSection 
  background="gray" // white | gray | black | gradient
  containerSize="lg" // sm | md | lg | xl | full
>
  <h1>Section Content</h1>
</TechScanSection>
```

#### TechScanHeader
Navigation header with mobile menu support.

```tsx
<TechScanHeader />
```

### Report Components

#### ReportHeader
Professional report header with metadata.

```tsx
<ReportHeader
  company="Acme Corp"
  reportType="sales-intelligence"
  reportId="abc123"
  generatedAt="2024-01-20"
  completionTime="2m 34s"
/>
```

#### ReportSection
Structured report section with icon support.

```tsx
<ReportSection
  title="Executive Summary"
  subtitle="Key findings and recommendations"
  icon={<FileText />}
>
  <p>Section content...</p>
</ReportSection>
```

#### FindingCard
Display critical findings with evidence.

```tsx
<FindingCard
  type="critical" // critical | warning | success | info
  title="Security Vulnerability"
  description="Outdated SSL certificate detected"
  evidence={[
    "Certificate expired on 2024-01-15",
    "Using deprecated TLS 1.0"
  ]}
  recommendation="Update SSL certificate immediately"
/>
```

### Data Visualization

#### MetricCard
Animated metric display with trends.

```tsx
<MetricCard
  label="Total Scans"
  value={1234}
  format="number" // number | percentage | currency
  trend="up" // up | down | neutral
  trendValue={12}
  icon={<Brain />}
/>
```

#### ProgressBar
Animated progress indicator.

```tsx
<ProgressBar
  label="Analysis Progress"
  value={75}
  max={100}
  color="teal" // teal | green | yellow | red
  size="md" // sm | md | lg
/>
```

#### TechScanChart
Recharts wrapper with brand styling.

```tsx
<TechScanChart
  data={chartData}
  type="line" // line | bar | pie
  dataKey={['revenue', 'profit']}
  xAxisKey="month"
  height={300}
/>
```

### Form Components

#### TechScanSelect
Dropdown select with custom styling.

```tsx
<TechScanSelect
  label="Report Type"
  options={[
    { value: 'sales', label: 'Sales Intelligence' },
    { value: 'pe', label: 'PE Due Diligence' }
  ]}
  error="Please select a report type"
/>
```

#### TechScanTextarea
Multi-line text input.

```tsx
<TechScanTextarea
  label="Additional Notes"
  placeholder="Enter any additional information"
  helperText="Optional: Provide context for the scan"
  rows={4}
/>
```

### Feedback Components

#### TechScanAlert
Dismissible alert messages.

```tsx
<TechScanAlert
  type="success" // success | error | warning | info
  title="Scan Complete"
  description="Your report is ready for viewing"
  dismissible={true}
  onDismiss={() => handleDismiss()}
/>
```

### Loading Components

#### TechScanSkeleton
Loading placeholder animations.

```tsx
<TechScanSkeleton 
  variant="text" // text | card | chart | metric
  className="w-3/4"
/>
```

#### ReportSkeleton
Full report loading state.

```tsx
<ReportSkeleton />
```

## Design Tokens

### Colors
- **Primary**: `brand-teal` (#00C2B2)
- **Black**: `brand-black` (#000000)
- **White**: `brand-white` (#FFFFFF)
- **Gunmetal**: `brand-gunmetal` (#2C2C2E)

### Typography
- **Headings**: Space Grotesk (`font-space`)
- **Body**: IBM Plex Sans (`font-ibm`)
- **Monospace**: IBM Plex Mono (`font-mono`)

### Spacing
Consistent spacing scale: 4, 6, 8, 12, 16, 24, 32

### Animations
- Hover effects with scale transforms
- Smooth transitions (200-400ms)
- Respects `prefers-reduced-motion`

## Best Practices

1. **Import from index**: Always import from the main index file
2. **Use semantic props**: Choose appropriate variants for context
3. **Provide feedback**: Use loading states and error messages
4. **Test accessibility**: Ensure keyboard navigation works
5. **Optimize performance**: Use lazy loading for heavy components

## Example Implementation

See `DashboardExample.tsx` for a complete implementation showcasing all components working together.

```tsx
import { DashboardExample } from '@/components/brand/DashboardExample';

// Use as a reference for building your own pages
<DashboardExample />
```

## Contributing

When adding new components:
1. Follow the existing naming convention (TechScan prefix)
2. Include TypeScript types
3. Add to the index export
4. Document with examples
5. Test across breakpoints
6. Ensure accessibility compliance