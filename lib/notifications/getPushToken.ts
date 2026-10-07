import { getMessaging, getToken, registerDeviceForRemoteMessages } from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type PushPlatform = "ios" | "android";

/** Android's native push token *is* an FCM registration token already — FCM is the OS-level push
 * mechanism on Android, so expo-notifications' raw device token works as-is. iOS's native push
 * token is the raw APNs device token, a completely different format: Firebase rejects it outright
 * ("The registration token is not a valid FCM registration token") when the backend tries to send
 * through it. iOS needs Firebase's own APNs<->FCM token exchange instead, which requires
 * explicitly registering for remote messages first. */
export async function getPushToken(): Promise<{ token: string; platform: PushPlatform } | null> {
  if (Platform.OS === "android") {
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    if (devicePushToken.type !== "android") return null;
    return { token: devicePushToken.data, platform: "android" };
  }

  if (Platform.OS === "ios") {
    const messaging = getMessaging();
    await registerDeviceForRemoteMessages(messaging);
    const token = await getToken(messaging);
    return { token, platform: "ios" };
  }

  return null;
}
