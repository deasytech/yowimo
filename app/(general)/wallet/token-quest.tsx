import GoBack from "@/components/shared/GoBack";
import Toast from "@/components/shared/Toast";
import { useAdRewardProgress, useMintAdRewardSession } from "@/hooks/api/useAdRewards";
import { useWallet } from "@/hooks/api/useWallet";
import { useToast } from "@/hooks/useToast";
import { REWARDED_AD_UNIT_ID } from "@/lib/ads/admob";
import { AdRewardProgressResource, ApiError } from "@/lib/api/types";
import { posthog } from "@/lib/posthog";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Coins, Sparkles } from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRewardedAd } from "react-native-google-mobile-ads";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

// If the backend's SSV callback never reaches it (misconfigured dev tunnel, genuinely slow) give
// up waiting quietly rather than alarming the user — the credit may still land, and a normal
// later screen visit's own refetch will pick it up regardless.
const RECONCILE_TIMEOUT_MS = 30000;

function StatTile({ value, label, isFirst }: Readonly<{ value: number; label: string; isFirst: boolean }>) {
  return (
    <View
      className="flex-1 items-center py-4"
      style={!isFirst ? { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.10)" } : undefined}
    >
      <Text className="text-foreground text-2xl font-extrabold leading-none">{value}</Text>
      <Text className="mt-1.5 text-center text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
        {label}
      </Text>
    </View>
  );
}

function getButtonLabel({
  isQuestDisabled,
  capReached,
  isReconciling,
  isBusy,
}: Readonly<{ isQuestDisabled: boolean; capReached: boolean; isReconciling: boolean; isBusy: boolean }>): string {
  if (isQuestDisabled) return "Not available right now";
  if (capReached) return "Come back tomorrow";
  if (isReconciling) return "Confirming…";
  if (isBusy) return "Loading ad…";
  return "Watch an ad";
}

function QuestProgress({
  isLoading,
  isError,
  onRetry,
  progress,
  capReached,
}: Readonly<{
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  progress: AdRewardProgressResource | undefined;
  capReached: boolean;
}>) {
  if (isLoading) {
    return (
      <View className="mt-6 items-center">
        <ActivityIndicator color="#B03BFF" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="mt-6 items-center gap-2">
        <Text className="text-muted-foreground text-sm">Couldn&apos;t load your quest progress.</Text>
        <TouchableOpacity onPress={onRetry} activeOpacity={0.8}>
          <Text className="text-violet-bright text-sm font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View className="mt-6 flex-row rounded-2xl overflow-hidden border border-white/10 bg-white/10">
        <StatTile value={progress?.watched_today ?? 0} label="Videos watched" isFirst />
        <StatTile
          value={(progress?.watched_today ?? 0) * (progress?.tokens_per_ad ?? 0)}
          label="Tokens acquired"
          isFirst={false}
        />
        <StatTile
          value={(progress?.remaining ?? 0) * (progress?.tokens_per_ad ?? 0)}
          label="Tokens left"
          isFirst={false}
        />
      </View>

      {capReached && progress?.next_reset_at && (
        <Text className="mt-3 text-center text-muted-foreground text-xs">
          Resets{" "}
          {new Date(progress.next_reset_at).toLocaleString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
      )}
    </>
  );
}

export default function TokenQuestScreen() {
  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  // Captured right as a watch starts, so the reconciliation effect below can tell "my credit
  // landed" apart from "someone else's request happened to bump this in the meantime."
  const watchedAtStartRef = useRef<number | null>(null);

  const { data: wallet } = useWallet();
  const mintSession = useMintAdRewardSession();
  const {
    data: progress,
    isLoading: isProgressLoading,
    isError: isProgressError,
    refetch: refetchProgress,
  } = useAdRewardProgress({ reconciling: isReconciling });

  const requestOptions = useMemo(
    () => ({
      requestNonPersonalizedAdsOnly: true,
      ...(sessionToken ? { serverSideVerificationOptions: { customData: sessionToken } } : {}),
    }),
    [sessionToken],
  );

  // Pinned to a library version whose useRewardedAd(id, options) predates v17's object-form
  // hook — see lib/ads/admob.ts for why. No autoLoad: load() must be called explicitly once a
  // fresh ad instance exists for this session's token.
  const { isLoaded, isClosed, isEarnedReward, error, load, show } = useRewardedAd(
    sessionToken ? REWARDED_AD_UNIT_ID : null,
    requestOptions,
  );

  useEffect(() => {
    if (sessionToken) {
      setIsLoadingAd(true);
      load();
    }
  }, [sessionToken, load]);

  // Show the instant it's ready — the user already asked for this by tapping Watch an ad.
  useEffect(() => {
    if (isLoaded) {
      setIsLoadingAd(false);
      show();
    }
  }, [isLoaded, show]);

  useEffect(() => {
    if (isEarnedReward) setIsReconciling(true);
  }, [isEarnedReward]);

  // The ad instance is spent the moment it's dismissed (closed) or never panned out (no fill /
  // error) — drop the token either way so the next tap mints a fresh one rather than retrying a
  // used or failed instance.
  useEffect(() => {
    if (isClosed) {
      setSessionToken(null);
      setIsLoadingAd(false);
    } else if (error) {
      // The user-facing message is deliberately generic ("no fill" vs a genuine config/network
      // error both just mean "nothing to show"), but the underlying code/message matters a lot
      // for debugging — e.g. AdMob's error code 3 is a real no-fill (expected sometimes, not a
      // bug), while a 0/1/2 or a message mentioning the ad unit id usually points at a real
      // setup problem (wrong unit id, app not yet propagated, request config issue).
      if (__DEV__) console.warn("[AdMob] rewarded ad failed to load", error);
      setSessionToken(null);
      setIsLoadingAd(false);
      notify("No ad available right now — try again in a bit", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClosed, error]);

  // Give up quietly after a while rather than leaving "Confirming…" on screen forever if the
  // SSV callback never lands.
  useEffect(() => {
    if (!isReconciling) return;
    const timeout = setTimeout(() => setIsReconciling(false), RECONCILE_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [isReconciling]);

  // The actual confirmation: stop polling and celebrate the moment the backend's own count
  // reflects the credit — never bump this optimistically from the client-side earned-reward
  // event alone, which only proves the device saw the ad finish, not that the SSV callback
  // reached the backend.
  useEffect(() => {
    if (!isReconciling || !progress || watchedAtStartRef.current === null) return;
    if (progress.watched_today > watchedAtStartRef.current) {
      setIsReconciling(false);
      notify("+1 token!", "success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, isReconciling]);

  // can_earn is the authoritative gate (enabled && remaining > 0, computed server-side) — the
  // backend's own request, rather than re-deriving it from the other fields: it also covers the
  // kill switch (enabled), which remaining alone wouldn't catch. Defaults closed while progress
  // hasn't loaded yet, which is also correct: nothing to earn against without it.
  const canEarn = progress?.can_earn ?? false;
  const isQuestDisabled = progress !== undefined && !progress.enabled;
  const capReached = progress !== undefined && progress.enabled && !progress.can_earn;
  const isBusy = mintSession.isPending || isLoadingAd || isReconciling;
  const isDisabled = isBusy || !canEarn || !REWARDED_AD_UNIT_ID;

  const handleWatchAd = async () => {
    // Checked again here, not just via the button's disabled state, so a stale render can't
    // round-trip into the mint endpoint's 422/503 for an already-known-exhausted or
    // kill-switched state.
    if (isDisabled || !canEarn) return;
    posthog.capture("ad_reward_watch_started", { source: "token_quest_screen" });
    try {
      watchedAtStartRef.current = progress?.watched_today ?? 0;
      const session = await mintSession.mutateAsync();
      setSessionToken(session.token);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't start — try again", "error");
    }
  };

  const buttonLabel = getButtonLabel({ isQuestDisabled, capReached, isReconciling, isBusy });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Toast opacity={toast.opacity} isVisible={toast.isVisible} message={toastMessage} bgClass={toastBg} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Token Quest" />

        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mt-4 items-center overflow-hidden rounded-3xl p-6"
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <Sparkles color="#fff" size={26} strokeWidth={2} />
          </View>
          <Text className="mt-3 text-center font-sg-bold text-2xl text-white">Watch & earn</Text>
          {progress && (
            <Text className="mt-1 text-center text-sm text-white/80">
              {progress.tokens_per_ad} token{progress.tokens_per_ad === 1 ? "" : "s"} per ad, up
              to {progress.daily_cap} a day.
            </Text>
          )}
        </LinearGradient>

        <QuestProgress
          isLoading={isProgressLoading}
          isError={isProgressError}
          onRetry={() => refetchProgress()}
          progress={progress}
          capReached={capReached}
        />

        <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-border bg-secondary/40 px-4 py-3.5">
          <View className="flex-row items-center gap-2">
            <Coins color="#FF8A2A" size={18} strokeWidth={2.5} />
            <Text className="text-foreground text-sm font-semibold">Wallet balance</Text>
          </View>
          <Text className="text-foreground text-sm font-bold">{wallet?.balance ?? "–"}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleWatchAd}
          disabled={isDisabled}
          style={{ opacity: isDisabled && !isBusy ? 0.5 : 1 }}
          className="mt-6"
        >
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-14 flex-row items-center justify-center gap-2 rounded-2xl"
          >
            {isBusy && <ActivityIndicator color="#fff" size="small" />}
            <Text className="text-white text-base font-semibold">{buttonLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
