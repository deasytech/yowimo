import { randomUUID } from 'expo-crypto';

/** One key per purchase *attempt* — reused across retries of that same attempt so a flaky
 * connection can't double-charge the player (see POST /packs/{id}/purchase in the API docs). */
export function newIdempotencyKey(): string {
  return randomUUID();
}
