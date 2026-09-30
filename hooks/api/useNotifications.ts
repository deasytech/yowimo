import { useApi } from '@/hooks/api/useApi';
import { toQueryString } from '@/lib/api/client';
import { CursorMeta, NotificationResource } from '@/lib/api/types';
import { useAuth } from '@clerk/expo';
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Scoped by user id for the same reason as walletQueryKey — a sign-out/sign-in-as-someone-else
// on the same device must never show the previous account's cached feed.
export const notificationsQueryKey = (userId: string | null | undefined) =>
  ['notifications', userId] as const;

type NotificationsPage = { data: NotificationResource[]; meta?: CursorMeta };

/** Full feed, newest first, cursor-paginated. No `unread`/`type` filter exists server-side —
 * filter on `read_at` client-side. */
export function useNotifications() {
  const { requestPaginated } = useApi();
  const { userId, isLoaded, isSignedIn } = useAuth();

  const query = useInfiniteQuery({
    queryKey: notificationsQueryKey(userId),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      requestPaginated<NotificationResource[]>(
        `/notifications${toQueryString({ cursor: pageParam, per_page: 20 })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.has_more_pages ? (lastPage.meta.next_cursor ?? undefined) : undefined,
    enabled: isLoaded && isSignedIn,
  });

  return {
    ...query,
    notifications: query.data?.pages.flatMap((page) => page.data) ?? [],
  };
}

/** Flags matching, currently-unread rows as read across every loaded page. The API doesn't
 * document a response body worth trusting for either mark-read endpoint, so success just means
 * "the server now agrees" — we set the timestamp locally rather than parse a response shape. */
function markPagesRead(
  data: InfiniteData<NotificationsPage>,
  matches: (n: NotificationResource) => boolean,
): InfiniteData<NotificationsPage> {
  const readAt = new Date().toISOString();
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((n) => (matches(n) && !n.read_at ? { ...n, read_at: readAt } : n)),
    })),
  };
}

/** Scoped to the caller — another user's id 404s. Marking an already-read one is a no-op,
 * still 200. */
export function useMarkNotificationRead() {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (notificationId: number) =>
      request<NotificationResource>('/notifications/read', {
        method: 'PATCH',
        body: { notification_id: notificationId },
      }),
    onSuccess: (_result, notificationId) => {
      queryClient.setQueryData<InfiniteData<NotificationsPage>>(notificationsQueryKey(userId), (data) =>
        data ? markPagesRead(data, (n) => n.id === notificationId) : data,
      );
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: () => request<never[]>('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.setQueryData<InfiniteData<NotificationsPage>>(notificationsQueryKey(userId), (data) =>
        data ? markPagesRead(data, () => true) : data,
      );
    },
  });
}
