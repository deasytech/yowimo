import {
  useCompleteTurn,
  useGameResults,
  useGameSession,
  useGameSessionChannel,
  useNextTurn,
  usePartyGame,
  usePartyPlayers,
  usePauseGame,
  useResumeGame,
  useSendReaction,
  useSkipTurn,
  useVoteTurn,
} from "@/hooks/api/useGameSession";
import { useParty } from "@/hooks/api/useParties";
import { useProfile } from "@/hooks/api/useProfile";
import { ApiError, GameTurn, ReactionEmoji, VoteCategory } from "@/lib/api/types";
import { initialsFromName } from "@/lib/utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Crown, Laugh, Palette, Pause, Play, Trophy, X } from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const SafeAreaView = styled(RNSafeAreaView);

const CIRCLE_RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const DEFAULT_TURN_SECONDS = 30;
const VOTING_WINDOW_SECONDS = 30;
const REACTIONS: ReactionEmoji[] = ["🔥", "😂", "❤️", "😱", "👏", "💀", "🤯", "👀", "✨"];

const VOTE_CATEGORIES: { id: VoteCategory; label: string; Icon: typeof Trophy; color: string }[] = [
  { id: "winner", label: "Winner", Icon: Trophy, color: "#FFD166" },
  { id: "funny", label: "Funny", Icon: Laugh, color: "#FF8A00" },
  { id: "creativity", label: "Creative", Icon: Palette, color: "#9B5CFF" },
];

