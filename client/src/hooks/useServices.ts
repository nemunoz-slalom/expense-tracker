import { useCallback, useEffect, useRef, useState } from 'react';

import * as servicesApi from '../api/services.api';
import { CreateServiceRequest, ServiceFilters, ServiceResponse, UpdateServiceRequest } from '@/types/services';

const defaultFilters: ServiceFilters = {};

export interface UseServicesResult {
  services: ServiceResponse[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  create: (data: CreateServiceRequest) => Promise<ServiceResponse>;
  update: (id: number, data: UpdateServiceRequest) => Promise<ServiceResponse>;
  remove: (id: number) => Promise<void>;
  notify: (id: number) => Promise<void>;
}

export function useServices(filters: ServiceFilters = defaultFilters): UseServicesResult {
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const nextServices = await servicesApi.listServices(filters);
      if (currentRequest === requestId.current) setServices(nextServices);
    } catch (caught) {
      if (currentRequest === requestId.current) setError(caught as Error);
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (data: CreateServiceRequest) => {
    const service = await servicesApi.createService(data);
    await refresh();
    return service;
  }, [refresh]);
  const update = useCallback(async (id: number, data: UpdateServiceRequest) => {
    const service = await servicesApi.updateService(id, data);
    await refresh();
    return service;
  }, [refresh]);
  const remove = useCallback(async (id: number) => {
    await servicesApi.deleteService(id);
    await refresh();
  }, [refresh]);
  const notify = useCallback(async (id: number) => {
    await servicesApi.notifyService(id);
  }, []);

  return { services, isLoading, error, refresh, create, update, remove, notify };
}
