import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { ServiceResponse } from '@/types/services';
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
  const shouldReduceMotion = useReducedMotion();

  if (isLoading && !services.length) return <p role="status">{t('service.loading')}</p>;

  return (
    <motion.div layout className="service-list">
      <AnimatePresence mode="popLayout" initial={false}>
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            layout
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: Math.min(index * 0.05, 0.3), type: 'spring', stiffness: 360, damping: 30 }}
          >
            <ServiceItem service={service} onEdit={onEdit} onPaid={onPaid} onDelete={onDelete} />
          </motion.div>
        ))}
        {!services.length && (
          <motion.p
            key="empty-state"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
          >
            {t(isFiltered ? 'service.noFilteredServices' : 'service.noServices')}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
