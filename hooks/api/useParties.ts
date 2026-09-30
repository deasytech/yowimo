import { useApi } from '@/hooks/api/useApi';
import { toQueryString } from '@/lib/api/client';
import {
  AddGuestPlayerPayload,
  CreatePartyPayload,
  PartyDetail,
  PartyMembership,
  PartyMembershipStatus,
  PartyMode,
  PartyPlayerResource,
  PartyStatus,
  PartySummary,
  VideoTokenResource,
} from '@/lib/api/types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface DiscoverFeedFilters {
  mode?: PartyMode;
  game_type_id?: number;
  search?: string;
  enabled?: boolean;
}

export const discoverFeedQueryKey = (filters: DiscoverFeedFilters = {}) =>
  ['parties', 'discover', filters.mode ?? 'any', filters.game_type_id ?? 'any', filters.search ?? ''] as const;

/**
 * The public discover feed. Per the docs this is hardcoded server-side to
 * visibility=public AND status IN (scheduled, live) — there's no "my parties" view, and no
 * filter for vibe/category tags beyond mode/game_type_id/search.
 */
export function useDiscoverFeed(filters: DiscoverFeedFilters = {}) {
  const { requestPaginated } = useApi();

  const query = useInfiniteQuery({
    queryKey: discoverFeedQueryKey(filters),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      requestPaginated<PartyDetail[]>(
        `/parties${toQueryString({
          mode: filters.mode,
          game_type_id: filters.game_type_id,
          search: filters.search,
          cursor: pageParam,
          per_page: 20,
        })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.has_more_pages ? (lastPage.meta.next_cursor ?? undefined) : undefined,
    enabled: filters.enabled ?? true,
  });

  return {
    ...query,
    parties: query.data?.pages.flatMap((page) => page.data) ?? [],
  };
}

export const partyQueryKey = (partyId: number | null) => ['parties', 'detail', partyId] as const;

/**
 * Full party detail. Visibility rules per the docs: the host always sees their own party at
 * any status; a draft is 403 to anyone else; otherwise only public parties are visible.
 * `room_code` can be entirely absent from the response (not null) when neither applies.
 */
export function useParty(partyId: number | null) {
  const { request } = useApi();

  return useQuery({
    queryKey: partyQueryKey(partyId),
    queryFn: () => request<PartyDetail>(`/parties/${partyId}`),
    enabled: partyId !== null,
  });
}

export const partyPlayersQueryKey = (partyId: number | null) => ['parties', 'players', partyId] as const;

/** The party's roster — real identities (id/username/avatar), not just a headcount. Not
 * paginated (bounded by max_players). Includes players who left with `status: "left"`; filter
 * to `"active"` for a lobby "who's here" list. Static snapshot, not realtime — refetch after a
 * join/leave action rather than expecting this to update on its own. */
export function usePartyPlayers(partyId: number | null) {
  const { request } = useApi();

  return useQuery({
    queryKey: partyPlayersQueryKey(partyId),
    queryFn: () => request<PartyPlayerResource[]>(`/parties/${partyId}/players`),
    enabled: partyId !== null,
  });
}

/** Host-only: add an in-room pass-and-play guest (no account, no Clerk token of their own —
 * the host's token vouches for them). Always creates a new row, unlike the self-join endpoint's
 * rejoin-reuse. Guest adds don't broadcast on the presence channel, so refetch the roster after
 * a successful add rather than waiting on a realtime event. */
export function useAddGuestPlayer() {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ partyId, ...payload }: AddGuestPlayerPayload & { partyId: number }) =>
      request<PartyPlayerResource>(`/parties/${partyId}/players`, {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (_player, { partyId }) => {
      queryClient.invalidateQueries({ queryKey: partyPlayersQueryKey(partyId) });
    },
  });
}

export const hostedPartiesQueryKey = ['parties', 'hosted'] as const;

/** Every party the caller hosts, any status/visibility — the "My Parties" management view.
 * Bucketing (Upcoming/Past/Canceled) is client-side per the docs; this just paginates raw. */
export function useHostedParties() {
  const { requestPaginated } = useApi();

  const query = useInfiniteQuery({
    queryKey: hostedPartiesQueryKey,
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      requestPaginated<PartyDetail[]>(
        `/users/me/parties/hosted${toQueryString({ cursor: pageParam, per_page: 20 })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.has_more_pages ? (lastPage.meta.next_cursor ?? undefined) : undefined,
  });

  return {
    ...query,
    parties: query.data?.pages.flatMap((page) => page.data) ?? [],
  };
}

export const joinedPartiesQueryKey = ['parties', 'joined'] as const;

/** Every party the caller has ever been a member of (not host) — current and past. Each row is
 * a membership record (membership_status/joined_at/left_at) nested around the party itself. */
export function useJoinedParties() {
  const { requestPaginated } = useApi();

  const query = useInfiniteQuery({
    queryKey: joinedPartiesQueryKey,
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      requestPaginated<PartyMembership[]>(
        `/users/me/parties/joined${toQueryString({ cursor: pageParam, per_page: 20 })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.has_more_pages ? (lastPage.meta.next_cursor ?? undefined) : undefined,
  });

  return {
    ...query,
    memberships: query.data?.pages.flatMap((page) => page.data) ?? [],
  };
}

/** Which of the three "My Parties" buckets a party/membership falls into. A membership the
 * caller left, or a party the host cancelled, is Canceled regardless of the party's own status
 * otherwise — matches the docs' explicit bucketing guidance. */
export function myPartiesBucket(
  status: PartyStatus,
  membershipStatus?: PartyMembershipStatus,
): 'upcoming' | 'past' | 'canceled' {
  if (status === 'cancelled' || membershipStatus === 'left' || membershipStatus === 'removed') {
    return 'canceled';
  }
  if (status === 'ended') return 'past';
  return 'upcoming';
}

/** Only `cover_image` needs multipart — everything else keeps going as plain JSON when it's
 * absent, matching every other write in this app. Nested `location` uses bracket keys since
 * form-data has no native object nesting. */
function toPartyFormData(payload: CreatePartyPayload): FormData {
  const form = new FormData();
  form.append('title', payload.title);
  if (payload.description != null) form.append('description', payload.description);
  if (payload.game_type_id != null) form.append('game_type_id', String(payload.game_type_id));
  if (payload.pack_id != null) form.append('pack_id', String(payload.pack_id));
  form.append('mode', payload.mode);
  form.append('visibility', payload.visibility);
  if (payload.max_players != null) form.append('max_players', String(payload.max_players));
  if (payload.starts_at != null) form.append('starts_at', payload.starts_at);
  if (payload.save_as_draft != null) form.append('save_as_draft', payload.save_as_draft ? '1' : '0');
  if (payload.location) {
    if (payload.location.venue_name != null) form.append('location[venue_name]', payload.location.venue_name);
    if (payload.location.address != null) form.append('location[address]', payload.location.address);
    if (payload.location.latitude != null) form.append('location[latitude]', String(payload.location.latitude));
    if (payload.location.longitude != null) form.append('location[longitude]', String(payload.location.longitude));
  }
  payload.tags?.forEach((tag, i) => form.append(`tags[${i}]`, tag));
  if (payload.cover_image) {
    // RN's fetch/FormData wants this exact { uri, name, type } shape, not a real Blob.
    form.append('cover_image', payload.cover_image as unknown as Blob);
  }
  return form;
}

export function useCreateParty() {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    // Response here is the lighter PartySummary shape, not full detail — the caller
    // navigates to the new party's lobby, which fetches the full detail itself.
    mutationFn: (payload: CreatePartyPayload) =>
      request<PartySummary>('/parties', {
        method: 'POST',
        body: payload.cover_image ? toPartyFormData(payload) : payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties', 'discover'] });
      queryClient.invalidateQueries({ queryKey: hostedPartiesQueryKey });
    },
  });
}

/** like/unlike/join/leave/start/end/cancel are documented as returning the full PartyResource,
 * but in practice at least one of these (like/unlike) has come back missing fields (e.g. `host`)
 * that GET /parties/{id} always includes — crashing anything reading them straight after. Merge
 * onto the existing cached detail instead of replacing it wholesale, so a thinner action
 * response can't blow away fields the detail fetch already had. Also invalidates the
 * hosted/joined lists since any of these can move a party between "My Parties" buckets. */
function usePartyActionMutation<TVars = number>(
  path: (vars: TVars) => string,
  method: 'POST' | 'DELETE',
  getBody?: (vars: TVars) => object,
) {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: TVars) => request<PartyDetail>(path(vars), { method, body: getBody?.(vars) }),
    onSuccess: (party) => {
      queryClient.setQueryData<PartyDetail>(partyQueryKey(party.id), (existing) =>
        existing ? { ...existing, ...party } : party,
      );
      queryClient.invalidateQueries({ queryKey: hostedPartiesQueryKey });
      queryClient.invalidateQueries({ queryKey: joinedPartiesQueryKey });
    },
  });
}

export function useLikeParty() {
  return usePartyActionMutation((id) => `/parties/${id}/like`, 'POST');
}

export function useUnlikeParty() {
  return usePartyActionMutation((id) => `/parties/${id}/like`, 'DELETE');
}

/** `roomCode` is required by the API for a private party, ignored for a public one — always
 * safe to pass when you have it. */
export function useJoinParty() {
  return usePartyActionMutation<{ partyId: number; roomCode?: string }>(
    ({ partyId }) => `/parties/${partyId}/join`,
    'POST',
    ({ roomCode }) => (roomCode ? { room_code: roomCode } : {}),
  );
}

export function useLeaveParty() {
  return usePartyActionMutation((id) => `/parties/${id}/leave`, 'DELETE');
}

/** Resolves a room code to its party — for joining a party you can't otherwise see (private, or
 * simply not in the loaded Discover pages). Not gated by the normal visibility rule: knowing the
 * exact code is its own authorization. Only scheduled/live parties resolve; a code for anything
 * else 404s the same as an unknown one. Rate-limited tighter than most (10/min). */
export function useLookupPartyByRoomCode() {
  const { request } = useApi();

  return useMutation({
    mutationFn: (roomCode: string) =>
      request<PartyDetail>(`/parties/lookup${toQueryString({ room_code: roomCode })}`),
  });
}

export function useCancelParty() {
  return usePartyActionMutation((id) => `/parties/${id}/cancel`, 'POST');
}

export function useStartParty() {
  return usePartyActionMutation((id) => `/parties/${id}/start`, 'POST');
}

export function useEndParty() {
  return usePartyActionMutation((id) => `/parties/${id}/end`, 'POST');
}

/** A fresh token per join — always call this right before connecting rather than caching one,
 * since it's short-lived. 403s for `in_person` parties or once the party isn't live; 503 if
 * video isn't configured server-side yet. Rate-limited under `party-actions` (30/min). */
export function useRequestVideoToken() {
  const { request } = useApi();

  return useMutation({
    mutationFn: (partyId: number) =>
      request<VideoTokenResource>(`/parties/${partyId}/video-token`, { method: 'POST' }),
  });
}
