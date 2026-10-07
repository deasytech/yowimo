import Avatar from "@/components/shared/Avatar";
import ProfileCover from "@/components/screens/profile/ProfileCover";
import InlineRetry from "@/components/shared/InlineRetry";
import ListHeading from "@/components/shared/ListHeading";
import { useEarnedBadges } from "@/hooks/api/useBadges";
import { useFriends } from "@/hooks/api/useFriends";
import { useProfile, useProfileStats } from "@/hooks/api/useProfile";
import { getInitials, initialsFromName } from "@/lib/utils";
import { useUser } from "@clerk/expo";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import {
  Award,
  ChevronRight,
  Settings,
  Trophy
} from "lucide-react-native";
import { styled } from "nativewind";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const SETTINGS_ROWS = [
  { Icon: Award, label: "Referral center", sub: "Earn 50 tokens per friend", to: "/profile/referrals" },
  { Icon: Trophy, label: "Achievements", sub: "Badges, streaks, MVPs", to: "/profile/achievements" },
  { Icon: Settings, label: "Settings", sub: "Privacy, notifications, more", to: "/profile/settings" },
  { Icon: Trophy, label: "Help center", sub: "Get answers fast", to: "/profile/help" },
];

const ProfileScreen = () => {
  const { user } = useUser();
  const { data: profile } = useProfile();
  const { data: stats } = useProfileStats();
  const {
    data: earnedBadges,
    isLoading: isBadgesLoading,
    isError: isBadgesError,
    refetch: refetchBadges,
  } = useEarnedBadges();
  const recentBadges = (earnedBadges ?? []).slice(0, 4);

  const {
    data: friends,
    isLoading: isFriendsLoading,
    isError: isFriendsError,
    refetch: refetchFriends,
  } = useFriends();
  const recentFriends = (friends ?? []).slice(0, 4);
  // `friends` stays undefined through both loading and error — one check covers "not known
  // yet" for display purposes without needing isFriendsLoading/isFriendsError separately here.
  const friendsCount = friends?.length;

  // Streak still has no backing endpoint — the day-definition/reset-vs-grace-period question
  // needs a product decision before the backend can track it (see GET /users/me/stats' docs
  // note). TODO(api): wire up once that's settled.
  const STATS = [
    { label: "Parties", value: stats?.parties_count ?? "–" },
    { label: "MVPs", value: stats?.mvp_count ?? "–" },
    { label: "Friends", value: friendsCount ?? "–" },
    { label: "Streak", value: "5d" },
  ];

  const initials = getInitials(user);

  const displayName =
    profile?.display_name || user?.fullName || user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User';

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100, gap: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-14">
          <ProfileCover
            displayName={displayName}
            initials={initials}
            avatarUrl={profile?.avatar_url}
            username={profile?.username}
            bio={profile?.bio}
            joinedAt={profile?.created_at}
          />

          <View
            className="mt-5 flex-row rounded-2xl overflow-hidden border border-white/10 bg-white/10"
          >
            {STATS.map((s, i) => (
              <View
                key={s.label}
                className="flex-1 items-center py-3"
                style={
                  i > 0
                    ? { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.10)" }
                    : undefined
                }
              >
                <Text className="text-white text-xl font-extrabold leading-none">
                  {s.value}
                </Text>
                <Text
                  className="mt-1.5 text-white/50 text-[10px] font-medium uppercase tracking-wide"
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          <View>
            {/* Same first-render-paints-blank font bug as the Friends heading below — see its
             * comment for the full explanation. Same fix: remount once loading settles instead
             * of a props-update on the same instance. */}
            <ListHeading
              key={isBadgesLoading ? "achievements-pending" : "achievements-loaded"}
              title="Achievements"
              titleSize="text-lg"
              link="/profile/achievements"
              actionText="View all"
              actionTextSize="text-xs"
              lucideIcon={Trophy}
              iconColor="#FF8A2A"
              iconSize={16}
              iconStroke={2.2}
            />

            {isBadgesLoading ? (
              // Same 2x2 grid shape as the loaded state below — a spinner here instead would
              // be much shorter, so the page reflows once badges arrive and shoves everything
              // below (the Friends heading included) out of view without any scroll happening.
              <View className="flex-row flex-wrap justify-between">
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    className="mb-3 w-[48%] rounded-2xl border border-white/10 bg-white/5 p-3"
                    style={{ opacity: 0.5 }}
                  >
                    <View className="h-6 w-6 rounded-md bg-white/10" />
                    <View className="mt-2 h-3.5 w-3/4 rounded bg-white/10" />
                    <View className="mt-1.5 h-3 w-full rounded bg-white/10" />
                  </View>
                ))}
              </View>
            ) : isBadgesError ? (
              <InlineRetry message="Couldn't load achievements." onRetry={() => refetchBadges()} />
            ) : recentBadges.length === 0 ? (
              <Text className="py-2 text-sm text-white/40">
                Play a game to earn your first badge.
              </Text>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {recentBadges.map((eb) => (
                  <View
                    key={eb.id}
                    className="mb-3 w-[48%] rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <Text className="text-2xl">{eb.badge.icon}</Text>
                    <Text className="mt-1 text-sm font-sans-semibold text-white">
                      {eb.badge.name}
                    </Text>
                    <Text className="text-xs text-white/40" numberOfLines={2}>
                      {eb.badge.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View>
            {/* `key` forces a fresh mount once the real count lands (rather than a props-update
             * on the loading-state instance) — a Text using the custom sg-bold font was
             * reproducibly painting blank on its very first render whenever that first render
             * happened well after app startup (e.g. switching to this tab), self-healing on any
             * later re-render. Remounting sidesteps whatever stale-layout state causes that. */}
            <ListHeading
              key={friendsCount === undefined ? "friends-pending" : "friends-loaded"}
              title={friendsCount === undefined ? "Friends" : `Friends · ${friendsCount}`}
              titleSize="text-lg"
              link="/profile/friends"
              actionText="Manage"
              actionTextSize="text-xs"
              lucideIcon={Trophy}
              iconColor="#ffffff"
              iconSize={16}
              iconStroke={2.2}
            />

            {isFriendsLoading ? (
              <ActivityIndicator color="#B03BFF" style={{ marginVertical: 16 }} />
            ) : isFriendsError ? (
              <InlineRetry message="Couldn't load friends." onRetry={() => refetchFriends()} />
            ) : recentFriends.length === 0 ? (
              <Text className="py-2 text-sm text-white/40">
                No friends yet — invite someone to your next party.
              </Text>
            ) : (
              <View className="gap-2">
                {recentFriends.map((f) => (
                  <View
                    key={f.friendship_id}
                    className="flex-row items-center gap-3 rounded-2xl p-3 border-white/10 bg-white/5"
                  >
                    <Avatar
                      avatarUrl={f.friend.avatar_url}
                      initials={initialsFromName(f.friend.display_name || f.friend.username)}
                      size={44}
                    />

                    <View className="flex-1">
                      <Text className="text-white text-sm font-semibold">
                        {f.friend.display_name || f.friend.username}
                      </Text>
                      <Text className="text-white/40 text-[11px]">@{f.friend.username}</Text>
                    </View>

                    <Link href="/play/invite" asChild>
                      <TouchableOpacity activeOpacity={0.85}>
                        <LinearGradient
                          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          className="rounded-full px-3 py-1.5"
                        >
                          <Text className="text-white text-xs font-semibold">Invite</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </Link>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Settings rows ── */}
          <View
            className="mt-7 rounded-3xl overflow-hidden border border-white/10 bg-white/10"
          >
            {SETTINGS_ROWS.map((r, i) => (
              <Link key={r.label} href={r.to as any} asChild>
                <TouchableOpacity
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 p-4"
                  style={
                    i > 0
                      ? { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }
                      : undefined
                  }
                >
                  <r.Icon color="#fff" size={20} strokeWidth={2} />
                  <View className="flex-1">
                    <Text className="text-white text-sm font-semibold">{r.label}</Text>
                    <Text className="text-white/40 text-xs">{r.sub}</Text>
                  </View>
                  <ChevronRight color="rgba(255,255,255,0.40)" size={16} strokeWidth={2} />
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ProfileScreen