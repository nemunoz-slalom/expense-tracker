import { apiBaseUrl } from '../config/runtime';
import { ApiError, ApiErrorPayload, ServiceFilters } from '../types/services';
import { serviceFilterQuery } from './services.api';

export async function exportServicesPdf(filters: ServiceFilters): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/services/export/pdf${serviceFilterQuery(filters)}`);
  if (!response.ok) {
    let payload: ApiErrorPayload = { error: 'UnexpectedError', message: 'Unexpected request failure' };
    try {
      payload = await response.json() as ApiErrorPayload;
    } catch {
      // Non-JSON error responses still become a typed application error.
    }
    throw new ApiError(response.status, payload);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'services-report.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
