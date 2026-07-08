import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { PackageSearch } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

import packCouplesDeluxe from "@/assets/images/pack-couples-deluxe.jpg";
import packFamilyMovie from "@/assets/images/pack-family-movie.jpg";
import packMidnightSpice from "@/assets/images/pack-midnight-spice.jpg";
import packOfficeIcebreakers from "@/assets/images/pack-office-icebreakers.jpg";
import packTruthBombs from "@/assets/images/pack-truth-bombs.jpg";
import packWildCard from "@/assets/images/pack-wild-card.jpg";
import MarketplaceCard from "@/components/MarketPlaceCard";
import PackDetailModal, {
  MarketplacePack,
} from "@/components/PackDetailModal";
import MarketplaceCardSkeleton from "@/components/MarketplaceCardSkeleton";
import Toast from "@/components/shared/Toast";
import TokenBadge from "@/components/TokenBadge";
import { useToast } from "@/hooks/useToast";
import { styled } from "nativewind";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const categories = [
  "Featured",
  "Spicy",
  "Couples",
  "Family",
  "Corporate",
  "Limited",
];

const STARTING_TOKEN_BALANCE = 180;
const PURCHASE_FAILURE_RATE = 0.15;
const SIMULATED_LATENCY_MS = 1100;

const packs: MarketplacePack[] = [
  {
    id: 1,
    name: "Midnight Spice",
    cards: 60,
    price: 120,
    emoji: "🌶️",
    tag: "Limited",
    category: "Limited",
    colors: ["#D84CFF", "#FF8A2A"],
    image: packMidnightSpice,
    description:
      "Turn up the heat with confessions, dares, and spicy hypotheticals built for couples who want the temperature to rise fast.",
    truths: 30,
    dares: 30,
    previewCards: [
      { id: 1, kind: "truth", text: "What's the boldest thing you've ever wanted to try but haven't asked for?" },
      { id: 2, kind: "dare", text: "Whisper your partner's name the way you'd say it in your favorite fantasy." },
      { id: 3, kind: "truth", text: "On a scale of 1-10, how adventurous are you really?" },
      { id: 4, kind: "dare", text: "Trade one item of clothing with the player to your left." },
    ],
  },
  {
    id: 2,
    name: "Couples Deluxe",
    cards: 80,
    price: 200,
    emoji: "💞",
    tag: "Hot",
    category: "Couples",
    colors: ["#7A1EFF", "#D84CFF"],
    image: packCouplesDeluxe,
    description:
      "A full night of connection games — from sweet confessions to playful dares designed to bring you closer.",
    truths: 45,
    dares: 35,
    previewCards: [
      { id: 1, kind: "truth", text: "What's a small thing I do that makes you feel loved?" },
      { id: 2, kind: "dare", text: "Recreate your first date together in under 30 seconds." },
      { id: 3, kind: "truth", text: "What's one thing you wish we did more of together?" },
      { id: 4, kind: "dare", text: "Give your partner a 20-second compliment without repeating a word." },
    ],
  },
  {
    id: 3,
    name: "Family Movie Night",
    cards: 50,
    price: 80,
    emoji: "🍿",
    tag: null,
    category: "Family",
    colors: ["#FF8A2A", "#7A1EFF"],
    image: packFamilyMovie,
    description:
      "Trivia, would-you-rathers, and silly challenges the whole family can play between movie scenes.",
    truths: 25,
    dares: 25,
    previewCards: [
      { id: 1, kind: "truth", text: "What's the last movie that made you cry (even a little)?" },
      { id: 2, kind: "dare", text: "Do your best impression of a movie villain for 10 seconds." },
      { id: 3, kind: "truth", text: "If you could live inside one movie, which one and why?" },
      { id: 4, kind: "dare", text: "Act out your favorite movie scene using only gestures." },
    ],
  },
  {
    id: 4,
    name: "Office Icebreakers",
    cards: 40,
    price: 60,
    emoji: "💼",
    tag: "Corporate",
    category: "Corporate",
    colors: ["#2D2A8F", "#B03BFF"],
    image: packOfficeIcebreakers,
    description:
      "Low-pressure prompts and light challenges that get a team laughing before the real meeting starts.",
    truths: 22,
    dares: 18,
    previewCards: [
      { id: 1, kind: "truth", text: "What's the most useless skill you're weirdly proud of?" },
      { id: 2, kind: "dare", text: "Describe your most embarrassing childhood photo in vivid detail." },
      { id: 3, kind: "truth", text: "What's one app you'd be lost without at work?" },
      { id: 4, kind: "dare", text: "Give a 10-second elevator pitch for a completely made-up product." },
    ],
  },
  {
    id: 5,
    name: "Wild Card Vol. 3",
    cards: 100,
    price: 250,
    emoji: "🃏",
    tag: "New",
    category: "Spicy",
    colors: ["#B03BFF", "#FF8A2A"],
    image: packWildCard,
    description:
      "Unpredictable, chaotic, and a little unhinged — this deck mixes every category so no two rounds feel the same.",
    truths: 50,
    dares: 50,
    previewCards: [
      { id: 1, kind: "dare", text: "Speak only in movie quotes for the next two rounds." },
      { id: 2, kind: "truth", text: "What's the weirdest rumor you've ever heard about yourself?" },
      { id: 3, kind: "dare", text: "Let the group pick your profile picture for the next 24 hours." },
      { id: 4, kind: "truth", text: "What's a decision you made that surprised everyone, including you?" },
    ],
  },
  {
    id: 6,
    name: "Truth Bombs",
    cards: 70,
    price: 150,
    emoji: "💣",
    tag: null,
    category: "Spicy",
    colors: ["#D84CFF", "#7A1EFF"],
    image: packTruthBombs,
    description:
      "Deep-cut confessions and no-filter questions for players who are ready to get real.",
    truths: 60,
    dares: 10,
    previewCards: [
      { id: 1, kind: "truth", text: "What's something you've never told anyone in this room?" },
      { id: 2, kind: "truth", text: "What's the biggest lie you've told to keep the peace?" },
      { id: 3, kind: "dare", text: "Text the last person you called and say 'I was just thinking about you.'" },
      { id: 4, kind: "truth", text: "What's a compliment you wish you'd given someone sooner?" },
    ],
  },
];

