import { useApi } from '@/hooks/api/useApi';
import { ProfileStatsResource, UpdateProfilePayload, UserResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Scoped to the signed-in user so switching accounts on the same device (sign out, sign
// back in as someone else) can't show the previous identity's cached profile.
export const profileQueryKey = (userId: string | null | undefined) =>
  ['profile', 'me', userId] as const;

export function useProfile() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => request<UserResource>('/users/me'),
    enabled: isLoaded && isSignedIn,
  });
}

export const profileStatsQueryKey = (userId: string | null | undefined) =>
  ['profile', 'stats', userId] as const;

/** Lifetime parties-played + MVP counts for the Profile screen's stat tiles. Deliberately not
 * folded into useProfile() — kept as its own query since GET /users/me/stats is its own
 * endpoint precisely so these aggregate queries don't ride along on every auth-check call. */
export function useProfileStats() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: profileStatsQueryKey(userId),
    queryFn: () => request<ProfileStatsResource>('/users/me/stats'),
    enabled: isLoaded && isSignedIn,
  });
}

export function useUpdateProfile() {
  const { request } = useApi();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      request<UserResource>('/users/me', { method: 'PATCH', body: payload }),
    onSuccess: (user) => {
      // The optimistic write shows the saved values instantly (no flash of stale data while a
      // refetch is in flight), but don't trust it alone as the source of truth afterward — force
      // a real GET /users/me too, so the profile screen it's about to navigate to is guaranteed
      // to reflect what the server actually persisted, not just what the PATCH response echoed.
      queryClient.setQueryData(profileQueryKey(userId), user);
      queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) });
    },
  });
}
