import GoBack from "@/components/shared/GoBack";
import Toast from "@/components/shared/Toast";
import {
  useDeletePaymentMethod,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
} from "@/hooks/api/usePaymentMethods";
import { useToast } from "@/hooks/useToast";
import { ApiError, PaymentMethodResource } from "@/lib/api/types";
import { Check, CreditCard, Star, Trash2 } from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function PaymentMethodsScreen() {
  const { data: methods, isLoading, isError, refetch } = usePaymentMethods();
  const setDefaultMutation = useSetDefaultPaymentMethod();
  const deleteMutation = useDeletePaymentMethod();
  const [busyId, setBusyId] = useState<number | null>(null);

  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  const handleSetDefault = async (method: PaymentMethodResource) => {
    if (method.is_default || busyId !== null) return;
    setBusyId(method.id);
    try {
      await setDefaultMutation.mutateAsync(method.id);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't set default card", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (method: PaymentMethodResource) => {
    if (busyId !== null) return;
    Alert.alert("Remove card", `Remove •••• ${method.last4}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setBusyId(method.id);
          try {
            await deleteMutation.mutateAsync(method.id);
            notify("Card removed", "success");
          } catch (err) {
            notify(err instanceof ApiError ? err.message : "Couldn't remove card", "error");
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Toast
        opacity={toast.opacity}
        isVisible={toast.isVisible}
        message={toastMessage}
        bgClass={toastBg}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Payment methods" />

        {isLoading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color="#B03BFF" />
          </View>
        ) : isError ? (
          <View className="mt-10 items-center gap-3">
            <Text className="text-sm text-muted-foreground">
              Couldn&apos;t load your saved cards.
            </Text>
            <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8}>
              <Text className="text-sm font-semibold text-violet-bright">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !methods?.length ? (
          <View className="mt-10 items-center gap-2 px-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <CreditCard color="#a3a3ab" size={26} strokeWidth={1.8} />
            </View>
            <Text className="mt-2 text-center font-sg-bold text-base text-white">
              No saved cards
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              A card is saved automatically the next time you complete a token purchase with a
              new one.
            </Text>
          </View>
        ) : (
          <View className="mt-5 gap-3">
            {methods.map((method) => (
              <View
                key={method.id}
                className="rounded-3xl border border-white/10 bg-card p-4"
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
                    <CreditCard color="#fff" size={20} strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-sm capitalize text-white">
                      {method.card_type} •••• {method.last4}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-muted-foreground">
                      Expires {method.exp_month}/{method.exp_year} · {method.bank}
                    </Text>
                  </View>
                  {method.is_default && (
                    <View className="flex-row items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1">
                      <Star color="#B03BFF" size={11} strokeWidth={2.5} fill="#B03BFF" />
                      <Text className="text-[10px] font-sans-bold text-violet-bright">
                        Default
                      </Text>
                    </View>
                  )}
                </View>

                <View className="mt-3 flex-row gap-2">
                  {!method.is_default && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(method)}
                      disabled={busyId === method.id}
                      activeOpacity={0.8}
                      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-secondary py-2.5"
                    >
                      {busyId === method.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Check color="#fff" size={14} strokeWidth={2.5} />
                          <Text className="text-xs font-sans-semibold text-white">
                            Make default
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(method)}
                    disabled={busyId === method.id}
                    activeOpacity={0.8}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-destructive/40 py-2.5"
                  >
                    <Trash2 color="#FF6B6B" size={14} strokeWidth={2.2} />
                    <Text className="text-xs font-sans-semibold text-destructive">Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
