import { useApi } from '@/hooks/api/useApi';
import {
  PurchaseTokenBundlePayload,
  TokenBundleResource,
  WalletTransactionResource,
} from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const TOKEN_BUNDLES_QUERY_KEY = ['token-bundles'] as const;

/** Purchasable token bundles — a plain catalog resource, not user-scoped. */
export function useTokenBundles() {
  const { request } = useApi();

  return useQuery({
    queryKey: TOKEN_BUNDLES_QUERY_KEY,
    queryFn: () => request<TokenBundleResource[]>('/token-bundles'),
  });
}

interface PurchaseTokenBundleArgs extends PurchaseTokenBundlePayload {
  bundleId: number;
  idempotencyKey: string;
}

export function usePurchaseTokenBundle() {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    // Give at most one of payment_reference / payment_method_id — give neither to charge the
    // caller's default saved card (see hooks/api/usePaymentMethods.ts).
    mutationFn: ({ bundleId, idempotencyKey, payment_reference, payment_method_id }: PurchaseTokenBundleArgs) =>
      request<WalletTransactionResource>(`/token-bundles/${bundleId}/purchase`, {
        method: 'POST',
        idempotencyKey,
        body: { payment_reference, payment_method_id },
      }),
    onSuccess: () => {
      // Covers the balance (['wallet', userId]) and the ledger (['wallet', userId,
      // 'transactions']) via prefix match. Also refresh saved cards — a payment_reference
      // charge whose authorization is reusable gets auto-saved as a new one.
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
