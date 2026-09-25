import GoBack from "@/components/shared/GoBack";
import { useBadges, useEarnedBadges } from "@/hooks/api/useBadges";
import { formatRelativeTime } from "@/lib/utils";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Lock } from "lucide-react-native";
import { styled } from "nativewind";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

export default function AchievementsScreen() {
  const {
    data: badges,
    isLoading: isBadgesLoading,
    isError: isBadgesError,
    refetch: refetchBadges,
  } = useBadges();
  const {
    data: earnedBadges,
    isLoading: isEarnedLoading,
    isError: isEarnedError,
    refetch: refetchEarned,
  } = useEarnedBadges();

  const isLoading = isBadgesLoading || isEarnedLoading;
  const isError = isBadgesError || isEarnedError;
  const earnedAtByBadgeId = new Map((earnedBadges ?? []).map((eb) => [eb.badge.id, eb.earned_at]));

  const retry = () => {
    if (isBadgesError) refetchBadges();
    if (isEarnedError) refetchEarned();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Achievements" />

        {/* ── Hero summary ── */}
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mt-2 rounded-3xl p-5"
        >
          <Text
            className="text-white/80 text-xs font-semibold uppercase"
            style={{ letterSpacing: 0.5 }}
          >
            Your collection
          </Text>

          <View className="mt-2 flex-row items-end">
            <Text className="text-white text-4xl font-extrabold">
              {isEarnedError ? "–" : (earnedBadges?.length ?? 0)}
            </Text>
            <Text className="text-white text-xl font-extrabold mb-0.5">
              /{badges?.length ?? 0}
            </Text>
          </View>
          <Text className="text-white text-xs -mt-1">badges unlocked</Text>
        </LinearGradient>

        {/* ── Badge grid ── */}
        {isLoading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color="#B03BFF" />
          </View>
        ) : isError || !badges?.length ? (
          <View className="mt-10 items-center gap-3">
            <Text className="text-muted-foreground text-sm">
              Couldn&apos;t load achievements.
            </Text>
            <TouchableOpacity onPress={retry} activeOpacity={0.8}>
              <Text className="text-violet-bright text-sm font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mt-5 flex-row flex-wrap gap-3">
            {badges.map((b) => {
              const earnedAt = earnedAtByBadgeId.get(b.id);
              const unlocked = earnedAt !== undefined;

              return (
                <View
                  key={b.id}
                  className={`relative rounded-3xl p-4 ${unlocked
                    ? "bg-card border border-violet-bright/40"
                    : "bg-card/60"
                    }`}
                  style={{ width: "47%" }}
                >
                  <Text
                    style={{
                      fontSize: 36,
                      opacity: unlocked ? 1 : 0.4,
                    }}
                  >
                    {b.icon}
                  </Text>

                  {!unlocked && (
                    <View className="absolute right-3 top-3">
                      <Lock color="#a3a3ab" size={14} strokeWidth={2} />
                    </View>
                  )}

                  <Text className="mt-2 text-foreground text-sm font-bold">
                    {b.name}
                  </Text>
                  <Text
                    className="mt-0.5 text-muted-foreground text-[11px]"
                    numberOfLines={2}
                  >
                    {b.description}
                  </Text>

                  <Text
                    className={`mt-2 text-[10px] font-semibold ${unlocked ? "text-violet-bright" : "text-muted-foreground"
                      }`}
                  >
                    {unlocked ? `Earned ${formatRelativeTime(earnedAt)}` : "Locked"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
