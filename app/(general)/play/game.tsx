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
import { ApiError, GameSessionResource, GameTurn, ReactionEmoji, VoteCategory } from "@/lib/api/types";
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
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const SafeAreaView = styled(RNSafeAreaView);

const CIRCLE_RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const DEFAULT_TURN_SECONDS = 30;
const VOTING_WINDOW_SECONDS = 30;
const REACTIONS: ReactionEmoji[] = ["🔥", "😂", "❤️", "😱", "👏", "💀", "🤯", "👀", "✨"];
const REACTION_BURST_SIZE = 10;

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
  const reactionCounter = useRef(0);

  const pushReaction = (emoji: string) => {
    // One tap/broadcast reads as a single reaction but should look like a burst, not one lone
    // emoji — spawn a batch, each with its own id so ConfettiParticle's randomized trajectory
    // (picked once per mounted particle) gives every one of these its own flight path.
    const batchId = `${Date.now()}-${++reactionCounter.current}`;
    const burst = Array.from({ length: REACTION_BURST_SIZE }, (_, i) => ({
      id: `${batchId}-${i}`,
      emoji,
    }));
    setReactionFeed((f) => [...f, ...burst]);
    setTimeout(
      () => setReactionFeed((f) => f.filter((r) => !r.id.startsWith(batchId))),
      2200,
    );
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
      if (profile?.id === userId) return "You";
      const user = byId.get(userId);
      if (user) return user.display_name || user.username;
      const host = party?.host;
      if (host?.id === userId) return host.display_name || host.username;
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
            {getSessionOverTitle(session.status)}
          </Text>
          <Text className="mt-1 text-center text-sm text-white/60">
            {getSessionOverSubtitle(session)}
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
  return (
    <ActiveGameScreen
      session={session}
      partyTitle={party?.title}
      isHost={isHost}
      currentUserId={profile?.id}
      busy={busy}
      now={now}
      aiMessage={aiMessage}
      toastMessage={toastMessage}
      reactionFeed={reactionFeed}
      voteableTurn={voteableTurn}
      votedCategories={votedCategories}
      resolvePlayerName={resolvePlayerName}
      onGoToLobby={goToLobby}
      onTurnAction={runTurnAction}
      onVote={handleVote}
      onReaction={handleReaction}
      onPause={() => pauseGame.mutateAsync(session.id)}
      onResume={() => resumeGame.mutateAsync(session.id)}
      onComplete={() => completeTurn.mutateAsync({ sessionId: session.id, turnId: turn.id })}
      onSkip={() => skipTurn.mutateAsync({ sessionId: session.id, turnId: turn.id })}
      onNext={() => nextTurn.mutateAsync(session.id)}
    />
  );
}

function getSecondsLeft(
  session: GameSessionResource,
  turn: GameTurn,
  isPaused: boolean,
  isVoting: boolean,
  now: number,
): number {
  if (isPaused) return session.paused_turn_remaining_seconds ?? 0;
  const deadline = isVoting ? session.voting_ends_at : turn.expires_at;
  if (!deadline) return 0;
  return Math.max(0, Math.round((new Date(deadline).getTime() - now) / 1000));
}

function getSessionOverTitle(status: GameSessionResource["status"]): string {
  return status === "ended" ? "Party ended early" : "Game complete! 🎉";
}

function getSessionOverSubtitle(session: GameSessionResource): string {
  if (session.status === "ended") {
    return "The host ended the party before it finished — XP already earned is kept.";
  }
  return `${session.rounds_count} rounds played.`;
}

