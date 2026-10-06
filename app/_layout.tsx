import '@/global.css';
import { registerGlobals } from '@livekit/react-native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import ErrorBoundary from '@/components/shared/ErrorBoundary';
import NetworkStatusGate from '@/components/shared/NetworkStatusGate';
import { ChatProvider } from '@/context/ChatContext';
import { PlayersProvider } from '@/context/PlayersContext';
import { queryClient } from '@/lib/api/queryClient';
import { PushTokenSync } from '@/lib/notifications/PushTokenSync';
import { posthog } from '@/lib/posthog';
import { EchoProvider } from '@/lib/realtime/EchoProvider';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from 'posthog-react-native';
import { StatusBar } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Required once, before any LiveKit/WebRTC usage (video-room.tsx) — sets up the native
// WebRTC bindings LiveKit's JS layer expects to find on globalThis.
registerGlobals();

// The SDK queues ad requests internally until this resolves — fire-and-forget at startup rather
// than blocking app render on it, same as every other one-time native SDK bootstrap here.
const mobileAdsInstance = mobileAds();
(async () => {
  try {
    // Dev builds can point at a real ad unit (see lib/ads/admob.ts — needed to test Server-Side
    // Verification at all, since Google's shared TestIds.REWARDED can't carry our SSV config).
    // Registering this emulator/simulator as a test device keeps that real unit serving safe
    // test ads instead of real/billable ones. Never applies to a production build.
    if (__DEV__) {
      await mobileAdsInstance.setRequestConfiguration({ testDeviceIdentifiers: ['EMULATOR'] });
    }
    await mobileAdsInstance.initialize();
  } catch (err) {
    if (__DEV__) console.warn('[AdMob] initialize failed', err);
  }
})();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file as EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY')
}

function RootLayoutContent() {
  const { isLoaded: authLoaded } = useAuth();
  // Only keys in this set are allowed through to analytics
  const SAFE_PARAM_KEYS = new Set<string>([
    'deck_id',
    'category',
    'mode',
    'tab',
    'invite',
  ]);

  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      const safeParams = Object.fromEntries(
        Object.entries(params).filter(([key]) => SAFE_PARAM_KEYS.has(key)),
      );
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...safeParams,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  const [fontsLoaded] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    // These map to `font-sg-*` in global.css's @theme — were bundled natively via the
    // expo-font config plugin (app.json) but never registered under the alias the CSS
    // actually uses, so every font-sg-* Text was rendering with an unresolved fontFamily.
    'sg-regular': require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'sg-light': require('../assets/fonts/SpaceGrotesk-Light.ttf'),
    'sg-medium': require('../assets/fonts/SpaceGrotesk-Medium.ttf'),
    'sg-semibold': require('../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'sg-bold': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
  })

  // `useFonts`'s promise can resolve a frame before iOS's text engine can actually use the
  // newly-registered custom family — painting the very first frame right on that resolution
  // renders any font-sg-*/font-sans-* Text blank (it self-corrects on the next re-render, which
  // is why this only ever showed up as an intermittent "text vanishes" glitch). One extra
  // animation frame after fontsLoaded flips gives native font registration time to settle
  // before anything actually paints.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (!fontsLoaded) return;
    const raf = requestAnimationFrame(() => setFontsReady(true));
    return () => cancelAnimationFrame(raf);
  }, [fontsLoaded]);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync()
      .catch(() => {
        // Native splash screen may not be available (e.g. dev builds, web)
      });
  }, []);

  useEffect(() => {
    // Hide splash only when both fonts and auth are loaded
    if (fontsReady && authLoaded) {
      SplashScreen.hideAsync()
        .catch(() => {
          // Native splash screen may not be available
        });
    }
  }, [fontsReady, authLoaded])

  // Don't render app until both are ready
  if (!fontsReady || !authLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <EchoProvider>
        <PushTokenSync />
        <PostHogProvider
          client={posthog}
          autocapture={{
            captureScreens: false,
            captureTouches: true,
            propsToCapture: ['testID'],
            maxElementsCaptured: 20,
          }}
        >
          <PlayersProvider>
            <ChatProvider>
              <Stack screenOptions={{ headerShown: false }} />
              <StatusBar barStyle='light-content' />
            </ChatProvider>
          </PlayersProvider>
        </PostHogProvider>
      </EchoProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <NetworkStatusGate>
            <RootLayoutContent />
          </NetworkStatusGate>
        </ClerkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
