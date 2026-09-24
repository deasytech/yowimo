import { useApi } from '@/hooks/api/useApi';
import { toQueryString } from '@/lib/api/client';
import { PackCategory, PackPurchaseResult, PackResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// Scoped by user id — `owned_by_me` on every pack resource is per-account, so a
// sign-out/sign-in-as-someone-else on the same device must never show the previous
// account's cached ownership state.
export const packsQueryKey = (userId: string | null | undefined, category?: PackCategory) =>
  ['packs', userId, category ?? 'all'] as const;
export const featuredPacksQueryKey = (userId: string | null | undefined) =>
  ['packs', userId, 'featured'] as const;
export const packQueryKey = (userId: string | null | undefined, packId: number | null) =>
  ['packs', userId, 'detail', packId] as const;

/** Cursor-paginated catalog, optionally filtered to one category. */
export function usePacks(category?: PackCategory) {
  const { requestPaginated } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  const query = useInfiniteQuery({
    queryKey: packsQueryKey(userId, category),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      requestPaginated<PackResource[]>(
        `/packs${toQueryString({ category, cursor: pageParam, per_page: 20 })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.has_more_pages ? (lastPage.meta.next_cursor ?? undefined) : undefined,
    enabled: isLoaded && isSignedIn,
  });

  return {
    ...query,
    packs: query.data?.pages.flatMap((page) => page.data) ?? [],
  };
}

/** Curated packs for the marketplace hero banner — first page only. */
export function useFeaturedPacks() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: featuredPacksQueryKey(userId),
    queryFn: () => request<PackResource[]>('/packs/featured'),
    enabled: isLoaded && isSignedIn,
  });
}

/**
 * Single-pack detail. `preview_cards` silently becomes the full card set when owned —
 * check `owned_by_me` to know which one a given response actually contains.
 */
export function usePack(packId: number | null) {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: packQueryKey(userId, packId),
    queryFn: () => request<PackResource>(`/packs/${packId}`),
    enabled: packId !== null && isLoaded && isSignedIn,
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
