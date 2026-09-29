import { useRegisterPushToken } from '@/hooks/api/usePushToken';
import { useAuth } from '@clerk/expo';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

/** Silently (re)registers this device's push token on launch when the app is signed in and
 * notification permission was already granted in a previous session — so returning users don't
 * have to retoggle Settings every time. Does nothing if permission was never granted; the
 * explicit "turn on push notifications" flow (request + register) lives in the Settings screen's
 * toggle, since that's a user-initiated action, not something to trigger silently on launch. */
export function PushTokenSync() {
  const { isSignedIn } = useAuth();
  const registerPushToken = useRegisterPushToken();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isSignedIn || hasSynced.current || !Device.isDevice) return;
    hasSynced.current = true;

    (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;
        const devicePushToken = await Notifications.getDevicePushTokenAsync();
        if (devicePushToken.type !== 'ios' && devicePushToken.type !== 'android') return;
        await registerPushToken.mutateAsync({
          token: devicePushToken.data,
          platform: devicePushToken.type,
        });
      } catch {
        // Best-effort background refresh — a failure here isn't worth surfacing to the user.
      }
    })();
  }, [isSignedIn, registerPushToken]);

  return null;
}
