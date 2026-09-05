import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dateFromKey, dateKey, dateLabel } from '@/lib/date';

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
  const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
  const [toCalendarOpen, setToCalendarOpen] = useState(false);
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
          <Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="date-button" aria-label={t('filter.startDate')}>
                {value.from ? dateLabel(value.from) : t('filter.startDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFromKey(value.from)} onSelect={(date) => {
                if (date) {
                  handleFromChange(dateKey(date));
                  setFromCalendarOpen(false);
                }
              }} initialFocus />
            </PopoverContent>
          </Popover>
          <Popover open={toCalendarOpen} onOpenChange={setToCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="date-button" aria-label={t('filter.endDate')}>
                {value.to ? dateLabel(value.to) : t('filter.endDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFromKey(value.to)} onSelect={(date) => {
                if (date) {
                  handleToChange(dateKey(date));
                  setToCalendarOpen(false);
                }
              }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
