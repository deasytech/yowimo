import { TOKEN_BUNDLES } from "@/data/tokenBundles";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Gift,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);
const PACK_GAP = 12;
const NARROW_GRID_BREAKPOINT = 320;

const TX = [
  { type: "earn", label: "MVP — Friday Night Chaos", amount: 25, time: "2h ago" },
  { type: "spend", label: "Wild Challenge pack", amount: -20, time: "Yesterday" },
  { type: "earn", label: "Referral · @leop joined", amount: 50, time: "2d ago" },
  { type: "earn", label: "Sponsored party · Acme", amount: 30, time: "3d ago" },
  { type: "spend", label: "Gift to @priyan", amount: -10, time: "5d ago" },
];

const WalletScreen = () => {
  const { width: windowWidth } = useWindowDimensions();
  const [packGridWidth, setPackGridWidth] = useState(windowWidth - 40);
  const packColumns = packGridWidth < NARROW_GRID_BREAKPOINT ? 1 : 2;
  const packWidth = Math.floor(
    (packGridWidth - PACK_GAP * (packColumns - 1)) / packColumns,
  );

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mt-16 font-sans-bold text-3xl tracking-tight text-foreground">
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
                className="font-sans-bold text-xs uppercase text-ink"
                style={{ letterSpacing: 1, opacity: 0.7 }}
              >
                Token balance
              </Text>
              <View className="mt-1 min-h-16 flex-row items-center gap-3">
                <Text
                  className="font-sans-extrabold text-5xl text-ink"
                  numberOfLines={1}
                  style={{ lineHeight: 64 }}
                >
                  142
                </Text>
                <Coins color="#1e1e24" size={40} strokeWidth={2.5} />
              </View>

              <View className="mt-4 flex-row gap-2">
                <Link href="/wallet/buy-token" asChild>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="flex-row items-center gap-1.5 rounded-full bg-ink px-4 py-2"
                  >
                    <Plus color="#fff" size={16} strokeWidth={2} />
                    <Text className="font-sans-semibold text-sm text-white">Buy</Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/play/invite" asChild>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="flex-row items-center gap-1.5 rounded-full bg-white/40 px-4 py-2"
                  >
                    <Gift color="#1e1e24" size={16} strokeWidth={2} />
                    <Text className="font-sans-semibold text-sm text-ink">Gift</Text>
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
              <Text className="font-sans-semibold text-sm text-foreground">
                Earn 50 tokens
              </Text>
              <Text className="font-sans text-[11px] text-muted-foreground">
                Invite a friend to your next party
              </Text>
            </View>

            <Text className="font-sans-semibold text-xs text-violet-bright">Go →</Text>
          </TouchableOpacity>
        </Link>

        {/* ── Token packs ── */}
        <View className="mt-7">
          <Text className="my-5 font-sans-bold text-lg text-white">Top up</Text>

          <View
            className="flex-row flex-wrap gap-3"
            onLayout={(event) => setPackGridWidth(event.nativeEvent.layout.width)}
          >
            {TOKEN_BUNDLES.map((p) => (
              <Link
                key={p.id}
                href={{
                  pathname: "/wallet/buy-token",
                  params: { bundle: p.id },
                }}
                asChild
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={{ width: packWidth }}
                >
                  <LinearGradient
                    colors={p.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="relative rounded-3xl p-4 overflow-hidden"
                  >
                    <View className="min-h-5 flex-row items-start justify-between gap-2">
                      <Text
                        className="shrink font-sans-bold text-xs uppercase text-white/80"
                        numberOfLines={1}
                        style={{ letterSpacing: 0.5 }}
                      >
                        {p.name}
                      </Text>

                      {p.badge && (
                        <View className="shrink-0 rounded-full bg-ink/40 px-2 py-0.5">
                          <Text
                            className="font-sans-bold text-[9px] uppercase text-white"
                            style={{ letterSpacing: 0.5 }}
                          >
                            {p.badge}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="mt-1 h-10 flex-row items-center gap-2">
                      <Text
                        adjustsFontSizeToFit
                        className="min-w-0 shrink font-sans-extrabold text-3xl text-white"
                        minimumFontScale={0.65}
                        numberOfLines={1}
                        style={{ lineHeight: 40 }}
                      >
                        {p.tokens.toLocaleString()}
                      </Text>
                      <Coins
                        color="#fff"
                        size={24}
                        strokeWidth={2.5}
                      />
                    </View>
                    <Text className="mt-3 font-sans-bold text-sm text-white">
                      ${p.price.toFixed(2)}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        {/* ── Marketplace shortcut ── */}
        <Link href="/market-place" asChild>
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
              <Text className="font-sans-semibold text-sm text-foreground">
                Marketplace
              </Text>
              <Text className="font-sans text-[11px] text-muted-foreground">
                Premium card packs, themes, and unlockables
              </Text>
            </View>

            <Text className="font-sans text-xs text-muted-foreground">›</Text>
          </TouchableOpacity>
        </Link>

        {/* ── Transactions ── */}
        <View className="mt-7">
          <Text className="my-5 font-sans-bold text-lg text-white">Activity</Text>

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
                  <Text className="font-sans-medium text-sm text-foreground">
                    {t.label}
                  </Text>
                  <Text className="font-sans text-[11px] text-muted-foreground">
                    {t.time}
                  </Text>
                </View>

                <Text
                  className={`font-sans-bold text-base ${t.amount > 0 ? "text-orange" : "text-foreground"
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
        <Link href="/wallet/transactions" asChild>
          <TouchableOpacity
            activeOpacity={0.8}
            className="mt-6 h-12 w-full items-center justify-center rounded-2xl border border-border"
          >
            <Text className="font-sans-semibold text-sm text-foreground">
              See full transaction history
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WalletScreen;
