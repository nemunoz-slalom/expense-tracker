import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/cn';

const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart(): ChartContextProps {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error('useChart must be used within a <ChartContainer />');
  return context;
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }): JSX.Element | null {
  const colorConfig = Object.entries(config).filter(([, item]) => item.theme || item.color);
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig.map(([key, itemConfig]) => {
  const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;
  return color ? `  --color-${key}: ${color};` : null;
}).join('\n')}
}`)
          .join('\n'),
      }}
    />
  );
}

interface ChartContainerProps extends React.ComponentProps<'div'> {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={chartId}
          ref={ref}
          className={cn(
            'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke="#fff"]]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke="#ccc"]]:stroke-border [&_.recharts-sector[stroke="#fff"]]:stroke-transparent [&_.recharts-surface]:outline-none',
            className,
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  },
);
ChartContainer.displayName = 'ChartContainer';

const ChartTooltip = RechartsPrimitive.Tooltip;
const ChartLegend = RechartsPrimitive.Legend;

type ChartEntry = {
  dataKey?: string;
  name?: string;
  value?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
};

interface ChartTooltipContentProps extends React.ComponentProps<'div'> {
  active?: boolean;
  payload?: ChartEntry[];
  label?: string | number;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: 'line' | 'dot' | 'dashed';
  nameKey?: string;
  labelKey?: string;
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: ChartEntry, key: string): ChartConfig[string] | undefined {
  const payloadConfig = payload.payload?.[key];
  const nestedKey = typeof payloadConfig === 'string' ? payloadConfig : key;
  return config[nestedKey] ?? config[key];
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ active, payload, className, indicator = 'dot', hideLabel = false, hideIndicator = false, label, labelKey, nameKey, ...props }, ref) => {
    const { config } = useChart();
    if (!active || !payload?.length) return null;

    const key = `${labelKey || payload[0].dataKey || payload[0].name || 'value'}`;
    const itemConfig = getPayloadConfigFromPayload(config, payload[0], key);
    const tooltipLabel = !hideLabel && (itemConfig?.label || label);

    return (
      <div ref={ref} className={cn('grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl', className)} {...props}>
        {tooltipLabel ? <div className="font-medium">{tooltipLabel}</div> : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const itemKey = `${nameKey || item.name || item.dataKey || 'value'}`;
            const configItem = getPayloadConfigFromPayload(config, item, itemKey);
            const color = item.color || `var(--color-${item.dataKey})`;
            return (
              <div key={`${itemKey}-${index}`} className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground">
                {!hideIndicator && <div className={cn('mt-0.5 shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]', indicator === 'dot' && 'h-2.5 w-2.5', indicator === 'line' && 'w-1', indicator === 'dashed' && 'w-0 border-dashed bg-transparent')} style={{ '--color-bg': color, '--color-border': color } as React.CSSProperties} />}
                <div className="flex flex-1 justify-between leading-none">
                  <span className="text-muted-foreground">{configItem?.label || item.name}</span>
                  {item.value !== undefined ? <span className="font-mono font-medium tabular-nums text-foreground">{Number(item.value).toLocaleString()}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

interface ChartLegendContentProps extends React.ComponentProps<'div'> {
  payload?: Array<{ dataKey?: string; value?: string; color?: string }>;
  hideIcon?: boolean;
  nameKey?: string;
}

const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, hideIcon = false, payload, nameKey, ...props }, ref) => {
    const { config } = useChart();
    if (!payload?.length) return null;
    return (
      <div ref={ref} className={cn('flex items-center justify-center gap-4', className)} {...props}>
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || 'value'}`;
          const itemConfig = config[key];
          return <div key={item.value} className="flex items-center gap-1.5"><div className={cn('h-2 w-2 shrink-0 rounded-[2px]', hideIcon && 'hidden')} style={{ backgroundColor: item.color }} /><span>{itemConfig?.label || item.value}</span></div>;
        })}
      </div>
    );
  },
);
ChartLegendContent.displayName = 'ChartLegendContent';

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle, useChart };
