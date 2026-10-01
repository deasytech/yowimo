import Avatar from "@/components/shared/Avatar";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import GoBack from "@/components/shared/GoBack";
import InviteQrModal from "@/components/shared/InviteQrModal";
import Toast from "@/components/shared/Toast";
import {
  useAcceptFriendRequest,
  useFriendRequests,
  useFriends,
  useRejectFriendRequest,
  useSendFriendRequest,
} from "@/hooks/api/useFriends";
import {
  usePartyGame,
  usePartyGameStartedListener,
  useStartGameSession,
} from "@/hooks/api/useGameSession";
import {
  useCancelParty,
  useEndParty,
  useJoinParty,
  useLeaveParty,
  useLikeParty,
  useParty,
  usePartyPlayers,
  useStartParty,
  useUnlikeParty,
} from "@/hooks/api/useParties";
import { useProfile } from "@/hooks/api/useProfile";
import { useToast } from "@/hooks/useToast";
import { ApiError, FriendRequestResource, FriendResource, PartyPlayerResource } from "@/lib/api/types";
import { initialsFromName, partyModeLabel, titleCaseSlug } from "@/lib/utils";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Copy,
  Heart,
  QrCode,
  Settings2,
  Share2,
  Sparkles,
  Users,
  Video,
} from "lucide-react-native";
import { styled } from "nativewind";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

// Still backlog — none of these have a backing endpoint yet (roster presence, teams/seating
// arrangement, waiting room) — disabled with a "Coming soon" label rather than linking into a
// fully mock screen. Live video has its own real entry point below (see `canJoinVideo`).
const SETTINGS_ROWS = [
  { Icon: Sparkles, label: "AI Host" },
  { Icon: Users, label: "Teams" },
  { Icon: Settings2, label: "Seating" },
  { Icon: Settings2, label: "Waiting room" },
  { Icon: Users, label: "Local players" },
];

