import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export default function MarketplaceCardSkeleton() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{ opacity: pulse }}
      className="mb-4 w-[48%] overflow-hidden rounded-3xl border border-white/10 bg-card"
    >
      <View className="h-32 bg-secondary" />

      <View className="p-3">
        <View className="h-3.5 w-4/5 rounded-full bg-secondary" />
        <View className="mt-2 h-3.5 w-1/2 rounded-full bg-secondary" />

        <View className="mt-3 flex-row items-center justify-between">
          <View className="h-4 w-10 rounded-full bg-secondary" />
          <View className="h-6 w-12 rounded-xl bg-secondary" />
        </View>
      </View>
    </Animated.View>
  );
}
