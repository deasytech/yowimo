import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import { ApiError } from './types';

// React Query's default refetch-on-window-focus is a web concept (browser tab focus) — RN has
// no such event, so without this every query (not just game sessions) silently never refetched
// on foregrounding the app. This wires the same behavior to AppState instead.
AppState.addEventListener('change', (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
});

// Without this, React Query has no idea the device is actually offline — it keeps firing
// queries and their retries against a dead connection instead of pausing. A genuine native
// crash was traced to exactly this: many concurrent NSURLSession tasks (queries + retries +
// expo-image loads + PostHog + Reverb auth, all sharing the same process-wide networking queue)
// racing during a real connectivity drop. This can't fix the underlying OS-level race, but it
// removes the trigger condition by not repeatedly hammering the network while it's down —
// queries pause while offline and resume automatically once NetInfo reports back online.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected ?? false);
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});
