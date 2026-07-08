import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  Users,
} from "lucide-react-native";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const sponsored = [
  { id: 1, name: "Maya R.", spent: 35, status: "Active" },
  { id: 2, name: "Leo P.", spent: 25, status: "Active" },
  { id: 3, name: "Sam W.", spent: 15, status: "Pending" },
  { id: 4, name: "Priya N.", spent: 50, status: "Complete" },
];

export default function SponsorManagement() {
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View className="flex-row items-center justify-between py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
          >
            <ArrowLeft
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text className="font-sg-bold text-lg text-white">
            Sponsor Center
          </Text>

          <View className="w-10" />
        </View>

        {/* Hero */}

        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          className="mt-2 overflow-hidden rounded-3xl p-5"
        >
          <View className="flex-row items-center">
            <Building2
              size={18}
              color="#FFFFFF"
            />

            <Text className="ml-2 text-xs font-sans-semibold uppercase tracking-widest text-white/80">
              Sponsoring As
            </Text>
          </View>

          <Text className="mt-2 font-sg-extrabold text-3xl text-white">
            Acme Co.
          </Text>

          <View className="mt-5 flex-row justify-between">
            {/* Players */}

            <View className="w-[31%] rounded-2xl border border-white/15 bg-white/10 p-3">
              <Users
                size={18}
                color="#FFFFFF"
              />

              <Text className="mt-2 font-sg-extrabold text-2xl text-white">
                22
              </Text>

              <Text className="text-[10px] uppercase tracking-wider text-white/70">
                Players
              </Text>
            </View>

            {/* Parties */}

            <View className="w-[31%] rounded-2xl border border-white/15 bg-white/10 p-3">
              <TrendingUp
                size={18}
                color="#FFFFFF"
              />

              <Text className="mt-2 font-sg-extrabold text-2xl text-white">
                3
              </Text>

              <Text className="text-[10px] uppercase tracking-wider text-white/70">
                Parties
              </Text>
            </View>

            {/* Tokens */}

            <View className="w-[31%] rounded-2xl border border-white/15 bg-white/10 p-3">
              <Text className="text-lg">
                🪙
              </Text>

              <Text className="mt-2 font-sg-extrabold text-2xl text-white">
                1.2K
              </Text>

              <Text className="text-[10px] uppercase tracking-wider text-white/70">
                Spent
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Covered Players */}

        <View className="mt-6">
          <Text className="mb-3 font-sg-bold text-lg text-white">
            Covered Players
          </Text>

          {sponsored.map((player) => (
            <View
              key={player.id}
              className="mb-3 flex-row items-center rounded-2xl border border-white/10 bg-card p-3"
            >
              {/* Avatar */}

              <LinearGradient
                colors={["#7A1EFF", "#D84CFF"]}
                className="h-11 w-11 items-center justify-center rounded-full"
              >
                <Text className="font-sans-bold text-white">
                  {player.name[0]}
                </Text>
              </LinearGradient>

              {/* Info */}

              <View className="ml-3 flex-1">
                <Text className="font-sans-semibold text-sm text-white">
                  {player.name}
                </Text>

                <Text className="mt-1 text-xs text-muted-foreground">
                  {player.spent} 🪙 spent on this
                  player
                </Text>
              </View>

              {/* Status */}

              <View
                className={`rounded-full px-3 py-1 ${player.status === "Active"
                  ? "bg-emerald-500/20"
                  : player.status === "Pending"
                    ? "bg-accent/20"
                    : "bg-white/10"
                  }`}
              >
                <Text
                  className={`text-[10px] font-sans-semibold ${player.status === "Active"
                    ? "text-emerald-400"
                    : player.status === "Pending"
                      ? "text-accent"
                      : "text-muted-foreground"
                    }`}
                >
                  {player.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Button */}

        <TouchableOpacity
          activeOpacity={0.9}
          className="mt-6"
          onPress={() =>
            router.push("/wallet/buy-token")
          }
        >
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF"]}
            className="items-center rounded-2xl py-4"
          >
            <Text className="font-sans-bold text-base text-white">
              Top Up Sponsorship
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}