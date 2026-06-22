import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { useState } from "react";
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
import TokenBadge from "@/components/TokenBadge";
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

const packs = [
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
  },
];

export default function MarketplaceScreen() {
  const [selectedCategory, setSelectedCategory] =
    useState("Featured");

  const filteredPacks =
    selectedCategory === "Featured"
      ? packs
      : packs.filter(
          (pack) => pack.category === selectedCategory
        );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredPacks}
        numColumns={2}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={({ item }) => <MarketplaceCard pack={item} />}
        columnWrapperStyle={{
          justifyContent: "space-between",
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="mt-20">
              <Text className="font-sg-extrabold text-3xl text-white">
                Marketplace
              </Text>

              <Text className="mt-1 text-sm text-muted-foreground">
                Premium decks, drops &
                limited collabs.
              </Text>
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

                <TouchableOpacity className="rounded-2xl bg-white px-5 py-3">
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
    </SafeAreaView>
  );
}