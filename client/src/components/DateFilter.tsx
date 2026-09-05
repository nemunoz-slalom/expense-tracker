import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DateRange } from 'react-day-picker';

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
  const shouldReduceMotion = useReducedMotion();
  const dateRangeLabelId = useId();
  const [rangeCalendarOpen, setRangeCalendarOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange>();
  const [isSelectingNewRange, setIsSelectingNewRange] = useState(false);
  const setMode = (mode: DateFilterMode): void => onChange({ ...value, mode });
  const setRangeOpen = (nextOpen: boolean): void => {
    if (nextOpen) {
      const from = dateFromKey(value.from);
      const to = dateFromKey(value.to);
      setPendingRange(from ? { from, to } : undefined);
      setIsSelectingNewRange(true);
    }
    setRangeCalendarOpen(nextOpen);
  };

  return (
    <>
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
      </div>
      <AnimatePresence initial={false}>
        {value.mode === 'custom' && (
          <motion.div
            className="custom-date-range filter-panel-custom-range"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 2 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeInOut' }}
          >
          <Popover open={rangeCalendarOpen} onOpenChange={setRangeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="date-button" aria-label={t('filter.selectDateRange')}>
                {value.from && value.to
                  ? t('filter.selectedDateRange', { from: dateLabel(value.from), to: dateLabel(value.to) })
                  : t('filter.selectDateRange')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={pendingRange}
                onSelect={(range, selectedDay) => {
                  if (isSelectingNewRange) {
                    setPendingRange({ from: selectedDay });
                    setIsSelectingNewRange(false);
                    return;
                  }

                  setPendingRange(range);
                  if (range?.from && range.to) {
                    onChange({ ...value, from: dateKey(range.from), to: dateKey(range.to) });
                    setRangeCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
