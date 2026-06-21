import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Coins, Crown } from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const TABS = ["Global", "Party", "Friends"];

const ROWS = [
  { rank: 1, name: "Zara K.", level: 87, tokens: 12450, colors: ["#FF8A2A", "#D84CFF"] },
  { rank: 2, name: "Maya R.", level: 72, tokens: 9820, colors: ["#D84CFF", "#7A1EFF"] },
  { rank: 3, name: "Leo P.", level: 65, tokens: 8210, colors: ["#7A1EFF", "#2D2A8F"] },
  { rank: 4, name: "Sam W.", level: 58, tokens: 6940 },
  { rank: 5, name: "Priya N.", level: 51, tokens: 5780 },
  { rank: 6, name: "Jordan K.", level: 49, tokens: 5210 },
  { rank: 7, name: "Aiden C.", level: 44, tokens: 4900 },
  { rank: 12, name: "You · Alex", level: 24, tokens: 142, you: true },
];

const PODIUM_HEIGHTS = [96, 128, 80]; // h-24, h-32, h-20 in px

export default function LeaderboardScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("Global");

  const podiumOrder = [ROWS[1], ROWS[0], ROWS[2]];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center rounded-full bg-card border border-border"
          >
            <ArrowLeft color="#fff" size={16} strokeWidth={2} />
          </TouchableOpacity>
          <Text className="text-foreground text-lg font-bold">Leaderboard</Text>
          <View className="w-10" />
        </View>
        {/* ── Tabs ── */}
        <View className="mt-2 flex-row gap-2">
          {TABS.map((t) => {
            const active = tab === t;
            return active ? (
              <TouchableOpacity key={t} onPress={() => setTab(t)} activeOpacity={0.85} style={{ flex: 1 }}>
                <LinearGradient
                  colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-2xl py-2.5 items-center"
                >
                  <Text className="text-white text-sm font-semibold">{t}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                activeOpacity={0.8}
                style={{ flex: 1 }}
                className="rounded-2xl py-2.5 items-center bg-secondary/60"
              >
                <Text className="text-muted-foreground text-sm font-semibold">{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* ── Podium ── */}
        <View className="mt-5 flex-row items-end gap-2">
          {podiumOrder.map((r, i) => (
            <View key={r.rank} style={{ flex: 1 }} className="items-center">
              <LinearGradient
                colors={r.colors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-16 w-16 items-center justify-center rounded-full"
              >
                <Text className="text-white text-xl font-extrabold">{r.name[0]}</Text>
              </LinearGradient>
              <Text
                className="mt-2 text-foreground text-xs font-semibold text-center"
                numberOfLines={1}
                style={{ width: "100%" }}
              >
                {r.name}
              </Text>
              <LinearGradient
                colors={r.colors as [string, string]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                className="mt-1 w-full items-center justify-center"
                style={{
                  height: PODIUM_HEIGHTS[i],
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                }}
              >
                {r.rank === 1 ? (
                  <Crown color="#fff" size={24} strokeWidth={2} />
                ) : (
                  <Text className="text-white text-2xl font-extrabold">{r.rank}</Text>
                )}
              </LinearGradient>
              <Text className="text-muted-foreground text-sm mt-1">
                {r.tokens.toLocaleString()} <Coins color="#ffffff" size={20} strokeWidth={2.5} />
              </Text>
            </View>
          ))}
        </View>
        {/* ── Ranked list ── */}
        <View className="mt-5 gap-2">
          {ROWS.slice(3).map((r) =>
            r.you ? (
              <View
                key={r.rank}
                className="flex-row items-center gap-3 rounded-2xl p-3 bg-violet/20 border border-violet-bright"
              >
                <Text className="w-6 text-center text-muted-foreground text-base font-bold">
                  {r.rank}
                </Text>
                <LinearGradient
                  colors={["#7A1EFF", "#B03BFF"]}
                  className="h-10 w-10 items-center justify-center rounded-xl"
                >
                  <Text className="text-white text-sm font-bold">{r.name[0]}</Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">{r.name}</Text>
                  <Text className="text-muted-foreground text-xs">Lvl {r.level}</Text>
                </View>
                <Text className="text-orange text-base font-bold">
                  {r.tokens.toLocaleString()} <Coins color="#ffffff" size={20} strokeWidth={2.5} />
                </Text>
              </View>
            ) : (
              <View
                key={r.rank}
                className="flex-row items-center gap-3 rounded-2xl p-3 bg-card"
              >
                <Text className="w-6 text-center text-muted-foreground text-base font-bold">
                  {r.rank}
                </Text>
                <LinearGradient
                  colors={["#7A1EFF", "#B03BFF"]}
                  className="h-10 w-10 items-center justify-center rounded-xl"
                >
                  <Text className="text-white text-sm font-bold">{r.name[0]}</Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">{r.name}</Text>
                  <Text className="text-muted-foreground text-xs">Lvl {r.level}</Text>
                </View>
                <Text className="text-orange text-base font-bold">
                  {r.tokens.toLocaleString()} <Coins color="#ffffff" size={20} strokeWidth={2.5} />
                </Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}