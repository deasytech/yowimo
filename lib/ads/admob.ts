import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

// Pinned to 16.5.0, not latest — v17's own changelog states it requires React Native 0.86.0+ and
// drops Legacy Architecture support outright, despite its package.json peerDependencies claiming
// (incorrectly, fixed only in 17.1.0) react-native >=0.76. Installing v17 against this project's
// RN 0.81.5 compiles and links fine but the module is never discoverable via
// TurboModuleRegistry at runtime ("RNGoogleMobileAdsModule could not be found") — confirmed this
// is the actual cause (not a stale build/install, tried a full uninstall + clean prebuild first).
// 16.5.0 predates that floor and uses the older (but still fully supported) useRewardedAd(id,
// options) signature — see its call site in HeroCard.tsx. Revisit once this project's Expo SDK
// reaches RN 0.86+ (SDK 57+).

// Google's shared TestIds.REWARDED belongs to Google's own demo account, not ours — Server-Side
// Verification is configured per ad unit you own, so a request against TestIds.REWARDED can
// never fire our SSV callback no matter how correctly that's set up. Testing the real reward
// flow needs our own ad unit id (set via EXPO_PUBLIC_ADMOB_REWARDED_*_UNIT_ID once created in the
// AdMob console), paired with testDeviceIdentifiers in app/_layout.tsx so it still serves safe
// test ads rather than real/billable ones. TestIds.REWARDED remains the fallback for any
// platform without a real unit id yet, so the app doesn't crash — the SSV flow just can't be
// exercised against it.
const REAL_REWARDED_AD_UNIT_ID = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS_UNIT_ID,
  android: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID_UNIT_ID,
});

// `||`, not `??` — an unset env var reads back as `""` (e.g. .env.example ships the keys empty),
// and `??` only falls back on null/undefined, so an empty string would otherwise pass straight
// through as a literal (invalid) ad unit id instead of falling back to the dev test id.
export const REWARDED_AD_UNIT_ID: string | null =
  REAL_REWARDED_AD_UNIT_ID || (__DEV__ ? TestIds.REWARDED : null);
