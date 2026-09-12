import { apiRequest, apiRequestPaginated, ApiRequestOptions } from '@/lib/api/client';
import { CursorMeta } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useCallback } from 'react';

/**
 * Binds the current Clerk session token to the API client. `getToken()` returns a cached,
 * auto-refreshed JWT — fetched fresh per call rather than once, so long-lived sessions
 * never sign requests with a stale token.
 */
export function useApi() {
  const { getToken } = useAuth();

  const request = useCallback(
    async <T>(path: string, options: Omit<ApiRequestOptions, 'token'> = {}): Promise<T> => {
      const token = await getToken();
      return apiRequest<T>(path, { ...options, token });
    },
    [getToken],
  );

  const requestPaginated = useCallback(
    async <T>(
      path: string,
      options: Omit<ApiRequestOptions, 'token'> = {},
    ): Promise<{ data: T; meta?: CursorMeta }> => {
      const token = await getToken();
      return apiRequestPaginated<T>(path, { ...options, token });
    },
    [getToken],
  );

  return { request, requestPaginated };
}
