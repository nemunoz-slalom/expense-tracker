import { FormEvent, ReactElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { dateFromKey, dateKey, dateLabel } from '@/lib/date';
import { formatAmountInput, integerCursorPosition, normalizeAmountEdit } from '@/lib/currency';
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

function ValidationTooltip({ children, error, shouldReduceMotion }: { children: ReactElement; error?: string; shouldReduceMotion: boolean }): JSX.Element {
  if (!error) return children;

  return (
    <Tooltip open>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent asChild side="top">
        <motion.span
          initial={shouldReduceMotion ? false : { opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
        >
          {error}
        </motion.span>
      </TooltipContent>
    </Tooltip>
  );
}

export function ServiceForm({ open, service, initialValues = null, onOpenChange, onSubmit }: ServiceFormProps): JSX.Element {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const amountCaretRef = useRef<number | null>(null);
  const [openCalendar, setOpenCalendar] = useState<'paymentDate' | 'dueDate' | null>(null);
  const [validationAttempt, setValidationAttempt] = useState(0);

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
    setValidationAttempt(0);
  }, [service, initialValues, open]);

  useLayoutEffect(() => {
    if (amountCaretRef.current === null || !amountInputRef.current) return;
    amountInputRef.current.setSelectionRange(amountCaretRef.current, amountCaretRef.current);
    amountCaretRef.current = null;
  });

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.name.trim()) nextErrors.name = t('service.required');
    if (!values.type) nextErrors.type = t('service.required');
    if (!values.dueDate) nextErrors.dueDate = t('service.required');
    if (values.amount && (!Number.isFinite(Number(values.amount)) || Number(values.amount) < 0)) nextErrors.amount = t('service.invalidAmount');
    if (values.paymentDate && values.dueDate && values.paymentDate > values.dueDate) nextErrors.paymentDate = t('service.invalidDates');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setValidationAttempt((current) => current + 1);
      return;
    }
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

  const update = (field: keyof FormValues, value: string): void => {
    setValues((current) => {
      const nextValues = { ...current, [field]: value };
      if (!validationAttempt) return nextValues;

      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };

        if (field === 'name' && value.trim()) delete nextErrors.name;
        if (field === 'type' && value) delete nextErrors.type;
        if (field === 'amount' && (!value || (Number.isFinite(Number(value)) && Number(value) >= 0))) delete nextErrors.amount;
        if (field === 'dueDate') {
          if (value) delete nextErrors.dueDate;
          if (!nextValues.paymentDate || !value || nextValues.paymentDate <= value) delete nextErrors.paymentDate;
        }
        if (field === 'paymentDate' && (!value || !nextValues.dueDate || value <= nextValues.dueDate)) delete nextErrors.paymentDate;

        return nextErrors;
      });

      return nextValues;
    });
  };
  const updateAmount = (value: string, cursor: number): void => {
    const decimalIndex = value.indexOf('.');
    const cursorIsInFraction = decimalIndex >= 0 && cursor > decimalIndex;
    const normalizedAmount = normalizeAmountEdit(value, values.amount);
    const formattedAmount = formatAmountInput(normalizedAmount);

    if (cursorIsInFraction) {
      const fractionDigits = value.slice(decimalIndex + 1, cursor).replace(/\D/g, '').length;
      amountCaretRef.current = formattedAmount.indexOf('.') + 1 + Math.min(fractionDigits, 2);
    } else {
      const integerDigits = value.slice(0, cursor).replace(/\D/g, '').length;
      amountCaretRef.current = integerCursorPosition(formattedAmount, integerDigits);
    }

    update('amount', normalizedAmount);
  };
  const displayedAmount = formatAmountInput(values.amount);
  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <motion.form
          onSubmit={submit}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 30 }}
        >
          <DialogTitle>{t(service ? 'service.edit' : 'service.create')}</DialogTitle>
          <motion.div layout className="form-field" initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: shouldReduceMotion ? 0 : 0.05 }}>
            <Label htmlFor="name">{t('service.name')}</Label><ValidationTooltip error={errors.name} shouldReduceMotion={shouldReduceMotion}><Input id="name" value={values.name} aria-invalid={Boolean(errors.name)} onChange={(event) => update('name', event.target.value)} /></ValidationTooltip>
          </motion.div>
          <motion.div layout className="form-field" initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: shouldReduceMotion ? 0 : 0.1 }}>
            <Label>{t('service.type')}</Label><ValidationTooltip error={errors.type} shouldReduceMotion={shouldReduceMotion}><div><Select value={values.type} onValueChange={(value) => update('type', value)}><SelectTrigger aria-label={t('service.type')} aria-invalid={Boolean(errors.type)}><SelectValue placeholder={t('service.type')} /></SelectTrigger><SelectContent>{serviceTypes.map((type) => <SelectItem key={type} value={type}>{t(`service.type.${type}`)}</SelectItem>)}</SelectContent></Select></div></ValidationTooltip>
          </motion.div>
          <motion.div layout className="form-field" initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: shouldReduceMotion ? 0 : 0.15 }}>
            <Label htmlFor="amount">{t('service.amount')}</Label><ValidationTooltip error={errors.amount} shouldReduceMotion={shouldReduceMotion}><Input ref={amountInputRef} id="amount" type="text" inputMode="decimal" value={displayedAmount} aria-invalid={Boolean(errors.amount)} onChange={(event) => updateAmount(event.target.value, event.target.selectionStart ?? event.target.value.length)} /></ValidationTooltip>
          </motion.div>
          {(['dueDate', 'paymentDate'] as const).map((field, index) => <motion.div layout className="form-field" key={field} initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }} animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: errors[field] && validationAttempt ? [0, -3, 3, 0] : 0 }} transition={{ delay: shouldReduceMotion ? 0 : 0.2 + index * 0.05, duration: errors[field] ? 0.2 : undefined }}><Label>{t(`service.${field}`)}</Label><ValidationTooltip error={errors[field]} shouldReduceMotion={shouldReduceMotion}><div className="relative"><Popover open={openCalendar === field} onOpenChange={(nextOpen) => setOpenCalendar(nextOpen ? field : null)}><PopoverTrigger asChild><Button variant="outline" className="date-button w-full pr-10" aria-label={t(`service.${field}`)} aria-invalid={Boolean(errors[field])}>{values[field] ? dateLabel(values[field]) : t('service.selectDate')}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateFromKey(values[field])} onSelect={(date) => { if (date) { update(field, dateKey(date)); setOpenCalendar(null); } }} initialFocus /></PopoverContent></Popover><AnimatePresence>{field === 'paymentDate' && values.paymentDate && <motion.div className="absolute right-1 top-1/2 -translate-y-1/2" initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={shouldReduceMotion ? undefined : { opacity: 0 }}><Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={t('service.clearPaymentDate')} onClick={() => update('paymentDate', '')}><X aria-hidden="true" className="h-4 w-4" /></Button></motion.div>}</AnimatePresence></div></ValidationTooltip></motion.div>)}
          <div className="form-actions"><motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('service.cancel')}</Button></motion.div><motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}><Button type="submit" disabled={isSaving}>{t('service.save')}</Button></motion.div></div>
          </motion.form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
