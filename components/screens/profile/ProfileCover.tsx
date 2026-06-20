import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Settings, Share2 } from "lucide-react-native";
import { styled } from "nativewind";
import { Text, TouchableOpacity, View } from "react-native";

const LinearGradient = styled(RNLinearGradient);

export default function ProfileCover({ displayName, initials }: { displayName: string; initials: string }) {
  return (
    <>
      <View className="h-40 rounded-3xl overflow-hidden">
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1"
        />
        <Link href="/profile/settings" asChild>
          <TouchableOpacity
            activeOpacity={0.8}
            className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-background/50"
          >
            <Settings color="#fff" size={16} strokeWidth={2} />
          </TouchableOpacity>
        </Link>
      </View>

      <View
        className="flex-row items-end justify-between px-1"
        style={{ marginTop: -56 }}
      >
        <View style={{ position: "relative" }}>
          <View
            className="rounded-full bg-background p-1.5"
          >
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF"]}
              className="h-24 w-24 items-center justify-center rounded-full"
            >
              <Text className="text-white text-5xl font-sans-extrabold">{initials}</Text>
            </LinearGradient>
          </View>
          <View className="absolute bottom-1.5 right-1.5 h-5 w-5 items-center justify-center rounded-full border-[3px] border-background bg-accent">
            <View className="h-2 w-2 rounded-full bg-white" />
          </View>
        </View>

        <View className="flex-row items-center gap-2" style={{ marginBottom: 4 }}>
          <Link href="/profile/referrals" asChild>
            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-row items-center gap-1.5 px-4 h-10 border border-white/10 bg-white/10 rounded-full"
            >
              <Share2 color="#fff" size={14} strokeWidth={2} />
              <Text className="text-white text-xs font-sans-semibold">Share</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/profile/edit" asChild>
            <TouchableOpacity activeOpacity={0.85}>
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-10 rounded-full px-4 items-center justify-center"
              >
                <Text className="text-white text-xs font-sans-semibold">Edit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
      <View className="mt-4">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-white text-2xl font-bold leading-tight">{displayName}</Text>
          <LinearGradient
            colors={["#FFD66B", "#FF8A2A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-full px-2 py-0.5"
          >
            <Text className="text-xs font-extrabold text-background">
              LVL 24
            </Text>
          </LinearGradient>
        </View>
        <Text className="mt-0.5 text-white/50 text-sm">
          @alex · Tokyo · joined Mar 2026
        </Text>
        <Text className="mt-2 text-white text-sm leading-relaxed">
          Designer by day, dare-survivor by night.{" "}
          <Text className="text-violet font-semibold">#partytype</Text>
        </Text>
      </View>
    </>
  );
}