import MyPartiesView from "@/components/MyPartiesView";
import PartyCard from "@/components/PartyCard";
import { useDiscoverFeed, useLikeParty, useUnlikeParty } from "@/hooks/api/useParties";
import { PartyDetail } from "@/lib/api/types";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import {
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  X
} from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

// "Tonight"/"Couples"/"Family"/"Teams"/"Wild" from the old mock had no real field to filter
// on (parties only carry freeform tags + a game_type slug, no fixed vibe taxonomy) — kept
// only the filters that map to a real, reliable field.
const FILTERS = ["For you", "Live now", "Sponsored", "Mine"] as const;
type Filter = (typeof FILTERS)[number];

const SEARCH_DEBOUNCE_MS = 350;

export default function DiscoverScreen() {
  const [filter, setFilter] = useState<Filter>("For you");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [likedOverrides, setLikedOverrides] = useState<Record<number, boolean>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [feedHeight, setFeedHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const isMine = filter === "Mine";

  const {
    parties,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscoverFeed({ search: debouncedQuery || undefined, enabled: !isMine });

  const visible = useMemo(() => {
    switch (filter) {
      case "Live now":
        return parties.filter((p) => p.status === "live");
      case "Sponsored":
        return parties.filter((p) => p.is_sponsored);
      default:
        return parties;
    }
  }, [parties, filter]);

  // "Live now"/"Sponsored" have no server-side query param — they filter whatever pages are
  // already loaded. If that filters down to zero, keep paging until a match turns up or the
  // feed genuinely ends, instead of showing "No parties match" while more pages are unread.
  useEffect(() => {
    if (isMine) return;
    if (!isLoading && !isError && visible.length === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isMine, visible.length, hasNextPage, isFetchingNextPage, isLoading, isError, fetchNextPage]);

  const likeParty = useLikeParty();
  const unlikeParty = useUnlikeParty();

  const isLiked = (party: PartyDetail) => likedOverrides[party.id] ?? party.liked_by_me;

  // Optimistic locally (the list cache isn't touched by the mutation itself — only the
  // single-party detail cache is), then reconciled with the server's actual liked_by_me, or
  // reverted if the request fails.
  const toggleLike = async (party: PartyDetail) => {
    const nextLiked = !isLiked(party);
    setLikedOverrides((s) => ({ ...s, [party.id]: nextLiked }));
    try {
      const updated = nextLiked
        ? await likeParty.mutateAsync(party.id)
        : await unlikeParty.mutateAsync(party.id);
      setLikedOverrides((s) => ({ ...s, [party.id]: updated.liked_by_me }));
    } catch {
      setLikedOverrides((s) => ({ ...s, [party.id]: !nextLiked }));
    }
  };

  // FlatList viewability tracking — replaces the web's onScroll handler
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIdx(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handleFeedLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (nextHeight > 0 && nextHeight !== feedHeight) setFeedHeight(nextHeight);
  };

  return (
    <View className="flex-1 bg-background" onLayout={handleFeedLayout}>
      {/* ── Feed ── */}
      {isMine ? (
        <MyPartiesView topInset={headerHeight} />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B03BFF" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-muted-foreground text-sm text-center">
            Couldn&apos;t load the discover feed.
          </Text>
          <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8}>
            <Text className="text-violet-bright text-sm font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : visible.length === 0 && hasNextPage ? (
        // Still paging through the feed looking for a match against the active filter.
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B03BFF" />
        </View>
      ) : visible.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Sparkles color="#D84CFF" size={40} strokeWidth={2} />
          <Text className="mt-3 text-foreground text-xl font-bold text-center">
            No parties match
          </Text>
          <Text className="mt-1 text-muted-foreground text-sm text-center">
            Try a different filter or clear your search.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item, index }) => (
            <PartyCard
              party={item}
              height={feedHeight}
              statusTop={headerHeight}
              active={index === activeIdx}
              liked={isLiked(item)}
              onLike={() => toggleLike(item)}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={feedHeight || undefined}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={feedHeight ? (_, index) => ({
            length: feedHeight,
            offset: feedHeight * index,
            index,
          }) : undefined}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ height: feedHeight }} className="items-center justify-center">
                <ActivityIndicator color="#B03BFF" />
              </View>
            ) : null
          }
        />
      )}

      {/* ── Top overlay: search + filters ── */}
      <LinearGradient
        colors={["#101015", "rgba(16,16,21,0.92)", "rgba(16,16,21,0.68)", "transparent"]}
        className="absolute inset-x-0 top-0"
        pointerEvents="box-none"
        onLayout={(event) => setHeaderHeight(Math.round(event.nativeEvent.layout.height))}
      >
        <SafeAreaView
          className="pb-5 pt-2"
          style={{ paddingHorizontal: 16 }}
          pointerEvents="box-none"
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-violet text-2xl font-bold tracking-tight">
              Discover
            </Text>
            {!isMine && (
              <View className="ml-1 rounded-full bg-white/10 px-2 py-0.5">
                <Text className="text-white/70 text-[10px] font-semibold">
                  {visible.length} {visible.length === 1 ? "party" : "parties"}
                </Text>
              </View>
            )}

            {!isMine && (
              <View className="ml-auto flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => setMuted((m) => !m)}
                  activeOpacity={0.8}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/10"
                >
                  {muted ? (
                    <VolumeX color="rgba(255,255,255,0.80)" size={16} strokeWidth={2} />
                  ) : (
                    <Volume2 color="rgba(255,255,255,0.80)" size={16} strokeWidth={2} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSearchOpen((s) => !s)}
                  activeOpacity={0.8}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/10"
                >
                  {searchOpen ? (
                    <X color="rgba(255,255,255,0.80)" size={16} strokeWidth={2} />
                  ) : (
                    <Search color="rgba(255,255,255,0.80)" size={16} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!isMine && searchOpen && (
            <View className="mt-3 flex-row items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-2.5">
              <Search color="rgba(255,255,255,0.60)" size={16} strokeWidth={2} />
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Search parties or hosts…"
                placeholderTextColor="rgba(255,255,255,0.40)"
                className="flex-1 text-white text-sm"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7}>
                  <X color="rgba(255,255,255,0.50)" size={16} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginTop: 12 }}
            contentContainerStyle={{ gap: 8, alignItems: "center", paddingRight: 24 }}
          >
            {FILTERS.map((f) => {
              const active = filter === f;
              return active ? (
                <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.85}>
                  <LinearGradient
                    colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-8 rounded-full px-3.5 items-center justify-center"
                  >
                    <Text className="text-white text-xs font-semibold">{f}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  activeOpacity={0.8}
                  className="h-8 rounded-full px-3.5 items-center justify-center bg-white/10 border border-white/10"
                >
                  <Text className="text-white/70 text-xs font-semibold">{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
