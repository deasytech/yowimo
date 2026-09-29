import * as SecureStore from 'expo-secure-store';

const KEY = 'push_opt_in';

/** Explicit user opt-in/opt-out for push, persisted across launches and shared between the
 * Settings toggle and the silent launch sync — so the sync can't re-register a token the user
 * deliberately removed, and Settings can reflect that choice instead of raw OS permission
 * (which, once granted, never reports back that the backend token was unregistered).
 * `null` means the user has never made an explicit choice. */
export async function getPushOptIn(): Promise<boolean | null> {
  const value = await SecureStore.getItemAsync(KEY);
  if (value === null) return null;
  return value === 'true';
}

export async function setPushOptIn(value: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEY, value ? 'true' : 'false');
}