type ActiveGameScreenProps = {
  readonly session: GameSessionResource;
  readonly partyTitle?: string;
  readonly isHost: boolean;
  readonly currentUserId?: number;
  readonly busy: string | null;
  readonly now: number;
  readonly aiMessage: string | null;
  readonly toastMessage: string | null;
  readonly reactionFeed: readonly { id: string; emoji: string }[];
  readonly voteableTurn: GameTurn | null;
  readonly votedCategories: Set<VoteCategory>;
  readonly resolvePlayerName: (userId: number) => string;
  readonly onGoToLobby: () => void;
  readonly onTurnAction: (key: string, action: () => Promise<unknown>) => Promise<void>;
  readonly onVote: (category: VoteCategory) => void;
  readonly onReaction: (emoji: ReactionEmoji) => void;
  readonly onPause: () => Promise<unknown>;
  readonly onResume: () => Promise<unknown>;
  readonly onComplete: () => Promise<unknown>;
  readonly onSkip: () => Promise<unknown>;
  readonly onNext: () => Promise<unknown>;
};

function ActiveGameScreen(props: ActiveGameScreenProps) {
  const { session } = props;
  const turn = session.current_turn;
  const isPaused = session.status === "paused";
  const isVoting = session.status === "voting";
  const isMyTurn = turn.user_id === props.currentUserId;
  const secondsLeft = getSecondsLeft(session, turn, isPaused, isVoting, props.now);
  const turnSeconds = session.turn_seconds ?? DEFAULT_TURN_SECONDS;
  const timerDenominator = isVoting ? VOTING_WINDOW_SECONDS : turnSeconds;
  const timerOffset = CIRCUMFERENCE * (1 - Math.min(1, secondsLeft / timerDenominator));
  const turnOrder = session.turn_order ?? [];
  const activePlayerIds = new Set(session.active_player_ids ?? turnOrder);
  const activeIndex = session.current_turn_index ?? turnOrder.indexOf(turn.user_id);

  return (
    <SafeAreaView className="flex-1 bg-[#100B2E]">
      <StatusBar barStyle="light-content" backgroundColor="#100B2E" />
      <View className="flex-1">
        <GameHeader
          session={session}
          partyTitle={props.partyTitle}
          isHost={props.isHost}
          isPaused={isPaused}
          isVoting={isVoting}
          busy={props.busy}
          onGoToLobby={props.onGoToLobby}
          onTurnAction={props.onTurnAction}
          onPause={props.onPause}
          onResume={props.onResume}
        />
        <AiHostBanner message={props.aiMessage} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <PlayerTurnOrder
            turnOrder={turnOrder}
            activePlayerIds={activePlayerIds}
            activeIndex={activeIndex}
            resolvePlayerName={props.resolvePlayerName}
          />
          <View className="items-center px-5 pt-8">
            <TimerRing secondsLeft={secondsLeft} timerOffset={timerOffset} />
            <TurnPrompt turn={turn} isVoting={isVoting} isMyTurn={isMyTurn} resolvePlayerName={props.resolvePlayerName} />
            <TurnControls
              canActOnTurn={session.status === "running"}
              isMyTurn={isMyTurn}
              isHost={props.isHost}
              busy={props.busy}
              onTurnAction={props.onTurnAction}
              onComplete={props.onComplete}
              onSkip={props.onSkip}
              onNext={props.onNext}
            />
            <VotePrompt
              voteableTurn={props.voteableTurn}
              currentUserId={props.currentUserId}
              votedCategories={props.votedCategories}
              resolvePlayerName={props.resolvePlayerName}
              onVote={props.onVote}
            />
            <ReactionPanel
              toastMessage={props.toastMessage}
              onReaction={props.onReaction}
            />
          </View>
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-3">
          <View className="mx-auto w-full max-w-md flex-row items-center gap-3 rounded-[28px] border border-white/10 bg-[#211A46]/95 p-3">
            <Pressable onPress={props.onGoToLobby} className="h-12 flex-1 items-center justify-center rounded-2xl bg-white/10">
              <Text className="text-xs font-bold text-white">Leave</Text>
            </Pressable>
          </View>
        </View>
        <ReactionConfetti reactionFeed={props.reactionFeed} />
      </View>
    </SafeAreaView>
  );
}

