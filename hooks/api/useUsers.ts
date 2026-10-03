import { useApi } from '@/hooks/api/useApi';
import { PublicUserResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';

export const publicUserQueryKey = (userId: number | null) => ['users', userId] as const;

/** Another user's public profile (GET /users/{id}) — never the signed-in user's own, that's
 * useProfile(). 404s exactly the same whether the id doesn't exist, belongs to a deactivated
 * account, or either side has blocked the other, so there's no separate "blocked" state to
 * handle here beyond the generic error UI. */
export function usePublicUser(userId: number | null) {
  const { request } = useApi();
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: publicUserQueryKey(userId),
    queryFn: () => request<PublicUserResource>(`/users/${userId}`),
    enabled: isLoaded && isSignedIn && userId !== null,
  });
}
