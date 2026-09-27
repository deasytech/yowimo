import { useApi } from '@/hooks/api/useApi';
import { useEcho } from '@/lib/realtime/EchoProvider';
import {
  CreateGameSessionPayload,
  GameResultsResource,
  GameSessionResource,
  PartyPlayerResource,
  ReactionEmoji,
  VoteCategory,
  VoteResource,
} from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

// Realtime events (see useGameSessionChannel) trigger a refetch on anything meaningful, so this
// interval is really just a safety net for a missed/undelivered event, not the primary sync
// mechanism — much slower when a socket is actually connected.
const POLL_INTERVAL_CONNECTED_MS = 15000;
const POLL_INTERVAL_FALLBACK_MS = 3000;

const isSessionOver = (status: GameSessionResource['status']) =>
  status === 'completed' || status === 'ended';

export const gameSessionQueryKey = (sessionId: number | null) => ['game-session', sessionId] as const;
export const partyGameQueryKey = (partyId: number | null) => ['parties', 'game', partyId] as const;
export const partyPlayersQueryKey = (partyId: number | null) => ['parties', 'players', partyId] as const;
export const gameResultsQueryKey = (sessionId: number | null) => ['game-session', sessionId, 'results'] as const;

/** Starts the game engine for a live party. Host only. On a 409 (already in progress), the
 * existing session's id comes back in `err.errors.game_session_id` — open that instead. */
export function useStartGameSession() {
  const { request } = useApi();

  return useMutation({
    mutationFn: ({ partyId, ...payload }: CreateGameSessionPayload & { partyId: number }) =>
      request<GameSessionResource>(`/parties/${partyId}/game/start`, {
        method: 'POST',
        body: payload,
      }),
  });
}

/** The party's most recent game session (in progress or finished) — how a member (including a
 * late joiner or a reopened app) finds the session id to load and subscribe to. Polls as a
 * fallback (there's otherwise no other trigger to notice a new game) unless the caller confirms
 * the party's presence channel is actually connected and will deliver `game.started` instead. */
export function usePartyGame(partyId: number | null, options: { realtimeActive?: boolean } = {}) {
  const { request } = useApi();
  const { realtimeActive = false } = options;

  return useQuery({
    queryKey: partyGameQueryKey(partyId),
    queryFn: () => request<GameSessionResource>(`/parties/${partyId}/game`),
    enabled: partyId !== null,
    retry: false,
    refetchInterval: (query) => {
      if (realtimeActive) return false;
      // Once found, the game's own screen takes over via useGameSession — no need to keep
      // polling this lookup too.
      if (query.state.data) return false;
      return POLL_INTERVAL_FALLBACK_MS;
    },
  });
}

/**
 * Full game session state — for loading or reconnecting without replaying realtime events. Pass
 * `realtimeActive: true` once a socket is confirmed subscribed (see useGameSessionChannel) to
 * fall back to a slower safety-net poll instead of the default fast one.
 */
export function useGameSession(sessionId: number | null, options: { realtimeActive?: boolean } = {}) {
  const { request } = useApi();
  const { realtimeActive = false } = options;

  return useQuery({
    queryKey: gameSessionQueryKey(sessionId),
    queryFn: () => request<GameSessionResource>(`/game/${sessionId}`),
    enabled: sessionId !== null,
    refetchInterval: (query) => {
      if (query.state.data && isSessionOver(query.state.data.status)) return false;
      return realtimeActive ? POLL_INTERVAL_CONNECTED_MS : POLL_INTERVAL_FALLBACK_MS;
    },
  });
}

/** The party's roster — every player who has ever joined, in join order, including anyone who
 * has since left (needed to name them in a game's turn_order). Filter to status "active" for a
 * live "who's here" list. */
export function usePartyPlayers(partyId: number | null) {
  const { request } = useApi();

  return useQuery({
    queryKey: partyPlayersQueryKey(partyId),
    queryFn: () => request<PartyPlayerResource[]>(`/parties/${partyId}/players`),
    enabled: partyId !== null,
  });
}

