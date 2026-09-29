import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Android 8+ needs a channel before a raw FCM push can display — we send device tokens
 * straight to Firebase, bypassing Expo's push service, so the app owns channel setup.
 * No-op on iOS. Idempotent, so it's safe to call from multiple entry points. */
export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}
