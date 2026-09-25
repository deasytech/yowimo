import { useApi } from '@/hooks/api/useApi';
import { BadgeResource, UserBadgeResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';

export const BADGES_QUERY_KEY = ['badges'] as const;
export const earnedBadgesQueryKey = (userId: string | null | undefined) =>
  ['badges', 'earned', userId] as const;

/** The full badge catalog — every badge that exists, not user-scoped. */
export function useBadges() {
  const { request } = useApi();

  return useQuery({
    queryKey: BADGES_QUERY_KEY,
    queryFn: () => request<BadgeResource[]>('/badges'),
  });
}

/** Badges the signed-in player has earned, newest first. */
export function useEarnedBadges() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: earnedBadgesQueryKey(userId),
    queryFn: () => request<UserBadgeResource[]>('/users/me/badges'),
    enabled: isLoaded && isSignedIn,
  });
}
