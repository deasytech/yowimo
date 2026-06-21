import GoBack from "@/components/shared/GoBack";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Href, router } from "expo-router";
import { Globe, Tv, Users } from "lucide-react-native";
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

const types = [
  {
    id: "in-person",
    title: "In-Person",
    emoji: "🏠",
    desc: "Pass the phone, cast to TV, get loud.",
    perks: ["TV Casting", "Pass & Play", "Team Setup"],
    colors: ["#FF8A2A", "#D84CFF"] as const,
    icon: Users,
    route: "/play/in-person",
  },
  {
    id: "online",
    title: "Online",
    emoji: "🌐",
    desc: "Video chat, voice, full multiplayer.",
    perks: ["Video Room", "Spectators", "Global"],
    colors: ["#7A1EFF", "#D84CFF"] as const,
    icon: Globe,
    route: "/lobby/p1",
  },
  {
    id: "hybrid",
    title: "Hybrid",
    emoji: "🎛️",
    desc: "Some in the room, some on video.",
    perks: ["TV + Video", "Mixed Teams", "Cross-Play"],
    colors: ["#2D2A8F", "#B03BFF"] as const,
    icon: Tv,
    route: "/play/hybrid",
  },
];

export default function SelectPartyType() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Where's the party?" />

        <Text className="mt-3 text-sm text-muted-foreground">
          Pick how your crew will play tonight.
        </Text>
        {/* Party Types */}
        <View className="mt-6 gap-4">
          {types.map((type) => {
            const Icon = type.icon;
            return (
              <TouchableOpacity
                key={type.id}
                activeOpacity={0.9}
                onPress={() =>
                  router.push(type.route as Href)
                }
              >
                <LinearGradient
                  colors={type.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="overflow-hidden rounded-3xl p-5"
                >
                  {/* Glow */}
                  <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                  <View className="flex-row items-start">
                    {/* Icon Card */}
                    <View className="h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/15">
                      <Text className="text-3xl">
                        {type.emoji}
                      </Text>
                    </View>
                    {/* Content */}
                    <View className="ml-4 flex-1">
                      <View className="flex-row items-center">
                        <Icon
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text className="ml-2 font-sg-bold text-xl text-white">
                          {type.title}
                        </Text>
                      </View>
                      <Text className="mt-1 text-sm text-white/85">
                        {type.desc}
                      </Text>
                      <View className="mt-3 flex-row flex-wrap gap-2">
                        {type.perks.map((perk) => (
                          <View
                            key={perk}
                            className="rounded-full bg-black/20 px-3 py-1"
                          >
                            <Text className="text-[10px] font-sans-semibold text-white">
                              {perk}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
