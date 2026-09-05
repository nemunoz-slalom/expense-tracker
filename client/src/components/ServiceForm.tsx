import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './ui/Button';
import { Calendar } from './ui/Calendar';
import { Dialog, DialogContent, DialogTitle } from './ui/Dialog';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { CreateServiceRequest, ServiceResponse, ServiceType, serviceTypes } from '../types/services';

interface ServiceFormProps {
  open: boolean;
  service: ServiceResponse | null;
  initialValues?: CreateServiceRequest | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateServiceRequest) => Promise<void>;
}

interface FormValues {
  name: string;
  type: ServiceType | '';
  amount: string;
  paymentDate: string;
  dueDate: string;
}

const emptyValues: FormValues = { name: '', type: '', amount: '', paymentDate: '', dueDate: '' };

export function ServiceForm({ open, service, initialValues = null, onOpenChange, onSubmit }: ServiceFormProps): JSX.Element {
  const { t } = useTranslation();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValues(service ? {
      name: service.name, type: service.type, amount: service.amount?.toString() ?? '',
      paymentDate: service.paymentDate ?? '', dueDate: service.dueDate,
    } : initialValues ? {
      name: initialValues.name,
      type: initialValues.type,
      amount: initialValues.amount?.toString() ?? '',
      paymentDate: initialValues.paymentDate ?? '',
      dueDate: initialValues.dueDate,
    } : emptyValues);
    setErrors({});
  }, [service, initialValues, open]);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.name.trim()) nextErrors.name = t('service.required');
    if (!values.type) nextErrors.type = t('service.required');
    if (!values.dueDate) nextErrors.dueDate = t('service.required');
    if (values.amount && (!Number.isFinite(Number(values.amount)) || Number(values.amount) < 0)) nextErrors.amount = t('service.invalidAmount');
    if (values.paymentDate && values.dueDate && values.paymentDate > values.dueDate) nextErrors.paymentDate = t('service.invalidDates');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsSaving(true);
    try {
      await onSubmit({
        name: values.name.trim(), type: values.type as ServiceType, dueDate: values.dueDate,
        amount: values.amount ? Number(values.amount) : null,
        paymentDate: values.paymentDate || null,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const update = (field: keyof FormValues, value: string): void => setValues((current) => ({ ...current, [field]: value }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={submit}>
          <DialogTitle>{t(service ? 'service.edit' : 'service.create')}</DialogTitle>
          <div className="form-field"><Label htmlFor="name">{t('service.name')}</Label><Input id="name" value={values.name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} onChange={(event) => update('name', event.target.value)} />{errors.name && <p id="name-error" className="field-error">{errors.name}</p>}</div>
          <div className="form-field"><Label>{t('service.type')}</Label><Select value={values.type} onValueChange={(value) => update('type', value)}><SelectTrigger aria-label={t('service.type')}><SelectValue placeholder={t('service.type')} /></SelectTrigger><SelectContent>{serviceTypes.map((type) => <SelectItem key={type} value={type}>{t(`service.type.${type}`)}</SelectItem>)}</SelectContent></Select>{errors.type && <p className="field-error">{errors.type}</p>}</div>
          <div className="form-field"><Label htmlFor="amount">{t('service.amount')}</Label><Input id="amount" type="number" min="0" step="0.01" value={values.amount} onChange={(event) => update('amount', event.target.value)} />{errors.amount && <p className="field-error">{errors.amount}</p>}</div>
          {(['paymentDate', 'dueDate'] as const).map((field) => <div className="form-field" key={field}><Label>{t(`service.${field}`)}</Label><Popover><PopoverTrigger asChild><Button className="date-button" aria-label={t(`service.${field}`)}>{values[field] || t('service.selectDate')}</Button></PopoverTrigger><PopoverContent><Calendar value={values[field]} onSelect={(date) => update(field, date)} /></PopoverContent></Popover>{errors[field] && <p className="field-error">{errors[field]}</p>}</div>)}
          <div className="form-actions"><Button type="button" className="secondary" onClick={() => onOpenChange(false)}>{t('service.cancel')}</Button><Button type="submit" disabled={isSaving}>{t('service.save')}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
