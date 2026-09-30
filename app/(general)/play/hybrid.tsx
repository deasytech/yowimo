import Avatar from "@/components/shared/Avatar";
import GoBack from "@/components/shared/GoBack";
import Toast from "@/components/shared/Toast";
import { useAddGuestPlayer, useParty, usePartyPlayers } from "@/hooks/api/useParties";
import { useProfile } from "@/hooks/api/useProfile";
import { useToast } from "@/hooks/useToast";
import { ApiError, PartyPlayerResource } from "@/lib/api/types";
import { initialsFromName } from "@/lib/utils";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Globe, Tv, UserPlus, Video } from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

function playerName(p: PartyPlayerResource): string {
  return p.user?.display_name || p.user?.username || p.guest_name || "Guest";
}

/** Extracted out of HybridScreen's render — was two nested ternaries (add-guest form toggle,
 * then its own submit-button spinner) contributing heavily to the parent's complexity. */
function InRoomPlayersCard({
  localPlayers,
  isHost,
  addingGuest,
  onStartAdding,
  onCancelAdding,
  guestName,
  onGuestNameChange,
  guestEmoji,
  onGuestEmojiChange,
  onSubmit,
  isSubmitting,
}: Readonly<{
  localPlayers: PartyPlayerResource[];
  isHost: boolean;
  addingGuest: boolean;
  onStartAdding: () => void;
  onCancelAdding: () => void;
  guestName: string;
  onGuestNameChange: (value: string) => void;
  guestEmoji: string;
  onGuestEmojiChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}>) {
  return (
    <View className="mt-5 rounded-3xl border border-white/10 bg-card p-5">
      <Text className="mb-3 font-sg-bold text-sm text-white">🏠 In-Room Players</Text>

      {localPlayers.length === 0 ? (
        <Text className="text-xs text-muted-foreground">
          No one&apos;s been added to the room yet.
        </Text>
      ) : (
        <View className="mb-3 flex-row flex-wrap">
          {localPlayers.map((p) => (
            <View
              key={`local-${p.joined_at}`}
              className="mb-2 mr-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1"
            >
              <Text className="text-xs font-sans-medium text-white">
                {p.guest_emoji ? `${p.guest_emoji} ` : ""}
                {playerName(p)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {isHost && !addingGuest && (
        <TouchableOpacity
          onPress={onStartAdding}
          activeOpacity={0.85}
          className="flex-row items-center self-start rounded-full bg-secondary px-3 py-1"
        >
          <UserPlus size={12} color="#FFFFFF" />
          <Text className="ml-1 text-xs font-sans-medium text-white">Add</Text>
        </TouchableOpacity>
      )}

      {isHost && addingGuest && (
        <View className="gap-2">
          <View className="flex-row gap-2">
            <TextInput
              value={guestName}
              onChangeText={onGuestNameChange}
              placeholder="Name"
              placeholderTextColor="rgba(255,255,255,0.35)"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              autoFocus
            />
            <TextInput
              value={guestEmoji}
              onChangeText={onGuestEmojiChange}
              placeholder="🎉"
              placeholderTextColor="rgba(255,255,255,0.35)"
              className="w-14 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white"
              maxLength={8}
            />
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onCancelAdding}
              activeOpacity={0.85}
              className="flex-1 items-center rounded-xl border border-white/10 py-2"
            >
              <Text className="text-xs font-sans-medium text-muted-foreground">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSubmit}
              disabled={!guestName.trim() || isSubmitting}
              activeOpacity={0.85}
              style={{ opacity: guestName.trim() ? 1 : 0.5 }}
              className="flex-1 items-center rounded-xl bg-primary py-2"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-xs font-sans-semibold text-white">Add player</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function HybridScreen() {
  const { partyId: partyIdParam } = useLocalSearchParams<{ partyId: string }>();
  const partyId = Number(partyIdParam);
  const validPartyId = Number.isFinite(partyId);

  const { data: party, isLoading, isError, error, refetch } = useParty(
    validPartyId ? partyId : null,
  );
  const { data: players } = usePartyPlayers(validPartyId ? partyId : null);
  const { data: profile } = useProfile();
  const addGuestPlayer = useAddGuestPlayer();

  const [addingGuest, setAddingGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmoji, setGuestEmoji] = useState("");
  const toast = useToast();
  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  const activePlayers = (players ?? []).filter((p) => p.status === "active");
  // Real accounts always have join_mode: null — only a guest row carries "local"/"remote".
  const localPlayers = activePlayers.filter((p) => p.join_mode === "local");
  const remotePlayers = activePlayers.filter((p) => p.join_mode !== "local");

  if (!validPartyId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-muted-foreground text-sm text-center">Missing party to open.</Text>
      </SafeAreaView>
    );
  }

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
        <GoBack title="Hybrid Party" />
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
  // Matches the lobby's own check and the API's 403 rule — video never applies to in_person.
  const canJoinVideo =
    party.mode !== "in_person" && party.status === "live" && (isHost || party.joined_by_me);
  const roomCode = "room_code" in party ? party.room_code : undefined;

  const handleAddGuest = async () => {
    const name = guestName.trim();
    if (!name || addGuestPlayer.isPending) return;
    try {
      await addGuestPlayer.mutateAsync({
        partyId,
        guest_name: name,
        guest_emoji: guestEmoji.trim() || undefined,
        join_mode: "local",
      });
      setGuestName("");
      setGuestEmoji("");
      setAddingGuest(false);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't add that player", "error");
    }
  };

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
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Hybrid Party" />
        <Text className="mt-3 text-sm leading-6 text-muted-foreground">
          Some friends in the room, others on video.
          Yowimo blends them seamlessly.
        </Text>

        {/* Stats */}
        <View className="mt-5 flex-row justify-between">
          <LinearGradient
            colors={["#FF8A2A", "#D84CFF"]}
            className="w-[48%] rounded-3xl p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Tv size={20} color="#FFFFFF" />
            </View>
            <Text className="mt-3 font-sg-extrabold text-3xl text-white">
              {localPlayers.length}
            </Text>
            <Text className="text-[11px] uppercase tracking-wider text-white/80">
              In The Room
            </Text>
          </LinearGradient>
          <LinearGradient
            colors={["#7A1EFF", "#B03BFF"]}
            className="w-[48%] rounded-3xl p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Globe size={20} color="#FFFFFF" />
            </View>
            <Text className="mt-3 font-sg-extrabold text-3xl text-white">
              {remotePlayers.length}
            </Text>
            <Text className="text-[11px] uppercase tracking-wider text-white/80">
              Remote
            </Text>
          </LinearGradient>
        </View>

        {/* Local Players — pass-and-play, added by the host */}
        <InRoomPlayersCard
          localPlayers={localPlayers}
          isHost={isHost}
          addingGuest={addingGuest}
          onStartAdding={() => setAddingGuest(true)}
          onCancelAdding={() => {
            setAddingGuest(false);
            setGuestName("");
            setGuestEmoji("");
          }}
          guestName={guestName}
          onGuestNameChange={setGuestName}
          guestEmoji={guestEmoji}
          onGuestEmojiChange={setGuestEmoji}
          onSubmit={handleAddGuest}
          isSubmitting={addGuestPlayer.isPending}
        />

        {/* Remote Players — real roster */}
        <View className="mt-3 rounded-3xl border border-white/10 bg-card p-5">
          <Text className="mb-3 font-sg-bold text-sm text-white">🌐 Remote Players</Text>

          {remotePlayers.length === 0 ? (
            <Text className="text-xs text-muted-foreground">
              No one&apos;s joined remotely yet.
            </Text>
          ) : (
            <View className="gap-3">
              {remotePlayers.map((p) => (
                <View key={p.user_id ?? `remote-${p.joined_at}`} className="flex-row items-center gap-3">
                  <Avatar
                    avatarUrl={p.user?.avatar_url ?? null}
                    initials={initialsFromName(playerName(p))}
                    size={32}
                  />
                  <Text className="flex-1 text-sm font-sans-medium text-white" numberOfLines={1}>
                    {playerName(p)}
                    {p.is_host && (
                      <Text className="text-muted-foreground text-xs font-normal"> · Host</Text>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/play/invite",
                params: { roomCode: roomCode ?? "", title: party.title, partyId: String(partyId) },
              })
            }
            activeOpacity={0.85}
            className="mt-3 flex-row items-center self-start rounded-full bg-secondary px-3 py-1"
          >
            <UserPlus size={12} color="#FFFFFF" />
            <Text className="ml-1 text-xs font-sans-medium text-white">Invite</Text>
          </TouchableOpacity>
        </View>

        {/* Join video */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!canJoinVideo}
          onPress={() => router.push(`/play/video-room?partyId=${partyId}`)}
          style={{ opacity: canJoinVideo ? 1 : 0.5 }}
          className="mt-3 flex-row items-center justify-between rounded-3xl border border-white/10 bg-card p-4"
        >
          <View className="flex-row items-center">
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF"]}
              className="h-11 w-11 items-center justify-center rounded-2xl"
            >
              <Video size={20} color="#FFFFFF" />
            </LinearGradient>
            <View className="ml-3">
              <Text className="text-sm font-sans-semibold text-white">Join video</Text>
              <Text className="text-xs text-muted-foreground">
                {canJoinVideo ? "Connect with remote players" : "Opens once the party is live"}
              </Text>
            </View>
          </View>
          <Text className="text-lg text-muted-foreground">›</Text>
        </TouchableOpacity>

        {/* TV Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/play/connect-tv")}
          className="mt-3 flex-row items-center justify-between rounded-3xl border border-white/10 bg-card p-4"
        >
          <View className="flex-row items-center">
            <LinearGradient
              colors={["#D84CFF", "#FF8A2A"]}
              className="h-11 w-11 items-center justify-center rounded-2xl"
            >
              <Tv size={20} color="#FFFFFF" />
            </LinearGradient>
            <View className="ml-3">
              <Text className="text-sm font-sans-semibold text-white">
                Cast To TV
              </Text>
              <Text className="text-xs text-muted-foreground">
                Share board with everyone
              </Text>
            </View>
          </View>
          <Text className="text-lg text-muted-foreground">›</Text>
        </TouchableOpacity>
      </ScrollView>

      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.back()}
          className="mt-6"
        >
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF"]}
            className="h-14 items-center justify-center rounded-2xl"
          >
            <Text className="font-sans-bold text-base text-white">
              Back To Lobby
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
