import GoBack from "@/components/shared/GoBack";
import InlineRetry from "@/components/shared/InlineRetry";
import { useMySponsorships, useSponsorSummary } from "@/hooks/api/useSponsors";
import { SponsorshipStatus } from "@/lib/api/types";
import dayjs from "dayjs";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Coins, HeartHandshake, TrendingUp, Users } from "lucide-react-native";
import { styled } from "nativewind";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const STATUS_STYLE: Record<SponsorshipStatus, { label: string; bg: string; text: string }> = {
  paid: { label: "Paid", bg: "bg-emerald-500/20", text: "text-emerald-400" },
  pending: { label: "Pending", bg: "bg-accent/20", text: "text-accent" },
  cancelled: { label: "Refunded", bg: "bg-white/10", text: "text-muted-foreground" },
  expired: { label: "Expired", bg: "bg-white/10", text: "text-muted-foreground" },
};

export default function SponsorManagement() {
  const summary = useSponsorSummary();
  const {
    sponsorships,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMySponsorships();

  const stats = [
    { Icon: Users, value: summary.data?.players_covered, label: "Players" },
    { Icon: TrendingUp, value: summary.data?.parties_count, label: "Parties" },
    { Icon: Coins, value: summary.data?.tokens_spent, label: "Spent" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Sponsor Center" />

        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          className="mt-2 overflow-hidden rounded-3xl p-5"
        >
          <View className="flex-row items-center">
            <HeartHandshake size={18} color="#FFFFFF" />
            <Text className="ml-2 text-xs font-sans-semibold uppercase tracking-widest text-white/80">
              Your sponsorships
            </Text>
          </View>

          <View className="mt-5 flex-row justify-between">
            {stats.map((s) => (
              <View key={s.label} className="w-[31%] rounded-2xl border border-white/15 bg-white/10 p-3">
                {s.Icon && <s.Icon size={18} color="#FFFFFF" />}
                <Text className="mt-2 font-sg-extrabold text-2xl text-white">
                  {summary.isLoading ? "–" : (s.value ?? 0)}
                </Text>
                <Text className="text-[10px] uppercase tracking-wider text-white/70">{s.label}</Text>
              </View>
            ))}
          </View>
          {summary.isError && (
            <TouchableOpacity onPress={() => summary.refetch()} className="mt-3">
              <Text className="text-xs text-white/80">Couldn&apos;t load totals — tap to retry</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View className="mt-6">
          <Text className="mb-3 font-sg-bold text-lg text-white">Parties you&apos;ve sponsored</Text>

          {isLoading ? (
            <ActivityIndicator color="#B03BFF" style={{ marginVertical: 24 }} />
          ) : isError ? (
            <InlineRetry message="Couldn't load your sponsorships." onRetry={() => refetch()} />
          ) : sponsorships.length === 0 ? (
            <View className="items-center rounded-2xl border border-white/10 bg-card p-6">
              <Text className="text-sm text-muted-foreground text-center">
                No sponsorships yet. When a friend sends you a sponsor link, the parties you pay
                for show up here.
              </Text>
            </View>
          ) : (
            sponsorships.map((item) => {
              const style = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/lobby/${item.party.id}`)}
                  activeOpacity={0.85}
                  className="mb-3 flex-row items-center rounded-2xl border border-white/10 bg-card p-3"
                >
                  <LinearGradient
                    colors={["#7A1EFF", "#D84CFF"]}
                    className="h-11 w-11 items-center justify-center rounded-full"
                  >
                    <Text className="font-sans-bold text-white">
                      {item.party.title.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>

                  <View className="ml-3 flex-1">
                    <Text numberOfLines={1} className="font-sans-semibold text-sm text-white">
                      {item.party.title}
                    </Text>
                    <Text className="mt-1 text-xs text-muted-foreground">
                      {item.tokens_spent} 🪙 · {item.covered_guest_count} guest
                      {item.covered_guest_count === 1 ? "" : "s"} covered
                      {item.paid_at ? ` · ${dayjs(item.paid_at).format("MMM D")}` : ""}
                    </Text>
                  </View>

                  <View className={`rounded-full px-3 py-1 ${style.bg}`}>
                    <Text className={`text-[10px] font-sans-semibold ${style.text}`}>{style.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {hasNextPage && (
            <TouchableOpacity onPress={() => fetchNextPage()} disabled={isFetchingNextPage} className="py-2">
              <Text className="text-center text-sm font-sans-semibold text-violet-bright">
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity activeOpacity={0.9} className="mt-6" onPress={() => router.push("/wallet/buy-token")}>
          <LinearGradient colors={["#7A1EFF", "#D84CFF"]} className="items-center rounded-2xl py-4">
            <Text className="font-sans-bold text-base text-white">Top Up Tokens</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
