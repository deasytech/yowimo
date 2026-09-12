import { apiRequest, apiRequestPaginated } from './client';
import { ApiError } from './types';

const mockFetch = (response: {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
}) => {
  const fn = jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: response.json ?? (() => Promise.resolve(undefined)),
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
};

const headersSentTo = (fn: jest.Mock): Headers => {
  const init = fn.mock.calls[0][1] as RequestInit;
  return init.headers as Headers;
};

describe('apiRequestPaginated', () => {
  it('returns data and meta on success', async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          message: 'OK',
          data: [{ id: 1 }],
          meta: { per_page: 20, has_more_pages: false, next_cursor: null, prev_cursor: null },
        }),
    });

    const result = await apiRequestPaginated<{ id: number }[]>('/game-types');

    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.meta?.per_page).toBe(20);
  });

  it('calls the configured base URL and path', async () => {
    const fn = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, message: 'OK', data: null }),
    });

    await apiRequestPaginated('/users/me');

    expect(fn.mock.calls[0][0]).toBe(`${process.env.EXPO_PUBLIC_API_URL}/users/me`);
  });

  it('always sends an Accept header, and only sends Content-Type/Authorization/Idempotency-Key when applicable', async () => {
    const fn = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, message: 'OK', data: null }),
    });

    await apiRequestPaginated('/game-types');

    const headers = headersSentTo(fn);
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.has('Content-Type')).toBe(false);
    expect(headers.has('Authorization')).toBe(false);
    expect(headers.has('Idempotency-Key')).toBe(false);
  });

  it('adds Content-Type, Authorization, and Idempotency-Key when a body/token/key are given', async () => {
    const fn = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, message: 'OK', data: null }),
    });

    await apiRequestPaginated('/packs/1/purchase', {
      method: 'POST',
      body: { quantity: 1 },
      token: 'abc123',
      idempotencyKey: 'idem-1',
    });

    const headers = headersSentTo(fn);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBe('Bearer abc123');
    expect(headers.get('Idempotency-Key')).toBe('idem-1');

    const init = fn.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(JSON.stringify({ quantity: 1 }));
  });

  it('merges caller-supplied headers over the defaults regardless of HeadersInit shape', async () => {
    const fn = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, message: 'OK', data: null }),
    });

    await apiRequestPaginated('/game-types', {
      token: 'abc123',
      // Tuple-array HeadersInit — the shape a plain object-spread merge used to mishandle.
      headers: [['X-Trace-Id', 'trace-1'], ['Accept', 'application/vnd.custom+json']],
    });

    const headers = headersSentTo(fn);
    expect(headers.get('X-Trace-Id')).toBe('trace-1');
    // Caller override wins over the default Accept header.
    expect(headers.get('Accept')).toBe('application/vnd.custom+json');
    // Unrelated defaults are untouched.
    expect(headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('accepts a Headers instance as caller-supplied headers', async () => {
    const fn = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, message: 'OK', data: null }),
    });

    await apiRequestPaginated('/game-types', {
      headers: new Headers({ 'X-Trace-Id': 'trace-2' }),
    });

    expect(headersSentTo(fn).get('X-Trace-Id')).toBe('trace-2');
  });

  it('throws ApiError with the server message/status/errors on a validation failure', async () => {
    mockFetch({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          success: false,
          message: 'Validation failed',
          errors: { username: ['Username is already taken'] },
        }),
    });

    await expect(apiRequestPaginated('/users/me')).rejects.toMatchObject({
      message: 'Validation failed',
      status: 422,
      errors: { username: ['Username is already taken'] },
    });
  });

  it('throws ApiError even on a 200 that carries success: false', async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: false, message: 'Something went wrong' }),
    });

    await expect(apiRequestPaginated('/users/me')).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to a generic message when the error response has no JSON body', async () => {
    mockFetch({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(apiRequestPaginated('/users/me')).rejects.toMatchObject({
      message: 'Request failed with status 500',
      status: 500,
    });
  });
});

describe('apiRequest', () => {
  it('unwraps just the data, dropping meta', async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          message: 'OK',
          data: { id: 7 },
          meta: { per_page: 20, has_more_pages: false, next_cursor: null, prev_cursor: null },
        }),
    });

    await expect(apiRequest<{ id: number }>('/users/me')).resolves.toEqual({ id: 7 });
  });
});

describe('ApiError.firstValidationError', () => {
  it('returns undefined when there are no errors', () => {
    expect(new ApiError('msg', 400).firstValidationError).toBeUndefined();
  });

  it('returns the first message of the first field when errors are arrays', () => {
    const error = new ApiError('Validation failed', 422, {
      username: ['Username is already taken', 'Too short'],
      email: ['Invalid email'],
    });
    expect(error.firstValidationError).toBe('Username is already taken');
  });

  it('stringifies a non-array error value', () => {
    const error = new ApiError('Validation failed', 422, { username: 'taken' } as any);
    expect(error.firstValidationError).toBe('taken');
  });
});
