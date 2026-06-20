import GoBack from "@/components/shared/GoBack";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Lock } from "lucide-react-native";
import { styled } from "nativewind";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const BADGES = [
  { id: 1, name: "First Party", emoji: "🎉", progress: 1, total: 1, unlocked: true },
  { id: 2, name: "Truth Bomber", emoji: "💣", progress: 24, total: 25, unlocked: false },
  { id: 3, name: "Dare Devil", emoji: "🔥", progress: 12, total: 20, unlocked: false },
  { id: 4, name: "Social Butterfly", emoji: "🦋", progress: 7, total: 10, unlocked: false, reward: 50 },
  { id: 5, name: "Night Owl", emoji: "🌙", progress: 4, total: 5, unlocked: false },
  { id: 6, name: "Streak Master", emoji: "⚡", progress: 6, total: 7, unlocked: false, reward: 100 },
  { id: 7, name: "Token Tycoon", emoji: "🪙", progress: 142, total: 1000, unlocked: false },
  { id: 8, name: "Party Legend", emoji: "👑", progress: 0, total: 50, unlocked: false },
];

export default function AchievementsScreen() {
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
        <GoBack title="Achievements" />

        {/* ── Hero summary ── */}
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mt-2 rounded-3xl p-5"
        >
          <Text
            className="text-white/80 text-xs font-semibold uppercase"
            style={{ letterSpacing: 0.5 }}
          >
            Your collection
          </Text>

          <View className="mt-2 flex-row items-end justify-between">
            <View className="flex-row items-end">
              <Text className="text-white text-4xl font-extrabold">1</Text>
              <Text className="text-white text-xl font-extrabold mb-0.5">/24</Text>
            </View>
            <Text
              className="text-white/80 text-[10px] uppercase"
              style={{ letterSpacing: 0.5 }}
            >
              Next: Truth Bomber 96%
            </Text>
          </View>
          <Text className="text-white text-xs -mt-1">badges unlocked</Text>
        </LinearGradient>

        {/* ── Badge grid ── */}
        <View className="mt-5 flex-row flex-wrap gap-3">
          {BADGES.map((b) => (
            <View
              key={b.id}
              className={`relative rounded-3xl p-4 ${b.unlocked
                ? "bg-card border border-violet-bright/40"
                : "bg-card/60"
                }`}
              style={{ width: "47%" }}
            >
              <Text
                style={{
                  fontSize: 36,
                  opacity: b.unlocked ? 1 : 0.4,
                }}
              >
                {b.emoji}
              </Text>

              {!b.unlocked && (
                <View className="absolute right-3 top-3">
                  <Lock color="#a3a3ab" size={14} strokeWidth={2} />
                </View>
              )}

              <Text className="mt-2 text-foreground text-sm font-bold">
                {b.name}
              </Text>

              {/* Progress bar */}
              <View className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                <LinearGradient
                  colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: "100%",
                    width: `${(b.progress / b.total) * 100}%`,
                  }}
                />
              </View>

              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-muted-foreground text-[10px]">
                  {b.progress}/{b.total}
                </Text>
                {b.reward && (
                  <Text className="text-orange text-[10px] font-bold">
                    +{b.reward} 🪙
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}