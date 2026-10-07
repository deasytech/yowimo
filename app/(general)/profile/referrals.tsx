import GoBack from "@/components/shared/GoBack";
import Toast from "@/components/shared/Toast";
import { useReferralSummary } from "@/hooks/api/useReferrals";
import { useToast } from "@/hooks/useToast";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Copy, Gift, MessageCircleHeart, Users } from "lucide-react-native";
import { styled } from "nativewind";
import { ActivityIndicator, ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

function StatTile({
  Icon,
  value,
  label,
}: Readonly<{ Icon: typeof Users; value: string; label: string }>) {
  return (
    <View className="flex-1 rounded-2xl bg-white/15 p-3">
      <Icon color="#fff" size={16} strokeWidth={2} style={{ opacity: 0.8 }} />
      <Text className="mt-1 text-white text-xl font-extrabold">{value}</Text>
      <Text className="text-white text-[10px] uppercase" style={{ opacity: 0.8 }}>
        {label}
      </Text>
    </View>
  );
}

export default function ReferralCenterScreen() {
  const { opacity, isVisible, showToast } = useToast();
  const { data: summary, isLoading, isError, refetch } = useReferralSummary();

  const handleCopy = async () => {
    if (!summary) return;
    await Clipboard.setStringAsync(summary.referral_code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast();
  };

  const handleInvite = async () => {
    if (!summary) return;
    try {
      await Share.share({
        message: `Join me on Yowimo! Use my code ${summary.referral_code} when you sign up — we both get ${summary.reward_amount} tokens once you play your first party 🎉`,
      });
    } catch {
      // User dismissed the share sheet — nothing to recover from.
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Refer & earn" />

        {isLoading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color="#B03BFF" />
          </View>
        ) : isError || !summary ? (
          <View className="mt-10 items-center gap-2">
            <Text className="text-muted-foreground text-sm">Couldn&apos;t load your referral info.</Text>
            <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8}>
              <Text className="text-violet-bright text-sm font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Hero card ── */}
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="mt-4 rounded-3xl p-6 overflow-hidden"
            >
              <Text
                className="text-white/80 text-xs font-semibold uppercase"
                style={{ letterSpacing: 0.5 }}
              >
                Your invite code
              </Text>

              <View className="mt-2 flex-row items-center justify-between">
                <Text
                  className="text-white text-3xl font-extrabold"
                  style={{ letterSpacing: -0.5 }}
                >
                  {summary.referral_code}
                </Text>
                <TouchableOpacity
                  onPress={handleCopy}
                  activeOpacity={0.8}
                  className="h-11 w-11 items-center justify-center rounded-xl bg-white/20"
                >
                  <Copy color="#fff" size={16} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View className="mt-4 flex-row gap-2">
                <StatTile Icon={Users} value={String(summary.referred_count)} label="Friends" />
                <StatTile Icon={Gift} value={String(summary.tokens_earned)} label="Earned" />
              </View>
            </LinearGradient>

            {/* ── How it works ── */}
            <View className="mt-6 gap-2">
              <Text className="mb-1 text-foreground text-base font-bold">How it works</Text>
              <View className="rounded-2xl bg-card p-4 gap-3">
                <Text className="text-muted-foreground text-sm">
                  1. Share your code with a friend.
                </Text>
                <Text className="text-muted-foreground text-sm">
                  2. They enter it when they sign up for Yowimo.
                </Text>
                <Text className="text-muted-foreground text-sm">
                  3. Once they play their first party, you both get{" "}
                  <Text className="text-foreground font-semibold">{summary.reward_amount} tokens</Text>.
                </Text>
              </View>
            </View>

            {/* ── Invite friends CTA ── */}
            <TouchableOpacity onPress={handleInvite} activeOpacity={0.85} className="mt-6">
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full flex-row items-center justify-center gap-2 rounded-2xl py-4"
              >
                <MessageCircleHeart color="#fff" size={18} strokeWidth={2} />
                <Text className="text-white text-base font-semibold">Invite friends</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Toast overlay ── */}
      <Toast opacity={opacity} isVisible={isVisible} message="Referral code copied" />
    </SafeAreaView>
  );
}
