import '@/global.css';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import Constants, { ExecutionEnvironment } from "expo-constants";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file as EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY')
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),

    'sg-regular': require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'sg-medium': require('../assets/fonts/SpaceGrotesk-Medium.ttf'),
    'sg-semibold': require('../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'sg-bold': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
    'sg-light': require('../assets/fonts/SpaceGrotesk-Light.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={isExpoGo ? undefined : tokenCache}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}
