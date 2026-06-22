import GoBack from "@/components/shared/GoBack";
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
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const transactions = [
  {
    id: 1,
    type: "in",
    title: "Welcome Bonus",
    sub: "Signup Gift",
    amount: 10,
    date: "Today · 9:12",
  },
  {
    id: 2,
    type: "out",
    title: "Hot Seat Entry",
    sub: "Friday Night Chaos",
    amount: -10,
    date: "Today · 10:04",
  },
  {
    id: 3,
    type: "in",
    title: "MVP Reward",
    sub: "Couples Game Night",
    amount: 25,
    date: "Yesterday · 23:51",
  },
  {
    id: 4,
    type: "out",
    title: "Spicy Pack",
    sub: "Marketplace",
    amount: -120,
    date: "May 28",
  },
  {
    id: 5,
    type: "in",
    title: "Referral Bonus",
    sub: "Maya Joined",
    amount: 50,
    date: "May 27",
  },
  {
    id: 6,
    type: "in",
    title: "Sponsored By Acme",
    sub: "Acme Quarterly",
    amount: 15,
    date: "May 25",
  },
];

const filters = ["All", "In", "Out", "Sponsored"];
const totalReceived = transactions.reduce(
  (total, transaction) => total + Math.max(transaction.amount, 0),
  0,
);
const totalSpent = transactions.reduce(
  (total, transaction) => total + Math.abs(Math.min(transaction.amount, 0)),
  0,
);

export default function TransactionHistoryScreen() {
  const [selectedFilter, setSelectedFilter] =
    useState("All");

  const [query, setQuery] = useState("");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      if (
        selectedFilter === "In" &&
        item.type !== "in"
      )
        return false;

      if (
        selectedFilter === "Out" &&
        item.type !== "out"
      )
        return false;

      if (
        selectedFilter === "Sponsored" &&
        !item.sub.includes("Acme")
      )
        return false;

      return (
        item.title
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        item.sub
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    });
  }, [selectedFilter, query]);

  const groupedTransactions = useMemo(() => {
    const groups: {
      label: string;
      items: typeof transactions;
    }[] = [];

    filteredTransactions.forEach((transaction) => {
      const label = transaction.date.split(" · ")[0];
      const currentGroup = groups.at(-1);

      if (currentGroup?.label === label) {
        currentGroup.items.push(transaction);
      } else {
        groups.push({ label, items: [transaction] });
      }
    });

    return groups;
  }, [filteredTransactions]);

  return (
    <SafeAreaView
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      >
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
            <Text className="font-sg-extrabold text-4xl text-ink">245</Text>
            <Coins color="#1E1E24" size={30} strokeWidth={2.5} />
          </View>

          <View className="mt-4 flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-white/25 px-3 py-2.5">
              <Text className="text-[10px] font-sans-bold uppercase text-ink/50">
                Money in
              </Text>
              <Text className="mt-0.5 font-sans-bold text-sm text-ink">
                +{totalReceived} tokens
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-ink/10 px-3 py-2.5">
              <Text className="text-[10px] font-sans-bold uppercase text-ink/50">
                Money out
              </Text>
              <Text className="mt-0.5 font-sans-bold text-sm text-ink">
                -{totalSpent} tokens
              </Text>
            </View>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {filters.map((filter) => {
            const active =
              selectedFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() =>
                  setSelectedFilter(filter)
                }
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
        </ScrollView>

        {/* Transactions */}
        <View className="mt-6">
          {groupedTransactions.map((group) => (
            <View key={group.label} className="mb-6">
              <Text
                className="mb-2 px-1 text-[11px] font-sans-bold uppercase text-muted-foreground"
                style={{ letterSpacing: 0.8 }}
              >
                {group.label}
              </Text>

              <View className="overflow-hidden rounded-3xl border border-white/10 bg-card">
                {group.items.map((transaction, index) => (
                  <View
                    key={transaction.id}
                    className="flex-row items-center p-4"
                    style={
                      index > 0
                        ? {
                          borderTopColor: "rgba(255,255,255,0.08)",
                          borderTopWidth: 1,
                        }
                        : undefined
                    }
                  >
                    <View
                      className={`h-11 w-11 items-center justify-center rounded-full ${transaction.type === "in"
                        ? "bg-emerald-500/15"
                        : "bg-orange/15"
                        }`}
                    >
                      {transaction.type === "in" ? (
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
                        {transaction.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="mt-0.5 text-[11px] text-muted-foreground"
                      >
                        {transaction.sub}
                        {transaction.date.includes(" · ")
                          ? ` · ${transaction.date.split(" · ")[1]}`
                          : ""}
                      </Text>
                    </View>

                    <View className="ml-3 items-end">
                      <Text
                        className={`font-sans-bold text-base ${transaction.amount > 0
                          ? "text-emerald-400"
                          : "text-white"
                          }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </Text>
                      <Text className="mt-0.5 text-[10px] uppercase text-muted-foreground">
                        Tokens
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {filteredTransactions.length ===
            0 && (
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
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
