import { useEffect, useRef, useState } from 'react';

import * as statsApi from '../api/stats.api';
import { ConsumptionStats } from '../api/stats.api';
import { ServiceType } from '../types/services';

export interface UseConsumptionStatsResult {
  stats: ConsumptionStats | null;
  isLoading: boolean;
  error: Error | null;
}

export function useConsumptionStats(type?: ServiceType): UseConsumptionStatsResult {
  const [stats, setStats] = useState<ConsumptionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    if (!type) {
      setStats(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    void statsApi.getConsumptionStats(type)
      .then((nextStats) => {
        if (currentRequest === requestId.current) setStats(nextStats);
      })
      .catch((caught: unknown) => {
        if (currentRequest === requestId.current) {
          setError(caught instanceof Error ? caught : new Error('Unexpected request failure'));
        }
      })
      .finally(() => {
        if (currentRequest === requestId.current) setIsLoading(false);
      });
  }, [type]);

  return { stats, isLoading, error };
}
