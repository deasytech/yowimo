import { GradientText } from "@/components/brand/GradientText";
import CrewOnline from "@/components/CrewOnline";
import { useHeaderHeight } from "@/components/Header";
import HeroCard from "@/components/HeroCard";
import QuickDeckCard from "@/components/QuickDeckCard";
import QuickDiscoverCard from "@/components/QuickDiscoverCard";
import ListHeading from "@/components/shared/ListHeading";
import { FRIENDS, QUICK_ACTIONS } from "@/data/mock";
import { useGameTypes } from "@/hooks/api/useGameTypes";
import { useDiscoverFeed } from "@/hooks/api/useParties";
import { posthog } from "@/lib/posthog";
import { useUser } from "@clerk/expo";
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { Link } from "expo-router";
import { styled } from "nativewind";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

// ─── Mock data fallbacks (remove if your mock exports are complete) ──────────
const _FRIENDS = (FRIENDS ?? []).filter((f: any) => f.online);

export default function HomeScreen() {
    const [cardWidth, setCardWidth] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useUser();
    const headerHeight = useHeaderHeight();
    const {
        data: gameTypes,
        isLoading: isLoadingGames,
        isError: isGamesError,
        error: gamesError,
        refetch: refetchGameTypes,
    } = useGameTypes();
    const _GAMES = (gameTypes ?? []).slice(0, 4);

    const {
        parties,
        isLoading: isLoadingParties,
        isError: isPartiesError,
        error: partiesError,
        refetch: refetchParties,
    } = useDiscoverFeed();
    // Live parties first, then whatever's scheduled next, matching what this rail is for.
    const _PARTIES = [...parties]
        .sort((a, b) => Number(b.status === "live") - Number(a.status === "live"))
        .slice(0, 6);

    const displayName = user?.firstName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User';

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([refetchGameTypes(), refetchParties()]);
        } finally {
            setRefreshing(false);
        }
    }, [refetchGameTypes, refetchParties]);

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 100, gap: 28 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#B03BFF"
                        colors={["#B03BFF"]}
                        progressBackgroundColor="#1c1c22"
                        // The floating blurred header overlays the very top of this ScrollView,
                        // so on Android the default (offset 0) spinner draws underneath it —
                        // push it down below the header instead. (iOS has no such prop; its
                        // spinner surfaces naturally once the pull passes the header's height.)
                        progressViewOffset={headerHeight}
                    />
                }
            >
                <View className="gap-1 pt-20">
                    <Text className="text-sm text-muted-foreground">Tonight, {displayName}</Text>
                    <View className="flex-row flex-wrap items-center gap-2">
                        <Text className="text-3xl font-sg-bold text-white">Ready for a</Text>
                        <GradientText className="text-3xl font-sg-bold">legendary</GradientText>
                        <Text className="text-3xl font-sg-bold text-white">session?</Text>
                    </View>
                </View>

                <HeroCard />

                <View className="flex-row justify-between">
                    {QUICK_ACTIONS.map(
                        ({ icon: Icon, label, href, colors }) => (
                            <Link
                                key={label}
                                href={href as any}
                                asChild
                                onPress={() => posthog.capture('quick_action_tapped', { label })}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    className="flex-1 items-center"
                                >
                                    <LinearGradient
                                        colors={colors}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        className="h-14 w-14 items-center justify-center rounded-2xl"
                                    >
                                        <Icon
                                            color="#fff"
                                            size={22}
                                            strokeWidth={2.4}
                                        />
                                    </LinearGradient>

                                    <Text className="mt-2 text-center text-[10px] font-sans-medium text-muted-foreground">
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        )
                    )}
                </View>

                <View style={{ gap: 12 }}>
                    <View>
                        <ListHeading title="Crew online" actionText="See all" link="/profile/friends" />
                        <FlatList
                            data={_FRIENDS}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginHorizontal: -20 }}
                            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
                            keyExtractor={(item, index) => item.id + index}
                            renderItem={({ item }) => <CrewOnline {...item} />}
                            ListEmptyComponent={<Text className="py-4 text-lg font-sans-medium text-white/60">No friends online</Text>}
                        />
                    </View>
                </View>

                <View>
                    <ListHeading iconSet={true} title="Live now" actionText="Discover" link="/discover" />
                    {isLoadingParties ? (
                        <ActivityIndicator color="#B03BFF" style={{ marginVertical: 16 }} />
                    ) : isPartiesError ? (
                        <View className="items-center gap-2 py-4">
                            <Text className="text-sm font-sans-medium text-white/60">
                                Couldn&apos;t load parties.
                            </Text>
                            <Text className="text-xs text-white/40 text-center px-6">
                                {partiesError instanceof Error ? partiesError.message : "Unknown error"}
                            </Text>
                            <TouchableOpacity onPress={() => refetchParties()} activeOpacity={0.8}>
                                <Text className="text-violet-bright text-sm font-sans-semibold">Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                    <FlatList
                        data={_PARTIES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginHorizontal: -20 }}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => <QuickDiscoverCard data={item} />}
                        ListEmptyComponent={<Text className="py-4 text-lg font-sans-medium text-white/60">No live parties right now</Text>}
                    />
                    )}
                </View>

                <View>
                    <ListHeading title="Pick your deck" actionText="All games" link="/play" />
                    {isLoadingGames ? (
                        <ActivityIndicator color="#B03BFF" style={{ marginVertical: 16 }} />
                    ) : isGamesError ? (
                        <View className="items-center gap-2 py-4">
                            <Text className="text-sm font-sans-medium text-white/60">
                                Couldn&apos;t load games.
                            </Text>
                            <Text className="text-xs text-white/40 text-center px-6">
                                {gamesError instanceof Error ? gamesError.message : "Unknown error"}
                            </Text>
                            <TouchableOpacity onPress={() => refetchGameTypes()} activeOpacity={0.8}>
                                <Text className="text-violet-bright text-sm font-sans-semibold">Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : _GAMES.length === 0 ? (
                        <Text className="py-4 text-sm font-sans-medium text-white/60">
                            No games available
                        </Text>
                    ) : (
                        <View
                            style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}
                            onLayout={(e) => setCardWidth((e.nativeEvent.layout.width - 12) / 2)}
                        >
                            {_GAMES.map((g) => {
                                const cardHeight = cardWidth * (4 / 3);

                                return (
                                    <QuickDeckCard
                                        key={g.id}
                                        game={g}
                                        width={cardWidth}
                                        height={cardHeight}
                                    />
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
