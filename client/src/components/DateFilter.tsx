import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Calendar } from './ui/Calendar';
import { Button } from './ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';

export type DateFilterMode = 'currentMonth' | 'previousMonth' | 'custom' | 'allTime';

export interface DateFilterValue {
  mode: DateFilterMode;
  from: string;
  to: string;
}

interface DateFilterProps {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
}

export function DateFilter({ value, onChange }: DateFilterProps): JSX.Element {
  const { t } = useTranslation();
  const dateRangeLabelId = useId();
  const setMode = (mode: DateFilterMode): void => onChange({ ...value, mode });
  const handleFromChange = (from: string): void => {
    const nextTo = value.to && from > value.to ? from : value.to;
    onChange({ ...value, from, to: nextTo });
  };
  const handleToChange = (to: string): void => {
    const rangeWasInvalid = Boolean(value.from && to < value.from);
    const nextFrom = rangeWasInvalid ? to : value.from;
    onChange({ ...value, from: nextFrom, to });
  };

  return (
    <div className="filter-field">
      <label id={dateRangeLabelId}>{t('filter.dateRange')}</label>
      <Select value={value.mode} onValueChange={(mode) => setMode(mode as DateFilterMode)}>
        <SelectTrigger aria-label={t('filter.dateRange')} aria-labelledby={dateRangeLabelId}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="currentMonth">{t('filter.currentMonth')}</SelectItem>
          <SelectItem value="previousMonth">{t('filter.previousMonth')}</SelectItem>
          <SelectItem value="custom">{t('filter.customRange')}</SelectItem>
          <SelectItem value="allTime">{t('filter.allTime')}</SelectItem>
        </SelectContent>
      </Select>
      {value.mode === 'custom' && (
        <div className="custom-date-range">
          <Popover>
            <PopoverTrigger asChild>
              <Button className="date-button" aria-label={t('filter.startDate')}>
                {value.from || t('filter.startDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar value={value.from} onSelect={handleFromChange} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="date-button" aria-label={t('filter.endDate')}>
                {value.to || t('filter.endDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar value={value.to} onSelect={handleToChange} />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
