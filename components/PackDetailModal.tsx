import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Check, Coins, Layers, Wifi, X, Zap } from "lucide-react-native";
import { styled } from "nativewind";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CardPreviewCarousel, {
  PreviewCard,
} from "@/components/CardPreviewCarousel";

const LinearGradient = styled(RNLinearGradient);

export interface MarketplacePack {
  id: number;
  name: string;
  cards: number;
  price: number;
  emoji: string;
  tag?: string | null;
  category: string;
  colors: [string, string];
  image: any;
  description: string;
  truths: number;
  dares: number;
  previewCards: PreviewCard[];
}

interface PackDetailModalProps {
  visible: boolean;
  pack: MarketplacePack | null;
  onClose: () => void;
  onBuy: (pack: MarketplacePack) => void;
  owned: boolean;
  purchasing: boolean;
  tokenBalance: number;
}

const PERKS = [
  { icon: Zap, label: "Instant unlock to your library" },
  { icon: Wifi, label: "Play offline, anytime" },
  { icon: Layers, label: "Synced across all your devices" },
];

export default function PackDetailModal({
  visible,
  pack,
  onClose,
  onBuy,
  owned,
  purchasing,
  tokenBalance,
}: PackDetailModalProps) {
  const router = useRouter();

  if (!pack) return null;

  const insufficientFunds = !owned && tokenBalance < pack.price;

  const handleCtaPress = () => {
    if (owned) {
      onClose();
      return;
    }
    if (insufficientFunds) {
      onClose();
      router.push("/wallet/buy-token");
      return;
    }
    onBuy(pack);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          className="max-h-[88%] rounded-t-3xl bg-card"
          testID="pack-detail-sheet"
        >
          <View className="items-center pt-3">
            <View className="h-1.5 w-10 rounded-full bg-white/20" />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          >
            {/* Hero */}
            <View className="relative mt-4 h-40 overflow-hidden rounded-3xl">
              <Image
                source={pack.image}
                className="absolute inset-0 h-full w-full"
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                className="absolute inset-0"
              />

              <TouchableOpacity
                onPress={onClose}
                className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full bg-black/60"
              >
                <X color="#ffffff" size={16} strokeWidth={2.5} />
              </TouchableOpacity>

              <Text className="absolute left-4 top-3 text-4xl">
                {pack.emoji}
              </Text>

              {pack.tag && (
                <View className="absolute left-4 top-16 self-start rounded-full bg-black/60 px-2 py-1">
                  <Text className="text-[10px] font-sans-bold text-white">
                    {pack.tag}
                  </Text>
                </View>
              )}

              <Text className="absolute bottom-3 left-4 font-sg-extrabold text-2xl text-white">
                {pack.name}
              </Text>
            </View>

            <Text className="mt-4 text-sm leading-5 text-muted-foreground">
              {pack.description}
            </Text>

            {/* Stats */}
            <View className="mt-4 flex-row gap-2">
              <View className="flex-1 items-center rounded-2xl bg-secondary py-3">
                <Text className="font-sg-extrabold text-lg text-white">
                  {pack.cards}
                </Text>
                <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Cards
                </Text>
              </View>
              <View className="flex-1 items-center rounded-2xl bg-secondary py-3">
                <Text className="font-sg-extrabold text-lg text-accent">
                  {pack.truths}
                </Text>
                <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Truths
                </Text>
              </View>
              <View className="flex-1 items-center rounded-2xl bg-secondary py-3">
                <Text className="font-sg-extrabold text-lg text-primary">
                  {pack.dares}
                </Text>
                <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Dares
                </Text>
              </View>
            </View>

            {/* Preview */}
            <Text className="mb-3 mt-6 font-sg-bold text-base text-white">
              Preview a few cards
            </Text>
            <CardPreviewCarousel
              cards={pack.previewCards}
              colors={pack.colors}
              emoji={pack.emoji}
            />

            {/* Perks */}
            <View className="mt-6 gap-3">
              {PERKS.map(({ icon: Icon, label }) => (
                <View
                  key={label}
                  className="flex-row items-center gap-3"
                >
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Icon color="#D84CFF" size={15} strokeWidth={2.2} />
                  </View>
                  <Text className="flex-1 text-sm text-muted-foreground">
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer CTA */}
          <View className="border-t border-white/10 px-5 pb-8 pt-4">
            {insufficientFunds && (
              <Text className="mb-2 text-center text-xs font-sans-medium text-destructive">
                You need {pack.price - tokenBalance} more tokens
              </Text>
            )}

            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-1.5 rounded-full bg-secondary px-3 py-2">
                <Coins color="#FF8A2A" size={16} strokeWidth={2.5} />
                <Text className="font-sans-bold text-accent">
                  {pack.price}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleCtaPress}
                disabled={purchasing}
                style={{ flex: 1 }}
              >
                {owned ? (
                  <View className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-secondary">
                    <Check color="#4ADE80" size={16} strokeWidth={3} />
                    <Text className="font-sans-bold text-white">Owned</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={
                      insufficientFunds
                        ? ["#FF8A2A", "#D84CFF"]
                        : ["#7A1EFF", "#D84CFF", "#FF8A2A"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-12 flex-row items-center justify-center gap-2 rounded-2xl"
                  >
                    {purchasing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : insufficientFunds ? (
                      <Text className="font-sans-bold text-white">
                        Get more tokens
                      </Text>
                    ) : (
                      <Text className="font-sans-bold text-white">
                        Buy for {pack.price}
                      </Text>
                    )}
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
