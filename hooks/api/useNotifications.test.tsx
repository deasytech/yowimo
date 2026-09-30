import { NotificationResource } from '@/lib/api/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  notificationsQueryKey,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from './useNotifications';

const mockRequest = jest.fn();
const mockRequestPaginated = jest.fn();
jest.mock('@/hooks/api/useApi', () => ({
  useApi: () => ({ request: mockRequest, requestPaginated: mockRequestPaginated }),
}));

const mockUseAuth = jest.fn();
jest.mock('@clerk/expo', () => ({
  useAuth: () => mockUseAuth(),
}));

const makeNotification = (
  id: number,
  overrides: Partial<NotificationResource> = {},
): NotificationResource => ({
  id,
  title: 'Game complete!',
  body: 'You earned 25 tokens.',
  type: 'game.completed',
  metadata: {},
  read_at: null,
  created_at: '2026-08-28T10:45:00Z',
  ...overrides,
});

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
  mockRequestPaginated.mockReset();
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ userId: 'user_1', isLoaded: true, isSignedIn: true });
});

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

describe('useNotifications', () => {
  it('does not fetch until Clerk is loaded and signed in', async () => {
    mockUseAuth.mockReturnValue({ userId: null, isLoaded: false, isSignedIn: false });

    await renderHook(() => useNotifications(), { wrapper: wrapper(newClient()) });

    expect(mockRequestPaginated).not.toHaveBeenCalled();
  });

  it('fetches the feed and flattens it', async () => {
    const notification = makeNotification(771);
    mockRequestPaginated.mockResolvedValueOnce({ data: [notification] });

    const { result } = await renderHook(() => useNotifications(), { wrapper: wrapper(newClient()) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequestPaginated).toHaveBeenCalledWith('/notifications?per_page=20');
    expect(result.current.notifications).toEqual([notification]);
  });

  it('paginates by cursor across loaded pages', async () => {
    mockRequestPaginated
      .mockResolvedValueOnce({
        data: [makeNotification(771)],
        meta: { per_page: 20, has_more_pages: true, next_cursor: 'cursor-1', prev_cursor: null },
      })
      .mockResolvedValueOnce({
        data: [makeNotification(772)],
        meta: { per_page: 20, has_more_pages: false, next_cursor: null, prev_cursor: 'cursor-1' },
      });

    const client = newClient();
    const { result } = await renderHook(() => useNotifications(), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.notifications).toHaveLength(2));
    expect(result.current.notifications.map((n) => n.id)).toEqual([771, 772]);
    expect(mockRequestPaginated).toHaveBeenLastCalledWith('/notifications?cursor=cursor-1&per_page=20');
  });
});

describe('useMarkNotificationRead', () => {
  it('flips only the matching cached row to read, leaving others untouched', async () => {
    const client = newClient();
    client.setQueryData(notificationsQueryKey('user_1'), {
      pages: [{ data: [makeNotification(771), makeNotification(772)] }],
      pageParams: [undefined],
    });
    mockRequest.mockResolvedValue(makeNotification(771, { read_at: '2026-08-28T11:00:00Z' }));

    const { result } = await renderHook(() => useMarkNotificationRead(), { wrapper: wrapper(client) });
    result.current.mutate(771);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith('/notifications/read', {
      method: 'PATCH',
      body: { notification_id: 771 },
    });

    const cached: any = client.getQueryData(notificationsQueryKey('user_1'));
    expect(cached.pages[0].data[0].read_at).not.toBeNull();
    expect(cached.pages[0].data[1].read_at).toBeNull();
  });
});

describe('useMarkAllNotificationsRead', () => {
  it('flips every cached row to read', async () => {
    const client = newClient();
    client.setQueryData(notificationsQueryKey('user_1'), {
      pages: [{ data: [makeNotification(771), makeNotification(772)] }],
      pageParams: [undefined],
    });
    mockRequest.mockResolvedValue([]);

    const { result } = await renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: wrapper(client),
    });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith('/notifications/read-all', { method: 'PATCH' });

    const cached: any = client.getQueryData(notificationsQueryKey('user_1'));
    expect(cached.pages[0].data.every((n: NotificationResource) => n.read_at !== null)).toBe(true);
  });
});
