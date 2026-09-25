import GoBack from "@/components/shared/GoBack";
import { useWallet, useWalletTransactions } from "@/hooks/api/useWallet";
import { WalletTransactionResource } from "@/lib/api/types";
import { formatDayLabel, walletTransactionTypeLabel } from "@/lib/utils";
import dayjs from "dayjs";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Search,
  X,
} from "lucide-react-native";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const filters = ["All", "In", "Out"] as const;
type Filter = (typeof filters)[number];

export default function TransactionHistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const { data: wallet } = useWallet();
  const {
    transactions,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWalletTransactions();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      if (selectedFilter === "In" && item.amount <= 0) return false;
      if (selectedFilter === "Out" && item.amount >= 0) return false;

      return item.description.toLowerCase().includes(query.toLowerCase());
    });
  }, [transactions, selectedFilter, query]);

  const groupedSections = useMemo(() => {
    const groups: { title: string; data: WalletTransactionResource[] }[] = [];

    filteredTransactions.forEach((transaction) => {
      const label = formatDayLabel(transaction.created_at);
      const currentGroup = groups.at(-1);

      if (currentGroup?.title === label) {
        currentGroup.data.push(transaction);
      } else {
        groups.push({ title: label, data: [transaction] });
      }
    });

    return groups;
  }, [filteredTransactions]);

  return (
    <SafeAreaView
      className="flex-1 bg-background"
    >
      <SectionList
        sections={groupedSections}
        keyExtractor={(item) => item.id.toString()}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
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
        ListHeaderComponent={
          <>
            <GoBack title="Transactions" />

            <LinearGradient
              colors={["#FFD66B", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="relative mt-4 overflow-hidden rounded-3xl p-5"
            >
              <View
                className="absolute rounded-full bg-white/20"
                style={{ height: 140, right: -48, top: -58, width: 140 }}
              />

              <Text
                className="text-xs font-sans-bold uppercase text-ink/60"
                style={{ letterSpacing: 1 }}
              >
                Token balance
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Text className="font-sg-extrabold text-4xl text-ink">
                  {(wallet?.balance ?? 0).toLocaleString()}
                </Text>
                <Coins color="#1E1E24" size={30} strokeWidth={2.5} />
              </View>
            </LinearGradient>

            {/* Search */}
            <View className="my-5 h-12 flex-row items-center rounded-2xl border border-white/10 bg-secondary px-4">
              <Search size={17} color="#A3A3AB" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search transactions"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="ml-3 h-12 flex-1 text-sm text-white"
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQuery("")}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  className="h-8 w-8 items-center justify-center rounded-full bg-white/5"
                >
                  <X size={15} color="#A3A3AB" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filters */}
            <View className="mb-2 flex-row gap-2">
              {filters.map((filter) => {
                const active = selectedFilter === filter;

                return (
                  <TouchableOpacity
                    key={filter}
                    activeOpacity={0.8}
                    onPress={() => setSelectedFilter(filter)}
                    className={`rounded-full border px-4 py-2 ${active
                      ? "bg-primary"
                      : "border-white/10 bg-secondary"
                      }`}
                  >
                    <Text
                      className={`text-xs font-sans-semibold ${active
                        ? "text-white"
                        : "text-muted-foreground"
                        }`}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isLoading && (
              <View className="items-center py-10">
                <ActivityIndicator color="#B03BFF" />
              </View>
            )}

            {isError && (
              <View className="items-center gap-3 py-10">
                <Text className="text-center text-sm text-muted-foreground">
                  Couldn&apos;t load transactions.
                </Text>
                <Text className="text-center text-xs text-muted-foreground/70">
                  {error instanceof Error ? error.message : "Unknown error"}
                </Text>
                <TouchableOpacity onPress={() => refetch()} activeOpacity={0.85}>
                  <Text className="text-xs font-sans-semibold text-violet-bright">Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderSectionHeader={({ section }) => (
          <Text
            className="mb-2 mt-4 px-1 text-[11px] font-sans-bold uppercase text-muted-foreground"
            style={{ letterSpacing: 0.8 }}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="mb-2 flex-row items-center rounded-2xl border border-white/10 bg-card p-4">
            <View
              className={`h-11 w-11 items-center justify-center rounded-full ${item.amount > 0
                ? "bg-emerald-500/15"
                : "bg-orange/15"
                }`}
            >
              {item.amount > 0 ? (
                <ArrowDownLeft size={18} color="#34D399" strokeWidth={2.2} />
              ) : (
                <ArrowUpRight size={18} color="#FF8A2A" strokeWidth={2.2} />
              )}
            </View>

            <View className="ml-3 min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className="text-sm font-sans-semibold text-white"
              >
                {item.description}
              </Text>
              <Text
                numberOfLines={1}
                className="mt-0.5 text-[11px] text-muted-foreground"
              >
                {walletTransactionTypeLabel(item.type)} · {dayjs(item.created_at).format("HH:mm")}
              </Text>
            </View>

            <View className="ml-3 items-end">
              <Text
                className={`font-sans-bold text-base ${item.amount > 0
                  ? "text-emerald-400"
                  : "text-white"
                  }`}
              >
                {item.amount > 0 ? "+" : ""}
                {item.amount}
              </Text>
              <Text className="mt-0.5 text-[10px] uppercase text-muted-foreground">
                Tokens
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading && !isError ? (
            <View className="items-center py-16">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <Search size={22} color="#A3A3AB" />
              </View>
              <Text className="mt-4 font-sans-semibold text-sm text-white">
                No transactions found
              </Text>
              <Text className="mt-1 text-center text-xs text-muted-foreground">
                Try another search or filter.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
