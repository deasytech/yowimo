import { useApi } from '@/hooks/api/useApi';
import { AdRewardProgressResource, AdRewardSessionResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useMutation, useQuery } from '@tanstack/react-query';

const RECONCILE_POLL_MS = 2000;

// Not live on the backend yet (requested) — both endpoints 404 until then, which the UI treats
// as "quest unavailable" rather than a hard error (see HeroCard.tsx).
export const adRewardProgressQueryKey = (userId: string | null | undefined) =>
  ['ad-rewards', 'progress', userId] as const;

/** Pass `reconciling: true` for a short window right after the client's own EARNED_REWARD event
 * fires, to poll until the backend's SSV-driven credit actually lands — that event only proves
 * the device saw the ad finish, not that Google's server-to-server callback has reached the
 * backend yet (HeroCard.tsx owns the window length and give-up behavior). */
export function useAdRewardProgress(options: { reconciling?: boolean } = {}) {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { reconciling = false } = options;

  return useQuery({
    queryKey: adRewardProgressQueryKey(userId),
    queryFn: () => request<AdRewardProgressResource>('/ad-rewards/progress'),
    enabled: isLoaded && isSignedIn,
    refetchInterval: reconciling ? RECONCILE_POLL_MS : false,
  });
}

/** Mints a single-use token to attach as the rewarded ad's SSV customData — one per watch
 * attempt, not reused. An unused mint (ad never finished, load failed) just expires on the
 * backend; no idempotency key needed the way a purchase needs one, since minting alone never
 * credits anything. */
export function useMintAdRewardSession() {
  const { request } = useApi();

  return useMutation({
    mutationFn: () => request<AdRewardSessionResource>('/ad-rewards/sessions', { method: 'POST' }),
  });
}
