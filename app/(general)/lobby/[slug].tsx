import GoBack from "@/components/shared/GoBack";
import Toast from "@/components/shared/Toast";
import {
  useEndParty,
  useJoinParty,
  useLeaveParty,
  useLikeParty,
  useParty,
  useStartParty,
  useUnlikeParty,
} from "@/hooks/api/useParties";
import { useProfile } from "@/hooks/api/useProfile";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/types";
import { partyModeLabel, titleCaseSlug } from "@/lib/utils";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
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
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

// Still mock/backlog — none of these have a backing endpoint yet (roster presence,
// teams/seating arrangement, live video, waiting room).
const SETTINGS_ROWS = [
  { Icon: Sparkles, label: "AI Host", value: "On · Spicy mode", colorClass: "text-orange", to: "/lobby/ai-host" },
  { Icon: Users, label: "Teams", value: "Free for all", colorClass: "text-foreground", to: "/play/teams" },
  { Icon: Settings2, label: "Seating", value: "Auto", colorClass: "text-foreground", to: "/play/seating" },
  { Icon: Video, label: "Live video room", value: "Tap to join", colorClass: "text-foreground", to: "/play/video-room" },
  { Icon: Settings2, label: "Waiting room", value: "Manage", colorClass: "text-foreground", to: "/lobby/waiting-room" },
  { Icon: Users, label: "Local players", value: "Add device", colorClass: "text-foreground", to: "/play/local-register" },
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

  const [busy, setBusy] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  const runAction = async (key: string, action: () => Promise<unknown>, successMessage?: string) => {
    if (busy) return;
    setBusy(key);
    try {
      await action();
      if (successMessage) notify(successMessage, "success");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Something went wrong — please try again", "error");
    } finally {
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#B03BFF" />
      </SafeAreaView>
    );
  }

  if (isError || !party) {
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
  const canJoin = !isHost && !party.joined_by_me && party.status !== "ended";
  const canLeave = !isHost && party.joined_by_me;
  const roomCode = "room_code" in party ? party.room_code : undefined;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Toast
        opacity={toast.opacity}
        isVisible={toast.isVisible}
        message={toastMessage}
        bgClass={toastBg}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Lobby" />

        {/* ── Hero card ── */}
        <View className="mt-4 min-h-52.5 overflow-hidden rounded-3xl">
          {party.cover_image_url && (
            <Image
              source={{ uri: party.cover_image_url }}
              contentFit="cover"
              accessibilityLabel={`${party.title} party`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />
          )}
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

          <Link href="/play/qr-join" asChild>
            <TouchableOpacity
              activeOpacity={0.8}
              style={{ flex: 1 }}
              className="items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <QrCode color="#fff" size={36} strokeWidth={1.8} />
              <Text className="mt-1 text-muted-foreground text-[10px] font-medium text-center">
                Scan to join
              </Text>
            </TouchableOpacity>
          </Link>
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

        {party.tags.length > 0 && (
          <View className="mt-4 flex-row flex-wrap gap-1.5">
            {party.tags.map((t) => (
              <View key={t} className="rounded-full bg-white/10 px-2.5 py-1">
                <Text className="text-white/80 text-[11px] font-semibold">#{t}</Text>
              </View>
            ))}
          </View>
        )}

        {party.description && (
          <Text className="mt-4 text-muted-foreground text-sm leading-relaxed">
            {party.description}
          </Text>
        )}

        {/* ── Settings rows ── */}
        {isHost && (
          <View className="mt-7 gap-3">
            {SETTINGS_ROWS.map((s) => (
              <Link key={s.label} href={s.to as any} asChild>
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <s.Icon
                    color={s.colorClass === "text-orange" ? "#FF8A2A" : "#fff"}
                    size={20}
                    strokeWidth={2}
                  />
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-semibold">{s.label}</Text>
                    <Text className="text-muted-foreground text-xs">{s.value}</Text>
                  </View>
                  <Text className="text-muted-foreground text-xs">›</Text>
                </TouchableOpacity>
              </Link>
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
      </ScrollView>

      <View className="border-t border-white/10 bg-background px-5 pb-3">
        {canJoin ? (
          <TouchableOpacity
            onPress={() =>
              runAction("join", () => joinParty.mutateAsync(party.id), "You're in!")
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
            onPress={() => router.push("/play/game")}
            activeOpacity={0.85}
            className="mt-8"
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-14 w-full items-center justify-center rounded-2xl"
            >
              <Text className="text-white text-base font-semibold">Jump in</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View className="mt-8 h-14 w-full items-center justify-center rounded-2xl bg-secondary/40">
            <Text className="text-muted-foreground text-sm font-semibold">
              {party.status === "ended" ? "This party has ended" : "Waiting to start"}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
