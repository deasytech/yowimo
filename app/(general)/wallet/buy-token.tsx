import GoBack from "@/components/shared/GoBack";
import Toast from "@/components/shared/Toast";
import { usePaymentMethods } from "@/hooks/api/usePaymentMethods";
import { usePurchaseTokenBundle, useTokenBundles } from "@/hooks/api/useTokenBundles";
import { useWallet } from "@/hooks/api/useWallet";
import { useToast } from "@/hooks/useToast";
import { newIdempotencyKey } from "@/lib/api/idempotency";
import { ApiError, TokenBundleResource } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@clerk/expo";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link, router, useLocalSearchParams } from "expo-router";
import {
  CirclePlus,
  Coins,
  CreditCard,
  Settings2
} from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PaystackProvider, usePaystack } from "react-native-paystack-webview";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY as string;

if (!PAYSTACK_PUBLIC_KEY) {
  throw new Error(
    "Add your Paystack public key to the .env file as EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY"
  );
}

type PaymentSelection = { type: "saved"; id: number } | { type: "new" };

/**
 * The Paystack currency has to be fixed before its checkout webview mounts, but which
 * currency that is depends on which bundle is selected — so this outer component owns just
 * enough state (bundle list + selection) to compute it, then hands everything else to
 * BuyTokensContent, which is the one actually inside the provider and able to call
 * usePaystack().
 */
export default function BuyTokensScreen() {
  const { bundle: bundleParam } = useLocalSearchParams<{ bundle?: string }>();
  const { data: bundles, isLoading, isError, refetch } = useTokenBundles();
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);

  useEffect(() => {
    if (!bundles?.length) return;
    const requested = bundles.find((b) => String(b.id) === bundleParam);
    setSelectedBundleId((current) => requested?.id ?? current ?? bundles[0].id);
  }, [bundles, bundleParam]);

  const bundle = bundles?.find((b) => b.id === selectedBundleId);

  // Must exactly match what GET /token-bundles showed this same caller for this bundle — the
  // API is the sole source of truth for currency (NGN by default, USD only for a confirmed
  // non-Nigerian profile). A mismatch here declines with 402 even if Paystack itself approves
  // the charge, so this never independently guesses from country_code — "NGN" is only a
  // placeholder for the brief window before the bundle list has loaded.
  const currency = bundle?.currency === "USD" ? "USD" : "NGN";

  return (
    <PaystackProvider publicKey={PAYSTACK_PUBLIC_KEY} currency={currency}>
      <BuyTokensContent
        bundles={bundles}
        bundle={bundle}
        selectedBundleId={selectedBundleId}
        setSelectedBundleId={setSelectedBundleId}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
      />
    </PaystackProvider>
  );
}

