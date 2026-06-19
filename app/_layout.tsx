import '@/global.css';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, usePathname, useGlobalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';

import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import Constants, { ExecutionEnvironment } from "expo-constants";
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/lib/posthog';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file as EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY')
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function RootLayoutContent() {
  const { isLoaded: authLoaded } = useAuth();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
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
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf')
  })

  useEffect(() => {
    // Hide splash only when both fonts and auth are loaded
    if (fontsLoaded && authLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, authLoaded])

  // Don't render app until both are ready
  if (!fontsLoaded || !authLoaded) return null;

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureScreens: false,
        captureTouches: true,
        propsToCapture: ['testID'],
        maxElementsCaptured: 20,
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </PostHogProvider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={isExpoGo ? undefined : tokenCache}>
      <RootLayoutContent />
    </ClerkProvider>
  );
}
