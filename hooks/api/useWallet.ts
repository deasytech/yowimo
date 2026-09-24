import { useApi } from '@/hooks/api/useApi';
import { WalletSnapshot } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';

// Scoped by user id for the same reason as profileQueryKey — a sign-out/sign-in-as-someone-
// else on the same device must never show the previous account's cached balance.
export const walletQueryKey = (userId: string | null | undefined) =>
  ['wallet', userId] as const;

export function useWallet() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: walletQueryKey(userId),
    queryFn: () => request<WalletSnapshot>('/wallet'),
    enabled: isLoaded && isSignedIn,
  });
}
