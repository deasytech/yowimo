import { useApi } from '@/hooks/api/useApi';
import { UpdateProfilePayload, UserResource } from '@/lib/api/types';
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

export function useUpdateProfile() {
  const { request } = useApi();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      request<UserResource>('/users/me', { method: 'PATCH', body: payload }),
    onSuccess: (user) => {
      queryClient.setQueryData(profileQueryKey(userId), user);
    },
  });
}
