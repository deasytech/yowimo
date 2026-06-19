import { posthog } from "@/lib/posthog";
import { GradientText } from "@/components/brand/GradientText";
import CrewOnline from "@/components/CrewOnline";
import HeroCard from "@/components/HeroCard";
import ListHeading from "@/components/ListHeading";
import QuickDeckCard from "@/components/QuickDeckCard";
import QuickDiscoverCard from "@/components/QuickDiscoverCard";
import { FRIENDS, GAME_TYPES, PARTIES, QUICK_ACTIONS } from "@/data/mock";
import { useUser } from "@clerk/expo";
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { Link } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import { FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

// ─── Mock data fallbacks (remove if your mock exports are complete) ──────────
const _FRIENDS = (FRIENDS ?? []).filter((f: any) => f.online);
const _PARTIES = (PARTIES ?? []).filter((p: any) => p.isLive).concat((PARTIES ?? []).slice(0, 2));
const _GAMES = (GAME_TYPES ?? []).slice(0, 4);

export default function HomeScreen() {
    const [cardWidth, setCardWidth] = useState(0);
    const { user } = useUser();

    const displayName = user?.firstName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User';

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 100, gap: 28 }}
                showsVerticalScrollIndicator={false}
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
                        <ListHeading title="Crew online" actionText="See all" />
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
                    <ListHeading iconSet={true} title="Live now" actionText="Discover" />
                    <FlatList
                        data={_PARTIES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginHorizontal: -20 }}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
                        keyExtractor={(item, index) => item.id + index}
                        renderItem={({ item }) => <QuickDiscoverCard data={item} />}
                        ListEmptyComponent={<Text className="py-4 text-lg font-sans-medium text-white/60">No Live Party</Text>}
                    />
                </View>

                <View>
                    <ListHeading title="Pick your deck" actionText="All games" />
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
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
