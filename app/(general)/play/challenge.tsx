import GoBack from "@/components/shared/GoBack";
import TokenBadge from "@/components/TokenBadge";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Coins } from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const REACTIONS = ["🔥", "😂", "😱", "💯", "👀"];

const CHALLENGE_DURATION = 45;
const SKIP_COST = 10;

interface Challenge {
  player: string;
  type: string;
  intensity: string;
  text: string;
}

const CHALLENGES: Challenge[] = [
  {
    player: "Alex",
    type: "DARE",
    intensity: "Wild",
    text: "Do your best impression of a Bollywood villain, in 30 seconds.",
  },
  {
    player: "Maya",
    type: "TRUTH",
    intensity: "Spicy",
    text: "What's the most embarrassing thing in your search history?",
  },
  {
    player: "Leo",
    type: "DARE",
    intensity: "Chill",
    text: "Send a voice note singing happy birthday to yourself.",
  },
  {
    player: "Priya",
    type: "DARE",
    intensity: "Medium",
    text: "Let the group post anything they want on your Instagram story.",
  },
];

export default function ChallengeScreen() {
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_DURATION);
  const [tokens, setTokens] = useState(240);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});

  const skipToastOpacity = useRef(new Animated.Value(0)).current;
  const urgentPulse = useRef(new Animated.Value(1)).current;
  const reactionScales = useRef(
    Object.fromEntries(
      REACTIONS.map((reaction) => [reaction, new Animated.Value(1)])
    ) as Record<string, Animated.Value>
  ).current;

  const challenge = CHALLENGES[challengeIndex % CHALLENGES.length];
  const isUrgent = timeLeft <= 10;

  useEffect(() => {
    setTimeLeft(CHALLENGE_DURATION);
  }, [challengeIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [challengeIndex]);

  useEffect(() => {
    if (timeLeft === 0) {
      setChallengeIndex((current) => current + 1);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (!isUrgent) {
      urgentPulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(urgentPulse, {
          toValue: 0.4,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(urgentPulse, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [isUrgent, urgentPulse]);

  const handleComplete = () => {
    router.push("/results");
  };

  const handleSkip = () => {
    setTokens((current) => Math.max(0, current - SKIP_COST));

    skipToastOpacity.setValue(1);
    Animated.timing(skipToastOpacity, {
      toValue: 0,
      duration: 900,
      delay: 500,
      useNativeDriver: true,
    }).start();

    setChallengeIndex((current) => current + 1);
  };

  const handleReaction = (reaction: string) => {
    setReactionCounts((current) => ({
      ...current,
      [reaction]: (current[reaction] ?? 0) + 1,
    }));

    const scale = reactionScales[reaction];
    scale.setValue(1.4);
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "bottom"]}
    >
      <View className="flex-1 px-5 pb-4">
        {/* Header */}
        <GoBack title="Truth or Dare" />

        <View className="-mt-1 mb-1 flex-row items-center justify-between">
          <View className="rounded-full border border-orange/40 bg-orange/20 px-3 py-1.5">
            <Text className="font-sans-bold text-xs text-orange">
              {challenge.type} • {challenge.intensity}
            </Text>
          </View>

          <TokenBadge amount={tokens} size="sm" />
        </View>

        {/* Challenge Card */}
        <LinearGradient
          colors={[
            "#FF8A2A",
            "#D84CFF",
            "#7A1EFF",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="relative mt-4 overflow-hidden rounded-3xl p-8"
        >
          {/* Decorative Glow */}
          <View
            pointerEvents="none"
            className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10"
          />

          <View
            pointerEvents="none"
            className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-black/10"
          />

          <View className="items-center">
            <Text className="font-sans-semibold text-xs uppercase tracking-widest text-white/70">
              Challenge for {challenge.player}
            </Text>

            <Text className="mt-3 text-center font-sg-bold text-3xl leading-9.5 text-white">
              {challenge.text}
            </Text>

            {/* Timer */}
            <Animated.View
              style={{ opacity: urgentPulse }}
              className="mt-6 rounded-full bg-background/40 px-5 py-2.5"
            >
              <Text
                className={`font-sg-extrabold text-4xl ${isUrgent ? "text-red-400" : "text-white"
                  }`}
              >
                0:{String(timeLeft).padStart(2, "0")}
              </Text>
            </Animated.View>

            {/* Progress */}
            <View className="mt-3 h-1.5 w-44 overflow-hidden rounded-full bg-white/20">
              <View
                style={{
                  width: `${(timeLeft / CHALLENGE_DURATION) * 100}%`,
                }}
                className={`h-full rounded-full ${isUrgent ? "bg-red-400" : "bg-white"
                  }`}
              />
            </View>

            {/* Skip Toast */}
            <Animated.View
              pointerEvents="none"
              style={{ opacity: skipToastOpacity }}
              className="mt-3 flex-row items-center rounded-full bg-background/60 px-3 py-1"
            >
              <Text className="font-sans-bold text-xs text-white">
                -{SKIP_COST} skipped
              </Text>

              <Coins
                color="#FFFFFF"
                size={12}
                strokeWidth={2.5}
                style={{ marginLeft: 4 }}
              />
            </Animated.View>
          </View>
        </LinearGradient>

        {/* Live Reactions */}
        <Text className="mt-5 text-xs text-muted-foreground">
          Live reactions
        </Text>

        <View className="mt-2 flex-row items-center justify-around rounded-2xl border border-white/10 bg-white/5 p-3">
          {REACTIONS.map((reaction) => (
            <TouchableOpacity
              key={reaction}
              activeOpacity={0.6}
              onPress={() => handleReaction(reaction)}
              className="h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
            >
              <Animated.Text
                style={{ transform: [{ scale: reactionScales[reaction] }] }}
                className="text-2xl"
              >
                {reaction}
              </Animated.Text>

              {!!reactionCounts[reaction] && (
                <Text className="absolute -top-1 right-0 font-sans-bold text-[10px] text-orange">
                  {reactionCounts[reaction]}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Actions */}
        <View className="mt-auto flex-row gap-2 pt-6">
          {/* Complete */}
          <TouchableOpacity
            onPress={handleComplete}
            activeOpacity={0.85}
            className="h-14 flex-1 items-center justify-center rounded-2xl bg-emerald-500"
          >
            <Text className="font-sans-bold text-base text-white">
              I did it ✓
            </Text>
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.85}
            className="h-14 flex-1 flex-row items-center justify-center rounded-2xl bg-red-500"
          >
            <Text className="font-sans-bold text-base text-white">
              Skip (-{SKIP_COST}
            </Text>

            <Coins
              color="#FFFFFF"
              size={15}
              strokeWidth={2.5}
              style={{ marginHorizontal: 2 }}
            />

            <Text className="font-sans-bold text-base text-white">)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