function GameHeader({
  session,
  partyTitle,
  isHost,
  isPaused,
  isVoting,
  busy,
  onGoToLobby,
  onTurnAction,
  onPause,
  onResume,
}: {
  readonly session: GameSessionResource;
  readonly partyTitle?: string;
  readonly isHost: boolean;
  readonly isPaused: boolean;
  readonly isVoting: boolean;
  readonly busy: string | null;
  readonly onGoToLobby: () => void;
  readonly onTurnAction: ActiveGameScreenProps["onTurnAction"];
  readonly onPause: ActiveGameScreenProps["onPause"];
  readonly onResume: ActiveGameScreenProps["onResume"];
}) {
  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      <Pressable onPress={onGoToLobby} className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
        <X size={18} color="#FFFFFF" />
      </Pressable>
      <View className="items-center">
        <Text className="text-[10px] font-medium uppercase tracking-[2px] text-white/50">
          {getGamePhaseLabel(session, isVoting, isPaused)}
        </Text>
        {partyTitle ? <Text className="mt-1 text-sm font-bold text-white" numberOfLines={1}>{partyTitle}</Text> : null}
      </View>
      <PauseControl
        isHost={isHost}
        isPaused={isPaused}
        isVoting={isVoting}
        busy={busy}
        onTurnAction={onTurnAction}
        onPause={onPause}
        onResume={onResume}
      />
    </View>
  );
}

function getGamePhaseLabel(session: GameSessionResource, isVoting: boolean, isPaused: boolean): string {
  if (isVoting) return "Voting";
  if (isPaused) return "Paused";
  return `Round ${session.current_round_number} of ${session.rounds_count}`;
}

function PauseControl({
  isHost,
  isPaused,
  isVoting,
  busy,
  onTurnAction,
  onPause,
  onResume,
}: {
  readonly isHost: boolean;
  readonly isPaused: boolean;
  readonly isVoting: boolean;
  readonly busy: string | null;
  readonly onTurnAction: ActiveGameScreenProps["onTurnAction"];
  readonly onPause: ActiveGameScreenProps["onPause"];
  readonly onResume: ActiveGameScreenProps["onResume"];
}) {
  if (!isHost) return <View className="h-11 w-11" />;
  let icon = <Pause size={16} color="#fff" />;
  if (busy === "pause" || busy === "resume") icon = <ActivityIndicator color="#fff" size="small" />;
  else if (isPaused) icon = <Play size={16} color="#fff" />;
  return (
    <Pressable
      onPress={() => onTurnAction(isPaused ? "resume" : "pause", isPaused ? onResume : onPause)}
      disabled={busy === "pause" || busy === "resume" || isVoting}
      className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
      style={{ opacity: isVoting ? 0.4 : 1 }}
    >
      {icon}
    </Pressable>
  );
}

function AiHostBanner({ message }: { readonly message: string | null }) {
  if (!message) return null;
  return <View className="mx-5 mb-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5"><Text className="text-xs text-white/80">✨ {message}</Text></View>;
}

