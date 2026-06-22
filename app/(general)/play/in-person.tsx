import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Tv,
  UserPlus,
  X,
} from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const colors = [
  ["#7A1EFF", "#D84CFF"],
  ["#D84CFF", "#FF8A2A"],
  ["#FF8A2A", "#B03BFF"],
  ["#2D2A8F", "#7A1EFF"],
  ["#B03BFF", "#D84CFF"],
];

export default function InPersonScreen() {
  const [players, setPlayers] = useState([
    "Alex",
    "Maya",
    "Leo",
    "Sam",
  ]);

  const [name, setName] = useState("");

  const addPlayer = () => {
    if (!name.trim()) return;

    setPlayers((prev) => [...prev, name.trim()]);
    setName("");
  };

  const removePlayer = (index: number) => {
    setPlayers((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

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
        {/* Header */}
        <View className="flex-row items-center justify-between">
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
            In-Person Setup
          </Text>
          <View className="w-10" />
        </View>
        {/* TV Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/play/connect-tv")}
          className="mt-4"
        >
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="overflow-hidden rounded-3xl p-5"
          >
            <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-sans-semibold uppercase tracking-wider text-white/80">
                  Cast To TV
                </Text>
                <Text className="mt-1 font-sg-bold text-xl text-white">
                  Connect a Big Screen
                </Text>
              </View>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <Tv
                  size={24}
                  color="#FFFFFF"
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        {/* Players */}
        <View className="mt-5 rounded-3xl border border-white/10 bg-card p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-sg-bold text-base text-white">
              Players In The Room
            </Text>
            <Text className="text-xs text-muted-foreground">
              {players.length}
            </Text>
          </View>
          <View className="flex-row">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Add player name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="h-11 flex-1 rounded-2xl border border-white/10 bg-secondary px-4 text-white"
            />
            <TouchableOpacity
              onPress={addPlayer}
              className="ml-2"
            >
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF"]}
                className="h-11 w-11 items-center justify-center rounded-2xl"
              >
                <Plus
                  size={18}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View className="mt-4 flex-row flex-wrap">
            {players.map((player, index) => (
              <LinearGradient
                key={`${player}-${index}`}
                colors={
                  colors[index % colors.length] as [
                    string,
                    string
                  ]
                }
                className="mb-2 mr-2 flex-row items-center rounded-full pl-1 pr-3 py-1"
              >
                <View className="h-7 w-7 items-center justify-center rounded-full bg-black/30">
                  <Text className="text-xs font-bold text-white">
                    {player[0]}
                  </Text>
                </View>
                <Text className="mx-2 text-sm font-medium text-white">
                  {player}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    removePlayer(index)
                  }
                >
                  <X
                    size={14}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </LinearGradient>
            ))}
          </View>
        </View>
        {/* Pass & Register */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push("/play/local-register")
          }
          className="mt-4 flex-row items-center justify-between rounded-3xl border border-white/10 bg-card p-4"
        >
          <View className="flex-row items-center">
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF"]}
              className="h-11 w-11 items-center justify-center rounded-2xl"
            >
              <UserPlus
                size={20}
                color="#FFFFFF"
              />
            </LinearGradient>
            <View className="ml-3">
              <Text className="text-sm font-sans-semibold text-white">
                Pass & Register
              </Text>
              <Text className="text-xs text-muted-foreground">
                Each player adds their own profile
              </Text>
            </View>
          </View>
          <Text className="text-lg text-muted-foreground">
            ›
          </Text>
        </TouchableOpacity>
        {/* Teams */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push({
              pathname: "/play/teams",
              params: { players: JSON.stringify(players) },
            })
          }
          className="mt-3 flex-row items-center justify-between rounded-3xl border border-white/10 bg-card p-4"
        >
          <View className="flex-row items-center">
            <LinearGradient
              colors={["#D84CFF", "#FF8A2A"]}
              className="h-11 w-11 items-center justify-center rounded-2xl"
            >
              <Text className="text-lg">
                🎯
              </Text>
            </LinearGradient>
            <View className="ml-3">
              <Text className="text-sm font-sans-semibold text-white">
                Set Up Teams
              </Text>
              <Text className="text-xs text-muted-foreground">
                Optional • Drag To Assign
              </Text>
            </View>
          </View>
          <Text className="text-lg text-muted-foreground">
            ›
          </Text>
        </TouchableOpacity>
        {/* CTA */}
      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push({
              pathname: "/play/seating",
              params: { players: JSON.stringify(players) },
            })
          }
          className="mt-6"
        >
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF"]}
            className="h-14 items-center justify-center rounded-2xl"
          >
            <Text className="font-sans-bold text-base text-white">
              Continue • {players.length} Players
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}