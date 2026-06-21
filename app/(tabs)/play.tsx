import { GAME_TYPES } from "@/data/mock";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Href, Link, useLocalSearchParams, useRouter } from "expo-router";
import { Globe, Lock, Sparkles, Tv, Users } from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const GRID_PADDING = 20; // matches contentContainerStyle paddingHorizontal
const GRID_GAP = 12; // matches gap-3
const GRID_COLUMNS = 3;
const ADVANCED_LINK_GAP = 8; // matches gap-2

const MODES = [
  { id: "Online" as const, Icon: Globe },
  { id: "In-person" as const, Icon: Users },
  { id: "Hybrid" as const, Icon: Tv },
];

const ADVANCED_LINKS: { to: Href; label: string; emoji: string }[] = [
  { to: "/play/party-type", label: "Party type", emoji: "🎴" },
  { to: "/play/schedule", label: "Schedule", emoji: "🗓️" },
  { to: "/play/invite", label: "Invite friends", emoji: "👥" },
  { to: "/play/public", label: "Browse public", emoji: "🌍" },
  { to: "/play/in-person", label: "In-person setup", emoji: "🪑" },
  { to: "/play/hybrid", label: "Hybrid setup", emoji: "📺" },
  { to: "/play/connect-tv", label: "Connect TV", emoji: "📡" },
  { to: "/play/qr-join", label: "QR / Code", emoji: "🔳" },
];