export default function GameRoom() {
  const router = useRouter();
  const { partyId: partyIdParam, sessionId: sessionIdParam } = useLocalSearchParams<{
    partyId?: string;
    sessionId?: string;
  }>();
  const partyId = Number(partyIdParam);
  const sessionIdFromParam = sessionIdParam ? Number(sessionIdParam) : null;

  const { data: profile } = useProfile();
  const { data: party } = useParty(Number.isFinite(partyId) ? partyId : null);
  const { data: players } = usePartyPlayers(Number.isFinite(partyId) ? partyId : null);

  // No session id came in via navigation (deep link, or a reopened app) — look it up instead of
  // dead-ending. This is the same lookup the lobby uses, now also covering this screen directly.
  const {
    data: discoveredGame,
    isLoading: isDiscoveringGame,
    isError: discoveryFailed,
  } = usePartyGame(sessionIdFromParam === null && Number.isFinite(partyId) ? partyId : null);
  const sessionId = sessionIdFromParam ?? discoveredGame?.id ?? null;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [reactionFeed, setReactionFeed] = useState<{ id: string; emoji: string }[]>([]);

  const pushReaction = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setReactionFeed((f) => [...f, { id, emoji }]);
    setTimeout(() => setReactionFeed((f) => f.filter((r) => r.id !== id)), 2200);
  };

  const { connected } = useGameSessionChannel(sessionId, {
    onReaction: (e) => pushReaction(e.emoji),
    onAiHostMessage: (e) => setAiMessage(e.message),
  });

  const { data: session, isLoading, isError, error, refetch } = useGameSession(sessionId, {
    realtimeActive: connected,
  });
  const completeTurn = useCompleteTurn();
  const skipTurn = useSkipTurn();
  const nextTurn = useNextTurn();
  const pauseGame = usePauseGame();
  const resumeGame = useResumeGame();
  const voteTurn = useVoteTurn();
  const sendReaction = useSendReaction();

  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    if (!aiMessage) return;
    const t = setTimeout(() => setAiMessage(null), 6000);
    return () => clearTimeout(t);
  }, [aiMessage]);

  // Ticks once a second purely to redraw the countdown against a server deadline — the deadline
  // itself is server truth, this never advances anything locally.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Mid-game, a just-completed turn stays voteable in this UI only until the *next* turn also
  // completes (no historical-turns endpoint to reach further back). The final turn of the game
  // does't need this — status voting/completed/ended surfaces session.current_turn directly.
  const previousTurnRef = useRef<GameTurn | null>(null);
  const [completedTurn, setCompletedTurn] = useState<GameTurn | null>(null);
  const [votedCategories, setVotedCategories] = useState<Set<VoteCategory>>(new Set());

  useEffect(() => {
    const current = session?.current_turn ?? null;
    if (current && previousTurnRef.current && current.id !== previousTurnRef.current.id) {
      setCompletedTurn(previousTurnRef.current);
      setVotedCategories(new Set());
    }
    previousTurnRef.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.current_turn?.id]);

  const isHost = Boolean(profile && session && profile.id === session.host_id);
  const isSessionOver = session?.status === "completed" || session?.status === "ended";
  const voteableTurn =
    session && (session.status === "voting" || isSessionOver) ? session.current_turn : completedTurn;

  const resolvePlayerName = useMemo(() => {
    const byId = new Map((players ?? []).map((p) => [p.user_id, p.user]));
    return (userId: number): string => {
      if (profile && userId === profile.id) return "You";
      const user = byId.get(userId);
      if (user) return user.display_name || user.username;
      if (party && userId === party.host.id) return party.host.display_name || party.host.username;
      return `Player #${userId}`;
    };
  }, [players, profile, party]);

  const { data: results } = useGameResults(sessionId, { enabled: isSessionOver });

  const goToLobby = () => {
    if (Number.isFinite(partyId)) {
      router.replace(`/lobby/${partyId}`);
    } else {
      router.replace("/");
    }
  };

  const runTurnAction = async (key: string, action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(key);
    try {
      await action();
    } catch (err) {
      setToastMessage(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const handleVote = async (category: VoteCategory) => {
    if (!session || !voteableTurn || votedCategories.has(category)) return;
    setVotedCategories((s) => new Set(s).add(category));
    try {
      await voteTurn.mutateAsync({ sessionId: session.id, turnId: voteableTurn.id, category });
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 409)) {
        setVotedCategories((s) => {
          const next = new Set(s);
          next.delete(category);
          return next;
        });
        setToastMessage(err instanceof ApiError ? err.message : "Couldn't cast that vote");
      }
    }
  };

  const handleReaction = async (emoji: ReactionEmoji) => {
    if (!session) return;
    // Show it locally right away rather than waiting on the broadcast to echo back — that
    // round-trip depends on Reverb actually being connected, and may not even include the
    // sender depending on how the backend broadcasts it.
    pushReaction(emoji);
    try {
      await sendReaction.mutateAsync({ sessionId: session.id, emoji });
    } catch {
      // Purely cosmetic — a failed send just means nobody else saw it, nothing to recover.
    }
  };

  if (sessionIdFromParam === null && isDiscoveringGame) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#100B2E]">
        <StatusBar barStyle="light-content" backgroundColor="#100B2E" />
        <ActivityIndicator color="#9B5CFF" />
      </SafeAreaView>
    );
  }

  if (sessionId === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#100B2E] px-8">
        <StatusBar barStyle="light-content" backgroundColor="#100B2E" />
        <Text className="text-center text-lg font-bold text-white">
          {discoveryFailed ? "No game has started yet" : "Game in progress"}
        </Text>
        <Text className="mt-2 text-center text-sm text-white/60">
          {discoveryFailed
            ? "Head back to the lobby and start one from there."
            : "Couldn't find this party's game."}
        </Text>
        <Pressable onPress={goToLobby} className="mt-6 rounded-2xl bg-white/10 px-5 py-3">
          <Text className="text-sm font-semibold text-white">Back to lobby</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#100B2E]">
        <StatusBar barStyle="light-content" backgroundColor="#100B2E" />
        <ActivityIndicator color="#9B5CFF" />
      </SafeAreaView>
    );
  }

  if (isError || !session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-[#100B2E] px-8">
        <StatusBar barStyle="light-content" backgroundColor="#100B2E" />
        <Text className="text-center text-sm text-white/70">
          {error instanceof ApiError ? error.message : "Couldn't load this game."}
        </Text>
        <Pressable onPress={() => refetch()} className="rounded-2xl bg-white/10 px-5 py-3">
          <Text className="text-sm font-semibold text-white">Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (isSessionOver) {
    return (
      <SafeAreaView className="flex-1 bg-[#100B2E]">
        <StatusBar barStyle="light-content" backgroundColor="#100B2E" />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, alignItems: "center" }}>
          <Text className="mt-6 text-2xl font-black text-white">
            {session.status === "ended" ? "Party ended early" : "Game complete! 🎉"}
          </Text>
          <Text className="mt-1 text-center text-sm text-white/60">
            {session.status === "ended"
              ? "The host ended the party before it finished — XP already earned is kept."
              : `${session.rounds_count} rounds played.`}
          </Text>

          {results && (
            <View className="mt-7 w-full gap-2.5">
              {results.standings.map((s, index) => (
                <View
                  key={s.user.id}
                  className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <Text className="w-5 text-center text-xs font-bold text-white/50">{index + 1}</Text>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-[#4D2A9A]">
                    <Text className="text-sm font-black text-white">
                      {initialsFromName(s.user.display_name || s.user.username)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                        {s.user.display_name || s.user.username}
                      </Text>
                      {s.is_mvp && <Crown size={13} color="#FFD166" />}
                    </View>
                    <Text className="text-[11px] text-white/50">
                      {s.turns.completed} done · {s.turns.skipped} skipped
                      {s.turns.afk > 0 ? ` · ${s.turns.afk} AFK` : ""}
                    </Text>
                  </View>
                  <Text className="text-sm font-black text-white">{s.xp} XP</Text>
                </View>
              ))}
            </View>
          )}

          <Pressable onPress={goToLobby} className="mt-8 rounded-2xl bg-white/10 px-6 py-3.5">
            <Text className="text-sm font-semibold text-white">Back to lobby</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const turn = session.current_turn;
  const isPaused = session.status === "paused";
  const isVoting = session.status === "voting";
  const turnSeconds = session.turn_seconds ?? DEFAULT_TURN_SECONDS;

  const secondsLeft = isPaused
    ? (session.paused_turn_remaining_seconds ?? 0)
    : isVoting
      ? session.voting_ends_at
        ? Math.max(0, Math.round((new Date(session.voting_ends_at).getTime() - now) / 1000))
        : 0
      : Math.max(0, Math.round((new Date(turn.expires_at).getTime() - now) / 1000));
  const timerDenominator = isVoting ? VOTING_WINDOW_SECONDS : turnSeconds;
  const timerOffset = CIRCUMFERENCE * (1 - Math.min(1, secondsLeft / timerDenominator));

  const turnOrder = session.turn_order ?? [];
  const activePlayerIds = new Set(session.active_player_ids ?? turnOrder);
  const activeIndex = session.current_turn_index ?? turnOrder.indexOf(turn.user_id);
  const isMyTurn = turn.user_id === profile?.id;
  const canActOnTurn = session.status === "running" && !isVoting;

  return (
    <SafeAreaView className="flex-1 bg-[#100B2E]">
      <StatusBar barStyle="light-content" backgroundColor="#100B2E" />

      <View className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-3">
          <Pressable
            onPress={goToLobby}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
          >
            <X size={18} color="#FFFFFF" />
          </Pressable>

          <View className="items-center">
            <Text className="text-[10px] font-medium uppercase tracking-[2px] text-white/50">
              {isVoting
                ? "Voting"
                : isPaused
                  ? "Paused"
                  : `Round ${session.current_round_number} of ${session.rounds_count}`}
            </Text>
            {party && (
              <Text className="mt-1 text-sm font-bold text-white" numberOfLines={1}>
                {party.title}
              </Text>
            )}
          </View>

          {isHost ? (
            <Pressable
              onPress={() =>
                isPaused
                  ? runTurnAction("resume", () => resumeGame.mutateAsync(session.id))
                  : runTurnAction("pause", () => pauseGame.mutateAsync(session.id))
              }
              disabled={busy === "pause" || busy === "resume" || isVoting}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
              style={{ opacity: isVoting ? 0.4 : 1 }}
            >
              {busy === "pause" || busy === "resume" ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : isPaused ? (
                <Play size={16} color="#fff" />
              ) : (
                <Pause size={16} color="#fff" />
              )}
            </Pressable>
          ) : (
            <View className="h-11 w-11" />
          )}
        </View>

        {aiMessage && (
          <View className="mx-5 mb-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5">
            <Text className="text-xs text-white/80">✨ {aiMessage}</Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {turnOrder.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              {turnOrder.map((userId, index) => {
                const active = index === activeIndex;
                const left = !activePlayerIds.has(userId);
                return (
                  <View
                    key={`${userId}-${index}`}
                    className={`h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ${
                      active ? "border-2 border-[#FF8A00] bg-[#FF4D8D]" : "bg-[#4D2A9A]"
                    }`}
                    style={{ opacity: left ? 0.35 : 1 }}
                  >
                    <Text className="text-base font-black text-white">
                      {initialsFromName(resolvePlayerName(userId))}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <View className="items-center px-5 pt-8">
            <View className="mb-6 h-20 w-20 items-center justify-center">
              <Svg
                width={80}
                height={80}
                viewBox="0 0 80 80"
                style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
              >
                <Circle cx="40" cy="40" r={CIRCLE_RADIUS} stroke="#2A2354" strokeWidth="6" fill="none" />
                <Circle
                  cx="40"
                  cy="40"
                  r={CIRCLE_RADIUS}
                  stroke="url(#timerGradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={timerOffset}
                />
                <Defs>
                  <LinearGradient id="timerGradient" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#9B5CFF" />
                    <Stop offset="1" stopColor="#FF8A00" />
                  </LinearGradient>
                </Defs>
              </Svg>
              <Text className="text-2xl font-black text-white">{secondsLeft}</Text>
            </View>

            <View style={{ width: "100%", maxWidth: 360 }} className="relative">
              <View
                style={{ transform: [{ rotate: "-3deg" }] }}
                className="absolute inset-0 rounded-4xl bg-[#6F3AFF]/40"
              />
              <View
                style={{ transform: [{ rotate: "3deg" }] }}
                className="absolute inset-0 rounded-4xl bg-[#FF4D8D]/40"
              />

              <View style={{ minHeight: 280 }} className="overflow-hidden rounded-4xl bg-[#6D35D9] p-6">
                <View className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
                <View className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10" />

                <View className="flex-1">
                  <View className="rounded-full bg-white/20 self-start px-3 py-1.5">
                    <Text className="text-[10px] font-black uppercase tracking-widest text-white">
                      {turn.card.kind}
                    </Text>
                  </View>

                  <View className="flex-1 justify-center py-8">
                    <Text className="text-2xl font-black leading-8 text-white">{turn.card.text}</Text>
                  </View>

                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-white/20">
                      <Text className="font-black text-white">
                        {initialsFromName(resolvePlayerName(turn.user_id))}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs text-white/60">
                        {isVoting ? "Last turn" : isMyTurn ? "It's your turn" : "Now playing"}
                      </Text>
                      <Text className="mt-0.5 text-sm font-bold text-white">
                        {resolvePlayerName(turn.user_id)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {canActOnTurn && (isMyTurn || isHost) && (
              <View className="mt-6 flex-row gap-3">
                <Pressable
                  onPress={() =>
                    runTurnAction("complete", () =>
                      completeTurn.mutateAsync({ sessionId: session.id, turnId: turn.id }),
                    )
                  }
                  disabled={busy !== null}
                  className="h-12 flex-1 items-center justify-center rounded-2xl bg-[#22C55E]"
                  style={{ opacity: busy !== null ? 0.6 : 1 }}
                >
                  {busy === "complete" ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-sm font-bold text-white">I did it ✓</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() =>
                    runTurnAction("skip", () => skipTurn.mutateAsync({ sessionId: session.id, turnId: turn.id }))
                  }
                  disabled={busy !== null}
                  className="h-12 items-center justify-center rounded-2xl bg-white/10 px-5"
                  style={{ opacity: busy !== null ? 0.6 : 1 }}
                >
                  {busy === "skip" ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-sm font-bold text-white">Skip</Text>
                  )}
                </Pressable>
              </View>
            )}

            {canActOnTurn && !isMyTurn && isHost && (
              <Pressable
                onPress={() => runTurnAction("next", () => nextTurn.mutateAsync(session.id))}
                disabled={busy !== null}
                className="mt-3"
              >
                <Text className="text-xs font-semibold text-white/40">Force advance turn</Text>
              </Pressable>
            )}

            {/* During "running" voteableTurn is the previous (already-completed) turn — never
                the one currently on screen; during "voting" it's this turn itself, now closed
                for play. Either way, a single condition covers it. */}
            {voteableTurn && voteableTurn.user_id !== profile?.id && (
              <VoteRow
                votedCategories={votedCategories}
                onVote={handleVote}
                label={`Rate ${resolvePlayerName(voteableTurn.user_id)}'s last turn`}
              />
            )}

            <View className="mt-7 flex-row flex-wrap justify-center gap-2 px-4">
              {REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleReaction(emoji)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                >
                  <Text style={{ fontSize: 18 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            <View pointerEvents="none" className="mt-2 flex-row flex-wrap justify-center gap-2">
              {reactionFeed.map((r) => (
                <Text key={r.id} style={{ fontSize: 22 }}>
                  {r.emoji}
                </Text>
              ))}
            </View>

            {toastMessage && (
              <Text className="mt-4 text-center text-xs text-red-300">{toastMessage}</Text>
            )}
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-3">
          <View className="mx-auto w-full max-w-md flex-row items-center gap-3 rounded-[28px] border border-white/10 bg-[#211A46]/95 p-3">
            <Pressable
              onPress={goToLobby}
              className="h-12 flex-1 items-center justify-center rounded-2xl bg-white/10"
            >
              <Text className="text-xs font-bold text-white">Leave</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function VoteRow({
  label,
  votedCategories,
  onVote,
}: {
  label: string;
  votedCategories: Set<VoteCategory>;
  onVote: (category: VoteCategory) => void;
}) {
  return (
    <View className="mt-7 items-center gap-2.5">
      <Text className="text-xs text-white/60">{label}</Text>
      <View className="flex-row gap-3">
        {VOTE_CATEGORIES.map(({ id, label: catLabel, Icon, color }) => {
          const voted = votedCategories.has(id);
          return (
            <Pressable
              key={id}
              onPress={() => onVote(id)}
              disabled={voted}
              className={`items-center gap-1 rounded-2xl border px-4 py-2.5 ${
                voted ? "border-white/30 bg-white/15" : "border-white/10 bg-white/5"
              }`}
            >
              <Icon size={18} color={voted ? color : "rgba(255,255,255,0.6)"} />
              <Text className={`text-[10px] font-semibold ${voted ? "text-white" : "text-white/60"}`}>
                {voted ? "Voted" : catLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
