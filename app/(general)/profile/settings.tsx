import GoBack from "@/components/shared/GoBack";
import ListHeading from "@/components/shared/ListHeading";
import { useRegisterPushToken, useUnregisterPushToken } from "@/hooks/api/usePushToken";
import { ensureAndroidNotificationChannel } from "@/lib/notifications/androidChannel";
import { getPushOptIn, setPushOptIn } from "@/lib/notifications/pushOptIn";
import { posthog } from "@/lib/posthog";
import { useClerk } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import * as Device from "expo-device";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  Lock,
  LogOut,
  Moon,
  Shield,
  User
} from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import { Linking, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const registerPushToken = useRegisterPushToken();
  const unregisterPushToken = useUnregisterPushToken();

  // "Enabled" here means "we've registered a push token with the backend", not raw OS
  // permission — permission can only be granted/requested, never programmatically revoked, so
  // turning this off just unregisters the token rather than pretending to change OS settings.
  const [push, setPushState] = useState(false);
  const [dark, setDark] = useState(true);
  const [biometric, setBiometric] = useState(false);
  // Chains push toggles onto one another so a fast off-then-on (or on-then-off) can't let a
  // stale DELETE land after a newer POST and silently unregister the token the user just enabled.
  const pushOpRef = useRef(Promise.resolve());

  useEffect(() => {
    (async () => {
      // The persisted choice (if any) is the source of truth — OS permission alone can't tell
      // us the user explicitly unregistered their token in this app after granting permission.
      const optIn = await getPushOptIn();
      if (optIn !== null) {
        setPushState(optIn);
        return;
      }
      const { status } = await Notifications.getPermissionsAsync();
      setPushState(status === "granted");
    })();
  }, []);

  const registerDeviceToken = async () => {
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    if (devicePushToken.type !== "ios" && devicePushToken.type !== "android") return;
    await registerPushToken.mutateAsync({
      token: devicePushToken.data,
      platform: devicePushToken.type,
    });
  };

  const performSetPush = async (next: boolean) => {
    if (!next) {
      try {
        await unregisterPushToken.mutateAsync();
      } catch {
        // Backend still has the token — don't claim opt-out succeeded.
        return;
      }
      setPushState(false);
      await setPushOptIn(false).catch(() => {});
      return;
    }

    if (!Device.isDevice) {
      // Simulators/emulators can't mint a real device token — nothing to register.
      setPushState(true);
      await setPushOptIn(true).catch(() => {});
      return;
    }

    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      if (!canAskAgain) {
        // iOS won't show the system prompt twice — only System Settings can flip it back.
        Linking.openSettings();
        return;
      }
      await ensureAndroidNotificationChannel();
      const { status: requested } = await Notifications.requestPermissionsAsync();
      if (requested !== "granted") return;
    }

    try {
      await registerDeviceToken();
    } catch {
      return;
    }
    setPushState(true);
    await setPushOptIn(true).catch(() => {});
  };

  const setPush = (next: boolean) => {
    pushOpRef.current = pushOpRef.current.catch(() => {}).then(() => performSetPush(next));
  };

  const toggleRows = [
    { Icon: Bell, label: "Push notifications", value: push, set: setPush },
    { Icon: Moon, label: "Dark mode", value: dark, set: setDark },
    { Icon: Lock, label: "Face ID / Touch ID", value: biometric, set: setBiometric },
  ];

  const groups = [
    {
      title: "ACCOUNT",
      items: [
        { Icon: User, label: "Edit profile", to: "/profile/edit" },
        { Icon: Shield, label: "Privacy", to: "/settings" },
        { Icon: Lock, label: "Security", to: "/settings" },
      ],
    },
    {
      title: "SUPPORT",
      items: [{ Icon: HelpCircle, label: "Help center", to: "/profile/help" }],
    },
    {
      title: "EXPLORE",
      items: [
        { Icon: Globe, label: "Public parties", to: "/play/public" },
        { Icon: Globe, label: "Marketplace", to: "/market-place" },
        { Icon: Globe, label: "Sponsor management", to: "/profile/sponsor-management" },
        { Icon: Globe, label: "Connect TV", to: "/play/connect-tv" },
      ],
    },
  ];

  const handleSignOut = async () => {
    try {
      // Best-effort, and must happen before signOut() invalidates the session token it needs.
      await unregisterPushToken.mutateAsync().catch(() => {});
      await signOut();
      // Otherwise the next account signed in on this device could briefly see the previous
      // user's cached parties/wallet/profile data until each query happens to refetch.
      queryClient.clear();
      posthog.capture('sign_out_completed');
      posthog.reset();
    } catch (error) {
      console.log('Sign-out failed:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Settings" />

        {/* ── Toggle group ── */}
        <View className="mt-2 rounded-3xl bg-card p-2">
          {toggleRows.map((r, idx) => (
            <View
              key={r.label}
              className="flex-row items-center gap-3 px-3 py-3"
              style={idx > 0 ? { borderTopWidth: 1, borderTopColor: "#2e2e38" } : undefined}
            >
              <LinearGradient
                colors={["#7A1EFF", "#B03BFF"]}
                className="w-9 h-9 rounded-xl items-center justify-center"
              >
                <r.Icon color="#fff" size={16} strokeWidth={2} />
              </LinearGradient>
              <Text className="flex-1 text-foreground text-sm font-medium">{r.label}</Text>
              <Switch
                value={r.value}
                onValueChange={r.set}
                trackColor={{ false: "#2c2c32", true: "#7A1EFF" }}
                thumbColor="#ffffff"
                ios_backgroundColor="#2c2c32"
              />
            </View>
          ))}
        </View>

        {/* ── Grouped sections ── */}
        {groups.map((g) => (
          <View key={g.title} className="mt-5">
            <ListHeading title={g.title} titleSize="text-sm" verticalPadding="my-2" />
            <View className="rounded-3xl bg-card">
              {g.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => router.push(item.to as any)}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 px-4 py-3.5"
                  style={
                    idx > 0
                      ? { borderTopWidth: 1, borderTopColor: "#2e2e38" }
                      : undefined
                  }
                >
                  <item.Icon color="#B03BFF" size={16} strokeWidth={2} />
                  <Text className="flex-1 text-foreground text-sm font-medium">
                    {item.label}
                  </Text>
                  <ChevronRight color="#a3a3ab" size={16} strokeWidth={2} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Log out ── */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.85}
          className="mt-5 flex-row items-center justify-center gap-2 rounded-2xl py-4"
          style={{
            backgroundColor: "rgba(239,68,68,0.15)",
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.30)",
          }}
        >
          <LogOut color="#ef4444" size={16} strokeWidth={2} />
          <Text className="text-destructive text-sm font-semibold">Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}