import { useTranslation } from 'react-i18next';

import { CircleAlert, CircleCheck, CircleDot, Clock3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ServiceResponse } from '@/types/services';

interface ServiceItemProps {
  service: ServiceResponse;
  onEdit: (service: ServiceResponse) => void;
  onPaid: (service: ServiceResponse) => void;
  onDelete: (service: ServiceResponse) => void;
}

export function ServiceItem({ service, onEdit, onPaid, onDelete }: ServiceItemProps): JSX.Element {
  const { t } = useTranslation();
  const status = t(`service.status.${service.status}`);
  const formattedAmount = service.amount === null
    ? t('service.amount.unavailable')
    : service.amount.toLocaleString(undefined, { style: 'currency', currency: t('service.currency') });
  const StatusIcon = {
    overdue: CircleAlert,
    urgent: Clock3,
    normal: CircleDot,
    paid: CircleCheck,
  }[service.status];

  return <Card className="service-item">
    <div><strong>{service.name}</strong><span>{t(`service.type.${service.type}`)}</span></div>
    <Badge variant="outline" className={`status-${service.status}`}><StatusIcon aria-hidden="true" size={16} /> {status}</Badge>
    <div>{formattedAmount}</div>
    <div>
      <span>{t('service.dueDate')}: {service.dueDate}</span>
      {service.paymentDate && (
        <span>{t('service.paymentDate')}: {service.paymentDate}</span>
      )}
    </div>
    <div className="service-actions">
      {!service.paid && <Button variant="outline" onClick={() => onPaid(service)}>{t('service.markPaid')}</Button>}
      <Button variant="outline" onClick={() => onEdit(service)}>{t('service.editAction')}</Button>
      <Button variant="destructive" onClick={() => onDelete(service)}>{t('service.delete')}</Button>
    </div>
  </Card>;
}
