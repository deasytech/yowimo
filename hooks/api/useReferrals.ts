import { useApi } from '@/hooks/api/useApi';
import { ClaimReferralCodePayload, ReferralSummaryResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useMutation, useQuery } from '@tanstack/react-query';

// Not live on the backend yet (requested) — both endpoints 404 until then.
export const referralSummaryQueryKey = (userId: string | null | undefined) =>
  ['referrals', 'summary', userId] as const;

/** The viewer's own referral code, how many friends they've referred, and what they've earned
 * from it so far. Used by both the Referral Center screen and the Wallet "Earn tokens" banner,
 * so reward_amount never gets hard-coded in two places that could drift apart. */
export function useReferralSummary() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: referralSummaryQueryKey(userId),
    queryFn: () => request<ReferralSummaryResource>('/referrals/summary'),
    enabled: isLoaded && isSignedIn,
  });
}

/** Claims a referral code during onboarding — sets the claimer's referred_by on the backend.
 * This doesn't pay out anything by itself (the reward only lands once the referred friend
 * completes their first party), so it has no effect on the claimer's own referral summary —
 * nothing to invalidate here. Best-effort from the caller's side: a failure (bad code, already
 * claimed, self-referral) shouldn't block onboarding from completing. */
export function useClaimReferralCode() {
  const { request } = useApi();

  return useMutation({
    mutationFn: (payload: ClaimReferralCodePayload) =>
      request<void>('/referrals/claim', { method: 'POST', body: payload }),
  });
}