const featuredPack: MarketplacePack = {
  id: 999,
  name: "Neon Confessions",
  cards: 120,
  price: 300,
  emoji: "💫",
  tag: "Drop of the Week",
  category: "Limited",
  colors: ["#7A1EFF", "#FF8A2A"],
  image: packWildCard,
  description:
    "This week's exclusive drop — neon-lit confessions, blackout dares, and prompts that only surface for 48 hours.",
  truths: 70,
  dares: 50,
  previewCards: [
    { id: 1, kind: "truth", text: "What's a secret you'd only share under neon lights?" },
    { id: 2, kind: "dare", text: "Send a voice note singing the chorus of your most-played song." },
    { id: 3, kind: "truth", text: "What's the last confession that changed how someone saw you?" },
    { id: 4, kind: "dare", text: "Let the group caption your last photo — no vetoes." },
  ],
};

function simulatePurchase(): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < PURCHASE_FAILURE_RATE) {
        reject(new Error("purchase_failed"));
      } else {
        resolve();
      }
    }, SIMULATED_LATENCY_MS);
  });
}

export default function MarketplaceScreen() {
  const [selectedCategory, setSelectedCategory] =
    useState("Featured");
  const [isLoading, setIsLoading] = useState(true);
  const [detailPack, setDetailPack] = useState<MarketplacePack | null>(null);
  const [ownedPacks, setOwnedPacks] = useState<Set<number>>(new Set());
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState(STARTING_TOKEN_BALANCE);

  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();
  const warnedImageIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  const handleImageError = (packId: number) => {
    if (warnedImageIds.current.has(packId)) return;
    warnedImageIds.current.add(packId);
    notify("Some pack images failed to load", "error");
  };

  const buyPack = async (pack: MarketplacePack) => {
    if (ownedPacks.has(pack.id) || purchasingId !== null) return;

    if (pack.price > tokenBalance) {
      notify(
        `Not enough tokens — you need ${pack.price - tokenBalance} more`,
        "error"
      );
      return;
    }

    setPurchasingId(pack.id);
    try {
      await simulatePurchase();
      setTokenBalance((balance) => balance - pack.price);
      setOwnedPacks((prev) => new Set(prev).add(pack.id));
      notify(`${pack.name} unlocked!`, "success");
      setDetailPack(null);
    } catch {
      notify("Purchase failed — please try again", "error");
    } finally {
      setPurchasingId(null);
    }
  };

  const filteredPacks =
    selectedCategory === "Featured"
      ? packs
      : packs.filter(
          (pack) => pack.category === selectedCategory
        );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Toast
        opacity={toast.opacity}
        isVisible={toast.isVisible}
        message={toastMessage}
        bgClass={toastBg}
      />

      <FlatList
        data={isLoading ? Array.from({ length: 6 }) : filteredPacks}
        numColumns={2}
        keyExtractor={(item, index) =>
          isLoading ? `skeleton-${index}` : (item as MarketplacePack).id.toString()
        }
        renderItem={({ item }) =>
          isLoading ? (
            <MarketplaceCardSkeleton />
          ) : (
            <MarketplaceCard
              pack={item as MarketplacePack}
              owned={ownedPacks.has((item as MarketplacePack).id)}
              purchasing={purchasingId === (item as MarketplacePack).id}
              onPress={() => setDetailPack(item as MarketplacePack)}
              onBuy={() => buyPack(item as MarketplacePack)}
              onImageError={() => handleImageError((item as MarketplacePack).id)}
            />
          )
        }
        columnWrapperStyle={{
          justifyContent: "space-between",
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <View className="mt-10 items-center px-6 py-10">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <PackageSearch color="#a3a3ab" size={26} strokeWidth={1.8} />
              </View>
              <Text className="mt-4 text-center font-sg-bold text-base text-white">
                No packs in {selectedCategory}
              </Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Try another category or check back soon for new drops.
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedCategory("Featured")}
                activeOpacity={0.85}
                className="mt-4 rounded-full bg-secondary px-4 py-2"
              >
                <Text className="text-xs font-sans-semibold text-white">
                  Show Featured
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="mt-20">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-sg-extrabold text-3xl text-white">
                    Marketplace
                  </Text>

                  <Text className="mt-1 text-sm text-muted-foreground">
                    Premium decks, drops &
                    limited collabs.
                  </Text>
                </View>

                <TokenBadge amount={tokenBalance} size="sm" />
              </View>
            </View>

            {/* Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              className="mt-5"
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                  className={`mr-2 rounded-full px-4 py-2 ${selectedCategory ===
                    category
                    ? "bg-primary"
                    : "bg-secondary"
                    }`}
                >
                  <Text
                    className={`text-xs font-sans-semibold ${selectedCategory ===
                      category
                      ? "text-white"
                      : "text-muted-foreground"
                      }`}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Hero Banner */}
            <LinearGradient
              colors={[
                "#7A1EFF",
                "#D84CFF",
                "#FF8A2A",
              ]}
              className="mt-5 rounded-3xl p-5"
            >
              <View className="self-start rounded-full bg-white/20 px-2 py-1">
                <Text className="text-[10px] font-sans-bold uppercase tracking-wider text-white">
                  🔥 Drop of the Week
                </Text>
              </View>

              <Text className="mt-3 font-sg-extrabold text-3xl text-white">
                Neon Confessions
              </Text>

              <Text className="mt-1 text-sm text-white/85">
                120 Cards • Limited 48h
              </Text>

              <View className="mt-5 flex-row items-center justify-between">
                <TokenBadge amount={300} />

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setDetailPack(featuredPack)}
                  className="rounded-2xl bg-white px-5 py-3"
                >
                  <Text className="font-sans-semibold text-background">
                    Preview
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View className="h-5" />
          </>
        }
      />

      <PackDetailModal
        visible={detailPack !== null}
        pack={detailPack}
        onClose={() => setDetailPack(null)}
        onBuy={buyPack}
        owned={detailPack !== null && ownedPacks.has(detailPack.id)}
        purchasing={detailPack !== null && purchasingId === detailPack.id}
        tokenBalance={tokenBalance}
      />
    </SafeAreaView>
  );
}
