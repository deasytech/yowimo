import ListHeading from "@/components/shared/ListHeading";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react-native";
import { styled } from "nativewind";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const PACKS = [
  { name: "Starter", tokens: 100, price: "$1.99", colors: ["#7A1EFF", "#2D2A8F"] as const },
  { name: "Party", tokens: 500, price: "$7.99", colors: ["#D84CFF", "#7A1EFF"] as const, badge: "Popular" },
  { name: "Legend", tokens: 1500, price: "$19.99", colors: ["#FF8A2A", "#D84CFF"] as const, badge: "Best value" },
  { name: "Whale", tokens: 5000, price: "$49.99", colors: ["#B03BFF", "#FF8A2A"] as const },
];

const TX = [
  { type: "earn", label: "MVP — Friday Night Chaos", amount: 25, time: "2h ago" },
  { type: "spend", label: "Wild Challenge pack", amount: -20, time: "Yesterday" },
  { type: "earn", label: "Referral · @leop joined", amount: 50, time: "2d ago" },
  { type: "earn", label: "Sponsored party · Acme", amount: 30, time: "3d ago" },
  { type: "spend", label: "Gift to @priyan", amount: -10, time: "5d ago" },
];

const WalletScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-foreground text-3xl font-bold tracking-tight mt-16">
          Wallet
        </Text>

        {/* ── Balance card ── */}
        <View className="relative mt-5 rounded-3xl overflow-hidden">
          <LinearGradient
            colors={["#FFD66B", "#FF8A2A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6"
          >
            <View
              className="absolute rounded-full bg-white/20"
              style={{ top: -48, right: -48, width: 160, height: 160 }}
            />

            <View>
              <Text
                className="text-ink text-xs font-bold uppercase"
                style={{ letterSpacing: 1, opacity: 0.7 }}
              >
                Token balance
              </Text>
              <Text className="mt-1 text-ink text-5xl font-black">142 🪙</Text>

              <View className="mt-4 flex-row gap-2">
                <Link href="/" asChild>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="flex-row items-center gap-1.5 rounded-full bg-ink px-4 py-2"
                  >
                    <Plus color="#fff" size={16} strokeWidth={2} />
                    <Text className="text-white text-sm font-semibold">Buy</Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/" asChild>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="flex-row items-center gap-1.5 rounded-full bg-white/40 px-4 py-2"
                  >
                    <Gift color="#1e1e24" size={16} strokeWidth={2} />
                    <Text className="text-ink text-sm font-semibold">Gift</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Earn more strip ── */}
        <Link href="/profile/referrals" asChild>
          <TouchableOpacity
            activeOpacity={0.85}
            className="mt-4 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <Sparkles color="#fff" size={16} strokeWidth={2} />
            </LinearGradient>

            <View className="flex-1">
              <Text className="text-foreground text-sm font-semibold">
                Earn 50 tokens
              </Text>
              <Text className="text-muted-foreground text-[11px]">
                Invite a friend to your next party
              </Text>
            </View>

            <Text className="text-violet-bright text-xs font-semibold">Go →</Text>
          </TouchableOpacity>
        </Link>

        {/* ── Token packs ── */}
        <View className="mt-7">
          <ListHeading title="Top up" titleSize="text-lg" />

          <View className="flex-row flex-wrap gap-3">
            {PACKS.map((p) => (
              <Link key={p.name} href="/" asChild>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={{ width: "47%" }}
                >
                  <LinearGradient
                    colors={p.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="relative rounded-3xl p-4 overflow-hidden"
                  >
                    {p.badge && (
                      <View className="absolute top-3 right-3 rounded-full bg-ink/40 px-2 py-0.5">
                        <Text
                          className="text-white text-[9px] font-bold uppercase"
                          style={{ letterSpacing: 0.5 }}
                        >
                          {p.badge}
                        </Text>
                      </View>
                    )}

                    <Text
                      className="text-white/80 text-xs font-bold uppercase"
                      style={{ letterSpacing: 0.5 }}
                    >
                      {p.name}
                    </Text>
                    <Text className="mt-1 text-white text-3xl font-black">
                      {p.tokens.toLocaleString()} 🪙
                    </Text>
                    <Text className="mt-3 text-white text-sm font-bold">
                      {p.price}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        {/* ── Marketplace shortcut ── */}
        <Link href="/" asChild>
          <TouchableOpacity
            activeOpacity={0.85}
            className="mt-6 flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4"
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-12 w-12 items-center justify-center rounded-2xl"
            >
              <ShoppingBag color="#fff" size={20} strokeWidth={2} />
            </LinearGradient>

            <View className="flex-1">
              <Text className="text-foreground text-sm font-semibold">
                Marketplace
              </Text>
              <Text className="text-muted-foreground text-[11px]">
                Premium card packs, themes, and unlockables
              </Text>
            </View>

            <Text className="text-muted-foreground text-xs">›</Text>
          </TouchableOpacity>
        </Link>

        {/* ── Transactions ── */}
        <View className="mt-7">
          <ListHeading title="Activity" titleSize="text-lg" />

          <View className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
            {TX.map((t, i) => (
              <View
                key={i}
                className="flex-row items-center gap-3 p-4"
                style={
                  i > 0
                    ? { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }
                    : undefined
                }
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${t.type === "earn" ? "bg-orange/20" : "bg-violet/20"
                    }`}
                >
                  {t.type === "earn" ? (
                    <ArrowDownLeft color="#FF8A2A" size={16} strokeWidth={2} />
                  ) : (
                    <ArrowUpRight color="#B03BFF" size={16} strokeWidth={2} />
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium">
                    {t.label}
                  </Text>
                  <Text className="text-muted-foreground text-[11px]">
                    {t.time}
                  </Text>
                </View>

                <Text
                  className={`text-base font-bold ${t.amount > 0 ? "text-orange" : "text-foreground"
                    }`}
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── See full history ── */}
        <Link href="/" asChild>
          <TouchableOpacity
            activeOpacity={0.8}
            className="mt-6 h-12 w-full items-center justify-center rounded-2xl border border-border"
          >
            <Text className="text-foreground text-sm font-semibold">
              See full transaction history
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WalletScreen;