interface BuyTokensContentProps {
  bundles: TokenBundleResource[] | undefined;
  bundle: TokenBundleResource | undefined;
  selectedBundleId: number | null;
  setSelectedBundleId: (id: number) => void;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

function BuyTokensContent({
  bundles,
  bundle,
  selectedBundleId,
  setSelectedBundleId,
  isLoading,
  isError,
  refetch,
}: BuyTokensContentProps) {
  const { data: wallet, isLoading: isWalletLoading } = useWallet();
  const { data: paymentMethods } = usePaymentMethods();
  const purchaseMutation = usePurchaseTokenBundle();
  const { popup } = usePaystack();
  const { user } = useUser();

  // null until we've decided the initial pick once — after that, the user's choice sticks
  // even if the payment-methods list refetches.
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelection | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const idempotencyKeys = useRef<Map<number, string>>(new Map());
  // A Paystack charge that succeeded but whose confirmation call to our backend failed —
  // retry must re-send this exact reference rather than charging the card again.
  const [pendingReference, setPendingReference] = useState<{
    bundleId: number;
    reference: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();

  useEffect(() => {
    if (paymentSelection !== null || paymentMethods === undefined) return;
    if (!paymentMethods.length) {
      setPaymentSelection({ type: "new" });
      return;
    }
    const defaultMethod = paymentMethods.find((m) => m.is_default) ?? paymentMethods[0];
    setPaymentSelection({ type: "saved", id: defaultMethod.id });
  }, [paymentMethods, paymentSelection]);

  const selection = paymentSelection ?? { type: "new" as const };
  const isPendingConfirmation = !!bundle && pendingReference?.bundleId === bundle.id;

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  const getIdempotencyKey = (bundleId: number) => {
    let key = idempotencyKeys.current.get(bundleId);
    if (!key) {
      key = newIdempotencyKey();
      idempotencyKeys.current.set(bundleId, key);
    }
    return key;
  };

  const confirmPurchase = async (
    bundleId: number,
    idempotencyKey: string,
    paymentMethodId?: number,
    paymentReference?: string,
  ) => {
    try {
      const result = await purchaseMutation.mutateAsync({
        bundleId,
        idempotencyKey,
        payment_method_id: paymentMethodId,
        payment_reference: paymentReference,
      });
      idempotencyKeys.current.delete(bundleId);
      setPendingReference(null);
      notify(`${result.amount.toLocaleString()} tokens added!`, "success");
      router.push("/wallet");
    } catch (err) {
      if (paymentReference) {
        // The card was already charged on Paystack's side — never re-run checkout for this
        // attempt, only let the user retry confirming it with us.
        setPendingReference({ bundleId, reference: paymentReference });
        notify(
          err instanceof ApiError
            ? err.message
            : "Payment received but we couldn't confirm it — tap Pay again to retry",
          "error",
        );
      } else {
        notify(err instanceof ApiError ? err.message : "Purchase failed — please try again", "error");
      }
    }
  };

  const handlePay = async () => {
    if (!bundle || purchaseMutation.isPending || isCheckingOut) return;

    if (pendingReference && pendingReference.bundleId === bundle.id) {
      await confirmPurchase(bundle.id, pendingReference.reference, undefined, pendingReference.reference);
      return;
    }

    if (selection.type === "saved") {
      await confirmPurchase(bundle.id, getIdempotencyKey(bundle.id), selection.id);
      return;
    }

    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      notify("Add an email to your account before paying with a new card", "error");
      return;
    }

    const reference = getIdempotencyKey(bundle.id);
    setIsCheckingOut(true);
    popup.checkout({
      email,
      amount: bundle.price,
      reference,
      onSuccess: async () => {
        setIsCheckingOut(false);
        await confirmPurchase(bundle.id, reference, undefined, reference);
      },
      onCancel: () => setIsCheckingOut(false),
      onError: (err) => {
        setIsCheckingOut(false);
        notify(err?.message || "Payment failed — please try again", "error");
      },
    });
  };

  const isBusy = purchaseMutation.isPending || isCheckingOut;

  return (
    <SafeAreaView
      className="flex-1 bg-background"
    >
      <Toast
        opacity={toast.opacity}
        isVisible={toast.isVisible}
        message={toastMessage}
        bgClass={toastBg}
      />

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
                {isWalletLoading ? (
                  <ActivityIndicator color="#1E1E24" />
                ) : (
                  <Text className="font-sg-extrabold text-4xl text-ink">
                    {(wallet?.balance ?? 0).toLocaleString()}
                  </Text>
                )}
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
        {isLoading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color="#B03BFF" />
          </View>
        ) : isError || !bundles?.length ? (
          <View className="mt-10 items-center gap-3">
            <Text className="text-muted-foreground text-sm">Couldn&apos;t load token bundles.</Text>
            <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8}>
              <Text className="text-violet-bright text-sm font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mt-5 flex-row flex-wrap justify-between">
            {bundles.map((bundleItem: TokenBundleResource) => (
              <TouchableOpacity
                key={bundleItem.id}
                activeOpacity={0.9}
                onPress={() =>
                  setSelectedBundleId(
                    bundleItem.id
                  )
                }
                className="mb-3 w-[48%]"
              >
                <LinearGradient
                  colors={bundleItem.gradient}
                  className={`overflow-hidden rounded-3xl p-4 ${selectedBundleId ===
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
                      {bundleItem.tokens.toLocaleString()}
                    </Text>
                    <Coins color="#ffffff" size={26} strokeWidth={2.5} />
                  </View>

                  <Text className="text-[11px] uppercase tracking-wider text-white/80">
                    Tokens
                  </Text>

                  <View className="mt-3 self-start rounded-full bg-black/30 px-3 py-1">
                    <Text className="font-sans-bold text-sm text-white">
                      {formatCurrency(bundleItem.price, bundleItem.currency)}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Payment Methods */}
        <View className="mt-4 rounded-3xl border border-white/10 bg-card p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-sg-bold text-base text-white">
              Payment Method
            </Text>
            <Link href="/wallet/payment-methods" asChild>
              <TouchableOpacity activeOpacity={0.8} className="flex-row items-center gap-1">
                <Settings2 size={13} color="#B03BFF" />
                <Text className="text-xs font-sans-semibold text-violet-bright">Manage</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {(paymentMethods ?? []).map((method) => {
            const selected = selection.type === "saved" && selection.id === method.id;

            return (
              <TouchableOpacity
                key={method.id}
                activeOpacity={0.8}
                onPress={() => setPaymentSelection({ type: "saved", id: method.id })}
                className={`mb-3 flex-row items-center justify-between rounded-2xl p-4 ${selected
                  ? "border border-primary bg-primary/10"
                  : "bg-secondary"
                  }`}
              >
                <View className="flex-row items-center">
                  <CreditCard
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text className="ml-3 text-sm font-sans-medium capitalize text-white">
                    {method.card_type} •••• {method.last4}
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

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPaymentSelection({ type: "new" })}
            className={`flex-row items-center justify-between rounded-2xl p-4 ${selection.type === "new"
              ? "border border-primary bg-primary/10"
              : "bg-secondary"
              }`}
          >
            <View className="flex-row items-center">
              <CirclePlus
                size={18}
                color="#FFFFFF"
              />

              <Text className="ml-3 text-sm font-sans-medium text-white">
                Pay with a new card
              </Text>
            </View>

            <View
              className={`h-5 w-5 rounded-full border-2 ${selection.type === "new"
                ? "border-primary bg-primary"
                : "border-white/30"
                }`}
            />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        {bundle && (
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF"]}
            className="mt-5 rounded-3xl p-5"
          >
            <Text className="text-sm text-white/80">
              Selected Bundle
            </Text>

            <View className="mt-2 flex-row items-center gap-2">
              <Text className="font-sg-extrabold text-4xl text-white">
                {bundle.tokens.toLocaleString()}
              </Text>
              <Coins color="#ffffff" size={32} strokeWidth={2.5} />
            </View>

            <Text className="mt-1 text-white/80">
              Instant delivery to your
              wallet
            </Text>
          </LinearGradient>
        )}

      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePay}
          disabled={!bundle || isBusy}
          className="mt-6"
        >
          <LinearGradient
            colors={[
              "#7A1EFF",
              "#D84CFF",
              "#FF8A2A",
            ]}
            className="h-14 items-center justify-center rounded-2xl"
            style={{ opacity: !bundle || isBusy ? 0.7 : 1 }}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View className="flex-row items-center gap-1.5">
                <Text className="font-sans-bold text-base text-white">
                  {!bundle
                    ? "Select a bundle"
                    : isPendingConfirmation
                      ? "Confirm payment"
                      : `Pay ${formatCurrency(bundle.price, bundle.currency)} · Get ${bundle.tokens.toLocaleString()}`}
                </Text>
                <Coins color="#ffffff" size={18} strokeWidth={2.5} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
