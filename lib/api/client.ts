import { ApiError, ApiResponse, CursorMeta } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL as string | undefined;

if (!API_URL) {
  throw new Error('Add your API base URL to the .env file as EXPO_PUBLIC_API_URL');
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: object;
  token?: string | null;
  idempotencyKey?: string;
}

/** Same as apiRequest, but keeps `meta` — for cursor-paginated list endpoints. */
export async function apiRequestPaginated<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ data: T; meta?: CursorMeta }> {
  const { body, token, idempotencyKey, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Envelope shape is consistent even for non-2xx (except a raw 429/5xx from infra, which
  // may not be JSON at all) — try to parse, fall back to a generic error on parse failure.
  let json: ApiResponse<T> | undefined;
  try {
    json = await res.json();
  } catch {
    // no body / not JSON
  }

  if (!res.ok || !json || json.success === false) {
    const message = json?.message ?? `Request failed with status ${res.status}`;
    const errors = json && json.success === false ? json.errors : undefined;
    throw new ApiError(message, res.status, errors);
  }

  return { data: json.data, meta: json.meta };
}

/**
 * Every endpoint except GET /health requires a Clerk bearer token — callers pass it in
 * explicitly (see hooks/api/useApi.ts) rather than this module reaching for auth state itself.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { data } = await apiRequestPaginated<T>(path, options);
  return data;
}
