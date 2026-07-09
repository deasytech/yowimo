import { FRIENDS } from "@/data/mock";
import { router } from "expo-router";
import {
  ArrowLeft,
  Send,
  Smile,
} from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView as RNSafeAreaView,
} from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function WaitingRoom() {
  const [time, setTime] = useState(38);

  const [messages, setMessages] = useState([
    {
      id: 1,
      who: "Maya",
      text: "Y'all ready for chaos?",
      colors: ["#7A1EFF", "#D84CFF"],
    },
    {
      id: 2,
      who: "Leo",
      text: "Let's GO 🚀",
      colors: ["#D84CFF", "#FF8A2A"],
    },
    {
      id: 3,
      who: "Sam",
      text: "Setting up drinks 🥤",
      colors: ["#FF8A2A", "#7A1EFF"],
    },
  ]);

  const [draft, setDraft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((v) => {
        if (v <= 1) {
          clearInterval(timer);
          return 0;
        }
        return v - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const sendMessage = () => {
    if (!draft.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        who: "You",
        text: draft,
        colors: ["#FF8A2A", "#D84CFF"],
      },
    ]);

    setDraft("");
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "bottom"]}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 30,
        }}
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

          <View className="items-center">
            <Text className="text-xs text-muted-foreground">
              Starting in
            </Text>

            <Text className="font-sg-extrabold text-3xl text-violet-bright">
              00:{String(time).padStart(2, "0")}
            </Text>
          </View>

          <View className="w-10" />
        </View>

        {/* Party */}

        <View className="mt-3 rounded-3xl border border-white/10 bg-card p-5">
          <Text className="text-xs uppercase tracking-widest text-muted-foreground">
            Tonight
          </Text>

          <Text className="mt-1 font-sg-bold text-2xl text-white">
            Friday Night Chaos
          </Text>

          <Text className="mt-1 text-sm text-muted-foreground">
            Truth or Dare • 12 max
          </Text>
        </View>

        {/* Players */}

        <View className="mt-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-sg-semibold text-lg text-white">
              Players in room
            </Text>

            <Text className="text-xs text-muted-foreground">
              {FRIENDS.length}/12
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {FRIENDS.map((friend, index) => (
              <View
                key={friend.id}
                className="w-16 items-center"
              >
                <View className="relative">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
                    <Text className="font-sg-bold text-white">
                      {friend.initials}
                    </Text>
                  </View>

                  {index < 3 && (
                    <View className="absolute -bottom-1 right-0 rounded-full bg-green-500 px-1.5 py-0.5">
                      <Text className="text-[8px] font-sg-bold text-white">
                        READY
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  numberOfLines={1}
                  className="mt-2 text-[10px] text-white"
                >
                  {friend.name.split(" ")[0]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Chat */}

        <View className="mt-6 rounded-3xl border border-white/10 bg-card p-4">
          <Text className="mb-3 font-sg-semibold text-lg text-white">
            Mini Chat
          </Text>

          {messages.map((message) => (
            <View
              key={message.id}
              className="mb-3 flex-row items-start"
            >
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Text className="text-xs font-sg-bold text-white">
                  {message.who[0]}
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-secondary p-3">
                <Text className="text-xs font-sg-semibold text-muted-foreground">
                  {message.who}
                </Text>

                <Text className="mt-1 text-white">
                  {message.text}
                </Text>
              </View>
            </View>
          ))}

          {/* Composer */}

          <View className="mt-4 flex-row items-center">
            <TouchableOpacity className="mr-2 h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-secondary">
              <Smile
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Say something..."
              placeholderTextColor="#8A8A8A"
              className="flex-1 rounded-full bg-secondary px-4 py-3 text-white"
            />

            <TouchableOpacity
              onPress={sendMessage}
              className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-primary"
            >
              <Send
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3">
        <TouchableOpacity
          onPress={() => router.push("/play/game")}
          activeOpacity={0.9}
          className="mt-6 h-14 items-center justify-center rounded-2xl bg-primary"
        >
          <Text className="font-sg-semibold text-base text-white">
            {"I'm Ready 🔥"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}