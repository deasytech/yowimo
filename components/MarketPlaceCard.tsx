import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Coins } from "lucide-react-native";
import { styled } from "nativewind";
import { Image, Text, TouchableOpacity, View } from "react-native";

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
  };
  onBuy?: () => void;
}

export default function MarketplaceCard({
  pack,
  onBuy,
}: MarketplaceCardProps) {
  return (
    <View className="mb-4 w-[48%] overflow-hidden rounded-3xl border border-white/10 bg-card">
      <View className="relative h-32 overflow-hidden">
        <Image
          source={pack.image}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />

        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,0.75)",
          ]}
          className="absolute inset-0"
        />

        {pack.tag && (
          <View className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1">
            <Text className="text-[10px] font-sans-bold text-white">
              {pack.tag}
            </Text>
          </View>
        )}

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

          <TouchableOpacity activeOpacity={0.9} onPress={onBuy}>
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF"]}
              className="rounded-xl px-3 py-1.5"
            >
              <Text className="text-[11px] font-sans-semibold text-white">
                Buy
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}