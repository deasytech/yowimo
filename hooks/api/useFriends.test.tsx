import { FriendRequestResource, FriendResource } from '@/lib/api/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  friendRequestsQueryKey,
  friendsQueryKey,
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useFriendRequests,
  useFriends,
  useRejectFriendRequest,
  useRemoveFriend,
  useSendFriendRequest,
} from './useFriends';

const mockRequest = jest.fn();
jest.mock('@/hooks/api/useApi', () => ({
  useApi: () => ({ request: mockRequest, requestPaginated: jest.fn() }),
}));

const mockUseAuth = jest.fn();
jest.mock('@clerk/expo', () => ({
  useAuth: () => mockUseAuth(),
}));

const makeFriend = (friendshipId: number, id: number, username: string): FriendResource => ({
  friendship_id: friendshipId,
  friend: { id, username, display_name: username, avatar_url: null, xp: 0 },
  accepted_at: '2026-07-01T00:00:00Z',
});

const makeRequest = (
  id: number,
  sender: { id: number; username: string },
  receiver: { id: number; username: string },
): FriendRequestResource => ({
  id,
  status: 'pending',
  sender: { ...sender, display_name: null, avatar_url: null },
  receiver: { ...receiver, display_name: null, avatar_url: null },
  accepted_at: null,
  created_at: '2026-08-27T00:00:00Z',
});

const wrapper = (client: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

const clients: QueryClient[] = [];
const newClient = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return client;
};

beforeEach(() => {
  mockRequest.mockReset();
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ userId: 'user_1', isLoaded: true, isSignedIn: true });
});

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

describe('useFriends', () => {
  it('does not fetch until Clerk is loaded and signed in', async () => {
    mockUseAuth.mockReturnValue({ userId: null, isLoaded: false, isSignedIn: false });

    await renderHook(() => useFriends(), { wrapper: wrapper(newClient()) });

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('fetches the full (unpaginated) friends list', async () => {
    const friend = makeFriend(44, 219, 'leo');
    mockRequest.mockResolvedValue([friend]);

    const { result } = await renderHook(() => useFriends(), { wrapper: wrapper(newClient()) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith('/friends');
    expect(result.current.data).toEqual([friend]);
  });
});

describe('useFriendRequests', () => {
  it('fetches every pending request in both directions', async () => {
    const request = makeRequest(91, { id: 482, username: 'maya' }, { id: 340, username: 'sam' });
    mockRequest.mockResolvedValue([request]);

    const { result } = await renderHook(() => useFriendRequests(), { wrapper: wrapper(newClient()) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith('/friend-requests');
    expect(result.current.data).toEqual([request]);
  });
});

describe('useSendFriendRequest', () => {
  it('posts the receiver id and invalidates the requests list', async () => {
    const client = newClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    mockRequest.mockResolvedValue(makeRequest(91, { id: 1, username: 'me' }, { id: 340, username: 'sam' }));

    const { result } = await renderHook(() => useSendFriendRequest(), { wrapper: wrapper(client) });
    result.current.mutate(340);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith('/friend-requests', {
      method: 'POST',
      body: { receiver_id: 340 },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: friendRequestsQueryKey('user_1') });
  });
});

describe('useAcceptFriendRequest', () => {
  it('invalidates both the requests list and the friends list', async () => {
    const client = newClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    mockRequest.mockResolvedValue({});

    const { result } = await renderHook(() => useAcceptFriendRequest(), { wrapper: wrapper(client) });
    result.current.mutate(91);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith('/friend-requests/91/accept', { method: 'POST' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: friendRequestsQueryKey('user_1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: friendsQueryKey('user_1') });
  });
});

describe('useRejectFriendRequest', () => {
  it('rejects a pending request', async () => {
    mockRequest.mockResolvedValue({});
    const { result } = await renderHook(() => useRejectFriendRequest(), { wrapper: wrapper(newClient()) });
    result.current.mutate(91);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith('/friend-requests/91/reject', { method: 'POST' });
  });
});

describe('useCancelFriendRequest', () => {
  it('withdraws a request the caller sent', async () => {
    mockRequest.mockResolvedValue([]);
    const { result } = await renderHook(() => useCancelFriendRequest(), { wrapper: wrapper(newClient()) });
    result.current.mutate(91);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith('/friend-requests/91', { method: 'DELETE' });
  });
});

describe('useRemoveFriend', () => {
  it('unfriends by friendship id', async () => {
    mockRequest.mockResolvedValue([]);
    const { result } = await renderHook(() => useRemoveFriend(), { wrapper: wrapper(newClient()) });
    result.current.mutate(44);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith('/friends/44', { method: 'DELETE' });
  });
});
