import { apiBaseUrl } from '../config/runtime';
import { ApiError, ApiErrorPayload, ServiceType } from '../types/services';

export interface ConsumptionPeriod {
  period: string;
  amount: number;
}

export interface ConsumptionStats {
  type: ServiceType;
  periods: ConsumptionPeriod[];
  average: number;
}

export async function getConsumptionStats(type: ServiceType, periods = 6): Promise<ConsumptionStats> {
  const response = await fetch(`${apiBaseUrl}/api/services/stats/type/${type}?periods=${periods}`);
  if (!response.ok) {
    let payload: ApiErrorPayload = { error: 'UnexpectedError', message: 'Unexpected request failure' };
    try {
      payload = await response.json() as ApiErrorPayload;
    } catch {
      // Non-JSON error responses still become a typed application error.
    }
    throw new ApiError(response.status, payload);
  }
  const envelope = await response.json() as { data: ConsumptionStats };
  return envelope.data;
}