/** Final (or live, mid-game) standings: XP, votes received, turn outcomes and MVP per player. */
export function useGameResults(sessionId: number | null, options: { enabled?: boolean } = {}) {
  const { request } = useApi();

  return useQuery({
    queryKey: gameResultsQueryKey(sessionId),
    queryFn: () => request<GameResultsResource>(`/game/${sessionId}/results`),
    enabled: sessionId !== null && (options.enabled ?? true),
  });
}

function useGameSessionMutation<TVariables>(
  path: (vars: TVariables) => string,
  getSessionId: (vars: TVariables) => number,
) {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: TVariables) => request<GameSessionResource>(path(vars), { method: 'POST' }),
    onSuccess: (session, vars) => {
      queryClient.setQueryData(gameSessionQueryKey(getSessionId(vars)), session);
    },
  });
}

/** Host-only: completes the current turn (with challenge XP, like /complete) and deals the
 * next. Prefer useCompleteTurn/useSkipTurn when the turn's own player is acting instead. */
export function useNextTurn() {
  return useGameSessionMutation<number>((sessionId) => `/game/${sessionId}/next-turn`, (id) => id);
}

/** Marks the current turn done (grants challenge XP) and deals the next. The turn's own player
 * or the host — pass the exact current_turn.id so a stale/double tap can't complete someone
 * else's turn. */
export function useCompleteTurn() {
  return useGameSessionMutation<{ sessionId: number; turnId: number }>(
    ({ sessionId, turnId }) => `/game/${sessionId}/turns/${turnId}/complete`,
    ({ sessionId }) => sessionId,
  );
}

/** Skips the current turn (pass on the card) — no challenge XP, can't be voted on. Same actor
 * rules as useCompleteTurn. */
export function useSkipTurn() {
  return useGameSessionMutation<{ sessionId: number; turnId: number }>(
    ({ sessionId, turnId }) => `/game/${sessionId}/turns/${turnId}/skip`,
    ({ sessionId }) => sessionId,
  );
}

/** Host-only: freezes the turn timer. Reactions still work; turn actions and votes don't. */
export function usePauseGame() {
  return useGameSessionMutation<number>((sessionId) => `/game/${sessionId}/pause`, (id) => id);
}

/** Host-only: resumes a paused game with the turn's remaining time. */
export function useResumeGame() {
  return useGameSessionMutation<number>((sessionId) => `/game/${sessionId}/resume`, (id) => id);
}

/** Votes on a just-completed turn (winner/funny/creativity), crediting XP to that turn's
 * player. Any party member other than the turn's own player may vote, once per category. */
export function useVoteTurn() {
  const { request } = useApi();

  return useMutation({
    mutationFn: ({
      sessionId,
      turnId,
      category,
    }: {
      sessionId: number;
      turnId: number;
      category: VoteCategory;
    }) =>
      request<VoteResource>(`/game/${sessionId}/turns/${turnId}/vote`, {
        method: 'POST',
        body: { category },
      }),
  });
}

/** Sends a live, unstored emoji reaction to everyone in the game (broadcast only — there's
 * nothing to refetch afterwards). */
export function useSendReaction() {
  const { request } = useApi();

  return useMutation({
    mutationFn: ({ sessionId, emoji }: { sessionId: number; emoji: ReactionEmoji }) =>
      request<null>(`/game/${sessionId}/reactions`, { method: 'POST', body: { emoji } }),
  });
}

interface GameSessionChannelHandlers {
  onReaction?: (payload: { gameSessionId: number; userId: number; emoji: string; turnId: number }) => void;
  onAiHostMessage?: (payload: { gameSessionId: number; message: string }) => void;
}

