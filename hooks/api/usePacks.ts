import { useApi } from '@/hooks/api/useApi';
import { toQueryString } from '@/lib/api/client';
import { PackCategory, PackPurchaseResult, PackResource } from '@/lib/api/types';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export const packsQueryKey = (category?: PackCategory) => ['packs', category ?? 'all'] as const;
export const FEATURED_PACKS_QUERY_KEY = ['packs', 'featured'] as const;
export const packQueryKey = (packId: number | null) => ['packs', 'detail', packId] as const;

/** Cursor-paginated catalog, optionally filtered to one category. */
export function usePacks(category?: PackCategory) {
  const { requestPaginated } = useApi();

  const query = useInfiniteQuery({
    queryKey: packsQueryKey(category),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      requestPaginated<PackResource[]>(
        `/packs${toQueryString({ category, cursor: pageParam, per_page: 20 })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.has_more_pages ? (lastPage.meta.next_cursor ?? undefined) : undefined,
  });

  return {
    ...query,
    packs: query.data?.pages.flatMap((page) => page.data) ?? [],
  };
}

/** Curated packs for the marketplace hero banner — first page only. */
export function useFeaturedPacks() {
  const { request } = useApi();

  return useQuery({
    queryKey: FEATURED_PACKS_QUERY_KEY,
    queryFn: () => request<PackResource[]>('/packs/featured'),
  });
}

/**
 * Single-pack detail. `preview_cards` silently becomes the full card set when owned —
 * check `owned_by_me` to know which one a given response actually contains.
 */
export function usePack(packId: number | null) {
  const { request } = useApi();

  return useQuery({
    queryKey: packQueryKey(packId),
    queryFn: () => request<PackResource>(`/packs/${packId}`),
    enabled: packId !== null,
  });
}

export function usePurchasePack() {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packId, idempotencyKey }: { packId: number; idempotencyKey: string }) =>
      request<PackPurchaseResult>(`/packs/${packId}/purchase`, {
        method: 'POST',
        idempotencyKey,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      // `owned_by_me` lives on every pack resource now — refresh the catalog/featured lists
      // and the detail cache so they all pick up the new ownership, not just the one pack.
      queryClient.invalidateQueries({ queryKey: ['packs'] });
    },
  });
}
