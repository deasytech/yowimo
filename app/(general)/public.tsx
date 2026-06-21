import GoBack from "@/components/shared/GoBack";
import { PARTIES } from "@/data/mock";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Filter, MapPin, Search, Users } from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

// Cover strip is a fixed h-24 (96px); width is screen minus the list's
// horizontal padding (20px * 2). Computed once, same fix pattern as play.tsx.
import { Dimensions } from "react-native";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const TABS = ["All", "Live", "Tonight", "Nearby", "Sponsored"];
const SCREEN_WIDTH = Dimensions.get("window").width;
const COVER_WIDTH = SCREEN_WIDTH - 20 * 2;
const COVER_HEIGHT = 96;
const NEARBY_DISTANCE_KM = 5;

export default function PublicPartyBrowserScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");

  const list = PARTIES.filter((p) => p.isPublic).filter(
    (p) =>
      (tab === "Live"
        ? p.isLive
        : tab === "Tonight"
          ? p.isLive || /^in \d+(m|h)$/i.test(p.startsIn)
          : tab === "Nearby"
            ? p.distanceKm !== undefined && p.distanceKm <= NEARBY_DISTANCE_KM
            : tab === "Sponsored"
              ? !!p.sponsored
              : true) &&
      (p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.type.toLowerCase().includes(q.toLowerCase()) ||
        p.host.toLowerCase().includes(q.toLowerCase()) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q.toLowerCase())))
  );

  const filterParties = () => {
    console.log("Filter public parties")
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5">
        <GoBack title="Public parties" rightIcon={Filter} rightAction={filterParties} />
      </View>

      {/* ── Search ── */}
      <View className="px-5 my-2">
        <View className="relative justify-center">
          <View className="absolute left-4 z-10">
            <Search color="#a3a3ab" size={16} strokeWidth={2} />
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by game, host, vibe…"
            placeholderTextColor="#a3a3ab"
            className="h-12 w-full rounded-2xl border border-border bg-secondary/60 pl-11 pr-4 text-foreground text-sm"
          />
        </View>
      </View>

      {/* ── Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: "center" }}
      >
        {TABS.map((t) => {
          const active = tab === t;
          return active ? (
            <TouchableOpacity key={t} onPress={() => setTab(t)} activeOpacity={0.85}>
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-full px-4 py-2"
              >
                <Text className="text-white text-xs font-semibold">{t}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
              className="rounded-full px-4 py-2 bg-secondary/60"
            >
              <Text className="text-muted-foreground text-xs font-semibold">{t}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Party list ── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {list.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => router.push(`/lobby/${p.id}` as any)}
            activeOpacity={0.85}
            className="rounded-3xl overflow-hidden bg-card"
          >
            {/* Cover strip — image if available, gradient fallback otherwise */}
            <View style={{ width: COVER_WIDTH, height: COVER_HEIGHT }}>
              {p.image ? (
                <Image
                  source={p.image}
                  style={{ width: COVER_WIDTH, height: COVER_HEIGHT }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={p.cover ?? ["#7A1EFF", "#D84CFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: COVER_WIDTH, height: COVER_HEIGHT }}
                />
              )}

              {/* Badge row sits on top regardless of image or gradient */}
              <View
                className="flex-row items-start justify-between p-3"
                style={{ position: "absolute", width: "100%", height: "100%" }}
              >
                {p.isLive ? (
                  <View className="rounded-full bg-ink/70 px-2.5 py-1">
                    <Text
                      className="text-white text-[10px] font-bold uppercase"
                      style={{ letterSpacing: 0.5 }}
                    >
                      🔴 Live
                    </Text>
                  </View>
                ) : (
                  <View className="rounded-full bg-ink/70 px-2.5 py-1">
                    <Text className="text-white text-[10px] font-semibold">
                      {p.startsIn}
                    </Text>
                  </View>
                )}

                {p.sponsored && (
                  <View className="rounded-full bg-orange/90 px-2.5 py-1">
                    <Text className="text-white text-[10px] font-bold">
                      ⚡ {p.sponsored}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Body */}
            <View className="p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View style={{ flex: 1 }}>
                  <Text className="text-muted-foreground text-[11px] font-medium">
                    {p.type} · {p.mode}
                  </Text>
                  <Text className="text-foreground text-base font-bold leading-tight">
                    {p.title}
                  </Text>
                </View>

                <LinearGradient
                  colors={["#7A1EFF", "#B03BFF"]}
                  className="rounded-full px-3 py-1"
                >
                  <Text className="text-white text-[11px] font-bold">Join</Text>
                </LinearGradient>
              </View>

              <View className="mt-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <Users color="#a3a3ab" size={14} strokeWidth={2} />
                  <Text className="text-muted-foreground text-xs">
                    {p.players}/{p.maxPlayers}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <MapPin color="#a3a3ab" size={14} strokeWidth={2} />
                  <Text className="text-muted-foreground text-xs">
                    {p.distanceKm !== undefined ? `${p.distanceKm} km away` : "Global"}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {list.length === 0 && (
          <Text className="py-12 text-center text-muted-foreground text-sm">
            No parties match — try another filter
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
