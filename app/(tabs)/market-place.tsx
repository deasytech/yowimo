import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { PackageSearch } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

import MarketplaceCard from "@/components/MarketPlaceCard";
import MarketplaceCardSkeleton from "@/components/MarketplaceCardSkeleton";
import PackDetailModal from "@/components/PackDetailModal";
import Toast from "@/components/shared/Toast";
import TokenBadge from "@/components/TokenBadge";
import { useFeaturedPacks, usePacks, usePurchasePack } from "@/hooks/api/usePacks";
import { useWallet } from "@/hooks/api/useWallet";
import { useToast } from "@/hooks/useToast";
import { newIdempotencyKey } from "@/lib/api/idempotency";
import { ApiError, PackCategory, PackResource } from "@/lib/api/types";
import { styled } from "nativewind";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const CATEGORY_LABELS = [
  "Featured",
  "Spicy",
  "Couples",
  "Family",
  "Corporate",
  "Limited",
] as const;
type CategoryLabel = (typeof CATEGORY_LABELS)[number];

// "Featured" here means "no filter, show the whole catalog" — matching this screen's
// pre-existing tab behavior. The API's own notion of featured only drives the hero banner.
const CATEGORY_TO_API: Partial<Record<CategoryLabel, PackCategory>> = {
  Spicy: "spicy",
  Couples: "couples",
  Family: "family",
  Corporate: "corporate",
  Limited: "limited",
};

export default function MarketplaceScreen() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryLabel>("Featured");
  const apiCategory = CATEGORY_TO_API[selectedCategory];

  const {
    packs,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePacks(apiCategory);
  const { data: featuredPacks } = useFeaturedPacks();
  const heroPack = featuredPacks?.[0] ?? null;
  const { data: wallet } = useWallet();
  // Undefined (not 0) until the real balance loads, so a purchase attempted before it
  // resolves isn't wrongly blocked by a "not enough tokens" check against a fake zero.
  const tokenBalance = wallet?.balance;

  const [detailPackId, setDetailPackId] = useState<number | null>(null);
  // `owned_by_me` on the list/featured/detail resources is the source of truth. This just
  // covers the gap between a successful purchase and that query settling back to true —
  // cleared once the pack shows up owned from the server (see the effect below).
  const [ownedPackIds, setOwnedPackIds] = useState<Set<number>>(new Set());
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  // One key per pack, reused across retries of the same purchase attempt so a flaky
  // connection can't double-charge the player — cleared once that attempt resolves.
  const idempotencyKeys = useRef<Map<number, string>>(new Map());
  const purchaseMutation = usePurchasePack();

  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  const getIdempotencyKey = (packId: number) => {
    let key = idempotencyKeys.current.get(packId);
    if (!key) {
      key = newIdempotencyKey();
      idempotencyKeys.current.set(packId, key);
    }
    return key;
  };

  const buyPack = async (pack: PackResource) => {
    if (ownedPackIds.has(pack.id) || purchasingId !== null) return;

    if (typeof tokenBalance === "number" && pack.price > tokenBalance) {
      notify(`Not enough tokens — you need ${pack.price - tokenBalance} more`, "error");
      return;
    }

    setPurchasingId(pack.id);
    try {
      await purchaseMutation.mutateAsync({
        packId: pack.id,
        idempotencyKey: getIdempotencyKey(pack.id),
      });
      idempotencyKeys.current.delete(pack.id);
      setOwnedPackIds((prev) => new Set(prev).add(pack.id));
      notify(`${pack.name} unlocked!`, "success");
      setDetailPackId(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Our idempotency key is unique per pack, so a 409 here means "already owned" —
        // treat it as success so a stale grid can self-heal instead of showing an error.
        idempotencyKeys.current.delete(pack.id);
        setOwnedPackIds((prev) => new Set(prev).add(pack.id));
        notify(err.message || `${pack.name} is already unlocked`, "success");
      } else {
        const message = err instanceof ApiError ? err.message : "Purchase failed — please try again";
        notify(message, "error");
      }
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Toast
        opacity={toast.opacity}
        isVisible={toast.isVisible}
        message={toastMessage}
        bgClass={toastBg}
      />

      <FlatList
        data={isLoading ? Array.from({ length: 6 }) : packs}
        numColumns={2}
        keyExtractor={(item, index) =>
          isLoading ? `skeleton-${index}` : (item as PackResource).id.toString()
        }
        renderItem={({ item }) =>
          isLoading ? (
            <MarketplaceCardSkeleton />
          ) : (
            <MarketplaceCard
              pack={item as PackResource}
              owned={(item as PackResource).owned_by_me || ownedPackIds.has((item as PackResource).id)}
              purchasing={purchasingId === (item as PackResource).id}
              onPress={() => setDetailPackId((item as PackResource).id)}
              onBuy={() => buyPack(item as PackResource)}
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
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#B03BFF" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? null : isError ? (
            <View className="mt-10 items-center gap-3 px-6 py-10">
              <Text className="text-center text-sm text-muted-foreground">
                Couldn&apos;t load packs.
              </Text>
              <Text className="text-center text-xs text-muted-foreground/70">
                {error instanceof Error ? error.message : "Unknown error"}
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                activeOpacity={0.85}
                className="mt-1 rounded-full bg-secondary px-4 py-2"
              >
                <Text className="text-xs font-sans-semibold text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
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

                <TokenBadge amount={tokenBalance ?? 0} size="sm" />
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
              {CATEGORY_LABELS.map((category) => (
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
            {heroPack && (
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
                  {heroPack.name}
                </Text>

                <Text className="mt-1 text-sm text-white/85">
                  {heroPack.cards_count} Cards
                  {heroPack.tag ? ` • ${heroPack.tag}` : ""}
                </Text>

                <View className="mt-5 flex-row items-center justify-between">
                  <TokenBadge amount={heroPack.price} />

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setDetailPackId(heroPack.id)}
                    className="rounded-2xl bg-white px-5 py-3"
                  >
                    <Text className="font-sans-semibold text-background">
                      Preview
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            )}

            <View className="h-5" />
          </>
        }
      />

      <PackDetailModal
        visible={detailPackId !== null}
        packId={detailPackId}
        onClose={() => setDetailPackId(null)}
        onBuy={buyPack}
        ownedOverride={detailPackId !== null && ownedPackIds.has(detailPackId)}
        purchasing={detailPackId !== null && purchasingId === detailPackId}
        tokenBalance={tokenBalance}
      />
    </SafeAreaView>
  );
}
