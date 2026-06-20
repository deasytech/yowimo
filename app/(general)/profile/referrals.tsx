import GoBack from "@/components/shared/GoBack";
import Toast from "@/components/shared/Toast";
import { useToast } from "@/hooks/useToast";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Copy, Gift, Trophy, Users } from "lucide-react-native";
import { styled } from "nativewind";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const MILESTONES = [
  { count: 1, reward: 10, unlocked: true },
  { count: 3, reward: 50, unlocked: true },
  { count: 5, reward: 100, unlocked: false },
  { count: 10, reward: 250, unlocked: false },
  { count: 25, reward: 1000, unlocked: false },
];

// ─── Token badge (small) ──────────────────────────────────────────────────────
const TokenBadge = ({ amount }: { amount: number }) => (
  <View className="flex-row items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5">
    <Text className="text-sm">🪙</Text>
    <Text className="text-foreground text-xs font-bold">{amount}</Text>
  </View>
);

export default function ReferralCenterScreen() {
  const router = useRouter();
  const code = "ALEX-YW9";

  const { opacity, isVisible, showToast } = useToast();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast();
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
              {code}
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
            <View className="flex-1 rounded-2xl bg-white/15 p-3">
              <Users color="#fff" size={16} strokeWidth={2} style={{ opacity: 0.8 }} />
              <Text className="mt-1 text-white text-xl font-extrabold">8</Text>
              <Text
                className="text-white text-[10px] uppercase"
                style={{ opacity: 0.8 }}
              >
                Friends
              </Text>
            </View>

            <View className="flex-1 rounded-2xl bg-white/15 p-3">
              <Gift color="#fff" size={16} strokeWidth={2} style={{ opacity: 0.8 }} />
              <Text className="mt-1 text-white text-xl font-extrabold">160</Text>
              <Text
                className="text-white text-[10px] uppercase"
                style={{ opacity: 0.8 }}
              >
                Earned
              </Text>
            </View>

            <View className="flex-1 rounded-2xl bg-white/15 p-3">
              <Trophy color="#fff" size={16} strokeWidth={2} style={{ opacity: 0.8 }} />
              <Text className="mt-1 text-white text-xl font-extrabold">#42</Text>
              <Text
                className="text-white text-[10px] uppercase"
                style={{ opacity: 0.8 }}
              >
                Rank
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Milestone rewards ── */}
        <View className="mt-6">
          <Text className="mb-3 text-foreground text-base font-bold">
            Milestone rewards
          </Text>

          <View className="gap-2">
            {MILESTONES.map((m) => (
              <View
                key={m.count}
                className={`flex-row items-center justify-between rounded-2xl p-4 ${m.unlocked
                  ? "bg-card border border-violet-bright/40"
                  : "bg-card/60"
                  }`}
              >
                <View className="flex-row items-center gap-3">
                  {m.unlocked ? (
                    <LinearGradient
                      colors={["#7A1EFF", "#B03BFF"]}
                      className="h-10 w-10 items-center justify-center rounded-xl"
                    >
                      <Text className="text-white text-sm font-bold">{m.count}</Text>
                    </LinearGradient>
                  ) : (
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                      <Text className="text-muted-foreground text-sm font-bold">
                        {m.count}
                      </Text>
                    </View>
                  )}

                  <View>
                    <Text className="text-foreground text-sm font-semibold">
                      Invite {m.count} friend{m.count > 1 ? "s" : ""}
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                      {m.unlocked ? "Claimed" : "Locked"}
                    </Text>
                  </View>
                </View>

                <TokenBadge amount={m.reward} />
              </View>
            ))}
          </View>
        </View>

        {/* ── Invite friends CTA ── */}
        <TouchableOpacity
          onPress={() => router.push("/")}
          activeOpacity={0.85}
          className="mt-6"
        >
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full rounded-2xl py-4 items-center"
          >
            <Text className="text-white text-base font-semibold">
              Invite friends
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Toast overlay ── */}
      <Toast
        opacity={opacity}
        isVisible={isVisible}
        message="Referral code copied"
      />
    </SafeAreaView>
  );
}