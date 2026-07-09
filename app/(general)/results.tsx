import { FRIENDS } from "@/data/mock";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Crown,
  Share2,
  Sparkles,
  Trophy,
} from "lucide-react-native";
import { styled } from "nativewind";
import {
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const CONFETTI_COLORS = [
  "#7A1EFF",
  "#B03BFF",
  "#D84CFF",
  "#FF8A2A",
];

const CONFETTI = Array.from({ length: 20 }).map((_, index) => ({
  id: index,
  top: `${5 + ((index * 17) % 60)}%`,
  left: `${(index * 29) % 100}%`,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
}));

const QUICK_LINKS = [
  {
    route: "/results/mvp-awards",
    label: "MVP Awards",
  },
  {
    route: "/results/highlights",
    label: "Highlights",
  },
  {
    route: "/leaderboard",
    label: "Leaderboard",
  },
  {
    route: "/results/end-party-summary",
    label: "Party Recap",
  },
  {
    route: "/play/invite",
    label: "Invite Back",
  },
  {
    route: "/profile/sponsor-management",
    label: "Sponsors",
  },
] as const;

export default function Results() {
  const mvp = FRIENDS[0];

  const ranked = FRIENDS.slice(0, 5).map((friend, index) => ({
    ...friend,
    score: 980 - index * 120,
  }));

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "Friday Night Chaos on Yowimo 🔥 10 rounds, 6 players, and one absolute legend. MVP of the night: " +
          mvp.name,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "bottom"]}
    >
      {/* Confetti */}
      <View
        pointerEvents="none"
        className="absolute inset-0 overflow-hidden"
      >
        {CONFETTI.map((item) => (
          <View
            key={item.id}
            className="absolute h-2 w-2 rounded-full"
            style={{
              top: item.top as `${number}%`,
              left: item.left as `${number}%`,
              backgroundColor: item.color,
            }}
          />
        ))}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-10"
      >
        {/* Intro */}
        <View className="items-center pt-4">
          <Text className="font-sans-semibold text-sm uppercase tracking-widest text-violet-bright">
            {"That's a wrap"}
          </Text>

          <Text className="mt-1 text-center font-sg-bold text-4xl leading-[44px] text-white">
            Friday Night Chaos
          </Text>

          <Text className="mt-2 text-center text-sm text-muted-foreground">
            10 rounds • 6 players • 1 absolute legend
          </Text>
        </View>

        {/* MVP Card */}
        <LinearGradient
          colors={[
            "#7A1EFF",
            "#D84CFF",
            "#FF8A2A",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="relative mt-8 overflow-hidden rounded-4xl p-6"
        >
          {/* Decorative crown */}
          <Text className="absolute -top-10 left-1/2 -translate-x-1/2 text-7xl opacity-20">
            👑
          </Text>

          {/* Decorative glow */}
          <View
            pointerEvents="none"
            className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10"
          />

          <View className="items-center">
            <Crown
              size={32}
              color="#FFFFFF"
              strokeWidth={2}
            />

            <Text className="mt-2 font-sans-bold text-xs uppercase tracking-widest text-white/70">
              MVP of the Night
            </Text>

            {/* MVP Avatar */}
            <View className="mt-4 h-20 w-20 items-center justify-center rounded-full border-4 border-white/20 bg-white">
              <Text className="font-sg-extrabold text-2xl text-primary">
                {mvp.initials}
              </Text>
            </View>

            <Text className="mt-3 font-sg-bold text-2xl text-white">
              {mvp.name}
            </Text>

            <Text className="mt-1 text-sm text-white/70">
              980 points • 4 dares survived
            </Text>

            {/* Token Reward */}
            <View className="mt-4 flex-row items-center gap-2 rounded-full bg-white px-4 py-2.5">
              <Sparkles
                size={16}
                color="#FF8A2A"
                strokeWidth={2.5}
              />

              <Text className="font-sans-bold text-sm text-background">
                +25 tokens earned
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Leaderboard */}
        <View className="mt-8">
          <View className="mb-3 flex-row items-center gap-2">
            <Trophy
              size={20}
              color="#FF8A2A"
              strokeWidth={2}
            />

            <Text className="font-sg-bold text-lg text-white">
              Final Standings
            </Text>
          </View>

          <View className="gap-2">
            {ranked.map((player, index) => (
              <View
                key={player.id}
                className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                {/* Position */}
                <View className="w-7 items-center">
                  <Text
                    className={`font-sg-bold text-lg ${index === 0
                      ? "text-orange"
                      : index === 1
                        ? "text-violet-bright"
                        : "text-white/60"
                      }`}
                  >
                    {index + 1}
                  </Text>
                </View>

                {/* Avatar */}
                <LinearGradient
                  colors={["#7A1EFF", "#D84CFF"]}
                  className="h-10 w-10 items-center justify-center rounded-full"
                >
                  <Text className="font-sg-bold text-sm text-white">
                    {player.initials}
                  </Text>
                </LinearGradient>

                {/* Player */}
                <View className="flex-1">
                  <Text className="font-sans-semibold text-sm text-white">
                    {player.name}
                  </Text>

                  <Text className="mt-0.5 text-[11px] text-muted-foreground">
                    {player.handle}
                  </Text>
                </View>

                {/* Score */}
                <Text className="font-sg-bold text-base text-white">
                  {player.score}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Navigation */}
        <View className="mt-7 flex-row flex-wrap gap-2">
          {QUICK_LINKS.map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route)}
              activeOpacity={0.8}
              className="w-[31.5%] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-1 py-4"
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className="text-center font-sans-semibold text-xs text-white"
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Actions */}
        <View className="mt-7 flex-row gap-3">
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.8}
            className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-secondary"
          >
            <Share2
              size={17}
              color="#FFFFFF"
              strokeWidth={2}
            />

            <Text className="font-sans-semibold text-sm text-white">
              Share Recap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/")}
            activeOpacity={0.9}
            className="flex-1"
          >
            <LinearGradient
              colors={[
                "#7A1EFF",
                "#D84CFF",
                "#FF8A2A",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-14 items-center justify-center rounded-2xl"
            >
              <Text className="font-sans-semibold text-sm text-white">
                Back Home
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}