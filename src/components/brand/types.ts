import { ReactNode } from 'react';

export interface MetricCardProps {
  label: string;
  value: number;
  format?: 'number' | 'percentage' | 'currency';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon?: ReactNode;
}

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'teal' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

export interface FindingCardProps {
  type: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  evidence?: string[];
  recommendation?: string;
}

export interface ReportSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export interface TechScanAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export interface ChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie';
  dataKey: string | string[];
  xAxisKey?: string;
  height?: number;
  className?: string;
}