/**
 * Subscribes to `private-game-session.{id}` for the events that mean "the state changed, go
 * refetch" (turn/round/voting/completion/pause/resume), plus the two events that are pure
 * broadcast-only signals (`reaction.sent`, `ai-host.message`) that don't correspond to anything
 * fetchable, wired to caller-supplied handlers instead. Returns whether a socket is actually in
 * use, so the caller can slow its REST poll down when it is.
 */
export function useGameSessionChannel(
  sessionId: number | null,
  handlers: GameSessionChannelHandlers = {},
): { connected: boolean } {
  const echo = useEcho();
  const queryClient = useQueryClient();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  // Tracks the *actual* Pusher/Reverb connection state — not just "Echo is configured" (env
  // vars present), since the Reverb server can be down/unreachable while that's still true.
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!echo || sessionId === null) {
      setConnected(false);
      return;
    }

    const channel = echo.private(`game-session.${sessionId}`);
    const refetch = () => queryClient.invalidateQueries({ queryKey: gameSessionQueryKey(sessionId) });
    const refetchResults = () =>
      queryClient.invalidateQueries({ queryKey: gameResultsQueryKey(sessionId) });

    const refetchEvents = [
      '.turn.started',
      '.turn.completed',
      '.round.completed',
      '.game.voting',
      '.game.completed',
      '.game.ended',
      '.game.paused',
      '.game.resumed',
      '.vote.cast',
    ];
    refetchEvents.forEach((event) => channel.listen(event, refetch));
    channel.listen('.game.completed', refetchResults);
    channel.listen('.vote.cast', refetchResults);
    channel.listen('.reaction.sent', (e: { gameSessionId: number; userId: number; emoji: string; turnId: number }) =>
      handlersRef.current.onReaction?.(e),
    );
    channel.listen('.ai-host.message', (e: { gameSessionId: number; message: string }) =>
      handlersRef.current.onAiHostMessage?.(e),
    );

    // Events sent while offline aren't replayed — refetch on every (re)connect, per the docs.
    const pusherConnection = echo.connector?.pusher?.connection;
    const onStateChange = (states: { current: string }) => {
      const isConnected = states.current === 'connected';
      setConnected(isConnected);
      if (isConnected) refetch();
    };
    pusherConnection?.bind('state_change', onStateChange);
    setConnected(pusherConnection?.state === 'connected');

    return () => {
      refetchEvents.forEach((event) => channel.stopListening(event));
      channel.stopListening('.reaction.sent');
      channel.stopListening('.ai-host.message');
      pusherConnection?.unbind('state_change', onStateChange);
      echo.leave(`game-session.${sessionId}`);
    };
  }, [echo, sessionId, queryClient]);

  return { connected };
}

/** Subscribes to the party's presence channel just for `game.started` — lets a lobby prompt
 * "the host started a game" the moment it happens, instead of only finding out on next poll.
 * Returns whether that channel is actually connected, so the caller can fall back to polling
 * `usePartyGame` when it isn't (e.g. the Reverb server itself is down). */
export function usePartyGameStartedListener(
  partyId: number | null,
  onStarted: (gameSessionId: number) => void,
): { connected: boolean } {
  const echo = useEcho();
  const onStartedRef = useRef(onStarted);
  onStartedRef.current = onStarted;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!echo || partyId === null) {
      setConnected(false);
      return;
    }

    const channel = echo.join(`party.${partyId}`);
    const handler = (e: { gameSessionId: number; partyId: number }) => onStartedRef.current(e.gameSessionId);
    channel.listen('.game.started', handler);

    const pusherConnection = echo.connector?.pusher?.connection;
    const onStateChange = (states: { current: string }) => setConnected(states.current === 'connected');
    pusherConnection?.bind('state_change', onStateChange);
    setConnected(pusherConnection?.state === 'connected');

    return () => {
      channel.stopListening('.game.started');
      pusherConnection?.unbind('state_change', onStateChange);
      echo.leave(`party.${partyId}`);
    };
  }, [echo, partyId]);

  return { connected };
}
