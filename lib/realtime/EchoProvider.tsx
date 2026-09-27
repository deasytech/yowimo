import { useAuth } from '@clerk/expo';
import Echo from 'laravel-echo';
import * as PusherModule from 'pusher-js/react-native';
import type PusherType from 'pusher-js';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

// pusher-js's React Native build is a webpack/UMD bundle whose compiled output attaches the
// class as `module.exports.Pusher`, not as a clean default export — its own .d.ts disagrees
// with this (it types a plain default export), so a normal `import Pusher from '...'` silently
// resolves to the wrong value at runtime ("constructor is not callable" when Echo tries to
// `new` it). Unwrap defensively so this keeps working regardless of which shape shows up.
const Pusher = ((PusherModule as unknown as { Pusher?: unknown }).Pusher ??
  (PusherModule as unknown as { default?: unknown }).default ??
  PusherModule) as unknown as typeof PusherType;

const API_URL = process.env.EXPO_PUBLIC_API_URL as string | undefined;
// Broadcasting auth lives at the site root, not under /api/v1.
const API_ORIGIN = API_URL?.replace(/\/api\/v1\/?$/, '');

const REVERB_APP_KEY = process.env.EXPO_PUBLIC_REVERB_APP_KEY;
const REVERB_HOST = process.env.EXPO_PUBLIC_REVERB_HOST;
const REVERB_PORT = Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 8080);
const REVERB_SCHEME = process.env.EXPO_PUBLIC_REVERB_SCHEME ?? 'http';

type EchoInstance = Echo<'reverb'>;

const EchoContext = createContext<EchoInstance | null>(null);

/**
 * One Reverb/Pusher-protocol connection for the app's lifetime. Private/presence channel auth
 * needs a *fresh* Clerk token per subscription attempt (sessions are short-lived) — the
 * authorizer below reads `getTokenRef.current` so it always calls the latest `getToken` from
 * `useAuth()` without needing to recreate the Echo instance (and reconnect the socket) on every
 * render.
 */
export function EchoProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [echo] = useState<EchoInstance | null>(() => {
    if (!REVERB_APP_KEY || !REVERB_HOST || !API_ORIGIN) return null;

    return new Echo<'reverb'>({
      broadcaster: 'reverb',
      Pusher,
      key: REVERB_APP_KEY,
      wsHost: REVERB_HOST,
      wsPort: REVERB_PORT,
      wssPort: REVERB_PORT,
      forceTLS: REVERB_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      authorizer: (channel: { name: string }) => ({
        authorize: (
          socketId: string,
          callback: (
            error: Error | null,
            authData: { auth: string; channel_data?: string; shared_secret?: string } | null,
          ) => void,
        ) => {
          (async () => {
            try {
              const token = await getTokenRef.current();
              const res = await fetch(`${API_ORIGIN}/broadcasting/auth`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
                body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
              });
              if (!res.ok) throw new Error(`Channel auth failed: ${res.status}`);
              callback(null, await res.json());
            } catch (error) {
              callback(error instanceof Error ? error : new Error(String(error)), null);
            }
          })();
        },
      }),
    });
  });

  useEffect(() => {
    return () => {
      echo?.disconnect();
    };
    // Intentionally empty — this instance lives for the app's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <EchoContext.Provider value={echo}>{children}</EchoContext.Provider>;
}

/** Null when Reverb env vars aren't configured — callers should fall back to polling. */
export function useEcho(): EchoInstance | null {
  return useContext(EchoContext);
}
