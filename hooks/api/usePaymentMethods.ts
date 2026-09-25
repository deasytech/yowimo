import { useApi } from '@/hooks/api/useApi';
import { PaymentMethodResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Scoped by user id — saved cards are personal, same reasoning as walletQueryKey.
export const paymentMethodsQueryKey = (userId: string | null | undefined) =>
  ['wallet', userId, 'payment-methods'] as const;

/**
 * Saved cards, default first. There's no standalone "add a card" endpoint — a card is only
 * ever saved as a side effect of a token-bundle purchase made with a payment_reference whose
 * resulting authorization came back reusable.
 */
export function usePaymentMethods() {
  const { request } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: paymentMethodsQueryKey(userId),
    queryFn: () => request<PaymentMethodResource[]>('/wallet/payment-methods'),
    enabled: isLoaded && isSignedIn,
  });
}

export function useSetDefaultPaymentMethod() {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (paymentMethodId: number) =>
      request<PaymentMethodResource>(`/wallet/payment-methods/${paymentMethodId}/default`, {
        method: 'PATCH',
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<PaymentMethodResource[]>(
        paymentMethodsQueryKey(userId),
        (current) =>
          current?.map((method) => ({ ...method, is_default: method.id === updated.id })),
      );
    },
  });
}

export function useDeletePaymentMethod() {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    // The docs explicitly say `data` on this response isn't reliable for figuring out which
    // card got promoted to default — re-fetch via GET instead of trusting it.
    mutationFn: (paymentMethodId: number) =>
      request<unknown>(`/wallet/payment-methods/${paymentMethodId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey(userId) });
    },
  });
}
