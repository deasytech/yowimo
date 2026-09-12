import { useApi } from '@/hooks/api/useApi';
import { UpdateProfilePayload, UserResource } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const PROFILE_QUERY_KEY = ['profile', 'me'] as const;

export function useProfile() {
  const { request } = useApi();

  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => request<UserResource>('/users/me'),
  });
}

export function useUpdateProfile() {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      request<UserResource>('/users/me', { method: 'PATCH', body: payload }),
    onSuccess: (user) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, user);
    },
  });
}
