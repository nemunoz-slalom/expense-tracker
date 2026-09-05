import { apiBaseUrl } from '../config/runtime';
import {
  ApiError,
  ApiErrorPayload,
  CreateServiceRequest,
  ServiceFilters,
  ServiceResponse,
  UpdateServiceRequest,
} from '../types/services';

interface Envelope<T> {
  data: T;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let payload: ApiErrorPayload = { error: 'UnexpectedError', message: 'Unexpected request failure' };
    try {
      payload = await response.json() as ApiErrorPayload;
    } catch {
      // Non-JSON error responses still become a typed application error.
    }
    throw new ApiError(response.status, payload);
  }
  return response.json() as Promise<T>;
}

function serviceUrl(path = ''): string {
  return `${apiBaseUrl}/api/services${path}`;
}

export function serviceFilterQuery(filters: ServiceFilters): string {
  const params = new URLSearchParams();
  if (filters.month) {
    params.set('month', filters.month);
  } else if (filters.from && filters.to) {
    params.set('from', filters.from);
    params.set('to', filters.to);
  }
  if (filters.type) params.set('type', filters.type);
  if (filters.paid !== undefined) params.set('paid', String(filters.paid));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function listServices(filters: ServiceFilters = {}): Promise<ServiceResponse[]> {
  const response = await fetch(serviceUrl(serviceFilterQuery(filters)));
  const envelope = await parseResponse<Envelope<ServiceResponse[]>>(response);
  return envelope.data;
}

export async function getService(id: number): Promise<ServiceResponse> {
  const response = await fetch(serviceUrl(`/${id}`));
  const envelope = await parseResponse<Envelope<ServiceResponse>>(response);
  return envelope.data;
}

export async function createService(data: CreateServiceRequest): Promise<ServiceResponse> {
  const response = await fetch(serviceUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const envelope = await parseResponse<Envelope<ServiceResponse>>(response);
  return envelope.data;
}

export async function updateService(id: number, data: UpdateServiceRequest): Promise<ServiceResponse> {
  const response = await fetch(serviceUrl(`/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const envelope = await parseResponse<Envelope<ServiceResponse>>(response);
  return envelope.data;
}

export async function deleteService(id: number): Promise<void> {
  const response = await fetch(serviceUrl(`/${id}`), { method: 'DELETE' });
  if (!response.ok) await parseResponse<never>(response);
}

export async function notifyService(id: number): Promise<void> {
  const response = await fetch(serviceUrl(`/${id}/notify`), { method: 'POST' });
  if (!response.ok) await parseResponse<never>(response);
}
