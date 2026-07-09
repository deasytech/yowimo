import GoBack from "@/components/shared/GoBack";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check, Mic } from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const TURN_DURATION = 18;
const PASS_COST = 10;
const LOW_TIME_THRESHOLD = 5;

const others = ["MR", "LP", "SP", "JK", "PN"];

export default function ActivePlayerView() {
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);
  const [tokens, setTokens] = useState(240);

  const pulse = useRef(new Animated.Value(1)).current;
  const passToastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [pulse]);

  const handleDone = () => {
    router.push("/results");
  };

  const handlePass = () => {
    setTokens((current) => Math.max(0, current - PASS_COST));

    passToastOpacity.setValue(1);
    Animated.timing(passToastOpacity, {
      toValue: 0,
      duration: 900,
      delay: 500,
      useNativeDriver: true,
    }).start();
  };

  const isLowTime = timeLeft <= LOW_TIME_THRESHOLD;

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "bottom"]}
    >
      <View className="flex-1 px-5 pb-4">
        <GoBack title="Round 4 · Truth or Dare" />

        <View className="items-center -mt-1 mb-3">
          <View className="flex-row items-center rounded-full bg-violet/20 px-3 py-1.5">
            <Animated.View
              style={{ opacity: pulse }}
              className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet"
            />

            <Text className="font-sans-bold text-[11px] uppercase tracking-wider text-violet">
              It&apos;s your turn
            </Text>
          </View>
        </View>

        {/* Active Player Card */}

        <LinearGradient
          colors={[
            "#7A1EFF",
            "#D84CFF",
            "#FF8A2A",
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          className="relative flex-1 overflow-hidden rounded-4xl"
        >
          {/* Decorative gradient lighting */}

          <View className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10" />

          <View className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-black/10" />

          {/* Player Content */}

          <View className="flex-1 items-center justify-center px-5">
            <View className="rounded-full bg-white/20 px-3 py-1.5">
              <Text className="font-sans-bold text-[10px] uppercase tracking-wider text-white">
                Active player
              </Text>
            </View>

            {/* Avatar */}

            <View className="mt-6 h-44 w-44 items-center justify-center rounded-full border-4 border-white/30 bg-white/15">
              <Text className="font-sg-extrabold text-7xl text-white">
                A
              </Text>

              <Animated.View
                style={{ opacity: pulse }}
                className="absolute -bottom-1 -right-1 h-11 w-11 items-center justify-center rounded-full border-2 border-white/40 bg-violet"
              >
                <Mic
                  size={16}
                  color="#FFFFFF"
                />
              </Animated.View>
            </View>

            {/* Name */}

            <Text className="mt-5 font-sg-bold text-3xl text-white">
              Alex
            </Text>

            {/* Speaking Status */}

            <View className="mt-2 flex-row items-center rounded-full bg-black/30 px-3 py-1.5">
              <Animated.View
                style={{ opacity: pulse }}
                className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white"
              />

              <Text className="font-sans-medium text-xs text-white">
                Speaking...
              </Text>
            </View>
          </View>

          {/* Challenge Panel */}

          <View className="absolute bottom-4 left-4 right-4 flex-row items-center justify-between rounded-2xl bg-black/35 px-4 py-3">
            <View className="mr-4 flex-1">
              <Text className="text-[10px] uppercase tracking-wider text-white/70">
                Challenge
              </Text>

              <Text className="mt-1 font-sg-bold text-sm leading-5 text-white">
                Reveal your last embarrassing text
              </Text>
            </View>

            <Text
              className={`font-sg-extrabold text-2xl ${isLowTime ? "text-red-400" : "text-white"
                }`}
            >
              0:{String(timeLeft).padStart(2, "0")}
            </Text>
          </View>
        </LinearGradient>

        {/* Other Players */}

        <View className="pb-3 pt-3">
          <Text className="mb-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
            Up next
          </Text>

          <View className="flex-row justify-center">
            {others.map((player, index) => (
              <View
                key={`${player}-${index}`}
                className={`h-10 w-10 items-center justify-center rounded-2xl border bg-card ${index === 0 ? "border-violet" : "border-white/10"
                  } ${index !== others.length - 1 ? "mr-2" : ""}`}
              >
                <Text className="font-sans-bold text-[11px] text-white">
                  {player}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pass Toast */}

        <Animated.View
          pointerEvents="none"
          style={{ opacity: passToastOpacity }}
          className="absolute bottom-18.5 self-center rounded-full bg-background/80 px-3 py-1"
        >
          <Text className="font-sans-bold text-xs text-white">
            -{PASS_COST} 🪙 passed
          </Text>
        </Animated.View>

        {/* Actions */}

        <View className="mt-3 flex-row">
          {/* Done */}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleDone}
            className="mr-1 flex-1"
          >
            <LinearGradient
              colors={[
                "#10B981",
                "#059669",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              className="h-13 flex-row items-center justify-center rounded-2xl py-3.5"
            >
              <Text className="font-sans-bold text-sm text-white">
                Done
              </Text>

              <Check
                size={16}
                color="#FFFFFF"
                style={{
                  marginLeft: 5,
                }}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Pass */}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePass}
            disabled={tokens < PASS_COST}
            className={`ml-1 flex-1 ${tokens < PASS_COST ? "opacity-40" : ""}`}
          >
            <LinearGradient
              colors={[
                "#EF4444",
                "#DC2626",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              className="h-13 items-center justify-center rounded-2xl py-3.5"
            >
              <Text className="font-sans-bold text-sm text-white">
                Pass (-{PASS_COST} 🪙)
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
