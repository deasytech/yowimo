import { useApi } from '@/hooks/api/useApi';
import { toQueryString } from '@/lib/api/client';
import { WalletSnapshot, WalletTransactionResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

// Scoped by user id for the same reason as profileQueryKey — a sign-out/sign-in-as-someone-
// else on the same device must never show the previous account's cached balance.
export const walletQueryKey = (userId: string | null | undefined) =>
  ['wallet', userId] as const;
export const walletTransactionsQueryKey = (userId: string | null | undefined) =>
  ['wallet', userId, 'transactions'] as const;

export function useWallet() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: walletQueryKey(userId),
    queryFn: () => request<WalletSnapshot>('/wallet'),
    enabled: isLoaded && isSignedIn,
  });
}

/** Full ledger, newest first, cursor-paginated — no date/type filter exists server-side. */
export function useWalletTransactions() {
  const { requestPaginated } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  const query = useInfiniteQuery({
    queryKey: walletTransactionsQueryKey(userId),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      requestPaginated<WalletTransactionResource[]>(
        `/wallet/transactions${toQueryString({ cursor: pageParam, per_page: 20 })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.has_more_pages ? (lastPage.meta.next_cursor ?? undefined) : undefined,
    enabled: isLoaded && isSignedIn,
  });

  return {
    ...query,
    transactions: query.data?.pages.flatMap((page) => page.data) ?? [],
  };
}
