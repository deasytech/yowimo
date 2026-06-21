import PartyCard from "@/components/PartyCard";
import { PARTIES } from "@/data/mock";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import {
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  X
} from "lucide-react-native";
import { styled } from "nativewind";
import { useMemo, useRef, useState } from "react";
import {
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

const FILTERS = [
  "For you",
  "Live now",
  "Tonight",
  "Couples",
  "Family",
  "Teams",
  "Sponsored",
  "Wild",
];

// Expand the mock feed so the swipe experience feels rich
const FEED: PartyProps[] = Array.from({ length: 3 }).flatMap((_, i) =>
  PARTIES.map((p) => ({ ...p, id: `${p.id}-${i}` }))
);

export default function DiscoverScreen() {
  const [filter, setFilter] = useState("For you");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [feedHeight, setFeedHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FEED.filter((p) => {
      if (
        q &&
        !`${p.title} ${p.host} ${p.type} ${p.tags.join(" ")}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      switch (filter) {
        case "Live now":
          return !!p.isLive;
        case "Tonight":
          return (
            p.startsIn.toLowerCase().includes("live") ||
            p.startsIn.includes("m") ||
            p.startsIn.includes("h")
          );
        case "Couples":
          return p.tags.includes("Couples") || p.type.includes("Couple");
        case "Family":
          return (
            p.type.toLowerCase().includes("family") || p.tags.includes("Family")
          );
        case "Teams":
          return p.tags.includes("Teams") || p.type.includes("Corporate");
        case "Sponsored":
          return !!p.sponsored;
        case "Wild":
          return p.tags.includes("Spicy") || p.type.includes("Wild");
        default:
          return true;
      }
    });
  }, [filter, query]);

  const toggleLike = (id: string) =>
    setLiked((s) => ({ ...s, [id]: !s[id] }));

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
      {visible.length === 0 ? (
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
          keyExtractor={(p) => p.id}
          renderItem={({ item, index }) => (
            <PartyCard
              party={item}
              height={feedHeight}
              statusTop={headerHeight}
              active={index === activeIdx}
              liked={!!liked[item.id]}
              onLike={() => toggleLike(item.id)}
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
            <View className="ml-1 rounded-full bg-white/10 px-2 py-0.5">
              <Text className="text-white/70 text-[10px] font-semibold">
                {visible.length} live
              </Text>
            </View>

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
          </View>

          {searchOpen && (
            <View className="mt-3 flex-row items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-2.5">
              <Search color="rgba(255,255,255,0.60)" size={16} strokeWidth={2} />
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Search parties, hosts, vibes…"
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
