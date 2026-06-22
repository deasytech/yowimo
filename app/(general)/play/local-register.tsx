import GoBack from "@/components/shared/GoBack";
import { usePlayers } from "@/context/PlayersContext";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowRight
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

const SafeAreaView = styled(RNSafeAreaView);

const LinearGradient = styled(RNLinearGradient);

export default function LocalRegisterScreen() {
  const { players: contextPlayers, setPlayers: setContextPlayers } = usePlayers();

  const emojis = [
    "🎯",
    "🦊",
    "🐉",
    "🦄",
    "🐼",
    "🦋",
    "🐯",
    "🐸",
    "👻",
    "🦁",
  ];

  const gradients = [
    ["#7A1EFF", "#D84CFF"],
    ["#D84CFF", "#FF8A2A"],
    ["#FF8A2A", "#B03BFF"],
    ["#2D2A8F", "#7A1EFF"],
    ["#B03BFF", "#D84CFF"],
  ];

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(emojis[0]);

  const addPlayer = () => {
    if (!name.trim()) return;

    setContextPlayers([
      ...contextPlayers,
      {
        name: name.trim(),
        emoji,
      },
    ]);

    setName("");
    setEmoji(
      emojis[
      (contextPlayers.length + 1) % emojis.length
      ]
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
        <GoBack title="Pass & Register" rightText={contextPlayers.length + " Added"} />
        {/* Registration Card */}
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mt-5 rounded-3xl p-6"
        >
          <Text className="text-center text-xs font-sans-semibold uppercase tracking-wider text-white/80">
            Player {contextPlayers.length + 1}
          </Text>
          {/* Selected Avatar */}
          <View className="mx-auto mt-4 h-24 w-24 items-center justify-center rounded-3xl bg-white/20">
            <Text className="text-5xl">
              {emoji}
            </Text>
          </View>
          {/* Emoji Picker */}
          <View className="mt-4 flex-row flex-wrap justify-center">
            {emojis.map((item) => (
              <TouchableOpacity
                key={item}
                activeOpacity={0.9}
                onPress={() => setEmoji(item)}
                className={`m-1 h-10 w-10 items-center justify-center rounded-xl ${emoji === item
                  ? "bg-white"
                  : "bg-white/15"
                  }`}
              >
                <Text
                  className={`text-xl ${emoji === item
                    ? "text-background"
                    : ""
                    }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Name Input */}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{ textAlign: "center" }}
            className="mt-4 h-12 rounded-2xl bg-white/15 px-4 text-base font-sans-semibold text-white"
          />
          {/* Add Player */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={addPlayer}
            className="mt-4 self-center"
          >
            <View className="flex-row items-center rounded-2xl bg-white px-5 py-3">
              <Text className="font-sans-semibold text-sm text-background">
                Next Player
              </Text>
              <ArrowRight
                size={16}
                color="#0D0D12"
                style={{ marginLeft: 8 }}
              />
            </View>
          </TouchableOpacity>
        </LinearGradient>
        {/* Registered Players */}
        <View className="mt-6">
          <Text className="mb-3 font-sg-bold text-sm text-white">
            Registered Crew
          </Text>
          {contextPlayers.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              Pass the phone around — add everyone.
            </Text>
          ) : (
            <View className="flex-row flex-wrap">
              {contextPlayers.map((player, index) => (
                <View
                  key={index}
                  className="mb-4 mr-3 w-20 items-center"
                >
                  <LinearGradient
                    colors={
                      gradients[
                      index % gradients.length
                      ] as [string, string]
                    }
                    className="h-14 w-14 items-center justify-center rounded-2xl"
                  >
                    <Text className="text-2xl">
                      {player.emoji}
                    </Text>
                  </LinearGradient>

                  <Text
                    numberOfLines={1}
                    className="mt-1 text-center text-xs font-sans-medium text-white"
                  >
                    {player.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/play/teams")}
          className="mt-6"
        >
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF"]}
            className="h-14 items-center justify-center rounded-2xl"
          >
            <Text className="font-sans-bold text-base text-white">
              Continue → Teams
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
