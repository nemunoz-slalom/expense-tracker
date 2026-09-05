import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { ServiceType, serviceTypes } from '../types/services';

interface TypeFilterProps {
  value?: ServiceType;
  onChange: (value?: ServiceType) => void;
}

export function TypeFilter({ value, onChange }: TypeFilterProps): JSX.Element {
  const { t } = useTranslation();
  const labelId = useId();

  return (
    <div className="filter-field">
      <label id={labelId}>{t('filter.serviceType')}</label>
      <Select
        value={value ?? 'all'}
        onValueChange={(nextValue) => onChange(nextValue === 'all' ? undefined : (nextValue as ServiceType))}
      >
        <SelectTrigger aria-labelledby={labelId}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.allTypes')}</SelectItem>
          {serviceTypes.map((type) => (
            <SelectItem key={type} value={type}>{t(`service.type.${type}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
interface TypeFilterProps {
  value?: ServiceType;
  onChange: (value?: ServiceType) => void;
}

export function TypeFilter({ value, onChange }: TypeFilterProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="filter-field">
      <label>{t('filter.serviceType')}</label>
      <Select value={value ?? 'all'} onValueChange={(nextValue) => onChange(nextValue === 'all' ? undefined : nextValue as ServiceType)}>
        <SelectTrigger aria-label={t('filter.serviceType')}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.allTypes')}</SelectItem>
          {serviceTypes.map((type) => <SelectItem key={type} value={type}>{t(`service.type.${type}`)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
