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
  const setMode = (mode: DateFilterMode): void => onChange({ ...value, mode });

  return (
    <div className="filter-field">
      <label id="date-range-label">{t('filter.dateRange')}</label>
      <Select value={value.mode} onValueChange={(mode) => setMode(mode as DateFilterMode)}>
        <SelectTrigger aria-labelledby="date-range-label"><SelectValue /></SelectTrigger>
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
              <Calendar value={value.from} onSelect={(from) => onChange({ ...value, from, to: value.to && from > value.to ? from : value.to })} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="date-button" aria-label={t('filter.endDate')}>
                {value.to || t('filter.endDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar value={value.to} onSelect={(to) => onChange({ ...value, to })} />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