function PlayerTurnOrder({
  turnOrder,
  activePlayerIds,
  activeIndex,
  resolvePlayerName,
}: {
  readonly turnOrder: number[];
  readonly activePlayerIds: Set<number>;
  readonly activeIndex: number;
  readonly resolvePlayerName: (userId: number) => string;
}) {
  if (turnOrder.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
      {turnOrder.map((userId, index) => {
        const active = index === activeIndex;
        const left = !activePlayerIds.has(userId);
        return (
          <View
            key={`${userId}-${index}`}
            className={`h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ${active ? "border-2 border-[#FF8A00] bg-[#FF4D8D]" : "bg-[#4D2A9A]"}`}
            style={{ opacity: left ? 0.35 : 1 }}
          >
            <Text className="text-base font-black text-white">{initialsFromName(resolvePlayerName(userId))}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function TimerRing({ secondsLeft, timerOffset }: { readonly secondsLeft: number; readonly timerOffset: number }) {
  return (
    <View className="mb-6 h-20 w-20 items-center justify-center">
      <Svg width={80} height={80} viewBox="0 0 80 80" style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx="40" cy="40" r={CIRCLE_RADIUS} stroke="#2A2354" strokeWidth="6" fill="none" />
        <Circle cx="40" cy="40" r={CIRCLE_RADIUS} stroke="url(#timerGradient)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={timerOffset} />
        <Defs><LinearGradient id="timerGradient" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#9B5CFF" /><Stop offset="1" stopColor="#FF8A00" /></LinearGradient></Defs>
      </Svg>
      <Text className="text-2xl font-black text-white">{secondsLeft}</Text>
    </View>
  );
}

function TurnPrompt({
  turn,
  isVoting,
  isMyTurn,
  resolvePlayerName,
}: {
  readonly turn: GameTurn;
  readonly isVoting: boolean;
  readonly isMyTurn: boolean;
  readonly resolvePlayerName: (userId: number) => string;
}) {
  return (
    <View style={{ width: "100%", maxWidth: 360 }} className="relative">
      <View style={{ transform: [{ rotate: "-3deg" }] }} className="absolute inset-0 rounded-4xl bg-[#6F3AFF]/40" />
      <View style={{ transform: [{ rotate: "3deg" }] }} className="absolute inset-0 rounded-4xl bg-[#FF4D8D]/40" />
      <View style={{ minHeight: 280 }} className="overflow-hidden rounded-4xl bg-[#6D35D9] p-6">
        <View className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <View className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10" />
        <View className="flex-1">
          <View className="self-start rounded-full bg-white/20 px-3 py-1.5"><Text className="text-[10px] font-black uppercase tracking-widest text-white">{turn.card.kind}</Text></View>
          <View style={{ width: "100%" }} className="flex-1 justify-center py-8">
            <Text style={{ flexShrink: 1 }} className="text-2xl font-black leading-8 text-white">
              {turn.card.text}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-white/20"><Text className="font-black text-white">{initialsFromName(resolvePlayerName(turn.user_id))}</Text></View>
            <View>
              <Text className="text-xs text-white/60">{getTurnRoleLabel(isVoting, isMyTurn)}</Text>
              <Text className="mt-0.5 text-sm font-bold text-white">{resolvePlayerName(turn.user_id)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function getTurnRoleLabel(isVoting: boolean, isMyTurn: boolean): string {
  if (isVoting) return "Last turn";
  if (isMyTurn) return "It's your turn";
  return "Now playing";
}

function TurnControls({
  canActOnTurn,
  isMyTurn,
  isHost,
  busy,
  onTurnAction,
  onComplete,
  onSkip,
  onNext,
}: {
  readonly canActOnTurn: boolean;
  readonly isMyTurn: boolean;
  readonly isHost: boolean;
  readonly busy: string | null;
  readonly onTurnAction: ActiveGameScreenProps["onTurnAction"];
  readonly onComplete: ActiveGameScreenProps["onComplete"];
  readonly onSkip: ActiveGameScreenProps["onSkip"];
  readonly onNext: ActiveGameScreenProps["onNext"];
}) {
  const canCompleteOrSkip = canActOnTurn && (isMyTurn || isHost);
  const canForceAdvance = canActOnTurn && !isMyTurn && isHost;
  if (!canCompleteOrSkip && !canForceAdvance) return null;
  return (
    <>
      {canCompleteOrSkip && (
        <View className="mt-6 flex-row gap-3">
          <Pressable onPress={() => onTurnAction("complete", onComplete)} disabled={busy !== null} className="h-12 flex-1 items-center justify-center rounded-2xl bg-[#22C55E]" style={{ opacity: busy !== null ? 0.6 : 1 }}>
            {busy === "complete" ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-sm font-bold text-white">I did it ✓</Text>}
          </Pressable>
          <Pressable onPress={() => onTurnAction("skip", onSkip)} disabled={busy !== null} className="h-12 items-center justify-center rounded-2xl bg-white/10 px-5" style={{ opacity: busy !== null ? 0.6 : 1 }}>
            {busy === "skip" ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-sm font-bold text-white">Skip</Text>}
          </Pressable>
        </View>
      )}
      {canForceAdvance && <Pressable onPress={() => onTurnAction("next", onNext)} disabled={busy !== null} className="mt-3"><Text className="text-xs font-semibold text-white/40">Force advance turn</Text></Pressable>}
    </>
  );
}

function VotePrompt({
  voteableTurn,
  currentUserId,
  votedCategories,
  resolvePlayerName,
  onVote,
}: {
  readonly voteableTurn: GameTurn | null;
  readonly currentUserId?: number;
  readonly votedCategories: Set<VoteCategory>;
  readonly resolvePlayerName: (userId: number) => string;
  readonly onVote: (category: VoteCategory) => void;
}) {
  if (!voteableTurn || voteableTurn.user_id === currentUserId) return null;
  return <VoteRow votedCategories={votedCategories} onVote={onVote} label={`Rate ${resolvePlayerName(voteableTurn.user_id)}'s last turn`} />;
}

// Full-screen, input-transparent overlay so a reaction (yours or broadcast in from anyone else
// in the game) reads as a shared, celebratory moment instead of a small icon tucked under the
// picker — each emoji gets its own randomized rise/drift/rotation so a burst of the same emoji
// doesn't look like one static sprite repeated in place.
function ReactionConfetti({
  reactionFeed,
}: {
  readonly reactionFeed: readonly { id: string; emoji: string }[];
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {reactionFeed.map((reaction) => (
        <ConfettiParticle key={reaction.id} emoji={reaction.emoji} />
      ))}
    </View>
  );
}

function ConfettiParticle({ emoji }: { readonly emoji: string }) {
  const { width, height } = useWindowDimensions();
  // Randomized once per particle (not per render) — a stable starting point/trajectory for the
  // whole time this instance is mounted, which is exactly its one-shot animated lifetime.
  // Math.random() here only scatters a decorative animation's position/timing — nothing
  // security-sensitive (no token, id, or crypto use), so Sonar's PRNG hotspot doesn't apply.
  const originX = useRef(24 + Math.random() * (width - 72)).current; // NOSONAR
  const originY = useRef(height * 0.55 + Math.random() * (height * 0.15)).current; // NOSONAR
  const drift = useRef((Math.random() - 0.5) * 120).current; // NOSONAR
  const spin = useRef((Math.random() - 0.5) * 70).current; // NOSONAR
  const rise = useRef(height * 0.45 + Math.random() * (height * 0.2)).current; // NOSONAR
  const duration = useRef(1600 + Math.random() * 500).current; // NOSONAR

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    // Fires exactly once per mount — this particle never re-animates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 0.75, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, drift]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -rise]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, spin])}deg` },
      { scale: interpolate(progress.value, [0, 0.15, 1], [0.4, 1.2, 0.9]) },
    ],
  }));

  return (
    <Animated.Text
      style={[{ position: "absolute", left: originX, top: originY, fontSize: 32 }, animatedStyle]}
    >
      {emoji}
    </Animated.Text>
  );
}

function ReactionPanel({
  toastMessage,
  onReaction,
}: {
  readonly toastMessage: string | null;
  readonly onReaction: (emoji: ReactionEmoji) => void;
}) {
  return (
    <>
      <View className="mt-7 flex-row flex-wrap justify-center gap-2 px-4">
        {REACTIONS.map((emoji) => <Pressable key={emoji} onPress={() => onReaction(emoji)} className="h-10 w-10 items-center justify-center rounded-full bg-white/10"><Text style={{ fontSize: 18 }}>{emoji}</Text></Pressable>)}
      </View>
      {toastMessage ? <Text className="mt-4 text-center text-xs text-red-300">{toastMessage}</Text> : null}
    </>
  );
}

function VoteRow({
  label,
  votedCategories,
  onVote,
}: {
  readonly label: string;
  readonly votedCategories: Set<VoteCategory>;
  readonly onVote: (category: VoteCategory) => void;
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
              className={`items-center gap-1 rounded-2xl border px-4 py-2.5 ${voted ? "border-white/30 bg-white/15" : "border-white/10 bg-white/5"
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
