import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ServiceForm } from './components/ServiceForm';
import { DeleteConfirmation } from './components/DeleteConfirmation';
import { DateFilterValue } from './components/DateFilter';
import { FilterPanel } from './components/FilterPanel';
import { ServiceList } from './components/ServiceList';
import { Button } from './components/ui/Button';
import { useServices } from './hooks/useServices';
import { ToastProvider, useToasts } from './hooks/useToasts';
import { CreateServiceRequest, ServiceFilters, ServiceResponse, ServiceType } from './types/services';

function monthForOffset(offset: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const defaultDateFilter: DateFilterValue = { mode: 'currentMonth', from: '', to: '' };

function filtersFor(dateFilter: DateFilterValue, type?: ServiceType): ServiceFilters {
  const filters: ServiceFilters = type ? { type } : {};
  if (dateFilter.mode === 'currentMonth') return { ...filters, month: monthForOffset(0) };
  if (dateFilter.mode === 'previousMonth') return { ...filters, month: monthForOffset(-1) };
  if (dateFilter.mode === 'custom') return {
    ...filters,
    ...(dateFilter.from ? { from: dateFilter.from } : {}),
    ...(dateFilter.to ? { to: dateFilter.to } : {}),
  };
  return filters;
}

function ServiceManager(): JSX.Element {
  const { t } = useTranslation();
  const { success, error: showError } = useToasts();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceResponse | null>(null);
  const [deleting, setDeleting] = useState<ServiceResponse | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(defaultDateFilter);
  const [typeFilter, setTypeFilter] = useState<ServiceType | undefined>();
  const filters = useMemo(() => filtersFor(dateFilter, typeFilter), [dateFilter, typeFilter]);
  const { services, isLoading, error, create, update, remove } = useServices(filters);
  const messageFor = (caught: unknown): string => caught instanceof Error ? caught.message : t('error.default');
  const save = async (data: CreateServiceRequest): Promise<void> => {
    try {
      if (editing) {
        await update(editing.id, data);
        success(t('service.updated'));
      } else {
        await create(data);
        success(t('service.created'));
      }
    } catch (caught) { showError(messageFor(caught)); }
  };
  const markPaid = async (service: ServiceResponse): Promise<void> => {
    try { await update(service.id, { paid: true }); success(t('service.paid')); } catch (caught) { showError(messageFor(caught)); }
  };
  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return;
    try { await remove(deleting.id); success(t('service.deleted')); setDeleting(null); } catch (caught) { showError(messageFor(caught)); }
  };

  return <main className="app-shell">
    <header><h1>{t('app.title')}</h1><p>{t('app.subtitle')}</p><Button onClick={() => { setEditing(null); setFormOpen(true); }}>{t('service.create')}</Button></header>
    <FilterPanel
      dateFilter={dateFilter}
      type={typeFilter}
      onDateFilterChange={setDateFilter}
      onTypeChange={setTypeFilter}
      onReset={() => { setDateFilter(defaultDateFilter); setTypeFilter(undefined); }}
    />
    {error && <p role="alert">{error.message}</p>}
    <ServiceList services={services} isLoading={isLoading} isFiltered={Boolean(typeFilter) || dateFilter.mode !== 'allTime'} onEdit={(service) => { setEditing(service); setFormOpen(true); }} onPaid={(service) => void markPaid(service)} onDelete={setDeleting} />
    <ServiceForm open={formOpen} service={editing} onOpenChange={setFormOpen} onSubmit={save} />
    <DeleteConfirmation serviceName={deleting?.name ?? null} onOpenChange={(open) => { if (!open) setDeleting(null); }} onConfirm={confirmDelete} />
  </main>;
}

export default function App(): JSX.Element {
  return <ToastProvider><ServiceManager /></ToastProvider>;
}
