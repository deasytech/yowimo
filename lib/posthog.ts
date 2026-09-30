import PostHog from 'posthog-react-native'
import Constants from 'expo-constants'

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined
const isPostHogConfigured = Boolean(apiKey && apiKey !== 'phc_your_project_token_here')

if (!isPostHogConfigured && __DEV__) {
  console.warn(
    'PostHog project token not configured. Set POSTHOG_PROJECT_TOKEN in your .env file.'
  )
}

export const posthog = new PostHog(apiKey || 'placeholder_key', {
  host,
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  maxBatchSize: 100,
  maxQueueSize: 1000,
  preloadFeatureFlags: true,
  sendFeatureFlagEvent: true,
  featureFlagsRequestTimeoutMs: 10000,
  requestTimeout: 10000,
  fetchRetryCount: 3,
  fetchRetryDelay: 3000,
});

// Every capture()/screen()/identify() call across the app is fire-and-forget (no `await`,
// no `.catch()` at any of the 20+ call sites) — each returns a Promise<void> that rejects on
// a network failure (PostHogFetchNetworkError), which was surfacing as an unhandled promise
// rejection and taking the whole app down. Wrapped once here instead of patching every call
// site: analytics failing silently should never be able to crash the app.
function warnOnFailure(method: string, err: unknown) {
  if (__DEV__) console.warn(`[PostHog] ${method} failed`, err);
}

const rawCapture = posthog.capture.bind(posthog);
posthog.capture = ((...args: Parameters<typeof rawCapture>) =>
  Promise.resolve(rawCapture(...args)).catch((err: unknown) => warnOnFailure('capture', err))) as typeof posthog.capture;

const rawScreen = posthog.screen.bind(posthog);
posthog.screen = ((...args: Parameters<typeof rawScreen>) =>
  Promise.resolve(rawScreen(...args)).catch((err: unknown) => warnOnFailure('screen', err))) as typeof posthog.screen;

const rawIdentify = posthog.identify.bind(posthog);
posthog.identify = ((...args: Parameters<typeof rawIdentify>) =>
  Promise.resolve(rawIdentify(...args)).catch((err: unknown) => warnOnFailure('identify', err))) as typeof posthog.identify;
