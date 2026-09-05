import { useTranslation } from 'react-i18next';

import { CircleAlert, CircleCheck, CircleDot, Clock3 } from 'lucide-react';

import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ServiceResponse } from '../types/services';

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
    <Badge className={`status-${service.status}`}><StatusIcon aria-hidden="true" size={16} /> {status}</Badge>
    <div>{formattedAmount}</div>
    <div>
      <span>{t('service.dueDate')}</span>
      <span>{service.dueDate}</span>
      {service.paymentDate && (
        <>
          <span>{t('service.paymentDate')}</span>
          <span>{service.paymentDate}</span>
        </>
      )}
    </div>
    <div className="service-actions">
      {!service.paid && <Button className="secondary" onClick={() => onPaid(service)}>{t('service.markPaid')}</Button>}
      <Button className="secondary" onClick={() => onEdit(service)}>{t('service.editAction')}</Button>
      <Button className="destructive" onClick={() => onDelete(service)}>{t('service.delete')}</Button>
    </div>
  </Card>;
}
