import GoBack from "@/components/shared/GoBack";
import { TOKEN_BUNDLES, type TokenBundleId } from "@/data/tokenBundles";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  Coins,
  CreditCard,
  Wallet
} from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

export default function BuyTokensScreen() {
  const { bundle: bundleParam } = useLocalSearchParams<{ bundle?: string }>();
  const initialBundle = TOKEN_BUNDLES.some(({ id }) => id === bundleParam)
    ? (bundleParam as TokenBundleId)
    : "party";
  const [selectedBundle, setSelectedBundle] =
    useState<TokenBundleId>(initialBundle);

  const [paymentMethod, setPaymentMethod] =
    useState("card");

  const bundle =
    TOKEN_BUNDLES.find(
      (b) => b.id === selectedBundle
    )!;

  const paymentMethods = [
    {
      id: "card",
      label: "Credit Card •••• 4242",
      icon: CreditCard,
    },
    {
      id: "wallet",
      label: "Yowimo Wallet",
      icon: Wallet,
    },
  ];

  return (
    <SafeAreaView
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Buy Tokens" />

        <LinearGradient
          colors={["#FFD66B", "#FF8A2A", "#D84CFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="relative mt-4 overflow-hidden rounded-3xl p-5"
        >
          <View
            className="absolute rounded-full bg-white/20"
            style={{ height: 120, right: -28, top: -52, width: 120 }}
          />
          <View
            className="absolute rounded-full bg-white/10"
            style={{ bottom: -52, height: 100, left: 70, width: 100 }}
          />

          <View className="flex-row items-center justify-between">
            <View>
              <Text
                className="text-xs font-sans-bold uppercase text-ink/60"
                style={{ letterSpacing: 1 }}
              >
                Current balance
              </Text>
              <View className="mt-1 flex-row items-baseline gap-2">
                <Text className="font-sg-extrabold text-4xl text-ink">
                  245
                </Text>
                <Text className="text-xs font-sans-bold uppercase text-ink/60">
                  Tokens
                </Text>
              </View>
            </View>

            <View className="h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/25">
              <Coins color="#1E1E24" size={30} strokeWidth={2.4} />
            </View>
          </View>
        </LinearGradient>

        {/* Bundles */}
        <View className="mt-5 flex-row flex-wrap justify-between">
          {TOKEN_BUNDLES.map((bundleItem) => (
            <TouchableOpacity
              key={bundleItem.id}
              activeOpacity={0.9}
              onPress={() =>
                setSelectedBundle(
                  bundleItem.id
                )
              }
              className="mb-3 w-[48%]"
            >
              <LinearGradient
                colors={bundleItem.colors}
                className={`overflow-hidden rounded-3xl p-4 ${selectedBundle ===
                  bundleItem.id
                  ? "border-2 border-white"
                  : ""
                  }`}
              >
                {bundleItem.badge && (
                  <View className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-1">
                    <Text className="text-[10px] font-sans-bold text-white">
                      {bundleItem.badge}
                    </Text>
                  </View>
                )}

                <View className="mt-8 flex-row items-center gap-2">
                  <Text className="font-sg-extrabold text-3xl text-white">
                    {bundleItem.tokens}
                  </Text>
                  <Coins color="#ffffff" size={26} strokeWidth={2.5} />
                </View>

                <Text className="text-[11px] uppercase tracking-wider text-white/80">
                  Tokens
                </Text>

                <View className="mt-3 self-start rounded-full bg-black/30 px-3 py-1">
                  <Text className="font-sans-bold text-sm text-white">
                    ${bundleItem.price}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Methods */}
        <View className="mt-4 rounded-3xl border border-white/10 bg-card p-5">
          <Text className="mb-4 font-sg-bold text-base text-white">
            Payment Method
          </Text>

          {paymentMethods.map((method) => {
            const Icon = method.icon;

            const selected =
              paymentMethod === method.id;

            return (
              <TouchableOpacity
                key={method.id}
                activeOpacity={0.8}
                onPress={() =>
                  setPaymentMethod(
                    method.id
                  )
                }
                className={`mb-3 flex-row items-center justify-between rounded-2xl p-4 ${selected
                  ? "border border-primary bg-primary/10"
                  : "bg-secondary"
                  }`}
              >
                <View className="flex-row items-center">
                  <Icon
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text className="ml-3 text-sm font-sans-medium text-white">
                    {method.label}
                  </Text>
                </View>

                <View
                  className={`h-5 w-5 rounded-full border-2 ${selected
                    ? "border-primary bg-primary"
                    : "border-white/30"
                    }`}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary Card */}
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF"]}
          className="mt-5 rounded-3xl p-5"
        >
          <Text className="text-sm text-white/80">
            Selected Bundle
          </Text>

          <View className="mt-2 flex-row items-center gap-2">
            <Text className="font-sg-extrabold text-4xl text-white">
              {bundle.tokens}
            </Text>
            <Coins color="#ffffff" size={32} strokeWidth={2.5} />
          </View>

          <Text className="mt-1 text-white/80">
            Instant delivery to your
            wallet
          </Text>
        </LinearGradient>

      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push("/wallet")
          }
          className="mt-6"
        >
          <LinearGradient
            colors={[
              "#7A1EFF",
              "#D84CFF",
              "#FF8A2A",
            ]}
            className="h-14 items-center justify-center rounded-2xl"
          >
            <View className="flex-row items-center gap-1.5">
              <Text className="font-sans-bold text-base text-white">
                Pay ${bundle.price} · Get {bundle.tokens}
              </Text>
              <Coins color="#ffffff" size={18} strokeWidth={2.5} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
