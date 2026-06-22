import ProfileCover from "@/components/screens/profile/ProfileCover";
import ListHeading from "@/components/shared/ListHeading";
import { FRIENDS } from "@/data/mock";
import { getInitials } from "@/lib/utils";
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
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const ACHIEVEMENTS = [
  { emoji: "🔥", label: "Fire Streak", desc: "5 nights in a row" },
  { emoji: "👑", label: "Triple MVP", desc: "Won 3 MVPs" },
  { emoji: "🎴", label: "Deck Master", desc: "Played all 15 games" },
  { emoji: "🌟", label: "Influencer", desc: "5 friends joined via you" },
];

const STATS = [
  { label: "Parties", value: 47 },
  { label: "MVPs", value: 12 },
  { label: "Friends", value: 86 },
  { label: "Streak", value: "5d" },
];

const SETTINGS_ROWS = [
  { Icon: Award, label: "Referral center", sub: "Earn 50 tokens per friend", to: "/profile/referrals" },
  { Icon: Trophy, label: "Achievements", sub: "Badges, streaks, MVPs", to: "/profile/achievements" },
  { Icon: Settings, label: "Settings", sub: "Privacy, notifications, more", to: "/profile/settings" },
  { Icon: Trophy, label: "Help center", sub: "Get answers fast", to: "/profile/help" },
];

const ProfileScreen = () => {
  const { user } = useUser();

  const initials = getInitials(user);

  const displayName = user?.fullName || user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User';

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100, gap: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-14">
          <ProfileCover displayName={displayName} initials={initials} />

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
            <ListHeading
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

            <View className="flex-row flex-wrap justify-between">
              {ACHIEVEMENTS.map((a) => (
                <View
                  key={a.label}
                  className="mb-3 w-[48%] rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <Text className="text-2xl">{a.emoji}</Text>
                  <Text className="mt-1 text-sm font-sans-semibold text-white">
                    {a.label}
                  </Text>
                  <Text className="text-xs text-white/40">
                    {a.desc}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View>
            <ListHeading
              title={`Friends · ${FRIENDS.length}`}
              titleSize="text-lg"
              link="/profile/friends"
              actionText="Manage"
              actionTextSize="text-xs"
              lucideIcon={Trophy}
              iconColor="#ffffff"
              iconSize={16}
              iconStroke={2.2}
            />

            <View className="gap-2">
              {FRIENDS.slice(0, 4).map((f) => (
                <View
                  key={f.id}
                  className="flex-row items-center gap-3 rounded-2xl p-3 border-white/10 bg-white/5"
                >
                  <View style={{ position: "relative" }}>
                    <LinearGradient
                      colors={["#7A1EFF", "#D84CFF"]}
                      className="w-11 h-11 rounded-3xl items-center justify-center"
                    >
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
                        {f.initials}
                      </Text>
                    </LinearGradient>
                    {f.online && (
                      <View
                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-accent"
                      />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-white text-sm font-semibold">{f.name}</Text>
                    <Text className="text-white/40 text-[11px]">
                      {f.inParty ? `In · ${f.inParty}` : f.online ? "Online" : "Offline"}
                    </Text>
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