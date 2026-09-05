export const serviceTypes = ['electricity', 'gas', 'internet', 'mobile', 'water'] as const;

export type ServiceType = typeof serviceTypes[number];
export type ServiceStatus = 'overdue' | 'urgent' | 'normal' | 'paid';

export interface Service {
  id: number;
  name: string;
  type: ServiceType;
  amount: number | null;
  paymentDate: string | null;
  dueDate: string;
  paid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceResponse extends Service {
  status: ServiceStatus;
}

export interface CreateServiceRequest {
  name: string;
  type: ServiceType;
  amount?: number | null;
  paymentDate?: string | null;
  dueDate: string;
}

export interface UpdateServiceRequest {
  name?: string;
  type?: ServiceType;
  amount?: number | null;
  paymentDate?: string | null;
  dueDate?: string;
  paid?: boolean;
}

export interface ServiceFilters {
  month?: string;
  from?: string;
  to?: string;
  type?: ServiceType;
  paid?: boolean;
}

export interface ApiErrorPayload {
  error: string;
  message: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  public constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.error;
  }
}
