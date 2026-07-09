import GoBack from "@/components/shared/GoBack";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Crown,
  Flame,
  Laugh,
  LucideIcon,
  Sparkles
} from "lucide-react-native";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Award {
  id: number;
  title: string;
  winner: string;
  reward: number;
  icon: LucideIcon;
  colors: readonly [string, string];
}

const AWARDS: Award[] = [
  {
    id: 1,
    title: "MVP",
    winner: "Maya R.",
    reward: 50,
    icon: Crown,
    colors: ["#FF8A2A", "#D84CFF"],
  },
  {
    id: 2,
    title: "Funniest",
    winner: "Leo P.",
    reward: 25,
    icon: Laugh,
    colors: ["#D84CFF", "#7A1EFF"],
  },
  {
    id: 3,
    title: "Most Daring",
    winner: "Alex K.",
    reward: 25,
    icon: Flame,
    colors: ["#7A1EFF", "#B03BFF"],
  },
  {
    id: 4,
    title: "Party King 👑",
    winner: "Sam W.",
    reward: 40,
    icon: Sparkles,
    colors: ["#312E81", "#D84CFF"],
  },
];

export default function MVPAwards() {
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "bottom"]}
    >
      {/* Background glow */}
      <View
        pointerEvents="none"
        className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-orange/20"
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-10"
      >
        <GoBack title="Hall of Awards" />

        {/* Hero title */}
        <View className="mt-3 items-center">
          <Text className="font-sans-semibold text-xs uppercase tracking-widest text-orange">
            {"Tonight's legends"}
          </Text>

          <Text className="mt-1 font-sg-extrabold text-3xl text-white">
            🏆 The Crowning
          </Text>

          <Text className="mt-2 text-center text-sm text-white/50">
            {"The party has spoken. Here are tonight's champions."}
          </Text>
        </View>

        {/* Awards */}
        <View className="mt-7 gap-3">
          {AWARDS.map((award) => {
            const Icon = award.icon;

            return (
              <View key={award.id}>
                <LinearGradient
                  colors={award.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="relative overflow-hidden rounded-3xl p-5"
                >
                  {/* Decorative glow */}
                  <View
                    pointerEvents="none"
                    className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15"
                  />

                  <View className="flex-row items-center gap-4">
                    {/* Award icon */}
                    <View className="h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/15">
                      <Icon
                        size={28}
                        color="#FFFFFF"
                        strokeWidth={2.2}
                      />
                    </View>

                    {/* Award information */}
                    <View className="flex-1">
                      <Text className="text-[10px] font-sans-semibold uppercase tracking-widest text-white/70">
                        {award.title}
                      </Text>

                      <Text className="mt-0.5 font-sg-extrabold text-xl text-white">
                        {award.winner}
                      </Text>
                    </View>

                    {/* Reward */}
                    <View className="rounded-full border border-white/10 bg-black/30 px-3 py-2">
                      <Text className="font-sans-bold text-sm text-white">
                        +{award.reward} 🪙
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-white/40">
                Total rewards
              </Text>

              <Text className="mt-1 font-sg-extrabold text-xl text-white">
                140 🪙
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-xs text-white/40">
                Awards given
              </Text>

              <Text className="mt-1 font-sg-extrabold text-xl text-white">
                {AWARDS.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="mt-6 flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push("/results/end-party-summary")}
            activeOpacity={0.8}
            className="h-14 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-secondary"
          >
            <Text className="font-sans-semibold text-sm text-white">
              Party Recap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/results/highlights")}
            activeOpacity={0.9}
            className="flex-1"
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-14 items-center justify-center rounded-2xl"
            >
              <Text className="font-sans-semibold text-sm text-white">
                View Highlights
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}