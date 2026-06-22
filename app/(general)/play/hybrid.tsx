import GoBack from "@/components/shared/GoBack";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Globe,
  Tv,
  UserPlus
} from "lucide-react-native";
import { styled } from "nativewind";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

export default function HybridScreen() {
  const local = ["Alex", "Maya", "Leo"];
  const remote = ["Sam", "Priya", "Jordan", "Aiden"];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Hybrid Party" />
        <Text className="mt-3 text-sm leading-6 text-muted-foreground">
          Some friends in the room, others on video.
          Yowimo blends them seamlessly.
        </Text>
        {/* Stats */}
        <View className="mt-5 flex-row justify-between">
          <LinearGradient
            colors={["#FF8A2A", "#D84CFF"]}
            className="w-[48%] rounded-3xl p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Tv
                size={20}
                color="#FFFFFF"
              />
            </View>
            <Text className="mt-3 font-sg-extrabold text-3xl text-white">
              {local.length}
            </Text>
            <Text className="text-[11px] uppercase tracking-wider text-white/80">
              In The Room
            </Text>
          </LinearGradient>
          <LinearGradient
            colors={["#7A1EFF", "#B03BFF"]}
            className="w-[48%] rounded-3xl p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Globe
                size={20}
                color="#FFFFFF"
              />
            </View>
            <Text className="mt-3 font-sg-extrabold text-3xl text-white">
              {remote.length}
            </Text>
            <Text className="text-[11px] uppercase tracking-wider text-white/80">
              Remote
            </Text>
          </LinearGradient>
        </View>
        {/* Local Players */}
        <View className="mt-5 rounded-3xl border border-white/10 bg-card p-5">
          <Text className="mb-3 font-sg-bold text-sm text-white">
            🏠 In-Room Players
          </Text>
          <View className="flex-row flex-wrap">
            {local.map((player, index) => (
              <View
                key={index}
                className="mb-2 mr-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1"
              >
                <Text className="text-xs font-sans-medium text-white">
                  {player}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              onPress={() =>
                router.push("/play/local-register")
              }
              className="mb-2 mr-2 flex-row items-center rounded-full bg-secondary px-3 py-1"
            >
              <UserPlus
                size={12}
                color="#FFFFFF"
              />
              <Text className="ml-1 text-xs font-sans-medium text-white">
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Remote Players */}
        <View className="mt-3 rounded-3xl border border-white/10 bg-card p-5">
          <Text className="mb-3 font-sg-bold text-sm text-white">
            🌐 Remote Players
          </Text>
          <View className="flex-row flex-wrap">
            {remote.map((player, index) => (
              <View
                key={index}
                className="mb-2 mr-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1"
              >
                <Text className="text-xs font-sans-medium text-white">
                  {player}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              onPress={() =>
                router.push("/play/invite")
              }
              className="mb-2 mr-2 flex-row items-center rounded-full bg-secondary px-3 py-1"
            >
              <UserPlus
                size={12}
                color="#FFFFFF"
              />
              <Text className="ml-1 text-xs font-sans-medium text-white">
                Invite
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* TV Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push("/play/connect-tv")
          }
          className="mt-4 flex-row items-center justify-between rounded-3xl border border-white/10 bg-card p-4"
        >
          <View className="flex-row items-center">
            <LinearGradient
              colors={["#D84CFF", "#FF8A2A"]}
              className="h-11 w-11 items-center justify-center rounded-2xl"
            >
              <Tv
                size={20}
                color="#FFFFFF"
              />
            </LinearGradient>
            <View className="ml-3">
              <Text className="text-sm font-sans-semibold text-white">
                Cast To TV
              </Text>
              <Text className="text-xs text-muted-foreground">
                Share board with everyone
              </Text>
            </View>
          </View>
          <Text className="text-lg text-muted-foreground">
            ›
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push("/lobby/p1")
          }
          className="mt-6"
        >
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF"]}
            className="h-14 items-center justify-center rounded-2xl"
          >
            <Text className="font-sans-bold text-base text-white">
              Go To Lobby
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}