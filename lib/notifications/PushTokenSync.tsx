import { useRegisterPushToken } from '@/hooks/api/usePushToken';
import { ensureAndroidNotificationChannel } from '@/lib/notifications/androidChannel';
import { getPushToken } from '@/lib/notifications/getPushToken';
import { getPushOptIn } from '@/lib/notifications/pushOptIn';
import { useAuth } from '@clerk/expo';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

/** Silently (re)registers this device's push token on launch when the app is signed in and
 * notification permission was already granted in a previous session — so returning users don't
 * have to retoggle Settings every time. Does nothing if permission was never granted, or if the
 * user explicitly turned push off in Settings (that opt-out is a deliberate choice, so a launch
 * sync must not quietly re-enable it). The explicit "turn on push notifications" flow (request +
 * register) lives in the Settings screen's toggle, since that's a user-initiated action, not
 * something to trigger silently on launch. */
export function PushTokenSync() {
  const { isSignedIn, userId } = useAuth();
  const registerPushToken = useRegisterPushToken();
  // Tracks which account was last synced (not just whether *a* sync ever ran), and is only set
  // after a successful registration — so a failed lookup/request/registration, or switching to a
  // different account without restarting the app, both leave this eligible to try again.
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !userId || !Device.isDevice) return;
    if (syncedUserId.current === userId) return;

    (async () => {
      try {
        const optIn = await getPushOptIn();
        if (optIn === false) return;
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;
        await ensureAndroidNotificationChannel();
        const pushToken = await getPushToken();
        if (!pushToken) return;
        await registerPushToken.mutateAsync(pushToken);
        syncedUserId.current = userId;
      } catch {
        // Best-effort background refresh — a failure here isn't worth surfacing to the user.
      }
    })();
  }, [isSignedIn, userId, registerPushToken]);

  return null;
}
