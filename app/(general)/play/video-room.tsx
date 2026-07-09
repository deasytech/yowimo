import { PARTIES } from "@/data/mock";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

interface VideoTile {
  name: string;
  colors: readonly [string, string];
  muted: boolean;
  host?: boolean;
}

const TILES: VideoTile[] = [
  {
    name: "Alex",
    colors: ["#7A1EFF", "#D84CFF"],
    muted: false,
    host: true,
  },
  {
    name: "Maya",
    colors: ["#D84CFF", "#FF8A2A"],
    muted: false,
  },
  {
    name: "Leo",
    colors: ["#FF8A2A", "#B03BFF"],
    muted: true,
  },
  {
    name: "Sam",
    colors: ["#B03BFF", "#D84CFF"],
    muted: false,
  },
  {
    name: "Priya",
    colors: ["#35156B", "#7A1EFF"],
    muted: false,
  },
  {
    name: "Jordan",
    colors: ["#FF8A2A", "#D84CFF"],
    muted: true,
  },
];

const REACTIONS = ["🔥", "😂", "✨"];

export default function LiveVideoRoom() {
  const { width } = useWindowDimensions();

  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);

  /*
   * Screen horizontal padding:
   * 12px left + 12px right
   *
   * Column gap:
   * 8px
   */
  const TILE_WIDTH = (width - 24 - 8) / 2;

  const TILE_HEIGHT = TILE_WIDTH * (4 / 3);

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <ArrowLeft
            size={17}
            color="#FFFFFF"
            strokeWidth={2}
          />
        </TouchableOpacity>

        <View className="items-center">
          <View className="flex-row items-center gap-1.5">
            {/* Live indicator */}
            <View className="h-2 w-2 rounded-full bg-orange" />

            <Text className="font-sans-medium text-xs text-white">
              Live • 6 in room
            </Text>
          </View>

          <Text className="mt-0.5 text-[10px] text-muted-foreground">
            Friday Night Chaos
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <Sparkles
            size={17}
            color="#D84CFF"
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Video Grid */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-3 pb-3"
      >
        <View className="flex-row flex-wrap gap-2">
          {TILES.map((tile, index) => (
            <LinearGradient
              key={`${tile.name}-${index}`}
              colors={tile.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="relative overflow-hidden rounded-3xl"
              style={{
                width: TILE_WIDTH,
                height: TILE_HEIGHT,
              }}
            >
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
                    {tile.name.charAt(0)}
                  </Text>
                </View>
              </View>

              {/* Top Badges */}
              <View className="absolute left-2 top-2 flex-row items-center gap-1">
                {tile.host && (
                  <View className="rounded-full bg-orange px-2 py-1">
                    <Text className="font-sans-bold text-[9px] text-white">
                      HOST
                    </Text>
                  </View>
                )}

                <View
                  className={`h-6 w-6 items-center justify-center rounded-full ${tile.muted
                    ? "bg-background/70"
                    : "bg-emerald-500/80"
                    }`}
                >
                  {tile.muted ? (
                    <MicOff
                      size={12}
                      color="#FFFFFF"
                      strokeWidth={2}
                    />
                  ) : (
                    <Mic
                      size={12}
                      color="#FFFFFF"
                      strokeWidth={2}
                    />
                  )}
                </View>
              </View>

              {/* Bottom Details */}
              <View className="absolute bottom-2 left-2 right-2 flex-row items-center justify-between">
                <View className="rounded-full bg-background/60 px-2.5 py-1">
                  <Text className="font-sans-semibold text-[11px] text-white">
                    {tile.name}
                  </Text>
                </View>

                <Text className="text-base">
                  {REACTIONS[index % REACTIONS.length]}
                </Text>
              </View>
            </LinearGradient>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Controls */}
      <View className="px-5 pb-2 pt-3">
        <View className="flex-row items-center justify-around rounded-3xl border border-white/10 bg-white/5 px-3 py-3">
          {/* Microphone */}
          <TouchableOpacity
            onPress={() => setMic((previous) => !previous)}
            activeOpacity={0.8}
            className={`h-12 w-12 items-center justify-center rounded-2xl ${mic ? "bg-secondary" : "bg-red-500"
              }`}
          >
            {mic ? (
              <Mic
                size={20}
                color="#FFFFFF"
                strokeWidth={2}
              />
            ) : (
              <MicOff
                size={20}
                color="#FFFFFF"
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>

          {/* Camera */}
          <TouchableOpacity
            onPress={() => setCam((previous) => !previous)}
            activeOpacity={0.8}
            className={`h-12 w-12 items-center justify-center rounded-2xl ${cam ? "bg-secondary" : "bg-red-500"
              }`}
          >
            {cam ? (
              <Video
                size={20}
                color="#FFFFFF"
                strokeWidth={2}
              />
            ) : (
              <VideoOff
                size={20}
                color="#FFFFFF"
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>

          {/* Open Game */}
          <TouchableOpacity
            onPress={() => router.push("/play/card-reveal")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-14 w-14 items-center justify-center rounded-2xl"
            >
              <Sparkles
                size={24}
                color="#FFFFFF"
                strokeWidth={2}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Chat */}
          <TouchableOpacity
            onPress={() => router.push(`/chat/${PARTIES[0].id}`)}
            activeOpacity={0.8}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-secondary"
          >
            <MessageSquare
              size={20}
              color="#FFFFFF"
              strokeWidth={2}
            />
          </TouchableOpacity>

          {/* End Call */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-red-500"
          >
            <PhoneOff
              size={20}
              color="#FFFFFF"
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}