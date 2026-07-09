import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowLeft,
  Share2,
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

const STATS = [
  {
    label: "Rounds",
    value: 14,
  },
  {
    label: "Cards",
    value: 87,
  },
  {
    label: "Dares done",
    value: 23,
  },
  {
    label: "Laughs",
    value: "∞",
  },
];

const MOMENTS = [
  {
    id: 1,
    who: "Maya",
    text: "danced on a chair",
    emoji: "💃",
  },
  {
    id: 2,
    who: "Leo",
    text: "called his ex, didn't pick up",
    emoji: "📞",
  },
  {
    id: 3,
    who: "Alex",
    text: "ate a spoon of mustard",
    emoji: "🥄",
  },
];

export default function EndPartySummary() {
  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "Friday Night Chaos on Yowimo was an absolute scene 🔥 14 rounds, 87 cards, and 23 dares completed!",
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
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-10"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
          >
            <ArrowLeft
              size={18}
              color="#FFFFFF"
              strokeWidth={2}
            />
          </TouchableOpacity>

          <Text className="font-sg-bold text-lg text-white">
            Party Recap
          </Text>

          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
          >
            <Share2
              size={18}
              color="#FFFFFF"
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* Recap Hero */}
        <LinearGradient
          colors={[
            "#7A1EFF",
            "#D84CFF",
            "#FF8A2A",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="relative mt-2 overflow-hidden rounded-3xl p-6"
        >
          {/* Decorative circles */}
          <View
            pointerEvents="none"
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
          />

          <View
            pointerEvents="none"
            className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-black/10"
          />

          <View className="items-center">
            <Text className="text-center font-sans-semibold text-xs uppercase tracking-widest text-white/70">
              Friday Night Chaos • 2h 14m
            </Text>

            <Text className="mt-2 text-center font-sg-extrabold text-3xl leading-10 text-white">
              An absolute scene 🔥
            </Text>

            {/* Stats */}
            <View className="mt-5 w-full flex-row gap-2">
              {STATS.map((stat) => (
                <View
                  key={stat.label}
                  className="flex-1 items-center rounded-2xl border border-white/10 bg-white/15 px-1 py-3"
                >
                  <Text className="font-sg-extrabold text-xl text-white">
                    {stat.value}
                  </Text>

                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    className="mt-1 text-center text-[9px] uppercase tracking-wide text-white/70"
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Top Moments */}
        <View className="mt-7">
          <Text className="mb-3 font-sg-bold text-lg text-white">
            🎬 Top Moments
          </Text>

          <View className="gap-3">
            {MOMENTS.map((moment) => (
              <View
                key={moment.id}
                className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-card p-4"
              >
                {/* Emoji */}
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                  <Text className="text-3xl">
                    {moment.emoji}
                  </Text>
                </View>

                {/* Moment information */}
                <View className="flex-1">
                  <Text className="text-sm leading-5 text-white">
                    <Text className="font-sg-bold">
                      {moment.who}
                    </Text>

                    <Text className="text-muted-foreground">
                      {" "}
                      {moment.text}
                    </Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View className="mt-7 flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push("/results/highlights")}
            activeOpacity={0.8}
            className="h-14 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-secondary"
          >
            <Text className="font-sans-semibold text-sm text-white">
              Watch Highlights
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/results/mvp-awards")}
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
                See Awards
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Home */}
        <TouchableOpacity
          onPress={() => router.replace("/")}
          activeOpacity={0.7}
          className="mt-4 items-center py-3"
        >
          <Text className="text-sm font-sans-medium text-muted-foreground">
            Back to Home
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}