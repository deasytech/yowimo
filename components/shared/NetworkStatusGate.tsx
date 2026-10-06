import NetInfo from "@react-native-community/netinfo";
import { WifiOff } from "lucide-react-native";
import { styled } from "nativewind";
import { ReactNode, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

// How long a "no connection" reading has to hold before we act on it.
const DEBOUNCE_MS = 600;

/** Only `isConnected` (the radio's own state) gates this — `isInternetReachable` is an active
 * probe NetInfo itself documents as unreliable right after launch (it can flip a couple of
 * times before settling), and toggling a native <Modal>'s visibility that fast is a known way
 * to hard-crash iOS ("unbalanced" view controller transitions). Debounced below on top of that
 * as a second guard against any flapping getting through. */
function isOffline(isConnected: boolean | null): boolean {
  return isConnected === false;
}

/** Covers the whole app with a blocking modal whenever the device has no network, and drops it
 * automatically the moment connectivity returns — no manual reload needed, though the Retry
 * button forces an immediate re-check for anyone impatient. */
export default function NetworkStatusGate({ children }: Readonly<{ children: ReactNode }>) {
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recheck = async () => {
    const state = await NetInfo.fetch();
    setOffline(isOffline(state.isConnected));
  };

  useEffect(() => {
    const setDebounced = (next: boolean) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setOffline(next), DEBOUNCE_MS);
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      setDebounced(isOffline(state.isConnected));
    });

    // A transition that happens while the app is backgrounded (toggling airplane mode from
    // Settings, a Wi-Fi handoff mid-suspend) can land without this listener ever firing — iOS in
    // particular can suspend the JS thread entirely while backgrounded, so there's no live
    // callback to miss so much as a queue that never gets drained. Force a fresh, uncached check
    // every time the app comes back to the foreground as a backstop, independent of whatever the
    // listener did or didn't deliver while away.
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") recheck();
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleRetry = async () => {
    setChecking(true);
    try {
      await recheck();
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      {children}
      <Modal visible={offline} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
        <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background px-8">
          <WifiOff color="#a3a3ab" size={40} strokeWidth={1.8} />
          <Text className="text-center text-lg font-sans-semibold text-foreground">
            No internet connection
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            This will close automatically once you&apos;re back online.
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            disabled={checking}
            activeOpacity={0.85}
            style={{ opacity: checking ? 0.7 : 1 }}
            className="min-w-32 items-center rounded-2xl bg-primary px-6 py-3"
          >
            {checking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View>
                <Text className="text-sm font-semibold text-white">Retry</Text>
              </View>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </>
  );
}
