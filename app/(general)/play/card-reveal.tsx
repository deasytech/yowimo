import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

export default function CardReveal() {
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      flipCard();
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  const flipCard = () => {
    Animated.timing(flipAnimation, {
      toValue: flipped ? 0 : 180,
      duration: 700,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    setFlipped((current) => !current);
  };

  const frontRotation = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backRotation = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 89, 90],
    outputRange: [1, 1, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [89, 90, 180],
    outputRange: [0, 1, 1],
  });

  const handleAcceptChallenge = () => {
    router.push("/play/challenge");
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "bottom"]}
    >
      <View className="relative flex-1 items-center justify-center overflow-hidden px-5">
        {/* Top Glow */}
        <View
          pointerEvents="none"
          className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet/30"
        />

        {/* Bottom Glow */}
        <View
          pointerEvents="none"
          className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-orange/20"
        />

        {/* Status */}
        <Text className="font-sans-semibold text-xs uppercase tracking-[3px] text-muted-foreground">
          Drawing a card...
        </Text>

        {/* Card */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={flipCard}
          className="mt-6 h-80 w-56"
        >
          {/* Card Back */}
          <Animated.View
            pointerEvents={flipped ? "none" : "auto"}
            className="absolute inset-0 overflow-hidden rounded-3xl"
            style={{
              opacity: frontOpacity,
              backfaceVisibility: "hidden",
              transform: [
                { perspective: 1200 },
                { rotateY: frontRotation },
              ],
            }}
          >
            <LinearGradient
              colors={[
                "#7A1EFF",
                "#D84CFF",
                "#FF8A2A",
              ]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-1 items-center justify-center"
            >
              {/* Decorative circles */}
              <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />

              <View className="absolute -bottom-14 -left-14 h-44 w-44 rounded-full bg-black/10" />

              <View className="items-center">
                <Text className="text-7xl">
                  🃏
                </Text>

                <Text className="mt-3 font-sg-extrabold text-2xl tracking-tight text-white">
                  YOWIMO
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Card Front */}
          <Animated.View
            pointerEvents={flipped ? "auto" : "none"}
            className="absolute inset-0 overflow-hidden rounded-3xl"
            style={{
              opacity: backOpacity,
              backfaceVisibility: "hidden",
              transform: [
                { perspective: 1200 },
                { rotateY: backRotation },
              ],
            }}
          >
            <LinearGradient
              colors={[
                "#FF8A2A",
                "#D84CFF",
                "#7A1EFF",
              ]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-1 items-center justify-center p-6"
            >
              {/* Decorative Glow */}
              <View
                pointerEvents="none"
                className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10"
              />

              <View
                pointerEvents="none"
                className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-background/10"
              />

              <View className="items-center">
                {/* Challenge Type */}
                <View className="rounded-full bg-background/40 px-3 py-1.5">
                  <Text className="font-sans-bold text-[10px] uppercase tracking-wider text-white">
                    DARE • Wild
                  </Text>
                </View>

                {/* Challenge */}
                <Text className="mt-4 text-center font-sg-bold text-xl leading-7 text-white">
                  Call your mom and tell her you joined a cult.
                </Text>

                <Text className="mt-3 text-3xl">
                  📞
                </Text>

                <Text className="mt-4 text-[10px] text-white/70">
                  Tap card to flip again
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {/* Accept Button */}
        <TouchableOpacity
          onPress={handleAcceptChallenge}
          activeOpacity={0.9}
          className="mt-10 overflow-hidden rounded-2xl"
        >
          <LinearGradient
            colors={[
              "#7A1EFF",
              "#D84CFF",
              "#FF8A2A",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-8 py-4"
          >
            <Text className="font-sans-semibold text-sm text-white">
              Accept Challenge
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}