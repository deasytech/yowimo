import { useApi } from '@/hooks/api/useApi';
import { PushTokenPlatform, PushTokenResource } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';

interface RegisterPushTokenPayload {
  token: string;
  platform: PushTokenPlatform;
}

/** Registers (or replaces) this device's push token. The docs' own example uses a raw FCM/APNs
 * device token, not Expo's wrapped push-token format — the backend sends notifications straight
 * to Firebase/APNs itself. */
export function useRegisterPushToken() {
  const { request } = useApi();
  return useMutation({
    mutationFn: (payload: RegisterPushTokenPayload) =>
      request<PushTokenResource>('/push-tokens', { method: 'POST', body: payload }),
  });
}

/** Unregisters this device — no id/body, the API removes the caller's one token. */
export function useUnregisterPushToken() {
  const { request } = useApi();
  return useMutation({
    mutationFn: () => request<[]>('/push-tokens', { method: 'DELETE' }),
  });
}
