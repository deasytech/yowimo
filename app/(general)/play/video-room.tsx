import { useParty, useRequestVideoToken } from "@/hooks/api/useParties";
import { ApiError } from "@/lib/api/types";
import {
  AudioSession,
  isTrackReference,
  LiveKitRoom,
  useLocalParticipant,
  useRoomContext,
  useTracks,
  VideoTrack,
} from "@livekit/react-native";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Track } from "livekit-client";
import {
  ArrowLeft,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Video,
  VideoOff,
} from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const TILE_COLORS: readonly [string, string][] = [
  ["#7A1EFF", "#D84CFF"],
  ["#D84CFF", "#FF8A2A"],
  ["#FF8A2A", "#B03BFF"],
  ["#B03BFF", "#D84CFF"],
  ["#35156B", "#7A1EFF"],
  ["#FF8A2A", "#D84CFF"],
];

interface RoomCredentials {
  serverUrl: string;
  token: string;
}

export default function LiveVideoRoom() {
  const { partyId: partyIdParam } = useLocalSearchParams<{ partyId: string }>();
  const partyId = Number(partyIdParam);
  const validPartyId = Number.isFinite(partyId);

  const { data: party } = useParty(validPartyId ? partyId : null);
  const requestVideoToken = useRequestVideoToken();
  const [credentials, setCredentials] = useState<RoomCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!validPartyId) return;
    let cancelled = false;
    setError(null);
    setCredentials(null);
    requestVideoToken
      .mutateAsync(partyId)
      .then((data) => {
        if (!cancelled) setCredentials({ serverUrl: data.url, token: data.token });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't connect to the video room — please try again",
        );
      });
    return () => {
      cancelled = true;
    };
    // Only re-run if the party being joined changes — a fresh token per mount is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyId, validPartyId]);

  useEffect(() => {
    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  if (!validPartyId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-muted-foreground text-sm text-center">
          Missing party to join.
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text className="text-muted-foreground text-sm text-center">{error}</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <Text className="text-violet-bright text-sm font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!credentials) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#B03BFF" />
      </SafeAreaView>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={credentials.serverUrl}
      token={credentials.token}
      connect
      audio
      video
      options={{ adaptiveStream: { pixelDensity: "screen" } }}
    >
      <VideoRoomView partyId={partyId} title={party?.title ?? "Video room"} />
    </LiveKitRoom>
  );
}

function VideoRoomView({ partyId, title }: { partyId: number; title: string }) {
  const { width } = useWindowDimensions();
  const room = useRoomContext();
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } = useLocalParticipant();
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);

  /*
   * Screen horizontal padding:
   * 12px left + 12px right
   *
   * Column gap:
   * 8px
   */
  const TILE_WIDTH = (width - 24 - 8) / 2;
  const TILE_HEIGHT = TILE_WIDTH * (4 / 3);

  const handleLeave = () => router.back();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <TouchableOpacity
          onPress={handleLeave}
          activeOpacity={0.8}
          className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <ArrowLeft size={17} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>

        <View className="items-center">
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full bg-orange" />
            <Text className="font-sans-medium text-xs text-white">
              Live • {room.numParticipants} in room
            </Text>
          </View>
          <Text className="mt-0.5 text-[10px] text-muted-foreground" numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View className="h-10 w-10" />
      </View>

      {/* Video Grid */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-3 pb-3"
      >
        <View className="flex-row flex-wrap gap-2">
          {tracks.map((trackRef, index) => {
            const { participant } = trackRef;
            const name = participant.name || participant.identity || "Guest";
            const muted = !participant.isMicrophoneEnabled;
            const colors = TILE_COLORS[index % TILE_COLORS.length];
            const hasVideo = isTrackReference(trackRef) && participant.isCameraEnabled;

            return (
              <LinearGradient
                key={participant.sid}
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="relative overflow-hidden rounded-3xl"
                style={{
                  width: TILE_WIDTH,
                  height: TILE_HEIGHT,
                }}
              >
                {hasVideo ? (
                  <VideoTrack
                    trackRef={trackRef}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                  />
                ) : (
                  <>
                    {/* Decorative light effect */}
                    <View
                      pointerEvents="none"
                      className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10"
                    />
                    <View
                      pointerEvents="none"
                      className="absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-black/10"
                    />

                    {/* Avatar Initial */}
                    <View className="absolute inset-0 items-center justify-center">
                      <View className="h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10">
                        <Text className="font-sg-extrabold text-5xl text-white">
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Top Badges */}
                <View className="absolute left-2 top-2 flex-row items-center gap-1">
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full ${muted ? "bg-background/70" : "bg-emerald-500/80"
                      }`}
                  >
                    {muted ? (
                      <MicOff size={12} color="#FFFFFF" strokeWidth={2} />
                    ) : (
                      <Mic size={12} color="#FFFFFF" strokeWidth={2} />
                    )}
                  </View>
                </View>

                {/* Bottom Details */}
                <View className="absolute bottom-2 left-2 right-2 flex-row items-center justify-between">
                  <View className="rounded-full bg-background/60 px-2.5 py-1">
                    <Text className="font-sans-semibold text-[11px] text-white" numberOfLines={1}>
                      {name}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Controls */}
      <View className="px-5 pb-2 pt-3">
        <View className="flex-row items-center justify-around rounded-3xl border border-white/10 bg-white/5 px-3 py-3">
          {/* Microphone */}
          <TouchableOpacity
            onPress={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            activeOpacity={0.8}
            className={`h-12 w-12 items-center justify-center rounded-2xl ${isMicrophoneEnabled ? "bg-secondary" : "bg-red-500"
              }`}
          >
            {isMicrophoneEnabled ? (
              <Mic size={20} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <MicOff size={20} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>

          {/* Camera */}
          <TouchableOpacity
            onPress={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            activeOpacity={0.8}
            className={`h-12 w-12 items-center justify-center rounded-2xl ${isCameraEnabled ? "bg-secondary" : "bg-red-500"
              }`}
          >
            {isCameraEnabled ? (
              <Video size={20} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <VideoOff size={20} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>

          {/* Open Game */}
          <TouchableOpacity
            onPress={() => router.push(`/play/game?partyId=${partyId}`)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-14 w-14 items-center justify-center rounded-2xl"
            >
              <Sparkles size={24} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Chat */}
          <TouchableOpacity
            onPress={() => router.push(`/chat/${partyId}`)}
            activeOpacity={0.8}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-secondary"
          >
            <MessageSquare size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          {/* End Call */}
          <TouchableOpacity
            onPress={handleLeave}
            activeOpacity={0.8}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-red-500"
          >
            <PhoneOff size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
