import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { profileQueryKey, useProfile, useUpdateProfile } from './useProfile';

const mockRequest = jest.fn();
jest.mock('@/hooks/api/useApi', () => ({
  useApi: () => ({ request: mockRequest, requestPaginated: jest.fn() }),
}));

const mockUseAuth = jest.fn();
jest.mock('@clerk/expo', () => ({
  useAuth: () => mockUseAuth(),
}));

const wrapper = (client: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

// Tracked so afterEach can clear them — otherwise react-query's gc timers keep Jest's
// process alive after the run finishes.
const clients: QueryClient[] = [];
const newClient = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return client;
};

beforeEach(() => {
  mockRequest.mockReset();
  mockUseAuth.mockReset();
});

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

describe('profileQueryKey', () => {
  it('scopes the key by user id so different accounts get different cache entries', () => {
    expect(profileQueryKey('user_1')).not.toEqual(profileQueryKey('user_2'));
    expect(profileQueryKey(undefined)).not.toEqual(profileQueryKey('user_1'));
  });
});

describe('useProfile', () => {
  it('does not fetch until Clerk is loaded and signed in', async () => {
    mockUseAuth.mockReturnValue({ userId: null, isLoaded: false, isSignedIn: false });

    await renderHook(() => useProfile(), { wrapper: wrapper(newClient()) });

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('fetches /users/me once signed in and returns the resolved profile', async () => {
    mockUseAuth.mockReturnValue({ userId: 'user_1', isLoaded: true, isSignedIn: true });
    mockRequest.mockResolvedValue({ id: 1, username: 'desi' });

    const { result } = await renderHook(() => useProfile(), { wrapper: wrapper(newClient()) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 1, username: 'desi' });
    expect(mockRequest).toHaveBeenCalledWith('/users/me');
  });

  it('keeps separate cache entries per user id, so switching accounts never shows stale data', async () => {
    const client = newClient();

    mockRequest.mockResolvedValueOnce({ id: 1, username: 'alice' });
    mockUseAuth.mockReturnValue({ userId: 'user_alice', isLoaded: true, isSignedIn: true });
    const alice = await renderHook(() => useProfile(), { wrapper: wrapper(client) });
    await waitFor(() => expect(alice.result.current.isSuccess).toBe(true));
    await alice.unmount();

    mockRequest.mockResolvedValueOnce({ id: 2, username: 'bob' });
    mockUseAuth.mockReturnValue({ userId: 'user_bob', isLoaded: true, isSignedIn: true });
    const bob = await renderHook(() => useProfile(), { wrapper: wrapper(client) });

    // Bob's own cache entry resolves to his own profile — never Alice's.
    await waitFor(() => expect(bob.result.current.isSuccess).toBe(true));
    expect(bob.result.current.data).toEqual({ id: 2, username: 'bob' });

    // Alice's entry is untouched under her own key.
    expect(client.getQueryData(profileQueryKey('user_alice'))).toEqual({
      id: 1,
      username: 'alice',
    });
  });
});

describe('useUpdateProfile', () => {
  it("writes the mutation result into the current user's profile cache entry", async () => {
    mockUseAuth.mockReturnValue({ userId: 'user_1', isLoaded: true, isSignedIn: true });
    mockRequest.mockResolvedValue({ id: 1, username: 'renamed' });
    const client = newClient();

    const { result } = await renderHook(() => useUpdateProfile(), { wrapper: wrapper(client) });
    result.current.mutate({ username: 'renamed' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(profileQueryKey('user_1'))).toEqual({
      id: 1,
      username: 'renamed',
    });
  });
});
