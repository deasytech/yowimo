import { apiRequest, apiRequestPaginated, ApiRequestOptions, toQueryString } from '@/lib/api/client';
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

  // Several endpoints (game types, token bundles, badges, featured packs) are cursor-paginated
  // backend-side, but the screens that read them want the complete list up front, not an
  // infinite-scroll/"load more" UI — the catalogs are small reference data, not a feed. Reaching
  // for plain request() there silently truncated to whatever fit on the first page once a
  // catalog grew past the default page size, with nothing on screen indicating anything was
  // missing. This walks every page and concatenates, so the caller always gets the full set.
  const requestAllPages = useCallback(
    async <T>(
      path: string,
      params: Record<string, string | number | undefined | null> = {},
    ): Promise<T[]> => {
      const token = await getToken();
      const results: T[] = [];
      let cursor: string | undefined;

      do {
        const { data, meta } = await apiRequestPaginated<T[]>(
          `${path}${toQueryString({ ...params, cursor, per_page: params.per_page ?? 50 })}`,
          { token },
        );
        results.push(...data);
        cursor = meta?.has_more_pages ? (meta.next_cursor ?? undefined) : undefined;
      } while (cursor);

      return results;
    },
    [getToken],
  );

  return { request, requestPaginated, requestAllPages };
}
