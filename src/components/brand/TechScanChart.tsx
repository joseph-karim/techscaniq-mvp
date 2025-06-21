import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface ChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie';
  dataKey: string | string[];
  xAxisKey?: string;
  height?: number;
  className?: string;
}

const CHART_COLORS = ['#00C2B2', '#2C2C2E', '#4ade80', '#fb923c', '#f87171', '#a78bfa'];

export function TechScanChart({ 
  data, 
  type, 
  dataKey, 
  xAxisKey = 'name',
  height = 300,
  className 
}: ChartProps) {
  const chartProps = {
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  };

  const commonAxisProps = {
    tick: { fontFamily: 'IBM Plex Sans', fontSize: 12 },
    stroke: '#9ca3af',
  };

  const tooltipProps = {
    contentStyle: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontFamily: 'IBM Plex Sans',
    },
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        {type === 'line' ? (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontFamily: 'IBM Plex Sans' }} />
            {Array.isArray(dataKey) ? (
              dataKey.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        ) : type === 'bar' ? (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontFamily: 'IBM Plex Sans' }} />
            {Array.isArray(dataKey) ? (
              dataKey.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  radius={[8, 8, 0, 0]}
                />
              ))
            ) : (
              <Bar
                dataKey={dataKey}
                fill={CHART_COLORS[0]}
                radius={[8, 8, 0, 0]}
              />
            )}
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              dataKey={typeof dataKey === 'string' ? dataKey : dataKey[0]}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontFamily: 'IBM Plex Sans' }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}