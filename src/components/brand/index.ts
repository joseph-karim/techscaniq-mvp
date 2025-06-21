// Core UI Components
export { TechScanButton } from './TechScanButton';
export { TechScanCard } from './TechScanCard';
export { TechScanInput } from './TechScanInput';

// Layout Components
export { TechScanSection } from './TechScanSection';
export { TechScanHeader } from './TechScanHeader';

// Report Components
export { ReportHeader } from './ReportHeader';
export { ReportSection } from './ReportSection';
export { FindingCard } from './FindingCard';

// Data Visualization Components
export { MetricCard } from './MetricCard';
export { ProgressBar } from './ProgressBar';

// Form Components
export { TechScanSelect } from './TechScanSelect';
export { TechScanTextarea } from './TechScanTextarea';

// Feedback Components
export { TechScanAlert } from './TechScanAlert';

// Loading Components
export { TechScanSkeleton, ReportSkeleton } from './TechScanSkeleton';

// Chart Components
export { TechScanChart } from './TechScanChart';

// Types for components
export type {
  MetricCardProps,
  ProgressBarProps,
  FindingCardProps,
  ReportSectionProps,
  TechScanAlertProps,
  ChartProps
} from './types';

// Brand constants
export const BRAND_COLORS = {
  teal: '#00C2B2',
  black: '#2C2C2E',
  white: '#FFFFFF',
  gunmetal: '#1a1a1a',
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

export const BRAND_FONTS = {
  space: 'Space Grotesk',
  ibm: 'IBM Plex Sans',
};

export const BRAND_SPACING = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
};