import NetInfo from "@react-native-community/netinfo";
import { WifiOff } from "lucide-react-native";
import { styled } from "nativewind";
import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

/** `null` means "not yet determined" — NetInfo hasn't reported in yet on cold start, and we
 * don't want to flash the offline modal before its first real check resolves. */
function isOffline(isConnected: boolean | null, isInternetReachable: boolean | null): boolean {
  return isConnected === false || isInternetReachable === false;
}

/** Covers the whole app with a blocking modal whenever the device has no network, and drops it
 * automatically the moment connectivity returns — no manual reload needed, though the Retry
 * button forces an immediate re-check for anyone impatient. */
export default function NetworkStatusGate({ children }: { children: ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(isOffline(state.isConnected, state.isInternetReachable));
    });
    return unsubscribe;
  }, []);

  const handleRetry = async () => {
    setChecking(true);
    const state = await NetInfo.fetch();
    setOffline(isOffline(state.isConnected, state.isInternetReachable));
    setChecking(false);
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
