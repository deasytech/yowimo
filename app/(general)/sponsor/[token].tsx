import Avatar from "@/components/shared/Avatar";
import GoBack from "@/components/shared/GoBack";
import Toast from "@/components/shared/Toast";
import { useProfile } from "@/hooks/api/useProfile";
import { usePaySponsorship, useSponsorshipInvite } from "@/hooks/api/useSponsorship";
import { useToast } from "@/hooks/useToast";
import { newIdempotencyKey } from "@/lib/api/idempotency";
import { ApiError } from "@/lib/api/types";
import { initialsFromName } from "@/lib/utils";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Coins } from "lucide-react-native";
import { styled } from "nativewind";
import { useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

export default function SponsorPartyScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { data: invite, isLoading, isError, error, refetch } = useSponsorshipInvite(token ?? null);
  const { data: profile } = useProfile();
  const pay = usePaySponsorship();
  const toast = useToast();
  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  // One key per attempt, reused if the same attempt is retried after a network failure. Tied to
  // the token it was minted for, so opening a different link can never reuse it.
  const idempotencyKeyRef = useRef<{ token: string; key: string } | null>(null);

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#B03BFF" />
      </SafeAreaView>
    );
  }

  if (isError || !invite) {
    return (
      <SafeAreaView className="flex-1 bg-background px-5">
        <GoBack title="Sponsor a party" />
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-muted-foreground text-sm text-center">
            {error instanceof ApiError ? error.message : "This sponsorship link isn't valid."}
          </Text>
          <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8}>
            <Text className="text-violet-bright text-sm font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { party } = invite;
  const balance = profile?.wallet?.balance;
  const insufficient = typeof balance === "number" && balance < invite.amount;
  const isOwnParty = profile?.id === party.host.id;
  const isPaid = invite.status === "paid";
  const isPending = invite.status === "pending";
  // Anything that isn't exactly pending or paid (cancelled, expired, or a status this build
  // doesn't know) must not offer payment.
  const isClosed = !isPaid && !isPending;
  const scopeLabel =
    invite.scope === "full_party"
      ? party.entry_fee > 0
        ? `Covers the creation fee and ${party.entry_fee} tokens for each guest`
        : "Covers the creation fee and the cost of every guest joining free"
      : "Covers the party creation fee";

  const handlePay = async () => {
    if (pay.isPending || !isPending) return;
    if (idempotencyKeyRef.current?.token !== invite.token) {
      idempotencyKeyRef.current = { token: invite.token, key: newIdempotencyKey() };
    }
    try {
      await pay.mutateAsync({ token: invite.token, idempotencyKey: idempotencyKeyRef.current.key });
      idempotencyKeyRef.current = null;
      notify("Thank you — party sponsored!", "success");
    } catch (err) {
      // A definitive rejection (as opposed to a dropped connection) ends this attempt.
      if (err instanceof ApiError) idempotencyKeyRef.current = null;
      notify(err instanceof ApiError ? err.message : "Payment didn't go through — please try again", "error");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Toast opacity={toast.opacity} isVisible={toast.isVisible} message={toastMessage} bgClass={toastBg} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Sponsor a party" />

        <LinearGradient
          colors={party.gradient ?? ["#7A1EFF", "#D84CFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mt-4 overflow-hidden rounded-3xl p-6"
        >
          <Text className="text-white/80 text-xs uppercase" style={{ letterSpacing: 0.5 }}>
            You&apos;re invited to sponsor
          </Text>
          <Text className="mt-2 text-white text-3xl font-bold">{party.title}</Text>
          <View className="mt-4 flex-row items-center gap-2">
            <Avatar
              avatarUrl={party.host.avatar_url}
              initials={initialsFromName(party.host.display_name || party.host.username)}
              size={28}
            />
            <Text className="text-white/90 text-sm">
              Hosted by {party.host.display_name || party.host.username}
            </Text>
          </View>
        </LinearGradient>

        <View className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <Text className="text-muted-foreground text-xs">{scopeLabel}</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <Coins color="#FF8A2A" size={22} strokeWidth={2.5} />
            <Text className="text-foreground text-4xl font-bold">{invite.amount}</Text>
            <Text className="text-muted-foreground text-sm">tokens</Text>
          </View>
          {invite.scope === "full_party" && party.entry_fee > 0 && (
            <Text className="mt-2 text-muted-foreground text-xs">
              {party.max_players - 1} guests × {party.entry_fee} tokens, plus the creation fee
            </Text>
          )}
          {typeof balance === "number" && (
            <Text className="mt-3 text-muted-foreground text-xs">
              Your balance: <Text className="text-foreground font-semibold">{balance} tokens</Text>
            </Text>
          )}
        </View>

        {isPaid ? (
          <View className="mt-6 items-center rounded-2xl bg-green-600/15 p-4">
            <Text className="text-green-400 text-sm font-semibold">This party is already sponsored 🎉</Text>
          </View>
        ) : isClosed ? (
          <View className="mt-6 items-center rounded-2xl bg-white/5 p-4">
            <Text className="text-muted-foreground text-sm">This sponsorship link is no longer active.</Text>
          </View>
        ) : isOwnParty ? (
          <View className="mt-6 items-center rounded-2xl bg-white/5 p-4">
            <Text className="text-muted-foreground text-sm text-center">
              Send this link to a friend — you can&apos;t sponsor your own party.
            </Text>
          </View>
        ) : insufficient ? (
          <TouchableOpacity
            onPress={() => router.push("/wallet/buy-token")}
            activeOpacity={0.85}
            className="mt-6 h-14 items-center justify-center rounded-2xl border border-violet-bright"
          >
            <Text className="text-white text-base font-semibold">Fund wallet to sponsor</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handlePay} disabled={pay.isPending} activeOpacity={0.85} className="mt-6">
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-14 items-center justify-center rounded-2xl"
              style={{ opacity: pay.isPending ? 0.7 : 1 }}
            >
              {pay.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white text-base font-semibold">Pay {invite.amount} tokens</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isPaid && (
          <TouchableOpacity
            onPress={() => router.replace(`/lobby/${party.id}`)}
            activeOpacity={0.85}
            className="mt-4 h-12 items-center justify-center rounded-2xl border border-border"
          >
            <Text className="text-foreground text-sm font-semibold">View party</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