export default function LobbyScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const partyId = Number(slug);
  const router = useRouter();

  const { data: party, isLoading, isError, error, refetch } = useParty(
    Number.isFinite(partyId) ? partyId : null,
  );
  const { data: profile } = useProfile();
  const likeParty = useLikeParty();
  const unlikeParty = useUnlikeParty();
  const joinParty = useJoinParty();
  const leaveParty = useLeaveParty();
  const startParty = useStartParty();
  const endParty = useEndParty();
  const cancelParty = useCancelParty();
  const startGameSession = useStartGameSession();
  const { data: players, refetch: refetchPlayers } = usePartyPlayers(
    Number.isFinite(partyId) ? partyId : null,
  );
  const { data: friends } = useFriends();
  const { data: friendRequests } = useFriendRequests();
  const sendFriendRequest = useSendFriendRequest();
  const acceptFriendRequest = useAcceptFriendRequest();
  const rejectFriendRequest = useRejectFriendRequest();
  // A member sitting in the lobby learns the host just started a game the moment it happens,
  // instead of only finding out on the next poll — falls back to polling below when this
  // channel isn't actually connected (e.g. Reverb itself is down).
  const { connected: partyChannelConnected } = usePartyGameStartedListener(
    Number.isFinite(partyId) ? partyId : null,
    () => refetchPartyGame(),
  );
  const {
    data: partyGame,
    isLoading: isLoadingPartyGame,
    refetch: refetchPartyGame,
  } = usePartyGame(Number.isFinite(partyId) ? partyId : null, { realtimeActive: partyChannelConnected });

  // Neither the party detail nor the roster is realtime — reload both whenever this screen
  // regains focus (backgrounding the app, or coming back from another tab/screen) so reopening
  // the lobby shows who's actually here instead of a snapshot from whenever it first mounted.
  useFocusEffect(
    useCallback(() => {
      if (!Number.isFinite(partyId)) return;
      refetch();
      refetchPlayers();
    }, [partyId, refetch, refetchPlayers]),
  );

  const [busy, setBusy] = useState<string | null>(null);
  // setBusy is async, so `busy` state alone can't stop two taps landing in the same tick
  // before the first render commits — this ref is the synchronous guard.
  const busyRef = useRef<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();

  const notify = (message: string, variant: "success" | "error" | "info") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : variant === "error" ? "bg-red-600" : "bg-secondary");
    toast.showToast();
  };

  const runAction = async (key: string, action: () => Promise<unknown>, successMessage?: string) => {
    if (busyRef.current) return;
    busyRef.current = key;
    setBusy(key);
    try {
      await action();
      if (successMessage) notify(successMessage, "success");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Something went wrong — please try again", "error");
    } finally {
      busyRef.current = null;
      setBusy(null);
    }
  };

  // GET /parties/{id}/game means anyone — host or guest, including a late joiner or a reopened
  // app — can find the current/latest session and jump straight in, rather than only whoever
  // was present the instant the host called game/start.
  const handleEnterGame = async () => {
    if (!party || busyRef.current) return;

    if (partyGame) {
      router.push(`/play/game?partyId=${party.id}&sessionId=${partyGame.id}`);
      return;
    }

    if (!isHost) {
      notify("The host hasn't started the game yet", "error");
      return;
    }

    busyRef.current = "game";
    setBusy("game");
    try {
      const session = await startGameSession.mutateAsync({ partyId: party.id });
      router.push(`/play/game?partyId=${party.id}&sessionId=${session.id}`);
    } catch (err) {
      // A session already exists (started moments ago by this same request racing us, or by
      // another client) — the 409 hands back its id instead of leaving us stuck.
      const existingId =
        err instanceof ApiError && err.status === 409
          ? Number((err.errors as Record<string, unknown> | undefined)?.game_session_id)
          : Number.NaN;
      if (Number.isFinite(existingId)) {
        router.push(`/play/game?partyId=${party.id}&sessionId=${existingId}`);
      } else {
        notify(err instanceof ApiError ? err.message : "Couldn't start the game", "error");
      }
    } finally {
      busyRef.current = null;
      setBusy(null);
    }
  };

  const handleCopy = async () => {
    if (!party || !("room_code" in party) || !party.room_code) return;
    try {
      await Clipboard.setStringAsync(party.room_code);
      notify("Room code copied!", "success");
    } catch {
      notify("Failed to copy room code", "error");
    }
  };

  const respondToRosterRequest = (player: PartyPlayerResource, action: "accept" | "reject") => {
    if (!player.user) return; // a guest (pass-and-play) row has no account to friend-request
    const incoming = friendRequests?.find(
      (r) => r.sender.id === player.user!.id && r.receiver.id === profile?.id,
    );
    if (!incoming || busyRef.current) return;
    const key = `friend-${player.user.id}`;
    if (action === "accept") {
      void runAction(
        key,
        () => acceptFriendRequest.mutateAsync(incoming.id),
        `You're now friends with ${player.user.display_name || player.user.username}`,
      );
    } else {
      void runAction(key, () => rejectFriendRequest.mutateAsync(incoming.id), "Request declined");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#B03BFF" />
      </SafeAreaView>
    );
  }

  // Some party-action responses (like/unlike etc.) come back thinner than the full
  // GET /parties/{id} shape — missing `host` among other fields. usePartyActionMutation merges
  // that onto cached data when it exists, but if THIS is the very first thing to populate the
  // cache (e.g. an action fires before useParty()'s own fetch has resolved), there's nothing to
  // merge onto and the thin response lands as-is. Treat a party missing `host` as not-ready
  // rather than crashing on party.host.id below — retrying forces the real, full fetch.
  if (isError || !party?.host) {
    return (
      <SafeAreaView className="flex-1 bg-background px-5">
        <GoBack title="Lobby" />
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-muted-foreground text-sm text-center">
            {error instanceof ApiError ? error.message : "Couldn't load this party."}
          </Text>
          <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8}>
            <Text className="text-violet-bright text-sm font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isHost = profile?.id === party.host.id;
  const canStart = isHost && (party.status === "draft" || party.status === "scheduled");
  const canEnd = isHost && party.status === "live";
  const canCancel = isHost && (party.status === "draft" || party.status === "scheduled");
  const canJoin =
    !isHost && !party.joined_by_me && (party.status === "scheduled" || party.status === "live");
  const canLeave = !isHost && party.joined_by_me;
  const roomCode = "room_code" in party ? party.room_code : undefined;
  const inviteLink = roomCode ? `https://yowimo.app/p/${roomCode}` : undefined;
  const isGameActionPending = busy === "game" || isLoadingPartyGame;
  const gameActionOpacity = getGameActionOpacity(isGameActionPending, Boolean(partyGame), isHost);
  const gameActionLabel = getGameActionLabel(Boolean(partyGame), isHost);
  const partyStatusLabel = getPartyStatusLabel(party.status);
  const activePlayers = (players ?? []).filter((p) => p.status === "active");
  // Video is online/hybrid only, and only once the party is actually live — matches the API's
  // own 403 rules (in_person or not-live both get rejected server-side too).
  const canJoinVideo =
    party.mode !== "in_person" && party.status === "live" && (isHost || party.joined_by_me);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Toast
        opacity={toast.opacity}
        isVisible={toast.isVisible}
        message={toastMessage}
        bgClass={toastBg}
      />
      <ConfirmDialog
        visible={confirmingCancel}
        title="Cancel this party?"
        message={`"${party.title}" will be marked canceled — this can't be undone.`}
        confirmLabel="Cancel party"
        cancelLabel="Keep it"
        onConfirm={() => {
          setConfirmingCancel(false);
          void runAction("cancel", () => cancelParty.mutateAsync(party.id), "Party canceled");
        }}
        onCancel={() => setConfirmingCancel(false)}
      />
      {inviteLink && roomCode && (
        <InviteQrModal
          visible={showQr}
          onClose={() => setShowQr(false)}
          inviteLink={inviteLink}
          roomCode={roomCode}
          title={party.title}
        />
      )}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Lobby" />

        {/* ── Hero card ── */}
        <View className="mt-4 min-h-52.5 overflow-hidden rounded-3xl">
          {party.cover_image_url ? (
            <Image
              source={{ uri: party.cover_image_url }}
              contentFit="cover"
              accessibilityLabel={`${party.title} party`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />
          ) : null}
          <LinearGradient
            colors={
              party.cover_image_url
                ? ["rgba(13,13,18,0.08)", "rgba(13,13,18,0.92)"]
                : party.gradient ?? ["#7A1EFF", "#D84CFF"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="min-h-52.5 justify-end p-6"
          >
            <View className="self-start rounded-full bg-ink/40 px-3 py-1">
              <Text
                className="text-white text-[11px] font-semibold uppercase"
                style={{ letterSpacing: 0.5 }}
              >
                {(party.game_type ? titleCaseSlug(party.game_type.slug) : "Party")} · {partyModeLabel(party.mode)}
              </Text>
            </View>
            <Text className="mt-3 text-white text-3xl font-bold leading-tight">
              {party.title}
            </Text>
            <Text className="mt-1 text-white/80 text-sm">
              Hosted by {party.host.display_name || party.host.username}
            </Text>
            {party.pack && (
              <View className="mt-2 flex-row items-center gap-1.5 self-start rounded-full bg-ink/40 px-2.5 py-1">
                <Text style={{ fontSize: 12 }}>{party.pack.emoji || "🃏"}</Text>
                <Text className="text-white/90 text-[11px] font-semibold">
                  {party.pack.name}
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* ── Code + QR ── */}
        <View className="mt-5 flex-row gap-3">
          <View
            style={{ flex: 2 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <Text
              className="text-muted-foreground text-[11px] uppercase"
              style={{ letterSpacing: 0.5 }}
            >
              Room code
            </Text>
            <Text
              className="mt-1 text-violet-bright text-3xl font-black"
              style={{ letterSpacing: 6 }}
            >
              {roomCode ?? "— — — —"}
            </Text>

            <View className="mt-3 flex-row gap-2">
              <TouchableOpacity
                onPress={handleCopy}
                disabled={!roomCode}
                activeOpacity={0.8}
                className="flex-row items-center gap-1 rounded-full bg-secondary px-3 py-1.5"
                style={{ opacity: roomCode ? 1 : 0.5 }}
              >
                <Copy color="#fff" size={12} strokeWidth={2} />
                <Text className="text-foreground text-xs font-medium">Copy</Text>
              </TouchableOpacity>

              <Link
                href={{
                  pathname: "/play/invite",
                  params: { roomCode: roomCode ?? "", title: party.title, partyId: String(party.id) },
                }}
                asChild
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="flex-row items-center gap-1 rounded-full bg-secondary px-3 py-1.5"
                >
                  <Share2 color="#fff" size={12} strokeWidth={2} />
                  <Text className="text-foreground text-xs font-medium">Invite</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowQr(true)}
            disabled={!roomCode}
            activeOpacity={0.8}
            style={{ flex: 1, opacity: roomCode ? 1 : 0.5 }}
            className="items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <QrCode color="#fff" size={36} strokeWidth={1.8} />
            <Text className="mt-1 text-muted-foreground text-[10px] font-medium text-center">
              Show QR
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Players + like ── */}
        <View className="mt-7 flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <View className="flex-row items-center gap-2">
            <Users color="#fff" size={18} strokeWidth={2} />
            <Text className="text-foreground text-sm font-semibold">
              {party.players_count}/{party.max_players} joined
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              runAction(
                "like",
                party.liked_by_me
                  ? () => unlikeParty.mutateAsync(party.id)
                  : () => likeParty.mutateAsync(party.id),
              )
            }
            disabled={busy === "like"}
            activeOpacity={0.8}
            className="flex-row items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5"
          >
            <Heart
              color={party.liked_by_me ? "#EF4444" : "#fff"}
              fill={party.liked_by_me ? "#EF4444" : "transparent"}
              size={14}
              strokeWidth={2}
            />
            <Text className="text-foreground text-xs font-semibold">{party.likes_count}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Video room ── */}
        {canJoinVideo && (
          <TouchableOpacity
            onPress={() =>
              router.push(
                party.mode === "hybrid"
                  ? `/play/hybrid?partyId=${party.id}`
                  : `/play/video-room?partyId=${party.id}`,
              )
            }
            activeOpacity={0.85}
            className="mt-5 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-orange/20">
              <Video color="#FF8A2A" size={18} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-semibold">
                {party.mode === "hybrid" ? "Hybrid room" : "Video room"}
              </Text>
              <Text className="text-muted-foreground text-xs">Party is live — join the call</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Roster ── */}
        {activePlayers.length > 0 && (
          <View className="mt-5 gap-2">
            <Text
              className="text-muted-foreground text-[11px] font-semibold uppercase"
              style={{ letterSpacing: 0.5 }}
            >
              Who&apos;s here
            </Text>

            {activePlayers.map((p, index) => {
              if (!p.user) {
                // A guest (pass-and-play) row — no account, so no friend actions apply. Guest
                // rows have no id from the API at all, and joined_at alone can collide if two
                // guests get added within the same timestamp resolution — index guarantees
                // uniqueness regardless.
                return (
                  <View
                    key={`guest-${index}-${p.joined_at}`}
                    className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <Avatar
                      avatarUrl={null}
                      initials={initialsFromName(p.guest_name || "Guest")}
                      size={40}
                    />
                    <View className="flex-1">
                      <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                        {p.guest_emoji ? `${p.guest_emoji} ` : ""}
                        {p.guest_name || "Guest"}
                      </Text>
                      <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                        In the room
                      </Text>
                    </View>
                  </View>
                );
              }

              const isSelf = p.user.id === profile?.id;
              const state = getFriendActionState(p.user.id, profile?.id, friends, friendRequests);
              const busyKey = `friend-${p.user.id}`;

              return (
                <View
                  key={p.user_id}
                  className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <Avatar
                    avatarUrl={p.user.avatar_url}
                    initials={initialsFromName(p.user.display_name || p.user.username)}
                    size={40}
                  />
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                      {p.user.display_name || p.user.username}
                      {p.is_host && (
                        <Text className="text-muted-foreground text-xs font-normal"> · Host</Text>
                      )}
                    </Text>
                    <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                      @{p.user.username}
                    </Text>
                  </View>

                  <RosterFriendAction
                    isSelf={isSelf}
                    state={state}
                    busy={busy === busyKey}
                    onReject={() => respondToRosterRequest(p, "reject")}
                    onAccept={() => respondToRosterRequest(p, "accept")}
                    onAdd={() =>
                      void runAction(
                        busyKey,
                        () => sendFriendRequest.mutateAsync(p.user!.id),
                        "Friend request sent",
                      )
                    }
                  />
                </View>
              );
            })}
          </View>
        )}

        {party.tags.length > 0 && (
          <View className="mt-4 flex-row flex-wrap gap-1.5">
            {party.tags.map((t) => (
              <View key={t} className="rounded-full bg-white/10 px-2.5 py-1">
                <Text className="text-white/80 text-[11px] font-semibold">#{t}</Text>
              </View>
            ))}
          </View>
        )}

        {party.description ? (
          <Text className="mt-4 text-muted-foreground text-sm leading-relaxed">
            {party.description}
          </Text>
        ) : null}

        {/* ── Settings rows ── */}
        {isHost && (
          <View className="mt-7 gap-3">
            {SETTINGS_ROWS.map((s) => (
              <TouchableOpacity
                key={s.label}
                onPress={() => notify(`${s.label} is coming soon`, "info")}
                activeOpacity={0.8}
                style={{ opacity: 0.5 }}
                className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <s.Icon color="#fff" size={20} strokeWidth={2} />
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">{s.label}</Text>
                  <Text className="text-muted-foreground text-xs">Coming soon</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {canLeave && (
          <TouchableOpacity
            onPress={() =>
              runAction("leave", () => leaveParty.mutateAsync(party.id), "Left the party")
            }
            disabled={busy === "leave"}
            activeOpacity={0.8}
            className="mt-7 h-12 items-center justify-center rounded-2xl border border-destructive/40"
          >
            {busy === "leave" ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-destructive text-sm font-semibold">Leave party</Text>
            )}
          </TouchableOpacity>
        )}

        {canEnd && (
          <TouchableOpacity
            onPress={() =>
              runAction("end", () => endParty.mutateAsync(party.id), "Party ended")
            }
            disabled={busy === "end"}
            activeOpacity={0.8}
            className="mt-7 h-12 items-center justify-center rounded-2xl border border-destructive/40"
          >
            {busy === "end" ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-destructive text-sm font-semibold">End party</Text>
            )}
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            onPress={() => setConfirmingCancel(true)}
            disabled={Boolean(busy)}
            activeOpacity={0.8}
            className="mt-7 h-12 items-center justify-center rounded-2xl border border-destructive/40"
          >
            {busy === "cancel" ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-destructive text-sm font-semibold">Cancel party</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <View className="border-t border-white/10 bg-background px-5 pb-3">
        {canJoin ? (
          <TouchableOpacity
            onPress={() =>
              runAction(
                "join",
                () => joinParty.mutateAsync({ partyId: party.id, roomCode }),
                "You're in!",
              )
            }
            disabled={busy === "join"}
            activeOpacity={0.85}
            className="mt-8"
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-14 w-full items-center justify-center rounded-2xl"
              style={{ opacity: busy === "join" ? 0.7 : 1 }}
            >
              {busy === "join" ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white text-base font-semibold">Join party</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : canStart ? (
          <TouchableOpacity
            onPress={() =>
              runAction("start", () => startParty.mutateAsync(party.id), "Party is live!")
            }
            disabled={busy === "start"}
            activeOpacity={0.85}
            className="mt-8"
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-14 w-full items-center justify-center rounded-2xl"
              style={{ opacity: busy === "start" ? 0.7 : 1 }}
            >
              {busy === "start" ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white text-base font-semibold">Start party</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : party.status === "live" ? (
          <TouchableOpacity
            onPress={handleEnterGame}
            disabled={busy === "game" || isLoadingPartyGame}
            activeOpacity={0.85}
            className="mt-8"
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-14 w-full items-center justify-center rounded-2xl"
              style={{ opacity: gameActionOpacity }}
            >
              {isGameActionPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white text-base font-semibold">{gameActionLabel}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View className="mt-8 h-14 w-full items-center justify-center rounded-2xl bg-secondary/40">
            <Text className="text-muted-foreground text-sm font-semibold">
              {partyStatusLabel}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function getGameActionOpacity(isPending: boolean, hasGame: boolean, isHost: boolean): number {
  if (isPending) return 0.7;
  if (!hasGame && !isHost) return 0.6;
  return 1;
}

function getGameActionLabel(hasGame: boolean, isHost: boolean): string {
  if (hasGame) return "Jump in";
  if (isHost) return "Start game";
  return "Waiting for host";
}

function getPartyStatusLabel(status: string): string {
  if (status === "ended") return "This party has ended";
  if (status === "cancelled") return "This party was canceled";
  return "Waiting to start";
}

type FriendActionState = "self" | "friends" | "incoming" | "outgoing" | "none";

/** "incoming"/"outgoing" are from the caller's point of view — a request this roster member
 * sent to the caller vs. one the caller already sent them. */
function getFriendActionState(
  userId: number,
  myId: number | undefined,
  friends: FriendResource[] | undefined,
  requests: FriendRequestResource[] | undefined,
): FriendActionState {
  if (userId === myId) return "self";
  if (friends?.some((f) => f.friend.id === userId)) return "friends";
  if (requests?.some((r) => r.sender.id === userId && r.receiver.id === myId)) return "incoming";
  if (requests?.some((r) => r.sender.id === myId && r.receiver.id === userId)) return "outgoing";
  return "none";
}

/** Extracted out of the roster row's render — was a 5-way nested ternary chain. */
function RosterFriendAction({
  isSelf,
  state,
  busy,
  onReject,
  onAccept,
  onAdd,
}: Readonly<{
  isSelf: boolean;
  state: FriendActionState;
  busy: boolean;
  onReject: () => void;
  onAccept: () => void;
  onAdd: () => void;
}>) {
  if (isSelf) return null;
  if (busy) return <ActivityIndicator color="#a3a3ab" size="small" />;

  if (state === "friends") {
    return (
      <View className="rounded-full bg-secondary px-3 py-1.5">
        <Text className="text-muted-foreground text-xs font-semibold">Friends</Text>
      </View>
    );
  }

  if (state === "incoming") {
    return (
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={onReject}
          activeOpacity={0.85}
          className="rounded-full border border-border px-3 py-1.5"
        >
          <Text className="text-muted-foreground text-xs font-semibold">Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAccept}
          activeOpacity={0.85}
          className="rounded-full bg-primary px-3 py-1.5"
        >
          <Text className="text-white text-xs font-semibold">Accept</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state === "outgoing") {
    return (
      <View className="rounded-full border border-border px-3 py-1.5">
        <Text className="text-muted-foreground text-xs font-semibold">Requested</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onAdd}
      activeOpacity={0.85}
      className="rounded-full bg-primary px-3 py-1.5"
    >
      <Text className="text-white text-xs font-semibold">Add friend</Text>
    </TouchableOpacity>
  );
}
