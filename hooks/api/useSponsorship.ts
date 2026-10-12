import { useApi } from '@/hooks/api/useApi';
import { partyQueryKey } from '@/hooks/api/useParties';
import { SponsorshipInviteResource, SponsorshipScope } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Host-only: mint (or re-fetch, if one is still pending for this scope) the link a friend opens
 * to pay for the party. */
export function useCreateSponsorshipInvite() {
  const { request } = useApi();

  return useMutation({
    mutationFn: ({ partyId, scope }: { partyId: number; scope: SponsorshipScope }) =>
      request<SponsorshipInviteResource>(`/parties/${partyId}/sponsorship-invites`, {
        method: 'POST',
        body: { scope },
      }),
  });
}

export const sponsorshipInviteQueryKey = (token: string | null) =>
  ['sponsorship-invite', token] as const;

/** What a sponsor sees after opening the link: the party, the scope, and the exact amount. */
export function useSponsorshipInvite(token: string | null) {
  const { request } = useApi();

  return useQuery({
    queryKey: sponsorshipInviteQueryKey(token),
    queryFn: () => request<SponsorshipInviteResource>(`/sponsorship-invites/${token}`),
    enabled: !!token,
  });
}

/** Debits the sponsor's wallet. The idempotency key is per attempt, reused on retry, so a flaky
 * connection can't charge the sponsor twice. */
export function usePaySponsorship() {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, idempotencyKey }: { token: string; idempotencyKey: string }) =>
      request<SponsorshipInviteResource>(`/sponsorship-invites/${token}/pay`, {
        method: 'POST',
        idempotencyKey,
      }),
    onSuccess: (invite) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: sponsorshipInviteQueryKey(invite.token) });
      queryClient.invalidateQueries({ queryKey: partyQueryKey(invite.party.id) });
      queryClient.invalidateQueries({ queryKey: ['sponsor'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    },
  });
}
