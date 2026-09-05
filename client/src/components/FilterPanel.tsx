import { useTranslation } from 'react-i18next';

import { DateFilter, DateFilterValue } from './DateFilter';
import { TypeFilter } from './TypeFilter';
import { Button } from '@/components/ui/button';
import { ServiceType } from '@/types/services';

interface FilterPanelProps {
  dateFilter: DateFilterValue;
  type?: ServiceType;
  onDateFilterChange: (value: DateFilterValue) => void;
  onTypeChange: (value?: ServiceType) => void;
  onReset: () => void;
}

export function FilterPanel({ dateFilter, type, onDateFilterChange, onTypeChange, onReset }: FilterPanelProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="filter-panel" aria-label={t('filter.title')}>
      <DateFilter value={dateFilter} onChange={onDateFilterChange} />
      <TypeFilter value={type} onChange={onTypeChange} />
      <Button variant="outline" onClick={onReset}>{t('filter.reset')}</Button>
    </section>
  );
}