export default function CreatePartyScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId?: string }>();
  const { width: windowWidth } = useWindowDimensions();
  const [game, setGame] = useState(
    () => GAME_TYPES.find((item) => item.id === gameId)?.id ?? GAME_TYPES[0].id,
  );
  const [mode, setMode] = useState<"Online" | "In-person" | "Hybrid">("Online");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [gridWidth, setGridWidth] = useState(windowWidth - GRID_PADDING * 2);
  const [advancedLinksWidth, setAdvancedLinksWidth] = useState(
    windowWidth - GRID_PADDING * 2,
  );

  const selected = GAME_TYPES.find((g) => g.id === game)!;

  useEffect(() => {
    const requestedGame = GAME_TYPES.find((item) => item.id === gameId);

    if (requestedGame) {
      setGame(requestedGame.id);
    }
  }, [gameId]);
  // Round down so three cards plus both gaps can never overflow and wrap.
  const cardSize = Math.floor(
    (gridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS,
  );
  const advancedLinkWidth = Math.floor(
    (advancedLinksWidth - ADVANCED_LINK_GAP) / 2,
  );

  // RN's <Image> + FlatList/ScrollView windowing handles preloading/caching
  // automatically — no manual `new Image()` preload step needed like on web.

  const handleLaunch = () => {
    const dest =
      mode === "In-person"
        ? "/play/in-person"
        : mode === "Hybrid"
          ? "/play/hybrid"
          : "/lobby/new";
    router.push(dest);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-foreground text-3xl font-bold tracking-tight mt-16">
          Create a party
        </Text>
        <Text className="mt-1 text-muted-foreground text-sm">
          Pick the game. Set the vibe. Send it.
        </Text>

        {/* ── Game picker ── */}
        <View className="mt-6">
          <Text className="mb-3 text-foreground text-base font-semibold">
            Choose your game
          </Text>

          <View
            className="flex-row flex-wrap gap-3"
            onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
          >
            {GAME_TYPES.map((g) => {
              const active = g.id === game;

              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setGame(g.id)}
                  activeOpacity={0.85}
                  style={{
                    width: cardSize,
                    height: cardSize,
                    borderRadius: 16,
                    overflow: "hidden",
                    opacity: active ? 1 : 0.8,
                    transform: active ? [{ scale: 1.03 }] : undefined,
                    borderWidth: active ? 2 : 0,
                    borderColor: "#fff",
                  }}
                >
                  {g.image && (
                    <Image
                      source={g.image}
                      style={{ width: cardSize, height: cardSize }}
                      resizeMode="cover"
                    />
                  )}

                  {/* Bottom scrim for legible label text over the photo */}
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.20)", "rgba(0,0,0,0.70)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ position: "absolute", width: "100%", height: "100%" }}
                  />

                  <Text style={{ position: "absolute", top: 8, left: 8, fontSize: 22 }}>
                    {g.emoji}
                  </Text>

                  <Text
                    className="absolute text-white text-[10px] font-bold leading-tight"
                    style={{ left: 8, right: 8, bottom: 8 }}
                    numberOfLines={2}
                  >
                    {g.name}
                  </Text>

                  {g.cost > 0 && (
                    <View
                      className="absolute rounded-full bg-ink/60 px-1.5 py-0.5"
                      style={{ top: 6, right: 6 }}
                    >
                      <Text className="text-white text-[9px] font-bold">
                        🪙{g.cost}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Selected detail ── */}
        <View
          className="relative mt-5 rounded-3xl overflow-hidden"
          style={{ width: "100%", aspectRatio: 16 / 9, alignSelf: "stretch" }}
        >
          <View style={{ flex: 1, backgroundColor: "#19191F" }}>
            {selected.image && (
              <>
                <Image
                  key={selected.id}
                  source={selected.image}
                  style={{ position: "absolute", width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["rgba(0,0,0,0.10)", "rgba(0,0,0,0.30)", "rgba(0,0,0,0.75)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{ position: "absolute", width: "100%", height: "100%" }}
                />
              </>
            )}

            <View
              className="flex-row items-end justify-between p-5"
              style={{ position: "absolute", width: "100%", height: "100%" }}
            >
              <View className="flex-1 pr-3">
                <Text style={{ fontSize: 36 }}>{selected.emoji}</Text>
                <Text className="mt-2 text-white text-xl font-bold">
                  {selected.name}
                </Text>
                <Text className="text-white/85 text-sm">{selected.tagline}</Text>
              </View>

              <View className="rounded-full bg-ink/50 px-3 py-1">
                <Text className="text-white text-xs font-bold">
                  {selected.intensity}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Mode ── */}
        <View className="mt-6">
          <Text className="mb-3 text-foreground text-base font-semibold">
            How will you play?
          </Text>

          <View className="flex-row gap-2">
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setMode(m.id)}
                  activeOpacity={0.85}
                  style={{ flex: 1 }}
                  className={`items-center gap-1.5 rounded-2xl border p-3 ${active
                    ? "border-violet-bright bg-violet/15"
                    : "border-border bg-secondary/40"
                    }`}
                >
                  <m.Icon color="#fff" size={20} strokeWidth={2} />
                  <Text className="text-foreground text-xs font-semibold">{m.id}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Visibility ── */}
        <View className="mt-6">
          <Text className="mb-3 text-foreground text-base font-semibold">
            {"Who's invited?"}
          </Text>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setVisibility("private")}
              activeOpacity={0.85}
              style={{ flex: 1 }}
              className={`flex-row items-center gap-2 rounded-2xl border p-4 ${visibility === "private"
                ? "border-violet-bright bg-violet/15"
                : "border-border bg-secondary/40"
                }`}
            >
              <Lock color="#fff" size={16} strokeWidth={2} />
              <View>
                <Text className="text-foreground text-sm font-semibold">Private</Text>
                <Text className="text-muted-foreground text-[11px]">Invite only</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setVisibility("public")}
              activeOpacity={0.85}
              style={{ flex: 1 }}
              className={`flex-row items-center gap-2 rounded-2xl border p-4 ${visibility === "public"
                ? "border-violet-bright bg-violet/15"
                : "border-border bg-secondary/40"
                }`}
            >
              <Globe color="#fff" size={16} strokeWidth={2} />
              <View>
                <Text className="text-foreground text-sm font-semibold">Public</Text>
                <Text className="text-muted-foreground text-[11px]">In Discover</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── AI assist ── */}
        <View className="mt-6 rounded-3xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-2">
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-9 w-9 items-center justify-center rounded-full"
            >
              <Sparkles color="#fff" size={16} strokeWidth={2} />
            </LinearGradient>

            <View className="flex-1">
              <Text className="text-foreground text-sm font-semibold">
                AI Host enabled
              </Text>
              <Text className="text-muted-foreground text-[11px]">
                Custom challenges, MVPs, and a recap at the end.
              </Text>
            </View>

            <Text className="text-violet-bright text-xs font-bold">FREE</Text>
          </View>
        </View>

        {/* ── Advanced setup links ── */}
        <View
          className="mt-6 flex-row flex-wrap gap-2"
          onLayout={(event) =>
            setAdvancedLinksWidth(event.nativeEvent.layout.width)
          }
        >
          {ADVANCED_LINKS.map((l) => (
            <Link key={l.label} href={l.to} asChild>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{ width: advancedLinkWidth }}
                className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
              >
                <Text style={{ fontSize: 16 }}>{l.emoji}</Text>
                <Text
                  className="flex-1 text-foreground text-xs font-semibold"
                  numberOfLines={1}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>

        {/* ── Actions ── */}
        <View className="mt-8 flex-row gap-3">
          <TouchableOpacity
            onPress={() => { }}
            activeOpacity={0.8}
            style={{ flex: 1 }}
            className="h-14 items-center justify-center rounded-2xl border border-border"
          >
            <Text className="text-foreground text-sm font-semibold">Save draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLaunch}
            activeOpacity={0.85}
            style={{ flex: 1.4 }}
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-14 items-center justify-center rounded-2xl"
            >
              <Text className="text-white text-sm font-semibold">Launch party</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
