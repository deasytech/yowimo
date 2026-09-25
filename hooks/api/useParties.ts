import { useApi } from '@/hooks/api/useApi';
import { toQueryString } from '@/lib/api/client';
import { CreatePartyPayload, PartyDetail, PartyMode, PartySummary } from '@/lib/api/types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface DiscoverFeedFilters {
  mode?: PartyMode;
  game_type_id?: number;
  search?: string;
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
    },
  });
}

/** like/unlike/join/leave/start/end all return the full updated PartyResource — just swap
 * it straight into the detail cache rather than re-fetching. */
function usePartyActionMutation(path: (partyId: number) => string, method: 'POST' | 'DELETE') {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (partyId: number) => request<PartyDetail>(path(partyId), { method }),
    onSuccess: (party) => {
      queryClient.setQueryData(partyQueryKey(party.id), party);
    },
  });
}

export function useLikeParty() {
  return usePartyActionMutation((id) => `/parties/${id}/like`, 'POST');
}

export function useUnlikeParty() {
  return usePartyActionMutation((id) => `/parties/${id}/like`, 'DELETE');
}

export function useJoinParty() {
  return usePartyActionMutation((id) => `/parties/${id}/join`, 'POST');
}

export function useLeaveParty() {
  return usePartyActionMutation((id) => `/parties/${id}/leave`, 'DELETE');
}

export function useStartParty() {
  return usePartyActionMutation((id) => `/parties/${id}/start`, 'POST');
}

export function useEndParty() {
  return usePartyActionMutation((id) => `/parties/${id}/end`, 'POST');
}
