import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { ConsumptionStats } from '@/api/stats.api';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

interface ConsumptionByPeriodChartProps {
  stats: ConsumptionStats | null;
  isLoading: boolean;
  error: Error | null;
}

function periodLabel(period: string, locale: string): string {
  const [start, end = start] = period.split('..');
  const monthLabel = (value: string): string => {
    const [year, month] = value.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1));
  };
  if (start === end) return monthLabel(start);

  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear] = end.split('-').map(Number);
  const startName = new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(startYear, startMonth - 1, 1));
  return startYear === endYear ? `${startName}–${monthLabel(end)}` : `${monthLabel(start)}–${monthLabel(end)}`;
}

export function ConsumptionByPeriodChart({ stats, isLoading, error }: ConsumptionByPeriodChartProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const chartConfig = {
    amount: { label: t('report.amount'), color: 'hsl(var(--primary))' },
  } satisfies ChartConfig;
  if (isLoading) return <section aria-label={t('report.chartTitle')}><Skeleton className="h-56 w-full" /><p role="status">{t('report.loading')}</p></section>;
  if (error) return <p role="alert">{error.message}</p>;
  if (!stats) return <></>;

  const data = stats.periods.map((item) => ({ ...item, label: periodLabel(item.period, i18n.language) }));
  const average = stats.average.toLocaleString(i18n.language, { style: 'currency', currency: t('service.currency') });
  return (
    <section className="report-chart" aria-label={t('report.chartTitle')}>
      <h2>{t('report.chartTitle')}</h2>
      <p>{t('report.average', { average })}</p>
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
        </BarChart>
      </ChartContainer>
      <ul className="sr-only">
        {data.map((item) => <li key={item.period}>{item.label}: {item.amount}</li>)}
      </ul>
    </section>
  );
}
