import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { dateKey, dateLabel } from '@/lib/date';
import { formatAmount } from '@/lib/currency';
import { ServiceResponse } from '@/types/services';

interface ServiceItemProps {
  service: ServiceResponse;
  onEdit: (service: ServiceResponse) => void;
  onPaid: (service: ServiceResponse) => void;
  onDelete: (service: ServiceResponse) => void;
}

const statusClassNames = {
  overdue: 'status-overdue',
  urgent: 'status-urgent',
  normal: 'status-normal',
  paid: 'status-paid',
};

export function ServiceItem({ service, onEdit, onPaid, onDelete }: ServiceItemProps): JSX.Element {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const status = t(`service.status.${service.status}`);
  const formattedAmount = service.amount === null
    ? t('service.amount.unavailable')
    : formatAmount(service.amount);
  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -3 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <Card className="service-item">
        <div className="service-details"><strong>{service.name}</strong><span>{t(`service.type.${service.type}`)}</span></div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            className="service-status"
            key={service.status}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
          >
            <Badge variant="outline" className={statusClassNames[service.status]}>{status}</Badge>
          </motion.div>
        </AnimatePresence>
        <div className="service-amount">{formattedAmount}</div>
        <div className="service-dates">
          <span>{t('service.dueDate')}: {dateLabel(service.dueDate)}</span>
          {service.paymentDate && (
            <span>
              {t('service.paymentDate')}: {service.paymentDate === dateKey(new Date())
                ? t('service.today')
                : dateLabel(service.paymentDate)}
            </span>
          )}
        </div>
        <div className="service-actions">
          {!service.paid && <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}><Button variant="outline" onClick={() => onPaid(service)}>{t('service.markPaid')}</Button></motion.div>}
          <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}><Button variant="outline" onClick={() => onEdit(service)}>{t('service.editAction')}</Button></motion.div>
          <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}><Button variant="destructive" onClick={() => onDelete(service)}>{t('service.delete')}</Button></motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
