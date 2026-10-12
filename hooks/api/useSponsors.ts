import { useApi } from '@/hooks/api/useApi';
import { toQueryString } from '@/lib/api/client';
import { SponsorshipListItem, SponsorSummaryResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

// User-scoped for the same reason as the wallet keys — never show another account's cache.
export const sponsorSummaryQueryKey = (userId: string | null | undefined) =>
  ['sponsor', userId, 'summary'] as const;
export const sponsorshipsQueryKey = (userId: string | null | undefined) =>
  ['sponsor', userId, 'sponsorships'] as const;

export function useSponsorSummary() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: sponsorSummaryQueryKey(userId),
    queryFn: () => request<SponsorSummaryResource>('/sponsors/me'),
    enabled: isLoaded && isSignedIn,
  });
}

/** Every sponsorship the caller has paid for, cursor-paginated. */
export function useMySponsorships() {
  const { requestPaginated } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  const query = useInfiniteQuery({
    queryKey: sponsorshipsQueryKey(userId),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      requestPaginated<SponsorshipListItem[]>(
        `/sponsors/me/sponsorships${toQueryString({ cursor: pageParam, per_page: 20 })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.has_more_pages ? (lastPage.meta.next_cursor ?? undefined) : undefined,
    enabled: isLoaded && isSignedIn,
  });

  return {
    ...query,
    sponsorships: query.data?.pages.flatMap((page) => page.data) ?? [],
  };
}
