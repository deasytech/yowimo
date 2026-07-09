import GoBack from "@/components/shared/GoBack";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import {
  Mic,
  Pause,
  Sparkles,
  Volume2
} from "lucide-react-native";
import { styled } from "nativewind";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView as RNSafeAreaView,
} from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

export default function AIHost() {
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "bottom"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="AI Host • LIVE" />

        <View className="flex-1 items-center justify-center pt-6">
          <View className="relative items-center justify-center">
            {/* Glow */}

            <View className="absolute h-80 w-80 rounded-full bg-violet/20" />

            <LinearGradient
              colors={[
                "#7A1EFF",
                "#D84CFF",
                "#FF8A2A",
              ]}
              className="h-56 w-56 items-center justify-center rounded-full"
            >
              <View className="absolute h-48 w-48 rounded-full border-2 border-white/30" />

              <View className="absolute h-36 w-36 rounded-full border border-white/20" />

              <Sparkles
                size={64}
                color="#FFFFFF"
              />
            </LinearGradient>
          </View>

          {/* Speech */}

          <Text className="mt-10 text-center font-sg-extrabold text-3xl text-white">
            {"Alright Alex..."}
          </Text>

          <Text className="mt-2 px-8 text-center text-sm leading-6 text-muted-foreground">
            Yowi is reading your next card aloud.
            Tap below to interrupt, skip or
            change the challenge.
          </Text>

          {/* Voice Bars */}

          <View className="mt-10 h-14 flex-row items-end justify-center">
            {[
              18, 28, 40, 22, 52, 32, 44, 26,
              58, 36, 22, 48, 30, 56, 34, 42,
              26, 50, 32, 46,
            ].map((height, index) => (
              <View
                key={index}
                className="mx-0.5 w-1.5 rounded-full bg-violet-bright"
                style={{
                  height,
                }}
              />
            ))}
          </View>
        </View>

        {/* Controls */}

        <View className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-4">
          <View className="flex-row items-center justify-around">
            <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <Mic
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9}>
              <LinearGradient
                colors={[
                  "#7A1EFF",
                  "#D84CFF",
                  "#FF8A2A",
                ]}
                className="h-14 w-14 items-center justify-center rounded-2xl"
              >
                <Pause
                  size={26}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <Volume2
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}

        <View className="mt-5 flex-row flex-wrap justify-center gap-2">
          {[
            "Skip Card",
            "Easier",
            "Spicier",
            "Translate",
          ].map((item) => (
            <TouchableOpacity
              key={item}
              className="rounded-full border border-white/10 bg-secondary px-4 py-2"
            >
              <Text className="text-xs font-sans-medium text-white">
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}