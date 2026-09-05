import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dateFromKey, dateKey, dateLabel } from '@/lib/date';
import { CreateServiceRequest, ServiceResponse, ServiceType, serviceTypes } from '@/types/services';

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
  const [openCalendar, setOpenCalendar] = useState<'paymentDate' | 'dueDate' | null>(null);

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
          {(['dueDate', 'paymentDate'] as const).map((field) => <div className="form-field" key={field}><Label>{t(`service.${field}`)}</Label><div className="relative"><Popover open={openCalendar === field} onOpenChange={(nextOpen) => setOpenCalendar(nextOpen ? field : null)}><PopoverTrigger asChild><Button variant="outline" className="date-button w-full pr-10" aria-label={t(`service.${field}`)}>{values[field] ? dateLabel(values[field]) : t('service.selectDate')}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateFromKey(values[field])} onSelect={(date) => { if (date) { update(field, dateKey(date)); setOpenCalendar(null); } }} initialFocus /></PopoverContent></Popover>{field === 'paymentDate' && values.paymentDate && <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" aria-label={t('service.clearPaymentDate')} onClick={() => update('paymentDate', '')}><X aria-hidden="true" className="h-4 w-4" /></Button>}</div>{errors[field] && <p className="field-error">{errors[field]}</p>}</div>)}
          <div className="form-actions"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('service.cancel')}</Button><Button type="submit" disabled={isSaving}>{t('service.save')}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
