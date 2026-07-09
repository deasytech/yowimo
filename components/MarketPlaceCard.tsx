import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Check, Coins } from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LinearGradient = styled(RNLinearGradient);

interface MarketplaceCardProps {
  pack: {
    id: number;
    name: string;
    cards: number;
    price: number;
    emoji: string;
    tag?: string | null;
    image: any;
    colors?: [string, string];
  };
  onPress?: () => void;
  onBuy?: () => void;
  owned?: boolean;
  purchasing?: boolean;
  onImageError?: () => void;
}

export default function MarketplaceCard({
  pack,
  onPress,
  onBuy,
  owned = false,
  purchasing = false,
  onImageError,
}: MarketplaceCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const handleImageError = () => {
    setImageFailed(true);
    onImageError?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!onPress}
      className="mb-4 w-[48%] overflow-hidden rounded-3xl border border-white/10 bg-card"
    >
      <View className="relative h-32 overflow-hidden">
        {imageFailed ? (
          <LinearGradient
            colors={pack.colors ?? ["#7A1EFF", "#D84CFF"]}
            className="absolute inset-0"
          />
        ) : (
          <Image
            source={pack.image}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
            onError={handleImageError}
          />
        )}

        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,0.75)",
          ]}
          className="absolute inset-0"
        />

        {owned ? (
          <View className="absolute right-2 top-2 flex-row items-center gap-1 rounded-full bg-black/60 px-2 py-1">
            <Check color="#4ADE80" size={11} strokeWidth={3} />
            <Text className="text-[10px] font-sans-bold text-white">
              Owned
            </Text>
          </View>
        ) : pack.tag ? (
          <View className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1">
            <Text className="text-[10px] font-sans-bold text-white">
              {pack.tag}
            </Text>
          </View>
        ) : null}

        <Text className="absolute left-3 top-3 text-3xl">
          {pack.emoji}
        </Text>

        <Text className="absolute bottom-2 left-3 text-[10px] font-sans-semibold uppercase tracking-wider text-white">
          {pack.cards} Cards
        </Text>
      </View>

      <View className="p-3">
        <Text
          numberOfLines={2}
          className="font-sg-bold text-sm text-white"
        >
          {pack.name}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <Coins color="#ffffff" size={16} strokeWidth={2.5} />
            <Text className="font-sans-bold text-accent">{pack.price}</Text>
          </View>

          {owned ? (
            <View className="flex-row items-center gap-1 rounded-xl bg-secondary px-3 py-1.5">
              <Check color="#4ADE80" size={12} strokeWidth={3} />
              <Text className="text-[11px] font-sans-semibold text-white">
                Owned
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onBuy}
              disabled={purchasing}
            >
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF"]}
                className="min-w-11 items-center rounded-xl px-3 py-1.5"
              >
                {purchasing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-[11px] font-sans-semibold text-white">
                    Buy
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}