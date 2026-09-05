import { useTranslation } from 'react-i18next';

import { ServiceResponse } from '../types/services';
import { ServiceItem } from './ServiceItem';

interface ServiceListProps {
  services: ServiceResponse[];
  isLoading: boolean;
  isFiltered: boolean;
  onEdit: (service: ServiceResponse) => void;
  onPaid: (service: ServiceResponse) => void;
  onDelete: (service: ServiceResponse) => void;
}

export function ServiceList({ services, isLoading, isFiltered, onEdit, onPaid, onDelete }: ServiceListProps): JSX.Element {
  const { t } = useTranslation();
  if (isLoading) return <p role="status">{t('service.loading')}</p>;
  if (!services.length) return <p>{t(isFiltered ? 'service.noFilteredServices' : 'service.noServices')}</p>;
  return <div className="service-list">{services.map((service) => <ServiceItem key={service.id} service={service} onEdit={onEdit} onPaid={onPaid} onDelete={onDelete} />)}</div>;
}
