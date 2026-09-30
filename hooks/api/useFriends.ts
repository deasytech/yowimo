import { useApi } from '@/hooks/api/useApi';
import { FriendRequestResource, FriendResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Scoped by user id for the same reason as profileQueryKey — a sign-out/sign-in-as-someone-
// else on the same device must never show the previous account's cached list.
export const friendsQueryKey = (userId: string | null | undefined) => ['friends', userId] as const;
export const friendRequestsQueryKey = (userId: string | null | undefined) =>
  ['friend-requests', userId] as const;

/** Accepted friends, newest-accepted first. Not paginated — the API returns the full
 * collection in a plain array with no `meta` block. */
export function useFriends() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: friendsQueryKey(userId),
    queryFn: () => request<FriendResource[]>('/friends'),
    enabled: isLoaded && isSignedIn,
  });
}

/** Pending requests in both directions, also unpaginated. The API has no direction field —
 * compare `sender.id`/`receiver.id` against the caller's own id to sort incoming vs. sent. */
export function useFriendRequests() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: friendRequestsQueryKey(userId),
    queryFn: () => request<FriendRequestResource[]>('/friend-requests'),
    enabled: isLoaded && isSignedIn,
  });
}

export function useSendFriendRequest() {
  const { request } = useApi();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiverId: number) =>
      request<FriendRequestResource>('/friend-requests', {
        method: 'POST',
        body: { receiver_id: receiverId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendRequestsQueryKey(userId) });
    },
  });
}

/** Receiver-only. Moves a row from pending requests into accepted friends. */
export function useAcceptFriendRequest() {
  const { request } = useApi();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: number) =>
      request<FriendRequestResource>(`/friend-requests/${friendshipId}/accept`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendRequestsQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: friendsQueryKey(userId) });
    },
  });
}

/** Receiver-only. */
export function useRejectFriendRequest() {
  const { request } = useApi();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: number) =>
      request<FriendRequestResource>(`/friend-requests/${friendshipId}/reject`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendRequestsQueryKey(userId) });
    },
  });
}

/** Sender-only — withdraws a request you sent. Not the same action as rejecting one you
 * received (see the docs' own warning: same verb, similar URL, different resource/actor). */
export function useCancelFriendRequest() {
  const { request } = useApi();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: number) =>
      request<never[]>(`/friend-requests/${friendshipId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendRequestsQueryKey(userId) });
    },
  });
}

/** Unfriend — either side may call this on an accepted friendship. */
export function useRemoveFriend() {
  const { request } = useApi();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: number) =>
      request<never[]>(`/friends/${friendshipId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendsQueryKey(userId) });
    },
  });
}
